// Visual Art & Color — Chapter 3: Light, spectra and colour mixing (items 3.8–3.13; 3.1–3.7 are in ch03.js)
import { cmf, cmfT, specRGB, rgbOf, spdXYZ, xyOf, xyz2lin, lin2srgb, planck, bbXYZ, gauss, sigm, nBK7, specBars, drawChromaticity, dominant, LOCUS, rayleighTau, airmassKY, stackR, NEWTON, circPt, arcCentroid, newtonMix, arcAt, mixXYZ, prismXYZ, prismShift, rad, deg } from './ch03.shared.js';

const C2NM = 1.438776877e7;
/** A rough colour name from a dominant wavelength (conventional bands) and purity. */
function colourName(d) {
  if (!d || !d.l) return 'neutral';
  if (d.purity < 0.12) return 'nearly neutral';
  if (d.purple) return 'magenta–purple';
  const l = d.l;
  return l < 450 ? 'violet' : l < 485 ? 'blue' : l < 500 ? 'cyan' : l < 565 ? 'green' : l < 590 ? 'yellow' : l < 625 ? 'orange' : 'red';
}
const xyzToDom = (c) => { const xy = xyOf(c); return dominant(xy[0], xy[1]); };

export default {
  collection: 'art',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Blue sky and red sunsets: Rayleigh scattering',
      credit: 'Lord Rayleigh (J. W. Strutt), Philosophical Magazine, 1871 (the inverse-fourth-power law); Bodhaine et al., 1999 (the optical-depth formulas used here)',
      statement: String.raw`Air molecules are much smaller than the wavelength of light, and a molecule scatters light with a cross-section proportional to $\lambda^{-4}$. A beam of sunlight that crosses a thickness of air with zenith optical depth $\tau(\lambda)\propto\lambda^{-4}$ along a slant path of relative air mass $m$ keeps the fraction $e^{-\tau(\lambda)m}$ of each wavelength, and the rest, $1-e^{-\tau m}$, is scattered out of the beam. The scattered light is therefore rich in short wavelengths, which is the blue of the sky, while the direct beam, stripped of its blues, goes yellow, orange and red as the sun sinks and $m$ grows from $1$ at the zenith to about $38$ at the horizon.`,
      idea: String.raw`Each molecule is a driven dipole radiating with power $\propto\omega^4$ (em-12.8); summing over the molecules of a column of air gives an optical depth $\propto\lambda^{-4}$ (about $0.097$ at 550 nm and $0.22$ at 450 nm for the whole atmosphere), and the Beer–Lambert bookkeeping of art-3.6 turns it into a transmittance. The light removed from the direct beam is exactly the light added to the sky, so the sky has the colour of $S_0(1-e^{-\tau m})$ and the sun has the colour of $S_0e^{-\tau m}$. The sky is not violet, although violet is scattered more, because the sun emits less violet than blue, and the eye is far less sensitive to violet, so the cone responses to the scattered light add up to a blue.`,
      caption: String.raw`Move the sun down the sky. The grey curve is the sun’s spectrum above the atmosphere, the coloured bars what survives in the direct beam; the shaded gap between them is what has been scattered into the sky. The three swatches compare the sun above the air, the sun through it, and the scattered light. The exponent slider is a what-if: for particles as large as the wavelength (haze, cloud droplets) the scattering is nearly colour-blind, so the sun stays white and the sky turns whitish.`,
      deps: ['art-3.2', 'em-12.8'],
      refs: ['Kemp ch. 7'],
      tags: ['Rayleigh', 'scattering', 'sky'],
      scope: String.raw`Single scattering by air molecules in the sea-level standard atmosphere, with the sun as a $5772$ K black body and the air-mass law of Kasten & Young (1989). The Rayleigh optical depth is computed from the formulas of Bodhaine et al. (1999) as I took them from an open-source implementation, not from the paper; ozone absorption, aerosols and the real solar spectrum are ignored, so the numbers are indicative (real sunsets are also dimmed and reddened by aerosols).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rayleigh_scattering' },
      viz(v) {
        const elev = v.slider('sun elevation (°)', 0, 90, 30, { step: 0.1 });
        const alpha = v.slider('scattering exponent $\\alpha$ ($\\lambda^{-\\alpha}$; 4 = air molecules)', 0, 4, 4, { step: 0.05 });
        const dens = v.slider('amount of air (× the sea-level atmosphere)', 0.2, 4, 1, { step: 0.05, log: true });
        const A = v.stage({ x: [-1.35, 1.35], y: [0.62, 1.5], equal: true, axes: false, height: 320, weight: 0.9, title: 'sunlight crossing the atmosphere (shell exaggerated)' });
        const S = v.stage({ x: [380, 780], y: [0, 1.08], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'relative power', height: 320, weight: 1.1, title: 'direct beam and scattered light' });
        const Sw = v.stage({ x: [0, 9], y: [0, 2.6], axes: false, height: 150, full: true, title: 'colours at equal brightness: the sun above the air, the sun through the air, the scattered light' });
        const S0 = (l) => planck(l, 5772), S0max = (() => { let m = 0; for (let l = 380; l <= 780; l += 2) m = Math.max(m, S0(l)); return m; })();
        const tau550 = rayleighTau(550);
        const wl0 = xyz2lin(spdXYZ(S0, 5));
        const disp = (c) => { const l = xyz2lin(c).map((u, i) => Math.max(0, u / wl0[i])), m = Math.max(...l, 1e-9); return lin2srgb(l.map((u) => (0.88 * u) / m)); };
        let info = {};
        v.render(() => {
          const h = elev.value, m = airmassKY(90 - h), a = alpha.value, k = dens.value;
          const tau = (l) => k * (Math.abs(a - 4) < 0.01 ? rayleighTau(l) : tau550 * Math.pow(550 / l, a));
          const direct = (l) => S0(l) * Math.exp(-tau(l) * m), scat = (l) => S0(l) - direct(l);
          // atmosphere sketch: Earth, a shell, the observer at the top, the sun's ray
          const R = 1, T = 0.2, hr = rad(h), obs = [0, R];
          A.clip(() => {
            A.circle(0, 0, R + T, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1 });
            A.circle(0, 0, R, { fill: 'ink', fillAlpha: 0.22, color: 'muted', width: 1.4 });
          });
          const d = [Math.cos(hr), Math.sin(hr)], b = obs[0] * d[0] + obs[1] * d[1], t = -b + Math.sqrt(b * b - (R * R - (R + T) ** 2)), top = [obs[0] + t * d[0], obs[1] + t * d[1]];
          const far = [obs[0] + (t + 0.9) * d[0], obs[1] + (t + 0.9) * d[1]];
          const dc = disp(spdXYZ(direct, 5));
          A.line(far[0], far[1], top[0], top[1], { color: [255, 220, 120], width: 3 });
          A.line(top[0], top[1], obs[0], obs[1], { color: dc, width: 4 });
          const sc = disp(spdXYZ(scat, 5));
          for (let i = 1; i <= 5; i++) { const p = [obs[0] + (t * i) / 6 * d[0], obs[1] + (t * i) / 6 * d[1]]; A.arrow(p[0], p[1], p[0] - 0.16 * d[1], p[1] + 0.16 * d[0], { color: sc, width: 2 }); A.arrow(p[0], p[1], p[0] + 0.16 * d[1], p[1] - 0.16 * d[0], { color: sc, width: 2 }); }
          A.dot(obs[0], obs[1], { r: 5, color: 'ink', label: 'you', labelPos: 's' });
          A.text(`air mass $m=${v.fix(m, 2)}$`, -1.28, 1.42, { size: 12, color: 'ink', align: 'left' });
          A.text('sun', far[0], far[1] + 0.07, { size: 11, color: 'muted', align: 'center' });
          // spectra
          S.between((l) => direct(l) / S0max, (l) => S0(l) / S0max, 380, 780, { fill: 'accent', fillAlpha: 0.18 });
          specBars(S, (l) => direct(l) / S0max, 380, 780, 2, { alpha: 0.9 });
          S.fn((l) => S0(l) / S0max, { color: 'muted', width: 1.6, domain: [380, 780], n: 200 });
          S.text('scattered into the sky', 392, 0.62, { size: 11, color: 'accent', align: 'left' });
          // swatches
          const Y0 = spdXYZ(S0, 5)[1];
          const sw = [['sun above the air', disp(spdXYZ(S0, 5))], ['sun through the air', dc], ['scattered light', sc]];
          sw.forEach(([nm, col], i) => { Sw.rect(0.2 + i * 3, 0.55, 2.8 + i * 3, 2.4, { fill: col, stroke: false, fillAlpha: 1, radius: 8 }); Sw.text(nm, 1.5 + i * 3, 0.4, { size: 11, color: 'muted', align: 'center', baseline: 'top' }); });
          const ys = spdXYZ(direct, 5)[1] / Y0, xyD = xyOf(spdXYZ(direct, 5)), xyS = xyOf(spdXYZ(scat, 5));
          info = { m, ys, T450: Math.exp(-tau(450) * m), T650: Math.exp(-tau(650) * m), t450: tau(450), t650: tau(650), t550: tau(550), dd: dominant(xyD[0], xyD[1]), ds: dominant(xyS[0], xyS[1]), a };
        });
        v.legend([['muted', 'sun above the air'], ['accent', 'what the air scatters away']]);
        v.readout(() => `zenith optical depth $\\tau(450)=${v.fix(info.t450, 3)}$, $\\tau(550)=${v.fix(info.t550, 3)}$, $\\tau(650)=${v.fix(info.t650, 3)}$ (the ratio $\\tau(450)/\\tau(650)$ is $${v.fix(info.t450 / info.t650, 2)}$; a pure $\\lambda^{-4}$ law would give $${v.fix((650 / 450) ** 4, 2)}$) · air mass $m=${v.fix(info.m, 2)}$\ndirect beam keeps $${v.fix(100 * info.T450, info.T450 < 0.01 ? 3 : 1)}\\%$ of the 450 nm light but $${v.fix(100 * info.T650, 1)}\\%$ of the 650 nm light, and $${v.fix(100 * info.ys, 1)}\\%$ of the luminance: the sun looks ${colourName(info.dd)}; the scattered light looks ${colourName(info.ds)}`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Phenomenon',
      name: 'Iridescence and structural colour in nature and art',
      credit: 'Newton, Opticks, 1704 (colours of thin plates); Thomas Young, Phil. Trans. 1802 (the interference explanation); structural colours in nature reviewed by Kinoshita & Yoshioka, ChemPhysChem, 2005',
      statement: String.raw`A thin transparent film of index $n$ and thickness $d$ reflects light from its two faces, and the two reflected waves interfere. At angle of refraction $\theta_t$ the path difference gives constructive reflection of wavelengths
$$\lambda_m=\frac{2\,n\,d\cos\theta_t}{m+\tfrac12},\qquad m=0,1,2,\dots$$
for a film with one phase flip, such as a soap film in air, and destructive reflection at $\lambda=2nd\cos\theta_t/m$. So the reflected colour changes with the thickness and, because $\cos\theta_t$ falls as the viewing angle grows, shifts toward the blue as the film is tilted: **iridescence**. The same arithmetic applies to a stack of $N$ alternating layers, whose reflection peak at $\lambda_B\approx2\sum n_jd_j\cos\theta_j$ sharpens as $N$ grows; many beetle shells and bird feathers are coloured by structures of this kind, with no pigment involved.`,
      idea: String.raw`The reflected spectrum is the squared magnitude of the sum of reflected waves, so it oscillates with $1/\lambda$ and the colour is whatever the surviving wavelengths look like (thin-film interference, waves-6.5). The picture is computed with the characteristic-matrix method for lossless layers, which includes the Fresnel amplitudes at each face and the multiple internal reflections; the simple formula above is its first approximation. Because the colour comes from structure and not from absorption, it cannot be mixed like paint (art-3.7): it changes with the angle, and it is brightest on a dark background.`,
      caption: String.raw`Choose a structure and move the thickness and the viewing angle: the curve is the computed reflectance, its colour what the eye sees under daylight-like light (brightness boosted $\times10$). The strips show the colour for every thickness at the chosen angle, and for every angle at the chosen thickness. The round picture is a bubble or a shell: the viewing angle grows from the middle to the rim, and (for the films) the film is thin at the top and thick at the bottom. A very thin film reflects almost nothing (the black film of a bubble about to burst).`,
      deps: ['art-3.2', 'waves-6.5'],
      refs: ['Kemp ch. 7'],
      tags: ['interference', 'thin film', 'structural colour'],
      scope: String.raw`Lossless layers with constant refractive index (no dispersion, no absorption; real melanin absorbs), flat parallel interfaces, unpolarised light. The multilayer is a **generic model** with indices $1.9$ and $1.5$ on a substrate of index $1.5$, not a measurement of any feather or beetle; peacock barbules, for instance, are a two-dimensional photonic crystal of melanin rods (Zi et al., 2003), which this one-dimensional stack only imitates.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Iridescence' },
      viz(v) {
        const mode = v.select('structure', [{ value: 'soap', label: 'soap film in air' }, { value: 'oil', label: 'oil film (n = 1.47) on water' }, { value: 'stack', label: 'multilayer stack' }], 'soap');
        const dF = v.slider('film thickness (nm)', 0, 1500, 320, { step: 1 });
        const dS = v.slider('layer thickness (nm)', 40, 160, 80, { step: 1 });
        const Np = v.slider('periods $N$', 1, 15, 6, { step: 1, int: true });
        const th = v.slider('viewing angle from the normal (°)', 0, 85, 0, { step: 1 });
        const Sp = v.stage({ x: [380, 780], y: [0, 0.2], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'reflectance $R$', height: 300, weight: 1.05, title: 'reflected spectrum' });
        const B = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: false, height: 300, weight: 0.7, minWidth: 220, title: 'a bubble or a shell, seen from the front' });
        const St = v.stage({ x: [0, 1], y: [0, 2.5], axes: false, height: 160, full: true, title: 'colour against thickness (top) and against viewing angle (bottom)' });
        const ill = (l) => planck(l, 6504), Y0 = spdXYZ(ill, 5)[1];
        const struct = (m, d, np) => {
          if (m === 'soap') return { layers: [[1.33, d]], n0: 1, ns: 1 };
          if (m === 'oil') return { layers: [[1.47, d]], n0: 1, ns: 1.33 };
          const L = []; for (let i = 0; i < np; i++) { L.push([1.9, d], [1.5, (d * 1.9) / 1.5]); } return { layers: L, n0: 1, ns: 1.5 };
        };
        const colourOf = (m, d, np, ang, step = 10) => {
          const s = struct(m, d, np); let X = 0, Y = 0, Z = 0;
          for (let l = 380; l <= 780; l += step) { const c = cmfT(l), r = stackR(s.layers, s.n0, s.ns, l, ang) * ill(l); X += r * c[0]; Y += r * c[1]; Z += r * c[2]; }
          const k = (10 * step) / (Y0 * 5); return rgbOf([X * k, Y * k, Z * k]);
        };
        let info = {};
        v.render(() => {
          const m = mode.value, d = m === 'stack' ? dS.value : dF.value, np = Np.value, ang = th.value;
          dF.el.hidden = m === 'stack'; dS.el.hidden = m !== 'stack'; Np.el.hidden = m !== 'stack';
          const s = struct(m, d, np), R = (l) => stackR(s.layers, s.n0, s.ns, l, ang);
          let rmax = 0.02; const pts = []; for (let l = 380; l <= 780; l += 4) { const r = R(l); pts.push([l, r]); rmax = Math.max(rmax, r); }
          Sp.setView([380, 780], [0, rmax * 1.2]);
          specBars(Sp, (l) => R(l), 380, 780, 4, { alpha: 0.85 });
          Sp.path(pts, { color: 'ink', width: 1.6 });
          // bubble / shell: viewing angle grows from the centre, film thin at the top
          B.raster((x, y) => {
            const r = Math.hypot(x, y); if (r > 1) return null;
            const a = deg(Math.asin(r)), dd = m === 'stack' ? d : dF.value * (0.04 + 0.96 * (1 - (y + 1) / 2));
            const c = colourOf(m, dd, np, a, 20); return [c[0], c[1], c[2], 1];
          }, { res: 5, key: `${m}|${d}|${np}|${dF.value}` });
          B.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          // strips
          const NC = 90;
          for (let k = 0; k < NC; k++) {
            const u = (k + 0.5) / NC, dd = m === 'stack' ? 40 + 120 * u : 1500 * u;
            St.rect(k / NC, 1.35, (k + 1) / NC + 0.002, 2.4, { fill: colourOf(m, dd, np, ang, 20), stroke: false, fillAlpha: 1 });
            St.rect(k / NC, 0.1, (k + 1) / NC + 0.002, 1.15, { fill: colourOf(m, d, np, 85 * u, 20), stroke: false, fillAlpha: 1 });
          }
          const xd = m === 'stack' ? (d - 40) / 120 : d / 1500;
          St.line(xd, 1.3, xd, 2.45, { color: 'ink', width: 2 }); St.line(ang / 85, 0.05, ang / 85, 1.2, { color: 'ink', width: 2 });
          St.text(m === 'stack' ? 'layer 40 nm → 160 nm' : 'thickness 0 → 1500 nm', 0.005, 2.48, { size: 10.5, color: 'muted', align: 'left', baseline: 'top', plate: true });
          St.text('angle 0° → 85°', 0.005, 1.22, { size: 10.5, color: 'muted', align: 'left', baseline: 'top', plate: true });
          // numbers: predicted constructive wavelengths and the peaks found in the computed curve
          const n = m === 'oil' ? 1.47 : m === 'soap' ? 1.33 : 0, cst = Math.sqrt(1 - (Math.sin(rad(ang)) / (n || 1)) ** 2);
          let pred = [], found = [];
          if (m !== 'stack') {
            for (let q = 0; q < 8; q++) { const l = (2 * n * d * cst) / (q + 0.5); if (l >= 400 && l <= 740) pred.push(l); }
            for (const l0 of pred) { let bl = l0, br = -1; for (let l = l0 - 25; l <= l0 + 25; l += 0.5) { const r = R(l); if (r > br) { br = r; bl = l; } } found.push(bl); }
          } else {
            const lb = 2 * np * 0 + 2 * (1.9 * d + 1.5 * ((d * 1.9) / 1.5)) / 1; pred = [lb * Math.sqrt(1 - (Math.sin(rad(ang)) / 1.7) ** 2) / 1];
            let bl = 0, br = -1; for (let l = 380; l <= 900; l += 1) { const r = R(l); if (r > br) { br = r; bl = l; } } found = [bl];
          }
          info = { pred, found, rmax: Math.max(...pts.map((p) => p[1])), m };
        });
        v.legend([['ink', 'computed reflectance']]);
        v.readout(() => info.m === 'stack'
          ? `Bragg estimate $\\lambda_B\\cos\\theta\\approx${v.fix(info.pred[0], 0)}$ nm, highest peak of the computed curve in 380–900 nm: ${v.fix(info.found[0], 0)} nm (the estimate is rough: it neglects the angle inside each layer and the index step to the substrate) · peak reflectance $${v.fix(info.rmax, 2)}$`
          : `constructive wavelengths $2nd\\cos\\theta_t/(m+\\tfrac12)$ in the visible: ${info.pred.length ? info.pred.map((l) => v.fix(l, 0)).join(', ') + ' nm' : 'none'}; peaks of the computed reflectance: ${info.found.length ? info.found.map((l) => v.fix(l, 0)).join(', ') + ' nm' : 'none'} · peak reflectance $${v.fix(info.rmax, 3)}$${info.rmax < 0.01 ? ' (almost no light: the “black film”)' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Concept',
      name: 'Black-body radiation and colour temperature',
      credit: 'Max Planck, 1900; Wien’s displacement law, 1893',
      statement: String.raw`A body in thermal equilibrium that absorbs all light falling on it emits the **Planck spectrum**
$$B_\lambda(T)=\frac{2hc^2}{\lambda^5}\,\frac{1}{e^{hc/\lambda k_BT}-1},$$
whose peak sits at $\lambda_{\max}=b/T$ with $b=2.897771955\times10^{-3}\ \text{m}\,\text{K}$ (Wien’s law). Hotter bodies radiate more at every wavelength and shift toward the blue, so the colour of a glowing body is a one-parameter family of chromaticities, the **Planckian locus**, running from deep red at about $1000$ K through orange, yellow-white and white to bluish white. The **colour temperature** of a light is the temperature of the black body whose colour it best matches.`,
      idea: String.raw`Planck’s quantum hypothesis (qm-1.1; thermo-9.4) supplies the cut-off at short wavelengths, and the integral of the spectrum against the colour-matching functions (art-3.2) turns each temperature into a point $(x,y)$ on the chromaticity diagram. The colour is not the colour of the peak: the Sun’s spectrum peaks near 500 nm, which would be green, yet it looks white, because the spectrum is so broad that all three cones respond about equally. Only a body whose peak lies far into the infrared (below 3000 K) looks distinctly orange or red, and only a very hot one looks blue.`,
      caption: String.raw`Drag the temperature: the left panel shows the Planck spectrum, normalised at its peak, on a logarithmic wavelength axis, with the visible band shaded and coloured; the right panel shows where the colour sits on the chromaticity diagram, with the Planckian locus; the strip underneath is the colour of the glow from 1000 K to 12 000 K. The buttons jump to a few reference temperatures. Look at the Sun: its peak is green, its colour nearly white.`,
      deps: ['art-3.2', 'qm-1.1', 'thermo-9.4'],
      refs: ['Fairchild ch. 3'],
      tags: ['Planck', 'colour temperature', 'black body'],
      scope: String.raw`An ideal black body in the standard-observer model; real glowing bodies have emissivities that vary with wavelength. Displayed colours are the sRGB colours of the computed chromaticity at fixed luminance, so very low and very high temperatures are slightly desaturated by the gamut mapping. $5772$ K is the IAU nominal solar effective temperature, $2856$ K is CIE illuminant A and $6504$ K is the colour temperature of the daylight illuminant D65 (which is not exactly a black body).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Color_temperature' },
      viz(v) {
        const T = v.slider('temperature $T$ (K)', 1000, 12000, 5772, { log: true, sig: 3 });
        v.button('ember, 1000 K', () => T.set(1000)); v.button('lamp, 2856 K (CIE A)', () => T.set(2856)); v.button('the Sun, 5772 K', () => T.set(5772)); v.button('daylight, 6504 K', () => T.set(6504)); v.button('hot star, 10 000 K', () => T.set(10000));
        const Sp = v.stage({ x: [100, 6000], y: [0, 1.12], xlog: true, axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'spectrum / its peak', height: 330, weight: 1.15, title: 'Planck spectrum' });
        const X = v.stage({ x: [-0.02, 0.8], y: [-0.02, 0.9], equal: true, axes: false, height: 330, weight: 0.9, title: 'colour on the chromaticity diagram' });
        const Sw = v.stage({ x: [0, 1], y: [0, 1.7], axes: false, height: 120, full: true, title: 'the colour of the glow, 1000 K to 12 000 K (logarithmic)' });
        const loc = []; for (let t = 1000; t <= 20000; t *= 1.03) loc.push([t, ...xyOf(bbXYZ(t))]);
        const TOT = (t) => Math.pow(t / C2NM, 4) * Math.PI ** 4 / 15;
        let info = {};
        v.render(() => {
          const t = T.value, lm = 2.897771955e6 / t, pk = planck(lm, t), f = (l) => planck(l, t) / pk;
          Sp.vband(380, 780, { color: 'faint', alpha: 0.12 });
          specBars(Sp, f, 380, 780, 4, { alpha: 0.9 });
          Sp.fn(f, { color: 'ink', width: 2.2, domain: [100, 6000], n: 500 });
          Sp.vline(lm, { color: 'gold', width: 1.4, dash: [5, 4] });
          Sp.text(`peak ${v.fix(lm, 0)} nm`, lm * 1.08, 1.04, { size: 11, color: 'gold', align: 'left' });
          Sp.text('visible', 480, 0.04, { size: 10.5, color: 'muted', align: 'center' });
          drawChromaticity(X, v, { ticks: [460, 500, 540, 580, 620] });
          X.path(loc.map((p) => [p[1], p[2]]), { color: 'ink', width: 2.2 });
          for (const [tt, nm, dx, dy, al] of [[1000, '1000 K', 0.015, 0.03, 'left'], [2856, 'A', 0.0, 0.045, 'center'], [6504, 'D65', -0.02, -0.035, 'right'], [10000, '10 000 K', -0.02, 0.02, 'right']]) { const xy = xyOf(bbXYZ(tt)); X.dot(xy[0], xy[1], { r: 3.5, color: 'ink' }); X.text(nm, xy[0] + dx, xy[1] + dy, { size: 10, color: 'ink', align: al }); }
          const c = bbXYZ(t), xy = xyOf(c); X.dot(xy[0], xy[1], { r: 8, color: rgbOf(c, 0.7) }); X.dot(xy[0], xy[1], { r: 9, hollow: true, color: 'ink' });
          const NC = 100;
          for (let k = 0; k < NC; k++) { const tt = 1000 * Math.pow(12, (k + 0.5) / NC); Sw.rect(k / NC, 0.55, (k + 1) / NC + 0.002, 1.55, { fill: rgbOf(bbXYZ(tt), 0.7), stroke: false, fillAlpha: 1 }); }
          const xm = Math.log(t / 1000) / Math.log(12); Sw.line(xm, 0.4, xm, 1.65, { color: 'ink', width: 2.4 });
          for (const tt of [1000, 2000, 3000, 5000, 8000, 12000]) Sw.text(`${tt}`, Math.log(tt / 1000) / Math.log(12), 0.3, { size: 10.5, color: 'muted', align: tt === 1000 ? 'left' : tt === 12000 ? 'right' : 'center' });
          let vis = 0; for (let l = 380; l <= 780; l += 1) vis += planck(l, t);
          info = { lm, xy, vis: vis / TOT(t), dom: xyzToDom(c), rgb: rgbOf(c, 0.7) };
        });
        v.legend([['gold', 'Wien peak $\\lambda_{\\max}=b/T$'], ['ink', 'Planck spectrum, Planckian locus']]);
        v.readout(() => `peak at $\\lambda_{\\max}=b/T=${v.fix(info.lm, 0)}$ nm${info.lm > 780 ? ' (in the infrared)' : info.lm < 380 ? ' (in the ultraviolet)' : ' (visible)'} · colour $x=${v.fix(info.xy[0], 4)},\\ y=${v.fix(info.xy[1], 4)}$, looks ${colourName(info.dom)}${info.rgb.clip > 0.02 ? ' (shown desaturated: outside sRGB)' : ''} · fraction of the radiated power that is visible (380–780 nm), by integrating Planck’s law against the Stefan–Boltzmann total: $${v.fix(100 * info.vis, 1)}\\%$`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Goethe’s edge colours and the quarrel with Newton',
      credit: 'Johann Wolfgang von Goethe, Beiträge zur Optik (1791) and Zur Farbenlehre (1810)',
      statement: String.raw`Look through a prism at a boundary between a white and a dark area, with the prism turned so that the image is displaced across the boundary. The white area and the dark area keep their own colours, and coloured fringes appear only at the edge: where white lies on one side of the boundary, a fringe running from red to yellow; on the other, from blue to violet. A narrow white stripe shows both fringes overlapping into green in its middle; a narrow dark stripe on white shows a purple.

Goethe took the boundary of light and dark to be the origin of colour. Newton’s account of the same facts is that the image of the stripe is formed separately in each colour, and the images are displaced by slightly different amounts, so each fringe is a region where only some colours are present. The two accounts describe the same pictures; they differ in which one they take as basic (art-3.1).`,
      idea: String.raw`If $P(x)$ is the white/dark pattern, the prism shifts its image at wavelength $\lambda$ by $s(\lambda)$, larger for blue than for red (the dispersion of art-3.1), so the light at position $x$ contains exactly the wavelengths with $P(x-s(\lambda))=1$. Integrating those against the colour-matching functions gives the colour at $x$. A wide stripe leaves a zone of width $\Delta=s(400)-s(700)$ at each edge where only one end of the spectrum is present (blue-violet on one side, red-yellow on the other), and white in between; a stripe narrower than $\Delta$ leaves only the middle of the spectrum at its centre, which is green to yellow-green; and a dark stripe narrower than $\Delta$ leaves only the two ends, which mix to a purple or violet.`,
      caption: String.raw`Pick an edge, a white stripe or a black stripe, and change its width and the prism’s dispersion $\Delta$. The upper band shows what the eye sees without the prism, the lower band what it sees through it; the curves are the red, green and blue values along the strip. The bottom panel is Newton’s reading: the same scene in sixteen wavelengths, each displaced by its own refraction. Make the stripe narrower than $\Delta$ and watch a green appear in the middle of the white one, and a purple-violet in the black one.`,
      deps: ['art-3.1'],
      refs: ['Kemp ch. 7'],
      tags: ['Goethe', 'Newton', 'prism'],
      scope: String.raw`A linear model: a thin prism displaces the image of each wavelength sideways by an amount proportional to $n(\lambda)-n(550)$ (N-BK7 dispersion, normalised so that the red–violet displacement is $\Delta$), the card is lit by an equal-energy spectrum, and the eye is the CIE standard observer. It reproduces the fringe colours that Goethe described; it does not decide which of the two interpretations is the better philosophy of colour.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theory_of_Colours' },
      viz(v) {
        const prof = v.select('picture', [{ value: 'edge', label: 'single edge' }, { value: 'white', label: 'white stripe' }, { value: 'black', label: 'black stripe' }], 'white');
        const w = v.slider('stripe width $w$', 0.05, 3, 1.5, { step: 0.01 });
        const dl = v.slider('dispersion $\\Delta$ (red–violet displacement)', 0.1, 1.5, 0.6, { step: 0.01 });
        const sg = v.select('prism turned', [{ value: 1, label: 'blue to the right' }, { value: -1, label: 'blue to the left' }], 1);
        const Im = v.stage({ x: [-3, 3], y: [0, 2.2], axes: false, height: 170, full: true, title: 'what the eye sees: directly (upper band) and through the prism (lower band)' });
        const Pl = v.stage({ x: [-3, 3], y: [0, 1.1], axes: 'box', gutter: true, xlabel: 'position $x$', ylabel: 'sRGB value', height: 250, weight: 1, title: 'colour channels through the prism' });
        const Nw = v.stage({ x: [-3, 3], y: [0, 17], axes: false, height: 250, weight: 1, title: 'Newton’s reading: each colour’s own image' });
        const lams = Array.from({ length: 16 }, (_, i) => 700 - 20 * i);
        const ivs = () => (prof.value === 'edge' ? [[-9, 0]] : prof.value === 'white' ? [[-w.value / 2, w.value / 2]] : [[-9, -w.value / 2], [w.value / 2, 9]]);
        const Pf = (x) => (ivs().some(([a, b]) => x >= a && x <= b) ? 1 : 0);
        const wl = xyz2lin(prismXYZ(() => 1, 0, 0, 1));
        const show = (c) => { let l = xyz2lin(c).map((u, i) => Math.max(0, u / wl[i])); const m = Math.max(...l); if (m > 1) l = l.map((u) => u / m); return lin2srgb(l); };
        let info = {};
        v.render(() => {
          const D = dl.value, s = sg.value, N = 180, dx = 6 / N, ch = [[], [], []];
          for (let k = 0; k < N; k++) {
            const x = -3 + (k + 0.5) * dx, c0 = Pf(x) ? [235, 235, 235] : [18, 18, 22], c1 = show(prismXYZ(Pf, x, D, s));
            Im.rect(-3 + k * dx, 1.2, -3 + (k + 1) * dx + 0.003, 2.1, { fill: c0, stroke: false, fillAlpha: 1 });
            Im.rect(-3 + k * dx, 0.1, -3 + (k + 1) * dx + 0.003, 1.0, { fill: c1, stroke: false, fillAlpha: 1 });
            [0, 1, 2].forEach((j) => ch[j].push([x, c1[j] / 255]));
          }
          Pl.path([[-3, 0], ...ivs().flatMap(([a, b]) => [[Math.max(-3, a), 0], [Math.max(-3, a), 1], [Math.min(3, b), 1], [Math.min(3, b), 0]]), [3, 0]].filter(() => true), { color: 'faint', width: 1, dash: [4, 4] });
          Pl.path(ch[0], { color: 'red', width: 2 }); Pl.path(ch[1], { color: 'green', width: 2 }); Pl.path(ch[2], { color: 'accent', width: 2 });
          // Newton's reading
          lams.forEach((l, i) => {
            const y = 0.6 + i * 1.02, sh = s * D * prismShift(l), col = specRGB(l, 0.5);
            Nw.line(-3, y, 3, y, { color: 'faint', width: 0.6, alpha: 0.5 });
            for (const [a, b] of ivs()) { const lo = Math.max(-3, a + sh), hi = Math.min(3, b + sh); if (hi > lo) Nw.line(lo, y, hi, y, { color: col, width: 9, alpha: 0.95 }); }
          });
          // fringe colours at two sample points
          const outerL = prof.value === 'edge' ? -0.3 * D * s : -w.value / 2 - 0.25 * D * s, outerR = prof.value === 'edge' ? 0 : w.value / 2 + 0.3 * D * s;
          const at = (x) => prismXYZ(Pf, x, D, s);
          info = { cen: xyzToDom(at(0)), wide: w.value > 1.3 * D, edgeA: xyzToDom(at(prof.value === 'edge' ? 0.3 * D * s : -w.value / 2 - 0.25 * D)), edgeB: xyzToDom(at(prof.value === 'edge' ? -0.3 * D * s : w.value / 2 + 0.3 * D)), D };
        });
        v.legend([['red', 'red value'], ['green', 'green value'], ['accent', 'blue value']]);
        v.readout(() => prof.value === 'edge'
          ? `edge colours just beyond the boundary: ${colourName(info.edgeA)} on the left and ${colourName(info.edgeB)} on the right; the fringes are $\\Delta=${v.fix(info.D, 2)}$ wide and the plain white and dark areas stay uncoloured`
          : `${info.wide ? `$w>\\Delta$: fringes at the edges (left ${colourName(info.edgeA)}, right ${colourName(info.edgeB)}), and the stripe’s middle is ${colourName(info.cen)}` : `$w<\\Delta$ (the fringes overlap): the middle of the ${prof.value} stripe is ${colourName(info.cen)}`}${info.cen.l ? ` (${info.cen.purple ? 'complementary ' : ''}dominant wavelength ${v.fix(info.cen.l, 0)} nm)` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Paper',
      name: 'Opticks',
      paper: { authors: 'Isaac Newton', year: 1704, title: 'Opticks: or, a Treatise of the Reflexions, Refractions, Inflexions and Colours of Light',
               venue: 'London: Sam. Smith and Benj. Walford, 1704; the colour circle is Book I, Part II, Prop. VI', url: 'https://archive.org/details/opticksortreatis00newt' },
      introduces: ['art-3.3'],
      credit: 'Isaac Newton, 1704',
      statement: String.raw`Book I, Part II, Proposition VI, Problem II of the Opticks sets the problem “in a mixture of primary colours, the quantity and quality of each being given, to know the colour of the compound”, and solves it with a diagram. A circle is divided into seven arcs, named from red to violet, whose lengths are proportional to the numbers $\tfrac19,\tfrac1{16},\tfrac1{10},\tfrac19,\tfrac1{16},\tfrac1{16},\tfrac19$, which Newton takes from the seven intervals of the musical octave; circles proportional to the number of rays of each colour are placed at the centres of gravity of their arcs, and the common centre of gravity $Z$ of those circles is found. The line from the centre $O$ through $Z$ meets the circumference at $Y$, which shows the hue of the compound, and $OZ$ measures its fullness, its distance from whiteness.

Newton adds the caveats himself: two opposite colours mixed equally make a faint colour, not a perfect white; a mixture whose $Z$ falls near the line $OD$ is a purple; he had not found how to make white from fewer than about four or five colours. He gives a worked example: violet 1, indigo 1, blue 2, green 3, yellow 5, orange 6, red 10, whose $Y$ lies between $E$ and $F$, nearer to $E$, with $OZ$ a little less than half of $OY$, an orange verging a little toward red, with a little less than half the intensity of the full orange.`,
      idea: String.raw`Before the Opticks colour was thought of as a mixture of light and dark, or as a modification of white light by the medium; Newton’s experiments with prisms (art-3.1) had made colours physical, rays of definite refrangibility, and this proposition turns that into a calculus: mixing is addition of rays, and addition of rays is a weighted average on a circle. He chooses the circle as a map of the colours because the red and violet ends are neighbours in the purples, and the arc lengths through the analogy with the musical scale (a numerological idea from his time, not a measurement). The idea that mixing is an average of weights is what later became Grassmann’s laws and the chromaticity diagram (art-3.5), but the circle itself is only approximate: the seven names, the arc lengths and the rule that every colour has an exact opposite are conventions, not results.`,
      caption: String.raw`Newton’s Fig. 11, rebuilt. Use the step selector to draw it as he describes: the seven arcs (their lengths are the printed fractions, compared with the monochord intervals on the right), the centres of gravity $p,q,r,s,t,u,x$, the circles proportional to the numbers of rays, and finally $Z$ and $Y$. The sliders start at his worked example; the readout compares his reading with the rule and with a modern calculation of the same mixture of narrow-band lights.`,
      deps: ['art-3.1'],
      refs: [],
      tags: ['Newton', 'Opticks', 'colour circle'],
      scope: String.raw`The arc proportions are the numbers printed in the Opticks text as I read it from a public-domain transcription (Project Gutenberg), not checked against the 1704 print. The wavelength attached to each colour name in the modern comparison (660, 607, 577, 532, 482, 452, 420 nm) is a conventional mid-band choice, not Newton’s.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Opticks' },
      viz(v) {
        const step = v.select('construction', [{ value: 1, label: '1 the arcs' }, { value: 2, label: '2 centres of gravity' }, { value: 3, label: '3 circles of rays' }, { value: 4, label: '4 Z and Y' }], 4);
        const ex = [10, 6, 5, 3, 2, 1, 1];
        const sl = NEWTON.arcs.map((a, i) => v.slider(a.name, 0, 12, ex[i], { step: 0.1 }));
        v.button('Newton’s example', () => sl.forEach((s, i) => s.set(ex[i])));
        const C = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 400, weight: 1.05, title: 'Fig. 11: the circle ADF' });
        const Mo = v.stage({ x: [0, 1.5], y: [-0.4, 8.2], axes: false, height: 400, weight: 0.8, minWidth: 250, title: 'the monochord: lengths of the eight notes' });
        const LET = ['p', 'q', 'r', 's', 't', 'u', 'x'];
        const strings = [[1, '1', 'sol'], [8 / 9, '8/9', 'la'], [5 / 6, '5/6', 'fa'], [3 / 4, '3/4', 'sol'], [2 / 3, '2/3', 'la'], [3 / 5, '3/5', 'mi'], [9 / 16, '9/16', 'fa'], [1 / 2, '1/2', 'sol']];
        const printed = ['1/9', '1/16', '1/10', '1/9', '1/16', '1/16', '1/9'];
        const derived = [1, 2, 3, 4, 5, 6, 7].map((k) => { const q = strings[k - 1][0] / strings[k][0], num = Math.round(1 / (q - 1)) + 1; return `1/${num}`; });
        let info = {};
        v.render(() => {
          const wts = sl.map((s) => s.value), mx = newtonMix(wts), st = step.value;
          C.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          for (const A of NEWTON.arcs) {
            const NST = 14;
            for (let k = 0; k < NST; k++) {
              const t0 = A.a0 + (A.w * k) / NST, t1 = A.a0 + (A.w * (k + 1)) / NST + 0.004, l = Math.min(660, Math.max(430, A.l0 + ((A.l1 - A.l0) * (k + 0.5)) / NST));
              C.poly([circPt(t0, 0.93), circPt(t1, 0.93), circPt(t1, 1.0), circPt(t0, 1.0)], { fill: specRGB(l, 0.5), stroke: false, fillAlpha: 1 });
            }
            const q = circPt(A.a0, 1.0), q2 = circPt(A.a0, 1.06);
            C.line(q[0], q[1], q2[0], q2[1], { color: 'ink', width: 1 });
            C.text(A.letter, ...circPt(A.a0, 1.14), { size: 13, color: 'ink', align: 'center', baseline: 'middle', math: true });
            C.text(`${A.name}`, ...circPt((A.a0 + A.a1) / 2, 1.3), { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
          }
          C.line(0, 0, 0, 1, { color: 'muted', width: 1, dash: [3, 4] });
          C.dot(0, 0, { r: 3.5, color: 'ink', label: 'O', labelPos: 'sw' });
          if (st >= 2) NEWTON.arcs.forEach((A, i) => { const c = arcCentroid(i); C.dot(c[0], c[1], { r: 3, color: 'ink' }); if (st === 2) C.text(LET[i], c[0] * 0.86, c[1] * 0.86, { size: 13, color: 'ink', align: 'center', baseline: 'middle', math: true }); });
          if (st >= 3) wts.forEach((wv, i) => { if (wv <= 0) return; const c = arcCentroid(i), r = 0.075 * Math.sqrt(wv); C.circle(c[0], c[1], r, { fill: specRGB(NEWTON.arcs[i].rep, 0.5), fillAlpha: 0.7, color: 'ink', width: 1 }); C.text(LET[i], c[0] * 0.72, c[1] * 0.72, { size: 12, color: 'ink', align: 'center', baseline: 'middle', math: true }); });
          if (st >= 4 && mx.sw > 0) {
            const Y = circPt(mx.ang, 1);
            C.line(0, 0, Y[0], Y[1], { color: 'ink', width: 1.4, dash: [5, 4] });
            C.line(0, 0, mx.Z[0], mx.Z[1], { color: 'ink', width: 2.8 });
            C.dot(Y[0], Y[1], { r: 5, hollow: true, color: 'ink', label: 'Y', labelPos: 'n' });
            C.dot(mx.Z[0], mx.Z[1], { r: 6.5, color: 'gold', label: 'Z', labelPos: 'ne' });
          }
          // the monochord
          strings.forEach(([len, fr, nm], i) => {
            const y = 7.5 - i;
            Mo.line(0.05, y, 0.05 + 0.9 * len, y, { color: 'accent', width: 5, alpha: 0.85 });
            Mo.text(`${nm}  ${fr}`, 1.0, y, { size: 11, color: 'ink', align: 'left', baseline: 'middle' });
          });
          for (let k = 0; k < 7; k++) { const y = 7.0 - k; Mo.text(`arc ${NEWTON.arcs[k].letter}${NEWTON.arcs[(k + 1) % 7].letter}: printed ${printed[k]}`, 1.45, y, { size: 10.5, color: printed[k] === derived[k] ? 'muted' : 'red', align: 'right', baseline: 'middle' }); }
          Mo.text('the fifth arc: printed 1/16, lengths 3/4 : 2/3 give 1/10', 1.45, -0.2, { size: 10, color: 'red', align: 'right' });
          const at = arcAt(mx.ang), xyM = mx.sw > 0 ? xyOf(mixXYZ(wts)) : [1 / 3, 1 / 3];
          info = { mx, at, dm: dominant(xyM[0], xyM[1]), ex: wts.every((q, i) => Math.abs(q - ex[i]) < 1e-9), OY: 1 };
        });
        v.legend([['ink', 'circle, centres of gravity, $OZ$ and $OY$'], ['gold', '$Z$']]);
        v.readout(() => {
          const A = NEWTON.arcs[info.at.i];
          return `rule applied: $Y$ is ${v.fix(100 * info.at.u, 0)}% of the way through the ${A.name} arc (${A.letter} → ${NEWTON.arcs[(info.at.i + 1) % 7].letter}), $|OZ|/|OY|=${v.fix(info.mx.full, 3)}$${info.ex ? '\nNewton’s reading of this example: $Y$ between $E$ and $F$, nearer $E$ (here ' + v.fix(100 * info.at.u, 0) + '% of the way: nearer $E$ ✓); $OZ$ “a little less than one half” of $OY$ (here ' + v.fix(info.mx.full, 2) + ')' : ''}\nmodern calculation for narrow-band lights at the conventional wavelengths: ${info.dm.l ? `${info.dm.purple ? 'complementary' : 'dominant'} wavelength ${v.fix(info.dm.l, 0)} nm (${colourName(info.dm)}), excitation purity ${v.fix(info.dm.purity, 2)}` : 'white'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'Zur Farbenlehre (Theory of Colours)',
      paper: { authors: 'Johann Wolfgang von Goethe', year: 1810, title: 'Zur Farbenlehre',
               venue: 'Tübingen: J. G. Cotta, 1810 (2 vols. and an atlas of plates)', url: 'https://archive.org/details/ZurFarbenlehre00GoetA' },
      introduces: ['art-3.11'],
      credit: 'Johann Wolfgang von Goethe, 1810',
      statement: String.raw`Goethe’s *Zur Farbenlehre* (1810) rejects Newton’s conclusion that white light is a mixture of coloured rays, and builds a theory of colour on observation with the prism and on the experience of the eye. Its centre is the prism experiment with cards: seen through a prism, a white area on a dark ground is not coloured in its interior but shows coloured edges, yellow and red at one boundary, blue and violet at the other; the colours widen as the card is moved away from the prism, until the fringes of a narrow white stripe meet and overlap into green; and a narrow dark stripe on a white ground gives the opposite, a purple. Goethe concluded that colours arise at the boundary of light and dark, in a turbid or displaced medium, and not in the light itself.

In modern terms the observations are right and the explanation is Newton’s: a prism displaces the images of the different wavelengths by different amounts, and the colour at each point is the sum of those images that land there. That is what the calculation below does with the dispersion of a real glass.`,
      idea: String.raw`In 1791 Goethe borrowed a prism to look at a wall and saw colour only where the wall met a dark edge, which contradicted what he had read of Newton’s experiments, where light enters through a small hole and the spectrum is seen at a distance. His book collects the observations in orderly series, with a systematic chapter on edge phenomena, and sets them against Newton’s account (art-3.12), which he attacked at length; it also contains his sensory-moral theory of colour effects, which is of a different kind and still of interest to painters. The new idea he introduced here, the edge colours as a primary phenomenon (art-3.11), is not in conflict with the physics: it is its first-order consequence for extended scenes, and Newton’s own diagram can be used to predict where the fringes overlap.`,
      caption: String.raw`Two cards, a black one with a white stripe (above) and a white one with a black stripe (below), as in Goethe’s experiments, seen through a prism. Move the card away (the distance slider: the fringes grow in proportion to the distance) or narrow the stripe: the white stripe turns green in the middle, the black one purple-violet. Switch on Newton’s account to see each colour’s own displaced image under the card; switch the prism off to see the cards as they are. This is a model calculation with the dispersion of N-BK7 glass, not a reproduction of Goethe’s plates.`,
      deps: ['art-3.1', 'art-3.12'],
      refs: [],
      tags: ['Goethe', 'colour theory', 'prism'],
      scope: String.raw`Linear model of a thin prism and equal-energy lighting, as in art-3.11. What Goethe reported (yellow-red and blue-violet edges, green from a narrowed white stripe, purple from a narrowed dark one, the growth of the fringes with distance) is taken from secondary descriptions of the experiments, not checked against the 1810 text.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theory_of_Colours' },
      viz(v) {
        const w = v.slider('stripe width $w$ (on the card)', 0.1, 2.5, 0.2, { step: 0.01 });
        const dist = v.slider('distance of the cards from the prism', 1, 12, 5, { step: 0.05 });
        const off = v.toggle('prism removed', false);
        const nwt = v.toggle('show Newton’s account', true);
        const A = v.stage({ x: [-5, 5], y: [0, 2.2], axes: false, height: 210, weight: 1, title: 'the two cards, seen directly' });
        const B = v.stage({ x: [-5, 5], y: [0, 2.2], axes: false, height: 210, weight: 1, title: 'the same cards through the prism' });
        const Nw = v.stage({ x: [-5, 5], y: [0, 14], axes: false, height: 230, full: true, title: 'Newton’s account: the images in eight colours (upper block: black card, white stripe; lower block: white card, black stripe)' });
        const P1 = (x) => (Math.abs(x) <= w.value / 2 ? 1 : 0), P2 = (x) => (Math.abs(x) <= 4.2 && Math.abs(x) > w.value / 2 ? 1 : 0);
        const wl = xyz2lin(prismXYZ(() => 1, 0, 0, 1));
        const show = (c) => { let l = xyz2lin(c).map((u, i) => Math.max(0, u / wl[i])); const m = Math.max(...l); if (m > 1) l = l.map((u) => u / m); return lin2srgb(l); };
        let info = {};
        v.render(() => {
          Nw.el.style.display = nwt.value ? '' : 'none';
          const D = off.value ? 0 : 0.1 * dist.value, N = 200, dx = 10 / N, lams = [700, 650, 600, 550, 500, 460, 430, 400];
          const wall = [26, 26, 32];
          for (let k = 0; k < N; k++) {
            const x = -5 + (k + 0.5) * dx;
            A.rect(-5 + k * dx, 1.2, -5 + (k + 1) * dx + 0.003, 2.1, { fill: P1(x) ? [240, 240, 240] : Math.abs(x) <= 4.2 ? [10, 10, 12] : wall, stroke: false, fillAlpha: 1 });
            A.rect(-5 + k * dx, 0.1, -5 + (k + 1) * dx + 0.003, 1.0, { fill: P2(x) ? [240, 240, 240] : wall, stroke: false, fillAlpha: 1 });
            B.rect(-5 + k * dx, 1.2, -5 + (k + 1) * dx + 0.003, 2.1, { fill: D === 0 ? (P1(x) ? [240, 240, 240] : [10, 10, 12]) : show(prismXYZ(P1, x, D, 1)), stroke: false, fillAlpha: 1 });
            B.rect(-5 + k * dx, 0.1, -5 + (k + 1) * dx + 0.003, 1.0, { fill: D === 0 ? (P2(x) ? [240, 240, 240] : wall) : show(prismXYZ(P2, x, D, 1)), stroke: false, fillAlpha: 1 });
          }
          if (nwt.value) lams.forEach((l, i) => {
            const sh = D * prismShift(l), col = specRGB(l, 0.5);
            const y1 = 13 - i * 0.8, y2 = 6 - i * 0.8;
            Nw.line(-5, y1, 5, y1, { color: 'faint', width: 0.5, alpha: 0.5 }); Nw.line(-5, y2, 5, y2, { color: 'faint', width: 0.5, alpha: 0.5 });
            Nw.line(-w.value / 2 + sh, y1, w.value / 2 + sh, y1, { color: col, width: 8, alpha: 0.95 });
            for (const [a, b] of [[-4.2, -w.value / 2], [w.value / 2, 4.2]]) Nw.line(a + sh, y2, b + sh, y2, { color: col, width: 8, alpha: 0.95 });
          });
          const c1 = prismXYZ(P1, 0, D, 1), c2 = prismXYZ(P2, 0, D, 1);
          info = { D, d1: xyzToDom(c1), d2: xyzToDom(c2), narrow: w.value < D };
        });
        v.legend([['accent', 'cards and their images']]);
        v.readout(() => info.D === 0 ? 'no prism: white stripe on black and black stripe on white, no colour anywhere' : `fringe width $\\Delta=${v.fix(info.D, 2)}$ card units (it grows with the distance), stripe width $${v.fix(w.value, 2)}$: ${info.narrow ? 'the fringes overlap' : 'the fringes are separate and the middle keeps its own colour'}\nmiddle of the white stripe: ${colourName(info.d1)}${info.d1.l ? ` (dominant ${v.fix(info.d1.l, 0)} nm)` : ''} · middle of the black stripe: ${colourName(info.d2)}${info.d2.l ? ` (${info.d2.purple ? 'complementary ' : ''}${v.fix(info.d2.l, 0)} nm)` : ''} · Goethe reported green and purple for the narrow stripes`);
      },
    },
  ],
};
