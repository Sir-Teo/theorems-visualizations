// Astrophysics & Celestial Mechanics — Chapter 4 (part b): items 4.7–4.12
import {
  clamp, memo, sci, EV, K_B, T_SUN,
  planckL, bbColor, eLevel, popFrac, sahaRatio, ionFrac, CLASSES, lumOfMass, mlSlope,
} from './ch04.shared.js';

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
      statement: String.raw`(1) A hot, dense body (or a dense gas) emits a **continuous spectrum**. (2) A hot, *thin* gas viewed against a darker background emits only **emission lines**, at wavelengths set by the atoms present. (3) A continuous source viewed through a cooler thin gas shows the continuum crossed by **absorption lines** at those same wavelengths. In terms of the transfer of radiation through a slab of optical depth $\tau_\lambda$ and source function $B_\lambda(T_g)$ (the gas being in thermal equilibrium at temperature $T_g$), a background of intensity $B_\lambda(T_s)$ emerges as
$$I_\lambda = B_\lambda(T_s)\,e^{-\tau_\lambda} + B_\lambda(T_g)\bigl(1 - e^{-\tau_\lambda}\bigr),$$
so lines appear in absorption if $T_g<T_s$, in emission if $T_g>T_s$, and vanish if $T_g=T_s$.`,
      idea: String.raw`Kirchhoff's law of thermal radiation (thermo 9.1) says a gas that absorbs strongly at a wavelength emits strongly there, in the ratio $B_\lambda(T)$; the absorption of the cooler gas takes light of the background away at those wavelengths and replaces it by less than it took (its own, cooler, emission). Qualitatively the three laws were found by Kirchhoff and Bunsen around 1859–60; the bright lines are the fingerprints that later identified the elements in the Sun and stars. A star's photosphere is the case of law 3: the cooler outer layers sit on the hotter deeper ones.`,
      caption: String.raw`Three rows: the continuous **source** at $T_s$, the same source **seen through the gas**, and the **gas alone** against a dark sky. The gas has hydrogen Balmer lines and the sodium D doublet (wavelengths real, line strengths and widths invented). With $T_g<T_s$ the middle row has dark lines exactly where the bottom row has bright ones; raise $T_g$ above $T_s$ and the lines in the middle row turn to emission; at $T_g=T_s$ they disappear.`,
      scope: String.raw`Gas in local thermodynamic equilibrium at one temperature $T_g$, a single homogeneous slab, no scattering. In real atmospheres $T$ varies with depth, which is why stellar lines are absorption lines (temperature falls outward) while the solar chromosphere and corona show emission lines (temperature rising outward).`,
      credit: 'Kirchhoff & Bunsen, 1859–60',
      deps: ['astro-4.4', 'thermo-9.1'],
      refs: ['Carroll–Ostlie §5.1'],
      tags: ['spectra', 'spectral lines', 'Kirchhoff'],
      verify: true,
      viz(v) {
        const Ts = v.slider('source temperature $T_s$ (K)', 3000, 10000, 5500, { step: 50, fmt: (x) => v.fix(x, 0) });
        const Tg = v.slider('gas temperature $T_g$ (K)', 2000, 12000, 3500, { step: 50, fmt: (x) => v.fix(x, 0) });
        const t0 = v.slider('line strength $\\tau_0$', 0.05, 8, 2, { log: true, sig: 2 });
        const LINES = [[656.28, 1, 'Hα'], [486.13, 0.6, 'Hβ'], [434.05, 0.4, 'Hγ'], [410.17, 0.3, 'Hδ'], [588.995, 0.9, 'Na D'], [589.592, 0.9, '']];
        const SIG = 1.1;
        const tau = (nm) => { let s = 0; for (const [l, w] of LINES) s += w * Math.exp(-0.5 * ((nm - l) / SIG) ** 2); return t0.value * s; };
        const norm = () => Math.max(planckL(560e-9, Ts.value), planckL(560e-9, Tg.value), planckL(500e-9, Ts.value));
        const I = (row, nm) => {
          const a = Math.exp(-tau(nm)), bs = planckL(nm * 1e-9, Ts.value), bg = planckL(nm * 1e-9, Tg.value);
          return row === 0 ? bs : row === 1 ? bs * a + bg * (1 - a) : bg * (1 - a);
        };
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
          const kind = Math.abs(Tg.value - Ts.value) < 25 ? 'no lines: the gas is at the source temperature' : Tg.value < Ts.value ? 'absorption lines: the gas is cooler than the source' : 'emission lines: the gas is hotter than the source';
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
For hydrogen, $g_n = 2n^2$ and $E_n = -13.6\ \text{eV}/n^2$, so $N_2/N_1 = 4\,e^{-10.2\ \text{eV}/kT}$. This ratio is utterly negligible at the Sun's $5772$ K ($\sim 5\times10^{-9}$) and approaches a few per cent only at $\sim\!10^4$ K, where $kT\approx 0.9$ eV is still far below the $10.2$ eV needed to reach $n=2$.`,
      idea: String.raw`The Boltzmann distribution (thermo 6.1) gives each microstate the probability $\propto e^{-E/kT}$; a level with $g$ states therefore carries $g\,e^{-E/kT}$ of it. The hydrogen spectrum (qm 8.9) supplies the energies. The consequence for stellar spectra is sharp: the Balmer lines are absorption lines *from $n=2$*, so a star needs enough atoms in $n=2$ to show them, yet in the Sun there is one such atom per $\sim\!10^{8}$ ground-state atoms, and the Sun's Balmer lines are nonetheless clearly visible: that tension is resolved by the sheer number of hydrogen atoms in the photosphere. The competing effect, ionization, is the next item.`,
      caption: String.raw`Left: the fraction of hydrogen in $n=2$ against temperature (log scales); drag the handle to choose $T$. Blue: $N_2/N_1$ from the equation; orange: $N_2$ as a share of all neutral atoms (levels up to $n=10$). Switch off the degeneracy factors to see what they contribute (a factor $4$). Right: populations of the first levels at the chosen temperature.`,
      scope: String.raw`Thermal (LTE) populations of isolated hydrogen atoms; the partition function is cut at $n=10$ (it diverges for a truly isolated atom; in a real plasma neighbours lower the cutoff), which matters little at these temperatures. Populations of the neutral atoms only: ionization is item 4.9.`,
      credit: 'Boltzmann, 1868 (the distribution); applied to stellar spectra by Saha and others, 1920s',
      deps: ['astro-4.7', 'qm-8.9', 'thermo-6.1'],
      refs: ['Carroll–Ostlie §8.1'],
      tags: ['Boltzmann', 'excitation', 'hydrogen'],
      verify: true,
      viz(v) {
        const gOn = v.toggle('include statistical weights $g_n = 2n^2$', true);
        const A = v.stage({ x: [3000, 40000], y: [1e-18, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'temperature (K)', ylabel: 'fraction of hydrogen in n = 2', title: 'how many atoms are in n = 2?' });
        const B = v.stage({ x: [0.4, 8.6], y: [1e-14, 3], ylog: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'level n', ylabel: 'fraction of neutral atoms', title: 'populations at the chosen T', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const hT = A.handle(9000, 1e-4, { color: 'accent', r: 7.5, constrain: (x) => { const T = clamp(x, 3000, 40000); return [T, fr2(T)]; } });
        const gw = (n) => (gOn.value ? n * n : 1);
        const w = (n, T) => gw(n) * Math.exp(-eLevel(n) * EV / (K_B * T));
        const fr2 = (T) => { let z = 0; for (let n = 1; n <= 10; n++) z += w(n, T); return w(2, T) / z; };
        const r21 = (T) => w(2, T);
        v.render(() => {
          A.fn(r21, { color: 'blue', width: 2.2, n: 300 });
          A.fn(fr2, { color: 'orange', width: 2.2, n: 300 });
          const T = hT.x; hT.set(T, fr2(T));
          A.dot(T_SUN, r21(T_SUN), { r: 4.5, color: 'gold', label: 'Sun’s photosphere', labelPos: 'se' });
          A.vline(T, { color: 'faint', dash: [3, 4], width: 1 });
          const z = []; for (let n = 1; n <= 10; n++) z.push(w(n, T));
          const Z = z.reduce((a, b) => a + b, 0);
          for (let n = 1; n <= 8; n++) { const f = Math.max(z[n - 1] / Z, 1e-14); B.rect(n - 0.32, 1e-14, n + 0.32, f, { color: n === 2 ? 'orange' : 'accent', fill: n === 2 ? 'orange' : 'accent', fillAlpha: 0.45, width: 1.2 }); }
          B.corner(`T = ${v.fix(T, 0)} K`, 'tr', { color: 'ink', weight: 600 });
        });
        v.legend([['blue', 'N₂ / N₁'], ['orange', 'N₂ / (all neutral atoms)']]);
        v.readout(() => {
          const T = hT.x, kT = K_B * T / EV;
          return `$kT = ${v.fix(kT, 3)}$ eV,  $E_2 - E_1 = ${v.fix(eLevel(2), 2)}$ eV  →  $N_2/N_1 = ${gOn.value ? '4' : '1'}\\,e^{-${v.fix(eLevel(2) / kT, 1)}} = ${v.sci(r21(T), 3)}$\nshare of atoms in $n=2$: $${v.sci(fr2(T), 3)}$`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Law',
      name: 'Saha ionization equation',
      statement: String.raw`In thermal equilibrium, the ratio of the number densities of an atom in successive ionization stages $i$ and $i+1$ (ionization energy $\chi_i$) is
$$\frac{N_{i+1}}{N_i}\,n_e = \frac{2 g_{i+1}}{g_i}\left(\frac{2\pi m_e kT}{h^2}\right)^{3/2} e^{-\chi_i/kT},$$
with $n_e$ the free-electron density, equivalently an electron pressure $P_e = n_e kT$. For pure hydrogen ($g_{\rm II}=1$, $g_{\rm I}=2$) the ionized fraction is $x = R/(1+R)$ with $R = N_{\rm II}/N_{\rm I}=(2\pi m_e/h^2)^{3/2}(kT)^{5/2}e^{-13.6\,{\rm eV}/kT}/P_e$. It switches from nearly $0$ to nearly $1$ over a narrow range of temperature (a few thousand K), and the switch moves to *lower* $T$ when the electron pressure is lower.`,
      idea: String.raw`Treat ionization $\text{atom} \rightleftharpoons \text{ion}^+ + e^-$ as an equilibrium between states of the atom plus a free electron: the Boltzmann factor $e^{-\chi/kT}$ of 4.8 times the number of free-electron states per volume, $2(2\pi m_e kT/h^2)^{3/2}$, which is the grand-canonical (thermo 8.1) counting of a gas of electrons. The $n_e$ on the left is why a rarefied atmosphere (small $P_e$) ionizes at lower $T$: the electrons have more room, so recombination is less likely. The thermostat is the exponential: a few thousand K changes $e^{-\chi/kT}$ by a factor $\sim 10^4$.`,
      caption: String.raw`Drag the handle along the ionized-fraction curve, and change the **electron pressure** (the photosphere of a main-sequence star has $P_e\sim$ tens of N/m²; a giant's is far lower). Faint curves: $100\times$ larger and smaller $P_e$. Right: the ratio $N_{\rm II}/N_{\rm I}$ on a log axis, exposing the exponential.`,
      scope: String.raw`Pure hydrogen in LTE, one electron pressure for all temperatures (in reality $P_e$ rises with ionization), ground-state populations only, no pressure ionization or Coulomb corrections.`,
      credit: 'Saha, 1920',
      deps: ['astro-4.8', 'thermo-8.1'],
      refs: ['Carroll–Ostlie §8.1'],
      tags: ['Saha', 'ionization', 'plasma'],
      verify: true,
      links: { doi: 'https://doi.org/10.1080/14786441008636148' },
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
          B.fn((t) => sahaRatio(t, Pe.value), { color: 'accent', width: 2.2, n: 300 });
          B.hline(1, { color: 'faint', width: 1, dash: [2, 4] });
          B.dot(T, sahaRatio(T, Pe.value), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const T = hT.x, R = sahaRatio(T, Pe.value);
          return `$T = ${v.fix(T, 0)}$ K: $N_{\\rm II}/N_{\\rm I} = ${v.sci(R, 3)}$  →  ionized fraction **${v.fix(100 * ionFrac(T, Pe.value), 1)} %**\n50 % ionized at $T_{1/2} = ${v.fix(Thalf(Pe.value), 0)}$ K (green) for $P_e = ${v.fmt(Pe.value, 3)}$ N/m²; fraction ionized goes from 10 % to 90 % in ${v.fix(v.M.bisect((t) => ionFrac(t, Pe.value) - 0.9, 3000, 60000, 0.5) - v.M.bisect((t) => ionFrac(t, Pe.value) - 0.1, 3000, 60000, 0.5), 0)} K`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'The spectral sequence explained',
      statement: String.raw`Stars are classified O, B, A, F, G, K, M in order of decreasing temperature, by which absorption lines their spectra show: He II in O stars, strong H Balmer lines in A stars, Ca II and other metals in G and K, molecular bands (TiO) in M. The classification is a **temperature sequence**, not a sequence of composition: the strength of a given line peaks at a characteristic temperature. For the Balmer lines, which need hydrogen atoms in $n=2$, the strength is roughly proportional to
$$\frac{N_{\rm H^0}}{N_{\rm H}}\cdot\frac{N_{n=2}}{N_{\rm H^0}},$$
the product of a neutral fraction that falls with $T$ (Saha, 4.9) and an excited fraction that rises with $T$ (Boltzmann, 4.8). It peaks near $9\,000$–$10\,000$ K, spectral type A0, and fades on both sides although hydrogen is by far the commonest element in all of these stars.`,
      idea: String.raw`Cool stars: nearly all hydrogen is in the ground state, and the Boltzmann factor leaves almost nothing in $n=2$. Hot stars: hydrogen is ionized (no atoms, no lines). In between, a compromise; the other lines peak elsewhere because their atoms have other excitation and ionization energies. The decisive step, that the sequence reflects temperature rather than abundance, was taken by Cecilia Payne in her 1925 thesis, applying Saha's equation to the Harvard classification of Annie Cannon and her colleagues, and finding that hydrogen and helium dominate stellar compositions.`,
      caption: String.raw`Left: neutral fraction (green, falls) and fraction of neutral atoms in $n=2$ (orange, rises), both from the Saha and Boltzmann equations for the chosen $P_e$; their product (blue) is the Balmer line strength, normalised to its peak. Bands show approximate spectral-class temperature ranges. Drag the handle and watch which class it sits in. Right: the line strength in each class, evaluated at its mid temperature and coloured by the blackbody colour of that class.`,
      scope: String.raw`A single-species caricature of line formation: it counts absorbers, ignoring the opacity of the continuum (which changes with $T$ too) and the line transfer. The class boundaries are the commonly quoted round numbers; with realistic photosphere models the Balmer maximum comes out near $9\,500$–$10\,000$ K, which is what this picture gives for $P_e \sim 20$ N/m².`,
      credit: 'Payne, 1925 (thesis); classification by Cannon and the Harvard group, 1901–1924',
      deps: ['astro-4.9', 'astro-4.6'],
      refs: ['Carroll–Ostlie §8.1'],
      tags: ['spectral types', 'Saha', 'Boltzmann'],
      verify: true,
      viz(v) {
        const Pe = v.slider('electron pressure $P_e$ (N/m²)', 0.5, 2000, 20, { log: true, sig: 2 });
        const A = v.stage({ x: [3000, 40000], y: [0, 1.25], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'temperature (K)', ylabel: 'relative', title: 'neutral × excited = Balmer line strength' });
        const B = v.stage({ x: [-1, 1], y: [0, 1], axes: false, height: 340, weight: 0.7, title: 'a ‘spectrum’: Hα strength by class' });
        const neutral = (T) => 1 - ionFrac(T, Pe.value);
        const exc = (T) => popFrac(2, T, 10);
        const raw = (T) => neutral(T) * exc(T);
        const cache = memo();
        const peak = () => cache(Pe.value, () => { let bt = 3000, bm = 0; for (let T = 3000; T <= 40000; T *= 1.004) { const r = raw(T); if (r > bm) { bm = r; bt = T; } } return [bt, bm]; });
        const hT = A.handle(9500, 0.9, { color: 'accent', r: 7.5, constrain: (x) => { const T = clamp(x, 3000, 40000); return [T, raw(T) / peak()[1]]; } });
        v.render(() => {
          const [Tp, mx] = peak();
          CLASSES.forEach((c, i) => { A.vband(Math.max(c.lo, 3000), Math.min(c.hi, 40000), { color: i % 2 ? 'faint' : 'muted', alpha: 0.12 }); A.text(c.c, Math.sqrt(Math.max(c.lo, 3000) * Math.min(c.hi, 40000)), 1.18, { size: 13, color: 'ink', align: 'center', weight: 600 }); });
          A.fn(neutral, { color: 'green', width: 1.8, n: 300 });
          A.fn((T) => exc(T) / exc(40000), { color: 'orange', width: 1.8, n: 300 });
          A.fn((T) => raw(T) / mx, { color: 'blue', width: 3, n: 400 });
          A.vline(Tp, { color: 'blue', width: 1, dash: [4, 4] });
          const T = hT.x; hT.set(T, raw(T) / mx);
          // strip: class order O..M left to right
          const N = CLASSES.length;
          CLASSES.forEach((c, i) => {
            const Tm = Math.sqrt(Math.max(c.lo, 3000) * c.hi), val = raw(Tm) / mx, x0 = -1 + (2 * i) / N, x1 = -1 + (2 * (i + 1)) / N;
            B.poly([[x0 + 0.03, 0.2], [x1 - 0.03, 0.2], [x1 - 0.03, 0.2 + 0.7 * val + 0.005], [x0 + 0.03, 0.2 + 0.7 * val + 0.005]], { fill: bbColor(v, Tm), fillAlpha: 1, color: 'faint', width: 1 });
            B.text(c.c, (x0 + x1) / 2, 0.1, { size: 13, align: 'center', color: 'ink', weight: 600 });
          });
        });
        v.legend([['green', 'neutral fraction'], ['orange', 'n = 2 share (scaled)'], ['blue', 'Balmer strength']]);
        v.readout(() => {
          const T = hT.x, cl = CLASSES.find((c) => T >= c.lo && T < c.hi);
          return `$T = ${v.fix(T, 0)}$ K (class ${cl ? cl.c : '—'}): neutral fraction ${v.fix(neutral(T), 3)}, share in $n=2$ $${v.sci(exc(T), 2)}$, strength ${v.fix(100 * raw(T) / peak()[1], 0)} % of the maximum\nmaximum at $T = ${v.fix(peak()[0], 0)}$ K for $P_e = ${v.fmt(Pe.value, 3)}$ N/m² (observed Balmer maximum: class A0, about 9 500–10 000 K)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Hertzsprung–Russell diagram',
      statement: String.raw`The **Hertzsprung–Russell (H–R) diagram** plots luminosity (or absolute magnitude) against effective temperature (or spectral type or colour), with temperature *increasing to the left*. Stars do not fill the plane: most lie on a diagonal **main sequence** from hot and luminous to cool and faint, with **giants** and **supergiants** above it and **white dwarfs** below. Because $L=4\pi R^2\sigma T_{\rm eff}^4$ (4.5), position encodes radius: the stars above the main sequence are large, those below small. The Sun, a middle-aged main-sequence star, is the reference point $(5772\ \text{K},\,1\,L_\odot)$.`,
      idea: String.raw`Independent observations (colours, spectral types from 4.6 and 4.10; luminosities from distances via 4.1–4.3) are plotted against each other, and the crowding on a few curves is the surprise: it says a star's temperature and luminosity are not independent, because they are set by a few parameters (chiefly mass, then age and composition; items 7–8 of the next chapters). Hertzsprung (about 1905–1911) and Russell (about 1910–1913) made the diagram independently. The white dwarfs below the main sequence were an early oddity: hot but faint, hence tiny (chapter 7).`,
      caption: String.raw`A sample of well-known stars (temperature and luminosity rounded; see the scope note), coloured by $T_{\rm eff}$. Hover a star for its inferred size. The diagonal lines are constant radius, as in 4.5. Drag the **test star** anywhere to see which family it falls in; the dashed curve connects the main-sequence stars of the sample. Spectral-class letters run along the top.`,
      scope: String.raw`A **rounded, approximate sample from memory** (temperatures to $\sim\!2$–$5$ %, luminosities to $\sim\!10$–$30$ %, some much worse; supergiant values are uncertain by a factor of two). It is not a catalogue and shows nothing about frequencies: a real survey (e.g. from Gaia) finds that the main sequence holds about $90$ % of stars, the red dwarfs being by far the commonest. Check values against SIMBAD or a current compilation before relying on them.`,
      credit: 'Hertzsprung, c. 1905–1911; Russell, c. 1910–1913',
      deps: ['astro-4.5', 'astro-4.10'],
      refs: ['Carroll–Ostlie §8.2'],
      tags: ['HR diagram', 'main sequence', 'stellar types'],
      verify: true,
      viz(v) {
        const STARS = [
          ['Proxima Centauri', 3040, 0.0016, 'ms'], ['Barnard’s Star', 3270, 0.0035, 'ms'], ['Sun', 5772, 1, 'ms'], ['α Cen A', 5790, 1.5, 'ms'],
          ['Procyon A', 6530, 6.9, 'ms'], ['Altair', 7550, 10.6, 'ms'], ['Vega', 9600, 40, 'ms'], ['Sirius A', 9940, 25, 'ms'],
          ['Pollux', 4900, 43, 'g'], ['Arcturus', 4290, 170, 'g'], ['Aldebaran', 3900, 440, 'g'],
          ['Betelgeuse', 3600, 1.2e5, 'sg'], ['Antares', 3570, 7.6e4, 'sg'], ['Rigel', 12100, 1.2e5, 'sg'], ['Deneb', 8500, 1.96e5, 'sg'],
          ['Procyon B', 7740, 4.9e-4, 'wd'], ['40 Eridani B', 16500, 0.013, 'wd'], ['Sirius B', 25200, 0.025, 'wd'],
        ];
        const LX = (T) => -Math.log10(T);
        const s = v.stage({ x: [-4.65, -3.45], y: [-4.2, 6.2], axes: 'box', gutter: true, height: 440, full: true, hover: true, xlabel: 'effective temperature (K)', ylabel: 'luminosity (L☉)',
          xticks: [40000, 20000, 10000, 6000, 4000].map((T) => [LX(T), T.toLocaleString('en').replace(/,/g, ' ')]), yticks: [[-4, '10⁻⁴'], [-2, '0.01'], [0, '1'], [2, '100'], [4, '10⁴'], [6, '10⁶']] });
        const test = s.handle(LX(8000), 1, { color: 'accent', r: 8, constrain: { x: [-4.6, -3.5], y: [-4.1, 6.1] } });
        const ms = STARS.filter((a) => a[3] === 'ms').sort((a, b) => b[1] - a[1]);
        let st = {};
        v.render(() => {
          for (const R of [0.01, 0.1, 1, 10, 100, 1000]) {
            const f = (lx) => 2 * Math.log10(R) + 4 * (-lx - Math.log10(T_SUN));
            s.path([[-4.65, f(-4.65)], [-3.45, f(-3.45)]], { color: 'faint', width: 1, alpha: 0.8 });
            s.text(`${R} R☉`, -4.55, f(-4.55), { size: 10, color: 'muted', dy: -8, align: 'left' });
          }
          CLASSES.forEach((c) => { const m = LX(Math.sqrt(c.lo * c.hi)); s.text(c.c, m, 5.95, { size: 13, color: 'muted', weight: 600, align: 'center' }); s.vline(LX(c.lo), { color: 'faint', alpha: 0.3, width: 1, dash: [2, 5] }); });
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
          for (const nm of ['Sun', 'Sirius B', 'Betelgeuse', 'Proxima Centauri', 'Rigel', 'Arcturus', 'Deneb', 'Vega']) { const a = STARS.find((q) => q[0] === nm), rt = nm === 'Proxima Centauri' || nm === 'Betelgeuse'; s.text(nm, LX(a[1]), Math.log10(a[2]), { dx: rt ? -10 : 10, dy: nm === 'Vega' ? 12 : -9, size: 10.5, color: 'ink', align: rt ? 'right' : 'left' }); }
          if (near && bd < 24) { s.dot(LX(near[1]), Math.log10(near[2]), { r: 11, hollow: true, color: 'gold', width: 2 }); st.hover = near; } else st.hover = null;
          const T = Math.pow(10, -test.x), L = Math.pow(10, test.y), R = Math.sqrt(L) * (T_SUN / T) ** 2;
          st.t = { T, L, R };
          const fam = R > 100 ? 'supergiant' : R > 8 ? 'giant / bright giant' : R < 0.05 ? 'white dwarf' : Math.abs(test.y - interpMS(test.x)) < 0.9 ? 'main sequence' : test.y > interpMS(test.x) ? 'above the main sequence (subgiant/giant)' : 'below the main sequence (subdwarf)';
          st.fam = fam;
        });
        function interpMS(lx) { const pts = ms.map((a) => [LX(a[1]), Math.log10(a[2])]).sort((p, q) => p[0] - q[0]); if (lx <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (lx <= pts[i][0]) { const t = (lx - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]); } return pts[pts.length - 1][1]; }
        v.readout(() => {
          const h = st.hover, t = st.t, R = (a) => Math.sqrt(a[2]) * (T_SUN / a[1]) ** 2;
          return `test star: $T = ${v.fix(t.T, 0)}$ K, $L = ${sci(v, t.L, 2)}\\,L_\\odot$ → $R = ${v.fmt(t.R, 3)}\\,R_\\odot$: **${st.fam}**\n` + (h ? `${h[0]}: $T = ${h[1]}$ K, $L = ${sci(v, h[2], 2)}\\,L_\\odot$ → $R = ${v.fmt(R(h), 3)}\\,R_\\odot$` : 'hover a star to read its size');
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Law',
      name: 'Mass–luminosity relation',
      statement: String.raw`For main-sequence stars the luminosity is a steeply rising power of the mass, $L\propto M^{a}$, with an exponent that changes with mass. In solar units, a commonly used fit is
$$\frac{L}{L_\odot}\approx\begin{cases}0.23\,(M/M_\odot)^{2.3} & M<0.43\,M_\odot\\ (M/M_\odot)^{4} & 0.43<M/M_\odot<2\\ 1.4\,(M/M_\odot)^{3.5} & 2<M/M_\odot<55\\ 3.2\times10^{4}\,M/M_\odot & M>55\,M_\odot,\end{cases}$$
so $a\approx3.5$–$4$ for stars like the Sun and up to a few times it, $\approx 2.3$ for red dwarfs and $\approx1$ at the very top. The consequence is a mass-dependent lifetime: the fuel supply is $\propto M$ and the burn rate is $L$, so $t_{\rm MS}\propto M/L\propto M^{1-a}$, about $10^{10}$ yr for the Sun and a few million years for $\sim\!40\,M_\odot$.`,
      idea: String.raw`The masses come from binary orbits (1.3 and 1.4: Kepler's third law gives the sum of masses, the mass function and radial-velocity ratio the individual ones), the luminosities from flux and distance (4.2); plotting the two on log axes gives lines, and the slope is the exponent. Eddington (1924) showed that stellar-interior models in which radiation carries the energy outwards make $L$ rise as a high power of $M$, with the observed exponent. The lifetime estimate sets the scale of stellar evolution (next chapters): the O stars die while their birth cloud is still around.`,
      caption: String.raw`The dots are **simulated binaries** (not measured data): masses drawn log-uniformly from $0.15$–$40\,M_\odot$, luminosities scattered by $\pm0.15$ dex about the fit with $5$ % mass errors, from a seeded random generator. Drag the two **mass-window** handles on the left and the straight-line fit's slope is recomputed from the dots inside, with its scatter, and compared with the local slope of the fit. Right: the lifetime $10^{10}\,{\rm yr}\times (M/L)$ in solar units.`,
      scope: String.raw`Main-sequence stars only (not giants or white dwarfs, whose luminosity is not set by mass alone), solar metallicity, ignoring the spread caused by age, rotation and metallicity. The piecewise power law is a summary fit of a few quoted exponents, not a derived result; the real relation is smooth, and measured binary masses scatter around it.`,
      credit: 'Eddington, 1924 (theory); earlier empirical relation from binaries, Hertzsprung 1918',
      deps: ['astro-1.3', 'astro-1.4', 'astro-4.11'],
      refs: ['Carroll–Ostlie §7.2', 'Carroll–Ostlie §10.6'],
      tags: ['mass–luminosity', 'binaries', 'main sequence'],
      verify: true,
      viz(v) {
        const r = v.rng(21);
        const DATA = Array.from({ length: 60 }, () => { const lm = r.uniform(Math.log10(0.15), Math.log10(40)); const M = Math.pow(10, lm); return { lm: lm + 0.021 * r.normal(), ll: Math.log10(lumOfMass(M)) + 0.15 * r.normal() }; });
        const A = v.stage({ x: [-1, 1.9], y: [-3.4, 5.9], axes: 'box', gutter: true, height: 350, weight: 1.15, xlabel: 'mass (M☉)', ylabel: 'luminosity (L☉)', title: 'simulated binaries on the main sequence',
          xticks: [[-1, '0.1'], [0, '1'], [1, '10'], [Math.log10(40), '40']], yticks: [[-3, '10⁻³'], [-1, '0.1'], [1, '10'], [3, '10³'], [5, '10⁵']] });
        const T = v.stage({ x: [-1, 1.9], y: [5, 12.2], axes: 'box', gutter: true, height: 350, weight: 0.9, xlabel: 'mass (M☉)', ylabel: 'main-sequence lifetime (yr)', title: 'lifetime ∝ M / L',
          xticks: [[-1, '0.1'], [0, '1'], [1, '10'], [Math.log10(40), '40']], yticks: [[6, '10⁶'], [8, '10⁸'], [10, '10¹⁰'], [12, '10¹²']] });
        const lo = A.handle(-0.6, -3.1, { color: 'blue', r: 7, constrain: 'x', label: 'low', labelPos: 'ne' });
        const hi = A.handle(0.3, -3.1, { color: 'orange', r: 7, constrain: 'x', label: 'high', labelPos: 'ne' });
        const show = v.toggle('show the fit', true);
        let st = {};
        v.render(() => {
          const a = Math.min(lo.x, hi.x), b = Math.max(lo.x, hi.x);
          lo.set(a === lo.x ? lo.x : a, -3.1);
          A.vband(a, b, { color: 'accent', alpha: 0.06 });
          if (show.value) A.fn((x) => Math.log10(lumOfMass(Math.pow(10, x))), { color: 'green', width: 2, n: 400 });
          const inside = DATA.filter((p) => p.lm >= a && p.lm <= b);
          for (const p of DATA) A.dot(p.lm, p.ll, { r: 3.8, color: p.lm >= a && p.lm <= b ? 'gold' : 'muted', alpha: p.lm >= a && p.lm <= b ? 1 : 0.7 });
          A.dot(0, 0, { r: 5, color: 'ink', label: 'Sun', labelPos: 'se' });
          if (inside.length >= 3) {
            const f = v.M.linreg(inside.map((p) => p.lm), inside.map((p) => p.ll));
            A.path([[a, f.predict(a)], [b, f.predict(b)]], { color: 'accent', width: 2.6 });
            st = { n: inside.length, slope: f.slope, se: f.seSlope, mid: mlSlope(Math.pow(10, (a + b) / 2)) };
          } else st = { n: inside.length };
          T.fn((x) => 10 + Math.log10(Math.pow(10, x) / lumOfMass(Math.pow(10, x))), { color: 'green', width: 2.2, n: 400 });
          T.dot(0, 10, { r: 5, color: 'ink', label: 'Sun', labelPos: 'ne' });
          T.vband(a, b, { color: 'accent', alpha: 0.06 });
        });
        v.readout(() => st.slope === undefined ? 'choose a wider mass window (fewer than 3 binaries inside)' : `${st.n} binaries in the window: fitted $L\\propto M^{a}$ with $a = ${v.fix(st.slope, 2)} \\pm ${v.fix(st.se, 2)}$; the fit formula has slope ${v.fix(st.mid, 1)} at the window centre\nlifetime $t_{\\rm MS}\\approx 10^{10}\\,{\\rm yr}\\,(M/L)$: Sun $10$ Gyr, $0.5\\,M_\\odot$ ${v.sci(1e10 * 0.5 / lumOfMass(0.5), 2)} yr, $20\\,M_\\odot$ ${v.sci(1e10 * 20 / lumOfMass(20), 2)} yr`);
      },
    },
  ],
};
