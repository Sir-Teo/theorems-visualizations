// Climate Science — Chapter 2 (part d): landmark papers — Fourier (1824), Tyndall (1861), Manabe & Wetherald (1967), Molina & Rowland (1974)
import { SIG, GRID, CP, G0, standardT, humidity, heights, ozoneProfile, ozoneHeating, rceJob, rceAdvance, rceFinishJob, ASR_RCE } from './ch02.shared.js';

const fx = (v, x, d = 1) => v.fix(x, d);
const TAU = 2 * Math.PI;
const still = () => typeof window !== 'undefined' && !!window.__vizStill;
const O3 = ozoneProfile(300), SW = ozoneHeating(O3);

// ── a de Saussure hot box: plate + n panes, solved by Newton's method (all temperatures in K) ──────────────────────
function solveBox(n, I, eps, hc, U, o = {}) {
  const Ta = o.Ta ?? 293, hout = o.hout ?? 10, tg = o.tg ?? 0.9, ap = o.ap ?? 0.95, N = n + 1, S = I * ap * tg ** n;
  const F = (T) => {
    const r = [], sky = Ta;
    const upT = n === 0 ? sky : T[1];
    r.push(S - (SIG * T[0] ** 4 - (n === 0 ? 1 : eps) * SIG * upT ** 4) - (n === 0 ? hout : hc) * (T[0] - upT) - U * (T[0] - Ta));
    for (let k = 1; k <= n; k++) {
      const lo = T[k - 1], hi = k === n ? sky : T[k + 1];
      r.push(eps * SIG * lo ** 4 + eps * SIG * hi ** 4 - 2 * eps * SIG * T[k] ** 4 + hc * (lo - T[k]) + (k === n ? hout : hc) * ((k === n ? Ta : hi) - T[k]));
    }
    return r;
  };
  const T = Array(N).fill(Ta + 30);
  for (let it = 0; it < 90; it++) {
    const f = F(T), A = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let j = 0; j < N; j++) { const T2 = T.slice(); T2[j] += 0.01; const f2 = F(T2); for (let i = 0; i < N; i++) A[i][j] = (f2[i] - f[i]) / 0.01; }
    const b = f.map((x) => -x);
    for (let c = 0; c < N; c++) {
      let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = c + 1; r < N; r++) { const m = A[r][c] / A[c][c]; for (let k = c; k < N; k++) A[r][k] -= m * A[c][k]; b[r] -= m * b[c]; }
    }
    const d = new Array(N).fill(0);
    for (let i = N - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < N; k++) s -= A[i][k] * d[k]; d[i] = s / A[i][i]; }
    let mx = 0; for (let i = 0; i < N; i++) { T[i] = Math.max(150, T[i] + Math.max(-40, Math.min(40, d[i]))); mx = Math.max(mx, Math.abs(d[i])); }
    if (mx < 1e-6) break;
  }
  return T;
}

// ── Tyndall's table (recalled; see the item): relative absorption of the gases at one atmosphere, dry air = 1 ───────
const GASES = [
  { id: 'air', short: 'air', name: 'dry air', R: 1, col: 'muted' },
  { id: 'O2', short: 'O₂', name: 'oxygen', R: 1, col: 'muted' },
  { id: 'N2', short: 'N₂', name: 'nitrogen', R: 1, col: 'muted' },
  { id: 'H2', short: 'H₂', name: 'hydrogen', R: 1, col: 'muted' },
  { id: 'Cl', short: 'Cl₂', name: 'chlorine', R: 60, col: 'teal' },
  { id: 'CO', short: 'CO', name: 'carbonic oxide', R: 750, col: 'orange' },
  { id: 'CO2', short: 'CO₂', name: 'carbonic acid (CO₂)', R: 972, col: 'accent' },
  { id: 'HCl', short: 'HCl', name: 'hydrochloric acid', R: 1005, col: 'purple' },
  { id: 'N2O', short: 'N₂O', name: 'nitrous oxide', R: 1860, col: 'pink' },
  { id: 'H2S', short: 'H₂S', name: 'sulphuretted hydrogen', R: 2100, col: 'gold' },
  { id: 'C2H4', short: 'C₂H₄', name: 'olefiant gas (ethylene)', R: 6030, col: 'red' },
  { id: 'NH3', short: 'NH₃', name: 'ammonia', R: 7260, col: 'green' },
];

// ── CFC emission reconstruction (illustrative, kt/yr) for the Molina–Rowland item ─────────────────────────────────
const E11 = [[1945, 0], [1950, 10], [1960, 45], [1970, 170], [1974, 260], [1980, 300], [1988, 330], [1992, 200], [1996, 50], [2000, 25], [2010, 10], [2100, 5]];
const E12 = [[1945, 0], [1950, 15], [1960, 70], [1970, 240], [1974, 330], [1980, 380], [1988, 420], [1992, 330], [1996, 200], [2000, 130], [2010, 60], [2100, 20]];
const interp = (p, t) => { if (t <= p[0][0]) return p[0][1]; for (let i = 0; i < p.length - 1; i++) if (t <= p[i + 1][0]) return p[i][1] + ((p[i + 1][1] - p[i][1]) * (t - p[i][0])) / (p[i + 1][0] - p[i][0]); return p[p.length - 1][1]; };
function cfcRun(scn, tau11, tau12) {
  const out = []; let B1 = 0, B2 = 0; const dt = 0.25;
  const em = (pts, scale, t) => { if (t <= 1974 || scn === 'actual') return interp(pts, t) * scale; if (scn === 'frozen') return interp(pts, 1974) * scale; return interp(pts, 1974) * scale * 1.05 ** (t - 1974); };
  for (let t = 1945; t <= 2100.01; t += dt) {
    B1 += (em(E11, 1.12, t) - B1 / tau11) * dt; B2 += (em(E12, 1.2, t) - B2 / tau12) * dt;
    if (Math.abs(t - Math.round(t)) < 1e-9) out.push({ t: Math.round(t), c11: B1 / 24.7, c12: B2 / 21.8, e11: em(E11, 1.12, t), e12: em(E12, 1.2, t) });
  }
  return out;
}

export default {
  collection: 'climate',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Paper',
      name: 'Températures du globe terrestre et des espaces planétaires',
      paper: { authors: 'J. Fourier', year: 1824, title: 'Remarques générales sur les températures du globe terrestre et des espaces planétaires', venue: 'Annales de Chimie et de Physique 27: 136–167', url: 'https://books.google.com/books?id=1Jg5AAAAcAAJ&pg=PA136' },
      introduces: ['climate-2.1'],
      statement: String.raw`Fourier asked what fixes the temperature of the Earth and concluded that three things do: the Sun's heat, the heat of space (the cold of the "planetary spaces"), and the **effect of the atmosphere**, which he compared with a glass-covered box. Luminous heat passes through the glass; "dark heat" (infrared) emitted by the warmed ground cannot pass back as easily, so the interior ends up much warmer than the outside air. Fourier argued that the air plays the role of the glass: the temperature of the surface is raised by the atmosphere's partial opacity to the dark heat, and by its ability to hold the heat near the ground. He offered no equation for the effect and did not name a gas; the paper contains the first qualitative statement of what is now called the greenhouse effect.`,
      idea: String.raw`Before Fourier the surface temperature was explained either by the Sun alone or by a residual heat of the Earth's interior. Fourier showed by comparing the expected heating of a surface by sunlight and by the interior heat (a few hundredths of a degree at the surface, by his conduction theory) that sunlight dominates, but that sunlight alone, with no atmosphere, would leave the planet much colder than observed. He drew on Horace-Bénédict de Saussure's hot-box experiments (1767) to explain the missing warmth. In modern terms: a layer transparent to sunlight and absorbing in the infrared warms the surface (2.1, 1.6), the effect of $\varepsilon$ in the layer model; the interior heat is negligible (about 0.09 W/m²).`,
      caption: String.raw`Left: a de Saussure hot box — a dark plate under $n$ glass panes in the Sun; the glass lets sunlight in (gold) but absorbs the "dark heat" (purple), so the plate warms (labels in °C). Middle: the plate temperature against the number of panes, with and without air in the gaps and for several insulation qualities; the dashed line is the boiling point of water. Right: replace the panes by an atmosphere of infrared absorptivity $\varepsilon$ (2.1): the planet's surface warms in the same way.`,
      deps: ['thermo-7.3', 'climate-1.5'],
      refs: [],
      tags: ['history', 'greenhouse', 'Fourier'],
      credit: 'Joseph Fourier, 1824 (building on H.-B. de Saussure, 1767)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Joseph_Fourier' },
      viz(v) {
        const n = v.slider('glass panes $n$', 0, 5, 3, { int: true });
        const I = v.slider('sunlight on the box (W/m²)', 200, 1100, 1000, { step: 10 });
        const eps = v.slider('infrared absorptivity of the glass $\\varepsilon$', 0, 1, 1, { step: 0.01 });
        const U = v.slider('leakage through the box walls (W m⁻² K⁻¹)', 0, 10, 3, { step: 0.1 });
        const air = v.toggle('air between the panes (convection and conduction)', true);
        const sA = v.stage({ x: [0, 12], y: [0, 10], axes: false, height: 400, weight: 1.1, minWidth: 290, title: 'a hot box' });
        const sB = v.stage({ x: [-0.5, 5.5], y: [0, 260], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 270, xlabel: 'number of panes', ylabel: 'plate temperature (°C)', title: 'the plate temperature' });
        const sC = v.stage({ x: [0, 1], y: [240, 320], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 250, xlabel: 'infrared absorptivity of the atmosphere ε', ylabel: 'surface T (K)', title: 'the planet’s version (2.1)' });
        let R = null;
        v.render(() => {
          const N = n.value, e = eps.value, hc = air.value ? 3 : 0, S = I.value, u = U.value;
          const T = solveBox(N, S, e, hc, u), C = (k) => T[k] - 273.15;
          // schematic
          const pl = 1.5, gap = 6.2 / (N + 1);
          sA.rect(0.8, 0, 11.2, 0.9, { fill: 'muted', fillAlpha: 0.3, stroke: false });
          sA.rect(1.3, 0.9, 10.7, 1.5, { fill: 'ink', fillAlpha: 0.75, stroke: false });
          sA.text(`plate ${fx(v, C(0), 0)} °C`, 11.6, 1.2, { color: 'ink', size: 12.5, weight: 700, align: 'right' });
          for (let k = 1; k <= N; k++) {
            const y = 2.0 + k * gap * 0.95;
            sA.rect(0.8, y, 11.2, y + 0.22, { fill: 'blue', fillAlpha: 0.12 + 0.35 * e, color: 'blue', width: 1.2 });
            sA.text(`pane ${k}: ${fx(v, C(k), 0)} °C`, 11.6, y + 0.8, { color: 'blue', size: 11.5, align: 'right', weight: 600 });
          }
          const top = 2.0 + N * gap * 0.95 + 0.4;
          sA.rect(0.8, 0.9, 11.2, top, { fill: 'orange', fillAlpha: 0.04, color: 'faint', width: 1 });
          for (const x of [2.2, 3.4, 4.6]) sA.arrow(x, 9.7, x, 1.7, { color: 'gold', width: 2.6 * Math.max(0.35, 0.9 ** N), head: 8 });
          sA.text('sunlight', 1.0, 9.9, { color: 'gold', size: 12, weight: 600, align: 'left', baseline: 'top', dy: -2 });
          for (const x of [6.2, 7.4]) sA.arrow(x, 1.7, x, Math.min(9, 1.7 + (N ? gap * 0.9 : 4)), { color: 'purple', width: 2.6, head: 8, alpha: N ? 0.9 : 0.5 });
          sA.text(N ? '“dark heat” stopped by the glass' : 'dark heat escapes freely', 5.4, 9.9, { color: 'purple', size: 12, weight: 600, align: 'left', baseline: 'top', dy: -2 });
          // plate temperature against n
          sB.hline(100, { color: 'red', dash: [5, 4], width: 1.4 }); sB.text('boiling water', 5.45, 100, { color: 'red', size: 11.5, align: 'right', baseline: 'bottom', dy: -3 });
          const all = [0, 1, 2, 3, 4, 5].map((k) => solveBox(k, S, e, hc, u)[0] - 273.15);
          const alt = [0, 1, 2, 3, 4, 5].map((k) => solveBox(k, S, e, hc ? 0 : 3, u)[0] - 273.15);
          sB.path(alt.map((t, k) => [k, t]), { color: 'muted', width: 1.8, dash: [5, 4] });
          sB.path(all.map((t, k) => [k, t]), { color: 'accent', width: 2.6 });
          all.forEach((t, k) => sB.dot(k, t, { color: k === N ? 'gold' : 'accent', r: k === N ? 8 : 4.5, label: k === N ? `${fx(v, t, 0)} °C` : undefined, labelPos: 'nw' }));
          sB.text(`ambient ${20} °C`, -0.4, 20, { color: 'muted', size: 11, align: 'left', baseline: 'bottom', dy: -3 });
          // planet
          const Te = ((S === 1000 ? 240 : 240) / SIG) ** 0.25;
          sC.hline(Te, { color: 'muted', dash: [4, 4] }); sC.text('no atmosphere: $T_e$', 0.98, Te, { color: 'muted', size: 11.5, align: 'right', baseline: 'bottom', dy: -3 });
          sC.fn((x) => Te * (2 / (2 - x)) ** 0.25, { domain: [0, 1], color: 'accent', width: 2.6 });
          sC.dot(e, Te * (2 / (2 - e)) ** 0.25, { color: 'gold', r: 7, label: `${fx(v, Te * (2 / (2 - e)) ** 0.25, 0)} K`, labelPos: e > 0.6 ? 'nw' : 'ne' });
          R = { N, T0: C(0), T1: N ? C(N) : null, bare: C(0) - 0, e, Ts: Te * (2 / (2 - e)) ** 0.25, Te, all };
        });
        v.legend([['accent', 'plate temperature'], ['muted', 'the other gap condition', { dash: true }], ['gold', 'sunlight'], ['purple', '“dark heat”']]);
        v.readout(() => R && String.raw`${R.N} pane${R.N === 1 ? '' : 's'}: plate **${fx(v, R.T0, 0)} °C**${R.N ? String.raw`, outer pane ${fx(v, R.T1, 0)} °C` : ''} (open to the sky: ${fx(v, R.all[0], 0)} °C; each pane raises it, with diminishing returns) · the planetary analogue: $\varepsilon$ = ${fx(v, R.e, 2)} warms the surface from $T_e$ = ${fx(v, R.Te, 0)} K to ${fx(v, R.Ts, 0)} K (Fourier did not compute this number; the observed 288 K needs $\varepsilon \approx 0.78$) · panes in an *evacuated* box help only through radiation, which is exactly Fourier's point`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.15
    {
      num: '2.15',
      kind: 'Paper',
      name: 'On the absorption and radiation of heat by gases and vapours',
      paper: { authors: 'John Tyndall', year: 1861, title: 'On the Absorption and Radiation of Heat by Gases and Vapours, and on the Physical Connexion of Radiation, Absorption, and Conduction', venue: 'Philosophical Transactions of the Royal Society of London 151: 1–36', doi: '10.1098/rstl.1861.0001' },
      introduces: ['climate-2.3'],
      statement: String.raw`Tyndall passed radiant heat from a hot source through a long brass tube filled in turn with different gases and measured, with a thermopile and a sensitive galvanometer, how much was absorbed. His findings: the main constituents of the air — oxygen, nitrogen, hydrogen — and dry air itself are almost perfectly transparent to radiant heat; **compound gases** such as carbonic acid (CO₂), carbonic oxide, nitrous oxide, olefiant gas (ethylene) and ammonia absorb it hundreds to thousands of times more strongly; and the aqueous vapour of the air is the strongest absorber of all in the atmosphere itself. The absorption depends on the gas, grows with the pressure (and so with the amount of gas in the path), and is the same, wavelength by wavelength, as the gas's power to radiate. From this Tyndall concluded that variations of the atmosphere's water vapour and carbonic acid could change the climate.`,
      scope: String.raw`The relative values are for the pure gases at one atmosphere in his tube and a hot (non-solar, near 100 °C) source, from the table of the 1861 paper as recalled here, and *not re-checked against the original*: the ranking and the orders of magnitude are what matter. The conversion from his relative numbers to the fraction of heat absorbed in the viz is an illustrative calibration of ours.`,
      idea: String.raw`Earlier workers (Melloni, Fourier's successors) had shown that different solids and liquids absorb radiant heat differently, but nobody had measured gases, whose absorption is tiny over short paths. Tyndall made the path long (about 33 inches), compensated the apparatus by a second thermopile so that the galvanometer stayed at zero until the gas was admitted, and so reduced the experimental uncertainty enough to see that the *simple* diatomic gases do not absorb but *complex* molecules do. That is exactly the molecular explanation of 2.3: a vibrating dipole is needed. He did not have it; it came with quantum theory.`,
      caption: String.raw`Choose a gas on the chart (bars on a log axis: Tyndall's relative absorption at one atmosphere, air = 1) and set the pressure in the tube in inches of mercury. The galvanometer needle shows the deflection that results; the dashed curve in the right panel is the absorption of the chosen gas against pressure, with the other gases for comparison. Weak absorbers need a long path (high pressure); a strong one, ammonia or olefiant gas, takes up most of the beam at once.`,
      deps: ['thermo-9.1', 'climate-1.4', 'climate-2.14'],
      refs: [],
      tags: ['history', 'infrared absorption', 'Tyndall'],
      credit: 'John Tyndall, 1859–61',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/John_Tyndall' },
      viz(v) {
        const gsel = v.select('gas', GASES.map((g) => ({ value: g.id, label: g.short })), 'CO2');
        const pr = v.slider('pressure of the gas in the tube (inches of mercury)', 0.5, 30, 30, { step: 0.5 });
        const sA = v.stage({ x: [0, 12], y: [0, 6], axes: false, height: 230, full: true, title: 'the apparatus: source, tube, thermopile and galvanometer' });
        const sB = v.stage({ x: [-0.5, GASES.length - 0.5], y: [0.5, 2e4], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.35, minWidth: 320, xlabel: 'gas', ylabel: 'relative absorption (dry air = 1)', title: 'Tyndall’s table (click a bar)', xticks: GASES.map((g, i) => [i, g.id.replace('2', '₂').replace('3', '₃').replace('4', '₄')]) });
        const sC = v.stage({ x: [0, 30], y: [0, 0.4], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 250, xlabel: 'pressure (inches of mercury)', ylabel: 'fraction of the heat absorbed', title: 'absorption against pressure' });
        const KAPPA = 5e-5 / 30; // fraction ≈ 1 − exp(−κ R p): olefiant gas at 30 in absorbs ≈ 26 %
        const frac = (g, p) => 1 - Math.exp(-KAPPA * g.R * p);
        sB.onClick((x) => { const i = Math.round(x); if (i >= 0 && i < GASES.length) gsel.set(GASES[i].id, { fire: true }); });
        let R = null;
        v.render(() => {
          const g = GASES.find((q) => q.id === gsel.value), p = pr.value, a = frac(g, p);
          // apparatus
          sA.rect(0.4, 2.3, 2.1, 3.7, { fill: 'red', fillAlpha: 0.5, color: 'red', width: 1.5 }); sA.text('hot source', 1.25, 4.1, { size: 11.5, color: 'red', align: 'center', baseline: 'bottom' });
          sA.rect(2.5, 2.5, 8.0, 3.5, { fill: g.col, fillAlpha: Math.min(0.55, 0.1 + 0.5 * (p / 30) * (g.R > 5 ? 1 : 0.1)), color: 'ink', width: 1.6 });
          sA.text(`brass tube (33 in): ${g.name}, ${fx(v, p, 1)} in Hg`, 5.25, 3.9, { size: 11.5, color: 'ink', align: 'center', baseline: 'bottom' });
          for (let k = 0; k < 4; k++) { const x0 = 2.6 + k * 1.9, y = 3.0 + (k - 1.5) * 0.18; sA.arrow(x0, y, x0 + 1.5, y, { color: 'orange', width: 3.2 * (1 - a * (x0 - 2.5) / 5.5), head: 6, alpha: Math.max(0.15, 1 - a * (x0 - 2.5) / 5.5) }); }
          sA.rect(8.2, 2.3, 9.2, 3.7, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.5 }); sA.text('thermopile', 8.7, 4.1, { size: 11.5, color: 'accent', align: 'center', baseline: 'bottom' });
          // galvanometer needle: deflection from the absorbed fraction (zero deflection with the evacuated tube); full scale at 30 % absorbed
          const phi = Math.PI / 2 - Math.min(1, a / 0.3) * 1.2, cx = 11.0, cy = 1.4, r = 1.55;
          sA.curve((t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)], 0.0, Math.PI, { color: 'faint', width: 1.2 });
          for (let k = 0; k <= 10; k++) { const t = Math.PI * (k / 10); sA.line(cx + r * 0.88 * Math.cos(t), cy + r * 0.88 * Math.sin(t), cx + r * Math.cos(t), cy + r * Math.sin(t), { color: 'muted', width: 1 }); }
          sA.arrow(cx, cy, cx + r * 0.95 * Math.cos(phi), cy + r * 0.95 * Math.sin(phi), { color: 'ink', width: 2.4, head: 5 });
          sA.text('galvanometer', cx, 0.15, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          sA.line(9.2, 3.0, 10.4, 1.9, { color: 'muted', width: 1.2, dash: [3, 3] });
          // bars
          GASES.forEach((q, i) => sB.rect(i - 0.36, 0.5, i + 0.36, q.R, { fill: q.col, fillAlpha: q.id === g.id ? 0.9 : 0.45, color: q.col, width: q.id === g.id ? 2 : 0.8 }));
          GASES.forEach((q, i) => sB.text(`${q.R}`, i, q.R, { size: 10.5, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }));
          sB.hline(1, { color: 'faint' });
          // pressure curves
          for (const q of GASES.filter((q2) => ['CO2', 'C2H4', 'NH3', 'CO', 'Cl'].includes(q2.id))) {
            const pts = []; for (let x = 0; x <= 30; x += 1) pts.push([x, frac(q, x)]);
            sC.path(pts, { color: q.col, width: q.id === g.id ? 3.2 : 1.3, alpha: q.id === g.id ? 1 : 0.6 });
            sC.text(q.id.replace('2', '₂').replace('4', '₄').replace('3', '₃'), 30, frac(q, 30), { size: 10.5, color: q.col, align: 'right', baseline: 'bottom', dy: -3 });
          }
          if (!['CO2', 'C2H4', 'NH3', 'CO', 'Cl'].includes(g.id)) sC.path([[0, 0], [30, a * 30 / p]], { color: g.col, width: 3 });
          sC.dot(p, a, { color: 'gold', r: 7 });
          R = { g, p, a };
        });
        v.legend([['gold', 'current setting', { dot: true }]]);
        v.readout(() => R && String.raw`**${R.g.name}**: Tyndall's relative absorption ${R.g.R} (dry air = 1) — ${R.g.R > 1 ? `${fx(v, R.g.R, 0)} times the air` : 'no more than the air'} · at ${fx(v, R.p, 1)} in Hg the model tube absorbs **${fx(v, 100 * R.a, R.a < 0.01 ? 3 : 1)}%** of the heat · today: N₂, O₂ and H₂ have no infrared-active vibration (2.3) so the "1" is the instrument's floor and the water vapour left in Tyndall's "dry" air; CO₂ absorbs through its 15 µm and 4.3 µm bands`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.16
    {
      num: '2.16',
      kind: 'Paper',
      name: 'Thermal Equilibrium of the Atmosphere',
      paper: { authors: 'Syukuro Manabe and Richard T. Wetherald', year: 1967, title: 'Thermal Equilibrium of the Atmosphere with a Given Distribution of Relative Humidity', venue: 'Journal of the Atmospheric Sciences 24 (3): 241–259', doi: '10.1175/1520-0469(1967)024<0241:TEOTAW>2.0.CO;2' },
      introduces: ['climate-2.11', 'climate-9.3'],
      statement: String.raw`Manabe and Wetherald computed the equilibrium temperature profile of a one-dimensional column with radiative transfer for H₂O, CO₂ and O₃, convective adjustment to a critical lapse rate of 6.5 K/km, and — their new step — a prescribed **relative humidity** (77% at the surface, decreasing upward) so that the water vapour content rises when the air warms. Their findings: the equilibrium surface temperature of the cloudless model depends strongly on CO₂; **doubling CO₂ from 300 to 600 ppm warms the surface by about 2.4 K at fixed relative humidity, about twice the 1.3 K found when the absolute humidity is held fixed**; the stratosphere cools; and the surface warming at fixed relative humidity is much larger than for a dry or fixed-vapour atmosphere, i.e. a **water-vapour feedback** (climate-4.2) doubles the response. Convective adjustment, by itself, makes the troposphere warm everywhere together while the stratosphere cools.`,
      scope: String.raw`Quoted values (2.36 K and 1.33 K for 300 → 600 ppm) are for the paper's cloudless column with its radiative scheme; later models found about 1.9–2.5 K for the cloud-free fixed-RH response and, with fixed (not absolute) clouds, the final 3 K per doubling of today's assessments (climate-3.12). The numbers of this synthetic column are not those of the paper.`,
      idea: String.raw`Two earlier radiative models gave conflicting answers: a fixed absolute water-vapour amount (Möller 1963) produced a small CO₂ effect on the surface but a large one if relative humidity (rather than absolute humidity) were kept fixed. Manabe and Wetherald's *new* ingredient was to hold the relative humidity at a fixed profile, which they argued was nearer the real atmosphere, and to solve the full coupled problem (radiation, convection, a surface in balance) to equilibrium. The factor of two between the two humidity assumptions is the water-vapour feedback, still the largest amplifier in climate models.`,
      caption: String.raw`Recreate the paper's experiment: the column is integrated to equilibrium for the **base** CO₂ with fixed relative humidity, then for the **doubled** CO₂ at fixed relative humidity, then for the doubled CO₂ with the absolute humidity frozen at the base state (the integration runs on the page; a few seconds). Left: the three profiles; right: the surface warming of each against the paper's numbers (for 300 → 600 ppm only). Change the surface relative humidity or the CO₂ pair and the integration restarts.`,
      deps: ['climate-2.6', 'climate-2.7', 'climate-4.2', 'geo-1.6', 'climate-3.11'],
      refs: [],
      tags: ['history', 'radiative-convective equilibrium', 'water vapour feedback'],
      credit: 'Syukuro Manabe & Richard T. Wetherald, 1967',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Syukuro_Manabe' },
      viz(v) {
        const pair = v.select('CO₂ change', [{ value: '150', label: '150 → 300 ppm' }, { value: '300', label: '300 → 600 ppm (the paper)' }, { value: '600', label: '600 → 1200 ppm' }], '300', { onChange: () => start() });
        const rhs = v.slider('surface relative humidity', 0.4, 1, 0.77, { step: 0.01, onChange: () => start() });
        const sA = v.stage({ x: [180, 320], y: [0, 40], axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 270, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'equilibrium profiles' });
        const sB = v.stage({ x: [-0.3, 4.6], y: [-0.8, 8], axes: 'box', gutter: true, height: 380, weight: 0.9, minWidth: 250, xlabel: '', ylabel: 'surface warming (K)', title: 'warming for the CO₂ change', xticks: [[0.8, 'fixed RH'], [3.1, 'fixed absolute']] });
        const sC = v.stage({ x: [-14, 8], y: [0, 40], axes: 'box', gutter: true, height: 380, weight: 0.9, minWidth: 250, xlabel: 'temperature change (K)', ylabel: 'height (km)', title: 'where it warms and cools' });
        let res = { base: null, rh: null, ab: null }, stage = 0, job = null, timer = null, gen = 0;
        const opts = (co2, fixedQ) => ({ asr: ASR_RCE, o3: O3, sw: SW, co2, rhs: rhs.value, fixedQ, maxSteps: 900, minSteps: 120 });
        const snap = (st) => ({ T: Array.from(st.T), Ts: st.Ts });
        function start() {
          gen++; const my = gen; if (timer) clearTimeout(timer);
          res = { base: null, rh: null, ab: null }; stage = 0;
          const c0 = +pair.value, c1 = 2 * c0;
          const plan = [
            () => rceJob(opts(c0), null),
            () => rceJob(opts(c1), res.base),
            () => rceJob({ ...opts(c1, humidity(res.base.T, GRID, { rhs: rhs.value })) }, res.base),
          ];
          const keys = ['base', 'rh', 'ab'];
          const next = () => {
            if (my !== gen) return;
            if (stage >= 3) { v.invalidate(); return; }
            job = plan[stage]();
            if (still()) { rceFinishJob(job); res[keys[stage]] = snap(job.st); stage++; next(); return; }
            const tick = () => { timer = null; if (my !== gen) return; const d = rceAdvance(job, 18); v.invalidate(); if (d) { res[keys[stage]] = snap(job.st); stage++; next(); } else timer = setTimeout(tick, 0); };
            timer = setTimeout(tick, 0);
          };
          next();
        }
        v.onCleanup(() => { gen++; if (timer) clearTimeout(timer); });
        start();
        let R = null;
        v.render(() => {
          const live = (k, i) => (res[k] ? res[k] : stage === i && job ? snap(job.st) : null);
          const b = live('base', 0), r = live('rh', 1), a = live('ab', 2);
          const draw = (s, col, w, dash) => { if (!s) return; const z = heights(s.T); sA.path(s.T.map((t, i) => [t, z[i]]), { color: col, width: w, dash }); sA.dot(s.Ts, 0, { color: col, r: 4 }); };
          draw(b, 'muted', 2, [5, 4]); draw(r, 'red', 2.6); draw(a, 'accent', 2.6);
          const c0 = +pair.value;
          const dRH = r && res.rh ? r.Ts - b.Ts : null, dAB = a && res.ab ? a.Ts - b.Ts : null;
          const paperRH = c0 === 300 ? 2.36 : null, paperAB = c0 === 300 ? 1.33 : null;
          const bar = (x, val, col, lab) => { if (val == null) return; sB.rect(x, 0, x + 0.75, Math.max(0, val), { fill: col, fillAlpha: 0.7, stroke: false }); sB.text(fx(v, val, 2), x + 0.375, val, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -3 }); sB.text(lab, x + 0.375, -0.1, { size: 10.5, color: 'ink', align: 'center', baseline: 'top' }); };
          bar(0, dRH, 'red', 'model'); bar(0.85, paperRH, 'gold', 'paper'); bar(2.3, dAB, 'accent', 'model'); bar(3.15, paperAB, 'gold', 'paper');
          // difference profiles
          const dz = (s) => { const z = heights(s.T); return s.T.map((t, i) => [t - b.T[i], z[i]]); };
          sC.vline(0, { color: 'faint' });
          if (b && r && res.rh) sC.path(dz(r), { color: 'red', width: 2.6 });
          if (b && a && res.ab) sC.path(dz(a), { color: 'accent', width: 2.6 });
          if (b && r && res.rh) { const z = heights(r.T); let k = 28; sC.text(`at ${fx(v, z[k], 0)} km: ${fx(v, r.T[k] - b.T[k], 1)} K`, -13.5, 3, { size: 11, color: 'red', align: 'left' }); }
          R = { b, dRH, dAB, paperRH, paperAB, stage, c0 };
        });
        v.legend([['muted', 'base CO₂', { dash: true }], ['red', 'doubled, fixed relative humidity'], ['accent', 'doubled, fixed absolute humidity'], ['gold', 'the paper']]);
        v.readout(() => R && (R.dAB == null ? String.raw`integrating… (stage ${Math.min(3, R.stage + 1)} of 3: ${['base state', 'doubled CO₂ at fixed relative humidity', 'doubled CO₂ at fixed absolute humidity'][Math.min(2, R.stage)]})${R.b ? String.raw` · base surface ${fx(v, R.b.Ts, 1)} K` : ''}` : String.raw`base surface ${fx(v, R.b.Ts, 1)} K; ${R.c0} → ${2 * R.c0} ppm: fixed relative humidity **+${fx(v, R.dRH, 2)} K**, fixed absolute humidity **+${fx(v, R.dAB, 2)} K** — ratio ${fx(v, R.dRH / R.dAB, 1)}${R.paperRH ? String.raw` · paper (cloudless): +${fx(v, R.paperRH, 2)} K and +${fx(v, R.paperAB, 2)} K, ratio ${fx(v, R.paperRH / R.paperAB, 1)}; today's clear-sky radiative–convective models give about 2–2.5 K at fixed relative humidity` : ''}`));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.17
    {
      num: '2.17',
      kind: 'Paper',
      name: 'Stratospheric sink for chlorofluoromethanes',
      paper: { authors: 'Mario J. Molina and F. S. Rowland', year: 1974, title: 'Stratospheric sink for chlorofluoromethanes: chlorine atom-catalysed destruction of ozone', venue: 'Nature 249 (5460): 810–812', doi: '10.1038/249810a0' },
      introduces: [],
      statement: String.raw`Chlorofluoromethanes (CFC-11, CFCl₃, and CFC-12, CF₂Cl₂), released from aerosol cans, refrigerators and foams, are chemically inert in the lower atmosphere: they are not removed by rain, oxidation or sunlight and therefore accumulate for decades. The paper argues that their only sink is **photolysis by short-wave ultraviolet in the stratosphere**, which frees chlorine atoms; each Cl atom then catalyses the destruction of ozone,
$$\mathrm{Cl} + \mathrm{O_3} \to \mathrm{ClO} + \mathrm{O_2},\qquad \mathrm{ClO} + \mathrm{O} \to \mathrm{Cl} + \mathrm{O_2},$$
net $\mathrm{O_3} + \mathrm{O} \to 2\,\mathrm{O_2}$, and is regenerated, so one atom destroys many thousands of ozone molecules before being tied up as HCl. The authors estimated atmospheric lifetimes of 40–150 years for CFCl₃ and 60–100 years for CF₂Cl₂ and concluded that continued release would deplete stratospheric ozone appreciably (they cautioned about biological effects of the extra ultraviolet).`,
      scope: String.raw`The paper's lifetimes were a first estimate from the stratospheric photolysis rates (sources of uncertainty included the vertical mixing); the viz uses a one-box lifetime model and a linear ozone-loss law calibrated to the observed 1990s loss, with an illustrative reconstruction of the emissions (not the AFEAS industry data).`,
      idea: String.raw`Rowland and Molina asked where the CFCs go and found no sink below the stratosphere, so the atmospheric content is nearly the cumulative emission, with a lifetime set by how fast the air mixes up into the region where ultraviolet below 220 nm reaches them. Combining this with the known chlorine chemistry of the stratosphere (the catalytic cycles had been proposed for NOₓ by Crutzen and Johnston), they saw that the chain length — thousands of cycles per chlorine atom — turns the tiny number of freed atoms into a large ozone loss. The photochemistry of ozone is the subject of 2.13; the kinetics of the chain is the radical-chain kinetics of the kin collection.`,
      caption: String.raw`Top left: the catalytic cycle — click *play* to watch one chlorine atom (gold) hop between O₃ and O and leave a trail of O₂, and the counter of destroyed ozone molecules. Choose the emission scenario (the real history with the Montreal Protocol, emissions frozen at 1974, or growth of 5%/yr), the lifetimes (default today's accepted values) and the chain length. Middle: the CFC mixing ratios; right: the stratospheric chlorine they carry and the ozone loss it implies.`,
      deps: ['kin-7.6', 'climate-2.13'],
      refs: [],
      tags: ['history', 'ozone', 'CFC'],
      credit: 'Mario Molina & F. Sherwood Rowland, 1974',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mario_J._Molina' },
      viz(v) {
        const scn = v.select('emissions after 1974', [{ value: 'actual', label: 'actual (Montreal Protocol)' }, { value: 'frozen', label: 'frozen at 1974' }, { value: 'grow', label: 'grow 5% per year' }], 'actual');
        const t11 = v.slider('CFC-11 lifetime (years)', 30, 160, 52, { step: 1 });
        const t12 = v.slider('CFC-12 lifetime (years)', 50, 160, 102, { step: 1 });
        const chain = v.slider('ozone molecules destroyed per freed Cl atom', 1e3, 1e6, 1e5, { log: true, sig: 2 });
        const sA = v.stage({ x: [0, 12], y: [0, 8], axes: false, height: 330, weight: 1, minWidth: 280, title: 'the catalytic cycle' });
        const sB = v.stage({ x: [1950, 2100], y: [0, 700], axes: 'box', gutter: true, height: 330, weight: 1.05, minWidth: 280, xlabel: 'year', ylabel: 'mixing ratio (ppt)', title: 'CFC-11 and CFC-12 in the air' });
        const sC = v.stage({ x: [1950, 2100], y: [0, 40], axes: 'box', gutter: true, height: 330, weight: 1.05, minWidth: 280, xlabel: 'year', ylabel: 'ozone loss (%)', title: 'ozone loss (illustrative)' });
        let R = null;
        const K = 4.5e-3; // % per ppt of chlorine carried by CFC-11 and 12 (calibrated to ≈ 3 % in the 1990s)
        v.animate((t) => {
          const ph = (t / 3) % 1;
          // cycle diagram: Cl → ClO → Cl, with ozone and oxygen atoms
          const P = { Cl: [3, 6], ClO: [9, 6], mid: [6, 2.2] };
          sA.arrow(3.9, 6.3, 8.1, 6.3, { color: 'ink', width: 2.2, head: 8 }); sA.arrow(8.1, 5.7, 3.9, 5.7, { color: 'ink', width: 2.2, head: 8 });
          sA.text('Cl + O₃ → ClO + O₂', 6, 7.2, { size: 13, color: 'accent', align: 'center', weight: 700 });
          sA.text('ClO + O → Cl + O₂', 6, 4.7, { size: 13, color: 'orange', align: 'center', weight: 700 });
          sA.dot(P.Cl[0], P.Cl[1], { r: 30, color: 'gold' }); sA.dot(P.ClO[0], P.ClO[1], { r: 30, color: 'orange' }); sA.text('Cl', P.Cl[0], P.Cl[1], { size: 18, weight: 700, color: 'ink', align: 'center', baseline: 'middle' }); sA.text('ClO', P.ClO[0], P.ClO[1], { size: 18, weight: 700, color: 'ink', align: 'center', baseline: 'middle' });
          const cyc = ph < 0.5 ? ph * 2 : (ph - 0.5) * 2, fwd = ph < 0.5;
          const x = fwd ? 3.9 + 4.2 * cyc : 8.1 - 4.2 * cyc, y = fwd ? 6.3 : 5.7;
          sA.dot(x, y, { r: 7, color: fwd ? 'accent' : 'green' });
          sA.text(fwd ? 'O₃' : 'O', x, y + (fwd ? 0.6 : -0.6), { size: 12, color: fwd ? 'accent' : 'green', align: 'center', weight: 700 });
          const n = Math.floor(t / 3) * 1 + (ph >= 0.5 ? 1 : 0);
          sA.text('net: O₃ + O → 2 O₂', 6, 2.4, { size: 14, color: 'ink', align: 'center', weight: 700 });
          sA.text(`${n} cycle${n === 1 ? '' : 's'} shown; about ${(chain.value / 1e3).toFixed(0)}×10³ before the chain ends`, 6, 1.5, { size: 11.5, color: 'ink', align: 'center' });
          sA.text('then Cl is tied up as HCl or ClONO₂', 6, 0.6, { size: 11, color: 'muted', align: 'center' });
        }, { period: 3, still: 2.2 });
        v.render(() => {
          const run = cfcRun(scn.value, t11.value, t12.value), k = chain.value / 1e5;
          const eesc = (r) => 3 * 0.47 * r.c11 + 2 * 0.23 * r.c12; // ppt Cl delivered to the stratosphere (fractional release 0.47, 0.23)
          const loss = run.map((r) => K * k * eesc(r) * (1 - 0)); // %
          sB.path(run.filter((r) => r.t >= 1950).map((r) => [r.t, r.c12]), { color: 'orange', width: 2.6 });
          sB.path(run.filter((r) => r.t >= 1950).map((r) => [r.t, r.c11]), { color: 'accent', width: 2.6 });
          sB.vline(1974, { color: 'muted', dash: [4, 4] }); sB.text('1974 paper', 1975, 660, { color: 'muted', size: 11, align: 'left' });
          sB.vline(1987, { color: 'faint', dash: [2, 3] }); sB.text('Montreal 1987', 1988, 620, { color: 'muted', size: 10.5, align: 'left' });
          sB.dot(1974, run[29].c11, { color: 'accent', r: 5 }); sB.dot(1974, run[29].c12, { color: 'orange', r: 5 });
          sC.hline(0, { color: 'faint' });
          sC.setView(null, [0, Math.max(10, Math.min(60, Math.ceil(Math.max(...loss) / 5) * 5 + 2))]);
          sC.path(run.map((r, i) => [r.t, loss[i]]).filter((p) => p[0] >= 1950), { color: 'red', width: 2.8 });
          sC.hline(3, { color: 'muted', dash: [5, 4] }); sC.text('observed ≈ 3 % in the 1990s (all halogens)', 2098, 3, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom', dy: -3 });
          const i74 = run.findIndex((r) => r.t === 1974), i95 = run.findIndex((r) => r.t === 1995), imax = loss.indexOf(Math.max(...loss));
          R = { c11: run[i74].c11, c12: run[i74].c12, l95: loss[i95], lmax: loss[imax], tmax: run[imax].t, l2050: loss[run.findIndex((r) => r.t === 2050)], s: scn.value };
        });
        v.legend([['accent', 'CFC-11'], ['orange', 'CFC-12'], ['red', 'ozone loss']]);
        v.readout(() => R && String.raw`1974: CFC-11 ${fx(v, R.c11, 0)} ppt and CFC-12 ${fx(v, R.c12, 0)} ppt (observed about 100 and 190) · lifetimes ${t11.value} and ${t12.value} years — the paper estimated 40–150 and 60–100 years, today's accepted values are 52 and 102 · ozone loss in 1995 **${fx(v, R.l95, 1)} %**, largest **${fx(v, R.lmax, 1)} %** in ${R.tmax}, ${fx(v, R.l2050, 1)} % in 2050`);
      },
    },
  ],
};
