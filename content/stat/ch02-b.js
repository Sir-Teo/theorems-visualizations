// Statistical Inference — Chapter 2: Sufficiency and the likelihood principle (items 2.7–2.12; header and 2.1–2.6 in ch02.js)
import {
  SQ2PI, phi, clamp, commas, pct, hashStr, memo, mean, moments, corr, qSorted, sortNum, binned, ks2, ksPval, chi2Indep, fmtP,
  viewPad, axisLabels, legender, titler, repeater, lfact,
} from './ch02.shared.js';

/** Step outline of a binned histogram, for a dashed reference curve. */
const stepPts = (B) => { const p = [[B.edges[0], 0]]; B.density.forEach((d, i) => { p.push([B.edges[i], d], [B.edges[i + 1], d]); }); p.push([B.edges[B.edges.length - 1], 0]); return p; };
const Phi = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);

export default {
  collection: 'stat',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Ancillary statistic',
      credit: 'Fisher, 1925 and 1934',
      statement: String.raw`A statistic $A(X)$ is **ancillary** for $\theta$ if its distribution is the same for every $\theta\in\Theta$. Typical cases:

- In a location family, $X_i=\mu+Z_i$ with $Z_1,\dots,Z_n$ i.i.d. from a fixed law, every function of the differences $X_i-X_j$ is ancillary: the range $R=X_{(n)}-X_{(1)}$, the residuals $X_i-\bar X$, the configuration $(X_{(1)}-X_{(n)},\dots)$.
- In a scale family, $X_i=\sigma Z_i$, every function of the ratios $X_i/X_j$ is ancillary: $X_1/X_2$, $R/S$; in a location–scale family, functions of $(X_i-\bar X)/S$.

An ancillary statistic says nothing about $\theta$ by itself, yet it can matter jointly with others: in $U(\theta,\theta+1)$ the range is ancillary while (midrange, range) is minimal sufficient, and the range tells how precisely the midrange locates $\theta$.`,
      idea: String.raw`Ancillarity is invariance in disguise: shifting every observation by $\mu$ does not change their differences, so $R(\mu+Z)=R(Z)$, whose law involves only the fixed law of $Z$ (1.18). Fisher (1925, 1934) argued that inference should be conditional on an ancillary because it describes the precision of the experiment actually performed, the idea behind the conditionality principle (2.12). Basu's theorem (2.10) shows that an ancillary is independent of any complete sufficient statistic.`,
      caption: String.raw`Top: the law of $X$ for the current location $\mu$ (or scale $\sigma$), against the reference $\mu=0$ ($\sigma=1$) dashed, with the last sample of 4,000 drawn. Bottom: histograms over those samples of the sample mean (left) and of a candidate ancillary (right), with the reference histogram dashed. Drag $\mu$: the mean slides, the range does not move, as the two-sample Kolmogorov–Smirnov readout confirms. Switch to a **scale** family: now the range stretches with $\sigma$, and only the ratio $R/S$ stays put. The law of $Z$ is irrelevant; even Cauchy data behave.`,
      deps: ['stat-1.18', 'stat-2.2'],
      refs: ['Casella–Berger §6.2'],
      tags: ['ancillary', 'invariance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ancillary_statistic' },
      viz(v) {
        const M = v.M;
        const famS = v.select('family', [{ value: 'loc', label: 'location: $X=\\mu+Z$' }, { value: 'scale', label: 'scale: $X=\\sigma Z$' }], 'loc');
        const popS = v.select('law of $Z$', [{ value: 'normal', label: 'normal' }, { value: 'cauchy', label: 'Cauchy' }, { value: 'unif', label: 'uniform' }, { value: 'expo', label: 'exponential' }], 'normal');
        const stS = v.select('candidate ancillary', [{ value: 'range', label: 'range $R$' }, { value: 'ratio', label: 'ratio $R/S$' }, { value: 'dev', label: '$X_1-\\bar X$' }], 'range');
        const muS = v.slider('location $\\mu$', -3, 3, 1.6, { step: 0.05 });
        const sgS = v.slider('scale $\\sigma$', 0.4, 2.5, 1.8, { step: 0.05 });
        const nS = v.slider('sample size $n$', 2, 20, 5, { int: true });
        const sT = v.stage({ x: [-6, 6], y: [0, 1], height: 150, axes: 'box', full: true });
        const sA = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: 'box', weight: 1, title: 'sample mean $\\bar X$' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: 'box', weight: 1 });
        const tT = titler(sT), tB = titler(sB), lg = legender(v);
        const Z = {
          normal: { draw: (r) => r.normal(), pdf: phi },
          cauchy: { draw: (r) => Math.tan(Math.PI * (r() - 0.5)), pdf: (z) => 1 / (Math.PI * (1 + z * z)) },
          unif: { draw: (r) => 2 * r() - 1, pdf: (z) => (Math.abs(z) <= 1 ? 0.5 : 0) },
          expo: { draw: (r) => -Math.log(1 - r()), pdf: (z) => (z >= 0 ? Math.exp(-z) : 0) },
        };
        const stat = (xs) => {
          let lo = Infinity, hi = -Infinity, s = 0; for (const x of xs) { lo = Math.min(lo, x); hi = Math.max(hi, x); s += x; }
          const m = s / xs.length; let ss = 0; for (const x of xs) ss += (x - m) ** 2; const sd = Math.sqrt(ss / (xs.length - 1));
          return { mean: m, range: hi - lo, ratio: (hi - lo) / sd, dev: xs[0] - m };
        };
        const cache = new Map();
        const sim = (fam, pop, n, par) => {
          const k = [fam, pop, n, par.toFixed(2)].join('|'); if (cache.has(k)) return cache.get(k);
          const r = v.rng(hashStr('anc|' + k)), N = 4000, out = { mean: new Float64Array(N), range: new Float64Array(N), ratio: new Float64Array(N), dev: new Float64Array(N), last: null };
          const xs = new Array(n);
          for (let i = 0; i < N; i++) { for (let j = 0; j < n; j++) { const z = Z[pop].draw(r); xs[j] = fam === 'loc' ? par + z : par * z; } const st = stat(xs); out.mean[i] = st.mean; out.range[i] = st.range; out.ratio[i] = st.ratio; out.dev[i] = st.dev; }
          out.last = xs.slice();
          if (cache.size > 30) cache.clear(); cache.set(k, out); return out;
        };
        const win = (a, b) => { const sa = sortNum(a), sb = sortNum(b); const lo = Math.min(qSorted(sa, 0.01), qSorted(sb, 0.01)), hi = Math.max(qSorted(sa, 0.99), qSorted(sb, 0.99)), p = 0.06 * (hi - lo); return [lo - p, hi + p]; };
        let info = null;
        v.render(() => {
          const fam = famS.value, pop = popS.value, n = nS.value, st = stS.value, par = fam === 'loc' ? muS.value : sgS.value, ref = fam === 'loc' ? 0 : 1;
          muS.el.hidden = fam !== 'loc'; sgS.el.hidden = fam === 'loc';
          const C = sim(fam, pop, n, par), R = sim(fam, pop, n, ref);
          // top: the law of X now and at the reference
          const f = (x, p) => (fam === 'loc' ? Z[pop].pdf(x - p) : Z[pop].pdf(x / p) / p);
          let pk = 0; for (let i = 0; i <= 400; i++) { const x = -6 + (12 * i) / 400; pk = Math.max(pk, f(x, par), f(x, ref)); }
          viewPad(sT, [-6, 6], [0, pk * 1.25], { left: 12 }); sT.setTicks(undefined, []);
          sT.fn((x) => f(x, ref), { color: 'muted', width: 1.6, dash: [6, 4], n: 500 });
          sT.fn((x) => f(x, par), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.13, n: 500 });
          const L = C.last, lo = Math.min(...L), hi = Math.max(...L), yb = pk * 1.1;
          for (const x of L) if (x > -6 && x < 6) sT.dot(x, pk * 0.06, { r: 4, color: 'gold' });
          if (lo > -6 && hi < 6) { sT.line(lo, yb, hi, yb, { color: 'orange', width: 2.4 }); sT.line(lo, yb * 0.95, lo, yb * 1.05, { color: 'orange', width: 2 }); sT.line(hi, yb * 0.95, hi, yb * 1.05, { color: 'orange', width: 2 }); sT.text(`R = ${v.fix(hi - lo, 2)}`, (lo + hi) / 2, yb, { dy: -10, align: 'center', color: 'orange', size: 12, weight: 600 }); }
          tT(fam === 'loc' ? `law of $X=\\mu+Z$ at $\\mu=${v.fix(par, 2)}$ (dashed: $\\mu=0$) and the last sample` : `law of $X=\\sigma Z$ at $\\sigma=${v.fix(par, 2)}$ (dashed: $\\sigma=1$) and the last sample`);
          // bottom: the mean and the candidate
          const panel = (s, a, b, col) => {
            const w = win(a, b), Ba = binned(a, w[0], w[1], 40), Bb = binned(b, w[0], w[1], 40);
            viewPad(s, w, [0, Math.max(Ba.max, Bb.max) * 1.18], { left: 36 });
            s.hist(Ba, { density: true, color: col, fillAlpha: 0.32 });
            s.path(stepPts(Bb), { color: 'ink', width: 1.6, dash: [5, 4], alpha: 0.75 });
            const D = ks2(sortNum(a), sortNum(b)); return { D, p: ksPval(D, (a.length * b.length) / (a.length + b.length)) };
          };
          const km = panel(sA, C.mean, R.mean, 'accent'), kc = panel(sB, C[st], R[st], 'orange');
          tB({ range: 'candidate: range $R=X_{(n)}-X_{(1)}$', ratio: 'candidate: $R/S$', dev: 'candidate: $X_1-\\bar X$' }[st]);
          sA.corner(km.p < 0.001 ? 'moves with the parameter' : 'no detectable change', 'tr', { color: km.p < 0.001 ? 'red' : 'green', weight: 600 });
          sB.corner(kc.p < 0.001 ? 'moves with the parameter' : 'does not move', 'tr', { color: kc.p < 0.001 ? 'red' : 'green', weight: 600 });
          lg([['accent', 'law of $X$ · histogram of $\\bar X$', { area: true }], ['orange', 'histogram of the candidate', { area: true }], ['ink', 'at the reference parameter', { dash: true }], ['gold', 'last sample', { dot: true }]]);
          info = { km, kc, fam, st, par, n };
        });
        v.readout(() => {
          if (!info) return '';
          const { km, kc, fam, st } = info, nm = { range: 'range $R$', ratio: '$R/S$', dev: '$X_1-\\bar X$' }[st];
          const anc = (fam === 'loc') || st === 'ratio';
          return String.raw`4,000 samples at the current and at the reference ${fam === 'loc' ? 'location' : 'scale'} · two-sample Kolmogorov–Smirnov distance for $\bar X$: **${v.fix(km.D, 3)}** (p ${fmtP(km.p)}) · for the ${nm}: **${v.fix(kc.D, 3)}** (p ${fmtP(kc.p)}) — ` + (kc.p < 0.001 ? `the ${nm} changes with the parameter: **not ancillary** in a ${fam === 'loc' ? 'location' : 'scale'} family` : `no change beyond Monte Carlo noise: the ${nm} is **ancillary**` + (anc ? '' : ' at this setting'));
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Complete statistic',
      credit: 'Lehmann & Scheffé, 1950',
      statement: String.raw`A statistic $T$ (more precisely, its family of distributions $\{P^T_\theta:\theta\in\Theta\}$) is **complete** if for every measurable function $g$,
$$E_\theta\,g(T)=0\ \text{ for all }\theta\in\Theta\quad\Longrightarrow\quad P_\theta\big(g(T)=0\big)=1\ \text{ for all }\theta.$$
It is **boundedly complete** if this holds for bounded $g$. No non-trivial function of a complete statistic is an unbiased estimator of zero; consequently an unbiased estimator that is a function of a complete sufficient statistic is unique (the Lehmann–Scheffé theorem of ch. 4).

Example: $T\sim\text{Bin}(n,p)$, $0<p<1$, is complete, since $E_pg(T)=(1-p)^n\sum_t g(t)\binom nt r^t$ with $r=p/(1-p)$ ranging over $(0,\infty)$, and a polynomial vanishing on an interval has all coefficients zero. Non-examples: $(X_1,X_2)$ for two Bernoulli trials ($g=X_1-X_2$); any statistic containing a non-constant ancillary component $A$ ($g=\varphi(A)-E\varphi(A)$).`,
      idea: String.raw`Completeness says the linear map $g\mapsto\big(\theta\mapsto E_\theta g(T)\big)$ is one-to-one: the family of distributions is rich enough to detect every non-zero $g$. For a finite sample space this is a matrix with one column per value of $T$ and one row per $\theta$, and completeness means its columns are linearly independent. For the binomial the columns are the Bernstein polynomials $\binom nt p^t(1-p)^{n-t}$, which are independent; keeping two tosses apart duplicates the column $p(1-p)$, and an ancillary component makes some combination of columns constant, which is then cancelled by subtracting its mean.`,
      caption: String.raw`Left: the values $g(t)$ of a function on the possible values of $T$; drag the bar tops. Right: $p\mapsto E_pg(T)$ computed exactly (blue) and by simulating 4,000 values of $T$ at five values of $p$ (gold, ±2 SE). Press **find a zero-mean $g$**: it computes the null space of the matrix $\big(P_p(T=t)\big)$. For the binomial count there is none, and the flattest $g$ of unit size still leaves a visibly non-zero curve (the panel zooms in); for $(X_1,X_2)$ kept apart, or for a count with a random sample size $N$, a non-zero $g$ with $E_pg(T)\equiv0$ appears.`,
      deps: ['stat-2.2'],
      refs: ['Casella–Berger §6.2'],
      tags: ['completeness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Completeness_(statistics)' },
      viz(v) {
        const M = v.M;
        const C5 = [1, 5, 10, 10, 5, 1];
        const MODES = {
          bin: { labels: ['0', '1', '2', '3', '4', '5'], pmf: (p) => C5.map((c, t) => c * Math.pow(p, t) * Math.pow(1 - p, 5 - t)), draw: (r, p) => { let t = 0; for (let i = 0; i < 5; i++) if (r() < p) t++; return t; }, g: [0.9, -0.5, 0.25, 0.6, -0.45, 0.3], title: '$T=X_1+\\dots+X_5\\sim\\mathrm{Bin}(5,p)$' },
          pair: { labels: ['(0,0)', '(0,1)', '(1,0)', '(1,1)'], pmf: (p) => [(1 - p) ** 2, p * (1 - p), p * (1 - p), p * p], draw: (r, p) => (r() < p ? 2 : 0) + (r() < p ? 1 : 0), g: [0.6, -0.4, 0.7, -0.2], title: '$T=(X_1,X_2)$, two tosses kept apart' },
          ns: { labels: ['(1,0)', '(1,1)', '(2,0)', '(2,1)', '(2,2)'], pmf: (p) => [0.5 * (1 - p), 0.5 * p, 0.5 * (1 - p) ** 2, p * (1 - p), 0.5 * p * p], draw: (r, p) => { if (r() < 0.5) return r() < p ? 1 : 0; const s = (r() < p) + (r() < p); return 2 + s; }, g: [0.3, 0.8, -0.5, 0.2, -0.6], title: '$T=(N,S)$: $N\\in\\{1,2\\}$ by a fair coin, $S\\sim\\mathrm{Bin}(N,p)$' },
        };
        const modS = v.select('statistic', [{ value: 'bin', label: '$\\sum X_i\\sim\\mathrm{Bin}(5,p)$' }, { value: 'pair', label: '$(X_1,X_2)$' }, { value: 'ns', label: '$(N,S)$, random sample size' }], 'bin');
        const sL = v.stage({ x: [0.3, 6.7], y: [-1.25, 1.25], height: 300, axes: 'box', weight: 0.9, title: 'the function $g(t)$ (drag the bar tops)' });
        const sR = v.stage({ x: [0, 1], y: [-1, 1], height: 300, axes: 'box', weight: 1.1 });
        const tL = titler(sL), tR = titler(sR);
        const gs = Object.fromEntries(Object.entries(MODES).map(([k, m]) => [k, m.g.slice()]));
        const hs = Array.from({ length: 6 }, (_, k) => { const h = sL.handle(k + 1, 0, { color: 'accent', r: 7, constrain: (x, y) => [k + 1, clamp(y, -1.2, 1.2)] }); h.onDrag = (hd) => { gs[modS.value][k] = hd.y; msg = ''; }; return h; });
        let msg = '';
        const A = (mode) => { const out = []; for (let i = 0; i <= 48; i++) out.push(MODES[mode].pmf(0.02 + (0.96 * i) / 48)); return out; };
        const svdc = memo();
        const svdOf = (mode) => svdc(mode, () => { const S = M.svd(A(mode)), K = S.S.length; return { smin: S.S[K - 1], smax: S.S[0], vmin: S.V.map((row) => row[K - 1]) }; });
        v.button('find a zero-mean $g$', () => {
          const mode = modS.value, d = svdOf(mode), mx = Math.max(...d.vmin.map(Math.abs));
          gs[mode] = d.vmin.map((u) => u / mx);
          msg = d.smin < 1e-9 * d.smax ? 'found' : 'none';
        });
        v.button('random $g$', () => { const r = v.rng(hashStr('g' + Math.random())); gs[modS.value] = gs[modS.value].map(() => 2 * r() - 1); msg = ''; });
        const PS = [0.1, 0.3, 0.5, 0.7, 0.9];
        const mc = memo();
        const sims = (mode) => mc(mode, () => PS.map((p) => { const r = v.rng(hashStr('cmp|' + mode + p)), cnt = new Array(MODES[mode].labels.length).fill(0); for (let i = 0; i < 4000; i++) cnt[MODES[mode].draw(r, p)]++; return cnt; }));
        let info = null;
        v.render(() => {
          const mode = modS.value, Md = MODES[mode], g = gs[mode], K = g.length;
          hs.forEach((h, k) => { h.visible = k < K; if (k < K && !h.dragging) h.set(k + 1, g[k]); });
          viewPad(sL, [0.3, K + 0.7], [-1.25, 1.25], { left: 34, bottom: 22 });
          sL.setTicks(Md.labels.map((l, k) => [k + 1, l]), undefined);
          sL.hline(0, { color: 'muted', width: 1.2 });
          g.forEach((u, k) => sL.rect(k + 1 - 0.3, 0, k + 1 + 0.3, u, { fill: u >= 0 ? 'accent' : 'orange', fillAlpha: 0.45, color: u >= 0 ? 'accent' : 'orange', width: 1.2 }));
          tL(`$g(t)$ on the values of $T=${{ bin: '\\sum X_i', pair: '(X_1,X_2)', ns: '(N,S)' }[mode]}$ (drag the bars)`);
          // right: E_p g(T)
          const Eg = (p) => Md.pmf(p).reduce((s, w, t) => s + w * g[t], 0);
          let sup = 0; for (let i = 0; i <= 400; i++) sup = Math.max(sup, Math.abs(Eg(i / 400)));
          const S = sims(mode), mcPts = S.map((cnt, i) => { const N = cnt.reduce((a, b) => a + b, 0), m = cnt.reduce((s, c, t) => s + c * g[t], 0) / N, m2 = cnt.reduce((s, c, t) => s + c * g[t] * g[t], 0) / N; return [PS[i], m, 2 * Math.sqrt(Math.max(0, m2 - m * m) / N)]; });
          const ext = Math.max(sup, ...mcPts.map(([, m, e]) => Math.abs(m) + e));
          const yr = Math.max(0.05, ext * 1.3);
          viewPad(sR, [0, 1], [-yr, yr], { left: 46 });
          sR.hline(0, { color: 'muted', width: 1.2 });
          sR.between(Eg, () => 0, 0, 1, { fill: 'accent', fillAlpha: 0.12 });
          sR.fn(Eg, { domain: [0, 1], color: 'accent', width: 2.8 });
          for (const [p, m, e] of mcPts) { sR.line(p, m - e, p, m + e, { color: 'gold', width: 2 }); sR.dot(p, m, { r: 4.5, color: 'gold' }); }
          tR(yr < 0.2 ? `$E_p\\,g(T)$ — zoomed in: the vertical range is only ±${v.fix(yr, 3)}` : '$E_p\\,g(T)$ as a function of $p$');
          axisLabels(sR, 'p', null);
          info = { sup, d: svdOf(mode), mode, gmax: Math.max(...g.map(Math.abs)) };
        });
        v.readout(() => {
          if (!info) return '';
          const { sup, d, mode, gmax } = info, complete = d.smin > 1e-9 * d.smax;
          const head = String.raw`$\sup_p|E_p\,g(T)|=${v.fix(sup, 4)}$ with $\max_t|g(t)|=${v.fix(gmax, 3)}$ · smallest singular value of the matrix $\big(P_p(T=t)\big)$: ${complete ? v.fix(d.smin, 4) : '0 (to rounding)'}`;
          const tail = msg === 'found' ? ' · **found**: a non-zero $g$ whose mean vanishes for every $p$ — $T$ is **not complete**' : msg === 'none' ? ' · **no zero-mean $g$ exists**: the flattest one of unit size still has a non-zero mean curve — $T$ is **complete**' : complete ? ' · the columns are independent: $T$ is complete' : ' · the matrix has a null space: $T$ is not complete (press the button)';
          return head + tail;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Completeness of full-rank exponential families',
      credit: 'Lehmann & Scheffé, 1950–55',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. from a $k$-parameter exponential family $p_\eta(x)=h(x)\exp\big(\eta\cdot T(x)-A(\eta)\big)$, $\eta\in H\subseteq\R^k$. If $H$ contains an open subset of $\R^k$ (the family is of **full rank**), then the sufficient statistic $\sum_iT(X_i)$ is complete, and hence also minimal sufficient.

If instead $\eta$ ranges over a lower-dimensional curve (a **curved** exponential family), completeness can fail. In $N(\mu,c^2\mu^2)$, $\mu\ne0$, the statistic $(\bar X,S^2)$ is still minimal sufficient, but $g=\bar X^2-\big(\tfrac1{c^2}+\tfrac1n\big)S^2$ is a non-zero function with $E_\mu\,g=0$ for every $\mu$, because $E\bar X^2=\mu^2+\sigma^2/n$ and $ES^2=\sigma^2$.`,
      idea: String.raw`Write $E_\eta g(T)=e^{-nA(\eta)}\int g(t)\,e^{\eta\cdot t}\,d\nu(t)$, where $\nu$ is the law of $T$ under the carrier and does not depend on $\eta$. If this vanishes for all $\eta$ in an open set, the Laplace transforms of the measures $g^+d\nu$ and $g^-d\nu$ agree on that set; both are analytic and extend into complex $\eta$, so their Fourier transforms agree, and the uniqueness theorem (rca-9.12) forces $g^+\nu=g^-\nu$, that is $g=0$ $\nu$-almost everywhere. Along a curve the transform is known only on a one-dimensional set, which is too thin to pin down the measure; the counterexample above exhibits the gap.`,
      caption: String.raw`The parameter half-plane of $N(\mu,\sigma^2)$ with $n=5$, coloured by the sign and size of $E_{\mu,\sigma}\,g$ for $g=\bar X^2-kS^2$; green is the zero set, which is always a thin pair of lines. Choose the **curved** family (gold rays $\sigma=c|\mu|$) and press **choose k**, or drag $k$: when the zero set lies on the curve, $E_\theta g=0$ for every member, confirmed on the right by simulation (gold, ±2 SE). In the **full** family no choice of $k$ can make $g$ vanish on the open window (dashed), and no other non-zero $g$ can either: that is the theorem.`,
      deps: ['stat-2.8', 'stat-2.4', 'rca-9.12'],
      refs: ['Casella–Berger §6.2'],
      tags: ['completeness', 'exponential family'],
      viz(v) {
        const n = 5;
        const famS = v.select('parameter set', [{ value: 'curved', label: 'curved: $\\sigma=c\\,|\\mu|$' }, { value: 'full', label: 'full rank: all $(\\mu,\\sigma)$' }], 'curved');
        const kS = v.slider('$k$ in $g=\\bar X^2-kS^2$', 0, 2.5, 1.2, { step: 0.01 });
        const cS = v.slider('$c$ in $\\sigma=c\\,|\\mu|$', 0.5, 2.5, 1, { step: 0.05 });
        const kBtn = v.button('choose $k$ to kill the curve', () => kS.set(1 / (cS.value * cS.value) + 1 / n));
        const sL = v.stage({ x: [-3, 3], y: [0, 3], height: 320, axes: 'box', weight: 1.1, title: 'parameter space: sign and size of $E_{\\mu,\\sigma}\\,g$' });
        const sR = v.stage({ x: [-3, 3], y: [-3, 3], height: 320, axes: 'box', weight: 1 });
        const tR = titler(sR), lg = legender(v);
        const E = (mu, s, k) => mu * mu + s * s / n - k * s * s;
        const MUS = [-2.5, -1.75, -1, -0.4, 0.4, 1, 1.75, 2.5];
        const cache = new Map();
        const mcAt = (mu, s) => { // moments of (X̄², S²) from 3,000 samples, so E g and its SE follow for any k
          const key = mu.toFixed(3) + '|' + s.toFixed(3); if (cache.has(key)) return cache.get(key);
          const r = v.rng(hashStr('cplt|' + key)), N = 3000; let a = 0, b = 0, aa = 0, bb = 0, ab = 0;
          for (let i = 0; i < N; i++) { let sm = 0, sq = 0; for (let j = 0; j < n; j++) { const x = mu + s * r.normal(); sm += x; sq += x * x; } const m = sm / n, s2 = (sq - n * m * m) / (n - 1), u = m * m; a += u; b += s2; aa += u * u; bb += s2 * s2; ab += u * s2; }
          const o = { N, a: a / N, b: b / N, vaa: aa / N - (a / N) ** 2, vbb: bb / N - (b / N) ** 2, vab: ab / N - (a / N) * (b / N) };
          if (cache.size > 200) cache.clear(); cache.set(key, o); return o;
        };
        const egMC = (mu, s, k) => { const o = mcAt(mu, s), m = o.a - k * o.b, vr = o.vaa - 2 * k * o.vab + k * k * o.vbb; return [m, 2 * Math.sqrt(Math.max(0, vr) / o.N)]; };
        const pos = v.rgb('orange'), neg = v.rgb('teal');
        let info = null;
        v.render(() => {
          const fam = famS.value, k = kS.value, c = cS.value;
          cS.el.hidden = fam !== 'curved'; kBtn.hidden = fam !== 'curved';
          viewPad(sL, [-3, 3], [0, 3], { left: 30 });
          let mx = 0; for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) mx = Math.max(mx, Math.abs(E(-3 + i * 0.2, j * 0.1, k)));
          sL.raster((mu, s) => { if (s < 0 || mu < -3 || mu > 3) return null; const e = E(mu, s, k), t = Math.pow(Math.min(1, Math.abs(e) / mx), 0.5), C = e >= 0 ? pos : neg; return [C[0], C[1], C[2], Math.round(200 * t)]; }, { res: 3, key: k.toFixed(3) });
          if (fam === 'curved') sL.clip(() => { sL.line(0, 0, -3, 3 * c, { color: 'gold', width: 6 }); sL.line(0, 0, 3, 3 * c, { color: 'gold', width: 6 }); }, [-3, 3], [0, 3]);
          else sL.rect(-1.2, 0.6, 1.2, 1.8, { color: 'gold', width: 2.2, dash: [6, 4] });
          sL.clip(() => sL.contour((mu, s) => E(mu, s, k), [0], { color: 'green', width: 2.4, res: 120 }), [-3, 3], [0, 3]);
          axisLabels(sL, '\\mu', '\\sigma');
          // right: E g along the curve, or along three horizontal lines of the full family
          let maxCurve = 0, rectLo = Infinity, rectHi = -Infinity, mcMax = 0, mcErr = 0;
          if (fam === 'curved') {
            const f = (mu) => E(mu, c * Math.abs(mu), k);
            const pts = MUS.map((mu) => { const [m, e] = egMC(mu, c * Math.abs(mu), k); return [mu, m, e]; });
            for (let i = 0; i <= 200; i++) maxCurve = Math.max(maxCurve, Math.abs(f(-3 + (6 * i) / 200)));
            const yr = Math.max(1, maxCurve * 1.15, ...pts.map(([, m, e]) => Math.abs(m) + e));
            viewPad(sR, [-3, 3], [-yr, yr], { left: 34 });
            sR.hline(0, { color: 'muted', width: 1.2 });
            sR.fn(f, { color: 'accent', width: 2.8 });
            for (const [mu, m, e] of pts) { sR.line(mu, m - e, mu, m + e, { color: 'gold', width: 2 }); sR.dot(mu, m, { r: 4.5, color: 'gold' }); mcMax = Math.max(mcMax, Math.abs(m)); mcErr = Math.max(mcErr, e); }
            tR(`$E_\\theta\\,g$ along the curve $\\sigma=${v.fix(c, 2)}\\,|\\mu|$`);
            axisLabels(sR, '\\mu', null);
            lg([['orange', '$E\\,g>0$', { area: true }], ['teal', '$E\\,g<0$', { area: true }], ['green', 'zero set of $E\\,g$'], ['gold', 'the curved family · simulated mean of $g$ ±2 SE']]);
          } else {
            const lines = [[0.6, 'purple'], [1.2, 'accent'], [1.8, 'teal']];
            let yr = 1; for (const [s] of lines) for (let i = 0; i <= 60; i++) yr = Math.max(yr, Math.abs(E(-1.2 + (2.4 * i) / 60, s, k)));
            for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { const e = E(-1.2 + (2.4 * i) / 40, 0.6 + (1.2 * j) / 40, k); rectLo = Math.min(rectLo, e); rectHi = Math.max(rectHi, e); }
            viewPad(sR, [-1.2, 1.2], [-yr * 1.15, yr * 1.15], { left: 34 });
            sR.hline(0, { color: 'muted', width: 1.2 });
            for (const [s, col] of lines) {
              sR.fn((mu) => E(mu, s, k), { domain: [-1.2, 1.2], color: col, width: 2.4 });
              for (const mu of [-1, -0.5, 0, 0.5, 1]) { const [m, e] = egMC(mu, s, k); sR.line(mu, m - e, mu, m + e, { color: col, width: 1.6 }); sR.dot(mu, m, { r: 3.6, color: col }); }
            }
            tR('$E_\\theta\\,g$ across the open window, at three values of $\\sigma$');
            axisLabels(sR, '\\mu', null);
            lg([['orange', '$E\\,g>0$', { area: true }], ['teal', '$E\\,g<0$', { area: true }], ['green', 'zero set of $E\\,g$'], ['purple', '$\\sigma=0.6$'], ['accent', '$\\sigma=1.2$'], ['teal', '$\\sigma=1.8$']]);
          }
          info = { fam, k, c, maxCurve, rectLo, rectHi, mcMax, mcErr };
        });
        v.readout(() => {
          if (!info) return '';
          const { fam, k, c, maxCurve, rectLo, rectHi, mcMax, mcErr } = info;
          if (fam === 'curved') {
            const kk = 1 / (c * c) + 1 / n, dead = maxCurve < 1e-3;
            return String.raw`on the curve, $E_\theta\,g=\mu^2\big(1-(k-\tfrac15)c^2\big)$, largest size ${v.fix(maxCurve, 4)} for $|\mu|\le3$ · it vanishes identically when $k=1/c^2+1/n=${v.fix(kk, 3)}$ · simulated means: largest $|\cdot|$ ${v.fix(mcMax, 3)} with 2 SE up to ${v.fix(mcErr, 3)} — ` + (dead ? `**a non-zero $g$ with zero mean for every member: $(\bar X,S^2)$ is not complete in this curved family**` : 'not yet zero: drag $k$ or press the button');
          }
          return String.raw`on the open window $E_\theta\,g$ ranges over $[${v.fix(rectLo, 3)},\,${v.fix(rectHi, 3)}]$ for $k=${v.fix(k, 2)}$: **never identically zero** · its zero set (green) is a pair of lines through the origin, which contains no open set · by the theorem the same holds for every non-zero $g$: $(\sum X_i,\sum X_i^2)$ is complete in the full family`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Basu’s theorem',
      credit: 'Basu, 1955',
      statement: String.raw`If $T$ is a complete (boundedly complete suffices) sufficient statistic for $\{P_\theta:\theta\in\Theta\}$ and $A$ is an ancillary statistic, then $T$ and $A$ are independent under every $P_\theta$.

Applications: for a $N(\mu,\sigma^2)$ sample, $\bar X$ is independent of $S^2$, of the range, of $\text{median}-\bar X$ and of every other function of the residuals $X_i-\bar X$ (take $\sigma$ fixed: $\bar X$ is complete sufficient for $\mu$ and the residuals are ancillary; the conclusion does not involve $\sigma$, so it holds for all $\sigma$); for an exponential sample, $\sum X_i$ is independent of $(X_1/\sum X_i,\dots,X_n/\sum X_i)$. Completeness cannot be dropped: in $U(\theta-\tfrac12,\theta+\tfrac12)$ the minimal sufficient pair (midrange, range) is not complete, and the ancillary range is strongly dependent on the midrange.`,
      idea: String.raw`Fix a set $B$. Ancillarity makes $P_\theta(A\in B)=c$ the same for all $\theta$, and sufficiency makes $\varphi(T)=P(A\in B\mid T)$ free of $\theta$ (2.2). Then $E_\theta[\varphi(T)-c]=0$ for every $\theta$, so completeness (2.8, 2.9 for the normal mean) gives $\varphi(T)=c$ almost surely: conditioning on $T$ does not change the law of $A$, which is independence. In the uniform model the bounded function $\varphi(T)-c$ is a non-zero unbiased estimator of zero, and the argument breaks exactly where completeness fails. Theorem 1.9 is the special case $A=S^2$.`,
      caption: String.raw`One dot per sample at $(T,A)$, coloured by which third of $T$ it falls in; right: the histogram of $A$ within each third. Under Basu's hypotheses the three histograms are the same, whatever ancillary $A$ is chosen (and the χ² test agrees). Choose $X_1$, which is not ancillary, and the thirds pull apart. Switch to the uniform model, where $T$ is not complete: the cloud is a triangle, extreme midranges force small ranges, and the histograms differ although the correlation is near zero.`,
      deps: ['stat-2.9', 'stat-2.7'],
      see: ['stat-1.9'],
      refs: ['Casella–Berger §6.2'],
      tags: ['completeness', 'ancillary', 'independence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Basu%27s_theorem' },
      viz(v) {
        const modS = v.select('model', [{ value: 'norm', label: '$N(\\mu,1)$, $T=\\bar X$ (complete)' }, { value: 'unif', label: '$U(\\theta\\pm\\frac12)$, $T=$ midrange (not complete)' }], 'norm');
        const aS = v.select('statistic $A$', [{ value: 's2', label: '$S^2$' }, { value: 'range', label: 'range $R$' }, { value: 'med', label: 'median $-\\,\\bar X$' }, { value: 'x1', label: '$X_1$ (not ancillary)' }], 's2');
        const nS = v.slider('sample size $n$', 3, 20, 5, { int: true });
        const sL = v.stage({ x: [-1, 1], y: [0, 3], height: 320, axes: 'box', weight: 1.15 });
        const sR = v.stage({ x: [0, 3], y: [0, 1], height: 320, axes: 'box', weight: 1 });
        const tL = titler(sL), tR = titler(sR), lg = legender(v);
        const statA = (xs, a) => {
          const n = xs.length, m = mean(xs), s = sortNum(xs);
          if (a === 's2') { let q = 0; for (const x of xs) q += (x - m) ** 2; return q / (n - 1); }
          if (a === 'range') return s[n - 1] - s[0];
          if (a === 'med') return qSorted(s, 0.5) - m;
          return xs[0];
        };
        const R = repeater(v, {
          key: () => [modS.value, modS.value === 'unif' ? 'range' : aS.value, nS.value].join('|'),
          sample: (r) => { const n = nS.value, xs = new Array(n); for (let i = 0; i < n; i++) xs[i] = modS.value === 'norm' ? r.normal() : r() - 0.5; return xs; },
          stat: (xs) => { if (modS.value === 'unif') { const s = sortNum(xs); return [(s[0] + s[s.length - 1]) / 2, s[s.length - 1] - s[0]]; } return [mean(xs), statA(xs, aS.value)]; },
          init: 4000,
        });
        const COL = ['purple', 'teal', 'orange'];
        const sc = memo();
        const summary = () => { const S = R.sync(); return sc(S.id(), () => {
          const V = S.vals, N = V.length; if (N < 60) return null;
          const ts = sortNum(V.map((p) => p[0])), as = sortNum(V.map((p) => p[1]));
          const t1 = qSorted(ts, 1 / 3), t2 = qSorted(ts, 2 / 3), third = (t) => (t < t1 ? 0 : t < t2 ? 1 : 2);
          const qa = [0.2, 0.4, 0.6, 0.8].map((q) => qSorted(as, q)), fifth = (a) => qa.filter((x) => a > x).length;
          const tab = [0, 1, 2].map(() => new Array(5).fill(0)); for (const [t, a] of V) tab[third(t)][fifth(a)]++;
          return { N, t1, t2, third, chi: chi2Indep(v.M, tab), r: corr(V, (p) => p[0], (p) => p[1]), rAbs: corr(V, (p) => Math.abs(p[0]), (p) => p[1]), lo: qSorted(as, 0.005), hi: qSorted(as, 0.995), tlo: qSorted(ts, 0.003), thi: qSorted(ts, 0.997) };
        }); };
        let info = null;
        v.render(() => {
          const S = R.sync(), Sm = summary(), mod = modS.value, a = mod === 'unif' ? 'range' : aS.value;
          aS.el.hidden = mod === 'unif';
          const aName = { s2: 'S^2', range: 'R', med: '\\mathrm{med}-\\bar X', x1: 'X_1' }[a], tName = mod === 'norm' ? '\\bar X' : '\\text{midrange}';
          tL(`one dot per sample: $(T,A)=(${tName},\\,${aName})$`);
          tR(`histogram of $${aName}$ within each third of $T$`);
          if (!Sm) { viewPad(sL, [-1, 1], [0, 1]); return; }
          const tw = Math.max(Math.abs(Sm.tlo), Math.abs(Sm.thi)) * 1.05, ap = 0.06 * (Sm.hi - Sm.lo);
          viewPad(sL, [-tw, tw], [Sm.lo - ap, Sm.hi + ap], { left: 38 });
          for (let g = 0; g < 3; g++) { const pts = []; for (let i = Math.max(0, S.vals.length - 6000); i < S.vals.length; i++) { const [t, y] = S.vals[i]; if (Sm.third(t) === g) pts.push([t, y]); } sL.dots(pts, { r: 1.7, color: COL[g], alpha: 0.5 }); }
          sL.vline(Sm.t1, { color: 'ink', dash: [5, 4], width: 1.2, alpha: 0.6 }); sL.vline(Sm.t2, { color: 'ink', dash: [5, 4], width: 1.2, alpha: 0.6 });
          axisLabels(sL, mod === 'norm' ? '\\bar X' : '\\text{midrange}', aName);
          const nb = 30, Bs = [0, 1, 2].map((g) => binned(S.vals.filter((p) => Sm.third(p[0]) === g).map((p) => p[1]), Sm.lo, Sm.hi, nb));
          viewPad(sR, [Sm.lo, Sm.hi], [0, Math.max(...Bs.map((B) => B.max)) * 1.15], { left: 38 });
          Bs.forEach((B, g) => { sR.hist(B, { density: true, color: COL[g], fillAlpha: 0, width: 2.4 }); });
          lg([['purple', 'lowest third of $T$', { area: true }], ['teal', 'middle third', { area: true }], ['orange', 'highest third', { area: true }]]);
          info = { Sm, mod, a };
        });
        v.readout(() => {
          if (!info) return 'Draw more samples.';
          const { Sm, mod, a } = info, indep = Sm.chi.p > 0.001;
          const why = mod === 'unif' ? 'the midrange is not complete, so Basu does not apply — and indeed the range depends on it' : a === 'x1' ? '$X_1$ is not ancillary, so Basu does not apply' : 'complete sufficient $\\bar X$ and an ancillary: Basu predicts independence';
          return String.raw`${commas(Sm.N)} samples · corr$(T,A)$ = **${v.fix(Sm.r, 3)}**, corr$(|T|,A)$ = **${v.fix(Sm.rAbs, 3)}** · χ² test of independence on the 3 × 5 table of thirds of $T$ by fifths of $A$: χ² = ${v.fix(Sm.chi.stat, 1)} on ${Sm.chi.df} df, p ${fmtP(Sm.chi.p)} — ${indep ? '**no detectable dependence**' : '**clear dependence**'} · ${why}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Definition',
      name: 'Likelihood function',
      credit: 'Fisher, 1912 and 1921',
      statement: String.raw`Given observed data $x$ and a model $\{f(\cdot\mid\theta):\theta\in\Theta\}$, the **likelihood function** is
$$L(\theta;x)=f(x\mid\theta),$$
regarded as a function of $\theta$ with $x$ held fixed; for an i.i.d. sample $L(\theta)=\prod_{i=1}^nf(x_i\mid\theta)$, and $\ell(\theta)=\log L(\theta)=\sum_i\log f(x_i\mid\theta)$ is the **log-likelihood**. Only ratios $L(\theta_1)/L(\theta_2)$ carry meaning, so $L$ is defined up to a positive factor depending on $x$ alone; the **relative likelihood** is $R(\theta)=L(\theta)/\sup_{\theta'}L(\theta')$, and $\{\theta:R(\theta)\ge c\}$ is a likelihood interval.

$L$ is not a probability density on $\Theta$: its integral need not be 1, or even finite, and under a reparametrisation $\psi=\varphi(\theta)$ it simply relabels, $L^*(\psi)=L(\varphi^{-1}(\psi))$, with no Jacobian. So maxima and likelihood intervals map across ($\hat\psi=\varphi(\hat\theta)$) while areas do not.`,
      idea: String.raw`The likelihood compares how well each parameter value predicted the data that were actually observed. Independence turns the product into a sum of log-likelihood contributions, so each new observation reweights the curve: it sharpens like a parabola whose curvature grows in proportion to $n$ (ch. 4–5) and drifts toward the true value. Because a model (1.1) assigns probabilities to data, not to parameters, nothing obliges $L$ to integrate to one; a density in $\theta$ would pick up the factor $|d\theta/d\psi|$ under a change of variable, and the likelihood does not.`,
      caption: String.raw`Left: exponential data (gold); click to add an observation, shift-click to remove the nearest, or use the buttons; the blue curve is the fitted density. Right: the relative likelihood in the chosen parametrisation, with the previous curve (before the last observation) dashed and the 1/8 likelihood interval in green. Switch between the rate $\lambda$, the mean $\beta=1/\lambda$ and $\log\lambda$: the peak and the interval map across exactly, but the area under the curve changes, and in $\beta$ it is infinite for a single observation.`,
      deps: ['stat-1.1'],
      refs: ['Casella–Berger §6.3', 'Wasserman §9.3'],
      tags: ['likelihood'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood_function' },
      viz(v) {
        const M = v.M;
        const parS = v.select('parametrisation', [{ value: 'rate', label: 'rate $\\lambda$' }, { value: 'mean', label: 'mean $\\beta=1/\\lambda$' }, { value: 'log', label: '$\\psi=\\log\\lambda$' }], 'rate');
        const sL = v.stage({ x: [0, 5], y: [0, 2], height: 300, axes: 'box', weight: 0.95, title: 'data (click to add, shift-click to remove)' });
        const sR = v.stage({ x: [0, 6], y: [0, 1.15], height: 300, axes: 'box', weight: 1.1 });
        const tR = titler(sR);
        let src = v.rng(1912), data = [];
        const draw = (k) => { for (let i = 0; i < k; i++) data.push(Math.min(4.9, -Math.log(1 - src()) / 1.5)); };
        draw(6);
        sL.onClick((x, y, mod) => {
          if (mod.shift) { if (!data.length) return; let b = 0; data.forEach((d, i) => { if (Math.abs(d - x) < Math.abs(data[b] - x)) b = i; }); data.splice(b, 1); }
          else if (x > 0.01 && x < 5) data.push(x);
        });
        v.button('Add 5 from Exp(1.5)', () => draw(5));
        v.button('Remove last', () => data.pop());
        v.button('Clear', () => { data = []; });
        const P = {
          rate: { to: (l) => l, from: (t) => t, win: (lh) => [0, Math.max(4, 3.2 * lh)], sym: '\\lambda' },
          mean: { to: (l) => 1 / l, from: (t) => 1 / t, win: (lh) => [0, Math.max(2, 4 / lh)], sym: '\\beta' },
          log: { to: (l) => Math.log(l), from: (t) => Math.exp(t), win: (lh) => [Math.log(lh) - 2.5, Math.log(lh) + 1.6], sym: '\\psi' },
        };
        const lglam = (l, n, S) => n * Math.log(l) - l * S; // log-likelihood in the rate
        let info = null;
        v.render(() => {
          const n = data.length, S = data.reduce((a, b) => a + b, 0), par = P[parS.value];
          // left: the data and the fitted density
          const lh = n ? n / S : NaN;
          viewPad(sL, [0, 5], [0, Math.max(1, (isFinite(lh) ? lh : 1) * 1.12)], { left: 30 });
          if (n >= 12) sL.hist(binned(data, 0, 5, 20), { density: true, color: 'gold', fillAlpha: 0.2 });
          const yb = sL.bounds.y[1]; data.forEach((x, i) => sL.dot(x, yb * (0.04 + 0.06 * ((i * 0.618034) % 1)), { r: 4.5, color: 'gold' }));
          if (n) sL.fn((x) => lh * Math.exp(-lh * x), { domain: [0, 5], color: 'accent', width: 2.4 });
          axisLabels(sL, 'x', null);
          if (!n) { sL.corner('click to add observations', 'tr', { weight: 600 }); viewPad(sR, [0, 6], [0, 1.15]); tR('no data: the likelihood is constant'); info = { n }; return; }
          // right: relative likelihood in the chosen parametrisation
          const w = par.win(lh), R = (t) => { const l = par.from(t); return l > 0 && isFinite(l) ? Math.exp(lglam(l, n, S) - lglam(lh, n, S)) : 0; };
          viewPad(sR, w, [0, 1.15], { left: 34 });
          if (n > 1) { const S0 = S - data[n - 1], l0 = (n - 1) / S0; sR.fn((t) => { const l = par.from(t); return l > 0 && isFinite(l) ? Math.exp(lglam(l, n - 1, S0) - lglam(l0, n - 1, S0)) : 0; }, { domain: w, color: 'muted', width: 1.6, dash: [6, 4], n: 500 }); }
          // likelihood interval R ≥ 1/8, found in λ and mapped
          const root = (a, b) => { for (let i = 0; i < 80; i++) { const m = 0.5 * (a + b); if ((lglam(m, n, S) - lglam(lh, n, S) + Math.log(8)) * (lglam(a, n, S) - lglam(lh, n, S) + Math.log(8)) <= 0) b = m; else a = m; } return 0.5 * (a + b); };
          const l1 = root(1e-9, lh), l2 = root(lh, lh * 60), t1 = par.to(l1), t2 = par.to(l2), ta = Math.min(t1, t2), tb = Math.max(t1, t2);
          sR.vband(ta, Math.min(tb, w[1] + 10), { color: 'green', alpha: 0.12 });
          sR.hline(1 / 8, { color: 'green', width: 1, dash: [3, 4] });
          sR.fn(R, { domain: w, color: 'accent', width: 2.8, fill: 'accent', fillAlpha: 0.1, n: 600 });
          sR.vline(par.to(lh), { color: 'accent', width: 1.2, dash: [4, 4] });
          sR.text('R = 1/8', w[1], 1 / 8, { align: 'right', dx: -6, dy: -9, color: 'green', size: 11, weight: 600 });
          tR(`relative likelihood $R(${par.sym})=L(${par.sym})/L(\\hat${par.sym})$, $n=${n}$`);
          axisLabels(sR, par.sym, null);
          // exact areas under R in each parametrisation
          const Lhat = Math.exp(lglam(lh, n, S));
          const areas = { rate: Math.exp(M.lgamma(n + 1) - (n + 1) * Math.log(S)) / Lhat, mean: n >= 2 ? Math.exp(M.lgamma(n - 1) - (n - 1) * Math.log(S)) / Lhat : Infinity, log: Math.exp(M.lgamma(n) - n * Math.log(S)) / Lhat };
          const ar = areas[parS.value];
          sR.corner(`area under the curve: ${isFinite(ar) ? v.fix(ar, 3) : '∞'}`, 'tr', { color: 'accent', weight: 600 });
          info = { n, lh, l1, l2, areas, lnL: lglam(lh, n, S) };
        });
        v.readout(() => {
          if (!info || !info.n) return 'Add observations to see a likelihood.';
          const { n, lh, l1, l2, areas, lnL } = info, f = (a) => (isFinite(a) ? v.fix(a, 3) : '∞');
          return String.raw`$n=${n}$ · maximum at $\hat\lambda=${v.fix(lh, 3)}$, i.e. $\hat\beta=1/\hat\lambda=${v.fix(1 / lh, 3)}$ and $\hat\psi=\log\hat\lambda=${v.fix(Math.log(lh), 3)}$ · 1/8 likelihood interval $\lambda\in[${v.fix(l1, 3)},\,${v.fix(l2, 3)}]$ in every parametrisation · areas under $R$: ${f(areas.rate)} in $\lambda$, ${f(areas.mean)} in $\beta$, ${f(areas.log)} in $\psi$ — **not a density** · and $L(\hat\lambda)=e^{${v.fix(lnL, 2)}}$ itself is just a number, meaningful only in ratios`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Principle',
      name: 'Conditionality principle',
      credit: 'Cox, 1958; Birnbaum, 1962',
      statement: String.raw`**Weak conditionality principle.** Suppose an experiment $E$ is a mixture: first an index $J$ with a known distribution, not depending on $\theta$, chooses which of the experiments $E_1,E_2,\dots$ to perform, then the chosen $E_J$ is run and its outcome $X_J$ is observed. Then the evidence about $\theta$ from the outcome $(j,x_j)$ of $E$ is the same as the evidence from performing $E_j$ directly and observing $x_j$:
$$\mathrm{Ev}\big(E,(j,x_j)\big)=\mathrm{Ev}\big(E_j,x_j\big).$$
Inference should be conditional on the experiment actually performed; the experiments that might have been performed, but were not, are irrelevant. Cox's example: a fair coin decides whether a quantity is measured with a precise instrument (error SD 1) or a crude one (SD 10).`,
      scope: String.raw`The index $J$ must be ancillary (its law free of $\theta$) and observed. Widely accepted in this weak form; it is the conditional half of the argument that leads to the likelihood principle (2.16), and conflicts with procedures chosen for their average performance over the mixture, as Cox's example shows.`,
      idea: String.raw`In Cox's example the mixture's sampling distribution is a blend of a narrow and a wide normal curve, and an interval with a single half-width chosen to cover 95% of the time on average over-covers on precise days and under-covers on crude days; the overall 95% is an average of two numbers that each describe a day that might occur. Once the coin has been seen, the relevant reference set is the days on which that instrument was used: $J$ is ancillary (2.7), so conditioning on it loses no information about $\theta$ and recovers the precision actually achieved. Worse, the unconditional interval that is shortest on average spends the error budget unevenly, buying shortness on crude days at the price of 99% coverage on precise ones: unconditionally optimal, conditionally absurd.`,
      caption: String.raw`Each repetition: a coin picks the precise (blue) or the crude (orange) instrument, and the reading $X$ gives an interval around it; red intervals miss the true value (green line). Left: the last 50 intervals of the chosen procedure. Right: simulated coverage on precise days, crude days and overall for all three procedures (the chosen one solid, ±2 SE; black ticks are exact). All three cover 95% overall; only the conditional one covers 95% on the day you are actually having. Change the odds of the precise instrument and the noise ratio.`,
      deps: ['stat-2.7'],
      refs: ['Casella–Berger §6.3'],
      tags: ['conditionality', 'ancillary', 'foundations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood_principle#The_conditionality_principle' },
      viz(v) {
        const M = v.M;
        const procS = v.select('interval', [{ value: 'cond', label: 'conditional: $X\\pm1.96\\,\\sigma_J$' }, { value: 'common', label: 'one width for both' }, { value: 'short', label: 'shortest on average' }], 'cond');
        const qS = v.slider('chance of the precise instrument', 0.1, 0.9, 0.5, { step: 0.05 });
        const rS = v.slider('noise ratio crude / precise', 2, 20, 10, { step: 0.5 });
        const sL = v.stage({ x: [-25, 25], y: [0, 51], height: 330, axes: 'box', weight: 1.1, title: 'the last 50 repetitions (true value 0)', yticks: [] });
        const sR = v.stage({ x: [0, 3], y: [0.8, 1], height: 330, axes: 'box', weight: 1, title: 'coverage', xticks: [] });
        const PROC = { cond: { col: 'accent', name: 'conditional' }, common: { col: 'purple', name: 'one width' }, short: { col: 'teal', name: 'shortest on average' } };
        const cov = (z) => 2 * Phi(M, z) - 1;
        const zs = (q, r) => { // half-widths in units of each instrument's SD: [z_precise, z_crude] for each procedure
          const bis = (f, a, b) => { for (let i = 0; i < 100; i++) { const m = 0.5 * (a + b); if (f(m) < 0) a = m; else b = m; } return 0.5 * (a + b); };
          const c = bis((c) => q * cov(c) + (1 - q) * cov(c / r) - 0.95, 0, 200);
          const z2 = bis((z) => q * cov(Math.sqrt(z * z + 2 * Math.log(r))) + (1 - q) * cov(z) - 0.95, 0, 10), z1 = Math.sqrt(z2 * z2 + 2 * Math.log(r));
          return { cond: [1.96, 1.96], common: [c, c / r], short: [z1, z2] };
        };
        const R = repeater(v, { key: () => [qS.value, rS.value].join('|'), sample: (r) => [r() < qS.value ? 0 : 1, r.normal()], init: 2000, buttons: [100, 10000] });
        let info = null;
        v.render(() => {
          const S = R.sync(), q = qS.value, r = rS.value, Z = zs(q, r), sig = [1, r], proc = procS.value;
          // left: interval stack
          const last = S.vals.slice(-50), W = Math.max(12, 1.15 * Math.max(Z.common[1] * r, Z.short[1] * r, 1.96 * r));
          viewPad(sL, [-W, W], [0, 51], { left: 12 });
          sL.vline(0, { color: 'green', width: 2 });
          last.forEach(([j, z], i) => {
            const x = sig[j] * z, hw = Z[proc][j] * sig[j], hit = Math.abs(z) <= Z[proc][j];
            sL.line(x - hw, i + 1, x + hw, i + 1, { color: hit ? (j ? 'orange' : 'accent') : 'red', width: j ? 2 : 3, alpha: hit ? 0.85 : 1 });
            sL.dot(x, i + 1, { r: 2.2, color: 'ink' });
          });
          // right: coverage bars
          const groups = [[0, 'precise days'], [1, 'crude days'], [2, 'overall']];
          const N = S.vals.length, stats = {};
          for (const p of Object.keys(PROC)) {
            let n0 = 0, n1 = 0, h0 = 0, h1 = 0;
            for (const [j, z] of S.vals) { const hit = Math.abs(z) <= Z[p][j]; if (j) { n1++; h1 += hit; } else { n0++; h0 += hit; } }
            stats[p] = { c: [h0 / n0, h1 / n1, (h0 + h1) / N], n: [n0, n1, N], ex: [cov(Z[p][0]), cov(Z[p][1]), q * cov(Z[p][0]) + (1 - q) * cov(Z[p][1])], len: 2 * (q * Z[p][0] * sig[0] + (1 - q) * Z[p][1] * sig[1]) };
          }
          let lo = 1; for (const p in stats) lo = Math.min(lo, ...stats[p].ex, ...stats[p].c.filter(isFinite));
          lo = Math.max(0, Math.min(0.85, lo - 0.04));
          viewPad(sR, [-0.1, 3.1], [lo, 1.01], { left: 40, bottom: 26 });
          sR.hline(0.95, { color: 'green', width: 1.6, dash: [6, 4] });
          Object.keys(PROC).forEach((p, k) => groups.forEach(([gi]) => {
            const x = gi + 0.2 + k * 0.27, c = stats[p].c[gi], e = 2 * Math.sqrt(Math.max(1e-9, c * (1 - c)) / stats[p].n[gi]), on = p === proc;
            if (!isFinite(c)) return;
            sR.rect(x - 0.11, lo, x + 0.11, c, { fill: PROC[p].col, fillAlpha: on ? 0.75 : 0.22, stroke: false });
            if (on) sR.line(x, c - e, x, Math.min(1.01, c + e), { color: 'ink', width: 1.4 });
            sR.line(x - 0.12, stats[p].ex[gi], x + 0.12, stats[p].ex[gi], { color: 'ink', width: 2 });
          }));
          groups.forEach(([gi, nm]) => sR.text(nm, gi + 0.47, lo, { dy: 12, align: 'center', size: 11.5, color: 'muted' }));
          sR.text('95%', 3.1, 0.95, { align: 'right', dy: -9, color: 'green', size: 11, weight: 600 });
          v.legend([['accent', 'conditional', { area: true }], ['purple', 'one width', { area: true }], ['teal', 'shortest on average', { area: true }], ['orange', 'crude-instrument interval'], ['red', 'interval that misses']]);
          info = { stats, proc, N, Z, r };
        });
        v.readout(() => {
          if (!info) return '';
          const { stats, proc, N, Z, r } = info, s = stats[proc], P = (x) => pct(x, 1);
          const lens = Object.keys(PROC).map((p) => `${PROC[p].name} ${v.fix(stats[p].len, 2)}`).join(', ');
          return String.raw`${commas(N)} repetitions · **${PROC[proc].name}** (half-widths ${v.fix(Z[proc][0], 2)} and ${v.fix(Z[proc][1] * r, 2)}): coverage ${P(s.c[0])} on precise days, ${P(s.c[1])} on crude days, ${P(s.c[2])} overall (exact ${P(s.ex[0])}, ${P(s.ex[1])}, ${P(s.ex[2])}) · average length: ${lens} — the shortest unconditional procedure beats the conditional one on average while covering ${P(stats.short.ex[0])} on precise days`;
        });
      },
    },
  ],
};
