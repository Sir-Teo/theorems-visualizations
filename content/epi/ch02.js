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
      see: ['psych-2.2', 'stat-6.5', 'psych-2.10', 'psych-2.15'],
      refs: ['Gordis ch. 5'],
      tags: ['diagnostic tests', 'sensitivity', 'specificity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sensitivity_and_specificity' },
      viz(v) {
        const M = v.M, PSA = psaModel(M), NP = 2000, SHOW = 14;
        const sD = v.stage({ x: [-3.6, 6.6], y: [0, 0.62], height: 250, full: true, axes: 'box', yticks: [], xlabel: 'biomarker score' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: false, weight: 1.15, minWidth: 300, title: 'the 2×2 table, per 1 000 people tested' });
        const sR = v.stage({ x: [-0.15, 1.03], y: [-0.1, 1.12], height: 290, axes: 'box', xlabel: '1 − specificity', ylabel: 'sensitivity', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [0.2, 0.4, 0.6, 0.8, 1], weight: 0.85, minWidth: 250, title: 'ROC curve: every cut-off at once' });
        const mk = v.select('biomarker', [{ value: 'gen', label: 'generic score' }, { value: 'psa', label: 'PSA for prostate cancer (PCPT)' }], 'gen');
        const dS = v.slider("separation $d'$ (difference of means in SDs)", 0, 4, 1.8, { step: 0.05 });
        const prevS = v.slider('prevalence among the people tested', 0.01, 0.5, 0.2, { log: true, fmt: (x) => pcs(x) });
        const sizeT = v.toggle('curve areas ∝ group sizes', false);
        const pairT = v.toggle('AUC as a probability: draw random pairs', false);
        const model = () => (mk.value === 'psa' ? scoreModel(M, 'lognormal', PSA.mu0, PSA.s0, PSA.mu1, PSA.s1, 0.15, 40) : scoreModel(M, 'normal', 0, 1, dS.value, 1, -3.6, 6.6));
        const snap = (x) => { if (mk.value === 'psa') for (const [c] of PSA_POINTS) if (Math.abs(Math.log(x / c)) < 0.05) return c; return x; };
        let yH = 0.025;
        const H = sD.handle(1, yH, { color: 'gold', constrain: (x) => { const S = model(); return [snap(S.log ? M.clamp(x, S.lo * 1.1, S.hi / 1.1) : M.clamp(x, S.lo + 0.15, S.hi - 0.15)), yH]; } });
        const N01 = M.dist.normal(0, 1), ZP = Array.from(uniforms(M, 202, 2 * NP), (u) => N01.quantile(u * 0.999999));
        let shown = 'gen', st = null;
        v.render(() => {
          const psa = mk.value === 'psa', S = model(), p = prevS.value, pairs = pairT.value, scaled = sizeT.value;
          dS.el.hidden = psa;
          if (mk.value !== shown) { shown = mk.value; sD.setScale({ xlog: psa, x: [S.lo, S.hi] }); sD.setLabels(psa ? 'PSA (ng/mL), log scale' : 'biomarker score'); sD.setTicks(psa ? [0.2, 0.5, ...PSA_POINTS.map((q) => [q[0], String(q[0])]), 10, 20] : null); H.x = psa ? 4.1 : 1; }
          const c = H.x, se = S.se(c), sp = S.sp(c);
          // ----- densities: heights (optionally ∝ group size), label rows, pair rows above
          const pk = psa ? 1 / (Math.sqrt(2 * Math.PI) * Math.min(PSA.s0, PSA.s1)) : 1 / Math.sqrt(2 * Math.PI);
          const w0 = scaled ? (1 - p) / Math.max(p, 1 - p) : 1, w1 = scaled ? p / Math.max(p, 1 - p) : 1;
          const top = pk * 1.58, ymax = pairs ? top * 1.7 : top;
          sD.setView(null, [0, ymax]);
          const f0 = (x) => w0 * S.f0(x), f1 = (x) => w1 * S.f1(x), z = () => 0, [a, b] = [S.lo, S.hi];
          sD.between(f0, z, a, c, { fill: 'blue', fillAlpha: 0.26 });
          sD.between(f0, z, c, b, { fill: 'blue', fillAlpha: 0.06, hatch: 'blue', hatchAngle: 45, hatchAlpha: 0.6 });
          sD.between(f1, z, c, b, { fill: 'red', fillAlpha: 0.3 });
          sD.between(f1, z, a, c, { fill: 'red', fillAlpha: 0.06, hatch: 'red', hatchAngle: -45, hatchAlpha: 0.6 });
          sD.fn(f0, { color: 'blue', width: 2.2 });
          sD.fn(f1, { color: 'red', width: 2.2 });
          sD.line(c, 0, c, top * 0.99, { color: 'gold', width: 2 });
          // the four cells as two rows split by the cut-off
          const yr1 = top * 0.83, yr2 = top * 0.73, L = { dx: -9, align: 'right', size: 12, weight: 700 }, R = { dx: 9, align: 'left', size: 12, weight: 700 };
          sD.text(`TN ${pc(sp)} of healthy`, c, yr1, { ...L, color: 'blue' }); sD.text(`FP ${pc(1 - sp)} of healthy`, c, yr1, { ...R, color: 'blue' });
          sD.text(`FN ${pc(1 - se)} of diseased`, c, yr2, { ...L, color: 'red' }); sD.text(`TP ${pc(se)} of diseased`, c, yr2, { ...R, color: 'red' });
          sD.text('← test negative', c, top * 0.93, { dx: -9, align: 'right', color: 'muted', size: 11.5 }); sD.text('test positive →', c, top * 0.93, { dx: 9, align: 'left', color: 'muted', size: 11.5 });
          // random pairs: one healthy and one diseased score per row; green = diseased scored higher
          let good = 0;
          for (let k = 0; k < NP; k++) {
            const x0 = S.m0 + S.s0 * ZP[2 * k], x1 = S.m1 + S.s1 * ZP[2 * k + 1];
            if (x1 > x0) good++;
            if (pairs && k < SHOW) {
              const X0 = psa ? Math.exp(x0) : x0, X1 = psa ? Math.exp(x1) : x1, y = top * 1.02 + ((ymax * 0.93 - top * 1.02) * (k + 0.5)) / SHOW, ok = x1 > x0;
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
          sR.rect(0, 0, 1, 1, { color: 'grid', width: 1 });
          sR.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          sR.poly([...roc, [1, 0]], { fill: 'accent', fillAlpha: 0.1, stroke: false });
          sR.path(roc, { color: 'accent', width: 2.4 });
          sR.line(1 - sp, 0, 1 - sp, se, { color: 'blue', width: 1, dash: [3, 3] }); sR.line(0, se, 1 - sp, se, { color: 'red', width: 1, dash: [3, 3] });
          if (psa) PSA_POINTS.forEach(([k, a1, b1]) => { sR.dot(1 - b1, a1, { r: 4.2, color: 'gold', hollow: true, width: 2 }); sR.text(`${k}`, 1 - b1, a1, { dx: 7, dy: 6, align: 'left', color: 'muted', size: 10.5 }); });
          sR.dot(1 - sp, se, { r: 5.5, color: 'gold' });
          sR.text(`AUC = ${v.fix(S.auc, 3)}`, 0.97, 0.3, { align: 'right', color: 'accent', size: 13, weight: 700 });
          if (psa) sR.text(`published ${PSA_AUC}`, 0.97, 0.22, { align: 'right', color: 'muted', size: 11 });
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
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Bayes’ theorem for tests: predictive values',
      credit: 'Bayes, 1763; Vecchio, 1966 (predictive values of tests)',
      statement: String.raw`Let a test have sensitivity $\text{Se}$ and specificity $\text{Sp}$, and apply it to people in whom the disease has prevalence (pre-test probability) $p$. The **positive predictive value** — the probability of disease given a positive result — and the **negative predictive value** are
$$\text{PPV} = P(D\mid +) = \frac{\text{Se}\,p}{\text{Se}\,p + (1-\text{Sp})(1-p)}, \qquad \text{NPV} = P(\bar D\mid -) = \frac{\text{Sp}\,(1-p)}{\text{Sp}\,(1-p) + (1-\text{Se})\,p}.$$
With $\text{Se}$ and $\text{Sp}$ fixed, PPV rises and NPV falls as $p$ increases: $\text{PPV}\to 0$ as $p \to 0$ and $\text{NPV} \to 0$ as $p\to 1$. A positive result raises the probability of disease ($\text{PPV} > p$) exactly when $\text{Se} > 1 - \text{Sp}$, and $\text{PPV} = \tfrac12$ when true and false positives are equally numerous, $\text{Se}\,p = (1-\text{Sp})(1-p)$. Predictive values therefore belong to a test *in a population*, not to the test alone.`,
      idea: String.raw`It is Bayes' theorem (stat 10.1) with the law of total probability in the denominator: the positives are the true positives $\text{Se}\,p$ plus the false positives $(1-\text{Sp})(1-p)$, and the PPV is the share of the first among all of them. In natural frequencies the formula becomes counting: out of 1 000 people, $1000p$ are ill and $\text{Se}$ of them test positive, while $1000(1-p)$ are well and $1 - \text{Sp}$ of *them* test positive. When the disease is rare the healthy group is so large that even a small false-positive rate produces more positives than the whole diseased group can — so the predictive value is governed by prevalence (1.3) as much as by the test's accuracy (2.1).`,
      caption: String.raw`Each dot is a person (red = has the disease); a gold tile means the test came back positive. The tree counts the same 1 000 people in natural frequencies, and the bars underneath split the positives and the negatives by true status — that split is the predictive value. Slide the prevalence and watch PPV move along its curve while sensitivity and specificity (dashed) stay put. The starting values are screening mammography in the US Breast Cancer Surveillance Consortium, 2007–2013 (sensitivity 86.9%, specificity 88.9%, about 5.9 cancers per 1 000 women screened; Lehman et al., *Radiology* 2017): Bayes' formula gives a PPV of 4.4%, matching the 4.4% of recalled women who were found to have cancer.`,
      deps: ['epi-2.1', 'epi-1.3', 'stat-10.1'],
      see: ['behav-3.7'],
      refs: ['Gordis ch. 5'],
      tags: ['diagnostic tests', 'Bayes', 'predictive value'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Positive_and_negative_predictive_values' },
      viz(v) {
        const M = v.M, N = 1000, COLS = 40, ROWS = 25;
        const sI = v.stage({ x: [0, COLS], y: [0, ROWS], equal: true, axes: false, height: 300, weight: 1.15, minWidth: 300 });
        const sF = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 300, weight: 1, minWidth: 280, title: 'the same 1 000 people as a frequency tree' });
        const sC = v.stage({ x: [0.0005, 0.95], y: [-0.13, 1.06], xlog: true, height: 220, full: true, axes: 'box', xlabel: 'prevalence (pre-test probability), log scale', title: 'predictive values against prevalence, with sensitivity and specificity held fixed',
          xticks: [[0.001, '0.1%'], [0.003, '0.3%'], [0.01, '1%'], [0.03, '3%'], [0.1, '10%'], [0.3, '30%'], [0.9, '90%']], yticks: [[0, '0'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%']] });
        const prevS = v.slider('prevalence $p$', 0.0005, 0.9, BCSC.prev, { log: true, fmt: (x) => pcs(x) });
        const seS = v.slider('sensitivity', 0.5, 0.999, BCSC.se, { step: 0.001, fmt: (x) => pc(x) });
        const spS = v.slider('specificity', 0.5, 0.999, BCSC.sp, { step: 0.001, fmt: (x) => pc(x) });
        const arr = v.select('arrange', [{ value: 'group', label: 'grouped by result' }, { value: 'mix', label: 'as they come' }], 'group');
        v.button('Screening mammography (BCSC)', () => { prevS.set(BCSC.prev); seS.set(BCSC.se); spS.set(BCSC.sp); });
        const perm = permutation(M, 23, N);
        let st = null;
        v.render(() => {
          const p = prevS.value, se = seS.value, sp = spS.value, F = freqs(N, p, se, sp), grouped = arr.value === 'group';
          // ----- icons: category order TP, FP | FN, TN
          const cat = (i) => (i < F.TP ? 0 : i < F.TP + F.FP ? 1 : i < F.TP + F.FP + F.FN ? 2 : 3);
          const STY = [{ color: 'red', r: 3.5, tile: 'gold', tileAlpha: 0.55 }, { color: 'blue', r: 3.3, tile: 'gold', tileAlpha: 0.55 }, { color: 'red', r: 3.5 }, { color: 'blue', alpha: 0.3, r: 3 }];
          iconArray(sI, N, COLS, (i) => STY[cat(i)], grouped ? (i) => i : (i) => perm[i]);
          sI.setTitle(`1 000 people: ${F.D} with the disease, ${F.pos} positive tests`);
          // ----- frequency tree
          const box = (x, y, w, n, lab, col, fill) => {
            sF.rect(x - w / 2, y - 0.62, x + w / 2, y + 0.62, { fill: fill || 'panel', fillAlpha: fill ? 0.45 : 1, color: col, width: 1.6, radius: 6 });
            sF.text(int(n), x, y + 0.2, { align: 'center', color: col, size: 14, weight: 700 });
            sF.text(lab, x, y - 0.3, { align: 'center', color: col, size: 10.5 });
          };
          const edge = (x0, y0, x1, y1, lab, col, side) => {
            sF.line(x0, y0 - 0.62, x1, y1 + 0.62, { color: col, width: 1.4, alpha: 0.7 });
            sF.text(lab, (x0 + x1) / 2, (y0 + y1) / 2, { dx: side * 6, align: side < 0 ? 'right' : 'left', color: col, size: 10.5, weight: 600 });
          };
          edge(5, 9.2, 2.5, 6.9, `p = ${pcs(p)}`, 'red', -1); edge(5, 9.2, 7.5, 6.9, `1 − p`, 'blue', 1);
          edge(2.5, 6.9, 1.25, 4.6, `Se ${pc(se)}`, 'red', -1); edge(2.5, 6.9, 3.75, 4.6, '1 − Se', 'red', 1);
          edge(7.5, 6.9, 6.25, 4.6, `1 − Sp = ${pc(1 - sp)}`, 'blue', -1); edge(7.5, 6.9, 8.75, 4.6, `Sp`, 'blue', 1);
          box(5, 9.2, 2.6, N, 'people tested', 'ink');
          box(2.5, 6.9, 2.4, F.D, 'with disease', 'red'); box(7.5, 6.9, 2.4, F.H, 'without', 'blue');
          box(1.25, 4.6, 2.2, F.TP, 'test +', 'red', 'gold'); box(3.75, 4.6, 2.2, F.FN, 'test −', 'red');
          box(6.25, 4.6, 2.2, F.FP, 'test +', 'blue', 'gold'); box(8.75, 4.6, 2.2, F.TN, 'test −', 'blue');
          // bars: positives and negatives split by true status
          const bar = (y, a, b, title, lab, col) => {
            const x0 = 0.3, x1 = 9.7, t = a + b, xa = x0 + (t ? ((x1 - x0) * a) / t : 0);
            sF.text(title, x0, y + 0.62, { align: 'left', color: 'ink', size: 11, weight: 600 });
            sF.text(lab, x1, y + 0.62, { align: 'right', color: col, size: 11.5, weight: 700 });
            if (t) { sF.rect(x0, y - 0.32, Math.max(xa, a ? x0 + 0.06 : x0), y + 0.32, { fill: 'red', fillAlpha: 0.85, stroke: false }); sF.rect(xa, y - 0.32, x1, y + 0.32, { fill: 'blue', fillAlpha: 0.5, stroke: false }); }
            sF.rect(x0, y - 0.32, x1, y + 0.32, { color: 'muted', width: 1 });
          };
          bar(2.3, F.TP, F.FP, `the ${int(F.pos)} positives: ${F.TP} diseased, ${int(F.FP)} not`, `PPV ${F.pos ? pc(F.TP / F.pos) : '—'}`, 'red');
          bar(0.65, F.FN, F.TN, `the ${int(F.neg)} negatives: ${F.FN} diseased, ${int(F.TN)} not`, `NPV ${pc(F.TN / F.neg)}`, 'blue');
          // ----- curves against prevalence
          sC.hline(se, { color: 'red', width: 1.2, dash: [6, 5], alpha: 0.6 }); sC.hline(sp, { color: 'blue', width: 1.2, dash: [6, 5], alpha: 0.6 });
          sC.hline(0, { color: 'grid', width: 1 });
          sC.text('sensitivity', 0.00058, se, { dy: se >= sp ? -8 : 9, align: 'left', color: 'red', size: 10.5, alpha: 0.85 }); sC.text('specificity', 0.00058, sp, { dy: sp > se ? -8 : 9, align: 'left', color: 'blue', size: 10.5, alpha: 0.85 });
          sC.fn((x) => ppv(x, se, sp), { color: 'red', width: 2.6 });
          sC.fn((x) => npv(x, se, sp), { color: 'blue', width: 2.6 });
          const pHalf = (1 - sp) / (se + 1 - sp);
          if (se > 1 - sp && pHalf > 0.0005 && pHalf < 0.95) { sC.dot(pHalf, 0.5, { r: 3.5, color: 'red', hollow: true }); sC.text('TP = FP', pHalf, 0.5, { dx: 7, align: 'left', color: 'red', size: 10.5 }); }
          sC.dot(BCSC.prev, BCSC.ppv1, { r: 5, color: 'gold', hollow: true, width: 2 });
          sC.text('BCSC observed 4.4%', BCSC.prev, BCSC.ppv1, { dx: 8, dy: 3, align: 'left', baseline: 'top', color: 'muted', size: 10.5 });
          sC.vline(p, { color: 'gold', width: 1.6 });
          const P1 = ppv(p, se, sp), N1 = npv(p, se, sp);
          sC.dot(p, P1, { r: 5, color: 'red' }); sC.dot(p, N1, { r: 5, color: 'blue' });
          const right = p < 0.2;
          sC.text(`PPV ${pcs(P1)}`, p, P1, { dx: right ? 9 : -9, dy: P1 > 0.9 ? 10 : -9, align: right ? 'left' : 'right', color: 'red', size: 12, weight: 700 });
          sC.text(`NPV ${pcs(N1)}`, p, N1, { dx: right ? 9 : -9, dy: N1 > 0.9 ? 10 : -9, align: right ? 'left' : 'right', color: 'blue', size: 12, weight: 700 });
          st = { p, se, sp, F, P1, N1 };
        });
        v.legend([['red', 'has the disease', { dot: true }], ['blue', 'does not', { dot: true }], ['gold', 'tested positive', { area: true }], ['red', 'PPV'], ['blue', 'NPV']]);
        v.readout(() => {
          if (!st) return '';
          const { p, se, sp, F, P1, N1 } = st;
          const bc = Math.abs(p - BCSC.prev) < 1e-4 && Math.abs(se - BCSC.se) < 1e-4 && Math.abs(sp - BCSC.sp) < 1e-4;
          return `of 1 000 people, ${F.D} have the disease and ${F.TP} of them test positive; ${int(F.H)} do not, and ${int(F.FP)} of them test positive anyway → **PPV = ${F.TP} ÷ ${int(F.pos)} = ${F.pos ? pc(F.TP / F.pos) : '—'}** · Bayes: $\\dfrac{${v.fix(se, 3)}\\times${v.fix(p, 4)}}{${v.fix(se, 3)}\\times${v.fix(p, 4)} + ${v.fix(1 - sp, 3)}\\times${v.fix(1 - p, 4)}} = ${pcs(P1)}$ · NPV = ${pcs(N1)}` +
            (bc ? ` · the BCSC registries observed that 4.4% of positive screening mammograms led to a cancer diagnosis — the same figure` : P1 < p * 1.0001 ? ' · with Se ≤ 1 − Sp a positive result carries no information' : ` · a positive result raises the probability ${v.fix(P1 / p, 1)}-fold, from ${pcs(p)} to ${pcs(P1)}`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Paradox',
      name: 'Base-rate fallacy in diagnosis',
      credit: 'Casscells, Schoenberger & Graboys, 1978',
      statement: String.raw`The **base-rate fallacy** is to judge the probability of disease after a positive test, $P(D\mid +)$, by the test's accuracy $P(+\mid D)$, ignoring the prior probability (the base rate). For a rare disease even an excellent test gives mostly false positives: with prevalence $1/1000$ and sensitivity and specificity both $99\%$, only about $9\%$ of positives are diseased. When Casscells, Schoenberger and Graboys (1978) asked 60 physicians, house officers and medical students about a disease of prevalence $1/1000$ and a test with a $5\%$ false-positive rate, 27 answered $95\%$ and 11 gave the correct answer of about $2\%$; a 2014 replication found the same (27 and 14 of 61). Repeating a test on the positives helps only to the extent that its errors are independent: each independent positive result multiplies the odds of disease by the same likelihood ratio (2.4), but a false positive with a persistent cause repeats.`,
      idea: String.raw`The fallacy confuses a conditional probability with its inverse. Bayes' theorem (2.2) in odds form makes the role of the base rate plain: posterior odds = prior odds $\times\,\text{Se}/(1 - \text{Sp})$. A $99\%$ test has likelihood ratio $99$, which lifts odds of $1 : 999$ only to about $1 : 10$. The intuition fails because the false positives come from the *large* healthy group: $1\%$ of $9\,990$ is about $100$ people, ten times the $10$ who are ill. A second independent test starts from the new odds $1 : 10$ and multiplies them by $99$ again, giving about $10 : 1$ — but only if a false positive is a fresh coin toss each time. Presenting the numbers as natural frequencies, as here, markedly improves people's Bayesian reasoning (Gigerenzer & Hoffrage, 1995).`,
      caption: String.raw`Left: 10 000 people (red = diseased, gold square = tested positive). Middle: everyone who tested positive, enlarged — mostly blue, that is, healthy. Choose *retest the positives* and *test a third time*: those who test negative again fade, and the share of red among the rest — the predictive value, laddered below — climbs. Raise the share of false positives that repeat (a cross-reacting antibody, say, rather than random lab error) and retesting stops helping. Right, below: what 60 clinicians answered in 1978 (Casscells et al., *NEJM*) and 61 in 2014 (Manrai et al., *JAMA Intern Med*) when asked the 5%-false-positive version.`,
      deps: ['epi-2.2', 'behav-3.7'],
      see: ['phil-6.3', 'psych-2.14'],
      refs: ['Gordis ch. 5'],
      tags: ['Bayes', 'base rate', 'screening'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Base_rate_fallacy' },
      viz(v) {
        const M = v.M, N = 10000, G = 100;
        const sP = v.stage({ x: [0, G], y: [0, G], equal: true, axes: false, height: 350, weight: 1, minWidth: 280, title: '10 000 people tested' });
        const sZ = v.stage({ x: [0, 12], y: [0, 12], equal: true, axes: false, height: 350, weight: 1, minWidth: 280 });
        const sL = v.stage({ x: [0, 100], y: [0, 10], axes: false, height: 210, full: true });
        const prevS = v.slider('prevalence', 0.0001, 0.3, 0.001, { log: true, fmt: (x) => (x < 0.01 ? `1 in ${int(1 / x)}` : pcs(x)) });
        const seS = v.slider('sensitivity', 0.5, 1, 0.99, { step: 0.001, fmt: (x) => pc(x) });
        const spS = v.slider('specificity', 0.5, 0.9999, 0.99, { step: 0.0001, fmt: (x) => pc(x, 2) });
        const roundS = v.select('testing', [{ value: 1, label: 'one test' }, { value: 2, label: 'retest the positives' }, { value: 3, label: 'test a third time' }], 3);
        const rhoS = v.slider('share of false positives that repeat on retest', 0, 1, 0.3, { step: 0.01, fmt: (x) => pc(x, 0) });
        v.button('99%-accurate test, 1 in 1 000', () => { prevS.set(0.001); seS.set(0.99); spS.set(0.99); });
        v.button('Casscells question (1978)', () => { prevS.set(0.001); seS.set(1); spS.set(0.95); });
        const perm = permutation(M, 31, N);
        /** Nested natural frequencies over three rounds; FP split into persistent (always positive) and random ones. */
        const rounds = (p, se, sp, rho) => {
          const D = Math.round(N * p), H = N - D, FP1 = Math.round(H * (1 - sp)), Fp = Math.round(FP1 * rho), f = ((1 - sp) * (1 - rho)) / Math.max(1e-12, 1 - rho * (1 - sp));
          const TP = [D, Math.round(D * se)], FPr = [H - Fp, FP1 - Fp];
          for (let k = 2; k <= 3; k++) { TP.push(Math.round(TP[k - 1] * se)); FPr.push(Math.round(FPr[k - 1] * f)); }
          const FP = FPr.map((x, k) => (k === 0 ? H : x + Fp));
          // exact (unrounded) probability of disease after k positive results
          const post = [0, 1, 2, 3].map((k) => { if (k === 0) return p; const tp = p * se ** k, fp = (1 - p) * (1 - sp) * (rho + (1 - rho) * f ** (k - 1)); return tp + fp > 0 ? tp / (tp + fp) : NaN; });
          return { D, H, TP, FP, Fp, FPr, post };
        };
        let st = null;
        v.render(() => {
          const p = prevS.value, se = seS.value, sp = spS.value, rho = rhoS.value, K = +roundS.value, R = rounds(p, se, sp, rho), R0 = rounds(p, se, sp, 0);
          // status of person j (j indexes the shuffled order): diseased first D, then persistent FPs, then random FPs
          const lastPos = (j) => { // highest round in which j is positive (0 = never)
            if (j < R.D) { let k = 0; while (k < 3 && j < R.TP[k + 1]) k++; return k; }
            const h = j - R.D; if (h < R.Fp) return 3; const q = h - R.Fp; let k = 0; while (k < 3 && q < R.FPr[k + 1]) k++; return k;
          };
          // ----- population: tiny dots, positives as gold squares
          const cell = (j) => { const k = perm[j]; return [(k % G) + 0.5, G - Math.floor(k / G) - 0.5]; };
          const faint = [], red = [];
          for (let j = 0; j < N; j++) {
            const [x, y] = cell(j), lp = lastPos(j);
            if (lp >= 1) sP.rect(x - 0.5, y - 0.5, x + 0.5, y + 0.5, { fill: 'gold', fillAlpha: lp >= K ? 1 : 0.28, stroke: false });
            if (j < R.D) red.push([x, y]); else if (lp < 1) faint.push([x, y]);
          }
          sP.dots(faint, { r: 0.9, color: 'blue', alpha: 0.35 });
          sP.dots(red, { r: 2.6, color: 'red' });
          // ----- zoom: everyone positive in round 1
          const pos1 = R.TP[1] + R.FP[1], k = Math.max(1, Math.ceil(pos1 / 400)), nTP = Math.round(R.TP[1] / k), nFP = Math.round(R.FP[1] / k), n = nTP + nFP;
          const cols = Math.max(4, Math.ceil(Math.sqrt(n * 1.15))), rows = Math.max(1, Math.ceil(n / cols));
          sZ.setView([0, cols], [-0.05 * rows - 0.6, rows + 0.05 * rows + 0.2]);
          sZ.setTitle(`the ${int(pos1)} who tested positive${k > 1 ? ` (each dot = ${k} people)` : ''}`);
          const tpK = Math.round(R.TP[K] / k), fpK = Math.round(R.FP[K] / k), fpP = Math.round(R.Fp / k);
          const r = Math.max(1.6, Math.min(7, (0.36 * sZ.width) / cols));
          iconArray(sZ, n, cols, (i) => {
            const dis = i < nTP, stay = dis ? i < tpK : i - nTP < fpP || i - nTP < fpK;
            return { color: dis ? 'red' : 'blue', r, alpha: stay ? 1 : 0.2, tile: stay && K > 1 ? 'gold' : null, tileAlpha: 0.5 };
          });
          // ----- ladder of predictive values and the clinicians' answers
          const X = (kk) => 6 + kk * 12.5, yb = 1.5, yt = 8.2, Y = (q) => yb + (yt - yb) * q;
          sL.text('probability of disease', 2, 9.55, { align: 'left', color: 'ink', size: 12, weight: 700 });
          sL.line(2.5, yb, 52, yb, { color: 'muted', width: 1 });
          ['before testing', 'after test 1', 'after test 2', 'after test 3'].forEach((lab, kk) => {
            const q = kk === 0 ? p : R.post[kk], q0 = kk === 0 ? p : R0.post[kk], on = kk <= K;
            if (rho > 0 && kk > 1 && on) sL.rect(X(kk) - 3.6, yb, X(kk) + 3.6, Y(q0), { color: 'green', width: 1.2, dash: [3, 3] });
            if (isFinite(q)) sL.rect(X(kk) - 3.6, yb, X(kk) + 3.6, Y(Math.max(q, 0.004)), { fill: kk === 0 ? 'muted' : 'red', fillAlpha: on ? 0.8 : 0.15, stroke: false });
            sL.text(isFinite(q) ? pcs(q) : '—', X(kk), Y(q), { dy: -9, align: 'center', color: on ? 'ink' : 'faint', size: 12, weight: 700 });
            sL.text(lab, X(kk), yb, { dy: 11, align: 'center', color: on ? 'muted' : 'faint', size: 11 });
          });
          if (rho > 0) sL.text('dashed: if false positives never repeated', 52, 9.55, { align: 'right', color: 'green', size: 10.5 });
          // clinicians
          const x0 = 66, x1 = 97, Wd = (n2) => ((x1 - x0) * n2) / 100;
          sL.text('“Prevalence 1 in 1 000, false-positive rate 5%: chance a positive person is ill?”', 98, 9.55, { align: 'right', color: 'ink', size: 11, weight: 600 });
          [['≈ 2% (correct)', 11, 14, 'green'], ['95%', 27, 27, 'red'], ['other answers', 22, 20, 'gray']].forEach(([lab, a, b, col], kk) => {
            const y = 7.4 - kk * 2.35;
            sL.text(lab, x0 - 1, y - 0.3, { align: 'right', color: col, size: 11.5, weight: 700 });
            sL.rect(x0, y + 0.05, x0 + Wd((100 * a) / 60), y + 0.75, { fill: col, fillAlpha: 0.75, stroke: false });
            sL.rect(x0, y - 1.05, x0 + Wd((100 * b) / 61), y - 0.35, { fill: col, fillAlpha: 0.4, stroke: false });
            sL.text(`1978: ${a} of 60`, x0 + Wd((100 * a) / 60), y + 0.4, { dx: 5, align: 'left', color: 'muted', size: 10.5 });
            sL.text(`2014: ${b} of 61`, x0 + Wd((100 * b) / 61), y - 0.7, { dx: 5, align: 'left', color: 'muted', size: 10.5 });
          });
          sZ.text(K > 1 ? `positive again after test ${K}: ${int(R.TP[K])} diseased, ${int(R.FP[K])} healthy` : `${int(R.TP[1])} diseased, ${int(R.FP[1])} healthy`, cols / 2, -0.32 - 0.02 * rows, { align: 'center', color: 'ink', size: 11.5, weight: 600 });
          st = { p, se, sp, rho, K, R, R0, pos1 };
        });
        v.legend([['red', 'has the disease', { dot: true }], ['blue', 'healthy', { dot: true }], ['gold', 'tested positive (this round)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, se, sp, rho, K, R, R0, pos1 } = st, lr = se / (1 - sp), od = (q) => oddsText(q);
          let s = `${int(N)} people at prevalence ${pcs(p)}: ${R.D} have the disease and ${R.TP[1]} of them test positive; ${int(R.H)} do not, and **${int(R.FP[1])}** of them test positive too → of ${int(pos1)} positives, ${pos1 ? pc(R.FP[1] / pos1, 0) : '—'} are false: $P(D\\mid +) = ${pcs(R.post[1])}$ although $P(+\\mid D) = ${pc(se)}$`;
          s += ` · odds form: ${od(p)} × LR ${sig3(lr)} = ${od(R.post[1])}`;
          if (K > 1) s += ` · retesting the positives: after test ${K}, ${R.TP[K]} diseased and ${int(R.FP[K])} healthy remain positive → **${pcs(R.post[K])}**` + (rho > 0 ? ` (${pcs(R0.post[K])} if false positives never repeated: ${pc(rho, 0)} of them have a persistent cause and test positive every time)` : ' — each independent positive multiplies the odds by the same LR');
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Likelihood ratios and pre-/post-test odds',
      credit: 'Fagan, 1975 (nomogram)',
      statement: String.raw`The **likelihood ratio** of a test result $r$ is how much more probable that result is in the diseased than in the healthy,
$$\text{LR}(r) = \frac{P(r\mid D)}{P(r\mid \bar D)}; \qquad \text{LR}^+ = \frac{\text{Se}}{1-\text{Sp}}, \quad \text{LR}^- = \frac{1-\text{Se}}{\text{Sp}}$$
for a positive and a negative result (for a continuous score, $\text{LR}(x) = f_1(x)/f_0(x)$). With odds $= p/(1-p)$, Bayes' theorem becomes
$$\text{post-test odds} = \text{pre-test odds} \times \text{LR}.$$
Ratios above $10$ or below $0.1$ change the probability of disease substantially; ratios near $1$ hardly at all. Results of tests that are **conditionally independent** given disease status combine by multiplying their likelihood ratios, that is, by adding their logarithms. The **Fagan nomogram** performs the multiplication with a straight edge.`,
      idea: String.raw`Write Bayes' theorem (2.2) for $D$ and for $\bar D$ and divide: the denominators $P(r)$ cancel, leaving odds × LR. Taking logarithms turns the product into a sum, so on a log-odds scale every result is a fixed *step* whatever the starting point, and independent results are steps laid end to end. Fagan's nomogram puts $-\text{logit}$ of the pre-test probability on the left, $\tfrac12\ln\text{LR}$ in the middle and logit of the post-test probability on the right: three equally spaced parallel scales, on which a straight line through two points meets the third exactly where $\text{logit}(\text{post}) = \text{logit}(\text{pre}) + \ln\text{LR}$. The steps add only when the tests' errors are independent given disease status (2.8); two tests that respond to the same thing count the same evidence twice.`,
      caption: String.raw`Drag the blue point on the left scale (pre-test probability) and the orange point on the middle scale (likelihood ratio): the straight line reads off the post-test probability on the right. Marks on the middle scale are published results — a screening mammogram (Breast Cancer Surveillance Consortium: sensitivity 86.9%, specificity 88.9%) and PSA at 4.1 ng/mL (Prostate Cancer Prevention Trial: 20.5%, 93.8%); the handle snaps to them. Starting from the 0.59% prevalence of breast cancer among women screened, a positive mammogram gives 4.4%. The purple line chains a second, independent test: it starts on the left scale at test 1's result (hollow dot). Right: the same steps as odds bars, and as arrows on a log-odds ruler, where independent evidence simply adds.`,
      deps: ['epi-2.2'],
      see: ['stat-10.13', 'psych-2.4'],
      refs: ['Gordis ch. 5'],
      tags: ['likelihood ratio', 'odds', 'Bayes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood_ratios_in_diagnostic_testing' },
      viz(v) {
        const M = v.M, YR = 7.7, P0 = 0.001, P1 = 0.999;
        const sN = v.stage({ x: [-0.75, 2.75], y: [-YR, YR + 0.5], height: 470, axes: false, weight: 1.05, minWidth: 300, title: 'Fagan nomogram' });
        const sO = v.stage({ x: [0, 1], y: [0, 1], height: 470, axes: false, weight: 1, minWidth: 290, title: 'the same evidence as odds' });
        const twoT = v.toggle('chain a second test', true);
        const yL = (p) => -logit(p), yM = (lr) => Math.log(lr) / 2, pL = (y) => expit(-y), lrM = (y) => Math.exp(2 * y);
        const REF = [
          { lr: BCSC.se / (1 - BCSC.sp), name: 'positive mammogram', short: 'mammogram +' }, { lr: (1 - BCSC.se) / BCSC.sp, name: 'negative mammogram', short: 'mammogram −' },
          { lr: PSA_POINTS[3][1] / (1 - PSA_POINTS[3][2]), name: 'PSA ≥ 4.1 ng/mL', short: 'PSA ≥ 4.1' }, { lr: (1 - PSA_POINTS[3][1]) / PSA_POINTS[3][2], name: 'PSA < 4.1 ng/mL', short: 'PSA < 4.1' },
        ];
        const snapLR = (y) => { for (const R of REF) if (Math.abs(y - yM(R.lr)) < 0.13) return yM(R.lr); return M.clamp(y, yM(0.001), yM(1000)); };
        const P = sN.handle(0, yL(BCSC.prev), { color: 'accent', constrain: (x, y) => [0, Math.abs(y - yL(BCSC.prev)) < 0.12 ? yL(BCSC.prev) : M.clamp(y, yL(P1), yL(P0))] });
        const L1 = sN.handle(1, yM(REF[0].lr), { color: 'orange', constrain: (x, y) => [1, snapLR(y)] });
        const L2 = sN.handle(1, yM(25), { color: 'purple', constrain: (x, y) => [1, snapLR(y)] });
        const pct = (q) => (q > 0.9 ? `${+(q * 100).toFixed(1)}` : q >= 0.1 ? `${Math.round(q * 100)}` : `${+(q * 100).toPrecision(2)}`);
        let st = null;
        v.render(() => {
          const two = twoT.value; L2.visible = two;
          const p0 = pL(P.y), lr1 = lrM(L1.y), lr2 = lrM(L2.y), p1 = expit(logit(p0) + Math.log(lr1)), p2 = expit(logit(p1) + Math.log(lr2));
          // ----- scales
          for (const x of [0, 1, 2]) sN.line(x, x === 1 ? yM(0.001) : yL(P1), x, x === 1 ? yM(1000) : yL(P0), { color: 'ink', width: 1.6 });
          const PT = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999];
          for (const q of PT) {
            sN.line(-0.05, yL(q), 0, yL(q), { color: 'ink', width: 1 }); sN.text(pct(q), -0.08, yL(q), { align: 'right', color: 'muted', size: 10.5 });
            sN.line(2, -yL(q), 2.05, -yL(q), { color: 'ink', width: 1 }); sN.text(pct(q), 2.08, -yL(q), { align: 'left', color: 'muted', size: 10.5 });
          }
          for (const q of [0.002, 0.005, 0.02, 0.1, 0.5, 2, 10, 50, 200, 500]) sN.line(0.97, yM(q), 1, yM(q), { color: 'ink', width: 1 });
          for (const q of [0.001, 0.01, 0.05, 0.2, 1, 5, 20, 100, 1000]) { sN.line(0.94, yM(q), 1, yM(q), { color: 'ink', width: 1.2 }); sN.text(String(q), 0.91, yM(q), { align: 'right', color: 'muted', size: 10.5 }); }
          for (const R of REF) { sN.line(1, yM(R.lr), 1.07, yM(R.lr), { color: 'gold', width: 2.2 }); sN.text(R.short, 1.1, yM(R.lr), { align: 'left', color: 'gold', size: 10, weight: 700 }); }
          sN.text('pre-test %', 0, YR + 0.05, { align: 'center', color: 'accent', size: 11.5, weight: 700 });
          sN.text('likelihood ratio', 1, YR + 0.05, { align: 'center', color: 'orange', size: 11.5, weight: 700 });
          sN.text('post-test %', 2, YR + 0.05, { align: 'center', color: 'red', size: 11.5, weight: 700 });
          sN.line(1, yM(1), 1.06, yM(1), { color: 'ink', width: 2 });
          sN.dot(0, yL(BCSC.prev), { r: 2.5, color: 'gold' }); sN.text('screening prevalence', 0.07, yL(BCSC.prev), { dy: -11, align: 'left', color: 'gold', size: 10, weight: 600 });
          // ----- lines
          const ext = (pA, lr) => [[-0.04, yL(pA) - 0.04 * (yM(lr) - yL(pA))], [2.04, yL(pA) + 2.04 * (yM(lr) - yL(pA))]];
          sN.clip(() => { const [a, b] = ext(p0, lr1); sN.line(a[0], a[1], b[0], b[1], { color: 'orange', width: 2.4 }); });
          sN.dot(2, -yL(p1), { r: 5, color: 'orange' }); sN.text(pcs(p1), 2, -yL(p1), { dx: -9, align: 'right', color: 'orange', size: 12, weight: 700 });
          if (two) {
            sN.clip(() => { const [a, b] = ext(p1, lr2); sN.line(a[0], a[1], b[0], b[1], { color: 'purple', width: 2.4 }); });
            sN.dot(0, yL(p1), { r: 4.5, color: 'purple', hollow: true, width: 2 });
            sN.dot(2, -yL(p2), { r: 5, color: 'purple' }); sN.text(pcs(p2), 2, -yL(p2), { dx: -9, dy: Math.abs(yL(p2) - yL(p1)) < 0.5 ? 12 : 0, align: 'right', color: 'purple', size: 12, weight: 700 });
          }
          // ----- odds bars
          const stages = [[p0, 'before testing', 'accent'], [p1, `after test 1 (× ${sig3(lr1)})`, 'orange']]; if (two) stages.push([p2, `after test 2 (× ${sig3(lr2)})`, 'purple']);
          const bx0 = 0.04, bx1 = 0.96;
          stages.forEach(([q, lab, col], k) => {
            const y = 0.9 - k * 0.135, xr = bx0 + (bx1 - bx0) * q;
            sO.text(lab, bx0, y + 0.045, { align: 'left', color: col, size: 11.5, weight: 700 });
            sO.text(`odds ${oddsText(q)} · p = ${pcs(q)}`, bx1, y + 0.045, { align: 'right', color: 'ink', size: 11 });
            sO.rect(bx0, y - 0.025, bx1, y + 0.018, { fill: 'blue', fillAlpha: 0.35, stroke: false });
            sO.rect(bx0, y - 0.025, Math.max(xr, bx0 + 0.004), y + 0.018, { fill: 'red', fillAlpha: 0.85, stroke: false });
          });
          // ----- log-odds ruler: ln(odds) from −7.5 to 7.5
          const XL = (l) => 0.05 + (0.9 * (l + 7.5)) / 15, yr = 0.34;
          sO.text('log-odds ruler: each result is a step of ln LR', 0.04, 0.5, { align: 'left', color: 'ink', size: 11.5, weight: 700 });
          sO.line(XL(-7.5), yr, XL(7.5), yr, { color: 'ink', width: 1.4 });
          for (const q of [0.001, 0.01, 0.1, 0.5, 0.9, 0.99, 0.999]) { sO.line(XL(logit(q)), yr - 0.012, XL(logit(q)), yr + 0.012, { color: 'ink', width: 1 }); sO.text(`${+(q * 100).toPrecision(3)}%`, XL(logit(q)), yr - 0.03, { align: 'center', color: 'muted', size: 10 }); }
          const l0 = logit(p0), l1 = logit(p1), l2 = logit(p2);
          sO.dot(XL(l0), yr, { r: 5, color: 'accent' });
          sO.arrow(XL(l0), yr + 0.05, XL(l1), yr + 0.05, { color: 'orange', width: 2.4, head: 8 });
          sO.text(`${lr1 >= 1 ? '+' : '−'} ln ${sig3(lr1)} = ${v.fix(Math.log(lr1), 2)}`, (XL(l0) + XL(l1)) / 2, yr + 0.05, { dy: -10, align: 'center', color: 'orange', size: 10.5, weight: 600 });
          if (two) { sO.arrow(XL(l1), yr + 0.105, XL(l2), yr + 0.105, { color: 'purple', width: 2.4, head: 8 }); sO.text(`${lr2 >= 1 ? '+' : '−'} ln ${sig3(lr2)} = ${v.fix(Math.log(lr2), 2)}`, (XL(l1) + XL(l2)) / 2, yr + 0.105, { dy: -10, align: 'center', color: 'purple', size: 10.5, weight: 600 }); }
          // published results as steps from even odds
          sO.text('published results as steps (ln LR)', 0.04, 0.215, { align: 'left', color: 'muted', size: 10.5, weight: 600 });
          REF.forEach((R, k) => {
            const y = 0.17 - k * 0.04, a = XL(0), b = XL(Math.log(R.lr));
            sO.rect(Math.min(a, b), y - 0.012, Math.max(a, b), y + 0.012, { fill: 'gold', fillAlpha: 0.8, stroke: false });
            sO.text(`${R.name}  × ${sig3(R.lr)}`, b, y, { dx: R.lr >= 1 ? 6 : -6, align: R.lr >= 1 ? 'left' : 'right', color: 'ink', size: 10 });
          });
          sO.line(XL(0), 0.03, XL(0), 0.2, { color: 'muted', width: 1, dash: [2, 2] });
          st = { p0, lr1, lr2, p1, p2, two };
        });
        v.legend([['accent', 'pre-test', { dot: true }], ['orange', 'test 1'], ['purple', 'test 2'], ['red', 'diseased share', { area: true }], ['gold', 'published likelihood ratio', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p0, lr1, lr2, p1, p2, two } = st, nm = (lr) => (REF.find((R) => Math.abs(R.lr - lr) < 1e-9) || {}).name;
          let s = `pre-test ${pcs(p0)} = odds ${oddsText(p0)} · × LR ${sig3(lr1)}${nm(lr1) ? ` (${nm(lr1)})` : ''} → odds ${oddsText(p1)} = **${pcs(p1)}**`;
          if (Math.abs(p0 - BCSC.prev) < 1e-6 && nm(lr1) === 'positive mammogram') s += ' — the 4.4% of recalled women found to have cancer in the BCSC';
          if (two) s += ` · × LR ${sig3(lr2)}${nm(lr2) ? ` (${nm(lr2)})` : ''} → odds ${oddsText(p2)} = **${pcs(p2)}** · in one step: × ${sig3(lr1 * lr2)} = × ${sig3(lr1)} × ${sig3(lr2)}, and $\\ln ${sig3(lr1 * lr2)} = ${v.fix(Math.log(lr1), 2)} + ${v.fix(Math.log(lr2), 2)}$ (valid for conditionally independent tests)`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Concept',
      name: 'Choosing a cut-off: Youden index and costs',
      credit: 'Youden, 1950',
      statement: String.raw`For a test "positive if score $\ge c$", each cut-off is a point $(1-\text{Sp}(c), \text{Se}(c))$ on the ROC curve. **Youden's index** $J(c) = \text{Se}(c) + \text{Sp}(c) - 1$ is the point's height above the chance diagonal; the Youden cut-off maximises it, which for a smooth ROC is where the curve's slope — equal to the likelihood ratio $f_1(c)/f_0(c)$ at the cut-off — is $1$. Youden's choice ignores how common the disease is and what errors cost. If a missed case costs $C_{\text{FN}}$, a false alarm $C_{\text{FP}}$, and the prevalence is $p$, the expected cost per person tested is
$$E(c) = p\,(1 - \text{Se}(c))\,C_{\text{FN}} + (1-p)\,(1 - \text{Sp}(c))\,C_{\text{FP}},$$
minimised where the ROC slope equals
$$m^* = \frac{1-p}{p}\cdot\frac{C_{\text{FP}}}{C_{\text{FN}}},$$
the point at which a line of that slope (an iso-cost line) touches the curve. Youden's cut-off is the special case $p\,C_{\text{FN}} = (1-p)\,C_{\text{FP}}$; rarer disease or costlier false alarms push the best cut-off up, costlier misses push it down.`,
      idea: String.raw`Along a line $\text{Se} = m\,(1 - \text{Sp}) + b$ the expected cost $E$ is constant when $m = m^*$, so minimising $E$ means pushing such a line as far up and to the left as it will go while still touching the curve — a tangency, where the ROC slope is $m^*$. The slope of the ROC at cut-off $c$ is $d\,\text{Se}/d(1-\text{Sp}) = f_1(c)/f_0(c)$, the likelihood ratio of the score $c$ itself (2.4), so the rule reads: call a result positive when its likelihood ratio exceeds $m^*$, equivalently when its post-test odds exceed $C_{\text{FP}}/C_{\text{FN}}$ — the same criterion as the ideal observer of signal detection theory (psych 2.12). Youden's $J$ treats the two error rates as equally bad, which amounts to assuming $m^* = 1$.`,
      caption: String.raw`Drag the gold point along the ROC curve (or the cut-off below it). Green: Youden's choice, the point highest above the diagonal, with its slope-1 tangent. Purple: the cut-off with the lowest expected cost, where the iso-cost line of slope $m^*$ touches the curve. Right: expected cost per 1 000 people tested, split into missed cases (red) and false alarms (blue). Make the disease rarer or false alarms costlier and the purple optimum climbs away from Youden's point; make misses costly and it slides down. *PSA* uses the binormal model fitted to the published PCPT operating points (Thompson et al., *JAMA* 2005).`,
      deps: ['epi-2.5'],
      see: ['psych-2.12', 'epi-2.4'],
      refs: ['Gordis ch. 5'],
      tags: ['ROC', 'cut-off', 'decision'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Youden%27s_J_statistic' },
      viz(v) {
        const M = v.M, PSA = psaModel(M), NG = 600;
        const sD = v.stage({ x: [-3.6, 6.6], y: [0, 0.5], height: 150, full: true, axes: 'box', yticks: [], xlabel: 'score' });
        const sR = v.stage({ x: [-0.15, 1.03], y: [-0.1, 1.12], height: 330, axes: 'box', xlabel: '1 − specificity', ylabel: 'sensitivity', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [0.2, 0.4, 0.6, 0.8, 1], weight: 1, minWidth: 280, title: 'ROC curve: Youden versus least cost' });
        const sC = v.stage({ x: [-3.6, 6.6], y: [0, 1], height: 330, axes: 'box', xlabel: 'cut-off', weight: 1.05, minWidth: 280, title: 'expected cost per 1 000 people tested' });
        const mk = v.select('test', [{ value: 'gen', label: 'generic score' }, { value: 'psa', label: 'PSA (PCPT)' }], 'gen');
        const dS = v.slider("separation $d'$", 0.3, 3.5, 1.5, { step: 0.05 });
        const prevS = v.slider('prevalence $p$', 0.005, 0.6, 0.05, { log: true, fmt: (x) => pcs(x) });
        const costS = v.slider('cost of a miss (false alarm = 1)', 0.1, 100, 4, { log: true, fmt: (x) => sig3(x) });
        const model = () => (mk.value === 'psa' ? scoreModel(M, 'lognormal', PSA.mu0, PSA.s0, PSA.mu1, PSA.s1, 0.15, 40) : scoreModel(M, 'normal', 0, 1, dS.value, 1, -3.6, 6.6));
        const grid = (S) => Array.from({ length: NG + 1 }, (_, k) => S.at(k / NG));
        const nearest = (x, y) => { const S = model(); let best = null, bd = Infinity; for (const c of grid(S)) { const d = (1 - S.sp(c) - x) ** 2 + (S.se(c) - y) ** 2; if (d < bd) { bd = d; best = c; } } return best; };
        let cut = 1;
        const R = sR.handle(0.2, 0.7, { color: 'gold', constrain: (x, y) => { cut = nearest(x, y); const S = model(); return [1 - S.sp(cut), S.se(cut)]; } });
        let yH = 0.02;
        const Hc = sD.handle(1, yH, { color: 'gold', constrain: (x) => { const S = model(); cut = S.log ? M.clamp(x, S.lo, S.hi) : M.clamp(x, S.lo, S.hi); return [cut, yH]; } });
        let shown = 'gen', st = null;
        v.render(() => {
          const psa = mk.value === 'psa', S = model(), p = prevS.value, cr = costS.value;
          dS.el.hidden = psa;
          if (mk.value !== shown) { shown = mk.value; for (const s of [sD, sC]) { s.setScale({ xlog: psa, x: [S.lo, S.hi] }); s.setTicks(psa ? [0.2, 0.5, 1, 2, 4, 10, 20] : null); } sD.setLabels(psa ? 'PSA (ng/mL)' : 'score'); sC.setLabels(psa ? 'PSA cut-off (ng/mL)' : 'cut-off'); cut = psa ? 4.1 : 1; }
          cut = M.clamp(cut, S.lo, S.hi); Hc.x = cut;
          const se = S.se(cut), sp = S.sp(cut); R.x = 1 - sp; R.y = se;
          const cost = (c) => 1000 * (p * (1 - S.se(c)) * cr + (1 - p) * (1 - S.sp(c)));
          const G = grid(S); let cJ = G[0], cE = G[0];
          for (const c of G) { if (S.se(c) + S.sp(c) > S.se(cJ) + S.sp(cJ)) cJ = c; if (cost(c) < cost(cE)) cE = c; }
          const m = ((1 - p) / p) / cr, J = (c) => S.se(c) + S.sp(c) - 1;
          // ----- distributions with the three cut-offs
          const pk = psa ? 1 / (Math.sqrt(2 * Math.PI) * PSA.s0) : 1 / Math.sqrt(2 * Math.PI);
          sD.setView(null, [0, pk * 1.25]);
          sD.fn(S.f0, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.12 }); sD.fn(S.f1, { color: 'red', width: 2, fill: 'red', fillAlpha: 0.12 });
          const near = Math.abs(sD.X(cJ) - sD.X(cE)) < 80, eRight = cE >= cJ;
          for (const [c, col, lab, side] of [[cJ, 'green', 'Youden', eRight ? -1 : 1], [cE, 'purple', 'least cost', eRight ? 1 : -1]]) {
            sD.line(c, 0, c, pk * 1.1, { color: col, width: 1.8, dash: [5, 4] });
            sD.text(lab, c, pk * 1.12, { dx: near ? side * 4 : 0, align: near ? (side < 0 ? 'right' : 'left') : 'center', baseline: 'bottom', color: col, size: 11, weight: 700 });
          }
          sD.line(cut, 0, cut, pk * 0.95, { color: 'gold', width: 2 });
          // ----- ROC
          const roc = rocPoints(S);
          sR.rect(0, 0, 1, 1, { color: 'grid', width: 1 });
          sR.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          sR.path(roc, { color: 'accent', width: 2.4 });
          const xJ = 1 - S.sp(cJ), yJ = S.se(cJ), xE = 1 - S.sp(cE), yE = S.se(cE);
          sR.clip(() => {
            sR.line(xJ - 2, yJ - 2, xJ + 2, yJ + 2, { color: 'green', width: 1.2, dash: [6, 4] });
            for (const off of [-0.3, -0.15, 0.15]) sR.line(xE - 3, yE + off - 3 * m, xE + 3, yE + off + 3 * m, { color: 'purple', width: 1, alpha: 0.25 });
            sR.line(xE - 3, yE - 3 * m, xE + 3, yE + 3 * m, { color: 'purple', width: 1.6, dash: [6, 4] });
          }, [0, 1], [0, 1]);
          sR.line(xJ, xJ, xJ, yJ, { color: 'green', width: 3 });
          sR.text(`J = ${v.fix(J(cJ), 2)}`, xJ, (xJ + yJ) / 2, { dx: 7, align: 'left', color: 'green', size: 11.5, weight: 700 });
          sR.dot(xJ, yJ, { r: 5.5, color: 'green' }); sR.dot(xE, yE, { r: 5.5, color: 'purple' });
          sR.line(1 - sp, 1 - sp, 1 - sp, se, { color: 'gold', width: 1.4, dash: [2, 3] });
          sR.text(`slope m* = ${sig3(m)}`, 0.97, 0.06, { align: 'right', color: 'purple', size: 11.5, weight: 700 });
          // ----- expected cost
          const top = Math.max(cost(S.lo), cost(S.hi), cost(cut)) * 1.15;
          sC.setView(null, [-0.12 * top, top]);
          const fnC = (c) => 1000 * p * (1 - S.se(c)) * cr;
          sC.fn(fnC, { color: 'red', width: 1.2, fill: 'red', fillAlpha: 0.25 });
          sC.between(cost, fnC, S.lo, S.hi, { fill: 'blue', fillAlpha: 0.22 });
          sC.fn(cost, { color: 'ink', width: 2 });
          for (const [c, col] of [[cJ, 'green'], [cE, 'purple'], [cut, 'gold']]) { sC.vline(c, { color: col, width: col === 'gold' ? 2 : 1.6, dash: col === 'gold' ? null : [5, 4] }); sC.dot(c, cost(c), { r: 4.5, color: col }); }
          const xm = S.at(0.97), xf = S.at(0.05);
          sC.text('missed cases', xm, Math.max(fnC(xm) * 0.5, top * 0.06), { align: 'right', color: 'red', size: 11, weight: 600 });
          sC.text('false alarms', xf, Math.max(cost(xf) - fnC(xf), 0) * 0.5 + fnC(xf), { align: 'left', color: 'blue', size: 11, weight: 600 });
          st = { psa, cut, se, sp, cJ, cE, p, cr, m, cost, J, S };
        });
        v.legend([['gold', 'your cut-off'], ['green', 'Youden: max Se + Sp − 1', { dash: true }], ['purple', 'least expected cost', { dash: true }], ['red', 'cost of missed cases', { area: true }], ['blue', 'cost of false alarms', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { psa, cut, se, sp, cJ, cE, p, cr, m, cost, J, S } = st, f = (c) => (psa ? `${v.fix(c, 2)} ng/mL` : v.fix(c, 2)), fc = (c) => int(cost(c));
          return `your cut-off ${f(cut)}: Se ${pc(se)}, Sp ${pc(sp)}, $J = ${v.fix(J(cut), 3)}$, expected cost **${fc(cut)}** per 1 000 · Youden: ${f(cJ)} (Se ${pc(S.se(cJ))}, Sp ${pc(S.sp(cJ))}, $J = ${v.fix(J(cJ), 3)}$, LR at cut-off ${sig3(S.lr(cJ))} ≈ 1), cost ${fc(cJ)} · least cost: ${f(cE)} (Se ${pc(S.se(cE))}, Sp ${pc(S.sp(cE))}), where the ROC slope = LR at cut-off = ${sig3(S.lr(cE))} ≈ $m^* = \\frac{1-p}{p}\\cdot\\frac{C_{FP}}{C_{FN}} = \\frac{${v.fix(1 - p, 3)}}{${v.fix(p, 3)}}\\cdot\\frac{1}{${sig3(cr)}} = ${sig3(m)}$, cost **${fc(cE)}**` +
            (Math.abs(m - 1) < 0.05 ? ' · here $m^* \\approx 1$, so Youden is optimal' : ` · Youden's cut-off costs ${pc(cost(cJ) / cost(cE) - 1, 0)} more`);
        });
      },
    },
  ],
};
