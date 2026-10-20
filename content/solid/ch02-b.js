// Solid Mechanics & Structures — Chapter 2: Stress and strain in three dimensions (items 2.7–2.12; 2.1–2.6 are in ch02.js)
//
// Computed pictures only: 2.7/2.9 use the closed-form isotropic Hooke's law, 2.8 the textbook modulus conversions, 2.10 the exact
// kinematics of a pin-jointed (rigid-rib) lattice, 2.11 a bilinear-quadrilateral finite-element solution (plateFE in ch02.shared.js),
// 2.12 exact derivatives of polynomial Airy functions. Material values used as markers (ν of steel 0.30, aluminium 0.33, concrete 0.2,
// rubber ≈ 0.5, cork ≈ 0) are typical textbook values (steel 0.27–0.30, aluminium 0.33, concrete 0.1–0.2), not from one table. Deformations are exaggerated and
// captions say so.

import { num, pmat, P3, drawBox, plateFE } from './ch02.shared.js';

export default {
  collection: 'solid',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Law',
      name: 'Generalised Hooke’s law for isotropic solids',
      statement: String.raw`For a linearly elastic, isotropic material with Young's modulus $E$ and Poisson ratio $\nu$ (small strains, no thermal or other eigenstrain), the strains are the sum of the effect of each stress acting alone:
$$\varepsilon_{x}=\frac{\sigma_x-\nu(\sigma_y+\sigma_z)}{E},\quad \varepsilon_y=\frac{\sigma_y-\nu(\sigma_z+\sigma_x)}{E},\quad \varepsilon_z=\frac{\sigma_z-\nu(\sigma_x+\sigma_y)}{E},\qquad \gamma_{xy}=\frac{\tau_{xy}}{G},\ \gamma_{yz}=\frac{\tau_{yz}}{G},\ \gamma_{zx}=\frac{\tau_{zx}}{G},$$
with $G=E/2(1+\nu)$. In tensor form $\varepsilon_{ij}=\frac{1+\nu}{E}\sigma_{ij}-\frac{\nu}{E}\sigma_{kk}\delta_{ij}$, or inversely $\sigma_{ij}=\lambda\varepsilon_{kk}\delta_{ij}+2\mu\varepsilon_{ij}$ with the Lamé constants $\lambda=\frac{E\nu}{(1+\nu)(1-2\nu)}$, $\mu=G$.`,
      idea: String.raw`Linearity lets us superpose: a tension $\sigma_x$ alone stretches the cube by $\sigma_x/E$ along $x$ (1.4) and contracts it by $\nu\sigma_x/E$ along $y$ and $z$ (1.5); the same for $\sigma_y$ and $\sigma_z$. Isotropy means the same two constants $E,\nu$ serve for every axis, and that a normal stress can produce no shear, nor a shear any normal strain (rotate the axes by $180^\circ$ about the normal and the shear would have to change sign). That the shear modulus is not independent comes from requiring that pure shear, viewed in axes rotated by $45^\circ$, is a tension plus a compression of the same material: this gives $G=E/2(1+\nu)$ (2.8).`,
      caption: String.raw`Set three normal stresses on the cube (or pick a material, which sets $\nu$). The first three boxes show each stress acting alone — a stretch along its own axis and contractions of size $\nu$ times that across it — and the last box is their sum, which is the true response. Dashed outline: undeformed cube. Deformations are drawn exaggerated, the same for any material: $100$ MPa direct stress shows as 12 % strain at $\nu=0$. The strains in the readout are in units of $1/E$.`,
      deps: ['solid-1.4', 'solid-1.5', 'solid-2.1', 'solid-2.5'],
      refs: ['Gere–Goodno §7.5', 'Gere–Goodno §7.6'],
      tags: ['hooke', 'constitutive'],
      scope: String.raw`Linear elastic, isotropic, small strains, isothermal. Not valid for anisotropic crystals, wood, composites, plasticity or rubber at large strain.`,
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 80, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, 40, { step: 1 });
        const sz = v.slider('$\\sigma_z$', -100, 100, -30, { step: 1 });
        const nu = v.slider('Poisson ratio $\\nu$', -0.9, 0.49, 0.3, { step: 0.01 });
        v.select('material', [{ value: 0, label: 'cork-like ν≈0' }, { value: 0.3, label: 'steel ν≈0.3' }, { value: 0.49, label: 'rubber ν≈0.5' }, { value: -0.6, label: 'auxetic ν<0' }], 0.3, { onChange: (x) => nu.set(+x) });
        const mk = (t) => v.stage({ x: [-1.65, 1.65], y: [-1.45, 1.45], equal: true, axes: false, height: 250, minWidth: 190, title: t });
        const Sg = [mk('σx alone'), mk('σy alone'), mk('σz alone'), mk('all three together')];
        const h = 0.62, KD = 0.12 / 100;
        const strains = (a, b, c) => [KD * (a - nu.value * (b + c)), KD * (b - nu.value * (c + a)), KD * (c - nu.value * (a + b))];
        const arrows = (S, o, hs, sig) => {
          const k = 0.0075, F = [[hs[0], 0, 0], [0, hs[1], 0], [0, 0, hs[2]]], D = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
          for (let i = 0; i < 3; i++) {
            const q = sig[i]; if (Math.abs(q) < 1) continue;
            const kk = i === 2 ? 2.2 * k : k, tail = q >= 0 ? F[i] : F[i].map((c, m) => c - kk * q * D[i][m]), tip = tail.map((c, m) => c + kk * q * D[i][m]);
            const A = P3(tail, o), B = P3(tip, o);
            S.arrow(A[0], A[1], B[0], B[1], { color: q >= 0 ? 'accent' : 'red', width: 3, head: 9 });
          }
        };
        v.render(() => {
          const cases = [[sx.value, 0, 0], [0, sy.value, 0], [0, 0, sz.value], [sx.value, sy.value, sz.value]];
          cases.forEach((c, n) => {
            const S = Sg[n], e = strains(c[0], c[1], c[2]), hs = [h * (1 + e[0]), h * (1 + e[1]), h * (1 + e[2])], o = [0.12, 0];
            drawBox(v, S, [h, h, h], o, { color: 'faint', alpha: 0, width: 1.1, hidden: false });
            drawBox(v, S, hs, o, { color: n === 3 ? 'green' : 'ink', fill: n === 3 ? 'green' : 'accent', alpha: 0.15, width: 2 });
            arrows(S, o, hs, c);
            const q = (x) => `${x < -0.5 ? '−' : x > 0.5 ? '+' : ''}${Math.abs(Math.round(x))}`;
            S.text(`Eεx ${q(e[0] / KD)}   Eεy ${q(e[1] / KD)}   Eεz ${q(e[2] / KD)}`, 0, -1.3, { size: 10.5, color: 'muted', align: 'center' });
          });
        });
        v.readout(() => {
          const a = sx.value, b = sy.value, c = sz.value, n = nu.value;
          const ex = a - n * (b + c), ey = b - n * (c + a), ez = c - n * (a + b);
          return `$E\\varepsilon_x=${num(a, 0)}-\\nu(${num(b, 0)}+${num(c, 0)})=${num(ex, 1)}$, $E\\varepsilon_y=${num(ey, 1)}$, $E\\varepsilon_z=${num(ez, 1)}$ MPa (for $\\nu=${num(n, 2)}$). · Volume change $\\Delta V/V=(1-2\\nu)(\\sigma_x+\\sigma_y+\\sigma_z)/E=${num(((1 - 2 * n) * (a + b + c)) / 1, 1)}/E$ — **${Math.abs(1 - 2 * n) < 0.03 ? 'about zero: nearly incompressible' : n < 0.5 ? 'finite' : ''}**. · Shear: $\\gamma=\\tau/G$ with $G=E/${num(2 * (1 + n), 2)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Proposition',
      name: 'Relations among E, ν, G and K',
      statement: String.raw`An isotropic linear elastic solid has only two independent elastic constants. With Young's modulus $E$ and Poisson ratio $\nu$, the shear modulus $G$ and bulk modulus $K$ (defined by $\tau=G\gamma$ and $p=-K\,\Delta V/V$) are
$$G=\frac{E}{2(1+\nu)},\qquad K=\frac{E}{3(1-2\nu)},$$
and conversely $E=\dfrac{9KG}{3K+G}$, $\nu=\dfrac{3K-2G}{2(3K+G)}$, with $\dfrac9E=\dfrac3G+\dfrac1K$. Positive strain energy ($G>0$, $K>0$) forces $-1<\nu<\tfrac12$: as $\nu\to\tfrac12$ the material becomes incompressible ($K\to\infty$) and as $\nu\to-1$ it cannot change shape ($G/E\to\infty$: it resists shear far more strongly than tension).`,
      idea: String.raw`Start from the generalised Hooke's law (2.7). Under pressure $p$ on all faces $\sigma_x=\sigma_y=\sigma_z=-p$, so $\varepsilon=-p(1-2\nu)/E$ and $\Delta V/V=3\varepsilon=-3(1-2\nu)p/E$, which defines $K$. For $G$, a pure shear $\tau$ is, in axes turned by $45^\circ$, a tension $\tau$ and a compression $-\tau$; Hooke's law gives the normal strain $(1+\nu)\tau/E$ along the tension axis, and the corresponding shear angle is twice that, $\gamma=2(1+\nu)\tau/E$. Strain energy is positive only if $G$ and $K$ are, which bounds $\nu$.`,
      caption: String.raw`Slide $\nu$ across its whole allowed range $(-1,\tfrac12)$: the curves show $G/E$ and $K/E$, and the dots mark typical materials. In the right-hand panel the same stress, one tenth of $E$, is applied as a pressure on a square (it shrinks by $p/K$ in area) and as a shear (it distorts by $\gamma=\tau/G$). Near $\nu=\tfrac12$ the pressure no longer compresses the square; near $\nu=-1$ the shear no longer distorts it.`,
      deps: ['solid-2.7'],
      refs: ['Gere–Goodno §3.6'],
      tags: ['moduli', 'poisson'],
      credit: 'G. Lamé, 1850s (Lamé constants)',
      viz(v) {
        const nu = v.slider('Poisson ratio $\\nu$', -0.95, 0.495, 0.3, { step: 0.005 });
        const Eg = v.slider('Young’s modulus $E$ (GPa)', 0.01, 400, 210, { log: true });
        const A = v.stage({ x: [-1, 0.5], y: [0, 4], axes: 'box', gutter: true, height: 340, xlabel: 'Poisson ratio ν', ylabel: 'modulus / E', title: 'G/E and K/E over the admissible range' });
        const B = v.stage({ x: [-2.3, 2.3], y: [-1.7, 1.7], equal: true, axes: false, height: 340, title: 'the same stress (0.1 E) as pressure and as shear' });
        const GE = (n) => 1 / (2 * (1 + n)), KE = (n) => 1 / (3 * (1 - 2 * n));
        const marks = [[-0.7, 'auxetic foam'], [0, 'cork'], [0.2, 'concrete'], [0.3, 'steel'], [0.49, 'rubber']];
        v.legend([['accent', 'G / E'], ['orange', 'K / E']]);
        v.render(() => {
          A.fn(GE, { domain: [-0.999, 0.4999], color: 'accent', width: 2.6, n: 300 });
          A.fn(KE, { domain: [-0.999, 0.4999], color: 'orange', width: 2.6, n: 300 });
          A.hline(1 / 3, { color: 'faint', width: 1, dash: [3, 4] }); A.vline(0.5, { color: 'red', width: 1.6, dash: [5, 4] }); A.vline(-1, { color: 'red', width: 1.6, dash: [5, 4] });
          A.text('K → ∞', 0.485, 2.8, { size: 11, color: 'red', align: 'right' }); A.text('G → ∞', -0.97, 2.8, { size: 11, color: 'red', align: 'left' });
          marks.forEach(([n, t], i) => { A.vline(n, { color: 'faint', width: 1, dash: [2, 4] }); A.text(t, n + (n > 0.4 ? -0.015 : 0), 3.6 - 0.3 * (i % 3), { size: 10.5, color: 'muted', align: n > 0.4 ? 'right' : 'center' }); });
          const n = nu.value;
          A.vline(n, { color: 'muted', width: 1, dash: [4, 3] });
          A.dot(n, GE(n), { r: 6, color: 'accent' }); A.dot(n, Math.min(3.95, KE(n)), { r: 6, color: 'orange' });
          // test squares: pressure p = 0.1 E (side shrinks by p/(3K)), shear τ = 0.1 E (angle τ/G)
          const side = 1 - 0.1 / (3 * KE(n)), gam = 0.1 / GE(n), ox = -1.1, ox2 = 1.1;
          const sq = (cx, f) => [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]].map(([x, y]) => [cx + f(x, y)[0], f(x, y)[1]]);
          B.path(sq(ox, (x, y) => [x, y]), { close: true, color: 'faint', width: 1.4, dash: [5, 4] });
          B.path(sq(ox, (x, y) => [x * side, y * side]), { close: true, color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.15 });
          for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a); B.arrow(ox + 1.25 * c * 1.28, 1.25 * s * 1.28, ox + 0.92 * c * 1.28 * 0.0 + (0.86 * c) * 1.0 * 1.0, 0.86 * s, { color: 'orange', width: 2, head: 7 }); }
          B.path(sq(ox2, (x, y) => [x, y]), { close: true, color: 'faint', width: 1.4, dash: [5, 4] });
          B.path(sq(ox2, (x, y) => [x + gam * y, y]), { close: true, color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.15 });
          B.arrow(ox2 - 0.7, 1.12, ox2 + 0.7, 1.12, { color: 'accent', width: 2.4, head: 8 }); B.arrow(ox2 + 0.7, -1.12, ox2 - 0.7, -1.12, { color: 'accent', width: 2.4, head: 8 });
          B.text(`area ${(100 * (side * side - 1)).toFixed(1).replace('-', '−')} %`, ox, -1.45, { size: 12, color: 'orange', align: 'center', weight: 600 });
          B.text(`γ = ${gam.toFixed(2)} rad`, ox2, -1.45, { size: 12, color: 'accent', align: 'center', weight: 600 });
          B.text('pressure p', ox, 1.45, { size: 11.5, color: 'muted', align: 'center' }); B.text('shear τ', ox2, 1.45, { size: 11.5, color: 'muted', align: 'center' });
        });
        v.readout(() => {
          const n = nu.value, E = Eg.value, G = E * GE(n), K = E * KE(n), lam = (E * n) / ((1 + n) * (1 - 2 * n));
          const chk = 9 / E - (3 / G + 1 / K), back = (9 * K * G) / (3 * K + G);
          return `$E=${v.fmt(E, 3)}$ GPa, $\\nu=${num(n, 3)}$ → $G=E/2(1+\\nu)=${v.fmt(G, 3)}$ GPa, $K=E/3(1-2\\nu)=${v.fmt(K, 3)}$ GPa, $\\lambda=${v.fmt(lam, 3)}$ GPa. · Check: $9KG/(3K+G)=${v.fmt(back, 3)}$ GPa $=E$, and $9/E-3/G-1/K=${v.sci(Math.abs(chk) < 1e-12 ? 0 : chk, 2)}$. · $K/G=${v.fmt(K / G, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Plane stress and plane strain',
      statement: String.raw`Two reductions of the three-dimensional equations to the $xy$-plane. **Plane stress**: $\sigma_z=\tau_{xz}=\tau_{yz}=0$ (a thin plate loaded in its own plane); then $\varepsilon_z=-\frac{\nu}{E}(\sigma_x+\sigma_y)\neq0$ and
$$\varepsilon_x=\frac{\sigma_x-\nu\sigma_y}{E},\quad \varepsilon_y=\frac{\sigma_y-\nu\sigma_x}{E}.$$
**Plane strain**: $\varepsilon_z=\gamma_{xz}=\gamma_{yz}=0$ (a long body with fixed ends or constant cross-section loaded across it); then $\sigma_z=\nu(\sigma_x+\sigma_y)\ne0$ and
$$\varepsilon_x=\frac{1-\nu^2}{E}\Big(\sigma_x-\frac{\nu}{1-\nu}\sigma_y\Big),\quad \varepsilon_y=\frac{1-\nu^2}{E}\Big(\sigma_y-\frac{\nu}{1-\nu}\sigma_x\Big).$$
Plane strain is plane stress with $E\to E/(1-\nu^2)$ and $\nu\to\nu/(1-\nu)$.`,
      idea: String.raw`Both follow from 2.7 by imposing one condition on the third direction. In plane stress the surfaces $z=\pm t/2$ are free, so there is no room for $\sigma_z$ in a thin plate and the plate simply thins or thickens ($\varepsilon_z\neq0$). In plane strain, the ends hold the length in the $z$-direction fixed, so the material has to push against them to cancel the Poisson contraction: that is the stress $\sigma_z=\nu(\sigma_x+\sigma_y)$, which in turn adds an extra $-\nu\sigma_z/E$ to each in-plane strain, making the in-plane response stiffer.`,
      caption: String.raw`The same in-plane stresses $\sigma_x,\sigma_y$ act on a thin plate (left, free to thin or thicken in $z$) and on a slice of a long body held between rigid walls (right, $\varepsilon_z=0$, with the wall pressing back with $\sigma_z$, red). Dashed: original block, exaggerated deformation as in 2.7. At $\nu=0$ the two are identical; as $\nu$ grows, the plate-strain slice becomes stiffer in the plane (smaller $\varepsilon_x,\varepsilon_y$) and bears the extra $\sigma_z$.`,
      deps: ['solid-2.7'],
      refs: ['Gere–Goodno §7.2', 'Gere–Goodno §7.7'],
      tags: ['plane stress', 'plane strain'],
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 80, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, 30, { step: 1 });
        const nu = v.slider('Poisson ratio $\\nu$', 0, 0.49, 0.3, { step: 0.01 });
        const mk = (t) => v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, axes: false, height: 330, title: t });
        const L = mk('plane stress: a thin plate, σz = 0'), R = mk('plane strain: a long body between walls, εz = 0');
        const KD = 0.12 / 100;
        const resp = () => {
          const a = sx.value, b = sy.value, n = nu.value;
          return {
            ps: [a - n * b, b - n * a, -n * (a + b)], pe: [(1 - n * n) * a - n * (1 + n) * b, (1 - n * n) * b - n * (1 + n) * a, 0], sz: n * (a + b),
          };
        };
        v.render(() => {
          const { ps, pe, sz } = resp(), k = 0.0085, a = sx.value, b = sy.value;
          const draw = (S, e, hz0, sigz) => {
            const h = [0.8, 0.6, hz0], hs = [h[0] * (1 + KD * e[0]), h[1] * (1 + KD * e[1]), h[2] * (1 + KD * e[2])], o = [0.1, 0];
            drawBox(v, S, h, o, { color: 'faint', alpha: 0, width: 1.1, hidden: false });
            drawBox(v, S, hs, o, { color: 'ink', fill: 'accent', alpha: 0.14, width: 2 });
            const ar = (p, d, q, col) => { if (Math.abs(q) < 1) return; const tail = q >= 0 ? p : p.map((c, m) => c - k * q * d[m]), tip = tail.map((c, m) => c + k * q * d[m]); const A = P3(tail, o), B = P3(tip, o); S.arrow(A[0], A[1], B[0], B[1], { color: col, width: 3, head: 9 }); };
            ar([hs[0], 0, 0], [1, 0, 0], a, a >= 0 ? 'accent' : 'red'); ar([0, hs[1], 0], [0, 1, 0], b, b >= 0 ? 'accent' : 'red');
            if (sigz !== null) ar([0, 0, hs[2]], [0, 0, 1], sigz, sigz >= 0 ? 'accent' : 'red');
            return { hs, o };
          };
          draw(L, ps, 0.22, null);
          L.text(`σz = 0,  εz = −ν(σx+σy)/E`, 0, -1.4, { size: 11, color: 'muted', align: 'center' });
          draw(R, pe, 0.95, sz);
          // rigid walls at the two ends (hatched), drawn as a bar behind the front face
          const wz = 1.35, W0 = [[-0.92, -0.72], [0.92, -0.72], [0.92, 0.72], [-0.92, 0.72]].map(([x, y]) => P3([x, y, wz], [0.1, 0]));
          R.path(W0, { close: true, color: 'muted', width: 1.6, fill: 'muted', fillAlpha: 0.06, hatch: true, hatchAlpha: 0.3 });
          R.text('rigid wall', W0[1][0] - 0.1, W0[0][1] - 0.12, { size: 10.5, color: 'muted', align: 'right' });
          R.text(`σz = ν(σx+σy) = ${num(sz, 0)} MPa,  εz = 0`, 0, -1.4, { size: 11, color: 'muted', align: 'center' });
        });
        v.readout(() => {
          const { ps, pe, sz } = resp(), n = nu.value;
          return `Plane stress: $E\\varepsilon_x=${num(ps[0], 1)}$, $E\\varepsilon_y=${num(ps[1], 1)}$, $E\\varepsilon_z=${num(ps[2], 1)}$ MPa, $\\sigma_z=0$. · Plane strain: $E\\varepsilon_x=${num(pe[0], 1)}$, $E\\varepsilon_y=${num(pe[1], 1)}$, $\\varepsilon_z=0$, $\\sigma_z=${num(sz, 1)}$ MPa. · Stiffening factor $(1-\\nu^2)$ on the in-plane strain at $\\nu=${num(n, 2)}$ (for $\\sigma_y=0$ the in-plane strain $\\varepsilon_x$ is smaller by ${num(n * n * 100, 1)} % — ${n === 0 ? 'identical at ν = 0' : 'a stiffer slice'}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Auxetic materials: negative Poisson’s ratio',
      statement: String.raw`The thermodynamic limits $-1<\nu<\tfrac12$ of an isotropic solid (2.8) include **negative** values. A material with $\nu<0$ is *auxetic*: it gets fatter, not thinner, when stretched. Auxetic behaviour is a property of structure rather than of the base material: it occurs in re-entrant (bow-tie) honeycombs, foams with collapsed cells, certain crystals and rotating-square or chiral lattices. For a honeycomb of rigid ribs hinged at the nodes (ribs of length $L$ inclined at angle $\theta$, vertical ribs of length $H$) the small-strain Poisson ratio is
$$\nu=-\frac{\varepsilon_y}{\varepsilon_x}=\frac{\cos^2\theta}{\big(H/L+\sin\theta\big)\sin\theta},$$
positive for $\theta>0$ (regular cells) and negative for $\theta<0$ (re-entrant cells).`,
      idea: String.raw`Stretching such a lattice makes the angle $\theta$ change, since the ribs themselves are stiff: the cell width is $2L\cos\theta$ and its height $H+L\sin\theta$ per row. In a regular hexagon, stretching in $x$ flattens the ribs (smaller $\theta$): the height $H+L\sin\theta$ drops, so the lattice narrows, $\nu>0$. In a re-entrant cell, $\theta<0$ and $\sin\theta<0$; flattening the ribs ($\theta\to0^-$) makes $H+L\sin\theta$ grow, so the height increases while the width does too, giving $\nu<0$. The hinge model is strongly anisotropic, so its values need not respect the isotropic bound $-1<\nu<\tfrac12$ of 2.8; real foams reach about $-0.7$ or less negative.

For positive cell width and height away from a stationary width, use the rib angle as a smooth parameter. The chain rule pma 5.5 converts the angle derivatives of $x=2L\cos\theta$ and $y=H+L\sin\theta$ into $dy/dx$. Forming the infinitesimal strain ratio $-(dy/y)/(dx/x)$ yields the displayed Poisson ratio. At $\sin\theta=0$ the width derivative vanishes, so that ratio is singular rather than a finite material constant.`,
      caption: String.raw`Stretch the two lattices by the same axial strain with the slider. Top left: regular honeycomb ($\theta>0$): it narrows. Top right: re-entrant honeycomb ($\theta<0$): it widens. Dashed: the undeformed cells. The measured $\nu=-\varepsilon_y/\varepsilon_x$ is computed from the node positions of the rigid-rib mechanism (finite strains, no formula); below it is compared with the small-strain formula as a function of $\theta$. The model has rigid ribs hinged at the nodes, so stretches stop when the ribs straighten (the lock-up strain).`,
      deps: ['solid-2.8', 'pma-5.5'],
      refs: ['Gere–Goodno §1.7'],
      tags: ['poisson', 'metamaterial'],
      credit: 'R. Lakes, 1987 (re-entrant foams); L. Gibson & M. Ashby (honeycomb mechanics)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Auxetics' },
      viz(v) {
        const ex = v.slider('axial strain $\\varepsilon_x$', 0, 0.3, 0.12, { step: 0.005 });
        const th = v.slider('rib angle $|\\theta|$ (deg)', 15, 60, 30, { step: 1 });
        const hl = v.slider('$H/L$', 0.6, 2.2, 1, { step: 0.05 });
        const mk = (t) => v.stage({ x: [-4.6, 4.6], y: [-3.1, 3.1], equal: true, axes: false, height: 330, title: t, minWidth: 280 });
        const A = mk('regular honeycomb θ > 0'), B = mk('re-entrant honeycomb θ < 0');
        const C = v.stage({ x: [-70, 70], y: [-6, 3], axes: 'box', gutter: true, height: 330, xlabel: 'rib angle θ (deg)', ylabel: 'Poisson ratio ν', title: 'Poisson ratio of the hinged lattice', minWidth: 280 });
        const L = 1;
        const geom = (thDeg, e) => {
          const t0 = (thDeg * Math.PI) / 180, H = hl.value;
          const emax = 0.985 / Math.cos(t0) - 1, ee = Math.min(e, Math.max(0, emax));
          const t1 = Math.sign(t0) * Math.acos(Math.min(1, Math.cos(t0) * (1 + ee)));
          const c0 = L * Math.cos(t0), s0 = L * Math.sin(t0), c1 = L * Math.cos(t1), s1 = L * Math.sin(t1);
          const ey = (H + s1) / (H + s0) - 1, ex = c1 / c0 - 1;
          return { t0, t1, H, c0, s0, c1, s1, ex, ey, nu: ex > 1e-9 ? -ey / ex : NaN, locked: e > emax, emax };
        };
        const nodes = (c, s, H, R, I) => {
          const P = [];
          for (let k = 0; k < R; k++) { P.push([]); for (let i = 0; i <= I; i++) P[k].push([(i + (k % 2)) * c, k * (H + s) + (i % 2 ? s : 0)]); }
          return P;
        };
        const lattice = (S, c, s, H, col, w, dash, ctr) => {
          const R = 4, I = 8, P = nodes(c, s, H, R, I);
          const mx = ctr ? [ctr[0], ctr[1]] : [0, 0];
          const pt = (p) => [p[0] - mx[0], p[1] - mx[1]];
          for (let k = 0; k < R; k++) {
            S.path(P[k].map(pt), { color: col, width: w, dash });
            for (let i = 1; i <= I; i += 2) {
              const j = k % 2 === 0 ? i - 1 : i + 1;
              if (k + 1 < R && j >= 0 && j <= I) S.path([pt(P[k][i]), pt(P[k + 1][j])], { color: col, width: w, dash });
            }
          }
          return P;
        };
        const center = (c, s, H) => { const P = nodes(c, s, H, 4, 8); let sx = 0, sy = 0, n = 0; P.forEach((r) => r.forEach((p) => { sx += p[0]; sy += p[1]; n++; })); return [sx / n, sy / n]; };
        const formula = (d) => { const t = (d * Math.PI) / 180; return (Math.cos(t) ** 2) / ((hl.value + Math.sin(t)) * Math.sin(t)); };
        v.render(() => {
          const out = [];
          [[A, th.value], [B, -th.value]].forEach(([S, d]) => {
            const g = geom(d, ex.value); out.push(g);
            lattice(S, g.c0, g.s0, g.H, 'faint', 1.2, [4, 4], center(g.c0, g.s0, g.H));
            lattice(S, g.c1, g.s1, g.H, d > 0 ? 'accent' : 'orange', 3, undefined, center(g.c1, g.s1, g.H));
            S.text(`εx = ${num(g.ex * 100, 1)} %   εy = ${num(g.ey * 100, 1)} %${g.locked ? '   (locked)' : ''}`, 0, -2.85, { size: 12, color: 'ink', align: 'center', weight: 600 });
            S.text(Number.isFinite(g.nu) ? `ν = ${num(g.nu, 2)}` : 'ν: stretch first', 0, 2.85, { size: 13, color: d > 0 ? 'accent' : 'orange', align: 'center', weight: 700 });
          });
          for (const br of [[-70, -0.4], [0.4, 70]]) C.fn((d) => { const q = formula(d); return Math.abs(q) > 9 ? NaN : q; }, { domain: br, color: 'faint', width: 2.4, n: 300 });
          C.hline(0, { color: 'faint', width: 1 });
          C.vline(0, { color: 'faint', width: 1, dash: [3, 4] });
          out.forEach((g, i) => { const d = i === 0 ? th.value : -th.value; if (Number.isFinite(g.nu)) C.dot(d, Math.max(-5.8, Math.min(2.9, g.nu)), { r: 6, color: i === 0 ? 'accent' : 'orange' }); C.dot(d, Math.max(-5.8, Math.min(2.9, formula(d))), { r: 4, hollow: true, color: 'ink' }); });
          C.text('hollow: small-strain formula', 0, -5.5, { size: 11, color: 'muted', align: 'center' });
        });
        v.readout(() => {
          const g1 = geom(th.value, ex.value), g2 = geom(-th.value, ex.value);
          return `Regular cell ($\\theta=${th.value}^\\circ$): $\\varepsilon_y/\\varepsilon_x=${num(g1.ey / g1.ex, 2)}$, so $\\nu=${num(g1.nu, 2)}$ (formula at small strain ${num(formula(th.value), 2)}). · Re-entrant ($\\theta=-${th.value}^\\circ$): $\\nu=${num(g2.nu, 2)}$ (formula ${num(formula(-th.value), 2)}) — ${g2.nu < 0 ? '**negative: the lattice widens when stretched**' : 'not negative here'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Definition',
      name: 'Navier–Cauchy equations of elasticity',
      statement: String.raw`Substituting the strain–displacement relations (2.5) and Hooke's law (2.7) into the equilibrium equations (2.4) gives the **Navier–Cauchy equations**, three equations for the three displacement components of a homogeneous isotropic elastic body,
$$\mu\nabla^2\mathbf u+(\lambda+\mu)\nabla(\nabla\!\cdot\!\mathbf u)+\mathbf b=\mathbf 0 ,$$
with Lamé constants $\lambda,\mu$. A boundary-value problem is closed by prescribing, on each part of the boundary, either the displacement $\mathbf u$ or the traction $\boldsymbol\sigma\mathbf n$ (and the compatibility conditions then hold automatically, since $\mathbf u$ is the unknown). In dynamics $\mathbf 0$ is replaced by $\rho\ddot{\mathbf u}$.`,
      idea: String.raw`The unknowns are the six stresses and six strains and three displacements; the equations are equilibrium (3), Hooke's law (6) and strain–displacement (6). Eliminating strain and stress in favour of $\mathbf u$ leaves just three second-order PDEs. Their weak (integrated) form is what a finite-element code solves: multiply by a test displacement, integrate by parts, and the traction boundary condition appears naturally. The equations are linear in $\mathbf u$ and $\mathbf b$, so solutions scale with the load and superpose.

For smooth displacement and constant Lamé coefficients, commuting the mixed coordinate derivatives (pma 9.41a) collects the constitutive substitution into the vector Laplacian and gradient of divergence. For its integrated form, apply the divergence theorem pma 10.51 to the vector field with components $\sigma_{ij}v_i$ for a smooth test displacement. The boundary term is traction dotted with the test displacement. This explains the weak-form step; the displayed finite-element solution remains a discrete approximation.`,
      caption: String.raw`A steel plate (200 × 100 mm, plane stress) is clamped at the left and loaded by a uniform pull and shear $p_x,p_y$ on the right edge plus a body force $b_y$ in the plate. The finite-element solution of the displacement equations is drawn (displacements magnified) and coloured by von Mises stress. Halve every load and the whole picture halves: the readout compares the solutions for load $P$ and $P/2$. Near the clamp the stress is not uniform, which is why 1.13 matters.`,
      deps: ['solid-2.4', 'solid-2.7', 'pma-9.41a', 'pma-10.51'],
      refs: ['Timoshenko–Goodier ch. 9'],
      tags: ['elasticity', 'finite elements'],
      credit: 'C.-L. Navier, 1820s; A.-L. Cauchy, 1820s',
      scope: String.raw`Small displacements, homogeneous isotropic linear elasticity. The picture uses bilinear plane-stress finite elements (24 × 12 mesh), which are approximate: the readout shows the equilibrium of the discrete reactions.`,
      viz(v) {
        const px = v.slider('pull $p_x$ (MPa)', -100, 100, 60, { step: 1 });
        const py = v.slider('shear $p_y$ (MPa)', -100, 100, 20, { step: 1 });
        const by = v.slider('body force $b_y$ (MPa/mm)', -0.5, 0.5, -0.1, { step: 0.01 });
        const nuS = v.slider('Poisson ratio $\\nu$', 0, 0.45, 0.3, { step: 0.01 });
        const mag = v.slider('displacement magnification', 20, 2000, 100, { log: true });
        const S = v.stage({ x: [-30, 270], y: [-85, 165], equal: true, axes: false, height: 340, title: 'deformed plate: von Mises stress' });
        const G = v.stage({ x: [-0.05, 1.1], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'load scale', ylabel: 'peak displacement (mm)', title: 'linearity: u(P/2) = u(P)/2', xticks: [[0, '0'], [0.5, 'P/2'], [1, 'P']] });
        let cache = null;
        const fe = () => { const n = nuS.value; if (!cache || cache.n !== n) cache = { n, f: plateFE({ W: 200, H: 100, nx: 24, ny: 12, E: 210000, nu: n }) }; return cache.f; };
        const run = (k) => { const f = fe(); return { f, r: f.solve({ px: px.value * k, py: py.value * k, by: by.value * k }) }; };
        const maxU = (r) => { let m = 0; for (let i = 0; i < r.u.length; i += 2) m = Math.max(m, Math.hypot(r.u[i], r.u[i + 1])); return m; };
        v.render(() => {
          const { f, r } = run(1), r2 = run(0.5).r, m = mag.value, nx = f.nx, ny = f.ny;
          const pos = (i, j) => { const n = f.id(i, j); return [i * f.dx + m * r.u[2 * n], j * f.dy + m * r.u[2 * n + 1]]; };
          S.rect(0, 0, 200, 100, { color: 'faint', width: 1.2, dash: [4, 4], fill: false });
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
            const t = Math.min(1, r.vm[i * ny + j] / 150);
            S.path([pos(i, j), pos(i + 1, j), pos(i + 1, j + 1), pos(i, j + 1)], { close: true, fill: v.ramp(t, 'red'), fillAlpha: 1, color: 'panel', width: 0.4 });
          }
          const top = [], bot = [], lt = [], rt = [];
          for (let i = 0; i <= nx; i++) { top.push(pos(i, ny)); bot.push(pos(i, 0)); }
          for (let j = 0; j <= ny; j++) { lt.push(pos(0, j)); rt.push(pos(nx, j)); }
          [top, bot, lt, rt].forEach((q) => S.path(q, { color: 'ink', width: 1.8 }));
          for (let y = -92; y < 100; y += 7) S.line(-1, y + 7, -10, y, { color: 'muted', width: 1 });
          S.line(0, -95, 0, 105, { color: 'ink', width: 2.4 });
          const p0 = rt[Math.floor(ny / 2)];
          const L = (q) => 0.38 * q;
          if (Math.abs(px.value) > 1) S.arrow(p0[0] + (px.value > 0 ? 3 : L(px.value) * 1 - 3), p0[1], p0[0] + (px.value > 0 ? 3 + L(px.value) : -3), p0[1], { color: 'accent', width: 3.2, head: 10 });
          if (Math.abs(py.value) > 1) S.arrow(p0[0] + 18, p0[1] - (py.value > 0 ? 0 : 0), p0[0] + 18, p0[1] + L(py.value), { color: 'orange', width: 3.2, head: 10 });
          S.text(`peak von Mises ${Math.round(Math.max(...r.vm))} MPa (element average)`, 135, -70, { size: 12, color: 'muted', align: 'center' });
          G.setView([-0.05, 1.1], [0, Math.max(0.01, 1.25 * maxU(r))]);
          G.line(0, 0, 1, maxU(r), { color: 'accent', width: 2.4 });
          G.dot(1, maxU(r), { r: 6, color: 'accent' }); G.dot(0.5, maxU(r2), { r: 6, color: 'orange' });
        });
        v.readout(() => {
          const { f, r } = run(1), r2 = run(0.5).r, tot = Math.hypot(r.Rx + r.Fx, r.Ry + r.Fy), ld = Math.hypot(r.Fx, r.Fy);
          const ratio = maxU(r) / (maxU(r2) || 1);
          return `$\\lambda=${num(f.lambda / 1000, 1)}$ GPa, $\\mu=${num(f.mu / 1000, 1)}$ GPa. · Peak displacement $${num(maxU(r), 4)}$ mm; at half load $${num(maxU(r2), 4)}$ mm → ratio **${num(ratio, 3)}** (linear: 2). · Clamp reaction $(${num(r.Rx, 1)},\\,${num(r.Ry, 1)})$ N/mm vs applied $(${num(r.Fx, 1)},\\,${num(r.Fy, 1)})$: imbalance ${num(tot / (ld || 1) * 100, 4)} %.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Method',
      name: 'Airy stress function',
      statement: String.raw`In plane stress or plane strain with no body force (or a conservative one, which can be absorbed), every stress field of the form
$$\sigma_{xx}=\frac{\partial^2\phi}{\partial y^2},\qquad \sigma_{yy}=\frac{\partial^2\phi}{\partial x^2},\qquad \sigma_{xy}=-\frac{\partial^2\phi}{\partial x\,\partial y}$$
satisfies the equilibrium equations (2.4) identically. Such a stress field is also compatible (2.6), so that it comes from a displacement field in a simply connected region, if and only if $\phi$ is **biharmonic**:
$$\nabla^4\phi=\frac{\partial^4\phi}{\partial x^4}+2\frac{\partial^4\phi}{\partial x^2\partial y^2}+\frac{\partial^4\phi}{\partial y^4}=0 .$$
Elasticity problems then reduce to finding a biharmonic $\phi$ whose derivatives match the tractions on the boundary (a polynomial gives the stress field of a rectangle loaded on its edges).`,
      idea: String.raw`Equilibrium $\partial_x\sigma_{xx}+\partial_y\sigma_{xy}=0$ and $\partial_x\sigma_{xy}+\partial_y\sigma_{yy}=0$ say that certain 1-forms are closed, hence exact on a simply connected region, and the potentials can be combined into one scalar $\phi$ (Airy 1862). Substituting into the compatibility equation of 2.6, written with Hooke's law (2.9) for the strains, gives $\nabla^4\phi=0$. Polynomials of degree $\le3$ are automatically biharmonic; degree 4 needs one relation among the coefficients; the quartic $x^4$ alone fails it.

For a sufficiently smooth potential, equality of mixed partials pma 9.41a makes the third-derivative terms in each equilibrium equation cancel. Applied again after constitutive substitution into compatibility, it combines the mixed fourth derivatives into the displayed biharmonic operator. These differentiations are local smooth identities; the separate simply-connected-domain condition is needed when reconstructing a globally single-valued displacement.`,
      caption: String.raw`Pick a preset or drive the seven coefficients of $\phi=a x^2+b xy+c y^2+d y^3+e xy^3+f x^4+g x^2y^2$ on the $4\times2$ plate. Colour shows the chosen quantity, contour lines are $\phi$, orange arrows are the edge tractions the field implies. The right panel shows the stresses on a section you can slide, with force, shear and moment resultants. Equilibrium holds for **every** setting; compatibility holds only when the readout says $\nabla^4\phi=0$. Try $x^4$ alone and then "make biharmonic".`,
      deps: ['solid-2.9', 'solid-2.6', 'solid-2.4', 'pma-9.41a'],
      refs: ['Timoshenko–Goodier ch. 2', 'Timoshenko–Goodier ch. 3'],
      tags: ['airy', 'plane elasticity'],
      credit: 'G. B. Airy, 1862',
      viz(v) {
        const co = {};
        const SL = [['a', '$a\\,x^2$'], ['b', '$b\\,xy$'], ['c', '$c\\,y^2$'], ['d', '$d\\,y^3$'], ['e', '$e\\,xy^3$'], ['f', '$f\\,x^4$'], ['g', '$g\\,x^2y^2$']];
        const defaults = { a: 0, b: -0.75, c: 0, d: 0, e: 0.25, f: 0, g: 0 };
        SL.forEach(([k, lab]) => { co[k] = v.slider(lab, -1, 1, defaults[k], { step: 0.05 }); });
        const presets = {
          cant: { a: 0, b: -0.75, c: 0, d: 0, e: 0.25, f: 0, g: 0 }, bend: { a: 0, b: 0, c: 0, d: 0.3, e: 0, f: 0, g: 0 }, uni: { a: 0, b: 0, c: 0.5, d: 0, e: 0, f: 0, g: 0 },
          shear: { a: 0, b: 0.5, c: 0, d: 0, e: 0, f: 0, g: 0 }, bih: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0.1, g: -0.3 }, bad: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0.1, g: 0 },
        };
        const setP = (k) => { const q = presets[k]; SL.forEach(([n]) => co[n].set(q[n])); };
        v.select('preset', [{ value: 'cant', label: 'cantilever end load' }, { value: 'bend', label: 'pure bending' }, { value: 'uni', label: 'uniaxial tension' }, { value: 'shear', label: 'pure shear' }, { value: 'bih', label: 'quartic, biharmonic' }, { value: 'bad', label: 'x⁴ alone' }], 'cant', { onChange: setP });
        v.button('make biharmonic (g = −3f)', () => { co.g.set(Math.max(-1, Math.min(1, -3 * co.f.value))); });
        const show = v.select('colour', [{ value: 'sxx', label: 'σxx' }, { value: 'syy', label: 'σyy' }, { value: 'txy', label: 'τxy' }, { value: 'phi', label: 'φ' }], 'sxx');
        const xs = v.slider('section at $x$', -2, 2, 0.8, { step: 0.05 });
        const A = v.stage({ x: [-2.7, 2.7], y: [-1.9, 1.9], equal: true, axes: false, height: 340, title: 'plate 4 × 2: stress field and the edge tractions it implies', minWidth: 360 });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, height: 340, xlabel: 'height y across the section', ylabel: 'stress (units)', title: 'stresses on the section', minWidth: 260 });
        const P = () => { const o = {}; SL.forEach(([k]) => { o[k] = co[k].value; }); return o; };
        const phi = (p, x, y) => p.a * x * x + p.b * x * y + p.c * y * y + p.d * y ** 3 + p.e * x * y ** 3 + p.f * x ** 4 + p.g * x * x * y * y;
        const sxx = (p, x, y) => 2 * p.c + 6 * p.d * y + 6 * p.e * x * y + 2 * p.g * x * x;
        const syy = (p, x, y) => 2 * p.a + 12 * p.f * x * x + 2 * p.g * y * y;
        const txy = (p, x, y) => -(p.b + 3 * p.e * y * y + 4 * p.g * x * y);
        const lap = (p) => 24 * p.f + 8 * p.g;
        const fieldOf = (k, p) => (k === 'sxx' ? (x, y) => sxx(p, x, y) : k === 'syy' ? (x, y) => syy(p, x, y) : k === 'txy' ? (x, y) => txy(p, x, y) : (x, y) => phi(p, x, y));
        const range = (f) => { let m = 1e-9; for (let i = 0; i <= 24; i++) for (let j = 0; j <= 12; j++) m = Math.max(m, Math.abs(f(-2 + (i * 4) / 24, -1 + (j * 2) / 12))); return m; };
        const edge = (p, x, y, nx, ny) => [sxx(p, x, y) * nx + txy(p, x, y) * ny, txy(p, x, y) * nx + syy(p, x, y) * ny];
        v.render(() => {
          const p = P(), f = fieldOf(show.value, p), m = range(f), key = JSON.stringify(p) + show.value;
          A.heat(f, { cmap: 'theme-diverging', range: [-m, m], res: 3, key, rect: [-2, -1, 2, 1] });
          A.rect(-2, -1, 2, 1, { color: 'ink', width: 2, fill: false });
          const ph = range((x, y) => phi(p, x, y));
          if (ph > 1e-6 && show.value !== 'phi') A.clip(() => A.contour((x, y) => phi(p, x, y), 8, { color: 'ink', width: 0.9, alpha: 0.35, res: 80 }));
          // edge tractions
          let tmax = 1e-9; const pts = [];
          for (let i = 0; i <= 8; i++) { const x = -2 + (i * 4) / 8; pts.push([x, 1, 0, 1]); pts.push([x, -1, 0, -1]); }
          for (let j = 0; j <= 4; j++) { const y = -1 + (j * 2) / 4; pts.push([2, y, 1, 0]); pts.push([-2, y, -1, 0]); }
          pts.forEach(([x, y, nx, ny]) => { const t = edge(p, x, y, nx, ny); tmax = Math.max(tmax, Math.hypot(t[0], t[1])); });
          const k = 0.7 / tmax;
          pts.forEach(([x, y, nx, ny]) => { const t = edge(p, x, y, nx, ny); if (Math.hypot(t[0], t[1]) > 0.02 * tmax) A.arrow(x, y, x + k * t[0], y + k * t[1], { color: 'orange', width: 2.2, head: 7 }); });
          // section
          A.line(xs.value, -1, xs.value, 1, { color: 'ink', width: 1.6, dash: [5, 4] });
          // profiles
          const ys = [...Array(41)].map((_, i) => -1 + i / 20), s1 = ys.map((y) => sxx(p, xs.value, y)), s2 = ys.map((y) => txy(p, xs.value, y));
          const mm = Math.max(0.5, ...s1.map(Math.abs), ...s2.map(Math.abs)) * 1.15;
          B.setView([-1, 1], [-mm, mm]);
          B.hline(0, { color: 'faint', width: 1 });
          B.fn((y) => sxx(p, xs.value, y), { domain: [-1, 1], color: 'accent', width: 2.6, fill: true, fillAlpha: 0.12 });
          B.fn((y) => txy(p, xs.value, y), { domain: [-1, 1], color: 'orange', width: 2.6, fill: true, fillAlpha: 0.12 });
          B.text('σxx', 0.9, sxx(p, xs.value, 0.9), { size: 12, color: 'accent', align: 'right', dy: -8 });
          B.text('τxy', 0.0, txy(p, xs.value, 0), { size: 12, color: 'orange', align: 'center', dy: -9 });
        });
        v.readout(() => {
          const p = P(), n = 400;
          let N = 0, M = 0, Vv = 0;
          for (let i = 0; i < n; i++) { const y = -1 + (2 * (i + 0.5)) / n, d = 2 / n; N += sxx(p, xs.value, y) * d; M += sxx(p, xs.value, y) * y * d; Vv += txy(p, xs.value, y) * d; }
          let Fx = 0, Fy = 0, Mo = 0;
          const seg = (x0, y0, x1, y1, nx, ny) => { for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, ds = Math.hypot(x1 - x0, y1 - y0) / n, t = edge(p, x, y, nx, ny); Fx += t[0] * ds; Fy += t[1] * ds; Mo += (x * t[1] - y * t[0]) * ds; } };
          seg(-2, 1, 2, 1, 0, 1); seg(-2, -1, 2, -1, 0, -1); seg(2, -1, 2, 1, 1, 0); seg(-2, -1, -2, 1, -1, 0);
          const h = 1e-4, x0 = 0.37, y0 = -0.21, eq = (sxx(p, x0 + h, y0) - sxx(p, x0 - h, y0)) / (2 * h) + (txy(p, x0, y0 + h) - txy(p, x0, y0 - h)) / (2 * h);
          const eq2 = (txy(p, x0 + h, y0) - txy(p, x0 - h, y0)) / (2 * h) + (syy(p, x0, y0 + h) - syy(p, x0, y0 - h)) / (2 * h);
          const l = lap(p), ok = Math.abs(l) < 1e-9;
          return `$\\sigma_{xx}=${num(2 * p.c, 2)}+${num(6 * p.d, 2)}y+${num(6 * p.e, 2)}xy+${num(2 * p.g, 2)}x^2$ etc. · Equilibrium residuals at a test point: $${num(eq, 8)}$, $${num(eq2, 8)}$ (always 0). · $\\nabla^4\\phi=24f+8g=${num(l, 3)}$ — ${ok ? '**biharmonic: compatible, a true elasticity solution**' : '**not biharmonic: stresses are in equilibrium but come from no displacement field**'}. · Section $x=${num(xs.value, 2)}$: $N=${num(N, 3)}$, $V=${num(Vv, 3)}$, $M=${num(M, 3)}$. · Whole-plate edge loads: $F=(${num(Fx, 4)},${num(Fy, 4)})$, moment $${num(Mo, 4)}$.`;
        });
      },
    },
  ],
};
