// Astronomy & Astrophysics — Chapter 10, landmark papers: Hubble (1929).
//
// Data (verified):
// - Table 1 of Hubble (1929), PNAS 15: 168–173, read from the scanned paper: distance r (10⁶ pc) and measured
//   velocity v (km/s) of 24 nebulae, plus his solution K = +465 ± 50 (24 objects) and +513 ± 60 (9 groups) km/s per
//   10⁶ pc, apex A = 286°, D = +40°, V₀ = 306 km/s, and the cross at 745 km/s for 1.4 × 10⁶ pc (22 further nebulae).
// - Positions (J2000) and modern heliocentric velocities: SIMBAD (CDS), queried 2026-10.
// - Modern distances: Cosmicflows-3 (Tully, Courtois & Sorce 2016, AJ 152, 50) as listed in SIMBAD, except M51
//   (TRGB, 8.58 Mpc, McQuinn et al. 2016, ApJ 826, 21), NGC 4151 (Cepheids, 15.8 Mpc, Yuan et al. 2020, ApJ 902, 26)
//   and NGC 1068 (Tully–Fisher, 10.1 Mpc, Tully et al. 2008, ApJ 676, 184).
// - H₀ today: Planck 2018 VI (A&A 641, A6): 67.4 ± 0.5, age 13.797 ± 0.023 Gyr; SH0ES (Riess et al. 2022, ApJL 934,
//   L7): 73.04 ± 1.04; HST Key Project (Freedman et al. 2001, ApJ 553, 47): 72 ± 8. Baade's revision (h ≈ 2) and
//   Sandage 1958 (H ≈ 75): MacCallum (2015), arXiv:1504.03606.

const D2R = Math.PI / 180;
// name, r (Mpc, Hubble), v (km/s, Hubble), RA, Dec (deg J2000), group (0 stars involved/Cepheids, 1 brightest stars, 2 Virgo),
// modern distance (Mpc), modern heliocentric velocity (km/s), common name
const NEB = [
  ['SMC', 0.032, 170, 13.158, -72.800, 0, 0.06, 146, 'Small Magellanic Cloud'],
  ['LMC', 0.034, 290, 80.894, -69.756, 0, 0.05, 262, 'Large Magellanic Cloud'],
  ['NGC 6822', 0.214, -130, 296.234, -14.798, 0, 0.48, -57, 'Barnard’s Galaxy'],
  ['NGC 598', 0.263, -70, 23.462, 30.660, 0, 0.91, -179, 'M33'],
  ['NGC 221', 0.275, -185, 10.674, 40.865, 0, 0.78, -199, 'M32'],
  ['NGC 224', 0.275, -220, 10.685, 41.269, 0, 0.77, -300, 'M31, Andromeda'],
  ['NGC 5457', 0.45, 200, 210.802, 54.349, 0, 6.95, 243, 'M101'],
  ['NGC 4736', 0.5, 290, 192.721, 41.120, 1, 4.59, 287, 'M94'],
  ['NGC 5194', 0.5, 270, 202.470, 47.195, 1, 8.58, 523, 'M51'],
  ['NGC 4449', 0.63, 200, 187.046, 44.094, 1, 4.27, 204, ''],
  ['NGC 4214', 0.8, 300, 183.913, 36.327, 1, 2.94, 294, ''],
  ['NGC 3031', 0.9, -30, 148.888, 69.065, 1, 3.61, -47, 'M81'],
  ['NGC 3627', 0.9, 650, 170.063, 12.992, 1, 8.99, 724, 'M66'],
  ['NGC 4826', 0.9, 150, 194.182, 21.683, 1, 5.30, 438, 'M64'],
  ['NGC 5236', 0.9, 500, 204.254, -29.866, 1, 4.66, 519, 'M83'],
  ['NGC 1068', 1.0, 920, 40.670, -0.013, 1, 10.1, 1043, 'M77'],
  ['NGC 5055', 1.1, 450, 198.955, 42.029, 1, 8.99, 500, 'M63'],
  ['NGC 7331', 1.1, 500, 339.267, 34.416, 1, 14.06, 832, ''],
  ['NGC 4258', 1.4, 500, 184.740, 47.304, 1, 7.31, 507, 'M106'],
  ['NGC 4151', 1.7, 960, 182.636, 39.406, 1, 15.8, 944, ''],
  ['NGC 4382', 2.0, 500, 186.350, 18.191, 2, 15.85, 769, 'M85'],
  ['NGC 4472', 2.0, 850, 187.445, 8.000, 2, 16.07, 949, 'M49'],
  ['NGC 4486', 2.0, 800, 187.706, 12.391, 2, 16.52, 1256, 'M87'],
  ['NGC 4649', 2.0, 1090, 190.917, 11.553, 2, 17.38, 1015, 'M60'],
];
const GCOL = ['blue', 'orange', 'purple'];
const HT = 977.8; // 1/H in Gyr for H in km/s/Mpc
// H₀ through the years (verified values; Baade and Sandage from MacCallum 2015)
const HIST = [
  { y: 1929, H: 500, lo: 465, hi: 513, who: 'Hubble', pos: [8, 0, 'left'] },
  { y: 1952, H: 200, lo: 180, hi: 250, who: 'Baade', approx: true, pos: [8, 0, 'left'] },
  { y: 1958, H: 75, lo: 50, hi: 100, who: 'Sandage', pos: [-6, -12, 'right'] },
  { y: 2001, H: 72, lo: 64, hi: 80, who: 'HST Key Project', pos: [-6, -12, 'right'] },
  { y: 2018, H: 67.4, lo: 66.9, hi: 67.9, who: 'Planck', pos: [-4, 13, 'right'], color: 'teal' },
  { y: 2022, H: 73.04, lo: 72.0, hi: 74.08, who: 'SH0ES', pos: [0, -13, 'right'], color: 'red' },
];

/** Least squares v = rK (+ X cosα cosδ + Y sinα cosδ + Z sinδ) with the standard error of K. */
function hubbleFit(M, rows, solar) {
  const A = rows.map((q) => (solar ? [q.r, Math.cos(q.a) * Math.cos(q.d), Math.sin(q.a) * Math.cos(q.d), Math.sin(q.d)] : [q.r]));
  const b = rows.map((q) => q.v);
  const p = A[0].length, n = A.length;
  const N = M.matMul(M.transpose(A), A), x = M.solve(N, M.matVec(M.transpose(A), b));
  const res = b.map((y, i) => y - M.dot(A[i], x)), rss = res.reduce((s, e) => s + e * e, 0);
  const Ni = M.inverse(N), se = Math.sqrt((rss / (n - p)) * Ni[0][0]);
  const sun = (q) => (solar ? x[1] * Math.cos(q.a) * Math.cos(q.d) + x[2] * Math.sin(q.a) * Math.cos(q.d) + x[3] * Math.sin(q.d) : 0);
  let apex = null;
  if (solar) { const V = Math.hypot(x[1], x[2], x[3]); apex = { V, A: ((Math.atan2(-x[2], -x[1]) / D2R) + 360) % 360, D: Math.asin(-x[3] / V) / D2R }; }
  return { K: x[0], se, sun, apex, meanRes: res.reduce((s, e) => s + Math.abs(e), 0) / n };
}

export default {
  collection: 'astro',
  chapter: 10,
  items: [
    // ───────────────────────────────────────────────────────────── 10.19
    {
      num: '10.19',
      kind: 'Paper',
      name: 'Relation between distance and radial velocity of nebulae',
      paper: { authors: 'Edwin Hubble', year: 1929, title: 'A Relation between Distance and Radial Velocity among Extra-Galactic Nebulae', venue: 'Proceedings of the National Academy of Sciences 15 (3): 168–173', doi: '10.1073/pnas.15.3.168' },
      introduces: ['astro-10.2'],
      statement: String.raw`Using the 24 galaxies whose distances he could estimate (Cepheids and other resolved stars for the nearest, the brightest stars for thirteen more, the mean brightness of the Virgo cluster for the last four), Hubble showed that their radial velocities grow **linearly with distance**,
$$v = K\,r ,$$
when the Sun's own motion is solved for at the same time: $K = 465 \pm 50$ km/s per megaparsec from the 24 nebulae and $513 \pm 60$ from nine groups, "round numbers" $K \approx 500$. Twenty-two more nebulae with velocities but no individual distances fell on the same line.

In modern terms this is the Hubble–Lemaître law $v = H_0 d$ (astro-10.2), the signature of a uniformly expanding universe. It holds for redshifts $z \ll 1$ and distances large enough that the expansion dominates the galaxies' peculiar motions of a few hundred km/s. Hubble's sample sits right at that edge (his largest velocity is 1,090 km/s), and his distances were too short by a factor of about seven, so his $K$ was about seven times today's $H_0 \approx 67$–$73$ km/s/Mpc.`,
      idea: String.raw`By 1929 Slipher had measured the Doppler shifts (waves-1.14) of dozens of spiral nebulae and found most of them receding, and Hubble's own Cepheids in M31, M33 and NGC 6822 (via Leavitt's period–luminosity law, astro-7.13, astro-7.15) had shown in 1925 that the nebulae are galaxies far outside our own. Lemaître (1927) had already derived a linear velocity–distance relation from an expanding relativistic universe and estimated its slope, in a Belgian journal that few read. Hubble's paper supplied what was missing: distances, estimated rung by rung from distance moduli (astro-4.3) of Cepheids, then of brightest stars, then of whole galaxies, and a fit that puts the distances into the solar-motion equations as coefficients of the old "$K$ term". The relation became the observational foundation of cosmology. Its slope did not survive: Baade (1952) found that the Cepheid zero point was wrong (two stellar populations), roughly doubling all distances, and Sandage (1958) found that many of Hubble's "brightest stars" were glowing gas clouds, bringing $H_0$ down to about 75. The IAU has recommended calling it the Hubble–Lemaître law since 2018.`,
      caption: String.raw`**Left**: Hubble's own 24 nebulae (his Table 1; colours: distance from resolved stars and Cepheids, from brightest stars, Virgo cluster), velocities corrected for the solar motion fitted at the same time, as in his Figure 1; the cross is his mean for 22 further nebulae. **Hover** a point for its name. Drag the **Cepheid zero point** (Baade 1952) and the **brightest-star** correction (Sandage 1958) to stretch the distance ladder and watch $K$ fall; the presets set them. **Today** replaces every distance and velocity by a modern value (Cosmicflows-3, TRGB and Cepheid distances; SIMBAD velocities): the same 24 galaxies then give $H_0 \approx 68$. Switch off the **solar-motion** term to fit a bare line through the origin. **Right**: $H_0$ through the century on a log scale, with your current fit in gold and the Hubble time $1/H_0$.`,
      deps: ['astro-7.13', 'astro-4.3', 'waves-1.14', 'astro-7.15'],
      refs: [],
      tags: ['cosmology', 'history', 'Hubble'],
      credit: 'Edwin Hubble, 1929',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hubble%27s_law' },
      viz(v) {
        const M = v.M;
        const mode = v.select('distances', [{ value: 'hubble', label: 'Hubble 1929' }, { value: 'baade', label: 'Baade 1952' }, { value: 'sandage', label: 'Sandage 1958' }, { value: 'today', label: 'today' }], 'hubble', {
          onChange: (m) => { if (m === 'hubble') { f1.set(1); f2.set(1); } else if (m === 'baade') { f1.set(2); f2.set(1); } else if (m === 'sandage') { f1.set(2); f2.set(sandageF2()); } syncCtl(); },
        });
        const f1 = v.slider('Cepheid zero point: all ×', 1, 3, 1, { step: 0.01 });
        const f2 = v.slider('brightest “stars” → H II regions ×', 1, 5, 1, { step: 0.01 });
        const solar = v.toggle('fit the solar motion (as Hubble did)', true);
        const syncCtl = () => { const t = mode.value === 'today'; f1.el.hidden = t; f2.el.hidden = t; };
        const s = v.stage({ x: [0, 2.3], y: [-450, 1300], height: 360, axes: 'box', weight: 1.45, hover: true, xlabel: 'distance (Mpc)', ylabel: 'velocity (km/s)', title: 'velocity against distance' });
        const g = v.stage({ x: [1908, 2032], y: [40, 900], ylog: true, height: 360, axes: 'box', weight: 0.85, minWidth: 240, xlabel: 'year', ylabel: 'H₀ (km/s/Mpc)', yticks: [50, 70, 100, 200, 500], xticks: [1930, 1960, 1990, 2020], title: 'the fall of H₀' });
        const rowsFor = (m, a, b) => NEB.map((q) => {
          const today = m === 'today';
          return { name: q[0], alias: q[8], g: q[5], a: q[3] * D2R, d: q[4] * D2R, r: today ? q[6] : q[1] * a * (q[5] > 0 ? b : 1), v: today ? q[7] : q[2] };
        });
        function sandageF2() { // brightest-star factor that, with Baade's ×2, gives Sandage's H ≈ 75
          let lo = 1, hi = 6; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (hubbleFit(M, rowsFor('x', 2, m), solar.value).K > 75) lo = m; else hi = m; } return (lo + hi) / 2;
        }
        let st = null;
        v.render(() => {
          const m = mode.value, today = m === 'today', rows = rowsFor(m, f1.value, f2.value), F = hubbleFit(M, rows, solar.value);
          const xmax = Math.max(...rows.map((q) => q.r)) * 1.12;
          s.setView([0, xmax], [-450, today ? 1500 : 1300]);
          s.hline(0, { color: 'faint', width: 1 });
          // reference slopes: Hubble's K = 500, Planck and SH0ES
          if (!today && (f1.value !== 1 || f2.value !== 1)) { s.fn((r) => 500 * r, { color: 'muted', width: 1.2, dash: [3, 4] }); s.text('Hubble’s K = 500', 1180 / 500, 1180, { color: 'muted', size: 11, weight: 600, align: 'left', dx: 6 }); }
          s.fn((r) => 67.4 * r, { color: 'teal', width: 1.4, dash: [7, 5] });
          s.fn((r) => 73.04 * r, { color: 'red', width: 1.4, dash: [7, 5] });
          s.fn((r) => F.K * r, { color: 'green', width: 2.8 });
          if (!today) { const rc = 1.4 * f1.value * f2.value, vc = 745; s.line(rc - 0.03 * xmax, vc, rc + 0.03 * xmax, vc, { color: 'ink', width: 2 }); s.line(rc, vc - 60, rc, vc + 60, { color: 'ink', width: 2 }); }
          for (const q of rows) s.dot(q.r, q.v - F.sun(q), { r: 5, color: GCOL[q.g] });
          // labels on the reference lines, at the right edge
          const lab = (k, txt, col, dy, fx = 0.97) => { const x = Math.min(xmax * fx, 1400 / k); s.text(txt, x, k * x, { color: col, size: 11.5, weight: 700, align: 'right', dy, dx: -4 }); };
          lab(F.K, `K = ${Math.round(F.K)}`, 'green', 15, 0.93);
          if (today) { lab(67.4, 'Planck 67.4', 'teal', 14); lab(73.04, 'SH0ES 73.0', 'red', -12); }
          else lab(67.4, 'Planck, SH0ES', 'muted', 14);
          // hover: name of the nearest galaxy
          const P = s.pointer;
          if (P.inside) {
            let best = null, bd = 1e9;
            for (const q of rows) { const dx = (s.X(q.r) - s.X(P.x)), dy = (s.Y(q.v - F.sun(q)) - s.Y(P.y)), dd = Math.hypot(dx, dy); if (dd < bd) { bd = dd; best = q; } }
            if (best && bd < 22) { const y = best.v - F.sun(best); s.dot(best.r, y, { r: 8, hollow: true, color: 'ink', width: 2 }); s.text(`${best.name}${best.alias ? ` (${best.alias})` : ''}: ${v.fix(best.r, best.r < 1 ? 3 : 2)} Mpc, ${Math.round(best.v)} km/s`, best.r, y, { dx: best.r > 0.55 * xmax ? -12 : 12, dy: -14, align: best.r > 0.55 * xmax ? 'right' : 'left', size: 12, weight: 600 }); }
          }
          // ---- history panel
          g.hband(66.9, 74.08, { color: 'green', alpha: 0.08 });
          for (const h of HIST) {
            g.line(h.y, h.lo, h.y, h.hi, { color: 'ink', width: 1.6, alpha: 0.7 });
            g.dot(h.y, h.H, { r: 5, color: h.color || 'ink', hollow: !!h.approx });
            g.text(h.who, h.y, h.H, { dx: h.pos[0], dy: h.pos[1], align: h.pos[2], size: 11.5, color: h.color || 'muted', weight: 600 });
          }
          g.hline(F.K, { color: 'gold', width: 2.2 });
          g.corner(`your fit ${Math.round(F.K)} → 1/H₀ = ${v.fix(HT / F.K, 1)} Gyr`, 'tr', { color: 'gold', size: 11.5, weight: 700 });
          st = { F, rows, m, today };
        });
        v.legend([['blue', 'Cepheids / resolved stars', { dot: true }], ['orange', 'brightest stars', { dot: true }], ['purple', 'Virgo cluster', { dot: true }], ['green', 'least-squares fit through the origin'], ['teal', 'Planck 2018', { dash: true }], ['red', 'SH0ES 2022', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { F, today } = st, K = F.K;
          const ap = F.apex ? ` · solar motion ${Math.round(F.apex.V)} km/s toward RA ${Math.round(F.apex.A)}°, Dec ${F.apex.D >= 0 ? '+' : '−'}${Math.abs(Math.round(F.apex.D))}°` : ' · no solar-motion term';
          const head = `$K = ${Math.round(K)} \\pm ${Math.round(F.se)}$ km/s/Mpc from 24 galaxies${ap}, mean residual ${Math.round(F.meanRes)} km/s`;
          const hub = mode.value === 'hubble' && solar.value ? ' (Hubble: 465 ± 50, apex 286°, +40°, 306 km/s; residuals about 150 km/s)' : '';
          const age = ` · Hubble time $1/K$ = **${v.fix(HT / K, 2)} Gyr**`;
          const cmp = today
            ? ` — Planck 2018: 67.4 ± 0.5 (1/H₀ = 14.5 Gyr; ΛCDM age 13.80 ± 0.02 Gyr), SH0ES 2022: 73.04 ± 1.04 (13.4 Gyr): 24 nearby galaxies, whose peculiar motions are a large part of their velocities, already land within their own scatter (±${Math.round(F.se)}) of both values, and the 6 km/s/Mpc “Hubble tension” between them is far below what such a sample can resolve`
            : K > 150 ? ` — younger than the 4.5-billion-year-old Earth, an embarrassment for decades · today: Planck 67.4 ± 0.5, SH0ES 73.04 ± 1.04 km/s/Mpc, ${v.fix(K / 70, 1)}× smaller than this fit` : ` — today: Planck 67.4 ± 0.5 (13.8 Gyr), SH0ES 73.04 ± 1.04 km/s/Mpc`;
          return head + hub + age + cmp;
        });
        syncCtl();
      },
    },
  ],
};
