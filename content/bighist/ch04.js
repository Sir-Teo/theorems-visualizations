import orbitsItem from './orbits-item.js';
import homininItem from './hominin-item.js';
// Big History & Quantitative History — Chapter 4: Human origins (items 4.1–4.4; 4.5–4.8 are in ch04-b.js)
//
// Sources checked (Oct 2026). Crossref was used for bibliographic details; "rounded" means the number was not taken from one table.
//   Audited4.1: actualAiello/Wheeler1995main199–211/reply217–218, Tables1/4/Fig6; historical summaries and authored accounting separated.
//   Audited4.2: actualHays1976main1121–1131/Imbrie1980main943–952; authored harmonics, daily insolation and finite response/power.
//   4.3 Site ages: Jebel Irhoud, Hublin et al., Nature 546: 289 (2017) (about 315 ka, recalled); Omo Kibish, Vidal et al., Nature
//     601: 579 (2022) (about 233 ka, confirmed by search); Misliya, Hershkovitz et al., Science 359: 456 (2018) (177-194 ka,
//     confirmed); Madjedbebe, Clarkson et al., Nature 547: 306 (2017) (65 ka, contested, with 50 ka widely used); Bacho Kiro,
//     Hublin et al., Nature 581: 299 (2020) (before 45 ka); Ust'-Ishim, Fu et al., Nature 514: 445 (2014) (45 ka); White Sands,
//     Bennett et al., Science 373: 1528 (2021) (21-23 ka, contested); Monte Verde (about 14.5 ka, recalled). Qafzeh/Skhul
//     (about 100 ka), Lake Mungo (about 42 ka?) and Tianyuan (about 40 ka) are rounded recalled values. Coordinates are approximate.
//   4.4 Actual complete Ramachandran2005 original source read; conditional model and saved seed repaired.
//     See docs/verification/bighist-founder-followup.md; source flag retained pending independent acceptance.

import founderItem from './founder-item.js';

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
    orbitsItem,
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
