// Fluid Mechanics — Chapter 6, landmark paper: Reynolds (1883).
//
// Data (verified):
// - Reynolds (1883), Phil. Trans. R. Soc. 174: 935–982, scan on archive.org (philtrans06508925).
//   Table I (colour-band experiments, 1880): pipe, temperature (°C) and velocity (m/s) at which steady motion broke down,
//   29 runs in three glass tubes (D = 0.0268, 0.01527, 0.007886 m), read from the page image. Check: recomputing
//   log B_s = log P − log v − log D with Reynolds's P = 1/(1 + 0.0336T + 0.000221T²) reproduces the printed column for
//   26 of 29 runs; runs 5, 7 and 18 differ by 0.010–0.011 in the original arithmetic. The mean of the printed values is
//   1.64141 (paper: 1.64139, B_s = 43.79). (Run 23 prints 116 s for the discharge time, but its log time 2.33445 and
//   velocity correspond to 216 s.)
// - Table III (resistance experiments, 29 Jan 1883): pipe No. 4, lead, D = 6.15 mm; slope of pressure i and velocity
//   v (m/s), 33 rows, each checked against the printed log i and log v. One row (i = 0.6138, v = 1.268) is printed
//   consistently but lies far off the others (probably a misprint of v); it is shown hollow.
// - Critical values: steady motion breaks down at v_c = P/(43.79 D) in still water (Table I); eddies die out below
//   v_c = P/(278 D) (resistance experiments, §16). In terms of Re = vD/ν with ν = ν₀P, ν₀ = 1.79×10⁻⁶ m²/s at 0 °C:
//   Re ≈ 12,800 and ≈ 2,000.
// - Today: sustained turbulence in pipe flow sets in at Re ≈ 2,040 (Avila et al. 2011, Science 333: 192–196); laminar
//   flow has been kept to Re ≈ 100,000 with extreme care (Pfenninger 1961).

const PIPE_D = { 1: 0.0268, 2: 0.01527, 3: 0.007886 };
// Table I: pipe, temperature (°C), critical velocity (m/s), printed log B_s
const TAB1 = [[1, 8.3, 0.6270, 1.66200], [1, 21, 0.4325, 1.67930], [1, 15, 0.5374, 1.64936], [1, 12, 0.6270, 1.61730], [1, 13, 0.5878, 1.64464], [1, 13, 0.5614, 1.65363], [1, 13, 0.5878, 1.64464], [1, 5, 0.6967, 1.65898], [1, 5, 0.7235, 1.64269], [1, 10, 0.6068, 1.65546], [1, 11, 0.5870, 1.65716], [2, 22, 0.7476, 1.67523], [2, 11, 1.052, 1.64814], [2, 11, 1.072, 1.64017], [2, 4, 1.396, 1.61486], [2, 4, 1.396, 1.61486], [2, 4, 1.396, 1.61486], [2, 6, 1.348, 1.59371], [2, 6, 1.362, 1.59863], [3, 11, 1.967, 1.66300], [3, 10.5, 1.932, 1.67687], [3, 11, 1.982, 1.65903], [3, 11, 2.004, 1.65503], [3, 4, 2.637, 1.62446], [3, 4, 2.517, 1.64514], [3, 6, 2.460, 1.62856], [3, 6, 2.460, 1.62856], [3, 6, 2.488, 1.62359], [3, 6, 2.446, 1.63102]];
// Table III, pipe No. 4 (D = 6.15 mm): slope of pressure i, velocity v (m/s)
const TAB3 = [[0.0086, 0.0785], [0.01720, 0.1480], [0.0258, 0.2265], [0.0345, 0.3000], [0.0430, 0.3640], [0.0516, 0.4426], [0.0602, 0.4865], [0.0682, 0.5106], [0.0682, 0.5106], [0.0774, 0.5483], [0.0861, 0.5483], [0.0946, 0.5650], [0.1033, 0.5822], [0.1120, 0.5862], [0.1206, 0.6096], [0.1292, 0.6339], [0.1378, 0.6520], [0.2148, 0.8185], [0.3014, 1.033], [0.4306, 1.283], [0.6138, 1.268], [0.8185, 1.854], [1.021, 2.158], [1.228, 2.388], [1.433, 2.661], [1.637, 2.729], [1.637, 2.674], [2.042, 3.112], [2.455, 3.540], [2.865, 3.873], [3.274, 4.198], [3.444, 4.467], [3.873, 4.689]];
const NU0 = 1.79e-6; // m²/s at 0 °C, consistent with Reynolds's P(T)
const reyP = (T) => 1 / (1 + 0.0336 * T + 0.000221 * T * T);
/** Modern kinematic viscosity of water (m²/s), Vogel equation for μ and ρ ≈ 999.7 kg/m³. */
const nuWater = (T) => (2.414e-5 * 10 ** (247.8 / (T + 273.15 - 140))) / 999.7;

export default {
  collection: 'fluid',
  chapter: 6,
  items: [
    {
      num: '6.14',
      kind: 'Paper',
      name: 'Whether the motion of water shall be direct or sinuous',
      paper: { authors: 'Osborne Reynolds', year: 1883, title: 'An Experimental Investigation of the Circumstances Which Determine Whether the Motion of Water Shall Be Direct or Sinuous, and of the Law of Resistance in Parallel Channels', venue: 'Philosophical Transactions of the Royal Society of London 174: 935–982', doi: '10.1098/rstl.1883.0029' },
      introduces: ['fluid-6.5', 'fluid-10.10'],
      statement: String.raw`Watching a thin band of dye in water flowing through glass tubes, Reynolds showed that whether the flow is "direct" (laminar) or "sinuous" (turbulent) depends on the speed $U$, the diameter $D$ and the viscosity $\mu$ only through the dimensionless combination
$$\mathrm{Re} = \frac{\rho U D}{\mu}.$$
In very still water the steady motion broke down suddenly at a critical value (his $B_s = 43.79$ in metres, $\mathrm{Re} \approx 12{,}800$), while in his resistance experiments eddies, once present, died out below a much lower value ($\approx 278$, $\mathrm{Re} \approx 2{,}000$). Below that the pressure gradient is proportional to the velocity (Poiseuille's law); well above it, to $v^{1.723}$, with a single curve for all tubes and temperatures when plotted in these variables.

Scope: smooth straight pipes, fully developed flow. The upper critical number depends on how quiet the inflow is; the lower one is the robust threshold, today placed at $\mathrm{Re} \approx 2{,}040$.`,
      idea: String.raw`Stokes had noted that viscous flows of different sizes are similar when $UD/\nu$ is the same, and engineers knew that resistance in pipes went from linear to roughly quadratic in speed, but no one had connected the two. Reynolds argued from the equations of motion (fluid-6.4) that the ratio of inertial to viscous effects, $\rho U D/\mu$ (fluid-6.8), must decide the character of the flow, then tested it: three glass tubes in a tank, a dye filament at the bell-mouthed entrance, the temperature varied from 4 °C to 22 °C to change the viscosity. The critical velocities fell inversely with diameter and with the viscosity exactly as predicted. His second set of experiments, in lead pipes with pressure gauges, found the lower critical velocity and the 1.723 power law, and introduced the "logarithmic homologue" (a log–log plot) to collapse data. The dimensionless number, later named after him by Sommerfeld, became the master parameter of fluid mechanics, the paper the founding text of turbulence research (fluid-6.5, fluid-10.10), and the question of exactly how turbulence sets in was only settled in 2011.`,
      caption: String.raw`**Top**: Reynolds's dye experiment (schematic): drag the **Reynolds number**; in a **still tank** the filament stays straight until Re passes about 12,800 and then breaks into eddies a little way down the tube, in a **disturbed** inflow the threshold drops towards about 2,000. **Bottom left**: his 29 measured critical points from Table I, converted to Re with today's viscosity of water, for three tubes and temperatures from 4 to 22 °C: they line up at one Re although the velocities differ fourfold. **Bottom right**: his resistance data for pipe No. 4 (Table III) on his own log–log "homologue": slope 1 (Poiseuille) up to the critical point, slope near 1.72 above it; the gold line marks your Re.`,
      deps: ['fluid-6.4', 'fluid-6.8'],
      refs: [],
      tags: ['turbulence', 'Reynolds number', 'history'],
      credit: 'Osborne Reynolds, 1883',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reynolds_number' },
      viz(v) {
        const M = v.M;
        const lr = v.slider('Reynolds number (log₁₀)', 2.7, 4.6, 3.5, { step: 0.005, fmt: (x) => Math.round(10 ** x).toLocaleString('en-US') });
        const inflow = v.select('inflow', [{ value: 'still', label: 'still tank (colour bands)' }, { value: 'dist', label: 'disturbed' }], 'still');
        const pipe = v.select('tube', [{ value: '1', label: 'No. 1 (26.8 mm)' }, { value: '2', label: 'No. 2 (15.3 mm)' }, { value: '3', label: 'No. 3 (7.9 mm)' }], '1');
        const T = v.slider('water temperature (°C)', 4, 22, 10, { step: 0.5 });
        const S = v.stage({ x: [0, 10], y: [-1.6, 1.6], axes: false, height: 190, full: true, title: 'the colour band (schematic)' });
        const C = v.stage({ x: [0, 24], y: [8000, 16000], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'temperature (°C)', ylabel: 'critical Re = v_c D / ν', title: 'Table I: where steady motion broke down' });
        const R = v.stage({ x: [0.06, 6], xlog: true, y: [0.005, 6], ylog: true, axes: 'box', gutter: true, height: 300, weight: 1.1, minWidth: 260, xlabel: 'velocity v (m/s)', ylabel: 'pressure slope i', title: 'Table III: resistance in pipe No. 4' });
        const rng = v.rng(7);
        const eddy = Array.from({ length: 70 }, () => [rng(), rng() * 2 - 1, 0.6 + rng() * 1.4, rng() * 6.283]);
        const reTab = TAB1.map(([p, Tc, vc]) => [Tc, (vc * PIPE_D[p]) / nuWater(Tc), p]);
        const reMean = M.mean(reTab.map((r) => r[1]));
        let st = null;
        v.animate((t) => {
          const Re = 10 ** lr.value, still = inflow.value === 'still';
          const Rc = still ? 12800 : 2000, D = PIPE_D[pipe.value], U = (Re * nuWater(T.value)) / D;
          // ---- pipe and dye
          S.rect(0, -1, 10, 1, { fill: 'blue', fillAlpha: 0.06, color: 'muted', width: 1.5 });
          S.poly([[-0.2, 1.5], [0.25, 1], [0.25, -1], [-0.2, -1.5]], { fill: 'blue', fillAlpha: 0.06, color: 'muted', width: 1.5 });
          const ex = Re / Rc; // >1: unstable
          const xb = ex <= 1 ? 99 : Math.max(1.2, 8.5 - 4.2 * Math.log(ex) / Math.log(4)); // where the band bursts
          const wav = ex > 0.85 ? Math.min(0.25, 0.6 * (ex - 0.85)) : 0;
          const pts = [];
          for (let x = 0.25; x <= Math.min(10, xb); x += 0.02) pts.push([x, wav * Math.sin(5 * x - 9 * t) * Math.min(1, (x - 0.25) / 3)]);
          S.path(pts, { color: 'red', width: 2.6 });
          if (xb < 10) {
            const flash = 0.55 + 0.45 * Math.sin(3 * t);
            S.rect(xb + 0.4, -1, 10, 1, { fill: 'red', fillAlpha: 0.1 * flash + 0.06, stroke: false });
            for (const [ux, uy, rr, ph] of eddy) {
              const x = xb + 0.3 + ux * (10 - xb - 0.3), y = uy * 0.8;
              if (x > 9.95) continue;
              const r = 0.1 * rr * Math.min(1, (x - xb) / 1.2);
              S.curve((s) => [x + r * Math.cos(s + ph + 2 * t) * (1 + s / 8), y + r * Math.sin(s + ph + 2 * t) * (1 + s / 8)], 0, 7, { color: 'red', width: 1.4, alpha: 0.7, n: 30 });
            }
          }
          S.corner(`Re = ${Math.round(Re).toLocaleString('en-US')} · U = ${v.fix(U * 100, 1)} cm/s in tube No. ${pipe.value} at ${v.fix(T.value, 1)} °C · ${Re < Rc ? (Re < 0.85 * Rc ? 'direct (laminar)' : 'wavering') : 'sinuous: eddies'}`, 'tl', { size: 12, weight: 700, color: Re < Rc ? 'blue' : 'red' });
          // ---- Table I points
          C.hband(12800 * 0.96, 12800 * 1.04, { color: 'green', alpha: 0.1 });
          C.hline(1 / (43.79 * NU0), { color: 'green', width: 1.6, dash: [6, 4] });
          const col = { 1: 'blue', 2: 'orange', 3: 'purple' };
          for (const [Tc, re, p] of reTab) C.dot(Tc, re, { r: 5, color: col[p] });
          C.corner('dashed: B_s = 43.79 ⇒ Re ≈ 12,760', 'br', { size: 11.5, color: 'green', weight: 600 });
          if (Re > 8000 && Re < 16000) C.hline(Re, { color: 'gold', width: 2 });
          // ---- resistance data
          const vNow = (Re * nuWater(8)) / 0.00615; // pipe 4, about 8 °C
          const lam = (vv) => 0.0516 * (vv / 0.4426); // Poiseuille through the critical point
          const tur = (vv) => 0.4306 * (vv / 1.283) ** 1.723;
          R.fn(lam, { color: 'blue', width: 1.6, dash: [6, 4], domain: [0.06, 1.2] });
          R.fn((vv) => 3.873 * (vv / 4.689) ** 1.723, { color: 'red', width: 1.6, dash: [6, 4], domain: [0.5, 6] });
          TAB3.forEach(([i, vv], k) => R.dot(vv, i, { r: 4.2, color: vv <= 0.4426 ? 'blue' : vv < 0.7 ? 'orange' : 'red', hollow: k === 20 }));
          R.vline(0.4426, { color: 'faint', width: 1, dash: [3, 3] });
          R.text('critical point', 0.4426, 0.006, { dx: -4, align: 'right', size: 11, color: 'muted' });
          if (vNow > 0.06 && vNow < 6) { R.vline(vNow, { color: 'gold', width: 2 }); R.text(`your Re (≈ ${v.fix(vNow, 2)} m/s)`, vNow, 4, { dx: vNow > 1.5 ? -6 : 6, align: vNow > 1.5 ? 'right' : 'left', size: 11, color: 'gold', weight: 700 }); }
          st = { Re, Rc, vNow, tur, lam };
        }, { period: 6.283, still: 1.2 });
        v.legend([['blue', 'tube 1 / laminar branch', { dot: true }], ['orange', 'tube 2 / transitional', { dot: true }], ['purple', 'tube 3', { dot: true }], ['red', 'turbulent branch (slope 1.723)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const sl = M.linreg(TAB3.filter((r, k) => r[1] > 0.8 && k !== 20).map((r) => Math.log10(r[1])), TAB3.filter((r, k) => r[1] > 0.8 && k !== 20).map((r) => Math.log10(r[0]))).slope;
          const sl0 = M.linreg(TAB3.slice(0, 6).map((r) => Math.log10(r[1])), TAB3.slice(0, 6).map((r) => Math.log10(r[0]))).slope;
          const vcT = reyP(T.value) / (43.79 * PIPE_D[pipe.value]);
          return `Table I: mean critical Re **${Math.round(reMean).toLocaleString('en-US')}** over 29 runs (range ${Math.round(Math.min(...reTab.map((r) => r[1]))).toLocaleString('en-US')}–${Math.round(Math.max(...reTab.map((r) => r[1]))).toLocaleString('en-US')}); Reynolds’s law $v_c = P/(43.79\\,D)$ predicts ${v.fix(vcT, 3)} m/s for tube ${pipe.value} at ${v.fix(T.value, 1)} °C. Lower critical value $P/(278\\,D)$: Re ≈ ${Math.round(1 / (278 * NU0)).toLocaleString('en-US')} — today 2,040 (Avila et al. 2011).\n` +
            `Pipe No. 4: log–log slope ${v.fix(sl0, 2)} below the critical point (Poiseuille: 1), ${v.fix(sl, 2)} for v > 0.8 m/s (Reynolds, from all his tubes: 1.723; smooth-pipe turbulence today: about 1.75, Blasius).`;
        });
      },
    },
  ],
};
