// Big History & Quantitative History — Chapter 4, part b: items 4.5–4.8
//
// Sources checked (Oct 2026); Crossref was used for bibliographic details.
//   4.5 Actual Green2010ancestry-estimation/limitations, Reich2010Melanesian analysis,
//     Fu2014dating/admixture/Fig5–6 read; authored stationary-window law and censoring explicit.
//   4.6 Actual Rampino1992/Lane2013 bodies and bounded Ambrose/Storey/Yost author abstracts.
//     Fixed calibrated source age separated from an analytic authored coalescent history.
//   4.7 Actual Christian2004pp146–148/Henrich2004pp200–203/210 source versions read.
//     Four-group extension and best/mean/rounded-share distinctions explicit; independent review pending.
//   4.8 Roberts et al., Science 292: 1888 (2001) (about 46 ka); Saltre et al., Nat. Commun. 7: 10511 (2016); Faith & Surovell, PNAS 106:
//     20641 (2009) (North America, window of about 13.8-11.4 ka recalled); Cooper et al., Science 349: 602 (2015); Holdaway & Jacomb,
//     Science 287: 2250 (2000) (moa, within about a century of settlement); Clarkson 2017 and Bennett 2021 as in 4.3. All bars are
//     rounded, indicative windows (several recalled, not re-checked) and not the output of one dataset.

import { clamp } from './ch04.shared.js';
import learningItem from './learning-item.js';
import admixtureItem from './admixture-item.js';
import tobaItem from './toba-item.js';

// ── 4.8 data: arrival window, extinction window, climate window (or null); ages in ka before present ─────────
const REG = [
  { name: 'Australia', a: [50, 65], e: [40, 50], c: null, note: 'humans ≥ 50 ka (Madjedbebe 65 ka disputed); losses ≈ 46 ka (Roberts 2001); no clear climate event (Saltré 2016)' },
  { name: 'Eurasia', a: [45, 60], e: [10, 40], c: [11.7, 14.7], note: 'hominins long present; piecemeal losses, 40 ka to 10 ka and later; abrupt warmings (Cooper 2015)' },
  { name: 'N. America', a: [13, 23], e: [11.4, 13.8], c: [11.7, 14.7], note: 'Clovis ≈ 13 ka; White Sands 21–23 ka (contested); loss window ≈ 13.8–11.4 ka (Faith & Surovell 2009)' },
  { name: 'S. America', a: [14.5, 16], e: [8, 13], c: [11.7, 14.7], note: 'Monte Verde ≈ 14.5 ka; loss window broad and poorly dated' },
  { name: 'Madagascar', a: [1.9, 2.5], e: [0.9, 1.6], c: null, note: 'humans ≈ 2 ka (earlier claims disputed); losses within the last 2 kyr' },
  { name: 'New Zealand', a: [0.70, 0.78], e: [0.55, 0.70], c: null, note: 'settled ≈ 1280 CE; moa gone within about a century (Holdaway & Jacomb 2000)' },
];
const UX = (age) => -Math.log10(age);      // plotting coordinate: older on the left
const AGE = (x) => 10 ** -x;

export default {
  collection: 'bighist',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    admixtureItem,
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    tobaItem,
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    learningItem,
    // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      num: '4.8',
      kind: 'Hypothesis',
      name: 'Megafaunal extinctions: overkill or climate?',
      statement: String.raw`In the last 50,000 years most large land mammals (the *megafauna*, above about 44 kg) disappeared from Australia, the Americas, Eurasia and many islands, far more than in the previous millions of years. Two explanations compete. In the **overkill** hypothesis (Paul Martin and others), hunting by newly arrived humans drove them to extinction; in the **climate** hypothesis, the rapid warming and ecological change at the end of the last ice age did. The evidence is decided case by case by *timing*: the order and gap between the arrival of people and the last fossils of each species, and whether the extinctions line up with a climate event.

**Scope.** The answer differs by continent. Islands such as New Zealand and Madagascar favour human causes (loss soon after settlement, no climate event), Australia is probably human-linked, and Eurasia and the Americas are still argued; a combination of both, with hunting acting on populations stressed by climate, is common.`,
      idea: String.raw`Each region has a window for the arrival of humans (earliest credible site, up to older disputed ones) and a window for the extinctions (last dated fossils), and the question is how the two windows sit in time relative to each other and relative to a climate event. If humans arrive before the losses with a short gap, overkill is supported; if the losses begin before people arrive, overkill is excluded; if they sit inside a sharp climate event, climate is supported; if both hold, nothing is decided. Radiocarbon dates (geol-2.6) have wide errors near their limit, and the last fossil is always younger than the true last individual (the Signor–Lipps effect), so the picture treats each as a uniform window and computes the probabilities honestly.`,
      caption: String.raw`Each row is a region on a log-time axis (older to the left, present on the right): blue = arrival of people (window), red = last megafauna (extinction window), gold = a climate event where one is relevant. Choose a region and drag the four handles to move the windows; the probabilities below recompute. Reset restores the rounded literature windows.`,
      deps: ['bighist-4.3', 'bighist-4.2'],
      see: ['bighist-4.7'],
      refs: ['Christian'],
      credit: 'Martin, 1967 (overkill); Roberts et al., 2001; Faith & Surovell, 2009; Cooper et al., 2015; Saltré et al., 2016',
      tags: ['extinction', 'megafauna', 'climate'],
      scope: String.raw`Rounded, indicative windows read as uniform distributions; the verdict is a measure of the timing, not a proof of cause.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quaternary_extinction_event', doi: 'https://doi.org/10.1126/science.1060264' },
      verify: true,
      viz(v) {
        const base = () => REG.map((r) => ({ name: r.name, a: r.a.slice(), e: r.e.slice(), c: r.c ? r.c.slice() : null, note: r.note }));
        let data = base();
        const sel = v.select('region', REG.map((r, i) => ({ value: String(i), label: r.name })), '2');
        v.button('Reset', () => { data = base(); });
        const S = v.stage({ x: [UX(120), UX(0.4)], y: [-0.6, 6.0], axes: 'box', gutter: true, height: 400, full: true, xlabel: 'time (ka before present, log scale)', xticks: [100, 50, 20, 10, 5, 2, 1, 0.5].map((a) => [UX(a), String(a)]), yticks: [], title: 'arrival of people and loss of the megafauna' });
        const rowY = (i) => 5 - i;
        const mk = (key, idx, color, off) => {
          const h = S.handle(UX(1), 0, { color, r: 6, constrain: 'x' });
          h.onDrag = () => {
            const d = data[+sel.value], y = key === 'a' ? d.a : d.e;
            y[idx] = clamp(AGE(h.x), 0.3, 150);
            y.sort((p, q) => p - q);
          };
          h.off = off; h.key = key; h.idx = idx; return h;
        };
        const hs = [mk('a', 0, 'accent', 0.2), mk('a', 1, 'accent', 0.2), mk('e', 0, 'red', -0.2), mk('e', 1, 'red', -0.2)];
        function stats(d) {
          // ages in ka; uniform windows. P(E younger than A), mean lag A-E given overlap order, P(E inside climate window)
          const n = 60, a = [], e = [];
          for (let i = 0; i < n; i++) { a.push(d.a[0] + ((i + 0.5) / n) * (d.a[1] - d.a[0])); e.push(d.e[0] + ((i + 0.5) / n) * (d.e[1] - d.e[0])); }
          let after = 0, lag = 0, cl = 0;
          for (const x of a) for (const y of e) { if (y < x) { after++; lag += x - y; } }
          if (d.c) for (const y of e) if (y >= d.c[0] && y <= d.c[1]) cl++;
          return { pAfter: after / (n * n), lag: after ? lag / after : NaN, pClim: d.c ? cl / n : null };
        }
        v.render(() => {
          const idx = +sel.value;
          data.forEach((d, i) => {
            const y = rowY(i), me = i === idx;
            if (d.c) S.rect(UX(d.c[1]), y - 0.46, UX(d.c[0]), y + 0.46, { fill: 'gold', fillAlpha: me ? 0.28 : 0.14, stroke: false });
            S.rect(UX(d.a[1]), y + 0.08, UX(d.a[0]), y + 0.32, { fill: 'accent', fillAlpha: me ? 0.55 : 0.3, color: 'accent', width: 1 });
            S.rect(UX(d.e[1]), y - 0.32, UX(d.e[0]), y - 0.08, { fill: 'red', fillAlpha: me ? 0.55 : 0.3, color: 'red', width: 1 });
            S.text(d.name, UX(120) + 0.03, y + 0.01, { size: 11, color: me ? 'ink' : 'muted', align: 'left', baseline: 'middle' });
          });
          const d = data[idx], y = rowY(idx);
          const vals = { a: d.a, e: d.e };
          for (const h of hs) h.set(UX(vals[h.key][h.idx]), y + h.off);
          S.vline(UX(11.7), { color: 'gold', width: 1, dash: [2, 3], alpha: 0.7 });
          S.text('Holocene begins', UX(11.7) - 0.03, 5.85, { size: 10, color: 'muted', align: 'right' });
          v.legend([['accent', 'humans arrive'], ['red', 'last megafauna'], ['gold', 'climate event (14.7–11.7 ka)']]);
        });
        v.readout(() => {
          const d = data[+sel.value], st = stats(d);
          const f = (x) => (x >= 10 ? v.fix(x, 0) : x >= 1 ? v.fix(x, 1) : v.fix(x, 2));
          const ov = st.pAfter < 0.05 ? 'The losses begin before people arrive: overkill is excluded by these windows.' : st.pAfter > 0.95 ? `People arrive first in nearly every draw, **${f(st.lag)} kyr** before the losses on average: consistent with overkill (and with a climate cause, if there is one).` : `The windows overlap: people arrive before the loss in ${v.fix(100 * st.pAfter, 0)}% of draws.`;
          const cl = d.c ? `P(loss inside the 14.7–11.7 ka climate window) = **${v.fix(100 * st.pClim, 0)}%**.` : 'No major climate event is in this window (a tie-breaker for overkill, not a proof).';
          return `**${d.name}** — ${d.note}.\n${ov} ${cl}`;
        });
      },
    },
  ],
};
