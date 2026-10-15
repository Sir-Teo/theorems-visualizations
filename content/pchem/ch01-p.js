// Physical Chemistry — Chapter 1 (papers): Lavoisier 1789, Avogadro 1811

// ── Lavoisier, Traité élémentaire de chimie, Part I ch. III, as translated by R. Kerr (Elements of Chemistry, 1790;
//    Project Gutenberg #30775). Paris units: 1 pound = 16 oz = 9216 grains = 7561 English troy grains, so 1 grain = 53.16 mg;
//    1 pouce cube ≈ 19.84 cm³. Lavoisier: at 28 in of mercury and 10° Réaumur a cubic inch of oxygen gas weighs ½ grain. ──
const LAV = {
  hgOunces: 4, hgGrains: 4 * 576, airStart: 50, airEnd: [42, 43], days: 12, calx: 45, hgBack: 41.5, gasBack: [7, 8],
  oxPerCuIn: 0.5, grainMg: (7561 * 64.79891) / 9216, cuInCm3: 19.837,
};
const M_HG = 200.592, M_O = 15.999; // g/mol, today
/** Oxygen absorbed (cubic inches) after t days — illustrative timing: nothing on day 1, red specks from day 2,
 *  growth over the next four or five days, then no further change (Lavoisier's description); total 7.5 cu in. */
const absorbed = (t) => (t <= 1 ? 0 : 7.5 * (1 - Math.exp(-(t - 1) / 1.5)) / (1 - Math.exp(-11 / 1.5)));

// ── Avogadro 1811 (Journal de Physique 73: 58–76; Alembic Club Reprint No. 4, transcribed by C. Giunta):
//    densities relative to air (Biot & Arago; Gay-Lussac) and his molecular masses relative to hydrogen ──
const GASES = {
  H2: { name: 'hydrogen', atoms: [['H', 2]], dens: 0.07321, mod: 2.016, col: 'pink' },
  O2: { name: 'oxygen', atoms: [['O', 2]], dens: 1.10359, mod: 31.998, avo: 15.074, dalton: 6, col: 'red' },
  N2: { name: 'nitrogen', atoms: [['N', 2]], dens: 0.96913, mod: 28.014, avo: 13.238, dalton: 5, col: 'blue' },
  Cl2: { name: 'chlorine (oxymuriatic gas)', atoms: [['Cl', 2]], dens: 2.470, mod: 70.906, avo: 33.74, col: 'green' },
  H2O: { name: 'steam', atoms: [['H', 2], ['O', 1]], mod: 18.015 },
  NO: { name: 'nitrous gas', atoms: [['N', 1], ['O', 1]], dens: 1.03636, mod: 30.006, avo: 14.156, dalton: 11 },
  HCl: { name: 'muriatic acid gas', atoms: [['H', 1], ['Cl', 1]], dens: 1.278, mod: 36.461, avo: 17.45 },
  NH3: { name: 'ammonia', atoms: [['N', 1], ['H', 3]], mod: 17.031 },
  N2O: { name: 'nitrous oxide', atoms: [['N', 2], ['O', 1]], dens: 1.52092, mod: 44.013, avo: 20.775, dalton: 16 },
};
const ACOL = { H: 'gold', O: 'red', N: 'blue', Cl: 'green' };
// combining volumes (Gay-Lussac 1809, as Avogadro uses them): reactants → products, in volumes
const RXN = {
  water: { label: '2 H₂ + O₂ → 2 H₂O', a: ['H2', 2], b: ['O2', 1], p: ['H2O', 2], src: 'Humboldt & Gay-Lussac 1805: 100 oxygen to 200 hydrogen; steam has twice the volume of its oxygen' },
  no: { label: 'N₂ + O₂ → 2 NO', a: ['N2', 1], b: ['O2', 1], p: ['NO', 2], src: 'Gay-Lussac 1809: equal volumes, no contraction (density 1.036 computed, 1.038 measured)' },
  hcl: { label: 'H₂ + Cl₂ → 2 HCl', a: ['H2', 1], b: ['Cl2', 1], p: ['HCl', 2], src: 'Gay-Lussac & Thénard; Davy: equal volumes, product volume equal to their sum' },
  nh3: { label: 'N₂ + 3 H₂ → 2 NH₃', a: ['N2', 1], b: ['H2', 3], p: ['NH3', 2], src: 'A. Berthollet: ammonia is 100 nitrogen to 300 hydrogen by volume' },
};

export default {
  collection: 'pchem',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.17
    {
      num: '1.17',
      kind: 'Paper',
      name: 'Traité élémentaire de chimie',
      paper: { authors: 'A.-L. Lavoisier', year: 1789, title: 'Traité élémentaire de chimie, présenté dans un ordre nouveau et d’après les découvertes modernes', venue: 'Paris: Cuchet (book, 2 vols.)', url: 'https://archive.org/details/traitlmentairede01lavo' },
      introduces: [],
      credit: 'Antoine-Laurent Lavoisier, 1789',
      statement: String.raw`Lavoisier's textbook rebuilt chemistry on the balance. It states as "an incontestable axiom" that **in every operation of art and nature nothing is created: an equal quantity of matter exists before and after**, and the quantity of each element is unchanged — the law of conservation of mass. It defines an **element** operationally as a substance not yet decomposed, gives the first modern list of 33 simple substances (with light and caloric among them), introduces the new systematic nomenclature (oxide, sulphate, …), and explains combustion, calcination and respiration as combination with oxygen, displacing the phlogiston theory. Its showpiece is the analysis and synthesis of air with mercury: four ounces of mercury heated for twelve days in a closed vessel with 50 cubic inches of air turned 7–8 cubic inches of it into 45 grains of red calx, leaving air that "was no longer fit either for respiration or for combustion"; heating the 45 grains of calx gave back $41\tfrac12$ grains of mercury and 7–8 cubic inches of a gas that made a taper burn "with a dazzling splendour" — oxygen. Scope: mass is conserved in chemical reactions to the precision of any balance (the mass equivalent of reaction energies, $\Delta E/c^2$, is about one part in $10^{10}$).`,
      idea: String.raw`In the phlogiston theory of Stahl, a metal was a calx plus phlogiston, released on burning; but metals gain weight when calcined, which forced the awkward idea of phlogiston with negative weight. Lavoisier insisted that every experiment be weighed in a closed apparatus, gases included. In the mercury experiment the closed system shows where the gained weight comes from: the air shrinks by about a sixth while the red calx forms, and decomposing the calx returns the same metal and a matching volume of gas, so the calx is mercury plus part of the air. Recombining the two airs (42 cubic inches of "mephitis" with 8 of vital air) gave back ordinary air. The experiment did not need Lavoisier's absolute accuracy, only bookkeeping: the whole new chemistry of the *Traité* — conservation of mass, elements, oxygen — rested on that discipline, and Dalton's atomic weights (1808) and Avogadro's molecular masses (pchem-1.18) were built on it.`,
      caption: String.raw`Step through Lavoisier's two operations. **Calcination**: drag the day slider; mercury in the matrass is kept near boiling, red specks of calx appear from the second day, and the mercury rises in the bell jar as the air is absorbed (the timing between his stated stages is illustrative). **Reduction**: heat the 45 grains of calx in a small retort and collect the mercury and the gas. Right: Lavoisier's balance sheet in grains. In the **sealed** apparatus the total stays the same at every stage. Switch to an **open vessel** and weigh only what is in it: the metal seems to *gain* weight on calcination and the calx to *lose* weight on heating — the paradox that sustained phlogiston.`,
      deps: [],
      refs: [],
      tags: ['conservation of mass', 'oxygen', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Trait%C3%A9_%C3%A9l%C3%A9mentaire_de_chimie', gutenberg: 'https://www.gutenberg.org/ebooks/30775' },
      viz(v) {
        const M = v.M;
        const step = v.select('operation', [{ value: 'calc', label: '1. calcination of mercury (12 days)' }, { value: 'red', label: '2. heating the red calx' }], 'calc');
        const day = v.slider('day', 0, 12, 12, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} of 12` });
        const heat = v.slider('heating the calx', 0, 1, 1, { step: 0.01, fmt: (x) => `${Math.round(x * 100)}% done` });
        const sealed = v.select('apparatus', [{ value: 'sealed', label: 'sealed, gases weighed' }, { value: 'open', label: 'open vessel' }], 'sealed');
        const A = v.stage({ x: [0, 6.8], y: [0, 4], equal: true, axes: false, height: 330, weight: 1.25, minWidth: 300, title: 'the apparatus' });
        const B = v.stage({ x: [0, 3], y: [0, 56], axes: 'box', height: 330, weight: 1, minWidth: 260, yticks: [0, 10, 20, 30, 40, 50], title: 'what the balance sees (grains)', xticks: [[0.85, 'start'], [2.15, 'now']] });
        const flame = (x, y, s) => { for (let k = 0; k < 3; k++) A.poly([[x - 0.18 * s + 0.18 * s * k, y], [x - 0.09 * s + 0.18 * s * k, y + 0.42 * s], [x + 0.18 * s * k, y]], { fill: k === 1 ? 'gold' : 'orange', fillAlpha: 0.85, stroke: false }); };
        let st = {};
        v.render(() => {
          const calc = step.value === 'calc', open = sealed.value === 'open';
          day.el.hidden = !calc; heat.el.hidden = calc;
          // progress: fraction of the 41.5 grains of mercury that is calx
          const ox = calc ? absorbed(day.value) : 7.5 * (1 - heat.value), f = ox / 7.5;
          const calx = LAV.calx * f, hgFree = LAV.hgBack * (1 - f), oxGrains = 3.75; // 7.5 cu in at ½ grain
          const gas = oxGrains * (1 - f);
          if (calc) {
            // furnace and matrass
            A.rect(0.4, 0.2, 2.2, 0.9, { fill: 'muted', fillAlpha: 0.35, color: 'muted', radius: 3 });
            if (day.value > 0) flame(1.3, 0.6, 1);
            A.circle(1.3, 1.6, 0.62, { color: 'ink', width: 1.6, fill: 'panel', fillAlpha: 0.3 });
            const seg = (cx, cy, R, yTop) => { const a = Math.asin(Math.max(-1, Math.min(1, (yTop - cy) / R))), t0 = Math.PI - a, t1 = 2 * Math.PI + a, pts = []; for (let k = 0; k <= 30; k++) { const th = t0 + ((t1 - t0) * k) / 30; pts.push([cx + R * Math.cos(th), cy + R * Math.sin(th)]); } return pts; }; // circular segment below the chord y = yTop
            A.poly(seg(1.3, 1.6, 0.6, 1.28), { fill: 'muted', fillAlpha: 0.8, stroke: false });
            const nSpeck = Math.round(28 * f), r = v.rng(4);
            for (let k = 0; k < nSpeck; k++) A.dot(0.88 + 0.84 * r(), 1.27 + 0.03 * r(), { r: 2 + 1.6 * r(), color: 'red' });
            if (open) {
              A.path([[1.3, 2.22], [1.3, 3.3]], { color: 'ink', width: 4, alpha: 0.6 });
              A.text('open to the room: oxygen flows in unweighed', 1.45, 3.45, { size: 10.5, color: 'red' });
            } else {
              // bent neck into the bell jar standing in a mercury trough
              A.path([[1.62, 2.1], [2.5, 3.2], [4.1, 3.2], [4.1, 1.8]], { color: 'ink', width: 3, alpha: 0.6 });
              A.rect(3.2, 0.3, 5.6, 1.2, { fill: 'muted', fillAlpha: 0.55, color: 'ink', width: 1.2 });
              const vol = LAV.airStart - ox, top = 3.0, level = 1.2 + (top - 1.2) * (1 - vol / LAV.airStart) * 3.2;
              A.rect(3.6, 0.9, 4.9, top, { color: 'ink', width: 1.6, fill: 'teal', fillAlpha: 0.1 });
              A.rect(3.6, 0.9, 4.9, Math.min(level, top), { fill: 'muted', fillAlpha: 0.8, stroke: false });
              A.line(4.95, level, 5.3, level, { color: 'red', width: 2 });
              A.text(`air ${v.fix(vol, 1)} cu in`, 5.35, level, { size: 10.5, color: 'red' });
              A.line(4.95, 1.2, 5.3, 1.2, { color: 'muted', dash: [2, 2] });
            }
            A.text(`day ${v.fix(day.value, 1)}${day.value < 1 ? ': mercury evaporating, nothing else' : day.value < 6 ? ': red specks growing' : ': no further change'}`, 0.3, 3.8, { size: 11.5, color: 'ink', weight: 600 });
          } else {
            A.rect(0.4, 0.2, 2.0, 0.85, { fill: 'muted', fillAlpha: 0.35, color: 'muted', radius: 3 });
            if (heat.value > 0 && heat.value < 1) flame(1.2, 0.55, 1.1);
            A.circle(1.2, 1.45, 0.48, { color: 'ink', width: 1.6, fill: 'panel', fillAlpha: 0.3 });
            const pile = 0.28 * Math.sqrt(f);
            if (f > 0.01) A.poly([[1.2 - pile * 1.6, 1.05], [1.2, 1.05 + pile], [1.2 + pile * 1.6, 1.05]], { fill: 'red', fillAlpha: 0.9, stroke: false });
            A.path([[1.6, 1.75], [2.6, 2.1]], { color: 'ink', width: 3, alpha: 0.6 });
            // recipient collecting mercury
            A.rect(2.6, 1.4, 3.3, 2.3, { color: 'ink', width: 1.4 });
            A.rect(2.62, 1.42, 3.28, 1.42 + 0.5 * (1 - f), { fill: 'muted', fillAlpha: 0.8, stroke: false });
            A.text(`mercury ${v.fix(LAV.hgBack * (1 - f), 1)} gr`, 2.95, 1.25, { size: 10.5, align: 'center', color: 'ink' });
            if (open) A.text('open: the gas escapes into the room', 3.5, 3.4, { size: 10.5, color: 'red' });
            else {
              A.path([[3.3, 2.1], [4.4, 2.1], [4.4, 1.6]], { color: 'ink', width: 3, alpha: 0.6 });
              A.rect(3.9, 0.3, 5.7, 0.9, { fill: 'muted', fillAlpha: 0.55, color: 'ink', width: 1.2 });
              A.rect(4.1, 0.6, 5.2, 2.9, { color: 'ink', width: 1.6 });
              const gasH = (2.3 * 7.5 * (1 - f)) / 9; // the gas collects at the top and pushes the mercury down
              A.rect(4.1, 0.6, 5.2, 2.9 - gasH, { fill: 'muted', fillAlpha: 0.65, stroke: false });
              if (gasH > 0.005) A.rect(4.1, 2.9 - gasH, 5.2, 2.9, { fill: 'teal', fillAlpha: 0.25, stroke: false });
              A.text(`vital air ${v.fix(7.5 * (1 - f), 1)} cu in`, 4.65, 3.1, { size: 10.5, align: 'center', color: 'teal', weight: 600 });
            }
            A.text(heat.value >= 1 ? 'the red calx has disappeared' : 'red calx heated to near red heat', 0.3, 3.8, { size: 11.5, color: 'ink', weight: 600 });
          }
          // balance sheet: stacked bars (grains); start vs now
          const s0 = calc ? { hg: LAV.hgBack, calx: 0, ox: oxGrains } : { hg: 0, calx: LAV.calx, ox: 0 };
          const s1 = { hg: hgFree, calx, ox: gas };
          const stack = (x, S) => {
            const parts = [['hg', 'muted', 'mercury'], ['calx', 'red', 'red calx'], ['ox', 'teal', 'vital air']];
            let y = 0, tot = 0;
            parts.forEach(([k, c]) => { const h = S[k]; if (h <= 0.01) return; const weighed = !(open && k === 'ox'); B.rect(x - 0.4, y, x + 0.4, y + h, { fill: c, fillAlpha: weighed ? 0.7 : 0.08, color: c, width: 1, dash: weighed ? null : [3, 3] }); if (weighed) tot += h; y += h; });
            B.text(`${v.fix(tot, 2)} gr`, x, y, { align: 'center', dy: -10, size: 11.5, color: 'ink', weight: 700 });
            return tot;
          };
          const t0 = stack(0.85, s0), t1 = stack(2.15, s1);
          st = { calc, open, f, t0, t1, ox };
        });
        v.legend([['muted', 'mercury (the 41½ grains that react; ~2,262 more stay liquid)', { area: true }], ['red', 'red calx', { area: true }], ['teal', 'vital air (oxygen), ½ grain per cubic inch', { area: true }]]);
        v.readout(() => {
          const { calc, open, t0, t1 } = st; if (t0 == null) return '';
          const g = LAV.grainMg, hgFrac = M_HG / (M_HG + M_O);
          const bal = open ? `open vessel: the balance reads ${v.fix(t0, 2)} → ${v.fix(t1, 2)} grains, an apparent ${t1 > t0 ? 'gain' : 'loss'} of ${v.fix(Math.abs(t1 - t0), 2)} grains (${v.fix(Math.abs(t1 - t0) * g, 0)} mg) — the oxygen ${t1 > t0 ? 'came from' : 'went to'} the unweighed air` : `sealed: ${v.fix(t0, 2)} grains before, ${v.fix(t1, 2)} grains now — Lavoisier's figures: 41½ grains of mercury + 7 to 8 cu in of oxygen (3½–4 grains) ↔ 45 grains of calx, equal within his reading of the gas volume`;
          return `${bal} · air: 50 cu in shrank to 42–43 (lost about 1/6; today we know air is 20.9% oxygen, so the mercury took about ${v.fix((7.5 / (0.2095 * 50)) * 100, 0)}% of it) · today's check: mercury is ${v.fix(hgFrac * 100, 2)}% of HgO by mass, so 45 grains of calx hold ${v.fix(45 * hgFrac, 2)} grains of mercury (Lavoisier: 41½) and ${v.fix(45 * (1 - hgFrac), 2)} grains of oxygen = ${v.fix((45 * (1 - hgFrac) * g) / 1.361 / LAV.cuInCm3, 1)} cu in at his 28 in, 10 °R (he collected 7–8) · units: 1 grain = ${v.fix(g, 2)} mg, 1 cu in = ${LAV.cuInCm3} cm³; at his conditions oxygen weighs ${v.fix((1.361 * LAV.cuInCm3) / g, 3)} grain per cu in (he wrote ½)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.18
    {
      num: '1.18',
      kind: 'Paper',
      name: 'Masses relatives des molécules élémentaires des corps',
      paper: { authors: 'A. Avogadro', year: 1811, title: 'Essai d’une manière de déterminer les masses relatives des molécules élémentaires des corps, et les proportions selon lesquelles elles entrent dans ces combinaisons', venue: 'Journal de Physique, de Chimie et d’Histoire Naturelle 73: 58–76', url: 'https://books.google.com/books?id=MxgTAAAAQAAJ&pg=PA58' },
      introduces: ['pchem-1.3'],
      credit: 'Amedeo Avogadro, 1811',
      statement: String.raw`To explain Gay-Lussac's law that gases combine in simple ratios by volume, Avogadro made the hypothesis that **equal volumes of all gases, at the same temperature and pressure, contain the same number of molecules** (pchem-1.3), and the second hypothesis that the molecules of elementary gases are not single atoms but composed of several "elementary molecules" which can **split** when they combine. Then (a) the ratio of combining volumes is the ratio of numbers of molecules, so water is one molecule of oxygen to two of hydrogen; (b) a product occupying twice the expected volume means each molecule has split in two — oxygen and hydrogen are (in modern terms) $\mathrm{O_2}$ and $\mathrm{H_2}$, and $2\,\mathrm{H_2}+\mathrm{O_2}\to2\,\mathrm{H_2O}$; (c) the ratio of gas densities is the ratio of molecular masses: from the densities $1.10359$ (oxygen), $0.96913$ (nitrogen) and $0.07321$ (hydrogen) relative to air, oxygen's molecule is $15.074$ and nitrogen's $13.238$ times hydrogen's. Scope: exact for ideal gases; real gases deviate by parts per thousand at room conditions, more near condensation.`,
      idea: String.raw`Dalton (1808) had built atomic weights on the simplest-formula rule (water = HO) and rejected the idea that equal volumes hold equal numbers of particles, because then the volume results of Gay-Lussac (1809) would require atoms to be split: one volume of oxygen gives two volumes of steam, so each "atom" of oxygen would end up in two water particles. Avogadro's insight was that the particles of a gas need not be atoms. Allowing elementary gases to be made of pairs that separate on combination removes the contradiction and turns gas densities into molecular weights at once. The paper was largely ignored for half a century — Avogadro's terminology was confusing, and Berzelius's electrochemical theory forbade two like atoms from binding — until Cannizzaro's pamphlet at the Karlsruhe Congress of 1860 used it to fix a consistent table of atomic weights. The number of molecules in a mole now bears Avogadro's name.`,
      caption: String.raw`Each box is one volume of gas at the same temperature and pressure, holding the same number of particles (four here). Pick a reaction with Gay-Lussac's combining volumes, then switch the **picture of a gas**. *Dalton's atoms*: if every elementary particle is one indivisible atom, the measured product volume would need fractional atoms in each product particle (red) — the hypothesis fails. *Avogadro's molecules*: the elementary gases are pairs that split, and every volume ratio comes out in whole molecules. Right: molecular masses from gas densities — Avogadro's 1811 numbers against today's, and Dalton's.`,
      deps: ['pchem-1.1', 'pchem-1.2'],
      refs: [],
      tags: ['Avogadro', 'molecules', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Avogadro%27s_law', alembic: 'https://web.lemoyne.edu/giunta/avogadro.html' },
      viz(v) {
        const PER = 4;
        const rx = v.select('reaction', Object.entries(RXN).map(([k, r]) => ({ value: k, label: r.label })), 'water');
        const pic = v.select('picture of a gas', [{ value: 'avo', label: 'Avogadro: molecules can split' }, { value: 'dal', label: 'Dalton: single indivisible atoms' }], 'avo');
        const A = v.stage({ x: [0, 11], y: [0.2, 4.4], equal: true, axes: false, height: 270, full: true, title: 'equal volumes, equal numbers of particles' });
        const B = v.stage({ x: [0.4, 6.6], y: [-4.5, 40], axes: 'box', height: 260, full: true, title: 'molecular mass relative to hydrogen, from gas densities', xticks: [], yticks: [0, 10, 20, 30] });
        /** draw one particle (list of atoms) centred at (x, y); fractional atoms are drawn as red half discs */
        const particle = (x, y, atoms, bad) => {
          const flat = []; atoms.forEach(([el, n]) => { for (let i = 0; i < Math.ceil(n); i++) flat.push([el, Math.min(1, n - i)]); });
          const r = 0.1, w = (flat.length - 1) * r * 1.55;
          flat.forEach(([el, frac], i) => {
            const cx = x - w / 2 + i * r * 1.55;
            if (frac < 0.999) { A.poly(Array.from({ length: 13 }, (_, k) => [cx + r * Math.cos(Math.PI / 2 + (Math.PI * k) / 12), y + r * Math.sin(Math.PI / 2 + (Math.PI * k) / 12)]), { fill: 'red', fillAlpha: 0.9, color: 'red' }); A.text('½', cx + 0.05, y + 0.27, { size: 10, color: 'red', weight: 700, align: 'center' }); }
            else A.circle(cx, y, r, { fill: ACOL[el], fillAlpha: 0.85, color: ACOL[el], width: 1 });
          });
          if (bad) A.circle(x, y, w / 2 + 0.24, { color: 'red', width: 1.2, dash: [3, 3] });
        };
        const box = (x0, y0, w, h, label, col) => { A.rect(x0, y0, x0 + w, y0 + h, { color: col, width: 1.6, fill: col, fillAlpha: 0.05, radius: 6 }); A.text(label, x0 + w / 2, y0 - 0.2, { align: 'center', size: 10.5, color: 'ink' }); };
        let st = {};
        v.render(() => {
          const R = RXN[rx.value], dal = pic.value === 'dal';
          const ga = GASES[R.a[0]], gb = GASES[R.b[0]], gp = GASES[R.p[0]];
          // particles per gas: Avogadro diatomic; Dalton monatomic elements (one atom per particle)
          const fa = (g) => (dal && g.atoms.length === 1 ? g.atoms.map(([e]) => [e, 1]) : g.atoms);
          const atomsA = fa(ga), atomsB = fa(gb);
          const nA = PER * R.a[1], nB = PER * R.b[1], nP = PER * R.p[1];
          // atoms available → per product particle
          const count = (atoms, el) => atoms.filter(([e]) => e === el).reduce((s, [, n]) => s + n, 0);
          const els = [...new Set([...atomsA, ...atomsB].map(([e]) => e))];
          const perP = els.map((el) => [el, (nA * count(atomsA, el) + nB * count(atomsB, el)) / nP]);
          const frac = perP.some(([, n]) => Math.abs(n - Math.round(n)) > 1e-9);
          // layout: reactant boxes then arrow then product boxes
          const bw = 1.45, bh = 1.6, y0 = 1.3; let x = 0.2;
          const drawGas = (n, atoms, label, col, bad) => {
            for (let b = 0; b < n / PER; b++) {
              box(x, y0, bw, bh, b === 0 ? label : '', col);
              for (let k = 0; k < PER; k++) particle(x + 0.37 + 0.71 * (k % 2), y0 + 0.42 + 0.75 * Math.floor(k / 2), atoms, bad);
              x += bw + 0.18;
            }
          };
          drawGas(nA, atomsA, `${ga.name}`, ACOL[ga.atoms[0][0]], false);
          A.text('+', x + 0.05, y0 + bh / 2, { size: 20, color: 'ink', align: 'center' }); x += 0.35;
          drawGas(nB, atomsB, `${gb.name}`, ACOL[gb.atoms[0][0]], false);
          A.arrow(x + 0.05, y0 + bh / 2, x + 0.75, y0 + bh / 2, { color: 'ink', width: 2, head: 9 }); x += 0.95;
          drawGas(nP, perP, `${gp.name}: ${R.p[1]} volumes measured`, frac ? 'red' : 'green', frac);
          A.text(R.src, 5.5, 0.45, { align: 'center', size: 10.5, color: 'muted' });
          A.text(frac ? `Dalton: each ${gp.name} particle would need ${perP.map(([e, n]) => `${Number.isInteger(n) ? n : v.fix(n, 1)} ${e}`).join(' + ')} — atoms would have to split` : `each ${gp.name} molecule: ${perP.map(([e, n]) => `${n} ${e}`).join(' + ')} — whole atoms, as observed`, 5.5, 4.15, { align: 'center', size: 12, color: frac ? 'red' : 'green', weight: 700 });
          // molecular masses
          const rows = ['O2', 'N2', 'NO', 'N2O', 'Cl2', 'HCl'];
          rows.forEach((k, i) => {
            const gg = GASES[k], x0 = i + 1, today = gg.mod / GASES.H2.mod;
            B.text(gg.name.replace(' (oxymuriatic gas)', ''), x0, -2.3, { align: 'center', size: 11, color: 'ink' });
            B.rect(x0 - 0.36, 0, x0 - 0.04, gg.avo, { fill: 'gold', fillAlpha: 0.75, color: 'gold' });
            B.rect(x0 + 0.04, 0, x0 + 0.36, today, { fill: 'green', fillAlpha: 0.6, color: 'green' });
            if (gg.dalton) B.line(x0 - 0.4, gg.dalton, x0 + 0.4, gg.dalton, { color: 'purple', width: 2.4, dash: [5, 3] });
            B.text(v.fix(gg.avo, 2), x0 - 0.2, gg.avo, { align: 'center', dy: -9, size: 10, color: 'gold' });
            B.text(v.fix(today, 2), x0 + 0.2, today, { align: 'center', dy: -9, size: 10, color: 'green' });
          });
          st = { R, frac, dal, perP, gp };
        });
        v.legend([['gold', 'Avogadro 1811 (density ratio)', { area: true }], ['green', 'today (molar masses)', { area: true }], ['purple', 'Dalton, as Avogadro quotes him', { dash: true }]]);
        v.readout(() => {
          const { frac, dal } = st; if (frac == null) return '';
          const H = GASES.H2, Hmod = H.mod / 28.965;
          return `${frac ? '**Dalton’s picture fails**: equal numbers in equal volumes plus indivisible single atoms cannot give the measured volume of product' : dal ? 'here even single atoms work, but only because the ratio happens not to need splitting' : '**Avogadro’s picture works**: the volume ratio is the molecule ratio'} · densities relative to air: oxygen 1.10359, nitrogen 0.96913, hydrogen 0.07321 → oxygen ${v.fix(1.10359 / 0.07321, 3)} and nitrogen ${v.fix(0.96913 / 0.07321, 3)} times hydrogen (Avogadro: 15.074 and 13.238; today 15.873 and 13.896) · his values run about 5% low because the hydrogen density he used, 0.07321, is high: today it is $2.016/28.965$ = ${v.fix(Hmod, 5)} · Dalton made oxygen less than half Avogadro's figure (6 against 15), because he wrote water as HO`;
        });
      },
    },
  ],
};
