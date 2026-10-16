// Medical Imaging — Chapter 2: X-ray physics and projection radiography
// Part 1 (this file): 2.1 tube spectrum, 2.3 attenuation coefficient and HVL, 2.4 photoelectric vs Compton, 2.5 beam hardening.
// Part 2 (ch02-b.js): 2.6 projection geometry, 2.7 scatter and grids, 2.8 K-edge contrast agents, 2.9 dual energy.
// Part 3 (ch02-c.js): 2.10 dose and inverse square, 2.11 pulse oximetry, 2.12 Röntgen's 1895 paper.
// 2.2 (Beer–Lambert law) is a cross-listing of waves-4.15 and appears here automatically.
import {
  clamp, fx, pct, mean, MATS, mu, massAtt, ANODES, E_GRID, tubeSpectrum, transmit, total, meanEnergy, energyFluence, hvlOf,
} from './ch02.shared.js';

const interp = (E, N) => (x) => {
  const t = (x - E[0]) / (E[1] - E[0]), i = Math.floor(t);
  if (i < 0 || i >= E.length - 1) return 0;
  return N[i] + (N[i + 1] - N[i]) * (t - i);
};
const efl = (sp) => Float64Array.from(sp.N, (n, i) => n * sp.E[i]); // energy fluence per keV
const MU_W = Float64Array.from(E_GRID, (e) => mu(MATS.water, e));

export default {
  collection: 'imaging',
  chapter: 2,
  title: 'X-ray physics and projection radiography',
  summary: String.raw`X-rays are produced by decelerating electrons and characteristic transitions, and pass through the body attenuated exponentially according to the Beer–Lambert law. Photoelectric absorption gives contrast between bone and soft tissue; Compton scatter degrades it. Projection geometry, beam hardening, contrast agents and dual-energy methods follow from the physics, and dose is the cost of every image. The same absorption law at visible wavelengths underlies pulse oximetry.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Concept',
      name: 'X-ray production: bremsstrahlung and characteristic lines',
      statement: String.raw`In an X-ray tube, electrons accelerated through a potential difference $V$ strike a metal anode. Two processes make photons. **Bremsstrahlung**: an electron decelerated in the field of a nucleus radiates a photon of any energy from $0$ up to its kinetic energy, so the spectrum is a continuum that stops sharply at $E_{\max}=eV$ (the Duane–Hunt limit, $\lambda_{\min}=hc/eV$). For a thin target Kramers' law gives an energy fluence falling linearly, $\Phi_E(E)\propto Z\,(eV-E)$. **Characteristic emission**: an electron that ejects a K-shell electron of the anode leaves a vacancy that an outer electron fills, emitting a photon of fixed energy $E_{K\alpha}$, $E_{K\beta}$, … set by the anode's atomic number; this requires $eV$ to exceed the K-edge $E_K$. Total output rises as $Z\,V^{2}$ but only about $10^{-9}ZV$ (about 1% for tungsten at 100 kV) of the electron power becomes X-rays; the rest heats the anode. Filtration removes the soft end, since photons below roughly 20 keV never leave the patient.`,
      idea: String.raw`A decelerated charge radiates (Larmor's formula, em); the electron slows in many small steps inside the anode, so the energy lost per photon is spread uniformly over $0\ldots eV$, and the photon number per unit energy goes as $(eV-E)/E$. The cut-off at $eV$ is energy conservation for a single electron (the quantum relation $E=hc/\lambda$ of the photon, qm-1.2). Atoms of the anode have discrete shell energies fixed by their nuclear charge ($E_K\propto Z^2$, the Moseley picture of the crystal-spectrum chapter xtal-6.9), so a vacancy in the K shell is refilled by photons at the same few energies whatever the tube voltage. Absorption in the anode, the tube window and added filters (the Beer–Lambert law) cut the low-energy continuum.`,
      caption: String.raw`Drag the **tube voltage**: the continuum always ends exactly at $E=$ kVp, and the K lines appear only once kVp exceeds the anode's K-edge (tungsten 69.5 keV, so none at 60 kV; molybdenum 20 keV). Change the **anode** and the lines jump to new fixed energies while the continuum keeps its shape. Add **filtration** and the soft end disappears, raising the mean energy. The dashed line is Kramers' unfiltered straight line; the shaded curve is what leaves the tube, including self-absorption in the anode (about 4 µm) and the filter.`,
      deps: ['xtal-6.9', 'qm-1.2'],
      tags: ['bremsstrahlung', 'X-ray tube', 'spectrum'],
      refs: ['Prince–Links ch. 4'],
      scope: String.raw`Thin-target Kramers continuum with a crude anode self-absorption; line intensities are an illustrative power law in $(eV/E_K-1)$, not measured yields; L lines and the heel effect are left out. Energies of the lines are the standard tabulated Kα/Kβ values for W, Mo and Rh.`,
      credit: 'Röntgen, 1895; Kramers, 1923; Duane & Hunt, 1915',
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [0, 130], y: [0, 1.25], axes: 'box', gutter: true, height: 360, xlabel: 'photon energy $E$ (keV)', ylabel: 'relative energy fluence per keV', title: 'Spectrum leaving the tube' });
        const kv = v.slider('tube voltage (kVp)', 20, 150, 100, { step: 1, int: true });
        const an = v.select('anode', [{ value: 'W', label: 'tungsten (Z = 74)' }, { value: 'Mo', label: 'molybdenum (42)' }, { value: 'Rh', label: 'rhodium (45)' }], 'W');
        const fl = v.slider('total filtration (mm Al)', 0.5, 10, 2.5, { step: 0.1 });
        const unf = v.toggle('show Kramers line (unfiltered)', true);
        let st = null;
        v.render(() => {
          const A = ANODES[an.value], V = kv.value, sp = tubeSpectrum(V, an.value, fl.value);
          const ef = efl(sp), scale = 1 / (A.Z * V), f = interp(sp.E, ef);
          const pk = Math.max(...ef) * scale;
          S.setView([0, Math.max(30, Math.ceil((V * 1.12) / 10) * 10)], [0, Math.max(1.12, pk * 1.18)]);
          if (unf.value) S.line(0, 1, V, 0, { color: 'muted', dash: true, width: 1.5 });
          S.fn((x) => f(x) * scale, { domain: [sp.E[0], Math.min(V, 150)], fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.8, n: 700 });
          S.vline(V, { color: 'red', dash: true, width: 1.2 });
          S.text('$E_{\\max}=eV$', V, Math.max(1.12, pk * 1.18) * 0.93, { align: 'right', dx: -6, size: 13, color: 'red' });
          if (V > A.Ek) {
            S.vline(A.Ek, { color: 'faint', dash: true, width: 1 });
            const lab = A.lines.map(([e], i) => [e, A.lineName[i]]).filter((p) => p[1]);
            for (const [e, nm] of lab) S.text(nm, e, f(e) * scale + 0.04 * Math.max(1.12, pk * 1.18), { align: 'center', size: 12, color: 'orange' });
          }
          const etot = total(Float64Array.from(sp.N, (n, i) => n * sp.E[i])), e0 = total(Float64Array.from(sp.N0, (n, i) => n * sp.E[i]));
          st = { V, A, mean: meanEnergy(sp.N, sp.E), hvl: hvlOf(sp.N, sp.E, MATS.aluminium) * 10, keep: etot / e0, out: (A.Z * V * V) / (74 * 100 * 100), lines: sp.lines };
        });
        v.legend([['accent', 'filtered spectrum', { area: true }], ['muted', 'Kramers: $Z(eV-E)$, no filter', { dash: true }], ['orange', 'characteristic K lines'], ['red', '$E_{\\max}$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const lam = (M.CONST.h * M.CONST.c) / (M.CONST.e * st.V * 1e3) * 1e10;
          return `Cut-off $E_{\\max}=${st.V}$ keV, i.e. $\\lambda_{\\min}=hc/eV=${fx(lam, 3)}$ Å. Mean photon energy of the beam $${fx(st.mean, 1)}$ keV; half-value layer (energy fluence) $${fx(st.hvl, 1)}$ mm Al.\n${st.V > st.A.Ek ? `K lines present: K-edge ${fx(st.A.Ek, 1)} keV is below ${st.V} kVp (${st.lines.map((l) => fx(l[0], 1)).join(', ')} keV).` : `No K lines: ${st.V} kVp is below the K-edge ${fx(st.A.Ek, 1)} keV of ${st.A.name}.`}\nUnfiltered output $\\propto ZV^2$: $${fx(st.out, 2)}$ × that of tungsten at 100 kVp; the filter keeps $${fx(100 * st.keep, 0)}\\%$ of the energy. Rule of thumb for the tube efficiency: $\\eta\\approx10^{-9}ZV=${fx(1e-9 * st.A.Z * st.V * 1e3 * 100, 2)}\\%$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Concept',
      name: 'Linear attenuation coefficient and half-value layer',
      statement: String.raw`For a narrow beam of monoenergetic photons crossing a uniform slab of thickness $x$, the transmitted fraction of unscattered photons is $I/I_0=e^{-\mu x}$. The **linear attenuation coefficient** $\mu$ (in cm$^{-1}$) is the probability per unit path length that a photon interacts; $\mu=\rho\,(\mu/\rho)$ with the density $\rho$ and the mass attenuation coefficient $\mu/\rho$ (cm$^2$/g), which depends on material and photon energy only. The **half-value layer** is the thickness that halves the beam,
$$\mathrm{HVL}=\frac{\ln 2}{\mu}\approx\frac{0.693}{\mu},$$
and the mean free path is $1/\mu=\mathrm{HVL}/\ln2\approx1.44\,\mathrm{HVL}$. After $n$ half-value layers the intensity is $2^{-n}$ of its initial value, whatever the starting thickness.`,
      idea: String.raw`Beer–Lambert (imaging-2.2): each thin layer $dx$ removes a fixed fraction $\mu\,dx$ of the photons that reach it, so $dI=-\mu I\,dx$ and the solution is an exponential. Setting $e^{-\mu x}=\tfrac12$ gives the HVL; because the law is multiplicative, the same thickness halves the beam again and again. $\mu$ itself comes from the atomic cross-sections: $\mu=n_{\rm atoms}\sigma$, so it scales with density and falls with photon energy (until the high-$Z$ edges), which is why bone and lead need very different thicknesses.`,
      caption: String.raw`Choose a **material** and a **photon energy**. Drag the dot along the transmission curve: at 1, 2, 3 half-value layers it reads 50%, 25%, 12.5%, on the log axis a straight line (switch the **log axis** off to see the curve itself). The bars at right compare the HVL of five materials at the chosen energy on a log scale; raise the energy and every HVL grows, lead most dramatically below its 88 keV K-edge.`,
      deps: ['imaging-2.2'],
      tags: ['attenuation', 'half-value layer'],
      refs: ['Prince–Links ch. 4'],
      scope: String.raw`Narrow-beam geometry (only unscattered photons counted) and monoenergetic photons. Real beams are polychromatic and scatter is detected (see beam hardening and scatter). Coefficients here are a model (photoelectric power law plus Klein–Nishina) calibrated to remembered NIST values, good to about 10–30%.`,
      viz(v) {
        const T = v.stage({ x: [0, 5], y: [0.01, 1.15], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'thickness $x$ (cm)', ylabel: 'transmitted fraction $I/I_0$', title: 'Narrow-beam transmission' });
        const B = v.stage({ x: [0.01, 1000], y: [0, 6.0], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'half-value layer (mm)', ylabel: '', yticks: [], title: 'HVL of five materials at this energy', minWidth: 300 });
        const mat = v.select('material', [{ value: 'tissue', label: 'soft tissue' }, { value: 'bone', label: 'bone' }, { value: 'aluminium', label: 'aluminium' }, { value: 'lead', label: 'lead' }], 'tissue');
        const en = v.slider('photon energy (keV)', 20, 150, 60, { step: 1, int: true });
        const lg = v.toggle('log axis', true);
        let nhvl = 1.5, st = null;
        const h = T.handle(1.5, 0.35, { color: 'gold', r: 8, label: '' });
        h.onDrag = () => { nhvl = Math.max(0, h.x / st.hvl); v.invalidate(); };
        const list = [['tissue', 'soft tissue', 'accent'], ['bone', 'bone', 'orange'], ['aluminium', 'aluminium', 'teal'], ['copper', 'copper', 'purple'], ['lead', 'lead', 'red']];
        v.render(() => {
          const E = en.value, m = MATS[mat.value], mm = mu(m, E), hvl = Math.LN2 / mm;
          st = { mm, hvl, E, m };
          T.setScale({ ylog: lg.value });
          T.setView([0, 5 * hvl], lg.value ? [0.015, 1.3] : [0, 1.05]);
          T.setLabels(`thickness $x$ (cm)`);
          for (let k = 1; k <= 4; k++) { T.hline(2 ** -k, { color: 'faint', dash: true, width: 1 }); T.vline(k * hvl, { color: 'faint', dash: true, width: 1 }); T.text(`${k === 1 ? '50%' : `${100 * 2 ** -k}%`}`, 5 * hvl, 2 ** -k, { align: 'right', baseline: 'bottom', dy: -2, size: 11, color: 'muted' }); }
          T.fn((x) => Math.exp(-mm * x), { color: 'accent', width: 2.4, fill: lg.value ? false : 'accent', fillAlpha: 0.1 });
          const x = Math.min(nhvl * hvl, 5 * hvl);
          h.set(x, Math.exp(-mm * x));
          T.segment([x, 0.0001], [x, Math.exp(-mm * x)], { color: 'gold', dash: true, width: 1.2 });
          B.setView([0.01, 1000], [0, 6.0]);
          list.forEach(([k, name, c], i) => {
            const hv = (Math.LN2 / mu(MATS[k], E)) * 10, y = 5 - i;
            B.rect(0.01, y - 0.28, Math.max(hv, 0.0101), y + 0.2, { fill: c, fillAlpha: k === mat.value ? 0.75 : 0.35, color: c, width: k === mat.value ? 2 : 1 });
            B.text(`${name}  ${hv < 1 ? fx(hv, hv < 0.1 ? 3 : 2) : fx(hv, hv < 10 ? 1 : 0)} mm`, 0.014, y + 0.24, { size: 12, color: 'ink', baseline: 'bottom' });
          });
        });
        v.legend([['accent', 'transmission $e^{-\\mu x}$'], ['gold', 'your thickness']]);
        v.readout(() => {
          if (!st) return '';
          const I = Math.exp(-st.mm * nhvl * st.hvl);
          return `${st.m.name} at ${st.E} keV: $\\mu/\\rho=${fx(massAtt(st.m, st.E).tot, 3)}$ cm$^2$/g, $\\rho=${fx(st.m.rho, 2)}$ g/cm$^3$, so $\\mu=${fx(st.mm, 3)}$ cm$^{-1}$.\n$\\mathrm{HVL}=\\ln2/\\mu=${fx(st.hvl * 10, 2)}$ mm; mean free path $1/\\mu=${fx(10 / st.mm, 2)}$ mm. At $x=${fx(nhvl * st.hvl, 3)}$ cm $=${fx(nhvl, 2)}$ HVL: $I/I_0=${fx(I, 4)}$ and $2^{-${fx(nhvl, 2)}}=${fx(2 ** -nhvl, 4)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Phenomenon',
      name: 'Photoelectric absorption versus Compton scattering',
      statement: String.raw`At diagnostic energies (10–150 keV) two interactions dominate the attenuation of X-rays in tissue. In **photoelectric absorption** the photon is absorbed by an inner-shell electron, which leaves the atom with the photon's energy less its binding energy; the cross-section per atom scales roughly as $Z^{4}$ and the mass coefficient as
$$\frac{\tau}{\rho}\ \propto\ \frac{Z^{3}}{E^{3}}\qquad(\text{away from absorption edges}),$$
so it falls steeply with energy and is much larger in bone ($Z_{\rm eff}\approx13$) than in soft tissue ($Z_{\rm eff}\approx7.5$). In **Compton scattering** the photon scatters off a nearly free outer electron and loses part of its energy; the cross-section per electron is the Klein–Nishina value, almost independent of $Z$ and slowly decreasing with $E$, so $\sigma/\rho$ is about the same for all light elements (it follows the electron density). The two contributions are equal at about 30 keV in soft tissue and about 50 keV in bone. Hence image contrast between bone and tissue is large at low kVp and fades at high kVp, where Compton scatter, which carries no information about the material and adds fog, takes over.`,
      idea: String.raw`The photoelectric effect needs a bound electron to absorb the photon's momentum, so it favours tightly bound inner electrons ($Z$ large) and photon energies just above the binding energy (the $E^{-3}$ fall; the quantum treatment of photon–atom interaction, qm-1.2). Compton scattering is photon–electron billiards, and the Klein–Nishina formula depends only on $E/m_ec^2$ and the electron density; since $Z/A\approx\tfrac12$ for light elements, it hardly distinguishes tissues. A steep $Z^3E^{-3}$ curve crossing a nearly flat one gives a crossover energy that grows with $Z$ (Beer–Lambert, imaging-2.3, then says how much is removed).`,
      caption: String.raw`Pick a **material** and drag the **energy**. Left (log–log): the photoelectric part (orange) falls with slope $-3$, the Compton part (blue) is nearly flat, their sum is the total; the crossover is where they meet. Right: the share of interactions that are photoelectric in soft tissue and bone, and the subject contrast of 1 cm of bone replacing 1 cm of tissue (green) — large when photoelectric absorption rules, fading as Compton takes over.`,
      deps: ['imaging-2.3', 'qm-1.2'],
      tags: ['photoelectric effect', 'Compton scattering', 'contrast'],
      refs: ['Prince–Links ch. 4'],
      scope: String.raw`Energies 10–150 keV and the elements modelled (no K-edge for bone or tissue in this range; iodine's edge at 33 keV is shown separately in 2.8). Coherent (Rayleigh) scatter, a few percent of the total, is not included; pair production starts above 1.02 MeV.`,
      viz(v) {
        const L = v.stage({ x: [10, 150], y: [0.01, 100], xlog: true, ylog: true, axes: 'box', gutter: true, height: 350, xlabel: 'photon energy (keV)', ylabel: 'mass attenuation $\\mu/\\rho$ (cm²/g)', title: 'Two ways to lose a photon' });
        const R = v.stage({ x: [10, 150], y: [0, 1.04], xlog: true, axes: 'box', gutter: true, height: 350, xlabel: 'photon energy (keV)', ylabel: 'share / contrast', title: 'Photoelectric share and bone–tissue contrast', minWidth: 300 });
        const mat = v.select('material', [{ value: 'tissue', label: 'soft tissue' }, { value: 'bone', label: 'bone' }, { value: 'aluminium', label: 'aluminium' }, { value: 'iodine', label: 'iodine (K-edge)' }], 'tissue');
        const en = v.slider('photon energy (keV)', 10, 150, 40, { log: true, sig: 3 });
        const share = (m, E) => { const a = massAtt(m, E); return a.pe / a.tot; };
        const cross = (m) => { // highest energy in [10,150] where the photoelectric share falls through 1/2, or null
          let r = null, pe = 10, prev = share(m, 10) - 0.5;
          for (let E = 10.5; E <= 150; E += 0.5) { const cur = share(m, E) - 0.5; if (prev > 0 && cur <= 0) r = pe + (0.5 * prev) / (prev - cur); prev = cur; pe = E; }
          return r;
        };
        const contrast = (E) => 1 - Math.exp(-(mu(MATS.bone, E) - mu(MATS.tissue, E)) * 1);
        let st = null;
        v.render(() => {
          const m = MATS[mat.value], E = en.value, a = massAtt(m, E);
          L.fn((x) => massAtt(m, x).pe, { color: 'orange', width: 2, domain: [10, 150], n: 500 });
          L.fn((x) => massAtt(m, x).co, { color: 'accent', width: 2, domain: [10, 150], n: 500 });
          L.fn((x) => massAtt(m, x).tot, { color: 'ink', width: 2.4, domain: [10, 150], n: 500 });
          const xc = cross(m);
          if (xc) { L.vline(xc, { color: 'green', dash: true, width: 1.2 }); L.text(`${fx(xc, 0)} keV`, xc, 0.016, { align: 'center', size: 12, color: 'green' }); }
          L.vline(E, { color: 'gold', width: 2 });
          L.dot(E, a.tot, { color: 'gold', r: 5 });
          for (const [k, c] of [['tissue', 'accent'], ['bone', 'orange']]) {
            const mm = MATS[k]; R.fn((x) => share(mm, x), { color: c, width: 2.2, domain: [10, 150], n: 400 });
            const x0 = cross(mm); if (x0) R.dot(x0, 0.5, { color: c, r: 5, hollow: true });
          }
          R.hline(0.5, { color: 'faint', dash: true, width: 1 });
          R.fn(contrast, { color: 'green', width: 2.2, dash: true, domain: [10, 150], n: 400 });
          R.vline(E, { color: 'gold', width: 2 });
          st = { m, E, a, xc, shT: share(MATS.tissue, E), shB: share(MATS.bone, E), C: contrast(E), x2: massAtt(m, 2 * E), tx: cross(MATS.tissue), bx: cross(MATS.bone) };
        });
        v.legend([['orange', 'photoelectric $\\tau/\\rho$'], ['accent', 'Compton $\\sigma/\\rho$ (and tissue share)'], ['ink', 'total'], ['green', 'bone–tissue contrast (1 cm)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `${st.m.name} at ${fx(st.E, 1)} keV: photoelectric $${fx(st.a.pe, 3)}$, Compton $${fx(st.a.co, 3)}$, total $${fx(st.a.tot, 3)}$ cm$^2$/g — photoelectric share $${fx(100 * st.a.pe / st.a.tot, 0)}\\%$.\nDoubling the energy cuts the photoelectric part by $${fx(st.a.pe / st.x2.pe, 2)}$ (a pure $E^{-3}$ law would give 8) and changes the Compton part by only $${fx(st.a.co / st.x2.co, 2)}$.\nPhotoelectric = Compton at ${st.xc ? fx(st.xc, 0) : '—'} keV for this material (tissue ${st.tx ? fx(st.tx, 0) : '—'}, bone ${st.bx ? fx(st.bx, 0) : '—'} keV). Bone–tissue contrast of 1 cm: $${fx(100 * st.C, 0)}\\%$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Phenomenon',
      name: 'Beam hardening',
      statement: String.raw`A diagnostic X-ray beam is polychromatic, and the attenuation coefficient falls with energy. Low-energy photons are therefore removed faster than high-energy ones: as the beam penetrates matter its **mean energy rises** (the beam is "hardened") and its **effective attenuation coefficient falls** with depth. The measured log-attenuation
$$p(x)=-\ln\frac{\int\Phi(E)\,E\,e^{-\mu(E)x}\,dE}{\int\Phi(E)\,E\,dE}$$
is then a concave function of the thickness $x$ (it grows more slowly than $\mu x$) rather than the straight line given by Beer–Lambert for a single energy: $p'(x)$ decreases monotonically, because it is a weighted mean of $\mu(E)$ with weights that shift towards smaller $\mu$. In tomography the effect appears as **cupping** (the centre of a uniform cylinder looks less attenuating than its rim) and dark streaks between dense objects.`,
      idea: String.raw`Each energy obeys Beer–Lambert on its own (imaging-2.3), so the transmitted spectrum is the product $\Phi(E)e^{-\mu(E)x}$ of the incident spectrum (imaging-2.1) with an exponential that penalises low energies most. The log of a sum of decaying exponentials is concave, and its slope is the intensity-weighted average of $\mu(E)$, which can only drop as the weights move to higher energy. For a cylinder, rays through the centre have the longest path and are the most hardened, so their measured attenuation per centimetre is the lowest: the cupping profile.`,
      caption: String.raw`Left: the spectrum of an 80 kVp beam before (grey) and after (blue) a water cylinder of diameter $D$; dashed, the same transmitted spectrum rescaled to the incident peak, showing that it has shifted to the right. Middle: the attenuation $p(x)$ (solid) against the straight Beer–Lambert line with the initial slope (dashed): the gap is the hardening. Right: apparent attenuation $p/\ell$ along a chord of the cylinder, lowest at the centre (cupping). Add a copper **pre-filter** and the beam starts out hard, so the effect shrinks.`,
      deps: ['imaging-2.3', 'imaging-2.1'],
      tags: ['beam hardening', 'polychromatic', 'cupping'],
      refs: ['Prince–Links ch. 4'],
      scope: String.raw`Polychromatic beam, narrow-beam transmission through a uniform material, energy-integrating detector (signal $\propto$ energy fluence). Scatter and the energy response of real detectors are ignored.`,
      viz(v) {
        const A = v.stage({ x: [0, 110], y: [0, 1.15], axes: 'box', gutter: true, height: 320, xlabel: '$E$ (keV)', ylabel: 'relative energy fluence', title: 'Spectrum before and after', minWidth: 280 });
        const P = v.stage({ x: [0, 36], y: [0, 6], axes: 'box', gutter: true, height: 320, xlabel: 'thickness of water $x$ (cm)', ylabel: '$p(x)=-\\ln(I/I_0)$', title: 'Log-attenuation is concave', minWidth: 280 });
        const C = v.stage({ x: [-18, 18], y: [0, 0.3], axes: 'box', gutter: true, height: 320, xlabel: 'position across the cylinder (cm)', ylabel: 'apparent $p/\\ell$ (cm⁻¹)', title: 'Cupping across a water cylinder', minWidth: 280 });
        const kv = v.slider('tube voltage (kVp)', 50, 140, 80, { step: 1, int: true });
        const D = v.slider('cylinder diameter $D$ (cm)', 4, 36, 24, { step: 1, int: true });
        const cu = v.toggle('add 0.3 mm Cu pre-filter', false);
        let cache = { key: '' };
        const get = () => {
          const key = `${kv.value}|${cu.value}`;
          if (cache.key !== key) {
            const sp = tubeSpectrum(kv.value, 'W', 2.5, { cuMm: cu.value ? 0.3 : 0 }), E = sp.E, n = E.length;
            const grid = [], p = [], I0 = energyFluence(sp.N, E);
            for (let x = 0; x <= 40.001; x += 0.5) {
              let s = 0; for (let i = 0; i < n; i++) s += sp.N[i] * E[i] * Math.exp(-MU_W[i] * x);
              grid.push(x); p.push(-Math.log(s / I0));
            }
            cache = { key, sp, grid, p, I0, pk: Math.max(...efl(sp)) };
          }
          return cache;
        };
        const pAt = (c, x) => { const t = x / 0.5, i = Math.min(Math.floor(t), c.p.length - 2); return c.p[i] + (c.p[i + 1] - c.p[i]) * (t - i); };
        let st = null;
        v.render(() => {
          const c = get(), sp = c.sp, d = D.value, T = transmit(sp.N, sp.E, [[MATS.water, d]]);
          const e0 = efl(sp), e1 = Float64Array.from(T, (n, i) => n * sp.E[i]);
          const pk1 = Math.max(...e1);
          A.setView([0, Math.ceil(kv.value * 1.1 / 10) * 10], [0, 1.15]);
          A.fn(interp(sp.E, Float64Array.from(e0, (x) => x / c.pk)), { color: 'muted', fill: 'muted', fillAlpha: 0.12, width: 1.5, n: 600, domain: [sp.E[0], kv.value] });
          A.fn(interp(sp.E, Float64Array.from(e1, (x) => x / c.pk)), { color: 'accent', fill: 'accent', fillAlpha: 0.25, width: 2, n: 600, domain: [sp.E[0], kv.value] });
          A.fn(interp(sp.E, Float64Array.from(e1, (x) => x / pk1)), { color: 'accent', dash: true, width: 1.4, n: 600, domain: [sp.E[0], kv.value] });
          const m0 = meanEnergy(sp.N, sp.E), m1 = meanEnergy(T, sp.E);
          A.vline(m0, { color: 'muted', dash: true, width: 1 }); A.vline(m1, { color: 'accent', dash: true, width: 1 });
          // p(x)
          const slope0 = (pAt(c, 0.5) - pAt(c, 0)) / 0.5;
          P.setView([0, 40], [0, Math.max(3, Math.ceil(pAt(c, 40) * 0.5 + 0.8))]);
          P.line(0, 0, 40, slope0 * 40, { color: 'muted', dash: true, width: 1.5 });
          P.path(c.grid.map((x, i) => [x, c.p[i]]), { color: 'accent', width: 2.4 });
          P.dot(d, pAt(c, d), { color: 'gold', r: 6 });
          P.vline(d, { color: 'faint', dash: true, width: 1 });
          const peff = (pAt(c, Math.min(d + 0.25, 40)) - pAt(c, Math.max(d - 0.25, 0))) / (Math.min(d + 0.25, 40) - Math.max(d - 0.25, 0));
          // chord profile
          const R = d / 2, pts = [];
          for (let k = -100; k <= 100; k++) { const xx = (k / 100) * R * 0.985, ell = 2 * Math.sqrt(R * R - xx * xx); pts.push([xx, pAt(c, ell) / ell]); }
          const lo = Math.min(...pts.map((q) => q[1])); C.setView([-18, 18], [Math.max(0, lo * 0.8 - 0.02), slope0 * 1.06]);
          C.hline(slope0, { color: 'muted', dash: true, width: 1.3 });
          C.path(pts, { color: 'accent', width: 2.4 });
          C.dot(0, pts[100][1], { color: 'gold', r: 5 });
          C.dot(pts[0][0], pts[0][1], { color: 'orange', r: 4 }); C.dot(pts[200][0], pts[200][1], { color: 'orange', r: 4 });
          st = { m0, m1, slope0, peff, d, cup: 1 - pts[100][1] / pts[10][1], muMono: slope0, hv: hvlOf(T, sp.E, MATS.aluminium) * 10, hv0: hvlOf(sp.N, sp.E, MATS.aluminium) * 10 };
        });
        v.legend([['muted', 'incident / initial slope', { dash: true }], ['accent', 'after $D$ of water'], ['gold', 'thickness $D$ (centre of the cylinder)']]);
        v.readout(() => {
          if (!st) return '';
          return `Mean photon energy: $${fx(st.m0, 1)}$ keV before, $${fx(st.m1, 1)}$ keV after $${st.d}$ cm of water (hardened by $${fx(st.m1 - st.m0, 1)}$ keV). HVL in Al of the beam: $${fx(st.hv0, 1)}\\to${fx(st.hv, 1)}$ mm.\nEffective attenuation coefficient: $${fx(st.slope0, 3)}$ cm$^{-1}$ at the surface, $${fx(st.peff, 3)}$ cm$^{-1}$ at depth $D$ (a monoenergetic beam would keep one value). Cupping: the centre reads $${fx(100 * st.cup, 1)}\\%$ lower than near the rim.`;
        });
      },
    },
  ],
};
