// Big History & Quantitative History — Chapter 3: Life on Earth (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
//
// Sources checked (Oct 2026):
//   3.1 S. L. Miller, Science 117: 528 (1953); Johnson et al., Science 322: 404 (2008) (archived 1950s vials, more than 20
//     amino acids). Schlesinger & Miller, J. Mol. Evol. 19: 376 (1983): carbon yields of amino acids 1.2–4.7% in CH4-rich
//     mixtures, about 2% for H2/CO or H2/CO2 of 2–4, about 1e-3 % for H2/CO2 = 0; glycine dominant in CO/CO2 mixtures. Only these
//     reported end points are plotted as data; the curve between them and the time course are labelled as a model.
//   3.2 Gilbert, Nature 319: 618 (1986); Powner, Gerland & Sutherland, Nature 459: 239 (2009); Patel et al., Nature Chem. 7: 301
//     (2015); Wachtershauser, Microbiol. Rev. 52: 452 (1988); Russell & Hall, J. Geol. Soc. 154: 377 (1997); Kelley et al.,
//     Nature 412: 145 (2001) (Lost City). The 0–3 ratings in the matrix are the author's coarse qualitative reading, not data.
//   3.3 Woese & Fox, PNAS 74: 5088 (1977); Woese, Kandler & Wheelis, PNAS 87: 4576 (1990); Moody et al., Nature Ecol. Evol. 8:
//     1654 (2024) (LUCA about 4.2 Ga; I could not confirm the published interval, so only the central value is used); earlier
//     clock estimates 3.5–3.8 Ga as summarised in press coverage of that paper; Wilde et al., Nature 409: 175 (2001) (Jack
//     Hills zircon 4.4 Ga); Walter, Buick & Dunlop, Nature 284: 443 (1980) (Dresser stromatolites, about 3.5 Ga).
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

export default {
  collection: 'bighist',
  chapter: 3,
  title: 'Life on Earth',
  summary: String.raw`Life appeared on Earth within a billion years of its formation, by routes still debated. For most of its history it was microbial, yet microbes oxidised the atmosphere and, by merging, built the complex cells from which plants and animals came. Animal life diversified rapidly in the Cambrian, and five mass extinctions, at least one caused by an asteroid, repeatedly reset the board.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Event',
      name: 'The Miller–Urey experiment',
      statement: String.raw`In 1952–53 Stanley Miller, in Harold Urey's laboratory in Chicago, circulated water vapour past an electric spark in a closed glass apparatus holding methane, ammonia and hydrogen, to imitate lightning in a reducing early atmosphere. After about a week the water had turned deep red-brown and contained organic compounds, among them the amino acids glycine, $\alpha$- and $\beta$-alanine, aspartic acid and $\alpha$-aminobutyric acid. Later work showed that the yield depends strongly on the gas mixture: with methane it is of order $1$–$5\%$ of the carbon, with CO or CO$_2$ it stays near $2\%$ only if hydrogen is plentiful ($\mathrm{H_2}/\mathrm{CO_2}\gtrsim 2$), and in a CO$_2$–N$_2$–H$_2$O mixture without hydrogen it collapses by about three orders of magnitude.

**Scope.** The experiment shows that organic building blocks form easily from simple gases and an energy source. It does not show that the early atmosphere was strongly reducing (most models now make it much less so, with local reducing environments such as volcanic plumes), and it does not explain how amino acids became life.`,
      idea: String.raw`The sparks split and recombine the gases into hydrogen cyanide and aldehydes. These dissolve in the water and combine with ammonia in the **Strecker synthesis**: an aldehyde, HCN and NH$_3$ give an aminonitrile, which hydrolyses to an amino acid. So the yield is limited by how much HCN and aldehyde the atmosphere can make, which needs reduced carbon and enough hydrogen to keep nitrogen oxides from destroying the products. A neutral atmosphere makes little of either, which is why the picture below changes so sharply when hydrogen is removed. Miller's archived vials from the 1950s were reanalysed in 2008 and held more than twenty amino acids.`,
      caption: String.raw`Left: carbon yield of amino acids against the $\mathrm{H_2}/\mathrm{CO_2}$ ratio. The dots and the green band are the yields reported by Schlesinger and Miller (1983); the dashed line between them is only a guide, since the intermediate values were not tabulated here. Switch the carbon source, move the ratio, and read the yield. Right: a model of how the amino acids accumulate over the week (a saturating curve with a two-day time constant, assumed; Miller did not publish a time course in this form).`,
      deps: [],
      see: ['bighist-3.2'],
      refs: ['Christian'],
      credit: 'S. L. Miller, 1953 (Chicago, in H. C. Urey’s laboratory)',
      tags: ['origin of life', 'prebiotic chemistry'],
      scope: String.raw`Holds for spark discharge in closed flasks with the gas mixtures tested; says nothing about which atmosphere the early Earth actually had.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Miller%E2%80%93Urey_experiment', doi: 'https://doi.org/10.1126/science.117.3046.528' },
      verify: true,
      viz(v) {
        const src = v.select('carbon source', [{ value: 'ch4', label: 'CH₄ (reducing)' }, { value: 'co2', label: 'CO₂ (neutral)' }], 'ch4');
        const rS = v.slider('H₂ / CO₂ ratio', 0, 4, 0, { step: 0.05 });
        const dS = v.slider('days of sparking', 0, 7, 7, { step: 0.1 });
        const A = v.stage({ x: [0, 4.3], y: [3e-4, 10], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'H₂ / CO₂', ylabel: 'amino-acid carbon (% of carbon)', title: 'yield against hydrogen supply' });
        const B = v.stage({ x: [0, 7], y: [0, 5], axes: 'box', gutter: true, height: 300, xlabel: 'days', ylabel: 'amino-acid carbon (%)', title: 'accumulation over a week (model)' });
        const yieldCo2 = (r) => (r >= 2 ? 2 : 10 ** (-3 + 1.651 * r));
        const yieldOf = () => (src.value === 'ch4' ? 2.4 : yieldCo2(rS.value));
        v.render(() => {
          A.hband(1.2, 4.7, { color: 'green', alpha: 0.18, edges: false });
          A.text('CH₄-rich mixtures: 1.2–4.7%', 3.95, 5.6, { align: 'right', size: 10.5, color: 'green' });
          const guide = []; for (let i = 0; i <= 40; i++) { const r = (2 * i) / 40; guide.push([r, yieldCo2(r)]); }
          A.path(guide, { color: 'muted', width: 1.5, dash: [5, 4] });
          A.hline(2, { color: 'faint', width: 1, dash: [2, 3] });
          A.dot(0, 1e-3, { r: 5.5, color: 'red' }); A.dot(2, 2, { r: 5.5, color: 'ink' }); A.dot(4, 2, { r: 5.5, color: 'ink' });
          A.text('H₂/CO₂ = 0: 10⁻³ %', 0.08, 2.2e-3, { align: 'left', size: 10.5, color: 'red' });
          A.text('≈ 2% at ratios 2–4', 3.9, 0.9, { align: 'right', size: 10.5, color: 'ink' });
          if (src.value === 'co2') A.dot(rS.value, yieldCo2(rS.value), { r: 8, color: 'accent', label: 'you' });
          else A.vline(rS.value, { color: 'accent', width: 1.2, dash: [4, 3] });
          const Y = yieldOf();
          B.fn((t) => Y * (1 - Math.exp(-t / 2)), { color: 'accent', width: 2.5, domain: [0, 7] });
          B.hline(Y, { color: 'faint', width: 1, dash: [2, 3] });
          B.dot(dS.value, Y * (1 - Math.exp(-dS.value / 2)), { r: 6, color: 'gold' });
          v.legend([['ink', 'reported yields (Schlesinger & Miller 1983)', { dot: true }], ['muted', 'guide between them', { dash: true }]]);
        });
        v.readout(() => {
          const Y = yieldOf(), y = Y * (1 - Math.exp(-dS.value / 2));
          const lab = src.value === 'ch4' ? 'CH₄ mixture, taken at 2.4%, the middle of the reported band' : `CO₂ mixture at H₂/CO₂ = ${v.fix(rS.value, 2)}`;
          return `${lab}: final amino-acid yield ≈ **${Y >= 0.1 ? v.fix(Y, 2) : v.fix(Y, 4)}%** of the carbon; after ${v.fix(dS.value, 1)} days ≈ ${y >= 0.1 ? v.fix(y, 2) : v.fix(y, 4)}%.\n1953 products: glycine, α- and β-alanine, aspartic acid, α-aminobutyric acid · 2008 reanalysis of archived vials: more than 20 amino acids.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Hypothesis',
      name: 'The RNA world and rival origin-of-life hypotheses',
      statement: String.raw`How life began is unsettled. Four families of proposals are the most discussed. (a) **RNA world** (Gilbert's 1986 name for an idea of the 1960s–70s): RNA both stored heredity and catalysed reactions before DNA and proteins, supported by ribozymes. (b) **Metabolism first** (for example Wächtershäuser's iron–sulfur world): networks of self-sustaining chemical cycles on mineral surfaces came before genes. (c) **Alkaline hydrothermal vents** (Russell and colleagues): porous mineral chimneys such as those at the Lost City field supplied compartments and natural chemical gradients. (d) **Warm ponds and cyanosulfidic chemistry** (Darwin's “warm little pond”, developed by Sutherland's group): ultraviolet light and cyanide on land make precursors of nucleotides, amino acids and lipids together.

They are not mutually exclusive, and no one of them accounts for every requirement: building blocks, heredity, a compartment, an energy source and a plausible geological setting.`,
      idea: String.raw`Any account must supply four things that modern life gets from one another: a source of molecular building blocks, a way to copy information, a boundary that keeps products together, and a flow of energy to drive it. The proposals differ in which they solve first, and each is weakest where another is strongest. RNA-world chemistry gets heredity and catalysis in one molecule but needs nucleotides and a compartment from elsewhere; vents give compartments and energy but have not produced replicators; the cyanosulfidic route makes many precursors in one scheme but does not itself give a cell. The experiments of 3.1 are the oldest example of testing such a proposal in a flask.`,
      caption: String.raw`A matrix of coarse ratings (0–3, the author's qualitative reading of the literature, not measured data) of four scenarios against five criteria. Weight each criterion with the sliders: the weighted bars at the right show that no scenario wins for every weighting. Click a cell for the evidence behind it.`,
      deps: ['bighist-3.1'],
      see: ['bighist-3.3'],
      refs: ['Christian'],
      credit: 'Gilbert, 1986 (RNA world); Wächtershäuser, 1988; Russell & Hall, 1997; Powner, Gerland & Sutherland, 2009',
      tags: ['origin of life', 'RNA world'],
      scope: String.raw`These are hypotheses about conditions on Earth 4.5–3.8 billion years ago, for which almost no rocks survive; they are tested by laboratory chemistry and plausibility, not by direct evidence.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/RNA_world', doi: 'https://doi.org/10.1038/nature08013' },
      verify: true,
      viz(v) {
        const rows = ['RNA world', 'Metabolism first', 'Alkaline vents', 'Warm ponds'];
        const cols = ['Building blocks', 'Heredity', 'Compartment, energy', 'Geology fits', 'Lab support'];
        const score = [[2, 3, 1, 1, 2], [2, 0, 1, 2, 1], [1, 0, 3, 2, 1], [3, 1, 1, 2, 2]];
        const note = [
          ['Pyrimidine nucleotides made without free ribose (Powner et al. 2009); a full, one-pot route to all four bases is still lacking.', 'Ribozymes catalyse and RNA stores sequence; no ribozyme yet copies itself with high fidelity.', 'Gives no boundary or energy supply; these must come from outside the scheme.', 'Free RNA is fragile in water; strands must be concentrated (ponds, ice, pores) and shielded.', 'Ribozyme evolution in vitro works well; the origin chain as a whole has not been reproduced.'],
          ['Metals and minerals drive some reactions resembling the core of metabolism in the lab.', 'No clear route from cycles to heritable information; whether a cycle can be a genome is debated.', 'Mineral surfaces concentrate molecules; the energy comes from redox gradients.', 'Iron–sulfur minerals and reducing fluids existed at vents and in the crust.', 'Several metal-catalysed steps shown; complete self-sustaining cycles not yet.'],
          ['Hydrogen-rich fluids could reduce CO₂, but organic yields from vents are small so far.', 'No proposed replicator arises naturally in this setting yet.', 'Natural mineral pores and pH and redox gradients across thin walls supply compartments and energy.', 'Vent fields such as Lost City exist today; vents at 4 Ga are inferred.', 'Laboratory reactors give modest CO₂ reduction; no continuous organic synthesis.'],
          ['Ultraviolet-driven cyanide and sulfide chemistry gives precursors of nucleotides, amino acids and lipids (Patel et al. 2015).', 'Gives RNA precursors, so inherits the RNA-world weaknesses.', 'Lipid precursors form, but no energy-transducing membrane is explained.', 'Needs cyanide (for example from impacts) and shallow ponds with wet–dry cycles.', 'Several steps demonstrated end to end in one laboratory.'],
        ];
        const wS = cols.map((c, j) => v.slider(`weight: ${c.toLowerCase()}`, 0, 3, 1, { step: 0.1 }));
        const s = v.stage({ x: [-2.3, 7.4], y: [-0.2, 5.1], axes: false, height: 340, full: true, title: 'ratings 0–3 (author’s reading): click a cell' });
        let sel = [0, 1];
        s.onClick((x, y) => { const j = Math.floor(x), i = 3 - Math.floor(y - 0.2); if (j >= 0 && j < 5 && i >= 0 && i < 4) sel = [i, j]; });
        const total = () => rows.map((_, i) => { let a = 0, b = 0; wS.forEach((w, j) => { a += w.value * score[i][j]; b += w.value * 3; }); return b ? a / b : 0; });
        v.render(() => {
          cols.forEach((c, j) => { const parts = c.split(', '); parts.forEach((p, k) => s.text(p, j + 0.5, 4.75 - 0.2 * k + 0.25 * (2 - parts.length), { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' })); });
          s.text('weighted score', 6.35, 4.6, { size: 10.5, color: 'muted', align: 'center' });
          const T = total(), best = T.indexOf(Math.max(...T));
          rows.forEach((r, i) => {
            const y0 = 3 - i + 0.2;
            s.text(r, -0.12, y0 + 0.5, { size: 12, color: 'ink', align: 'right', baseline: 'middle' });
            cols.forEach((_, j) => {
              const sc = score[i][j], isSel = sel[0] === i && sel[1] === j;
              s.rect(j + 0.04, y0 + 0.04, j + 0.96, y0 + 0.96, { fill: 'green', fillAlpha: 0.08 + 0.2 * sc, color: isSel ? 'ink' : 'faint', width: isSel ? 2.2 : 1, radius: 4 });
              s.text('●'.repeat(sc) || '–', j + 0.5, y0 + 0.5, { size: 13, color: sc ? 'green' : 'muted', align: 'center', baseline: 'middle' });
            });
            s.rect(5.4, y0 + 0.25, 5.4 + 2 * T[i], y0 + 0.75, { fill: i === best ? 'accent' : 'muted', fillAlpha: i === best ? 0.7 : 0.4, stroke: false, radius: 3 });
            s.text(v.fix(3 * T[i], 2), 5.4 + 2 * T[i] + 0.08, y0 + 0.5, { size: 11, color: 'ink', align: 'left', baseline: 'middle' });
          });
        });
        v.readout(() => { const T = total(), best = T.indexOf(Math.max(...T)); return `**${rows[sel[0]]} — ${cols[sel[1]].toLowerCase()} (${score[sel[0]][sel[1]]}/3):** ${note[sel[0]][sel[1]]}\nTop of the current weighting: **${rows[best]}** (${v.fix(3 * T[best], 2)} of 3). The ratings are a coarse reading, not a measurement.`; });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Event',
      name: 'LUCA and the tree of life',
      statement: String.raw`All known life shares one genetic code, ribosomes and a core of universal genes, which implies a **last universal common ancestor** (LUCA): a population from which the bacterial and archaeal lineages diverged. Sequence comparison (Woese and Fox, 1977) split living things into Bacteria, Archaea and Eukarya; in the “three-domain” tree Archaea and Eukarya are sister groups, while many recent trees place eukaryotes *inside* the Archaea (a two-domain tree) with their mitochondria coming from a bacterium (3.5).

Molecular-clock dating puts LUCA very early. One 2024 analysis, calibrating duplicated genes with fossils and geochemistry, gives about **4.2 billion years ago**; earlier estimates were 3.5–3.8 billion years. LUCA was not the first life, only the most recent ancestor of everything alive now, and it need not have been a single organism.`,
      idea: String.raw`Two groups of living species share a common ancestor if their sequences differ by more than chance, and if substitutions accumulate at a roughly known rate $r$ per site per unit time, the age of the split is about $t = d/(2r)$ for a distance $d$. The rate is not constant, so clocks need fossil or geochemical calibration points on the tree; for LUCA there are no fossils on either side, and the only hard limits are the age of the Earth and the oldest accepted traces of life. Gene duplications that predate LUCA let the same calibrations be used twice, which narrows the estimate. The deep branching order is the harder problem: horizontal gene transfer blurs the signal, and which archaeon gave rise to eukaryotes (for example the Asgard group, Spang et al. 2015) is still being resolved.`,
      caption: String.raw`The tree runs from the oldest time on the left to today. Drag the **LUCA** handle or use the buttons to choose a date; switch between the three-domain and two-domain trees. The dashed lines in the tree are schematic and undated; only the labelled constraints at the bottom are measured ages. The readout checks the date against them.`,
      deps: ['bighist-3.2', 'popgen-3.9'],
      see: ['bighist-3.5'],
      refs: ['Christian'],
      credit: 'Woese & Fox, 1977 (domains); Moody et al., 2024 (LUCA ≈ 4.2 Ga)',
      tags: ['tree of life', 'molecular clock'],
      scope: String.raw`The date is a model result with wide uncertainty; the shape of the deep tree and the root are still debated.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Last_universal_common_ancestor', doi: 'https://doi.org/10.1038/s41559-024-02461-1' },
      verify: true,
      viz(v) {
        const topo = v.select('tree', [{ value: '3', label: 'three domains' }, { value: '2', label: 'two domains' }], '3');
        const unc = v.slider('± uncertainty (Ga)', 0, 0.6, 0.2, { step: 0.01 });
        const A = v.stage({ x: [-4.8, 0.45], y: [-0.6, 3.5], axes: false, height: 330, full: true, title: 'the tree of life (schematic branching, one dated node)' });
        const h = A.handle(-4.2, 1.75, { color: 'accent', label: 'LUCA', constrain: { x: [-4.5, -3.3], y: [1.75, 1.75] } });
        v.button('Moody et al. 2024: 4.2 Ga', () => h.set(-4.2, 1.75));
        v.button('earlier clock estimates: 3.65 Ga', () => h.set(-3.65, 1.75));
        const marks = [[-4.404, 'oldest zircon 4.40 Ga', 'teal'], [-4.5, 'Moon-forming impact ≈ 4.5 Ga', 'muted'], [-3.48, 'Dresser stromatolites ≈ 3.5 Ga', 'green'], [-2.4, 'Great Oxidation ≈ 2.4 Ga', 'orange']];
        v.render(() => {
          const T = -h.x, x0 = -T, three = topo.value === '3';
          for (const g of [-4, -3, -2, -1, 0]) { A.vline(g, { color: 'grid', width: 1 }); A.text(g === 0 ? 'today' : `${-g} Ga`, g, -0.1, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' }); }
          A.hband(1.75 - 0.0001, 1.75 + 0.0001, { color: 'faint', alpha: 0 });
          // uncertainty bar on LUCA
          if (unc.value > 0) { A.line(x0 - unc.value, 1.75, x0 + unc.value, 1.75, { color: 'accent', width: 6, alpha: 0.3 }); }
          // bacteria on top, archaea middle, eukarya bottom
          A.path([[x0, 1.75], [x0, 2.9], [0, 2.9]], { color: 'blue', width: 2.6 });
          const n1 = three ? x0 + 0.22 * T : x0, y1 = three ? 1.0 : 1.75;
          if (three) {
            A.path([[x0, 1.75], [x0, 1.0], [n1, 1.0]], { color: 'purple', width: 2.6 });
            A.path([[n1, 1.0], [n1, 1.5], [0, 1.5]], { color: 'red', width: 2.6 });
            A.path([[n1, 1.0], [n1, 0.4], [0, 0.4]], { color: 'green', width: 2.6 });
            A.dot(n1, 1.0, { r: 4, hollow: true, color: 'muted' });
            A.text('Archaea–Eukarya split, undated', n1 + 0.08, 1.0, { size: 10, color: 'muted', align: 'left', baseline: 'middle', dx: 4 });
          } else {
            A.path([[x0, 1.75], [x0, 1.4], [0, 1.4]], { color: 'red', width: 2.6 });
            const nE = -0.45 * T; // eukaryotes branch from within archaea, schematic
            A.path([[nE, 1.4], [nE, 0.4], [0, 0.4]], { color: 'green', width: 2.6 });
            A.dot(nE, 1.4, { r: 4, hollow: true, color: 'muted' });
            A.text('eukaryotes arise inside Archaea, undated', nE + 0.1, 1.0, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          }
          // mitochondrion
          const xm = -2.0; A.arrow(xm, 2.88, xm, 0.45, { color: 'orange', width: 1.4, dash: [4, 3] });
          A.text('mitochondrion from a bacterium (3.5), undated', xm + 0.06, 2.4, { size: 10, color: 'orange', align: 'left', baseline: 'middle' });
          A.text('Bacteria', 0.0, 2.9, { size: 11.5, color: 'blue', align: 'right', baseline: 'bottom', dy: -4 });
          A.text('Archaea', 0.0, three ? 1.5 : 1.4, { size: 11.5, color: 'red', align: 'right', baseline: 'bottom', dy: -4 });
          A.text('Eukarya', 0.0, 0.4, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -4 });
          // measured constraints
          marks.forEach(([t, lab, col], k) => { A.line(t, -0.02, t, 3.3, { color: col, width: 1, dash: [3, 4], alpha: 0.7 }); A.text(lab, t + 0.03, 3.4 - 0.2 * k, { size: 10, color: col, align: 'left', baseline: 'middle' }); });
        });
        v.readout(() => {
          const T = -h.x, u = unc.value, ok = T > 3.48 && T < 4.5;
          return `LUCA at **${v.fix(T, 2)} Ga** (± ${v.fix(u, 2)}): ${v.fix((4.54 - T) * 1000, 0)} Myr after the Earth formed (4.54 Ga), ${v.fix((T - 3.48) * 1000, 0)} Myr before the Dresser stromatolites.\n${ok ? 'Consistent with the fossil limits: life is older than its oldest accepted traces.' : 'Outside the limits.'} The date is a model result; the tree’s branching order is schematic.`;
        });
      },
    },
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
        const S0 = v.slider('net source before / reductant supply', 0.2, 0.98, 0.6, { step: 0.01 });
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
