// Materials Science — Chapter 3, part c: items 3.11–3.13 (deformation twinning, partial dislocations, Taylor's 1934 paper)
import { edgeU } from './ch03.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const S3 = Math.sqrt(3), S6 = Math.sqrt(6);

// ── fcc seen along [1-10]: columns of the (111) layers ─────────────────────────────────────────────────────────────────
// lattice points (u, v, w)/2 with u+v+w even, projected on x = [11-2]/√6 and y = [111]/√3 (units of the cube edge a).
const LAYERS = (() => {
  // Infinite projected rows: u+v+w=2m implies x=(2m-3w)/(2sqrt6).
  // Generate the visible x interval without imposing a finite parent-crystal edge.
  const points=[];
  for(let m=-24;m<=24;m++)for(let w=-60;w<=60;w++){
    const x=(2*m-3*w)/(2*S6);if(Math.abs(x)<=9)points.push({m,x});
  }
  return points;
})();
const D111 = 1 / S3, PER = S6 / 4, PFULL = S6 / 2; // layer spacing; repeat of the projected rows; true in-layer repeat along [11-2], in units of a

export default {
  collection: 'mat',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Phenomenon',
      name: 'Deformation twinning',
      statement: String.raw`In **deformation twinning** a region of crystal changes to the mirror image of the parent lattice across a **twin plane** by a homogeneous shear: every atomic plane parallel to the twin plane moves by a fixed fraction of the interatomic spacing, in proportion to its distance from the twin plane, so the **twinning shear** $s$ is a fixed number set by the structure. For fcc $\{111\}\langle11\bar2\rangle$ and bcc $\{112\}\langle11\bar1\rangle$ it is $s=1/\sqrt2\approx0.71$; for hcp $\{10\bar12\}\langle\bar1011\rangle$ it depends on the axial ratio $\gamma=c/a$ as $s=\dfrac{|\gamma^2-3|}{\gamma\sqrt3}$ (zero at $\gamma=\sqrt3$). Twinning is a coordinated shear, often mediated by twinning dislocations and atomic shuffles. It can compete with ordinary slip at low temperature or high strain rate and when the available easy slip systems cannot accommodate the imposed shape change (3.9).`,
      idea: String.raw`A mirror image of a lattice is again a lattice, so there is a shear that carries the parent lattice onto its reflection across a lattice plane; for fcc, successive close-packed layers have an in-plane offset of $P/3$ ($P$ the repeat), and the mirror lattice needs each layer above the twin plane to be shifted by that same $P/3$ more than the one below, a shear $(P/3)/d=1/\sqrt2$ where $d$ is the layer spacing. Because the shear is the same for every plane, it can be nucleated at a boundary and spread at high speed, whereas slip is a one-plane-at-a-time process. The program below builds the fcc lattice from its geometry, applies the shear, and counts how many sheared atoms land exactly on mirror-image sites.`,
      caption: String.raw`Raise the shear fraction $f$ from 0 to 1: the planes inside the twin (orange) glide by amounts proportional to their height above the lower twin plane, and the matrix above is carried along rigidly. At $f=1$ the twin atoms coincide with the mirror image of the parent lattice (hollow circles; the readout counts them). Change the twin thickness and position. The right panel shows the twinning shear: $0.71$ for fcc and bcc, and for hcp as a function of $c/a$ (move the slider; the markers are approximate $c/a$ values of some metals).`,
      deps: ['mat-3.4', 'xtal-9.4'],
      refs: ['Callister §7.7'],
      tags: ['twinning', 'shear', 'plasticity'],
      scope: String.raw`The lattice picture is the fcc structure projected along $[1\bar10]$ (each layer is a row of atoms). The hcp shear formula is the standard crystallographic result for the $\{10\bar12\}$ twin (Bilby and Crocker theory); the bcc value is quoted, not computed here. The $c/a$ markers (Cd $\approx1.89$, Zn $\approx1.86$, Mg $\approx1.62$, Ti $\approx1.59$) are rounded handbook-style values and were only partly re-checked.`,
      verify: true,
      viz(v) {
        const fS = v.slider('twin shear fraction $f$', 0, 1, 1, { step: 0.01 });
        const tS = v.slider('twin thickness (layers)', 1, 9, 5, { int: true });
        const p0 = v.slider('lower twin plane (layer)', -6, 2, -3, { int: true });
        const mir = v.toggle('show mirror image of the parent', true);
        const cS = v.slider('hcp  $c/a$', 1.4, 1.95, 1.624, { step: 0.001 });
        const A = v.stage({ x: [-6.2, 6.2], y: [-4.4, 4.4], equal: true, axes: false, height: 420, weight: 1.45, title: 'fcc crystal, (111) layers seen edge-on' });
        const B = v.stage({ x: [1.4, 1.95], y: [0, 0.9], axes: 'box', gutter: true, height: 420, weight: 0.85, minWidth: 270, xlabel: 'axial ratio  $c/a$ (hcp)', ylabel: 'twinning shear  $s$', title: 'twinning shear' });
        const sHcp = (g) => Math.abs(g * g - 3) / (g * S3);
        const byLayer = new Map(); for (const a of LAYERS) { if (!byLayer.has(a.m)) byLayer.set(a.m, []); byLayer.get(a.m).push(a.x); }
        const wrap = (d) => d - PER * Math.round(d / PER);
        let info = null;
        v.render(() => {
          const m0 = p0.value, m1 = m0 + tS.value, f = fS.value;
          // layer-to-layer offset (mod the repeat), measured from the atoms
          const x0 = byLayer.get(m0).reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a)), x1 = byLayer.get(m0 + 1).reduce((a, b) => (Math.abs(b - x0) < Math.abs(a - x0) ? b : a));
          const dm = wrap(x1 - x0); let delta = dm; for (const c of [dm - PER, dm, dm + PER]) if (Math.abs(Math.abs(c) - PFULL / 3) < Math.abs(Math.abs(delta) - PFULL / 3)) delta = c; // the twinning shift is P/3 = a/√6 (equal to the projected offset up to a projected repeat)
          const sTw = delta / D111;
          const y0 = m0 * D111; A.setView([-6.2,6.2],[Math.min(-4.4,y0-.8),Math.max(4.4,m1*D111+.8)]);
          let onMirror = 0, tot = 0;
          if (mir.value) for (const a of LAYERS) { if (a.m < m0 && a.m >= 2 * m0 - m1 && Math.abs(a.x) <= 6.2) A.dot(a.x, (2 * m0 - a.m) * D111, { r: 9, color: 'ink', hollow: true, width: 1.2, alpha: 0.7 }); }
          for (const a of LAYERS) {
            const y = a.m * D111; let x = a.x, twin = false;
            if (a.m > m0 && a.m <= m1) { x += f * sTw * (y - y0); twin = true; }
            else if (a.m > m1) x += f * sTw * (m1 - m0) * D111;
            if (Math.abs(x) > 6.2) continue;
            A.dot(x, y, { r: 5.5, color: twin ? 'orange' : a.m > m1 ? 'accent' : 'accent', fill: twin ? 'orange' : 'accent', alpha: twin ? 1 : 0.85 });
            if (twin && Math.abs(x) < 5) {
              tot++;
              const mm = 2 * m0 - a.m, row = byLayer.get(mm) || [];
              if (row.some((q) => Math.abs(wrap(q - x)) < 0.02)) onMirror++;
              if (mir.value) { A.dot(x, 2 * y0 - y, { r: 0.1, color: 'ink', alpha: 0 }); }
            }
          }
          A.hline(y0, { color: 'red', dash: [5, 4], alpha: 0.8 }); A.hline(m1 * D111, { color: 'red', dash: [5, 4], alpha: 0.8 });
          A.text('twin plane', -6.0, y0 + 0.2, { color: 'red', size: 11, align: 'left' });
          // hcp panel
          B.fn(sHcp, { color: 'ink', width: 2.5, domain: [1.4, 1.95] });
          B.hline(1 / Math.SQRT2, { color: 'accent', dash: [5, 4], width: 1.6 }); B.text('fcc and bcc: $1/\\sqrt2$', 1.41, 0.74, { color: 'accent', size: 11.5, align: 'left' });
          B.vline(S3, { color: 'muted', dash: [3, 4] }); B.text('$\\sqrt3$', S3 + 0.005, 0.05, { color: 'muted', size: 11, align: 'left' });
          for (const [nm, g] of [['Ti', 1.588], ['Mg', 1.624], ['Zn', 1.856], ['Cd', 1.886]]) { B.dot(g, sHcp(g), { r: 4.5, color: 'gold', fill: 'gold' }); B.text(nm, g, sHcp(g) + 0.07, { size: 11, color: 'ink' }); }
          B.dot(cS.value, sHcp(cS.value), { r: 7, color: 'orange', fill: 'orange' });
          B.text('extension twin', 1.5, 0.35, { color: 'muted', size: 10.5 }); B.text('contraction twin', 1.85, 0.35, { color: 'muted', size: 10.5 });
          info = { sTw, onMirror, tot, f, sh: sHcp(cS.value), delta, g: cS.value };
        });
        v.readout(() => info ? `Measured from the lattice: layer shift $P/3=a/\\sqrt6=${v.fix(Math.abs(info.delta), 3)}\\,a$, so the fcc twinning shear is $s=${v.fix(Math.abs(info.sTw), 3)}$ ($1/\\sqrt2=0.707$). At $f=${v.fix(info.f, 2)}$ each twin layer has moved $${v.fix(info.f * Math.abs(info.delta), 3)}\\,a$ per layer; ${info.onMirror} of ${info.tot} twin atoms sit on mirror-image sites (all of them when $f=1$).\nhcp $\\{10\\bar12\\}$: $s(c/a=${v.fix(info.g, 3)})=${v.fix(info.sh, 3)}$.` : '');
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Concept',
      name: 'Partial dislocations and stacking faults',
      statement: String.raw`In an fcc crystal the perfect dislocation of Burgers vector $\tfrac a2\langle110\rangle$ in a $\{111\}$ plane can lower its far-field elastic energy by splitting into two **Shockley partial dislocations**, $\tfrac a2[\bar101]\to\tfrac a6[\bar211]+\tfrac a6[\bar1\bar12]$, because $b_1^2+b_2^2=\tfrac13a^2<\tfrac12a^2=b^2$ (Frank's rule, 3.6). Between the two partials the layers above the slip plane are displaced by one partial only, so the stacking sequence $ABCABC$ is locally changed to $ABCBCA$: an **intrinsic stacking fault** with energy $\gamma_{\rm SF}$ per unit area, two layers of which are hcp-like. The partials repel each other with the elastic force $F=\dfrac{Gb_p^2}{2\pi d}\Big[\dfrac{\cos^2 30^\circ}{1-\nu}-\sin^230^\circ\Big]$ (pure edge character; $b_p=a/\sqrt6$) and the fault pulls them together with $\gamma_{\rm SF}$ per length, so the equilibrium width is $$d=\frac{Gb_p^2}{8\pi\gamma_{\rm SF}}\frac{2+\nu}{1-\nu}\ \ (\text{edge}),\qquad d=\frac{Gb_p^2}{8\pi\gamma_{\rm SF}}\frac{2-3\nu}{1-\nu}\ \ (\text{screw}).$$`,
      idea: String.raw`Frank's rule says the split is downhill in elastic energy; the two partials are $60^\circ$ apart in direction and so repel by an interaction that falls as $1/d$ (the parallel-line interaction of 3.6), while the fault between them costs energy proportional to its width. The balance $F(d)=\gamma_{\rm SF}$ fixes $d$: low-fault-energy metals (silver, gold, brass) have wide stacking faults, high-energy ones (aluminium) have partials so close that they re-combine. Wide faults hinder cross-slip, which requires local constriction of the dissociated screw segment, which governs work-hardening rate and the ductility of fcc alloys. The stacking letters in the picture are computed from the actual displacements, not typed in.`,
      caption: String.raw`Drag the orange handle to set the separation of the two partials (or press *equilibrium*): the layers above the slip plane are shifted by one partial in between, and the letters below give the stacking sequence in the three regions; layers whose neighbours above and below have the same letter are hcp-like (orange). The right panel balances the repulsion $F(d)\propto1/d$ against $\gamma_{\rm SF}$; they cross at the equilibrium width. Use the sliders for $\gamma_{\rm SF}$, $G$, $a$ and the character of the dislocation.`,
      deps: ['mat-3.6', 'xtal-1.5'],
      refs: ['Rafaja etal2020, §11.2.1 Eq11.1–11.2; Lu etal, arXiv:cond-mat/9903440, §5.3 Eq8 and §5.2 limitations'],
      tags: ['partial dislocation', 'stacking fault', 'fcc'],
      scope: String.raw`Isotropic elasticity, straight parallel partials in an infinite crystal, constant $\gamma_{\rm SF}$. The Burgers-vector inequality alone does not guarantee a resolved split: fault energy and the full core energy matter. The continuum width estimate fails when the separation approaches the core width. The stacking-fault energy is a free illustrative input, not a table of measured values; the defaults ($G=45$ GPa, $a=0.3615$ nm, $\nu=0.34$, $\gamma_{\rm SF}=45$ mJ/m²) are copper-like and illustrative.`,
      viz(v) {
        const NU = 0.34;
        const gS = v.slider('stacking-fault energy $\\gamma_{\\rm SF}$ (mJ/m²)', 8, 250, 45, { log: true, sig: 2 });
        const GS = v.slider('shear modulus $G$ (GPa)', 20, 80, 45, { step: 1 });
        const aS = v.slider('lattice constant $a$ (nm)', 0.35, 0.42, 0.3615, { step: 0.0005 });
        const kind = v.select('full dislocation', [{ value: 'edge', label: 'edge' }, { value: 'screw', label: 'screw' }], 'edge');
        const dEq = () => { const G = GS.value * 1e9, bp = (aS.value * 1e-9) / S6, fac = kind.value === 'edge' ? (2 + NU) / (1 - NU) : (2 - 3 * NU) / (1 - NU); return ((G * bp * bp) / (8 * Math.PI * gS.value * 1e-3)) * fac * 1e9; }; // nm
        const Pn = () => (aS.value * S6) / 2; // nm per layer repeat
        let sep = 7; // in units of the repeat
        v.button('equilibrium', () => { sep = dEq() / Pn(); hd.set(Math.max(0.005, sep / 2), 8.6); });
        const A = v.stage({ x: [-14, 14], y: [-1.6, 10.4], equal: true, axes: false, height: 380, weight: 1.4, title: 'stacking of the (111) layers across the two partials' });
        const B = v.stage({ x: [0.3, 40], y: [0, 2.6], xlog: true, axes: 'box', gutter: true, height: 380, weight: 0.9, minWidth: 270, xlabel: 'separation of the partials  $d$ (nm)', ylabel: 'force per length (× $\\gamma_{\\rm SF}$)', title: 'repulsion against fault tension' });
        const hd = A.handle(3.5, 8.6, { color: 'orange', r: 9, constrain: (x) => [clamp(x, 0.005, 100), 8.6] });
        const Fc = () => { const G = GS.value * 1e9, bp = (aS.value * 1e-9) / S6, c = kind.value === 'edge' ? (2 + NU) / (8 * Math.PI * (1 - NU)) : (2 - 3 * NU) / (8 * Math.PI * (1 - NU)); return (G * bp * bp * c); }; // J/m  : F(d) = Fc/d
        let info = null;
        v.render(() => {
          sep = clamp(hd.x * 2, 0.01, 200); hd.set(sep / 2, 8.6);
          const span = Math.max(14, sep / 2 + 8); A.setView([-span, span], [-1.6, 10.4]);
          const xa = -sep / 2, xb = sep / 2, zeta = 0.8, delta = 1 / 3, dy = 1.1, y0 = 1.8;
          const shiftAt = (x) => (delta * (Math.atan((x - xa) / zeta) - Math.atan((x - xb) / zeta))) / Math.PI;
          const idx = (n, sh) => (((Math.round((n * delta + sh) / delta)) % 3) + 3) % 3;
          const sequences = (x) => { const sh = shiftAt(x), L = []; for (let n = 0; n < 6; n++) L.push('ABC'[idx(n, n >= 3 ? sh : 0)]); return L; };
          for (let n = 0; n < 6; n++) {
            const y = y0 + n * dy;
            for (let k = -Math.ceil(span)-2; k <= Math.ceil(span)+2; k++) {
              const xx = k + ((n * delta) % 1), sh = n >= 3 ? shiftAt(xx) : 0, c = ['accent', 'green', 'red'][idx(n, sh)];
              A.dot(xx + sh, y, { r: 4.6, color: c, fill: c, alpha: 0.9 });
            }
          }
          A.line(-14, y0 + 2.5 * dy, 14, y0 + 2.5 * dy, { color: 'orange', dash: [5, 4], alpha: 0.8 }); A.text('slip plane', -13.8, y0 + 2.5 * dy + 0.45, { color: 'orange', size: 11, align: 'left' });
          A.vline(xa, { color: 'muted', dash: [3, 4], alpha: 0.8 }); A.vline(xb, { color: 'muted', dash: [3, 4], alpha: 0.8 });
          A.text('trailing partial', xa, 0.4, { size: 11, color: 'muted' }); A.text('leading partial', xb, 0.4, { size: 11, color: 'muted', align:'right' });
          A.arrow(xa, 8.2, xb, 8.2, { color: 'orange', both: true, head: 7, width: 2 }); A.text(`d = ${v.fix(sep * Pn(), 1)} nm`, 0, 7.75, { color: 'orange', size: 12 });
          const regions = [[-sep / 2 - 4, 'perfect (slipped by $b$)'], [0, 'stacking fault'], [sep / 2 + 4, 'perfect (unslipped)']];
          const seqs = regions.map(([x]) => sequences(x));
          regions.forEach(([x, lab], r) => { const L = seqs[r]; A.text(L.join(' '), clamp(x, -11.5, 11.5), 9.4, { size: 13, weight: 700, color: r === 1 ? 'orange' : 'ink' }); });
          // hcp-like layers in the fault region
          const Lf = seqs[1], hcp = []; for (let n = 1; n < 5; n++) if (Lf[n - 1] === Lf[n + 1]) hcp.push(n);
          hcp.forEach((n) => A.rect(-sep / 2 + 0.3, y0 + n * dy - 0.5, sep / 2 - 0.3, y0 + n * dy + 0.5, { fill: 'orange', fillAlpha: 0.22, stroke: false }));
          // force balance
          const Fn = Fc(), g = gS.value * 1e-3;
          const xmax = Math.max(40, dEq() * 1.5, sep * Pn() * 1.5); const xmin=Math.min(.3,dEq()*.5,sep*Pn()*.5); B.setView([xmin, xmax], [0, 2.6]);
          B.fn((d) => (Fn / (d * 1e-9)) / g, { color: 'accent', width: 2.5, domain: [xmin, xmax] });
          B.hline(1, { color: 'orange', width: 2.5 });
          const de = dEq(); B.vline(de, { color: 'green', dash: [4, 4] }); B.dot(de, 1, { r: 6, color: 'green', fill: 'green' });
          B.text('equilibrium', xmax*.9, 0.12, { color: 'green', size: 11, align: 'right' });
          const dn = sep * Pn(); B.dot(dn, (Fn / (dn * 1e-9)) / g, { r: 7, color: 'orange', hollow: true, width: 2 });
          B.text('elastic repulsion $\\propto 1/d$', 0.5, 2.3, { color: 'accent', size: 11.5, align: 'left' }); B.text('fault tension $\\gamma_{\\rm SF}$', 0.5, 0.82, { color: 'orange', size: 11.5, align: 'left' });
          info = { de, dn, dsep: sep, seqs, ratio: (Fn / (dn * 1e-9)) / g, hcp };
        });
        v.readout(() => info ? `Equilibrium separation $d=${v.fix(info.de, 2)}$ nm $=${v.fix(info.de / ((aS.value / S6)), 1)}\\,b_p$ ($b_p=a/\\sqrt6=${v.fix((aS.value / S6), 3)}$ nm). Current $d=${v.fix(info.dn, 2)}$ nm: repulsion is ${v.fix(info.ratio, 2)} times the fault tension, so the partials ${info.ratio > 1.02 ? 'move apart' : info.ratio < 0.98 ? 'are pulled together' : 'are at rest'}.\nStacking: perfect ${info.seqs[0].join('')}, fault ${info.seqs[1].join('')} (${info.hcp.length} hcp-like layers), perfect ${info.seqs[2].join('')}.` : '');
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'The mechanism of plastic deformation of crystals',
      statement: String.raw`In 1934 G. I. Taylor proposed, in the first of two papers in the *Proceedings of the Royal Society*, that crystals slip not by sliding whole planes over one another but by the motion of line defects, to which he gave the name **dislocations**: slip spreads over limited areas of a plane and is bounded by a dislocation, which can move under a small applied stress; the work-hardening of metals is then the result of dislocations obstructing one another. The same idea was put forward independently in 1934 by Orowan and by Polanyi. It resolved the gap between the stress for rigid slip ($\sim G/10$, 3.1) and the measured yield stress of metal crystals.`,
      idea: String.raw`Before 1934 the strength of crystals was a puzzle: Frenkel's calculation (1926) of the shear stress needed to slip one plane over another gave values hundreds to thousands of times larger than measured, and lattice models offered no way for slip to start gradually. Taylor argued, with a lattice model of atoms interacting through a plausible force law, that a row of atoms inserted into one half of the crystal is a stable defect whose motion needs only a small stress, because only atoms near the core need rearrange (3.2), and that such defects interacting at long range could explain strain hardening ($\sigma\propto\sqrt\rho$, 3.8). Part II of the paper compares the theory with observations on single crystals. The paper's own numbers and figures are not reproduced here; the picture is a modern one-dimensional model of the same argument.`,
      caption: String.raw`A chain of atoms (blue) sits on a periodic substrate (the next plane); the chain has one atom more than the substrate has wells, which is the one-dimensional picture of an inserted half-plane: a **kink** (dislocation). The plane stiffness $K$ sets the kink's width. Push on every atom with a force $f$ (as a fraction of the rigid-slip force $f_{\rm rigid}=\pi V_0/b$, the largest force the substrate resists): the kink holds until $f$ reaches its depinning value, shown in the readout and the right panel, with a reduction that depends on the kink width. *Compute curve* sweeps $K$ and plots the threshold against the kink width.`,
      deps: ['mat-3.1', 'mat-3.4'],
      refs: [],
      tags: ['dislocation', 'Frenkel–Kontorova', 'history'],
      paper: { authors: 'G. I. Taylor', year: 1934, title: 'The Mechanism of Plastic Deformation of Crystals. Part I.—Theoretical', venue: 'Proceedings of the Royal Society of London A 145 (855): 362–387', doi: '10.1098/rspa.1934.0106' },
      introduces: ['mat-3.2', 'mat-3.8'],
      credit: 'G. I. Taylor, 1934; independently E. Orowan and M. Polanyi, 1934',
      scope: String.raw`This is a reconstruction in the Frenkel–Kontorova model (harmonic chain on a sinusoidal substrate), which dates from 1938 and is not Taylor's own interatomic-force model or data; I could not read the original text, so the description of the paper's content comes from secondary sources and is hedged accordingly. The reported threshold is an operational finite-chain criterion: residual force above10⁻⁷ after8000iterations or a maximum atomic displacement above0.4b, located by bisection. Failure to converge alone is not proof of unbounded motion; the model shows the qualitative claim only, that increasing the kink width can reduce the force needed to move it, not Taylor's numbers.`,
      verify: true,
      viz(v) {
        const NA = 40, V0 = 1;
        const Ks = v.slider('plane stiffness $K/V_0$ (in units of $b^2$)', 0.25, 8, 1.5, { log: true, sig: 2, onChange: () => { cache = null; } });
        const fS = v.slider('applied force $f/f_{\\rm rigid}$', 0, 1.05, 0.2, { step: 0.001 });
        // gradient: K (2x_i - x_{i-1} - x_{i+1}) + π sin(2π x_i) - f
        const relax = (x, K, f, maxIt = 6000) => {
          const n = x.length, v1 = new Float64Array(n), mu = 1 / (4 * K + 20); let it = 0, gmax = 1;
          for (; it < maxIt; it++) {
            gmax = 0;
            for (let i = 1; i < n - 1; i++) { const g = K * (2 * x[i] - x[i - 1] - x[i + 1]) + Math.PI * Math.sin(2 * Math.PI * x[i]) - f; gmax = Math.max(gmax, Math.abs(g)); v1[i] = 0.9 * v1[i] - mu * g; }
            for (let i = 1; i < n - 1; i++) x[i] += v1[i];
            if (gmax < 1e-10) break;
          }
          return { gmax, it };
        };
        const kinkInit = () => { const x = new Float64Array(NA); for (let i = 0; i < NA; i++) { const t = clamp((i - NA / 2) / 6 + 0.5, 0, 1); x[i] = i - t; } x[0] = 0; x[NA - 1] = NA - 2; return x; };
        const xk = (x) => { let X = 0; for (let i = 0; i < x.length; i++) X -= x[i] - i; return X; };
        const width = (x) => { // distance between s = -0.1 and s = -0.9
          const s = Array.from(x, (q, i) => q - i); const at = (lvl) => { for (let i = 1; i < s.length; i++) if (s[i - 1] > lvl && s[i] <= lvl) return i - 1 + (s[i - 1] - lvl) / (s[i - 1] - s[i]); return NaN; };
          return at(-0.9) - at(-0.1);
        };
        const solve0 = (K) => { const x = kinkInit(); relax(x, K, 0, 20000); return x; };
        const threshold = (K) => {
          const x0 = solve0(K), X0 = xk(x0);
          const moved = (f) => { const x = Float64Array.from(x0); const r = relax(x, K, f, 8000); let dm = 0; for (let i = 0; i < NA; i++) dm = Math.max(dm, Math.abs(x[i] - x0[i])); return r.gmax > 1e-7 || dm > 0.4; };
          let lo = 1e-9, hi = Math.PI * 0.99;
          if (!moved(hi)) return { f: hi, w: width(x0) };
          for (let k = 0; k < 24; k++) { const mid = Math.sqrt(lo * hi); if (moved(mid)) hi = mid; else lo = mid; }
          return { f: Math.sqrt(lo * hi), w: width(x0) };
        };
        let cache = null; const curve = []; let timer = null; v.onCleanup(() => clearTimeout(timer));
        const A = v.stage({ x: [0, NA - 2], y: [-0.2, 0.95], axes: false, height: 250, weight: 1.6, full: true, title: 'chain of atoms on the next plane (extra atom = kink)' });
        const B = v.stage({ x: [0.6, 8], y: [1e-4, 2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, full: true, xlabel: 'kink width  $w/b$', ylabel: 'depinning force / rigid-slip force', title: 'threshold against kink width' });
        const startSweep = () => { curve.length = 0; const todo = [0.25, 0.5, 1, 1.6, 2.5, 4, 6.5, 10, 16]; const step = () => { const K = todo.shift(); if (K === undefined) return; const r = threshold(K); curve.push({ K, w: r.w, y: r.f / Math.PI }); v.invalidate(); timer = setTimeout(step, 5); }; step(); };
        v.button('Compute curve (sweeps K)', startSweep);
        timer = setTimeout(startSweep, 20);
        v.render(() => {
          const K = Ks.value;
          if (!cache) { const x0 = solve0(K), th = threshold(K); cache = { x0, th, X0: xk(x0), w: width(x0) }; }
          const f = fS.value * Math.PI, x = Float64Array.from(cache.x0), r = relax(x, K, f, 8000);
          let dm = 0; for (let i = 0; i < NA; i++) dm = Math.max(dm, Math.abs(x[i] - cache.x0[i])); const moved = r.gmax > 1e-7 || dm > 0.4;
          // substrate and atoms
          A.fn((q) => 0.45 * (1 - Math.cos(2 * Math.PI * q)), { color: 'muted', width: 1.5, alpha: 0.7, domain: [0, NA - 2] });
          for (let i = 0; i < NA - 1; i++) A.line(x[i], 0.45 * (1 - Math.cos(2 * Math.PI * x[i])) + 0.07, x[i + 1], 0.45 * (1 - Math.cos(2 * Math.PI * x[i + 1])) + 0.07, { color: 'faint', width: 1.2 });
          for (let i = 0; i < NA; i++) { const s = x[i] - i, c = v.diverge(clamp(s * 1.2 + 0.6, -1, 1), 'orange', 'accent'); A.dot(x[i], 0.45 * (1 - Math.cos(2 * Math.PI * x[i])) + 0.07, { r: 5.5, color: c, fill: c }); }
          if (f > 0) A.arrow(NA - 12, 0.85, NA - 8, 0.85, { color: 'red', width: 2 + 8 * fS.value, head: 9 });
          A.text('force on every atom', NA - 10, 0.92, { color: 'red', size: 11 });
          // threshold plot
          for (const p of curve) B.dot(p.w, p.y, { r: 5, color: 'accent', fill: 'accent' });
          if (curve.length >= 2) { const lr = v.M.linreg(curve.map((p) => p.w), curve.map((p) => Math.log(p.y))); B.fn((q) => Math.exp(lr.intercept + lr.slope * q), { color: 'green', width: 2, dash: [5, 4], domain: [Math.min(...curve.map((p) => p.w)), Math.max(...curve.map((p) => p.w)) + 1.5] }); cache.slope = lr.slope; }
          B.hline(1, { color: 'red', width: 2 }); B.text('rigid slip of the whole chain', 1.0, 1.4, { color: 'red', size: 11.5, align: 'left' });
          B.dot(cache.w, cache.th.f / Math.PI, { r: 8, color: 'orange', hollow: true, width: 2.2 });
          cache.state = { moved, f, ratio: f / cache.th.f };
        });
        v.readout(() => {
          if (!cache || !cache.state) return '';
          const st = cache.state;
          return `Kink width $w=${v.fix(cache.w, 2)}\\,b$ at $K=${v.fix(Ks.value, 2)}$: the kink crosses the model movement criterion at $f=${v.sci(cache.th.f / Math.PI, 2)}\\,f_{\\rm rigid}$, i.e. rigid slip needs ${v.fmt(Math.PI / cache.th.f, 3)} times more force per atom. At the applied $f=${v.fix(fS.value, 3)}\\,f_{\\rm rigid}$ the kink ${st.moved ? 'crosses the finite-chain movement criterion' : 'stays pinned'}.` + (cache.slope ? `\nSweep: $\\ln(f_{\\rm kink}/f_{\\rm rigid})$ falls by $${v.fix(-cache.slope, 2)}$ per unit of kink width ($b$), so a wider kink (stiffer planes) is exponentially easier to move: the Peierls–Nabarro trend.` : '');
        });
      },
    },
  ],
};
