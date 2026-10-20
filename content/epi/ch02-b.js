// Epidemiology & Evidence — Chapter 2 (part b): items 2.8–2.14 — combining tests, agreement, and the traps of screening
import { int, pc, pcs, memo, uniforms, sig3, ppv, npv, iconArray } from './ch02.shared.js';

/** Joint probability that two tests are both positive, given their marginal positive rates a, b and a correlation ρ
 *  between their results (within one disease class), clamped to the values two binary variables can take. */
function both(a, b, rho) {
  const p = a * b + rho * Math.sqrt(a * (1 - a) * b * (1 - b));
  return Math.min(Math.min(a, b), Math.max(Math.max(0, a + b - 1), p));
}

export default {
  collection: 'epi',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Method',
      name: 'Serial and parallel testing',
      statement: String.raw`Two tests $A$ and $B$ can be combined in two ways. **Serial** (conjunctive) testing calls a person positive only if both tests are positive — in practice $B$ is done only on those positive on $A$. **Parallel** (disjunctive) testing calls a person positive if either test is positive. If the two tests' results are **conditionally independent** given disease status,
$$\text{Se}_{\text{serial}} = \text{Se}_A\,\text{Se}_B, \qquad \text{Sp}_{\text{serial}} = 1 - (1-\text{Sp}_A)(1-\text{Sp}_B),$$
$$\text{Se}_{\text{parallel}} = 1 - (1-\text{Se}_A)(1-\text{Se}_B), \qquad \text{Sp}_{\text{parallel}} = \text{Sp}_A\,\text{Sp}_B.$$
Serial testing gains specificity (and positive predictive value) at the cost of sensitivity; parallel testing gains sensitivity (and negative predictive value) at the cost of specificity. When the tests' errors are positively correlated — they tend to miss, or falsely flag, the same people — both gains shrink: the formulas above then overstate what combining achieves.`,
      idea: String.raw`Within the diseased, "A positive" and "B positive" are two events; serial testing needs their intersection and parallel testing their union, and under independence the intersection's probability is the product of the two (the inclusion–exclusion formula gives the union). The same holds among the healthy for the false-positive rates. Drawn in a unit square whose width is split by $A$ and height by $B$, independence means the $B$-positive band has the same height in both columns, so the overlap is a rectangle of area $\text{Se}_A\text{Se}_B$. Correlated errors stack the $B$-positives under the $A$-positives: the overlap grows towards the smaller of the two, the union shrinks towards the larger, and the second test adds less. In odds form (2.4) serial testing multiplies the likelihood ratios only when the tests are independent.

Use prob-2.1.1a within each disease stratum, rather than on the unconditioned mixture. In the diseased stratum the serial-positive intersection has probability $\mathrm{Se}_A\mathrm{Se}_B$ and the parallel-negative intersection has probability $(1-\mathrm{Se}_A)(1-\mathrm{Se}_B)$. In the non-diseased stratum apply the same rule to the two false-positive events or to the two true-negative events. Taking complements yields the other two displayed formulas; correlated errors do not satisfy these product identities.`,
      caption: String.raw`Each square is one group of people: its width is split by test $A$ (positive on the left) and its height by test $B$ (positive at the bottom). Purple — positive on both — is what serial testing calls positive; purple, orange and teal together — positive on at least one — is what parallel testing calls positive. Set the four accuracies; the ROC-space panel and the table show the combined tests. Then raise the correlation between the tests' errors: the $B$-positives slide under the $A$-positives and the combined tests (filled dots) fall short of the independence formulas (hollow dots).`,
      deps: ['epi-2.2', 'prob-2.1.1a'],
      see: ['epi-2.4'],
      refs: ['Gordis ch. 5'],
      tags: ['diagnostic tests', 'screening', 'independence'],
      viz(v) {
        const M = v.M;
        const sDz = v.stage({ x: [-0.06, 1.06], y: [-0.3, 1.1], equal: true, axes: false, height: 290, weight: 1, minWidth: 340, title: 'people **with** the disease' });
        const sHz = v.stage({ x: [-0.06, 1.06], y: [-0.3, 1.1], equal: true, axes: false, height: 290, weight: 1, minWidth: 340, title: 'people **without** it' });
        const sR = v.stage({ x: [-0.06, 0.56], y: [0.43, 1.02], height: 280, axes: 'box', xlabel: '1 − specificity', ylabel: 'sensitivity', xticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5], yticks: [0.5, 0.6, 0.7, 0.8, 0.9, 1], weight: 0.9, minWidth: 250, title: 'single and combined tests in ROC space (top-left corner)' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: false, weight: 1.2, minWidth: 300 });
        const seA = v.slider('test A sensitivity', 0.5, 0.995, 0.9, { step: 0.005, fmt: (x) => pc(x) });
        const spA = v.slider('test A specificity', 0.5, 0.995, 0.85, { step: 0.005, fmt: (x) => pc(x) });
        const seB = v.slider('test B sensitivity', 0.5, 0.995, 0.8, { step: 0.005, fmt: (x) => pc(x) });
        const spB = v.slider('test B specificity', 0.5, 0.995, 0.97, { step: 0.005, fmt: (x) => pc(x) });
        const rhoS = v.slider('correlation between the tests’ errors', 0, 0.9, 0, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const prevS = v.slider('prevalence', 0.002, 0.5, 0.02, { log: true, fmt: (x) => pcs(x) });
        const TB = v.table(sT, { rows: 4, cols: 5, square: false, cellAspect: 1.45, maxCell: 40, size: 12.5, labelSize: 12, region: [0, 0.11, 1, 1], rowLabels: ['test A', 'test B', 'serial: A and B', 'parallel: A or B'], rowLabelColor: (i) => ['orange', 'teal', 'purple', 'gold'][i], colLabels: ['Se', 'Sp', 'PPV', 'NPV', 'tests'], colWeights: [1, 1, 1, 1, 1.15] });
        /** Draw one group's square: a, b = probabilities of A+ and B+ in the group, pab = both. */
        const square = (s, a, b, pab, what) => {
          const h1 = a > 0 ? pab / a : 0, h2 = a < 1 ? (b - pab) / (1 - a) : 0;
          s.rect(0, 0, 1, 1, { fill: 'gray', fillAlpha: 0.06, color: 'muted', width: 1 });
          s.rect(0, h1, a, 1, { fill: 'orange', fillAlpha: 0.35, stroke: false });
          s.rect(a, 0, 1, h2, { fill: 'teal', fillAlpha: 0.35, stroke: false });
          s.rect(0, 0, a, h1, { fill: 'purple', fillAlpha: 0.65, stroke: false });
          // outline of the union (parallel positives)
          s.path([[0, 0], [0, 1], [a, 1], [a, h2], [1, h2], [1, 0], [0, 0]], { color: 'gold', width: 2.6 });
          s.line(a, 0, a, 1, { color: 'ink', width: 1.2, dash: [3, 3] });
          s.text(`A+  ${pcs(a)}`, a / 2, 1.05, { align: 'center', color: 'orange', size: 11, weight: 700 });
          if (1 - a > 0.12) s.text('A−', (1 + a) / 2, 1.05, { align: 'center', color: 'muted', size: 11 });
          const big = (w, hh) => w * s.sx > 52 && hh * s.sy > 18;
          if (big(a, h1)) s.text(`both ${pcs(pab)}`, a / 2, h1 / 2, { align: 'center', color: 'ink', size: 11, weight: 700 });
          s.text(`serial ${what} (both +): ${pcs(pab)}`, 0, -0.1, { align: 'left', color: 'purple', size: 11.5, weight: 700 });
          s.text(`parallel ${what} (either +): ${pcs(a + b - pab)}`, 0, -0.22, { align: 'left', color: 'gold', size: 11.5, weight: 700 });
        };
        let st = null;
        v.render(() => {
          const a = seA.value, b = seB.value, fa = 1 - spA.value, fb = 1 - spB.value, rho = rhoS.value, p = prevS.value;
          const dAB = both(a, b, rho), hAB = both(fa, fb, rho);
          square(sDz, a, b, dAB, 'sensitivity'); square(sHz, fa, fb, hAB, 'false-positive rate');
          const rows = [
            { se: a, sp: 1 - fa, n: 1000 }, { se: b, sp: 1 - fb, n: 1000 },
            { se: dAB, sp: 1 - hAB, n: 1000 + 1000 * (p * a + (1 - p) * fa), seI: a * b, spI: 1 - fa * fb },
            { se: a + b - dAB, sp: 1 - (fa + fb - hAB), n: 1000 + 1000 * (1 - p * a - (1 - p) * fa), seI: 1 - (1 - a) * (1 - b), spI: (1 - fa) * (1 - fb) },
          ];
          rows.forEach((r) => { r.ppv = ppv(p, r.se, r.sp); r.npv = npv(p, r.se, r.sp); });
          // ----- ROC space
          sR.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          sR.line(0, 1, 1, 1, { color: 'grid', width: 1 }); sR.line(0, 0, 0, 1, { color: 'grid', width: 1 });
          const col = ['orange', 'teal', 'purple', 'gold'], nm = ['A', 'B', 'serial', 'parallel'], pos = ['e', 'e', 'e', 'e'];
          sR.path([[1 - rows[2].sp, rows[2].se], [1 - rows[0].sp, rows[0].se], [1 - rows[3].sp, rows[3].se], [1 - rows[1].sp, rows[1].se], [1 - rows[2].sp, rows[2].se]], { color: 'muted', width: 1, dash: [2, 3] });
          rows.forEach((r, i) => {
            if (i >= 2 && rho > 0) { sR.dot(1 - r.spI, r.seI, { r: 5, color: col[i], hollow: true, width: 2 }); sR.line(1 - r.spI, r.seI, 1 - r.sp, r.se, { color: col[i], width: 1.2 }); }
            sR.dot(1 - r.sp, r.se, { r: 6, color: col[i], label: nm[i], labelPos: i === 2 ? 'se' : pos[i], labelColor: col[i], math: false, labelSize: 12 });
          });
          // ----- table
          TB.draw({
            value: (i, j) => { const r = rows[i]; return [pc(r.se), pc(r.sp), pcs(r.ppv), pcs(r.npv), int(r.n)][j]; },
            fill: (i, j) => (i === 2 && (j === 1 || j === 2) ? ['purple', 0.18] : i === 3 && (j === 0 || j === 3) ? ['gold', 0.22] : null),
            weight: (i) => (i >= 2 ? 700 : 500),
          });
          sT.text(`PPV and NPV at prevalence ${pcs(p)}`, 0.5, 0.075, { align: 'center', color: 'muted', size: 10.5 });
          sT.text('tests per 1 000 people: B is done only after A+ (serial) or A− (parallel)', 0.5, 0.025, { align: 'center', color: 'muted', size: 10.5 });
          st = { rows, rho };
        });
        v.legend([['purple', 'positive on both (serial)', { area: true }], ['orange', 'A only', { area: true }], ['teal', 'B only', { area: true }], ['gold', 'positive on either (parallel)'], ['muted', 'independence prediction', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { rows: [A, B, S, P], rho } = st;
          let s = `serial (both +): Se ${pc(S.se)}, **Sp ${pc(S.sp)}** against ${pc(A.sp)} and ${pc(B.sp)} for A and B alone, at the price of sensitivity · parallel (either +): **Se ${pc(P.se)}** against ${pc(A.se)} and ${pc(B.se)}, Sp ${pc(P.sp)}`;
          s += rho > 0 ? ` · with correlated errors ($\\rho = ${v.fix(rho, 2)}$) the independence formulas promise serial Sp ${pc(S.spI)} and parallel Se ${pc(P.seI)}, but the tests deliver only ${pc(S.sp)} and ${pc(P.se)}` : ` · independent tests: $\\text{Se}_A\\text{Se}_B = ${v.fix(A.se, 3)}\\times${v.fix(B.se, 3)} = ${v.fix(S.se, 3)}$ and $1-(1-\\text{Se}_A)(1-\\text{Se}_B) = ${v.fix(P.se, 3)}$`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Concept',
      name: 'Reliability and Cohen’s kappa',
      credit: 'Cohen, 1960',
      statement: String.raw`When two raters classify the same $n$ subjects into categories, the **observed agreement** $p_o$ is the fraction they classify alike. Part of it would happen by chance: if the raters call "positive" at rates $r_A$ and $r_B$ independently of the subject, they agree with probability $p_e = r_A r_B + (1-r_A)(1-r_B)$ (in general $p_e = \sum_k r_{A,k}\,r_{B,k}$ over categories). **Cohen's kappa** is the agreement beyond chance as a fraction of the agreement beyond chance that was possible,
$$\kappa = \frac{p_o - p_e}{1 - p_e}.$$
$\kappa = 1$ means perfect agreement, $\kappa = 0$ agreement no better than chance, $\kappa < 0$ worse than chance. Kappa depends on the marginal rates: when one category dominates, $p_e$ is close to $1$, so raters of fixed skill can have high raw agreement yet a low kappa (the "kappa paradox"). It measures **reliability** — reproducibility between readers — not validity: two raters can agree perfectly and both be wrong.`,
      idea: String.raw`Raw agreement rewards raters for the easy, common category. If 95% of films are normal, two readers who both call nearly everything normal agree on most films without looking. Kappa subtracts what the marginal totals alone would produce and rescales, so it asks how much of the room *above chance* the raters actually use. With the raters' accuracy held fixed, $p_o$ does not change with the prevalence of the finding, but $p_e$ rises as the finding becomes rare or very common, which squeezes $\kappa$ — so kappas from populations with different prevalence are not comparable, and Cicchetti and Feinstein (1990) recommended always reporting the proportions of agreement on positives and on negatives alongside kappa. In practice agreement is often modest: when ten radiologists each read the same 150 mammograms, pairs of radiologists had a median weighted agreement of 78% and a weighted kappa of 0.47 (Elmore et al., 1994).`,
      caption: String.raw`100 images, each read by two raters: the left half of a tile is rater A's call, the right half rater B's (red = positive), with disagreements outlined. The table is their agreement grid; the bar shows chance agreement $p_e$ and observed agreement $p_o$ on one scale, and kappa as the share of the room above chance that they cover. Lower the prevalence of positive findings: raw agreement stays near the same level while kappa falls (curves below, one simulated set of images as dots). Switch to raters who *guess* at the same rates without looking: raw agreement can still look high, kappa drops to about zero.`,
      deps: [],
      see: ['epi-2.1'],
      refs: ['Gordis ch. 5'],
      tags: ['reliability', 'agreement', 'kappa'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cohen%27s_kappa' },
      viz(v) {
        const M = v.M, N = 100, COLS = 10;
        const sI = v.stage({ x: [0, COLS], y: [-0.15, 10.15], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 250, title: '100 images: rater A | rater B' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, weight: 1.1, minWidth: 300, title: 'agreement grid' });
        const sK = v.stage({ x: [-0.07, 1], y: [-0.25, 1.05], height: 200, full: true, axes: 'box', xlabel: 'prevalence of positive findings', yticks: [[0, '0'], [0.2, '0.2'], [0.4, '0.4'], [0.6, '0.6'], [0.8, '0.8'], [1, '1']], xticks: [[0.1, '10%'], [0.3, '30%'], [0.5, '50%'], [0.7, '70%'], [0.9, '90%']], title: 'raw agreement and kappa against prevalence, raters’ accuracy fixed' });
        const prevS = v.slider('prevalence of positive findings', 0.02, 0.98, 0.1, { step: 0.01, fmt: (x) => pc(x, 0) });
        const accA = v.slider('rater A accuracy', 0.5, 1, 0.9, { step: 0.01, fmt: (x) => pc(x, 0) });
        const accB = v.slider('rater B accuracy', 0.5, 1, 0.9, { step: 0.01, fmt: (x) => pc(x, 0) });
        const mode = v.select('raters', [{ value: 'read', label: 'read the images' }, { value: 'guess', label: 'guess at the same rates' }], 'read');
        let seed = 7; v.button('New images', () => { seed++; });
        const U = memo();
        const TB = v.table(sT, { rows: 3, cols: 3, square: false, cellAspect: 1.4, maxCell: 40, size: 14, labelSize: 12, region: [0, 0.4, 1, 1], rowLabels: ['A says +', 'A says −', 'total'], colLabels: ['B says +', 'B says −', 'total'], cornerLabel: 'A \\ B' });
        const expect = (pi, a, b, guess) => {
          const rA = pi * a + (1 - pi) * (1 - a), rB = pi * b + (1 - pi) * (1 - b), pe = rA * rB + (1 - rA) * (1 - rB);
          const po = guess ? pe : pi * (a * b + (1 - a) * (1 - b)) + (1 - pi) * (a * b + (1 - a) * (1 - b));
          return { po, pe, k: pe < 1 ? (po - pe) / (1 - pe) : NaN };
        };
        let st = null;
        v.render(() => {
          const pi = prevS.value, a = accA.value, b = accB.value, guess = mode.value === 'guess', u = U(seed, () => [0, 1, 2].map((k) => uniforms(M, 900 + 3 * seed + k, N)));
          const rA = pi * a + (1 - pi) * (1 - a), rB = pi * b + (1 - pi) * (1 - b);
          const calls = Array.from({ length: N }, (_, i) => {
            const truth = u[0][i] < pi;
            const A = guess ? u[1][i] < rA : (truth ? u[1][i] < a : u[1][i] > a);
            const B = guess ? u[2][i] < rB : (truth ? u[2][i] < b : u[2][i] > b);
            return [A, B];
          });
          let n11 = 0, n10 = 0, n01 = 0, n00 = 0;
          for (const [A, B] of calls) { if (A && B) n11++; else if (A) n10++; else if (B) n01++; else n00++; }
          const po = (n11 + n00) / N, ra = (n11 + n10) / N, rb = (n11 + n01) / N, pe = ra * rb + (1 - ra) * (1 - rb), kap = pe < 1 ? (po - pe) / (1 - pe) : NaN;
          // ----- tiles
          calls.forEach(([A, B], i) => {
            const x = i % COLS, y = 9 - Math.floor(i / COLS);
            sI.rect(x + 0.08, y + 0.08, x + 0.5, y + 0.92, { fill: A ? 'red' : 'blue', fillAlpha: A ? 0.85 : 0.22, stroke: false });
            sI.rect(x + 0.5, y + 0.08, x + 0.92, y + 0.92, { fill: B ? 'red' : 'blue', fillAlpha: B ? 0.85 : 0.22, stroke: false });
            if (A !== B) sI.rect(x + 0.06, y + 0.06, x + 0.94, y + 0.94, { color: 'orange', width: 2.4, radius: 3 });
          });
          // ----- agreement grid
          const cell = [[n11, n10, n11 + n10], [n01, n00, n01 + n00], [n11 + n01, n10 + n00, N]];
          TB.draw({ value: (i, j) => String(cell[i][j]), fill: (i, j) => (i === j && i < 2 ? ['green', 0.25] : i < 2 && j < 2 ? ['orange', 0.2] : ['gray', 0.07]), weight: (i, j) => (i < 2 && j < 2 ? 700 : 500) });
          sT.text(`chance agreement from the totals: pₑ = ${v.fix(ra, 2)}×${v.fix(rb, 2)} + ${v.fix(1 - ra, 2)}×${v.fix(1 - rb, 2)} = ${v.fix(pe, 3)}`, 0.5, 0.335, { align: 'center', color: 'muted', size: 11 });
          // agreement scale
          const X = (q) => 0.06 + 0.88 * q, yb = 0.16;
          sT.line(X(0), yb, X(1), yb, { color: 'muted', width: 1 });
          for (const q of [0, 0.25, 0.5, 0.75, 1]) { sT.line(X(q), yb - 0.045, X(q), yb - 0.03, { color: 'muted', width: 1 }); sT.text(String(q), X(q), yb - 0.085, { align: 'center', color: 'muted', size: 10 }); }
          sT.rect(X(pe), yb - 0.035, X(1), yb + 0.035, { color: 'green', width: 1.4 });
          if (po > pe) sT.rect(X(pe), yb - 0.035, X(po), yb + 0.035, { fill: 'green', fillAlpha: 0.55, stroke: false });
          else sT.rect(X(po), yb - 0.035, X(pe), yb + 0.035, { fill: 'red', fillAlpha: 0.5, stroke: false });
          sT.line(X(pe), yb - 0.06, X(pe), yb + 0.06, { color: 'gray', width: 2.2 }); sT.line(X(po), yb - 0.06, X(po), yb + 0.06, { color: 'ink', width: 2.2 });
          const close = Math.abs(X(po) - X(pe)) < 0.12;
          sT.text(`pₑ ${v.fix(pe, 2)}`, X(pe), yb + 0.075, { dx: close ? -3 : 0, align: close ? 'right' : 'center', color: 'gray', size: 11, weight: 700 });
          sT.text(`pₒ ${v.fix(po, 2)}`, X(po), yb + 0.075, { dx: close ? 3 : 0, align: close ? 'left' : 'center', color: 'ink', size: 11, weight: 700 });
          sT.text(`κ = (pₒ − pₑ) ÷ (1 − pₑ) = ${isFinite(kap) ? v.fix(kap, 2) : '—'}`, 0.5, 0.025, { align: 'center', color: 'green', size: 12.5, weight: 700 });
          // ----- curves against prevalence
          sK.hline(0, { color: 'grid', width: 1 });
          for (const [lo, hi, lab] of [[0.41, 0.6, 'moderate'], [0.61, 0.8, 'substantial'], [0.81, 1, 'almost perfect']]) { sK.line(0.3, lo - 0.01, 1, lo - 0.01, { color: 'grid', width: 1 }); sK.text(lab, 0.995, (lo + hi) / 2, { align: 'right', color: 'faint', size: 10 }); }
          sK.fn((x) => expect(x, a, b, guess).po, { domain: [0.01, 0.99], color: 'ink', width: 2.2 });
          sK.fn((x) => expect(x, a, b, guess).pe, { domain: [0.01, 0.99], color: 'gray', width: 1.4, dash: [5, 4] });
          sK.fn((x) => expect(x, a, b, guess).k, { domain: [0.01, 0.99], color: 'green', width: 2.6 });
          sK.vline(pi, { color: 'gold', width: 1.4 });
          sK.dot(pi, po, { r: 4.5, color: 'ink' }); if (isFinite(kap)) sK.dot(pi, Math.max(-0.24, kap), { r: 4.5, color: 'green' });
          const E = expect(pi, a, b, guess);
          sK.text(`expected κ ${v.fix(E.k, 2)}`, pi, E.k, { dx: pi < 0.8 ? 9 : -9, dy: 12, align: pi < 0.8 ? 'left' : 'right', color: 'green', size: 11, weight: 700 });
          st = { po, pe, kap, n11, n10, n01, n00, E, guess, pi };
        });
        v.legend([['red', 'called positive', { area: true }], ['blue', 'called negative', { area: true }], ['orange', 'disagreement'], ['ink', 'raw agreement $p_o$'], ['gray', 'chance agreement $p_e$', { dash: true }], ['green', 'kappa']]);
        v.readout(() => {
          if (!st) return '';
          const { po, pe, kap, n11, n00, E, guess, pi } = st;
          return `the raters agree on ${n11 + n00} of 100 images ($p_o = ${v.fix(po, 2)}$), but their totals alone would produce $p_e = ${v.fix(pe, 2)}$ → $\\kappa = \\dfrac{${v.fix(po, 2)} - ${v.fix(pe, 2)}}{1 - ${v.fix(pe, 2)}} = ${isFinite(kap) ? v.fix(kap, 2) : '—'}$ (expected for these raters at prevalence ${pc(pi, 0)}: $p_o = ${v.fix(E.po, 2)}$, $\\kappa = ${v.fix(E.k, 2)}$)` +
            (guess ? ' · these raters ignore the images, so any agreement is chance: κ ≈ 0 however high $p_o$ looks' : ' · Landis & Koch’s labels (1977): 0.41–0.60 moderate, 0.61–0.80 substantial · pairs of radiologists reading 150 mammograms: 78% agreement, weighted κ 0.47 (Elmore et al., 1994)');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Lead-time bias',
      credit: 'Hutchison & Shapiro, 1968',
      statement: String.raw`Screening finds a disease in its **preclinical detectable phase**, before it would have produced symptoms. The **lead time** is the interval by which diagnosis is advanced: the time from screen detection to when the disease would have been diagnosed clinically. Because survival is counted from diagnosis, earlier diagnosis lengthens measured survival by the lead time **even if the date of death does not change**. Survival from diagnosis (for example 5-year survival) of screen-detected cases is therefore biased in favour of screening; a valid comparison uses **mortality** in the whole screened and unscreened populations (deaths per person-years), ideally in a randomized trial, or corrects survival for the estimated lead time.`,
      idea: String.raw`Survival from diagnosis is the time from diagnosis to death. Screening moves the first of these earlier by the lead time $L$; if early treatment does nothing, the second stays put, so survival grows by exactly $L$ for every screen-detected case. A 5-year survival rate, which asks how many live 5 years from diagnosis, then rises because the clock starts sooner, not because anyone lives longer. The size of the bias depends on how long the preclinical phase lasts (its mean sojourn time) and how often people are screened. Mortality (1.6) — deaths among all people offered screening — has no clock that starts at diagnosis, so it changes only if screening changes when (or whether) people die.`,
      caption: String.raw`Each row is one patient, on an age axis: the light band is the detectable preclinical phase, the orange dot the date symptoms would bring a diagnosis, and the black dot death from the cancer. Faint verticals are the screening rounds; a gold diamond marks a screen detection and the gold bar the lead time. The upper thin line is survival measured from diagnosis with screening, the lower one without — the same death, a longer line. Right: survival curves from diagnosis for 2 000 simulated patients, and what changes in the table. Give early treatment a real effect (*cured by early detection*) and only then does the number of deaths fall.`,
      deps: ['epi-1.6'],
      see: ['epi-9.8'],
      refs: ['Gordis ch. 18'],
      tags: ['screening', 'bias', 'survival'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lead_time_bias' },
      viz(v) {
        const M = v.M, N = 2000, SHOW = 11, MAXS = 30, A0 = 50, A1 = 74;
        const sL = v.stage({ x: [48, 90], y: [-0.8, SHOW], height: 330, full: true, axes: 'box', yticks: [], xlabel: 'age (years)', title: 'eleven patients: the same deaths, earlier diagnoses' });
        const sS = v.stage({ x: [0, 15], y: [-0.2, 1.04], height: 250, axes: 'box', xlabel: 'years since diagnosis', ylabel: 'alive', yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], weight: 1, minWidth: 270, title: 'survival measured from diagnosis' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: false, weight: 1.1, minWidth: 300, title: '2 000 cases of the cancer' });
        const scr = v.toggle('screening programme (ages 50–74)', true);
        const ivS = v.slider('screening interval (years)', 1, 5, 2, { step: 0.5 });
        const soS = v.slider('mean preclinical sojourn time (years)', 0.5, 8, 3, { step: 0.1, fmt: (x) => `${x.toFixed(1)} y` });
        const cureS = v.slider('cured by early detection', 0, 0.6, 0, { step: 0.01, fmt: (x) => pc(x, 0) });
        const u = [0, 1, 2, 3].map((k) => uniforms(M, 1010 + k, N)), uScr = uniforms(M, 1020, N * MAXS);
        const TB = v.table(sT, { rows: 4, cols: 2, square: false, cellAspect: 2.3, maxCell: 40, size: 13.5, labelSize: 12, region: [0, 0.2, 1, 1], rowLabels: ['5-year survival from diagnosis', 'median survival from diagnosis', 'mean age at death from the cancer', 'deaths from the cancer'], colLabels: ['no screening', 'screening'], colLabelColor: (j) => ['gray', 'accent'][j] });
        let st = null;
        v.render(() => {
          const on = scr.value, iv = ivS.value, so = soS.value, cure = cureS.value, sens = 0.85;
          ivS.el.hidden = !on;
          const screens = []; if (on) for (let s = A0; s <= A1 + 1e-9; s += iv) screens.push(s);
          const cases = [];
          for (let i = 0; i < N; i++) {
            const t0 = 52 + 20 * u[0][i], tc = t0 - so * Math.log(u[1][i]), death = tc - 3.5 * Math.log(u[2][i]);
            let ts = null; for (let k = 0; k < screens.length; k++) { const s = screens[k]; if (s >= t0 && s < tc && uScr[i * MAXS + k] < sens) { ts = s; break; } }
            const cured = ts != null && u[3][i] < cure;
            cases.push({ t0, tc, death, ts, cured, dx: ts ?? tc });
          }
          // ----- timelines
          for (const s of screens) sL.line(s, -0.5, s, SHOW - 0.4, { color: 'gold', width: 1, alpha: 0.35 });
          const shown = cases.slice(0, SHOW);
          shown.forEach((c, k) => {
            const y = SHOW - 1 - k;
            sL.rect(c.t0, y - 0.2, c.tc, y + 0.2, { fill: 'orange', fillAlpha: 0.18, stroke: false });
            sL.line(c.tc, y - 0.18, Math.min(c.death, 90), y - 0.18, { color: 'gray', width: 2 });
            if (c.ts != null) {
              sL.line(c.ts, y + 0.18, c.cured ? 90 : Math.min(c.death, 90), y + 0.18, { color: 'accent', width: 2, dash: c.cured ? [4, 3] : null });
              sL.line(c.ts, y, c.tc, y, { color: 'gold', width: 5, cap: 'butt' });
              sL.poly([[c.ts, y + 0.24], [c.ts + 0.35, y], [c.ts, y - 0.24], [c.ts - 0.35, y]], { fill: 'gold', fillAlpha: 1, color: 'panel', width: 1 });
            }
            sL.dot(c.tc, y, { r: 4.5, color: 'orange' });
            if (c.death < 90) sL.dot(c.death, y, { r: 4.5, color: c.cured ? 'gray' : 'ink', hollow: c.cured });
          });
          sL.text('death', Math.min(shown[0].death, 89), SHOW - 1, { dx: 8, align: 'left', color: 'ink', size: 10.5 });
          // ----- survival from diagnosis
          const surv = (screened) => cases.map((c) => (screened && c.ts != null ? (c.cured ? Infinity : c.death - c.ts) : c.death - c.tc));
          const s0 = surv(false), s1 = surv(true);
          const curve = (arr) => { const xs = arr.slice().sort((p, q) => p - q), pts = [[0, 1]]; let k = 0; for (let t = 0.05; t <= 15; t += 0.05) { while (k < xs.length && xs[k] <= t) k++; pts.push([t, 1 - k / xs.length]); } return pts; };
          sS.hline(0, { color: 'grid', width: 1 }); sS.vline(5, { color: 'muted', width: 1, dash: [3, 3] });
          sS.path(curve(s0), { color: 'gray', width: 2.4 });
          if (on) sS.path(curve(s1), { color: 'accent', width: 2.6 });
          const f5 = (arr) => arr.filter((x) => x >= 5).length / arr.length, median = (arr) => { const xs = arr.slice().sort((p, q) => p - q); return xs[Math.floor(xs.length / 2)]; };
          const y0 = f5(s0), y1 = f5(s1);
          sS.dot(5, y0, { r: 4.5, color: 'gray' }); sS.text(pc(y0, 0), 5, y0, { dx: 8, dy: 8, align: 'left', color: 'gray', size: 11.5, weight: 700 });
          if (on) { sS.dot(5, y1, { r: 4.5, color: 'accent' }); sS.text(pc(y1, 0), 5, y1, { dx: 8, dy: -9, align: 'left', color: 'accent', size: 11.5, weight: 700 }); }
          // ----- table
          const det = cases.filter((c) => c.ts != null), lead = det.length ? det.reduce((p, c) => p + c.tc - c.ts, 0) / det.length : 0;
          const deadA = (screened) => cases.filter((c) => !(screened && c.cured)), ageD = (arr) => arr.reduce((p, c) => p + c.death, 0) / arr.length;
          const R = [{ s5: y0, ms: median(s0), age: ageD(cases), deaths: cases.length }, { s5: on ? y1 : y0, ms: on ? median(s1) : median(s0), age: ageD(on ? deadA(true) : cases), deaths: on ? deadA(true).length : cases.length }];
          const changed = (key) => Math.abs(R[1][key] - R[0][key]) > 0.05;
          TB.draw({ value: (i, j) => { const r = R[j]; return [pc(r.s5, 0), (isFinite(r.ms) ? `${v.fix(r.ms, 1)} y` : '> 40 y'), v.fix(r.age, 1), int(r.deaths)][i]; }, fill: (i, j) => (j === 1 && on ? (i < 2 ? ['accent', 0.16] : changed(i === 2 ? 'age' : 'deaths') ? ['green', 0.22] : ['gray', 0.1]) : null) });
          sT.text(on ? `${pc(det.length / N, 0)} screen-detected, mean lead time ${v.fix(lead, 1)} y` : 'no screening: every case is diagnosed by its symptoms', 0.5, 0.1, { align: 'center', color: on ? 'gold' : 'muted', size: 11.5, weight: 700 });
          st = { on, y0, y1, lead, nDet: det.length, R, cure };
        });
        v.legend([['orange', 'detectable preclinical phase', { area: true }], ['gold', 'screen detection and lead time'], ['accent', 'survival from diagnosis, screened'], ['gray', 'survival from diagnosis, unscreened'], ['orange', 'diagnosis by symptoms', { dot: true }], ['ink', 'death from the cancer', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { on, y0, y1, lead, nDet, R, cure } = st;
          if (!on) return `without screening every case is diagnosed at symptoms: 5-year survival ${pc(y0, 0)}, mean age at death ${v.fix(R[0].age, 1)}`;
          return `screening detects ${nDet} of ${int(N)} cases early, by ${v.fix(lead, 1)} years on average · **5-year survival from diagnosis ${pc(y0, 0)} → ${pc(y1, 0)}** · cancer deaths ${int(R[0].deaths)} → ${int(R[1].deaths)}, mean age at cancer death ${v.fix(R[0].age, 1)} → ${v.fix(R[1].age, 1)}` +
            (cure > 0 ? ' — with a real benefit of early treatment, deaths fall too' : ' — **nobody lives a day longer**: the survival gain is all lead time');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Length-time bias',
      credit: 'Zelen & Feinleib, 1969 (length-biased sampling)',
      statement: String.raw`Tumours differ in how long they spend in the preclinical detectable phase (their **sojourn time** $S$). A screening test given at a point in time can only find tumours that are in that phase at that moment, and the chance of catching a tumour is proportional to how long it stays there. Screen-detected tumours are therefore a **length-biased sample**: if sojourn times have density $f(s)$ among all tumours that arise, among those caught by a single screen they have density
$$\frac{s\,f(s)}{E[S]}, \qquad \text{with mean } \frac{E[S^2]}{E[S]} = E[S] + \frac{\operatorname{Var} S}{E[S]} \;\ge\; E[S].$$
Since slow-growing tumours generally have a better prognosis, screen-detected cases look more benign than cases found by symptoms — and fast-growing tumours surface as **interval cancers** between screens — even if screening changes nothing for anyone.`,
      idea: String.raw`Picture every tumour's detectable phase as a segment on the time axis. A screen is a vertical line, and it hits a segment with probability proportional to the segment's length — the same reason a randomly chosen moment more often falls in a long bus gap than a short one (the inspection paradox). Weighting by length tilts the sample toward long sojourn times, i.e. toward slow tumours, and the more variable the growth rates the stronger the tilt ($\operatorname{Var}S/E[S]$). Screen-detected tumours thus carry a better prognosis by selection, which is added to the lead time of 2.10; only a comparison of mortality between randomized groups is free of both.

For the idealized length-weighted law, assume $S\ge0$, $0<E[S]<\infty$ and $E[S^2]<\infty$. Its mean is the second original moment divided by the first. The variance identity in prob-1.6.9a rewrites this as $E[S]+\operatorname{Var}(S)/E[S]$, proving the nonnegative mean shift and equality only for constant $S$. This algebra quantifies the stated selection model; it does not establish that real screening data satisfy length-proportional sampling or that longer sojourn time determines an individual's prognosis.`,
      caption: String.raw`Each segment is one tumour's detectable preclinical phase, coloured from fast-growing (red, short) to slow-growing (green, long); rows are sorted by onset. Drag the gold screen along the time axis: the segments it crosses are the screen-detected tumours. The histogram compares sojourn times of all tumours that arise with those caught (dots: the length-biased law $s f(s)/E[S]$). Widen the spread of growth rates and the bias grows. Switch to *screen every 2 years*: the tumours that surface between screens — interval cancers — are the fast ones. Each screen catches 85% of the tumours it crosses. To isolate length bias, prognosis here depends only on growth rate and is counted from clinical onset, with no lead time.`,
      deps: ['epi-2.10', 'prob-1.6.9a'],
      see: ['stoch-11.5'],
      refs: ['Gordis ch. 18'],
      tags: ['screening', 'bias', 'length-biased sampling'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Length_time_bias' },
      viz(v) {
        const M = v.M, N = 4000, T0 = 0, T1 = 40, ROWS = 70;
        const sT = v.stage({ x: [10, 30], y: [-1, ROWS + 4], height: 330, full: true, axes: 'box', yticks: [], xlabel: 'calendar time (years)', title: 'detectable preclinical phases of tumours arising over time' });
        const sH = v.stage({ x: [0.1, 40], y: [0, 1], xlog: true, height: 250, axes: 'box', yticks: [], xlabel: 'sojourn time, years (log scale)', weight: 1.1, minWidth: 280, title: 'sojourn times: all tumours vs screen-detected' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], height: 250, axes: false, weight: 1, minWidth: 280, title: 'who gets caught, and how they fare' });
        const mode = v.select('screening', [{ value: 'one', label: 'a single screen' }, { value: 'every', label: 'screen every 2 years' }], 'one');
        const sdS = v.slider('spread of growth rates (SD of ln S)', 0.1, 1.5, 0.9, { step: 0.05 });
        const medS = v.slider('median sojourn time (years)', 0.5, 6, 2, { step: 0.1, fmt: (x) => `${x.toFixed(1)} y` });
        let seed = 3; v.button('New tumours', () => { seed++; });
        const U = memo();
        const H = sT.handle(20, ROWS + 2.4, { color: 'gold', constrain: (x) => [M.clamp(x, 11, 29), ROWS + 2.4] });
        const N01 = M.dist.normal(0, 1), SENS = 0.85, surv5 = (s) => 1 - Math.exp(-s / 1.6); // assumed prognosis: 5-year survival rises with sojourn time
        let st = null;
        v.render(() => {
          const sd = sdS.value, med = medS.value, every = mode.value === 'every', uu = U(seed, () => [uniforms(M, 50 + 2 * seed, N), Array.from(uniforms(M, 51 + 2 * seed, N), (q) => N01.quantile(q * 0.999999)), uniforms(M, 49 + 3 * seed, 9 * N)]);
          H.visible = !every;
          const screens = every ? [12, 14, 16, 18, 20, 22, 24, 26, 28] : [H.x];
          const tum = [];
          for (let i = 0; i < N; i++) { const t0 = T0 + (T1 - T0) * uu[0][i], s = med * Math.exp(sd * uu[1][i]); tum.push({ t0, s, t1: t0 + s, i }); }
          // detection: a screen inside [t0, t1) that does not miss (sensitivity SENS per screen); interval cancer: surfaces between screens uncaught
          for (const t of tum) { t.det = screens.some((x, k) => x >= t.t0 && x < t.t1 && uu[2][9 * t.i + k] < SENS); t.interval = every && !t.det && t.t1 > screens[0] && t.t1 < screens[screens.length - 1]; }
          // ----- segments: tumours with onset in [10, 30), sorted by onset, at most ROWS rows
          const vis = tum.filter((t) => t.t0 >= 6 && t.t0 < 30 && t.t1 > 10).sort((p, q) => p.t0 - q.t0);
          const step = Math.max(1, vis.length / ROWS), rows = []; for (let k = 0; k < ROWS && Math.floor(k * step) < vis.length; k++) rows.push(vis[Math.floor(k * step)]);
          for (const x of screens) sT.line(x, -0.5, x, ROWS + 2.4, { color: 'gold', width: every ? 1.4 : 2.2 });
          rows.forEach((t, k) => {
            const y = ROWS - 1 - k, c = v.mix('red', 'green', M.clamp((Math.log(t.s) - Math.log(0.3)) / Math.log(30), 0, 1));
            sT.line(Math.max(t.t0, 9.8), y, Math.min(t.t1, 30.2), y, { color: c, width: t.det ? 4.5 : 2.4, alpha: t.det ? 1 : 0.55, cap: 'butt' });
            if (t.interval) sT.dot(t.t1, y, { r: 3.2, color: 'red' });
          });
          if (!every) sT.text('drag the screen', H.x, ROWS + 2.4, { dx: 11, align: 'left', color: 'gold', size: 11.5, weight: 700 });
          // ----- histogram of sojourn times (log bins)
          const edges = Array.from({ length: 31 }, (_, k) => 0.1 * 400 ** (k / 30));
          const all = tum.filter((t) => t.t0 >= 10 && t.t0 < 30), det = tum.filter((t) => t.det), intv = tum.filter((t) => t.interval);
          const hA = M.histogram(all.map((t) => t.s), { bins: edges }), hD = M.histogram(det.map((t) => t.s), { bins: edges });
          const nA = hA.counts.map((c) => c / Math.max(1, all.length)), nD = hD.counts.map((c) => c / Math.max(1, det.length)), top = Math.max(...nA, ...nD, 0.02) * 1.18;
          sH.setView(null, [-0.3 * top, top]);
          sH.hist({ edges, counts: nA }, { color: 'gray', fillAlpha: 0.12, outline: true });
          sH.hist({ edges, counts: nD }, { color: 'gold', fillAlpha: 0.45 });
          // theory: share of a log-bin under f and under s f(s)/E[S] (lognormal: the length-biased law is lognormal with μ + σ²)
          const mu = Math.log(med), binP = (m, a, b) => N01.cdf((Math.log(b) - m) / sd) - N01.cdf((Math.log(a) - m) / sd);
          if (!every) sH.dots(edges.slice(0, -1).map((a, k) => [Math.sqrt(a * edges[k + 1]), binP(mu + sd * sd, a, edges[k + 1])]), { r: 2.6, color: 'ink' });
          const mA = all.reduce((p, t) => p + t.s, 0) / Math.max(1, all.length), mD = det.length ? det.reduce((p, t) => p + t.s, 0) / det.length : NaN;
          sH.vline(mA, { color: 'gray', width: 1.4, dash: [4, 3] }); if (isFinite(mD)) sH.vline(mD, { color: 'gold', width: 1.6, dash: [4, 3] });
          // ----- comparison bars
          const groups = [['all tumours arising', all, 'gray'], ['screen-detected', det, 'gold']]; if (every) groups.push(['interval cancers', intv, 'red']);
          const slow = (g) => (g.length ? g.filter((t) => t.s > 3).length / g.length : NaN), s5 = (g) => (g.length ? g.reduce((p, t) => p + surv5(t.s), 0) / g.length : NaN);
          const block = (y0, title, f) => {
            sB.text(title, 0.02, y0 + 0.07, { align: 'left', color: 'ink', size: 11.5, weight: 700 });
            groups.forEach(([lab, g, col], k) => {
              const y = y0 - k * 0.085, val = f(g), x0 = 0.42, x1 = 0.86;
              sB.text(lab, x0 - 0.02, y, { align: 'right', color: col === 'gray' ? 'muted' : col, size: 11 });
              sB.rect(x0, y - 0.028, x1, y + 0.028, { fill: 'grid', fillAlpha: 0.6, stroke: false });
              if (isFinite(val)) { sB.rect(x0, y - 0.028, x0 + (x1 - x0) * val, y + 0.028, { fill: col, fillAlpha: 0.75, stroke: false }); sB.text(pc(val, 0), x1 + 0.015, y, { align: 'left', color: 'ink', size: 11, weight: 600 }); }
            });
          };
          block(0.82, 'slow-growing (sojourn > 3 years)', slow);
          block(0.38, '5-year survival (depends on growth rate only)', s5);
          st = { mA, mD, theory: med * Math.exp(1.5 * sd * sd), meanAll: med * Math.exp(0.5 * sd * sd), nDet: det.length, slowA: slow(all), slowD: slow(det), s5A: s5(all), s5D: s5(det), every, intv, slowI: slow(intv), s5I: s5(intv) };
        });
        v.legend([['red', 'fast-growing'], ['green', 'slow-growing'], ['gold', 'screen / screen-detected', { area: true }], ['gray', 'all tumours', { area: true }], ['ink', 'length-biased law', { dot: true }], ['red', 'interval cancer', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { mA, mD, theory, meanAll, nDet, slowA, slowD, s5A, s5D, every, intv, slowI, s5I } = st;
          let s = `mean sojourn time: all tumours ${v.fix(mA, 2)} y (theory $E[S] = ${v.fix(meanAll, 2)}$), screen-detected **${isFinite(mD) ? v.fix(mD, 2) : '—'} y**` + (every ? '' : ` (theory $E[S^2]/E[S] = ${v.fix(theory, 2)}$)`);
          s += ` · slow-growing: ${pc(slowA, 0)} of all vs **${pc(slowD, 0)}** of the ${nDet} screen-detected · 5-year survival ${pc(s5A, 0)} vs ${pc(s5D, 0)}`;
          if (every && intv.length) s += ` · the ${intv.length} interval cancers: ${pc(slowI, 0)} slow-growing, 5-year survival ${pc(s5I, 0)}`;
          return s + ' — the screen changed nobody’s tumour, only which ones it found';
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Phenomenon',
      name: 'Overdiagnosis',
      credit: 'Welch & Black, 2010 (review)',
      statement: String.raw`**Overdiagnosis** is the detection, usually by screening, of a disease that would never have caused symptoms or death in the person's lifetime — because it does not progress, progresses too slowly, or the person dies first of something else. An overdiagnosed person cannot benefit from treatment but bears its harms. Overdiagnosis needs a reservoir of silent disease and an activity that searches it. Its signature in population statistics is a rise in **incidence** with no matching fall in **mortality**, together with improved survival after diagnosis (the overdiagnosed "survive"). From randomized trials, Welch and Black (2010) estimated that about 25% of mammographically detected breast cancers, 50% of lung cancers found by chest X-ray or sputum and 60% of PSA-detected prostate cancers are overdiagnosed; in South Korea, thyroid-cancer incidence rose about fifteen-fold after ultrasound screening spread, while thyroid-cancer mortality stayed flat (Ahn, Kim & Welch, 2014).`,
      idea: String.raw`Every overdiagnosed case adds one diagnosis and no death, so incidence goes up, the case-fatality and survival statistics improve (more cases, same deaths), and mortality is untouched. No individual can be identified as overdiagnosed — that would need knowing their untreated future — so the amount is estimated from excess incidence in screened versus unscreened populations after the lead time has played out. It is the extreme of length bias (2.11): tumours with an effectively infinite sojourn time are the most likely of all to be found, and screening older people, with less remaining life, makes it worse.`,
      caption: String.raw`A simulated population of one million (rates per 100 000 per year). Progressive cancers would cause symptoms and some deaths; a reservoir of non-progressive lesions never would. Drag the gold line to start screening. Incidence (stacked: orange = progressive cancers, hatched purple = overdiagnosed lesions) jumps — first a prevalence peak as the reservoir is skimmed, then a lasting excess — while mortality (red) does not move. Five-year survival climbs anyway. Enlarge the reservoir or the uptake; only giving early treatment a real benefit lowers mortality.`,
      deps: ['epi-2.11'],
      see: ['epi-1.6'],
      refs: ['Gordis ch. 18'],
      tags: ['screening', 'overdiagnosis', 'incidence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Overdiagnosis' },
      viz(v) {
        const M = v.M, POP = 1e6, Y0 = 1950, Y1 = 2026, LP = 20, SOJ = 3, CFR = 0.4, SURV = 3, LIFE = 15, SENS = 0.9;
        const sTS = v.stage({ x: [1985, 2025], y: [0, 100], height: 260, full: true, axes: 'box', xlabel: 'year', title: 'incidence and mortality per 100 000 per year' });
        const sS = v.stage({ x: [1985, 2020], y: [0, 1.05], height: 230, axes: 'box', xlabel: 'year of diagnosis', yticks: [[0.2, '20%'], [0.4, '40%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']], weight: 1, minWidth: 260, title: '5-year survival after diagnosis' });
        const sR = v.stage({ x: [0, 10], y: [-1.6, 10.2], equal: true, axes: false, height: 230, weight: 1, minWidth: 260 });
        const resS = v.slider('non-progressive lesions per progressive cancer', 0, 5, 1, { step: 0.1 });
        const upS = v.slider('share of people screened each year', 0, 1, 0.5, { step: 0.01, fmt: (x) => pc(x, 0) });
        const cureS = v.slider('screen-detected progressive cancers cured', 0, 0.6, 0, { step: 0.01, fmt: (x) => pc(x, 0) });
        const H = sTS.handle(2000, 95, { color: 'gold', constrain: (x) => [Math.round(M.clamp(x, 1990, 2018)), sTS.bounds.y[1] * 0.93] });
        // fixed population of tumours: progressive at LP per 100k per year, non-progressive at up to 5×LP; four uniforms each
        const NP = Math.round((LP * POP / 1e5) * (Y1 - Y0)), NN = 5 * NP, u = [0, 1, 2, 3, 4].map((k) => uniforms(M, 1200 + k, NP + NN));
        let st = null;
        v.render(() => {
          const start = H.x, res = resS.value, up = upS.value, cure = cureS.value, q = up * SENS, nn = Math.round(res * NP);
          H.y = sTS.bounds.y[1] * 0.93;
          const yrs = Y1 - 1985, inc = new Float64Array(yrs), over = new Float64Array(yrs), deaths = new Float64Array(yrs), dxN = new Float64Array(yrs), dx5 = new Float64Array(yrs);
          /** first screening time (mid-year) at or after t, after a geometric number of missed rounds drawn from w */
          const firstScreen = (t, w) => { if (q <= 0) return Infinity; const t1 = Math.max(t, start + 0.5), y = Math.ceil(t1 - 0.5) + 0.5, k = q >= 1 ? 0 : Math.floor(Math.log(w) / Math.log(1 - q)); return y + k; };
          const bin = (t) => Math.floor(t) - 1985;
          for (let i = 0; i < NP + nn; i++) {
            const prog = i < NP, j = i;
            const t0 = Y0 + (Y1 - Y0) * u[0][j];
            if (prog) {
              const tc = t0 - SOJ * Math.log(u[1][j]), ts = firstScreen(t0, u[2][j]), det = ts < tc, tdx = det ? ts : tc;
              const dies = u[3][j] < CFR && !(det && u[3][j] < CFR * cure), td = tc - SURV * Math.log(u[4][j]);
              const b = bin(tdx); if (b >= 0 && b < yrs) { inc[b]++; dxN[b]++; if (!(dies && td - tdx < 5)) dx5[b]++; }
              if (dies) { const bd = bin(td); if (bd >= 0 && bd < yrs) deaths[bd]++; }
            } else {
              const tend = t0 - LIFE * Math.log(u[1][j]), ts = firstScreen(t0, u[2][j]);
              if (ts < tend) { const b = bin(ts); if (b >= 0 && b < yrs) { inc[b]++; over[b]++; dxN[b]++; dx5[b]++; } }
            }
          }
          const per = 1e5 / POP, I = Array.from(inc, (x) => x * per), O = Array.from(over, (x) => x * per), D = Array.from(deaths, (x) => x * per);
          // scale to the lasting excess; the one-off prevalence peak is clipped and labelled
          const late = I.filter((x, k) => 1985 + k < start || 1985 + k >= start + 8), top = Math.max(40, ...late, ...D) * 1.35, peak = Math.max(...I), kPeak = I.indexOf(peak);
          sTS.setView(null, [-0.1 * top, top]);
          // stacked incidence: progressive below, overdiagnosed above (hatched)
          const prog = [], tot = [];
          for (let k = 0; k < yrs - 1; k++) { const x0 = 1985 + k, x1 = x0 + 1; prog.push([x0, I[k] - O[k]], [x1, I[k] - O[k]]); tot.push([x0, I[k]], [x1, I[k]]); }
          sTS.clip(() => {
            sTS.poly([[1985, 0], ...prog, [2025, 0]], { fill: 'orange', fillAlpha: 0.4, stroke: false });
            sTS.poly([...prog, ...tot.slice().reverse()], { fill: 'purple', fillAlpha: 0.12, hatch: 'purple', hatchAlpha: 0.7, stroke: false });
            sTS.path(tot, { color: 'orange', width: 2 });
          }, [1985, 2025], [0, top]);
          sTS.hline(0, { color: 'grid', width: 1 });
          if (peak > top) sTS.text(`↑ prevalence peak ${Math.round(peak)}`, 1985 + kPeak + 1, top * 0.9, { dx: 6, align: 'left', color: 'purple', size: 11.5, weight: 700 });
          sTS.path(D.slice(0, yrs - 1).flatMap((d, k) => [[1985 + k, d], [1986 + k, d]]), { color: 'red', width: 2.6 });
          sTS.vline(start, { color: 'gold', width: 2 });
          sTS.text(`screening from ${start}`, start, H.y, { dx: -11, align: 'right', color: 'gold', size: 11.5, weight: 700 });
          const mean = (arr, a, b) => { let s = 0, n = 0; for (let yv = a; yv <= b; yv++) { const k = yv - 1985; if (k >= 0 && k < arr.length) { s += arr[k]; n++; } } return n ? s / n : NaN; };
          const iB = mean(I, 1985, start - 1), iA = mean(I, 2020, 2024), dB = mean(D, 1985, start - 1), dA = mean(D, 2020, 2024);
          sTS.text('incidence', 1988, Math.max(I[2], I[3]), { dy: -11, align: 'left', color: 'orange', size: 11.5, weight: 700 });
          sTS.text('mortality', 1988, Math.max(D[2], D[3]), { dy: -11, align: 'left', color: 'red', size: 11.5, weight: 700 });
          // survival by year of diagnosis
          const S5 = Array.from(dx5, (x, k) => (dxN[k] ? x / dxN[k] : NaN)), S5s = S5.map((x, k) => { let a = 0, b = 0; for (let j = k - 1; j <= k + 1; j++) if (j >= 0 && j < S5.length && isFinite(S5[j]) && (j < start - 1985) === (k < start - 1985)) { a += dx5[j]; b += dxN[j]; } return b ? a / b : NaN; });
          sS.vline(start, { color: 'gold', width: 1.4 });
          sS.path(S5s.slice(0, 2020 - 1985).map((s, k) => [1985.5 + k, s]), { color: 'green', width: 2.4 });
          sS.dots(S5.slice(0, 2020 - 1985).map((s, k) => [1985.5 + k, s]), { r: 2, color: 'green', alpha: 0.5 });
          sS.text('line: 3-year average · dots: single years', 1988, 0.17, { align: 'left', color: 'muted', size: 10.5 });
          const sB = mean(S5, 1985, start - 1), sA = mean(S5, 2015, 2019);
          // icon array: composition of screen-detected cases from start+5 to 2024
          let pr = 0, ov = 0; for (let yv = start + 5; yv <= 2024; yv++) { const k = yv - 1985; ov += O[k]; pr += I[k] - O[k]; }
          const share = ov + pr > 0 ? ov / (ov + pr) : 0, nOv = Math.round(100 * share);
          sR.setTitle('100 cancers diagnosed after screening began');
          iconArray(sR, 100, 10, (i) => (i < 100 - nOv ? { color: 'orange', r: 5.5 } : { color: 'purple', r: 5.2, hollow: true }));
          sR.text(`${nOv}% overdiagnosed: would never have caused harm`, 5, -0.8, { align: 'center', color: 'purple', size: 11.5, weight: 700 });
          st = { start, iB, iA, dB, dA, sB, sA, nOv, cure };
        });
        v.legend([['orange', 'progressive cancers diagnosed', { area: true }], ['purple', 'overdiagnosed (never harmful)', { area: true }], ['red', 'mortality'], ['green', '5-year survival'], ['gold', 'screening starts']]);
        v.readout(() => {
          if (!st) return '';
          const { start, iB, iA, dB, dA, sB, sA, nOv, cure } = st, r1 = (x) => v.fix(x, 1);
          return `before ${start}: incidence ${r1(iB)}, mortality ${r1(dB)} per 100 000 a year · 2020–24: incidence **${r1(iA)}** (× ${v.fix(iA / iB, 2)}), mortality **${r1(dA)}** (× ${v.fix(dA / dB, 2)}) · 5-year survival ${pc(sB, 0)} → ${pc(sA, 0)} · ${nOv}% of cancers diagnosed since screening are overdiagnosed` +
            (cure > 0 ? ' — early treatment with a real benefit is what finally lowers mortality' : ' — more “cancers”, better “survival”, the same number of deaths');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Concept',
      name: 'Spectrum bias in test evaluation',
      credit: 'Ransohoff & Feinstein, 1978',
      statement: String.raw`A test's sensitivity and specificity are averages over the patients in whom they are measured, so they depend on the **spectrum** of those patients: how severe the disease is among the diseased, and which other conditions are present among the non-diseased. A study that compares clear-cut, severe cases with healthy volunteers (a "two-gate", case–control design) overestimates both, because it leaves out the mild cases that are hard to detect and the look-alike conditions that produce false positives. Accuracy estimated in that way does not transfer to the patients in whom the test will actually be used — consecutive patients in whom the disease is suspected. For example, a rapid urine dipstick for urinary tract infection had sensitivity $0.92$ in 107 patients with a high clinical probability of infection but $0.56$ in 259 with a low one (Lachs et al., 1992).`,
      idea: String.raw`Within the diseased the test's score has a different distribution in mild and severe disease, and within the non-diseased a different one in healthy people and in patients with mimicking conditions. The sensitivity of the whole group is the mixture $\text{Se} = (1-m)\,\text{Se}_{\text{severe}} + m\,\text{Se}_{\text{mild}}$ with $m$ the share of mild cases, and likewise for specificity with the share of mimics; the extremes of the spectrum give the best-looking mixture. So "sensitivity and specificity do not depend on prevalence" (2.1) holds only while the spectrum is fixed. Ransohoff and Feinstein (1978) traced the rise and fall of tests such as carcinoembryonic antigen to exactly this: early studies on florid cases and healthy controls, later disappointment in real clinics.`,
      caption: String.raw`Four groups' scores: healthy volunteers (blue), patients with a look-alike condition (teal), mild disease (orange) and severe disease (red). Drag the cut-off. A case–control study of severe cases against healthy volunteers sees only the solid curves; a clinic sees all four, mixed in the proportions set by the sliders. Compare the two ROC curves and the two pairs of accuracy figures, and the published example at the bottom right: the same dipstick, two ends of the clinical spectrum.`,
      deps: ['epi-2.1'],
      see: ['epi-2.2'],
      refs: ['Gordis ch. 5'],
      tags: ['diagnostic tests', 'bias', 'spectrum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spectrum_bias' },
      viz(v) {
        const M = v.M, N01 = M.dist.normal(0, 1), G = [
          { key: 'h', name: 'healthy volunteers', mu: 0, color: 'blue', dis: false, cc: true },
          { key: 'x', name: 'look-alike condition', mu: 1.3, color: 'teal', dis: false, cc: false },
          { key: 'm', name: 'mild disease', mu: 1.7, color: 'orange', dis: true, cc: false },
          { key: 's', name: 'severe disease', mu: 3.4, color: 'red', dis: true, cc: true },
        ];
        const sD = v.stage({ x: [-3.2, 6.6], y: [0, 0.5], height: 230, full: true, axes: 'box', yticks: [], xlabel: 'test score' });
        const sR = v.stage({ x: [-0.13, 1.03], y: [-0.1, 1.13], height: 270, axes: 'box', xlabel: '1 − specificity', ylabel: 'sensitivity', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [0.2, 0.4, 0.6, 0.8, 1], weight: 0.9, minWidth: 250, title: 'two ROC curves for one test' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], height: 270, axes: false, weight: 1.1, minWidth: 300, title: 'accuracy as each study would report it' });
        const mS = v.slider('share of mild cases among the diseased (clinic)', 0, 1, 0.5, { step: 0.01, fmt: (x) => pc(x, 0) });
        const kS = v.slider('share of look-alike conditions among the non-diseased (clinic)', 0, 1, 0.5, { step: 0.01, fmt: (x) => pc(x, 0) });
        const H = sD.handle(1.7, 0.012, { color: 'gold', constrain: (x) => [M.clamp(x, -2.5, 5.5), 0.012] });
        const up = (c, mu) => 1 - N01.cdf(c - mu);
        let st = null;
        v.render(() => {
          const m = mS.value, k = kS.value, c = H.x, w = { h: 1 - k, x: k, m, s: 1 - m };
          const seCC = up(c, 3.4), spCC = 1 - up(c, 0), seCl = (1 - m) * up(c, 3.4) + m * up(c, 1.7), spCl = (1 - k) * (1 - up(c, 0)) + k * (1 - up(c, 1.3));
          // ----- densities (each normalized; clinic-only groups hatched)
          const pk = 1 / Math.sqrt(2 * Math.PI);
          sD.setView(null, [0, pk * 1.46]);
          for (const g of G) {
            const f = (x) => M.gaussian(x, g.mu, 1);
            if (g.cc) sD.between(f, () => 0, -3.2, 6.6, { fill: g.color, fillAlpha: 0.16 });
            else sD.between(f, () => 0, -3.2, 6.6, { fill: g.color, fillAlpha: 0.04, hatch: g.color, hatchAlpha: 0.35, hatchAngle: g.dis ? -45 : 45 });
            sD.fn(f, { color: g.color, width: g.cc ? 2.4 : 1.8, dash: g.cc ? null : [5, 4], alpha: 0.4 + 0.6 * (g.cc ? 1 : w[g.key]) });
            const lab = { h: [0, 1.06, 'center'], s: [3.4, 1.06, 'center'], x: [1.22, 1.2, 'right'], m: [1.78, 1.2, 'left'] }[g.key];
            sD.text(g.name, lab[0], pk * lab[1], { align: lab[2], baseline: 'bottom', color: g.color, size: 11, weight: 700 });
          }
          sD.line(c, 0, c, pk * 1.44, { color: 'gold', width: 2 });
          sD.text('test positive →', c, pk * 1.38, { dx: 8, align: 'left', color: 'muted', size: 11 });
          // ----- ROC curves
          const roc = (fSe, fSp) => { const pts = []; for (let t = 7; t >= -4; t -= 0.05) pts.push([1 - fSp(t), fSe(t)]); return pts; };
          const cc = roc((t) => up(t, 3.4), (t) => 1 - up(t, 0)), cl = roc((t) => (1 - m) * up(t, 3.4) + m * up(t, 1.7), (t) => (1 - k) * (1 - up(t, 0)) + k * (1 - up(t, 1.3)));
          const auc = (pairs) => pairs.reduce((s, [wa, ma, wb, mb]) => s + wa * wb * N01.cdf((ma - mb) / Math.SQRT2), 0);
          const aCC = auc([[1, 3.4, 1, 0]]), aCl = auc([[1 - m, 3.4, 1 - k, 0], [1 - m, 3.4, k, 1.3], [m, 1.7, 1 - k, 0], [m, 1.7, k, 1.3]]);
          sR.rect(0, 0, 1, 1, { color: 'grid', width: 1 });
          sR.line(0, 0, 1, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          sR.path(cc, { color: 'purple', width: 2.2, dash: [6, 4] }); sR.path(cl, { color: 'accent', width: 2.6 });
          sR.dot(1 - spCC, seCC, { r: 5.5, color: 'purple' }); sR.dot(1 - spCl, seCl, { r: 5.5, color: 'accent' });
          sR.line(1 - spCC, seCC, 1 - spCl, seCl, { color: 'gold', width: 1.4, dash: [2, 3] });
          sR.text(`case–control AUC ${v.fix(aCC, 2)}`, 0.97, 0.2, { align: 'right', color: 'purple', size: 11.5, weight: 700 });
          sR.text(`clinic AUC ${v.fix(aCl, 2)}`, 0.97, 0.1, { align: 'right', color: 'accent', size: 11.5, weight: 700 });
          // ----- bars: Se and Sp by design, then the Lachs example
          const bar = (y, lab, val, col) => { const x0 = 0.47, x1 = 0.88; sB.text(lab, x0 - 0.02, y, { align: 'right', color: col, size: 10.5 }); sB.rect(x0, y - 0.028, x1, y + 0.028, { fill: 'grid', fillAlpha: 0.6, stroke: false }); sB.rect(x0, y - 0.028, x0 + (x1 - x0) * val, y + 0.028, { fill: col, fillAlpha: 0.75, stroke: false }); sB.text(pc(val, 0), x1 + 0.012, y, { align: 'left', color: 'ink', size: 11, weight: 600 }); };
          sB.text('sensitivity', 0.02, 0.94, { align: 'left', color: 'ink', size: 11.5, weight: 700 });
          bar(0.86, 'case–control (severe only)', seCC, 'purple'); bar(0.78, 'clinic (realistic mix)', seCl, 'accent');
          sB.text('specificity', 0.02, 0.67, { align: 'left', color: 'ink', size: 11.5, weight: 700 });
          bar(0.59, 'case–control (healthy only)', spCC, 'purple'); bar(0.51, 'clinic (realistic mix)', spCl, 'accent');
          sB.line(0.02, 0.4, 0.98, 0.4, { color: 'grid', width: 1 });
          sB.text('published: urine dipstick for UTI, sensitivity (Lachs et al. 1992)', 0.02, 0.32, { align: 'left', color: 'ink', size: 11, weight: 700 });
          bar(0.22, 'high prior probability (n = 107)', 0.92, 'red'); bar(0.13, 'low prior probability (n = 259)', 0.56, 'orange');
          st = { c, seCC, spCC, seCl, spCl, aCC, aCl, m, k };
        });
        v.legend([['red', 'severe disease', { area: true }], ['orange', 'mild disease', { area: true }], ['teal', 'look-alike condition', { area: true }], ['blue', 'healthy volunteers', { area: true }], ['purple', 'case–control study', { dash: true }], ['accent', 'clinic population']]);
        v.readout(() => {
          if (!st) return '';
          const { c, seCC, spCC, seCl, spCl, aCC, aCl, m, k } = st;
          return `cut-off ${v.fix(c, 2)}: a case–control study (severe cases vs healthy volunteers) reports **Se ${pc(seCC)}, Sp ${pc(spCC)}**; in the clinic (${pc(m, 0)} mild cases, ${pc(k, 0)} look-alikes) the same test has **Se ${pc(seCl)}, Sp ${pc(spCl)}** · Se = ${v.fix(1 - m, 2)}×${v.fix(up(c, 3.4), 3)} + ${v.fix(m, 2)}×${v.fix(up(c, 1.7), 3)} · AUC ${v.fix(aCC, 2)} vs ${v.fix(aCl, 2)}`;
        });
      },
    },
  ],
};
