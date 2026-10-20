// Big History & Quantitative History — Chapter 4, part b: items 4.5–4.8
//
// Sources checked (Oct 2026); Crossref was used for bibliographic details.
//   4.5 Actual Green2010ancestry-estimation/limitations, Reich2010Melanesian analysis,
//     Fu2014dating/admixture/Fig5–6 read; authored stationary-window law and censoring explicit.
//   4.6 Ambrose, J. Hum. Evol. 34: 623 (1998) and Rampino & Self, Nature 359: 50 (1992) (Crossref-checked); Storey et al., PNAS 109:
//     18684 (2012) (Crossref-checked; date of about 74 ka rounded, the value 73.88 ka was not confirmed); Lane et al., PNAS 110:
//     8025 (2013) and Yost et al., J. Hum. Evol. (2018) (Lake Malawi ash: no volcanic winter; only the titles/gist were confirmed
//     by search). The pairwise-coalescence calculation is textbook; the bottleneck sizes are the reader's.
//   4.7 Actual Christian2004pp146–148/Henrich2004pp200–203/210 source versions read.
//     Four-group extension and best/mean/rounded-share distinctions explicit; independent review pending.
//   4.8 Roberts et al., Science 292: 1888 (2001) (about 46 ka); Saltre et al., Nat. Commun. 7: 10511 (2016); Faith & Surovell, PNAS 106:
//     20641 (2009) (North America, window of about 13.8-11.4 ka recalled); Cooper et al., Science 349: 602 (2015); Holdaway & Jacomb,
//     Science 287: 2250 (2000) (moa, within about a century of settlement); Clarkson 2017 and Bennett 2021 as in 4.3. All bars are
//     rounded, indicative windows (several recalled, not re-checked) and not the output of one dataset.

import { clamp } from './ch04.shared.js';
import learningItem from './learning-item.js';
import admixtureItem from './admixture-item.js';

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
    {
      num: '4.6',
      kind: 'Hypothesis',
      name: 'The Toba bottleneck (contested)',
      statement: String.raw`About $74\,000$ years ago the Toba volcano in Sumatra produced the largest eruption of the last two million years. In 1992 Rampino and Self argued that the resulting volcanic winter could have caused a severe drought and cooling; Ambrose (1998) added that human populations were cut to a few thousand breeding individuals and that this explains the low genetic diversity of our species. The **Toba catastrophe hypothesis** is therefore: a short, severe bottleneck at about $74$ ka left a detectable mark on the DNA of every living person.

**Scope.** The hypothesis is now widely doubted: archaeological sites in India show people living through the ash fall, and sediment cores from Lake Malawi find ash without evidence of a volcanic winter in East Africa. The date of the eruption is not in doubt, only its effect on people.`,
      idea: String.raw`Genetic diversity measures how long the lineages of two genomes take to coalesce. Going backwards in time two lineages coalesce with probability $1/(2N)$ per generation, so in a population whose size is $N(t)$ the chance of coalescing between times $t_1$ and $t_2$ is $1-\exp\bigl(-\int_{t_1}^{t_2}\tfrac{dt}{2N(t)}\bigr)$. A bottleneck of $N_b$ individuals for $d$ generations therefore sweeps up a fraction $1-e^{-d/(2N_b)}$ of all pairs at once: a visible spike in the coalescence times only if $d$ is comparable to $2N_b$. The model is the finite-population drift of Wright–Fisher (popgen-2.1) viewed in reverse, as in the serial founder effect (bighist-4.4).`,
      caption: String.raw`Left: the population-size history with a bottleneck at the Toba date (move it, make it deeper or longer). Right: the fraction of pairs of lineages that have coalesced by each time with and without the bottleneck; a bottleneck shows as a jump. The default (3,000 individuals for 1,000 years) leaves a jump of under 1% — a bottleneck needs to be far longer or tighter to be seen in genomes.`,
      deps: ['bighist-4.3', 'popgen-2.9', 'popgen-2.1'],
      see: ['bighist-4.4', 'bighist-4.2'],
      refs: ['Christian'],
      credit: 'Rampino & Self, 1992; Ambrose, 1998 (hypothesis); Lane et al., 2013 and Yost et al., 2018 (sediment evidence against a volcanic winter)',
      tags: ['bottleneck', 'volcanism', 'coalescence'],
      scope: String.raw`Single panmictic population with a constant ancestral size; a model of what a bottleneck would do, not an inference from data.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Toba_catastrophe_theory', doi: 'https://doi.org/10.1006/jhev.1998.0219' },
      verify: true,
      viz(v) {
        const N0 = v.slider('ancestral size $N_0$', 2000, 50000, 10000, { step: 100, log: true });
        const Nb = v.slider('bottleneck size $N_b$', 50, 20000, 3000, { step: 10, log: true });
        const dur = v.slider('duration (years)', 20, 30000, 1000, { step: 10, log: true });
        const tb = v.slider('bottleneck time (ka ago)', 30, 140, 74, { step: 1 });
        const gen = v.slider('generation time (years)', 20, 30, 25, { step: 1 });
        const A = v.stage({ x: [-200, 0], y: [30, 3e4], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'time (ka ago, negative)', ylabel: 'population size N', title: 'size history' });
        const B = v.stage({ x: [-300, 0], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'time (ka ago, negative)', ylabel: 'fraction of pairs coalesced (looking back)', title: 'coalescence of lineage pairs' });
        const calc = () => {
          const dt = 0.02, tMax = 300, win = [tb.value - dur.value / 1000, tb.value]; // [t_lo, t_hi] ka ago
          let L1 = 0, L0 = 0; const c1 = [], c0 = [];
          for (let t = 0; t <= tMax; t += dt) {
            const inB = t >= win[0] && t < win[1];
            L1 += ((dt * 1000) / gen.value) / (2 * (inB ? Nb.value : N0.value));
            L0 += ((dt * 1000) / gen.value) / (2 * N0.value);
            if (Math.abs(t / 2 - Math.round(t / 2)) < dt / 2 || (t >= win[0] - 1 && t <= win[1] + 1 && Math.abs(t / 0.5 - Math.round(t / 0.5)) < dt / 2)) { c1.push([-t, 1 - Math.exp(-L1)]); c0.push([-t, 1 - Math.exp(-L0)]); }
          }
          return { c1, c0, win };
        };
        v.render(() => {
          const { c1, c0, win } = calc();
          const w0 = Math.max(win[0], 0);
          A.path([[-200, N0.value], [-win[1], N0.value], [-win[1], Nb.value], [-w0, Nb.value], [-w0, N0.value], [0, N0.value]], { color: 'accent', width: 2.6 });
          A.vline(-tb.value, { color: 'red', width: 1.2, dash: [4, 3] }); A.text('Toba eruption', -tb.value - 2, 40, { size: 10.5, color: 'red', align: 'right' });
          B.path(c0, { color: 'muted', width: 2, dash: [5, 4] });
          B.path(c1, { color: 'accent', width: 2.6 });
          B.vband(-win[1], -w0, { color: 'red', alpha: 0.15, edges: false });
          v.legend([['muted', 'no bottleneck', { dash: true }], ['accent', 'with the bottleneck']]);
        });
        v.readout(() => {
          const d = (dur.value / gen.value), P = 1 - Math.exp(-d / (2 * Nb.value));
          const base = 1 - Math.exp(-d / (2 * N0.value));
          return `The bottleneck lasts **${v.fix(d, 0)} generations**; a pair of lineages coalesces inside it with probability **${v.fix(100 * P, 2)}%** (against ${v.fix(100 * base, 2)}% without it), so ${P < 0.05 ? 'the signal in genome-wide data is tiny' : P < 0.3 ? 'the signal is modest but detectable with many genomes' : 'a clear spike would appear'}.\nThe hypothesis needs $d/(2N_b)$ to be of order one. Sediments near the lake and in India argue against such a collapse.`;
        });
      },
    },
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
