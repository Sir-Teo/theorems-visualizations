// Solid Mechanics & Structures — Chapter 1: Stress, strain and axial loading (items 1.9–1.15; 1.1–1.8 are in ch01.js)
//
// Material numbers as in ch01.js (EN 1993-1-1 for steel: E 210 GPa, α 12·10⁻⁶ /K; ASM/MatWeb 6061-T6: E 68.9 GPa, α 23.6·10⁻⁶ /K;
// CDA copper: E 117 GPa, α 17·10⁻⁶ /K; EN 1992-1-1 concrete C30/37: Ecm 33 GPa, α 10·10⁻⁶ /K).
// 1.13 uses a plane-stress bilinear-quadrilateral finite-element model computed on the fly (stripFE in ch01.shared.js).
// Illustrative choices: the rod and rail geometries and the section radius of gyration used for the buckling cap in 1.11.

import { MATS, curveOf, placeLabels, wallV, ceilingH, heatColor, stripFE } from './ch01.shared.js';

const f3 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : Math.abs(x) >= 1 ? x.toFixed(2) : x.toFixed(3)).replace('-', '−');

export default {
  collection: 'solid',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Proposition',
      name: 'Elongation of a bar: δ = PL/EA',
      statement: String.raw`A prismatic bar of length $L$, cross-section $A$ and modulus $E$ carrying a constant axial force $N$ lengthens by
$$\delta = \frac{NL}{EA}.$$
For a bar whose force $N(x)$, area $A(x)$ or modulus $E(x)$ change along its length, the elongation is the integral of the strain,
$$\delta = \int_0^L \frac{N(x)}{E(x)A(x)}\,\mathrm{d}x,$$
which for a stepped bar with constant pieces reduces to the sum $\delta = \sum_i N_iL_i/(E_iA_i)$. For a bar tapering linearly between diameters $d_1$ and $d_2$ under a constant force $P$, $\delta = 4PL/(\pi E d_1 d_2)$. $EA/L$ is the axial stiffness: the force needed per unit elongation.`,
      idea: String.raw`Hooke's law (1.4) gives the strain at each section, $\varepsilon = \sigma/E = N/(EA)$; the elongation is the integral of the strain over the length (1.2). Where $N$, $A$ and $E$ are constant the integral is a product; where they jump, it splits into pieces, and where the area varies smoothly it is evaluated exactly. The force in each piece comes from equilibrium of a free body cut there: the axial force is the sum of all the loads on the far side.`,
      caption: String.raw`Drag the three orange handles (sideways, above the bar) to apply loads at the joints $B$, $C$, $D$ — negative means pushing — and change the diameters. The force $N$ in each segment follows from equilibrium; the strain bars are $N/EA$, and their **area is the elongation** (the area under each step is that segment's elongation). Make the middle segment aluminium, or switch to a **tapered** bar: the integral is evaluated numerically and compared with the closed form. The deformation is magnified (printed on the drawing).`,
      deps: ['solid-1.4'],
      refs: ['Gere–Goodno §2.2', 'Gere–Goodno §2.3'],
      tags: ['elongation', 'axial'],
      viz(v) {
        const shape = v.select('bar', [{ value: 's', label: 'stepped' }, { value: 't', label: 'tapered' }], 's');
        const alum = v.toggle('middle segment aluminium', false);
        const d1 = v.slider('diameter at wall / AB (mm)', 15, 50, 40, { step: 1 });
        const d2 = v.slider('diameter BC (mm) — tapered: free end', 10, 50, 30, { step: 1 });
        const d3 = v.slider('diameter CD (mm)', 10, 50, 20, { step: 1 });
        const S = v.stage({ x: [-0.8, 14.8], y: [-2.6, 3.6], equal: true, axes: false, height: 290, full: true, title: 'the bar, joints B, C, D (unit = 100 mm)' });
        const EB = v.stage({ x: [0, 12], y: [0, 1], axes: 'box', gutter: { l: 52 }, height: 240, xlabel: 'position x along the bar (100 mm)', ylabel: 'strain ε (×10⁻³)', title: 'strain ε(x) = N/EA — its area is δ' });
        const UB = v.stage({ x: [0, 12], y: [0, 1], axes: 'box', gutter: { l: 52 }, height: 240, xlabel: 'position x along the bar (100 mm)', ylabel: 'displacement u (mm)', title: 'displacement u(x) = ∫ε dx' });
        const XJ = [5, 9, 12], FY = 1.9;
        const H = XJ.map((x, i) => S.handle(x + [1.0, 0.5, 1.5][i], FY, { color: 'orange', label: ['$F_B$', '$F_C$', '$F_D$'][i], labelPos: 'n', constrain: { x: [x - 1.4, x + 2.6], y: [FY, FY] } }));
        const F = () => H.map((h, i) => (h.x - XJ[i]) * 40); // kN, +→ pulls to the right
        const dd = (x) => (shape.value === 't' ? d1.value + ((d2.value - d1.value) * x) / 12 : x < 5 ? d1.value : x < 9 ? d2.value : d3.value);
        const Em = (x) => (shape.value === 's' && alum.value && x >= 5 && x < 9 ? MATS.al.E : MATS.steel.E);
        const Nx = (x) => { const f = F(); return (x < 5 ? f[0] + f[1] + f[2] : x < 9 ? f[1] + f[2] : f[2]) * 1000; };
        const eps = (x) => Nx(x) / (Em(x) * ((Math.PI * dd(x) ** 2) / 4));
        const sample = () => { const n = 240, xs = [], us = [0]; let acc = 0; for (let i = 0; i <= n; i++) xs.push((12 * i) / n); for (let i = 1; i <= n; i++) { acc += ((eps(xs[i - 1] + 1e-9) + eps(xs[i] - 1e-9)) / 2) * 100 * (xs[i] - xs[i - 1]); us.push(acc); } return { xs, us }; };
        v.render(() => {
          const { xs, us } = sample(), f = F(), tot = us[us.length - 1], umax = Math.max(1e-9, ...us.map(Math.abs)), mag = 1.3 / umax; // units of 100 mm per mm
          const uAt = (x) => us[Math.min(us.length - 1, Math.round((x / 12) * 240))];
          wallV(v, S, 0, -1.8, 1.8, -1, 12);
          const top = [], bot = [];
          xs.forEach((x) => { const hw = dd(x) / 50, X = x + (uAt(x) * mag) / 100 * 100 / 100; top.push([X, hw]); bot.push([X, -hw]); });
          // ghost (undeformed)
          const gt = xs.map((x) => [x, dd(x) / 50]), gb = xs.map((x) => [x, -dd(x) / 50]);
          S.path([...gt, ...gb.reverse()], { close: true, color: 'muted', width: 1.2, dash: [4, 3], fill: false });
          // bar coloured by sign of force
          for (let i = 0; i < xs.length - 1; i++) {
            const x = (xs[i] + xs[i + 1]) / 2, hw = dd(x) / 50, N = Nx(x), t = Math.min(1, Math.abs(N) / 1e5);
            const col = N >= 0 ? 'orange' : 'blue';
            S.poly([[xs[i] + (us[i] * mag) / 100, -hw], [xs[i + 1] + (us[i + 1] * mag) / 100, -hw], [xs[i + 1] + (us[i + 1] * mag) / 100, hw], [xs[i] + (us[i] * mag) / 100, hw]], { fill: col, fillAlpha: 0.1 + 0.4 * t, stroke: false });
          }
          S.path([...top, ...bot.reverse()], { close: true, color: 'ink', width: 1.8, fill: false });
          // joints, loads
          XJ.forEach((x, i) => {
            const X = x + (uAt(x) * mag) / 100; S.line(X, -1.75, X, 1.75, { color: 'ink', width: 1, alpha: 0.5, dash: [2, 3] });
            S.text('BCD'[i], X, -2.15, { size: 13, weight: 700, color: 'ink', align: 'center' });
            if (Math.abs(f[i]) > 0.5) { S.arrow(X, FY - 0.9, X + (f[i] / 40) * 0.8, FY - 0.9, { color: 'orange', width: 3, head: 10 }); }
            S.line(X, FY - 0.9, H[i].x, FY, { color: 'orange', width: 1, dash: [2, 3], alpha: 0.7 });
            S.text(`${f3(f[i])} kN`, X, FY - 0.55, { size: 11, weight: 650, color: 'orange', align: 'center' });
          });
          S.text(`deformation magnified ×${f3(mag * 100)}`, -0.5, 3.25, { size: 10.5, color: 'muted', align: 'left' });
          // segment force labels
          [[2.5, f[0] + f[1] + f[2], 'AB'], [7, f[1] + f[2], 'BC'], [10.5, f[2], 'CD']].forEach(([x, N, nm]) => S.text(`N${nm} = ${f3(N)} kN`, x, -1.55 - 0.0, { size: 11, weight: 650, color: N >= 0 ? 'orange' : 'blue', align: 'center' }));
          // strain chart
          const ev = xs.map((x) => eps(x + 1e-9) * 1000), emax = Math.max(0.2, ...ev.map(Math.abs)) * 1.2;
          EB.setView([0, 12], [Math.min(0, -emax * (ev.some((e) => e < 0) ? 1 : 0)), emax]);
          EB.hline(0, { color: 'muted', width: 1 });
          const segs = shape.value === 's' ? [[0, 5, 'accent'], [5, 9, alum.value ? 'orange' : 'teal'], [9, 12, 'purple']] : [[0, 5, 'accent'], [5, 9, 'teal'], [9, 12, 'purple']];
          segs.forEach(([a, b, c]) => EB.fn((x) => eps(x + 1e-9) * 1000, { domain: [a + 1e-6, b - 1e-6], n: 80, fill: true, fillAlpha: 0.3, color: c, width: 2.2 }));
          UB.setView([0, 12], [Math.min(0, ...us) * 1.15 - 1e-9, Math.max(0.01, ...us) * 1.2]);
          UB.hline(0, { color: 'muted', width: 1 });
          UB.path(xs.map((x, i) => [x, us[i]]), { color: 'accent', width: 2.4 });
          XJ.forEach((x, i) => UB.dot(x, uAt(x), { r: 5, color: 'orange', label: 'BCD'[i], labelPos: 'nw' }));
        });
        v.readout(() => {
          const { us } = sample(), f = F(), tot = us[us.length - 1];
          const Ns = [f[0] + f[1] + f[2], f[1] + f[2], f[2]];
          let formula;
          if (shape.value === 's') {
            const L = [500, 400, 300], d = [d1.value, d2.value, d3.value], Es = [MATS.steel.E, alum.value ? MATS.al.E : MATS.steel.E, MATS.steel.E];
            const parts = Ns.map((N, i) => (N * 1000 * L[i]) / (Es[i] * ((Math.PI * d[i] ** 2) / 4)));
            formula = parts.reduce((a, b) => a + b, 0);
            return `$\\delta_{AB} = ${f3(parts[0])}$, $\\delta_{BC} = ${f3(parts[1])}$, $\\delta_{CD} = ${f3(parts[2])}$ mm → $\\sum N_iL_i/E_iA_i =$ **${f3(formula)} mm** · numerical integral of the strain $= ${f3(tot)}$ mm (difference ${Math.abs(tot - formula).toExponential(1)} mm).`;
          }
          const dAt = (x) => d1.value + ((d2.value - d1.value) * x) / 12, edges = [0, 5, 9, 12];
          formula = Ns.reduce((acc, N, i) => acc + (4 * N * 1000 * (edges[i + 1] - edges[i]) * 100) / (Math.PI * MATS.steel.E * dAt(edges[i]) * dAt(edges[i + 1])), 0);
          return `Tapered bar ${d1.value} → ${d2.value} mm: closed form $\\sum 4N_i\\ell_i/(\\pi E d_i d_{i+1}) = ${f3(formula)}$ mm · numerical $\\int N/(EA)\\,dx = ${f3(tot)}$ mm (difference ${Math.abs(tot - formula).toExponential(1)}) · forces $N_{AB}, N_{BC}, N_{CD}$ = ${f3(Ns[0])}, ${f3(Ns[1])}, ${f3(Ns[2])} kN.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Method',
      name: 'Statically indeterminate bars: compatibility',
      statement: String.raw`A bar structure is **statically indeterminate** when equilibrium alone has fewer equations than unknown forces. Such a problem is solved in three steps:
- **equilibrium**, e.g. for a load $P$ shared between two members, $F_1 + F_2 = P$;
- **compatibility**: the members must deform in a geometrically consistent way, e.g. two parallel rods joined to a rigid plate stretch equally, $\delta_1 = \delta_2$;
- **force–displacement laws**, $\delta_i = F_if_i$ with flexibility $f_i = L_i/E_iA_i$ (1.9).
Substituting the third into the second gives one more equation and
$$F_1 = P\,\frac{f_2}{f_1+f_2} = P\,\frac{k_1}{k_1+k_2},\qquad F_2 = P\,\frac{k_2}{k_1+k_2},\qquad k_i = \frac{E_iA_i}{L_i}:$$
the load divides in proportion to the stiffnesses. The same recipe solves a bar fixed at both ends and loaded at an intermediate point: $R_A + R_B = P$ and zero total elongation $R_A f_1 = R_B f_2$.`,
      idea: String.raw`Statics gives one line of admissible force pairs $(F_1, F_2)$; geometry gives another line (compatibility), and the real structure sits where the two cross. The stiffer member carries more of the load because it resists the common displacement more strongly. Note that the answer depends on $E$ and $A$, unlike in a determinate structure, where the member forces depend on geometry alone; this is why a redundant member makes the stress state depend on the materials, and why temperature changes or misfits (1.11) can stress an indeterminate structure with no load at all.`,
      caption: String.raw`Left: the structure with the force split you choose; right: the force plane $(F_1, F_2)$. The red line is equilibrium; drag the gold point along it: wherever you put it equilibrium holds but the rods stretch unequally (the red gap) — except at the blue compatibility line. Press **solve** to jump to the intersection. Change the load, the area ratio (a wider aluminium rod takes more) or the structure (two parallel rods or a bar fixed at both ends, loaded at an adjustable point).`,
      deps: ['solid-1.9'],
      see: ['arch-1.3', 'solid-7.5'],
      refs: ['Gere–Goodno §2.4'],
      tags: ['indeterminate', 'compatibility'],
      viz(v) {
        const mode = v.select('structure', [{ value: 'par', label: 'steel rod ∥ aluminium rod' }, { value: 'fix', label: 'bar fixed at both ends' }], 'par');
        const Ps = v.slider('load P (kN)', 10, 300, 120, { step: 1 });
        const ratio = v.slider('area ratio A₂ / A₁', 0.5, 4, 2, { step: 0.05, log: true });
        const pos = v.slider('load position a / L', 0.1, 0.9, 0.35, { step: 0.01 });
        const S = v.stage({ x: [-2.2, 9.5], y: [-1.8, 6.2], equal: true, axes: false, height: 380, weight: 1.1, minWidth: 300, title: 'the structure' });
        const Pl = v.stage({ x: [-0.2, 1.1], y: [-0.2, 1.1], equal: true, axes: 'box', gutter: { l: 52 }, height: 380, weight: 1, minWidth: 280, xlabel: 'F₁ (kN)', ylabel: 'F₂ (kN)', title: 'force plane: equilibrium and compatibility' });
        const flex = () => {
          const A1 = 1000, A2 = A1 * ratio.value;
          if (mode.value === 'par') return { f1: 500 / (MATS.steel.E * A1), f2: 500 / (MATS.al.E * A2), A1, A2, names: ['steel', 'aluminium'] };
          const a = pos.value * 1000; return { f1: a / (MATS.steel.E * A1), f2: (1000 - a) / (MATS.steel.E * A2), A1, A2, names: ['left part', 'right part'] };
        };
        const G = Pl.handle(60, 60, { color: 'gold', r: 8, constrain: (x, y) => { const P = Ps.value; const t = Math.max(-0.2 * P, Math.min(1.2 * P, (x - y + P) / 2)); return [t, P - t]; } });
        let Pn = Ps.value;
        const sol = () => { const { f1, f2 } = flex(), P = Ps.value; return [(P * f2) / (f1 + f2), (P * f1) / (f1 + f2)]; };
        v.button('solve (compatibility)', () => { const [a, b] = sol(); G.set(a, b); });
        mode.el.addEventListener?.('click', () => {});
        v.render(() => {
          const { f1, f2, A1, A2, names } = flex(), P = Ps.value;
          if (Math.abs(P - Pn) > 1e-9) { const t = G.x / Pn; Pn = P; G.set(t * P, (1 - t) * P); }
          const F1 = G.x, F2 = P - G.x;
          // force plane
          Pl.setView([-0.2 * P, 1.1 * P], [-0.2 * P, 1.1 * P]); Pl.setLabels(mode.value === 'par' ? 'F₁ (kN)' : 'R_A (kN)', mode.value === 'par' ? 'F₂ (kN)' : 'R_B (kN)');
          Pl.line(-0.2 * P, 1.2 * P, 1.2 * P, -0.2 * P, { color: 'red', width: 2.4 });
          const slope = f1 / f2; Pl.line(0, 0, 1.1 * P / Math.max(1, slope), 1.1 * P / Math.max(1, slope) * slope, { color: 'accent', width: 2.4 });
          const [a, b] = sol(); Pl.dot(a, b, { r: 6, color: 'green' });
          Pl.text('equilibrium F₁ + F₂ = P', 0.12 * P, 0.97 * P, { size: 11, color: 'red', align: 'left', weight: 600, dx: 14 });
          Pl.text('compatibility F₁f₁ = F₂f₂', 0.0 * P, 0.0 * P, { size: 11, color: 'accent', weight: 600, dx: 22, dy: 14, align: 'left' });
          Pl.text('true solution', a, b, { size: 11, color: 'green', dx: 12, dy: 14, align: 'left', weight: 700 });
          // structure: elongations exaggerated, mag so that true solution is 0.5 unit
          const d1 = F1 * 1000 * f1, d2 = F2 * 1000 * f2, mag = 0.55 / ((a * 1000 * f1) || 1);
          if (mode.value === 'par') {
            const L = 4, x1 = 1.2, x2 = 4.7, w1 = 0.5 * Math.sqrt(A1 / 1000) * 0.9, w2 = 0.5 * Math.sqrt(A2 / 1000) * 0.9;
            S.rect(-1.5, -0.7, 8.0, -0.2, { fill: 'gray', fillAlpha: 0.5, color: 'ink', width: 1.5 });
            for (let x = -1.5; x < 8; x += 0.35) S.line(x, -0.7, x - 0.3, -1.1, { color: 'muted', width: 1 });
            const t1 = L + d1 * mag, t2 = L + d2 * mag, tt = Math.max(t1, t2);
            S.rect(x1 - w1, 0, x1 + w1, t1, { fill: 'accent', fillAlpha: 0.35, color: 'ink', width: 1.6 });
            S.rect(x2 - w2, 0, x2 + w2, t2, { fill: 'orange', fillAlpha: 0.35, color: 'ink', width: 1.6 });
            S.rect(-0.8, tt, 7.3, tt + 0.38, { fill: 'gray', fillAlpha: 0.55, color: 'ink', width: 1.8 });
            if (Math.abs(t1 - t2) > 0.01) { const lo = Math.min(t1, t2), xx = t1 < t2 ? x1 : x2; S.rect(xx - 0.5, lo, xx + 0.5, tt, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1.2, hatch: true }); S.text('gap: not compatible', xx, (lo + tt) / 2, { size: 11, color: 'red', weight: 700, align: 'center', dx: xx < 3 ? 90 : -90 }); }
            S.arrow(3.0, tt + 0.5, 3.0, tt + 1.4, { color: 'orange', width: 3.5, head: 12 }); S.text(`P = ${f3(P)} kN`, 3.0, tt + 1.4, { size: 12.5, weight: 700, color: 'orange', align: 'center', dy: -12 });
            S.text(`F₁ = ${f3(F1)} kN`, x1, -1.5, { size: 11.5, weight: 650, color: 'accent', align: 'center' });
            S.text(`F₂ = ${f3(F2)} kN`, x2, -1.5, { size: 11.5, weight: 650, color: 'orange', align: 'center' });
            S.text('steel', x1, 2.2, { size: 11.5, color: 'ink', align: 'center', weight: 600 }); S.text('aluminium', x2, 2.2, { size: 11.5, color: 'ink', align: 'center', weight: 600 });
            S.text('δ exaggerated', 9.3, -1.55, { size: 10.5, color: 'muted', align: 'right' });
          } else {
            // horizontal bar between walls; walls at x=0 and 9
            const aL = 9 * pos.value, w1 = 0.5 * Math.sqrt(A1 / 1000) * 0.9, w2 = 0.5 * Math.sqrt(A2 / 1000) * 0.9;
            S.line(0, -1.0, 0, 3.0, { color: 'ink', width: 2 }); S.line(9, -1.0, 9, 3.0, { color: 'ink', width: 2 });
            for (let y = -1; y < 3; y += 0.3) { S.line(0, y, -0.3, y - 0.3, { color: 'muted', width: 1 }); S.line(9, y, 9.3, y + 0.3, { color: 'muted', width: 1 }); }
            const xB = aL + d1 * mag, gapR = (9 - xB) - (9 - aL) + F2 * 1000 * f2 * mag; // right part shortens by δ₂: its length must fit between B and the wall
            const yc = 1.0;
            S.rect(0, yc - w1, xB, yc + w1, { fill: 'accent', fillAlpha: 0.35, color: 'ink', width: 1.6 });
            const xRend = xB + (9 - aL) - F2 * 1000 * f2 * mag;
            S.rect(xB, yc - w2, xRend, yc + w2, { fill: 'orange', fillAlpha: 0.35, color: 'ink', width: 1.6 });
            if (Math.abs(xRend - 9) > 0.01) { S.rect(Math.min(xRend, 9), yc - w2 - 0.1, Math.max(xRend, 9), yc + w2 + 0.1, { fill: 'red', fillAlpha: 0.4, color: 'red', width: 1.2, hatch: true }); S.text(xRend < 9 ? 'gap' : 'overlap', 8.0, yc + w2 + 0.5, { size: 11, color: 'red', weight: 700, align: 'center' }); }
            S.arrow(xB, yc + w1 + 1.3, xB + 1.4, yc + w1 + 1.3, { color: 'orange', width: 0 });
            S.arrow(xB - 0.0, yc + 1.8, xB + 1.7, yc + 1.8, { color: 'orange', width: 3.5, head: 12 });
            S.text(`P = ${f3(P)} kN`, xB + 0.9, yc + 2.2, { size: 12.5, weight: 700, color: 'orange', align: 'center' });
            S.text(`left reaction ${f3(F1)} kN`, 0.2, -0.7, { size: 11.5, weight: 650, color: 'accent', align: 'left' });
            S.text(`right reaction ${f3(F2)} kN`, 8.8, -0.7, { size: 11.5, weight: 650, color: 'orange', align: 'right' });
            S.text('δ exaggerated', 9.3, -1.55, { size: 10.5, color: 'muted', align: 'right' });
            void gapR;
          }
          Pl.dot(F1, F2, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const { f1, f2 } = flex(), P = Ps.value, F1 = G.x, F2 = P - G.x, [a, b] = sol(), d1 = F1 * 1000 * f1, d2 = F2 * 1000 * f2;
          const par = mode.value === 'par';
          const mism = par ? d1 - d2 : d1 - d2;
          return `Equilibrium: ${par ? '$F_1+F_2$' : '$R_A+R_B$'} $= ${f3(F1)}+${f3(F2)} = ${f3(F1 + F2)}$ kN ✓ · ${par ? '$\\delta_1$' : '$\\delta_{\\text{left}}$'} $= ${f3(d1)}$ mm, ${par ? '$\\delta_2$' : '$\\delta_{\\text{right}}$'} $= ${f3(d2)}$ mm → mismatch ${f3(mism)} mm ${Math.abs(mism) < 1e-4 ? '(**compatible**)' : '(not compatible)'} · compatibility gives ${par ? '$F_1, F_2$' : '$R_A, R_B$'} $= ${f3(a)}, ${f3(b)}$ kN (${f3((100 * a) / P)} % / ${f3((100 * b) / P)} %).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Thermal stress in a constrained bar',
      statement: String.raw`A free bar warmed by $\Delta T$ expands by $\delta_T = \alpha\,\Delta T\,L$, with $\alpha$ the coefficient of thermal expansion, and no stress arises. If the expansion is prevented (rigid walls), the bar is held at its original length: the thermal strain $\alpha\Delta T$ is cancelled by an equal elastic strain, so the stress is
$$\sigma = -E\,\alpha\,\Delta T$$
(compression when heated), **independent of the length** and of the cross-section. If there is a gap $g$ before the walls close, only the excess $\alpha\Delta T - g/L$ is held, $\sigma = -E(\alpha\Delta T - g/L)$ once positive. A slender bar cannot actually keep such a compressive stress: it **buckles** sideways when the stress reaches the Euler value $\sigma_{cr} = \pi^2E/(L/r)^2$ ($r$ the radius of gyration of the section), after which the stress stays near $\sigma_{cr}$ and the excess length goes into the lateral deflection $a \approx (2L/\pi)\sqrt{\alpha\Delta T - g/L - \sigma_{cr}/E}$.`,
      idea: String.raw`This is the first example of **eigenstrain**: the temperature change creates a stress-free strain $\alpha\Delta T$, and stress is produced only by the part of the total strain that the constraints and compatibility refuse to allow (1.10 with the force found from $\delta_{\text{elastic}} + \delta_T = 0$). Because $\delta_T$ and the elastic shortening $\sigma L/E$ are both proportional to $L$, the length cancels. The numbers are large: for steel $E\alpha = 2.5$ MPa per kelvin, so 100 K gives 250 MPa, most of the yield stress. Buckling is the escape route of long slender members, and the reason railway track is held by ballast and pre-stressed, and why bridges have expansion joints.`,
      caption: String.raw`Warm the bar between two rigid walls with the **ΔT** slider and compare materials. The dashed ghost is where free expansion would take it (exaggerated ×30); the walls hold it back and the compressive stress appears. The right panel plots $\sigma$ against $\Delta T$ for the four materials: straight lines of slope $E\alpha$ whatever the length. Lengthen the bar: nothing changes in the stress, but the **Euler cap** (dashed) drops, and once the line reaches it the bar bows sideways. Open a **gap** to delay the onset. The section's radius of gyration is taken as 26 mm (illustrative, rail-like).`,
      scope: String.raw`Uniform temperature change, perfectly rigid supports, linear elastic material, a straight bar with pinned-pinned buckling; real track also relies on ballast restraint.`,
      deps: ['solid-1.10'],
      refs: ['Gere–Goodno §2.5'],
      tags: ['thermal', 'buckling'],
      viz(v) {
        const MK = ['steel', 'al', 'cu', 'conc'], NM = { steel: 'steel', al: 'aluminium', cu: 'copper', conc: 'concrete' }, COL = { steel: 'accent', al: 'orange', cu: 'teal', conc: 'gray' };
        const sel = v.select('material', MK.map((k) => ({ value: k, label: NM[k] })), 'steel');
        const dT = v.slider('temperature rise ΔT (K)', 0, 120, 55, { step: 1 });
        const Lm = v.slider('length L (m)', 1, 60, 2.5, { step: 0.5, log: true, sig: 2 });
        const gap = v.slider('gap before the wall closes (mm)', 0, 30, 0, { step: 0.5 });
        const S = v.stage({ x: [-1.2, 11.2], y: [-1.9, 2.5], equal: true, axes: false, height: 270, weight: 1.15, minWidth: 300, title: 'the bar between rigid walls' });
        const C = v.stage({ x: [0, 120], y: [0, 400], axes: 'box', gutter: { l: 52 }, height: 270, weight: 1, minWidth: 280, xlabel: 'temperature rise ΔT (K)', ylabel: 'compressive stress (MPa)', title: 'σ = EαΔT, whatever the length' });
        const R = 0.026;
        const st = () => {
          const m = MATS[sel.value], L = Lm.value, lam = L / R, ecr = (Math.PI / lam) ** 2, eth = m.alpha * dT.value - gap.value / 1000 / L, em = Math.max(0, eth);
          const buck = em > ecr, sig = m.E * Math.min(em, ecr), amp = buck ? ((2 * L) / Math.PI) * Math.sqrt(em - ecr) : 0;
          return { m, L, lam, ecr, scr: m.E * ecr, em, buck, sig, amp, free: m.alpha * dT.value * L * 1000 };
        };
        v.render(() => {
          const s = st(), m = s.m, X0 = 0, X1 = 10, ex = 30;
          const gx = (gap.value / (s.L * 1000)) * 10 * ex, wallX = X1 + gx;
          wallV(v, S, X0, -1.6, 1.6, -1, 12); wallV(v, S, wallX, -1.6, 1.6, 1, 12);
          const grow = Math.min(s.m.alpha * dT.value * 10 * ex, gx + 0.0 + 9);
          const free = m.alpha * dT.value * 10 * ex;
          S.rect(X1 + 0, -0.28, X0 + 10 + free, 0.28, { color: 'ink', width: 1.2, dash: [4, 3], fill: false, alpha: 0.6 });
          const t = Math.min(1, s.sig / m.sy * (m.id === 'conc' ? 8 : 1));
          const pts = [], n = 80, end = Math.min(wallX, 10 + free);
          for (let i = 0; i <= n; i++) { const x = (end * i) / n; pts.push([x, s.buck ? Math.min(1.5, (s.amp / s.L) * 10 * 12) * Math.sin((Math.PI * i) / n) : 0]); }
          S.path(pts, { color: heatColor(v, (s.sig / (m.id === 'conc' ? 30 : m.sy)) * 1.0), width: 22, alpha: 0.9 });
          S.path(pts, { color: 'ink', width: 1.2 });
          if (s.sig > 0.5) { S.arrow(X0 + 1.4, 1.35, X0 + 0.15, 1.35, { color: 'red', width: 3, head: 10 }); S.arrow(wallX - 1.4, 1.35, wallX - 0.15, 1.35, { color: 'red', width: 3, head: 10 }); }
          S.text(`σ = ${f3(s.sig)} MPa`, 5, -1.6, { size: 13, weight: 700, color: s.buck ? 'orange' : 'red', align: 'center' });
          if (gap.value > 0) S.text(`gap ${gap.value} mm (×30)`, wallX, 1.95, { size: 10.5, color: 'muted', align: 'center' });
          if (s.buck) S.text(`buckled: lateral deflection ${f3(s.amp * 1000)} mm (drawn ×${f3(Math.min(12, 1.5 / ((s.amp / s.L) * 10)))})`, 5, -1.1, { size: 11, weight: 650, color: 'orange', align: 'center' });
          S.text('dashed: free expansion, ×30', X0 + 0.2, 2.25, { size: 10.5, color: 'muted', align: 'left' });
          void t; void grow;
          // right
          C.setView([0, 120], [0, 400]);
          for (const q of MK) { const mm = MATS[q], act = q === sel.value; C.fn((T) => mm.E * mm.alpha * T, { domain: [0, 120], color: COL[q], width: act ? 1.2 : 1.6, alpha: act ? 0.4 : 0.8, dash: act ? [4, 3] : false }); }
          C.hline(s.scr, { color: 'orange', width: 1.6, dash: [6, 4] });
          C.text(`Euler cap σcr = ${f3(s.scr)} MPa (L = ${f3(s.L)} m)`, 3, s.scr, { size: 11, color: 'orange', align: 'left', baseline: 'bottom', dy: -3 });
          const g0 = gap.value / (s.L * 1000) / s.m.alpha;
          C.path([[0, 0], [Math.min(g0, 120), 0], ...[...Array(61)].map((_, i) => { const T = g0 + ((120 - g0) * i) / 60; return [T, Math.min(m.E * (m.alpha * T - gap.value / (s.L * 1000)), s.scr)]; })].filter((p) => p[0] <= 120), { color: COL[sel.value], width: 3 });
          C.dot(dT.value, s.sig, { r: 6, color: 'gold' });
          placeLabels(v, C, MK.map((q) => ({ x: 120, y: MATS[q].E * MATS[q].alpha * 120, text: NM[q], color: COL[q], r: 2, prefer: [-1, 1] })).filter((it) => it.y < 400));
          if (m.sy < 400) C.hline(m.sy, { color: 'red', width: 1, dash: [2, 3], alpha: 0.6 });
        });
        v.readout(() => {
          const s = st(), m = s.m;
          return `$E\\alpha\\,\\Delta T = ${f3(m.E / 1000)}\\ \\text{GPa}\\times ${(m.alpha * 1e6).toFixed(1)}\\cdot10^{-6}\\times ${dT.value}\\ \\text{K}$ → free expansion ${f3(s.free)} mm, ${gap.value ? `gap ${gap.value} mm → ` : ''}$\\sigma = ${s.buck ? '\\sigma_{cr}' : 'E\\varepsilon_{\\text{held}}'} = ${f3(s.sig)}$ MPa (${f3(s.sig / m.sy)} of yield) · slenderness $L/r = ${f3(s.lam)}$, $\\sigma_{cr} = ${f3(s.scr)}$ MPa → ${s.buck ? '**buckled**' : 'straight'}${s.sig > m.sy && !s.buck ? ' · **above yield**' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Proposition',
      name: 'Stresses on inclined sections: maximum shear at 45°',
      statement: String.raw`In a bar of area $A$ under axial tension $P$, cut by a plane whose normal makes angle $\theta$ with the axis. The plane has area $A/\cos\theta$ and carries the force $P$, which resolves into a normal part $P\cos\theta$ and a shear part $P\sin\theta$. The stresses on the plane are therefore, with $\sigma = P/A$,
$$\sigma_\theta = \sigma\cos^2\theta = \tfrac{\sigma}{2}(1+\cos 2\theta),\qquad \tau_\theta = \sigma\sin\theta\cos\theta = \tfrac{\sigma}{2}\sin 2\theta.$$
The normal stress is largest ($\sigma$) on the cross-section $\theta = 0$ and vanishes along the axis; the shear stress is largest, $\tau_{\max} = \sigma/2$, on planes at $\theta = \pm 45^\circ$, where the normal stress is also $\sigma/2$. In the $(\sigma_\theta, \tau_\theta)$ plane the points lie on a circle of diameter $\sigma$ (Mohr's circle, 3.3) and a plane turned through $\theta$ is a point turned through $2\theta$.`,
      idea: String.raw`Equilibrium of the part of the bar on one side of the cut (1.1, 1.6) fixes the force on the plane; dividing by its tilted area gives the stresses. The double-angle form shows that $\sigma_\theta$ and $\tau_\theta$ are the coordinates of a point moving around a circle at twice the rate of the plane. This is why ductile metals begin to yield by slip on planes near 45° (Lüders bands, the 45° slip lines on a polished steel specimen), where the shear is greatest, while a brittle material that is weak in tension cracks on the cross-section where $\sigma_\theta$ is greatest.`,
      caption: String.raw`Drag the handle around the circle (or use the slider) to tilt the cutting plane through the bar. On the plane the force $P$ splits into the normal and shear components, and the area stretches by $1/\cos\theta$; the readout recomputes $\sigma_\theta$ and $\tau_\theta$ from that force and area, and matches the formulas. The middle plot shows both stresses against $\theta$ (shear peaks at 45° at half the axial stress); on the right the same point travels around Mohr's circle, at twice the angle. Raise the axial stress to the yield strength of the chosen material and the shear on the 45° planes reaches $\sigma_y/2$, the onset of slip.`,
      deps: ['solid-1.1', 'solid-1.6'],
      refs: ['Gere–Goodno §2.6'],
      tags: ['mohr', 'shear'],
      viz(v) {
        const matSel = v.select('material', [{ value: 'steel', label: 'steel S355' }, { value: 'al', label: 'Al 6061-T6' }, { value: 'cu', label: 'copper' }], 'steel');
        const sg = v.slider('axial stress σ (MPa)', 10, 400, 200, { step: 1 });
        const th = v.slider('cutting-plane angle θ (°)', -90, 90, 30, { step: 1 });
        const S = v.stage({ x: [-6, 6], y: [-4, 4], equal: true, axes: false, height: 330, weight: 1.05, minWidth: 280, title: 'free body: the bar cut by an inclined plane' });
        const P = v.stage({ x: [-90, 90], y: [-1.1, 1.1], axes: 'box', gutter: { l: 50 }, height: 330, weight: 1, minWidth: 260, xlabel: 'plane angle θ (degrees)', ylabel: 'stress / σ', xticks: [[-90, '−90'], [-45, '−45'], [0, '0'], [45, '45'], [90, '90']], title: 'σθ and τθ against θ' });
        const M = v.stage({ x: [-0.4, 1.4], y: [-0.7, 0.7], equal: true, axes: 'box', gutter: { l: 50 }, height: 330, weight: 1, minWidth: 260, xlabel: 'normal stress σθ / σ', ylabel: 'shear stress τθ / σ', title: 'Mohr’s circle (preview of 3.3)' });
        const hr = 2.4, HC = S.handle(2.4 * Math.sin(0.5), -2.4 * Math.cos(0.5) + 0, { color: 'orange', r: 8, constrain: (x, y) => { const a = Math.atan2(x, -y); const c = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, a)); return [hr * Math.sin(c), -hr * Math.cos(c)]; } });
        let sync = true;
        HC.onDrag = () => { th.set(Math.round((Math.atan2(HC.x, -HC.y) * 180) / Math.PI)); };
        v.render(() => {
          const t = (th.value * Math.PI) / 180, s0 = sg.value, hw = 1.5, c = Math.cos(t), s = Math.sin(t);
          HC.set(hr * Math.sin(t) * 1, -hr * Math.cos(t));
          // bar: left piece cut by the plane through the origin whose normal is (cosθ, sinθ) (θ from the axis)
          const Lx = -5.2, ext = hw / Math.max(0.12, Math.abs(Math.cos(t)));
          // plane: points where x cosθ + y sinθ = 0 → x = −y tanθ ; clip to |y| ≤ hw
          const xt = (y) => -y * Math.tan(t);
          const poly = [[Lx, -hw], [xt(-hw), -hw], [xt(hw), hw], [Lx, hw]];
          S.poly(poly, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.8 });
          const xr = 5.2; S.path([[xt(hw), hw], [xr, hw], [xr, -hw], [xt(-hw), -hw]], { color: 'muted', width: 1.3, dash: [4, 3] });
          wallV(v, S, Lx, -hw - 0.3, hw + 0.3, -1, 12);
          // cut plane highlight and axial force on the right (the removed part acts on the cut face with P)
          S.line(xt(-hw), -hw, xt(hw), hw, { color: 'red', width: 3 });
          const Fl = 2.3; S.arrow(xt(0) - 0.0, 0, xt(0) + Fl, 0, { color: 'orange', width: 3.5, head: 12 }); S.text('P', xt(0) + Fl + 0.3, -0.35, { size: 14, weight: 700, color: 'orange' });
          // components on the plane: normal n = (cos, sin), tangent = (−sin, cos)
          const sc = Fl * 0.95, nx = c * c * sc, ny = c * s * sc;
          S.arrow(0, 0, nx, ny, { color: 'green', width: 2.4, head: 9 }); S.arrow(0, 0, s * s * sc * 0 + (-s) * (-s * c * sc) * 0 + 0.0, 0, { color: 'green', width: 0 });
          const vx = Fl * 0.95 * s * s, vy = -Fl * 0.95 * s * c; // P·sinθ along the tangent (sinθ·(sinθ, −cosθ))
          S.arrow(nx, ny, nx + vx, ny + vy, { color: 'purple', width: 2.4, head: 9 });
          if (Math.abs(c) > 0.2) S.text(`P cosθ`, nx * 0.5 - 0.15, ny * 0.5 + 0.3, { size: 11, color: 'green', weight: 650, align: 'right' });
          S.text(`P sinθ`, nx + vx * 0.5 + 0.2, ny + vy * 0.5 - 0.1, { size: 11, color: 'purple', weight: 650, align: 'left' });
          S.text(`A′ = A/cosθ = ${f3(1 / Math.max(1e-6, Math.abs(c)))} A`, 0, -3.5, { size: 11.5, color: 'red', weight: 650, align: 'center' });
          // angle arc between axis and normal
          const arc = []; for (let i = 0; i <= 18; i++) { const a = (t * i) / 18; arc.push([1.0 * Math.cos(a), 1.0 * Math.sin(a)]); }
          if (Math.abs(t) > 0.02) { S.path(arc, { color: 'ink', width: 1.6 }); S.text('θ', 1.25, 0.35 * Math.sign(t), { size: 13, color: 'ink' }); }
          { const hc = []; for (let i = 0; i <= 40; i++) { const a = (-Math.PI / 2) + (Math.PI * i) / 40; hc.push([hr * Math.sin(a), -hr * Math.cos(a)]); } S.path(hc, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.6 }); }
          // curves
          P.hline(0, { color: 'muted', width: 1 });
          P.fn((x) => Math.cos((x * Math.PI) / 180) ** 2, { color: 'green', width: 2.4 });
          P.fn((x) => Math.sin((x * Math.PI) / 90) / 2, { color: 'purple', width: 2.4 });
          P.vline(th.value, { color: 'muted', width: 1, dash: [4, 3] });
          P.dot(th.value, c * c, { r: 5, color: 'green' }); P.dot(th.value, s * c, { r: 5, color: 'purple' });
          P.vline(45, { color: 'muted', width: 1, dash: [2, 3], alpha: 0.5 }); P.vline(-45, { color: 'muted', width: 1, dash: [2, 3], alpha: 0.5 });
          P.text('σθ/σ = cos²θ', 3, 0.97, { size: 11, color: 'green', align: 'left', weight: 650 });
          P.text('τθ/σ = ½ sin 2θ', -88, 0.62, { size: 11, color: 'purple', align: 'left', weight: 650 });
          P.text('peak shear σ/2 at ±45°', 88, -0.88, { size: 10.5, color: 'muted', align: 'right' });
          // Mohr circle
          const mc = []; for (let i = 0; i <= 80; i++) { const a = (2 * Math.PI * i) / 80; mc.push([0.5 + 0.5 * Math.cos(a), 0.5 * Math.sin(a)]); }
          M.path(mc, { color: 'accent', width: 2.2 }); M.hline(0, { color: 'muted', width: 1 });
          M.line(0.5, 0, c * c, s * c, { color: 'gold', width: 2 });
          const a2 = []; for (let i = 0; i <= 20; i++) { const a = (2 * t * i) / 20; a2.push([0.5 + 0.14 * Math.cos(a), 0.14 * Math.sin(a)]); } M.path(a2, { color: 'gold', width: 1.6 });
          M.text('2θ', 0.5 + 0.2, 0.05 * Math.sign(t || 1) + 0.07 * Math.sign(t || 1), { size: 11, color: 'gold', weight: 700 });
          M.dot(c * c, s * c, { r: 6, color: 'gold' });
          M.dot(1, 0, { r: 4, color: 'green', hollow: true, label: 'cross-section', labelPos: 'n' }); M.dot(0, 0, { r: 4, color: 'muted', hollow: true, label: 'along axis', labelPos: 'n' });
          M.dot(0.5, 0.5, { r: 4, color: 'purple', hollow: true, label: 'θ = 45°', labelPos: 'ne' });
          void sync; void ext; void s0;
        });
        v.readout(() => {
          const t = (th.value * Math.PI) / 180, s0 = sg.value, m = MATS[matSel.value], Ap = 1 / Math.max(1e-6, Math.abs(Math.cos(t)));
          const Pn = s0 * Math.cos(t), Pv = s0 * Math.sin(t); // force per unit bar area
          const sn = Pn / Ap, tn = Pv / Ap;
          const slip = s0 / 2 >= m.sy / 2 - 1e-9;
          return `θ = ${th.value}°: $\\sigma_\\theta = P\\cos\\theta/A' = ${f3(sn)}$ MPa, $\\tau_\\theta = P\\sin\\theta/A' = ${f3(tn)}$ MPa → formulas $\\sigma\\cos^2\\theta = ${f3(s0 * Math.cos(t) ** 2)}$, $\\tfrac\\sigma2\\sin2\\theta = ${f3((s0 / 2) * Math.sin(2 * t))}$ ✓ · $\\tau_{\\max} = \\sigma/2 = ${f3(s0 / 2)}$ MPa at ±45° (shear yield onset at $\\sigma_y/2 = ${f3(m.sy / 2)}$ MPa: ${slip ? '**slip bands form at 45°**' : `${f3((s0 / m.sy) * 100)} % of the way`}) · $\\sigma_\\theta^2+\\tau_\\theta^2$ lies on the circle: $(\\sigma_\\theta-\\sigma/2)^2+\\tau_\\theta^2 = ${f3((sn - s0 / 2) ** 2 + tn ** 2)} = (\\sigma/2)^2 = ${f3((s0 / 2) ** 2)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Principle',
      name: 'Saint-Venant’s principle',
      statement: String.raw`If a set of forces acting on a small part of the surface of an elastic body is replaced by a **statically equivalent** set (same resultant force and same moment) acting on that part, the stresses and strains change appreciably only in the neighbourhood of the loaded region; at distances large compared with its size the two solutions agree. For a strip of width $W$ pulled by an axial force $P$ the stress is the uniform $P/(Wt)$ to within a few per cent about one width from the end, however the force is applied (a point load, two loads, or uniform pressure), and the difference decays roughly exponentially with distance, like $e^{-4.2x/W}$ for end loads symmetric about the axis. It is a principle of elasticity — a statement supported by elaborate partial proofs and estimates, not a simple theorem — and it is why $\sigma = F/A$ works in the bulk of a bar whatever the details of the grips.`,
      idea: String.raw`Two statically equivalent load systems differ by a self-equilibrated system (zero resultant force and moment). Such a system acts like an elastic wave of stress that can only live near its source: it cannot transmit net force, and the Papkovich–Fadle eigenfunctions of the strip show it must decay exponentially with distance, at a rate set by the smallest root $z=2.106+1.125i$ of $\sin 2z+2z=0$, i.e. $e^{-2.106\,x/c}$ with $c=W/2$ the half-width. Hence $F/A$ is correct away from the ends (1.1), and the stress concentrations around attachments are local.`,
      caption: String.raw`A finite-element solution (plane stress, bilinear quadrilaterals, 72 × 16 elements, computed live) of a strip pulled at its left end by the same total force $P$, applied as a point load, two loads or a uniform pressure (all statically equivalent), or at one edge (which is **not**: it adds a bending moment). The map shows $\sigma_{xx}/\sigma_{\text{avg}}$ (the average is 1); drag the section marker to see the stress profile across the width. On the right, the peak deviation from the uniform stress at each distance, on a log axis: the equivalent cases fall away along straight lines, i.e. exponentially, and are below a few per cent about one width from the load (the uniform load is exactly 1: it sits on the floor of the chart); the edge load, whose moment differs, never settles to uniform — break the hypothesis and the conclusion fails. The peak under a point load is mesh dependent, as the exact elastic stress there is infinite.`,
      scope: String.raw`Linear elasticity; a loaded region small compared with the body; the principle is for the region far from the load, not near it, and it can fail for thin-walled open sections.`,
      credit: 'Adhémar Barré de Saint-Venant, 1855',
      deps: ['solid-1.1'],
      refs: ['Timoshenko–Goodier ch. 3'],
      tags: ['elasticity', 'principle'],
      viz(v) {
        const KS = [['point', 'point load'], ['two', 'two loads'], ['edge', 'edge load (extra moment)'], ['uniform', 'uniform']];
        const kind = v.select('end load', KS.map(([value, label]) => ({ value, label })), 'point');
        const A = v.stage({ x: [-0.7, 4.5], y: [-0.85, 0.85], equal: true, axes: false, height: 250, full: true, title: 'σxx / σavg in the strip (same total force in each case)' });
        const B = v.stage({ x: [0, 1.4], y: [-0.5, 0.5], axes: 'box', gutter: { l: 50 }, height: 280, weight: 1, minWidth: 260, xlabel: 'σxx / σavg across the section', ylabel: 'y / W', title: 'stress profile at the marker' });
        const D = v.stage({ x: [0, 3], y: [3e-3, 10], ylog: true, axes: 'box', gutter: { l: 52 }, height: 280, weight: 1.2, minWidth: 280, xlabel: 'distance from the loaded end x / W', ylabel: 'peak |σxx − σavg| / σavg', title: 'the difference dies away' });
        const sols = {}; const get = (k) => (sols[k] ||= stripFE(k));
        const MX = A.handle(0.3, 0.0, { color: 'orange', r: 8, constrain: { x: [0.05, 4.2], y: [0, 0] } });
        const CMAP = { point: 'red', two: 'orange', edge: 'purple', uniform: 'green' };
        const peak = (sol, x) => { let m = 0; for (let j = 0; j <= 40; j++) { const y = -0.5 + j / 40; m = Math.max(m, Math.abs(sol.sxx(x, y) - 1)); } return m; };
        v.render(() => {
          const sol = get(kind.value);
          A.heat((x, y) => (x < 0 || x > 4.5 || Math.abs(y) > 0.5 ? NaN : sol.sxx(x, y)), { range: [0, 2], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: kind.value, rect: [0, -0.5, 4.5, 0.5] });
          A.rect(0, -0.5, 4.5, 0.5, { color: 'ink', width: 1.6, fill: false });
          A.clip(() => A.contour((x, y) => sol.sxx(x, y), [0.95, 1.05], { color: 'ink', width: 1, alpha: 0.5, res: 200 }), [0, 4.5], [-0.5, 0.5]);
          // load arrows at the left end
          const ar = (y, f) => A.arrow(0, y, -0.55 * f, y, { color: 'orange', width: 3, head: 10 });
          if (kind.value === 'point') ar(0, 1); else if (kind.value === 'two') { ar(0.25, 0.75); ar(-0.25, 0.75); } else if (kind.value === 'edge') ar(-0.5, 1); else for (let y = -0.45; y <= 0.46; y += 0.15) ar(y, 0.5);
          A.text('P', -0.62, 0.1, { size: 13, weight: 700, color: 'orange', align: 'right' });
          for (let y = -0.5; y <= 0.5; y += 0.1) A.line(4.5, y, 4.62, y - 0.08, { color: 'muted', width: 1 });
          A.line(4.5, -0.5, 4.5, 0.5, { color: 'ink', width: 2.4 });
          A.line(MX.x, -0.5, MX.x, 0.5, { color: 'orange', width: 1.6, dash: [4, 3] });
          A.measure(0, -0.65, 1, -0.65, 'W (one width)');
          // profile
          const prof = (y) => sol.sxx(MX.x, y); const pv = [...Array(81)].map((_, i) => prof(-0.5 + i / 80)), lo = Math.min(0, ...pv) * 1.1, hi = Math.max(1.4, ...pv) * 1.08; B.setView([lo, hi], [-0.5, 0.5]);
          B.vline(1, { color: 'muted', width: 1.2, dash: [4, 3] });
          B.path([...Array(81)].map((_, i) => { const y = -0.5 + i / 80; return [prof(y), y]; }), { color: CMAP[kind.value], width: 2.6 });
          B.text(`x = ${MX.x.toFixed(2)} W`, hi * 0.97, 0.43, { size: 11.5, weight: 650, color: 'orange', align: 'right' });
          // decay
          D.hline(0.05, { color: 'muted', width: 1, dash: [4, 3] }); D.text('5 %', 2.95, 0.05, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          for (const [k] of KS) { const sl = get(k), act = k === kind.value; D.path([...Array(61)].map((_, i) => { const x = 0.02 + (i * 2.98) / 60; return [x, Math.max(3e-3, peak(sl, x))]; }), { color: CMAP[k], width: act ? 3 : 1.4, alpha: act ? 1 : 0.55 }); }
          D.vline(MX.x, { color: 'orange', width: 1.2, dash: [4, 3] });
          D.dot(Math.min(3, MX.x), Math.max(3e-3, peak(sol, MX.x)), { r: 5, color: 'gold' });
          v.legend(KS.map(([k, l]) => [CMAP[k], l]));
        });
        v.readout(() => {
          const sol = get(kind.value), x = MX.x, pk = peak(sol, x);
          let fx = 0, n = 200; for (let i = 0; i < n; i++) fx += sol.sxx(x, -0.5 + (i + 0.5) / n) / n;
          const p1 = peak(sol, 0.6), p2 = peak(sol, 1.6), slope = Math.log(p1 / p2);
          return `Section x = ${x.toFixed(2)} W: resultant $\\int\\sigma_{xx}\\,dy = ${fx.toFixed(3)}\\,\\sigma_{\\text{avg}}$ (equilibrium: 1) · peak deviation from uniform ${(pk * 100).toFixed(1)} % ${pk < 0.05 ? '(**within 5 %**)' : ''} · fitted decay rate between x = 0.6 W and 1.6 W: ${f3(slope)} per W ${kind.value === 'edge' ? '(an eccentric load also bends the strip, which decays more slowly)' : '(theory for symmetric end loads: 4.21)'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Definition',
      name: 'Strain energy of a bar',
      statement: String.raw`The work done by an axial force $P$ that is applied slowly while the bar elongates by $\delta$ is stored as **strain energy**
$$U = \int_0^{\delta} P\,\mathrm{d}\delta' ,$$
the area under the force–elongation curve. For a linearly elastic bar ($P = k\delta$, $k = EA/L$) this is
$$U = \tfrac12 P\delta = \frac{P^2L}{2EA} = \tfrac12 k\delta^2 = \frac{\sigma^2}{2E}\,AL ,$$
so the energy per unit volume is $u = \sigma^2/2E = \tfrac12\sigma\varepsilon$. In an elastic bar all of it is recovered on unloading (the bar springs back); the value at the yield stress, $\sigma_y^2/2E$, is the **modulus of resilience**. If the material has yielded, only the elastic part $\sigma^2/2E$ is recovered along the unloading line, and the rest of the area is dissipated as heat.`,
      idea: String.raw`Slow loading means the load is always in equilibrium with the elastic force, so the work done on the bar is exactly the area under $P(\delta)$, which for Hooke's law (1.4, 1.9) is the triangle $\tfrac12P\delta$. The factor $\tfrac12$ is crucial: the force grows from zero to $P$, so the average force is only $P/2$. Dividing by the volume gives the energy density $\sigma^2/2E$, a property of the stress state rather than of the bar. Beyond yield the work is no longer a function of the final state alone: the loading path matters (1.3, 4.5).`,
      caption: String.raw`Load a steel bar slowly (the loop repeats): the bar lengthens, the point travels up the force–elongation line and the shaded area grows as $\tfrac12P\delta$ (green: recoverable). At the end the load is taken off and the bar springs back along the same line, releasing the energy. Set the peak stress above the **yield point** with the slider: the loading follows the real stress–strain curve (S355 model), unloading runs parallel to the elastic line, and the orange area is energy that never comes back; the bar is left stretched (permanent set). Strains are magnified in the picture; the numbers are real.`,
      deps: ['solid-1.9'],
      refs: ['Gere–Goodno §2.7'],
      tags: ['energy', 'elasticity'],
      viz(v) {
        const frac = v.slider('peak stress ÷ yield stress', 0.2, 1.25, 1.1, { step: 0.05 });
        const mat = v.select('material', [{ value: 'steel', label: 'steel S355' }, { value: 'al', label: 'Al 6061-T6' }], 'steel');
        const S = v.stage({ x: [-1, 11], y: [-2.5, 2.5], equal: true, axes: false, height: 240, full: true, title: 'a bar 1 m long, 100 mm² (left end fixed)' });
        const F = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: { l: 52 }, height: 300, full: true, xlabel: 'elongation δ (mm)', ylabel: 'force P (kN)', title: 'force–elongation: the area is the strain energy' });
        const T = 9;
        const info = () => {
          const m = MATS[mat.value], cv = curveOf(mat.value), A = 100, L = 1000, target = frac.value * m.sy * (frac.value >= 1 ? 1.0 : 1);
          // smallest strain with σ(e) ≥ target (curve is non-decreasing up to the ultimate point)
          let lo = 0, hi = cv.eu; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (cv.sig(mid) < target * 0.99999) lo = mid; else hi = mid; }
          const ePk = frac.value >= 1 ? hi : target / m.E, sPk = frac.value >= 1 ? cv.sig(ePk) : target, E = m.E;
          const ePerm = ePk - sPk / E;
          return { m, cv, A, L, ePk, sPk, ePerm, E };
        };
        v.animate((t) => {
          const { m, cv, A, L, ePk, sPk, ePerm, E } = info(), ph = t < 4 ? t / 4 : t < 5 ? 1 : t < 8 ? 1 - (t - 5) / 3 : 0, loading = t < 5;
          const ease = (x) => x * x * (3 - 2 * x);
          let e, sg;
          if (loading) { e = ePk * ease(ph); sg = cv.sig(e); if (frac.value < 1) sg = E * e; } else { const u = ease(ph); sg = sPk * u; e = ePerm + sg / E; }
          const d = e * L, P = (sg * A) / 1000, dpk = ePk * L, Ppk = (sPk * A) / 1000;
          F.setView([0, Math.max(dpk * 1.12, 0.05)], [0, Math.max(Ppk * 1.2, 0.5)]);
          // curve up to the peak
          const curve = (dd) => (frac.value < 1 ? (E * dd / L * A) / 1000 : (cv.sig(dd / L) * A) / 1000);
          F.fn(curve, { domain: [1e-9, dpk], n: 300, color: 'accent', width: 2.4 });
          // areas: recoverable triangle (green) and dissipated (orange)
          const rec = (Ppk * (sPk / E) * L) / 2, tot = (() => { let a = 0, n = 400; for (let i = 0; i < n; i++) { const d1 = (dpk * i) / n, d2 = (dpk * (i + 1)) / n; a += 0.5 * (curve(d1) + curve(d2)) * (d2 - d1); } return a; })();
          if (loading) F.fn(curve, { domain: [1e-9, Math.max(1e-9, d)], n: 200, fill: true, fillAlpha: 0.35, color: 'green', width: 0 });
          else {
            F.fn(curve, { domain: [1e-9, dpk], n: 300, fill: true, fillAlpha: 0.35, color: 'orange', width: 0 });
            F.poly([[ePerm * L, 0], [dpk, Ppk], [dpk, 0]], { fill: 'panel', fillAlpha: 1, stroke: false });
            F.poly([[ePerm * L, 0], [dpk, Ppk], [dpk, 0]], { fill: 'green', fillAlpha: 0.4, color: 'green', width: 1.6 });
            const rem = (P / Ppk); F.poly([[ePerm * L, 0], [d, P], [d, 0]], { fill: 'panel', fillAlpha: 1, stroke: false }); F.poly([[ePerm * L, 0], [d, P], [d, 0]], { fill: 'green', fillAlpha: 0.15, color: 'green', width: 1.2 }); void rem;
          }
          if (!loading && ePerm > 1e-6) F.line(ePerm * L, 0, dpk, Ppk, { color: 'green', width: 2, dash: [5, 3] });
          F.dot(d, P, { r: 6, color: 'gold' });
          F.text(frac.value < 1 ? `U = ½Pδ = ${f3(tot)} N·m` : `energy to this peak = ${f3(tot)} N·m`, dpk * 0.04, Ppk * 1.12, { size: 11.5, weight: 650, color: 'ink', align: 'left' });
          if (frac.value >= 1 && ePerm > 1e-6) { F.text('recovered', (ePerm * L + dpk) / 2 + dpk * 0.05, Ppk * 0.28, { size: 11, color: 'green', weight: 650, align: 'center' }); F.text('dissipated', ePerm * L * 0.5, Ppk * 0.55, { size: 11, color: 'orange', weight: 650, align: 'center' }); }
          // bar
          const mag = 0.5 / Math.max(1e-6, dpk) * 1.0 * 2.0 * 0 + 150 / Math.max(1, Math.max(dpk, 1e-9)) * 0.0 + (2.0 / Math.max(dpk, 1e-6)), X = 10 + d * mag;
          wallV(v, S, 0, -1.2, 1.2, -1, 12);
          S.rect(0, -0.5, 10, 0.5, { color: 'muted', width: 1.2, dash: [4, 3], fill: false });
          S.rect(0, -0.5, X, 0.5, { fill: loading ? 'accent' : 'green', fillAlpha: 0.3 + 0.25 * (P / Math.max(Ppk, 1e-9)), color: 'ink', width: 1.8 });
          if (P > 0.02) S.arrow(X, 0, X + 0.3 + 1.4 * (P / Ppk), 0, { color: 'orange', width: 3.5, head: 12 });
          S.text(`P = ${f3(P)} kN`, X - 0.2, 0.85, { size: 12, weight: 700, color: 'orange', align: 'right' });
          S.text(`δ = ${f3(d)} mm (×${f3(mag * 100)} in the drawing, 1 m = 10 units)`, 5, -1.9, { size: 10.5, color: 'muted', align: 'center' });
          if (!loading && ePerm * L > 0.001) S.line(10 + ePerm * L * mag, -1.0, 10 + ePerm * L * mag, 1.0, { color: 'red', width: 1.6, dash: [3, 3] });
          if (!loading && ePerm * L > 0.001) S.text('permanent set', 10 + ePerm * L * mag, -1.25, { size: 10.5, color: 'red', align: 'center' });
          void m; void rec;
        }, { period: T, still: 6.2 });
        v.readout(() => {
          const { m, ePk, sPk, ePerm, E, A, L } = info(), V = A * L; // mm³
          const uel = (sPk * sPk) / (2 * E), u = (() => { const cv = curveOf(mat.value); return frac.value < 1 ? uel : cv.work(ePk); })();
          return `At the peak: σ = ${f3(sPk)} MPa · $u_{\\text{elastic}} = \\sigma^2/2E = ${f3(uel)}$ MJ/m³ → $U_{\\text{rec}} = u\\,AL = ${f3(uel * V / 1000)}$ N·m · energy supplied $= ${f3(u * V / 1000)}$ N·m · ${frac.value >= 1 ? `**${f3(((u - uel) / u) * 100)} % is dissipated**, permanent set ${f3(ePerm * L)} mm` : 'all of it is recovered on unloading'} · resilience at yield $\\sigma_y^2/2E = ${f3((m.sy * m.sy) / (2 * E))}$ MJ/m³.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Phenomenon',
      name: 'Impact loading: a suddenly applied load doubles the stress',
      statement: String.raw`A weight $W = mg$ lowered gently onto a rod stretches it by the static elongation $\delta_{\text{st}} = W/k$, $k = EA/L$, giving the static stress $\sigma_{\text{st}} = W/A$. If the weight is **released suddenly** from the unstretched position, the rod overshoots: the peak elongation is $2\delta_{\text{st}}$ and the peak stress $2\sigma_{\text{st}}$. If it falls through a height $h$ onto a flange at the end of the rod, energy conservation $W(h + \delta_{\max}) = \tfrac12 k\delta_{\max}^2$ gives
$$\frac{\delta_{\max}}{\delta_{\text{st}}} = \frac{\sigma_{\max}}{\sigma_{\text{st}}} = 1 + \sqrt{1 + \frac{2h}{\delta_{\text{st}}}},$$
which is 2 for $h = 0$ and grows like $\sqrt{2h/\delta_{\text{st}}}$ for large drops. Damping, the mass of the rod and local plastic deformation make the real peak lower; the formula is a conservative bound.`,
      idea: String.raw`With no damping the loaded rod is a mass on a spring: it oscillates about the static position, so a release from zero stretch swings as far above it as it started below it, $\delta_{\text{st}} \pm \delta_{\text{st}}$ (1.9, 1.14). With a drop, the weight arrives with kinetic energy $Wh$ that the spring's strain energy $\tfrac12k\delta^2$ must absorb; solving the quadratic gives the factor. A stiffer or longer rod has a large $\delta_{\text{st}}$ for the same weight, so the factor falls: long, flexible members absorb impact better, which is why bolts are made long and why bungee cords can be slowed gently.`,
      caption: String.raw`A 500 kg collar is dropped from a height $h$ onto the flange at the end of a steel rod (20 mm diameter, 2 m long). The motion is simulated step by step (slow motion), the rod stretch is magnified in the drawing, and the stress in the rod is plotted against time: it swings between the extremes about the static level $\sigma_{\text{st}}$ (dashed). With $h = 0$ the peak is exactly twice the static stress; raise $h$ and the factor climbs, past the yield stress of the steel (red line). The right panel is the formula; the dot is the peak found by the simulation. Give the rod some damping and the peak after the first swing decays.`,
      deps: ['solid-1.14'],
      refs: ['Gere–Goodno §2.8'],
      tags: ['impact', 'dynamics'],
      viz(v) {
        const hS = v.slider('drop height h (mm)', 0, 60, 20, { step: 0.5 });
        const mS = v.slider('collar mass (kg)', 100, 1000, 500, { step: 10 });
        const zS = v.slider('damping (fraction of critical)', 0, 0.15, 0, { step: 0.005 });
        const S = v.stage({ x: [-3.5, 3.5], y: [1.5, 8.2], equal: true, axes: false, height: 440, weight: 0.8, minWidth: 240, title: 'collar dropped on the flange (slow motion)' });
        const TP = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: { l: 52 }, height: 440, weight: 1.15, minWidth: 280, xlabel: 'time (ms)', ylabel: 'rod stress σ (MPa)', title: 'stress in the rod' });
        const FP = v.stage({ x: [1e-2, 1e3], y: [1, 60], xlog: true, ylog: true, axes: 'box', gutter: { l: 52 }, height: 440, weight: 1.0, minWidth: 260, xlabel: 'h / δst', ylabel: 'σmax / σst', title: 'peak stress factor' });
        const E = MATS.steel.E, A = (Math.PI * 20 ** 2) / 4, Lr = 2000, kN_mm = (E * A) / Lr; // N/mm
        const par = () => { const m = mS.value, W = m * 9.81, dst = W / kN_mm, h = hS.value; return { m, W, dst, h, sst: W / A, fac: 1 + Math.sqrt(1 + (2 * h) / dst), k: kN_mm * 1000 /* N/m */, c: 2 * zS.value * Math.sqrt(kN_mm * 1000 * m) }; };
        const TS = 0.05; // sim seconds per animation second
        // explicit event-driven integration (free fall, then collar + spring), deterministic and cheap
        const traj = () => {
          const p = par(), g = 9.81, h = p.h / 1000, m = p.m, k = p.k, c = p.c, dt = 2e-5, out = [], tf = Math.sqrt((2 * h) / g), v0 = g * tf;
          let t = 0, y = 0, vy = v0; // y = rod elongation (m)
          const wn = Math.sqrt(k / m), N = Math.round(((tf + 8 * ((2 * Math.PI) / wn)) / dt)), stride = Math.max(1, Math.round(N / 1500));
          out.push([0, 0, -1]);
          for (let i = 1; i <= N; i++) {
            t = i * dt;
            if (t < tf) { out.push(i % stride ? null : [t, 0, (g * t * t) / 2]); continue; }
            const a = g - (k * y + c * vy) / m; vy += a * dt; y += vy * dt;
            if (i % stride === 0) out.push([t, y, h]);
          }
          return { pts: out.filter(Boolean), tf, wn };
        };
        let cache = { key: '', tr: null };
        const getTr = () => { const key = `${hS.value}|${mS.value}|${zS.value}`; if (cache.key !== key) cache = { key, tr: traj() }; return cache.tr; };
        v.animate((t) => {
          const p = par(), { pts, tf, wn } = getTr(), ts = Math.min(t * TS, pts[pts.length - 1][0]), Tend = pts[pts.length - 1][0];
          const at = (tt) => { let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid][0] <= tt) lo = mid; else hi = mid; } return pts[lo]; };
          const cur = at(ts), y = cur[1], fall = cur[2] < 0 ? 0 : cur[2];
          const ypk = p.dst * p.fac, mag = 1.2 / ypk * 1000;  // drawing units per mm
          const sigAt = (yy) => (E * (yy * 1000)) / Lr;
          // plot
          const sMax = Math.max(1.12 * p.sst * p.fac, 1.1 * MATS.steel.sy * (p.sst * p.fac > 0.5 * MATS.steel.sy ? 1 : 0), 1);
          TP.setView([0, Tend * 1000], [0, sMax]);
          TP.hline(p.sst, { color: 'muted', width: 1.4, dash: [6, 4] }); TP.text(`static σst = ${f3(p.sst)} MPa`, Tend * 1000 * 0.98, p.sst, { size: 10.5, color: 'muted', align: 'right', baseline: 'top', dy: 3 });
          TP.hline(2 * p.sst, { color: 'green', width: 1.2, dash: [2, 3], alpha: 0.7 }); TP.text('2σst', Tend * 1000 * 0.98, 2 * p.sst, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          if (sMax > MATS.steel.sy) { TP.hline(MATS.steel.sy, { color: 'red', width: 1.4, dash: [4, 3] }); TP.text('yield 355 MPa', 2, MATS.steel.sy, { size: 10.5, color: 'red', align: 'left', baseline: 'bottom', dy: -2 }); }
          TP.path(pts.filter((q) => q[0] <= ts).map((q) => [q[0] * 1000, sigAt(q[1])]), { color: 'accent', width: 2.4 });
          const pk = pts.reduce((m, q) => Math.max(m, sigAt(q[1])), 0);
          const pkSoFar = pts.filter((q) => q[0] <= ts).reduce((m, q) => Math.max(m, sigAt(q[1])), 0);
          TP.dot(cur[0] * 1000, sigAt(y), { r: 5, color: 'gold' });
          TP.hline(pkSoFar, { color: 'orange', width: 1, alpha: 0.7, dash: [3, 3] }); TP.text(`peak so far ${f3(pkSoFar)} MPa`, 2, pkSoFar, { size: 10.5, color: 'orange', align: 'left', baseline: 'bottom', dy: -2 });
          // formula panel
          FP.setView([1e-2, 1e3], [1, 60]);
          FP.fn((x) => 1 + Math.sqrt(1 + 2 * x), { domain: [1e-2, 1e3], color: 'accent', width: 2.4 });
          FP.hline(2, { color: 'green', width: 1.2, dash: [3, 3] });
          FP.text('2 for h = 0 (sudden load)', 1.5e-2, 2, { size: 10.5, color: 'green', align: 'left', baseline: 'top', dy: 4 });
          FP.dot(Math.max(1e-2, p.h / p.dst), p.fac, { r: 6, color: 'gold' });
          if (zS.value === 0) FP.dot(Math.max(1e-2, p.h / p.dst), pk / p.sst, { r: 3.5, color: 'red', hollow: true });
          FP.text(zS.value === 0 ? 'o = peak found by the simulation' : '', 1.5e-2, 45, { size: 10.5, color: 'red', align: 'left' });
          // scene: flange at the bottom of the rod
          const topY = 7.6, rodL = 4.0, scale = 1.0, fy = topY - rodL - y * mag;
          ceilingH(v, S, topY, -1.2, 1.2, 10);
          S.rect(-0.16, fy, 0.16, topY, { fill: 'accent', fillAlpha: 0.3, color: 'ink', width: 1.6 });
          S.rect(-0.16, topY - rodL, 0.16, topY - rodL, { color: 'muted', width: 1, fill: false });
          S.line(-0.9, topY - rodL, 0.9, topY - rodL, { color: 'muted', width: 1, dash: [3, 3] }); S.text('unstretched', 1.0, topY - rodL + 0.25, { size: 10, color: 'muted', align: 'left' });
          S.rect(-0.75, fy - 0.2, 0.75, fy, { fill: 'gray', fillAlpha: 0.7, color: 'ink', width: 1.6 });
          const hDraw = p.h / p.dst * 0.0 + Math.min(2.6, p.h * 0.075), cy = fy + (cur[2] < 0 ? hDraw : Math.max(0, hDraw - (cur[2] / (p.h / 1000 || 1)) * hDraw * (p.h > 0 ? 1 : 0)));
          const cyy = cur[2] < 0 || p.h === 0 ? fy : fy + Math.max(0, hDraw * (1 - fall / (p.h / 1000)));
          void cy;
          S.rect(-0.55, cyy, 0.55, cyy + 0.6, { fill: 'orange', fillAlpha: 0.65, color: 'ink', width: 1.8 });
          S.text(`${mS.value} kg`, 0, cyy + 0.3, { size: 11, weight: 700, color: 'ink', align: 'center' });
          if (p.h > 0.01) S.measure(1.4, fy + 0.0 + (ts < tf ? 0 : 0) + (cur[2] < 0 ? 0 : 0), 1.4, fy + hDraw, `h = ${f3(p.h)} mm`);
          S.text(`stretch magnified ×${f3(mag)}`, 0, 1.75, { size: 10.5, color: 'muted', align: 'center' });
          void wn; void scale;
        }, { period: 12, still: 3.2 });
        v.readout(() => {
          const p = par(), { pts } = getTr(), pk = pts.reduce((m, q) => Math.max(m, (E * q[1] * 1000) / Lr), 0), ratio = pk / p.sst;
          return `$\\delta_{\\text{st}} = W/k = ${f3(p.dst)}$ mm, $\\sigma_{\\text{st}} = ${f3(p.sst)}$ MPa · formula: $1+\\sqrt{1+2h/\\delta_{\\text{st}}} = ${f3(p.fac)}$ → $\\sigma_{\\max} = ${f3(p.fac * p.sst)}$ MPa · simulation: peak $= ${f3(pk)}$ MPa ($${f3(ratio)}\\,\\sigma_{\\text{st}}$) ${zS.value === 0 ? (Math.abs(ratio - p.fac) < 0.02 * p.fac ? '✓ agrees' : '') : '(damped: lower than the formula)'} ${p.fac * p.sst > MATS.steel.sy ? '· **the rod would yield**' : ''}`;
        });
      },
    },
  ],
};
