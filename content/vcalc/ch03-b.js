// Vector Calculus — Chapter 3: Vector fields, divergence and curl
// Part 2 (3.7–3.12): curl as circulation density, curl grad = 0 = div curl, Laplacian, product rules, curvilinear coordinates, sources and vortices.
import {
  tn, tf, FIELDS, div2, curl2, lap2, rk4, flowLine, arrowGrid, bumpSum, hills, grad2, planeBasis, add3, sub3, mul3, dot3, cross3, norm3, unit3, sample, circle3, DEG, TAU,
} from './ch03.shared.js';

const W = [-1.3, 1.3];
const fieldOptions = (keys) => keys.map((k) => ({ value: k, label: FIELDS[k].label }));
const PI = Math.PI;
const ANG_TICKS = [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], [1.5 * PI, '3π/2'], [TAU, '2π']];

export default {
  collection: 'vcalc',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Curl as circulation density',
      statement: String.raw`Let $\mathbf F$ be a $C^1$ vector field on an open set of $\R^3$, $p$ a point and $\mathbf n$ a unit vector. Let $D_\varepsilon$ be the disc of radius $\varepsilon$ centred at $p$ in the plane through $p$ perpendicular to $\mathbf n$, with boundary circle $C_\varepsilon$ traversed counter-clockwise as seen from the tip of $\mathbf n$ (right-hand rule). Then
$$\operatorname{curl}\mathbf F(p)\cdot\mathbf n=\lim_{\varepsilon\to0}\frac{1}{\pi\varepsilon^2}\oint_{C_\varepsilon}\mathbf F\cdot d\mathbf r.$$
So the circulation per unit area about the axis $\mathbf n$ is the component of the curl along $\mathbf n$; it is largest, equal to $|\operatorname{curl}\mathbf F(p)|$, when $\mathbf n$ points along the curl.`,
      idea: String.raw`To first order $\mathbf F(p+\mathbf x)=\mathbf F(p)+D\mathbf F(p)\,\mathbf x$ (the differentiability of pma-9.11). The constant part integrates to zero around a closed circle, and the symmetric part of $D\mathbf F$ does too (it is a gradient). Only the antisymmetric part, which is exactly $\tfrac12\operatorname{curl}\mathbf F\times\mathbf x$, circulates, and it gives $\operatorname{curl}\mathbf F\cdot\mathbf n\,\pi\varepsilon^2$. The error term is $o(\varepsilon^2)$ because $D\mathbf F$ is continuous.`,
      caption: String.raw`Drag the gold point and set the loop's normal with the two angle sliders (or press the button to turn it to face the curl). The orange ring is the loop; its green and red arrows are the part of $\mathbf F$ along it. Middle: circulation per area for loops of different tilt follows $|\operatorname{curl}|\cos\psi$, maximal at $\psi=0$ and negative beyond $90^\circ$. Right: shrinking the loop, the measured value converges to $\operatorname{curl}\mathbf F\cdot\mathbf n$ (dashed). The field is the explicit polynomial field $\mathbf F=(z^2-y,\ \tfrac12z+x^2+x^3,\ x+y^2)$, with $\operatorname{curl}\mathbf F=(2y-\tfrac12,\ 2z-1,\ 2x+1+3x^2)$ (the cubic term makes the loop radius matter).`,
      deps: ['vcalc-3.5'],
      refs: ['Schey ch. III'],
      tags: ['curl', 'circulation', 'limit'],
      viz(v) {
        const FF = (x, y, z) => [z * z - y, 0.5 * z + x * x + x ** 3, x + y * y];
        const CURL = (x, y, z) => [2 * y - 0.5, 2 * z - 1, 2 * x + 1 + 3 * x * x];
        const tilt = v.slider('tilt of the normal', 0, 180, 40, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const turn = v.slider('turn of the normal', 0, 360, 30, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const eps = v.slider('loop radius $\\varepsilon$', 0.01, 0.6, 0.35, { log: true, sig: 2 });
        const S = v.stage({ x: [-1.15, 1.15], y: [-1.1, 1.1], equal: true, axes: false, height: 400, weight: 1.2 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.4, axis: 1.2, lim: 1.1 });
        const R1 = v.stage({ x: [0, 180], y: [-2, 2], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 250, xlabel: 'angle ψ to the curl (degrees)', title: 'circulation per area against tilt' });
        const R2 = v.stage({ x: [0.01, 0.6], y: [-2, 2], xlog: true, axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 250, xlabel: 'loop radius ε', title: 'shrinking the loop' });
        const P = sc.handle([0.3, 0.2, 0.15], { mode: 'free', color: 'gold', label: 'p' });
        v.button('turn the loop to face the curl', () => {
          const c = unit3(CURL(...P.p));
          tilt.set(Math.acos(Math.max(-1, Math.min(1, c[2]))) / DEG); turn.set(((Math.atan2(c[1], c[0]) / DEG) + 360) % 360);
        });
        const dens = (p, n, e) => {
          const [a, b] = planeBasis(n), N = 96;
          let s = 0;
          for (let i = 0; i < N; i++) {
            const th = (TAU * i) / N, ct = Math.cos(th), st = Math.sin(th);
            const q = add3(p, add3(mul3(a, e * ct), mul3(b, e * st))), f = FF(...q);
            s += dot3(f, add3(mul3(a, -st), mul3(b, ct))) * e * (TAU / N);
          }
          return s / (PI * e * e);
        };
        let st = {};
        v.render(() => {
          const p = P.p, t = tilt.value * DEG, ph = turn.value * DEG, e = eps.value;
          const n = [Math.sin(t) * Math.cos(ph), Math.sin(t) * Math.sin(ph), Math.cos(t)];
          const cu = CURL(...p), cn = norm3(cu), [a, b] = planeBasis(n);
          sc.begin();
          const ring = [], N = 48;
          for (let i = 0; i <= N; i++) { const th = (TAU * i) / N; ring.push(add3(p, add3(mul3(a, e * Math.cos(th)), mul3(b, e * Math.sin(th))))); }
          sc.poly(ring.slice(0, N), { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 2.4 });
          for (let i = 0; i < 12; i++) {
            const th = (TAU * i) / 12, q = ring[Math.round((i * N) / 12)], tg = add3(mul3(a, -Math.sin(th)), mul3(b, Math.cos(th))), ft = dot3(FF(...q), tg);
            const len = Math.min(0.35, 0.3 * Math.abs(ft)) * Math.sign(ft);
            if (Math.abs(len) > 1e-4) sc.arrow(q, add3(q, mul3(tg, len)), { color: ft > 0 ? 'green' : 'red', width: 2.2 });
          }
          sc.arrow(p, add3(p, mul3(n, 0.5)), { color: 'accent', width: 3 });
          sc.arrow(p, add3(p, mul3(cu, 0.3)), { color: 'purple', width: 3 });
          sc.tex('\\mathbf n', add3(p, mul3(n, 0.58)), { color: 'accent' });
          sc.tex('\\operatorname{curl}\\mathbf F', add3(p, mul3(cu, 0.34)), { color: 'purple' });
          sc.flush();
          const dc = dens(p, n, e), pred = dot3(cu, n);
          // tilt law
          const e1 = unit3(cu), h0 = Math.abs(e1[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], e2 = unit3(cross3(e1, h0));
          const nAt = (psi) => add3(mul3(e1, Math.cos(psi * DEG)), mul3(e2, Math.sin(psi * DEG)));
          const top = Math.max(0.5, cn);
          R1.setView([0, 180], [-1.25 * top, 1.25 * top]);
          R1.hline(0, { color: 'muted', alpha: 0.5, width: 1 });
          R1.fn((psi) => cn * Math.cos(psi * DEG), { domain: [0, 180], color: 'green', width: 2, dash: true });
          for (let k = 0; k <= 12; k++) R1.dot(k * 15, dens(p, nAt(k * 15), e), { r: 4, color: 'accent' });
          const psiNow = Math.acos(Math.max(-1, Math.min(1, dot3(n, e1)))) / DEG;
          R1.dot(psiNow, dc, { r: 7, color: 'gold' });
          // shrinking
          const es = Array.from({ length: 40 }, (_, i) => 0.01 * Math.pow(60, i / 39)), ys = es.map((q) => dens(p, n, q));
          const lo = Math.min(pred, ...ys), hi = Math.max(pred, ...ys), pad = Math.max(0.3, 0.25 * (hi - lo));
          R2.setView([0.01, 0.6], [lo - pad, hi + pad]);
          R2.hline(pred, { color: 'green', dash: true, width: 2 });
          R2.path(es.map((q, i) => [q, ys[i]]), { color: 'accent', width: 2.4 });
          R2.dot(e, dc, { r: 6, color: 'gold' });
          st = { dc, pred, cn, psi: psiNow, cu };
        });
        v.legend([['purple', 'curl $\\mathbf F$ at $p$'], ['accent', 'normal $\\mathbf n$ of the loop; measured circulation / area'], ['green', 'predicted $\\operatorname{curl}\\mathbf F\\cdot\\mathbf n$', { dash: true }]]);
        v.readout(() => `$\\operatorname{curl}\\mathbf F(p)=(${tf(st.cu[0], 3)},\\,${tf(st.cu[1], 3)},\\,${tf(st.cu[2], 3)})$, $|\\operatorname{curl}\\mathbf F|=${tf(st.cn, 3)}$, angle to the normal $\\psi=${tf(st.psi, 1)}^\\circ$.\nMeasured $\\frac{1}{\\pi\\varepsilon^2}\\oint\\mathbf F\\cdot d\\mathbf r=${tf(st.dc, 5)}$; predicted $\\operatorname{curl}\\mathbf F\\cdot\\mathbf n=${tf(st.pred, 5)}$ (difference $${v.sci(Math.abs(st.dc - st.pred), 2)}$).`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'curl grad = 0 and div curl = 0',
      statement: String.raw`If $\varphi$ is a $C^2$ scalar field and $\mathbf A$ is a $C^2$ vector field on an open subset of $\R^3$, then
$$\operatorname{curl}(\nabla\varphi)=\mathbf 0,\qquad \operatorname{div}(\operatorname{curl}\mathbf A)=0.$$
Conversely, on a region that is star-shaped (more generally simply connected), a $C^1$ field with $\operatorname{curl}\mathbf F=\mathbf 0$ is a gradient, and on a star-shaped region a $C^1$ field with $\operatorname{div}\mathbf G=0$ is the curl of some field (this is pma-10.43, whose proof uses differential forms). In the plane the first identity reads $\partial_x(\varphi_y)-\partial_y(\varphi_x)=0$.`,
      idea: String.raw`Each identity is the equality of mixed partials (2.10) in disguise: the components of $\operatorname{curl}\nabla\varphi$ are differences $\varphi_{yz}-\varphi_{zy}$, and in $\operatorname{div}\operatorname{curl}\mathbf A$ the six terms $\partial_x\partial_yA_z,\ \partial_y\partial_xA_z,\dots$ cancel in pairs. The converses fail on regions with holes: the swirl $(-y,x)/(x^2+y^2)$ of the punctured plane has curl $0$ yet circulates once around the hole, so it is not a gradient.`,
      caption: String.raw`Top row: a potential $\varphi$ (click to add a hill, shift-click a well) with its gradient, and the colour map of $\operatorname{curl}\nabla\varphi$. Bottom row: a vector potential $\mathbf A$ (three sliders) whose curl $\mathbf B$ is drawn in the plane $z=0$, and the map of $\operatorname{div}\mathbf B$. The maps are blank: the residual printed in the corner is the finite-difference error of the stencil with step $h$, which shrinks with $h$ (try the slider), not a failure of the identity. Now break it: add a rotation / source term, or a point vortex, and the maps light up (the vortex leaves the curl map blank but circulates).`,
      scope: String.raw`Needs $C^2$ potentials. The converse statements need a domain without holes (star-shaped or simply connected); the point vortex on the punctured plane is the counterexample for the first one. The picture computes derivatives with a 4th-order central stencil of step $h$ applied to closed formulas for $\nabla\varphi$ and $\mathbf B=\operatorname{curl}\mathbf A$.`,
      deps: ['vcalc-3.4', 'vcalc-3.5', 'vcalc-2.10', 'pma-10.43'],
      refs: ['Marsden–Tromba §4.4'],
      tags: ['identities', 'curl', 'divergence', 'potentials'],
      viz(v) {
        const base = () => [{ a: 0.9, x: 0.45, y: 0.3, w: 0.35 }, { a: 0.65, x: -0.6, y: -0.4, w: 0.3 }, { a: -0.4, x: -0.2, y: 0.75, w: 0.25 }];
        let B = base();
        const ca = v.slider('$A_1$ strength', -1.5, 1.5, 1, { step: 0.05 });
        const cb = v.slider('$A_2$ strength', -1.5, 1.5, 0.8, { step: 0.05 });
        const cc = v.slider('$A_3$ strength', -1.5, 1.5, -0.6, { step: 0.05 });
        const hs = v.slider('stencil step $h$', 0.003, 0.3, 0.02, { log: true, sig: 2 });
        const mod = v.select('tamper', [{ value: 'none', label: 'leave as is' }, { value: 'rot', label: 'add a rotation / a source' }, { value: 'vortex', label: 'add a point vortex' }], 'none');
        v.button('reset hills', () => { B = base(); });
        const opts = { equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 330 };
        const S1 = v.stage({ ...opts, x: [-1.2, 1.2], y: [-1.2, 1.2], xlabel: 'x', ylabel: 'y', title: '$\\varphi$ and $\\nabla\\varphi$ (click to edit)' });
        const S2 = v.stage({ ...opts, x: [-1.2, 1.2], y: [-1.2, 1.2], xlabel: 'x', ylabel: 'y', title: '$\\operatorname{curl}$ of that field' });
        const S3 = v.stage({ ...opts, x: [-1.2, 1.2], y: [-1.2, 1.2], xlabel: 'x', ylabel: 'y', title: '$\\mathbf B=\\operatorname{curl}\\mathbf A$ in the plane $z=0$' });
        const S4 = v.stage({ ...opts, x: [-1.2, 1.2], y: [-1.2, 1.2], xlabel: 'x', ylabel: 'y', title: '$\\operatorname{div}\\mathbf B$ in the plane $z=0$' });
        S1.onClick((x, y, mod2) => { if (B.length < 10) B.push({ a: (mod2.shift ? -1 : 1) * 0.7, x, y, w: 0.3 }); v.invalidate(); });
        const E = (x, y, z) => Math.exp(-(x * x + y * y + z * z) / 1.2);
        const Bf = (x, y, z, c) => {
          const e = E(x, y, z), k = 2 / 1.2;
          const [a, b, d] = c;
          return [
            d * e * (-k * y * Math.sin(2 * x + y) + Math.cos(2 * x + y)) - b * e * (-k * z * Math.cos(2 * z + x) - 2 * Math.sin(2 * z + x)),
            a * e * (-k * z * Math.sin(2 * y + z) + Math.cos(2 * y + z)) - d * e * (-k * x * Math.sin(2 * x + y) + 2 * Math.cos(2 * x + y)),
            b * e * (-k * x * Math.cos(2 * z + x) - Math.sin(2 * z + x)) - a * e * (-k * y * Math.sin(2 * y + z) + 2 * Math.cos(2 * y + z)),
          ];
        };
        const D = (g, t, h) => (-g(t + 2 * h) + 8 * g(t + h) - 8 * g(t - h) + g(t - 2 * h)) / (12 * h);
        let st = {};
        v.render(() => {
          const h = hs.value, m = mod.value, c = [ca.value, cb.value, cc.value], { f, g } = bumpSum(B);
          const G = (x, y) => {
            const q = g(x, y);
            if (m === 'rot') return [q[0] - 0.3 * y, q[1] + 0.3 * x];
            if (m === 'vortex') { const r2 = x * x + y * y + 1e-12; return [q[0] - 0.3 * y / r2, q[1] + 0.3 * x / r2]; }
            return q;
          };
          const Bm = (x, y, z) => { const q = Bf(x, y, z, c); return m === 'rot' ? [q[0] + 0.3 * x, q[1] + 0.3 * y, q[2] + 0.3 * z] : q; };
          const divB = (x, y) => D((s) => Bm(s, y, 0)[0], x, h) + D((s) => Bm(x, s, 0)[1], y, h) + D((s) => Bm(x, y, s)[2], 0, h);
          const kB = JSON.stringify(B) + m + h;
          S1.heat(f, { range: [-1.2, 1.2], cmap: 'theme-diverging', res: 3, key: JSON.stringify(B) });
          S1.contour(f, Array.from({ length: 23 }, (_, i) => -1.1 + 0.1 * i), { color: 'ink', alpha: 0.3, width: 1 });
          arrowGrid(S1, G, [-1.2, 1.2], [-1.2, 1.2], 10, 10, { cap: 0.2, scale: 0.14, color: 'accent', alpha: 0.9 });
          S2.heat((x, y) => curl2(G, x, y, h), { range: [-1, 1], cmap: 'theme-diverging', res: 4, key: 'c' + kB });
          S3.heat((x, y) => Bm(x, y, 0)[2], { range: [-1.5, 1.5], cmap: 'theme-diverging', res: 4, key: 'b' + kB + c.join()});
          arrowGrid(S3, (x, y) => { const q = Bm(x, y, 0); return [q[0], q[1]]; }, [-1.2, 1.2], [-1.2, 1.2], 10, 10, { cap: 0.2, scale: 0.12, color: 'ink', alpha: 0.7 });
          S4.heat(divB, { range: [-1, 1], cmap: 'theme-diverging', res: 4, key: 'd' + kB + c.join() });
          let mc = 0, md = 0, mB = 0;
          for (let i = 0; i < 23; i++) for (let j = 0; j < 23; j++) {
            const x = -1.1 + 0.1 * i, y = -1.1 + 0.1 * j;
            if (m === 'vortex' && Math.hypot(x, y) < 0.15) continue;
            mc = Math.max(mc, Math.abs(curl2(G, x, y, h))); md = Math.max(md, Math.abs(divB(x, y))); mB = Math.max(mB, Math.hypot(...Bm(x, y, 0)));
          }
          S2.corner(`max |curl| = ${mc.toExponential(1)}`, 'tl', { plate: true });
          S4.corner(`max |div| = ${md.toExponential(1)}`, 'tl', { plate: true });
          let circ = 0;
          for (let i = 0; i < 120; i++) { const th = (TAU * i) / 120, q = G(0.6 * Math.cos(th), 0.6 * Math.sin(th)); circ += (-q[0] * Math.sin(th) + q[1] * Math.cos(th)) * 0.6 * (TAU / 120); }
          st = { mc, md, mB, circ, m };
        });
        v.legend([['accent', 'arrows of $\\nabla\\varphi$ (plus the tamper term)'], ['ink', 'arrows of the $(B_1,B_2)$ part of $\\mathbf B$']]);
        v.readout(() => `Largest $|\\operatorname{curl}\\nabla\\varphi|$ on the grid: $${v.sci(st.mc, 2)}$.  Largest $|\\operatorname{div}\\operatorname{curl}\\mathbf A|$: $${v.sci(st.md, 2)}$ (typical size of $\\mathbf B$: $${tf(st.mB, 2)}$), with stencil step $h=${v.sci(hs.value, 2)}$.\nCirculation of the top field around the circle of radius $0.6$ about the origin: $${Math.abs(st.circ) < 1e-6 ? '0\\ (<10^{-6})' : tf(st.circ, 4)}$${st.m === 'vortex' ? ' — the vortex has zero curl away from the origin but circulates $0.3\\cdot2\\pi$, so it is not a gradient' : ''}.`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'The Laplacian',
      statement: String.raw`The **Laplacian** of a $C^2$ scalar field $f$ on an open subset of $\R^n$ is
$$\Delta f=\nabla^2 f=\operatorname{div}\nabla f=\frac{\partial^2 f}{\partial x_1^2}+\cdots+\frac{\partial^2 f}{\partial x_n^2}.$$
In the plane $\Delta f=f_{xx}+f_{yy}$. A function with $\Delta f=0$ is **harmonic**. The value $\Delta f(p)$ measures how $f(p)$ compares with the average of $f$ over small circles (spheres) about $p$: for a $C^2$ function in the plane
$$\frac{1}{2\pi}\int_0^{2\pi}f(p+r\,e^{i\theta})\,d\theta=f(p)+\frac{r^2}{4}\,\Delta f(p)+o(r^2).$$`,
      idea: String.raw`The first identity is the definition ($\operatorname{div}$ of the gradient 3.3, each component being a second derivative). For the average, expand $f$ to second order (2.11): the first-order terms integrate to zero around the circle, and the quadratic form $\tfrac12\,\mathbf h^{T}H\mathbf h$ averages to $\tfrac14 r^2(f_{xx}+f_{yy})$ because $\overline{\cos^2\theta}=\overline{\sin^2\theta}=\tfrac12$ and $\overline{\sin\theta\cos\theta}=0$. Hence points that lie *below* the average of their neighbours have $\Delta f>0$, and a harmonic function equals its circle averages.`,
      caption: String.raw`Drag the gold point and the circle's radius $r$. The map is coloured by $\Delta f$ (red positive: the point lies below its neighbours' average; blue negative: above). The right plot shows $4\bigl(\text{average on the circle}-f(p)\bigr)/r^2$ against $r$; it tends to $\Delta f(p)$ (dashed, computed from the second derivatives) as $r\to0$. The saddle $x^2-y^2$ and the cubic $x^3-3xy^2$ are harmonic: their circle averages equal the centre value for every $r$.`,
      deps: ['vcalc-3.4', 'vcalc-3.3'],
      refs: ['Marsden–Tromba §4.4'],
      tags: ['Laplacian', 'harmonic', 'averages'],
      viz(v) {
        const LAP = {
          hills: { label: 'two hills', f: hills },
          bowl: { label: 'bowl', f: (x, y) => 0.75 * (x * x + y * y) - 0.4 },
          saddle: { label: 'harmonic saddle', f: (x, y) => 0.7 * (x * x - y * y) },
          cubic: { label: 'harmonic cubic', f: (x, y) => 0.6 * (x ** 3 - 3 * x * y * y) },
          ripple: { label: 'ripples', f: (x, y) => 0.85 * Math.cos(3.2 * Math.hypot(x, y)) * Math.exp(-0.5 * (x * x + y * y)) },
        };
        const pick = v.select('function', Object.entries(LAP).map(([value, o]) => ({ value, label: o.label })), 'hills');
        const rr = v.slider('radius $r$', 0.01, 0.8, 0.35, { log: true, sig: 2 });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 420, weight: 1.1, xlabel: 'x', ylabel: 'y', title: 'colour: $\\Delta f$; lines: contours of $f$' });
        const R = v.stage({ x: [0.01, 0.8], y: [-3, 3], xlog: true, axes: 'box', gutter: true, height: 420, weight: 1, minWidth: 260, xlabel: 'radius r', title: '$4(\\text{circle average}-f(p))/r^2$' });
        const P = S.handle(0.2, 0.15, { color: 'gold', label: 'p', constrain: { x: [-1.0, 1.0], y: [-1.0, 1.0] } });
        const scale = {};
        const rangeOf = (k) => {
          if (scale[k]) return scale[k];
          const f = LAP[k].f, a = [];
          for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) a.push(Math.abs(lap2(f, -1.3 + 0.108 * i, -1.3 + 0.108 * j)));
          a.sort((p, q) => p - q);
          return (scale[k] = Math.max(0.6, a[Math.floor(0.97 * (a.length - 1))]));
        };
        const avg = (f, r) => { let s = 0; const n = 128; for (let i = 0; i < n; i++) { const th = (TAU * i) / n; s += f(P.x + r * Math.cos(th), P.y + r * Math.sin(th)); } return s / n; };
        let st = {};
        v.render(() => {
          const f = LAP[pick.value].f, m = rangeOf(pick.value), r = rr.value;
          S.heat((x, y) => lap2(f, x, y), { range: [-m, m], cmap: 'theme-diverging', res: 3, key: 'L' + pick.value });
          S.contour(f, Array.from({ length: 21 }, (_, i) => -1 + 0.1 * i), { color: 'ink', alpha: 0.35, width: 1 });
          S.circle(P.x, P.y, r, { color: 'orange', width: 2.4 });
          for (let i = 0; i < 16; i++) { const th = (TAU * i) / 16; S.dot(P.x + r * Math.cos(th), P.y + r * Math.sin(th), { r: 3.2, color: 'orange' }); }
          const fp = f(P.x, P.y), a = avg(f, r), L = lap2(f, P.x, P.y), est = (4 * (a - fp)) / (r * r);
          const gradF = (x, y) => grad2(f, x, y, 0.001), dg = div2(gradF, P.x, P.y, 0.02);
          const rs = Array.from({ length: 50 }, (_, i) => 0.01 * Math.pow(80, i / 49)), ys = rs.map((q) => (4 * (avg(f, q) - fp)) / (q * q));
          const lo = Math.min(L, ...ys), hi = Math.max(L, ...ys), pad = Math.max(0.5, 0.2 * (hi - lo));
          R.setView([0.01, 0.8], [lo - pad, hi + pad]);
          R.hline(L, { color: 'green', dash: true, width: 2 });
          R.path(rs.map((q, i) => [q, ys[i]]), { color: 'accent', width: 2.4 });
          R.dot(r, est, { r: 6, color: 'gold' });
          st = { fp, a, L, est, dg };
        });
        v.legend([['orange', 'circle of radius $r$ about $p$'], ['green', '$\\Delta f(p)=f_{xx}+f_{yy}$', { dash: true }], ['accent', 'estimate from the circle average']]);
        v.readout(() => `$f(p)=${tf(st.fp, 4)}$, average over the circle $=${tf(st.a, 4)}$ — $p$ lies ${Math.abs(st.a - st.fp) < 1e-6 ? '**exactly at** the average' : st.a > st.fp ? '**below**' : '**above**'} ${Math.abs(st.a - st.fp) < 1e-6 ? '' : 'the average of its neighbours'}.\nEstimate $4(\\text{avg}-f(p))/r^2=${tf(st.est, 4)}$; $\\Delta f(p)=f_{xx}+f_{yy}=${tf(st.L, 4)}$; $\\operatorname{div}\\nabla f$ by stencils $=${tf(st.dg, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Proposition',
      name: 'Product rules for div, grad and curl',
      statement: String.raw`For $C^1$ scalar fields $f,g$ and a $C^1$ vector field $\mathbf F$ on an open set of $\R^3$:
$$\nabla(fg)=f\nabla g+g\nabla f,\qquad \operatorname{div}(f\mathbf F)=f\operatorname{div}\mathbf F+\nabla f\cdot\mathbf F,\qquad \operatorname{curl}(f\mathbf F)=f\operatorname{curl}\mathbf F+\nabla f\times\mathbf F.$$
For a planar field $\mathbf F=(u,v)$ the last one has the scalar form $\operatorname{curl}(f\mathbf F)=f\,(v_x-u_y)+(f_xv-f_yu)$.`,
      idea: String.raw`Each component of each identity is the one-variable product rule (pma-5.3) applied to one partial derivative: $\partial_x(fu)=f\,u_x+f_x\,u$, and so on. Summing the right components gives the divergence, taking the antisymmetric combinations gives the curl; the second term in each is what you get by differentiating the *scalar* factor.`,
      caption: String.raw`Choose a rule, a scalar $f$ and a field. The left map is the derivative of the product computed directly (stencils applied to $f\mathbf F$); the middle map is the right-hand side of the rule (stencils applied to the factors separately). The right map is their difference: blank. Tick the box to forget the second term and see what it contributed. Drag the gold point to compare the two numbers at one cell.`,
      deps: ['vcalc-3.4', 'vcalc-3.5', 'vcalc-2.7', 'pma-5.3'],
      refs: ['Marsden–Tromba §4.4'],
      tags: ['product rule', 'identities'],
      viz(v) {
        const SC = {
          bump: { label: 'bump', f: (x, y) => 1.5 * Math.exp(-(x * x + y * y) / 0.8) },
          ramp: { label: 'ramp', f: (x, y) => 1 + 0.6 * x - 0.4 * y + 0.3 * x * y },
          wave: { label: 'waves', f: (x, y) => Math.sin(2 * x) * Math.cos(2 * y) },
        };
        const rule = v.select('rule', [{ value: 'div', label: 'div(fF)' }, { value: 'curl', label: 'curl(fF)' }, { value: 'grad', label: '∇(fg), g = hills' }], 'div');
        const fs = v.select('scalar $f$', Object.entries(SC).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const fl = v.select('field $\\mathbf F$', fieldOptions(['mix', 'rot', 'source', 'eddies']), 'mix');
        const brk = v.toggle('forget the second term', false);
        const opts = { equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, x: [-1.2, 1.2], y: [-1.2, 1.2] };
        const A = v.stage({ ...opts, xlabel: 'x', ylabel: 'y', title: 'direct' });
        const Bst = v.stage({ ...opts, xlabel: 'x', title: 'by the rule' });
        const C = v.stage({ ...opts, xlabel: 'x', title: 'difference' });
        const P = A.handle(0.35, 0.25, { color: 'gold', label: 'cell', constrain: { x: [-1.1, 1.1], y: [-1.1, 1.1] } });
        const ops = () => {
          const f = SC[fs.value].f, F = FIELDS[fl.value].F, k = rule.value;
          if (k === 'div') return {
            vec: false,
            direct: (x, y) => div2((a, b) => { const s = f(a, b), q = F(a, b); return [s * q[0], s * q[1]]; }, x, y),
            terms: (x, y) => { const g = grad2(f, x, y), q = F(x, y); return [f(x, y) * div2(F, x, y), g[0] * q[0] + g[1] * q[1]]; },
          };
          if (k === 'curl') return {
            vec: false,
            direct: (x, y) => curl2((a, b) => { const s = f(a, b), q = F(a, b); return [s * q[0], s * q[1]]; }, x, y),
            terms: (x, y) => { const g = grad2(f, x, y), q = F(x, y); return [f(x, y) * curl2(F, x, y), g[0] * q[1] - g[1] * q[0]]; },
          };
          return {
            vec: true,
            direct: (x, y) => grad2((a, b) => f(a, b) * hills(a, b), x, y),
            terms: (x, y) => { const g = grad2(f, x, y), h = grad2(hills, x, y); return [[f(x, y) * h[0], f(x, y) * h[1]], [hills(x, y) * g[0], hills(x, y) * g[1]]]; },
          };
        };
        const TEX = { div: String.raw`f\operatorname{div}\mathbf F+\nabla f\cdot\mathbf F`, curl: String.raw`f\operatorname{curl}\mathbf F+(\nabla f\times\mathbf F)_z`, grad: String.raw`f\nabla g+g\nabla f` };
        let st = {};
        v.render(() => {
          const o = ops(), key = `${rule.value}|${fs.value}|${fl.value}`, vec = o.vec;
          const ruleAt = (x, y) => { const t = o.terms(x, y); if (vec) return brk.value ? t[0] : [t[0][0] + t[1][0], t[0][1] + t[1][1]]; return brk.value ? t[0] : t[0] + t[1]; };
          const val = (q) => (vec ? Math.hypot(q[0], q[1]) : q);
          let m = 0.3;
          for (let i = 0; i < 17; i++) for (let j = 0; j < 17; j++) m = Math.max(m, Math.abs(val(o.direct(-1.2 + 0.15 * i, -1.2 + 0.15 * j))));
          const cm = vec ? 'theme' : 'theme-diverging', rg = vec ? [0, m] : [-m, m];
          A.heat((x, y) => val(o.direct(x, y)), { range: rg, cmap: cm, color: 'accent', res: 4, key: 'A' + key });
          Bst.heat((x, y) => val(ruleAt(x, y)), { range: rg, cmap: cm, color: 'accent', res: 4, key: 'B' + key + brk.value });
          const diff = (x, y) => { const d = o.direct(x, y), r = ruleAt(x, y); return vec ? Math.hypot(d[0] - r[0], d[1] - r[1]) : Math.abs(d - r); };
          C.heat(diff, { range: [0, m], cmap: 'theme', color: 'red', res: 4, key: 'C' + key + brk.value });
          let mx = 0;
          for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) mx = Math.max(mx, diff(-1.2 + 0.1 * i, -1.2 + 0.1 * j));
          for (const S of [Bst, C]) S.dot(P.x, P.y, { r: 5, color: 'gold' });
          C.corner(`max |difference| = ${mx.toExponential(1)}`, 'tl', { plate: true });
          st = { d: val(o.direct(P.x, P.y)), r: val(ruleAt(P.x, P.y)), mx, rule: rule.value };
        });
        v.legend([['gold', 'the cell compared in the readout', { dot: true }]]);
        v.readout(() => `Rule: $${TEX[st.rule]}$ ${brk.value ? '— with the **second term dropped**' : ''}.\nAt the gold cell: direct $${tf(st.d, 6)}$, rule $${tf(st.r, 6)}$. Largest difference over the window: $${v.sci(st.mx, 2)}$ ${brk.value ? '(not small: the term you dropped matters)' : '(finite-difference rounding only)'}.`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Proposition',
      name: 'Div, grad, curl in curvilinear coordinates',
      statement: String.raw`In **cylindrical** coordinates $(\rho,\varphi,z)$ with orthonormal frame $\hat{\boldsymbol\rho},\hat{\boldsymbol\varphi},\hat{\mathbf z}$,
$$\nabla f=f_\rho\,\hat{\boldsymbol\rho}+\tfrac1\rho f_\varphi\,\hat{\boldsymbol\varphi}+f_z\,\hat{\mathbf z},\qquad \operatorname{div}\mathbf F=\tfrac1\rho\partial_\rho(\rho F_\rho)+\tfrac1\rho\partial_\varphi F_\varphi+\partial_zF_z,$$
$$(\operatorname{curl}\mathbf F)_z=\tfrac1\rho\bigl(\partial_\rho(\rho F_\varphi)-\partial_\varphi F_\rho\bigr).$$
In **spherical** coordinates $(r,\theta,\varphi)$ ($\theta$ the polar angle), $\nabla f=f_r\hat{\mathbf r}+\tfrac1rf_\theta\hat{\boldsymbol\theta}+\tfrac1{r\sin\theta}f_\varphi\hat{\boldsymbol\varphi}$ and $\operatorname{div}\mathbf F=\tfrac1{r^2}\partial_r(r^2F_r)+\tfrac1{r\sin\theta}\partial_\theta(\sin\theta\,F_\theta)+\tfrac1{r\sin\theta}\partial_\varphi F_\varphi$. In particular for the radial field $\mathbf F=r^{-n}\hat{\mathbf r}$: $\operatorname{div}\mathbf F=(2-n)\,r^{-n-1}$ in $\R^3$ and $(1-n)\,r^{-n-1}$ in $\R^2$, and for the swirl $\mathbf F=\rho^{-n}\hat{\boldsymbol\varphi}$ in the plane $(\operatorname{curl}\mathbf F)_z=(1-n)\rho^{-n-1}$.`,
      idea: String.raw`The extra factors are the scale factors of the coordinates: moving $d\rho$, $d\varphi$, $dz$ displaces a point by $d\rho$, $\rho\,d\varphi$, $dz$. Computing the flux through a small coordinate box (3.6) or the circulation around a small coordinate rectangle (3.7) in those lengths produces the $\tfrac1\rho\partial_\rho(\rho\,\cdot)$ pattern: the area of the arc at radius $\rho$ grows with $\rho$. For $\mathbf F=r^{-n}\hat{\mathbf r}$ the flux through a sphere of radius $r$ is $4\pi r^{2-n}$, constant exactly when $n=2$; this is why only the inverse-square field is divergence-free.`,
      caption: String.raw`Choose a quantity, set the exponent $n$ and drag the gold point. The map shows the divergence (or curl) computed by finite differences on a Cartesian grid, compressed with $\operatorname{asinh}$. The right plot multiplies by $r^{n+1}$ and runs over $n$: the dots (Cartesian stencils at the gold point's radius) fall on the straight line given by the curvilinear formula, which vanishes at $n=2$ in $\R^3$ and $n=1$ in $\R^2$.`,
      deps: ['vcalc-3.4', 'vcalc-3.5', 'vcalc-2.7', 'vcalc-1.6'],
      refs: ['Marsden–Tromba §4.4'],
      tags: ['curvilinear', 'spherical', 'cylindrical'],
      viz(v) {
        const Q = v.select('quantity', [{ value: 'd3', label: 'div of $\\hat r/r^n$ in $\\mathbb R^3$' }, { value: 'd2', label: 'div of $\\hat r/r^n$ in $\\mathbb R^2$' }, { value: 'c2', label: 'curl of $\\hat\\varphi/\\rho^n$ in $\\mathbb R^2$' }], 'd3');
        const nn = v.slider('exponent $n$', -1, 4, 1.5, { step: 0.05 });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 420, weight: 1.1, xlabel: 'x', ylabel: 'y', title: 'the quantity on the plane $z=0$ (asinh scale)' });
        const R = v.stage({ x: [-1, 4], y: [-3, 3], axes: 'box', gutter: true, height: 420, weight: 1, minWidth: 260, xlabel: 'exponent n', title: '$r^{n+1}\\times$ the quantity, against $n$' });
        const P = S.handle(0.55, 0.35, { color: 'gold', label: 'p', constrain: { x: [-1.2, 1.2], y: [-1.2, 1.2] } });
        const D = (g, t, h) => (-g(t + 2 * h) + 8 * g(t + h) - 8 * g(t - h) + g(t - 2 * h)) / (12 * h);
        const num = (q, n, x, y) => {
          const r = Math.hypot(x, y), h = 0.02 * r;
          if (q === 'd3') { const F = (a, b, c) => { const s = Math.hypot(a, b, c) ** (-n - 1); return [a * s, b * s, c * s]; }; return D((s) => F(s, y, 0)[0], x, h) + D((s) => F(x, s, 0)[1], y, h) + D((s) => F(x, y, s)[2], 0, h); }
          if (q === 'd2') return div2((a, b) => { const s = Math.hypot(a, b) ** (-n - 1); return [a * s, b * s]; }, x, y, h);
          return curl2((a, b) => { const s = Math.hypot(a, b) ** (-n - 1); return [-b * s, a * s]; }, x, y, h);
        };
        const formula = (q, n, r) => ((q === 'd3' ? 2 - n : 1 - n) * r ** (-n - 1));
        let st = {};
        v.render(() => {
          const q = Q.value, n = nn.value, r = Math.hypot(P.x, P.y);
          S.heat((x, y) => { const a = num(q, n, x, y); return Math.asinh(a * 2); }, { range: [-4, 4], cmap: 'theme-diverging', res: 4, key: `${q}|${n}` });
          S.contour((x, y) => Math.hypot(x, y), [0.25, 0.5, 0.75, 1, 1.25], { color: 'ink', alpha: 0.2, width: 1 });
          S.circle(0, 0, r, { color: 'orange', width: 2 });
          R.hline(0, { color: 'muted', alpha: 0.5, width: 1 });
          R.fn((m) => (q === 'd3' ? 2 - m : 1 - m), { domain: [-1, 4], color: 'green', width: 2.4 });
          for (let k = 0; k <= 20; k++) { const m = -1 + 0.25 * k; R.dot(m, num(q, m, P.x, P.y) * r ** (m + 1), { r: 3.5, color: 'accent' }); }
          R.dot(n, num(q, n, P.x, P.y) * r ** (n + 1), { r: 7, color: 'gold' });
          st = { q, n, r, a: num(q, n, P.x, P.y), f: formula(q, n, r) };
        });
        v.legend([['green', 'curvilinear formula, $(2-n)$ or $(1-n)$'], ['accent', 'Cartesian stencils at the radius of $p$', { dot: true }], ['orange', 'the circle $r=\\text{const}$ through $p$']]);
        v.readout(() => `At $p$ ($r=${tf(st.r, 3)}$, $n=${tf(st.n, 2)}$): Cartesian finite differences give $${v.sci(st.a, 4)}$; the curvilinear formula $${st.q === 'd3' ? '(2-n)' : '(1-n)'}\\,r^{-n-1}$ gives $${v.sci(st.f, 4)}$.${Math.abs(st.f) < 1e-9 ? ' This is the borderline exponent: the field has zero ' + (st.q === 'c2' ? 'curl' : 'divergence') + ' away from the origin.' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Concept',
      name: 'Sources, sinks and vortices',
      statement: String.raw`In the plane, a **point source** of strength $Q$ at $c$ is the field $\mathbf F=\dfrac{Q}{2\pi}\dfrac{\mathbf x-c}{|\mathbf x-c|^2}$ (a **sink** when $Q<0$), and a **point vortex** of circulation $\Gamma$ at $c$ is $\mathbf F=\dfrac{\Gamma}{2\pi}\dfrac{(-(y-c_2),\,x-c_1)}{|\mathbf x-c|^2}$. Away from $c$ both have $\operatorname{div}\mathbf F=0$ and $\operatorname{curl}\mathbf F=0$, yet the flux of a source through every circle around $c$ equals $Q$, and the circulation of a vortex around every such circle equals $\Gamma$: the divergence (curl) is concentrated entirely at the point. Fields add, so any collection of such points defines a field whose flux (circulation) through a loop is the sum of the strengths inside it.`,
      idea: String.raw`On a circle of radius $\rho$ about a source the field points outward with magnitude $Q/(2\pi\rho)$, so the flux is $\tfrac{Q}{2\pi\rho}\cdot2\pi\rho=Q$ for every $\rho$: nothing is created between two circles, which is $\operatorname{div}\mathbf F=0$ there (3.6, 3.11 with $n=1$). The same computation with the tangential component gives the vortex circulation. Shrinking the circle (3.6, 3.7) the density flux/area blows up like $Q/(\pi\rho^2)$: all of $\operatorname{div}\mathbf F$ sits at the point. This idealisation, and its precise form as a delta function, is what Green's functions (Tong ch. 5) are built from.`,
      caption: String.raw`Choose a tool and click to place a source, sink or vortex of the chosen strength (or erase one). Flow lines of the combined field are redrawn live. Drag the gold point and set the orange circle's radius: the flux through it is the total strength of the sources and sinks inside and the circulation is the total vortex strength inside, whatever the circle's size or shape of the arrangement; and at the circle's centre the divergence and curl are $0$ unless an element sits there. The bars on the right check this on a small circle around each element.`,
      scope: String.raw`A mathematical idealisation: real flows have no infinite speeds. The field is singular at each element, and flux or circulation through a circle passing through an element is not defined (the readout says so).`,
      deps: ['vcalc-3.4', 'vcalc-3.5', 'vcalc-3.2'],
      refs: ['Schey ch. II'],
      tags: ['sources', 'vortices', 'flow'],
      viz(v) {
        const init = () => [{ t: 'source', x: -0.7, y: 0.1, k: 2.5 }, { t: 'sink', x: 0.7, y: 0.1, k: -2.5 }, { t: 'vortex', x: 0, y: 0.8, k: 2 }];
        let E = init();
        const tool = v.select('tool', [{ value: 'source', label: 'source' }, { value: 'sink', label: 'sink' }, { value: 'vortex+', label: 'vortex ↺' }, { value: 'vortex-', label: 'vortex ↻' }, { value: 'erase', label: 'erase' }], 'source');
        const str = v.slider('strength', 0.5, 4, 2, { step: 0.1 });
        const rho = v.slider('circle radius', 0.1, 1.2, 0.4, { step: 0.01 });
        v.button('reset', () => { E = init(); });
        v.button('clear', () => { E = []; });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 440, weight: 1.15, xlabel: 'x', ylabel: 'y', title: 'click to place' });
        const R = v.stage({ x: [0.4, 8.6], y: [-4.5, 4.5], axes: 'box', gutter: true, height: 440, weight: 1, minWidth: 260, xticks: [], title: 'flux and circulation on a small circle around each element' });
        S.onClick((x, y) => {
          const tl = tool.value;
          if (tl === 'erase') { let b = -1, d = 0.15; E.forEach((e, i) => { const q = Math.hypot(e.x - x, e.y - y); if (q < d) { d = q; b = i; } }); if (b >= 0) E.splice(b, 1); }
          else if (E.length < 8) E.push(tl === 'source' ? { t: 'source', x, y, k: str.value } : tl === 'sink' ? { t: 'sink', x, y, k: -str.value } : { t: 'vortex', x, y, k: tl === 'vortex+' ? str.value : -str.value });
          v.invalidate();
        });
        const C = S.handle(-0.45, 0.1, { color: 'gold', label: 'c', constrain: { x: [-1.2, 1.2], y: [-1.2, 1.2] } });
        const field = (x, y) => {
          let u = 0, w = 0;
          for (const e of E) {
            const dx = x - e.x, dy = y - e.y, r2 = dx * dx + dy * dy + 1e-10, s = e.k / (TAU * r2);
            if (e.t === 'vortex') { u += -dy * s; w += dx * s; } else { u += dx * s; w += dy * s; }
          }
          return [u, w];
        };
        let key = '', lines = [];
        const build = () => {
          lines = [];
          const stop = (p) => E.some((e) => Math.hypot(p[0] - e.x, p[1] - e.y) < 0.045);
          const trace = (p0, sgn) => {
            const P = [p0]; let p = p0;
            for (let i = 0; i < 260; i++) {
              const f = field(p[0], p[1]), L = Math.hypot(f[0], f[1]);
              if (L < 1e-9) break;
              const step = (q, d) => { const g = field(q[0], q[1]), l = Math.hypot(g[0], g[1]) || 1; return [(sgn * d * g[0]) / l, (sgn * d * g[1]) / l]; };
              const k1 = step(p, 0.02), k2 = step([p[0] + k1[0] / 2, p[1] + k1[1] / 2], 0.02), k3 = step([p[0] + k2[0] / 2, p[1] + k2[1] / 2], 0.02), k4 = step([p[0] + k3[0], p[1] + k3[1]], 0.02);
              p = [p[0] + (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, p[1] + (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
              if (Math.abs(p[0]) > 1.35 || Math.abs(p[1]) > 1.35 || stop(p)) break;
              P.push(p);
            }
            return P;
          };
          for (const e of E) {
            if (e.t === 'vortex') for (const r of [0.12, 0.25, 0.4, 0.6]) lines.push(trace([e.x + r, e.y], 1));
            else for (let i = 0; i < 14; i++) { const th = (TAU * (i + 0.5)) / 14; lines.push(trace([e.x + 0.06 * Math.cos(th), e.y + 0.06 * Math.sin(th)], e.t === 'source' ? 1 : -1)); }
          }
          for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const p = [-1.1 + 0.44 * i, -1.1 + 0.44 * j]; lines.push(trace(p, 1), trace(p, -1)); }
        };
        let st = {};
        v.render(() => {
          const k = JSON.stringify(E);
          if (k !== key) { key = k; build(); }
          for (const L of lines) if (L.length > 2) S.path(L, { color: 'accent', width: 1.2, alpha: 0.5 });
          for (const e of E) {
            const col = e.t === 'source' ? 'red' : e.t === 'sink' ? 'blue' : 'purple';
            S.dot(e.x, e.y, { r: 9, color: col });
            S.text(e.t === 'source' ? '+' : e.t === 'sink' ? '−' : e.k > 0 ? '↺' : '↻', e.x, e.y, { color: 'panel', size: 14, align: 'center', baseline: 'middle' });
          }
          const r = rho.value, n = 160;
          S.circle(C.x, C.y, r, { color: 'orange', width: 2.4 });
          const circ = (cx, cy, rr) => { let fl = 0, ci = 0; for (let i = 0; i < n; i++) { const th = (TAU * i) / n, f = field(cx + rr * Math.cos(th), cy + rr * Math.sin(th)); fl += (f[0] * Math.cos(th) + f[1] * Math.sin(th)) * rr * (TAU / n); ci += (-f[0] * Math.sin(th) + f[1] * Math.cos(th)) * rr * (TAU / n); } return [fl, ci]; };
          const [fl, ci] = circ(C.x, C.y, r);
          let onRing = false, QQ = 0, GG = 0;
          for (const e of E) { const d = Math.hypot(e.x - C.x, e.y - C.y); if (Math.abs(d - r) < 0.03) onRing = true; if (d < r) { if (e.t === 'vortex') GG += e.k; else QQ += e.k; } }
          const bars = E.map((e) => circ(e.x, e.y, 0.1));
          R.hline(0, { color: 'muted', alpha: 0.5, width: 1 });
          E.forEach((e, i) => {
            R.rect(i + 0.6, 0, i + 1, e.t === 'vortex' ? 0 : e.k, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.2, dash: true });
            R.rect(i + 0.6, 0, i + 1, bars[i][0], { fill: 'accent', fillAlpha: 0.7, stroke: false });
            R.rect(i + 1.05, 0, i + 1.45, e.t === 'vortex' ? e.k : 0, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.2, dash: true });
            R.rect(i + 1.05, 0, i + 1.45, bars[i][1], { fill: 'orange', fillAlpha: 0.7, stroke: false });
            R.text(e.t === 'source' ? 'source' : e.t === 'sink' ? 'sink' : 'vortex', i + 1, -4.1, { size: 11, align: 'center', color: 'muted' });
          });
          st = { fl, ci, onRing, QQ, GG, dv: div2(field, C.x + 1e-3, C.y + 1e-3, 0.002), cu: curl2(field, C.x + 1e-3, C.y + 1e-3, 0.002), n: E.length, near: E.some((e) => Math.hypot(e.x - C.x, e.y - C.y) < 0.05) };
        });
        v.legend([['accent', 'flux (solid bar) vs strength (outline)'], ['orange', 'circulation (solid) vs strength (outline)'], ['red', 'source', { dot: true }], ['blue', 'sink', { dot: true }], ['purple', 'vortex', { dot: true }]]);
        v.readout(() => st.onRing ? 'The circle passes through an element: the field is singular there, so flux and circulation are not defined. Change the radius or move the circle.' : `${st.n} element${st.n === 1 ? '' : 's'}. Through the orange circle: flux $=${tf(st.fl, 4)}$ (strengths of sources and sinks inside: $${tf(st.QQ, 4)}$), circulation $=${tf(st.ci, 4)}$ (vortex strengths inside: $${tf(st.GG, 4)}$).\nAt its centre: $\\operatorname{div}\\mathbf F=${st.near ? '\\text{singular}' : tf(st.dv, 4)}$, $\\operatorname{curl}\\mathbf F=${st.near ? '\\text{singular}' : tf(st.cu, 4)}$ ${st.near ? '' : '(zero away from the elements)'}.`);
      },
    },
  ],
};
