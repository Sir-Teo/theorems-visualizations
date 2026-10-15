// Mathematical Statistics — Chapter 12 (paper): Legendre 1805, the method of least squares

// ── Legendre's data (Nouvelles méthodes …, appendix, p. 76; read from the archive.org scan of the 1805 edition):
//    latitudes of the five main stations of Delambre and Méchain's meridian, and the four arcs between them in modules
//    (1 module = 2 toises). ──
const dms = (d, m, s) => d + m / 60 + s / 3600;
const STN = [
  { name: 'Dunkirk', lat: dms(51, 2, 10.5) },
  { name: 'Panthéon', lat: dms(48, 50, 49.75) },
  { name: 'Évaux', lat: dms(46, 10, 42.5) },
  { name: 'Carcassonne', lat: dms(43, 12, 54.4) },
  { name: 'Montjouy', lat: dms(41, 21, 44.8) },
];
const ARC = [62472.59, 76145.74, 84424.55, 52749.48];
const D0 = 28500;                        // Legendre's trial length of the 45th degree, in modules
const LEG = { alpha: 0.00675, C: 0.0000778, D: 28497.78, E: [-0.73, 1.83, -1.55, 0.42, 0.03] }; // printed on pp. 78–79
const F_TODAY = 1 / 298.257223563;       // WGS 84 flattening
const MODULE_M = 2 * 1.949036;           // 1 toise = 864 lignes = 1.949036 m (1799 legal metre = 443.296 lignes)
const RAD = Math.PI / 180;
/** Legendre's equation (a) for each arc: E_north − E_south = b + C·a + α·k (degrees). */
const ARCEQ = ARC.map((S, i) => {
  const Dl = STN[i].lat - STN[i + 1].lat, Sg = STN[i].lat + STN[i + 1].lat, a = S / D0;
  return { a, b: a - Dl, k: (270 / Math.PI) * Math.sin(Dl * RAD) * Math.cos(Sg * RAD), mid: Sg / 2, span: [STN[i + 1].lat, STN[i].lat], perDeg: S / Dl };
});
/** Rows [constant, coefficient of E‴, of C, of α] giving the five latitude errors E′ … E^v in degrees (E‴ = Évaux is the free unknown). */
const ROWS = (() => {
  const add = (p, q, s = 1) => p.map((x, i) => x + s * q[i]);
  const dv = (i) => [ARCEQ[i].b, 0, ARCEQ[i].a, ARCEQ[i].k];
  const E2 = [0, 1, 0, 0], E1 = add(E2, dv(1)), E0 = add(E1, dv(0)), E3 = add(E2, dv(2), -1), E4 = add(E3, dv(3), -1);
  return [E0, E1, E2, E3, E4];
})();
/** Errors in arc-seconds for the unknowns (E‴, C, α). */
const errs = (e2, C, al) => ROWS.map((r) => 3600 * (r[0] + r[1] * e2 + r[2] * C + r[3] * al));
/** For fixed (C, α): the Évaux error that minimises the sum of squares (mean) or the largest error (midrange). */
function bestE2(C, al, crit) {
  const off = ROWS.map((r) => r[0] + r[2] * C + r[3] * al);   // E_k = off_k + E‴
  if (crit === 'max') return -(Math.max(...off) + Math.min(...off)) / 2;
  return -off.reduce((s, x) => s + x, 0) / off.length;
}
const ss = (E) => E.reduce((s, x) => s + x * x, 0);
const maxAbs = (E) => Math.max(...E.map(Math.abs));
/** Least squares over (E‴, C, α), optionally with α fixed. */
function lsFit(M, alFixed) {
  if (alFixed != null) {
    const t = M.lstsq(ROWS.map((r) => [r[1], r[2]]), ROWS.map((r) => -(r[0] + r[3] * alFixed)));
    return { e2: t[0], C: t[1], al: alFixed };
  }
  const t = M.lstsq(ROWS.map((r) => r.slice(1)), ROWS.map((r) => -r[0]));
  return { e2: t[0], C: t[1], al: t[2] };
}
/** Minimax (Chebyshev) fit: the optimum makes four errors equal in size with suitable signs; enumerate and keep the best feasible. */
function minimaxFit(M) {
  let best = null;
  for (let skip = 0; skip < 5; skip++) {
    const idx = [0, 1, 2, 3, 4].filter((k) => k !== skip);
    for (let sg = 0; sg < 16; sg++) {
      const sig = idx.map((_, j) => ((sg >> j) & 1 ? 1 : -1));
      const A = idx.map((k, j) => [ROWS[k][1], ROWS[k][2], ROWS[k][3], -sig[j]]), b = idx.map((k) => -ROWS[k][0]);
      const x = M.solve(A, b); if (!x || !(x[3] >= 0)) continue;
      const E = errs(x[0], x[1], x[2]);
      if (maxAbs(E) <= 3600 * x[3] + 1e-7 && (!best || x[3] < best.h)) best = { e2: x[0], C: x[1], al: x[2], h: x[3] };
    }
  }
  return best;
}
/** Local length of one degree of the meridian at latitude φ (modules), to first order in α. */
const degLen = (D, al, phi) => D * (1 - 1.5 * al * Math.cos(2 * phi * RAD));
/** Today's value from the WGS 84 ellipsoid, in modules per degree. */
function degToday(phi) {
  const a = 6378137, e2 = F_TODAY * (2 - F_TODAY), s = Math.sin(phi * RAD);
  return ((a * (1 - e2)) / Math.pow(1 - e2 * s * s, 1.5)) * RAD / MODULE_M;
}

export default {
  collection: 'stat',
  chapter: 12,
  items: [
    // ───────────────────────────────────────────────────────────── 12.19
    {
      num: '12.19',
      kind: 'Paper',
      name: 'Sur la méthode des moindres quarrés',
      paper: { authors: 'A. M. Legendre', year: 1805, title: 'Nouvelles méthodes pour la détermination des orbites des comètes (appendix: Sur la méthode des moindres quarrés)', venue: 'Paris: Firmin Didot', url: 'https://archive.org/details/nouvellesmthode00legegoog' },
      introduces: ['stat-12.2', 'nla-2.9'],
      credit: 'Adrien-Marie Legendre, appendix dated 6 March 1805',
      statement: String.raw`In a nine-page appendix to a book on cometary orbits, Legendre proposed a general rule for combining more equations than unknowns: choose the unknowns so that the **sum of the squares of the errors is a minimum**. Setting the derivative with respect to each unknown to zero gives as many linear equations as unknowns (today's *normal equations*, $A^\top A\,\theta=A^\top y$, nla-2.9), which "establishes a kind of equilibrium among the errors" and keeps the largest ones from dominating; with one unknown it gives the arithmetic mean, and for points in space their centre of gravity.

His worked example is the new French meridian measured by Delambre and Méchain from Dunkirk to Montjouy near Barcelona: four arcs $S$ between five stations whose latitudes are known to a few seconds. Writing each arc through the length $D$ of the 45th degree and the flattening $\alpha$ of the Earth,
$$L'-L=\frac{S}{D}+\alpha\,\frac{270}{\pi}\sin(L'-L)\cos(L'+L)\quad(\text{degrees}),$$
and allowing an unknown error at each station's latitude, he minimised the sum of the squares of the five errors and found $\alpha=1/148$ and $D=28{,}497.78$ modules, with no error above $2''$ (mean $0.91''$). Scope: least squares is optimal for independent errors of equal variance (Gauss–Markov, stat-12.2), but it is only as good as the model — here local plumb-line deflections, not measurement error, dominate.`,
      idea: String.raw`Astronomers and geodesists of the 18th century faced overdetermined linear systems constantly (Mayer's lunar librations in 1750, the figure of the Earth). They combined equations by ad hoc averaging (Mayer), or chose the solution minimising the sum of absolute errors (Boscovich, 1757) or the largest error (Laplace's minimax, 1786–99) — rules that need case-by-case computation. Legendre's criterion leads to linear equations solvable by routine elimination, and he presented it as a general principle, applying it at once to the survey that defined the metre. Gauss claimed in 1809 to have used the method since 1795 and gave it a probabilistic justification through the normal law of errors, starting a famous priority dispute; Legendre's was the first publication. His flattening 1/148 disagreed with the 1/320 then accepted from pendulum measurements; refitting with $\alpha$ fixed at 1/320 left errors of up to $5.8''$, which he blamed on local attractions deflecting the plumb line — correctly: the arc is too short and the deflections too large to determine $\alpha$ well (today $\alpha=1/298.26$).`,
      caption: String.raw`Left: the sum of squared latitude errors over the plane of flattening $\alpha$ and 45th-degree length $D$ (for each point the Évaux error is chosen optimally), on a log colour scale. **Drag the gold trial point**; the bars on the right show its five latitude errors. The green point is the bottom of the bowl found by the normal equations — Legendre's solution; orange is Laplace's rival rule, minimising the **largest** error (four errors become equal, dashed band). Purple: Legendre's second fit with $\alpha$ forced to the accepted 1/320. Bottom: the length of one degree against latitude — the four arcs as Legendre's data (grey bars) and the curves implied by each fit; the dotted line is today's WGS 84 ellipsoid.`,
      deps: ['opt-1.4'],
      refs: [],
      tags: ['least squares', 'history', 'geodesy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Least_squares#History' },
      viz(v) {
        const M = v.M, LS = lsFit(M), MM = minimaxFit(M), L320 = lsFit(M, 1 / 320), LMOD = lsFit(M, F_TODAY);
        const toD = (C) => D0 / (1 + C), toC = (D) => D0 / D - 1;
        const AX = [-0.001, 0.0135], DY = [28478, 28522];
        const B = v.stage({ x: AX, y: DY, axes: 'box', height: 340, weight: 1.1, minWidth: 290, xlabel: 'flattening α', yticks: [28490, 28500, 28510, 28520], title: 'sum of squared errors (sec²) over α and the 45th degree $D$', xticks: [[0, '0'], [1 / 200, '1/200'], [1 / 148, '1/148'], [1 / 100, '1/100']] });
        const R = v.stage({ x: [-0.6, 4.6], y: [-7, 7], axes: 'box', height: 340, weight: 1, minWidth: 270, title: 'latitude errors at the five stations (arc-seconds)', xticks: STN.map((s, i) => [i, s.name]) });
        const G = v.stage({ x: [40.8, 51.6], y: [28440, 28575], axes: 'box', height: 250, full: true, xlabel: 'latitude (degrees)', yticks: [28480, 28500, 28520, 28540], title: 'length of one degree of the meridian (modules per degree)' });
        const H = B.handle(0.0105, 28490, { color: 'gold', constrain: { x: [AX[0] + 1e-4, AX[1] - 1e-4], y: [DY[0] + 0.3, DY[1] - 0.3] } });
        v.button('Trial → least squares', () => H.set(LS.al, toD(LS.C)));
        v.button('Trial → minimax', () => H.set(MM.al, toD(MM.C)));
        const crit = v.select('trial point: Évaux error chosen by', [{ value: 'ls', label: 'least squares' }, { value: 'max', label: 'smallest maximum' }], 'ls');
        const SSf = (al, D) => { const C = toC(D); return ss(errs(bestE2(C, al, 'ls'), C, al)); };
        const fits = () => [
          { f: LS, c: 'green', name: 'least squares' },
          { f: MM, c: 'orange', name: 'minimax' },
          { f: L320, c: 'purple', name: 'α = 1/320' },
        ];
        v.render(() => {
          // bowl
          B.heat((x, y) => Math.log10(SSf(x, y)), { range: [0, 3.2], cmap: 'viridis', res: 3, key: 'bowl' });
          B.contour((x, y) => Math.log10(SSf(x, y)), [0.5, 1, 1.5, 2, 2.5, 3], { color: 'panel', width: 0.8, res: 90 });
          B.axes();
          B.vline(F_TODAY, { color: 'ink', dash: [5, 4], width: 1.4 });
          B.text('today 1/298', F_TODAY, DY[1] - 2, { align: 'left', dx: 4, size: 10.5, color: 'ink' });
          B.dot(LEG.alpha, LEG.D, { r: 10, color: 'ink', hollow: true });
          fits().forEach(({ f, c, name }, j) => { B.dot(f.al, toD(f.C), { r: 6, color: c }); B.text(name, f.al, toD(f.C), { dx: j === 1 ? -10 : 12, dy: j === 0 ? 12 : -10, align: j === 1 ? 'right' : 'left', size: 11, color: c, weight: 700 }); });
          B.text('ring: Legendre’s printed values', AX[1], DY[1] - 2, { align: 'right', dx: -6, size: 10.5, color: 'ink' });
          // residual bars for the trial
          const C = toC(H.y), e2 = bestE2(C, H.x, crit.value), E = errs(e2, C, H.x), Els = errs(LS.e2, LS.C, LS.al), Emm = errs(MM.e2, MM.C, MM.al);
          const top = Math.max(7, maxAbs(E) * 1.15);
          R.setView([-0.6, 4.6], [-top, top]);
          R.hband(-MM.h * 3600, MM.h * 3600, { color: 'orange', alpha: 0.08 });
          [-1, 1].forEach((s) => R.hline(s * MM.h * 3600, { color: 'orange', dash: [5, 4], width: 1.2 }));
          R.hline(0, { color: 'muted', width: 1 });
          E.forEach((e, i) => R.rect(i - 0.22, 0, i + 0.22, e, { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: 1.2 }));
          Els.forEach((e, i) => R.dot(i - 0.08, e, { r: 5, color: 'green' }));
          Emm.forEach((e, i) => R.dot(i + 0.08, e, { r: 5, color: 'orange' }));
          E.forEach((e, i) => R.text(`${e >= 0 ? '+' : '−'}${v.fix(Math.abs(e), 2)}″`, i, e, { align: 'center', dy: e >= 0 ? -11 : 11, size: 10.5, color: 'ink' }));
          // degree lengths
          G.fn((p) => degToday(p), { color: 'ink', dash: [2, 3], width: 1.6, domain: [40.8, 51.6] });
          ARCEQ.forEach((q) => { G.rect(q.span[0], q.perDeg - 2, q.span[1], q.perDeg + 2, { fill: 'muted', fillAlpha: 0.5, stroke: false }); });
          fits().forEach(({ f, c }) => G.fn((p) => degLen(toD(f.C), f.al, p), { color: c, width: 2, domain: [40.8, 51.6] }));
          G.fn((p) => degLen(H.y, H.x, p), { color: 'gold', width: 2.6, domain: [40.8, 51.6] });
          STN.forEach((s) => { G.vline(s.lat, { color: 'faint', width: 1 }); G.text(s.name, s.lat, 28566, { align: 'center', size: 10.5, color: 'muted' }); });
        });
        v.legend([['gold', 'your trial'], ['green', 'least squares (Legendre)'], ['orange', 'smallest maximum error (Laplace)'], ['purple', 'α fixed at 1/320'], ['muted', 'Legendre’s four arcs', { area: true }], ['ink', 'today (WGS 84)', { dash: true }]]);
        v.readout(() => {
          const C = toC(H.y), e2 = bestE2(C, H.x, crit.value), E = errs(e2, C, H.x), Els = errs(LS.e2, LS.C, LS.al), E320 = errs(L320.e2, L320.C, L320.al), Emod = errs(LMOD.e2, LMOD.C, LMOD.al);
          const list = (A) => A.map((e) => `${e >= 0 ? '+' : '−'}${v.fix(Math.abs(e), 2)}`).join(', ');
          return `**trial** α = 1/${v.fix(1 / H.x, 1)}, $D$ = ${v.fix(H.y, 2)}: sum of squares ${v.fix(ss(E), 2)} sec², largest error ${v.fix(maxAbs(E), 2)}″ · **least squares** (normal equations): α = ${v.fix(LS.al, 6)} = 1/${v.fix(1 / LS.al, 1)}, $D$ = ${v.fix(toD(LS.C), 2)}, errors ${list(Els)}″ — Legendre printed α = 0.00675 = 1/148, $D$ = 28,497.78 and ${list(LEG.E)}″ · **minimax**: α = 1/${v.fix(1 / MM.al, 1)}, $D$ = ${v.fix(toD(MM.C), 2)}, every error ≤ ${v.fix(MM.h * 3600, 2)}″ (least squares: ${v.fix(maxAbs(Els), 2)}″) · **α = 1/320**: $D$ = ${v.fix(toD(L320.C), 2)} (Legendre: 28,504.09), errors ${list(E320)}″ · today α = 1/298.26; with it the best errors are ${list(Emod)}″ — plumb-line deflections of several seconds that no ellipse removes · a degree at 45° is ${v.fix(degToday(45), 0)} modules today (1 module = 3.898 m)`;
        });
      },
    },
  ],
};
