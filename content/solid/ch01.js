// Solid Mechanics & Structures — Chapter 1: Stress, strain and axial loading (items 1.1–1.8; 1.9–1.15 are in ch01-b.js)
//
// Sources checked (Oct 2026). Material numbers are the published headline values; curve SHAPES are illustrative models.
//   Structural steel S355 (EN 10025-2, EN 1993-1-1 Table 3.1, t ≤ 40 mm): fy = 355, fu = 490 MPa; §3.2.6: E = 210 GPa,
//     ν = 0.3, G = E/2(1+ν) ≈ 81 GPa, α = 12·10⁻⁶ /K. Sources: Eurocode design tables (civils.ai, eurocodeapplied.com).
//   Aluminium 6061-T6: E 68.9 GPa, ν 0.33, yield 276 MPa, ultimate 310 MPa, α 23.6·10⁻⁶ /K (ASM / MatWeb "typical" values;
//     other databases quote the minimum specification values 240–260 MPa for yield — the typical values are used here).
//   Copper C11000 annealed: E 117–120 GPa, ν 0.34, yield 69 MPa, UTS 220 MPa, α ≈ 17·10⁻⁶ /K (CDA; MakeItFrom OS050 entry).
//   Concrete C30/37 (EN 1992-1-1 Table 3.1): fck 30 MPa, Ecm 33 GPa (formula gives 32.8), fctm 2.9 MPa; ν = 0.2 (uncracked),
//     α = 10·10⁻⁶ /K.
//   Timber C24 (EN 338 Table 1): E0,mean 11 GPa, ft,0,k 14.5 MPa, fc,0,k 21 MPa, ρmean 420 kg/m³.
//   Grey cast iron ASTM A48 class 30: tensile strength ≥ 30 ksi = 207 MPa; E and ν mid-range of the ASM Handbook spread.
//   Natural rubber: shear modulus ≈ 0.4 MPa, neo-Hookean model, typical (illustrative) values.
//   The S355 / 6061-T6 / copper curves are built by makeCurve() (ch01.shared.js): linear elastic, 0.2 % offset or Lüders
//   plateau, hardening to the ultimate strength at the uniform elongation, then a post-necking drop; the strains at maximum
//   load and fracture (steel 15 %/26 %, 6061-T6 8.5 %/12 %, copper 32 %/50 %) are typical, not measured on one specimen.

import { MATS, G_of, curveOf, rubberSig, RUBBER, placeLabels, textW, wallV, ceilingH, heatColor } from './ch01.shared.js';

const f3 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2)).replace('-', '−');
const MAT3 = (v, def = 'steel') => v.select('material', [{ value: 'steel', label: 'steel S355' }, { value: 'al', label: 'Al 6061-T6' }, { value: 'cu', label: 'copper' }], def);

export default {
  collection: 'solid',
  chapter: 1,
  title: 'Stress, strain and axial loading',
  summary: String.raw`Solid mechanics rests on three ideas used over and over: equilibrium of forces, compatibility of deformations, and a constitutive law linking the two. In a bar under tension these become stress, strain and Hooke's law, and already they explain elongation, thermal stress, statically indeterminate structures and why a suddenly applied load is twice as dangerous. The stress–strain curve and the factor of safety bring real materials and real design into the picture.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Normal stress',
      statement: String.raw`Cut a body by an imaginary plane and let $\Delta F_n$ be the force component **perpendicular** to the plane carried by a small patch of area $\Delta A$ around a point. The **normal stress** at that point is
$$\sigma = \lim_{\Delta A\to 0} \frac{\Delta F_n}{\Delta A},$$
positive when it pulls (tension) and negative when it pushes (compression). Its unit is the pascal, $1\ \text{Pa} = 1\ \text{N/m}^2$; engineers work in $\text{MPa} = \text{N/mm}^2$. For a straight prismatic bar loaded by an axial force $F$ through the centroid, and at sections away from the ends, the stress is uniform and $\sigma = F/A$.`,
      idea: String.raw`Force alone does not say whether a bar is in danger; a thin rod and a thick one carry the same $F$ but the thin rod's material is far more heavily loaded. Dividing by area measures how hard each patch of material is working, and it is stress, not force, that a material's strength is quoted in. Equilibrium of the free body on either side of the cut (mech-1.6) forces the internal resultant to equal $F$; the uniform distribution is the simplest one with that resultant and it is the correct one far from the ends (1.13).`,
      caption: String.raw`Drag the orange handle to pull the bar, change the neck diameter and the material. The bar is coloured by $\sigma/\sigma_y$ (cool to hot; red means yielding); the lower panel plots $\sigma = F/A(x)$ along the bar, so the narrow neck glows hottest and crosses the yield line first. Move the probe along the bar to read the stress at any section. Drawn lengthwise to scale, diameters schematic.`,
      deps: ['mech-1.6'],
      refs: ['Gere–Goodno §1.4'],
      tags: ['stress', 'axial'],
      viz(v) {
        const mat = MAT3(v);
        const dn = v.slider('neck diameter (mm)', 6, 30, 14, { step: 0.5 });
        const A = v.stage({ x: [-0.4, 13.6], y: [-2.6, 2.6], equal: true, axes: false, height: 250, full: true, title: 'a bar of diameter 30 mm with a turned-down neck' });
        const B = v.stage({ x: [0.8, 8.8], y: [0, 1], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'position along the bar', ylabel: 'σ (MPa)', xticks: [], title: 'stress σ = F / A(x) at every section' });
        const X0 = 0.8, X1 = 8.8, D0 = 30, HW = 1.35;
        const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
        const diam = (x) => D0 - (D0 - dn.value) * sm(2.4, 3.5, x) * (1 - sm(5.3, 6.4, x));
        const FH = A.handle(11.2, 0, { color: 'orange', label: 'F', labelPos: 'n', constrain: { x: [9.2, 13.2], y: [0, 0] } });
        const PR = A.handle(7.2, 0, { color: 'accent', constrain: { x: [1.0, 8.6], y: [0, 0] } });
        FH.set(9.8, 0);
        const Fk = () => (FH.x - X1) * 70; // kN
        const area = (x) => (Math.PI * diam(x) ** 2) / 4;
        v.render(() => {
          const m = MATS[mat.value], F = Fk(), n = 220, dx = (X1 - X0) / n;
          for (let i = 0; i < n; i++) {
            const x = X0 + (i + 0.5) * dx, hw = (HW * diam(x)) / D0, sg = (F * 1000) / area(x);
            A.rect(x - dx / 2 - 0.004, -hw, x + dx / 2 + 0.004, hw, { fill: heatColor(v, sg / m.sy), fillAlpha: 1, stroke: false });
          }
          const top = [], bot = [];
          for (let i = 0; i <= n; i++) { const x = X0 + i * dx, hw = (HW * diam(x)) / D0; top.push([x, hw]); bot.push([x, -hw]); }
          A.path([...top, ...bot.reverse()], { close: true, color: 'ink', width: 1.6, fill: false });
          wallV(v, A, X0, -2.1, 2.1, -1, 12);
          if (F > 0.5) A.arrow(X1, 0, FH.x, 0, { color: 'orange', width: 3, head: 11 });
          A.text(`F = ${f3(F)} kN`, X1 + 0.15, 0.55, { size: 12, weight: 650, color: 'orange', align: 'left' });
          // probe section
          const hp = (HW * diam(PR.x)) / D0;
          A.line(PR.x, -hp - 0.25, PR.x, hp + 0.25, { color: 'accent', width: 1.6, dash: [5, 3] });
          A.text(`ø${f3(diam(PR.x))}`, PR.x, hp + 0.45, { size: 11, weight: 650, color: 'accent', align: 'center' });
          // profile
          const smax = Math.max(1.3 * m.sy, (F * 1000) / area(3.9) * 1.1);
          B.setView([X0, X1], [0, smax]);
          const prof = (x) => (F * 1000) / area(x);
          B.fn(prof, { domain: [X0, X1], n: 240, color: 'red', width: 2.4, fill: true, fillAlpha: 0.12 });
          B.hline(m.sy, { color: 'orange', width: 1.6, dash: [6, 4] });
          B.text(`yield ${m.sy} MPa`, X1 - 0.08, m.sy, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -3 });
          B.vline(PR.x, { color: 'accent', width: 1.4, dash: [5, 3] });
          B.dot(PR.x, prof(PR.x), { r: 5, color: 'accent' });
        });
        v.readout(() => {
          const m = MATS[mat.value], F = Fk(), a = area(PR.x), s = (F * 1000) / a, an = area(4.5), sn = (F * 1000) / an;
          const state = sn >= m.sy ? '**the neck has yielded**' : s >= m.sy ? '**yielded here**' : 'elastic everywhere';
          return `Probe: $A = ${f3(a)}\\ \\text{mm}^2$, $\\sigma = F/A = ${f3(F * 1000)}/${f3(a)}\\ \\text{N/mm}^2 =$ **${f3(s)} MPa** (${f3(s / m.sy)} of yield). · Neck: $A = ${f3(an)}\\ \\text{mm}^2$, $\\sigma = ${f3(sn)}$ MPa, i.e. ${f3(area(1) / an)}× the stress in the thick part. · ${state} (${m.name}, $\\sigma_y = ${m.sy}$ MPa).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Normal strain',
      statement: String.raw`When a bar of original length $L$ is stretched by $\delta$, its **average normal strain** is
$$\varepsilon = \frac{\delta}{L} = \frac{L_{\text{new}} - L}{L},$$
a pure number (often quoted in microstrain, $1\,\mu\varepsilon = 10^{-6}$). At a point, the **local normal strain** is the limit of the same ratio for a shrinking gauge length, $\varepsilon(x) = \mathrm{d}u/\mathrm{d}x$, where $u(x)$ is the displacement of the section that was at $x$. Tension gives positive strain, compression negative. The average strain is the mean of the local strain, $\varepsilon_{\text{avg}} = \frac1L\int_0^L \varepsilon\,\mathrm{d}x$, and the local strain is the same everywhere only in a uniform bar.`,
      idea: String.raw`Strain is the deformation measured relative to the length it is spread over, which is why a 1 mm stretch matters on a 10 mm gauge but not on a 10 m bridge cable. Writing the displacement of the marks as a function $u(x)$, the stretch of a short segment is $u(x+\Delta x) - u(x)$, so the strain is the slope of $u$ and the total elongation is the integral of the strain: $\delta = \int_0^L \varepsilon\,\mathrm{d}x$. A uniform bar has a straight $u(x)$; a bar that is thin in one place concentrates the strain there.`,
      caption: String.raw`Drag the free end to stretch the bar (strains are far larger than in a metal so that you can see them). Each gauge mark moves with the material; the upper plot is the displacement $u(x)$ of the marks and the bars below are the local strains of each gauge segment against the average $\delta/L$. Switch to a **tapered** bar (elastic, so $\varepsilon \propto 1/A$): the strain is no longer the same everywhere, although $\delta/L$ still averages it.`,
      deps: [],
      refs: ['Gere–Goodno §1.4'],
      tags: ['strain', 'axial'],
      viz(v) {
        const shape = v.select('bar', [{ value: 'u', label: 'uniform' }, { value: 't', label: 'tapered' }], 'u');
        const S = v.stage({ x: [-0.5, 14.5], y: [-2.2, 2.2], equal: true, axes: false, height: 230, full: true, title: 'a bar with gauge marks painted every tenth of its length' });
        const U = v.stage({ x: [0, 10], y: [0, 4], axes: 'box', gutter: true, height: 250, xlabel: 'original position x of a mark', ylabel: 'displacement u (units)', title: 'displacement of the marks u(x)' });
        const E = v.stage({ x: [0.3, 10.7], y: [0, 0.6], axes: 'box', gutter: { l: 46 }, height: 250, xlabel: 'gauge segment', ylabel: 'strain ε', xticks: [], title: 'local strain of each segment' });
        const H = S.handle(11.5, 0, { color: 'orange', label: 'δ', labelPos: 'n', constrain: { x: [10.2, 13.8], y: [0, 0] } });
        H.set(11.4, 0);
        const N = 10, L0 = 10, hw = (x) => (shape.value === 't' ? 1.5 - 0.075 * x : 1);
        // local strain profile ∝ 1 / A(x) (elastic), normalised to mean δ/L; uniform → constant
        const prof = () => { const w = [...Array(N + 1)].map((_, i) => 1 / hw((i * L0) / N) ** 2); const mean = (() => { let a = 0; for (let k = 0; k < 400; k++) a += 1 / hw(((k + 0.5) * L0) / 400) ** 2; return a / 400; })(); return (x) => 1 / hw(x) ** 2 / mean; void w; };
        v.render(() => {
          const delta = Math.max(0, H.x - 10), ea = delta / L0, p = prof();
          // marks: u(x) = ε_avg ∫ p
          const uAt = (x) => { let a = 0; const m = 60; for (let k = 0; k < m; k++) a += p(((k + 0.5) * x) / m) * (x / m); return ea * a; };
          const xs = [...Array(N + 1)].map((_, i) => (i * L0) / N), us = xs.map(uAt);
          const top = [], bot = [];
          for (let k = 0; k <= 120; k++) { const x = (k * L0) / 120, X = x + uAt(x); top.push([X, hw(x) * (1 - 0.0 * ea)]); bot.push([X, -hw(x)]); }
          S.path([...top, ...bot.reverse()], { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.18 });
          const g = [...Array(N + 1)].map((_, i) => xs[i] + us[i]);
          g.forEach((X, i) => { const h = hw(xs[i]); S.line(X, -h, X, h, { color: i === 0 || i === N ? 'ink' : 'orange', width: i === 0 || i === N ? 2.5 : 2 }); });
          S.line(0, -2, 0, 2, { color: 'ink', width: 2 }); wallV(v, S, 0, -1.9, 1.9, -1, 12);
          S.line(0, -1.75, 10, -1.75, { color: 'muted', width: 1, dash: [3, 3] });
          S.measure(10, -1.75, 10 + delta, -1.75, `δ = ${delta.toFixed(2)}`);
          S.text('original length L = 10', 5, -1.95, { size: 10.5, color: 'muted', align: 'center' });
          if (delta > 0.05) S.arrow(10 + delta, 0, 10 + delta + 1.1, 0, { color: 'orange', width: 3, head: 10 });
          // plots
          U.setView([0, 10], [0, Math.max(0.5, 4)]);
          U.fn((x) => uAt(x), { domain: [0, 10], color: 'accent', width: 2.2 });
          U.dots(xs.map((x, i) => [x, us[i]]), { r: 4, color: 'orange' });
          U.line(0, 0, 10, ea * L0, { color: 'muted', width: 1.2, dash: [5, 4] });
          U.text('dashed: straight line of slope δ/L', 0.3, 3.7, { size: 10.5, color: 'muted' });
          const segs = [...Array(N)].map((_, i) => (us[i + 1] - us[i]) / (xs[i + 1] - xs[i]));
          const top2 = Math.max(0.1, ...segs, ea) * 1.25;
          E.setView([0.3, 10.7], [0, top2]);
          segs.forEach((e, i) => E.rect(i + 0.65, 0, i + 1.35, e, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1 }));
          E.hline(ea, { color: 'accent', width: 2, dash: [6, 4] });
          E.text(`average δ/L = ${ea.toFixed(3)}`, 10.6, ea, { size: 11, color: 'accent', align: 'right', baseline: 'bottom', dy: -3 });
        });
        v.readout(() => {
          const delta = Math.max(0, H.x - 10), ea = delta / L0, p = prof();
          return `$\\varepsilon_{\\text{avg}} = \\delta/L = ${delta.toFixed(3)}/10 =$ **${ea.toFixed(4)}** (${(ea * 1e6).toFixed(0)} microstrain) · ${shape.value === 'u' ? 'every segment shows the same strain: local = average.' : `local strain runs from **${(ea * p(0)).toFixed(3)}** at the thick (wall) end to **${(ea * p(10)).toFixed(3)}** at the thin end, averaging ${ea.toFixed(3)}.`} · $\\delta = \\int_0^L\\varepsilon\\,dx$ ✓.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'The stress–strain curve',
      statement: String.raw`A **tensile test** pulls a standard specimen of original area $A_0$ and gauge length $L_0$ and records the force $P$ and the elongation $\delta$. The **engineering stress–strain curve** plots $\sigma = P/A_0$ against $\varepsilon = \delta/L_0$. For a ductile metal such as structural steel it shows, in order:
- a **linear elastic** region, slope $E$, ending at the proportional limit; unloading here returns along the same line;
- **yielding** at $\sigma_y$ (a plateau for mild steel; for aluminium, where no plateau exists, the **0.2 % offset** yield strength is read where a line of slope $E$ starting at $\varepsilon = 0.002$ meets the curve);
- **strain hardening** up to the **ultimate strength** $\sigma_u$ (the maximum of the engineering stress);
- **necking**: the section contracts locally, so the *engineering* stress falls although the true stress rises, until **fracture**.
Unloading from any point beyond yield follows a line parallel to the elastic slope and leaves a **permanent set** $\varepsilon_p = \varepsilon - \sigma/E$. The area under the curve is the work per unit volume needed to reach that strain; up to fracture it is the **toughness**. An elastomer such as rubber has no yield at all: its curve is non-linear and fully reversible.`,
      idea: String.raw`Stress and strain (1.1, 1.2) remove the size of the specimen, so one curve describes a material, not a part. The elastic part is atoms stretching bonds and recovering; yield is the onset of planes of atoms slipping past each other, which is irreversible, so only the elastic strain $\sigma/E$ comes back on unloading. Hardening follows because slip tangles dislocations, and necking starts when the hardening can no longer make up for the shrinking area (the Considère condition $d\sigma_{\text{true}}/d\varepsilon_{\text{true}} = \sigma_{\text{true}}$), which is exactly the maximum of the engineering curve.`,
      caption: String.raw`Drag the gold point along the curve to pull the virtual specimen; the gauge length, necking and fracture follow. The **unload** slider takes the load off along the elastic slope (a line parallel to the initial one): see where the specimen comes to rest, the permanent set. Switch material, and switch to the **first 1 %** window to see the elastic line, the proportional limit and the 0.2 % offset construction. The shaded area is the energy per unit volume absorbed so far. Published headline values; curve shape is a calibrated model (see notes).`,
      deps: ['solid-1.1', 'solid-1.2'],
      refs: ['Gere–Goodno §1.5', 'Gere–Goodno §1.6'],
      credit: 'tensile testing established in the 19th century; engineering vs. true stress: Considère, 1885',
      tags: ['stress-strain', 'yield'],
      viz(v) {
        const matSel = v.select('material', [{ value: 'steel', label: 'steel S355' }, { value: 'al', label: 'Al 6061-T6' }, { value: 'cu', label: 'copper' }, { value: 'rub', label: 'rubber' }], 'steel');
        const win = v.select('strain window', [{ value: 'full', label: 'whole test' }, { value: 'zoom', label: 'first 1 %' }], 'full');
        const unl = v.slider('unload (% of the stress)', 0, 100, 0, { step: 1 });
        const SP = v.stage({ x: [-2.3, 1.2], y: [-0.2, 4.4], axes: false, height: 400, weight: 0.55, minWidth: 190, title: 'specimen (gauge length marked)' });
        const C = v.stage({ x: [0, 0.3], y: [0, 560], axes: 'box', gutter: { l: 50, b: 38 }, height: 400, weight: 1.6, xlabel: 'engineering strain ε = δ/L₀', ylabel: 'engineering stress σ (MPa)', title: 'stress–strain curve' });
        const sigF = () => (matSel.value === 'rub' ? rubberSig : curveOf(matSel.value).sig);
        const emaxOf = () => (matSel.value === 'rub' ? 5 : curveOf(matSel.value).ef);
        const H = C.handle(0.1, 100, { color: 'gold', r: 8, constrain: (x) => { const e = Math.max(0, Math.min(emaxOf() * (win.value === 'zoom' ? Math.min(1, 0.01 / emaxOf()) : 1), x)); return [e, sigF()(e)]; } });
        matSel.el.addEventListener?.('click', () => {});
        let lastMat = '';
        const state = () => {
          const m = matSel.value, e = Math.min(emaxOf(), H.x), f = sigF(), s = f(e), up = unl.value / 100;
          const E = m === 'rub' ? 3 * RUBBER.G : curveOf(m).E;
          const rev = m === 'rub';
          const eU = rev ? e - up * (e - 0) : e - up * s / E; // return strain after unloading
          const sU = rev ? f(eU) : s * (1 - up);
          const broken = m !== 'rub' ? e >= emaxOf() - 1e-9 : e >= 5 - 1e-9;
          return { m, e, s, E, eU, sU, up, rev, broken };
        };
        v.render(() => {
          const m = matSel.value;
          if (m !== lastMat) { lastMat = m; H.set(Math.min(H.x, 1e9), sigF()(Math.min(H.x, emaxOf()))); }
          const cv = m === 'rub' ? null : curveOf(m), f = sigF(), em = emaxOf();
          const xmax = win.value === 'zoom' ? (m === 'rub' ? 0.1 : 0.01) : em * 1.04;
          const smax = m === 'rub' ? 4.2 : cv.su * 1.18;
          const ymax = win.value === 'zoom' ? (m === 'rub' ? 0.35 : cv.su * 1.1) : smax;
          C.setView([0, xmax], [0, ymax]);
          if (m === 'rub') C.setLabels(win.value === 'zoom' ? 'engineering strain ε' : 'engineering strain ε (400 % = stretched to 5×)', 'engineering stress σ (MPa)'); else C.setLabels('engineering strain ε = δ/L₀', 'engineering stress σ (MPa)');
          const st = state();
          // energy shading
          const lim = Math.min(st.e, xmax);
          C.fn(f, { domain: [0, lim], n: 400, fill: true, fillAlpha: 0.22, color: 'accent', width: 0 });
          C.fn(f, { domain: [0, Math.min(em, xmax * 1.02)], n: 800, color: 'accent', width: 2.6 });
          if (m !== 'rub') {
            C.line(0, 0, Math.min(xmax, cv.su * 1.2 / cv.E), cv.su * 1.2, { color: 'muted', width: 1.2, dash: [5, 4], alpha: 0.8 });
            C.line(0.002, 0, 0.002 + cv.sy * 1.3 / cv.E, cv.sy * 1.3, { color: 'orange', width: 1.4, dash: [4, 3] });
            const items = [
              { x: cv.ePL, y: cv.sPL, text: 'proportional limit', color: 'muted', r: 4 },
              { x: cv.eOff, y: cv.sOff, text: `yield ${cv.sy} MPa${MATS[m].eL ? ' (plateau)' : ' (0.2 % offset)'}`, color: 'orange', r: 4 },
              { x: cv.eu, y: cv.su, text: `ultimate ${cv.su} MPa`, color: 'green', r: 4, prefer: [0, -1] },
              { x: cv.ef, y: cv.sig(cv.ef), text: 'fracture', color: 'red', r: 4, prefer: [0, -1] },
            ].filter((it) => it.x < xmax * 0.98 && it.y < ymax * 0.98);
            items.forEach((it) => C.dot(it.x, it.y, { r: 4.5, color: it.color }));
            placeLabels(v, C, items.map((it) => ({ ...it, size: 11 })), { points: [[C.X(st.e), C.Y(st.s), 10]] });
          } else {
            C.line(0, 0, xmax, 3 * RUBBER.G * xmax, { color: 'muted', width: 1.2, dash: [5, 4] });
          }
          // unloading line
          if (st.up > 0) {
            if (st.rev) { C.fn(f, { domain: [st.eU, st.e], n: 200, color: 'gold', width: 3 }); }
            else { C.line(st.e, st.s, st.eU, 0, { color: 'gold', width: 2.6 }); C.dot(st.eU, 0, { r: 5, color: 'red' }); if (st.eU > 1e-6) C.text('permanent set', st.eU, 0, { size: 11, color: 'red', dy: -16, align: 'center', weight: 650 }); }
            C.dot(st.eU, st.sU, { r: 6, color: 'gold', hollow: true });
          }
          // specimen
          const e = st.up > 0 ? st.eU : st.e, mo = st.m;
          const L = 1 + (mo === 'rub' ? e * 0.2 : e * 1.0), y0 = 0, gl = 2.0, cy = 2.1;
          const total = 4.0 + (mo === 'rub' ? Math.min(0.2 * e, 1.0) : 0);
          void total;
          const hl = 0.5 * gl * (1 + (mo === 'rub' ? 0.6 * Math.min(e, 5) : 0.9 * Math.min(e, 0.5) * (xmax > 0.05 ? 1 : 1)));
          const ylo = cy - hl, yhi = cy + hl;
          const nu = mo === 'rub' ? 0.5 : cv.sy ? 0.3 : 0.3;
          const wEl = 0.38, w = (ee) => wEl * (mo === 'rub' ? (1 + ee) ** -0.5 : 1 - 0.5 * Math.min(ee, 0.5));
          const neck = mo === 'rub' ? 0 : cv.neck(Math.min(e, em));
          const frac = !st.rev && st.up === 0 && st.broken;
          const prof = (yy) => { const t = (yy - ylo) / (yhi - ylo); const dnk = neck * Math.exp(-(((t - 0.5) / 0.14) ** 2)); return w(e) * (1 - dnk); };
          const pts = (side, gap) => { const out = []; for (let k = 0; k <= 80; k++) { const yy = ylo + ((yhi - ylo) * k) / 80; out.push([side * prof(yy), yy]); } return out; };
          const gapH = frac ? 0.25 : 0;
          const draw = (lo, hi, capLo, capHi) => {
            const L1 = [], R1 = [];
            for (let k = 0; k <= 40; k++) { const yy = lo + ((hi - lo) * k) / 40; const pw = prof(yy); L1.push([-pw, yy]); R1.push([pw, yy]); }
            return [...L1, ...R1.reverse()];
          };
          // grips
          SP.rect(-0.9, -0.1, 0.9, ylo - 0.45, { fill: 'gray', fillAlpha: 0.45, color: 'ink', width: 1.4 });
          SP.rect(-0.9, yhi + 0.45, 0.9, 4.3, { fill: 'gray', fillAlpha: 0.45, color: 'ink', width: 1.4 });
          const mid = (ylo + yhi) / 2;
          if (!frac) {
            SP.rect(-0.62, ylo - 0.45, 0.62, ylo, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 });
            SP.rect(-0.62, yhi, 0.62, yhi + 0.45, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 });
            const body = []; for (let k = 0; k <= 80; k++) { const yy = ylo + ((yhi - ylo) * k) / 80; body.push([-prof(yy), yy]); } for (let k = 80; k >= 0; k--) { const yy = ylo + ((yhi - ylo) * k) / 80; body.push([prof(yy), yy]); }
            SP.path(body, { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.3 });
            for (let i = 0; i <= 8; i++) { const yy = ylo + ((yhi - ylo) * i) / 8; SP.line(-prof(yy) - 0.08, yy, prof(yy) + 0.08, yy, { color: 'orange', width: 1.4 }); }
          } else {
            const lo = ylo - 0.45, hiB = mid - 0.05, loT = mid + 0.05, hiT = yhi + 0.45;
            const nw = w(e) * (1 - neck);
            const A = [[-0.62, lo], [0.62, lo], [0.62, ylo], [w(e), ylo], [nw, mid - 0.05 - 0.3 * neck], [0, mid - 0.2 - gapH], [-nw, mid - 0.05 - 0.3 * neck], [-w(e), ylo], [-0.62, ylo]];
            const Bp = [[-0.62, hiT], [0.62, hiT], [0.62, yhi], [w(e), yhi], [nw, mid + 0.05 + 0.3 * neck], [0, mid + 0.2 + gapH], [-nw, mid + 0.05 + 0.3 * neck], [-w(e), yhi], [-0.62, yhi]];
            SP.path(A, { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.3 });
            SP.path(Bp, { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.3 });
            void hiB; void loT;
          }
          SP.text(frac ? 'cup and cone' : '', 0, mid, { size: 11, color: 'red', align: 'center', weight: 650, dx: 62 });
          SP.measure(-1.0, ylo, -1.0, yhi, `L = ${(1 + (mo === 'rub' ? e : e)).toFixed(mo === 'rub' ? 2 : 3)} L₀`);
        });
        v.readout(() => {
          const st = state(), m = st.m;
          let regime;
          if (m === 'rub') regime = 'fully elastic and reversible: no yield, no permanent set.';
          else { const cv = curveOf(m); regime = st.e <= cv.ePL * 1.05 ? 'linear elastic' : st.e < cv.eOff - 1e-9 && st.s < cv.sy ? 'elastic, just leaving linearity' : st.e < cv.eu * 0.999 ? (MATS[m].eL && st.e < cv.s0 / cv.E + MATS[m].eL ? 'yielding (Lüders plateau)' : 'strain hardening') : st.e < cv.ef * 0.999 ? '**necking**: engineering stress falls while the true stress still rises' : '**fracture**'; }
          const W = m === 'rub' ? (() => { let a = 0, n = 400; for (let i = 0; i < n; i++) { const e1 = st.e * i / n, e2 = st.e * (i + 1) / n; a += 0.5 * (rubberSig(e1) + rubberSig(e2)) * (e2 - e1); } return a; })() : curveOf(m).work(st.e);
          const perm = st.up > 0 && !st.rev ? ` · unloaded: $\\varepsilon_p = \\varepsilon - \\sigma/E = ${st.e.toFixed(4)} - ${(st.s / st.E).toFixed(4)} = **${(st.e - st.s / st.E).toFixed(4)}**$` : '';
          return `$\\varepsilon = ${st.e.toFixed(4)}$, $\\sigma = ${f3(st.s)}$ MPa → ${regime} · energy absorbed so far $= \\int\\sigma\\,d\\varepsilon = ${f3(W)}\\ \\text{MJ/m}^3$${perm}${m === 'rub' ? '' : ` · $E = ${(st.E / 1000).toFixed(1)}$ GPa`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Law',
      name: 'Hooke’s law: σ = Eε',
      statement: String.raw`For small enough strains most solids respond **linearly and reversibly**: the stress in a bar under axial load is proportional to the strain,
$$\sigma = E\,\varepsilon,$$
where the constant $E$ (the **modulus of elasticity** or Young's modulus, in GPa) depends on the material and not on the size of the specimen. Equivalently the force on the bar is proportional to its stretch, $P = (EA/L)\,\delta$ — a linear spring (Hooke, 1678: *ut tensio, sic vis*). The law ends at the **proportional limit**, beyond which the stress–strain curve bends away from the straight line, and it describes the loading of an initially unstressed, isotropic material at constant temperature.`,
      idea: String.raw`Any smooth stress–strain relation can be expanded in a Taylor series about zero strain. The constant term vanishes (no strain, no stress) and for small $\varepsilon$ the linear term dominates, so $\sigma \approx E\varepsilon$ with $E$ the initial slope of the curve in 1.3. On the atomic level $E$ is the curvature of the interatomic potential at the equilibrium spacing, which is why it is so insensitive to alloying (all steels have $E \approx 210$ GPa) and why it differs between materials (about 69 GPa for aluminium, 117 GPa for copper, 33 GPa for concrete).`,
      caption: String.raw`A virtual strain-gauge test. Drag the gold handle to load the specimen; each recorded point is stress against strain, and the line is fitted through the first few low-load readings (the calibration). Its slope is **E**, compared with the handbook value. The lower panel plots the deviation from that line: where it exceeds 0.5 % the proportional limit is passed. Steel and aluminium are straight to a surprisingly high stress; copper leaves the line almost at once; rubber never follows Hooke's law much beyond its first few per cent.`,
      scope: String.raw`Small strains, isotropic material, slow loading, constant temperature; rubber-like materials are linear only below a few per cent strain.`,
      credit: 'Robert Hooke, 1678 (anagram 1676)',
      deps: ['solid-1.3', 'mech-4.1'],
      refs: ['Gere–Goodno §1.7'],
      tags: ['hooke', 'elasticity'],
      viz(v) {
        const matSel = v.select('material', [{ value: 'steel', label: 'steel S355' }, { value: 'al', label: 'Al 6061-T6' }, { value: 'cu', label: 'copper' }, { value: 'rub', label: 'rubber' }], 'steel');
        const S = v.stage({ x: [0, 0.01], y: [0, 500], axes: 'box', gutter: { l: 50 }, height: 340, weight: 1.4, xlabel: 'strain ε', ylabel: 'stress σ (MPa)', title: 'recorded readings' });
        const R = v.stage({ x: [0, 0.01], y: [-8, 8], axes: 'box', gutter: { l: 50 }, height: 340, weight: 1, xlabel: 'strain ε', ylabel: 'deviation from Hooke line (%)', title: 'departure from linearity' });
        const XMAX = { steel: 0.0032, al: 0.0075, cu: 0.0022, rub: 0.5 };
        const sigF = () => (matSel.value === 'rub' ? rubberSig : curveOf(matSel.value).sig);
        const H = S.handle(0.002, 100, { color: 'gold', r: 8, constrain: (x) => { const e = Math.max(0, Math.min(XMAX[matSel.value], x)); return [e, sigF()(e)]; } });
        let last = '';
        v.render(() => {
          const m = matSel.value, f = sigF(), xm = XMAX[m];
          if (m !== last) { last = m; H.set(xm * 0.35, f(xm * 0.35)); }
          const sy = m === 'rub' ? 0.6 : curveOf(m).su * 0.95, hand = m === 'rub' ? 3 * RUBBER.G : MATS[m].E;
          const ymax = m === 'rub' ? 0.55 : Math.min(curveOf(m).su * 1.05, f(xm) * 1.15 + 20);
          S.setView([0, xm], [0, ymax]); R.setView([0, xm], [-8, 8]);
          // calibration points
          const eCal = xm * 0.04, n = 40, pts = [...Array(n + 1)].map((_, i) => { const e = (xm * i) / n; return [e, f(e)]; });
          const cal = pts.filter(([e]) => e > 0 && e <= (m === 'rub' ? 0.02 : (curveOf(m).sy / curveOf(m).E) * 0.3));
          const fit = v.M.linreg(cal.map((p) => p[0]), cal.map((p) => p[1]));
          const Efit = fit.slope;
          S.line(0, 0, xm, Efit * xm, { color: 'muted', width: 1.4, dash: [6, 4] });
          const rec = pts.filter(([e]) => e <= H.x + 1e-12 && e > 0);
          S.dots(rec, { r: 3.2, color: 'accent' });
          S.fn(f, { domain: [0, Math.max(H.x, 1e-9)], n: 300, color: 'accent', width: 1.6, alpha: 0.5 });
          S.dot(H.x, f(H.x), { r: 5, color: 'gold' });
          // deviation
          const dev = (e) => (e > 0 ? ((f(e) - Efit * e) / (Efit * e)) * 100 : 0);
          R.hband(-0.5, 0.5, { color: 'green', alpha: 0.15 }); R.hline(0, { color: 'muted', width: 1 });
          R.fn(dev, { domain: [1e-7 + xm / 400, Math.max(xm / 200, H.x)], n: 300, color: 'red', width: 2.4 });
          R.dot(H.x, Math.max(-8, Math.min(8, dev(H.x))), { r: 5, color: 'gold' });
          if (m !== 'rub') { const cv = curveOf(m); R.vline(cv.ePL, { color: 'orange', width: 1.4, dash: [5, 3] }); R.text('proportional limit', cv.ePL, 7, { size: 10.5, color: 'orange', dx: 6, align: 'left' }); }
          R.text('±0.5 % band', xm * 0.98, 0.5, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          void eCal; void sy; void hand;
        });
        v.readout(() => {
          const m = matSel.value, f = sigF(), n = 40, xm = XMAX[m];
          const pts = [...Array(n + 1)].map((_, i) => { const e = (xm * i) / n; return [e, f(e)]; });
          const cal = pts.filter(([e]) => e > 0 && e <= (m === 'rub' ? 0.02 : (curveOf(m).sy / curveOf(m).E) * 0.3));
          const fit = v.M.linreg(cal.map((p) => p[0]), cal.map((p) => p[1])), e = H.x, s = f(e);
          const hand = m === 'rub' ? 3 * RUBBER.G : MATS[m].E, dv = e > 0 ? ((s - fit.slope * e) / (fit.slope * e)) * 100 : 0;
          const lim = m === 'rub' ? null : curveOf(m);
          return `Fitted slope **$E = ${m === 'rub' ? f3(fit.slope) + '$ MPa' : f3(fit.slope / 1000) + '$ GPa'}** (handbook ${m === 'rub' ? '$3G \\approx ' + f3(hand) + '$ MPa' : f3(hand / 1000) + ' GPa'}) · at $\\varepsilon = ${e.toFixed(5)}$: $\\sigma = ${f3(s)}$ MPa, $E\\varepsilon = ${f3(fit.slope * e)}$ MPa, deviation ${dv.toFixed(2)} % ${Math.abs(dv) <= 0.5 ? '(Hooke holds)' : '(**beyond the proportional limit**)'}${lim ? ` · proportional limit ≈ ${f3(lim.sPL)} MPa at $\\varepsilon = ${lim.ePL.toFixed(5)}$` : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Poisson’s ratio',
      statement: String.raw`When a bar is stretched axially it contracts sideways (and widens when compressed). For an isotropic material in uniaxial stress the lateral strain is a constant fraction of the axial strain,
$$\nu = -\frac{\varepsilon_{\text{lateral}}}{\varepsilon_{\text{axial}}}, \qquad \varepsilon_{\text{lateral}} = -\nu\varepsilon_{\text{axial}}.$$
Poisson's ratio is dimensionless and lies between $-1$ and $\tfrac12$ for a stable isotropic solid; typical values are 0.30 for structural steel, 0.33 for aluminium, 0.34 for copper, 0.2 for concrete, near 0 for cork and close to 0.5 for rubber. The relative change of volume of a small-strain bar is $\Delta V/V = (1 - 2\nu)\,\varepsilon_{\text{axial}}$, so $\nu = \tfrac12$ means no volume change.`,
      idea: String.raw`If material only stretched in the load direction without narrowing, a stretched bar would gain volume. In a solid, bonds resist both stretching and a change of volume; metals give up a bit of volume (stretch exceeds contraction), and rubber, whose network of long molecules is nearly incompressible compared with how easily it changes shape, narrows just enough to keep its volume constant, $\nu \to \tfrac12$. Cork's cellular walls buckle into the air-filled cells instead of squeezing out sideways, so $\nu \approx 0$ and a stopper can be pushed into a bottle neck without bulging.`,
      caption: String.raw`Stretch the block with the handle (far beyond what steel could take, to make the narrowing visible) and choose the material. The solid outline is the small-strain rule $1 - \nu\varepsilon$; for rubber the dashed outline is the exact volume-conserving shape $(1+\varepsilon)^{-1/2}$. Right: lateral strain against axial strain is a straight line of slope $-\nu$ for each material; the readout measures $\nu$ back from the drawn block and gives the volume change.`,
      deps: ['solid-1.4'],
      refs: ['Gere–Goodno §1.7'],
      credit: 'Siméon Denis Poisson, 1827',
      tags: ['poisson', 'strain'],
      viz(v) {
        const NU = { cork: 0.0, conc: 0.2, steel: 0.3, cu: 0.34, rub: 0.5 };
        const sel = v.select('material', [{ value: 'cork', label: 'cork' }, { value: 'conc', label: 'concrete' }, { value: 'steel', label: 'steel' }, { value: 'cu', label: 'copper' }, { value: 'rub', label: 'rubber' }], 'steel');
        const S = v.stage({ x: [-2.6, 2.6], y: [-0.3, 7.2], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'block before (grey) and after stretching' });
        const P = v.stage({ x: [0, 0.4], y: [-0.22, 0.02], axes: 'box', gutter: { l: 50 }, height: 380, weight: 1.15, xlabel: 'axial strain ε', ylabel: 'lateral strain', title: 'lateral strain = −ν × axial strain' });
        const H = S.handle(0, 6.2, { color: 'orange', r: 8, constrain: (x, y) => [0, Math.max(4.01, Math.min(7.0, y))] });
        H.set(0, 5.4);
        v.render(() => {
          const nu = NU[sel.value], e = (H.x * 0 + H.y - 4) / 4; // block height 4 → 4(1+e)
          const wd = (ee) => 1 - nu * ee;
          const W0 = 1.3, Hh = 4 * (1 + e), wL = W0 * wd(e);
          S.rect(-W0, 0, W0, 4, { fill: 'gray', fillAlpha: 0.12, color: 'muted', width: 1.2, dash: [4, 3] });
          // grid on the deformed block (homogeneous deformation)
          S.rect(-wL, 0, wL, Hh, { fill: 'accent', fillAlpha: 0.22, color: 'ink', width: 2 });
          for (let i = 1; i < 4; i++) { S.line(-wL, (Hh * i) / 4, wL, (Hh * i) / 4, { color: 'ink', width: 1, alpha: 0.5 }); S.line((-wL * (4 - 2 * i)) / 4 * 1, 0, (-wL * (4 - 2 * i)) / 4, Hh, { color: 'ink', width: 1, alpha: 0.5 }); }
          if (sel.value === 'rub') { const we = W0 * (1 + e) ** -0.5; S.rect(-we, 0, we, Hh, { color: 'orange', width: 1.5, dash: [5, 3], fill: false }); }
          S.measure(-W0 - 0.7, 0, -W0 - 0.7, 4, 'H');
          S.arrow(0, Hh, 0, Hh + 0.9, { color: 'orange', width: 3, head: 10 });
          S.arrow(0, 0, 0, -0.01, { color: 'muted', width: 1 });
          S.line(-W0, -0.18, W0, -0.18, { color: 'muted', width: 1 });
          S.text('fixed', 0, -0.25, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
          S.line(-wL, Hh + 0.13, wL, Hh + 0.13, { color: 'muted', width: 0 });
          P.setView([0, 0.4], [-0.22, 0.02]);
          const names = { cork: 'cork', conc: 'concrete', steel: 'steel', cu: 'copper', rub: 'rubber' };
          Object.entries(NU).forEach(([k, n]) => { const act = k === sel.value; P.line(0, 0, 0.4, -n * 0.4, { color: act ? 'accent' : 'muted', width: act ? 2.8 : 1.2, alpha: act ? 1 : 0.6 }); });
          const items = Object.entries(NU).filter(([, n]) => n > 0).map(([k, n]) => ({ x: 0.4, y: -n * 0.4, text: `${names[k]} ${n}`, color: k === sel.value ? 'accent' : 'muted', r: 2, prefer: [-1, 0], weight: k === sel.value ? 700 : 500 }));
          placeLabels(v, P, items);
          P.text('cork ν ≈ 0', 0.2, 0.0, { size: 11, color: sel.value === 'cork' ? 'accent' : 'muted', align: 'center', baseline: 'bottom', dy: -3 });
          P.dot(Math.max(0, e), -nu * Math.max(0, e), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const nu = NU[sel.value], e = (H.y - 4) / 4, el = -(1 - nu * e - 1);
          const wm = 1 - nu * e, nuMeas = e > 1e-9 ? (1 - wm) / e : nu;
          const dV = (1 + e) * wm * wm - 1, dVsmall = (1 - 2 * nu) * e;
          return `$\\varepsilon_{\\text{axial}} = ${e.toFixed(3)}$, $\\varepsilon_{\\text{lateral}} = ${(-nu * e).toFixed(3)}$ → measured $\\nu = ${nuMeas.toFixed(2)}$ · volume change $\\Delta V/V = (1+\\varepsilon)(1-\\nu\\varepsilon)^2 - 1 =$ **${(dV * 100).toFixed(1)} %** (small-strain $(1-2\\nu)\\varepsilon = ${(dVsmall * 100).toFixed(1)}$ %) ${sel.value === 'rub' ? '· rubber: no volume change' : sel.value === 'cork' ? '· cork: the width does not change at all' : ''}`;
          void el;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Shear stress, shear strain and the shear modulus',
      statement: String.raw`A force $V$ acting **parallel** to a cut of area $A$ produces **shear stress** $\tau = V/A$ (average, unit Pa). Matching it, equilibrium of a small element requires equal shear stresses on its perpendicular faces ($\tau_{xy} = \tau_{yx}$). Under shear a small rectangle deforms into a parallelogram; the **shear strain** $\gamma$ is the decrease of the right angle between two originally perpendicular edges, $\gamma = \tan^{-1}(\delta/h) \approx \delta/h$ for a layer of thickness $h$ displaced by $\delta$. In the linear elastic range
$$\tau = G\gamma,\qquad G = \frac{E}{2(1+\nu)},$$
with $G$ the **shear modulus**. The shear modulus is not independent: for steel $G \approx 81$ GPa, for aluminium 26 GPa, for copper 44 GPa.`,
      idea: String.raw`Normal stress changes lengths; shear stress changes angles, so a separate constant is needed, but only one: an isotropic material has just two independent elastic constants. Looking at a square sheared by $\tau$ along its diagonal (Mohr's circle, 3.3) shows that this loading is the same as tension in one diagonal direction and compression in the other, each of size $\tau$; the diagonal stretches by $(1+\nu)\tau/E$, and comparing this with the geometric stretch $\gamma/2$ of the diagonal gives $\gamma = 2(1+\nu)\tau/E$, i.e. the formula for $G$.`,
      caption: String.raw`Drag the top face of the block sideways to shear it. The four arrows are the shear stresses: equal pairs on perpendicular faces (the complementary shears needed for moment equilibrium). The angle at the corner is $\gamma$; the lower panel plots $\tau$ against $\gamma$ for all materials, a line of slope $G = E/2(1+\nu)$ (computed from the table values of $E$ and $\nu$). The angle is drawn magnified so that steel's tiny shear strain is visible: the magnification is printed on the picture.`,
      deps: ['solid-1.1'],
      refs: ['Gere–Goodno §1.8'],
      tags: ['shear', 'modulus'],
      viz(v) {
        const MK = ['steel', 'al', 'cu', 'conc', 'rub'];
        const NM = { steel: 'steel', al: 'aluminium', cu: 'copper', conc: 'concrete', rub: 'rubber' };
        const sel = v.select('material', MK.map((k) => ({ value: k, label: NM[k] })), 'steel');
        const S = v.stage({ x: [-3.2, 3.2], y: [-1.3, 4.8], equal: true, axes: false, height: 360, weight: 1, minWidth: 280, title: 'a block sheared by τ' });
        const P = v.stage({ x: [1e-5, 1], y: [1e-2, 1e3], xlog: true, ylog: true, axes: 'box', gutter: { l: 52 }, height: 360, weight: 1.1, xlabel: 'shear strain γ', ylabel: 'shear stress τ (MPa)', title: 'τ = Gγ on log axes: slope 1, height ∝ G' });
        const G = (k) => (k === 'rub' ? RUBBER.G : G_of(MATS[k]));
        // end of the plotted range: half the yield stress for metals (Tresca), the tensile strength for concrete, γ = 0.5 for rubber
        const tauRef = (k) => (k === 'rub' ? RUBBER.G * 0.5 : k === 'conc' ? 2.9 : 0.5 * MATS[k].sy);
        const H = S.handle(1.2, 2.0, { color: 'orange', r: 8, constrain: (x) => [Math.max(0.03, Math.min(2.4, x)), 2.0] });
        let last = '';
        v.render(() => {
          const k = sel.value; if (k !== last) { last = k; H.set(1.2, 2.0); }
          const frac = Math.min(1, H.x / 2.4), tau = frac * tauRef(k), gam = tau / G(k), mag = 0.4 / (tauRef(k) / G(k)), th = Math.atan(gam * mag), dd = 2 * Math.tan(th);
          S.rect(-2.3, -0.3, 2.3, 0, { fill: 'gray', fillAlpha: 0.5, color: 'ink', width: 1.5 });
          for (let x = -2.3; x < 2.3; x += 0.3) S.line(x, -0.3, x - 0.3, -0.6, { color: 'muted', width: 1 });
          S.rect(-1.2, 0, 1.2, 2, { fill: 'gray', fillAlpha: 0.1, color: 'muted', width: 1.2, dash: [4, 3] });
          S.poly([[-1.2, 0], [1.2, 0], [1.2 + dd, 2], [-1.2 + dd, 2]], { fill: 'accent', fillAlpha: 0.28, color: 'ink', width: 2 });
          S.rect(-1.5 + dd, 2, 1.5 + dd, 2.3, { fill: 'gray', fillAlpha: 0.5, color: 'ink', width: 1.5 });
          if (frac > 0.02) {
            const L = 0.5 + 0.7 * frac;
            S.arrow(1.5 + dd - L, 2.65, 1.5 + dd, 2.65, { color: 'orange', width: 3, head: 10 });
            S.text('V', 1.5 + dd - L / 2, 2.65, { size: 13, color: 'orange', weight: 700, dy: -12, align: 'center' });
            const xr = 1.2 + dd * 0.5 + 0.13, xl = -1.2 + dd * 0.5 - 0.13;
            S.arrow(xr, 0.3, xr, 1.7, { color: 'red', width: 2.6, head: 9 });
            S.arrow(xl, 1.7, xl, 0.3, { color: 'red', width: 2.6, head: 9 });
            S.arrow(0.4 + dd * 1.0, 2.0 + 0.0, 0.4 + dd * 1.0 + 0.001, 2.0, { color: 'red', width: 0 });
            S.text('τ', xr + 0.14, 1.0, { size: 13, color: 'red', weight: 700 });
            S.text('τ', xl - 0.14, 1.3, { size: 13, color: 'red', weight: 700, align: 'right' });
            S.arrow(-0.2 + dd * 0.0 - 0.0, 2.0, -0.2, 2.0, { color: 'red', width: 0 });
          }
          const arc = []; for (let i = 0; i <= 16; i++) { const t = Math.PI / 2 - th + (th * i) / 16; arc.push([-1.2 + 0.75 * Math.cos(t), 0.75 * Math.sin(t)]); }
          S.path(arc, { color: 'green', width: 2.4 });
          S.text(`γ = ${gam < 0.01 ? gam.toExponential(1).replace('e-', '·10⁻') : gam.toFixed(3)}`, -1.45, 0.3, { size: 12.5, weight: 700, color: 'green', align: 'right' });
          S.text(`angle drawn ×${mag.toFixed(mag < 10 ? 1 : 0)} larger than true`, 0, -0.95, { size: 10.5, color: 'muted', align: 'center' });
          // τ–γ chart
          P.setView([1e-5, 1], [1e-2, 1e3]);
          const COL = { steel: 'accent', al: 'orange', cu: 'teal', conc: 'purple', rub: 'pink' };
          for (const q of MK) {
            const act = q === k, g1 = tauRef(q) / G(q);
            P.fn((g) => G(q) * g, { domain: [1e-5, g1], color: COL[q], width: act ? 3.2 : 1.6, alpha: act ? 1 : 0.7 });
          }
          v.legend(MK.map((q) => [COL[q], `${NM[q]} G = ${G(q) >= 1000 ? (G(q) / 1000).toFixed(1) + ' GPa' : G(q).toFixed(2) + ' MPa'}`]));
          P.dot(gam, tau, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const k = sel.value, frac = Math.min(1, H.x / 2.4), tau = frac * tauRef(k), gam = tau / G(k);
          const nu = k === 'rub' ? 0.5 : MATS[k].nu, Ee = k === 'rub' ? 3 * RUBBER.G : MATS[k].E;
          return `$\\tau = ${f3(tau)}$ MPa, $\\gamma = \\tau/G = ${gam.toExponential(2).replace('e-', '\\times10^{-').replace('e+', '\\times10^{')}}$ rad · $G = E/2(1+\\nu) = ${f3(Ee)}/(2\\cdot ${(1 + nu).toFixed(2)}) =$ **${f3(G(k) / (k === 'rub' ? 1 : 1000))} ${k === 'rub' ? 'MPa' : 'GPa'}** · the complementary shear on the side faces is also ${f3(tau)} MPa.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Ductile versus brittle behaviour',
      statement: String.raw`A **ductile** material (structural steel, aluminium, copper) can stretch a long way beyond yield before it breaks: its elongation at fracture is of order 10–50 %, it necks, and a tensile specimen fails on a **cup-and-cone** surface. A **brittle** material (cast iron, glass, concrete in tension, ceramics) fractures at small strain, typically below about 5 %, with little or no yielding and a flat surface perpendicular to the load. Ductility is measured by the percentage elongation at fracture and the percentage reduction of area. What distinguishes the two is not the strength but the **area under the curve**: a ductile metal absorbs one to three orders of magnitude more energy per unit volume before breaking, and warns before it fails by deforming visibly.`,
      idea: String.raw`In a ductile metal planes of atoms can slip, so peak stresses at flaws are relieved by local yielding and the material redistributes load; this shows as a long plastic plateau and hardening in the curve (1.3). In a brittle material slip is blocked, so a flaw cannot yield: the stress at its tip keeps rising until bonds break and the crack runs through the cross-section (the energy balance for that is Griffith's, 11.4). The tensile curve of a brittle solid is therefore an almost straight line cut short at a strength that depends on the largest flaw, and the material gives no early warning.`,
      caption: String.raw`Two specimens are pulled together at the same speed: ductile steel S355 on the left, grey cast iron on the right. Watch which breaks first and how: the cast iron snaps flat after a stretch you cannot see; steel yields, stretches, necks and tears on a cup and cone. The right-hand plot draws both curves with the energy absorbed so far shaded. Switch to the **first 0.5 %** window: steel is still going when the iron has broken (strains are magnified ×40 in this window so that you can see them).`,
      deps: ['solid-1.3'],
      refs: ['Gere–Goodno §1.5'],
      tags: ['ductility', 'fracture'],
      viz(v) {
        const win = v.select('strain window', [{ value: 'full', label: '0 – 30 %' }, { value: 'zoom', label: 'first 0.5 %' }], 'full');
        const SP = v.stage({ x: [-3.6, 3.6], y: [-0.2, 9.2], equal: true, axes: false, height: 400, weight: 1.0, minWidth: 270, title: 'steel S355 (left) · grey cast iron (right)' });
        const C = v.stage({ x: [0, 0.3], y: [0, 560], axes: 'box', gutter: { l: 52 }, height: 400, weight: 1.15, xlabel: 'engineering strain ε', ylabel: 'stress σ (MPa)', title: 'the two stress–strain curves' });
        const cd = curveOf('steel'), M = MATS.cast, efb = (2 * M.su) / M.E; // brittle: σ = su (1 − (1 − ε/εf)²), initial slope E
        const sigB = (e) => (e >= efb ? M.su : M.su * (1 - (1 - e / efb) ** 2));
        const workB = (e) => { const x = Math.min(e, efb); return M.su * (x - x * x / efb + x ** 3 / (3 * efb * efb)); };
        const T = 8;
        const cup = (S, cx, ylo, yhi, w, gap) => {
          const nw = w * 0.45, lo = ylo, hi = yhi;
          S.path([[cx - w, lo], [cx + w, lo], [cx + w, lo + 0.9], [cx + nw, lo + 0.9 + 0.3 * 0], [cx + nw, hi - 0.0], [cx, hi + 0.3], [cx - nw, hi - 0.0], [cx - nw, lo + 0.9], [cx - w, lo + 0.9]], { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.3 });
          void gap;
        };
        v.animate((t) => {
          const zoom = win.value === 'zoom', emax = zoom ? 0.005 : 0.30, ec = emax * Math.min(1, t / T), mag = zoom ? 40 : 1;
          const fD = ec >= cd.ef, fB = ec >= efb;
          // curves
          C.setView([0, emax], [0, 560]);
          C.fn(cd.sig, { domain: [0, Math.min(emax, cd.ef)], n: 500, color: 'accent', width: 2.4, alpha: 0.9 });
          C.fn(sigB, { domain: [0, Math.min(emax, efb)], n: 200, color: 'purple', width: 2.4 });
          const eD = Math.min(ec, cd.ef), eB = Math.min(ec, efb);
          C.fn(cd.sig, { domain: [0, eD], n: 400, fill: true, fillAlpha: 0.22, color: 'accent', width: 0 });
          C.fn(sigB, { domain: [0, eB], n: 100, fill: true, fillAlpha: 0.4, color: 'purple', width: 0 });
          if (!fD) C.dot(eD, cd.sig(eD), { r: 6, color: 'gold' }); else C.dot(cd.ef, cd.sig(cd.ef), { r: 6, color: 'red', hollow: true });
          if (!fB) C.dot(eB, sigB(eB), { r: 6, color: 'gold' }); else C.dot(efb, M.su, { r: 6, color: 'red', hollow: true });
          const labs = [{ x: Math.min(emax, efb), y: M.su, text: fB ? 'cast iron: broke at ε = 0.4 %' : 'cast iron', color: 'purple', r: 5 }, { x: Math.min(emax * 0.55, cd.eu * 0.9), y: cd.sig(Math.min(emax * 0.55, cd.eu * 0.9)), text: 'steel S355', color: 'accent', r: 3, prefer: [0, -1] }];
          placeLabels(v, C, labs.slice(1));
          C.text(fB ? 'cast iron: broke at ε = 0.4 %' : 'cast iron', Math.min(emax, efb) + emax * 0.03, M.su, { size: 11, color: 'purple', weight: 650, align: 'left', plate: true });
          // specimens
          const y0 = 2.0, L0 = 3.4, grip = (S, cx, y, top) => { S.rect(cx - 0.9, top ? y : y - 1.2, cx + 0.9, top ? y + 1.2 : y, { fill: 'gray', fillAlpha: 0.45, color: 'ink', width: 1.4 }); };
          const draw = (cx, e, fr, brittle) => {
            const wEl = 0.36, w = (ee) => wEl * (1 - 0.3 * ee), ext = (brittle ? e : e) * mag, yt = y0 + L0 * (1 + ext);
            const neck = brittle ? 0 : cd.neck(e), mid = y0 + (yt - y0) / 2;
            if (!fr) {
              const body = []; const prof = (y) => { const tt = (y - y0) / (yt - y0); return w(e) * (1 - neck * Math.exp(-(((tt - 0.5) / 0.13) ** 2))); };
              for (let k = 0; k <= 70; k++) { const y = y0 + ((yt - y0) * k) / 70; body.push([cx - prof(y), y]); } for (let k = 70; k >= 0; k--) { const y = y0 + ((yt - y0) * k) / 70; body.push([cx + prof(y), y]); }
              SP.rect(cx - 0.62, y0 - 0.5, cx + 0.62, y0, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 }); SP.rect(cx - 0.62, yt, cx + 0.62, yt + 0.5, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 });
              SP.path(body, { close: true, color: 'ink', width: 1.6, fill: brittle ? 'purple' : 'accent', fillAlpha: 0.3 });
              for (let i = 0; i <= 6; i++) { const y = y0 + ((yt - y0) * i) / 6; SP.line(cx - w(e) - 0.08, y, cx + w(e) + 0.08, y, { color: 'orange', width: 1.4 }); }
              grip(SP, cx, y0 - 0.5, false); grip(SP, cx, yt + 0.5, true);
              SP.arrow(cx, yt + 1.75, cx, yt + 2.4, { color: 'orange', width: 3, head: 10 });
              return;
            }
            // fractured: pieces recoil/separate
            const gp = brittle ? 0.18 + 0.3 * Math.min(1, (ec - efb) / 0.01) : 0.4 + 2.0 * Math.min(0.3, ec - cd.ef), lowTop = y0 + L0 * (1 + (brittle ? 0.0 : cd.ef * mag) * 0.55);
            const nw = brittle ? w(0) : w(cd.ef) * (1 - cd.neck(cd.ef)), wB = brittle ? w(0) : w(cd.ef);
            if (brittle) {
              const mid2 = y0 + L0 * 0.55;
              SP.rect(cx - 0.62, y0 - 0.5, cx + 0.62, y0, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 }); grip(SP, cx, y0 - 0.5, false);
              SP.poly([[cx - wB, y0], [cx + wB, y0], [cx + wB, mid2], [cx - wB, mid2]], { color: 'ink', width: 1.6, fill: 'purple', fillAlpha: 0.3 });
              const top0 = mid2 + gp, yt2 = y0 + L0 + gp + 0.4 + 0.0;
              SP.poly([[cx - wB, top0], [cx + wB, top0], [cx + wB, yt2], [cx - wB, yt2]], { color: 'ink', width: 1.6, fill: 'purple', fillAlpha: 0.3 });
              SP.rect(cx - 0.62, yt2, cx + 0.62, yt2 + 0.5, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 }); grip(SP, cx, yt2 + 0.5, true);
              SP.text('flat fracture', cx + wB + 0.2, mid2 + gp / 2, { size: 11, color: 'red', weight: 650, align: 'left' });
              return;
            }
            const half = (y0 + L0 * (1 + cd.ef)) / 2 + 0.6 * 0, yb = y0 + L0 * 0.55 + 0.45;
            const lowTop2 = yb, upBot = yb + gp;
            SP.rect(cx - 0.62, y0 - 0.5, cx + 0.62, y0, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 }); grip(SP, cx, y0 - 0.5, false);
            SP.path([[cx - wB, y0], [cx + wB, y0], [cx + wB * 0.95, yb - 0.9], [cx + nw, yb - 0.35], [cx + nw, yb], [cx, yb + 0.28], [cx - nw, yb], [cx - nw, yb - 0.35], [cx - wB * 0.95, yb - 0.9]], { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.3 });
            const ytop = y0 + L0 * (1 + 0.3) + gp + 0.2, ub = upBot;
            SP.path([[cx - wB, ytop], [cx + wB, ytop], [cx + wB * 0.95, ub + 0.9], [cx + nw, ub + 0.35], [cx + nw, ub], [cx, ub + 0.28], [cx - nw, ub], [cx - nw, ub + 0.35], [cx - wB * 0.95, ub + 0.9]], { close: true, color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.3 });
            SP.rect(cx - 0.62, ytop, cx + 0.62, ytop + 0.5, { fill: 'accent', fillAlpha: 0.2, color: 'ink', width: 1.4 }); grip(SP, cx, ytop + 0.5, true);
            SP.text('cup and cone', cx + wB + 0.2, (yb + ub) / 2, { size: 11, color: 'red', weight: 650, align: 'left' });
            void half; void lowTop; void lowTop2; void cup;
          };
          draw(-1.9, Math.min(ec, cd.ef), fD, false);
          draw(1.9, Math.min(ec, efb), fB, true);
          SP.text(zoom ? 'stretch magnified ×40' : 'true proportions', 0, 0.05, { size: 10.5, color: 'muted', align: 'center', baseline: 'bottom' });
          v.legend([['accent', 'steel', { area: true }], ['purple', 'cast iron', { area: true }], ['orange', 'gauge marks']]);
        }, { period: T + 1.5, still: 7.4 });
        v.readout(() => {
          const zoom = win.value === 'zoom', ec = (zoom ? 0.005 : 0.30) * Math.min(1, v.t % (T + 1.5) / T);
          const wD = cd.work(Math.min(ec, cd.ef)), wB = workB(ec), fB = ec >= efb, fD = ec >= cd.ef;
          return `$\\varepsilon = ${ec.toFixed(4)}$ · steel: ${fD ? '**fractured**' : `σ = ${f3(cd.sig(ec))} MPa`}, absorbed ${f3(wD)} MJ/m³ · cast iron: ${fB ? '**fractured at ε = ' + efb.toFixed(4) + '**' : `σ = ${f3(sigB(ec))} MPa`}, absorbed ${f3(wB)} MJ/m³ · to fracture, steel absorbs ${f3(cd.work(cd.ef) / workB(efb))}× more energy per unit volume.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Allowable stress and the factor of safety',
      statement: String.raw`Uncertainty in loads, in material strength and in the analysis itself is covered by a **factor of safety** $n > 1$: the ratio of the stress that would cause failure to the stress expected in service,
$$n = \frac{\sigma_{\text{fail}}}{\sigma_{\text{actual}}}, \qquad \sigma_{\text{allow}} = \frac{\sigma_{\text{fail}}}{n}.$$
For ductile metals the failure stress is usually the yield strength $\sigma_y$ (permanent deformation), for brittle materials the ultimate strength $\sigma_u$. A member in axial tension $P$ must satisfy $P/A \le \sigma_{\text{allow}}$, so the **required area** is $A_{\text{req}} = P/\sigma_{\text{allow}}$ and, for a round rod, $d_{\text{req}} = \sqrt{4P/(\pi\sigma_{\text{allow}})}$ — larger with $\sqrt n$. Modern codes split $n$ into separate load and resistance factors (limit-state design), but the principle is the same.`,
      idea: String.raw`The stress that a bar actually reaches is $P/A$ (1.1) and the stress that damages it is read from the stress–strain curve (1.3): yield for a ductile metal, fracture for a brittle one. Their ratio is the margin. A factor of one means the part is exactly at the edge, in practice no margin at all; because the diameter scales as $\sqrt{n}$ the cost of extra safety rises only slowly, and a design with $n < 1$ is stressed past yield from the very first load.`,
      caption: String.raw`Size a hanger rod for a design load. Choose the material, the load and the factor of safety; the rod diameter is computed from $d = \sqrt{4P/\pi\sigma_{\text{allow}}}$. The ladder shows the actual stress against $\sigma_{\text{allow}}$, yield and ultimate, and the rod is drawn with its real strain. Drag the **safety factor** below 1, or raise the overload slider (the load that actually arrives, as a multiple of the design load), and watch the rod yield and finally break. Timber uses the characteristic tensile strength of C24 and a plain factor, not the full Eurocode modification factors.`,
      scope: String.raw`Static axial tension; a single global factor on the strength-basis stress (yield for the metals, ultimate or characteristic strength for the brittle materials).`,
      deps: ['solid-1.3'],
      refs: ['Gere–Goodno §1.9'],
      tags: ['design', 'safety'],
      viz(v) {
        const sel = v.select('rod', [{ value: 'steel', label: 'steel S355' }, { value: 'al', label: 'Al 6061-T6' }, { value: 'timber', label: 'timber C24' }, { value: 'cast', label: 'cast iron' }], 'steel');
        const Pd = v.slider('design load P (kN)', 5, 500, 100, { log: true, sig: 2 });
        const FS = v.slider('factor of safety n', 0.5, 5, 2, { log: true, sig: 2 });
        const OV = v.slider('actual load ÷ design load', 1, 3, 1, { step: 0.05 });
        const S = v.stage({ x: [-3.2, 6.6], y: [-0.3, 7.0], equal: true, axes: false, height: 400, weight: 1.2, minWidth: 290, title: 'the hanger rod and its stress ladder' });
        const C = v.stage({ x: [0.5, 5], y: [0, 100], axes: 'box', gutter: { l: 52 }, height: 400, weight: 1, minWidth: 260, xlabel: 'factor of safety n used in the design', ylabel: 'required rod diameter (mm)', title: 'what the factor of safety costs' });
        const basis = (m) => (m.id === 'steel' || m.id === 'al' ? m.sy : m.su);
        const strainAt = (m, s) => { if (!m.ductile) return s / m.E; if (m.id === 'cast') return s / m.E; const cv = curveOf(m.id); let lo = 0, hi = cv.eu; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (cv.sig(mid) < s) lo = mid; else hi = mid; } return Math.min(s > cv.su ? cv.eu : lo, cv.eu); };
        const ST = () => {
          const m = MATS[sel.value], b = basis(m), sa = b / FS.value, dReq = Math.sqrt((4 * Pd.value * 1000) / (Math.PI * sa));
          const A = (Math.PI * dReq * dReq) / 4, s = (OV.value * Pd.value * 1000) / A, nAct = b / s;
          const broke = s >= m.su - 1e-9 && s > sa + 1e-9, yielded = m.ductile && s > m.sy + 1e-9;
          return { m, b, sa, dReq, A, s, nAct, broke: s > m.su + 1e-9, yielded: m.ductile && s > m.sy + 1e-9, eps: strainAt(m, Math.min(s, m.su)), void: broke };
        };
        v.render(() => {
          const st = ST(), m = st.m;
          ceilingH(v, S, 6.4, -1.6, 1.6, 10);
          const wr = Math.max(0.05, Math.min(0.9, 0.05 + 0.85 * Math.sqrt(st.dReq / 300))), rodTop = 6.4, len0 = 3.6, len = len0 * (1 + st.eps * (st.eps > 0.01 ? 1 : 1));
          const bot = rodTop - len, blkH = 0.9, blkW = 1.1 + 0.4 * Math.min(1, OV.value * Pd.value / 500);
          S.rect(-wr, rodTop - len0, wr, rodTop, { color: 'muted', width: 1.2, dash: [4, 3], fill: false });
          const tcol = st.broke ? 'red' : st.yielded ? 'orange' : 'accent';
          if (!st.broke) {
            S.rect(-wr, bot, wr, rodTop, { fill: tcol, fillAlpha: 0.35, color: 'ink', width: 1.6 });
            S.rect(-blkW, bot - blkH, blkW, bot, { fill: 'gray', fillAlpha: 0.5, color: 'ink', width: 1.6 });
            S.text(`${f3(OV.value * Pd.value)} kN`, 0, bot - blkH / 2, { size: 12, weight: 700, align: 'center', color: 'ink' });
          } else {
            S.rect(-wr, rodTop - 1.3, wr, rodTop, { fill: 'red', fillAlpha: 0.35, color: 'ink', width: 1.6 });
            S.rect(-blkW, 0.1, blkW, 0.1 + blkH, { fill: 'gray', fillAlpha: 0.5, color: 'ink', width: 1.6, dash: [4, 3] });
            S.text('ROD FRACTURED', 0, 3.6, { size: 13, weight: 700, color: 'red', align: 'center' });
          }
          S.text(`ø ${f3(st.dReq)} mm`, -wr - 0.15, rodTop - 0.65, { size: 11.5, weight: 650, color: 'ink', align: 'right' });
          // ladder
          const lx = 3.2, ymax = 1.22 * Math.max(m.su, st.s), Y = (s) => 0.4 + (5.9 * s) / ymax;
          S.line(lx, Y(0), lx, Y(ymax), { color: 'muted', width: 1.4 });
          const mk = (s, text, color, dy = 0) => { S.line(lx - 0.25, Y(s), lx + 0.25, Y(s), { color, width: 2.2 }); S.text(text, lx + 0.4, Y(s) + dy, { size: 11, color, align: 'left', weight: 600 }); };
          mk(st.sa, `σ_allow ${f3(st.sa)}`, 'green', -0.12);
          if (m.ductile && m.sy < m.su) { mk(m.sy, `yield ${m.sy}`, 'orange', 0.12); mk(m.su, `ultimate ${m.su}`, 'red', 0.18); } else mk(m.su, `strength ${m.su}`, 'red', 0.12);
          S.rect(lx - 0.18, Y(0), lx + 0.18, Y(Math.min(st.s, ymax)), { fill: tcol, fillAlpha: 0.5, color: tcol, width: 1.2 });
          S.dot(lx, Y(Math.min(st.s, ymax)), { r: 5, color: 'gold' });
          S.text(`σ = ${f3(st.s)} MPa`, lx - 0.3, Y(Math.min(st.s, ymax)), { size: 11.5, weight: 700, color: 'ink', align: 'right' });
          // d vs n
          const d1 = Math.sqrt((4 * Pd.value * 1000) / (Math.PI * st.b));
          C.setView([0.5, 5], [0, d1 * Math.sqrt(5) * 1.08]);
          const nBrk = (OV.value * st.b) / m.su, nYld = m.ductile ? OV.value : 0;
          C.vband(0.5, nBrk, { color: 'red', alpha: 0.13 });
          if (nYld > nBrk) C.vband(nBrk, nYld, { color: 'orange', alpha: 0.14 });
          C.vband(Math.max(nYld, nBrk), 5, { color: 'green', alpha: 0.09 });
          C.fn((n) => d1 * Math.sqrt(n), { domain: [0.5, 5], color: 'accent', width: 2.4 });
          C.vline(FS.value, { color: 'gold', width: 1.4, dash: [4, 3] });
          C.dot(FS.value, st.dReq, { r: 6, color: 'gold' });
          v.legend([['red', 'rod breaks', { area: true }], ['orange', 'rod yields', { area: true }], ['green', 'stays elastic', { area: true }], ['gold', 'this design', { dot: true }]]);
          C.text('d ∝ √n', 3.4, d1 * Math.sqrt(3.4) * 0.84, { size: 11, color: 'accent', align: 'center' });
        });
        v.readout(() => {
          const st = ST(), m = st.m;
          const verdict = st.broke ? '**the rod fractures**' : st.yielded ? '**the rod has yielded** (permanent stretch ' + (st.eps * 100).toFixed(1) + ' %)' : st.s > st.sa * 1.0001 ? 'above the allowable stress but still elastic' : 'within the allowable stress';
          return `Basis ${m.ductile && m.id !== 'cast' ? '$\\sigma_y$' : '$\\sigma_u$'} = ${m.id === 'timber' ? '14.5 (characteristic)' : f3(st.b)} MPa → $\\sigma_{\\text{allow}} = ${f3(st.b)}/${st.m ? FS.value.toFixed(2) : ''} = ${f3(st.sa)}$ MPa → $d = \\sqrt{4P/\\pi\\sigma_{\\text{allow}}} =$ **${f3(st.dReq)} mm** ($A = ${f3(st.A)}\\ \\text{mm}^2$) · actual $\\sigma = ${f3(st.s)}$ MPa, actual factor of safety $n = ${st.nAct.toFixed(2)}$ · ${verdict}.`;
        });
      },
    },
  ],
};
