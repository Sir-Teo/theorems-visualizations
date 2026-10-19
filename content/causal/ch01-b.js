// Causal Inference — Chapter 1: Potential outcomes and causal effects (items 1.7–1.12; 1.1–1.6 in ch01.js)
import {
  clamp, logistic, pct, sg, fx, mean, sdev, memo, rng, makePop, selectAssign, completeAssign, observed, arms, binCounts, binDensity, ksGap, barsH, lab,
} from './ch01.shared.js';

/** Least-squares line y = a + b x. */
function ols(xs, ys) {
  const n = xs.length; if (n < 2) return { a: mean(ys) || 0, b: 0 };
  const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const b = sxx > 1e-12 ? sxy / sxx : 0; return { a: my - b * mx, b };
}

export default {
  collection: 'causal',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Definition', name: 'Exchangeability',
      statement: String.raw`Treatment is **exchangeable** (marginally) if the potential outcomes are independent of the treatment actually received, $Y^{a}\perp\!\!\!\perp A$ for each $a$, so that $E[Y^a\mid A=a']=E[Y^a]$ for all $a,a'$: the treated and the untreated would have had the same outcomes under either treatment, and each group can stand in for the other's missing potential outcome. It is **conditionally exchangeable** given covariates $L$ if $Y^{a}\perp\!\!\!\perp A\mid L$. Under exchangeability the groups differ only in the treatment received. It is not implied by the data, because it involves the unobserved $Y^{0}$ of the treated and $Y^{1}$ of the untreated.`,
      idea: String.raw`The assumption says the selection bias term of item 1.6 is zero in both arms, $E[Y^0\mid A=1]=E[Y^0\mid A=0]$ and the same for $Y^1$. A coin flip makes it hold by construction, since the coin knows nothing about the potential outcomes; with self-selection it holds at best within strata of the variables that drive the choice, which is the idea behind adjustment (items 1.9, 2.6). The name comes from de Finetti's exchangeability applied to the treated and untreated groups; the counterfactual use is due to Greenland and Robins (1986).`,
      caption: String.raw`1,000 simulated patients, each with both outcomes. The two upper panels compare the distribution of the **hidden** $Y^0$ and $Y^1$ in the treated (orange) and untreated (teal): with **coin flip** they coincide, with **self-selection** (sicker patients seek treatment) the treated would have fared worse under either treatment. The lower panel repeats the study 300 times: the difference in observed means is centred on the true effect only when the groups are exchangeable. Choose **within one severity stratum** to see conditional exchangeability restore the match. Simulated, illustrative.`,
      deps: ["causal-1.1","stat-2.1","prob-2.1.1a"], refs: ['Hernán–Robins §3.2', 'Hernán–Robins §2.1'], tags: ['exchangeability', 'randomization', 'ignorability'],
      credit: 'Greenland & Robins, 1986',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ignorability' },
      viz(v) {
        const N = 1000, P = makePop(N, 3, { tau: 5, het: 4, sx: 8, sd: 5 });
        const xs = Float64Array.from(P.x).sort(), qs = [xs[0] - 1, xs[250], xs[500], xs[750], xs[N - 1] + 1];
        let seed = 1;
        const mech = v.select('treatment is assigned by', [{ value: 'rand', label: 'coin flip (randomized)' }, { value: 'self', label: 'self-selection: sicker seek treatment' }], 'self');
        const kS = v.slider('strength of self-selection', 0.2, 2.5, 1.2, { step: 0.1 });
        const scope = v.select('compare', [{ value: 'all', label: 'everyone' }, { value: 'strat', label: 'within one severity stratum' }], 'all');
        const stS = v.slider('severity stratum (1 = mildest quarter)', 1, 4, 3, { int: true });
        v.button('draw a new assignment', () => { seed++; });
        const LO = 10, HI = 110, NB = 25;
        const sA = v.stage({ x: [LO, HI], y: [0, 0.2], axes: 'box', gutter: true, height: 270, xlabel: 'outcome if untreated, $Y^0$ (hidden)', ylabel: 'share of group', title: 'does $Y^0$ look alike in both groups?', weight: 1 });
        const sB = v.stage({ x: [LO, HI], y: [0, 0.2], axes: 'box', gutter: true, height: 270, xlabel: 'outcome if treated, $Y^1$ (hidden)', ylabel: 'share of group', title: 'does $Y^1$ look alike in both groups?', weight: 1 });
        const sC = v.stage({ x: [-20, 20], y: [0, 40], axes: 'box', gutter: true, height: 250, full: true, xlabel: 'difference in observed means', ylabel: 'studies', title: '300 repeated studies' });
        v.legend([['orange', 'treated'], ['teal', 'untreated'], ['green', 'true average effect'], ['ink', 'mean of the 300 estimates', { dash: true }]]);
        const get = memo();
        const inScope = () => { const g = scope.value === 'strat' ? stS.value - 1 : -1; const out = []; for (let i = 0; i < N; i++) if (g < 0 || (P.x[i] >= qs[g] && P.x[i] < qs[g + 1])) out.push(i); return out; };
        const assign = (sd) => (mech.value === 'rand' ? completeAssign(N, N / 2, sd) : selectAssign(P, sd, kS.value, 0, 0));
        const calc = () => get([mech.value, kS.value, scope.value, stS.value, seed].join('|'), () => {
          const S = inScope(), A = assign(seed), y = observed(P, A);
          const t = [], u = [], t1 = [], u1 = [];
          for (const i of S) { (A[i] ? t : u).push(P.y0[i]); (A[i] ? t1 : u1).push(P.y1[i]); }
          const truth = mean(P.t, S);
          const diff = (A2) => { const y2 = observed(P, A2); let a = 0, na = 0, b = 0, nb = 0; for (const i of S) { if (A2[i]) { a += y2[i]; na++; } else { b += y2[i]; nb++; } } return na && nb ? a / na - b / nb : NaN; };
          const reps = []; for (let r = 0; r < 300; r++) { const d = diff(assign(1000 + r)); if (Number.isFinite(d)) reps.push(d); }
          return { S, A, t, u, t1, u1, truth, est: diff(A), reps, ks0: ksGap(t, u), ks1: ksGap(t1, u1), m0t: mean(t), m0u: mean(u), m1t: mean(t1), m1u: mean(u1) };
        });
        v.render(() => {
          kS.el.hidden = mech.value === 'rand'; stS.el.hidden = scope.value !== 'strat';
          const C = calc();
          const h0t = binDensity(C.t, LO, HI, NB), h0u = binDensity(C.u, LO, HI, NB), h1t = binDensity(C.t1, LO, HI, NB), h1u = binDensity(C.u1, LO, HI, NB);
          const ym = Math.max(0.1, ...h0t.counts, ...h0u.counts, ...h1t.counts, ...h1u.counts) * 1.2;
          for (const [st, a, b, ma, mb] of [[sA, h0t, h0u, C.m0t, C.m0u], [sB, h1t, h1u, C.m1t, C.m1u]]) {
            st.setView([LO, HI], [0, ym]);
            barsH(st, a, { color: 'orange', fillAlpha: 0.3 }); barsH(st, b, { color: 'teal', fillAlpha: 0.0, width: 2, dash: [5, 3] });
            st.vline(ma, { color: 'orange', width: 2 }); st.vline(mb, { color: 'teal', width: 2, dash: [5, 3] });
          }
          lab(sA, `KS gap ${fx(C.ks0, 2)}`, HI - 2, ym * 0.93, { align: 'right', color: C.ks0 > 0.12 ? 'red' : 'green' });
          lab(sB, `KS gap ${fx(C.ks1, 2)}`, HI - 2, ym * 0.93, { align: 'right', color: C.ks1 > 0.12 ? 'red' : 'green' });
          const lo = Math.floor(Math.min(C.truth, ...C.reps) - 3), hi = Math.ceil(Math.max(C.truth, ...C.reps) + 3), hr = binCounts(C.reps, lo, hi, 50); sC.setView([lo, hi], [0, Math.max(8, ...hr.counts) * 1.2]);
          barsH(sC, hr, { color: 'purple', fillAlpha: 0.3 });
          sC.vline(C.truth, { color: 'green', width: 2.4 }); sC.vline(mean(C.reps), { color: 'ink', width: 1.6, dash: [5, 3] });
          sC.dot(C.est, 0, { r: 5, color: 'gold' });
        });
        v.readout(() => {
          const C = calc();
          return `Mean $Y^0$: treated $${fx(C.m0t, 1)}$ vs untreated $${fx(C.m0u, 1)}$; mean $Y^1$: $${fx(C.m1t, 1)}$ vs $${fx(C.m1u, 1)}$ (Kolmogorov gaps ${fx(C.ks0, 2)}, ${fx(C.ks1, 2)}; about 0.06 is typical chance). ` +
            `True effect **$${fx(C.truth, 2)}$**; over 300 studies the observed difference averages **$${fx(mean(C.reps), 2)}$** (this study: $${fx(C.est, 2)}$). ` +
            (Math.abs(mean(C.reps) - C.truth) < 0.5 ? 'Exchangeable: the observed contrast is unbiased.' : 'Not exchangeable: the contrast is biased, and no sample size repairs that.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Definition', name: 'Positivity',
      statement: String.raw`**Positivity** (overlap): every kind of unit has a chance of receiving each treatment value of interest. In terms of covariates $L$: $P(A=a\mid L=l)>0$ for every $a$ and every $l$ with $P(L=l)>0$. If it fails in a stratum, that stratum contains only treated or only untreated units, so its outcome under the missing treatment is never observed and no comparison of treated with untreated is possible there: any estimate for that stratum is an extrapolation from a model, not a feature of the data. Violations may be **structural** (nobody of that kind can be treated) or **random** (by chance, in a finite sample).`,
      idea: String.raw`Under conditional exchangeability the stratum-specific effect is $E[Y\mid A=1,L=l]-E[Y\mid A=0,L=l]$, which requires both conditional means to exist: positivity is what makes these conditional expectations defined. Where propensities approach 0 or 1 the estimates become imprecise too (extreme weights, item 5.5). Positivity is checkable from the data on measured $L$, unlike exchangeability.`,
      caption: String.raw`500 simulated patients with a covariate $x$ (say, age); the **steepness** of the treatment rule is set by the slider. Top: the probability of treatment, with each patient as a dot on the rug. Red bands are $x$-ranges where one arm is (nearly) empty. Bottom: observed outcomes with the truth (dashed curves, which bend) and a straight-line outcome model fitted to each arm (solid), extended across the red band: the model's average effect over everyone is off, while the comparison restricted to the overlap is sound but answers a smaller question.`,
      deps: ['causal-1.7'], refs: ['Hernán–Robins §3.3'], tags: ['positivity', 'overlap', 'extrapolation'],
      credit: 'Rosenbaum & Rubin, 1983 (strong ignorability)',
      viz(v) {
        const N = 500, r = rng(5), xs = new Float64Array(N), e0 = new Float64Array(N), e1 = new Float64Array(N);
        for (let i = 0; i < N; i++) { xs[i] = clamp(r.normal(), -2.99, 2.99); e0[i] = 4 * r.normal(); e1[i] = 4 * r.normal(); }
        const f0 = (x) => 55 + 5 * x - 3 * x * x, f1 = (x) => f0(x) + 4 + 2 * x;
        const y0 = Array.from(xs, (x, i) => f0(x) + e0[i]), y1 = Array.from(xs, (x, i) => f1(x) + e1[i]);
        const kS = v.slider('steepness of the treatment rule', 0, 9, 4.5, { step: 0.1 });
        const cS = v.slider('where the rule switches on', -1, 1, 0.5, { step: 0.05 });
        v.button('new random treatments', () => { seed++; });
        let seed = 1;
        const sA = v.stage({ x: [-3, 3], y: [0, 1], axes: 'box', gutter: true, height: 230, full: true, xlabel: null, ylabel: '$P(A=1\\mid x)$', title: 'probability of treatment, and the patients' });
        const sB = v.stage({ x: [-3, 3], y: [10, 90], axes: 'box', gutter: true, height: 330, full: true, xlabel: 'covariate $x$', ylabel: 'outcome', title: 'observed outcomes, truth and a straight-line model' });
        const get = memo(), BW = 0.25, NBIN = 24;
        const calc = () => get([kS.value, cS.value, seed].join('|'), () => {
          const rr = rng(seed * 313 + 9), A = Array.from(xs, (x) => (rr() < logistic(kS.value * (x - cS.value)) ? 1 : 0));
          const n1 = new Array(NBIN).fill(0), n0 = new Array(NBIN).fill(0), s1 = new Array(NBIN).fill(0), s0 = new Array(NBIN).fill(0), tau = new Array(NBIN).fill(0), cnt = new Array(NBIN).fill(0);
          for (let i = 0; i < N; i++) { const b = Math.min(NBIN - 1, Math.floor((xs[i] + 3) / BW)); cnt[b]++; tau[b] += y1[i] - y0[i]; if (A[i]) { n1[b]++; s1[b] += y1[i]; } else { n0[b]++; s0[b] += y0[i]; } }
          const bad = cnt.map((c, b) => c > 0 && (n1[b] < 3 || n0[b] < 3));
          const tx = [], ty = [], ux = [], uy = []; for (let i = 0; i < N; i++) { if (A[i]) { tx.push(xs[i]); ty.push(y1[i]); } else { ux.push(xs[i]); uy.push(y0[i]); } }
          const L1 = ols(tx, ty), L0 = ols(ux, uy);
          const extrap = mean(Array.from(xs, (x) => L1.a + L1.b * x - (L0.a + L0.b * x)));
          let num = 0, den = 0, tnum = 0; for (let b = 0; b < NBIN; b++) if (cnt[b] > 0 && !bad[b]) { num += cnt[b] * (s1[b] / n1[b] - s0[b] / n0[b]); tnum += tau[b]; den += cnt[b]; }
          return { A, bad, L1, L0, extrap, ate: mean(y1.map((q, i) => q - y0[i])), overlap: den ? num / den : NaN, overlapTruth: den ? tnum / den : NaN, share: den / N };
        });
        v.legend([['accent', 'treated: $Y^1$ seen', { dot: true }], ['orange', 'untreated: $Y^0$ seen', { dot: true }], ['red', 'one arm missing']]);
        v.render(() => {
          const C = calc();
          for (let b = 0; b < NBIN; b++) if (C.bad[b]) { sA.vband(-3 + b * BW, -3 + (b + 1) * BW, { color: 'red', alpha: 0.14 }); sB.vband(-3 + b * BW, -3 + (b + 1) * BW, { color: 'red', alpha: 0.14 }); }
          sA.fn((x) => logistic(kS.value * (x - cS.value)), { color: 'ink', width: 2.2, domain: [-3, 3] });
          for (let i = 0; i < N; i++) sA.dot(xs[i], C.A[i] ? 0.96 : 0.04, { r: 2.3, color: C.A[i] ? 'accent' : 'orange' });
          sB.fn(f0, { color: 'orange', width: 1.8, dash: [6, 4], domain: [-3, 3] }); sB.fn(f1, { color: 'accent', width: 1.8, dash: [6, 4], domain: [-3, 3] });
          for (let i = 0; i < N; i++) sB.dot(xs[i], C.A[i] ? y1[i] : y0[i], { r: 2.6, color: C.A[i] ? 'accent' : 'orange', alpha: 0.7 });
          sB.fn((x) => C.L1.a + C.L1.b * x, { color: 'accent', width: 2.4, domain: [-3, 3] }); sB.fn((x) => C.L0.a + C.L0.b * x, { color: 'orange', width: 2.4, domain: [-3, 3] });
        });
        v.readout(() => {
          const C = calc(), nb = C.bad.filter(Boolean).length;
          return `${nb ? `**${nb}** of ${NBIN} $x$-bins have fewer than 3 patients in one arm (${pct(1 - C.share, 0)} of patients).` : 'Every bin contains both treated and untreated patients.'} True average effect over all 500: **$${fx(C.ate, 2)}$**. ` +
            `Straight-line outcome model: $${fx(C.extrap, 2)}$ (error $${sg(C.extrap - C.ate, 2)}$). Comparison within the overlap only: $${fx(C.overlap, 2)}$ vs the true effect in those bins $${fx(C.overlapTruth, 2)}$, a correct answer to a narrower question.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Theorem', name: 'Identification by exchangeability, positivity, consistency',
      statement: String.raw`Suppose that, given a discrete covariate $L$, (i) conditional exchangeability $Y^{a}\perp\!\!\!\perp A\mid L$, (ii) positivity $P(A=a\mid L=l)>0$ whenever $P(L=l)>0$, and (iii) consistency $Y=Y^{A}$ hold. Then the average counterfactual outcome is identified from the distribution of the observed data $(L,A,Y)$ by standardization: $$E[Y^{a}]=\sum_{l}E[Y\mid A=a,L=l]\,P(L=l),$$ and the average causal effect is $\sum_l\bigl(E[Y\mid A=1,L=l]-E[Y\mid A=0,L=l]\bigr)P(L=l)$. If any of the three conditions fails, this expression need not equal $E[Y^1-Y^0]$.`,
      idea: String.raw`Condition on $L=l$: $E[Y^a\mid L=l]=E[Y^a\mid A=a,L=l]$ by exchangeability (which needs the event $A=a,L=l$ to have positive probability: positivity), and $=E[Y\mid A=a,L=l]$ by consistency. Averaging over $L$ gives the formula. Each condition is used exactly once, so deleting any one leaves a gap: unmeasured confounding breaks the first equality, an empty stratum makes the conditional mean undefined, and several treatment versions make the observed mean a mixture rather than $E[Y^a]$.`,
      caption: String.raw`A simulated observational study with four severity strata $L$ (effects shrink with $L$). Each panel repeats the study 300 times (1,500 patients each). With all three conditions on, the standardized estimate (blue) is centred on the true effect (green) while the crude contrast (red) is not. **Break** one condition at a time and watch the standardized estimate drift; the table shows the stratum-by-stratum arithmetic for the first study. Simulated, illustrative.`,
      deps: ["causal-1.5","causal-1.7","causal-1.8","prob-4.1.13"], refs: ['Hernán–Robins §3.1'], tags: ['identification', 'standardization'],
      credit: 'Robins, 1986 (g-formula); Rosenbaum & Rubin, 1983',
      viz(v) {
        const PL = [0.35, 0.3, 0.2, 0.15], TAU = [6, 4.5, 3, 1.5], TRUE = PL.reduce((s, p, l) => s + p * TAU[l], 0);
        const tU = v.toggle('hidden common cause $U$ of treatment and outcome (breaks exchangeability)', false);
        const tP = v.toggle('nobody in stratum 4 is ever treated (breaks positivity)', false);
        const tC = v.toggle('half of the treated get a lapsed version (breaks consistency)', false);
        v.button('new studies', () => { seed++; });
        let seed = 1;
        const sH = v.stage({ x: [-4, 14], y: [0, 40], axes: 'box', gutter: true, height: 320, xlabel: 'estimate of the average effect', ylabel: 'studies', title: 'estimates over 300 repeated studies', weight: 1.25 });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'the first study, stratum by stratum', weight: 1.1 });
        const T = v.table(sT, { rows: 4, cols: 6, square: false, cellAspect: 1.3, maxCell: 60, size: 12.5, colLabels: ['share', '% treated', 'mean A=1', 'mean A=0', 'difference', 'truth'], labelSize: 10.5, rowLabels: (l) => 'L = ' + (l + 1) });
        const get = memo(), N = 1500, REP = 300;
        const sim = (sd) => {
          const r = rng(sd * 2654435 + 11), n1 = [0, 0, 0, 0], n0 = [0, 0, 0, 0], s1 = [0, 0, 0, 0], s0 = [0, 0, 0, 0], nl = [0, 0, 0, 0];
          for (let i = 0; i < N; i++) {
            const u = r(); let l = 0; { let c = PL[0]; while (u > c && l < 3) { l++; c += PL[l]; } }
            const U = r() < 0.5 ? 1 : 0, y0 = 20 + 4 * l + (tU.value ? 7 * U : 0) + 4 * r.normal();
            let pa = logistic(-1.4 + 0.9 * l + (tU.value ? (U ? 1.7 : -1.7) : 0)); if (tP.value && l === 3) pa = 0;
            const a = r() < pa ? 1 : 0, ver = tC.value && r() < 0.5 ? 0.3 : 1, y = a ? y0 + TAU[l] * ver + 0 : y0;
            nl[l]++; if (a) { n1[l]++; s1[l] += y; } else { n0[l]++; s0[l] += y; }
          }
          const N1 = n1.reduce((a, b) => a + b), N0 = n0.reduce((a, b) => a + b);
          const naive = s1.reduce((a, b) => a + b) / N1 - s0.reduce((a, b) => a + b) / N0;
          let num = 0, den = 0; for (let l = 0; l < 4; l++) if (n1[l] && n0[l]) { num += nl[l] * (s1[l] / n1[l] - s0[l] / n0[l]); den += nl[l]; }
          return { naive, std: den ? num / den : NaN, n1, n0, s1, s0, nl };
        };
        const calc = () => get([tU.value, tP.value, tC.value, seed].join('|'), () => { const R = []; for (let k = 0; k < REP; k++) R.push(sim(seed * 1000 + k)); return R; });
        v.legend([['red', 'crude contrast'], ['accent', 'standardized over strata'], ['green', 'true effect']]);
        v.render(() => {
          const R = calc(), nv = R.map((q) => q.naive), sv = R.map((q) => q.std);
          const hn = binCounts(nv, -4, 14, 54), hs = binCounts(sv, -4, 14, 54);
          sH.setView([-4, 14], [0, Math.max(10, ...hn.counts, ...hs.counts) * 1.15]);
          barsH(sH, hn, { color: 'red', fillAlpha: 0.22 }); barsH(sH, hs, { color: 'accent', fillAlpha: 0.32 });
          sH.vline(TRUE, { color: 'green', width: 2.4 }); sH.vline(mean(nv), { color: 'red', width: 1.6, dash: [5, 3] }); sH.vline(mean(sv.filter(Number.isFinite)), { color: 'accent', width: 1.6, dash: [5, 3] });
          const q = R[0];
          T.draw({
            value: (l, j) => {
              const has1 = q.n1[l] > 0, has0 = q.n0[l] > 0;
              if (j === 0) return fx(q.nl[l] / N, 2);
              if (j === 1) return fx(q.n1[l] / q.nl[l], 2);
              if (j === 2) return has1 ? fx(q.s1[l] / q.n1[l], 1) : '—';
              if (j === 3) return has0 ? fx(q.s0[l] / q.n0[l], 1) : '—';
              if (j === 4) return has1 && has0 ? sg(q.s1[l] / q.n1[l] - q.s0[l] / q.n0[l], 1) : 'undefined';
              return sg(TAU[l], 1);
            },
            fill: (l, j) => (q.n1[l] === 0 || q.n0[l] === 0 ? ['red', 0.18] : j === 4 ? ['accent', 0.14] : null),
          });
        });
        v.readout(() => {
          const R = calc(), nv = R.map((q) => q.naive), sv = R.map((q) => q.std), ms = mean(sv), sd = sdev(sv);
          const ok = !tU.value && !tP.value && !tC.value;
          return `True average effect $\\sum_l P(l)\\tau_l=${fx(TRUE, 2)}$. Crude contrast averages **$${fx(mean(nv), 2)}$**; standardized estimate averages **$${fx(ms, 2)}$** (SD $${fx(sd, 2)}$), bias $${sg(ms - TRUE, 2)}$. ` +
            (ok ? 'All three conditions hold: the standardized estimate is unbiased.' : `Broken: ${[tU.value && 'exchangeability', tP.value && 'positivity (stratum 4 dropped, so the estimate answers a question about strata 1–3 only)', tC.value && 'consistency (the observed contrast mixes two treatments)'].filter(Boolean).join(', ')}.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Definition', name: 'Effect modification',
      statement: String.raw`A variable $M$ is an **effect modifier** (on a chosen scale) if the average causal effect differs between its levels: $E[Y^1-Y^0\mid M=1]\neq E[Y^1-Y^0\mid M=0]$ on the additive scale, or the corresponding ratio differs on the multiplicative scale. When effects differ by level, the population average effect is the average of the stratum-specific effects weighted by the prevalence of the strata, $\tau=\sum_m P(M=m)\,\tau_m$, so it changes when the mix of the population changes. Whether $M$ is a modifier depends on the scale: with unequal baseline risks, a constant risk ratio entails different risk differences.`,
      idea: String.raw`Stratum effects are averages of individual effects over each level of $M$; the population effect is a mixture of them by the law of total expectation. This is why an effect measured in one population does not automatically carry to another (item 8.8). Modification is not the same as confounding: $M$ may be unrelated to treatment and still change the effect. The scale dependence is arithmetic: $\mathrm{RD}=r_0(\mathrm{RR}-1)$ varies with the baseline risk $r_0$ unless $\mathrm{RR}=1$.`,
      caption: String.raw`Top left: 300 people split by a binary modifier (say, older and younger); each person's own effect colours their icon. Set the two stratum effects with the sliders and **drag the point** on the line to change the share in the second stratum: the population average effect slides between the two. Bottom: the same intervention with a *common risk ratio* has different risk differences in strata with different baseline risks (sliders). Simulated, illustrative.`,
      deps: ["causal-1.3","prob-4.1.13"], refs: ['Hernán–Robins §4.1', 'Hernán–Robins §4.2'], tags: ['effect modification', 'heterogeneity'],
      credit: 'standard; scale dependence: Rothman, 1974',
      viz(v) {
        const t0 = v.slider('effect in stratum A, $\\tau_A$', -4, 14, 2, { step: 0.5 });
        const t1 = v.slider('effect in stratum B, $\\tau_B$', -4, 14, 10, { step: 0.5 });
        const rr = v.slider('common risk ratio', 0.2, 1.6, 0.5, { step: 0.05 });
        const rA = v.slider('baseline risk in A', 0.02, 0.9, 0.4, { step: 0.01 });
        const rB = v.slider('baseline risk in B', 0.02, 0.9, 0.1, { step: 0.01 });
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: '300 people, coloured by their own effect', weight: 1.1 });
        const sL = v.stage({ x: [0, 1], y: [-4, 14], axes: 'box', gutter: true, height: 330, xlabel: 'share in stratum B', ylabel: 'average effect', title: 'the population effect is a mixture', weight: 1 });
        const sR = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 260, full: true, xticks: [[0, 'A untreated'], [1, 'A treated'], [2.9, 'B untreated'], [3.9, 'B treated']], ylabel: 'risk of the event', title: 'same risk ratio, different risk difference' });
        const I = v.icons(sI, { n: 300, shape: 'person' });
        const rg = rng(12), eta = Array.from({ length: 300 }, () => rg.normal());
        const h = sL.handle(0.35, 0, { color: 'accent', r: 8, label: 'population', labelPos: 'nw', constrain: (x) => [clamp(x, 0, 1), t0.value + (t1.value - t0.value) * clamp(x, 0, 1)] });
        h.onDrag = () => {};
        v.legend([['green', 'helped by more than 2', { dot: true }], ['muted', 'about the same', { dot: true }], ['red', 'harmed by more than 2', { dot: true }]]);
        v.render(() => {
          const p = clamp(h.x, 0, 1), ate = t0.value + (t1.value - t0.value) * p;
          h.set(p, ate);
          const nB = Math.round(300 * p), tauI = (i) => (i < 300 - nB ? t0.value : t1.value) + 4 * eta[i];
          I.set({ n: 300, shape: 'person', block: (i) => (i < 300 - nB ? 0 : 1), blockLabels: (b, n) => `stratum ${b ? 'B' : 'A'} (${n}): effect ${fx(b ? t1.value : t0.value, 1)}`,
            style: (i) => { const t = tauI(i); return t > 2 ? { color: 'green', label: 'helped' } : t < -2 ? { color: 'red', label: 'harmed' } : { color: 'muted', alpha: 0.6, label: 'about the same' }; } });
          I.draw();
          sL.line(0, t0.value, 1, t1.value, { color: 'accent', width: 2.4 });
          sL.hline(0, { color: 'muted', width: 1, dash: [3, 4] });
          lab(sL, `$\\tau_A=${fx(t0.value, 1)}$`, 0.02, t0.value, { align: 'left', dy: -14, color: 'accent', size: 11 }); lab(sL, `$\\tau_B=${fx(t1.value, 1)}$`, 0.98, t1.value, { align: 'right', dy: 14, color: 'accent', size: 11 });
          const rows = [[0, rA.value], [2.9, rB.value]];
          rows.forEach(([x0, r0], k) => {
            const r1 = Math.min(0.98, rr.value * r0);
            sR.rect(x0 - 0.35, 0, x0 + 0.35, r0, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.5 });
            sR.rect(x0 + 0.65, 0, x0 + 1.35, r1, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.5 });
            lab(sR, `RD ${sg((r1 - r0) * 100, 0)} pp   RR ${fx(r1 / r0, 2)}`, x0 + 0.5, Math.max(r0, r1) + 0.08, { align: 'center', color: 'ink', size: 11.5 });
          });
        });
        v.readout(() => {
          const p = clamp(h.x, 0, 1), ate = t0.value + (t1.value - t0.value) * p, r0a = rA.value, r0b = rB.value;
          const rda = (Math.min(0.98, rr.value * r0a) - r0a), rdb = (Math.min(0.98, rr.value * r0b) - r0b);
          return `Share in B **${pct(p, 0)}**: population effect $(1-p)\\tau_A+p\\tau_B=\\mathbf{${fx(ate, 2)}}$. ` + (Math.abs(t1.value - t0.value) < 0.01 ? 'No modification on this scale.' : `Moving the share to 0 gives $${fx(t0.value, 1)}$, to 1 gives $${fx(t1.value, 1)}$.`) +
            `\nWith risk ratio ${fx(rr.value, 2)} in both strata the risk differences are $${sg(rda * 100, 1)}$ and $${sg(rdb * 100, 1)}$ points: ${Math.abs(rr.value - 1) > 0.01 && Math.abs(r0a - r0b) > 0.01 ? 'modification on the difference scale but none on the ratio scale.' : 'no modification on either scale.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Phenomenon', name: 'Noncollapsibility of the odds ratio',
      statement: String.raw`A measure of association is **collapsible** if the marginal measure equals a weighted average of the stratum-specific measures. In a randomized trial let $L$ be a binary prognostic factor independent of the treatment $A$, and let the outcome follow a logistic model $\operatorname{logit}P(Y=1\mid A,L)=\beta_0+\beta_AA+\beta_LL$ with no interaction. The conditional odds ratio $e^{\beta_A}$ is the same in both strata, yet the **marginal** odds ratio is strictly closer to 1 whenever $\beta_A\ne0$ and $\beta_L\ne0$, although there is no confounding. The risk difference is collapsible (the marginal difference is exactly the prevalence-weighted average of the stratum differences); the odds ratio, and in general the risk ratio, are not.`,
      idea: String.raw`The marginal risks are averages of logistic functions, $P(Y{=}1\mid A{=}a)=\sum_l P(l)\,\mathrm{expit}(\beta_0+\beta_Aa+\beta_Ll)$, and a mixture of two logistic curves is not a logistic curve with the same shift. Averaging probabilities flattens the curve, which compresses the odds ratio towards 1; the stronger the prognostic factor the more compression. So a marginal and a conditional odds ratio are different estimands even without confounding, and neither is the average of unit-level odds ratios (Greenland, Robins and Pearl 1999 separate this from confounding).`,
      caption: String.raw`A randomized treatment with a **conditional odds ratio** that is the same in both strata (slider), and a binary prognostic factor independent of treatment. The table lists the exact stratum and marginal risks. The last row averages the stratum rows: the risk *difference* agrees with the marginal row, the odds ratio does not. The curve shows the marginal odds ratio falling away from the conditional one as the factor gets stronger; the readout checks the formula against a simulated trial of 60,000 patients.`,
      deps: ["causal-1.4","causal-1.10","prob-4.1.18"], refs: ['Hernán–Robins §4.6', 'Pearl §6.5'], tags: ['collapsibility', 'odds ratio'],
      credit: 'Greenland, Robins & Pearl, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Collapsibility' },
      viz(v) {
        const orA = v.slider('conditional odds ratio of treatment', 1, 10, 3, { log: true, sig: 2 });
        const orL = v.slider('odds ratio of the prognostic factor $L$ for the outcome', 1, 40, 8, { log: true, sig: 2 });
        const pL = v.slider('prevalence of $L$', 0.05, 0.95, 0.5, { step: 0.05 });
        const b0 = v.slider('baseline log-odds (untreated, $L=0$)', -4, 0, -2, { step: 0.1 });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, title: 'exact risks from the model', weight: 1.35 });
        const sC = v.stage({ x: [1, 40], y: [1, 10], xlog: true, axes: 'box', gutter: true, height: 260, xlabel: 'odds ratio of $L$ (prognostic strength)', ylabel: 'odds ratio of treatment', title: 'conditional vs marginal odds ratio', weight: 1 });
        const T = v.table(sT, { rows: 4, cols: 5, square: false, cellAspect: 1.55, maxCell: 62, size: 13, colLabels: ['risk A=0', 'risk A=1', 'RD', 'RR', 'OR'], labelSize: 10.5, rowLabels: ['stratum L = 0', 'stratum L = 1', 'whole population', 'average of strata'] });
        const odds = (p) => p / (1 - p);
        const model = (oa, ol, pl, bb) => {
          const pr = (a, l) => logistic(bb + Math.log(oa) * a + Math.log(ol) * l);
          const st = [0, 1].map((l) => ({ r0: pr(0, l), r1: pr(1, l) })), w = [1 - pl, pl];
          const m0 = w[0] * st[0].r0 + w[1] * st[1].r0, m1 = w[0] * st[0].r1 + w[1] * st[1].r1;
          return { st, w, m0, m1, pop: { r0: m0, r1: m1 } };
        };
        v.legend([['accent', 'conditional OR (same in both strata)'], ['red', 'marginal OR'], ['gold', 'now', { dot: true }]]);
        v.render(() => {
          const M = model(orA.value, orL.value, pL.value, b0.value);
          const rows = [M.st[0], M.st[1], M.pop];
          const meas = (q) => [q.r1 - q.r0, q.r1 / q.r0, odds(q.r1) / odds(q.r0)];
          const avg = [0, 1, 2].map((j) => M.w[0] * meas(M.st[0])[j] + M.w[1] * meas(M.st[1])[j]);
          T.draw({
            value: (i, j) => (i < 3 ? (j === 0 ? fx(rows[i].r0, 3) : j === 1 ? fx(rows[i].r1, 3) : fx(meas(rows[i])[j - 2], j === 2 ? 3 : 2)) : j < 2 ? '' : fx(avg[j - 2], j === 2 ? 3 : 2)),
            fill: (i, j) => (j === 2 && i >= 2 ? ['green', 0.2] : j === 4 && i === 2 ? ['red', 0.22] : j === 4 && i < 2 ? ['accent', 0.2] : null),
          });
          sC.setView([1, 40], [1, Math.max(2, orA.value * 1.2)]);
          sC.fn((x) => orA.value, { color: 'accent', width: 2.4, domain: [1, 40] });
          sC.curve((t) => { const x = Math.exp(t); const q = model(orA.value, x, pL.value, b0.value).pop; return [x, odds(q.r1) / odds(q.r0)]; }, 0, Math.log(40), { color: 'red', width: 2.4, n: 120 });
          const q = M.pop; sC.dot(orL.value, odds(q.r1) / odds(q.r0), { r: 6.5, color: 'gold' });
        });
        v.readout(() => {
          const M = model(orA.value, orL.value, pL.value, b0.value), q = M.pop, mo = odds(q.r1) / odds(q.r0);
          const rn = rng(99); let y1 = 0, y0 = 0, n1 = 0, n0 = 0;
          for (let i = 0; i < 60000; i++) { const l = rn() < pL.value ? 1 : 0, a = rn() < 0.5 ? 1 : 0, y = rn() < (a ? M.st[l].r1 : M.st[l].r0) ? 1 : 0; if (a) { n1++; y1 += y; } else { n0++; y0 += y; } }
          const so = odds(y1 / n1) / odds(y0 / n0);
          return `Conditional OR **${fx(orA.value, 2)}** in each stratum, marginal OR **${fx(mo, 2)}** (simulated trial: ${fx(so, 2)}). Risk difference: marginal $${fx(q.r1 - q.r0, 4)}$ = weighted average of the strata $${fx(M.w[0] * (M.st[0].r1 - M.st[0].r0) + M.w[1] * (M.st[1].r1 - M.st[1].r0), 4)}$ (equal); odds ratio: marginal $${fx(mo, 2)}$ vs strata $${fx(orA.value, 2)}$. ` + (orL.value < 1.05 || orA.value < 1.02 ? 'With no prognostic factor (or no effect) nothing is lost.' : 'Compression towards 1, with no confounding at all.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12', kind: 'Paper', name: 'Estimating causal effects of treatments',
      paper: { authors: 'Donald B. Rubin', year: 1974, title: 'Estimating causal effects of treatments in randomized and nonrandomized studies', venue: 'Journal of Educational Psychology 66 (5): 688–701', doi: '10.1037/h0037350' },
      introduces: ['causal-1.3'],
      statement: String.raw`Rubin (1974) defines the causal effect of one treatment relative to another for a single unit as the comparison of the outcome the unit would show under each, observed at a given time and place, and the average effect over a population of units. Since each unit is exposed to one treatment only, an estimate of the average effect must rest on the units given each treatment standing in for each other. The paper compares the ways of controlling extraneous variation (randomization, random sampling, matching) for this purpose, and concludes, in the words of its abstract, that randomized designs are to be preferred whenever possible, while the careful analysis of carefully controlled nonrandomized data is a reasonable and often necessary way to estimate causal effects. Here the argument is simulated, not the paper's data: random assignment makes the naive contrast unbiased, assignment that depends on a covariate tied to the outcome biases it, and matching on that covariate removes the bias when the covariate is all there is to it.`,
      idea: String.raw`Before 1974 the formal treatment of causal effects as comparisons of potential outcomes lived mostly in randomized-experiment theory (Neyman 1923 for agricultural plots; Fisher's randomization); Rubin's paper carried the same definition into nonrandomized studies and made the assignment mechanism the object that decides whether a comparison is causal. It introduces no data set for a numerical comparison, so the picture below uses a simulated population in the spirit of its education examples, labelled as such. It says what must hold for matched comparisons to estimate the effect: the matching variable must capture the way units were assigned, a condition the later literature calls ignorability.`,
      caption: String.raw`A simulated population of 60 students with a pre-test score $x$ (illustrative numbers, **not** from the paper). Left: nine of them with both potential outcomes (the cell that is not observed is greyed); middle: pre-test against outcome, with the hidden outcomes optional; the lines connect each treated student to the untreated student with the closest pre-test. Right: 400 re-assignments of the same 60 students. With **assignment depends on pre-test**, the crude contrast (purple) is off by a wide margin while the matched one (green) is centred on the effect again; with **random assignment** both are fine.`,
      deps: ['causal-1.1', 'causal-1.6', 'causal-1.7'], refs: [], tags: ['history', 'matching', 'randomization'],
      credit: 'Rubin, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rubin_causal_model' },
      viz(v) {
        const N = 60, P = makePop(N, 17, { tau: 5, het: 2, sx: -8, sd: 3, base: 50 });
        let seed = 1;
        const mech = v.select('students are assigned', [{ value: 'rand', label: 'at random' }, { value: 'x', label: 'depends on pre-test' }], 'x');
        const kS = v.slider('strength of the dependence on pre-test', 0.5, 3, 1.6, { step: 0.1 });
        const show = v.toggle('show hidden outcomes', false);
        const lines = v.toggle('draw the matches', true);
        v.button('new assignment', () => { seed++; });
        const ate = mean(P.t);
        const assign = (sd) => (mech.value === 'rand' ? completeAssign(N, N / 2, sd) : selectAssign(P, sd, kS.value, 0, 0));
        const match = (A) => {
          const ctr = []; for (let i = 0; i < N; i++) if (!A[i]) ctr.push(i);
          const pairs = []; for (let i = 0; i < N; i++) if (A[i]) { let b = -1, bd = 1e9; for (const j of ctr) { const d = Math.abs(P.x[i] - P.x[j]); if (d < bd) { bd = d; b = j; } } if (b >= 0) pairs.push([i, b]); }
          return pairs;
        };
        const est = (A) => {
          const y = observed(P, A), a = arms(P, A, y), pr = match(A);
          return { naive: a.naive, matched: pr.length ? mean(pr.map(([i, j]) => y[i] - y[j])) : NaN, pairs: pr, a };
        };
        const get = memo();
        const calc = () => get([mech.value, kS.value, seed].join('|'), () => {
          const A = assign(seed), cur = est(A), R = [];
          for (let k = 0; k < 400; k++) { const e = est(assign(500 + k)); if (Number.isFinite(e.naive) && Number.isFinite(e.matched)) R.push(e); }
          return { A, cur, R };
        });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'potential outcomes (units 1–9)', weight: 1.1 });
        const sS = v.stage({ x: [-2.6, 2.6], y: [10, 90], axes: 'box', gutter: true, height: 330, xlabel: 'pre-test score $x$ (standardized)', ylabel: 'outcome', title: 'one study', weight: 1.15 });
        const sH = v.stage({ x: [-8, 14], y: [0, 40], axes: 'box', gutter: true, height: 330, xlabel: 'estimate of the average effect', ylabel: 're-assignments', title: '400 re-assignments', weight: 1.1 });
        const T = v.table(sT, { rows: 9, cols: 5, square: false, cellAspect: 1.2, maxCell: 52, size: 12, colLabels: ['$x$', '$Y(0)$', '$Y(1)$', '$A$', '$Y$'], rowLabels: (i) => '#' + (i + 1) });
        v.legend([['accent', 'treated', { dot: true }], ['orange', 'untreated', { dot: true }], ['purple', 'crude contrast'], ['green', 'matched on $x$'], ['ink', 'true average effect']]);
        v.render(() => {
          kS.el.hidden = mech.value === 'rand';
          const C = calc(), A = C.A, y = observed(P, A);
          T.draw({
            value: (i, j) => (j === 0 ? fx(P.x[i], 1) : j === 1 ? (A[i] && !show.value ? '?' : fx(P.y0[i], 0)) : j === 2 ? (!A[i] && !show.value ? '?' : fx(P.y1[i], 0)) : j === 3 ? String(A[i]) : fx(y[i], 0)),
            fill: (i, j) => ((j === 1 && A[i] && !show.value) || (j === 2 && !A[i] && !show.value) ? ['muted', 0.28] : j === 4 ? ['green', 0.16] : null),
            textColor: (i, j) => ((j === 1 && A[i]) || (j === 2 && !A[i]) ? 'muted' : 'ink'),
          });
          if (lines.value) for (const [i, j] of C.cur.pairs) sS.segment([P.x[i], y[i]], [P.x[j], y[j]], { color: 'green', width: 1.1, alpha: 0.55 });
          for (let i = 0; i < N; i++) {
            if (show.value) { sS.dot(P.x[i], A[i] ? P.y0[i] : P.y1[i], { r: 3.5, hollow: true, color: A[i] ? 'orange' : 'accent', alpha: 0.7 }); sS.line(P.x[i], P.y0[i], P.x[i], P.y1[i], { color: 'faint', width: 1, alpha: 0.6 }); }
            sS.dot(P.x[i], y[i], { r: 4.5, color: A[i] ? 'accent' : 'orange' });
          }
          const all = C.R.flatMap((e) => [e.naive, e.matched]), lo = Math.floor(Math.min(ate, ...all) - 2), hi = Math.ceil(Math.max(ate, ...all) + 2);
          const hn = binCounts(C.R.map((e) => e.naive), lo, hi, 44), hm = binCounts(C.R.map((e) => e.matched), lo, hi, 44);
          sH.setView([lo, hi], [0, Math.max(10, ...hn.counts, ...hm.counts) * 1.15]);
          barsH(sH, hn, { color: 'purple', fillAlpha: 0.28 }); barsH(sH, hm, { color: 'green', fillAlpha: 0.3 });
          sH.vline(ate, { color: 'ink', width: 2.2 });
        });
        v.readout(() => {
          const C = calc(), nm = mean(C.R.map((e) => e.naive)), mm = mean(C.R.map((e) => e.matched));
          return `True average effect over the 60 students **$${fx(ate, 2)}$**. This study: crude $${fx(C.cur.naive, 2)}$, matched $${fx(C.cur.matched, 2)}$ (${C.cur.pairs.length} treated students matched to their nearest untreated one). Over 400 re-assignments: crude averages **$${fx(nm, 2)}$** (bias $${sg(nm - ate, 2)}$), matched **$${fx(mm, 2)}$** (bias $${sg(mm - ate, 2)}$). ` +
            (mech.value === 'rand' ? 'Random assignment: no extraneous variable to control, both are unbiased.' : 'Matching on the variable that drove assignment removes most of the bias; what remains comes from imperfect matches where few untreated students have a high pre-test, and matching on a variable that did not drive assignment would not help.');
        });
      },
    },
  ],
};
