// Astrophysics & Celestial Mechanics — Chapter 4 (part b): items 4.7–4.12
import {
  clamp, memo, sci, EV, K_B, T_SUN,
  planckL, bbColor, eLevel, ionFrac, CLASSES,
} from './ch04.shared.js';

import { AUDIT_LINES, lineOpacity, slabSpectrum, visiblePlanckMaximum, neutralLevels, sahaGroundRatio, hydrogenLTE } from './source-audit-stellar-atmospheres.shared.js';

import { balmerModel, balmerPeak, maximizePositive, MODEL_STARS, radiusFromTL, radiusSegment, EKER_MLR, ekerLogLuminosity, ekerSegment, fuelTimeProxy, windowRegression, clipLine } from './source-audit-stellar-models.shared.js';

const sup = (k) => String(k).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

export default {
  collection: 'astro',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Law',
      name: 'Kirchhoff’s laws of spectroscopy',
      statement: String.raw`(1) An optically thick thermal emitter approaches a **continuous blackbody spectrum**. (2) An optically thin excited gas can show **emission lines**, as well as continuum processes absent from this toy. (3) A continuous background seen through a cooler absorbing gas can show **absorption lines** at the same atomic transition wavelengths. In terms of the transfer of radiation through a slab of optical depth $\tau_\lambda$ and source function $B_\lambda(T_g)$ (the gas being in thermal equilibrium at temperature $T_g$), a background of intensity $B_\lambda(T_s)$ emerges as
$$\begin{gathered}I_\lambda =\\ B_\lambda(T_s)\,e^{-\tau_\lambda}\\ + B_\lambda(T_g)\bigl(1 - e^{-\tau_\lambda}\bigr),\end{gathered}$$
so lines appear in absorption if $T_g<T_s$, in emission if $T_g>T_s$, and vanish if $T_g=T_s$.`,
      idea: String.raw`Kirchhoff's law of thermal radiation (thermo 9.1) says a gas that absorbs strongly at a wavelength emits strongly there, in the ratio $B_\lambda(T)$; the absorption of the cooler gas takes light of the background away at those wavelengths and replaces it by less than it took (its own, cooler, emission). The transfer equation $dI_\lambda/d\tau=-I_\lambda+B_\lambda(T_g)$ has this solution when the source function is constant along the ray. A star's photosphere is the case of law 3: the cooler outer layers sit on the hotter deeper ones.

The integrating-factor theorem ode-1.4 solves the transfer equation in optical-depth coordinates. Multiplication by $e^\tau$ makes the derivative of $e^\tau I$ equal to $e^\tau B$; for a constant source B and incident intensity I_0 this gives $I(\tau)=I_0e^{-\tau}+B(1-e^{-\tau})$. The two terms are therefore a boundary contribution and emitted replacement light, under the homogeneous no-scattering assumptions, not two independent fitted spectral laws.`,
      caption: String.raw`Three rows: the continuous **source** at $T_s$, the same source **seen through the gas**, and the **gas alone** against a dark sky. The gas has hydrogen Balmer lines and the sodium D doublet (rounded air wavelengths checked against NIST; line strengths, widths and their temperature independence are invented). With $T_g<T_s$ the middle row has dark lines exactly where the bottom row has bright ones; raise $T_g$ above $T_s$ and the lines in the middle row turn to emission; at $T_g=T_s$ they disappear. Zero optical depth makes the slab transparent at every gas temperature.`,
      scope: String.raw`Gas in local thermodynamic equilibrium at one temperature $T_g$, a single homogeneous slab, no scattering. Optical depth is along the chosen ray, and is prescribed independently of the temperatures. No continuum opacity is included in the gas. Real stellar layers have gradients, scattering and non-LTE populations; density alone does not guarantee a continuum, nor does optically thin gas emit only lines. The spectral strip uses illustrative display colours and a common intensity normalization.`,
      deps: ['astro-4.4', 'thermo-9.1', 'ode-1.4'],
      refs: ['Princeton AST403, Transfer of Radiation, p.1 Eq.(tr.4), integrated for a constant-source slab', 'NIST Atomic Spectra Handbook, hydrogen strong lines and sodiumI persistent lines (air wavelengths)'],
      tags: ['spectra', 'spectral lines', 'Kirchhoff'],
      viz(v) {
        const Ts = v.slider('source temperature $T_s$ (K)', 3000, 10000, 5500, { step: 50, fmt: (x) => v.fix(x, 0) });
        const Tg = v.slider('gas temperature $T_g$ (K)', 2000, 12000, 3500, { step: 50, fmt: (x) => v.fix(x, 0) });
        const t0 = v.slider('line strength $\\tau_0$', 0, 8, 2, { step: .01 });
        const LINES = AUDIT_LINES, tau = nm => lineOpacity(nm, t0.value);
        const norm = () => Math.max(visiblePlanckMaximum(Ts.value), visiblePlanckMaximum(Tg.value));
        const I = (row,nm) => slabSpectrum(row,nm,Ts.value,Tg.value,t0.value);
        v.button('equal temperatures', () => Tg.set(Ts.value));
        const strip = v.stage({ x: [300, 700], y: [0, 3.4], axes: false, height: 250, full: true, title: 'what a spectroscope shows' });
        const plot = v.stage({ x: [380, 700], y: [0, 1.15], axes: 'box', gutter: true, height: 270, full: true, xlabel: 'wavelength (nm)', ylabel: 'intensity (relative)', title: 'intensity along the three rows' });
        v.legend([['ink', 'source alone'], ['orange', 'seen through the gas'], ['green', 'gas alone']]);
        v.render(() => {
          const N = norm(), key = `${Ts.value}|${Tg.value}|${t0.value}`;
          strip.raster((nm, y) => {
            if (nm < 380 || y > 3) return null;
            const row = y < 1 ? 2 : y < 2 ? 1 : 0;
            if (Math.abs(y - 1) < 0.03 || Math.abs(y - 2) < 0.03) return [20, 20, 22];
            const val = Math.pow(clamp(I(row, nm) / N, 0, 1.2), 0.55), c = v.M.wavelengthRGB(nm, 0.8);
            return [Math.min(255, c[0] * val), Math.min(255, c[1] * val), Math.min(255, c[2] * val)];
          }, { res: 2, key });
          strip.text('source alone', 376, 2.5, { color: 'ink', size: 11, align: 'right' });
          strip.text('through the gas', 376, 1.5, { color: 'ink', size: 11, align: 'right' });
          strip.text('gas alone', 376, 0.5, { color: 'ink', size: 11, align: 'right' });
          for (const [l, , nm] of LINES) if (nm) strip.text(nm, l, 3.2, { color: 'ink', size: 10.5, align: 'center' });
          plot.fn((nm) => I(0, nm) / N, { color: 'ink', width: 1.8, n: 700 });
          plot.fn((nm) => I(1, nm) / N, { color: 'orange', width: 2, n: 700 });
          plot.fn((nm) => I(2, nm) / N, { color: 'green', width: 2, n: 700 });
        });
        v.readout(() => {
          const a = Math.exp(-tau(656.28)), d = I(1, 656.28) - I(0, 656.28);
          const kind = t0.value === 0 ? 'transparent slab: no spectral lines' : Tg.value === Ts.value ? 'no lines: the gas is at the source temperature' : Tg.value < Ts.value ? 'absorption lines: the gas is cooler than the source' : 'emission lines: the gas is hotter than the source';
          return `at Hα (656 nm) the gas transmits $e^{-\\tau} = ${v.fix(a, 2)}$ of the source, and the line changes the intensity by ${d >= 0 ? '+' : '−'}${v.fix(Math.abs(d) / I(0, 656.28) * 100, 0)} %  →  ${kind}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Law',
      name: 'Boltzmann excitation equation',
      statement: String.raw`For atoms in thermal equilibrium at temperature $T$, the numbers of atoms in two bound states $b$ and $a$ of energies $E_b>E_a$ and statistical weights (degeneracies) $g_b,g_a$ obey
$$\frac{N_b}{N_a} = \frac{g_b}{g_a}\,e^{-(E_b-E_a)/kT}.$$
For hydrogen, $g_n = 2n^2$ and $E_n = -13.6\ \text{eV}/n^2$, so $N_2/N_1 = 4\,e^{-10.2\ \text{eV}/kT}$. This ratio is utterly negligible at the Sun's $5772$ K ($\sim 5\times10^{-9}$) and is still only $\sim3\times10^{-5}$ at $10^4$ K, where $kT\approx 0.9$ eV is still far below the $10.2$ eV needed to reach $n=2$.`,
      idea: String.raw`The Boltzmann distribution (thermo 6.1) gives each microstate the probability $\propto e^{-E/kT}$; a level with $g$ states therefore carries $g\,e^{-E/kT}$ of it. The hydrogen spectrum (qm 8.9) supplies the energies. The consequence for stellar spectra is sharp: the Balmer lines are absorption lines *from $n=2$*, so a star needs enough atoms in $n=2$ to show them, yet in the Sun there is one such atom per $\sim\!10^{8}$ ground-state atoms, and the Sun's Balmer lines are nonetheless clearly visible: that tension is resolved by the sheer number of hydrogen atoms in the photosphere. The competing effect, ionization, is the next item.`,
      caption: String.raw`Left: the fraction of hydrogen in $n=2$ against temperature (log scales); drag the handle to choose $T$. Blue: $N_2/N_1$ from the equation; orange: $N_2$ as a share of the retained neutral levels. Change the **highest retained level** to see the partition-cutoff dependence, especially at high temperature. Switch off the degeneracy factors for a counterfactual unit-weight comparison (the physical hydrogen ratio has a factor4). Right: populations of the first levels at the chosen temperature.`,
      scope: String.raw`Thermal (LTE) populations of isolated hydrogen atoms; the partition function is truncated at an explicit chosen highest level. The infinite isolated-atom partition diverges; a real plasma needs environment-dependent level dissolution. At the high temperatures shown, the chosen cutoff can matter greatly and the toy does not derive a physical cutoff. Fine/hyperfine structure and interactions are ignored. Populations of the neutral atoms only: ionization is item 4.9.`,
      deps: ['astro-4.7', 'qm-8.9', 'thermo-6.1'],
      refs: ['Princeton AST403, Ionization/Saha Equation, p.1 Eq.(i.1)', 'Hydrogenic degeneracy count and explicit finite partition sum in verification report', 'NIST Atomic Spectra Handbook, hydrogen ionization threshold'],
      tags: ['Boltzmann', 'excitation', 'hydrogen'],
      viz(v) {
        const gOn = v.toggle('include statistical weights $g_n = 2n^2$', true);
        const nmax = v.slider('highest retained level $n_\\mathrm{max}$', 8,80,10,{step:1});
        const A = v.stage({ x: [3000, 40000], y: [1e-18, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'temperature (K)', ylabel: 'ratio / fraction within neutral hydrogen', title: 'how many atoms are in n = 2?' });
        const B = v.stage({ x: [0.4, 8.6], y: [1e-14, 3], ylog: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'level n', ylabel: 'fraction of neutral atoms', title: 'populations at the chosen T', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const hT = A.handle(9000, 1e-4, { color: 'accent', r: 7.5, constrain: (x) => { const T = clamp(x, 3000, 40000); return [T, fr2(T)]; } });
        const levels = T => neutralLevels(T,nmax.value,gOn.value);
        const fr2 = T => levels(T).fractions[1], r21 = T => levels(T).ratio21;
        v.render(() => {
          A.fn(r21, { color: 'blue', width: 2.2, n: 300 });
          A.fn(fr2, { color: 'orange', width: 2.2, n: 300 });
          const T = hT.x; hT.set(T, fr2(T));
          A.dot(T_SUN, r21(T_SUN), { r: 4.5, color: 'gold', label: '5772K reference', labelPos: 'se' });
          A.vline(T, { color: 'faint', dash: [3, 4], width: 1 });
          const D = levels(T), z = D.weights, Z = D.Z;
          B.setView([.4,8.6],[Math.min(1e-14,...D.fractions.slice(0,8))*.5,1.1]);
          for (let n = 1; n <= 8; n++) { const f = z[n - 1] / Z; B.rect(n - 0.32, B.bounds.y[0], n + 0.32, f, { color: n === 2 ? 'orange' : 'accent', fill: n === 2 ? 'orange' : 'accent', fillAlpha: 0.45, width: 1.2 }); }
          B.corner(`T = ${v.fix(T, 0)} K`, 'tr', { color: 'ink', weight: 600 });
        });
        v.legend([['blue', 'N₂ / N₁'], ['orange', 'N₂ / (all neutral atoms)']]);
        v.readout(() => {
          const T = hT.x, kT = K_B * T / EV;
          return `$kT = ${v.fix(kT, 3)}$ eV,  $E_2 - E_1 = ${v.fix(eLevel(2), 2)}$ eV  →  $N_2/N_1 = ${gOn.value ? '4' : '1'}\\,e^{-${v.fix(eLevel(2) / kT, 1)}} = ${v.sci(r21(T), 3)}$\nshare within retained neutral levels, $n_{\\max}=${nmax.value}$: $${v.sci(fr2(T), 3)}$`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Law',
      name: 'Saha ionization equation',
      statement: String.raw`In thermal equilibrium, the ratio of the number densities of an atom in successive ionization stages $i$ and $i+1$ (ionization energy $\chi_i$) is
$$\begin{gathered}\frac{N_{i+1}}{N_i}\,n_e =\\ \frac{2 U_{i+1}(T)}{U_i(T)}\left(\tfrac{2\pi m_e kT}{h^2}\right)^{3/2} e^{-\chi_i/kT},\end{gathered}$$
where $U_i(T)$ are the internal partition functions relative to each ionic ground state (replace them by ground-state degeneracies only when that approximation applies), and $n_e$ is the free-electron density, equivalently an electron pressure $P_e = n_e kT$. For the displayed ground-state-only hydrogen approximation ($U_{\rm II}=1$, $U_{\rm I}=2$) the ionized fraction is $x = R/(1+R)$ with $R = N_{\rm II}/N_{\rm I}=(2\pi m_e/h^2)^{3/2}(kT)^{5/2}\allowbreak e^{-13.6\,{\rm eV}/kT}/P_e$. It switches from nearly $0$ to nearly $1$ over a narrow range of temperature (a few thousand K), and the switch moves to *lower* $T$ when the electron pressure is lower.`,
      idea: String.raw`Treat ionization $\text{atom} \rightleftharpoons \text{ion}^+ + e^-$ as an equilibrium between states of the atom plus a free electron: the Boltzmann factor $e^{-\chi/kT}$ of 4.8 times the number of free-electron states per volume, $2(2\pi m_e kT/h^2)^{3/2}$, which is the grand-canonical (thermo 8.1) counting of a gas of electrons. The $n_e$ on the left is why a rarefied atmosphere (small $P_e$) ionizes at lower $T$: the electrons have more room, so recombination is less likely. The thermostat is the exponential: a few thousand K changes $e^{-\chi/kT}$ by a factor $\sim 10^4$.

At fixed positive electron pressure in the displayed ground-state model, the logarithmic derivative of the Saha ratio is $d\log R/dT=5/(2T)+\chi/(k_BT^2)>0$. The derivative-sign proof pma-5.11 therefore makes R strictly increasing, and so is the fraction $R/(1+R)$. Lowering the imposed pressure multiplies R upward and moves any fixed ionization-fraction threshold to lower temperature. Allowing electron pressure to vary with ionization changes this argument.`,
      caption: String.raw`Drag the handle along the ionized-fraction curve, and change the **electron pressure** (an imposed model parameter, not a computed stellar atmosphere). Faint curves: $100\times$ larger and smaller $P_e$. Right: the ratio $N_{\rm II}/N_{\rm I}$ on a log axis, exposing the exponential.`,
      scope: String.raw`Pure hydrogen in LTE, one electron pressure for all temperatures (in reality $P_e$ rises with ionization), ground-state partition functions only, classical nondegenerate electrons, no pressure ionization or Coulomb corrections. At fixed imposed $P_e$, a neutral pure-hydrogen density is inferred from charge neutrality; this can be unphysically large for some input combinations, which are labelled formal estimates.`,
      deps: ['astro-4.8', 'thermo-8.1', 'pma-5.11'],
      refs: ['Princeton AST403, Ionization/Saha Equation, complete p.1 phase-space derivation Eqs.(i.1)–(i.4)', 'NIST hydrogen ionization threshold; general partition-function extension in verification report'],
      tags: ['Saha', 'ionization', 'plasma'],
            links: { notes: 'https://www.astro.princeton.edu/~gk/A403/ioniz.pdf' },
      viz(v) {
        const Pe = v.slider('electron pressure $P_e$ (N/m²)', 0.05, 2000, 20, { log: true, sig: 2 });
        const A = v.stage({ x: [4000, 26000], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: 'temperature (K)', ylabel: 'ionized fraction of hydrogen', title: 'the switch from neutral to ionized' });
        const B = v.stage({ x: [4000, 26000], y: [1e-8, 1e8], ylog: true, axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: 'temperature (K)', ylabel: 'N(H⁺) / N(H)', title: 'the ratio on a log axis' });
        const hT = A.handle(9500, 0.5, { color: 'accent', r: 7.5, constrain: (x) => { const T = clamp(x, 4000, 25000); return [T, ionFrac(T, Pe.value)]; } });
        const Thalf = (P) => v.M.bisect((T) => ionFrac(T, P) - 0.5, 3000, 40000, 0.5);
        v.render(() => {
          A.fn((T) => ionFrac(T, Pe.value * 100), { color: 'faint', width: 1.2, dash: [4, 4] });
          A.fn((T) => ionFrac(T, Pe.value / 100), { color: 'faint', width: 1.2, dash: [4, 4] });
          A.fn((T) => ionFrac(T, Pe.value), { color: 'accent', width: 2.6, n: 300 });
          A.hline(0.5, { color: 'faint', width: 1, dash: [2, 4] });
          const T = hT.x; hT.set(T, ionFrac(T, Pe.value));
          A.vline(Thalf(Pe.value), { color: 'green', width: 1.2, dash: [4, 4] });
          B.setView([4000,26000],[sahaGroundRatio(4000,Pe.value)*.5,sahaGroundRatio(26000,Pe.value)*2]);
          B.fn((t) => sahaGroundRatio(t, Pe.value), { color: 'accent', width: 2.2, n: 300 });
          B.hline(1, { color: 'faint', width: 1, dash: [2, 4] });
          B.dot(T, sahaGroundRatio(T, Pe.value), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const T = hT.x, R = sahaGroundRatio(T, Pe.value), D = hydrogenLTE(T,Pe.value,1);
          return `$T = ${v.fix(T, 0)}$ K: $N_{\\rm II}/N_{\\rm I} = ${v.sci(R, 3)}$  →  ionized fraction **${v.fix(100 * ionFrac(T, Pe.value), 1)} %**\n50 % ionized at $T_{1/2} = ${v.fix(Thalf(Pe.value), 0)}$ K (green) for $P_e = ${v.fmt(Pe.value, 3)}$ N/m²; fraction ionized goes from 10 % to 90 % in ${v.fix(v.M.bisect((t) => ionFrac(t, Pe.value) - 0.9, 3000, 60000, 0.5) - v.M.bisect((t) => ionFrac(t, Pe.value) - 0.1, 3000, 60000, 0.5), 0)} K` + ` · implied pure-hydrogen number density $${v.sci(D.nH,2)}$ m⁻³ (mean spacing $${v.sci(D.spacingNm,2)}$ nm)` + (D.spacingNm < 1 ? ' · closely packed atoms: isolated-atom ideal-gas assumptions may fail; formal estimate only' : '') + ' · ground-state partition approximation; no pressure-ionization calculation';
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'The spectral sequence explained',
      statement: String.raw`The familiar stellar spectral sequence O, B, A, F, G, K, M broadly runs from hotter to cooler stars. **MK classes are defined by comparison with standard spectra**, with luminosity class and chemical peculiarities providing further information; temperature alone does not assign a complete type. Excitation and ionization help explain the sequence: an absorption transition needs atoms in its lower state. For hydrogen Balmer absorption this is $n=2$, with absorber fraction
$$\frac{N_{n=2}}{N_{\rm H}}=\frac{N_{\rm H^0}}{N_{\rm H}}\frac{N_{n=2}}{N_{\rm H^0}}.$$
Very cold hydrogen has almost no excited atoms; sufficiently hot hydrogen is strongly ionized. An intermediate-temperature maximum results in the specified LTE model. This population is a **proxy for available absorbers**, not an equivalent width or measured line intensity.`,
      idea: String.raw`Use the same finite neutral partition in both equations. Write $w_n=n^2e^{-E_n/kT}$, $Z=\sum_{n=1}^{10}w_n$, and let $R_0$ be the ground-state Saha ratio from 4.9. Then $N_{\rm II}/N_{\rm I}=R_0/Z$, the neutral fraction is $Z/(Z+R_0)$, and the total hydrogen fraction in $n=2$ is $w_2/(Z+R_0)$. Mixing a ground-only Saha ratio with an excited-level neutral partition would be inconsistent. Actual spectral classification compares multiple features, not this single population.`,
      caption: String.raw`Left: neutral fraction (green), the neutral $n=2$ share scaled to its own maximum (orange), and total-hydrogen $n=2$ absorber fraction scaled to its own maximum (blue). Change imposed electron pressure and drag temperature. The seven coloured temperature bins are **schematic labels**, not a calibrated MK classifier. Right: the normalized population proxy at each bin's geometric midpoint; these bars are not spectra.`,
      scope: String.raw`Pure-hydrogen LTE toy with ten retained neutral levels and imposed electron pressure; the partition cutoff is not a physical plasma calculation. No abundance inference, continuum opacity, column depth, broadening or radiative transfer is included. The maximum depends on pressure and this model, and is not asserted to equal a universal observed A0 temperature. Metal abundance, gravity, rotation and atmosphere structure also affect real spectra.`,
      deps: ['astro-4.9', 'astro-4.6'],
      refs: ['Gray–Corbally2009, Stellar Spectral Classification, complete §1.3 pp17–28', 'Princeton AST403, Ionization/Saha Equation, p1 Eqs.(i.1)–(i.4); finite-partition derivation in verification report'],
      tags: ['spectral types', 'Saha', 'Boltzmann'],
      viz(v) {
        const Pe = v.slider('electron pressure $P_e$ (N/m²)', 0.5, 2000, 20, { log: true, sig: 2 });
        const A = v.stage({ x: [3000, 40000], y: [0, 1.25], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'temperature (K)', ylabel: 'relative', title: 'neutral × excited = absorber population' });
        const B = v.stage({ x: [-1, 1], y: [0, 1], axes: false, height: 340, weight: 0.7, title: 'schematic-bin population proxy' });
        const neutral = T => balmerModel(T,Pe.value).neutral;
        const exc = T => balmerModel(T,Pe.value).fractions[1];
        const raw = T => balmerModel(T,Pe.value).n2total;
        const excMax = maximizePositive(exc,3000,40000)[1];
        const cache = memo();
        const peak = () => cache(Pe.value, () => balmerPeak(Pe.value));
        const hT = A.handle(9500, 0.9, { color: 'accent', r: 7.5, constrain: (x) => { const T = clamp(x, 3000, 40000); return [T, raw(T) / peak()[1]]; } });
        v.render(() => {
          const [Tp, mx] = peak();
          CLASSES.forEach((c, i) => { A.vband(Math.max(c.lo, 3000), Math.min(c.hi, 40000), { color: i % 2 ? 'faint' : 'muted', alpha: 0.12 }); A.text(c.c, Math.sqrt(Math.max(c.lo, 3000) * Math.min(c.hi, 40000)), 1.18, { size: 13, color: 'ink', align: 'center', weight: 600 }); });
          A.fn(neutral, { color: 'green', width: 1.8, n: 300 });
          A.fn((T) => exc(T) / excMax, { color: 'orange', width: 1.8, n: 300 });
          A.fn((T) => raw(T) / mx, { color: 'blue', width: 3, n: 400 });
          A.vline(Tp, { color: 'blue', width: 1, dash: [4, 4] });
          const T = hT.x; hT.set(T, raw(T) / mx);
          // strip: class order O..M left to right
          const N = CLASSES.length;
          CLASSES.forEach((c, i) => {
            const Tm = Math.sqrt(Math.max(c.lo, 3000) * Math.min(c.hi,40000)), val = raw(Tm) / mx, x0 = -1 + (2 * i) / N, x1 = -1 + (2 * (i + 1)) / N;
            B.poly([[x0 + 0.03, 0.2], [x1 - 0.03, 0.2], [x1 - 0.03, 0.2 + 0.7 * val + 0.005], [x0 + 0.03, 0.2 + 0.7 * val + 0.005]], { fill: bbColor(v, Tm), fillAlpha: 1, color: 'faint', width: 1 });
            B.text(c.c, (x0 + x1) / 2, 0.1, { size: 13, align: 'center', color: 'ink', weight: 600 });
          });
        });
        v.legend([['green', 'neutral fraction'], ['orange', 'n = 2 share (scaled)'], ['blue', 'absorber proxy (scaled)']]);
        v.readout(() => {
          const T = hT.x, cl = CLASSES.find((c) => T >= c.lo && T < c.hi);
          return `$T = ${v.fix(T, 0)}$ K (schematic bin ${cl ? cl.c : '—'}): neutral fraction ${v.fix(neutral(T), 3)}, share in $n=2$ $${v.sci(exc(T), 2)}$, absorber proxy ${v.fix(100 * raw(T) / peak()[1], 0)} % of the maximum\nmaximum at $T = ${v.fix(peak()[0], 0)}$ K for $P_e = ${v.fmt(Pe.value, 3)}$ N/m² (model peak; no MK type inferred)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Hertzsprung–Russell diagram',
      statement: String.raw`The **Hertzsprung–Russell diagram** places stellar luminosity against effective temperature, conventionally increasing to the left. Colour–absolute-magnitude diagrams are observational relatives, requiring atmosphere, band and extinction calibrations to interpret physically. Real surveys reveal a main sequence, giant branches and a white-dwarf sequence; their appearance depends on age, composition and sample selection. For a spherical source with effective temperature,
$$L=4\pi R^2\sigma T_{\rm eff}^4,$$
so at fixed temperature, greater luminosity means greater radius. A point's radius does not by itself establish its evolutionary state.`,
      idea: String.raw`Distances and fluxes help determine luminosities; spectra and atmosphere models help infer effective temperatures. Placing them together exposes stellar-population structure. Gaia's original observational HR-diagram analysis explicitly filters astrometry/photometry and controls extinction; different selections reveal different populations. The present drawing instead isolates the geometry of the Stefan–Boltzmann relation using chosen model points.`,
      caption: String.raw`All points except the solar reference are **invented examples** at chosen temperatures and radii, arranged to suggest main-sequence, giant and white-dwarf regions. They are not a catalogue, a fitted evolutionary track or a frequency sample. Hover a point for its model radius. Drag the test point to read the radius implied by its $(T,L)$; the faint segments are constant radius.`,
      scope: String.raw`Synthetic illustration with a 5772 K, 1 solar-luminosity reference and the corresponding approximate solar-radius scale. No named-star measurements, population percentage, spectral-type calibration or automatic evolutionary classification is claimed. Effective temperature is defined through bolometric flux; real atmosphere spectra need not be blackbodies.`,
      deps: ['astro-4.5', 'astro-4.10'],
      refs: ['Gaia Collaboration2018, Observational Hertzsprung–Russell diagrams, §§1–2,4.1,4.3,5,8', 'Princeton AST403, Transfer of Radiation, Eq.(tr.26), p4'],
      tags: ['HR diagram', 'main sequence', 'stellar types'],
      viz(v) {
        const STARS = MODEL_STARS;
        const LX = (T) => -Math.log10(T);
        const s = v.stage({ x: [-4.65, -3.45], y: [-4.2, 6.2], axes: 'box', gutter: true, height: 440, full: true, hover: true, xlabel: 'effective temperature (K)', ylabel: 'luminosity (L☉)',
          xticks: [40000, 20000, 10000, 6000, 4000].map((T) => [LX(T), T.toLocaleString('en').replace(/,/g, ' ')]), yticks: [[-4, '10⁻⁴'], [-2, '0.01'], [0, '1'], [2, '100'], [4, '10⁴'], [6, '10⁶']] });
        const test = s.handle(LX(8000), 1, { color: 'accent', r: 8, constrain: { x: [-4.6, -3.5], y: [-4.1, 6.1] } });
        const ms = STARS.filter((a) => a[3] === 'ms').sort((a, b) => b[1] - a[1]);
        let st = {};
        v.render(() => {
          for (const R of [0.01, 0.1, 1, 10, 100, 1000]) {
            const seg=radiusSegment(R);if(!seg.length)continue;
            s.path(seg,{color:'faint',width:1,alpha:.8});
            const x=(seg[0][0]+seg[1][0])/2,y=(seg[0][1]+seg[1][1])/2;
            s.text(`${R} R☉`,x,y,{size:10,color:'muted',dy:-8,align:'center'});
          }
          s.path(ms.map((a) => [LX(a[1]), Math.log10(a[2])]), { color: 'accent', width: 1.5, dash: [6, 4], alpha: 0.6 });
          let near = null, bd = 1e9;
          const P = s.pointer;
          for (const a of STARS) {
            const px = s.X(LX(a[1])), py = s.Y(Math.log10(a[2])); let d = 1e9;
            if (P && P.inside) d = Math.hypot(s.X(P.x) - px, s.Y(P.y) - py);
            if (d < bd) { bd = d; near = a; }
            const rd = a[3] === 'sg' ? 7 : a[3] === 'g' ? 6 : 4.5;
            s.dot(LX(a[1]), Math.log10(a[2]), { r: rd + 1.8, color: 'ink', alpha: 0.6 });
            s.dot(LX(a[1]), Math.log10(a[2]), { r: rd, color: bbColor(v, a[1]) });
          }
          for (const a of STARS.filter(q=>['solar reference','model giant4','model WD3'].includes(q[0]))) s.text(a[0],LX(a[1]),Math.log10(a[2]),{dx:a[0]==='model giant4'?-10:10,dy:-9,size:10.5,color:'ink',align:a[0]==='model giant4'?'right':'left'});
          if (near && bd < 24) { s.dot(LX(near[1]), Math.log10(near[2]), { r: 11, hollow: true, color: 'gold', width: 2 }); st.hover = near; } else st.hover = null;
          const T = Math.pow(10, -test.x), L = Math.pow(10, test.y), R = Math.sqrt(L) * (T_SUN / T) ** 2;
          st.t = { T, L, R };
        });
        v.readout(() => {
          const h = st.hover, t = st.t, R = (a) => Math.sqrt(a[2]) * (T_SUN / a[1]) ** 2;
          return `test star: $T = ${v.fix(t.T, 0)}$ K, $L = ${sci(v, t.L, 2)}\\,L_\\odot$ → $R = ${v.fmt(t.R, 3)}\\,R_\\odot$ · geometry only; no evolutionary classification\n` + (h ? `${h[0]}: $T = ${h[1]}$ K, $L = ${sci(v, h[2], 2)}\\,L_\\odot$ → $R = ${v.fmt(R(h), 3)}\\,R_\\odot$` : 'hover a synthetic point to read its chosen model size');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Law',
      name: 'Mass–luminosity relation',
      statement: String.raw`Main-sequence luminosity rises strongly with mass, but a single power law does not fit all masses. An empirical calibration of 509 detached-binary components by Eker et al. (2018) uses
$$\begin{gathered}\log_{10}(L/L_\odot)=\\a\log_{10}(M/M_\odot)+b,\end{gathered}$$
with six mass domains: $$\begin{gathered}(a,b)=(2.028,-.976),\\(4.572,-.102),\\(5.743,-.007),\\(4.329,.010),\\(3.967,.093),\\(2.865,1.105)\end{gathered}$$ over boundaries $0.179,0.45,0.72,\allowbreak1.05,2.4,\allowbreak7,31\,M_\odot$. These are separate empirical fits, with scatter; their small boundary jumps are not physical luminosity discontinuities. A constant available-fuel fraction would give a fuel-time scaling $t\propto M/L$, rather than an exact stellar lifetime.`,
      idea: String.raw`Detached eclipsing spectroscopic binaries constrain masses and radii through orbital dynamics and eclipses. Eker et al. select main-sequence components and fit straight lines in log mass–log luminosity. Their Table 4 gives coefficients and scatter, rather than a universal law at fixed metallicity and age. If an available fuel budget is $f\epsilon Mc^2$ and luminosity is held constant, its exhaustion time is $f\epsilon Mc^2/L$. Actual fuel fractions, mixing, composition and luminosity evolution change the lifetime.

The displayed synthetic straight-line fit is a least-squares projection, using ladr-6.61. In the Euclidean space of selected log-luminosities, project onto the span of the constant vector and the selected log-masses. Orthogonality of the residual to both columns gives the intercept and slope formulas used by the fit; uniqueness of both coefficients needs nonconstant log-masses. This geometric minimization does not validate independent-error assumptions, a physical global power law, or the quoted observational calibration outside its domains.`,
      caption: String.raw`The 60 dots are **synthetic**, not the paper's observations: true masses log-uniform over 0.179–31solar masses, with independent Gaussian errors of 0.021 dex in log mass and 0.15 dex in log luminosity around the published fits. Those are chosen simulation scales, not bounded error bars. Drag either mass-window handle, including past the other. The fitted slope is ordinary least squares on selected noisy dots. Right: a fuel-time proxy proportional to M/L, normalized to 10 Gyr at one solar mass; no stellar-evolution calculation is performed.`,
      scope: String.raw`Eker2018's near-solar-neighbourhood Galactic-disc main-sequence sample; individual ages and compositions vary. Calibration is restricted to0.179–31solar masses. Six segments are drawn separately. The synthetic OLS standard error is conditional on its usual regression assumptions and does not account for noisy mass, selection, astrophysical model error or crossing several calibration segments. The lifetime proxy is a chosen scaling, not measured or predicted evolution.`,
      deps: ['astro-1.3', 'astro-1.4', 'astro-4.11', 'ladr-6.61'],
      refs: ['Eker etal.2018, Interrelated Main-Sequence Relations, §§2.2–3.1 and Table 4 p18', 'Princeton AST403, Stellar timescales, p2 Eq.(9); fuel-time scaling only'],
      tags: ['mass–luminosity', 'binaries', 'main sequence'],
      viz(v) {
        const r=v.rng(21),xmin=Math.log10(.179),xmax=Math.log10(31);
        const DATA=Array.from({length:60},()=>{const lm=r.uniform(xmin,xmax),M=10**lm;return{lm:lm+.021*r.normal(),ll:ekerLogLuminosity(M)+.15*r.normal()};});
        const xview=[Math.min(xmin,...DATA.map(p=>p.lm))-.07,Math.max(xmax,...DATA.map(p=>p.lm))+.07];
        const ymin=Math.min(-3.1,...DATA.map(p=>p.ll))-.35,ymax=Math.max(5.5,...DATA.map(p=>p.ll))+.35;
        const ticks=[[Math.log10(.179),'.179'],[0,'1'],[1,'10'],[xmax,'31']];
        const A=v.stage({x:xview,y:[ymin,ymax],axes:'box',gutter:true,height:350,weight:1.15,xlabel:'mass (M☉)',ylabel:'luminosity (L☉)',title:'synthetic sample; Eker2018 calibration',xticks:ticks});
        const T=v.stage({x:xview,y:[6,12.5],axes:'box',gutter:true,height:350,weight:.9,xlabel:'mass (M☉)',ylabel:'fuel-time proxy (yr)',title:'chosen proxy ∝ M / L',xticks:ticks,yticks:[[6,'10⁶'],[8,'10⁸'],[10,'10¹⁰'],[12,'10¹²']]});
        const yhandle=ymin+.15;
        const lo=A.handle(-.6,yhandle,{color:'blue',r:7,constrain:x=>[clamp(x,xmin,xmax),yhandle],label:'window1',labelPos:'ne'});
        const hi=A.handle(.3,yhandle,{color:'orange',r:7,constrain:x=>[clamp(x,xmin,xmax),yhandle],label:'window2',labelPos:'nw'});
        const show=v.toggle('show published calibration',true);let st={};
        v.render(()=>{
          const a=Math.min(lo.x,hi.x),b=Math.max(lo.x,hi.x);A.vband(a,b,{color:'accent',alpha:.06});
          for(const q of EKER_MLR){const x0=Math.log10(q.lo),x1=Math.log10(q.hi),l=x=>q.a*x+q.b;
            if(show.value)A.path([[x0,l(x0)],[x1,l(x1)]],{color:'green',width:2});
            T.path([[x0,10+x0+ekerLogLuminosity(1)-l(x0)],[x1,10+x1+ekerLogLuminosity(1)-l(x1)]],{color:'green',width:2.2});
          }
          for(const p of DATA)A.dot(p.lm,p.ll,{r:3.8,color:p.lm>=a&&p.lm<=b?'gold':'muted',alpha:p.lm>=a&&p.lm<=b?1:.7});
          A.dot(0,0,{r:5,color:'ink',label:'solar reference',labelPos:'se'});
          st=windowRegression(DATA,a,b);if(st.slope!==undefined){const seg=clipLine(a,st.predict(a),b,st.predict(b),...A.bounds.x,...A.bounds.y);if(seg.length)A.path(seg,{color:'accent',width:2.6});}
          st.mid=ekerSegment(10**((a+b)/2)).a;T.dot(0,10,{r:5,color:'ink',label:'chosen 10 Gyr reference',labelPos:'ne'});T.vband(a,b,{color:'accent',alpha:.06});
        });
        v.readout(()=> (st.slope===undefined?`${st.n} synthetic points in window: need at least 3 with nonzero mass spread.`:`${st.n} synthetic points: OLS slope $a=${v.fix(st.slope,2)}$, formal standard error $${v.fix(st.se,2)}$; calibration segment at window centre has exponent ${v.fix(st.mid,3)} (not a predicted multi-segment window slope).`) + `\nChosen fuel-time proxy: one solar mass 10 Gyr; $0.5M_\\odot$: $${v.sci(fuelTimeProxy(.5),2)}$ yr; $20M_\\odot$: $${v.sci(fuelTimeProxy(20),2)}$ yr. Fixed fuel fraction and luminosity assumed; not an evolutionary lifetime prediction.`);
      },
    },
  ],
};
