// Control Theory — Chapter 2: Modelling dynamical systems
import {
  TAU, clamp, rk4, simulate, nTeX, matTeX, cTeX, proots, eigs, ptex, tf, tfTeX, stepExact, zoh, ackermann, xMark,
  samples, springPts, dashpot, clocked, trace, flowDots, ptrim,
} from './ch02.shared.js';

const deg = (r) => (r * 180) / Math.PI;
/** Linear interpolation into a uniformly sampled trajectory {t, x} at time t; returns the state. */
function at(tr, t) {
  const h = tr.t[1] - tr.t[0], f = clamp(t / h, 0, tr.t.length - 1), i = Math.min(Math.floor(f), tr.t.length - 2), a = f - i;
  return tr.x[i].map((x, k) => x + a * (tr.x[i + 1][k] - x));
}

export default {
  collection: 'ctrl',
  chapter: 2,
  title: 'Modelling dynamical systems',
  summary: String.raw`Control needs models, but only good enough ones. A state-space model describes a system by a few internal variables obeying first-order differential equations, and near an operating point a nonlinear model can be linearised. The classic examples (the inverted pendulum, the DC motor, the mass–spring–damper with its electrical twin, the steering of a vehicle) anchor the abstractions. The same model can be read as a transfer function, rebuilt from one by a realisation, or sampled into a discrete-time model, and the modeller's kit is completed by time delays and their Padé approximations, simple process models fitted to data, the common nonlinearities, and transfer matrices with their transmission zeros.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'State-space models: state, input and output',
      statement: String.raw`A **state-space model** of a finite-dimensional, continuous-time system is a set of first-order differential equations together with an output map,
$$\dot x = f(x,u),\qquad y = h(x,u),$$
where the **state** $x(t)\in\R^n$ is a vector that summarises the whole past of the system: given $x(t_0)$ and the **input** $u(t)$ for $t\ge t_0$, the future of the state and of the **output** $y$ is determined. For a linear time-invariant system the model is $\dot x = Ax+Bu$, $y=Cx+Du$ with constant matrices.

The state is not unique: any invertible change of coordinates $z=Tx$ gives an equally good model with matrices $TAT^{-1}, TB, CT^{-1}, D$. The number $n$ is the **order** of the system.`,
      idea: String.raw`Newton's law $m\ddot q=F$ is second order, so the future of a mass depends on both its position and its velocity; those two numbers are the smallest complete summary of its past, hence the state $x=(q,\dot q)$. Writing any higher-order differential equation as a system of first-order ones, by naming each derivative a new variable, is always possible and leads to the same picture: a point moving in $\R^n$, pushed along by the vector field $f$ and by the input. Uniqueness of solutions of ordinary differential equations (ode-1.1) is what makes "state" a meaningful word.`,
      caption: String.raw`A mass on a spring with a damper, $m=1$ and $k=4$, with state $x=(q,\dot q)$ and output $y=q$. **Drag the gold handle** in the phase plane to choose the initial state. The curve is the state trajectory, and the gold dot and the cursor in the time plot show the same moment. Faint arrows are the vector field $Ax$ of the free system. Change the damping, or switch the input between none, step, pulse and sine: the input shifts the equilibrium and pushes the state around, but the picture is always one point in the plane.`,
      deps: ['mech-1.9', 'circ-6.7', 'ode-1.1'],
      refs: ['Åström–Murray §3.2', 'Franklin–Powell §7.2'],
      tags: ['state space', 'modelling'],
      viz(v) {
        const T = 10, N = 500;
        const zS = v.slider('damping ratio $\\zeta$', 0, 1.2, 0.15, { step: 0.01 });
        const inS = v.select('input $u(t)$', [{ value: 'none', label: 'none' }, { value: 'step', label: 'step' }, { value: 'pulse', label: 'pulse' }, { value: 'sine', label: 'sine' }], 'step');
        const aS = v.slider('input size', 0, 8, 4, { step: 0.1 });
        const cart = v.stage({ x: [-3.3, 3.3], y: [-0.2, 1.5], equal: true, axes: false, height: 110, full: true });
        const ph = v.stage({ x: [-4, 4], y: [-7, 7], axes: 'box', gutter: true, xlabel: 'position q', ylabel: 'velocity q̇', height: 330 });
        const tm = v.stage({ x: [0, T], y: [-6.5, 6.5], axes: 'box', gutter: true, xlabel: 't (s)', height: 330 });
        const h0 = ph.handle(-1.5, 0, { color: 'gold', label: 'x(0)', labelPos: 'ne' });
        const U = (t) => { const a = aS.value; switch (inS.value) { case 'step': return t >= 1 ? a : 0; case 'pulse': return t >= 1 && t < 2 ? a : 0; case 'sine': return a * Math.sin(2.4 * t); default: return 0; } };
        let key = '', tr = null;
        const solve = () => {
          const k = [zS.value, inS.value, aS.value, h0.x, h0.y].join('|');
          if (k !== key) { key = k; const c = 4 * zS.value; tr = simulate((x, t) => [x[1], -4 * x[0] - c * x[1] + U(t)], [h0.x, h0.y], T, N); }
          return tr;
        };
        let cur = [0, 0];
        v.animate((t) => {
          const tr = solve(), c = 4 * zS.value; cur = at(tr, t);
          // phase plane
          ph.field((x, y) => [y, -4 * x - c * y], { spacing: 38, color: 'faint', alpha: 0.7 });
          ph.path(tr.x.map((s) => [s[0], s[1]]), { color: 'accent', width: 2.2 });
          const k = Math.round((t / T) * N);
          ph.path(tr.x.slice(0, k + 1).map((s) => [s[0], s[1]]), { color: 'gold', width: 3 });
          ph.dot(cur[0], cur[1], { r: 6, color: 'gold' });
          // time plot
          tm.hline(0, { color: 'faint' });
          tm.path(tr.t.map((tt, i) => [tt, tr.x[i][0]]), { color: 'accent', width: 2.2 });
          tm.path(tr.t.map((tt, i) => [tt, tr.x[i][1]]), { color: 'orange', width: 2 });
          tm.path(samples(U, 0, T, 400), { color: 'muted', width: 1.6, dash: [5, 4] });
          tm.vline(t, { color: 'gold', width: 1.6 });
          tm.dot(t, cur[0], { r: 4.5, color: 'accent' }); tm.dot(t, cur[1], { r: 4.5, color: 'orange' });
          // cartoon
          const wallX = -3.1, cx = 0.75 * cur[0];
          cart.rect(wallX - 0.2, -0.05, wallX, 1.3, { fill: 'muted', fillAlpha: 0.35, stroke: false });
          cart.line(wallX, 0.05, 3.2, 0.05, { color: 'faint', width: 1.5 });
          cart.path(springPts(wallX, 0.62, cx - 0.35, 0.62, 9, 0.16), { color: 'ink', width: 1.8 });
          cart.rect(cx - 0.35, 0.05, cx + 0.35, 0.95, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 2 });
          cart.text('m', cx, 0.5, { size: 13, color: 'ink', align: 'center', baseline: 'middle', math: true });
          const u = U(t); if (Math.abs(u) > 0.05) cart.arrow(cx + 0.45, 1.22, cx + 0.45 + 0.13 * u, 1.22, { color: 'green', width: 2.6, head: 8 });
          cart.text('u', cx + 0.45 + 0.065 * u, 1.38, { size: 12, color: 'green', align: 'center', math: true });
        }, { period: T, still: 5 });
        v.legend([['accent', 'position $q=y$ (output)'], ['orange', 'velocity $\\dot q$'], ['muted', 'input $u$', { dash: true }], ['gold', 'the state now']]);
        v.readout(() => {
          const c = 4 * zS.value, A = [[0, 1], [-4, -c]], ev = eigs(v.M, A), t = v.t;
          return `$\\dot x=Ax+Bu,\\; y=Cx$ with $A=${matTeX(A, 3)}$, $B=${matTeX([[0], [1]])}$, $C=${matTeX([[1, 0]])}$; eigenvalues of $A$: $${ev.map((z) => cTeX(z, 3)).join(',\\; ')}$\n` +
            `at $t=${v.fix(t % T, 2)}$ s: state $x=(${v.fix(cur[0], 2)},\\,${v.fix(cur[1], 2)})$, input $u=${v.fix(U(t % T), 2)}$, output $y=${v.fix(cur[0], 2)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Method',
      name: 'Linearisation about an equilibrium',
      statement: String.raw`Let $\dot x=f(x,u)$ with $f$ continuously differentiable, and let $(x_e,u_e)$ be an **equilibrium**, $f(x_e,u_e)=0$. Writing $\tilde x=x-x_e$, $\tilde u=u-u_e$, the **linearisation** is
$$\dot{\tilde x}=A\tilde x+B\tilde u,\qquad A=\frac{\partial f}{\partial x}\Big|_{(x_e,u_e)},\quad B=\frac{\partial f}{\partial u}\Big|_{(x_e,u_e)},$$
(and likewise $C,D$ from $h$). The error made by dropping the higher-order terms is of second order: $f(x_e+\tilde x,u_e+\tilde u)=A\tilde x+B\tilde u+O(|\tilde x|^2+|\tilde u|^2)$. So the linear model predicts the nonlinear one well only while the state stays near the equilibrium, and for how long depends on how unstable the equilibrium is.`,
      idea: String.raw`This is just the first-order Taylor expansion of the vector field $f$ at its zero, using the differentiability of $f$ (pma-9.17, the derivative of a map between Euclidean spaces as a linear map). Near a stable equilibrium the neglected terms stay small for all time. Near an unstable one they grow along with the state, so the linear model is trusted only for as long as the solution has not left the neighbourhood: the faster the unstable eigenvalue, the shorter the time.`,
      caption: String.raw`A pendulum and its linearisation start from the same angle $\varphi_0$, both measured from the chosen equilibrium. The **blue** pendulum obeys $\ddot\varphi=\mp\sin\varphi-c\dot\varphi$; the **orange** one obeys the linearised $\ddot\varphi=\mp\varphi-c\dot\varphi$. For the hanging equilibrium they agree for small $\varphi_0$ and drift apart in phase as $\varphi_0$ grows. For the upright equilibrium the linear model escapes exponentially while the true pendulum swings over the top and falls back. Watch the time at which they first differ by $0.1$ rad.`,
      deps: ['ctrl-2.1', 'pma-9.17'],
      refs: ['Åström–Murray §6.4', 'Franklin–Powell §9.2'],
      tags: ['linearisation', 'equilibrium'],
      scope: String.raw`Valid in a neighbourhood of the equilibrium; the size of the neighbourhood depends on the second derivatives of $f$ and on the stability of the equilibrium.`,
      viz(v) {
        const T = 14, N = 700, L = 1.5;
        const eqS = v.select('equilibrium', [{ value: 'down', label: 'hanging' }, { value: 'up', label: 'upright' }], 'down');
        const aS = v.slider('initial angle $\\varphi_0$ (deg)', 1, 170, 50, { step: 1 });
        const cS = v.slider('damping $c$', 0, 0.6, 0.08, { step: 0.01 });
        const pic = v.stage({ x: [-3.6, 3.6], y: [-2.0, 2.0], equal: true, axes: false, height: 300, full: true });
        const tm = v.stage({ x: [0, T], y: [-3.5, 3.5], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'angle φ (rad)', height: 300 });
        const ph = v.stage({ x: [-3.5, 3.5], y: [-3.5, 3.5], axes: 'box', gutter: true, xlabel: 'φ', ylabel: 'φ̇', height: 300 });
        let key = '', sol = null, tDiv = null;
        const solve = () => {
          const k = [eqS.value, aS.value, cS.value].join('|');
          if (k !== key) {
            key = k;
            const sg = eqS.value === 'down' ? -1 : 1, c = cS.value, p0 = (aS.value * Math.PI) / 180;
            const nl = simulate((x) => [x[1], sg * Math.sin(x[0]) - c * x[1]], [p0, 0], T, N);
            const li = simulate((x) => [x[1], sg * x[0] - c * x[1]], [p0, 0], T, N);
            tDiv = null; for (let i = 0; i <= N; i++) if (Math.abs(nl.x[i][0] - li.x[i][0]) > 0.1) { tDiv = nl.t[i]; break; }
            sol = { nl, li };
          }
          return sol;
        };
        let cur = null;
        v.animate((t) => {
          const { nl, li } = solve(), sg = eqS.value === 'down' ? -1 : 1, a = at(nl, t), b = at(li, t);
          cur = { a, b };
          const bob = (px, ang) => (sg < 0 ? [px + L * Math.sin(ang), -L * Math.cos(ang)] : [px + L * Math.sin(ang), L * Math.cos(ang)]);
          const piv = (px, col, name, ang) => {
            const q = bob(px, ang);
            pic.line(px, 0, px, sg * 0.0 + (sg < 0 ? -L : L), { color: 'faint', width: 1.2, dash: [4, 4] });
            pic.line(px, 0, q[0], q[1], { color: col, width: 3 });
            pic.circle(q[0], q[1], 0.2, { fill: col, fillAlpha: 0.9, color: col });
            pic.dot(px, 0, { r: 4, color: 'ink' });
            pic.text(name, px, sg < 0 ? 1.7 : -1.8, { size: 12.5, color: col, align: 'center', weight: 600 });
          };
          piv(-1.8, 'accent', 'nonlinear: $\\ddot\\varphi=' + (sg < 0 ? '-' : '+') + '\\sin\\varphi-c\\dot\\varphi$', a[0]);
          piv(1.8, 'orange', 'linearised: $\\ddot\\varphi=' + (sg < 0 ? '-' : '+') + '\\varphi-c\\dot\\varphi$', b[0]);
          tm.hline(0, { color: 'faint' });
          tm.clip(() => {
            tm.path(nl.t.map((tt, i) => [tt, nl.x[i][0]]), { color: 'accent', width: 2.3 });
            tm.path(li.t.map((tt, i) => [tt, li.x[i][0]]), { color: 'orange', width: 2.3 });
          });
          tm.vline(t, { color: 'gold', width: 1.4 });
          if (tDiv !== null) tm.vline(tDiv, { color: 'red', width: 1.5, dash: [5, 4] });
          ph.clip(() => {
            ph.path(nl.x.map((s) => [s[0], s[1]]), { color: 'accent', width: 2.1 });
            ph.path(li.x.map((s) => [s[0], s[1]]), { color: 'orange', width: 2.1 });
          });
          ph.dot(a[0], a[1], { r: 5, color: 'accent' }); ph.dot(b[0], b[1], { r: 5, color: 'orange' });
        }, { period: T, still: 6 });
        v.legend([['accent', 'nonlinear pendulum'], ['orange', 'linearisation'], ['red', 'first time they differ by 0.1 rad', { dash: true }]]);
        v.readout(() => {
          const sg = eqS.value === 'down' ? -1 : 1, c = cS.value, p0 = (aS.value * Math.PI) / 180;
          const A = [[0, 1], [sg, -c]], ev = eigs(v.M, A);
          const frac = (1 - Math.sin(p0) / p0) * 100;
          return `Jacobian at the equilibrium: $A=${matTeX(A, 3)}$, eigenvalues $${ev.map((z) => cTeX(z, 3)).join(',\\; ')}$\n` +
            `at $\\varphi_0=${v.fix(aS.value, 0)}^\\circ$ the linear model's restoring force is off by ${v.fix(frac, 1)} % ($\\varphi_0$ vs $\\sin\\varphi_0$) · ` +
            (tDiv === null ? `the two solutions stay within 0.1 rad for the whole ${T} s` : `the two solutions first differ by 0.1 rad at $t=${v.fix(tDiv, 2)}$ s`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Model',
      name: 'Inverted pendulum on a cart',
      statement: String.raw`A cart of mass $M$ moves along a track under a horizontal force $F$ and carries a rigid pole of length $\ell$ with a point mass $m$ at its tip. With $x$ the cart position and $\theta$ the pole angle from the upward vertical (positive towards $+x$), and ignoring friction,
$$(M+m\sin^2\theta)\,\ddot x = F+m\ell\dot\theta^2\sin\theta-mg\sin\theta\cos\theta,\qquad \ell\ddot\theta=g\sin\theta-\ddot x\cos\theta .$$
With state $(x,\dot x,\theta,\dot\theta)$ and input $F$, linearising about $\theta=0$ gives $\ddot x=(F-mg\theta)/M$ and $\ddot\theta=\big((M+m)g\theta-F\big)/(M\ell)$. The eigenvalues of the linear model are $0,\,0,\,\pm\lambda$ with $\lambda=\sqrt{(M+m)g/(M\ell)}$: one of them is positive, so the upright position is **unstable**.`,
      idea: String.raw`The equations follow from Newton's laws for the cart and the pole (mech-6.10), the horizontal force balance on the whole system and the torque balance on the pole, then solving the two accelerations. The positive eigenvalue is the pole's tendency to fall, like a pencil on its tip, and it sets how quickly any tilt doubles, $\ln2/\lambda$. Accelerating the cart *towards* the side where the pole leans is the only way to push its base back underneath it. This is why balancing is a feedback task: no fixed force sequence can hold the pole up, since the tiniest error grows exponentially.`,
      caption: String.raw`Start with a tilt of $2^\circ$ and press **Push left** or **Push right** (a 0.2 s shove of the size set by the slider): the pole always tips away from where the cart is pushed. Left alone it falls at the rate set by the unstable eigenvalue (shown in the readout). Switch on the **autopilot**, a state-feedback law $F=-Kx$ whose gains are computed for the *linear* model by pole placement, and shoves no longer topple the pole, until the track ends (walls at $\pm2.4$ m) or the tilt is too large for the linear model.`,
      deps: ['ctrl-2.1', 'mech-6.10'],
      refs: ['Åström–Murray §3.1'],
      tags: ['inverted pendulum', 'instability'],
      scope: String.raw`Point-mass pole, no friction in the pivot, rigid track; the parameters are illustrative ($M=1$ kg, $m=0.3$ kg, $\ell=0.8$ m).`,
      viz(v) {
        const M0 = 1, m = 0.3, l = 0.8, g = 9.81, bF = 0.05, WALL = 2.4, DT = 0.004;
        const fS = v.slider('shove size (N)', 1, 12, 5, { step: 0.5 });
        const tiltS = v.slider('initial tilt (deg)', 0, 8, 2, { step: 0.5, onChange: () => v.restart() });
        const apT = v.toggle('autopilot: pole-placement feedback', false);
        let pushReq = [], resetReq = 0;
        v.button('Push left', () => { pushReq.push(-1); });
        v.button('Push right', () => { pushReq.push(1); });
        v.button('Reset', () => { pushReq = []; v.restart(); });
        const A = [[0, 1, 0, 0], [0, 0, -(m * g) / M0, 0], [0, 0, 0, 1], [0, 0, ((M0 + m) * g) / (M0 * l), 0]];
        const B = [0, 1 / M0, 0, -1 / (M0 * l)];
        const K = ackermann(v.M, A, B, [-2.5, -3, -3.5, -4]);
        const lam = Math.sqrt(((M0 + m) * g) / (M0 * l));
        const scene = v.stage({ x: [-3.2, 3.2], y: [-0.35, 1.35], equal: true, axes: false, height: 230, full: true });
        const tm = v.stage({ x: [0, 8], y: [-95, 95], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'tilt θ (deg)', height: 240 });
        const fm = v.stage({ x: [0, 8], y: [-2.6, 2.6], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'cart x (m)', height: 240 });
        const f = (s, F) => {
          const [, xd, th, thd] = s, sn = Math.sin(th), cs = Math.cos(th);
          const xdd = (F - bF * xd + m * l * thd * thd * sn - m * g * sn * cs) / (M0 + m * sn * sn);
          return [xd, xdd, thd, (g * sn - xdd * cs) / l];
        };
        const sim = clocked(DT, () => {
          const st = { s: [0, 0, (tiltS.value * Math.PI) / 180, 0], F: 0, push: null, fallen: false, hist: { t: [], th: [], x: [] }, k: 0 };
          return st;
        }, (st, t, dt) => {
          if (st.fallen) { st.F = 0; return; }
          while (pushReq.length) st.push = { t0: t, d: pushReq.shift() };
          let F = 0;
          if (st.push && t - st.push.t0 < 0.2) F += st.push.d * fS.value;
          const ap = apT.value ? clamp(-K.reduce((a, k, i) => a + k * st.s[i], 0), -40, 40) : 0;
          F += ap; st.F = F;
          st.s = rk4((x) => f(x, F), st.s, t, dt);
          if (Math.abs(st.s[0]) > WALL) { st.s[0] = Math.sign(st.s[0]) * WALL; st.s[1] = 0; }
          if (Math.abs(st.s[2]) > 1.45) { st.s[2] = Math.sign(st.s[2]) * 1.45; st.s[3] = 0; st.fallen = true; st.tFall = t; }
          if (st.k++ % 5 === 0) { const H = st.hist; H.t.push(t + dt); H.th.push(deg(st.s[2])); H.x.push(st.s[0]); if (H.t.length > 400) { H.t.shift(); H.th.shift(); H.x.shift(); } }
        });
        v.animate((t) => {
          const st = sim.to(t), [x, , th] = st.s, T = sim.t, H = st.hist;
          // scene
          scene.line(-3.2, 0, 3.2, 0, { color: 'ink', width: 2 });
          scene.rect(-WALL - 0.45, -0.02, -WALL - 0.3, 0.45, { fill: 'red', fillAlpha: 0.35, stroke: false });
          scene.rect(WALL + 0.3, -0.02, WALL + 0.45, 0.45, { fill: 'red', fillAlpha: 0.35, stroke: false });
          scene.rect(x - 0.38, 0.1, x + 0.38, 0.32, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 2 });
          scene.circle(x - 0.22, 0.1, 0.07, { fill: 'ink', fillAlpha: 1, stroke: false }); scene.circle(x + 0.22, 0.1, 0.07, { fill: 'ink', fillAlpha: 1, stroke: false });
          const px = x, py = 0.32, tx = px + l * Math.sin(th), ty = py + l * Math.cos(th);
          scene.line(px, py, tx, ty, { color: 'ink', width: 3.5 });
          scene.circle(tx, ty, 0.1, { fill: st.fallen ? 'red' : 'gold', fillAlpha: 1, color: 'ink', width: 1.5 });
          scene.dot(px, py, { r: 3.5, color: 'ink' });
          if (Math.abs(st.F) > 0.05) { const L = 0.1 * st.F; scene.arrow(x - 0.45 * Math.sign(st.F), 0.21, x - 0.45 * Math.sign(st.F) + L, 0.21, { color: 'green', width: 3.2, head: 9 }); }
          scene.line(0, -0.1, 0, 0.0, { color: 'faint', width: 1.2 });
          if (st.fallen) scene.text('the pole has fallen: press Reset', 0, 1.15, { size: 14, color: 'red', align: 'center', weight: 700 });
          tm.setView([Math.max(0, T - 8), Math.max(8, T)], null); fm.setView([Math.max(0, T - 8), Math.max(8, T)], null);
          tm.hline(0, { color: 'faint' }); fm.hline(0, { color: 'faint' });
          tm.clip(() => trace(tm, H.t, H.th, { color: 'accent', width: 2.2 }));
          trace(fm, H.t, H.x, { color: 'orange', width: 2.2 });
        }, { period: 600, still: 0.6 });
        v.legend([['accent', 'pole tilt θ'], ['orange', 'cart position x'], ['green', 'force on the cart']]);
        v.readout(() => {
          const st = sim.state; if (!st) return '';
          const th = st.s[2];
          return `unstable eigenvalue of the linear model: $\\lambda=\\sqrt{(M+m)g/(M\\ell)}=${v.fix(lam, 2)}\\ \\mathrm{s^{-1}}$ (tilt doubles every ${v.fix(Math.LN2 / lam, 2)} s); the other eigenvalues are $-${v.fix(lam, 2)},0,0$\n` +
            `tilt $\\theta=${v.fix(deg(th), 1)}^\\circ$, cart $x=${v.fix(st.s[0], 2)}$ m, force $F=${v.fix(st.F, 1)}$ N` + (apT.value ? ` · autopilot gains $K=(${K.map((k) => v.fix(k, 1)).join(',\\,')})$` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Model',
      name: 'DC motor',
      statement: String.raw`A permanent-magnet DC motor driven by an armature voltage $V$ is modelled by two coupled first-order equations for the armature current $i$ and the shaft speed $\omega$:
$$L\frac{di}{dt}=V-Ri-K_b\,\omega,\qquad J\frac{d\omega}{dt}=K_t\,i-b\,\omega-\tau_L,$$
with armature resistance $R$ and inductance $L$, rotor inertia $J$, viscous friction $b$, load torque $\tau_L$, and the torque and back-emf constants $K_t$ and $K_b$ ($K_t=K_b$ in SI units). In the steady state $\omega_\infty=(K_tV-R\tau_L)/(Rb+K_tK_b)$. When the electrical time constant $L/R$ is much shorter than the mechanical one, the speed behaves like a first-order system with time constant $\tau_m\approx JR/(Rb+K_tK_b)$.`,
      idea: String.raw`The motor is an electromechanical two-state system (state $(i,\omega)$, input $V$) coupling the circuit equation (circ-5.7, a series $RL$ branch) with Newton's law for rotation. The back-emf $K_b\omega$ is the feedback built into the motor: as the shaft speeds up it opposes the applied voltage, so the current spikes at the start, $i(0^+)=V/R$, and decays while the speed saturates. Eliminating $i$ when $L$ is negligible gives $\tau_m\dot\omega+\omega=K V/(\dots)$, a first-order lag.`,
      caption: String.raw`A voltage step is applied at $t=0$. The **blue** curve is the armature current, which spikes to about $V/R$ and then falls; the **orange** curve is the shaft speed, which spins up. The dashed green curve is the first-order approximation with $\tau_m=JR/(Rb+K_tK_b)$. Increase the inductance until the approximation breaks and the current overshoots; add a load torque and watch the final speed drop by $R\tau_L/(K_tK_b)$ (with $b$ small). The parameters are illustrative values of a small motor, not a particular datasheet.`,
      deps: ['ctrl-2.1', 'circ-5.7'],
      refs: ['Franklin–Powell §2.3'],
      tags: ['dc motor', 'electromechanical'],
      scope: String.raw`Linear model: constant field, no armature reaction, no brush friction or saturation of the magnetic circuit.`,
      viz(v) {
        const Kt = 0.05, b = 1e-5;
        const vS = v.slider('voltage $V$ (V)', 1, 24, 12, { step: 0.5 });
        const rS = v.slider('resistance $R$ (Ω)', 0.3, 5, 1, { step: 0.1 });
        const lS = v.slider('inductance $L$ (mH)', 0.1, 30, 0.5, { log: true, sig: 2 });
        const jS = v.slider('inertia $J$ (10⁻⁴ kg·m²)', 0.2, 5, 1, { step: 0.1 });
        const tlS = v.slider('load torque $\\tau_L$ (N·m)', 0, 0.08, 0, { step: 0.005 });
        const rot = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 260, weight: 0.7, minWidth: 200 });
        const ci = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'current i (A)', height: 260, weight: 1.2 });
        const cw = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'speed ω (rad/s)', height: 260, weight: 1.2 });
        let key = '', sol = null;
        const solve = () => {
          const R = rS.value, L = lS.value * 1e-3, J = jS.value * 1e-4, V = vS.value, TL = tlS.value;
          const k = [R, L, J, V, TL].join('|');
          if (k !== key) {
            key = k;
            const A = [[-R / L, -Kt / L], [Kt / J, -b / J]], ev = eigs(v.M, A);
            const slow = Math.min(...ev.map((z) => Math.abs(z[0])));
            const Tend = clamp(6 / slow, 0.01, 1.5), N = 600, h = Tend / N;
            // exact ZOH with input (V, −τL)
            const aug = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => (i < 2 && j < 2 ? A[i][j] * h : i === 0 && j === 2 ? (V / L) * h : i === 1 && j === 2 ? (-TL / J) * h : 0)));
            const E = v.M.expm(aug); let x = [0, 0]; const t = [], I = [], W = [], Th = []; let th = 0;
            for (let n = 0; n <= N; n++) {
              t.push(n * h); I.push(x[0]); W.push(x[1]); Th.push(th);
              const nx = [E[0][0] * x[0] + E[0][1] * x[1] + E[0][2], E[1][0] * x[0] + E[1][1] * x[1] + E[1][2]];
              th += (h * (x[1] + nx[1])) / 2; x = nx;
            }
            const winf = (Kt * V - R * TL) / (R * b + Kt * Kt), tau = (J * R) / (R * b + Kt * Kt);
            sol = { t, I, W, Th, Tend, winf, tau, ev, A, winfSim: W[N], Ipk: Math.max(...I) };
          }
          return sol;
        };
        v.animate((tt) => {
          const s = solve(), ph = tt / 5, T = ph * s.Tend, ms = 1e3;
          const Imax = Math.max(1, ...s.I) * 1.08, Wmax = Math.max(10, s.winf, ...s.W) * 1.08;
          ci.setView([0, s.Tend * ms], [Math.min(0, ...s.I) - 0.02 * Imax, Imax]); cw.setView([0, s.Tend * ms], [Math.min(0, ...s.W) - 0.02 * Wmax, Wmax]);
          ci.path(s.t.map((t, i) => [t * ms, s.I[i]]), { color: 'accent', width: 2.4 });
          cw.path(s.t.map((t, i) => [t * ms, s.W[i]]), { color: 'orange', width: 2.4 });
          cw.path(s.t.map((t) => [t * ms, s.winf * (1 - Math.exp(-t / s.tau))]), { color: 'green', width: 2, dash: [6, 4] });
          cw.hline(s.winf, { color: 'green', width: 1, alpha: 0.5 });
          ci.vline(T * ms, { color: 'gold', width: 1.5 }); cw.vline(T * ms, { color: 'gold', width: 1.5 });
          const k = Math.min(s.t.length - 1, Math.round(ph * (s.t.length - 1)));
          ci.dot(T * ms, s.I[k], { r: 5, color: 'accent' }); cw.dot(T * ms, s.W[k], { r: 5, color: 'orange' });
          // rotor in slow motion: displayed angle = true angle
          const ang = s.Th[k], R0 = 0.95;
          rot.circle(0, 0, R0 + 0.1, { color: 'muted', width: 3, fill: 'muted', fillAlpha: 0.08 });
          for (let q = 0; q < 6; q++) { const a = ang + (q * Math.PI) / 3; rot.line(0, 0, R0 * Math.cos(a), R0 * Math.sin(a), { color: q === 0 ? 'orange' : 'ink', width: q === 0 ? 4 : 2 }); }
          rot.circle(0, 0, 0.13, { fill: 'ink', fillAlpha: 1, stroke: false });
          rot.text(`${v.fix(s.W[k] * 60 / TAU, 0)} rpm`, 0, -1.28, { size: 13, color: 'orange', align: 'center', weight: 600 });
        }, { period: 5, still: 2.2 });
        v.legend([['accent', 'armature current $i$'], ['orange', 'shaft speed $\\omega$'], ['green', 'first-order approximation', { dash: true }]]);
        v.readout(() => {
          const s = solve(); if (!s) return '';
          return `steady speed: predicted $\\omega_\\infty=${v.fix(s.winf, 1)}$ rad/s, simulated ${v.fix(s.winfSim, 1)} rad/s at $t=${v.fix(s.Tend * 1e3, 0)}$ ms · mechanical time constant $\\tau_m\\approx${v.fix(s.tau * 1e3, 1)}$ ms, electrical $L/R=${v.fix((lS.value / rS.value), 2)}$ ms\n` +
            `peak current ${v.fix(s.Ipk, 1)} A (switch-on value $V/R=${v.fix(vS.value / rS.value, 1)}$ A) · eigenvalues of $A$: $${s.ev.map((z) => cTeX(z, 3)).join(',\\; ')}\\ \\mathrm{s^{-1}}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Model',
      name: 'Mass–spring–damper and its electrical twin',
      statement: String.raw`A mass $m$ on a spring $k$ and a damper $c$, whose base moves with displacement $y(t)$, obeys for the displacement $z=x-y$ of the mass relative to the base
$$m\ddot z+c\dot z+kz=-m\ddot y.$$
A series circuit with inductance $L$, resistance $R$ and capacitance $C$, driven by a voltage $v_s$, obeys for the capacitor charge $q$
$$L\ddot q+R\dot q+\frac{1}{C}q=v_s.$$
These are the **same equation** under the dictionary $m\leftrightarrow L$, $c\leftrightarrow R$, $k\leftrightarrow 1/C$, force $\leftrightarrow$ voltage, displacement $\leftrightarrow$ charge, velocity $\leftrightarrow$ current. Every result for one carries over to the other; the natural frequency $\omega_0=\sqrt{k/m}$ and damping ratio $\zeta=c/(2\sqrt{km})$ become $1/\sqrt{LC}$ and $\tfrac R2\sqrt{C/L}$.`,
      idea: String.raw`Both are second-order linear systems, whose state is a position-like variable and a velocity-like one (stored potential energy $kz^2/2$ or $q^2/2C$, stored kinetic energy $m\dot z^2/2$ or $Li^2/2$), with dissipation in the damper or the resistor. The circuit equation is Kirchhoff's voltage law (circ-6.6) and the mechanical one is Newton's second law, so one model, in state form $x=(z,\dot z)$ (ctrl-2.1), serves both. This "analogy" is how analogue computers worked and why control engineers treat the physical domain as secondary.`,
      caption: String.raw`The base of the mass–spring–damper shakes as $y=Y(1-\cos\omega t)$ (left), while the same equation is simulated for the circuit (right) with $L=m$, $R=\rho c$, $C=1/k$ and the matching source voltage. The curves of the mass's relative displacement $z$ and the charge $q$ lie on top of each other when $\rho=1$; the mismatch slider $\rho$ changes the circuit's resistance only, and the curves part. The bottom-right panel shows the amplitude of $z$ per unit shaking amplitude against frequency, the resonance near $\omega_0$ that both systems share.`,
      deps: ['ctrl-2.1', 'circ-6.6'],
      refs: ['Franklin–Powell §2.1', 'Franklin–Powell §2.2'],
      tags: ['analogy', 'second order'],
      viz(v) {
        const T = 14, N = 1400, Y = 0.12;
        const mS = v.slider('mass $m$ (kg) ↔ inductance $L$ (H)', 0.5, 3, 1, { step: 0.05 });
        const kS = v.slider('stiffness $k$ (N/m) ↔ $1/C$ (1/F)', 2, 30, 9, { step: 0.5 });
        const cS = v.slider('damping $c$ (N·s/m) ↔ $R$ (Ω)', 0, 5, 0.8, { step: 0.05 });
        const wS = v.slider('shaking frequency $\\omega$ (rad/s)', 0.5, 10, 2.4, { log: true, sig: 2 });
        const rhoS = v.slider('circuit mismatch $\\rho$ ($R=\\rho c$)', 0.4, 2.5, 1, { step: 0.05 });
        const mech = v.stage({ x: [-2.4, 2.4], y: [-0.3, 4.4], equal: true, axes: false, height: 270, weight: 0.8, minWidth: 220 });
        const circ = v.stage({ x: [-0.3, 6.3], y: [0, 3.6], equal: true, axes: false, height: 270, weight: 1, minWidth: 260 });
        const tm = v.stage({ x: [0, T], y: [-0.8, 0.8], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'z (m) and q (C)', height: 260 });
        const fr = v.stage({ x: [0.5, 10], y: [0, 3], xlog: true, axes: 'box', gutter: true, xlabel: 'ω (rad/s)', ylabel: '|z| / Y', height: 260 });
        let key = '', sol = null;
        const solve = () => {
          const m = mS.value, k = kS.value, c = cS.value, w = wS.value, rho = rhoS.value, R = rho * c, k2 = [m, k, c, w, rho].join('|');
          if (k2 !== key) {
            key = k2;
            const y = (t) => Y * (1 - Math.cos(w * t)), yd = (t) => Y * w * Math.sin(w * t);
            const mec = simulate((s, t) => [s[1], (k * (y(t) - s[0]) + c * (yd(t) - s[1])) / m], [0, 0], T, N);
            const vs = (t) => -m * w * w * Y * Math.cos(w * t), L = m, Ci = 1 / k;
            const el = simulate((s, t) => [s[1], (vs(t) - R * s[1] - s[0] / Ci) / L], [0, 0], T, N);
            const z = mec.t.map((t, i) => mec.x[i][0] - y(t)), q = el.x.map((s) => s[0]), zd = mec.t.map((t, i) => mec.x[i][1] - yd(t)), cur = el.x.map((s) => s[1]);
            let dmax = 0; for (let i = 0; i <= N; i++) dmax = Math.max(dmax, Math.abs(z[i] - q[i]));
            sol = { t: mec.t, z, q, zd, cur, y, dmax, qmax: Math.max(...q.map(Math.abs)), qph: el.x.reduce((a, s, i) => a + 0, 0) };
          }
          return sol;
        };
        v.animate((tt) => {
          const s = solve(), m = mS.value, k = kS.value, c = cS.value, w = wS.value, i = Math.round((tt / T) * N);
          const ymax = Math.max(0.25, 1.1 * Math.max(...s.z.map(Math.abs)));
          tm.setView([0, T], [-ymax, ymax]);
          tm.hline(0, { color: 'faint' });
          tm.path(s.t.map((t, j) => [t, s.z[j]]), { color: 'accent', width: 3.6, alpha: 0.9 });
          tm.path(s.t.map((t, j) => [t, s.q[j]]), { color: 'orange', width: 1.8, dash: [6, 4] });
          tm.vline(tt, { color: 'gold', width: 1.4 });
          tm.dot(tt, s.z[i], { r: 5, color: 'accent' }); tm.dot(tt, s.q[i], { r: 3.5, color: 'orange' });
          // frequency response (analytic) with the current frequency marked
          const amp = (om) => (om * om) / Math.hypot(k / m - om * om, (c * om) / m);
          fr.setView([0.5, 10], [0, Math.max(2, Math.min(12, 1.15 * Math.max(...Array.from({ length: 60 }, (_, j) => amp(0.5 * 20 ** (j / 59))))))]);
          fr.fn(amp, { color: 'accent', width: 2.2, n: 300 });
          fr.vline(Math.sqrt(k / m), { color: 'muted', dash: [4, 4], width: 1.2 });
          fr.dot(w, amp(w), { r: 6, color: 'gold' });
          fr.hline(1, { color: 'faint', dash: [3, 4] });
          // mechanical cartoon: base moves with y, mass at absolute x = z + y
          const yb = s.y(tt), xm = s.z[i] + yb, sc = 1;
          const base = 0.3 + yb * sc, top = 2.4 + xm * sc;
          mech.rect(-1.6, base - 0.28, 1.6, base, { fill: 'muted', fillAlpha: 0.4, color: 'ink', width: 2 });
          for (let q = -1.4; q <= 1.5; q += 0.35) mech.line(q, base - 0.28, q - 0.2, base - 0.5, { color: 'muted', width: 1 });
          mech.path(springPts(-0.65, base, -0.65, top, 8, 0.2), { color: 'ink', width: 1.8 });
          dashpot(mech, 0.65, base, top, { color: 'ink', w: 0.22 });
          mech.rect(-1.1, top, 1.1, top + 0.85, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 2.2 });
          mech.text(`m = ${v.fix(m, 2)} kg`, 0, top + 0.43, { size: 12.5, color: 'ink', align: 'center', baseline: 'middle' });
          mech.text('k', -1.25, (base + top) / 2, { size: 13, color: 'muted', align: 'right', math: true });
          mech.text('c', 1.0, (base + top) / 2, { size: 13, color: 'muted', align: 'left', math: true });
          mech.text('base y(t)', 0, base - 0.6, { size: 11.5, color: 'muted', align: 'center' });
          // circuit cartoon
          const wire = { color: 'ink', width: 2 };
          circ.path([[5.4, 1.85], [5.4, 3.0], [4.6, 3.0]], wire); circ.path([[3.4, 3.0], [2.8, 3.0]], wire); circ.path([[1.4, 3.0], [0.6, 3.0], [0.6, 2.15]], wire);
          circ.path([[0.6, 1.05], [0.6, 0.6], [5.4, 0.6], [5.4, 1.35]], wire);
          circ.circle(0.6, 1.6, 0.5, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 });
          circ.text('v_s', 0.6, 1.6, { size: 13, color: 'ink', align: 'center', baseline: 'middle', math: true });
          circ.path([[1.4, 3.0], [1.55, 3.28], [1.85, 2.72], [2.15, 3.28], [2.45, 2.72], [2.62, 3.0], [2.8, 3.0]], { color: 'red', width: 2.2 });
          circ.text(`R = ${v.fix(rhoS.value * cS.value, 2)} Ω`, 2.1, 3.45, { size: 11.5, color: 'red', align: 'center' });
          circ.path(Array.from({ length: 41 }, (_, j) => { const a = (j / 40) * 3.5 * TAU; return [3.4 + (1.2 * j) / 40 - 0.15 * Math.sin(a) * 0, 3.0 + 0.22 * Math.abs(Math.sin(a / 2)) * 1.0]; }), { color: 'green', width: 2.2 });
          circ.text(`L = ${v.fix(m, 2)} H`, 4.0, 3.45, { size: 11.5, color: 'green', align: 'center' });
          circ.line(5.0, 1.35, 5.8, 1.35, { color: 'ink', width: 3 }); circ.line(5.0, 1.85, 5.8, 1.85, { color: 'ink', width: 3 });
          circ.text(`C = ${v.fix(1 / k, 3)} F`, 4.9, 2.3, { size: 11.5, color: 'accent', align: 'right', baseline: 'middle' });
          circ.text(`charge q = ${v.fix(s.q[i], 3)} C`, 3.0, 1.6, { size: 12.5, color: 'orange', align: 'center', baseline: 'middle', weight: 600 });
          const loopPts = [[0.6, 2.15], [0.6, 3.0], [5.4, 3.0], [5.4, 1.85]];
          const ph = (s.q[i] * 14) % 0.6;
          flowDots(circ, [[0.6, 1.05], [0.6, 0.6], [5.4, 0.6], [5.4, 1.35]], ph, 0.6, { color: 'orange', alpha: 0.9 });
          flowDots(circ, loopPts, ph, 0.6, { color: 'orange', alpha: 0.9 });
        }, { period: T, still: 9 });
        v.legend([['accent', 'mass–spring–damper: relative displacement $z$'], ['orange', 'RLC circuit: charge $q$', { dash: true }], ['gold', 'now']]);
        v.readout(() => {
          const s = solve(); if (!s) return '';
          const m = mS.value, k = kS.value, c = cS.value;
          const w0 = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(k * m));
          return `$\\omega_0=\\sqrt{k/m}=1/\\sqrt{LC}=${v.fix(w0, 2)}$ rad/s, $\\zeta=${v.fix(zeta, 2)}$ for the mass, ${v.fix((rhoS.value * c) / (2 * Math.sqrt(k * m)), 2)} for the circuit\n` +
            `largest difference between $z(t)$ and $q(t)$ over ${T} s: $${v.sci(Math.max(s.dmax, 1e-16), 2)}$ (the curves peak at ${v.fix(s.qmax, 3)})`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Model',
      name: 'Vehicle steering: the kinematic bicycle model',
      statement: String.raw`For a car of wheelbase $\ell$ with the front wheel steered at angle $\delta$, rolling without slipping, the position $(x,y)$ of the rear axle and the heading $\theta$ obey
$$\dot x=v\cos\theta,\qquad \dot y=v\sin\theta,\qquad \dot\theta=\frac{v}{\ell}\tan\delta .$$
At constant speed $v$ and constant steering angle the car moves on a circle of radius $\rho=\ell/\tan\delta$ (curvature $\tan\delta/\ell$) whose centre lies where the lines through the two axles, perpendicular to the wheels, meet. For small angles, a step $\delta_0$ in steering from a straight run gives the heading $\theta\approx v\delta_0 t/\ell$ and the lateral displacement $y\approx v^2\delta_0t^2/(2\ell)$.`,
      idea: String.raw`Rolling without slipping means each wheel can only move along its own direction. Requiring that the velocities of the two axle midpoints are compatible with a rigid body gives one constraint, $\dot\theta=(v/\ell)\tan\delta$, since the two wheel normals must meet at the instantaneous centre of rotation. The model is nonlinear, but about the straight-line motion $\theta=0,\delta=0$ (ctrl-2.2) the lateral position is a double integrator of the steering angle, $y'' = (v^2/\ell)\,\delta$: the behaviour that makes driving a car at speed a task needing feedback.`,
      caption: String.raw`The camera follows the car as it drives straight for one second and then the steering angle is stepped to the slider value. **Slide $\delta$**, the speed $v$ and the wheelbase $\ell$: the dashed circle is the predicted path of radius $\ell/\tan\delta$ with its centre where the two grey wheel-normals cross, and the car follows it. The plot shows the lateral displacement $y(t)$ against the double-integrator approximation $v^2\delta_0(t-1)^2/2\ell$, which is good only for small turns.`,
      deps: ['ctrl-2.1'],
      refs: ['Åström–Murray ch. 3'],
      tags: ['vehicle', 'kinematics'],
      scope: String.raw`Low speed: tyres roll without sideways slip. At higher speeds and larger lateral accelerations tyre forces matter and a dynamic model is needed.`,
      viz(v) {
        const T = 9, N = 900, T0 = 1;
        const dS = v.slider('steering step $\\delta_0$ (deg)', -40, 40, 14, { step: 1 });
        const vS = v.slider('speed $v$ (m/s)', 2, 15, 6, { step: 0.5 });
        const lS = v.slider('wheelbase $\\ell$ (m)', 1.5, 4, 2.7, { step: 0.1 });
        const world = v.stage({ x: [-14, 14], y: [-8, 8], equal: true, axes: false, height: 330, weight: 1.3, minWidth: 320 });
        const tm = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'lateral displacement y (m)', height: 330 });
        let key = '', sol = null;
        const solve = () => {
          const d0 = (dS.value * Math.PI) / 180, vv = vS.value, l = lS.value, k = [d0, vv, l].join('|');
          if (k !== key) {
            key = k;
            const f = (s, t) => [vv * Math.cos(s[2]), vv * Math.sin(s[2]), (vv / l) * Math.tan(t >= T0 ? d0 : 0)];
            const tr = simulate(f, [0, 0, 0], T, N);
            sol = { tr, d0, vv, l, lin: (t) => (t < T0 ? 0 : (vv * vv * d0 * (t - T0) ** 2) / (2 * l)) };
          }
          return sol;
        };
        v.animate((tt) => {
          const s = solve(), st = at(s.tr, tt), [cx, cy, th] = st, d = tt >= T0 ? s.d0 : 0, l = s.l;
          world.setView([cx - 14, cx + 14], [cy - 8, cy + 8]);
          // grid of ground marks so the motion is visible
          for (let gx = Math.floor((cx - 16) / 4) * 4; gx < cx + 16; gx += 4) for (let gy = Math.floor((cy - 10) / 4) * 4; gy < cy + 10; gy += 4) world.dot(gx, gy, { r: 1.5, color: 'faint' });
          const k = Math.round((tt / T) * N);
          world.path(s.tr.x.slice(0, k + 1).map((p) => [p[0], p[1]]), { color: 'gold', width: 2.6 });
          const ct = Math.cos(th), sn = Math.sin(th), P = (a, b) => [cx + a * ct - b * sn, cy + a * sn + b * ct];
          const bodyL = -0.9, bodyR = l + 0.9, bw = 0.9;
          world.poly([P(bodyL, -bw), P(bodyR, -bw), P(bodyR, bw), P(bodyL, bw)], { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          const wheel = (px, py, ang, col) => { const cA = Math.cos(th + ang), sA = Math.sin(th + ang), c0 = P(px, py), a = 0.42, b = 0.13; world.poly([[c0[0] - a * cA - b * -sA, c0[1] - a * sA - b * cA], [c0[0] + a * cA - b * -sA, c0[1] + a * sA - b * cA], [c0[0] + a * cA + b * -sA, c0[1] + a * sA + b * cA], [c0[0] - a * cA + b * -sA, c0[1] - a * sA + b * cA]], { fill: col, fillAlpha: 0.95, color: col }); };
          wheel(0, -bw, 0, 'ink'); wheel(0, bw, 0, 'ink'); wheel(l, -bw, d, 'orange'); wheel(l, bw, d, 'orange');
          world.line(...P(0, 0), ...P(l, 0), { color: 'ink', width: 2.2 });
          world.dot(...P(0, 0), { r: 4, color: 'ink' });
          if (Math.abs(Math.tan(d)) > 1e-3) {
            const rho = l / Math.tan(d), O = P(0, rho);
            world.curve((a) => [O[0] + Math.abs(rho) * Math.cos(a), O[1] + Math.abs(rho) * Math.sin(a)], 0, TAU, { color: 'green', width: 1.5, dash: [6, 5], n: 120 });
            world.line(...P(0, 0), ...O, { color: 'muted', width: 1.4, dash: [3, 4] });
            world.line(...P(l, 0), ...O, { color: 'muted', width: 1.4, dash: [3, 4] });
            world.dot(O[0], O[1], { r: 4.5, color: 'green' });
          }
          // plot
          const ymax = Math.max(2, 1.1 * Math.max(...s.tr.x.map((p) => Math.abs(p[1]))));
          tm.setView([0, T], [-ymax, ymax]); tm.hline(0, { color: 'faint' });
          tm.clip(() => { tm.fn(s.lin, { color: 'orange', width: 2, dash: [6, 4], n: 200 }); });
          tm.path(s.tr.t.map((t, i) => [t, s.tr.x[i][1]]), { color: 'accent', width: 2.4 });
          tm.vline(T0, { color: 'faint', dash: [3, 4] }); tm.vline(tt, { color: 'gold', width: 1.4 });
          tm.dot(tt, cy, { r: 5, color: 'accent' });
          tm.text('steering applied', T0 + 0.1, ymax * 0.9, { size: 11, color: 'muted', align: 'left' });
        }, { period: T, still: 6.5 });
        v.legend([['accent', 'lateral displacement $y(t)$ (exact model)'], ['orange', 'double-integrator approximation', { dash: true }], ['green', 'predicted circle, radius $\\ell/\\tan\\delta$', { dash: true }]]);
        v.readout(() => {
          const s = solve(); if (!s) return '';
          const tn = Math.tan(s.d0), kap = tn / s.l, rho = Math.abs(kap) > 1e-9 ? 1 / Math.abs(kap) : Infinity;
          const th = s.tr.x[N][2] - s.tr.x[Math.round((T0 / T) * N)][2], meas = th / (T - T0), pred = s.vv * kap;
          return `curvature $\\tan\\delta_0/\\ell=${v.fix(kap, 4)}$ m$^{-1}$, turning radius ${Number.isFinite(rho) ? v.fix(rho, 1) + ' m' : '∞'} · yaw rate: model $v\\tan\\delta_0/\\ell=${v.fix(pred, 3)}$ rad/s, measured on the simulated path ${v.fix(meas, 3)} rad/s\n` +
            `lateral acceleration $v^2\\kappa=${v.fix(s.vv * s.vv * Math.abs(kap), 2)}$ m/s² (${v.fix((s.vv * s.vv * Math.abs(kap)) / 9.81, 2)} g)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Transfer function of a state-space model',
      statement: String.raw`For the linear system $\dot x=Ax+Bu,\ y=Cx+Du$ with $x(0)=0$, the Laplace transforms of input and output are related by $Y(s)=G(s)U(s)$ with
$$G(s)=C(sI-A)^{-1}B+D=\frac{C\,\mathrm{adj}(sI-A)\,B+D\det(sI-A)}{\det(sI-A)}.$$
$G$ is a proper rational function (strictly proper if $D=0$). Its denominator divides $\det(sI-A)$, so every **pole** of $G$ is an eigenvalue of $A$. Equality holds, with no pole lost, when there is no pole–zero cancellation, that is, when $(A,B)$ is controllable and $(C,A)$ is observable. A change of state coordinates does not change $G$.`,
      idea: String.raw`Transform $\dot x=Ax+Bu$ with $x(0)=0$ to get $(sI-A)X=BU$, solve for $X=(sI-A)^{-1}BU$ and substitute into $Y=CX+DU$. The inverse of a matrix is its adjugate over its determinant (sig-9.6 for the Laplace transform of a derivative). The determinant of $sI-A$ is the characteristic polynomial, whose roots are the eigenvalues. A mode that the input cannot excite or the output cannot see drops out of $G$, which is why the input–output description can be simpler than the state one.`,
      caption: String.raw`A second-order system with matrices you can edit. The left panel is the $s$-plane: red crosses are the poles of $G$, hollow green dots its zeros, and the large gold rings the eigenvalues of $A$; they sit on the crosses. The right panel overlays the step response of $G(s)$ (computed from the transfer function alone) on a direct numerical simulation of $\dot x=Ax+Bu$. The preset *cancellation* makes a zero land on a pole: the mode with eigenvalue $-3$ is still an eigenvalue of $A$ but invisible in $G$ (a gold ring with no cross).`,
      deps: ['ctrl-2.1', 'sig-9.6'],
      refs: ['Åström–Murray §9.2', 'Franklin–Powell §7.4'],
      tags: ['transfer function', 'laplace'],
      viz(v) {
        const T = 10, N = 1000;
        const PRE = {
          msd: { label: 'mass–spring–damper', a: [0, 1, -4, -0.8], b: [0, 1], c: [1, 0], d: 0 },
          lead: { label: 'two real poles', a: [-1, 0, 1, -3], b: [1, 0], c: [0, 1], d: 0 },
          unst: { label: 'unstable, with a zero', a: [0.3, 1, -1, 0.1], b: [0, 1], c: [1, -0.5], d: 0 },
          canc: { label: 'cancellation', a: [-1, 0, 0, -3], b: [1, 1], c: [1, 0], d: 0 },
        };
        const names = ['a11', 'a12', 'a21', 'a22'], cn = ['b1', 'b2', 'c1', 'c2'];
        const sl = [], pre0 = PRE.msd;
        const load = (p) => { [...p.a].forEach((x, i) => sl[i].set(x)); [...p.b, ...p.c].forEach((x, i) => sl[4 + i].set(x)); dT.value = !!p.d; };
        const preS = v.select('preset', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'msd', { onChange: (k) => load(PRE[k]) });
        const tex = ['a_{11}', 'a_{12}', 'a_{21}', 'a_{22}', 'b_1', 'b_2', 'c_1', 'c_2'], init = [...pre0.a, ...pre0.b, ...pre0.c];
        tex.forEach((t, i) => sl.push(v.slider(`$${t}$`, -4, 4, init[i], { step: 0.1 })));
        const dT = v.toggle('feedthrough $D=1$', false);
        const sp = v.stage({ x: [-5, 3], y: [-3.5, 3.5], equal: true, axes: true, height: 340, xlabel: 'Re s', ylabel: 'Im s', title: '$s$-plane' });
        const st = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response y', height: 340 });
        let key = '', S = null;
        const solve = () => {
          const w = sl.map((q) => q.value), D = dT.value ? 1 : 0, k = w.join('|') + D;
          if (k !== key) {
            key = k;
            const [a11, a12, a21, a22, b1, b2, c1, c2] = w, A = [[a11, a12], [a21, a22]], tr = a11 + a22, det = a11 * a22 - a12 * a21;
            const num0 = -c1 * b1 * a22 + c1 * b2 * a12 + c2 * b1 * a21 - c2 * b2 * a11, num1 = c1 * b1 + c2 * b2;
            const den = [det, -tr, 1], num = [num0 + D * den[0], num1 + D * den[1], D * den[2]];
            const G = tf(num, den), poles = proots(v.M, ptrim(den)), zeros = proots(v.M, ptrim(num)), ev = eigs(v.M, A);
            const ex = stepExact(v.M, G, T, N);
            const sim = simulate((x) => [a11 * x[0] + a12 * x[1] + b1, a21 * x[0] + a22 * x[1] + b2], [0, 0], T, N);
            const ysim = sim.x.map((x) => c1 * x[0] + c2 * x[1] + D);
            let dmax = 0; for (let i = 0; i <= N; i++) dmax = Math.max(dmax, Math.abs(ex.y[i] - ysim[i]));
            S = { G, poles, zeros, ev, ex, ysim, dmax, A, B: [[b1], [b2]], C: [[c1, c2]], D };
          }
          return S;
        };
        v.render(() => {
          const s = solve(), all = [...s.poles, ...s.zeros, ...s.ev];
          const R = Math.max(3, ...all.map((z) => Math.abs(z[0]) + 0.6), ...all.map((z) => Math.abs(z[1]) + 0.6)) * 1.0;
          sp.setView([-R * 1.35, R * 0.75], [-R, R]);
          sp.vline(0, { color: 'faint' });
          for (const z of s.ev) sp.dot(z[0], z[1], { r: 12, hollow: true, color: 'gold', width: 3 });
          for (const z of s.poles) xMark(sp, z[0], z[1], { color: 'red', r: 5.5 });
          for (const z of s.zeros) sp.dot(z[0], z[1], { r: 6, hollow: true, color: 'green' });
          const ys = s.ex.y.concat(s.ysim), lo = Math.min(0, ...ys), hi = Math.max(0.1, ...ys), pad = 0.08 * (hi - lo);
          const big = Math.max(Math.abs(lo), Math.abs(hi)) > 40;
          st.setView([0, T], big ? [-5, 5] : [lo - pad, hi + pad]);
          st.hline(0, { color: 'faint' });
          st.clip(() => {
            trace(st, s.ex.t, s.ex.y, { color: 'accent', width: 4, alpha: 0.9 });
            trace(st, s.ex.t, s.ysim, { color: 'orange', width: 1.8, dash: [6, 4] });
          });
        });
        v.legend([['accent', 'step response of $G(s)$'], ['orange', 'simulation of $\\dot x=Ax+Bu$', { dash: true }], ['red', 'poles of $G$'], ['green', 'zeros of $G$'], ['gold', 'eigenvalues of $A$']]);
        v.readout(() => {
          const s = solve(), cancel = s.ev.filter((e) => !s.poles.some((p) => Math.hypot(p[0] - e[0], p[1] - e[1]) < 1e-5));
          return `$G(s)=${tfTeX(s.G)}$\n` +
            `eigenvalues of $A$: $${s.ev.map((z) => cTeX(z, 3)).join(',\\; ')}$ · poles of $G$: $${s.poles.length ? s.poles.map((z) => cTeX(z, 3)).join(',\\; ') : '\\text{none}'}$` +
            (cancel.length ? ` — the eigenvalue $${cancel.map((z) => cTeX(z, 3)).join(',\\; ')}$ cancels against a zero and does not appear in $G$` : ' (they coincide)') +
            ` · largest gap between the two step responses: ${v.sci ? '$' + v.sci(Math.max(s.dmax, 1e-16), 2) + '$' : v.fix(s.dmax, 8)}`;
        });
        void names; void cn;
      },
    },
  ],
};
