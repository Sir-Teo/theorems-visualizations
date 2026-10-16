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
        const sP = v.stage({ x: [0.8, 2.6], y: [-1.25, 1.0], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'bond length  r / r₀', ylabel: 'U(r) / ε', title: 'pair potential, reduced by its well depth' });
        const sM = v.stage({ x: [0.012, 20], y: [15, 8000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1.35, xlabel: 'cohesive energy per atom  E_coh (eV)', ylabel: 'melting point  T_m (K)', title: 'measured: bond energy against melting point' });
        sM.onClick((x, y) => {
          let best = -1, bd = 0.2;
          MELT.forEach((e, i) => { if (flt.value !== 'all' && e.cls !== flt.value) return; const d = Math.hypot(Math.log10(x / e.ecoh), Math.log10(y / e.tm)); if (d < bd) { bd = d; best = i; } });
          if (best >= 0) sel = best;
        });
        const ratio = (e) => e.ecoh / (KB * e.tm);
        const med = Object.fromEntries(cls.map((c) => [c, median(MELT.filter((e) => e.cls === c).map(ratio))]));
        v.render(() => {
          const e = MELT[sel], c = e.cls, eps = (2 * e.ecoh) / zOf(e), kT = (KB * e.tm) / eps;
          sP.hband(-1, -1 + kT, { color: 'gold', alpha: 0.22, edges: false });
          sP.text(`k_B T_m = ${kT.toFixed(2)} ε`, 2.57, -1 + kT / 2, { size: 11, color: 'ink', align: 'right', baseline: 'middle' });
          sP.hline(0, { color: 'faint' });
          for (const k of cls) sP.fn(CLASS_POT[k].f, { domain: [k === 'metal' ? 0.82 : 0.8, 2.6], color: CLASSES[k].color, width: k === c ? 3.4 : 1.6, alpha: k === c ? 1 : 0.5 });
          sP.vline(1, { color: 'faint', dash: true });
          sP.dot(1, -1, { r: 5, color: CLASSES[c].color });
          sP.text(CLASS_POT[c].label, 2.57, 0.8, { size: 12, color: CLASSES[c].color, align: 'right', weight: 600 });
          sP.text('r₀', 1.0, 0.62, { size: 11, color: 'muted', align: 'center' });
          sP.text('−ε', 0.84, -1.0, { size: 11, color: 'muted', align: 'left', baseline: 'middle', dy: 10 });
          // measured chart
          for (const R of [30, 12]) sM.fn((x) => x / (KB * R), { color: 'muted', dash: [5, 4], width: 1.2, alpha: 0.7 });
          sM.text('E_coh = 30 k_B T_m', 11.5, 11.5 / (KB * 30) * 0.74, { size: 11, color: 'muted', align: 'right', baseline: 'middle' });
          sM.text('E_coh = 12 k_B T_m', 0.55, 0.55 / (KB * 12) * 1.55, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
          const items = [];
          MELT.forEach((m, i) => {
            const on = flt.value === 'all' || m.cls === flt.value, isSel = i === sel;
            sM.dot(m.ecoh, m.tm, { r: isSel ? 8 : 5, color: CLASSES[m.cls].color, hollow: !on && false, ring: isSel });
            if (on || isSel) items.push({ x: m.ecoh, y: m.tm, text: m.sym, r: isSel ? 8 : 5, size: isSel ? 13 : 10, weight: isSel ? 700 : 500, color: isSel ? CLASSES[m.cls].color : 'ink' });
          });
          items.sort((p, q) => (q.weight === 700) - (p.weight === 700));
          placeLabels(v, sM, items);
          v.legend(cls.map((k) => [CLASSES[k].color, CLASSES[k].name]));
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
        const sU = v.stage({ x: [0.75, 3.0], y: [-1.3, 0.8], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'bond length  r / r₀', ylabel: 'U / ε', title: 'where the bonds sit on the well' });
        const sF = v.stage({ x: [0, 0.6], y: [-0.05, 1.3], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'chain strain  e = Δ / (n r₀)', ylabel: 'tension F (nN)', title: 'force against extension' });
        const sE = v.stage({ x: [0.8, 500], y: [2, 2000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, full: true, xlabel: 'cohesive energy density  E_coh / Ω  (GPa)', ylabel: 'Young’s modulus E (GPa, polycrystal)', title: 'real elements: stiffness follows bond-energy density' });
        // chain mechanics in reduced units: ξ = r/r₀ − 1, f = F / F_max = 4u(1−u), u = e^{−βξ}
        const fOf = (xi, b) => { const u = Math.exp(-b * xi); return 4 * u * (1 - u); };
        function chain(D, b) {
          const xs = Math.LN2 / b, Du = n * xs;
          if (D <= Du) { const xi = D / n; return { loc: false, xi1: xi, xi2: xi, f: fOf(xi, b) }; }
          const g = (f) => { const s = Math.sqrt(1 - f); return (n - 1) * (-Math.log((1 + s) / 2) / b) + (-Math.log((1 - s) / 2) / b); };
          let lo = 1e-9, hi = 1;
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
          sU.dot(xr(x1), POT.morse(x1, b), { r: 8, color: 'gold', label: st.loc ? `${n - 1} bonds` : `all ${n} bonds`, labelPos: 'nw' });
          if (st.loc) sU.dot(xr(Math.min(x2, 2.95)), POT.morse(Math.min(x2, 2.95), b), { r: 8, color: 'red', label: '1 bond', labelPos: 'n' });
          sU.text('Hooke parabola', 1.0 - 0.02, 0.7, { size: 11, color: 'orange', align: 'right' });
          // force-extension
          sF.setView([0, 0.6], [-0.08 * Fmax, 1.3 * Fmax]);
          sF.hline(0, { color: 'faint' });
          const curve = []; for (let i = 0; i <= 240; i++) { const e = (0.6 * i) / 240; curve.push([e, chain(e * n, b).f * Fmax]); }
          sF.path(curve, { color: 'accent', width: 2.8 });
          sF.line(0, 0, 0.6, 4 * b * 0.6 * Fmax, { color: 'orange', dash: [6, 4], width: 1.6 });
          sF.text('slope k·r₀ (Hooke)', 0.35, 4 * b * 0.35 * Fmax + 0.05 * Fmax, { size: 11, color: 'orange', align: 'right' });
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
          sE.text('E = 3 E_coh/Ω', 300, 3.2 * 300 * 0.55, { size: 11, color: 'faint', align: 'right' });
          placeLabels(v, sE, items.sort((p, q) => (q.weight === 700) - (p.weight === 700)));
          v.legend([[CLASSES.metal.color, 'metals'], [CLASSES.covalent.color, 'covalent (Si, Ge, C)'], ['gold', 'selected']]);
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
      caption: String.raw`The left panel shows the bond potential with the Boltzmann distribution of bond lengths (orange) and its mean (gold) against the minimum (dashed): drag the temperature up and the mean slides outward for the Morse and Lennard-Jones bonds, while the harmonic bond (choose it) stays put. *New snapshot* draws instantaneous bond lengths from that distribution. The middle panel is $\langle r\rangle(T)$ computed by numerical integration; the right panel tests the Morse prediction $\alpha\simeq3k_B/4\beta\varepsilon$ against measured coefficients of 26 elements.`,
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
          sB.text('k_BT above the bottom', 1.58 * R0, -eps + KB * T.value + 0.05 * eps, { size: 10.5, color: 'red', align: 'right' });
          const S = sampler(tau), rng = v.rng(100 + snap);
          for (let i = 0; i < 26; i++) { const u = rng(); let j = S.cdf.findIndex((c) => c >= u); if (j < 0) j = S.cdf.length - 1; const x = S.xs[j]; sB.dot(x * R0, eps * Vof(x), { r: 4.2, color: 'gold', ring: false }); }
          // mean vs T
          const Tmax = Math.min(3600, Math.max(1400, 1.12 * Tm));
          sT.setView([0, Tmax], [-0.4, 3.6]);
          sT.hline(0, { color: 'faint' });
          const curve = [], c0 = []; for (let i = 0; i <= 50; i++) { const t = (Tmax * i) / 50; curve.push([t, (meanX((KB * t) / eps) - 1) * 100]); }
          sT.path(curve, { color: pot.value === 'harm' ? 'muted' : 'accent', width: 2.8 });
          if (pot.value !== 'harm') sT.fn((t) => (100 * 3 * ((KB * t) / eps)) / (4 * beff()), { color: 'orange', dash: [5, 4], width: 1.4 });
          if (pot.value !== 'harm') sT.text('leading order 3k_BT/(4βε)', Tmax * 0.98, 100 * 3 * ((KB * Tmax) / eps) / (4 * beff()) * 0.8 + 0.1, { size: 11, color: 'orange', align: 'right' });
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
    // @@MORE
  ],
};
