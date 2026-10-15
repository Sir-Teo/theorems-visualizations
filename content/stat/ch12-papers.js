// Statistics — Chapter 12: landmark paper written early as a flagship item (12.20, Galton 1886).
//
// DATA. Galton's Table I ("Number of adult children of various statures born of 205 mid-parents of various
// statures. All female heights have been multiplied by 1.08"), J. Anthropol. Inst. 15 (1886), p. 248: 928 children.
// Transcribed from R HistData::Galton (928 rows, cross-tabulated here), and checked cell by cell against the York
// transcription of Table I (york.ac.uk/depts/maths/histstat/galton_reg_1.htm) and the scan at galton.org: row and
// column totals (5 7 32 59 48 117 138 120 167 99 64 41 17 14 | 928), the 205 mid-parents and both median columns
// agree. Open-ended classes are coded as in HistData (mid-parents "below" 64.0, "above" 73.0; children "below" 61.7,
// "above" 73.7), which reproduces the usual least-squares slope 0.646.
// Text facts used (pp. 246–255): regression "from 1 to ⅔", child deviate ⅔ of mid-parent deviate, mid-parent ⅓ of
// child's, level of mediocrity 68¼ in, probable errors 1.7 in (population) and 1.5 in (co-family), Plate X ellipses.

const PAR = [64.0, 64.5, 65.5, 66.5, 67.5, 68.5, 69.5, 70.5, 71.5, 72.5, 73.0];      // mid-parent classes (rows)
const CH = [61.7, 62.2, 63.2, 64.2, 65.2, 66.2, 67.2, 68.2, 69.2, 70.2, 71.2, 72.2, 73.2, 73.7]; // child classes
const T1 = [ // T1[row][col]: Galton's Table I, rows from "below" to "above"
  [1, 0, 2, 4, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0],
  [1, 1, 4, 4, 1, 5, 5, 0, 2, 0, 0, 0, 0, 0],
  [1, 0, 9, 5, 7, 11, 11, 7, 7, 5, 2, 1, 0, 0],
  [0, 3, 3, 5, 2, 17, 17, 14, 13, 4, 0, 0, 0, 0],
  [0, 3, 5, 14, 15, 36, 38, 28, 38, 19, 11, 4, 0, 0],
  [1, 0, 7, 11, 16, 25, 31, 34, 48, 21, 18, 4, 3, 0],
  [0, 0, 1, 16, 4, 17, 27, 20, 33, 25, 20, 11, 4, 5],
  [1, 0, 1, 0, 1, 1, 3, 12, 18, 14, 7, 4, 3, 3],
  [0, 0, 0, 0, 1, 3, 4, 3, 5, 10, 4, 9, 2, 2],
  [0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 2, 7, 2, 4],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0],
];
const NMID = [1, 5, 12, 20, 33, 49, 41, 22, 11, 6, 5];                                   // mid-parents per row
const MED_ROW = [null, 65.8, 66.7, 67.2, 67.6, 68.2, 68.9, 69.5, 69.9, 72.2, null];       // Galton: median child per row
const MED_COL = [null, null, 66.3, 67.8, 67.9, 67.7, 67.9, 68.3, 68.5, 69.0, 69.0, 70.0, null, null]; // median mid-parent per column
const MEDIOCRITY = 68.25;
// display centres of the classes (open-ended classes drawn as the 1-inch cell beyond the last heading)
const PX = PAR.map((c, i) => (i === 0 ? 63.5 : i === PAR.length - 1 ? 73.5 : c));
const CY = CH.map((c, j) => (j === 0 ? 61.2 : j === CH.length - 1 ? 74.2 : c));

/** Least-squares summary of the table (HistData coding). */
function tableStats() {
  let n = 0, sx = 0, sy = 0;
  T1.forEach((row, i) => row.forEach((k, j) => { n += k; sx += k * PAR[i]; sy += k * CH[j]; }));
  const mx = sx / n, my = sy / n; let vxx = 0, vyy = 0, vxy = 0;
  T1.forEach((row, i) => row.forEach((k, j) => { const a = PAR[i] - mx, b = CH[j] - my; vxx += k * a * a; vyy += k * b * b; vxy += k * a * b; }));
  vxx /= n; vyy /= n; vxy /= n;
  return { n, mx, my, vxx, vyy, vxy, b: vxy / vxx, bRev: vxy / vyy, r: vxy / Math.sqrt(vxx * vyy) };
}
const ST = tableStats();
const pf = (x, d = 2) => x.toFixed(d).replace('-', '−');
const sg = (x, d = 1) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);

export default {
  collection: 'stat',
  chapter: 12,
  items: [
    // ------------------------------------------------------------------ 12.20
    {
      num: '12.20',
      kind: 'Paper',
      name: 'Regression towards mediocrity in hereditary stature',
      paper: { authors: 'Francis Galton', year: 1886, title: 'Regression Towards Mediocrity in Hereditary Stature', venue: 'Journal of the Anthropological Institute of Great Britain and Ireland 15: 246–263', doi: '10.2307/2841583' },
      introduces: ['stat-12.9', 'popgen-9.4'],
      statement: String.raw`From family records of 205 couples and their 928 adult children (heights of women multiplied by 1.08), Galton found that the **mid-parent** height (the average of the two parents) predicts a child's height, but only partly: measured from the population's "level of mediocrity", 68¼ in, the average child of a group of mid-parents deviates about **two-thirds** as much as they do. Read the other way, the average mid-parent of a group of children deviates only about **one-third** as much as the children: regression runs in both directions, so it cannot be a force pulling each generation toward the middle.

He also observed that the smoothed table has contours that are concentric, similar **ellipses**; their points of vertical and horizontal tangency lie on the two lines of regression, and J. D. Hamilton Dickson confirmed by calculation that the three observed constants (population spread, spread within families, regression ratio) fit what is now called the bivariate normal distribution.

In modern terms: for a bivariate normal pair the conditional mean is linear, $E[Y\mid X=x]=\mu_Y+\rho\frac{\sigma_Y}{\sigma_X}(x-\mu_X)$, and the slope is below 1 whenever the correlation is below 1. Galton's ⅔ is the least-squares slope of child on mid-parent; the scope is a stable population in which height is roughly normal and mating is not by height (he checked: 32 contrasted couples against 27 similar).`,
      idea: String.raw`Galton had already seen in sweet-pea seeds (1877) that offspring of large seeds were smaller than their parents and offspring of small seeds larger, but distrusted the data; his 1884 prize offer for family records gave him human heights. Tabulating children against mid-parents (Table I), he saw that the medians of each row lie on a line flatter than the diagonal, and, by smoothing the table, that equal counts lie on ellipses (Plate X). His explanation, a child inheriting partly from the parents and partly from a "mediocre" remote ancestry, was later replaced by Mendelian genetics, but the statistical discovery stood: the paper introduced **regression to the mean** (stat-12.9, popgen-9.4), the regression line and, through the ellipses, the road to Galton's correlation (1888) and Pearson's product-moment formula. It also exposed the fallacy that still tempts readers: tall parents having shorter children does not make the population shrink, because tall children come mostly from mid-height parents. Fitted by least squares (stat-12.2) to normal data (prob-1.2.5), the slope of child on mid-parent estimates what geneticists now call narrow-sense heritability.`,
      caption: String.raw`Galton's own Table I, 928 children against their mid-parents (each child is a dot placed at random inside its 1-inch cell; switch **display** to see his printed counts or his Plate X smoothing). Drag the gold handle to pick a class of mid-parents (or switch to **select children** and pick a class of children): their group's average is the green dot, pulled back toward 68¼ in. Blue: regression of child on mid-parent (Galton ⅔); purple: mid-parent on child (Galton ⅓); orange: an ellipse of the fitted normal surface, with its points of tangency on the two lines. Right: Galton's printed medians of every row and column, both flatter than the diagonal.`,
      deps: ['stat-12.2', 'prob-1.2.5'],
      refs: [],
      tags: ['regression', 'history', 'Galton'],
      credit: 'Galton, 1886',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Regression_toward_the_mean' },
      viz(v) {
        const M = v.M;
        const mode = v.select('select', [{ value: 'par', label: 'select mid-parents' }, { value: 'ch', label: 'select children' }], 'par', { onChange: () => { hp.visible = mode.value === 'par'; hc.visible = mode.value === 'ch'; } });
        const disp = v.select('display', [{ value: 'dots', label: 'dots' }, { value: 'table', label: 'Table I counts' }, { value: 'plate', label: 'Plate X smoothing' }], 'dots');
        const lev = v.slider('ellipse holds', 0.25, 0.95, 0.5, { step: 0.05, fmt: (x) => `${Math.round(100 * x)}%` });
        const s = v.stage({ x: [63, 74.2], y: [60.4, 75.2], equal: true, height: 420, axes: 'box', xlabel: 'height of mid-parent (in)', ylabel: 'height of adult child (in)', weight: 1.35, title: 'Table I: 928 adult children of 205 mid-parents' });
        const r = v.stage({ x: [63, 74.2], y: [63, 74.2], equal: true, height: 420, axes: 'box', xlabel: 'height of the selected class (in)', ylabel: 'median of the other (in)', weight: 0.85, minWidth: 250, title: 'both ways: Galton’s medians' });
        // jittered dots, deterministic
        const R = M.rng(1886), dots = [];
        T1.forEach((row, i) => row.forEach((k, j) => { for (let m = 0; m < k; m++) dots.push({ i, j, x: PX[i] - 0.47 + 0.94 * R(), y: CY[j] - 0.47 + 0.94 * R() }); }));
        const hp = s.handle(70.5, 60.9, { color: 'gold', label: 'mid-parents', labelPos: 'n', constrain: (x) => [M.clamp(x, 63.6, 73.4), 60.9] });
        const hc = s.handle(63.4, 71.2, { color: 'gold', label: 'children', labelPos: 'e', constrain: (x, y) => [63.4, M.clamp(y, 61.3, 74.1)] });
        hc.visible = false;
        const rowOf = (x) => PX.reduce((b, c, i) => (Math.abs(c - x) < Math.abs(PX[b] - x) ? i : b), 0);
        const colOf = (y) => CY.reduce((b, c, j) => (Math.abs(c - y) < Math.abs(CY[b] - y) ? j : b), 0);
        // the fitted bivariate normal: ellipse Q(u) = k² with k² = −2 ln(1 − q)
        const C = [[ST.vxx, ST.vxy], [ST.vxy, ST.vyy]], E = M.eigSym2 ? M.eigSym2(ST.vxx, ST.vxy, ST.vyy) : null;
        function ellipsePts(q) {
          const k = Math.sqrt(-2 * Math.log(1 - q)), a = ST.vxx, b = ST.vxy, d = ST.vyy;
          const tr = a + d, det = a * d - b * b, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(tr * tr / 4 - det);
          const th = Math.atan2(l1 - a, b), pts = [];
          for (let t = 0; t <= 200; t++) { const u = (t / 200) * 2 * Math.PI, ex = k * Math.sqrt(l1) * Math.cos(u), ey = k * Math.sqrt(l2) * Math.sin(u); pts.push([ST.mx + ex * Math.cos(th) - ey * Math.sin(th), ST.my + ex * Math.sin(th) + ey * Math.cos(th)]); }
          return { pts, k };
        }
        // Galton's smoothing: at each grid intersection, the sum of the four adjacent cells
        const smooth = (x, y) => {
          // bilinear interpolation of the 4-cell sums defined at cell corners
          const gi = (x - 63) , gj = (y - 60.7);
          const cell = (i, j) => (i >= 0 && i < 11 && j >= 0 && j < 14 ? T1[i][j] : 0);
          const corner = (a, b) => cell(a - 1, b - 1) + cell(a, b - 1) + cell(a - 1, b) + cell(a, b);
          const a0 = Math.floor(gi), b0 = Math.floor(gj), fa = gi - a0, fb = gj - b0;
          return (1 - fa) * (1 - fb) * corner(a0, b0) + fa * (1 - fb) * corner(a0 + 1, b0) + (1 - fa) * fb * corner(a0, b0 + 1) + fa * fb * corner(a0 + 1, b0 + 1);
        };
        let sel = null;
        v.legend([['blue', 'child on mid-parent (least squares)'], ['purple', 'mid-parent on child'], ['faint', 'no regression (diagonal)', { dash: true }], ['orange', 'ellipse of equal frequency'], ['green', 'average of the other group', { dot: true }], ['gold', 'Galton’s printed medians', { dot: true }]]);
        v.render(() => {
          const isPar = mode.value === 'par';
          // ---- mediocrity cross-hairs, diagonal
          s.hline(MEDIOCRITY, { color: 'faint', width: 1, dash: [3, 4] }); s.vline(MEDIOCRITY, { color: 'faint', width: 1, dash: [3, 4] });
          s.line(60.4, 60.4, 75.2, 75.2, { color: 'faint', width: 1.4, dash: [7, 5] });
          // ---- selection band
          let iSel = -1, jSel = -1;
          if (isPar) { iSel = rowOf(hp.x); s.rect(PX[iSel] - 0.5, 60.4, PX[iSel] + 0.5, 75.2, { fill: 'gold', fillAlpha: 0.13, stroke: false }); }
          else { jSel = colOf(hc.y); s.rect(63, CY[jSel] - 0.5, 74.2, CY[jSel] + 0.5, { fill: 'gold', fillAlpha: 0.13, stroke: false }); }
          // ---- the data
          if (disp.value === 'dots') {
            for (const d of dots) { const on = d.i === iSel || d.j === jSel; s.dot(d.x, d.y, { r: on ? 2.6 : 2.1, color: on ? 'gold' : 'blue', alpha: on ? 0.95 : 0.42, ring: false }); }
          } else if (disp.value === 'table') {
            for (let i = 0; i < 11; i++) for (let j = 0; j < 14; j++) {
              const k = T1[i][j]; if (!k) continue;
              const on = i === iSel || j === jSel;
              s.rect(PX[i] - 0.5, CY[j] - 0.5, PX[i] + 0.5, CY[j] + 0.5, { fill: on ? 'gold' : 'blue', fillAlpha: Math.min(0.55, 0.05 + k / 70), stroke: false });
              s.text(String(k), PX[i], CY[j], { align: 'center', size: k >= 10 ? 11 : 10.5, weight: on ? 700 : 500, color: on ? 'ink' : 'muted' });
            }
          } else {
            s.contour(smooth, [3, 6, 10, 15, 22, 30, 40], { color: 'blue', width: 1.4, res: 140, labels: true, fmt: (x) => String(x) });
          }
          // ---- ellipse and its tangency points
          const { pts, k } = ellipsePts(lev.value);
          s.path(pts, { color: 'orange', width: 2.2, close: true });
          const sx = Math.sqrt(ST.vxx), sy = Math.sqrt(ST.vyy);
          const vt = [[ST.mx + k * sx, ST.my + k * ST.vxy / sx], [ST.mx - k * sx, ST.my - k * ST.vxy / sx]]; // vertical tangents: on y-on-x line
          const ht = [[ST.mx + k * ST.vxy / sy, ST.my + k * sy], [ST.mx - k * ST.vxy / sy, ST.my - k * sy]]; // horizontal tangents: on x-on-y line
          for (const [x, y] of vt) { s.line(x, y - 0.9, x, y + 0.9, { color: 'orange', width: 1.3 }); s.dot(x, y, { r: 4, color: 'orange' }); }
          for (const [x, y] of ht) { s.line(x - 0.9, y, x + 0.9, y, { color: 'orange', width: 1.3 }); s.dot(x, y, { r: 4, color: 'orange' }); }
          // ---- regression lines
          s.clip(() => {
            s.fn((x) => ST.my + ST.b * (x - ST.mx), { color: 'blue', width: 2.6 });
            s.curve((t) => [ST.mx + ST.bRev * (t - ST.my), t], 60.4, 75.2, { color: 'purple', width: 2.6, n: 2 });
          });
          s.text(`slope ${pf(ST.b, 3)}`, 73.9, ST.my + ST.b * (73.9 - ST.mx), { color: 'blue', weight: 700, size: 12, align: 'right', dy: 14 });
          // ---- the selected group's average
          if (isPar) {
            let n = 0, sm = 0; T1[iSel].forEach((kk, j) => { n += kk; sm += kk * CH[j]; });
            const m = sm / n; sel = { isPar, cls: PAR[iSel], x: PX[iSel], n, m, mids: NMID[iSel], med: MED_ROW[iSel] };
            s.arrow(PX[iSel] + 0.75, PX[iSel], PX[iSel] + 0.75, m, { color: 'green', width: 2, head: 7 });
            s.dot(PX[iSel], m, { r: 6.5, color: 'green' });
          } else {
            let n = 0, sm = 0; T1.forEach((row, i) => { n += row[jSel]; sm += row[jSel] * PAR[i]; });
            const m = sm / n; sel = { isPar, cls: CH[jSel], y: CY[jSel], n, m, med: MED_COL[jSel] };
            s.arrow(CY[jSel], CY[jSel] - 0.75, m, CY[jSel] - 0.75, { color: 'green', width: 2, head: 7 });
            s.dot(m, CY[jSel], { r: 6.5, color: 'green' });
          }
          // ---- right: medians both ways (Galton's printed values) and the means
          r.hline(MEDIOCRITY, { color: 'faint', width: 1, dash: [3, 4] }); r.vline(MEDIOCRITY, { color: 'faint', width: 1, dash: [3, 4] });
          r.line(63, 63, 74.2, 74.2, { color: 'faint', width: 1.4, dash: [7, 5] });
          r.text('no regression', 73.6, 73.6, { color: 'muted', size: 11.5, align: 'right', dy: -10 });
          r.fn((x) => MEDIOCRITY + (2 / 3) * (x - MEDIOCRITY), { color: 'blue', width: 2.2 });
          r.fn((x) => MEDIOCRITY + (1 / 3) * (x - MEDIOCRITY), { color: 'purple', width: 2.2 });
          r.text('⅔: children of a class of mid-parents', 63.3, MEDIOCRITY + (2 / 3) * (64.6 - MEDIOCRITY), { color: 'blue', size: 11.5, weight: 600, dy: 16 });
          r.text('⅓: mid-parents of a class of children', 74, MEDIOCRITY + (1 / 3) * (74 - MEDIOCRITY), { color: 'purple', size: 11.5, weight: 600, align: 'right', dy: 16 });
          MED_ROW.forEach((m, i) => { if (m != null) r.dot(PAR[i], m, { r: i === iSel ? 6.5 : 4.5, color: i === iSel ? 'green' : 'gold', ring: true }); });
          MED_COL.forEach((m, j) => { if (m != null) r.dot(CH[j], m, { r: j === jSel ? 6.5 : 4.5, color: j === jSel ? 'green' : 'gold', ring: true, hollow: j !== jSel, width: 2.2 }); });
          r.corner('filled: row medians · hollow: column medians', 'br', { size: 11 });
        });
        v.readout(() => {
          if (!sel) return '';
          const dev = (x) => x - MEDIOCRITY;
          const sl = sel.isPar
            ? `**${sel.cls === 64 ? 'mid-parents below 64.5 in' : sel.cls === 73 ? 'mid-parents above 72.5 in' : `mid-parents of ${sel.cls} in`}** (${sel.mids} couples, deviate ${sg(dev(sel.cls))} in from 68¼): their ${sel.n} children average **${pf(sel.m)} in**, deviate ${sg(dev(sel.m))} in, a ratio of ${pf(dev(sel.m) / dev(sel.cls))}${sel.med ? ` (Galton's median: ${sel.med})` : ''}`
            : `**${sel.cls === 61.7 ? 'children below 62.2 in' : sel.cls === 73.7 ? 'children above 73.2 in' : `children of ${sel.cls} in`}** (${sel.n} of them, deviate ${sg(dev(sel.cls))} in): their mid-parents average **${pf(sel.m)} in**, deviate ${sg(dev(sel.m))} in, a ratio of ${pf(dev(sel.m) / dev(sel.cls))}${sel.med ? ` (Galton's median: ${sel.med})` : ''}`;
          return `${sl} · least squares on Table I: child on mid-parent slope **${pf(ST.b, 3)}** (Galton: ⅔), mid-parent on child **${pf(ST.bRev, 3)}** (Galton: ⅓), correlation $r$ = ${pf(ST.r, 3)}, means ${pf(ST.mx)} and ${pf(ST.my)} in (Galton's mediocrity 68¼) · the two slopes multiply to $r^2$ = ${pf(ST.b * ST.bRev, 3)}, so both are flatter than the diagonal · today: on Hanley's (2004) transcription of Galton's raw notebook (934 children) the same slope is 0.71; it estimates narrow-sense heritability, put at about 0.8 for height by genome-wide sibling data (Visscher et al. 2006)`;
        });
      },
    },
  ],
};
