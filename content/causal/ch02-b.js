// Causal Inference — Chapter 2: Randomized experiments (items 2.7–2.12; 2.1–2.6 in ch02.js)
//
// Sources and honesty notes (Oct 2026):
// - All populations except the two historical data sets are simulated from fixed seeds.
// - Darwin's Zea mays differences (item 2.12) are typed from memory of the table in Fisher's Design of Experiments, ch. III
//   (differences of cross- minus self-fertilized plants, eighths of an inch): they are checked by their sum (314) and by the paired
//   t statistic they give (2.148 on 14 d.f.), t = 2.148 on 14 d.f. and the first six differences (6.125, -8.375, 1, 2, 0.75, 2.875 in) were confirmed against the HistData/agridat Zea mays data; the other nine differences are confirmed only through the sum and t.
// - Neyman 1923 and Fisher 1935: bibliographic data are those of the syllabus; the content of the papers is described from secondary
//   knowledge and the statistics are recomputed here by exact enumeration, not copied from the papers.
import {
  clamp, logistic, pct, sg, fx, mean, memo, rng, binCounts, barsH, lab, commas,
  svar, randAssign, armStats, diffMeans, finitePop, exactVar, forEachAssign, choose, histPanel, confPop, ols, fitLogit,
} from './ch02.shared.js';

const sd = (a) => Math.sqrt(svar(a));
/** Vertical bars on a stage with custom tick labels; `entries` = [{label, val, color}]; `ref` draws a reference line. */
function effBars(s, entries, lo, hi, ref) {
  s.setView([0.4, entries.length + 0.6], [lo, hi]);
  s.setTicks(entries.map((e, i) => [i + 1, e.label]), undefined);
  entries.forEach((e, i) => {
    s.rect(i + 0.62, 0, i + 1.38, e.val, { fill: e.color, fillAlpha: 0.33, color: e.color, width: 1.6 });
    s.text((e.val >= 0 ? '+' : '−') + Math.abs(e.val).toFixed(e.dec ?? 3), i + 1, e.val >= 0 ? e.val + (hi - lo) * 0.045 : e.val - (hi - lo) * 0.045, { size: 12.5, align: 'center', weight: 700 });
  });
  if (ref !== undefined) { s.hline(ref, { color: 'ink', width: 2, dash: [6, 4] }); }
}

export default {
  collection: 'causal',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Method', name: 'Inverse probability weighting',
      statement: String.raw`Let $A$ be binary and let $L$ be a covariate with $Y^a\perp A\mid L$ and positivity (the **propensity** $\pi(L)=P(A=1\mid L)$ lies strictly between 0 and 1). Give each person the **weight** $W=1/P(A\mid L)$, that is $1/\pi(L)$ if treated and $1/(1-\pi(L))$ if not. In the *pseudo-population* in which each person counts $W$ times, treatment is independent of $L$ (both arms have the same covariate distribution, that of the whole population), so there is no confounding by $L$, and
$$E[Y^a]=E\!\left[\frac{\mathbf 1\{A=a\}\,Y}{P(A=a\mid L)}\right],\qquad \widehat E[Y^a]=\frac{\sum_i \mathbf 1\{A_i=a\}W_iY_i}{\sum_i\mathbf 1\{A_i=a\}W_i}$$
(the second form, with weights normalized within the arm, is the common Hájek version). Where $\pi(L)$ is near 0 or 1 the weights are huge and the estimate is unstable; at 0 or 1 the method has no answer.`,
      idea: String.raw`A person who got a treatment that was unlikely for people like them stands for many similar people who did not get it, so counting them $1/P(A\mid L)$ times fills in the missing comparison group. Formally, $E[\mathbf 1\{A=a\}Y/P(A=a\mid L)\mid L]=E[Y^a\mid L]$ by exchangeability and consistency, and averaging over $L$ gives $E[Y^a]$. With empirical stratum treatment frequencies as propensities and both arms nonempty, a sample cell has exact total weight $\sum_{\rm cell}W=n_l$. With true or other modeled propensities, balance is a population identity rather than an exact finite-sample equality; weighted sample covariate distributions can still fluctuate.

In a finite positive-probability covariate partition with bounded outcomes, the cell-average definition of conditional expectation (PROB 4.1.1a) cancels the treatment probability in the weighted indicator’s cell mean. Consistency and exchangeability turn the result into the conditional counterfactual mean. The tower property (PROB 4.1.13) then averages it over $L$. This finite-table argument satisfies integrability even with unequal weights; for a general unbounded setting the required integrability must be checked separately.`,
      caption: String.raw`Left: 320 people from the cohort of item 2.6, placed in the four cells (treatment $\times$ severity) and drawn with **area proportional to their weight**: the rare combinations (severe but untreated, mild but treated) are the big dots. Middle: the share of severe patients in each arm before weighting (muted: the arms differ) and after (green: they match the whole cohort). Right: crude, weighted and hidden-truth risk differences. Raise **confounding** and the weights explode (see the largest weight in the readout); at 0 the weights are all 2 and nothing changes.`,
      deps: ['causal-2.5', 'causal-1.9', 'prob-4.1.1a', 'prob-4.1.13'], refs: ['Hernán–Robins §2.4'], tags: ['weighting', 'propensity score'],
      credit: 'Horvitz & Thompson, 1952 (weights); Rosenbaum & Rubin, 1983 (propensity score); Robins, 1990s (marginal structural models)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inverse_probability_weighting' },
      viz(v) {
        const cs = v.slider('confounding: how much severity drives treatment', 0, 3, 1.5, { step: 0.1 });
        const rr = v.slider('risk ratio of the treatment', 0.3, 1.4, 0.7, { step: 0.05 });
        const pL = v.slider('share severe, $P(L=1)$', 0.1, 0.7, 0.3, { step: 0.05 });
        const get = memo();
        const rp = (() => { const r = rng(808), a = [], b = []; for (let i = 0; i < 320; i++) { a.push(r()); b.push(r()); } return { a, b }; })();
        const calc = () => get([cs.value, rr.value, pL.value].join('|'), () => {
          const Q = confPop(4000, 11, { pL: pL.value, c: cs.value, rr: rr.value }), n = Q.n, cnt = Q.cnt;
          const nl = [cnt[0][0] + cnt[0][1], cnt[1][0] + cnt[1][1]], pi = [cnt[0][1] / nl[0], cnt[1][1] / nl[1]];
          const W = new Float64Array(n), sw = [0, 0], swy = [0, 0], swl = [0, 0], rl = [0, 0], cn = [0, 0], cl = [0, 0]; let wmax = 0;
          for (let i = 0; i < n; i++) {
            const a = Q.A[i], p = pi[Q.L[i]]; W[i] = a ? 1 / p : 1 / (1 - p); wmax = Math.max(wmax, W[i]);
            sw[a] += W[i]; swy[a] += W[i] * Q.Y[i]; swl[a] += W[i] * Q.L[i]; rl[a] += Q.L[i]; cn[a]++;
          }
          const ipw = [swy[0] / sw[0], swy[1] / sw[1]], crude = [0, 1].map((a) => { let s = 0; for (let i = 0; i < n; i++) if (Q.A[i] === a) s += Q.Y[i]; return s / cn[a]; });
          return { Q, pi, W, sw, ipw, crude, wmax, balRaw: [rl[0] / cn[0], rl[1] / cn[1]], balW: [swl[0] / sw[0], swl[1] / sw[1]] };
        });
        const sP = v.stage({ x: [0, 2], y: [0, 2], axes: false, height: 340, title: 'people, area ∝ weight', weight: 1.25 });
        const sB = v.stage({ x: [0.4, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 340, ylabel: 'share of the arm that is severe', title: 'balance in $L$', weight: 1 });
        const sD = v.stage({ x: [0.4, 3.6], y: [-0.25, 0.25], axes: 'box', gutter: true, height: 340, ylabel: 'risk difference', title: 'effect on the risk', weight: 0.9 });
        v.legend([['accent', 'treated', { dot: true }], ['orange', 'untreated', { dot: true }], ['muted', 'raw share severe'], ['green', 'weighted share severe']]);
        v.render(() => {
          const C = calc(), Q = C.Q;
          for (let a = 0; a < 2; a++) for (let l = 0; l < 2; l++) {
            sP.rect(a + 0.03, l + 0.03, a + 0.97, l + 0.97, { color: 'faint', width: 1.2, fill: 'panel', fillAlpha: 0.001 });
            sP.text((a ? 'treated' : 'untreated') + ', ' + (l ? 'severe' : 'mild'), a + 0.5, l + 0.9, { size: 11.5, color: 'muted', align: 'center' });
            sP.text('n=' + Q.cnt[l][a] + ',  weight ' + (1 / (a ? C.pi[l] : 1 - C.pi[l])).toFixed(1), a + 0.5, l + 0.07, { size: 11.5, color: 'ink', align: 'center', weight: 700 });
          }
          for (let i = 0; i < 320; i++) {
            const a = Q.A[i], l = Q.L[i], w = C.W[i], r = Math.min(15, 2.3 * Math.sqrt(w));
            sP.dot(a + 0.08 + 0.84 * rp.a[i], l + 0.14 + 0.66 * rp.b[i], { r, color: a ? 'accent' : 'orange', alpha: 0.55 });
          }
          const ent = [{ label: 'raw', val: C.balRaw[0], color: 'muted' }, { label: 'weighted', val: C.balW[0], color: 'green' }, { label: 'raw', val: C.balRaw[1], color: 'muted' }, { label: 'weighted', val: C.balW[1], color: 'green' }];
          sB.text('untreated arm', 1.5, 0.96, { size: 12.5, color: 'orange', align: 'center', weight: 700 }); sB.text('treated arm', 3.5, 0.96, { size: 12.5, color: 'accent', align: 'center', weight: 700 });
          sB.setView([0.4, 4.6], [0, 1]); sB.setTicks(ent.map((e, i) => [i + 1, e.label]), undefined);
          ent.forEach((e, i) => { sB.rect(i + 0.62, 0, i + 1.38, e.val, { fill: e.color, fillAlpha: 0.33, color: e.color, width: 1.6 }); sB.text(e.val.toFixed(2), i + 1, e.val + 0.04, { size: 12.5, align: 'center', weight: 700 }); });
          sB.hline(pL.value, { color: 'ink', width: 1.6, dash: [6, 4] });
          effBars(sD, [{ label: 'crude', val: C.crude[1] - C.crude[0], color: 'red' }, { label: 'weighted', val: C.ipw[1] - C.ipw[0], color: 'green' }, { label: 'truth', val: Q.truth1 - Q.truth0, color: 'ink' }], -0.25, 0.25);
        });
        v.readout(() => {
          const C = calc(), Q = C.Q;
          return `Weights run from ${fx(1 / Math.max(C.pi[0], C.pi[1], 1 - C.pi[0], 1 - C.pi[1]), 2)} to **${fx(C.wmax, 1)}**. Severe share: untreated ${fx(C.balRaw[0], 3)} → **${fx(C.balW[0], 3)}**, treated ${fx(C.balRaw[1], 3)} → **${fx(C.balW[1], 3)}** (whole cohort ${fx(mean(Q.L), 3)}).\n` +
            `Risk under no treatment ${fx(C.ipw[0], 3)}, under treatment ${fx(C.ipw[1], 3)}: weighted difference **${fx(C.ipw[1] - C.ipw[0], 3)}**; crude ${fx(C.crude[1] - C.crude[0], 3)}; hidden truth ${fx(Q.truth1 - Q.truth0, 3)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Theorem', name: 'Standardization and IP weighting agree',
      statement: String.raw`Let $L$ be discrete with positivity, and estimate every quantity nonparametrically, by the observed cell proportions: $\hat P(L=l)=n_l/n$, $\hat E[Y\mid A=a,L=l]=\bar y_{al}$ and $\hat\pi(l)=n_{1l}/n_l$. Then the standardized estimate $\sum_l \hat P(l)\,\bar y_{al}$ and the (normalized) inverse-probability-weighted estimate $\sum_i \mathbf 1\{A_i=a\}W_iY_i\big/\sum_i\mathbf 1\{A_i=a\}W_i$ are **identical** numbers, for every data set. The two estimators are different ways of writing the same g-formula; they can disagree only when at least one of them replaces its nonparametric piece (the outcome means or the propensity) by a parametric model that is wrong for the data.`,
      idea: String.raw`In cell $(a,l)$ the weights are all equal to $n_l/n_{al}$, so the cell contributes $\frac{n_l}{n_{al}}\sum_{\rm cell}Y_i=n_l\,\bar y_{al}$ to the numerator and $n_l$ to the denominator of the weighted mean; the denominator over all strata is $\sum_l n_l=n$. The ratio is $\sum_l (n_l/n)\bar y_{al}$, the standardized mean. With a model for the outcome (standardization) or for the propensity (weighting) this cancellation is lost, and the two methods then rely on *different* parts of the model being right.`,
      caption: String.raw`A simulated cohort of 3,000 with a five-level covariate $L$; treatment depends on $L$ in a U-shape and the effect changes with $L$ (sliders). Left: mean outcome by level and arm with the straight-line outcome model $Y\sim A+L$ dashed. Middle: $P(A=1\mid L)$ in the data with the logistic-linear propensity model dashed. Right: four estimates of the average effect (std = standardization, IPW = inverse probability weighting; a star marks a parametric model). The two nonparametric ones sit on top of each other (readout: their difference is rounding error). The two parametric ones each miss in their own way when the U-shape or the changing effect is turned up; at 0 on both sliders all four agree.`,
      deps: ['causal-2.6', 'causal-2.7'], refs: ['Hernán–Robins §2.4', 'Hernán–Robins §13.4'], tags: ['g-formula', 'model misspecification'],
      credit: 'Robins, 1986 (g-formula); Hájek, 1971 (normalized weights)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/G-formula' },
      viz(v) {
        const q1 = v.slider('treatment depends on $L$ (U-shaped)', 0, 1.5, 0.7, { step: 0.05 });
        const q2 = v.slider('effect changes with $L$ (curved)', 0, 2, 1, { step: 0.05 });
        const get = memo();
        const PL = [0.1, 0.2, 0.4, 0.2, 0.1], n = 3000;
        const calc = () => get([q1.value, q2.value].join('|'), () => {
          const r = rng(2468), L = new Int8Array(n), A = new Uint8Array(n), Y0 = new Float64Array(n), Y1 = new Float64Array(n), Y = new Float64Array(n);
          for (let i = 0; i < n; i++) {
            let u = r(), l = 0; while (l < 4 && u > PL[l]) { u -= PL[l]; l++; } L[i] = l;
            Y0[i] = 20 + 4 * l + 3 * r.normal(); Y1[i] = Y0[i] + 3 + q2.value * 1.6 * (l - 2) ** 2 + 2 * r.normal();
            A[i] = r() < logistic(q1.value * ((l - 2) ** 2 - 2)) ? 1 : 0; Y[i] = A[i] ? Y1[i] : Y0[i];
          }
          const cnt = [0, 1, 2, 3, 4].map(() => [0, 0]), sm = [0, 1, 2, 3, 4].map(() => [0, 0]);
          for (let i = 0; i < n; i++) { cnt[L[i]][A[i]]++; sm[L[i]][A[i]] += Y[i]; }
          const nl = cnt.map((c) => c[0] + c[1]), ybar = (l, a) => sm[l][a] / cnt[l][a], pi = cnt.map((c, l) => c[1] / nl[l]);
          let std = 0; for (let l = 0; l < 5; l++) std += nl[l] / n * (ybar(l, 1) - ybar(l, 0));
          const hajek = (pf) => { const s = [0, 0], sy = [0, 0]; for (let i = 0; i < n; i++) { const p = pf(L[i]), w = A[i] ? 1 / p : 1 / (1 - p); s[A[i]] += w; sy[A[i]] += w * Y[i]; } return sy[1] / s[1] - sy[0] / s[0]; };
          const ipw = hajek((l) => pi[l]);
          const X = []; for (let i = 0; i < n; i++) X.push([1, A[i], L[i]]); const beta = ols(X, Array.from(Y));
          const [b0, b1] = fitLogit(Array.from(L), Array.from(A)); const ipwP = hajek((l) => logistic(b0 + b1 * l));
          let truth = 0; for (let i = 0; i < n; i++) truth += Y1[i] - Y0[i]; truth /= n;
          return { cnt, nl, ybar, pi, std, ipw, stdP: beta[2 - 1], beta, ipwP, b0, b1, truth };
        });
        const sY = v.stage({ x: [-0.4, 4.4], y: [10, 50], axes: 'box', gutter: true, height: 330, xlabel: 'level of $L$', ylabel: 'mean outcome', xticks: [0, 1, 2, 3, 4], title: 'outcome model', weight: 1 });
        const sP = v.stage({ x: [-0.4, 4.4], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'level of $L$', ylabel: '$P(A=1\\mid L)$', xticks: [0, 1, 2, 3, 4], title: 'propensity model', weight: 1 });
        const sE = v.stage({ x: [0.4, 4.6], y: [-2, 14], axes: 'box', gutter: true, height: 330, ylabel: 'average effect', title: 'four estimates', weight: 1.2 });
        v.legend([['accent', 'treated', { dot: true }], ['orange', 'untreated', { dot: true }], ['muted', 'fitted parametric model', { dash: true }], ['ink', 'truth']]);
        v.render(() => {
          const C = calc();
          for (let l = 0; l < 5; l++) for (let a = 0; a < 2; a++) sY.dot(l, C.ybar(l, a), { r: Math.max(3, Math.min(10, Math.sqrt(C.cnt[l][a]) / 2.5)), color: a ? 'accent' : 'orange', alpha: 0.9 });
          for (const a of [0, 1]) sY.line(-0.4, C.beta[0] + C.beta[1] * a + C.beta[2] * -0.4, 4.4, C.beta[0] + C.beta[1] * a + C.beta[2] * 4.4, { color: 'muted', dash: true, width: 1.8 });
          for (let l = 0; l < 5; l++) sP.dot(l, C.pi[l], { r: Math.max(3, Math.min(10, Math.sqrt(C.nl[l]) / 2.5)), color: 'ink' });
          sP.fn((x) => logistic(C.b0 + C.b1 * x), { color: 'muted', dash: true, width: 1.8 });
          const hi = Math.max(14, Math.ceil(C.truth + 3)), lo = Math.min(-2, Math.floor(Math.min(C.stdP, C.ipwP) - 1));
          sE.setView([0.4, 4.6], [lo, hi]);
          const ent = [{ label: 'std', val: C.std, color: 'accent', dec: 2 }, { label: 'IPW', val: C.ipw, color: 'teal', dec: 2 }, { label: 'std*', val: C.stdP, color: 'purple', dec: 2 }, { label: 'IPW*', val: C.ipwP, color: 'orange', dec: 2 }];
          effBars(sE, ent, lo, hi, C.truth);
          sE.text('nonparametric', 1.5, hi - (hi - lo) * 0.05, { size: 12, color: 'muted', align: 'center', weight: 700 }); sE.text('* wrong model', 3.5, hi - (hi - lo) * 0.05, { size: 12, color: 'muted', align: 'center', weight: 700 });
        });
        v.readout(() => {
          const C = calc(), d = Math.abs(C.std - C.ipw);
          return `Truth (hidden table): **${fx(C.truth, 3)}**. Nonparametric: standardization **${fx(C.std, 4)}**, IP weighting **${fx(C.ipw, 4)}**; difference ${d < 1e-9 ? 'below $10^{-9}$ (identical)' : fx(d, 8)}; their gap to the truth is sampling noise.\n` +
            `Parametric: linear outcome model **${fx(C.stdP, 3)}**, logistic propensity model **${fx(C.ipwP, 3)}** (errors ${sg(C.stdP - C.truth, 2)} and ${sg(C.ipwP - C.truth, 2)}). ` + (q1.value + q2.value < 0.05 ? 'Treatment ignores $L$ and the effect is constant: every model is right.' : 'The models are wrong in different ways, so the two methods now disagree.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Method', name: 'Regression adjustment in randomized experiments',
      statement: String.raw`In a completely randomized experiment with a pre-treatment covariate $x$, adjust the difference in means by fitting, in each arm separately, a line of $Y$ on $x$ and comparing the two fitted lines at the overall mean $\bar x$:
$$\hat\tau_{\rm adj}=\big[\bar y_1-b_1(\bar x_1-\bar x)\big]-\big[\bar y_0-b_0(\bar x_0-\bar x)\big],$$
which is the coefficient of $A$ in the regression of $Y$ on $A$, $x-\bar x$ and $A\,(x-\bar x)$. Under fixed covariate dimension, treatment fractions bounded away from zero and one, stable finite-population moments, no dominating unit and a nonsingular limiting covariate covariance, the randomization asymptotics make it consistent for the average effect whether or not the lines are really straight (it is only slightly biased in small samples, with bias of order $1/N$), and its asymptotic variance replaces $S_1^2,S_0^2,S_\tau^2$ by the variances of the *residuals* of $Y^1,Y^0,\tau$ on $x$. Under these conditions it is never asymptotically less precise than the unadjusted difference, and when $x$ explains a share $R^2$ of the outcome variance the standard error shrinks by about $\sqrt{1-R^2}$. The covariate must be fixed before treatment: adjusting for a variable that the treatment itself changes can bias the estimate.`,
      idea: String.raw`Under randomization the arms have the same distribution of $x$, but in any single trial their sample means $\bar x_1,\bar x_0$ differ by chance; and if $x$ predicts $Y$, that chance imbalance leaks into $\bar y_1-\bar y_0$. The regression lines estimate how much outcome to expect for the observed imbalance and subtract it, which removes exactly the part of the noise that $x$ explains. Interacting $x$ with the treatment (separate slopes) lets the adjustment work even if the effect depends on $x$, and gives the model-robust asymptotic adjustment under the stated design regularity (Freedman's critique of the additive version, and Lin's fix, 2013). An unhelpful pre-treatment covariate need not improve precision; finite-sample unbiasedness is not claimed. A post-treatment control can remove part of the effect or introduce other bias.

For a finite population, center the outcome and covariate vectors and use their normalized Euclidean inner product. Orthogonal projection onto the covariate span has a perpendicular residual by LADR 6.57; Pythagoras splits outcome variation into fitted and residual parts. This explains the residual-variance component of the adjustment argument. It does not prove finite-sample unbiasedness or the asymptotic randomization theorem, and it does not justify controlling a treatment-affected variable.`,
      caption: String.raw`A fixed population of 60 units, 30 treated per trial. Left: one trial, the two fitted lines, and their gap at $\bar x$ (gold), which is $\hat\tau_{\rm adj}$, against the unadjusted gap between the arm means. Right: 3,000 re-randomizations of both estimators. Slide the **correlation** between $x$ and the outcome and the adjusted histogram narrows like $\sqrt{1-\rho^2}$ while both stay centred on the truth. Choose **the additive version** to see Freedman's variant, or measure the covariate **after treatment** (it moves with treatment) and the adjusted estimate shifts off the truth.`,
      deps: ['causal-2.2', 'stat-12.3', 'ladr-6.57'], refs: ['Hernán–Robins §15.1'], tags: ['covariate adjustment', 'ANCOVA'],
      credit: 'Fisher, 1932–1935 (analysis of covariance); Freedman, 2008; Lin, 2013',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Analysis_of_covariance' },
      viz(v) {
        const rho = v.slider('correlation of $x$ with the outcome', 0, 0.97, 0.8, { step: 0.01 });
        const hx = v.slider('effect depends on $x$ (slope of $\\tau$)', -5, 5, 3, { step: 0.5 });
        const est = v.select('adjusted estimator', [{ value: 'lin', label: 'with interaction' }, { value: 'add', label: 'additive (common slope)' }], 'lin');
        const when = v.select('covariate measured', [{ value: 'pre', label: 'before treatment' }, { value: 'post', label: 'after treatment' }], 'pre');
        let seed = 1; v.button('new trial', () => { seed++; });
        const N = 60, m = 30;
        const B = (() => { const r = rng(3131); const x = [], e = []; for (let i = 0; i < N; i++) { x.push(r.normal()); e.push(r.normal()); } const sx = (a) => { const mu = mean(a), s = sd(a); return a.map((q) => (q - mu) / s); }; const X = sx(x); const E0 = sx(e); // make e orthogonal to x
          const c = mean(X.map((q, i) => q * E0[i])); const E = sx(E0.map((q, i) => q - c * X[i])); return { X, E }; })();
        const get = memo();
        const calc = () => get([rho.value, hx.value, est.value, when.value].join('|'), () => {
          const x = B.X, y0 = new Float64Array(N), y1 = new Float64Array(N), t = new Float64Array(N);
          for (let i = 0; i < N; i++) { y0[i] = 50 + 8 * (rho.value * x[i] + Math.sqrt(1 - rho.value ** 2) * B.E[i]); t[i] = 5 + hx.value * x[i]; y1[i] = y0[i] + t[i]; }
          const w1 = when.value === 'post' ? x.map((q) => q + 1.2) : x, w0 = x; // post-treatment covariate: shifted by treatment
          const ate = mean(t);
          const run = (A) => {
            let n1 = 0, n0 = 0, sx1 = 0, sx0 = 0, sy1 = 0, sy0 = 0, wsum = 0;
            for (let i = 0; i < N; i++) { const w = A[i] ? w1[i] : w0[i]; wsum += w; if (A[i]) { n1++; sx1 += w; sy1 += y1[i]; } else { n0++; sx0 += w; sy0 += y0[i]; } }
            const mx = wsum / N, xb1 = sx1 / n1, xb0 = sx0 / n0, yb1 = sy1 / n1, yb0 = sy0 / n0;
            let sxx1 = 0, sxy1 = 0, sxx0 = 0, sxy0 = 0;
            for (let i = 0; i < N; i++) { const w = A[i] ? w1[i] : w0[i]; if (A[i]) { sxx1 += (w - xb1) ** 2; sxy1 += (w - xb1) * (y1[i] - yb1); } else { sxx0 += (w - xb0) ** 2; sxy0 += (w - xb0) * (y0[i] - yb0); } }
            const b1 = sxy1 / sxx1, b0 = sxy0 / sxx0, bc = (sxy1 + sxy0) / (sxx1 + sxx0);
            const adj = est.value === 'lin' ? (yb1 - b1 * (xb1 - mx)) - (yb0 - b0 * (xb0 - mx)) : yb1 - yb0 - bc * (xb1 - xb0);
            return { un: yb1 - yb0, adj, b1, b0, yb1, yb0, xb1, xb0, mx };
          };
          const r = rng(777), A = new Uint8Array(N), idx = new Int32Array(N), U = [], D = [];
          for (let k = 0; k < 3000; k++) { randAssign(r, N, m, A, idx); const e = run(A); U.push(e.un); D.push(e.adj); }
          const res = (a) => { const X = x.map((q) => [1, q]); const b = ols(X, Array.from(a)); return a.map((q, i) => q - b[0] - b[1] * x[i]); };
          const r1 = res(y1), r0 = res(y0), rt = res(t);
          const Vp = svar(r1) / m + svar(r0) / (N - m) - svar(rt) / N, Vu = exactVar({ S1: svar(y1), S0: svar(y0), St: svar(t), n: N }, m);
          return { ate, U, D, run, y0, y1, w1, w0, x, sdU: sd(U), sdD: sd(D), predRatio: Math.sqrt(Vp / Vu) };
        });
        const sS = v.stage({ x: [-3, 3], y: [10, 95], axes: 'box', gutter: true, height: 340, xlabel: 'covariate $x$', ylabel: 'observed outcome', title: 'one trial' });
        const sH = v.stage({ x: [-4, 14], y: [0, 0.1], axes: 'box', gutter: true, height: 340, xlabel: 'estimate of the average effect', ylabel: 'share', title: '3,000 re-randomizations' });
        v.legend([['accent', 'treated', { dot: true }], ['orange', 'untreated', { dot: true }], ['purple', 'unadjusted'], ['green', 'adjusted'], ['ink', 'true average effect']]);
        v.render(() => {
          const C = calc(), r = rng(seed * 53 + 9), A = new Uint8Array(N), idx = new Int32Array(N); randAssign(r, N, m, A, idx);
          const e = C.run(A);
          for (let i = 0; i < N; i++) sS.dot(A[i] ? C.w1[i] : C.w0[i], A[i] ? C.y1[i] : C.y0[i], { r: 4.2, color: A[i] ? 'accent' : 'orange', alpha: 0.85 });
          const lineAt = (xb, yb, b) => (x) => yb + b * (x - xb);
          const bc1 = est.value === 'lin' ? e.b1 : (e.b1 + e.b0) / 2, bc0 = est.value === 'lin' ? e.b0 : (e.b1 + e.b0) / 2;
          sS.fn(lineAt(e.xb1, e.yb1, bc1), { color: 'accent', width: 2 }); sS.fn(lineAt(e.xb0, e.yb0, bc0), { color: 'orange', width: 2 });
          sS.dot(e.xb1, e.yb1, { r: 6, color: 'accent', hollow: true, width: 2 }); sS.dot(e.xb0, e.yb0, { r: 6, color: 'orange', hollow: true, width: 2 });
          const f1 = lineAt(e.xb1, e.yb1, bc1), f0 = lineAt(e.xb0, e.yb0, bc0);
          sS.vline(e.mx, { color: 'faint', dash: true }); sS.segment([e.mx, f0(e.mx)], [e.mx, f1(e.mx)], { color: 'gold', width: 5 });
          lab(sS, 'unadjusted gap ' + fx(e.un, 2) + ',  adjusted gap (gold) ' + fx(e.adj, 2), -2.9, 90, { align: 'left', color: 'ink' });
          const all = [...C.U, ...C.D], lo = Math.floor(Math.min(C.ate, ...all) - 1), hi = Math.ceil(Math.max(C.ate, ...all) + 1);
          histPanel(sH, [{ vals: C.U, color: 'purple' }, { vals: C.D, color: 'green' }], lo, hi, 44); sH.vline(C.ate, { color: 'ink', width: 2.2 });
        });
        v.readout(() => {
          const C = calc(), mu = mean(C.U), md = mean(C.D);
          return `True effect $${fx(C.ate, 3)}$. Unadjusted: mean $${fx(mu, 3)}$, SD **${fx(C.sdU, 3)}**; adjusted: mean $${fx(md, 3)}$ (bias ${sg(md - C.ate, 3)}), SD **${fx(C.sdD, 3)}**. SD ratio adjusted/unadjusted: **${fx(C.sdD / C.sdU, 2)}**` +
            (when.value === 'pre' ? `, the large-sample formula (residual variances) predicts ${fx(C.predRatio, 2)}, and $\\sqrt{1-\\rho^2}=${fx(Math.sqrt(1 - rho.value ** 2), 2)}$ in the constant-effect case.` : '.') +
            (when.value === 'post' ? '\nThe covariate is measured after treatment and the treatment shifts it, so adjusting for it removes part of the effect: biased.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Concept', name: 'Noncompliance: intention-to-treat and per-protocol',
      statement: String.raw`In a randomized trial let $Z$ be the assignment and $A$ the treatment actually received. When some assigned people do not take the treatment (or controls obtain it), the **intention-to-treat (ITT)** contrast compares the groups as randomized, $E[Y\mid Z=1]-E[Y\mid Z=0]$. Because $Z$ is randomized it is unbiased for the average effect of *assignment*, but it mixes the effect of the treatment with the share who took it: with one-sided noncompliance and an effect that acts only through the treatment, it equals (proportion adhering) $\times$ (effect among those who would adhere), so it is diluted towards 0. The **per-protocol** contrast restricts to people who followed the protocol (here $Z=1,A=1$ against $Z=0$); it is no longer protected by randomization, because who adheres is not random, and it is biased whenever adherence is related to the prognosis.`,
      idea: String.raw`Randomization of $Z$ makes the arms of $Z$ exchangeable, which is why ITT estimates something causal: the effect of a *policy* of assigning treatment. The cost is that the policy is only partly followed. Per-protocol analysis tries to recover the effect of the treatment itself by throwing away non-adherers, but the adherers are a self-selected subgroup of the treated arm, to be compared with an *unselected* control group, so the exchangeability created by randomization is destroyed. Fixing this takes extra assumptions (adjusting for the predictors of adherence, chapter 6 on instrumental variables).`,
      caption: String.raw`A trial of 800 people with a hidden health variable $U$. Left: the flow of the trial, with the mean outcome in each box. Right: the two estimates over 300 repeated trials (the same people, re-randomized): ITT stays centred on its target (the effect times the adherence share, dashed), while per-protocol is centred on a different number whenever adherence depends on health (slide **who adheres**). Set that slider to 0 and per-protocol is unbiased for the treatment effect, but ITT is still diluted until adherence reaches 100%.`,
      deps: ['causal-2.2'], refs: ['Hernán–Robins §9.4', 'Hernán–Robins §9.5'], tags: ['intention to treat', 'adherence'],
      credit: 'Intention-to-treat as a principle: Hill, 1961; Lee et al., 1991',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Intention-to-treat_analysis' },
      viz(v) {
        const tau = v.slider('effect of the treatment $\\tau$ (health points)', 0, 15, 8, { step: 0.5 });
        const adh = v.slider('share who would adhere if assigned', 0.3, 1, 0.6, { step: 0.05 });
        const kk = v.slider('who adheres: healthier (+) or sicker (−)', -2, 2, 1.5, { step: 0.1 });
        let seed = 1; v.button('another trial', () => { seed++; });
        const N = 800, m = 400;
        const base = (() => { const r = rng(9090), U = [], e = [], u2 = []; for (let i = 0; i < N; i++) { U.push(r.normal()); e.push(r.normal()); u2.push(r()); } return { U, e, u2 }; })();
        const get = memo();
        const popFor = () => get([tau.value, adh.value, kk.value].join('|'), () => {
          let lo = -12, hi = 12; for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; let s = 0; for (let i = 0; i < N; i++) s += logistic(mid + kk.value * base.U[i]); if (s / N < adh.value) lo = mid; else hi = mid; }
          const a = (lo + hi) / 2, D = new Uint8Array(N), y0 = new Float64Array(N), y1 = new Float64Array(N); let sd1 = 0;
          for (let i = 0; i < N; i++) { D[i] = base.u2[i] < logistic(a + kk.value * base.U[i]) ? 1 : 0; y0[i] = 50 + 8 * base.U[i] + 4 * base.e[i]; y1[i] = y0[i] + tau.value; sd1 += D[i]; }
          const run = (Z) => {
            let n1 = 0, n0 = 0, s1 = 0, s0 = 0, np = 0, sp = 0, nt = 0, ntS = 0, sn = 0, nn = 0;
            for (let i = 0; i < N; i++) { const A = Z[i] * D[i], y = A ? y1[i] : y0[i]; if (Z[i]) { n1++; s1 += y; if (A) { np++; sp += y; } else { nn++; sn += y; } } else { n0++; s0 += y; } }
            return { itt: s1 / n1 - s0 / n0, pp: sp / np - s0 / n0, m1: s1 / n1, m0: s0 / n0, mTook: sp / np, mNot: sn / nn, n1, n0, np, nn };
          };
          const r = rng(31337), Z = new Uint8Array(N), idx = new Int32Array(N), I = [], P = [];
          for (let k = 0; k < 300; k++) { randAssign(r, N, m, Z, idx); const e = run(Z); I.push(e.itt); P.push(e.pp); }
          return { D, run, I, P, rate: sd1 / N };
        });
        const sF = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 340, title: 'the trial', weight: 1.1 });
        const sE = v.stage({ x: [-2, 16], y: [0.3, 2.9], axes: 'box', gutter: true, height: 340, xlabel: 'estimate (health points)', yticks: [[1, 'PP'], [2, 'ITT']], title: '300 repeated trials', weight: 1.1 });
        v.legend([['accent', 'ITT'], ['purple', 'PP = per-protocol'], ['green', 'treatment effect $\\tau$'], ['accent', 'target of ITT: $\\tau\\times$adherence', { dash: true }], ['gold', 'this trial', { dot: true }]]);
        v.render(() => {
          const C = popFor(), r = rng(seed * 17 + 3), Z = new Uint8Array(N), idx = new Int32Array(N); randAssign(r, N, m, Z, idx);
          const e = C.run(Z), box = (x0, y0, x1, y1, col, t1, t2) => { sF.rect(x0, y0, x1, y1, { fill: col, fillAlpha: 0.22, color: col, width: 1.5, radius: 6 }); sF.text(t1, (x0 + x1) / 2, (y0 + y1) / 2 + 0.22, { size: 12.5, align: 'center', weight: 700 }); sF.text(t2, (x0 + x1) / 2, (y0 + y1) / 2 - 0.28, { size: 12, align: 'center', color: 'ink' }); };
          sF.text('randomized', 5, 5.7, { size: 12.5, color: 'muted', align: 'center' });
          sF.text('assigned treatment  (n = ' + e.n1 + ')', 2.6, 4.85, { size: 12.5, align: 'center', weight: 700, color: 'accent' }); sF.text('assigned control  (n = ' + e.n0 + ')', 7.6, 4.85, { size: 12.5, align: 'center', weight: 700, color: 'orange' });
          box(0.2, 2.2, 2.55, 4.3, 'green', 'took it: ' + e.np, 'mean ' + e.mTook.toFixed(1)); box(2.75, 2.2, 5.1, 4.3, 'muted', 'did not: ' + e.nn, 'mean ' + e.mNot.toFixed(1));
          box(5.5, 2.2, 9.8, 4.3, 'orange', 'all untreated: ' + e.n0, 'mean ' + e.m0.toFixed(1));
          sF.text('ITT: ' + e.m1.toFixed(1) + ' (all assigned) − ' + e.m0.toFixed(1) + ' = ' + (e.itt >= 0 ? '' : '−') + Math.abs(e.itt).toFixed(1), 5, 1.35, { size: 13, align: 'center', weight: 700, color: 'accent' });
          sF.text('per-protocol: ' + e.mTook.toFixed(1) + ' (took it) − ' + e.m0.toFixed(1) + ' = ' + (e.pp >= 0 ? '' : '−') + Math.abs(e.pp).toFixed(1), 5, 0.7, { size: 13, align: 'center', weight: 700, color: 'purple' });
          sE.setView([Math.min(-2, Math.floor(Math.min(...C.P, ...C.I) - 1)), Math.max(16, Math.ceil(Math.max(...C.P, ...C.I) + 1))], [0.3, 2.9]);
          const rj = rng(5); for (let k = 0; k < 300; k++) { sE.dot(C.P[k], 1 + (rj() - 0.5) * 0.5, { r: 2.4, color: 'purple', alpha: 0.28 }); sE.dot(C.I[k], 2 + (rj() - 0.5) * 0.5, { r: 2.4, color: 'accent', alpha: 0.28 }); }
          sE.vline(tau.value, { color: 'green', width: 2.2 }); sE.vline(tau.value * C.rate, { color: 'accent', width: 2, dash: true });
          sE.dot(e.pp, 1, { r: 6, color: 'gold' }); sE.dot(e.itt, 2, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const C = popFor(), mi = mean(C.I), mp = mean(C.P);
          return `Adherence in this population: **${pct(C.rate, 0)}**. Over 300 trials: ITT averages **${fx(mi, 2)}** (target $\\tau\\times$ adherence $=${fx(tau.value * C.rate, 2)}$), per-protocol averages **${fx(mp, 2)}** against the true effect $\\tau=${fx(tau.value, 1)}$ (bias ${sg(mp - tau.value, 2)}).\n` +
            (Math.abs(kk.value) < 0.05 ? 'Adherence is unrelated to health: per-protocol is unbiased for $\\tau$, ITT still understates it.' : kk.value > 0 ? 'Healthier people adhere, so the per-protocol group looks healthier than the controls whatever the treatment does: its estimate is too high.' : 'Sicker people adhere, so the per-protocol group looks sicker than the controls: its estimate is too low.') +
            (adh.value > 0.98 ? ' With full adherence the two contrasts coincide.' : ` Dividing ITT by the adherence share recovers $\\tau$ here (${fx(mi / C.rate, 2)}): that ratio is an instrumental-variable estimator (chapter 6).`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Paper', name: 'Probability theory applied to agricultural experiments',
      paper: { authors: 'Jerzy Splawa-Neyman', year: 1923, title: 'On the Application of Probability Theory to Agricultural Experiments. Essay on Principles', venue: 'Roczniki Nauk Rolniczych 10: 1–51 (in Polish); Section 9 translated by D. M. Dabrowska and T. P. Speed in Statistical Science 5 (4): 465–472 (1990)', url: 'https://doi.org/10.1214/ss/1177012031' },
      introduces: ['causal-1.1', 'causal-2.2', 'causal-2.3'],
      statement: String.raw`Neyman's essay models a field trial as a drawing from an urn. There are $m$ plots, and each plot has, before anything is done, a fixed yield for each of the varieties being compared (potential outcomes, in modern language); the experimenter assigns varieties to plots by random drawing, and observes one yield per plot. He shows that the difference of the mean observed yields of two varieties is an unbiased estimate of the difference of the mean potential yields, derives the variance of this estimate over the random assignment, and shows that the natural estimate of that variance from the observed yields is too large on average by an amount that vanishes when the varieties' effects on the plots are all equal, so that confidence statements based on it are safe, never too optimistic. (This page checks those statements by exact enumeration on a population of plots with invented yields; it does not use the paper's data.)`,
      idea: String.raw`Before 1923 the variability in field experiments was usually described by a model for the plots' yields (a distribution of errors). Neyman instead treated the *plots* as fixed and the *assignment* as the only random element, which is the first use of potential outcomes $Y^a$ and gives the sampling frame that randomized experiments, and later causal inference, still use. The conservative variance comes from the unidentifiable covariance between the two potential yields of the same plot (items 2.2, 2.3); the essay was published in Polish in an agricultural journal and became widely known in English only through later work, including Rubin's of the 1970s (item 1.12) and the 1990 translation of its ninth section.`,
      caption: String.raw`Eight plots, each with a yield under variety 1 (blue handle) and variety 0 (orange handle): **drag the handles**, they are the unknown table of potential yields (invented numbers, not the paper's). Four plots get variety 1 in every one of the $\binom84=70$ possible assignments, listed exhaustively. Top right: the 70 estimates are balanced around the true mean difference (black). Bottom right: the exact variance (black), the average of Neyman's estimate $\hat V$ (gold) and the bare sum $S_1^2/4+S_0^2/4$. The gold bar exceeds the black one by exactly $S_\tau^2/8$; press **same effect on every plot** and they coincide.`,
      deps: ['stat-1.3'], refs: [], tags: ['history', 'finite population', 'potential outcomes'],
      credit: 'Neyman, 1923',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jerzy_Neyman' },
      viz(v) {
        const N = 8, m = 4;
        const r0 = rng(23), init1 = [], init0 = [];
        for (let i = 0; i < N; i++) { const a = 50 + 8 * r0.normal(); init0.push(clamp(a, 32, 68)); init1.push(clamp(a + 4 + 7 * r0.normal(), 28, 72)); }
        const s1 = v.stage({ x: [0, N + 1], y: [20, 80], axes: 'box', gutter: true, height: 340, xlabel: 'plot', ylabel: 'yield', xticks: [1, 2, 3, 4, 5, 6, 7, 8], title: 'potential yields of the 8 plots (drag)', weight: 1.1 });
        const h1 = [], h0 = [];
        for (let i = 0; i < N; i++) { h1.push(s1.handle(i + 1, init1[i], { color: 'accent', r: 7, constrain: 'y' })); h0.push(s1.handle(i + 1, init0[i], { color: 'orange', r: 7, constrain: 'y' })); }
        v.button('same effect on every plot', () => { let d = 0; for (let i = 0; i < N; i++) d += h1[i].y - h0[i].y; d /= N; for (let i = 0; i < N; i++) h1[i].set(i + 1, clamp(h0[i].y + d, 20, 80)); });
        v.button('new invented yields', () => { const r = rng(Math.floor(Math.random() * 1e6)); for (let i = 0; i < N; i++) { const a = clamp(50 + 8 * r.normal(), 32, 68); h0[i].set(i + 1, a); h1[i].set(i + 1, clamp(a + 4 + 7 * r.normal(), 28, 72)); } });
        const sH = v.stage({ x: [-10, 20], y: [0, 0.1], axes: 'box', gutter: true, height: 340, xlabel: 'difference in mean yields', ylabel: 'share of the 70 assignments', title: 'every assignment', weight: 1 });
        const sV = v.stage({ x: [0.4, 3.6], y: [0, 30], axes: 'box', gutter: true, height: 340, ylabel: 'variance', title: 'variance of the estimate', weight: 0.9 });
        v.legend([['accent', 'variety 1', { dot: true }], ['orange', 'variety 0', { dot: true }], ['ink', 'true mean difference'], ['gold', 'mean of the 70 estimates', { dash: true }]]);
        let C = null;
        const compute = () => {
          const y1 = h1.map((h) => h.y), y0 = h0.map((h) => h.y), t = y1.map((q, i) => q - y0[i]), est = [], vh = [], y = new Float64Array(N);
          forEachAssign(N, m, (A) => { for (let i = 0; i < N; i++) y[i] = A[i] ? y1[i] : y0[i]; const a = armStats(y, A); est.push(a.m1 - a.m0); vh.push(a.v1 / m + a.v0 / (N - m)); });
          const S1 = svar(y1), S0 = svar(y0), St = svar(t);
          return { y1, y0, ate: mean(t), est, S1, S0, St, EV: mean(vh), Vemp: svar(est) * (est.length - 1) / est.length, Vex: S1 / m + S0 / (N - m) - St / N, bare: S1 / m + S0 / (N - m), mu: mean(est) };
        };
        v.render(() => {
          C = compute();
          for (let i = 0; i < N; i++) s1.line(i + 1, C.y0[i], i + 1, C.y1[i], { color: C.y1[i] >= C.y0[i] ? 'green' : 'red', width: 2, alpha: 0.6 });
          const lo = Math.floor(Math.min(C.ate, ...C.est) - 2), hi = Math.ceil(Math.max(C.ate, ...C.est) + 2);
          histPanel(sH, [{ vals: C.est, color: 'accent' }], lo, hi, 34); sH.vline(C.ate, { color: 'ink', width: 2.4 }); sH.vline(C.mu, { color: 'gold', width: 1.6, dash: true });
          const top = Math.max(C.bare, C.EV, C.Vex) * 1.25 + 1e-9;
          sV.setView([0.4, 3.6], [0, top]); sV.setTicks([[1, 'exact Var'], [2, 'mean V̂'], [3, 'no corr.']], undefined);
          [[C.Vex, 'ink'], [C.EV, 'gold'], [C.bare, 'muted']].forEach(([q, col], i) => { sV.rect(i + 0.62, 0, i + 1.38, q, { fill: col, fillAlpha: 0.35, color: col, width: 1.6 }); sV.text(q.toFixed(2), i + 1, q + top * 0.04, { size: 12.5, align: 'center', weight: 700 }); });
        });
        v.readout(() => {
          const d = Math.abs(C.mu - C.ate);
          return `Over all 70 assignments: mean estimate $${fx(C.mu, 4)}$ = true mean difference $${fx(C.ate, 4)}$ (gap ${d < 1e-9 ? 'below $10^{-9}$' : fx(d, 8)}). Exact variance $${fx(C.Vex, 3)}$ = $S_1^2/4+S_0^2/4-S_\\tau^2/8$ (enumerated: ${fx(C.Vemp, 3)}).\n` +
            `Neyman's $\\hat V$ averages **${fx(C.EV, 3)}** = exact variance + $S_\\tau^2/8$ = ${fx(C.Vex + C.St / N, 3)}; excess ${fx(C.EV - C.Vex, 3)} ` + (C.St < 1e-6 ? '(effects equal: the estimate is exact).' : '(effects differ between plots: the estimate is conservative).');
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Paper', name: 'The design of experiments',
      paper: { authors: 'R. A. Fisher', year: 1935, title: 'The Design of Experiments', venue: 'Edinburgh: Oliver and Boyd', url: 'https://archive.org/details/in.ernet.dli.2015.199572' },
      introduces: ['causal-2.4', 'causal-2.1', 'stat-13.8'],
      statement: String.raw`Fisher's book argues that an experiment must be designed so that its own physical randomization provides the basis for the test of significance. Its second chapter works out an example: a lady claims to tell whether milk or tea was poured first into a cup. Eight cups are prepared, four of each kind, and presented in random order, the lady being told that there are four of each. If she has no ability, every choice of four cups as "milk first" is equally likely, there are $\binom84=70$ of them, so naming all four correctly has probability $1/70$ and three or more has probability $17/70$. The following chapter applies the same reasoning to Darwin's pairs of cross- and self-fertilized maize plants: the null hypothesis that the difference in each pair is as likely to be of one sign as the other gives $2^{15}$ equally likely sign patterns, of which the observed total is exceeded by a small fraction (below).`,
      idea: String.raw`Before this book significance tests rested on assumed distributions of errors (normal theory). Fisher showed that when the experimenter *randomizes*, the distribution of any test statistic under the null hypothesis can be computed exactly from the randomization itself, by listing the equally likely arrangements, with no assumption about the data; the $t$-test is then justified as an approximation to this exact distribution. The book also states the principles of replication, randomization and local control (blocking) that later became design of experiments, and the "null hypothesis" as a term, along with the idea of the level of significance.`,
      caption: String.raw`**Tea.** Click cups to say which you think the lady would call "milk first" (exactly half the cups; the tray is secret until you **reveal** it). The right panel lists how many of the equally likely selections give $0,1,2,\dots$ correct; the bars for outcomes at least as good as the current guess are red (the guess itself darker), with the $p$-value in the readout. **Darwin.** The 15 paired differences (eighths of an inch, cross- minus self-fertilized); click a bar to flip its sign. The histogram is the exact distribution of the total over all $2^{15}=32{,}768$ sign patterns; the red part is at least as large as the observed 314.`,
      deps: ['stat-7.1', 'comb-1.6'], refs: [], tags: ['history', 'randomization test', 'design of experiments'],
      credit: 'Fisher, 1935',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lady_tasting_tea' },
      viz(v) {
        const mode = v.select('experiment', [{ value: 'tea', label: 'the lady tasting tea' }, { value: 'dar', label: 'Darwin’s maize pairs' }], 'tea');
        const cups = v.select('cups', [{ value: '6', label: '6' }, { value: '8', label: '8' }, { value: '10', label: '10' }, { value: '12', label: '12' }], '8');
        const reveal = v.toggle('reveal the tray', false);
        let seed = 1, guess = new Set(), key = '', truth = [], tgt = 3;
        const DAR = [49, -67, 8, 16, 6, 23, 28, 41, 14, 29, 56, 24, 75, 60, -48];
        const flips = new Array(15).fill(false);
        const ensure = () => {
          const k = cups.value + '|' + seed; if (k === key) return; key = k;
          const c = +cups.value, m = c / 2, r = rng(seed * 4099 + c); const idx = Array.from({ length: c }, (_, i) => i); for (let i = c - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
          truth = idx.slice(0, m).sort((a, b) => a - b); guess = new Set(truth); const drop = truth[0], add = [...Array(c).keys()].find((q) => !guess.has(q)); guess.delete(drop); guess.add(add);
        };
        v.button('new tray', () => { seed++; mode.value = 'tea'; });
        v.button('she guesses at random', () => { ensure(); const c = +cups.value, r = rng(Math.floor(Math.random() * 1e9)); const idx = Array.from({ length: c }, (_, i) => i); for (let i = c - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } guess = new Set(idx.slice(0, c / 2)); });
        v.button('she is right about all', () => { ensure(); guess = new Set(truth); });
        v.button('flip all signs back', () => { flips.fill(false); });
        const sL = v.stage({ x: [0, 13], y: [0, 4], axes: false, height: 340, title: 'the experiment', weight: 1.05 });
        const sR = v.stage({ x: [0, 7], y: [0, 0.4], axes: 'box', gutter: true, height: 340, xlabel: 'number correct', ylabel: 'share of equally likely selections', title: 'what chance alone gives', weight: 1 });
        // Darwin sign-flip distribution (exact, by dynamic programming over the 15 absolute differences)
        const absd = DAR.map(Math.abs), tot = absd.reduce((a, b) => a + b, 0), OFF = tot; // sums of ±d lie in [−tot, tot]
        let dist = new Float64Array(2 * tot + 1); dist[OFF] = 1;
        for (const d of absd) { const nd = new Float64Array(2 * tot + 1); for (let s = 0; s < dist.length; s++) { if (!dist[s]) continue; nd[s + d] += dist[s]; nd[s - d] += dist[s]; } dist = nd; }
        const obsSum = DAR.reduce((a, b) => a + b, 0);
        let nGE = 0; for (let s = obsSum; s <= tot; s++) nGE += dist[s + OFF];
        const darTotal = 2 ** 15;
        sL.onClick((x, y) => {
          if (mode.value === 'tea') { ensure(); const c = +cups.value, per = Math.ceil(c / 2), col = Math.floor(x / (13 / per)), row = y > 2 ? 0 : 1; const i = row * per + col; if (i >= 0 && i < c && x >= 0 && x <= 13) { if (guess.has(i)) guess.delete(i); else guess.add(i); } }
          else { const i = Math.round(x) - 1; if (i >= 0 && i < 15) flips[i] = !flips[i]; }
        });
        v.legend([['accent', 'less extreme than the guess / observed total'], ['red', 'at least as extreme']]);
        v.render(() => {
          const tea = mode.value === 'tea';
          cups.el.hidden = !tea; reveal.el.hidden = !tea;
          if (tea) {
            ensure(); const c = +cups.value, m = c / 2, per = Math.ceil(c / 2), TS = new Set(truth);
            sL.setView([0, 13], [0, 4]);
            for (let i = 0; i < c; i++) {
              const row = Math.floor(i / per), col = i % per, cx = (col + 0.5) * (13 / per), cy = row === 0 ? 3 : 1, g = guess.has(i);
              sL.dot(cx, cy, { r: 24, color: g ? 'accent' : 'faint', hollow: !g, width: 2.5 });
              sL.text(String(i + 1), cx, cy, { size: 15, color: g ? 'panel' : 'ink', align: 'center', baseline: 'middle', weight: 700 });
              if (reveal.value) sL.text(TS.has(i) ? 'milk first' : 'tea first', cx, cy - 0.62, { size: 11.5, color: TS.has(i) ? 'green' : 'red', align: 'center', weight: 700 });
            }
            sL.text('click the cups she would call "milk first" (' + guess.size + ' of ' + m + ' chosen)', 6.5, 3.75, { size: 12.5, color: 'muted', align: 'center' });
            let k = 0; for (const q of guess) if (TS.has(q)) k++;
            const W = []; for (let j = 0; j <= m; j++) W.push(choose(m, j) * choose(m, m - j)); const T = choose(c, m);
            sR.setView([-0.6, m + 0.6], [0, Math.max(...W) / T * 1.25]); sR.setLabels('number correct among the ' + m + ' called "milk first"', undefined);
            sR.setTicks(Array.from({ length: m + 1 }, (_, j) => [j, String(j)]), undefined);
            W.forEach((w, j) => { const col = guess.size === m && j >= k ? 'red' : 'accent'; sR.rect(j - 0.38, 0, j + 0.38, w / T, { fill: col, fillAlpha: j === k && guess.size === m ? 0.6 : 0.3, color: col, width: 1.5 }); sR.text(String(w), j, w / T + Math.max(...W) / T * 0.06, { size: 12.5, align: 'center', weight: 700 }); });
          } else {
            sL.setView([0, 16], [-100, 100]);
            for (let i = 0; i < 15; i++) { const d = DAR[i] * (flips[i] ? -1 : 1); sL.rect(i + 0.65, 0, i + 1.35, d, { fill: flips[i] ? 'orange' : 'accent', fillAlpha: 0.4, color: flips[i] ? 'orange' : 'accent', width: 1.6 }); }
            sL.hline(0, { color: 'ink', width: 1.4 }); sL.text('difference in pair (eighths of an inch): click a bar to flip its sign', 8, 92, { size: 12.5, color: 'muted', align: 'center' });
            const cur = DAR.reduce((a, d, i) => a + (flips[i] ? -d : d), 0); sL.text('total = ' + cur, 8, -92, { size: 14, align: 'center', weight: 700 });
            const bw = 16, lo = -tot, hi = tot, nb = Math.ceil((hi - lo) / bw), cnt = new Float64Array(nb);
            for (let s = lo; s <= hi; s++) cnt[Math.min(nb - 1, Math.floor((s - lo) / bw))] += dist[s + OFF];
            sR.setView([-300, 600], [0, Math.max(...cnt) / darTotal * 1.2]); sR.setLabels('total of the 15 signed differences', undefined); sR.setTicks(null, null);
            for (let b = 0; b < nb; b++) { const x0 = lo + b * bw, x1 = x0 + bw, h = cnt[b] / darTotal; if (h <= 0) continue; const ext = x0 >= obsSum; sR.rect(x0, 0, x1, h, { fill: ext ? 'red' : 'accent', fillAlpha: ext ? 0.55 : 0.28, stroke: false }); }
            sR.vline(obsSum, { color: 'ink', width: 2.4 }); sR.vline(cur, { color: 'gold', width: 2.4, dash: true });
          }
        });
        v.readout(() => {
          if (mode.value === 'tea') {
            ensure(); const c = +cups.value, m = c / 2, TS = new Set(truth), T = choose(c, m); let k = 0; for (const q of guess) if (TS.has(q)) k++;
            if (guess.size !== m) return `Choose exactly ${m} cups (${guess.size} so far). If the lady had no ability, each of the $\\binom{${c}}{${m}}=${T}$ possible selections would be equally likely.`;
            let tailN = 0; for (let j = k; j <= m; j++) tailN += choose(m, j) * choose(m, m - j);
            return `The selection gets **${k}** of ${m} right. Selections with at least this many right: **${tailN}** of ${T}, so $p=${tailN}/${T}=$ **${fx(tailN / T, 4)}**.` + (k === m ? ` Naming all ${m} correctly has probability $1/${T}$.` : '') + (tailN / T < 0.05 ? ' Below 5%: this would reject "no ability".' : ' Not below 5%: chance alone does this often.');
          }
          const n = DAR.length, mu = obsSum / n, sdv = sd(DAR), tstat = mu / (sdv / Math.sqrt(n));
          return `Observed total **${obsSum}** (mean ${fx(mu, 2)} eighths = ${fx(mu / 8, 2)} inches). Of the 32,768 sign patterns, **${commas(nGE)}** have total at least ${obsSum}: one-sided $p=${fx(nGE / darTotal, 4)}$, two-sided $p=${fx(2 * nGE / darTotal, 4)}$. For comparison the paired $t$ statistic is ${fx(tstat, 3)} on 14 degrees of freedom (normal theory).`;
        });
      },
    },
  ],
};
