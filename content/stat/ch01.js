// Statistical Inference — Chapter 1: Statistical models and sampling distributions (items 1.1–1.10; 1.11–1.19 in ch01-b.js)
//
// House style for the collection: every claim is tested by repeated sampling from a population the
// reader controls. Randomness always comes from v.rng seeded by the current settings, so a picture is
// reproducible; the Draw buttons continue the same stream.

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
function mergeSorted(a, b) {
  const out = new Float64Array(a.length + b.length); let i = 0, j = 0, k = 0;
  while (i < a.length && j < b.length) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
  while (i < a.length) out[k++] = a[i++]; while (j < b.length) out[k++] = b[j++];
  return out;
}
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
/** The same for a population object (integer-valued populations handled exactly). */
function ksAny(sorted, P) {
  if (!P.discrete) return ksDist(sorted, P.cdf);
  const n = sorted.length; let d = 0, j = 0;
  for (let k = 0; k <= sorted[n - 1]; k++) { while (j < n && sorted[j] <= k) j++; const g = Math.abs(j / n - P.cdf(k)); if (g > d) d = g; }
  return d;
}
/** Where the sup is attained: {D, x, a: F(x), b: F_n at x (or its left limit)}. */
function gapInfo(sorted, P) {
  const n = sorted.length; let best = { D: 0, x: NaN, a: 0, b: 0 };
  if (!n) return best;
  if (P.discrete) {
    let j = 0;
    for (let k = 0; k <= Math.max(sorted[n - 1], 0); k++) { while (j < n && sorted[j] <= k) j++; const F = P.cdf(k), g = Math.abs(j / n - F); if (g > best.D) best = { D: g, x: k + 0.5, a: F, b: j / n }; }
    return best;
  }
  let i = 0;
  while (i < n) {
    let j = i; while (j + 1 < n && sorted[j + 1] === sorted[i]) j++;
    const x = sorted[i], F = P.cdf(x), Fr = (j + 1) / n, Fl = i / n;
    if (Math.abs(Fr - F) > best.D) best = { D: Math.abs(Fr - F), x, a: F, b: Fr };
    if (Math.abs(F - Fl) > best.D) best = { D: Math.abs(F - Fl), x, a: F, b: Fl };
    i = j + 1;
  }
  return best;
}
/** Limiting Kolmogorov law K(λ) = P(sup|B°| ≤ λ), its tail and density. */
function kolK(l) {
  if (l <= 0.05) return 0;
  if (l < 1.18) { let s = 0; for (let k = 1; k <= 8; k++) s += Math.exp((-((2 * k - 1) ** 2) * Math.PI * Math.PI) / (8 * l * l)); return (SQ2PI / l) * s; }
  let s = 0; for (let k = 1; k <= 40; k++) s += (k % 2 ? 1 : -1) * Math.exp(-2 * k * k * l * l); return 1 - 2 * s;
}
const kolQ = (l) => clamp(1 - kolK(l), 0, 1);
const kolPdf = (l) => (kolK(l + 1e-4) - kolK(Math.max(0, l - 1e-4))) / 2e-4;
function ksPval(D, n) { const e = Math.sqrt(n); return kolQ((e + 0.12 + 0.11 / e) * D); }
/** Step polyline of the empirical cdf of an ascending sample (grid-evaluated when the sample is large). */
function ecdfPts(sorted, lo, hi, maxPts = 1000) {
  const n = sorted.length; if (!n) return [[lo, 0], [hi, 0]];
  const pts = [[Math.min(lo, sorted[0]) - 1, 0]];
  if (n <= maxPts / 2) { for (let i = 0; i < n; i++) pts.push([sorted[i], i / n], [sorted[i], (i + 1) / n]); pts.push([Math.max(hi, sorted[n - 1]) + 1, 1]); }
  else { let j = 0; for (let g = 0; g <= maxPts; g++) { const x = lo + ((hi - lo) * g) / maxPts; while (j < n && sorted[j] <= x) j++; pts.push([x, j / n]); } }
  return pts;
}
/** Step polyline of an integer-supported cdf. */
function stepCdf(cdf, lo, hi) { const pts = [[lo, cdf(lo)]]; for (let k = Math.ceil(lo); k <= hi; k++) pts.push([k, cdf(k - 1)], [k, cdf(k)]); pts.push([hi, cdf(hi)]); return pts; }
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

export default {
  collection: 'stat',
  chapter: 1,
  title: 'Statistical models and sampling distributions',
  summary: String.raw`Inference starts by treating the data as draws from an unknown member of a family of distributions, and every statistic computed from them as a random quantity with a sampling distribution of its own, the law it would follow over endless repetitions of the experiment. The empirical distribution function converges uniformly to the truth, with an explicit finite-sample band, and this justifies estimating any feature of a distribution by computing it on the data. For normal samples the χ², t and F laws are exact; for everything else, Slutsky's theorem and the delta method turn limit theorems into usable approximations, and Hoeffding's inequality gives guarantees valid at every sample size. Exponential and location–scale families, the two model classes used throughout the course, and the multivariate normal close the chapter.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Statistical model: parametric and nonparametric',
      statement: String.raw`A **statistical model** for data $X=(X_1,\dots,X_n)$ is a set $\mathcal P$ of probability distributions on the sample space, one of which is assumed to have generated the data. It is usually written as an indexed family $\mathcal P=\{P_\theta:\theta\in\Theta\}$.

- The model is **parametric** if $\Theta\subseteq\R^k$ for a fixed finite $k$: for example $\{N(\mu,\sigma^2):\mu\in\R,\ \sigma>0\}$ or $\{\mathrm{Poisson}(\lambda):\lambda>0\}$.
- It is **nonparametric** if it cannot be indexed by finitely many real numbers: for example all distributions on $\R$ with finite variance, or all continuous distributions.

The model is **identifiable** if $\theta\mapsto P_\theta$ is one-to-one, and **correctly specified** if the true distribution lies in $\mathcal P$; otherwise it is misspecified. Inference means using the data to say which members of $\mathcal P$ are compatible with what was observed.`,
      idea: String.raw`A model turns the vague question "what produced these numbers?" into the precise question "which point of $\Theta$?". Every member $P_\theta$ is a measure (rca-1.18) on the sample space, so it can be confronted with the data: here each candidate is scored by how far its distribution function lies from the empirical one (the Kolmogorov distance of 1.4, with its p-value), and the plausible members form a region of $\Theta$. Larger samples shrink that region around the truth when the model is right; when it is misspecified the region shrinks toward nothing, because no member fits. A nonparametric model is harder to get wrong but its members are whole curves, so its plausible set is a band of distribution functions instead of a patch of the plane.`,
      caption: String.raw`A hidden true law has produced the gold histogram. Drag the blue handle (on the curve's peak, or the point in $\Theta$) to try members of the model; the green region of $\Theta$ contains every member that a Kolmogorov–Smirnov test does not reject at 5%. Grow $n$ and the region shrinks. Switch the true law to *skewed* (outside the normal family) and push $n$ up: the plausible region vanishes. The nonparametric model replaces the region by a band of distribution functions that always contains the truth.`,
      deps: ['rca-1.18', 'prob-1.2.1b'],
      refs: ['Wasserman §6.2', 'Casella–Berger §6.1'],
      tags: ['statistical model', 'parametric'],
      viz(v) {
        const M = v.M, Phi = PhiFast(M);
        const fam = v.select('model', [{ value: 'normal', label: 'normal family' }, { value: 'poisson', label: 'Poisson family' }, { value: 'np', label: 'nonparametric' }], 'normal');
        const tC = v.select('true law', [{ value: 'in', label: '$N(1.2,\\,0.9^2)$' }, { value: 'out', label: 'skewed (gamma)' }], 'in');
        const tD = v.select('true law', [{ value: 'in', label: '$\\mathrm{Poisson}(4.2)$' }, { value: 'out', label: 'overdispersed' }], 'in');
        const nS = v.slider('sample size $n$', 5, 400, 40, { int: true, log: true });
        const reveal = v.toggle('reveal the true law', false);
        let seed = 1; v.button('New sample', () => { seed++; });
        const sL = v.stage({ x: [-1.6, 4.6], y: [0, 0.95], height: 300, axes: 'box', title: 'the data and one candidate member' });
        const sR = v.stage({ x: [-0.6, 3], y: [0.42, 2], height: 300, axes: 'box' });
        const tR = titler(sR), lg = legender(v);
        const gam = M.dist.gamma(2, 0.65), gLam = M.dist.gamma(2, 2.1), pNB = 2 / 6.2;
        const poisPmf = (lam, k) => Math.exp(k * Math.log(lam) - lam - M.lgamma(k + 1));
        const TRUE = {
          cin: { pdf: (x) => phi((x - 1.2) / 0.9) / 0.9, cdf: (x) => Phi((x - 1.2) / 0.9), draw: (r) => 1.2 + 0.9 * r.normal() },
          cout: { pdf: (x) => gam.pdf(x + 0.1), cdf: (x) => gam.cdf(x + 0.1), draw: (r) => gam.sample(r) - 0.1 },
          din: { pmf: (k) => poisPmf(4.2, k), draw: (r) => rpois(r, 4.2) },
          dout: { pmf: (k) => (k + 1) * pNB * pNB * Math.pow(1 - pNB, k), draw: (r) => rpois(r, gLam.sample(r)) },
        };
        const cache = memo();
        const data = () => {
          const disc = fam.value === 'poisson', tk = disc ? 'd' + tD.value : 'c' + tC.value, n = nS.value;
          return cache([tk, n, seed].join('|'), () => {
            const r = v.rng(hashStr(tk + '|' + seed)), xs = []; for (let i = 0; i < n; i++) xs.push(TRUE[tk].draw(r));
            const sorted = sortNum(xs), out = { disc, tk, xs, sorted, n, key: [tk, n, seed].join('|') };
            if (disc) {
              const kmax = sorted[n - 1], Fn = []; let j = 0;
              for (let k = 0; k <= kmax; k++) { while (j < n && sorted[j] <= k) j++; Fn.push(j / n); }
              out.Fn = Fn;
              out.pv = (lam) => { let p = Math.exp(-lam), c = 0, d = 0; for (let k = 0; k <= kmax; k++) { if (k) p *= lam / k; c += p; d = Math.max(d, Math.abs(Fn[k] - c)); } return ksPval(d, n); };
              out.curve = []; for (let lam = 0.5; lam <= 12.001; lam += 0.05) out.curve.push([lam, out.pv(lam)]);
            } else {
              out.pv = (mu, sd) => { let d = 0; for (let i = 0; i < n; i++) { const F = Phi((sorted[i] - mu) / sd), a = (i + 1) / n - F, b = F - i / n; if (a > d) d = a; if (b > d) d = b; } return ksPval(d, n); };
              let ok = 0; for (let i = 0; i < 40; i++) for (let k = 0; k < 32; k++) if (out.pv(-0.6 + (3.6 * (i + 0.5)) / 40, 0.42 + (1.58 * (k + 0.5)) / 32) > 0.05) ok++;
              out.frac = ok / 1280;
            }
            return out;
          });
        };
        const cand = { mu: 0.35, sd: 1.45, lam: 2.4 };
        const hL = sL.handle(0, 0, { color: 'accent', constrain: (x, y) => (fam.value === 'poisson' ? [clamp(x, 0.5, 12), hL.y] : [clamp(x, -0.6, 3), clamp(y, 1 / (2 * SQ2PI), 1 / (0.42 * SQ2PI))]) });
        hL.onDrag = (h) => { if (fam.value === 'poisson') cand.lam = h.x; else { cand.mu = h.x; cand.sd = 1 / (h.y * SQ2PI); } };
        const hR = sR.handle(0, 0, { color: 'accent', constrain: (x, y) => (fam.value === 'poisson' ? [clamp(x, 0.5, 12), data().pv(clamp(x, 0.5, 12))] : [clamp(x, -0.6, 3), clamp(y, 0.42, 2)]) });
        hR.onDrag = (h) => { if (fam.value === 'poisson') cand.lam = h.x; else { cand.mu = h.x; cand.sd = h.y; } };
        const G = v.rgb('green');
        v.render(() => {
          const d = data(), f = fam.value, show = reveal.value, tr = TRUE[d.tk];
          tC.el.hidden = f === 'poisson'; tD.el.hidden = f !== 'poisson';
          if (f === 'poisson') {
            viewPad(sL, [-0.7, 16.7], [0, 0.36]);
            const cnt = new Array(40).fill(0); d.xs.forEach((k) => { if (k < 40) cnt[k]++; });
            cnt.forEach((c, k) => { if (c) sL.rect(k - 0.35, 0, k + 0.35, c / d.n, { fill: 'gold', fillAlpha: 0.45, color: 'gold', width: 1 }); });
            for (let k = 0; k <= 16; k++) { const y = poisPmf(cand.lam, k); sL.line(k, 0, k, y, { color: 'accent', width: 2 }); sL.dot(k, y, { r: 3.5, color: 'accent' }); }
            if (show) for (let k = 0; k <= 16; k++) sL.dot(k, tr.pmf(k), { r: 4.5, color: 'green', hollow: true });
            if (!hL.dragging) { hL.x = cand.lam; hL.y = 0.33; }
            sL.text('drag λ', hL.x, 0.33, { dx: 12, color: 'accent', size: 11.5, math: false });
          } else {
            viewPad(sL, [-1.6, 4.6], [0, 0.95]);
            const nb = clamp(Math.round(Math.sqrt(d.n) * 1.5), 8, 40);
            sL.hist(binned(d.xs, -1.6, 4.6, nb), { density: true, color: 'gold', fillAlpha: 0.4 });
            sL.fn((x) => phi((x - cand.mu) / cand.sd) / cand.sd, { color: 'accent', width: 2.4, n: 300 });
            if (show) sL.fn(tr.pdf, { color: 'green', width: 2, dash: [6, 4], n: 300 });
            if (!hL.dragging) { hL.x = cand.mu; hL.y = 1 / (cand.sd * SQ2PI); }
          }
          // ── right panel: the parameter space (or the space of cdfs)
          hR.visible = f !== 'np';
          if (f === 'normal') {
            tR('parameter space $\\Theta=\\{(\\mu,\\sigma)\\}$ — green: not rejected at 5%');
            viewPad(sR, [-0.6, 3], [0.42, 2]);
            sR.raster((mu, sd) => { const p = d.pv(mu, sd); return p > 0.05 ? [G[0], G[1], G[2], 80] : p > 0.01 ? [G[0], G[1], G[2], 30] : null; }, { res: 5, key: d.key + v.color('green') });
            axisLabels(sR, '\\mu', '\\sigma');
            if (show && d.tk === 'cin') { sR.dot(1.2, 0.9, { r: 7, color: 'green', hollow: true, width: 2.4 }); sR.text('truth', 1.2, 0.9, { dx: 11, dy: 1, color: 'green', size: 12, math: false }); }
            if (show && d.tk === 'cout') sR.corner('the true law is not in Θ', 'br', { color: 'red', weight: 600 });
            if (!hR.dragging) { hR.x = cand.mu; hR.y = cand.sd; }
          } else if (f === 'poisson') {
            tR('parameter space $\\Theta=\\{\\lambda>0\\}$: p-value of each member');
            viewPad(sR, [0.5, 12], [0, 1.05]);
            sR.hband(0, 0.05, { color: 'red', alpha: 0.1 });
            const ok = d.curve.filter(([, p]) => p > 0.05);
            for (const [l, p] of ok) sR.line(l, 0, l, p, { color: 'green', width: 3.2, alpha: 0.35 });
            sR.path(d.curve, { color: 'accent', width: 2.2 });
            sR.text('rejected below 0.05', 11.8, 0.075, { align: 'right', color: 'red', size: 11, math: false });
            axisLabels(sR, '\\lambda', '\\text{p-value}');
            if (show && d.tk === 'din') { sR.vline(4.2, { color: 'green', dash: [5, 4], width: 1.6 }); sR.text('truth', 4.2, 1.0, { dx: 5, color: 'green', size: 12, math: false }); }
            if (show && d.tk === 'dout') sR.corner('the true law is not in Θ', 'tr', { color: 'red', weight: 600 });
            if (!hR.dragging) { hR.x = cand.lam; hR.y = d.pv(cand.lam); }
          } else {
            tR('nonparametric: every cdf inside the 95% band is plausible');
            viewPad(sR, [-1.6, 4.6], [-0.03, 1.03]);
            const c = 1.3581 / (Math.sqrt(d.n) + 0.12 + 0.11 / Math.sqrt(d.n)), pts = ecdfPts(d.sorted, -1.6, 4.6);
            sR.poly(pts.map(([x, y]) => [x, Math.min(1, y + c)]).concat(pts.map(([x, y]) => [x, Math.max(0, y - c)]).reverse()), { fill: 'gold', fillAlpha: 0.18, stroke: false });
            sR.path(pts, { color: 'gold', width: 2 });
            const pv = d.pv(cand.mu, cand.sd);
            sR.fn((x) => Phi((x - cand.mu) / cand.sd), { color: pv > 0.05 ? 'accent' : 'red', width: 2.2 });
            if (show) sR.fn(tr.cdf, { color: 'green', width: 2, dash: [6, 4] });
          }
          lg([['gold', 'data', { area: true }], ['accent', 'candidate member'], ...(show ? [['green', 'true law', { dash: true }]] : []), ...(f === 'normal' ? [['green', 'plausible members', { area: true }]] : [])]);
        });
        v.readout(() => {
          const d = data(), f = fam.value;
          if (f === 'poisson') {
            const p = d.pv(cand.lam), lo = d.curve.find(([, q]) => q > 0.05), hi = [...d.curve].reverse().find(([, q]) => q > 0.05);
            return String.raw`candidate $\mathrm{Poisson}(\lambda)$ with $\lambda = ${v.fix(cand.lam, 2)}$: KS p-value ${v.fix(p, 3)} — **${p > 0.05 ? 'plausible' : 'rejected'}** · plausible set ` + (lo ? String.raw`$\lambda\in[${v.fix(lo[0], 2)},\,${v.fix(hi[0], 2)}]$` : '**empty**: no Poisson law fits') + (reveal.value ? (d.tk === 'din' ? ' · truth $\\lambda = 4.2$' : ' · the truth (variance 13, mean 4.2) is overdispersed: not a member') : '');
          }
          const p = d.pv(cand.mu, cand.sd);
          const head = String.raw`candidate $N(\mu,\sigma^2)$, $\mu = ${v.fix(cand.mu, 2)}$, $\sigma = ${v.fix(cand.sd, 2)}$: KS p-value ${v.fix(p, 3)} — **${p > 0.05 ? 'plausible' : 'rejected'}**`;
          if (f === 'np') return head + ` · band half-width ${v.fix(1.3581 / (Math.sqrt(d.n) + 0.12 + 0.11 / Math.sqrt(d.n)), 3)} at $n = ${d.n}$` + (reveal.value ? ' · the true cdf lies in the band (KS p-value ' + v.fix(ksPval(ksDist(d.sorted, TRUE[d.tk].cdf), d.n), 2) + ')' : '');
          return head + ` · plausible members fill ${pct(d.frac)} of the window` + (reveal.value ? (d.tk === 'cin' ? ` · truth $(1.2,\\,0.9)$ has p-value ${v.fix(d.pv(1.2, 0.9), 2)}` : ' · truth is skewed: no member of $\\Theta$ is right') : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Random sample and statistic',
      statement: String.raw`A **random sample** of size $n$ from a distribution $F$ is a collection $X_1,\dots,X_n$ of independent random variables each with distribution $F$ (an *i.i.d.* sample); its joint law is the product $F^{\otimes n}$. A **statistic** is any function $T=T(X_1,\dots,X_n)$ of the sample that does not involve unknown parameters, such as the sample mean $\bar X=\frac1n\sum X_i$, the median, the maximum $X_{(n)}$ or the sample standard deviation $S$. Being a function of random variables, a statistic is itself random; its distribution, induced by $F^{\otimes n}$, is its **sampling distribution**.`,
      idea: String.raw`The sampling distribution is what a statistic *would* do over endless repetitions of the same experiment, and it is the object every later chapter reasons about: bias is its centre, standard error its spread, a confidence interval a statement about its quantiles. Independence (prob-2.1.1a) is what makes it computable: the law of the sample is a product measure, so for instance $P(X_{(n)}\le x)=F(x)^n$ exactly, while for the mean the variances add. Note that the same data give different sampling distributions for different statistics, and that the mean of Cauchy data is no less spread out than a single observation.`,
      caption: String.raw`Top: the population and the last sample (gold dots) with its statistic in orange. Each press of *Draw* repeats the whole experiment and drops one more value of the statistic into the histogram below, which grows into the sampling distribution; green is the theoretical law where one is known (exact, or the large-$n$ approximation, as labelled). Compare the mean, median and maximum on the same population, and try the Cauchy population.`,
      deps: ['stat-1.1', 'prob-2.1.1a'],
      refs: ['Casella–Berger §5.1', 'Wasserman §6.1'],
      tags: ['sampling distribution', 'statistic'],
      viz(v) {
        const M = v.M;
        const popSel = v.select('population', popOpts(['normal', 'uniform', 'expo', 'bimodal', 'cauchy']), 'expo');
        const stSel = v.select('statistic', [{ value: 'mean', label: 'mean $\\bar X$' }, { value: 'median', label: 'median' }, { value: 'max', label: 'maximum' }, { value: 'sd', label: 'SD $S$' }], 'mean');
        const nS = v.slider('sample size $n$', 2, 50, 10, { int: true });
        const sP = v.stage({ x: [0, 1], y: [0, 1], height: 150, axes: 'box', ticks: false, full: true });
        const sH = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: 'box', full: true, title: 'the statistic over repeated samples: its sampling distribution' });
        const tP = titler(sP), lg = legender(v);
        const STAT = { mean: (xs) => mean(xs), median: (xs) => qSorted(sortNum(xs), 0.5), max: (xs) => Math.max(...xs), sd: (xs) => moments(xs).sd };
        const R = repeater(v, {
          key: () => [popSel.value, stSel.value, nS.value].join('|'),
          sample: (r) => { const P = pop(M, popSel.value), xs = new Array(nS.value); for (let i = 0; i < xs.length; i++) xs[i] = P.draw(r); return xs; },
          stat: (xs) => STAT[stSel.value](xs), init: 1000,
        });
        const thC = memo();
        const theory = (P, st, n) => thC([P.key, st, n].join('|'), () => {
          const mom = (pdf, a, b) => { const m0 = M.integrate(pdf, a, b, 4000), m1 = M.integrate((x) => x * pdf(x), a, b, 4000), m2 = M.integrate((x) => x * x * pdf(x), a, b, 4000); return { m: m1 / m0, sd: Math.sqrt(Math.max(0, m2 / m0 - (m1 / m0) ** 2)) }; };
          if (st === 'mean') {
            if (P.key === 'cauchy') return { pdf: P.pdf, label: 'exact: standard Cauchy again', m: NaN, sd: NaN, exact: true };
            const s = P.sd / Math.sqrt(n);
            return { pdf: (x) => phi((x - P.mean) / s) / s, m: P.mean, sd: s, exact: P.key === 'normal', label: P.key === 'normal' ? 'exact law $N(\\mu,\\sigma^2/n)$' : 'normal approximation $N(\\mu,\\sigma^2/n)$' };
          }
          if (st === 'median') { const m = P.q(0.5), s = 1 / (2 * P.pdf(m) * Math.sqrt(n)); return { pdf: (x) => phi((x - m) / s) / s, m, sd: s, label: 'large-$n$ approximation $N\\big(m,\\,1/(4nf(m)^2)\\big)$' }; }
          if (st === 'max') {
            const pdf = (x) => n * P.pdf(x) * Math.pow(P.cdf(x), n - 1);
            if (P.key === 'cauchy') return { pdf, exact: true, label: 'exact law $nf(x)F(x)^{n-1}$', m: Infinity, sd: Infinity };
            const mm = mom(pdf, P.q(Math.pow(1e-9, 1 / n)), P.q(Math.pow(1 - 1e-10, 1 / n)));
            return { pdf, exact: true, label: 'exact law $nf(x)F(x)^{n-1}$', ...mm };
          }
          if (P.key !== 'normal') return null;
          const c = M.dist.chi2(n - 1), pdf = (s) => (s <= 0 ? 0 : c.pdf((n - 1) * s * s) * 2 * (n - 1) * s);
          return { pdf, exact: true, label: 'exact: $(n-1)S^2/\\sigma^2\\sim\\chi^2_{n-1}$', ...mom(pdf, 1e-9, 4) };
        });
        const hc = memo();
        v.render(() => {
          const S = R.sync(), P = pop(M, popSel.value), n = nS.value, st = stSel.value, [lo, hi] = P.view;
          const pk = peakOf(P.pdf, lo, hi);
          tP(`population ${P.label} $${P.tex}$ and the last sample of size $n=${n}$`);
          sP.setView([lo, hi], [-0.3 * pk, 1.12 * pk]);
          sP.fn(P.pdf, { color: 'muted', width: 1.8, fill: 'muted', fillAlpha: 0.14, n: 500 });
          sP.hline(-0.02 * pk, { color: 'faint', width: 1 });
          if (S.last) {
            const xs = S.last, t = STAT[st](xs);
            sP.dots(xs.map((x, i) => [x, -0.15 * pk + (((i * 0.6180339) % 1) - 0.5) * 0.14 * pk]), { r: 3.6, color: 'gold' });
            if (st === 'sd') { const m = mean(xs); sP.line(m - t, -0.27 * pk, m + t, -0.27 * pk, { color: 'orange', width: 3 }); sP.dot(m, -0.27 * pk, { r: 3, color: 'orange' }); }
            else sP.line(t, -0.29 * pk, t, -0.02 * pk, { color: 'orange', width: 3 });
            sP.corner(`last sample: ${{ mean: 'mean', median: 'median', max: 'maximum', sd: 'SD (bar = mean ± S)' }[st]} = ${v.fix(t, 3)}`, 'tr', { color: 'orange', weight: 600 });
          }
          const th = theory(P, st, n);
          const H = hc(S.id(), () => {
            const sorted = sortNum(S.vals), N = sorted.length;
            const iqr = N > 8 ? qSorted(sorted, 0.75) - qSorted(sorted, 0.25) : (hi - lo) / 20, bw = iqr > 0 ? (2 * iqr) / Math.cbrt(Math.max(N, 1)) : (hi - lo) / 60;
            const nb = clamp(Math.round((hi - lo) / bw), 30, 320);
            return { B: binned(S.vals, lo, hi, nb), mom: moments(S.vals) };
          });
          let top = Math.max(H.B.max, 0.05);
          if (th) top = Math.max(top, peakOf(th.pdf, lo, hi));
          viewPad(sH, [lo, hi], [0, top * 1.15]);
          sH.hist(H.B, { density: true, color: 'accent', fillAlpha: 0.35 });
          if (th) sH.fn(th.pdf, { color: 'green', width: 2.2, dash: th.exact ? null : [6, 4], n: 600 });
          if (S.last) sH.dot(STAT[st](S.last), top * 0.03, { r: 5, color: 'orange' });
          if (H.B.out) sH.corner(`${commas(H.B.out)} value${H.B.out > 1 ? 's' : ''} outside the window`, 'tl', { color: 'red' });
          lg([['muted', 'population density', { area: true }], ['gold', 'last sample', { dot: true }], ['accent', 'sampling distribution (simulated)', { area: true }], ...(th ? [['green', th.label, { dash: !th.exact }]] : [])]);
        });
        v.readout(() => {
          const S = R.sync(), P = pop(M, popSel.value), th = theory(P, stSel.value, nS.value), m = moments(S.vals);
          const f = (x) => (x === Infinity ? '\\infty' : isNaN(x) ? '\\text{undefined}' : v.fix(x, 3));
          return `${commas(S.vals.length)} samples of size $n = ${nS.value}$ · the statistic averaged $${f(m.mean)}$ with SD $${f(m.sd)}$` + (th ? ` · ${th.exact ? 'exact' : 'approximate'} theory: mean $${f(th.m)}$, SD $${f(th.sd)}$` : ' · no closed form for this population') + (P.key === 'cauchy' && stSel.value === 'mean' ? ' · averaging Cauchy draws does not concentrate them at all' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Proposition',
      name: 'Moments of the sample mean; unbiasedness of S²',
      statement: String.raw`Let $X_1,\dots,X_n$ be a random sample from a distribution with mean $\mu$ and finite variance $\sigma^2$, and let $S^2=\frac1{n-1}\sum_{i=1}^n(X_i-\bar X)^2$ be the sample variance. Then
$$E\bar X=\mu,\qquad \operatorname{Var}\bar X=\frac{\sigma^2}{n},\qquad E S^2=\sigma^2 .$$
The version with divisor $n$, $S_n^2=\frac1n\sum(X_i-\bar X)^2$, is biased: $E S_n^2=\frac{n-1}{n}\sigma^2$. The formulas use independence (uncorrelatedness suffices) and fail for dependent observations.`,
      idea: String.raw`Linearity of expectation gives $E\bar X=\mu$; the variance of a sum of uncorrelated terms is the sum of the variances (prob-2.2.1), so $\operatorname{Var}\bar X=n\sigma^2/n^2$. For $S^2$ expand $\sum(X_i-\bar X)^2=\sum(X_i-\mu)^2-n(\bar X-\mu)^2$, whose expectation is $n\sigma^2-\sigma^2$: measuring spread around the sample's own centre, which is always closer to the data than $\mu$ is, uses up one degree of freedom. With positively correlated data the deviations from $\bar X$ are smaller still and $\operatorname{Var}\bar X$ is larger, so both formulas break.`,
      caption: String.raw`Each repetition draws a sample and records $\bar X$, $S^2$ and $S_n^2$. Left: running averages over the repetitions on a log scale — green ($S^2$) settles on $\sigma^2$, red ($S_n^2$) on $(n-1)\sigma^2/n$, clearest at $n=2$ or $3$. Right: the skewed sampling law of $S^2$, mean $\sigma^2$ but usually below it. Switch on *dependent* sampling (an AR(1) sequence with the same marginal law) and both identities fail; with Cauchy data there is no $\sigma^2$ and the averages never settle.`,
      deps: ['stat-1.2', 'prob-2.2.1'],
      refs: ['Casella–Berger §5.2'],
      tags: ['sample mean', 'unbiasedness', 'sample variance'],
      viz(v) {
        const M = v.M, Phi = PhiFast(M);
        const popSel = v.select('population', popOpts(['normal', 'uniform', 'expo', 't3', 'cauchy']), 'expo');
        const dep = v.select('sampling', [{ value: 'iid', label: 'independent' }, { value: 'ar', label: 'dependent (AR, $\\rho = 0.6$)' }], 'iid');
        const nS = v.slider('sample size $n$', 2, 20, 3, { int: true });
        const sA = v.stage({ x: [1, 1e4], y: [0, 1.8], xlog: true, height: 300, axes: 'box', weight: 1.35, title: 'running averages over repetitions (units of $\\sigma^2$)' });
        const sB = v.stage({ x: [0, 4], y: [0, 1], height: 300, axes: 'box' });
        const tB = titler(sB);
        const R = repeater(v, {
          key: () => [popSel.value, dep.value, nS.value].join('|'),
          sample: (r) => {
            const P = pop(M, popSel.value), n = nS.value, xs = new Array(n);
            if (dep.value === 'iid') for (let i = 0; i < n; i++) xs[i] = P.draw(r);
            else { let z = r.normal(); for (let i = 0; i < n; i++) { if (i) z = 0.6 * z + 0.8 * r.normal(); xs[i] = P.key === 'normal' ? z : P.q(clamp(Phi(z), 1e-12, 1 - 1e-12)); } }
            return xs;
          },
          stat: (xs) => { const n = xs.length, m = mean(xs); let ss = 0; for (const x of xs) ss += (x - m) * (x - m); return [m, ss / (n - 1), ss / n]; },
          init: 3000, cap: 200000,
        });
        const rc = memo();
        const runs = () => { const S = R.sync(); return rc(S.id(), () => {
          const V = S.vals, N = V.length, P = pop(M, popSel.value), sc = isFinite(P.var) ? P.var : 1;
          const idx = []; if (N <= 600) for (let k = 1; k <= N; k++) idx.push(k); else { let last = 0; for (let g = 0; g <= 500; g++) { const k = Math.round(Math.pow(N, g / 500)); if (k > last) { idx.push(k); last = k; } } }
          const p2 = [], pn = []; let c2 = 0, cn = 0, j = 0, ymax = 0;
          for (let k = 1; k <= N; k++) { c2 += V[k - 1][1]; cn += V[k - 1][2]; if (k === idx[j]) { p2.push([k, c2 / k / sc]); pn.push([k, cn / k / sc]); ymax = Math.max(ymax, c2 / k / sc); j++; } }
          return { N, p2, pn, sc, ymax, X: moments(V, (a) => a[0]), A: moments(V, (a) => a[1]), B: moments(V, (a) => a[2]), below: V.filter((a) => a[1] < P.var).length / Math.max(1, N) };
        }); };
        v.render(() => {
          const P = pop(M, popSel.value), n = nS.value, Rn = runs(), fin = isFinite(P.var);
          viewPad(sA, [1, Math.max(10, Rn.N)], [0, fin ? 1.8 : Math.max(1, Rn.ymax * 1.1)], { xlog: true });
          if (fin) {
            sA.hline(1, { color: 'green', dash: [6, 4], width: 1.4 }); sA.hline((n - 1) / n, { color: 'red', dash: [6, 4], width: 1.4 });
            sA.text('σ²', Math.max(10, Rn.N), 1, { align: 'right', dx: -4, dy: -10, color: 'green', size: 13 });
            sA.text('(n−1)σ²/n', Math.max(10, Rn.N), (n - 1) / n, { align: 'right', dx: -4, dy: 11, color: 'red', size: 13 });
          } else sA.corner('Cauchy: σ² = ∞, so there is nothing to settle on', 'tl', { color: 'red', weight: 600 });
          sA.path(Rn.pn, { color: 'red', width: 2 }); sA.path(Rn.p2, { color: 'green', width: 2.2 });
          if (Rn.N) { sA.dot(Rn.N, Rn.p2[Rn.p2.length - 1][1], { r: 4, color: 'green' }); sA.dot(Rn.N, Rn.pn[Rn.pn.length - 1][1], { r: 4, color: 'red' }); }
          // right: sampling law of S²/σ²
          const S = R.sync();
          if (fin) {
            tB('sampling distribution of $S^2/\\sigma^2$');
            const B = binned(S.vals, 0, 4, 80, (a) => a[1] / P.var), exact = P.key === 'normal' && dep.value === 'iid';
            const c = M.dist.chi2(n - 1), pdf = (y) => (n - 1) * c.pdf((n - 1) * y);
            const top = Math.max(B.max, exact ? peakOf(pdf, 0.02, 4) : 0, 0.3);
            viewPad(sB, [0, 4], [0, top * 1.15]);
            sB.hist(B, { density: true, color: 'accent', fillAlpha: 0.32 });
            if (exact) sB.fn(pdf, { color: 'muted', width: 1.8, domain: [0.005, 4], n: 400 });
            sB.vline(1, { color: 'ink', dash: [3, 4], width: 1 });
            if (Rn.N) { sB.vline(Rn.A.mean / P.var, { color: 'green', width: 2.2 }); sB.vline(Rn.B.mean / P.var, { color: 'red', width: 2.2 }); }
            sB.corner(`P(S² < σ²) ≈ ${pct(Rn.below)}`, 'tr', { color: 'muted' });
          } else {
            tB('sampling distribution of $S^2$ (no $\\sigma^2$ to divide by)');
            const B = binned(S.vals, 0, 60, 60, (a) => a[1]); viewPad(sB, [0, 60], [0, Math.max(B.max, 0.01) * 1.15]);
            sB.hist(B, { density: true, color: 'accent', fillAlpha: 0.32 });
            if (B.out) sB.corner(`${pct(B.out / B.N)} beyond 60`, 'tr', { color: 'red' });
          }
          v.legend([['green', 'average of $S^2$'], ['red', 'average of $S_n^2$'], ['accent', '$S^2$ values', { area: true }], ...(P.key === 'normal' && dep.value === 'iid' ? [['muted', 'exact $\\chi^2_{n-1}/(n-1)$']] : [])]);
        });
        v.readout(() => {
          const P = pop(M, popSel.value), n = nS.value, Rn = runs(), N = Rn.N;
          if (!N) return 'Press Draw to start.';
          const se = (m) => v.fix(2 * m.sd / Math.sqrt(N), 3), fin = isFinite(P.var);
          if (!fin) return String.raw`Cauchy data: $E|X| = \infty$, so neither $\mu$ nor $\sigma^2$ exists · after ${commas(N)} samples the average of $S^2$ is ${v.fix(Rn.A.mean, 1)} and still jumping`;
          let s = String.raw`${commas(N)} samples · $E\bar X$: ${v.fix(Rn.X.mean, 3)} ± ${se(Rn.X)} vs $\mu = ${v.fix(P.mean, 3)}$ · $n\operatorname{Var}\bar X$: ${v.fix(n * Rn.X.var, 3)} vs $\sigma^2 = ${v.fix(P.var, 3)}$ · $E S^2$: **${v.fix(Rn.A.mean, 3)}** ± ${se(Rn.A)} vs $\sigma^2$ · $E S_n^2$: ${v.fix(Rn.B.mean, 3)} ± ${se(Rn.B)} vs $\tfrac{n-1}{n}\sigma^2 = ${v.fix(((n - 1) / n) * P.var, 3)}$`;
          if (dep.value === 'ar') {
            let c = 0; for (let k = 1; k < n; k++) c += (n - k) * Math.pow(0.6, k);
            s += P.key === 'normal' ? String.raw` · dependent data: the exact AR(1) values are $n\operatorname{Var}\bar X = ${v.fix(1 + (2 * c) / n, 3)}$, $E S^2 = ${v.fix(1 - (2 * c) / (n * (n - 1)), 3)}$` : ' · dependent data: the i.i.d. formulas no longer apply';
          }
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Empirical distribution function',
      statement: String.raw`The **empirical distribution function** of a sample $X_1,\dots,X_n$ is
$$F_n(x)=\frac1n\#\{i\le n: X_i\le x\}=\frac1n\sum_{i=1}^n \mathbf 1\{X_i\le x\},\qquad x\in\R .$$
It is the distribution function of the **empirical distribution** $\hat P_n=\frac1n\sum_i\delta_{X_i}$, which puts mass $1/n$ on each observation: a right-continuous step function rising from 0 to 1 with a jump of $k/n$ at each value observed $k$ times. For each fixed $x$, $nF_n(x)\sim\mathrm{Binomial}(n,F(x))$, so $F_n(x)$ is an unbiased estimator of $F(x)$ with variance $F(x)(1-F(x))/n$.`,
      idea: String.raw`$F_n$ is the distribution function (prob-1.2.1b) of the sample itself: it forgets the order in which the data arrived and keeps everything else. At a fixed $x$ it is an average of independent Bernoulli$(F(x))$ indicators, which gives the binomial law and hence unbiasedness and the variance formula. The interesting question, answered by 1.5 and 1.6, is how close the *whole curve* is to $F$, measured by the Kolmogorov distance $D_n=\sup_x|F_n(x)-F(x)|$.`,
      caption: String.raw`Click anywhere in the panel to add an observation at that $x$, or add random draws from the chosen population. The blue staircase climbs by $1/n$ at each point (filled dot: the value at the jump, open dot: the left limit); green is the true $F$. The red segment marks where the vertical gap $D_n$ is largest. Hover to read $F_n(x)$ and $F(x)$ at any point.`,
      deps: ['stat-1.2', 'prob-1.2.1b'],
      refs: ['Wasserman §7.1'],
      tags: ['empirical distribution', 'distribution function'],
      viz(v) {
        const M = v.M;
        const popSel = v.select('population', popOpts(['normal', 'expo', 'bimodal', 'poisson']), 'normal');
        const s = v.stage({ x: [-3.6, 3.6], y: [-0.1, 1.08], height: 340, axes: 'box', full: true, hover: true, title: 'click in the panel to add an observation at that $x$' });
        let data = [], cur = null, r = null;
        const ensure = () => { if (cur !== popSel.value) { cur = popSel.value; r = v.rng(hashStr('ecdf|' + cur)); data = []; for (let i = 0; i < 6; i++) data.push(pop(M, cur).draw(r)); } };
        v.button('Add 1 random', () => { ensure(); data.push(pop(M, cur).draw(r)); });
        v.button('Add 10 random', () => { ensure(); for (let i = 0; i < 10; i++) data.push(pop(M, cur).draw(r)); });
        v.button('Clear', () => { ensure(); data = []; });
        s.onClick((x) => { ensure(); const P = pop(M, cur); data.push(P.discrete ? Math.max(0, Math.round(x)) : x); });
        const Fn = (sorted, x) => { let a = 0, b = sorted.length; while (a < b) { const m = (a + b) >> 1; if (sorted[m] <= x) a = m + 1; else b = m; } return a / Math.max(1, sorted.length); };
        v.render(() => {
          ensure();
          const P = pop(M, cur), [lo, hi] = P.view, sorted = sortNum(data), n = sorted.length;
          viewPad(s, [lo, hi], [-0.1, 1.08]);
          s.hline(1, { color: 'faint', dash: [3, 4], width: 1 });
          if (P.discrete) s.path(stepCdf(P.cdf, lo, hi), { color: 'green', width: 2.2 }); else s.fn(P.cdf, { color: 'green', width: 2.2, n: 400 });
          if (n) {
            s.path(ecdfPts(sorted, lo, hi), { color: 'accent', width: 2.4 });
            if (n <= 80) {
              const uniq = [...new Set(sorted)];
              for (const x of uniq) { s.dot(x, Fn(sorted, x), { r: 3.6, color: 'accent' }); s.dot(x, Fn(sorted, x - 1e-9), { r: 3.4, color: 'accent', hollow: true }); }
            }
            const cnt = new Map();
            for (const x of sorted) { const k = cnt.get(x) || 0; cnt.set(x, k + 1); s.line(x, -0.085 + 0.016 * Math.min(k, 3), x, -0.035 + 0.016 * Math.min(k, 3), { color: 'gold', width: 2 }); }
            const g = gapInfo(sorted, P);
            if (g.D > 0) {
              s.line(g.x, g.a, g.x, g.b, { color: 'red', width: 3.2 });
              s.tex('D_n', g.x, (g.a + g.b) / 2, { color: 'red', align: 'left', dx: 7, size: 14 });
            }
          } else s.corner('no data: click to add', 'tl', { color: 'muted' });
          if (s.pointer.inside && s.pointer.x > lo && s.pointer.x < hi) {
            const x = s.pointer.x; s.vline(x, { color: 'muted', width: 1, dash: [2, 3] });
            if (n) s.dot(x, Fn(sorted, x), { r: 4, color: 'accent' }); s.dot(x, P.cdf(x), { r: 4, color: 'green' });
          }
          v.legend([['accent', 'empirical $F_n$'], ['green', 'true $F$'], ['red', 'largest gap $D_n$'], ['gold', 'observations']]);
        });
        v.readout(() => {
          ensure();
          const P = pop(M, cur), sorted = sortNum(data), n = sorted.length;
          if (!n) return 'no observations yet: $F_n$ is not defined until $n \\ge 1$';
          const g = gapInfo(sorted, P);
          let out = String.raw`$n = ${n}$ · each observation lifts $F_n$ by $1/n = ${v.fix(1 / n, 3)}$ · largest gap $D_n = \sup_x|F_n(x)-F(x)| = ${v.fix(g.D, 3)}$ ${P.discrete ? `on $[${g.x - 0.5}, ${g.x + 0.5})$` : `at $x = ${v.fix(g.x, 2)}$`}`;
          if (s.pointer.inside) { const x = s.pointer.x, k = Math.round(Fn(sorted, x) * n); out += String.raw` · at the pointer $x = ${v.fix(x, 2)}$: $F_n(x) = ${k}/${n} = ${v.fix(k / n, 3)}$, $F(x) = ${v.fix(P.cdf(x), 3)}$`; }
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Glivenko–Cantelli theorem',
      credit: 'Glivenko, 1933; Cantelli, 1933',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with an arbitrary distribution function $F$ and let $F_n$ be the empirical distribution function of the first $n$ observations. Then
$$D_n=\sup_{x\in\R}\,|F_n(x)-F(x)|\ \longrightarrow\ 0\qquad\text{almost surely.}$$
No assumption on $F$ is needed: it may be continuous, discrete, heavy-tailed or without moments. If $F$ is continuous the law of $D_n$ does not depend on $F$, and $\sqrt n\,D_n$ converges in distribution to the Kolmogorov law.`,
      idea: String.raw`For each fixed $x$ the strong law of large numbers (prob-2.4.1) gives $F_n(x)\to F(x)$ and $F_n(x^-)\to F(x^-)$ almost surely. Choose finitely many points $x_1<\dots<x_k$ cutting the line into pieces on which $F$ rises by less than $\varepsilon$ (possible because $F$ is monotone with one-sided limits, pma-4.29); monotonicity of both $F_n$ and $F$ squeezes the gap on each piece between the gaps at its ends, so $\sup_x|F_n-F|\le\varepsilon+\max_j(\text{gaps at the }x_j)$, which tends to $\varepsilon$. For continuous $F$, writing $X_i=F^{-1}(U_i)$ turns $D_n$ into the same quantity for uniforms, hence distribution-freeness.`,
      caption: String.raw`Left: $D_n$ along 100 seeded sample paths, $n$ from 10 to 10,000 on log–log axes; the shaded band holds the middle 90% and the dashed line is the Kolmogorov median $0.83/\sqrt n$. Right: twelve empirical cdfs at the $n$ of the slider, squeezing onto the true $F$. For the smooth, skewed and Cauchy populations the left panel is *identical* (distribution-freeness); the discrete one does even better. Switch to *dependent* sampling (a shock shared by the whole sample) and $D_n$ stops shrinking.`,
      deps: ['stat-1.4', 'pma-4.29', 'prob-2.4.1'],
      see: ['prob-2.4.9'],
      refs: ['Wasserman §7.1', 'van der Vaart §19.1'],
      tags: ['empirical distribution', 'uniform convergence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Glivenko%E2%80%93Cantelli_theorem' },
      viz(v) {
        const M = v.M, Phi = PhiFast(M);
        const popSel = v.select('population', popOpts(['normal', 'expo', 'cauchy', 'poisson']), 'expo');
        const dep = v.select('sampling', [{ value: 'iid', label: 'i.i.d.' }, { value: 'dep', label: 'dependent (shared shock)' }], 'iid');
        const nS = v.slider('$n$', 10, 10000, 300, { int: true, log: true });
        const sL = v.stage({ x: [10, 1e4], y: [0.002, 0.8], xlog: true, ylog: true, height: 310, axes: 'box', title: '$D_n=\\sup_x|F_n-F|$ along 100 sample paths' });
        const sR = v.stage({ x: [-3, 3], y: [-0.02, 1.02], height: 310, axes: 'box' });
        const tR = titler(sR);
        const RR = 100, NMAX = 10000, SHOW = 12, GRID = []; for (let e = 10; e <= 40; e++) { const n = Math.round(Math.pow(10, e / 10)); if (!GRID.length || n > GRID[GRID.length - 1]) GRID.push(n); }
        const simC = new Map();
        const sim = (dp, disc) => {
          const key = dp + '|' + disc; if (simC.has(key)) return simC.get(key);
          const r = v.rng(dp === 'dep' ? 2027 : 1933), Gn = GRID.length, D = new Float64Array(RR * Gn), raw = [], P = pop(M, 'poisson'), a = Math.SQRT1_2;
          for (let rep = 0; rep < RR; rep++) {
            const U = new Float64Array(NMAX);
            if (dp === 'dep') { const z = r.normal(); for (let i = 0; i < NMAX; i++) U[i] = Phi(a * z + a * r.normal()); } else for (let i = 0; i < NMAX; i++) U[i] = r();
            if (rep < SHOW) raw.push(U);
            if (!disc) {
              let sorted = new Float64Array(0), done = 0;
              for (let g = 0; g < Gn; g++) {
                const n = GRID[g]; sorted = mergeSorted(sorted, U.slice(done, n).sort()); done = n;
                let d = 0; for (let i = 0; i < n; i++) { const u = sorted[i], x = (i + 1) / n - u, y = u - i / n; if (x > d) d = x; if (y > d) d = y; }
                D[rep * Gn + g] = d;
              }
            } else {
              const cnt = new Float64Array(61); let done = 0;
              for (let g = 0; g < Gn; g++) {
                const n = GRID[g]; for (let i = done; i < n; i++) cnt[P.q(U[i])]++; done = n;
                let c = 0, d = 0; for (let k = 0; k <= 20; k++) { c += cnt[k]; d = Math.max(d, Math.abs(c / n - P.cdf(k))); }
                D[rep * Gn + g] = d;
              }
            }
          }
          const out = { D, raw, q: GRID.map((_, g) => { const col = []; for (let rep = 0; rep < RR; rep++) col.push(D[rep * Gn + g]); const s = sortNum(col); return [qSorted(s, 0.05), qSorted(s, 0.5), qSorted(s, 0.95)]; }) };
          simC.set(key, out); return out;
        };
        const gIdx = () => { const ln = Math.log(nS.value); let b = 0; GRID.forEach((n, g) => { if (Math.abs(Math.log(n) - ln) < Math.abs(Math.log(GRID[b]) - ln)) b = g; }); return b; };
        const sortC = memo();
        v.render(() => {
          const P = pop(M, popSel.value), disc = !!P.discrete, Sm = sim(dep.value, disc), g = gIdx(), n = GRID[g], Gn = GRID.length;
          viewPad(sL, [10, 1e4], [0.002, 0.8], { xlog: true, ylog: true });
          sL.poly(GRID.map((m, k) => [m, Sm.q[k][2]]).concat(GRID.map((m, k) => [m, Sm.q[k][0]]).reverse()), { fill: 'accent', fillAlpha: 0.14, stroke: false });
          for (let rep = 0; rep < RR; rep++) sL.path(GRID.map((m, k) => [m, Sm.D[rep * Gn + k]]), { color: 'accent', width: 1, alpha: 0.13 });
          sL.path(GRID.map((m, k) => [m, Sm.q[k][1]]), { color: 'accent', width: 2.4 });
          sL.fn((m) => 0.8276 / Math.sqrt(m), { color: 'green', dash: [6, 4], width: 1.6 });
          sL.vline(n, { color: 'gold', width: 1.4 });
          const col = []; for (let rep = 0; rep < RR; rep++) col.push([n, Sm.D[rep * Gn + g]]);
          sL.dots(col, { r: 2.4, color: 'gold' });
          // right: twelve empirical cdfs at this n
          const [lo, hi] = P.view;
          tR(`twelve empirical cdfs at $n = ${commas(n)}$ and the true $F$`);
          viewPad(sR, [lo, hi], [-0.02, 1.02]);
          const Us = sortC(dep.value + '|' + n, () => Sm.raw.map((U) => U.slice(0, n).sort()));
          const at = (us, u) => { let a = 0, b = us.length; while (a < b) { const m = (a + b) >> 1; if (us[m] <= u) a = m + 1; else b = m; } return a / us.length; };
          for (const us of Us) {
            let pts;
            if (disc) { pts = [[lo, 0]]; for (let k = 0; k <= hi; k++) { const y0 = k ? at(us, P.cdf(k - 1)) : 0, y1 = at(us, P.cdf(k)); pts.push([k, y0], [k, y1]); } pts.push([hi, at(us, P.cdf(hi))]); }
            else if (n <= 400) { const xs = Array.from(us, (u) => P.q(u)); pts = ecdfPts(xs, lo, hi); }
            else { pts = []; for (let i = 0; i <= 600; i++) { const x = lo + ((hi - lo) * i) / 600; pts.push([x, at(us, P.cdf(x))]); } }
            sR.path(pts, { color: 'accent', width: 1.3, alpha: 0.5 });
          }
          if (disc) sR.path(stepCdf(P.cdf, lo, hi), { color: 'green', width: 2.6 }); else sR.fn(P.cdf, { color: 'green', width: 2.6, n: 400 });
          v.legend([['accent', '$D_n$ per path (median bold)'], ['accent', 'middle 90%', { area: true }], ['green', 'Kolmogorov median $0.83/\\sqrt n$', { dash: true }], ['gold', 'all paths at the chosen $n$', { dot: true }]]);
        });
        v.readout(() => {
          const P = pop(M, popSel.value), Sm = sim(dep.value, !!P.discrete), g = gIdx(), n = GRID[g], [a, m, b] = Sm.q[g];
          let s = String.raw`$n = ${commas(n)}$: median $D_n = ${v.fix(m, 4)}$, 95th percentile ${v.fix(b, 4)} · $\sqrt n\times$median $= ${v.fix(Math.sqrt(n) * m, 3)}$ (Kolmogorov limit for continuous $F$: 0.828)`;
          if (dep.value === 'dep') s += ` · dependent data: at $n = 10{,}000$ the median is still ${v.fix(Sm.q[GRID.length - 1][1], 3)} — $F_n$ converges to the law *given the shock*, not to $F$`;
          else if (P.discrete) s += ' · for discrete $F$ the gaps are smaller still';
          else s += ' · the same numbers for every continuous population';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Dvoretzky–Kiefer–Wolfowitz inequality',
      credit: 'Dvoretzky, Kiefer & Wolfowitz, 1956; Massart, 1990 (sharp constant)',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. with any distribution function $F$. For every $\varepsilon>0$ and every $n\ge1$,
$$P\Big(\sup_{x}|F_n(x)-F(x)|>\varepsilon\Big)\le 2e^{-2n\varepsilon^2}.$$
Consequently, with $\varepsilon_n=\sqrt{\log(2/\alpha)/(2n)}$, the band $\big[F_n(x)-\varepsilon_n,\;F_n(x)+\varepsilon_n\big]$ contains the whole curve $F$ with probability at least $1-\alpha$: a nonparametric confidence band valid at every sample size. (The constant 2 in front, due to Massart, is the best possible.)`,
      idea: String.raw`It is a quantitative Glivenko–Cantelli theorem (1.5). For continuous $F$ the problem reduces to uniforms, and $\sqrt n(F_n-F)$ behaves like a Brownian bridge whose supremum has tail $2e^{-2\lambda^2}-2e^{-8\lambda^2}+\dots$; the work is to show that the leading term bounds the tail exactly at every finite $n$, not just in the limit. Discrete or mixed $F$ only make the supremum smaller, since $F_n-F$ is then probed at fewer points.`,
      caption: String.raw`Left: the last sample's $F_n$ with the DKW band; the true $F$ is green while it stays inside and red when it escapes (red dot). Right: $\sqrt n\,D_n$ over all repeats; repeats beyond the orange line $\sqrt n\,\varepsilon_n$ are exactly the misses, and the green curve is the Kolmogorov limit. The miss rate stays below $\alpha$ for every population and every $n$, even $n=2$. Make the sample *dependent* and the guarantee collapses.`,
      deps: ['stat-1.5'],
      refs: ['Wasserman §7.1'],
      tags: ['confidence band', 'concentration'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dvoretzky%E2%80%93Kiefer%E2%80%93Wolfowitz_inequality' },
      viz(v) {
        const M = v.M, Phi = PhiFast(M);
        const popSel = v.select('population', popOpts(['normal', 'expo', 'cauchy', 'poisson']), 'expo');
        const dep = v.select('sampling', [{ value: 'iid', label: 'i.i.d.' }, { value: 'dep', label: 'dependent (shared shock)' }], 'iid');
        const nS = v.slider('sample size $n$', 2, 500, 30, { int: true, log: true });
        const aS = v.slider('$\\alpha$', 0.01, 0.3, 0.05, { step: 0.01 });
        const sL = v.stage({ x: [-3, 3], y: [-0.04, 1.04], height: 300, axes: 'box', title: 'last sample: $F_n \\pm \\varepsilon_n$' });
        const sR = v.stage({ x: [0, 2.6], y: [0, 2], height: 300, axes: 'box', title: '$\\sqrt n\\,D_n$ over all repeats' });
        const R = repeater(v, {
          key: () => [popSel.value, dep.value, nS.value].join('|'),
          sample: (r) => {
            const P = pop(M, popSel.value), n = nS.value, xs = new Array(n), a = Math.SQRT1_2;
            if (dep.value === 'iid') for (let i = 0; i < n; i++) xs[i] = P.draw(r);
            else { const z = r.normal(); for (let i = 0; i < n; i++) { const w = a * z + a * r.normal(); xs[i] = P.key === 'normal' ? w : P.q(clamp(Phi(w), 1e-12, 1 - 1e-12)); } }
            return sortNum(xs);
          },
          stat: (s) => ksAny(s, pop(M, popSel.value)), init: 1000,
        });
        const eps = () => Math.sqrt(Math.log(2 / aS.value) / (2 * nS.value));
        v.render(() => {
          const S = R.sync(), P = pop(M, popSel.value), [lo, hi] = P.view, e = eps(), n = nS.value;
          viewPad(sL, [lo, hi], [-0.04, 1.04]);
          if (S.last) {
            const pts = ecdfPts(S.last, lo, hi);
            sL.poly(pts.map(([x, y]) => [x, Math.min(1, y + e)]).concat(pts.map(([x, y]) => [x, Math.max(0, y - e)]).reverse()), { fill: 'accent', fillAlpha: 0.16, stroke: false });
            sL.path(pts, { color: 'accent', width: 2 });
            const g = gapInfo(S.last, P), miss = g.D > e, col = miss ? 'red' : 'green';
            if (P.discrete) sL.path(stepCdf(P.cdf, lo, hi), { color: col, width: 2.4 }); else sL.fn(P.cdf, { color: col, width: 2.4, n: 400 });
            if (miss) { sL.dot(g.x, g.a, { r: 6, color: 'red' }); sL.corner('F escapes the band', 'br', { color: 'red', weight: 600 }); }
            else sL.corner('F stays inside the band', 'br', { color: 'green', weight: 600 });
          }
          const lam = Math.sqrt(n) * e, nb = 52, B = binned(S.vals, 0, 2.6, nb, (d) => Math.sqrt(n) * d);
          const inB = { edges: B.edges, density: B.density.map((d, i) => (B.edges[i] < lam - 1e-12 ? d : 0)) }, outB = { edges: B.edges, density: B.density.map((d, i) => (B.edges[i] >= lam - 1e-12 ? d : 0)) };
          viewPad(sR, [0, 2.6], [0, Math.max(B.max, 1.8) * 1.12]);
          sR.hist(inB, { density: true, color: 'accent', fillAlpha: 0.32 });
          sR.hist(outB, { density: true, color: 'red', fillAlpha: 0.4 });
          sR.fn(kolPdf, { domain: [0.12, 2.6], color: 'green', width: 2, n: 300 });
          sR.vline(lam, { color: 'orange', width: 2 });
          sR.tex('\\sqrt n\\,\\varepsilon_n', lam, Math.max(B.max, 1.8) * 1.04, { color: 'orange', align: 'left', dx: 5, size: 14 });
          v.legend([['accent', '$F_n$ and its band', { area: true }], ['green', 'true $F$ (inside) · Kolmogorov limit'], ['red', 'misses'], ['orange', 'band half-width × $\\sqrt n$']]);
        });
        v.readout(() => {
          const S = R.sync(), e = eps(), N = S.vals.length, k = S.vals.filter((d) => d > e).length, lam = Math.sqrt(nS.value) * e;
          if (!N) return 'Press Draw to start.';
          const rate = k / N, ok = rate <= aS.value + 2 * Math.sqrt(aS.value * (1 - aS.value) / N);
          return String.raw`$\varepsilon_n = \sqrt{\log(2/\alpha)/2n} = ${v.fix(e, 4)}$ · the band missed $F$ in **${commas(k)}** of ${commas(N)} repeats = **${pct(rate, 2)}** ${ok ? '≤' : '>'} $\alpha = ${pct(aS.value, 0)}$ ${ok ? '✓' : '✗'} · Kolmogorov limit for continuous $F$: ${pct(kolQ(lam), 2)}` + (dep.value === 'dep' ? ' · the inequality assumes independent observations' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Principle',
      name: 'Plug-in principle for statistical functionals',
      statement: String.raw`A **statistical functional** is a map $T$ from distributions to numbers, such as the mean $T(F)=\int x\,dF(x)$, the median $F^{-1}(\tfrac12)$, the interquartile range $F^{-1}(\tfrac34)-F^{-1}(\tfrac14)$ or a correlation. The **plug-in estimator** of $\theta=T(F)$ is $\hat\theta_n=T(F_n)$: evaluate the same functional on the empirical distribution. For the mean this is $\bar X$, for the median the sample median, for a correlation the sample correlation.`,
      scope: String.raw`Consistent whenever $T$ is continuous with respect to the sup-distance between cdfs at $F$ (quantiles at points where $F$ is strictly increasing) or is a smooth function of moments that exist. It fails when $T(F)$ does not exist (the mean of a Cauchy law) or when $T$ is discontinuous at $F$ (a quantile on a flat stretch of $F$).`,
      idea: String.raw`Glivenko–Cantelli (1.5) says $F_n\to F$ uniformly, so any functional continuous for that distance satisfies $T(F_n)\to T(F)$. Quantiles are continuous wherever $F$ is strictly increasing, and smooth functions of moments converge by the law of large numbers. The principle turns estimation into computation, and it is the idea behind the bootstrap. The mean is *not* continuous in the sup-distance: moving a tiny amount of mass very far changes it arbitrarily, which is why it fails for the Cauchy law, whose mean does not exist.`,
      caption: String.raw`Choose a functional and add points. Left: the functional read off the true cdf (green) and off $F_n$ (blue) — the median where each curve crosses $\tfrac12$, the IQR between $\tfrac14$ and $\tfrac34$, the mean as the balance point that makes the two shaded areas equal; for a correlation, the scatter with the 2σ ellipses of $F$ and $F_n$. Right: $T(F_n)$ as points are added (faint: four other samples), closing in on $T(F)$. Try the mean on Cauchy data.`,
      deps: ['stat-1.4', 'stat-1.5'],
      refs: ['Wasserman §7.2'],
      tags: ['plug-in', 'statistical functional'],
      viz(v) {
        const M = v.M;
        const fnSel = v.select('functional $T$', [{ value: 'mean', label: 'mean' }, { value: 'median', label: 'median' }, { value: 'iqr', label: 'IQR' }, { value: 'corr', label: 'correlation' }], 'median');
        const popSel = v.select('population', popOpts(['normal', 'expo', 'cauchy']), 'expo');
        const rhoS = v.slider('$\\rho$', -0.95, 0.95, 0.6, { step: 0.05 });
        const NMAX = 10000; let n = 40, seed = 1;
        for (const m of [1, 10, 100, 1000]) v.button(`Add ${commas(m)}`, () => { n = Math.min(NMAX, n + m); });
        v.button('Restart', () => { n = 5; seed++; });
        const sL = v.stage({ x: [-3, 3], y: [0, 1], height: 310, axes: 'box' });
        const sR = v.stage({ x: [1, NMAX], y: [0, 1], xlog: true, height: 310, axes: 'box', title: 'the plug-in estimate $T(F_n)$ as $n$ grows' });
        const tL = titler(sL), lg = legender(v);
        const GRID = []; for (let e = 0; e <= 80; e++) { const m = Math.round(Math.pow(NMAX, e / 80)); if (m >= 2 && (!GRID.length || m > GRID[GRID.length - 1])) GRID.push(m); }
        const seqC = new Map();
        const seq = (k) => {
          const isC = fnSel.value === 'corr', key = (isC ? 'c' + rhoS.value : popSel.value) + '|' + (seed * 10 + k);
          if (seqC.has(key)) return seqC.get(key);
          if (seqC.size > 40) seqC.clear();
          const r = v.rng(hashStr(key)), P = pop(M, popSel.value), rho = rhoS.value, c = Math.sqrt(1 - rho * rho);
          const xs = new Float64Array(NMAX), ys = isC ? new Float64Array(NMAX) : null;
          for (let i = 0; i < NMAX; i++) { if (isC) { const z = r.normal(); xs[i] = z; ys[i] = rho * z + c * r.normal(); } else xs[i] = P.draw(r); }
          const out = { key, xs, ys, paths: {} }; seqC.set(key, out); return out;
        };
        const Tsorted = (f, s) => (f === 'median' ? qSorted(s, 0.5) : qSorted(s, 0.75) - qSorted(s, 0.25));
        const corrOf = (xs, ys, m) => { let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; for (let i = 0; i < m; i++) { sx += xs[i]; sy += ys[i]; } const mx = sx / m, my = sy / m; for (let i = 0; i < m; i++) { const a = xs[i] - mx, b = ys[i] - my; sxx += a * a; syy += b * b; sxy += a * b; } return { r: sxy / Math.sqrt(sxx * syy), mx, my, vx: sxx / (m - 1), vy: syy / (m - 1), cxy: sxy / (m - 1) }; };
        const path = (S, f) => {
          if (S.paths[f]) return S.paths[f];
          const out = [];
          if (f === 'mean') { let c = 0, j = 0; for (let i = 0; i < NMAX; i++) { c += S.xs[i]; if (i + 1 === GRID[j]) { out.push([GRID[j], c / (i + 1)]); j++; } } }
          else if (f === 'corr') { for (const m of GRID) if (m >= 3) out.push([m, corrOf(S.xs, S.ys, m).r]); }
          else { let sorted = new Float64Array(0), done = 0; for (const m of GRID) { sorted = mergeSorted(sorted, S.xs.slice(done, m).sort()); done = m; out.push([m, Tsorted(f, sorted)]); } }
          return (S.paths[f] = out);
        };
        const truth = () => { const f = fnSel.value, P = pop(M, popSel.value); return f === 'mean' ? P.mean : f === 'median' ? P.q(0.5) : f === 'iqr' ? P.q(0.75) - P.q(0.25) : rhoS.value; };
        const curC = memo();
        const current = () => curC([fnSel.value, seq(0).key, n].join('|'), () => {
          const S = seq(0), f = fnSel.value;
          if (f === 'corr') { const m = Math.max(n, 3); return { ...corrOf(S.xs, S.ys, m), T: corrOf(S.xs, S.ys, m).r, m }; }
          const sorted = S.xs.slice(0, n).sort();
          return { sorted, T: f === 'mean' ? mean(sorted) : Tsorted(f, sorted), m: n };
        });
        v.render(() => {
          const f = fnSel.value, P = pop(M, popSel.value), T = truth(), C = current(), isC = f === 'corr';
          popSel.el.hidden = isC; rhoS.el.hidden = !isC;
          if (isC) {
            tL(`$n = ${C.m}$ points; 2σ ellipses of $F$ and of $F_n$`);
            viewPad(sL, [-3.8, 3.8], [-3.8, 3.8]);
            const S = seq(0), pts = []; for (let i = 0; i < C.m; i++) pts.push([S.xs[i], S.ys[i]]);
            sL.dots(pts, { r: C.m > 2000 ? 1.2 : C.m > 300 ? 1.8 : 2.8, color: 'gold', alpha: C.m > 300 ? 0.45 : 0.85 });
            const rho = rhoS.value, c = Math.sqrt(1 - rho * rho);
            sL.curve((t) => [2 * Math.cos(t), 2 * (rho * Math.cos(t) + c * Math.sin(t))], 0, 2 * Math.PI, { color: 'green', width: 2.2 });
            const l11 = Math.sqrt(C.vx), l21 = C.cxy / l11, l22 = Math.sqrt(Math.max(0, C.vy - l21 * l21));
            sL.curve((t) => [C.mx + 2 * l11 * Math.cos(t), C.my + 2 * (l21 * Math.cos(t) + l22 * Math.sin(t))], 0, 2 * Math.PI, { color: 'accent', width: 2.2 });
          } else {
            const [lo, hi] = P.view;
            tL(`$T$ read off the true cdf $F$ and off $F_n$ ($n = ${commas(n)}$)`);
            viewPad(sL, [lo, hi], [-0.03, 1.03]);
            const pts = ecdfPts(C.sorted, lo, hi, 1400);
            if (f === 'mean') {
              const xb = C.T, left = [[Math.min(lo, xb), 0]], right = [];
              for (const [x, y] of pts) { if (x <= xb) left.push([Math.max(x, lo - 1), y]); else right.push([Math.min(x, hi + 1), y]); }
              const yAt = pts.filter(([x]) => x <= xb).pop()?.[1] ?? 0;
              left.push([xb, yAt], [xb, 0]);
              sL.poly(left, { fill: 'accent', fillAlpha: 0.2, stroke: false });
              sL.poly([[xb, 1], [xb, yAt], ...right, [hi + 1, 1]], { fill: 'orange', fillAlpha: 0.2, stroke: false });
            }
            sL.fn(P.cdf, { color: 'green', width: 2.2, n: 400 });
            sL.path(pts, { color: 'accent', width: 2 });
            const drop = (x, y, col, dash) => { sL.line(x, 0, x, y, { color: col, width: 2, dash }); sL.dot(x, y, { r: 4, color: col }); };
            if (f === 'median') { sL.hline(0.5, { color: 'faint', dash: [3, 4], width: 1 }); drop(T, 0.5, 'green', [5, 4]); drop(C.T, 0.5, 'accent'); }
            else if (f === 'iqr') {
              const q1 = qSorted(C.sorted, 0.25), q3 = qSorted(C.sorted, 0.75);
              [0.25, 0.75].forEach((y) => sL.hline(y, { color: 'faint', dash: [3, 4], width: 1 }));
              drop(P.q(0.25), 0.25, 'green', [5, 4]); drop(P.q(0.75), 0.75, 'green', [5, 4]); drop(q1, 0.25, 'accent'); drop(q3, 0.75, 'accent');
              sL.interval(P.q(0.25), P.q(0.75), 0.93, { color: 'green', width: 3, r: 3.5 }); sL.interval(q1, q3, 0.86, { color: 'accent', width: 3, r: 3.5 });
            } else { sL.vline(C.T, { color: 'accent', width: 2 }); if (isFinite(T)) sL.vline(T, { color: 'green', width: 2, dash: [5, 4] }); else sL.corner('the Cauchy law has no mean', 'tl', { color: 'red', weight: 600 }); }
          }
          // right panel
          const paths = [0, 1, 2, 3, 4].map((k) => path(seq(k), f)), ctr = isFinite(T) ? T : 0;
          let h = 0.05; for (const p of paths) for (const [m, y] of p) if (m >= 8 && isFinite(y)) h = Math.max(h, Math.abs(y - ctr));
          h = Math.min(h * 1.1, isFinite(T) ? 4 * Math.max(Math.abs(T), 1) : 12);
          viewPad(sR, [1, NMAX], [ctr - h, ctr + h], { xlog: true });
          if (isFinite(T)) sR.hline(T, { color: 'green', width: 2, dash: [6, 4] });
          sR.clip(() => {
            for (let k = 1; k < 5; k++) sR.path(paths[k], { color: 'muted', width: 1.1, alpha: 0.45 });
            sR.path(paths[0].filter(([m]) => m <= Math.max(n, 3)).concat([[C.m, C.T]]), { color: 'accent', width: 2.4 });
          });
          sR.dot(C.m, clamp(C.T, ctr - h, ctr + h), { r: 5, color: 'gold' });
          lg([['green', '$T(F)$ (true)', { dash: true }], ['accent', '$T(F_n)$ (plug-in)'], ['muted', 'other samples'], ...(f === 'mean' && !isC ? [['orange', 'balancing areas', { area: true }]] : [])]);
        });
        v.readout(() => {
          const T = truth(), C = current(), f = fnSel.value;
          const name = { mean: 'mean', median: 'median', iqr: 'interquartile range', corr: 'correlation' }[f];
          if (!isFinite(T)) return String.raw`$T(F)$ does not exist: $\int|x|\,dF = \infty$ for the Cauchy law · plug-in mean at $n = ${commas(C.m)}$: ${v.fix(C.T, 3)} — it never settles, because one huge observation can always move it`;
          return String.raw`${name}: $T(F) = ${v.fix(T, 4)}$ · plug-in $T(F_n) = ${v.fix(C.T, 4)}$ from $n = ${commas(C.m)}$ points · error ${v.fix(C.T - T, 4)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Chi-squared distribution',
      credit: 'Helmert, 1876; Pearson, 1900',
      statement: String.raw`If $Z_1,\dots,Z_k$ are independent standard normal variables, the law of $Q=Z_1^2+\dots+Z_k^2$ is the **chi-squared distribution with $k$ degrees of freedom**, $\chi^2_k$. It is the gamma law with shape $k/2$ and scale 2, with density
$$f_k(q)=\frac{q^{k/2-1}e^{-q/2}}{2^{k/2}\,\Gamma(k/2)},\qquad q>0,$$
mean $k$ and variance $2k$. Independent $\chi^2$ variables add: $\chi^2_j+\chi^2_k\sim\chi^2_{j+k}$.`,
      idea: String.raw`For $k=1$, $P(Z^2\le q)=P(|Z|\le\sqrt q)$; differentiating gives $f_1(q)=q^{-1/2}e^{-q/2}/\sqrt{2\pi}$, a gamma density with shape $\tfrac12$, the constant being $\Gamma(\tfrac12)=\sqrt\pi$ (pma-8.21). Sums of independent gammas with a common scale are gamma with the shapes added (prob-2.1.18), which gives $\chi^2_k$. Geometrically $Q$ is the squared length of a standard normal vector in $\R^k$. The variance $2k$ comes from $E Z^4=3$: summands with different fourth moments give the same mean $k$ but a different spread, so the law is genuinely tied to normality.`,
      caption: String.raw`Each repetition squares and adds $k$ seeded standard normals. Top: the last draw as a bar of segments $Z_i^2$ laid end to end; its total $Q$ is the gold mark. Below: the histogram of $Q$ against the $\chi^2_k$ density, with the mean ± SD of the simulation (blue) and of the theory (green). Change $k$; then swap the summands for uniform or $t_5$ variables with the same variance 1: the mean stays $k$ but the variance is no longer $2k$.`,
      deps: ['pma-8.17', 'pma-8.21', 'prob-2.1.18'],
      refs: ['Casella–Berger §5.3'],
      tags: ['chi-squared', 'normal sampling'],
      viz(v) {
        const M = v.M;
        const kS = v.slider('degrees of freedom $k$', 1, 30, 4, { int: true });
        const zSel = v.select('summands', [{ value: 'normal', label: 'standard normal' }, { value: 'sigma', label: 'normal, $\\sigma=1.3$' }, { value: 'unif', label: 'uniform, var 1' }, { value: 't5', label: '$t_5$, var 1' }], 'normal');
        const sT = v.stage({ x: [0, 10], y: [-1, 1], height: 96, axes: false, full: true, title: 'last draw: $Q = Z_1^2+\\dots+Z_k^2$' });
        const sH = v.stage({ x: [0, 10], y: [0, 1], height: 270, axes: 'box', full: true, title: 'histogram of $Q$ over all draws' });
        const t5 = M.dist.studentT(5), c5 = Math.sqrt(3 / 5);
        const DRAW = { normal: (r) => r.normal(), sigma: (r) => 1.3 * r.normal(), unif: (r) => (r() - 0.5) * Math.sqrt(12), t5: (r) => t5.sample(r) * c5 };
        const R = repeater(v, {
          key: () => [kS.value, zSel.value].join('|'),
          sample: (r) => { const zs = new Array(kS.value); for (let i = 0; i < zs.length; i++) zs[i] = DRAW[zSel.value](r); return zs; },
          stat: (zs) => zs.reduce((s, z) => s + z * z, 0), init: 3000,
        });
        const hc = memo();
        const xmaxOf = (k) => k + 6 * Math.sqrt(2 * k) + 4;
        v.render(() => {
          const S = R.sync(), k = kS.value, xmax = xmaxOf(k), chi = M.dist.chi2(k);
          sT.setView([0, xmax], [-1, 1]);
          sT.line(0, -0.55, xmax, -0.55, { color: 'faint', width: 1 });
          if (S.last) {
            let c = 0; const cols = ['blue', 'teal'];
            S.last.forEach((z, i) => {
              const w = z * z; sT.rect(c, -0.4, c + w, 0.4, { fill: cols[i % 2], fillAlpha: 0.42, color: cols[i % 2], width: 1 });
              if (sT.X(c + w) - sT.X(c) > 30) sT.tex(`Z_{${i + 1}}^2`, c + w / 2, 0, { size: 12, color: 'ink' });
              c += w;
            });
            sT.line(c, -0.75, c, 0.75, { color: 'gold', width: 3 });
            sT.text(`Q = ${v.fix(c, 2)}`, c, 0.62, { dx: 6, color: 'gold', size: 13, math: false, align: 'left' });
          }
          const H = hc(S.id(), () => ({ B: binned(S.vals, 0, xmax, clamp(Math.round(xmax * 3), 60, 160)), m: moments(S.vals) }));
          const pk = k <= 2 ? 0.5 : peakOf(chi.pdf, 0.01, xmax), top = Math.max(H.B.max, pk) * 1.18;
          viewPad(sH, [0, xmax], [0, top]);
          sH.hist(H.B, { density: true, color: 'accent', fillAlpha: 0.33 });
          sH.fn(chi.pdf, { domain: [1e-3, xmax], color: 'green', width: 2.4, n: 500 });
          const bar = (m, sd, y, col) => { sH.line(m - sd, y, m + sd, y, { color: col, width: 3 }); sH.dot(m, y, { r: 4.5, color: col }); };
          bar(k, Math.sqrt(2 * k), top * 0.93, 'green');
          if (H.m.n > 1) bar(H.m.mean, H.m.sd, top * 0.85, 'accent');
          if (S.last) sH.dot(S.vals[S.vals.length - 1], top * 0.025, { r: 5, color: 'gold' });
          v.legend([['accent', 'simulated $Q$ (mean ± SD)', { area: true }], ['green', '$\\chi^2_k$ density (mean $k$ ± $\\sqrt{2k}$)'], ['gold', 'last draw', { dot: true }]]);
        });
        v.readout(() => {
          const S = R.sync(), k = kS.value, m = moments(S.vals);
          if (m.n < 2) return 'Press Draw to start.';
          const D = ksDist(sortNum(S.vals), M.dist.chi2(k).cdf);
          return String.raw`${commas(m.n)} draws · mean ${v.fix(m.mean, 3)} (theory $k = ${k}$) · variance **${v.fix(m.var, 3)}** (theory $2k = ${2 * k}$) · Kolmogorov distance to $\chi^2_{${k}}$: ${v.fix(D, 4)}` + (zSel.value === 'normal' ? '' : ' — the summands are not standard normal, so $Q$ is not $\\chi^2_k$');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Independence of X̄ and S² for normal samples',
      credit: 'Helmert, 1876; Fisher, 1925',
      statement: String.raw`Let $X_1,\dots,X_n$ ($n\ge2$) be a random sample from $N(\mu,\sigma^2)$. Then
(a) $\bar X$ and $S^2$ are independent;
(b) $\bar X\sim N(\mu,\sigma^2/n)$;
(c) $(n-1)S^2/\sigma^2\sim\chi^2_{n-1}$.

Conversely, independence of $\bar X$ and $S^2$ characterizes the normal law: for any other population with finite variance they are dependent (Geary, 1936), and when the third central moment $\mu_3$ exists, $\operatorname{Cov}(\bar X,S^2)=\mu_3/n$.`,
      idea: String.raw`Rotate the coordinates of $\R^n$ by an orthogonal matrix whose first row is $(1,\dots,1)/\sqrt n$ (Helmert's matrix). A standard normal vector is rotation invariant, since orthogonal maps preserve Lebesgue measure (rca-2.23) and the density depends only on $|x|$, so the new coordinates $Y_1,\dots,Y_n$ are again i.i.d. normal. But $Y_1=\sqrt n\,\bar X$ and $Y_2^2+\dots+Y_n^2=\sum(X_i-\bar X)^2$: the mean lives in one coordinate and the spread in the other $n-1$, which gives independence and the $\chi^2_{n-1}$ law (1.8). No such rotation trick exists for any other population.`,
      caption: String.raw`One dot per sample, at $(\bar X, S^2)$; the blue line joins the average $S^2$ within ten slices of $\bar X$. For normal data the line is flat and the cloud patternless, and $(n-1)S^2/\sigma^2$ matches $\chi^2_{n-1}$ (right). Switch to skewed data: $S^2$ rises with $\bar X$ (covariance $\mu_3/n$). Uniform and bimodal data are symmetric, so the correlation is zero, yet the cloud is visibly shaped by $|\bar X-\mu|$: uncorrelated is not independent.`,
      deps: ['stat-1.3', 'stat-1.8', 'rca-2.23'],
      refs: ['Casella–Berger §5.3'],
      tags: ['normal sampling', 'independence'],
      viz(v) {
        const M = v.M;
        const popSel = v.select('population', popOpts(['normal', 'uniform', 'expo', 'bimodal']), 'normal');
        const nS = v.slider('sample size $n$', 2, 30, 5, { int: true });
        const sL = v.stage({ x: [-2, 2], y: [0, 3], height: 310, axes: 'box', weight: 1.2, title: 'one dot per sample: $(\\bar X,\\,S^2)$' });
        const sR = v.stage({ x: [0, 10], y: [0, 1], height: 310, axes: 'box', title: '$(n-1)S^2/\\sigma^2$ against $\\chi^2_{n-1}$' });
        const R = repeater(v, {
          key: () => [popSel.value, nS.value].join('|'),
          sample: (r) => { const P = pop(M, popSel.value), xs = new Array(nS.value); for (let i = 0; i < xs.length; i++) xs[i] = P.draw(r); return xs; },
          stat: (xs) => [mean(xs), moments(xs).var], init: 2500,
        });
        const sc = memo();
        const summary = () => { const S = R.sync(); return sc(S.id(), () => {
          const V = S.vals, N = V.length, P = pop(M, popSel.value);
          if (N < 20) return { N, bins: [], r: NaN, rAbs: NaN, y99: 2 * P.var };
          const ord = V.map((a) => a).sort((a, b) => a[0] - b[0]), bins = [];
          for (let b = 0; b < 10; b++) { const sl = ord.slice(Math.floor((b * N) / 10), Math.floor(((b + 1) * N) / 10)); bins.push([mean(sl.map((a) => a[0])), mean(sl.map((a) => a[1]))]); }
          const cor = (f, g) => { const a = moments(V, f), b = moments(V, g); let c = 0; for (const p of V) c += (f(p) - a.mean) * (g(p) - b.mean); return c / (N - 1) / (a.sd * b.sd); };
          const s2 = sortNum(V.map((a) => a[1]));
          return { N, bins, r: cor((p) => p[0], (p) => p[1]), rAbs: cor((p) => Math.abs(p[0] - P.mean), (p) => p[1]), y99: qSorted(s2, 0.995) };
        }); };
        v.render(() => {
          const S = R.sync(), P = pop(M, popSel.value), n = nS.value, Sm = summary(), w = (4 * P.sd) / Math.sqrt(n);
          viewPad(sL, [P.mean - w, P.mean + w], [0, Math.max(Sm.y99 * 1.08, 0.2 * P.var)]);
          const V = S.vals, from = Math.max(0, V.length - 5000), pts = [];
          for (let i = from; i < V.length; i++) pts.push(V[i]);
          sL.dots(pts, { r: 1.7, color: 'gold', alpha: 0.42 });
          sL.hline(P.var, { color: 'green', dash: [6, 4], width: 1.5 });
          sL.text('σ²', P.mean + w, P.var, { align: 'right', dx: -6, dy: -10, color: 'green', size: 13 });
          if (Sm.bins.length) { sL.path(Sm.bins, { color: 'accent', width: 2.6 }); sL.dots(Sm.bins, { r: 4, color: 'accent' }); }
          if (S.last) sL.dot(mean(S.last), moments(S.last).var, { r: 5, color: 'orange' });
          const k = n - 1, xmax = k + 5 * Math.sqrt(2 * k) + 3, chi = M.dist.chi2(k);
          const B = binned(V, 0, xmax, 70, (a) => (k * a[1]) / P.var), pk = k <= 2 ? 0.5 : peakOf(chi.pdf, 0.01, xmax);
          viewPad(sR, [0, xmax], [0, Math.max(B.max, pk) * 1.15]);
          sR.hist(B, { density: true, color: 'accent', fillAlpha: 0.33 });
          sR.fn(chi.pdf, { domain: [1e-3, xmax], color: 'green', width: 2.3, n: 400 });
          v.legend([['gold', 'samples', { dot: true }], ['accent', 'mean of $S^2$ within slices of $\\bar X$'], ['green', '$\\sigma^2$ · $\\chi^2_{n-1}$ density'], ['orange', 'last sample', { dot: true }]]);
        });
        v.readout(() => {
          const S = R.sync(), P = pop(M, popSel.value), n = nS.value, Sm = summary();
          if (Sm.N < 20) return 'Draw more samples (at least 20).';
          const varS2 = (P.mu4 - ((n - 3) / (n - 1)) * P.var * P.var) / n, rTh = P.mu3 / n / Math.sqrt((P.var / n) * varS2);
          const D = ksDist(sortNum(S.vals.map((a) => ((n - 1) * a[1]) / P.var)), M.dist.chi2(n - 1).cdf);
          return String.raw`${commas(Sm.N)} samples · corr$(\bar X, S^2)$ = **${v.fix(Sm.r, 3)}** (theory ${v.fix(rTh, 3)}, from $\operatorname{Cov} = \mu_3/n$) · corr$(|\bar X-\mu|, S^2)$ = **${v.fix(Sm.rAbs, 3)}** · Kolmogorov distance of $(n-1)S^2/\sigma^2$ to $\chi^2_{${n - 1}}$: ${v.fix(D, 4)}` + (P.key === 'normal' ? ' · both correlations vanish: independence' : ' · not normal: $\\bar X$ and $S^2$ are dependent');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Definition',
      name: 'Student’s t distribution',
      credit: 'Gosset (“Student”), 1908; Fisher, 1925',
      statement: String.raw`If $Z\sim N(0,1)$ and $V\sim\chi^2_\nu$ are independent, the law of $T=Z/\sqrt{V/\nu}$ is **Student's t distribution with $\nu$ degrees of freedom**, with density
$$f_\nu(t)=\frac{\Gamma\big(\frac{\nu+1}2\big)}{\sqrt{\nu\pi}\,\Gamma\big(\frac\nu2\big)}\Big(1+\frac{t^2}{\nu}\Big)^{-(\nu+1)/2},\qquad t\in\R .$$
It is symmetric with polynomial tails ($t_1$ is the Cauchy law), has finite moments only of order $<\nu$, and tends to $N(0,1)$ as $\nu\to\infty$. By 1.9, for a normal random sample the **studentized mean** satisfies
$$\frac{\bar X-\mu}{S/\sqrt n}\sim t_{n-1}.$$`,
      idea: String.raw`By 1.9, $\sqrt n(\bar X-\mu)/\sigma\sim N(0,1)$ and $(n-1)S^2/\sigma^2\sim\chi^2_{n-1}$ are independent, and the unknown $\sigma$ cancels in their ratio. The density follows by integrating out $V$ in the joint density; the beta integral (pma-8.20) produces the constant. Replacing $\sigma$ by the random $S$ adds variability, most visibly in the tails: an unluckily small $S$ makes $T$ large, which is why intervals built from normal quantiles undercover for small $n$.`,
      caption: String.raw`Each repetition studentizes a sample: $T=(\bar X-\mu)/(S/\sqrt n)$. Left: its histogram against $t_{n-1}$ (green) and $N(0,1)$ (orange dashed). Right: the two-sided tail $P(|T|>x)$ on a log scale, where the difference is unmistakable at $n=3$ and gone by $n=30$. The readout shows what it costs: the interval $\bar X\pm1.96\,S/\sqrt n$ covers $\mu$ far less than 95% of the time at small $n$. Skewed data break the exactness.`,
      deps: ['stat-1.9', 'pma-8.20'],
      refs: ['Casella–Berger §5.3'],
      tags: ['t distribution', 'normal sampling'],
      links: { wikipedia: "https://en.wikipedia.org/wiki/Student%27s_t-distribution" },
      viz(v) {
        const M = v.M;
        const nS = v.slider('sample size $n$', 2, 40, 3, { int: true });
        const popSel = v.select('population', popOpts(['normal', 'uniform', 'expo', 't3']), 'normal');
        const sL = v.stage({ x: [-6, 6], y: [0, 0.45], height: 300, axes: 'box', title: 'histogram of $T=(\\bar X-\\mu)/(S/\\sqrt n)$' });
        const sR = v.stage({ x: [0, 10], y: [1e-4, 1.2], ylog: true, height: 300, axes: 'box', title: 'tail $P(|T|>x)$, log scale' });
        const R = repeater(v, {
          key: () => [nS.value, popSel.value].join('|'),
          sample: (r) => { const P = pop(M, popSel.value), xs = new Array(nS.value); for (let i = 0; i < xs.length; i++) xs[i] = P.draw(r); return xs; },
          stat: (xs) => { const m = moments(xs), P = pop(M, popSel.value); return (m.mean - P.mean) / (m.sd / Math.sqrt(xs.length)); },
          init: 4000,
        });
        const sc = memo();
        const sumy = () => { const S = R.sync(); return sc(S.id(), () => { const a = sortNum(S.vals.map(Math.abs)), s = sortNum(S.vals); return { a, s, B: binned(S.vals, -6, 6, 96) }; }); };
        v.render(() => {
          const n = nS.value, td = M.dist.studentT(n - 1), N01 = M.dist.normal(0, 1), Y = sumy();
          viewPad(sR, [0, 10], [1e-4, 1.2], { ylog: true });
          viewPad(sL, [-6, 6], [0, Math.max(0.42, Y.B.max) * 1.12]);
          sL.hist(Y.B, { density: true, color: 'accent', fillAlpha: 0.33 });
          sL.fn(N01.pdf, { color: 'orange', width: 2, dash: [6, 4], n: 300 });
          sL.fn(td.pdf, { color: 'green', width: 2.4, n: 400 });
          const N = Y.a.length, emp = [];
          if (N) for (let i = 0; i <= 300; i++) { const x = (10 * i) / 300; let a = 0, b = N; while (a < b) { const m = (a + b) >> 1; if (Y.a[m] <= x) a = m + 1; else b = m; } const p = (N - a) / N; emp.push(p > 0 ? [x, p] : null); }
          sR.path(emp, { color: 'accent', width: 2.4 });
          sR.fn((x) => 2 * (1 - td.cdf(x)), { color: 'green', width: 2, n: 300 });
          sR.fn((x) => M.erfc(x / Math.SQRT2), { color: 'orange', width: 2, dash: [6, 4], n: 300 });
          sR.hline(1 / Math.max(N, 1), { color: 'faint', dash: [2, 4], width: 1 });
          sR.text('resolution 1/N', 9.8, 1 / Math.max(N, 1), { align: 'right', dy: -8, color: 'muted', size: 11, math: false });
          v.legend([['accent', 'simulated $T$'], ['green', `$t_{n-1}$`], ['orange', '$N(0,1)$', { dash: true }]]);
        });
        v.readout(() => {
          const n = nS.value, Y = sumy(), N = Y.a.length; if (!N) return 'Press Draw to start.';
          const tq = M.dist.studentT(n - 1).quantile(0.975), cov = (c) => { let a = 0, b = N; while (a < b) { const m = (a + b) >> 1; if (Y.a[m] <= c) a = m + 1; else b = m; } return a / N; };
          return String.raw`${commas(N)} samples · coverage of $\bar X \pm 1.96\,S/\sqrt n$: **${pct(cov(1.959964))}** · of $\bar X \pm t_{${n - 1},\,0.975}\,S/\sqrt n$ with $t_{${n - 1},\,0.975} = ${v.fix(tq, 3)}$: **${pct(cov(tq))}** (target 95%) · Kolmogorov distance to $t_{${n - 1}}$: ${v.fix(ksDist(Y.s, M.dist.studentT(n - 1).cdf), 4)}, to $N(0,1)$: ${v.fix(ksDist(Y.s, M.dist.normal(0, 1).cdf), 4)}`;
        });
      },
    },
  ],
};
