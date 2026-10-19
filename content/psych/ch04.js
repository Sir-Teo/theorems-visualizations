// Psychology & Perception — Chapter 4: Early vision (items 4.1–4.5; 4.6–4.10 are in ch04-b.js, 4.11–4.14 in ch04-c.js)
import { logTicks, grey, clamp01, smooth01, coneDensity, rodDensity, BLIND } from './ch04.shared.js';

export default {
  collection: 'psych',
  chapter: 4,
  title: 'Early vision: receptors, contrast and lightness',
  summary: String.raw`The retina already processes the image. Two receptor systems trade sensitivity for acuity: cones, packed densely in the fovea, serve daylight and fine detail, while rods, absent from the fovea and pooled many-to-one, serve the dark. Neighbouring cells then inhibit one another, so that the visual system reports differences, edges and ratios rather than absolute light levels. Lateral inhibition predicts Mach bands and explains some contrast illusions, but the Hermann grid and the lightness illusions show that the account is incomplete and that the brain also reasons about surfaces and illumination. And fixed images fade away: vision is built for change.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'Duplex retina: rods and cones',
      statement: String.raw`The human retina contains two kinds of photoreceptor with complementary jobs. **Cones** (three types, a mean of about4.6million in the mapped retinas of Curcio et al.,1990) work in bright light, are packed most densely at the **fovea** and give fine detail and colour. **Rods** (about92million in the same study) are far more sensitive, work in dim light, are absent from a rod-free zone about $1.25^\circ$ across at the centre of the fovea, reach their highest density some $15$–$20^\circ$ off the centre and give no colour. Which system carries vision depends on the light level: cones in daylight (*photopic*), rods in starlight (*scotopic*) and both in between (*mesopic*). The eye is therefore two sensors in one, with a hand-over between them.`,
      idea: String.raw`The two systems have different photochemistry and wiring, and the numbers above are anatomical counts from human retinas (Curcio et al. 1990). The rod pigment catches single photons and its signal is pooled over many receptors (4.4), which buys sensitivity; cones are sparse enough in the periphery to be outnumbered by rods but dense enough in the fovea to sample the image at about a micrometre-scale grid, which buys acuity. A cone mosaic of spacing $s$ cannot resolve gratings finer than one cycle per $2s$ (the sampling limit), which helps explain the fovea’s high spatial acuity; actual resolution also depends on optics, sampling direction and neural processing.`,
      caption: String.raw`**Top:** receptor density against distance from the fovea along the temporal retina (log scale). Drag the **gold** handle. **Bottom:** a 30 µm square patch of retina at that place, drawn as a random mosaic with the density given by the curves: large **blue** discs are cones and small **orange** dots are rods. The *Lighting* control switches which receptors are active (the rest are dimmed). Notice that the fovea has no rods at all, so a faint star vanishes when you look straight at it. The density curves are a **stylised model** built through the published peak values, not the measured profile.`,
      deps: [],
      refs: ['Goldstein ch. 2'],
      tags: ['retina', 'rods and cones', 'acuity'],
      credit: 'Anatomical counts: Curcio et al.,1990, J. Comp. Neurol.292:497–523 (complete original checked)',
      scope: String.raw`The anatomical study sampled eight eyes from seven donors aged27–44; these averages are not universal per-eye counts. The model curves follow the temporal horizontal meridian; the nasal side differs (the optic disc sits at about 15° nasal on the retina), and cone density at the fovea varies several-fold between people. Light levels for the scotopic, mesopic and photopic ranges are conventional, not sharp.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Photoreceptor_cell', pubmed: 'https://pubmed.ncbi.nlm.nih.gov/2324310/' },
      viz(v) {
        const M = v.M;
        const light = v.select('Lighting', [{ value: 'day', label: 'daylight' }, { value: 'dusk', label: 'twilight' }, { value: 'star', label: 'starlight' }], 'day');
        const dens = v.stage({ x: [0.1, 70], y: [1e3, 3e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 290, weight: 1.1, minWidth: 320, xlabel: 'distance from the fovea (degrees)', ylabel: 'receptors per mm²', title: 'receptor density (stylised model)', xticks: [[0.1, '0.1'], [1, '1'], [10, '10'], [70, '70']] });
        const mos = v.stage({ x: [0, 30], y: [0, 30], equal: true, axes: false, height: 290, weight: 0.9, minWidth: 280, title: 'a 30 µm patch of retina' });
        const h = dens.handle(8, 1.5e3, { color: 'gold', r: 8, label: 'here', labelPos: 'n', constrain: (x) => [M.clamp(x, 0.1, 70), 1.5e3] });
        v.legend([['accent', 'cones'], ['orange', 'rods'], ['gold', 'where you are looking at the patch']]);
        let st = null;
        v.render(() => {
          const e = h.x, rc = coneDensity(e), rr = rodDensity(e);
          dens.fn(coneDensity, { domain: [0.1, 70], color: 'accent', width: 2.6 });
          dens.fn(rodDensity, { domain: [0.1, 70], color: 'orange', width: 2.6 });
          dens.line(e, 1e3, e, Math.max(rc, rr, 1e3), { color: 'gold', dash: [4, 3], width: 1.4 });
          dens.vband(0.1, 0.625, { color: 'accent', alpha: 0.08 });
          dens.text('rod-free zone', 0.7, 2.4e5, { align: 'left', size: 11.5, color: 'muted' });
          // mosaic: jittered grid at the combined density
          const tot = rc + rr, sp = Math.sqrt(1e6 / tot) * 1.0; // µm (square grid of the same density)
          const nx = Math.max(2, Math.ceil(30 / sp)), R = v.rng(11);
          const pc = rc / tot, cr = Math.min(0.5 * 4.5, 0.55 + 0.11 * Math.min(e, 30)) ; // cone radius (µm) grows with eccentricity
          const dayOn = light.value !== 'star', starOn = light.value !== 'day';
          mos.rect(0, 0, 30, 30, { fill: 'panel', fillAlpha: 1, color: 'faint' });
          let nc = 0, nr = 0;
          const cells = [];
          for (let i = 0; i < nx; i++) for (let j = 0; j < nx; j++) {
            const x = (i + 0.15 + 0.7 * R()) * 30 / nx, y = (j + 0.15 + 0.7 * R()) * 30 / nx, isC = R() < pc;
            cells.push([x, y, isC]); if (isC) nc++; else nr++;
          }
          for (const [x, y, isC] of cells) {
            if (isC) mos.circle(x, y, Math.min(cr, sp * 0.62), { fill: 'accent', fillAlpha: dayOn ? 0.85 : 0.18, stroke: false });
            else mos.circle(x, y, Math.min(0.55, sp * 0.4), { fill: 'orange', fillAlpha: starOn ? 0.9 : 0.2, stroke: false });
          }
          mos.text(`${nc} cones, ${nr} rods in view`, 15, 1.2, { align: 'center', size: 12, color: 'muted', plate: true });
          const spacing = Math.sqrt(2 / (Math.sqrt(3) * Math.max(rc, 1))) * 1000;
          st = { e, rc, rr, spacing, nyq: 0.5 / (spacing / 288) };
        });
        v.readout(() => {
          if (!st) return '';
          const s = light.value === 'day' ? 'photopic: cones carry vision' : light.value === 'dusk' ? 'mesopic: rods and cones both contribute' : 'scotopic: rods carry vision' + (st.rr === 0 ? ' — **the model’s rod-only channel receives no signal here**' : '');
          return `At $${v.fix(st.e, 1)}^\\circ$: cones ${v.fmt(st.rc, 3)} /mm², rods ${v.fmt(st.rr, 3)} /mm² (cone : rod = 1 : ${st.rr > 0 ? v.fmt(st.rr / st.rc, 2) : '0'}) · cone-mosaic spacing ≈ ${v.fix(st.spacing, 1)} µm, sampling limit ≈ ${v.fix(st.nyq, 0)} cycles/degree (taking 1° ≈ 288 µm) · ${s}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Dark adaptation and the rod–cone break',
      statement: String.raw`After exposure to bright light, the threshold for seeing a faint flash falls with time in the dark, over about half an hour and by some four to five log units. The curve is **biphasic**: first a fast fall (cones, levelling off within a few minutes at a threshold well above the rods' limit), then, after the **rod–cone break** at roughly 7–10 minutes, a second, slower fall (rods) to the final dark-adapted threshold. At any moment the threshold is the lower of the cone and rod curves. The break disappears if the test spot is confined to the rod-free fovea (cone branch only) and, in a person with no functioning cones in this idealization (rod monochromat), only a single rod branch remains.`,
      idea: String.raw`Two independent receptor systems (4.1), each with its own recovery after pigment bleaching, and a detector that uses whichever is more sensitive: the observed curve is the lower envelope $\min(T_\mathrm{cone}(t),T_\mathrm{rod}(t))$. Cones recover quickly but to a limited sensitivity; rods start recovering later (their pigment regenerates more slowly, so the delay grows with the bleaching dose) but go much further. The break occurs where the curves cross. Hecht, Haig and Chase (1937) varied preadaptation intensity and red/violet test lights in three observers. The foveal and rod-only switches here are idealized ways of isolating the receptor branches, not conditions reproduced from that experiment.`,
      caption: String.raw`Log threshold against minutes in the dark. The **blue** curve is the cone branch, the **purple** curve the rod branch and the thick **black** curve is what you would measure: the lower of the two. *Test* switches between a normal observer, a spot confined to the **fovea** (rod-free, so the cone branch only) and a **rod monochromat** (rod branch only). Increase the *bleaching light* and the rod branch starts later, so the break moves right. Time constants and levels are a **qualitative model** chosen to put the break at about 8 minutes, not fitted data.`,
      deps: ['psych-4.1'],
      refs: ['Goldstein ch. 2'],
      tags: ['dark adaptation', 'rods and cones', 'threshold'],
      credit: 'Hecht, Haig & Chase, 1937, J. Gen. Physiol. 20: 831–850 (dark-adaptation curves and the rod–cone break); qualitative model branches, not a fit to their data',
      scope: String.raw`The time of the break depends on the bleaching intensity and duration, on the colour and position of the test spot (a red test light shows little break, since rods are insensitive to long wavelengths; a peripheral violet one shows it clearly) and on the person; textbook values quote about 7–10 minutes, with full adaptation after 30 minutes or more.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Adaptation_(eye)#Dark_adaptation' },
      viz(v) {
        const test = v.select('Test', [{ value: 'norm', label: 'normal, peripheral spot' }, { value: 'fov', label: 'fovea only' }, { value: 'mono', label: 'rod monochromat' }], 'norm');
        const bl = v.slider('bleaching light', 0, 1, 0.5, { step: 0.01 });
        const s = v.stage({ x: [0, 40], y: [-6.5, 1.5], axes: 'box', gutter: true, height: 340, xlabel: 'time in the dark (minutes)', ylabel: 'log threshold (relative)', title: 'dark adaptation curve', yticks: [-6, -5, -4, -3, -2, -1, 0, 1] });
        const cone = (t) => -2.3 + 3.3 * Math.exp(-t / 1.6);
        const rod = (t, t0) => (t < t0 ? 5 : -6 + 11 * Math.exp(-(t - t0) / 5.5));
        v.legend([['accent', 'cone branch'], ['purple', 'rod branch'], ['ink', 'measured threshold'], ['orange', 'rod–cone break']]);
        let brk = null;
        v.render(() => {
          const t0 = 0.5 + 3.5 * bl.value, m = test.value;
          s.setView([0,40],[-6.5,m==='mono'?5.5:1.5]);
          const T = (t) => (m === 'fov' ? cone(t) : m === 'mono' ? rod(t, t0) : Math.min(cone(t), rod(t, t0)));
          s.fn(cone, { domain: [0, 40], color: 'accent', width: 1.8, dash: m === 'mono' ? [4, 4] : false, alpha: m === 'mono' ? 0.4 : 1 });
          s.fn((t) => rod(t, t0), { domain: [t0, 40], color: 'purple', width: 1.8, dash: m === 'fov' ? [4, 4] : false, alpha: m === 'fov' ? 0.4 : 1 });
          s.fn(T, { domain: [0, 40], color: 'ink', width: 3.4 });
          brk = null;
          if (m === 'norm') { for (let t = t0; t < 40; t += 0.02) if (rod(t, t0) < cone(t)) { brk = { t, y: cone(t) }; break; } }
          if (brk) {
            s.vline(brk.t, { color: 'orange', dash: [4, 3], width: 1.5 });
            s.dot(brk.t, brk.y, { r: 6, color: 'orange' });
            s.text('rod–cone break', brk.t, 0.6, { dx: 8, align: 'left', color: 'orange', weight: 700, size: 12.5 });
          }
          s.text('cones recover fast but to a limit', 16, cone(16), { dy: -14, align: 'left', size: 11.5, color: 'accent' });
          s.text('rods go on to the dark-adapted limit', 38, rod(38, t0), { dy: -14, align: 'right', size: 11.5, color: 'purple' });
        });
        v.readout(() => {
          const t0 = 0.5 + 3.5 * bl.value;
          if (test.value === 'norm') return brk ? `Break at ≈ **${v.fix(brk.t, 1)} min**, threshold there ≈ $10^{${v.fix(brk.y, 1)}}$ · after 30 min the rod branch has fallen to $10^{${v.fix(-6 + 11 * Math.exp(-(30 - t0) / 5.5), 1)}}$ (the cone branch stopped at $10^{-2.3}$), a further ${v.fix(-2.3 - (-6 + 11 * Math.exp(-(30 - t0) / 5.5)), 1)} log units of gain from the rods`: '';
          return test.value === 'fov' ? 'Fovea only: the test spot falls on the rod-free fovea, so the curve is the cone branch alone and has **no break**; its final threshold stays at about $10^{-2.3}$.' : 'Rod monochromat: no cone branch, so the curve is the rod branch alone: a single smooth fall, starting high and ending at the rod limit. **No break.**';
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Phenomenon',
      name: 'The Purkinje shift',
      statement: String.raw`Two coloured surfaces that look equally bright in daylight do not stay equally bright as the light fades. Because the rods' spectral sensitivity peaks at a shorter wavelength (about507nm) than the cones' (about 555 nm), red and orange surfaces lose brightness faster than blue and green ones: in dim light the red looks nearly black while the blue still looks light. The change from photopic to scotopic vision thus shifts the peak of the brightness-versus-wavelength curve toward the blue end of the spectrum.`,
      idea: String.raw`The brightness of a surface is roughly the integral of its reflected spectrum against the sensitivity curve of the receptors in use: $B=\int R(\lambda)\,E\,S(\lambda)\,d\lambda$. Replace the cone curve $V(\lambda)$ by the rod curve $V'(\lambda)$ (which is nearly zero beyond 640 nm) and a long-wavelength surface contributes almost nothing. In the mesopic range the effective curve is a blend whose weights slide from cones to rods as the light dims, so the shift is gradual.`,
      caption: String.raw`**Left:** relative spectral sensitivity of the cones ($V$, blue) and of the rods ($V'$, purple), with the blend you are seeing with (black). The faint red and blue areas are the reflectance spectra of the two flowers. **Right:** the two flowers as they look at the chosen light level; they were scaled to be equally bright in daylight. Drag the **light level** down through the mesopic range and watch the peak slide from 555 toward 507 nm while the red flower goes dark first. The curves are smooth analytic stand-ins that reproduce the two peak wavelengths and the long-wavelength tails (they are not the tabulated CIE functions), and the red and blue reflectances are invented.`,
      deps: ['psych-4.1'],
      refs: ['Goldstein ch. 2'],
      tags: ['spectral sensitivity', 'rods and cones', 'brightness'],
      credit: 'CIE2019 photopic/scotopic luminous-efficiency datasets, Tables1–2 of CIE018:2019; analytic illustration',
      scope: String.raw`The complete CIE2019 datasets were checked: photopic maximum555nm; scotopic tabulation is flat at1 over506–507nm, conventionally described as a507nm peak. These analytic curves are stand-ins; the transition levels used here (rods dominating below about 0.01 cd/m², cones above about 3 cd/m²) are conventional round numbers. Rods are absent from the fovea, so the shift is a peripheral effect for small, centrally fixated objects.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Purkinje_effect' },
      viz(v) {
        const lv = v.slider('light level, $\\log_{10}$ luminance (cd/m²)', -4.5, 2, -1, { step: 0.05 });
        const sp = v.stage({ x: [400, 700], y: [0, 1.12], axes: 'box', gutter: true, height: 300, weight: 1.2, minWidth: 320, xlabel: 'wavelength (nm)', ylabel: 'relative sensitivity', title: 'spectral sensitivity', xticks: [400, 450, 500, 550, 600, 650, 700] });
        const fl = v.stage({ x: [0, 10], y: [0, 6], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 240, title: 'two flowers' });
        const ag = (l, p, a, b) => Math.exp(-0.5 * ((l - p) / (l < p ? a : b)) ** 2);
        const Vp = (l) => 0.821 * ag(l, 568.8, 46.9, 40.5) + 0.286 * ag(l, 530.9, 16.3, 31.1); // multi-lobe fit to the CIE 1931 y-bar (Wyman, Sloan & Shirley 2013, from memory)
        const VpMax = 1.0 * Math.max(...Array.from({ length: 301 }, (_, i) => Vp(400 + i)));
        const V = (l) => Vp(l) / VpMax;
        const Vs = (l) => ag(l, 507, 40, 37);
        const red = (l) => 0.9 / (1 + Math.exp(-(l - 600) / 12)), blue = (l) => 0.8 * Math.exp(-0.5 * ((l - 450) / 28) ** 2) + 0.08;
        const wr = (L) => 1 - smooth01((L + 2) / 2.5);
        const integ = (R, S) => { let a = 0; for (let l = 400; l <= 700; l += 5) a += R(l) * S(l); return a; };
        const kBlue = integ(red, V) / integ(blue, V); // equal in daylight
        const mix = (l, w) => (1 - w) * V(l) + w * Vs(l);
        let st = null;
        v.legend([['accent', 'cones  V(λ)'], ['purple', 'rods  V′(λ)'], ['ink', 'what you see with'], ['red', 'red flower', { area: true }], ['blue', 'blue flower', { area: true }]]);
        v.render(() => {
          const L = lv.value, w = wr(L);
          sp.fn((l) => red(l) * 0.55, { domain: [400, 700], color: 'red', fill: true, fillAlpha: 0.1, width: 1, alpha: 0.5 });
          sp.fn((l) => blue(l) * 0.55 * kBlue, { domain: [400, 700], color: 'blue', fill: true, fillAlpha: 0.1, width: 1, alpha: 0.5 });
          sp.fn(V, { domain: [400, 700], color: 'accent', width: 1.8, alpha: 0.6 });
          sp.fn(Vs, { domain: [400, 700], color: 'purple', width: 1.8, alpha: 0.6 });
          const eff = (l) => mix(l, w);
          let pk = 400, pm = 0, mx = 0;
          for (let l = 400; l <= 700; l += 1) { const e = eff(l); if (e > pm) { pm = e; pk = l; } }
          sp.fn((l) => eff(l) / pm, { domain: [400, 700], color: 'ink', width: 3 });
          sp.vline(pk, { color: 'gold', dash: [4, 3], width: 1.5 });
          sp.text(`peak ${pk} nm`, pk, 1.06, { dx: pk > 560 ? -6 : 6, align: pk > 560 ? 'right' : 'left', color: 'gold', weight: 700, size: 12.5 });
          const Br = integ(red, (l) => mix(l, w)), Bb = kBlue * integ(blue, (l) => mix(l, w));
          const k = Math.max(Br, Bb), br = Br / k, bb = Bb / k;
          const shade = (rgb, b) => rgb.map((c) => Math.round(c * Math.pow(b, 0.6)));
          const flower = (cx, rgb, b, name) => {
            for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; fl.circle(cx + 1.15 * Math.cos(a), 3.1 + 1.15 * Math.sin(a), 0.95, { fill: shade(rgb, b), fillAlpha: 1, stroke: false }); }
            fl.circle(cx, 3.1, 0.7, { fill: shade([230, 200, 70], Math.max(b, 0.3)), fillAlpha: 1, stroke: false });
            fl.text(name + ' ' + v.fix(b, 2), cx, 0.9, { align: 'center', size: 12.5, color: 'ink', weight: 600 });
          };
          fl.rect(0, 0, 10, 6, { fill: [20, 24, 20], fillAlpha: 1, stroke: false });
          flower(2.7, [215, 40, 40], br, 'red'); flower(7.3, [50, 80, 220], bb, 'blue');
          st = { pk, w, br, bb, ratio: Br / Bb };
        });
        v.readout(() => st ? `Rod weight ${v.fix(st.w, 2)} · effective peak **${st.pk} nm** (≈555 nm in daylight, 507 nm in the dark) · brightness red : blue = ${v.fix(st.ratio, 3)} (1 by construction in daylight)` : '');
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Concept',
      name: 'Convergence trades acuity for sensitivity',
      statement: String.raw`Many receptors feed one ganglion cell, and the ratio differs across the retina: in the central fovea one cone drives (through bipolar cells) about one ganglion cell, while in the periphery hundreds of rods converge on one. Pooling $g$ receptors that have independent noise raises the signal-to-noise ratio of a faint, extended stimulus by $\sqrt g$, so convergence raises **sensitivity**; but the pooled cell cannot tell which receptor was hit, so the finest grating it can resolve has period about $2g$ receptor spacings. Sensitivity thus rises and acuity falls as $g$ grows, and the best pool for detecting a spot is one about as large as the spot.`,
      idea: String.raw`The sum of $g$ receptor signals each carrying signal $s$ and independent noise of standard deviation $\sigma$ has signal $gs$ and noise $\sigma\sqrt g$, so the ratio is $\sqrt g\,s/\sigma$, for as long as the whole pool lies inside the stimulus; if the spot covers only $k<g$ of the receptors, the signal is $ks$ while the noise still grows as $\sqrt g$, which is why detection peaks at $g\approx k$. Averaging over the pool is a box-shaped blur, whose frequency response $|\operatorname{sinc}(\pi f g)|$ cuts the contrast of fine gratings, and sampling at one value per pool aliases anything finer than $1/(2g)$ cycles per receptor.`,
      caption: String.raw`A row of 48 receptors (top, **blue**) is wired into groups of $g$ (the **orange** brackets), each giving one output (bottom). Choose *grating* or *dim spot*. Raise the **pool size** $g$: the grating's modulation at the ganglion level collapses once its frequency passes the sampling limit (the **green** line in the middle panel), while the dim spot's detectability $d'$ (right panel) climbs as $\sqrt g$ up to the spot's size and then falls. A model with independent, Gaussian receptor noise and a flat pool; real pooling is weighted and noise is partly shared.`,
      deps: ['psych-4.1', 'prob-2.2.1'],
      refs: ['Goldstein ch. 3'],
      tags: ['convergence', 'acuity', 'sensitivity'],
      scope: String.raw`Holds for independent noise and uniform pooling over the stimulus; shared noise (for example from the photon statistics of the stimulus itself) is not reduced by pooling in the same way.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Retinal_ganglion_cell' },
      viz(v) {
        const mode = v.select('Stimulus', [{ value: 'grat', label: 'grating' }, { value: 'spot', label: 'dim spot' }], 'grat');
        const gs = v.select('Pool size $g$', ['1', '2', '3', '4', '6', '8', '12'], '4');
        const fq = v.slider('grating frequency (cycles/receptor)', 0.02, 0.5, 0.11, { step: 0.005 });
        const sg = v.slider('spot signal per receptor ($s/\\sigma$)', 0.1, 1.5, 0.45, { step: 0.01 });
        const N = 48, KS = 6;
        const rw = v.stage({ x: [0, N], y: [-3.4, 3.2], axes: false, height: 290, weight: 1.5, minWidth: 340, title: 'receptors (top) and ganglion cells (bottom)' });
        const tf = v.stage({ x: [0, 0.5], y: [0, 1.15], axes: 'box', gutter: true, height: 290, weight: 0.9, minWidth: 250, xlabel: 'grating frequency (cycles per receptor)', ylabel: 'modulation at the ganglion', title: 'what pooling does to a grating' });
        const dp = v.stage({ x: [0, 7], y: [0, 4], axes: 'box', gutter: true, height: 290, weight: 0.9, minWidth: 250, xlabel: 'pool size g', ylabel: 'detectability d′', title: 'detecting a 6-receptor spot', xticks: [[0.5, '1'], [1.5, '2'], [2.5, '3'], [3.5, '4'], [4.5, '6'], [5.5, '8'], [6.5, '12']] });
        const G = [1, 2, 3, 4, 6, 8, 12];
        const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
        const gOf = () => +gs.value;
        v.legend([['accent', 'receptors', { area: true }], ['orange', 'ganglion outputs', { area: true }], ['green', 'sampling limit 1/(2g)', { dash: true }]]);
        let info = null;
        v.render(() => {
          const g = gOf(), f = fq.value, R = v.rng(3);
          const noise = Array.from({ length: N }, () => R.normal() * 0.12);
          const x0 = 20, inSpot = (i) => i >= x0 && i < x0 + KS;
          const stim = (i) => (mode.value === 'grat' ? 0.5 + 0.5 * Math.cos(2 * Math.PI * f * (i + 0.5)) : inSpot(i) ? Math.min(1, sg.value * 0.7) : 0);
          const vals = Array.from({ length: N }, (_, i) => stim(i) + (mode.value === 'spot' ? noise[i] * 1.2 : 0));
          for (let i = 0; i < N; i++) rw.rect(i + 0.06, 0.5, i + 0.94, 0.5 + 2.4 * Math.max(0, vals[i]), { fill: 'accent', fillAlpha: 0.7, stroke: false });
          rw.line(0, 0.5, N, 0.5, { color: 'muted', width: 1 });
          const out = [];
          for (let a = 0; a < N; a += g) {
            const b = Math.min(N, a + g); let m = 0; for (let i = a; i < b; i++) m += vals[i]; m /= b - a; out.push([a, b, m]);
            rw.line(a + 0.15, 3.05, b - 0.15, 3.05, { color: 'orange', width: 3 });
            rw.rect(a + 0.06, -0.5, b - 0.06, -0.5 - 2.4 * Math.max(0, m), { fill: 'orange', fillAlpha: 0.75, stroke: false });
          }
          rw.line(0, -0.5, N, -0.5, { color: 'muted', width: 1 });
          if (mode.value === 'spot') rw.text('spot', x0 + KS / 2, 0.85 + 2.4 * 0.0, { align: 'center', color: 'muted', size: 11.5, dy: 0, dx: 0 });
          // transfer
          tf.fn((x) => Math.abs(sinc(Math.PI * x * g)), { domain: [0.001, 0.5], color: 'ink', width: 2.4 });
          tf.vline(0.5 / g, { color: 'green', dash: [5, 4], width: 1.6 });
          tf.dot(f, Math.abs(sinc(Math.PI * f * g)), { r: 6, color: 'gold' });
          tf.vline(f, { color: 'gold', alpha: 0.5, width: 1 });
          tf.text('1/(2g)', 0.5 / g, 1.08, { dx: 4, align: 'left', color: 'green', size: 11.5, weight: 600 });
          // d'
          G.forEach((gg, i) => {
            const dd = gg <= KS ? Math.sqrt(gg) * sg.value : (KS * sg.value) / Math.sqrt(gg);
            dp.rect(i + 0.12, 0, i + 0.88, dd, { fill: gg === g ? 'orange' : 'muted', fillAlpha: gg === g ? 0.8 : 0.35, stroke: false });
          });
          dp.hline(1, { color: 'faint', dash: [4, 3] });
          const dd = g <= KS ? Math.sqrt(g) * sg.value : (KS * sg.value) / Math.sqrt(g);
          info = { g, f, mod: Math.abs(sinc(Math.PI * f * g)), dd, lim: 0.5 / g };
        });
        v.readout(() => info ? `$g=${info.g}$: sampling limit ${v.fix(info.lim, 3)} cycles/receptor${info.f > info.lim ? ' (**the grating is above it: aliased or lost**)' : ''} · modulation kept at $f=${v.fix(info.f, 3)}$: ${v.fix(100 * info.mod, 0)}% · detectability of a 6-receptor spot $d'=\\sqrt g\\,s/\\sigma$ = ${v.fix(info.dd, 2)} (best at $g\\approx6$, $d'=${v.fix(Math.sqrt(6) * sg.value, 2)}$)` : '');
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Ricco’s and Bloch’s laws of summation',
      statement: String.raw`For a brief flash seen at threshold, the visual system adds light over space and time completely, up to a limit. **Ricco's law:** for a test spot smaller than a critical area $A_c$, the threshold intensity $I$ is inversely proportional to the area, $I\cdot A=\text{const}$, so only the total flux matters. **Bloch's law:** for a flash shorter than a critical duration $t_c$, $I\cdot t=\text{const}$, so only the total energy matters. Beyond $A_c$ or $t_c$ the summation is only partial: the threshold falls more slowly than $1/A$ or $1/t$, and on log–log axes the line of slope $-1$ bends toward a shallower slope.`,
      idea: String.raw`If a pool of receptors (4.4) sums linearly and the detection rule is a fixed total signal, then the spot threshold is set by the flux falling on the pool. Once the spot is bigger than the pool, extra light lands outside it and cannot help, so the threshold flux grows with area. The same argument holds in time for the integration time of the photoreceptors. The critical area is therefore a footprint of the pooling (small in the fovea, large in the dark-adapted periphery) and the critical duration is the receptors' integration time.`,
      caption: String.raw`Log–log plots of threshold intensity against stimulus area (left) and duration (right). The **solid** curve is the threshold intensity, the **dashed** curve the threshold energy $I\cdot A$ (or $I\cdot t$), which is flat exactly where the law holds. Drag the **gold** handles to move the critical size, or choose a preset: the foveal cones sum over a small area and briefly, the dark-adapted periphery over a large area and for longer. The slider sets the slope beyond the critical value (partial summation). Presets are **typical orders of magnitude** for illustration (about 6 arcmin and 50 ms for the cones, about 1° and 100 ms for the rods), not measurements.`,
      deps: ['psych-4.4'],
      refs: ['Goldstein ch. 3'],
      tags: ['spatial summation', 'temporal summation', 'threshold'],
      credit: 'Ricco1877 (spatial original still unverified); Bloch1885, complete English translation in Gorea2015, i-Perception6(4):1–6',
      scope: String.raw`Complete summation holds for near-threshold flashes on a dark background; the critical area and duration both depend on the retinal location, the background level and the state of adaptation (they get larger in the dark), and the transition between the two regimes is gradual, not the sharp corner drawn here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ricco%27s_law' },
      verify: true,
      viz(v) {
        const pre = v.select('Preset', [{ value: 'fov', label: 'fovea (cones)' }, { value: 'per', label: 'periphery, dark-adapted (rods)' }], 'fov');
        const beta = v.slider('slope beyond the critical size', 0, 0.9, 0.3, { step: 0.01 });
        const PR = { fov: [Math.log10(28), Math.log10(50)], per: [Math.log10(2800), Math.log10(100)] };
        const sa = v.stage({ x: [0, 4.2], y: [-5, 2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 290, xlabel: 'area of the spot (arcmin²)', ylabel: 'log threshold', title: 'Ricco: area', xticks: logTicks(0, 4.2, { mult: [1] }), yticks: [-4, -3, -2, -1, 0, 1] });
        const st = v.stage({ x: [0.8, 3.2], y: [-5, 2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 290, xlabel: 'flash duration (ms)', ylabel: 'log threshold', title: 'Bloch: duration', xticks: logTicks(0.8, 3.2, { mult: [1, 3] }), yticks: [-4, -3, -2, -1, 0, 1] });
        const th = (a, ac, b) => 0.5 - Math.min(a, ac) - b * Math.max(0, a - ac);
        function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
        const ha = sa.handle(PR.fov[0], 0, { color: 'gold', r: 8, label: 'A_c', labelPos: 'n', constrain: (x) => { const c = clamp(x, 0.3, 3.9); return [c, th(c, c, 0)]; } });
        const ht = st.handle(PR.fov[1], 0, { color: 'gold', r: 8, label: 't_c', labelPos: 'n', constrain: (x) => { const c = clamp(x, 1.1, 3.0); return [c, th(c, c, 0)]; } });
        let last = pre.value;
        v.legend([['ink', 'threshold intensity'], ['accent', 'threshold energy (I·A or I·t)', { dash: true }]]);
        let info = null;
        v.render(() => {
          if (pre.value !== last) { last = pre.value; ha.set(PR[last][0], 0); ht.set(PR[last][1], 0); }
          const ac = ha.x, tc = ht.x, b = beta.value;
          sa.fn((a) => th(a, ac, b), { domain: [0, 4.2], color: 'ink', width: 3 });
          sa.fn((a) => th(a, ac, b) + a, { domain: [0, 4.2], color: 'accent', width: 2, dash: [5, 4] });
          st.fn((t) => th(t, tc, b), { domain: [0.8, 3.2], color: 'ink', width: 3 });
          st.fn((t) => th(t, tc, b) + t - 3, { domain: [0.8, 3.2], color: 'accent', width: 2, dash: [5, 4] });
          ha.set(ac, th(ac, ac, b)); ht.set(tc, th(tc, tc, b));
          sa.text('slope −1', ac / 2, th(ac / 2, ac, b), { dx: 8, dy: -14, align: 'left', color: 'muted', size: 12 });
          st.text('slope −1', 0.8 + (tc - 0.8) / 2, th(0.8 + (tc - 0.8) / 2, tc, b), { dx: 8, dy: -14, align: 'left', color: 'muted', size: 12 });
          info = { Ac: Math.pow(10, ac), tc: Math.pow(10, tc) };
        });
        v.readout(() => info ? `Critical area ≈ ${v.fmt(info.Ac, 3)} arcmin² (a disc of diameter ${v.fix(2 * Math.sqrt(info.Ac / Math.PI) / 60, 2)}°) · critical duration ≈ ${v.fmt(info.tc, 3)} ms · below them the threshold energy is **constant** (the dashed lines are flat); beyond them it rises on the log–log plot with slope ${v.fix(1 - beta.value, 2)}` : '');
      },
    },
  ],
};
