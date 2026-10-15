// Epidemiology & Evidence — Chapter 2 shared helpers (imported by ch02.js and ch02-b.js).
// Plain functions only; anything that needs the math library takes `M` (= v.M) as its first argument.

/** Integer with thin spaces between thousands (plain text, not TeX). */
export const int = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/** Percentage with d decimals (plain text). */
export const pc = (x, d = 1) => `${(100 * x).toFixed(d)}%`;
/** Percentage with as many decimals as the size needs: 0.44 → 44%, 0.044 → 4.4%, 0.0059 → 0.59%, 0.0002 → 0.020%. */
export function pcs(x) {
  const a = Math.abs(100 * x);
  if (a >= 99.5 && a < 100) return `${(100 * x).toFixed(a >= 99.95 ? 2 : 1)}%`; // 99.93% must not read as 100%
  return `${(100 * x).toFixed(a >= 9.95 ? 0 : a >= 0.995 ? 1 : a >= 0.0995 ? 2 : 3)}%`;
}
/** One-slot cache: f() is recomputed only when the key changes. */
export function memo() { let key = {}, val; return (k, f) => (k === key ? val : ((key = k), (val = f()))); }
/** n fixed uniforms in (0, 1] from a seed, so a simulated population keeps its "luck" while sliders move. */
export function uniforms(M, seed, n) { const r = M.rng(seed), a = new Float64Array(n); for (let i = 0; i < n; i++) a[i] = 1 - r(); return a; }
/** A fixed random permutation of 0 … n−1. */
export function permutation(M, seed, n) { const r = M.rng(seed), p = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; }
export const logit = (p) => Math.log(p / (1 - p));
export const expit = (x) => 1 / (1 + Math.exp(-x));
/** A positive number with about three significant figures (plain text): 168.5 → 169, 7.83 → 7.83, 0.147 → 0.147. */
export function sig3(x) { if (!isFinite(x)) return '∞'; const a = Math.abs(x); return a >= 99.5 ? int(x) : a >= 9.95 ? x.toFixed(1).replace(/\.0$/, '') : a >= 0.995 ? x.toFixed(2).replace(/0$/, '') : x.toPrecision(2); }
/** Odds p/(1 − p) as plain text: "1 : 169" below even odds, "4.2 : 1" above. */
export function oddsText(p) { if (!(p > 0)) return '0 : 1'; if (!(p < 1)) return '1 : 0'; const o = p / (1 - p); return o >= 1 ? `${sig3(o)} : 1` : `1 : ${sig3(1 / o)}`; }

/** Positive predictive value and negative predictive value from prevalence, sensitivity and specificity (Bayes). */
export const ppv = (p, se, sp) => (se * p) / (se * p + (1 - sp) * (1 - p));
export const npv = (p, se, sp) => (sp * (1 - p)) / (sp * (1 - p) + (1 - se) * p);

/** Natural frequencies in a population of N, rounded the way a frequency tree is drawn: first the diseased count,
 *  then the positives within each branch. → {D, H, TP, FN, FP, TN, pos, neg}. */
export function freqs(N, p, se, sp) {
  const D = Math.round(N * p), H = N - D, TP = Math.round(D * se), FP = Math.round(H * (1 - sp));
  return { D, H, TP, FN: D - TP, FP, TN: H - FP, pos: TP + FP, neg: N - TP - FP };
}

/** People as an icon array: person i sits in column i % cols, row ⌊i / cols⌋ counted from the top of a stage spanning
 *  [0, cols] × [0, rows]. styleOf(i) → null or {color, alpha, r, tile (colour of a square behind the person), tileAlpha,
 *  ring (colour of a ring), hollow}. Dots are batched by style. */
export function iconArray(s, n, cols, styleOf, place = (i) => i) {
  const rows = Math.ceil(n / cols), groups = new Map(), rings = [], hollow = [], tiles = [];
  for (let i = 0; i < n; i++) {
    const st = styleOf(i); if (!st) continue;
    const k0 = place(i), x = (k0 % cols) + 0.5, y = rows - Math.floor(k0 / cols) - 0.5;
    if (st.tile) tiles.push([x, y, st]);
    if (st.hollow) hollow.push([x, y, st]);
    else { const k = `${st.color}|${st.alpha ?? 1}|${st.r ?? 3}`; if (!groups.has(k)) groups.set(k, { st, pts: [] }); groups.get(k).pts.push([x, y]); }
    if (st.ring) rings.push([x, y, st]);
  }
  for (const [x, y, st] of tiles) s.rect(x - 0.47, y - 0.47, x + 0.47, y + 0.47, { fill: st.tile, fillAlpha: st.tileAlpha ?? 0.5, stroke: false, radius: 2 });
  for (const { st, pts } of groups.values()) s.dots(pts, { r: st.r ?? 3, color: st.color, alpha: st.alpha });
  for (const [x, y, st] of hollow) s.dot(x, y, { r: st.r ?? 3, color: st.color, hollow: true, width: 1.4 });
  for (const [x, y, st] of rings) s.circle(x, y, 0.45, { color: st.ring, width: 1.5 });
}

/** Screening digital mammography in the US Breast Cancer Surveillance Consortium, 2007–2013: 1 682 504 screens of
 *  792 808 women (Lehman et al., Radiology 2017;283:49–58). Prevalence = cancer detection rate 5.1 + false-negative
 *  rate 0.8 per 1 000 screens. */
export const BCSC = { se: 0.869, sp: 0.889, prev: 0.0059, cdr: 5.1, fnr: 0.8, recall: 0.116, ppv1: 0.044, cite: 'Lehman et al., Radiology 2017' };

/** Published operating points of PSA for any prostate cancer (placebo arm of the Prostate Cancer Prevention Trial,
 *  8 575 men; Thompson et al., JAMA 2005;294:66–70): [cut-off ng/mL, sensitivity, specificity]. Reported AUC 0.678. */
export const PSA_POINTS = [[1.1, 0.834, 0.389], [2.1, 0.526, 0.725], [3.1, 0.322, 0.867], [4.1, 0.205, 0.938]];
export const PSA_AUC = 0.678;
/** Binormal model of ln PSA fitted by least squares on the probit scale to PSA_POINTS:
 *  ln PSA ~ N(mu0, s0) in men without cancer and N(mu1, s1) in men with cancer. */
export function psaModel(M) {
  const N = M.dist.normal(0, 1), x = PSA_POINTS.map((p) => Math.log(p[0]));
  const f0 = M.linreg(x, PSA_POINTS.map((p) => N.quantile(p[2])));     // Φ⁻¹(Sp) = (ln c − μ0)/σ0
  const f1 = M.linreg(x, PSA_POINTS.map((p) => N.quantile(1 - p[1]))); // Φ⁻¹(1 − Se) = (ln c − μ1)/σ1
  const s0 = 1 / f0.slope, s1 = 1 / f1.slope;
  return { mu0: -f0.intercept * s0, s0, mu1: -f1.intercept * s1, s1 };
}

/** A two-group score model for a test "positive if score ≥ c". kind 'normal': healthy N(m0, s0), diseased N(m1, s1) on a
 *  linear axis; kind 'lognormal': the same for ln(score), drawn on a log axis (densities are per unit of ln score, which is
 *  what areas on a log axis show). → {f0, f1, se(c), sp(c), lr(c), auc, sample0(r), sample1(r), lo, hi, log}. */
export function scoreModel(M, kind, m0, s0, m1, s1, lo, hi) {
  const N = M.dist.normal(0, 1), g = kind === 'lognormal' ? Math.log : (x) => x, d = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  const f0 = (c) => d(g(c), m0, s0), f1 = (c) => d(g(c), m1, s1);
  return {
    log: kind === 'lognormal', lo, hi, m0, s0, m1, s1,
    f0, f1,
    se: (c) => 1 - N.cdf((g(c) - m1) / s1),
    sp: (c) => N.cdf((g(c) - m0) / s0),
    lr: (c) => f1(c) / f0(c),
    auc: N.cdf((m1 - m0) / Math.hypot(s0, s1)),
    sample0: (r) => { const z = m0 + s0 * r.normal(); return kind === 'lognormal' ? Math.exp(z) : z; },
    sample1: (r) => { const z = m1 + s1 * r.normal(); return kind === 'lognormal' ? Math.exp(z) : z; },
    /** cut-off at fraction t ∈ [0, 1] of the axis (geometric on a log axis) */
    at: (t) => (kind === 'lognormal' ? lo * (hi / lo) ** t : lo + (hi - lo) * t),
  };
}
/** ROC curve of a score model as [[1 − Sp, Se], …], from the highest cut-off to the lowest (n + 1 points, ends at (0,0), (1,1)). */
export function rocPoints(S, n = 240) {
  const out = [[0, 0]];
  const a = S.log ? Math.log(S.lo) - 3 : S.lo - 3, b = S.log ? Math.log(S.hi) + 3 : S.hi + 3;
  for (let k = n; k >= 0; k--) { const u = a + ((b - a) * k) / n, c = S.log ? Math.exp(u) : u; out.push([1 - S.sp(c), S.se(c)]); }
  out.push([1, 1]);
  return out;
}
