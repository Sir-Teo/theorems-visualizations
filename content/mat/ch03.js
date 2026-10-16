// Materials Science — Chapter 3: Dislocations and plastic deformation (part 1: items 3.1–3.6)
import { edgeCrystal, edgeU, edgeCompress, screwUz, walkSteps, slipSystems, schmid, dir3, planeFamily, permSigns } from './ch03.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sgnStr = (a) => a.map((x) => (x < 0 ? '\u0305' + Math.abs(x) : String(x))).join(''); // bar over negative index

/** Core atoms of an edge crystal: bulk atoms with other than 4 neighbours (3 or 5). */
function coreAtoms(cr) {
  const n = new Map();
  for (const [a, b] of cr.bonds) { n.set(a, (n.get(a) || 0) + 1); n.set(b, (n.get(b) || 0) + 1); }
  return cr.atoms.filter((a) => Math.abs(a.i) < cr.N - 1 && Math.abs(a.j) < cr.M - 1 && (n.get(a) || 0) !== 4);
}

export default {
  collection: 'mat',
  chapter: 3,
  title: 'Dislocations and plastic deformation',
  summary: String.raw`Perfect crystals should be thousands of times stronger than real metals; the discrepancy is explained by dislocations, line defects that let planes slip one row at a time. Their Burgers vectors, slip systems and resolved shear stresses decide when a crystal yields, their interactions harden it, and grain boundaries can be described as arrays of them.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Paradox',
      name: 'Theoretical shear strength versus real strength',
      statement: String.raw`If one atomic plane were slid rigidly over its neighbour in a perfect crystal, every bond across the plane would have to be stretched together. The restoring stress is periodic in the slip $s$ (period $b$, the spacing of atoms along the row) and for small $s$ it is Hooke's law $\tau=Gs/a$, with $a$ the plane spacing. Approximating it by $\tau=\tau_{\max}\sin(2\pi s/b)$ gives the **ideal shear strength** $\tau_{\max}=\dfrac{G}{2\pi}\dfrac{b}{a}\approx\dfrac{G}{6}$ (Frenkel, 1926). More realistic interatomic potentials lower this to roughly $G/30$ to $G/10$. Yet annealed single crystals of pure metals begin to flow at resolved shear stresses of only about $10^{-5}$ to $10^{-4}\,G$: three to four orders of magnitude below the ideal value.`,
      idea: String.raw`The paradox disappears when slip does not happen all at once. If the slipped part of a plane ends in a line defect, a **dislocation** (3.2), the atoms near its core are the only ones out of registry, and moving the slipped region forward by one atom spacing needs only a small rearrangement of a few bonds (a row of people shifting a rug by making a wrinkle and moving the wrinkle). Peierls and Nabarro's calculation of the stress needed to push such a core across the lattice gives $\tau_P\simeq \dfrac{2G}{1-\nu}\exp\!\big(-\tfrac{2\pi a}{(1-\nu)b}\big)$, exponentially smaller than the rigid-slip value because the core is wide. Taylor, Orowan and Polanyi proposed the dislocation as the carrier of slip in 1934 for exactly this reason (3.13).`,
      caption: String.raw`Left: two atomic planes in side view; drag the dot on the stress curve (middle) to slide the top plane rigidly, and watch the whole plane strain at once. Switch to *a dislocation moving* and drag the orange handle: the plane is slipped to its left and not to its right, and only a few atoms (gold dots on the curve) sit near the stress peak. Bottom: the strengths on a log scale; change the plane spacing $a/b$, and the measured critical stress and $G$ (defaults are illustrative, a copper-like soft crystal) to see how far above reality the rigid-slip value lies.`,
      deps: ['mat-1.2', 'cm-3.16'],
      refs: ['Callister §7.2'],
      tags: ['dislocations', 'strength', 'paradox'],
      credit: 'J. Frenkel, 1926 (ideal shear strength); R. Peierls 1940 and F. R. N. Nabarro 1947 (core width and lattice friction)',
      scope: String.raw`The sinusoidal law is Frenkel's model; the Peierls–Nabarro stress is an order-of-magnitude estimate that depends exponentially on the core width. The "measured" bar is a slider (default 1 MPa with $G=45$ GPa, a copper-like value, not a measurement of a particular crystal); the $G/30$ to $G/10$ range for realistic potentials and the typical $10^{-5}$ to $10^{-4}\,G$ for annealed pure metals are quoted from the course literature and were not re-derived here.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theoretical_strength_of_a_solid' },
      viz(v) {
        const NU = 0.3;
        const mode = v.select('slip by', [{ value: 'rigid', label: 'a whole plane at once' }, { value: 'disl', label: 'one dislocation moving' }], 'rigid');
        const rs = v.slider('plane spacing / row spacing  $a/b$', 0.5, 1.4, 0.82, { step: 0.01 });
        const Gs = v.slider('shear modulus $G$ (GPa)', 10, 100, 45, { step: 1 });
        const Cs = v.slider('measured critical shear stress (MPa)', 0.05, 100, 1, { log: true, decimals: 2 });
        const A = v.stage({ x: [-1.3, 9.3], y: [-0.8, 2.0], equal: true, axes: false, height: 270, weight: 1.55, title: 'two atomic planes, side view' });
        const B = v.stage({ x: [0, 1], y: [-0.34, 0.34], axes: 'box', gutter: true, height: 270, weight: 1, xlabel: 'slip  $s/b$', ylabel: 'shear stress  $\\tau/G$', title: 'stress against slip' });
        const C = v.stage({ x: [1e-6, 1], y: [0, 3.6], xlog: true, axes: 'box', gutter: true, height: 210, full: true, xlabel: 'shear strength  $\\tau/G$ (log scale)', yticks: [], title: 'three strengths of the same crystal' });
        const tau = (x) => Math.sin(2 * Math.PI * x) / (2 * Math.PI * rs.value);
        const hs = B.handle(0.2, tau(0.2), { color: 'accent', constrain: (x) => { const xx = clamp(x, 0, 1); return [xx, tau(xx)]; } });
        const hd = A.handle(4.5, 1.4, { color: 'orange', constrain: 'x' });
        let shifts = [];
        v.render(() => {
          const r = rs.value, disl = mode.value === 'disl';
          hs.visible = !disl; hd.visible = disl;
          hs.set(clamp(hs.x, 0, 1), tau(clamp(hs.x, 0, 1)));
          hd.set(clamp(hd.x, 1, 7.5), r + 0.55);
          const zeta = r / (2 * (1 - NU));
          shifts = [];
          for (let i = 0; i <= 8; i++) shifts.push(disl ? 0.5 - Math.atan((i - hd.x) / zeta) / Math.PI : hs.x);
          for (let i = -1; i <= 9; i++) A.dot(i, 0, { r: 8, color: 'muted', fill: 'muted' });
          for (let i = 0; i <= 8; i++) {
            const xt = i + shifts[i], st = Math.abs(Math.sin(2 * Math.PI * shifts[i]));
            const k = Math.round(xt);
            A.line(xt, r, k, 0, { color: 'red', alpha: 0.12 + 0.75 * st, width: 1 + 2 * st });
          }
          for (let i = 0; i <= 8; i++) { const st = Math.abs(Math.sin(2 * Math.PI * shifts[i])); A.dot(i + shifts[i], r, { r: 8, color: st > 0.35 ? 'orange' : 'accent', fill: st > 0.35 ? 'orange' : 'accent' }); }
          A.measure(9.0, 0, 9.0, r, '$a$');
          A.measure(-0.5, -0.45, 0.5, -0.45, '$b$');
          if (disl) {
            A.vline(hd.x, { color: 'orange', dash: true, alpha: 0.6 });
            A.text('slipped', Math.max(hd.x - 1.2, -0.4), r + 1.15, { color: 'muted', size: 12 });
            A.text('not yet slipped', Math.min(hd.x + 1.2, 8.3), r + 1.15, { color: 'muted', size: 12 });
          }
          B.fn(tau, { domain: [0, 1], color: 'ink', width: 2 });
          B.hline(0, { color: 'grid' });
          for (const s of shifts) B.dot(s, tau(s), { r: disl ? 4 : 0, color: 'gold', fill: 'gold' });
          // strengths
          const ideal = 1 / (2 * Math.PI * r), pn = (2 / (1 - NU)) * Math.exp((-2 * Math.PI * r) / (1 - NU)), meas = Cs.value / (Gs.value * 1000);
          const rows = [[ideal, 'rigid slip of a whole plane (Frenkel)', 'red', 2.75], [pn, 'dislocation moving (Peierls–Nabarro estimate)', 'orange', 1.55], [meas, 'measured critical stress (slider)', 'green', 0.35]];
          for (const [val, lab, col, y0] of rows) {
            C.rect(1e-6, y0, Math.max(val, 1.0001e-6), y0 + 0.7, { fill: col, fillAlpha: 0.35, color: col });
            C.text(lab + '   ' + (val >= 0.01 ? v.fmt(val, 2) : val.toExponential(1).replace('e-', '×10⁻')), 1.6e-6, y0 + 0.35, { color: 'ink', size: 12, align: 'left', plate: true });
          }
        });
        v.readout(() => {
          const r = rs.value, G = Gs.value, ideal = 1 / (2 * Math.PI * r), pn = (2 / (1 - NU)) * Math.exp((-2 * Math.PI * r) / (1 - NU)), meas = Cs.value / (G * 1000);
          const off = shifts.filter((s) => s > 0.1 && s < 0.9).length;
          return `$\\tau_{\\max}=\\dfrac{G}{2\\pi}\\dfrac{b}{a}=${v.fix(ideal, 3)}\\,G$ (= $G/${v.fix(1 / ideal, 1)}$, ${v.fix(ideal * G, 1)} GPa).  Peierls–Nabarro: $${v.sci(pn, 2)}\\,G$ (${v.fix(pn * G * 1000, 1)} MPa).  Measured: $${v.sci(meas, 2)}\\,G$ = $G/${v.fmt(1 / meas, 3)}$.\nRigid slip is ${v.fmt(ideal / meas, 2)} times stronger than the measured crystal. Atoms out of registry (between 0.1 and 0.9 of a lattice step): ${off} of 9 in this strip.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Edge and screw dislocations',
      statement: String.raw`A **dislocation** is a line defect that bounds a region of a crystal that has slipped by a lattice vector $\mathbf b$ from a region that has not. If $\mathbf b$ is perpendicular to the dislocation line, it is an **edge** dislocation: the lattice looks like an extra half-plane of atoms ending at the line, with compressed lattice on its side and stretched lattice on the other. If $\mathbf b$ is parallel to the line it is a **screw** dislocation: the lattice planes perpendicular to the line are joined into a single helical ramp, so that circling the line once climbs one plane. In general a dislocation line is curved and has mixed character; $\mathbf b$ stays the same all along it.`,
      idea: String.raw`Cut the crystal along a half-plane ending on the line, displace the two faces relative to each other by a lattice vector, and glue them back: the atoms far from the line again sit on perfect lattice sites, and only a thin tube around the line is distorted. This is Volterra's construction, and its elastic field follows from the displacement $u\propto\theta$ (screw) or from the plane-strain solution (edge). Here the displacement field of the isotropic-elasticity solution is applied to a square array of atoms (so the lattice, the extra half-plane and the strain colours are a real calculation, not a sketch). Because $\mathbf b$ is a lattice vector, the stored distortion costs only elastic energy (3.6).`,
      caption: String.raw`Drag the red core marker (it snaps between atoms). In *edge* mode the extra half-plane enters from the top; atoms are coloured by the hydrostatic part of the strain (squeezed above the core, stretched below) and the few atoms that do not have four neighbours are marked as the core. In *screw* mode the atoms are shown from along the line with arrows for their out-of-plane displacement; the lower panel unrolls a loop around the line to show the helical ramp.`,
      deps: ['xtal-1.1'],
      refs: ['Callister §4.5'],
      tags: ['dislocations', 'line defects', 'crystal structure'],
      scope: String.raw`Displacements use isotropic linear elasticity (Poisson ratio adjustable), valid away from the core; the core itself is only drawn schematically (a real core relaxes with the atomic potential).`,
      viz(v) {
        const N = 11, M = 7;
        const kind = v.select('type', [{ value: 'edge', label: 'edge  ($\\mathbf b\\perp$ line)' }, { value: 'screw', label: 'screw  ($\\mathbf b\\parallel$ line)' }], 'edge');
        const nuS = v.slider('Poisson ratio $\\nu$', 0, 0.45, 0.3, { step: 0.01 });
        const col = v.toggle('colour atoms by strain', true);
        const S = v.stage({ x: [-N - 0.6, N + 0.6], y: [-M - 0.6, M + 0.6], equal: true, axes: false, height: 400, weight: 1.6, title: 'atom positions' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 400, weight: 0.7, minWidth: 240, xlabel: 'turns around the line', ylabel: 'height / $b$', title: 'screw: a helical ramp' });
        const core = S.handle(0.5, 0.5, { color: 'red', r: 8, constrain: (x, y) => [clamp(Math.round(x - 0.5) + 0.5, -N + 3.5, N - 3.5), clamp(Math.round(y - 0.5) + 0.5, -M + 2.5, M - 2.5)] });
        const turn = R.handle(0.3, 0.3, { color: 'gold', constrain: (x) => [clamp(x, -1.5, 1.5), clamp(x, -1.5, 1.5)] });
        let info = '';
        v.render(() => {
          const edge = kind.value === 'edge';
          R.el.style.display = edge ? 'none' : '';
          core.set(core.x, core.y);
          const cx = core.x, cy = core.y;
          if (edge) {
            const cr = edgeCrystal(N, M, cx, cy, 1, nuS.value);
            for (const [a, b] of cr.bonds) S.line(a.x, a.y, b.x, b.y, { color: 'muted', alpha: 0.5, width: 1.4 });
            const cores = new Set(coreAtoms(cr));
            for (const a of cr.atoms) {
              const t = clamp(a.c * 3.2, -1, 1);
              S.dot(a.x, a.y, { r: cores.has(a) ? 6.5 : 5, color: cores.has(a) ? 'orange' : col.value ? v.diverge(t, 'blue', 'red') : 'accent', fill: cores.has(a) ? 'orange' : col.value ? v.diverge(t, 'blue', 'red') : 'accent' });
            }
            S.tex('\\perp', cx, cy + 0.02, { color: 'red', size: 20 });
            S.text('extra half-plane', cx + 0.15, M + 0.25, { color: 'muted', size: 12, align: 'left' });
            info = `edge: ${cores.size} core atoms with ≠4 neighbours`;
          } else {
            const pts = [];
            for (let j = -M; j <= M; j++) for (let i = -N; i <= N; i++) {
              const x = i - cx, y = j - cy, u = screwUz(x, y, 1);
              S.line(i, j, i + 1, j, { color: 'faint', alpha: 0.5 }); S.line(i, j, i, j + 1, { color: 'faint', alpha: 0.5 });
              pts.push([i, j, u]);
            }
            for (const [i, j, u] of pts) {
              const r = 2.2 + 8 * Math.abs(u) ** 0.8;
              S.dot(i, j, { r, color: u > 0 ? 'red' : 'blue', fill: u > 0 ? 'red' : 'blue', hollow: false });
              S.dot(i, j, { r: 1.6, color: 'ink', fill: 'ink' });
            }
            S.text('dot size and colour: out-of-plane shift $u_z$ (red up, blue down); one full turn = one lattice step $b$', 0, -M - 0.2, { color: 'muted', size: 11 });
            S.text('⊙', cx, cy, { color: 'ink', size: 22 });
            // ramp panel
            for (let n = -3; n <= 3; n++) R.hline(n, { color: 'grid' });
            R.fn((x) => x, { domain: [-1.5, 1.5], color: 'accent', width: 3 });
            R.dot(turn.x, turn.y, { r: 5, color: 'gold', fill: 'gold' });
            R.text(`${v.fix(turn.x, 2)} turns → ${v.fix(turn.y, 2)} b`, 0, 2.2, { color: 'ink', size: 12, plate: true });
            info = `screw: ${v.fix(Math.abs(turn.x), 2)} turns around the line = ${v.fix(Math.abs(turn.y), 2)} lattice steps`;
          }
        });
        v.readout(() => `**${kind.value === 'edge' ? 'Edge' : 'Screw'} dislocation** — ${info}. Far from the core the lattice is perfect: it is just displaced by one lattice vector across the cut.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Burgers vector and the Burgers circuit',
      statement: String.raw`Take a closed circuit of lattice steps (say $n_x$ steps right, $n_y$ up, $n_x$ left, $n_y$ down) in a real crystal, going around a dislocation line through good material. The same sequence of steps closes in a perfect crystal, but in the real crystal it does not: the vector needed to close it is the **Burgers vector** $\mathbf b$ of the enclosed dislocation line (its sign depends on the orientation convention for the circuit). It is a lattice vector, it is unchanged by the size or position of the circuit as long as the same set of lines is enclosed, it is perpendicular to an edge line and parallel to a screw line, and it is the same at every point of the dislocation line.`,
      idea: String.raw`Because the circuit lies in good crystal, each step is a lattice vector, and the net displacement is a sum of lattice vectors, hence a lattice vector. Deforming the circuit through good material cannot change an integer-valued closure failure, so it depends only on what the circuit encloses. A circuit enclosing no dislocation can be shrunk to nothing, so it closes. For a screw line the closure failure points along the line, which is why it is drawn in the helical picture (3.2): one turn around the axis lifts the circuit by one plane.`,
      caption: String.raw`Left (edge, positions computed from the elastic displacement field): drag the blue handle to move the circuit's lower-left corner, change its size, or move the core: the circuit follows atoms of the real crystal, and when it encloses the core the end does not coincide with the start; the green arrow is the closure failure, always one lattice vector, whatever the circuit size. Move the circuit off the core and it closes. Right (screw): a circuit around the line climbs one plane per turn; shift the circuit centre outside the radius and it comes back.`,
      deps: ['mat-3.2'],
      refs: ['Callister §4.5'],
      tags: ['dislocations', 'Burgers vector'],
      credit: 'J. M. Burgers, 1939',
      scope: String.raw`Edge crystal: isotropic elastic displacement field applied to a square lattice with neighbours found by distance; the closure failure drawn is from the finish back to the start for the counter-clockwise circuit shown (the opposite orientation would give the opposite sign).`,
      viz(v) {
        const N = 11, M = 7;
        const sign = v.select('crystal', [{ value: 1, label: 'edge, $+\\mathbf b$' }, { value: -1, label: 'edge, $-\\mathbf b$ (extra plane below)' }, { value: 0, label: 'perfect crystal' }], 1);
        const nxS = v.slider('circuit width $n_x$ (steps)', 2, 8, 5, { int: true });
        const nyS = v.slider('circuit height $n_y$', 2, 6, 4, { int: true });
        const S = v.stage({ x: [-N - 0.6, N + 0.6], y: [-M - 0.6, M + 0.6], equal: true, axes: false, height: 400, weight: 1.6, title: 'edge dislocation: Burgers circuit in the real crystal' });
        const T = v.stage({ x: [-2.2, 2.2], y: [-0.9, 2.6], equal: true, axes: false, height: 400, weight: 0.75, minWidth: 240, title: 'screw: circuit climbs one plane per turn' });
        const core = S.handle(0.5, 0.5, { color: 'red', r: 8, constrain: (x, y) => [clamp(Math.round(x - 0.5) + 0.5, -4.5, 4.5), clamp(Math.round(y - 0.5) + 0.5, -2.5, 2.5)] });
        const start = S.handle(-2, -2, { color: 'accent', r: 8, constrain: (x, y) => [clamp(Math.round(x), -N + 2, N - 10), clamp(Math.round(y), -M + 2, M - 7)] });
        const off = T.handle(0, 0, { color: 'orange', r: 7, constrain: (x, y) => [clamp(x, -1.8, 1.8), 0] });
        let info = '';
        const R = 1.0;
        v.render(() => {
          const b = Number(sign.value);
          core.set(core.x, core.y);
          const cr = edgeCrystal(N, M, core.x, core.y, b, 0.3);
          for (const [a, c] of cr.bonds) S.line(a.x, a.y, c.x, c.y, { color: 'muted', alpha: 0.5, width: 1.4 });
          for (const a of cr.atoms) S.dot(a.x, a.y, { r: 4, color: 'faint', fill: 'faint' });
          const nx = nxS.value, ny = nyS.value;
          const startAtom = cr.atoms.find((a) => a.i === Math.round(start.x) && a.j === Math.round(start.y)) || cr.atoms[0];
          const legs = [[1, 0, nx], [0, 1, ny], [-1, 0, nx], [0, -1, ny]];
          let cur = startAtom; const path = [startAtom];
          for (const [sx, sy, n] of legs) { const seg = walkSteps(cr, cur, sx, sy, n); for (const a of seg.slice(1)) path.push(a); cur = seg[seg.length - 1]; }
          const pts = path.map((a) => [a.x, a.y]);
          S.path(pts, { color: 'accent', width: 3 });
          path.forEach((a, k) => S.dot(a.x, a.y, { r: 5, color: 'accent', fill: 'accent', alpha: 0.9 }));
          S.dot(startAtom.x, startAtom.y, { r: 8, color: 'green', fill: 'green', label: 'start', labelPos: 'sw' });
          S.dot(cur.x, cur.y, { r: 8, color: 'red', fill: 'red', hollow: true, label: 'finish', labelPos: 'ne' });
          const cl = [startAtom.x - cur.x, startAtom.y - cur.y];
          const gap = Math.hypot(cl[0], cl[1]);
          if (gap > 0.3) S.arrow(cur.x, cur.y, startAtom.x, startAtom.y, { color: 'green', width: 3.5, head: 12 });
          S.tex('\\perp', core.x, core.y + 0.02, { color: 'red', size: b ? 20 : 1, alpha: b ? 1 : 0 });
          if (b === 0) S.text('no dislocation', core.x, core.y + 0.9, { color: 'muted', size: 11 });
          const enclosed = b !== 0 && Math.round(start.x) < core.x && core.x < Math.round(start.x) + nx && Math.round(start.y) < core.y && core.y < Math.round(start.y) + ny;
          info = `closure failure $(${v.fix(cl[0], 2)}, ${v.fix(cl[1], 2)})\\,a$, length ${v.fix(gap, 2)} lattice step${gap > 0.3 ? '' : 's'}; the circuit ${enclosed ? 'encloses' : 'does not enclose'} the core`;
          // screw panel
          const d = off.x, enc = Math.abs(d) < R;
          T.line(0, -0.8, 0, 2.5, { color: 'muted', width: 1.2, dash: true });
          T.text('line', 0.12, 2.45, { color: 'muted', size: 11, align: 'left' });
          const n = 90, pp = []; let prev = Math.atan2(0 - 0, -d), wind = 0;
          const P = [];
          for (let k = 0; k <= n; k++) {
            const ph = (2 * Math.PI * k) / n, x = d + R * Math.cos(ph), y = R * Math.sin(ph);
            let a = Math.atan2(y * 1, x); // angle about the line (at origin)
            if (k > 0) { let da = a - prev; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; wind += da; }
            prev = a;
            P.push([x, 0.45 * y + (wind / (2 * Math.PI)) * 1.0 + 0.2]);
          }
          T.path(P, { color: 'accent', width: 3 });
          const Q0 = P[0], Q1 = P[P.length - 1];
          T.dot(Q0[0], Q0[1], { r: 7, color: 'green', fill: 'green' });
          T.dot(Q1[0], Q1[1], { r: 7, color: 'red', fill: 'red', hollow: true });
          const lift = (Q1[1] - Q0[1]);
          if (Math.abs(lift) > 0.1) T.arrow(Q1[0], Q1[1], Q0[0], Q0[1], { color: 'green', width: 3.5, head: 12 });
          T.text(enc ? 'circuit encloses the line: ends one plane higher' : 'circuit does not enclose the line: it closes', 0, -0.65, { color: 'muted', size: 11 });
          T.text('drag the orange handle sideways', 0, -0.35, { color: 'faint', size: 10 });
        });
        v.readout(() => `**Edge:** ${info}. For the edge the closure vector is perpendicular to the dislocation line (here the line points out of the page); for the screw panel it is parallel to the line.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Concept',
      name: 'Slip systems',
      statement: String.raw`Dislocations glide most easily on the **close-packed planes** and along the **close-packed directions** of a crystal, because a dislocation's energy $\propto b^2$ (3.6) is smallest there and the lattice friction is smallest where planes are widely spaced and $b$ is short. A **slip system** is a plane and a direction in it: fcc metals slip on $\{111\}\langle110\rangle$ (4 planes $\times$ 3 directions $=12$ systems); bcc metals on $\{110\}\langle111\rangle$ (12), and also, at higher temperature or stress, on $\{112\}\langle111\rangle$ (12) and $\{123\}\langle111\rangle$ (24); hcp metals have only 3 close-packed basal systems and need prismatic or pyramidal slip for more. How many easy systems a metal has controls its ductility.`,
      idea: String.raw`The slip systems are found by listing the planes of the densest family and all the close-packed directions that lie in them; the count follows from symmetry, and the system's resistance from the width of the dislocation core: in the Peierls–Nabarro estimate (3.1) the stress is smaller the larger the spacing $d$ of the slip planes relative to $b$, so the dense families win (planar and linear densities, 1.6). fcc has many equivalent dense systems, so some are always well oriented and fcc metals are ductile; hcp metals with only the basal plane have a strongly anisotropic response.`,
      caption: String.raw`Pick a structure and step through its slip systems (or drag the slider): the plane is drawn in the unit cell with the slip direction as an arrow, and the atoms on it in gold. The bar chart on the right ranks the slip families by the crude Peierls–Nabarro index $\exp\!\big(-2\pi d/((1-\nu)b)\big)$ (normalised to the easiest family): for the hcp case move the $c/a$ slider and watch basal and prismatic slip swap places.`,
      deps: ['mat-3.3', 'mat-1.6'],
      refs: ['Callister §7.4'],
      tags: ['slip systems', 'ductility', 'crystal structure'],
      scope: String.raw`System counts for fcc and bcc are enumerated from symmetry by the program; the hcp families (basal 3, prismatic 3, pyramidal $\langle a\rangle$ 6, first-order pyramidal $\langle c+a\rangle$ 12, second-order 6) are quoted from the standard tabulation. The ranking index is the simplest Peierls–Nabarro estimate with $\nu=0.3$; it ranks the cubic families sensibly but is only qualitative for hcp (it fails for magnesium, where basal slip dominates at room temperature).`,
      verify: true,
      viz(v) {
        const st = v.select('structure', [{ value: 'fcc', label: 'fcc  {111}⟨110⟩' }, { value: 'bcc', label: 'bcc  {110}⟨111⟩ (+{112}, {123})' }, { value: 'hcp', label: 'hcp' }], 'fcc');
        const fam = v.select('family', [{ value: 0, label: 'first' }], 0);
        let k = 0;
        const idx = v.slider('system number', 1, 12, 1, { int: true });
        const cas = v.slider('hcp  $c/a$', 1.4, 1.95, 1.633, { step: 0.001 });
        const hexFam = v.select('hcp family', [{ value: 'basal', label: 'basal' }, { value: 'prism', label: 'prismatic' }, { value: 'pyr', label: 'pyramidal ⟨c+a⟩' }], 'basal');
        fam.el.hidden = true;
        const S3 = v.stage({ x: [-1.5, 1.5], y: [-1.3, 1.4], equal: true, axes: false, height: 400, weight: 1.2, title: 'slip plane and direction in the unit cell' });
        const sc = v.scene3(S3, { yaw: -0.7, pitch: 0.4, axis: 0, axes: false, hint: true });
        const R = v.stage({ x: [0, 1], y: [0, 5], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 260, xlabel: 'relative ease of slip (log scale)', yticks: [], title: 'slip families ranked' });
        const NU = 0.3;
        const cubeV = []; for (let i = 0; i < 8; i++) cubeV.push([(i & 1) - 0.5, ((i >> 1) & 1) - 0.5, ((i >> 2) & 1) - 0.5]);
        const cubeE = []; for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) if (!((i >> b) & 1)) cubeE.push([i, i | (1 << b)]);
        // lattice points in cell coordinates 0..1
        const pts = (s) => { const o = []; for (let i = 0; i < 8; i++) o.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]); if (s === 'bcc') o.push([0.5, 0.5, 0.5]); else { o.push([0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]); } return o; };
        // polygon of the section of a convex body (vertices, edges) by the plane n.x = c
        const section = (V, E, n, c) => {
          const P = [];
          for (const [a, b] of E) { const fa = n[0] * V[a][0] + n[1] * V[a][1] + n[2] * V[a][2] - c, fb = n[0] * V[b][0] + n[1] * V[b][1] + n[2] * V[b][2] - c; if ((fa > 1e-9 && fb < -1e-9) || (fa < -1e-9 && fb > 1e-9)) { const t = fa / (fa - fb); P.push(V[a].map((x, q) => x + t * (V[b][q] - x))); } else if (Math.abs(fa) < 1e-9 && Math.abs(fb) > 1e-9) P.push(V[a]); else if (Math.abs(fb) < 1e-9 && Math.abs(fa) > 1e-9) P.push(V[b]); }
          const u = []; for (const p of P) if (!u.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-6)) u.push(p);
          if (u.length < 3) return u;
          const cen = [0, 1, 2].map((q) => u.reduce((s, p) => s + p[q], 0) / u.length);
          const nn = v.M.normalize(n), e1 = v.M.normalize(v.M.cross3(nn, Math.abs(nn[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])), e2 = v.M.cross3(nn, e1);
          u.sort((p, q) => Math.atan2(v.M.dot(v.M.vsub(p, cen), e2), v.M.dot(v.M.vsub(p, cen), e1)) - Math.atan2(v.M.dot(v.M.vsub(q, cen), e2), v.M.dot(v.M.vsub(q, cen), e1)));
          return u;
        };
        const area = (poly) => { let a = [0, 0, 0]; for (let i = 0; i < poly.length; i++) { const c = v.M.cross3(poly[i], poly[(i + 1) % poly.length]); a = v.M.vadd(a, c); } return Math.hypot(...a) / 2; };
        // cubic systems
        const cubicFamilies = (s) => (s === 'fcc' ? [{ p: [1, 1, 1], d: [1, 1, 0], name: '{111}⟨110⟩', d_over_a: 1 / Math.sqrt(3), b_over_a: Math.SQRT1_2 }]
          : [{ p: [1, 1, 0], d: [1, 1, 1], name: '{110}⟨111⟩', d_over_a: 1 / Math.SQRT2, b_over_a: Math.sqrt(3) / 2 }, { p: [1, 1, 2], d: [1, 1, 1], name: '{112}⟨111⟩', d_over_a: 1 / Math.sqrt(6), b_over_a: Math.sqrt(3) / 2 }, { p: [1, 2, 3], d: [1, 1, 1], name: '{123}⟨111⟩', d_over_a: 1 / Math.sqrt(14), b_over_a: Math.sqrt(3) / 2 }]);
        const systemsOf = (s) => { const out = []; for (const f of cubicFamilies(s)) for (const q of slipSystems(f.p, f.d)) out.push({ ...q, fam: f }); return out; };
        const SYS = { fcc: systemsOf('fcc'), bcc: systemsOf('bcc') };
        const hexV = (c) => { const V = []; for (let z = 0; z < 2; z++) for (let k = 0; k < 6; k++) V.push([Math.cos((Math.PI * k) / 3), Math.sin((Math.PI * k) / 3), z ? c / 2 : -c / 2]); return V; };
        const hexE = []; for (let k = 0; k < 6; k++) hexE.push([k, (k + 1) % 6], [6 + k, 6 + ((k + 1) % 6)], [k, 6 + k]);
        const peierls = (dOverB) => Math.exp((-2 * Math.PI * dOverB) / (1 - NU));
        v.render(() => {
          const s = st.value, cubic = s !== 'hcp';
          idx.el.hidden = !cubic; cas.el.hidden = cubic; hexFam.el.hidden = cubic;
          let fams = [];
          sc.begin();
          if (cubic) {
            const list = SYS[s]; idx.el.hidden = false;
            const kk = clamp(idx.value - 1, 0, list.length - 1), q = list[kk];
            // draw the cube
            for (const [a, b] of cubeE) sc.line(cubeV[a], cubeV[b], { color: 'ink', alpha: 0.4, width: 1.2 });
            // choose the lattice plane with the biggest cross-section
            const P0 = pts(s); let best = null, ba = -1;
            const cs = new Set(P0.map((p) => +(q.n[0] * p[0] + q.n[1] * p[1] + q.n[2] * p[2]).toFixed(6)));
            for (const c of cs) { const poly = section(cubeV.map((p) => p.map((x) => x + 0.5)), cubeE, q.n, c); const a = poly.length >= 3 ? area(poly) : 0; if (a > ba + 1e-9) { ba = a; best = { c, poly }; } }
            const ctr = (poly) => [0, 1, 2].map((t) => poly.reduce((a, p) => a + p[t], 0) / poly.length);
            if (best.poly.length >= 3) sc.poly(best.poly.map((p) => p.map((x) => x - 0.5)), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
            for (const p of P0) { const on = Math.abs(q.n[0] * p[0] + q.n[1] * p[1] + q.n[2] * p[2] - best.c) < 1e-6; sc.dot(p.map((x) => x - 0.5), { r: on ? 6 : 3, color: on ? 'gold' : 'muted', fill: on ? 'gold' : 'muted' }); }
            const cc = ctr(best.poly).map((x) => x - 0.5), dn = v.M.normalize(q.d);
            sc.arrow(v.M.vadd(cc, v.M.vscale(dn, -0.38)), v.M.vadd(cc, v.M.vscale(dn, 0.38)), { color: 'red', width: 3 });
            sc.tex('\\mathbf b', v.M.vadd(cc, v.M.vscale(dn, 0.46)), { color: 'red' });
            S3.setTitle(`system ${kk + 1} of ${list.length}: (${sgnStr(q.n)})[${sgnStr(q.d)}]  of  ${q.fam.name}`);
            fams = cubicFamilies(s).map((f) => ({ name: f.name, count: list.filter((y) => y.fam === f).length, dob: f.d_over_a / f.b_over_a }));
          } else {
            const c = cas.value, V = hexV(c);
            for (const [a, b] of hexE) sc.line(V[a].map((x, i) => (i === 2 ? x * 1.0 : x)), V[b].map((x, i) => (i === 2 ? x * 1.0 : x)), { color: 'ink', alpha: 0.4, width: 1.2 });
            const fm = hexFam.value; let poly, dvec, nm, dob;
            const sc3 = (p) => [p[0], p[1], p[2]];
            if (fm === 'basal') { poly = V.slice(0, 6); dvec = [1, 0, 0]; nm = 'basal (0001)⟨11̄20⟩: 3 systems'; }
            else if (fm === 'prism') { poly = [V[0], V[1], V[7], V[6]]; dvec = [Math.cos(Math.PI * 2 / 3) - 1, Math.sin(Math.PI * 2 / 3), 0]; dvec = [V[1][0] - V[0][0], V[1][1] - V[0][1], 0]; nm = 'prismatic {101̄0}⟨11̄20⟩: 3 systems'; }
            else { const w = c / 2; poly = [V[0], V[1], [0.5 * (V[1][0] + V[0][0]) * 0 + V[1][0] * 0 + 0.5, Math.sqrt(3) / 2 * 0 + 0.866, w]].slice(0, 3); poly = [V[0], V[1], V[7], [V[0][0] + (V[7][0] - V[1][0]), V[0][1] + (V[7][1] - V[1][1]), V[7][2]]]; poly = [V[0], V[1], V[7], V[6]]; nm = 'pyramidal ⟨c+a⟩: 12 + 6 systems'; dvec = null; }
            if (fm === 'pyr') {
              // plane through the bottom edge V0V1 and the opposite top edge direction: the {10-11} plane contains a1-type edge and rises: use bottom edge (V0,V1) and the top point on V7's far side
              const e = [V[1][0] - V[0][0], V[1][1] - V[0][1], 0], m = [(V[0][0] + V[1][0]) / 2, (V[0][1] + V[1][1]) / 2];
              const top = [m[0] - 0.5 * 0, m[1] * 0, c / 2];
              // plane (10-11): contains the edge V0V1 and rises toward the cell centre axis: top edge shifted to the axis at z=+c/2
              const tp = [[0, 0, c / 2]]; poly = [V[0], V[1], [m[0] * 0, m[1] * 0, c / 2]];
              poly = [V[0], V[1], [0.0, 0.0, c / 2]];
              dvec = [(0 - m[0]) * 0.35 + (V[1][0] - V[0][0]) * 0.0, (0 - m[1]) * 0.35, c * 0.5 * 0.35]; dvec = v.M.vadd(v.M.vscale(v.M.normalize([-m[0], -m[1], 0]), 0.3), [0, 0, 0.5 * c * 0.35]);
              dvec = [-m[0] * 0.8, -m[1] * 0.8, c * 0.45];
            }
            sc.poly(poly, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
            const cc = [0, 1, 2].map((t) => poly.reduce((a, p) => a + p[t], 0) / poly.length);
            const dn = v.M.normalize(dvec);
            sc.arrow(v.M.vadd(cc, v.M.vscale(dn, -0.45)), v.M.vadd(cc, v.M.vscale(dn, 0.45)), { color: 'red', width: 3 });
            for (const p of V) sc.dot(p, { r: 3, color: 'muted', fill: 'muted' });
            S3.setTitle(nm);
            const half = c / 2;
            fams = [{ name: 'basal', count: 3, dob: c / 2 }, { name: 'prismatic', count: 3, dob: Math.sqrt(3) / 2 }, { name: 'pyramidal ⟨c+a⟩', count: 18, dob: null }];
          }
          sc.flush();
          // ranking panel
          const rows = fams.filter((f) => f.dob != null).map((f) => ({ ...f, e: peierls(f.dob) }));
          const emax = Math.max(...rows.map((r) => r.e));
          R.setView([-7, 0.3], [0, 5]);
          rows.forEach((r, i) => {
            const lg = Math.log10(r.e / emax), y0 = 3.6 - 1.2 * i;
            R.rect(-7, y0, Math.max(lg, -6.9), y0 + 0.8, { fill: i === 0 ? 'green' : 'accent', fillAlpha: 0.35, color: i === 0 ? 'green' : 'accent' });
            R.text(`${r.name}: ${r.count} systems,  d/b = ${v.fix(r.dob, 2)}`, -6.9, y0 + 0.4, { color: 'ink', size: 11, align: 'left', plate: true });
            R.text(lg > -0.05 ? '1' : `10${String(Math.round(lg)).replace('-', '⁻')}`.replace(/(\d)(?=\d)/g, '$1'), Math.min(lg, 0) - 0.1, y0 + 0.4, { color: 'ink', size: 11, align: 'right' });
          });
          R.text(`index = exp(−2π d/((1−ν)b)), ν = 0.3, relative to the easiest family`, -3.5, 4.75, { color: 'muted', size: 10.5 });
          R._rows = rows;
        });
        v.readout(() => {
          const s = st.value;
          if (s === 'hcp') return `**hcp:** basal slip has only 3 systems, 2 independent (3.9); prismatic adds 3 ⟨a⟩ systems, and ⟨c+a⟩ pyramidal slip is needed to deform along the c axis. At $c/a=${v.fix(cas.value, 3)}$ the crude index puts ${R._rows && R._rows[0].dob > R._rows[1].dob * 0 && R._rows[0].e >= R._rows[1].e ? 'basal' : 'prismatic'} slip first.`;
          const n = SYS[s].length;
          return `**${s}:** ${n} systems found by enumerating the plane family and the close-packed directions lying in each plane (${cubicFamilies(s).map((f) => `${SYS[s].filter((y) => y.fam === f).length} for ${f.name}`).join(', ')}). The dense family has the widest spacing relative to $b$, so it is the easiest.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Law',
      name: 'Schmid’s law and critical resolved shear stress',
      statement: String.raw`A single crystal under a uniaxial stress $\sigma$ yields when the shear stress resolved on some slip system, $\tau_R=\sigma\cos\phi\cos\lambda$, reaches a material constant, the **critical resolved shear stress** $\tau_c$. Here $\phi$ is the angle between the tensile axis and the slip-plane normal and $\lambda$ the angle between the tensile axis and the slip direction; $m=\cos\phi\cos\lambda\le\tfrac12$ is the **Schmid factor**. Slip starts on the system with the largest $m$, so the tensile yield stress is $\sigma_y=\tau_c/m_{\max}$, between $2\tau_c$ (best orientation) and infinity (when no system is stressed).`,
      idea: String.raw`The driving force on a dislocation gliding in a slip system is the shear stress acting on that plane in that direction (the Peach–Koehler force, per unit length $\tau_R b$), and the resistance of the lattice and of obstacles on that system does not depend on the loading axis; so slip starts where the resolved stress first reaches the critical value. The geometry is vector algebra: the resolved shear stress is $\sigma(\hat t\cdot\hat n)(\hat t\cdot\hat d)$ for a unit tensile axis $\hat t$. $\cos\phi\cos\lambda\le\tfrac12$ because $\cos\phi\cos\lambda=\tfrac12[\cos(\phi-\lambda)+\cos(\phi+\lambda)]$ and $\phi+\lambda\ge 90^\circ$ when $\hat n\perp\hat d$.`,
      caption: String.raw`Drag the tensile axis (white-and-gold handle) inside the standard stereographic triangle; the colour is the yield stress $\sigma_y/\tau_c=1/m_{\max}$ for every orientation. The bars show the Schmid factor of each of the 12 systems for the current axis; raise the applied stress and the systems with $\sigma m\ge\tau_c$ turn green: the first to do so is the primary system, and where two tie (on the boundaries of the triangle and its corners) several operate at once.`,
      deps: ['mat-3.4'],
      refs: ['Callister §7.5'],
      tags: ['Schmid factor', 'yield', 'single crystal'],
      credit: 'E. Schmid and W. Boas (Kristallplastizität, 1935)',
      scope: String.raw`Holds for single crystals where one critical stress governs slip (well obeyed by fcc and hcp metals at low temperature); non-Schmid effects (stress components normal to the slip plane, twinning–antitwinning asymmetry) are known in bcc metals, so the bcc option is a Schmid-law idealisation of $\{110\}\langle111\rangle$ only. The symmetry-folded triangle uses $z\ge x\ge y\ge0$ of the unit tensile axis.`,
      viz(v) {
        const sys = v.select('crystal', [{ value: 'fcc', label: 'fcc  {111}⟨110⟩' }, { value: 'bcc', label: 'bcc  {110}⟨111⟩' }], 'fcc');
        const sig = v.slider('applied tensile stress $\\sigma/\\tau_c$', 0, 4, 2.6, { step: 0.01 });
        const SYS = { fcc: slipSystems([1, 1, 1], [1, 1, 0]), bcc: slipSystems([1, 1, 0], [1, 1, 1]) };
        const fromXY = (x, y) => { const r2 = x * x + y * y; return [2 * x / (1 + r2), 2 * y / (1 + r2), (1 - r2) / (1 + r2)]; };
        const toXY = (t) => [t[0] / (1 + t[2]), t[1] / (1 + t[2])];
        const fold = (t) => { const a = t.map(Math.abs).sort((p, q) => p - q); return [a[1], a[0], a[2]]; };
        const mmax = (t, list) => Math.max(...list.map((q) => schmid(t, q.n, q.d)));
        const T = v.stage({ x: [-0.04, 0.46], y: [-0.04, 0.42], equal: true, axes: false, height: 380, weight: 1.1, title: 'tensile axis in the standard triangle' });
        const B = v.stage({ x: [0.5, 12.5], y: [0, 0.55], axes: 'box', gutter: true, height: 380, weight: 1.2, xlabel: 'slip system', ylabel: 'Schmid factor  $m$', title: 'resolved shear on each system' });
        const h = T.handle(0.2, 0.1, { color: 'gold', r: 9, constrain: (x, y) => { const f = fold(fromXY(x, y)); return toXY(f); } });
        const corners = [['[001]', [0, 0, 1]], ['[101]', [1, 0, 1]], ['[111]', [1, 1, 1]]];
        const names = (q) => `(${sgnStr(q.n)})[${sgnStr(q.d)}]`;
        for (const [nm, d] of corners) { }
        v.button('[001]', () => h.set(...toXY(dir3(0, 0, 1))));
        v.button('[101]', () => h.set(...toXY(dir3(1, 0, 1))));
        v.button('[111]', () => h.set(...toXY(dir3(1, 1, 1))));
        v.button('[112]', () => h.set(...toXY(dir3(1, 1, 2))));
        let cur = null;
        v.render(() => {
          const list = SYS[sys.value];
          T.raster((x, y) => {
            const t = fromXY(x, y); if (!(t[2] >= t[0] - 1e-9 && t[0] >= t[1] - 1e-9 && t[1] >= -1e-9)) return null;
            const y1 = 1 / mmax(t, list), u = clamp((y1 - 2) / 1.7, 0, 1);
            return v.ramp(u, 'accent', 'panel');
          }, { res: 3, key: 'sy' + sys.value });
          const tri = [toXY(dir3(0, 0, 1)), toXY(dir3(1, 0, 1)), toXY(dir3(1, 1, 1))];
          T.poly([[0, 0], [0.4142, 0], [0.366, 0.366]], { stroke: true, color: 'ink', fill: false, width: 2 });
          T.curve((s) => toXY(dir3(s, s, 1 - 0.0)), 0, 1, { n: 2, color: 'ink', width: 0, alpha: 0 });
          // the (101)-(111) side is a circle arc: sample it
          T.curve((s) => toXY(dir3(1, s, 1)), 0, 1, { n: 40, color: 'ink', width: 2 });
          T.curve((s) => toXY(dir3(s, s, 1)), 0, 1, { n: 40, color: 'ink', width: 2 });
          for (const [nm, d] of corners) { const p = toXY(dir3(...d)); T.dot(p[0], p[1], { r: 4, color: 'ink', fill: 'ink' }); T.text(nm, p[0] + (nm === '[001]' ? -0.02 : 0.015), p[1] + (nm === '[111]' ? 0.03 : -0.03), { color: 'ink', size: 12, align: nm === '[001]' ? 'right' : 'left' }); }
          const t = fold(fromXY(h.x, h.y)), ms = list.map((q) => schmid(t, q.n, q.d)), mx = Math.max(...ms);
          cur = { t, ms, mx, list };
          const s = sig.value;
          B.bars(ms, { x0: 1, dx: 1, color: (val, i) => (s * val >= 1 - 1e-9 ? 'green' : val > mx - 1e-6 ? 'orange' : 'accent') });
          B.hline(0.5, { color: 'muted', dash: true, alpha: 0.7 });
          B.text('$m\\le 1/2$', 12.4, 0.52, { align: 'right', color: 'muted', size: 11 });
          if (s > 0) B.hline(1 / s, { color: 'red', width: 2 });
          if (s > 0) B.text('$\\tau_c/\\sigma$', 0.7, Math.min(1 / s, 0.5) + 0.025, { align: 'left', color: 'red', size: 11 });
        });
        v.readout(() => {
          if (!cur) return '';
          const { ms, mx, list } = cur, ties = ms.map((m, i) => (m > mx - 1e-6 ? i : -1)).filter((i) => i >= 0), s = sig.value;
          const nAct = ms.filter((m) => s * m >= 1 - 1e-9).length;
          return `Axis $[${cur.t.map((x) => v.fix(x, 3)).join(',\\,')}]$: $m_{\\max}=${v.fix(mx, 3)}$, so $\\sigma_y=\\tau_c/m_{\\max}=${v.fix(1 / mx, 3)}\\,\\tau_c$. Primary system${ties.length > 1 ? 's (tied, multiple slip)' : ''}: ${ties.map((i) => names(list[i])).slice(0, 4).join(', ')}${ties.length > 4 ? ', …' : ''}.\nAt $\\sigma=${v.fix(s, 2)}\\,\\tau_c$: ${nAct ? `${nAct} system${nAct > 1 ? 's' : ''} at or beyond the critical stress, the crystal has yielded` : 'no system has reached $\\tau_c$, the crystal is still elastic'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Proposition',
      name: 'Dislocation strain energy ∝ Gb²',
      statement: String.raw`In isotropic linear elasticity the strain energy stored per unit length of a straight dislocation, between the core radius $r_0$ and an outer radius $R$, is $$W=\frac{Gb^2}{4\pi(1-\nu)}\ln\frac{R}{r_0}\ \ (\text{edge}),\qquad W=\frac{Gb^2}{4\pi}\ln\frac{R}{r_0}\ \ (\text{screw}).$$ It grows only logarithmically with the size of the region but quadratically with $|\mathbf b|$, so $W\approx\tfrac12Gb^2$ to $Gb^2$ is the usual rule of thumb. Consequently a dislocation line behaves as if it had a **line tension** $T\approx\tfrac12Gb^2$, and a dislocation of Burgers vector $\mathbf b_1$ lowers its energy by splitting into $\mathbf b_2+\mathbf b_3=\mathbf b_1$ whenever $b_2^2+b_3^2<b_1^2$ (Frank's rule).`,
      idea: String.raw`Around the line the strain falls like $b/(2\pi r)$ so the energy density $\tfrac12 G\epsilon^2$ falls like $b^2/r^2$; integrating over rings of area $2\pi r\,dr$ gives $\int dr/r=\ln(R/r_0)$ and the prefactor $Gb^2$. The edge line's extra $1/(1-\nu)$ comes from its additional normal-stress components. Since $b$ is fixed by the lattice, the shortest lattice vectors give the cheapest dislocations (3.4), and a line segment lowers its energy by shortening, which is the origin of its line tension and of the bowing in 3.7.`,
      caption: String.raw`Left: energy per atomic length against the outer radius (log axis) for edge and screw, with copper-like $G$ and $b$ (adjustable). Right: the Burgers vector $\mathbf b_1$ (blue) split into $\mathbf b_2$ (drag the orange handle) and $\mathbf b_3=\mathbf b_1-\mathbf b_2$: when the handle is inside the green disc (the circle on $\mathbf b_1$ as diameter) the right angle between $\mathbf b_2$ and $\mathbf b_3$ is exceeded and the pair has lower energy $\propto b_2^2+b_3^2<b_1^2$.`,
      deps: ['mat-3.3'],
      refs: ['Callister §7.3'],
      tags: ['dislocation energy', 'line tension', 'Frank rule'],
      scope: String.raw`Isotropic elasticity, a straight infinite line; the logarithm needs a core cutoff $r_0\approx b$ to $4b$ (the core's non-linear energy is not included) and an outer cutoff $R$ set by the spacing of other dislocations or the crystal size. The default $G=45$ GPa for copper agrees with a handbook value near 44.7 GPa; $b=a/\sqrt2$ with $a=0.3615$ nm.`,
      viz(v) {
        const Gs = v.slider('shear modulus $G$ (GPa)', 10, 100, 45, { step: 1 });
        const bs = v.slider('Burgers vector length $b$ (nm)', 0.2, 0.5, 0.2556, { step: 0.001 });
        const nus = v.slider('Poisson ratio $\\nu$', 0, 0.45, 0.34, { step: 0.01 });
        const Rs = v.slider('outer radius $R/r_0$', 3, 1e5, 4000, { log: true, sig: 2 });
        const E = v.stage({ x: [1, 1e5], y: [0, 12], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'outer radius  $R/r_0$', ylabel: 'energy per length $b$ (eV)', title: 'energy of a straight dislocation' });
        const F = v.stage({ x: [-0.55, 1.45], y: [-1.1, 1.1], equal: true, axes: false, height: 340, weight: 1, minWidth: 260, title: 'splitting b₁ into b₂ + b₃' });
        const h = F.handle(0.45, 0.45, { color: 'orange', r: 9 });
        const EVJ = 1.602176634e-19;
        const eng = (edge, Rr) => { const G = Gs.value * 1e9, b = bs.value * 1e-9, nu = nus.value; return ((G * b * b) / (4 * Math.PI * (edge ? 1 - nu : 1))) * Math.log(Rr) * b / EVJ; };
        v.render(() => {
          E.fn((x) => eng(true, x), { color: 'red', width: 2.5, domain: [1.0001, 1e5] });
          E.fn((x) => eng(false, x), { color: 'accent', width: 2.5, domain: [1.0001, 1e5] });
          const Rr = Rs.value;
          E.vline(Rr, { color: 'muted', dash: true });
          E.dot(Rr, eng(true, Rr), { r: 5, color: 'red', fill: 'red' }); E.dot(Rr, eng(false, Rr), { r: 5, color: 'accent', fill: 'accent' });
          E.text('edge', 2.2, eng(true, 2.2) + 0.9, { color: 'red', size: 12, align: 'left' }); E.text('screw', 2.2, eng(false, 2.2) - 0.9, { color: 'accent', size: 12, align: 'left' });
          // splitting panel: b1 = (1, 0)
          F.circle(0.5, 0, 0.5, { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.5, dash: true });
          F.arrow(0, 0, 1, 0, { color: 'accent', width: 3, head: 12 });
          F.arrow(0, 0, h.x, h.y, { color: 'orange', width: 3, head: 11 });
          F.arrow(h.x, h.y, 1, 0, { color: 'red', width: 3, head: 11 });
          F.tex('\\mathbf b_1', 0.5, -0.12, { color: 'accent' }); F.tex('\\mathbf b_2', h.x * 0.5 - 0.1, h.y * 0.5 + 0.1, { color: 'orange' }); F.tex('\\mathbf b_3', (1 + h.x) / 2 + 0.1, h.y / 2 + 0.1, { color: 'red' });
          F.corner('green disc: splitting lowers the energy', 'bl', { color: 'green', size: 11 });
        });
        v.readout(() => {
          const Rr = Rs.value, we = eng(true, Rr), ws = eng(false, Rr), b2 = h.x * h.x + h.y * h.y, b3 = (1 - h.x) ** 2 + h.y * h.y;
          return `At $R/r_0=${v.fmt(Rr, 3)}$: edge $W=${v.fix(we, 2)}$ eV per length $b$, screw $${v.fix(ws, 2)}$ eV (ratio $1/(1-\\nu)=${v.fix(1 / (1 - nus.value), 2)}$); $Gb^3=${v.fix((Gs.value * 1e9 * (bs.value * 1e-9) ** 3) / EVJ, 2)}$ eV.\nSplitting: $b_1^2=1$, $b_2^2+b_3^2=${v.fix(b2 + b3, 3)}$: energy changes by ${v.fix((b2 + b3 - 1) * 100, 0)} % — ${b2 + b3 < 1 ? 'favourable' : 'unfavourable'}.`;
        });
      },
    },
  ],
};
