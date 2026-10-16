// Statistical Inference — Chapter 4 (part b): items 4.8–4.14 — best unbiased estimators, Rao–Blackwell,
// Lehmann–Scheffé, the German tank problem, the strange corners of unbiasedness, and Rao's 1945 paper.
import {
  clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler,
  strip, varN, rpois, dpois, dbinom, lchoose, mulberry,
} from './ch04.shared.js';

/** Median of an array (copied). */
const med = (a) => { const s = Float64Array.from(a).sort(), n = s.length; return n % 2 ? s[(n - 1) >> 1] : 0.5 * (s[n / 2 - 1] + s[n / 2]); };
/** Sample variance (divisor n − 1). */
const s2 = (a) => { const m = mean(a); let q = 0; for (const x of a) q += (x - m) ** 2; return q / (a.length - 1); };

export default {
  collection: 'stat',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Uniformly minimum-variance unbiased estimator',
      statement: String.raw`An unbiased estimator $T^*$ of $\tau(\theta)$ is a **uniformly minimum-variance unbiased estimator (UMVUE)**, or best unbiased estimator, if
$$\operatorname{Var}_\theta T^*\le\operatorname{Var}_\theta T\qquad\text{for every }\theta\in\Theta$$
and every unbiased estimator $T$ of $\tau(\theta)$ with finite variance. "Uniformly" is the whole point: it must win at every parameter value simultaneously, not on average and not at one $\theta$. Among unbiased estimators the MSE is the variance (stat-3.2), so a UMVUE is the best unbiased estimator in mean squared error; a biased estimator may still beat it. A UMVUE need not exist, but when it exists it is unique (if $T_1,T_2$ both are, $\tfrac12(T_1+T_2)$ would beat them unless $T_1=T_2$ almost surely).

Example: for a Poisson$(\lambda)$ sample, $\bar X$ has variance $\lambda/n$, which equals the Cramér–Rao bound for every $\lambda$, so $\bar X$ is the UMVUE of $\lambda$; the sample variance $S^2$ (variance $\lambda/n+2\lambda^2/(n-1)$) and $X_1$ (variance $\lambda$) are also unbiased for $\lambda$.`,
      idea: String.raw`Restricting to unbiased estimators removes the trivial winners (the constant $\theta_0$, perfect at $\theta_0$), and within that class one can sometimes find an estimator that is never beaten. Two routes lead to it: an unbiased estimator attaining the Cramér–Rao bound at every $\theta$ is automatically best (stat-4.4, stat-4.5), and in general Rao–Blackwell plus completeness constructs it (stat-4.9, stat-4.10). Without uniformity the notion would be empty: two reasonable estimators typically cross, each better on part of the parameter space, as $S^2$ and $X_1$ do here.`,
      caption: String.raw`Variance curves of three unbiased estimators of a Poisson mean across $\lambda$ (exact lines): $\bar X$ (blue) is lowest at every $\lambda$; $S^2$ (teal) beats $X_1$ (grey) for small $\lambda$ and loses for large $\lambda$, crossing at $\lambda^*=(n-1)^2/(2n)$. Drag the gold handle along the axis: the dots are variances of 2,000 simulated estimates there, and the right panel shows those estimates as a dartboard. Turn on the biased shrunk mean $\tfrac{n}{n+1}\bar X$ (purple, its MSE): for small $\lambda$ it beats the UMVUE, which is best only among unbiased estimators.`,
      deps: ['stat-3.1'],
      see: ['stat-3.2', 'stat-4.10'],
      refs: ['Casella–Berger §7.3'],
      tags: ['unbiasedness', 'UMVUE', 'estimation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Minimum-variance_unbiased_estimator' },
      viz(v) {
        const LMAX = 6;
        const nS = v.slider('sample size $n$', 2, 20, 5, { int: true });
        const bT = v.toggle('add the biased $\\tfrac{n}{n+1}\\bar X$ (MSE)', false);
        const sL = v.stage({ x: [0, LMAX], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 1.2, xlabel: '$\\lambda$', ylabel: 'variance (MSE)', title: 'risk of unbiased estimators across the parameter' });
        const sR = v.stage({ x: [0, 1], y: [0.3, 4.7], axes: 'box', gutter: { l: 80 }, height: 360, weight: 0.8, minWidth: 230, xlabel: 'estimate', title: 'estimates at the handle' });
        const H = sL.handle(2.5, 0, { color: 'gold', label: '$\\lambda$', labelPos: 'n', constrain: (x) => [clamp(x, 0.15, LMAX - 0.1), 0] });
        const EST = [
          { k: 'mean', lab: 'X̄', col: 'accent', f: (n, l) => l / n },
          { k: 's2', lab: 'S²', col: 'teal', f: (n, l) => l / n + (2 * l * l) / (n - 1) },
          { k: 'x1', lab: 'X₁', col: 'muted', f: (n, l) => l },
          { k: 'shr', lab: 'n/(n+1)·X̄', col: 'purple', f: (n, l) => (n * l) / (n + 1) ** 2 + (l * l) / (n + 1) ** 2, biased: true },
        ];
        const mc = memo();
        const sim = (n, l) => mc(n + '|' + l, () => {
          const r = v.rng(hashStr(`umvue|${n}|${l}`)), out = { mean: [], s2: [], x1: [], shr: [] }, xs = new Float64Array(n);
          for (let c = 0; c < 2000; c++) { let s = 0; for (let i = 0; i < n; i++) { xs[i] = rpois(r, l); s += xs[i]; } const m = s / n; out.mean.push(m); out.s2.push(s2(xs)); out.x1.push(xs[0]); out.shr.push((n / (n + 1)) * m); }
          return out;
        });
        let info = null;
        v.render(() => {
          const n = nS.value, l = +H.x.toFixed(2), ests = EST.filter((e) => !e.biased || bT.value);
          const top = Math.min(EST[1].f(n, LMAX), Math.max(EST[2].f(n, LMAX), EST[1].f(n, (n - 1) ** 2 / (2 * n)) * 2.2)) * 1.05;
          sL.setView([0, LMAX], [0, top]);
          for (const e of ests) sL.fn((x) => e.f(n, x), { domain: [0, LMAX], color: e.col, width: e.k === 'mean' ? 3.4 : 2.2, dash: e.biased ? [7, 4] : undefined });
          const ls = (n - 1) ** 2 / (2 * n);
          if (ls < LMAX) { sL.dot(ls, ls, { r: 5, hollow: true, color: 'ink', width: 2 }); sL.text('S² and X₁ cross', ls, ls, { color: 'ink', size: 11.5, dx: 8, dy: -10, align: 'left', plate: true }); }
          sL.vline(l, { color: 'gold', width: 1.4, dash: [3, 4] });
          const D = sim(n, l);
          const simv = ests.map((e) => { const vals = D[e.k]; const m = mean(vals); const vr = e.biased ? mean(vals.map((x) => (x - l) ** 2)) : varN(vals) * 2000 / 1999; return { e, vr, m }; });
          for (const q of simv) sL.dot(l, q.vr, { r: 5, color: q.e.col });
          sL.text('X̄ = UMVUE', LMAX * 0.97, EST[0].f(n, LMAX * 0.97), { color: 'accent', size: 12, weight: 700, align: 'right', dy: 13, plate: true });
          // right: dartboard rows at the handle
          const rows = ests.length, wide = Math.max(Math.sqrt(EST[1].f(n, l)), Math.sqrt(l)) * 2.6;
          sR.setView([Math.max(-0.5, l - wide), l + wide], [0.3, rows + 0.7]);
          sR.setTicks(null, ests.map((e, i) => [rows - i, e.lab]));
          sR.vline(l, { color: 'green', width: 1.8 });
          ests.forEach((e, i) => {
            const y = rows - i, vals = D[e.k], m = mean(vals), sd = Math.sqrt(varN(vals));
            strip(sR, vals, y, 0.3, { color: e.col, alpha: 0.3, r: 1.7, seed: 21 + i, max: 1000 });
            sR.line(m - sd, y - 0.38, m + sd, y - 0.38, { color: 'orange', width: 3 }); sR.dot(m, y - 0.38, { r: 3.4, color: 'ink' });
          });
          v.legend(ests.map((e) => [e.col, e.lab + (e.biased ? ' (biased: MSE)' : ''), e.biased ? { dash: true } : {}]).concat([['orange', '±1 SD of the estimates'], ['green', 'true λ']]));
          info = { n, l, simv, ls };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, l, simv, ls } = info, low = simv.filter((q) => !q.e.biased).reduce((a, b) => (b.e.f(n, l) < a.e.f(n, l) ? b : a));
          let s = String.raw`at $\lambda=${v.fix(l, 2)}$, $n=${n}$: ` + simv.map((q) => `${q.e.lab} ${v.fix(q.vr, 4)} (exact ${v.fix(q.e.f(n, l), 4)})`).join(', ') + ` · lowest unbiased: **${low.e.lab}**, here and at every λ · between $S^2$ and $X_1$ the winner depends on λ (crossing at ${v.fix(ls, 3)})`;
          const sh = simv.find((q) => q.e.biased);
          if (sh) s += sh.e.f(n, l) < l / n ? ' · **the biased estimator beats the UMVUE here** (for λ below (2n+1)/n)' : ' · the biased estimator loses here, but wins for λ below (2n+1)/n';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Rao–Blackwell theorem',
      credit: 'Rao, 1945; Blackwell, 1947',
      statement: String.raw`Let $T$ be a sufficient statistic for the family $\{P_\theta\}$ (stat-2.2) and $\delta(X)$ any estimator of $\tau(\theta)$ with $E_\theta\delta^2<\infty$. Put
$$\delta^*(T)=E[\delta(X)\mid T].$$
Then (a) $\delta^*$ is a statistic: by sufficiency the conditional distribution of $X$ given $T$, hence the conditional expectation, does not involve $\theta$; (b) $E_\theta\delta^*=E_\theta\delta$, so $\delta^*$ has the same bias; and (c) for every $\theta$
$$\operatorname{Var}_\theta\delta^*\le\operatorname{Var}_\theta\delta,\qquad \operatorname{MSE}_\theta(\delta^*)\le\operatorname{MSE}_\theta(\delta),$$
with equality only if $\delta$ is already a function of $T$. More generally $E_\theta L(\theta,\delta^*)\le E_\theta L(\theta,\delta)$ for every loss convex in its second argument. Examples: for Poisson data $E[X_1\mid\sum X_i]=\bar X$ and $E[\mathbf 1\{X_1=0\}\mid\sum X_i=t]=(1-\tfrac1n)^t$; for $\mathrm{Uniform}(0,\theta)$, $E[2X_1\mid X_{(n)}]=\tfrac{n+1}{n}X_{(n)}$.`,
      idea: String.raw`Conditioning is averaging: $\delta^*$ replaces each value of $\delta$ by its average over all the data sets that share the same value of $T$, and averaging cannot increase spread. Formally $\operatorname{Var}\delta=\operatorname{Var}E[\delta\mid T]+E\operatorname{Var}(\delta\mid T)$, and the second term is what is thrown away; in Hilbert-space terms $\delta^*$ is the orthogonal projection of $\delta$ onto the functions of $T$ (rca-4.11), and for convex losses the inequality is Jensen's (rca-3.3). Sufficiency is what makes $\delta^*$ usable: data sets with the same $T$ have proportional likelihoods (stat-2.3), so the average over them does not depend on $\theta$. Conditioning on a statistic that is not sufficient produces a "better estimator" that requires knowing $\theta$.`,
      caption: String.raw`Left: 2,000 simulated samples, each at its sufficient statistic $T$ (across, slightly jittered) and its crude estimate $\delta$ (up). Within each column of equal $T$ the green dots are the simulated averages of $\delta$, and the green line is $E[\delta\mid T]$ computed exactly: Rao–Blackwell replaces every sample's estimate by its column's average. Middle: the likelihoods of four simulated samples from the column you click: with $T$ sufficient they coincide exactly, which is why the average cannot depend on $\theta$. Bottom: the crude estimates (orange) and the Rao–Blackwellized ones (green) share their centre, the target, while the spread collapses. Switch to conditioning on $X_2$ alone: the column averages are flat at the unknown $\tau(\theta)$, the likelihoods in a column disagree, and the result is not a statistic.`,
      deps: ['stat-4.8', 'stat-2.2', 'rca-3.3', 'rca-4.11'],
      see: ['stat-2.3', 'stat-4.14'],
      refs: ['Casella–Berger §7.3', 'Wasserman §9.13'],
      tags: ['sufficiency', 'Rao–Blackwell', 'conditioning'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rao%E2%80%93Blackwell_theorem' },
      viz(v) {
        const CASES = {
          pl: { lab: 'Poisson, $\\lambda$', fam: 'P', lo: 0.3, hi: 4, def: 1.5, p: 'λ', crude: '$X_1$', rbTex: '\\bar X', tau: (t) => t },
          pe: { lab: 'Poisson, $e^{-\\lambda}$', fam: 'P', lo: 0.3, hi: 3, def: 1, p: 'λ', crude: '$\\mathbf 1\\{X_1=0\\}$', rbTex: '(1-\\frac1n)^T', tau: (t) => Math.exp(-t) },
          bq: { lab: 'Bernoulli, $p^2$', fam: 'B', lo: 0.1, hi: 0.9, def: 0.5, p: 'p', crude: '$X_1X_2$', rbTex: '\\frac{T(T-1)}{n(n-1)}', tau: (t) => t * t },
          un: { lab: 'uniform $(0,\\theta)$, $\\theta$', fam: 'U', lo: 0.5, hi: 3, def: 1, p: 'θ', crude: '$2X_1$', rbTex: '\\frac{n+1}{n}X_{(n)}', tau: (t) => t },
        };
        let tS = null, pick = null;
        const cS = v.select('model and target', Object.entries(CASES).map(([value, o]) => ({ value, label: o.lab })), 'pl', { onChange: (k) => { pick = null; tS.set((CASES[k].def - CASES[k].lo) / (CASES[k].hi - CASES[k].lo)); } });
        const condS = v.select('condition on', [{ value: 'T', label: 'the sufficient $T$' }, { value: 'X2', label: '$X_2$ alone (not sufficient)' }], 'T', { onChange: () => { pick = null; } });
        tS = v.slider('true parameter', 0, 1, (1.5 - 0.3) / 3.7, { step: 0.005, fmt: (u) => { const g = CASES[cS.value]; return `${g.p} = ${v.fix(g.lo + u * (g.hi - g.lo), 2)}`; } });
        const nS = v.slider('sample size $n$', 2, 20, 6, { int: true });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: 'sufficient statistic $T$', ylabel: 'crude estimate $\\delta$', title: 'average the crude estimate within each column' });
        const sC = v.stage({ x: [0, 1], y: [0, 1.12], axes: 'box', gutter: true, height: 320, weight: 0.85, minWidth: 230, xlabel: 'parameter', ylabel: 'likelihood ÷ its maximum', title: 'four samples from the clicked column' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'estimate', title: 'crude versus Rao–Blackwellized, 2,000 samples' });
        const par = () => { const g = CASES[cS.value]; return g.lo + tS.value * (g.hi - g.lo); };
        const R = repeater_(v, {
          key: () => [cS.value, tS.value.toFixed(4), nS.value].join('|'),
          sample: (r) => {
            const g = CASES[cS.value], t = par(), n = nS.value, xs = new Float64Array(n);
            for (let i = 0; i < n; i++) xs[i] = g.fam === 'P' ? rpois(r, t) : g.fam === 'B' ? (r() < t ? 1 : 0) : t * r();
            return xs;
          },
        });
        const crude = (k, xs) => (k === 'pl' ? xs[0] : k === 'pe' ? (xs[0] === 0 ? 1 : 0) : k === 'bq' ? xs[0] * xs[1] : 2 * xs[0]);
        const suff = (k, xs) => { if (k === 'un') { let m = 0; for (const x of xs) m = Math.max(m, x); return m; } let s = 0; for (const x of xs) s += x; return s; };
        const rb = (k, n, T) => (k === 'pl' ? T / n : k === 'pe' ? Math.pow(1 - 1 / n, T) : k === 'bq' ? (T * (T - 1)) / (n * (n - 1)) : ((n + 1) / n) * T);
        // E[δ | X₂] for the non-sufficient conditioning: involves the unknown parameter
        const rbX2 = (k, t, x2) => (k === 'pl' ? t : k === 'pe' ? Math.exp(-t) : k === 'bq' ? t * x2 : t);
        const exVar = (k, n, t) => {
          if (k === 'pl') return [t, t / n];
          if (k === 'pe') { const c = 1 - 1 / n; return [Math.exp(-t) * (1 - Math.exp(-t)), Math.exp(n * t * (c * c - 1)) - Math.exp(-2 * t)]; }
          if (k === 'bq') { let m = 0, m2 = 0; for (let y = 0; y <= n; y++) { const p = dbinom(y, n, t), u = rb(k, n, y); m += p * u; m2 += p * u * u; } return [t * t * (1 - t * t), m2 - m * m]; }
          return [(t * t) / 3, (t * t) / (n * (n + 2))];
        };
        // normalized likelihood of a sample over the parameter grid
        const lik = (k, xs, t) => {
          const g = CASES[k], n = xs.length;
          if (g.fam === 'P') { let s = 0; for (const x of xs) s += x; return s * Math.log(t) - n * t; }
          if (g.fam === 'B') { let s = 0; for (const x of xs) s += x; return (s ? s * Math.log(t) : 0) + (n - s ? (n - s) * Math.log(1 - t) : 0); }
          let m = 0; for (const x of xs) m = Math.max(m, x); return t >= m ? -n * Math.log(t) : -Infinity;
        };
        let geom = null;
        sA.onClick((x) => { pick = x; });
        let info = null;
        v.render(() => {
          const k = cS.value, g = CASES[k], n = nS.value, t = par(), cond = condS.value, S = R.sync(), D = S.vals, tau = g.tau(t);
          const disc = g.fam !== 'U' || cond === 'X2' && g.fam !== 'U';
          const xOf = (xs) => (cond === 'T' ? suff(k, xs) : xs[1]);
          const discreteX = g.fam !== 'U';
          // left: scatter (T or X₂, δ)
          const X = D.map(xOf), Y = D.map((xs) => crude(k, xs));
          const xs0 = sortNum(X); let x0 = Math.min(0, qSorted(xs0, 0)), x1 = qSorted(xs0, 0.998);
          if (discreteX) { x0 -= 0.7; x1 += 0.7; } else { x1 = cond === 'T' ? t * 1.04 : t * 1.04; x0 = cond === 'T' ? Math.max(0, qSorted(xs0, 0.002) - 0.05 * t) : -0.04 * t; }
          const ys0 = sortNum(Y), y0 = Math.min(0, qSorted(ys0, 0)) - 0.08 * (qSorted(ys0, 0.995) - Math.min(0, ys0[0]) || 1), y1 = Math.max(qSorted(ys0, 0.995), tau) * 1.12 + 0.05;
          sA.setView([x0, x1], [y0, y1]);
          sA.setLabels(cond === 'T' ? (g.fam === 'U' ? 'sufficient statistic $T=X_{(n)}$' : 'sufficient statistic $T=\\sum X_i$') : 'conditioning statistic $X_2$', `crude estimate ${g.crude}`);
          const jr = mulberry(5), pts = [];
          const yDisc = k !== 'un';
          for (let i = 0; i < Math.min(D.length, 2000); i++) pts.push([X[i] + (discreteX ? (jr() - 0.5) * 0.5 : 0), Y[i] + (yDisc ? (jr() - 0.5) * 0.06 * (y1 - y0) : 0)]);
          sA.dots(pts, { r: 1.7, color: 'orange', alpha: 0.28 });
          sA.hline(tau, { color: 'green', width: 1, dash: [3, 4], alpha: 0.7 });
          // column averages
          const cols = new Map();
          const keyOf = (x) => (discreteX ? x : Math.floor(((x - x0) / (x1 - x0)) * 24));
          D.forEach((xs, i) => { const kk = keyOf(X[i]); const c = cols.get(kk) || { s: 0, c: 0, x: 0 }; c.s += Y[i]; c.c++; c.x += X[i]; cols.set(kk, c); });
          for (const c of cols.values()) if (c.c >= 3) sA.dot(c.x / c.c, c.s / c.c, { r: 2.5 + 7 * Math.sqrt(c.c / D.length), color: cond === 'T' ? 'green' : 'red', alpha: 0.9 });
          if (cond === 'T') {
            if (discreteX) { const pl = []; for (let T = 0; T <= Math.ceil(x1); T++) pl.push([T, rb(k, n, T)]); sA.path(pl, { color: 'green', width: 2.2 }); }
            else sA.fn((T) => rb(k, n, T), { domain: [x0, x1], color: 'green', width: 2.4 });
          } else {
            if (k === 'bq') sA.path([[0, rbX2(k, t, 0)], [1, rbX2(k, t, 1)]], { color: 'red', width: 2.4 });
            else sA.hline(rbX2(k, t, 0), { color: 'red', width: 2.4 });
            sA.text(`= ${k === 'bq' ? 'p·X₂' : 'τ(' + g.p + ')'}: needs the unknown ${g.p}`, x1, rbX2(k, t, 1), { color: 'red', size: 12, weight: 700, align: 'right', dx: -6, dy: -12, plate: true });
          }
          // pick a column: default the most populated
          let colX = pick;
          if (colX == null) { let best = null; for (const [kk, c] of cols) if (!best || c.c > best.c) best = { kk, c: c.c, x: c.x / c.c }; colX = best ? best.x : 0; }
          const inCol = (xs) => (discreteX ? Math.round(xOf(xs)) === Math.round(colX) : keyOf(xOf(xs)) === keyOf(colX));
          const members = D.filter(inCol).slice(0, 4);
          if (discreteX) sA.vband(Math.round(colX) - 0.4, Math.round(colX) + 0.4, { color: 'accent', alpha: 0.1, edges: true });
          else { const w = (x1 - x0) / 24, b = keyOf(colX); sA.vband(x0 + b * w, x0 + (b + 1) * w, { color: 'accent', alpha: 0.1, edges: true }); }
          // middle: likelihoods of the column's samples
          const gr = [g.lo * 0.5, g.fam === 'B' ? 0.99 : g.hi * 1.4];
          if (g.fam === 'B') gr[0] = 0.01;
          sC.setView(gr, [0, 1.12]); sC.setLabels(`$${g.p === 'λ' ? '\\lambda' : g.p === 'θ' ? '\\theta' : 'p'}$`);
          const COLS = ['accent', 'pink', 'teal', 'gold'], DASH = [null, [10, 6], [4, 5], [2, 7]];
          members.forEach((xs, j) => {
            const G = 300, vals = []; let mx = -Infinity;
            for (let i = 0; i <= G; i++) { const u = gr[0] + ((gr[1] - gr[0]) * i) / G, y = lik(k, xs, u); vals.push([u, y]); if (y > mx) mx = y; }
            sC.path(vals.map(([u, y]) => [u, Number.isFinite(y) ? Math.exp(y - mx) : 0]), { color: COLS[j], width: j === 0 ? 4 : 2.2, dash: DASH[j] || undefined });
          });
          sC.vline(t, { color: 'green', width: 1.4, dash: [3, 4] });
          const fmtS = (xs) => Array.from(xs, (x) => (g.fam === 'U' ? x.toFixed(2) : String(x))).slice(0, g.fam === 'U' ? 4 : 8).join(' ') + (xs.length > (g.fam === 'U' ? 4 : 8) ? ' …' : '');
          members.forEach((xs, j) => sC.text(fmtS(xs), gr[1], 1.1 - j * 0.075, { color: COLS[j], size: 11, align: 'right', dx: -6, baseline: 'top', plate: true }));
          // bottom: histograms of crude and improved
          const imp = D.map((xs) => (cond === 'T' ? rb(k, n, suff(k, xs)) : rbX2(k, t, xs[1])));
          const all = sortNum(Y.concat(imp)); let lo = Math.min(qSorted(all, 0.002), tau), hi = Math.max(qSorted(all, 0.995), tau);
          const pd = 0.06 * (hi - lo || 1); lo -= pd; hi += pd;
          const B1 = binned(Y, lo, hi, 60), B2 = binned(imp, lo, hi, 60);
          sB.setView([lo, hi], [0, Math.max(B1.max, Math.min(B2.max, 4 * B1.max + 1)) * 1.15 || 1]);
          sB.hist(B1, { density: true, color: 'orange', fillAlpha: 0.3, width: 1.4 });
          sB.hist(B2, { density: true, color: cond === 'T' ? 'green' : 'red', fillAlpha: 0.35, width: 1.6 });
          sB.vline(tau, { color: 'ink', width: 2 });
          sB.text('target', tau, sB.bounds.y[1], { color: 'ink', size: 12, dx: 6, dy: 8, baseline: 'top', align: 'left', plate: true });
          v.legend([['orange', 'crude ' + g.crude, { area: true }], [cond === 'T' ? 'green' : 'red', cond === 'T' ? `$E[\\delta\\mid T]=${g.rbTex}$` : '$E[\\delta\\mid X_2]$ (not a statistic)', { area: true }], ['ink', 'target $\\tau(\\theta)$']]);
          const [vc, vr] = exVar(k, n, t);
          info = { k, g, n, t, cond, tau, mc: mean(Y), mi: mean(imp), vcs: varN(Y), vis: varN(imp), vc, vr, N: D.length, members, colX };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info;
          let s = String.raw`$${I.g.p === 'λ' ? '\\lambda' : I.g.p === 'θ' ? '\\theta' : 'p'}=${v.fix(I.t, 2)}$, $n=${I.n}$, target ${v.fix(I.tau, 4)} · crude: mean ${v.fix(I.mc, 4)}, variance ${v.fix(I.vcs, 4)} (exact ${v.fix(I.vc, 4)})`;
          if (I.cond === 'T') s += String.raw` · Rao–Blackwellized $${I.g.rbTex}$: mean ${v.fix(I.mi, 4)}, variance **${v.fix(I.vis, 4)}** (exact ${v.fix(I.vr, 4)}) — **${pct(1 - I.vr / I.vc, 1)} of the variance removed, same centre** · the ${I.members.length} likelihoods in the column coincide: $T$ is sufficient`;
          else s += ` · conditioning on $X_2$ gives ${I.k === 'bq' ? '$p\\,X_2$' : 'the constant $\\tau(\\theta)$'}, which **cannot be computed without the unknown parameter**: $X_2$ is not sufficient, and the likelihoods in a column differ`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Lehmann–Scheffé theorem',
      credit: 'Lehmann & Scheffé, 1950',
      statement: String.raw`Let $T$ be a **complete** sufficient statistic (stat-2.8) for $\{P_\theta\}$. If $\delta(X)$ is any unbiased estimator of $\tau(\theta)$ with finite variance, then $\delta^*=E[\delta\mid T]$ is the unique UMVUE of $\tau(\theta)$. Equivalently: any function $g(T)$ with $E_\theta g(T)=\tau(\theta)$ for all $\theta$ is the UMVUE, and it is unique up to null sets. So with a complete sufficient statistic in hand, finding the best unbiased estimator reduces to finding *some* unbiased function of $T$.

Examples: in $N(\mu,\sigma^2)$, $\bar X$ and $S^2$ are the UMVUEs of $\mu$ and $\sigma^2$; for Poisson data $\bar X$ is the UMVUE of $\lambda$ and $(1-\tfrac1n)^{\sum X_i}$ that of $e^{-\lambda}$; for $\mathrm{Uniform}(0,\theta)$, $\tfrac{n+1}{n}X_{(n)}$. Without completeness uniqueness fails: for $\mathrm{Uniform}(\theta,\theta+1)$ the minimal sufficient statistic $(X_{(1)},X_{(n)})$ is not complete, there are many unbiased functions of it, and no UMVUE of $\theta$ exists.`,
      idea: String.raw`If $g_1(T)$ and $g_2(T)$ are both unbiased for $\tau(\theta)$, then $E_\theta[g_1(T)-g_2(T)]=0$ for every $\theta$, and completeness says exactly that such a function must vanish: $g_1=g_2$. So every unbiased estimator, Rao–Blackwellized on $T$ (stat-4.9), lands on the same function $g(T)$, and by Rao–Blackwell that function has variance no larger than any of them. Completeness rules out non-trivial unbiased estimators of zero; full-rank exponential families supply it (stat-2.9). The normal case also shows Basu's theorem at work: $\operatorname{median}-\bar X$ is ancillary, hence independent of $\bar X$, so $E[\operatorname{median}\mid\bar X]=\bar X$.`,
      caption: String.raw`Left: three different unbiased starting estimators, simulated 4,000 times and averaged within narrow columns of the complete sufficient statistic $T$; the three sets of column averages (blue, orange, purple) all fall on the same green line, the UMVUE $g(T)$: for the normal mean $X_1$, the median and the midrange all average to $\bar X$; for the Poisson mean $X_1$, $S^2$ and $2X_1-X_2$ all average to $\bar X$. Right: the starters' sampling distributions differ, but all three Rao–Blackwellize to the one narrow green distribution. Choose $\mathrm{Uniform}(\theta,\theta+1)$: the sufficient statistic is not complete, the three unbiased estimators are already functions of it and stay different (left: each against the midrange), and their difference is an unbiased estimator of zero.`,
      deps: ['stat-4.9', 'stat-2.8'],
      see: ['stat-2.9', 'stat-2.10'],
      refs: ['Casella–Berger §7.3'],
      tags: ['completeness', 'UMVUE', 'Lehmann–Scheffé'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lehmann%E2%80%93Scheff%C3%A9_theorem' },
      viz(v) {
        const mS = v.select('model', [{ value: 'norm', label: 'normal mean (complete)' }, { value: 'pois', label: 'Poisson mean (complete)' }, { value: 'unif', label: 'uniform $(\\theta,\\theta+1)$ (not complete)' }], 'norm');
        const nS = v.slider('sample size $n$', 3, 15, 5, { int: true });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: '$T$', ylabel: 'column average of the starter', title: 'Rao–Blackwellize three starters' });
        const sR = v.stage({ x: [0, 1], y: [0.3, 4.7], axes: 'box', gutter: { l: 84 }, height: 360, weight: 0.9, minWidth: 240, xlabel: 'estimate', title: 'starters and where they land' });
        const SPEC = {
          norm: { th: 1, st: [['X₁', 'accent'], ['median', 'orange'], ['midrange', 'purple']], T: 'X̄' },
          pois: { th: 2, st: [['X₁', 'accent'], ['S²', 'orange'], ['2X₁ − X₂', 'purple']], T: 'ΣX' },
          unif: { th: 1, st: [['min − 1/(n+1)', 'accent'], ['max − n/(n+1)', 'orange'], ['midrange − ½', 'purple']], T: 'midrange' },
        };
        const mc = memo();
        const sim = (m, n) => mc(m + '|' + n, () => {
          const r = v.rng(hashStr(`ls|${m}|${n}`)), th = SPEC[m].th, out = [], xs = new Float64Array(n);
          for (let c = 0; c < 4000; c++) {
            let s = 0, mn = Infinity, mx = -Infinity;
            for (let i = 0; i < n; i++) { const x = m === 'norm' ? th + r.normal() : m === 'pois' ? rpois(r, th) : th + r(); xs[i] = x; s += x; mn = Math.min(mn, x); mx = Math.max(mx, x); }
            if (m === 'norm') out.push({ T: s / n, d: [xs[0], med(xs), 0.5 * (mn + mx)], g: s / n });
            else if (m === 'pois') out.push({ T: s, d: [xs[0], s2(xs), 2 * xs[0] - xs[1]], g: s / n });
            else out.push({ T: 0.5 * (mn + mx), d: [mn - 1 / (n + 1), mx - n / (n + 1), 0.5 * (mn + mx) - 0.5], g: null, rng: mx - mn });
          }
          return out;
        });
        let info = null;
        v.render(() => {
          const m = mS.value, n = nS.value, sp = SPEC[m], D = sim(m, n), th = sp.th;
          const Ts = sortNum(D.map((d) => d.T));
          let x0 = qSorted(Ts, 0.005), x1 = qSorted(Ts, 0.995);
          if (m === 'pois') { x0 -= 0.6; x1 += 0.6; }
          const yr = m === 'pois' ? [x0 / n - 0.6, x1 / n + 0.6] : [x0 - 0.35 * (x1 - x0), x1 + 0.35 * (x1 - x0)];
          sL.setView([x0, x1], yr);
          sL.setLabels(`$T=${m === 'norm' ? '\\bar X' : m === 'pois' ? '\\sum X_i' : '\\tfrac12(X_{(1)}+X_{(n)})'}$`, m === 'unif' ? 'the estimator itself' : 'column average of the starter');
          const g = (T) => (m === 'pois' ? T / n : m === 'norm' ? T : T - 0.5);
          if (m === 'unif') {
            const jr = mulberry(9);
            sp.st.forEach(([lab, col], j) => sL.dots(D.slice(0, 1500).map((d) => [d.T + (jr() - 0.5) * 0.002, d.d[j]]), { r: 1.6, color: col, alpha: 0.35 }));
            sL.fn(g, { domain: [x0, x1], color: 'purple', width: 2 });
          } else {
            sL.fn(g, { domain: [x0, x1], color: 'green', width: 3 });
            const NB = m === 'pois' ? null : 16, cols = new Map();
            for (const d of D) { const kk = m === 'pois' ? d.T : Math.floor(((d.T - x0) / (x1 - x0)) * NB); if (kk < 0 || (NB && kk >= NB)) continue; const c = cols.get(kk) || { c: 0, x: 0, s: [0, 0, 0] }; c.c++; c.x += d.T; for (let j = 0; j < 3; j++) c.s[j] += d.d[j]; cols.set(kk, c); }
            const off = (x1 - x0) * 0.008;
            for (const c of cols.values()) if (c.c >= 12) sp.st.forEach(([, col], j) => sL.dot(c.x / c.c + (j - 1) * off * (m === 'pois' ? 12 : 1), c.s[j] / c.c, { r: 3.6, color: col }));
          }
          // right: rows of starters plus the landing distribution
          const rows = m === 'unif' ? 3 : 4;
          const all = sortNum(D.flatMap((d) => d.d)); const lo = qSorted(all, 0.01), hi = qSorted(all, 0.99);
          sR.setView([Math.min(lo, th - 0.1), Math.max(hi, th + 0.1)], [0.3, rows + 0.7]);
          const ticks = sp.st.map(([lab], j) => [rows - j, lab]); if (rows === 4) ticks.push([1, 'E[· | T]']);
          sR.setTicks(null, ticks);
          sR.vline(th, { color: 'ink', width: 1.6 });
          const sds = sp.st.map(([lab, col], j) => { const vals = D.map((d) => d.d[j]); strip(sR, vals, rows - j, 0.3, { color: col, alpha: 0.3, r: 1.6, seed: 40 + j, max: 1200 }); return Math.sqrt(varN(vals)); });
          let sdg = null;
          if (rows === 4) { const gv = D.map((d) => d.g); strip(sR, gv, 1, 0.3, { color: 'green', alpha: 0.35, r: 1.6, seed: 50, max: 1200 }); sdg = Math.sqrt(varN(gv)); }
          v.legend(sp.st.map(([lab, col]) => [col, lab, { dot: true }]).concat(m === 'unif' ? [['purple', 'midrange − ½ (the identity line)']] : [['green', `UMVUE $g(T)=\\bar X$`]]));
          let zero = null; if (m === 'unif') { const z = D.map((d) => d.rng - (n - 1) / (n + 1)); zero = { m: mean(z), sd: Math.sqrt(varN(z)) }; }
          const means = sp.st.map((_, j) => mean(D.map((d) => d.d[j])));
          info = { m, n, sp, sds, sdg, means, zero, th };
        });
        v.readout(() => {
          if (!info) return '';
          const { m, n, sp, sds, sdg, means, zero, th } = info;
          let s = `$n=${n}$, truth ${th}: means of the starters ` + sp.st.map(([lab], j) => `${lab} ${v.fix(means[j], 3)}`).join(', ') + ' (all unbiased) · SDs ' + sds.map((x) => v.fix(x, 3)).join(', ');
          if (m !== 'unif') s += ` · **all three Rao–Blackwellize to the same $\\bar X$**, SD ${v.fix(sdg, 3)} (exact ${v.fix(Math.sqrt((m === 'pois' ? th : 1) / n), 3)}): the unique UMVUE`;
          else s += ` · **not complete**: $X_{(n)}-X_{(1)}-\\tfrac{n-1}{n+1}$ has mean ${v.fix(zero.m, 4)} for every θ yet SD ${v.fix(zero.sd, 3)} — a non-zero unbiased estimator of 0, so no single best function of $(X_{(1)},X_{(n)})$ exists`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Proposition',
      name: 'German tank problem',
      credit: 'Ruggles & Brodie, 1947',
      statement: String.raw`Serial numbers $1,2,\dots,N$ are in use and $n$ of them are observed, drawn at random without replacement; $N$ is unknown. The maximum $M=X_{(n)}$ is a complete sufficient statistic, with $P(M=m)=\binom{m-1}{n-1}\big/\binom Nn$ and $E M=\tfrac{n(N+1)}{n+1}$. Hence by Lehmann–Scheffé the UMVUE of $N$ is
$$\hat N=\frac{n+1}{n}M-1=M+\frac{M}{n}-1,\qquad \operatorname{Var}\hat N=\frac{(N-n)(N+1)}{n(n+2)}\approx\frac{N^2}{n^2}.$$
The maximum itself underestimates ($M\le N$ always), and the unbiased moment estimator $2\bar X-1$ has the much larger variance $\frac{(N+1)(N-n)}{3n}$.`,
      idea: String.raw`Given $M=m$, the other $n-1$ serials are a uniform random subset of $\{1,\dots,m-1\}$, whatever $N$ is: $M$ is sufficient, and completeness follows because the equations $E_N g(M)=0$ for $N=n,n+1,\dots$ force $g(n)=0$, then $g(n+1)=0$, and so on. So the unbiased function of $M$ is the best unbiased estimator (stat-4.10). Its form has a clean reading: the $n$ observed serials cut $\{1,\dots,M\}$ into gaps of average size $(M-n)/n$, and the estimate adds one average gap above the maximum. It is the discrete twin of the uniform endpoint (stat-3.13, stat-4.7), with variance falling like $1/n^2$. In the Second World War, Allied statisticians estimated German tank production from the serial numbers on captured tanks and their parts; the postwar records showed these estimates far closer to the truth than conventional intelligence.`,
      caption: String.raw`Top: the serials $1,\dots,N$ with one simulated capture of $n$ tanks (gold), and the three estimates from that sample. Below: 2,000 repeated captures; each row is the sampling distribution of one estimator, with the true $N$ (green). The maximum (red) is always short; $2\bar X-1$ (orange) is centred on $N$ but wide; the UMVUE $\tfrac{n+1}{n}M-1$ (blue, with its exact distribution in black) is centred and tight. The readout compares mean squared errors, simulated and exact. Raise $n$: the UMVUE's spread shrinks like $1/n$, the moment estimator's only like $1/\sqrt n$.`,
      deps: ['stat-4.10', 'stat-3.13'],
      see: ['stat-4.7'],
      refs: ['Casella–Berger §7.3'],
      tags: ['UMVUE', 'German tank', 'order statistics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/German_tank_problem' },
      viz(v) {
        const NS = v.slider('true number of tanks $N$', 30, 1000, 250, { int: true, log: true });
        const nS = v.slider('tanks captured $n$', 2, 30, 5, { int: true });
        let seed = 0; v.button('Capture another sample', () => { seed++; });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 110, full: true, title: 'serial numbers in use, and one capture' });
        const sH = v.stage({ x: [0, 1], y: [0.3, 3.75], axes: 'box', gutter: { l: 96 }, height: 330, full: true, xlabel: 'estimate of $N$', title: '2,000 repeated captures' });
        const drawSample = (r, N, n) => { const set = new Set(); while (set.size < n) set.add(1 + Math.floor(r() * N)); return Array.from(set); };
        const ests = (s, n) => { let m = 0, sum = 0; for (const x of s) { m = Math.max(m, x); sum += x; } return [m, ((n + 1) / n) * m - 1, (2 * sum) / n - 1]; };
        const mc = memo(), ms = memo();
        const reps = (N, n) => mc(N + '|' + n, () => { const r = v.rng(hashStr(`tank|${N}|${n}`)), out = [[], [], []]; for (let c = 0; c < 2000; c++) { const e = ests(drawSample(r, N, n), n); for (let j = 0; j < 3; j++) out[j].push(e[j]); } return out; });
        const one = (N, n, sd) => ms([N, n, sd].join('|'), () => drawSample(v.rng(hashStr(`tank1|${N}|${n}|${sd}`)), N, n).sort((a, b) => a - b));
        const ROWS = [{ lab: 'maximum M', col: 'red' }, { lab: '(n+1)/n·M − 1', col: 'accent' }, { lab: '2X̄ − 1', col: 'orange' }];
        let info = null;
        v.render(() => {
          const N = NS.value, n = Math.min(nS.value, N), R = reps(N, n), cap = one(N, n, seed), e1 = ests(cap, n), xr = [0, 1.75 * N];
          // top strip
          sT.setView(xr, [0, 1]);
          sT.rect(1, 0.38, N, 0.62, { fill: 'muted', fillAlpha: 0.13, color: 'muted', width: 1, radius: 4 });
          for (const x of cap) sT.line(x, 0.34, x, 0.66, { color: 'gold', width: 2.6 });
          sT.text('1', 1, 0.2, { color: 'muted', size: 11, align: 'center' }); sT.text(`N = ${N}`, N, 0.2, { color: 'green', size: 12, weight: 700, align: 'center' });
          sT.line(N, 0.3, N, 0.7, { color: 'green', width: 2 });
          ROWS.forEach((rw, j) => { sT.dot(e1[j], 0.85, { r: 5, color: rw.col }); });
          sT.text(`this capture: ${cap.length <= 12 ? cap.join(', ') : cap.slice(0, 12).join(', ') + ', …'}`, xr[1], 0.85, { color: 'ink', size: 11.5, align: 'right', dx: -4, plate: true });
          // histograms as rows
          sH.setView(xr, [0.3, 3.75]);
          sH.setTicks(null, ROWS.map((rw, j) => [3 - j, rw.lab]));
          const NB = 70, w = (xr[1] - xr[0]) / NB;
          const stats = ROWS.map((rw, j) => {
            const vals = R[j], B = binned(vals, xr[0], xr[1], NB), y0 = 3 - j - 0.42, sc = 0.8 / (Math.max(...B.counts) || 1);
            B.counts.forEach((c, i) => { if (c) sH.rect(B.edges[i], y0, B.edges[i + 1], y0 + c * sc, { fill: rw.col, fillAlpha: 0.55, stroke: false }); });
            if (j === 1) {
              // exact pmf of the UMVUE, binned the same way
              const pm = new Array(NB).fill(0), lc = lchoose(N, n);
              for (let m = n; m <= N; m++) { const p = Math.exp(lchoose(m - 1, n - 1) - lc), x = ((n + 1) / n) * m - 1, b = Math.floor((x - xr[0]) / w); if (b >= 0 && b < NB) pm[b] += p; }
              const pts = []; pm.forEach((p, i) => { pts.push([B.edges[i], y0 + p * 2000 * sc]); pts.push([B.edges[i + 1], y0 + p * 2000 * sc]); });
              sH.path(pts, { color: 'ink', width: 1.4 });
            }
            const mse = mean(vals.map((x) => (x - N) ** 2)), m = mean(vals);
            sH.dot(m, y0 - 0.06, { r: 3.5, color: 'ink' });
            return { m, mse };
          });
          sH.vline(N, { color: 'green', width: 2.2 });
          const EM = (n * (N + 1)) / (n + 1), VM = (n * (N + 1) * (N - n)) / ((n + 1) ** 2 * (n + 2));
          const exact = [VM + (EM - N) ** 2, ((N - n) * (N + 1)) / (n * (n + 2)), ((N + 1) * (N - n)) / (3 * n)];
          v.legend(ROWS.map((rw) => [rw.col, rw.lab, { area: true }]).concat([['ink', 'exact distribution of the UMVUE · mean of each row'], ['green', 'true N'], ['gold', 'captured serials']]));
          info = { N, n, stats, exact, e1 };
        });
        v.readout(() => {
          if (!info) return '';
          const { N, n, stats, exact, e1 } = info;
          return String.raw`this capture: $M=${e1[0]}$, $\hat N=${v.fix(e1[1], 1)}$, $2\bar X-1=${v.fix(e1[2], 1)}$ · over 2,000 captures of $n=${n}$ from $N=${N}$: ` + ROWS.map((rw, j) => `${rw.lab}: mean ${v.fix(stats[j].m, 1)}, root-MSE ${v.fix(Math.sqrt(stats[j].mse), 1)} (exact ${v.fix(Math.sqrt(exact[j]), 1)})`).join(' · ') + ` · **the UMVUE's MSE is ${v.fix(exact[2] / exact[1], 1)} times smaller than the moment estimator's**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Paradox',
      name: 'An absurd unbiased estimator',
      statement: String.raw`Let $X\sim\mathrm{Poisson}(\lambda)$ be a single observation and $\tau(\lambda)=e^{-2\lambda}=P(\text{no event in twice the time})$, a number in $(0,1)$. The only unbiased estimator of $\tau$ is
$$\delta(X)=(-1)^X=\begin{cases}+1,&X\text{ even},\\-1,&X\text{ odd},\end{cases}$$
since $E_\lambda(-1)^X=e^{-\lambda}\sum_k(-\lambda)^k/k!=e^{-2\lambda}$, and any unbiased $\delta$ must satisfy $\sum_k\delta(k)\lambda^k/k!=e^{-\lambda}$ for all $\lambda$, which fixes the power-series coefficients $\delta(k)=(-1)^k$. Because $X$ is complete and sufficient, $(-1)^X$ is therefore the UMVUE — yet it estimates a probability by $-1$ with probability $\tfrac12(1-e^{-2\lambda})$, and it is dominated in mean squared error by the biased $\max\{0,(-1)^X\}$ and by the MLE $e^{-2X}$.`,
      idea: String.raw`Completeness (stat-4.10) makes unbiased estimators unique, and here the unique one is a function that ignores everything about $X$ except its parity. Averaged over many replications the $\pm1$ values do settle at $e^{-2\lambda}$, which is all unbiasedness promises; it says nothing about any single estimate being sensible. The paradox is a warning against treating unbiasedness, or the UMVUE, as an end in itself: truncating to the parameter space introduces bias but lowers the error for every $\lambda$, so the "best unbiased" estimator is inadmissible.`,
      caption: String.raw`Left: independent single counts $X$, each giving the estimate $+1$ (even, top row) or $-1$ (odd, bottom row), with the running average (blue) closing in on $e^{-2\lambda}$ (green). Every individual estimate is off by at least $1-e^{-2\lambda}$, and the red ones are outside $[0,1]$, where no probability lives. Right: exact mean squared errors over $\lambda$: the unbiased $(-1)^X$ (red), the truncated $\max\{0,(-1)^X\}$ (orange) and the maximum-likelihood $e^{-2X}$ (blue) — the unbiased one is worst for every $\lambda$; dots are simulated MSEs at the current $\lambda$.`,
      deps: ['stat-4.10'],
      see: ['stat-4.13'],
      refs: ['Casella–Berger §7.3'],
      tags: ['unbiasedness', 'paradox', 'admissibility'],
      viz(v) {
        const lS = v.slider('$\\lambda$', 0.05, 3, 0.6, { step: 0.01 });
        const R = repeater_(v, { key: () => lS.value.toFixed(3), sample: (r) => rpois(r, lS.value), init: 300, buttons: [1, 100, 1000], clear: true });
        const sL = v.stage({ x: [0, 1], y: [-1.35, 1.35], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'replication', ylabel: 'estimate', title: 'single estimates and their running average' });
        const sR = v.stage({ x: [0, 3], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 0.85, xlabel: '$\\lambda$', ylabel: 'MSE', title: 'mean squared error, exact' });
        const mseU = (l) => 1 - Math.exp(-4 * l);
        const mseT = (l) => { const t = Math.exp(-2 * l), pe = (1 + t) / 2; return pe * (1 - t) ** 2 + (1 - pe) * t * t; };
        const mseM = (l) => Math.exp(l * (Math.exp(-4) - 1)) - 2 * Math.exp(-2 * l) * Math.exp(l * (Math.exp(-2) - 1)) + Math.exp(-4 * l);
        let info = null;
        v.render(() => {
          const l = lS.value, tau = Math.exp(-2 * l), X = R.sync().vals, K = X.length;
          sL.setView([0, Math.max(10, K)], [-1.35, 1.35]);
          sL.hband(0, 1, { color: 'green', alpha: 0.07 });
          sL.hline(tau, { color: 'green', width: 2.2 });
          const up = [], dn = [];
          const step = Math.max(1, Math.floor(K / 1500));
          for (let i = 0; i < K; i += step) (X[i] % 2 ? dn : up).push([i + 1, X[i] % 2 ? -1 : 1]);
          sL.dots(up, { r: 2.4, color: 'gold', alpha: 0.6 }); sL.dots(dn, { r: 2.4, color: 'red', alpha: 0.6 });
          const run = []; let s = 0; for (let i = 0; i < K; i++) { s += X[i] % 2 ? -1 : 1; if (i % step === 0 || i === K - 1) run.push([i + 1, s / (i + 1)]); }
          sL.path(run, { color: 'accent', width: 2.4 });
          sL.text('e^(−2λ)', Math.max(10, K), tau, { color: 'green', size: 12, weight: 700, align: 'right', dx: -6, dy: tau > 0.75 ? 14 : -12, plate: true });
          sR.hline(1, { color: 'faint', width: 1 });
          sR.fn(mseU, { domain: [0, 3], color: 'red', width: 2.6 });
          sR.fn(mseT, { domain: [0, 3], color: 'orange', width: 2.4 });
          sR.fn(mseM, { domain: [0, 3], color: 'accent', width: 2.4 });
          sR.vline(l, { color: 'gold', width: 1.4, dash: [3, 4] });
          const simU = mean(X.map((x) => ((x % 2 ? -1 : 1) - tau) ** 2)), simT = mean(X.map((x) => ((x % 2 ? 0 : 1) - tau) ** 2)), simM = mean(X.map((x) => (Math.exp(-2 * x) - tau) ** 2));
          if (K) { sR.dot(l, simU, { r: 4.5, color: 'red' }); sR.dot(l, simT, { r: 4.5, color: 'orange' }); sR.dot(l, simM, { r: 4.5, color: 'accent' }); }
          v.legend([['gold', 'estimate +1 (X even)', { dot: true }], ['red', 'estimate −1 (X odd) · MSE of $(-1)^X$'], ['accent', 'running average · MSE of the MLE $e^{-2X}$'], ['orange', 'MSE of $\\max\\{0,(-1)^X\\}$'], ['green', 'target $e^{-2\\lambda}$']]);
          info = { l, tau, K, avg: K ? s / K : NaN, odd: X.filter((x) => x % 2).length };
        });
        v.readout(() => {
          if (!info) return '';
          const { l, tau, K, avg, odd } = info, se = Math.sqrt((1 - tau * tau) / Math.max(1, K));
          return String.raw`$\lambda=${v.fix(l, 2)}$: target $e^{-2\lambda}=${v.fix(tau, 4)}$ · running average of ${commas(K)} estimates **${v.fix(avg, 4)}** ± ${v.fix(2 * se, 4)} (unbiased ✓) · but ${pct(odd / Math.max(1, K), 1)} of the estimates are $-1$ (exact ${pct((1 - tau) / 2, 1)}), and none is ever within ${v.fix(Math.min(1 - tau, 1 + tau), 3)} of the target · exact MSE: unbiased ${v.fix(mseU(l), 4)}, truncated ${v.fix(mseT(l), 4)}, MLE ${v.fix(mseM(l), 4)} — **the UMVUE is beaten at every λ**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Proposition',
      name: 'Parameters with no unbiased estimator',
      credit: 'Halmos, 1946',
      statement: String.raw`A parametric function need not have any unbiased estimator. For $X\sim\mathrm{Binomial}(n,p)$, $0<p<1$, every estimator $\delta(X)$ has expectation
$$E_p\,\delta(X)=\sum_{k=0}^n\delta(k)\binom nk p^k(1-p)^{n-k},$$
a polynomial in $p$ of degree at most $n$. Conversely every polynomial of degree $\le n$ arises this way (the Bernstein polynomials $\binom nk p^k(1-p)^{n-k}$ form a basis). Hence $\tau(p)$ has an unbiased estimator if and only if $\tau$ is a polynomial of degree at most $n$. In particular the odds $p/(1-p)$, the reciprocal $1/p$, $\sqrt p$ and $\log p$ have no unbiased estimator from any fixed number of Bernoulli trials, and $p^{n+1}$ has none from $n$ trials.`,
      idea: String.raw`Unbiasedness is an identity in $p$, and for a finite sample space the expectation is a finite combination of the probabilities, which here are polynomials. A function that blows up at $p=0$, like $1/p$ or $p/(1-p)$ at $p=1$, cannot equal a polynomial, which is bounded on $[0,1]$; a bounded but non-polynomial $\sqrt p$ can be approximated arbitrarily well as $n$ grows (Bernstein's proof of the Weierstrass theorem) but never matched exactly. The existence of a UMVUE (stat-4.10) presupposes at least one unbiased estimator, so this is a limit of the whole theory; inverse sampling (counting trials until the first success) does give an unbiased estimator of $1/p$, because the stopping rule changes the sample space.`,
      caption: String.raw`Left: the estimator's value $\delta(k)$ for each possible count $k=0,\dots,n$: drag the bars. Right: its expectation $E_p\delta$ (blue), a polynomial of degree $\le n$, against the target $\tau(p)$ (green). The red shading is the bias. **Fit** finds the best values in the range shown (least squares over the marked interval). For $p^2$ the fit is exact once $n\ge2$; for $1/p$ the curve can follow the target over part of the range but at $p=0$ it equals $\delta(0)$, a finite number, while $1/p\to\infty$; for $\sqrt p$ the error shrinks with $n$ but never reaches zero.`,
      deps: ['stat-3.1'],
      see: ['stat-4.12', 'stat-2.14'],
      refs: ['Casella–Berger §7.3'],
      tags: ['unbiasedness', 'binomial', 'polynomials'],
      viz(v) {
        const TG = {
          inv: { lab: '$1/p$', f: (p) => 1 / p, yr: [-4, 30], fit: [0.06, 1], ry: [0, 30] },
          odds: { lab: 'odds $p/(1-p)$', f: (p) => p / (1 - p), yr: [-4, 30], fit: [0, 0.94], ry: [0, 30] },
          sqrt: { lab: '$\\sqrt p$', f: (p) => Math.sqrt(p), yr: [-0.4, 1.4], fit: [0, 1], ry: [0, 1.2] },
          sq: { lab: '$p^2$ (a polynomial)', f: (p) => p * p, yr: [-0.4, 1.4], fit: [0, 1], ry: [0, 1.2] },
        };
        const NMAX = 8, H = [];
        const nat = (k, n, key) => { const ph = k / n; if (key === 'inv') return clamp(k ? n / k : 2 * n, -3, 29); if (key === 'odds') return clamp(k < n ? k / (n - k) : 2 * n, -3, 29); if (key === 'sqrt') return Math.sqrt(ph); return ph * ph; };
        const reset = () => { const n = nS.value, key = tgS.value, g = TG[key]; sL.setView([-0.6, n + 0.6], g.yr); H.forEach((h, k) => { h.visible = k <= n; h.set(Math.min(k, n), nat(Math.min(k, n), n, key)); }); };
        const tgS = v.select('target $\\tau(p)$', Object.entries(TG).map(([value, o]) => ({ value, label: o.lab })), 'inv', { onChange: () => reset() });
        const nS = v.slider('number of trials $n$', 1, NMAX, 4, { int: true, onChange: () => reset() });
        const sL = v.stage({ x: [-0.6, 4.6], y: [-4, 30], axes: 'box', gutter: true, height: 330, weight: 0.85, minWidth: 230, xlabel: 'count $k$', ylabel: '$\\delta(k)$', title: 'the estimator: drag its values' });
        const sR = v.stage({ x: [0, 1], y: [0, 30], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: '$p$', ylabel: '$E_p\\,\\delta(X)$', title: 'its expectation, a polynomial, against the target' });
        for (let k = 0; k <= NMAX; k++) H.push(sL.handle(k, 0, { color: 'accent', r: 7, constrain: (x, y) => { const g = TG[tgS.value]; return [k, clamp(y, g.yr[0] + 0.02 * (g.yr[1] - g.yr[0]), g.yr[1] - 0.02 * (g.yr[1] - g.yr[0]))]; } }));
        const bern = (k, n, p) => Math.exp(lchoose(n, k) + (k ? k * Math.log(p) : 0) + (n - k ? (n - k) * Math.log(1 - p) : 0));
        const Ed = (p, n) => { if (p <= 0) return H[0].y; if (p >= 1) return H[n].y; let s = 0; for (let k = 0; k <= n; k++) s += H[k].y * bern(k, n, p); return s; };
        v.button('Fit', () => {
          const n = nS.value, g = TG[tgS.value], G = 240, A = [], b = [];
          for (let i = 0; i < G; i++) { const p = g.fit[0] + ((g.fit[1] - g.fit[0]) * (i + 0.5)) / G; A.push(Array.from({ length: n + 1 }, (_, k) => bern(k, n, p))); b.push(g.f(p)); }
          const AtA = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => A.reduce((s, row) => s + row[i] * row[j], 0) + (i === j ? 1e-9 : 0)));
          const Atb = Array.from({ length: n + 1 }, (_, i) => A.reduce((s, row, r) => s + row[i] * b[r], 0));
          let d = v.M.solve(AtA, Atb);
          // keep the values inside the panel: a few rounds of clamping and refitting the free values
          const lo = g.yr[0] * 0.98, hi = g.yr[1] * 0.98, fixed = new Map();
          for (let round = 0; round < n + 1; round++) {
            let changed = false; d.forEach((x, k) => { if (!fixed.has(k) && (x < lo || x > hi)) { fixed.set(k, clamp(x, lo, hi)); changed = true; } });
            if (!changed) break;
            const free = d.map((_, k) => k).filter((k) => !fixed.has(k)); if (!free.length) break;
            const bb = b.map((y, r) => y - [...fixed].reduce((s, [k, val]) => s + A[r][k] * val, 0));
            const M2 = free.map((i) => free.map((j) => A.reduce((s, row) => s + row[i] * row[j], 0) + (i === j ? 1e-9 : 0)));
            const v2 = free.map((i) => A.reduce((s, row, r) => s + row[i] * bb[r], 0));
            const sol = v.M.solve(M2, v2); d = d.map((x, k) => (fixed.has(k) ? fixed.get(k) : sol[free.indexOf(k)]));
          }
          d.forEach((x, k) => H[k].set(k, clamp(x, lo, hi)));
        });
        v.button('Plug-in p̂ = k/n', () => reset());
        reset();
        let info = null;
        v.render(() => {
          const n = nS.value, key = tgS.value, g = TG[key];
          sL.hline(0, { color: 'faint', width: 1 });
          for (let k = 0; k <= n; k++) sL.rect(k - 0.3, 0, k + 0.3, H[k].y, { fill: 'accent', fillAlpha: 0.35, stroke: false, radius: 2 });
          sR.setView([0, 1], g.ry);
          sR.vband(g.fit[0], g.fit[1], { color: 'muted', alpha: 0.06 });
          sR.between((p) => Ed(p, n), (p) => Math.min(g.f(p), g.ry[1] * 2), 0.002, 0.998, { fill: 'red', fillAlpha: 0.14 });
          sR.fn(g.f, { domain: [0.002, 0.998], color: 'green', width: 3, n: 400 });
          sR.fn((p) => Ed(p, n), { domain: [0, 1], color: 'accent', width: 2.6, n: 300 });
          sR.dot(0, H[0].y, { r: 5, color: 'accent' }); sR.dot(1, H[n].y, { r: 5, color: 'accent' });
          let worst = 0, wp = 0; for (let i = 0; i <= 200; i++) { const p = g.fit[0] + ((g.fit[1] - g.fit[0]) * i) / 200; if (p <= 0 || p >= 1) continue; const e = Math.abs(Ed(p, n) - g.f(p)); if (e > worst) { worst = e; wp = p; } }
          let worstAll = 0; for (let i = 1; i < 400; i++) { const p = i / 400; worstAll = Math.max(worstAll, Math.abs(Ed(p, n) - g.f(p))); }
          v.legend([['accent', 'estimator values · $E_p\\delta$, degree $\\le n$'], ['green', 'target $\\tau(p)$'], ['red', 'bias', { area: true }], ['muted', 'fitting interval', { area: true }]]);
          info = { n, key, g, worst, wp, worstAll, d0: H[0].y, dn: H[n].y };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, key, worst, wp, worstAll, d0, dn } = info;
          let s = String.raw`$n=${n}$: largest bias on the shaded interval ${v.fix(worst, 4)} (at $p=${v.fix(wp, 2)}$), on all of $(0,1)$ ${Number.isFinite(worstAll) ? v.fix(worstAll, 4) : '∞'}`;
          if (key === 'inv') s += String.raw` · at $p\to0$ the expectation tends to $\delta(0)=${v.fix(d0, 2)}$ while $1/p\to\infty$: **no choice of the ${n + 1} values can be unbiased**`;
          else if (key === 'odds') s += String.raw` · at $p\to1$ the expectation tends to $\delta(n)=${v.fix(dn, 2)}$ while the odds $\to\infty$: **no unbiased estimator exists**`;
          else if (key === 'sqrt') s += ` · $\\sqrt p$ is not a polynomial: the error can shrink as $n$ grows but **never vanishes**`;
          else s += n >= 2 ? String.raw` · $p^2$ is a polynomial of degree $2\le n$: the fit $\delta(k)=\frac{k(k-1)}{n(n-1)}$ makes the bias **exactly zero**` : ` · with $n=1$ the degree is too low: $p^2$ has no unbiased estimator from one trial`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Paper',
      name: 'Information and the accuracy attainable in estimation',
      paper: { authors: 'C. Radhakrishna Rao', year: 1945, title: 'Information and the accuracy attainable in the estimation of statistical parameters', venue: 'Bulletin of the Calcutta Mathematical Society 37: 81–91 (reprinted in Breakthroughs in Statistics I, Springer 1992)', url: 'https://doi.org/10.1007/978-1-4612-0919-5_16' },
      introduces: ['stat-4.4', 'stat-4.9'],
      credit: 'C. R. Rao, 1945',
      statement: String.raw`In a ten-page paper written at 24, Rao proved three results that shaped estimation theory. (1) For any unbiased estimator $t$ of $\theta$ in a regular family, $\operatorname{Var}t\ge1/I(\theta)$, with $I$ Fisher's information, and its multiparameter form $\operatorname{Cov}(t)\succeq I(\theta)^{-1}$ (the Cramér–Rao bound, found independently by Cramér in 1946 and in special forms earlier by Fréchet and Darmois). (2) If a sufficient statistic $T$ exists, then for any unbiased $t$ the estimator $E[t\mid T]$ is unbiased with no larger variance, so the search for a minimum-variance unbiased estimator can be confined to functions of $T$ (the Rao–Blackwell theorem; Blackwell gave it independently in 1947). (3) The Fisher information defines a Riemannian metric on a parametric family, $ds^2=\sum_{jl}I_{jl}(\theta)\,d\theta_j\,d\theta_l$, whose geodesic distance measures how different two distributions are. Scope: the bound needs the regularity conditions of stat-4.4; the metric is the starting point of information geometry.`,
      idea: String.raw`Fisher (1922–25) had introduced information and argued that maximum-likelihood estimates are efficient in large samples, by asymptotic arguments. Rao, then at the Indian Statistical Institute in Calcutta, asked what can be said exactly, for a fixed sample: the Cauchy–Schwarz inequality applied to an estimator and the score gives a floor under its variance at every $n$ (stat-4.4), and conditioning on a sufficient statistic (stat-2.2) moves any unbiased estimator towards that floor (stat-4.9). The geometric part was decades ahead of its time; the normal family in the $(\mu,\sigma)$ coordinates turned out to be a hyperbolic plane. Together with Cramér's book (1946) and Blackwell (1947), Lehmann and Scheffé (1950) completed the finite-sample theory of unbiased estimation.`,
      caption: String.raw`Left, as in the paper's argument: choose a crude unbiased estimator of a Bernoulli or Poisson mean — one observation, a weighted average with weights increasing along the sample, or an average of the first two — and see its 1,000 simulated estimates (orange) next to those of its Rao–Blackwellized version $E[t\mid\sum X_i]=\bar X$ (green), with the band $\pm1/\sqrt{nI}$ of the bound (green shading). The readout compares variances with $1/(nI)$. Right: Rao's information distance between normal distributions $N(\mu,\sigma^2)$, drawn in the $(\mu,\sigma)$ half-plane. Drag $P$ and $Q$: the shortest path (blue) is an arc of a circle centred on the axis $\sigma=0$, and the circles of equal information distance around $P$ (purple) are Euclidean circles whose centres sit above $P$ — the geometry of the hyperbolic plane.`,
      deps: ['stat-4.2', 'stat-2.2'],
      see: ['stat-4.4', 'stat-4.6', 'stat-4.9'],
      refs: [],
      tags: ['history', 'Cramér–Rao', 'information geometry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/C._R._Rao' },
      viz(v) {
        const famS = v.select('model', [{ value: 'B', label: 'Bernoulli $p=0.3$' }, { value: 'P', label: 'Poisson $\\lambda=2$' }], 'B');
        const tS = v.select('crude unbiased $t$', [{ value: 'x1', label: '$X_1$' }, { value: 'w', label: 'weights $\\propto i$' }, { value: 'x12', label: '$\\tfrac12(X_1+X_2)$' }], 'x1');
        const nS = v.slider('sample size $n$', 2, 40, 10, { int: true });
        const sA = v.stage({ x: [0, 1], y: [0.35, 2.65], axes: 'box', gutter: { l: 92 }, height: 340, weight: 1, xlabel: 'estimate', title: 'an estimator and its Rao–Blackwellization' });
        const sG = v.stage({ x: [-3, 3], y: [0, 3.2], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$\\mu$', ylabel: '$\\sigma$', title: 'information distance between normal laws' });
        const P = sG.handle(-1.2, 0.6, { color: 'accent', label: '$P$', labelPos: 'nw', constrain: (x, y) => [clamp(x, -2.9, 2.9), clamp(y, 0.12, 3.1)] });
        const Q = sG.handle(1.5, 1.1, { color: 'orange', label: '$Q$', labelPos: 'ne', constrain: (x, y) => [clamp(x, -2.9, 2.9), clamp(y, 0.12, 3.1)] });
        const mc = memo();
        const sim = (fam, tk, n) => mc([fam, tk, n].join('|'), () => {
          const r = v.rng(hashStr(`rao|${fam}|${tk}|${n}`)), th = fam === 'B' ? 0.3 : 2, A = [], Bv = [], xs = new Float64Array(n), wsum = (n * (n + 1)) / 2;
          for (let c = 0; c < 1000; c++) {
            let s = 0, ws = 0; for (let i = 0; i < n; i++) { xs[i] = fam === 'B' ? (r() < th ? 1 : 0) : rpois(r, th); s += xs[i]; ws += (i + 1) * xs[i]; }
            A.push(tk === 'x1' ? xs[0] : tk === 'w' ? ws / wsum : 0.5 * (xs[0] + xs[1])); Bv.push(s / n);
          }
          return { A, B: Bv, th };
        });
        // exact variances: σ² = Var X; t = Σ wᵢXᵢ with Σwᵢ = 1 has variance σ² Σwᵢ²
        const exactVar = (fam, tk, n) => { const s2v = fam === 'B' ? 0.21 : 2; if (tk === 'x1') return s2v; if (tk === 'x12') return s2v / 2; const wsum = (n * (n + 1)) / 2; let q = 0; for (let i = 1; i <= n; i++) q += (i / wsum) ** 2; return s2v * q; };
        const rao = (m1, s1, m2, s2v) => Math.SQRT2 * Math.acosh(1 + (((m1 - m2) ** 2) / 2 + (s1 - s2v) ** 2) / (2 * s1 * s2v));
        const kl = (m1, s1, m2, s2v) => Math.log(s2v / s1) + (s1 * s1 + (m1 - m2) ** 2) / (2 * s2v * s2v) - 0.5;
        let info = null;
        v.render(() => {
          const fam = famS.value, tk = tS.value, n = nS.value, D = sim(fam, tk, n), th = D.th, Iv = fam === 'B' ? 1 / 0.21 : 0.5, bound = 1 / (n * Iv);
          // left: two dartboard rows
          const wide = Math.sqrt(exactVar(fam, tk, n)) * 3.2;
          sA.setView([th - wide, th + wide], [0.35, 2.65]);
          sA.setTicks(null, [[2, 'crude t'], [1, 'E[t | ΣX] = X̄']]);
          sA.vband(th - Math.sqrt(bound), th + Math.sqrt(bound), { color: 'green', alpha: 0.13, edges: true });
          sA.vline(th, { color: 'ink', width: 1.6 });
          const jitter = (vals, y, col, sd) => { const r = mulberry(sd), pts = vals.map((x) => [x + (r() - 0.5) * 0.006 * wide, y + (r() * 2 - 1) * 0.32]); sA.dots(pts, { r: 1.8, color: col, alpha: 0.32 }); };
          jitter(D.A, 2, 'orange', 3); jitter(D.B, 1, 'green', 4);
          const vA = varN(D.A) * 1000 / 999, vB = varN(D.B) * 1000 / 999;
          for (const [vals, y, vr] of [[D.A, 2, vA], [D.B, 1, vB]]) { const m = mean(vals), sd = Math.sqrt(vr); sA.line(m - sd, y - 0.42, m + sd, y - 0.42, { color: 'ink', width: 2.6 }); sA.dot(m, y - 0.42, { r: 3.4, color: 'ink' }); }
          // right: the hyperbolic picture in coordinates u = μ/√2, σ
          const u1 = P.x / Math.SQRT2, s1 = P.y, u2 = Q.x / Math.SQRT2, s2v = Q.y;
          for (const rr of [0.5, 1, 1.5, 2, 2.5]) {
            const dh = rr / Math.SQRT2, cy = s1 * Math.cosh(dh), rad = s1 * Math.sinh(dh);
            sG.curve((a) => [Math.SQRT2 * (u1 + rad * Math.cos(a)), cy + rad * Math.sin(a)], 0, 2 * Math.PI, { color: 'purple', width: 1.2, alpha: 0.55, n: 160 });
          }
          let geo;
          if (Math.abs(u2 - u1) < 1e-6) geo = (a) => [P.x, s1 + (s2v - s1) * a];
          else { const c = (u2 * u2 + s2v * s2v - u1 * u1 - s1 * s1) / (2 * (u2 - u1)), R = Math.hypot(u1 - c, s1), a1 = Math.atan2(s1, u1 - c), a2 = Math.atan2(s2v, u2 - c); geo = (a) => { const ang = a1 + (a2 - a1) * a; return [Math.SQRT2 * (c + R * Math.cos(ang)), R * Math.sin(ang)]; }; sG.curve((a) => { const ang = Math.PI * a; return [Math.SQRT2 * (c + R * Math.cos(ang)), R * Math.sin(ang)]; }, 0, 1, { color: 'accent', width: 1, alpha: 0.3, dash: [4, 4], n: 200 }); }
          sG.curve(geo, 0, 1, { color: 'accent', width: 3, n: 160 });
          sG.line(P.x, P.y, Q.x, Q.y, { color: 'muted', width: 1.2, dash: [3, 4] });
          const d = rao(P.x, P.y, Q.x, Q.y);
          // midpoint of the geodesic, by distance
          const mid = geo(0.5);
          v.legend([['orange', 'crude $t$', { dot: true }], ['green', '$E[t\\mid\\sum X_i]$ · band $\\pm1/\\sqrt{nI}$', { dot: true }], ['accent', 'geodesic from P to Q'], ['purple', 'points at Rao distance 0.5, 1, …, 2.5 from P']]);
          info = { fam, tk, n, vA, vB, bound, exA: exactVar(fam, tk, n), d, eu: Math.hypot(P.x - Q.x, P.y - Q.y), klPQ: kl(P.x, P.y, Q.x, Q.y), klQP: kl(Q.x, Q.y, P.x, P.y), P: [P.x, P.y], Q: [Q.x, Q.y], mid };
        });
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return String.raw`$n=${I.n}$: crude $t$ has variance ${v.fix(I.vA, 4)} (exact ${v.fix(I.exA, 4)}); after Rao–Blackwellization ${v.fix(I.vB, 4)}, **on the bound $1/(nI)=${v.fix(I.bound, 4)}$** (efficiency of $t$: ${v.fix(I.bound / I.exA, 3)}) · Rao distance between $N(${v.fix(I.P[0], 2)},${v.fix(I.P[1], 2)}^2)$ and $N(${v.fix(I.Q[0], 2)},${v.fix(I.Q[1], 2)}^2)$: $\sqrt2\,\operatorname{arccosh}\!\big(1+\frac{(\mu_1-\mu_2)^2/2+(\sigma_1-\sigma_2)^2}{2\sigma_1\sigma_2}\big)=$ **${v.fix(I.d, 3)}** (straight-line length in the picture ${v.fix(I.eu, 3)}; KL divergences ${v.fix(I.klPQ, 3)} and ${v.fix(I.klQP, 3)}, not symmetric) · halfway along the geodesic: $N(${v.fix(I.mid[0], 2)},${v.fix(I.mid[1], 2)}^2)$`;
        });
      },
    },
  ],
};

/** Local repeater (as in ch03.shared.js) that keeps whole samples. */
function repeater_(v, o) {
  const S = { vals: [], key: null, r: null, ver: 0 };
  S.run = (m) => { for (let i = 0; i < m && S.vals.length < 200000; i++) S.vals.push(o.sample(S.r)); S.ver++; };
  S.sync = () => { const k = String(o.key()); if (k !== S.key) { S.key = k; S.r = v.rng(hashStr(k + '|stat4b')); S.vals = []; S.run(o.init ?? 2000); } return S; };
  for (const m of o.buttons ?? [2000]) v.button(`Draw ${commas(m)}`, () => { S.sync(); S.run(m); });
  if (o.clear) v.button('Clear', () => { S.sync(); S.vals = []; S.ver++; });
  return S;
}
