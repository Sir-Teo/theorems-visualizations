// Big History & Quantitative History — Chapter 3: Life on Earth (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
//
// Verification evidence: docs/verification/bighist-life-source-review.md.
// Full Miller1953, Woese1977/1990, Moody2024, Philippot2018,
// Patel2015, Russell2014, Andersson1998 and Rath2021 passages inspected as recorded there.
// Flags remain where an exact original source is still missing; schematic models
// and editorial weights are explicitly distinguished from measured data.

import { clamp } from './ch03.shared.js';
import {carbonYieldGuide,weekAccumulation,oxygenEquilibrium,HUMAN_MITO_PROTEINS,HYPOTHESIS_RATINGS,hypothesisScores} from './ch03-life.shared.js';

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
      statement: String.raw`In his 1953 report, Stanley Miller described how, in Harold Urey's laboratory in Chicago, he circulated water vapour past an electric spark in a closed glass apparatus holding methane, ammonia and hydrogen, to imitate lightning in a reducing early atmosphere. After about a week the water had turned deep red-brown and contained organic compounds, among them the amino acids glycine and $\alpha$- and $\beta$-alanine. He regarded the weak aspartic-acid and $\alpha$-aminobutyric-acid identifications as less certain. Later work showed that the yield depends strongly on the gas mixture: with methane it is of order $1$–$5\%$ of the carbon, with CO or CO$_2$ it stays near $2\%$ only if hydrogen is plentiful ($\mathrm{H_2}/\mathrm{CO_2}\gtrsim 2$), and in a CO$_2$–N$_2$–H$_2$O mixture without hydrogen it collapses by about three orders of magnitude.

**Scope.** The experiment shows that organic building blocks form easily from simple gases and an energy source. The flask does not establish the early Earth’s actual gas mixture, and it does not explain how amino acids became life.`,
      idea: String.raw`The sparks split and recombine the gases into hydrogen cyanide and aldehydes. These dissolve in the water and combine with ammonia in the **Strecker synthesis**: an aldehyde, HCN and NH$_3$ give an aminonitrile, which hydrolyses to an amino acid. This is a proposed reaction route, not a complete reconstruction of every reaction in the discharge. The yield comparison below concerns the tested gas mixtures; it does not by itself identify which microscopic step limits each mixture. Miller's archived vials from the 1950s were reanalysed in 2008 and held more than twenty amino acids.`,
      caption: String.raw`Left: carbon yield of amino acids against the $\mathrm{H_2}/\mathrm{CO_2}$ ratio. The dots and the green band are the yields reported by Schlesinger and Miller (1983); the dashed line between them is only a guide, since the intermediate values were not tabulated here. Switch the carbon source, move the ratio, and read the yield. Right: a model of how the amino acids accumulate over the week (an assumed saturating shape with a two-day time constant, normalized to the chosen seven-day endpoint; Miller did not publish a time course in this form).`,
      deps: [],
      see: ['bighist-3.2'],
      refs: ['Miller1953 Science117 pp528–529, full original apparatus and chromatogram discussion; Schlesinger–Miller1983 endpoint yields still require full-source check; Johnson et al.2008 Science322 p404 and supporting analytical methods (full original NASA archive)'],
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
        const yieldCo2 = carbonYieldGuide;
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
          B.fn((t) => weekAccumulation(Y,t), { color: 'accent', width: 2.5, domain: [0, 7] });
          B.hline(Y, { color: 'faint', width: 1, dash: [2, 3] });
          B.dot(dS.value, weekAccumulation(Y,dS.value), { r: 6, color: 'gold' });
          v.legend([['ink', 'reported yields (Schlesinger & Miller 1983)', { dot: true }], ['muted', 'guide between them', { dash: true }]]);
        });
        v.readout(() => {
          const Y = yieldOf(), y = weekAccumulation(Y,dS.value);
          const lab = src.value === 'ch4' ? 'CH₄ mixture, taken at 2.4%, an illustrative value within the reported band' : `CO₂ mixture at H₂/CO₂ = ${v.fix(rS.value, 2)}`;
          return `${lab}: chosen seven-day amino-acid yield ≈ **${Y >= 0.1 ? v.fix(Y, 2) : v.fix(Y, 4)}%** of the carbon; after ${v.fix(dS.value, 1)} days ≈ ${y >= 0.1 ? v.fix(y, 2) : v.fix(y, 4)}%.\n1953 identifications: glycine, α- and β-alanine; aspartic and α-aminobutyric acid less certain · 2008 reanalysis of archived vials: more than 20 amino acids.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Hypothesis',
      name: 'The RNA world and rival origin-of-life hypotheses',
      statement: String.raw`How life began is unsettled. Four families illustrate different approaches. (a) **RNA world**: RNA is proposed to have stored heredity and catalysed reactions before DNA and proteins; ribozymes demonstrate that RNA can perform both roles. (b) **Metabolism first**: primitive mineral-assisted reaction networks are proposed to have preceded coded genes. (c) **Alkaline hydrothermal vents** (Russell and colleagues): ancient mineral mounds are proposed to have supplied compartments and natural chemical gradients, with modern Lost City vents providing an analogue. (d) **Surface pools and cyanosulfidic chemistry** (Sutherland’s group): ultraviolet light and cyanide on land make precursors of nucleotides, amino acids and lipids together.

They need not be mutually exclusive. The cited component experiments do not demonstrate an entire cell; the requirements include building blocks, heredity, a compartment, an energy source and a plausible geological setting.`,
      idea: String.raw`Any account must supply four things that modern life gets from one another: a source of molecular building blocks, a way to copy information, a boundary that keeps products together, and a flow of energy to drive it. The proposals differ in which they solve first, and each is weakest where another is strongest. RNA-world chemistry gets heredity and catalysis in one molecule but needs nucleotides and a compartment from elsewhere; vent models propose compartments and energy gradients, which do not by themselves establish a replicating system; the cyanosulfidic route makes many precursors in one scheme but does not itself give a cell. The experiments of 3.1 are an early example of testing prebiotic chemistry in a flask.`,
      caption: String.raw`A matrix of coarse ratings (0–3, the author's qualitative reading of the literature, not measured data) of four scenarios against five criteria. Weight each criterion with the sliders: the weighted bars at the right show that no scenario wins for every weighting. Click a cell for the evidence behind it.`,
      deps: ['bighist-3.1'],
      see: ['bighist-3.3'],
      refs: ['Lincoln–Joyce2009 Science323 pp1229–1232, full cross-replication experiment; Patel et al.2015 Nature Chemistry7 pp301–307, full Results/Discussion and Conclusions; Russell et al.2014 Astrobiology14 pp308–330, §§1,3–6,13–15, theoretical mechanisms and unresolved experimental challenges'],
      credit: 'Lincoln & Joyce2009; Patel et al.2015; Russell et al.2014',
      tags: ['origin of life', 'RNA world'],
      scope: String.raw`These are hypotheses about ancient geochemical mechanisms. Laboratory component reactions and modern analogues test their plausibility without directly observing the historical origin of life.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/RNA_world', doi: 'https://doi.org/10.1089/ast.2013.1110' },
      viz(v) {
        const rows = ['RNA world', 'Metabolism first', 'Alkaline vents', 'Warm ponds'];
        const cols = ['Building blocks', 'Heredity', 'Compartment, energy', 'Geology fits', 'Lab support'];
        const score = HYPOTHESIS_RATINGS;
        const note = [
          ['Patel et al.2015 describe the activated-pyrimidine route through aminooxazolines rather than free ribose; this cited experiment concerns pyrimidines, not a complete origin-of-life system.', 'Ribozymes catalyse and RNA stores sequence; a functioning modern RNA catalyst does not by itself explain the prebiotic origin of its substrates and sequence.', 'Gives no boundary or energy supply; these must come from outside the scheme.', 'Free RNA is fragile in water; strands must be concentrated (ponds, ice, pores) and shielded.', 'Lincoln and Joyce2009 demonstrate cross-catalytic RNA amplification using supplied substrates, not the entire prebiotic origin chain.'],
          ['Metals and minerals drive some reactions resembling the core of metabolism in the lab.', 'Russell et al.2014 propose a transition from primitive metabolism to coding; the cited component experiments do not establish the complete transition.', 'Mineral surfaces concentrate molecules; the energy comes from redox gradients.', 'Iron–sulfur minerals and reducing fluids existed at vents and in the crust.', 'Component reactions are evidence about mechanisms; this rating is not a claim that a complete prebiotic cycle has been demonstrated.'],
          ['Hydrogen-rich fluids provide a proposed reductant for CO₂; this entry does not assign a measured universal vent yield.', 'The physical setting alone is not an experimental demonstration of a replicator.', 'Russell et al.2014 propose that mineral pores and pH/redox gradients across inorganic walls supply compartments and usable energy; coupled reaction engines remain a model requirement.', 'Vent fields such as Lost City exist today; vents at 4 Ga are inferred.', 'Russell et al.2014 distinguish demonstrated component reactions from unresolved coupled carbon fixation and gradient-driven pyrophosphate formation (§§5–6,13–14).'],
          ['Ultraviolet-driven cyanide and sulfide chemistry gives precursors of nucleotides, amino acids and lipids (Patel et al. 2015).', 'Gives RNA precursors, so inherits the RNA-world weaknesses.', 'Lipid precursors form, but no energy-transducing membrane is explained.', 'Needs cyanide (for example from impacts) and shallow ponds with wet–dry cycles.', 'Patel et al. demonstrate component reactions with staged reagent delivery; their complete proposed geochemical network is not a single one-pot experiment.'],
        ];
        const wS = cols.map((c, j) => v.slider(`weight: ${c.toLowerCase()}`, 0, 3, 1, { step: 0.1 }));
        const s = v.stage({ x: [-2.3, 8.0], y: [-0.2, 5.1], axes: false, height: 340, full: true, title: 'ratings 0–3 (author’s reading): click a cell' });
        let sel = [0, 1];
        s.onClick((x, y) => { const j = Math.floor(x), i = 3 - Math.floor(y - 0.2); if (j >= 0 && j < 5 && i >= 0 && i < 4) sel = [i, j]; });
        const total = () => hypothesisScores(wS.map(w=>w.value));
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
        v.readout(() => { const T = total(), best = Math.max(...T), winners=rows.filter((_,i)=>Math.abs(T[i]-best)<1e-12); return `**${rows[sel[0]]} — ${cols[sel[1]].toLowerCase()} (${score[sel[0]][sel[1]]}/3):** ${note[sel[0]][sel[1]]}\nTop of the current weighting: **${winners.join(', ')}** (${v.fix(3 * best, 2)} of 3)${wS.every(w=>w.value===0) ? ' — all criteria are switched off' : ''}. The ratings are a coarse reading, not a measurement.`; });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Event',
      name: 'LUCA and the tree of life',
      statement: String.raw`All extant cellular life shares a nearly universal genetic code, ribosomes and conserved molecular machinery, supporting a **last universal common ancestor** (LUCA): a population from which the bacterial and archaeal lineages diverged. Woese and Fox’s 1977 ribosomal-RNA work distinguished three **primary kingdoms**, using the names eubacteria, archaebacteria and urkaryotes. Woese, Kandler and Wheelis formally proposed the higher rank **domain** and the names Bacteria, Archaea and Eucarya in 1990; in the “three-domain” tree Archaea and Eukarya are sister groups, while many recent trees place eukaryotes *inside* the Archaea (a two-domain tree) with their mitochondria coming from a bacterium (3.5).

Molecular-clock dating puts LUCA very early. One 2024 analysis, calibrating duplicated genes with fossils and geochemistry, gives about **4.2 billion years ago**; the partitioned GBM-clock analysis gives a 95% interval of 4.18–4.33 Ga. Its intervals depend on rates, calibration priors and cross-bracing; this is not a direct fossil date. LUCA was not the first life, only the most recent ancestor of everything alive now, and it need not have been a single organism.`,
      idea: String.raw`Two groups of living species share a common ancestor if homologous sequences share similarities beyond a suitable chance model, and if substitutions accumulate at a roughly known rate $r$ per site per unit time, the age of the split is about $t = d/(2r)$ for a distance $d$. The rate is not constant, so clocks need fossil or geochemical calibration points on the tree; for LUCA, sparse and contested calibrations and assumptions about their placement on the tree matter greatly. A fossil of early life need not itself lie within either extant descendant lineage and is not automatically a hard minimum age for LUCA. Gene duplications that predate LUCA let the same calibrations be used twice, which narrows the estimate. The deep branching order is the harder problem: horizontal gene transfer blurs the signal, and which archaeon gave rise to eukaryotes (for example the Asgard group, Spang et al. 2015) is still being resolved.`,
      caption: String.raw`The tree runs from the oldest time on the left to today. Drag the **LUCA** handle or use the buttons to choose a date; switch between the three-domain and two-domain trees. The dashed lines in the tree are schematic and undated; the lower labels show calibration choices used by the 2024 study. The adjustable symmetric band is illustrative; it is not the paper’s posterior interval.`,
      deps: ['bighist-3.2', 'popgen-3.9'],
      see: ['bighist-3.5'],
      refs: ['Woese–Fox1977 PNAS74 pp5088–5090 full original; Woese–Kandler–Wheelis1990 PNAS87 pp4576–4579 full original; Moody et al.2024 Estimating the age of LUCA and Fig1; Spang et al.2015 phylogenetic results'],
      credit: 'Woese & Fox1977 (primary kingdoms); Woese, Kandler & Wheelis1990 (domains); Moody et al.2024 (LUCA clock model)',
      tags: ['tree of life', 'molecular clock'],
      scope: String.raw`The date is a model result with wide uncertainty; the shape of the deep tree and the root are still debated.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Last_universal_common_ancestor', doi: 'https://doi.org/10.1038/s41559-024-02461-1' },
      viz(v) {
        const topo = v.select('tree', [{ value: '3', label: 'three domains' }, { value: '2', label: 'two domains' }], '3');
        const unc = v.slider('illustrative ± band (Ga)', 0, 0.6, 0.2, { step: 0.01 });
        const A = v.stage({ x: [-4.8, 0.45], y: [-0.6, 3.5], axes: false, height: 330, full: true, title: 'the tree of life (schematic branching, one dated node)' });
        const h = A.handle(-4.2, 1.75, { color: 'accent', label: 'LUCA', constrain: { x: [-4.5, -3.3], y: [1.75, 1.75] } });
        v.button('Moody et al. 2024: 4.2 Ga', () => h.set(-4.2, 1.75));
        v.button('illustrative date: 3.65 Ga', () => h.set(-3.65, 1.75));
        const marks = [[-4.51, 'maximum prior: impact 4.510 Ga', 'muted'], [-2.954, 'minimum prior: proxy 2.954 Ga', 'green']];
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
          const T = -h.x, u = unc.value;
          return `Chosen LUCA date **${v.fix(T, 2)} Ga**, illustrative symmetric band ±${v.fix(u, 2)}Ga. This control does not rerun the molecular-clock inference.\nMoody 2024 partitioned GBM-clock result: 95% interval 4.18–4.33 Ga. The prior markers are model inputs, and an early-life fossil alone is not a hard minimum age for LUCA.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Event',
      name: 'The Great Oxidation Event',
      statement: String.raw`The **Great Oxidation Event** marks the early Palaeoproterozoic transition towards an oxygenated surface environment, broadly around 2.5–2.3 billion years ago. Archaean mass-independent sulfur-isotope fractionation (MIF-S) supports atmospheric oxygen below about $10^{-5}$ of the present atmospheric level. Its sedimentary disappearance is an important proxy, but **not a single globally synchronous switch**: Philippot et al. 2018 found MIF-S in Western Australia beyond 2.31 Ga and interpreted regional persistence as recycling of older sulfur after atmospheric oxygenation.

Oxygenic photosynthesis produces oxygen. Organic-carbon **burial preserves a net oxygen source** by preventing reoxidation; sinks include oxidation of reduced gases, iron and previously buried organic matter. Burial itself is not an oxygen sink.`,
      idea: String.raw`The schematic balance is $\dot x=S-x/(x+\varepsilon)-kx$, with $x$ in present atmospheric levels, $\varepsilon=10^{-5}$ and source $S$ normalized to the maximum fast-reductant sink. For $x\ll\varepsilon$ the reductant sink is small; for $x\gg\varepsilon$ it approaches1. Equilibria therefore change rapidly, but continuously, near $S=1$, approaching $x\approx(S-1)/k$ sufficiently above it. The curve below solves the equilibrium separately at each time: it is a **quasistatic illustration, not an integrated oxygen history**. Carbon burial’s sign follows from $\mathrm{CO_2+H_2O\rightleftharpoons CH_2O+O_2}$: burial prevents the reverse, oxygen-consuming reaction.`,
      caption: String.raw`Left: editorial schematic oxygen bands, not data points or confidence intervals fitted by the cited paper. The highlighted2.45–2.31Ga comparison interval is **not** a universal disappearance window: Western Australian MIF-S persists beyond it. Right: equilibrium levels of a toy flux balance while a chosen source changes smoothly. Sliders demonstrate sensitivity to assumptions; no slider value estimates the actual ancient source or sink.`,
      deps: ['bighist-3.3'],
      see: ['bighist-3.6', 'bighist-3.7'],
      refs: ['Philippot et al. 2018 Nature Communications9:2245, full Introduction and Results/Discussion, Figs1–5; toy oxygen balance and carbon-burial stoichiometry derived here'],
      credit: 'Philippot et al. 2018 (asynchronous sulfur-isotope records)',
      tags: ['oxygen', 'atmosphere', 'deep time'],
      scope: String.raw`The box model is a toy with one reservoir and one transition; it illustrates a threshold, not the history of any real flux.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Great_Oxidation_Event', doi: 'https://doi.org/10.1126/science.289.5480.756' },
      viz(v) {
        const S0 = v.slider('net source before / reductant supply', 0.2, 0.98, 0.4, { step: 0.01 });
        const S1 = v.slider('net source after / reductant supply', 0.3, 2.5, 1.4, { step: 0.01 });
        const tC = v.slider('date of the transition (Ga ago)', 1.8, 3.4, 2.4, { step: 0.01 });
        const kS = v.slider('weak sink k', 0.3, 3, 1, { step: 0.01 });
        const A = v.stage({ x: [-4, 0], y: [1e-8, 300], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time (Ga ago, negative)', ylabel: 'O₂ (% of present level)', title: 'editorial oxygen schematic (not confidence bands)' });
        const B = v.stage({ x: [-4, 0], y: [1e-8, 300], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'time (Ga ago, negative)', ylabel: 'toy model O₂ (% of present)', title: 'toy box model: a threshold' });
        const steady = oxygenEquilibrium;
        const sOf = (t, a, b, tc) => { const u = clamp((tc - -t) / 0.5 + 0.5, 0, 1); return a + (b - a) * u * u * (3 - 2 * u); };
        v.render(() => {
          A.rect(-4, 1e-8, -2.45, 1e-3, { fill: 'purple', fillAlpha: 0.22, color: 'purple', width: 1 });
          A.text('below 10⁻⁵ of present', -3.95, 6e-6, { size: 10.5, color: 'purple', align: 'left' });
          A.rect(-2.3, 1e-2, -0.8, 10, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1 });
          A.text('Proterozoic: wide range', -2.25, 3e-3, { size: 10.5, color: 'accent', align: 'left' });
          A.rect(-0.54, 10, 0, 150, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1 });
          A.vband(-2.45, -2.31, { color: 'orange', alpha: 0.2, edges: false });
          A.text('comparison interval; not a global cutoff', -2.4, 150, { size: 10.5, color: 'orange', align: 'left' });
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
          return `Toy model: before the transition O₂ ≈ **${lo.toExponential(1)}%** of present; after, **${hi < 0.01 ? hi.toExponential(1) : v.fix(hi, 2)}%**${S1.value <= 1 ? ' (source remains at or below the maximum fast-reductant sink)' : ` — a jump of ×${(hi / lo).toExponential(1)}`}.\nPhilippot2018: sedimentary MIF-S persists beyond 2.31 Ga in Western Australia; recycling can outlast atmospheric production. The curve is a sequence of equilibria, not a time integration.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Event',
      name: 'Complex cells by endosymbiosis',
      statement: String.raw`Mitochondria descend from a bacterial endosymbiont associated with the alphaproteobacterial lineage. Genomic and phylogenetic evidence also connects the host side of eukaryotic ancestry to Archaea. This supports an ancient merger, while the host’s physiology and the sequence of cellular changes remain debated. Modern Asgard archaea provide comparative evidence, not living replicas of that host.

Organelle DNA is only part of the story. **MitoCarta3.0** inventories 1,136 human genes encoding mitochondrial proteins: 13 are encoded in mitochondrial DNA and 1,123 in nuclear DNA. Nuclear-encoded proteins are made in the cytoplasm and imported. These counts concern **protein-coding genes**; RNA-coding genes are excluded from these protein inventories.`,
      idea: String.raw`Phylogenetic relationships and shared cellular machinery support bacterial ancestry; reductive evolution then involves gene loss, transfer and replacement. The current nuclear mitochondrial proteome is not simply the set of transferred ancestral genes: its components have multiple evolutionary histories. Rickettsia is an extant parasitic bacterium used for comparison, not a stage on a ladder leading to human mitochondria. The 1998 Rickettsia genome paper reports 834 protein-coding genes and evidence of ongoing gene degradation. The 2021 MitoCarta inventory measures a different present-day system; neither count determines the ancestral symbiont’s genome size.`,
      caption: String.raw`Left: **protein-coding** counts from two published inventories, explicitly separating the bacterial genome, human mitochondrial DNA and human nuclear genes encoding mitochondrial proteins. They are comparisons, not a phylogenetic sequence. Choose a bar to highlight it. Right: the **coding origins** of the human inventory; dots are rounded blocks of the selected size, and their positions do not show where the finished proteins reside. Nuclear-encoded proteins are imported into the mitochondrion. No fraction of genes lost or transferred from an assumed ancestor is inferred.`,
      deps: ['bighist-3.4'],
      see: ['bighist-3.3'],
      refs: ['Andersson et al.1998 Nature396 pp133–140, General features and Reductive evolution/mitochondrial phylogeny; Rath et al.2021 NAR49 D1541–D1547, full MitoCarta3.0 article; Spang et al.2015 phylogenetic results; Imachi et al.2020 New insights into eukaryogenesis'],
      credit: 'Andersson et al.1998; Spang et al.2015; Imachi et al.2020; Rath et al.2021',
      tags: ['eukaryotes', 'symbiosis'],
      scope: String.raw`The cited counts refer to their publication’s annotation and inventory criteria. They do not estimate ancient genome size. Imachi et al. explicitly label their proposed route to endosymbiosis a hypothetical model.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Endosymbiont', doi: 'https://doi.org/10.1093/nar/gkaa1011' },
      viz(v) {
        const H=HUMAN_MITO_PROTEINS;
        const G=[
          {key:'Rickettsia',name:'Rickettsia bacterial genome (1998)',genes:834,col:'blue'},
          {key:'human mtDNA',name:'human mtDNA protein-coding genes',genes:H.mitochondrial,col:'orange'},
          {key:'human nuclear',name:'human nuclear genes encoding mitochondrial proteins',genes:H.nuclear,col:'purple'},
        ];
        const sel=v.select('highlight count',G.map((g,i)=>({value:String(i),label:g.key})),'1');
        const block=v.slider('protein-coding genes per dot (rounded)',1,30,10,{int:true});
        const A=v.stage({x:[.4,3.6],y:[1,2500],ylog:true,axes:'box',gutter:true,height:310,xticks:G.map((g,i)=>[i+1,g.key]),ylabel:'protein-coding genes',title:'published counts; not evolutionary stages'});
        const B=v.stage({x:[-2.5,2.9],y:[-1.45,1.45],equal:true,axes:false,height:310,title:'human coding origins; all proteins function in mitochondria'});
        const lattice=(cx,rx,ry,n)=>{
          const pts=[];for(let i=-44;i<=44;i++)for(let j=-44;j<=44;j++){const x=i*.025,y=j*.025;if((x/rx)**2+(y/ry)**2<=1)pts.push([cx+x,y,x*x+y*y]);}
          return pts.sort((a,b)=>a[2]-b[2]).slice(0,n);
        };
        v.render(()=>{
          G.forEach((g,i)=>{A.rect(i+.65,1,i+1.35,g.genes,{fill:g.col,fillAlpha:i===Number(sel.value)?.65:.25,color:g.col,width:i===Number(sel.value)?2:1});A.text(String(g.genes),i+1,g.genes*1.3,{size:11,color:'ink',align:'center'});});
          B.curve(t=>[.2+2.6*Math.cos(t),1.35*Math.sin(t)],0,2*Math.PI,{color:'muted',width:1.5});
          B.circle(-1.35,0,.92,{color:'purple',fill:'purple',fillAlpha:.08,width:1.8});
          B.curve(t=>[1.15+1.05*Math.cos(t),.6*Math.sin(t)],0,2*Math.PI,{color:'orange',width:2});
          B.text('nuclear coding:1,123',-1.35,1.06,{size:11,color:'purple',align:'center'});
          B.text('mtDNA coding:13',1.15,.82,{size:11,color:'orange',align:'center'});
          for(const p of lattice(-1.35,.84,.84,Math.ceil(H.nuclear/block.value)))B.dot(p[0],p[1],{r:2,color:'purple'});
          for(const p of lattice(1.15,.95,.52,Math.ceil(H.mitochondrial/block.value)))B.dot(p[0],p[1],{r:2.6,color:'orange'});
          B.arrow(-.25,.45,.55,.45,{color:'purple',width:1.6});B.text('protein import',.1,.65,{size:10,color:'muted',align:'center'});
          B.text(`1 dot ≈ ${block.value} coding genes; partial blocks rounded up`,-2.4,-1.3,{size:10,color:'muted',align:'left'});
        });
        v.readout(()=>{const g=G[Number(sel.value)];return `**${g.name}: ${g.genes}** protein-coding genes. These are separate published categories, not ancestors and descendants.\nHuman MitoCarta3.0: ${H.mitochondrial}+${H.nuclear}=${H.total}; ${v.fix(100*H.nuclear/H.total,2)}% nuclear-encoded. The inventory does not tell how many of those genes were transferred from the original endosymbiont.`;});
      },
    },
  ],
};
