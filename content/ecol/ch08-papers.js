// Ecology — Chapter 8, landmark paper: MacArthur & Wilson (1963).
//
// Data (verified):
// - MacArthur & Wilson (1963), Evolution 17: 373–387 (JSTOR scan hosted at gsp.humboldt.edu). The paper gives the island
//   data only as figures: its Figure 2 (land and freshwater bird species against area, 26 islands of the Moluccas,
//   Melanesia, Micronesia and Polynesia, log–log) and Figure 3 (percent saturation against distance from New Guinea).
//   Both were digitised from the 600-dpi scan by automatic dot detection calibrated on the axis ticks; species counts
//   are ±3% and areas ±5% (log axes). Check: recomputing percent saturation from the Figure 2 values and the paper's
//   saturation line (through Kei and New Guinea) reproduces the Figure 3 values within ±2 points for 23 of 26 islands;
//   for Tanimbar, Buru and Ceram the two printed figures disagree by 10–18 points (left as printed).
// - Table 1 (Krakatau and Verlaten, from Dammerman 1948): non-migrant land and freshwater bird species in 1908, 1919–21
//   and 1932–34: Krakatau 13, 27, 27; Verlaten 1, 27, 29 (text layer and page image).
// - The quantitative model linking area and distance to the equilibrium below (linear immigration and extinction,
//   immigration falling exponentially with distance, extinction set by the saturation line) is a minimal version of the
//   paper's verbal and graphical model, fitted here to its own Figure 3 points; it is illustrative, not the paper's.

// island, area (sq mi), species, distance from New Guinea (mi), percent saturation (Fig. 3)
const ISL = [['Wake', 8.4, 1.0, 2300, 3.9], ['Henderson', 47.0, 4.1, 5310, 9.2], ['Line', 180.0, 2.0, 3290, 3.1], ['Kusaie', 48.0, 9.0, 1300, 21.9], ['Tuamotu', 310.0, 7.9, 4090, 11.0], ['Marquesas', 440.0, 11.0, 4490, 13.7], ['Society', 620.0, 16.8, 3600, 20.0], ['Ponape', 320.0, 18.0, 1200, 25.4], ['Marianas', 370.0, 18.5, 1130, 23.4], ['Tonga', 240.0, 17.8, 2290, 26.9], ['Carolines', 290.0, 27.5, 670, 40.0], ['Palau', 300.0, 30.9, 550, 44.7], ['Santa Cruz', 350.0, 29.3, 900, 42.0], ['Rennell', 570.0, 33.1, 540, 38.7], ['Samoa', 1120.0, 33.8, 2300, 32.4], ['Kei', 540.0, 82.7, 80, 100.3], ['Louisiade', 580.0, 74.6, 70, 90.9], ['D’Entrecasteaux', 1180.0, 90.5, 20, 89.4], ['Tanimbar', 2000.0, 81.1, 220, 78.9], ['Hawaii', 6290.0, 34.7, 3500, 21.2], ['Fiji', 6850.0, 53.1, 1900, 30.9], ['New Hebrides', 5610.0, 50.8, 1100, 31.5], ['Buru', 3440.0, 118.2, 170, 66.0], ['Ceram', 6370.0, 113.5, 90, 58.7], ['Solomons', 15670.0, 123.5, 400, 57.3], ['New Guinea', 306660.0, 510.4, 10, 100.0]];
const KRAK = [[1908, 13, 1], [1920, 27, 27], [1933, 27, 29]]; // year (mid-period), Krakatau, Verlaten
const POOL = 600; // species pool of the source region (model parameter)
// the paper's saturation line through Kei and New Guinea: S = c A^k
const SAT_K = Math.log(510.4 / 82.7) / Math.log(306660 / 540), SAT_C = 82.7 / 540 ** SAT_K;
const sat = (A) => SAT_C * A ** SAT_K;
/** Equilibrium species number for area A (sq mi) and distance d (mi): immigration ∝ e^{−d/d0}, extinction fixed by saturation at d = 0. */
const shat = (A, d, d0) => { const s0 = Math.min(sat(A), POOL * 0.98), e = Math.exp(-d / d0); return (POOL * e) / (e + POOL / s0 - 1); };

export default {
  collection: 'ecol',
  chapter: 8,
  items: [
    {
      num: '8.16',
      kind: 'Paper',
      name: 'An Equilibrium Theory of Insular Zoogeography',
      paper: { authors: 'Robert H. MacArthur and Edward O. Wilson', year: 1963, title: 'An Equilibrium Theory of Insular Zoogeography', venue: 'Evolution 17 (4): 373–387', doi: '10.1111/j.1558-5646.1963.tb03295.x' },
      introduces: ['ecol-8.7', 'ecol-8.8', 'ecol-8.9'],
      statement: String.raw`The number of species on an island is a **dynamic equilibrium** between the arrival of new species, whose rate falls as the island fills (fewer arrivals are new), and the extinction of resident ones, whose rate rises with the number present. Where the two curves cross,
$$I(\hat S) = E(\hat S),$$
the species number $\hat S$ is stable while the identity of the species keeps turning over. Islands farther from the source have lower immigration curves and smaller areas have higher extinction curves, so the equilibrium falls with distance and rises with area, which explains the species–area relation $S = bA^k$ and the "distance effect" seen in Pacific birds: islands far from New Guinea hold a smaller fraction of the species their area would allow.

Scope: an equilibrium idea for islands and island-like habitats on ecological time scales; speciation within archipelagos, habitat diversity and non-equilibrium histories are outside it.`,
      idea: String.raw`The species–area relation (ecol-8.6) was known as an empirical law and was explained, if at all, by habitat diversity. MacArthur and Wilson noticed in Mayr's bird counts that remote Pacific islands are poorer than their area predicts, and argued that this pattern needs a process: continuing colonisation balanced by extinction. They expressed the "percentage saturation" of each island relative to a saturation line through New Guinea and the nearby Kei Islands, showed that it declines regularly with distance, drew the crossing immigration and extinction curves (their Figs. 4 and 5), and tested the predicted rapid turnover on the recolonisation of Krakatau after its 1883 eruption, whose bird fauna was back near equilibrium within about 30 years. The paper and their 1967 book founded island biogeography (ecol-8.7–8.9), inspired Simberloff and Wilson's defaunation experiments on mangrove islets (1969–70) and the design of nature reserves (the SLOSS debate) and of habitat-fragmentation studies.`,
      caption: String.raw`**Left**: the crossing curves for an island you place: drag its **area** and **distance** from New Guinea; the equilibrium $\hat S$ (gold) and the turnover rate sit where immigration (blue) meets extinction (red); faint curves show a near and a far source, a large and a small island as in the paper's Figure 5. **Middle**: the paper's 26 islands (digitised from Figure 2): circles near (< 500 mi), squares far (> 2,000 mi); the black line is its saturation curve; your island is the gold star. **Right**: percent saturation against distance (its Figure 3) with the model curve fitted to these points, or switch to **Krakatau** (Table 1) to watch an empty island refill. Hover a point for its name.`,
      deps: ['ecol-8.6'],
      refs: [],
      tags: ['island biogeography', 'species–area', 'equilibrium'],
      credit: 'Robert MacArthur & E. O. Wilson, 1963',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Insular_biogeography' },
      viz(v) {
        const M = v.M;
        const lA = v.slider('island area (log₁₀ sq mi)', 0.5, 5.5, 3, { step: 0.01, fmt: (x) => `${Math.round(10 ** x).toLocaleString('en-US')} sq mi` });
        const dist = v.slider('distance from New Guinea (mi)', 0, 5000, 1500, { step: 10 });
        const right = v.select('right panel', [{ value: 'dist', label: 'distance effect (Fig. 3)' }, { value: 'krak', label: 'Krakatau (Table 1)' }], 'dist');
        const t90 = v.slider('Krakatau: years to 90% of equilibrium', 5, 60, 25, { step: 1 });
        // fit d0 to the Figure 3 points (least squares on percent saturation)
        const sse = (d0) => ISL.reduce((s, r) => s + (100 * shat(r[1], r[3], d0) / sat(r[1]) - r[4]) ** 2, 0);
        let lo = 100, hi = 5000; for (let i = 0; i < 80; i++) { const a = lo + 0.382 * (hi - lo), b = lo + 0.618 * (hi - lo); if (sse(a) < sse(b)) hi = b; else lo = a; }
        const D0 = (lo + hi) / 2;
        const L = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'species present S', ylabel: 'rate (relative)', title: 'immigration meets extinction' });
        const C = v.stage({ x: [5, 500000], xlog: true, y: [0.8, 800], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 260, hover: true, xlabel: 'area (sq mi)', ylabel: 'bird species', title: 'Pacific birds (Fig. 2)' });
        const R = v.stage({ x: [0, 5500], y: [0, 110], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, hover: true, xlabel: 'distance from New Guinea (mi)', ylabel: 'percent saturation', title: 'the distance effect (Fig. 3)' });
        let st = null;
        v.render(() => {
          const A = 10 ** lA.value, d = dist.value;
          // linear curves in species S: I = i (1 − S/P), E = e S/P, i ∝ e^{−d/D0}, e from the saturation line; scaled so E(Smax) = 1
          const s0 = Math.min(sat(A), POOL * 0.98), iRate = Math.exp(-d / D0), eRate = POOL / s0 - 1;
          const xmax = 1.6 * s0, f = POOL / (eRate * xmax);
          L.setView([0, xmax], [0, 1.05]);
          const Iw = (x, ii) => f * ii * (1 - x / POOL), Ew = (x, ee) => f * ee * (x / POOL);
          for (const [ii, lab] of [[Math.exp(-200 / D0), 'near (200 mi)'], [Math.exp(-4000 / D0), 'far (4,000 mi)']]) { L.fn((x) => Iw(x, ii), { color: 'blue', width: 1, alpha: 0.35, domain: [0, xmax] }); L.text(lab, xmax * 0.98, Iw(xmax * 0.98, ii), { size: 10.5, color: 'blue', align: 'right', dy: -7 }); }
          for (const [AA, lab] of [[A / 20, 'area ÷ 20'], [A * 20, 'area × 20']]) { const ee = POOL / Math.min(sat(AA), POOL * 0.98) - 1; L.fn((x) => Ew(x, ee), { color: 'red', width: 1, alpha: 0.35, domain: [0, xmax] }); const xl = Math.min(xmax * 0.92, 0.95 / (f * ee / POOL)); L.text(lab, xl, Ew(xl, ee), { size: 10.5, color: 'red', align: 'right', dx: -4, dy: -4 }); }
          L.fn((x) => Iw(x, iRate), { color: 'blue', width: 2.6, domain: [0, xmax] });
          L.fn((x) => Ew(x, eRate), { color: 'red', width: 2.6, domain: [0, xmax] });
          const xs = (POOL * iRate) / (iRate + eRate), rate = Iw(xs, iRate);
          L.line(xs, 0, xs, rate, { color: 'gold', width: 1.6, dash: [4, 3] });
          L.dot(xs, rate, { r: 6, color: 'gold' });
          L.text(`Ŝ = ${v.fix(xs, 1)}`, xs, 0, { dy: -8, dx: 6, align: 'left', size: 12, weight: 700, color: 'gold', baseline: 'bottom', plate: true });
          // Fig 2 data
          C.fn(sat, { color: 'ink', width: 1.8, domain: [20, 400000] });
          for (const r of ISL) {
            const near = r[3] < 500, far = r[3] > 2000;
            if (far) C.rect(r[1] / 1.13, r[2] / 1.13, r[1] * 1.13, r[2] * 1.13, { color: 'red', width: 1.6 });
            if (near) C.dot(r[1], r[2], { r: 8, hollow: true, color: 'green', width: 1.6 });
            C.dot(r[1], r[2], { r: 3.5, color: near ? 'green' : far ? 'red' : 'orange' });
          }
          const Sm = shat(A, d, D0);
          C.text('★', A, Sm, { size: 20, color: 'gold' });
          const hov = (S, X, pts, fmt) => { const P = S.pointer; if (!P.inside) return; let best = null, bd = 1e9; for (const p of pts) { const dd = Math.hypot(S.X(p[0]) - S.X(P.x), S.Y(p[1]) - S.Y(P.y)); if (dd < bd) { bd = dd; best = p; } } if (best && bd < 14) S.text(fmt(best), best[0], best[1], { dx: S.X(best[0]) > S.width * 0.6 ? -10 : 10, dy: -12, align: S.X(best[0]) > S.width * 0.6 ? 'right' : 'left', size: 11.5, weight: 600, plate: true }); };
          hov(C, null, ISL.map((r) => [r[1], r[2], r]), (p) => `${p[2][0]}: ${p[2][2]} species, ${p[2][1].toLocaleString('en-US')} sq mi, ${p[2][3]} mi`);
          // right panel
          if (right.value === 'dist') {
            R.setView([0, 5500], [0, 110]); R.setLabels('distance from New Guinea (mi)', 'percent saturation'); R.setTitle('the distance effect (Fig. 3)');
            for (const [AA, w] of [[100, 1], [1000, 2.4], [10000, 1]]) R.fn((x) => (100 * shat(AA, x, D0)) / sat(AA), { color: 'accent', width: w, alpha: w > 2 ? 1 : 0.4, domain: [0, 5500] });
            for (const r of ISL) R.dot(r[3], r[4], { r: 4, color: r[3] < 500 ? 'green' : r[3] > 2000 ? 'red' : 'orange' });
            R.dot(d, (100 * Sm) / sat(A), { r: 7, color: 'gold' });
            hov(R, null, ISL.map((r) => [r[3], r[4], r]), (p) => `${p[2][0]}: ${p[2][4]}%`);
          } else {
            R.setView([1880, 1960], [0, 40]); R.setLabels('year', 'non-migrant land bird species'); R.setTitle('Krakatau after the 1883 eruption');
            const Sq = 28, k = Math.log(10) / t90.value;
            R.fn((y) => (y < 1883 ? NaN : Sq * (1 - Math.exp(-k * (y - 1883)))), { color: 'accent', width: 2.4, domain: [1883, 1960] });
            R.hline(Sq, { color: 'faint', width: 1, dash: [4, 4] });
            R.vline(1883, { color: 'red', width: 1.2, dash: [3, 3] });
            R.text('eruption', 1883, 38, { dx: 4, align: 'left', size: 11, color: 'red' });
            for (const [y, kr, ve] of KRAK) { R.dot(y, kr, { r: 6, color: 'purple' }); R.dot(y + 0.8, ve, { r: 6, color: 'teal', hollow: true }); }
            R.text('● Krakatau   ○ Verlaten', 1958, 9, { align: 'right', size: 11.5, color: 'muted', weight: 600 }); R.text('(Dammerman 1948)', 1958, 6, { align: 'right', size: 10.5, color: 'muted' });
          }
          st = { A, d, xs, Sm, rate };
        });
        v.legend([['blue', 'immigration of new species'], ['red', 'extinction / far islands', { dot: true }], ['green', 'near islands (< 500 mi)', { dot: true }], ['orange', 'intermediate', { dot: true }], ['ink', 'saturation curve (paper)'], ['accent', 'model fitted to Fig. 3']]);
        v.readout(() => {
          if (!st) return '';
          const { A, d, Sm } = st;
          const k = Math.log(10) / t90.value;
          const krak = right.value === 'krak' ? ` · Krakatau: reaching 90% in ${t90.value} years means an exchange rate of ${v.fix(k * 28, 1)} species per year at the start, and at equilibrium a turnover of a few per cent of the fauna per year — MacArthur & Wilson estimated 0.5–1.6 species per year (2–6% of the fauna), with equilibrium reached within 25–36 years.` : '';
          return `saturation line through Kei and New Guinea: $S = ${v.fix(SAT_C, 2)}\\,A^{${v.fix(SAT_K, 3)}}$ (A in sq mi) · model with immigration $\\propto e^{-d/d_0}$, $d_0$ fitted to Fig. 3 = **${Math.round(D0)} mi** · your island (${Math.round(A).toLocaleString('en-US')} sq mi, ${Math.round(d)} mi): equilibrium **${v.fix(Sm, 1)}** species, ${v.fix((100 * Sm) / sat(A), 0)}% of saturation${krak}`;
        });
      },
    },
  ],
};
