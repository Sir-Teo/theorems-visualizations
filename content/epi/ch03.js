// Epidemiology & Evidence — Chapter 3: Measures of association and effect (items 3.1–3.7; 3.9–3.13 are in ch03-b.js)
import { int, pc, pcs, sig3, odds, oneIn, ONE_IN_TICKS, RATIO_TICKS, riskDot, table22, cells22 } from './ch03.shared.js';

export default {
  collection: 'epi',
  chapter: 3,
  title: 'Measures of association and effect',
  summary: String.raw`Comparing exposed and unexposed groups yields ratio and difference measures that answer different questions. Relative risks can look dramatic while absolute differences are tiny, which is why the number needed to treat matters to patients. Odds ratios approximate risk ratios only for rare outcomes, attributable fractions estimate what prevention could achieve, and whether two causes interact depends on the scale chosen.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'The 2×2 table',
      statement: String.raw`Cross-classify a group of people by exposure (exposed / unexposed) and outcome (cases / non-cases). The four cell counts $a, b, c, d$ hold everything a binary exposure and a binary outcome can tell us:

$$\begin{array}{c|cc|c} & \text{outcome} & \text{no outcome} & \text{total}\\ \hline \text{exposed} & a & b & a+b\\ \text{unexposed} & c & d & c+d\end{array}$$

From a **cohort** (exposure fixed, outcomes counted) the row proportions are risks, $R_1 = a/(a+b)$ and $R_0 = c/(c+d)$, giving the risk ratio $R_1/R_0$ (3.2), the risk difference $R_1 - R_0$ (3.3) and the odds ratio $ad/(bc)$ (3.6). In a **case–control** study the investigator chooses how many cases and non-cases (controls) to sample, so the column totals say nothing about how common the outcome is: only the cross-product ratio $ad/(bc)$ survives sampling, and risks, their ratio and their difference are not estimable from the table alone.`,
      idea: String.raw`The table is the full likelihood-bearing summary of a binary exposure and outcome. Within a row, proportions estimate the risks (1.1) of that exposure group; within a column, they estimate the exposure distribution among cases or non-cases. Sampling within a column multiplies the cells of that column by a common factor: this cancels from the cross-product $ad/(bc)$ but not from $a/(a+b)$ — which is why case–control data can give an odds ratio but not a risk, and why the odds ratio plays the role it does in later chapters. The causal quantities of causal-1.4 are defined for the whole population; the 2×2 table is where they are estimated.`,
      caption: String.raw`Set who is exposed and the two risks; the mosaic draws the four cells as areas (width = exposure group, height = share with the outcome) and the table counts them for 10 000 people. All three effect measures are read off the table. Now switch to a *case–control study*: all cases are kept but only as many controls as cases, so the mosaic and table change completely, the "risks" in the sample are meaningless, and the risk ratio computed from it is wrong — yet the odds ratio does not move.`,
      deps: ['epi-1.1', 'causal-1.4'],
      refs: ['Rothman ch. 4', 'Gordis ch. 11'],
      tags: ['2x2 table', 'effect measures', 'study design'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Contingency_table' },
      viz(v) {
        const N = 10000;
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, weight: 1, minWidth: 280, title: 'mosaic: width = exposure, height = outcome' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 310, weight: 1, minWidth: 280, title: 'the 2×2 table' });
        const des = v.select('the data come from', [{ value: 'cohort', label: 'a cohort: all 10 000 people followed' }, { value: 'cc', label: 'a case–control study: all cases + as many controls' }], 'cohort');
        const pe = v.slider('share of people exposed', 0.02, 0.98, 0.3, { step: 0.01, fmt: (x) => pcs(x) });
        const R0 = v.slider('risk if unexposed', 0.001, 0.5, 0.04, { log: true, fmt: (x) => pcs(x) });
        const R1 = v.slider('risk if exposed', 0.001, 0.9, 0.1, { log: true, fmt: (x) => pcs(x) });
        const T = table22(v, sT, [0, 0.33, 1, 1], ['exposed', 'unexposed', 'total'], ['outcome', 'no outcome', 'total']);
        let st = null;
        v.render(() => {
          const cc = des.value === 'cc';
          let a = N * pe.value * R1.value, b = N * pe.value * (1 - R1.value), c = N * (1 - pe.value) * R0.value, d = N * (1 - pe.value) * (1 - R0.value);
          if (cc) { const k = (a + c) / (b + d); b *= k; d *= k; }
          const n = a + b + c + d, w1 = (a + b) / n, rr = (a / (a + b)) / (c / (c + d)), rd = a / (a + b) - c / (c + d), or = (a * d) / (b * c);
          // mosaic
          const x0 = 0.05, x1 = 0.95, gap = 0.03, W = x1 - x0 - gap, y0 = 0.14, y1 = 0.93;
          const col = (xa, xb, cs, ns, lab, tag) => {
            const h = cs / (cs + ns), ym = y0 + (y1 - y0) * (1 - h);
            sM.rect(xa, y0, xb, ym, { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 1.2 });
            sM.rect(xa, ym, xb, y1, { fill: 'red', fillAlpha: 0.4, color: 'red', width: 1.2 });
            sM.text(lab, (xa + xb) / 2, 0.08, { align: 'center', color: 'ink', size: 13, weight: 600 });
            if (xb - xa > 0.1) sM.text(`${tag} ${pcs(h)}`, (xa + xb) / 2, ym, { align: 'center', dy: 15, color: 'ink', size: 12 });
          };
          col(x0, x0 + W * w1, a, b, `exposed ${pc(w1, 0)}`, cc ? 'sample share:' : 'risk');
          col(x0 + W * w1 + gap, x1, c, d, 'unexposed', cc ? 'sample share:' : 'risk');
          sM.text(cc ? 'share with the outcome here is set by the design, not by nature' : 'red = outcome, blue = no outcome', 0.5, 0.025, { align: 'center', color: 'muted', size: 11 });
          // table
          const C = cells22(a, b, c, d), nm = [['a', 'b', ''], ['c', 'd', ''], ['', '', '']];
          T.draw({
            colLabels: cc ? ['cases', 'controls', 'total'] : ['outcome', 'no outcome', 'total'],
            value: (i, j) => int(C[i][j]), sub: (i, j) => nm[i][j],
            fill: (i, j) => (i < 2 && j < 2 ? [j ? 'blue' : 'red', i ? 0.1 : 0.3] : i === 2 || j === 2 ? ['gray', 0.08] : null),
            weight: (i, j) => (i === 2 || j === 2 ? 500 : 700),
          });
          const L = (t, y, color, wt = 600) => sT.text(t, 0.5, y, { align: 'center', color, size: 12.5, weight: wt });
          L(cc ? `"risk ratio" ${v.fix(rr, 2)} — wrong: set by the control sampling` : `risk ratio  ${v.fix(R1.value, 3)} ÷ ${v.fix(R0.value, 3)} = ${v.fix(rr, 2)}`, 0.24, cc ? 'orange' : 'ink');
          L(cc ? `"risk difference" ${v.fix(1000 * rd, 0)} per 1 000 — meaningless` : `risk difference  ${v.fix(1000 * rd, 1)} per 1 000`, 0.15, cc ? 'orange' : 'ink');
          L(`odds ratio  ad ÷ bc = ${v.fix(or, 3)}`, 0.06, 'green', 700);
          st = { rr, rd, or, cc, trueRR: R1.value / R0.value, trueOR: odds(R1.value) / odds(R0.value) };
        });
        v.readout(() => st && (st.cc
          ? `case–control sample: odds ratio **${v.fix(st.or, 3)}** = the population's ${v.fix(st.trueOR, 3)} (the same at any control ratio); the ratio of the sample's "risks" is ${v.fix(st.rr, 2)}, not the true risk ratio ${v.fix(st.trueRR, 2)}`
          : `cohort: risk ratio **${v.fix(st.rr, 2)}** · risk difference **${v.fix(1000 * st.rd, 1)} per 1 000** · odds ratio **${v.fix(st.or, 3)}** — three summaries of the same four numbers; the odds ratio exceeds the risk ratio whenever the outcome is common`));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Risk ratio (relative risk)',
      statement: String.raw`Let $R_1$ be the risk (1.1) of the outcome over a given period in an exposed group and $R_0 > 0$ the risk in an unexposed (reference) group. The **risk ratio**, or relative risk, is
$$\mathrm{RR} = \frac{R_1}{R_0} = \frac{a/(a+b)}{c/(c+d)}.$$
$\mathrm{RR} = 1$ means no association; $\mathrm{RR} > 1$ a higher risk with exposure, $\mathrm{RR} < 1$ a lower one. Swapping the roles of the groups inverts it, $\mathrm{RR} \mapsto 1/\mathrm{RR}$, so $\ln \mathrm{RR}$ is the natural scale: doubling and halving are equally far from no effect. From counts, $\ln\widehat{\mathrm{RR}}$ is approximately normal with variance $\tfrac1a - \tfrac1{a+b} + \tfrac1c - \tfrac1{c+d}$ (large counts), giving the usual confidence interval $\widehat{\mathrm{RR}}\,e^{\pm 1.96\,\mathrm{SE}}$. It is defined for a fixed period, and its value depends on that period and on the choice of reference group.`,
      idea: String.raw`A ratio compares two numbers by how many times larger one is, and multiplication is symmetric on a logarithmic scale: $\ln(1/x) = -\ln x$. That is why risk ratios, like all ratios of positive quantities, should be plotted and averaged on a log axis, and why "twice as likely" and "half as likely" are mirror images. The ratio throws away the level of risk: $\mathrm{RR} = 2$ can mean $1\% \to 2\%$ or $30\% \to 60\%$, which is the subject of 3.4. The standard error comes from the delta method applied to the logarithms of two independent binomial proportions.

For independent binomial samples with positive interior risks and both group sizes growing, the delta-method step stat-5.6 linearizes $g(R_1,R_0)=\ln R_1-\ln R_0$. Its gradient is $(1/R_1,-1/R_0)$. Combining it with the two diagonal variance terms gives $(1-R_1)/(n_1R_1)+(1-R_0)/(n_0R_0)$; replacing risks by their sample proportions gives the displayed count formula. This is an asymptotic approximation, not an exact interval, and the logarithmic calculation fails at zero counts.`,
      caption: String.raw`Drag the tops of the two bars (the risks) and watch the risk ratio on the log axis below, with its 95% interval for the group size $n$ per group; the hollow dot is the same comparison made the other way round, mirrored about 1. Click the toggle to take the exposed group as the reference. Make the groups small and the interval swallows 1: a ratio of 2 from a handful of cases is not evidence of anything.`,
      deps: ['epi-3.1', 'stat-5.6'],
      refs: ['Rothman ch. 4'],
      tags: ['risk ratio', 'relative risk', 'effect measures'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Relative_risk' },
      viz(v) {
        const sB = v.stage({ x: [0, 1], y: [0, 0.6], axes: 'box', gutter: true, height: 300, weight: 0.9, minWidth: 260, ylabel: 'risk', xticks: [[0.27, 'unexposed'], [0.73, 'exposed']], yticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], title: 'two risks (drag the bar tops)' });
        const sL = v.stage({ x: [1 / 16, 16], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1.2, minWidth: 300, xticks: RATIO_TICKS, yticks: [], xlabel: 'risk ratio, log scale', title: 'the ratio on a log axis' });
        const nS = v.slider('people per group $n$', 30, 100000, 1000, { log: true, int: true, sig: 2 });
        const inv = v.toggle('take the exposed group as the reference (invert)', false);
        const clampY = (y) => Math.min(0.58, Math.max(0.003, y));
        const h0 = sB.handle(0.27, 0.04, { color: 'blue', r: 7, constrain: (x, y) => [0.27, clampY(y)] });
        const h1 = sB.handle(0.73, 0.1, { color: 'red', r: 7, constrain: (x, y) => [0.73, clampY(y)] });
        let st = null;
        v.render(() => {
          const r0 = h0.y, r1 = h1.y, n = nS.value, rr = r1 / r0, se = Math.sqrt((1 - r1) / (n * r1) + (1 - r0) / (n * r0));
          const lo = rr * Math.exp(-1.96 * se), hi = rr * Math.exp(1.96 * se), flip = inv.value, shown = flip ? 1 / rr : rr;
          sB.rect(0.1, 0, 0.44, r0, { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 1.5 });
          sB.rect(0.56, 0, 0.9, r1, { fill: 'red', fillAlpha: 0.3, color: 'red', width: 1.5 });
          sB.text(pcs(r0), 0.27, r0, { dy: -14, align: 'center', color: 'blue', size: 12.5, weight: 700 });
          sB.text(pcs(r1), 0.73, r1, { dy: -14, align: 'center', color: 'red', size: 12.5, weight: 700 });
          // log panel
          sL.rect(1, 0, 16, 1, { fill: 'red', fillAlpha: 0.05, stroke: false });
          sL.rect(1 / 16, 0, 1, 1, { fill: 'green', fillAlpha: 0.05, stroke: false });
          sL.vline(1, { color: 'ink', width: 1.6 });
          for (const k of [2, 4, 8]) { sL.vline(k, { color: 'faint', dash: [3, 4] }); sL.vline(1 / k, { color: 'faint', dash: [3, 4] }); }
          sL.text('exposure harmful →', 16, 0.93, { align: 'right', dx: -6, color: 'red', size: 11.5 });
          sL.text('← protective', 1 / 16, 0.93, { align: 'left', dx: 6, color: 'green', size: 11.5 });
          const y = 0.5, a = flip ? 1 / hi : lo, b = flip ? 1 / lo : hi;
          sL.line(a, y, b, y, { color: 'accent', width: 4, alpha: 0.5 });
          sL.dot(1 / shown, y, { r: 6, color: 'muted', hollow: true, width: 1.8 });
          sL.line(shown, y - 0.02, 1 / shown, y - 0.02, { color: 'faint', dash: [2, 3], width: 1 });
          sL.dot(shown, y, { r: 7, color: 'accent' });
          sL.text(`RR = ${sig3(shown)}`, shown, y, { dy: -20, align: 'center', color: 'accent', size: 14, weight: 700 });
          sL.text(`95% CI ${sig3(a)} – ${sig3(b)}`, shown, y, { dy: 24, align: 'center', color: 'muted', size: 11.5 });
          st = { rr, shown, lo: a, hi: b, flip, r0, r1, n };
        });
        v.readout(() => st && `RR = ${pcs(st.r1)} ÷ ${pcs(st.r0)} = **${v.fix(st.rr, 2)}**${st.flip ? `, inverted: **${v.fix(1 / st.rr, 2)}**` : ''} · $\\ln \\mathrm{RR} = ${v.fix(Math.log(st.rr), 3)}$ (the inverted ratio has $\\ln = ${v.fix(-Math.log(st.rr), 3)}$) · 95% CI for $n = ${int(st.n)}$ per group: ${sig3(st.lo)} to ${sig3(st.hi)}${st.lo <= 1 && st.hi >= 1 ? ' — includes 1, so chance alone could explain it' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Risk difference (absolute risk)',
      statement: String.raw`With risks $R_1$ (exposed) and $R_0$ (unexposed) over the same period, the **risk difference**, or absolute risk difference (excess risk, attributable risk), is
$$\mathrm{RD} = R_1 - R_0 .$$
It is a number of extra cases per person exposed, usually quoted per 1 000 or per 100 000. It is positive for a harmful exposure and negative for a protective one; $\mathrm{RD} = 0$ means no association. Unlike the ratio, it keeps the units and the level of risk: for large groups $\widehat{\mathrm{RD}}$ is approximately normal with variance $R_1(1-R_1)/n_1 + R_0(1-R_0)/n_0$. Like the risk ratio, it depends on the period and on the reference group.`,
      idea: String.raw`The risk difference is the answer to "how many more people get ill because of this?" — the quantity a person or a health service needs to weigh against costs, which is why its reciprocal is the number needed to treat (3.5) and why the attributable fractions of 3.10 are built from it. If the exposure causes the outcome in everyone it touches (no one is protected), the risk difference is the proportion of exposed people in whom the exposure was responsible for the case.

In independent binomial groups, each sample proportion has variance $R_g(1-R_g)/n_g$. Apply the uncorrelated-sum variance theorem prob-2.2.1 to the treated proportion and the negative of the reference proportion: their covariance vanishes, so the two variances add. This gives the displayed variance of the estimated risk difference exactly under that sampling model. The additional normal approximation is a separate large-sample step; correlated or paired samples require their covariance term.`,
      caption: String.raw`Drag the bar tops. The gap between the bars is the risk difference; to its right two blocks of 1 000 people show the same risks as people, the extra red ones being the excess cases. Compare with the ratio shown below the picture: slide both risks down together keeping the ratio fixed and the red excess shrinks to nothing, while the ratio does not change. A faint dot stands for a fraction of a person (an expected count below 1 per 1 000).`,
      deps: ['epi-3.1', 'prob-2.2.1'],
      refs: ['Rothman ch. 4'],
      tags: ['risk difference', 'absolute risk', 'effect measures'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Absolute_risk_reduction' },
      viz(v) {
        const sB = v.stage({ x: [0, 1], y: [0, 0.6], axes: 'box', gutter: true, height: 320, weight: 0.85, minWidth: 250, ylabel: 'risk', xticks: [[0.27, 'unexposed'], [0.73, 'exposed']], yticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], title: 'the gap between two risks' });
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.2, minWidth: 300, title: 'the same risks as 1 000 people each' });
        const nS = v.slider('people per group $n$', 30, 100000, 2000, { log: true, int: true, sig: 2 });
        const clampY = (y) => Math.min(0.58, Math.max(0.0005, y));
        const h0 = sB.handle(0.27, 0.04, { color: 'blue', r: 7, constrain: (x, y) => [0.27, clampY(y)] });
        const h1 = sB.handle(0.73, 0.1, { color: 'red', r: 7, constrain: (x, y) => [0.73, clampY(y)] });
        const I = v.icons(sI, { n: 2000, order: 'index', region: [0, 0.02, 1, 1], block: (i) => (i < 1000 ? 0 : 1), blockLabels: (k) => (k ? 'exposed' : 'unexposed') });
        let st = null;
        v.render(() => {
          const r0 = h0.y, r1 = h1.y, rd = r1 - r0, n = nS.value, se = Math.sqrt((r1 * (1 - r1) + r0 * (1 - r0)) / n);
          sB.rect(0.1, 0, 0.44, r0, { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 1.5 });
          sB.rect(0.56, 0, 0.9, r1, { fill: 'red', fillAlpha: 0.15, color: 'red', width: 1.5 });
          sB.rect(0.56, Math.min(r0, r1), 0.9, Math.max(r0, r1), { fill: rd >= 0 ? 'red' : 'green', fillAlpha: 0.5, stroke: false });
          sB.hline(r0, { color: 'blue', dash: [4, 4], width: 1.2 });
          sB.measure(0.5, r0, 0.5, r1, '');
          sB.corner(`RD = ${v.fix(1000 * rd, rd > 0.01 ? 0 : 1)} per 1 000`, 'tr', { color: 'red', weight: 700 });
          sB.text(pcs(r0), 0.27, r0, { dy: -14, align: 'center', color: 'blue', size: 12.5, weight: 700 });
          sB.text(pcs(r1), 0.73, r1, { dy: -14, align: 'center', color: 'red', size: 12.5, weight: 700 });
          const b = 1000 * r0, e = 1000 * r1;
          I.set({ rest: { color: 'muted', alpha: 0.28 }, style: (i) => (i < 1000 ? riskDot(i, b, b, 'blue', 'blue') : riskDot(i - 1000, Math.min(b, e), e, 'blue', 'red', true)) });
          I.draw();
          st = { r0, r1, rd, se, n };
        });
        v.readout(() => st && `RD = ${pcs(st.r1)} − ${pcs(st.r0)} = **${v.fix(1000 * st.rd, 1)} extra cases per 1 000** exposed (${oneIn(Math.abs(st.rd))} people) · RR = ${sig3(st.r1 / st.r0)} · 95% CI of the RD for $n = ${int(st.n)}$ per group: ${v.fix(1000 * (st.rd - 1.96 * st.se), 1)} to ${v.fix(1000 * (st.rd + 1.96 * st.se), 1)} per 1 000`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Concept',
      name: 'Relative versus absolute risk',
      statement: String.raw`Fix the risk ratio $\mathrm{RR}$ of an exposure and let the baseline risk $R_0$ vary. The risk difference is then
$$\mathrm{RD} = (\mathrm{RR} - 1)\,R_0,$$
proportional to the baseline: an exposure that doubles risk adds $R_0$ extra cases per person, whether that is one in ten or one in a million. A relative measure alone therefore cannot say how much an exposure or a treatment matters to an individual; the baseline risk of the person to whom it is applied is also needed. Conversely, a relative effect that is roughly constant across baseline levels (a common empirical finding for treatments) implies absolute effects that vary a great deal.`,
      idea: String.raw`It is the algebra of $R_1 = \mathrm{RR}\cdot R_0$, but its consequences are routinely misjudged: a headline "doubles the risk" says nothing about whether the risk goes from 1 in 10 to 2 in 10 or from 1 in 100 000 to 2 in 100 000. Risk ratios (3.2) travel well between populations; risk differences (3.3) are what a decision turns on, and they depend on where one starts. Reporting both, and the baseline, is the remedy.`,
      caption: String.raw`The risk ratio is held at the value of the slider. **Drag the dot** along the line to choose the baseline risk, from 1 in 3 down to 1 in 100 000: the extra cases per 1 000 people in the exposed block (red) fall in proportion. A faint dot is a fraction of a person; at the bottom of the scale there is, on average, one extra case among 100 000 exposed people. These are illustrative numbers, not data from a particular exposure.`,
      deps: ['epi-3.2', 'epi-3.3'],
      refs: ['Gordis ch. 12'],
      tags: ['relative risk', 'absolute risk', 'communication'],
      viz(v) {
        const sP = v.stage({ x: [3e-5, 0.5], y: [1e-3, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 290, xticks: ONE_IN_TICKS, yticks: [[1e-2, '0.01'], [1, '1'], [100, '100'], [1e4, '10 000']], xlabel: 'baseline risk R₀ (unexposed)', ylabel: 'extra cases per 100 000 exposed', title: 'extra cases = (RR − 1) · R₀' });
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.1, minWidth: 300, title: '1 000 unexposed and 1 000 exposed people' });
        const rrS = v.slider('risk ratio RR', 1.1, 10, 2, { step: 0.05 });
        const H = sP.handle(0.1, 1e4, { color: 'gold', r: 8, constrain: (x) => { const r = Math.min(0.4, Math.max(5e-5, x)); return [r, (rrS.value - 1) * r * 1e5]; } });
        const I = v.icons(sI, { n: 2000, order: 'index', region: [0, 0.02, 1, 1], block: (i) => (i < 1000 ? 0 : 1), blockLabels: (k) => (k ? 'exposed' : 'unexposed') });
        let st = null;
        v.render(() => {
          const rr = rrS.value, r0 = H.x, rd = (rr - 1) * r0, b = 1000 * r0, e = 1000 * rr * r0;
          sP.fn((x) => (rr - 1) * x * 1e5, { domain: [3e-5, 0.5], color: 'red', width: 2.4 });
          H.set(H.x, (rr - 1) * H.x * 1e5);
          sP.line(H.x, 1e-3, H.x, (rr - 1) * H.x * 1e5, { color: 'gold', dash: [3, 3] });
          I.set({ rest: { color: 'muted', alpha: 0.28 }, style: (i) => (i < 1000 ? riskDot(i, b, b, 'blue', 'blue') : riskDot(i - 1000, b, Math.min(1000, e), 'blue', 'red', true)) });
          I.draw();
          st = { rr, r0, rd };
        });
        v.legend([['blue', 'has the outcome anyway'], ['red', 'extra case caused by the exposure']]);
        v.readout(() => st && `RR = ${v.fix(st.rr, 2)} at every baseline · baseline risk ${pcs(st.r0)} (${oneIn(st.r0)}) → exposed ${pcs(st.rr * st.r0)} · RD = **${sig3(1000 * st.rd)} extra per 1 000** = ${oneIn(st.rd)} exposed people per extra case`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Number needed to treat',
      credit: 'Laupacis, Sackett & Roberts, 1988',
      statement: String.raw`If a treatment lowers the risk of an adverse outcome over a stated period from $R_0$ (control) to $R_1$ (treated), the **absolute risk reduction** is $\mathrm{ARR} = R_0 - R_1$ and the **number needed to treat** is
$$\mathrm{NNT} = \frac{1}{\mathrm{ARR}} = \frac{1}{R_0\,(1-\mathrm{RR})},$$
the average number of patients who must be treated for the stated period for one more of them to avoid the outcome. (For a harmful exposure, the same quantity with $R_1 > R_0$ is the **number needed to harm**.) It is defined for one outcome and one time horizon, applies to a population with baseline risk $R_0$, and is usually rounded up; confidence limits are obtained by inverting those of the ARR, and become uninterpretable if the ARR interval contains 0.`,
      idea: String.raw`The NNT is just the risk difference (3.3) turned upside down: if treatment saves $\mathrm{ARR}$ events per patient, then $1/\mathrm{ARR}$ patients are needed per event saved. Because $\mathrm{ARR} = R_0(1 - \mathrm{RR})$, a treatment with a constant relative effect has an NNT inversely proportional to the baseline risk (3.4): the same drug may need 4 patients treated in a high-risk group and 4 000 in a low-risk one. The term was proposed by Laupacis, Sackett and Roberts (1988) to express the consequences of treatment in a form clinicians can weigh against its harms and costs.`,
      caption: String.raw`The treatment cuts the risk by a fixed *relative* amount (slider). **Drag the dot** along the NNT curve to change the baseline risk of the patients: the NNT runs from thousands at the left of the picture to single digits at the right, for exactly the same drug. The blocks show 1 000 untreated and 1 000 treated patients; green dots are events avoided. Add a harm rate to see the NNT set against the number needed to harm. Numbers are illustrative.`,
      deps: ['epi-3.3'],
      refs: ['Gordis ch. 12'],
      tags: ['NNT', 'absolute risk reduction', 'clinical decisions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Number_needed_to_treat' },
      viz(v) {
        const sP = v.stage({ x: [1e-3, 0.8], y: [1, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 290, xticks: ONE_IN_TICKS.slice(0, 4), yticks: [[1, '1'], [10, '10'], [100, '100'], [1000, '1 000'], [10000, '10 000']], xlabel: 'baseline risk of the untreated patients', ylabel: 'NNT', title: 'NNT = 1 ÷ (R₀ × relative reduction)' });
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.1, minWidth: 300, title: '1 000 untreated and 1 000 treated patients' });
        const rrr = v.slider('relative risk reduction', 0.05, 0.9, 0.25, { step: 0.01, fmt: (x) => pc(x, 0) });
        const harm = v.slider('absolute risk of a serious side effect when treated', 0, 0.05, 0, { step: 0.0005, fmt: (x) => pcs(x) });
        const H = sP.handle(0.1, 40, { color: 'gold', r: 8, constrain: (x) => { const r = Math.min(0.75, Math.max(1.2e-3, x)); return [r, 1 / (r * rrr.value)]; } });
        const I = v.icons(sI, { n: 2000, order: 'index', region: [0, 0.02, 1, 1], block: (i) => (i < 1000 ? 0 : 1), blockLabels: (k) => (k ? 'treated' : 'untreated') });
        let st = null;
        v.render(() => {
          const f = rrr.value, r0 = H.x, arr = r0 * f, nnt = 1 / arr, r1 = r0 * (1 - f);
          for (const [ff, al] of [[0.1, 0.35], [0.5, 0.35]]) sP.fn((x) => 1 / (x * ff), { domain: [1e-3, 0.8], color: 'faint', width: 1.2, alpha: al, dash: [4, 4] });
          sP.fn((x) => 1 / (x * f), { domain: [1e-3, 0.8], color: 'accent', width: 2.4 });
          sP.text('dashed: relative reduction 10% (upper), 50% (lower)', 1.3e-3, 2.2, { align: 'left', color: 'muted', size: 10.5 });
          H.set(r0, nnt);
          sP.line(r0, 1, r0, nnt, { color: 'gold', dash: [3, 3] }); sP.line(1e-3, nnt, r0, nnt, { color: 'gold', dash: [3, 3] });
          const b = 1000 * r1, e = 1000 * r0;
          I.set({ rest: { color: 'muted', alpha: 0.28 }, style: (i) => (i < 1000 ? riskDot(i, e, e, 'blue', 'blue') : riskDot(i - 1000, b, e, 'blue', 'green', true)) });
          I.draw();
          st = { f, r0, r1, arr, nnt, hm: harm.value };
        });
        v.legend([['blue', 'event despite treatment (or untreated)'], ['green', 'event avoided by treatment']]);
        v.readout(() => st && `baseline risk ${pcs(st.r0)} → ${pcs(st.r1)} treated: ARR = ${pcs(st.arr)} · **NNT = ${sig3(st.nnt)}** (treat ${int(Math.ceil(st.nnt - 1e-9))} patients for the period; ${sig3(1000 * st.arr)} events avoided per 1 000 treated)${st.hm > 0 ? ` · side effect in ${pcs(st.hm)}: NNH = ${sig3(1 / st.hm)}; for every patient harmed, ${v.fix(1 / (st.hm * st.nnt), 2)} avoid the outcome` : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Odds ratio',
      statement: String.raw`The **odds** of an outcome with probability $p$ are $p/(1-p)$. For two groups with risks $R_1$ (exposed) and $R_0$ (unexposed) the **odds ratio** is
$$\mathrm{OR} = \frac{R_1/(1-R_1)}{R_0/(1-R_0)} = \frac{a/b}{c/d} = \frac{ad}{bc}.$$
$\mathrm{OR} = 1$ means no association. It is symmetric in the two classifications: the odds ratio of disease given exposure equals the odds ratio of exposure given disease, so it can be estimated from case–control data, where risks cannot (3.1). It always lies farther from 1 than the risk ratio: $\mathrm{OR} > \mathrm{RR} > 1$ if $\mathrm{RR} > 1$ and $\mathrm{OR} < \mathrm{RR} < 1$ if $\mathrm{RR} < 1$. Its logarithm is the coefficient of exposure in a logistic regression, with $\widehat{\mathrm{SE}}(\ln\widehat{\mathrm{OR}}) = \sqrt{1/a + 1/b + 1/c + 1/d}$.`,
      idea: String.raw`Odds stretch probabilities: the map $p \mapsto p/(1-p)$ is nearly the identity for small $p$ and blows up as $p \to 1$, so equal risks ratios become larger odds ratios at high risk. The odds ratio is the one effect measure that is the same whichever margin of the 2×2 table one conditions on, because $ad/(bc)$ is invariant under multiplying a row or a column by a constant — exactly the freedom a case–control sample takes. That, and its role in logistic regression, is why it is used so widely despite being hard to interpret (3.7 says when it can stand in for the risk ratio).`,
      caption: String.raw`**Drag the two dots** along the curve of odds against risk: the grey line connects them. In the right panel the risk ratio and the odds ratio sit on the same log axis; at low risk they coincide, and as the risks grow the odds ratio runs away from 1 faster. Use the share-exposed slider to confirm the identity of the last readout: the odds of exposure among cases divided by the odds of exposure among non-cases is the same number.`,
      deps: ['epi-3.1'],
      refs: ['Rothman ch. 4'],
      tags: ['odds ratio', 'odds', 'effect measures'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Odds_ratio' },
      viz(v) {
        const sO = v.stage({ x: [0, 1], y: [0.02, 60], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'risk p', ylabel: 'odds p/(1 − p)', yticks: [[0.05, '1:20'], [0.1, '1:10'], [0.25, '1:4'], [0.5, '1:2'], [1, '1:1'], [2, '2:1'], [4, '4:1'], [10, '10:1'], [30, '30:1']], title: 'risk to odds' });
        const sR = v.stage({ x: [1 / 16, 16], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xticks: RATIO_TICKS, yticks: [], xlabel: 'ratio, log scale', title: 'risk ratio and odds ratio' });
        const peS = v.slider('share exposed (for the cases-versus-non-cases identity)', 0.05, 0.95, 0.3, { step: 0.01, fmt: (x) => pcs(x) });
        const con = (x) => { const p = Math.min(0.97, Math.max(0.01, x)); return [p, odds(p)]; };
        const h0 = sO.handle(0.15, odds(0.15), { color: 'blue', r: 8, label: 'unexposed', labelPos: 'se', constrain: con });
        const h1 = sO.handle(0.4, odds(0.4), { color: 'red', r: 8, label: 'exposed', labelPos: 'nw', constrain: con });
        let st = null;
        v.render(() => {
          const r0 = h0.x, r1 = h1.x, o0 = odds(r0), o1 = odds(r1), rr = r1 / r0, or = o1 / o0;
          sO.fn(odds, { domain: [0.01, 0.97], color: 'ink', width: 2 });
          sO.line(r0, o0, r1, o1, { color: 'muted', width: 1.5 });
          sO.line(r0, 0.02, r0, o0, { color: 'blue', dash: [3, 3] }); sO.line(r1, 0.02, r1, o1, { color: 'red', dash: [3, 3] });
          sO.hline(1, { color: 'faint', dash: [4, 4], width: 1 });
          sR.vline(1, { color: 'ink', width: 1.6 });
          for (const k of [2, 4, 8]) { sR.vline(k, { color: 'faint', dash: [3, 4] }); sR.vline(1 / k, { color: 'faint', dash: [3, 4] }); }
          sR.line(rr, 0.7, or, 0.7, { color: 'muted', width: 1.5, dash: [3, 3] });
          sR.dot(rr, 0.7, { r: 7, color: 'accent' }); sR.text(`RR ${sig3(rr)}`, rr, 0.7, { dy: -18, align: 'center', color: 'accent', size: 13, weight: 700 });
          sR.dot(or, 0.3, { r: 7, color: 'green' }); sR.text(`OR ${sig3(or)}`, or, 0.3, { dy: 20, align: 'center', color: 'green', size: 13, weight: 700 });
          sR.line(or, 0.3, or, 0.7, { color: 'faint', dash: [2, 3] });
          st = { r0, r1, o0, o1, rr, or };
        });
        v.readout(() => {
          if (!st) return '';
          const { r0, r1, o0, o1, rr, or } = st, pe = peS.value, a = pe * r1, b = pe * (1 - r1), c = (1 - pe) * r0, d = (1 - pe) * (1 - r0), orE = (a / c) / (b / d);
          return `odds ${v.fix(o1, 3)} ÷ ${v.fix(o0, 3)} → **OR = ${v.fix(or, 3)}** (RR = ${v.fix(rr, 3)}) · exposure odds among cases ÷ among non-cases $= ${v.fix(orE, 3)}$, the same number · $ad/(bc)$ with $a, b, c, d = ${v.fix(a, 3)}, ${v.fix(b, 3)}, ${v.fix(c, 3)}, ${v.fix(d, 3)}$ (per person)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Rare-disease approximation: OR ≈ RR',
      credit: 'Cornfield, 1951 (the rare-disease argument)',
      statement: String.raw`For risks $0 < R_0, R_1 < 1$ the odds ratio and the risk ratio are related exactly by
$$\mathrm{OR} = \mathrm{RR}\cdot\frac{1-R_0}{1-R_1}, \qquad\text{equivalently}\qquad \frac{\mathrm{OR}}{\mathrm{RR}} - 1 = \frac{R_1 - R_0}{1 - R_1}.$$
Hence if both risks are at most $\varepsilon < 1$, then $1 - \varepsilon \le \mathrm{OR}/\mathrm{RR} \le 1/(1-\varepsilon)$: with $\varepsilon = 10\%$ the odds ratio is within about 11% of the risk ratio, with $\varepsilon = 1\%$ within about 1%. The approximation fails when the outcome is common in either group: $\mathrm{OR}$ then overstates a harmful, and exaggerates a protective, effect. (Risks here are over the same period; the statement is about the exact relation, not about a particular study.)`,
      idea: String.raw`Write $\mathrm{OR} = \dfrac{R_1/(1-R_1)}{R_0/(1-R_0)}$ and separate the ratio of risks from the ratio $(1-R_0)/(1-R_1)$ of "non-risks". Both non-risks are near 1 when the outcome is rare, so the second factor is near 1. This is the justification for reading a case–control odds ratio (3.6) as a risk ratio (3.2) — the argument in Cornfield's 1951 paper (3.13). For common outcomes the factor is not near 1 and the odds ratio can be badly misread as "a risk ratio", which is how the "three times as likely" misreading of an odds ratio arises.`,
      caption: String.raw`The left panel plots the odds ratio against the risk ratio on log axes: for a rare outcome the curve hugs the diagonal; the bold curve is for the baseline risk $R_0$ chosen below, fainter curves show other baselines. **Drag the dot** in the right panel to set $R_0$: it shows the relative error $\mathrm{OR}/\mathrm{RR} - 1$ for the risk ratio set by the slider, which stays under about 10% only while the outcome is rare.`,
      deps: ['epi-3.6', 'epi-3.2'],
      refs: ['Rothman ch. 4'],
      tags: ['odds ratio', 'rare disease', 'case-control'],
      viz(v) {
        const sA = v.stage({ x: [0.25, 8], y: [0.25, 16], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 290, xticks: [[0.25, '1/4'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4'], [8, '8']], yticks: [[0.25, '1/4'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4'], [8, '8'], [16, '16']], xlabel: 'risk ratio', ylabel: 'odds ratio', title: 'OR against RR, for several baselines' });
        const sE = v.stage({ x: [0.001, 0.5], y: [-0.6, 3], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 290, xticks: [[0.001, '0.1%'], [0.01, '1%'], [0.1, '10%'], [0.5, '50%']], yticks: [[-0.5, '−50%'], [0, '0'], [0.5, '+50%'], [1, '+100%'], [2, '+200%']], xlabel: 'baseline risk R₀', ylabel: 'OR ÷ RR − 1', title: 'how wrong is OR as an estimate of RR?' });
        const rrS = v.slider('risk ratio RR', 0.2, 8, 2, { log: true, sig: 2 });
        const err = (r0) => { const r1 = rrS.value * r0; return r1 < 1 ? (r1 - r0) / (1 - r1) : NaN; };
        const H = sE.handle(0.1, 0, { color: 'gold', r: 8, constrain: (x) => { const r = Math.min(0.5, Math.max(0.001, x)); const e = err(r); return [r, isFinite(e) ? Math.min(3, Math.max(-0.6, e)) : 3]; } });
        let st = null;
        v.render(() => {
          const rr = rrS.value, r0 = H.x, r1 = rr * r0;
          sA.fn((x) => x, { domain: [0.25, 8], color: 'ink', width: 1.5, dash: [5, 4] });
          for (const b of [0.01, 0.1, 0.3, 0.5]) sA.fn((x) => (x * b < 1 ? (x * (1 - b)) / (1 - x * b) : NaN), { domain: [0.25, Math.min(8, 0.999 / b)], color: 'faint', width: 1.2 });
          const lim = Math.min(8, 0.999 / r0);
          sA.fn((x) => (x * r0 < 1 ? (x * (1 - r0)) / (1 - x * r0) : NaN), { domain: [0.25, lim], color: 'accent', width: 2.6 });
          if (r1 < 1) { const or = rr * (1 - r0) / (1 - r1); sA.dot(rr, or, { r: 7, color: 'gold' }); sA.dot(rr, rr, { r: 5, color: 'ink', hollow: true }); sA.line(rr, rr, rr, or, { color: 'red', width: 2 }); }
          sA.text('dashed: OR = RR', 3.2, 2, { align: 'left', color: 'muted', size: 11 });
          sE.rect(0.001, -0.1, 0.5, 0.1, { fill: 'green', fillAlpha: 0.07, stroke: false });
          sE.hline(0, { color: 'ink', width: 1.2 });
          sE.text('within 10%', 0.5, 0.1, { align: 'right', dx: -6, dy: -9, color: 'green', size: 10.5 });
          sE.vline(0.1, { color: 'faint', dash: [3, 4] });
          sE.fn(err, { domain: [0.001, Math.min(0.5, 0.999 / rr)], color: 'red', width: 2.4 });
          H.set(r0, r1 < 1 ? Math.min(3, Math.max(-0.6, err(r0))) : 3);
          st = { rr, r0, r1 };
        });
        v.readout(() => {
          if (!st) return '';
          const { rr, r0, r1 } = st;
          if (r1 >= 1) return `R₀ = ${pcs(r0)} with RR = ${v.fix(rr, 2)} would make the exposed risk ${pcs(r1)} ≥ 100%: impossible. Lower R₀ or RR.`;
          const or = (rr * (1 - r0)) / (1 - r1);
          return `R₀ = ${pcs(r0)}, R₁ = ${pcs(r1)}: **OR = ${v.fix(or, 3)}** against RR = ${v.fix(rr, 3)} · OR ÷ RR = $(1-R_0)/(1-R_1) = ${v.fix((1 - r0) / (1 - r1), 3)}$ → error **${v.fix(100 * (or / rr - 1), 1)}%**${Math.max(r0, r1) <= 0.1 ? ' (both risks ≤ 10%: within the 11% bound)' : ' — the outcome is not rare; do not read the OR as a risk ratio'}`;
        });
      },
    },
  ],
};
