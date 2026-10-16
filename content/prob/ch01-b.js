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
          if (md !== lastView) { lastView = md; sB.setLabels(md === 'ratio' ? '$x$' : md === 'up' ? '$z$' : '$y$', null); }
          if (md === 'ratio') {
            sB.setView([0.25, 6], [-1, 3]); sB.setTitle('ratios to the exact tail');
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
          sH.text('(3/2)^k', 1.01, 1.5 ** k, { size: 11, align: 'right', baseline: 'bottom', dy: -2 });
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
  ],
};
