// Quantum Mechanics — Chapter 1 (papers): Einstein 1905 (light quanta), Bohr 1913, de Broglie 1925

// ── Millikan 1916, sodium (Phys. Rev. 7: 355–388). Stopping potentials read from his Fig. 6 (p. 373 of the archive.org scan,
//    reading accuracy about ±0.01 V); his value 0.52 V for line 2535 Å is stated in the text (p. 382). Adding his measured
//    contact e.m.f., 2.51 V, gives the maximum kinetic energy of the electrons; those corrected values agree to 0.01 V with
//    the four points tabulated in J. Spanget-Larsen's RUC problem set (2016). ──
const MILLIKAN = [
  { lam: 5461, V: -2.05 }, { lam: 4339, V: -1.49 }, { lam: 4047, V: -1.30 },
  { lam: 3650, V: -0.92 }, { lam: 3126, V: -0.39 }, { lam: 2535, V: 0.52 },
];
const CONTACT = 2.51;           // volts, Millikan's contact e.m.f. during the run
const M_SLOPE = 4.124e-15;      // V·s, slope of his Fig. 6 line
const M_E = 4.774e-10;          // esu, Millikan's electronic charge
const M_NU0 = 43.9e13;          // Hz, his threshold after the contact correction (6,800 Å)
// ── Bohr 1913 (Phil. Mag. 26: 1–25, ChemTeam transcription): constants he used and the result ──
const BOHR = { e: 4.7e-10, em: 5.31e17, h: 6.5e-27, R: 3.1e15, Robs: 3.290e15 };
// Balmer lines, wavelengths in air (nm), NIST ASD via Wikipedia's Balmer-series table
const BALMER_AIR = [656.279, 486.135, 434.0472, 410.1734, 397.0075, 388.9064, 383.5397];

/** Refractive index of standard air (Edlén 1966 dispersion formula), λ in nm. */
const nAir = (nm) => { const s2 = (1000 / nm) ** 2; return 1 + 8.34254e-5 + 2.406147e-2 / (130 - s2) + 1.5998e-4 / (38.9 - s2); };
/** Spectral colour for a wavelength in nm, or a palette stand-in outside the visible range. */
const specCol = (v, nm) => (nm >= 385 && nm <= 760 ? v.M.wavelengthRGB(nm) : nm < 385 ? 'purple' : 'red');
const SCOPE = [14, 15, 22]; // the inside of a spectroscope: dark in both themes

export default {
  collection: 'qm',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Paper',
      name: 'Erzeugung und Verwandlung des Lichtes',
      paper: { authors: 'A. Einstein', year: 1905, title: 'Über einen die Erzeugung und Verwandlung des Lichtes betreffenden heuristischen Gesichtspunkt', venue: 'Annalen der Physik 322 (6): 132–148', doi: '10.1002/andp.19053220607' },
      introduces: ['qm-1.3'],
      credit: 'Albert Einstein, received 18 March 1905',
      statement: String.raw`Einstein proposed, as a "heuristic point of view", that light of frequency $\nu$ behaves in its interactions with matter as if it consisted of independent **energy quanta** of size $h\nu$ (in his notation $R\beta\nu/N$), localised at points and absorbed or emitted only as wholes. His evidence was thermodynamic: in the Wien regime the entropy of black-body radiation depends on its volume exactly as the entropy of a gas of $E/h\nu$ independent particles. He drew three consequences — Stokes' rule for photoluminescence, the ionisation of gases by ultraviolet light, and the **photoelectric law**: if each quantum gives all its energy to one electron, which spends a work $P$ to leave the metal, then the fastest electrons have
$$\tfrac12 m v_{\max}^2 = e V_0 = h\nu - P,$$
a straight line in $\nu$ whose slope $h/e$ is the same for every metal, independent of the light's intensity; brighter light ejects more electrons but no faster ones, and below the threshold $\nu_0 = P/h$ no light ejects any. Scope: the photoelectric law is exact for single-photon absorption; at very high intensities (lasers) multiphoton emission occurs, and the full quantum theory of light came only with quantum electrodynamics.`,
      idea: String.raw`Planck had introduced $h$ in 1900 as a property of the oscillators that emit and absorb radiation, keeping the radiation itself a Maxwell wave. Einstein went much further: the radiation itself is granular. Lenard's 1902 measurements already showed that the speed of photoelectrons does not depend on the light's intensity, a fact the wave theory could not explain; the wave picture also predicts a delay of minutes before a dim light could pour enough energy onto one atom, and none is seen. The linear law was a bold prediction: Einstein estimated, with $P=0$ and the ultraviolet limit of sunlight $\nu = 1.03\times10^{15}$ Hz, a potential of 4.3 volts, of the order Lenard found. Robert Millikan set out to refute it and in 1916, shaving his alkali-metal surfaces in vacuum with a rotating knife, confirmed it exactly: his slope gave $h = 6.57\times10^{-27}$ erg·s, within 0.5% of Planck's value from radiation — though he still called the light-quantum hypothesis "wholly untenable". The paper earned Einstein the 1921 Nobel Prize; the quantum of light was named the photon in 1926 and its momentum $h/\lambda$ confirmed by Compton in 1923 (qm-1.3).`,
      caption: String.raw`Gold points: Millikan's 1916 measurements on sodium, read from his Fig. 6 and corrected for his contact potential, at the six mercury lines he used (labels in Å). The green line is the least-squares fit through the five lines Millikan used for his slope (dashed gold: the line he drew); its slope is $h/e$. **Drag the work function** of a second metal: Einstein's law makes every metal's line parallel. Turn on the **wave theory** to see what classical optics expected — energies set by the brightness, not the colour, and no threshold (schematic). Right: brightness against the fastest electrons' energy for the chosen line — the quantum line is flat while the number of electrons grows; the readout gives the classical waiting time before one atom could collect enough energy.`,
      deps: ['qm-1.1', 'qm-1.2', 'thermo-5.6', 'thermo-9.15'],
      refs: [],
      tags: ['photoelectric effect', 'photons', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Photoelectric_effect' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const wave = v.toggle('wave theory (classical expectation)', false);
        const wS = v.slider('work function of a second metal', 1.5, 5.5, 4.3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} eV` });
        const lineSel = v.select('mercury line', MILLIKAN.map((p, i) => ({ value: i, label: `${p.lam} Å` })), 3);
        const Iint = v.slider('brightness', 0.01, 100, 1, { log: true, fmt: (x) => `${v.fmt(x, 2)} µW/cm²` });
        const A = v.stage({ x: [0, 13], y: [-0.8, 4.2], axes: 'box', height: 360, weight: 1.35, minWidth: 320, xlabel: 'frequency ν (10¹⁴ Hz)', title: 'fastest photoelectrons: $\\tfrac12mv^2_{\\max}=eV_0$ (eV)' });
        const B = v.stage({ x: [0.01, 100], y: [-0.3, 4.2], xlog: true, axes: 'box', height: 360, weight: 1, minWidth: 260, xlabel: 'brightness (µW/cm²)', title: 'same colour, brighter light' });
        const pts = () => MILLIKAN.map((p) => ({ ...p, nu: C.c / (p.lam * 1e-10) / 1e14, K: p.V + CONTACT }));
        let st = {};
        v.render(() => {
          const P = pts(), P5 = P.slice(0, 5), fit = M.linreg(P5.map((p) => p.nu), P5.map((p) => p.K)), hFit = fit.slope * 1e-14 * C.e;
          const mLine = (x) => -2.055 + CONTACT + M_SLOPE * 1e14 * (x - 5.49); // Millikan's drawn line: −2.055 V at 54.9×10¹³ Hz, slope 4.124×10⁻¹⁵
          const sel = P[+lineSel.value], I = Iint.value;
          // threshold region and the two metals' lines
          const nu0 = -fit.intercept / fit.slope, nu2 = (wS.value * C.e) / C.h / 1e14;
          A.hline(0, { color: 'muted', width: 1 });
          A.rect(0, -0.8, nu0, 0, { fill: 'faint', fillAlpha: 0.15, stroke: false });
          A.text('no electrons below threshold', 0.3, -0.45, { size: 10.5, color: 'muted' });
          A.fn((x) => fit.predict(x), { domain: [nu0, 13], color: 'green', width: 2.4 });
          A.fn((x) => fit.predict(x), { domain: [0, nu0], color: 'green', width: 1.2, dash: [4, 4] });
          A.fn(mLine, { domain: [3.2, 13], color: 'gold', width: 1.4, dash: [7, 4] });
          A.fn((x) => (C.h * x * 1e14) / C.e - wS.value, { domain: [nu2, 13], color: 'accent', width: 2 });
          A.fn((x) => (C.h * x * 1e14) / C.e - wS.value, { domain: [Math.max(0, nu2 - 4), nu2], color: 'accent', width: 1.2, dash: [4, 4] });
          A.dot(nu2, 0, { r: 4, color: 'accent' });
          A.text(`second metal, W = ${v.fix(wS.value, 2)} eV`, Math.min(12.8, nu2 + 0.25), 0.18, { size: 10.5, color: 'accent', align: nu2 > 10 ? 'right' : 'left' });
          A.text(`sodium: least squares ${v.fix(fit.slope * 10, 3)}, Millikan’s line 4.124 (×10⁻¹⁵ V·s)`, 0.9, 3.95, { size: 11, color: 'green', weight: 600 });
          if (wave.value) {
            [0.1, 1, 10].forEach((Ir) => { const Kw = 0.45 * Math.log10(Ir * 30) + 0.9; A.hline(Kw, { color: 'red', dash: [7, 5], width: Math.abs(Math.log10(I) - Math.log10(Ir)) < 0.5 ? 2.4 : 1.2 }); A.text(`wave theory, ${Ir} µW/cm²`, 0.9, Kw, { align: 'left', dy: -8, size: 10.5, color: 'red' }); });
          }
          P.forEach((p, i) => { A.dot(p.nu, p.K, { r: i === +lineSel.value ? 7 : 5.5, color: 'gold', hollow: i === 5 }); A.text(`${p.lam}`, p.nu, p.K, { dx: -8, dy: -11, size: 10.5, color: 'gold', align: 'right' }); });
          // brightness panel
          B.hline(0, { color: 'muted', width: 1 });
          B.fn(() => sel.K, { color: 'green', width: 2.6 });
          B.dot(I, sel.K, { r: 7, color: 'gold' });
          if (wave.value) B.fn((x) => 0.45 * Math.log10(x * 30) + 0.9, { color: 'red', width: 2, dash: [7, 5] });
          const nE = Math.round(Math.min(60, 6 * Math.sqrt(I * 10)));
          const rr = v.rng(7);
          for (let k = 0; k < nE; k++) B.dot(Math.pow(10, -2 + 4 * rr()), 3.7 + 0.35 * rr(), { r: 2.4, color: 'accent', alpha: 0.7 });
          B.text(`electrons per second ∝ brightness (${nE} dots)`, 0.012, 3.45, { size: 10.5, color: 'accent' });
          B.text(`Einstein: ${v.fix(sel.K, 2)} eV at any brightness`, 90, sel.K, { align: 'right', dy: -10, size: 11, color: 'green', weight: 600 });
          st = { P, fit, hFit, nu0, sel, I };
        });
        v.legend([['gold', 'Millikan 1916, sodium (hollow: 2535 Å, not used for his slope)', { dot: true }], ['gold', 'Millikan’s own line', { dash: true }], ['green', 'least squares, five lines (slope h/e)'], ['accent', 'a second metal'], ['red', 'wave theory (schematic)', { dash: true }]]);
        v.readout(() => {
          const { fit, hFit, nu0, sel, I } = st; if (!fit) return '';
          const W = (C.h * nu0 * 1e14) / C.e, area = Math.PI * (1e-10) ** 2, tWait = (W * C.e) / (I * 1e-6 * 1e4 * area);
          return `least squares through the five lines Millikan used for the slope: $h/e$ = ${v.fix(fit.slope * 10, 4)}×10⁻¹⁵ V·s, so $h$ = ${v.fix(hFit * 1e34, 3)}×10⁻³⁴ J·s with today's $e$ · Millikan's own line: 4.124×10⁻¹⁵ V·s, and with his $e$ = 4.774×10⁻¹⁰ esu, $h$ = 6.56×10⁻²⁷ erg·s (adopted 6.57); with today's $e$ his slope gives ${v.fix(M_SLOPE * C.e * 1e34, 3)}×10⁻³⁴ · today: $h$ = 6.62607015×10⁻³⁴ J·s (exact), $h/e$ = ${v.fix((C.h / C.e) * 1e15, 4)}×10⁻¹⁵ V·s · threshold ${v.fix(nu0, 2)}×10¹⁴ Hz (Millikan: 4.39), work function ${v.fix(W, 2)} eV · at ${v.fmt(I, 2)} µW/cm² a wave would need ${tWait > 120 ? v.fmt(tWait / 60, 3) + ' minutes' : v.fmt(tWait, 3) + ' s'} to pour ${v.fix(W, 2)} eV onto one atom (radius 0.1 nm); electrons appear at once · Einstein 1905: $P = 0$, $\\nu = 1.03\\times10^{15}$ Hz gives 4.3 V; $h\\nu/e$ = ${v.fix((C.h * 1.03e15) / C.e, 2)} V · selected line ${sel.lam} Å: $eV_0$ = ${v.fix(sel.K, 2)} eV`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.16
    {
      num: '1.16',
      kind: 'Paper',
      name: 'On the constitution of atoms and molecules',
      paper: { authors: 'N. Bohr', year: 1913, title: 'On the constitution of atoms and molecules', venue: 'Philosophical Magazine (6th series) 26 (151): 1–25', doi: '10.1080/14786441308634955' },
      introduces: ['qm-1.5'],
      credit: 'Niels Bohr, July 1913',
      statement: String.raw`Bohr combined Rutherford's nuclear atom with Planck's quantum by two postulates: (1) the electron can move in certain **stationary states** in which classical mechanics holds but it does not radiate; (2) passing between two of them it emits or absorbs a single quantum of homogeneous radiation, $h\nu = W_{\tau_2}-W_{\tau_1}$. Fixing the states by the condition that the angular momentum is a whole multiple of $h/2\pi$, a hydrogen electron has energies
$$W_\tau = -\frac{2\pi^2 m e^4}{h^2\tau^2} \approx -\frac{13.6\ \text{eV}}{\tau^2},\qquad \nu = \frac{2\pi^2me^4}{h^3}\Big(\frac1{\tau_2^2}-\frac1{\tau_1^2}\Big),$$
which reproduces the **Balmer** series ($\tau_2 = 2$) and Paschen's infrared series ($\tau_2 = 3$), predicts the Lyman and further series, and computes the Rydberg constant from $e$, $m$ and $h$: Bohr found $3.1\times10^{15}\ \text{s}^{-1}$ against the observed $3.290\times10^{15}$. He reassigned Pickering's "hydrogen" lines to ionised helium, gave the ground-state diameter as $1.1\times10^{-8}$ cm and the ionisation energy as 13 volts. Scope: exact (to the reduced-mass correction) for one-electron atoms in this model; it fails for helium and heavier atoms, gives no intensities, and was superseded by quantum mechanics in 1925–26, which keeps the energy levels.`,
      idea: String.raw`Rutherford's 1911 atom — a tiny nucleus with orbiting electrons — was unstable in classical electrodynamics: an orbiting electron radiates and should spiral in within nanoseconds, emitting a continuum, not lines. Spectroscopists had meanwhile found that line frequencies are differences of "terms", $R(1/n^2 - 1/m^2)$ (Balmer 1885, Rydberg, Ritz), with no explanation. Bohr simply declared the stationary states stable and identified the terms with energies divided by $h$; the empirical constant $R$ then came out of the electron's charge and mass and Planck's constant, which was the paper's sensation. He also explained why only 12 Balmer lines appear in laboratory tubes but 33 in some stars: the $\tau$-th orbit has diameter proportional to $\tau^2$ — $1.6\times10^{-6}$ cm for $\tau = 12$, $1.2\times10^{-5}$ cm for $\tau = 33$ — and such large atoms survive only in very rarefied gas. The model (qm-1.5) was refined by Sommerfeld's elliptical orbits and supplanted by Heisenberg's and Schrödinger's mechanics, which derive the same levels.`,
      caption: String.raw`Left: Bohr's energy levels $-13.6/\tau^2$ eV with the Balmer transitions; **drag the upper level** (or click a level) to choose a line, up to Bohr's 33. Right: the spectrum his formula predicts (top strip, true colours) against the measured hydrogen lines (bottom strip, NIST). Switch the **constants** between those Bohr used in 1913 — they put every line about 6% too long, "within the uncertainty of the constants" — and today's, and add the reduced-mass correction to close the last 0.05%.`,
      deps: ['qm-1.4', 'qm-1.1', 'mech-8.18', 'em-12.17', 'mech-8.23'],
      refs: [],
      tags: ['Bohr model', 'hydrogen', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bohr_model' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const consts = v.select('constants', [{ value: '1913', label: 'Bohr 1913: e = 4.7×10⁻¹⁰, e/m = 5.31×10¹⁷, h = 6.5×10⁻²⁷' }, { value: 'now', label: 'today (CODATA)' }], 'now');
        const redm = v.toggle('reduced-mass correction (finite proton mass)', true);
        const L = v.stage({ x: [0, 1], y: [-4.3, 0.45], axes: false, height: 380, weight: 0.8, minWidth: 240, title: 'energy levels $W_\\tau=-13.6/\\tau^2$ eV (τ ≥ 2)' });
        const Sp = v.stage({ x: [332, 720], y: [0, 1], axes: 'box', height: 380, weight: 1.4, minWidth: 320, xlabel: 'wavelength in vacuum (nm)', yticks: [], xticks: [400, 450, 500, 550, 600, 650, 700], title: 'Balmer series: Bohr’s formula against the measured lines' });
        const hU = L.handle(0.62, -13.6 / 9, { color: 'gold', constrain: (x, y) => { const t = M.clamp(Math.round(Math.sqrt(-13.6 / Math.min(y, -0.0125))), 3, 33); return [0.62, -13.6 / (t * t)]; } });
        L.onClick((x, y) => { if (y < -0.02 && y > -3.6) { const t = M.clamp(Math.round(Math.sqrt(-13.6 / y)), 3, 33); hU.set(0.62, -13.6 / (t * t)); } });
        /** Rydberg frequency c·R (s⁻¹) for the chosen constants. */
        const Rfreq = () => {
          let R;
          if (consts.value === '1913') { const m = BOHR.e / BOHR.em; R = (2 * Math.PI ** 2 * m * BOHR.e ** 4) / BOHR.h ** 3; }
          else R = C.c * C.Ry;
          return redm.value ? R / (1 + C.me / C.mp) : R;
        };
        const lamOf = (t, R) => (C.c / (R * (1 / 4 - 1 / (t * t)))) * 1e9;
        const measVac = BALMER_AIR.map((l) => l * nAir(l));
        let st = {};
        v.render(() => {
          const R = Rfreq(), tU = Math.round(Math.sqrt(-13.6 / hU.y)), Eh = (C.h * R) / C.e;
          // level diagram
          for (let t = 2; t <= 33; t++) { const W = -Eh / (t * t); L.line(0.08, W, 0.92, W, { color: t === 2 ? 'accent' : 'muted', width: t <= 6 ? 1.6 : 0.6, alpha: t <= 6 ? 1 : 0.45 }); if (t <= 5) L.text(`τ = ${t}  ${v.fix(W, 2)} eV`, 0.95, W, { dy: -8, size: 10.5, align: 'right', color: t === 2 ? 'accent' : 'muted' }); }
          L.text(`τ = 1 (ground state) at ${v.fix(-Eh, 2)} eV, far below ↓`, 0.08, -4.15, { size: 10.5, color: 'muted' });
          L.line(0.08, 0, 0.92, 0, { color: 'ink', width: 1.2, dash: [4, 3] }); L.text('τ = ∞ (ionised), 0 eV', 0.08, 0, { dy: -9, size: 10.5, color: 'ink' });
          for (let t = 3; t <= 8; t++) { const lam = lamOf(t, R), x = 0.12 + 0.062 * (t - 3), W = -Eh / (t * t); L.arrow(x, W, x, -Eh / 4, { color: specCol(v, lam), width: t === tU ? 3 : 1.6, head: 6 }); }
          const lamU = lamOf(tU, R);
          L.arrow(0.62, -Eh / (tU * tU), 0.62, -Eh / 4, { color: specCol(v, lamU), width: 3.2, head: 8 });
          L.text(`τ = ${tU} → 2`, 0.64, (-Eh / (tU * tU) - Eh / 4) / 2, { size: 11.5, color: 'ink', weight: 700 });
          // spectrum strips
          Sp.rect(360, 0.55, 720, 0.95, { fill: SCOPE, fillAlpha: 1, stroke: false });
          Sp.rect(360, 0.05, 720, 0.45, { fill: SCOPE, fillAlpha: 1, stroke: false });
          Sp.text('Bohr', 346, 0.75, { align: 'center', size: 11, color: 'ink', weight: 600 }); Sp.text('NIST', 346, 0.25, { align: 'center', size: 11, color: 'ink', weight: 600 });
          for (let t = 3; t <= 40; t++) { const lam = lamOf(t, R); if (lam < 360 || lam > 720) continue; Sp.line(lam, 0.57, lam, 0.93, { color: specCol(v, lam), width: t === tU ? 3.5 : t <= 9 ? 2.2 : 1, alpha: t <= 12 ? 1 : 0.6 }); }
          measVac.forEach((lam) => Sp.line(lam, 0.07, lam, 0.43, { color: specCol(v, lam), width: 2.2 }));
          const lim = lamOf(1e9, R); if (lim > 360) Sp.line(lim, 0.55, lim, 0.95, { color: 'muted', dash: [3, 3], width: 1 });
          if (tU - 3 < measVac.length) Sp.line(measVac[tU - 3], 0.45, lamU, 0.55, { color: 'gold', width: 1.4 });
          Sp.text(`λ = ${v.fix(lamU, 2)} nm`, Math.min(690, Math.max(390, lamU)), 0.5, { align: 'center', size: 11, color: 'gold', weight: 700 });
          st = { R, tU, lamU };
        });
        v.legend([['accent', 'level τ = 2 (Balmer series ends here)'], ['gold', 'chosen line: predicted ↔ measured']]);
        v.readout(() => {
          const { R, tU, lamU } = st; if (!R) return '';
          const meas = tU - 3 < BALMER_AIR.length ? BALMER_AIR[tU - 3] * nAir(BALMER_AIR[tU - 3]) : null;
          const a0 = (C.hbar ** 2 * 4 * Math.PI * C.eps0) / (C.me * C.e ** 2), d = 2 * a0 * tU * tU * 100;
          const m13 = BOHR.e / BOHR.em, R13 = (2 * Math.PI ** 2 * m13 * BOHR.e ** 4) / BOHR.h ** 3;
          return `Rydberg frequency $2\\pi^2me^4/h^3$: with Bohr's 1913 constants ${v.fix(R13 / 1e15, 3)}×10¹⁵ s⁻¹ (he wrote 3.1×10¹⁵), observed then 3.290×10¹⁵; today $cR_\\infty$ = ${v.fix((C.c * C.Ry) / 1e15, 5)}×10¹⁵ s⁻¹, for hydrogen ${v.fix((C.c * C.Ry) / (1 + C.me / C.mp) / 1e15, 5)}×10¹⁵ · in use now: ${v.fix(R / 1e15, 4)}×10¹⁵, ionisation energy ${v.fix((C.h * R) / C.e, 3)} eV (Bohr: 13 V) · line τ = ${tU} → 2: predicted ${v.fix(lamU, 3)} nm${meas ? `, measured ${v.fix(meas, 3)} nm in vacuum (${v.fix(BALMER_AIR[tU - 3], 3)} in air), difference ${v.fix(((lamU - meas) / meas) * 100, 3)}%` : ''} · orbit diameter for τ = ${tU}: $${v.sci(d, 2)}$ cm (Bohr: 1.6×10⁻⁶ cm for τ = 12, 1.2×10⁻⁵ cm for τ = 33)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.17
    {
      num: '1.17',
      kind: 'Paper',
      name: 'Recherches sur la théorie des quanta',
      paper: { authors: 'Louis de Broglie', year: 1925, title: 'Recherches sur la théorie des quanta', venue: 'Annales de Physique (10e série) 3: 22–128', doi: '10.1051/anphys/192510030022' },
      introduces: ['qm-1.9'],
      credit: 'Louis de Broglie, thesis defended 25 November 1924',
      statement: String.raw`De Broglie's doctoral thesis proposed that the wave–particle duality Einstein had found for light holds for all matter: a particle of energy $E$ and momentum $p$ is accompanied by a **phase wave** of frequency $\nu = E/h$ and wavelength
$$\lambda = \frac hp ,$$
whose phase velocity $c^2/v$ exceeds $c$ while its group velocity equals the particle's velocity $v$. Applied to an electron in a closed orbit, the phase wave must be "in tune" with itself after a revolution: the orbit's length must hold a whole number of wavelengths, $2\pi r = n\lambda$ — which is exactly Bohr's quantum condition $pr = nh/2\pi$ (and the Sommerfeld condition $\oint p\,dq = nh$ for other orbits). He predicted that electrons should therefore show diffraction. Davisson and Germer (1927) found it: 54-volt electrons reflected from a nickel crystal emerge in a sharp beam at $50^\circ$, where the rows of surface atoms, $2.15$ Å apart, act as a grating for $\lambda = 2.15\sin50^\circ = 1.65$ Å, against $h/p = 1.67$ Å. Scope: $\lambda = h/p$ holds for every particle (electrons, neutrons, atoms, molecules); the circular-orbit picture is heuristic, replaced by Schrödinger's standing waves in three dimensions.`,
      idea: String.raw`In 1923–24 the photon had become concrete (Compton scattering), and Bohr's quantum condition remained an unexplained rule. De Broglie, starting from special relativity, asked how a particle's internal "clock" of frequency $mc^2/h$ could stay in phase with a wave as it moves; requiring the phases to agree gave the phase wave with $\lambda = h/p$, and with it Bohr's orbits as resonances, like the modes of a vibrating string. His examiners were uncertain; Langevin sent the thesis to Einstein, who called it "the first feeble ray of light on this worst of our physical riddles" and drew Schrödinger's attention to it, leading directly to wave mechanics in 1926. Electron diffraction was confirmed by Davisson and Germer at Bell Labs and by G. P. Thomson in Aberdeen in 1927 (qm-1.10); de Broglie received the Nobel Prize in 1929.`,
      caption: String.raw`An electron wave on a circular Coulomb orbit, drawn as a ripple around the circle over several revolutions (later laps fainter). **Drag the gold point** on the right (or click the curve) to change the orbit radius: the number of wavelengths that fit, $2\pi r/\lambda = \sqrt{r/a_0}$, changes continuously, and only at Bohr's radii $n^2a_0$ do successive laps fall on top of each other; otherwise they spread out and cancel. Right: the amplitude left after many laps against the number of wavelengths per orbit — sharp resonances at the whole numbers, Bohr's stationary states. The readout checks $\lambda=h/p$ against Davisson and Germer's 1927 measurement.`,
      deps: ['qm-1.3', 'qm-1.7', 'rel-4.2', 'qm-1.15'],
      refs: [],
      tags: ['matter waves', 'de Broglie', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Matter_wave' },
      viz(v) {
        const M = v.M, C = M.CONST, LAPS = 8;
        const W = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 370, weight: 1, minWidth: 280, title: 'phase wave around the orbit' });
        const R = v.stage({ x: [0.5, 6.5], y: [0, 1.16], axes: 'box', height: 370, weight: 1.15, minWidth: 300, title: `amplitude after ${LAPS} revolutions against $2\\pi r/\\lambda$` });
        const nlaps = v.slider('revolutions superposed', 1, 30, LAPS, { int: true });
        // radius handle on the right panel's axis: n = √(r/a0)
        const amp = (n, K) => { let re = 0, im = 0; for (let k = 0; k < K; k++) { re += Math.cos(2 * Math.PI * n * k); im += Math.sin(2 * Math.PI * n * k); } return Math.hypot(re, im) / K; };
        const h = R.handle(2.6, amp(2.6, LAPS), { color: 'gold', label: 'r', constrain: (x) => { const n = M.clamp(x, 0.7, 6.3); return [n, amp(n, nlaps.value)]; } });
        R.onClick((x) => { const n = M.clamp(x, 0.7, 6.3); h.set(n, amp(n, nlaps.value)); });
        let st = {};
        v.render(() => {
          const n = h.x, K = nlaps.value, r = n * n; // r in units of a0
          R.setTitle(`amplitude after ${K} revolution${K > 1 ? 's' : ''} against $2\\pi r/\\lambda$`);
          h.y = amp(n, K);
          // left: the orbit, unit circle; ripple amplitude scaled for visibility
          W.circle(0, 0, 1, { color: 'faint', width: 1 });
          W.dot(0, 0, { r: 5, color: 'red', label: 'p⁺', labelPos: 's' });
          const A = 0.18;
          for (let k = K - 1; k >= 0; k--) {
            W.curve((th) => { const rr = 1 + A * Math.sin(n * (th + 2 * Math.PI * k)); return [rr * Math.cos(th), rr * Math.sin(th)]; }, 0, 2 * Math.PI, { color: k === 0 ? 'accent' : 'purple', width: k === 0 ? 2.4 : 1.2, alpha: k === 0 ? 1 : Math.max(0.12, 0.6 - 0.05 * k), n: 400 });
          }
          W.curve((th) => { const s = Array.from({ length: K }, (_, k) => Math.sin(n * (th + 2 * Math.PI * k))).reduce((a, b) => a + b, 0) / K; const rr = 1 + A * s; return [rr * Math.cos(th), rr * Math.sin(th)]; }, 0, 2 * Math.PI, { color: 'green', width: 2.2, n: 400 });
          const gap = n - Math.round(n);
          W.text(`2πr/λ = ${v.fix(n, 3)}${Math.abs(gap) < 0.01 ? ' — closes on itself' : ` — misses by ${v.fix(gap * 360, 0)}° each lap`}`, 0, -1.3, { align: 'center', size: 11.5, color: Math.abs(gap) < 0.01 ? 'green' : 'red', weight: 600 });
          // right: resonance curve
          R.fn((x) => amp(x, K), { domain: [0.5, 6.5], n: 1200, color: 'accent', width: 2 });
          for (let j = 1; j <= 6; j++) { R.vline(j, { color: 'green', dash: [3, 4], width: 1 }); R.text(`n = ${j}`, j, 1.09, { align: 'center', size: 11, color: 'green', weight: 600 }); }
          st = { n, r, K };
        });
        v.legend([['accent', 'first revolution'], ['purple', 'later revolutions'], ['green', 'their sum / Bohr’s orbits'], ['gold', 'your radius', { dot: true }]]);
        v.readout(() => {
          const { n, r } = st; if (!n) return '';
          const a0 = (C.hbar ** 2 * 4 * Math.PI * C.eps0) / (C.me * C.e ** 2), rm = r * a0;
          const p = Math.sqrt((C.me * C.e ** 2) / (4 * Math.PI * C.eps0 * rm)), lam = C.h / p;
          const V = 54, lamDG = C.h / Math.sqrt(2 * C.me * C.e * V), lamRel = C.h / Math.sqrt(2 * C.me * C.e * V * (1 + (C.e * V) / (2 * C.me * C.c ** 2)));
          return `orbit radius $r$ = ${v.fix(r, 3)} $a_0$ = ${v.fix(rm * 1e10, 3)} Å: Coulomb speed $p/m$ = ${v.fix(p / C.me / 1e6, 3)}×10⁶ m/s, $\\lambda = h/p$ = ${v.fix(lam * 1e10, 3)} Å, circumference/λ = ${v.fix((2 * Math.PI * rm) / lam, 4)} = $\\sqrt{r/a_0}$${Math.abs(n - Math.round(n)) < 0.01 ? ` — Bohr orbit $n$ = ${Math.round(n)}, $r = n^2a_0$, energy ${v.fix(-13.606 / Math.round(n) ** 2, 3)} eV` : ''} · Davisson & Germer 1927: 54 V electrons, beam at colatitude 50°, row spacing 2.15 Å → $\\lambda = 2.15\\sin 50^\\circ$ = ${v.fix(2.15 * Math.sin((50 * Math.PI) / 180), 3)} Å; de Broglie $h/\\sqrt{2meV}$ = ${v.fix(lamDG * 1e10, 3)} Å (their $(150/V)^{1/2}$ = ${v.fix(Math.sqrt(150 / 54), 3)} Å; relativistic correction ${v.fix(((lamDG - lamRel) / lamDG) * 1e6, 0)} ppm) — agreement to ${v.fix(Math.abs(2.15 * Math.sin((50 * Math.PI) / 180) - lamDG * 1e10) / (lamDG * 1e10) * 100, 1)}%`;
        });
      },
    },
  ],
};
