// Big History & Quantitative History — Chapter 3: Life on Earth (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
//
// Sources checked (Oct 2026):
//   3.1 Actual Miller1953 report, Johnson2008 fullmain+SOM/TableS1 and NASA CP2276 printed50 audited; see private source report.
//   3.2 Dated primary claims and bounded original-abstract access; authored ordinal sensitivity matrix. See private audit report.
//   3.3 Actual1977/1990 originals and2024dated methods/Fig1 audited; posterior/soft-calibration limits explicit.
//   3.4 Farquhar, Bao & Thiemens, Science 289: 756 (2000); Bekker et al., Nature 427: 117 (2004); Philippot et al., Nat. Commun.
//     9: 2245 (2018) (pO2 < 1e-5 PAL before about 2.45 Ga, MIF-S disappearing 2.45–2.31 Ga); Lyons, Reinhard & Planavsky,
//     Nature 506: 307 (2014). Post-GOE oxygen bands are drawn broad and flagged: published estimates span orders of magnitude.
//   3.5 Margulis (Sagan), J. Theor. Biol. 14: 255 (1967); Mereschkowsky, Biol. Centralbl. 25: 593 (1905); Martin & Muller, Nature
//     392: 37 (1998); Lang et al., Nature 387: 493 (1997) (Reclinomonas mtDNA 69,034 bp, 97 genes); Andersson et al., Nature 396:
//     133 (1998) (Rickettsia prowazekii about 1.1 Mb, 834 protein genes; not re-checked online); Nierman et al., PNAS 98: 4136
//     (2001) (Caulobacter about 4.0 Mb, 3,767 ORFs; not re-checked); Unseld et al., Nat. Genet. 15: 57 (1997) (Arabidopsis mtDNA
//     367 kb, 57 genes); Anderson et al., Nature 290: 457 (1981) (human mtDNA 16,569 bp, 37 genes); Rath et al., NAR 49: D1541
//     (2021) (MitoCarta3.0, 1,136 human genes); Spang et al., Nature 521: 173 (2015); Imachi et al., Nature 577: 519 (2020).

import { clamp } from './ch03.shared.js';
import millerEvent from './source-audit-miller.js';
import originsHypothesis from './source-audit-origins.js';
import lucaEvent from './source-audit-luca.js';

export default {
  collection: 'bighist',
  chapter: 3,
  title: 'Life on Earth',
  summary: String.raw`Life appeared on Earth within a billion years of its formation, by routes still debated. For most of its history it was microbial, yet microbes oxidised the atmosphere and, by merging, built the complex cells from which plants and animals came. Animal life diversified rapidly in the Cambrian, and five mass extinctions, at least one caused by an asteroid, repeatedly reset the board.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    millerEvent,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    originsHypothesis,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    lucaEvent,
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Event',
      name: 'The Great Oxidation Event',
      statement: String.raw`For roughly the first two billion years the atmosphere held almost no free oxygen. Between about $2.45$ and $2.3$ billion years ago it rose from below $10^{-5}$ of today's level to a persistent, if still low, amount. The clearest signs are the disappearance of mass-independent sulfur-isotope fractionation (which needs an oxygen-poor atmosphere) from sedimentary rocks, followed by oxidised palaeosols and red beds; the great banded iron formations, which need dissolved iron in an anoxic ocean, peak before and fade after. A second rise followed in the Neoproterozoic, about $0.8$–$0.54$ billion years ago.

**Cause.** The source of the oxygen is oxygenic photosynthesis by cyanobacteria, which probably began before the event; the event is when the oxygen *sources* began to exceed the *sinks* (reduced volcanic gases, dissolved iron, buried carbon).`,
      idea: String.raw`Oxygen released by photosynthesis is consumed as long as there are reduced gases and minerals to oxidise. Treat the atmosphere as a box with a net source $S$ (organic carbon burial), a sink from volcanic and metamorphic reductants $R$ that works at full strength once there is even a trace of oxygen, and a weaker sink $k\,x$ proportional to the amount $x$. Then oxygen stays near zero while $S<R$ and rises to about $(S-R)/k$ once $S$ passes $R$: a slow drift in the balance gives a sudden change in the level. Why the balance changed is still argued (less reducing volcanic gas, hydrogen escape, more burial, nickel starvation of methanogens), and the model does not choose between them.`,
      caption: String.raw`Left: the broad bands that geochemists draw for atmospheric oxygen (percent of the present level, log scale; the Proterozoic range is wide because estimates differ by orders of magnitude). Right, a toy box model, not a reconstruction: choose the net source before and after the transition and its date, and the steady oxygen level follows with a jump when the source passes the reductant supply. Compare its jump with the 2.45–2.31 Ga window in which the sulfur signal vanishes.`,
      deps: ['bighist-3.3'],
      see: ['bighist-3.6', 'bighist-3.7'],
      refs: ['Christian'],
      credit: 'Farquhar, Bao & Thiemens, 2000 (sulfur isotopes); Bekker et al., 2004',
      tags: ['oxygen', 'atmosphere', 'deep time'],
      scope: String.raw`The box model is a toy with one reservoir and one transition; it illustrates a threshold, not the history of any real flux.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Great_Oxidation_Event', doi: 'https://doi.org/10.1126/science.289.5480.756' },
      verify: true,
      viz(v) {
        const S0 = v.slider('net source before / reductant supply', 0.2, 0.98, 0.4, { step: 0.01 });
        const S1 = v.slider('net source after / reductant supply', 0.3, 2.5, 1.4, { step: 0.01 });
        const tC = v.slider('date of the transition (Ga ago)', 1.8, 3.4, 2.4, { step: 0.01 });
        const kS = v.slider('weak sink k', 0.3, 3, 1, { step: 0.01 });
        const A = v.stage({ x: [-4, 0], y: [1e-8, 300], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time (Ga ago, negative)', ylabel: 'O₂ (% of present level)', title: 'oxygen bands drawn by geochemists (coarse)' });
        const B = v.stage({ x: [-4, 0], y: [1e-8, 300], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time (Ga ago, negative)', ylabel: 'toy model O₂ (% of present)', title: 'toy box model: a threshold' });
        const steady = (S, k) => { let lo = -12, hi = 3; const f = (x) => S - x / (x + 1e-5) - k * x; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(10 ** m) > 0) lo = m; else hi = m; } return 10 ** ((lo + hi) / 2); };
        const sOf = (t, a, b, tc) => { const u = clamp((tc - -t) / 0.5 + 0.5, 0, 1); return a + (b - a) * u * u * (3 - 2 * u); };
        v.render(() => {
          A.rect(-4, 1e-8, -2.45, 1e-3, { fill: 'purple', fillAlpha: 0.22, color: 'purple', width: 1 });
          A.text('below 10⁻⁵ of present', -3.95, 6e-6, { size: 10.5, color: 'purple', align: 'left' });
          A.rect(-2.3, 1e-2, -0.8, 10, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1 });
          A.text('Proterozoic: wide range', -2.25, 3e-3, { size: 10.5, color: 'accent', align: 'left' });
          A.rect(-0.54, 10, 0, 150, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1 });
          A.vband(-2.45, -2.31, { color: 'orange', alpha: 0.2, edges: false });
          A.text('sulfur signal vanishes 2.45–2.31 Ga', -2.4, 150, { size: 10.5, color: 'orange', align: 'left' });
          A.vband(-0.8, -0.54, { color: 'teal', alpha: 0.18, edges: false });
          A.text('Neoproterozoic rise', -0.82, 3e-7, { size: 10.5, color: 'teal', align: 'right' });
          // toy
          const pts = []; for (let i = 0; i <= 160; i++) { const t = -4 + (4 * i) / 160; pts.push([t, 100 * steady(sOf(t, S0.value, S1.value, tC.value), kS.value)]); }
          B.path(pts, { color: 'accent', width: 2.6 });
          B.vline(-tC.value, { color: 'orange', width: 1.5, dash: [4, 3] });
          B.text('transition', -tC.value + 0.05, 2e-7, { size: 10.5, color: 'orange', align: 'left' });
          B.hline(1e-3, { color: 'purple', width: 1, dash: [3, 3] });
          B.text('10⁻⁵ of present', -3.95, 3e-4, { size: 10.5, color: 'purple', align: 'left' });
        });
        v.readout(() => {
          const lo = 100 * steady(S0.value, kS.value), hi = 100 * steady(S1.value, kS.value);
          return `Toy model: before the transition O₂ ≈ **${lo.toExponential(1)}%** of present; after, **${hi < 0.01 ? hi.toExponential(1) : v.fix(hi, 2)}%**${S1.value <= 1 ? ' (the source never passes the reductant supply, so no oxidation event)' : ` — a jump of ×${(hi / lo).toExponential(1)}`}.\nReal record: MIF-S gone by 2.31 Ga; pO₂ < 10⁻⁵ before about 2.45 Ga (Philippot et al. 2018).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Event',
      name: 'Complex cells by endosymbiosis',
      statement: String.raw`Eukaryotic cells, with a nucleus, internal membranes and mitochondria, arose from a merger: a host cell related to Archaea took in an alphaproteobacterium that became the **mitochondrion**, and later a cyanobacterium that became the chloroplast in the ancestors of algae and plants. The evidence is that mitochondria and chloroplasts have their own small genomes and ribosomes, divide like bacteria, and in gene trees fall inside the bacteria (mitochondria among the Alphaproteobacteria, chloroplasts among the cyanobacteria).

Since the merger most of the symbiont's genes have been lost or moved to the host nucleus. Human mitochondrial DNA keeps 37 genes (13 for proteins); the mitochondrion still needs over a thousand proteins, nearly all encoded in the nucleus and imported.`,
      idea: String.raw`Lynn Margulis (1967) revived Mereschkowsky's 1905 proposal and supplied the biology; molecular trees of the 1970s–90s confirmed that organelle genes are bacterial. Why the merger mattered is argued: Martin and Müller (1998) proposed a hydrogen-exchanging partnership; others stress that mitochondria gave eukaryotes the power to carry large genomes (Lane). Gene transfer to the nucleus is the main process that shrank the organelle genome, since a gene that is copied to the host and no longer needed in the organelle is soon lost from it. Smaller genomes survive in reduced parasites (*Rickettsia*) and the jakobid *Reclinomonas*, whose mitochondrial genome is the most bacteria-like known, and shrink further in plants, animals and malaria parasites.`,
      caption: String.raw`Choose a genome with the buttons: the bars show how many genes it keeps (log scale), and the cell shows the same fraction as dots, each dot standing for a block of the assumed ancestral genome. Move the slider for the size of the ancestral symbiont genome (unknown; a modern free-living alphaproteobacterium has about 4,000 genes). The dots outside the mitochondrion were lost or moved to the nucleus; the data cannot say which.`,
      deps: ['bighist-3.4'],
      see: ['bighist-3.3'],
      refs: ['Christian'],
      credit: 'Mereschkowsky, 1905; L. Margulis (Sagan), 1967',
      tags: ['eukaryotes', 'symbiosis'],
      scope: String.raw`The host–symbiont merger is well supported; the identity of the host, the order of events and the date (probably 1.5–2 Ga ago or earlier) remain open.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Endosymbiont', doi: 'https://doi.org/10.1016/0022-5193(67)90079-3' },
      verify: true,
      viz(v) {
        const G = [
          { key: 'Caulobacter', name: 'free-living alphaproteobacterium (Caulobacter)', genes: 3767, col: 'blue', info: '4.0 Mb, 3,767 genes' },
          { key: 'Rickettsia', name: 'Rickettsia prowazekii (parasite)', genes: 834, col: 'purple', info: '1.1 Mb, 834 protein genes' },
          { key: 'Reclinomonas', name: 'Reclinomonas mitochondrion', genes: 97, col: 'teal', info: '69 kb, 97 genes' },
          { key: 'Arabidopsis', name: 'Arabidopsis mitochondrion', genes: 57, col: 'green', info: '367 kb, 57 genes' },
          { key: 'Human', name: 'human mitochondrion', genes: 37, col: 'orange', info: '16.6 kb, 37 genes' },
        ];
        const sel = v.select('genome', G.map((g, i) => ({ value: String(i), label: g.key })), '2');
        const anc = v.slider('assumed ancestral gene count', 1500, 5000, 3767, { step: 50, int: true });
        const A = v.stage({ x: [0.4, 5.6], y: [10, 8000], ylog: true, axes: 'box', gutter: true, height: 300, xticks: G.map((g, i) => [i + 1, g.key]), ylabel: 'genes', title: 'genes kept' });
        const B = v.stage({ x: [-2.5, 2.9], y: [-1.45, 1.45], equal: true, axes: false, height: 300, title: 'where the ancestral symbiont’s genes are' });
        const lattice = (cx, cy, rx, ry, n, sp) => {
          const pts = []; for (let i = -40; i <= 40; i++) for (let j = -40; j <= 40; j++) { const x = i * sp, y = j * sp * 0.87 + (i % 2 ? 0.43 * sp : 0); if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) pts.push([cx + x, cy + y, x * x + y * y]); }
          return pts.sort((a, b) => a[2] - b[2]).slice(0, n);
        };
        v.render(() => {
          const g = G[Number(sel.value)];
          G.forEach((q, i) => { A.rect(i + 0.6, 10, i + 1.4, q.genes, { fill: q.col, fillAlpha: i === Number(sel.value) ? 0.65 : 0.25, color: q.col, width: i === Number(sel.value) ? 2 : 1 }); A.text(String(q.genes), i + 1, q.genes * 1.25, { size: 10.5, color: 'ink', align: 'center' }); });
          // cell cartoon
          B.circle(0, 0, 0.001, { alpha: 0 });
          B.curve((t) => [0.2 + 2.6 * Math.cos(t), 1.35 * Math.sin(t)], 0, 2 * Math.PI, { color: 'muted', width: 1.5 });
          B.circle(-1.35, 0, 0.92, { color: 'purple', fill: 'purple', fillAlpha: 0.08, width: 1.8 });
          B.curve((t) => [1.15 + 1.05 * Math.cos(t), 0.6 * Math.sin(t)], 0, 2 * Math.PI, { color: 'orange', width: 2 });
          B.text('nucleus', -1.35, 1.0, { size: 10.5, color: 'purple', align: 'center' });
          B.text('mitochondrion', 1.15, 0.78, { size: 10.5, color: 'orange', align: 'center' });
          const per = Math.max(1, Math.ceil(anc.value / 100)), nTot = Math.round(anc.value / per);
          const kept = g.key === 'Caulobacter' ? nTot : Math.max(1, Math.round((Math.min(g.genes, anc.value) / anc.value) * nTot));
          const mt = lattice(1.15, 0, 0.98, 0.54, kept, 0.1), nuc = lattice(-1.35, 0, 0.86, 0.86, nTot - kept, 0.1);
          for (const p of nuc) B.dot(p[0], p[1], { r: 2.2, color: 'purple' });
          for (const p of mt) B.dot(p[0], p[1], { r: 2.6, color: 'orange' });
          B.text(`1 dot ≈ ${per} genes`, -2.4, -1.3, { size: 10.5, color: 'muted', align: 'left' });
        });
        v.readout(() => {
          const g = G[Number(sel.value)], frac = Math.min(1, g.genes / anc.value);
          return `**${g.name}** (${g.info}): keeps ${g.genes.toLocaleString('en-US')} genes — ${v.fix(100 * frac, frac < 0.1 ? 1 : 0)}% of an assumed ${anc.value.toLocaleString('en-US')}; the rest are lost or in the host nucleus.\nHuman mitochondrion: 13 protein genes in its own DNA, yet about 1,136 genes encode its proteome (MitoCarta3.0) — over 98% are nuclear and imported.`;
        });
      },
    },
  ],
};
