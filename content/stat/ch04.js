// Statistical Inference — Chapter 4: Information and optimal unbiased estimation (items 4.1–4.7; 4.8–4.14 in ch04-b.js)
//
// Information is a property of repeated samples, so every picture is built from them: bundles of log-likelihoods,
// histograms of scores, dartboards of estimates, with the exact formula drawn beside each simulation and a
// "break it" choice (a family whose support moves with the parameter) wherever a regularity condition matters.
import {
  clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  ellipsePts, gammaMLE, trigamma, family, sumOver, logSlope, decadeTicks, strip, varN, rcauchy, rpois, dpois, dbinom,
} from './ch04.shared.js';

const FAM_OPTS = [
  { value: 'normal', label: 'normal' }, { value: 'poisson', label: 'Poisson' }, { value: 'bernoulli', label: 'Bernoulli' },
  { value: 'expo', label: 'exponential' }, { value: 'cauchy', label: 'Cauchy' }, { value: 'uniform', label: 'uniform $(0,\\theta)$' },
];
/** Exact Kullback–Leibler divergence KL(P_θ₀ ‖ P_θ) for one observation (so E[ℓ(θ) − ℓ(θ₀)] = −n·KL). */
function klFam(F, t0, t) {
  if (F.key.startsWith('normal')) return ((t - t0) ** 2) / (2 * F.sg * F.sg);
  if (F.key === 'poisson') return t0 * Math.log(t0 / t) - t0 + t;
  if (F.key === 'bernoulli') return t0 * Math.log(t0 / t) + (1 - t0) * Math.log((1 - t0) / (1 - t));
  if (F.key === 'expo') return Math.log(t0 / t) + t / t0 - 1;
  if (F.key === 'cauchy') return Math.log(1 + ((t - t0) ** 2) / 4);
  return t >= t0 ? Math.log(t / t0) : Infinity;
}
/** Plain-text name of a family's parameter. */
const pname = (F) => ({ '\\mu': 'μ', '\\lambda': 'λ', p: 'p', '\\theta': 'θ' })[F.ptex];

export default {
  collection: 'stat',
  chapter: 4,
  title: 'Information and optimal unbiased estimation',
  summary: String.raw`How precisely can a parameter be estimated at all? The score, the slope of the log-likelihood, has mean zero at the true parameter, and its variance, the Fisher information, is also the average curvature of the log-likelihood there. The Cramér–Rao inequality turns that curvature into a floor under the variance of every unbiased estimator, a floor reached only in exponential families and only for their natural mean parameters. Rao–Blackwell improves any estimator by averaging it over a sufficient statistic, and Lehmann–Scheffé shows that with completeness this produces the unique best unbiased estimator, as in the German tank problem. The chapter ends at the edges: models whose support moves with the parameter beat the Cramér–Rao rate, some unbiased estimators are absurd, and some parameters have no unbiased estimator at all.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Score function',
      credit: 'Fisher, 1925',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. with density or mass function $f(x\mid\theta)$, $\theta$ in an open interval $\Theta\subseteq\R$, and log-likelihood $\ell_n(\theta)=\sum_{i=1}^n\log f(X_i\mid\theta)$ (stat-2.11). The **score** is its derivative,
$$S_n(\theta)=\ell_n'(\theta)=\sum_{i=1}^n s(X_i,\theta),\qquad s(x,\theta)=\frac{\partial}{\partial\theta}\log f(x\mid\theta)=\frac{\partial_\theta f(x\mid\theta)}{f(x\mid\theta)},$$
a random function of $\theta$. In a **regular** family (the support $\{x:f(x\mid\theta)>0\}$ does not depend on $\theta$, and $\int f(x\mid\theta)\,dx$ may be differentiated under the integral sign, pma-9.42) the score has mean zero at the true parameter:
$$E_\theta\,S_n(\theta)=n\int\partial_\theta f(x\mid\theta)\,dx=n\,\frac{d}{d\theta}\int f(x\mid\theta)\,dx=0 .$$
Evaluated at a wrong value $\theta'\ne\theta$ its mean is $n\,E_\theta s(X,\theta')$, generally not zero. Examples: $N(\mu,\sigma^2)$ with $\sigma$ known gives $S_n(\mu)=\sum(X_i-\mu)/\sigma^2$; Poisson gives $S_n(\lambda)=\sum X_i/\lambda-n$.`,
      idea: String.raw`The likelihood equation $S_n(\theta)=0$ (stat-3.5) finds the MLE; the fact that $E_\theta S_n(\theta)=0$ is why it finds the right one: at the truth the slope of the log-likelihood points up as often as down, while at $\theta'<\theta$ it points up on average (towards $\theta$) and at $\theta'>\theta$ down. The identity is nothing but $\int f=1$ differentiated in $\theta$, which is where regularity enters. For $\mathrm{Uniform}(0,\theta)$, $\log f=-\log\theta$ on its support, so the score is $-n/\theta$ for every sample: never zero on average, because the support itself moves with $\theta$ and the derivative cannot pass the integral sign.`,
      caption: String.raw`Left: the log-likelihoods of 24 samples, each shifted so its maximum is 0, with its tangent at the blue marker $\theta'$; the slope of each tangent is that sample's score. The green handle is the true $\theta$. Right: the histogram of $S_n(\theta')$ over 1,000 samples, with zero (black), the simulated mean (gold) and the exact mean (green). With $\theta'$ on the truth the histogram is centred on zero; drag $\theta'$ away and it slides off in the direction of the truth. Choose **uniform**: the score is the same negative number for every sample, so its mean is not zero.`,
      deps: ['stat-2.11', 'pma-9.42'],
      see: ['stat-3.5'],
      refs: ['Casella–Berger §7.3', 'Wasserman §9.7'],
      tags: ['likelihood', 'score', 'information'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Score_(statistics)' },
      viz(v) {
        let F = family('normal'), hT = null, hE = null;
        const YB = -12, YT = 2.2;
        const home = () => {
          sL.setView([F.lo, F.hi], [YB, YT]); sL.setLabels(`$${F.ptex}$`);
          hT.set(F.def, YB + 0.8); hE.set(F.def, YT - 0.8);
        };
        const famS = v.select('model', FAM_OPTS, 'normal', { onChange: (k) => { F = family(k); home(); } });
        const nS = v.slider('sample size $n$', 1, 50, 10, { int: true });
        const sL = v.stage({ x: [F.lo, F.hi], y: [YB, YT], axes: 'box', gutter: true, height: 350, weight: 1.15, xlabel: '$\\mu$', ylabel: '$\\ell_n-\\max\\ell_n$', title: 'log-likelihoods of 24 samples and their slopes at $\\theta\'$' });
        const sR = v.stage({ x: [-1, 1], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 0.85, xlabel: "score $S_n(\\theta')$", title: 'the score over repeated samples' });
        hT = sL.handle(F.def, YB + 0.8, { color: 'green', label: '$\\theta$', labelPos: 'ne', constrain: (x) => [clamp(x, F.lo, F.hi), YB + 0.8] });
        hE = sL.handle(F.def, YT - 0.8, { color: 'accent', label: "$\\theta'$", labelPos: 'ne', constrain: (x) => [clamp(x, F.lo, F.hi), YT - 0.8] });
        const R = repeater(v, {
          key: () => [famS.value, hT.x.toFixed(3), nS.value].join('|'),
          sample: (r) => { const n = nS.value, xs = new Float64Array(n); for (let i = 0; i < n; i++) xs[i] = F.sample(r, hT.x); return xs; },
          init: 1000, buttons: [1000, 10000], seed: 'stat4.1',
        });
        const mc = memo(), GRID = 161;
        const curves = (S) => mc(S.key, () => S.vals.slice(0, 24).map((xs) => {
          const g = []; let m = -Infinity;
          for (let i = 0; i < GRID; i++) { const t = F.lo + ((F.hi - F.lo) * i) / (GRID - 1), y = sumOver(xs, F.ll, t); g.push([t, y]); if (y > m) m = y; }
          if (F.key === 'uniform') { let mx = 0; for (const x of xs) mx = Math.max(mx, x); m = Math.max(m, -xs.length * Math.log(mx)); }
          return { xs, g: g.map(([t, y]) => [t, y - m]), m };
        }));
        let info = null;
        v.render(() => {
          const S = R.sync(), D = S.vals, n = nS.value, t0 = hT.x, t1 = hE.x;
          // left: the bundle and the tangents at θ'
          const C = curves(S), ppx = Math.abs(sL.X(1) - sL.X(0)), ppy = Math.abs(sL.Y(1) - sL.Y(0));
          sL.vline(t0, { color: 'green', width: 1.4, dash: [4, 4] });
          sL.vline(t1, { color: 'accent', width: 1.4, alpha: 0.6 });
          C.slice().reverse().forEach((c, kk) => {
            const last = kk === C.length - 1;
            sL.path(c.g.map(([t, y]) => (Number.isFinite(y) ? [t, y] : null)), { color: last ? 'accent' : 'muted', width: last ? 2.6 : 1.1, alpha: last ? 1 : 0.45 });
            const y1 = sumOver(c.xs, F.ll, t1) - c.m, sl = sumOver(c.xs, F.s, t1);
            if (Number.isFinite(y1) && Number.isFinite(sl)) {
              const dx = 30 / Math.hypot(ppx, sl * ppy);
              sL.line(t1 - dx, y1 - sl * dx, t1 + dx, y1 + sl * dx, { color: last ? 'ink' : 'gold', width: last ? 2.4 : 1.8, alpha: last ? 1 : 0.85 });
              sL.dot(t1, y1, { r: last ? 3.5 : 2.2, color: last ? 'ink' : 'gold' });
            }
          });
          // right: the histogram of S_n(θ')
          const sc = []; let undef = 0;
          for (const xs of D) { const s = sumOver(xs, F.s, t1); if (Number.isFinite(s)) sc.push(s); else undef++; }
          const ex = n * F.Es(t0, t1), mo = moments(sc), so = sortNum(sc);
          let lo = Math.min(0, qSorted(so, 0.003), Number.isFinite(ex) ? ex : 0), hi = Math.max(0, qSorted(so, 0.997), Number.isFinite(ex) ? ex : 0);
          if (!(hi - lo > 1e-9)) { lo -= 1; hi += 1; }
          const pad = 0.12 * (hi - lo); lo -= pad; hi += pad;
          const B = binned(sc, lo, hi, 36);
          let peak = B.max;
          const exactPdf = F.key.startsWith('normal') ? (y) => { const sd = Math.sqrt(n) / F.sg, m = n * F.Es(t0, t1); return Math.exp(-0.5 * ((y - m) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)); } : null;
          if (exactPdf) peak = Math.max(peak, exactPdf(n * F.Es(t0, t1)));
          sR.setView([lo, hi], [0, (peak || 1) * 1.18]);
          if (sc.length) sR.hist(B, { density: true, color: 'gold', fillAlpha: 0.35, width: 1.4 });
          if (exactPdf) sR.fn(exactPdf, { color: 'ink', width: 1.8, n: 240 });
          sR.vline(0, { color: 'ink', width: 1.8 });
          if (sc.length) sR.vline(mo.mean, { color: 'gold', width: 2.6 });
          if (Number.isFinite(ex)) sR.vline(ex, { color: 'green', width: 2, dash: [6, 4] });
          if (sc.length && mo.sd < 1e-9) sR.text(`every sample: −n/θ′ = ${v.fix(mo.mean, 3)}`, mo.mean, sR.bounds.y[1] * 0.92, { color: 'gold', size: 12, weight: 700, align: 'left', dx: 8, plate: true });
          if (!sc.length) sR.corner('every sample has a point above θ′: ℓ(θ′) = −∞', 'tl', { color: 'red' });
          v.legend([['accent', 'one log-likelihood and its tangent (black)'], ['gold', 'tangents of the others · simulated scores'], ['green', 'truth · exact mean of the score', { dash: true }], ['ink', 'zero' + (exactPdf ? ' · exact density' : '')]]);
          info = { n, t0, t1, mo, N: sc.length, undef, ex, I: F.I(t0) };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, t0, t1, mo, N, undef, ex, I } = info, se = N > 1 ? mo.sd / Math.sqrt(N) : NaN, p = pname(F);
          const at = Math.abs(t1 - t0) < 0.01 * (F.hi - F.lo);
          let s = String.raw`${F.name}, $n=${n}$, true $${F.ptex}=${v.fix(t0, 2)}$, evaluated at $${F.ptex}'=${v.fix(t1, 2)}$: mean score over ${commas(N)} samples **${N ? v.fix(mo.mean, 3) : '—'}** ± ${v.fix(2 * se, 3)}, exact $n\,E\,s(X,${p}')=${Number.isFinite(ex) ? v.fix(ex, 3) : '\\text{undefined}'}$`;
          if (undef) s += ` · ${pct(undef / (undef + N), 0)} of the samples have a point above $${F.ptex}'$, where $\\ell=-\\infty$`;
          if (!F.regular) s += ` · **the support moves with ${p}: the score is $-n/${F.ptex}'$ for every sample, so even at the truth its mean is ${v.fix(-n / t0, 3)}, not 0**`;
          else if (at) s += String.raw` · **at the truth the score is centred on zero** ✓ and its SD ${v.fix(mo.sd, 3)} matches $\sqrt{nI(${p})}=${v.fix(Math.sqrt(n * I), 3)}$`;
          else s += ` · off the truth the mean points ${ex > 0 ? 'right' : 'left'}, towards the true value`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Fisher information',
      credit: 'Fisher, 1922 and 1925',
      statement: String.raw`In a regular one-parameter family the **Fisher information** in one observation is the variance of its score,
$$I(\theta)=E_\theta\big[s(X,\theta)^2\big]=\operatorname{Var}_\theta s(X,\theta),$$
and the information in an i.i.d. sample of size $n$ is $I_n(\theta)=\operatorname{Var}_\theta S_n(\theta)=nI(\theta)$. When $\log f$ is twice differentiable it equals the expected curvature of the log-likelihood (stat-4.3),
$$I(\theta)=-E_\theta\Big[\frac{\partial^2}{\partial\theta^2}\log f(X\mid\theta)\Big],$$
while the random curvature $J_n(\theta)=-\ell_n''(\theta)$ of the sample at hand is the **observed information**. Examples: $N(\mu,\sigma^2)$ ($\sigma$ known) has $I=1/\sigma^2$; Poisson$(\lambda)$ has $I=1/\lambda$; Bernoulli$(p)$ has $I=1/\{p(1-p)\}$; the Cauchy location family has $I=\tfrac12$. Under a smooth reparametrization $\theta=h(\eta)$ it transforms as $I^*(\eta)=I(h(\eta))\,h'(\eta)^2$.`,
      idea: String.raw`Averaged over samples, the log-likelihood $E_{\theta_0}[\ell_n(\theta)-\ell_n(\theta_0)]=-n\,\mathrm{KL}(\theta_0\,\|\,\theta)$ is a smooth hill with its top at the truth (Gibbs' inequality), and its second-order Taylor expansion there is $-\tfrac12 nI(\theta_0)(\theta-\theta_0)^2$. Sharp curvature means that nearby parameter values make the observed data clearly less likely: the data discriminate, and the parameter is well determined. A flat hill means that many values explain the data almost equally well. Information adds over independent observations, so the hill sharpens linearly in $n$, and its inverse $1/(nI)$ will turn out to be the best possible variance (stat-4.4).`,
      caption: String.raw`Forty log-likelihoods $\ell_n(\theta)-\ell_n(\theta_0)$ from independent samples (blue), all passing through $(\theta_0,0)$; their average (gold), the exact expected curve $-n\,\mathrm{KL}$ (black) and the parabola with curvature $nI(\theta_0)$ (green, dashed). Right: the observed information $-\ell_n''(\theta_0)$ over 2,000 samples, whose mean is $nI(\theta_0)$. Switch between the peaked normal ($\sigma=\tfrac12$, $I=4$) and the flat one ($\sigma=2$, $I=\tfrac14$): the bundle visibly flattens. Drag the truth: for the Bernoulli the bundle is sharpest near $p=0$ or $1$, for the Poisson near $\lambda=0$. Raise $n$ and every bundle sharpens.`,
      deps: ['stat-4.1'],
      see: ['stat-10.10'],
      refs: ['Casella–Berger §7.3', 'Wasserman §9.7'],
      tags: ['information', 'likelihood', 'curvature'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fisher_information' },
      viz(v) {
        const OPTS = [{ value: 'normalP', label: 'normal, $\\sigma=\\tfrac12$' }, { value: 'normalF', label: 'normal, $\\sigma=2$' }, { value: 'poisson', label: 'Poisson' }, { value: 'bernoulli', label: 'Bernoulli' }, { value: 'cauchy', label: 'Cauchy' }];
        let F = family('poisson'), hT = null;
        const YB = -14, YT = 5;
        const win = () => (F.key === 'cauchy' ? [-3, 3] : [F.lo, F.hi]);
        const home = () => { sL.setView(win(), [YB, YT]); sL.setLabels(`$${F.ptex}$`); hT.set(F.def, YB + 0.9); };
        const famS = v.select('model', OPTS, 'poisson', { onChange: (k) => { F = family(k); home(); } });
        const nS = v.slider('sample size $n$', 1, 100, 10, { int: true, log: true });
        const sL = v.stage({ x: [F.lo, F.hi], y: [YB, YT], axes: 'box', gutter: true, height: 360, weight: 1.25, xlabel: '$\\lambda$', ylabel: '$\\ell_n(\\theta)-\\ell_n(\\theta_0)$', title: 'forty log-likelihoods around the truth' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 0.75, minWidth: 230, xlabel: "observed information $-\\ell_n''(\\theta_0)$", title: 'curvature at the truth, 2,000 samples' });
        hT = sL.handle(F.def, YB + 0.9, { color: 'green', label: '$\\theta_0$', labelPos: 'ne', constrain: (x) => { const w = win(); return [clamp(x, w[0] + 0.04 * (w[1] - w[0]), w[1] - 0.04 * (w[1] - w[0])), YB + 0.9]; } });
        const mb = memo(), mj = memo(), GRID = 181;
        const bundle = (k, t0, n) => mb([k, t0, n].join('|'), () => {
          const r = v.rng(hashStr(`fi|${k}|${t0}|${n}`)), w = win(), out = [];
          for (let c = 0; c < 40; c++) {
            const xs = new Float64Array(n); for (let i = 0; i < n; i++) xs[i] = F.sample(r, t0);
            const l0 = sumOver(xs, F.ll, t0), g = [];
            for (let i = 0; i < GRID; i++) { const t = w[0] + ((w[1] - w[0]) * i) / (GRID - 1); g.push([t, sumOver(xs, F.ll, t) - l0]); }
            out.push(g);
          }
          return out;
        });
        const obsInfo = (k, t0, n) => mj([k, t0, n].join('|'), () => {
          const r = v.rng(hashStr(`fj|${k}|${t0}|${n}`)), out = new Float64Array(2000);
          for (let c = 0; c < 2000; c++) { let a = 0; for (let i = 0; i < n; i++) a += F.j(F.sample(r, t0), t0); out[c] = a; }
          return out;
        });
        let info = null;
        v.render(() => {
          const n = nS.value, t0 = +hT.x.toFixed(3), I = F.I(t0), Bd = bundle(famS.value, t0, n), w = win();
          for (const g of Bd) sL.path(g, { color: 'accent', width: 1, alpha: 0.33 });
          const avg = Bd[0].map(([t], i) => [t, mean(Bd.map((g) => g[i][1]))]);
          sL.fn((t) => -n * klFam(F, t0, t), { domain: w, color: 'ink', width: 2.6, n: 300 });
          sL.path(avg, { color: 'gold', width: 2.6 });
          sL.fn((t) => -0.5 * n * I * (t - t0) ** 2, { domain: w, color: 'green', width: 2.2, dash: [7, 5], n: 200 });
          sL.hline(0, { color: 'faint', width: 1 });
          sL.vline(t0, { color: 'green', width: 1.2, dash: [3, 4] });
          // the curvature of the averaged curve at θ₀ by a centred second difference on the grid
          const i0 = avg.findIndex(([t]) => t >= t0), h = avg[1][0] - avg[0][0];
          let curv = NaN;
          if (i0 > 2 && i0 < avg.length - 3) { const k = Math.max(2, Math.round(0.03 * (w[1] - w[0]) / h)); const a = i0 - k >= 0 && i0 + k < avg.length ? k : 1; curv = -(avg[i0 + a][1] - 2 * avg[i0][1] + avg[i0 - a][1]) / ((a * h) ** 2) ; }
          // right: observed information
          const J = obsInfo(famS.value, t0, n), mo = moments(J), so = sortNum(J);
          let lo = Math.min(0, qSorted(so, 0.003)), hi = Math.max(qSorted(so, 0.997), n * I * 1.15);
          if (hi - lo < 1e-9) hi = lo + 1;
          const pad = 0.08 * (hi - lo); lo = Math.min(lo, -pad * 0.5); hi += pad;
          const spike = mo.sd < 1e-9 * Math.max(1, Math.abs(mo.mean));
          if (spike) {
            sR.setView([lo, hi], [0, 1.15]);
            sR.rect(mo.mean - (hi - lo) * 0.012, 0, mo.mean + (hi - lo) * 0.012, 1, { fill: 'orange', fillAlpha: 0.6, stroke: false });
            sR.text('every sample: ' + v.fix(mo.mean, 2), mo.mean, 1.04, { color: 'orange', size: 12, weight: 700, align: mo.mean > (lo + hi) / 2 ? 'right' : 'left', plate: true });
          } else {
            const B = binned(J, lo, hi, 44);
            sR.setView([lo, hi], [0, B.max * 1.2 || 1]);
            sR.hist(B, { density: true, color: 'orange', fillAlpha: 0.4, width: 1.4 });
          }
          sR.vline(n * I, { color: 'green', width: 2.4, dash: [6, 4] });
          sR.vline(mo.mean, { color: 'ink', width: 1.6 });
          v.legend([['accent', 'one sample'], ['gold', 'average of the 40'], ['ink', 'expected $-n\\,\\mathrm{KL}$ · mean observed information'], ['green', 'parabola $-\\tfrac12 nI(\\theta-\\theta_0)^2$ · $nI(\\theta_0)$', { dash: true }], ['orange', 'observed information', { area: true }]]);
          info = { n, t0, I, curv, mo, spike };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, t0, I, curv, mo, spike } = info, se = mo.sd / Math.sqrt(2000);
          return String.raw`${F.name}, $${F.ptex}_0=${v.fix(t0, 2)}$, $n=${n}$: exact $nI(${F.ptex}_0)=${v.fix(n * I, 3)}$ · mean observed information over 2,000 samples **${v.fix(mo.mean, 3)}**` + (spike ? ' (the same for every sample)' : ` ± ${v.fix(2 * se, 3)}`) + ` · curvature of the averaged bundle of 40 at $${F.ptex}_0$: ${Number.isFinite(curv) ? v.fix(curv, 2) : '—'} · so the parameter is pinned down to about $1/\\sqrt{nI}=${v.fix(1 / Math.sqrt(n * I), 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Proposition',
      name: 'Information identity and additivity',
      statement: String.raw`Suppose the support of $f(x\mid\theta)$ does not depend on $\theta$, $\log f$ is twice differentiable in $\theta$, and $\int f(x\mid\theta)\,dx$ can be differentiated twice under the integral sign. Then

(a) **information identity:** $E_\theta\,s(X,\theta)=0$ and
$$I(\theta)=E_\theta\big[s(X,\theta)^2\big]=-E_\theta\Big[\frac{\partial^2}{\partial\theta^2}\log f(X\mid\theta)\Big];$$
(b) **additivity:** if $X$ and $Y$ are independent with informations $I_X(\theta)$ and $I_Y(\theta)$, the pair carries $I_X(\theta)+I_Y(\theta)$; in particular an i.i.d. sample of size $n$ carries $nI(\theta)$, and $\operatorname{Var}S_n(\theta)=E[-\ell_n''(\theta)]=nI(\theta)$.

Without the regularity conditions both can fail: for $\mathrm{Uniform}(0,\theta)$ the score is the constant $-1/\theta$, so $E\,s=-1/\theta\ne0$, $\operatorname{Var}s=0$, $E\,s^2=1/\theta^2$ and $-E\,\partial_\theta^2\log f=-1/\theta^2$.`,
      idea: String.raw`Differentiate $\int f=1$ once to get $\int f\,s=0$, and once more: $\int(\partial_\theta f)\,s+\int f\,\partial_\theta s=0$, i.e. $E[s^2]+E[\partial_\theta s]=0$, using $\partial_\theta f=f\,s$ (stat-4.1). The identity holds for the integrals, not pointwise: $s^2f$ and $-(\partial_\theta s)f$ are different functions with the same area. Additivity is the variance of a sum of independent mean-zero scores. The uniform shows what the conditions buy: its density is discontinuous in $\theta$ at the edge $x=\theta$, so $\frac{d}{d\theta}\int_0^\theta f\ne\int_0^\theta\partial_\theta f$.`,
      caption: String.raw`Left: two estimates of the information in $n$ observations, each from 3,000 simulated samples: the variance of the score (blue, ±2 SE) and the average curvature $-\ell_n''$ (orange), against the exact $nI(\theta)$ (black line). They agree and grow linearly in $n$. Right: the two integrands for one observation, $s^2f$ (blue) and $-\partial_\theta^2\log f\cdot f$ (orange), over the density $f$ (grey): different shapes, equal areas (readout). For the Cauchy the curvature integrand even goes negative in the tails. Choose **uniform**: the variance of the score is 0, the curvature is negative, and nothing matches.`,
      deps: ['stat-4.2'],
      see: ['pma-9.42'],
      refs: ['Casella–Berger §7.3'],
      tags: ['information', 'score', 'regularity'],
      viz(v) {
        let F = family('normal'), uS = null;
        const famS = v.select('model', FAM_OPTS, 'normal', { onChange: (k) => { F = family(k); uS.set(uS.value); } });
        uS = v.slider('true parameter', 0, 1, 0.5, { step: 0.01, fmt: (u) => `${pname(F)} = ${v.fix(F.lo + u * (F.hi - F.lo), 2)}` });
        const NS = [1, 2, 3, 4, 6, 8, 10, 13, 16, 20, 25, 30, 40], REPS = 3000;
        const sL = v.stage({ x: [0, 42], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'sample size $n$', ylabel: 'information', title: 'two measurements of the information in $n$ points' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.95, xlabel: '$x$', title: 'the two integrands for one observation' });
        const mc = memo();
        const sim = (k, t) => mc(k + '|' + t, () => {
          const r = v.rng(hashStr(`ii|${k}|${t}`));
          return NS.map((n) => {
            const S = new Float64Array(REPS), J = new Float64Array(REPS);
            for (let c = 0; c < REPS; c++) { let s = 0, j = 0; for (let i = 0; i < n; i++) { const x = F.sample(r, t); s += F.s(x, t); j += F.j(x, t); } S[c] = s; J[c] = j; }
            const ms = moments(S), mj = moments(J);
            let m4 = 0; for (const s of S) m4 += (s - ms.mean) ** 4; m4 /= REPS;
            return { n, varS: ms.var, seV: Math.sqrt(Math.max(0, m4 - ms.var * ms.var) / REPS), meanS: ms.mean, meanJ: mj.mean, seJ: mj.sd / Math.sqrt(REPS) };
          });
        });
        // E over one observation of g(x): sums for discrete families, quadrature (in the variable w with x = θ + tan w for Cauchy) otherwise
        const expect = (g, t) => {
          if (F.key === 'poisson') { let a = 0; for (let k = 0; k < 200; k++) { const p = dpois(k, t); if (k > t && p < 1e-16) break; a += p * g(k); } return a; }
          if (F.key === 'bernoulli') return (1 - t) * g(0) + t * g(1);
          if (F.key === 'cauchy') { let a = 0; const K = 2000; for (let i = 0; i < K; i++) a += g(t + Math.tan(-Math.PI / 2 + (Math.PI * (i + 0.5)) / K)); return a / K; }
          if (F.key === 'uniform') { let a = 0; const K = 400; for (let i = 0; i < K; i++) a += g((t * (i + 0.5)) / K); return a / K; }
          if (F.key === 'expo') return v.M.integrate((x) => t * Math.exp(-t * x) * g(x), 0, 40 / t, 2000);
          return v.M.integrate((x) => Math.exp(F.ll(x, t)) * g(x), t - 9 * F.sg, t + 9 * F.sg, 2000);
        };
        let info = null;
        v.render(() => {
          const t = +(F.lo + uS.value * (F.hi - F.lo)).toFixed(3), D = sim(famS.value, t), I = F.I(t), EJ = F.EJ(t);
          // left
          const vals = D.flatMap((d) => [d.varS + 2 * d.seV, d.meanJ + 2 * d.seJ, d.meanJ - 2 * d.seJ]).concat([40 * I, 40 * EJ, 0]);
          let y0 = Math.min(...vals), y1 = Math.max(...vals); const pd = 0.06 * (y1 - y0 || 1); y0 = y0 < 0 ? y0 - pd : 0; y1 += pd;
          sL.setView([0, 42], [y0, y1]);
          if (y0 < 0) sL.hline(0, { color: 'faint', width: 1 });
          sL.fn((n) => n * I, { domain: [0, 42], color: 'ink', width: 2.2 });
          if (!F.regular) sL.fn((n) => n * EJ, { domain: [0, 42], color: 'red', width: 1.6, dash: [6, 4] });
          for (const d of D) {
            sL.line(d.n - 0.35, d.varS - 2 * d.seV, d.n - 0.35, d.varS + 2 * d.seV, { color: 'accent', width: 1.4 });
            sL.dot(d.n - 0.35, d.varS, { r: 4.2, color: 'accent' });
            sL.rect(d.n + 0.35 - 0.38, d.meanJ - (y1 - y0) * 0.009, d.n + 0.35 + 0.38, d.meanJ + (y1 - y0) * 0.009, { fill: 'orange', fillAlpha: 0.95, stroke: false });
          }
          sL.text('nI(θ)', 34, 34 * I, { color: 'ink', size: 12, align: 'left', dx: 6, dy: 16, weight: 700, plate: true });
          // right: integrands s²f and j·f
          let xr, items = null;
          if (F.discrete) {
            const ks = F.key === 'bernoulli' ? [0, 1] : (() => { const out = []; for (let k = 0; k <= Math.max(8, Math.ceil(t + 4.5 * Math.sqrt(t) + 2)); k++) out.push(k); return out; })();
            items = ks.map((k) => { const p = F.key === 'bernoulli' ? (k ? t : 1 - t) : dpois(k, t); return { k, p, a: p * F.s(k, t) ** 2, b: p * F.j(k, t) }; });
            xr = [-0.7, ks[ks.length - 1] + 0.7];
            const top = Math.max(...items.flatMap((q) => [q.p, q.a, q.b])) * 1.15;
            sR.setView(xr, [0, top]);
            for (const q of items) {
              sR.rect(q.k - 0.42, 0, q.k + 0.42, q.p, { fill: 'muted', fillAlpha: 0.18, color: 'muted', width: 1 });
              sR.rect(q.k - 0.3, 0, q.k - 0.02, q.a, { fill: 'accent', fillAlpha: 0.75, stroke: false });
              sR.rect(q.k + 0.02, 0, q.k + 0.3, q.b, { fill: 'orange', fillAlpha: 0.75, stroke: false });
            }
          } else {
            const pdf = (x) => Math.exp(F.ll(x, t));
            xr = F.key === 'expo' ? [0, 5 / t] : F.key === 'cauchy' ? [t - 6, t + 6] : F.key === 'uniform' ? [-0.15 * t, 1.25 * t] : [t - 4 * F.sg, t + 4 * F.sg];
            const fa = (x) => pdf(x) * F.s(x, t) ** 2, fb = (x) => pdf(x) * F.j(x, t);
            let top = 0, bot = 0;
            for (let i = 0; i <= 300; i++) { const x = xr[0] + ((xr[1] - xr[0]) * i) / 300; for (const y of [pdf(x), fa(x), fb(x)]) if (Number.isFinite(y)) { top = Math.max(top, y); bot = Math.min(bot, y); } }
            sR.setView(xr, [bot < 0 ? bot * 1.25 : 0, top * 1.15]);
            const dom = F.key === 'uniform' ? [0, t] : xr;
            sR.fn(pdf, { domain: dom, color: 'muted', width: 1.4, fill: 'muted', fillAlpha: 0.12 });
            sR.fn(fa, { domain: dom, color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.14 });
            sR.fn(fb, { domain: dom, color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.14 });
            if (bot < 0) sR.hline(0, { color: 'faint', width: 1 });
          }
          sR.setLabels(F.discrete ? '$x$ (count)' : '$x$');
          const A = expect((x) => F.s(x, t) ** 2, t), Bv = expect((x) => F.j(x, t), t), Es = expect((x) => F.s(x, t), t);
          v.legend([['accent', 'variance of the score · $s^2 f$'], ['orange', 'average curvature $-\\ell\'\'$ · $-\\partial_\\theta^2\\log f\\cdot f$'], ['ink', 'exact $nI(\\theta)$'], ['muted', 'density $f$', { area: true }]].concat(F.regular ? [] : [['red', '$n\\,E[-\\partial_\\theta^2\\log f]$', { dash: true }]]));
          const last = D[D.length - 1];
          const slope = (k) => { let a = 0, b = 0; for (const d of D) { a += d.n * d[k]; b += d.n * d.n; } return a / b; };
          info = { t, I, A, Bv, Es, last, sv: slope('varS'), sj: slope('meanJ') };
        });
        v.readout(() => {
          if (!info) return '';
          const { t, I, A, Bv, Es, last, sv, sj } = info, p = pname(F);
          let s = String.raw`${F.name} at $${F.ptex}=${v.fix(t, 2)}$, one observation: $E\,s=${v.fix(Es, 4)}$, $E\,s^2=${v.fix(A, 4)}$, $E[-\partial_\theta^2\log f]=${v.fix(Bv, 4)}$ · per-point slopes of the simulated lines: variance of the score ${v.fix(sv, 3)}, average curvature ${v.fix(sj, 3)}`;
          if (F.regular) s += String.raw` · **both $\approx I(${p})=${v.fix(I, 4)}$, and at $n=40$: ${v.fix(last.varS, 2)} and ${v.fix(last.meanJ, 2)} vs $40I=${v.fix(40 * I, 2)}$** ✓`;
          else s += String.raw` · **identity broken**: the score is the constant $-1/\theta$, so its variance is ${v.fix(last.varS, 3)} at every $n$, while $-\ell_n''=-n/\theta^2<0$ — the support $[0,\theta]$ moves with $\theta$`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Cramér–Rao lower bound',
      credit: 'Rao, 1945; Cramér, 1946 (Fréchet, 1943; Darmois, 1945)',
      statement: String.raw`Let $X=(X_1,\dots,X_n)$ be i.i.d. from a regular family $f(x\mid\theta)$ with Fisher information $0<I(\theta)<\infty$, and let $T(X)$ be an estimator with $E_\theta T^2<\infty$ whose mean $m(\theta)=E_\theta T$ can be differentiated under the integral sign. Then for every $\theta$
$$\operatorname{Var}_\theta T\ \ge\ \frac{m'(\theta)^2}{nI(\theta)} .$$
In particular every **unbiased** estimator of $\theta$ satisfies $\operatorname{Var}_\theta T\ge 1/\{nI(\theta)\}$, and every unbiased estimator of $\tau(\theta)$ satisfies $\operatorname{Var}_\theta T\ge\tau'(\theta)^2/\{nI(\theta)\}$. For a biased estimator of $\theta$ with bias $b(\theta)$ the bound is $(1+b'(\theta))^2/\{nI(\theta)\}$, which can lie below $1/(nI)$. An unbiased estimator attaining the bound is called **efficient**; its **efficiency** in general is $\{1/(nI)\}/\operatorname{Var}T\le1$.`,
      idea: String.raw`Differentiating $m(\theta)=\int T f_n$ under the integral gives $m'(\theta)=\int T\,S_n f_n=\operatorname{Cov}_\theta(T,S_n)$, because the score has mean zero (stat-4.3). The Cauchy–Schwarz inequality (rca-4.2) then gives $m'(\theta)^2\le\operatorname{Var}T\cdot\operatorname{Var}S_n=\operatorname{Var}T\cdot nI(\theta)$. Geometrically, $m'(\theta)/\{nI\}\cdot S_n$ is the projection of $T-m(\theta)$ onto the score, and its variance is the bound; equality holds exactly when $T$ is an affine function of the score (stat-4.5). The bound says the curvature of the log-likelihood (stat-4.2) limits the precision of every unbiased procedure, not just the MLE.`,
      caption: String.raw`Left, log–log: the variance of several unbiased estimators against $n$, each dot from 1,500 simulated samples (±2 SE), exact curves where they exist, above the bound $1/(nI)$ (green). The sample mean rides on the bound; the median, midrange, $S^2$ and $X_1$ stay above it. Right: a dartboard at the sample size on the slider, one dot per simulated estimate, with the bound's $\pm1$ SD band (green) and each estimator's own $\pm1$ SD (orange). Turn on the **biased** shrunk mean $\tfrac{n}{n+1}\bar X$: it dips below the green line, which binds only unbiased estimators, and sits exactly on its own bound $(1+b')^2/(nI)$ (purple).`,
      deps: ['stat-4.3', 'stat-3.1', 'rca-4.2'],
      see: ['stat-5.3'],
      refs: ['Casella–Berger §7.3', 'Wasserman §9.8'],
      tags: ['information', 'Cramér–Rao', 'efficiency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cram%C3%A9r%E2%80%93Rao_bound' },
      viz(v) {
        const NSET = [2, 3, 5, 8, 12, 20, 30, 50, 80, 130, 200], REPS = 1500, MU = 1;
        const famS = v.select('model', [{ value: 'normal', label: 'normal mean ($\\sigma=1$)' }, { value: 'poisson', label: 'Poisson mean' }], 'normal');
        const lamS = v.slider('Poisson mean $\\lambda$', 0.5, 6, 2, { step: 0.1 });
        const nS = v.slider('dartboard at $n$', 2, 200, 10, { int: true, log: true });
        const bT = v.toggle('add the biased $\\tfrac{n}{n+1}\\bar X$', false);
        const sL = v.stage({ x: [1.6, 260], y: [1e-3, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1.15, xlabel: 'sample size $n$', ylabel: 'variance', title: 'variance against the bound' });
        const sR = v.stage({ x: [0, 1], y: [0.3, 5.7], axes: 'box', gutter: { l: 74 }, height: 380, weight: 0.85, xlabel: 'estimate', title: 'one dot per simulated estimate' });
        const EST = {
          normal: [
            { k: 'mean', lab: 'X̄', col: 'accent', ex: (n) => 1 / n },
            { k: 'med', lab: 'median', col: 'teal', ex: null },
            { k: 'mid', lab: 'midrange', col: 'pink', ex: null },
            { k: 'x1', lab: 'X₁', col: 'muted', ex: () => 1 },
            { k: 'shr', lab: 'n/(n+1)·X̄', col: 'purple', ex: (n) => n / (n + 1) ** 2, biased: true },
          ],
          poisson: [
            { k: 'mean', lab: 'X̄', col: 'accent', ex: (n, l) => l / n },
            { k: 's2', lab: 'S²', col: 'teal', ex: (n, l) => l / n + (2 * l * l) / (n - 1) },
            { k: 'avg', lab: '(X̄+S²)/2', col: 'pink', ex: (n, l) => l / n + (l * l) / (2 * (n - 1)) },
            { k: 'x1', lab: 'X₁', col: 'muted', ex: (n, l) => l },
            { k: 'shr', lab: 'n/(n+1)·X̄', col: 'purple', ex: (n, l) => (n * l) / (n + 1) ** 2, biased: true },
          ],
        };
        const one = (fam, r, n, lam, buf) => {
          let s = 0, mn = Infinity, mx = -Infinity;
          for (let i = 0; i < n; i++) { const x = fam === 'normal' ? MU + r.normal() : rpois(r, lam); buf[i] = x; s += x; if (x < mn) mn = x; if (x > mx) mx = x; }
          const m = s / n, out = { mean: m, x1: buf[0], shr: (n / (n + 1)) * m };
          if (fam === 'normal') { const a = Array.prototype.slice.call(buf, 0, n).sort((p, q) => p - q); out.med = n % 2 ? a[(n - 1) >> 1] : 0.5 * (a[n / 2 - 1] + a[n / 2]); out.mid = 0.5 * (mn + mx); }
          else { let q = 0; for (let i = 0; i < n; i++) q += (buf[i] - m) ** 2; out.s2 = q / (n - 1); out.avg = 0.5 * (m + out.s2); }
          return out;
        };
        const mc = memo(), md = memo();
        const curves = (fam, lam) => mc(fam + '|' + lam, () => {
          const r = v.rng(hashStr(`cr|${fam}|${lam}`)), buf = new Float64Array(200);
          return NSET.map((n) => {
            const acc = {}; for (const e of EST[fam]) acc[e.k] = new Float64Array(REPS);
            for (let c = 0; c < REPS; c++) { const o = one(fam, r, n, lam, buf); for (const e of EST[fam]) acc[e.k][c] = o[e.k]; }
            const res = { n }; for (const e of EST[fam]) { const vr = varN(acc[e.k]) * REPS / (REPS - 1); res[e.k] = vr; } return res;
          });
        });
        const darts = (fam, lam, n) => md([fam, lam, n].join('|'), () => {
          const r = v.rng(hashStr(`crd|${fam}|${lam}|${n}`)), buf = new Float64Array(200), acc = {};
          for (const e of EST[fam]) acc[e.k] = [];
          for (let c = 0; c < 1000; c++) { const o = one(fam, r, n, lam, buf); for (const e of EST[fam]) acc[e.k].push(o[e.k]); }
          return acc;
        });
        let info = null;
        v.render(() => {
          const fam = famS.value, lam = fam === 'poisson' ? lamS.value : 1, th = fam === 'poisson' ? lam : MU, nd = nS.value;
          lamS.el.hidden = fam !== 'poisson';
          const ests = EST[fam].filter((e) => !e.biased || bT.value), C = curves(fam, lam), bound = (n) => (fam === 'poisson' ? lam / n : 1 / n);
          // left: variance vs n
          const ys = C.flatMap((c) => ests.map((e) => c[e.k])).concat([bound(260) * 0.6]);
          const ylo = Math.min(...ys) * 0.6, yhi = Math.max(...ys) * 1.8;
          sL.setView([1.6, 260], [ylo, yhi]);
          sL.fn(bound, { domain: [1.6, 260], color: 'green', width: 4, alpha: 0.85 });
          if (bT.value) sL.fn((n) => (n / (n + 1)) ** 2 * bound(n), { domain: [1.6, 260], color: 'purple', width: 1.6, dash: [5, 4] });
          for (const e of ests) {
            if (e.ex) sL.fn((n) => e.ex(n, lam), { domain: [e.k === 's2' || e.k === 'avg' ? 1.9 : 1.6, 260], color: e.col, width: 1.6, alpha: 0.8 });
            const pts = C.map((c) => [c.n, c[e.k]]);
            for (const [n, vr] of pts) { const se = vr * Math.sqrt(2 / (REPS - 1)) * (fam === 'poisson' && e.k !== 'mean' && e.k !== 'shr' ? 1.6 : 1); sL.line(n, Math.max(vr - 2 * se, vr * 0.3), n, vr + 2 * se, { color: e.col, width: 1.2 }); }
            sL.dots(pts, { r: 3.6, color: e.col });
          }
          sL.vline(nd, { color: 'gold', width: 1.4, dash: [3, 4] });
          sL.text('1/(nI)', 40, bound(40), { color: 'green', size: 12.5, weight: 700, dx: 4, dy: 16, align: 'right', plate: true });
          // right: dartboard rows
          const Dd = darts(fam, lam, nd), rows = ests.length, bsd = Math.sqrt(bound(nd));
          const sdOf = (e) => Math.sqrt(varN(Dd[e.k]));
          const wide = Math.max(...ests.filter((e) => e.k !== 'x1').map(sdOf), bsd);
          const xr = [th - 3.6 * wide, th + 3.6 * wide];
          sR.setView(xr, [0.3, rows + 0.7]);
          sR.setTicks(null, ests.map((e, i) => [rows - i, e.lab]));
          sR.vband(th - bsd, th + bsd, { color: 'green', alpha: 0.13, edges: true });
          sR.vline(th, { color: 'green', width: 1.8 });
          ests.forEach((e, i) => {
            const y = rows - i, vals = Dd[e.k], m = mean(vals), sd = sdOf(e);
            strip(sR, vals, y, 0.3, { color: e.col, alpha: 0.35, r: 1.7, seed: 11 + i });
            sR.line(m - sd, y - 0.38, m + sd, y - 0.38, { color: 'orange', width: 3 });
            sR.line(m - sd, y - 0.44, m - sd, y - 0.32, { color: 'orange', width: 2 }); sR.line(m + sd, y - 0.44, m + sd, y - 0.32, { color: 'orange', width: 2 });
            sR.dot(m, y - 0.38, { r: 3.4, color: 'ink' });
          });
          sR.setLabels(fam === 'poisson' ? 'estimate of $\\lambda$' : 'estimate of $\\mu$');
          v.legend([['green', 'bound $1/(nI)$ · its $\\pm1$ SD band'], ...ests.map((e) => [e.col, e.lab + (e.biased ? ' (biased)' : ''), { dot: true }]), ['orange', '±1 SD of the estimates']].concat(bT.value ? [['purple', 'bound for that bias, $(1+b\')^2/(nI)$', { dash: true }]] : []));
          const atN = ests.map((e) => ({ e, vr: varN(Dd[e.k]) * 1000 / 999, m: mean(Dd[e.k]) }));
          info = { fam, nd, lam, bound: bound(nd), atN };
        });
        v.readout(() => {
          if (!info) return '';
          const { nd, bound, atN, fam } = info;
          const parts = atN.map(({ e, vr }) => `${e.lab} ${v.fix(vr, 4)}` + (e.biased ? ' (biased)' : vr < bound * 0.97 ? ' ✗' : ''));
          const best = atN.filter((q) => !q.e.biased).reduce((a, b) => (b.vr < a.vr ? b : a));
          let s = String.raw`at $n=${nd}$ the bound is $1/(nI)=${v.fix(bound, 4)}$; simulated variances of 1,000 estimates: ${parts.join(', ')} · smallest unbiased: **${best.e.lab}**, efficiency ${v.fix(Math.min(1.5, bound / best.vr), 3)}`;
          const sh = atN.find((q) => q.e.biased);
          if (sh) s += String.raw` · the biased $\tfrac{n}{n+1}\bar X$ has variance ${v.fix(sh.vr, 4)} **below** the unbiased bound, but bias ${v.fix(sh.m - (fam === 'poisson' ? info.lam : 1), 3)}; its own bound is $(\tfrac{n}{n+1})^2/(nI)=${v.fix((nd / (nd + 1)) ** 2 * bound, 4)}$`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Attaining the Cramér–Rao bound',
      statement: String.raw`Under the conditions of the Cramér–Rao bound (stat-4.4), an unbiased estimator $T$ of $\tau(\theta)$ has $\operatorname{Var}_\theta T=\tau'(\theta)^2/\{nI(\theta)\}$ for all $\theta$ if and only if the score is an affine function of $T$:
$$S_n(\theta)=a(\theta)\,\big(T(X)-\tau(\theta)\big)\qquad\text{for all }\theta,\ \text{with } a(\theta)=nI(\theta)/\tau'(\theta).$$
Integrating in $\theta$, this happens exactly when the family is a one-parameter exponential family $f(x\mid\theta)=h(x)\exp\{\eta(\theta)t(x)-A(\theta)\}$ (stat-1.17), $T=\frac1n\sum t(X_i)$ and $\tau(\theta)=E_\theta\,t(X)$. So the bound is attained only for one special parametric function (up to affine changes) in one special kind of family. Examples: $\bar X$ for the Poisson or normal mean, $\hat p$ for a Bernoulli probability. The best unbiased estimator of $e^{-\lambda}$ in the Poisson model, $(1-\tfrac1n)^{\sum X_i}$, and of $\mu^2$ in the normal model, $\bar X^2-\tfrac1n$, have variances strictly above the bound.`,
      idea: String.raw`The Cramér–Rao bound came from the Cauchy–Schwarz inequality for $\operatorname{Cov}(T,S_n)$, and Cauchy–Schwarz is an equality exactly when the two variables are affinely related. Equivalently $\operatorname{Corr}_\theta(T,S_n)^2=\dfrac{\tau'(\theta)^2/(nI)}{\operatorname{Var}T}$ is the efficiency of $T$: an estimator is efficient precisely when it is perfectly correlated with the score. If $\partial_\theta\log f_n=a(\theta)(T-\tau(\theta))$ for all $\theta$, integrating in $\theta$ gives $\log f_n=\eta(\theta)T-B(\theta)+\log h(x)$, an exponential family in which $T$ is the sufficient statistic.`,
      caption: String.raw`Left: 2,000 simulated samples, each plotted at its estimate $T$ (across) and its score $S_n(\theta)$ at the true $\theta$ (up); discrete outcomes are drawn as discs sized by their frequency. For the Poisson mean, the Bernoulli probability and the normal mean every point lies on one straight line (correlation 1): efficient. Pick $e^{-\lambda}$, $p(1-p)$ or $\mu^2$: the best unbiased estimator lies on a curve or on two branches, not a line, and the squared correlation (readout) equals its efficiency. Right: the exact efficiency $\{\tau'^2/(nI)\}/\operatorname{Var}T$ across the parameter range, with the current value marked; it rises towards 1 as $n$ grows but never reaches it.`,
      deps: ['stat-4.4', 'stat-1.17'],
      see: ['stat-4.10'],
      refs: ['Casella–Berger §7.3'],
      tags: ['Cramér–Rao', 'efficiency', 'exponential family'],
      viz(v) {
        const TG = {
          pl: { fam: 'P', lab: 'Poisson: $\\lambda$', tau: (t) => t, d: () => 1, lo: 0.2, hi: 6, def: 2, p: 'λ', ptex: '\\lambda' },
          pe: { fam: 'P', lab: 'Poisson: $e^{-\\lambda}$', tau: (t) => Math.exp(-t), d: (t) => -Math.exp(-t), lo: 0.2, hi: 6, def: 1, p: 'λ', ptex: '\\lambda' },
          bp: { fam: 'B', lab: 'Bernoulli: $p$', tau: (t) => t, d: () => 1, lo: 0.05, hi: 0.95, def: 0.3, p: 'p', ptex: 'p' },
          bv: { fam: 'B', lab: 'Bernoulli: $p(1-p)$', tau: (t) => t * (1 - t), d: (t) => 1 - 2 * t, lo: 0.05, hi: 0.95, def: 0.25, p: 'p', ptex: 'p' },
          nm: { fam: 'N', lab: 'normal: $\\mu$', tau: (t) => t, d: () => 1, lo: -2, hi: 2, def: 0.8, p: 'μ', ptex: '\\mu' },
          nq: { fam: 'N', lab: 'normal: $\\mu^2$', tau: (t) => t * t, d: (t) => 2 * t, lo: -2, hi: 2, def: 0.8, p: 'μ', ptex: '\\mu' },
        };
        let tS = null;
        const tgS = v.select('target $\\tau(\\theta)$', Object.entries(TG).map(([value, o]) => ({ value, label: o.lab })), 'pl', { onChange: (k) => tS.set((TG[k].def - TG[k].lo) / (TG[k].hi - TG[k].lo)) });
        tS = v.slider('true parameter', 0, 1, (2 - 0.2) / 5.8, { step: 0.005, fmt: (u) => { const g = TG[tgS.value]; return `${g.p} = ${v.fix(g.lo + u * (g.hi - g.lo), 2)}`; } });
        const nS = v.slider('sample size $n$', 1, 30, 5, { int: true });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 1.15, xlabel: 'estimate $T$', ylabel: 'score $S_n(\\theta)$', title: 'is the score an affine function of $T$?' });
        const sR = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 350, weight: 0.85, xlabel: '$\\lambda$', ylabel: 'efficiency', title: 'efficiency of the best unbiased estimator' });
        // estimator and score from the sufficient statistic: y = ΣX (Poisson, Bernoulli) or x̄ (normal)
        const est = (k, n, y) => {
          if (k === 'pl' || k === 'bp') return y / n;
          if (k === 'pe') return Math.pow(1 - 1 / n, y);
          if (k === 'bv') return (y * (n - y)) / (n * (n - 1));
          if (k === 'nm') return y;
          return y * y - 1 / n;
        };
        const score = (fam, n, t, y) => (fam === 'P' ? y / t - n : fam === 'B' ? (y - n * t) / (t * (1 - t)) : n * (y - t));
        const info1 = (fam, t) => (fam === 'P' ? 1 / t : fam === 'B' ? 1 / (t * (1 - t)) : 1);
        const exVar = (k, n, t) => {
          if (k === 'pl') return t / n;
          if (k === 'pe') { const c = 1 - 1 / n; return Math.exp(n * t * (c * c - 1)) - Math.exp(-2 * t); }
          if (k === 'bp') return (t * (1 - t)) / n;
          if (k === 'bv') { let m = 0, m2 = 0; for (let y = 0; y <= n; y++) { const p = dbinom(y, n, t), u = est(k, n, y); m += p * u; m2 += p * u * u; } return m2 - m * m; }
          if (k === 'nm') return 1 / n;
          return (4 * t * t) / n + 2 / (n * n);
        };
        const eff = (k, n, t) => { const g = TG[k], b = g.d(t) ** 2 / (n * info1(g.fam, t)), vr = exVar(k, n, t); return vr > 0 ? b / vr : NaN; };
        const R = repeater(v, {
          key: () => [tgS.value, tS.value.toFixed(4), nS.value].join('|'),
          sample: (r) => {
            const g = TG[tgS.value], n = Math.max(nS.value, tgS.value === 'bv' ? 2 : 1), t = g.lo + tS.value * (g.hi - g.lo);
            let y = 0; if (g.fam === 'N') { for (let i = 0; i < n; i++) y += t + r.normal(); return y / n; }
            for (let i = 0; i < n; i++) y += g.fam === 'P' ? rpois(r, t) : r() < t ? 1 : 0; return y;
          },
          init: 2000, buttons: [2000], clear: false, seed: 'stat4.5',
        });
        let info = null;
        v.render(() => {
          const k = tgS.value, g = TG[k], n = Math.max(nS.value, k === 'bv' ? 2 : 1), t = g.lo + tS.value * (g.hi - g.lo), S = R.sync();
          const pts = S.vals.map((y) => [est(k, n, y), score(g.fam, n, t, y)]);
          // left: the scatter (aggregated when discrete)
          const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          const sx = sortNum(xs), sy = sortNum(ys);
          let x0 = qSorted(sx, 0.002), x1 = qSorted(sx, 0.998), y0 = qSorted(sy, 0.002), y1 = qSorted(sy, 0.998);
          if (x1 - x0 < 1e-9) { x0 -= 0.5; x1 += 0.5; } if (y1 - y0 < 1e-9) { y0 -= 0.5; y1 += 0.5; }
          const px = 0.08 * (x1 - x0), py = 0.1 * (y1 - y0);
          sL.setView([x0 - px, x1 + px], [y0 - py, y1 + py]);
          sL.hline(0, { color: 'faint', width: 1 }); sL.vline(g.tau(t), { color: 'green', width: 1.6, dash: [5, 4] });
          // the exact affine relation S = nI/τ' (T − τ) that efficiency demands
          const a = (n * info1(g.fam, t)) / g.d(t);
          if (Number.isFinite(a)) sL.fn((x) => a * (x - g.tau(t)), { color: 'green', width: 1.6, alpha: 0.7 });
          if (g.fam === 'N') sL.dots(pts, { r: 2, color: 'gold', alpha: 0.4 });
          else {
            const cnt = new Map(); for (const p of pts) { const key = p[0].toFixed(9) + ',' + p[1].toFixed(9); const c = cnt.get(key); if (c) c.c++; else cnt.set(key, { p, c: 1 }); }
            for (const { p, c } of cnt.values()) sL.dot(p[0], p[1], { r: 2.5 + 9 * Math.sqrt(c / pts.length), color: 'gold', alpha: 0.75 });
          }
          sL.text('τ(θ)', g.tau(t), y1 + py, { color: 'green', size: 12, weight: 700, dy: 12, dx: 4, align: 'left' });
          // correlation of T and S
          const mx = mean(xs), my = mean(ys); let cxx = 0, cyy = 0, cxy = 0;
          for (const [x, y] of pts) { cxx += (x - mx) ** 2; cyy += (y - my) ** 2; cxy += (x - mx) * (y - my); }
          const rho2 = cxx > 0 && cyy > 0 ? (cxy * cxy) / (cxx * cyy) : NaN;
          // right: the exact efficiency curve
          sR.setView([g.lo, g.hi], [0, 1.08]); sR.setLabels(`$${g.ptex}$`);
          sR.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          for (const m of [1, 2, 5, 10, 30]) if (m !== n && (k !== 'bv' || m >= 2)) { sR.fn((u) => eff(k, m, u), { domain: [g.lo, g.hi], color: 'muted', width: 1, alpha: 0.6, n: 160 }); }
          sR.fn((u) => eff(k, n, u), { domain: [g.lo, g.hi], color: 'accent', width: 2.6, n: 240 });
          const e = eff(k, n, t);
          sR.vline(t, { color: 'gold', width: 1.4 });
          if (Number.isFinite(e)) sR.dot(t, e, { r: 5.5, color: 'accent' });
          if (Number.isFinite(rho2)) sR.dot(t, rho2, { r: 5, hollow: true, color: 'ink', width: 2 });
          v.legend([['gold', 'one simulated sample (disc area ∝ frequency)', { dot: true }], ['green', 'the line efficiency demands · target'], ['accent', 'exact efficiency (grey: n = 1, 2, 5, 10, 30)'], ['ink', 'simulated $\\mathrm{Corr}(T,S_n)^2$', { dot: true }]]);
          info = { k, g, n, t, rho2, e, vr: exVar(k, n, t), bound: g.d(t) ** 2 / (n * info1(g.fam, t)), N: pts.length, clamped: k === 'bv' && nS.value < 2 };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, g, n, t, rho2, e, vr, bound, N, clamped } = info;
          const effic = Math.abs(e - 1) < 1e-9;
          let s = String.raw`$${g.ptex}=${v.fix(t, 2)}$, $n=${n}$: $\operatorname{Var}T=${v.fix(vr, 5)}$, bound $\tau'^2/(nI)=${v.fix(bound, 5)}$, efficiency **${v.fix(e, 4)}** · squared correlation of $T$ with the score over ${commas(N)} samples: **${v.fix(rho2, 4)}**`;
          s += effic ? ' — **the score is exactly affine in $T$: the bound is attained** ✓' : ' — **the points do not lie on a line, so the bound is not attained**';
          if (clamped) s += ' · $n=1$ is not allowed here: with one Bernoulli trial no unbiased estimator of $p(1-p)$ exists (stat-4.13)';
          if (k === 'bv' && Math.abs(t - 0.5) < 0.01) s += ' · at $p=\\tfrac12$, $\\tau\'=0$ and the bound is 0';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Multiparameter Cramér–Rao bound',
      credit: 'Rao, 1945; Cramér, 1946',
      statement: String.raw`Let $\theta\in\Theta\subseteq\R^k$ be open, the family regular, and the **Fisher information matrix**
$$I(\theta)_{jl}=E_\theta\big[\partial_j\log f(X\mid\theta)\,\partial_l\log f(X\mid\theta)\big]=-E_\theta\big[\partial_j\partial_l\log f(X\mid\theta)\big]$$
positive definite (ladr-7.62). If $T$ is an unbiased estimator of $\theta$ from $n$ i.i.d. observations, then
$$\operatorname{Cov}_\theta(T)\ \succeq\ \{nI(\theta)\}^{-1},$$
in the sense that the difference is positive semidefinite; for an unbiased estimator of $g(\theta)\in\R^m$ the bound is $\nabla g\,\{nI\}^{-1}\nabla g^{\mathsf T}$. In particular $\operatorname{Var}T_1\ge[\{nI\}^{-1}]_{11}\ge1/\{nI_{11}\}$: when the other parameters are unknown, the bound for $\theta_1$ is the $(1,1)$ entry of the inverse, which exceeds the one-parameter bound unless $\theta_1$ is information-orthogonal to the rest ($I_{1l}=0$ for $l\ne1$). For the gamma family with shape $\alpha$ and rate $\beta$, $I=\begin{pmatrix}\psi'(\alpha)&-1/\beta\\-1/\beta&\alpha/\beta^2\end{pmatrix}$.`,
      idea: String.raw`Apply the one-parameter bound to every linear combination $c^{\mathsf T}T$, an unbiased estimator of $c^{\mathsf T}\theta$: the Cauchy–Schwarz step with the score vector gives $c^{\mathsf T}\operatorname{Cov}(T)c\ge c^{\mathsf T}\{nI\}^{-1}c$ for every $c$, which is the matrix inequality. The ellipse $\{x:(x-\theta)^{\mathsf T}nI(x-\theta)\le4\}$ therefore sits inside the corresponding ellipse of every unbiased estimator. Not knowing the nuisance parameter costs precision: $[\{I\}^{-1}]_{11}=1/(I_{11}-I_{12}^2/I_{22})$, the Schur complement, so the loss factor is $1/(1-\rho^2)$ with $\rho$ the correlation read off the information. Reparametrizing to make the parameters orthogonal (for the gamma: shape and mean) untilts the ellipse. The maximum likelihood estimator is not exactly unbiased, but in large samples its covariance approaches this bound (stat-5.6).`,
      caption: String.raw`1,000 maximum-likelihood fits $(\hat\alpha,\hat\beta)$ of a gamma model from samples of size $n$ (gold), with the ellipse of the inverse information $\{nI\}^{-1}$ (green, 2 SD) and the ellipse of the simulated covariance (orange). The green dashed lines mark the two-parameter bound for $\hat\alpha$, $\pm2\sqrt{[\{nI\}^{-1}]_{\alpha\alpha}}$; the narrower purple ones the bound if $\beta$ were known, $\pm2/\sqrt{nI_{\alpha\alpha}}$. Shape and rate are strongly correlated, the ellipse is tilted, and the loss factor is large. Switch to the orthogonal parametrization (shape, mean): the ellipse straightens and the two bounds for $\alpha$ get much closer. At small $n$ the cloud is skewed and larger than the bound (the MLE is biased); raise $n$ and the orange ellipse settles onto the green.`,
      deps: ['stat-4.4', 'ladr-7.62'],
      see: ['stat-3.4', 'stat-5.6'],
      refs: ['Casella–Berger §7.3'],
      tags: ['information', 'Cramér–Rao', 'multiparameter'],
      viz(v) {
        const M = v.M;
        const parS = v.select('parametrization', [{ value: 'rate', label: 'shape $\\alpha$, rate $\\beta$' }, { value: 'mean', label: 'shape $\\alpha$, mean $\\mu=\\alpha/\\beta$ (orthogonal)' }], 'rate');
        const aS = v.slider('true shape $\\alpha$ (rate 1)', 0.5, 8, 2, { log: true });
        const nS = v.slider('sample size $n$', 10, 1000, 60, { int: true, log: true });
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 1.3, xlabel: '$\\hat\\alpha$', ylabel: '$\\hat\\beta$', title: '1,000 maximum-likelihood estimates' });
        const sB = v.stage({ x: [0, 1], y: [0, 3.2], axes: 'box', gutter: { l: 84 }, height: 400, weight: 0.7, minWidth: 220, xlabel: 'variance of $\\hat\\alpha$', title: 'variance of $\\hat\\alpha$ and its bounds' });
        const mc = memo();
        const fits = (a, n) => mc(a + '|' + n, () => {
          const r = v.rng(hashStr(`mcr|${a}|${n}`)), G = M.dist.gamma(a, 1), out = [];
          for (let c = 0; c < 1000; c++) { let sx = 0, sl = 0; for (let i = 0; i < n; i++) { const x = Math.max(1e-300, G.sample(r)); sx += x; sl += Math.log(x); } const f = gammaMLE(sx / n, sl / n); out.push([f.alpha, f.beta, sx / n]); }
          return out;
        });
        let info = null;
        v.render(() => {
          const a = aS.value, n = nS.value, par = parS.value, b = 1, mu = a / b, F = fits(a, n);
          // per-observation information and its inverse, in the chosen coordinates
          const I = par === 'rate' ? [trigamma(a), -1 / b, a / (b * b)] : [trigamma(a) - 1 / a, 0, a / (mu * mu)];
          const det = I[0] * I[2] - I[1] * I[1], inv = [I[2] / det / n, -I[1] / det / n, I[0] / det / n];
          const pts = F.map((f) => [f[0], par === 'rate' ? f[1] : f[2]]), y0 = par === 'rate' ? b : mu;
          const mx = mean(pts.map((p) => p[0])), my = mean(pts.map((p) => p[1]));
          let cxx = 0, cxy = 0, cyy = 0; for (const [x, y] of pts) { cxx += (x - mx) ** 2; cxy += (x - mx) * (y - my); cyy += (y - my) ** 2; }
          cxx /= 999; cxy /= 999; cyy /= 999;
          const qx = sortNum(pts.map((p) => p[0])), qy = sortNum(pts.map((p) => p[1]));
          const wx = 3 * Math.sqrt(inv[0]), wy = 3 * Math.sqrt(inv[2]);
          const vx = [Math.min(a - wx, qSorted(qx, 0.004)), Math.max(a + wx, qSorted(qx, 0.996))], vy = [Math.min(y0 - wy, qSorted(qy, 0.004)), Math.max(y0 + wy, qSorted(qy, 0.996))];
          const px = 0.05 * (vx[1] - vx[0]), py = 0.05 * (vy[1] - vy[0]);
          sP.setView([vx[0] - px, vx[1] + px], [vy[0] - py, vy[1] + py]);
          sP.setLabels('$\\hat\\alpha$', par === 'rate' ? '$\\hat\\beta$' : '$\\hat\\mu=\\bar X$');
          const marg = 2 * Math.sqrt(inv[0]), cond = 2 / Math.sqrt(n * I[0]);
          sP.vband(a - cond, a + cond, { color: 'purple', alpha: 0.08 });
          for (const s of [-1, 1]) { sP.vline(a + s * marg, { color: 'green', width: 1.6, dash: [6, 4] }); sP.vline(a + s * cond, { color: 'purple', width: 1.6, dash: [3, 3] }); }
          sP.dots(pts, { r: 1.9, color: 'gold', alpha: 0.42 });
          sP.path(ellipsePts(a, y0, inv[0], inv[1], inv[2], 2), { color: 'green', width: 3 });
          sP.path(ellipsePts(mx, my, cxx, cxy, cyy, 2), { color: 'orange', width: 2.2 });
          sP.dot(a, y0, { r: 5, color: 'green' });
          let inside = 0; for (const [x, y] of pts) { const dx = x - a, dy = y - y0, q = (inv[2] * dx * dx - 2 * inv[1] * dx * dy + inv[0] * dy * dy) / (inv[0] * inv[2] - inv[1] * inv[1]); if (q <= 4) inside++; }
          // right: bars for Var α̂ against the two bounds
          const rows = [['simulated', cxx, 'orange'], ['bound, β unknown', inv[0], 'green'], ['bound, β known', 1 / (n * I[0]), 'purple']];
          const top = Math.max(...rows.map((q) => q[1])) * 1.25;
          sB.setView([0, top], [0.4, 3.6]);
          rows.forEach(([lab, val, col], i) => { sB.rect(0, 3 - i - 0.28, val, 3 - i + 0.28, { fill: col, fillAlpha: 0.65, stroke: false, radius: 3 }); sB.text(v.fix(val, 4), val, 3 - i, { color: 'ink', size: 11.5, dx: 4, align: val > top * 0.7 ? 'right' : 'left', plate: true }); });
          const oth = par === 'rate' ? 'β' : 'μ'; sB.setTicks(null, [[3, 'simulated'], [2, `${oth} unknown`], [1, `${oth} known`]]);
          v.legend([['gold', 'one fit', { dot: true }], ['green', 'inverse information $\\{nI\\}^{-1}$ (2 SD)'], ['orange', 'simulated covariance (2 SD)'], ['purple', 'bound for $\\alpha$ if the other parameter were known', { dash: true }]]);
          const rho = -I[1] / Math.sqrt(I[0] * I[2]);
          info = { a, n, par, inv, cxx, cxy, cyy, inside, loss: inv[0] * n * I[0], rho, bias: mx - a };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, par, inv, cxx, inside, loss, rho, bias } = info;
          return String.raw`$n=${n}$: simulated $\operatorname{Var}\hat\alpha=${v.fix(cxx, 4)}$ vs bound $[\{nI\}^{-1}]_{\alpha\alpha}=${v.fix(inv[0], 4)}$ (ratio ${v.fix(cxx / inv[0], 3)}; bias of $\hat\alpha$ ${v.fix(bias, 3)}) · ${pct(inside / 1000, 1)} of the fits inside the green ellipse (about 86% expected for large $n$) · correlation in the information ${v.fix(rho, 3)} · **not knowing the ${par === 'rate' ? 'rate' : 'mean'} multiplies the bound for $\alpha$ by $1/(1-\rho^2)=${v.fix(loss, 3)}$**` + (par === 'mean' ? ' — orthogonal: the ellipse has no tilt and knowing $\\mu$ would not help; the bound for $\\alpha$ is the same number as in the (shape, rate) picture, because it does not depend on how the nuisance parameter is named' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Beating the Cramér–Rao rate in non-regular models',
      statement: String.raw`When the support of $f(x\mid\theta)$ depends on $\theta$ the Cramér–Rao bound need not hold, and estimators can have variance of order $1/n^2$ rather than $1/n$. For $X_i\sim\mathrm{Uniform}(0,\theta)$, the unbiased $\hat\theta=\tfrac{n+1}{n}X_{(n)}$ has
$$\operatorname{Var}_\theta\hat\theta=\frac{\theta^2}{n(n+2)},$$
while the formal bound $1/\{nE\,s^2\}=\theta^2/n$ (with $s=-1/\theta$) is larger for every $n\ge2$, and the moment estimator $2\bar X$ has variance $\theta^2/(3n)$. For the shifted exponential $f(x\mid\theta)=e^{-(x-\theta)}$, $x>\theta$, the unbiased $X_{(1)}-1/n$ has variance $1/n^2$, against $1/n$ for $\bar X-1$. In both cases $n(\theta-\hat\theta)$, not $\sqrt n(\theta-\hat\theta)$, has a non-degenerate limit (exponential, not normal).`,
      idea: String.raw`The bound rests on differentiating $\int T f_n\,dx$ under the integral sign (stat-4.4); when the region of integration moves with $\theta$ that step adds a boundary term, and the score no longer has mean zero (stat-4.3). The geometry is different too: near a hard edge the density does not fade out, so the sample extremes crowd against the edge at distance of order $1/n$ (stat-1.12), and the edge is located $\sqrt n$ times more precisely than a smooth centre. The likelihood is not a parabola but a cliff (stat-3.13). Rates faster than $\sqrt n$ are a signature of non-regularity: change-points, boundaries, and supports of unknown extent.`,
      caption: String.raw`Left, log–log: the variance of estimators against $n$, each dot from 2,000 samples. The endpoint estimator (blue) falls with slope $-2$; the moment estimator (orange) with slope $-1$, like any regular estimator, and the formal Cramér–Rao line (green) has slope $-1$ too, so the endpoint estimator crosses below it at once. Right: the histogram of the scaled error of the endpoint estimator at the $n$ on the slider, with its exact density: scaled by $n$ its shape does not change as $n$ grows; scale by $\sqrt n$ instead and it collapses to a spike. For the **regular** normal model the roles reverse: there the $\sqrt n$-scaled error is stable and nothing beats $1/n$.`,
      deps: ['stat-4.4', 'stat-3.13'],
      see: ['stat-1.12', 'stat-4.11'],
      refs: ['Casella–Berger §7.3'],
      tags: ['Cramér–Rao', 'non-regular', 'rates'],
      viz(v) {
        const NSET = [2, 3, 5, 8, 13, 20, 32, 50, 80, 130, 200, 320, 500], REPS = 2000, TH = 1;
        const famS = v.select('model', [{ value: 'unif', label: 'uniform $(0,\\theta)$' }, { value: 'sexp', label: 'shifted exponential' }, { value: 'norm', label: 'normal mean (regular)' }], 'unif');
        const nS = v.slider('histogram at $n$', 2, 500, 20, { int: true, log: true });
        const scS = v.select('scale the error by', [{ value: 'n', label: '$n$' }, { value: 'rn', label: '$\\sqrt n$' }], 'n');
        const sL = v.stage({ x: [1.6, 650], y: [1e-6, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 370, weight: 1.15, xlabel: 'sample size $n$', ylabel: 'variance', title: 'how fast the variance falls' });
        const sR = v.stage({ x: [-4, 2], y: [0, 1], axes: 'box', gutter: true, height: 370, weight: 0.85, xlabel: 'scaled error', title: 'the endpoint estimator, scaled' });
        const SPEC = {
          unif: { a: { lab: '(n+1)/n · max', ex: (n) => 1 / (n * (n + 2)) }, b: { lab: '2X̄', ex: (n) => 1 / (3 * n) }, cr: (n) => 1 / n, crLab: 'formal bound θ²/n' },
          sexp: { a: { lab: 'min − 1/n', ex: (n) => 1 / (n * n) }, b: { lab: 'X̄ − 1', ex: (n) => 1 / n }, cr: (n) => 1 / n, crLab: 'formal bound 1/n' },
          norm: { a: { lab: 'median', ex: null }, b: { lab: 'X̄', ex: (n) => 1 / n }, cr: (n) => 1 / n, crLab: 'Cramér–Rao bound 1/n' },
        };
        const draw = (fam, r, n) => {
          let s = 0, mn = Infinity, mx = -Infinity; const xs = fam === 'norm' ? new Float64Array(n) : null;
          for (let i = 0; i < n; i++) { const x = fam === 'unif' ? TH * r() : fam === 'sexp' ? TH - Math.log(1 - r()) : TH + r.normal(); s += x; if (x < mn) mn = x; if (x > mx) mx = x; if (xs) xs[i] = x; }
          if (fam === 'unif') return [((n + 1) / n) * mx, (2 * s) / n];
          if (fam === 'sexp') return [mn - 1 / n, s / n - 1];
          xs.sort(); return [n % 2 ? xs[(n - 1) >> 1] : 0.5 * (xs[n / 2 - 1] + xs[n / 2]), s / n];
        };
        const mc = memo(), mh = memo();
        const curves = (fam) => mc(fam, () => {
          const r = v.rng(hashStr(`nr|${fam}`));
          return NSET.map((n) => { const A = new Float64Array(REPS), B = new Float64Array(REPS); for (let c = 0; c < REPS; c++) { const [a, b] = draw(fam, r, n); A[c] = a; B[c] = b; } return { n, a: varN(A) * REPS / (REPS - 1), b: varN(B) * REPS / (REPS - 1), ma: mean(A) }; });
        });
        const hist = (fam, n) => mh(fam + '|' + n, () => { const r = v.rng(hashStr(`nrh|${fam}|${n}`)), A = new Float64Array(4000); for (let c = 0; c < 4000; c++) A[c] = draw(fam, r, n)[0] - TH; return A; });
        let info = null;
        v.render(() => {
          const fam = famS.value, sp = SPEC[fam], C = curves(fam), n = nS.value, sc = scS.value;
          const ys = C.flatMap((c) => [c.a, c.b]);
          sL.setView([1.6, 650], [Math.min(...ys) * 0.4, Math.max(...ys, sp.cr(2)) * 2.5]);
          sL.fn(sp.cr, { domain: [1.6, 650], color: 'green', width: 4, alpha: 0.8 });
          for (const [k, col] of [['a', 'accent'], ['b', 'orange']]) {
            if (sp[k].ex) sL.fn(sp[k].ex, { domain: [1.6, 650], color: col, width: 1.6, alpha: 0.85 });
            const pts = C.map((c) => [c.n, c[k]]);
            for (const [m, vr] of pts) { const se = vr * Math.sqrt(2 / (REPS - 1)) * (fam === 'norm' ? 1 : k === 'a' ? 1.4 : 1); sL.line(m, Math.max(vr * 0.3, vr - 2 * se), m, vr + 2 * se, { color: col, width: 1.2 }); }
            sL.dots(pts, { r: 3.6, color: col });
          }
          sL.vline(n, { color: 'gold', width: 1.4, dash: [3, 4] });
          sL.text(sp.crLab, 2.2, sp.cr(2.2), { color: 'green', size: 12, weight: 700, align: 'left', dy: -14, plate: true });
          const slA = logSlope(C.filter((c) => c.n >= 13).map((c) => [c.n, c.a])), slB = logSlope(C.filter((c) => c.n >= 13).map((c) => [c.n, c.b]));
          // right: the scaled error
          const A = hist(fam, n), k = sc === 'n' ? n : Math.sqrt(n), vals = Array.from(A, (e) => k * e);
          const xr = fam === 'norm' ? (sc === 'n' ? [-4 * Math.sqrt(n) * 1.25, 4 * Math.sqrt(n) * 1.25] : [-4.5, 4.5]) : sc === 'n' ? [-4, 2] : [-4, 2];
          const B = binned(vals, xr[0], xr[1], 60);
          // exact densities of the scaled error y = k·(θ̂ − θ)
          let pdf = null;
          if (fam === 'unif') pdf = (y) => { const u = (y / k + 1) * n / (n + 1); return u > 0 && u <= 1 ? (n * u ** (n - 1)) * (n / (n + 1)) / k : 0; };
          else if (fam === 'sexp') pdf = (y) => { const e = y / k + 1 / n; return e > 0 ? (n * Math.exp(-n * e)) / k : 0; };
          let peak = B.max; if (pdf) for (let i = 0; i <= 400; i++) { const y = pdf(xr[0] + ((xr[1] - xr[0]) * i) / 400); if (Number.isFinite(y)) peak = Math.max(peak, Math.min(y, 6)); }
          sR.setView(xr, [0, Math.min(peak, 3 * Math.max(B.max, 0.05)) * 1.18]);
          sR.hist(B, { density: true, color: 'accent', fillAlpha: 0.35, width: 1.4 });
          if (pdf) sR.fn(pdf, { domain: xr, color: 'ink', width: 2, n: 500 });
          else if (sc === 'rn') sR.fn((y) => Math.exp(-y * y / (2 * Math.PI / 2)) / Math.sqrt(2 * Math.PI * Math.PI / 2), { domain: xr, color: 'ink', width: 1.6, dash: [5, 4] });
          sR.vline(0, { color: 'green', width: 1.6 });
          sR.setLabels(sc === 'n' ? '$n\\,(\\hat\\theta-\\theta)$' : '$\\sqrt n\\,(\\hat\\theta-\\theta)$');
          const sd = Math.sqrt(varN(vals));
          v.legend([['accent', sp.a.lab + (fam === 'norm' ? '' : ' (endpoint)')], ['orange', sp.b.lab], ['green', sp.crLab], ['ink', 'exact variance · exact density' + (fam === 'norm' ? ' (normal approximation)' : '')]]);
          info = { fam, sp, slA, slB, n, sd, sc, vA: C.find((c) => c.n === 500).a, cr500: sp.cr(500) };
        });
        v.readout(() => {
          if (!info) return '';
          const { fam, sp, slA, slB, n, sd, sc, vA, cr500 } = info;
          let s = String.raw`fitted log–log slopes (n ≥ 13): ${sp.a.lab} **${v.fix(slA, 2)}**, ${sp.b.lab} **${v.fix(slB, 2)}** · at $n=500$ the ${fam === 'norm' ? 'median' : 'endpoint estimator'} has variance $${v.sci(vA, 3)}$ against the ${fam === 'norm' ? 'bound' : 'formal bound'} $${v.sci(cr500, 3)}$ · SD of the ${sc === 'n' ? '$n$' : '$\\sqrt n$'}-scaled error at $n=${n}$: ${v.fix(sd, 3)}`;
          s += fam === 'norm' ? ' — **regular model: every unbiased estimator stays above $1/n$**' : ' — **the support moves with $\\theta$: the bound does not apply, and the variance falls like $1/n^2$**';
          return s;
        });
      },
    },
  ],
};
