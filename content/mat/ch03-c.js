import taylorPaper from './taylor-paper-item.js';
// Materials Science — Chapter 3, part c: items 3.11–3.13 (deformation twinning, partial dislocations, Taylor's 1934 paper)
import { edgeU } from './ch03.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const S3 = Math.sqrt(3);
import { twinSpacing, twinLayerShift, rowPhase, twinRowPhase, mirrorRowError, rowSites, hcpSignedShear, partialBalance, stackingRegistry } from './source-audit-dislocation-microstructure.shared.js';

import { chainInitial, relaxChain, chainWidth } from './source-audit-finite-chain.shared.js';

export default {
  collection: 'mat',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Phenomenon',
      name: 'Deformation twinning',
      statement: String.raw`A **deformation twin** is a reoriented crystal region whose shape change is a simple shear $S=I+s\,\ell\otimes n$ with $\ell\cdot n=0$. Classical type-I twins have a reflection orientation relation across the twin plane; type-II and nonclassical modes need not. The usual fcc $\{111\}\langle112\rangle$ and bcc $\{112\}\langle111\rangle$ modes have shear magnitude $1/\sqrt2$. The hcp $\{10\bar12\}$ mode has signed shear $(\gamma^2-3)/(\sqrt3\gamma)$, $\gamma=c/a$, in the convention of Christian–Mahajan Eq.(28); its direction reverses at $\sqrt3$. Hcp requires additional atomic shuffles. A vanishing geometric shear is not evidence of a physically easy zero-cost twin.`,
      idea: String.raw`For the illustrated fcc variant take $n=[111]/\sqrt3$ and $\ell=[11\bar2]/\sqrt6$. Adjacent $(111)$ planes are $a/\sqrt3$ apart, and the twinning shift per layer is $a/\sqrt6$, giving $s=1/\sqrt2$. In the projection along $[1\bar10]$, row $m$ has phase $ma/\sqrt6$ modulo $P=\sqrt6a/4$. Applying the full shear sends its phase onto that of the reflected row $2m_0-m$, because their difference is an integer multiple of $P$. This is a lattice correspondence, not a kinetic theory of nucleation or a proof that arbitrary lattice planes can twin.`,
      caption: String.raw`Raise $f$ to 1 to form the selected fcc reflection twin. Orange rows inside the band shear; the upper matrix translates rigidly. Hollow sites are generated from the infinite reflected lattice, even when the corresponding parent row lies outside the visible window. The readout counts visible orange sites using an exact row-phase criterion. Thickness and position change the visible window. The right graph gives shear magnitudes, not a prediction of whether a twin will nucleate.`,
      deps: ['mat-3.4', 'xtal-9.4'],
      refs: ['Christian–Mahajan (1995), §§2.1, 2.5, 2.7, Eq.(28), pp5–8, 14–19, 23–30; DOI:10.1016/0079-6425(94)00007-7'],
      tags: ['twinning', 'shear', 'plasticity'],
      scope: String.raw`Christian–Mahajan, Deformation Twinning (1995), complete crystallographic treatments §§2.1,2.5,2.7, especially Eq.(28), pp5–8,14–19,23–30. The left panel is a projected ideal fcc lattice at an assumed scale a=1; intermediate shear fractions are not equilibrium atomic structures. No nucleation mechanism, dislocation-source independence, universal strain-rate trend or measured metal parameter is asserted. The hcp mode includes shuffles not drawn here. Near c/a=√3 the formula is geometrically degenerate; the source reports no such twins near the critical alloy composition.`,
      viz(v) {
        const fS = v.slider('twin shear fraction $f$', 0, 1, 1, { step: 0.01 });
        const tS = v.slider('twin thickness (layers)', 1, 9, 5, { int: true });
        const p0 = v.slider('lower twin plane (layer)', -6, 2, -3, { int: true });
        const mir = v.toggle('show mirror image of the parent', true);
        const cS = v.slider('hcp  $c/a$', 1.4, 1.95, 1.624, { step: 0.001 });
        const A = v.stage({ x: [-6.2, 6.2], y: [-4.4, 4.4], equal: true, axes: false, height: 420, weight: 1.45, title: 'fcc crystal, (111) layers seen edge-on' });
        const B = v.stage({ x: [1.4, 1.95], y: [0, 0.9], axes: 'box', gutter: true, height: 420, weight: 0.85, minWidth: 270, xlabel: 'axial ratio  $c/a$ (hcp)', ylabel: 'twinning shear  $s$', title: 'twinning shear' });
        const sHcp = g => Math.abs(hcpSignedShear(g));
        v.button('geometric zero: c/a = √3', () => { cS.input.step = 'any'; cS.set(S3); });
        let info = null;
        v.render(() => {
          const m0 = p0.value, m1 = m0 + tS.value, f = fS.value;
          const delta = twinLayerShift, sTw = delta / twinSpacing, y0 = m0 * twinSpacing;
          const mmin = m0 - 2, mmax = m1 + 2;
          A.setView([-6.2, 6.2], [(mmin - .8) * twinSpacing, (mmax + .8) * twinSpacing]);
          let onMirror = 0, tot = 0;
          for (let m = mmin; m <= mmax; m++) {
            const twin = m > m0 && m <= m1;
            if (mir.value && twin) for (const [x, y] of rowSites(m, rowPhase(2 * m0 - m), -6.05, 6.05)) A.dot(x, y, { r: 9, color: 'ink', hollow: true, width: 1.2, alpha: .7 });
            const phase = twin ? twinRowPhase(m, m0, f) : rowPhase(m) + (m > m1 ? f * delta * (m1 - m0) : 0);
            for (const [x, y] of rowSites(m, phase, -6.05, 6.05)) {
              A.dot(x, y, { r: 5.5, color: twin ? 'orange' : 'accent', fill: twin ? 'orange' : 'accent' });
              if (twin) { tot++; if (mirrorRowError(m, m0, f) < 1e-10) onMirror++; }
            }
          }
          A.hline(y0, { color: 'red', dash: [5, 4], alpha: .8 }); A.hline(m1 * twinSpacing, { color: 'red', dash: [5, 4], alpha: .8 });
          A.text('twin plane', -6, y0 + .2, { color: 'red', size: 11, align: 'left' });
          // hcp panel
          B.fn(sHcp, { color: 'ink', width: 2.5, domain: [1.4, 1.95] });
          B.hline(1 / Math.SQRT2, { color: 'accent', dash: [5, 4], width: 1.6 }); B.text('fcc and bcc: $1/\\sqrt2$', 1.41, 0.74, { color: 'accent', size: 11.5, align: 'left' });
          B.vline(S3, { color: 'muted', dash: [3, 4] }); B.text('$\\sqrt3$', S3 + 0.005, 0.05, { color: 'muted', size: 11, align: 'left' });
          B.dot(cS.value, sHcp(cS.value), { r: 7, color: 'orange', fill: 'orange' });
          B.text('s < 0', 1.51, .36, { color: 'muted', size: 10.5 }); B.text('s > 0', 1.82, .36, { color: 'muted', size: 10.5 });
          info = { sTw, onMirror, tot, f, sh: sHcp(cS.value), delta, g: cS.value };
        });
        v.readout(() => info ? `Ideal fcc correspondence: per-layer shift $a/\\sqrt6=${v.fix(info.delta, 3)}a$, shear $s=${v.fix(info.sTw, 3)}$. At $f=${v.fix(info.f, 2)}$, ${info.onMirror} of ${info.tot} visible twin sites match reflected row phases (tolerance 10⁻¹⁰a).\nhcp magnitude at $c/a=${v.fix(info.g, 6)}$: $s=${v.fix(info.sh, 6)}$. ${Math.abs(info.g - S3) < .001 ? 'Near the geometric degeneracy: zero shear does not imply a realizable zero-cost twin.' : 'The signed shear reverses at c/a=√3; atomic shuffles are not pictured.'}` : '');
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Concept',
      name: 'Partial dislocations and stacking faults',
      statement: String.raw`In an fcc $(111)$ plane the vector identity $\tfrac a2[\bar101]=\tfrac a6[\bar211]+\tfrac a6[\bar1\bar12]$ permits two **Shockley partials**, each of magnitude $b_p=a/\sqrt6$. The smaller sum of squared Burgers vectors favors splitting in a simple line-energy estimate; it does not alone include the stacking-fault cost or core structure. Between separated partials an intrinsic stacking-fault ribbon costs $\gamma_{\rm SF}$ per area. For straight parallel partials in isotropic elasticity, no external Escaig stress and positive constant $\gamma_{\rm SF}$, balancing their elastic repulsion against fault tension gives $$\begin{gathered}d_{\rm eq}=\frac{Gb_p^2}{8\pi\gamma_{\rm SF}}\frac{2+\nu}{1-\nu}\\(\text{full edge}),\\d_{\rm eq}=\frac{Gb_p^2}{8\pi\gamma_{\rm SF}}\frac{2-3\nu}{1-\nu}\\(\text{full screw}).\end{gathered}$$`,
      idea: String.raw`For parallel lines the interaction force per length is $F=G[b_{1s}b_{2s}+b_{1e}b_{2e}/(1-\nu)]/(2\pi d)$. For a full edge, the partial edge components are both $\sqrt3b_p/2$ and the screw components are opposite $\pm b_p/2$. For a full screw these roles interchange. Thus $F=C/d$ with C positive; the separation-dependent energy per line length is $U=-C\log(d/d_0)+\gamma_{\rm SF}d$. Its unique minimum is $C/\gamma_{\rm SF}$, and its curvature is $C/d^2>0$. This isolated continuum estimate becomes unreliable when the separation approaches the partial-core scale.

For positive separation and the stated positive constants, $U(d)=-C\log(d/d_0)+\gamma_{\rm SF}d$ is smooth. An interior minimizing separation must satisfy $U\prime(d)=0$ by pma 5.8, giving $d=C/\gamma_{\rm SF}$. Here $U\prime\prime=C/d^2>0$ everywhere, and the endpoint energies diverge, so this stationary point is the unique minimum of this isolated model. These checks establish more than stationarity; omitted core, anisotropy, applied stress and finite-grain effects remain outside the estimate.`,
      caption: String.raw`Drag the orange handle to change the physical separation d, or press equilibrium to place it at the computed force balance. The left panel is an explicitly schematic registry diagram: perfect ABCABC on either side, ABCBCA inside the fault, with two hcp-like layers. The letters encode stacking relations, not relaxed atom coordinates or a resolved dislocation core. The force graph uses d in nm and adapts its range to include the current and equilibrium widths.`,
      deps: ['mat-3.6','xtal-1.5','pma-5.8'],
      refs: ['Föll, Defects in Crystals §§5.2.2, 5.2.5, 5.4.1; Bower, Applied Mechanics of Solids §5.8.1', 'W.D. Nix, Partial Dislocation Tutorial for FCC Metals, pp1–8', 'Shehadeh et al. (2007), Appl.Phys.Lett.91,171905, DOI:10.1063/1.2799246'],
      tags: ['partial dislocation', 'stacking fault', 'fcc'],
      scope: String.raw`The force follows the parallel edge/screw decomposition in Föll, Defects in Crystals §5.2.5, combined with isotropic elastic energetics (Bower §5.8.1); the balance is derived explicitly above. Nix, Partial Dislocation Tutorial for FCC Metals, pp1–8, treats the Shockley geometry and line-character conventions. Shehadeh et al. (2007), full original three-page article, demonstrates why other slip planes, pinning and applied Escaig stress can change the isolated balance; these effects are omitted here. Sliders and defaults are synthetic positive model parameters, not measured copper or any metal calibration. Stacking letters are a schematic intrinsic-fault registry; core relaxation, anisotropy, finite grains and kinetics are not solved.`,
      viz(v) {
        const NU = 0.34;
        const gS = v.slider('stacking-fault energy $\\gamma_{\\rm SF}$ (mJ/m²)', 8, 250, 45, { log: true, sig: 2 });
        const GS = v.slider('shear modulus $G$ (GPa)', 20, 80, 45, { step: 1 });
        const aS = v.slider('lattice constant $a$ (nm)', 0.35, 0.42, 0.3615, { step: 0.0005 });
        const kind = v.select('full dislocation', [{ value: 'edge', label: 'edge' }, { value: 'screw', label: 'screw' }], 'edge');
        const model = () => partialBalance(GS.value, aS.value, gS.value, kind.value, NU);
        const A = v.stage({ x: [-10, 10], y: [-1, 9], axes: false, height: 380, weight: 1.4, title: 'schematic stacking registry (horizontal position in nm)' });
        const B = v.stage({ x: [.1, 40], y: [0, 2.6], xlog: true, axes: 'box', gutter: { l: 68 }, height: 380, weight: .9, minWidth: 270, xlabel: 'partial separation d (nm)', ylabel: 'force / fault tension', title: 'isolated elastic balance' });
        let extent = 10;
        const hd = A.handle(1.5, 7.4, { color: 'orange', r: 9, constrain: x => [clamp(x, .025, extent * .8), 7.4] });
        v.button('equilibrium', () => { const d = model().equilibrium; extent = Math.max(5, d); hd.set(d / 2, 7.4); });
        let info = null;
        v.render(() => {
          const q = model(), dn = hd.x * 2, de = q.equilibrium;
          extent = Math.max(5, de, dn);
          A.setView([-extent, extent], [-1, 9]);
          const xa = -dn / 2, xb = dn / 2;
          const fault = stackingRegistry(true), perfect = stackingRegistry(false);
          A.rect(xa, .5, xb, 6.5, { fill: 'orange', fillAlpha: .12, stroke: false });
          const xs = [(-extent + xa) / 2, 0, (extent + xb) / 2];
          for (let n = 0; n < 6; n++) for (let r = 0; r < 3; r++) {
            const L = r === 1 ? fault : perfect, y = 1 + n * .9;
            A.text(L.letters[n], xs[r], y, { size: 18, weight: 700, color: r === 1 && fault.hcp.includes(n) ? 'orange' : 'accent' });
          }
          A.line(-extent * .95, 3.25, extent * .95, 3.25, { color: 'orange', dash: [5, 4] });
          A.text('full slip b', xs[0], .1, { size: 10, color: 'muted' }); A.text('fault', 0, .1, { size: 10, color: 'orange' }); A.text('unslipped', xs[2], .1, { size: 10, color: 'muted' });
          A.line(xa, .5, xa, 6.5, { color: 'muted', dash: [3, 4] }); A.line(xb, .5, xb, 6.5, { color: 'muted', dash: [3, 4] });
          A.arrow(xa, 6.9, xb, 6.9, { color: 'orange', both: true, head: 7, width: 2 });
          A.text(`d = ${v.fix(dn, 2)} nm`, 0, 8.2, { color: 'orange', size: 12 });
          const xmin = Math.min(de, dn) / 2, xmax = Math.max(de, dn) * 2;
          const ymax = Math.max(2.6, q.ratio(xmin) * 1.12);
          B.setView([xmin, xmax], [0, ymax]);
          B.fn(q.ratio, { color: 'accent', width: 2.5, domain: [xmin, xmax] }); B.hline(1, { color: 'orange', width: 2.5 });
          B.vline(de, { color: 'green', dash: [4, 4] }); B.dot(de, 1, { r: 6, color: 'green', fill: 'green' });
          B.dot(dn, q.ratio(dn), { r: 7, color: 'orange', hollow: true, width: 2 });
          info = { de, dn, ratio: q.ratio(dn), bp: q.bp };
        });
        v.readout(() => info ? `Isolated continuum balance: equilibrium d=${v.fix(info.de, 3)} nm = ${v.fix(info.de / info.bp, 1)} partial Burgers vectors. Current d=${v.fix(info.dn, 3)} nm; repulsion / fault tension=${v.fix(info.ratio, 3)}. ${Math.abs(info.ratio - 1) < .001 ? 'Force balance.' : info.ratio > 1 ? 'Net force favors separation.' : 'Net force favors contraction.'}\nSchematic registries: ABCABC / ABCBCA / ABCABC; two hcp-like middle layers. ${info.de / info.bp < 5 ? 'Core-scale separation: this continuum estimate is not quantitatively reliable.' : 'No other lines, boundaries, anisotropy or external Escaig stress.'}` : '');
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.13
    taylorPaper,
  ],
};
