// Epidemiology — Chapter 9, landmark paper: Cox (1972).
//
// Data (verified):
// - Cox (1972), JRSS B 34: 187–220, scan at stat.cmu.edu/~ryantibs/journalclub/cox_1972.pdf. Table 1: times of remission
//   (weeks) of 42 leukaemia patients (Gehan 1965, from Freireich et al.), 21 on 6-MP (12 censored) and 21 controls;
//   read from the page image. Printed results (§10): U(0) = 10.25 with standard error 2.50; β̂ = 1.65, e^β̂ = 5.21,
//   95% limits (0.78, 2.60) from the log likelihood; likelihood-ratio difference 7.43; with a time-varying term
//   β + γ(t − 10), extra log likelihood about 0.01 and γ between −0.12 and 0.14.
// - Recomputed here: U(0) = 10.25 and √I(0) = 2.50 exactly. The partial likelihood with Cox's discrete (exact) treatment
//   of ties gives β̂ = 1.63 (0.82, 2.54), LR 8.13, close to but not identical with the printed 1.65 / 7.43; the later
//   Breslow and Efron approximations give 1.51 and 1.57 (the values modern software reports).

const MP6 = '6* 6 6 6 7 9* 10* 10 11* 13 16 17* 19* 20* 22 23 25* 32* 32* 34* 35*';
const CTRL = '1 1 2 2 3 4 4 5 5 8 8 8 8 11 11 12 12 15 17 22 23';
const parseG = (s, z) => s.split(' ').map((x) => ({ t: parseFloat(x), d: x.endsWith('*') ? 0 : 1, z }));
const GEHAN = [...parseG(MP6, 0), ...parseG(CTRL, 1)];
const binom = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };

/** Log partial likelihood for a binary covariate, time-varying effect β + γ(t − 10); ties: 'exact' | 'breslow' | 'efron'. */
function logPL(D, b, g, ties) {
  const times = [...new Set(D.filter((x) => x.d).map((x) => x.t))].sort((a, c) => a - c);
  let L = 0;
  for (const t of times) {
    const bt = b + g * (t - 10);
    let n1 = 0, n0 = 0, d = 0, s = 0;
    for (const x of D) { if (x.t >= t) { if (x.z) n1++; else n0++; } if (x.t === t && x.d) { d++; s += x.z; } }
    if (ties === 'exact') { let den = 0; for (let j = 0; j <= d; j++) den += binom(n1, j) * binom(n0, d - j) * Math.exp(bt * j); L += bt * s - Math.log(den); }
    else if (ties === 'breslow') L += bt * s - d * Math.log(n1 * Math.exp(bt) + n0);
    else { const S = n1 * Math.exp(bt) + n0, SF = s * Math.exp(bt) + (d - s); for (let k = 0; k < d; k++) L -= Math.log(S - (k / d) * SF); L += bt * s; }
  }
  return L;
}
function kaplanMeier(D, z) {
  const g = D.filter((x) => x.z === z), times = [...new Set(g.filter((x) => x.d).map((x) => x.t))].sort((a, c) => a - c);
  let S = 1; const pts = [[0, 1]];
  for (const t of times) { const n = g.filter((x) => x.t >= t).length, d = g.filter((x) => x.t === t && x.d).length; pts.push([t, S]); S *= 1 - d / n; pts.push([t, S]); }
  return pts;
}
/** Breslow baseline cumulative hazard (z = 0) for a given β; returns step points [t, H0]. */
function baseline(D, b) {
  const times = [...new Set(D.filter((x) => x.d).map((x) => x.t))].sort((a, c) => a - c);
  let H = 0; const pts = [[0, 0]];
  for (const t of times) { let den = 0, d = 0; for (const x of D) { if (x.t >= t) den += Math.exp(b * x.z); if (x.t === t && x.d) d++; } H += d / den; pts.push([t, H]); }
  return pts;
}
function argmax1(f, a, c) { const gr = 0.618; for (let i = 0; i < 70; i++) { const x1 = c - gr * (c - a), x2 = a + gr * (c - a); if (f(x1) > f(x2)) c = x2; else a = x1; } return (a + c) / 2; }
/** Simulated trial with crossing hazards (Weibull shapes 0.6 vs 2.2), same median: proportional hazards fails. */
function crossing(r) {
  const out = [];
  for (let i = 0; i < 60; i++) for (const [z, k] of [[0, 0.6], [1, 2.2]]) { const t = 10 * (-Math.log(1 - r())) ** (1 / k) / Math.log(2) ** (1 / k), c = 4 + 26 * r(); out.push({ t: Math.round(Math.min(t, c) * 10) / 10 + 0.01, d: t <= c ? 1 : 0, z }); }
  return out;
}

export default {
  collection: 'epi',
  chapter: 9,
  items: [
    {
      num: '9.11',
      kind: 'Paper',
      name: 'Regression Models and Life-Tables',
      paper: { authors: 'D. R. Cox', year: 1972, title: 'Regression Models and Life-Tables', venue: 'Journal of the Royal Statistical Society, Series B 34 (2): 187–202', doi: '10.1111/j.2517-6161.1972.tb00899.x' },
      introduces: ['epi-9.5'],
      statement: String.raw`Model the hazard of an individual with covariates $z$ as an arbitrary baseline hazard multiplied by a log-linear factor,
$$\lambda(t; z) = \lambda_0(t)\, e^{\beta^\top z},$$
so that hazards of different individuals stay **proportional** over time. The regression coefficients can be estimated without specifying $\lambda_0$ at all, by maximising the product over failure times of the conditional probability that the individual who failed was the one who did, given the risk set:
$$L(\beta) = \prod_{\text{failures } i} \frac{e^{\beta^\top z_i}}{\sum_{j \in R(t_i)} e^{\beta^\top z_j}},$$
later called the **partial likelihood**, which behaves like an ordinary likelihood for inference. Censored observations enter only through the risk sets. For the leukaemia trial in the paper, controls relapse at about $e^{1.65} \approx 5$ times the rate of patients on 6-MP.

Scope: proportional hazards is an assumption to be checked (e.g. a time-varying term $\beta + \gamma t$, or parallel $\log(-\log S)$ curves); censoring must be uninformative.`,
      idea: String.raw`Survival data had been analysed with life tables and the Kaplan–Meier estimator (epi-9.1, epi-9.3), which describe groups but cannot adjust for several covariates, or with fully parametric models (exponential, Weibull) whose baseline assumptions were rarely credible. Cox's insight was to let the baseline hazard be completely arbitrary and to note that, at each failure time, the information about $\beta$ is in *which* member of the risk set failed, not *when*. The resulting conditional likelihood ignores $\lambda_0$, handles censoring naturally, and reduces with one binary covariate to the log-rank test (his score statistic $U(0)$). Its justification (Cox 1975, Andersen & Gill 1982 via counting processes) came later. The proportional hazards model (epi-9.5) became the standard analysis of clinical trials and cohort studies, and the paper is among the most cited in all of science.`,
      caption: String.raw`**Left**: Kaplan–Meier curves of the paper's 42 leukaemia patients (6-MP blue, control red; ticks are censored times) with the survivor curves fitted under proportional hazards for your $\beta$ (dashed): $S_1 = S_0^{e^\beta}$. Switch to **log(−log S)** against log time: proportional hazards means parallel curves, a vertical gap of exactly $\beta$. **Right**: the log partial likelihood $\ell(\beta)$ for three treatments of tied times; drag $\beta$ or press **fit**, and read the 95% interval where $\ell$ is within 1.92 of its maximum. Pick **crossing hazards** (simulated) to break the assumption: the curves cross, the log–log lines are not parallel, and the time-varying term $\gamma$ is far from 0.`,
      deps: ['epi-9.1', 'epi-9.3'],
      refs: [],
      tags: ['survival analysis', 'regression', 'history'],
      credit: 'David R. Cox, 1972',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Proportional_hazards_model' },
      viz(v) {
        const M = v.M;
        const data = v.select('data', [{ value: 'gehan', label: 'Gehan leukaemia trial (Table 1)' }, { value: 'cross', label: 'crossing hazards (simulated)' }], 'gehan', { onChange: () => fit() });
        const scale = v.select('left panel', [{ value: 'S', label: 'survival' }, { value: 'LL', label: 'log(−log S)' }], 'S');
        const ties = v.select('ties', [{ value: 'exact', label: 'exact (Cox)' }, { value: 'breslow', label: 'Breslow' }, { value: 'efron', label: 'Efron' }], 'exact', { onChange: () => fit() });
        const bS = v.slider('$\\beta$ (control vs treatment)', -1, 3.5, 1.6, { step: 0.01 });
        const D = () => (data.value === 'gehan' ? GEHAN : crossing(v.rng(12)));
        let cache = { key: '', dat: null };
        const getD = () => { if (cache.key !== data.value) cache = { key: data.value, dat: D() }; return cache.dat; };
        function fit() { const dd = getD(); bS.set(argmax1((b) => logPL(dd, b, 0, ties.value), -2, 4)); }
        v.button('fit', () => fit());
        const L = v.stage({ x: [0, 36], y: [0, 1.02], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 260, xlabel: 'weeks', ylabel: 'proportion in remission', title: 'survival curves' });
        const R = v.stage({ x: [-1, 3.5], y: [-8, 0.5], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'β', ylabel: 'ℓ(β) − max ℓ', title: 'the partial likelihood' });
        let st = null;
        v.render(() => {
          const dd = getD(), b = bS.value, LLm = scale.value === 'LL';
          const tmax = Math.max(...dd.map((x) => x.t)) * 1.05;
          const km0 = kaplanMeier(dd, 0), km1 = kaplanMeier(dd, 1);
          const H0 = baseline(dd, b);
          const S0 = H0.map(([t, H]) => [t, Math.exp(-H)]), S1 = H0.map(([t, H]) => [t, Math.exp(-H * Math.exp(b))]);
          const step = (pts) => { const o = []; pts.forEach((p, i) => { if (i) o.push([p[0], pts[i - 1][1]]); o.push(p); }); return o; };
          if (!LLm) {
            L.setScale({ xlog: false, x: [0, tmax], y: [0, 1.02] }); L.setLabels('weeks', 'proportion in remission');
            L.path(km0, { color: 'blue', width: 2.4 }); L.path(km1, { color: 'red', width: 2.4 });
            L.path(step(S0).concat([[tmax, S0[S0.length - 1][1]]]), { color: 'blue', width: 1.5, dash: [6, 4] });
            L.path(step(S1).concat([[tmax, S1[S1.length - 1][1]]]), { color: 'red', width: 1.5, dash: [6, 4] });
            const at = (km, t) => { let s = 1; for (const p of km) if (p[0] <= t) s = p[1]; return s; };
            for (const x of dd) if (!x.d) { const s = at(x.z ? km1 : km0, x.t); L.line(x.t, s - 0.025, x.t, s + 0.025, { color: x.z ? 'red' : 'blue', width: 1.6 }); }
          } else {
            L.setScale({ xlog: true, x: [0.8, tmax], y: [-4, 1.5] }); L.setLabels('weeks (log scale)', 'log(−log S)');
            const ll = (km) => km.filter((p) => p[1] > 0 && p[1] < 1 && p[0] > 0).map((p) => [p[0], Math.log(-Math.log(p[1]))]);
            L.path(ll(km0), { color: 'blue', width: 2.2 }); L.path(ll(km1), { color: 'red', width: 2.2 });
            L.path(ll(km0).map(([t, y]) => [t, y + b]), { color: 'red', width: 1.4, dash: [6, 4] });
            L.corner(`dashed: blue curve shifted up by β = ${v.fix(b, 2)}`, 'br', { size: 11, color: 'muted' });
          }
          // likelihood panel
          const ls = ['exact', 'breslow', 'efron'], col = { exact: 'green', breslow: 'purple', efron: 'orange' };
          const bh = argmax1((x) => logPL(dd, x, 0, ties.value), -2, 4), lmax = logPL(dd, bh, 0, ties.value);
          for (const m of ls) { const bm = argmax1((x) => logPL(dd, x, 0, m), -2, 4), lm = logPL(dd, bm, 0, m); R.fn((x) => logPL(dd, x, 0, m) - lm, { color: col[m], width: m === ties.value ? 2.6 : 1.2, alpha: m === ties.value ? 1 : 0.6, n: 120 }); }
          R.hline(-1.92, { color: 'faint', width: 1.2, dash: [4, 4] });
          let lo = bh, hi = bh; while (logPL(dd, lo, 0, ties.value) > lmax - 1.92 && lo > -3) lo -= 0.005; while (logPL(dd, hi, 0, ties.value) > lmax - 1.92 && hi < 5) hi += 0.005;
          R.vband(lo, hi, { color: 'green', alpha: 0.08 });
          R.vline(b, { color: 'gold', width: 1.6 });
          R.dot(b, logPL(dd, b, 0, ties.value) - lmax, { r: 6, color: 'gold' });
          // time-varying test (gamma), by maximising over (β, γ) with the chosen ties
          const nm = M.nelderMead((p) => -logPL(dd, p[0], p[1], ties.value), [bh, 0], { maxIt: 400 });
          st = { bh, lo, hi, lr: lmax - logPL(dd, 0, 0, ties.value), gam: nm.x[1], gain: -nm.fx - lmax, dd };
        });
        v.legend([['blue', '6-MP (treatment)'], ['red', 'control'], ['muted', 'proportional-hazards fit', { dash: true }], ['green', 'ℓ(β), exact ties'], ['purple', 'Breslow'], ['orange', 'Efron']]);
        v.readout(() => {
          if (!st) return '';
          const { bh, lo, hi, lr, gam, gain } = st;
          const g = data.value === 'gehan';
          return `${ties.value} ties: $\\hat\\beta = ${v.fix(bh, 3)}$, hazard ratio $e^{\\hat\\beta} = ${v.fix(Math.exp(bh), 2)}$, 95% interval (${v.fix(lo, 2)}, ${v.fix(hi, 2)}), likelihood-ratio difference ${v.fix(lr, 2)}${g ? ' — Cox 1972: 1.65, 5.21, (0.78, 2.60), 7.43; score test U(0) = 10.25 ± 2.50 reproduces exactly' : ''}.\n` +
            `time-varying term β + γ(t − 10): $\\hat\\gamma = ${v.fix(gam, 3)}$, log-likelihood gain ${v.fix(gain, 2)}${g ? ' (Cox: about 0.01, “even suspiciously small”) — proportional hazards holds' : ' — a large gain: the hazards are not proportional and a single β misleads'}.`;
        });
        fit();
      },
    },
  ],
};
