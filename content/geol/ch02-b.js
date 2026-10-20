// Geology & Geophysics — Chapter 2: Radiometric dating (part b: 2.7–2.12)
//
// Sources checked / provenance (Oct 2026):
//   2.12 Patterson (1956), Geochim. Cosmochim. Acta 10: 230–237. Table 1 (206/204, 207/204 of Nuevo Laredo, Forest City,
//        Modoc, Henbury, Canyon Diablo), the 2% / 1% error estimates, the constants (λ238 = 1.537e-10, λ235 = 9.72e-10,
//        238U/235U = 137.8), the ocean-sediment lead (19.0, 15.5) and the result 4.55 ± 0.07 Gyr were read from a scan of
//        the paper (text layer and page image).
//   2.9  primordial lead of Canyon Diablo troilite 9.307 / 10.294 (Tatsumoto, Knight & Allègre 1973; confirmed by a search
//        result, not re-read in the paper); the other numbers are illustrative.
//   2.8  Dodson (1973) closure-temperature formula with a sphere (A = 55). Activation energies and nominal closure
//        temperatures at 10 °C/Myr are typed from the literature values as remembered and rounded (zircon Pb 550 kJ/mol Cherniak & Watson 2001; titanite 330 Cherniak 1993; hornblende 268 Harrison 1981; muscovite 183 Hames & Bowring 1994; biotite ~211 Grove & Harrison 1996; zircon He ~169 Reiners 2004; apatite He ~138 Farley 2000) (zircon U–Pb ≳ 900 °C, titanite ≈ 650, hornblende
//        ≈ 530, muscovite ≈ 400, biotite ≈ 320, zircon (U–Th)/He ≈ 180, apatite (U–Th)/He ≈ 70); D0/a² is back-solved
//        from them, so only the dependence on cooling rate is computed.
//   2.7  retained-argon profile: exact series solution for diffusion out of a sphere; the numbers are illustrative.
//   2.10 ¹⁰Be half-life 1.387 Myr, attenuation length 160 g/cm², sea-level high-latitude production of order 4 atoms/g/yr
//        in quartz: values from memory, rounded.
//   2.11 period boundaries (ICS 2023-ish, rounded) and the quoted dated horizons (Jack Hills zircon 4.40 Ga, Acasta
//        gneiss ≈ 4.0 Ga, K–Pg 66.04 Ma, P–Tr 251.9 Ma, Cambrian base 538.8 Ma, …) are from memory; the stratigraphic
//        section in the first panel is invented for illustration.

import { LAM, U_RATIO, LN2, fmtYr, fmtMa } from './ch02.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const Rgas = 8.314;

// ── 2.7 helpers ─────────────────────────────────────────────────────────────
/** Fraction of the initial argon retained at relative radius r (0–1) after diffusion with Dt/a² = tau (sphere, zero surface concentration). */
function retained(r, tau) {
  if (tau <= 0) return 1;
  r = Math.max(r, 1e-4);
  let s = 0;
  for (let n = 1; n <= 80; n++) {
    const e = Math.exp(-n * n * Math.PI * Math.PI * tau);
    if (e < 1e-13) break;
    s += ((n % 2 ? 1 : -1) / n) * Math.sin(n * Math.PI * r) * e;
  }
  return clamp((2 * s) / (Math.PI * r), 0, 1);
}

// ── 2.8 helpers ─────────────────────────────────────────────────────────────
const CLOS = [
  { nm: 'zircon U–Pb', E: 550e3, Tc: 900, c: 'purple' },
  { nm: 'titanite U–Pb', E: 330e3, Tc: 650, c: 'pink' },
  { nm: 'hornblende K–Ar', E: 270e3, Tc: 530, c: 'red' },
  { nm: 'muscovite K–Ar', E: 183e3, Tc: 400, c: 'orange' },
  { nm: 'biotite K–Ar', E: 211e3, Tc: 320, c: 'gold' },
  { nm: 'zircon (U–Th)/He', E: 170e3, Tc: 180, c: 'green' },
  { nm: 'apatite (U–Th)/He', E: 138e3, Tc: 70, c: 'teal' },
];
const MYR = 3.15576e13; // seconds
/** Dodson closure temperature (°C) of system q at cooling rate rate (°C per Myr). */
function dodson(q, rate) {
  if (!q.d0) {
    const T0 = q.Tc + 273.15, tau0 = (Rgas * T0 * T0) / (q.E * (10 / MYR));
    q.d0 = Math.exp(q.E / (Rgas * T0)) / (55 * tau0);
  }
  const Td = rate / MYR;
  let T = q.Tc + 273.15;
  for (let i = 0; i < 30; i++) { const tau = (Rgas * T * T) / (q.E * Td); T = q.E / Rgas / Math.log(55 * tau * q.d0); }
  return T - 273.15;
}

// ── 2.9 / 2.12 helpers ──────────────────────────────────────────────────────
/** Slope of the Pb–Pb isochron (207/204 against 206/204) for age T (yr), constants l5, l8, and k = 238U/235U. */
const pbSlope = (T, l5, l8, k) => (Math.expm1(l5 * T)) / (k * Math.expm1(l8 * T));
/** Age (yr) from a slope, by bisection. */
function pbAge(slope, l5, l8, k) {
  let lo = 1e6, hi = 8e9;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (pbSlope(m, l5, l8, k) < slope) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const A0 = 9.307, B0 = 10.294; // primordial lead, Canyon Diablo troilite

export default {
  collection: 'geol',
  chapter: 2,
  items: [
    // ───────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Method',
      name: 'K–Ar and ⁴⁰Ar/³⁹Ar dating',
      statement: String.raw`${'$'}^{40}$K decays to ${'$'}^{40}$Ar by electron capture (branch $\lambda_e$ of the total $\lambda$) and to ${'$'}^{40}$Ca by $\beta^-$, so a closed mineral's age is $t=\frac1\lambda\ln\bigl(1+\frac{\lambda}{\lambda_e}\frac{^{40}\mathrm{Ar}^*}{^{40}\mathrm{K}}\bigr)$. In the ${'$'}^{40}$Ar/${'$'}^{39}$Ar variant the sample is irradiated with neutrons, which turn part of the ${'$'}^{39}$K into ${'$'}^{39}$Ar in proportion to the K, so K and Ar are measured as two argon isotopes on the same gas. The sample is then heated in steps; each step gives an apparent age from its ${'$'}^{40}$Ar*/${'$'}^{39}$Ar. A set of consecutive steps with equal ages (a *plateau*, conventionally $\ge3$ steps and $\gtrsim50\%$ of the ${'$'}^{39}$Ar) gives the age of the sample.`,
      idea: String.raw`The age equation (geol-2.2) needs parent and daughter in the same aliquot; irradiation converts the K measurement into an argon measurement, so one gas, released in steps from the outer to the inner parts of the crystal, gives many independent ages. Argon lost by later heating leaves the outer part of each grain depleted (diffusion out of a sphere), so early steps give young apparent ages, while the retentive core gives the true age as a plateau. Excess argon trapped in the rims shows as old early steps. Heating one gas gives a built-in test of closure that the single K–Ar age lacks.`,
      caption: String.raw`Left: age spectrum, one box per heating step ($x$: cumulative ${'$'}^{39}$Ar released, $y$: apparent age, boxes $\pm1\sigma$). Right: how much argon each radius of the grain kept. Raise the argon loss ($Dt/a^2$) to see the rim lose argon and the early steps go young; add excess argon and the first steps go old. The green band is the plateau, if the 3-step / 50% rule finds one; the dashed red line is the ordinary total-gas (K–Ar) age.`,
      deps: ['geol-2.2'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['K–Ar', 'Ar–Ar', 'plateau'],
      scope: String.raw`Needs a mineral that closed to argon at crystallisation, no inherited or trapped excess argon, and a known neutron-flux monitor ($J$ factor); the plateau criterion is a convention.`,
      viz(v) {
        const T = v.slider('true age $T$ (Ma)', 10, 3000, 500, { log: true, sig: 3 });
        const tau = v.slider('argon loss $Dt/a^2$', 0, 0.1, 0.004, { step: 0.001, decimals: 3 });
        const ex = v.slider('excess $^{40}$Ar (× radiogenic, first gas)', 0, 0.6, 0, { step: 0.01 });
        const nst = v.slider('heating steps', 8, 30, 16, { int: true });
        const prec = v.slider('step precision (%)', 0.3, 5, 1.5, { step: 0.1 });
        const l = LAM.K40, kf = LAM.K40 / LAM.K40e;
        const sp = v.stage({ x: [0, 100], y: [0, 700], axes: 'box', gutter: true, xlabel: 'cumulative $^{39}$Ar released (%)', ylabel: 'apparent age (Ma)', height: 340, weight: 1.5 });
        const sr = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'radius / grain radius', ylabel: 'retained radiogenic Ar', height: 340, weight: 1 });
        let st = {};
        v.render(() => {
          const n = Math.round(nst.value), Ty = T.value * 1e6;
          const Rt = Math.expm1(l * Ty) / kf;
          const steps = [];
          for (let k = 0; k < n; k++) {
            let c = 0, e = 0; const m = 16;
            for (let q = 0; q < m; q++) { const F = (k + (q + 0.5) / m) / n; c += retained(Math.cbrt(1 - F), tau.value) / m; e += Math.exp(-F / 0.08) / m; }
            const R = Rt * (c + ex.value * e);
            const a = Math.log(1 + kf * R) / l / 1e6;
            steps.push({ a, R, sg: (prec.value / 100) * a, F0: k / n, F1: (k + 1) / n });
          }
          // plateau: longest run (≥3 steps, ≥50% of the gas) consistent within 2σ
          let best = null;
          for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
            const run = steps.slice(i, j + 1), mu = run.reduce((s, q) => s + q.a, 0) / run.length;
            if (run.every((q) => Math.abs(q.a - mu) <= 2 * q.sg) && (j - i + 1) / n >= 0.5 && (!best || j - i > best.j - best.i)) best = { i, j, mu, sg: mu * prec.value / 100 / Math.sqrt(run.length) };
          }
          const Rtot = steps.reduce((s, q) => s + q.R, 0) / n, tot = Math.log(1 + kf * Rtot) / l / 1e6;
          const ymax = Math.max(1.35 * T.value, ...steps.map((q) => q.a + q.sg) .map((x) => x * 1.05));
          sp.setView([0, 100], [0, ymax]);
          if (best) sp.rect(steps[best.i].F0 * 100, best.mu - 2 * best.sg, steps[best.j].F1 * 100, best.mu + 2 * best.sg, { fill: 'green', fillAlpha: 0.22, stroke: false });
          sp.hline(T.value, { color: 'ink', dash: true });
          sp.hline(tot, { color: 'red', dash: true });
          steps.forEach((q, k) => {
            const inPl = best && k >= best.i && k <= best.j;
            sp.rect(q.F0 * 100, q.a - q.sg, q.F1 * 100, q.a + q.sg, { fill: inPl ? 'green' : 'accent', fillAlpha: 0.45, color: inPl ? 'green' : 'accent', width: 1 });
          });
          sr.fn((r) => retained(r, tau.value), { color: 'blue', width: 3, n: 200 });
          for (let k = 1; k < n; k++) sr.vline(Math.cbrt(1 - k / n), { color: 'faint', width: 0.7, alpha: 0.6 });
          sr.hline(1, { color: 'faint', dash: true });
          sr.text('rim', 0.97, 0.06, { align: 'right', color: 'muted', size: 11 }); sr.text('core', 0.03, 0.06, { color: 'muted', size: 11 });
          st = { best, tot, steps, n };
        });
        v.legend([['accent', 'heating step'], ['green', 'plateau'], ['ink', 'true age', { dash: true }], ['red', 'total-gas age', { dash: true }]]);
        v.readout(() => {
          const { best, tot, n } = st;
          return String.raw`True age ${v.fix(T.value, 0)} Ma. Total-gas ("K–Ar") age **${v.fix(tot, 0)} Ma** (${v.fix(100 * (tot / T.value - 1), 1)}% off).
${best ? `Plateau: ${best.j - best.i + 1} of ${n} steps, ${v.fix(100 * (best.j - best.i + 1) / n, 0)}% of the gas, age **${v.fix(best.mu, 0)} ± ${v.fix(2 * best.sg, 0)} Ma** (2σ) (${v.fix(100 * (best.mu / T.value - 1), 1)}% off).` : '**No plateau** (fewer than 3 consistent steps or under 50% of the gas): the spectrum says the system was disturbed.'}`;
        });
      },
    },
    // ───────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Concept',
      name: 'Closure temperature and thermochronology',
      statement: String.raw`A mineral keeps a radiogenic daughter only below a temperature at which diffusion becomes negligible. For a mineral cooling at the rate $\dot T=-dT/dt$, the apparent age records the time at which the temperature passed the **closure temperature** (Dodson, 1973)
$$T_c=\frac{E/R}{\ln\!\bigl(A\,\tau D_0/a^2\bigr)},\qquad \tau=\frac{RT_c^2}{E\,\dot T},$$
where $E$ is the activation energy and $D_0/a^2$ the pre-exponential diffusivity over the squared diffusion length of the mineral, $A=55$ for a sphere. Different mineral–isotope systems have different $T_c$, from $\gtrsim900^\circ$C (zircon U–Pb) to $\sim70^\circ$C (apatite (U–Th)/He), so their ages differ and trace a cooling path. $T_c$ itself depends weakly on $\dot T$ (a decade slower cooling lowers it by tens of degrees).`,
      idea: String.raw`Daughter atoms diffuse out above $T_c$ and are trapped below it; because diffusivity depends on temperature as an Arrhenius law (mat-2.7) the transition is sharp. At closure the temperature is falling so that diffusion's characteristic time $\tau=RT^2/(E\dot T)$ equals the time left to cool by a fraction $RT/E$ of the temperature; setting the diffusive loss equal to the production gives the transcendental equation for $T_c$, solved by iteration. Each system thus dates one point on the path $T(t)$; a slope in the (age, $T_c$) plot is a cooling rate.`,
      caption: String.raw`Left: temperature–time path of a rock (choose steady, fast-then-slow, or slow-then-fast cooling; slide the mean rate) with each system's age marked where the path crosses its closure temperature. Right: $T_c$ against cooling rate for every system, with the current mean rate marked. Compare the true rate with the one a geologist would infer from the ages of two systems.`,
      deps: ['geol-2.2', 'mat-2.7'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['closure temperature', 'thermochronology'],
      scope: String.raw`Dodson's formula assumes monotonic cooling, volume diffusion in a uniform grain of one size, and an initially hot, open system; reheating, fast diffusion along defects and radiation damage change the answers.`,
      viz(v) {
        const hist = v.select('history', [{ value: 'steady', label: 'steady' }, { value: 'fs', label: 'fast then slow' }, { value: 'sf', label: 'slow then fast' }], 'steady');
        const rate = v.slider('mean cooling rate (°C/Myr)', 2, 200, 20, { log: true, sig: 2 });
        const sA = v.stage({ x: [0, 60], y: [0, 1050], axes: 'box', gutter: true, xlabel: 'time before present (Ma)', ylabel: 'temperature (°C)', height: 360, weight: 1.3 });
        const sB = v.stage({ x: [0.3, 1000], y: [0, 1000], xlog: true, axes: 'box', gutter: true, xlabel: 'cooling rate (°C/Myr)', ylabel: 'closure temperature (°C)', height: 360, weight: 1 });
        let st = {};
        v.render(() => {
          const t0 = 980 / rate.value, T0 = 1000, Ts = 20;
          const knots = hist.value === 'steady' ? [[t0, T0], [0, Ts]] : hist.value === 'fs' ? [[t0, T0], [0.8 * t0, 500], [0, Ts]] : [[t0, T0], [0.2 * t0, 500], [0, Ts]];
          const seg = (t) => { for (let i = 0; i < knots.length - 1; i++) { const [ta, Ta] = knots[i], [tb, Tb] = knots[i + 1]; if (t <= ta && t >= tb) return { T: Tb + ((Ta - Tb) * (t - tb)) / (ta - tb), r: (Ta - Tb) / (ta - tb) }; } return { T: Ts, r: 1 }; };
          sA.setView([0, t0 * 1.05], [0, 1050]);
          sA.path(knots.map(([t, T]) => [t, T]), { color: 'ink', width: 3 });
          const res = CLOS.map((q) => {
            let age = 0, N = 3000;
            for (let i = 0; i <= N; i++) {
              const t = t0 - (t0 * i) / N, s = seg(t), Tc = dodson(q, s.r);
              if (s.T <= Tc) { age = t; break; }
            }
            return { q, age, Tc: dodson(q, seg(age).r) };
          });
          sA.hline(Ts, { color: 'faint', dash: true });
          res.forEach(({ q, age, Tc }) => { sA.dot(age, Tc, { color: q.c, r: 7 }); sA.hline(Tc, { color: q.c, alpha: 0.25, width: 1 }); });
          CLOS.forEach((q) => sB.fn((x) => dodson(q, x), { color: q.c, width: 2, n: 60 }));
          sB.vline(rate.value, { color: 'ink', dash: true });
          st = { res, rate: rate.value, t0 };
        });
        v.legend(CLOS.map((q) => [q.c, q.nm]));
        v.readout(() => {
          const { res, rate: r0 } = st;
          const h = res.find((x) => x.q.nm.startsWith('hornblende')), b = res.find((x) => x.q.nm.startsWith('biotite'));
          const inf = (h.Tc - b.Tc) / (h.age - b.age);
          return String.raw`Ages (Ma): ${res.map((x) => `${x.q.nm} **${v.fix(x.age, 1)}** (closes at ${v.fix(x.Tc, 0)} °C)`).join('; ')}.
Rate inferred from hornblende and biotite: ${v.fix(inf, 0)} °C/Myr; the mean rate of the whole path is ${v.fix(r0, 0)} °C/Myr${hist.value !== 'steady' ? ' (the rate over that interval differs because cooling was not steady)' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Event',
      name: 'Patterson’s age of the Earth from lead isotopes',
      statement: String.raw`Bodies that formed together from one reservoir of primordial lead ($^{206}\mathrm{Pb}/^{204}\mathrm{Pb}=a_0$, $^{207}\mathrm{Pb}/^{204}\mathrm{Pb}=b_0$), but with different U/Pb, and stayed closed for $T$ years, have leads of present composition
$$\frac{^{207}\mathrm{Pb}}{^{204}\mathrm{Pb}}-b_0=\frac1{137.88}\,\frac{e^{\lambda_{235}T}-1}{e^{\lambda_{238}T}-1}\Bigl(\frac{^{206}\mathrm{Pb}}{^{204}\mathrm{Pb}}-a_0\Bigr),$$
a straight line, the *geochron*, through the primordial point. Patterson (1956) showed that lead from stony and iron meteorites, with $^{206}$Pb/$^{204}$Pb from 9.5 to 50, lies on one such line of age $4.55\pm0.07$ Gyr, and that lead from modern ocean sediment, an average of the Earth's crust, lies on it too: the Earth and the meteorites have the same age.`,
      idea: String.raw`The age equations for the two U isotopes (geol-2.2) are applied to the same $^{204}$Pb-normalised lead, and the unknown U/Pb of each body cancels in the ratio of the two radiogenic gains, leaving a function of $T$ alone, the slope. This is the isochron idea (geol-2.3) in a Pb–Pb diagram, where the slope depends only on the age and does not need the U/Pb of any sample, only that they stayed closed. The Earth's U/Pb cannot be measured for the whole planet, but its lead on the geochron means it formed at the same time as the meteorites that supply the line.`,
      caption: String.raw`Dots are model bodies formed at age $T$ with different $\mu={}^{238}$U/$^{204}$Pb, from a meteorite poor in U to one rich in it; the large gold dot is average Earth lead. Slide $T$ to rotate the line about the primordial point, fit the line, and read the age back from the slope. Make one body differentiate later (two-stage) and it falls off the line.`,
      deps: ['geol-2.3'],
      refs: ['Turcotte–Schubert ch. 10'],
      tags: ['Pb–Pb', 'age of the Earth', 'geochron'],
      credit: 'Claire Patterson, 1956',
      scope: String.raw`Needs bodies that began with the same lead isotopes, differentiated once and early, and stayed closed to U and Pb since; the formal age is the time since those U/Pb ratios were set.`,
      viz(v) {
        const T = v.slider('age $T$ (Ga)', 2.0, 4.6, 4.55, { step: 0.01 });
        const two = v.toggle('one body re-differentiated later (two-stage)', false);
        const td = v.slider('re-differentiation (Ga ago)', 0.3, 3.5, 1.5, { step: 0.05 });
        const sg = v.slider('measurement error (%)', 0, 3, 0.5, { step: 0.1 });
        const l8 = LAM.U238 * 1e9, l5 = LAM.U235 * 1e9;
        const BODY = [['iron meteorite', 0.3], ['stony 1', 4], ['Earth', 9.5], ['stone meteorite', 18], ['U-rich stone', 39.7]];
        const rr = v.rng(4), nz = BODY.map(() => [rr.normal(), rr.normal()]);
        const s = v.stage({ x: [1, 60], y: [6, 40], axes: 'box', gutter: true, xlabel: '$^{206}$Pb/$^{204}$Pb', ylabel: '$^{207}$Pb/$^{204}$Pb', height: 380 });
        // mu = present-day 238U/204Pb of the body; single-stage evolution from primordial lead
        const pbOf = (mu, Tt) => [A0 + mu * Math.expm1(l8 * Tt), B0 + (mu / U_RATIO) * Math.expm1(l5 * Tt)];
        // two-stage: U/Pb falls to 30% of its value at the event (d Ga ago)
        const pbTwo = (mu, Tt, d) => {
          const mu1 = mu * Math.exp(l8 * Tt), k0 = Math.exp((l5 - l8) * Tt) / U_RATIO, f = 0.3;
          const a1 = mu1 * (1 - Math.exp(-l8 * (Tt - d))), b1 = mu1 * k0 * (1 - Math.exp(-l5 * (Tt - d)));
          const Ue8 = mu1 * Math.exp(-l8 * (Tt - d)), Ue5 = mu1 * k0 * Math.exp(-l5 * (Tt - d));
          return [A0 + a1 + f * Ue8 * (1 - Math.exp(-l8 * d)), B0 + b1 + f * Ue5 * (1 - Math.exp(-l5 * d))];
        };
        let st = {};
        v.render(() => {
          const Tt = T.value, pts = [];
          BODY.forEach(([nm, mu], i) => {
            const p = two.value && i === 3 ? pbTwo(mu, Tt, Math.min(td.value, Tt * 0.95)) : pbOf(mu, Tt);
            pts.push({ nm, x: p[0] * (1 + sg.value / 100 * nz[i][0] * 0.5), y: p[1] * (1 + sg.value / 100 * nz[i][1] * 0.5), off: two.value && i === 3 });
          });
          const sl = pbSlope(Tt * 1e9, LAM.U235, LAM.U238, U_RATIO);
          s.line(A0, B0, 60, B0 + sl * (60 - A0), { color: 'faint', width: 1 });
          const fitpts = pts.filter((p) => !p.off);
          const f = v.M.linreg(fitpts.map((p) => p.x), fitpts.map((p) => p.y));
          s.line(5, f.intercept + f.slope * 5, 60, f.intercept + f.slope * 60, { color: 'green', width: 2.5 });
          s.dot(A0, B0, { color: 'ink', r: 6, hollow: true, label: 'primordial Pb', labelPos: 'sw' });
          pts.forEach((p) => s.dot(p.x, p.y, { color: p.nm === 'Earth' ? 'gold' : (p.off ? 'red' : 'accent'), r: p.nm === 'Earth' ? 8 : 5, label: p.nm, labelPos: p.nm === 'Earth' ? 'se' : (p.nm === 'iron meteorite' ? 'se' : 'nw') }));
          const age = pbAge(f.slope, LAM.U235, LAM.U238, U_RATIO) / 1e9;
          st = { f, age, sl };
        });
        v.legend([['green', 'fitted geochron'], ['faint', 'true geochron for $T$']]);
        v.readout(() => {
          const { f, age, sl } = st;
          return String.raw`Slope of the true geochron $=${v.fix(sl, 4)}$; fitted slope $=${v.fix(f.slope, 4)}$ ⇒ age **${v.fix(age, 3)} Ga** (true ${v.fix(T.value, 2)} Ga), $r^2=${v.fix(f.r2, 5)}$.
${two.value ? 'The red (re-differentiated) body is left out of the fit; including it would pull the slope and the age.' : 'Every body, whatever its U/Pb, lies on the same line, so the line gives the age without knowing any U/Pb.'}`;
        });
      },
    },
    // ───────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Cosmogenic-nuclide exposure dating',
      statement: String.raw`Cosmic-ray neutrons and muons make rare nuclides such as $^{10}$Be (half-life 1.387 Myr) in minerals exposed near the surface, at a production rate $P$ that falls off with depth $z$ as $e^{-\rho z/\Lambda}$ ($\Lambda\approx160$ g cm$^{-2}$). For a surface exposed for a time $t$ and eroding steadily at a rate $\varepsilon$ (cm yr$^{-1}$), the concentration is
$$N(t)=\frac{P}{\lambda+\rho\varepsilon/\Lambda}\Bigl[1-e^{-(\lambda+\rho\varepsilon/\Lambda)t}\Bigr].$$
With no erosion $t=-\ln(1-N\lambda/P)/\lambda$; the concentration saturates at $P/(\lambda+\rho\varepsilon/\Lambda)$, so a measured $N$ gives an *exposure age* only below saturation, and, for old surfaces, the erosion rate.`,
      idea: String.raw`Production adds atoms at a constant rate $P$; decay and erosion (which removes atoms from the surface) remove them in proportion to $N$: $dN/dt=P-(\lambda+\rho\varepsilon/\Lambda)N$. This is the decay-chain balance (geol-2.4) with the source constant, so $N$ rises exponentially to the balance point $P/b$. A measured $N$ lies on this curve at one $t$ for each assumed $\varepsilon$: the age is a *minimum* (zero erosion) or is traded against erosion, and above $P/\lambda$ no age exists. Apply the integrating-factor formula (ode 1.4) to $N'+bN=P$ with $b=\lambda+\rho\varepsilon/\Lambda$ and $N(0)=0$. The integral gives $N=P(1-e^{-bt})/b$; its approach to saturation is a consequence of this source–loss balance.`,
      caption: String.raw`Left: concentration against exposure time for no erosion (dashed) and the chosen erosion rate; drag the horizontal handle to set the measured concentration. Right: the exposure age consistent with that concentration at each erosion rate; it diverges at the maximum erosion rate that can reach it (steady state).`,
      deps: ['geol-2.1', 'ode-1.4'],
      refs: ['Press–Siever'],
      tags: ['cosmogenic nuclides', '10Be', 'erosion'],
      scope: String.raw`Valid for a surface of uniform composition with constant production and steady erosion; inherited nuclides from earlier exposure, burial and shielding by snow or soil bias the age.`,
      viz(v) {
        const P = v.slider('production rate $P$ (atoms/g/yr)', 1, 40, 4, { log: true, sig: 2 });
        const eps = v.slider('erosion rate $\\varepsilon$ (mm/kyr)', 0, 30, 0.5, { step: 0.05, decimals: 2 });
        const lam = LAM.Be10, Lam = 160, rho = 2.65, U = 1e5;
        const bOf = (e) => lam + (e * 1e-4 * rho) / Lam; // e in mm/kyr = 1e-4 cm/yr
        const sA = v.stage({ x: [0, 6], y: [0, 100], axes: 'box', gutter: true, xlabel: 'exposure time (Myr)', ylabel: '$^{10}$Be (10⁵ atoms/g)', height: 340 });
        const sB = v.stage({ x: [0, 3], y: [0, 6], axes: 'box', gutter: true, xlabel: 'assumed erosion rate (mm/kyr)', ylabel: 'exposure age (Myr)', height: 340 });
        const h = sA.handle(3.4, 15, { color: 'gold', r: 7, constrain: 'y', label: 'measured' });
        let st = {};
        v.render(() => {
          const p = P.value, e = eps.value, b = bOf(e);
          const Nf = (t, bb) => ((p / bb) * (1 - Math.exp(-bb * t * 1e6))) / U;
          const sat0 = p / lam / U;
          sA.setView([0, 6], [0, sat0 * 1.1]);
          h.set(3.4, clamp(h.y, 0.02 * sat0, 1.05 * sat0));
          const N = h.y * U;
          sA.hline(sat0, { color: 'faint', dash: true }); sA.hline(p / b / U, { color: 'blue', dash: true, alpha: 0.6 });
          sA.fn((t) => Nf(t, lam), { color: 'ink', width: 2, dash: true });
          sA.fn((t) => Nf(t, b), { color: 'blue', width: 3 });
          sA.hline(h.y, { color: 'gold', width: 1.5 });
          const ageAt = (bb) => (N < p / bb ? -Math.log(1 - (N * bb) / p) / bb / 1e6 : Infinity);
          const t0 = ageAt(lam), t1 = ageAt(b);
          if (isFinite(t1)) sA.dot(t1, h.y, { color: 'blue', r: 6 });
          if (isFinite(t0)) sA.dot(t0, h.y, { color: 'ink', r: 5, hollow: true });
          sB.fn((x) => { const a = ageAt(bOf(x)); return isFinite(a) ? a : NaN; }, { color: 'blue', width: 3, n: 400 });
          const emax = ((p / N - lam) * Lam) / (rho * 1e-4);
          if (emax > 0) sB.vline(emax, { color: 'red', dash: true });
          sB.vline(e, { color: 'faint' });
          if (isFinite(t1)) sB.dot(e, t1, { color: 'blue', r: 6 });
          sB.setView([0, Math.max(2, Math.min(30, 1.8 * Math.max(emax, e)))], [0, Math.max(1, Math.min(8, (isFinite(t0) ? t0 : 6) * 2.2))]);
          st = { t0, t1, emax, sat0, satE: p / b / U, p, e };
        });
        v.legend([['ink', 'no erosion', { dash: true }], ['blue', 'with erosion'], ['red', 'maximum erosion rate', { dash: true }]]);
        v.readout(() => {
          const { t0, t1, emax, sat0, satE } = st;
          return String.raw`Saturation $P/\lambda=${v.fix(sat0, 0)}\times10^5$ atoms/g (no erosion), $${v.fix(satE, 0)}\times10^5$ with $\varepsilon=${v.fix(eps.value, 1)}$ mm/kyr.
Minimum exposure age (no erosion): **${isFinite(t0) ? v.fix(t0, 3) + ' Myr' : 'none: above saturation'}**. With the chosen erosion: **${isFinite(t1) ? v.fix(t1, 3) + ' Myr' : 'none: this concentration cannot be reached'}**. ${emax > 0 ? `The surface cannot erode faster than ${v.fix(emax, 1)} mm/kyr and still hold this much ¹⁰Be.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Method',
      name: 'Numerical calibration of the geologic time scale',
      statement: String.raw`Stratigraphy (geol-1.9) orders events but does not date them. Volcanic ash beds, whose zircons give U–Pb ages (geol-2.5) and whose feldspars give ${'$'}^{40}$Ar/${'$'}^{39}$Ar ages (geol-2.7), interleaved with fossil-bearing strata, pin the relative scale to absolute numbers: by superposition, the age of a horizon lies between the ages of the dated beds below and above it, and the boundaries of the periods acquire ages with uncertainties of a few tenths of a per cent. Ages that violate superposition (a higher bed older than a lower one) flag inherited or reworked crystals. The Phanerozoic is now calibrated to $\sim0.1$–$1$ Myr, the Precambrian by dated rocks alone.`,
      idea: String.raw`The relative scale gives an order and the radiometric ages (the age equation, geol-2.2) give points on a number line; each dated bed turns an interval of strata into an interval of time. Linear interpolation between beds assumes a constant rate of deposition, and only the bracketing ages are firm: the real uncertainty of a horizon is at least the bracket. Agreement of several methods on one bed (U–Pb and Ar–Ar) and the check of superposition across many beds is what makes the scale numerical rather than guessed.`,
      caption: String.raw`Left: an invented stratigraphic section with four dated ash beds (labelled with age $\pm$ analytical error). Drag the fossil horizon to read its bracketed and interpolated age; tick the box to give bed C a contaminated, too-old age and see superposition break. Right: the geological time scale on a zoomable axis; choose a scale and drag the probe. On the Earth scale, all of human history is smaller than a pixel.`,
      deps: ['geol-1.9', 'geol-2.5', 'geol-2.7'],
      refs: ['Press–Siever'],
      tags: ['time scale', 'geochronology'],
      scope: String.raw`Boundary ages are conventional values with their uncertainties and are revised as dating improves; interpolation between beds assumes a steady deposition rate.`,
      viz(v) {
        const UNIT = {
          earth: { rng: [4567, 0], units: [['Hadean', 4567, 4031], ['Archean', 4031, 2500], ['Proterozoic', 2500, 538.8], ['Phanerozoic', 538.8, 0]] },
          phan: { rng: [538.8, 0], units: [['Cambrian', 538.8, 485.4], ['Ordovician', 485.4, 443.8], ['Silurian', 443.8, 419.2], ['Devonian', 419.2, 358.9], ['Carboniferous', 358.9, 298.9], ['Permian', 298.9, 251.9], ['Triassic', 251.9, 201.4], ['Jurassic', 201.4, 143.1], ['Cretaceous', 143.1, 66], ['Paleogene', 66, 23.04], ['Neogene', 23.04, 2.58], ['Quat.', 2.58, 0]] },
          ceno: { rng: [66, 0], units: [['Paleocene', 66, 56], ['Eocene', 56, 33.9], ['Oligocene', 33.9, 23.04], ['Miocene', 23.04, 5.333], ['Pliocene', 5.333, 2.58], ['Pleistocene', 2.58, 0.0117], ['Holocene', 0.0117, 0]] },
          quat: { rng: [2.58, 0], units: [['Gelasian', 2.58, 1.8], ['Calabrian', 1.8, 0.774], ['Chibanian', 0.774, 0.129], ['Late Pleist.', 0.129, 0.0117], ['Holocene', 0.0117, 0]] },
          human: { rng: [0.3, 0], units: [['Homo sapiens exists', 0.3, 0.0117], ['Holocene', 0.0117, 0.005], ['writing', 0.005, 0]] },
        };
        const ANCH = [['Canyon Diablo / CAIs', 4567, 1], ['Jack Hills zircon', 4404, 8], ['Acasta gneiss', 4030, 30], ['Cambrian base (ash bed)', 538.8, 0.2], ['P–Tr boundary ash', 251.9, 0.024], ['Tr–J boundary', 201.4, 0.2], ['K–Pg boundary', 66.04, 0.04], ['Toba ash', 0.074, 0.004]];
        const view = v.select('scale', [{ value: 'earth', label: 'Earth' }, { value: 'phan', label: 'Phanerozoic' }, { value: 'ceno', label: 'Cenozoic' }, { value: 'quat', label: 'Quaternary' }, { value: 'human', label: 'humans' }], 'earth');
        const sgm = v.slider('analytical error of beds (Myr)', 0.02, 0.5, 0.1, { log: true, sig: 2 });
        const bad = v.toggle('bed C contaminated by older zircons', false);
        // Section: heights in metres; beds (name, height, age Ma): invented, near the P–Tr boundary
        const BEDS = [['A', 3, 252.30], ['B', 14, 252.00], ['C', 31, 251.90], ['D', 52, 251.55]];
        const sec = v.stage({ x: [0, 1], y: [0, 60], axes: false, gutter: false, height: 380, weight: 0.9, minWidth: 240 });
        const tl = v.stage({ x: [-4567, 0], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age (Ma)', height: 380, weight: 1.4 });
        const hf = sec.handle(0.5, 40, { color: 'gold', r: 8, constrain: 'y', label: 'fossil horizon' });
        const pr = tl.handle(-1000, 0.12, { color: 'gold', r: 7, constrain: 'x' });
        const COL = ['blue', 'teal', 'green', 'gold', 'orange', 'red', 'purple', 'pink'];
        let st = {}, lastView = '';
        v.render(() => {
          // --- section
          const ages = BEDS.map(([, , a], i) => (bad.value && i === 2 ? a + 0.7 : a));
          sec.rect(0.12, 0, 0.88, 60, { fill: 'faint', fillAlpha: 0.12, color: 'faint', width: 1 });
          for (let y = 0; y < 60; y += 6) sec.line(0.12, y, 0.88, y, { color: 'faint', width: 0.5, alpha: 0.5 });
          BEDS.forEach(([nm, h], i) => {
            sec.rect(0.12, h - 0.7, 0.88, h + 0.7, { fill: 'red', fillAlpha: 0.5, stroke: false });
            sec.text(`bed ${nm}: ${ages[i].toFixed(2)} ± ${sgm.value.toFixed(2)} Ma`, 0.15, h + 0.7, { size: 11, color: bad.value && i === 2 ? 'red' : 'ink', dy: -8, align: 'left' });
          });
          hf.set(0.5, clamp(hf.y, 4, 58));
          const y = hf.y;
          let lo = 0, hi = 1;
          for (let i = 0; i < BEDS.length - 1; i++) if (y >= BEDS[i][1]) { lo = i; hi = i + 1; }
          const [, hl] = BEDS[lo], [, hh] = BEDS[hi];
          const al = ages[lo], ah = ages[hi], u = (y - hl) / (hh - hl);
          const interp = al + (ah - al) * u;
          const reversed = ages.some((a, i) => i > 0 && a > ages[i - 1]);
          sec.hline(y, { color: 'gold', width: 1.5 });
          // --- timeline
          const U_ = UNIT[view.value];
          if (view.value !== lastView) { lastView = view.value; tl.setView([-U_.rng[0] * 1.002, U_.rng[1] * 1.0 - U_.rng[0] * 0.002], [0, 1]); pr.set(-U_.rng[0] * 0.5, 0.12); }
          const [a0, a1] = U_.rng;
          const ticksAt = (() => { const n = 6, out = []; for (let i = 0; i <= n; i++) { const a = a0 - ((a0 - a1) * i) / n; out.push([-a, a >= 100 ? String(Math.round(a)) : String(Number(a.toPrecision(3)))]); } return out; })();
          tl.setTicks(ticksAt, []);
          U_.units.forEach(([nm, b, t], i) => {
            tl.rect(-b, 0.3, -t, 0.62, { fill: COL[i % COL.length], fillAlpha: 0.35, color: COL[i % COL.length], width: 1 });
            const w = Math.abs(tl.X(-t) - tl.X(-b));
            if (w > 8 * nm.length * 0.6 + 6) tl.text(nm, -(b + t) / 2, 0.46, { align: 'center', size: 11 });
            else if (w > 24) tl.text(nm.slice(0, Math.max(2, Math.floor(w / 8))), -(b + t) / 2, 0.46, { align: 'center', size: 10 });
          });
          ANCH.filter(([, a]) => a <= a0 * 1.001 && a >= a1).forEach(([nm, a, e], i) => {
            const yy = 0.72 + 0.045 * (i % 6);
            tl.dot(-a, yy, { color: 'red', r: 4 });
            tl.text(nm, -a, yy, { size: 10, dy: 0, dx: a > (a0 + a1) / 2 ? 7 : -7, align: a > (a0 + a1) / 2 ? 'left' : 'right', color: 'muted' });
          });
          const pa = clamp(-pr.x, Math.min(a0, a1), Math.max(a0, a1));
          pr.set(-pa, 0.12);
          tl.vline(-pa, { color: 'gold', width: 1.5 });
          const un = U_.units.find(([, b, t]) => pa <= b && pa >= t);
          st = { interp, al, ah, hl, hh, y, reversed, pa, un, a0, a1, wpx: Math.abs(tl.X(0) - tl.X(-0.0117)) };
        });
        v.readout(() => {
          const { interp, al, ah, reversed, pa, un, a0 } = st, e = sgm.value;
          const humanPx = Math.abs(tl.X(0) - tl.X(-0.0117));
          return String.raw`Horizon: **${v.fix(interp, 2)} Ma** (between ${v.fix(ah, 2)} and ${v.fix(al, 2)} Ma by the beds around it, assuming steady deposition; analytical error $\pm${v.fix(e, 2)}$ Myr).${reversed ? '\n**Superposition violated:** a higher bed is older than the one below, so bed C cannot be trusted.' : ''}
Probe: ${fmtMa(pa * 1e6, pa < 10 ? 3 : 1)}${un ? ` ⇒ ${un[0]}` : ''}. On this scale the Holocene (11.7 kyr) is ${humanPx < 1 ? 'less than one' : v.fix(humanPx, 0)} pixel${humanPx < 1 || Math.round(humanPx) === 1 ? '' : 's'} wide; it is $${v.sci(0.0117 / 4567, 2)}$ of the age of the Earth.`;
        });
      },
    },
    // ───────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Paper',
      name: 'Age of meteorites and the earth',
      paper: {
        authors: 'Claire Patterson',
        year: 1956,
        title: 'Age of meteorites and the earth',
        venue: 'Geochimica et Cosmochimica Acta 10 (4): 230–237',
        doi: '10.1016/0016-7037(56)90036-9',
      },
      introduces: ['geol-2.9'],
      statement: String.raw`Patterson measured the isotopic composition of lead in three stone meteorites and two iron meteorites (the iron meteorites' troilite has almost no uranium and holds primordial lead) and showed that, plotted as $^{207}$Pb/$^{204}$Pb against $^{206}$Pb/$^{204}$Pb, they fall on one straight line whose slope corresponds to an age of $4.55\pm0.07$ Gyr, the same age from the three methods he compared (Pb–Pb, Rb–Sr and K–Ar). Lead from modern ocean sediment ($^{206}/^{204}=19.0$, $^{207}/^{204}=15.5$), a proxy for Earth's average lead, lies on the same line, so he concluded that the Earth is the same age: the time since it attained its present mass.`,
      idea: String.raw`Before 1953 ages of the Earth rested on assumptions about common leads in ores and could differ by a billion years. Patterson, at Caltech, measured lead in meteorites with a mass spectrometer in very small samples, and used the isochron relation (geol-2.3 for Rb–Sr; here for lead) to age bodies whose initial lead is unknown. The decay chains (geol-2.4) are not an issue: the Pb–Pb slope uses only the two uranium isotopes' constants. The paper introduced the meteoritic geochron (geol-2.9) and the age $4.55\times10^9$ yr, still within 1% of the modern value.`,
      caption: String.raw`Paper's data (his Table 1; error bars are his stated 2% for the three stones and 1% for the two irons; the open circle is his ocean-sediment lead). Drag the trial age: the line is drawn from the Canyon Diablo point with the slope for that age, and the readout gives how well it fits. The decay-constants switch swaps his decay constants for modern ones. The values come from the paper's Table 1 and text.`,
      deps: ['geol-2.2', 'geol-2.3', 'geol-2.4'],
      refs: [],
      tags: ['Pb–Pb', 'age of the Earth', 'meteorites', 'history'],
      credit: 'Claire Patterson, 1956',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Claire_Patterson' },
      viz(v) {
        const D = [
          { nm: 'Nuevo Laredo (stone)', x: 50.28, y: 34.86, e: 0.02, lp: 'nw' },
          { nm: 'Forest City (stone)', x: 19.27, y: 15.95, e: 0.02, lp: 'nw' },
          { nm: 'Modoc (stone)', x: 19.48, y: 15.76, e: 0.02, lp: 'se' },
          { nm: 'Henbury (iron)', x: 9.55, y: 10.38, e: 0.01, lp: 'ne' },
          { nm: 'Canyon Diablo (iron)', x: 9.46, y: 10.34, e: 0.01, lp: 'se' },
        ];
        const SED = { x: 19.0, y: 15.5 };
        const cst = v.select('decay constants', [{ value: 'pat', label: 'Patterson 1956' }, { value: 'mod', label: 'modern' }], 'pat');
        const tr = v.slider('trial age (Ga)', 3.0, 6.0, 4.55, { step: 0.01 });
        const S = v.stage({ x: [5, 55], y: [8, 38], axes: 'box', gutter: true, xlabel: '$^{206}$Pb/$^{204}$Pb', ylabel: '$^{207}$Pb/$^{204}$Pb', height: 400 });
        let st = {};
        v.render(() => {
          const pat = cst.value === 'pat';
          const l5 = pat ? 9.72e-10 : LAM.U235, l8 = pat ? 1.537e-10 : LAM.U238, k = pat ? 137.8 : U_RATIO;
          const T = tr.value * 1e9, sl = pbSlope(T, l5, l8, k);
          const f = v.M.linreg(D.map((p) => p.x), D.map((p) => p.y));
          const Tfit = pbAge(f.slope, l5, l8, k) / 1e9;
          const dT = (pbAge(f.slope + f.seSlope, l5, l8, k) - pbAge(f.slope - f.seSlope, l5, l8, k)) / 2e9;
          S.line(5, f.intercept + f.slope * 5, 55, f.intercept + f.slope * 55, { color: 'green', width: 1.5, alpha: 0.7 });
          const x0 = D[4].x, y0 = D[4].y;
          S.line(x0, y0, 55, y0 + sl * (55 - x0), { color: 'orange', width: 2.5 });
          let chi = 0;
          D.forEach((p) => {
            const yl = y0 + sl * (p.x - x0), sd = p.e * p.y;
            chi += ((p.y - yl) / sd) ** 2;
            S.segment([p.x, p.y * (1 - p.e)], [p.x, p.y * (1 + p.e)], { color: 'muted', width: 1.5 });
            S.dot(p.x, p.y, { color: 'accent', r: 5, label: p.nm, labelPos: p.lp });
          });
          const ysed = y0 + sl * (SED.x - x0);
          S.dot(SED.x, SED.y, { color: 'gold', r: 8, hollow: true, label: 'ocean sediment', labelPos: 'sw' });
          st = { Tfit, dT, f, sl, chi, SED, ysed, pat };
        });
        v.legend([['orange', 'line for the trial age, from Canyon Diablo'], ['green', 'least-squares line through the five meteorites']]);
        v.readout(() => {
          const { Tfit, dT, f, chi, ysed, pat } = st;
          return String.raw`Least-squares age of the five meteorites: **${v.fix(Tfit, 3)} ± ${v.fix(dT, 3)} Ga** with ${pat ? 'Patterson’s' : 'modern'} constants (paper: **4.55 ± 0.07 Ga**; the accepted age of the oldest solids in meteorites is about 4.567 Ga). Fit residual $r^2=${v.fix(f.r2, 5)}$.
Trial line: $\chi^2=${v.fix(chi, 1)}$ for 3 degrees of freedom, and it misses the ocean-sediment point by ${v.fix(15.5 - ysed, 2)} in $^{207}$Pb/$^{204}$Pb.`;
        });
      },
    },
  ],
};
