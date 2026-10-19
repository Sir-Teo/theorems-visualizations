// Macroeconomics — Chapter 9, landmark paper: Phillips (1958).
//
// Data (verified):
// - Phillips (1958), Economica 25: 283–299, scanned copy (elearning.unito.it/…/Phillips_Econ58.pdf). The paper prints
//   no table of annual values, so the 53 points of his Figure 1 (1861–1913) and the 10 labelled points of Figure 10
//   (1948–57) were digitised from the 600-dpi scans by automatic dot detection, calibrated on the axis ticks (residual
//   < 0.02 units); unemployment is rounded to 0.1 (the precision of his source). Check: binning the digitised points into
//   his six intervals (0–2, 2–3, 3–4, 4–5, 5–7, 7–11%, upper bound included) reproduces his six crosses, as digitised
//   from the same figure, to within 0.05 in both coordinates.
// - His fitted curve y + 0.900 = 9.638 x^−1.394 (text, p. 290), on which wages are stable at x = 5.47%.
// - Note: an ordinary least-squares fit of log(y + 0.9) on log x through his four crosses below 5% gives b ≈ 11, c ≈ −1.6,
//   not his 9.638 and −1.394; the printed curve runs above the 2–3% cross. The readout shows this.
// - Today: Bank of England, "A millennium of macroeconomic data for the UK", v3.1, sheet A1: unemployment rate
//   (LFS-consistent) and the annual growth of average weekly earnings, 1958–2016. These are earnings, not Phillips's
//   hourly wage rates, so the comparison is indicative.

const FIG1 = [[1.0, 8.96], [1.2, 5.66], [1.7, 1.92], [1.7, 6.81], [1.9, 3.22], [2.0, 3.28], [2.1, 2.79], [2.1, 3.59], [2.1, 1.64], [2.1, 1.96], [2.2, -0.59], [2.4, 0.47], [2.5, 1.23], [2.6, 0.46], [2.7, 1.18], [2.9, 1.85], [3.1, 1.73], [3.2, 3.01], [3.3, -0.61], [3.4, 0.88], [3.4, -1.14], [3.4, -0.16], [3.5, 1.42], [3.6, -0.15], [3.7, 0.84], [3.8, -0.17], [3.8, 3.05], [4.0, -0.18], [4.2, -0.71], [4.2, 1.48], [4.4, -2.2], [4.8, 3.27], [5.0, -1.14], [5.1, 0.23], [5.3, -0.23], [5.3, 0.72], [6.0, 1.73], [6.1, -0.19], [6.1, 1.15], [6.2, -0.81], [6.3, -2.96], [6.3, -2.22], [6.4, -0.8], [6.8, -1.69], [7.2, -0.93], [7.2, -0.32], [7.4, -0.92], [7.8, -0.94], [8.6, -0.97], [8.6, -0.41], [8.8, -0.43], [9.6, -0.43], [10.8, -1.58]];
const CROSSES = [[1.59, 4.96], [2.4, 1.42], [3.55, 0.69], [4.55, 0.11], [5.99, -0.47], [8.43, -0.72]]; // digitised from his Fig. 1
const FIG10 = [[1948, 1.67, 3.94], [1949, 1.54, 1.92], [1950, 1.52, 4.62], [1951, 1.18, 10.49], [1952, 1.96, 6.56], [1953, 1.63, 3.04], [1954, 1.31, 4.37], [1955, 1.05, 6.97], [1956, 1.16, 7.82], [1957, 1.43, 5.52]];
const BOE = [[1958, 2.53, 3.44], [1959, 2.64, 2.73], [1960, 2.14, 5.79], [1961, 2.07, 7.0], [1962, 2.6, 3.48], [1963, 3.1, 4.25], [1964, 2.4, 8.52], [1965, 2.26, 6.76], [1966, 2.47, 6.42], [1967, 3.37, 3.76], [1968, 3.49, 8.45], [1969, 3.5, 7.71], [1970, 3.75, 12.69], [1971, 4.14, 12.0], [1972, 4.34, 12.62], [1973, 3.65, 14.49], [1974, 3.65, 18.92], [1975, 4.5, 28.95], [1976, 5.4, 16.5], [1977, 5.59, 9.97], [1978, 5.51, 13.27], [1979, 5.38, 16.73], [1980, 6.81, 21.47], [1981, 9.65, 13.78], [1982, 10.72, 9.69], [1983, 11.47, 8.67], [1984, 11.77, 6.24], [1985, 11.36, 8.91], [1986, 11.32, 7.95], [1987, 10.43, 7.92], [1988, 8.57, 9.2], [1989, 7.22, 9.58], [1990, 7.1, 10.56], [1991, 8.82, 7.78], [1992, 9.95, 6.0], [1993, 10.37, 2.98], [1994, 9.5, 3.77], [1995, 8.62, 3.26], [1996, 8.1, 3.63], [1997, 6.97, 4.41], [1998, 6.26, 5.2], [1999, 5.98, 4.58], [2000, 5.46, 4.21], [2001, 5.1, 5.14], [2002, 5.19, 3.17], [2003, 5.01, 3.22], [2004, 4.75, 4.36], [2005, 4.83, 4.67], [2006, 5.42, 4.7], [2007, 5.33, 4.88], [2008, 5.69, 3.56], [2009, 7.61, -0.08], [2010, 7.87, 2.3], [2011, 8.11, 2.34], [2012, 7.97, 1.37], [2013, 7.61, 1.17], [2014, 6.18, 1.23], [2015, 5.38, 2.43], [2016, 4.9, 2.37]];
const BANDS = [[0, 2], [2, 3], [3, 4], [4, 5], [5, 7], [7, 11]];
const phillips = (x) => 9.638 * x ** -1.394 - 0.9;

/** Phillips's own procedure: band averages, then log(y + a) = log b + c log x by least squares on the bands below 5%. */
function phillipsFit(M, pts, a) {
  const cr = BANDS.map(([lo, hi]) => { const s = pts.filter((p) => p[0] > lo && p[0] <= hi + 1e-9); return s.length ? [M.mean(s.map((p) => p[0])), M.mean(s.map((p) => p[1])), s.length] : null; });
  const use = cr.slice(0, 4).filter((c) => c && c[1] + a > 0);
  if (use.length < 2) return { cr, b: NaN, c: NaN };
  const r = M.linreg(use.map((c) => Math.log10(c[0])), use.map((c) => Math.log10(c[1] + a)));
  return { cr, b: 10 ** r.intercept, c: r.slope };
}

export default {
  collection: 'macro',
  chapter: 9,
  items: [
    {
      num: '9.11',
      kind: 'Paper',
      name: 'Unemployment and the Rate of Change of Money Wage Rates',
      paper: { authors: 'A. W. Phillips', year: 1958, title: 'The Relation between Unemployment and the Rate of Change of Money Wage Rates in the United Kingdom, 1861–1957', venue: 'Economica 25 (100): 283–299', doi: '10.1111/j.1468-0335.1958.tb00003.x' },
      introduces: ['macro-9.2'],
      statement: String.raw`For the United Kingdom in 1861–1913, Phillips found that the rate of change of money wage rates $y$ (% per year) was a stable, decreasing, strongly convex function of the unemployment rate $x$ (%):
$$y + 0.900 = 9.638\,x^{-1.394},$$
fitted to the averages of six bands of unemployment. Money wages were stable at about $5\tfrac12\%$ unemployment and rose fast when it was low; the same curve described 1913–48 (apart from years of sharp import-price rises) and 1948–57 remarkably well. Departures within each trade cycle formed anticlockwise loops (wages rise faster when unemployment is falling).

In modern terms this is the original Phillips curve (macro-9.2). It holds as a short-run statistical relation for a regime of stable inflation expectations; it is not a stable menu for policy, because the curve shifts with expected inflation (Friedman 1968, Phelps 1967), as the stagflation of the 1970s showed.`,
      idea: String.raw`Phillips, an engineer turned economist (and builder of the hydraulic MONIAC), reasoned that wages respond to excess demand for labour like the price of any good, with unemployment as the inverse measure of excess demand (macro-1.8), and that the response should be non-linear because workers resist wage cuts. He used Phelps Brown and Hopkins' wage index and trade-union unemployment, took the central difference of the index as the rate of change, averaged the 53 years into six unemployment bands to wash out the cycle, and fitted his curve by least squares plus trial and error. Samuelson and Solow (1960) recast it as a trade-off between inflation and unemployment that policy could exploit, which made the curve the centre of 1960s macroeconomics; its breakdown a decade later produced the natural-rate hypothesis, rational expectations and the expectations-augmented curve used in central banks today.`,
      caption: String.raw`**1861–1913**: Phillips's 53 annual points (digitised from his Figure 1), the averages of his six unemployment bands (green crosses, computed; his own crosses as rings) and his curve $y + 0.900 = 9.638x^{-1.394}$ (solid line). Drag **a**, his trial-and-error constant, to refit $b$ and $c$ by least squares through the four low-unemployment bands as he did (gold). **1948–57**: his Figure 10, labelled by year, against the old curve. **1958–2016**: modern UK data (Bank of England) on the same axes; the **window** sliders choose the years to highlight and fit with $y = p + q/x$ (gold). Hover a point for its year.`,
      deps: ['macro-1.8', 'opt-1.6'],
      refs: [],
      tags: ['Phillips curve', 'wages', 'history'],
      credit: 'A. W. H. Phillips, 1958',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phillips_curve' },
      viz(v) {
        const M = v.M;
        const per = v.select('years', [{ value: 'old', label: '1861–1913' }, { value: 'p48', label: '1948–57' }, { value: 'mod', label: '1958–2016 (today)' }], 'old', { onChange: () => sync() });
        const aS = v.slider('$a$ (his trial-and-error constant)', 0.3, 1.6, 0.9, { step: 0.01 });
        const y0 = v.slider('window from', 1958, 2016, 1958, { int: true });
        const y1 = v.slider('window to', 1958, 2016, 1969, { int: true });
        const sync = () => { const m = per.value === 'mod'; y0.el.hidden = !m; y1.el.hidden = !m; aS.el.hidden = per.value !== 'old'; };
        const s = v.stage({ x: [0, 11.5], y: [-4, 11], axes: 'box', gutter: true, height: 400, full: true, hover: true, xlabel: 'unemployment (%)', ylabel: 'rate of change of money wage rates (% per year)', title: 'Phillips’s Figure 1' });
        let st = null;
        v.render(() => {
          const m = per.value;
          const pts = m === 'old' ? FIG1.map((p) => [p[0], p[1], null]) : m === 'p48' ? FIG10.map((p) => [p[1], p[2], p[0]]) : BOE.filter((p) => p[0] >= Math.min(y0.value, y1.value) && p[0] <= Math.max(y0.value, y1.value)).map((p) => [p[1], p[2], p[0]]);
          s.setView(m === 'mod' ? [0, 12.5] : m === 'p48' ? [0, 6] : [0, 11.5], m === 'mod' ? [-4, 30] : m === 'p48' ? [0, 11] : [-4, 11]);
          s.setTitle(m === 'old' ? 'Phillips’s Figure 1: 1861–1913' : m === 'p48' ? 'Phillips’s Figure 10: 1948–57' : 'UK, 1958–2016 (Bank of England data)');
          s.hline(0, { color: 'faint', width: 1 });
          s.fn(phillips, { color: 'ink', width: 2.4, domain: [0.8, 12.5] });
          s.vline(5.47, { color: 'faint', width: 1, dash: [3, 4] });
          const F = phillipsFit(M, pts, aS.value);
          if (m === 'mod') {
            for (const p of BOE) s.dot(p[1], p[2], { r: 3.2, color: 'muted', alpha: 0.45 });
            s.path(pts.map((p) => [p[0], p[1]]), { color: 'teal', width: 1.2, alpha: 0.7 });
          }
          if (m === 'p48') s.path(FIG10.filter((p) => p[0] >= 1953).map((p) => [p[1], p[2]]), { color: 'teal', width: 1.2 });
          for (const p of pts) s.dot(p[0], p[1], { r: m === 'old' ? 4.2 : 5, color: 'accent' });
          if (m === 'p48') for (const p of FIG10) s.text(String(p[0]).slice(2), p[1], p[2], { dx: 9, dy: -6, size: 11.5, color: 'accent', weight: 600, align: 'left' });
          if (m === 'old' && Number.isFinite(F.b)) s.fn((x) => F.b * x ** F.c - aS.value, { color: 'gold', width: 2.2, dash: [7, 4], domain: [0.6, 12.5] });
          let H = null; // modern window: least squares y = p + q/x
          if (m === 'mod' && pts.length >= 3) { const r = M.linreg(pts.map((p) => 1 / p[0]), pts.map((p) => p[1])); H = { p: r.intercept, q: r.slope }; s.fn((x) => H.p + H.q / x, { color: 'gold', width: 2.2, dash: [7, 4], domain: [0.8, 12.5] }); }
          if (m === 'old') {
            for (const c of CROSSES) s.dot(c[0], c[1], { r: 8, hollow: true, color: 'ink', width: 1.4 });
            for (const c of F.cr) if (c) { s.line(c[0] - 0.18, c[1], c[0] + 0.18, c[1], { color: 'green', width: 2.6 }); s.line(c[0], c[1] - 0.45, c[0], c[1] + 0.45, { color: 'green', width: 2.6 }); }
          }
          s.tex(String.raw`y + 0.900 = 9.638\,x^{-1.394}`, m === 'p48' ? 2.3 : m === 'mod' ? 8.5 : 1.3, phillips(m === 'p48' ? 2.3 : m === 'mod' ? 8.5 : 1.3), { dx: 10, dy: -4, size: 14, align: 'left', baseline: 'bottom', color: 'ink' });
          const P = s.pointer;
          if (P.inside && m !== 'old') {
            let best = null, bd = 1e9;
            for (const p of m === 'mod' ? BOE.map((q) => [q[1], q[2], q[0]]) : pts) { const d = Math.hypot(s.X(p[0]) - s.X(P.x), s.Y(p[1]) - s.Y(P.y)); if (d < bd) { bd = d; best = p; } }
            if (best && bd < 16) s.text(`${best[2]}: ${v.fix(best[0], 2)}% unemployed, wages ${best[1] >= 0 ? '+' : ''}${v.fix(best[1], 1)}%`, best[0], best[1], { dx: 10, dy: -14, size: 12, weight: 600, align: best[0] > 8 ? 'right' : 'left', plate: true });
          }
          const stable = Number.isFinite(F.b) ? (F.b / aS.value) ** (-1 / F.c) : NaN;
          const resid = pts.length ? Math.sqrt(M.mean(pts.map((p) => (p[1] - phillips(p[0])) ** 2))) : NaN;
          const bias = pts.length ? M.mean(pts.map((p) => p[1] - phillips(p[0]))) : NaN;
          st = { F, stable, resid, bias, n: pts.length, m, H };
        });
        v.legend([['accent', 'annual observations', { dot: true }], ['ink', 'Phillips’s curve (1861–1913 fit)'], ['green', 'band averages (computed)'], ['gold', 'least-squares refit, his method', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { F, stable, resid, bias, n, m, H } = st;
          const fit = Number.isFinite(F.b) ? `refit with $a = ${v.fix(aS.value, 2)}$: $y + ${v.fix(aS.value, 2)} = ${v.fix(F.b, 2)}\\,x^{${v.fix(F.c, 3)}}$, stable wages at **${v.fix(stable, 2)}%**` : 'too few bands to refit';
          if (m === 'old') return `${fit} — Phillips: $9.638\\,x^{-1.394}$, stable at 5.47% (“about 5½ per cent”). Bands: ${F.cr.map((c) => `(${v.fix(c[0], 2)}, ${v.fix(c[1], 2)})`).join(' ')}; his crosses ${CROSSES.map((c) => `(${c[0]}, ${c[1]})`).join(' ')}. Ordinary least squares through his own crosses does not return his constants exactly — his curve lies above the 2–3% cross.`;
          if (m === 'p48') return `1948–57: mean departure from the 1861–1913 curve ${bias >= 0 ? '+' : ''}${v.fix(bias, 2)} points, rms ${v.fix(resid, 2)} over ${n} years — Phillips: “the points for 1953 to 1957 lie on a narrow loop around this curve”, 1950 very close to it, 1951–52 above it after the import-price surge.`;
          const hf = H ? `least squares on the window: $y = ${v.fix(H.p, 2)} ${H.q >= 0 ? '+' : '-'} ${v.fix(Math.abs(H.q), 2)}/x$ (${H.q > 0 ? 'still a downward-sloping trade-off' : 'no downward slope at all'})` : 'choose at least 3 years';
          return `${n} years, ${Math.min(y0.value, y1.value)}–${Math.max(y0.value, y1.value)}: mean departure from Phillips’s curve **${bias >= 0 ? '+' : ''}${v.fix(bias, 1)} points** (rms ${v.fix(resid, 1)}); ${hf}. In the 1960s earnings grow a few points faster than the old curve allows (partly earnings drift, a different measure from his wage rates) but still fall as unemployment rises; from 1970 they run far above it at every unemployment rate — the curve shifted up with expected inflation, as Friedman (1968) and Phelps predicted, and came back down only once inflation expectations fell.`;
        });
        sync();
      },
    },
  ],
};
