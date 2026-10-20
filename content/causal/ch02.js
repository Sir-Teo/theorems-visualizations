// Causal Inference — Chapter 2: Randomized experiments (items 2.1–2.6; 2.7–2.12 in ch02-b.js)
//
// Sources and honesty notes (Oct 2026):
// - Every population and every number here is simulated from a fixed seed; the "truth" (both potential outcomes of every unit) is known
//   to the simulation and never to the estimators. Randomness is reproducible (mulberry32 seeded from the control settings).
// - Hernán & Robins section numbers in `refs` follow the syllabus, which was checked against the draft's table of contents.
// - The variance formula of 2.3 (finite-population variance of the difference in means, and the sign of its correction) was re-derived
//   here and is verified numerically by exact enumeration in items 2.3 and 2.11, not taken from a reference.
import {
  clamp, logistic, pct, sg, fx, mean, hashStr, memo, rng, binCounts, binDensity, barsH, lab, commas, quant,
  svar, randAssign, armStats, diffMeans, finitePop, exactVar, forEachAssign, choose, histPanel, confPop, normalPdf,
} from './ch02.shared.js';

const sd = (a) => Math.sqrt(svar(a));

export default {
  collection: 'causal',
  chapter: 2,
  title: 'Randomized experiments',
  summary: String.raw`Randomization makes treated and untreated groups exchangeable by design, so a simple difference in means is unbiased for the average effect; Neyman’s finite-population theory gives its variance and Fisher’s randomization test gives exact p-values for the sharp null. Conditional randomization within strata leads to the two basic adjustment formulas — standardization and inverse probability weighting — which agree when computed nonparametrically. Covariate adjustment sharpens estimates, and noncompliance separates the effect of assignment from the effect of treatment actually received.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Principle', name: 'Randomization',
      statement: String.raw`**Randomization** assigns treatment by a mechanism that uses nothing about the units: each unit's chance of treatment is fixed in advance (a coin flip, a shuffled deck) and does not depend on its potential outcomes or on any of its characteristics. Then the treatment indicator $A$ is independent of $(Y^0,Y^1)$ and of every pre-treatment covariate $X$, *measured or not*, so the treated and untreated groups are exchangeable (item 1.7) by design rather than by assumption. In any one trial the arms still differ by chance: the standardized difference of a covariate between arms is of order $\sqrt{1/n_1+1/n_0}$ and shrinks like $1/\sqrt n$, whereas when people choose their own treatment on a factor that also matters for the outcome the imbalance does not shrink at all.`,
      idea: String.raw`If the assignment mechanism ignores everything about a unit, then conditional on $A$ the covariates (and the potential outcomes) have the same distribution in both arms, which is exactly exchangeability. This works for variables nobody thought to measure, which no amount of adjusting can do. The balance is a statement about the *mechanism*, not about the one realised trial: in a given trial the covariate means differ by a random amount whose spread is that of a difference of two means, $\sigma\sqrt{1/n_1+1/n_0}$, so small trials can be badly imbalanced and large ones nearly balanced.`,
      caption: String.raw`Left: the distribution of one covariate in the treated (blue) and untreated (orange) arm of a single simulated trial. Right: the average absolute standardized imbalance over 200 trials at each $n$ (dots), against the curve $1.6/\sqrt n$ (dashed), with the current $n$ and trial in gold. With **coin flips** the unmeasured, skewed $u$ balances just like the measured $x$, with imbalance falling like $1/\sqrt n$. Switch to **people choose** (the choice depends on $u$) and the curve for $u$ flattens: no sample size repairs it, while $x$, which the choice ignores, still balances.`,
      deps: ['causal-1.7'], refs: ['Hernán–Robins §2.1'], tags: ['randomization', 'balance'],
      credit: 'Fisher, 1925–1935 (randomized assignment); Neyman, 1923',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Randomized_experiment' },
      viz(v) {
        const NS = [10, 20, 40, 80, 160, 320, 640, 1280, 2560];
        const mode = v.select('who gets treated', [{ value: 'coin', label: 'a coin flip for each person' }, { value: 'choice', label: 'people choose (depends on $u$)' }], 'coin');
        const cov = v.select('look at', [{ value: 'x', label: 'measured $x$ (symmetric)' }, { value: 'u', label: 'unmeasured $u$ (skewed)' }], 'u');
        const nS = v.slider('sample size $n$', 10, 2560, 160, { log: true, int: true, sig: 2 });
        let seed = 1;
        v.button('run the trial again', () => { seed++; });
        const pops = new Map();
        const pop = (n) => {
          if (!pops.has(n)) { const r = rng(n * 131 + 3), x = new Float64Array(n), u = new Float64Array(n); for (let i = 0; i < n; i++) { x[i] = r.normal(); u[i] = -Math.log(1 - r()) - 1; } pops.set(n, { x, u }); }
          return pops.get(n);
        };
        const KCH = 1.3;
        const assign = (P, sd0) => { const r = rng(sd0 * 7919 + 17), n = P.x.length, A = new Uint8Array(n); for (let i = 0; i < n; i++) A[i] = r() < (mode.value === 'coin' ? 0.5 : logistic(KCH * P.u[i])) ? 1 : 0; return A; };
        const smd = (vals, A) => {
          let n1 = 0, n0 = 0, s1 = 0, s0 = 0, t = 0, q = 0; const n = vals.length;
          for (let i = 0; i < n; i++) { if (A[i]) { n1++; s1 += vals[i]; } else { n0++; s0 += vals[i]; } t += vals[i]; }
          if (!n1 || !n0) return NaN; const m = t / n; for (let i = 0; i < n; i++) q += (vals[i] - m) ** 2;
          return (s1 / n1 - s0 / n0) / Math.sqrt(q / n);
        };
        const cache = new Map();
        const trials = (n) => {
          const k = [n, mode.value, cov.value].join('|');
          if (!cache.has(k)) { const P = pop(n), vals = P[cov.value]; let s = 0, c = 0; for (let t = 0; t < 200; t++) { const e = smd(vals, assign(P, 1000 + t)); if (Number.isFinite(e)) { s += Math.abs(e); c++; } } cache.set(k, c ? s / c : NaN); }
          return cache.get(k);
        };
        const sH = v.stage({ x: [-4, 4], y: [0, 0.3], axes: 'box', gutter: true, height: 330, xlabel: 'covariate value', ylabel: 'share of the arm', title: 'one trial' });
        const sB = v.stage({ x: [8, 3200], y: [0.005, 2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'sample size $n$', ylabel: 'mean |standardized imbalance|', title: 'imbalance against $n$ (200 trials each)' });
        v.legend([['accent', 'treated'], ['orange', 'untreated'], ['ink', 'mean over 200 trials'], ['muted', '$1.6/\\sqrt n$', { dash: true }], ['gold', 'this trial', { dot: true }]]);
        let cur = { e: NaN, ex: NaN, eu: NaN, n1: 0, n0: 0 };
        v.render(() => {
          const n = nS.value, P = pop(n), A = assign(P, seed), vals = P[cov.value];
          const lo = cov.value === 'x' ? -4 : -1, hi = cov.value === 'x' ? 4 : 6;
          const t1 = [], t0 = []; for (let i = 0; i < n; i++) (A[i] ? t1 : t0).push(vals[i]);
          sH.setLabels(cov.value === 'x' ? 'measured covariate $x$' : 'unmeasured covariate $u$');
          histPanel(sH, [{ vals: t1, color: 'accent' }, { vals: t0, color: 'orange' }], lo, hi, cov.value === 'x' ? 32 : 28);
          const curve = NS.map((m) => [m, trials(m)]);
          sB.path(NS.map((m) => [m, 1.6 / Math.sqrt(m)]), { color: 'muted', dash: true, width: 1.5 });
          sB.path(curve, { color: 'ink', width: 2 }); for (const [m, e] of curve) sB.dot(m, e, { r: 3.5, color: 'ink' });
          const e = Math.abs(smd(vals, A)); cur = { e, ex: smd(P.x, A), eu: smd(P.u, A), n1: t1.length, n0: t0.length };
          if (Number.isFinite(e)) sB.dot(n, Math.max(e, 0.0055), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const n = nS.value;
          return `$n=${n}$: **${cur.n1}** treated, **${cur.n0}** untreated. Standardized difference this trial: measured $x$ $${fx(cur.ex, 3)}$, unmeasured $u$ $${fx(cur.eu, 3)}$. Over 200 trials at this $n$, the mean absolute imbalance of the covariate shown is **${fx(trials(n), 3)}**; pure chance predicts about $${fx(1.6 / Math.sqrt(n), 3)}$.\n` +
            (mode.value === 'coin' ? 'The assignment ignores both $x$ and $u$, so both balance, at the same $1/\\sqrt n$ rate.' : cov.value === 'u' ? 'The choice depends on $u$: its imbalance stays put however large $n$ is.' : 'The choice ignores $x$, so $x$ still balances; but $u$ (switch the covariate) does not.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Theorem', name: 'Difference in means is unbiased under randomization',
      statement: String.raw`Let a finite population of $N$ units have fixed potential outcomes $(Y_i^0,Y_i^1)$, and let exactly $m$ of them ($1\le m\le N-1$) be treated, every subset of size $m$ being equally likely (complete randomization). Then the difference in the observed means,
$$\hat\tau=\frac1m\sum_{i:A_i=1}Y_i-\frac1{N-m}\sum_{i:A_i=0}Y_i,$$
satisfies $E[\hat\tau]=\frac1N\sum_i (Y_i^1-Y_i^0)$, the average causal effect of the population, with the expectation taken over the random assignment alone. The same holds in an infinite population under coin-flip assignment, conditional on both arms being non-empty, and for any $m$, balanced or not. It need not hold when the chance of treatment depends on the potential outcomes.`,
      idea: String.raw`By consistency, a treated unit contributes $Y_i^1$ and an untreated one $Y_i^0$. Under complete randomization every unit has the same chance $m/N$ of being treated, so $E\big[\tfrac1m\sum A_iY_i^1\big]=\tfrac1N\sum Y_i^1$, and likewise $E\big[\tfrac1{N-m}\sum(1-A_i)Y_i^0\big]=\tfrac1N\sum Y_i^0$. Subtracting gives the average effect. Nothing about the outcomes was used, which is the content of exchangeability (item 2.1): the treated are a random sample of the population, and so are the untreated.

Under complete fixed-size randomization, COMB 1.6 counts all assignments and those containing a specified unit. Their ratio is $m/N$. Applying linearity of expectation (PROB 1.6.1) to the fixed potential outcomes times their assignment indicators yields each arm’s population mean and hence the stated unbiased contrast. The indicators are dependent, so no independent-product identity is being used; the proof uses fixed, nonzero arm denominators.`,
      caption: String.raw`Left: a fixed population, each unit a bar from $Y^0$ to $Y^1$; the filled end is the one revealed by this particular assignment. Right: the difference in means over **every** assignment (for 8 or 12 units all $\binom Nm$ of them are enumerated; for 40 units random draws): the histogram is centred on the true average effect (black line), with its mean (gold) on top of it to about $10^{-13}$. Switch on **units choose their arm**, with higher-baseline units more eager, and the centre moves away: unbiasedness needs the randomization, not just a difference in means.`,
      deps: ['causal-2.1', 'causal-1.3', 'prob-1.6.1', 'comb-1.6'], refs: ['Hernán–Robins §2.1', 'Hernán–Robins §10.2'], tags: ['randomization', 'unbiasedness'],
      credit: 'Neyman, 1923',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Average_treatment_effect' },
      viz(v) {
        const popN = v.select('population', [{ value: '8', label: '8 units' }, { value: '12', label: '12 units' }, { value: '40', label: '40 units' }], '12');
        const frac = v.slider('share treated $m/N$', 0.1, 0.9, 0.5, { step: 0.05 });
        const reps = v.select('draws (40 units)', [{ value: '1000', label: '1,000' }, { value: '20000', label: '20,000' }], '1000');
        const choose_ = v.toggle('units choose their arm (not randomized)', false);
        const kk = v.slider('how much higher-baseline units want treatment', 0.2, 3, 1.2, { step: 0.1 });
        let seed = 1;
        v.button('draw another assignment', () => { seed++; });
        const pops = new Map();
        const popOf = (N) => { if (!pops.has(N)) pops.set(N, finitePop(N, 3 + N, 5, 5)); return pops.get(N); };
        const get = memo();
        const calc = () => get([popN.value, frac.value, reps.value, choose_.value, kk.value].join('|'), () => {
          const N = +popN.value, P = popOf(N), m = clamp(Math.round(frac.value * N), 1, N - 1), est = [];
          const dm = (A) => { let s1 = 0, s0 = 0, n1 = 0, n0 = 0; for (let i = 0; i < N; i++) { if (A[i]) { s1 += P.y1[i]; n1++; } else { s0 += P.y0[i]; n0++; } } return n1 && n0 ? s1 / n1 - s0 / n0 : NaN; };
          let exact = false;
          if (!choose_.value && N <= 12) { exact = true; forEachAssign(N, m, (A) => est.push(dm(A))); }
          else {
            const R = +reps.value, r = rng(99 + N * 13 + m), A = new Uint8Array(N), idx = new Int32Array(N), m0 = mean(P.y0), s0 = sd(P.y0);
            for (let k = 0; k < R; k++) {
              if (choose_.value) { for (let i = 0; i < N; i++) A[i] = r() < logistic(kk.value * (P.y0[i] - m0) / s0) ? 1 : 0; } else randAssign(r, N, m, A, idx);
              const e = dm(A); if (Number.isFinite(e)) est.push(e);
            }
          }
          return { N, P, m, est, exact, mu: mean(est), sdv: sd(est) };
        });
        const sU = v.stage({ x: [0, 41], y: [25, 85], axes: 'box', gutter: true, height: 340, xlabel: 'unit', ylabel: 'outcome', xticks: [], title: 'the population and one assignment' });
        const sH = v.stage({ x: [-10, 20], y: [0, 0.1], axes: 'box', gutter: true, height: 340, xlabel: 'difference in means $\\hat\\tau$', ylabel: 'share of assignments', title: 'all assignments' });
        v.legend([['accent', 'treated: shows $Y^1$', { dot: true }], ['orange', 'untreated: shows $Y^0$', { dot: true }], ['ink', 'true average effect'], ['gold', 'mean of the estimates', { dash: true }]]);
        v.render(() => {
          kk.el.hidden = !choose_.value; reps.el.hidden = +popN.value !== 40 && !choose_.value ? true : false;
          const C = calc(), { N, P, m } = C, r = rng(seed * 31 + N), A = new Uint8Array(N), idx = new Int32Array(N);
          if (choose_.value) { const m0 = mean(P.y0), s0 = sd(P.y0); for (let i = 0; i < N; i++) A[i] = r() < logistic(kk.value * (P.y0[i] - m0) / s0) ? 1 : 0; } else randAssign(r, N, m, A, idx);
          sU.setView([0, N + 1], [25, 85]);
          for (let i = 0; i < N; i++) {
            const x = i + 1; sU.arrow(x, P.y0[i], x, P.y1[i], { color: P.y1[i] >= P.y0[i] ? 'green' : 'red', width: N > 20 ? 1.4 : 2, head: N > 20 ? 4 : 6, alpha: 0.65 });
            sU.dot(x, A[i] ? P.y1[i] : P.y0[i], { r: N > 20 ? 3.5 : 5, color: A[i] ? 'accent' : 'orange' });
          }
          const lo = Math.floor(Math.min(P.ate, ...C.est) - 2), hi = Math.ceil(Math.max(P.ate, ...C.est) + 2);
          histPanel(sH, [{ vals: C.est, color: choose_.value ? 'red' : 'accent' }], lo, hi, 36);
          sH.vline(P.ate, { color: 'ink', width: 2.4 }); sH.vline(C.mu, { color: 'gold', width: 1.6, dash: true });
        });
        v.readout(() => {
          const C = calc(), d = Math.abs(C.mu - C.P.ate);
          const how = C.exact ? `all $\\binom{${C.N}}{${C.m}}=${choose(C.N, C.m)}$ assignments` : `${commas(C.est.length)} random assignments`;
          return `True average effect over the ${C.N} units: **$${fx(C.P.ate, 4)}$**. Mean of $\\hat\\tau$ over ${how}: **$${fx(C.mu, 4)}$**` +
            (C.exact ? ` (difference ${d < 1e-9 ? 'below $10^{-9}$: exactly equal' : fx(d, 6)}).` : ` (difference $${fx(C.mu - C.P.ate, 3)}$; Monte Carlo standard error $${fx(C.sdv / Math.sqrt(C.est.length), 3)}$).`) +
            ` Spread of single estimates: $${fx(C.sdv, 2)}$.` + (choose_.value ? '\nHigher-baseline units select themselves into treatment: the estimates centre on the wrong value (bias $' + sg(C.mu - C.P.ate, 2) + '$).' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Theorem', name: 'Neyman’s conservative variance estimator',
      statement: String.raw`In the setting of item 2.2 let $S_1^2,S_0^2$ be the population variances (denominator $N-1$) of $Y^1$ and $Y^0$, and $S_\tau^2$ that of the individual effects $\tau_i=Y_i^1-Y_i^0$, with $n_1=m$ units treated and $n_0=N-m$ untreated. Over the random assignment,
$$\operatorname{Var}(\hat\tau)=\frac{S_1^2}{n_1}+\frac{S_0^2}{n_0}-\frac{S_\tau^2}{N}.$$
When $n_1,n_0\ge2$, the sample variances $s_1^2,s_0^2$ of the observed outcomes in the two arms are unbiased for $S_1^2,S_0^2$, so Neyman's estimator $\hat V=s_1^2/n_1+s_0^2/n_0$ has $E[\hat V]=\operatorname{Var}(\hat\tau)+S_\tau^2/N\ \ge\ \operatorname{Var}(\hat\tau)$: it is never too small on average, and exactly right when the effect is the same for every unit ($S_\tau^2=0$). Under an appropriate large-sample normal approximation and variance-estimation regularity, the confidence interval $\hat\tau\pm1.96\sqrt{\hat V}$ is asymptotically conservative; conservatism in variance expectation alone does not ensure finite-sample coverage.`,
      idea: String.raw`The arm means are dependent under complete randomization. Their separate variances have finite-population corrections: $(1/n_a-1/N)S_a^2$. If $S_{10}$ is the finite-population covariance of the paired potential outcomes, the covariance of the two arm means is $-S_{10}/N$, which can have either sign. Combining these terms with $S_\tau^2=S_1^2+S_0^2-2S_{10}$ gives the stated variance formula. The correction cannot be estimated, because $\tau_i$ is never seen for any unit (the fundamental problem, item 1.2); dropping it can only make the variance estimate too large, since $S_\tau^2\ge0$.

The variance identity in PROB 1.6.9a represents variance as an expectation of a centered square, so the finite-population effect variance is nonnegative. With the denominator $N-1$, it differs from the variance under the uniform law on units only by a positive factor. Consequently, after the stated exact randomization variance formula, omitting its subtracted effect-variance term gives conservatism in expectation. This nonnegativity argument does not derive the covariance correction or guarantee a normal approximation in small samples.`,
      caption: String.raw`A fixed population of 30 units; slide the **spread of the individual effects** $S_\tau$ from 0 (constant effect) upward and re-randomize 4,000 times. Left: the estimates (bars) against the normal curve with the exact variance above. Right: Neyman's $\hat V$ in every re-randomization, with the true variance (black) and the average of $\hat V$ (gold). They coincide at $S_\tau=0$ and separate by exactly $S_\tau^2/N$ as the effects spread. The coverage of the interval $\hat\tau\pm1.96\sqrt{\hat V}$ in the readout is at least nominal, up to normal-approximation error.`,
      deps: ['causal-2.2', 'stat-1.3', 'prob-1.6.9a'], refs: ['Hernán–Robins §10.2'], tags: ['variance', 'finite population'],
      credit: 'Neyman, 1923',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neyman%E2%80%93Rubin_causal_model' },
      viz(v) {
        const sT = v.slider('spread of individual effects $S_\\tau$', 0, 10, 6, { step: 0.5 });
        const m1 = v.slider('treated units $n_1$ (of 30)', 6, 24, 15, { int: true });
        const sdY = v.slider('spread of outcomes', 4, 14, 8, { step: 1 });
        const N = 30;
        const get = memo();
        const calc = () => get([sT.value, m1.value, sdY.value].join('|'), () => {
          const P = finitePop(N, 4, sT.value, 5, { sd: sdY.value }), n1 = m1.value, n0 = N - n1, R = 4000;
          const r = rng(2024 + n1), A = new Uint8Array(N), idx = new Int32Array(N), y = new Float64Array(N), est = [], vh = []; let cover = 0;
          const Vex = exactVar(P, n1);
          for (let k = 0; k < R; k++) {
            randAssign(r, N, n1, A, idx); for (let i = 0; i < N; i++) y[i] = A[i] ? P.y1[i] : P.y0[i];
            const a = armStats(y, A), e = a.m1 - a.m0, V = a.v1 / n1 + a.v0 / n0; est.push(e); vh.push(V);
            if (Math.abs(e - P.ate) <= 1.96 * Math.sqrt(V)) cover++;
          }
          return { P, n1, n0, est, vh, Vex, Vemp: svar(est), EV: mean(vh), cover: cover / R, gap: P.St / N };
        });
        const sA = v.stage({ x: [-10, 20], y: [0, 0.1], axes: 'box', gutter: true, height: 330, xlabel: 'difference in means $\\hat\\tau$', ylabel: 'share', title: 'the estimate over 4,000 re-randomizations' });
        const sV = v.stage({ x: [0, 40], y: [0, 0.1], axes: 'box', gutter: true, height: 330, xlabel: 'Neyman’s $\\hat V$', ylabel: 'share', title: 'its variance estimate' });
        v.legend([['accent', 'estimates $\\hat\\tau$'], ['ink', 'exact variance (curve) / value (line)'], ['gold', 'mean of $\\hat V$', { dash: true }], ['purple', 'values of $\\hat V$']]);
        v.render(() => {
          const C = calc(), s = Math.sqrt(C.Vex), lo = C.P.ate - 4.5 * Math.sqrt(Math.max(C.EV, C.Vex)), hi = C.P.ate + 4.5 * Math.sqrt(Math.max(C.EV, C.Vex)), nb = 40;
          histPanel(sA, [{ vals: C.est, color: 'accent' }], lo, hi, nb);
          const bw = (hi - lo) / nb; sA.fn((x) => normalPdf(x, C.P.ate, s) * bw, { color: 'ink', width: 2 }); sA.vline(C.P.ate, { color: 'muted', dash: true });
          const vmax = Math.max(quant(C.vh, 0.995), C.EV, C.Vex) * 1.15;
          histPanel(sV, [{ vals: C.vh, color: 'purple' }], 0, vmax, 40);
          sV.vline(C.Vex, { color: 'ink', width: 2.4 }); sV.vline(C.EV, { color: 'gold', width: 2, dash: true });
        });
        v.readout(() => {
          const C = calc();
          return `Exact $\\operatorname{Var}(\\hat\\tau)=S_1^2/n_1+S_0^2/n_0-S_\\tau^2/N=${fx(C.P.S1 / C.n1, 3)}+${fx(C.P.S0 / C.n0, 3)}-${fx(C.gap, 3)}=$ **${fx(C.Vex, 3)}**; over 4,000 draws: ${fx(C.Vemp, 3)}.\n` +
            `Mean of Neyman's $\\hat V$: **${fx(C.EV, 3)}**, which should equal the exact variance plus $S_\\tau^2/N=${fx(C.gap, 3)}$, i.e. ${fx(C.Vex + C.gap, 3)}. ` + (C.gap < 1e-6 ? 'Constant effect: $\\hat V$ is unbiased.' : `The estimator overstates the variance by ${fx(100 * C.gap / C.Vex, 1)}%.`) +
            ` Coverage of $\\hat\\tau\\pm1.96\\sqrt{\\hat V}$: **${pct(C.cover)}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Method', name: 'Fisher’s randomization test',
      statement: String.raw`The **sharp null hypothesis** says that the treatment has no effect on any unit: $Y_i^1=Y_i^0$ for all $i$. Under it, the observed outcomes $y_1,\dots,y_N$ are the same whichever assignment is drawn, so the only random thing is which units received the label "treated". For a test statistic $T$ (for example the difference in means) and the observed value $t_{\rm obs}$, the **randomization test** relabels the units in every way the experiment could have assigned them, computes $T$ for each, and reports the share of relabelings with $T\ge t_{\rm obs}$ (or $|T|\ge|t_{\rm obs}|$). This is an exact $p$-value for the sharp null, valid for any statistic, any sample size and any outcome distribution. When there are too many relabelings, a random sample of $B$ of them gives $\hat p=(1+\#\{T^*\ge t_{\rm obs}\})/(1+B)$, which is also valid.`,
      idea: String.raw`The randomization is the only source of randomness, and the experimenter performed it. Under the sharp null the outcomes carry no trace of the labels, so the observed labeling is one equally likely draw from all labelings, and its $T$ is one draw from the randomization distribution. A statistic that is extreme in this distribution is evidence against the null with rejection probability at most the nominal level (ties and discreteness can make it smaller), with no model for the outcomes. The test does not test the *average* effect: it tests that no unit was affected.

For complete randomization with exactly $m$ treated units, COMB 1.6 counts the equally likely assignments as the $m$-element subsets. Under the sharp null the responses are fixed, so the exhaustive tail probability is the number of assignments with a statistic at least as extreme divided by that count. Ties remain in the tail. This counts the exact randomization distribution; the Monte Carlo plus-one construction needs its own exchangeable-simulation argument.`,
      caption: String.raw`The top lane of the left panel is the experiment as run (blue: treated); the lane below relabels the same outcomes at random. Press **shuffle once** to see one relabeling and its difference in means; **+1000** builds the randomization distribution on the right, where the observed statistic is marked and the tail at least as extreme turns red. For 5 + 5 units all 252 labelings are listed, so $p$ is exact. Set the true effect to 0 and press **new experiment** several times: $p$ wanders between 0 and 1 and falls below 0.05 about one time in twenty.`,
      deps: ['causal-2.1', 'stat-7.13', 'comb-1.6'], refs: ['Hernán–Robins §10'], tags: ['permutation test', 'p-value'],
      credit: 'Fisher, 1935',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Permutation_test' },
      viz(v) {
        const size = v.select('experiment', [{ value: '5', label: '5 + 5 (exact)' }, { value: '10', label: '10 + 10' }, { value: '20', label: '20 + 20' }], '10');
        const eff = v.slider('true effect used to make the data', -4, 16, 9, { step: 0.5 });
        const tail = v.select('tail', [{ value: 'two', label: 'two-sided' }, { value: 'one', label: 'one-sided (treated higher)' }], 'two');
        let expSeed = 1, key = '', D = null, draws = [], shown = null, rr = null, exact = false;
        const stat = (A) => diffMeans(D.y, A);
        const relabel = () => { const A = new Uint8Array(D.N), idx = new Int32Array(D.N); randAssign(rr, D.N, D.k, A, idx); return A; };
        const ensure = () => {
          const k0 = [size.value, eff.value, expSeed].join('|'); if (k0 === key) return; key = k0;
          const k = +size.value, N = 2 * k, r = rng(expSeed * 1009 + k), y = new Float64Array(N), A0 = new Uint8Array(N), jit = [];
          for (let i = 0; i < N; i++) { A0[i] = i < k ? 1 : 0; y[i] = 50 + 8 * r.normal() + (A0[i] ? eff.value : 0); jit.push(r()); }
          D = { k, N, y, A0, jit, tobs: diffMeans(y, A0) }; rr = rng(expSeed * 77 + k * 5); draws = []; exact = k === 5;
          if (exact) forEachAssign(N, k, (A) => draws.push(stat(A))); else for (let b = 0; b < 400; b++) draws.push(stat(relabel()));
          shown = relabel();
        };
        v.button('shuffle once', () => { ensure(); shown = relabel(); if (!exact) draws.push(stat(shown)); });
        const more = v.button('+1000 shuffles', () => { ensure(); for (let b = 0; b < 1000; b++) draws.push(stat(relabel())); shown = relabel(); });
        v.button('new experiment', () => { expSeed++; });
        const sL = v.stage({ x: [20, 90], y: [-0.7, 1.9], axes: false, height: 330, title: 'the outcomes, labeled two ways' });
        const sH = v.stage({ x: [-20, 20], y: [0, 0.1], axes: 'box', gutter: true, height: 330, xlabel: 'difference in means $T$', ylabel: 'share of relabelings', title: 'randomization distribution' });
        v.legend([['accent', 'labeled treated', { dot: true }], ['orange', 'labeled untreated', { dot: true }], ['red', 'at least as extreme as observed'], ['ink', 'observed $T$']]);
        const isExt = (t) => (tail.value === 'two' ? Math.abs(t) >= Math.abs(D.tobs) - 1e-9 : t >= D.tobs - 1e-9);
        v.render(() => {
          ensure(); more.hidden = exact; more.style && (more.style.display = exact ? 'none' : '');
          const { N, y, A0, jit, tobs } = D;
          const dots = (A, yy, lane) => { for (let i = 0; i < N; i++) sL.dot(y[i], yy + 0.28 * (jit[i] - 0.5) * 2 * (lane ? 1 : 1) * 0.9, { r: 5, color: A[i] ? 'accent' : 'orange', alpha: 0.9 }); };
          const sh = shown || A0, a0 = armStats(y, A0), a1 = armStats(y, sh);
          sL.text('as run', 21, 1.62, { size: 12, color: 'muted', align: 'left' }); dots(A0, 1.05, 0);
          sL.text('one relabeling', 21, 0.62, { size: 12, color: 'muted', align: 'left' }); dots(sh, 0.05, 1);
          for (const [lane, a, A] of [[1.05, a0, A0], [0.05, a1, sh]]) {
            sL.line(a.m1, lane - 0.42, a.m1, lane + 0.42, { color: 'accent', width: 3 }); sL.line(a.m0, lane - 0.42, a.m0, lane + 0.42, { color: 'orange', width: 3 });
          }
          sL.text('$T=' + fx(a0.m1 - a0.m0, 1) + '$', 89, 1.62, { size: 13, align: 'right', color: 'ink' }); sL.text('$T^*=' + fx(a1.m1 - a1.m0, 1) + '$', 89, 0.62, { size: 13, align: 'right', color: 'ink' });
          const lim = Math.max(8, Math.ceil(Math.max(Math.abs(tobs), ...draws.map(Math.abs)) + 1)), nb = 40;
          histPanel(sH, [{ vals: draws, color: 'accent', fillAlpha: 0.25 }], -lim, lim, nb);
          const ext = draws.filter(isExt), h = binCounts(ext, -lim, lim, nb);
          barsH(sH, { edges: h.edges, counts: h.counts.map((c) => c / draws.length) }, { color: 'red', fillAlpha: 0.4, width: 1.2 });
          sH.vline(tobs, { color: 'ink', width: 2.4 }); if (tail.value === 'two') sH.vline(-tobs, { color: 'ink', width: 1.4, dash: true });
        });
        v.readout(() => {
          ensure(); const ext = draws.filter(isExt).length, B = draws.length;
          const p = exact ? ext / B : (ext + 1) / (B + 1);
          return `Observed difference in means $T=${fx(D.tobs, 2)}$. ${exact ? `All $\\binom{10}{5}=252$ labelings: ${ext} are at least as extreme, so the exact $p=${ext}/252=$ **${fx(p, 4)}**.` : `Among **${commas(B)}** random relabelings, ${ext} are at least as extreme: $\\hat p=(1+${ext})/(1+${B})=$ **${fx(p, 4)}**.`} ` +
            (p < 0.05 ? 'Rejects the sharp null at the 5% level.' : 'No evidence against the sharp null at the 5% level.') + (eff.value === 0 ? ' (The data were generated with no effect for anyone, so the null is true.)' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Method', name: 'Conditional randomization and blocking',
      statement: String.raw`**Blocking** (stratified or conditional randomization) first splits the units into blocks by a pre-treatment covariate $L$ and then randomizes separately within each block, with a fixed treated share $n_{1b}/N_b$ in block $b$. Within every block the arms are exchangeable, so the blockwise difference in means $\hat\tau_b$ is unbiased for the block's average effect and
$$\hat\tau_{\rm blocked}=\sum_b\frac{N_b}{N}\,\hat\tau_b$$
is unbiased for the population average effect. When treatment probabilities differ between blocks, the plain difference in means is **not** unbiased, and the weights above (or the adjustments of items 2.6 and 2.7) are required. Its variance is $\sum_b (N_b/N)^2\big(S_{1b}^2/n_{1b}+S_{0b}^2/n_{0b}-S_{\tau b}^2/N_b\big)$, under independent block randomizations. Precision relative to complete randomization depends on the blocks, allocation fractions and potential outcomes; no universal reduction is asserted.`,
      idea: String.raw`Complete randomization can, by luck, put too many of the high-outcome units into one arm; the difference in means then wanders even though it is unbiased. With a common treatment fraction, fixing block arm counts fixes the same block composition in both arms. When treatment fractions differ by block, the stated population-weighted contrast still preserves the target composition; a plain difference need not. Independent assignments across blocks leave only within-block randomization in its variance calculation. Precision gains depend on the design and potential outcomes, while the weighted estimator remains unbiased whenever both arms in each block are nonempty.

When the block assignments are randomized independently, their centered block estimators are independent and have finite second moments for fixed finite outcomes. The variance-of-uncorrelated-sums theorem (PROB 2.2.1), applied after multiplying each estimator by its population block weight, removes cross terms and gives the displayed sum of squared-weight variances. It does not treat the two treatment arms within a block as independent, or establish a universal precision improvement over every unblocked design.`,
      caption: String.raw`40 units in 4 blocks of 10, an assignment drawn both ways: completely random (the counts above the columns show how unevenly it splits each block) and blocked (always 5 and 5). The histogram pools 3,000 re-randomizations of each design: both are centred on the true effect, but the blocked one is narrower when the blocks differ in outcome. Slide **how prognostic the blocking variable is**, or switch it to a covariate **unrelated** to the outcome, and the advantage goes away.`,
      deps: ['causal-2.1', 'prob-2.2.1'], refs: ['Hernán–Robins §2.2'], tags: ['blocking', 'variance reduction'],
      credit: 'Fisher, 1926 (randomized blocks)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Blocking_(statistics)' },
      viz(v) {
        const beta = v.slider('how strongly the blocking variable predicts the outcome', 0, 14, 9, { step: 0.5 });
        const which = v.select('blocks are made from', [{ value: 'prog', label: 'a prognostic covariate' }, { value: 'irr', label: 'an unrelated covariate' }], 'prog');
        let seed = 1;
        v.button('draw another assignment', () => { seed++; });
        const N = 40, nb = 4, nB = 10;
        const base = (() => { const r = rng(515); const w = [], q = [], e = [], z = []; for (let i = 0; i < N; i++) { w.push(r.normal()); q.push(r.normal()); e.push(r.normal()); z.push(r.normal()); } return { w, q, e, z }; })();
        const blocksOf = (key) => { const ord = Array.from({ length: N }, (_, i) => i).sort((a, b) => key[a] - key[b]); const blk = new Int32Array(N); ord.forEach((i, j) => { blk[i] = Math.floor(j / nB); }); return blk; };
        const get = memo();
        const calc = () => get([beta.value, which.value].join('|'), () => {
          const y0 = new Float64Array(N), y1 = new Float64Array(N), t = new Float64Array(N), sw = sd(base.w), sz = sd(base.z);
          for (let i = 0; i < N; i++) { y0[i] = 50 + beta.value * base.w[i] / sw + 6 * base.e[i]; t[i] = 5 + 2 * base.z[i] / sz; y1[i] = y0[i] + t[i]; }
          const blk = blocksOf(which.value === 'prog' ? base.w : base.q), lists = Array.from({ length: nb }, () => []); for (let i = 0; i < N; i++) lists[blk[i]].push(i);
          const ate = mean(t), P = { n: N, y0, y1, t, S0: svar(y0), S1: svar(y1), St: svar(t) };
          const sub = (a, L) => L.map((i) => a[i]);
          let Vb = 0; for (const L of lists) { const w = L.length / N; Vb += w * w * (svar(sub(y1, L)) / (nB / 2) + svar(sub(y0, L)) / (nB / 2) - svar(sub(t, L)) / L.length); }
          const mb = lists.map((L) => mean(sub(y0, L))), grand = mean(y0); const ssb = lists.reduce((s, L, b) => s + L.length * (mb[b] - grand) ** 2, 0), sst = y0.reduce((s, q) => s + (q - grand) ** 2, 0);
          const r = rng(4242), A = new Uint8Array(N), idx = new Int32Array(N), ec = [], eb = [], dm = (A2) => { let s1 = 0, s0 = 0; for (let i = 0; i < N; i++) { if (A2[i]) s1 += y1[i]; else s0 += y0[i]; } return s1 / (N / 2) - s0 / (N / 2); };
          const blockAssign = (rg, A2) => { A2.fill(0); for (const L of lists) { const c = L.slice(); for (let i = 0; i < nB / 2; i++) { const j = i + Math.floor(rg() * (c.length - i)); const tq = c[i]; c[i] = c[j]; c[j] = tq; A2[c[i]] = 1; } } };
          for (let k = 0; k < 3000; k++) { randAssign(r, N, N / 2, A, idx); ec.push(dm(A)); blockAssign(r, A); eb.push(dm(A)); }
          return { y0, y1, ate, blk, lists, ec, eb, Vc: exactVar(P, N / 2), Vb, r2: ssb / sst, blockAssign };
        });
        const mk = (title) => v.stage({ x: [0.4, 4.6], y: [25, 80], axes: 'box', gutter: true, height: 320, xlabel: 'block', ylabel: 'outcome', xticks: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], title });
        const sC = mk('completely randomized'), sB = mk('blocked');
        const sH = v.stage({ x: [-8, 18], y: [0, 0.1], axes: 'box', gutter: true, height: 320, xlabel: 'difference in means', ylabel: 'share', title: '3,000 re-randomizations of each' });
        v.legend([['accent', 'treated', { dot: true }], ['orange', 'untreated', { dot: true }], ['purple', 'completely randomized'], ['green', 'blocked'], ['ink', 'true effect']]);
        v.render(() => {
          const C = calc(), r = rng(seed * 61 + 5), A1 = new Uint8Array(N), A2 = new Uint8Array(N), idx = new Int32Array(N);
          randAssign(r, N, N / 2, A1, idx); C.blockAssign(r, A2);
          const lo = Math.floor(Math.min(...C.y0, ...C.y1) - 2), hi = Math.ceil(Math.max(...C.y0, ...C.y1) + 2);
          for (const [s, A] of [[sC, A1], [sB, A2]]) {
            s.setView([0.4, 4.6], [lo, hi]); const seen = [0, 0, 0, 0], tr = [0, 0, 0, 0];
            for (let i = 0; i < N; i++) { const b = C.blk[i]; const k = seen[b]++; const x = b + 1 + (k - 4.5) * 0.065; if (A[i]) tr[b]++; s.dot(x, A[i] ? C.y1[i] : C.y0[i], { r: 4.5, color: A[i] ? 'accent' : 'orange', alpha: 0.9 }); }
            for (let b = 0; b < 4; b++) s.text(tr[b] + ' | ' + (nB - tr[b]), b + 1, hi - 2, { size: 12, color: tr[b] === 5 ? 'green' : 'red', align: 'center', weight: 700 });
          }
          const all = [...C.ec, ...C.eb], l2 = Math.floor(Math.min(C.ate, ...all) - 1), h2 = Math.ceil(Math.max(C.ate, ...all) + 1);
          histPanel(sH, [{ vals: C.ec, color: 'purple' }, { vals: C.eb, color: 'green' }], l2, h2, 40); sH.vline(C.ate, { color: 'ink', width: 2.2 });
        });
        v.readout(() => {
          const C = calc(), sc = sd(C.ec), sb = sd(C.eb);
          return `Blocks explain **${pct(C.r2, 0)}** of the variance of $Y^0$. True average effect $${fx(C.ate, 3)}$; mean estimate: complete $${fx(mean(C.ec), 3)}$, blocked $${fx(mean(C.eb), 3)}$ (both unbiased).\n` +
            `Standard deviation of the estimate: complete **${fx(sc, 3)}** (exact formula ${fx(Math.sqrt(C.Vc), 3)}), blocked **${fx(sb, 3)}** (exact ${fx(Math.sqrt(C.Vb), 3)}); ratio blocked/complete **${fx(sb / sc, 2)}**. In the figures above, the numbers over each column are treated | untreated in the block.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Method', name: 'Standardization',
      statement: String.raw`Suppose a discrete covariate $L$ is enough for exchangeability, $Y^a\perp A\mid L$, and positivity holds, $P(A=a\mid L=l)>0$ whenever $P(L=l)>0$ (items 1.7–1.9). The **standardized** (or g-formula) estimate of the mean counterfactual outcome under treatment value $a$ weights the stratum-specific means by the distribution of $L$ in the *whole* population:
$$E[Y^a]=\sum_l E[Y\mid A=a,L=l]\;P(L=l).$$
The average effect is the difference of the standardized means for $a=1$ and $a=0$. The crude comparison $E[Y\mid A=1]-E[Y\mid A=0]$ instead weights the strata by $P(L=l\mid A=a)$, which can differ between the arms when $L$ affects treatment. Different weights can create confounding when stratum counterfactual means differ, but do not alone imply bias. Standardization uses the population weights; its causal interpretation still requires the stated identification assumptions.`,
      idea: String.raw`Within a stratum $l$ the units are exchangeable (conditional randomization, item 2.5, or by assumption), so the observed mean in arm $a$ stands in for the counterfactual mean of the stratum: $E[Y^a\mid L=l]=E[Y\mid A=a,L=l]$. The marginal counterfactual mean is the average of the stratum means over the stratum sizes of the whole population (law of total expectation); the data supply the stratum means, positivity guarantees they exist, and the weights are simply the observed stratum proportions.

The tower property (PROB 4.1.13) marginalizes the already identified conditional mean over the covariate field. For the stated discrete strata, its outer expectation uses $P(L=l)$, rather than the covariate distribution selected by one treatment arm. This is the specific averaging step behind standardization; the earlier causal assumptions supply identification of the inner mean, not the probability identity.`,
      caption: String.raw`A simulated cohort (4,000 people) where severe patients ($L=1$) are much more likely to be treated. Each panel is the world "everyone gets treatment $a$": bar heights are the stratum risks $E[Y\mid A=a,L=l]$, widths are the shares of the *whole* cohort in each stratum, so the **total shaded area is the standardized risk**. The dashed outlines reweight the same heights by the stratum shares within the treated (or untreated) group alone, whose area is the crude risk. Move **confounding** to 0 and the outlines and the shading coincide. The "truth" bar uses the simulation's hidden $Y^0,Y^1$.`,
      deps: ['causal-2.5', 'causal-1.9', 'prob-4.1.13'], refs: ['Hernán–Robins §2.3'], tags: ['standardization', 'g-formula'],
      credit: 'Standardization of rates is old (epidemiology); causal reading: Robins, 1986',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Standardization_(statistics)' },
      viz(v) {
        const cs = v.slider('confounding: how much severity drives treatment', 0, 3, 1.5, { step: 0.1 });
        const rr = v.slider('risk ratio of the treatment', 0.3, 1.4, 0.7, { step: 0.05 });
        const pL = v.slider('share severe, $P(L=1)$', 0.1, 0.7, 0.3, { step: 0.05 });
        const get = memo();
        const calc = () => get([cs.value, rr.value, pL.value].join('|'), () => {
          const Q = confPop(4000, 11, { pL: pL.value, c: cs.value, rr: rr.value }), cnt = Q.cnt, ev = Q.ev;
          const nl = [cnt[0][0] + cnt[0][1], cnt[1][0] + cnt[1][1]], na = [cnt[0][0] + cnt[1][0], cnt[0][1] + cnt[1][1]];
          const r = (l, a) => (cnt[l][a] ? ev[l][a] / cnt[l][a] : NaN);
          const std = [0, 1].map((a) => (nl[0] * r(0, a) + nl[1] * r(1, a)) / Q.n), crude = [0, 1].map((a) => (ev[0][a] + ev[1][a]) / na[a]);
          return { Q, nl, na, r, std, crude, truth: [Q.truth0, Q.truth1] };
        });
        const mk = (a, title) => v.stage({ x: [0, 1], y: [0, 0.8], axes: 'box', gutter: true, height: 320, xlabel: 'share of the cohort in each stratum', ylabel: 'risk of the outcome', title });
        const s0 = mk(0, 'world: everyone untreated ($a=0$)'), s1 = mk(1, 'world: everyone treated ($a=1$)');
        const sD = v.stage({ x: [0.4, 3.6], y: [-0.25, 0.25], axes: 'box', gutter: true, height: 320, ylabel: 'risk difference', xticks: [[1, 'crude'], [2, 'standardized'], [3, 'truth']], title: 'effect on the risk' });
        v.legend([['green', 'standardized: stratum risks × whole-cohort shares (area)', { area: true }], ['red', 'crude: same risks × shares within the arm', { dash: true }]]);
        v.render(() => {
          const C = calc();
          for (const [s, a] of [[s0, 0], [s1, 1]]) {
            let x = 0; for (const l of [0, 1]) {
              const w = C.nl[l] / C.Q.n, h = C.r(l, a); s.rect(x, 0, x + w, h, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.6 });
              x += w;
            }
            s.setTicks([[C.nl[0] / C.Q.n / 2, 'L=0: ' + pct(C.nl[0] / C.Q.n, 0)], [C.nl[0] / C.Q.n + C.nl[1] / C.Q.n / 2, 'L=1: ' + pct(C.nl[1] / C.Q.n, 0)]], undefined);
            x = 0; for (const l of [0, 1]) { const w = C.Q.cnt[l][a] / C.na[a], h = C.r(l, a); s.rect(x, 0, x + w, h, { fill: 'red', fillAlpha: 0.001, color: 'red', dash: true, width: 1.8 }); x += w; }
            s.text('standardized ' + fx(C.std[a], 3), 0.5, 0.74, { size: 12.5, color: 'green', align: 'center', weight: 700 }); s.text('crude ' + fx(C.crude[a], 3), 0.5, 0.67, { size: 12.5, color: 'red', align: 'center', weight: 700 });
          }
          const vals = [C.crude[1] - C.crude[0], C.std[1] - C.std[0], C.truth[1] - C.truth[0]], cols = ['red', 'green', 'ink'];
          vals.forEach((q, i) => { s0 && sD.rect(i + 0.65, 0, i + 1.35, q, { fill: cols[i], fillAlpha: 0.35, color: cols[i], width: 1.6 }); sD.text((q >= 0 ? '+' : '−') + Math.abs(q).toFixed(3), i + 1, q >= 0 ? q + 0.02 : q - 0.02, { size: 12.5, align: 'center', weight: 700 }); });
        });
        v.readout(() => {
          const C = calc(), c = C.Q.cnt;
          return `Counts ($L,A$): (0,0) ${c[0][0]}, (0,1) ${c[0][1]}, (1,0) ${c[1][0]}, (1,1) ${c[1][1]}. Standardized risks: untreated ${fx(C.std[0], 3)}, treated ${fx(C.std[1], 3)}, difference **${fx(C.std[1] - C.std[0], 3)}**; crude difference ${fx(C.crude[1] - C.crude[0], 3)}; hidden truth ${fx(C.truth[1] - C.truth[0], 3)} (the gap to standardization is sampling noise).\n` +
            (cs.value < 0.05 ? 'No confounding: treatment ignores severity, so the weights coincide and crude equals standardized.' : 'The treated are mostly severe (high-risk) patients, so the crude difference is pushed upward.');
        });
      },
    },
  ],
};
