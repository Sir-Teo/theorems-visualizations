// Differential Geometry of Curves & Surfaces — Chapter 2: Space curves (part b: 2.8–2.13)
import {
  TAU, clamp, add, sub, mul, dot, cross, len, unit, derivs, mkCurve, tableOf, atS, dds, CURVES, curveChoices, FC,
  scene, plot, drawTrack, drawFrame, bbox, sphereWire, trigInterp, angleDeg,
} from './ch02.shared.js';

const PI = Math.PI;

export default {
  collection: 'dg',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Local canonical form',
      statement: String.raw`Let $\alpha(s)$ be a unit-speed curve of class $C^4$ with $\kappa(0) > 0$, and let $T, N, B, \kappa, \kappa', \tau$ denote values at $s = 0$. Then in the frame at $\alpha(0)$,
$$\alpha(s) - \alpha(0) = \Big(s - \tfrac{\kappa^2}{6}s^3\Big)T + \Big(\tfrac{\kappa}{2}s^2 + \tfrac{\kappa'}{6}s^3\Big)N + \tfrac{\kappa\tau}{6}s^3\,B + O(s^4).$$
So to leading order the curve projects to a **parabola** $(s, \tfrac{\kappa}{2}s^2)$ in the osculating plane, to a **cusp** $(\tfrac{\kappa}{2}s^2, \tfrac{\kappa\tau}{6}s^3)$ in the normal plane when $\tau \neq 0$, and to an **inflected cubic** $(s, \tfrac{\kappa\tau}{6}s^3)$ in the rectifying plane. Curvature is thus the second-order bending and torsion the third-order lift out of the osculating plane.`,
      idea: String.raw`Taylor's theorem (pma-5.15) gives $\alpha(s) - \alpha(0) = s\alpha' + \tfrac{s^2}{2}\alpha'' + \tfrac{s^3}{6}\alpha''' + O(s^4)$. The Frenet–Serret equations (dg-2.4) turn the derivatives into frame vectors: $\alpha' = T$, $\alpha'' = \kappa N$, and $\alpha''' = (\kappa N)' = -\kappa^2 T + \kappa' N + \kappa\tau B$. Collecting the coefficients of $T$, $N$, $B$ gives the expansion. The sign of the $B$-coefficient is the sign of $\tau$: this is how the handedness of a curve shows up locally.`,
      caption: String.raw`Choose a curve and a base point. In each of the three panels the black line is the true projection of the curve (within arc length $w$ of the base point) onto a coordinate plane of the Frenet frame, and the dashed orange line is the cubic expansion of the theorem. Increase the window $w$ until the approximation visibly fails. The readout measures the largest error for windows $w$ and $w/2$; their ratio is close to $16 = 2^4$, the $O(s^4)$ of the theorem. Note how every panel looks different: parabola, cusp and inflected cubic.`,
      deps: ['dg-2.4', 'pma-5.15'],
      refs: ['do Carmo §1-6'],
      tags: ['Taylor expansion', 'Frenet frame'],
      viz(v) {
        const sel = v.select('curve', curveChoices(['trefoil', 'viviani', 'cubic', 'helix']), 'trefoil');
        const uS = v.slider('base point $s_0/L$', 0, 1, 0.12, { step: 0.001 });
        const wS = v.slider('window $w$', 0.05, 1.4, 0.6, { step: 0.005 });
        const { S, sc } = scene(v, { title: 'the curve and its frame at the base point', height: 300, full: true });
        const mk = (title, xl, yl) => plot(v, { xlabel: xl, ylabel: yl, title, height: 320, weight: 1, minWidth: 230 });
        const PO = mk('osculating plane: parabola', '$T$-coordinate', '$N$-coordinate');
        const PN = mk('normal plane: cusp', '$N$-coordinate', '$B$-coordinate');
        const PR = mk('rectifying plane: inflected cubic', '$T$-coordinate', '$B$-coordinate');
        v.legend([['ink', 'the curve'], ['orange', 'cubic expansion', { dash: true }]]);
        let tab = null, key = '', info = {};
        v.render(() => {
          if (key !== sel.value) { key = sel.value; tab = tableOf(CURVES[key], 480); }
          const c = tab.c, w = wS.value, L = tab.L;
          const s0 = c.closed ? uS.value * L : Math.min(L - w, Math.max(w, uS.value * L));
          const f = atS(tab, s0), { T, N, B, p } = f;
          const dk = dds(c, f.t, (q) => [q.kappa])[0], k = f.kappa, ta = f.tau;
          const coords = (sg) => { const q = atS(tab, s0 + sg).p, d = sub(q, p); return [dot(d, T), dot(d, N), dot(d, B)]; };
          const canon = (sg) => [sg - (k * k * sg ** 3) / 6, (k * sg * sg) / 2 + (dk * sg ** 3) / 6, (k * ta * sg ** 3) / 6];
          const err = (W) => { let m = 0; for (let i = -20; i <= 20; i++) { const sg = (W * i) / 20, a = coords(sg), b = canon(sg); m = Math.max(m, len(sub(a, b))); } return m; };
          const n = 80, tr = [], cn = [];
          for (let i = 0; i <= n; i++) { const sg = -w + (2 * w * i) / n; tr.push(coords(sg)); cn.push(canon(sg)); }
          const view = (P, a, b) => {
            const xs = tr.concat(cn).map((q) => q[a]), ys = tr.concat(cn).map((q) => q[b]);
            let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            const px = 0.08 * (x1 - x0 || 1), py = 0.12 * (y1 - y0 || 1);
            P.setView([x0 - px, x1 + px], [y0 - py, y1 + py]);
            P.path(tr.map((q) => [q[a], q[b]]), { color: 'ink', width: 2.6 });
            P.path(cn.map((q) => [q[a], q[b]]), { color: 'orange', width: 2.2, dash: [6, 4] });
            P.dot(0, 0, { color: 'gold', r: 5 });
          };
          view(PO, 0, 1); view(PN, 1, 2); view(PR, 0, 2);
          sc.begin();
          drawTrack(sc, tab.p, { color: 'muted', width: 2, alpha: 0.7 });
          drawTrack(sc, Array.from({ length: 41 }, (_, i) => atS(tab, s0 - w + (2 * w * i) / 40).p), { color: 'ink', width: 3.4 });
          sc.disc(T, N, 0.6, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1 }, p);
          drawFrame(sc, p, f, 0.7);
          sc.dot(p, { color: 'gold', r: 6 });
          sc.flush();
          const e1 = err(w), e2 = err(w / 2);
          info = { k, dk, ta, e1, e2, w };
        });
        v.readout(() => String.raw`at the base point: $\kappa=${v.fix(info.k, 3)}$, $\kappa'=${v.fix(info.dk, 3)}$, $\tau=${v.fix(info.ta, 3)}$
largest error of the cubic expansion on $|s|\le w=${v.fix(info.w, 2)}$: $${v.sci(info.e1 + 1e-17, 2)}$; on $|s|\le w/2$: $${v.sci(info.e2 + 1e-17, 2)}$; ratio $${v.fix(info.e1 / (info.e2 || 1), 1)}$ (an $O(s^4)$ error predicts $16$)`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'The Darboux vector',
      statement: String.raw`For a unit-speed curve with $\kappa > 0$, the **Darboux vector** is $\omega = \tau\, T + \kappa\, B$. The Frenet–Serret equations say precisely that
$$T' = \omega \times T, \qquad N' = \omega \times N, \qquad B' = \omega \times B,$$
so the Frenet frame moves like a rigid body spinning with instantaneous angular velocity $\omega$: it turns about the axis $\omega/|\omega|$ at the rate $|\omega| = \sqrt{\kappa^2 + \tau^2}$ radians per unit of arc length. Torsion is the part of the rotation about the tangent, curvature the part about the binormal.`,
      idea: String.raw`Use $T\times N = B$, $N \times B = T$, $B\times T = N$. Then $\omega\times T = \kappa B\times T = \kappa N$, $\omega\times N = \tau T\times N + \kappa B\times N = \tau B - \kappa T$, and $\omega\times B = \tau T\times B = -\tau N$: these are exactly the three equations of dg-2.4. The skew-symmetric matrix $A$ of the Frenet–Serret system is the matrix of the cross product with $\omega$, which is why the frame rotates rigidly about a single axis at each instant.`,
      caption: String.raw`The gold arrow and dashed line are the Darboux vector $\omega = \tau\mathbf T + \kappa\mathbf B$ at the moving point. To test the claim independently, the readout rebuilds the rotation that carries the frame at $s-\delta$ to the frame at $s+\delta$ (a rotation matrix from the three vectors), extracts its axis and angle, and compares: the measured angular speed against $|\omega|$ in the plot (gold dots on the blue curve), and the measured axis against $\omega$. For the helix $\omega$ is the same vector everywhere, the axis of the helix.`,
      deps: ['dg-2.4'],
      refs: ['do Carmo §1-5'],
      tags: ['Darboux vector', 'rotation'],
      viz(v) {
        const sel = v.select('curve', curveChoices(['helix', 'trefoil', 'viviani', 'cubic']), 'trefoil');
        const uS = v.slider('position $s/L$', 0, 1, 0.18, { step: 0.001 });
        const { S, sc } = scene(v, { title: 'the frame spins about the Darboux vector' });
        const P = plot(v, { xlabel: 'arc length $s$', ylabel: 'rate of turning', title: 'angular speed of the frame' });
        v.legend([['blue', '$|\\omega|=\\sqrt{\\kappa^2+\\tau^2}$'], ['gold', 'measured rotation rate of the frame', { dot: true }]]);
        let tab = null, key = '', info = {};
        const PER = 14, delta = 1e-3;
        // rotation carrying the frame at t-δ to the frame at t+δ: axis, angle
        const spin = (c, t) => {
          const a = c.at(t + delta), b = c.at(t - delta);
          if (!a.ok || !b.ok) return null;
          const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          for (const k of ['T', 'N', 'B']) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] += a[k][i] * b[k][j];
          const ax = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]].map((x) => x / 2);
          const th = Math.atan2(len(ax), (R[0][0] + R[1][1] + R[2][2] - 1) / 2);
          return { rate: th / (2 * delta * c.speed(t)), axis: unit(ax) };
        };
        v.animate((tt) => {
          if (v.playing) uS.set((tt / PER) % 1);
          if (key !== sel.value) {
            key = sel.value; tab = tableOf(CURVES[key], 300);
            const hi = Math.max(...tab.fr.map((f) => Math.hypot(f.kappa, f.tau)));
            P.setView([0, tab.L], [0, hi * 1.2]);
          }
          const c = tab.c, s = uS.value * tab.L, f = atS(tab, s);
          sc.begin();
          drawTrack(sc, tab.p, { color: 'muted', width: 2.4 });
          let sp = null, om = null;
          if (f.ok) {
            om = add(mul(f.T, f.tau), mul(f.B, f.kappa));
            drawFrame(sc, f.p, f, 0.6, { width: 2 });
            const d = unit(om);
            sc.line(sub(f.p, mul(d, 1.2)), add(f.p, mul(d, 1.2)), { color: 'gold', width: 1.4, dash: [5, 4], alpha: 0.9 }, 1);
            sc.arrow(f.p, add(f.p, mul(om, 1.0)), { color: 'gold', width: 4, head: 12 });
            sc.tex('\\boldsymbol\\omega', add(f.p, mul(om, 1.12)), { color: 'gold', size: 16 });
            sp = spin(c, f.t);
          }
          sc.dot(f.p, { color: 'gold', r: 5 });
          sc.flush();
          P.path(tab.s.map((si, i) => [si, Math.hypot(tab.fr[i].kappa, tab.fr[i].tau)]), { color: 'blue', width: 2.6 });
          const dots = [];
          for (let i = 0; i < 40; i++) { const ti = c.t0 + ((c.t1 - c.t0) * (i + 0.5)) / 40, q = spin(c, ti); if (q) dots.push([tab.L * ((ti - c.t0) / (c.t1 - c.t0)), q.rate]); }
          P.dots(dots, { color: 'gold', r: 3.5 });
          P.vline(s, { color: 'gold', alpha: 0.6 });
          // residuals of T' = ω × T etc. from differencing
          let res = NaN;
          if (f.ok) {
            const a = c.at(f.t + delta), b = c.at(f.t - delta), spd = c.speed(f.t);
            res = 0;
            for (const k of ['T', 'N', 'B']) { const dv = sub(a[k], b[k]).map((x) => x / (2 * delta * spd)); res = Math.max(res, len(sub(dv, cross(om, f[k])))); }
          }
          info = { ok: f.ok, k: f.kappa, tau: f.tau, om: om && len(om), sp, ang: sp && om ? angleDeg(sp.axis, unit(om)) : NaN, res };
        }, { period: PER, still: 3.0 });
        v.readout(() => !info.ok ? 'here $\\kappa = 0$' : String.raw`$\kappa=${v.fix(info.k, 3)}$, $\tau=${v.fix(info.tau, 3)}$ ⇒ $|\omega|=${v.fix(info.om, 5)}$ · measured rotation rate of the frame: $${v.fix(info.sp.rate, 5)}$ · angle between measured axis and $\omega$: $${v.fix(info.ang, 3)}^\circ$
largest $|T'-\omega\times T|$, $|N'-\omega\times N|$, $|B'-\omega\times B|$ (differencing): $${v.sci(info.res + 1e-17, 2)}$`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Proposition',
      name: 'Lancret’s theorem on generalized helices',
      statement: String.raw`Let $\alpha$ be a $C^3$ curve with $\kappa > 0$. The tangent makes a constant angle $\psi \in (0, \pi)$ with some fixed direction $e$ (a **generalized helix**, or curve of constant slope) if and only if the ratio $\tau/\kappa$ is constant, and then
$$\frac{\tau}{\kappa} = \cot\psi, \qquad e = \cos\psi\, T + \sin\psi\, B .$$
Examples: the circular helix, and more generally any curve $s \mapsto (\gamma(\sigma(s)), z(s))$ drawn on a cylinder over a plane curve $\gamma$ so that the height grows in proportion to the arc length of $\gamma$ (not to the parameter!).`,
      idea: String.raw`Suppose $T\cdot e = \cos\psi$ is constant. Differentiating gives $\kappa N\cdot e = 0$, so $e$ lies in the rectifying plane: $e = \cos\psi\,T + \sin\psi\,B$ (this fixes the sign of the $B$-component). Differentiating this identity with the Frenet–Serret equations (dg-2.4) gives $e' = (\kappa\cos\psi - \tau\sin\psi)N$, and $e' = 0$ forces $\tau/\kappa = \cot\psi$. Conversely, if $\tau/\kappa = \cot\psi$ is constant, the same computation shows that the vector $\cos\psi\,T + \sin\psi\,B$ has zero derivative, so it is a constant $e$ with $T\cdot e = \cos\psi$.`,
      caption: String.raw`Pick the cross-section on the horizontal plane and the angle $\psi$ between the tangent and the vertical axis (green). With **height $\propto$ arc length** the tangent (blue, drawn at the gold point) keeps the same angle with the vertical everywhere, and the plot shows $\tau/\kappa$ (blue) sitting exactly on $\cot\psi(s)$ (dashed gold), constant. Switch to **height $\propto$ parameter**: for the circle nothing changes (its speed is constant), but for the ellipse and the egg the angle drifts, $\tau/\kappa$ is no longer constant, and the curve stops being a generalized helix.`,
      deps: ['dg-2.4'],
      refs: ['do Carmo §1-5'],
      tags: ['generalized helix', 'Lancret'],
      credit: 'Lancret, 1802; Saint-Venant, 1845',
      viz(v) {
        const sel = v.select('cross-section', [{ value: 'circle', label: 'circle' }, { value: 'ellipse', label: 'ellipse' }, { value: 'egg', label: 'egg' }], 'ellipse');
        const mode = v.select('height grows with', [{ value: 'arc', label: 'arc length of the base' }, { value: 'par', label: 'the parameter' }], 'arc');
        const psS = v.slider('angle $\\psi$ with the axis', 12, 80, 35, { step: 0.5 });
        const uS = v.slider('position', 0, 1, 0.3, { step: 0.001 });
        const { S, sc } = scene(v, { title: 'curve over a cylinder; the axis is vertical', yaw: -0.6, pitch: 0.55 });
        const P = plot(v, { x: [0, 1], y: [0, 1], xlabel: 'arc length $s$', ylabel: 'ratio', title: '$\\tau/\\kappa$ and $\\cot\\psi(s)$' });
        v.legend([['blue', '$\\tau/\\kappa$'], ['gold', '$\\cot\\psi(s)$, $\\psi$ = angle of $T$ with the axis', { dash: true }]]);
        const BASE = {
          circle: (t) => [Math.cos(t), Math.sin(t)],
          ellipse: (t) => [1.35 * Math.cos(t), 0.7 * Math.sin(t)],
          egg: (t) => [(1 + 0.4 * Math.cos(t)) * Math.cos(t), (1 + 0.4 * Math.cos(t)) * Math.sin(t)],
        };
        const SP = {
          circle: () => 1,
          ellipse: (t) => Math.hypot(1.35 * Math.sin(t), 0.7 * Math.cos(t)),
          egg: (t) => Math.hypot(-Math.sin(t) - 0.8 * Math.cos(t) * Math.sin(t), Math.cos(t) + 0.4 * (Math.cos(t) ** 2 - Math.sin(t) ** 2)),
        };
        const arc = (sp, t, n = 60) => { const h = t / n; let s = sp(0) + sp(t); for (let i = 1; i < n; i++) s += sp(i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; };
        let info = {}, cache = null;
        v.render(() => {
          const g = BASE[sel.value], sp0 = SP[sel.value], c0 = 1 / Math.tan((psS.value * PI) / 180), total = arc(sp0, TAU, 120);
          const z = mode.value === 'arc' ? (t) => c0 * arc(sp0, t) : (t) => (c0 * total * t) / TAU;
          const curve = mkCurve((t) => { const q = g(t); return [q[0], q[1], z(t)]; }, 0, TAU, { h: 0.02 });
          const tab = tableOf(curve, 360);
          const bb = bbox(tab.p), k = 1.5 / bb.r, tr = (p) => mul(sub(p, bb.c), k);
          const s = uS.value * tab.L, f = atS(tab, s);
          const ratio = [], cot = [];
          let rmin = Infinity, rmax = -Infinity, pmin = 180, pmax = 0;
          for (let i = 0; i <= tab.n; i++) {
            const q = tab.fr[i];
            const psi = Math.acos(clamp(q.T[2], -1, 1)), cp = Math.cos(psi) / Math.sin(psi);
            ratio.push(q.ok ? [tab.s[i], q.tau / q.kappa] : null); cot.push([tab.s[i], cp]);
            if (q.ok) { rmin = Math.min(rmin, q.tau / q.kappa); rmax = Math.max(rmax, q.tau / q.kappa); }
            pmin = Math.min(pmin, (psi * 180) / PI); pmax = Math.max(pmax, (psi * 180) / PI);
          }
          const lo = Math.min(rmin, ...cot.map((q) => q[1])), hi = Math.max(rmax, ...cot.map((q) => q[1]));
          P.setView([0, tab.L], [Math.min(0, lo) - 0.15 * (hi - lo || 1), hi + 0.25 * (hi - lo || 1)]);
          sc.begin();
          const base = tab.p.map((p) => [(p[0] - bb.c[0]) * k, (p[1] - bb.c[1]) * k, (bb.lo[2] - bb.c[2]) * k]);
          drawTrack(sc, base, { color: 'faint', width: 1.2, alpha: 0.8 });
          for (let i = 0; i < tab.n; i += 20) sc.line(base[i], tr(tab.p[i]), { color: 'faint', width: 0.8, alpha: 0.5 }, 1);
          drawTrack(sc, tab.p.map(tr), { color: 'ink', width: 3 });
          const p = tr(f.p);
          sc.arrow(p, add(p, mul(f.T, 0.9)), { color: 'blue', width: 3 });
          sc.arrow(p, add(p, [0, 0, 0.9]), { color: 'green', width: 2.4 });
          sc.dot(p, { color: 'gold', r: 6 });
          sc.flush();
          P.hline(0, { color: 'faint' });
          P.path(cot, { color: 'gold', width: 2.2, dash: [6, 4] });
          P.path(ratio, { color: 'blue', width: 2.8 });
          P.vline(s, { color: 'gold', alpha: 0.6 });
          info = { rmin, rmax, pmin, pmax, psi: (Math.acos(clamp(f.T[2], -1, 1)) * 180) / PI };
        });
        v.readout(() => String.raw`angle between $T$ and the axis: from $${v.fix(info.pmin, 2)}^\circ$ to $${v.fix(info.pmax, 2)}^\circ$ · $\tau/\kappa$ ranges over $[${v.fix(info.rmin, 4)},\,${v.fix(info.rmax, 4)}]$ ${info.rmax - info.rmin < 2e-3 ? '— constant: a generalized helix, with $\\cot\\psi = ' + v.fix(info.rmin, 4) + '$' : '— not constant: not a generalized helix'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Proposition',
      name: 'Curves on a sphere',
      statement: String.raw`Let $\alpha$ be a unit-speed $C^3$ curve with $\kappa > 0$ lying on the sphere of radius $R$ centred at the origin. Write $\rho = 1/\kappa$ and $\sigma = 1/\tau$. Then
(a) $\kappa \ge 1/R$ everywhere, with equality along great circles;
(b) wherever $\tau \neq 0$,
$$\rho^2 + (\sigma\rho')^2 = R^2, \quad\text{i.e.}\quad \Big(\frac1\kappa\Big)^{2} + \Big(\frac{(1/\kappa)'}{\tau}\Big)^{2} = R^2.$$
Conversely, a curve with $\tau \neq 0$ and $\kappa' \neq 0$ that satisfies (b) with a constant $R$ lies on a sphere of radius $R$. In particular a spherical curve is determined, up to rigid motion and choice of $R$, by $\kappa$ alone.`,
      idea: String.raw`Differentiate $\alpha\cdot\alpha = R^2$ repeatedly, using the Frenet–Serret equations (dg-2.4). First $\alpha\cdot T = 0$; then $1 + \kappa\,\alpha\cdot N = 0$, so $\alpha\cdot N = -\rho$; then $\alpha\cdot N' = -\rho'$ gives $\tau\,\alpha\cdot B = -\rho'$. Expanding $\alpha$ in the frame, $\alpha = -\rho N - \sigma\rho' B$, so $R^2 = \rho^2 + (\sigma\rho')^2$. Part (a) is the first step: $\rho = |\alpha\cdot N| \le |\alpha| = R$. For the converse, the point $\alpha + \rho N + \sigma\rho' B$ has derivative zero precisely when the derivative of (b) holds, so it is a fixed centre at distance $R$ from the curve.`,
      caption: String.raw`Drag the five orange points over the sphere: the black curve is a smooth closed curve through them, pushed radially onto the sphere. The left plot shows $\kappa(s)$ staying above $1/R$; the right plot shows $\rho^2 + (\rho'/\tau)^2$ (omitted where $\tau \approx 0$) lying on the level $R^2$. Now raise **leave the sphere** to make the radius wobble: the curve drops below $1/R$ in places and the identity fails.`,
      deps: ['dg-2.4'],
      refs: ['do Carmo §1-5'],
      tags: ['spherical curves', 'curvature', 'torsion'],
      viz(v) {
        const RS = v.slider('radius $R$', 0.7, 1.5, 1.1, { step: 0.01 });
        const wS = v.slider('leave the sphere: amplitude $w$', 0, 0.3, 0, { step: 0.002 });
        const { S, sc } = scene(v, { title: 'a closed curve on a sphere', yaw: -0.7, pitch: 0.4, height: 380, weight: 1.2 });
        const P1 = plot(v, { y: [0, 3], xlabel: 'arc length $s$', ylabel: '$\\kappa$', title: 'curvature against $1/R$', height: 380, weight: 0.7, minWidth: 200 });
        const P2 = plot(v, { y: [0, 3], xlabel: 'arc length $s$', ylabel: '$\\rho^2+(\\rho^{\\prime}/\\tau)^2$', title: 'the identity (b)', height: 380, weight: 0.7, minWidth: 200 });
        const ll = [[0.75, 0.1], [-0.6, 1.4], [0.8, 2.7], [-0.75, 3.9], [0.25, 5.2]];
        const sph = (la, lo) => [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
        const hs = ll.map(([la, lo], i) => sc.handle(mul(sph(la, lo), 1.1), { color: 'orange', r: 7, snap: (p) => mul(unit(p) || [1, 0, 0], RS.value) }));
        let info = {};
        v.render(() => {
          const R = RS.value, w = wS.value;
          for (const h of hs) h.p = mul(unit(h.p) || [1, 0, 0], R);
          const f0 = trigInterp(hs.map((h) => h.p));
          const c = mkCurve((t) => mul(unit(f0(t)), R * (1 + w * Math.cos(3 * t))), 0, TAU, { closed: true });
          const tab = tableOf(c, 400);
          // identity (b)
          const lhs = [], kap = [];
          let worst = 0, kmin = Infinity;
          for (let i = 0; i <= tab.n; i++) {
            const q = tab.fr[i]; kap.push([tab.s[i], q.kappa]); kmin = Math.min(kmin, q.kappa);
            if (q.ok && Math.abs(q.tau) > 0.05) {
              const rp = dds(c, q.t, (g) => [1 / g.kappa])[0], val = 1 / (q.kappa * q.kappa) + (rp / q.tau) ** 2;
              lhs.push([tab.s[i], val]); worst = Math.max(worst, Math.abs(val - R * R) / (R * R));
            } else lhs.push(null);
          }
          sc.begin();
          sphereWire(sc, R);
          drawTrack(sc, tab.p, { color: 'ink', width: 3.2 });
          for (const h of hs) sc.dot(h.p, { color: 'orange', r: 4, top: false });
          sc.flush();
          const kmax = Math.max(...kap.map((q) => q[1]));
          P1.setView([0, tab.L], [0, Math.min(kmax * 1.1, 6)]);
          P1.fn(() => 1 / R, { color: 'green', width: 2, dash: true });
          P1.path(kap, { color: 'ink', width: 2.4 });
          P2.setView([0, tab.L], [0, 2 * R * R]);
          P2.hline(R * R, { color: 'green', width: 2, dash: true });
          P2.path(lhs, { color: 'ink', width: 2.4 });
          info = { R, kmin, worst, w };
        });
        v.readout(() => String.raw`$R=${v.fix(info.R, 2)}$: smallest curvature $${v.fix(info.kmin, 4)}$ versus $1/R=${v.fix(1 / info.R, 4)}$ ${info.kmin >= 1 / info.R - 1e-6 ? '(✓ $\\kappa\\ge1/R$)' : '(✗ below $1/R$: the curve is not on the sphere)'} · largest relative deviation of $\rho^2+(\sigma\rho')^2$ from $R^2$: $${v.sci(info.worst + 1e-17, 2)}$`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Proposition',
      name: 'The Frenet frame jumps at a flat point',
      statement: String.raw`The Frenet frame of a smooth curve need not extend continuously across a point where $\kappa = 0$, even when the curve is $C^\infty$ and the frame exists on both sides.
**Example.** The curve $\alpha(t) = (t,\; e^{-1/t^2},\; 0)$ for $t > 0$, $\alpha(t) = (t,\; 0,\; e^{-1/t^2})$ for $t < 0$, $\alpha(0) = 0$, is $C^\infty$ and regular, with $\kappa(0) = 0$ and $\kappa > 0$ for $0 < |t| < \sqrt{2/3}$. As $t \to 0^+$ the normal tends to $(0,1,0)$ and the binormal to $(0,0,1)$; as $t \to 0^-$ the normal tends to $(0,0,1)$ and the binormal to $(0,-1,0)$. Torsion is $0$ for $t \neq 0$, yet the curve is **not** planar.
(Even in the plane, a curve like $(t, t^3)$ with an inflection has $N$ jump to $-N$ at $t = 0$.)`,
      idea: String.raw`Every derivative of $f(t) = e^{-1/t^2}$ vanishes at $0$, so each branch is a $C^\infty$ curve and the two glue smoothly, with $\alpha''(0) = 0$ and hence $\kappa(0) = 0$. For $t > 0$ the curve lies in the plane $z = 0$ and bends toward $+y$ (as $f'' > 0$ there), for $t < 0$ it lies in the plane $y = 0$ and bends toward $+z$; the osculating plane is the plane of the branch, so it jumps by a right angle at $0$. By dg-2.6 each branch has $\tau = 0$, but the two planes differ, so the whole curve is not planar: this is why dg-2.6 and dg-2.7 assume $\kappa > 0$.`,
      caption: String.raw`Slide the point through the origin. The blue branch ($t>0$) lies in the horizontal plane and the red one ($t<0$) in the vertical plane, yet the curve is perfectly smooth. The two orange dashed arrows at the origin are the limits of $\mathbf N$ from the right and from the left; the plot shows the components of $N(t)$, which jump from one coordinate to another (the frame cannot even be computed for $|t| \lesssim 0.04$ because $\kappa$ underflows double precision). Switch to the **inflection** example to see $N$ and $B$ flip sign for the plane curve $(t,t^3)$.`,
      deps: ['dg-2.2'],
      refs: ['do Carmo §1-5'],
      tags: ['Frenet frame', 'flat point', 'counterexample'],
      viz(v) {
        const ex = v.select('example', [{ value: 'bend', label: 'smooth but non-planar: $e^{-1/t^2}$' }, { value: 'infl', label: 'inflection $(t,t^3)$' }], 'bend');
        const tS = v.slider('position $t$', -0.7, 0.7, 0.35, { step: 0.001 });
        const f = (t) => (t === 0 ? 0 : Math.exp(-1 / (t * t)));
        const f1 = (t) => (t === 0 ? 0 : 2 * t ** -3 * f(t)), f2 = (t) => (t === 0 ? 0 : (4 * t ** -6 - 6 * t ** -4) * f(t)), f3 = (t) => (t === 0 ? 0 : (24 * t ** -5 - 36 * t ** -7 + 8 * t ** -9) * f(t));
        const bend = mkCurve((t) => (t >= 0 ? [t, f(t), 0] : [t, 0, f(t)]), -0.9, 0.9, {
          tol: 0,
          d: (t) => (t >= 0 ? [[1, f1(t), 0], [0, f2(t), 0], [0, f3(t), 0]] : [[1, 0, f1(t)], [0, 0, f2(t)], [0, 0, f3(t)]]),
        });
        const infl = mkCurve((t) => [t, t * t * t, 0], -0.9, 0.9, { tol: 0, d: (t) => [[1, 3 * t * t, 0], [0, 6 * t, 0], [0, 6, 0]] });
        const { S, sc } = scene(v, { title: 'a smooth curve whose osculating plane jumps', yaw: -0.95, pitch: 0.5 });
        const P = plot(v, { x: [-0.9, 0.9], y: [-1.15, 1.15], xlabel: '$t$', ylabel: 'components', title: 'components of $N(t)$' });
        v.legend([['red', '$N_x$'], ['blue', '$N_y$'], ['green', '$N_z$']]);
        let info = {};
        v.render(() => {
          const c = ex.value === 'bend' ? bend : infl, t = tS.value, q = c.at(t);
          const pts = (a, b) => Array.from({ length: 61 }, (_, i) => c.r(a + ((b - a) * i) / 60));
          const sh = [0.0, -0.1, -0.1];
          sc.begin();
          const lift = (p) => mul(add(p, [0, -0.3, -0.3]), 2.0);
          drawTrack(sc, pts(0, 0.9).map(lift), { color: 'blue', width: 3.2 });
          drawTrack(sc, pts(-0.9, 0).map(lift), { color: 'red', width: 3.2 });
          if (ex.value === 'bend') {
            sc.arrow(lift([0, 0, 0]), add(lift([0, 0, 0]), [0, 0.8, 0]), { color: 'orange', width: 2.4, dash: true, alpha: 0.8 });
            sc.arrow(lift([0, 0, 0]), add(lift([0, 0, 0]), [0, 0, 0.8]), { color: 'orange', width: 2.4, dash: true, alpha: 0.8 });
          }
          const p = lift(q.p);
          if (q.ok) drawFrame(sc, p, q, 0.7);
          sc.dot(p, { color: 'gold', r: 6 });
          sc.flush();
          const comps = [[], [], []];
          const gap = ex.value === 'bend' ? 0.037 : 0.004;
          for (let i = 0; i <= 400; i++) {
            const ti = -0.9 + (1.8 * i) / 400, fr = c.at(ti);
            const okc = fr.ok && Math.abs(ti) > gap && (ex.value === 'infl' || Math.abs(ti) < 0.8);
            for (let k = 0; k < 3; k++) comps[k].push(okc ? [ti, fr.N[k]] : null);
          }
          P.vline(0, { color: 'faint' });
          P.path(comps[0], { color: 'red', width: 2.2 }); P.path(comps[1], { color: 'blue', width: 2.2 }); P.path(comps[2], { color: 'green', width: 2.2 });
          P.vline(t, { color: 'gold', alpha: 0.7 });
          info = { t, q, ex: ex.value };
        });
        v.readout(() => {
          const q = info.q;
          if (!q.ok) return String.raw`$t=${v.fix(info.t, 3)}$: $\kappa$ is $0$ (to machine precision) — $N$ and $B$ do not exist here`;
          const bv = info.ex === 'bend' ? (info.t > 0 ? 'the curve lies in the horizontal plane' : 'the curve lies in the vertical plane') : '';
          return String.raw`$t=${v.fix(info.t, 3)}$: $\kappa=${v.sci(q.kappa, 2)}$, $\tau=${v.fix(q.tau, 4)}$, $N=(${v.fix(q.N[0], 3)},\,${v.fix(q.N[1], 3)},\,${v.fix(q.N[2], 3)})$, $B=(${v.fix(q.B[0], 3)},\,${v.fix(q.B[1], 3)},\,${v.fix(q.B[2], 3)})$ ${bv ? '— ' + bv : ''}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Definition',
      name: 'Tangent indicatrix and total curvature',
      statement: String.raw`The **tangent indicatrix** of a regular curve $\alpha$ is the curve $t \mapsto T(t) = \alpha'(t)/|\alpha'(t)|$ on the unit sphere $S^2$. For a unit-speed curve its speed is $|T'| = \kappa$, so its length is the **total curvature**
$$\int_\alpha \kappa\, ds .$$
For a closed curve the indicatrix is a closed curve on the sphere. A plane curve has an indicatrix that runs along a single great circle; a circle traversed once has total curvature exactly $2\pi$.`,
      idea: String.raw`Reparametrize by arc length (dg-1.3) so that the indicatrix is $s\mapsto T(s)$. Its velocity is $T' = \kappa N$ (dg-2.4), whose length is $\kappa$; the length of any curve is the integral of its speed (dg-1.2), which gives the total curvature. Total curvature is therefore a purely geometric quantity: it measures how much the direction of travel turns, summed over the curve, and it is invariant under rigid motions and reparametrization.`,
      caption: String.raw`Drag the seven orange control points: the left panel shows the closed curve through them (coloured by position along it) and the right panel the unit sphere with its tangent indicatrix in matching colours; the sliders and point share the same parameter. The readout computes the total curvature twice: as the length of the indicatrix (sum of angles between neighbouring tangents) and as the integral of $\kappa\,ds$. Use the presets: a planar curve has an indicatrix on a great circle (total curvature $2\pi$ for the circle), a knotted one swings across the sphere.`,
      deps: ['dg-2.1'],
      refs: ['do Carmo Ch. 5'],
      tags: ['tangent indicatrix', 'total curvature'],
      viz(v) {
        const N = 7;
        const tref = (j) => (TAU * j) / N;
        const presets = {
          trefoil: Array.from({ length: N }, (_, j) => CURVES.trefoil.r(tref(j))),
          circle: Array.from({ length: N }, (_, j) => [1.3 * Math.cos(tref(j)), 1.3 * Math.sin(tref(j)), 0]),
          wavy: Array.from({ length: N }, (_, j) => [1.3 * Math.cos(tref(j)), 1.3 * Math.sin(tref(j)), 0.5 * Math.sin(3 * tref(j))]),
          ellipse: Array.from({ length: N }, (_, j) => [1.5 * Math.cos(tref(j)), 0.7 * Math.sin(tref(j)), 0.35 * Math.sin(tref(j)) + 0.0]),
        };
        const A = scene(v, { title: 'closed space curve (drag the orange points)', weight: 1.1, height: 380, minWidth: 280 });
        const Bs = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'its tangent indicatrix on the unit sphere' });
        const scA = A.sc, scB = v.scene3(Bs, { yaw: -0.7, pitch: 0.5, axes: false, hint: false, lim: 1.2 });
        const hs = presets.trefoil.map((p) => scA.handle(p, { color: 'orange', r: 7, lim: 1.8 }));
        const sel = v.select('preset', [{ value: 'trefoil', label: 'trefoil knot' }, { value: 'circle', label: 'circle' }, { value: 'wavy', label: 'wavy circle' }, { value: 'ellipse', label: 'tilted ellipse' }], 'trefoil', {
          onChange: (val) => { presets[val].forEach((p, i) => hs[i].set(p)); },
        });
        const uS = v.slider('position along the curve', 0, 1, 0.1, { step: 0.001 });
        let info = {}, last = [scA.yaw, scA.pitch];
        const hue = (u) => v.mix('blue', 'red', 1 - Math.abs(2 * (u % 1) - 1));
        v.render(() => {
          // keep the two views in step
          if (scA.yaw !== last[0] || scA.pitch !== last[1]) { scB.yaw = scA.yaw; scB.pitch = scA.pitch; }
          else if (scB.yaw !== last[0] || scB.pitch !== last[1]) { scA.yaw = scB.yaw; scA.pitch = scB.pitch; }
          last = [scA.yaw, scA.pitch];
          const f0 = trigInterp(hs.map((h) => h.p));
          const m = 360, pts = [], Ts = [], kap = [];
          let kint = 0, tlen = 0;
          const colors = [], tcolors = [];
          for (let i = 0; i <= m; i++) {
            const t = (TAU * i) / m, [d1, d2] = derivs(f0, t, 0.02), sp = len(d1), cr = len(cross(d1, d2));
            pts.push(f0(t)); Ts.push(mul(d1, 1 / sp));
            if (i < m) kint += (cr / (sp * sp * sp)) * sp * (TAU / m);
            colors.push(hue(i / m));
          }
          for (let i = 0; i < m; i++) tlen += Math.acos(clamp(dot(Ts[i], Ts[i + 1]), -1, 1));
          const bb = bbox(pts), u = uS.value, iu = Math.round(u * m) % m;
          scA.begin();
          drawTrack(scA, pts, { width: 3.2 }, colors.slice(0, m));
          for (let i = 0; i < hs.length; i++) scA.line(hs[i].p, hs[(i + 1) % hs.length].p, { color: 'faint', width: 0.8, alpha: 0.5 }, 1);
          scA.arrow(pts[iu], add(pts[iu], mul(Ts[iu], 0.6)), { color: 'gold', width: 3 });
          scA.dot(pts[iu], { color: 'gold', r: 6 });
          scA.flush();
          scB.begin();
          sphereWire(scB, 1);
          drawTrack(scB, Ts, { width: 3.2 }, colors.slice(0, m));
          scB.arrow([0, 0, 0], Ts[iu], { color: 'gold', width: 2.4, head: 9 });
          scB.dot(Ts[iu], { color: 'gold', r: 6 });
          scB.flush();
          info = { kint, tlen };
        });
        v.readout(() => String.raw`length of the indicatrix (sum of angles between neighbouring tangents): $${v.fix(info.tlen, 4)}$ $= ${v.fix(info.tlen / TAU, 4)}\cdot 2\pi$ · $\int\kappa\,ds$ by quadrature: $${v.fix(info.kint, 4)}$ · they agree to $${v.sci(Math.abs(info.kint - info.tlen) + 1e-17, 1)}$`);
      },
    },
  ],
};
