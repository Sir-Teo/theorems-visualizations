// Rudin, Real and Complex Analysis — Chapter 19 (part 2): quasi-analytic classes and the Denjoy–Carleman theorem
//
// 19.11 is Rudin's number for the Denjoy–Carleman theorem. The numbers of the definition (19.5) and of the
// statement that C{n!} is quasi-analytic (19.6) could not be confirmed and carry `verify: true`.

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;

/** Phase-portrait colour of w = re + i im (hue = arg, light bands = log2|w|), or `bg` when not finite. */
function phaseRGB(M, re, im, bg) {
  if (!isFinite(re) || !isFinite(im)) return bg;
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
/** A small "×" marking a singular point, with a halo so it reads on top of a phase portrait. */
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
/** log(x!) for real x ≥ 0 (shifted Stirling series). */
function logFact(x) {
  let shift = 0;
  while (x < 15) { x += 1; shift += Math.log(x); }
  return x * Math.log(x) - x + 0.5 * Math.log(TAU * x) + 1 / (12 * x) - 1 / (360 * x * x * x) - shift;
}
/** Generalised Laguerre L_k^{(1)}(u) by the three-term recurrence. */
function lag1(k, u) {
  if (k === 0) return 1;
  let a = 1, b = 2 - u;
  for (let j = 1; j < k; j++) { const c = ((2 * j + 2 - u) * b - (j + 1) * a) / (j + 1); a = b; b = c; }
  return b;
}
/** n-th derivative of e^{-1/x} (x > 0): (-1)^{n+1}(n-1)! u^{n+1} L_{n-1}^{(1)}(u) e^{-u}, u = 1/x. */
function dFlat(n, x) {
  const u = 1 / x;
  if (n === 0) return Math.exp(-u);
  const L = lag1(n - 1, u);
  if (L === 0) return 0;
  const lg = logFact(n - 1) + (n + 1) * Math.log(u) + Math.log(Math.abs(L)) - u;
  return (n % 2 ? 1 : -1) * Math.sign(L) * Math.exp(lg);
}
/** n-th derivative of 1/(1+x^2) = Im 1/(x-i): (-1)^n n! Im (x-i)^{-n-1}. */
function dCauchy(n, x) {
  const r = Math.hypot(x, 1), th = Math.atan2(-1, x);
  return (n % 2 ? -1 : 1) * Math.exp(logFact(n) - (n + 1) * Math.log(r)) * Math.sin(-(n + 1) * th);
}

// ---- Denjoy–Carleman sequences: increments d(n) = log M_n - log M_{n-1} (real n ≥ 1) and log M_n
const LL = (x) => Math.log(Math.log(x + Math.E));
function dcSequence(kind, s) {
  const p = kind === 'log1' ? 1 : kind === 'log2' ? 2 : 0;
  const ss = kind === 'pow' ? s : 1;
  const d = (n) => ss * Math.log(n) + (p ? p * (LL(n - 1) + n * Math.log1p(Math.log1p(1 / (n - 1 + Math.E)) / Math.log(n - 1 + Math.E))) : 0);
  const logM = (n) => ss * logFact(n) + p * n * LL(n);
  return { d, logM };
}
/**
 * Partial sums (d) Σ M_n^{-1/n}, (e) Σ M_{n-1}/M_n and the integral (c) ∫_0^{x_N} log q(x) dx/(1+x²), x_N = M_N/M_{N-1},
 * sampled at log-spaced N: exact up to N0 = 1e5, then continued to 1e9 by the Euler–Maclaurin integral.
 */
function dcSums(kind, s) {
  const { d, logM } = dcSequence(kind, s);
  const N0 = 100000;
  const marks = new Set(); for (let j = 0; j <= 150; j++) marks.add(Math.round(10 ** (j / 30)));
  const out = [];
  let lM = 0, Sd = 0, Se = 0, Ic = 0, convex = true, prevD = -Infinity, prevLM = 0;
  for (let n = 1; n <= N0; n++) {
    const dn = d(n);
    if (dn < prevD - 1e-12) convex = false;
    prevLM = lM; lM += dn;
    Sd += Math.exp(-lM / n); Se += Math.exp(-dn);
    if (n >= 2) { // piece of (c) on [x_{n-1}, x_n], where log q(x) = (n-1) log x - log M_{n-1}
      const m = n - 1, a = prevD, b = dn;
      if (Math.exp(a) < 30) {
        const K = 24, h = (b - a) / K; let acc = 0;
        for (let k = 0; k <= K; k++) { const lx = a + h * k, x = Math.exp(lx); acc += (k === 0 || k === K ? 1 : k % 2 ? 4 : 2) * (m * lx - prevLM) * x / (1 + x * x); }
        Ic += acc * h / 3;
      } else {
        const F = (lx) => (m * lx + m - prevLM) * Math.exp(-lx);
        Ic += F(a) - F(b);
      }
    }
    prevD = dn;
    if (marks.has(n)) out.push([Math.log10(n), Sd, Se, Ic]);
  }
  // Euler–Maclaurin continuation in u = log n
  const ad = (n) => Math.exp(-logM(n) / n), ae = (n) => Math.exp(-d(n));
  const Fc = (n) => Math.exp(-d(n)) * (n * d(n) + n - logM(n));
  const u0 = Math.log(N0), u1 = Math.log(1e9), du = 0.05;
  let Id = 0, Ie = 0;
  const Sd0 = Sd, Se0 = Se, Ic0 = Ic, F0 = Fc(N0);
  for (let u = u0; u < u1 - 1e-9; u += du) {
    const g = (fn, uu) => fn(Math.exp(uu)) * Math.exp(uu);
    Id += du / 6 * (g(ad, u) + 4 * g(ad, u + du / 2) + g(ad, u + du));
    Ie += du / 6 * (g(ae, u) + 4 * g(ae, u + du / 2) + g(ae, u + du));
    const N = Math.exp(u + du);
    const sd = Sd0 + Id + (ad(N) - ad(N0)) / 2, se = Se0 + Ie + (ae(N) - ae(N0)) / 2;
    out.push([(u + du) / Math.LN10, sd, se, Ic0 + (se - Se0) + F0 - Fc(N)]);
  }
  const lam = []; for (let k = 1; k <= 120; k++) lam.push(Math.exp(-d(k)));
  return { pts: out, convex, lam, logM };
}

export default {
  collection: 'rca',
  chapter: 19,
  items: [
    // ------------------------------------------------------------------ quasi-analytic classes
    {
      num: '19.5',
      kind: 'Definition',
      name: 'The classes C{Mₙ}; quasi-analytic classes',
      verify: true,
      statement: String.raw`Let $M_0,M_1,M_2,\dots$ be positive numbers. $C\{M_n\}$ is the class of all $f\in C^\infty(\R)$ for which there are constants $\beta_f$ and $B_f$, depending on $f$ but not on $n$, with
$$\|D^nf\|_\infty\le\beta_f\,B_f^{\,n}\,M_n\qquad(n=0,1,2,\dots);$$
here $D^nf$ is the $n$-th derivative of $f$ and $\|\cdot\|_\infty$ is the supremum norm on $\R$.

A class $C\subset C^\infty(\R)$ is **quasi-analytic** if the only $f\in C$ with $(D^nf)(0)=0$ for every $n\ge0$ is $f\equiv0$. Because $C\{M_n\}$ is a vector space and is invariant under translations, $C\{M_n\}$ is quasi-analytic exactly when any two of its members whose derivatives of all orders agree at one point coincide everywhere.`,
      idea: String.raw`Holomorphic functions are rigid — by the identity theorem a function is determined by its germ at one point — and real-analytic functions obey bounds $\|D^nf\|\le\beta B^nn!$; such bounds by themselves already force rigidity (19.6). Plain $C^\infty$ is not rigid at all: $e^{-1/x}$, extended by $0$ for $x\le0$, has every derivative equal to $0$ at the origin. Its derivatives grow roughly like $(2n)!\approx4^n(n!)^2$, so it lies in $C\{(n!)^2\}$, which is therefore *not* quasi-analytic. How fast $M_n$ may grow before rigidity is lost is exactly what the Denjoy–Carleman theorem 19.11 decides.`,
      caption: String.raw`Pick a function and raise the Taylor degree $N$. Left: $f$ (ink), its Taylor polynomial $T_N$ at $0$ (gold) and, when there is one, a *different* function with the same derivatives of every order at $0$ (blue, dashed). Right: the constant $B_n=(\|D^nf\|_\infty/M_n)^{1/n}$ that the order-$n$ inequality demands, for $M_n=n!$ and for $M_n=(n!)^2$, computed from exact formulas for $D^nf$; a bounded sequence means $f$ belongs to the class. $\frac1{1+x^2}$ lies in $C\{n!\}$; the flat function $e^{-1/x}$ escapes $C\{n!\}$ but sits in $C\{(n!)^2\}$, so that larger class cannot be quasi-analytic.`,
      deps: ['pma-5.14'],
      see: ['rca-10.18a', 'pma-5.15', 'pma-8.5'],
      tags: ['quasi-analytic', 'smooth functions'],
      viz(v) {
        const NMAX = 24;
        // sup norms of D^n f on a grid: x > 0 via u = 1/x (log-spaced), x ≤ 0 linear
        const XP = []; for (let i = 0; i < 5000; i++) XP.push(1 / Math.exp(Math.log(0.004) + (Math.log(1500) - Math.log(0.004)) * i / 4999));
        const XN = v.M.linspace(-30, 0, 3000);
        const sup = { analytic: [], flat: [], twin: [] };
        for (let n = 0; n <= NMAX; n++) {
          let a = 0, fl = 0, tw = 0;
          for (const x of XN) { const c = Math.abs(dCauchy(n, x)); a = Math.max(a, c); tw = Math.max(tw, c); }
          for (const x of XP) { const c = dCauchy(n, x), q = dFlat(n, x); a = Math.max(a, Math.abs(c)); fl = Math.max(fl, Math.abs(q)); tw = Math.max(tw, Math.abs(c + q)); }
          sup.analytic.push(a); sup.flat.push(fl); sup.twin.push(tw);
        }
        const Bn = (arr, sq) => arr.map((m, n) => (n === 0 ? null : [n, Math.exp((Math.log(m) - (sq ? 2 : 1) * logFact(n)) / n)])).filter(Boolean);
        const f1 = (x) => 1 / (1 + x * x), f2 = (x) => (x > 0 ? Math.exp(-1 / x) : 0);
        const MODES = {
          analytic: { label: String.raw`$f=\frac{1}{1+x^2}$`, f: f1, g: null, taylor: true },
          flat: { label: String.raw`$f=e^{-1/x}\ (x>0)$`, f: f2, g: () => 0, taylor: false },
          twin: { label: String.raw`$f=\frac{1}{1+x^2}+e^{-1/x}$`, f: (x) => f1(x) + f2(x), g: f1, taylor: true },
        };
        const mode = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'flat');
        const Nsl = v.slider('Taylor degree $N$ at $0$', 0, 30, 10, { int: true });
        const L = v.stage({ x: [-2.2, 3.6], y: [-0.5, 1.75], height: 320, xlabel: 'x', title: 'the function, its Taylor polynomial at 0, and a twin' });
        const R = v.stage({ x: [0.3, NMAX + 0.7], y: [0, 10], height: 320, axes: 'box', xlabel: 'n', title: String.raw`$B_n=\big(\|D^nf\|_\infty/M_n\big)^{1/n}$` });
        const T = (N) => (x) => { let s = 0, p = 1; for (let k = 0; 2 * k <= N; k++) { s += (k % 2 ? -1 : 1) * p; p *= x * x; } return s; };
        let st = null;
        v.render(() => {
          const Mo = MODES[mode.value], N = Nsl.value;
          // left
          if (Mo.taylor && mode.value === 'analytic') L.vband(-1, 1, { color: 'green', alpha: 0.09, edges: true });
          if (Mo.g) L.between((x) => Mo.f(x), (x) => Mo.g(x), 0.001, 3.6, { fill: 'red', fillAlpha: 0.16, n: 300 });
          L.fn(Mo.f, { color: 'ink', width: 2.6 });
          if (Mo.g) L.fn(Mo.g, { color: 'blue', width: 2.2, dash: [7, 5] });
          L.fn(Mo.taylor ? T(N) : () => 0, { color: 'gold', width: 2.2 });
          L.dot(0, Mo.f(0), { color: 'ink', r: 4.5 });
          L.tex(`T_{${N}}`, mode.value === 'flat' ? -1.6 : -1.08, mode.value === 'flat' ? 0 : T(N)(-1.08), { color: 'gold', baseline: 'bottom', dy: -6, align: 'left' });
          L.tex('f', 2.9, Mo.f(2.9), { color: 'ink', baseline: 'bottom', dy: -6 });
          if (mode.value === 'flat') L.tex('g\\equiv0', 2.6, 0, { color: 'blue', baseline: 'top', dy: 6 });
          if (mode.value === 'twin') L.tex('g=\\tfrac1{1+x^2}', 2.4, f1(2.4), { color: 'blue', baseline: 'top', dy: 8 });
          if (mode.value === 'analytic') L.corner('T_N → f only on (−1, 1), yet f is determined by its germ at 0', 'tr', { color: 'green', weight: 600 });
          else L.corner('same derivatives of every order at 0, different functions', 'tr', { color: 'red', weight: 600 });
          // right
          const arr = sup[mode.value];
          const b1 = Bn(arr, false), b2 = Bn(arr, true);
          const top = Math.max(2, ...b1.map((p) => p[1]), ...b2.map((p) => p[1])) * 1.14;
          R.setView(null, [0, top]);
          R.path(b1, { color: 'accent', width: 2 }); R.dots(b1, { color: 'accent', r: 3.6 });
          R.path(b2, { color: 'orange', width: 2 }); R.dots(b2, { color: 'orange', r: 3.6 });
          const e1 = b1[b1.length - 1], e2 = b2[b2.length - 1];
          R.tex('M_n=n!', e1[0], e1[1], { color: 'accent', align: 'right', baseline: 'bottom', dx: -6, dy: -8 });
          R.tex('M_n=(n!)^2', e2[0], e2[1], { color: 'orange', align: 'right', baseline: e2[1] > e1[1] ? 'bottom' : 'top', dx: -6, dy: e2[1] > e1[1] ? -8 : 8 });
          st = { m: mode.value, N, b1: e1[1], b2: e2[1] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const tail = String.raw`$B_{24}=${v.fix(s.b1, 2)}$ for $M_n=n!$ and $B_{24}=${v.fix(s.b2, 3)}$ for $M_n=(n!)^2$.`;
          if (s.m === 'analytic') return String.raw`$f^{(n)}(0)=\pm n!$ for even $n$ and $0$ for odd $n$; $\|D^nf\|_\infty\le n!$, so $f\in C\{n!\}$ with $\beta=B=1$. ` + tail;
          if (s.m === 'flat') return String.raw`$f^{(n)}(0)=0$ for every $n$, yet $f\not\equiv0$. $B_n$ grows without bound for $M_n=n!$ ($f\notin C\{n!\}$) but stays bounded for $M_n=(n!)^2$: $f\in C\{(n!)^2\}$, so $C\{(n!)^2\}$ is not quasi-analytic. ` + tail;
          return String.raw`$f$ and $g=\frac1{1+x^2}$ have equal derivatives of all orders at $0$ (the flat part contributes nothing there) but differ on $(0,\infty)$. ` + tail;
        });
      },
    },
    {
      num: '19.6',
      kind: 'Theorem',
      name: 'The class C{n!} is quasi-analytic',
      verify: true,
      statement: String.raw`Let $f\in C\{n!\}$, say $\|D^nf\|_\infty\le\beta B^n n!$ for $n=0,1,2,\dots$ Then $f$ is the restriction to $\R$ of a function $F$ holomorphic in the strip $\{z:|\Im z|<1/B\}$: for every real $a$ the Taylor series of $f$ at $a$ converges to $f$ on $(a-1/B,a+1/B)$, and its sum is $F$ on the disc $D(a;1/B)$.

Conversely, if $F$ is holomorphic in a strip $\{|\Im z|<\delta\}$ and $|F|\le\beta$ there, then $f=F|_{\R}$ satisfies $\|D^nf\|_\infty\le\beta\,n!\,\delta^{-n}$, so $f\in C\{n!\}$.

In particular $C\{n!\}$ is quasi-analytic.`,
      idea: String.raw`Taylor's formula with remainder at $a$ gives $|f(x)-T_N(x)|\le\|D^{N+1}f\|_\infty\frac{|x-a|^{N+1}}{(N+1)!}\le\beta\,(B|x-a|)^{N+1}\to0$ when $|x-a|<1/B$, and the coefficients satisfy $|f^{(n)}(a)|/n!\le\beta B^n$, so the series also converges in the complex disc $D(a;1/B)$. Sums centred at different points agree on overlapping real intervals, hence (identity theorem) on overlapping discs, and glue to one $F$ on the strip. If every derivative vanishes at $0$, then $F=0$ on $D(0;1/B)$ and hence on the connected strip. The converse is Cauchy's estimate on discs of radius $r<\delta$ centred on $\R$.`,
      caption: String.raw`Drag the base point $a$ along the real axis and the point $w$ anywhere. Left: phase portrait of the holomorphic extension $F$, the strip $|\Im z|<1/B$ forced by the derivative bound (green), the disc $D(a;1/B)$ (orange) and the true disc of convergence (dashed). Right: the partial sums $S_N(w)=\sum_{n\le N}\frac{f^{(n)}(a)}{n!}(w-a)^n$, built from the derivatives at $a$ alone, spiral into $F(w)$ when $w$ is inside the disc and fly off when it is not. Chaining such discs covers the strip, so the germ at one point fixes $f$. The flat function $e^{-1/x}$ admits no strip: its discs shrink to a point at $0$, and its germ at any $a\le0$ is $0$.`,
      deps: ['rca-19.5', 'rca-10.16', 'rca-10.18', 'rca-10.26', 'pma-5.15'],
      see: ['pma-8.1a'],
      tags: ['quasi-analytic', 'power series'],
      viz(v) {
        const { Cx, TAU: T2 } = v.M;
        const one = new Cx(1, 0);
        const EX = {
          cauchy: {
            label: String.raw`$\frac{\delta^2}{x^2+\delta^2}$`,
            F: (z, d) => new Cx(d * d, 0).div(z.mul(z).add(d * d)),
            sing: (d) => [[0, d], [0, -d]], invB: (d) => d, R: (a, d) => Math.hypot(a, d),
          },
          sech: {
            label: String.raw`$\operatorname{sech}x$`,
            F: (z) => { const e = z.exp(); return new Cx(2, 0).div(e.add(one.div(e))); },
            sing: () => [[0, Math.PI / 2], [0, -Math.PI / 2]], invB: () => Math.PI / 2, R: (a) => Math.hypot(a, Math.PI / 2),
          },
          flat: {
            label: String.raw`$e^{-1/x}$ (flat at $0$)`, flat: true,
            F: (z) => (z.re > 0 ? one.div(z).neg().exp() : new Cx(NaN, NaN)),
            sing: () => [[0, 0]], invB: () => 0, R: (a) => (a > 0 ? a : Infinity),
          },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'cauchy');
        const dsl = v.slider('$\\delta$ (poles at $\\pm i\\delta$)', 0.4, 1.6, 1, { step: 0.01 });
        const Nsl = v.slider('number of terms $N$', 1, 60, 24, { int: true });
        const L = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 340, title: 'phase portrait of the extension $F$' });
        const R = v.stage({ x: [-1.5, 1.5], y: [-1.2, 1.2], equal: true, height: 340, title: String.raw`partial sums $S_N(w)$ of the Taylor series at $a$` });
        const a = L.handle(-0.6, 0, { color: 'orange', label: 'a', labelPos: 'sw', constrain: (x) => [v.M.clamp(x, -2.7, 2.7), 0] });
        const w = L.handle(0.45, 0.75, { color: 'gold', label: 'w' });
        const bg = v.rgb('panel');
        let ck = null, coef = null, st = null;
        const K = 256;
        function coefficients(E, aa, d, R0) {
          if (E.flat && aa <= 0) return { re: new Float64Array(61), im: new Float64Array(61), zero: true };
          const r = Math.min(0.8 * R0, 3);
          const vals = [];
          for (let k = 0; k < K; k++) vals.push(E.F(new Cx(aa + r * Math.cos(T2 * k / K), r * Math.sin(T2 * k / K)), d));
          const re = new Float64Array(61), im = new Float64Array(61);
          for (let n = 0; n <= 60; n++) {
            let sr = 0, si = 0;
            for (let k = 0; k < K; k++) { const th = -T2 * n * k / K, c = Math.cos(th), s = Math.sin(th); sr += vals[k].re * c - vals[k].im * s; si += vals[k].re * s + vals[k].im * c; }
            const sc = 1 / (K * r ** n); re[n] = sr * sc; im[n] = si * sc;
          }
          return { re, im, zero: false };
        }
        v.render(() => {
          const E = EX[which.value], d = dsl.value;
          dsl.el.hidden = which.value !== 'cauchy';
          const aa = a.x, R0 = E.R(aa, d), ib = E.invB(d);
          // phase portrait
          L.raster((x, y) => { if (E.flat && x <= 0) return bg; const z = E.F(new Cx(x, y), d); return phaseRGB(v.M, z.re, z.im, bg); }, { key: `${which.value}|${d}`, res: 2 });
          if (E.flat) {
            L.vline(0, { color: 'red', width: 2 });
            L.text('f ≡ 0 here', -1.5, 1.7, { align: 'center', color: 'muted', size: 12.5, weight: 600 });
            L.text('no strip of holomorphy', -1.5, 1.35, { align: 'center', color: 'red', size: 12.5, weight: 600 });
          } else {
            for (const s of [-1, 1]) { L.hline(s * ib, { color: 'panel', width: 4.5, alpha: 0.8 }); L.hline(s * ib, { color: 'green', width: 2.2, dash: [8, 5] }); }
            L.text(`|Im z| < 1/B = ${v.fix(ib, 2)}`, L.bounds.x[0], ib, { dx: 8, dy: -11, color: 'green', size: 12.5, weight: 700 });
            L.circle(aa, 0, ib, { fill: 'orange', fillAlpha: 0.16, color: 'panel', width: 4.5 });
            L.circle(aa, 0, ib, { color: 'orange', width: 2.2 });
          }
          if (isFinite(R0)) { L.circle(aa, 0, R0, { color: 'panel', width: 4, alpha: 0.7 }); L.circle(aa, 0, R0, { color: 'ink', width: 1.6, dash: [5, 4] }); }
          for (const [sx, sy] of E.sing(d)) xMark(L, sx, sy, 'ink');
          L.line(aa, 0, w.x, w.y, { color: 'panel', width: 3.5, alpha: 0.8 });
          L.line(aa, 0, w.x, w.y, { color: 'gold', width: 1.6 });
          L.axes();
          // coefficients and partial sums
          const k = `${which.value}|${d}|${aa.toFixed(4)}`;
          if (k !== ck) { ck = k; coef = coefficients(E, aa, d, R0); }
          const N = Nsl.value, hr = w.x - aa, hi = w.y;
          const pts = []; let sr = 0, si = 0, pr = 1, pi = 0;
          for (let n = 0; n <= N; n++) {
            sr += coef.re[n] * pr - coef.im[n] * pi; si += coef.re[n] * pi + coef.im[n] * pr;
            pts.push([sr, si]);
            const t = pr * hr - pi * hi; pi = pr * hi + pi * hr; pr = t;
          }
          const dist = Math.hypot(hr, hi), inside = dist < R0;
          const Fw = E.flat && (aa <= 0 || w.x <= 0) ? null : E.F(new Cx(w.x, w.y), d);
          const Fok = Fw && isFinite(Fw.re) && isFinite(Fw.im);
          let span = 1.2;
          if (Fok) span = Math.max(span, 1.6 * Math.hypot(Fw.re, Fw.im));
          for (const p of pts.slice(0, 6)) span = Math.max(span, 1.15 * Math.hypot(p[0], p[1]));
          span = Math.min(span, 40);
          const cx = Fok ? Fw.re / 2 : 0, cy = Fok ? Fw.im / 2 : 0;
          R.setView([cx - span, cx + span], [cy - span * 0.8, cy + span * 0.8]);
          R.path(pts, { color: inside ? 'gold' : 'red', width: 1.8 });
          R.dots(pts, { color: inside ? 'gold' : 'red', r: 2.6 });
          R.dot(0, 0, { color: 'muted', r: 3 });
          if (Fok) R.dot(Fw.re, Fw.im, { color: 'accent', r: 8, hollow: true, width: 2.4, label: 'F(w)', labelPos: 'ne' });
          const last = pts[pts.length - 1];
          R.dot(last[0], last[1], { color: inside ? 'gold' : 'red', r: 5, label: 'S' + String(N).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join(''), labelPos: 'sw' });
          R.corner(coef.zero ? 'germ at a is 0: every S_N(w) = 0' : inside ? `|w − a| = ${v.fix(dist, 2)} < R = ${v.fix(R0, 2)}: converges` : `|w − a| = ${v.fix(dist, 2)} > R = ${v.fix(R0, 2)}: diverges`, 'tl', { color: coef.zero ? 'red' : inside ? 'green' : 'red', weight: 600 });
          st = { E, aa, R0, ib, dist, inside, err: Fok ? Math.hypot(last[0] - Fw.re, last[1] - Fw.im) : null, N, zero: coef.zero };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.E.flat) {
            if (s.zero) return String.raw`At $a=${v.fix(s.aa, 2)}\le0$ every derivative of $f$ vanishes, so the Taylor series at $a$ is $0$ — but $f=e^{-1/x}\ne0$ on $(0,\infty)$. The germ does not determine $f$: $\|D^nf\|_\infty$ grows too fast for any bound $\beta B^nn!$.`;
            return String.raw`At $a=${v.fix(s.aa, 2)}>0$ the Taylor series converges only in $|z-a|<a$ (the essential singularity of $e^{-1/z}$ sits at $0$): the discs shrink to a point as $a\to0$, so there is no strip and $f\notin C\{n!\}$.` + (s.err != null && s.inside ? String.raw` $|S_{${s.N}}(w)-F(w)|=${v.sci(s.err, 2)}$.` : '');
          }
          const conv = s.inside && s.err != null ? String.raw`$|S_{${s.N}}(w)-F(w)|=${v.sci(s.err, 2)}$` : String.raw`$w$ lies outside the disc of convergence, so $S_N(w)$ diverges`;
          return String.raw`$1/B=${v.fix(s.ib, 3)}$ (here $\limsup(\|D^nf\|_\infty/n!)^{1/n}=B$); radius of convergence at $a$: $R=${v.fix(s.R0, 3)}\ge1/B$; $|w-a|=${v.fix(s.dist, 3)}$: ` + conv + '.';
        });
      },
    },
    // ------------------------------------------------------------------ the Denjoy–Carleman theorem
    {
      num: '19.11',
      kind: 'Theorem',
      name: 'Denjoy–Carleman theorem',
      statement: String.raw`Suppose $M_0=1$ and $M_n^2\le M_{n-1}M_{n+1}$ for $n=1,2,3,\dots$ (the sequence is log-convex), and for $x>0$ put
$$Q(x)=\sum_{n=0}^\infty\frac{x^n}{M_n},\qquad q(x)=\sup_{n\ge0}\frac{x^n}{M_n}.$$
Then each of the following five conditions implies the other four:
(a) $C\{M_n\}$ is not quasi-analytic;
(b) $\displaystyle\int_0^\infty\log Q(x)\,\frac{dx}{1+x^2}<\infty$;
(c) $\displaystyle\int_0^\infty\log q(x)\,\frac{dx}{1+x^2}<\infty$;
(d) $\displaystyle\sum_{n=1}^\infty\Big(\frac{1}{M_n}\Big)^{1/n}<\infty$;
(e) $\displaystyle\sum_{n=1}^\infty\frac{M_{n-1}}{M_n}<\infty$.

In particular $C\{M_n\}$ is quasi-analytic if and only if $\sum_n M_n^{-1/n}=\infty$.`,
      idea: String.raw`Write $\lambda_n=M_{n-1}/M_n$; log-convexity says that $\lambda_n$ decreases, so $M_n^{-1/n}=(\lambda_1\cdots\lambda_n)^{1/n}\ge\lambda_n$ and (d) implies (e). The integrals in (b) and (c) are comparable because $q\le Q$ and $Q(x)\le2\,q(2x)$; and since $\log q(x)\ge n$ as soon as $x\ge eM_n^{1/n}$, a summation by parts turns (c) into (d).

For (e)$\Rightarrow$(a), convolve normalised boxes of half-widths $\lambda_1,\lambda_1,\lambda_2,\lambda_3,\dots$: the limit $\varphi$ is a nonzero $C^\infty$ function supported in $[-a,a]$, $a=\lambda_1+\sum\lambda_n$ — its Fourier transform is the entire function $\frac{\sin\lambda_1z}{\lambda_1z}\prod_n\frac{\sin\lambda_nz}{\lambda_nz}$ of exponential type $a$, as in 19.3 — and differentiating $n$ of the boxes gives $\|D^n\varphi\|_\infty\le\frac12M_1M_n$. A nonzero member of $C\{M_n\}$ vanishing outside an interval is flat at $a$, so the class is not quasi-analytic.

For (a)$\Rightarrow$(c), take $f\in C\{M_n\}$, $f\not\equiv0$, flat at $0$. Integrating by parts $n$ times bounds its Laplace transform $\int_0^\infty f(t)e^{-wt}\,dt$ by a constant times $1/q(|w|/B)$ in a half-plane; a bounded holomorphic function there that is not identically $0$ has $\log|F|$ integrable against the Poisson weight on the boundary (as for $H^\infty$ of the disc), and that is (c).`,
      caption: String.raw`Pick a log-convex sequence: $(n!)^s$ with adjustable $s$, or the borderline $n!(\log n)^n$ and $n!(\log n)^{2n}$. Top: partial sums of (d) and (e), and the integral (c) up to $x_N=M_N/M_{N-1}$, against $N$ on a logarithmic axis (exact up to $10^5$ terms, then continued by the Euler–Maclaurin integral up to $10^9$); they converge or diverge together. Bottom: the construction behind (e)$\Rightarrow$(a), the convolution $\varphi_K$ of $K+1$ normalised boxes of half-widths $\lambda_1,\lambda_1,\lambda_2,\dots,\lambda_K$ with $\lambda_k=M_{k-1}/M_k$ (faint: fewer boxes). When $\sum\lambda_k<\infty$ the supports stay inside $[-a_\infty,a_\infty]$ and the limit is a nonzero member of $C\{M_n\}$ with compact support; when it diverges ($s\le1$, or $n!(\log n)^n$) the support runs off to infinity.`,
      deps: ['rca-19.5', 'rca-19.3', 'rca-17.17', 'rca-15.6'],
      see: ['pma-8.22', 'rca-15.5'],
      tags: ['quasi-analytic', 'Denjoy–Carleman', 'Fourier transform'],
      viz(v) {
        const SEQ = {
          pow: { label: String.raw`$M_n=(n!)^s$` },
          log1: { label: String.raw`$n!\,(\log n)^{n}$` },
          log2: { label: String.raw`$n!\,(\log n)^{2n}$` },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const ssl = v.slider('$s$', 0.6, 2.5, 2, { step: 0.05 });
        const Ksl = v.slider('boxes $K$', 1, 80, 30, { int: true });
        const XT = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => [k, k === 0 ? '1' : k === 1 ? '10' : `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[k]}`]);
        const P = v.stage({ x: [0, 9.25], y: [0, 10], height: 250, full: true, axes: 'box', xlabel: 'N', xticks: XT, title: String.raw`partial sums up to $N$ (log scale): (d) $\sum M_n^{-1/n}$, (e) $\sum M_{n-1}/M_n$, (c) $\int_0^{x_N}\log q(x)\,\frac{dx}{1+x^2}$` });
        const C = v.stage({ x: [-3, 3], y: [-0.05, 0.5], height: 230, full: true, axes: 'box', xlabel: 'x', title: String.raw`(e)$\Rightarrow$(a): $\varphi_K=\beta_{\lambda_1}*\beta_{\lambda_1}*\beta_{\lambda_2}*\cdots*\beta_{\lambda_K}$, $\;\beta_\lambda=\frac{1}{2\lambda}\chi_{[-\lambda,\lambda]}$` });
        v.legend([['blue', '(d) $\\sum M_n^{-1/n}$'], ['orange', '(e) $\\sum M_{n-1}/M_n$'], ['purple', '(c) integral of $\\log q$'], ['gold', '$\\varphi_K$', { area: true }], ['green', 'limit support $[-a_\\infty,a_\\infty]$', { dash: true }]]);
        let key = null, data = null, conv = null, convKey = null, st = null;
        const G = 3000;
        function convolve(lams, X) {
          const h = 2 * X / (G - 1);
          let f = new Float64Array(G); f[Math.floor(G / 2)] = 1 / h; // approximate δ
          const snaps = [];
          const P0 = new Float64Array(G);
          lams.forEach((lam, idx) => {
            // prefix integral (trapezoid), then (P(x+λ) - P(x-λ)) / (2λ) by linear interpolation
            P0[0] = 0; for (let i = 1; i < G; i++) P0[i] = P0[i - 1] + 0.5 * h * (f[i - 1] + f[i]);
            const at = (x) => { const s = (x + X) / h; if (s <= 0) return 0; if (s >= G - 1) return P0[G - 1]; const i = Math.floor(s), t = s - i; return P0[i] + t * (P0[i + 1] - P0[i]); };
            const g = new Float64Array(G);
            for (let i = 0; i < G; i++) { const x = -X + i * h; g[i] = (at(x + lam) - at(x - lam)) / (2 * lam); }
            f = g; snaps.push(f);
            void idx;
          });
          return { snaps, h };
        }
        v.render(() => {
          const kind = which.value, s = ssl.value, K = Ksl.value;
          ssl.el.hidden = kind !== 'pow';
          const k = `${kind}|${s}`;
          if (k !== key) { key = k; data = dcSums(kind, s); }
          const { pts, lam } = data;
          // ---------- top: criteria
          const last = pts[pts.length - 1];
          const top = Math.max(last[1], last[2], last[3], 1) * 1.12;
          P.setView(null, [-0.04 * top, top]);
          P.path(pts.map((p) => [p[0], p[3]]), { color: 'purple', width: 2.2 });
          P.path(pts.map((p) => [p[0], p[2]]), { color: 'orange', width: 2.4 });
          P.path(pts.map((p) => [p[0], p[1]]), { color: 'blue', width: 2.4 });
          P.vline(5, { color: 'muted', width: 1, dash: [2, 4] });
          P.text('Euler–Maclaurin →', 5, P.bounds.y[0], { dx: 6, dy: -12, color: 'muted', size: 11 });
          for (const [i, col, lab] of [[1, 'blue', '(d)'], [2, 'orange', '(e)'], [3, 'purple', '(c)']]) P.text(lab, last[0], last[i], { dx: 4, color: col, size: 12.5, weight: 700 });
          // link: Σ_{k≤K} λ_k on curve (e)
          let SeK = 0; for (let j = 0; j < K; j++) SeK += lam[j];
          P.dot(Math.log10(K), SeK, { color: 'gold', r: 5 });
          const qa = kind === 'pow' ? s <= 1 : kind === 'log1';
          P.corner(qa ? 'all three diverge ⇒ C{Mₙ} is quasi-analytic' : 'all three converge ⇒ C{Mₙ} is NOT quasi-analytic', 'tl', { color: qa ? 'red' : 'green', weight: 600 });
          // ---------- bottom: box convolution
          const lams = [lam[0]].concat(lam.slice(0, 80));
          const aMax = lams.reduce((x, y) => x + y, 0);
          let aInf = null;
          if (!qa) { // a_∞ = λ1 + Σ λ_k: exact to 1e5 terms plus Euler–Maclaurin tail
            aInf = lam[0] + last[2];
          }
          const X = 1.12 * (aInf ?? aMax);
          const ck = `${k}|${X}`;
          if (ck !== convKey) { convKey = ck; conv = convolve(lams, X); }
          const phi = conv.snaps[K], h = conv.h;
          const aK = lams.slice(0, K + 1).reduce((x, y) => x + y, 0);
          let pk = 0; for (let i = 0; i < G; i++) pk = Math.max(pk, phi[i]);
          C.setView([-X, X], [-0.06 * pk, pk * 1.18]);
          if (aInf != null) { C.vline(-aInf, { color: 'green', width: 1.8, dash: [6, 4] }); C.vline(aInf, { color: 'green', width: 1.8, dash: [6, 4] }); }
          C.vband(-aK, aK, { color: 'orange', alpha: 0.07 });
          for (const kk of [1, 2, 4, 8, 16, 32, 64]) if (kk < K) { const g = conv.snaps[kk]; C.path(Array.from(g, (y, i) => [-X + i * h, y]).filter((_, i) => i % 3 === 0), { color: 'muted', width: 1, alpha: 0.6 }); }
          C.path(Array.from(phi, (y, i) => [-X + i * h, y]), { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.25 });
          C.tex(String.raw`\pm a_K`, aK, C.bounds.y[1], { color: 'orange', align: 'left', baseline: 'top', dx: 5, dy: 6 });
          // derivative checks: ‖φ'‖∞ ≤ M_1²/2, ‖φ''‖∞ ≤ M_1 M_2/2
          let d1 = 0, d2 = 0;
          for (let i = 1; i < G - 1; i++) { d1 = Math.max(d1, Math.abs(phi[i + 1] - phi[i - 1]) / (2 * h)); d2 = Math.max(d2, Math.abs(phi[i + 1] - 2 * phi[i] + phi[i - 1]) / (h * h)); }
          const M1 = Math.exp(data.logM(1)), M2 = Math.exp(data.logM(2));
          st = { qa, aK, aInf, K, last, d1, d2, b1: M1 * M1 / 2, b2: M1 * M2 / 2, convex: data.convex };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const sums = String.raw`Up to $N=10^9$: (d) $${v.fix(s.last[1], 3)}$, (e) $${v.fix(s.last[2], 3)}$, (c) $${v.fix(s.last[3], 3)}$` + (s.convex ? ' (log-convexity checked).' : '.');
          const deriv = String.raw` Derivative bounds for $\varphi_K$: $\|\varphi_K'\|_\infty=${v.fix(s.d1, 3)}\le\frac12M_1^2=${v.fix(s.b1, 3)}$, $\|\varphi_K''\|_\infty=${v.fix(s.d2, 3)}\le\frac12M_1M_2=${v.fix(s.b2, 3)}$.`;
          if (s.qa) return sums + String.raw` The supports $[-a_K,a_K]$ grow without bound ($a_{${s.K}}=${v.fix(s.aK, 3)}$): no compactly supported member, as the theorem predicts for a quasi-analytic class.` + deriv;
          return sums + String.raw` $a_{${s.K}}=${v.fix(s.aK, 3)}\to a_\infty=${v.fix(s.aInf, 3)}$: the limit $\varphi$ is a nonzero member of $C\{M_n\}$ vanishing outside $[-a_\infty,a_\infty]$, flat at $\pm a_\infty$.` + deriv;
        });
      },
    },
  ],
};
