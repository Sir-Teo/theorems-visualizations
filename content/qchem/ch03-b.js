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
  ],
};
