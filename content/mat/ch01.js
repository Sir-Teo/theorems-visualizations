// Materials Science — Chapter 1: Bonding, structure and properties
import {
  KB, NA, EV_NN, EV_A3_GPA, placeLabels, ELEMENTS, EL, OTHERS, MELT, CLASSES, CLASS_POT, POT, bondGeometry, logFit,
  cubicS, youngDir, polyAverage, CRYSTALS, inLattice, planeNet, dirNet,
} from './ch01.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** Coordination number used to turn a cohesive energy into an effective pair-bond energy ε = 2E_coh/z. */
const zOf = (e) => (e.cls === 'ionic' ? 6 : e.cls === 'vdw' ? 12 : bondGeometry(e).z);

export default {
  collection: 'mat',
  chapter: 1,
  title: 'Bonding, structure and properties',
  summary: String.raw`Materials science links how atoms bond and pack to what a material does. The shape of the interatomic potential sets stiffness, melting point and thermal expansion; crystal structure and its polymorphs set density and anisotropy; and comparing whole classes of materials on property charts turns selection into a design method.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Bond-energy curves and bonding types',
      statement: String.raw`Two atoms (or ions) a distance $r$ apart have an interaction energy $U(r)$ that is the sum of a short-range **repulsion** (overlapping electron clouds, the Pauli principle) and a longer-range **attraction**. Their sum has a minimum $-\varepsilon$ at the equilibrium separation $r_0$: the **bond length** is $r_0$, the **bond energy** is $\varepsilon$, and the force $F=-U'(r)$ vanishes there. The origin of the attraction sorts solids into four limiting bond types: **ionic** (Coulomb attraction between opposite charges, long range), **covalent** (shared electron pairs, short range and directional), **metallic** (a shared electron gas, non-directional) and **secondary** (fluctuating dipoles, hydrogen bonds), which are roughly a hundred times weaker. Added over a crystal, the pair bonds give a cohesive energy per atom $E_{\rm coh}\approx \tfrac z2\,\varepsilon$ with $z$ neighbours, and the measured melting temperature follows $E_{\rm coh}$: for metals, ionic and covalent solids $E_{\rm coh}/k_BT_m\approx 30$.`,
      idea: String.raw`Every chemical bond has the same anatomy, repulsion plus attraction, but the attraction differs: $1/r$ for Coulomb forces (ionic), a saturating exchange term for a shared pair (covalent, modelled by a Morse curve), a smeared-out electron-gas term (metallic, the Rose curve), and $-1/r^6$ dispersion (van der Waals, the Lennard-Jones $12$-$6$ curve). A deeper well means more energy needed to pull the atoms apart, so strongly bonded solids sublime, boil and melt at high temperature; the shallow well of argon melts at 84 K and the deep well of tungsten at 3695 K. The chart plots measured cohesive energies against melting points on log axes, the bonds of a class cluster on one line, and the secondary bonds sit on a lower line because their wells are very soft and quantum effects matter.`,
      caption: String.raw`Click a material on the right (or step with the buttons): the left panel shows the shape of its pair potential, normalised by the well depth, with the thermal energy $k_BT_m$ at its melting point shaded above the bottom of the well. Pick a class to compare shapes: the ionic curve has a long Coulomb tail, the covalent one is narrow, the van der Waals one shallow in absolute terms. The dashed guides are lines of constant $E_{\rm coh}/k_BT_m$.`,
      deps: ['qchem-5.2'],
      refs: ['Callister §2.5', 'Callister §2.6'],
      tags: ['bonding', 'potentials', 'melting'],
      scope: String.raw`The pair-potential shapes are idealised class representatives (their widths are illustrative); the depths $E_{\rm coh}$ and the melting points are measured. The effective pair energy $\varepsilon=2E_{\rm coh}/z$ is bookkeeping: in metals and covalent solids the bonds are many-body.`,
      viz(v) {
        const cls = ['vdw', 'ionic', 'covalent', 'metal'];
        let sel = MELT.findIndex((e) => e.sym === 'Cu');
        const flt = v.select('show', [{ value: 'all', label: 'all' }, ...cls.map((c) => ({ value: c, label: CLASSES[c].name }))], 'all');
        const inList = () => MELT.map((e, i) => i).filter((i) => flt.value === 'all' || MELT[i].cls === flt.value);
        const step = (d) => { const L = inList(); const k = L.indexOf(sel); sel = L[(Math.max(k, 0) + d + L.length) % L.length]; };
        v.button('◀ previous', () => step(-1));
        v.button('next ▶', () => step(1));
        const sP = v.stage({ x: [0.8, 2.6], y: [-1.25, 1.0], axes: 'box', gutter: true, height: 440, weight: 1, xlabel: 'bond length  r / r₀', ylabel: 'U(r) / ε', title: 'pair potential, reduced by its well depth' });
        const sM = v.stage({ x: [0.014, 14], y: [18, 6500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 440, weight: 1.6, xlabel: 'cohesive energy per atom  $E_{\\rm coh}$ (eV)', ylabel: 'melting point  $T_m$ (K)', title: 'measured: bond energy against melting point' });
        sM.onClick((x, y) => {
          let best = -1, bd = 0.2;
          MELT.forEach((e, i) => { if (flt.value !== 'all' && e.cls !== flt.value) return; const d = Math.hypot(Math.log10(x / e.ecoh), Math.log10(y / e.tm)); if (d < bd) { bd = d; best = i; } });
          if (best >= 0) sel = best;
        });
        const KEEP = new Set(['Li', 'K', 'Pb', 'Zn', 'Al', 'Cu', 'Fe', 'Mo', 'W', 'Ir']);
        const ratio = (e) => e.ecoh / (KB * e.tm);
        const med = Object.fromEntries(cls.map((c) => [c, median(MELT.filter((e) => e.cls === c).map(ratio))]));
        v.render(() => {
          const e = MELT[sel], c = e.cls, eps = (2 * e.ecoh) / zOf(e), kT = (KB * e.tm) / eps;
          sP.hband(-1, -1 + kT, { color: 'gold', alpha: 0.22, edges: false });
          sP.tex(String.raw`k_BT_m=${kT.toFixed(2)}\,\varepsilon`, 2.5, -1 + kT / 2, { size: 13, color: 'ink', align: 'right' });
          sP.hline(0, { color: 'faint' });
          for (const k of cls) sP.fn(CLASS_POT[k].f, { domain: [k === 'metal' ? 0.82 : 0.8, 2.6], color: CLASSES[k].color, width: k === c ? 3.4 : 1.6, alpha: k === c ? 1 : 0.5 });
          sP.vline(1, { color: 'faint', dash: true });
          sP.dot(1, -1, { r: 5, color: CLASSES[c].color });
          sP.text(CLASS_POT[c].label, 2.57, 0.8, { size: 12, color: CLASSES[c].color, align: 'right', weight: 600 });
          sP.text('r₀', 1.0, 0.62, { size: 11, color: 'muted', align: 'center' });
          sP.text('−ε', 0.84, -1.0, { size: 11, color: 'muted', align: 'left', baseline: 'middle', dy: 10 });
          // measured chart
          for (const R of [30, 12]) sM.fn((x) => x / (KB * R), { color: 'muted', dash: [5, 4], width: 1.2, alpha: 0.7 });
          const items = [];
          MELT.forEach((m, i) => {
            const on = flt.value === 'all' || m.cls === flt.value, isSel = i === sel;
            sM.dot(m.ecoh, m.tm, { r: isSel ? 8 : 5, color: CLASSES[m.cls].color, hollow: !on && false, ring: isSel });
            const show = isSel || (flt.value === 'all' ? m.cls !== 'metal' || KEEP.has(m.sym) : on);
            if (show) items.push({ x: m.ecoh, y: m.tm, text: m.sym, r: isSel ? 8 : 5, size: isSel ? 13 : 10, weight: isSel ? 700 : 500, color: isSel ? CLASSES[m.cls].color : 'ink' });
          });
          items.sort((p, q) => (q.weight === 700) - (p.weight === 700));
          placeLabels(v, sM, items);
          v.legend([...cls.map((k) => [CLASSES[k].color, CLASSES[k].name]), ['muted', '$E_{\\rm coh}=30\\,k_BT_m$', { dash: [5, 4] }], ['muted', '$E_{\\rm coh}=12\\,k_BT_m$', { dash: [5, 4] }]]);
        });
        v.readout(() => {
          const e = MELT[sel], eps = (2 * e.ecoh) / zOf(e);
          return `**${e.sym}** (${e.name}; ${CLASSES[e.cls].name}, ${e.st}): $E_{\\rm coh}=${v.fix(e.ecoh, e.ecoh < 0.1 ? 3 : 2)}$ eV/atom → effective pair-bond energy $\\varepsilon = 2E_{\\rm coh}/z = ${v.fix(eps, eps < 0.1 ? 3 : 2)}$ eV ($z=${zOf(e)}$). It melts at ${v.fmt(e.tm, 4)} K, i.e. $k_BT_m=${v.fix(KB * e.tm, 3)}$ eV and $E_{\\rm coh}/k_BT_m=${v.fix(e.ecoh / (KB * e.tm), 1)}$ (median of its class ${v.fix(med[e.cls], 1)}).\nAcross the chart, a tenfold deeper well means ${v.fix(10 ** logFit(MELT.map((m) => m.ecoh), MELT.map((m) => m.tm)).slope, 1)} times higher melting point (fitted log–log slope ${v.fix(logFit(MELT.map((m) => m.ecoh), MELT.map((m) => m.tm)).slope, 2)}, $r=${v.fix(logFit(MELT.map((m) => m.ecoh), MELT.map((m) => m.tm)).r, 2)}$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Proposition',
      name: 'Elastic modulus from bond stiffness',
      statement: String.raw`Near equilibrium a bond is a spring. Expanding the pair potential about its minimum, $U(r)=-\varepsilon+\tfrac12 k\,(r-r_0)^2+\dots$, the force is Hooke's law, $F=-k\,(r-r_0)$, with **bond stiffness** $k=U''(r_0)$ (the curvature of the well). A chain of $n$ identical bonds under tension $F$ stretches by $\Delta=nF/k$, so the strain is $e=\Delta/(nr_0)$ and the stress per bond cross-section $r_0^2$ is $\sigma=F/r_0^2$: Young's modulus is of order $E\approx k/r_0$. Deeper and narrower wells (large $k$) give stiffer solids; at larger strain the potential departs from the parabola and the force-extension curve bends over, peaks at $F_{\max}$ and the bond fails.`,
      idea: String.raw`Hooke's law is not an extra postulate: it is the first term of the Taylor series of any smooth potential at its minimum, where $U'(r_0)=0$. For the Morse potential $U=\varepsilon[(1-e^{-a(r-r_0)})^2-1]$ the curvature is $k=2a^2\varepsilon$, so the stiffness grows with the well depth and with the square of its sharpness $a r_0=\beta$; the force peaks at $F_{\max}=a\varepsilon/2$ where the potential has its inflection. The same argument links the modulus to the cohesive energy density: in a crystal $\varepsilon$ is the energy per bond, and $E\sim E_{\rm coh}/\Omega$ ($\Omega$ the atomic volume) up to a factor of order one to a few, which is why tungsten (8.9 eV in a small volume) is stiff and lead (2.0 eV in a large volume) is soft.`,
      caption: String.raw`**Drag the gold atom** to pull the chain. The bar of the potential in the middle panel shows where the bonds sit on the well: for small strain they follow the dashed parabola (Hooke), then flatten. Beyond the force peak the chain cannot stretch evenly: one bond opens while the others relax, and the force falls. Choose a material (its depth and bond length come from the data), or change $\varepsilon$, $r_0$, $\beta$ yourself. The bottom chart tests the idea on 29 elements.`,
      deps: ['mat-1.1', 'qchem-5.2'],
      refs: ['Callister §6.3', 'Callister §2.5'],
      tags: ['stiffness', 'Hooke', 'potentials'],
      scope: String.raw`$E\approx k/r_0$ counts one bond per $r_0^2$ of cross-section (a simple-cubic estimate with central forces), so it is an order-of-magnitude link, not a prediction: covalent solids with bond-bending forces and close-packed metals deviate by factors of two or more. Modelled bond: Morse, with an illustrative width $\beta$.`,
      credit: 'Morse, 1929',
      viz(v) {
        const n = 7;
        const preset = (sym) => { const e = EL[sym], g = bondGeometry(e); return { eps: (2 * e.ecoh) / g.z, r0: g.r0, E: e.E, name: e.name }; };
        const PRE = ['Pb', 'Cu', 'Fe', 'W', 'C'];
        let eps, r0, beta;
        const mat = v.select('material', PRE.map((s) => ({ value: s, label: s === 'C' ? 'C (diamond)' : s })), 'Cu', { onChange: () => apply() });
        function apply() { const p = preset(mat.value); eps.set(p.eps); r0.set(p.r0); }
        eps = v.slider('well depth ε (eV)', 0.05, 8, preset('Cu').eps, { log: true, decimals: 2 });
        r0 = v.slider('bond length r₀ (Å)', 1.4, 4.6, preset('Cu').r0, { step: 0.01 });
        beta = v.slider('sharpness β = a·r₀', 2, 8, 4, { step: 0.1 });
        const s1 = v.stage({ x: [-1.3, 13.3], y: [-1.5, 1.5], axes: false, height: 175, full: true, title: 'a chain of 8 atoms, distances in units of r₀: drag the gold atom' });
        const H = s1.handle(n, 0, { color: 'gold', r: 9, label: 'pull', labelPos: 'n', constrain: (x) => [clamp(x, n - 0.6, 12.8), 0] });
        const sU = v.stage({ x: [0.75, 3.0], y: [-1.5, 0.8], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'bond length  r / r₀', ylabel: 'U / ε', title: 'where the bonds sit on the well' });
        const sF = v.stage({ x: [0, 0.6], y: [-0.05, 1.3], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'chain strain  e = Δ / (n r₀)', ylabel: 'tension F (nN)', title: 'force against extension' });
        const sE = v.stage({ x: [0.8, 500], y: [2, 2000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, full: true, xlabel: 'cohesive energy density  $E_{\\rm coh}/\\Omega$  (GPa)', ylabel: 'Young’s modulus E (GPa, polycrystal)', title: 'real elements: stiffness follows bond-energy density' });
        // chain mechanics in reduced units: ξ = r/r₀ − 1, f = F / F_max = 4u(1−u), u = e^{−βξ}
        const fOf = (xi, b) => { const u = Math.exp(-b * xi); return 4 * u * (1 - u); };
        function chain(D, b) {
          const xs = Math.LN2 / b, Du = n * xs;
          if (D <= Du) { const xi = D / n; return { loc: false, xi1: xi, xi2: xi, f: fOf(xi, b) }; }
          const g = (f) => { const s = Math.sqrt(1 - f); return (n - 1) * (-Math.log((1 + s) / 2) / b) + (-Math.log((1 - s) / 2) / b); };
          // g(f) first dips below n·ξ* as f falls from 1 (the snap), then rises: take the root on the rising side
          let fm = 1, gm = g(1); for (let i = 1; i <= 400; i++) { const f = 1 - i / 400.001; const gv = g(f); if (gv < gm) { gm = gv; fm = f; } }
          let lo = 1e-9, hi = fm;
          if (g(lo) < D) return { loc: true, xi1: 0, xi2: 9, f: 0, broken: true };
          for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (g(mid) > D) lo = mid; else hi = mid; }
          const f = (lo + hi) / 2, s = Math.sqrt(1 - f);
          return { loc: true, xi1: -Math.log((1 + s) / 2) / b, xi2: -Math.log((1 - s) / 2) / b, f, broken: f < 0.01 };
        }
        const fit = logFit(ELEMENTS.map((e) => e.ecoh / bondGeometry(e).omega * EV_A3_GPA), ELEMENTS.map((e) => e.E));
        v.render(() => {
          const b = beta.value, ep = eps.value, R0 = r0.value, D = H.x - n, st = chain(D, b);
          const Fmax = (ep * b) / (2 * R0) * EV_NN;
          // chain
          s1.line(-0.6, -0.9, -0.6, 0.9, { color: 'ink', width: 3 });
          for (let y = -0.9; y < 0.9; y += 0.3) s1.line(-0.6, y, -0.9, y - 0.25, { color: 'muted', width: 1 });
          const xsAt = [0]; for (let i = 0; i < n; i++) xsAt.push(xsAt[i] + 1 + (st.loc && i === 3 ? st.xi2 : st.xi1));
          for (let i = 0; i < n; i++) {
            const isGap = st.loc && i === 3, tens = st.f;
            const col = st.broken && isGap ? 'red' : tens >= 0 ? v.ramp(clamp(Math.abs(tens), 0, 1) * (isGap ? 1 : 1), 'red', 'accent') : v.ramp(clamp(-tens, 0, 1), 'blue', 'accent');
            s1.line(xsAt[i], 0, xsAt[i + 1], 0, { color: col, width: isGap ? 3 : 5, dash: st.broken && isGap ? [4, 5] : undefined });
          }
          xsAt.forEach((x, i) => { if (i < n) s1.dot(x, 0, { r: 10, color: 'accent' }); });
          H.set(xsAt[n], 0);
          s1.corner(`F = ${v.fix(st.f * Fmax, 2)} nN${st.loc ? (st.broken ? '  (bond broken)' : '  (one bond has opened)') : ''}`, 'tl', { size: 12, color: 'ink' });
          // potential
          const xr = (x) => x;
          sU.hline(0, { color: 'faint' });
          sU.fn((x) => POT.morse(x, b), { color: 'accent', width: 2.6, domain: [0.78, 3.0] });
          sU.fn((x) => -1 + b * b * (x - 1) ** 2, { color: 'orange', dash: [6, 4], width: 1.6, domain: [0.78, 1 + 1.9 / b + 0.6] });
          sU.vline(1 + Math.LN2 / b, { color: 'faint', dash: true });
          sU.text('inflection: F peaks', 1 + Math.LN2 / b + 0.03, 0.6, { size: 11, color: 'muted', align: 'left' });
          const x1 = 1 + st.xi1, x2 = 1 + st.xi2;
          sU.dot(xr(x1), POT.morse(x1, b), { r: 8, color: 'gold', label: st.loc ? `${n - 1} bonds` : `all ${n} bonds`, labelPos: 's' });
          if (st.loc) sU.dot(xr(Math.min(x2, 2.95)), POT.morse(Math.min(x2, 2.95), b), { r: 8, color: 'red', label: '1 bond', labelPos: 'n' });
          sU.text('Hooke parabola', 1.5, 0.55, { size: 11, color: 'orange', align: 'left' });
          // force-extension
          sF.setView([0, 0.6], [-0.08 * Fmax, 1.3 * Fmax]);
          sF.hline(0, { color: 'faint' });
          const curve = []; for (let i = 0; i <= 240; i++) { const e = (0.6 * i) / 240; curve.push([e, chain(e * n, b).f * Fmax]); }
          sF.path(curve, { color: 'accent', width: 2.8 });
          sF.line(0, 0, 0.6, 4 * b * 0.6 * Fmax, { color: 'orange', dash: [6, 4], width: 1.6 });
          sF.text('Hooke: slope k·r₀', 1.18 / (4 * b) + 0.006, 1.2 * Fmax, { size: 11, color: 'orange', align: 'left' });
          sF.dot(D / n, st.f * Fmax, { r: 8, color: 'gold' });
          sF.hline(Fmax, { color: 'faint', dash: true });
          sF.text(`F_max = ${v.fix(Fmax, 2)} nN`, 0.598, Fmax * 1.07, { size: 11, color: 'muted', align: 'right' });
          // data
          const items = [];
          for (const e of ELEMENTS) {
            const x = (e.ecoh / bondGeometry(e).omega) * EV_A3_GPA, sym = PRE.includes(e.sym) && e.sym === mat.value;
            sE.dot(x, e.E, { r: sym ? 8 : 4.5, color: sym ? 'gold' : CLASSES[e.cls].color, ring: sym });
            items.push({ x, y: e.E, text: e.sym, r: sym ? 8 : 4.5, size: sym ? 13 : 10, weight: sym ? 700 : 500, color: sym ? 'ink' : 'ink' });
          }
          sE.fn((x) => fit.at(x), { color: 'muted', width: 1.4, dash: [6, 4] });
          sE.fn((x) => 3.2 * x, { color: 'faint', width: 1.2, dash: [2, 3] });
          placeLabels(v, sE, items.sort((p, q) => (q.weight === 700) - (p.weight === 700)));
          v.legend([[CLASSES.metal.color, 'metals'], [CLASSES.covalent.color, 'covalent (Si, Ge, C)'], ['gold', 'selected'], ['muted', 'fitted power law', { dash: [6, 4] }], ['faint', '$E=3E_{\\rm coh}/\\Omega$', { dash: [2, 3] }]]);
        });
        v.readout(() => {
          const b = beta.value, ep = eps.value, R0 = r0.value, D = H.x - n, st = chain(D, b);
          const k = (2 * b * b * ep) / (R0 * R0), kN = k * 16.02177, Eest = (k / R0) * EV_A3_GPA, p = preset(mat.value);
          const same = Math.abs(ep / p.eps - 1) < 0.02 && Math.abs(R0 / p.r0 - 1) < 0.02;
          const h = 1e-4, slope = (chain(D + h, b).f - chain(D - h, b).f) / (2 * h) / ((4 * b) / n);
          const est = (sym) => { const q = preset(sym); return `${sym} ${v.fmt((2 * b * b * q.eps) / (q.r0 ** 3) * EV_A3_GPA, 2)}`; };
          return `Bond stiffness $k=U''(r_0)=2\\beta^2\\varepsilon/r_0^2=${v.fmt(kN, 3)}$ N/m → chain estimate $E\\approx k/r_0=${v.fmt(Eest, 3)}$ GPa${same ? `; measured ${p.name}: ${p.E} GPa (ratio ${v.fix(Eest / p.E, 1)})` : ' (custom parameters)'}. Local stiffness at this strain = ${v.fix(slope, 2)} × Hooke's. For $\\beta=${v.fix(b, 1)}$ the estimates for Pb, Cu, Fe, W, C are ${['Pb', 'Cu', 'Fe', 'W', 'C'].map(est).join(', ')} GPa: the ordering of the measured moduli is reproduced.\nFit over 29 elements: $E\\propto(E_{\\rm coh}/\\Omega)^{${v.fix(fit.slope, 2)}}$, $r=${v.fix(fit.r, 2)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Phenomenon',
      name: 'Thermal expansion from anharmonicity',
      statement: String.raw`Atoms in a solid vibrate about their equilibrium positions. If the potential were exactly parabolic the vibrations would be symmetric and the mean bond length would not change with temperature: **a harmonic crystal does not expand**. Real bonds are steep on the compressed side and gentle on the stretched side, $U=\tfrac12 k\xi^2-g\xi^3+\dots$ with $\xi=r-r_0$, so vibrations of larger amplitude spend more time at larger $r$ and the mean separation grows: $\langle \xi\rangle\simeq 3gk_BT/k^2$. The **linear expansion coefficient** $\alpha=\tfrac1{r_0}\,d\langle r\rangle/dT$ is therefore proportional to the cubic asymmetry $g/k^2$ and, for a Morse bond, inversely proportional to the well depth, $\alpha\simeq 3k_B/(4\beta\varepsilon)$. Strongly bonded (high-melting) materials expand least.`,
      idea: String.raw`The thermal average $\langle r\rangle=\int r\,e^{-U/k_BT}dr\big/\int e^{-U/k_BT}dr$ is the centre of the Boltzmann distribution, which is skewed to large $r$ when the well is asymmetric. Expanding $U$ to cubic order gives the shift $3gk_BT/k^2$ above; the quartic term adds a correction that grows with $T$, so $\alpha$ rises with temperature as the shallow outer wall is explored. The same asymmetry sets the melting trend of (1.1): a deep well delays the large excursions that unbind the lattice, so $\alpha\,T_m\approx 0.02$ is almost the same for all metals, and the thermal expansion of a crystal is the observable face of anharmonicity.`,
      caption: String.raw`The left panel shows the bond potential with the Boltzmann distribution of bond lengths (orange) and its mean (gold) against the minimum (dashed): drag the temperature up and the mean slides outward for the Morse and Lennard-Jones bonds, while the harmonic bond (choose it) stays put. *New snapshot* draws instantaneous bond lengths from that distribution. The middle panel is $\langle r\rangle(T)$ computed by numerical integration; the right panel tests the Morse prediction $\alpha\simeq3k_B/4\beta\varepsilon$ against measured coefficients of 27 elements.`,
      deps: ['mat-1.1', 'qchem-5.12', 'cm-3.9'],
      refs: ['Callister §19.3'],
      tags: ['anharmonicity', 'thermal expansion'],
      scope: String.raw`Classical statistical mechanics of one bond (valid above the Debye temperature, where quantum zero-point effects are small); a bond is counted as intact while $U<-\varepsilon/2$. Real crystal expansion also involves many-body anharmonicity, so the one-bond prediction is accurate to a factor of about two.`,
      viz(v) {
        const PRE = ['Pb', 'Al', 'Cu', 'Fe', 'W'];
        const preset = (sym) => { const e = EL[sym], g = bondGeometry(e); return { eps: (2 * e.ecoh) / g.z, r0: g.r0, tm: e.tm, alpha: e.alpha, z: g.z }; };
        let T;
        const pot = v.select('bond', [{ value: 'morse', label: 'Morse (asymmetric)' }, { value: 'lj', label: 'Lennard-Jones 12–6' }, { value: 'harm', label: 'harmonic (symmetric)' }], 'morse');
        const mat = v.select('material', PRE.map((s) => ({ value: s, label: s })), 'Cu', { onChange: () => T.set(Math.round(0.7 * preset(mat.value).tm)) });
        const beta = v.slider('sharpness β', 2, 8, 4, { step: 0.1 });
        T = v.slider('temperature T (K)', 5, 3600, 950, { step: 5 });
        let snap = 1;
        v.button('new snapshot', () => { snap++; });
        const sB = v.stage({ x: [0.7, 1.6], y: [-1.2, 0.4], axes: 'box', gutter: true, height: 380, weight: 1.15, xlabel: 'bond length r (Å)', ylabel: 'U (eV)', title: 'one bond: potential and thermal distribution' });
        const sT = v.stage({ x: [0, 1400], y: [-0.5, 4], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'temperature T (K)', ylabel: '(⟨r⟩ − r₀) / r₀  (%)', title: 'mean bond length against temperature' });
        const sA = v.stage({ x: [3, 150], y: [3, 150], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'one-bond prediction  α (10⁻⁶ K⁻¹)', ylabel: 'measured α (10⁻⁶ K⁻¹)', title: 'elements: prediction against measurement' });
        const Vof = (x) => (pot.value === 'morse' ? POT.morse(x, beta.value) : pot.value === 'lj' ? POT.lj(x) : -1 + beta.value ** 2 * (x - 1) ** 2);
        const beff = () => (pot.value === 'morse' ? beta.value : pot.value === 'lj' ? 3 / (4 * 0.1458) : Infinity);
        function dom() {
          if (pot.value === 'harm') return [0.1, 1.9];
          let hi = 1; while (Vof(hi) < -0.5 && hi < 6) hi += 0.002;
          return [pot.value === 'lj' ? 0.7 : 0.6, hi];
        }
        const meanX = (tau) => {
          const [lo, hi] = dom(), N = 600, h = (hi - lo) / N; let z = 0, m = 0;
          for (let i = 0; i <= N; i++) { const x = lo + i * h, w = (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * Math.exp(-(Vof(x) + 1) / tau); z += w; m += w * x; }
          return m / z;
        };
        const sampler = (tau) => {
          const [lo, hi] = dom(), N = 500, xs = [], cdf = []; let acc = 0;
          for (let i = 0; i <= N; i++) { const x = lo + ((hi - lo) * i) / N; acc += Math.exp(-(Vof(x) + 1) / tau); xs.push(x); cdf.push(acc); }
          return { xs, cdf: cdf.map((c) => c / acc) };
        };
        v.render(() => {
          const p = preset(mat.value), eps = p.eps, R0 = p.r0, tau = (KB * T.value) / eps, [lo, hi] = dom();
          beta.el.hidden = pot.value === 'lj';
          const Tm = p.tm;
          sB.setView([0.72 * R0, 1.6 * R0], [-1.2 * eps, 0.4 * eps]);
          sB.hline(0, { color: 'faint' });
          // Boltzmann hump
          const pk = Math.exp(0), humpH = 0.62 * eps; let mx = 0; const hump = [];
          for (let i = 0; i <= 220; i++) { const x = lo + ((hi - lo) * i) / 220, w = Math.exp(-(Vof(x) + 1) / tau); mx = Math.max(mx, w); hump.push([x, w]); }
          sB.path([[lo * R0, -eps], ...hump.map(([x, w]) => [x * R0, -eps + (humpH * w) / mx]), [hi * R0, -eps]], { close: true, fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.4 });
          sB.fn((r) => eps * Vof(r / R0), { color: 'accent', width: 2.8, domain: [0.72 * R0, 1.6 * R0] });
          const m = meanX(tau);
          sB.vline(R0, { color: 'muted', dash: true });
          sB.vline(m * R0, { color: 'gold', width: 2.6 });
          sB.hline(-eps + KB * T.value, { color: 'red', dash: [3, 4], width: 1.2, alpha: 0.7 });
          sB.text('r₀', R0 - 0.01 * R0, 0.28 * eps, { size: 12, color: 'muted', align: 'right' });
          sB.text('⟨r⟩', m * R0 + 0.01 * R0, 0.28 * eps, { size: 12, color: 'gold', align: 'left', weight: 700 });
          sB.tex(String.raw`k_BT\text{ above the well bottom}`, 1.58 * R0, -eps + KB * T.value - 0.07 * eps, { size: 12, color: 'red', align: 'right' });
          const S = sampler(tau), rng = v.rng(100 + snap);
          for (let i = 0; i < 26; i++) { const u = rng(); let j = S.cdf.findIndex((c) => c >= u); if (j < 0) j = S.cdf.length - 1; const x = S.xs[j]; sB.dot(x * R0, eps * Vof(x), { r: 4.2, color: 'gold', ring: false }); }
          // mean vs T
          const Tmax = Math.min(3600, Math.max(1400, 1.12 * Tm));
          sT.setView([0, Tmax], [-0.4, 3.6]);
          sT.hline(0, { color: 'faint' });
          const curve = [], c0 = []; for (let i = 0; i <= 50; i++) { const t = (Tmax * i) / 50; curve.push([t, (meanX((KB * t) / eps) - 1) * 100]); }
          sT.path(curve, { color: pot.value === 'harm' ? 'muted' : 'accent', width: 2.8 });
          if (pot.value !== 'harm') sT.fn((t) => (100 * 3 * ((KB * t) / eps)) / (4 * beff()), { color: 'orange', dash: [5, 4], width: 1.4 });
          if (pot.value !== 'harm') sT.tex(String.raw`\text{dashed: leading order }3k_BT/4\beta\varepsilon`, Tmax * 0.97, 0.45, { size: 12, color: 'orange', align: 'right' });
          sT.vline(Tm, { color: 'faint', dash: true });
          sT.text(`${mat.value} melts`, Tm - 0.01 * Tmax, 3.3, { size: 11, color: 'muted', align: 'right' });
          sT.dot(T.value, (m - 1) * 100, { r: 8, color: 'gold' });
          // data scatter
          const items = [];
          if (pot.value === 'harm') sA.text('harmonic bond: α = 0 for every material', Math.sqrt(3 * 150), Math.sqrt(3 * 150), { size: 13, color: 'muted', align: 'center' });
          else {
            const pts = ELEMENTS.filter((e) => e.alpha);
            const pred = (e) => ((3 * KB) / (4 * beff() * ((2 * e.ecoh) / zOf(e)))) * 1e6;
            sA.fn((x) => x, { color: 'muted', dash: [6, 4], width: 1.3 });
            sA.fn((x) => x / 2, { color: 'faint', dash: [2, 3], width: 1.1 });
            sA.text('measured = prediction', 120, 105, { size: 10.5, color: 'muted', align: 'right' });
            sA.text('half', 125, 54, { size: 10.5, color: 'faint', align: 'right' });
            for (const e of pts) { const sym = e.sym === mat.value; sA.dot(pred(e), e.alpha, { r: sym ? 8 : 4.5, color: sym ? 'gold' : CLASSES[e.cls].color, ring: sym }); items.push({ x: pred(e), y: e.alpha, text: e.sym, r: sym ? 8 : 4.5, size: sym ? 13 : 10, weight: sym ? 700 : 500 }); }
            placeLabels(v, sA, items);
          }
        });
        v.readout(() => {
          const p = preset(mat.value), eps = p.eps, tau = (KB * T.value) / eps, m = meanX(tau), dT = 20;
          const a1d = ((meanX((KB * (T.value + dT)) / eps) - meanX((KB * Math.max(T.value - dT, 1)) / eps)) / (2 * dT)) * 1e6;
          const pts = ELEMENTS.filter((e) => e.alpha), pr = (e) => ((3 * KB) / (4 * beff() * ((2 * e.ecoh) / zOf(e)))) * 1e6;
          const fit = pot.value === 'harm' ? null : logFit(pts.map(pr), pts.map((e) => e.alpha));
          return `**${mat.value}**: $\\varepsilon=${v.fix(eps, 2)}$ eV, $r_0=${v.fix(p.r0, 2)}$ Å, $T_m=${v.fmt(p.tm, 4)}$ K. At $T=${v.fmt(T.value, 4)}$ K ($k_BT=${v.fix(KB * T.value, 3)}$ eV $=${v.fix(tau, 3)}\\,\\varepsilon$): $\\langle r\\rangle-r_0=${v.fix((m - 1) * p.r0, 3)}$ Å $=${v.fix((m - 1) * 100, 2)}\\%$ of $r_0$ → one-bond $\\alpha=${v.fix(Math.abs(a1d) < 0.05 ? 0 : a1d, 1)}\\times10^{-6}$ K$^{-1}$; measured ${p.alpha} (20 °C).\n${fit ? `Over the elements the one-bond prediction and the measurement correlate with $r=${v.fix(fit.r, 2)}$ on log axes (median measured/predicted $=${v.fix(median(pts.map((e) => e.alpha / pr(e))), 2)}$); harmonic wells would give exactly 0.` : 'The mean bond length stays exactly at $r_0$ at every temperature.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'Polymorphism and allotropy of iron',
      statement: String.raw`Many elements and compounds can crystallise in more than one structure, called **polymorphs** (allotropes for an element), each stable in its own range of temperature and pressure. At atmospheric pressure iron is body-centred cubic (bcc, ferrite, $\alpha$) below $912{}^\circ$C, face-centred cubic (fcc, austenite, $\gamma$) from $912$ to $1394{}^\circ$C, and bcc again ($\delta$) up to its melting point at $1538{}^\circ$C. At each transformation the atoms rearrange abruptly, so the density and the length of a heated bar change in a step on top of the smooth thermal expansion: heating through $912{}^\circ$C **shortens** the bar by about $0.3\,\%$, because the fcc arrangement uses the volume more efficiently (packing fraction $0.74$ against $0.68$). The magnetic change at the Curie temperature ($771{}^\circ$C) is not a change of structure and gives no step.`,
      idea: String.raw`At fixed temperature the structure with the lowest Gibbs energy wins, and the free energies of bcc and fcc iron cross at $912{}^\circ$C: fcc has a higher entropy and a smaller volume per atom. Dilatometry measures the sum of two effects: the smooth expansion of the lattice, $\alpha\approx14\times10^{-6}\,{\rm K^{-1}}$ for bcc and $23\times10^{-6}\,{\rm K^{-1}}$ for fcc, and the discontinuity in atomic volume at the transition. Because the length of a bar scales as the cube root of the atomic volume, the step in length is about one third of the step in volume. The model curve is built from the measured lattice parameters of the two phases.`,
      caption: String.raw`Drag the temperature (or use the buttons) and watch the cell change between bcc and fcc while the dilatometer trace grows. The coloured bands mark the three stability ranges; the gold dot sits at the current temperature. Note the step down at $912{}^\circ$C, the much smaller step at $1394{}^\circ$C, and no step at the Curie point.`,
      deps: ['xtal-1.6'],
      refs: ['Callister §3.6'],
      tags: ['allotropy', 'iron', 'dilatometry'],
      scope: String.raw`Pure iron at atmospheric pressure, slow heating. The lattice parameters are interpolated linearly between measured values ($a_\alpha=2.8665$ Å at $20{}^\circ$C and $2.9033$ Å at $912{}^\circ$C; $a_\gamma=3.6306(1+23.0\times10^{-6}(T-1000\,{\rm K}))$ Å from a measured value at 1000 K). The $\delta$ phase is modelled by extending the $\alpha$ line (an assumption).`,
      viz(v) {
        const A0 = 2.8665, A912 = 2.9033, TA = 912, TG = 1394, TM = 1538, TC = 771, MFe = 55.845;
        const aAlpha = (T) => A0 + ((A912 - A0) * (T - 20)) / (TA - 20);
        const aGamma = (T) => 3.6306 * (1 + 23.0e-6 * (T + 273.15 - 1000));
        const phase = (T) => (T < TA ? 'α' : T < TG ? 'γ' : 'δ');
        const vat = (T) => { const p = phase(T); return p === 'γ' ? aGamma(T) ** 3 / 4 : aAlpha(T) ** 3 / 2; };
        const V0 = vat(20);
        const dL = (T) => (Math.cbrt(vat(T) / V0) - 1) * 100;
        const aOf = (T) => (phase(T) === 'γ' ? aGamma(T) : aAlpha(T));
        const T = v.slider('temperature (°C)', 20, 1535, 600, { step: 1 });
        v.button('→ 912 °C', () => T.set(TA - 1)); v.button('just above 912', () => T.set(TA + 1));
        v.button('just above 1394', () => T.set(TG + 1)); v.button('Curie 771', () => T.set(TC));
        const S = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 330, weight: 0.9, minWidth: 280, title: 'the unit cell (hard-sphere view; contact lines in red)' });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.32, axes: false, hint: false });
        const D = v.stage({ x: [0, 1600], y: [-0.2, 2.5], axes: 'box', gutter: true, height: 330, weight: 1.5, xlabel: 'temperature (°C)', ylabel: 'length change ΔL/L₀ (%)', title: 'dilatometer trace, heating' });
        const rng = v.rng(7), jit = Array.from({ length: 15 }, () => [rng.normal(), rng.normal(), rng.normal()]);
        v.render(() => {
          const t = T.value, ph = phase(t), a = aOf(t), fcc = ph === 'γ';
          const px = Math.abs(S.X(1) - S.X(0)), E = 0.7, amp = 0.05 * Math.sqrt((t + 273) / 1000);
          const corners = []; for (const x of [-E, E]) for (const y of [-E, E]) for (const z of [-E, E]) corners.push([x, y, z]);
          const pts = [...corners];
          if (fcc) for (const [i, s] of [[0, -1], [0, 1], [1, -1], [1, 1], [2, -1], [2, 1]]) { const p = [0, 0, 0]; p[i] = s * E; pts.push(p); } else pts.push([0, 0, 0]);
          sc.begin();
          for (const x of [-E, E]) for (const y of [-E, E]) { sc.line([x, y, -E], [x, y, E], { color: 'muted', width: 1.2 }); sc.line([x, -E, y], [x, E, y], { color: 'muted', width: 1.2 }); sc.line([-E, x, y], [E, x, y], { color: 'muted', width: 1.2 }); }
          const col = fcc ? 'orange' : 'accent';
          if (fcc) { sc.line([-E, -E, 0], [E, E, 0], { color: 'red', width: 2.2 }, 2); sc.line([-E, E, 0], [E, -E, 0], { color: 'red', width: 2.2 }, 2); } else sc.line([-E, -E, -E], [E, E, E], { color: 'red', width: 2.2 }, 2);
          const rc = (fcc ? Math.SQRT2 / 4 : Math.sqrt(3) / 4) * 2 * E * 1.0; // contact radius in drawing units
          pts.forEach((p, i) => sc.dot(p.map((c, k) => c + amp * 0.35 * jit[i][k]), { r: Math.max(5, rc * px * 0.3), color: col }));
          sc.flush();
          S.corner(`${ph}-Fe: ${fcc ? 'fcc' : 'bcc'}, a = ${a.toFixed(4)} Å`, 'tl', { size: 12, color: col, weight: 700 });
          // dilatometer
          D.vband(0, TA, { color: 'blue', alpha: 0.07 }); D.vband(TA, TG, { color: 'orange', alpha: 0.1 }); D.vband(TG, TM, { color: 'blue', alpha: 0.07 });
          D.text('α  bcc', 450, 2.3, { size: 12, color: 'accent', align: 'center', weight: 700 }); D.text('γ  fcc', 1153, 2.3, { size: 12, color: 'orange', align: 'center', weight: 700 }); D.text('δ  bcc', 1466, 2.3, { size: 12, color: 'accent', align: 'center', weight: 700 });
          D.fn(dL, { domain: [20, TA - 0.01], color: 'accent', width: 2.8 }); D.fn(dL, { domain: [TA + 0.01, TG - 0.01], color: 'orange', width: 2.8 }); D.fn(dL, { domain: [TG + 0.01, TM], color: 'accent', width: 2.8 });
          D.line(TA, dL(TA - 0.01), TA, dL(TA + 0.01), { color: 'red', width: 2 }); D.line(TG, dL(TG - 0.01), TG, dL(TG + 0.01), { color: 'red', width: 2 });
          D.vline(TC, { color: 'muted', dash: [4, 4] }); D.text('Curie 771 °C: no step', TC - 12, 1.9, { size: 11, color: 'muted', align: 'right' });
          D.text(`step ${(dL(TA + 0.01) - dL(TA - 0.01)).toFixed(2)} %`, TA + 22, 0.55, { size: 11, color: 'red', align: 'left' });
          D.dot(t, dL(t), { r: 8, color: 'gold' });
        });
        v.readout(() => {
          const t = T.value, ph = phase(t), a = aOf(t), fcc = ph === 'γ', V = vat(t), rho = MFe / (NA * V * 1e-24);
          const r = fcc ? (a * Math.SQRT2) / 4 : (a * Math.sqrt(3)) / 4, pf = (fcc ? 4 : 2) * (4 / 3) * Math.PI * r ** 3 / a ** 3;
          const j = dL(TA + 0.01) - dL(TA - 0.01);
          return `At ${v.fmt(t, 4)} °C iron is **${ph}** (${fcc ? 'fcc, 12 neighbours' : 'bcc, 8 neighbours'}): $a=${v.fix(a, 4)}$ Å, atomic volume ${v.fix(V, 3)} Å³, density ${v.fix(rho, 3)} g/cm³ (handbook, 20 °C: 7.86), contact radius ${v.fix(r, 3)} Å, packing fraction ${v.fix(pf, 3)}; $\\Delta L/L_0=${v.fix(dL(t), 2)}\\%$.\nThrough 912 °C the atomic volume drops from ${v.fix(vat(TA - 0.01), 3)} to ${v.fix(vat(TA + 0.01), 3)} Å³ (${v.fix(100 * (vat(TA + 0.01) / vat(TA - 0.01) - 1), 2)} %) and the bar shortens by ${v.fix(-j, 2)} % — one third of the volume change.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Anisotropy of single crystals',
      statement: String.raw`The stiffness of a single crystal depends on direction because the density and strength of bonds do. For a cubic crystal with stiffnesses $C_{11},C_{12},C_{44}$ (compliances $S_{ij}$), the Young's modulus along a direction with unit vector $\mathbf n=(n_1,n_2,n_3)$ is
$$\frac1{E(\mathbf n)}=S_{11}-2\Big(S_{11}-S_{12}-\tfrac12S_{44}\Big)\big(n_1^2n_2^2+n_2^2n_3^2+n_3^2n_1^2\big).$$
It is isotropic exactly when the **Zener ratio** $A=2C_{44}/(C_{11}-C_{12})$ equals $1$. Otherwise the extremes are along $\langle100\rangle$ and $\langle111\rangle$: copper ($A\approx3.2$) is three times stiffer along the body diagonal than along the cube edge, tungsten ($A\approx1$) is nearly isotropic. A polycrystal with randomly oriented grains averages these values between the Voigt (equal strain) and Reuss (equal stress) bounds.`,
      idea: String.raw`Each direction in the crystal presents a different arrangement of bonds to the load: along $\langle111\rangle$ in fcc copper the dense close-packed atom rows carry the stress, along $\langle100\rangle$ the load must bend the bonds sideways. The formula follows from rotating the fourth-rank compliance tensor, which for cubic symmetry depends on the single combination $n_1^2n_2^2+\dots$. Averaging over all orientations gives the isotropic polycrystal modulus quoted in handbooks, and it lies between the extremes along the axes, as the Voigt and Reuss averages show.`,
      caption: String.raw`**Drag to rotate** the surface $E(\mathbf n)$ (its distance from the centre is the modulus in that direction, its colour too) for a chosen metal; the grey sphere is the polycrystal (Hill) average. Slide the Zener ratio to bend a real crystal toward isotropy at $A=1$, or beyond. The right panel cuts the surface along the plane containing $[001]$, $[111]$ and $[110]$.`,
      deps: ['xtal-3.11'],
      refs: ['Callister §3.15'],
      tags: ['anisotropy', 'elasticity', 'single crystal'],
      scope: String.raw`Cubic crystals at room temperature, small strain. Single-crystal stiffnesses: Cu, Al, Fe, Ni from a published table of cubic materials, W from ultrasonic interferometry, Nb from the literature; the polycrystal moduli are handbook values.`,
      viz(v) {
        let sl;
        const sel = v.select('crystal', CRYSTALS.map((c) => ({ value: c.sym, label: c.sym })), 'Cu', { onChange: () => { const c = cur(); sl.set(2 * c.c[2] / (c.c[0] - c.c[1])); } });
        const cur = () => CRYSTALS.find((c) => c.sym === sel.value);
        const A0 = (c) => (2 * c.c[2]) / (c.c[0] - c.c[1]);
        sl = v.slider('Zener ratio A', 0.3, 4, A0(CRYSTALS[0]), { log: true, decimals: 2 });
        const hill = v.toggle('show polycrystal average', true);
        const s3 = v.stage3d({ range: 1.25, height: 400, yaw: -0.7, pitch: 0.35, axes: false, weight: 1.25, title: 'Young’s modulus as a surface E(n)' });
        const P = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.5], equal: true, axes: false, height: 400, weight: 0.9, minWidth: 280, title: 'cut through [001], [111], [110]' });
        const consts = () => { const c = cur(), a = sl.value; const c44 = (a * (c.c[0] - c.c[1])) / 2; return [c.c[0], c.c[1], c44]; };
        v.render(() => {
          const c = cur(), cc = consts(), S = cubicS(...cc), pa = polyAverage(...cc);
          // extremes over directions
          let lo = Infinity, hi = 0;
          for (let i = 0; i <= 30; i++) for (let j = 0; j <= 60; j++) { const th = (Math.PI * i) / 30, ph = (2 * Math.PI * j) / 60; const e = youngDir(S, [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]); lo = Math.min(lo, e); hi = Math.max(hi, e); }
          const sc = 1.05 / hi;
          s3.surface((th, ph) => { const n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], e = youngDir(S, n) * sc; return [n[0] * e, n[1] * e, n[2] * e]; }, [0, Math.PI], [0, 2 * Math.PI], { n: 36, alpha: 0.95, colorFn: (th, ph) => { const n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; const t = hi - lo < 1e-6 ? 0.5 : (youngDir(S, n) - lo) / (hi - lo); return v.ramp(t, 'red', 'blue'); } });
          if (hill.value) { const R = pa.Hill * sc; for (const k of [0, 1, 2]) s3.curve((t) => { const x = R * Math.cos(t), y = R * Math.sin(t); return k === 0 ? [x, y, 0] : k === 1 ? [x, 0, y] : [0, x, y]; }, 0, 2 * Math.PI, { color: 'ink', width: 1.4, alpha: 0.7 }); }
          for (const [d, nm] of [[[1, 0, 0], '[100]'], [[0, 1, 1], '[011]'], [[1, 1, 1], '[111]']]) { const n = v.M.normalize(d), e = youngDir(S, n) * sc * 1.06; s3.text(nm, [n[0] * e, n[1] * e, n[2] * e], { color: 'ink', size: 11 }); }
          // planar cut: directions cosθ [001] + sinθ [110]/√2
          const dirAt = (t) => { const s = Math.sin(t) / Math.SQRT2; return [s, s, Math.cos(t)]; };
          const k = 1.05 / hi;
          P.circle(0, 0, 1.05 * pa.Hill / hi, { color: 'muted', width: 1.4, fillAlpha: 0, dash: [5, 4] });
          P.line(-1.3, 0, 1.3, 0, { color: 'grid' }); P.line(0, -1.3, 0, 1.3, { color: 'grid' });
          P.curve((t) => { const r = youngDir(S, dirAt(t)) * k; return [r * Math.sin(t), r * Math.cos(t)]; }, 0, 2 * Math.PI, { n: 240, color: 'accent', width: 3, fill: 'accent', fillAlpha: 0.12 });
          for (const [t, nm] of [[0, '[001]'], [Math.atan(Math.SQRT2), '[111]'], [Math.PI / 2, '[110]']]) { const e = youngDir(S, dirAt(t)) * k; P.dot(e * Math.sin(t), e * Math.cos(t), { r: 6, color: 'gold', label: `${nm} ${v.fmt(e / k, 3)}`, labelPos: t === 0 ? 'ne' : 'e' }); }
          P.corner(`rim = E in GPa; dashed = polycrystal Hill average ${v.fmt(pa.Hill, 3)}`, 'bl', { size: 11, color: 'muted' });
        });
        v.readout(() => {
          const c = cur(), cc = consts(), S = cubicS(...cc), pa = polyAverage(...cc);
          const e100 = youngDir(S, [1, 0, 0]), e110 = youngDir(S, [1, 1, 0].map((x) => x / Math.SQRT2)), e111 = youngDir(S, [1, 1, 1].map((x) => x / Math.sqrt(3)));
          const custom = Math.abs(sl.value / A0(c) - 1) > 0.01;
          return `**${c.sym}** ${custom ? '(modified)' : `($C_{11},C_{12},C_{44}=${c.c.join(', ')}$ GPa)`}: $A=${v.fix(sl.value, 2)}$. $E_{\\langle100\\rangle}=${v.fmt(e100, 3)}$, $E_{\\langle110\\rangle}=${v.fmt(e110, 3)}$, $E_{\\langle111\\rangle}=${v.fmt(e111, 3)}$ GPa → ratio $E_{111}/E_{100}=${v.fix(e111 / e100, 2)}$.\nPolycrystal: Voigt ${v.fmt(pa.Voigt, 3)}, Reuss ${v.fmt(pa.Reuss, 3)}, Hill ${v.fmt(pa.Hill, 3)} GPa${custom ? '' : `; handbook polycrystal ${c.Epoly} GPa`}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Linear and planar atomic densities',
      statement: String.raw`The **linear density** of a crystallographic direction $[uvw]$ is the number of atoms centred on a line segment along it, per unit length: $\mathrm{LD}=1/t$, where $t$ is the repeat distance (the shortest lattice vector in that direction). The **planar density** of a plane $(hkl)$ is the number of atoms centred on the plane per unit area, $\mathrm{PD}=1/A_{\rm cell}$ with $A_{\rm cell}$ the area of the primitive cell of the planar atom net. For a cubic lattice of edge $a$: fcc $\{111\}$ has $\mathrm{PD}=4/(\sqrt3a^2)\approx2.31/a^2$ and bcc $\{110\}$ has $\mathrm{PD}=\sqrt2/a^2\approx1.41/a^2$, the largest values in each structure; the densest directions are $\langle110\rangle$ in fcc ($\sqrt2/a$) and $\langle111\rangle$ in bcc ($2/(\sqrt3a)$), where atoms touch.`,
      idea: String.raw`Count lattice points on the plane through the origin: they form a two-dimensional lattice spanned by its two shortest vectors, and the area of that parallelogram is $1/\mathrm{PD}$. Planes with large PD are also the widest spaced, because $\mathrm{PD}\times d_{hkl}$ is the volume per atom, which is fixed; widely spaced planes are weakly bound to their neighbours and slide over each other easily. This is why slip happens on the densest planes along the densest directions, the subject of chapter 3 (slip systems $\{111\}\langle110\rangle$ in fcc, $\{110\}\langle111\rangle$ in bcc).`,
      caption: String.raw`Choose a metal and indices. In the 3D panel the atoms lying on the chosen plane (or direction) are gold; the middle panel shows the planar net with its primitive cell and the atoms drawn touching. The bars rank all low-index planes (or directions) of the structure: the densest is flagged green, the current one gold.`,
      deps: ['xtal-4.2', 'xtal-1.5'],
      refs: ['Callister §3.11'],
      tags: ['planar density', 'slip', 'crystallography'],
      viz(v) {
        const MAT = { Cu: { k: 'fcc', a: 0.36149 }, Al: { k: 'fcc', a: 0.40493 }, Fe: { k: 'bcc', a: 0.28665 }, W: { k: 'bcc', a: 0.31652 } };
        const mat = v.select('metal', [{ value: 'Cu', label: 'Cu (fcc)' }, { value: 'Al', label: 'Al (fcc)' }, { value: 'Fe', label: 'α-Fe (bcc)' }, { value: 'W', label: 'W (bcc)' }], 'Cu');
        const mode = v.select('look at', [{ value: 'plane', label: 'planes (hkl)' }, { value: 'dir', label: 'directions [uvw]' }], 'plane');
        const hs = v.slider('h (or u)', 0, 3, 1, { int: true }), ks = v.slider('k (or v)', 0, 3, 1, { int: true }), ls = v.slider('l (or w)', 0, 3, 1, { int: true });
        const S3 = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 1, minWidth: 280, title: 'the lattice: atoms on the plane / line in gold' });
        const sc = v.scene3(S3, { yaw: -0.65, pitch: 0.3, axes: false, hint: false });
        const N = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 1, minWidth: 280, title: 'the atom net in the plane' });
        const B = v.stage({ x: [0, 12], y: [0, 10], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'low-index family', ylabel: 'atoms per nm²', title: 'ranking of the low-index planes' });
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        const fams = (kind, isPlane) => {
          const out = [];
          for (let h = 1; h <= 3; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= k; l++) {
            if (gcd(gcd(h, k), l) !== 1) continue;
            const r = isPlane ? planeNet(kind, h, k, l) : dirNet(kind, h, k, l);
            if (r) out.push({ key: `${h}${k}${l}`, idx: [h, k, l], d: r.density });
          }
          return out.sort((p, q) => q.d - p.d);
        };
        const keyOf = (a, b, c) => [a, b, c].sort((p, q) => q - p).join('');
        const ticksFor = (list, isPlane) => list.map((f, i) => [i + 0.5, (isPlane ? '{' : '⟨') + f.idx.join('') + (isPlane ? '}' : '⟩')]);
        let lastKey = '';
        v.render(() => {
          const m = MAT[mat.value], kind = m.k, isPlane = mode.value === 'plane';
          let h = hs.value, k = ks.value, l = ls.value; if (!h && !k && !l) { h = 1; }
          const list = fams(kind, isPlane), a = m.a;
          const net = isPlane ? planeNet(kind, h, k, l) : dirNet(kind, h, k, l), rHard = kind === 'fcc' ? Math.SQRT2 / 4 : Math.sqrt(3) / 4;
          // 3D lattice
          const nrm = Math.hypot(h, k, l);
          sc.begin();
          for (const x of [-1, 1]) for (const y of [-1, 1]) { sc.line([x, y, -1], [x, y, 1], { color: 'faint', width: 1 }); sc.line([x, -1, y], [x, 1, y], { color: 'faint', width: 1 }); sc.line([-1, x, y], [1, x, y], { color: 'faint', width: 1 }); }
          if (isPlane && net) {
            const e1 = v.M.normalize(net.v1), n = v.M.normalize([h, k, l]), e2 = v.M.cross3(n, e1);
            sc.disc(e1, e2, 1.3, { fill: 'orange', fillAlpha: 0.14, color: 'orange' });
          } else if (!isPlane) { const d = v.M.normalize([h, k, l]); sc.line(d.map((c) => -1.5 * c), d.map((c) => 1.5 * c), { color: 'orange', width: 2.4 }, 2); }
          const on = [], off = [];
          for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -2; z <= 2; z++) {
            if (!inLattice(kind, x, y, z)) continue;
            const p = [x / 2, y / 2, z / 2], cr = Math.hypot(y * l - z * k, z * h - x * l, x * k - y * h);
            ((isPlane ? h * x + k * y + l * z === 0 : cr === 0) ? on : off).push(p);
          }
          const pr = Math.abs(S3.X(1) - S3.X(0)) * rHard * 0.5;
          off.forEach((p) => sc.dot(p, { r: Math.max(3, pr * 0.8), color: 'muted', alpha: 0.5 }));
          on.forEach((p) => sc.dot(p, { r: Math.max(4.5, pr * 1.05), color: 'gold' }));
          sc.flush();
          S3.corner(`${isPlane ? `plane (${h}${k}${l})` : `direction [${h}${k}${l}]`}: ${on.length} atoms in view on it`, 'tl', { size: 12, color: 'ink' });
          // net
          if (net) {
            if (isPlane) {
              const e1 = v.M.normalize(net.v1), v2 = net.v2, p2 = v.M.dot(v2, e1), e2t = [v2[0] - p2 * e1[0], v2[1] - p2 * e1[1], v2[2] - p2 * e1[2]], e2 = v.M.normalize(e2t);
              const b1 = [Math.hypot(...net.v1), 0], b2 = [p2, v.M.dot(v2, e2)];
              const R = clamp(2.2 * Math.max(b1[0], Math.hypot(...b2)), 1.4, 3.2), cell = [[0, 0], b1, [b1[0] + b2[0], b1[1] + b2[1]], b2];
              N.setView([-R * 1.25, R * 1.25], [-R * 0.95, R * 0.95]);
              N.poly(cell, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 2 });
              for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const x = i * b1[0] + j * b2[0], y = i * b1[1] + j * b2[1]; if (Math.abs(x) > R * 1.3 || Math.abs(y) > R) continue; N.circle(x, y, rHard, { fill: 'gold', fillAlpha: 0.22, color: 'gold', width: 1.2 }); N.dot(x, y, { r: 3.5, color: 'ink' }); }
              N.corner(`primitive cell: area ${net.area.toFixed(3)} a², one atom`, 'bl', { size: 12, color: 'orange' });
            } else {
              N.setView([-1.5 * net.len * 3, 1.5 * net.len * 3 + 0.5], [-1, 1]);
              N.setView([-0.4 * net.len, 3.4 * net.len], [-1.3 * net.len, 1.3 * net.len]);
              for (let i = 0; i < 4; i++) { N.circle(i * net.len, 0, rHard, { fill: 'gold', fillAlpha: 0.22, color: 'gold', width: 1.2 }); N.dot(i * net.len, 0, { r: 3.5, color: 'ink' }); }
              N.measure(0, -rHard * 1.25, net.len, -rHard * 1.25, `t = ${net.len.toFixed(3)} a`);
              N.corner('repeat distance of the atom row', 'bl', { size: 12, color: 'orange' });
            }
          }
          // ranking
          const cur = keyOf(h, k, l), top = list[0].d;
          B.setView([0, list.length], [0, (top / (a * a)) * (isPlane ? 1 : 1) * 1.1 * (isPlane ? 1 : 1)]);
          if (!isPlane) B.setView([0, list.length], [0, (top / a) * 1.12]);
          B.setLabels(undefined, isPlane ? 'atoms per nm²' : 'atoms per nm');
          B.setTitle(isPlane ? 'planar density of the low-index planes' : 'linear density of the low-index directions');
          const sig = `${kind}${isPlane}`; if (sig !== lastKey) { lastKey = sig; B.setTicks(ticksFor(list, isPlane), null); }
          list.forEach((f, i) => { const val = isPlane ? f.d / (a * a) : f.d / a, isCur = f.key === cur, isTop = i === 0; B.rect(i + 0.12, 0, i + 0.88, val, { fill: isCur ? 'gold' : isTop ? 'green' : 'blue', fillAlpha: isCur ? 0.8 : 0.5, color: isCur ? 'gold' : isTop ? 'green' : 'blue' }); });
          B.text(`densest: ${isPlane ? '{' : '⟨'}${list[0].idx.join('')}${isPlane ? '}' : '⟩'}`, list.length - 0.3, (isPlane ? top / (a * a) : top / a) * 1.02, { size: 12, color: 'green', align: 'right', weight: 700 });
        });
        v.readout(() => {
          const m = MAT[mat.value], kind = m.k, isPlane = mode.value === 'plane';
          let h = hs.value, k = ks.value, l = ls.value; if (!h && !k && !l) h = 1;
          const net = isPlane ? planeNet(kind, h, k, l) : dirNet(kind, h, k, l), a = m.a, list = fams(kind, isPlane);
          if (!net) return 'No lattice points on this line.';
          const d = net.density, cur = keyOf(h, k, l), rank = list.findIndex((f) => f.key === cur) + 1;
          return isPlane ? `**${mat.value}** (${kind}, $a=${v.fix(a * 10, 3)}$ Å): plane $(${h}${k}${l})$ has $\\mathrm{PD}=${v.fix(d, 3)}/a^2=${v.fix(d / (a * a), 2)}$ atoms/nm² (rank ${rank} of ${list.length} families up to index 3). Densest: $\\{${list[0].idx.join('')}\\}$ with ${v.fix(list[0].d / (a * a), 2)} atoms/nm².` : `**${mat.value}** (${kind}, $a=${v.fix(a * 10, 3)}$ Å): direction $[${h}${k}${l}]$ repeats every $t=${v.fix(net.len, 3)}\\,a=${v.fix(net.len * a * 10, 3)}$ Å, $\\mathrm{LD}=${v.fix(d / a, 2)}$ atoms/nm (rank ${rank} of ${list.length}). Densest: $\\langle${list[0].idx.join('')}\\rangle$ with ${v.fix(list[0].d / a, 2)} atoms/nm.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Material property charts (Ashby)',
      statement: String.raw`A **material property chart** plots one property against another for every common material on logarithmic axes. Materials of one class (metals, ceramics, polymers, composites, natural materials) cluster in bubbles, and the log scale turns design relations into straight lines. A **performance index** $M$ combines the properties that a design must maximise; setting $M$ constant draws a **selection line** of slope $p$ on the chart of $E$ against $\rho$, and every material above the line beats it. For a stiffness-limited, minimum-mass design: a tie rod loaded in tension has $M=E/\rho$ (slope $1$), a beam in bending $M=E^{1/2}/\rho$ (slope $2$), a plate in bending $M=E^{1/3}/\rho$ (slope $3$).`,
      idea: String.raw`The design requirement fixes the geometry in terms of the material's properties. For a tie of length $L$ and stiffness $S=AE/L$ the mass $m=A\rho L=SL^2\,\rho/E$, so the lightest tie maximises $E/\rho$. For a beam of square section $b$ the stiffness $S\propto Eb^4/L^3$ and $m=\rho b^2L$, giving $m\propto\rho/E^{1/2}$. Taking logs, $\log E=p\log\rho+p\log M$: lines of constant $M$ have slope $p$ on a log–log chart, and sliding the line selects the candidates in order. The chart also explains why steel gives way to aluminium, then to composites and wood, as the design moves from tension to bending to plates.`,
      caption: String.raw`Choose the loading (tie, beam, plate) and **drag the green handle**: materials above the line have a higher index than the handle's material. Click a material to read its numbers. Bars show the property range for materials whose modulus varies (polyethylene, wood, glass...), bubbles the classes. Filled dots: densities checked against references; hollow dots: typical engineering densities.`,
      deps: ['mat-1.2'],
      refs: ['Callister §6.5'],
      tags: ['Ashby', 'materials selection', 'stiffness'],
      credit: 'M. F. Ashby, 1990s',
      scope: String.raw`Stiffness-limited, minimum-mass design only (strength- or cost-limited designs use other indices). Property values are typical ranges for common grades, not design data.`,
      viz(v) {
        // name, class, E range (GPa), ρ range (Mg/m³), label?, density verified?
        const M = [
          ['steel (A36)', 'metal', [200, 200], [7.8, 7.9], 1, 0], ['Ti-6Al-4V', 'metal', [114, 114], [4.4, 4.5], 1, 0], ['magnesium alloy', 'metal', [45.2, 45.2], [1.75, 1.85], 1, 0],
          ['aluminium', 'metal', [68, 70], [2.7, 2.7], 1, 1], ['copper', 'metal', [110, 128], [8.96, 8.96], 1, 1], ['brass', 'metal', [106, 106], [8.4, 8.7], 0, 0], ['nickel', 'metal', [200, 200], [8.9, 8.9], 0, 1],
          ['tungsten', 'metal', [411, 411], [19.25, 19.25], 1, 1], ['lead', 'metal', [13, 16], [11.34, 11.34], 1, 1], ['beryllium', 'metal', [287, 287], [1.85, 1.85], 1, 1], ['gold', 'metal', [77, 79], [19.3, 19.3], 0, 1], ['zinc', 'metal', [108, 108], [7.14, 7.14], 0, 1],
          ['diamond', 'ceramic', [1050, 1210], [3.5, 3.53], 1, 1], ['alumina', 'ceramic', [380, 380], [3.9, 4.0], 1, 1], ['silicon carbide', 'ceramic', [430, 430], [3.1, 3.2], 1, 1], ['silicon nitride', 'ceramic', [300, 300], [3.17, 3.2], 0, 1],
          ['tungsten carbide', 'ceramic', [600, 686], [15.6, 15.6], 1, 1], ['zirconia (PSZ)', 'ceramic', [210, 210], [5.7, 6.0], 0, 1], ['glass', 'ceramic', [47.7, 83.6], [2.45, 2.55], 1, 0], ['fused silica', 'ceramic', [71.7, 71.7], [2.2, 2.2], 0, 0], ['concrete', 'ceramic', [30, 30], [2.3, 2.5], 1, 0],
          ['polyethylene', 'polymer', [0.228, 1.38], [0.9, 0.96], 1, 1], ['polypropylene', 'polymer', [1.68, 1.68], [0.86, 0.95], 0, 1], ['polystyrene', 'polymer', [2.5, 3.5], [0.96, 1.05], 1, 1], ['nylon 66', 'polymer', [2.93, 2.93], [1.14, 1.14], 1, 1],
          ['polycarbonate', 'polymer', [2.2, 2.2], [1.2, 1.22], 0, 1], ['PTFE', 'polymer', [0.564, 0.564], [2.2, 2.2], 1, 1], ['rubber', 'polymer', [0.01, 0.1], [0.91, 0.93], 1, 0],
          ['CFRP', 'composite', [30, 181], [1.5, 1.6], 1, 0], ['glass-fibre polyester', 'composite', [17.2, 17.2], [1.8, 2.0], 1, 0], ['aramid (Kevlar)', 'composite', [70.5, 112.4], [1.4, 1.45], 1, 0],
          ['wood (along grain)', 'composite', [9, 12], [0.55, 0.75], 1, 0], ['bone (cortical)', 'composite', [14, 14], [1.8, 2.0], 1, 0], ['MDF', 'composite', [4, 4], [0.7, 0.8], 0, 0],
        ].map(([name, cls, E, r, lab, ver]) => ({ name, cls, E, r, lab, ver, e: Math.sqrt(E[0] * E[1]), p: Math.sqrt(r[0] * r[1]) }));
        const COL = { metal: 'blue', ceramic: 'red', polymer: 'green', composite: 'orange' }, CN = { metal: 'metals', ceramic: 'ceramics', polymer: 'polymers', composite: 'composites, natural' };
        const idx = v.select('design', [{ value: 1, label: 'stiff light tie  E/ρ' }, { value: 2, label: 'stiff light beam  E^½/ρ' }, { value: 3, label: 'stiff light plate  E^⅓/ρ' }], 1);
        const s = v.stage({ x: [0.45, 30], y: [0.006, 2500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 520, full: true, xlabel: 'density ρ (Mg/m³)', ylabel: 'Young’s modulus E (GPa)', title: 'modulus–density chart' });
        const hd = s.handle(7.85, 200, { color: 'green', r: 9, label: 'index line', labelPos: 'se' });
        let sel = 'aluminium';
        s.onClick((x, y) => { let best = null, bd = 0.16; for (const m of M) { const d = Math.hypot(Math.log10(x / m.p), Math.log10(y / m.e)); if (d < bd) { bd = d; best = m.name; } } if (best) sel = best; });
        const hull = (P) => { const q = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of [...q].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return [...lo.slice(0, -1), ...up.slice(0, -1)]; };
        const Mi = (m, p) => Math.pow(m.e, 1 / p) / m.p;
        v.render(() => {
          const p = +idx.value, Mh = Math.pow(hd.y, 1 / p) / hd.x, line = (x) => Math.pow(Mh * x, p);
          for (const c of Object.keys(COL)) {
            const pts = []; for (const m of M.filter((q) => q.cls === c)) for (let t = 0; t < 12; t++) { const a = (2 * Math.PI * t) / 12; for (const [lx, ly] of [[Math.log10(m.r[0]), Math.log10(m.E[0])], [Math.log10(m.r[1]), Math.log10(m.E[1])]]) pts.push([lx + 0.07 * Math.cos(a), ly + 0.1 * Math.sin(a)]); }
            s.poly(hull(pts).map(([x, y]) => [10 ** x, 10 ** y]), { fill: COL[c], fillAlpha: 0.1, color: COL[c], width: 1.4, alpha: 0.7 });
          }
          s.fn(line, { color: 'green', width: 2.2, dash: [7, 5] });
          s.fn(line, { color: 'green', width: 0 });
          const items = [];
          for (const m of M) {
            const above = Mi(m, p) > Mh * 1.0005, on = m.name === sel;
            if (m.E[1] / m.E[0] > 1.05) s.line(m.p, m.E[0], m.p, m.E[1], { color: COL[m.cls], width: 3, alpha: 0.5 });
            s.dot(m.p, m.e, { r: on ? 8 : 5, color: above ? 'green' : COL[m.cls], hollow: !m.ver, ring: on });
            if (m.lab || on) items.push({ x: m.p, y: m.e, text: m.name, r: on ? 8 : 5, size: on ? 13 : 10.5, weight: on ? 700 : 500, color: on ? COL[m.cls] : 'ink' });
          }
          items.sort((a, b) => (b.weight === 700) - (a.weight === 700));
          placeLabels(v, s, items, { avoid: [[s.X(hd.x) - 12, s.Y(hd.y) - 14, s.X(hd.x) + 95, s.Y(hd.y) + 30]] });
          v.legend([...Object.keys(COL).map((c) => [COL[c], CN[c], { area: true }]), ['green', 'beats the selection line', { dot: true }]]);
        });
        v.readout(() => {
          const p = +idx.value, Mh = Math.pow(hd.y, 1 / p) / hd.x, name = ['E/ρ', 'E^{1/2}/ρ', 'E^{1/3}/ρ'][p - 1], unit = ['GPa/(Mg/m³) = MN·m/kg', 'GPa^{1/2}/(Mg/m³)', 'GPa^{1/3}/(Mg/m³)'][p - 1];
          const steel = M[0], rank = [...M].sort((a, b) => Mi(b, p) - Mi(a, p)), top = rank.slice(0, 5).map((m) => `${m.name} ${v.fmt(Mi(m, p), 3)}`).join(', ');
          const m = M.find((q) => q.name === sel);
          return `Line through the handle: $M=${name}=${v.fmt(Mh, 3)}$ ${unit}. Best five of ${M.length}: ${top}. A stiffness-matched part in the best material weighs ${v.fix(Mi(steel, p) / Mi(rank[0], p), 3)} × the steel one.\n**${m.name}**: $E=${m.E[0] === m.E[1] ? m.E[0] : `${m.E[0]}$–$${m.E[1]}`}$ GPa, $\\rho=${m.r[0] === m.r[1] ? m.r[0] : `${m.r[0]}$–$${m.r[1]}`}$ Mg/m³ (${m.ver ? 'density checked' : 'typical density'}) → $M=${v.fmt(Mi(m, p), 3)}$, ${Mi(m, p) > Mh * 1.0005 ? 'above' : 'on or below'} the line.`;
        });
      },
    },
  ],
};
