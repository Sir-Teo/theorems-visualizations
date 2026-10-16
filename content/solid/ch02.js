// Solid Mechanics & Structures — Chapter 2: Stress and strain in three dimensions (items 2.1–2.6; 2.7–2.12 are in ch02-b.js)
//
// All pictures are computed from the definitions in the statement (no tabulated results). Stress values are in MPa and the
// geometry is schematic unless a caption says otherwise. Historical credits (Cauchy, Saint-Venant) are given from memory of the
// standard history of elasticity (see Timoshenko, History of Strength of Materials; Todhunter & Pearson), not re-checked here.

import { num, pmat, P3, D3, drawBox } from './ch02.shared.js';

export default {
  collection: 'solid',
  chapter: 2,
  title: 'Stress and strain in three dimensions',
  summary: String.raw`Inside a loaded body, the force per area on a cut depends on the orientation of the cut, and all of that information is packed into a symmetric 3×3 matrix — the stress tensor. Its divergence balances body forces, and its partner, the strain tensor, is the symmetric part of the displacement gradient. Hooke's law for isotropic materials links them with just two constants, and in two dimensions an Airy stress function solves the equations automatically.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'The Cauchy stress tensor',
      statement: String.raw`At a point of a body, take a small cube with faces normal to the axes $x,y,z$. The force per unit area that the material outside exerts on the face whose outward normal is $\mathbf e_i$ is a vector with three components, $\sigma_{ij}$ ($j=x,y,z$). The nine numbers
$$\boldsymbol\sigma=\begin{pmatrix}\sigma_{xx}&\sigma_{xy}&\sigma_{xz}\\ \sigma_{yx}&\sigma_{yy}&\sigma_{yz}\\ \sigma_{zx}&\sigma_{zy}&\sigma_{zz}\end{pmatrix}$$
form the **Cauchy stress tensor**: $\sigma_{ii}$ are normal stresses (positive in tension), $\sigma_{ij}$ with $i\ne j$ are shear stresses. The same values describe the opposite faces with all arrows reversed. The definition assumes the continuum limit (a cube small compared with the body but large compared with the microstructure).`,
      idea: String.raw`Stress on one cut (1.1, 1.6) is not enough: the force per area on a cut also depends on how the cut is oriented, so a single number cannot describe the interior. Three mutually perpendicular faces, each carrying a force vector, are enough: 2.2 shows that the force on any other cut is then a linear combination of these three. That is exactly the data of a $3\times3$ matrix, and the mathematical content of "tensor" is that its components transform in a definite way when the axes are rotated (chapter 3).`,
      caption: String.raw`Drag the six sliders (or pick a load case) and watch the arrows on the three visible faces of the cube: the right face carries the first row of $\boldsymbol\sigma$, the top face the second, the front face the third. Blue arrows are tension, red compression, orange shear. The matrix below updates live. Notice that the two shear arrows that meet at an edge always have the same size here, because you move $\sigma_{xy}=\sigma_{yx}$ together (this is 2.3).`,
      deps: ['solid-1.1', 'solid-1.6'],
      refs: ['Timoshenko–Goodier ch. 1', 'Timoshenko–Goodier ch. 7'],
      tags: ['stress', 'tensor'],
      credit: 'A.-L. Cauchy, 1820s',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cauchy_stress_tensor' },
      viz(v) {
        const Sx = v.slider('$\\sigma_{xx}$ (MPa)', -100, 100, 60, { step: 1 });
        const Sy = v.slider('$\\sigma_{yy}$', -100, 100, -30, { step: 1 });
        const Sz = v.slider('$\\sigma_{zz}$', -100, 100, 20, { step: 1 });
        const Txy = v.slider('$\\sigma_{xy}$', -100, 100, 40, { step: 1 });
        const Tyz = v.slider('$\\sigma_{yz}$', -100, 100, 0, { step: 1 });
        const Tzx = v.slider('$\\sigma_{zx}$', -100, 100, -25, { step: 1 });
        const cases = { uni: [80, 0, 0, 0, 0, 0], shear: [0, 0, 0, 70, 0, 0], hydro: [-60, -60, -60, 0, 0, 0], torsion: [0, 0, 70, 0, 50, 0], gen: [60, -30, 20, 40, 0, -25] };
        const pick = v.select('load case', [{ value: 'gen', label: 'general' }, { value: 'uni', label: 'uniaxial tension' }, { value: 'shear', label: 'pure shear' }, { value: 'hydro', label: 'hydrostatic pressure' }, { value: 'torsion', label: 'bending + torsion' }], 'gen', {
          onChange: (c) => { const q = cases[c]; [Sx, Sy, Sz, Txy, Tyz, Tzx].forEach((sl, i) => sl.set(q[i])); },
        });
        const S = v.stage({ x: [-3.0, 3.0], y: [-1.95, 2.05], equal: true, axes: false, height: 360, full: true, title: 'a cube cut from the body: the three visible faces carry the rows of σ' });
        const h = 0.95, k = 0.0115;
        v.render(() => {
          drawBox(v, S, [h, h, h], [-0.3, 0], { fill: 'gray', alpha: 0.12 });
          const M = [[Sx.value, Txy.value, Tzx.value], [Txy.value, Sy.value, Tyz.value], [Tzx.value, Tyz.value, Sz.value]];
          const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], nm = ['x', 'y', 'z'], o = [-0.3, 0];
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              const q = M[i][j];
              if (Math.abs(q) < 2) continue;
              const d = axes[j], fc = axes[i].map((a) => a * h);
              // shear arrows sit on the face, shifted along the face's third axis so they do not hide the normal arrow
              let c0 = fc;
              if (i !== j) { const m = 3 - i - j, sh = (m === 2 ? -0.45 : 0.45) * h; c0 = fc.map((c, t) => c + (t === m ? sh : 0)); }
              let tail, tip;
              const kk = j === 2 ? 2.2 * k : k;
              if (i === j) { tail = q >= 0 ? c0 : c0.map((c, m) => c - kk * q * d[m]); tip = tail.map((c, m) => c + kk * q * d[m]); }
              else { tail = c0.map((c, m) => c - 0.5 * kk * q * d[m]); tip = c0.map((c, m) => c + 0.5 * kk * q * d[m]); }
              const A = P3(tail, o), B = P3(tip, o), col = i === j ? (q >= 0 ? 'accent' : 'red') : 'orange';
              S.arrow(A[0], A[1], B[0], B[1], { color: col, width: 3, head: 10 });
              const dv = D3(d), L = Math.hypot(dv[0], dv[1]) || 1;
              const outer = i === j ? (q >= 0 ? B : A) : (q >= 0 ? B : A), sg = i === j ? 1 : (q >= 0 ? 1 : -1);
              const off = Math.abs(dv[0]) > Math.abs(dv[1]) ? 0.5 : 0.32, ex = i !== j && j === 2 ? 0.28 : 0;
              S.tex(String.raw`\sigma_{${nm[i]}${nm[j]}}`, outer[0] + sg * (dv[0] / L) * off + ex, outer[1] + sg * (dv[1] / L) * off + (i !== j ? 0.04 : 0) - (ex ? 0.12 : 0), { size: 13, color: col });
            }
          }
          S.arrow(1.7, -1.5, 2.45, -1.5, { color: 'muted', width: 1.4, head: 7 }); S.text('x', 2.62, -1.5, { size: 12, color: 'muted', math: true, align: 'center' });
          S.arrow(1.7, -1.5, 1.7, -0.8, { color: 'muted', width: 1.4, head: 7 }); S.text('y', 1.7, -0.62, { size: 12, color: 'muted', math: true, align: 'center' });
          S.arrow(1.7, -1.5, 1.7 - 0.36 * 0.8, -1.5 - 0.27 * 0.8, { color: 'muted', width: 1.4, head: 7 }); S.text('z', 1.7 - 0.36 * 0.8 - 0.14, -1.5 - 0.27 * 0.8 - 0.12, { size: 12, color: 'muted', math: true, align: 'center' });
        });
        v.readout(() => {
          const M = [[Sx.value, Txy.value, Tzx.value], [Txy.value, Sy.value, Tyz.value], [Tzx.value, Tyz.value, Sz.value]];
          const tr = M[0][0] + M[1][1] + M[2][2];
          return `$\\boldsymbol\\sigma=${pmat(M, (x) => String(Math.round(x)))}\\ \\text{MPa}$ \n Row 1 is the force per area on the **right** face, row 2 on the **top** face, row 3 on the **front** face. · Mean normal stress $\\tfrac13\\mathrm{tr}\\,\\boldsymbol\\sigma=${num(tr / 3, 1)}$ MPa · nine numbers, but only six independent ones.${pick.value === 'hydro' ? ' · Hydrostatic: no shear on any face.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Cauchy’s stress theorem: traction t = σn',
      statement: String.raw`Let the stress at a point be $\boldsymbol\sigma$ (continuous in the neighbourhood). The traction vector $\mathbf t$, the force per unit area exerted across a small plane through the point with unit normal $\mathbf n$ (pointing out of the side that is being acted on), is
$$\mathbf t(\mathbf n)=\boldsymbol\sigma\,\mathbf n,\qquad t_i=\sum_j \sigma_{ij}n_j .$$
It is linear in $\mathbf n$: the normal stress on the plane is $\sigma_n=\mathbf n\!\cdot\!\boldsymbol\sigma\mathbf n$ and the shear stress is $\tau=\lvert\mathbf t-\sigma_n\mathbf n\rvert$, with $\lvert\mathbf t\rvert^2=\sigma_n^2+\tau^2$. As $\mathbf n$ turns through a circle, the tip of $\mathbf t$ traces an ellipse (in 3D, the ellipsoid of Lamé).`,
      idea: String.raw`Cut a tiny tetrahedron (in 2D, a wedge) from the body with three faces along the coordinate planes and one inclined face of normal $\mathbf n$. Its volume shrinks as the cube of its size and its faces as the square, so body forces and inertia drop out, and the force balance reduces to a balance of surface forces. The faces along the axes have areas $n_jA$ and carry the tractions given by the entries of $\boldsymbol\sigma$ (2.1); the inclined face must carry the rest, which is $\boldsymbol\sigma\mathbf n$. The three forces form a closed triangle, which is exactly what the third panel draws.`,
      caption: String.raw`Drag the handle on the circle to rotate the cut. Left: the free-body wedge with its three face forces; middle: the traction $\mathbf t$ (accent), split into its normal part (green) and shear part (orange), and the ellipse traced by $\mathbf t$ as the cut turns; right: the three face forces placed head to tail close up into a triangle for every orientation. Change $\sigma_x,\sigma_y,\tau_{xy}$ and watch the ellipse change. Planar (2D) stress is shown; in 3D the wedge is a tetrahedron.`,
      deps: ['solid-2.1'],
      refs: ['Timoshenko–Goodier ch. 7'],
      tags: ['stress', 'traction'],
      credit: 'A.-L. Cauchy, 1820s',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cauchy_stress_tensor#Cauchy’s_stress_theorem—stress_tensor' },
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 70, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, -20, { step: 1 });
        const tx = v.slider('$\\tau_{xy}$', -100, 100, 40, { step: 1 });
        const A = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 340, title: 'free-body wedge' });
        const B = v.stage({ x: [-130, 130], y: [-130, 130], equal: true, axes: true, height: 340, title: 'traction t = σn', xlabel: 'tx', ylabel: 'ty' });
        const C = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 340, title: 'forces close a triangle' });
        const R = 2.5;
        const H = A.handle(R * Math.cos(0.6), R * Math.sin(0.6), { color: 'accent', r: 8, label: 'n', labelPos: 'ne', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(R * x) / r, (R * y) / r]; } });
        const st = () => {
          const th = Math.atan2(H.y, H.x), c = Math.cos(th), s = Math.sin(th);
          const S = [[sx.value, tx.value], [tx.value, sy.value]];
          const t = [S[0][0] * c + S[0][1] * s, S[1][0] * c + S[1][1] * s];
          const sn = t[0] * c + t[1] * s, ts = [t[0] - sn * c, t[1] - sn * s];
          const Fa = [-c * S[0][0] - 0 + -c * 0, 0], Fx = [-c * S[0][0], -c * S[1][0]], Fy = [-s * S[0][1], -s * S[1][1]]; void Fa;
          return { th, c, s, t, sn, ts, Fx, Fy, Fh: t };
        };
        v.render(() => {
          const { c, s, t, sn, ts, Fx, Fy, Fh } = st();
          const L = 2.5, sg = (z) => (z < 0 ? -1 : 1);
          const O = [-(sg(c) * Math.abs(s) * L) / 2, -(sg(s) * Math.abs(c) * L) / 2];
          const E1 = [O[0] + sg(c) * Math.abs(s) * L, O[1]], E2 = [O[0], O[1] + sg(s) * Math.abs(c) * L];
          A.path([O, E1, E2], { close: true, color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.13 });
          const kf = 0.0145, fl = (F, p, col, lab) => { A.arrow(p[0], p[1], p[0] + kf * F[0] * 1, p[1] + kf * F[1], { color: col, width: 3, head: 10 }); if (lab) A.tex(lab, p[0] + kf * F[0] + 0.1 * Math.sign(F[0] || 1), p[1] + kf * F[1] + 0.12 * Math.sign(F[1] || 1), { size: 12, color: col }); };
          const mx = [(O[0] + E2[0]) / 2, (O[1] + E2[1]) / 2], my = [(O[0] + E1[0]) / 2, (O[1] + E1[1]) / 2], mh = [(E1[0] + E2[0]) / 2, (E1[1] + E2[1]) / 2];
          fl(Fx, mx, 'purple', String.raw`\mathbf F_x`); fl(Fy, my, 'teal', String.raw`\mathbf F_y`); fl(Fh, mh, 'accent', String.raw`\mathbf F_n`);
          A.arrow(mh[0], mh[1], mh[0] + 0.55 * c, mh[1] + 0.55 * s, { color: 'muted', width: 1.6, head: 7 });
          A.text('n', mh[0] + 0.7 * c, mh[1] + 0.7 * s, { size: 12, color: 'muted', math: true, align: 'center' });
          A.line(0, 0, H.x, H.y, { color: 'faint', width: 1, dash: [4, 4] });
          A.circle(0, 0, R, { color: 'faint', width: 1, dash: [3, 5], fill: false });
          // traction plane
          const loc = [];
          for (let i = 0; i <= 120; i++) { const a = (2 * Math.PI * i) / 120, cc = Math.cos(a), ss = Math.sin(a); loc.push([sx.value * cc + tx.value * ss, tx.value * cc + sy.value * ss]); }
          B.path(loc, { color: 'faint', width: 2 });
          B.line(0, 0, 110 * c, 110 * s, { color: 'muted', width: 1, dash: [4, 4] });
          B.arrow(0, 0, sn * c, sn * s, { color: 'green', width: 3, head: 8 });
          B.arrow(sn * c, sn * s, t[0], t[1], { color: 'orange', width: 3, head: 8 });
          B.arrow(0, 0, t[0], t[1], { color: 'accent', width: 2.2, head: 9 });
          B.tex(String.raw`\mathbf t`, t[0] * 1.08 + 7, t[1] * 1.08 + 7, { size: 14, color: 'accent' });
          // force polygon
          const p0 = [0, 0], p1 = [Fx[0], Fx[1]], p2 = [Fx[0] + Fy[0], Fx[1] + Fy[1]], p3 = [p2[0] + Fh[0], p2[1] + Fh[1]];
          const sc = 0.03, X = (p) => [p[0] * sc, p[1] * sc];
          const q0 = X(p0), q1 = X(p1), q2 = X(p2), q3 = X(p3);
          const ctr = [(q0[0] + q1[0] + q2[0]) / 3, (q0[1] + q1[1] + q2[1]) / 3];
          const sh = (q) => [q[0] - ctr[0], q[1] - ctr[1]];
          const a0 = sh(q0), a1 = sh(q1), a2 = sh(q2), a3 = sh(q3);
          C.path([a0, a1, a2], { fill: 'faint', fillAlpha: 0.12, color: 'faint', width: 0 });
          C.arrow(a0[0], a0[1], a1[0], a1[1], { color: 'purple', width: 3, head: 9 });
          C.arrow(a1[0], a1[1], a2[0], a2[1], { color: 'teal', width: 3, head: 9 });
          C.arrow(a2[0], a2[1], a3[0], a3[1], { color: 'accent', width: 3, head: 9 });
          C.dot(a0[0], a0[1], { r: 4, color: 'ink' });
          C.tex(String.raw`\mathbf F_x+\mathbf F_y+\mathbf F_n=\mathbf 0`, 0, -2.65, { size: 13, color: 'muted' });
        });
        v.readout(() => {
          const { th, t, sn, ts, Fx, Fy, Fh } = st();
          const tau = Math.hypot(ts[0], ts[1]), res = Math.hypot(Fx[0] + Fy[0] + Fh[0], Fx[1] + Fy[1] + Fh[1]);
          return `$\\theta=${num((th * 180) / Math.PI, 0)}^\\circ$, $\\mathbf n=(${num(Math.cos(th), 2)},\\,${num(Math.sin(th), 2)})$ → $\\mathbf t=\\boldsymbol\\sigma\\mathbf n=(${num(t[0], 1)},\\,${num(t[1], 1)})$ MPa. · $\\sigma_n=${num(sn, 1)}$ MPa, $\\tau=${num(tau, 1)}$ MPa, and $\\sigma_n^2+\\tau^2=${num(sn * sn + tau * tau, 0)}=\\lvert\\mathbf t\\rvert^2=${num(t[0] * t[0] + t[1] * t[1], 0)}$. · Wedge force imbalance $\\lvert\\mathbf F_x+\\mathbf F_y+\\mathbf F_n\\rvert=${num(res, 6)}$ (zero for every $\\mathbf n$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Symmetry of the stress tensor',
      statement: String.raw`If a body is in equilibrium (or accelerates with finite angular acceleration) and there are no distributed body couples, then at every interior point the shear stresses on perpendicular faces are equal:
$$\sigma_{xy}=\sigma_{yx},\qquad \sigma_{yz}=\sigma_{zy},\qquad \sigma_{zx}=\sigma_{xz},$$
that is, $\boldsymbol\sigma=\boldsymbol\sigma^{\mathsf T}$. This is the balance of angular momentum for the material element, and it leaves six independent components. (Materials that carry body couples or couple stresses, such as some polar or micropolar models, are outside the statement.)`,
      idea: String.raw`Take moments about the centre of a small element of side $h$ (and thickness 1). The unequal shear forces on its faces give a net torque $(\sigma_{xy}-\sigma_{yx})h^2$, while its moment of inertia is $\rho h^4/6$ (the mass is $\rho h^2$ and the polar radius of gyration squared is $h^2/6$). The angular acceleration is therefore $6(\sigma_{xy}-\sigma_{yx})/(\rho h^2)$, which grows without limit as $h\to0$. For the angular acceleration to stay finite at a point, the difference must be zero. This is the continuum analogue of mech-2.9, balance of torque.`,
      caption: String.raw`The small square is released with the shear stresses you set on its faces (the arrows and the marked line turn with it). Make $\sigma_{xy}\neq\sigma_{yx}$ and the animation shows it spinning up to $90^\circ$ in the time $T$ printed in the readout; shrink the size $h$ and $T$ collapses (right plot, log-log: $\alpha\propto h^{-2}$). Press "make equal" and the spinning stops, for every size. Material density is that of steel.`,
      deps: ['solid-2.1', 'mech-2.9'],
      refs: ['Timoshenko–Goodier ch. 1'],
      tags: ['stress', 'angular momentum'],
      credit: 'A.-L. Cauchy, 1820s',
      viz(v) {
        const a = v.slider('$\\sigma_{xy}$ (MPa)', 0, 100, 60, { step: 1 });
        const b = v.slider('$\\sigma_{yx}$ (MPa)', 0, 100, 40, { step: 1 });
        const hh = v.slider('element size $h$ (mm)', 0.01, 100, 1, { log: true });
        v.button('make them equal', () => { b.set(a.value); });
        const rho = 7850;
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, axes: false, height: 340, title: 'a small square element, side h' });
        const G = v.stage({ x: [0.01, 100], y: [1e3, 1e16], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'element size h (mm)', ylabel: 'angular acceleration α (rad/s²)', title: 'α = 6(σxy − σyx) / (ρh²)' });
        const alpha = (d, h) => (6 * d * 1e6) / (rho * (h * 1e-3) ** 2);
        const info = () => { const d = a.value - b.value, al = alpha(Math.abs(d), hh.value), T = al > 0 ? Math.sqrt(Math.PI / al) : Infinity; return { d, al, T }; };
        v.animate((t) => {
          const { d, T } = info(), ph = Math.min(1, t / 2.6), th = d === 0 ? 0 : Math.sign(d) * (Math.PI / 2) * ph * ph;
          const cs = Math.cos(th), sn = Math.sin(th), R = ([x, y]) => [x * cs - y * sn, x * sn + y * cs];
          const sq = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(R);
          S.path(sq, { close: true, color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.14 });
          const k = 0.012;
          const arr = (p, dir, q, col) => { if (q < 1) return; const A = R([p[0] - (dir[0] * k * q) / 2, p[1] - (dir[1] * k * q) / 2]), B = R([p[0] + (dir[0] * k * q) / 2, p[1] + (dir[1] * k * q) / 2]); S.arrow(A[0], A[1], B[0], B[1], { color: col, width: 3.2, head: 10 }); };
          arr([1.28, 0], [0, 1], a.value, 'orange'); arr([-1.28, 0], [0, -1], a.value, 'orange');
          arr([0, 1.28], [-1, 0], b.value, 'purple'); arr([0, -1.28], [1, 0], b.value, 'purple');
          const lx = R([2.0, 0.0]), ly = R([0.0, 1.95]);
          S.tex(String.raw`\sigma_{xy}`, lx[0], lx[1], { size: 13, color: 'orange' });
          S.tex(String.raw`\sigma_{yx}`, ly[0], ly[1], { size: 13, color: 'purple' });
          const m0 = R([0.9, 0]); S.line(0, 0, m0[0], m0[1], { color: 'ink', width: 2 }); S.dot(m0[0], m0[1], { r: 5, color: 'ink' });
          if (d !== 0) {
            const aa = []; for (let i = 0; i <= 24; i++) { const q = (-0.4 + 0.8 * i / 24) * Math.sign(d) * 2.2 + (d > 0 ? 0 : 0); aa.push([0.55 * Math.cos(q), 0.55 * Math.sin(q)]); }
            S.path(aa, { color: 'red', width: 2, alpha: 0.9 });
          }
          S.text(d === 0 ? 'balanced: no torque' : `t = ${v.M.si(ph * T, 's', 3)}  (turned ${num((th * 180) / Math.PI, 0)}°)`, 0, -1.85, { size: 12.5, weight: 600, color: d === 0 ? 'green' : 'red', align: 'center' });
          // log-log plot
          if (Math.abs(d) > 0) { G.fn((h) => alpha(Math.abs(d), h), { color: 'accent', width: 2.4, n: 80 }); G.dot(hh.value, alpha(Math.abs(d), hh.value), { r: 6, color: 'orange' }); }
          else { G.text('σxy = σyx: α = 0 for every h', 1, 1e8, { size: 13, color: 'green' }); }
        }, { period: 3.6, still: 3.4 });
        v.readout(() => {
          const { d, al, T } = info();
          return d === 0 ? `$\\sigma_{xy}=\\sigma_{yx}$: the torque $(\\sigma_{xy}-\\sigma_{yx})h^2$ vanishes, so the element does not spin at **any** size.`
            : `Net torque $(\\sigma_{xy}-\\sigma_{yx})h^2$ with $\\sigma_{xy}-\\sigma_{yx}=${num(d, 0)}$ MPa → $\\alpha=${v.sci(al, 3)}\\ \\text{rad/s}^2$; it turns $90^\\circ$ in $T=${v.M.si(T, 's', 3)}$. Halve $h$ and $\\alpha$ grows four-fold: only an exactly equal pair keeps $\\alpha$ finite as $h\\to0$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Equilibrium equations: div σ + b = 0',
      statement: String.raw`Let $\boldsymbol\sigma$ be a $C^1$ stress field in a body in static equilibrium under body force $\mathbf b$ per unit volume. Then at every point
$$\sum_j \frac{\partial\sigma_{ij}}{\partial x_j}+b_i=0\quad(i=1,2,3),\qquad\text{i.e.}\quad \nabla\!\cdot\!\boldsymbol\sigma+\mathbf b=\mathbf 0 .$$
Equivalently, for every sub-region $\Omega$ with boundary $\partial\Omega$ and outward normal $\mathbf n$, $\oint_{\partial\Omega}\boldsymbol\sigma\mathbf n\,\mathrm dS+\int_\Omega\mathbf b\,\mathrm dV=\mathbf 0$. With $\boldsymbol\sigma=\boldsymbol\sigma^{\mathsf T}$ (2.3) this, together with symmetry, is all that equilibrium asks. In dynamics $\mathbf 0$ is replaced by $\rho\ddot{\mathbf u}$.`,
      idea: String.raw`Newton's law for the material inside any region: the total force is the traction on its surface, $\oint\boldsymbol\sigma\mathbf n\,\mathrm dS$ by Cauchy's theorem (2.2), plus the body force. The divergence theorem turns the surface integral into $\int_\Omega\nabla\!\cdot\!\boldsymbol\sigma\,\mathrm dV$, so $\int_\Omega(\nabla\!\cdot\!\boldsymbol\sigma+\mathbf b)\,\mathrm dV=0$ for every region. A continuous integrand whose integral vanishes over every region must itself vanish.`,
      caption: String.raw`A plate carries a smooth stress field $\boldsymbol\sigma(x,y)$ (colour: mean stress); the body force $\mathbf b=-\nabla\!\cdot\!\boldsymbol\sigma$ is what equilibrium demands. Drag the circle (centre handle) and resize it (right-hand handle): the arrows are the tractions $\boldsymbol\sigma\mathbf n$ on its boundary. The right panel adds the resultant of those tractions (blue) to the body force inside (orange): they cancel for **every** region. Use the slider to put in a wrong body force and watch a net force (red) appear.`,
      deps: ['solid-2.2', 'pma-10.51', 'vcalc-8.3'],
      refs: ['Timoshenko–Goodier ch. 7'],
      tags: ['equilibrium', 'divergence theorem'],
      credit: 'A.-L. Cauchy, 1820s',
      viz(v) {
        const err = v.slider('error in the body force (%)', -60, 60, 0, { step: 1 });
        const A = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 400, title: 'a plate with a smooth stress field; a movable circular region' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: true, height: 400, title: 'force balance on the region (resultants)' });
        const sxx = (x, y) => 30 + 12 * x - 10 * y * y + 8 * x * y;
        const syy = (x, y) => -20 + 6 * x * x + 10 * y + 5 * x * y;
        const txy = (x, y) => 5 + 7 * x * y - 6 * x * x;
        const e = 1e-4;
        const bx = (x, y) => -((sxx(x + e, y) - sxx(x - e, y)) / (2 * e) + (txy(x, y + e) - txy(x, y - e)) / (2 * e));
        const by = (x, y) => -((txy(x + e, y) - txy(x - e, y)) / (2 * e) + (syy(x, y + e) - syy(x, y - e)) / (2 * e));
        const C = A.handle(0.2, -0.1, { color: 'accent', r: 8, label: 'centre', labelPos: 'n', constrain: { x: [-1.1, 1.1], y: [-1.1, 1.1] } });
        let r = 0.95;
        const RH = A.handle(C.x + r, C.y, { color: 'orange', r: 8, label: 'r', labelPos: 'e', constrain: (x, y) => [Math.max(C.x + 0.25, Math.min(C.x + 1.0, x)), C.y] });
        C.onDrag = () => { RH.set(C.x + r, C.y); };
        RH.onDrag = () => { r = Math.max(0.25, Math.min(1.0, RH.x - C.x)); };
        const calc = () => {
          const N = 180; let Fx = 0, Fy = 0;
          for (let i = 0; i < N; i++) {
            const p = (2 * Math.PI * (i + 0.5)) / N, c = Math.cos(p), s = Math.sin(p), x = C.x + r * c, y = C.y + r * s, ds = (2 * Math.PI * r) / N;
            Fx += (sxx(x, y) * c + txy(x, y) * s) * ds; Fy += (txy(x, y) * c + syy(x, y) * s) * ds;
          }
          let Bx = 0, By = 0; const nr = 24, nt = 96;
          for (let i = 0; i < nr; i++) for (let j = 0; j < nt; j++) {
            const rr = ((i + 0.5) / nr) * r, p = (2 * Math.PI * (j + 0.5)) / nt, x = C.x + rr * Math.cos(p), y = C.y + rr * Math.sin(p), dA = rr * (r / nr) * ((2 * Math.PI) / nt);
            Bx += bx(x, y) * dA; By += by(x, y) * dA;
          }
          const k = 1 + err.value / 100;
          return { Ft: [Fx, Fy], Fb: [Bx * k, By * k] };
        };
        v.render(() => {
          RH.set(C.x + r, C.y);
          A.heat((x, y) => (sxx(x, y) + syy(x, y)) / 2, { cmap: 'theme-diverging', range: [-60, 60], res: 4, key: 'bg24' });
          A.circle(C.x, C.y, r, { color: 'ink', width: 2.2, fill: 'panel', fillAlpha: 0.3 });
          for (let i = 0; i < 24; i++) {
            const p = (2 * Math.PI * i) / 24, c = Math.cos(p), s = Math.sin(p), x = C.x + r * c, y = C.y + r * s;
            const t = [sxx(x, y) * c + txy(x, y) * s, txy(x, y) * c + syy(x, y) * s], k = 0.0105;
            A.arrow(x, y, x + k * t[0], y + k * t[1], { color: 'accent', width: 2.2, head: 7 });
          }
          const bc = [bx(C.x, C.y) * (1 + err.value / 100), by(C.x, C.y) * (1 + err.value / 100)];
          A.arrow(C.x - 0.0, C.y, C.x + 0.018 * bc[0], C.y + 0.018 * bc[1], { color: 'orange', width: 4, head: 11 });
          A.tex(String.raw`\mathbf b`, C.x + 0.018 * bc[0] + 0.12, C.y + 0.018 * bc[1] + 0.12, { size: 14, color: 'orange' });
          const { Ft, Fb } = calc(), net = [Ft[0] + Fb[0], Ft[1] + Fb[1]];
          const m = Math.max(30, 1.3 * Math.max(Math.hypot(...Ft), Math.hypot(...Fb), Math.hypot(...net)));
          B.setView([-m, m], [-m, m]);
          B.arrow(0, 0, Ft[0], Ft[1], { color: 'accent', width: 3, head: 10 });
          B.arrow(Ft[0], Ft[1], Ft[0] + Fb[0], Ft[1] + Fb[1], { color: 'orange', width: 3, head: 10 });
          if (Math.hypot(...net) > 0.02 * m) B.arrow(0, 0, net[0], net[1], { color: 'red', width: 3, head: 10, dash: true });
          B.dot(0, 0, { r: 4, color: 'ink' });
          B.text('∮ σn dS', Ft[0] / 2, Ft[1] / 2, { color: 'accent', size: 12, dy: -12, align: 'center' });
          B.text('∫ b dV', Ft[0] + Fb[0] / 2, Ft[1] + Fb[1] / 2, { color: 'orange', size: 12, dy: 14, align: 'center' });
        });
        v.readout(() => {
          const { Ft, Fb } = calc(), net = Math.hypot(Ft[0] + Fb[0], Ft[1] + Fb[1]);
          return `$\\oint\\boldsymbol\\sigma\\mathbf n\\,\\mathrm dS=(${num(Ft[0], 2)},\\,${num(Ft[1], 2)})$ and $\\int\\mathbf b\\,\\mathrm dV=(${num(Fb[0], 2)},\\,${num(Fb[1], 2)})$ (per unit thickness) → residual $=${num(net, 4)}$${Math.abs(err.value) < 0.5 ? ' (zero up to quadrature error, for every circle)' : ': the wrong body force breaks equilibrium'}. Here $\\mathbf b=-\\nabla\\!\\cdot\\!\\boldsymbol\\sigma=(${num(bx(C.x, C.y), 1)},\\,${num(by(C.x, C.y), 1)})$ at the centre.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'The infinitesimal strain tensor',
      statement: String.raw`Let $\mathbf u(\mathbf x)$ be the displacement field of a body. The **infinitesimal strain tensor** is the symmetric part of the displacement gradient,
$$\varepsilon_{ij}=\tfrac12\big(u_{i,j}+u_{j,i}\big),$$
while the antisymmetric part $\omega_{ij}=\tfrac12(u_{i,j}-u_{j,i})$ is an infinitesimal rotation. Diagonal entries are the stretches per unit length along the axes; the off-diagonal entry $\varepsilon_{xy}$ is half the **engineering shear strain** $\gamma_{xy}=u_{x,y}+u_{y,x}$, the decrease of the right angle between two material lines initially along $x$ and $y$. The definition is meaningful when $\lvert u_{i,j}\rvert\ll1$ (small strains and small rotations).`,
      idea: String.raw`Near a point the displacement is, to first order, $\mathbf u(\mathbf x+\mathrm d\mathbf x)=\mathbf u(\mathbf x)+\nabla\mathbf u\,\mathrm d\mathbf x$, so only the gradient matrix can describe how the neighbourhood is deformed (the first term is a rigid translation). Every square matrix splits uniquely into symmetric and antisymmetric parts. The antisymmetric part rotates the neighbourhood as a rigid body and changes no lengths or angles to first order, so what the material "feels" is the symmetric part; this generalises the one-dimensional $\varepsilon=\mathrm du/\mathrm dx$ of 1.2.`,
      caption: String.raw`Choose a load case or set the four gradient entries $u_{i,j}$ (exaggerated, so strains of 10–40 % show). Left: the whole deformation of a grid and of a unit circle. Middle: only the symmetric part (the strain tensor) – stretches and shears. Right: only the antisymmetric part – a rotation by $\omega$. Rotation-only is a *pure rotation* only to first order: make $\omega$ large and you see lengths change by about $\omega^2/2$, the limit of the infinitesimal theory.`,
      deps: ['solid-1.2', 'pma-9.17'],
      refs: ['Timoshenko–Goodier ch. 1', 'Timoshenko–Goodier ch. 7'],
      tags: ['strain', 'displacement'],
      credit: 'A.-L. Cauchy, 1820s',
      viz(v) {
        const g11 = v.slider('$u_{x,x}$', -0.4, 0.4, 0.15, { step: 0.01 });
        const g12 = v.slider('$u_{x,y}$', -0.4, 0.4, 0.2, { step: 0.01 });
        const g21 = v.slider('$u_{y,x}$', -0.4, 0.4, -0.1, { step: 0.01 });
        const g22 = v.slider('$u_{y,y}$', -0.4, 0.4, -0.05, { step: 0.01 });
        const presets = { gen: [0.15, 0.2, -0.1, -0.05], str: [0.3, 0, 0, -0.1], psh: [0, 0.25, 0.25, 0], ssh: [0, 0.4, 0, 0], rot: [0, -0.25, 0.25, 0] };
        v.select('load case', [{ value: 'gen', label: 'general' }, { value: 'str', label: 'stretch' }, { value: 'psh', label: 'pure shear' }, { value: 'ssh', label: 'simple shear' }, { value: 'rot', label: 'rotation' }], 'gen', {
          onChange: (c) => { const q = presets[c]; [g11, g12, g21, g22].forEach((sl, i) => sl.set(q[i])); },
        });
        const mk = (title) => v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 300, title });
        const A = mk('displacement gradient (all of it)'), B = mk('symmetric part: strain ε'), C = mk('antisymmetric part: rotation ω');
        const draw = (S, G, col) => {
          const f = ([x, y]) => [x + G[0][0] * x + G[0][1] * y, y + G[1][0] * x + G[1][1] * y];
          for (let i = -4; i <= 4; i++) {
            const t = i / 4, lw = i === -4 || i === 4 ? 1.2 : 0.6;
            S.path([[-1, t], [1, t]].map(f), { color: 'muted', width: 0.9, alpha: 0.3 }); S.path([[t, -1], [t, 1]].map(f), { color: 'muted', width: 0.9, alpha: 0.3 }); void lw;
          }
          S.path([[-1, -1], [1, -1], [1, 1], [-1, 1]], { close: true, color: 'faint', width: 1.4, dash: [5, 4] });
          S.curve((p) => [Math.cos(p), Math.sin(p)], 0, 2 * Math.PI, { n: 60, color: 'faint', width: 1.2, dash: [4, 4] });
          S.path([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(f), { close: true, color: col, width: 2.6, fill: col, fillAlpha: 0.12 });
          S.curve((p) => f([Math.cos(p), Math.sin(p)]), 0, 2 * Math.PI, { n: 90, color: col, width: 2 });
        };
        const parts = () => {
          const a = g11.value, b = g12.value, c = g21.value, d = g22.value, e = (b + c) / 2, w = (c - b) / 2;
          return { G: [[a, b], [c, d]], E: [[a, e], [e, d]], W: [[0, -w], [w, 0]], e, w };
        };
        v.render(() => {
          const { G, E, W } = parts();
          draw(A, G, 'accent'); draw(B, E, 'orange'); draw(C, W, 'green');
        });
        v.readout(() => {
          const { E, e, w } = parts();
          return `$\\boldsymbol\\varepsilon=${pmat(E, (x) => num(x, 3))}$, $\\gamma_{xy}=2\\varepsilon_{xy}=${num(2 * e, 3)}$, rotation $\\omega=\\tfrac12(u_{y,x}-u_{x,y})=${num(w, 3)}$ rad $=${num((w * 180) / Math.PI, 1)}^\\circ$. · Nine numbers $\\nabla\\mathbf u$ = six of strain + three of rotation (one is shown in 2D); the dotted square and circle are the undeformed shapes.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Saint-Venant compatibility conditions',
      statement: String.raw`Let $\varepsilon_{ij}(\mathbf x)$ be a $C^2$ symmetric tensor field on a simply connected region. There is a displacement field $\mathbf u$ with $\varepsilon_{ij}=\tfrac12(u_{i,j}+u_{j,i})$ **if and only if** the compatibility conditions hold,
$$\varepsilon_{ij,kl}+\varepsilon_{kl,ij}-\varepsilon_{ik,jl}-\varepsilon_{jl,ik}=0 .$$
In the plane they reduce to one equation,
$$\frac{\partial^2\varepsilon_{xx}}{\partial y^2}+\frac{\partial^2\varepsilon_{yy}}{\partial x^2}=\frac{\partial^2\gamma_{xy}}{\partial x\,\partial y}.$$
(In a region with holes the conditions are necessary but not sufficient: the displacement may fail to be single-valued.)`,
      idea: String.raw`Necessity is differentiation: write the strains as derivatives of $u,v$ and the mixed partials cancel. For sufficiency, build $\mathbf u$ by integrating the gradient along a path from a base point. The strains give the symmetric part of $\nabla\mathbf u$, and the rotation $\omega$ is determined, up to a constant, by $\omega_{,x}=\varepsilon_{xy,x}-\varepsilon_{xx,y}$ and $\omega_{,y}=\varepsilon_{yy,x}-\varepsilon_{xy,y}$; these can be integrated exactly when the cross-derivatives agree, which is the compatibility equation. Then the result does not depend on the path (an application of the Poincaré lemma, pma-10 style), and $\mathbf u$ exists.`,
      caption: String.raw`Prescribe the strain field $\varepsilon_{xx}=a y^2$, $\varepsilon_{yy}=b x^2$, $\gamma_{xy}=c\,xy$ (times a small factor) on the unit square, and let a displacement be reconstructed by integrating the strains from the lower-left corner along two different routes: right then up (blue grid), up then right (red grid). The residual $R=2a+2b-c$ is the compatibility defect. When $R=0$ the grids coincide; otherwise the red and blue tiles disagree, opening gaps and overlaps that grow towards the far corner, which is the gap vector shown.`,
      deps: ['solid-2.5'],
      refs: ['Timoshenko–Goodier ch. 2'],
      tags: ['strain', 'compatibility'],
      credit: 'A.-J.-C. Barré de Saint-Venant, 1860s',
      viz(v) {
        const sa = v.slider('$a$  ($\\varepsilon_{xx}\\propto y^2$)', -1, 1, 0.6, { step: 0.05 });
        const sb = v.slider('$b$  ($\\varepsilon_{yy}\\propto x^2$)', -1, 1, 0.6, { step: 0.05 });
        const sc = v.slider('$c$  ($\\gamma_{xy}\\propto xy$)', -2, 2, 0, { step: 0.05 });
        const amp = v.slider('display exaggeration', 1, 8, 4, { step: 0.5 });
        v.select('example', [{ value: 'bad', label: 'incompatible' }, { value: 'ok1', label: 'compatible: b = −a' }, { value: 'ok2', label: 'compatible: c = 2a + 2b' }], 'bad', {
          onChange: (k) => { const q = { bad: [0.6, 0.6, 0], ok1: [0.6, -0.6, 0], ok2: [0.4, 0.5, 1.8] }[k]; sa.set(q[0]); sb.set(q[1]); sc.set(q[2]); },
        });
        const S = v.stage({ x: [-0.3, 1.45], y: [-0.3, 1.45], equal: true, axes: false, height: 420, full: true, title: 'rebuilding the body from its strains along two routes' });
        const kap = 0.08;
        const F = () => { const a = sa.value, b = sb.value, c = sc.value; return {
          exx: (x, y) => kap * a * y * y, eyy: (x, y) => kap * b * x * x, exy: (x, y) => (kap * c * x * y) / 2,
          wx: (x, y) => kap * ((c * y) / 2 - 2 * a * y), wy: (x, y) => kap * (2 * b * x - (c * x) / 2) }; };
        const disp = (f, order, X, Y) => {
          let u = 0, w = 0, om = 0, x = 0, y = 0; const n = 12;
          const legs = order === 'xy' ? [['x', X], ['y', Y]] : [['y', Y], ['x', X]];
          for (const [ax, len] of legs) {
            const d = len / n;
            for (let k = 0; k < n; k++) {
              if (ax === 'x') { const xm = x + d / 2, om2 = om + 0.5 * d * f.wx(xm, y); u += f.exx(xm, y) * d; w += (f.exy(xm, y) + om2) * d; om += d * f.wx(xm, y); x += d; }
              else { const ym = y + d / 2, om2 = om + 0.5 * d * f.wy(x, ym); u += (f.exy(x, ym) - om2) * d; w += f.eyy(x, ym) * d; om += d * f.wy(x, ym); y += d; }
            }
          }
          return [u, w];
        };
        const gap = () => { const f = F(), p = disp(f, 'xy', 1, 1), q = disp(f, 'yx', 1, 1); return { p, q, d: Math.hypot(p[0] - q[0], p[1] - q[1]) }; };
        v.render(() => {
          const f = F(), N = 8, K = amp.value;
          const ref = []; for (let i = 0; i <= N; i++) ref.push(i / N);
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.4, dash: [4, 4], fill: false });
          for (const t of ref) { S.line(t, 0, t, 1, { color: 'faint', width: 0.7, alpha: 0.6 }); S.line(0, t, 1, t, { color: 'faint', width: 0.7, alpha: 0.6 }); }
          S.arrow(0, -0.12, 0.98, -0.12, { color: 'blue', width: 1.4, head: 6, dash: true }); S.arrow(1.12, 0.0, 1.12, 0.98, { color: 'blue', width: 1.4, head: 6, dash: true });
          S.arrow(-0.12, 0, -0.12, 0.98, { color: 'red', width: 1.4, head: 6, dash: true }); S.arrow(0, 1.12, 0.98, 1.12, { color: 'red', width: 1.4, head: 6, dash: true });
          S.text('route 1', 0.5, -0.2, { size: 11.5, color: 'blue', align: 'center' }); S.text('route 2', -0.2, 0.5, { size: 11.5, color: 'red', align: 'center' });
          const grid = (order, col) => {
            const P = ref.map((x) => ref.map((y) => { const d = disp(f, order, x, y); return [x + K * d[0], y + K * d[1]]; }));
            for (let i = 0; i <= N; i++) { S.path(P[i], { color: col, width: 1.8 }); S.path(P.map((r) => r[i]), { color: col, width: 1.8 }); }
          };
          grid('xy', 'accent'); grid('yx', 'red');
          const { p, q } = gap(), P1 = [1 + K * p[0], 1 + K * p[1]], P2 = [1 + K * q[0], 1 + K * q[1]];
          S.dot(P1[0], P1[1], { r: 5, color: 'accent' }); S.dot(P2[0], P2[1], { r: 5, color: 'red' });
          if (Math.hypot(P1[0] - P2[0], P1[1] - P2[1]) > 0.004) S.arrow(P2[0], P2[1], P1[0], P1[1], { color: 'orange', width: 3, head: 9 });
        });
        v.readout(() => {
          const R = 2 * sa.value + 2 * sb.value - sc.value, g = gap();
          return `Compatibility defect $R=\\partial_{yy}\\varepsilon_{xx}+\\partial_{xx}\\varepsilon_{yy}-\\partial_{xy}\\gamma_{xy}=0.08\\,(2a+2b-c)=${num(0.08 * R, 3)}$. · The two reconstructions of the far corner $(1,1)$ differ by $${num(g.d * 1000, 1)}\\times10^{-3}$ (before exaggeration) ${Math.abs(R) < 1e-9 ? '— none: this strain field comes from a displacement field.' : '— no displacement field has this strain.'}`;
        });
      },
    },
  ],
};
