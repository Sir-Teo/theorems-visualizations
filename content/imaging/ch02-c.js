// Medical Imaging — Chapter 2 (part 3): 2.10 radiation dose and the inverse-square law, 2.11 pulse oximetry, 2.12 Röntgen's first paper.
import { clamp, fx, MATS, mu, tubeSpectrum, transmit, energyFluence, meanEnergy, hvlOf } from './ch02.shared.js';

// ---------------------------------------------------------------- haemoglobin extinction coefficients (cm⁻¹ / (mol/L)); from Prahl's tabulation (omlc.org), rounded
const HB = [ // [nm, HbO2, Hb]  (S. Prahl's compilation of Gratzer / Kollias data, omlc.org/spectra/hemoglobin, rounded)
  [600, 3200, 14677], [620, 942, 6510], [640, 442, 4345], [660, 320, 3227], [680, 278, 2408], [700, 290, 1794], [720, 348, 1326], [740, 446, 1116],
  [760, 586, 1549], [780, 710, 1075], [800, 816, 762], [820, 916, 694], [840, 1022, 692], [860, 1092, 694], [880, 1154, 726], [900, 1198, 762],
  [920, 1224, 777], [940, 1214, 693], [960, 1186, 526], [980, 1128, 360], [1000, 1024, 207],
];
function hbAt(l) {
  const i = clamp(Math.floor((l - 600) / 20), 0, HB.length - 2), t = (l - HB[i][0]) / 20;
  return { o: HB[i][1] + (HB[i + 1][1] - HB[i][1]) * t, d: HB[i][2] + (HB[i + 1][2] - HB[i][2]) * t };
}
// carboxyhaemoglobin (illustrative): absorbs like HbO2 in the red, almost nothing in the near infrared
const eps = (l) => { const h = hbAt(l), w = clamp((l - 700) / 100, 0, 1); return { o: h.o, d: h.d, c: h.o * (1 - 0.9 * w) }; };

const pc = (t) => (t < 1e-5 ? '<0.001\\%' : `${fx(100 * t, t < 0.01 ? 3 : 1)}\\%`);
const DOSES = [ // typical effective doses in mSv: [name, low, high, typical] (order-of-magnitude typical values in line with UNSCEAR/ICRP/ACR summaries)
  ['dental bitewing', 0.002, 0.01, 0.005], ['chest radiograph', 0.02, 0.1, 0.05], ['mammogram (2 views)', 0.2, 0.6, 0.4], ['abdomen radiograph', 0.3, 1, 0.7],
  ['lumbar spine radiographs', 0.5, 2, 1], ['head CT', 1, 3, 2], ['chest CT', 4, 10, 7], ['abdomen–pelvis CT', 5, 15, 10], ['natural background, one year', 1, 10, 2.4],
];

export default {
  collection: 'imaging',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Concept',
      name: 'Radiation dose and the inverse-square law',
      statement: String.raw`A point source emitting $\dot N$ photons per second isotropically spreads them over spheres of area $4\pi r^2$, so the fluence rate and the exposure rate in air at distance $r$ fall as
$$X(r)=\frac{X(r_0)\,r_0^{2}}{r^{2}}\qquad(\text{inverse-square law}):$$
doubling the distance cuts the exposure to a quarter. The law is exact for a point source in vacuum, a good approximation in air at diagnostic energies when $r$ is much larger than the source, and it is why radiographers step back and why a tube a short distance from the skin deposits much more dose in the skin than in the film. Absorbed dose (J/kg, gray) is the energy deposited per unit mass; **effective dose** (sievert) weights it by radiation type and organ sensitivity to estimate stochastic risk. A chest radiograph is of the order of $0.05$ mSv and a CT of the chest of the order of $7$ mSv, against a natural background of about $2.4$ mSv per year.`,
      idea: String.raw`Photon number is conserved: the same $\dot N$ crosses every sphere around the source, whose area grows as $r^2$ (the geometric content of the Beer–Lambert law in vacuum, imaging-2.2, with $\mu=0$). Hence fluence is proportional to $1/r^2$, as long as the source can be treated as a point; a large emitting disc looks like a point only when $r\gg R$, and nearer it the field flattens. Dose in the patient also needs the attenuation law: the entrance dose is the exposure at the skin, the exit dose smaller by the factor $e^{-\mu x}$.`,
      caption: String.raw`Drag the **distance** $r$. Left: the beam's cross-section at that distance with 600 photons (the same 600 at every distance, as photon number is conserved); the gold square is the detector patch and the number inside falls as $1/r^2$ because the beam's area grows as $r^2$. Middle: exposure against distance on log–log axes, a slope of $-2$; give the source a size (**source radius**) and inside its radius the field flattens, the law failing. Right: typical effective doses of common examinations on a log scale; the green line is one day of natural background.`,
      deps: ['imaging-2.2'],
      tags: ['dose', 'inverse-square law', 'radiation protection'],
      refs: ['Prince–Links ch. 4'],
      scope: String.raw`Point or disc source in vacuum or air (no attenuation or scatter); the effective-dose values are typical orders of magnitude from memory of published summaries (they vary several-fold with protocol, scanner and patient size) and are not a dose calculator.`,
      viz(v) {
        const F = v.stage({ x: [-65, 65], y: [-65, 65], equal: true, axes: false, height: 330, minWidth: 250, title: 'Beam cross-section at distance $r$' });
        const L = v.stage({ x: [20, 300], y: [0.01, 30], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, minWidth: 280, xlabel: 'distance $r$ (cm)', ylabel: 'exposure relative to a point source at 100 cm', title: 'Exposure against distance' });
        const B = v.stage({ x: [0.001, 30], y: [0, 10.4], xlog: true, axes: 'box', gutter: true, height: 330, minWidth: 300, xlabel: 'effective dose (mSv)', ylabel: '', yticks: [], title: 'Typical effective doses' });
        const dist = v.slider('distance $r$ (cm)', 30, 250, 100, { step: 1, int: true });
        const rs = v.slider('source radius $R$ (cm)', 0, 80, 0, { step: 1, int: true });
        const ex = v.select('examination', [{ value: 1, label: 'chest radiograph' }, { value: 2, label: 'mammogram' }, { value: 5, label: 'head CT' }, { value: 6, label: 'chest CT' }], 1);
        const h = L.handle(100, 1, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 30, 250), curve(clamp(x, 30, 250))] });
        const curve = (r) => { const R = rs.value; return (10000 / (r * r)) * (R > 0 ? (2 * r * r * (1 - r / Math.sqrt(r * r + R * R))) / (R * R) : 1); };
        h.onDrag = () => { dist.set(Math.round(h.x)); };
        const rg = v.rng(9), pts = Array.from({ length: 600 }, () => { const a = 6.2831853 * rg(), q = Math.sqrt(rg()); return [q * Math.cos(a), q * Math.sin(a)]; });
        const PATCH = 10;
        let st = null;
        v.render(() => {
          const r = dist.value, R = rs.value, X = curve(r), beamR = 0.3 * r;
          h.set(r, X);
          F.circle(0, 0, beamR, { color: 'accent', fill: 'accent', fillAlpha: 0.08, width: 1.5 });
          F.rect(-PATCH, -PATCH, PATCH, PATCH, { color: 'gold', width: 2.5, fill: 'gold', fillAlpha: 0.12 });
          let inside = 0;
          for (const [px, py] of pts) { const x = px * beamR, y = py * beamR, hit = Math.abs(x) < PATCH && Math.abs(y) < PATCH; if (hit) inside++; F.dot(x, y, { r: hit ? 2.8 : 1.8, color: hit ? 'gold' : 'accent' }); }
          F.text(`beam radius ${fx(beamR, 0)} cm`, 0, -62, { align: 'center', size: 12, color: 'muted' });
          // curves
          L.fn((x) => (10000 / (x * x)), { color: 'muted', dash: true, width: 1.5, domain: [20, 300] });
          if (R > 0) L.fn(curve, { color: 'accent', width: 2.4, domain: [20, 300], n: 300 });
          else L.fn((x) => 10000 / (x * x), { color: 'accent', width: 2.4, domain: [20, 300] });
          if (R > 0) L.vline(R, { color: 'red', dash: true, width: 1.2 });
          // dose bars
          const k = +ex.value;
          DOSES.forEach(([name, lo, hi, typ], i) => {
            const y = 9.5 - i, sel = i === k;
            B.rect(lo, y - 0.22, hi, y + 0.22, { fill: sel ? 'orange' : 'accent', fillAlpha: sel ? 0.55 : 0.3, color: sel ? 'orange' : 'accent', width: sel ? 2 : 1 });
            B.dot(typ, y, { r: 4, color: sel ? 'orange' : 'accent' });
            B.text(name, 0.0012, y + 0.3, { size: 11.5, baseline: 'bottom', color: sel ? 'orange' : 'ink' });
          });
          B.vline(2.4 / 365, { color: 'green', dash: true, width: 1 });
          st = { r, X, inside, ratio2: curve(Math.min(250, 2 * r)) / X, beamR, R, typ: DOSES[k][3], name: DOSES[k][0], days: (DOSES[k][3] / 2.4) * 365 };
        });
        v.legend([['accent', 'photons / exposure'], ['muted', '$1/r^2$ (point source)', { dash: true }], ['gold', 'detector patch'], ['green', 'one day of background', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `At $r=${st.r}$ cm: $${st.inside}$ of 600 photons fall on the 20 × 20 cm patch (expected $\\propto 1/r^2$: $${fx(600 * 400 / (Math.PI * st.beamR ** 2), 0)}$ when the beam is wider than the patch). Exposure relative to 100 cm: $${fx(st.X, 3)}$${st.R ? ' (extended source)' : ` $=(100/r)^2=${fx((100 / st.r) ** 2, 3)}$`}.\nDoubling the distance multiplies exposure by $${fx(st.ratio2, 3)}$${st.R ? ' (it is 0.25 only for $r\\gg R$)' : ' (the inverse-square law says 0.25)'}. A ${st.name} (typical $${st.typ}$ mSv) equals about $${fx(st.days, st.days < 10 ? 1 : 0)}$ days of natural background (2.4 mSv per year).`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Method',
      name: 'Pulse oximetry by two-wavelength absorption',
      statement: String.raw`Oxygenated and deoxygenated haemoglobin (HbO$_2$ and Hb) absorb light differently: in the red (660 nm) Hb absorbs about ten times more than HbO$_2$, in the near infrared (about 940 nm) HbO$_2$ absorbs somewhat more than Hb. With each arterial beat the volume of arterial blood in a fingertip swells, adding a small extra path length $\Delta d$ of blood, so the transmitted intensity at wavelength $\lambda$ has a small pulsatile ("AC") part on a large steady ("DC") part and the **pulsatile absorbance** is, by the Beer–Lambert law,
$$\Delta A_\lambda\approx\big[S\,\varepsilon_{\rm HbO_2}(\lambda)+(1-S)\,\varepsilon_{\rm Hb}(\lambda)\big]\,c\,\Delta d,\qquad S=\frac{[\mathrm{HbO_2}]}{[\mathrm{HbO_2}]+[\mathrm{Hb}]}.$$
The ratio of ratios $R=\Delta A_{660}/\Delta A_{940}=\dfrac{(\mathrm{AC}/\mathrm{DC})_{660}}{(\mathrm{AC}/\mathrm{DC})_{940}}$ does not depend on the unknown $c\,\Delta d$ and is a monotonic function of the saturation $S$, which solves to
$$S=\frac{\varepsilon_{\rm Hb}(\lambda_1)-R\,\varepsilon_{\rm Hb}(\lambda_2)}{\big[\varepsilon_{\rm Hb}(\lambda_1)-\varepsilon_{\rm HbO_2}(\lambda_1)\big]+R\big[\varepsilon_{\rm HbO_2}(\lambda_2)-\varepsilon_{\rm Hb}(\lambda_2)\big]}.$$
Real instruments use an empirical calibration of $S$ against $R$ (about $S\approx110-25R$ in percent), because light is scattered in tissue. The method presumes only two absorbers, so carboxyhaemoglobin makes the oximeter over-read.`,
      idea: String.raw`Taking only the pulsatile part isolates arterial blood from skin, bone and venous blood, which absorb steadily. Beer–Lambert (imaging-2.2) makes absorbance linear in concentration and path length, and the ratio of two wavelengths cancels the unknown amount of blood in the beam, leaving only the colour of the blood, i.e. its oxygenation. Two wavelengths solve for two unknown absorbers, the same two-equation inversion as dual-energy imaging (imaging-2.9) with colours in place of tube voltages; a third absorber with a similar red spectrum cannot be told apart.`,
      caption: String.raw`Left: extinction spectra of HbO$_2$ and Hb (log scale) with your two LED wavelengths. Middle: the transmitted light at both wavelengths over a few heartbeats, each divided by its DC level; the red pulse is large when oxygen is low and small when it is high, the infrared one the other way round. Right: the oximeter's reading against the true saturation: the ideal two-absorber inversion (green), a typical empirical calibration (orange, dashed) and the gold dot for your blood. Raise the **carboxyhaemoglobin** fraction and the reading rises above the truth.`,
      deps: ['imaging-2.2', 'physio-6.2'],
      tags: ['pulse oximetry', 'haemoglobin', 'absorption spectroscopy'],
      refs: ['Prince–Links ch. 4'],
      scope: String.raw`Beer–Lambert with no scattering: real devices need the empirical calibration (the two curves differ), and accuracy degrades below about 70% saturation. The extinction coefficients are rounded values from the standard compilation (from Prahl's tabulation at omlc.org; not a substitute for it); the carboxyhaemoglobin spectrum is a schematic one.`,
      viz(v) {
        const SP = v.stage({ x: [600, 1000], y: [300, 20000], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'wavelength (nm)', ylabel: 'extinction $\\varepsilon$ (cm⁻¹/M)', title: 'Absorption spectra of haemoglobin' });
        const WV = v.stage({ x: [0, 4], y: [0.96, 1.04], axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'time (s)', ylabel: 'transmitted light ÷ its DC level', title: 'Pulse at the two wavelengths' });
        const RD = v.stage({ x: [50, 100], y: [40, 105], axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'true saturation $S$ (%)', ylabel: 'oximeter reading (%)', title: 'Reading against truth' });
        const sat = v.slider('arterial saturation $S$ (%)', 50, 100, 90, { step: 1, int: true });
        const co = v.slider('carboxyhaemoglobin (% of total Hb)', 0, 40, 0, { step: 1, int: true });
        const l1 = v.slider('red LED $\\lambda_1$ (nm)', 600, 720, 660, { step: 10, int: true });
        const l2 = v.slider('infrared LED $\\lambda_2$ (nm)', 780, 1000, 940, { step: 10, int: true });
        const amp = v.slider('pulse strength $c\\,\\Delta d$ (mm of blood)', 0.02, 0.4, 0.1, { log: true, sig: 2 });
        const mixEps = (l, S, c) => { const e = eps(l); return S * (1 - c) * e.o + (1 - S) * (1 - c) * e.d + c * e.c; };
        const Rof = (S, c, a, b) => mixEps(a, S, c) / mixEps(b, S, c);
        const invert = (R, a, b) => { const e1 = eps(a), e2 = eps(b); return ((e1.d - R * e2.d) / ((e1.d - e1.o) + R * (e2.o - e2.d))) * 100; };
        const wave = (t) => { const p = (t * 1.2) % 1; return Math.exp(-(((p - 0.18) / 0.09) ** 2)) + 0.35 * Math.exp(-(((p - 0.5) / 0.12) ** 2)); };
        let st = null;
        v.render(() => {
          const S = sat.value / 100, c = co.value / 100, a = l1.value, b = l2.value;
          SP.fn((l) => hbAt(l).o, { color: 'red', width: 2.2, domain: [600, 1000], n: 200 });
          SP.fn((l) => hbAt(l).d, { color: 'accent', width: 2.2, domain: [600, 1000], n: 200 });
          SP.vline(a, { color: 'orange', width: 2 }); SP.vline(b, { color: 'purple', width: 2 });
          SP.text('HbO₂', 980, hbAt(980).o, { align: 'right', baseline: 'bottom', dy: -4, color: 'red', size: 12 });
          SP.text('Hb', 640, hbAt(640).d, { align: 'left', baseline: 'bottom', dx: 4, dy: -4, color: 'accent', size: 12 });
          const e1 = mixEps(a, S, c), e2 = mixEps(b, S, c), cc = 2.3e-3, dd = amp.value * 0.1; // cm of blood path change; 2.3 mmol/L haemoglobin
          const pulse = (e) => (t) => Math.exp(-e * cc * dd * wave(t) * 1.0) / Math.exp(-e * cc * dd * 0.35);
          WV.fn(pulse(e1), { color: 'orange', width: 2.2, domain: [0, 4], n: 400 });
          WV.fn(pulse(e2), { color: 'purple', width: 2.2, domain: [0, 4], n: 400 });
          // reading against truth
          RD.line(50, 50, 100, 100, { color: 'faint', dash: true, width: 1 });
          RD.fn((s) => invert(Rof(s / 100, 0, a, b), a, b), { color: 'green', width: 2.2, domain: [50, 100], n: 100 });
          RD.fn((s) => clamp(110 - 25 * Rof(s / 100, 0, a, b), 0, 100), { color: 'orange', dash: true, width: 2, domain: [50, 100], n: 100 });
          if (c > 0) RD.fn((s) => invert(Rof(s / 100, c, a, b), a, b), { color: 'red', width: 2.2, domain: [50, 100], n: 100 });
          const R = Rof(S, c, a, b), est = invert(R, a, b);
          RD.dot(sat.value, Math.min(est, 104), { color: 'gold', r: 7 });
          st = { R, est, emp: clamp(110 - 25 * R, 0, 100), S, c, trueO: 100 * S * (1 - c), ac1: (1 - Math.exp(-e1 * cc * dd * 0.5)) * 100, ac2: (1 - Math.exp(-e2 * cc * dd * 0.5)) * 100, e1, e2 };
        });
        v.legend([['red', 'HbO₂'], ['accent', 'Hb'], ['orange', 'red LED'], ['purple', 'infrared LED'], ['green', 'ideal inversion'], ['orange', 'empirical $110-25R$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `Pulsatile absorbance per mm of blood: red $${fx(st.e1 * 2.3e-3 * 0.1, 4)}$, infrared $${fx(st.e2 * 2.3e-3 * 0.1, 4)}$, ratio of ratios $R=${fx(st.R, 3)}$.\nTrue ${st.c > 0 ? `HbO₂ fraction of all haemoglobin $${fx(st.trueO, 1)}\\%$ (COHb ${fx(100 * st.c, 0)}\\%)` : `saturation $${fx(100 * st.S, 0)}\\%$`}; Beer–Lambert inversion reads $${fx(st.est, 1)}\\%$; empirical calibration $${fx(st.emp, 1)}\\%$.${st.c > 0 ? `\nCarboxyhaemoglobin looks like HbO₂ at 660 nm and is almost invisible at 940 nm, so the meter counts it as oxygenated: it over-reads by $${fx(st.est - st.trueO, 1)}$ points.` : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Paper',
      name: 'Ueber eine neue Art von Strahlen',
      paper: { authors: 'W. C. Röntgen', year: 1895, title: 'Ueber eine neue Art von Strahlen (Vorläufige Mittheilung)', venue: 'Sitzungsberichte der Physikalisch-medicinischen Gesellschaft zu Würzburg (1895)', url: 'https://archive.org/details/b30475697' },
      introduces: ['imaging-2.1'],
      statement: String.raw`In this preliminary communication Röntgen reported that a discharge tube, even when wrapped in black cardboard, makes a screen coated with barium platinocyanide glow at a distance of a couple of metres. He concluded that the tube emits a previously unknown radiation, which he called X-rays: they are not deflected by magnets, are not reflected or refracted appreciably, travel in straight lines, blacken photographic plates, and **penetrate matter to very different degrees**: paper, a thick book and wood let most of it through, aluminium of a centimetre or more only weakens it, and metals such as lead block it, with lead glass much more opaque than ordinary glass. Shadow images show that bone is more opaque than flesh, and he saw the bones of a living hand as shadows on the screen (the radiograph of his wife's hand, the first of his photographs to become famous, went out with reprints in January 1896). This is the founding observation of projection radiography: a transmission shadow whose darkness records the path-integrated attenuation, which depends on composition (atomic number) and not on density alone.`,
      idea: String.raw`Before the paper, cathode rays (electrons) had been studied outside discharge tubes by Hertz and Lenard, but only over a few centimetres of air. Röntgen noticed a glowing screen far beyond that range, set aside everything else for seven weeks and systematically tested which materials stop the new rays and what they do, which showed that they were not cathode rays. He introduced the **name and the concept of X-rays**, the shadow-image method and the first radiographs; the physics of how they are made (stopping of electrons in the anode, imaging-2.1) was worked out later, and their wave nature was shown by von Laue's crystal diffraction in 1912. Röntgen received the first Nobel Prize in Physics in 1901.`,
      caption: String.raw`A fluorescent screen glows green where X-rays arrive; the bright screen on the right shows an open beam above and, below it, the beam behind a slab of the **material** and **thickness** you choose, and on the left the shadow of a hand, soft tissue grey and bones dark. The curves show the fraction transmitted against thickness for each material at the chosen tube voltage (modelled with a modern tungsten-tube spectrum, since Röntgen's tube and voltage are not known). Check his claims: 15 mm of aluminium weakens but does not stop the glow, a millimetre or two of lead extinguishes it, and lead glass is far more opaque than ordinary glass of the same thickness.`,
      deps: [],
      tags: ['X-rays', 'discovery', 'radiography'],
      refs: [],
      credit: 'Röntgen, 28 Dec 1895',
      scope: String.raw`The pictures are a modern model (Kramers spectrum, attenuation model calibrated to NIST XCOM) of what Röntgen observed: they reproduce which materials block and which pass the rays, not his quantitative measurements, which were qualitative. The tube voltage he used is unknown, and the observed screen brightness depends on the screen and the eye.`,
      viz(v) {
        const SC = v.stage({ x: [0, 160], y: [-9, 109], equal: true, axes: false, height: 340, minWidth: 300, title: 'The fluorescent screen' });
        const TC = v.stage({ x: [0.05, 100], y: [1e-4, 1.3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'thickness (mm)', ylabel: 'fraction of the light transmitted', title: 'Transmission through each material' });
        const kv = v.slider('tube voltage (kVp)', 20, 100, 45, { step: 1, int: true });
        const mats = [['paper', 'paper', 'faint'], ['wood', 'wood', 'orange'], ['glass', 'glass', 'teal'], ['aluminium', 'aluminium', 'accent'], ['leadglass', 'lead glass', 'purple'], ['lead', 'lead', 'red']];
        const mat = v.select('slab', mats.map(([k, l]) => ({ value: k, label: l })), 'aluminium');
        const th = v.slider('slab thickness (mm)', 0.05, 100, 15, { log: true, sig: 2 });
        // hand model (screen coordinates)
        const dseg = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1); return [Math.hypot(px - ax - t * dx, py - ay - t * dy), t]; };
        const fingers = [[[28, 50], [26, 88], 4.2], [[37, 52], [37, 95], 4.4], [[46, 51], [48, 90], 4.2], [[54, 46], [60, 78], 3.6], [[22, 34], [6, 62], 4.6]];
        const hand = (x, y) => {
          let ts = 0, tb = 0;
          const pr = ((x - 40) / 21) ** 2 + ((y - 36) / 19) ** 2; if (pr < 1) ts = Math.max(ts, 2.6 * Math.sqrt(1 - pr));
          if (x > 29 && x < 52 && y < 20) ts = Math.max(ts, 2.4 * Math.sqrt(1 - ((x - 40.5) / 11.5) ** 2));
          for (const [a, b, r] of fingers) {
            const [d, t] = dseg(x, y, a[0], a[1], b[0], b[1]); if (d < r) ts = Math.max(ts, 1.9 * Math.sqrt(1 - (d / r) ** 2));
            if (d < 1.5 && t > 0.04 && t < 0.98) { const g = (t * 3) % 1; if (g > 0.07 && g < 0.93) tb = Math.max(tb, 1.0 * Math.sqrt(1 - (d / 1.5) ** 2)); }
            const base = [a[0] + 0.0 * (b[0] - a[0]), a[1] - 20];
            const [d2] = dseg(x, y, base[0] + (a[0] - 40) * 0.3, base[1] - 4, a[0], a[1] - 2); if (d2 < 1.7 && a !== fingers[4][0]) tb = Math.max(tb, 1.3 * Math.sqrt(1 - (d2 / 1.7) ** 2));
          }
          const cr = ((x - 40) / 11) ** 2 + ((y - 20) / 6) ** 2; if (cr < 1) tb = Math.max(tb, 1.6 * Math.sqrt(1 - cr));
          const [dr] = dseg(x, y, 35, 4, 38, 18); if (dr < 2.4) tb = Math.max(tb, 1.3 * Math.sqrt(1 - (dr / 2.4) ** 2));
          return [ts, tb];
        };
        let lut = { key: '' };
        const getLut = () => {
          const key = `${kv.value}`;
          if (lut.key !== key) {
            const sp = tubeSpectrum(kv.value, 'W', 1.0), I0 = energyFluence(sp.N, sp.E), tabT = [];
            for (let i = 0; i <= 13; i++) { const row = []; for (let j = 0; j <= 10; j++) row.push(energyFluence(transmit(sp.N, sp.E, [[MATS.tissue, i * 0.2], [MATS.bone, j * 0.2]]), sp.E) / I0); tabT.push(row); }
            lut = { key, sp, I0, tabT };
          }
          return lut;
        };
        const lutT = (ts, tb) => { const L = lut.tabT, fi = clamp(ts / 0.2, 0, 12.999), fj = clamp(tb / 0.2, 0, 9.999), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j; return (1 - a) * ((1 - b) * L[i][j] + b * L[i][j + 1]) + a * ((1 - b) * L[i + 1][j] + b * L[i + 1][j + 1]); };
        const slabT = (k, mm) => { const l = getLut(); return energyFluence(transmit(l.sp.N, l.sp.E, [[MATS[k], mm * 0.1]]), l.sp.E) / l.I0; };
        const glow = (T) => { const b = Math.pow(clamp(T, 0, 1), 0.5); return [Math.round(14 + 70 * b), Math.round(26 + 215 * b), Math.round(16 + 100 * b)]; };
        let st = null;
        v.render(() => {
          getLut();
          const Ts = slabT(mat.value, th.value), key = `${kv.value}|${mat.value}|${th.value}`;
          SC.raster((x, y) => {
            if (x < 0 || x > 160 || y < 0 || y > 100) return null;
            if (x < 75) { const [ts, tb] = hand(x, y); return glow(ts === 0 && tb === 0 ? 1 : lutT(ts, tb)); }
            if (x > 85 && x < 152) { if (y > 62 && y < 94) return glow(1); if (y > 8 && y < 46) return glow(Ts); }
            return [14, 26, 16];
          }, { res: 3, key, id: 'scr' });
          SC.text('open beam', 118, 104, { align: 'center', size: 12, color: 'ink' });
          SC.text(`behind ${mats.find((m) => m[0] === mat.value)[1]} ${fx(th.value, th.value < 1 ? 2 : 1)} mm`, 118, -5, { align: 'center', size: 12, color: 'ink' });
          SC.rect(85, 62, 152, 94, { color: [150, 190, 155], width: 1 }); SC.rect(85, 8, 152, 46, { color: [150, 190, 155], width: 1 });
          for (const [k, l, c] of mats) TC.fn((x) => slabT(k, x), { color: c, width: k === mat.value ? 3 : 1.6, alpha: k === mat.value ? 1 : 0.75, domain: [0.05, 100], n: 60 });
          TC.hline(0.01, { color: 'faint', dash: true, width: 1 });
          TC.vline(th.value, { color: 'gold', width: 1.5 }); TC.dot(th.value, Math.max(Ts, 1.2e-4), { color: 'gold', r: 6 });
          const l = getLut();
          st = { Ts, al15: slabT('aluminium', 15), pb: slabT('lead', 1.5), gl: slabT('glass', 3), lg: slabT('leadglass', 3), wood: slabT('wood', 25), book: slabT('paper', 60), hv: hvlOf(l.sp.N, l.sp.E, MATS.aluminium) * 10, me: meanEnergy(l.sp.N, l.sp.E) };
        });
        v.legend(mats.map(([k, l, c]) => [c, l]));
        v.readout(() => {
          if (!st) return '';
          return `Chosen slab: $${fx(100 * st.Ts, st.Ts < 0.01 ? 3 : 1)}\\%$ of the light gets through. Röntgen's qualitative claims against the model at ${kv.value} kVp (mean photon energy $${fx(st.me, 0)}$ keV, HVL $${fx(st.hv, 1)}$ mm Al): a 25 mm board passes $${fx(100 * st.wood, 0)}\\%$; a 60 mm stack of paper (a thick book) $${fx(100 * st.book, 0)}\\%$; 15 mm of aluminium $${fx(100 * st.al15, 1)}\\%$ (weakened, not stopped); 1.5 mm of lead $${pc(st.pb)}$ (opaque); 3 mm of lead glass $${pc(st.lg)}$ against $${fx(100 * st.gl, 0)}\\%$ for ordinary glass.`;
        });
      },
    },
  ],
};
