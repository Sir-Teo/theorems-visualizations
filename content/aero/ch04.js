// Aerospace Engineering — Chapter 4: Compressibility and high-speed flight (items 4.1-4.4; 4.5-4.8 are in ch04-b.js)
//
// Sources and what is from memory (Oct 2026). "checked" = confirmed against the cited record during writing.
//   4.1 Full Glauert1928 original pp113–119 read in the public library scan, IA in.ernet.dli.2015.240251; §3 pp117–119/Eq16 and limitations visually checked.
//       Karman–Tsien matches full Spreiter–Alksne NACA TN3970 pp16–18, Eqs32–36.
//       Laitone1951 full one-page original p350, Eq7, read and visually inspected in public IA issue sim_journal-of-the-aerospace-sciences_1951-05_18_5, leaf65.
//       Both higher corrections remain comparison models; the incompressible Cp comes from this atlas's panel method (chapter 1), not measured data.
//       Critical pressure coefficient: Cp* = 2/(gamma M^2) [((1 + 0.2 M^2)/1.2)^3.5 - 1], derived from the isentropic relations and recomputed in the readout.
//   4.2,4.3 Reviewed2026-10-18: Mason Configuration Aerodynamics §§7.2,7.4.3,7.5.2, Eqs7-2–7-9; full Jones NACA TN1033 pp1–7 for normal flow and sweep history.
//   4.4 Reviewed2026-10-18: full Sheppard ARC R&M3077 §§2.1–2.3.1,4.2; correct Fourier coefficients are those of area slope, not area.
//       Wing positions keep remaining fuselage area nonnegative; each setting's minimum uses its current volume. See docs/verification/aero-ch04.md.


import {
  clamp, DEG, atmo, naca4, panelModel, panelSolve, cpCrit, machFromCp, pgCorr, ktCorr, laitoneCorr, machCritical,
  LBODY, fusIdeal, wingHump, areaCoeffs, dragOfK, sears,
} from './ch04.shared.js';

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '\u2212');

// ═════════════════════════════════════════════════════════════════════ helpers (4.1, 4.2)
const foilCache = new Map();
/** Symmetric NACA 00xx section with its panel model (cached). */
function foil(t) {
  let o = foilCache.get(t);
  if (!o) { const pts = naca4(0, 0, t, 70); o = { pts, model: panelModel(pts), t }; foilCache.set(t, o); }
  return o;
}
/** Incompressible Cp at the panel centres for angle of attack alpha (deg): arrays xs, cp (lower surface then upper), plus the suction peak and CL. */
function cp0Dist(t, alphaDeg) {
  const f = foil(t), s = panelSolve(f.model, alphaDeg * DEG);
  let imin = 0; for (let i = 0; i < s.cp.length; i++) if (s.cp[i] < s.cp[imin]) imin = i;
  return { xs: Array.from(f.model.cx), cps: Array.from(s.cp), cpmin: s.cp[imin], xmin: f.model.cx[imin], cl: s.cl, up: f.model.cy.map((y, i) => y > 0 || i >= f.model.N / 2) };
}
const LAWS = { pg: pgCorr, kt: ktCorr, lait: laitoneCorr };
/** Korn drag-divergence Mach number and Lock wave-drag rise (see header). */
export const KORN_OFFSET = Math.pow(0.1 / 80, 1 / 3);
export const mddKorn = (kappa, tc, cl, sweep) => { const c = Math.cos(sweep); return kappa / c - tc / (c * c) - Math.abs(cl) / (10 * c ** 3); };
export const cdWave = (M, mcrit) => (M > mcrit ? 20 * (M - mcrit) ** 4 : 0);
const CD0_MODEL = 0.008;

export default {
  collection: 'aero',
  chapter: 4,
  title: 'Compressibility and high-speed flight',
  summary: String.raw`As flight speed approaches the speed of sound, air compresses noticeably: pressure coefficients grow, local supersonic regions appear and shock waves bring a steep rise in drag. Simple corrections handle subsonic compressibility, swept wings and the area rule delay the drag rise, and in supersonic flow oblique shocks and expansion fans replace smooth turning. At hypersonic speeds, heating becomes the dominant design problem.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Prandtl–Glauert compressibility correction',
      statement: String.raw`For a thin airfoil at a small angle of attack in subsonic flow at free-stream Mach number $M_\infty<1$, linearised potential-flow theory gives the pressure coefficient and the lift and moment coefficients in terms of their incompressible values (subscript 0):
$$C_p=\frac{C_{p,0}}{\sqrt{1-M_\infty^2}},\qquad c_l=\frac{c_{l,0}}{\sqrt{1-M_\infty^2}},\qquad c_{l,\alpha}=\frac{2\pi}{\sqrt{1-M_\infty^2}}.$$
The factor $1/\beta$, $\beta=\sqrt{1-M_\infty^2}$, grows without bound as $M_\infty\to1$, which is where the linearisation fails: the rule is useful up to about $M_\infty\approx0.7$ for thin sections and is not valid in transonic flow.`,
      idea: String.raw`The linearised potential equation for a small disturbance, $(1-M_\infty^2)\phi_{xx}+\phi_{yy}=0$, becomes Laplace's equation (the incompressible case) after stretching the $y$ coordinate by $\beta$. The disturbance velocity potential of the compressible flow past the original airfoil equals that of an incompressible flow past an airfoil whose thickness and incidence are reduced by the same factor, so the pressure coefficient, which is proportional to the streamwise perturbation $u'/V_\infty=\phi_x/V_\infty$, is $1/\beta$ times the incompressible value for the same shape. It builds on the speed of sound (1.6) and on the incompressible lift curve (2.2).`,
      caption: String.raw`Left: $-C_p$ round the section (grey incompressible, from the atlas's panel method; blue corrected). The red dashed line is the critical pressure coefficient $C_p^*$: blue above red crosses the predicted sonic threshold, beyond which this linear approximation is invalid. Right: the suction peak against $M_\infty$ for three correction laws (Prandtl–Glauert, Kármán–Tsien and Laitone, the last two as comparison models) and the critical value $-C_p^*(M_\infty)$; their crossing estimates the critical Mach number. Raise $M_\infty$ and watch the Prandtl–Glauert curve race ahead as $M_\infty\to1$, where it can even predict nonpositive absolute pressure.`,
      deps: ['aero-2.2', 'aero-1.6', 'pde-1.10'],
      refs: ['Glauert1928, full pp.113–119, §3/Eq.(16); public IA volume in.ernet.dli.2015.240251', 'Spreiter–Alksne, NACA TN3970, pp.16–18, Eqs.(32)–(36)', 'Laitone, New Compressibility Correction for Two-Dimensional Subsonic Flow (1951), J. Aeronaut. Sci.18(5), p.350, Eq.(7); DOI10.2514/8.1951'],
      tags: ['compressibility', 'subsonic', 'similarity'],
      scope: String.raw`Small disturbances (thin section, small incidence), subsonic and not near sonic: roughly $M_\infty\lesssim0.7$ and never close to $1$. The incompressible $C_{p,0}$ here is a full panel-method solution for a symmetric NACA 00xx section, so the 'thin' hypothesis is only approximate for the thicker sections; the Kármán–Tsien and Laitone curves are comparison models, and no experimental data are plotted.`,
      credit: 'H. Glauert, 1928 (Proc. R. Soc. A118,113–119); Ackeret (1925), NACA TM317 p.1, cites an unpublished Göttingen lecture by Prandtl',
      links: { doi: 'https://doi.org/10.1098/rspa.1928.0039', wikipedia: 'https://en.wikipedia.org/wiki/Prandtl%E2%80%93Glauert_transformation' },
      viz(v) {
        const M = v.slider('free-stream Mach number $M_\\infty$', 0.1, 0.95, 0.6, { step: 0.005 });
        const al = v.slider('angle of attack $\\alpha$ (°)', 0, 8, 3, { step: 0.1 });
        const tc = v.select('thickness', [{ value: 0.06, label: '6 %' }, { value: 0.09, label: '9 %' }, { value: 0.12, label: '12 %' }, { value: 0.18, label: '18 %' }], 0.12);
        const A = v.stage({ x: [0, 1], y: [-1, 3], axes: 'box', gutter: true, height: 330, minWidth: 320, xlabel: 'chord $x/c$', ylabel: '$-C_p$', title: 'pressure round the section' });
        const B = v.stage({ x: [0.2, 1], y: [0, 3], axes: 'box', gutter: true, height: 330, minWidth: 320, xlabel: 'Mach number $M_\\infty$', ylabel: 'suction peak $-C_p$', title: 'when does the flow reach Mach 1?' });
        let info = {};
        v.render(() => {
          const m = M.value, d = cp0Dist(+tc.value, al.value), cpm = d.cpmin, crit = cpCrit(m), pg = d.cps.map((c) => pgCorr(c, m));
          const top = Math.min(6, Math.max(2.2, -pg.reduce((a, b) => Math.min(a, b), 0) * 1.12));
          A.setView([0, 1], [-1.0, top]);
          A.hline(0, { color: 'faint', width: 1 }); A.hline(-crit, { color: 'red', dash: true, width: 1.6 });
          A.text('$-C_p^*$', 0.985, -crit + 0.1 * top / 3, { color: 'red', size: 11, align: 'right' });
          A.path(d.xs.map((x, i) => [x, -d.cps[i]]), { color: 'muted', width: 1.8 });
          A.path(d.xs.map((x, i) => [x, -pg[i]]), { color: 'accent', width: 2.6 });
          let sup = 0; for (let i = 0; i < pg.length; i++) if (pg[i] < crit) { sup++; A.dot(d.xs[i], -pg[i], { r: 2.6, color: 'orange' }); }
          const cpPG = pgCorr(cpm, m);
          // right graph
          B.setView([0.2, 1], [0, 3]);
          const ms = []; for (let k = 0; k <= 160; k++) ms.push(0.2 + 0.795 * k / 160);
          B.fn((x) => -cpCrit(x), { color: 'red', width: 2.2, domain: [0.2, 0.995] });
          B.fn((x) => -pgCorr(cpm, x), { color: 'accent', width: 2.4, domain: [0.2, 0.995] });
          B.fn((x) => -ktCorr(cpm, x), { color: 'green', width: 2, domain: [0.2, 0.995] });
          B.fn((x) => -laitoneCorr(cpm, x), { color: 'purple', width: 2, domain: [0.2, 0.995] });
          const mc = { pg: machCritical(cpm, pgCorr), kt: machCritical(cpm, ktCorr), lait: machCritical(cpm, laitoneCorr) };
          if (mc.pg) B.dot(mc.pg, -cpCrit(mc.pg), { r: 5.5, color: 'ink', label: `$M_{cr}=${fx(mc.pg, 3)}$`, labelPos: 'se' });
          B.vline(m, { color: 'gold', width: 1.6, dash: true });
          B.dot(m, Math.min(2.95, -cpPG), { r: 5, color: 'gold' });
          info = { m, d, cpm, cpPG, crit, mc, sup, mloc: machFromCp(cpPG, m), a: al.value };
        });
        v.legend([['muted', 'incompressible $C_{p,0}$'], ['accent', 'Prandtl–Glauert'], ['green', 'Kármán–Tsien'], ['purple', 'Laitone'], ['red', 'critical $C_p^*$']]);
        v.readout(() => {
          const { m, d, cpm, cpPG, crit, mc, sup, mloc } = info, b = Math.sqrt(1 - m * m);
          return `$\\beta=\\sqrt{1-M_\\infty^2}=${fx(b, 3)}$, $1/\\beta=${fx(1 / b, 3)}$. Suction peak: $C_{p,0}=${fx(cpm, 3)}$ → $C_p=C_{p,0}/\\beta=${fx(cpPG, 3)}$; critical $C_p^*=${fx(crit, 3)}$. `
            + (!Number.isFinite(mloc) ? `**Unphysical pressure prediction:** the corrected peak implies nonpositive absolute pressure, so no isentropic local Mach estimate exists. The linear rule has left its regime of validity.`
              : cpPG < crit ? `**Sonic threshold crossed:** the corrected peak is below $C_p^*$ (local Mach about $${fx(mloc, 2)}$ on the isentropic relation; ${sup} panels), so the linear rule no longer describes the flow.` : `Subcritical (local Mach at the peak about $${fx(mloc, 2)}$).`)
            + `\n$c_{l,0}=${fx(d.cl, 3)}$ → $c_l=${fx(d.cl / b, 3)}$, lift slope $2\\pi/\\beta=${fx(2 * Math.PI / b, 2)}$ per rad. Critical Mach number: Prandtl–Glauert ${mc.pg ? fx(mc.pg, 3) : '> 0.995'}, Kármán–Tsien ${mc.kt ? fx(mc.kt, 3) : '> 0.995'}, Laitone ${mc.lait ? fx(mc.lait, 3) : '> 0.995'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Phenomenon',
      name: 'Critical Mach number and drag divergence',
      statement: String.raw`As the free-stream Mach number of a lifting airfoil rises, the flow accelerates over the upper surface until, at the **critical Mach number** $M_{cr}$, the local speed first reaches Mach 1 at the suction peak. Above $M_{cr}$ a pocket of supersonic flow grows and ends in a shock wave; the shock and its interaction with the boundary layer add **wave drag**. The drag coefficient stays almost flat until the **drag-divergence Mach number** $M_{dd}$ (conventionally where $\mathrm dC_D/\mathrm dM=0.1$, a little above $M_{cr}$) and then climbs steeply, roughly as $(M-M_{cr})^4$, so thin sections, low lift and 'supercritical' shapes push the divergence to higher Mach numbers.`,
      idea: String.raw`At $M_{cr}$ the isentropic pressure coefficient at the suction peak equals $C_p^*$, which depends only on $M_\infty$ (4.1). Beyond it, fluid leaving the supersonic pocket must be slowed back to subsonic speed; it does so through a shock, whose entropy rise is the wave drag, and a strong shock can also separate the boundary layer. The drag rise is therefore tied to the size of the supersonic region, which grows very quickly once it exists; the fourth-power form $20(M-M_{cr})^4$ is an empirical fit, not a derivation.`,
      caption: String.raw`Left: the section at the chosen Mach number; the orange part of the upper surface is supersonic according to the Kármán–Tsien-corrected panel-method pressure (extrapolated beyond $M_{cr}$, so the pocket's extent is only indicative) and the shock is drawn where the pocket ends. Right: a model drag curve — Korn's relation for $M_{dd}$ and Lock's fourth-power rise — together with the critical Mach number from the left-hand picture. Raise the angle of attack or thickness and both move left; choose the supercritical technology factor and the right-hand correlation moves right; the symmetric panel section is unchanged.`,
      deps: ['aero-4.1'],
      refs: ['Mason, Configuration Aerodynamics (2006), §§7.2, 7.4.3 and 7.5.2, Eqs. (7-2)–(7-9)'],
      tags: ['transonic', 'wave drag', 'shock'],
      scope: String.raw`Two-dimensional sections at transonic speed. The left picture uses a panel method plus a compressibility law (so it is quantitative only up to about $M_{cr}$); the right-hand curve is an engineering correlation (Korn's equation and Lock's wave-drag law as quoted in Mason's text) with an arbitrary round-number base drag $C_{D,0}=0.008$ — it is a model, not a measured polar.`,
      credit: 'Korn’s relation and Lock’s fourth-power wave-drag rise as quoted in Mason (Configuration Aerodynamics, §7.5.2)',
      links: { source: 'https://archive.aoe.vt.edu/mason/Mason_f/ConfigAeroTransonics.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Drag-divergence_Mach_number' },
      viz(v) {
        const M = v.slider('Mach number $M_\\infty$', 0.5, 1.0, 0.8, { step: 0.005 });
        const al = v.slider('angle of attack $\\alpha$ (°)', 0, 6, 2, { step: 0.1 });
        const tc = v.select('thickness', [{ value: 0.06, label: '6 %' }, { value: 0.09, label: '9 %' }, { value: 0.12, label: '12 %' }, { value: 0.15, label: '15 %' }], 0.12);
        const kap = v.select('section technology', [{ value: 0.87, label: 'conventional $\\kappa=0.87$' }, { value: 0.95, label: 'supercritical $\\kappa=0.95$' }], 0.87);
        const A = v.stage({ x: [-0.05, 1.05], y: [-0.22, 0.22], equal: true, axes: false, height: 300, minWidth: 340, title: 'supersonic pocket on the upper surface' });
        const B = v.stage({ x: [0.5, 1.0], y: [0, 0.1], axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'Mach number $M_\\infty$', ylabel: 'drag coefficient $C_D$', title: 'drag divergence (model)' });
        let info = {};
        v.render(() => {
          const t = +tc.value, m = M.value, a = al.value, d = cp0Dist(t, a), f = foil(t);
          // surface points rotated by alpha (flow along +x): draw the section at incidence
          const ca = Math.cos(-a * DEG), sa = Math.sin(-a * DEG), rot = ([x, y]) => [(x - 0.25) * ca - y * sa + 0.25, (x - 0.25) * sa + y * ca];
          const pts = f.pts.map(rot);
          A.poly(pts, { fill: 'ink', fillAlpha: 0.1, color: 'ink', width: 1.6 });
          const crit = cpCrit(m), N = f.model.N;
          // supersonic panels on the upper surface (second half of the traversal) from the Karman-Tsien-corrected Cp
          const sup = []; let xmaxSup = -1, xminSup = 2;
          for (let i = 0; i < N; i++) {
            const isUpper = i >= N / 2 - 1, c = ktCorr(d.cps[i], m);
            if (isUpper && c < crit) { sup.push(i); xmaxSup = Math.max(xmaxSup, f.model.cx[i]); xminSup = Math.min(xminSup, f.model.cx[i]); }
          }
          for (const i of sup) { const p = rot([f.model.cx[i], f.model.cy[i]]); A.dot(p[0], p[1], { r: 3.6, color: 'orange' }); }
          if (sup.length) {
            const xs = xmaxSup + 0.02, ys = nacaTop(t, xs), p0 = rot([xs, ys]), p1 = rot([xs + 0.03, ys + 0.1 + 0.06 * (xs - xminSup)]);
            A.line(p0[0], p0[1], p1[0], p1[1], { color: 'red', width: 3 }); A.text('shock', p1[0] + 0.02, p1[1], { color: 'red', size: 11, align: 'left' });
          }
          A.arrow(-0.04, 0.12, 0.12, 0.12, { color: 'accent', width: 2 }); A.text(`$M_\\infty=${fx(m, 3)}$`, 0.0, 0.17, { color: 'accent', size: 12, align: 'left' });
          // right graph
          const cl = d.cl, sweep = 0, mdd = mddKorn(+kap.value, t, cl, sweep), mcrit = mdd - KORN_OFFSET;
          const mcrP = machCritical(d.cpmin, ktCorr);
          B.setView([0.5, 1.0], [0, 0.1]);
          const cd = (x) => CD0_MODEL + cdWave(x, mcrit);
          B.fn(cd, { color: 'accent', width: 2.8, domain: [0.5, 1] });
          B.vline(mdd, { color: 'green', dash: true, width: 1.5 }); B.text('$M_{dd}$', mdd - 0.005, 0.092, { color: 'green', size: 11, align: 'right' });
          if (mcrP) { B.vline(mcrP, { color: 'orange', dash: true, width: 1.5 }); B.text('$M_{cr}$', mcrP - 0.005, 0.081, { color: 'orange', size: 11, align: 'right' }); }
          B.dot(m, Math.min(0.099, cd(m)), { r: 6, color: 'gold' });
          info = { m, cl, mdd, mcrit, mcrP, cdNow: cd(m), nsup: sup.length, xs: sup.length ? [xminSup, xmaxSup] : null, slope: (cdWave(mdd + 1e-4, mcrit) - cdWave(mdd - 1e-4, mcrit)) / 2e-4 };
        });
        v.legend([['accent', 'model $C_D(M)$'], ['orange', 'supersonic / $M_{cr}$'], ['green', 'drag divergence $M_{dd}$'], ['red', 'shock']]);
        v.readout(() => {
          const { m, cl, mdd, mcrit, mcrP, cdNow, nsup, xs, slope } = info;
          return `Section lift $c_l=${fx(cl, 3)}$ (incompressible panel result). Critical Mach number from the suction peak (Kármán–Tsien law): ${mcrP ? '$' + fx(mcrP, 3) + '$' : '> 0.995'}; Korn: $M_{dd}=\\kappa-t/c-c_l/10=${fx(mdd, 3)}$, $M_{crit}=M_{dd}-0.108=${fx(mcrit, 3)}$ (check: the model's $\\mathrm dC_D/\\mathrm dM$ at $M_{dd}$ is $${fx(slope, 3)}$, the conventional 0.1).\n`
            + (nsup ? `At $M_\\infty=${fx(m, 3)}$ the upper surface is supersonic from $x/c=${fx(xs[0], 2)}$ to $${fx(xs[1], 2)}$, ending in a shock. ` : `At $M_\\infty=${fx(m, 3)}$ no part of the flow is supersonic on the panel-method pressure. `)
            + `Model drag $C_D=${fx(cdNow, 4)}$ (wave part $${fx(cdNow - CD0_MODEL, 4)}$).`;
        });
        // half-thickness of the NACA 00xx section on the upper surface (for placing the shock)
        function nacaTop(t, x) { return 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4); }
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Method',
      name: 'Swept wings delay drag divergence',
      statement: String.raw`On a wing swept back by the angle $\Lambda$ (long and untapered, away from the root and tips) the free stream $V_\infty$ splits into a component $V_\infty\cos\Lambda$ normal to the leading edge and a component $V_\infty\sin\Lambda$ along it. The spanwise component does not change the pressure on the section, so the airfoil behaves as if it were an unswept one in a stream of Mach number $M_n=M_\infty\cos\Lambda$. The critical and drag-divergence Mach numbers of the swept wing therefore rise by about the factor $1/\cos\Lambda$:
$$M_{dd}(\Lambda)\approx\frac{M_{dd}(0)}{\cos\Lambda},$$
at the price of a lower lift-curve slope, a lower usable lift coefficient and more difficult stall and structural behaviour at the tip.`,
      idea: String.raw`The pressure on an infinite yawed wing depends only on the flow normal to the leading edge, because translating along the wing leaves the flow unchanged ('independence principle', which follows from the symmetry of the potential equation under a shift along the span). A section whose normal Mach number is $M_\infty\cos\Lambda$ reaches Mach 1 only when $M_\infty=M_{cr}/\cos\Lambda$. Real wings do less well: the root and tip disturb the flow, and a section cut parallel to the stream is thinner and carries a smaller lift than the normal section, which is why Korn's relation (4.2) is written with $\cos^2\Lambda$ and $\cos^3\Lambda$ terms.`,
      caption: String.raw`Left: plan view with the free stream, its normal and spanwise components. Middle: drag-divergence Mach number against sweep, from the cosine rule (dashed) and from Korn's relation, which includes thickness and lift effects (solid). Right: the model drag curve of the unswept wing (grey) and of the swept wing (blue). Increase the sweep to see $M_{dd}$ move right; set the thickness high and the lift coefficient up to see how the cosine rule overstates the gain.`,
      deps: ['aero-4.2'],
      refs: ['Jones, Wing Plan Forms for High-Speed Flight, NACA TN1033 (1945), pp. 1–7, Eqs. (1)–(6)', 'Mason, Configuration Aerodynamics (2006), §7.5.2, Eqs. (7-4)–(7-9)'],
      tags: ['sweep', 'transonic', 'wing design'],
      scope: String.raw`An infinite yawed wing in inviscid flow, and a correlation for finite wings. The streamwise thickness ratio $t/c$ and lift coefficient used in Korn's relation are the values for the wing section parallel to the flight direction; the drag curves are the same model as in 4.2 (not measured data).`,
      credit: 'R. T. Jones, NACA TN1033, 1945; A. Busemann’s 1935 work is discussed and cited in that report (reference9).',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Swept_wing' },
      viz(v) {
        const sw = v.slider('sweep $\\Lambda$ (°)', 0, 60, 30, { step: 1 });
        const tcS = v.slider('streamwise thickness $t/c$', 0.06, 0.15, 0.1, { step: 0.005 });
        const clS = v.slider('lift coefficient $C_L$', 0, 0.8, 0.4, { step: 0.02 });
        const kap = v.select('section technology', [{ value: 0.87, label: 'conventional' }, { value: 0.95, label: 'supercritical' }], 0.87);
        const P = v.stage({ x: [-0.6, 0.6], y: [-0.15, 1.05], equal: true, axes: false, height: 320, minWidth: 260, title: 'plan view' });
        const B = v.stage({ x: [0, 60], y: [0.6, 1.4], axes: 'box', gutter: true, height: 320, minWidth: 290, xlabel: 'sweep $\\Lambda$ (°)', ylabel: '$M_{dd}$', title: 'drag-divergence Mach number' });
        const C = v.stage({ x: [0.6, 1.1], y: [0, 0.1], axes: 'box', gutter: true, height: 320, minWidth: 290, xlabel: 'flight Mach number $M_\\infty$', ylabel: '$C_D$', title: 'drag rise (model)' });
        let info = {};
        v.render(() => {
          const L = sw.value * DEG, k = +kap.value, t = tcS.value, cl = clS.value, c = Math.cos(L);
          // plan view: half-span wing from the root at x = 0 (fuselage), swept back
          const b = 0.55, cr = 0.28, ct = 0.12;
          const wing = (sgn) => { const root = [0, 0.75], tipLE = [sgn * b, 0.75 - b * Math.tan(L)]; return [root, tipLE, [tipLE[0], tipLE[1] - ct], [0, 0.75 - cr]]; };
          P.poly([[-0.03, 1.0], [0.03, 1.0], [0.03, 0.05], [0, -0.02], [-0.03, 0.05]], { fill: 'ink', fillAlpha: 0.12, color: 'ink', width: 1.4 });
          P.poly(wing(1), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 }); P.poly(wing(-1), { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          // free stream from the top (flow goes down the page) with its components at a station on the right wing
          const px = 0.3, py = 0.75 - px * Math.tan(L) - 0.05;
          P.arrow(px, py + 0.38, px, py, { color: 'ink', width: 2.2 }); P.text('$V_\\infty$', px + 0.03, py + 0.3, { color: 'ink', size: 12, align: 'left' });
          const n = [Math.sin(L), -Math.cos(L)];
          const Vn = 0.38 * c;
          P.arrow(px, py, px + Vn * n[0], py + Vn * n[1] * 1, { color: 'green', width: 2.2 });
          P.text('$V_\\infty\\cos\\Lambda$', px + Vn * n[0] + 0.03, py + Vn * n[1], { color: 'green', size: 11, align: 'left' });
          P.text(`$\\Lambda=${sw.value}^\\circ$`, 0.02, -0.07, { color: 'accent', size: 12, align: 'left' });
          // middle graph
          B.setView([0, 60], [0.6, Math.max(1.4, mddKorn(k, t, cl, 0) / Math.cos(60 * DEG) * 1.02)]);
          const m0 = mddKorn(k, t, cl, 0), ang = (d) => d * DEG;
          B.fn((d) => m0 / Math.cos(ang(d)), { color: 'orange', dash: true, width: 2, domain: [0, 60] });
          B.fn((d) => mddKorn(k, t, cl, ang(d)), { color: 'accent', width: 2.8, domain: [0, 60] });
          B.dot(sw.value, mddKorn(k, t, cl, L), { r: 6, color: 'gold' }); B.vline(sw.value, { color: 'gold', dash: true, width: 1 });
          // right graph
          const mdd = mddKorn(k, t, cl, L), mcr = mdd - KORN_OFFSET;
          C.setView([0.6, 1.1], [0, 0.1]);
          C.fn((x) => CD0_MODEL + cdWave(x, m0 - KORN_OFFSET), { color: 'muted', width: 2.2, domain: [0.6, 1.1] });
          C.fn((x) => CD0_MODEL + cdWave(x, mcr), { color: 'accent', width: 2.8, domain: [0.6, 1.1] });
          C.vline(m0, { color: 'muted', dash: true, width: 1 }); C.vline(mdd, { color: 'accent', dash: true, width: 1.2 });
          info = { m0, mdd, cosRule: m0 / c, Mn: mdd * c, L };
        });
        v.legend([['accent', 'Korn $M_{dd}$ (swept)'], ['orange', 'cosine rule $M_{dd,0}/\\cos\\Lambda$', { dash: true }], ['muted', 'unswept']]);
        v.readout(() => {
          const { m0, mdd, cosRule, Mn } = info;
          return `Unswept: $M_{dd,0}=${fx(m0, 3)}$. Swept ${sw.value}°: Korn gives $M_{dd}=${fx(mdd, 3)}$, the cosine rule $${fx(cosRule, 3)}$ (it overstates the gain by $${fx(cosRule - mdd, 3)}$). The normal Mach number at divergence is $M_{dd}\\cos\\Lambda=${fx(Mn, 3)}$ — the unswept section's $M_{dd}$ would be $${fx(m0, 3)}$, so the normal-flow rule is ${Math.abs(Mn - m0) < 0.02 ? 'nearly' : 'only roughly'} satisfied once thickness and lift are included.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Principle',
      name: 'The area rule',
      statement: String.raw`At transonic and low supersonic speeds the wave drag of a slender aircraft depends mainly on how its **cross-sectional area $S(x)$** is distributed along its length, and hardly on the detailed shape. A wing–body combination has nearly the same zero-lift wave drag as the body of revolution that has the same $S(x)$. To keep the drag low, make the area distribution smooth, like that of the Sears–Haack body, which has the least wave drag for a given length $l$ and volume $V$:
$$\frac{D_w}{q}=\frac{128\,V^2}{\pi\,l^4}.$$
Since the wing adds area, the fuselage must be narrowed ('indented') where the wing is, so that the total area has no bump.`,
      idea: String.raw`In slender-body theory the far field of the body is that of a line source distribution with strength $S'(x)$, and the wave drag is a quadratic form in $S''(x)$ (von Kármán's integral), which can be written in Fourier form with $S'(x(\theta))=\sum a_n\sin n\theta$, $x=\tfrac l2(1-\cos\theta)$, as $D_w/q=\tfrac\pi4\sum n a_n^2$. A sudden bump in $S$ (a wing sitting on a straight fuselage) puts energy into the higher harmonics of the area slope, whose squared coefficients are weighted by $n$; removing the bump by pinching the fuselage cancels those harmonics. At Mach 1 the planes of constant $x$ are the planes that matter, which is why the rule is stated for transonic speeds.`,
      caption: String.raw`Top: the aircraft seen from above (radial scale exaggerated) and its area distribution. Slide the **indentation** $k$ from 0 (straight fuselage) to 1 (fuselage area reduced by exactly the wing's area): the blue total approaches the smooth ideal, while grey retains the unindented $k=0$ reference. Bottom: wave drag divided by the Sears–Haack minimum at each setting's own volume, against $k$, from the Fourier formula; the dot is your setting. Indentation changes volume as well as shape. Make the wing larger or move it, and see the benefit change.`,
      deps: ['aero-4.2', 'pma-8.10'],
      refs: ['Sheppard, ARC R&M 3077 (1957), §§2.1–2.3.1 and 4.2, printed pp. 2–5 and 17', 'Whitcomb, NACA RM L52H08 (1952), pp. 1–12'],
      tags: ['area rule', 'wave drag', 'transonic'],
      scope: String.raw`Slender bodies at zero lift in transonic and low supersonic flow (the slender-body limit). The wing's cross-sectional-area hump is a smooth $\sin^2$ model and the aircraft is a schematic, not a particular design. Indentation removes volume; each drag ratio uses the minimum at its own current volume, and the wing-position range keeps the remaining fuselage area nonnegative; drag is slender-body wave drag only (no friction, no separation, no lift-dependent drag). For a finite Mach number above 1 the relevant cuts are slanted at the Mach angle, which is not modelled.`,
      credit: 'R. T. Whitcomb, NACA Langley, 1952 (NACA RM L52H08); slender-body drag formula: von Kármán, Sears and Haack',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Area_rule' },
      viz(v) {
        const kS = v.slider('indentation $k$', 0, 1, 0.5, { step: 0.01 });
        const awS = v.slider('wing area hump $A_w/A_f$', 0.05, 0.6, 0.3, { step: 0.01 });
        const xwS = v.slider('wing position $x_w/l$', 0.2, 0.54, 0.35, { step: 0.01 });
        const Af = 0.006, ww = 0.4;
        const T = v.stage({ x: [0, 1], y: [-0.4, 0.4], axes: false, height: 220, minWidth: 340, full: true, title: 'top view (radial scale exaggerated)' });
        const S = v.stage({ x: [0, 1], y: [0, Af * 1.35], axes: 'box', gutter: true, height: 240, minWidth: 320, xlabel: 'station $x/l$', ylabel: 'area $S(x)$', title: 'cross-sectional area' });
        const D = v.stage({ x: [0, 1], y: [0.9, 1.6], axes: 'box', gutter: true, height: 240, minWidth: 280, xlabel: 'indentation $k$', ylabel: '$D_w/D_{\\mathrm{SH}}$', title: 'wave drag' });
        let info = {};
        v.render(() => {
          const k = kS.value, Aw = awS.value * Af, xw = xwS.value, co = areaCoeffs(Af, Aw, xw, ww);
          const fus = (x) => Math.max(0, fusIdeal(x, Af) - k * wingHump(x, Aw, xw, ww)), tot = (x) => fus(x) + wingHump(x, Aw, xw, ww);
          // top view: fuselage radius from the fuselage area, exaggerated by 4.5
          const r = (x) => Math.sqrt(fus(x) / Math.PI) * 1.8;
          const up = [], lo = []; for (let i = 0; i <= 120; i++) { const x = i / 120; up.push([x, r(x)]); lo.push([x, -r(x)]); }
          T.poly(up.concat(lo.reverse()), { fill: 'ink', fillAlpha: 0.14, color: 'ink', width: 1.6 });
          const wr = 0.1 + 0.35 * Math.sqrt(Aw / Af); // schematic semi-span
          const wing = (s) => [[xw, s * r(xw)], [xw + ww * 0.55, s * wr * 1.0], [xw + ww * 0.9, s * wr], [xw + ww, s * r(xw + ww)]];
          T.poly(wing(1), { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 }); T.poly(wing(-1), { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          // area plot
          const V = (() => { let s = 0; for (let i = 0; i < 600; i++) s += tot((i + 0.5) / 600) / 600; return s; })();
          const sh = sears(V, LBODY);
          S.fn(sh.S, { color: 'green', dash: true, width: 2, domain: [0, 1] });
          S.fn(tot, { color: 'accent', width: 2.8, domain: [0, 1], fill: true, base: 0 });
          S.fn((x) => wingHump(x, Aw, xw, ww) + fusIdeal(x, Af), { color: 'muted', width: 1, domain: [0, 1] });
          // drag against k
          const dsh = (kk) => { let vv = 0; for (let i = 0; i < 300; i++) { const x = (i + 0.5) / 300; vv += (fusIdeal(x, Af) + (1 - kk) * wingHump(x, Aw, xw, ww)) / 300; } return dragOfK(co, kk) / sears(vv, LBODY).dq; };
          const ks = []; for (let i = 0; i <= 40; i++) ks.push(i / 40);
          const vals = ks.map(dsh); D.setView([0, 1], [0.95, Math.max(1.2, Math.max(...vals) * 1.08)]);
          D.hline(1, { color: 'green', dash: true, width: 1.4 }); D.path(ks.map((x, i) => [x, vals[i]]), { color: 'accent', width: 2.8 });
          D.dot(k, dsh(k), { r: 6, color: 'gold' });
          info = { dq: dragOfK(co, k), dq0: dragOfK(co, 0), dq1: dragOfK(co, 1), V, sh: sh.dq, ratio: dsh(k) };
        });
        v.legend([['accent', 'total $S(x)$'], ['green', 'Sears–Haack, same volume', { dash: true }], ['muted', 'fuselage + wing, straight']]);
        v.readout(() => {
          const { dq, dq0, dq1, V, sh, ratio } = info;
          return `Slender-body wave drag $D_w/q=${fx(dq * 1e4, 3)}\\times10^{-4}$ (units of $l^2$); with a straight fuselage ($k=0$) $${fx(dq0 * 1e4, 3)}\\times10^{-4}$, fully indented ($k=1$) $${fx(dq1 * 1e4, 3)}\\times10^{-4}$: a reduction of $${fx(100 * (1 - dq1 / dq0), 1)}\\%$. `
            + `Current-setting volume $V=${fx(V * 1e3, 3)}\\times10^{-3}\\,l^3$; Sears–Haack minimum $128V^2/(\\pi l^4)=${fx(sh * 1e4, 3)}\\times10^{-4}$, so you are at ${fx(ratio, 3)} times the minimum${Math.abs(ratio - 1) < 0.005 ? ' (at the minimum: the area distribution is the ideal one)' : ''}. Indentation removes volume across the compared settings.`;
        });
      },
    },
  ],
};
