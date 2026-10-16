// Solid Mechanics & Structures — Chapter 3: Transformation of stress and strain
//
// Everything is computed from the formulas in the statements (rotation of axes, eigen-decomposition, Lamé's closed form, a small
// Q4 finite-element solve for the strain-rosette item). Stresses are in MPa; geometry is schematic unless a caption says otherwise.
// Material numbers (E = 200 GPa, nu = 0.3) are round illustrative values, not data for a specific alloy.
// Credits: Mohr's 1882 paper is confirmed by two secondary sources (Cambridge "Plasticity and Geomechanics" reference list, Wikipedia);
// Lamé's attribution is by name only (the year of the thick-cylinder solution was not confirmed), so item 3.9 is flagged verify.

import { num as num0, pmat, P3, drawBox, deg, rad, tr2, prin2, rot, drawElem, primeAxes, plateFE } from './ch03.shared.js';

const num = (x, d = 1) => num0(x, d).replace('-', '−'); // true minus sign in plain text
void P3;

export default {
  collection: 'solid',
  chapter: 3,
  title: 'Transformation of stress and strain',
  summary: String.raw`Rotating the axes changes the stress components but not the state of stress, and the components on every possible plane are captured by Mohr's circle. The extreme normal stresses, the principal stresses, are the eigenvalues of the stress tensor, and the largest shear is half their difference. The same mathematics governs strain and strain-gauge rosettes, and it applies directly to the pressure vessels that hold gases and liquids.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Method',
      name: 'Stress transformation in plane stress',
      statement: String.raw`Let a body be in plane stress with components $\sigma_x,\sigma_y,\tau_{xy}$ on the axes $x,y$. On the faces of an element whose axes $x',y'$ are turned by the angle $\theta$ counter-clockwise, the components are
$$\sigma_{x'}=\tfrac{\sigma_x+\sigma_y}{2}+\tfrac{\sigma_x-\sigma_y}{2}\cos2\theta+\tau_{xy}\sin2\theta,\qquad \tau_{x'y'}=-\tfrac{\sigma_x-\sigma_y}{2}\sin2\theta+\tau_{xy}\cos2\theta,$$
and $\sigma_{y'}$ is the same with $\theta+90^\circ$. All three are sinusoids of $2\theta$, and $\sigma_{x'}+\sigma_{y'}=\sigma_x+\sigma_y$ for every $\theta$. Tension is positive; the formulas hold for equilibrium of an element with no body couples (so $\tau_{yx}=\tau_{xy}$).`,
      idea: String.raw`Cut a small wedge whose inclined face has the normal $\mathbf n'=(\cos\theta,\sin\theta)$. Cauchy's formula (2.2) gives the traction $\mathbf t=\boldsymbol\sigma\mathbf n'$ on that face, and $\sigma_{x'}=\mathbf n'\!\cdot\!\mathbf t$, $\tau_{x'y'}=\mathbf e'_y\!\cdot\!\mathbf t$ are its components along the new axes. Products of $\cos\theta$ and $\sin\theta$ appear twice, which the double-angle identities turn into functions of $2\theta$. The symmetry $\tau_{yx}=\tau_{xy}$ (2.3) is what makes the matrix $\boldsymbol\sigma$ rotate as $\mathsf R\boldsymbol\sigma\mathsf R^{\mathsf T}$.`,
      caption: String.raw`Turn the dial $\theta$ (or drag in the plot): the dashed square is the original element, the solid one is turned, and the arrows on its faces are the components $\sigma_{x'},\sigma_{y'},\tau_{x'y'}$ (blue tension, red compression, orange shear). The plot shows the three components as functions of $\theta$: sinusoids that repeat every $180^\circ$, with $\sigma_{x'}$ and $\sigma_{y'}$ always summing to the same constant. Change the original state with the three sliders.`,
      deps: ['solid-2.9'],
      refs: ['Gere–Goodno §7.2'],
      tags: ['stress', 'transformation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stress_(mechanics)#Transformation_rule_of_the_stress_tensor' },
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 80, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, -20, { step: 1 });
        const tx = v.slider('$\\tau_{xy}$', -100, 100, 40, { step: 1 });
        const th = v.slider('rotation $\\theta$ (°)', 0, 180, 30, { step: 1 });
        const A = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 360, title: 'the element, turned by θ' });
        const B = v.stage({ x: [0, 180], y: [-250, 250], axes: 'box', gutter: true, height: 360, xlabel: 'rotation θ (°)', ylabel: 'stress (MPa)', xticks: [0, 30, 60, 90, 120, 150, 180], title: 'components are sinusoids of 2θ' });
        B.onDrag((x) => th.set(Math.round(Math.max(0, Math.min(180, x)))));
        v.legend([['accent', 'σx′'], ['purple', 'σy′'], ['orange', 'τx′y′']]);
        const k = 0.014, h = 0.95;
        v.render(() => {
          const a = rad(th.value), q = tr2(sx.value, sy.value, tx.value, a);
          A.path([[-h, -h], [h, -h], [h, h], [-h, h]], { close: true, color: 'faint', width: 1.4, dash: [5, 4] });
          drawElem(v, A, [0, 0], h, a, q.sx, q.sy, q.t, k);
          primeAxes(A, [-2.9, -2.6], a, 0.7);
          B.fn((d) => tr2(sx.value, sy.value, tx.value, rad(d)).sx, { color: 'accent', width: 2.4, domain: [0, 180], n: 181 });
          B.fn((d) => tr2(sx.value, sy.value, tx.value, rad(d)).sy, { color: 'purple', width: 2.4, domain: [0, 180], n: 181 });
          B.fn((d) => tr2(sx.value, sy.value, tx.value, rad(d)).t, { color: 'orange', width: 2.4, domain: [0, 180], n: 181 });
          B.vline(th.value, { color: 'muted', width: 1, dash: [4, 4] });
          B.dot(th.value, q.sx, { r: 6, color: 'accent' }); B.dot(th.value, q.sy, { r: 6, color: 'purple' }); B.dot(th.value, q.t, { r: 6, color: 'orange' });
        });
        v.readout(() => {
          const a = rad(th.value), q = tr2(sx.value, sy.value, tx.value, a);
          return `$\\theta=${th.value}^\\circ$: $\\sigma_{x'}=${num(q.sx, 1)}$, $\\sigma_{y'}=${num(q.sy, 1)}$, $\\tau_{x'y'}=${num(q.t, 1)}$ MPa. · Check: $\\sigma_{x'}+\\sigma_{y'}=${num(q.sx + q.sy, 2)}=\\sigma_x+\\sigma_y=${num(sx.value + sy.value, 2)}$ (invariant). · $\\sigma_{x'}$ at $\\theta+90^\\circ$ equals $\\sigma_{y'}=${num(tr2(sx.value, sy.value, tx.value, a + Math.PI / 2).sx, 2)}$ (the formula for $\\sigma_{y'}$ is the same with $\\theta+90^\\circ$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Principal stresses are eigenvalues of the stress tensor',
      statement: String.raw`Let $\boldsymbol\sigma$ be the (symmetric) stress matrix at a point. Then there is an orthonormal basis of **principal directions** $\mathbf n_1,\mathbf n_2(,\mathbf n_3)$ in which $\boldsymbol\sigma$ is diagonal. The diagonal entries, the **principal stresses** $\sigma_1\ge\sigma_2(\ge\sigma_3)$, are the eigenvalues of $\boldsymbol\sigma$, i.e. the roots of $\det(\boldsymbol\sigma-\sigma\mathsf I)=0$, and on the plane with normal $\mathbf n_i$ the shear stress is zero. Among all planes through the point, $\sigma_1$ is the largest and $\sigma_3$ (or $\sigma_2$ in plane stress) the smallest normal stress. In plane stress: $\sigma_{1,2}=\tfrac{\sigma_x+\sigma_y}{2}\pm\sqrt{(\tfrac{\sigma_x-\sigma_y}{2})^2+\tau_{xy}^2}$.`,
      idea: String.raw`The normal stress on the plane with unit normal $\mathbf n$ is $\sigma_n=\mathbf n^{\mathsf T}\boldsymbol\sigma\mathbf n$ (3.1), a quadratic form on the unit circle. Its stationary points satisfy $\boldsymbol\sigma\mathbf n=\lambda\mathbf n$ by Lagrange multipliers, which is the eigenvalue equation, and the real spectral theorem (ladr-7.29) guarantees real eigenvalues and orthogonal eigenvectors because $\boldsymbol\sigma$ is symmetric (2.3). At such a $\mathbf n$ the traction $\boldsymbol\sigma\mathbf n=\lambda\mathbf n$ is purely normal, so the shear stress vanishes; differentiating $\sigma_{x'}(\theta)$ and setting $\tau_{x'y'}=-\tfrac12\,d\sigma_{x'}/d\theta=0$ is the same condition.`,
      caption: String.raw`Turn the element with the dial and watch $\tau_{x'y'}$ in the lower curve cross zero exactly where $\sigma_{x'}$ (upper curve) touches its maximum $\sigma_1$ and minimum $\sigma_2$. The dashed lines through the element are the eigenvectors of the $2\times2$ matrix computed numerically; the green horizontal lines are its eigenvalues. "Snap" turns the element onto a principal direction, where the shear arrows disappear.`,
      deps: ['solid-3.1', 'ladr-7.29'],
      refs: ['Gere–Goodno §7.3'],
      tags: ['stress', 'eigenvalues'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cauchy_stress_tensor#Principal_stresses_and_stress_invariants' },
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 70, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, -30, { step: 1 });
        const tx = v.slider('$\\tau_{xy}$', -100, 100, 50, { step: 1 });
        const th = v.slider('rotation $\\theta$ (°)', -90, 90, 10, { step: 0.5 });
        const eig = () => { const e = v.M.eigSym([[sx.value, tx.value], [tx.value, sy.value]]); return { l1: e.values[0], l2: e.values[1], n1: e.vecs[0], n2: e.vecs[1] }; };
        v.button('snap to σ₁ direction', () => { const e = eig(); let d = deg(Math.atan2(e.n1[1], e.n1[0])); if (d > 90) d -= 180; if (d <= -90) d += 180; th.set(Math.round(d * 2) / 2); th.set(d); });
        const A = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 360, title: 'element and principal directions' });
        const B = v.stage({ x: [-90, 90], y: [-200, 200], axes: 'box', gutter: true, height: 360, xlabel: 'rotation θ (°)', ylabel: 'stress (MPa)', xticks: [-90, -60, -30, 0, 30, 60, 90], title: 'σx′ has its extremes where τx′y′ = 0' });
        B.onDrag((x) => th.set(Math.max(-90, Math.min(90, x))));
        v.legend([['accent', 'σx′(θ)'], ['orange', 'τx′y′(θ)'], ['green', 'eigenvalues', { dash: true }]]);
        const k = 0.012, h = 0.95;
        v.render(() => {
          const a = rad(th.value), q = tr2(sx.value, sy.value, tx.value, a), e = eig();
          drawElem(v, A, [0, 0], h, a, q.sx, q.sy, q.t, k);
          for (const [n, col] of [[e.n1, 'green'], [e.n2, 'teal']]) A.line(-2.7 * n[0], -2.7 * n[1], 2.7 * n[0], 2.7 * n[1], { color: col, width: 1.6, dash: [6, 4] });
          A.tex(String.raw`\mathbf n_1`, 2.9 * e.n1[0], 2.9 * e.n1[1] + 0.05, { size: 13, color: 'green' });
          A.tex(String.raw`\mathbf n_2`, 2.9 * e.n2[0], 2.9 * e.n2[1] + 0.05, { size: 13, color: 'teal' });
          B.fn((d) => tr2(sx.value, sy.value, tx.value, rad(d)).sx, { color: 'accent', width: 2.4, domain: [-90, 90], n: 181 });
          B.fn((d) => tr2(sx.value, sy.value, tx.value, rad(d)).t, { color: 'orange', width: 2.4, domain: [-90, 90], n: 181 });
          B.hline(e.l1, { color: 'green', width: 1.4, dash: [6, 4] }); B.hline(e.l2, { color: 'green', width: 1.4, dash: [6, 4] }); B.hline(0, { color: 'faint', width: 1 });
          B.tex(String.raw`\sigma_1`, -82, e.l1 + 16, { size: 13, color: 'green' }); B.tex(String.raw`\sigma_2`, -82, e.l2 + 16, { size: 13, color: 'green' });
          B.vline(th.value, { color: 'muted', width: 1, dash: [4, 4] });
          B.dot(th.value, q.sx, { r: 6, color: 'accent' }); B.dot(th.value, q.t, { r: 6, color: 'orange' });
        });
        v.readout(() => {
          const e = eig(), a = rad(th.value), q = tr2(sx.value, sy.value, tx.value, a);
          let mx = -Infinity, mn = Infinity; for (let d = -90; d <= 90; d += 0.1) { const z = tr2(sx.value, sy.value, tx.value, rad(d)).sx; mx = Math.max(mx, z); mn = Math.min(mn, z); }
          const thp = deg(Math.atan2(e.n1[1], e.n1[0]));
          return `$\\boldsymbol\\sigma=${pmat([[sx.value, tx.value], [tx.value, sy.value]], (x) => String(Math.round(x)))}$ has eigenvalues $\\sigma_1=${num(e.l1, 2)}$, $\\sigma_2=${num(e.l2, 2)}$ MPa, eigenvector $\\mathbf n_1$ at ${num(((thp % 180) + 180) % 180, 1)}° (mod 180°). · Scan of $\\sigma_{x'}(\\theta)$ over all angles: $\\max=${num(mx, 2)}$ and $\\min=${num(mn, 2)}$ MPa, matching. · Now: $\\sigma_{x'}=${num(q.sx, 1)}$, $\\tau_{x'y'}=${num(q.t, 1)}$ MPa.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Method',
      name: 'Mohr’s circle',
      statement: String.raw`For a plane stress state $(\sigma_x,\sigma_y,\tau_{xy})$ plot, in the $(\sigma,\tau)$ plane, the points $X=(\sigma_x,\tau_{xy})$ and $Y=(\sigma_y,-\tau_{xy})$ (the shear component is plotted with the sign of its action on the $x$ face; for $Y$ the sign is reversed). They are the ends of a diameter of a circle with centre $C=\tfrac{\sigma_x+\sigma_y}{2}$ on the $\sigma$-axis and radius $R=\sqrt{(\tfrac{\sigma_x-\sigma_y}{2})^2+\tau_{xy}^2}$. The state on the faces of an element turned by $\theta$ is the point of the circle reached by rotating $X$ through $2\theta$ **in the opposite sense** when $\tau$ is plotted upward (the same sense as the element when $\tau$ is plotted downward, as in many textbooks). The circle meets the $\sigma$-axis at the principal stresses $C\pm R$.`,
      idea: String.raw`The formulas of 3.1 say $\sigma_{x'}-C=\tfrac{\sigma_x-\sigma_y}{2}\cos2\theta+\tau_{xy}\sin2\theta$ and $\tau_{x'y'}=-\tfrac{\sigma_x-\sigma_y}{2}\sin2\theta+\tau_{xy}\cos2\theta$: with $\tfrac{\sigma_x-\sigma_y}{2}=R\cos\varphi$ and $\tau_{xy}=R\sin\varphi$ these are $R\cos(\varphi-2\theta)$ and $R\sin(\varphi-2\theta)$, so the point $(\sigma_{x'},\tau_{x'y'})$ stays at distance $R$ from $C$ and moves around the circle at twice the angular speed of the element. Mohr's graphical construction (1882) replaced the algebra by a drawing, an idea that also had an earlier graphical form in work of Culmann.`,
      caption: String.raw`Drag the gold point $X'$ around the circle (or use the slider): the element on the left turns by half the angle you sweep, and its stresses are read off the point's coordinates. $X'$ is the state on the $x'$ face, the opposite point $Y'$ is the $y'$ face. The red points on the $\sigma$-axis are the principal stresses and the dashed arc is the angle $2\theta$ from the original point $X$.`,
      deps: ['solid-3.1'],
      refs: ['Gere–Goodno §7.4'],
      tags: ['stress', 'graphical method'],
      credit: 'O. Mohr, 1882',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mohr%27s_circle' },
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 80, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, -20, { step: 1 });
        const tx = v.slider('$\\tau_{xy}$', -100, 100, 40, { step: 1 });
        const th = v.slider('rotation $\\theta$ (°)', -90, 90, 25, { step: 0.5 });
        const A = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 360, title: 'the element' });
        const M = v.stage({ x: [-210, 210], y: [-150, 150], equal: true, axes: true, height: 360, title: 'Mohr’s circle (τ plotted upward)', xlabel: 'σ', ylabel: 'τ' });
        const geo = () => { const c = (sx.value + sy.value) / 2, d = (sx.value - sy.value) / 2, R = Math.hypot(d, tx.value), phi0 = Math.atan2(tx.value, d); return { c, d, R, phi0 }; };
        const H = M.handle(sx.value, tx.value, { color: 'gold', r: 8, constrain: (x, y) => { const g = geo(); const dx = x - g.c, dy = y, r = Math.hypot(dx, dy) || 1; return [g.c + (g.R * dx) / r, (g.R * dy) / r]; } });
        let lock = false;
        H.onDrag = () => {
          const g = geo(); if (g.R < 1e-9) return;
          const phi = Math.atan2(H.y, H.x - g.c); let t = (g.phi0 - phi) / 2; t = ((t + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2; // (−90°, 90°]
          lock = true; th.set(deg(t)); lock = false;
        };
        void lock;
        const k = 0.012, h = 0.95;
        v.render(() => {
          const g = geo(), a = rad(th.value), q = tr2(sx.value, sy.value, tx.value, a), p = prin2(sx.value, sy.value, tx.value);
          drawElem(v, A, [0, 0], h, a, q.sx, q.sy, q.t, k);
          A.path([[-h, -h], [h, -h], [h, h], [-h, h]], { close: true, color: 'faint', width: 1.2, dash: [5, 4] });
          primeAxes(A, [-2.9, -2.6], a, 0.7);
          const mm = Math.max(60, (Math.abs(g.c) + g.R) * 1.3); M.setView([-mm, mm], [-0.75 * mm, 0.75 * mm]);
          const out = (P, d) => { const dx = P[0] - g.c, dy = P[1], r = Math.hypot(dx, dy) || 1; return [P[0] + (d * mm * dx) / r, P[1] + (d * mm * dy) / r]; };
          M.circle(g.c, 0, g.R, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.06 });
          const X = [sx.value, tx.value], Y = [sy.value, -tx.value];
          M.line(X[0], X[1], Y[0], Y[1], { color: 'muted', width: 1.4, dash: [4, 4] });
          M.dot(X[0], X[1], { r: 5, color: 'ink' }); { const o = out(X, 0.07); M.tex('X', o[0], o[1], { size: 13, color: 'ink' }); }
          M.dot(Y[0], Y[1], { r: 5, color: 'ink' }); { const o = out(Y, 0.07); M.tex('Y', o[0], o[1], { size: 13, color: 'ink' }); }
          M.dot(g.c, 0, { r: 3.5, color: 'muted' }); M.tex('C', g.c + 0.04 * mm, 0.06 * mm, { size: 12, color: 'muted' });
          M.dot(p.s1, 0, { r: 5.5, color: 'red' }); M.dot(p.s2, 0, { r: 5.5, color: 'red' });
          M.tex(String.raw`\sigma_1`, p.s1 + 0.04 * mm, -0.13 * mm, { size: 13, color: 'red' }); M.tex(String.raw`\sigma_2`, p.s2 - 0.04 * mm, -0.13 * mm, { size: 13, color: 'red' });
          // current point: handle position follows θ
          const phi = g.phi0 - 2 * a, P1 = [g.c + g.R * Math.cos(phi), g.R * Math.sin(phi)], P2 = [g.c - g.R * Math.cos(phi), -g.R * Math.sin(phi)];
          H.set(P1[0], P1[1]);
          M.line(P1[0], P1[1], P2[0], P2[1], { color: 'gold', width: 1.8 });
          M.dot(P2[0], P2[1], { r: 6, color: 'gold', hollow: true });
          { const o1 = out(P1, 0.08), o2 = out(P2, 0.08); M.tex("Y′", o2[0], o2[1], { size: 13, color: 'gold' }); M.tex("X′", o1[0], o1[1], { size: 13, color: 'gold' }); }
          const arc = []; const r0 = Math.max(10, g.R * 0.35);
          for (let i = 0; i <= 30; i++) { const f = g.phi0 + ((phi - g.phi0) * i) / 30; arc.push([g.c + r0 * Math.cos(f), r0 * Math.sin(f)]); }
          if (g.R > 1e-6) M.path(arc, { color: 'orange', width: 2, dash: [4, 3] });
          M.line(P1[0], P1[1], P1[0], 0, { color: 'gold', width: 1, dash: [2, 3] }); M.line(P1[0], P1[1], 0, P1[1], { color: 'gold', width: 1, dash: [2, 3] });
        });
        v.readout(() => {
          const g = geo(), a = rad(th.value), q = tr2(sx.value, sy.value, tx.value, a), p = prin2(sx.value, sy.value, tx.value);
          const phi = g.phi0 - 2 * a, Px = g.c + g.R * Math.cos(phi), Py = g.R * Math.sin(phi);
          return `Circle: $C=${num(g.c, 1)}$, $R=${num(g.R, 1)}$ MPa; principal stresses $C\\pm R=${num(p.s1, 1)},\\ ${num(p.s2, 1)}$. · $\\theta=${num(th.value, 1)}^\\circ$ → point turned by $2\\theta=${num(2 * th.value, 1)}^\\circ$ at $(${num(Px, 2)},\\,${num(Py, 2)})$; algebra of 3.1 gives $(\\sigma_{x'},\\tau_{x'y'})=(${num(q.sx, 2)},\\,${num(q.t, 2)})$. · Distance from $C$ to that point: $${num(Math.hypot(q.sx - g.c, q.t), 3)}=R$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Proposition',
      name: 'Maximum in-plane shear stress',
      statement: String.raw`In plane stress with principal stresses $\sigma_1\ge\sigma_2$, the largest shear stress on planes perpendicular to the plane of the stress is
$$\tau_{\max}^{\text{in-plane}}=\frac{\sigma_1-\sigma_2}{2}=\sqrt{\Big(\frac{\sigma_x-\sigma_y}{2}\Big)^2+\tau_{xy}^2},$$
and it acts on planes turned $45^\circ$ from the principal planes. On those planes the normal stress is not zero but the average $\tfrac{\sigma_x+\sigma_y}{2}=\tfrac{\sigma_1+\sigma_2}{2}$ on both faces. The statement concerns shear in the plane of the stress only; the largest shear over all planes in space can be bigger (3.5).`,
      idea: String.raw`On Mohr's circle (3.3) the shear stress is the height of the point above the $\sigma$-axis, and a circle of radius $R$ centred on the axis has height at most $R$, reached at the top and bottom points. These are a quarter turn on the circle from the principal points $C\pm R$, i.e. $2\theta=90^\circ$, so $\theta=45^\circ$ on the element. The centre abscissa is the average normal stress, which therefore acts on those planes.`,
      caption: String.raw`Left: the principal element ($\tau=0$, stresses $\sigma_1,\sigma_2$) and, beside it, the element turned by $45^\circ$ with $\tau_{\max}$ on all four faces together with the average normal stress. Middle: the same two states are the left/right and top points of the circle. Right: $\tau_{x'y'}(\theta)$ peaks at $R$. Push $\sigma_1$ and $\sigma_2$ to the same sign to see that $\tau_{\max}^{\text{in-plane}}$ can be smaller than half of the largest principal stress.`,
      deps: ['solid-3.3'],
      refs: ['Gere–Goodno §7.3'],
      tags: ['stress', 'shear'],
      viz(v) {
        const sx = v.slider('$\\sigma_x$ (MPa)', -100, 100, 70, { step: 1 });
        const sy = v.slider('$\\sigma_y$', -100, 100, 10, { step: 1 });
        const tx = v.slider('$\\tau_{xy}$', -100, 100, 30, { step: 1 });
        const A = v.stage({ x: [-5.2, 5.2], y: [-2.3, 2.3], equal: true, axes: false, height: 250, full: true, title: 'principal element (left) and maximum-shear element (right)' });
        const M = v.stage({ x: [-210, 210], y: [-150, 150], equal: true, axes: true, height: 320, title: 'Mohr’s circle', xlabel: 'σ', ylabel: 'τ' });
        const G = v.stage({ x: [-90, 90], y: [-150, 150], axes: 'box', gutter: true, height: 320, xlabel: 'rotation θ from the x axis (°)', ylabel: 'τx′y′ (MPa)', xticks: [-90, -45, 0, 45, 90], title: 'τx′y′(θ)' });
        const k = 0.012, h = 0.85;
        v.render(() => {
          const p = prin2(sx.value, sy.value, tx.value), R = p.R, thp = p.thp, ths = thp + Math.PI / 4;
          const q1 = tr2(sx.value, sy.value, tx.value, thp), q2 = tr2(sx.value, sy.value, tx.value, ths);
          drawElem(v, A, [-2.6, 0], h, thp, q1.sx, q1.sy, 0, k, { names: [String.raw`\sigma_1`, String.raw`\sigma_2`, ''] });
          drawElem(v, A, [2.6, 0], h, ths, q2.sx, q2.sy, q2.t, k, { names: ['', '', String.raw`\tau_{\max}`] });
          A.text(`turned ${num(deg(thp), 1)}° from x`, -2.6, -1.95, { size: 11.5, color: 'muted', align: 'center' });
          A.text(`+45° → ${num(deg(ths), 1)}°: σavg = ${num(p.c, 1)} on all four faces`, 2.6, -1.95, { size: 11.5, color: 'muted', align: 'center' });
          const mm = Math.max(60, (Math.abs(p.c) + R) * 1.35); M.setView([-mm, mm], [-0.75 * mm, 0.75 * mm]);
          M.circle(p.c, 0, R, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.06 });
          M.line(p.s2, 0, p.s1, 0, { color: 'muted', width: 1.2, dash: [4, 4] });
          M.dot(p.s1, 0, { r: 5.5, color: 'red' }); M.dot(p.s2, 0, { r: 5.5, color: 'red' });
          M.tex(String.raw`\sigma_1`, p.s1 + 0.05 * mm, -0.09 * mm, { size: 13, color: 'red' }); M.tex(String.raw`\sigma_2`, p.s2 - 0.05 * mm, -0.09 * mm, { size: 13, color: 'red' });
          M.dot(p.c, R, { r: 6, color: 'orange' }); M.dot(p.c, -R, { r: 6, color: 'orange' });
          M.line(p.c, 0, p.c, R, { color: 'orange', width: 2 });
          M.tex(String.raw`\tau_{\max}=R`, p.c + 0.17 * mm, R * 0.5, { size: 13, color: 'orange' });
          M.dot(p.c, 0, { r: 3.5, color: 'muted' });
          G.fn((d) => tr2(sx.value, sy.value, tx.value, rad(d)).t, { color: 'orange', width: 2.4, domain: [-90, 90], n: 181 });
          G.hline(R, { color: 'orange', width: 1.2, dash: [5, 4] }); G.hline(-R, { color: 'orange', width: 1.2, dash: [5, 4] });
          const t0 = deg(ths) > 90 ? deg(ths) - 180 : deg(ths); G.dot(t0, R, { r: 6, color: 'orange' });
          G.vline(deg(thp) > 90 ? deg(thp) - 180 : deg(thp), { color: 'red', width: 1, dash: [3, 4] });
          G.hline(0, { color: 'faint', width: 1 });
        });
        v.readout(() => {
          const p = prin2(sx.value, sy.value, tx.value), q2 = tr2(sx.value, sy.value, tx.value, p.thp + Math.PI / 4);
          const abs3 = Math.max(Math.abs(p.s1), Math.abs(p.s2), Math.abs(p.s1 - p.s2)) / 2;
          return `$\\sigma_{1,2}=${num(p.s1, 1)},\\ ${num(p.s2, 1)}$ MPa. · $\\tau_{\\max}=(\\sigma_1-\\sigma_2)/2=${num((p.s1 - p.s2) / 2, 2)}$; direct computation on the element turned by $\\theta_p+45^\\circ$: $\\tau_{x'y'}=${num(q2.t, 2)}$, $\\sigma_{x'}=\\sigma_{y'}=${num(q2.sx, 1)}=(\\sigma_1+\\sigma_2)/2$. · Largest shear over all planes in space (with $\\sigma_3=0$): ${num(abs3, 1)} MPa${abs3 > (p.s1 - p.s2) / 2 + 1e-9 ? ' — larger than the in-plane value, see 3.5' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Method',
      name: 'Three-dimensional Mohr’s circles and absolute maximum shear',
      statement: String.raw`Let the principal stresses at a point be $\sigma_1\ge\sigma_2\ge\sigma_3$. For a plane with unit normal $\mathbf n=(n_1,n_2,n_3)$ in the principal frame, the normal and shear stresses are $\sigma_n=\sum\sigma_in_i^2$ and $\tau^2=\sum\sigma_i^2n_i^2-\sigma_n^2$. The points $(\sigma_n,\tau)$ of all planes fill exactly the closed region inside the circle with diameter $[\sigma_3,\sigma_1]$ and outside the two circles with diameters $[\sigma_2,\sigma_3]$ and $[\sigma_1,\sigma_2]$. The **absolute maximum shear stress** is the radius of the large circle, $\tau_{\rm abs}=\tfrac12(\sigma_1-\sigma_3)$, on planes bisecting the $\sigma_1$ and $\sigma_3$ axes. In plane stress ($\sigma_3=0$ out of plane) it can exceed the in-plane maximum $\tfrac12(\sigma_1-\sigma_2)$.`,
      idea: String.raw`Three equations hold for the three numbers $(n_1^2,n_2^2,n_3^2)$: they sum to $1$, give $\sigma_n$, and give $\sigma_n^2+\tau^2$. Solving for $n_1^2,n_2^2,n_3^2$ and demanding all three be $\ge0$ turns into the three inequalities $\tau^2+(\sigma_n-\sigma_2)(\sigma_n-\sigma_3)\ge0$, $\tau^2+(\sigma_n-\sigma_1)(\sigma_n-\sigma_3)\le0$ and $\tau^2+(\sigma_n-\sigma_1)(\sigma_n-\sigma_2)\ge0$: inside the large circle, outside the two small ones. The two-dimensional circle of 3.3 is the special case in which $\mathbf n$ stays in a principal plane (one $n_i=0$), which gives points on the boundary circles. Eigenvalues come from 3.2.`,
      caption: String.raw`The grey dots are the stresses on 3000 random planes through the point: they fill the region between the three circles and never leave it. The gold dot is the plane whose normal you set with the two angles. Try "closed cylinder" (hoop $\sigma_1$, axial $\sigma_2=\sigma_1/2$, $\sigma_3\approx0$ on the free surface) or "both tension": the largest circle, which sets the absolute maximum shear, is the one involving the zero out-of-plane stress, not the in-plane circle.`,
      deps: ['solid-3.2', 'solid-3.3'],
      refs: ['Gere–Goodno §7.6'],
      tags: ['stress', 'mohr'],
      viz(v) {
        const s1 = v.slider('$\\sigma_1$ (MPa)', -100, 100, 100, { step: 1 });
        const s2 = v.slider('$\\sigma_2$', -100, 100, 50, { step: 1 });
        const s3 = v.slider('$\\sigma_3$', -100, 100, 0, { step: 1 });
        const al = v.slider('polar angle $\\alpha$ of $\\mathbf n$ from axis 3 (°)', 0, 90, 55, { step: 1 });
        const ph = v.slider('azimuth $\\varphi$ (°)', 0, 360, 40, { step: 1 });
        const cases = { gen: [100, 50, -30], cyl: [100, 50, 0], both: [80, 40, 0], pure: [60, 0, -60] };
        v.select('state', [{ value: 'gen', label: 'general' }, { value: 'cyl', label: 'closed cylinder' }, { value: 'both', label: 'both tension' }, { value: 'pure', label: 'pure shear' }], 'cyl', { onChange: (c) => { const q = cases[c]; s1.set(q[0]); s2.set(q[1]); s3.set(q[2]); } });
        const M = v.stage({ x: [-150, 150], y: [-110, 110], equal: true, axes: true, height: 360, title: 'the three Mohr circles', xlabel: 'σ', ylabel: 'τ' });
        const B = v.stage({ x: [0, 4], y: [0, 110], axes: 'box', gutter: true, height: 360, title: 'the three maximum shear stresses', xticks: [[0.5, 'σ₂–σ₃'], [1.5, 'σ₁–σ₂'], [2.5, 'σ₁–σ₃']], ylabel: 'τ (MPa)' });
        const rg = v.rng(11), N = 3000, cloud = [];
        for (let i = 0; i < N; i++) { const z = 2 * rg() - 1, p = 2 * Math.PI * rg(), r = Math.sqrt(1 - z * z); cloud.push([r * Math.cos(p), r * Math.sin(p), z]); }
        const sorted = () => [s1.value, s2.value, s3.value].sort((a, b) => b - a);
        const st = (n, S) => { const sn = S[0] * n[0] ** 2 + S[1] * n[1] ** 2 + S[2] * n[2] ** 2; return [sn, Math.sqrt(Math.max(0, S[0] ** 2 * n[0] ** 2 + S[1] ** 2 * n[1] ** 2 + S[2] ** 2 * n[2] ** 2 - sn * sn))]; };
        v.render(() => {
          const S = sorted(), c = M.ctx;
          { const ctr = (S[0] + S[2]) / 2, sp = Math.max(40, S[0] - S[2]), w = Math.max(sp * 0.75, 50); M.setView([ctr - w, ctr + w], [-0.8 * w, 0.8 * w]); B.setView([0, 4], [0, Math.max(30, (S[0] - S[2]) / 2 * 1.35)]); }
          c.save(); c.fillStyle = v.color('muted', 0.35);
          for (const n of cloud) { const [a, b] = st(n, S); c.fillRect(M.X(a) - 1, M.Y(b) - 1, 2, 2); }
          c.restore();
          const circ = (a, b, col, w) => M.circle((a + b) / 2, 0, Math.abs(a - b) / 2, { color: col, width: w, fill: false });
          circ(S[0], S[2], 'accent', 2.4); circ(S[0], S[1], 'purple', 2); circ(S[1], S[2], 'teal', 2);
          const a = rad(al.value), f = rad(ph.value), n = [Math.sin(a) * Math.cos(f), Math.sin(a) * Math.sin(f), Math.cos(a)];
          // n is given in the frame (axis 1, axis 2, axis 3) ← indices 0, 1, 2 of the sorted stresses
          const [sn, tt] = st(n, S);
          M.dot(sn, tt, { r: 7, color: 'gold' }); M.line(sn, tt, sn, 0, { color: 'gold', width: 1, dash: [2, 3] });
          for (const [x, l] of [[S[0], '1'], [S[1], '2'], [S[2], '3']]) { M.dot(x, 0, { r: 4.5, color: 'red' }); M.tex(String.raw`\sigma_${l}`, x, -0.1 * Math.max(40, S[0] - S[2]), { size: 12.5, color: 'red' }); }
          M.line((S[0] + S[2]) / 2, 0, (S[0] + S[2]) / 2, (S[0] - S[2]) / 2, { color: 'accent', width: 1.4, dash: [4, 3] });
          const t23 = (S[1] - S[2]) / 2, t12 = (S[0] - S[1]) / 2, t13 = (S[0] - S[2]) / 2;
          B.rect(0.15, 0, 0.85, t23, { fill: 'teal', fillAlpha: 0.5, color: 'teal' }); B.rect(1.15, 0, 1.85, t12, { fill: 'purple', fillAlpha: 0.5, color: 'purple' }); B.rect(2.15, 0, 2.85, t13, { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 2.5 });
          B.text(num(t23, 1), 0.5, t23 + 6, { size: 12, align: 'center' }); B.text(num(t12, 1), 1.5, t12 + 6, { size: 12, align: 'center' }); B.text(num(t13, 1), 2.5, t13 + 6, { size: 12, align: 'center', weight: 700 });
          B.text('absolute max', 3.5, t13 * 0.5, { size: 12, color: 'accent', align: 'center' });
        });
        v.readout(() => {
          const S = sorted(), a = rad(al.value), f = rad(ph.value), n = [Math.sin(a) * Math.cos(f), Math.sin(a) * Math.sin(f), Math.cos(a)];
          const [sn, tt] = st(n, S); let mt = 0; for (const q of cloud) mt = Math.max(mt, st(q, S)[1]);
          const i1 = tt * tt + (sn - S[1]) * (sn - S[2]), i2 = tt * tt + (sn - S[0]) * (sn - S[2]), i3 = tt * tt + (sn - S[0]) * (sn - S[1]);
          return `Sorted: $\\sigma_1,\\sigma_2,\\sigma_3=${S.map((x) => num(x, 0)).join(',\\ ')}$ MPa. · Gold plane: $\\sigma_n=${num(sn, 1)}$, $\\tau=${num(tt, 1)}$; region tests $${num(i1, 0)}\\ge0$, $${num(i2, 0)}\\le0$, $${num(i3, 0)}\\ge0$ (all hold). · $\\tau_{\\rm abs}=(\\sigma_1-\\sigma_3)/2=${num((S[0] - S[2]) / 2, 1)}$; the largest shear among the 3000 planes is ${num(mt, 1)}; in-plane value $(\\sigma_1-\\sigma_2)/2=${num((S[0] - S[1]) / 2, 1)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Stress invariants and deviatoric stress',
      statement: String.raw`For a stress tensor $\boldsymbol\sigma$ the three **principal invariants** are
$$I_1=\operatorname{tr}\boldsymbol\sigma,\qquad I_2=\tfrac12\big[(\operatorname{tr}\boldsymbol\sigma)^2-\operatorname{tr}(\boldsymbol\sigma^2)\big],\qquad I_3=\det\boldsymbol\sigma,$$
the coefficients of the characteristic polynomial $\sigma^3-I_1\sigma^2+I_2\sigma-I_3$; they do not change when the axes are rotated, and in terms of the principal stresses $I_1=\sigma_1+\sigma_2+\sigma_3$, $I_2=\sigma_1\sigma_2+\sigma_2\sigma_3+\sigma_3\sigma_1$, $I_3=\sigma_1\sigma_2\sigma_3$. The tensor splits uniquely into a **hydrostatic** part $\sigma_m\mathsf I$ with $\sigma_m=I_1/3$ and a **deviatoric** part $\mathbf s=\boldsymbol\sigma-\sigma_m\mathsf I$, which has zero trace. The invariant $J_2=\tfrac12\mathbf s\!:\!\mathbf s=\tfrac13(I_1^2-3I_2)$ and the von Mises stress $\sigma_{\rm vM}=\sqrt{3J_2}$ are also invariant.`,
      idea: String.raw`Rotating the axes replaces $\boldsymbol\sigma$ by $\mathsf R\boldsymbol\sigma\mathsf R^{\mathsf T}$, which has the same eigenvalues (3.2): the characteristic polynomial is built from the eigenvalues alone, so its coefficients are unchanged. The split into $\sigma_m\mathsf I$ and $\mathbf s$ commutes with rotations, because $\mathsf R\,\mathsf I\,\mathsf R^{\mathsf T}=\mathsf I$. The hydrostatic part changes volume and not shape, the deviatoric part changes shape and not (to first order) volume; this is the basis of the yield criteria of chapter 4.`,
      caption: String.raw`Set the principal stresses and then spin the axes with the angle slider about an axis you can re-roll: the six components in the first plot (all different functions of the rotation angle) wobble, while the three invariant-based stresses in the second plot stay perfectly flat. The right panel shows the split: a cube that only changes size (hydrostatic) and a box that only changes shape (deviatoric); dimensions are drawn $\propto1+0.006\,\sigma$, schematically.`,
      deps: ['solid-3.2'],
      refs: ['Timoshenko–Goodier ch. 7'],
      tags: ['stress', 'invariants'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cauchy_stress_tensor#Stress_deviator_tensor' },
      viz(v) {
        const a1 = v.slider('$\\sigma_1$ (MPa)', -100, 100, 90, { step: 1 });
        const a2 = v.slider('$\\sigma_2$', -100, 100, 30, { step: 1 });
        const a3 = v.slider('$\\sigma_3$', -100, 100, -40, { step: 1 });
        const psi = v.slider('spin angle $\\psi$ (°)', 0, 360, 70, { step: 1 });
        const rg = v.rng(5);
        let axis = [0.3, 0.5, 0.81];
        const unit = (a) => { const n = Math.hypot(...a); return a.map((x) => x / n); };
        axis = unit(axis);
        v.button('new random axis', () => { axis = unit([rg.normal(), rg.normal(), rg.normal()]); });
        const rod = (ax, t) => { const [x, y, z] = ax, c = Math.cos(t), s = Math.sin(t), C = 1 - c; return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]]; };
        const Q = (() => { const R1 = rod([0, 0, 1], rad(25)), R2 = rod([1, 0, 0], rad(35)); return v.M.matMul(R1, R2); })();
        const base = () => v.M.matMul(v.M.matMul(Q, [[a1.value, 0, 0], [0, a2.value, 0], [0, 0, a3.value]]), v.M.transpose(Q));
        const tensor = (t) => { const R = rod(axis, t); return v.M.matMul(v.M.matMul(R, base()), v.M.transpose(R)); };
        const inv = (S) => { const I1 = S[0][0] + S[1][1] + S[2][2]; const I2 = S[0][0] * S[1][1] + S[1][1] * S[2][2] + S[2][2] * S[0][0] - S[0][1] ** 2 - S[1][2] ** 2 - S[0][2] ** 2; return { I1, I2, I3: v.M.det(S), vm: Math.sqrt(Math.max(0, I1 * I1 - 3 * I2)) }; };
        const comp = (S) => [S[0][0], S[1][1], S[2][2], S[0][1], S[1][2], S[0][2]];
        const cols = ['accent', 'purple', 'teal', 'orange', 'gold', 'pink'], nm = ['σxx', 'σyy', 'σzz', 'σxy', 'σyz', 'σzx'];
        const A = v.stage({ x: [0, 360], y: [-160, 160], axes: 'box', gutter: true, height: 320, xlabel: 'spin angle ψ (°)', ylabel: 'component (MPa)', xticks: [0, 90, 180, 270, 360], title: 'components change' });
        const B = v.stage({ x: [0, 360], y: [-160, 160], axes: 'box', gutter: true, height: 320, xlabel: 'spin angle ψ (°)', ylabel: 'stress (MPa)', xticks: [0, 90, 180, 270, 360], title: 'invariants do not' });
        const C = v.stage({ x: [-3.4, 3.4], y: [-2.2, 2.2], equal: true, axes: false, height: 320, title: 'hydrostatic + deviatoric' });
        A.onDrag((x) => psi.set(Math.round(Math.max(0, Math.min(360, x))))); B.onDrag((x) => psi.set(Math.round(Math.max(0, Math.min(360, x)))));
        v.render(() => {
          const t0 = rad(psi.value);
          for (let c = 0; c < 6; c++) A.fn((d) => comp(tensor(rad(d)))[c], { color: cols[c], width: 2, domain: [0, 360], n: 120 });
          A.vline(psi.value, { color: 'muted', width: 1, dash: [4, 4] });
          const S = tensor(t0), cc = comp(S);
          for (let c = 0; c < 6; c++) A.dot(psi.value, cc[c], { r: 5, color: cols[c] });
          B.fn((d) => inv(tensor(rad(d))).I1 / 3, { color: 'blue', width: 2.4, domain: [0, 360], n: 60 });
          B.fn((d) => inv(tensor(rad(d))).vm, { color: 'red', width: 2.4, domain: [0, 360], n: 60 });
          B.fn((d) => Math.cbrt(inv(tensor(rad(d))).I3), { color: 'green', width: 2.4, domain: [0, 360], n: 60 });
          B.vline(psi.value, { color: 'muted', width: 1, dash: [4, 4] });
          const iv = inv(S); B.dot(psi.value, iv.I1 / 3, { r: 5, color: 'blue' }); B.dot(psi.value, iv.vm, { r: 5, color: 'red' }); B.dot(psi.value, Math.cbrt(iv.I3), { r: 5, color: 'green' });
          const sm = (a1.value + a2.value + a3.value) / 3, dev = [a1.value - sm, a2.value - sm, a3.value - sm];
          const f = (x) => 1 + 0.006 * x;
          drawBox(v, C, [0.55 * f(sm), 0.55 * f(sm), 0.55 * f(sm)], [-1.9, 0], { fill: sm >= 0 ? 'accent' : 'red', alpha: 0.2, hidden: false });
          drawBox(v, C, [0.55 * f(dev[0]), 0.55 * f(dev[1]), 0.55 * f(dev[2])], [1.9, 0], { fill: 'orange', alpha: 0.2, hidden: false });
          C.text('σm I: size only', -1.9, -1.55, { size: 12, color: 'ink', align: 'center' }); C.text('s: shape only', 1.9, -1.55, { size: 12, color: 'ink', align: 'center' });
          C.text('+', 0, 0, { size: 24, color: 'muted', align: 'center', baseline: 'middle' });
        });
        v.legend([['accent', 'σxx'], ['purple', 'σyy'], ['teal', 'σzz'], ['orange', 'σxy'], ['gold', 'σyz'], ['pink', 'σzx'], ['blue', 'I₁/3'], ['red', 'σvM'], ['green', '∛I₃']]);
        v.readout(() => {
          const S = tensor(rad(psi.value)), S0 = base(), i = inv(S), i0 = inv(S0), sm = i.I1 / 3;
          const dv = S.map((r, a) => r.map((x, b) => x - (a === b ? sm : 0)));
          return `$\\boldsymbol\\sigma=${pmat(S, (x) => String(Math.round(x)))}$ (rotated), invariants now $I_1=${num(i.I1, 1)},\\ I_2=${num(i.I2, 0)},\\ I_3=${num(i.I3, 0)}$ vs unrotated $${num(i0.I1, 1)},\\ ${num(i0.I2, 0)},\\ ${num(i0.I3, 0)}$. · $\\sigma_m=${num(sm, 1)}$, $\\operatorname{tr}\\mathbf s=${num(dv[0][0] + dv[1][1] + dv[2][2], 3)}$, $\\sigma_{\\rm vM}=\\sqrt{3J_2}=${num(i.vm, 2)}$ MPa (unrotated ${num(i0.vm, 2)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Method',
      name: 'Plane strain transformation and strain rosettes',
      statement: String.raw`Plane strain components $\varepsilon_x,\varepsilon_y,\gamma_{xy}$ (engineering shear strain $\gamma=2\varepsilon_{xy}$) transform under a rotation of axes exactly like stress with $\tau\to\gamma/2$:
$$\varepsilon_{x'}=\tfrac{\varepsilon_x+\varepsilon_y}{2}+\tfrac{\varepsilon_x-\varepsilon_y}{2}\cos2\theta+\tfrac{\gamma_{xy}}{2}\sin2\theta,$$
so that there is a Mohr's circle in the plane $(\varepsilon,\gamma/2)$ and principal strains $\varepsilon_{1,2}=\tfrac{\varepsilon_x+\varepsilon_y}{2}\pm\sqrt{(\tfrac{\varepsilon_x-\varepsilon_y}{2})^2+(\tfrac{\gamma_{xy}}2)^2}$. A strain gauge measures only the normal strain along its own axis, so three gauges in three different directions are needed: for the **rectangular rosette** (gauges at $0^\circ,45^\circ,90^\circ$ to a reference axis) the full state is $\varepsilon_x=\varepsilon_a$, $\varepsilon_y=\varepsilon_c$, $\gamma_{xy}=2\varepsilon_b-\varepsilon_a-\varepsilon_c$.`,
      idea: String.raw`Strain is the symmetric part of the displacement gradient (2.5), so the normal strain along a unit direction $\mathbf n$ is $\mathbf n^{\mathsf T}\boldsymbol\varepsilon\,\mathbf n$, the same quadratic form as in 3.1 with $\gamma/2$ in the role of $\tau$. A plane state has three unknowns, and the readings at $\theta=0^\circ,45^\circ,90^\circ$ give three linear equations that can be solved by hand: the $45^\circ$ gauge fixes $\gamma_{xy}$. The conversion from the solved strains to stress needs Hooke's law (2.7) and a known material, which is a separate step. Bonded-wire strain gauges themselves date to the late 1930s (Simmons at Caltech and Ruge at MIT, independently); rosette formats came later.`,
      caption: String.raw`The coloured plate is a clamped cantilever loaded at its free end (a plane-stress finite-element solution, steel-like $E=200$ GPa, $\nu=0.3$, illustrative), coloured by von Mises stress. Drag the black dot: three gauges (a, b, c at $\alpha,\alpha+45^\circ,\alpha+90^\circ$) read the true normal strain along their axes. The right panel rebuilds the Mohr circle of strain from those three readings (accent) and compares it with the FE strain (green, dashed). Add gauge noise to see how errors in three numbers move the principal strains and especially the principal direction.`,
      deps: ['solid-2.5', 'solid-3.1'],
      refs: ['Gere–Goodno §7.7'],
      tags: ['strain', 'measurement'],
      scope: String.raw`Small strains; a plane-stress model of the plate with perfectly bonded, point-like gauges (no gauge-length averaging or transverse sensitivity).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Strain_gauge#Strain_gauge_rosettes' },
      viz(v) {
        const W = 400, Hh = 200, nx = 32, ny = 16;
        const fe = plateFE({ W, H: Hh, nx, ny, E: 200000, nu: 0.3 });
        const base = fe.solve({ py: -1 }), U = base.u;
        const load = v.slider('tip shear traction $p$ (MPa)', 1, 20, 8, { step: 0.5 });
        const al = v.slider('rosette angle $\\alpha$ (°)', -90, 90, 0, { step: 1 });
        const noise = v.slider('gauge error (µε)', 0, 60, 0, { step: 1 });
        const P = v.stage({ x: [-20, 445], y: [-30, 230], equal: true, axes: false, height: 330, title: 'cantilever plate with a rosette' });
        const M = v.stage({ x: [-1200, 1200], y: [-900, 900], equal: true, axes: true, height: 330, title: 'Mohr’s circle of strain', xlabel: 'ε (µε)', ylabel: 'γ/2 (µε)' });
        const Hd = P.handle(250, 100, { color: 'ink', r: 8, constrain: { x: [20, 380], y: [20, 180] } });
        const eps = (x, y) => { // strain at the element centre containing (x,y) for unit load, then scaled
          const i = Math.max(0, Math.min(nx - 1, Math.floor(x / fe.dx))), j = Math.max(0, Math.min(ny - 1, Math.floor(y / fe.dy)));
          const n00 = fe.id(i, j), n10 = fe.id(i + 1, j), n11 = fe.id(i + 1, j + 1), n01 = fe.id(i, j + 1), ux = (n) => U[2 * n], uy = (n) => U[2 * n + 1];
          const ex = (ux(n10) - ux(n00) + ux(n11) - ux(n01)) / (2 * fe.dx), ey = (uy(n01) - uy(n00) + uy(n11) - uy(n10)) / (2 * fe.dy);
          const g = (ux(n01) - ux(n00) + ux(n11) - ux(n10)) / (2 * fe.dy) + (uy(n10) - uy(n00) + uy(n11) - uy(n01)) / (2 * fe.dx);
          return [ex, ey, g];
        };
        const scale = () => load.value * 1e6; // unit solution was for p = −1 MPa: sign handled by (−1)*(−1); result in µε
        const readAt = (E, a) => { const [ex, ey, g] = E, c = Math.cos(a), s = Math.sin(a); return ex * c * c + ey * s * s + (g / 2) * 2 * s * c; };
        const state = () => {
          const raw = eps(Hd.x, Hd.y), E = raw.map((z) => z * scale()); // µε, load downward
          const a = rad(al.value), dirs = [a, a + Math.PI / 4, a + Math.PI / 2];
          const err = [1, -0.7, 0.9].map((z) => z * noise.value);
          const R = dirs.map((d, i) => readAt(E, d) + err[i]);
          const ex = R[0], ey = R[2], gam = 2 * R[1] - R[0] - R[2];
          const pr = prin2(ex, ey, gam / 2), pt = prin2(E[0], E[1], E[2] / 2);
          return { E, a, dirs, R, ex, ey, gam, pr, pt, thpR: a + pr.thp, thpT: pt.thp };
        };
        v.render(() => {
          const sorted = Float64Array.from(base.vm).sort(), sc = sorted[Math.floor(sorted.length * 0.9)] * load.value; // colour scale: 90th percentile (the clamp corners are stress singularities)
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
            const t = (base.vm[i * ny + j] * load.value) / (sc || 1), col = v.ramp(Math.min(1, t), 'accent', 'panel'), c = P.ctx;
            c.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
            const x0 = P.X(i * fe.dx), x1 = P.X((i + 1) * fe.dx), y0 = P.Y(j * fe.dy), y1 = P.Y((j + 1) * fe.dy);
            c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) + 0.6, Math.abs(y1 - y0) + 0.6);
          }
          P.path([[0, 0], [W, 0], [W, Hh], [0, Hh]], { close: true, color: 'ink', width: 2, fill: false });
          P.line(0, -4, 0, Hh + 4, { color: 'ink', width: 4 });
          P.arrow(W + 8, Hh * 0.5 + 40, W + 8, Hh * 0.5 + 6, { color: 'orange', width: 3, head: 9 });
          P.text('p', W + 24, Hh * 0.5 + 22, { size: 12, color: 'orange', math: true });
          const s = state(), labs = ['a', 'b', 'c'], cols = ['accent', 'purple', 'teal'];
          s.dirs.forEach((d, i) => { const ex = Math.cos(d), ey = Math.sin(d); P.line(Hd.x - 24 * ex, Hd.y - 24 * ey, Hd.x + 24 * ex, Hd.y + 24 * ey, { color: cols[i], width: 4.5 }); P.text(labs[i], Hd.x + 36 * ex, Hd.y + 36 * ey, { size: 12.5, color: cols[i], weight: 700, align: 'center', baseline: 'middle' }); });
          const g = s.pt.c, Rt = s.pt.R, Rr = s.pr.R, cr = s.pr.c;
          // Mohr stage: auto-fit to the data
          const m = Math.max(Math.abs(g) + Rt, Math.abs(cr) + Rr, 60) * 1.3; M.setView([-m, m], [-m * 0.75, m * 0.75]);
          M.circle(g, 0, Rt, { color: 'green', width: 2.4, dash: [6, 4], fill: false });
          M.circle(cr, 0, Rr, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.07 });
          s.R.forEach((r, i) => { M.dot(r, 0, { r: 5, color: cols[i] }); M.tex(labs[i], r, m * (0.07 + 0.07 * i), { size: 12.5, color: cols[i] }); M.line(r, 0, r, m * (0.04 + 0.07 * i), { color: cols[i], width: 1, dash: [2, 2] }); });
          M.dot(s.pr.s1, 0, { r: 5.5, color: 'red', hollow: true }); M.dot(s.pr.s2, 0, { r: 5.5, color: 'red', hollow: true });
          void sc;
        });
        v.readout(() => {
          const s = state(), d = (z) => num(deg(z), 1);
          return `Readings: $\\varepsilon_a=${num(s.R[0], 0)}$, $\\varepsilon_b=${num(s.R[1], 0)}$, $\\varepsilon_c=${num(s.R[2], 0)}$ µε → $\\varepsilon_x'=${num(s.ex, 0)}$, $\\varepsilon_y'=${num(s.ey, 0)}$, $\\gamma'=2\\varepsilon_b-\\varepsilon_a-\\varepsilon_c=${num(s.gam, 0)}$ µε (in the rosette axes). · Principal strains from the rosette: ${num(s.pr.s1, 0)}, ${num(s.pr.s2, 0)} µε at ${d(s.thpR)}°; from the FE field: ${num(s.pt.s1, 0)}, ${num(s.pt.s2, 0)} µε at ${d(s.thpT)}°. · Without gauge error the two agree exactly because three normal strains determine a plane state.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Model',
      name: 'Thin-walled pressure vessels',
      statement: String.raw`A closed cylindrical vessel of mean radius $r$ and wall thickness $t\ll r$ under internal gauge pressure $p$ carries, away from the ends, the uniform membrane stresses
$$\sigma_{\rm hoop}=\frac{pr}{t},\qquad \sigma_{\rm axial}=\frac{pr}{2t},$$
and a sphere of the same $r$ and $t$ carries $\sigma=\dfrac{pr}{2t}$ in every tangential direction. The radial stress (between $-p$ at the bore and $0$ outside) is negligible next to these, so the wall is in plane stress with principal stresses $\sigma_{\rm hoop},\sigma_{\rm axial}$. The model assumes uniform stress through the wall, which requires roughly $r/t\gtrsim10$, and it ignores the disturbed zones near ends, supports and openings.`,
      idea: String.raw`Cut the cylinder along a plane through its axis (3.1 is not needed here, only equilibrium): the pressure on the projected area $2r\,L$ is carried by two wall strips of area $tL$, so $2\sigma_{\rm hoop}tL=p\,2rL$. Cut it across: the pressure on the end cap $p\pi r^2$ is carried by the ring of area $2\pi rt$, so $\sigma_{\rm axial}\,2\pi rt=p\pi r^2$. The sphere has only the second kind of cut in every direction. Hoop stress is therefore twice the axial stress, which is why cooked sausages and boiler pipes split along their length. The two stresses are principal (no shear on these cuts) and feed the Mohr's circles of 3.3 and 3.5.`,
      caption: String.raw`Change the pressure, radius and wall thickness. The left panel is the free body of half a ring cut along a diameter (pressure pushes the half up, two wall strips pull it down), the middle panel is the cut across the cylinder (end pressure vs ring of wall), and the bars compare the cylinder's hoop and axial stress with the sphere's. The last line of the readout checks the force balances to rounding error. Let $t$ grow until $r/t<10$ and the model starts to disagree with the exact thick-wall solution of 3.9.`,
      deps: ['solid-3.1'],
      refs: ['Gere–Goodno §8.2', 'Gere–Goodno §8.3'],
      tags: ['pressure vessel', 'membrane stress'],
      scope: String.raw`Thin wall $t\lesssim r/10$, uniform internal pressure, away from end caps, supports and openings; linear elastic.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cylinder_stress' },
      viz(v) {
        const p = v.slider('pressure $p$ (MPa)', 0.1, 10, 2, { step: 0.1 });
        const r = v.slider('mean radius $r$ (mm)', 50, 1000, 400, { step: 10 });
        const t = v.slider('wall thickness $t$ (mm)', 1, 120, 10, { step: 1 });
        const A = v.stage({ x: [-3.3, 3.3], y: [-3.3, 3.3], equal: true, axes: false, height: 340, title: 'cut along the axis: half a ring' });
        const B = v.stage({ x: [-4.8, 3.6], y: [-3, 3], equal: true, axes: false, height: 340, title: 'cut across the cylinder' });
        const C = v.stage({ x: [0, 3.4], y: [0, 1], axes: 'box', gutter: true, height: 340, title: 'stress for the same p, r, t', xticks: [[0.5, 'hoop'], [1.4, 'axial'], [2.3, 'sphere']], ylabel: 'σ / (pr/t)' });
        const sig = () => ({ h: (p.value * r.value) / t.value, a: (p.value * r.value) / (2 * t.value), s: (p.value * r.value) / (2 * t.value) });
        v.render(() => {
          const wallv = Math.max(0.1, Math.min(0.9, 2.5 * t.value / r.value)) * 0.75, R = 2.4, ro = R + wallv / 2, ri = R - wallv / 2;
          // A: upper half ring, pressure arrows up, hoop forces down at cut
          const half = (rr) => { const q = []; for (let i = 0; i <= 60; i++) { const a = (Math.PI * i) / 60; q.push([rr * Math.cos(a), rr * Math.sin(a)]); } return q; };
          const ring = half(ro).concat(half(ri).reverse());
          A.path(ring, { close: true, color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.2 });
          for (let i = 1; i < 8; i++) { const a = (Math.PI * i) / 8, x = (ri - 0.05) * Math.cos(a), y = (ri - 0.05) * Math.sin(a); A.arrow(x * 0.62, y * 0.62, x, y, { color: 'orange', width: 2.2, head: 7 }); }
          A.text('p', 0, 0.9, { size: 14, color: 'orange', math: true, align: 'center' });
          for (const sg of [-1, 1]) { const x = sg * R; A.arrow(x, 0.05, x, -1.0, { color: 'accent', width: 3.5, head: 10 }); A.tex(String.raw`\sigma_h t L`, x, -1.3, { size: 13, color: 'accent' }); }
          A.line(-ro - 0.3, 0, ro + 0.3, 0, { color: 'muted', width: 1, dash: [4, 4] });
          A.measure(-ri, -2.1, ri, -2.1, '2r');
          A.text('2σh·t·L = p·2r·L', 0, 2.95, { size: 12.5, color: 'ink', align: 'center' });
          // B: side view of a cylinder, cut across at x=0: end cap pressure vs ring
          const L1 = -3.4, L2 = 3.0, hh = 1.7, w = Math.max(0.12, Math.min(0.5, 2.5 * t.value / r.value));
          B.path([[L1, -hh], [L2, -hh], [L2, hh], [L1, hh]], { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.1 });
          B.rect(L2 - w, -hh, L2, hh, { fill: 'accent', fillAlpha: 0.3, color: 'ink', width: 1.5 });
          B.rect(L1, hh - w, L2, hh, { fill: 'accent', fillAlpha: 0.3, color: 'ink', width: 0 }); B.rect(L1, -hh, L2, -hh + w, { fill: 'accent', fillAlpha: 0.3, color: 'ink', width: 0 });
          B.line(L1, -hh - 0.3, L1, hh + 0.3, { color: 'muted', width: 1.4, dash: [5, 4] });
          for (let i = -2; i <= 2; i++) B.arrow(L2 - w - 1.1, i * 0.6, L2 - w - 0.05, i * 0.6, { color: 'orange', width: 2.4, head: 7 });
          for (const sg of [-1, 1]) B.arrow(L1 + 0.02, sg * (hh - w / 2), L1 - 0.95, sg * (hh - w / 2), { color: 'accent', width: 3.4, head: 9 });
          B.text('p·πr² on the end cap', L2 - w - 1.7, -hh - 0.55, { size: 12.5, color: 'orange', align: 'center' });
          B.text('σa·2πrt (wall ring)', L1 + 0.1, hh + 0.55, { size: 12.5, color: 'accent', align: 'left' });
          B.text('cut', L1, -hh - 0.55, { size: 11.5, color: 'muted', align: 'center' });
          const s = sig();
          const mx = s.h;
          [[0.1, 0.9, s.h, 'accent'], [1.0, 1.8, s.a, 'teal'], [1.9, 2.7, s.s, 'purple']].forEach(([x0, x1, val, col]) => { C.rect(x0, 0, x1, val / mx, { fill: col, fillAlpha: 0.5, color: col }); C.text(`${num(val, val < 10 ? 2 : 1)}`, (x0 + x1) / 2, val / mx + 0.05, { size: 12, align: 'center' }); });
          C.hline(1, { color: 'faint', width: 1, dash: [4, 4] }); C.hline(0.5, { color: 'faint', width: 1, dash: [4, 4] });
          C.text(`r/t = ${num(r.value / t.value, 1)}${r.value / t.value < 10 ? '  (not thin)' : ''}`, 1.7, 0.93, { size: 12, color: r.value / t.value < 10 ? 'red' : 'muted', align: 'center' });
        });
        v.readout(() => {
          const s = sig(), rt = r.value / t.value;
          const f1 = 2 * s.h * t.value - p.value * 2 * r.value, f2 = s.a * 2 * Math.PI * r.value * t.value - p.value * Math.PI * r.value ** 2;
          const ri = r.value - t.value / 2, ro = r.value + t.value / 2, ex = (p.value * (ro * ro + ri * ri)) / (ro * ro - ri * ri);
          return `Cylinder: $\\sigma_{\\rm hoop}=pr/t=${num(s.h, 1)}$ MPa, $\\sigma_{\\rm axial}=pr/2t=${num(s.a, 1)}$ MPa (ratio ${num(s.h / s.a, 2)}); sphere $pr/2t=${num(s.s, 1)}$ MPa. Largest in-plane shear $(\\sigma_h-\\sigma_a)/2=${num(s.h / 4, 1)}$ MPa. · Force balances (per unit length / total): $2\\sigma_ht-2pr=${num(f1, 6)}$, $\\sigma_a2\\pi rt-p\\pi r^2=${num(f2, 6)}$. · $r/t=${num(rt, 1)}$; the exact hoop stress at the bore (Lamé, 3.9) is ${num(ex, 1)} MPa, ${num((100 * (ex - s.h)) / s.h, 1)}% from the thin-wall value.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Thick-walled cylinders: Lamé’s solution',
      statement: String.raw`Let a long circular cylinder with inner radius $r_i$ and outer radius $r_o$ carry uniform internal pressure $p_i$ and external pressure $p_o$, and let it deform axisymmetrically in plane stress or plane strain. Then the radial and hoop stresses at radius $r$ are
$$\sigma_r=A-\frac{B}{r^2},\qquad \sigma_\theta=A+\frac{B}{r^2},\qquad A=\frac{p_ir_i^2-p_or_o^2}{r_o^2-r_i^2},\quad B=\frac{r_i^2r_o^2(p_i-p_o)}{r_o^2-r_i^2},$$
with compressive radial stress equal to the applied pressure on each surface, $\sigma_r(r_i)=-p_i$, $\sigma_r(r_o)=-p_o$. With a closed end the axial stress is uniform, $\sigma_z=p_ir_i^2/(r_o^2-r_i^2)$ (for $p_o=0$). For internal pressure alone the hoop stress is largest at the bore, $\sigma_\theta(r_i)=p_i\,\dfrac{r_o^2+r_i^2}{r_o^2-r_i^2}$.`,
      idea: String.raw`In axisymmetry the equilibrium equation of 2.4 reduces to $d\sigma_r/dr+(\sigma_r-\sigma_\theta)/r=0$. Writing $\sigma_r$ and $\sigma_\theta$ through the Airy function $\phi(r)$ (2.12), $\sigma_r=\phi'/r$, $\sigma_\theta=\phi''$, and demanding compatibility gives an Euler equation whose bounded solutions are $\phi=\tfrac A2r^2+B\ln r$ (plus a term in $r^2\ln r$ that is excluded when the displacement must be single-valued). The two constants $A,B$ come from the pressures at the two surfaces. The sum $\sigma_r+\sigma_\theta=2A$ is uniform across the wall, and as $r_o/r_i\to1$ the solution tends to the thin-wall result of 3.8.`,
      caption: String.raw`The left plot shows $\sigma_\theta$ (orange) and $\sigma_r$ (accent) through the wall from the bore ($r=r_i=1$) to the outer surface. The dashed line is the thin-wall estimate $p\,r_m/t$ with the mean radius: for thin walls it is nearly the average of the exact curve, for thick walls it badly underestimates the stress at the bore. The right plot sets the exact bore stress against the thin-wall value as the radius ratio grows. Add an external pressure with the second slider; the two boundary values of $\sigma_r$ stay pinned to the pressures.`,
      deps: ['solid-3.8', 'solid-2.12'],
      refs: ['Timoshenko–Goodier ch. 4'],
      tags: ['elasticity', 'pressure vessel'],
      credit: 'G. Lamé',
      scope: String.raw`Linear elasticity, uniform pressures, long cylinder far from the ends, isotropic homogeneous material; the stress field does not depend on $E$ or $\nu$ for plane-strain/plane-stress ends with uniform axial strain.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cylinder_stress' },
      viz(v) {
        const k = v.slider('radius ratio $r_o/r_i$', 1.02, 5, 2, { step: 0.01 });
        const pi = v.slider('internal pressure $p_i$ (MPa)', 0, 100, 100, { step: 1 });
        const po = v.slider('external pressure $p_o$', 0, 100, 0, { step: 1 });
        const sol = () => { const ri = 1, ro = k.value, d = ro * ro - ri * ri, A = (pi.value * ri * ri - po.value * ro * ro) / d, B = (ri * ri * ro * ro * (pi.value - po.value)) / d; return { A, B, ri, ro, sr: (r) => A - B / (r * r), st: (r) => A + B / (r * r) }; };
        const G = v.stage({ x: [1, 5], y: [-110, 330], axes: 'box', gutter: true, height: 340, xlabel: 'radius r / rᵢ', ylabel: 'stress (MPa)', title: 'stress through the wall' });
        const R = v.stage({ x: [1, 5], y: [0, 3], axes: 'box', gutter: true, height: 340, xlabel: 'radius ratio rₒ/rᵢ', ylabel: 'σθ(bore) / (p rₘ/t)', title: 'thin-wall estimate vs exact (pᵢ only)' });
        const thinRatio = (kk) => { const ex = (kk * kk + 1) / (kk * kk - 1), rm = (1 + kk) / 2, tt = kk - 1; return ex / (rm / tt); };
        v.legend([['orange', 'hoop σθ'], ['accent', 'radial σr'], ['muted', 'thin-wall pr/t', { dash: true }]]);
        v.render(() => {
          const s = sol();
          G.setView([1, Math.max(1.5, s.ro * 1.02)], [Math.min(-110, -pi.value * 1.1), Math.max(120, s.st(1) * 1.12)]);
          G.fn(s.st, { color: 'orange', width: 2.6, domain: [1, s.ro], n: 80 });
          G.fn(s.sr, { color: 'accent', width: 2.6, domain: [1, s.ro], n: 80 });
          const thin = ((pi.value - po.value) * ((1 + s.ro) / 2)) / (s.ro - 1);
          G.hline(thin, { color: 'muted', width: 1.6, dash: [6, 4] });
          G.hline(0, { color: 'faint', width: 1 });
          G.dot(1, s.st(1), { r: 6, color: 'orange' }); G.dot(s.ro, s.st(s.ro), { r: 6, color: 'orange' });
          G.dot(1, s.sr(1), { r: 6, color: 'accent' }); G.dot(s.ro, s.sr(s.ro), { r: 6, color: 'accent' });
          R.fn(thinRatio, { color: 'orange', width: 2.6, domain: [1.02, 5], n: 120 }); R.hline(1, { color: 'muted', width: 1.2, dash: [5, 4] });
          R.dot(k.value, thinRatio(k.value), { r: 7, color: 'gold' });
          R.text('thin-wall value = 1', 3.4, 0.9, { size: 12, color: 'muted' });
        });
        v.readout(() => {
          const s = sol(), n = 4000; let I = 0;
          for (let i = 0; i < n; i++) { const r = 1 + ((s.ro - 1) * (i + 0.5)) / n; I += s.st(r) * ((s.ro - 1) / n); }
          const bal = pi.value * 1 - po.value * s.ro;
          return `$\\sigma_r(r_i)=${num(s.sr(1), 2)}$ (= $-p_i=${num(-pi.value, 0)}$), $\\sigma_r(r_o)=${num(s.sr(s.ro), 2)}$ (= $-p_o$). · $\\sigma_\\theta(r_i)=${num(s.st(1), 1)}$, $\\sigma_\\theta(r_o)=${num(s.st(s.ro), 1)}$ MPa; $\\sigma_r+\\sigma_\\theta=2A=${num(2 * s.A, 2)}$ at every $r$. · Force balance $\\int\\sigma_\\theta\\,dr=${num(I, 3)}$ vs $p_ir_i-p_or_o=${num(bal, 3)}$. · For $p_i$ alone the exact bore stress is ${num(thinRatio(s.ro), 2)}× the thin-wall $p\\,r_m/t$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Method',
      name: 'Combined loadings',
      statement: String.raw`When a member carries several loads at once, and the material stays linearly elastic with small deformations, the stress at a point is the sum of the stresses from each load acting alone (superposition): an axial force $N$ contributes $N/A$, a bending moment $M$ contributes $-My/I$, a torque $T$ contributes the shear $TR/J$ on the outer surface, and a transverse shear force $V$ a shear stress given by the shear formula of chapter 6. The resulting components $(\sigma,\tau)$ at the chosen point are then treated as a plane stress state, whose principal stresses and maximum shear follow from Mohr's circle. The **critical point** is the point around the section where the chosen measure of severity (largest principal stress, largest shear, or an equivalent stress) is greatest.`,
      idea: String.raw`Linear elasticity makes stress a linear function of the loads, so each load's stress field can be computed separately with the formulas of chapters 1, 5 and 6 and added componentwise; this superposition fails if deformation changes the geometry noticeably or the material yields. Stresses of different origin add only if they act on the same plane in the same direction, so normal stresses from $N$ and $M$ add to a single $\sigma_z$ and torsion and transverse shear add to a single $\tau$. The pair $(\sigma_z,\tau)$ on the cross-section face is the state $(\sigma_x,\tau_{xy})$ of 3.1 with $\sigma_y=0$, whose Mohr's circle (3.3) gives the principal stresses.`,
      caption: String.raw`A hollow circular signpost is loaded at its top by wind $P$ (horizontal, from the left), has a self-weight $W$ above the base, and the sign's offset adds a torque $T$. Drag the black dot around the base cross-section: the ring is shaded by the maximum shear stress at each point, the small element shows $\sigma_z$ and $\tau$ there, and the Mohr circle gives the principal stresses. The black diamond marks the critical point found by scanning the whole ring. Set $T=0$, then $P=0$, to see each load alone.`,
      deps: ['solid-3.3'],
      refs: ['Gere–Goodno §8.5'],
      tags: ['superposition', 'design'],
      scope: String.raw`Linear elastic, small deformations, a thin-walled tube (the transverse-shear distribution $\tau_V=-P\sin\psi/(\pi R_mt)$ is the thin-ring approximation; torsion uses $TR/J$ at the outer surface), section far from the load and from the support; local stress concentrations at the base plate ignored. Dimensions and loads are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Superposition_principle' },
      viz(v) {
        const P = v.slider('wind force $P$ (kN)', 0, 10, 4, { step: 0.1 });
        const hh = v.slider('height of resultant $h$ (m)', 1, 10, 6, { step: 0.1 });
        const Tq = v.slider('torque $T$ (kN·m)', -10, 10, 6, { step: 0.1 });
        const Wt = v.slider('weight $W$ (kN)', 0, 20, 5, { step: 0.1 });
        const D = v.slider('outer diameter $D$ (mm)', 100, 400, 220, { step: 5 });
        const tw = v.slider('wall $t$ (mm)', 3, 20, 8, { step: 0.5 });
        const S = v.stage({ x: [-3.3, 3.3], y: [-3.3, 3.3], equal: true, axes: false, height: 340, title: 'base cross-section (wind from the left)' });
        const M = v.stage({ x: [-80, 80], y: [-60, 60], equal: true, axes: true, height: 340, title: 'Mohr’s circle at the chosen point', xlabel: 'σ (MPa)', ylabel: 'τ (MPa)' });
        const Rg = 2.3;
        const H = S.handle(Rg, 0, { color: 'ink', r: 8, constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(Rg * x) / r, (Rg * y) / r]; } });
        const geo = () => { const Ro = D.value / 2, Ri = Math.max(1, Ro - tw.value), Rm = (Ro + Ri) / 2, A = Math.PI * (Ro * Ro - Ri * Ri), I = (Math.PI / 4) * (Ro ** 4 - Ri ** 4), J = 2 * I; return { Ro, Ri, Rm, A, I, J }; };
        const at = (psi) => { // MPa (N, mm): kN → 1e3 N, kN·m → 1e6 N·mm
          const g = geo(), N = -Wt.value * 1e3, Mb = P.value * 1e3 * hh.value * 1e3, T0 = Tq.value * 1e6;
          const xx = g.Ro * Math.cos(psi);
          const sN = N / g.A, sB = -(Mb / g.I) * xx, tT = (T0 * g.Ro) / g.J, tV = -(P.value * 1e3 * Math.sin(psi)) / (Math.PI * g.Rm * tw.value);
          const sz = sN + sB, tau = tT + tV, p = prin2(sz, 0, tau);
          return { sN, sB, tT, tV, sz, tau, p, vm: Math.sqrt(sz * sz + 3 * tau * tau) };
        };
        const crit = () => { let best = { psi: 0, v: -1 }; for (let i = 0; i < 720; i++) { const a = (i / 720) * 2 * Math.PI, q = at(a); if (q.p.R > best.v) best = { psi: a, v: q.p.R, q }; } return best; };
        v.render(() => {
          const g = geo(), ro = 2.8, ri = ro * (g.Ri / g.Ro), crt = crit(), mx = crt.v || 1;
          const ctx = S.ctx; // shade the ring in 180 sectors by the maximum shear stress
          for (let i = 0; i < 180; i++) {
            const a0 = (i / 180) * 2 * Math.PI, a1 = ((i + 1.15) / 180) * 2 * Math.PI, q = at((a0 + a1) / 2), col = v.ramp(Math.min(1, q.p.R / mx), 'orange', 'panel');
            ctx.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; ctx.beginPath();
            ctx.moveTo(S.X(ro * Math.cos(a0)), S.Y(ro * Math.sin(a0))); ctx.lineTo(S.X(ro * Math.cos(a1)), S.Y(ro * Math.sin(a1))); ctx.lineTo(S.X(ri * Math.cos(a1)), S.Y(ri * Math.sin(a1))); ctx.lineTo(S.X(ri * Math.cos(a0)), S.Y(ri * Math.sin(a0))); ctx.closePath(); ctx.fill();
          }
          S.circle(0, 0, ro, { color: 'ink', width: 1.8, fill: false }); S.circle(0, 0, ri, { color: 'ink', width: 1.8, fill: false });
          for (const yy of [-0.7, 0, 0.7]) S.arrow(-3.25, yy, -2.95, yy, { color: 'muted', width: 2.2, head: 7 });
          S.text('wind', -3.1, 1.15, { size: 11.5, color: 'muted', align: 'center' });
          const cp = crt.psi, cx = Rg * Math.cos(cp), cy = Rg * Math.sin(cp);
          S.path([[cx, cy + 0.16], [cx + 0.16, cy], [cx, cy - 0.16], [cx - 0.16, cy]], { close: true, color: 'ink', width: 2, fill: 'ink', fillAlpha: 0.9 });
          const psi = Math.atan2(H.y, H.x), q = at(psi);
          // element at the chosen point: z (axis of the post) points up, s is the tangent to the ring
          const mq = Math.max(1, Math.abs(crt.q.sz), Math.abs(crt.q.tau)), kk = 0.85 / mq, h = 0.5;
          drawElem(v, S, [0, 0], h, Math.PI / 2, q.sz, 0, q.tau, kk, { names: [String.raw`\sigma_z`, '', String.raw`\tau`], thresh: 0.01 });
          S.text('element at the dot (z up)', 0, -1.75, { size: 11.5, color: 'muted', align: 'center' });
          // Mohr
          const c = q.p.c, Rr = q.p.R, m = Math.max(10, Math.abs(crt.q.p.c) + crt.q.p.R, Math.abs(c) + Rr) * 1.3; M.setView([-m, m], [-m * 0.75, m * 0.75]);
          M.circle(c, 0, Rr, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.07 });
          M.line(q.sz, q.tau, 0, -q.tau, { color: 'muted', width: 1.3, dash: [4, 4] });
          M.dot(q.sz, q.tau, { r: 6.5, color: 'gold' }); M.dot(0, -q.tau, { r: 6.5, color: 'gold', hollow: true });
          M.tex('z', q.sz + m * 0.07, q.tau + m * 0.07, { size: 13, color: 'gold' }); M.tex('s', m * 0.07, -q.tau - m * 0.06, { size: 13, color: 'gold' });
          M.dot(q.p.s1, 0, { r: 5, color: 'red' }); M.dot(q.p.s2, 0, { r: 5, color: 'red' });
          M.tex(String.raw`\sigma_1`, q.p.s1 + m * 0.05, m * 0.1, { size: 13, color: 'red' }); M.tex(String.raw`\sigma_2`, q.p.s2 - m * 0.05, m * 0.1, { size: 13, color: 'red' });
          M.dot(c, Rr, { r: 4.5, color: 'orange' });
        });
        v.readout(() => {
          const psi = Math.atan2(H.y, H.x), q = at(psi), c = crit(), d = deg(psi);
          return `Point at ${num(((d % 360) + 360) % 360, 0)}° (0° = downwind side): axial $${num(q.sN, 2)}$ + bending $${num(q.sB, 2)}$ = $\\sigma_z=${num(q.sz, 2)}$ MPa; torsion $${num(q.tT, 2)}$ + transverse shear $${num(q.tV, 2)}$ = $\\tau=${num(q.tau, 2)}$ MPa. · Principal stresses ${num(q.p.s1, 1)}, ${num(q.p.s2, 1)} MPa; $\\tau_{\\max}=${num(q.p.R, 1)}$ MPa. · Critical point (largest $\\tau_{\\max}$) at ${num(Math.round(((deg(c.psi) % 360) + 360) % 360) % 360, 0)}°: ${num(c.v, 1)} MPa.`;
        });
      },
    },
  ],
};
