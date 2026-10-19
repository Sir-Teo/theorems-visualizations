import {HOMININS,BIPED,kleiber,brainW,eccT,oblT,varpiT,SITES,orbitalRun,relativePower} from './human-origins-review.shared.js';
// Big History & Quantitative History — Chapter 4: Human origins (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
//
// Original-note provenance below predates the source follow-up; see docs/verification/bighist-human-origins-source-review.md.
// Sources checked (Oct 2026). Crossref was used for bibliographic details; "rounded" means the number was not taken from one table.
//   4.1 Aiello & Wheeler, Curr. Anthropol. 36: 199 (1995) (expensive-tissue hypothesis; Crossref-checked). Species age spans and
//     cranial-capacity ranges are rounded, indicative values from textbook-level summaries (several disagree by tens of cm3 at
//     the edges; the Dmanisi skull 5 value of 546 cm3 was confirmed by a web search); they are boxes, not a specimen table.
//     Bipedalism markers: Ardipithecus ramidus about 4.4 Ma, Laetoli footprints about 3.7 Ma, "Lucy" about 3.2 Ma (all rounded,
//     not re-checked). Brain power now uses 11.2 W/kg with an assumed1g/cm3 density; Kleiber uses 3.39 M^0.75 W are model arithmetic (about 20% of rest).
//   4.2 Hays, Imbrie & Shackleton, Science 194: 1121 (1976) (Crossref-checked); Imbrie & Imbrie, Science 207: 943 (1980)
//     (Crossref-checked). Milankovitch's name and his 1941 monograph are recalled, not re-checked. The orbital elements are a
//     three-term-per-quantity caricature (periods 405, 124, 95 kyr; 41 kyr; 21 kyr; amplitudes approximate), tuned so that
//     e = 0.0167, obliquity 23.4 deg and the perihelion longitude 283 deg hold today; it is not the Laskar solution. The ice
//     response is the asymmetric linear-reservoir model with two time constants set by the reader, not the published fit.
//   4.3 Site ages: Jebel Irhoud, Hublin et al., Nature 546: 289 (2017) (about 315 ka, recalled); Omo Kibish, Vidal et al., Nature
//     601: 579 (2022) (about 233 ka, confirmed by search); Misliya, Hershkovitz et al., Science 359: 456 (2018) (177-194 ka,
//     confirmed); Madjedbebe, Clarkson et al., Nature 547: 306 (2017) (65 ka, contested, with 50 ka widely used); Bacho Kiro,
//     Hublin et al., Nature 581: 299 (2020) (before 45 ka); Ust'-Ishim, Fu et al., Nature 514: 445 (2014) (45 ka); White Sands,
//     Bennett et al., Science 373: 1528 (2021) (21-23 ka, contested); Monte Verde (about 14.5 ka, recalled). Qafzeh/Skhul
//     (about 100 ka), Lake Mungo (about 42 ka?) and Tianyuan (about 40 ka) are rounded recalled values. Coordinates are approximate.
//   4.4 Ramachandran et al., PNAS 102: 15942 (2005) (confirmed: heterozygosity falls linearly with distance from Africa); the
//     simulation is a plain founder chain, not a fit to those data.

import { clamp } from './ch04.shared.js';
import { founderSample } from './source-models.shared.js';

const LABEL_OFF = { 'Jebel Irhoud': [-8, 0, 'right'], 'Madjedbebe': [-9, 0, 'right'], 'Omo Kibish': [8, 10, 'left'], 'Misliya': [8, 4, 'left'], 'Qafzeh': [-8, 6, 'right'], 'Bacho Kiro': [0, -10, 'center'], 'Lake Mungo': [8, 8, 'left'] };
const GROUP_COLOR = { africa: 'orange', levant: 'accent', sahul: 'red', europe: 'purple', siberia: 'teal', east: 'pink', america: 'green' };

export default {
  collection: 'bighist',
  chapter: 4,
  title: 'Human origins',
  summary: String.raw`Bipedal apes appeared in Africa several million years ago; brains tripled in size over the last two million. Ice ages paced by Earth’s orbital cycles shaped the environments our ancestors lived in. Modern humans spread out of Africa in the last hundred thousand years, losing genetic diversity at each step and interbreeding with Neanderthals and Denisovans on the way. Collective learning — the ability to share and accumulate knowledge — is Christian’s candidate for what made humans different.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.1',
      kind: 'Event',
      name: 'Hominin evolution: bipedalism and brain growth',
      statement: String.raw`The hominin lineage, which split from the one leading to chimpanzees and bonobos some six to seven million years ago, shows two big changes in the fossil record. **Upright walking** came first: pelvis and foot bones and the Laetoli footprints show habitual bipedalism by about $3.7$ million years ago, in australopiths whose braincases were still chimpanzee-sized, roughly $400$–$550\ \mathrm{cm}^3$. **Brain enlargement** came later and faster: in the genus *Homo*, from about two million years ago, braincase volumes rise from some $500$–$700\ \mathrm{cm}^3$ (*H. habilis*) through about $900$ (*H. erectus*, with a very wide range) to about $1\,350\ \mathrm{cm}^3$ in modern people and up to $1\,500$ or more in Neanderthals.

**Scope.** The species boxes are rounded and overlapping, species boundaries are debated, and the dates of the earliest bipeds (*Sahelanthropus*, *Orrorin*) are disputed; brain size is not the same as intelligence.`,
      idea: String.raw`A brain is metabolically costly: in people it is about $2\%$ of body mass but roughly a fifth of resting energy use. Aiello and Wheeler's *expensive-tissue hypothesis* (1995) proposed that a bigger brain could be paid for by a smaller gut, made possible by a richer, more digestible diet (meat, later cooking). The picture computes this budget: take a metabolic rate that scales as $M^{3/4}$ (Kleiber's law), use the paper’s 11.2 W/kg brain cost, converting cm³ to grams with an explicitly assumed 1 g/cm³ density, and the brain's share of the whole budget climbs from under a tenth for a chimpanzee-sized brain to about a fifth. Bipedal locomotion and diet/tool hypotheses supply possible context; this arithmetic does not establish their causal roles or the brain–gut trade-off. The mammal lineage that made this possible survived the end-Cretaceous impact (bighist-3.9).`,
      caption: String.raw`Left: approximate species ranges as boxes (age span across, braincase volume up), with the first evidence of upright walking along the bottom and a trend line fitted to the centres of the *Homo* boxes. Right: choose a species or set the brain volume and body mass yourself; the bar shows the energy budget and the readout the brain's share. Varying brain volume at fixed body mass reallocates a fixed allometric total; it does not simulate a smaller gut. The numbers are indicative, and the budget is model arithmetic.`,
      deps: ['bighist-3.9'],
      see: ['bighist-4.7'],
      refs: ['Aiello & Wheeler1995, Current Anthropology36:199–221, full main article pp199–211, especially Eq3 and Tables1–2; full original https://gwern.net/doc/algernon/1995-aiello.pdf'],
      credit: 'Aiello & Wheeler, 1995 (expensive-tissue hypothesis)',
      tags: ['hominins', 'brain', 'energy'],
      scope: String.raw`Rounded, indicative species ranges; the trend line is fitted to box centres, not to individual fossils. The energy model uses Aiello–Wheeler Eq. 3 (3.39 M^0.75 W) and Table 1 (11.2 W/kg of brain), with a teaching volume-to-mass conversion of 1 g/cm³ applied equally to all presets; this does not estimate fossil organ masses or gut sizes.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Human_evolution', doi: 'https://doi.org/10.1086/204350' },
      verify: true,
      viz(v) {
        const A = v.stage({ x: [-4.7, 1.9], y: [0, 1950], axes: 'box', gutter: true, height: 380, weight: 1.35, xlabel: 'age (Ma ago)', ylabel: 'braincase volume (cm³)', xticks: [[-4, '4'], [-3, '3'], [-2, '2'], [-1, '1'], [0, '0']], title: 'species ranges (rounded)' });
        const B = v.stage({ x: [0, 5], y: [0, 125], axes: 'box', gutter: true, height: 380, weight: 1, ylabel: 'resting power (W)', xticks: [[0.5, 'chimp-like'], [1.5, 'A. afarensis'], [2.5, 'H. erectus'], [3.5, 'H. sapiens'], [4.5, 'yours']], title: 'energy budget of the brain' });
        const PRE = { 'chimp-like': [400, 45], 'A. afarensis': [450, 40], 'H. erectus': [900, 55], 'H. sapiens': [1350, 65] };
        let cc, kg;
        const sel = v.select('preset', Object.keys(PRE), 'H. sapiens', { onChange: (n) => { cc.set(PRE[n][0]); kg.set(PRE[n][1]); } });
        cc = v.slider('brain volume (cm³)', 350, 1700, 1350, { step: 10 });
        kg = v.slider('body mass (kg)', 25, 90, 65, { step: 1 });
        // trend through the centres of the Homo boxes: ln(cc) = a + b t
        const hom = HOMININS.filter((h) => h[0].startsWith('H.')).map((h) => [-(h[1] + h[2]) / 2, Math.log((h[3] + h[4]) / 2)]);
        const n = hom.length, mx = hom.reduce((s, p) => s + p[0], 0) / n, my = hom.reduce((s, p) => s + p[1], 0) / n;
        const bs = hom.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / hom.reduce((s, p) => s + (p[0] - mx) ** 2, 0), as = my - bs * mx;
        v.render(() => {
          for (const [name, f, t, lo, hi, col, lx, ly, al] of HOMININS) {
            A.rect(-f, lo, -t, hi, { fill: col, fillAlpha: 0.22, color: col, width: 1.4, radius: 3 });
            A.text(name, lx, ly, { size: 10.5, color: col, align: al });
          }
          A.fn((t) => Math.exp(as + bs * t), { domain: [-2.1, 0], color: 'ink', width: 1.6, dash: [5, 4] });
          A.hline(400, { color: 'faint', width: 1, dash: [2, 3] });
          for (const [t] of BIPED) A.dot(t, 120, { r: 4.5, color: 'ink' });
          A.text('● upright walking: Ardipithecus 4.4 · Laetoli 3.7 · “Lucy” 3.2 Ma', -4.65, 40, { size: 10, color: 'muted', align: 'left' });
          // energy stage
          const bars = [...Object.entries(PRE).map(([k, [c, m]], i) => [i + 0.5, c, m]), [4.5, cc.value, kg.value]];
          for (const [x, c, m] of bars) {
            const tot = kleiber(m), br = brainW(c);
            B.rect(x - 0.32, 0, x + 0.32, tot - br, { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 1 });
            B.rect(x - 0.32, tot - br, x + 0.32, tot, { fill: 'gold', fillAlpha: 0.7, color: 'gold', width: 1 });
            B.text(`${v.fix((100 * br) / tot, 0)}%`, x, tot + 4, { size: 11, color: 'ink', align: 'center', baseline: 'bottom' });
          }
          v.legend([['gold', 'brain'], ['muted', 'everything else']]);
        });
        v.readout(() => {
          const tot = kleiber(kg.value), br = brainW(cc.value);
          const t2 = Math.exp(as + bs * -2), t0 = Math.exp(as);
          return `Your brain: **${v.fix(br, 1)} W** of a **${v.fix(tot, 0)} W** resting budget = **${v.fix((100 * br) / tot, 0)}%** (model arithmetic).\nTrend through the *Homo* box centres: ${v.fix(t2, 0)} cm³ at 2 Ma ago to ${v.fix(t0, 0)} cm³ today, a factor ${v.fix(t0 / t2, 1)} (rounded inputs).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Glacial cycles and Milankovitch forcing',
      statement: String.raw`For the last $2.6$ million years the Earth has swung between glacial and interglacial climates. The record in deep-sea sediment and ice shows these swings have spectral peaks at periods close to those of the Earth's orbit: about $41\,000$ years (the tilt, or *obliquity*, of the axis between about $22.1^\circ$ and $24.5^\circ$), about $19\,000$–$23\,000$ years (the *precession* of the equinoxes, which swings the season of closest approach to the Sun) and, in the last million years, about $100\,000$ years (cycles of eccentricity). The orbital changes barely alter the yearly total of sunlight but they redistribute it across seasons and latitudes; the **Milankovitch hypothesis** says that summer sunlight at high northern latitudes, where land can carry ice, paces the ice sheets. Hays, Imbrie and Shackleton (1976) provided an influential spectral and phase-coherence test using two deep-sea cores.

**Scope.** Orbital forcing is the pacemaker, not the whole mechanism: the response needs ice-sheet, ocean and carbon-cycle feedbacks, and why the 100 kyr cycle dominates the last million years, although it is the weakest forcing, is unsettled.`,
      idea: String.raw`The summer-solstice insolation at latitude $\varphi$ depends on three orbital elements: the tilt $\varepsilon$, the eccentricity $e$ and the precession angle $\varpi$ through the factor $\bigl((1+e\sin\varpi)/(1-e^2)\bigr)^2$ for the Earth–Sun distance. Tilt acts on the whole high-latitude summer, precession acts on the distance, and eccentricity modulates precession and also changes the distance factor and annual-mean flux at order e² (the precession index is $e\sin\varpi$). A simple ice model makes the pacemaker idea concrete: an ice volume $V$ relaxes toward $-$(summer insolation), with separate growth and melt time constants ($\tau_g$ and $\tau_m$); the usual glacial-asymmetry setting has growth slower than melting, as in Imbrie and Imbrie (1980). The precession of the equinoxes is the slow wobble of the spinning Earth treated in mechanics (mech-10.18).`,
      caption: String.raw`Top left: the three caricature orbital elements over the last 800 kyr (visibility toggles; these hide curves, while the computed forcing retains all three elements; the orbit is a few-term sketch, not the Laskar solution). Top right: summer-solstice insolation at the chosen latitude and the ice volume that results from it (high = more ice). Bottom: the periodogram of each; vertical lines mark 100, 41 and 21 kyr (the model's precession is a single 21 kyr line; the real one splits into 23 and 19). Change the latitude and the two time constants. The spectral ordinate is squared Fourier amplitude, normalized separately for each curve. The ice-core temperature record is not drawn; no measured spectrum is fitted.`,
      deps: ['mech-10.18', 'sig-4.1'],
      see: ['bighist-4.3', 'bighist-4.8'],
      refs: ['Hays, Imbrie & Shackleton1976, Science194:1121–1132, full main text/methods and Figs4–9: https://www.whoi.edu/cms/files/hays76sci_268464.pdf; Imbrie & Imbrie1980, Science207:943–953, model Eqs1–2/Fig4 and tuning pp948–950: https://www.whoi.edu/cms/files/imbrie80sci_268884.pdf'],
      credit: 'Milankovitch, 1941 (following Croll and Adhémar); Hays, Imbrie & Shackleton, 1976',
      tags: ['climate', 'orbital forcing', 'ice ages'],
      scope: String.raw`Caricature orbit and a two-time-constant ice model with exact relaxation under piecewise-constant one-kyr forcing; the 2,000 kyr spectral window follows 4,000 kyr of spin-up, and the time plot shows its last 800 kyr. This is not the original Imbrie parameter fit; the lines in the periodogram are indicative of the spectral peaks, not a reconstruction of any record.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Milankovitch_cycles', doi: 'https://doi.org/10.1126/science.194.4270.1121' },
      verify: true,
      viz(v) {
        const tg = [v.toggle('show eccentricity', true), v.toggle('show tilt', true), v.toggle('show precession', true)];
        const lat = v.slider('latitude (°N)', 30, 80, 65, { step: 1 });
        const tauG = v.slider('ice growth τ (kyr)', 10, 150, 30, { step: 1 });
        const tauM = v.slider('ice melt τ (kyr)', 2, 40, 10, { step: 1 });
        const A = v.stage({ x: [-800, 0], y: [0, 5.2], axes: 'box', gutter: true, height: 270, xlabel: 'time (kyr ago, negative)', title: 'orbital elements (caricature)', yticks: [] });
        const B = v.stage({ x: [-800, 0], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 270, xlabel: 'time (kyr ago, negative)', ylabel: 'normalised', title: 'summer insolation and ice volume' });
        const C = v.stage({ x: [0, 0.075], y: [0, 1.05], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'frequency (kyr⁻¹); tick labels give periods in kyr', ylabel: 'power (relative)', xticks: [[0.01, '100'], [1 / 41, '41'], [1 / 21, '21']], title: 'periodograms (2,000 kyr window after 4,000 kyr spin-up)' });
        let cache = null, cacheKey = '';
        function run() {
          const key = `${lat.value}|${tauG.value}|${tauM.value}`;
          if (key === cacheKey) return cache;
          const {Q,x,ice,m,sd}=orbitalRun(lat.value,tauG.value,tauM.value);
          const sp = (arr) => { const o = v.M.spectrum(arr.slice(1, 2001).map((y) => y), 1); return { f: o.freq, a: relativePower(o.amp) }; };
          cache = { Q, x, ice, s1: sp(x), s2: sp(ice), m, sd };
          cacheKey = key; return cache;
        }
        v.render(() => {
          const R = run(), ts = [];
          for (let t = -800; t <= 0; t += 2) ts.push(t);
          if (tg[0].value) A.path(ts.map((t) => [t, 4.2 + (0.55 * (eccT(t) - 0.028)) / 0.02]), { color: 'purple', width: 2 });
          if (tg[1].value) A.path(ts.map((t) => [t, 2.8 + ((oblT(t) - 23.34) / 1.2) * 0.5]), { color: 'orange', width: 2 });
          if (tg[2].value) A.path(ts.map((t) => [t, 1.0 + eccT(t) * Math.sin(varpiT(t)) * 8]), { color: 'teal', width: 1.6 });
          A.text('eccentricity', -795, 4.95, { size: 10.5, color: 'purple', align: 'left' });
          A.text('tilt (22.1°–24.5°)', -795, 3.5, { size: 10.5, color: 'orange', align: 'left' });
          A.text('precession index e sin ϖ', -795, 1.75, { size: 10.5, color: 'teal', align: 'left' });
          const N = R.Q.length - 1;
          const values=ts.flatMap(t=>[R.x[N+t],R.ice[N+t]]);B.setView([-800,0],[Math.min(-2.6,...values)*1.05,Math.max(2.6,...values)*1.05]);
          B.path(ts.map((t) => [t, R.x[N + t]]), { color: 'orange', width: 1.6 });
          B.path(ts.map((t) => [t, R.ice[N + t]]), { color: 'accent', width: 2.6 });
          B.hline(0, { color: 'faint', width: 1, dash: [2, 3] });
          C.path(R.s1.f.map((f, i) => [f, R.s1.a[i]]).filter((p) => p[0] < 0.075 && p[0] > 0.004), { color: 'orange', width: 1.8 });
          C.path(R.s2.f.map((f, i) => [f, R.s2.a[i]]).filter((p) => p[0] < 0.075 && p[0] > 0.004), { color: 'accent', width: 2.2 });
          for (const P of [100, 41, 21]) C.vline(1 / P, { color: 'faint', width: 1, dash: [3, 3] });
          v.legend([['orange', 'summer insolation (normalised)'], ['accent', 'ice volume (model)']]);
        });
        v.readout(() => {
          const R = run();
          const pk = (s, a, b) => { let best = 0, bi = 0; s.f.forEach((f, i) => { if (f >= 1 / b && f <= 1 / a && s.a[i] > best) { best = s.a[i]; bi = i; } }); return { P: 1 / s.f[bi], a: best }; };
          const p1 = pk(R.s2, 70, 140), p2 = pk(R.s2, 36, 46), p3 = pk(R.s2, 18, 25);
          const q0 = R.Q[R.Q.length - 1];
          return `Summer-solstice insolation at ${lat.value}° N: **${v.fix(q0, 0)} W/m²** today (model); over 800 kyr it ranges ${v.fix(Math.min(...R.Q.slice(-801)), 0)}–${v.fix(Math.max(...R.Q.slice(-801)), 0)}.\nIce-volume peaks (relative): near ${v.fix(p1.P, 0)} kyr **${v.fix(p1.a, 2)}**, near ${v.fix(p2.P, 0)} kyr **${v.fix(p2.a, 2)}**, near ${v.fix(p3.P, 0)} kyr **${v.fix(p3.a, 2)}**. The forcing here carries little 100 kyr power; the real records show much more (the “100 kyr problem”). ${tauG.value <= tauM.value ? 'Current settings remove or reverse the usual slow-growth/fast-melt asymmetry.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.3',
      kind: 'Event',
      name: 'Out of Africa',
      statement: String.raw`Anatomically modern *Homo sapiens* appeared in Africa, with the oldest fossils at about $315\,000$ years ago (Jebel Irhoud, Morocco) and Omo I fossils older than the overlying ash dated $233\pm22$ka (2σ) at Omo Kibish, Ethiopia. The latter is a minimum-age constraint, not a direct fossil age. Populations reached the Levant at least $180\,000$ years ago (Misliya), but the dispersals that left lasting ancestry outside Africa came later: genetic evidence puts the main expansion at some $50\,000$–$70\,000$ years ago. From the Near East modern humans reached Europe and Siberia by about $45\,000$ years ago, Australia and New Guinea (one end of the long southern route) by at least $50\,000$, and the Americas by at least $15\,000$ and possibly $21\,000$–$23\,000$ years ago.

**Scope.** The dated sites on the map are individual finds and give minimum ages for arrival; older sites and early dispersals that left no lasting descendants are possible. Several ages shown here are contested.`,
      idea: String.raw`The case rests on three independent kinds of evidence. Fossils and artefacts give minimum arrival dates for each region. DNA gives the pattern of diversity, which falls with distance from Africa, and the relatedness of living peoples; molecular clocks (popgen-3.9) date the splits. And the genomes of ancient people, such as the $45\,000$-year-old Ust'-Ishim man in Siberia, show who was where. The fossil dates keep moving back (Misliya, Madjedbebe, White Sands are each the subject of argument), which is why the picture treats every date as a lower bound, and the readout divides a straight-line distance by a gap between dated-site markers; it does not infer a migration speed.`,
      caption: String.raw`Move the time slider from 320 ka ago down to the present (0): a site lights up once its age has been reached (colour = region), and the chains of dashed lines join the sites of each region in order. Use the view buttons or drag the globe to turn it. Toggle the alternative Madjedbebe marker between 65 and 50 ka: geography stays fixed while the dated-site age gap changes. The readout gives the great-circle distance from Omo Kibish to the youngest lit site and the distance divided by the dated-site age gap for two sites you choose; this is not an observed or bounded migration speed.`,
      deps: ['bighist-4.1', 'popgen-3.9', 'geol-2.11'],
      see: ['bighist-4.4', 'bighist-4.5', 'bighist-4.2'],
      refs: ['Vidal et al.2022, Nature601:579–583, complete original main text and dating Methods, Fig1 stratigraphy/Fig2 age: https://www.nature.com/articles/s41586-021-04275-8.pdf; remaining ten site dates and genetic-expansion assertions still require full primary readings'],
      credit: 'fossil and genetic evidence accumulated since the 1980s; site dates from Hublin et al. 2017, Vidal et al. 2022, Hershkovitz et al. 2018, Clarkson et al. 2017, Fu et al. 2014, Bennett et al. 2021',
      tags: ['dispersal', 'Homo sapiens', 'archaeology'],
      scope: String.raw`Sites give minimum ages; routes are straight geodesics between sites, not reconstructed paths.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Recent_African_origin_of_modern_humans' },
      verify: true,
      viz(v) {
        const S = v.stage({ height: 400, full: true, title: 'dated sites of Homo sapiens (minimum ages)' });
        const G = v.globe(S, { projection: 'orthographic', center: [60, 25], graticule: 30 });
        const T = v.slider('time (ka ago)', 0, 320, 0, { step: 1 });
        const view = v.select('view', [{ value: 'old', label: 'Old World' }, { value: 'pac', label: 'Pacific' }, { value: 'am', label: 'Americas' }], 'old', { onChange: (k) => G.set({ center: { old: [60, 25], pac: [140, -5], am: [-85, 15] }[k] }) });
        const tMung = v.toggle('Madjedbebe at 50 ka instead of 65', false);
        const proj = v.select('map', [{ value: 'orthographic', label: 'globe' }, { value: 'equirectangular', label: 'flat' }], 'orthographic', { onChange: (p) => { G.set({ projection: p, center: { old: [60,25], pac: [140,-5], am: [-85,15] }[view.value] }); } });
        const A = v.select('from', SITES.map((s) => s[0]), 'Omo Kibish');
        const B = v.select('to', SITES.map((s) => s[0]), 'Monte Verde');
        const ageOf = (s) => (s[0] === 'Madjedbebe' && tMung.value ? 50 : s[3]);
        v.render(() => {
          G.draw();
          const lit = SITES.filter((s) => ageOf(s) >= T.value);
          const byGroup = {};
          for (const s of SITES) (byGroup[s[4]] = byGroup[s[4]] || []).push(s);
          for (const g of Object.keys(byGroup)) {
            const arr = byGroup[g].filter((s) => ageOf(s) >= T.value).sort((a, b) => ageOf(b) - ageOf(a));
            for (let i = 1; i < arr.length; i++) G.path([[arr[i - 1][1], arr[i - 1][2]], [arr[i][1], arr[i][2]]], { color: GROUP_COLOR[g], width: 1.2, alpha: 0.5, dash: [3, 3] });
          }
          // routes from Africa to the first lit site of each non-African group
          for (const g of ['levant', 'sahul', 'europe', 'siberia', 'east', 'america']) {
            const arr = byGroup[g].filter((s) => ageOf(s) >= T.value).sort((a, b) => ageOf(b) - ageOf(a));
            if (arr.length && lit.some((s) => s[4] === 'africa')) G.path([[35.9, 5.4], [arr[0][1], arr[0][2]]], { color: GROUP_COLOR[g], width: 1, alpha: 0.35 });
          }
          for (const s of SITES) {
            const on = ageOf(s) >= T.value;
            G.dot([s[1], s[2]], { r: on ? 6 : 3, color: GROUP_COLOR[s[4]], hollow: !on });
            const lo = LABEL_OFF[s[0]] || [0, -10, 'center'];
            if (on) G.text(`${s[0]} ${s[0] === 'Omo Kibish' ? '>233±22 ka' : `${ageOf(s)} ka`}`, [s[1], s[2]], { size: 10, color: 'ink', dx: lo[0], dy: lo[1], align: lo[2] });
          }
        });
        v.readout(() => {
          const sa = SITES.find((s) => s[0] === A.value), sb = SITES.find((s) => s[0] === B.value);
          const lit = SITES.filter((s) => ageOf(s) >= T.value).sort((a, b) => ageOf(a) - ageOf(b));
          const youngest = lit[0];
          const km = (p, q) => v.geo('haversine', [p[1], p[2]], [q[1], q[2]]);
          const dAB = km(sa, sb), dt = Math.abs(ageOf(sa) - ageOf(sb)) * 1000;
          const dO = youngest ? km(SITES[1], youngest) : 0;
          return `At ${T.value} ka the youngest lit site is **${youngest ? youngest[0] : '—'}**, ${v.fix(dO, 0)} km (great circle) from Omo Kibish.\n${sa[0]} → ${sb[0]}: ${v.fix(dAB, 0)} km in ${v.fix(dt / 1000, 1)} kyr = **${dt > 0 ? v.fix(dAB / dt * 1000, 1) : '—'} km per millennium** as a ratio of the straight-line distance to the dated-site age gap. The sites need not belong to a single migration, and minimum arrival ages do not bound the true travel time (1 km/yr = 1,000 km per millennium).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.4',
      kind: 'Model',
      name: 'The serial founder effect',
      statement: String.raw`Suppose a population spreads along a route in steps: each new group is founded by a small sample of $N_f$ diploid individuals from the previous one, and then grows large. At a given genetic locus with allele frequency $p$, the founders carry a binomial sample of the $2N_f$ gene copies, so the expected heterozygosity $H = 2p(1-p)$ shrinks by the factor $(1 - 1/(2N_f))$ at each step. After $k$ steps from the origin the expected diversity is
$$\mathbb E[H_k] = H_0\Bigl(1-\frac1{2N_f}\Bigr)^k \approx H_0\,e^{-k/(2N_f)},$$
and since $k$ is proportional to the distance travelled, diversity decays roughly **linearly with distance from the origin** over the initial range $k/(2N_f)\ll1$. Ramachandran and colleagues (2005) found that heterozygosity in worldwide human populations declines nearly linearly with distance from East Africa, as this model predicts.

**Scope.** The model assumes independent loci, no gene flow after founding, no mutation during the spread and equal bottlenecks; real data are also shaped by admixture, selection and population structure, and other models also give a decline with distance.`,
      idea: String.raw`Each founder event is one generation of Wright–Fisher drift (popgen-2.1) with a tiny population, so it loses a fraction $1/(2N_f)$ of the heterozygosity in expectation and leaves many alleles at frequency $0$ or $1$ (rare variants vanish first). Repeating it $k$ times compounds the losses geometrically, $(1-1/2N_f)^k$, which looks like a straight line for the first part of the decay. The same argument is consistent with lower heterozygosity among more distant populations in the paper’s microsatellite sample, and gives the idea a role in testing the origin of modern humans (4.3): the origin that gives the best straight line is the one in Africa.`,
      caption: String.raw`A chain of 400 independent loci passes through steps of founders. Change the founder size, the number of steps or press Resample (new random chains, thin lines; bold = mean over the chains). The dashed line is the formula. The right panel shows the allele-frequency histogram at the start and at the end of the route.`,
      deps: ['bighist-4.3', 'popgen-2.9', 'popgen-2.1'],
      see: ['bighist-4.6'],
      refs: ['Ramachandran et al. (2005), PNAS102:15942–15947, Methods and Figs4–5, eq(8); complete author PDF: https://web.stanford.edu/group/rosenberglab/papers/RamachandranEtAl2005-PNAS.pdf'],
      credit: 'Ramachandran et al., 2005 (fit to worldwide heterozygosity)',
      tags: ['genetic drift', 'founder effect', 'diversity'],
      scope: String.raw`A plain founder chain, not a fit to the human data; no gene flow, mutation or selection.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Serial_founder_effect', doi: 'https://doi.org/10.1073/pnas.0507611102' },
      viz(v) {
        const Nf = v.slider('founders per step $N_f$', 2, 200, 10, { step: 1, int: true, log: true });
        const K = v.slider('steps', 3, 24, 16, { step: 1, int: true });
        const seedBtn = { s: 3 };
        v.button('Resample', () => { seedBtn.s += 1; });
        const A = v.stage({ x: [0, 24], y: [0, 0.6], axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'steps from the origin (≈ distance)', ylabel: 'heterozygosity H', title: 'diversity falls along the route' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'allele frequency', ylabel: 'fraction of loci', title: 'allele frequencies: start vs end' });
        const L = 400, R = 20;
        const sim = () => {
          const r = v.rng(seedBtn.s * 977 + Nf.value * 13 + K.value);
          const runs = [];
          let p0 = Array.from({ length: L }, () => { const u = r(); return 0.5 * (1 - Math.cos(Math.PI * u)) * 0.98 + 0.01; }); // U-shaped-ish start
          const H = (p) => p.reduce((s, q) => s + 2 * q * (1 - q), 0) / p.length;
          for (let c = 0; c < R; c++) {
            let p = p0.slice(); const hs = [H(p)];
            for (let k = 1; k <= K.value; k++) {
              p = p.map((q) => founderSample(r, q, Nf.value));
              hs.push(H(p));
            }
            runs.push({ hs, pEnd: p });
          }
          return { runs, p0 };
        };
        let key = '', cache = null;
        v.render(() => {
          const kk = `${Nf.value}|${K.value}|${seedBtn.s}`;
          if (kk !== key) { cache = sim(); key = kk; }
          const { runs, p0 } = cache;
          const H0 = runs[0].hs[0];
          for (const rn of runs) A.path(rn.hs.map((h, k) => [k, h]), { color: 'accent', width: 1, alpha: 0.28 });
          const mean = Array.from({ length: K.value + 1 }, (_, k) => runs.reduce((s, rn) => s + rn.hs[k], 0) / runs.length);
          A.path(mean.map((h, k) => [k, h]), { color: 'accent', width: 3 });
          A.fn((k) => H0 * (1 - 1 / (2 * Nf.value)) ** k, { domain: [0, K.value], color: 'orange', width: 2, dash: [5, 4] });
          const bins = 10, hist = (arr) => { const c = Array(bins).fill(0); arr.forEach((q) => { c[Math.min(bins - 1, Math.floor(q * bins))]++; }); return c.map((x) => x / arr.length); };
          const h0 = hist(p0), h1 = hist(runs[0].pEnd);
          h0.forEach((f, i) => { B.rect(i / bins + 0.005, 0, (i + 0.5) / bins, f, { fill: 'teal', fillAlpha: 0.35, color: 'teal', width: 1 }); });
          h1.forEach((f, i) => { B.rect((i + 0.5) / bins, 0, (i + 1) / bins - 0.005, f, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1 }); });
          A.setView([0, K.value], [0, H0 * 1.15]);
          B.setView([0, 1], [0, Math.max(0.2, Math.min(1, Math.max(...h0, ...h1) * 1.15))]);
          v.legend([['accent', 'chains (thin) and mean (bold)'], ['orange', '$H_0(1-1/2N_f)^k$', { dash: true }], ['teal', 'start (left bars)'], ['red', 'end (right bars)']]);
          cache.mean = mean;
        });
        v.readout(() => {
          if (!cache) return '';
          const mean = cache.mean, n = mean.length;
          const xs = mean.map((_, k) => k), lr = v.M.linreg(xs, mean);
          const fixed = cache.runs[0].pEnd.filter((q) => q === 0 || q === 1).length / L;
          return `Mean $H$ falls from **${v.fix(mean[0], 3)}** to **${v.fix(mean[n - 1], 3)}** in ${n - 1} steps (formula: ${v.fix(mean[0] * (1 - 1 / (2 * Nf.value)) ** (n - 1), 3)}). A straight line through the mean has $R^2 = ${v.fix(lr.r2, 3)}$.\nIn the first chain **${v.fix(100 * fixed, 0)}%** of loci are fixed (frequency 0 or 1) at the end, against ${v.fix(100 * cache.p0.filter((q) => q === 0 || q === 1).length / L, 0)}% at the start.`;
        });
      },
    },
  ],
};
