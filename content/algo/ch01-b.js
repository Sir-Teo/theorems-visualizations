// Algorithms — Chapter 1 (part b): little-o, limits, growth hierarchy and the standard sums

// ---------- shared helpers ----------
const LOG2 = Math.log10(2);
/** Polyline clipped to y ∈ [y0, y1] (data units): segments leaving the band are cut at its edge. */
function clipPath(pts, y0, y1) {
  const out = []; let prev = null;
  const cut = (p, q, y) => [p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]), y];
  for (const p of pts) {
    if (!p || !isFinite(p[1])) { out.push(null); prev = null; continue; }
    const inP = p[1] >= y0 && p[1] <= y1;
    if (prev) {
      const inQ = prev[1] >= y0 && prev[1] <= y1;
      if (inQ && !inP) { out.push(cut(prev, p, p[1] > y1 ? y1 : y0)); out.push(null); }
      else if (!inQ && inP) out.push(cut(prev, p, prev[1] > y1 ? y1 : y0));
      else if (!inQ && !inP && (prev[1] - y1) * (p[1] - y1) < 0 && (prev[1] - y0) * (p[1] - y0) < 0) { out.push(cut(prev, p, prev[1] > y1 ? y1 : y0), cut(prev, p, p[1] > y1 ? y1 : y0), null); }
    }
    if (inP) out.push(p);
    prev = p;
  }
  return out;
}
/** 10^x as TeX: plain number when moderate, else a power of ten. */
function pow10Tex(x, digits = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '0';
  if (Math.abs(x) < 4) { const y = Math.pow(10, x); return y >= 100 ? String(Math.round(y)) : String(+y.toPrecision(digits)); }
  return `10^{${x.toFixed(1)}}`;
}
const sciTex = (y) => (y === Infinity ? '\\infty' : y < 1e5 ? String(Math.ceil(y)) : y.toExponential(2).replace(/e\+?(-?\d+)/, '\\times10^{$1}'));

// 1.9 — pairs for little-o / little-omega
const PAIRS9 = {
  nlog: { label: '$n$ vs $n\\log_2 n$', f: (n) => n, g: (n) => n * Math.log2(n), type: 'o', ft: 'n', gt: 'n\\log_2 n' },
  sqrt: { label: '$\\sqrt n$ vs $n$', f: Math.sqrt, g: (n) => n, type: 'o', ft: '\\sqrt n', gt: 'n' },
  logr: { label: '$\\log_2 n$ vs $n^{1/4}$', f: Math.log2, g: (n) => Math.pow(n, 0.25), type: 'o', ft: '\\log_2 n', gt: 'n^{1/4}' },
  sq: { label: '$n^2$ vs $n\\log_2 n$', f: (n) => n * n, g: (n) => n * Math.log2(n), type: 'w', ft: 'n^2', gt: 'n\\log_2 n' },
  lin: { label: '$2n+\\sqrt n$ vs $n$', f: (n) => 2 * n + Math.sqrt(n), g: (n) => n, type: 'o', ft: '2n+\\sqrt n', gt: 'n', theta: true },
};
const GRID9 = Array.from({ length: 6001 }, (_, k) => Math.pow(10, 100 * k / 6000));
/** Least n0 with the test holding for every n ≥ n0 (checked on a log grid to 1e100); Infinity if it still fails there. */
function n0Of(P, c) {
  const ok = (n) => (P.type === 'o' ? P.f(n) <= c * P.g(n) : P.f(n) >= c * P.g(n));
  let last = -1;
  for (let k = 0; k < GRID9.length; k++) if (!ok(GRID9[k])) last = k;
  if (last < 0) return 1;
  if (last === GRID9.length - 1) return Infinity;
  let lo = GRID9[last], hi = GRID9[last + 1];
  for (let it = 0; it < 60; it++) { const m = Math.sqrt(lo * hi); if (ok(m)) hi = m; else lo = m; }
  return Math.max(1, Math.ceil(hi - 1e-9));
}

// 1.10 — pairs given by log10(f/g) on the positive integers
const PAIRS10 = {
  half: { label: '$\\frac{n^2+3n}{2n^2}$', lr: (n) => Math.log10((1 + 3 / n) / 2), ft: 'n^2+3n', gt: '2n^2', lim: String.raw`\lim f/g = \tfrac12`, verdict: String.raw`f = \Theta(g)` },
  slow: { label: '$\\frac{n\\log_2 n}{n^{1.2}}$', lr: (n) => Math.log10(Math.log2(n)) - 0.2 * Math.log10(n), ft: 'n\\log_2 n', gt: 'n^{1.2}', lim: String.raw`\lim f/g = 0`, verdict: String.raw`f = o(g)`, note: 'though it rises at first' },
  exp: { label: '$\\frac{2^n}{n^{10}}$', lr: (n) => n * LOG2 - 10 * Math.log10(n), ft: '2^n', gt: 'n^{10}', lim: String.raw`\lim f/g = \infty`, verdict: String.raw`f = \omega(g)`, note: 'after dipping to 10⁻³⁰ near n = 14' },
  osc: { label: '$\\frac{n}{n^{1+\\sin n}}$', lr: (n) => -Math.sin(n) * Math.log10(n), ft: 'n', gt: 'n^{1+\\sin n}', lim: String.raw`\limsup f/g = \infty,\ \liminf f/g = 0`, verdict: String.raw`f \ne O(g),\ f \ne \Omega(g)` },
  wob: { label: '$\\frac{n(2+\\sin n)}{n}$', lr: (n) => Math.log10(2 + Math.sin(n)), ft: 'n(2+\\sin n)', gt: 'n', lim: String.raw`\limsup f/g = 3,\ \liminf f/g = 1`, verdict: String.raw`f = \Theta(g)`, note: 'with no limit at all' },
};
const NS10 = (() => { const s = new Set(); for (let n = 1; n <= 3000; n++) s.add(n); for (let k = 0; k <= 6000; k++) s.add(Math.round(3000 * Math.pow(1e12 / 3000, k / 6000) * (1 + 0.37 * Math.sin(k * 7.3) / 6000 * 40))); return [...s].filter((n) => n >= 1 && n <= 1e12).sort((a, b) => a - b); })();

// 1.11 — growth families in log space: L(x) = log10 f(n) at x = log10 n
const FAM = {
  polylog: (x, p) => p.a * Math.log10(x / LOG2),
  poly: (x, p) => p.b * x,
  exp: (x, p) => Math.pow(10, x) * Math.log10(p.c),
  fact: (x, p) => p.lgamma(Math.pow(10, x) + 1) / Math.LN10,
};
const MATCH = {
  pl: { slow: 'polylog', fast: 'poly', st: (p) => `(\\log_2 n)^{${p.a}}`, ft: (p) => `n^{${+p.b.toFixed(2)}}`, xmax: 1e7 },
  pe: { slow: 'poly', fast: 'exp', st: (p) => `n^{${+p.b.toFixed(2)}}`, ft: (p) => `${+p.c.toFixed(3)}^n`, xmax: 300 },
  ef: { slow: 'exp', fast: 'fact', st: (p) => `${+p.c.toFixed(3)}^n`, ft: () => 'n!', xmax: 300 },
};
function crossover(M, p) {
  const d = (x) => FAM[M.fast](x, p) - FAM[M.slow](x, p);
  const xs = Array.from({ length: 4001 }, (_, k) => 1e-3 * Math.pow(M.xmax / 1e-3, k / 4000));
  let last = -1; for (let k = 0; k < xs.length; k++) if (!(d(xs[k]) > 0)) last = k;
  if (last < 0) return { x: 0, d };
  if (last === xs.length - 1) return { x: Infinity, d };
  let lo = xs[last], hi = xs[last + 1]; for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (d(m) > 0) hi = m; else lo = m; }
  return { x: hi, d };
}

export default {
  collection: 'algo',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Little-o and little-ω',
      credit: 'Landau, 1909',
      statement: String.raw`Let $f, g$ be eventually positive functions on the positive integers.

- $f = o(g)$ if for **every** $c > 0$ there is an $n_0$ (allowed to depend on $c$) with $f(n) \le c\,g(n)$ for all $n \ge n_0$.
- $f = \omega(g)$ if for **every** $c > 0$ there is an $n_0$ with $f(n) \ge c\,g(n)$ for all $n \ge n_0$; equivalently $g = o(f)$.

Equivalently, $f = o(g)$ iff $f(n)/g(n) \to 0$ and $f = \omega(g)$ iff $f(n)/g(n) \to \infty$. If $f = o(g)$ then $f = O(g)$ but $f \ne \Omega(g)$.`,
      idea: String.raw`Big-O asks for *one* constant (1.8); little-o demands that *every* constant work eventually, so $f$ becomes negligible against $g$. The price is that the threshold $n_0(c)$ may grow without bound as $c \to 0$ — for $n = o(n\log_2 n)$ it is $2^{1/c}$ — but for each fixed $c$ it is finite. For $2n + \sqrt n$ against $n$ no threshold exists once $c \le 2$.`,
      caption: String.raw`Shrink $c$ (or, for the $\omega$ pair, grow it). Left: $f$ against $c\,g$ with the region $n \ge n_0(c)$ in green. Right: the threshold $n_0(c)$ for every $c$ — finite all the way for $o$ and $\omega$ pairs, though it runs off to infinity, and missing (red) for the $\Theta$ pair below $c = 2$.`,
      deps: ['algo-1.8'],
      refs: ['CLRS 4e §3.2'],
      tags: ['asymptotics'],
      viz(v) {
        const pair = v.select('', Object.entries(PAIRS9).map(([value, P]) => ({ value, label: P.label })), 'nlog');
        const c = v.slider('$c$', 0.005, 1e3, 0.1, { log: true, decimals: 3 });
        const L = v.stage({ x: [1, 1e6], y: [1, 1e6], xlog: true, ylog: true, height: 320, title: '$f$ and $c\\,g$' });
        const R = v.stage({ x: [0.005, 1e3], y: [1, 1e70], xlog: true, ylog: true, height: 320, title: 'threshold $n_0(c)$' });
        const cache = {};
        const curve = (k) => cache[k] || (cache[k] = Array.from({ length: 241 }, (_, i) => { const cc = 0.005 * Math.pow(2e5, i / 240); return [cc, n0Of(PAIRS9[k], cc)]; }));
        let cur = null;
        v.render(() => {
          const P = PAIRS9[pair.value], C = c.value, n0 = n0Of(P, C), N = n0 === Infinity ? 1e15 : Math.min(1e80, Math.max(1e4, n0 * 1e3));
          cur = { P, C, n0 };
          let lo = Infinity, hi = 0;
          for (let k = 0; k <= 60; k++) { const n = Math.pow(N, k / 60); for (const y of [P.f(n), C * P.g(n)]) if (y > 0) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
          L.setView([1, N], [lo / 3, hi * 3]);
          if (n0 < Infinity) { L.vband(n0, N, { color: 'green', alpha: 0.09 }); L.vline(n0, { color: 'green', width: 1.6 }); L.text('n₀(c)', n0, hi * 2, { dx: 5, size: 12, weight: 600, color: 'green' }); }
          L.fn((n) => C * P.g(n), { color: 'orange', width: 2.2, dash: [7, 4] });
          L.fn(P.f, { color: 'accent', width: 2.6 });
          // threshold curve
          const pts = curve(pair.value), fin = pts.filter(([, y]) => y < Infinity).map(([, y]) => y), ym = Math.pow(10, Math.max(4, Math.ceil(Math.log10(Math.max(...fin, 10))) + 1));
          R.setView([0.005, 1e3], [1, ym]);
          R.path(pts.map(([cc, y]) => (y < Infinity ? [cc, Math.max(1, y)] : null)), { color: 'accent', width: 2.4 });
          const none = pts.filter(([, y]) => y === Infinity);
          if (none.length) { R.vband(none[0][0], none[none.length - 1][0], { color: 'red', alpha: 0.1 }); R.text('no n₀ exists', Math.sqrt(none[0][0] * none[none.length - 1][0]), Math.pow(ym, 0.85), { align: 'center', size: 12, weight: 600, color: 'red' }); }
          R.vline(C, { color: 'faint', dash: true });
          if (n0 < Infinity) R.dot(C, Math.max(1, n0), { r: 6, color: 'gold' }); else R.dot(C, Math.pow(ym, 0.95), { r: 6, color: 'red' });
        });
        v.legend([['accent', '$f(n)$'], ['orange', '$c\\,g(n)$', { dash: true }], ['gold', 'current $c$', { dot: true }]]);
        v.readout(() => {
          const { P, C, n0 } = cur, rel = P.type === 'o' ? '\\le' : '\\ge';
          const head = `$f = ${P.ft},\\ g = ${P.gt},\\ c = ${v.fix(C, 3)}$: `;
          if (n0 === Infinity) return head + `$f(n) ${rel} c\\,g(n)$ fails for arbitrarily large $n$ — **no** $n_0$ exists, so $f \\ne o(g)$ (here $f = \\Theta(g)$, since $f/g \\to 2$).`;
          const tail = P.type === 'o' ? (P.theta ? `but only because $c > 2$: below that no $n_0$ works, so $f = \\Theta(g)$, not $o(g)$` : `as $c \\to 0$, $n_0(c) \\to \\infty$ but stays finite: $f = o(g)$`) : `as $c \\to \\infty$, $n_0(c)$ grows but stays finite: $f = \\omega(g)$`;
          return head + `$f(n) ${rel} c\\,g(n)$ for all $n \\ge n_0(c) = ${sciTex(n0)}$ · ${tail}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Lemma',
      name: 'Limit criteria for asymptotic order',
      statement: String.raw`Let $f, g$ be positive for all large $n$.

(a) If $f(n)/g(n) \to 0$, then $f = o(g)$; in particular $f = O(g)$ and $f \ne \Omega(g)$.
(b) If $f(n)/g(n) \to L$ with $0 < L < \infty$, then $f = \Theta(g)$.
(c) If $f(n)/g(n) \to \infty$, then $f = \omega(g)$.

More generally, without assuming the limit exists: $f = O(g)$ iff $\limsup f/g < \infty$, and $f = \Omega(g)$ iff $\liminf f/g > 0$. So $f = \Theta(g)$ iff both hold, and when $\limsup f/g = \infty$ and $\liminf f/g = 0$ the two functions are not comparable at all.`,
      idea: String.raw`If $f/g \to L > 0$ then eventually $L/2 < f/g < 2L$, which hands over the constants $c_1 = L/2$, $c_2 = 2L$ of 1.8. The general form is the definition rewritten with upper and lower limits (pma-3.16): $f \le c\,g$ for all large $n$ exactly when the tail suprema of $f/g$ are eventually $\le c$. The pair $n$ and $n^{1+\sin n}$ has ratio $n^{-\sin n}$, which comes arbitrarily close to both $n$ and $1/n$ along the integers.`,
      caption: String.raw`The ratio $f(n)/g(n)$ at integer $n$ (dots, log scale) with its running supremum and infimum over $[n, N]$; slide $N$ out to $10^{12}$. Where the two envelopes close in on a value, the limit exists; $n(2+\sin n)$ against $n$ never settles yet stays between 1 and 3 — still $\Theta$.`,
      deps: ['algo-1.9', 'pma-3.16'],
      refs: ['CLRS 4e §3.2', 'Erickson App. II'],
      tags: ['asymptotics'],
      viz(v) {
        const pair = v.select('$f/g$', Object.entries(PAIRS10).map(([value, P]) => ({ value, label: P.label })), 'osc');
        const NN = v.slider('look out to $N$', 100, 1e12, 1e8, { log: true, fmt: (x) => v.M.pow10Text(Math.round(Math.log10(x))) });
        const YT = []; for (let k = -8; k <= 8; k += 2) YT.push([k, k === 0 ? '1' : v.M.pow10Text(k)]);
        const s = v.stage({ x: [1, 1e8], y: [-8.6, 8.6], xlog: true, axes: 'box', height: 360, yticks: YT, title: '$f(n)/g(n)$ on a log scale, with its tail supremum and infimum' });
        const cache = {};
        let cur = null;
        v.render(() => {
          const P = PAIRS10[pair.value], N = Math.pow(10, Math.round(Math.log10(NN.value) * 4) / 4);
          const all = cache[pair.value] || (cache[pair.value] = NS10.map((n) => [n, P.lr(n)]).filter(([, y]) => isFinite(y)));
          const pts = all.filter(([n]) => n <= N);
          const sup = new Array(pts.length), inf = new Array(pts.length);
          for (let k = pts.length - 1; k >= 0; k--) { sup[k] = Math.max(pts[k][1], k + 1 < pts.length ? sup[k + 1] : -Infinity); inf[k] = Math.min(pts[k][1], k + 1 < pts.length ? inf[k + 1] : Infinity); }
          let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          y0 = Math.max(-8.6, Math.min(-1, y0 - 0.15 * (y1 - y0))); y1 = Math.min(8.6, Math.max(1, y1 + 0.15 * (y1 - y0)));
          s.setView([1, N], [y0, y1]);
          const T = []; if (y1 - y0 <= 4) { for (let k = Math.floor(y0); k <= y1; k++) for (const mm of [1, 2, 5]) { const t = k + Math.log10(mm); if (t >= y0 && t <= y1) T.push([t, v.fmt(Math.pow(10, t), 3)]); } } else for (let k = Math.ceil(y0 / 2) * 2; k <= y1; k += 2) T.push([k, k === 0 ? '1' : v.M.pow10Text(k)]);
          s.setTicks(null, T);
          s.hline(0, { color: 'muted', width: 1 });
          const vis = pts.filter(([, y]) => y >= y0 && y <= y1), stride = Math.max(1, Math.floor(vis.length / 3500));
          s.path(clipPath(pts.map(([n], k) => [n, sup[k]]), y0, y1), { color: 'orange', width: 2.2 });
          s.path(clipPath(pts.map(([n], k) => [n, inf[k]]), y0, y1), { color: 'purple', width: 2.2 });
          s.dots(vis.filter((_, k) => k % stride === 0), { r: 1.6, color: 'accent', alpha: 0.55 });
          const k0 = pts.findIndex(([n]) => n >= N / 100);
          cur = { P, N, hi: sup[k0], lo: inf[k0] };
          s.vband(N / 100, N, { color: 'gold', alpha: 0.07 });
        });
        v.legend([['accent', '$f(n)/g(n)$', { dot: true }], ['orange', '$\\sup_{m\\ge n} f/g$ (up to $N$)'], ['purple', '$\\inf_{m\\ge n} f/g$'], ['gold', 'last two decades', { area: true }]]);
        v.readout(() => {
          const { P, N, hi, lo } = cur;
          return `$f = ${P.ft},\\ g = ${P.gt}$ · on $[N/100, N]$ with $N = ${pow10Tex(Math.log10(N))}$: $\\sup f/g = ${pow10Tex(hi)},\\ \\inf f/g = ${pow10Tex(lo)}$ · in the limit $${P.lim}$, so $${P.verdict}$${P.note ? ` (${P.note})` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Growth hierarchy: logs, polynomials, exponentials',
      statement: String.raw`For all constants $a > 0$, $b > 0$ and $c > 1$,
$$(\log n)^a = o(n^b),\qquad n^b = o(c^n),\qquad c^n = o(n!),\qquad n! = o(n^n).$$
So every power of a logarithm is eventually beaten by every positive power of $n$, every polynomial by every exponential with base above 1, and every exponential by the factorial — however the constants are chosen; only the crossover point moves.`,
      idea: String.raw`By the limit criterion (1.10) it suffices that each ratio tends to $0$. Substituting $n = e^u$ turns $(\ln n)^a/n^b$ into $u^a/e^{bu}$, and $n^b/c^n \to 0$ is the statement that exponentials beat powers (pma-3.20; or L'Hôpital, pma-5.13). For $c^n/n!$: once $n > 2c$ each further factor $c/n$ is below $\tfrac12$. And $n!/n^n = \prod_k (k/n) \le 1/n$.`,
      caption: String.raw`Choose a match-up and make the slower family as strong as you like — a huge power of $\log n$, a polynomial of degree 50, a base barely above 1. Both curves are drawn as $\log_{10} f$ against $\log_{10} n$ (a log–log plot that reaches far beyond floating point); the window always extends past the last crossover, after which the faster family stays ahead for good.`,
      deps: ['algo-1.10', 'pma-3.20', 'pma-5.13'],
      refs: ['CLRS 4e §3.3'],
      tags: ['asymptotics'],
      viz(v) {
        const m = v.select('', [{ value: 'pl', label: '$(\\log n)^a$ vs $n^b$' }, { value: 'pe', label: '$n^b$ vs $c^n$' }, { value: 'ef', label: '$c^n$ vs $n!$' }], 'pl', { onChange: () => { if (m.value === 'pe') { if (b.value < 1) b.set(10); if (c.value > 2) c.set(1.05); } if (m.value === 'pl' && b.value > 2) b.set(0.25); if (m.value === 'ef' && c.value < 5) c.set(20); } });
        const a = v.slider('$a$', 1, 40, 8, { step: 0.5 });
        const b = v.slider('$b$', 0.02, 50, 0.25, { log: true, decimals: 2 });
        const c = v.slider('$c$', 1.001, 100, 1.05, { log: true, decimals: 3 });
        const s = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', height: 370, title: '$\\log_{10} f(n)$ against $\\log_{10} n$' });
        let cur = null;
        v.render(() => {
          const M = MATCH[m.value], p = { a: a.value, b: b.value, c: c.value, lgamma: v.M.lgamma };
          a.el.hidden = m.value !== 'pl'; b.el.hidden = m.value === 'ef'; c.el.hidden = m.value === 'pl';
          const X = crossover(M, p), xs = X.x, xmax = Math.max(2, xs * 1.6);
          const Ls = (x) => FAM[M.slow](x, p), Lf = (x) => FAM[M.fast](x, p);
          const xmin = m.value === 'pl' ? Math.min(0.35, xmax * 0.02) : 0;
          const samp = Array.from({ length: 401 }, (_, k) => xmin + (xmax - xmin) * k / 400);
          const ys = samp.map(Ls), yf = samp.map(Lf);
          const ylo = Math.min(0, ...ys.filter(isFinite), ...yf.filter(isFinite));
          const yhi = Math.max(...ys.filter(isFinite), xs > 0 ? Ls(xs) : 1) * 1.45 + 1;
          s.setView([0, xmax], [ylo - 0.04 * (yhi - ylo), yhi]);
          cur = { M, p, xs, X };
          if (xs > 0) { s.vband(0, xs, { color: 'purple', alpha: 0.05 }); }
          s.vband(xs, xmax, { color: 'green', alpha: 0.08 });
          s.path(clipPath(samp.map((x, k) => [x, ys[k]]), ylo - 1, yhi), { color: 'purple', width: 2.6 });
          s.path(clipPath(samp.map((x, k) => [x, yf[k]]), ylo - 1, yhi), { color: 'orange', width: 2.6 });
          if (xs > 0) { s.dot(xs, Ls(xs), { r: 6, color: 'green' }); const left = xs > 0.3 * xmax; s.text('last crossover', xs, Ls(xs), { dx: left ? -8 : 8, dy: -14, align: left ? 'right' : 'left', size: 12, weight: 600, color: 'green' }); }
          s.text('faster family ahead for good →', xmax * 0.985, ylo + 0.06 * (yhi - ylo), { align: 'right', size: 12, color: 'green' });
        });
        v.legend([['purple', 'slower family'], ['orange', 'faster family']]);
        v.readout(() => {
          const { M, p, xs, X } = cur;
          if (xs === 0) return `$${M.ft(p)}$ is ahead of $${M.st(p)}$ from the start.`;
          let ok = true; for (let k = 1; k <= 200; k++) if (!(X.d(xs * (1 + 9 * k / 200)) > 0)) ok = false;
          const nTex = xs < 6 ? String(Math.round(Math.pow(10, xs))) : `10^{${xs.toFixed(1)}}`;
          return `$${M.st(p)}$ leads until $n^\\ast \\approx ${nTex}$; from there on $${M.ft(p)}$ wins: $\\log_{10}$ of the ratio is ${ok ? 'positive' : '**not** positive'} at every checked point up to $10 n^\\ast$${ok ? ' ✓' : ''} and tends to $\\infty$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Lemma',
      name: 'Geometric sums are dominated by their largest term',
      statement: String.raw`For $r > 0$, $r \ne 1$, and $n \ge 0$, $\displaystyle\sum_{k=0}^{n} r^k = \frac{r^{n+1}-1}{r-1}$. Consequently:

(a) if $0 < r < 1$: $\;1 \le \sum_{k=0}^n r^k < \dfrac{1}{1-r}$ — the sum is $\Theta(1)$, the size of its first (largest) term;
(b) if $r > 1$: $\;r^n \le \sum_{k=0}^n r^k < \dfrac{r}{r-1}\,r^n$ — the sum is $\Theta(r^n)$, the size of its last (largest) term;
(c) if $r = 1$ the sum is $n+1$: all terms count equally and no constant bounds it by its largest term.`,
      idea: String.raw`Multiplying by $r-1$ telescopes the sum (pma-3.26). Read from the largest term downwards, each earlier term is smaller by a fixed factor, so the whole sum is at most the largest term times $1 + q + q^2 + \cdots = 1/(1-q)$ with $q = \min(r, 1/r) < 1$. The constant depends on $r$ and blows up as $r \to 1$. This is why, in recursion trees (ch. 2), geometrically growing level costs leave only the bottom level and shrinking ones only the root.`,
      caption: String.raw`Bars are the terms $r^k$ scaled so the largest has height 1; the tower on the right stacks them all, and its height is the ratio sum / largest term. Slide $r$: the tower stays below the green bound $\max(r,1)/|r-1|$ — until $r = 1$, where it grows with $n$. The right panel follows the ratio as $n$ grows.`,
      deps: ['algo-1.8', 'pma-3.26'],
      refs: ['CLRS 4e App. A.1'],
      tags: ['sums'],
      viz(v) {
        const r = v.slider('$r$', 0.2, 3, 1.6, { step: 0.01, decimals: 2 });
        const nn = v.slider('$n$', 1, 40, 12, { int: true });
        v.button('$r = 1$', () => r.set(1));
        const L = v.stage({ x: [-1, 16], y: [0, 3], axes: false, height: 320 });
        const R = v.stage({ x: [0, 60], y: [0, 3], axes: 'box', height: 320, title: 'sum / largest term as $n$ grows' });
        const ratio = (q, n) => { let s = 0, m = 0; for (let k = 0; k <= n; k++) { const t = Math.pow(q, k); s += t; m = Math.max(m, t); } return s / m; };
        v.render(() => {
          const q = r.value, n = nn.value, one = Math.abs(q - 1) < 1e-9, B = one ? Infinity : Math.max(q, 1) / Math.abs(q - 1);
          const M = Math.max(1, Math.pow(q, n)), tot = ratio(q, n), H = Math.max(tot, one ? 0 : Math.min(B, 60), 1.4) * 1.12;
          const bw = Math.min(0.42, 6 / (n + 1)), xT = n + 2.4;
          L.setView([-1, n + 4], [-0.06 * H, H]);
          L.hline(0, { color: 'ink', width: 1 });
          L.line(-0.6, 1, n + 0.6, 1, { color: 'faint', dash: [4, 4] });
          for (let k = 0; k <= n; k++) { const t = Math.pow(q, k) / M; L.rect(k - bw, 0, k + bw, t, { fill: t === 1 ? 'gold' : 'accent', fillAlpha: 0.5, color: t === 1 ? 'gold' : 'accent', width: 1 }); }
          let y = 0; for (let k = 0; k <= n; k++) { const t = Math.pow(q, k) / M; L.rect(xT - 0.7, y, xT + 0.7, y + t, { fill: k % 2 ? 'teal' : 'accent', fillAlpha: 0.45, color: 'panel', width: 0.6 }); y += t; }
          if (B < H) { L.line(xT - 1.1, B, xT + 1.1, B, { color: 'green', width: 2.4 }); L.text('bound', xT - 1.2, B, { align: 'right', baseline: 'middle', size: 11.5, color: 'green', weight: 600 }); }
          L.text('largest term = 1', -0.6, 1, { dy: -9, size: 11.5, color: 'muted' });
          L.text(`${v.fix(tot, 2)}×`, xT, B < H && B - tot < 0.08 * H ? B : tot, { align: 'center', dy: -9, size: 12.5, weight: 700, color: 'ink' });
          // ratio vs n
          const pts = []; for (let m = 0; m <= 60; m++) pts.push([m, ratio(q, m)]);
          const yR = Math.max(...pts.map((p) => p[1]), one ? 0 : Math.min(B, 70)) * 1.12;
          R.setView([0, 60], [0, Math.max(2, yR)]);
          if (B < 1e9) R.hline(B, { color: 'green', width: 2, dash: [6, 4] });
          R.path(pts, { color: 'accent', width: 2.2 });
          R.dot(n, tot, { r: 5.5, color: 'gold' });
        });
        v.legend([['gold', 'largest term', { area: true }], ['accent', 'other terms', { area: true }], ['green', 'bound $\\max(r,1)/|r-1|$']]);
        v.readout(() => {
          const q = r.value, n = nn.value, one = Math.abs(q - 1) < 1e-9, tot = ratio(q, n);
          if (one) return `$r = 1$: the sum is $n + 1 = ${n + 1}$ times its largest term — the ratio grows without bound, so the sum is **not** $\\Theta$(largest term).`;
          const B = Math.max(q, 1) / Math.abs(q - 1);
          return `$\\sum_{k=0}^{${n}} r^k = ${v.fix(tot, 3)} \\times$ largest term $(${q > 1 ? 'r^n' : 'r^0 = 1'})$, below the bound $${q > 1 ? '\\tfrac{r}{r-1}' : '\\tfrac1{1-r}'} = ${v.fix(B, 3)}$ ✓ for every $n$: $\\Theta(${q > 1 ? 'r^n' : '1'})$ with a constant that depends on $r$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Lemma',
      name: 'Bounding monotone sums by integrals',
      statement: String.raw`Let $m \le n$ be integers and $f$ monotone on $[m-1, n+1]$. If $f$ is nondecreasing,
$$\int_{m-1}^{n} f(x)\,dx \;\le\; \sum_{k=m}^{n} f(k) \;\le\; \int_{m}^{n+1} f(x)\,dx,$$
and if $f$ is nonincreasing the two inequalities hold in the opposite direction: $\int_m^{n+1} f \le \sum_{k=m}^n f(k) \le \int_{m-1}^n f$.`,
      idea: String.raw`On $[k, k+1]$ draw the rectangle of height $f(k)$. By monotonicity it lies on one side of the graph of $f$ and on the other side of the graph of the shifted function $f(x-1)$; integrating over $[k,k+1]$ (pma-6.12, order) and summing over $k$ gives both bounds. The two integrals differ by about one term, $f(n+1) - f(m-1)$ at most, so a sum whose terms are small compared with the total is pinned down by an integral.`,
      caption: String.raw`Unit-width bars of height $f(k)$ sit between the graph of $f$ (orange) and its shift $f(x-1)$ (purple); the coloured slivers are the two errors. Pick a function and slide $n$. The last choice is not monotone and the sum escapes the bounds.`,
      deps: ['algo-1.8', 'pma-6.12'],
      refs: ['CLRS 4e App. A.2'],
      tags: ['sums'],
      viz(v) {
        const FUN = {
          ln: { label: '$\\ln x$', f: Math.log, F: (x) => (x > 0 ? x * Math.log(x) - x : 0), m: 1, mono: 'inc' },
          sqrt: { label: '$\\sqrt x$', f: Math.sqrt, F: (x) => (2 / 3) * Math.pow(x, 1.5), m: 1, mono: 'inc' },
          sq: { label: '$x^2$', f: (x) => x * x, F: (x) => x * x * x / 3, m: 1, mono: 'inc' },
          inv: { label: '$1/x$', f: (x) => 1 / x, F: Math.log, m: 2, mono: 'dec' },
          osc: { label: 'not monotone', f: (x) => 1.2 + 0.9 * Math.cos(2 * Math.PI * x) + 0.15 * x, F: (x) => 1.2 * x + 0.9 * Math.sin(2 * Math.PI * x) / (2 * Math.PI) + 0.075 * x * x, m: 1, mono: 'none' },
        };
        const which = v.select('$f$', Object.entries(FUN).map(([value, P]) => ({ value, label: P.label })), 'ln');
        const nn = v.slider('$n$', 2, 20, 8, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 3], axes: true, height: 340 });
        let cur = null;
        v.render(() => {
          const P = FUN[which.value], f = P.f, m = P.m, n = nn.value;
          const sh = (x) => f(x - 1);
          let lo = 0, hi = 0; for (let k = 0; k <= 400; k++) { const x = m + (n + 1 - m) * k / 400; for (const y of [f(x), sh(x)]) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
          if (P.mono === 'dec') hi = Math.min(hi, 1.15);
          lo = Math.max(lo, -0.3 * hi);
          const yl = lo - 0.08 * (hi - lo), cl = (g) => (x) => { const y = g(x); return y < yl ? NaN : y; };
          s.setView([m - 1.3, n + 1.5], [yl, hi * 1.1]);
          for (let k = m; k <= n; k++) {
            const h = f(k);
            s.between(f, () => h, k, k + 1, { fill: 'orange', fillAlpha: 0.32 });
            s.between((x) => Math.max(sh(x), yl), () => h, k, k + 1, { fill: 'purple', fillAlpha: 0.3 });
            s.rect(k, 0, k + 1, h, { color: 'accent', width: 1.3, fill: 'accent', fillAlpha: 0.12 });
          }
          s.fn(cl(f), { domain: [Math.max(m - 1, 1e-3), n + 1.4], color: 'orange', width: 2.4 });
          s.fn(cl(sh), { domain: [Math.max(m, 1 + 1e-3), n + 1.4], color: 'purple', width: 2.4 });
          s.vline(m, { color: 'faint', dash: true }); s.vline(n + 1, { color: 'faint', dash: true });
          let S = 0; for (let k = m; k <= n; k++) S += f(k);
          cur = { P, n, m, S, I1: P.F(n) - P.F(m - 1), I2: P.F(n + 1) - P.F(m) };
        });
        v.legend([['accent', '$\\sum f(k)$ (bars)', { area: true }], ['orange', 'graph of $f$'], ['purple', 'shifted graph $f(x-1)$']]);
        v.readout(() => {
          const { P, n, m, S, I1, I2 } = cur, lo = Math.min(I1, I2), hi = Math.max(I1, I2), ok = S >= lo - 1e-9 && S <= hi + 1e-9;
          const ints = `\\int_{${m - 1}}^{${n}} f = ${v.fix(I1, 3)},\\ \\int_{${m}}^{${n + 1}} f = ${v.fix(I2, 3)}`;
          return `$\\sum_{k=${m}}^{${n}} f(k) = ${v.fix(S, 3)}$ · $${ints}$ · ${ok ? `the sum lies between them ✓ (gap ${v.fix(hi - lo, 3)})` : `**the sum escapes the bounds ✗** — $f$ is not monotone`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Lemma',
      name: 'Harmonic numbers: Hₙ = ln n + O(1)',
      credit: 'Euler, 1734',
      statement: String.raw`The harmonic numbers $H_n = \sum_{k=1}^{n} \frac1k$ satisfy, for every $n \ge 1$,
$$\ln(n+1) \;\le\; H_n \;\le\; \ln n + 1 .$$
Hence $H_n = \ln n + O(1) = \Theta(\log n)$. Moreover $H_n - \ln n$ decreases to Euler's constant $\gamma = 0.5772\ldots$, and $H_n = \ln n + \gamma + \frac1{2n} + O(n^{-2})$.`,
      idea: String.raw`Apply 1.13 to the decreasing function $1/x$: $H_n \ge \int_1^{n+1} dx/x = \ln(n+1)$ and $H_n - 1 \le \int_1^n dx/x = \ln n$. The slivers between the bars and the curve have total area $H_n - \ln(n+1)$; slid left into the first column they stack without overlapping inside a unit square, so the total increases with $n$ yet stays below 1, and converges — its limit is $\gamma$.`,
      caption: String.raw`Left: bars $1/k$ over the curve $1/x$; drag *slide* to push every sliver into the unit square over $[1,2]$, where they stack without overlap. Right: $H_n - \ln n$ for $n$ up to a million on a log axis, never leaving the band $[0,1]$ and settling on $\gamma$.`,
      deps: ['algo-1.13'],
      refs: ['CLRS 4e App. A.1', 'Knuth TAOCP Vol. 1 §1.2.7'],
      tags: ['sums'],
      viz(v) {
        const H = new Float64Array(1e6 + 1); for (let k = 1; k <= 1e6; k++) H[k] = H[k - 1] + 1 / k;
        const G = 0.5772156649015329;
        const nn = v.slider('$n$', 1, 1e6, 10, { log: true, int: true });
        const t = v.slider('slide', 0, 1, 0, { step: 0.01 });
        const L = v.stage({ x: [0, 13.5], y: [-0.05, 1.12], axes: 'box', height: 320, title: 'slivers between $1/k$ and $1/x$' });
        const R = v.stage({ x: [1, 1e6], y: [-0.05, 1.12], xlog: true, axes: 'box', height: 320, title: '$H_n - \\ln n$' });
        const COL = ['gold', 'teal', 'pink', 'purple', 'orange', 'green'];
        v.render(() => {
          const n = Math.round(nn.value), T = t.value, X1 = 13.5;
          for (let k = 1; k <= Math.min(n, 12); k++) L.rect(k, 0, k + 1, 1 / k, { color: 'accent', width: 1, fill: 'accent', fillAlpha: 0.08 });
          L.fn((x) => 1 / x, { domain: [0.9, X1], color: 'orange', width: 2.2 });
          if (T > 0) L.rect(1, 0, 2, 1, { color: 'green', width: 2, dash: [6, 4] });
          for (let k = 1; k <= Math.min(n, 3000); k++) {
            const dx = -(k - 1) * T; if (k + 1 + dx > X1) continue;
            const pts = [[k + dx, 1 / k], [k + 1 + dx, 1 / k]]; for (let j = 12; j >= 0; j--) { const x = k + j / 12; pts.push([x + dx, 1 / x]); }
            const c = COL[(k - 1) % COL.length]; L.poly(pts, { fill: c, fillAlpha: 0.7, color: c, width: 0.6 });
          }
          // right: the gap and its bounds
          R.hband(0, 1, { color: 'green', alpha: 0.08 });
          R.hline(G, { color: 'gold', width: 1.8, dash: [6, 4] });
          const pts = [], low = []; for (let j = 0; j <= 600; j++) { const m = Math.max(1, Math.round(Math.pow(1e6, j / 600))); pts.push([m, H[m] - Math.log(m)]); low.push([m, H[m] - Math.log(m + 1)]); }
          R.path(low, { color: 'purple', width: 1.8 });
          R.path(pts, { color: 'accent', width: 2.4 });
          R.dot(n, H[n] - Math.log(n), { r: 5.5, color: 'accent' });
          R.text('γ = 0.5772…', 8e5, G, { dy: -10, align: 'right', size: 12.5, weight: 700, color: 'gold' });
        });
        v.legend([['accent', '$H_n - \\ln n$'], ['purple', '$H_n - \\ln(n+1)$ = sliver total'], ['gold', '$\\gamma$', { dash: true }], ['green', 'band $[0, 1]$', { area: true }]]);
        v.readout(() => {
          const n = Math.round(nn.value), gap = H[n] - Math.log(n);
          return `$n = ${n}$: $H_n = ${v.fix(H[n], 6)}$, $\\ln n = ${v.fix(Math.log(n), 6)}$, $H_n - \\ln n = ${v.fix(gap, 6)} \\in [0, 1]$ ✓ · $\\gamma + \\tfrac1{2n} = ${v.fix(G + 1 / (2 * n), 6)}$ · slivers: $H_n - \\ln(n+1) = ${v.fix(H[n] - Math.log(n + 1), 6)} < 1$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Lemma',
      name: 'log(n!) = Θ(n log n)',
      credit: 'de Moivre and Stirling, 1730',
      statement: String.raw`For every $n \ge 2$,
$$\tfrac n2 \log_2 \tfrac n2 \;\le\; \log_2 n! \;\le\; n \log_2 n ,$$
and for $n \ge 4$ the left side is at least $\tfrac14 n\log_2 n$; hence $\log n! = \Theta(n \log n)$ in any base. Stirling's formula sharpens this to $\log_2 n! = n\log_2(n/e) + \tfrac12\log_2(2\pi n) + o(1)$, so $\log_2 n!/(n\log_2 n) \to 1$.`,
      idea: String.raw`$\log_2 n! = \sum_{k=1}^n \log_2 k$. Each of the $n$ terms is at most $\log_2 n$, which gives the upper bound. The top half of the terms — at least $n/2$ of them — are each at least $\log_2(n/2)$, which gives the lower bound. Stirling (pma-8.22) identifies the constant. This quantity is the information-theoretic lower bound for comparison sorting met in ch. 3.`,
      caption: String.raw`Left: the staircase $\log_2 k$ has area $\log_2 n!$; it fits inside the orange $n \times \log_2 n$ rectangle and contains the purple $\tfrac n2 \times \log_2\tfrac n2$ block. Right: each estimate divided by $\log_2 n!$ as $n$ runs to a million — the crude bounds stay within the factor-2 band and Stirling's estimate converges to 1 fast.`,
      deps: ['algo-1.11', 'pma-8.22'],
      refs: ['CLRS 4e §3.3', 'CLRS 4e Eq. (3.28)'],
      tags: ['asymptotics'],
      viz(v) {
        const lf = (n) => v.M.lgamma(n + 1) / Math.LN2;                       // log2 n!
        const up = (n) => n * Math.log2(n), lo = (n) => (n / 2) * Math.log2(n / 2), st = (n) => n * Math.log2(n / Math.E);
        const nn = v.slider('$n$', 2, 1e6, 16, { log: true, int: true });
        const L = v.stage({ x: [0, 16], y: [0, 4.4], axes: 'box', height: 320, title: 'area under the staircase $= \\log_2 n!$' });
        const R = v.stage({ x: [2, 1e6], y: [-0.05, 2.1], xlog: true, axes: 'box', height: 320, title: 'estimate $/\\ \\log_2 n!$' });
        v.render(() => {
          const n = Math.round(nn.value), Y = Math.log2(n);
          L.setView([-0.02 * n, n * 1.04], [-0.04 * Y, Y * 1.16]);
          L.rect(0, 0, n, Y, { color: 'orange', width: 2.2, dash: [7, 4], fill: 'orange', fillAlpha: 0.05 });
          if (n <= 64) for (let k = 1; k <= n; k++) L.rect(k - 1, 0, k, Math.log2(k), { color: 'accent', width: n > 32 ? 0.6 : 1, fill: 'accent', fillAlpha: 0.3 });
          else L.fn((x) => Math.log2(Math.max(1, Math.ceil(x))), { domain: [0, n], color: 'accent', width: 1.4, fill: 'accent', fillAlpha: 0.3 });
          L.rect(n / 2, 0, n, Math.log2(n / 2), { color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.22 });
          L.tex(String.raw`n\log_2 n`, n * 0.03, Y * 1.08, { size: 14, color: 'orange', align: 'left', baseline: 'middle' });
          L.tex(String.raw`\tfrac n2\log_2\tfrac n2`, n * 0.75, Math.log2(n / 2) * 0.5, { size: 14, color: 'purple', align: 'center', baseline: 'middle' });
          R.hband(0.5, 1, { color: 'green', alpha: 0.07 });
          R.hline(1, { color: 'muted', width: 1 }); R.hline(0.5, { color: 'muted', width: 1, dash: [4, 4] });
          R.fn((m) => up(m) / lf(m), { color: 'orange', width: 2.2 });
          R.fn((m) => lo(m) / lf(m), { color: 'purple', width: 2.2 });
          R.fn((m) => { const y = st(m) / lf(m); return y > -0.05 ? y : NaN; }, { color: 'green', width: 2.2, dash: [6, 4] });
          R.vline(n, { color: 'gold', width: 1.6 });
        });
        v.legend([['orange', '$n\\log_2 n$'], ['purple', '$\\tfrac n2\\log_2\\tfrac n2$'], ['green', 'Stirling $n\\log_2(n/e)$', { dash: true }]]);
        v.readout(() => {
          const n = Math.round(nn.value), F = lf(n);
          return `$n = ${n}$: $\\log_2 n! = ${v.fix(F, 2)}$ · $\\tfrac n2\\log_2\\tfrac n2 = ${v.fix(lo(n), 2)} \\le \\log_2 n! \\le n\\log_2 n = ${v.fix(up(n), 2)}$ ✓ · ratios ${v.fix(lo(n) / F, 3)}, ${v.fix(up(n) / F, 3)} · Stirling residual $\\log_2 n! - n\\log_2(n/e) = ${v.fix(F - st(n), 3)} \\approx \\tfrac12\\log_2(2\\pi n) = ${v.fix(0.5 * Math.log2(2 * Math.PI * n), 3)}$`;
        });
      },
    },
  ],
};
