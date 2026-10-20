import homininItem from './hominin-item.js';
// Big History & Quantitative History — Chapter 4: Human origins (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
//
// Sources checked (Oct 2026). Crossref was used for bibliographic details; "rounded" means the number was not taken from one table.
//   Audited4.1: actualAiello/Wheeler1995main199–211/reply217–218, Tables1/4/Fig6; historical summaries and authored accounting separated.
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
//   4.4 Actual complete Ramachandran2005 original source read; conditional model and saved seed repaired.
//     See docs/verification/bighist-founder-followup.md; source flag retained pending independent acceptance.

import { clamp } from './ch04.shared.js';
import founderItem from './founder-item.js';

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
  summary: String.raw`Bipedal hominins were present in Africa several million years ago, before the later marked enlargement of the brain. Ice ages paced by Earth’s orbital cycles shaped the environments our ancestors lived in. Modern humans spread out of Africa in the last hundred thousand years, losing genetic diversity at each step and interbreeding with Neanderthals and Denisovans on the way. Collective learning — the ability to share and accumulate knowledge — is Christian’s candidate for what made humans different.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    homininItem,
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
        const A = v.stage({ x: [-800, 0], y: [0, 5.2], axes: 'box', gutter: true, height: 270, xlabel: 'time (kyr ago, negative)', title: 'orbital elements (caricature)', yticks: [] });
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
          if (tg[0].value) A.path(ts.map((t) => [t, 4.2 + (0.55 * (eccT(t) - 0.028)) / 0.02]), { color: 'purple', width: 2 });
          if (tg[1].value) A.path(ts.map((t) => [t, 2.8 + ((oblT(t) - 23.34) / 1.2) * 0.5]), { color: 'orange', width: 2 });
          if (tg[2].value) A.path(ts.map((t) => [t, 1.0 + eccT(t) * Math.sin(varpiT(t)) * 8]), { color: 'teal', width: 1.6 });
          A.text('eccentricity', -795, 4.95, { size: 10.5, color: 'purple', align: 'left' });
          A.text('tilt (22.1°–24.5°)', -795, 3.5, { size: 10.5, color: 'orange', align: 'left' });
          A.text('precession index e sin ϖ', -795, 1.75, { size: 10.5, color: 'teal', align: 'left' });
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
    founderItem,
  ],
};
