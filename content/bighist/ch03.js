// Big History & Quantitative History — Chapter 3: Life on Earth (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
//
// Sources checked (Oct 2026):
//   3.1 Actual Miller1953 report, Johnson2008 fullmain+SOM/TableS1 and NASA CP2276 printed50 audited; see private source report.
//   3.2 Dated primary claims and bounded original-abstract access; authored ordinal sensitivity matrix. See private audit report.
//   3.3 Actual1977/1990 originals and2024dated methods/Fig1 audited; posterior/soft-calibration limits explicit.
//   3.4 Actual2000original,2004authorabstract,2018regional MIF persistence and2014review source/sink sections audited; private report retains access/proxy/model limits.
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
import goeEvent from './source-audit-goe.js';

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
    goeEvent,
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
