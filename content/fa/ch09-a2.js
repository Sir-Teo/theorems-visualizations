// Rudin, Functional Analysis — Chapter 9 (part 2): the prime number theorem and the renewal equation
//
// Numbering from Google Books snippet views (9.10–9.12 from the 1st edition, whose ch. 9 numbering matches the 2nd at every
// point checked); items carry `verify: true`.

// ---------------------------------------------------------------- primes
const NMAX = 1000000;
const SIEVE = (() => { const c = new Uint8Array(NMAX + 1); c[0] = c[1] = 1; for (let p = 2; p * p <= NMAX; p++) if (!c[p]) for (let q = p * p; q <= NMAX; q += p) c[q] = 1; return c; })();
/** Λ(n) (von Mangoldt) for n ≤ NMAX. */
function vonMangoldt(n) {
  if (n < 2) return 0;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) { let m = n; while (m % p === 0) m /= p; return m === 1 ? Math.log(p) : 0; }
  return Math.log(n);
}
/** π(x) and ψ(x) at the (sorted) integer sample points xs, by one sweep over the prime powers ≤ NMAX. */
function primeSamples(xs) {
  const ev = [];
  for (let p = 2; p <= NMAX; p++) if (!SIEVE[p]) { const lp = Math.log(p); ev.push(p, lp, 1); if (p <= 1000) for (let q = p * p; q <= NMAX; q *= p) ev.push(q, lp, 0); }
  const n = ev.length / 3, idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => ev[3 * a] - ev[3 * b]);
  const pi = new Float64Array(xs.length), psi = new Float64Array(xs.length);
  let k = 0, cp = 0, cs = 0;
  xs.forEach((x, i) => { while (k < n && ev[3 * idx[k]] <= x) { cs += ev[3 * idx[k] + 1]; cp += ev[3 * idx[k] + 2]; k++; } pi[i] = cp; psi[i] = cs; });
  return { pi, psi };
}
/** Logarithmic integral li(x) − li(2) by Simpson in u = log t. */
function Li(x) { const a = Math.log(2), b = Math.log(x), n = 400, h = (b - a) / n; let s = 0; for (let i = 0; i <= n; i++) { const u = a + i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * Math.exp(u) / u; } return s * h / 3; }

// ---------------------------------------------------------------- ζ by Euler–Maclaurin (complex [re, im])
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
/** n^{−s} for real n > 0. */
const npow = (n, s) => { const L = Math.log(n), m = Math.exp(-s[0] * L); return [m * Math.cos(-s[1] * L), m * Math.sin(-s[1] * L)]; };
const B2K = [1 / 6, -1 / 30, 1 / 42, -1 / 30, 5 / 66, -691 / 2730, 7 / 6, -3617 / 510];
const FACT2K = [2, 24, 720, 40320, 3628800, 479001600, 87178291200, 20922789888000];
function zeta(s, N = 40) {
  let z = [0, 0];
  for (let n = 1; n < N; n++) { const p = npow(n, s); z[0] += p[0]; z[1] += p[1]; }
  const Ns = npow(N, s);                                     // N^{−s}
  const N1s = [Ns[0] * N, Ns[1] * N];                        // N^{1−s}
  const t1 = cdiv(N1s, [s[0] - 1, s[1]]);
  z[0] += t1[0] + Ns[0] / 2; z[1] += t1[1] + Ns[1] / 2;
  let poch = [s[0], s[1]], Npow = [Ns[0] / N, Ns[1] / N];    // s(s+1)…(s+2k−2), N^{−s−2k+1}
  for (let k = 0; k < B2K.length; k++) {
    const term = cmul(poch, Npow), c = B2K[k] / FACT2K[k];
    z[0] += c * term[0]; z[1] += c * term[1];
    poch = cmul(cmul(poch, [s[0] + 2 * k + 1, s[1]]), [s[0] + 2 * k + 2, s[1]]);
    Npow = [Npow[0] / (N * N), Npow[1] / (N * N)];
  }
  return z;
}
const cabs = (a) => Math.hypot(a[0], a[1]);
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

export default {
  book: 'fa',
  chapter: 9,
  items: [
    {
      num: '9.10',
      kind: 'Definition',
      name: 'Preparation: Λ(n), ψ(x) and ζ(s)',
      statement: String.raw`For $\operatorname{Re}s>1$ the **Riemann zeta function** is $\zeta(s)=\sum_{n\ge1}n^{-s}=\prod_p(1-p^{-s})^{-1}$ (Euler product over the primes). The **von Mangoldt function** is $\Lambda(n)=\log p$ if $n=p^k$ is a power of a prime $p$ and $\Lambda(n)=0$ otherwise; then
$$-\frac{\zeta'(s)}{\zeta(s)}=\sum_{n\ge1}\Lambda(n)\,n^{-s},\qquad\psi(x)=\sum_{n\le x}\Lambda(n),$$
and $\pi(x)$ is the number of primes $\le x$.`,
      idea: String.raw`The Euler product is unique factorisation in analytic form: expanding $\prod_{p\le P}(1-p^{-s})^{-1}=\prod_p\sum_kp^{-ks}$ produces $n^{-s}$ once for every $n$ whose prime factors are $\le P$. Taking logarithmic derivatives turns the product into the Dirichlet series of $\Lambda$. The prime number theorem is equivalent to $\psi(x)\sim x$, and it is $\psi$, not $\pi$, that the Tauberian machinery handles naturally.`,
      caption: String.raw`Top: the Chebyshev function $\psi(x)$, a staircase that climbs by $\log p$ at every prime power $p^k$ (gold dots mark the prime powers that are not primes), against the line $y=x$. Bottom: for real $s>1$, the partial sums $\sum_{n\le N}n^{-s}$ (blue) and the partial Euler products $\prod_{p\le N}(1-p^{-s})^{-1}$ (purple) both converge to $\zeta(s)$ (green) — the product from below, faster.`,
      deps: [],
      see: ['rca-15.4'],
      tags: ['number theory', 'zeta function'],
      verify: true,
      viz(v) {
        const M = v.M;
        const XS = v.slider('range $x\\le X$, $X=$', 20, 300, 60, { int: true });
        const sS = v.slider('$s$ (real, $>1$)', 1.1, 3, 1.5, { step: 0.01 });
        const top = v.stage({ x: [0, 60], y: [0, 60], height: 230, full: true, axes: 'box', xlabel: 'x', title: '$\\psi(x)=\\sum_{n\\le x}\\Lambda(n)$ and $y=x$' });
        const bot = v.stage({ x: [0, 200], y: [0, 3], height: 210, full: true, axes: 'box', xlabel: 'N', title: 'partial sums and partial Euler products against $N$' });
        let st = {};
        v.legend([['teal', '$\\psi(x)$'], ['muted', '$y=x$', { dash: true }], ['gold', 'prime powers $p^k$, $k\\ge2$', { dot: true }], ['blue', '$\\sum_{n\\le N}n^{-s}$'], ['purple', '$\\prod_{p\\le N}(1-p^{-s})^{-1}$'], ['green', '$\\zeta(s)$', { dash: true }]]);
        v.render(() => {
          const X = XS.value, s = sS.value;
          top.setView([0, X], [0, X * 1.05]);
          const pts = []; let acc = 0;
          for (let n = 1; n <= X; n++) { pts.push([n, acc]); acc += vonMangoldt(n); pts.push([n, acc]); }
          pts.push([X, acc]);
          top.line(0, 0, X, X, { color: 'muted', width: 1.4, dash: [6, 4] });
          top.path(pts, { color: 'teal', width: 2.2 });
          let a2 = 0; for (let n = 2; n <= X; n++) { const L = vonMangoldt(n); a2 += L; if (L > 0 && SIEVE[n]) top.dot(n, a2, { color: 'gold', r: 3.5 }); }
          // bottom
          const z = zeta([s, 0])[0];
          const sums = [], prods = []; let S = 0, P = 1;
          for (let n = 1; n <= 200; n++) { S += Math.pow(n, -s); if (n >= 2 && !SIEVE[n]) P /= 1 - Math.pow(n, -s); sums.push([n, S]); prods.push([n, P]); }
          bot.setView(null, [0, Math.max(z * 1.15, 1.2)]);
          bot.hline(z, { color: 'green', width: 1.8, dash: [6, 4] });
          bot.path(sums, { color: 'blue', width: 2 });
          bot.path(prods, { color: 'purple', width: 2 });
          st = { X, psi: acc, z, S, P, s };
        });
        v.readout(() => `$\\psi(${st.X}) = ${v.fix(st.psi, 2)}$ ($\\psi(x)/x = ${v.fix(st.psi / st.X, 3)}$). At $s=${v.fix(st.s, 2)}$: $\\zeta(s) = ${v.fix(st.z, 5)}$, sum to $200$: $${v.fix(st.S, 5)}$, product over $p\\le200$: $${v.fix(st.P, 5)}$.`);
      },
    },
    {
      num: '9.11',
      kind: 'Theorem',
      name: 'ζ has no zeros on the line Re s = 1',
      statement: String.raw`The function $\zeta(s)-\frac1{s-1}$ extends to a holomorphic function in $\operatorname{Re}s>0$, so $\zeta$ is meromorphic there with a single simple pole at $s=1$; and
$$\zeta(1+it)\ne0\qquad(t\in\R,\ t\ne0).$$`,
      idea: String.raw`The extension comes from comparing $\sum n^{-s}$ with $\int_1^\infty x^{-s}dx=\frac1{s-1}$. For the zero-free line: from the Euler product, $\log|\zeta(\sigma+it)|=\sum_p\sum_k\frac{\cos(kt\log p)}{kp^{k\sigma}}$ for $\sigma>1$, and $3+4\cos\theta+\cos2\theta=2(1+\cos\theta)^2\ge0$ gives
$$|\zeta(\sigma)^3\,\zeta(\sigma+it)^4\,\zeta(\sigma+2it)|\ge1 .$$
If $\zeta(1+it)=0$, then as $\sigma\downarrow1$ the left side would behave like $(\sigma-1)^{-3}(\sigma-1)^4\cdot O(1)\to0$ — a contradiction.`,
      caption: String.raw`Top: $|\zeta(\sigma+it)|$ for $0\le t\le60$ (computed by Euler–Maclaurin summation). On $\sigma=1$ (green) it never reaches $0$ — though it dips low; lower $\sigma$ to $\frac12$ to watch the first nontrivial zeros $t\approx14.13,21.02,25.01,\dots$ appear on the critical line. Bottom: the 3–4–1 product $\log|\zeta(\sigma)^3\zeta(\sigma+it)^4\zeta(\sigma+2it)|$ for $\sigma>1$, which stays $\ge0$ — the inequality behind the theorem.`,
      deps: ['fa-9.10'],
      tags: ['number theory', 'zeta function'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sS = v.slider('$\\sigma$ (top panel)', 0.5, 1.5, 1, { step: 0.01 });
        const s2 = v.slider('$\\sigma>1$ (bottom panel)', 1.01, 1.6, 1.08, { step: 0.01 });
        const top = v.stage({ x: [0, 60], y: [0, 4], height: 230, full: true, axes: 'box', xlabel: 't', title: '$|\\zeta(\\sigma+it)|$' });
        const bot = v.stage({ x: [0, 60], y: [-1, 6], height: 200, full: true, axes: 'box', xlabel: 't', title: '$\\log|\\zeta(\\sigma)^3\\zeta(\\sigma+it)^4\\zeta(\\sigma+2it)|\\ge0$' });
        const ts = M.linspace(0.2, 60, 1200);
        const cache = new Map();
        const curve = (sg) => { const k = sg.toFixed(3); if (!cache.has(k)) { if (cache.size > 30) cache.clear(); cache.set(k, ts.map((t) => cabs(zeta([sg, t])))); } return cache.get(k); };
        let st = {};
        v.legend([['green', '$|\\zeta(1+it)|$'], ['blue', '$|\\zeta(\\sigma+it)|$ for the chosen $\\sigma$'], ['purple', '3–4–1 product (log)']]);
        v.render(() => {
          const sg = sS.value, sb = s2.value;
          const one = curve(1), cur = curve(sg);
          top.setView(null, [0, Math.min(6, Math.max(3, ...cur.slice(100)) * 1.1)]);
          top.hline(0, { color: 'red', width: 1, dash: [3, 3] });
          top.path(ts.map((t, i) => [t, one[i]]), { color: 'green', width: 2.2, alpha: Math.abs(sg - 1) < 0.005 ? 1 : 0.55 });
          if (Math.abs(sg - 1) > 0.005) top.path(ts.map((t, i) => [t, cur[i]]), { color: 'blue', width: 2 });
          let minOne = Infinity, at = 0; one.forEach((y, i) => { if (ts[i] > 1 && y < minOne) { minOne = y; at = ts[i]; } });
          top.dot(at, minOne, { color: 'green', r: 4.5 });
          const zeros = [];
          for (let i = 1; i < cur.length - 1; i++) if (cur[i] < cur[i - 1] && cur[i] < cur[i + 1] && cur[i] < 0.05) zeros.push(ts[i]);
          for (const z of zeros) top.dot(z, 0, { color: 'red', r: 4.5 });
          // 3–4–1
          const z0 = Math.log(cabs(zeta([sb, 0])));
          const g = ts.map((t) => 3 * z0 + 4 * Math.log(cabs(zeta([sb, t]))) + Math.log(cabs(zeta([sb, 2 * t]))));
          bot.setView(null, span([...g, 0], 1, 0.12));
          bot.hline(0, { color: 'red', width: 1.2, dash: [4, 4] });
          bot.path(ts.map((t, i) => [t, g[i]]), { color: 'purple', width: 2.2 });
          st = { minOne, at, zeros, minG: Math.min(...g), sg };
        });
        v.readout(() => {
          const s = st;
          const zs = s.zeros.length ? `; near-zeros of $|\\zeta(${v.fix(s.sg, 2)}+it)|$ at $t\\approx${s.zeros.map((z) => v.fix(z, 2)).join(', ')}$` : '';
          return `$\\min_{1\\le t\\le60}|\\zeta(1+it)| = ${v.fix(s.minOne, 4)}$ at $t\\approx${v.fix(s.at, 2)}$${zs}. The 3–4–1 logarithm never drops below $${v.fix(s.minG, 3)}\\ge0$.`;
        });
      },
    },
    {
      num: '9.12',
      kind: 'Theorem',
      name: "Ingham's Tauberian theorem",
      statement: String.raw`Suppose $g$ is a real nondecreasing function on $(0,\infty)$, $g(x)=0$ for $0<x<1$, and
$$\sum_{n=1}^\infty g\Big(\frac xn\Big)=ax\log x+bx+o(x)\qquad(x\to\infty)$$
for some constants $a,b$. Then $g(x)=ax+o(x)$ as $x\to\infty$.`,
      idea: String.raw`Pass to logarithmic variables: $\varphi(u)=e^{-u}g(e^u)$ is bounded, and the hypothesis becomes a statement about averages $K*\varphi$. Take $k(x)=[e^x]e^{-x}$ ($x\ge0$), whose Laplace transform is $\zeta(1+s)/(1+s)$ by formula (2) of 9.11, and $K(x)=2k(x)-k(x-1)-k(x-\lambda)$ with $\lambda$ irrational. Then $K\in L^1$, and
$$\hat K(t)=\frac{\zeta(1+it)}{1+it}\big(2-e^{-it}-e^{-i\lambda t}\big)$$
has no zero. $\zeta(1+it)\ne0$ for $t\ne0$ (9.11), the bracket vanishes only if $t$ and $\lambda t$ both lie in $2\pi\Z$, which forces $t=0$ for irrational $\lambda$, and at $t=0$ the pole of $\zeta$ gives $\hat K(0)=1+\lambda$. Wiener's theorem 9.7(a) then gives $f*\varphi\to a\hat f(0)$ for all $f\in L^1$, and monotonicity of $g$ squeezes $\varphi(u)\to a$.`,
      caption: String.raw`Rudin's kernel from the proof. Left: $K(x)=2k(x)-k(x-1)-k(x-\lambda)$ with $k(x)=[e^x]e^{-x}$. Right: $|\hat K(t)|=\frac{|\zeta(1+it)|}{|1+it|}\,|2-e^{-it}-e^{-i\lambda t}|$, with $\zeta$ computed by Euler–Maclaurin. Set $\lambda$. For rational $\lambda=p/q$ the bracket vanishes at $t=2\pi q\,m$ (red ticks), so $\hat K$ has zeros and Wiener's theorem does not apply. For irrational $\lambda$ the bracket only comes close to $0$; the only threat would then be a zero of $\zeta$ on the line $\operatorname{Re}s=1$, which 9.11 excludes. The readout shows $\min|\hat K|$ on $[-T,T]$ and $\hat K(0)=1+\lambda$.`,
      deps: ['fa-9.7', 'fa-9.11', 'fa-9.10'],
      tags: ['Tauberian', 'Ingham', 'prime number theorem'],
      verify: true,
      viz(v) {
        const M = v.M;
        const lam = v.select('$\\lambda=$', [{ value: Math.SQRT2, label: '$\\sqrt2$' }, { value: (1 + Math.sqrt(5)) / 2, label: '$\\frac{1+\\sqrt5}2$' }, { value: 1.5, label: '$\\frac32$' }, { value: 2, label: '$2$' }], Math.SQRT2);
        const TS = v.slider('range $T$', 10, 60, 40, { step: 1 });
        const L = v.stage({ x: [-0.5, 5], y: [-0.7, 2.1], height: 300, axes: true, title: '$K(x)=2k(x)-k(x-1)-k(x-\\lambda)$' });
        const R = v.stage({ x: [-40, 40], y: [0, 2.6], height: 300, axes: 'box', xlabel: 't', title: '$|\\hat K(t)|$' });
        const k = (x) => (x < 0 ? 0 : Math.floor(Math.exp(x)) * Math.exp(-x));
        let cache = { key: '' }, st = {};
        v.legend([['blue', '$K$'], ['purple', '$|\\hat K(t)|$'], ['muted', '$|\\zeta(1+it)|/|1+it|$', { dash: true }], ['red', 'zeros of the bracket (rational λ)']]);
        v.render(() => {
          const l = +lam.value, T = TS.value, rational = Math.abs(l - Math.round(l * 2) / 2) < 1e-12;
          L.fn((x) => 2 * k(x) - k(x - 1) - k(x - l), { color: 'blue', width: 2, n: 3000 });
          const key = `${l}|${T}`;
          if (cache.key !== key) {
            const ts = M.linspace(-T, T, 1601), vals = [], zf = [];
            for (const t of ts) {
              if (Math.abs(t) < 1e-9) { vals.push(1 + l); zf.push(NaN); continue; }
              const z = cabs(zeta([1, t])) / Math.hypot(1, t), br = Math.hypot(2 - Math.cos(t) - Math.cos(l * t), Math.sin(t) + Math.sin(l * t));
              vals.push(z * br); zf.push(z);
            }
            cache = { key, ts, vals, zf, mn: Math.min(...vals) };
          }
          R.setView([-T, T], [0, Math.max(2.6, 1.15 * Math.max(...cache.vals))]);
          R.path(cache.ts.map((t, i) => (isFinite(cache.zf[i]) ? [t, cache.zf[i]] : null)), { color: 'muted', width: 1.2, dash: [4, 3] });
          R.path(cache.ts.map((t, i) => [t, cache.vals[i]]), { color: 'purple', width: 2.2 });
          R.dot(0, 1 + l, { color: 'green', r: 4.5, label: '1+λ', labelPos: 'e' });
          if (rational) { const q = l === 2 ? 1 : 2; for (let m = -10; m <= 10; m++) { const t = 2 * Math.PI * q * m; if (m !== 0 && Math.abs(t) <= T) R.vline(t, { color: 'red', width: 1.4, dash: [3, 3] }); } }
          st = { mn: cache.mn, l, rational, T };
        });
        v.readout(() => {
          const s = st;
          return `$\\hat K(0)=1+\\lambda=${v.fix(1 + s.l, 4)}$; $\\min_{|t|\\le${s.T}}|\\hat K(t)|=${v.sci(s.mn + 1e-17, 2)}$. ` + (s.rational ? '$\\lambda$ is rational: $\\hat K$ has zeros, and the Tauberian argument breaks.' : '$\\lambda$ is irrational: no zeros (the minimum is small but positive, where $t$ and $\\lambda t$ are both close to $2\\pi\\Z$), so Wiener’s theorem applies.');
        });
      },
    },
    {
      num: '9.12a',
      kind: 'Corollary',
      name: 'The prime number theorem',
      statement: String.raw`$$\lim_{x\to\infty}\frac{\pi(x)\log x}{x}=1,\qquad\text{equivalently}\qquad\lim_{x\to\infty}\frac{\psi(x)}{x}=1 .$$`,
      idea: String.raw`Apply Ingham's theorem 9.12 to $g=\psi$, which is nondecreasing and vanishes on $(0,2)$. Every $m\le x$ satisfies $\log m=\sum_{d\mid m}\Lambda(d)$, so
$$\sum_{n\ge1}\psi\Big(\frac xn\Big)=\sum_{m\le x}\log m=\log[x]!=x\log x-x+O(\log x)$$
by Stirling's formula. This is the hypothesis of 9.12 with $a=1$, $b=-1$, so $\psi(x)=x+o(x)$. The step from $\psi(x)\sim x$ to $\pi(x)\log x\sim x$ is an elementary comparison. Rudin does not number this result: it is derived right after 9.12, with all the analytic depth hidden in $\zeta(1+it)\ne0$ (9.11).`,
      caption: String.raw`Primes up to $10^6$, by a sieve. The three ratios $\pi(x)\log x/x$ (red), $\psi(x)/x$ (green) and $\pi(x)/\mathrm{li}(x)$ (blue) against $\log_{10}x$: all tend to $1$, the first very slowly (it is off by about $1/\log x$). Drag the marker. Bottom: the slowly oscillating function $\varphi(u)=e^{-u}\psi(e^u)$ of the Tauberian argument, with $u=\log x$ — it settles at $1$.`,
      deps: ['fa-9.12', 'fa-9.11', 'fa-9.10'],
      tags: ['number theory', 'prime number theorem', 'Tauberian theorems'],
      verify: true,
      viz(v) {
        const M = v.M;
        const top = v.stage({ x: [1, 6], y: [0.6, 1.5], height: 250, full: true, axes: 'box', xlabel: 'log₁₀ x', title: 'three ratios that tend to $1$' });
        const bot = v.stage({ x: [Math.log(10), Math.log(NMAX)], y: [0.5, 1.2], height: 180, full: true, axes: 'box', xlabel: 'u = log x', title: '$\\varphi(u)=e^{-u}\\psi(e^u)$' });
        const hx = top.handle(3.5, 1.42, { color: 'ink', r: 6, label: 'x', labelPos: 'n', constrain: (x) => [M.clamp(x, 1, 6), 1.42] });
        const ls = M.linspace(1, 6, 1501), xs = ls.map((l) => Math.min(NMAX, Math.floor(10 ** l)));
        const { pi, psi } = primeSamples(xs);
        const LI = xs.map(Li);
        const R1 = ls.map((l, i) => [l, pi[i] * Math.log(xs[i]) / xs[i]]), R2 = ls.map((l, i) => [l, psi[i] / xs[i]]), R3 = ls.map((l, i) => [l, pi[i] / LI[i]]);
        const PH = xs.map((x, i) => [Math.log(x), psi[i] / x]);
        let st = {};
        v.legend([['red', '$\\pi(x)\\log x/x$'], ['green', '$\\psi(x)/x$'], ['blue', '$\\pi(x)/\\mathrm{li}(x)$'], ['teal', '$\\varphi(u)$']]);
        v.render(() => {
          top.hline(1, { color: 'muted', width: 1.2, dash: [5, 4] });
          top.path(R1, { color: 'red', width: 2 });
          top.path(R2, { color: 'green', width: 2 });
          top.path(R3, { color: 'blue', width: 2 });
          top.vline(hx.x, { color: 'muted', width: 1, dash: [3, 3] });
          const i = Math.round((hx.x - 1) / 5 * 1500), x = xs[i];
          bot.hline(1, { color: 'muted', width: 1.2, dash: [5, 4] });
          bot.path(PH, { color: 'teal', width: 1.6 });
          bot.vline(Math.log(x), { color: 'muted', width: 1, dash: [3, 3] });
          st = { x, p: pi[i], r1: R1[i][1], r2: R2[i][1], r3: R3[i][1] };
        });
        v.readout(() => `$x = ${st.x.toLocaleString('en-US').replace(/,/g, '\\,')}$: $\\pi(x) = ${st.p}$, $\\;\\pi(x)\\log x/x = ${v.fix(st.r1, 4)}$, $\\;\\psi(x)/x = ${v.fix(st.r2, 4)}$, $\\;\\pi(x)/\\mathrm{li}(x) = ${v.fix(st.r3, 4)}$.`);
      },
    },
    {
      num: '9.13',
      kind: 'Theorem',
      name: 'The renewal theorem',
      statement: String.raw`Let $\mu$ be a probability measure on $[0,\infty)$ with finite mean $m=\int x\,d\mu(x)$, not concentrated on a lattice $\{0,d,2d,\dots\}$ (equivalently $\hat\mu(t)\ne1$ for $t\ne0$). Let $f$ be bounded, measurable, $0$ on $(-\infty,0)$, with $\sum_k\sup_{[k,k+1]}|f|<\infty$. Then the **renewal equation**
$$\varphi=f+\mu*\varphi,\qquad\varphi=0\text{ on }(-\infty,0),$$
has exactly one locally bounded solution, and
$$\lim_{x\to\infty}\varphi(x)=\frac1m\int_0^\infty f(x)\,dx .$$`,
      idea: String.raw`The solution is $\varphi=\sum_{k\ge0}\mu^{*k}*f$, a superposition of the renewal measure $U=\sum\mu^{*k}$ with $f$. The Tauberian step is to show that $U$ looks like Lebesgue measure$/m$ at infinity: $(\delta_0-\mu)*U=\delta_0$, and the kernel whose Fourier transform is $(1-\hat\mu(t))/(it)$ — integrable, with value $m$ at $t=0$ — has **no zeros** exactly when $\mu$ is non-lattice. Wiener's Tauberian theorem (9.7) then transfers the trivial average of $U$ to all averages, giving $U*f\to\frac1m\int f$.`,
      caption: String.raw`$f(x)=\sin^2(\pi x)$ on $[0,1]$ (so $\int f=\frac12$), and four choices of the step distribution $\mu$. The renewal equation is solved exactly on a grid of step $0.01$. For the uniform and gamma distributions, and even for the purely atomic but non-lattice $\frac12(\delta_1+\delta_{\sqrt2})$, $\varphi(x)$ settles at $\frac1{2m}$ (green dashed). For the lattice $\frac12(\delta_1+\delta_2)$ it never settles: it keeps the period $1$ of the lattice — exactly the case in which $1-\hat\mu$ has real zeros $t=2\pi k$.`,
      deps: ['fa-9.7', 'fa-9.5', 'fa-7.2'],
      tags: ['Tauberian theorems', 'renewal equation', 'probability'],
      verify: true,
      viz(v) {
        const M = v.M;
        const MU = {
          unif: { label: 'uniform on $[\\frac12,\\frac32]$', m: 1 },
          gamma: { label: 'gamma: $xe^{-x}dx$', m: 2 },
          irr: { label: '$\\frac12(\\delta_1+\\delta_{\\sqrt2})$', m: (1 + Math.SQRT2) / 2 },
          lat: { label: '$\\frac12(\\delta_1+\\delta_2)$ (lattice)', m: 1.5 },
        };
        const which = v.select('$\\mu=$', Object.entries(MU).map(([value, o]) => ({ value, label: o.label })), 'irr');
        const XS = v.slider('horizon', 10, 60, 30, { step: 1 });
        const top = v.stage({ x: [0, 30], y: [0, 1.1], height: 280, full: true, axes: 'box', xlabel: 'x', title: 'the solution $\\varphi$ of $\\varphi=f+\\mu*\\varphi$' });
        const bot = v.stage({ x: [0, 4], y: [0, 1.1], height: 150, full: true, axes: 'box', xlabel: 'x', title: '$f$ (orange) and $\\mu$ (purple)' });
        const h = 0.01, NX = 6000;
        const fArr = new Float64Array(NX); for (let i = 0; i < NX; i++) { const x = i * h; fArr[i] = x < 1 ? Math.sin(Math.PI * x) ** 2 : 0; }
        const cache = new Map();
        const solve = (key) => {
          if (cache.has(key)) return cache.get(key);
          const phi = new Float64Array(NX);
          if (key === 'irr' || key === 'lat') {
            const at = key === 'irr' ? [[Math.round(1 / h), 0.5], [Math.round(Math.SQRT2 / h), 0.5]] : [[Math.round(1 / h), 0.5], [Math.round(2 / h), 0.5]];
            for (let i = 0; i < NX; i++) { let s = fArr[i]; for (const [k, w] of at) if (i >= k) s += w * phi[i - k]; phi[i] = s; }
          } else {
            // density weights μ_j = mass of [jh, (j+1)h)
            const dens = key === 'unif' ? (y) => (y >= 0.5 && y <= 1.5 ? 1 : 0) : (y) => y * Math.exp(-y);
            const J = key === 'unif' ? Math.round(1.5 / h) + 1 : Math.round(30 / h);
            const mu = new Float64Array(J); let tot = 0;
            for (let j = 0; j < J; j++) { const a = j * h, b = a + h; mu[j] = (dens(a) + 4 * dens((a + b) / 2) + dens(b)) * h / 6; tot += mu[j]; }
            for (let j = 0; j < J; j++) mu[j] /= tot;
            for (let i = 0; i < NX; i++) { let s = fArr[i]; const top = Math.min(i, J - 1); for (let j = 1; j <= top; j++) s += mu[j] * phi[i - j]; phi[i] = s / (1 - mu[0]); }
          }
          cache.set(key, phi); return phi;
        };
        let st = {};
        v.legend([['blue', '$\\varphi(x)$'], ['green', '$\\frac1m\\int f=\\frac1{2m}$', { dash: true }], ['orange', '$f$'], ['purple', '$\\mu$']]);
        v.render(() => {
          const key = which.value, X = XS.value, mu = MU[key], phi = solve(key), lim = 0.5 / mu.m;
          top.setView([0, X], [0, Math.max(1.05, lim * 1.5)]);
          const n = Math.min(NX - 1, Math.round(X / h)), step = Math.max(1, Math.floor(n / 2400));
          const pts = []; for (let i = 0; i <= n; i += step) pts.push([i * h, phi[i]]);
          top.hline(lim, { color: 'green', width: 2, dash: [6, 4] });
          top.path(pts, { color: 'blue', width: 1.6 });
          // f and μ
          bot.fn((x) => (x < 1 ? Math.sin(Math.PI * x) ** 2 : 0), { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.15 });
          if (key === 'unif') bot.rect(0.5, 0, 1.5, 1, { fill: 'purple', fillAlpha: 0.2, color: 'purple', width: 1.6 });
          else if (key === 'gamma') bot.fn((x) => x * Math.exp(-x), { color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.15 });
          else { const at = key === 'irr' ? [1, Math.SQRT2] : [1, 2]; for (const a of at) bot.arrow(a, 0, a, 0.5 * 1.6, { color: 'purple', width: 2.6, head: 8 }); }
          // tail oscillation
          const i0 = Math.round((X - 3) / h); let lo = Infinity, hi = -Infinity; for (let i = i0; i <= n; i++) { lo = Math.min(lo, phi[i]); hi = Math.max(hi, phi[i]); }
          st = { key, lim, lo, hi, m: mu.m, X };
        });
        v.readout(() => {
          const s = st;
          return `$m = ${v.fix(s.m, 4)}$, predicted limit $\\frac1{2m} = ${v.fix(s.lim, 4)}$. On $[${s.X - 3}, ${s.X}]$: $\\varphi$ ranges over $[${v.fix(s.lo, 4)},\\,${v.fix(s.hi, 4)}]$` + (s.key === 'lat' ? ' — the lattice case does not converge.' : '.');
        });
      },
    },
  ],
};
