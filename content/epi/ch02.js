// Epidemiology & Evidence — Chapter 2: Diagnostic tests and screening (items 2.1–2.7; 2.8–2.14 are in ch02-b.js)
import { int, pc, pcs, memo, uniforms, permutation, logit, expit, sig3, oddsText, ppv, npv, freqs, iconArray, BCSC, PSA_POINTS, PSA_AUC, psaModel, scoreModel, rocPoints } from './ch02.shared.js';

export default {
  collection: 'epi',
  chapter: 2,
  title: 'Diagnostic tests and screening',
  summary: String.raw`A test is judged by its sensitivity and specificity, but a patient with a result in hand needs something else: the chance that the result is right — and that depends on how common the disease is among the people tested. Bayes’ theorem makes the dependence explicit and exposes the base-rate fallacy, which catches doctors as well as patients; likelihood ratios turn each result into a factor that multiplies the odds, and ROC curves summarize a test across all its cut-offs, from which costs and prevalence pick one. Combining tests, measuring how far two readers agree beyond chance, and judging screening programmes bring their own traps: lead time, length bias and overdiagnosis can make useless screening look good, and a test evaluated on the wrong spectrum of patients looks better than it is.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Sensitivity and specificity',
      credit: 'Yerushalmy, 1947',
      statement: String.raw`Classify each person by a **reference standard** ("gold standard") as diseased ($D$) or not ($\bar D$), and by the test as positive ($+$) or negative ($-$). The four cells are true positives (TP), false negatives (FN), false positives (FP) and true negatives (TN). Then
$$\text{sensitivity} = P(+\mid D) = \frac{\text{TP}}{\text{TP} + \text{FN}}, \qquad \text{specificity} = P(-\mid \bar D) = \frac{\text{TN}}{\text{TN} + \text{FP}}.$$
Sensitivity is the share of the diseased whom the test catches; $1 - $ sensitivity is the false-negative rate. Specificity is the share of the healthy whom the test clears; $1 - $ specificity is the false-positive rate. When the test calls "positive" whenever a continuous score $X$ reaches a cut-off $c$, with score distributions $F_1$ in the diseased and $F_0$ in the healthy,
$$\text{Se}(c) = 1 - F_1(c), \qquad \text{Sp}(c) = F_0(c),$$
so raising $c$ buys specificity with sensitivity. Each is a proportion *within one column* of the $2\times2$ table, so neither depends on the prevalence of disease among the people tested — provided the spectrum of disease and of non-disease stays the same (2.14).`,
      idea: String.raw`Sensitivity conditions on the diseased column and specificity on the healthy column. Change the prevalence and each column is scaled as a whole, so the proportions inside it do not move — which is why they are treated as properties of the test, and why they do not answer the patient's question "given my result, do I have it?" (that is a row proportion, 2.2). For a continuous marker the two numbers are areas under two overlapping curves on either side of the cut-off: wherever the curves overlap, some error is unavoidable, and moving the cut-off only trades one error for the other. Tracing $(1 - \text{Sp}, \text{Se})$ over all cut-offs gives the ROC curve (2.5), whose area is the probability that a random diseased person scores higher than a random healthy one.`,
      caption: String.raw`Drag the gold cut-off: people scoring at or above it test positive. Shaded areas are the four cells (solid = correct, hatched = errors); the $2\times2$ table counts them per 1 000 people and the ROC dot moves along the curve. Change the prevalence: the counts change but sensitivity and specificity — each worked out down one column — do not, while the share of positives who are diseased (PPV) does. Switch to *PSA*: a binormal model fitted to the four operating points published for the Prostate Cancer Prevention Trial (Thompson et al., *JAMA* 2005; dots on the ROC) shows why no PSA cut-off is both sensitive and specific. Turn on *random pairs* to see the AUC as a probability.`,
      deps: [],
      see: ['psych-2.2', 'stat-6.5', 'psych-2.15'],
      refs: ['Gordis ch. 5'],
      tags: ['diagnostic tests', 'sensitivity', 'specificity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sensitivity_and_specificity' },
      viz(v) {
        const M = v.M, PSA = psaModel(M), NP = 2000, SHOW = 14;
        const sD = v.stage({ x: [-3.6, 6.6], y: [0, 0.62], height: 250, full: true, axes: 'box', yticks: [], xlabel: 'biomarker score' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: false, weight: 1.15, minWidth: 300, title: 'the 2×2 table, per 1 000 people tested' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 290, axes: 'box', xlabel: '1 − specificity', ylabel: 'sensitivity', weight: 0.85, minWidth: 250, title: 'ROC curve: every cut-off at once' });
        const mk = v.select('biomarker', [{ value: 'gen', label: 'generic score' }, { value: 'psa', label: 'PSA for prostate cancer (PCPT)' }], 'gen');
        const dS = v.slider("separation $d'$ (difference of means in SDs)", 0, 4, 1.8, { step: 0.05 });
        const prevS = v.slider('prevalence among the people tested', 0.01, 0.5, 0.2, { log: true, fmt: (x) => pcs(x) });
        const sizeT = v.toggle('curve areas ∝ group sizes', false);
        const pairT = v.toggle('AUC as a probability: draw random pairs', false);
        const model = () => (mk.value === 'psa' ? scoreModel(M, 'lognormal', PSA.mu0, PSA.s0, PSA.mu1, PSA.s1, 0.15, 40) : scoreModel(M, 'normal', 0, 1, dS.value, 1, -3.6, 6.6));
        const snap = (x) => { if (mk.value === 'psa') for (const [c] of PSA_POINTS) if (Math.abs(Math.log(x / c)) < 0.05) return c; return x; };
        let yH = 0.025;
        const H = sD.handle(1, yH, { color: 'gold', constrain: (x) => { const S = model(); return [snap(S.log ? M.clamp(x, S.lo * 1.1, S.hi / 1.1) : M.clamp(x, S.lo + 0.15, S.hi - 0.15)), yH]; } });
        const N01 = M.dist.normal(0, 1), pairsU = uniforms(M, 211, 4 * NP);
        let shown = 'gen', st = null;
        v.render(() => {
          const psa = mk.value === 'psa', S = model(), p = prevS.value, pairs = pairT.value, scaled = sizeT.value;
          dS.el.hidden = psa;
          if (mk.value !== shown) { shown = mk.value; sD.setScale({ xlog: psa, x: [S.lo, S.hi] }); sD.setLabels(psa ? 'PSA (ng/mL), log scale' : 'biomarker score'); H.x = psa ? 4.1 : 1; }
          const c = H.x, se = S.se(c), sp = S.sp(c);
          // ----- densities: heights (optionally ∝ group size), label rows, pair rows above
          const pk = psa ? 1 / (Math.sqrt(2 * Math.PI) * Math.min(PSA.s0, PSA.s1)) : 1 / Math.sqrt(2 * Math.PI);
          const w0 = scaled ? (1 - p) / Math.max(p, 1 - p) : 1, w1 = scaled ? p / Math.max(p, 1 - p) : 1;
          const top = pk * 1.42, ymax = pairs ? top * 1.75 : top;
          sD.setView(null, [0, ymax]);
          const f0 = (x) => w0 * S.f0(x), f1 = (x) => w1 * S.f1(x), z = () => 0, [a, b] = [S.lo, S.hi];
          sD.between(f0, z, a, c, { fill: 'blue', fillAlpha: 0.26 });
          sD.between(f0, z, c, b, { fill: 'blue', fillAlpha: 0.06, hatch: 'blue', hatchAngle: 45, hatchAlpha: 0.6 });
          sD.between(f1, z, c, b, { fill: 'red', fillAlpha: 0.3 });
          sD.between(f1, z, a, c, { fill: 'red', fillAlpha: 0.06, hatch: 'red', hatchAngle: -45, hatchAlpha: 0.6 });
          sD.fn(f0, { color: 'blue', width: 2.2 });
          sD.fn(f1, { color: 'red', width: 2.2 });
          if (psa) for (const [k] of PSA_POINTS) { sD.line(k, 0, k, pk * 0.07, { color: 'muted', width: 1.4 }); sD.text(`${k}`, k, pk * 0.07, { dy: -7, align: 'center', color: 'muted', size: 10.5 }); }
          sD.line(c, 0, c, top * 0.99, { color: 'gold', width: 2 });
          // the four cells as two rows split by the cut-off
          const yr1 = top * 0.9, yr2 = top * 0.79, L = { dx: -9, align: 'right', size: 12, weight: 700 }, R = { dx: 9, align: 'left', size: 12, weight: 700 };
          sD.text(`TN ${pc(sp)} of healthy`, c, yr1, { ...L, color: 'blue' }); sD.text(`FP ${pc(1 - sp)} of healthy`, c, yr1, { ...R, color: 'blue' });
          sD.text(`FN ${pc(1 - se)} of diseased`, c, yr2, { ...L, color: 'red' }); sD.text(`TP ${pc(se)} of diseased`, c, yr2, { ...R, color: 'red' });
          sD.text('← negative', c, top * 0.68, { dx: -9, align: 'right', color: 'muted', size: 11 }); sD.text('positive →', c, top * 0.68, { dx: 9, align: 'left', color: 'muted', size: 11 });
          // random pairs: one healthy and one diseased score per row; green = diseased scored higher
          let good = 0;
          for (let k = 0; k < NP; k++) {
            const x0 = S.m0 + S.s0 * N01.quantile(pairsU[2 * k] * 0.999999), x1 = S.m1 + S.s1 * N01.quantile(pairsU[2 * k + 1] * 0.999999);
            if (x1 > x0) good++;
            if (pairs && k < SHOW) {
              const X0 = psa ? Math.exp(x0) : x0, X1 = psa ? Math.exp(x1) : x1, y = top * 1.04 + ((ymax - top * 1.08) * (k + 0.5)) / SHOW, ok = x1 > x0;
              sD.line(X0, y, X1, y, { color: ok ? 'green' : 'orange', width: 2, alpha: 0.75 });
              sD.dot(X0, y, { r: 3.6, color: 'blue' }); sD.dot(X1, y, { r: 3.6, color: 'red' });
            }
          }
          if (pairs) sD.text(`${SHOW} of ${int(NP)} random pairs (healthy, diseased)`, S.log ? S.lo * 1.08 : S.lo + 0.08, ymax, { dy: 9, align: 'left', baseline: 'top', color: 'muted', size: 11 });
          // ----- 2×2 table per 1 000 people
          const F = freqs(1000, p, se, sp);
          if (!st || !st.T) st = { T: v.table(sT, { rows: 3, cols: 3, square: false, cellAspect: 1.5, maxCell: 46, size: 15, labelSize: 12.5, region: [0, 0.3, 1, 1], rowLabels: ['test +', 'test −', 'total'], colLabels: ['diseased', 'healthy', 'total'], colLabelColor: (j) => ['red', 'blue', 'ink'][j], rowLabelColor: () => 'ink' }) };
          const cells = [[F.TP, F.FP, F.pos], [F.FN, F.TN, F.neg], [F.D, F.H, 1000]], nm = [['TP', 'FP', ''], ['FN', 'TN', ''], ['', '', '']];
          st.T.draw({
            value: (i, j) => int(cells[i][j]),
            sub: (i, j) => nm[i][j],
            fill: (i, j) => (i === 0 && j === 0 ? ['red', 0.32] : i === 1 && j === 0 ? ['red', 0.1] : i === 1 && j === 1 ? ['blue', 0.28] : i === 0 && j === 1 ? ['blue', 0.1] : i === 2 || j === 2 ? ['gray', 0.08] : null),
            weight: (i, j) => (i === 2 || j === 2 ? 500 : 700),
          });
          st.T.box(0, 0, 1, 0, { color: 'red', width: 2.2 }); st.T.box(0, 1, 1, 1, { color: 'blue', width: 2.2 });
          sT.text(`sensitivity = TP ÷ diseased = ${F.TP} ÷ ${F.D} = ${F.D ? pc(F.TP / F.D) : '—'}`, 0.5, 0.215, { align: 'center', color: 'red', size: 12.5, weight: 600 });
          sT.text(`specificity = TN ÷ healthy = ${int(F.TN)} ÷ ${int(F.H)} = ${pc(F.TN / F.H)}`, 0.5, 0.125, { align: 'center', color: 'blue', size: 12.5, weight: 600 });
          sT.text(`across the top row: PPV = TP ÷ positives = ${F.TP} ÷ ${F.pos} = ${F.pos ? pc(F.TP / F.pos) : '—'} (2.2)`, 0.5, 0.04, { align: 'center', color: 'muted', size: 11.5 });
          // ----- ROC
          const roc = rocPoints(S);
          sR.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          sR.poly([...roc, [1, 0]], { fill: 'accent', fillAlpha: 0.1, stroke: false });
          sR.path(roc, { color: 'accent', width: 2.4 });
          sR.line(1 - sp, 0, 1 - sp, se, { color: 'blue', width: 1, dash: [3, 3] }); sR.line(0, se, 1 - sp, se, { color: 'red', width: 1, dash: [3, 3] });
          if (psa) PSA_POINTS.forEach(([k, a1, b1]) => { sR.dot(1 - b1, a1, { r: 4.2, color: 'gold', hollow: true, width: 2 }); sR.text(`${k}`, 1 - b1, a1, { dx: 7, dy: 6, align: 'left', color: 'muted', size: 10.5 }); });
          sR.dot(1 - sp, se, { r: 5.5, color: 'gold' });
          sR.text(`AUC = ${v.fix(S.auc, 3)}`, 0.97, 0.13, { align: 'right', color: 'accent', size: 13, weight: 700 });
          if (psa) sR.text(`published ${PSA_AUC}`, 0.97, 0.05, { align: 'right', color: 'muted', size: 11 });
          st = { ...st, c, se, sp, F, p, psa, auc: S.auc, mc: good / NP, pairs, snapped: psa && PSA_POINTS.find((q) => q[0] === c) };
        });
        v.legend([['red', 'diseased', { area: true }], ['blue', 'healthy', { area: true }], ['gold', 'cut-off / operating point'], ['green', 'pair ranked correctly'], ['orange', 'pair ranked wrongly']]);
        v.readout(() => {
          if (!st || st.c == null) return '';
          const { c, se, sp, F, p, psa, auc, mc, snapped } = st, cut = psa ? `${v.fix(c, 2)} ng/mL` : v.fix(c, 2);
          let s = `cut-off ${cut}: **sensitivity** $P(+\\mid D) = ${pc(se)}$ · **specificity** $P(-\\mid \\bar D) = ${pc(sp)}$`;
          if (snapped) s += ` (published at ${snapped[0]} ng/mL: ${pc(snapped[1])} and ${pc(snapped[2])})`;
          s += ` · at prevalence ${pcs(p)}: ${F.TP} of ${F.D} diseased and ${int(F.TN)} of ${int(F.H)} healthy are classified correctly — the same two percentages at any prevalence, while the PPV is ${F.pos ? pc(F.TP / F.pos) : '—'}`;
          s += ` · AUC = $${psa ? '\\Phi\\big((\\mu_1-\\mu_0)/\\sqrt{\\sigma_0^2+\\sigma_1^2}\\big)' : "\\Phi(d'/\\sqrt2)"} = ${v.fix(auc, 3)}$; in ${int(NP)} random pairs the diseased person scored higher **${pc(mc)}** of the time`;
          return s;
        });
      },
    },
  ],
};
