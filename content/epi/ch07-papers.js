// Epidemiology — Chapter 7, landmark paper: Ioannidis (2005).
//
// Data (verified):
// - Ioannidis (2005), PLoS Medicine 2(8): e124, open access (journals.plos.org): the formulas PPV = (1 − β)R/(R − βR + α)
//   (Table 1), with bias PPV = ([1 − β]R + uβR)/(R + α − βR + u − uα + uβR) (Table 2), and for n independent studies
//   PPV = R(1 − βⁿ)/(R + 1 − [1 − α]ⁿ − Rβⁿ) (Table 3); Table 4 (nine practical examples, α = 0.05), read from the table
//   image. Recomputing all nine PPVs from the formula reproduces the printed values (0.85, 0.85, 0.41, 0.23, 0.17, 0.20,
//   0.12, 0.0010, 0.0015).
// - How it held up (large replication projects): Open Science Collaboration (2015), Science 349: aac4716 — 36% of 97
//   significant psychology findings replicated at p < 0.05; Camerer et al. (2016), Science 351: 1433 — 11 of 18
//   laboratory economics experiments; Camerer et al. (2018), Nature Human Behaviour 2: 637 — 13 of 21 social-science
//   experiments in Nature and Science; Begley & Ellis (2012), Nature 483: 531 — 6 of 53 landmark preclinical cancer studies.

const T4 = [
  [0.80, 1, 0.10, 0.85, 'Adequately powered RCT, little bias, 1:1 odds'],
  [0.95, 2, 0.30, 0.85, 'Confirmatory meta-analysis of good-quality RCTs'],
  [0.80, 1 / 3, 0.40, 0.41, 'Meta-analysis of small inconclusive studies'],
  [0.20, 1 / 5, 0.20, 0.23, 'Underpowered but well-performed phase I/II RCT'],
  [0.20, 1 / 5, 0.80, 0.17, 'Underpowered, poorly performed phase I/II RCT'],
  [0.80, 1 / 10, 0.30, 0.20, 'Adequately powered exploratory epidemiological study'],
  [0.20, 1 / 10, 0.30, 0.12, 'Underpowered exploratory epidemiological study'],
  [0.20, 1 / 1000, 0.80, 0.0010, 'Discovery-oriented exploratory research, massive testing'],
  [0.20, 1 / 1000, 0.20, 0.0015, 'As before, with more limited bias'],
];
const REPL = [['Begley & Ellis 2012 (cancer biology)', 6, 53], ['Open Science Collab. 2015 (psychology)', 35, 97], ['Camerer et al. 2016 (economics)', 11, 18], ['Camerer et al. 2018 (Nature/Science)', 13, 21]];

/** 2×2 cells per unit of probed relationships (Tables 2 and 3 of the paper). */
function cells(pw, R, u, n, a) {
  const b = 1 - pw, pT = R / (R + 1), pF = 1 / (R + 1);
  if (n > 1) { // n independent studies, no bias (Table 3): a "finding" if at least one is significant
    const tp = pT * (1 - b ** n), fp = pF * (1 - (1 - a) ** n);
    return { tp, fn: pT - tp, fp, tn: pF - fp };
  }
  const tp = pT * ((1 - b) + u * b), fp = pF * (a + u * (1 - a));
  return { tp, fn: pT - tp, fp, tn: pF - fp };
}
const ppvOf = (c) => c.tp / (c.tp + c.fp);
const ratioLabel = (R) => (R >= 1 ? `${+R.toFixed(2)}:1` : `1:${+(1 / R).toPrecision(3)}`);

export default {
  collection: 'epi',
  chapter: 7,
  items: [
    {
      num: '7.10',
      kind: 'Paper',
      name: 'Why Most Published Research Findings Are False',
      paper: { authors: 'John P. A. Ioannidis', year: 2005, title: 'Why Most Published Research Findings Are False', venue: 'PLoS Medicine 2 (8): e124', doi: '10.1371/journal.pmed.0020124' },
      introduces: ['epi-7.8'],
      statement: String.raw`Treat a claimed "research finding" (a result significant at level $\alpha$) as a diagnostic test for whether the probed relationship is real. If $R$ is the pre-study odds that it is real and $1-\beta$ the power, the probability that a claimed finding is true is the **positive predictive value**
$$\text{PPV} = \frac{(1-\beta)R}{R - \beta R + \alpha},$$
which exceeds ½ only when $(1-\beta)R > \alpha$. Bias $u$ (the share of analyses that would not have been findings but are reported as such) and $n$ independent teams chasing the same question both lower it further. With realistic values, PPV is below ½ for most designs, e.g. 0.12 for an underpowered exploratory epidemiological study and 0.001 for discovery research with massive testing, so most claimed findings in such fields are false.

The argument is a model, not a measurement: its conclusion depends on the assumed $R$, power and bias of a field, and it concerns single significant results, not well-replicated ones.`,
      idea: String.raw`Statisticians had long warned that $p < 0.05$ is not the probability that a hypothesis is true (the base-rate logic of screening tests, epi-2.2, and the false positive report probability of Wacholder et al. 2004). Ioannidis put it in the form of a 2×2 table of probed relationships, added bias and multiple teams, and listed six corollaries: findings are less likely true in fields with smaller studies, smaller effects, more tested relationships, more flexible designs and analyses, more financial interest, and hotter competition. The essay, one of the most read papers ever published, became the manifesto of meta-research (epi-7.8), and the large replication projects that followed found replication rates of roughly 10–60% depending on the field, in line with its warning. Critics (e.g. Goodman and Greenland 2007, Jager and Leek 2014) argued that its parameter choices were pessimistic and that "most" is not established; the model itself is not disputed.`,
      caption: String.raw`**Left**: 1,000 probed relationships split into true and false (width) and into claimed findings and not (height): green = true findings, red = false findings. Set the **pre-study odds**, **power**, **bias** $u$ and the number of competing **teams** $n$ (as in the paper, $n > 1$ ignores bias), or pick one of the paper's **Table 4** examples. **Middle**: PPV against the pre-study odds for your settings, with all nine Table 4 examples (numbered points) and the line PPV = ½. **Right**: what large replication projects later found.`,
      deps: ['epi-2.2', 'epi-7.6'],
      refs: [],
      tags: ['meta-research', 'statistics', 'replication'],
      credit: 'John P. A. Ioannidis, 2005',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Why_Most_Published_Research_Findings_Are_False' },
      viz(v) {
        const preset = v.select('Table 4 example', [{ value: 'none', label: 'custom' }, ...T4.map((r, i) => ({ value: String(i), label: String(i + 1) }))], '0', {
          onChange: (k) => { if (k === 'none') return; const r = T4[+k]; logR.set(Math.log10(r[1])); pw.set(r[0]); u.set(r[2]); n.set(1); },
        });
        const logR = v.slider('pre-study odds R (log₁₀)', -4, 1, 0, { step: 0.01, fmt: (x) => ratioLabel(10 ** x) });
        const pw = v.slider('power 1 − β', 0.05, 0.99, 0.8, { step: 0.01 });
        const u = v.slider('bias u', 0, 0.9, 0.1, { step: 0.01 });
        const n = v.slider('teams n', 1, 20, 1, { int: true });
        const alpha = 0.05;
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 240, title: '1,000 probed relationships' });
        const P = v.stage({ x: [1e-4, 10], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.15, minWidth: 260, xlabel: 'pre-study odds R', ylabel: 'PPV', xticks: [[1e-4, '1:10⁴'], [1e-3, '1:1000'], [1e-2, '1:100'], [0.1, '1:10'], [1, '1:1'], [10, '10:1']], title: 'probability a claimed finding is true' });
        const B = v.stage({ x: [0, 1], y: [-0.5, 3.6], axes: false, height: 330, weight: 0.85, minWidth: 230, title: 'replication, 2012–2018' });
        let st = null;
        v.render(() => {
          const R = 10 ** logR.value, nn = Math.round(n.value), uu = nn > 1 ? 0 : u.value;
          const c = cells(pw.value, R, uu, nn, alpha), ppv = ppvOf(c);
          // ---- mosaic
          const pT = R / (R + 1), wT = Math.max(pT, 0.03), enlarged = wT > pT + 1e-9;
          const hTP = c.tp / pT, hFP = c.fp / (1 - pT);
          const x0 = 0.04, x1 = 0.96, y0 = 0.05, y1 = 0.88, W = x1 - x0, H = y1 - y0;
          const xs = x0 + W * wT;
          L.rect(x0, y0 + H * (1 - hTP), xs, y1, { fill: 'green', fillAlpha: 0.75, color: 'green', hatch: enlarged ? 'panel' : false });
          L.rect(x0, y0, xs, y0 + H * (1 - hTP), { fill: 'green', fillAlpha: 0.18, color: 'green' });
          L.rect(xs, y0 + H * (1 - hFP), x1, y1, { fill: 'red', fillAlpha: 0.75, color: 'red' });
          L.rect(xs, y0, x1, y0 + H * (1 - hFP), { fill: 'muted', fillAlpha: 0.12, color: 'muted' });
          L.text(`true ${Math.round(1000 * pT)}`, (x0 + xs) / 2, y1 + 0.05, { size: 11.5, color: 'green', weight: 700, align: xs < 0.3 ? 'left' : 'center' });
          L.text(`false ${Math.round(1000 * (1 - pT))}`, (xs + x1) / 2, y1 + 0.05, { size: 11.5, color: 'muted', weight: 700 });
          const big = (val) => (val >= 10 ? Math.round(val) : v.fix(val, 1));
          L.text(`claimed false: ${big(1000 * c.fp)}`, (xs + x1) / 2, Math.min(y1 - 0.05, y0 + H * (1 - hFP / 2) + 0.0), { size: 12, weight: 700, color: 'ink', plate: true });
          L.text(`claimed true: ${big(1000 * c.tp)}`, Math.max(xs, 0.3) - 0.02, y0 + 0.07, { size: 12, weight: 700, color: 'green', align: 'right', plate: true });
          if (enlarged) L.corner('true sliver widened to be visible', 'bl', { size: 10.5, color: 'muted' });
          // ---- PPV curve
          P.hline(0.5, { color: 'faint', width: 1.2, dash: [4, 4] });
          P.fn((r) => ppvOf(cells(pw.value, r, uu, nn, alpha)), { color: 'accent', width: 2.6 });
          if (nn === 1) P.fn((r) => ppvOf(cells(pw.value, r, 0, 1, alpha)), { color: 'accent', width: 1.2, alpha: 0.45, dash: [5, 4] });
          T4.forEach((r, i) => { P.dot(r[1], r[3], { r: 4.5, color: 'orange' }); P.text(String(i + 1), r[1], r[3], { dx: i === 1 ? 9 : -9, dy: i % 2 ? 10 : -9, size: 11, color: 'orange', weight: 700 }); });
          P.dot(R, ppv, { r: 7, color: 'gold' });
          P.vline(R, { color: 'gold', width: 1, dash: [3, 3] });
          P.corner(`PPV = ${ppv >= 0.01 ? v.fix(ppv, 3) : v.sci(ppv, 2).replace(/\\times/, '×').replace(/[{}^]/g, '')}`, 'tl', { color: 'gold', weight: 700, size: 13, dx: 20 });
          // ---- replication bars
          REPL.forEach(([name, k, tot], i) => {
            const y = 3 - i, f = k / tot;
            B.rect(0.02, y - 0.16, 0.02 + 0.9 * f, y + 0.16, { fill: 'teal', fillAlpha: 0.7, color: 'teal' });
            B.rect(0.02, y - 0.16, 0.92, y + 0.16, { color: 'faint', width: 1 });
            B.text(`${name}`, 0.02, y + 0.33, { size: 10.5, align: 'left', color: 'ink' });
            B.text(`${k}/${tot} = ${Math.round(100 * f)}%`, 0.04 + 0.9 * f, y, { size: 11, align: 'left', weight: 700, color: 'teal', dx: 2 });
          });
          B.line(0.02 + 0.9 * ppv, -0.35, 0.02 + 0.9 * ppv, 3.45, { color: 'gold', width: 2, dash: [5, 4] });
          B.text('your PPV', 0.02 + 0.9 * ppv, -0.35, { size: 10.5, color: 'gold', weight: 700, align: ppv > 0.7 ? 'right' : 'left', dx: ppv > 0.7 ? -4 : 4, baseline: 'bottom' });
          st = { R, c, ppv, nn, uu };
        });
        v.legend([['green', 'true findings', { area: true }], ['red', 'false findings', { area: true }], ['accent', 'PPV(R) for your settings'], ['orange', 'Table 4 examples', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { R, c, ppv, nn, uu } = st;
          const k = preset.value !== 'none' ? +preset.value : -1;
          const match = k >= 0 && Math.abs(10 ** logR.value - T4[k][1]) < 1e-6 * T4[k][1] && Math.abs(pw.value - T4[k][0]) < 1e-9 && Math.abs(u.value - T4[k][2]) < 1e-9 && nn === 1;
          const tab = match ? ` — Table 4, row ${k + 1}: “${T4[k][4]}”, printed PPV **${T4[k][3]}**` : '';
          const crit = (1 - (1 - pw.value)) * R > alpha ? 'more likely true than false' : 'more likely false than true';
          return `R = ${ratioLabel(R)}, power ${v.fix(pw.value, 2)}, ${nn > 1 ? `${nn} independent teams (no bias)` : `bias u = ${v.fix(uu, 2)}`}, α = 0.05: of 1,000 relationships ${v.fix(1000 * (c.tp + c.fp), 1)} are claimed, ${v.fix(1000 * c.tp, 1)} of them true ⇒ **PPV = ${v.fix(ppv, ppv < 0.01 ? 4 : 3)}**${tab}. Without bias a single study is ${crit} since $(1-\\beta)R ${(pw.value * R > alpha) ? '>' : '<'} \\alpha$.`;
        });
      },
    },
  ],
};
