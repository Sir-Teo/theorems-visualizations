// Durrett, Probability: Theory and Examples (5th ed.) — Chapter 1: Measure Theory (part B: §1.2 second half, §1.3)

// ---------- helpers ----------
const ATOMS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'gray'];
const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
/** Cantor sample from fair bits: X = Σ 2ξ_i 3^{-i}; returns [x, bits]. */
function cantorSample(r, depth = 32) { let x = 0, p = 1; const bits = []; for (let i = 0; i < depth; i++) { p /= 3; const b = r() < 0.5 ? 0 : 1; bits.push(b); x += 2 * b * p; } return [x, bits]; }
/** Piecewise linear approximant F_n of the Cantor function (F_0(x) = x). */
function cantorN(x, n) { if (x <= 0) return 0; if (x >= 1) return 1; let y = 0, sc = 0.5; for (let i = 0; i < n; i++) { x *= 3; if (x >= 1 && x < 2) return y + sc; if (x >= 2) { y += sc; x -= 2; } sc /= 2; } return y + 2 * sc * x; }
/** Intervals of [lo, hi] where pred holds: grid scan plus bisection of every change. */
function preimage(pred, lo = 0, hi = 1, N = 1000) {
  const w = (i) => lo + ((i + 0.5) * (hi - lo)) / N;
  const edge = (a, b) => { const ia = pred(a); for (let k = 0; k < 42; k++) { const m = (a + b) / 2; if (pred(m) === ia) a = m; else b = m; } return (a + b) / 2; };
  const out = []; let st = pred(w(0)) ? lo : null, p = st !== null;
  for (let i = 1; i < N; i++) { const c = pred(w(i)); if (c !== p) { const e = edge(w(i - 1), w(i)); if (c) st = e; else out.push([st, e]); p = c; } }
  if (p) out.push([st, hi]);
  return out;
}
const lenOf = (P) => P.reduce((t, [a, b]) => t + b - a, 0);
const inList = (P, y) => P.some(([a, b]) => y > a && y <= b);

export default {
  collection: 'prob',
  chapter: 1,
  items: [
    {
      num: '1.2.2a',
      kind: 'Definition',
      name: 'Density function',
      statement: String.raw`A random variable $X$ has **density function** $f$ if its distribution function can be written
$$F(x)=P(X\le x)=\int_{-\infty}^x f(y)\,dy\qquad\text{for all }x.$$
A function $f$ defines a distribution function in this way if and only if $f\ge0$ and $\int f(x)\,dx=1$. Then $P(a<X\le b)=\int_a^bf(y)\,dy$, and $P(X=x)=\lim_{\eps\to0}\int_{x-\eps}^{x+\eps}f(y)\,dy=0$ for every $x$: the value $f(x)$ is a probability per unit length, not a probability. Example 1.2.3: the uniform distribution on $(0,1)$ has $f=1$ on $(0,1)$ and $f=0$ elsewhere.`,
      idea: String.raw`Integrating $f$ produces a continuous function that is nondecreasing exactly when $f\ge0$ (almost everywhere), with limit $0$ at $-\infty$ and $\int f$ at $+\infty$. So the conditions of Theorem 1.2.2 hold exactly when $f\ge0$ and $\int f=1$. The probability of an interval, $F(b)-F(a)=\int_a^bf$, is the area under the density over it, and shrinking the interval to a point makes the area vanish. As a heuristic, $f(x)\,dx\approx P(x\le X\le x+dx)$.`,
      caption: String.raw`Type any formula for $f$, or pick a preset. If its integral over $[-4,4]$ is not $1$ it is normalised, and it is flagged if it goes negative. Drag $a$ and $b$: the shaded area under the density equals the rise $F(b)-F(a)$ on the right. The 400 samples (dots), drawn by inverting $F$, land in $(a,b]$ in that proportion. Push $a$ and $b$ together and the probability goes to $0$, even where $f$ is large.`,
      deps: ['prob-1.2.1b'],
      verify: true,
      tags: ['distributions'],
      viz(v) {
        const PRE = [
          { value: 'bi', label: 'bimodal', f: 'exp(-(x+1.3)^2) + 0.6 exp(-3(x-1.2)^2)' },
          { value: 'tri', label: 'triangle', f: 'max(0, 1 - |x|/2)' },
          { value: 'cau', label: 'Cauchy-like', f: '1/(1 + 4x^2)' },
          { value: 'neg', label: 'goes negative', f: 'sin(2x) + 0.4' },
        ];
        v.select('preset', PRE.map(({ value, label }) => ({ value, label })), 'bi', { onChange: (k) => inp.set(PRE.find((p) => p.value === k).f) });
        const inp = v.input('$f(x)=$', PRE[0].f, { vars: ['x'], width: 330 });
        const sD = v.stage({ x: [-4, 4], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: '$x$', ylabel: 'density', weight: 1.4 });
        const sF = v.stage({ x: [-4, 4], y: [0, 1.04], height: 300, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$F(x)$', weight: 1, minWidth: 230 });
        let top = 1;
        const ha = sD.handle(-1.6, 0, { color: 'gold', r: 6, label: 'a', labelPos: 'w', constrain: (x) => [Math.min(x, hb.x - 0.002), -0.05 * top] });
        const hb = sD.handle(-0.6, 0, { color: 'gold', r: 6, label: 'b', labelPos: 'e', constrain: (x) => [Math.max(x, ha.x + 0.002), -0.05 * top] });
        const U = (() => { const r = v.rng(31); return Array.from({ length: 400 }, () => [r(), r()]); })();
        let cache = null;
        function model() {
          const f = inp.fn; const key = inp.value;
          if (cache && cache.key === key) return cache;
          const xs = v.M.linspace(-4, 4, 1601), raw = xs.map((x) => { const y = f ? f(x) : 0; return isFinite(y) ? y : 0; });
          const minv = Math.min(...raw), pos = raw.map((y) => Math.max(0, y));
          const smp = v.M.gridSampler(xs, pos), tot = smp.total;
          const samples = tot > 0 ? U.map(([u, j]) => [smp(u), j]) : [];
          cache = { key, xs, pos, tot, minv, smp, samples, max: Math.max(...pos) / (tot || 1) };
          return cache;
        }
        let info = {};
        v.render(() => {
          const Md = model(), a = ha.x, b = hb.x;
          if (!(Md.tot > 0)) { sD.corner('f is never positive: not a density', 'tl', { color: 'red', weight: 600 }); info = { bad: true }; return; }
          top = Md.max * 1.15; sD.setView(null, [-0.1 * top, top]); ha.y = hb.y = -0.05 * top;
          const fN = (x) => { if (x < -4 || x > 4) return 0; const i = Math.min(1599, Math.max(0, Math.floor((x + 4) * 200))), t = (x + 4) * 200 - i; return ((1 - t) * Md.pos[i] + t * Md.pos[i + 1]) / Md.tot; };
          sD.between(fN, () => 0, a, b, { fill: 'accent', fillAlpha: 0.35, n: 300 });
          sD.fn(fN, { color: 'ink', width: 2.2, n: 800 });
          if (Md.minv < -1e-9) sD.fn((x) => { const i = Math.round((x + 4) * 200); const y = cache.xs[i] !== undefined && inp.fn ? inp.fn(x) / Md.tot : 0; return y < 0 ? y : NaN; }, { color: 'red', width: 1.5, dash: [4, 3] });
          sD.line(-4, 0, 4, 0, { color: 'faint', width: 1 });
          const inn = [], out = [];
          Md.samples.forEach(([x, j]) => (x > a && x <= b ? inn : out).push([x, top * (0.02 + 0.1 * j)]));
          sD.dots(out, { r: 1.8, color: 'muted', alpha: 0.6 }); sD.dots(inn, { r: 2.4, color: 'gold' });
          const F = (x) => Md.smp.cdf(x), Fa = F(a), Fb = F(b);
          sF.vband(a, b, { color: 'accent', alpha: 0.12 });
          sF.fn(F, { color: 'ink', width: 2.4, n: 600 });
          sF.line(a, Fa, 4, Fa, { color: 'accent', width: 1, dash: [4, 3] }); sF.line(b, Fb, 4, Fb, { color: 'accent', width: 1, dash: [4, 3] });
          sF.measure(3.6, Fa, 3.6, Fb, null, { color: 'accent' });
          info = { a, b, area: Fb - Fa, k: inn.length, n: Md.samples.length, tot: Md.tot, minv: Md.minv, fa: fN(a), fb: fN(b) };
          v.legend([['ink', 'density $f$'], ['accent', '$P(a<X\\le b)$ as an area and as a rise', { area: true }], ['gold', 'samples in $(a,b]$', { dot: true }]]);
        });
        v.readout(() => {
          const I = info; if (I.bad) return 'This formula is never positive on $[-4,4]$, so it cannot be a density.';
          let t = '';
          if (I.minv < -1e-9) t += `$f$ takes negative values (down to $${v.fix(I.minv, 3)}$), so it is **not** a density; the picture uses $\\max(f,0)$. `;
          else if (Math.abs(I.tot - 1) > 1e-3) t += `$\\int_{-4}^4f=${v.fix(I.tot, 4)}$, so the density is $f/${v.fix(I.tot, 4)}$. `;
          return t + `$P(a<X\\le b)=\\int_a^bf=F(b)-F(a)=${v.fix(I.area, 4)}$; samples in $(a,b]$: $${I.k}/${I.n}=${v.fix(I.k / I.n, 3)}$. The width is $${v.fix(I.b - I.a, 3)}$, and as it shrinks the probability goes to $0$.`;
        });
      },
    },
    {
      num: '1.2.4',
      kind: 'Definition',
      name: 'Exponential distribution',
      statement: String.raw`The **exponential distribution with rate** $\lambda>0$ has density $f(x)=\lambda e^{-\lambda x}$ for $x\ge0$ and $f(x)=0$ for $x<0$. Its distribution function is $F(x)=1-e^{-\lambda x}$ for $x\ge0$ and $F(x)=0$ for $x\le0$, so the tail is $P(X>x)=e^{-\lambda x}$ and the mean is $1/\lambda$.`,
      idea: String.raw`The tail $e^{-\lambda x}$ turns sums into products, which is the **lack of memory**: $P(X>s+t\mid X>s)=e^{-\lambda(s+t)}/e^{-\lambda s}=P(X>t)$. Given that it has survived to age $s$, an exponential lifetime starts afresh. Conversely, a tail $G$ with $G(s+t)=G(s)G(t)$ that is monotone must be $e^{-\lambda t}$, so the exponential is the only law on $(0,\infty)$ with this property. That is why it governs waiting times in Poisson processes and Markov chains in continuous time.`,
      caption: String.raw`Set the rate $\lambda$ and the age $s$. Left: 4000 seeded samples with the density $\lambda e^{-\lambda x}$; the survivors $X>s$ are shaded. Right: the survivors, shifted back by $s$, against the original density (green). For the exponential the two match, which is memorylessness. Switch to a uniform or a gamma law with the same mean: the survivors' histogram now follows its own conditional density (ink) and no longer the original.`,
      deps: ['prob-1.2.2a'],
      see: ['stoch-9.1'],
      tags: ['distributions'],
      viz(v) {
        const law = v.select('law', [{ value: 'exp', label: 'exponential' }, { value: 'unif', label: 'uniform' }, { value: 'gam', label: 'gamma(2)' }], 'exp');
        const lam = v.slider('rate $\\lambda$', 0.25, 3, 1, { step: 0.05 });
        const sS = v.slider('age $s$', 0, 2.5, 0.8, { step: 0.05 });
        const sA = v.stage({ x: [0, 5], y: [0, 1], height: 290, axes: 'box', gutter: true, xlabel: '$x$', title: 'all samples' });
        const sB = v.stage({ x: [0, 5], y: [0, 1], height: 290, axes: 'box', gutter: true, xlabel: '$x$', title: 'survivors $X>s$, shifted: $X-s$' });
        let cache = null, info = {};
        const D = (k, l) => (k === 'exp' ? v.M.dist.exponential(l) : k === 'unif' ? v.M.dist.uniform(0, 2 / l) : v.M.dist.gamma(2, 1 / (2 * l)));
        v.render(() => {
          const k = law.value, l = lam.value, s = sS.value / l, d = D(k, l), X = 5 / l;
          const key = k + l; if (!cache || cache.key !== key) cache = { key, xs: d.sample(v.rng(97), 4000) };
          const xs = cache.xs, surv = xs.filter((x) => x > s).map((x) => x - s);
          const tail = 1 - d.cdf(s), cond = (x) => (x < 0 ? 0 : d.pdf(x + s) / tail);
          const top = Math.max(d.pdf(1e-9), d.pdf(d.mean * 0.5), d.pdf(d.mean), cond(0), cond(1e-9)) * 1.25 || 1;
          sA.setView([0, X], [0, top]); sB.setView([0, X], [0, top]);
          sA.setTicks(null, null);
          const bins = v.M.linspace(0, X, 41);
          sA.vband(s, X, { color: 'gold', alpha: 0.1 });
          sA.hist(v.M.histogram(xs, { bins }), { density: true, color: 'accent', fillAlpha: 0.3 });
          sA.fn(d.pdf, { color: 'ink', width: 2.2, n: 500 });
          sA.vline(s, { color: 'gold', width: 2 }); sA.text('s', s, top * 0.92, { size: 14, math: true, color: 'gold', dx: 5 });
          sA.corner(`${surv.length} of 4000 survive past s`, 'tr', { color: 'gold', weight: 600 });
          if (surv.length > 1) { const H = v.M.histogram(surv, { bins }); sB.hist({ edges: H.edges, counts: H.counts.map((c) => c) }, { density: true, color: 'gold', fillAlpha: 0.35 }); }
          sB.fn(d.pdf, { color: 'green', width: 2.6, dash: [6, 4], n: 500 });
          if (k !== 'exp') sB.fn(cond, { color: 'ink', width: 2, n: 500 });
          const t = 1 / l;
          info = { k, l, s, t, cond: (1 - d.cdf(s + t)) / tail, plain: 1 - d.cdf(t), emp: surv.filter((x) => x > t).length / Math.max(1, surv.length), n: surv.length };
          v.legend(k === 'exp' ? [['accent', 'samples', { area: true }], ['gold', 'survivors, shifted', { area: true }], ['ink', 'density'], ['green', 'original density', { dash: true }]] : [['accent', 'samples', { area: true }], ['gold', 'survivors, shifted', { area: true }], ['ink', 'density, and the conditional density of $X-s$'], ['green', 'original density', { dash: true }]]);
        });
        v.readout(() => {
          const I = info, tt = v.fix(I.t, 2);
          return `With $t=1/\\lambda=${tt}$: $P(X>s+t\\mid X>s)=${v.fix(I.cond, 4)}$ (survivors: $${v.fix(I.emp, 4)}$ of ${I.n}) versus $P(X>t)=${v.fix(I.plain, 4)}$.` + (I.k === 'exp' ? ' They agree for every $s$: the exponential has no memory.' : ' They differ: this law remembers its age.');
        });
      },
    },
    {
      num: '1.2.5',
      kind: 'Definition',
      name: 'Standard normal distribution',
      statement: String.raw`The **standard normal distribution** has density
$$f(x)=(2\pi)^{-1/2}\,e^{-x^2/2},\qquad x\in\R.$$
Its distribution function, usually written $\Phi(x)=\int_{-\infty}^xf(y)\,dy$, has no closed form; Theorem 1.2.6 gives bounds on its tail for large $x$.`,
      idea: String.raw`That $f$ has total mass $1$ is the classical computation $\big(\int e^{-x^2/2}dx\big)^2=\iint e^{-(x^2+y^2)/2}\,dx\,dy=2\pi$, done in polar coordinates (compare $\Gamma(\tfrac12)=\sqrt\pi$, pma-8.21). The same rotational symmetry gives the **Box–Muller** method. If $U_1,U_2$ are independent and uniform on $(0,1)$, the point with polar coordinates $R=\sqrt{-2\log U_1}$ and $\Theta=2\pi U_2$ has two independent standard normal coordinates, because $P(R>r)=e^{-r^2/2}$ matches the radial law of $e^{-(x^2+y^2)/2}/2\pi$.`,
      caption: String.raw`Left: uniform points $(U_1,U_2)$ in the unit square; drag the handle to follow one of them. Middle: Box–Muller sends it to radius $\sqrt{-2\log U_1}$ and angle $2\pi U_2$, and the whole sample becomes a rotationally symmetric cloud. Right: the histogram of the first coordinates against the bell curve, with the band $\pm k$ shaded; the readout compares the exact mass of the band with the sampled fraction.`,
      deps: ['prob-1.2.2a'],
      see: ['pma-8.21'],
      tags: ['distributions', 'normal'],
      viz(v) {
        const nS = v.slider('samples $n$', 100, 20000, 3000, { log: true, int: true });
        const kS = v.select('band', [{ value: 1, label: '$\\pm1$' }, { value: 2, label: '$\\pm2$' }, { value: 3, label: '$\\pm3$' }], 2);
        const sU = v.stage({ x: [-0.02, 1.02], y: [-0.02, 1.02], equal: true, height: 290, axes: 'box', gutter: true, xlabel: '$U_1$', ylabel: '$U_2$', weight: 0.8, minWidth: 200 });
        const sZ = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], equal: true, height: 290, axes: true, weight: 1, minWidth: 230, title: '$(Z_1,Z_2)=R(\\cos\\Theta,\\sin\\Theta)$' });
        const sH = v.stage({ x: [-4, 4], y: [0, 0.46], height: 290, axes: 'box', gutter: true, xlabel: '$z$', weight: 1.2, minWidth: 240, title: 'histogram of $Z_1$ and the density $f$' });
        const H = sU.handle(0.3, 0.15, { color: 'gold', r: 6.5, constrain: { x: [0.002, 0.998], y: [0, 1] } });
        const NMAX = 20000, rr = v.rng(77), U = Array.from({ length: NMAX }, () => [rr(), rr()]);
        const bm = ([u1, u2]) => { const R = Math.sqrt(-2 * Math.log(u1)), T = 2 * Math.PI * u2; return [R * Math.cos(T), R * Math.sin(T)]; };
        const Z = U.map(bm);
        const erf = v.M.erf;
        let info = {};
        v.render(() => {
          const n = nS.value, k = kS.value, show = Math.min(n, 2500);
          sU.dots(U.slice(0, show), { r: 1.4, color: 'muted', alpha: 0.5 });
          sU.vline(H.x, { color: 'orange', width: 1, dash: [3, 3] }); sU.hline(H.y, { color: 'purple', width: 1, dash: [3, 3] });
          [1, 2, 3].forEach((r) => sZ.circle(0, 0, r, { color: 'faint', width: 1 }));
          sZ.dots(Z.slice(0, show), { r: 1.4, color: 'accent', alpha: 0.45 });
          const R = Math.sqrt(-2 * Math.log(H.x)), T = 2 * Math.PI * H.y, P = [R * Math.cos(T), R * Math.sin(T)];
          sZ.curve((t) => [0.55 * Math.cos(t), 0.55 * Math.sin(t)], 0, T, { color: 'purple', width: 2 });
          sZ.line(0, 0, P[0], P[1], { color: 'orange', width: 2.4 });
          sZ.dot(P[0], P[1], { r: 6, color: 'gold' });
          sZ.text(`R = ${v.fix(R, 2)}`, P[0] / 2, P[1] / 2, { size: 12, color: 'orange', dx: 6, dy: -8, plate: true });
          sH.vband(-k, k, { color: 'accent', alpha: 0.1 });
          sH.hist(v.M.histogram(Z.slice(0, n).map((z) => z[0]), { bins: v.M.linspace(-4, 4, 61) }), { density: true, color: 'accent', fillAlpha: 0.3 });
          sH.fn(phi, { color: 'ink', width: 2.4, n: 400 });
          sH.vline(P[0], { color: 'gold', width: 2 });
          let inB = 0; for (let i = 0; i < n; i++) if (Math.abs(Z[i][0]) <= k) inB++;
          info = { n, k, inB, R, T, P };
          v.legend([['muted', 'uniforms', { dot: true }], ['accent', 'normal pairs', { dot: true }], ['orange', '$R=\\sqrt{-2\\log U_1}$'], ['purple', '$\\Theta=2\\pi U_2$'], ['ink', '$f(z)=e^{-z^2/2}/\\sqrt{2\\pi}$']]);
        });
        v.readout(() => {
          const I = info, ex = erf(I.k / Math.SQRT2), tot = v.M.integrate((x) => Math.exp(-x * x / 2), -12, 12, 2000);
          return `$P(|Z|\\le ${I.k})=${v.fix(ex, 4)}$ exactly; the first coordinates of $n=${I.n}$ samples give $${v.fix(I.inB / I.n, 4)}$. Total mass: $\\int e^{-x^2/2}dx=${v.fix(tot, 6)}=\\sqrt{2\\pi}$. The followed point maps to $(${v.fix(I.P[0], 2)},\\,${v.fix(I.P[1], 2)})$.`;
        });
      },
    },
    {
      num: '1.2.6',
      kind: 'Theorem',
      name: 'Gaussian tail bounds (Mills ratio)',
      statement: String.raw`For every $x>0$,
$$(x^{-1}-x^{-3})\,e^{-x^2/2}\;\le\;\int_x^\infty e^{-y^2/2}\,dy\;\le\;x^{-1}e^{-x^2/2}.$$
Dividing by $\sqrt{2\pi}$ bounds the standard normal tail $P(Z\ge x)$. Since the ratio of the two bounds is $1-x^{-2}\to1$, it follows that $P(Z\ge x)\sim(x\sqrt{2\pi})^{-1}e^{-x^2/2}$ as $x\to\infty$.`,
      idea: String.raw`For the upper bound substitute $y=x+z$. Then $e^{-y^2/2}=e^{-x^2/2}e^{-xz}e^{-z^2/2}\le e^{-x^2/2}e^{-xz}$, and $\int_0^\infty e^{-xz}dz=1/x$. For the lower bound, differentiate: $\frac{d}{dy}\big[-(y^{-1}-y^{-3})e^{-y^2/2}\big]=(1-3y^{-4})e^{-y^2/2}$. This is at most $e^{-y^2/2}$, so integrating from $x$ to $\infty$ gives $(x^{-1}-x^{-3})e^{-x^2/2}\le\int_x^\infty e^{-y^2/2}dy$. The lower bound is useless (negative) for $x\le1$, and both are sharp as $x\to\infty$.`,
      caption: String.raw`Drag $x$ along the tail curve. On the log scale the exact tail $P(Z\ge x)$ (ink) lies between the lower bound (blue) and the upper bound (red). For $x\le1$ the lower bound is $\le0$ and drops off the plot. Turn the log scale off to see why it is needed. The lower panel shows the ratios of the bounds to the tail, which tend to $1$, or the integrands behind each bound: the areas under the two curves are the two sides of the inequality.`,
      deps: ['prob-1.2.5'],
      tags: ['normal', 'tails'],
      viz(v) {
        const logT = v.toggle('log scale', true);
        const view = v.select('lower panel', [{ value: 'ratio', label: 'ratios' }, { value: 'up', label: 'why: upper bound' }, { value: 'low', label: 'why: lower bound' }], 'ratio');
        const tail = (x) => 0.5 * v.M.erfc(x / Math.SQRT2), up = (x) => phi(x) / x, lo = (x) => phi(x) * (1 / x - 1 / x ** 3);
        const sT = v.stage({ x: [0.25, 6], y: [1e-10, 1], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '$x$', full: true, title: 'the normal tail and its two bounds' });
        const sB = v.stage({ x: [0.25, 6], y: [-1, 3], height: 200, axes: 'box', gutter: true, full: true });
        const H = sT.handle(2.2, tail(2.2), { color: 'gold', r: 6.5, label: 'x', labelPos: 'ne', constrain: (x) => { const xx = v.M.clamp(x, 0.3, 5.9); return [xx, tail(xx)]; } });
        let lastLog = null, lastView = null;
        v.render(() => {
          const L = logT.value, x = H.x;
          if (L !== lastLog) { lastLog = L; sT.setScale(L ? { ylog: true, y: [1e-10, 1] } : { ylog: false, y: [0, 0.55] }); }
          H.y = tail(x);
          sT.fn(tail, { color: 'ink', width: 2.6, n: 600 });
          sT.fn(up, { color: 'red', width: 2, dash: [7, 4], n: 600 });
          sT.fn(lo, { color: 'blue', width: 2, dash: [3, 3], n: 600 });
          sT.vline(x, { color: 'gold', width: 1, dash: [3, 3] });
          if (L) sT.vline(1, { color: 'blue', width: 1, alpha: 0.4 });
          if (L) sT.text('lower bound ≤ 0 for x ≤ 1', 1.05, 3e-10, { size: 11, color: 'blue' });
          // lower panel
          const md = view.value;
          if (md !== lastView) { lastView = md; sB.setLabels(null, null); }
          if (md === 'ratio') {
            sB.setView([0.25, 6], [-1, 3]); sB.setTitle('ratios of the bounds to the exact tail, against x');
            sB.hline(1, { color: 'ink', width: 1.4, dash: [4, 4] });
            sB.fn((t) => up(t) / tail(t), { color: 'red', width: 2.2 });
            sB.fn((t) => lo(t) / tail(t), { color: 'blue', width: 2.2 });
            sB.vline(x, { color: 'gold', width: 1, dash: [3, 3] });
          } else if (md === 'up') {
            const zmax = Math.min(4, 7 / x), e0 = Math.exp(-x * x / 2);
            sB.setView([0, zmax], [0, e0 * 1.1]); sB.setTitle(`upper bound at x = ${v.fix(x, 2)}: e^{−x²/2}e^{−xz} (red) above e^{−(x+z)²/2} (ink)`);
            sB.between((z) => e0 * Math.exp(-x * z), (z) => Math.exp(-((x + z) ** 2) / 2), 0, zmax, { fill: 'red', fillAlpha: 0.18 });
            sB.between((z) => Math.exp(-((x + z) ** 2) / 2), () => 0, 0, zmax, { fill: 'ink', fillAlpha: 0.12 });
            sB.fn((z) => e0 * Math.exp(-x * z), { color: 'red', width: 2.2 }); sB.fn((z) => Math.exp(-((x + z) ** 2) / 2), { color: 'ink', width: 2.2 });
          } else {
            const ymax = x + Math.min(4, 6 / x), e0 = Math.exp(-x * x / 2);
            sB.setView([x, ymax], [Math.min(0, (1 - 3 / x ** 4) * e0) * 1.1, e0 * 1.1]); sB.setTitle(`lower bound at x = ${v.fix(x, 2)}: (1 − 3y⁻⁴)e^{−y²/2} (blue) below e^{−y²/2} (ink)`);
            sB.between((y) => Math.exp(-y * y / 2), (y) => (1 - 3 / y ** 4) * Math.exp(-y * y / 2), x, ymax, { fill: 'blue', fillAlpha: 0.15 });
            sB.fn((y) => Math.exp(-y * y / 2), { color: 'ink', width: 2.2 }); sB.fn((y) => (1 - 3 / y ** 4) * Math.exp(-y * y / 2), { color: 'blue', width: 2.2 });
            sB.hline(0, { color: 'faint', width: 1 });
          }
          v.legend([['ink', '$P(Z\\ge x)$'], ['red', '$\\frac{1}{x\\sqrt{2\\pi}}e^{-x^2/2}$', { dash: true }], ['blue', '$\\frac{x^{-1}-x^{-3}}{\\sqrt{2\\pi}}e^{-x^2/2}$', { dash: true }]]);
        });
        v.readout(() => {
          const x = H.x, t = tail(x), u = up(x), l = lo(x);
          return `At $x=${v.fix(x, 2)}$: $${v.sci(Math.max(l, 0) || 0, 4)}${l <= 0 ? '\\ (\\text{bound}\\le0)' : ''}\\le P(Z\\ge x)=${v.sci(t, 4)}\\le${v.sci(u, 4)}$. Ratios to the tail: lower $${v.fix(l / t, 4)}$, upper $${v.fix(u / t, 4)}$; their quotient is $1-x^{-2}=${v.fix(1 - 1 / (x * x), 4)}$.`;
        });
      },
    },
    {
      num: '1.2.6a',
      kind: 'Definition',
      name: 'Absolutely continuous, singular and discrete laws',
      statement: String.raw`A distribution function $F$ on $\R$, or its measure $\mu$, is

- **absolutely continuous** if it has a density: $F(x)=\int_{-\infty}^xf(y)\,dy$;
- **singular** if $\mu$ is singular with respect to Lebesgue measure $\lambda$: $\mu(A^c)=0$ for some Borel set $A$ with $\lambda(A)=0$;
- **discrete** if $\mu(S^c)=0$ for some countable set $S$.

Examples: the point mass at $0$, $F=1_{[0,\infty)}$, is discrete (1.2.8); $F=\sum_i\alpha_i1_{[q_i,\infty)}$ with $\alpha_i>0$, $\sum\alpha_i=1$ and $(q_i)$ an enumeration of the rationals is discrete and jumps at every rational (1.2.9). By the Lebesgue decomposition (Appendix A.4), every distribution function is a mixture $F=aF_{ac}+bF_d+cF_{cs}$, $a+b+c=1$, of an absolutely continuous, a discrete and a continuous singular one.`,
      idea: String.raw`Lebesgue's decomposition splits $\mu$ into a part with a density and a part carried by a Lebesgue-null set. The atoms of the null part, at most countably many because $F$ has at most countably many jumps, form the discrete part, and what is left is continuous but singular, like the Cantor law (1.2.7). The three types differ in how mass scales under refinement. In bins of width $w$, an absolutely continuous law puts mass about $f(x)\,w$ into a bin, an atom keeps its full mass $p$ however small $w$ is, and the Cantor law puts mass $2^{-k}$ into bins of width $3^{-k}$. The last is a density of $(3/2)^k\to\infty$ on a set of total length $(2/3)^k\to0$.`,
      caption: String.raw`Mix a density (blue), three point masses (red) and the Cantor law (purple) with the sliders; the weights are normalised to sum to $1$. Top: $F$ is the sum of the three coloured bands, the smooth rise, the jumps and the devil's staircase. Bottom: the exact histogram of each part at resolution $3^{-k}$, one strip per part, each scaled to its own maximum (printed). Raise $k$: the blue strip settles down to the density, while the red spikes grow like $3^k$ and the purple dust like $(3/2)^k$, on a set of shrinking length.`,
      deps: ['prob-1.2.2a'],
      see: ['rca-6.7'],
      verify: true,
      tags: ['distributions'],
      viz(v) {
        const wa = v.slider('absolutely continuous', 0, 1, 0.45, { step: 0.01 });
        const wd = v.slider('discrete', 0, 1, 0.25, { step: 0.01 });
        const ws = v.slider('singular (Cantor)', 0, 1, 0.3, { step: 0.01 });
        const kS = v.slider('resolution $k$ (bins of width $3^{-k}$)', 1, 7, 4, { int: true });
        const B = v.M.dist.beta(2, 3), AT = [[0.25, 0.5], [0.5, 0.3], [0.85, 0.2]];
        const Fa = (x) => B.cdf(Math.min(1, Math.max(0, x))), Fd = (x) => AT.reduce((t, [c, p]) => t + (x >= c ? p : 0), 0), Fs = (x) => v.M.cantorFn(x, 30);
        const sF = v.stage({ x: [-0.03, 1.03], y: [0, 1.04], height: 280, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$F(x)$', full: true });
        const sH = v.stage({ x: [-0.03, 1.03], y: [0, 3.05], height: 230, axes: false, full: true, title: 'exact mass per bin ÷ bin width, part by part (each strip scaled to its maximum)' });
        let info = {};
        v.render(() => {
          const t = wa.value + wd.value + ws.value || 1, a = wa.value / t, d = wd.value / t, c = ws.value / t, k = kS.value;
          const g1 = (x) => a * Fa(x), g2 = (x) => g1(x) + d * Fd(x), g3 = (x) => g2(x) + c * Fs(x);
          sF.between(g1, () => 0, -0.03, 1.03, { fill: 'blue', fillAlpha: 0.3, n: 1200 });
          sF.between(g2, g1, -0.03, 1.03, { fill: 'red', fillAlpha: 0.3, n: 1200 });
          sF.between(g3, g2, -0.03, 1.03, { fill: 'purple', fillAlpha: 0.3, n: 1200 });
          sF.fn(g3, { color: 'ink', width: 2.2, n: 1600 });
          // exact histograms at resolution 3^-k
          const N = 3 ** k, w = 1 / N, E = Array.from({ length: N + 1 }, (_, j) => j * w);
          const parts = [
            { col: 'blue', wt: a, F: Fa, name: 'absolutely continuous' },
            { col: 'red', wt: d, F: Fd, name: 'discrete' },
            { col: 'purple', wt: c, F: Fs, name: 'singular' },
          ];
          const maxes = [], supp = [];
          parts.forEach((P, i) => {
            const y0 = 2 - i, dens = E.slice(0, -1).map((e, j) => (P.wt * (P.F(E[j + 1]) - P.F(e))) / w);
            const mx = Math.max(...dens); maxes.push(mx); supp.push(dens.filter((q) => q > 1e-12).length * w);
            sH.line(-0.03, y0, 1.03, y0, { color: 'faint', width: 1 });
            if (mx > 1e-12) dens.forEach((q, j) => { if (q > 1e-12) sH.rect(E[j], y0, E[j + 1], y0 + (0.82 * q) / mx, { fill: P.col, fillAlpha: 0.6, stroke: false }); });
            sH.text(`${P.name}: max ${mx > 1e-12 ? v.fix(mx, 2) : '0'}`, 0.0, y0 + 0.9, { size: 11.5, color: P.col, weight: 600 });
          });
          info = { a, d, c, k, maxes, supp };
          v.legend([['blue', '$aF_{ac}$ (beta density)', { area: true }], ['red', '$bF_d$ (atoms at $\\tfrac14,\\tfrac12,0.85$)', { area: true }], ['purple', '$cF_{cs}$ (Cantor)', { area: true }], ['ink', '$F$']]);
        });
        v.readout(() => {
          const I = info, k = I.k;
          return `Weights $a=${v.fix(I.a, 2)},\\ b=${v.fix(I.d, 2)},\\ c=${v.fix(I.c, 2)}$. At $k=${k}$ the largest bin densities are $${v.fix(I.maxes[0], 2)}$ (bounded by $a\\max f$), $${v.fix(I.maxes[1], 1)}$ (an atom's weight times $3^{${k}}$) and $${v.fix(I.maxes[2], 2)}=c\\,(3/2)^{${k}}$. The singular part occupies total length $${v.fix(I.supp[2], 4)}=(2/3)^{${k}}$${I.c > 0 ? '' : ' (here it is absent)'}, the atoms $${v.fix(I.supp[1], 4)}$.`;
        });
      },
    },
    {
      num: '1.2.7',
      kind: 'Definition',
      name: 'Cantor distribution: continuous but singular',
      credit: 'Cantor, 1883',
      statement: String.raw`Let $C$ be the Cantor set, obtained from $[0,1]$ by removing $(\tfrac13,\tfrac23)$ and then, again and again, the open middle third of every interval that remains. The **Cantor distribution function** has $F(x)=0$ for $x\le0$ and $F(x)=1$ for $x\ge1$, takes the value $\tfrac12$ on $[\tfrac13,\tfrac23]$, $\tfrac14$ on $[\tfrac19,\tfrac29]$, $\tfrac34$ on $[\tfrac79,\tfrac89]$, and so on on every removed interval, and is extended to $[0,1]$ by monotonicity. $F$ is continuous, and its measure $\mu$ (the uniform distribution on $C$) has $\mu(C^c)=0$ although $\lambda(C)=0$. So $\mu$ is singular and there is no density $f$ with $F(x)=\int_{-\infty}^xf$.`,
      idea: String.raw`$F$ is constant on every removed interval, so a density would vanish on $C^c$, a set of Lebesgue measure $1$, and then $\int f=0\neq1$. Yet $F$ is continuous. After $n$ steps it rises by $2^{-n}$ across each of the $2^n$ remaining intervals of length $3^{-n}$, so the piecewise linear approximants $F_n$ converge uniformly, with $\sup|F-F_n|\le2^{-n}$. A sample is $X=\sum_i2\xi_i3^{-i}$ with independent fair bits $\xi_i\in\{0,1\}$. Its ternary digits are all $0$ or $2$, so $X\in C$, and $F(X)=\sum_i\xi_i2^{-i}$ reads the same digits in binary; that is why $F(X)$ is uniform.`,
      caption: String.raw`Raise the depth $n$: the approximants $F_n$ (gold) climb the devil's staircase (ink), flat on the removed intervals (shaded), whose total length is $1-(2/3)^n$. The table lists six samples by their ternary digits $0/2$ and the binary digits of $F(X)$, the same pattern with $2\mapsto1$. Below, the histogram of 20,000 samples with $3^k$ bins: only $2^k$ bins are ever hit, each with density near $(3/2)^k$, so the histogram never settles down to a function as it would for a density.`,
      deps: ['prob-1.2.6a'],
      see: ['pma-2.44', 'ode-12.1'],
      tags: ['distributions', 'counterexamples'],
      viz(v) {
        const nS = v.slider('depth $n$ of $F_n$', 0, 10, 3, { int: true });
        const kS = v.slider('histogram bins $3^k$, $k=$', 1, 7, 4, { int: true });
        const sA = v.stage({ x: [-0.02, 1.02], y: [-0.02, 1.04], height: 300, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$F(x)$', weight: 1.3 });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, weight: 1, minWidth: 280, title: 'samples: ternary digits of $X$, binary digits of $F(X)$' });
        const sH = v.stage({ x: [-0.02, 1.02], y: [0, 1], height: 190, axes: 'box', gutter: true, full: true, title: 'histogram of 20,000 Cantor samples (density scale)' });
        const r = v.rng(1883), S = Array.from({ length: 20000 }, () => cantorSample(r));
        const xs = S.map((q) => q[0]);
        let info = {};
        v.render(() => {
          const n = nS.value, k = kS.value;
          // removed intervals up to level n
          const I = v.M.cantorIntervals(n);
          for (let i = 0; i + 1 < I.length; i++) sA.vband(I[i][1], I[i + 1][0], { color: 'orange', alpha: 0.12 });
          sA.fn((x) => v.M.cantorFn(x, 30), { color: 'ink', width: 1.6, n: 2400 });
          sA.fn((x) => cantorN(x, n), { color: 'gold', width: 2.6, n: 2400 });
          // the table
          const rows = S.slice(0, 6), ROW = 1 / 7;
          sT.text('X (ternary)', 0.02, 1 - ROW * 0.45, { size: 11, color: 'muted', weight: 600 });
          sT.text('F(X) (binary)', 0.6, 1 - ROW * 0.45, { size: 11, color: 'muted', weight: 600 });
          rows.forEach(([x, bits], i) => {
            const y = 1 - ROW * (i + 1.2), col = ATOMS[i];
            sT.text(`0.${bits.slice(0, 10).map((b) => 2 * b).join('')}…`, 0.02, y, { size: 13, color: col, weight: 600 });
            sT.text(`0.${bits.slice(0, 10).join('')}…`, 0.6, y, { size: 13, color: col, weight: 600 });
            sT.text(`= ${v.fix(x, 4)}`, 0.02, y - ROW * 0.38, { size: 10.5, color: 'muted' });
            sT.text(`= ${v.fix(v.M.cantorFn(x, 30), 4)}`, 0.6, y - ROW * 0.38, { size: 10.5, color: 'muted' });
            sA.dot(x, v.M.cantorFn(x, 30), { r: 4.5, color: col });
          });
          // histogram with 3^k bins
          const N = 3 ** k, H = v.M.histogram(xs, { bins: v.M.linspace(0, 1, N + 1) });
          const dens = H.counts.map((c) => (c / xs.length) * N), mx = Math.max(...dens);
          sH.setView(null, [0, mx * 1.12]);
          sH.hist(H, { density: true, color: 'purple', fillAlpha: 0.55, outline: k <= 4, gap: 0 });
          sH.hline(1.5 ** k, { color: 'ink', width: 1.2, dash: [5, 4] });
          sH.text('(3/2)ᵏ', 1.01, 1.5 ** k, { size: 11, align: 'right', baseline: 'bottom', dy: -2 });
          let sup = 0; for (let j = 0; j <= 3000; j++) { const x = j / 3000; sup = Math.max(sup, Math.abs(v.M.cantorFn(x, 30) - cantorN(x, n))); }
          info = { n, k, hit: H.counts.filter((c) => c > 0).length, N, mx, sup, removed: 1 - (2 / 3) ** n };
          v.legend([['ink', 'Cantor function $F$'], ['gold', '$F_n$'], ['orange', 'removed intervals', { area: true }], ['purple', 'histogram', { area: true }]]);
        });
        v.readout(() => {
          const I = info;
          return `$\\sup|F-F_{${I.n}}|=${v.fix(I.sup, 4)}\\le2^{-${I.n}}=${v.fix(2 ** -I.n, 4)}$; removed length $1-(2/3)^{${I.n}}=${v.fix(I.removed, 4)}$. Histogram: ${I.hit} of $3^{${I.k}}=${I.N}$ bins are hit (exactly $2^{${I.k}}=${2 ** I.k}$ can be), with densities up to $${v.fix(I.mx, 2)}$, compared with $(3/2)^{${I.k}}=${v.fix(1.5 ** I.k, 2)}$. The total length of the bins that are hit is $(2/3)^{${I.k}}=${v.fix((2 / 3) ** I.k, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3 random variables
    {
      num: '1.3.1',
      kind: 'Theorem',
      name: 'Measurability can be checked on a generating class',
      statement: String.raw`Let $X:\Omega\to S$, where $(\Omega,\mathcal F)$ and $(S,\mathcal S)$ are measurable spaces, and let $\mathcal A$ be a collection of subsets of $S$ that generates $\mathcal S$, i.e. $\sigma(\mathcal A)=\mathcal S$. If $\{\omega:X(\omega)\in A\}\in\mathcal F$ for every $A\in\mathcal A$, then $X$ is measurable: $X^{-1}(B)\in\mathcal F$ for every $B\in\mathcal S$.

For $(S,\mathcal S)=(\R,\mathcal R)$ one may take $\mathcal A=\{(-\infty,x]:x\in\R\}$ or $\{(-\infty,x):x\in\Q\}$ (Example 1.3.2); for $(\R^d,\mathcal R^d)$, the open boxes $(a_1,b_1)\times\cdots\times(a_d,b_d)$ (Example 1.3.3).`,
      idea: String.raw`Preimages commute with set operations: $\{X\in B^c\}=\{X\in B\}^c$ and $\{X\in\bigcup_iB_i\}=\bigcup_i\{X\in B_i\}$. So the class of good sets $\mathcal B=\{B\subset S:\{X\in B\}\in\mathcal F\}$ is a σ-field. By assumption it contains $\mathcal A$, so it contains the smallest σ-field containing $\mathcal A$, which is $\mathcal S$. One check on a generating class replaces the check on every Borel set.`,
      caption: String.raw`$\Omega=[0,1)$ carries the σ-field $\mathcal F$ generated by the dyadic intervals of length $2^{-m}$ (shaded cells). Choose $X$ and a target set $B$: a half-line, an interval $(a,b]$, which is the difference of two half-lines, or its complement. $X^{-1}(B)$ is drawn under the graph, green when it is a union of cells and red otherwise. On the right each cell becomes a column showing the values $X$ takes there; a half-line is good exactly when its level cuts no column, and the strip on the right edge records this for every level.`,
      deps: ['prob-1.2.1a', 'prob-1.1.2a'],
      see: ['rca-1.12'],
      tags: ['random variables', 'sigma-fields'],
      viz(v) {
        const XS = {
          step: { label: 'step on quarters', f: (w) => [1.2, 0.4, 2.1, 1.5][Math.min(3, Math.floor(w * 4))], cont: false },
          fine: { label: 'step on eighths', f: (w) => [0.5, 0.9, 1.9, 1.6, 0.3, 1.1, 2.2, 1.4][Math.min(7, Math.floor(w * 8))], cont: false },
          cont: { label: 'continuous', f: (w) => 0.3 + 1.9 * w + 0.25 * Math.sin(9 * w), cont: true },
        };
        const which = v.select('$X$', Object.entries(XS).map(([value, o]) => ({ value, label: o.label })), 'step');
        const mS = v.slider('$\\mathcal F$: cells of length $2^{-m}$, $m=$', 1, 5, 2, { int: true });
        const mode = v.select('$B$', [{ value: 'ray', label: '$(-\\infty,x]$' }, { value: 'int', label: '$(a,b]$' }, { value: 'comp', label: '$(a,b]^c$' }], 'ray');
        const Y = [-0.95, 2.6];
        const s = v.stage({ x: [0, 1], y: Y, height: 340, axes: 'box', gutter: true, xlabel: '$\\omega$', weight: 1.5 });
        const sC = v.stage({ x: [0, 1], y: Y, height: 340, axes: 'box', gutter: { l: 34, r: 26, t: 10, b: 24 }, xticks: [], weight: 1, minWidth: 220, title: 'values of $X$ on each cell' });
        const hx = s.handle(0.985, 1.3, { color: 'gold', r: 6, label: 'x', labelPos: 'w', constrain: (x, y) => [0.985, v.M.clamp(y, 0, 2.5)] });
        const ha = s.handle(0.985, 0.8, { color: 'gold', r: 6, label: 'a', labelPos: 'w', constrain: (x, y) => [0.985, v.M.clamp(Math.min(y, hb.y - 0.05), 0, 2.5)] });
        const hb = s.handle(0.985, 1.7, { color: 'gold', r: 6, label: 'b', labelPos: 'w', constrain: (x, y) => [0.985, v.M.clamp(Math.max(y, ha.y + 0.05), 0, 2.5)] });
        const isEvent = (P, m) => P.every(([p, q]) => [p, q].every((e) => Math.abs(e * 2 ** m - Math.round(e * 2 ** m)) < 1e-6));
        const ranges = (f, m) => Array.from({ length: 2 ** m }, (_, j) => { let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 40; i++) { const y = f((j + (i / 40) * 0.999999) / 2 ** m); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; });
        let info = {};
        v.render(() => {
          const X = XS[which.value], f = X.f, m = mS.value, md = mode.value, N = 2 ** m;
          hx.visible = md === 'ray'; ha.visible = hb.visible = md !== 'ray';
          const inB = md === 'ray' ? (y) => y <= hx.y : md === 'int' ? (y) => y > ha.y && y <= hb.y : (y) => !(y > ha.y && y <= hb.y);
          for (let j = 0; j < N; j++) if (j % 2 === 0) s.vband(j / N, (j + 1) / N, { color: 'muted', alpha: 0.08 });
          // B on the value axis
          if (md === 'ray') s.hband(-0.1, hx.y, { color: 'gold', alpha: 0.14 });
          else if (md === 'int') s.hband(ha.y, hb.y, { color: 'gold', alpha: 0.14 });
          else { s.hband(0, ha.y, { color: 'gold', alpha: 0.14 }); s.hband(hb.y, 2.6, { color: 'gold', alpha: 0.14 }); }
          s.fn(f, { domain: [0, 0.99999], color: 'ink', width: 2.4, n: 900 });
          const P = preimage((w) => inB(f(w)), 0, 1, 1024), ok = isEvent(P, m);
          const row = (y, PP, col, w = 7) => PP.forEach(([p, q]) => s.line(p, y, q, y, { color: col, width: w, cap: 'butt' }));
          if (md === 'int') {
            const Pb = preimage((w) => f(w) <= hb.y, 0, 1, 1024), Pa = preimage((w) => f(w) <= ha.y, 0, 1, 1024);
            row(-0.2, Pb, 'teal', 4); row(-0.42, Pa, 'purple', 4);
            s.text('{X ≤ b}', 0.01, -0.2, { size: 10.5, color: 'teal', dy: -8 }); s.text('{X ≤ a}', 0.01, -0.42, { size: 10.5, color: 'purple', dy: -8 });
          }
          row(-0.72, P, ok ? 'green' : 'red', 9);
          s.text(md === 'int' ? 'X⁻¹(B) = {X ≤ b} ∖ {X ≤ a}' : 'X⁻¹(B)', 0.01, -0.72, { size: 10.5, color: ok ? 'green' : 'red', dy: -10 });
          if (!ok) for (let j = 0; j < N; j++) { const c0 = j / N, c1 = (j + 1) / N, cov = P.reduce((t, [p, q]) => t + Math.max(0, Math.min(q, c1) - Math.max(p, c0)), 0); if (cov > 1e-9 && cov < 1 / N - 1e-9) s.rect(c0, Y[0], c1, -0.55, { fill: 'red', fillAlpha: 0.1, hatch: 'red', hatchAlpha: 0.35, stroke: false }); }
          // columns: the value set of X on each cell
          if (md === 'ray') sC.hband(Y[0], hx.y, { color: 'gold', alpha: 0.12 }); else if (md === 'int') sC.hband(ha.y, hb.y, { color: 'gold', alpha: 0.12 }); else { sC.hband(Y[0], ha.y, { color: 'gold', alpha: 0.12 }); sC.hband(hb.y, Y[1], { color: 'gold', alpha: 0.12 }); }
          const R = ranges(f, m), cut = (t) => R.some(([lo, hi]) => lo <= t && t < hi - 1e-12);
          R.forEach(([lo, hi], j) => {
            const x = (j + 0.5) / N, col = ATOMS[j % ATOMS.length];
            if (hi - lo < 1e-9) sC.dot(x, lo, { r: 5, color: col }); else sC.line(x, lo, x, hi, { color: col, width: Math.max(3, 140 / N), cap: 'round' });
          });
          if (md === 'ray') sC.hline(hx.y, { color: cut(hx.y) ? 'red' : 'green', width: 2 });
          else [ha.y, hb.y].forEach((t) => sC.hline(t, { color: cut(t) ? 'red' : 'green', width: 2, dash: [5, 3] }));
          const ts = v.M.linspace(0, 2.5, 251); let bad = 0;
          for (let i = 0; i + 1 < ts.length; i++) { const c = cut((ts[i] + ts[i + 1]) / 2); if (c) bad++; sC.line(1.0, ts[i], 1.0, ts[i + 1], { color: c ? 'red' : 'green', width: 8, cap: 'butt' }); }
          info = { ok, P, m, meas: bad === 0, md };
          v.legend([['gold', '$B$', { area: true }], ['green', 'preimage is an event'], ['red', 'preimage splits a cell']]);
        });
        v.readout(() => {
          const I = info;
          const pre = `$X^{-1}(B)$ is ${I.P.length ? `a union of ${I.P.length} interval${I.P.length > 1 ? 's' : ''}` : 'empty'} and ` + (I.ok ? '**is** a union of cells, so it lies in $\\mathcal F$.' : '**splits** a cell, so it is not in $\\mathcal F$.');
          return pre + (I.meas ? ` Every half-line passes (the strip is all green), so by Theorem 1.3.1 every Borel set passes: $X$ is $\\mathcal F$-measurable.` : ` Some half-lines fail (red in the strip), so $X$ is not $\\mathcal F$-measurable; refine the cells or pick a coarser $X$.`);
        });
      },
    },
    {
      num: '1.3.1a',
      kind: 'Definition',
      name: 'σ-field generated by a random variable',
      statement: String.raw`If $X:(\Omega,\mathcal F)\to(S,\mathcal S)$ is measurable, the collection
$$\sigma(X)=\{\{X\in B\}:B\in\mathcal S\}$$
is a σ-field on $\Omega$. It is the smallest σ-field on $\Omega$ that makes $X$ measurable, and it is called the **σ-field generated by $X$**.`,
      idea: String.raw`The two identities in the proof of Theorem 1.3.1, $\{X\in B^c\}=\{X\in B\}^c$ and $\{X\in\bigcup B_i\}=\bigcup\{X\in B_i\}$, show that preimages of a σ-field form a σ-field. Any σ-field making $X$ measurable must contain every $\{X\in B\}$. When $X$ takes finitely many values, the level sets $\{X=v\}$ are the atoms of $\sigma(X)$, so it has $2^k$ events for $k$ values. A random variable $Y$ is $\sigma(X)$-measurable exactly when it is constant on every level set of $X$, that is, when $Y=f(X)$ for a measurable $f$ (Exercise 1.3.8).`,
      caption: String.raw`$\Omega$ is the unit square with area as $P$, and two "dice" $D_1,D_2\in\{1,\dots,n\}$ are read off the coordinates. Left: $\Omega$ coloured by the value of $X$; the colour classes are the atoms of $\sigma(X)$. Right: a second variable $Y$ with the atom boundaries of $\sigma(X)$ drawn on top. If $Y$ is a function of $X$ it is constant on every atom; otherwise the atoms it splits are hatched in red. Click a point to highlight its atom in both panels.`,
      deps: ['prob-1.2.1a', 'prob-1.1.2a'],
      verify: true,
      tags: ['random variables', 'sigma-fields'],
      viz(v) {
        const nS = v.slider('faces $n$', 2, 6, 4, { int: true });
        const xSel = v.select('$X$', [{ value: 'sum', label: '$D_1+D_2$' }, { value: 'max', label: '$\\max(D_1,D_2)$' }, { value: 'dif', label: '$|D_1-D_2|$' }], 'sum');
        const ySel = v.select('$Y$', [{ value: 'mod', label: '$X \\bmod 2$' }, { value: 'half', label: '$\\lceil X/2\\rceil$' }, { value: 'd1', label: '$D_1$' }, { value: 'sum', label: '$D_1+D_2$' }], 'd1');
        const sX = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 320, axes: false, title: 'atoms of $\\sigma(X)$: the level sets of $X$' });
        const sY = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 320, axes: false, title: '$Y$, with the atoms of $\\sigma(X)$ outlined' });
        const XF = { sum: (a, b) => a + b, max: (a, b) => Math.max(a, b), dif: (a, b) => Math.abs(a - b) };
        const YF = { mod: (x) => x % 2, half: (x) => Math.ceil(x / 2), d1: (x, a) => a, sum: (x, a, b) => a + b };
        let pick = null;
        [sX, sY].forEach((S) => S.onClick((x, y) => { if (x >= 0 && x < 1 && y >= 0 && y < 1) pick = [x, y]; }));
        let info = {};
        v.render(() => {
          const n = nS.value, Xf = XF[xSel.value], Yf = YF[ySel.value];
          const D = (t) => Math.min(n, Math.floor(t * n) + 1);
          const Xv = (a, b) => Xf(a, b), Yv = (a, b) => Yf(Xv(a, b), a, b);
          const xvals = [], yvals = [];
          for (let a = 1; a <= n; a++) for (let b = 1; b <= n; b++) { if (!xvals.includes(Xv(a, b))) xvals.push(Xv(a, b)); if (!yvals.includes(Yv(a, b))) yvals.push(Yv(a, b)); }
          xvals.sort((p, q) => p - q); yvals.sort((p, q) => p - q);
          const colX = (val) => { const i = xvals.indexOf(val); return [ATOMS[i % 8], i >= 8 ? 0.75 : 0.42]; }, colY = (val) => { const i = yvals.indexOf(val); return [ATOMS[(i + 3) % 8], i >= 8 ? 0.75 : 0.42]; };
          const split = new Set(xvals.filter((xv) => { const ys = new Set(); for (let a = 1; a <= n; a++) for (let b = 1; b <= n; b++) if (Xv(a, b) === xv) ys.add(Yv(a, b)); return ys.size > 1; }));
          const pv = pick ? Xv(D(pick[0]), D(pick[1])) : null;
          for (let a = 1; a <= n; a++) for (let b = 1; b <= n; b++) {
            const x0 = (a - 1) / n, y0 = (b - 1) / n, xv = Xv(a, b), [cx, tx] = colX(xv), [cy, ty] = colY(Yv(a, b));
            sX.rect(x0, y0, x0 + 1 / n, y0 + 1 / n, { fill: cx, fillAlpha: xv === pv ? 0.85 : tx, stroke: false });
            sX.text(String(xv), x0 + 0.5 / n, y0 + 0.5 / n, { size: n > 5 ? 12 : 14, align: 'center', color: 'ink', weight: 600 });
            sY.rect(x0, y0, x0 + 1 / n, y0 + 1 / n, { fill: cy, fillAlpha: xv === pv ? 0.85 : ty, stroke: false, hatch: split.has(xv) ? 'red' : false, hatchAlpha: 0.45 });
            sY.text(String(Yv(a, b)), x0 + 0.5 / n, y0 + 0.5 / n, { size: n > 5 ? 12 : 14, align: 'center', color: 'ink', weight: 600 });
          }
          // atom boundaries of σ(X) on both panels
          for (const S of [sX, sY]) {
            for (let a = 1; a <= n; a++) for (let b = 1; b <= n; b++) {
              const x0 = (a - 1) / n, y0 = (b - 1) / n, xv = Xv(a, b);
              if (a < n && Xv(a + 1, b) !== xv) S.line(x0 + 1 / n, y0, x0 + 1 / n, y0 + 1 / n, { color: 'ink', width: 2.2 });
              if (b < n && Xv(a, b + 1) !== xv) S.line(x0, y0 + 1 / n, x0 + 1 / n, y0 + 1 / n, { color: 'ink', width: 2.2 });
            }
            S.rect(0, 0, 1, 1, { color: 'ink', width: 2.2 });
          }
          if (pick) [sX, sY].forEach((S) => S.dot(pick[0], pick[1], { r: 4, color: 'ink' }));
          info = { kx: xvals.length, ky: yvals.length, split: split.size, pv };
        });
        v.readout(() => {
          const I = info, ok = I.split === 0;
          return `$X$ takes ${I.kx} values, so $\\sigma(X)$ has ${I.kx} atoms and $2^{${I.kx}}$ events. $Y$ takes ${I.ky} values. ` + (ok ? '$Y$ is constant on every atom of $\\sigma(X)$, so $\\sigma(Y)\\subset\\sigma(X)$ and $Y=f(X)$ for some $f$.' : `$Y$ splits ${I.split} atom${I.split > 1 ? 's' : ''} of $\\sigma(X)$ (hatched), so $Y$ is **not** $\\sigma(X)$-measurable: knowing $X$ does not determine $Y$.`) + (I.pv != null ? ` The highlighted atom is $\\{X=${I.pv}\\}$.` : '');
        });
      },
    },
    {
      num: '1.3.4',
      kind: 'Theorem',
      name: 'Compositions of measurable maps are measurable',
      statement: String.raw`If $X:(\Omega,\mathcal F)\to(S,\mathcal S)$ and $f:(S,\mathcal S)\to(T,\mathcal T)$ are measurable maps, then $f(X)=f\circ X$ is a measurable map from $(\Omega,\mathcal F)$ to $(T,\mathcal T)$. In particular, if $X$ is a random variable, so are $cX$, $X^2$, $\sin X$, $e^X$ and so on.`,
      idea: String.raw`For $B\in\mathcal T$, $\{\omega:f(X(\omega))\in B\}=\{\omega:X(\omega)\in f^{-1}(B)\}$. The set $f^{-1}(B)$ is in $\mathcal S$ because $f$ is measurable, and its preimage under $X$ is in $\mathcal F$ because $X$ is measurable. Preimages under a composition are iterated preimages, taken in reverse order.`,
      caption: String.raw`Step through the pullback. A target set $B$ (gold) sits on the $T$-axis of the graph of $f(s)=s^2$. First $f^{-1}(B)$ appears on the $S$-axis (orange), in two pieces. It is then carried to the $S$-axis of the graph of $X$ and pulled back to $\Omega$ (blue). The last step compares with the graph of $f\circ X$, where $(f\circ X)^{-1}(B)$ is computed directly: the two sets agree. Drag the ends of $B$ at any step.`,
      deps: ['prob-1.2.1a'],
      see: ['rca-1.7'],
      tags: ['random variables'],
      viz(v) {
        const f = (s) => s * s, X = (w) => 1.25 * Math.sin(3 * Math.PI * w) + 0.25 * Math.cos(5 * w);
        const sf = v.stage({ x: [-1.6, 1.6], y: [-0.1, 2.5], height: 290, axes: 'box', gutter: true, xlabel: '$s\\in S$', ylabel: '$f(s)$', title: '$f:S\\to T$', minWidth: 220 });
        const sX = v.stage({ x: [0, 1], y: [-1.6, 1.6], height: 290, axes: 'box', gutter: true, xlabel: '$\\omega$', ylabel: '$X(\\omega)\\in S$', title: '$X:\\Omega\\to S$', minWidth: 220 });
        const sc = v.stage({ x: [0, 1], y: [-0.1, 2.5], height: 290, axes: 'box', gutter: true, xlabel: '$\\omega$', ylabel: '$f(X(\\omega))$', title: '$f\\circ X:\\Omega\\to T$', minWidth: 220 });
        const hc = sf.handle(1.5, 0.5, { color: 'gold', r: 6, label: 'c', labelPos: 'w', constrain: (x, y) => [1.5, v.M.clamp(Math.min(y, hd.y - 0.05), 0, 2.4)] });
        const hd = sf.handle(1.5, 1.4, { color: 'gold', r: 6, label: 'd', labelPos: 'w', constrain: (x, y) => [1.5, v.M.clamp(Math.max(y, hc.y + 0.05), 0, 2.4)] });
        const S = v.steps({ frames: [
          { note: String.raw`A target set $B=(c,d]\subset T$.` },
          { note: String.raw`Step 1: $f^{-1}(B)\subset S$ is a Borel set because $f$ is measurable.` },
          { note: String.raw`Step 2: carry $f^{-1}(B)$ to the graph of $X$ and pull back: $X^{-1}(f^{-1}(B))\in\mathcal F$.` },
          { note: String.raw`Check: $(f\circ X)^{-1}(B)$, computed directly from $f\circ X$, is the same set.` },
        ], start: 3, still: 3 });
        let info = {};
        v.render(() => {
          const c = hc.y, d = hd.y, i = S.i, inB = (t) => t > c && t <= d;
          sf.hband(c, d, { color: 'gold', alpha: 0.15 });
          sf.fn(f, { color: 'ink', width: 2.4 });
          const fB = preimage((s) => inB(f(s)), -1.6, 1.6, 800);
          if (i >= 1) fB.forEach(([p, q]) => { sf.vband(p, q, { color: 'orange', alpha: 0.1 }); sf.line(p, -0.06, q, -0.06, { color: 'orange', width: 8, cap: 'butt' }); sf.fn(f, { domain: [p, q], color: 'orange', width: 4 }); });
          sX.fn(X, { color: 'ink', width: 2.4, n: 600 });
          const XfB = preimage((w) => inList(fB, X(w)) || fB.some(([p, q]) => X(w) === q), 0, 1, 1000);
          if (i >= 2) {
            fB.forEach(([p, q]) => sX.hband(p, q, { color: 'orange', alpha: 0.15 }));
            XfB.forEach(([p, q]) => { sX.line(p, -1.55, q, -1.55, { color: 'blue', width: 8, cap: 'butt' }); sX.fn(X, { domain: [p, q], color: 'blue', width: 4 }); });
          }
          sc.fn((w) => f(X(w)), { color: 'ink', width: 2.4, n: 600 });
          const direct = preimage((w) => inB(f(X(w))), 0, 1, 1000);
          if (i >= 3) { sc.hband(c, d, { color: 'gold', alpha: 0.15 }); direct.forEach(([p, q]) => { sc.line(p, -0.06, q, -0.06, { color: 'green', width: 8, cap: 'butt' }); sc.fn((w) => f(X(w)), { domain: [p, q], color: 'green', width: 4 }); }); }
          info = { i, a: lenOf(XfB), b: lenOf(direct), nf: fB.length, nx: XfB.length };
          v.legend([['gold', '$B$', { area: true }], ['orange', '$f^{-1}(B)$'], ['blue', '$X^{-1}(f^{-1}(B))$'], ['green', '$(f\\circ X)^{-1}(B)$']]);
        });
        v.readout(() => {
          const I = info;
          return `$f^{-1}(B)$ has ${I.nf} piece${I.nf === 1 ? '' : 's'}; $X^{-1}(f^{-1}(B))$ has ${I.nx}, of total length $${v.fix(I.a, 4)}$.` + (I.i >= 3 ? ` Directly, $P(f(X)\\in B)=${v.fix(I.b, 4)}$: the same.` : ' Step on to compare with $f\\circ X$.');
        });
      },
    },
    {
      num: '1.3.5',
      kind: 'Theorem',
      name: 'Measurable functions of several random variables',
      statement: String.raw`If $X_1,\dots,X_n$ are random variables and $f:(\R^n,\mathcal R^n)\to(\R,\mathcal R)$ is measurable, then $f(X_1,\dots,X_n)$ is a random variable.`,
      idea: String.raw`By Theorem 1.3.4 it suffices to show that the vector $(X_1,\dots,X_n)$ is a measurable map into $(\R^n,\mathcal R^n)$. For Borel sets $A_i$, $\{(X_1,\dots,X_n)\in A_1\times\cdots\times A_n\}=\bigcap_i\{X_i\in A_i\}\in\mathcal F$. The products $A_1\times\cdots\times A_n$ generate $\mathcal R^n$, so Theorem 1.3.1 finishes the proof.`,
      caption: String.raw`Two random variables on $\Omega=[0,1)$ trace a curve $\omega\mapsto(X_1(\omega),X_2(\omega))$ in the plane. Drag the corners of the rectangle $A_1\times A_2$. On the right, $\{X_1\in A_1\}$ and $\{X_2\in A_2\}$ are marked on $\Omega$, and their intersection is exactly the set of $\omega$ whose point lies in the rectangle (gold). Switch to the disc $\{x_1^2+x_2^2\le r^2\}$: it is filled from inside by dyadic squares, and the preimages of these finite unions of rectangles increase to the preimage of the disc.`,
      deps: ['prob-1.3.4', 'prob-1.3.1'],
      tags: ['random variables'],
      viz(v) {
        const mode = v.select('region', [{ value: 'rect', label: 'rectangle $A_1\\times A_2$' }, { value: 'disc', label: 'disc' }], 'rect');
        const rS = v.slider('$r$', 0.3, 1.25, 0.8, { step: 0.01 });
        const kS = v.slider('dyadic level $k$', 1, 7, 3, { int: true });
        const X1 = (w) => Math.sin(4 * Math.PI * w), X2 = (w) => Math.sin(6 * Math.PI * w + 0.6);
        const sP = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, height: 360, axes: true, weight: 1, minWidth: 280, title: 'the curve $\\omega\\mapsto(X_1(\\omega),X_2(\\omega))$' });
        const sO = v.stage({ x: [0, 1], y: [-3.4, 1.3], height: 360, axes: false, weight: 1.3, title: 'on $\\Omega=[0,1)$' });
        const P = sP.handle(-0.5, -0.2, { color: 'orange', r: 6, constrain: (x, y) => [Math.min(x, Q.x - 0.05), Math.min(y, Q.y - 0.05)] });
        const Q = sP.handle(0.6, 0.75, { color: 'orange', r: 6, constrain: (x, y) => [Math.max(x, P.x + 0.05), Math.max(y, P.y + 0.05)] });
        let info = {};
        v.render(() => {
          const md = mode.value, r = rS.value, k = kS.value;
          P.visible = Q.visible = md === 'rect'; rS.el.hidden = kS.el.hidden = md !== 'disc';
          const a1 = P.x, a2 = P.y, b1 = Q.x, b2 = Q.y;
          const side = 2 ** (1 - k);
          const inSq = (x, y) => { const i = Math.floor(x / side), j = Math.floor(y / side); return [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]].every(([p, q]) => (p * side) ** 2 + (q * side) ** 2 <= r * r); };
          const inR = md === 'rect' ? (x, y) => x > a1 && x <= b1 && y > a2 && y <= b2 : (x, y) => x * x + y * y <= r * r;
          if (md === 'rect') {
            sP.rect(a1, a2, b1, b2, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 2 });
            sP.vband(a1, b1, { color: 'blue', alpha: 0.06 }); sP.hband(a2, b2, { color: 'red', alpha: 0.06 });
          } else {
            const M = Math.ceil(1.4 / side);
            for (let i = -M; i < M; i++) for (let j = -M; j < M; j++) { const x0 = i * side, y0 = j * side; if (inSq(x0 + side / 2, y0 + side / 2)) sP.rect(x0, y0, x0 + side, y0 + side, { fill: 'green', fillAlpha: 0.22, color: 'panel', width: 0.6 }); }
            sP.circle(0, 0, r, { color: 'orange', width: 2 });
          }
          const N = 1500, pts = [];
          for (let i = 0; i <= N; i++) { const w = i / N; pts.push([X1(w), X2(w)]); }
          sP.path(pts, { color: 'ink', width: 1.2, alpha: 0.5 });
          const runs = preimage((w) => inR(X1(w), X2(w)), 0, 1, 1200);
          runs.forEach(([p, q]) => sP.curve((t) => [X1(t), X2(t)], p, q, { color: 'gold', width: 3.2, n: 120 }));
          // Ω panel
          sO.fn((w) => 0.5 + 0.35 * X1(w), { color: 'blue', width: 1.8, n: 600 }); sO.fn((w) => -0.5 + 0.35 * X2(w), { color: 'red', width: 1.8, n: 600 });
          sO.text('X₁', 0.005, 0.95, { size: 12, color: 'blue', weight: 600 }); sO.text('X₂', 0.005, -0.05, { size: 12, color: 'red', weight: 600 });
          const row = (y, R, col, lab) => { sO.text(lab, 0.005, y + 0.22, { size: 11, color: col, weight: 600 }); sO.line(0, y, 1, y, { color: 'faint', width: 1 }); R.forEach(([p, q]) => sO.line(p, y, q, y, { color: col, width: 8, cap: 'butt' })); };
          let res;
          if (md === 'rect') {
            const R1 = preimage((w) => X1(w) > a1 && X1(w) <= b1, 0, 1, 1200), R2 = preimage((w) => X2(w) > a2 && X2(w) <= b2, 0, 1, 1200);
            sO.hband(0.5 + 0.35 * a1, 0.5 + 0.35 * b1, { color: 'blue', alpha: 0.08 }); sO.hband(-0.5 + 0.35 * a2, -0.5 + 0.35 * b2, { color: 'red', alpha: 0.08 });
            row(-1.45, R1, 'blue', '{X₁ ∈ A₁}'); row(-2.15, R2, 'red', '{X₂ ∈ A₂}'); row(-2.95, runs, 'gold', '{X₁ ∈ A₁} ∩ {X₂ ∈ A₂} = {(X₁, X₂) ∈ A₁ × A₂}');
            res = { p1: lenOf(R1), p2: lenOf(R2), p: lenOf(runs) };
          } else {
            const Rk = preimage((w) => inSq(X1(w), X2(w)), 0, 1, 1500);
            row(-1.8, Rk, 'green', `{(X₁, X₂) ∈ D_k}, union of level-${k} squares`); row(-2.8, runs, 'gold', '{(X₁, X₂) ∈ D}, the disc');
            res = { pk: lenOf(Rk), p: lenOf(runs) };
          }
          info = { md, k, ...res };
          v.legend([['ink', 'the curve'], ['gold', 'points inside the region and their $\\omega$']]);
        });
        v.readout(() => {
          const I = info;
          if (I.md === 'rect') return `$P(X_1\\in A_1)=${v.fix(I.p1, 4)}$, $P(X_2\\in A_2)=${v.fix(I.p2, 4)}$, and $P((X_1,X_2)\\in A_1\\times A_2)=P(\\{X_1\\in A_1\\}\\cap\\{X_2\\in A_2\\})=${v.fix(I.p, 4)}$: an intersection of two events.`;
          return `Squares at level ${I.k}: $P((X_1,X_2)\\in D_k)=${v.fix(I.pk, 4)}\\uparrow P((X_1,X_2)\\in D)=${v.fix(I.p, 4)}$ as $k$ grows. Each $D_k$ is a finite union of rectangles, so its preimage is an event, and so is the increasing union.`;
        });
      },
    },
    {
      num: '1.3.6',
      kind: 'Theorem',
      name: 'Sums of random variables are random variables',
      statement: String.raw`If $X_1,\dots,X_n$ are random variables, then $X_1+\cdots+X_n$ is a random variable.`,
      idea: String.raw`By Theorem 1.3.5 it suffices that $f(x)=x_1+\cdots+x_n$ is Borel measurable. By Theorem 1.3.1 with the generators of Example 1.3.2, it suffices that $\{x:x_1+\cdots+x_n<a\}$ is Borel, and it is, being open. For $n=2$ one can also argue directly (Exercise 1.3.2): $\{X+Y<a\}=\bigcup_{q\in\Q}\{X<q\}\cap\{Y<a-q\}$, a countable union of events, because whenever $x+y<a$ there is a rational $q$ with $x<q<a-y$.`,
      caption: String.raw`Each dot is a sample $(X(\omega),Y(\omega))$ of a correlated normal pair. The event $\{X+Y<a\}$ is the half-plane below the green line. The orange staircase is the union of the quadrants $\{X<q\}\cap\{Y<a-q\}$ over the rationals $q=j/m$ in $[-4,4]$. Raise $m$: the samples in the half-plane that the staircase misses (red) disappear, and the fraction inside the union climbs to $P(X+Y<a)$, given exactly in the readout.`,
      deps: ['prob-1.3.5'],
      tags: ['random variables'],
      viz(v) {
        const aS = v.slider('$a$', -2, 2, 0.5, { step: 0.05 });
        const mS = v.slider('rationals $q=j/m$, $m=$', 1, 24, 2, { int: true });
        const rho = v.slider('correlation $\\rho$', -0.8, 0.9, 0.4, { step: 0.05 });
        const s = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, height: 400, axes: true });
        const r = v.rng(606), Z = Array.from({ length: 1500 }, () => [r.normal(), r.normal()]);
        let info = {};
        v.render(() => {
          const a = aS.value, m = mS.value, p = rho.value, B = s.bounds;
          const pts = Z.map(([z1, z2]) => [z1, p * z1 + Math.sqrt(1 - p * p) * z2]);
          s.poly([[B.x[0] - 1, a - B.x[0] + 1], [B.x[1] + 1, a - B.x[1] - 1], [B.x[1] + 1, B.y[0] - 1], [B.x[0] - 1, B.y[0] - 1]], { fill: 'green', fillAlpha: 0.08, stroke: false });
          const qs = []; for (let j = -4 * m; j <= 4 * m; j++) qs.push(j / m);
          const st = [[B.x[0] - 1, a - qs[0]]];
          qs.forEach((q, i) => { st.push([q, a - q]); if (i + 1 < qs.length) st.push([q, a - qs[i + 1]]); });
          st.push([qs[qs.length - 1], B.y[0] - 1], [B.x[0] - 1, B.y[0] - 1]);
          s.poly(st, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.6 });
          s.line(B.x[0], a - B.x[0], B.x[1], a - B.x[1], { color: 'green', width: 2.4 });
          const inU = (x, y) => { const j = Math.floor(x * m) + 1, q = j / m; return q <= 4 && y < a - q; };
          const out = [], ins = [], miss = [];
          pts.forEach(([x, y]) => { if (x + y >= a) out.push([x, y]); else if (inU(x, y)) ins.push([x, y]); else miss.push([x, y]); });
          s.dots(out, { r: 1.8, color: 'muted', alpha: 0.55 }); s.dots(ins, { r: 2.2, color: 'gold' }); s.dots(miss, { r: 3.4, color: 'red' });
          if (m <= 4) qs.filter((q) => Math.abs(q) <= 3.3 && Math.abs(a - q) <= 3.3).forEach((q) => s.dot(q, a - q, { r: 2.5, color: 'orange' }));
          info = { a, m, p, n: pts.length, hp: ins.length + miss.length, u: ins.length, miss: miss.length };
          v.legend([['green', '$\\{X+Y<a\\}$', { area: true }], ['orange', '$\\bigcup_q\\{X<q\\}\\cap\\{Y<a-q\\}$', { area: true }], ['red', 'missed by the union', { dot: true }]]);
        });
        v.readout(() => {
          const I = info, ex = v.M.dist.normal(0, Math.sqrt(2 + 2 * I.p)).cdf(I.a);
          return `$P(X+Y<a)=\\Phi\\big(a/\\sqrt{2+2\\rho}\\big)=${v.fix(ex, 4)}$. Samples: ${I.hp}/${I.n} $=${v.fix(I.hp / I.n, 4)}$ in the half-plane, ${I.u}/${I.n} $=${v.fix(I.u / I.n, 4)}$ in the union over $q\\in\\tfrac1{${I.m}}\\Z$; ${I.miss} still missed. Every point of the half-plane is caught once $m$ is large enough.`;
        });
      },
    },
    {
      num: '1.3.7',
      kind: 'Theorem',
      name: 'inf, sup, lim sup and lim inf of random variables',
      statement: String.raw`If $X_1,X_2,\dots$ are random variables, then so are
$$\inf_nX_n,\qquad\sup_nX_n,\qquad\limsup_{n\to\infty}X_n,\qquad\liminf_{n\to\infty}X_n,$$
as maps into the extended line $\R^*=[-\infty,\infty]$ with its Borel sets. Consequently $\Omega_o=\{\omega:\lim_nX_n(\omega)\text{ exists}\}=\{\limsup_nX_n-\liminf_nX_n=0\}$ is an event.`,
      idea: String.raw`The infimum of a sequence is $<a$ exactly when some term is $<a$, so $\{\inf_nX_n<a\}=\bigcup_n\{X_n<a\}\in\mathcal F$, and the half-lines generate the Borel sets (Theorem 1.3.1). For the supremum use $\{\sup_nX_n>a\}=\bigcup_n\{X_n>a\}$. Then $\liminf_nX_n=\sup_n\big(\inf_{m\ge n}X_m\big)$ and $\limsup_nX_n=\inf_n\big(\sup_{m\ge n}X_m\big)$: each $\inf_{m\ge n}X_m$ is a random variable by the first step, and so is the supremum of these.`,
      caption: String.raw`A sequence of functions $X_n$ on $\Omega=[0,1)$, with $X_n$ in gold and a few earlier terms faint. The tail envelopes $\sup_{m\ge n}X_m$ (red) and $\inf_{m\ge n}X_m$ (blue) squeeze onto $\limsup$ and $\liminf$ (dashed) as $n$ grows. Where they meet, $\lim X_n$ exists; on the shaded part of the $\omega$-axis $X_n$ keeps oscillating. In the second view, $\{\inf_mX_m<a\}$ is built as the union of the sets $\{X_m<a\}$, one row each.`,
      deps: ['prob-1.3.1'],
      see: ['rca-1.14'],
      tags: ['random variables', 'limits'],
      viz(v) {
        const mode = v.select('', [{ value: 'env', label: 'tail envelopes' }, { value: 'inf', label: '$\\{\\inf X_m<a\\}$ as a union' }], 'env');
        const nS = v.slider('$n$', 1, 60, 6, { int: true });
        const aS = v.slider('$a$', -1, 0.6, -0.35, { step: 0.01 });
        const mid = (w) => 0.35 * Math.sin(2 * Math.PI * w), wob = (w) => (w > 0.2 && w < 0.7 ? 0.45 * Math.sin((Math.PI * (w - 0.2)) / 0.5) : 0);
        const X = (n, w) => mid(w) + (n % 2 ? -1 : 1) * wob(w) + 0.8 * Math.pow(n, -0.6) * Math.sin(2.7 * n + 7 * w);
        const s = v.stage({ x: [0, 1], y: [-1.45, 1.6], height: 300, axes: 'box', gutter: true, xlabel: '$\\omega$', full: true });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 170, axes: false, gutter: { l: 42, r: 12, t: 4, b: 4 }, full: true });
        const G = 400, ws = Array.from({ length: G + 1 }, (_, i) => i / G), MMAX = 500;
        let cache = {};
        const env = (n) => { if (cache[n]) return cache[n]; const sup = [], inf = []; ws.forEach((w) => { let hi = -Infinity, lo = Infinity; for (let m = n; m <= MMAX; m++) { const y = X(m, w); if (y > hi) hi = y; if (y < lo) lo = y; } sup.push([w, hi]); inf.push([w, lo]); }); return (cache[n] = { sup, inf }); };
        let info = {};
        v.render(() => {
          const md = mode.value, n = nS.value; aS.el.hidden = md !== 'inf';
          s.vband(0.2, 0.7, { color: 'orange', alpha: 0.07 });
          for (let m = Math.max(1, n - 5); m < n; m++) s.fn((w) => X(m, w), { color: 'muted', width: 1, alpha: 0.5 });
          s.fn((w) => X(n, w), { color: 'gold', width: 2.6 });
          if (md === 'env') {
            const E = env(n);
            s.path(E.sup, { color: 'red', width: 2.2 }); s.path(E.inf, { color: 'blue', width: 2.2 });
            s.fn((w) => mid(w) + wob(w), { color: 'red', width: 1.4, dash: [5, 4] }); s.fn((w) => mid(w) - wob(w), { color: 'blue', width: 1.4, dash: [5, 4] });
            const gap = Math.max(...E.sup.map((p, i) => p[1] - E.inf[i][1] - 2 * wob(p[0])));
            sR.line(0, 0.5, 1, 0.5, { color: 'green', width: 10, cap: 'butt' }); sR.line(0.2, 0.5, 0.7, 0.5, { color: 'orange', width: 10, cap: 'butt' });
            sR.text('Ω₀ = {lim Xₙ exists} (green), its complement {lim sup > lim inf} (orange): both are events', 0.0, 0.82, { size: 12, color: 'muted' });
            sR.text('P(Ω₀) = 0.5', 0.0, 0.2, { size: 12, color: 'green', weight: 600 });
            info = { md, n, gap };
            v.legend([['gold', '$X_n$'], ['red', '$\\sup_{m\\ge n}X_m$ and $\\limsup$ (dashed)'], ['blue', '$\\inf_{m\\ge n}X_m$ and $\\liminf$ (dashed)']]);
          } else {
            const a = aS.value; s.hline(a, { color: 'purple', width: 1.6, dash: [5, 3] });
            const K = Math.min(n, 9), rowH = 0.8 / (K + 2), rows = [];
            let U = [];
            for (let m = 1; m <= n; m++) { const P = preimage((w) => X(m, w) < a, 0, 1, 800); U = U.concat(P); if (m > n - K) rows.push([m, P]); }
            rows.forEach(([m, P], i) => { const y = 0.95 - (i + 0.5) * rowH; sR.text(`{X${String(m).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[c]).join('')} < a}`, 0, y, { size: 10, color: 'muted' }); P.forEach(([p, q]) => sR.line(Math.max(p, 0.1), y, q, y, { color: 'purple', width: 4, cap: 'butt', alpha: q > 0.1 ? 1 : 0 })); });
            const yU = 0.95 - (K + 0.6) * rowH, yT = 0.95 - (K + 1.5) * rowH;
            const unionM = preimage((w) => { for (let m = 1; m <= n; m++) if (X(m, w) < a) return true; return false; }, 0, 1, 800);
            const all = preimage((w) => { for (let m = 1; m <= MMAX; m++) if (X(m, w) < a) return true; return false; }, 0, 1, 600);
            sR.text(`⋃ m ≤ ${n}`, 0, yU, { size: 10, color: 'gold', weight: 600 }); unionM.forEach(([p, q]) => sR.line(Math.max(p, 0.1), yU, q, yU, { color: 'gold', width: 6, cap: 'butt' }));
            sR.text('{inf Xₘ < a}', 0, yT, { size: 10, color: 'green', weight: 600 }); all.forEach(([p, q]) => sR.line(Math.max(p, 0.1), yT, q, yT, { color: 'green', width: 6, cap: 'butt' }));
            info = { md, n, a, pu: lenOf(unionM), pa: lenOf(all) };
            v.legend([['gold', '$X_n$'], ['purple', '$\\{X_m<a\\}$'], ['green', '$\\{\\inf_mX_m<a\\}$']]);
          }
        });
        v.readout(() => {
          const I = info;
          if (I.md === 'env') return `At $n=${I.n}$ the envelopes are within $${v.fix(Math.max(0, I.gap), 3)}$ of $\\limsup$ and $\\liminf$. These limits differ exactly on $(0.2,0.7)$, where $X_n$ alternates; the event $\\Omega_o$ where $\\lim X_n$ exists has probability $0.5$.`;
          return `$P\\big(\\bigcup_{m\\le ${I.n}}\\{X_m<a\\}\\big)=${v.fix(I.pu, 4)}\\uparrow P(\\inf_mX_m<a)=${v.fix(I.pa, 4)}$: the event $\\{\\inf_mX_m<a\\}$ is a countable union of events.`;
        });
      },
    },
    {
      num: '1.3.7a',
      kind: 'Definition',
      name: 'Almost sure convergence',
      statement: String.raw`A sequence of random variables $X_n$ **converges almost surely** (a.s.; "almost everywhere" in measure theory) if $P(\Omega_o)=1$, where $\Omega_o=\{\omega:\lim_nX_n(\omega)\text{ exists}\}$ is the event of Theorem 1.3.7. The limit can then be taken to be $X_\infty=\limsup_nX_n$, a random variable that may take the values $\pm\infty$; one writes $X_n\to X_\infty$ a.s.`,
      idea: String.raw`Almost sure convergence ignores a null set of outcomes but asks each remaining path $n\mapsto X_n(\omega)$ to settle: for every $\eps>0$ it eventually stays within $\eps$ of its limit. Theorem 1.3.7 makes the set of good $\omega$ an event, so its probability makes sense. Borel's normal number theorem, the first strong law, says that the running fraction of 1s among the binary digits of a uniform $\omega$ tends to $\tfrac12$ for almost every $\omega$, though not for all of them. In contrast, the "typewriter" indicators of dyadic intervals sweeping across $[0,1)$ satisfy $P(X_n\neq0)\to0$, yet converge for no $\omega$ at all.`,
      caption: String.raw`Each line is a path $n\mapsto X_n(\omega)$ for one of 60 random $\omega$ ($n$ on a log scale). A path is green if it stays inside the $\eps$-band around its limit for every $n$ from $N/2$ to $N$, and red otherwise; the strip below places each $\omega$ in $[0,1)$. Binary digit averages converge for almost every $\omega$, and $\omega^n$ converges for every $\omega$ (to $0$, except at $\omega=1$), though paths near $1$ take long to settle. The typewriter sequence converges for none, even though $P(X_n\ne0)\to0$.`,
      deps: ['prob-1.3.7'],
      verify: true,
      tags: ['convergence'],
      viz(v) {
        const mode = v.select('$X_n(\\omega)$', [{ value: 'bin', label: 'fraction of 1s in the first $n$ binary digits' }, { value: 'pow', label: '$\\omega^n$' }, { value: 'tw', label: 'typewriter' }], 'bin');
        const eS = v.slider('$\\eps$', 0.01, 0.3, 0.04, { step: 0.005 });
        const NS = v.slider('horizon $N$', 50, 4000, 1000, { log: true, int: true });
        const s = v.stage({ x: [1, 4000], xlog: true, y: [-0.05, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$n$', full: true });
        const sO = v.stage({ x: [0, 1], y: [0, 1], height: 90, axes: false, gutter: { l: 42, r: 12, t: 4, b: 4 }, full: true });
        const r = v.rng(1909), K = 60, NM = 4000;
        const paths = Array.from({ length: K }, () => { const bits = new Uint8Array(NM); let w = 0; for (let i = 0; i < NM; i++) { bits[i] = r() < 0.5 ? 1 : 0; if (i < 50) w += bits[i] * 2 ** -(i + 1); } const avg = new Float32Array(NM + 1); let c = 0; for (let i = 0; i < NM; i++) { c += bits[i]; avg[i + 1] = c / (i + 1); } return { w, avg }; });
        const idx = Array.from(new Set(Array.from({ length: 260 }, (_, i) => Math.round(Math.pow(NM, i / 259))))).filter((n) => n >= 1);
        const twHits = (w, N) => { const out = []; for (let k = 0; 2 ** k <= N; k++) { const n = 2 ** k + Math.floor(w * 2 ** k); if (n <= N) out.push(n); } return out; };
        let info = {};
        v.render(() => {
          const md = mode.value, e = eS.value, N = NS.value;
          s.setView([1, N], md === 'pow' ? [-0.05, 1.05] : [-0.05, 1.05]);
          const L = md === 'bin' ? 0.5 : 0;
          s.hband(L - e, L + e, { color: 'green', alpha: 0.1, edges: true });
          s.vband(N / 2, N, { color: 'muted', alpha: 0.06 });
          let good = 0; const status = [];
          paths.forEach((P, k) => {
            let ok, pts;
            if (md === 'bin') { ok = true; for (let n = Math.ceil(N / 2); n <= N; n++) if (Math.abs(P.avg[n] - 0.5) >= e) { ok = false; break; } pts = idx.filter((n) => n <= N).map((n) => [n, P.avg[n]]); }
            else if (md === 'pow') { ok = Math.pow(P.w, Math.ceil(N / 2)) < e; pts = idx.filter((n) => n <= N).map((n) => [n, Math.pow(P.w, n)]); }
            else { const H = twHits(P.w, N); ok = !H.some((n) => n >= N / 2); pts = []; const jit = 0.012 * (k / K - 0.5); H.forEach((n) => pts.push([Math.max(1, n - 0.5), jit], [n, 1 + jit], [n + 0.5, jit], null)); if (!pts.length) pts = [[1, jit], [N, jit]]; else pts.unshift([1, jit]); }
            if (ok) good++; status.push([P.w, ok]);
            s.path(pts.filter((p) => !p || p[0] <= N), { color: ok ? 'green' : 'red', width: 1.1, alpha: 0.55 });
          });
          sO.line(0, 0.45, 1, 0.45, { color: 'faint', width: 1 });
          [0, 0.25, 0.5, 0.75, 1].forEach((t) => sO.text(String(t), t, 0.1, { size: 10, align: t === 0 ? 'left' : t === 1 ? 'right' : 'center', color: 'muted' }));
          status.forEach(([w, ok]) => sO.dot(w, 0.45, { r: 4, color: ok ? 'green' : 'red' }));
          sO.text('ω ∈ [0, 1)', 0, 0.85, { size: 11, color: 'muted' });
          info = { md, good, N, e };
          v.legend([['green', 'settled in the $\\eps$-band on $[N/2,N]$'], ['red', 'not (yet) settled']]);
        });
        v.readout(() => {
          const I = info, th = { bin: '$P(\\Omega_o)=1$: the limit $\\tfrac12$ holds for almost every $\\omega$ (Borel), so the green fraction tends to $1$ as $N$ grows.', pow: '$\\omega^n\\to0$ for every $\\omega<1$, so the convergence is almost sure, but not uniform: paths with $\\omega$ near $1$ settle late.', tw: 'Every $\\omega$ is hit once in every sweep, so $X_n(\\omega)=1$ infinitely often and $=0$ infinitely often: $P(\\Omega_o)=0$, although $P(X_n\\ne0)\\to0$.' }[I.md];
          return `${I.good} of 60 paths stay within $\\eps=${v.fix(I.e, 3)}$ of the limit on $[N/2,N]$ with $N=${I.N}$. ` + th;
        });
      },
    },
  ],
};
