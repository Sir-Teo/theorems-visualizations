// Quantum Chemistry & Spectroscopy — Chapter 3, part b: items 3.8–3.13 (3.1–3.7 are in ch03.js)
import { TAU, HARTREE_EV, SYM, IE, EA, EA_EST, PAULING, RADIUS, groundConfig, madelung, configText, blockOf, slaterGroups, slaterZeff, subN, subL, outermost, EXCEPTIONS } from './ch03.shared.js';

const CM_EV = 8065.543937; // cm⁻¹ per eV (CODATA 2018)

export default {
  collection: 'qchem',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Principle',
      name: 'Hund’s rules',
      credit: 'Hund, c. 1925',
      statement: String.raw`For the terms of one electron configuration (Russell–Saunders coupling, 3.7), the lowest term is found, empirically, by three rules in order:
(1) the term of greatest spin multiplicity $2S+1$ (greatest $S$) lies lowest;
(2) among terms of equal $S$, the one with the greatest $L$ lies lowest;
(3) for the levels $J$ of that term, the lowest $J=|L-S|$ lies lowest if the open subshell is less than half full, the highest $J=L+S$ if it is more than half full.
In particular, electrons in degenerate orbitals occupy different orbitals with parallel spins before they pair up (chemists' "Hund's rule").`,
      scope: String.raw`Reliable for the ground term of a ground configuration of light atoms and for the lowest term of a given excited configuration, not for ordering the higher terms. The textbook reason for rule 1 (parallel spins stay apart, so the repulsion is smaller; 3.6) is not the whole story: more careful calculations are reported to attribute much of the effect to the weaker shielding of singly occupied orbitals (this explanation is taken from a secondary source, so this item is flagged for checking).`,
      idea: String.raw`Rule 1 follows the exchange picture of 3.6: electrons with parallel spins are kept apart by antisymmetry, lowering their mutual repulsion, so the highest-spin term wins. Rule 2: electrons that orbit in the same sense meet less often. Rule 3 comes from the sign of the spin–orbit coupling constant, which changes sign at half filling because a nearly full subshell behaves like holes. The same rule decides the high-spin or low-spin ground states of $d^n$ ions when the crystal-field splitting is compared with the pairing cost, as the left panel lets you test.`,
      caption: String.raw`Left: five $d$ orbitals split by a crystal field $\Delta$ (three low, two high). Choose the number of electrons and the model parameters (pairing cost $P$, exchange gain $K$ per parallel pair, splitting $\Delta$); the diagram shows the arrangement of lowest model energy, and you can **click an orbital** to cycle its occupation (empty, $\uparrow$, $\downarrow$, both) and compare. For $d^4$–$d^7$ the lowest arrangement flips from high spin to low spin as $\Delta$ grows. Right: the measured $2p^2$ (carbon) and $2p^4$ (oxygen) levels from NIST obey rules 1–3.`,
      deps: ['qchem-3.7', 'qchem-3.6'],
      refs: ['McQuarrie ch. 9'],
      tags: ['Hund rules', 'high spin', 'term ordering'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hund%27s_rules' },
      viz(v) {
        const M = v.M;
        const nS = v.slider('number of $d$ electrons', 1, 9, 4, { int: true, onChange: () => { arr = best(); v.invalidate(); } });
        const dS = v.slider('crystal-field splitting $\\Delta$ (eV)', 0, 4, 1.0, { step: 0.05, onChange: () => { arr = best(); } });
        const kS = v.slider('exchange gain $K$ per parallel pair (eV)', 0, 1, 0.45, { step: 0.01, onChange: () => { arr = best(); } });
        const pS = v.slider('pairing cost $P$ (eV)', 0, 4, 2.0, { step: 0.05, onChange: () => { arr = best(); } });
        const el = v.select('measured atom', [{ value: 'C', label: 'carbon C I (2p²)' }, { value: 'O', label: 'oxygen O I (2p⁴)' }], 'C');
        const sD = v.stage({ x: [-0.8, 5.8], y: [-0.7, 5.4], axes: false, height: 380, weight: 1.15, title: 'model $d^n$ ion in an octahedral field' });
        const sN = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 380, weight: 1, xticks: [], ylabel: 'energy above the lowest level (cm⁻¹)', title: 'measured levels (NIST)' });
        const XS = [0, 1.1, 2.2, 3.9, 5.0];
        const eps = (o) => (o < 3 ? 0 : dS.value);
        const energy = (a) => { let e = 0, U = 0, D = 0, pr = 0; a.forEach((c, o) => { const up = c & 1, dn = (c >> 1) & 1; e += eps(o) * (up + dn); U += up; D += dn; if (c === 3) pr++; }); return e + pS.value * pr - kS.value * (U * (U - 1) / 2 + D * (D - 1) / 2); };
        const best = () => { const n = nS.value; let bE = 1e9, bA = null; for (let i = 0; i < 1024; i++) { const a = [i & 3, (i >> 2) & 3, (i >> 4) & 3, (i >> 6) & 3, (i >> 8) & 3]; const cnt = a.reduce((s, c) => s + (c & 1) + ((c >> 1) & 1), 0); if (cnt !== n) continue; const e = energy(a); if (e < bE - 1e-12) { bE = e; bA = a; } } return bA; };
        let arr = best();
        sD.onClick((x, y) => { let o = -1, bd = 0.7; XS.forEach((xx, i) => { if (Math.abs(x - xx - 0.45) < bd) { bd = Math.abs(x - xx - 0.45); o = i; } }); if (o >= 0) { arr = arr.slice(); arr[o] = (arr[o] + 1) % 4; } });
        const NIST = { C: { name: 'C I', terms: [['³P', 0, 'accent'], ['¹D', 10192.657, 'orange'], ['¹S', 21648.030, 'purple']], J: [[0, 0], [1, 16.4167], [2, 43.4135]], half: 'less than half full: lowest J = 0 lowest' },
          O: { name: 'O I', terms: [['³P', 0, 'accent'], ['¹D', 15867.862, 'orange'], ['¹S', 33792.583, 'purple']], J: [[2, 0], [1, 158.265], [0, 226.977]], half: 'more than half full: highest J = 2 lowest' } };
        let st = null;
        v.render(() => {
          const D = dS.value, a = arr, n = a.reduce((s, c) => s + (c & 1) + ((c >> 1) & 1), 0), E = energy(a), U = a.reduce((s, c) => s + (c & 1), 0), Dn = n - U;
          const yE = (e) => e * 0.95; const top = Math.max(1.5, D) * 0.95;
          sD.setView([-0.8, 6.0], [-0.9, top + 1.1]);
          a.forEach((c, o) => {
            const x = XS[o], y = eps(o) * 0.95 + 0.5, hi = o >= 3;
            sD.rect(x, y - 0.32, x + 0.9, y + 0.32, { color: c ? 'ink' : 'muted', fill: c ? 'accent' : false, fillAlpha: 0.1, width: c ? 1.8 : 1 });
            if (c & 1) sD.text('↑', x + 0.3, y, { size: 22, color: 'ink', align: 'center', baseline: 'middle' });
            if (c & 2) sD.text('↓', x + 0.63, y, { size: 22, color: 'ink', align: 'center', baseline: 'middle' });
            sD.text(o < 3 ? 't₂g' : 'eg', x + 0.45, y - 0.55, { size: 10, color: 'muted', align: 'center' });
          });
          sD.text(`Δ = ${v.fix(D, 2)} eV`, 3.35, 0.5 + 0.5 * D * 0.95, { size: 12, color: 'orange', align: 'right', baseline: 'middle' });
          sD.arrow(3.55, 0.5, 3.55, 0.5 + D * 0.95, { color: 'orange', both: true, head: 7 });
          const bb = best(), Eb = energy(bb);
          const key = (x) => x.join(',');
          st = { n, E, Eb, S: Math.abs(U - Dn) / 2, Sb: Math.abs(bb.reduce((s, c) => s + (c & 1) - ((c >> 1) & 1), 0)) / 2, same: Math.abs(E - Eb) < 1e-9, bb };
          // measured
          const d = NIST[el.value], ymax = d.terms[2][1] * 1.13;
          sN.setView([0, 4], [-ymax * 0.04, ymax]);
          d.terms.forEach(([nm, e, c]) => { sN.segment([0.3, e], [1.9, e], { color: c, width: 3.5 }); sN.text(`${nm}  ${v.fix(e, 0)}`, 2.0, e, { size: 12, baseline: 'middle', color: 'ink' }); });
          sN.text(d.name, 0.3, ymax * 0.96, { color: 'muted', size: 12 });
          // the J levels of 3P, magnified inset as text
          d.J.forEach(([j, e], i) => sN.text(`J = ${j}: ${v.fix(e, 1)} cm⁻¹`, 0.3, ymax * (0.2 - 0.05 * i), { size: 11, color: 'accent' }));
          sN.text('levels of ³P (rule 3):', 0.3, ymax * 0.26, { size: 11, color: 'muted' });
        });
        v.legend([['accent', 'occupied orbital (click to change)']]);
        v.readout(() => { if (!st) return ''; const d = NIST[el.value]; return `$d^{${st.n}}$: your arrangement has model energy ${v.fix(st.E, 2)} eV, total spin $S=${v.fix(st.S, 1)}$; lowest arrangement ${v.fix(st.Eb, 2)} eV with $S=${v.fix(st.Sb, 1)}$ ${st.same ? '— you have the ground arrangement' : `— yours is ${v.fix(st.E - st.Eb, 2)} eV higher`}.\nmeasured ${d.name}: $^3P$ (rule 1: triplet lowest) < $^1D$ < $^1S$ (rule 2: larger $L$ lower, $^1D$ before $^1S$); $^3P$ ${d.half} (rule 3). Energies from NIST ASD, 1 eV = ${v.fix(CM_EV, 0)} cm⁻¹.`; });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Phenomenon',
      name: 'Periodic trends in ionization energy and radius',
      statement: String.raw`Across a period the first ionization energy rises (with small dips) and the atomic radius falls; down a group the ionization energy falls and the radius grows. The saw-tooth of $I_1(Z)$ has a maximum at every noble gas and a minimum at every alkali metal, with two irregularities in each $p$ block: $I_1$ falls from the $ns^2$ element to the first $np$ element (Be to B, Mg to Al) and from the half-filled $np^3$ to $np^4$ (N to O, P to S).`,
      scope: String.raw`Neutral gas-phase atoms in their ground states; ionization energies are the NIST values (Z = 1–86). Radii are not uniquely defined: the figure uses Slater's empirical radii for atoms in crystals (J. Chem. Phys. 41, 3199, 1964, as tabulated on a Wikipedia data page; no value is listed for the noble gases), so only the trends, not the picometre values, carry meaning. The $d$ and $f$ blocks (slow, irregular changes) follow different rules from the $s$ and $p$ blocks.`,
      idea: String.raw`The ionization energy is set by the effective charge and the distance of the outermost electron (3.4): across a period each new electron enters the same shell and shields its neighbours by only about $0.35$, so $Z_{\rm eff}$ grows by about $0.65$ per element, the orbital shrinks and $I_1$ rises; the next period starts a new shell with a large step in $n$ and a drop in $I_1$. The dips are configuration effects: a $p$ electron lies above the $ns^2$ pair (3.5) and is screened by it, and the fourth $p$ electron must pair with another, losing the exchange stabilisation of three parallel spins (3.6, 3.8).`,
      caption: String.raw`Slide $Z$ or **click either plot** to place the cursor. Left: first ionization energy from NIST; right: the empirical radius or the Slater $Z_{\rm eff}$ of the outermost electron group. Dots are coloured by block. The readout gives the element's configuration and says which of the effects above the cursor is looking at: the alkali minima, the noble-gas maxima, the Be/B and N/O irregularities.`,
      deps: ['qchem-3.4', 'qchem-3.5'],
      refs: ['McQuarrie ch. 9'],
      tags: ['periodic trends', 'ionization energy', 'atomic radius'],
      links: { nist: 'https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html' },
      viz(v) {
        const M = v.M;
        const zS = v.slider('atomic number $Z$', 1, 86, 8, { int: true });
        const right = v.select('right panel', [{ value: 'r', label: 'atomic radius (Slater 1964)' }, { value: 'z', label: '$Z_{\\rm eff}$ of the outer electron (Slater rules)' }], 'r');
        const sI = v.stage({ x: [0, 87], y: [0, 26], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'atomic number Z', ylabel: 'first ionization energy (eV)', title: '$I_1(Z)$' });
        const sR = v.stage({ x: [0, 87], y: [0, 280], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'atomic number Z', ylabel: 'radius (pm)', title: 'radius' });
        const BC = { s: 'accent', p: 'green', d: 'orange', f: 'purple' };
        const ZEFF = Array.from({ length: 86 }, (_, i) => slaterZeff(i + 1));
        const pick = (x) => { zS.set(M.clamp(Math.round(x), 1, 86)); };
        sI.onClick((x) => pick(x)); sR.onClick((x) => pick(x));
        const note = (Z) => {
          const o = groundConfig(Z), n = outermost(Z).n, s = o[`${n}s`] || 0, p = o[`${n}p`] || 0, noble = [2, 10, 18, 36, 54, 86].includes(Z);
          if (Z === 1) return 'hydrogen: a single $1s$ electron sees the whole nuclear charge, yet $I_1$ is only the Rydberg energy 13.6 eV';
          if (noble) return 'noble gas: a filled shell and the largest $Z_{\\rm eff}$ of the period, so the maximum of $I_1$ and the smallest radius';
          if ([3, 11, 19, 37, 55].includes(Z)) return 'alkali metal: a single $s$ electron outside a noble-gas core, far out and well screened (about $Z_{\\rm eff}\\approx1$-2), so the minimum of $I_1$ and the largest radius';
          if (p === 1) return `first $${n}p$ electron: it lies above the filled $${n}s^2$ pair and is partly screened by it, so $I_1$ drops below the $${n}s^2$ neighbour`;
          if (p === 3) return `half-filled $${n}p^3$: three parallel spins in three orbitals (exchange, Hund), so $I_1$ is high for its place in the period`;
          if (p === 4) return `$${n}p^4$: the fourth $p$ electron pairs with another and is helped out by the repulsion, so $I_1$ dips below the $${n}p^3$ neighbour`;
          if (p >= 1) return `$${n}p^${p}$: across the $p$ block $Z_{\\rm eff}$ rises by about 0.65 per element, so $I_1$ rises and the radius falls`;
          if (s === 2 && Z % 18 !== 0 && (o[`${n - 1}d`] === 10 || Z <= 12 || Z === 4 || Z === 20 || Z === 38 || Z === 56 || Z === 88 || Z === 12)) return `closed $${n}s^2$: filled subshell, so $I_1$ is higher than for the alkali before it`;
          return 'transition or inner-transition element: electrons enter an inner $(n-1)d$ or $(n-2)f$ shell that shields the outer $s$ electrons only partly, so $I_1$ and the radius change slowly across the block';
        };
        let st = null;
        v.render(() => {
          const Z = zS.value;
          const ptsI = IE.map((e, i) => [i + 1, e]); sI.path(ptsI, { color: 'faint', width: 1.2 });
          IE.forEach((e, i) => sI.dot(i + 1, e, { r: i + 1 === Z ? 7 : 3.2, color: i + 1 === Z ? 'gold' : BC[blockOf(i + 1)] }));
          sI.vline(Z, { color: 'gold', alpha: 0.6 });
          [2, 10, 18, 36, 54, 86].forEach((z) => sI.text(SYM[z - 1], z, IE[z - 1] + 1.1, { size: 10, color: 'muted', align: 'center' }));
          [3, 11, 19, 37, 55].forEach((z) => sI.text(SYM[z - 1], z, IE[z - 1] - 1.4, { size: 10, color: 'muted', align: 'center' }));
          if (right.value === 'r') {
            sR.setView([0, 87], [0, 280]); sR.setLabels('atomic number Z', 'radius (pm)'); sR.setTitle('Slater empirical radius');
            let seg = []; const segs = [seg];
            RADIUS.forEach((r, i) => { if (r == null) { seg = []; segs.push(seg); } else seg.push([i + 1, r]); });
            segs.forEach((sg) => sg.length > 1 && sR.path(sg, { color: 'faint', width: 1.2 }));
            RADIUS.forEach((r, i) => { if (r != null) sR.dot(i + 1, r, { r: i + 1 === Z ? 7 : 3.2, color: i + 1 === Z ? 'gold' : BC[blockOf(i + 1)] }); });
          } else {
            sR.setView([0, 87], [0, 28]); sR.setLabels('atomic number Z', 'Z_eff = Z − s'); sR.setTitle('Slater effective charge of the outermost group');
            sR.path(ZEFF.map((z, i) => [i + 1, z]), { color: 'faint', width: 1.2 });
            ZEFF.forEach((z, i) => sR.dot(i + 1, z, { r: i + 1 === Z ? 7 : 3.2, color: i + 1 === Z ? 'gold' : BC[blockOf(i + 1)] }));
          }
          sR.vline(Z, { color: 'gold', alpha: 0.6 });
          st = { Z };
        });
        v.legend([['accent', 's block', { dot: true }], ['green', 'p block', { dot: true }], ['orange', 'd block', { dot: true }], ['purple', 'f block', { dot: true }]]);
        v.readout(() => { if (!st) return ''; const Z = st.Z, d = Z > 1 ? IE[Z - 1] - IE[Z - 2] : null; return `**${SYM[Z - 1]}** ($Z=${Z}$), ${configText(Z)}: $I_1=${v.fix(IE[Z - 1], 3)}$ eV` + (d != null ? ` (${d >= 0 ? '+' : '−'}${v.fix(Math.abs(d), 2)} eV from the previous element)` : '') + (RADIUS[Z - 1] ? `, Slater radius ${RADIUS[Z - 1]} pm` : ', no Slater radius listed') + `, Slater $Z_{\\rm eff}=${v.fix(ZEFF[Z - 1], 2)}$.\n${note(Z)}.`; });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Electronegativity (Mulliken and Pauling)',
      credit: 'Pauling, 1932; Mulliken, 1934',
      statement: String.raw`Electronegativity measures how strongly an atom in a molecule attracts bonding electrons. **Pauling** (1932) defined differences from bond energies: $|\chi_A-\chi_B|=(\mathrm{eV})^{-1/2}\sqrt{E_d(AB)-\tfrac12[E_d(AA)+E_d(BB)]}$, the excess of the $A$–$B$ bond energy over the mean of the homonuclear bonds, with $\chi_{\rm H}$ fixed by convention. **Mulliken** (1934) defined it for a single atom as the mean of the ionization energy and the electron affinity,
$$\chi_{\rm M}=\tfrac12\,(I+E_{\rm ea}),$$
the energy cost of giving an electron to the atom and the gain from taking one, averaged. With energies in eV the two scales are related by $\chi_{\rm P}\approx0.187\,(I+E_{\rm ea})+0.17$.`,
      scope: String.raw`The conversion above is an empirical relation (quoted from a secondary source), not an identity; Pauling values are conventional and tabulated here for $Z\le54$ (none for the noble gases except Kr, Xe). For the noble gases and several metals the electron affinity is negative or only estimated (open circles), and for the transition metals the Mulliken average is less meaningful because the ground-state configuration of the anion differs.`,
      idea: String.raw`A big ionization energy means the atom holds its own electrons tightly; a big electron affinity means it welcomes others, so both measure the same $Z_{\rm eff}/r$ pull (3.4, 3.9) and their mean should track bond polarity. Pauling's reasoning is thermochemical: if bonding were purely covalent the $A$–$B$ bond energy would be the mean of the $A$–$A$ and $B$–$B$ energies, and the extra energy comes from the partial charge transfer measured by $\Delta\chi^2$. That two such different definitions give almost the same ranking of the elements is the point of the figure.`,
      caption: String.raw`Left: each point is an element, with its Pauling value on the horizontal axis and the Mulliken average of NIST's $I$ and the measured (or estimated) $E_{\rm ea}$ on the vertical axis; the solid line is a least-squares fit to the points shown and the dashed line is the quoted conversion. Right: both scales (the Mulliken one converted) along the periodic table. Slide the two **atoms** to see the bond-polarity difference $|\Delta\chi|$ on both scales.`,
      deps: ['qchem-3.9'],
      refs: ['McQuarrie ch. 11'],
      tags: ['electronegativity', 'Pauling', 'Mulliken'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Electronegativity' },
      viz(v) {
        const M = v.M;
        const sub = v.select('elements shown', [{ value: 'main', label: 's and p block' }, { value: 'all', label: 'all, Z ≤ 54' }], 'main');
        const aS = v.slider('atom A (Z)', 1, 54, 11, { int: true }), bS = v.slider('atom B (Z)', 1, 54, 17, { int: true });
        const sS = v.stage({ x: [0.6, 4.2], y: [0, 14], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'Pauling χ', ylabel: 'Mulliken (I + E_ea)/2  (eV)', title: 'two definitions' });
        const sT = v.stage({ x: [0, 55], y: [0.5, 4.3], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'atomic number Z', ylabel: 'electronegativity (Pauling units)', title: 'along the table' });
        const mull = (Z) => (IE[Z - 1] + EA[Z - 1]) / 2;
        const conv = (Z) => 0.187 * (IE[Z - 1] + EA[Z - 1]) + 0.17;
        const BC = { s: 'accent', p: 'green', d: 'orange', f: 'purple' };
        let st = null;
        v.render(() => {
          const zs = []; for (let z = 1; z <= 54; z++) if (PAULING[z - 1] != null && (sub.value === 'all' || ['s', 'p'].includes(blockOf(z)))) zs.push(z);
          const xs = zs.map((z) => PAULING[z - 1]), ys = zs.map(mull), lr = M.linreg(xs, ys);
          sS.line(0.6, lr.predict(0.6), 4.2, lr.predict(4.2), { color: 'ink', width: 1.8 });
          sS.line(0.6, (0.6 - 0.17) / 0.374, 4.2, (4.2 - 0.17) / 0.374, { color: 'red', width: 1.6, dash: true });
          zs.forEach((z) => { const sel = z === aS.value || z === bS.value; sS.dot(PAULING[z - 1], mull(z), { r: sel ? 7 : 4, color: sel ? 'gold' : BC[blockOf(z)], hollow: EA_EST[z - 1], label: sel ? SYM[z - 1] : undefined, labelPos: 'ne' }); });
          // along the table
          for (let z = 1; z <= 54; z++) { if (PAULING[z - 1] == null) continue; sT.dot(z, PAULING[z - 1], { r: z === aS.value || z === bS.value ? 7 : 3.2, color: z === aS.value || z === bS.value ? 'gold' : 'accent' }); sT.dot(z, conv(z), { r: 3, color: 'orange', hollow: true }); }
          sT.path(Array.from({ length: 54 }, (_, i) => (PAULING[i] == null ? null : [i + 1, PAULING[i]])), { color: 'accent', width: 1.2, alpha: 0.5 });
          [2, 10, 18, 36].forEach((z) => sT.vline(z + 0.5, { color: 'faint' }));
          let rms = 0; zs.forEach((z) => { rms += (conv(z) - PAULING[z - 1]) ** 2; }); rms = Math.sqrt(rms / zs.length);
          st = { n: zs.length, r2: lr.r2, slope: lr.slope, icpt: lr.intercept, rms };
        });
        v.legend([['accent', 'Pauling (dots, line)'], ['orange', 'Mulliken converted: 0.187(I+E_ea)+0.17', { dot: true, hollow: true }], ['ink', 'least-squares fit'], ['red', 'quoted conversion', { dash: true }]]);
        v.readout(() => { if (!st) return ''; const A = aS.value, B = bS.value, pa = PAULING[A - 1], pb = PAULING[B - 1]; const dP = pa != null && pb != null ? Math.abs(pa - pb) : null, dM = Math.abs(conv(A) - conv(B)); return `${st.n} elements: linear fit $\\chi_{\\rm M}=${v.fix(st.slope, 2)}\\chi_{\\rm P}${st.icpt < 0 ? '-' : '+'}${v.fix(Math.abs(st.icpt), 2)}$ eV with $r^2=${v.fix(st.r2, 3)}$; the quoted conversion differs from Pauling's values by ${v.fix(st.rms, 2)} rms.\n${SYM[A - 1]}–${SYM[B - 1]}: $|\\Delta\\chi|$ = ${dP != null ? v.fix(dP, 2) : 'n/a'} (Pauling), ${v.fix(dM, 2)} (Mulliken, converted)${EA_EST[A - 1] || EA_EST[B - 1] ? ' — one of these atoms has an estimated or negative electron affinity' : ''}.`; });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Paradox',
      name: 'Anomalous configurations of chromium and copper',
      statement: String.raw`The Madelung rule (3.5) predicts $[\mathrm{Ar}]\,3d^4\,4s^2$ for chromium and $[\mathrm{Ar}]\,3d^9\,4s^2$ for copper, but the measured ground configurations are $[\mathrm{Ar}]\,3d^5\,4s^1$ and $[\mathrm{Ar}]\,3d^{10}\,4s^1$ (NIST: $^7S_3$ and $^2S_{1/2}$). The predicted configurations exist as excited states: the lowest level of $3d^44s^2$ in Cr lies $7750.7\ \mathrm{cm^{-1}}$ ($0.961$ eV) above the ground level, and the lowest level of $3d^94s^2$ in Cu lies $11202.6\ \mathrm{cm^{-1}}$ ($1.389$ eV) above. All the other elements from Sc to Zn do follow $3d^{k}4s^2$.`,
      scope: String.raw`The paradox is about the ground state of the neutral atoms. In the toy model of the figure $d$-electron repulsion and exchange are treated as constants per pair; this reproduces the pattern only in a narrow window of parameters, and it does not pretend to compute the energies. The usual textbook explanation (a half-filled or filled $d$ shell is specially stable) is a bookkeeping device, not a derivation; accurate calculations are what settle each case (the same 4d/5d irregularities occur for Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au).`,
      idea: String.raw`The $3d$ and $4s$ orbitals are close in energy (3.5), so the question is the total energy of two configurations that differ by moving one electron: it contains the orbital energy difference, the change in repulsion (more repulsion among compact $3d$ electrons than between $3d$ and $4s$ or within $4s$), and the exchange gain (3.6) that grows with the number of parallel spins in the $3d$ shell. Writing these as $\varepsilon$, a Coulomb term per pair and $-K$ per parallel pair, the energy difference between $3d^k4s^2$ and $3d^{k+1}4s$ is the one-line function plotted: it rises with $k$ by $K-u$ for $k=1\dots4$, falls at the half-filled shell where $K$ stops accumulating, and rises again, so only $k=4$ and $k=9$ can change sign — as Cr and Cu do.`,
      caption: String.raw`The map scores the model: for each pair (exchange gain $K$, orbital offset $C$) it counts how many of the nine configurations $3d^{k}4s^2\to3d^{k+1}4s$ ($k=1\dots9$, Sc to Cu) it gets right against NIST (dark = all nine; only Cr and Cu change). Drag the point; the bars show the model energy $E(3d^k4s^2)-E(3d^{k+1}4s)$ in eV, positive meaning the anomalous configuration wins. Gold dots mark the measured excitation energies of the Madelung configurations for Cr and Cu. Slide $u=U_{dd}-U_{ds}$ and try to hit both measured numbers at once.`,
      deps: ['qchem-3.5', 'qchem-3.8'],
      refs: ['McQuarrie ch. 9'],
      tags: ['chromium', 'copper', 'exceptions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Aufbau_principle' },
      viz(v) {
        const M = v.M;
        const uS = v.slider('$u=U_{dd}-U_{ds}$ (eV)', 0.02, 0.4, 0.1, { step: 0.005 });
        const sM = v.stage({ x: [0, 1.5], y: [-4, 1], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'exchange gain K per parallel pair (eV)', ylabel: 'offset C = ε_s − ε_d + U_ss − U_ds (eV)', title: 'how many of the nine does the model get right?' });
        const sB = v.stage({ x: [0.3, 9.7], y: [-3.5, 3.5], axes: 'box', gutter: true, height: 360, weight: 1.1, xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => [k, ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu'][k - 1]]), ylabel: 'E(3d^k 4s²) − E(3d^(k+1) 4s)  (eV)', title: 'energy difference by element' });
        const h = sM.handle(0.8, -2.2, { color: 'accent', r: 8, constrain: { x: [0, 1.5], y: [-4, 1] } });
        const dKp = (k) => (k <= 4 ? k : k === 5 ? 0 : k - 5);
        const dE = (k, K, C, u) => C - k * u + dKp(k) * K;
        const EXPA = (k) => k === 4 || k === 9;
        const score = (K, C, u) => { let n = 0; for (let k = 1; k <= 9; k++) if (dE(k, K, C, u) > 0 === EXPA(k)) n++; return n; };
        let st = null;
        v.render(() => {
          const u = uS.value, K = h.x, C = h.y;
          sM.heat((x, y) => score(x, y, u), { range: [5, 9], cmap: 'theme', color: 'green', res: 4, key: `u${u.toFixed(4)}` });
          sM.hline(0, { color: 'faint' });
          sM.dot(K, C, { r: 8, color: 'gold' });
          for (let k = 1; k <= 9; k++) { const e = dE(k, K, C, u), ok = e > 0 === EXPA(k); sB.rect(k - 0.35, 0, k + 0.35, e, { fill: ok ? 'green' : 'red', fillAlpha: 0.5, color: ok ? 'green' : 'red' }); }
          sB.hline(0, { color: 'ink' });
          sB.dot(4, 7750.7465 / CM_EV, { r: 6, color: 'gold' }); sB.dot(9, 11202.618 / CM_EV, { r: 6, color: 'gold' });
          sB.text('measured 0.961', 4.15, 7750.7465 / CM_EV + 0.3, { size: 11, color: 'muted', align: 'left' }); sB.text('measured 1.389', 8.85, 11202.618 / CM_EV + 0.3, { size: 11, color: 'muted', align: 'right' });
          st = { n: score(K, C, u), eCr: dE(4, K, C, u), eCu: dE(9, K, C, u), K, C, u };
        });
        v.legend([['green', 'agrees with experiment'], ['red', 'disagrees'], ['gold', 'measured excitation energy (NIST)', { dot: true }]]);
        v.readout(() => st && `$K=${v.fix(st.K, 2)}$, $C=${v.fix(st.C, 2)}$, $u=${v.fix(st.u, 3)}$ eV: the model gets **${st.n}/9** configurations right (Madelung's rule alone gets 7/9).\nCr: model ${v.fix(st.eCr, 2)} eV, measured ${v.fix(7750.7465 / CM_EV, 3)} eV; Cu: model ${v.fix(st.eCu, 2)} eV, measured ${v.fix(11202.618 / CM_EV, 3)} eV. In this model the Cu gap is always ${v.fix(5 * st.u, 2)} eV *below* Cr's ($=5u$), but the measured one is larger by 0.43 eV: constant pair parameters cannot capture it.`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Phenomenon',
      name: 'Relativistic effects: the colour of gold',
      credit: 'Pyykkö and Desclaux, 1979',
      statement: String.raw`In a heavy atom the inner electrons move at a sizeable fraction of the speed of light (for a $1s$ electron $v/c\approx Z\alpha$, about $0.58$ for $Z=79$), so the Dirac equation must replace the Schrödinger equation. The $s$ orbitals (and, less, $p$) contract and are stabilised, while $d$ and $f$ orbitals expand because they are better screened. For hydrogen-like ions the Dirac ground state has the radial density $P(r)\propto r^{2\gamma}e^{-2Zr/a_0}$ with $\gamma=\sqrt{1-(Z\alpha)^2}$, so $\langle r\rangle_{1s}=\dfrac{2\gamma+1}{3}\,\langle r\rangle_{\rm nonrel}$. In gold the relativistic contraction of $6s$ narrows the $5d\to6s$ gap so that absorption moves from the ultraviolet (silver, onset about $3.9$ eV) into the blue (gold, about $2.4$–$2.5$ eV), and a metal that would be silvery is yellow.`,
      scope: String.raw`The exact Dirac formula applies to one-electron ions; it illustrates the size of the effect but is not the $6s$ contraction of the real gold atom, which arises indirectly through orthogonality to contracted inner $s$ shells and which I did not compute. The reflectance model in the lower panel is a step in $R(E)$ at the absorption edge, converted to a colour by simple spectral averaging: it shows why an edge position gives a colour, not colorimetrically exact colours. The edge energies are the values reported in the sources below.`,
      idea: String.raw`The relativistic mass increase $m=\gamma m_e$ of a fast $1s$ electron shrinks the Bohr radius, and every $s$ orbital must be orthogonal to the contracted inner ones (the 2.1 radial equation), so the whole $s$ (and $p$) family contracts and drops in energy; the $d$ electrons, shielded better by the contracted core, rise. Pyykkö and Desclaux's 1979 survey of the periodic system showed these effects peak around gold and platinum. Relativity-free calculations by Romaniello and de Boeij (2005, time-dependent density-functional theory) put the onset of gold's interband absorption near 3.5 eV, against about 1.9 eV with relativity included in the same method (itself lower than the 2.4 eV seen in experiment because of the approximation).`,
      caption: String.raw`Top left: the exact $1s$ radial density of a hydrogen-like ion for the group-11 nuclei, with the speed of light slid from infinite (**relativity strength 0**) to the real value (1): the peak moves in and the energy falls. Top right: the reflectance of a metal with an absorption edge at the position of the gold handle, and below it the colour that results for silver (3.9 eV), gold as measured (2.4 eV), and gold as calculated without (3.5 eV) and with relativity (1.9 eV). Drag the edge: above about 3 eV the metal looks colourless, near 2.4 eV yellow, near 1.9 eV reddish.`,
      deps: ['qchem-2.8', 'qchem-3.9'],
      refs: ['McQuarrie ch. 9'],
      tags: ['relativity', 'gold', 'colour'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Relativistic_quantum_chemistry' },
      viz(v) {
        const M = v.M, ALPHA = 1 / 137.035999;
        const el = v.select('nucleus', [{ value: '29', label: 'Cu (Z = 29)' }, { value: '47', label: 'Ag (Z = 47)' }, { value: '79', label: 'Au (Z = 79)' }], '79');
        const rS = v.slider('relativity strength ($c\\to c/\\sqrt{\\rho}$ , $\\rho$)', 0, 1.2, 1, { step: 0.01 });
        const sP = v.stage({ x: [0, 0.2], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'r / a₀', ylabel: 'radial density P(r)', title: '$1s$ of a hydrogen-like ion, Dirac vs Schrödinger' });
        const sR = v.stage({ x: [1.2, 4.6], y: [0, 1.1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'photon energy (eV)', ylabel: 'reflectance', title: 'a metal with an absorption edge' });
        const sC = v.stage({ x: [0, 5], y: [0, 1], axes: false, height: 150, full: true, title: 'the colour that results' });
        const hE = sR.handle(2.4, 0.2, { color: 'gold', r: 8, constrain: { x: [1.3, 4.5], y: [0.2, 0.2] }, label: 'edge' });
        const gam = (Z, rho) => Math.sqrt(Math.max(1e-6, 1 - (Z * Z * ALPHA * ALPHA * rho)));
        const lg = (x) => (x > 300 ? 1e300 : Math.exp(x));
        const Rfun = (E, Ed) => 0.97 - 0.62 / (1 + Math.exp(-(E - Ed) / 0.12));
        const colorFor = (Ed) => { let sr = 0, sg = 0, sb = 0, wr = 0, wg = 0, wb = 0; for (let nm = 400; nm <= 700; nm += 5) { const c = M.wavelengthRGB(nm), E = 1239.84198 / nm, R = Rfun(E, Ed); sr += R * c[0]; sg += R * c[1]; sb += R * c[2]; wr += c[0]; wg += c[1]; wb += c[2]; } return [Math.round(Math.min(255, (255 * sr) / wr)), Math.round(Math.min(255, (255 * sg) / wg)), Math.round(Math.min(255, (255 * sb) / wb))]; };
        let st = null;
        v.render(() => {
          const Z = +el.value, rho = rS.value, g = gam(Z, rho), g0 = 1;
          const P = (gg) => (r) => { const lp = (2 * gg + 1) * Math.log(2 * Z) - M.lgamma(2 * gg + 1) + 2 * gg * Math.log(Math.max(r, 1e-12)) - 2 * Z * r; return Math.exp(lp); };
          const rm = 3 / (2 * Z), xr = rm * 3.2, pk = Math.max(P(1)(1 / Z), P(g)((2 * g) / (2 * Z)));
          sP.setView([0, xr], [0, pk * 1.18]);
          sP.fn(P(1), { color: 'muted', width: 2, dash: true, n: 400 });
          sP.fn(P(g), { color: 'accent', width: 2.4, n: 400, fill: 'accent', fillAlpha: 0.12 });
          const r0 = 3 / (2 * Z), r1 = (2 * g + 1) / (2 * Z);
          sP.vline(r0, { color: 'muted', dash: true }); sP.vline(r1, { color: 'accent', dash: true });
          // reflectance
          const Ed = hE.x;
          sR.fn((E) => Rfun(E, Ed), { color: 'ink', width: 2.2, n: 300 });
          sR.vband(1.5936, 3.1, { color: 'faint', alpha: 0.07 });
          [[3.9, 'Ag', 'muted'], [2.4, 'Au', 'orange'], [3.5, 'Au calc., no relativity', 'red'], [1.9, 'Au calc., relativistic', 'purple']].forEach(([e, , c], i) => sR.vline(e, { color: c, dash: true, alpha: 0.55 }));
          // swatches
          const sw = [['silver', 3.9], ['gold (measured)', 2.4], ['gold, no relativity', 3.5], ['gold, relativistic calc.', 1.9], ['your edge', Ed]];
          sw.forEach(([nm, e], i) => { const x0 = i + 0.04; sC.rect(x0, 0.28, x0 + 0.92, 0.95, { fill: colorFor(e), fillAlpha: 1, color: 'faint' }); sC.text(`${nm} · ${v.fix(e, 1)} eV`, x0 + 0.46, 0.14, { size: 11, color: 'ink', align: 'center', baseline: 'middle' }); });
          const E1 = (gg) => (gg - 1) / (ALPHA * ALPHA);
          st = { Z, rho, g, ratio: (2 * g + 1) / 3, vc: Z * ALPHA * Math.sqrt(rho), dE: E1(g) / (-Z * Z / 2) , Ed };
        });
        v.legend([['muted', 'Schrödinger (c → ∞)', { dash: true }], ['accent', 'Dirac with the chosen c']]);
        v.readout(() => st && `Z = ${st.Z}: $Z\\alpha=${v.fix(st.Z * ALPHA, 3)}$ (Bohr-model $v/c$ of $1s$ at ρ = 1: ${v.fix(100 * st.Z * ALPHA, 0)} %), ρ = ${v.fix(st.rho, 2)}: $\\gamma=${v.fix(st.g, 4)}$; $\\langle r\\rangle$ shrinks to **${v.fix(100 * st.ratio, 1)} %** of the non-relativistic value and the $1s$ binding energy $-(\\gamma-1)/\\alpha^2$ is **${v.fix(st.dE, 3)}×** the non-relativistic $Z^2/2$.\nedge at ${v.fix(st.Ed, 2)} eV ≙ ${v.fix(1239.84198 / st.Ed, 0)} nm. Edge values: Ag ≈ 3.9 and Au ≈ 2.4–2.5 eV (experiment, interband onset); Au 3.5 eV without and 1.9 eV with relativity (Romaniello & de Boeij 2005, TDDFT with the local-density approximation).`);
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'Properties and atomic weights of the elements',
      paper: { authors: 'D. Mendeleev', year: 1869, title: 'Соотношение свойств с атомным весом элементов (The relation of the properties to the atomic weights of the elements)', venue: 'Zhurnal Russkago Khimicheskago Obshchestva 1: 60–77', url: 'https://babel.hathitrust.org/cgi/pt?id=mdp.39015065536586&seq=70' },
      introduces: [],
      credit: 'D. Mendeleev, 1869',
      statement: String.raw`Mendeleev (1869) arranged the 63 elements then known by atomic weight and chemical similarity and observed that, in this order, properties recur periodically: the families headed by lithium, beryllium, boron, carbon, nitrogen, oxygen and fluorine follow each other, and after each family-by-family sequence of seven the pattern begins again. He concluded that the properties of the elements are a periodic function of their atomic weights, that some weights should be corrected, and that gaps in his table indicate undiscovered elements, of which he marked three near atomic weights 45, 68 and 70.`,
      scope: String.raw`The table drawn here is the one printed in the German abstract of the paper (Zeitschrift für Chemie 12, 405–406, 1869), as transcribed and translated by Carmen Giunta; I did not see the Russian original, so whether the Russian paper's table is identical in every number is not checked. Atomic weights are his 1869 values (hydrogen = 1), several of them wrong (for instance uranium as 116) and some marked "?" by him. The three "gaps" are interpolations by me, not Mendeleev's calculation; his own 1871 predictions were more detailed (masses 44, 68 and 72 for eka-boron, eka-aluminium and eka-silicon).`,
      idea: String.raw`Before 1869 chemists had grouped elements by valence and by families of similar properties (triads, and later attempts at “octaves”), but a complete ordering by weight did not exist. Mendeleev wrote the elements on cards, ordered them by weight, and found the same valence sequence returning; where weight order disagreed with chemistry (tellurium, 128?, before iodine, 127) he trusted the chemistry, and where no known element fitted he left a blank. The recurrence is explained a half-century later by the filling of electron shells (3.5): the periodic function is of atomic number, not weight, and its period lengths 2, 8, 8, 18, 18, 32 are the subshell capacities.`,
      caption: String.raw`The upper panel lists the elements of Mendeleev's 1869 table in order of atomic weight, wrapped at each alkali metal (Li, Na, K, Rb, Cs), coloured by the family (column of his table) and with the elements he queried drawn hollow. The lower panel plots the family number 1–7 against atomic weight. Slide the **weight cut-off** to reveal the table progressively and watch the cycle of 7 return; switch on **fill the gaps** to place the interpolated weights of $\,?{=}45,\ ?{=}68,\ ?{=}70$ and compare with scandium, gallium and germanium. The data are those of the printed table, copied by hand.`,
      deps: ['qchem-3.9'],
      refs: [],
      tags: ['Mendeleev', 'periodic law', 'history'],
      verify: true,
      links: { giunta: 'https://web.lemoyne.edu/GIUNTA/EA/MENDELEEVann.HTML', wikipedia: 'https://en.wikipedia.org/wiki/Mendeleev%27s_predicted_elements' },
      viz(v) {
        // Mendeleev's 1869 table, family = column number of the Li…F series (0: other rows). w: printed weight; q: printed with '?'; gap: unnamed '?'.
        const E = [
          ['H', 1, 0], ['Li', 7, 1], ['Be', 9.4, 2], ['B', 11, 3], ['C', 12, 4], ['N', 14, 5], ['O', 16, 6], ['F', 19, 7], ['Na', 23, 1], ['Mg', 24, 2], ['Al', 27.4, 3], ['Si', 28, 4], ['P', 31, 5], ['S', 32, 6], ['Cl', 35.5, 7],
          ['K', 39, 1], ['Ca', 40, 2], ['Ti', 50, 9], ['V', 51, 9], ['Cr', 52, 9], ['Mn', 55, 9], ['Fe', 56, 9], ['Ni', 59, 9], ['Co', 59, 9], ['Cu', 63.4, 0], ['Zn', 65.2, 2], ['As', 75, 5], ['Se', 79.4, 6], ['Br', 80, 7],
          ['Rb', 85.4, 1], ['Sr', 87.6, 2], ['Zr', 90, 9], ['Nb', 94, 9], ['Mo', 96, 9], ['Rh', 104.4, 9], ['Ru', 104.4, 9], ['Pd', 106.6, 9], ['Ag', 108, 0], ['Cd', 112, 2], ['Ur', 116, 3], ['Sn', 118, 4], ['Sb', 122, 5], ['Te', 128, 6, 1], ['J', 127, 7],
          ['Cs', 133, 1], ['Ba', 137, 2], ['Ta', 182, 9], ['W', 186, 9], ['Pt', 197.4, 9], ['Ir', 198, 9], ['Os', 199, 9], ['Hg', 200, 0], ['Au', 197, 3, 1], ['Bi', 210, 5, 1], ['Tl', 204, 1], ['Pb', 207, 2],
          ['Ce', 92, 8], ['La', 94, 8], ['Di', 95, 8], ['Th', 118, 8, 1], ['Er', 56, 8, 1], ['Yt', 60, 8, 1], ['In', 75.6, 8, 1],
        ].map(([sym, w, fam, q]) => ({ sym, w, fam, q: !!q }));
        const GAPS = [{ sym: '?', w: 45, fam: 3, gap: true, id: 0, name: 'Sc', modern: 44.956, who: 'Nilson, 1879' }, { sym: '?', w: 68, fam: 3, gap: true, id: 1, name: 'Ga', modern: 69.723, who: 'Lecoq de Boisbaudran, 1875' }, { sym: '?', w: 70, fam: 4, gap: true, id: 2, name: 'Ge', modern: 72.630, who: '1886' }, { sym: '?', w: 180, fam: 9, gap: true, id: 3, name: null }];
        const known = E.filter((e) => e.fam >= 1 && e.fam <= 7 || e.fam === 9 || e.fam === 0 || e.fam === 8).sort((a, b) => a.w - b.w);
        // interpolated predictions: gaps ?68, ?70 spaced evenly between Zn 65.2 and As 75; ?45 between Ca 40 and Ti 50
        const pred = { 0: (40 + 50) / 2, 1: 65.2 + (75 - 65.2) / 3, 2: 65.2 + (2 * (75 - 65.2)) / 3 };
        const cut = v.slider('weight cut-off (hydrogen = 1)', 10, 210, 210, { step: 1 });
        const fill = v.toggle('fill the gaps with interpolated weights', false);
        const sT = v.stage({ x: [0, 20], y: [-6.1, 0.2], axes: false, height: 400, full: true, title: 'the elements in order of atomic weight, wrapped at each alkali metal' });
        const sF = v.stage({ x: [0, 215], y: [0, 8], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'atomic weight (1869)', ylabel: 'family 1 … 7 (Li, Be, B, C, N, O, F)', title: 'periodic recurrence' });
        const FC = [null, 'red', 'orange', 'gold', 'green', 'teal', 'accent', 'purple'];
        let st = null;
        v.render(() => {
          const W = cut.value, f = fill.value;
          const all = [...E.filter((e) => e.fam !== 9 || true), ...GAPS].sort((a, b) => a.w - b.w);
          // rows start at each alkali metal
          const starts = ['Li', 'Na', 'K', 'Rb', 'Cs']; let row = 0; const rows = [[]]; // row 0: H
          all.forEach((e) => { if (e.w > W) return; if (starts.includes(e.sym)) { row++; rows[row] = []; } rows[row].push(e); });
          rows.forEach((r, ri) => r.forEach((e, ci) => {
            const gp = e.gap, fam = e.fam, col = gp ? 'ink' : FC[fam] || 'muted', hollow = gp || e.q;
            const shown = !gp || f;
            if (!gp || true) sT.rect(ci + 0.04, -ri - 0.92, ci + 0.96, -ri - 0.04, { color: gp ? (f ? 'gold' : 'faint') : col, fill: hollow ? false : col, fillAlpha: hollow ? 0 : 0.35, width: gp ? 1.8 : 1.1, dash: hollow ? true : undefined });
            sT.text(gp ? '?' : e.sym, ci + 0.5, -ri - 0.38, { size: 12, align: 'center', baseline: 'middle', color: 'ink' });
            const wtxt = gp && f && pred[e.id] != null ? `${v.fix(pred[e.id], 1)}` : gp ? `${e.w}` : `${e.w}${e.q ? '?' : ''}`;
            sT.text(wtxt, ci + 0.5, -ri - 0.72, { size: 9, align: 'center', baseline: 'middle', color: gp && f ? 'gold' : 'muted' });
          }));
          // family plot: main families only
          sF.setView([0, 215], [0, 8]);
          const fam = known.filter((e) => e.fam >= 1 && e.fam <= 7 && e.w <= W);
          sF.path(fam.map((e) => [e.w, e.fam]), { color: 'faint', width: 1.2 });
          fam.forEach((e) => { sF.dot(e.w, e.fam, { r: 4.5, color: FC[e.fam], hollow: e.q }); if (e.fam === 1 || e.sym === 'F' || e.sym === 'J') sF.text(e.sym, e.w, e.fam + (e.fam === 1 ? -0.55 : 0.55), { size: 10, color: 'muted', align: 'center' }); });
          GAPS.filter((g) => g.id < 3 && g.w <= W).forEach((g) => { sF.dot(f ? pred[g.id] : g.w, g.fam, { r: 6, color: f ? 'gold' : 'faint', hollow: true }); sF.text(f ? `${g.name} ${v.fix(pred[g.id], 1)}` : '?', (f ? pred[g.id] : g.w), g.fam + (g.id === 0 ? 0.6 : g.id === 1 ? -0.7 : 0.7), { size: 10, color: f ? 'ink' : 'muted', align: 'center' });});
          st = { n: all.filter((e) => e.w <= W && !e.gap).length };
        });
        v.legend([['red', 'Li family (1)', { dot: true }], ['orange', 'Be (2)', { dot: true }], ['gold', 'B (3)', { dot: true }], ['green', 'C (4)', { dot: true }], ['teal', 'N (5)', { dot: true }], ['accent', 'O (6)', { dot: true }], ['purple', 'F (7)', { dot: true }]]);
        v.readout(() => { if (!st) return ''; const al = known.filter((e) => e.fam === 1 && e.sym !== 'Tl').map((e) => e.w), dl = al.slice(1).map((w, i) => w - al[i]); return `${st.n} of the 63 elements of the table shown (dashed outline: entries Mendeleev printed with a “?”, a doubtful weight or a doubtful element; ? alone: a gap).\nweights of the alkali metals Li, Na, K, Rb, Cs: ${al.join(', ')}; successive differences ${dl.map((d) => v.fix(d, 1)).join(', ')}: the recurrence interval is about 16 for the first two periods and about 47 afterwards.` + (fill.value ? `\ngaps: $?{=}45\\to${v.fix(pred[0], 1)}$ (modern scandium 44.956, found by Nilson 1879), $?{=}68\\to${v.fix(pred[1], 1)}$ (gallium 69.723, Lecoq de Boisbaudran 1875), $?{=}70\\to${v.fix(pred[2], 1)}$ (germanium 72.630, 1886); Mendeleev's printed values were 45, 68, 70.` : '\nswitch on “fill the gaps” to interpolate the weights of the unknown elements.'); });
      },
    },
  ],
};
