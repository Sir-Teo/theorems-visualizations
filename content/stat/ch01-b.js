// Statistical Inference — Chapter 1: Statistical models and sampling distributions (items 1.11–1.19; header and 1.1–1.10 in ch01.js)

// ── shared helpers ────────────────────────────────────────────────────────────
const SQ2PI = Math.sqrt(2 * Math.PI);
const phi = (z) => Math.exp(-0.5 * z * z) / SQ2PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const sortNum = (a) => Float64Array.from(a).sort();
const mean = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
/** FNV-1a: a 32-bit seed from a string, so every setting of the controls has its own reproducible stream. */
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Mean, variance (divisor n − 1) and SD by Welford's algorithm. */
function moments(a, f = (x) => x) {
  let n = 0, m = 0, s = 0;
  for (let i = 0; i < a.length; i++) { const x = f(a[i]); n++; const d = x - m; m += d / n; s += d * (x - m); }
  return { n, mean: m, var: n > 1 ? s / (n - 1) : NaN, sd: n > 1 ? Math.sqrt(s / (n - 1)) : NaN };
}
/** Sample quantile (type 7) of an ascending array. */
function qSorted(s, p) { const n = s.length; if (!n) return NaN; const h = (n - 1) * p, lo = Math.floor(h); return lo + 1 < n ? s[lo] + (h - lo) * (s[lo + 1] - s[lo]) : s[lo]; }
function invCdf(cdf, q, lo, hi) { for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (cdf(m) < q) lo = m; else hi = m; } return 0.5 * (lo + hi); }
function rpois(r, lam) { const L = Math.exp(-lam); let k = 0, t = r(); while (t > L) { k++; t *= r(); } return k; }
/** Φ from a table (fast enough for rasters and KS loops; error < 1e-7). */
let PHI_TAB = null;
function PhiFast(M) {
  if (!PHI_TAB) { PHI_TAB = new Float64Array(16002); for (let i = 0; i <= 16001; i++) PHI_TAB[i] = 0.5 * M.erfc((8 - i / 1000) / Math.SQRT2); }
  return (z) => { if (!(z > -8)) return 0; if (z >= 8) return 1; const u = (z + 8) * 1000, i = Math.floor(u); return PHI_TAB[i] + (u - i) * (PHI_TAB[i + 1] - PHI_TAB[i]); };
}

/** The populations the reader can sample from: {pdf, cdf, q (quantile), draw(r), mean, var, view}. */
const POP_LABEL = { normal: 'normal', uniform: 'uniform', expo: 'skewed', bimodal: 'bimodal', t3: 'heavy-tailed', lognorm: 'very skewed', cauchy: 'Cauchy', poisson: 'discrete' };
const popOpts = (keys) => keys.map((k) => ({ value: k, label: POP_LABEL[k] }));
const POP_CACHE = new Map();
function pop(M, key) {
  if (POP_CACHE.has(key)) return POP_CACHE.get(key);
  const D = M.dist, Phi = PhiFast(M); let p;
  if (key === 'normal') { const d = D.normal(0, 1); p = { tex: 'N(0,1)', mean: 0, var: 1, mu3: 0, mu4: 3, pdf: d.pdf, cdf: d.cdf, q: d.quantile, draw: (r) => r.normal(), view: [-3.6, 3.6] }; }
  else if (key === 'uniform') p = { tex: 'U(0,1)', mean: 0.5, var: 1 / 12, mu3: 0, mu4: 1 / 80, pdf: (x) => (x >= 0 && x <= 1 ? 1 : 0), cdf: (x) => clamp(x, 0, 1), q: (u) => u, draw: (r) => r(), view: [-0.2, 1.2] };
  else if (key === 'expo') p = { tex: '\\mathrm{Exp}(1)', mean: 1, var: 1, mu3: 2, mu4: 9, pdf: (x) => (x < 0 ? 0 : Math.exp(-x)), cdf: (x) => (x <= 0 ? 0 : -Math.expm1(-x)), q: (u) => -Math.log1p(-u), draw: (r) => -Math.log(1 - r()), view: [-0.4, 6] };
  else if (key === 'bimodal') {
    const m = 1.3, s = 0.5, cdf = (x) => 0.5 * (Phi((x - m) / s) + Phi((x + m) / s));
    p = { tex: '\\tfrac12N(\\pm1.3,\\,0.5^2)', mean: 0, var: s * s + m * m, mu3: 0, mu4: m ** 4 + 6 * m * m * s * s + 3 * s ** 4, pdf: (x) => (0.5 * (phi((x - m) / s) + phi((x + m) / s))) / s, cdf, q: (u) => invCdf(cdf, u, -6, 6), draw: (r) => (r() < 0.5 ? -m : m) + s * r.normal(), view: [-3.2, 3.2] };
  } else if (key === 't3') { const d = D.studentT(3); p = { tex: 't_3', mean: 0, var: 3, mu3: 0, mu4: Infinity, pdf: d.pdf, cdf: d.cdf, q: d.quantile, draw: (r) => d.sample(r), view: [-6, 6] }; }
  else if (key === 'lognorm') p = { tex: '\\mathrm{LN}(0,1)', mean: Math.exp(0.5), var: (Math.E - 1) * Math.E, pdf: (x) => (x > 0 ? phi(Math.log(x)) / x : 0), cdf: (x) => (x > 0 ? Phi(Math.log(x)) : 0), q: (u) => Math.exp(D.normal(0, 1).quantile(u)), draw: (r) => Math.exp(r.normal()), view: [-0.4, 8] };
  else if (key === 'cauchy') p = { tex: '\\mathrm{Cauchy}(0,1)', mean: NaN, var: Infinity, pdf: (x) => 1 / (Math.PI * (1 + x * x)), cdf: (x) => 0.5 + Math.atan(x) / Math.PI, q: (u) => Math.tan(Math.PI * (u - 0.5)), draw: (r) => Math.tan(Math.PI * (r() - 0.5)), view: [-8, 8] };
  else if (key === 'poisson') {
    const lam = 3, pm = [Math.exp(-lam)]; for (let k = 1; k <= 60; k++) pm.push((pm[k - 1] * lam) / k);
    const F = []; let c = 0; for (const x of pm) { c += x; F.push(Math.min(1, c)); }
    const cdf = (x) => { const k = Math.floor(x); return k < 0 ? 0 : k > 60 ? 1 : F[k]; };
    p = { tex: '\\mathrm{Poisson}(3)', discrete: true, mean: lam, var: lam, mu3: lam, mu4: lam + 3 * lam * lam, pdf: (k) => (Number.isInteger(k) && k >= 0 && k <= 60 ? pm[k] : 0), cdf, q: (u) => { let k = 0; while (k < 60 && F[k] < u) k++; return k; }, draw: (r) => rpois(r, lam), view: [-0.8, 10.8] };
  }
  p.key = key; p.label = POP_LABEL[key]; p.sd = Math.sqrt(p.var);
  POP_CACHE.set(key, p); return p;
}
/** Largest value of a density on the population's plotting window. */
function peakOf(f, lo, hi) { let m = 0; for (let i = 0; i <= 400; i++) { const y = f(lo + ((hi - lo) * i) / 400); if (y > m && isFinite(y)) m = y; } return m; }

/**
 * Repeated-sampling engine. sample(r) draws one data set, stat(data) reduces it to what is stored.
 * key() lists everything the simulation depends on: when it changes the RNG is reseeded from it and `init`
 * repetitions are drawn. Adds the Draw 1 / Draw 100 / Draw 10,000 / Clear buttons.
 */
function repeater(v, o) {
  const S = { vals: [], last: null, key: null, r: null, ver: 0 };
  const cap = o.cap ?? 250000;
  S.run = (m) => { for (let i = 0; i < m && S.vals.length < cap; i++) { const d = o.sample(S.r); S.vals.push(o.stat(d)); S.last = d; } S.ver++; };
  S.sync = () => {
    const k = String(o.key());
    if (k !== S.key) { S.key = k; S.r = v.rng(hashStr(k + '|' + (o.seed ?? 'stat'))); S.vals = []; S.last = null; S.run(typeof o.init === 'function' ? o.init() : o.init ?? 1000); }
    return S;
  };
  S.id = () => S.key + '#' + S.ver;
  for (const m of o.buttons ?? [1, 100, 10000]) v.button(`Draw ${commas(m)}`, () => { S.sync(); S.run(m); });
  if (o.clear !== false) v.button('Clear', () => { S.sync(); S.vals = []; S.last = null; S.ver++; });
  return S;
}
/** Histogram normalised by ALL finite values (so mass outside [lo, hi] is honestly missing). */
function binned(vals, lo, hi, nb, f) {
  const w = (hi - lo) / nb, counts = new Array(nb).fill(0); let N = 0, inside = 0;
  for (let i = 0; i < vals.length; i++) {
    const x = f ? f(vals[i]) : vals[i]; if (x !== x) continue; N++; // NaN skipped; ±∞ counts as outside
    if (x < lo || x > hi) continue; counts[Math.min(nb - 1, Math.floor((x - lo) / w))]++; inside++;
  }
  const edges = []; for (let i = 0; i <= nb; i++) edges.push(lo + i * w);
  const density = counts.map((c) => (N ? c / (N * w) : 0));
  return { edges, counts, density, N, out: N - inside, max: Math.max(0, ...density) };
}
/** Kolmogorov distance sup|F̂ − F| between an ascending sample and a continuous cdf. */
function ksDist(sorted, cdf) {
  const n = sorted.length; let d = 0;
  for (let i = 0; i < n; i++) { const F = cdf(sorted[i]), a = (i + 1) / n - F, b = F - i / n; if (a > d) d = a; if (b > d) d = b; }
  return d;
}
/** Set a box-axes view leaving ~34 px on the left and ~20 px at the bottom, so tick labels sit in empty space. */
function viewPad(s, xr, yr, o = {}) {
  const pad = (r, f, lg) => { const g = f / (1 - f); return lg ? [r[0] / Math.pow(r[1] / r[0], g), r[1]] : [r[0] - g * (r[1] - r[0]), r[1]]; };
  s.setView(pad(xr, 34 / Math.max(150, s.width), o.xlog), pad(yr, 20 / Math.max(100, s.height), o.ylog));
}
/** TeX axis names just inside the top-left and bottom-right corners of a padded box panel. */
function axisLabels(s, xl, yl) {
  const b = s.bounds;
  if (xl) s.tex(xl, b.x[1], b.y[0], { color: 'muted', size: 15, align: 'right', baseline: 'bottom', dx: -8, dy: -22 });
  if (yl) s.tex(yl, b.x[0], b.y[1], { color: 'muted', size: 15, align: 'left', baseline: 'top', dx: 40, dy: 4 });
}
/** Legend / title setters that touch the DOM only when the content changes. */
function legender(v) { let last = ''; return (items) => { const k = JSON.stringify(items); if (k !== last) { last = k; v.legend(items); } }; }
function titler(s) { let last = null; return (t) => { if (t !== last) { last = t; s.setTitle(t); } }; }
const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';

/** Snedecor's F law with d1, d2 degrees of freedom. */
function fLaw(M, d1, d2) {
  const lb = M.lbeta(d1 / 2, d2 / 2);
  const pdf = (x) => (x <= 0 ? 0 : Math.exp(0.5 * d1 * Math.log(d1 * x) + 0.5 * d2 * Math.log(d2) - 0.5 * (d1 + d2) * Math.log(d1 * x + d2) - Math.log(x) - lb));
  const cdf = (x) => (x <= 0 ? 0 : M.betaI(d1 / 2, d2 / 2, (d1 * x) / (d1 * x + d2)));
  const q = (p) => { let hi = 1; while (cdf(hi) < p && hi < 1e8) hi *= 2; return invCdf(cdf, p, 0, hi); };
  return { pdf, cdf, q };
}
/** Integrate x·g and x²·g numerically: {m, sd}. */
function momentsOf(M, g, a, b) {
  const m0 = M.integrate(g, a, b, 3000), m1 = M.integrate((x) => x * g(x), a, b, 3000), m2 = M.integrate((x) => x * x * g(x), a, b, 3000);
  return { m: m1 / m0, sd: Math.sqrt(Math.max(0, m2 / m0 - (m1 / m0) ** 2)) };
}

export default {
  collection: 'stat',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Snedecor’s F distribution',
      credit: 'Fisher, 1924; Snedecor, 1934',
      statement: String.raw`If $U\sim\chi^2_{d_1}$ and $V\sim\chi^2_{d_2}$ are independent, the law of
$$F=\frac{U/d_1}{V/d_2}$$
is the **F distribution with $(d_1,d_2)$ degrees of freedom**, $F_{d_1,d_2}$, with density
$$f(x)=\frac{1}{x\,B(\frac{d_1}2,\frac{d_2}2)}\sqrt{\frac{(d_1x)^{d_1}\,d_2^{d_2}}{(d_1x+d_2)^{d_1+d_2}}},\qquad x>0,$$
and mean $d_2/(d_2-2)$ for $d_2>2$. If $T\sim t_\nu$ then $T^2\sim F_{1,\nu}$, and $1/F\sim F_{d_2,d_1}$. For independent normal samples of sizes $n_1,n_2$ with a common variance, $S_1^2/S_2^2\sim F_{n_1-1,\,n_2-1}$.`,
      idea: String.raw`By 1.9 each $(n_j-1)S_j^2/\sigma^2$ is $\chi^2_{n_j-1}$, and the two samples are independent, so the ratio of the scaled variances is $F$ by definition and the unknown $\sigma^2$ cancels. The density comes from the joint density of $(U,V)$ by the change of variables $(U,V)\mapsto(U/V,V)$ and the beta integral (pma-8.20). Because the law rests on the $\chi^2$ form of $S^2$, which needs normal fourth moments, it is notoriously fragile: for heavy-tailed data the variance ratio is far more variable than $F$ predicts.`,
      caption: String.raw`Each repeat draws two independent samples of sizes $n_1$ and $n_2$ and records their variances. Left: one dot per repeat on log–log axes; the variance ratio is the vertical offset from the diagonal, and the orange rays bound the central 95% of $F_{n_1-1,n_2-1}$, so about 5% of dots (red) fall outside. Right: the histogram of the ratio against the exact density. Drag the two sample sizes to watch the right tail shrink; switch to heavy-tailed or skewed data and far more than 5% of the dots escape.`,
      deps: ['stat-1.8', 'stat-1.9', 'pma-8.20'],
      refs: ['Casella–Berger §5.3'],
      tags: ['F distribution', 'normal sampling'],
      viz(v) {
        const M = v.M;
        const n1S = v.slider('$n_1$ (numerator)', 2, 40, 6, { int: true });
        const n2S = v.slider('$n_2$ (denominator)', 2, 40, 11, { int: true });
        const popSel = v.select('population', popOpts(['normal', 'uniform', 'expo', 't3']), 'normal');
        const sL = v.stage({ x: [1e-3, 30], y: [1e-3, 30], xlog: true, ylog: true, height: 320, axes: 'box', title: 'one dot per repeat: $(S_2^2/\\sigma^2,\\ S_1^2/\\sigma^2)$' });
        const sR = v.stage({ x: [0, 6], y: [0, 1], height: 320, axes: 'box', title: 'histogram of $S_1^2/S_2^2$' });
        const svar = (r, P, n) => { let m = 0, s = 0; for (let i = 1; i <= n; i++) { const x = P.draw(r), d = x - m; m += d / i; s += d * (x - m); } return s / (n - 1); };
        const R = repeater(v, {
          key: () => [n1S.value, n2S.value, popSel.value].join('|'),
          sample: (r) => { const P = pop(M, popSel.value); return [svar(r, P, n1S.value) / P.var, svar(r, P, n2S.value) / P.var]; },
          stat: (a) => a, init: 3000,
        });
        const law = memo(), fl = () => law(n1S.value + '|' + n2S.value, () => { const F = fLaw(M, n1S.value - 1, n2S.value - 1); return { ...F, lo: F.q(0.025), hi: F.q(0.975), q99: F.q(0.99) }; });
        v.render(() => {
          const S = R.sync(), F = fl(), V = S.vals;
          viewPad(sL, [1e-3, 30], [1e-3, 30], { xlog: true, ylog: true });
          const inn = [], out = [];
          for (let i = Math.max(0, V.length - 4000); i < V.length; i++) { const [a, b] = V[i], f = a / b; (f < F.lo || f > F.hi ? out : inn).push([b, a]); }
          sL.dots(inn, { r: 1.8, color: 'gold', alpha: 0.5 }); sL.dots(out, { r: 2.2, color: 'red', alpha: 0.8 });
          sL.fn((x) => x, { color: 'muted', dash: [3, 4], width: 1 });
          sL.fn((x) => F.lo * x, { color: 'orange', width: 2 }); sL.fn((x) => F.hi * x, { color: 'orange', width: 2 });
          sL.text(`ratio ${v.fix(F.hi, 2)}`, 30 / Math.max(F.hi, 1.2), 30 * Math.min(1, 1 / F.hi) * F.hi, { color: 'orange', size: 11.5, math: false, align: 'right', dx: -6, dy: 10 });
          sL.text(`ratio ${v.fix(F.lo, 3)}`, 25, 25 * F.lo, { color: 'orange', size: 11.5, math: false, align: 'right', dy: -10 });
          const xmax = Math.min(30, Math.max(2.5, F.q99 * 1.25)), B = binned(V, 0, xmax, 80, (a) => a[0] / a[1]);
          const inB = { edges: B.edges, density: B.density.map((d, i) => (B.edges[i + 1] <= F.lo || B.edges[i] >= F.hi ? 0 : d)) }, outB = { edges: B.edges, density: B.density.map((d, i) => (B.edges[i + 1] <= F.lo || B.edges[i] >= F.hi ? d : 0)) };
          const top = Math.max(B.max, peakOf(F.pdf, xmax * 0.03, xmax)) * 1.15;
          viewPad(sR, [0, xmax], [0, top]);
          sR.hist(inB, { density: true, color: 'accent', fillAlpha: 0.33, outline: false }); sR.hist(outB, { density: true, color: 'red', fillAlpha: 0.45, outline: false });
          sR.hist(B, { density: true, color: 'accent', fillAlpha: 0 });
          sR.fn(F.pdf, { domain: [xmax * 1e-3, xmax], color: 'green', width: 2.4, n: 500 });
          sR.vline(F.lo, { color: 'orange', dash: [5, 4], width: 1.5 }); sR.vline(F.hi, { color: 'orange', dash: [5, 4], width: 1.5 });
          v.legend([['gold', 'repeats inside the central 95%', { dot: true }], ['red', 'outside', { dot: true }], ['orange', '2.5% and 97.5% points of $F$'], ['green', `exact $F_{${n1S.value - 1},${n2S.value - 1}}$ density`]]);
        });
        v.readout(() => {
          const S = R.sync(), F = fl(), N = S.vals.length; if (!N) return 'Press Draw to start.';
          const fs = S.vals.map((a) => a[0] / a[1]), out = fs.filter((f) => f < F.lo || f > F.hi).length / N, d2 = n2S.value - 1, m = moments(fs);
          return String.raw`${commas(N)} repeats · outside the central 95% band: **${pct(out)}** (target 5%) · mean ratio ${v.fix(m.mean, 3)}` + (d2 > 2 ? String.raw` vs $d_2/(d_2-2) = ${v.fix(d2 / (d2 - 2), 3)}$` : ' (theory: infinite for $d_2 \\le 2$)') + ` · Kolmogorov distance to $F_{${n1S.value - 1},${d2}}$: ${v.fix(ksDist(sortNum(fs), F.cdf), 4)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Distribution of order statistics',
      statement: String.raw`Let $X_1,\dots,X_n$ be a random sample from a continuous distribution with cdf $F$ and density $f$, and let $X_{(1)}<\dots<X_{(n)}$ be the sorted values. The $k$-th order statistic has cdf and density
$$P(X_{(k)}\le x)=\sum_{j=k}^n\binom nj F(x)^j(1-F(x))^{n-j},\qquad f_{(k)}(x)=\frac{n!}{(k-1)!\,(n-k)!}\,F(x)^{k-1}\big(1-F(x)\big)^{n-k}f(x).$$
In particular $X_{(n)}$ has cdf $F^n$, $X_{(1)}$ has cdf $1-(1-F)^n$, and for uniform samples $X_{(k)}\sim\mathrm{Beta}(k,\,n-k+1)$, with mean $k/(n+1)$.`,
      idea: String.raw`The event $\{X_{(k)}\le x\}$ says that at least $k$ of the $n$ independent observations fall at or below $x$, and the number that do is $\mathrm{Binomial}(n,F(x))$; that gives the cdf. For the density, $X_{(k)}\in[x,x+dx]$ requires one observation in the tiny interval, $k-1$ below it and $n-k$ above, and the multinomial coefficient counts the ways to choose which. With $F(x)=x$ on $[0,1]$ this is the beta density.`,
      caption: String.raw`Top: the last sorted sample, with the $k$-th smallest value in orange. Below: the histogram of $X_{(k)}$ over many samples against the exact density (green); the faint curves are the densities of all the other order statistics, which tile the population. Slide $k$ from the minimum to the maximum and change $n$; for uniform data the green curve is $\mathrm{Beta}(k, n-k+1)$.`,
      deps: ['stat-1.2'],
      see: ['prob-3.2.7'],
      refs: ['Casella–Berger §5.4'],
      tags: ['order statistics'],
      viz(v) {
        const M = v.M;
        const popSel = v.select('population', popOpts(['uniform', 'normal', 'expo']), 'uniform');
        const nS = v.slider('sample size $n$', 1, 30, 9, { int: true, onChange: (n) => { kS.input.max = n; if (kS.value > n) kS.set(n); } });
        const kS = v.slider('rank $k$', 1, 9, 3, { int: true });
        const sT = v.stage({ x: [0, 1], y: [-1, 1], height: 96, axes: false, full: true, title: 'the last sample, sorted' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', full: true });
        const tH = titler(sH);
        const R = repeater(v, {
          key: () => [popSel.value, nS.value, Math.min(kS.value, nS.value)].join('|'),
          sample: (r) => { const P = pop(M, popSel.value), xs = new Array(nS.value); for (let i = 0; i < xs.length; i++) xs[i] = P.draw(r); return sortNum(xs); },
          stat: (s) => s[Math.min(kS.value, nS.value) - 1], init: 3000,
        });
        const dens = (P, n, k) => { const lc = M.lgamma(n + 1) - M.lgamma(k) - M.lgamma(n - k + 1); return (x) => { const F = P.cdf(x), f = P.pdf(x); if (!(f > 0) || F <= 0 || F >= 1) return 0; return Math.exp(lc + (k - 1) * Math.log(F) + (n - k) * Math.log1p(-F)) * f; }; };
        const exC = memo(), exact = () => { const P = pop(M, popSel.value), n = nS.value, k = Math.min(kS.value, n); return exC([P.key, n, k].join('|'), () => (P.key === 'uniform' ? { m: k / (n + 1), sd: Math.sqrt((k * (n - k + 1)) / ((n + 1) ** 2 * (n + 2))) } : momentsOf(M, dens(P, n, k), P.q(1e-9), P.q(1 - 1e-9)))); };
        v.render(() => {
          const S = R.sync(), P = pop(M, popSel.value), n = nS.value, k = Math.min(kS.value, n), [lo, hi] = P.view;
          viewPad(sT, [lo, hi], [-1, 1]); // same x-scale as the histogram below
          sT.line(lo, 0, hi, 0, { color: 'faint', width: 1.2 });
          let lastPx = -1e9;
          if (S.last) S.last.forEach((x, i) => {
            const me = i === k - 1, px = sT.X(x);
            sT.dot(x, 0, { r: me ? 7 : 4.2, color: me ? 'orange' : 'gold' });
            if ((n <= 15 && px - lastPx > 14) || me) { sT.text(String(i + 1), x, 0, { dy: -15, align: 'center', size: 11, color: me ? 'orange' : 'muted', math: false }); lastPx = px; }
          });
          if (S.last) sT.tex(`X_{(${k})} = ${v.fix(S.last[k - 1], 3)}`, S.last[k - 1], 0, { dy: 22, color: 'orange', size: 14 });
          const g = dens(P, n, k), B = binned(S.vals, lo, hi, 90), top = Math.max(B.max, peakOf(g, lo, hi)) * 1.15;
          const ord = (j) => j + (j % 10 === 1 && j % 100 !== 11 ? 'st' : j % 10 === 2 && j % 100 !== 12 ? 'nd' : j % 10 === 3 && j % 100 !== 13 ? 'rd' : 'th');
          tH(`histogram of $X_{(${k})}$, the ${k === 1 ? 'minimum' : k === n ? 'maximum' : `${ord(k)} smallest of ${n}`}` + (P.key === 'uniform' ? `: exact law $\\mathrm{Beta}(${k},${n - k + 1})$` : ''));
          viewPad(sH, [lo, hi], [0, top]);
          sH.clip(() => { for (let j = 1; j <= n; j++) if (j !== k) sH.fn(dens(P, n, j), { color: 'muted', width: 1, alpha: 0.3, n: 300 }); });
          sH.hist(B, { density: true, color: 'accent', fillAlpha: 0.33 });
          sH.fn(g, { color: 'green', width: 2.4, n: 500 });
          v.legend([['gold', 'sorted sample', { dot: true }], ['orange', '$X_{(k)}$', { dot: true }], ['accent', 'simulated $X_{(k)}$', { area: true }], ['green', 'exact density $f_{(k)}$'], ['muted', 'the other order statistics']]);
        });
        v.readout(() => {
          const S = R.sync(), n = nS.value, k = Math.min(kS.value, n), m = moments(S.vals), ex = exact();
          if (m.n < 2) return 'Press Draw to start.';
          return String.raw`${commas(m.n)} samples · $X_{(${k})}$: mean ${v.fix(m.mean, 4)} (exact ${v.fix(ex.m, 4)}${pop(M, popSel.value).key === 'uniform' ? String.raw` $= k/(n+1)$` : ''}) · SD ${v.fix(m.sd, 4)} (exact ${v.fix(ex.sd, 4)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Probability integral transform',
      statement: String.raw`(a) If $X$ has a **continuous** cdf $F$, then $U=F(X)$ is uniform on $(0,1)$.

(b) For **any** cdf $F$, let $F^{-1}(u)=\inf\{x:F(x)\ge u\}$ be its generalized inverse (the quantile function). If $U\sim U(0,1)$ then $X=F^{-1}(U)$ has cdf $F$.

Part (b) is how random numbers with any law are generated from uniform ones. Part (a) fails when $F$ has jumps: then $F(X)$ takes only the values $F(x)$ at the atoms on a set of positive probability, and is not uniform.`,
      idea: String.raw`For (b), the generalized inverse satisfies $F^{-1}(u)\le x\iff u\le F(x)$, because $F$ is non-decreasing and right-continuous (its one-sided limits exist, pma-4.29); so $P(F^{-1}(U)\le x)=P(U\le F(x))=F(x)$. For (a), continuity lets $F$ take every value $u\in(0,1)$, and $P(F(X)\le u)=P(X\le F^{-1}(u))=F(F^{-1}(u))=u$. Pushing data through the cdf of a model is therefore a test of the model: a non-flat histogram of $F(X)$ means the cdf was wrong.`,
      caption: String.raw`The curve is the cdf. In *X ↦ F(X)* mode, draws of $X$ (histogram hanging below the axis) are carried up to the curve and across to the vertical axis, where their images pile up in the left histogram: it is flat. In *U ↦ F⁻¹(U)* mode uniform numbers travel the other way and rebuild the density of $X$. Drag the orange handle to check $P(F(X)\le F(x_0))=F(x_0)$. A discrete population breaks the forward direction (spikes), and a wrong cdf $G$ bends the left histogram.`,
      deps: ['pma-4.29', 'prob-1.2.2'],
      refs: ['Casella–Berger §2.1'],
      tags: ['quantile function', 'simulation'],
      viz(v) {
        const M = v.M, Phi = PhiFast(M), N01 = M.dist.normal(0, 1);
        const dir = v.select('direction', [{ value: 'fwd', label: '$X \\mapsto F(X)$' }, { value: 'inv', label: '$U \\mapsto F^{-1}(U)$' }], 'fwd');
        const popSel = v.select('population $F$', popOpts(['normal', 'expo', 'bimodal', 'poisson']), 'expo');
        const wrong = v.toggle('push through a wrong cdf $G$', false);
        const s = v.stage({ x: [-2, 6], y: [-0.62, 1.1], height: 430, axes: false, full: true });
        const frame = () => { const [a, b] = pop(M, popSel.value).view; return { a, b, w: 0.42 * (b - a) }; };
        const h = s.handle(1, 0, { color: 'orange', constrain: (x) => { const f = frame(); return [clamp(x, f.a, f.b), 0]; } });
        let hx = {};
        h.onDrag = (hd) => { hx[popSel.value] = hd.x; };
        const law = () => {
          const P = pop(M, popSel.value);
          if (!wrong.value) return { cdf: P.cdf, q: P.q, discrete: P.discrete };
          const m = P.mean + 0.6 * P.sd, sd = 1.5 * P.sd;
          return { cdf: (x) => Phi((x - m) / sd), q: (u) => m + sd * N01.quantile(u), discrete: false };
        };
        const R = repeater(v, {
          key: () => [dir.value, popSel.value, wrong.value].join('|'),
          sample: (r) => { const P = pop(M, popSel.value), L = law(); if (dir.value === 'fwd') { const x = P.draw(r); return [x, L.cdf(x)]; } const u = r(); return [L.q(u), u]; },
          stat: (a) => a, init: 2000,
        });
        v.render(() => {
          const S = R.sync(), P = pop(M, popSel.value), L = law(), { a, b, w } = frame(), V = S.vals, N = V.length, fwd = dir.value === 'fwd';
          s.setView([a - w, b], [-0.62, 1.1]);
          if (hx[popSel.value] == null) hx[popSel.value] = P.q(0.7);
          if (!h.dragging) { h.x = hx[popSel.value]; h.y = 0; }
          const x0l = a - 0.03 * w;
          // frame
          s.line(a, 0, b, 0, { color: 'faint', width: 1.2 }); s.line(a, 0, a, 1, { color: 'faint', width: 1.2 }); s.line(a, 1, b, 1, { color: 'grid', width: 1, dash: [3, 4] });
          [0, 0.5, 1].forEach((y) => s.text(String(y), a, y, { dx: 5, dy: y === 1 ? 8 : -7, size: 10.5, color: 'muted', math: false }));
          const step = (b - a) > 8 ? 2 : (b - a) > 3 ? 1 : 0.5;
          for (let t = Math.ceil(a / step) * step; t <= b - 0.03 * (b - a); t += step) s.text(String(+t.toFixed(1)).replace('-', '−'), t, 0, { dy: 9, align: 'center', size: 10.5, color: 'muted', math: false });
          // the cdf used for the transform (and the true one if different)
          const curve = (cdf, disc, col, st = {}) => { if (disc) { const pts = [[a, cdf(a)]]; for (let k = Math.max(0, Math.ceil(a)); k <= b; k++) pts.push([k, cdf(k - 1)], [k, cdf(k)]); pts.push([b, cdf(b)]); s.path(pts, { color: col, width: 2.4, ...st }); } else s.fn(cdf, { domain: [a, b], color: col, width: 2.4, n: 400, ...st }); };
          if (wrong.value) curve(P.cdf, P.discrete, 'green', { width: 1.6, dash: [5, 4] });
          curve(L.cdf, L.discrete, wrong.value ? 'red' : 'green');
          // mapping lines for the last 30 pairs
          for (let i = Math.max(0, N - 30); i < N; i++) { const [x, u] = V[i]; if (x < a || x > b) continue; s.path([[x, 0], [x, u], [a, u]], { color: 'gold', width: 1, alpha: 0.55 }); }
          // bottom: histogram of X, hanging down from y = −0.1
          const top0 = -0.1, depth = 0.48;
          if (P.discrete) {
            const cnt = new Array(64).fill(0); V.forEach(([x]) => { if (x >= 0 && x < 64) cnt[Math.round(x)]++; });
            const sc = depth / Math.max(0.3, ...cnt.map((c) => c / Math.max(N, 1)));
            cnt.forEach((c, k) => { if (c && k <= b) s.rect(k - 0.3, top0, k + 0.3, top0 - (c / N) * sc, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1 }); });
            for (let k = 0; k <= b; k++) s.dot(k, top0 - P.pdf(k) * sc, { r: 3.2, color: 'green' });
          } else {
            const B = binned(V, a, b, 60, (p) => p[0]), sc = depth / Math.max(B.max, peakOf(P.pdf, a, b));
            B.density.forEach((d, i) => { if (d) s.rect(B.edges[i], top0, B.edges[i + 1], top0 - d * sc, { fill: 'accent', fillAlpha: 0.35, stroke: false }); });
            s.fn((x) => top0 - P.pdf(x) * sc, { domain: [a, b], color: 'green', width: 2, n: 300 });
          }
          s.text(fwd ? 'histogram of X (drawn from F)' : `histogram of X = ${wrong.value ? 'G' : 'F'}⁻¹(U)`, a - w, top0 - depth / 2, { dx: 8, size: 11.5, color: 'muted', math: false });
          // left: histogram of U, bars growing leftwards from x0l
          const BU = binned(V, 0, 1, 40, (p) => p[1]), su = (0.86 * w) / 2.2;
          BU.density.forEach((d, i) => { if (d) s.rect(x0l - Math.min(d, 2.2) * su, BU.edges[i], x0l, BU.edges[i + 1], { fill: d > 2.2 ? 'red' : 'accent', fillAlpha: 0.35, stroke: false }); });
          s.line(x0l - su, 0, x0l - su, 1, { color: 'green', width: 2, dash: [5, 4] });
          s.text(fwd ? `histogram of U = ${wrong.value ? 'G' : 'F'}(X)` : 'histogram of U (uniform)', a - w, 1.05, { dx: 8, size: 11.5, color: 'muted', math: false });
          s.text('density 1', x0l - su, -0.03, { align: 'center', size: 10, color: 'green', math: false });
          // handle guide
          const u0 = L.cdf(h.x);
          s.path([[h.x, 0], [h.x, u0], [a, u0]], { color: 'orange', width: 1.8, dash: [5, 3] });
          s.dot(a, u0, { r: 4, color: 'orange' });
          s.tex('x_0', h.x, 0, { dx: 8, dy: -13, align: 'left', color: 'orange', size: 14 });
          v.legend([[wrong.value ? 'red' : 'green', wrong.value ? 'wrong cdf $G$' : 'cdf $F$'], ['gold', 'last 30 draws, mapped'], ['accent', 'histograms', { area: true }], ['orange', '$x_0$ and $F(x_0)$']]);
        });
        v.readout(() => {
          const S = R.sync(), P = pop(M, popSel.value), L = law(), V = S.vals, N = V.length; if (!N) return 'Press Draw to start.';
          const u0 = L.cdf(h.x), frac = V.filter(([, u]) => u <= u0 + 1e-12).length / N, fwd = dir.value === 'fwd';
          const D = fwd ? ksDist(sortNum(V.map((p) => p[1])), (u) => clamp(u, 0, 1)) : P.discrete ? NaN : ksDist(sortNum(V.map((p) => p[0])), P.cdf);
          let s = String.raw`${commas(N)} draws · at $x_0 = ${v.fix(h.x, 2)}$: fraction with $U \le ${wrong.value ? 'G' : 'F'}(x_0) = ${v.fix(u0, 3)}$ is ${v.fix(frac, 3)}` + (fwd ? ' (uniform would give exactly ' + v.fix(u0, 3) + ')' : '');
          if (fwd) s += String.raw` · Kolmogorov distance of $U$ from $U(0,1)$: **${v.fix(D, 4)}**`;
          else if (!P.discrete) s += String.raw` · Kolmogorov distance of $X$ from $F$: **${v.fix(D, 4)}**`;
          else s += ' · the generated counts match the pmf (green dots)';
          if (fwd && P.discrete && !wrong.value) s += ' · $F$ has jumps: $F(X)$ lives on a few values, not uniform';
          if (wrong.value) s += ' · the cdf used is not the law of the data';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Theorem',
      name: 'Slutsky’s theorem',
      credit: 'Slutsky, 1925',
      statement: String.raw`If $X_n\to X$ in distribution and $Y_n\to c$ in probability, where $c$ is a **constant**, then
$$X_n+Y_n\to X+c,\qquad Y_nX_n\to cX,\qquad X_n/Y_n\to X/c\ \ (c\ne0)$$
in distribution. In particular, if $\sqrt n(\bar X_n-\mu)/\sigma\to N(0,1)$ (central limit theorem) and $S_n\to\sigma$ in probability (law of large numbers), then the studentized mean $\sqrt n(\bar X_n-\mu)/S_n\to N(0,1)$ for **every** population with finite variance, not just the normal one.`,
      idea: String.raw`Convergence of $Y_n$ to a constant upgrades the separate statements to joint convergence $(X_n,Y_n)\to(X,c)$; the continuous mapping theorem (prob-3.2.10), applied to the continuous maps $(x,y)\mapsto x+y,\ xy,\ x/y$ (pma-4.7), finishes the proof. The constant is essential: if $Y_n$ keeps a random limit, the limit of $X_n/Y_n$ depends on the joint law and is generally not $X/c$.`,
      caption: String.raw`Each repeat standardizes a sample mean twice: with the true $\sigma$ ($Z$, grey outline) and with a data-based denominator ($T$, blue). Left: their histograms against $N(0,1)$. Right: Kolmogorov distance to $N(0,1)$ against $n$ (1,500 repeats per point; below the dotted line the difference is simulation noise). With the consistent $S$, $T$ follows $Z$ down to the normal law, slower for skewed data. Use $S$ from only two observations, which does not converge to $\sigma$, and $T$ never becomes normal; with Cauchy data there is no $\sigma$ at all.`,
      deps: ['prob-3.2.1a', 'prob-3.2.10', 'pma-4.7'],
      refs: ['Casella–Berger §5.5', 'Wasserman §5.2'],
      tags: ['convergence in distribution', 'studentization'],
      viz(v) {
        const M = v.M, Phi = PhiFast(M);
        const popSel = v.select('population', popOpts(['normal', 'expo', 'lognorm', 'cauchy']), 'lognorm');
        const den = v.select('denominator', [{ value: 'sigma', label: 'true $\\sigma$' }, { value: 'S', label: '$S$ (consistent)' }, { value: 'S2', label: '$S$ from 2 obs.' }], 'S');
        const nS = v.slider('sample size $n$', 2, 200, 10, { int: true, log: true });
        const sL = v.stage({ x: [-5, 5], y: [0, 0.5], height: 310, axes: 'box', title: 'histograms of $Z$ (true $\\sigma$) and $T$ (estimated)' });
        const sR = v.stage({ x: [2, 200], y: [0.005, 1], xlog: true, ylog: true, height: 310, axes: 'box', title: 'Kolmogorov distance to $N(0,1)$' });
        const stats = (xs, P, d) => {
          const n = xs.length, m = mean(xs), mu = isFinite(P.mean) ? P.mean : 0, sig = isFinite(P.sd) ? P.sd : 1;
          let D = sig; if (d === 'S') { let ss = 0; for (const x of xs) ss += (x - m) ** 2; D = Math.sqrt(ss / (n - 1)); } else if (d === 'S2') D = Math.abs(xs[0] - xs[1]) / Math.SQRT2;
          return [(Math.sqrt(n) * (m - mu)) / sig, (Math.sqrt(n) * (m - mu)) / D];
        };
        const R = repeater(v, {
          key: () => [popSel.value, den.value, nS.value].join('|'),
          sample: (r) => { const P = pop(M, popSel.value), xs = new Array(nS.value); for (let i = 0; i < xs.length; i++) xs[i] = P.draw(r); return xs; },
          stat: (xs) => stats(xs, pop(M, popSel.value), den.value), init: 3000,
        });
        const GRID = [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 100, 140, 200], REPS = 1500, curC = new Map();
        const curves = () => {
          const key = popSel.value + '|' + den.value; if (curC.has(key)) return curC.get(key);
          const P = pop(M, popSel.value), r = v.rng(hashStr('slutsky|' + key)), Z = [], T = [];
          for (const n of GRID) {
            const zs = new Float64Array(REPS), ts = new Float64Array(REPS), xs = new Array(n);
            for (let k = 0; k < REPS; k++) { for (let i = 0; i < n; i++) xs[i] = P.draw(r); const [z, t] = stats(xs, P, den.value); zs[k] = z; ts[k] = t; }
            Z.push([n, ksDist(zs.sort(), Phi)]); T.push([n, ksDist(ts.sort(), Phi)]);
          }
          const out = { Z, T }; curC.set(key, out); return out;
        };
        const cur = memo(), now = () => { const S = R.sync(); return cur(S.id(), () => ({ Z: sortNum(S.vals.map((a) => a[0])), T: sortNum(S.vals.map((a) => a[1])), BZ: binned(S.vals, -5, 5, 80, (a) => a[0]), BT: binned(S.vals, -5, 5, 80, (a) => a[1]) })); };
        v.render(() => {
          const C = curves(), Nw = now(), n = nS.value;
          viewPad(sL, [-5, 5], [0, Math.max(0.42, Nw.BT.max, Nw.BZ.max) * 1.12]);
          sL.hist(Nw.BT, { density: true, color: 'accent', fillAlpha: 0.33 });
          sL.hist(Nw.BZ, { density: true, color: 'muted', fillAlpha: 0, width: 1.6 });
          sL.fn(phi, { color: 'green', width: 2.4, n: 300 });
          const outT = Nw.BT.out / Math.max(1, Nw.BT.N), outZ = Nw.BZ.out / Math.max(1, Nw.BZ.N);
          if (outT > 0.01 || outZ > 0.01) sL.corner(`outside the window: T ${pct(outT)}, Z ${pct(outZ)}`, 'tr', { color: 'red' });
          viewPad(sR, [2, 200], [0.005, 1], { xlog: true, ylog: true });
          sR.hline(0.87 / Math.sqrt(REPS), { color: 'faint', dash: [2, 4], width: 1.2 });
          sR.text('simulation noise', 200, 0.87 / Math.sqrt(REPS), { align: 'right', dx: -6, dy: 9, size: 11, color: 'muted', math: false });
          sR.path(C.Z, { color: 'muted', width: 2, dash: [6, 4] }); sR.dots(C.Z, { r: 3, color: 'muted' });
          sR.path(C.T, { color: 'accent', width: 2.4 }); sR.dots(C.T, { r: 3.4, color: 'accent' });
          sR.vline(n, { color: 'gold', width: 1.4 });
          if (Nw.T.length) { sR.dot(n, Math.max(0.0051, ksDist(Nw.T, Phi)), { r: 5.5, color: 'gold' }); }
          v.legend([['accent', '$T=\\sqrt n(\\bar X-\\mu)/\\hat\\sigma$'], ['muted', '$Z=\\sqrt n(\\bar X-\\mu)/\\sigma$', { dash: true }], ['green', '$N(0,1)$'], ['gold', 'current $n$ (main simulation)', { dot: true }]]);
        });
        v.readout(() => {
          const Nw = now(), P = pop(M, popSel.value), d = den.value; if (!Nw.T.length) return 'Press Draw to start.';
          const DT = ksDist(Nw.T, Phi), DZ = ksDist(Nw.Z, Phi);
          const why = P.key === 'cauchy' ? 'Cauchy data: no finite $\\sigma$, the CLT itself fails ($Z$ is $\\sqrt n$ times a Cauchy variable)' : d === 'sigma' ? 'with the true $\\sigma$, $T$ is $Z$' : d === 'S' ? '$S \\to \\sigma$ in probability, so by Slutsky $T$ has the same limit as $Z$' : 'two-observation $S$ does not converge to a constant: $T$ tends to $Z\\,\\sigma/S_{(2)}$, a scale mixture of normals (a Cauchy law for normal data), not $N(0,1)$';
          return String.raw`$n = ${nS.value}$, ${commas(Nw.T.length)} repeats · Kolmogorov distance to $N(0,1)$: $T$ **${v.fix(DT, 4)}**, $Z$ ${v.fix(DZ, 4)} · ${why}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Theorem',
      name: 'Delta method',
      credit: 'Doob, 1935; Cramér, 1946',
      statement: String.raw`Suppose $\sqrt n(Y_n-\mu)\to N(0,\sigma^2)$ in distribution and $g$ is differentiable at $\mu$. Then
$$\sqrt n\big(g(Y_n)-g(\mu)\big)\to N\big(0,\ g'(\mu)^2\sigma^2\big).$$
If $g'(\mu)=0$ and $g''(\mu)$ exists and is nonzero, the first-order statement is degenerate and the second-order version holds instead: $n\big(g(Y_n)-g(\mu)\big)\to\tfrac12\sigma^2g''(\mu)\,\chi^2_1$.`,
      idea: String.raw`Taylor's theorem (pma-5.15) gives $g(Y_n)-g(\mu)=g'(\mu)(Y_n-\mu)+r_n$ with $r_n=o(|Y_n-\mu|)$. Multiply by $\sqrt n$: the main term converges to $g'(\mu)N(0,\sigma^2)$, and $\sqrt n\,r_n\to0$ in probability because $\sqrt n(Y_n-\mu)$ is bounded in probability; Slutsky (1.14) combines the two. Near $\mu$ the curve $g$ is its tangent line, so a narrow normal cloud is mapped to a normal cloud rescaled by the slope; where the slope vanishes the curvature takes over and the image is a squared normal.`,
      caption: String.raw`The population is normal (or skewed) with mean $\mu$ and SD $\sigma=0.6$; each repeat draws $\bar X$ from its exact sampling law. Left: the curve $g$ with its tangent at $\mu$; the gold cloud $(\bar X,g(\bar X))$ hugs the tangent when $n$ is large, and the green band is the delta-method image $g(\mu)\pm2|g'(\mu)|\sigma/\sqrt n$. Right: the histogram of $g(\bar X)$ against the delta-method normal (green) and the second-order approximation (purple, dashed). Drag $\mu$ to a point where $g'(\mu)=0$ ($x^2$ at 0, $\sin$ at $\pi/2$) and the normal approximation collapses.`,
      deps: ['stat-1.14', 'pma-5.15', 'prob-3.4.1'],
      refs: ['Casella–Berger §5.5', 'Wasserman §5.5'],
      tags: ['delta method', 'asymptotics'],
      viz(v) {
        const M = v.M;
        const SIG = 0.6;
        const G = {
          sq: { f: (x) => x * x, d: (x) => 2 * x, d2: () => 2, dom: [-1.5, 2.5], tex: 'x^2' },
          exp: { f: Math.exp, d: Math.exp, d2: Math.exp, dom: [-1.5, 1.6], tex: 'e^x' },
          log: { f: (x) => (x > 0 ? Math.log(x) : NaN), d: (x) => 1 / x, d2: (x) => -1 / (x * x), dom: [0.2, 3], tex: '\\log x' },
          sin: { f: Math.sin, d: Math.cos, d2: (x) => -Math.sin(x), dom: [-0.6, 4], tex: '\\sin x' },
        };
        const mus = { sq: 1, exp: 0.4, log: 1, sin: Math.PI / 2 };
        const gSel = v.select('$g$', [{ value: 'sq', label: '$x^2$' }, { value: 'exp', label: '$e^x$' }, { value: 'log', label: '$\\log x$' }, { value: 'sin', label: '$\\sin x$' }], 'sq');
        const popSel = v.select('population', [{ value: 'normal', label: 'normal' }, { value: 'skew', label: 'skewed' }], 'normal');
        const nS = v.slider('sample size $n$', 2, 400, 20, { int: true, log: true });
        const sL = v.stage({ x: [-1.5, 2.5], y: [-1, 7], height: 320, axes: 'box', title: '$g$, its tangent at $\\mu$, and the cloud $(\\bar X,\\,g(\\bar X))$' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', title: 'histogram of $g(\\bar X)$' });
        const lo = () => { const g = G[gSel.value]; return g.dom[0] + 0.12 * (g.dom[1] - g.dom[0]); };
        const h = sL.handle(1, 1, { color: 'accent', label: 'μ', constrain: (x) => { const g = G[gSel.value], xx = clamp(x, lo(), g.dom[1] - 0.05 * (g.dom[1] - g.dom[0])); return [xx, g.f(xx)]; } });
        h.onDrag = (hd) => { mus[gSel.value] = hd.x; };
        const gams = new Map(), gam = (n) => { if (!gams.has(n)) gams.set(n, M.dist.gamma(n, 1 / n)); return gams.get(n); };
        const R = repeater(v, {
          key: () => [gSel.value, popSel.value, nS.value, mus[gSel.value].toFixed(3)].join('|'),
          sample: (r) => { const mu = mus[gSel.value], n = nS.value; return popSel.value === 'normal' ? mu + (SIG * r.normal()) / Math.sqrt(n) : mu + SIG * (gam(n).sample(r) - 1); },
          stat: (xb) => xb, init: 4000,
        });
        const second = (c, a, b, s) => (y) => { const t = y - c; if (Math.abs(b) < 1e-9) return Math.abs(a) < 1e-12 ? 0 : phi(t / (a * s)) / Math.abs(a * s); const disc = a * a + 4 * b * t; if (disc <= 0) return 0; const rt = Math.sqrt(disc), D1 = (-a + rt) / (2 * b), D2 = (-a - rt) / (2 * b); return (phi(D1 / s) + phi(D2 / s)) / (s * rt); };
        const sc = memo();
        const summ = () => { const S = R.sync(), g = G[gSel.value]; return sc(S.id(), () => { const ys = S.vals.map(g.f).filter((y) => isFinite(y)); return { ys, sorted: sortNum(ys), m: moments(ys), bad: S.vals.length - ys.length }; }); };
        v.render(() => {
          const S = R.sync(), g = G[gSel.value], mu = mus[gSel.value], n = nS.value, s = SIG / Math.sqrt(n), a = g.d(mu), b = g.d2(mu) / 2, c = g.f(mu);
          if (!h.dragging) { h.x = mu; h.y = c; }
          let ylo = Infinity, yhi = -Infinity; for (let i = 0; i <= 200; i++) { const y = g.f(g.dom[0] + ((g.dom[1] - g.dom[0]) * i) / 200); if (isFinite(y)) { ylo = Math.min(ylo, y); yhi = Math.max(yhi, y); } }
          const pad = 0.08 * (yhi - ylo);
          viewPad(sL, g.dom, [ylo - pad, yhi + pad]);
          sL.vband(mu - 2 * s, mu + 2 * s, { color: 'orange', alpha: 0.1 });
          sL.hband(c - 2 * Math.abs(a) * s, c + 2 * Math.abs(a) * s, { color: 'green', alpha: 0.13 });
          sL.fn(g.f, { color: 'ink', width: 2.2, n: 400 });
          sL.fn((x) => c + a * (x - mu), { color: 'orange', width: 1.8, dash: [6, 4] });
          const V = S.vals, pts = []; for (let i = Math.max(0, V.length - 500); i < V.length; i++) pts.push([V[i], g.f(V[i])]);
          sL.dots(pts, { r: 2.3, color: 'gold', alpha: 0.6 });
          const Y = summ(); let xl, xr;
          if (Y.sorted.length > 20) { xl = qSorted(Y.sorted, 0.003); xr = qSorted(Y.sorted, 0.997); } else { xl = c - 1; xr = c + 1; }
          const span = Math.max(xr - xl, 1e-3); xl = Math.min(xl, c) - 0.12 * span; xr = Math.max(xr, c) + 0.12 * span;
          const B = binned(Y.ys, xl, xr, 70), dn = (y) => (Math.abs(a) * s > 1e-12 ? phi((y - c) / (Math.abs(a) * s)) / (Math.abs(a) * s) : 0), so = second(c, a, b, s);
          const top = Math.max(B.max, 1e-9) * 1.25;
          viewPad(sR, [xl, xr], [0, top]);
          sR.hist(B, { density: true, color: 'accent', fillAlpha: 0.33 });
          const degen = Math.abs(a) * s < 1e-9 || dn(c) > 4 * top;
          sR.clip(() => { sR.fn(so, { color: 'purple', width: 2, dash: [6, 4], n: 600 }); if (!degen) sR.fn(dn, { color: 'green', width: 2.4, n: 600 }); });
          if (degen) sR.corner("g′(μ) ≈ 0: the delta-method normal degenerates", 'tl', { color: 'red', weight: 600 });
          sR.vline(c, { color: 'faint', width: 1, dash: [2, 3] });
          v.legend([['gold', 'repeats $(\\bar X, g(\\bar X))$', { dot: true }], ['orange', 'tangent at $\\mu$', { dash: true }], ['green', 'delta method $N\\big(g(\\mu),\\,g\'(\\mu)^2\\sigma^2/n\\big)$'], ['purple', 'second-order approximation', { dash: true }]]);
        });
        v.readout(() => {
          const g = G[gSel.value], mu = mus[gSel.value], n = nS.value, s = SIG / Math.sqrt(n), a = g.d(mu), Y = summ(); if (Y.m.n < 2) return 'Press Draw to start.';
          const pred = Math.abs(a) * s, D = pred > 1e-12 ? ksDist(Y.sorted, (y) => 0.5 * M.erfc(-(y - g.f(mu)) / (pred * Math.SQRT2))) : 1;
          let out = String.raw`$\mu = ${v.fix(mu, 3)}$, $g'(\mu) = ${v.fix(a, 3)}$ · SD of $g(\bar X)$: measured **${v.fix(Y.m.sd, 4)}**, delta method $|g'(\mu)|\sigma/\sqrt n = ${v.fix(pred, 4)}$ · Kolmogorov distance to the delta normal ${v.fix(D, 3)}`;
          if (Math.abs(a) < 0.15) out += String.raw` · $g'(\mu)\approx0$: the first-order term vanishes and $n\,(g(\bar X)-g(\mu))\to\tfrac12\sigma^2 g''(\mu)\chi^2_1$`;
          if (Y.bad) out += ` · ${commas(Y.bad)} draws had $\\bar X \\le 0$ (log undefined)`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.16
    {
      num: '1.16',
      kind: 'Theorem',
      name: 'Hoeffding’s inequality',
      credit: 'Hoeffding, 1963',
      statement: String.raw`Let $X_1,\dots,X_n$ be **independent** random variables with $a_i\le X_i\le b_i$ almost surely, and let $\bar X=\frac1n\sum X_i$. Then for every $t>0$
$$P\big(|\bar X-E\bar X|\ge t\big)\le 2\exp\!\Big(-\frac{2n^2t^2}{\sum_i(b_i-a_i)^2}\Big),$$
which for variables in $[0,1]$ reads $2e^{-2nt^2}$. Unlike the normal approximation it is a guarantee at every $n$, and unlike Chebyshev's bound $\sigma^2/(nt^2)$ it decays exponentially in $n$.`,
      idea: String.raw`Apply Markov's inequality (prob-1.6.4) to $e^{\lambda(\bar X-\mu)}$ and optimize over $\lambda$ (the Chernoff method). Independence factorizes the moment generating function, and Hoeffding's lemma bounds each factor: a centred variable confined to $[a,b]$ has $E e^{\lambda X}\le e^{\lambda^2(b-a)^2/8}$, proved from the convexity of $x\mapsto e^{\lambda x}$ (Jensen-type chord bound, rca-3.3). Boundedness replaces knowledge of the distribution; independence is what makes the exponent grow like $n$.`,
      caption: String.raw`Each repeat averages $n$ variables in $[0,1]$; $10^4$ repeats estimate the tail $P(|\bar X-\mu|\ge t)$ (blue) on a log scale. It always lies below Hoeffding's bound (green), which decays exponentially in $nt^2$ and soon beats Chebyshev's polynomial bound (orange); the purple normal approximation is close but is not a bound. Drag the orange handle to read the three numbers at any $t$. Make the sequence *sticky* (each variable repeats the previous one with probability 0.8): the variables are no longer independent and the empirical tail breaks through the bound.`,
      deps: ['rca-3.3', 'prob-1.6.4'],
      refs: ['Wasserman §4.1'],
      tags: ['concentration', 'inequalities'],
      links: { wikipedia: "https://en.wikipedia.org/wiki/Hoeffding%27s_inequality" },
      viz(v) {
        const M = v.M;
        const POPS = { b5: { mu: 0.5, v: 0.25, draw: (r) => (r() < 0.5 ? 1 : 0) }, b1: { mu: 0.1, v: 0.09, draw: (r) => (r() < 0.1 ? 1 : 0) }, u: { mu: 0.5, v: 1 / 12, draw: (r) => r() } };
        const popSel = v.select('variables in $[0,1]$', [{ value: 'b5', label: 'Bernoulli(½)' }, { value: 'b1', label: 'Bernoulli(0.1)' }, { value: 'u', label: 'uniform' }], 'b5');
        const dep = v.select('sampling', [{ value: 'iid', label: 'independent' }, { value: 'sticky', label: 'sticky (dependent)' }], 'iid');
        const nS = v.slider('$n$', 5, 300, 40, { int: true, log: true });
        const s = v.stage({ x: [0, 0.5], y: [1e-4, 1.5], ylog: true, height: 340, axes: 'box', full: true, title: 'tail probability $P(|\\bar X-\\mu|\\ge t)$ against $t$' });
        const hT = s.handle(0.15, 1, { color: 'orange', constrain: (x) => [clamp(x, 0.005, 0.5), 1] });
        const R = repeater(v, {
          key: () => [popSel.value, dep.value, nS.value].join('|'),
          sample: (r) => { const P = POPS[popSel.value], n = nS.value; let x = P.draw(r), sum = x; for (let i = 1; i < n; i++) { if (dep.value === 'iid' || r() >= 0.8) x = P.draw(r); sum += x; } return Math.abs(sum / n - P.mu); },
          stat: (d) => d, init: 10000, cap: 400000,
        });
        const sc = memo(), sorted = () => { const S = R.sync(); return sc(S.id(), () => sortNum(S.vals)); };
        const tail = (a, t) => { const N = a.length; let lo = 0, hi = N; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < t - 1e-12) lo = m + 1; else hi = m; } return (N - lo) / Math.max(N, 1); };
        v.render(() => {
          const P = POPS[popSel.value], n = nS.value, a = sorted(), N = a.length;
          viewPad(s, [0, 0.5], [Math.min(1e-4, 0.5 / Math.max(N, 1)), 1.5], { ylog: true });
          const emp = []; for (let i = 1; i <= 400; i++) { const t = (0.5 * i) / 400, p = tail(a, t); emp.push(p > 0 ? [t, p] : null); }
          s.fn((t) => Math.min(1, P.v / (n * t * t)), { color: 'orange', width: 2.2, domain: [0.002, 0.5] });
          s.fn((t) => Math.min(1, 2 * Math.exp(-2 * n * t * t)), { color: 'green', width: 2.4 });
          s.fn((t) => M.erfc((t * Math.sqrt(n)) / (Math.sqrt(P.v) * Math.SQRT2)), { color: 'purple', width: 1.6, dash: [6, 4] });
          s.path(emp, { color: 'accent', width: 2.6 });
          s.hline(1 / Math.max(N, 1), { color: 'faint', dash: [2, 4], width: 1 });
          s.text('resolution 1/N', 0.495, 1 / Math.max(N, 1), { align: 'right', dy: -8, size: 11, color: 'muted', math: false });
          const t = hT.x, pe = tail(a, t), ph = Math.min(1, 2 * Math.exp(-2 * n * t * t)), pc = Math.min(1, P.v / (n * t * t));
          s.vline(t, { color: 'orange', width: 1.2, dash: [3, 3] });
          if (pe > 0) s.dot(t, pe, { r: 5, color: 'accent' }); s.dot(t, ph, { r: 5, color: 'green' }); s.dot(t, pc, { r: 5, color: 'orange' });
          s.tex('t', t, 1, { dx: 12, dy: -2, color: 'orange', size: 14 });
          v.legend([['accent', 'simulated tail'], ['green', 'Hoeffding $2e^{-2nt^2}$'], ['orange', 'Chebyshev $\\sigma^2/(nt^2)$'], ['purple', 'normal approximation (not a bound)', { dash: true }]]);
        });
        v.readout(() => {
          const P = POPS[popSel.value], n = nS.value, a = sorted(), N = a.length; if (!N) return 'Press Draw to start.';
          const t = hT.x, pe = tail(a, t), ph = Math.min(1, 2 * Math.exp(-2 * n * t * t)), pc = Math.min(1, P.v / (n * t * t)), se = Math.sqrt(Math.max(pe * (1 - pe), 1 / N) / N);
          const ok = pe <= ph + 2 * se;
          const sx = (x) => (x > 0 ? v.sci(x, 3) : '0');
          return String.raw`${commas(N)} repeats, $n = ${n}$ · at $t = ${v.fix(t, 3)}$: simulated tail $\mathbf{${sx(pe)}}$${pe === 0 ? ' (below resolution)' : ''} · Hoeffding $${sx(ph)}$ · Chebyshev $${sx(pc)}$ · ` + (ok ? 'the bound holds ✓' : '**the bound fails ✗** — the variables are not independent');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.17
    {
      num: '1.17',
      kind: 'Definition',
      name: 'Exponential family',
      credit: 'Darmois, Koopman & Pitman, 1935–36',
      statement: String.raw`A family of densities (or probability mass functions) $\{p_\eta\}$ is a **$k$-parameter exponential family** if it can be written
$$p_\eta(x)=h(x)\exp\big(\eta\cdot T(x)-A(\eta)\big),$$
with a fixed carrier $h\ge0$, a **sufficient statistic** $T:\mathcal X\to\R^k$, the **natural parameter** $\eta$ ranging over the convex set $\{\eta:\int h\,e^{\eta\cdot T}<\infty\}$, and the **log-partition function** $A(\eta)=\log\int h(x)e^{\eta\cdot T(x)}\,dx$, which makes the total mass 1. Then $A$ is convex and smooth inside the parameter set, and
$$\nabla A(\eta)=E_\eta T(X),\qquad \nabla^2A(\eta)=\operatorname{Cov}_\eta T(X).$$
Bernoulli, binomial, Poisson, normal, gamma and beta families are exponential families; the support of $p_\eta$ cannot depend on $\eta$, so the uniform family $U(0,\theta)$ is not one.`,
      idea: String.raw`Differentiate the identity $e^{A(\eta)}=\int h\,e^{\eta T}$ under the integral sign (pma-9.42, justified by the dominated convergence the exponential tails allow): the first derivative brings down $T$, giving $A'(\eta)=E_\eta T$, and the second gives $A''(\eta)=E_\eta T^2-(E_\eta T)^2=\operatorname{Var}_\eta T\ge0$. So $A$ is a convex function whose slope is the mean and whose curvature is the variance; this is the engine behind maximum likelihood in these families (stat-3.7) and their sufficient statistics (stat-2.4).`,
      caption: String.raw`Pick a family and drag the natural parameter $\eta$ along the convex curve $A(\eta)$. The orange tangent has slope $A'(\eta)$ and the purple parabola has curvature $A''(\eta)$. On the right, 4,000 draws from $p_\eta$ with the exact law: their mean (blue line) sits on $A'(\eta)$ (green) and their spread on $\sqrt{A''(\eta)}$, as the readout confirms.`,
      deps: ['stat-1.1', 'pma-9.42'],
      refs: ['Casella–Berger §3.4', 'Wasserman §9.13'],
      tags: ['exponential family'],
      viz(v) {
        const M = v.M;
        const sig = (e) => 1 / (1 + Math.exp(-e));
        const FAM = {
          bern: { eta: [-4, 4], e0: 0.8, A: (e) => Math.log1p(Math.exp(e)), A1: sig, A2: (e) => sig(e) * (1 - sig(e)), draw: (r, e) => (r() < sig(e) ? 1 : 0), disc: true, pmf: (k, e) => (k === 1 ? sig(e) : k === 0 ? 1 - sig(e) : 0), view: () => [-0.8, 1.8], form: 'p_\\eta(x)=\\exp\\big(\\eta x-\\log(1+e^{\\eta})\\big),\\ x\\in\\{0,1\\}', par: (e) => `p = ${v.fix(sig(e), 3)}` },
          pois: { eta: [-1, 2.6], e0: 1.1, A: Math.exp, A1: Math.exp, A2: Math.exp, draw: (r, e) => rpois(r, Math.exp(e)), disc: true, pmf: (k, e) => Math.exp(k * e - Math.exp(e) - M.lgamma(k + 1)), view: (e) => [-0.8, Math.max(8, Math.exp(e) + 4.5 * Math.exp(e / 2) + 1)], form: 'p_\\eta(x)=\\tfrac1{x!}\\exp\\big(\\eta x-e^{\\eta}\\big)', par: (e) => `\\lambda = ${v.fix(Math.exp(e), 3)}` },
          norm: { eta: [-2.5, 2.5], e0: 0.7, A: (e) => (e * e) / 2, A1: (e) => e, A2: () => 1, draw: (r, e) => e + r.normal(), pdf: (x, e) => phi(x - e), view: () => [-5, 5], form: 'p_\\eta(x)=\\varphi(x)\\exp\\big(\\eta x-\\eta^2/2\\big)', par: (e) => `\\mu = ${v.fix(e, 3)},\\ \\sigma = 1` },
          gam: { eta: [-4, -0.5], e0: -1.5, A: (e) => -3 * Math.log(-e), A1: (e) => -3 / e, A2: (e) => 3 / (e * e), draw: (r, e) => -(Math.log(1 - r()) + Math.log(1 - r()) + Math.log(1 - r())) / -e, pdf: (x, e) => (x > 0 ? Math.exp(3 * Math.log(-e) + 2 * Math.log(x) + e * x - M.lgamma(3)) : 0), view: (e) => [-0.3, -3 / e + 5 * Math.sqrt(3) / -e], form: 'p_\\eta(x)=\\tfrac{x^2}{2}\\exp\\big(\\eta x+3\\log(-\\eta)\\big),\\ x>0', par: (e) => `\\text{shape }3,\\ \\text{rate } ${v.fix(-e, 3)}` },
        };
        const famSel = v.select('family', [{ value: 'bern', label: 'Bernoulli' }, { value: 'pois', label: 'Poisson' }, { value: 'norm', label: 'normal ($\\sigma=1$)' }, { value: 'gam', label: 'gamma (shape 3)' }], 'pois');
        const etas = Object.fromEntries(Object.entries(FAM).map(([k, f]) => [k, f.e0]));
        const sL = v.stage({ x: [-1, 2.6], y: [0, 14], height: 320, axes: 'box' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box' });
        const tR = titler(sR), tL = titler(sL);
        const h = sL.handle(1, 1, { color: 'accent', label: 'η', constrain: (x) => { const f = FAM[famSel.value], w = f.eta[1] - f.eta[0], xx = clamp(x, f.eta[0] + 0.04 * w, f.eta[1] - 0.04 * w); return [xx, f.A(xx)]; } });
        h.onDrag = (hd) => { etas[famSel.value] = hd.x; };
        const R = repeater(v, { key: () => [famSel.value, etas[famSel.value].toFixed(3)].join('|'), sample: (r) => FAM[famSel.value].draw(r, etas[famSel.value]), stat: (x) => x, init: 4000 });
        v.render(() => {
          const S = R.sync(), f = FAM[famSel.value], e = etas[famSel.value], A = f.A(e), A1 = f.A1(e), A2 = f.A2(e);
          if (!h.dragging) { h.x = e; h.y = A; }
          let ylo = Infinity, yhi = -Infinity; for (let i = 0; i <= 100; i++) { const y = f.A(f.eta[0] + ((f.eta[1] - f.eta[0]) * i) / 100); ylo = Math.min(ylo, y); yhi = Math.max(yhi, y); }
          const pad = 0.1 * (yhi - ylo);
          viewPad(sL, f.eta, [ylo - pad, yhi + pad]);
          sL.fn(f.A, { color: 'ink', width: 2.4, n: 300 });
          const wq = 0.22 * (f.eta[1] - f.eta[0]);
          sL.fn((x) => A + A1 * (x - e) + 0.5 * A2 * (x - e) ** 2, { domain: [e - wq, e + wq], color: 'purple', width: 2, dash: [6, 4] });
          sL.fn((x) => A + A1 * (x - e), { color: 'orange', width: 2 });
          tL(`$A'(\\eta) = ${v.fix(A1, 3)}$ (mean), $A''(\\eta) = ${v.fix(A2, 3)}$ (variance)`);
          const [lo, hi] = f.view(e), m = moments(S.vals); let yb;
          tR(`4,000 draws from $p_\\eta$: $${f.par(e)}$`);
          if (f.disc) {
            const cnt = new Map(); S.vals.forEach((k) => cnt.set(k, (cnt.get(k) || 0) + 1));
            let top = 0.05; for (let k = Math.max(0, Math.ceil(lo)); k <= hi; k++) top = Math.max(top, f.pmf(k, e), (cnt.get(k) || 0) / Math.max(1, S.vals.length));
            viewPad(sR, [lo, hi], [0, top * 1.3]);
            for (const [k, c] of cnt) if (k <= hi) sR.rect(k - 0.32, 0, k + 0.32, c / S.vals.length, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1 });
            for (let k = Math.max(0, Math.ceil(lo)); k <= hi; k++) sR.dot(k, f.pmf(k, e), { r: 3.6, color: 'green' });
            yb = top * 1.2;
          } else {
            const B = binned(S.vals, lo, hi, 70), top = Math.max(B.max, peakOf((x) => f.pdf(x, e), lo, hi));
            viewPad(sR, [lo, hi], [0, top * 1.3]);
            sR.hist(B, { density: true, color: 'accent', fillAlpha: 0.33 });
            sR.fn((x) => f.pdf(x, e), { color: 'green', width: 2.4, n: 400 });
            yb = top * 1.2;
          }
          if (m.n > 1) {
            sR.vline(A1, { color: 'green', width: 2, dash: [6, 4] }); sR.vline(m.mean, { color: 'accent', width: 1.8 });
            sR.line(A1 - Math.sqrt(A2), yb, A1 + Math.sqrt(A2), yb, { color: 'green', width: 3 });
            sR.line(m.mean - m.sd, yb * 0.93, m.mean + m.sd, yb * 0.93, { color: 'accent', width: 3 });
          }
          v.legend([['orange', 'tangent: slope $A\'(\\eta)$'], ['purple', 'osculating parabola: curvature $A\'\'(\\eta)$', { dash: true }], ['green', 'exact law, $A\'(\\eta) \\pm \\sqrt{A\'\'(\\eta)}$'], ['accent', 'simulated draws, mean ± SD', { area: true }]]);
        });
        v.readout(() => {
          const S = R.sync(), f = FAM[famSel.value], e = etas[famSel.value], m = moments(S.vals); if (m.n < 2) return 'Press Draw to start.';
          return String.raw`$${f.form}$ · $\eta = ${v.fix(e, 3)}$ · $A'(\eta) = ${v.fix(f.A1(e), 4)}$ vs simulated mean **${v.fix(m.mean, 4)}** · $A''(\eta) = ${v.fix(f.A2(e), 4)}$ vs simulated variance **${v.fix(m.var, 4)}** (${commas(m.n)} draws)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.18
    {
      num: '1.18',
      kind: 'Definition',
      name: 'Location–scale family',
      statement: String.raw`Given a density $f$ (the **standard member**), the **location–scale family** generated by $f$ is
$$\Big\{\ \tfrac1\sigma f\Big(\frac{x-\mu}{\sigma}\Big)\ :\ \mu\in\R,\ \sigma>0\Big\},$$
the laws of $X=\mu+\sigma Z$ with $Z\sim f$; $\mu$ is the **location** and $\sigma$ the **scale** parameter (fixing $\sigma=1$ or $\mu=0$ gives a location or a scale family). Quantiles transform linearly: $F_{\mu,\sigma}^{-1}(p)=\mu+\sigma F^{-1}(p)$. Hence a **Q–Q plot** of a sample from any member against the quantiles of the standard member is close to a straight line with intercept $\mu$ and slope $\sigma$, while against the quantiles of a different family it bends. Normal, Cauchy, logistic, double-exponential, uniform and (shifted) exponential laws all form location–scale families.`,
      idea: String.raw`If $Z$ has cdf $F$, then $P(\mu+\sigma Z\le x)=F\big((x-\mu)/\sigma\big)$; differentiating gives the density and inverting gives the linear quantile map. Sorted data estimate quantiles (the $i$-th smallest of $n$ sits near the $(i-\tfrac12)/n$ quantile), so plotting them against standard quantiles straightens the family out: all members share one shape and differ only by the axes. A line through the quartiles is robust enough to read $\mu$ and $\sigma$ off even Cauchy data.`,
      caption: String.raw`Left: the standard density (dashed) and the member with location $\mu$ and scale $\sigma$; drag the orange handle to move it and the purple one to stretch it, and the sample (gold ticks) moves rigidly with it. Right: the Q–Q plot of the sample against the standard member's quantiles: the points follow the green line $\mu+\sigma x$, and the robust quartile line (blue) reads off $\mu$ and $\sigma$. Switch the reference to the normal family while the data are Cauchy or exponential, and the plot bends.`,
      deps: ['stat-1.1', 'stat-1.13'],
      refs: ['Casella–Berger §3.5'],
      tags: ['location–scale family', 'Q–Q plot'],
      viz(v) {
        const M = v.M;
        const famSel = v.select('family', popOpts(['normal', 'cauchy', 'expo', 'uniform']).map((o) => ({ ...o, label: { normal: 'normal', cauchy: 'Cauchy', expo: 'exponential', uniform: 'uniform' }[o.value] })), 'normal');
        const refSel = v.select('Q–Q reference', [{ value: 'same', label: 'same family' }, { value: 'normal', label: 'normal' }], 'same');
        const nS = v.slider('sample size $n$', 10, 500, 200, { int: true, log: true });
        let seed = 2; v.button('New sample', () => { seed++; });
        const sL = v.stage({ x: [-6, 8], y: [0, 0.85], height: 320, axes: 'box', title: 'standard member (dashed) and the member $\\tfrac1\\sigma f\\big(\\tfrac{x-\\mu}\\sigma\\big)$' });
        const sR = v.stage({ x: [-3, 3], y: [-3, 3], height: 320, axes: 'box' });
        const tR = titler(sR);
        const par = { mu: 1.2, sd: 1.5 };
        const hM = sL.handle(1.2, 0, { color: 'orange', constrain: (x) => [clamp(x, -3, 3), 0] });
        const hS = sL.handle(2.7, 0, { color: 'purple', constrain: (x) => [clamp(x, par.mu + 0.4, par.mu + 3), 0] });
        hM.onDrag = (h) => { par.mu = h.x; }; hS.onDrag = (h) => { par.sd = h.x - par.mu; };
        const zc = memo(), zs = () => zc([famSel.value, nS.value, seed].join('|'), () => { const P = pop(M, famSel.value), r = v.rng(hashStr('ls|' + famSel.value + '|' + seed)), z = []; for (let i = 0; i < nS.value; i++) z.push(P.draw(r)); return sortNum(z); });
        const qq = () => {
          const P = pop(M, famSel.value), Q0 = pop(M, refSel.value === 'same' ? famSel.value : 'normal'), z = zs(), n = z.length;
          const xs = Array.from({ length: n }, (_, i) => Q0.q((i + 0.5) / n)), ys = Array.from(z, (t) => par.mu + par.sd * t);
          const xq1 = Q0.q(0.25), xq3 = Q0.q(0.75), yq1 = qSorted(ys, 0.25), yq3 = qSorted(ys, 0.75), slope = (yq3 - yq1) / (xq3 - xq1), icpt = yq1 - slope * xq1;
          let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; } const mx = sx / n, my = sy / n;
          for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
          const x0 = Q0.q(0.02), x1 = Q0.q(0.98), dx = 0.12 * (x1 - x0), yq = sortNum(ys);
          const ya = Math.min(qSorted(yq, 0.02), icpt + slope * x0), yb = Math.max(qSorted(yq, 0.98), icpt + slope * x1), dy = 0.12 * (yb - ya);
          const win = [[x0 - dx, x1 + dx], [ya - dy, yb + dy]], out = xs.filter((x, i) => x < win[0][0] || x > win[0][1] || ys[i] < win[1][0] || ys[i] > win[1][1]).length;
          return { P, Q0, xs, ys, slope, icpt, r: sxy / Math.sqrt(sxx * syy), win, out };
        };
        v.render(() => {
          const P = pop(M, famSel.value), Q = qq();
          if (!hM.dragging) { hM.x = par.mu; } if (!hS.dragging) { hS.x = par.mu + par.sd; }
          viewPad(sL, [-6, 8], [0, 0.85]);
          sL.fn(P.pdf, { color: 'muted', width: 1.6, dash: [5, 4], n: 500 });
          sL.fn((x) => P.pdf((x - par.mu) / par.sd) / par.sd, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.12, n: 600 });
          const yb = 0.8; sL.line(par.mu, yb, par.mu + par.sd, yb, { color: 'purple', width: 2.4 }); sL.tex('\\sigma', par.mu + par.sd / 2, yb, { dy: -11, color: 'purple', size: 14 });
          sL.line(par.mu, 0, par.mu, yb, { color: 'orange', width: 1, dash: [3, 4] }); sL.tex('\\mu', par.mu, yb, { dx: -8, align: 'right', color: 'orange', size: 14 }); sL.line(par.mu + par.sd, 0, par.mu + par.sd, yb, { color: 'purple', width: 1, dash: [3, 4] });
          for (const y of Q.ys) if (y > -6 && y < 8) sL.line(y, 0.015, y, 0.06, { color: 'gold', width: 1.4, alpha: 0.8 });
          // Q–Q plot, windowed on the central quantiles
          const n = Q.xs.length;
          tR(`Q–Q plot against the ${refSel.value === 'same' ? 'standard member' : 'normal'} quantiles`);
          viewPad(sR, Q.win[0], Q.win[1]);
          if (refSel.value === 'same') sR.fn((x) => par.mu + par.sd * x, { color: 'green', width: 2.2 });
          sR.fn((x) => Q.icpt + Q.slope * x, { color: 'accent', width: 1.8, dash: [6, 4] });
          const pts = Q.xs.map((x, i) => [x, Q.ys[i]]);
          sR.dots(pts, { r: n > 200 ? 2 : 3, color: 'gold' });
          axisLabels(sR, '\\text{reference quantile}', '\\text{sorted data}');
          v.legend([['accent', 'member density · quartile line', { area: true }], ['gold', 'sample'], ...(refSel.value === 'same' ? [['green', 'line $\\mu+\\sigma x$']] : [])]);
        });
        v.readout(() => {
          const Q = qq();
          return (Q.out ? `${Q.out} extreme point${Q.out > 1 ? 's' : ''} outside the window · ` : '') + String.raw`quartile line: intercept **${v.fix(Q.icpt, 3)}** ($\mu = ${v.fix(par.mu, 3)}$), slope **${v.fix(Q.slope, 3)}** ($\sigma = ${v.fix(par.sd, 3)}$) · correlation of the Q–Q points $r = ${v.fix(Q.r, 4)}$` + (refSel.value === 'normal' && famSel.value !== 'normal' ? ' · wrong reference family: the plot bends and intercept/slope no longer estimate μ and σ' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.19
    {
      num: '1.19',
      kind: 'Definition',
      name: 'Multivariate normal: marginals and conditionals',
      credit: 'Bravais, 1846; Galton, 1886',
      statement: String.raw`A random vector $X\in\R^d$ is **multivariate normal**, $X\sim N_d(\mu,\Sigma)$, if $a^{\mathsf T}X$ is normal for every $a\in\R^d$; then $EX=\mu$, $\operatorname{Cov}X=\Sigma$, and for positive definite $\Sigma$ the density is
$$\varphi_{\mu,\Sigma}(x)=(2\pi)^{-d/2}(\det\Sigma)^{-1/2}\exp\!\big(-\tfrac12(x-\mu)^{\mathsf T}\Sigma^{-1}(x-\mu)\big),$$
constant on the ellipsoids $(x-\mu)^{\mathsf T}\Sigma^{-1}(x-\mu)=r^2$. Partition $X=(X_1,X_2)$ with blocks $\Sigma_{11},\Sigma_{12},\Sigma_{22}$. Then the marginal is $X_2\sim N(\mu_2,\Sigma_{22})$, and the conditional law is
$$X_2\mid X_1=a\ \sim\ N\big(\mu_2+\Sigma_{21}\Sigma_{11}^{-1}(a-\mu_1),\ \ \Sigma_{22}-\Sigma_{21}\Sigma_{11}^{-1}\Sigma_{12}\big):$$
the conditional mean is linear in $a$ (the regression line) and the conditional covariance does not depend on $a$. In two dimensions: $E[X_2\mid X_1=a]=\mu_2+\rho\frac{\sigma_2}{\sigma_1}(a-\mu_1)$ and $\operatorname{Var}(X_2\mid X_1=a)=\sigma_2^2(1-\rho^2)$.`,
      idea: String.raw`Write $X=\mu+LZ$ with $Z$ standard normal and $LL^{\mathsf T}=\Sigma$ (possible since $\Sigma$ is positive definite, ladr-7.62); the density follows from the change of variables formula (rca-2.23). Subtracting the best linear predictor, $R=X_2-\Sigma_{21}\Sigma_{11}^{-1}X_1$ is uncorrelated with $X_1$, and for jointly normal vectors uncorrelated means independent; so conditioning on $X_1=a$ leaves $R$ unchanged, which gives both the linear mean and the constant variance. Neither property holds for a non-normal vector with the same $\mu$ and $\Sigma$.`,
      caption: String.raw`Set $\sigma_1,\sigma_2,\rho$ (the covariance matrix is in the readout); the green ellipses are the density contours and the orange line is the regression line $E[X_2\mid X_1]$. Drag the orange handle to slide a thin strip $X_1\approx a$: on the right, the simulated values of $X_2$ inside the strip match the predicted conditional normal, whose mean slides along the line while its width stays fixed. Switch to a non-normal law with the same mean, covariance and regression line: the conditional spread now changes with $a$.`,
      deps: ['ladr-7.62', 'rca-2.23'],
      refs: ['Wasserman §14.3', 'Casella–Berger §4.6'],
      tags: ['multivariate normal', 'regression'],
      viz(v) {
        const s1S = v.slider('$\\sigma_1$', 0.5, 2, 1.2, { step: 0.05 });
        const s2S = v.slider('$\\sigma_2$', 0.5, 2, 1, { step: 0.05 });
        const rS = v.slider('$\\rho$', -0.95, 0.95, 0.7, { step: 0.05 });
        const joint = v.select('joint law', [{ value: 'mvn', label: 'bivariate normal' }, { value: 'fake', label: 'same covariance, not normal' }], 'mvn');
        const sL = v.stage({ x: [-5, 5], y: [-5, 5], height: 340, axes: 'box', weight: 1.15, title: 'simulated $(X_1, X_2)$, contours and the regression line' });
        const sR = v.stage({ x: [-5, 5], y: [0, 1], height: 340, axes: 'box', title: '$X_2$ inside the strip $X_1\\approx a$' });
        const hA = sL.handle(0.5, -4.3, { color: 'orange', label: 'a', constrain: (x) => [clamp(x, -3.8, 3.8), -4.3] });
        const R = repeater(v, {
          key: () => [s1S.value, s2S.value, rS.value, joint.value].join('|'),
          sample: (r) => { const z1 = r.normal(), z2 = r.normal(), rho = rS.value, c = Math.sqrt(1 - rho * rho); return [s1S.value * z1, s2S.value * (rho * z1 + c * (joint.value === 'mvn' ? 1 : Math.abs(z1)) * z2)]; },
          stat: (p) => p, init: 8000, buttons: [1000, 10000],
        });
        const strip = () => { const S = R.sync(), a = hA.x, w = 0.12 * s1S.value, ys = []; for (const [x, y] of S.vals) if (Math.abs(x - a) < w) ys.push(y); return { a, w, ys, m: moments(ys) }; };
        v.render(() => {
          const S = R.sync(), s1 = s1S.value, s2 = s2S.value, rho = rS.value, c = Math.sqrt(1 - rho * rho), St = strip(), a = St.a, w = St.w;
          viewPad(sL, [-5, 5], [-5, 5]);
          const V = S.vals, pts = [], sp = []; for (let i = Math.max(0, V.length - 12000); i < V.length; i++) { const p = V[i]; (Math.abs(p[0] - a) < w ? sp : pts).push(p); }
          sL.dots(pts, { r: 1.4, color: 'gold', alpha: 0.32 });
          sL.vband(a - w, a + w, { color: 'orange', alpha: 0.13 });
          sL.dots(sp, { r: 2, color: 'accent', alpha: 0.8 });
          for (const k of [1, 2, 3]) sL.curve((t) => [k * s1 * Math.cos(t), k * s2 * (rho * Math.cos(t) + c * Math.sin(t))], 0, 2 * Math.PI, { color: 'green', width: 1.8, alpha: 1.1 - 0.25 * k });
          sL.fn((x) => (rho * s2 * x) / s1, { color: 'orange', width: 2.2 });
          const cm = (rho * s2 * a) / s1, cs = s2 * c;
          sL.line(a + 0.32, cm - 2 * cs, a + 0.32, cm + 2 * cs, { color: 'green', width: 3 }); sL.dot(a + 0.32, cm, { r: 4, color: 'green' });
          if (St.m.n > 2) { sL.line(a - 0.32, St.m.mean - 2 * St.m.sd, a - 0.32, St.m.mean + 2 * St.m.sd, { color: 'accent', width: 3 }); sL.dot(a - 0.32, St.m.mean, { r: 4, color: 'accent' }); }
          const B = binned(St.ys, -5, 5, 50), cpdf = (y) => phi((y - cm) / cs) / cs;
          viewPad(sR, [-5, 5], [0, Math.max(B.max, cpdf(cm)) * 1.15]);
          sR.hist(B, { density: true, color: 'accent', fillAlpha: 0.33 });
          sR.fn((y) => phi(y / s2) / s2, { color: 'muted', width: 1.6, dash: [5, 4], n: 300 });
          sR.fn(cpdf, { color: 'green', width: 2.4, n: 400 });
          v.legend([['gold', 'simulated points', { dot: true }], ['accent', 'points in the strip · their mean ± 2 SD'], ['green', 'contours · predicted conditional law (mean ± 2 SD)'], ['orange', 'regression line $E[X_2\\mid X_1]$'], ['muted', 'marginal of $X_2$', { dash: true }]]);
        });
        v.readout(() => {
          const s1 = s1S.value, s2 = s2S.value, rho = rS.value, St = strip(), cm = (rho * s2 * St.a) / s1, cs = s2 * Math.sqrt(1 - rho * rho);
          const Sig = String.raw`\Sigma=\begin{pmatrix}${v.fix(s1 * s1, 2)} & ${v.fix(rho * s1 * s2, 2)}\\ ${v.fix(rho * s1 * s2, 2)} & ${v.fix(s2 * s2, 2)}\end{pmatrix}`;
          if (St.m.n < 3) return `$${Sig}$ · too few points in the strip: draw more`;
          return String.raw`$${Sig}$ · strip at $a = ${v.fix(St.a, 2)}$ holds ${commas(St.m.n)} points · mean of $X_2$: **${v.fix(St.m.mean, 3)}** (predicted ${v.fix(cm, 3)}) · SD **${v.fix(St.m.sd, 3)}** (predicted $\sigma_2\sqrt{1-\rho^2} = ${v.fix(cs, 3)}$, the same for every $a$)` + (joint.value === 'fake' ? ' · not jointly normal: the spread depends on $a$' : '');
        });
      },
    },
  ],
};
