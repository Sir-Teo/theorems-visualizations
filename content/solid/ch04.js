// Solid Mechanics & Structures — Chapter 4: Failure, plasticity and fatigue (items 4.1–4.5; 4.6–4.10 are in ch04-b.js)
//
// Everything here is computed from the formulas in the statements. The yield stress Y = 250 MPa, the cast-iron tensile strength
// 207 MPa (ASTM A48 class 30 minimum) and the soil numbers are round illustrative values. Steel curve in 4.5: S355 data of chapter 1.
// Credits checked: Tresca 1864 and Huber 1904 / von Mises 1913 / Hencky 1924 (Wikipedia "Yield surface"); Taylor & Quinney 1931
// (Crossref 10.1098/rsta.1932.0009). Rankine (1857) and Mohr (c. 1900) are from memory and flagged verify; Coulomb's essay is dated 1776
// (published) per Wikipedia "Mohr–Coulomb theory".

import { num as num0, prin2, rad, deg, vm2, tresca2, tresca3, hexagon, ellipse, rayVM, rayTresca, curveOf, MATS } from './ch04.shared.js';

const num = (x, d = 1) => num0(x, d).replace('-', '−');

export default {
  collection: 'solid',
  chapter: 4,
  title: 'Failure, plasticity and fatigue',
  summary: String.raw`When does a material yield or break under a combined state of stress? Yield criteria answer by reducing the stress tensor to one number — the largest shear stress, or the distortion energy — and comparing it with a tensile test. Brittle materials need different criteria, and repeated loading brings a separate failure mode altogether: fatigue, governed by S–N curves, mean-stress corrections and cumulative damage.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Principle',
      name: 'Tresca (maximum shear stress) criterion',
      statement: String.raw`A ductile metal that yields in a simple tension test at the stress $Y$ is assumed to yield, under any state of stress with principal values $\sigma_1\ge\sigma_2\ge\sigma_3$, when the largest shear stress reaches the value it has in that test:
$$\tau_{\max}=\frac{\sigma_1-\sigma_3}{2}=\frac Y2 .$$
Safe states satisfy $\sigma_1-\sigma_3<Y$. In the plane of the two non-zero principal stresses of a plane-stress state ($\sigma_3=0$) the yield locus is a **hexagon** with corners $(Y,0),(Y,Y),(0,Y),(-Y,0),(-Y,-Y),(0,-Y)$. The criterion does not depend on the mean stress: adding the same hydrostatic stress to all three principal stresses changes nothing.`,
      idea: String.raw`Plastic flow in metals is slip on crystal planes, driven by shear, so the largest shear stress is a natural measure of how close a state is to yielding. The state's largest Mohr circle (3.5) has radius $(\sigma_1-\sigma_3)/2$, and in a tension test the radius is $Y/2$; the criterion demands the same radius. The hexagon appears because $\sigma_1-\sigma_3$ must be computed from the largest and smallest of $\sigma_1,\sigma_2,0$, and which pair that is changes from sector to sector of the plane.`,
      caption: String.raw`Drag the gold point in the $(\sigma_1,\sigma_2)$ plane (the stress component $\sigma_3$ can be set with the slider; $\sigma_3=0$ is plane stress). The shaded region is safe; the black curve is the Tresca locus. On the right the three Mohr circles of the same state: the large one is the circle that decides, and it turns red when it touches the lines $\tau=\pm Y/2$. Move along the diagonal $\sigma_1=\sigma_2$ in the first quadrant: the locus is at $\sigma=Y$, whereas along $\sigma_1=-\sigma_2$ (pure shear) it is reached at $\tau=Y/2$.`,
      deps: ['solid-3.5'],
      refs: ['Gere–Goodno §7.6'],
      tags: ['yield', 'failure'],
      scope: String.raw`For ductile metals, quasi-static loading, no strong dependence on mean stress. Moderately conservative: it never predicts a higher strength than the von Mises criterion (4.2).`,
      credit: 'H. Tresca, 1864',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Yield_surface#Tresca_yield_surface' },
      viz(v) {
        const Y = 250;
        const s3 = v.slider('$\\sigma_3$ (MPa)', -250, 250, 0, { step: 5 });
        const A = v.stage({ x: [-400, 400], y: [-400, 400], equal: true, axes: true, height: 380, title: 'safe region in the (σ₁, σ₂) plane', xlabel: 'σ₁', ylabel: 'σ₂' });
        const B = v.stage({ x: [-330, 330], y: [-190, 190], equal: true, axes: true, height: 380, title: 'Mohr’s three circles', xlabel: 'σ', ylabel: 'τ' });
        const H = A.handle(150, 60, { color: 'gold', r: 8 });
        const sorted = () => [H.x, H.y, s3.value].sort((a, b) => b - a);
        v.legend([['accent', 'safe region', { area: true }], ['ink', 'Tresca locus']]);
        v.render(() => {
          const [a, b, c] = sorted(), tm = (a - c) / 2, yl = tresca3(a, b, c) >= Y - 1e-9;
          const key = 't' + s3.value;
          A.raster((x, y) => (tresca3(x, y, s3.value) < Y ? v.ramp(0.18, 'accent') : null), { key, res: 4 });
          A.axes();
          A.contour((x, y) => tresca3(x, y, s3.value), [Y], { color: 'ink', width: 2.6, res: 160 });
          if (s3.value === 0) A.path(hexagon(Y), { close: true, color: 'ink', width: 1.2, alpha: 0.4 });
          A.arrow(0, 0, H.x, H.y, { color: yl ? 'red' : 'gold', width: 1.6 });
          // Mohr circles
          const pairs = [[a, b], [b, c], [a, c]];
          pairs.forEach(([p, q], i) => {
            const big = i === 2;
            B.circle((p + q) / 2, 0, Math.abs(p - q) / 2, { color: big ? (yl ? 'red' : 'accent') : 'muted', width: big ? 2.6 : 1.4, fill: big ? (yl ? 'red' : 'accent') : undefined, fillAlpha: 0.07 });
          });
          B.hline(Y / 2, { color: 'orange', width: 1.4, dash: [6, 4] }); B.hline(-Y / 2, { color: 'orange', width: 1.4, dash: [6, 4] });
          B.tex(String.raw`\tau=Y/2`, 270, Y / 2 + 14, { size: 12, color: 'orange' });
          [a, b, c].forEach((q, i) => { B.dot(q, 0, { r: 5, color: yl ? 'red' : 'ink' }); B.tex(`\\sigma_${i + 1}`, q, i === 1 ? 18 : -18, { size: 12, color: 'ink' }); });
          B.dot((a + c) / 2, tm, { r: 5, color: 'gold' });
        });
        v.readout(() => {
          const [a, b, c] = sorted(), tm = (a - c) / 2;
          return `Principal stresses $(${num(a, 0)},\\,${num(b, 0)},\\,${num(c, 0)})$ MPa. · $\\tau_{\\max}=(\\sigma_1-\\sigma_3)/2=${num(tm, 1)}$ MPa against $Y/2=${Y / 2}$ → utilisation ${num((100 * tm) / (Y / 2), 0)} % (${tm >= Y / 2 - 1e-9 ? '**yield**' : 'safe'}). · Adding the same stress to all three principal values (hydrostatic shift) leaves $\\tau_{\\max}$ unchanged.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Principle',
      name: 'von Mises (distortion energy) criterion',
      statement: String.raw`Yielding of a ductile metal under a stress tensor $\boldsymbol\sigma$ begins when the von Mises equivalent stress reaches the tensile yield stress $Y$:
$$\sigma_{\rm vM}=\sqrt{3J_2}=\sqrt{\tfrac12\big[(\sigma_1-\sigma_2)^2+(\sigma_2-\sigma_3)^2+(\sigma_3-\sigma_1)^2\big]}=Y .$$
Equivalently the elastic energy of distortion (shape change at constant volume) per unit volume reaches $\dfrac{1+\nu}{3E}Y^2$. In plane stress it is the ellipse $\sigma_1^2-\sigma_1\sigma_2+\sigma_2^2=Y^2$; in pure shear it predicts yield at $\tau=Y/\sqrt3\approx0.577\,Y$. Like Tresca's criterion it ignores the hydrostatic part of the stress.`,
      idea: String.raw`Split the stress into hydrostatic and deviatoric parts (3.6). The hydrostatic part only changes volume, which metals resist elastically at stresses far beyond yield, so only the deviator $\mathbf s$ can matter, and by isotropy it can enter only through its invariants; $J_2=\tfrac12\mathbf s\!:\!\mathbf s$ is the simplest and is proportional to the distortion energy. Calibrating on the tension test ($J_2=Y^2/3$) fixes the constant. The ellipse passes through all six corners of the Tresca hexagon, so the two criteria agree in uniaxial and equibiaxial stress and differ most, by a factor $2/\sqrt3\approx1.155$, in pure shear.`,
      caption: String.raw`Drag the gold point: the readout compares the two criteria for the same stress state. The hexagon (orange) lies inside the ellipse and touches it at the six corners. On the right the distance to each locus along a ray at angle $\alpha$ (loading direction $(\cos\alpha,\sin\alpha)$) is plotted: the curves meet at $0^\circ,45^\circ,90^\circ,\dots$ and are furthest apart for $\alpha=135^\circ$ and $315^\circ$, pure shear. Taylor and Quinney's tension–torsion tests on thin tubes (1931) are usually quoted as favouring the ellipse; no test data are plotted here.`,
      deps: ['solid-3.6'],
      refs: ['Timoshenko–Goodier ch. 7'],
      tags: ['yield', 'failure', 'invariants'],
      scope: String.raw`Ductile metals, isotropic, rate-independent loading. Not for soils, concrete or other pressure-dependent materials (4.4).`,
      credit: 'M. T. Huber, 1904; R. von Mises, 1913; H. Hencky, 1924',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Von_Mises_yield_criterion' },
      viz(v) {
        const Y = 250, E = 210000, nu = 0.3;
        const A = v.stage({ x: [-400, 400], y: [-400, 400], equal: true, axes: true, height: 380, title: 'Tresca hexagon inside the von Mises ellipse', xlabel: 'σ₁', ylabel: 'σ₂' });
        const B = v.stage({ x: [0, 360], y: [0, 1.5], axes: 'box', gutter: true, height: 380, xlabel: 'loading direction α (°)', ylabel: 'yield stress along the ray / Y', xticks: [0, 45, 90, 135, 180, 225, 270, 315, 360], title: 'distance to each locus along a ray' });
        const H = A.handle(120, -170, { color: 'gold', r: 8 });
        v.legend([['accent', 'von Mises'], ['orange', 'Tresca']]);
        v.render(() => {
          const e = ellipse(Y), h = hexagon(Y);
          A.poly(e, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2.4 });
          A.path(h, { close: true, color: 'orange', width: 2.4 });
          A.dots(h, { r: 4, color: 'orange' });
          A.arrow(0, 0, H.x, H.y, { color: 'gold', width: 1.6 });
          const al = Math.atan2(H.y, H.x);
          B.fn((d) => rayVM(rad(d)), { color: 'accent', width: 2.6, domain: [0, 360], n: 361 });
          B.fn((d) => rayTresca(rad(d)), { color: 'orange', width: 2.6, domain: [0, 360], n: 361 });
          const d0 = (deg(al) + 360) % 360;
          B.vline(d0, { color: 'muted', width: 1, dash: [4, 4] });
          B.dot(d0, rayVM(al), { r: 6, color: 'accent' }); B.dot(d0, rayTresca(al), { r: 6, color: 'orange' });
        });
        v.readout(() => {
          const a = H.x, b = H.y, vm = vm2(a, b), tr = tresca2(a, b), U = ((1 + nu) / (3 * E)) * vm * vm;
          return `$\\sigma_{\\rm vM}=${num(vm, 1)}$ MPa (${vm >= Y ? '**yielded**' : 'safe'}), Tresca value $\\sigma_1-\\sigma_3=${num(tr, 1)}$ MPa (${tr >= Y ? '**yielded**' : 'safe'}); ratio Tresca/von Mises $=${num(vm > 0 ? tr / vm : 1, 3)}\\in[1,\\,2/\\sqrt3=1.155]$. · Distortion energy $\\tfrac{1+\\nu}{3E}\\sigma_{\\rm vM}^2=${num(U * 1000, 1)}$ kJ/m³ ($E=210$ GPa, $\\nu=0.3$ assumed). · Pure shear yields at $\\tau=${num(Y / Math.sqrt(3), 1)}$ MPa (von Mises) versus $${num(Y / 2, 1)}$ MPa (Tresca).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Principle',
      name: 'Maximum normal stress criterion for brittle materials',
      statement: String.raw`A brittle material such as grey cast iron, glass or ceramic is assumed to fracture when the largest principal tensile stress reaches the tensile strength $\sigma_{ut}$ measured in a tension test:
$$\sigma_1=\sigma_{ut}.$$
The crack then opens perpendicular to the direction of $\sigma_1$. For a shaft under tension $\sigma$ and torsion $\tau$ (plane stress), $\sigma_1=\tfrac\sigma2+\sqrt{\tfrac{\sigma^2}4+\tau^2}$ and the direction of $\sigma_1$ makes the angle $\theta_p=\tfrac12\arctan\!\tfrac{2\tau}{\sigma}$ with the axis, so pure torsion cracks along a $45^\circ$ helix and pure tension cracks straight across. The compressive side needs its own limit (typically several times $\sigma_{ut}$ for cast iron); this item covers the tensile one.`,
      idea: String.raw`In a brittle solid there is no yielding to relieve the stress at flaws, so the weakest flaw that is pulled open widest fails first: the plane of greatest normal tension, which is the principal plane of $\sigma_1$ (3.2). The shear stress matters only through its contribution to $\sigma_1$. This is what Rankine proposed for brittle failure; it works well for tension-dominated states in cast iron and glass and poorly in compression.`,
      caption: String.raw`Choose the mix angle $\beta$ between pure tension ($0^\circ$) and pure torsion ($90^\circ$) and raise the combined stress level $S$ ($\sigma=S\cos\beta$, $\tau=S\sin\beta$). Left: the bar with the plane on which it will crack; it turns solid red once $\sigma_1$ reaches $\sigma_{ut}$. Middle: Mohr's circle; the bar breaks when the circle touches the vertical line $\sigma=\sigma_{ut}$. Right: the level $S_f$ that breaks the bar for every mix, and where yours sits on it.`,
      deps: ['solid-3.2', 'solid-1.7'],
      refs: ['Gere–Goodno §7.3'],
      tags: ['failure', 'brittle', 'principal stress'],
      credit: 'W. J. M. Rankine, 1850s',
      verify: true,
      scope: String.raw`Brittle materials under tension-dominated states. Unreliable when two principal stresses are compressive, where friction between crack faces and the very different compressive strength matter (see Mohr–Coulomb, 4.4). The value $\sigma_{ut}=207$ MPa is the ASTM A48 class 30 grey-iron minimum, used as a round illustrative number.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_normal_stress_theory' },
      viz(v) {
        const sut = 207;
        const beta = v.slider('mix angle $\\beta$ (°)', 0, 90, 60, { step: 1 });
        const S = v.slider('combined stress $S$ (MPa)', 0, 260, 150, { step: 1 });
        const A = v.stage({ x: [-3.9, 3.9], y: [-2.1, 2.1], equal: true, axes: false, height: 340, title: 'the bar and its crack plane' });
        const B = v.stage({ x: [-120, 280], y: [-170, 170], equal: true, axes: true, height: 340, title: 'Mohr’s circle', xlabel: 'σ', ylabel: 'τ' });
        const C = v.stage({ x: [0, 90], y: [0, 260], axes: 'box', gutter: true, height: 340, xlabel: 'mix angle β (°)', ylabel: 'breaking level S_f (MPa)', xticks: [0, 15, 30, 45, 60, 75, 90], title: 'breaking level for every mix' });
        const Sf = (b) => sut / (0.5 * Math.cos(rad(b)) + Math.hypot(0.5 * Math.cos(rad(b)), Math.sin(rad(b))));
        const st = () => { const sg = S.value * Math.cos(rad(beta.value)), ta = S.value * Math.sin(rad(beta.value)); return { sg, ta, p: prin2(sg, 0, ta) }; };
        v.legend([['accent', 'Mohr circle'], ['red', 'σ = σut'], ['orange', 'S_f(β)']]);
        v.render(() => {
          const { sg, ta, p } = st(), fail = p.s1 >= sut - 1e-9, th = p.thp;
          // bar
          A.rect(-3, -0.75, 3, 0.75, { color: 'ink', width: 2, fill: 'accent', fillAlpha: fail ? 0.04 : 0.12 });
          const u = [Math.cos(th), Math.sin(th)], cr = [-u[1], u[0]]; // crack direction ⟂ σ1
          const L = 0.95 / Math.max(0.3, Math.abs(cr[1]));
          const pts = [[-cr[0] * L, -cr[1] * L], [cr[0] * L, cr[1] * L]];
          A.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], { color: 'red', width: fail ? 4 : 2, dash: fail ? false : [6, 5], alpha: fail ? 1 : 0.7 });
          if (fail) { A.line(pts[0][0] + 0.15, pts[0][1], pts[1][0] + 0.15, pts[1][1], { color: 'red', width: 1.2 }); }
          // loads
          const f = (S.value / 260) * 1.1 * Math.cos(rad(beta.value)), g = (S.value / 260) * 1.2 * Math.sin(rad(beta.value));
          if (f > 0.04) { A.arrow(3, 0, 3 + f + 0.2, 0, { color: 'accent', width: 3 }); A.arrow(-3, 0, -3 - f - 0.2, 0, { color: 'accent', width: 3 }); }
          if (g > 0.04) { A.arrow(3.15, -0.6, 3.15, -0.6 + g, { color: 'orange', width: 3 }); A.arrow(-3.15, 0.6, -3.15, 0.6 - g, { color: 'orange', width: 3 }); }
          A.text('tension', 0, 1.55, { size: 12, color: 'accent', align: 'center' }); A.text('torque', 0, -1.55, { size: 12, color: 'orange', align: 'center' });
          A.arrow(-0.4, -0.35, -0.4 + 0.9 * u[0], -0.35 + 0.9 * u[1], { color: 'green', width: 2 });
          A.tex(String.raw`\sigma_1`, -0.4 + 1.15 * u[0] - 0.25, -0.35 + 1.15 * u[1] + 0.12, { size: 13, color: 'green' });
          // Mohr
          B.vline(sut, { color: 'red', width: 2, dash: [6, 4] }); B.tex(String.raw`\sigma_{ut}`, sut + 14, 150, { size: 12, color: 'red' });
          if (p.R > 0.5) B.circle(p.c, 0, p.R, { color: fail ? 'red' : 'accent', width: 2.4, fill: fail ? 'red' : 'accent', fillAlpha: 0.08 });
          B.dot(sg, ta, { r: 5, color: 'ink' }); B.dot(0, -ta, { r: 5, color: 'ink' }); B.line(sg, ta, 0, -ta, { color: 'muted', width: 1, dash: [3, 3] });
          B.dot(p.s1, 0, { r: 6, color: 'green' }); B.dot(p.s2, 0, { r: 5, color: 'muted' });
          // failure level
          C.fn(Sf, { color: 'orange', width: 2.6, domain: [0, 90], n: 91 });
          C.hline(S.value, { color: 'muted', width: 1, dash: [4, 4] });
          C.dot(beta.value, S.value, { r: 7, color: fail ? 'red' : 'gold' });
        });
        v.readout(() => {
          const { sg, ta, p } = st();
          return `$\\sigma=${num(sg, 0)}$, $\\tau=${num(ta, 0)}$ MPa → $\\sigma_1=${num(p.s1, 1)}$ MPa against $\\sigma_{ut}=${sut}$ (${p.s1 >= sut ? '**fracture**' : 'intact'}); direction of $\\sigma_1$: ${num(deg(p.thp), 1)}° from the axis, so the crack runs ${num(deg(p.thp), 1)}° from the cross-section. · Breaking level for this mix: $S_f=${num(Sf(beta.value), 1)}$ MPa; pure tension ${num(Sf(0), 0)}, pure torsion ${num(Sf(90), 0)} MPa (equal: in pure shear $\\sigma_1=\\tau$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Principle',
      name: 'Mohr–Coulomb criterion',
      statement: String.raw`Soils, rocks and concrete fail by sliding, and the shear stress a plane can carry grows with the compression pressing it together. The **Mohr–Coulomb criterion** states that failure occurs on a plane when its shear stress reaches
$$\tau=c+\sigma\tan\varphi,$$
where $\sigma$ is the normal compression on the plane, $c$ the cohesion and $\varphi$ the angle of internal friction. In terms of the principal stresses (compression positive, $\sigma_1\ge\sigma_3$) this is
$$\frac{\sigma_1-\sigma_3}{2}=\frac{\sigma_1+\sigma_3}{2}\sin\varphi+c\cos\varphi\quad\Longleftrightarrow\quad\sigma_1=\sigma_3\,\frac{1+\sin\varphi}{1-\sin\varphi}+\frac{2c\cos\varphi}{1-\sin\varphi},$$
the largest Mohr circle at failure is tangent to the line, and the failure plane makes the angle $45^\circ+\varphi/2$ with the plane of the major principal stress. For $\varphi=0$ it reduces to Tresca's criterion with $c=Y/2$.`,
      idea: String.raw`A plane with normal at angle $\theta$ to the $\sigma_1$ direction carries $(\sigma,\tau)$ on Mohr's circle (3.3). Failure first occurs on the plane whose point first touches the line $\tau=c+\sigma\tan\varphi$, i.e. where the circle is tangent to it. The distance from the circle's centre $(\sigma_1+\sigma_3)/2$ to the line is $c\cos\varphi+\tfrac{\sigma_1+\sigma_3}2\sin\varphi$; setting it equal to the radius gives the formula above. The tangent point sits at $2\theta=90^\circ+\varphi$ round the circle, hence the plane angle $45^\circ+\varphi/2$. The friction law is Coulomb's; Mohr's contribution was to draw it on the stress circles.`,
      caption: String.raw`Each circle is a triaxial test run to failure at a different confining pressure $\sigma_3$ (compression to the right). Their common tangent is the envelope $\tau=c+\sigma\tan\varphi$: change $\varphi$ and $c$ and the failure stress $\sigma_1$ of every test moves with it. The tangency residual in the readout is computed independently from the circle and the line and stays at zero. Right: the specimen of the last test with its failure plane at $45^\circ+\varphi/2$ from the horizontal. Set $\varphi=0$ for a metal-like Tresca limit.`,
      deps: ['solid-3.3'],
      refs: ['Timoshenko–Goodier ch. 7'],
      tags: ['failure', 'soil mechanics', 'friction'],
      credit: 'C. A. Coulomb, 1776; O. Mohr, c. 1900',
      verify: true,
      scope: String.raw`Granular and brittle-frictional materials in compression (soils, rocks, concrete, powders); the intermediate principal stress $\sigma_2$ is ignored; ignores tensile cut-off and dilatancy. Soil parameters here ($c$ in kPa, $\varphi$ in degrees) are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mohr%E2%80%93Coulomb_theory' },
      viz(v) {
        const phi = v.slider('friction angle $\\varphi$ (°)', 0, 45, 30, { step: 1 });
        const cc = v.slider('cohesion $c$ (kPa)', 0, 80, 25, { step: 1 });
        const nt = v.slider('number of tests', 1, 5, 4, { step: 1, int: true });
        const A = v.stage({ x: [-120, 960], y: [-420, 420], equal: true, axes: true, height: 380, title: 'Mohr circles at failure (compression positive)', xlabel: 'σ (kPa)', ylabel: 'τ (kPa)' });
        const B = v.stage({ x: [-3, 3], y: [-3.3, 3.3], equal: true, axes: false, height: 380, title: 'last specimen' });
        const s3s = [50, 100, 150, 200, 250];
        const fail = (s3) => { const sn = Math.sin(rad(phi.value)); return (s3 * (1 + sn) + 2 * cc.value * Math.cos(rad(phi.value))) / (1 - sn); };
        v.legend([['accent', 'failure circles'], ['red', 'τ = c + σ tan φ'], ['green', 'tangent points']]);
        v.render(() => {
          const ph = rad(phi.value), c = cc.value;
          const x0 = -c / Math.tan(ph || 1e-9); // envelope hits σ axis here
          const xe = 960;
          A.line(Math.max(x0, -120), c + Math.max(x0, -120) * Math.tan(ph), xe, c + xe * Math.tan(ph), { color: 'red', width: 2.4 });
          A.line(Math.max(x0, -120), -(c + Math.max(x0, -120) * Math.tan(ph)), xe, -(c + xe * Math.tan(ph)), { color: 'red', width: 1.2, alpha: 0.5 });
          for (let i = 0; i < nt.value; i++) {
            const s3 = s3s[i], s1 = fail(s3), m = (s1 + s3) / 2, R = (s1 - s3) / 2;
            A.circle(m, 0, R, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.05 });
            const tx = m - R * Math.sin(ph), ty = R * Math.cos(ph); // tangent point
            A.dot(tx, ty, { r: 4.5, color: 'green' });
            A.dot(s3, 0, { r: 3.5, color: 'ink' }); A.dot(s1, 0, { r: 3.5, color: 'ink' });
          }
          // specimen
          const s3 = s3s[nt.value - 1], s1 = fail(s3);
          B.rect(-1, -2, 1, 2, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.08 });
          const pa = Math.PI / 4 + ph / 2, dx = Math.cos(pa), dy = Math.sin(pa), t = Math.min(1 / dx, 2 / dy);
          B.line(-dx * t, -dy * t, dx * t, dy * t, { color: 'red', width: 3 });
          B.arrow(0, 2.9, 0, 2.05, { color: 'accent', width: 3 }); B.arrow(0, -2.9, 0, -2.05, { color: 'accent', width: 3 });
          B.arrow(-2.2, 0, -1.05, 0, { color: 'orange', width: 2 }); B.arrow(2.2, 0, 1.05, 0, { color: 'orange', width: 2 });
          B.tex(String.raw`\sigma_1=${num(s1, 0)}`, 1.2, 2.9, { size: 12, color: 'accent', align: 'left' }); B.tex(String.raw`\sigma_3=${s3}`, 2.2, -0.45, { size: 12, color: 'orange', align: 'right' });
          B.tex(String.raw`45^\circ+\varphi/2=${num(45 + phi.value / 2, 1)}^\circ`, -1.2, 1.3, { size: 12, color: 'red', align: 'right' });
        });
        v.readout(() => {
          const ph = rad(phi.value), c = cc.value, rows = [];
          for (let i = 0; i < nt.value; i++) {
            const s3 = s3s[i], s1 = fail(s3), m = (s1 + s3) / 2, R = (s1 - s3) / 2;
            const dist = (c + m * Math.tan(ph)) * Math.cos(ph); // distance from centre to the line
            rows.push(`$\\sigma_3=${s3}\\to\\sigma_1=${num(s1, 0)}$ (gap ${Math.abs(dist - R) < 1e-9 ? '0' : num(dist - R, 6)})`);
          }
          return `${rows.join(' · ')} kPa. The “gap” is distance(centre, line) − radius, computed independently: 0 means tangent. · $N_\\varphi=\\frac{1+\\sin\\varphi}{1-\\sin\\varphi}=${num((1 + Math.sin(ph)) / (1 - Math.sin(ph)), 3)}$; failure plane at $${num(45 + phi.value / 2, 1)}^\\circ$ to the major principal plane. · Unconfined strength ($\\sigma_3=0$): $${num(fail(0), 1)}$ kPa.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Elastic–perfectly plastic material',
      statement: String.raw`The **elastic–perfectly plastic** model replaces a ductile metal's stress–strain curve by two straight pieces: for $|\sigma|<\sigma_y$ the response is linear elastic, $\sigma=E\varepsilon_e$; at $|\sigma|=\sigma_y$ the strain increases at constant stress, $\varepsilon=\varepsilon_e+\varepsilon_p$, with the plastic part $\varepsilon_p$ growing only while $|\sigma|=\sigma_y$. Unloading and reloading follow lines of slope $E$ (so the elastic strain is always $\sigma/E$), and a plastic strain left behind is **permanent**. Stress never exceeds $\sigma_y$ in magnitude. After loading to the strain $\varepsilon_{\max}>\varepsilon_y=\sigma_y/E$ and unloading to zero stress, the bar keeps the permanent set $\varepsilon_p=\varepsilon_{\max}-\varepsilon_y$; on reversal it yields in compression after an elastic stress range of $2\sigma_y$.`,
      idea: String.raw`The model keeps exactly what a design calculation needs from the curve of 1.3: the stiffness $E$ and the yield strength $\sigma_y$, and drops hardening. The key idea is that the *loading* path and the *unloading* path differ: the stress is a function of the history, not of the present strain, since elastic strain recovers along a line parallel to the initial one while plastic strain does not. Hooke's law (1.4) acts on the elastic part only. The model underlies limit analysis (4.10) and the plastic hinge (6.12).`,
      caption: String.raw`Set the peak strain (in units of the yield strain $\varepsilon_y$) and the stress the bar is finally brought to. The blue path is loading, the green one unloading with slope $E$, parallel to the first line. Where the green line meets the strain axis the bar is unloaded, and its permanent set can be read off. Switch on the faint real S355 curve of chapter 1 to see what the idealisation drops (Lüders plateau, hardening, necking). The bar below is drawn with an exaggerated strain scale.`,
      deps: ['solid-1.3'],
      refs: ['Gere–Goodno §2.11', 'Gere–Goodno §2.12'],
      tags: ['plasticity', 'constitutive model'],
      scope: String.raw`Metals with a distinct yield point and little hardening (mild steel at moderate strains); small strains; rate-independent, no Bauschinger effect or hardening. Numbers are the S355 values of chapter 1 ($E=210$ GPa, $\sigma_y=355$ MPa).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Plasticity_(physics)' },
      viz(v) {
        const m = MATS.steel, ey = m.sy / m.E, cv = curveOf('steel');
        const peak = v.slider('peak strain $\\varepsilon_{\\max}/\\varepsilon_y$', 0.2, 6, 3, { step: 0.05 });
        const send = v.slider('final stress $\\sigma/\\sigma_y$', -1, 1, 0, { step: 0.01 });
        const real = v.toggle('show real S355 curve', false);
        const A = v.stage({ x: [-0.3, 6.6], y: [-1.45, 1.45], axes: true, height: 360, title: 'stress against strain', xlabel: 'ε/εy', ylabel: 'σ/σy' });
        const B = v.stage({ x: [-0.5, 10], y: [-2.2, 1.8], equal: true, axes: false, height: 360, title: 'the bar (strain scale exaggerated)' });
        v.legend([['accent', 'loading'], ['green', 'unloading (slope E)'], ['muted', 'real curve', { dash: true }]]);
        const path = () => {
          const pk = peak.value, sp = Math.min(pk, 1), se = Math.min(send.value, sp), ee = pk - (sp - se);
          return { pk, sp, se, ee, pset: pk - sp };
        };
        v.render(() => {
          const { pk, sp, se, ee } = path();
          if (real.value) A.fn((x) => cv.sig(x * ey) / m.sy, { color: 'muted', width: 1.4, dash: [5, 4], domain: [0, 6.5], n: 300 });
          A.hline(1, { color: 'faint', width: 1, dash: [4, 4] }); A.hline(-1, { color: 'faint', width: 1, dash: [4, 4] });
          A.path(pk > 1 ? [[0, 0], [1, 1], [pk, 1]] : [[0, 0], [pk, pk]], { color: 'accent', width: 3 });
          A.path([[pk, sp], [ee, se]], { color: 'green', width: 3 });
          A.dot(ee, se, { r: 7, color: 'gold' });
          if (se === 0 && pk > 1) { A.measure(0, -0.18, pk - 1, -0.18, 'permanent set'); }
          A.tex(String.raw`E`, 0.78, 0.22, { size: 13, color: 'accent' });
          // bar
          const L0 = 5, k = 0.15, X = (e) => L0 * (1 + k * e);
          B.rect(0, -0.4, L0, 0.4, { color: 'muted', width: 1.4, dash: [5, 4] });
          B.rect(0, -0.4, X(ee), 0.4, { color: 'ink', width: 2, fill: se >= 0 ? 'accent' : 'orange', fillAlpha: 0.1 + 0.35 * Math.abs(se) });
          B.measure(L0, 0.95, X(ee), 0.95, 'ΔL');
          if (ee - se > 1e-6) B.measure(L0, -1.0, X(ee - se), -1.0, 'permanent part');
          B.text('original length', 0, 0.75, { size: 11, color: 'muted', align: 'left' });
          B.text(`stress ${num(se * m.sy, 0)} MPa`, 0, -1.7, { size: 12, color: 'ink', align: 'left' });
        });
        v.readout(() => {
          const { pk, sp, se, ee } = path(), eps = ee - se;
          return `Peak strain $${num(pk, 2)}\\,\\varepsilon_y=${num(pk * ey * 100, 3)}\\,\\%$ at stress $${num(sp * m.sy, 0)}$ MPa; now $\\sigma=${num(se * m.sy, 0)}$ MPa, $\\varepsilon=${num(ee * ey * 100, 3)}\\,\\%$. · Plastic strain $\\varepsilon-\\sigma/E=${num(eps * ey * 100, 3)}\\,\\%$ (permanent set on full unloading: $${num(Math.max(0, pk - 1) * ey * 100, 3)}\\,\\%$ = $\\varepsilon_{\\max}-\\varepsilon_y$). · Elastic recovery $\\sigma_y/E=${num(ey * 100, 3)}\\,\\%$ ($\\varepsilon_y$ for $E=210$ GPa, $\\sigma_y=355$ MPa).`;
        });
      },
    },
  ],
};
