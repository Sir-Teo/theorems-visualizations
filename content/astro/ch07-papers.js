// Astronomy & Astrophysics — Chapter 7, landmark paper: Leavitt & Pickering (1912).
//
// Data (verified):
// - Table I of Harvard College Observatory Circular 173 (1912), read from the ADS scan
//   (articles.adsabs.harvard.edu/pdf/1912HarCi.173....1L): Harvard number, maximum and minimum photographic
//   magnitude (provisional scale), epoch (J.D. − 2,410,000) and period (days) of 25 variables in the SMC, with the
//   residuals Res. M and Res. m from the two straight lines of her Figure 2. Checked programmatically: max − Res. M and
//   min − Res. m lie on two straight lines in log P (rms 0.03 mag, i.e. rounding), whose slopes (≈ −2.05 mag per dex,
//   i.e. log P up 0.48–0.49 per magnitude) match the text. One printed residual is inconsistent: H 1374 (min 15.2,
//   Res. m −0.3) sits 0.6 mag off her minimum line, so the sign is probably a misprint; it is left out when her line
//   is recovered.
// - δ Cephei (calibrator): P = 5.366 d (GCVS); mean V ≈ 3.95, B − V ≈ 0.66, so mean blue (photographic-like)
//   magnitude ≈ 4.6 (approximate); HST parallax 3.66 ± 0.15 mas, 273 pc (Benedict et al. 2002, AJ 124, 1695);
//   Gaia EDR3 3.56 ± 0.15 mas (SIMBAD, queried 2026-10).
// - SMC distance today: 62.44 ± 0.47 (stat.) ± 0.81 (syst.) kpc from eclipsing binaries (Graczyk et al. 2020, ApJ 904, 13).

// H, max, min, epoch, period, Res. M, Res. m (Leavitt's Table I, ordered by period)
const LEAV = [
  [1505, 14.8, 16.1, 0.02, 1.25336, -0.6, -0.5], [1436, 14.8, 16.4, 0.02, 1.6637, -0.3, 0.1], [1446, 14.8, 16.4, 1.38, 1.7620, -0.3, 0.1],
  [1506, 15.1, 16.3, 1.08, 1.87502, 0.1, 0.1], [1413, 14.7, 15.6, 0.35, 2.17352, -0.2, -0.5], [1460, 14.4, 15.7, 0.00, 2.913, -0.3, -0.1],
  [1422, 14.7, 15.9, 0.6, 3.501, 0.2, 0.2], [842, 14.6, 16.1, 2.61, 4.2897, 0.3, 0.6], [1425, 14.3, 15.3, 2.8, 4.547, 0.0, -0.1],
  [1742, 14.3, 15.5, 0.95, 4.9866, 0.1, 0.2], [1646, 14.4, 15.4, 4.30, 5.311, 0.3, 0.1], [1649, 14.3, 15.2, 5.05, 5.323, 0.2, -0.1],
  [1492, 13.8, 14.8, 0.6, 6.2926, -0.2, -0.4], [1400, 14.1, 14.8, 4.0, 6.650, 0.2, -0.3], [1355, 14.0, 14.8, 4.8, 7.483, 0.2, -0.2],
  [1374, 13.9, 15.2, 6.0, 8.397, 0.2, -0.3], [818, 13.6, 14.7, 4.0, 10.336, 0.0, 0.0], [1610, 13.4, 14.6, 11.0, 11.645, 0.0, 0.0],
  [1365, 13.8, 14.8, 9.6, 12.417, 0.4, 0.2], [1351, 13.4, 14.4, 4.0, 13.08, 0.1, -0.1], [827, 13.4, 14.3, 11.6, 13.47, 0.1, -0.2],
  [822, 13.0, 14.6, 13.0, 16.75, -0.1, 0.3], [823, 12.2, 14.1, 2.9, 31.94, -0.3, 0.4], [824, 11.4, 12.8, 4, 65.8, -0.4, -0.2],
  [821, 11.2, 12.1, 97, 127.0, -0.1, -0.4],
];
const SMC_TODAY = 62.44; // kpc, Graczyk et al. 2020
const DCEP = { P: 5.366, mB: 4.6 };

function fitLine(M, xs, ys) { const r = M.linreg(xs, ys); return { a: r.intercept, b: r.slope, rms: Math.sqrt(M.mean(xs.map((x, i) => (ys[i] - r.predict(x)) ** 2))) }; }

export default {
  collection: 'astro',
  chapter: 7,
  items: [
    {
      num: '7.15',
      kind: 'Paper',
      name: 'Periods of 25 Variable Stars in the Small Magellanic Cloud',
      paper: { authors: 'Henrietta S. Leavitt and Edward C. Pickering', year: 1912, title: 'Periods of 25 Variable Stars in the Small Magellanic Cloud', venue: 'Harvard College Observatory Circular 173: 1–3', url: 'https://ui.adsabs.harvard.edu/abs/1912HarCi.173....1L' },
      introduces: ['astro-7.13'],
      statement: String.raw`For 25 variable stars in the Small Magellanic Cloud, Leavitt found that the brighter the star, the longer its period: plotted against the **logarithm** of the period, both the maximum and the minimum magnitudes fall on straight lines, with $\log P$ growing by about 0.48 for each magnitude of brightening, i.e.
$$m \approx a - 2.1\,\log_{10} P .$$
Because the stars of the Cloud are all at nearly the same distance, the relation must hold for their *intrinsic* luminosities: the period of such a star tells how luminous it is.

In modern terms this is the Cepheid period–luminosity (Leavitt) law (astro-7.13). It holds for classical Cepheids (her stars, periods 1.25 to 127 days); its zero point needs a calibrator of known distance, its slope depends on the passband, and it differs for other pulsators (Population II Cepheids, RR Lyrae).`,
      idea: String.raw`Leavitt had catalogued 1,777 variables in the two Magellanic Clouds from Harvard plates (1908) and noticed that the brighter ones had longer periods. The 1912 circular, issued under Pickering's name, gave 25 periods and the two straight lines in log P, with the key inference that the SMC stars share a common distance, so apparent magnitude differences are luminosity differences (distance modulus, astro-4.3). What was missing was one Cepheid of known distance. Hertzsprung (1913) supplied a first calibration from the statistical parallaxes of nearby Cepheids, Shapley used the relation to size the Milky Way (1918), and Hubble used it to show that the spiral nebulae are galaxies (1925) and then to anchor the expansion of the universe (astro-10.19). The relation is still the first rung of the extragalactic distance ladder, recalibrated today with Gaia parallaxes and eclipsing binaries.`,
      caption: String.raw`**Left**: Leavitt's own 25 stars from her Table I, maxima (blue) and minima (orange), against $\log P$ as in her Figure 2 (switch to **period** for her Figure 1, the curved version); the dashed lines are her printed lines, recovered from the residual columns of the table, the solid ones a least-squares fit. **Hover** a star for its Harvard number and period. **Right**: calibrate. Drag the **distance of δ Cephei** (period 5.37 d): its brightness fixes the zero point, and the mean-light line then gives the distance of the whole Cloud, compared with today's 62.4 kpc. Drag the **period** handle to read off the luminosity a Cepheid of any period must have.`,
      deps: ['astro-4.3'],
      refs: [],
      tags: ['cepheids', 'distance ladder', 'history'],
      credit: 'Henrietta Swan Leavitt, 1912',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Period-luminosity_relation' },
      viz(v) {
        const M = v.M;
        const xmode = v.select('abscissa', [{ value: 'log', label: 'log period (Fig. 2)' }, { value: 'lin', label: 'period (Fig. 1)' }], 'log');
        const dist = v.slider('distance of δ Cephei (pc)', 150, 450, 273, { step: 1 });
        const lp = LEAV.map((r) => Math.log10(r[4]));
        const fMax = fitLine(M, lp, LEAV.map((r) => r[1])), fMin = fitLine(M, lp, LEAV.map((r) => r[2]));
        const fMean = fitLine(M, lp, LEAV.map((r) => (r[1] + r[2]) / 2));
        // Leavitt's printed lines: the points max − ResM (min − Resm) lie on her lines
        const lMax = fitLine(M, lp, LEAV.map((r) => r[1] - r[5])), lMin = (() => { const k = LEAV.map((r, i) => i).filter((i) => LEAV[i][0] !== 1374); return fitLine(M, k.map((i) => lp[i]), k.map((i) => LEAV[i][2] - LEAV[i][6])); })();
        const yt = [11, 12, 13, 14, 15, 16].map((m) => [-m, String(m)]);
        const s = v.stage({ x: [-0.05, 2.25], y: [-16.8, -10.6], axes: 'box', gutter: true, height: 360, weight: 1.35, hover: true, yticks: yt, xlabel: 'log₁₀ period (days)', ylabel: 'photographic magnitude (brighter ↑)', title: 'Leavitt’s 25 Cepheids in the SMC' });
        const c = v.stage({ x: [0, 2.25], y: [-7, 0], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 250, yticks: [-1, -2, -3, -4, -5, -6].map((m) => [m, String(m)]), xlabel: 'log₁₀ period (days)', ylabel: 'absolute magnitude (brighter ↑)', title: 'calibrated with δ Cephei' });
        const hp = c.handle(1.5, -5, { color: 'gold', label: 'P', constrain: (x) => [M.clamp(x, 0.05, 2.15), 0] });
        let st = null;
        v.render(() => {
          const log = xmode.value === 'log';
          const X = (P) => (log ? Math.log10(P) : P);
          s.setView(log ? [-0.05, 2.25] : [-3, 135], [-16.8, -10.6]);
          s.setLabels(log ? 'log₁₀ period (days)' : 'period (days)', undefined);
          const lineF = (f) => (x) => -(f.a + f.b * (log ? x : Math.log10(Math.max(x, 0.5))));
          s.fn(lineF(lMax), { color: 'blue', width: 1.4, dash: [6, 4] });
          s.fn(lineF(lMin), { color: 'orange', width: 1.4, dash: [6, 4] });
          s.fn(lineF(fMax), { color: 'blue', width: 2.2, alpha: 0.75 });
          s.fn(lineF(fMin), { color: 'orange', width: 2.2, alpha: 0.75 });
          for (const r of LEAV) {
            s.line(X(r[4]), -r[1], X(r[4]), -r[2], { color: 'faint', width: 1.2 });
            s.dot(X(r[4]), -r[1], { r: 4.5, color: 'blue' });
            s.dot(X(r[4]), -r[2], { r: 4.5, color: 'orange' });
          }
          const P = s.pointer;
          if (P.inside) {
            let best = null, bd = 1e9;
            for (const r of LEAV) for (const m of [r[1], r[2]]) { const d = Math.hypot(s.X(X(r[4])) - s.X(P.x), s.Y(-m) - s.Y(P.y)); if (d < bd) { bd = d; best = r; } }
            if (best && bd < 18) {
              const right = X(best[4]) > (log ? 1.3 : 80);
              s.text(`H ${best[0]}: P = ${best[4]} d, ${best[1]}–${best[2]} mag`, X(best[4]), -best[1], { dx: right ? -10 : 10, dy: -14, align: right ? 'right' : 'left', size: 12, weight: 600, plate: true });
            }
          }
          s.corner(`fit: max = ${v.fix(fMax.a, 2)} ${v.fix(fMax.b, 2)} log P   (rms ${v.fix(fMax.rms, 2)})`, 'tr', { color: 'blue', size: 11.5, weight: 600 });
          // ---- calibration: δ Cep sets the zero point of the mean-light line (in the same rough blue band)
          const mu = 5 * Math.log10(dist.value) - 5; // δ Cep distance modulus
          const MdCep = DCEP.mB - mu; // absolute magnitude of δ Cep
          const Z = MdCep - fMean.b * Math.log10(DCEP.P); // absolute PL: M = Z + b log P
          const mSMC = fMean.a + fMean.b * Math.log10(DCEP.P); // apparent mean magnitude of a 5.37-day star in the SMC
          const muSMC = mSMC - MdCep, dSMC = 10 ** (muSMC / 5 + 1) / 1000;
          c.fn((x) => -(Z + fMean.b * x), { color: 'green', width: 2.6 });
          for (let i = 0; i < LEAV.length; i++) c.dot(lp[i], -((LEAV[i][1] + LEAV[i][2]) / 2 - muSMC), { r: 3.5, color: 'muted' });
          c.dot(Math.log10(DCEP.P), -MdCep, { r: 7, color: 'red' });
          c.text('δ Cep', Math.log10(DCEP.P), -MdCep, { dx: 10, dy: 12, color: 'red', size: 12, weight: 700, align: 'left' });
          const Mp = Z + fMean.b * hp.x;
          hp.set(hp.x, -Mp);
          c.line(hp.x, 0, hp.x, -Mp, { color: 'gold', width: 1.2, dash: [3, 3] });
          c.text(`P = ${v.fix(10 ** hp.x, 1)} d → M = ${v.fix(Mp, 2)}`, hp.x, -Mp, { dx: hp.x > 1.4 ? -12 : 12, dy: -16, align: hp.x > 1.4 ? 'right' : 'left', size: 12, weight: 700, color: 'gold', plate: true });
          st = { muSMC, dSMC, MdCep };
        });
        v.legend([['blue', 'maxima', { dot: true }], ['orange', 'minima', { dot: true }], ['muted', 'Leavitt’s lines (from her residuals)', { dash: true }], ['green', 'calibrated mean-light law']]);
        v.readout(() => {
          if (!st) return '';
          const perMag = -1 / fMax.b, perMag2 = -1 / fMin.b;
          return `slopes: maxima ${v.fix(fMax.b, 2)}, minima ${v.fix(fMin.b, 2)} mag per dex → log P rises **${v.fix(perMag, 2)}** (max) and **${v.fix(perMag2, 2)}** (min) per magnitude (Leavitt: “about 0.48”); her own lines ${v.fix(lMax.b, 2)} and ${v.fix(lMin.b, 2)}.\n` +
            `δ Cep at ${Math.round(dist.value)} pc ⇒ $M = ${v.fix(st.MdCep, 2)}$, SMC distance modulus ${v.fix(st.muSMC, 2)} ⇒ **${v.fix(st.dSMC, 1)} kpc** — today 62.4 ± 0.9 kpc (eclipsing binaries, 2020). The gap is Leavitt’s provisional magnitude scale and the mixing of passbands, not the law: the slope and the idea survive intact.`;
        });
      },
    },
  ],
};
