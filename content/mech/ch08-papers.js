// Classical Mechanics — Chapter 8, landmark papers: Rutherford (1911).
//
// Data (verified):
// - Geiger & Marsden (1913), Phil. Mag. 25: 604–623, Table II (collected results), transcription at
//   desy.de/~hoffmann/Physik/GeigerMarsden-1913: scintillation counts N for silver and gold at deflections 150°…15°
//   (first series) and 30°…5° (second series, own units).
// - Rutherford (1911), Phil. Mag. 21: 669–688 (transcription at chemteam.info): about 1 in 20,000 α particles turned
//   through an average angle of 90° by gold foil about 0.00004 cm thick (1.6 mm air equivalent); 1/8000 from thick
//   platinum (Geiger & Marsden 1909); compound-scattering probability e^{−φ²/θ²} (after J. J. Thomson); central charge
//   ≈ 100e for gold (two estimates, 97 and 114).
// - Modern constants: k e² = 1.44 MeV·fm, α energy of RaC′ (²¹⁴Po) 7.69 MeV, gold number density 5.9 × 10²² cm⁻³.

const KE2 = 1.44; // MeV·fm
const EA = 7.69; // MeV
const NAU = 5.9e22; // atoms / cm³ (gold)
const TFOIL = 4e-5; // cm, the foil quoted by Rutherford
const RATOM = 1.44e5; // fm (1.44 Å), radius of a gold atom
const D2R = Math.PI / 180;
// Geiger & Marsden 1913, Table II
const GM1 = { th: [150, 135, 120, 105, 75, 60, 45, 37.5, 30, 22.5, 15], gold: [33.1, 43.0, 51.9, 69.5, 211, 477, 1435, 3300, 7800, 27300, 132000], silver: [22.2, 27.4, 33.0, 47.3, 136, 320, 989, 1760, 5260, 20300, 105400] };
const GM2 = { th: [30, 22.5, 15, 10, 7.5, 5], gold: [3.1, 8.4, 48.2, 200, 607, 3320], silver: [5.3, 16.6, 93.0, 508, 1710, null] };
const cosec4 = (th) => 1 / Math.sin((th * D2R) / 2) ** 4;
/** Integer with thousands separators, rounded to `sig` significant figures. */
const big = (n, sig = 3) => { const r = Number(Number(n).toPrecision(sig)); return String(Math.round(r)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
const XMIN = 1, XMAX = 4e5, NB = 24, LX0 = Math.log10(XMIN), LX1 = Math.log10(XMAX);
const TH_MIN = 2; // smallest deflection sampled (degrees): the beam out to b_max

/** Trajectory of an α (unit speed, mass 2, E = 1) past a repulsive centre with acceleration a(r) (radial). */
function track(acc, b, L) {
  let x = -L, y = b, vx = 1, vy = 0; const pts = [[x, y]];
  const f = (x, y, vx, vy) => { const r = Math.hypot(x, y) || 1e-9, a = acc(r) / r; return [vx, vy, a * x, a * y]; };
  for (let n = 0; n < 4000; n++) {
    const r = Math.hypot(x, y); if (r > 1.05 * L * Math.SQRT2 && x * vx + y * vy > 0) break;
    const h = Math.max(0.004 * L, Math.min(0.05 * L, 0.06 * r));
    const k1 = f(x, y, vx, vy), k2 = f(x + (h / 2) * k1[0], y + (h / 2) * k1[1], vx + (h / 2) * k1[2], vy + (h / 2) * k1[3]);
    const k3 = f(x + (h / 2) * k2[0], y + (h / 2) * k2[1], vx + (h / 2) * k2[2], vy + (h / 2) * k2[3]), k4 = f(x + h * k3[0], y + h * k3[1], vx + h * k3[2], vy + h * k3[3]);
    x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    vx += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); vy += (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
    pts.push([x, y]);
  }
  return pts;
}

export default {
  collection: 'mech',
  chapter: 8,
  items: [
    // ───────────────────────────────────────────────────────────── 8.23
    {
      num: '8.23',
      kind: 'Paper',
      name: 'The scattering of α and β particles by matter',
      paper: { authors: 'E. Rutherford', year: 1911, title: 'The scattering of α and β particles by matter and the structure of the atom', venue: 'Philosophical Magazine (6th series) 21 (125): 669–688', doi: '10.1080/14786440508637080' },
      introduces: ['mech-8.18'],
      statement: String.raw`Rutherford argued that the large-angle scattering of α particles seen by Geiger and Marsden (about 1 in 20,000 turned through some 90° by a gold foil 0.00004 cm thick) cannot be built up from many small deflections inside J. J. Thomson's atom of spread-out positive charge, whose "compound" scattering makes the chance of a deflection larger than $\phi$ fall like $e^{-\phi^2/\theta^2}$. It must come from a **single** encounter with an intense field: a central charge $Ne$ concentrated in a region smaller than about $3\times10^{-12}$ cm, inside an atom of radius about $10^{-8}$ cm.

Treating the encounter as a Coulomb (em-1.3) orbit, a hyperbola with the centre at a focus, he derived the deflection $\cot(\phi/2) = 2p/b$ for impact parameter $p$, where $b$ is the head-on distance of closest approach, and from it the **single-scattering law** (mech-8.18): the number of particles reaching unit area of a screen at angle $\phi$ is proportional to
$$\operatorname{cosec}^4(\phi/2),$$
to the foil thickness, to $(Ne)^2$ and to $1/(mu^2)^2$. From the available data he estimated $N \approx 100$ for gold. The law holds for point charges and non-relativistic α energies as long as the α stays outside the nucleus; today $N = Z = 79$ for gold and the nucleus has a radius of about 7 fm.`,
      idea: String.raw`In 1909 Geiger and Marsden had seen about 1 α in 8,000 bounce back from a thick platinum plate, which Rutherford later called the most incredible event of his life. Thomson's atom, positive charge spread through the whole atom with electrons embedded, can only nudge a fast α: the deflections add up like a random walk, so large angles are astronomically improbable. Rutherford replaced it by a massive point-like centre and used the mechanics of conic orbits (Kepler problem, mech-8.7; conservation of angular momentum in a central field, mech-2.10) to predict the full angular distribution, with no adjustable shape. Geiger and Marsden's 1913 counts over angles from 5° to 150° followed $\operatorname{cosec}^4(\phi/2)$ while the counting rate changed by a factor of about 250,000. The paper introduced the nuclear atom and the scattering experiment as the way to see inside matter, the method of particle physics ever since; Bohr built his atom on it two years later.`,
      caption: String.raw`**Left**: one atom. Drag **impact parameter** $b$ and watch the α (gold) swing around a gold nucleus on a hyperbola; thin lines show a spread of impact parameters, the red disc is the nucleus (radius about 7 fm). Switch to **Thomson's atom** (radius 1.44 Å, same charge spread through it): the paths are straight to the eye, since the largest possible deflection is about $0.006°$. **Right**: every fired α (uniform beam, $10^6$ at a time) binned by angle, counts per unit solid angle against $1/\sin^4(\theta/2)$ on log–log axes (ticks show $\theta$): Rutherford's law is a line of slope 1. Diamonds: Geiger and Marsden's 1913 counts for the chosen foil (first series; hollow: their second series at small angles), each series scaled by one factor. With Thomson's atom no particle lands anywhere on this plot.`,
      deps: ['mech-8.7', 'em-1.3', 'mech-2.10'],
      refs: [],
      tags: ['scattering', 'nucleus', 'history'],
      credit: 'Ernest Rutherford, 1911',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rutherford_scattering_experiments' },
      viz(v) {
        const M = v.M;
        const atom = v.select('atom', [{ value: 'nucleus', label: 'Rutherford: nucleus' }, { value: 'thomson', label: 'Thomson: plum pudding' }], 'nucleus', { onChange: () => { syncCtl(); restart(); } });
        const foil = v.select('foil', [{ value: 'gold', label: 'gold (Z = 79)' }, { value: 'silver', label: 'silver (Z = 47)' }], 'gold', { onChange: () => restart() });
        const bN = v.slider('impact parameter $b$ (fm)', 0, 150, 22, { step: 0.5 });
        const bT = v.slider('impact parameter $b$ (Å)', 0, 2, 1.0, { step: 0.01 });
        v.button('Fire 10⁶ more', () => fire(1e6));
        const syncCtl = () => { const t = atom.value === 'thomson'; bN.el.hidden = t; bT.el.hidden = !t; };
        const sA = v.stage({ x: [-150, 150], y: [-110, 110], equal: true, axes: false, height: 340, title: 'one atom' });
        const sB = v.stage({ x: [XMIN, XMAX], y: [1e-6, 30], xlog: true, ylog: true, axes: 'box', height: 340, weight: 1.25,
          xticks: [[1, '180°'], [4, '90°'], [16, '60°'], [223, '30°'], [3445, '15°'], [54650, '7.5°']], xlabel: '1/sin⁴(θ/2), log scale (ticks: θ)', ylabel: 'per solid angle, per fired α', title: 'counts against 1/sin⁴(θ/2)' });
        const Z = () => (foil.value === 'gold' ? 79 : 47);
        const Dfm = () => (2 * Z() * KE2) / EA; // head-on closest approach (fm)
        // ---- the beam and the histogram
        let rng = v.rng(1911), N = 0, cnt = new Array(NB).fill(0), back90 = 0, maxDef = 0, below1 = 0;
        const edgesX = M.range(NB + 1).map((k) => 10 ** (LX0 + ((LX1 - LX0) * k) / NB));
        const thOf = (x) => 2 * Math.asin(x ** -0.25); // radians
        const dOmega = edgesX.slice(0, -1).map((x0, k) => 2 * Math.PI * (Math.cos(thOf(edgesX[k + 1])) - Math.cos(thOf(x0))));
        function fire(n) {
          const D = Dfm();
          if (atom.value === 'nucleus') {
            const bmax = (D / 2) / Math.tan((TH_MIN * D2R) / 2);
            for (let i = 0; i < n; i++) {
              const b = bmax * Math.sqrt(rng()), th = 2 * Math.atan(D / (2 * b)), x = 1 / Math.sin(th / 2) ** 4;
              if (th > Math.PI / 2) back90++;
              if (th > maxDef) maxDef = th;
              const k = Math.floor(((Math.log10(x) - LX0) / (LX1 - LX0)) * NB); if (k >= 0 && k < NB) cnt[k]++;
            }
          } else {
            // compound scattering in Thomson's atom: m atoms crossed, each deflecting by D·b·√(R²−b²)/R³ in a random direction
            const m = Math.round(Math.PI * (RATOM * 1e-13) ** 2 * NAU * TFOIL), sig = Math.sqrt((m * (D / RATOM) ** 2) / 6 / 2);
            for (let i = 0; i < n; i++) {
              const u = Math.max(1e-300, rng()), th = sig * Math.sqrt(-2 * Math.log(u)); // Rayleigh: |sum of 2D Gaussian kicks|
              if (th > maxDef) maxDef = th;
              if (th < D2R) below1++;
              const x = 1 / Math.sin(Math.min(th, Math.PI) / 2) ** 4, k = Math.floor(((Math.log10(x) - LX0) / (LX1 - LX0)) * NB); if (k >= 0 && k < NB) cnt[k]++;
              if (th > Math.PI / 2) back90++;
            }
          }
          N += n;
        }
        function restart() { rng = v.rng(1911); N = 0; cnt = new Array(NB).fill(0); back90 = 0; maxDef = 0; below1 = 0; fire(1e6); }
        restart();
        // trajectories (cached)
        let tKey = null, fan = [];
        const accN = (D) => (r) => D / (2 * r * r); // a = F/m with E = ½·2·1² = 1
        const accT = (D) => (r) => (r < RATOM ? (D * r) / (2 * RATOM ** 3) : 0);
        let st = null;
        v.animate((t) => {
          const D = Dfm(), thom = atom.value === 'thomson';
          if (thom) sA.setView([-2.6e5, 2.6e5], [-1.9e5, 1.9e5]); else sA.setView([-150, 150], [-110, 110]);
          const L = thom ? 2.6e5 : 150, key = `${thom}|${D}`;
          if (key !== tKey) { tKey = key; fan = []; for (let i = -9; i <= 9; i++) { if (!i) continue; const b = (i / 9) * (thom ? 1.7e5 : 105); fan.push(track(thom ? accT(D) : accN(D), b, L)); } }
          if (thom) {
            sA.circle(0, 0, RATOM, { fill: 'red', fillAlpha: 0.1, color: 'red', width: 1.2 });
            const rr = v.rng(7); for (let k = 0; k < 79 && k < Z(); k++) { const a = rr() * 2 * Math.PI, r = RATOM * Math.sqrt(rr()); sA.dot(r * Math.cos(a), r * Math.sin(a), { r: 1.8, color: 'blue', ring: false }); }
          } else {
            sA.circle(0, 0, D, { color: 'muted', width: 1, dash: [4, 4] });
            sA.circle(0, 0, 1.2 * Math.cbrt(Z() === 79 ? 197 : 108), { fill: 'red', fillAlpha: 0.55, color: 'red', width: 1 });
          }
          for (const P of fan) sA.path(P, { color: 'accent', width: 1.1, alpha: 0.55 });
          const b = thom ? bT.value * 1e5 : bN.value, P = track(thom ? accT(D) : accN(D), b, L);
          sA.path(P, { color: 'gold', width: 2.6 });
          const k = Math.floor(((t % 4) / 4) * (P.length - 1)); sA.dot(P[k][0], P[k][1], { r: 5, color: 'gold' });
          // deflection of the highlighted path
          const th = thom ? (b < RATOM ? (D * b * Math.sqrt(RATOM ** 2 - b ** 2)) / RATOM ** 3 : 0) : 2 * Math.atan(D / (2 * Math.max(b, 1e-9)));
          sA.corner(thom ? 'scale: Å (1 Å = 100 000 fm) · blue: electrons' : `scale: fm · dashed: closest head-on approach ${v.fix(D, 1)} fm`, 'bl', { size: 11 });
          // ---- histogram
          const per = cnt.map((c, i) => (c ? c / N / dOmega[i] : 0));
          sB.hist({ edges: edgesX, counts: per }, { color: 'gold', fillAlpha: 0.35, base: 1e-7 });
          const Dn = D, bmax = (Dn / 2) / Math.tan((TH_MIN * D2R) / 2), pred = (x) => ((Dn / 4) ** 2 * x) / (Math.PI * bmax * bmax);
          sB.fn(pred, { color: 'accent', width: 2.2 });
          // Geiger–Marsden, each series scaled by one factor (least squares in log)
          const ser = (S) => { const pts = S.th.map((a, i) => [cosec4(a), S[foil.value][i]]).filter((q) => q[1]); const c = Math.exp(M.mean(pts.map(([x, n]) => Math.log(pred(x) / n)))); return pts.map(([x, n]) => [x, n * c]); };
          const g1 = ser(GM1), g2 = ser(GM2);
          for (const [x, y] of g2) sB.poly([[x / 1.18, y], [x, y * 1.45], [x * 1.18, y], [x, y / 1.45]], { color: 'ink', width: 1.4, fill: 'panel', fillAlpha: 1 });
          for (const [x, y] of g1) sB.poly([[x / 1.18, y], [x, y * 1.45], [x * 1.18, y], [x, y / 1.45]], { color: 'ink', width: 1, fill: 'ink', fillAlpha: 0.85 });
          if (thom) { sB.text(`Thomson’s atom: all ${big(N)} α`, 1.6, 2, { size: 12.5, weight: 700, color: 'red', align: 'left' }); sB.text(`deflected by less than ${v.fix(maxDef / D2R + 0.005, 2)}°: none reach this plot`, 1.6, 0.6, { size: 12.5, weight: 700, color: 'red', align: 'left' }); }
          // slope of the simulated points and of GM's
          const sim = per.map((y, i) => [Math.sqrt(edgesX[i] * edgesX[i + 1]), y, cnt[i]]).filter((q) => q[2] >= 5);
          const fitS = sim.length > 2 ? M.linreg(sim.map((q) => Math.log10(q[0])), sim.map((q) => Math.log10(q[1]))) : null;
          const fitG = M.linreg(g1.map((q) => Math.log10(q[0])), g1.map((q) => Math.log10(q[1])));
          st = { D, th, b, thom, fitS, fitG, bmax };
        }, { still: 1.2 });
        v.legend([['gold', 'fired α (histogram)', { area: true }], ['accent', 'Rutherford: $\\propto 1/\\sin^4(\\theta/2)$'], ['ink', 'Geiger & Marsden 1913', { dot: true }], ['red', 'atom: nucleus / positive sphere', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { D, th, b, thom, fitS, fitG, bmax } = st;
          const pFoil = (n) => Math.PI * NAU * TFOIL * ((D * 1e-13) / 2) ** 2 * n; // n = cot²(φ/2) factor
          if (thom) {
            const m = Math.round(Math.PI * (RATOM * 1e-13) ** 2 * NAU * TFOIL), thT = Math.sqrt(m / 6) * (D / RATOM), lg = -(((90 * D2R) / thT) ** 2) / Math.LN10, lg2 = -((90 / 2.4) ** 2) / Math.LN10;
            return `Thomson's atom (positive charge ${Z()}e spread over a sphere of 1.44 Å): this α is deflected by ${v.fix(th / D2R, 5)}°, the most any single atom can do is $D/2R$ = ${v.fix((D / (2 * RATOM)) / D2R, 4)}° · crossing the 0.00004 cm foil means about ${m} atoms, a random walk of rms angle ${v.fix(thT / D2R, 2)}°, so $P(\\theta > 90°) = e^{-\\phi^2/\\theta^2} \\approx 10^{${Math.round(lg)}}$ (even with $\\theta$ = 2.4°, the spread Geiger measured in a foil about five times thicker: $10^{${Math.round(lg2)}}$) · observed: about 1 in 20,000 (Geiger & Marsden, quoted by Rutherford)`;
          }
          const rmin = (D / 2) * (1 + Math.sqrt(1 + (2 * b / D) ** 2));
          const fracSim = (back90 / N) * Math.PI * (bmax * 1e-13) ** 2 * NAU * TFOIL, frac = pFoil(1);
          return `$b$ = ${v.fix(b, 1)} fm → deflection $\\theta = 2\\arctan(D/2b)$ = **${v.fix(th / D2R, 1)}°**, closest approach ${v.fix(rmin, 1)} fm ($D$ = ${v.fix(D, 1)} fm for Z = ${Z()}, 7.69 MeV) · ${big(N)} fired: log–log slope ${fitS ? v.fix(fitS.slope, 3) : '—'} (law: 1), Geiger & Marsden ${v.fix(fitG.slope, 3)} · ${back90} turned back past 90°: for a ${Z() === 79 ? 'gold' : 'silver'} foil 0.00004 cm thick that is 1 in ${big(1 / fracSim)} (formula: 1 in ${big(1 / frac)}; with Rutherford's estimate $N$ = 100 for gold, 1 in ${big(1 / (frac * (100 / Z()) ** 2))}) — observed for gold about 1 in 20,000`;
        });
        syncCtl();
      },
    },
  ],
};
