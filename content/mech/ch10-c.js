// Classical Mechanics — Chapter 10: Rigid bodies (part c: 10.15–10.21)

import {
  TAU, DEG, clamp, memo, rk4, rk4rec, idxAt, span, sci, num, series,
  add, sub, scl, madd, dot, crs, nrm, unit, angle, perp, I3, mm, mv, mT, fro, rotAxis, Rx, Rz, axisAngle,
  qmul, qconj, qmat, qnormalize, qaxis, topRHS, topPost, topEnergy,
  drawBox, circlePts, tube, AXC, eyeDir, spherePath, sphereFrame,
} from './ch10.shared.js';

/** z-x-z Euler angles (radians) → rotation matrix R = R_z(φ) R_x(θ) R_z(ψ). */
const euler = (ph, th, ps) => mm(Rz(ph), mm(Rx(th), Rz(ps)));
/** A heavy symmetric top drawn on a scene3: tip at the origin, axis n, spin marker vector u, display length l. */
function drawTop(sc, n, u, l, r, st = {}) {
  const c = scl(n, l), a = unit(madd(u, n, -dot(u, n))), b = crs(n, a), col = st.color || 'accent';
  sc.disc(a, b, r, { fill: col, fillAlpha: 0.2, color: col, width: 1.4 }, c);
  for (let k = 0; k < 12; k++) { const t = (TAU * k) / 12; sc.line([0, 0, 0], add(c, add(scl(a, r * Math.cos(t)), scl(b, r * Math.sin(t)))), { color: col, width: 0.8, alpha: k % 3 ? 0.35 : 0.8 }); }
  sc.line(c, scl(n, l + 0.18), { color: 'ink', width: 2.6 });
  sc.line(c, add(c, scl(a, r)), { color: 'gold', width: 2.2 });
}

export default {
  collection: 'mech',
  chapter: 10,
  items: [
    // ───────────────────────────────────────────────────────────── 10.15
    {
      num: '10.15',
      kind: 'Definition',
      name: 'Euler angles',
      statement: String.raw`Every orientation $\mathsf R \in SO(3)$ of a rigid body can be written as a product of three rotations about coordinate axes,
$$\mathsf R = \mathsf R_z(\varphi)\,\mathsf R_x(\theta)\,\mathsf R_z(\psi), \qquad 0 \le \varphi, \psi < 2\pi,\ \ 0 \le \theta \le \pi$$
(the $z$-$x$-$z$ convention). Read from the body’s point of view: turn about the vertical $z$ by $\varphi$, which carries the $x$-axis to the **line of nodes** $\mathbf N$; tilt about $\mathbf N$ by $\theta$, which carries $z$ to the body’s symmetry axis $\mathbf e_3$; spin about $\mathbf e_3$ by $\psi$. The angular velocity is $\boldsymbol\omega = \dot\varphi\,\hat{\mathbf z} + \dot\theta\,\mathbf N + \dot\psi\,\mathbf e_3$, with body components
$$\omega_1 = \dot\varphi\sin\theta\sin\psi + \dot\theta\cos\psi,\quad \omega_2 = \dot\varphi\sin\theta\cos\psi - \dot\theta\sin\psi,\quad \omega_3 = \dot\varphi\cos\theta + \dot\psi .$$
The coordinates are singular at $\theta = 0$ and $\theta = \pi$ (**gimbal lock**). There $\hat{\mathbf z}$ and $\mathbf e_3$ coincide, only $\varphi + \psi$ (or $\varphi - \psi$) is determined, and the three rates span only a plane, because $\det(\mathbf N, \hat{\mathbf z}, \mathbf e_3) = \sin\theta$.`,
      idea: String.raw`By Euler’s theorem (10.1) an orientation is a rotation; to build it, first place the body’s axis $\mathbf e_3 = \mathsf R\hat{\mathbf z}$. Its polar angle from $z$ is $\theta$, and the azimuth of $\mathbf N = \hat{\mathbf z}\times\mathbf e_3$ fixes $\varphi$. What remains is a rotation fixing $\mathbf e_3$, which is a turn by some $\psi$ about it. Differentiating the product and adding the angular velocities of the three turns, as vectors (9.4), gives $\boldsymbol\omega$. When $\mathbf e_3 = \pm\hat{\mathbf z}$ the line of nodes is undefined and the first and last turns are about the same axis. That is a defect of the coordinates, not of the motion: no three angles can cover $SO(3)$ without such a singularity.`,
      caption: String.raw`The body sits in three nested gimbals. The orange outer ring turns about the fixed vertical by $\varphi$, the teal middle ring about the line of nodes $\mathbf N$ by $\theta$, and the pink inner ring about the body axis $\mathbf e_3$ by $\psi$. Tick *show the three steps* to see the intermediate axes. Right: for the current tilt $\theta$, every other pair $(\varphi', \psi')$ shaded by how far its orientation is from the current one. Dark means the same orientation. Normally that happens at a single point. Drag $\theta$ to $0$: the outer and middle rings become coplanar, the dark point stretches into the whole line $\varphi' + \psi' = $ const, and a degree of freedom is lost.`,
      deps: ['mech-10.1', 'mech-9.4'],
      see: ['robot-2.4'],
      refs: ['Taylor §10.9', 'Goldstein §4.4'],
      tags: ['Euler angles', 'gimbal lock', 'rotation'],
      credit: 'Euler, 1765',
      viz(v) {
        const phS = v.slider('$\\varphi$ (°)', -180, 180, 35, { step: 1 });
        const thS = v.slider('$\\theta$ (°)', 0, 180, 50, { step: 0.5 });
        const psS = v.slider('$\\psi$ (°)', -180, 180, 25, { step: 1 });
        const steps = v.toggle('show the three steps', false);
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 360, title: 'gimbals and the body (drag to rotate)' });
        const sc = v.scene3(S, { yaw: 0.3, pitch: 0.3, axes: false, hint: false });
        const sm = v.stage({ x: [-180, 180], y: [-180, 180], equal: true, axes: 'box', height: 360, xticks: [-180, -90, 0, 90, 180], yticks: [-180, -90, 0, 90, 180], title: "$\\|\\mathsf R(\\varphi', \\theta, \\psi') - \\mathsf R\\|$ across $(\\varphi', \\psi')$" });
        let cur = null;
        v.render(() => {
          const ph = phS.value * DEG, th = thS.value * DEG, ps = psS.value * DEG, R = euler(ph, th, ps);
          const z = [0, 0, 1], N = mv(Rz(ph), [1, 0, 0]), e3 = mv(R, [0, 0, 1]), e1 = mv(R, [1, 0, 0]);
          const yN = mv(Rz(ph), [0, 1, 0]), yN2 = mv(mm(Rz(ph), Rx(th)), [0, 1, 0]);
          sc.begin();
          // fixed frame: pivots top and bottom
          sc.line([0, 0, -1.65], [0, 0, -1.5], { color: 'muted', width: 3 }); sc.line([0, 0, 1.5], [0, 0, 1.65], { color: 'muted', width: 3 });
          sc.path(circlePts([0, 0, 0], N, z, 1.5, 72), { color: 'orange', width: 3.2 });
          sc.dot(scl(N, 1.5), { r: 4, color: 'orange' }); sc.dot(scl(N, -1.5), { r: 4, color: 'orange' });
          sc.line(scl(N, 1.28), scl(N, 1.5), { color: 'orange', width: 2.4 }); sc.line(scl(N, -1.28), scl(N, -1.5), { color: 'orange', width: 2.4 });
          sc.path(circlePts([0, 0, 0], N, e3, 1.28, 72), { color: 'teal', width: 3.2 });
          sc.line(scl(e3, 1.06), scl(e3, 1.28), { color: 'teal', width: 2.4 }); sc.line(scl(e3, -1.06), scl(e3, -1.28), { color: 'teal', width: 2.4 });
          sc.path(circlePts([0, 0, 0], e1, e3, 1.06, 72), { color: 'pink', width: 3.2 });
          sc.dot(scl(e3, 1.28), { r: 4, color: 'teal' }); sc.dot(scl(e3, -1.28), { r: 4, color: 'teal' });
          // the body: a flat box with a nose along e1
          drawBox(sc, R, [0.55, 0.3, 0.08], { fillAlpha: 0.32 });
          sc.arrow(scl(e1, 0.55), scl(e1, 0.85), { color: 'ink', width: 2, head: 7 });
          if (steps.value) {
            sc.arrow([0, 0, 0], scl(z, 1.2), { color: 'muted', width: 1.6 }); sc.tex('z', scl(z, 1.75), { color: 'muted', size: 14 });
            sc.arrow([0, 0, 0], [1.1, 0, 0], { color: 'faint', width: 1.4 }); sc.tex('x', [1.22, 0, 0], { color: 'muted', size: 14 });
            sc.arrow([0, 0, 0], scl(N, 1.1), { color: 'orange', width: 2 }); sc.tex('\\mathbf N', scl(N, 1.18), { color: 'orange', size: 14, dy: 10 });
            sc.arrow([0, 0, 0], scl(yN, 0.9), { color: 'orange', width: 1.2, dash: [4, 3] });
            sc.arrow([0, 0, 0], scl(yN2, 0.9), { color: 'teal', width: 1.2, dash: [4, 3] });
            sc.arrow([0, 0, 0], scl(e3, 1.0), { color: 'teal', width: 2 }); sc.tex('\\mathbf e_3', scl(e3, 0.95), { color: 'teal', size: 14, dx: 12 });
            sc.arrow([0, 0, 0], scl(e1, 1.0), { color: 'pink', width: 2 }); sc.tex('\\mathbf e_1', scl(e1, 1.0), { color: 'pink', size: 14, dx: 12, dy: 8 });
            const arc = (ax, from, ang, r, col) => { if (Math.abs(ang) < 0.02) return; const b = crs(ax, from); sc.path(circlePts([0, 0, 0], from, b, r, 30, 0, ang), { color: col, width: 2 }); };
            arc(z, [1, 0, 0], ph, 0.45, 'orange'); arc(N, z, th, 0.5, 'teal'); arc(e3, N, ps, 0.4, 'pink');
          }
          sc.flush();
          // the (φ', ψ') map at fixed θ
          const key = [phS.value, thS.value, psS.value].join(',');
          sm.heat((a, b) => fro(euler(a * DEG, th, b * DEG), R), { range: [0, 2 * Math.SQRT2], cmap: 'magma', key, res: 3 });
          sm.axes();
          if (Math.abs(Math.sin(th)) < 0.03) {
            const sgn = Math.cos(th) > 0 ? 1 : -1, cst = phS.value + sgn * psS.value;
            for (let k = -3; k <= 3; k++) { const c0 = cst + 360 * k; sm.line(c0 - sgn * -200, -200, c0 - sgn * 200, 200, { color: 'green', width: 2, dash: [6, 4] }); }
          }
          sm.dot(phS.value, psS.value, { r: 6, color: 'green' });
          sm.text("φ' across, ψ' up", -172, 172, { color: 'ink', size: 11, plate: true, baseline: 'top' });
          cur = { th, z, N, e3 };
        });
        v.legend([['orange', 'outer ring: $\\varphi$ about $z$'], ['teal', 'middle ring: $\\theta$ about $\\mathbf N$'], ['pink', 'inner ring: $\\psi$ about $\\mathbf e_3$'], ['green', 'orientations equal to the current one']]);
        v.readout(() => {
          if (!cur) return '';
          const { th, z, N, e3 } = cur, d = dot(crs(N, z), e3);
          const base = String.raw`$\det(\mathbf N, \hat{\mathbf z}, \mathbf e_3) = ${v.fix(d, 4)}$, and $\sin\theta = ${v.fix(Math.sin(th), 4)}$ · the three rates $\dot\varphi, \dot\theta, \dot\psi$ produce angular velocities along $\hat{\mathbf z}, \mathbf N, \mathbf e_3$`;
          if (Math.abs(Math.sin(th)) < 0.03) return base + String.raw` — **gimbal lock**: $\hat{\mathbf z}$ and $\mathbf e_3$ (nearly) coincide, so these span only a plane, and every $(\varphi', \psi')$ with $\varphi' ${Math.cos(th) > 0 ? '+' : '-'} \psi' = ${v.fix(phS.value + (Math.cos(th) > 0 ? 1 : -1) * psS.value, 0)}°$ gives the same orientation`;
          return base + ', which span all of space: near this orientation the three angles are good coordinates';
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.16
    {
      num: '10.16',
      kind: 'Model',
      name: 'Heavy symmetric top: precession and nutation',
      statement: String.raw`A symmetric top ($I_1 = I_2$ about the fixed tip) of mass $M$, with its centre of mass at distance $l$ along the axis, spins in uniform gravity. In Euler angles (10.15) its Lagrangian $\tfrac12I_1(\dot\theta^2 + \dot\varphi^2\sin^2\theta) + \tfrac12I_3(\dot\psi + \dot\varphi\cos\theta)^2 - Mgl\cos\theta$ has two cyclic coordinates, $\varphi$ and $\psi$. The conserved momenta are $L_3 = I_3\omega_3$ (spin) and $L_z = I_1\dot\varphi\sin^2\theta + L_3\cos\theta$ (vertical angular momentum), and the energy is conserved too. The tilt then moves in one dimension,
$$E' = \tfrac12I_1\dot\theta^2 + U_{\rm eff}(\theta), \qquad U_{\rm eff}(\theta) = \frac{(L_z - L_3\cos\theta)^2}{2I_1\sin^2\theta} + Mgl\cos\theta ,$$
with $E' = E - L_3^2/2I_3$. So $\theta$ **nutates** periodically between the two roots $\theta_1 \le \theta \le \theta_2$ of $U_{\rm eff} = E'$, while the axis **precesses** at the rate $\dot\varphi = (L_z - L_3\cos\theta)/(I_1\sin^2\theta)$. If $\dot\varphi$ keeps one sign, the tip of the axis traces waves on a sphere; if it changes sign inside the band, loops; if it vanishes at a turning point, cusps. That last case happens when the top is released with $\dot\theta = \dot\varphi = 0$. Steady precession is the special case $\theta_1 = \theta_2$.`,
      idea: String.raw`The potential depends only on $\theta$, and the kinetic energy depends on neither $\varphi$ nor $\psi$. Their momenta are therefore constants (eliminating cyclic coordinates, 7.12), and solving for $\dot\varphi$ and $\dot\psi$ reduces the problem to one degree of freedom in $\theta$ with an effective potential. The term $(L_z - L_3\cos\theta)^2/\sin^2\theta$ blows up at $\theta = 0$ and $\pi$ (unless $L_z = \pm L_3$), so the motion is confined to a band. The sign of $\dot\varphi$ at the edges of the band decides the shape of the trace. The principal axes (10.8) give $T$ its simple form, and the nutation period is $2\int_{\theta_1}^{\theta_2} d\theta/\dot\theta$.`,
      caption: String.raw`The tip of the top’s axis (extended) leaves a gold trace on a sphere; the green circles bound the nutation band. Choose an initial precession rate (in units of the steady rate) with the presets or the slider: negative gives loops, zero gives cusps, between zero and one gives waves, and one gives steady precession with no nutation. Right: the effective potential $U_{\rm eff}(\theta)$ with the energy line $E'$; the band is where the line lies above the curve, and the dot follows the current tilt. The readout checks that $L_3$, $L_z$ and $E$ stay constant, and compares the measured band and nutation period with the roots and the quadrature.`,
      deps: ['mech-10.15', 'mech-7.12', 'mech-10.8'],
      refs: ['Taylor §10.10', 'Goldstein §5.7'],
      tags: ['heavy top', 'nutation', 'effective potential'],
      credit: 'Lagrange, 1788',
      viz(v) {
        const g = 9.81, M = 1, l = 0.35, rd = 0.25, I3v = 0.5 * M * rd * rd, I1v = 0.25 * M * rd * rd + M * l * l, mgl = M * g * l, TH0 = 50 * DEG, TS = 8, DSP = 2.6;
        const wS = v.slider('spin $\\omega_3$ (rad/s)', 30, 160, 55, { step: 0.5 });
        const kS = v.slider('initial $\\dot\\varphi$ / steady rate', -1.5, 2.5, 0, { step: 0.01 });
        v.select('preset', [{ value: 'loops', label: 'loops' }, { value: 'cusps', label: 'cusps' }, { value: 'waves', label: 'waves' }, { value: 'steady', label: 'steady' }], 'cusps', { onChange: (p) => kS.set({ loops: -0.8, cusps: 0, waves: 0.45, steady: 1 }[p]) });
        const S = v.stage({ x: [-1.38, 1.38], y: [-1.3, 1.42], equal: true, axes: false, height: 350, title: 'the trace of the axis on a sphere (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.42, axes: false, hint: false });
        const sU = v.stage({ x: [20, 90], y: [0, 1], axes: 'box', height: 350, xlabel: 'θ (°)', title: '$U_{\\rm eff}(\\theta)$ and the energy $E\'$ (J)' });
        const steadyRate = (w3) => { const a = I1v * Math.cos(TH0), b = I3v * w3; return (b - Math.sqrt(b * b - 4 * a * mgl)) / (2 * a); };
        const cache = memo(); let cur = null;
        const run = () => cache(wS.value + '|' + kS.value, () => {
          const w3 = wS.value, Wst = steadyRate(w3), ph0 = kS.value * Wst;
          const n0 = [Math.sin(TH0), 0, Math.cos(TH0)], u0 = unit(crs([0, 1, 0], n0));
          const L0 = madd(scl(n0, I3v * w3), madd([0, 0, 1], n0, -Math.cos(TH0)), I1v * ph0);
          const dt = 0.0005, R = rk4rec(topRHS(I1v, I3v, mgl), [...n0, ...u0, ...L0], TS, Math.round(TS / dt), 8, topPost);
          const L3 = I3v * w3, Lz = L0[2], E = topEnergy(I1v, I3v, mgl, R.y[0]), Ep = E - (L3 * L3) / (2 * I3v);
          const U = (th) => (Lz - L3 * Math.cos(th)) ** 2 / (2 * I1v * Math.sin(th) ** 2) + mgl * Math.cos(th);
          // turning points: bracket the minimum of U and bisect on each side
          let thm = TH0, um = Infinity; for (let th = 2 * DEG; th < 178 * DEG; th += 0.05 * DEG) { const q = U(th); if (q < um) { um = q; thm = th; } }
          const root = (a, b) => { let fa = U(a) - Ep; for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = U(m) - Ep; if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
          const flat = Ep - um < 1e-12 * Math.abs(Ep) + 1e-14;
          const th1 = flat ? thm : root(1e-4, thm), th2 = flat ? thm : root(thm, Math.PI - 1e-4);
          // nutation period by quadrature (θ = m − h cos χ)
          let Tq = NaN;
          if (!flat) { const mm2 = (th1 + th2) / 2, hh = (th2 - th1) / 2, n = 600; let s2 = 0; for (let k = 0; k < n; k++) { const ch = (Math.PI * (k + 0.5)) / n, th = mm2 - hh * Math.cos(ch), den = Math.sqrt(Math.max(1e-30, (2 * (Ep - U(th))) / I1v)); s2 += (hh * Math.sin(ch)) / den; } Tq = (2 * s2 * Math.PI) / n; }
          const ths = R.y.map((y) => Math.acos(clamp(y[2], -1, 1)));
          let lo = Infinity, hi = -Infinity; for (const t of ths) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
          const mid = (lo + hi) / 2, cr = []; for (let i = 1; i < ths.length; i++) if (ths[i - 1] < mid && ths[i] >= mid) cr.push(R.t[i - 1] + (R.dt * (mid - ths[i - 1])) / (ths[i] - ths[i - 1]));
          const Tm = cr.length >= 2 ? (cr[cr.length - 1] - cr[0]) / (cr.length - 1) : NaN;
          let dev = { L3: 0, Lz: 0, E: 0 }, phi = 0, prev = 0;
          for (let i = 0; i < R.y.length; i++) { const y = R.y[i], n = [y[0], y[1], y[2]], L = [y[6], y[7], y[8]]; dev.L3 = Math.max(dev.L3, Math.abs(dot(L, n) - L3)); dev.Lz = Math.max(dev.Lz, Math.abs(L[2] - Lz)); dev.E = Math.max(dev.E, Math.abs(topEnergy(I1v, I3v, mgl, y) - E)); const a = Math.atan2(n[1], n[0]); if (i) { let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; phi += d; } prev = a; }
          return { R, ths, L3, Lz, E, Ep, U, th1, th2, lo, hi, Tq, Tm, dev, rate: phi / TS, Wst, flat, um };
        });
        v.animate((t) => {
          const B = run(), R = B.R, i = idxAt(R, t % TS), y = R.y[i], n = [y[0], y[1], y[2]], u = [y[3], y[4], y[5]], RS = 1.25;
          sc.begin();
          sphereFrame(sc, RS, { lat: false });
          for (const th of [B.th1, B.th2]) spherePath(sc, circlePts([0, 0, RS * Math.cos(th)], [1, 0, 0], [0, 1, 0], RS * Math.sin(th), 72), { color: 'green', width: 1.4, alpha: 0.8, backAlpha: 0.25, dash: [5, 4] });
          spherePath(sc, R.y.slice(0, i + 1).map((q) => [q[0] * RS, q[1] * RS, q[2] * RS]), { color: 'gold', width: 2, backAlpha: 0.3 });
          sc.line([0, 0, 0], [0, 0, RS], { color: 'faint', width: 1, dash: [3, 4] });
          drawTop(sc, n, u, l * DSP, rd * DSP * 0.9);
          sc.line([0, 0, 0], scl(n, RS), { color: 'ink', width: 1, alpha: 0.5 });
          sc.dot(scl(n, RS), { r: 4.5, color: 'gold' }); sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          sc.flush();
          // effective potential
          const th = B.ths[i], span2 = Math.max(B.Ep - B.um, 0.02), ylo = B.um - 0.4 * span2, yhi = B.Ep + 1.6 * span2;
          const x0 = Math.max(5, (Math.min(B.th1, B.lo) / DEG) - 18), x1 = Math.min(175, (Math.max(B.th2, B.hi) / DEG) + 18);
          sU.setView([x0, x1], [ylo, yhi]);
          if (!B.flat) sU.vband(B.th1 / DEG, B.th2 / DEG, { color: 'green', alpha: 0.12 });
          sU.fn((d) => B.U(d * DEG), { color: 'accent', width: 2.4 });
          sU.hline(B.Ep, { color: 'orange', width: 1.8, dash: [6, 4] });
          sU.text("E'", x1, B.Ep, { color: 'orange', align: 'right', dy: -9, math: true, size: 15 });
          sU.dot(th / DEG, B.U(th), { r: 5.5, color: 'gold' });
          sU.line(th / DEG, B.U(th), th / DEG, B.Ep, { color: 'gold', width: 1.2 });
          cur = { B };
        }, { period: TS, still: 5.4 });
        v.legend([['gold', 'trace of the axis'], ['green', 'nutation band $\\theta_1 \\le \\theta \\le \\theta_2$', { dash: true }], ['accent', '$U_{\\rm eff}$'], ['orange', "$E'$", { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur.B, d = (x) => v.fix(x / DEG, 2);
          const band = B.flat ? String.raw`steady precession: $\theta$ stays at ${d(B.lo)}°–${d(B.hi)}°` : String.raw`band: roots of $U_{\rm eff} = E'$ at $\theta_1 = ${d(B.th1)}°$, $\theta_2 = ${d(B.th2)}°$; measured ${d(B.lo)}° to ${d(B.hi)}° · nutation period: quadrature ${v.fix(B.Tq, 4)} s, measured ${isFinite(B.Tm) ? v.fix(B.Tm, 4) : '—'} s`;
          return String.raw`conserved: $L_3 = ${v.fix(B.L3, 4)}$, $L_z = ${v.fix(B.Lz, 4)}$ kg·m²/s, $E = ${v.fix(B.E, 4)}$ J; largest drifts $${sci(v, B.dev.L3)}$, $${sci(v, B.dev.Lz)}$, $${sci(v, B.dev.E)}$ · ` + band + String.raw` · mean precession ${v.fix(B.rate, 3)} rad/s (steady rate at $50°$: ${v.fix(B.Wst, 3)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.17
    {
      num: '10.17',
      kind: 'Phenomenon',
      name: 'Sleeping top and its stability threshold',
      statement: String.raw`A symmetric top spinning upright about a fixed tip (a **sleeping** top) is stable against small tilts if and only if
$$\omega_3^2 > \frac{4MglI_1}{I_3^2},$$
where $I_1$ is the moment about a horizontal axis through the tip. Above this threshold a small tilt only makes the axis wobble on two circular modes with frequencies
$$\lambda_\pm = \frac{I_3\omega_3 \pm \sqrt{I_3^2\omega_3^2 - 4MglI_1}}{2I_1}$$
(fast nutation and slow precession). Below it the two frequencies merge and become complex, and the tilt grows exponentially at the rate $\sqrt{4MglI_1 - I_3^2\omega_3^2}/(2I_1)$. A real top slowly loses spin to friction at its tip. It sleeps until $\omega_3$ falls through the threshold, then begins to wobble visibly and falls into large precession and nutation.`,
      idea: String.raw`Linearise the heavy top (10.16) about $\theta = 0$: write the small tilt as $\xi = n_x + in_y$. Then $I_1\ddot\xi - iI_3\omega_3\dot\xi - Mgl\,\xi = 0$, and trying $\xi = e^{i\lambda t}$ gives $I_1\lambda^2 - I_3\omega_3\lambda + Mgl = 0$. The roots are real, giving bounded circular motions, exactly when the discriminant $I_3^2\omega_3^2 - 4MglI_1$ is positive. Gravity alone, $I_1\ddot\xi = Mgl\,\xi$, would topple the top; the gyroscopic term $I_3\omega_3\dot\xi$ (as in 10.10) turns the fall into rotation if it is strong enough. In terms of the effective potential, $\theta = 0$ changes from a minimum to a maximum at the threshold.`,
      caption: String.raw`A toy top (50 g, centre of mass 2 cm above the tip) starts nearly upright, tilted by half a degree, and friction at the tip drains its spin. Left: the top and the trace of its axis. Right: the two linear frequencies against spin. Above the threshold $\omega_c$ they are real (blue); below it they merge, and the red curve is the growth rate of the tilt. The gold dot shows the current spin sliding left. Bottom: tilt against time on a log scale. It stays at half a degree while the top sleeps, and rises along a straight line, exponential growth, soon after the spin crosses $\omega_c$ (dashed). Change the starting spin and the spin-down time.`,
      deps: ['mech-10.16'],
      refs: ['Tong §3.6', 'Arnold §31'],
      tags: ['heavy top', 'stability', 'bifurcation'],
      credit: 'Klein & Sommerfeld, Über die Theorie des Kreisels, 1897',
      viz(v) {
        const g = 9.81, M = 0.05, l = 0.02, rd = 0.025, I3v = 0.5 * M * rd * rd, I1v = 0.25 * M * rd * rd + M * l * l, mgl = M * g * l;
        const wc = Math.sqrt(4 * mgl * I1v) / I3v, TS = 16, DSP = 22;
        const w0S = v.slider('starting spin $\\omega_3(0)/\\omega_c$', 0.6, 2.5, 1.7, { step: 0.01 });
        const tauS = v.slider('spin-down time (s)', 3, 100, 9, { log: true });
        const S = v.stage({ x: [-0.95, 0.95], y: [-0.35, 1.05], equal: true, axes: false, height: 300, title: 'the top (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.3, axes: false, hint: false });
        const sF = v.stage({ x: [0, 2.5], y: [-0.4, 2.2], axes: 'box', height: 300, title: 'linear modes against $\\omega_3/\\omega_c$ (rates in units of $\\omega_c$)' });
        const sT = v.stage({ x: [0, TS], y: [0.1, 180], ylog: true, axes: 'box', height: 170, full: true, xlabel: 't (s)', title: 'tilt of the axis (degrees, log scale)' });
        const cache = memo(); let cur = null;
        const run = () => cache(w0S.value + '|' + tauS.value, () => {
          const w3 = w0S.value * wc, fr = 1 / tauS.value, a0 = 0.5 * DEG, n0 = [Math.sin(a0), 0, Math.cos(a0)], u0 = unit(crs([0, 1, 0], n0));
          const R = rk4rec(topRHS(I1v, I3v, mgl, fr), [...n0, ...u0, ...scl(n0, I3v * w3)], TS, 40000, 20, topPost);
          const tilt = R.y.map((y) => Math.acos(clamp(y[2], -1, 1)) / DEG), spin = R.y.map((y) => (y[6] * y[0] + y[7] * y[1] + y[8] * y[2]) / I3v);
          const tc = w0S.value > 1 ? tauS.value * Math.log(w0S.value) : 0;
          let t5 = NaN; for (let i = 0; i < tilt.length; i++) if (tilt[i] > 5) { t5 = R.t[i]; break; }
          let maxBefore = 0; for (let i = 0; i < tilt.length && R.t[i] < tc; i++) maxBefore = Math.max(maxBefore, tilt[i]);
          return { R, tilt, spin, tc, t5, maxBefore, w3 };
        });
        v.animate((t) => {
          const B = run(), R = B.R, i = idxAt(R, t % TS), y = R.y[i], n = [y[0], y[1], y[2]], u = [y[3], y[4], y[5]], ws = B.spin[i] / wc;
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 0.7, { fill: 'faint', fillAlpha: 0.2, color: 'faint', grid: true }, [0, 0, 0]);
          const tr = R.y.slice(Math.max(0, i - 300), i + 1).map((q) => [q[0] * 0.66, q[1] * 0.66, q[2] * 0.66]);
          sc.path(tr, { color: 'gold', width: 1.8 });
          drawTop(sc, n, u, l * DSP, rd * DSP);
          sc.dot([0, 0, 0], { r: 3, color: 'ink' });
          sc.flush();
          S.corner(`$\\omega_3 = ${v.fix(ws, 3)}\\,\\omega_c$ · tilt ${v.fix(B.tilt[i], 2)}°`, 'tl', { color: ws > 1 ? 'green' : 'red' });
          // linear modes
          sF.hline(0, { color: 'faint' }); sF.vline(1, { color: 'muted', dash: [5, 4] }); sF.tex('\\omega_c', 1, 2.08, { color: 'muted', dx: 6, align: 'left', size: 14 });
          const lam = (x, sg) => { const d = x * x - 1; return d >= 0 ? (I3v * wc * (x + sg * Math.sqrt(d))) / (2 * I1v) / wc : NaN; };
          sF.fn((x) => lam(x, 1), { domain: [1, 2.5], color: 'accent', width: 2.4 });
          sF.fn((x) => lam(x, -1), { domain: [1, 2.5], color: 'accent', width: 2.4 });
          sF.fn((x) => (x < 1 ? (I3v * wc * x) / (2 * I1v) / wc : NaN), { domain: [0, 1], color: 'accent', width: 1.4, dash: [5, 4] });
          sF.fn((x) => (x < 1 ? (I3v * wc * Math.sqrt(1 - x * x)) / (2 * I1v) / wc : NaN), { domain: [0, 1], color: 'red', width: 2.4 });
          sF.vline(ws, { color: 'gold', width: 1.2 });
          if (ws >= 1) { sF.dot(ws, lam(ws, 1), { r: 5, color: 'gold' }); sF.dot(ws, lam(ws, -1), { r: 5, color: 'gold' }); }
          else sF.dot(ws, (I3v * wc * Math.sqrt(1 - ws * ws)) / (2 * I1v) / wc, { r: 5, color: 'red' });
          // tilt vs time
          sT.hline(0.5, { color: 'faint', dash: [3, 4] });
          if (B.tc > 0 && B.tc < TS) { sT.vline(B.tc, { color: 'muted', dash: [6, 4] }); sT.tex('\\omega_3 = \\omega_c', B.tc, 90, { color: 'muted', dx: 6, align: 'left', size: 13 }); }
          series(sT, R.t, B.tilt, R.t.length, { color: 'accent', width: 1.2, alpha: 0.3 });
          series(sT, R.t, B.tilt, i, { color: 'accent', width: 2.2 });
          sT.dot(R.t[i], B.tilt[i], { r: 4.5, color: 'gold' });
          cur = { B, ws };
        }, { period: TS, still: 9 });
        v.legend([['accent', 'real frequencies $\\lambda_\\pm$ (stable)'], ['red', 'growth rate (unstable)'], ['gold', 'current spin / axis trace']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, ws } = cur;
          const head = String.raw`$I_1 = ${v.sci(I1v, 3)}$, $I_3 = ${v.sci(I3v, 3)}$ kg·m², $Mgl = ${v.sci(mgl, 3)}$ N·m · threshold $\omega_c = \sqrt{4MglI_1}/I_3 = ${v.fix(wc, 1)}$ rad/s (${v.fix(wc / TAU, 1)} turns/s) · now $\omega_3 = ${v.fix(ws, 3)}\,\omega_c$`;
          if (B.w3 <= wc) return head + String.raw` · started below the threshold: the tilt grows at once (above 5° after ${isFinite(B.t5) ? v.fix(B.t5, 2) : '—'} s)`;
          return head + String.raw` · the spin crosses $\omega_c$ at $t = \tau\ln(\omega_3(0)/\omega_c) = ${v.fix(B.tc, 2)}$ s; until then the tilt stayed below ${v.fix(B.maxBefore, 3)}°, and it passed 5° at ${isFinite(B.t5) ? v.fix(B.t5, 2) + ' s' : 'no time in this run'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.18
    {
      num: '10.18',
      kind: 'Phenomenon',
      name: 'Precession of the equinoxes',
      statement: String.raw`Earth’s rotation axis is not fixed among the stars. It sweeps a cone of half-angle $\varepsilon \approx 23.44°$ (the obliquity) around the pole of the ecliptic, westward, at about $50.3''$ per year, one turn in about **25,800 years** (25,772 years at the present rate of general precession, $50.29''$/yr). As a result the equinoxes slide westward along the ecliptic, and the pole star changes. Today Polaris is $0.6°$ from the pole and will be closest, about $0.45°$, around 2100; Thuban was the pole star about 2800 BC, and Vega will be within about $5°$ of the pole around AD 14,000. The cause is the torque of the Sun and the Moon on Earth’s equatorial bulge. For a body with dynamical flattening $H = (C - A)/C$ spinning at $\omega$, a distant body of mass $m$ on an orbit of mean motion $n$ produces the precession rate
$$\dot\psi = \frac32\,H\,\frac{\cos\varepsilon}{\omega}\,\frac{Gm}{a^3} \qquad(\text{for the Sun } Gm/a^3 = n^2),$$
about $16''$/yr from the Sun and $34''$/yr from the Moon. A spherical Earth ($H = 0$) would not precess.`,
      idea: String.raw`Averaged over an orbit, the Sun’s tidal pull (9.3) on the bulge is a torque that tries to tilt the equator into the ecliptic: $\tau = \frac32\frac{Gm}{a^3}(C - A)\sin\varepsilon\cos\varepsilon$, directed along the line of the equinoxes. Earth is a fast gyroscope with $L = C\omega$, so, as in 10.10, the torque turns $\mathbf L$ sideways instead of reducing $\varepsilon$: the axis precesses at $\tau/(L\sin\varepsilon)$, which is the formula above. The Moon is far less massive but much closer, and since $m/a^3$ is what matters it contributes about twice as much as the Sun. Hipparchus found the precession around 130 BC, and Newton explained it in the Principia (1687).`,
      caption: String.raw`Drag the year slider from 13,000 BC to AD 16,000. Left: the northern sky around the pole of the ecliptic (centre), from 50 bright stars at their J2000 positions; the celestial pole (gold) moves around the circle of radius $\varepsilon$, and the readout names the bright star nearest to it. Right: the cause, with the bulge and the obliquity exaggerated. The Sun’s pull on the near and far sides of the bulge (gold arrows) gives a torque (orange) perpendicular to the spin, so the axis turns around the ecliptic pole. The rate is computed from the torque formula. Switch off the Moon, or flatten or round the Earth, and watch the pole lag behind its real schedule.`,
      deps: ['mech-10.10', 'mech-9.3'],
      see: ['climate-8.1'],
      refs: ['Goldstein §5.8', 'Tong §3.6'],
      tags: ['precession', 'Earth', 'astronomy'],
      credit: 'Hipparchus, c. 130 BC (discovery); Newton, 1687 (explanation)',
      scope: String.raw`Uniform precession at fixed obliquity; the real motion adds nutation (18.6-year wobbles of about 9″), a slow change of the rate, planetary precession of the ecliptic, and the stars’ own proper motions.`,
      viz(v) {
        const H0 = 3.2737949e-3, EPS = 23.4393 * DEG, OM = TAU / 86164.0905, YR = 365.25 * 86400, AS = 3600 / DEG;
        const nS = TAU / (365.256363 * 86400), nM = TAU / (27.321661 * 86400), muM = 0.0123000371, eS = 0.0167, eM = 0.0549, iM = 5.145 * DEG;
        const yS = v.slider('year', -13000, 16000, 2026, { step: 1, fmt: (y) => (y <= 0 ? `${1 - Math.round(y)} BC` : `AD ${Math.round(y)}`) });
        const moon = v.toggle('include the Moon', true);
        const hS = v.slider('Earth’s flattening $H$ / actual', 0, 2, 1, { step: 0.01 });
        const sk = v.stage({ x: [-50, 50], y: [-50, 50], equal: true, axes: false, height: 360, title: 'the northern sky around the ecliptic pole' });
        const S3 = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 360, title: 'why: torque on the equatorial bulge (drag to rotate)' });
        const sc = v.scene3(S3, { yaw: -0.4, pitch: 0.25, axes: false, hint: false });
        // name, RA (h, m, s), Dec (°, ′, ″), V magnitude
        const STARS = [
          ['Polaris', 2, 31, 49.1, 89, 15, 51, 1.98], ['Kochab', 14, 50, 42.3, 74, 9, 20, 2.08], ['Pherkad', 15, 20, 43.7, 71, 50, 2, 3.05], ['Yildun', 17, 32, 13.0, 86, 35, 11, 4.35],
          ['ε UMi', 16, 45, 58.2, 82, 2, 14, 4.21], ['ζ UMi', 15, 44, 3.5, 77, 47, 40, 4.32], ['η UMi', 16, 17, 30.3, 75, 45, 19, 4.95],
          ['Thuban', 14, 4, 23.3, 64, 22, 33, 3.65], ['Eltanin', 17, 56, 36.4, 51, 29, 20, 2.24], ['Rastaban', 17, 30, 26.0, 52, 18, 5, 2.79], ['Altais', 19, 12, 33.3, 67, 39, 42, 3.07],
          ['Aldhibah', 17, 8, 47.2, 65, 42, 53, 3.17], ['Edasich', 15, 24, 55.8, 58, 57, 58, 3.29], ['κ Dra', 12, 33, 29.0, 69, 47, 18, 3.87], ['χ Dra', 18, 21, 3.4, 72, 43, 58, 3.55], ['ε Dra', 19, 48, 10.4, 70, 16, 4, 3.83],
          ['Vega', 18, 36, 56.3, 38, 47, 1, 0.03], ['Deneb', 20, 41, 25.9, 45, 16, 49, 1.25], ['δ Cyg', 19, 44, 58.5, 45, 7, 51, 2.87], ['Sadr', 20, 22, 13.7, 40, 15, 24, 2.23], ['ε Cyg', 20, 46, 12.7, 33, 58, 13, 2.48],
          ['Alderamin', 21, 18, 34.8, 62, 35, 8, 2.45], ['Alfirk', 21, 28, 39.6, 70, 33, 39, 3.23], ['Errai', 23, 39, 20.8, 77, 37, 57, 3.21], ['ζ Cep', 22, 10, 51.3, 58, 12, 5, 3.35], ['ι Cep', 22, 49, 40.8, 66, 12, 2, 3.52], ['δ Cep', 22, 29, 10.3, 58, 24, 55, 4.07],
          ['ι Her', 17, 39, 27.9, 46, 0, 23, 3.80], ['τ Her', 16, 19, 44.4, 46, 18, 48, 3.89],
          ['Dubhe', 11, 3, 43.7, 61, 45, 3, 1.79], ['Merak', 11, 1, 50.5, 56, 22, 57, 2.37], ['Phecda', 11, 53, 49.8, 53, 41, 41, 2.44], ['Megrez', 12, 15, 25.6, 57, 1, 57, 3.31], ['Alioth', 12, 54, 1.7, 55, 57, 35, 1.77], ['Mizar', 13, 23, 55.5, 54, 55, 31, 2.27], ['Alkaid', 13, 47, 32.4, 49, 18, 48, 1.86],
          ['Caph', 0, 9, 10.7, 59, 8, 59, 2.27], ['Schedar', 0, 40, 30.4, 56, 32, 14, 2.24], ['γ Cas', 0, 56, 42.5, 60, 43, 0, 2.47], ['Ruchbah', 1, 25, 49.0, 60, 14, 7, 2.68], ['Segin', 1, 54, 23.7, 63, 40, 12, 3.38],
          ['Capella', 5, 16, 41.4, 45, 59, 53, 0.08], ['Mirfak', 3, 24, 19.4, 49, 51, 40, 1.79], ['Menkalinan', 5, 59, 31.7, 44, 56, 51, 1.90], ['Algol', 3, 8, 10.1, 40, 57, 20, 2.12],
          ['Muscida', 8, 30, 15.9, 60, 43, 5, 3.36], ['θ UMa', 9, 32, 51.4, 51, 40, 38, 3.17], ['ι UMa', 8, 59, 12.5, 48, 2, 30, 3.14], ['Alkaphrah', 9, 3, 37.5, 47, 9, 24, 3.60], ['Tania Borealis', 10, 17, 5.8, 42, 54, 52, 3.45],
        ].map(([name, h, m, s, d, dm, ds, mag]) => {
          const ra = (h + m / 60 + s / 3600) * 15 * DEG, de = (d + dm / 60 + ds / 3600) * DEG;
          const b = Math.asin(Math.sin(de) * Math.cos(EPS) - Math.cos(de) * Math.sin(EPS) * Math.sin(ra)), lam = Math.atan2(Math.sin(ra) * Math.cos(EPS) + Math.tan(de) * Math.sin(EPS), Math.cos(ra));
          return { name, lam, b, mag };
        });
        const LABEL = new Set(['Polaris', 'Kochab', 'Thuban', 'Vega', 'Deneb', 'Alderamin', 'Eltanin', 'Dubhe', 'Capella']);
        // map: azimuthal equidistant about the north ecliptic pole, as seen from Earth (longitude increases clockwise)
        const XY = (lam, b) => { const r = 90 - b / DEG, a = Math.PI - lam; return [r * Math.cos(a), r * Math.sin(a)]; };
        const rates = () => {
          const k = (1.5 * H0 * hS.value * Math.cos(EPS)) / OM;
          const sun = (k * nS * nS) / (1 - eS * eS) ** 1.5, mo = moon.value ? ((k * nM * nM * muM) / (1 + muM) / (1 - eM * eM) ** 1.5) * (1 - 1.5 * Math.sin(iM) ** 2) : 0;
          return { sun: sun * YR * AS, moon: mo * YR * AS, tot: (sun + mo) * YR * AS };
        };
        let cur = null;
        v.render(() => {
          const Y = yS.value, Rt = rates(), p = Rt.tot / 3600 * DEG, lp = Math.PI / 2 - p * (Y - 2000), bp = Math.PI / 2 - EPS;
          // sky
          sk.circle(0, 0, 48, { color: 'faint', width: 1 });
          for (const r of [10, 20, 30, 40]) sk.circle(0, 0, r, { color: 'faint', width: 0.6, alpha: 0.5 });
          sk.circle(0, 0, EPS / DEG, { color: 'gold', width: 1.4, dash: [4, 4], alpha: 0.8 });
          const p0 = 50.29 / 3600 * DEG;
          for (const [yy, lab] of [[-7999, '8000 BC'], [-3999, '4000 BC'], [1, 'AD 1'], [4000, 'AD 4000'], [8000, 'AD 8000'], [12000, 'AD 12,000']]) {
            const a = Math.PI / 2 - p0 * (yy - 2000), [x, y] = XY(a, bp), rr = Math.hypot(x, y), [xo, yo] = [(x * (rr + 4.5)) / rr, (y * (rr + 4.5)) / rr];
            sk.dot(x, y, { r: 2.5, color: 'gold' });
            sk.text(lab, xo, yo, { color: 'gold', size: 10, align: 'center', alpha: 0.95 });
          }
          let best = null;
          for (const s of STARS) {
            const r = 90 - s.b / DEG; if (r > 49) continue;
            const [x, y] = XY(s.lam, s.b);
            sk.dot(x, y, { r: clamp(4.6 - 0.95 * s.mag, 1.3, 5.2), color: 'ink' });
            if (LABEL.has(s.name)) sk.text(s.name, x, y, { color: 'muted', size: 10.5, dx: 6, dy: -6 });
            const dd = Math.acos(clamp(Math.sin(s.b) * Math.sin(bp) + Math.cos(s.b) * Math.cos(bp) * Math.cos(s.lam - lp), -1, 1));
            if (s.mag < 3.5 && (!best || dd < best.d)) best = { ...s, d: dd };
          }
          const [px, py] = XY(lp, bp);
          sk.circle(px, py, 5, { color: 'gold', width: 1, alpha: 0.6 });
          sk.dot(px, py, { r: 6, color: 'gold' }); sk.text('pole', px, py, { color: 'gold', size: 11, dx: 8, dy: 10 });
          sk.dot(0, 0, { r: 3, color: 'accent' }); sk.text('ecliptic pole', 0, 0, { color: 'accent', size: 10, dx: 6, dy: 9 });
          sk.corner(Y <= 0 ? `${1 - Y} BC` : `AD ${Y}`, 'tl', { size: 13, color: 'ink' });
          // physics view in ecliptic coordinates: z = ecliptic pole
          const s = [Math.sin(EPS) * Math.cos(lp), Math.sin(EPS) * Math.sin(lp), Math.cos(EPS)], zE = [0, 0, 1];
          const ex = unit(crs(s, [0, 0, 1])), ey = crs(s, ex);   // equatorial plane basis
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 1.5, { fill: 'gold', fillAlpha: 0.06, color: 'gold', width: 1, grid: false });
          sc.path(circlePts([0, 0, 0], [1, 0, 0], [0, 1, 0], 1.5, 72), { color: 'gold', width: 1, alpha: 0.5 });
          const cone = circlePts([0, 0, 1.25 * Math.cos(EPS)], [1, 0, 0], [0, 1, 0], 1.25 * Math.sin(EPS), 72);
          sc.path(cone, { color: 'accent', width: 1.2, dash: [4, 4], alpha: 0.7 });
          // Earth with an exaggerated bulge
          sphereFrame(sc, 0.78, { lat: false, color: 'teal', alpha: 0.6 });
          for (let k = -2; k <= 2; k++) { const la = (k * 30) * DEG; spherePath(sc, circlePts(scl(s, 0.78 * Math.sin(la)), ex, ey, 0.78 * Math.cos(la), 60), { color: 'teal', width: 1, alpha: 0.6, backAlpha: 0.15 }); }
          sc.path(circlePts([0, 0, 0], ex, ey, 0.9, 72), { color: 'teal', width: 3.4, alpha: 0.9 });
          // the Sun’s differential pull on the two sides of the bulge (toward the ecliptic plane)
          const k1 = Math.max(0, hS.value);
          for (const sg of [1, -1]) {
            const pnt = scl(ey, 0.9 * sg), pull = [0, 0, -pnt[2]];
            if (k1 > 0.01 && Math.abs(pnt[2]) > 0.02) sc.arrow(pnt, madd(pnt, pull, 1.1 * k1), { color: 'gold', width: 2.2, head: 7 });
          }
          sc.arrow([0, 0, 0], scl(zE, 1.35), { color: 'muted', width: 1.4 }); sc.tex('\\text{ecliptic pole}', scl(zE, 1.4), { color: 'muted', size: 11, align: 'right', dx: -8 });
          sc.arrow([0, 0, 0], scl(s, 1.25), { color: 'accent', width: 3 }); sc.tex('\\mathbf L', scl(s, 1.36), { color: 'accent', size: 15 });
          const tq = unit(crs(s, zE));
          if (k1 > 0.01) { sc.arrow([0, 0, 0], scl(tq, 0.55 + 0.3 * Math.min(k1, 1.5)), { color: 'orange', width: 2.8 }); sc.tex('\\boldsymbol\\tau', scl(tq, 0.7 + 0.3 * Math.min(k1, 1.5)), { color: 'orange', size: 15 }); }
          sc.arrow([0.95, 0, 0], [1.45, 0, 0], { color: 'gold', width: 2 }); sc.tex('\\text{to the Sun}', [1.3, 0, 0.14], { color: 'gold', size: 11 });
          sc.flush();
          cur = { Rt, best, lp, Y };
        });
        v.legend([['gold', 'celestial pole and its circle'], ['ink', 'stars (size by brightness)', { dot: true }], ['teal', 'equatorial bulge (exaggerated)'], ['orange', 'torque'], ['accent', 'spin axis $\\mathbf L$']]);
        v.readout(() => {
          if (!cur) return '';
          const { Rt, best, Y } = cur, per = Rt.tot > 1e-9 ? 1296000 / Rt.tot : Infinity;
          const star = best ? String.raw`nearest bright star to the pole: **${best.name}**, ${v.fix(best.d / DEG, 2)}° away` : '';
          return String.raw`computed lunisolar precession: Sun ${v.fix(Rt.sun, 2)}″/yr + Moon ${v.fix(Rt.moon, 2)}″/yr $= ${v.fix(Rt.tot, 2)}$″/yr, one turn in ${isFinite(per) ? v.fix(per, 0) : '∞'} years · observed: lunisolar 50.38″/yr; general precession 50.29″/yr, one turn in 25,772 years · ${Y <= 0 ? `${1 - Y} BC` : `AD ${Y}`}: ` + star;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.19
    {
      num: '10.19',
      kind: 'Theorem',
      name: 'Chasles’ theorem: every rigid motion is a screw',
      statement: String.raw`Every proper rigid motion of space, $\mathbf x \mapsto \mathsf R\mathbf x + \mathbf d$ with $\mathsf R\in SO(3)$, is a **screw motion**: a rotation by some angle $\theta$ about some line $\ell$ followed by a translation by $h$ along the same line, the two commuting. If $\mathsf R \neq \mathsf I$, the axis has the direction $\mathbf n$ of the rotation (10.1), the slide is $h = \mathbf n\cdot\mathbf d$, and the axis passes through the point
$$\mathbf p = \tfrac12\left(\mathbf d_\perp + \cot\tfrac\theta2\;\mathbf n\times\mathbf d_\perp\right), \qquad \mathbf d_\perp = \mathbf d - h\,\mathbf n ,$$
which is the unique point of the plane $\perp\mathbf n$ through the origin with $(\mathsf I - \mathsf R)\mathbf p = \mathbf d_\perp$. Special cases: $h = 0$ gives a pure rotation about a fixed line (every planar motion is a rotation about some point); $\mathsf R = \mathsf I$ gives a pure translation, whose axis has gone to infinity. The infinitesimal version says that every instantaneous rigid velocity field is a twist about a unique axis.`,
      idea: String.raw`Split $\mathbf d$ into its part $h\mathbf n$ along the rotation axis and its part $\mathbf d_\perp$ perpendicular to it. On the plane $\perp\mathbf n$ the map $\mathbf x\mapsto \mathsf R\mathbf x + \mathbf d_\perp$ is a planar rotation plus translation; since $\mathsf R$ has no eigenvalue $1$ there, $\mathsf I - \mathsf R$ is invertible on that plane, and the planar motion has exactly one fixed point $\mathbf p$. Writing out the inverse of $\mathsf I - \mathsf R$ for a rotation by $\theta$ in the plane gives the half-angle formula. Then $\mathbf x\mapsto \mathsf R(\mathbf x - \mathbf p) + \mathbf p + h\mathbf n$ is the same map, a screw about the line through $\mathbf p$ along $\mathbf n$. The proof needs Euler’s theorem (10.1) only for the direction of the axis.`,
      caption: String.raw`Drag the gold handle to move the block’s target position, drag the orange tip to choose the rotation axis, and set the angle. The faint outline is the starting pose and the solid outline the target. The equivalent screw axis is computed and drawn in green. The block then travels by the single screw motion, turning about the green line while sliding along it, and its corners trace helices that land exactly on the target corners. In *planar* mode the slide vanishes and the motion is a rotation about a fixed line; in *translation* mode there is no rotation and the axis is gone.`,
      deps: ['mech-10.1'],
      see: ['robot-2.3'],
      refs: ['Goldstein §4.6'],
      tags: ['screw motion', 'rigid motion', 'kinematics'],
      credit: 'Mozzi, 1763; Chasles, 1830',
      viz(v) {
        const mode = v.select('motion', [{ value: 'gen', label: 'general' }, { value: 'plan', label: 'planar' }, { value: 'tran', label: 'translation only' }], 'gen');
        const thS = v.slider('rotation angle $\\theta$ (°)', -180, 180, 110, { step: 1 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.9], equal: true, axes: false, height: 390, title: 'from the start pose (faint) to the target (outline) by one screw' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.32, axis: 1.3, lim: 1.8, hint: false });
        const H = [0.42, 0.26, 0.15], C0 = [-0.75, -0.45, -0.2];
        const D = sc.handle([0.7, 0.6, 0.55], { color: 'gold', label: 'target' });
        const A = sc.handle([0.3, 0.45, 1.1], { color: 'orange', label: '$\\mathbf a$', snap: (p) => scl(unit(p), 1.15) });
        let cur = null;
        v.animate((t) => {
          const md = mode.value; thS.el.hidden = md === 'tran'; A.visible = md === 'gen';
          if (md === 'plan' && Math.abs(D.p[2] - C0[2]) > 1e-9 && !D.dragging) D.set([D.p[0], D.p[1], C0[2]]);
          const a = md === 'plan' ? [0, 0, 1] : unit(A.p), th = md === 'tran' ? 0 : thS.value * DEG;
          const c1 = md === 'plan' ? [D.p[0], D.p[1], C0[2]] : D.p;
          const R = rotAxis(a, th), d = sub(c1, mv(R, C0));
          let n = a, ang = th; if (ang < 0) { n = scl(a, -1); ang = -ang; }
          const s = clamp(t / 6, 0, 1), es = v.M.smoothstep(s);
          const corners = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x * H[0], y * H[1], z * H[2]]);
          let poseAt, axisPt = null, h = 0;
          if (ang < 1e-9) poseAt = (u) => ({ R: I3(), c: lerp(C0, c1, u) });
          else {
            h = dot(n, d); const dp = madd(d, n, -h); axisPt = scl(add(dp, scl(crs(n, dp), 1 / Math.tan(ang / 2))), 0.5);
            poseAt = (u) => { const Ru = rotAxis(n, ang * u); return { R: Ru, c: add(add(mv(Ru, sub(C0, axisPt)), axisPt), scl(n, h * u)) }; };
          }
          sc.begin();
          drawBox(sc, I3(), H, { center: C0, ghost: true, color: 'faint', alpha: 1 });
          drawBox(sc, R, H, { center: c1, ghost: true, color: 'ink', width: 1.6, alpha: 0.9 });
          if (axisPt) { sc.line(madd(axisPt, n, -2.4), madd(axisPt, n, 2.4), { color: 'green', width: 2.6 }); sc.dot(axisPt, { r: 4, color: 'green' }); sc.tex('\\ell', madd(axisPt, n, 1.5), { color: 'green', size: 17, dx: 10 }); }
          // corner helices
          [0, 3, 5, 6].forEach((j, q) => {
            const pts = []; for (let k = 0; k <= 80; k++) { const P = poseAt(k / 80); pts.push(add(P.c, mv(P.R, corners[j]))); }
            sc.path(pts, { color: ['blue', 'purple', 'teal', 'pink'][q], width: 1, alpha: 0.35 });
            sc.path(pts.slice(0, Math.round(es * 80) + 1), { color: ['blue', 'purple', 'teal', 'pink'][q], width: 2 });
          });
          const P = poseAt(es);
          drawBox(sc, P.R, H, { center: P.c, fillAlpha: 0.3 });
          if (md === 'gen') { sc.arrow([0, 0, 0], A.p, { color: 'orange', width: 2 }); }
          sc.flush();
          const err = Math.max(...corners.map((c) => nrm(sub(add(poseAt(1).c, mv(poseAt(1).R, c)), add(c1, mv(R, c))))));
          cur = { ang, h, axisPt, n, err, d, R, md };
        }, { period: 8, still: 3.6 });
        v.legend([['faint', 'start pose'], ['ink', 'target pose'], ['green', 'screw axis $\\ell$'], ['blue', 'corner paths (helices)']]);
        v.readout(() => {
          if (!cur) return '';
          const { ang, h, axisPt, n, err, d, md } = cur, f3 = (p) => `(${p.map((c) => v.fix(c, 3)).join(',\\ ')})`;
          if (ang < 1e-9) return String.raw`no rotation: the motion is the translation by $\mathbf d = ${f3(d)}$, a screw whose axis has gone to infinity (any line parallel to $\mathbf d$ will do) · corners land on the target to $${sci(v, err)}$`;
          return String.raw`screw: turn by $\theta = ${v.fix(ang / DEG, 1)}°$ about the line through $\mathbf p = ${f3(axisPt)}$ along $\mathbf n = ${f3(n)}$, then slide $h = \mathbf n\cdot\mathbf d = ${num(v, h, 4)}$ along it (pitch $2\pi h/\theta = ${num(v, (TAU * h) / ang, 3)}$ per turn)` + (md === 'plan' ? ' — planar motion: no slide, a pure rotation about a fixed line' : '') + String.raw` · after the screw the corners miss the target by $${sci(v, err)}$`;
        });
        function lerp(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
      },
    },
    // ───────────────────────────────────────────────────────────── 10.20
    {
      num: '10.20',
      kind: 'Theorem',
      name: 'Unit quaternions double-cover the rotations',
      statement: String.raw`Write a unit quaternion as $q = \cos\frac\theta2 + \sin\frac\theta2\,(n_1 i + n_2 j + n_3 k)$ with $|\mathbf n| = 1$, and let it act on vectors, viewed as pure quaternions, by $\mathbf v \mapsto q\,\mathbf v\,\bar q$. This is the rotation by $\theta$ about $\mathbf n$, and composing rotations corresponds to multiplying quaternions. The map from the unit quaternions (the 3-sphere $S^3 = SU(2)$) to $SO(3)$ is onto and exactly **two-to-one**: $q$ and $-q$ give the same rotation. Consequently a full turn, $\theta$ from $0$ to $2\pi$, is a closed loop in $SO(3)$ whose lift runs from $q = 1$ to $q = -1$; that loop cannot be shrunk to a point. Two full turns lift to a closed loop in $S^3$, which can be shrunk ($\pi_1(SO(3)) = \mathbb Z/2$). Dirac’s belt trick shows this with an object tied to its surroundings by ribbons. After one turn the ribbons stay twisted however they are moved; after two turns they can be untangled without turning the object.`,
      idea: String.raw`For a unit $q$ the map $\mathbf v \mapsto q\mathbf v\bar q$ preserves the norm and fixes the real axis, so it acts on pure quaternions $\cong\mathbb R^3$ by an orthogonal map. It is a rotation because $S^3$ is connected and the map is the identity at $q = 1$. Its axis is $\mathbf n$, and a direct computation gives the angle $\theta$, which is why the half-angles appear. Since $(-q)\mathbf v\overline{(-q)} = q\mathbf v\bar q$, both $\pm q$ give the same rotation, and nothing else does. Following the unique continuous lift of a loop in $SO(3)$ starting at $1$ tells whether the loop is shrinkable. Lifts end at $\pm1$, and since the end point cannot jump during a deformation, a loop ending at $-1$ can never be deformed into one ending at $+1$.`,
      caption: String.raw`A cube hangs between floor and ceiling by two ribbons (orange on one face, blue on the other, so twists show). **Turn the cube** about the vertical up to 720°. Right: the frames along the ribbon, lifted to unit quaternions and drawn on the slice of $S^3$ with no $j$-component (a 2-sphere with $+1$ at the top and $-1$ at the bottom). After 360° the lift ends at $-1$; after 720° it is a closed loop. **Untangle after 720°** deforms that loop: the ribbons swing round the cube while the cube stays fixed, and the loop shrinks to the point $+1$, leaving the ribbons flat. **Try after 360°** moves the twist about as much as you like, but the lift always ends at $-1$, and the twist never goes away.`,
      deps: ['mech-10.1', 'mech-10.15'],
      see: ['mfd-5.10', 'rep-8.11', 'alg-16.7', 'robot-2.5', 'cg-8.8'],
      refs: ['Goldstein §4.5', 'Goldstein App. A'],
      tags: ['quaternions', 'SU(2)', 'belt trick'],
      credit: 'Rodrigues, 1840; Hamilton, 1843; Cayley, 1845; belt trick attributed to Dirac',
      viz(v) {
        const mode = v.select('do', [{ value: 'turn', label: 'turn the cube' }, { value: 'untangle', label: 'untangle after 720°' }, { value: 'try', label: 'try after 360°' }], 'turn');
        const aS = v.slider('cube turned by (°)', 0, 720, 360, { step: 1 });
        const lS = v.slider('deformation', 0, 2, 1.5, { step: 0.005 });
        const S = v.stage({ x: [-1.45, 1.45], y: [-1.85, 1.85], equal: true, axes: false, height: 400, title: 'a cube tied to floor and ceiling (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.18, axes: false, hint: false });
        const Q = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 400, title: 'the ribbon’s frames lifted to $S^3$' });
        const sq = v.scene3(Q, { yaw: -0.6, pitch: 0.25, axes: false, hint: false });
        const WALL = 1.65, HC = 0.33, NS = 90;
        /** The lifted path q(s), s ∈ [0, 1], from the wall (s = 0) to the cube (s = 1). */
        const qpath = (s) => {
          const md = mode.value, lam = lS.value;
          if (md === 'turn') return qaxis([0, 0, 1], aS.value * DEG * s);
          if (md === 'try') { const n = [Math.sin(TAU * Math.min(lam, 1)), 0, Math.cos(TAU * Math.min(lam, 1))]; return qaxis(n, TAU * s); }
          if (lam <= 1) { if (s <= 0.5) return qaxis([0, 0, 1], 2 * TAU * s); const n = [Math.sin(Math.PI * lam), 0, Math.cos(Math.PI * lam)]; return qmul(qaxis(n, 2 * TAU * (s - 0.5)), [-1, 0, 0, 0]); }
          return qaxis([0, 0, 1], 2 * TAU * (2 - lam) * Math.min(s, 1 - s));
        };
        let cur = null;
        v.render(() => {
          const md = mode.value; aS.el.hidden = md !== 'turn'; lS.el.hidden = md === 'turn';
          const qs = Array.from({ length: NS + 1 }, (_, k) => qpath(k / NS)), G = qs.map(qmat), Rc = G[NS], e = eyeDir(sc);
          sc.begin();
          for (const zw of [-WALL, WALL]) sc.disc([1, 0, 0], [0, 1, 0], 0.75, { fill: 'faint', fillAlpha: 0.3, color: 'muted', grid: true }, [0, 0, zw]);
          // the two ribbons: framed curves whose tangent is G(s) t0, corrected linearly to end on the cube
          for (const [W, t0, att] of [[[0, 0, -WALL], [0, 0, 1], [0, 0, -HC]], [[0, 0, WALL], [0, 0, -1], [0, 0, HC]]]) {
            const A = mv(Rc, att), Lb = 1.25 * nrm(sub(A, W)), int = [[0, 0, 0]];
            for (let k = 1; k <= NS; k++) int.push(madd(int[k - 1], add(mv(G[k - 1], t0), mv(G[k], t0)), Lb / (2 * NS)));
            const miss = sub(add(W, int[NS]), A), P = int.map((p, k) => madd(add(W, p), miss, -k / NS));
            for (let k = 0; k < NS; k++) {
              const w0 = scl(mv(G[k], [1, 0, 0]), 0.13), w1 = scl(mv(G[k + 1], [1, 0, 0]), 0.13);
              const nn = crs(sub(P[k + 1], P[k]), w0), face = dot(nn, e) >= 0;
              sc.poly([sub(P[k], w0), add(P[k], w0), add(P[k + 1], w1), sub(P[k + 1], w1)], { fill: face ? 'orange' : 'blue', fillAlpha: 0.75, edge: false });
            }
            sc.path(P.map((p, k) => add(p, scl(mv(G[k], [1, 0, 0]), 0.13))), { color: 'ink', width: 0.8, alpha: 0.5 });
            sc.path(P.map((p, k) => sub(p, scl(mv(G[k], [1, 0, 0]), 0.13))), { color: 'ink', width: 0.8, alpha: 0.5 });
          }
          drawBox(sc, Rc, [HC, HC, HC], { fillAlpha: 0.55 });
          sc.flush();
          // the quaternion path on the j = 0 slice of S³: (i, k, real) → (x, y, z)
          const Pq = (q) => [q[1], q[3], q[0]];
          sq.begin();
          sphereFrame(sq, 1);
          sq.line([0, 0, -1.25], [0, 0, 1.25], { color: 'faint', width: 1 });
          spherePath(sq, qs.map((q) => Pq(q.map((c) => -c))), { color: 'muted', width: 1.4, dash: [4, 4], alpha: 0.6, backAlpha: 0.2 });
          spherePath(sq, qs.map(Pq), { color: 'accent', width: 2.8, backAlpha: 0.35 });
          sq.dot([0, 0, 1], { r: 6, color: 'green' }); sq.tex('+1', [0, 0, 1.18], { color: 'green', size: 15 });
          sq.dot([0, 0, -1], { r: 6, color: 'red' }); sq.tex('-1', [0, 0, -1.2], { color: 'red', size: 15 });
          sq.tex('i', [1.12, 0, 0], { color: 'muted', size: 15 }); sq.tex('k', [0, 1.12, 0], { color: 'muted', size: 15 });
          sq.dot(Pq(qs[NS]), { r: 5, color: 'gold' });
          sq.flush();
          let len = 0, jmax = 0; for (let k = 1; k <= NS; k++) { len += Math.hypot(...qs[k].map((c, i) => c - qs[k - 1][i])); jmax = Math.max(jmax, Math.abs(qs[k][2])); }
          cur = { qs, Rc, len, jmax };
        });
        v.legend([['accent', 'lift of the ribbon’s frames, wall → cube'], ['muted', 'the other lift, $-q$', { dash: true }], ['gold', 'quaternion of the cube', { dot: true }], ['orange', 'ribbon front'], ['blue', 'ribbon back']]);
        v.readout(() => {
          if (!cur) return '';
          const { qs, Rc, len, jmax } = cur, q = qs[NS], md = mode.value;
          const qt = String.raw`$q_{\rm cube} = ${v.fix(q[0], 3)} ${q[3] >= 0 ? '+' : '-'} ${v.fix(Math.abs(q[3]), 3)}\,k$` + (Math.abs(q[1]) > 1e-9 ? String.raw` $+ ${v.fix(q[1], 3)}\,i$` : '');
          const same = fro(qmat(q), qmat(q.map((c) => -c)));
          const tail = String.raw` · $q$ and $-q$ give the same rotation: $\|\mathsf R(q) - \mathsf R(-q)\| = ${sci(v, same)}$ · length of the lifted path ${v.fix(len, 3)} (the $j$-component stays ${sci(v, jmax)})`;
          if (md === 'turn') { const a = aS.value; return String.raw`cube turned by ${a}° · ` + qt + (a === 360 ? ' — the cube is back where it started, yet the lift ends at $-1$' : a === 720 ? ' — back at $+1$: the lift is a closed loop' : '') + tail; }
          if (md === 'untangle') return String.raw`deformation ${v.fix(lS.value, 3)} of 2 · the cube does not turn (${qt}) · the closed loop of frames shrinks${lS.value >= 2 ? ' to the point $+1$: ribbons untangled' : ''}` + tail;
          return String.raw`the axis of the full turn is moved around (deformation ${v.fix(Math.min(lS.value, 1), 3)}) · ${qt}: the end of the lift is stuck at $-1$, so this loop in $SO(3)$ can never be shrunk` + tail;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.21
    {
      num: '10.21',
      kind: 'Phenomenon',
      name: 'Falling cat: turning with zero angular momentum',
      statement: String.raw`A body made of several parts that move relative to one another can change its orientation without any external torque and with its total angular momentum exactly zero throughout. After a closed cycle of shape changes it ends in its original shape but rotated. A falling cat dropped upside down with no spin lands on its feet this way. Gravity acts at the centre of mass and exerts no torque about it, so $\mathbf L = 0$ is conserved (2.11), and still the cat turns by $180°$ in about a third of a second. The net rotation depends only on the **loop traced in shape space**, not on how fast it is traced. For small loops it is proportional to the area enclosed, it reverses when the loop is run backwards, and a back-and-forth motion along a line (zero area) gives no net rotation. Two classic two-cylinder models explain the cat. In **tuck and turn**, one half pulls in its legs, so its moment of inertia shrinks, and twists a long way while the other half counter-rotates a little; then the roles swap. In **bend and twist** (Kane & Scher, 1969) the spine bends, the bend is swept around the body, and the halves turn without twisting relative to each other.`,
      idea: String.raw`With the shape given as a function of time, $\mathbf L = \mathsf I_{\rm lock}\boldsymbol\Omega + \sum m\,\mathbf r\times\dot{\mathbf r}_{\rm shape} = 0$ fixes the angular velocity of the whole, $\boldsymbol\Omega = -\mathsf I_{\rm lock}^{-1}\sum m\,\mathbf r\times\dot{\mathbf r}_{\rm shape}$, using the inertia tensor of 10.7. This is linear in the shape velocity, so the rotation is a line integral over the path in shape space, a connection. Time drops out, and by Stokes’ theorem the net rotation for a small loop is the enclosed area times the curvature. In the tuck-and-turn model the halves turn about a common axis, and $L = I_f\dot\theta_f + I_r\dot\theta_r = 0$ gives $d\theta_r = -\frac{I_f}{I_f + I_r}\,d\beta$ in terms of the twist $\beta = \theta_f - \theta_r$, so the net turn is $-\oint\frac{I_f}{I_f+I_r}\,d\beta$. That integral vanishes for every loop unless the ratio changes during it, which is what tucking the legs does.`,
      caption: String.raw`A two-cylinder cat (front teal, rear orange), released upside down with zero angular momentum. Right: shape space. Drag the corners of the loop; the gold dot runs once around it while the cat (left) changes shape. **Tuck and turn:** across is the twist between the halves, up is which half has its legs tucked. **Bend and twist:** the point is the bend of the spine, its direction and size. The readout checks that $\mathbf L$, summed directly over 84 moving masses, stays zero, and reports the net turn. In tuck and turn it is compared with $-\oint\frac{I_f}{I_f+I_r}d\beta$. Shrink the loop to a line and the turn vanishes; reverse its direction and the turn changes sign.`,
      deps: ['mech-2.11', 'mech-10.7'],
      see: ['fluid-7.5', 'dg-10.4'],
      refs: ['Tong §3.7'],
      tags: ['falling cat', 'geometric phase', 'angular momentum'],
      credit: 'Marey, 1894 (photographs); Kane & Scher, 1969 (model); Montgomery, 1993 (gauge theory)',
      viz(v) {
        const mode = v.select('mechanism', [{ value: 'tuck', label: 'tuck and turn' }, { value: 'bend', label: 'bend and twist (Kane–Scher)' }], 'tuck');
        const S = v.stage({ x: [-1.05, 1.05], y: [-0.95, 0.95], equal: true, axes: false, height: 340, title: 'the cat, $\\mathbf L = 0$ throughout (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.3, pitch: 0.22, axes: false, hint: false });
        const sS = v.stage({ x: [-300, 300], y: [-1.3, 1.3], axes: 'box', height: 340, title: ' ' });
        const sT = v.stage({ x: [0, 1], y: [-30, 200], axes: 'box', height: 160, full: true, xlabel: 'fraction of the loop', title: 'roll of each half (°): 0 = feet up, 180 = feet down' });
        const LH = 0.48, RC = 0.11, NL = 4;
        const LOOPS = { tuck: [[0, 1], [270, 1], [270, -1], [0, -1]], bend: Array.from({ length: 8 }, (_, k) => [62 * Math.cos((TAU * k) / 8), 62 * Math.sin((TAU * k) / 8)]) };
        const Hs = { tuck: LOOPS.tuck.map(([x, y]) => sS.handle(x, y, { color: 'accent', constrain: (a, b) => [clamp(a, -300, 300), clamp(b, -1, 1)] })), bend: LOOPS.bend.map(([x, y]) => sS.handle(x, y, { color: 'accent', constrain: (a, b) => { const r = Math.hypot(a, b), k = r > 85 ? 85 / r : 1; return [a * k, b * k]; } })) };
        // mass points of a half in its own frame (axis along +x from the joint for the front, −x for the rear): discs of points
        const half = (sg) => { const P = []; for (let i = 0; i < 5; i++) { const x = sg * LH * (i + 0.5) / 5; for (let k = 0; k < 8; k++) { const a = (TAU * k) / 8; P.push([x, (RC / Math.SQRT2) * Math.cos(a), (RC / Math.SQRT2) * Math.sin(a)]); } } return P; };
        const HF = half(1), HR = half(-1), MC = 1 / 40, ML = 0.08;
        const legs = (sg, ext) => [-1, 1].map((sd) => { const a = -Math.PI / 2 + sd * 0.38, rr = RC + 0.04 + ext * 0.36; return { root: [sg * 0.36, RC * Math.cos(a), RC * Math.sin(a)], foot: [sg * 0.36, rr * Math.cos(a), rr * Math.sin(a)] }; });
        /** Shape → rotations of the halves (in the reference frame) and leg extensions. */
        const shapeOf = (md, p) => {
          if (md === 'tuck') return { Rf: Rx(p[0] * DEG), Rr: I3(), ef: (1 - p[1]) / 2, er: (1 + p[1]) / 2 };
          const al = Math.hypot(p[0], p[1]) * DEG, ps = Math.atan2(p[1], p[0]), ub = [0, Math.cos(ps), Math.sin(ps)];
          const f = [Math.cos(al / 2), -Math.sin(al / 2) * ub[1], -Math.sin(al / 2) * ub[2]], r = [-Math.cos(al / 2), -Math.sin(al / 2) * ub[1], -Math.sin(al / 2) * ub[2]];
          const minRot = (from, to) => { const ax = crs(from, to), s = nrm(ax); return s < 1e-12 ? I3() : rotAxis(scl(ax, 1 / s), Math.atan2(s, dot(from, to))); };
          return { Rf: minRot([1, 0, 0], f), Rr: minRot([-1, 0, 0], r), ef: 0.55, er: 0.55 };
        };
        /** All mass points (reference frame) with masses, and the CM. */
        const points = (md, p) => {
          const sh = shapeOf(md, p), ps = [], ms = [];
          for (const q of HF) { ps.push(mv(sh.Rf, q)); ms.push(MC); }
          for (const q of HR) { ps.push(mv(sh.Rr, q)); ms.push(MC); }
          for (const L of legs(1, sh.ef)) { ps.push(mv(sh.Rf, L.foot)); ms.push(ML); }
          for (const L of legs(-1, sh.er)) { ps.push(mv(sh.Rr, L.foot)); ms.push(ML); }
          const Mt = ms.reduce((a, b) => a + b, 0), c = [0, 1, 2].map((j) => ps.reduce((s, q, i) => s + ms[i] * q[j], 0) / Mt);
          return { ps: ps.map((q) => sub(q, c)), ms, c, sh };
        };
        const loopPt = (verts, u) => {   // closed polygon, uniform in arc length (in scaled units)
          const sx = mode.value === 'tuck' ? 1 / 300 : 1 / 85, sy = mode.value === 'tuck' ? 1 : 1 / 85;
          const seg = verts.map((a, i) => { const b = verts[(i + 1) % verts.length]; return Math.hypot((b[0] - a[0]) * sx, (b[1] - a[1]) * sy); }), tot = seg.reduce((a, b) => a + b, 0) || 1;
          let d = (((u % 1) + 1) % 1) * tot;
          for (let i = 0; i < verts.length; i++) { if (d <= seg[i] || i === verts.length - 1) { const f = seg[i] ? d / seg[i] : 0, a = verts[i], b = verts[(i + 1) % verts.length]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; } d -= seg[i]; }
          return verts[0];
        };
        const simulate = (md, verts, dir = 1) => {
          const N = 500, h = 1 / N, du = 1e-5;
          const Om = (u) => {
            const A = points(md, loopPt(verts, dir * u)), Bp = points(md, loopPt(verts, dir * (u + du))), Bm = points(md, loopPt(verts, dir * (u - du)));
            const I = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], J = [0, 0, 0];
            A.ps.forEach((r, i) => { const rd = scl(sub(Bp.ps[i], Bm.ps[i]), 1 / (2 * du)), r2 = dot(r, r); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) I[a][b] += A.ms[i] * ((a === b ? r2 : 0) - r[a] * r[b]); const c = crs(r, rd); J[0] += A.ms[i] * c[0]; J[1] += A.ms[i] * c[1]; J[2] += A.ms[i] * c[2]; });
            return scl(v.M.solve(I, J), -1);
          };
          let q = qaxis([1, 0, 0], Math.PI);   // start upside down: legs up
          const rec = [{ u: 0, q }];
          for (let k = 0; k < N; k++) {
            const u = k * h, f = (uu, qq) => { const w = Om(uu); return qmul(qq, [0, w[0], w[1], w[2]]).map((c) => c / 2); };
            const k1 = f(u, q), k2 = f(u + h / 2, q.map((c, i) => c + (h / 2) * k1[i])), k3 = f(u + h / 2, q.map((c, i) => c + (h / 2) * k2[i])), k4 = f(u + h, q.map((c, i) => c + h * k3[i]));
            q = qnormalize(q.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])));
            rec.push({ u: u + h, q });
          }
          return rec;
        };
        const cache = memo(); let cur = null;
        const run = () => {
          const md = mode.value, verts = Hs[md].map((H) => [H.x, H.y]);
          return cache(md + '|' + verts.flat().map((x) => x.toFixed(2)).join(','), () => {
            const rec = simulate(md, verts), back = simulate(md, verts, -1);
            // space positions and the angular-momentum check
            const X = rec.map((r) => { const P = points(md, loopPt(verts, r.u)); return { P, x: P.ps.map((p) => mv(qmat(r.q), p)) }; });
            let Lmax = 0, Lf = 0;
            for (let k = 1; k < X.length - 1; k++) {
              const dt = rec[k + 1].u - rec[k - 1].u; let L = [0, 0, 0], LF = [0, 0, 0];
              X[k].x.forEach((x, i) => { const vel = scl(sub(X[k + 1].x[i], X[k - 1].x[i]), 1 / dt), c = scl(crs(x, vel), X[k].P.ms[i]); L = add(L, c); if (i < 40) LF = add(LF, c); });
              Lmax = Math.max(Lmax, nrm(L)); Lf = Math.max(Lf, nrm(LF));
            }
            const roll = (k, which) => { const sh = X[k].P.sh, Rh = which ? sh.Rf : sh.Rr, dn = mv(qmat(rec[k].q), mv(Rh, [0, 0, -1])); return Math.atan2(-dn[1], dn[2]) / DEG; };
            const unwrap = (arr) => { const o = [arr[0]]; for (let i = 1; i < arr.length; i++) { let d = arr[i] - arr[i - 1]; while (d > 180) d -= 360; while (d < -180) d += 360; o.push(o[i - 1] + d); } return o; };
            const rr = unwrap(rec.map((_, k) => roll(k, 0))), rf = unwrap(rec.map((_, k) => roll(k, 1)));
            const net = axisAngle(mm(qmat(rec[rec.length - 1].q), mT(qmat(rec[0].q)))), netB = axisAngle(mm(qmat(back[back.length - 1].q), mT(qmat(back[0].q))));
            // tuck and turn: −∮ I_f/(I_f + I_r) dβ with the moments about the spine
            let pred = NaN;
            if (md === 'tuck') {
              pred = 0; const n = 2000, Ix = (P, a, b) => { let s = 0; for (let i = a; i < b; i++) s += P.ms[i] * ((P.ps[i][1] + P.c[1]) ** 2 + (P.ps[i][2] + P.c[2]) ** 2); return s; };
              for (let k = 0; k < n; k++) {
                const p0 = loopPt(verts, k / n), p1 = loopPt(verts, (k + 1) / n), pm = loopPt(verts, (k + 0.5) / n), P = points(md, pm);
                const If = Ix(P, 0, 40) + Ix(P, 80, 82), Ir = Ix(P, 40, 80) + Ix(P, 82, 84);
                pred -= (If / (If + Ir)) * (p1[0] - p0[0]);
              }
            }
            let area = 0; for (let i = 0; i < verts.length; i++) { const a = verts[i], b = verts[(i + 1) % verts.length]; area += (a[0] * b[1] - b[0] * a[1]) / 2; }
            return { rec, X, Lmax, Lf, rr, rf, net, netB, pred, area, verts };
          });
        };
        v.animate((t) => {
          const md = mode.value; for (const k of ['tuck', 'bend']) for (const H of Hs[k]) H.visible = k === md;
          const B = run(), u = Math.min(1, (t % 5.5) / 4.5), k = Math.round(u * (B.rec.length - 1)), Qm = qmat(B.rec[k].q), P = B.X[k].P, sh = P.sh, c = P.c;
          const W = (p) => mv(Qm, sub(p, c));   // reference frame → space
          sc.begin();
          sc.line([-1, 0, -0.85], [1, 0, -0.85], { color: 'faint', width: 1 });
          for (const [Rh, sg, col, ext] of [[sh.Rr, -1, 'orange', sh.er], [sh.Rf, 1, 'teal', sh.ef]]) {
            tube(sc, W([0, 0, 0]), W(mv(Rh, [sg * LH, 0, 0])), RC, { color: col, n: 12 });
            for (const L of legs(sg, ext)) { sc.line(W(mv(Rh, L.root)), W(mv(Rh, L.foot)), { color: 'ink', width: 3 }); sc.dot(W(mv(Rh, L.foot)), { r: 3.5, color: 'ink', top: false }); }
          }
          const head = W(mv(sh.Rf, [LH + 0.09, 0, 0.02])), up = W(mv(sh.Rf, [LH + 0.09, 0, 0.13])), sideA = W(mv(sh.Rf, [LH + 0.09, 0.06, 0.1])), sideB = W(mv(sh.Rf, [LH + 0.09, -0.06, 0.1]));
          sc.dot(head, { r: 11, color: 'teal' }); sc.poly([sideA, up, W(mv(sh.Rf, [LH + 0.09, 0.02, 0.18]))], { fill: 'teal', fillAlpha: 0.8, edge: false }); sc.poly([sideB, up, W(mv(sh.Rf, [LH + 0.09, -0.02, 0.18]))], { fill: 'teal', fillAlpha: 0.8, edge: false });
          const tail = []; for (let j = 0; j <= 12; j++) { const s2 = j / 12; tail.push(W(mv(sh.Rr, [-LH - 0.25 * s2, 0, 0.05 + 0.22 * s2 * s2]))); }
          sc.path(tail, { color: 'orange', width: 3 });
          sc.flush();
          S.corner(`${v.fix(u * 100, 0)}% of the loop`, 'tl');
          // shape space
          if (md === 'tuck') { sS.setView([-300, 300], [-1.3, 1.3]); sS.setTitle('shape space: twist $\\beta$ (°) across, tuck (front ↔ rear) up'); }
          else { sS.setView([-95, 95], [-95, 95]); sS.setTitle('shape space: bend of the spine (°), direction and size'); }
          sS.hline(0, { color: 'faint' }); sS.vline(0, { color: 'faint' });
          const V = B.verts;
          sS.poly(V, { color: 'accent', width: 2, fill: B.area >= 0 ? 'green' : 'orange', fillAlpha: 0.12 });
          V.forEach((a, i) => { const b = V[(i + 1) % V.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d2 = [(b[0] - a[0]) * 0.08, (b[1] - a[1]) * 0.08]; sS.arrow(m[0] - d2[0], m[1] - d2[1], m[0] + d2[0], m[1] + d2[1], { color: 'accent', width: 2, head: 9 }); });
          const pc = loopPt(V, u); sS.dot(pc[0], pc[1], { r: 6, color: 'gold' });
          if (md === 'tuck') { sS.text('front legs tucked', -292, 1.17, { color: 'teal', size: 11 }); sS.text('rear legs tucked', -292, -1.17, { color: 'orange', size: 11 }); }
          // roll vs fraction of the loop
          const us = B.rec.map((r) => r.u), lo = Math.min(-30, ...B.rr, ...B.rf), hi = Math.max(200, ...B.rr, ...B.rf);
          sT.setView([0, 1], [lo, hi]);
          sT.hline(0, { color: 'faint' }); sT.hline(180, { color: 'green', dash: [5, 4] });
          series(sT, us, B.rr, B.rr.length, { color: 'orange', width: 1, alpha: 0.35 }); series(sT, us, B.rf, B.rf.length, { color: 'teal', width: 1, alpha: 0.35 });
          series(sT, us, B.rr, k, { color: 'orange', width: 2.4 }); series(sT, us, B.rf, k, { color: 'teal', width: 2.4 });
          cur = { B, md };
        }, { period: 5.5, still: 4.6 });
        v.legend([['teal', 'front half'], ['orange', 'rear half'], ['accent', 'loop in shape space'], ['gold', 'current shape', { dot: true }], ['green', 'feet down (180°)', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, md } = cur, net = B.net, ax = Math.abs(net.n[0]);
          const head = String.raw`$|\mathbf L|$ summed over the masses: at most $${sci(v, B.Lmax)}$, while the front half alone carries up to $${v.fix(B.Lf, 4)}$ (units kg·m²/s per loop time) · net rotation after one loop ${v.fix(net.th / DEG, 1)}° about an axis ${v.fix(Math.acos(Math.min(1, ax)) / DEG, 1)}° from the spine; the same loop run backwards: ${v.fix(B.netB.th / DEG, 1)}° the other way`;
          if (md === 'tuck') return head + String.raw` · $-\oint\frac{I_f}{I_f + I_r}\,d\beta = ${v.fix(B.pred, 1)}°$ (axisymmetric estimate; the legs on one side make the exact rotation slightly different) · enclosed area ${v.fix(B.area, 1)} °·(tuck units)`;
          return head + String.raw` · area enclosed by the bend loop ${v.fix(B.area, 0)} deg²`;
        });
      },
    },
  ],
};
