// Big History & Quantitative History — Chapter 4: Human origins (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
//
// Sources checked (Oct 2026). Crossref was used for bibliographic details; "rounded" means the number was not taken from one table.
//   4.1 Aiello & Wheeler, Curr. Anthropol. 36: 199 (1995) (expensive-tissue hypothesis; Crossref-checked). Species age spans and
//     cranial-capacity ranges are rounded, indicative values from textbook-level summaries (several disagree by tens of cm3 at
//     the edges; the Dmanisi skull 5 value of 546 cm3 was confirmed by a web search); they are boxes, not a specimen table.
//     Bipedalism markers: Ardipithecus ramidus about 4.4 Ma, Laetoli footprints about 3.7 Ma, "Lucy" about 3.2 Ma (all rounded,
//     not re-checked). Brain power of about 16 W for 1,350 cm3 and Kleiber's 3.4 M^0.75 W are model arithmetic (about 20% of rest).
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

// ── 4.1 helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// [name, age from Ma, age to Ma, cm3 low, cm3 high, colour, label x, label y]  (rounded, indicative)
const HOMININS = [
  ['A. afarensis', 3.9, 3.0, 400, 550, 'orange', -3.45, 600, 'center'],
  ['A. africanus', 3.0, 2.0, 420, 600, 'teal', -2.85, 650, 'center'],
  ['P. boisei', 2.3, 1.2, 480, 550, 'purple', -1.45, 440, 'center'],
  ['H. habilis', 2.3, 1.65, 500, 700, 'gold', -1.75, 750, 'right'],
  ['H. erectus', 1.9, 0.1, 550, 1100, 'accent', -1.0, 800, 'center'],
  ['H. heidelbergensis', 0.7, 0.2, 1100, 1400, 'pink', 0.05, 1260, 'left'],
  ['H. neanderthalensis', 0.43, 0.04, 1200, 1750, 'red', 0.05, 1680, 'left'],
  ['H. sapiens', 0.3, 0, 1100, 1750, 'green', 0.05, 1470, 'left'],
];
const BIPED = [[-4.4, 'Ardipithecus', 205], [-3.66, 'Laetoli footprints', 165], [-3.2, '“Lucy”', 205]];
const kleiber = (kg) => 3.4 * kg ** 0.75;       // basal metabolic rate, W
const brainW = (cc) => 0.0119 * cc;             // W, scaled from about 16 W at 1,350 cm3

// ── 4.2 helpers: caricature orbital elements, t in kyr (negative = past) ───────────────────────────────────────────────────
const D2R = Math.PI / 180;
const ECC = [[0.011, 405], [0.0083, 124], [0.0077, 95]];
const ECC_PH = (() => {
  const ph = [0, 1.0, 2.3];
  ph[0] = Math.acos(clamp((0.0167 - 0.028 - ECC[1][0] * Math.cos(ph[1]) - ECC[2][0] * Math.cos(ph[2])) / ECC[0][0], -1, 1));
  return ph;
})();
const eccT = (t) => 0.028 + ECC.reduce((s, [A, P], k) => s + A * Math.cos((2 * Math.PI * t) / P + ECC_PH[k]), 0);
const oblT = (t) => 23.34 + 1.2 * Math.cos((2 * Math.PI * t) / 41 + 1.49);
const varpiT = (t) => 283 * D2R + (2 * Math.PI * t) / 21;
/** Daily-mean insolation at the summer solstice, W/m2, latitude `lat` (degrees). */
function solsticeQ(t, lat) {
  const e = eccT(t), E = oblT(t) * D2R, w = varpiT(t), phi = lat * D2R;
  const rho = (1 + e * Math.sin(w)) / (1 - e * e);
  const ch = -Math.tan(phi) * Math.tan(E);
  const h0 = ch >= 1 ? 0 : ch <= -1 ? Math.PI : Math.acos(ch);
  return (1361 / Math.PI) * rho * rho * (h0 * Math.sin(phi) * Math.sin(E) + Math.cos(phi) * Math.cos(E) * Math.sin(h0));
}

// ── 4.3 helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// [name, lon, lat, age in ka, group, note]
const SITES = [
  ['Jebel Irhoud', -8.9, 31.9, 315, 'africa', 'early H. sapiens'],
  ['Omo Kibish', 35.9, 5.4, 233, 'africa', 'Omo I'],
  ['Misliya', 35.0, 32.7, 185, 'levant', 'upper jaw, 177–194 ka'],
  ['Qafzeh', 35.3, 32.7, 100, 'levant', 'rounded'],
  ['Madjedbebe', 132.9, -12.6, 65, 'sahul', 'contested; ≈50 ka widely used'],
  ['Lake Mungo', 143.1, -33.7, 42, 'sahul', 'rounded'],
  ['Bacho Kiro', 25.4, 42.9, 45, 'europe', 'before 45 ka'],
  ['Ust’-Ishim', 71.0, 57.7, 45, 'siberia', 'genome, 45 ka'],
  ['Tianyuan', 115.9, 39.6, 40, 'east', 'rounded'],
  ['White Sands', -106.2, 32.8, 22, 'america', '21–23 ka, contested'],
  ['Monte Verde', -73.2, -41.5, 14.5, 'america', 'rounded'],
];
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
      idea: String.raw`A brain is expensive: in people it is about $2\%$ of body mass but roughly a fifth of resting energy use. Aiello and Wheeler's *expensive-tissue hypothesis* (1995) proposed that a bigger brain could be paid for by a smaller gut, made possible by a richer, more digestible diet (meat, later cooking). The picture computes this budget: take a metabolic rate that scales as $M^{3/4}$ (Kleiber's law), give the brain about $0.012\ \mathrm{W}$ per cm³, and the brain's share of the whole budget climbs from under a tenth for a chimpanzee-sized brain to about a fifth. Standing on two legs freed the hands and made walking long distances cheaper, which fits the earlier change; the later brain growth fits the diet-and-tools story. The mammal lineage that made this possible survived the end-Cretaceous impact (bighist-3.9).`,
      caption: String.raw`Left: approximate species ranges as boxes (age span across, braincase volume up), with the first evidence of upright walking along the bottom and a trend line fitted to the centres of the *Homo* boxes. Right: choose a species or set the brain volume and body mass yourself; the bar shows the energy budget and the readout the brain's share. The numbers are indicative, and the budget is model arithmetic.`,
      deps: ['bighist-3.9'],
      see: ['bighist-4.7'],
      refs: ['Christian'],
      credit: 'Aiello & Wheeler, 1995 (expensive-tissue hypothesis)',
      tags: ['hominins', 'brain', 'energy'],
      scope: String.raw`Rounded, indicative species ranges; the trend line is fitted to box centres, not to individual fossils.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Human_evolution', doi: 'https://doi.org/10.1086/204350' },
      verify: true,
      viz(v) {
        const A = v.stage({ x: [-4.7, 1.9], y: [120, 1950], axes: 'box', gutter: true, height: 380, weight: 1.35, xlabel: 'age (Ma ago)', ylabel: 'braincase volume (cm³)', xticks: [[-4, '4'], [-3, '3'], [-2, '2'], [-1, '1'], [0, '0']], title: 'species ranges (rounded)' });
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
          for (const [t, lab, ty] of BIPED) { A.dot(t, 240, { r: 4.5, color: 'ink' }); A.text(lab, t, ty, { size: 10, color: 'muted', align: 'center', baseline: 'top' }); }
          A.text('first evidence of upright walking', -4.65, 300, { size: 10, color: 'muted', align: 'left' });
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
      statement: String.raw`For the last $2.6$ million years the Earth has swung between glacial and interglacial climates. The record in deep-sea sediment and ice shows these swings have spectral peaks at periods close to those of the Earth's orbit: about $41\,000$ years (the tilt, or *obliquity*, of the axis between about $22.1^\circ$ and $24.5^\circ$), about $19\,000$–$23\,000$ years (the *precession* of the equinoxes, which swings the season of closest approach to the Sun) and, in the last million years, about $100\,000$ years (cycles of eccentricity). The orbital changes barely alter the yearly total of sunlight but they redistribute it across seasons and latitudes; the **Milankovitch hypothesis** says that summer sunlight at high northern latitudes, where land can carry ice, paces the ice sheets. Hays, Imbrie and Shackleton (1976) gave the decisive evidence.

**Scope.** Orbital forcing is the pacemaker, not the whole mechanism: the response needs ice-sheet, ocean and carbon-cycle feedbacks, and why the 100 kyr cycle dominates the last million years, although it is the weakest forcing, is unsettled.`,
      idea: String.raw`The summer-solstice insolation at latitude $\varphi$ depends on three orbital elements: the tilt $\varepsilon$, the eccentricity $e$ and the precession angle $\varpi$ through the factor $\bigl((1+e\sin\varpi)/(1-e^2)\bigr)^2$ for the Earth–Sun distance. Tilt acts on the whole high-latitude summer, precession acts on the distance, and eccentricity only matters by modulating precession (the precession index is $e\sin\varpi$). A simple ice model makes the pacemaker idea concrete: an ice volume $V$ relaxes toward $-$(summer insolation), growing slowly (time constant $\tau_g$) and melting faster ($\tau_m$), as in Imbrie and Imbrie (1980). The precession of the equinoxes is the slow wobble of the spinning Earth treated in mechanics (mech-10.18).`,
      caption: String.raw`Top left: the three caricature orbital elements over the last 800 kyr (toggle each; the orbit is a few-term sketch, not the Laskar solution). Top right: summer-solstice insolation at the chosen latitude and the ice volume that results from it (high = more ice). Bottom: the periodogram of each; vertical lines mark 100, 41 and 21 kyr (the model's precession is a single 21 kyr line; the real one splits into 23 and 19). Change the latitude and the two time constants. The ice-core temperature record is not drawn, only the ideas it tested.`,
      deps: ['mech-10.18'],
      see: ['bighist-4.3', 'bighist-4.8'],
      refs: ['Christian'],
      credit: 'Milankovitch, 1941 (following Croll and Adhémar); Hays, Imbrie & Shackleton, 1976',
      tags: ['climate', 'orbital forcing', 'ice ages'],
      scope: String.raw`Caricature orbit (three terms per element) and a two-time-constant ice model; the lines in the periodogram are indicative of the spectral peaks, not a reconstruction of any record.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Milankovitch_cycles', doi: 'https://doi.org/10.1126/science.194.4270.1121' },
      verify: true,
      viz(v) {
        const tg = [v.toggle('eccentricity', true), v.toggle('tilt', true), v.toggle('precession', true)];
        const lat = v.slider('latitude (°N)', 30, 80, 65, { step: 1 });
        const tauG = v.slider('ice growth τ (kyr)', 10, 150, 30, { step: 1 });
        const tauM = v.slider('ice melt τ (kyr)', 2, 40, 10, { step: 1 });
        const A = v.stage({ x: [-800, 0], y: [0, 4.6], axes: 'box', gutter: true, height: 270, xlabel: 'time (kyr ago, negative)', title: 'orbital elements (caricature)', yticks: [] });
        const B = v.stage({ x: [-800, 0], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 270, xlabel: 'time (kyr ago, negative)', ylabel: 'normalised', title: 'summer insolation and ice volume' });
        const C = v.stage({ x: [0, 0.075], y: [0, 1.05], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'period (kyr)', ylabel: 'power (relative)', xticks: [[0.01, '100'], [1 / 41, '41'], [1 / 21, '21']], title: 'periodograms (2,000 kyr run)' });
        let cache = null, cacheKey = '';
        function run() {
          const key = `${lat.value}|${tauG.value}|${tauM.value}`;
          if (key === cacheKey) return cache;
          const NN = 2000, Q = [];
          for (let k = 0; k <= NN; k++) Q.push(solsticeQ(-NN + k, lat.value));
          const m = Q.reduce((s, q) => s + q, 0) / Q.length, sd = Math.sqrt(Q.reduce((s, q) => s + (q - m) ** 2, 0) / Q.length);
          const x = Q.map((q) => (q - m) / sd);
          let V = 0; const ice = [];
          for (const u of x) { const f = -u; V += (f - V) / (f > V ? tauG.value : tauM.value); ice.push(V); }
          const sp = (arr) => { const o = v.M.spectrum(arr.slice(1, 2001).map((y) => y), 1); const mxp = Math.max(...o.amp.slice(1)); return { f: o.freq, a: o.amp.map((q) => q / mxp) }; };
          cache = { Q, x, ice, s1: sp(x), s2: sp(ice), m, sd };
          cacheKey = key; return cache;
        }
        v.render(() => {
          const R = run(), ts = [];
          for (let t = -800; t <= 0; t += 2) ts.push(t);
          if (tg[0].value) A.path(ts.map((t) => [t, 3.55 + (0.55 * (eccT(t) - 0.028)) / 0.02]), { color: 'purple', width: 2 });
          if (tg[1].value) A.path(ts.map((t) => [t, 2.1 + ((oblT(t) - 23.34) / 1.2) * 0.55]), { color: 'orange', width: 2 });
          if (tg[2].value) A.path(ts.map((t) => [t, 0.9 + eccT(t) * Math.sin(varpiT(t)) * 8]), { color: 'teal', width: 1.6 });
          A.text('eccentricity', -795, 4.35, { size: 10.5, color: 'purple', align: 'left' });
          A.text('tilt (22.1°–24.5°)', -795, 2.75, { size: 10.5, color: 'orange', align: 'left' });
          A.text('precession index e sin ϖ', -795, 1.6, { size: 10.5, color: 'teal', align: 'left' });
          const N = R.Q.length - 1;
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
          return `Summer-solstice insolation at ${lat.value}° N: **${v.fix(q0, 0)} W/m²** today (model); over 800 kyr it ranges ${v.fix(Math.min(...R.Q.slice(-801)), 0)}–${v.fix(Math.max(...R.Q.slice(-801)), 0)}.\nIce-volume peaks (relative): near ${v.fix(p1.P, 0)} kyr **${v.fix(p1.a, 2)}**, near ${v.fix(p2.P, 0)} kyr **${v.fix(p2.a, 2)}**, near ${v.fix(p3.P, 0)} kyr **${v.fix(p3.a, 2)}**. The forcing here carries little 100 kyr power; the real records show much more (the “100 kyr problem”).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.3',
      kind: 'Event',
      name: 'Out of Africa',
      statement: String.raw`Anatomically modern *Homo sapiens* appeared in Africa, with the oldest fossils at about $315\,000$ years ago (Jebel Irhoud, Morocco) and $233\,000$ years ago (Omo Kibish, Ethiopia). Populations reached the Levant at least $180\,000$ years ago (Misliya), but the dispersals that left lasting ancestry outside Africa came later: genetic evidence puts the main expansion at some $50\,000$–$70\,000$ years ago. From the Near East modern humans reached Europe and Siberia by about $45\,000$ years ago, Australia and New Guinea (one end of the long southern route) by at least $50\,000$, and the Americas by at least $15\,000$ and possibly $21\,000$–$23\,000$ years ago.

**Scope.** The dated sites on the map are individual finds and give minimum ages for arrival; older sites and early dispersals that left no lasting descendants are possible. Several ages shown here are contested.`,
      idea: String.raw`The case rests on three independent kinds of evidence. Fossils and artefacts give minimum arrival dates for each region. DNA gives the pattern of diversity, which falls with distance from Africa, and the relatedness of living peoples; molecular clocks (popgen-3.9) date the splits. And the genomes of ancient people, such as the $45\,000$-year-old Ust'-Ishim man in Siberia, show who was where. The fossil dates keep moving back (Misliya, Madjedbebe, White Sands are each the subject of argument), which is why the picture treats every date as a lower bound, and the readout asks how fast a front would have had to travel to cover the distance between two dates.`,
      caption: String.raw`Move the time slider from 320 ka ago down to the present (0): a site lights up once its age has been reached (colour = region), and the chains of dashed lines join the sites of each region in order. Use the view buttons or drag the globe to turn it. Toggle the contested ages: with Madjedbebe at 50 ka the Australian route is a shorter, faster one. The readout gives the great-circle distance from Omo Kibish to the youngest lit site and the average speed implied by two sites you choose.`,
      deps: ['bighist-4.1', 'popgen-3.9'],
      see: ['bighist-4.4', 'bighist-4.5', 'bighist-4.2'],
      refs: ['Christian'],
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
        const proj = v.select('map', [{ value: 'orthographic', label: 'globe' }, { value: 'equirectangular', label: 'flat' }], 'orthographic', { onChange: (p) => { G.set({ projection: p, center: p === 'orthographic' ? [60, 25] : [30, 10] }); } });
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
            if (on) G.text(`${s[0]} ${ageOf(s)} ka`, [s[1], s[2]], { size: 10, color: 'ink', dx: lo[0], dy: lo[1], align: lo[2] });
          }
        });
        v.readout(() => {
          const sa = SITES.find((s) => s[0] === A.value), sb = SITES.find((s) => s[0] === B.value);
          const lit = SITES.filter((s) => ageOf(s) >= T.value).sort((a, b) => ageOf(a) - ageOf(b));
          const youngest = lit[0];
          const km = (p, q) => v.geo('haversine', [p[1], p[2]], [q[1], q[2]]);
          const dAB = km(sa, sb), dt = Math.abs(ageOf(sa) - ageOf(sb)) * 1000;
          const dO = youngest ? km(SITES[1], youngest) : 0;
          return `At ${T.value} ka the youngest lit site is **${youngest ? youngest[0] : '—'}**, ${v.fix(dO, 0)} km (great circle) from Omo Kibish.\n${sa[0]} → ${sb[0]}: ${v.fix(dAB, 0)} km in ${v.fix(dt / 1000, 1)} kyr = **${dt > 0 ? v.fix(dAB / dt * 1000, 1) : '—'} km per millennium** as a lower bound on the average front speed (straight line; 1 km/yr would be 1,000 km per millennium).`;
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
and since $k$ is proportional to the distance travelled, diversity decays roughly **linearly with distance from the origin** when the decay per step is small. Ramachandran and colleagues (2005) found that heterozygosity in worldwide human populations declines nearly linearly with distance from East Africa, as this model predicts.

**Scope.** The model assumes independent loci, no gene flow after founding, no mutation during the spread and equal bottlenecks; real data are also shaped by admixture, selection and population structure, and other models also give a decline with distance.`,
      idea: String.raw`Each founder event is one generation of Wright–Fisher drift (popgen-2.1) with a tiny population, so it loses a fraction $1/(2N_f)$ of the heterozygosity in expectation and leaves many alleles at frequency $0$ or $1$ (rare variants vanish first). Repeating it $k$ times compounds the losses geometrically, $(1-1/2N_f)^k$, which looks like a straight line for the first part of the decay. The same argument explains why the populations farthest from Africa, in the Americas, are the least diverse, and gives the idea a role in testing the origin of modern humans (4.3): the origin that gives the best straight line is the one in Africa.`,
      caption: String.raw`A chain of 400 independent loci passes through steps of founders. Change the founder size, the number of steps or press Resample (new random chains, thin lines; bold = mean over the chains). The dashed line is the formula. The right panel shows the allele-frequency histogram at the start and at the end of the route.`,
      deps: ['bighist-4.3', 'popgen-2.9', 'popgen-2.1'],
      see: ['bighist-4.6'],
      refs: ['Christian'],
      credit: 'Ramachandran et al., 2005 (fit to worldwide heterozygosity); the founder effect itself is due to Mayr, 1942',
      tags: ['genetic drift', 'founder effect', 'diversity'],
      scope: String.raw`A plain founder chain, not a fit to the human data; no gene flow, mutation or selection.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Serial_founder_effect', doi: 'https://doi.org/10.1073/pnas.0507611102' },
      verify: true,
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
              const n = 2 * Nf.value;
              p = p.map((q) => { let x = 0; for (let i = 0; i < n; i++) if (r() < q) x++; return x / n; });
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
          return `Mean $H$ falls from **${v.fix(mean[0], 3)}** to **${v.fix(mean[n - 1], 3)}** in ${n - 1} steps (formula: ${v.fix(mean[0] * (1 - 1 / (2 * Nf.value)) ** (n - 1), 3)}). A straight line through the mean has $R^2 = ${v.fix(lr.r2, 3)}$.\nIn the first chain **${v.fix(100 * fixed, 0)}%** of loci are fixed (frequency 0 or 1) at the end, against ${v.fix(100 * cache.p0.filter((q) => q < 0.011 || q > 0.989).length / L, 0)}% at the start.`;
        });
      },
    },
  ],
};
