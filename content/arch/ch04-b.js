import florenceItem from './source-audit-florence-item.js';
import pantheonItem from './source-audit-pantheon-item.js';
import poleniEvent from './source-audit-poleni-item.js';
// Architecture & Structural Form — Chapter 4: Vaults and domes (items 4.6–4.11; 4.1–4.5 are in ch04.js)
//
// Sources checked (Oct 2026):
//   Audited Poleni4.6: actual1748BookI §§76–89,TableAA,plateE; source facts distinguished from authored fixed-station illustration.
//   Audited Pantheon4.7: official owner and actualMark/Hutchinson1986pp24–34; authored spherical weight reduction, no real-building certificate.
//   Audited Florence4.8: official owner construction description; authored complete circular-shell equilibrium and isolated-block friction, no building certificate.
//   Pendentives: geometry computed here; Hagia Sophia's dome on pendentives, built 532–537 under Justinian by Anthemius of Tralles and Isidore of
//     Miletus (rebuilt after a collapse in 558), main dome about 31 m across (flagged verify).
//   Thrust network analysis: P. Block and J. Ochsendorf, "Thrust network analysis: A new methodology for three-dimensional equilibrium",
//     J. Int. Assoc. Shell and Spatial Structures 48 (3): 167–173 (2007), as cited in the SIGGRAPH history database; and P. Block, Thrust Network
//     Analysis: Exploring Three-dimensional Equilibrium, PhD thesis, MIT (2009), https://dspace.mit.edu/handle/1721.1/49539. No DOI was found for the 2007 paper.

import { domeSlice, profile, membrane, hoopZero, deg, centralLine, bestFit, thrustLine, thrustLP, thrustRange, hinges, drawThrust, clamp, f2, tnaSolve } from './ch04.shared.js';

const D2R = Math.PI / 180;
const kN = (x, d = 3) => `${Math.abs(x) < 0.05 ? 0 : x.toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;

export default {
  collection: 'arch',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.6
    poleniEvent,
    // ───────────────────────────────────────────────────────────────────────────────────── 4.7
    pantheonItem,

    // ───────────────────────────────────────────────────────────────────────────────────── 4.8
    florenceItem,
    // ───────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Pendentives: a dome on a square',
      statement: String.raw`A circular dome cannot sit directly on four arches over a square, because the circle and the square do not match. **Pendentives** solve this: take a sphere through the four corners of the square, cut it by the four vertical planes through the sides of the square (these cut four semicircular arches), and keep the four spherical triangles that remain between the arches below the horizontal circle that touches the arches' crowns. For a square of side $2a$ the sphere has radius $\sqrt2\,a$, the four cuts are semicircles of radius $a$, and the circle at height $a$ has radius $a$, so a dome can be built on it. The four pendentives carry the dome's weight to the four corner piers and give a continuous ring on which any dome can be set.`,
      idea: String.raw`The geometry is exact: at height $z$ the sphere $x^2+y^2+z^2=2a^2$ has horizontal radius $\sqrt{2a^2-z^2}$, which equals $a$ at $z=a$, where the vertical planes $x=\pm a$ and $y=\pm a$ are tangent to it; below that level the sphere is cut by those planes in the arches $z=\sqrt{a^2-y^2}$. The load path is the one of arch-4.1: a dome's weight comes down on a ring, the ring is carried by the arches through the pendentives, and everything reaches the four corner piers. The ring at the pendentives' top is in compression (arch-4.10). The sphere through the corners is the smallest one that can serve, so the pendentive dome above it is a shell of the same sphere (a sail vault) or, as in Hagia Sophia, a different, shallower dome set on the ring.`,
      caption: String.raw`Drag the picture to rotate. **Dome** chooses a dome on the same sphere (a "sail" vault) or a separate shallow dome of chosen rise on the ring. Move the **ring height** to see why it has to be at the arch crowns: lower, and the circle at that level pokes out through the arches (red) because the vertical planes cut the sphere away; higher, and a band of sphere is added below the dome. The plan shows the share of the square taken by the four pendentives.`,
      deps: ['arch-4.3'],
      see: ['arch-4.10', 'arch-4.1'],
      tags: ['pendentive', 'byzantine', 'geometry'],
      refs: ['Salvadori'],
      credit: 'developed in Roman and Byzantine architecture; the great dome of Hagia Sophia (532–537, Anthemius of Tralles and Isidore of Miletus) is the famous example',
      scope: String.raw`Geometry of the spherical pendentive on a square plan, with the four arches semicircular. Real pendentives are built with courses of masonry and are not exactly spherical, and the main dome of Hagia Sophia has a diameter of about 31 m, a figure not used in the picture.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pendentive' },
      viz(v) {
        const type = v.select('dome', [{ value: 'sail', label: 'same sphere (sail)' }, { value: 'sep', label: 'separate shallow dome' }], 'sail');
        const z0 = v.slider('ring height z / a (1 = arch crowns)', 0.6, 1.4, 1, { step: 0.01 });
        const rise = v.slider('rise of the separate dome / a', 0.2, 1.2, 0.35, { step: 0.01 });
        const S3 = v.stage({ x: [-1.9, 1.9], y: [-1.5, 1.9], equal: true, axes: false, height: 370, weight: 1.15, minWidth: 300, title: 'a dome on a square' });
        const sc = v.scene3(S3, { yaw: -0.6, pitch: 0.38, axes: false });
        const PL = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 370, weight: 0.8, minWidth: 240, title: 'plan' });
        let info = {};
        v.render(() => {
          const G = 40, sep = type.value === 'sep', Z0 = sep ? 1 : z0.value, Rs = Math.SQRT2;
          const zs = (x, y) => Math.sqrt(Math.max(0, 2 - x * x - y * y));
          const P = (x, y, z) => [x * 0.95, y * 0.95, (z - 0.5) * 0.95];
          sc.begin();
          sc.poly([P(-1, -1, -0.0), P(1, -1, 0), P(1, 1, 0), P(-1, 1, 0)], { fill: 'muted', fillAlpha: 0.06, color: 'faint', width: 1 });
          let areaP = 0, areaC = 0;
          for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
            const x0 = -1 + (2 * i) / G, x1 = x0 + 2 / G, y0 = -1 + (2 * j) / G, y1 = y0 + 2 / G, xc = (x0 + x1) / 2, yc = (y0 + y1) / 2, rc = Math.hypot(xc, yc), zc = zs(xc, yc);
            const gx = xc / zc, gy = yc / zc, dA = (4 / (G * G)) * Math.sqrt(1 + gx * gx + gy * gy);
            const inCircle = rc < 1, pend = !inCircle, band = !sep && zc > 1 && zc < Z0 && inCircle;
            if (inCircle && sep) continue;
            const below = zc <= Z0 + 1e-9, col = pend || band ? 'orange' : 'accent';
            if (pend) areaP += dA; else areaC += dA;
            if (!sep && !pend && !below && !band) { /* dome above the ring */ }
            sc.poly([P(x0, y0, zs(x0, y0)), P(x1, y0, zs(x1, y0)), P(x1, y1, zs(x1, y1)), P(x0, y1, zs(x0, y1))], { fill: !sep && below && !pend && zc <= Z0 ? 'orange' : col, fillAlpha: 0.2 + 0.1 * ((i + j) % 2), edge: false });
          }
          if (sep) {
            const h = rise.value, Rc = (1 + h * h) / (2 * h), n = 12;
            for (let i = 0; i < 40; i++) for (let j = 0; j < n; j++) {
              const a0 = (2 * Math.PI * j) / n, a1 = (2 * Math.PI * (j + 1)) / n, r0 = (i / 40) ** 0.9, r1 = ((i + 1) / 40) ** 0.9;
              const zz = (r) => 1 + Math.sqrt(Math.max(0, Rc * Rc - r * r)) - (Rc - h);
              sc.poly([P(r0 * Math.cos(a0), r0 * Math.sin(a0), zz(r0)), P(r1 * Math.cos(a0), r1 * Math.sin(a0), zz(r1)), P(r1 * Math.cos(a1), r1 * Math.sin(a1), zz(r1)), P(r0 * Math.cos(a1), r0 * Math.sin(a1), zz(r0))], { fill: 'accent', fillAlpha: 0.2 + 0.1 * ((i + j) % 2), edge: false });
            }
          }
          // arches
          for (const [fx, sx] of [[1, 1], [1, -1], [0, 1], [0, -1]]) sc.path(Array.from({ length: 31 }, (_, k) => { const s = -1 + (2 * k) / 30, zz = Math.sqrt(Math.max(0, 1 - s * s)); return fx ? P(sx, s, zz) : P(s, sx, zz); }), { color: 'ink', width: 2.2 });
          for (const x of [-1, 1]) for (const y of [-1, 1]) sc.line(P(x, y, 0), P(x, y, -0.9), { color: 'ink', width: 3.2 }, 1);
          // ring
          const r0 = Math.sqrt(Math.max(0, 2 - Z0 * Z0)), ringR = sep ? 1 : r0;
          const pts = Array.from({ length: 121 }, (_, k) => { const a = (2 * Math.PI * k) / 120; return [ringR * Math.cos(a), ringR * Math.sin(a)]; });
          let out = 0;
          for (let k = 0; k < 120; k++) { const a = pts[k], b = pts[k + 1], bad = Math.max(Math.abs(a[0]), Math.abs(a[1])) > 1.0005; if (bad) out++; sc.line(P(a[0], a[1], sep ? 1 : Z0), P(b[0], b[1], sep ? 1 : Z0), { color: bad ? 'red' : 'green', width: bad ? 3 : 2.4, top: true }, 1); }
          sc.flush();
          // plan
          PL.rect(-1, -1, 1, 1, { color: 'ink', width: 1.4, fill: 'orange', fillAlpha: 0.2 });
          PL.circle(0, 0, ringR, { color: out ? 'red' : 'green', fill: 'accent', fillAlpha: 0.2, width: 2 });
          PL.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          for (const x of [-1, 1]) for (const y of [-1, 1]) PL.rect(x - 0.07, y - 0.07, x + 0.07, y + 0.07, { fill: 'ink', fillAlpha: 0.8, color: 'ink' });
          PL.text('pendentive', 0.85, 0.85, { size: 11, color: 'orange', align: 'center' });
          info = { out, areaP, areaC, ringR, Z0, sep };
          v.legend([['orange', 'pendentives'], ['accent', 'dome'], ['green', 'ring (supported)'], ['red', 'ring outside the arches']]);
        });
        v.readout(() => `Square of side $2a$, sphere radius $\\sqrt2\\,a=1.414\\,a$; arches are semicircles of radius $a$. In plan the four pendentives cover $(4-\\pi)/4=${f2((4 - Math.PI) / 4, 3)}\\,a^2$ each, ${f2(100 * (1 - Math.PI / 4), 1)}% of the square. Ring: radius ${f2(info.ringR, 3)}$a$ at height ${f2(info.sep ? 1 : info.Z0, 2)}$a$ — ${info.out ? '**it leaves the square**: the arches cut it, so no dome can rest on it' : 'inside the square, resting on the arch crowns'}. Surface area of the four pendentives ${f2(info.areaP, 2)}$a^2$ against ${f2(info.areaC, 2)}$a^2$ for the cap of the same sphere.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Compression rings, oculi and lanterns',
      statement: String.raw`A dome with an opening at the crown (an oculus) is a shell whose upper edge must resist the horizontal part of the meridional compression that arrives there. If a lantern of weight $L$ stands on the edge circle at polar angle $\varphi_0$, the meridional force just below it is $N_\varphi=-L/(2\pi r_0\sin\varphi_0)$, with $r_0=a\sin\varphi_0$, and its horizontal inward component presses the edge circle together: the **compression ring** carries a hoop force
$$C=\frac{L}{2\pi}\cot\varphi_0 ,$$
larger for a small, flat-topped oculus and smaller for a steep one. The extra weight also increases the meridional force everywhere below, so a lantern pushes the belt of hoop tension (arch-4.4) up the dome.`,
      idea: String.raw`Vertical equilibrium of the ring: the lantern weight is balanced by the vertical components of the meridional force around the ring, which fixes $N_\varphi$; the horizontal components point at the axis and can only be balanced by a hoop force in the ring itself, which is the equilibrium of a closed ring under inward radial load (arch-1.3 for a circular ring: $C=$ load per unit length $\times$ radius). Without the ring the edge would move inward and the shell would split along its meridians. In the Pantheon the oculus is open and unloaded, so the ring only has to hold the shell's own meridional force; a lantern, as on St Peter's or Florence, loads it with its full weight.`,
      caption: String.raw`The section shows a dome of radius 10 m and its oculus at the angle $\varphi_0$ (slider), with a lantern of weight $L$ standing on it. The ring (gold) is drawn at the oculus and labelled with its compression. Remove the ring and the horizontal part of the thrust is unbalanced (arrow). The plot gives $N_\theta$ along the meridian with and without the lantern; the green dot is where tension begins (at the oculus edge itself when the lantern is heavy).`,
      deps: ['arch-4.3'],
      see: ['arch-4.9', 'arch-4.6'],
      tags: ['oculus', 'lantern', 'ring'],
      refs: ['Salvadori'],
      scope: String.raw`Spherical membrane dome of radius $a=10$ m and constant weight $w=10$ kN/m² (about 0.5 m of masonry) loaded by its own weight and a ring load $L$ at the oculus edge; ring and shell are connected without bending, and the ring is a thin circle of its own cross-section. The lantern weights are made up.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oculus' },
      viz(v) {
        const a = 10, w = 10;
        const p0s = v.slider('oculus angle φ₀ (°)', 5, 60, 14, { step: 0.5 });
        const L = v.slider('lantern weight L (kN)', 0, 3000, 800, { step: 10 });
        const ring = v.toggle('compression ring in place', true);
        const A = v.stage({ x: [-13, 13], y: [-2, 12.5], equal: true, axes: false, height: 340, weight: 1, minWidth: 300, title: 'oculus, lantern and ring' });
        const B = v.stage({ x: [0, 90], y: [-60, 60], axes: 'box', gutter: true, xlabel: 'angle from the crown, φ (°)', ylabel: 'hoop force N_θ (kN/m)', height: 340, weight: 1.1, minWidth: 300 });
        let data = null;
        const calc = (Lv) => { const P = profile({ type: 'sphere', R: a, phi0: p0s.value, phi1: 90, n: 300 }), m = membrane(P, w, Lv); return { P, m, zero: hoopZero(P, m.Ntheta) }; };
        v.render(() => {
          const p0 = p0s.value * D2R, r0 = a * Math.sin(p0), z0 = a * Math.cos(p0), Lv = L.value;
          const d = data = { with: calc(Lv), base: calc(0) }, { P, m } = d.with;
          for (let i = 1; i < P.length; i++) { const nt = (m.Ntheta[i] + m.Ntheta[i - 1]) / 2; for (const sg of [-1, 1]) A.line(sg * P[i - 1].r, P[i - 1].z, sg * P[i].r, P[i].z, { color: nt > 0 ? 'red' : 'accent', width: 7, alpha: 0.7 }); }
          // lantern block
          const lh = 2.2 + Lv / 1200, lw = r0 * 0.9 + 0.2;
          A.rect(-lw, z0, lw, z0 + lh, { fill: 'muted', fillAlpha: 0.3, color: 'ink', width: 1.4 });
          A.arrow(0, z0 + lh + 2.4, 0, z0 + lh + 0.1, { color: 'accent', width: 2.6, head: 8 }); A.text(`L = ${Lv.toFixed(0)} kN`, 1.2, z0 + lh + 1.8, { size: 12, color: 'accent', align: 'left' });
          const C = (Lv / (2 * Math.PI)) * (Math.cos(p0) / Math.sin(p0));
          if (ring.value) { for (const sg of [-1, 1]) A.dot(sg * r0, z0, { r: 6, color: 'gold' }); A.text(`ring: ${C.toFixed(0)} kN`, -r0 - 0.8, z0 - 0.9, { size: 12, color: 'gold', align: 'right' }); }
          else if (Lv > 0) { const Np = Lv / (2 * Math.PI * r0 * Math.sin(p0)), hx = Np * Math.cos(p0); for (const sg of [-1, 1]) A.arrow(sg * r0, z0, sg * (r0 - Math.min(3, hx / 30)), z0, { color: 'red', width: 2.6, head: 8 }); A.text('unbalanced inward push', 0, z0 - 1.5, { size: 12, color: 'red', align: 'center' }); }
          A.line(-12, 0, 12, 0, { color: 'faint', dash: [3, 4], width: 1 });
          const pts = (o) => o.P.map((q, i) => [deg(q.psi), o.m.Ntheta[i]]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(pts(d.base), { color: 'muted', dash: [4, 4], width: 1.6 }); B.path(pts(d.with), { color: 'red', width: 2.8 });
          const zz = m.Ntheta[0] > 0 ? P[0].psi : d.with.zero; if (zz !== null) B.dot(deg(zz), m.Ntheta[0] > 0 ? m.Ntheta[0] : 0, { r: 5, color: 'green' });
          v.legend([['red', 'hoop force with the lantern'], ['muted', 'no lantern', { dash: true }], ['green', 'sign change']]);
        });
        v.readout(() => {
          const p0 = p0s.value * D2R, r0 = a * Math.sin(p0), Lv = L.value, d = data, C = (Lv / (2 * Math.PI)) / Math.tan(p0), Np = Lv / (2 * Math.PI * r0 * Math.sin(p0));
          const first = (o) => (o.m.Ntheta[0] > 0 ? o.P[0].psi : o.zero), zw = first(d.with), zb = first(d.base);
          return `Edge circle: $r_0=${f2(r0, 2)}$ m. Meridional force just below the ring $N_\\varphi=${f2(Np, 1)}$ kN/m; ring compression $C=\\frac{L}{2\\pi}\\cot\\varphi_0=${f2(C, 0)}$ kN${ring.value ? '' : ' (not provided: the edge is pushed inward)'}. Hoop tension begins at ${zw !== null ? `$\\varphi=${f2(deg(zw), 1)}^\\circ$` : 'no angle (compression throughout)'} with the lantern and at ${zb !== null ? `$\\varphi=${f2(deg(zb), 1)}^\\circ$` : 'no angle'} without it.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Method',
      name: 'Thrust network analysis',
      statement: String.raw`**Thrust network analysis** (Block and Ochsendorf, 2007) extends the graphic statics of arch-1.5 to vaults. A *thrust network* is a three-dimensional net of straight compressive members that carries the vertical loads. It is found in two linear steps. First, its plan is fixed and the **horizontal forces** are chosen: the plan network Γ and a force diagram Γ* are reciprocal (parallel edges, dual graphs), so every node is in horizontal equilibrium, and each edge gets a *force density* $q=F/\ell$, its horizontal force over its plan length. Second, with the $q$ known, the **heights** $z$ of the nodes follow from vertical equilibrium, which is *linear*: $\sum_j q_{ij}(z_i-z_j)=p_i$ at every free node, with the loads $p_i$ and the heights of the supports given. The vault is safe if some network found in this way fits inside the thickness of the masonry (the safe theorem, arch-3.5, in three dimensions).`,
      idea: String.raw`In a cable net under a given load, shape and force are coupled non-linearly. Fixing the plan and the horizontal forces first removes the coupling: vertical equilibrium is then a discrete Poisson equation (arch-4.3 solves the same kind of equation in the continuum) and has one solution. The designer's freedom is the force diagram, i.e. the distribution of horizontal thrust; moving it moves the network up and down inside the vault, the same freedom as the choice of the pole in arch-1.5. Here the force diagram is a degenerate one: straight lines of constant horizontal force (rows, columns and, optionally, diagonals), which makes equilibrium of the horizontal forces hold automatically; the general method takes any reciprocal pair.`,
      caption: String.raw`Pick a vault (sail, cross or cloister; its middle surface is the shaded band of thickness $t$) and press **find the best network**: the optimiser changes four numbers (force level and its centre/edge contrast, for the rows-and-columns family and for the diagonals) to bring the network inside the band. The left plot is the plan with line widths proportional to the horizontal force, nodes green when inside the vault and red when outside; the middle plot is a section; the right plot is the force diagram, the force of each line. Thin the vault, or turn the diagonals off, and see which networks stop fitting: a cross vault needs forces along its groins, which rows and columns alone cannot give.`,
      deps: ['arch-4.3', 'arch-1.5'],
      see: ['arch-3.5', 'arch-4.1'],
      tags: ['form-finding', 'graphic statics', 'vaults'],
      refs: ['Allen & Zalewski'],
      credit: 'Philippe Block and John Ochsendorf, 2007 (J. Int. Assoc. Shell and Spatial Structures 48 (3): 167–173); Block, PhD thesis, MIT 2009',
      scope: String.raw`Regular $13\times13$ plan on a unit-half-span square with supports on the whole boundary at the height of the vault surface; loads from the weight of the middle surface (weight $\propto t\sqrt{1+|\nabla z|^2}$ per plan area); only compressive networks (all $F>0$). The envelope is the middle surface $\pm t/2$ measured vertically, a simplification of the true intrados/extrados.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thrust_network_analysis' },
      viz(v) {
        const n = 13, hx = 2 / (n - 1), X = (i) => -1 + i * hx;
        const shape = v.select('vault', [{ value: 'sail', label: 'sail vault' }, { value: 'cross', label: 'cross vault' }, { value: 'cloister', label: 'cloister vault' }], 'sail', { onChange: () => { optimise(); } });
        const diag = v.toggle('diagonal lines of thrust', true, { onChange: () => { optimise(); } });
        const tt = v.slider('thickness t / span', 0.03, 0.3, 0.12, { step: 0.005 });
        const lev = v.slider('force level (ln F)', -10, -0.5, -5.8, { step: 0.05 });
        const con = v.slider('rows/cols: centre vs edge', -0.9, 12, 3.7, { step: 0.05 });
        const dlev = v.slider('diagonals: force level (ln F)', -10, -0.5, -6.5, { step: 0.05 });
        const dcon = v.slider('diagonals: centre vs edge', -0.9, 12, 1, { step: 0.05 });
        const sec = v.select('section', [{ value: 'mid', label: 'y = 0' }, { value: 'q', label: 'y = 0.5' }, { value: 'd', label: 'diagonal' }], 'mid');
        const env = (x, y) => (shape.value === 'sail' ? Math.sqrt(Math.max(0, 2 - x * x - y * y)) : shape.value === 'cross' ? Math.min(Math.sqrt(Math.max(0, 1 - x * x)), Math.sqrt(Math.max(0, 1 - y * y))) : Math.max(Math.sqrt(Math.max(0, 1 - x * x)), Math.sqrt(Math.max(0, 1 - y * y))));
        const load = (i, j) => { const x = X(i), y = X(j), d = 1e-3, gx = (env(x + d, y) - env(x - d, y)) / (2 * d), gy = (env(x, y + d) - env(x, y - d)) / (2 * d); return tt.value * Math.sqrt(1 + gx * gx + gy * gy) * hx * hx; };
        const solve = (P, useDiag) => {
          const [a, b, c, d] = P, bc = clamp(b, -0.9, 12), dc = clamp(d, -0.9, 12);
          const Fr = (u) => Math.exp(a) * (1 + bc * (1 - u * u)), Fd = useDiag ? (u) => Math.exp(c) * (1 + dc * (1 - u * u)) : null;
          return tnaSolve(n, Fr, Fr, Fd, load, (i, j) => env(X(i), X(j)));
        };
        const dev = (r) => { let mx = 0; for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) mx = Math.max(mx, Math.abs(r.z[i][j] - env(X(i), X(j)))); return mx; };
        function optimise() {
          const rnd = v.rng(11), f = (P) => dev(solve(P, diag.value));
          let best = null;
          for (let k = 0; k < 70; k++) { const P = [-9 + 7 * rnd(), 8 * rnd(), -9 + 7 * rnd(), 8 * rnd()], c = f(P); if (!best || c < best.c) best = { P, c }; }
          const r = v.M.nelderMead(f, best.P, { step: 0.5, tol: 1e-6, maxIt: 140 });
          const [a, b, c, d] = r.x; lev.set(clamp(a, -10, -0.5)); con.set(clamp(b, -0.9, 12)); dlev.set(clamp(c, -10, -0.5)); dcon.set(clamp(d, -0.9, 12));
        }
        v.button('find the best network', () => optimise());
        const PL = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: false, height: 320, weight: 0.9, minWidth: 240, title: 'plan: lines of thrust' });
        const SE = v.stage({ x: [-1.05, 1.05], y: [-0.1, 1.65], axes: 'box', gutter: true, xlabel: 'position along the section', ylabel: 'height', height: 320, weight: 1.1, minWidth: 260, title: 'section' });
        const FD = v.stage({ x: [-1, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'line position', ylabel: 'force / max', height: 320, weight: 0.8, minWidth: 220, title: 'force diagram' });
        let info = {};
        optimise();
        v.render(() => {
          const P = [lev.value, con.value, dlev.value, dcon.value], r = solve(P, diag.value), t2 = tt.value / 2;
          const maxF = Math.max(...r.edges.map((e) => e.F));
          let bad = 0;
          for (const e of r.edges) { const x0 = X(e.a[0]), y0 = X(e.a[1]), x1 = X(e.b[0]), y1 = X(e.b[1]); if ((e.fam === 'r' || e.fam === 'c') && ((e.fam === 'r' && (e.a[1] === 0 || e.a[1] === n - 1)) || (e.fam === 'c' && (e.a[0] === 0 || e.a[0] === n - 1)))) continue; PL.line(x0, y0, x1, y1, { color: e.fam === 'r' || e.fam === 'c' ? 'accent' : 'orange', width: 0.6 + 4.6 * (e.F / maxF), alpha: 0.75 }); }
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const dv = Math.abs(r.z[i][j] - env(X(i), X(j))), okn = dv <= t2 + 1e-9; if (!okn) bad++; PL.dot(X(i), X(j), { r: i === 0 || j === 0 || i === n - 1 || j === n - 1 ? 3.2 : 4, color: okn ? 'green' : 'red' }); }
          const line = sec.value === 'mid' ? (k) => [k, (n - 1) / 2] : sec.value === 'q' ? (k) => [k, Math.round(((n - 1) * 0.75))] : (k) => [k, k];
          const pts = [], mids = [];
          for (let k = 0; k < n; k++) { const [i, j] = line(k), s = sec.value === 'd' ? X(k) * Math.SQRT2 : X(i); pts.push([s, r.z[i][j]]); mids.push([s, env(X(i), X(j))]); }
          const fine = Array.from({ length: 160 }, (_, k) => { const t = -1 + (2 * k) / 159, x = sec.value === 'd' ? t : t, y = sec.value === 'mid' ? 0 : sec.value === 'q' ? X(Math.round((n - 1) * 0.75)) : t; return [sec.value === 'd' ? t * Math.SQRT2 : t, env(x, y)]; });
          SE.between((x) => { const k = Math.round(((x + (sec.value === 'd' ? Math.SQRT2 : 1)) / (sec.value === 'd' ? 2 * Math.SQRT2 : 2)) * 159); const q = fine[clamp(k, 0, 159)]; return q[1] + t2; }, (x) => { const k = Math.round(((x + (sec.value === 'd' ? Math.SQRT2 : 1)) / (sec.value === 'd' ? 2 * Math.SQRT2 : 2)) * 159); const q = fine[clamp(k, 0, 159)]; return Math.max(0, q[1] - t2); }, sec.value === 'd' ? -1 : -1, sec.value === 'd' ? 1 : 1, { fill: 'muted', fillAlpha: 0.2 });
          SE.path(pts, { color: 'red', width: 2.6 }); SE.dots(pts, { r: 3.2, color: 'red' });
          // force diagram: force of each row (blue) and of each diagonal line (orange) by position
          const us = Array.from({ length: 41 }, (_, k) => -1 + k / 20), Fr = us.map((u) => Math.exp(P[0]) * (1 + clamp(P[1], -0.9, 12) * (1 - u * u))), Fdg = us.map((u) => Math.exp(P[2]) * (1 + clamp(P[3], -0.9, 12) * (1 - u * u)));
          const mx = Math.max(...Fr, diag.value ? Math.max(...Fdg) : 0);
          FD.path(us.map((u, k) => [u, Fr[k] / mx]), { color: 'accent', width: 2.6 });
          if (diag.value) FD.path(us.map((u, k) => [u, Fdg[k] / mx]), { color: 'orange', width: 2.6 });
          let W = 0; for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) W += load(i, j);
          let Hx = 0; for (let j = 1; j < n - 1; j++) Hx += Math.exp(P[0]) * (1 + clamp(P[1], -0.9, 12) * (1 - X(j) ** 2));
          info = { bad, dv: dev(r), W, Hx, t2 };
          v.legend([['accent', 'rows and columns'], ['orange', 'diagonals'], ['red', 'network (section)'], ['muted', 'vault thickness', { area: true }]]);
        });
        v.readout(() => `${info.bad === 0 ? '**The network fits** inside the vault' : `**${info.bad} node(s) outside** the vault`}: the largest distance from the middle surface is ${f2(info.dv, 3)} of the half-span against $t/2=${f2(info.t2, 3)}$. Total load ${f2(info.W, 3)}; total horizontal force carried to each pair of opposite walls by the rows ${f2(info.Hx, 3)}, a thrust-to-weight ratio of ${f2(info.Hx / info.W, 2)} (units: $\\gamma\\,\\mathrm{span}^3$).`);
      },
    },
  ],
};
