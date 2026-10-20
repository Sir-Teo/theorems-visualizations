// Robotics — Chapter 4: Velocity kinematics and statics
import {
  TAU, DEG, clamp, vadd, vsub, vsc, dot3, cross3, norm3, I3, mm, mt, mcol, Ry, Rz,
  mkT, Rof, pof, Tmul, Tinv, Tapply, Ttrans, Trot, adjoint, mv6, twistAt,
  drawFrame, fx, bmat,
  wrapPi, unwrapTo, planarFK, planarJ, ik2R, svd2xn, ellipsePts,
  ARM4, arm4Pose, spaceJ, bodyJ, ARM6, fk6, ik6, pathJoints,
} from './ch04.shared.js';

const cn = (x, d = 2) => fx(x, d).replace('-', '−');
const g3 = (a, d = 2) => `(${a.map((x) => cn(x, d)).join(',')})`;
const JC = ['accent', 'orange', 'purple', 'teal', 'pink', 'gold'];

/** Draw the 4-joint spatial arm used by 4.1 on a scene3 `sc` (between begin() and flush()). */
function drawArm4(sc, pose, st = {}) {
  const [o1, o2, o3, o4] = pose.origins;
  sc.line([0, 0, 0], o2, { color: 'muted', width: 7 });
  sc.line(o2, o3, { color: 'accent', width: 7, alpha: 0.85 });
  sc.line(o3, o4, { color: 'orange', width: 7, alpha: 0.85 });
  sc.line(o4, pose.tip, { color: 'muted', width: 5 });
  void o1; void st;
}

export default {
  collection: 'robot',
  chapter: 4,
  title: 'Velocity kinematics and statics',
  summary: String.raw`The Jacobian maps joint velocities to end-effector twists, and its transpose maps end-effector wrenches back to joint torques — the same matrix governs motion and force. Where the Jacobian loses rank the robot is singular: it cannot move in some direction and can resist any force in it with no torque at all. The singular value decomposition of the Jacobian turns these facts into ellipsoids that show at a glance how easily the robot moves and pushes, and a robot with more joints than the task needs can move its joints without moving its hand.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'The manipulator Jacobian (space and body)',
      statement: String.raw`Let an open chain with joint values $\theta\in\R^n$ have forward kinematics $T(\theta)=e^{[\mathcal S_1]\theta_1}\cdots e^{[\mathcal S_n]\theta_n}M$ (3.1). The **space Jacobian** $J_s(\theta)\in\R^{6\times n}$ is the matrix that sends joint rates to the end-effector twist written in the fixed frame, $\mathcal V_s=J_s(\theta)\,\dot\theta$, where $[\mathcal V_s]=\dot T T^{-1}$. Its columns are
$$J_{s1}=\mathcal S_1,\qquad J_{si}=\mathrm{Ad}_{\,e^{[\mathcal S_1]\theta_1}\cdots e^{[\mathcal S_{i-1}]\theta_{i-1}}}\,\mathcal S_i\quad(i\ge 2),$$
the screw axis of joint $i$ **as it currently lies in space**. The **body Jacobian** gives the twist in the end-effector frame, $\mathcal V_b=J_b(\theta)\dot\theta$ with $[\mathcal V_b]=T^{-1}\dot T$, and the two are related by $J_b=\mathrm{Ad}_{T^{-1}}J_s$. A twist is $\mathcal V=(\omega,v)$, with $v$ the velocity of the point of the body currently at the origin, so a point $p$ of the end-effector moves with $\dot p=v_s+\omega_s\times p$. Equivalently, $J$ is the matrix of partial derivatives of the pose with respect to the joint values, in the sense of pma-9.17.`,
      idea: String.raw`Differentiate the product of exponentials. Only the factor $e^{[\mathcal S_i]\theta_i}$ depends on $\theta_i$, and $\partial_\theta e^{[\mathcal S]\theta}=[\mathcal S]e^{[\mathcal S]\theta}$, so $\dot T T^{-1}=\sum_i T_{i-1}[\mathcal S_i]T_{i-1}^{-1}\dot\theta_i$ with $T_{i-1}=e^{[\mathcal S_1]\theta_1}\cdots e^{[\mathcal S_{i-1}]\theta_{i-1}}$. The conjugation $T_{i-1}[\mathcal S_i]T_{i-1}^{-1}$ is exactly $[\mathrm{Ad}_{T_{i-1}}\mathcal S_i]$ (2.9), which is the stated column. Twists add, so velocities of the joints add: the hand's twist is the sum of what each joint would do alone. Re-expressing a twist in the hand frame is one more application of the adjoint map.

Regard the entries of the smooth pose matrix as a map into $\R^{16}$ and compose it with the differentiable joint curve $t\mapsto\theta(t)$. The chain rule pma-9.15 gives $\dot T=\sum_i(\partial T/\partial\theta_i)\dot\theta_i$; multiplying this derivative by $T^{-1}$ on the appropriate side converts it into the space or body twist, yielding the Jacobian columns.`,
      caption: String.raw`Four joints (base turn and three pitch joints); the coloured lines are their **current** axes. The sliders $\theta_1,\dots,\theta_4$ set the posture; the sliders $\dot\theta_i$ set the joint rates. Each coloured arrow at the tool is the tool velocity if only that joint moved (a scaled column of the Jacobian, $\omega_i\times(p-q_i)$), laid head to tail, and the gold arrow is their sum, which is the tool velocity $J\dot\theta$. The readout compares it with a finite difference of the forward kinematics, shows $J_s$ or $J_b$ (switch above), and checks $\mathcal V_s=\mathrm{Ad}_T\mathcal V_b$.`,
      deps: ['robot-3.1', 'pma-9.17', 'robot-2.9', 'pma-9.15'],
      refs: ['Lynch–Park §5.1', 'Siciliano ch. 3'],
      tags: ['Jacobian', 'twist', 'velocity kinematics'],
      credit: 'Resolved-rate control with the Jacobian: Whitney, 1969',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jacobian_matrix_and_determinant' },
      viz(v) {
        const names = ['base turn $\\theta_1$ (°)', 'shoulder $\\theta_2$ (°)', 'elbow $\\theta_3$ (°)', 'wrist $\\theta_4$ (°)'];
        const init = [30, 40, -70, 35];
        const ths = init.map((x, i) => v.slider(names[i], i === 0 ? -180 : -120, i === 0 ? 180 : 120, x, { step: 1 }));
        const rinit = [0.6, 0.5, -0.4, 0.5];
        const rs = rinit.map((x, i) => v.slider(`rate $\\dot\\theta_${i + 1}$`, -1, 1, x, { step: 0.05 }));
        const which = v.select('Jacobian shown', [{ value: 's', label: 'space $J_s$' }, { value: 'b', label: 'body $J_b$' }], 's');
        const SG = v.stage({ x: [-2.0, 2.0], y: [-0.9, 2.6], equal: true, axes: false, height: 430, title: 'joint axes and the columns of the Jacobian' });
        const sc = v.scene3(SG, { yaw: -0.85, pitch: 0.3, axes: false, lim: 1.5, axis: 1.2 });
        let st = null;
        const K = 0.7;
        v.render(() => {
          const th = ths.map((s) => s.value * DEG), qd = rs.map((s) => s.value);
          const pose = arm4Pose(th), Js = spaceJ(pose.S, th), Jb = bodyJ(Js, pose.T);
          const tip = pose.tip;
          // column velocities of the tool point
          const cols = [0, 1, 2, 3].map((i) => twistAt(Js.map((r) => r[i]), tip));
          const Vs = Js.map((r) => r.reduce((s, a, j) => s + a * qd[j], 0));
          const vTip = twistAt(Vs, tip);
          // finite-difference check
          const h = 1e-5, fd = (sg) => arm4Pose(th.map((t, i) => t + sg * h * qd[i])).tip;
          const vfd = vsc(vsub(fd(1), fd(-1)), 1 / (2 * h));
          const Vb = Jb.map((r) => r.reduce((s, a, j) => s + a * qd[j], 0));
          const back = mv6(adjoint(pose.T), Vb);
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.4 * Math.cos(t), 0.4 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false });
          drawArm4(sc, pose);
          pose.origins.forEach((o, i) => {
            const a = pose.axes[i];
            sc.line(vsub(o, vsc(a, 0.4)), vadd(o, vsc(a, 0.4)), { color: JC[i], width: 2.6 });
            sc.tex(`\\theta_${i + 1}`, vadd(o, vsc(a, 0.55)), { color: JC[i], size: 12 });
          });
          drawFrame(sc, I3(), [0, 0, 0], 0.45, { width: 1.6, alpha: 0.7, color: 'muted' });
          drawFrame(sc, Rof(pose.T), tip, 0.3, { width: 3 });
          let cur = tip;
          cols.forEach((c, i) => {
            const e = vadd(cur, vsc(c, K * qd[i]));
            if (Math.abs(qd[i]) > 1e-9) sc.arrow(cur, e, { color: JC[i], width: 3.2 });
            cur = e;
          });
          sc.arrow(tip, vadd(tip, vsc(vTip, K)), { color: 'gold', width: 4.5 });
          sc.dot(tip, { color: 'gold', r: 6 });
          sc.flush();
          st = { Js, Jb, Vs, vTip, errFD: norm3(vsub(vTip, vfd)), errAd: Math.hypot(...Vs.map((x, i) => x - back[i])), speed: norm3(vTip) };
        });
        v.readout(() => {
          if (!st) return '';
          const J = which.value === 's' ? st.Js : st.Jb;
          return `$J_${which.value}=${bmat(J)}$ (rows: $\\omega_x,\\omega_y,\\omega_z,v_x,v_y,v_z$).\nTwist $J_s\\dot\\theta=${g3(st.Vs)}$ — the tool point moves at $\\dot p=${g3(st.vTip)}$ (speed ${fx(st.speed, 3)}); the finite difference of $T(\\theta)$ differs by $${v.sci(st.errFD + 1e-17, 1)}$. Converting the body twist back, $\\|\\mathcal V_s-\\mathrm{Ad}_T\\mathcal V_b\\|=${v.sci(st.errAd + 1e-17, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Statics: τ = Jᵀ F',
      statement: String.raw`Let a serial arm be in static equilibrium at joint values $\theta$, with the end-effector pushing on the world (or the world pushing on it) with a wrench $\mathcal F$ expressed in the same frame as the Jacobian $J(\theta)$ of 4.1, so that $\mathcal V=J\dot\theta$ is the matching twist and $\mathcal F\cdot\mathcal V$ is the power. Then the joint torques (or forces) $\tau\in\R^n$ that balance $\mathcal F$ are
$$\tau=J(\theta)^{\mathsf T}\,\mathcal F .$$
In particular, if $J$ loses rank, there are wrenches $\mathcal F\neq0$ in the left null space of $J$ with $\tau=0$: the arm resists them with no joint effort at all. Friction, gravity and inertia are ignored (they are added to $\tau$ separately).`,
      idea: String.raw`Virtual work. Give the joints a tiny displacement $\delta\theta$; the end-effector moves by the twist $J\,\delta\theta$. For the arm to stay in equilibrium the work done by the joints, $\tau\cdot\delta\theta$, must equal the work done against the load, $\mathcal F\cdot(J\delta\theta)=(J^{\mathsf T}\mathcal F)\cdot\delta\theta$ (the power pairing of 2.10 and d'Alembert's principle, mech-6.4). This holds for every $\delta\theta$, hence $\tau=J^{\mathsf T}\mathcal F$. So motion and force are governed by the same matrix: $J$ maps rates to velocities, $J^{\mathsf T}$ maps wrenches to torques.

The defining identity for the adjoint in ladr-7.1, in the real Euclidean joint and task spaces, is exactly the virtual-work equality used here: $\langle J\delta\theta,F\rangle=\langle\delta\theta,J^{\mathsf T}F\rangle$. Testing every virtual joint displacement determines the torque vector uniquely, which is why the force map uses the transpose rather than the velocity map $J$.`,
      caption: String.raw`Drag the gold handle to push on the tool with a force $F$ (orange arrow) and use the slider $m$ for a pure moment on the tool; set the arm with the joint sliders. The bars show the joint torques needed to hold the load, $\tau=J^{\mathsf T}(m,F_x,F_y)$. The dashed arm is a **virtual displacement** $\delta\theta$ of size $\varepsilon$ (along $\tau$, or in a fixed direction, as you choose): the readout compares the work of the load, $F\cdot\delta x+m\,\delta\phi$, with $\tau\cdot\delta\theta$; they agree to first order and the gap shrinks as you make $\varepsilon$ smaller. Straighten the $2$R arm and push along it: the torques vanish.`,
      deps: ['robot-4.1', 'robot-2.10', 'mech-6.4', 'ladr-7.1'],
      refs: ['Lynch–Park §5.2'],
      tags: ['statics', 'virtual work', 'Jacobian transpose'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Principle_of_virtual_work' },
      viz(v) {
        const mode = v.select('arm', [{ value: '2', label: '2R' }, { value: '3', label: '3R' }], '3');
        const t1 = v.slider('$\\theta_1$ (°)', -180, 180, 40, { step: 1 }), t2 = v.slider('$\\theta_2$ (°)', -170, 170, 70, { step: 1 }), t3 = v.slider('$\\theta_3$ (°)', -170, 170, -50, { step: 1 });
        const mom = v.slider('tip moment $m$', -1, 1, 0, { step: 0.05 });
        const eps = v.slider('virtual displacement $\\varepsilon$ (rad)', 0.005, 0.4, 0.1, { log: true, sig: 2 });
        const along = v.toggle('displace along $\\tau$ (otherwise in a fixed direction)', true);
        const A = v.stage({ x: [-3.6, 3.6], y: [-3.0, 3.7], equal: true, axes: false, height: 400, title: 'the arm, a tip force, and a virtual displacement' });
        const B = v.stage({ x: [0.4, 3.6], y: [-6, 6], axes: 'box', gutter: true, xticks: [[1, 'τ₁'], [2, 'τ₂'], [3, 'τ₃']], ylabel: 'torque', height: 400, minWidth: 240, title: 'joint torques τ = Jᵀ F' });
        const L = [1.2, 0.9, 0.7];
        let F = [0.8, 0.9], tipNow = [1, 1];
        const hF = A.handle(1, 1, { color: 'orange', r: 8, label: 'F' });
        hF.constrain = (x, y) => {
          let fxv = x - tipNow[0], fyv = y - tipNow[1]; const n = Math.hypot(fxv, fyv);
          if (n > 1.3) { fxv *= 1.3 / n; fyv *= 1.3 / n; }
          F = [fxv, fyv]; return [tipNow[0] + fxv, tipNow[1] + fyv];
        };
        let st = null;
        v.render(() => {
          const n = +mode.value;
          t3.el.hidden = n < 3;
          const th = [t1.value * DEG, t2.value * DEG, t3.value * DEG].slice(0, n), Ls = L.slice(0, n);
          const fk = planarFK(Ls, th), J = planarJ(Ls, th);
          tipNow = fk.tip; hF.set(fk.tip[0] + F[0], fk.tip[1] + F[1]);
          const W = [mom.value, F[0], F[1]];
          // J_full rows: angular (all ones), x, y
          const Jf = [new Array(n).fill(1), J[0], J[1]];
          const tau = th.map((_, j) => W[0] * Jf[0][j] + W[1] * Jf[1][j] + W[2] * Jf[2][j]);
          // virtual displacement
          const nt = Math.hypot(...tau), base = along.value && nt > 1e-6 ? tau.map((x) => x / nt) : (n === 3 ? [0.62, -0.55, 0.56] : [0.78, -0.63]), dir = base.map((x) => x * eps.value);
          const th2 = th.map((q, i) => q + dir[i]), fk2 = planarFK(Ls, th2);
          const dx = [fk2.tip[0] - fk.tip[0], fk2.tip[1] - fk.tip[1]], dphi = fk2.phi - fk.phi;
          const workLoad = F[0] * dx[0] + F[1] * dx[1] + mom.value * dphi, workJoint = tau.reduce((s, t, i) => s + t * dir[i], 0);
          // draw arm
          fk.pts.forEach((p, i) => { if (i < n) A.segment(p, fk.pts[i + 1], { color: JC[i], width: 7, alpha: 0.85 }); });
          A.path(fk2.pts, { color: 'muted', width: 2, dash: [5, 4] });
          fk.pts.forEach((p) => A.circle(p[0], p[1], 0.07, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
          A.arrow(fk.tip[0], fk.tip[1], fk.tip[0] + F[0], fk.tip[1] + F[1], { color: 'orange', width: 4, head: 11 });
          if (Math.abs(mom.value) > 0.02) {
            const pts = [], a0 = 0.4, sg = Math.sign(mom.value);
            for (let k = 0; k <= 20; k++) { const a = a0 + sg * (k / 20) * 4.2 - (sg < 0 ? 0 : 0); pts.push([fk.tip[0] + 0.32 * Math.cos(a), fk.tip[1] + 0.32 * Math.sin(a)]); }
            A.path(pts, { color: 'red', width: 2.5 });
            const e = pts[20], p = pts[19]; A.arrow(p[0], p[1], e[0] + (e[0] - p[0]) * 0.3, e[1] + (e[1] - p[1]) * 0.3, { color: 'red', width: 2.5, head: 8 });
          }
          A.dot(fk.tip[0], fk.tip[1], { color: 'gold', r: 6 });
          B.bars(tau, { x0: 1, dx: 1, color: (_, i) => JC[i] });
          B.hline(0, { color: 'muted' });
          tau.forEach((t, i) => B.text(cn(t, 2), i + 1, t >= 0 ? t + 0.5 : t - 0.55, { size: 12, color: 'ink', align: 'center' }));
          st = { tau, workLoad, workJoint, n, Fn: Math.hypot(F[0], F[1]), sing: n === 2 && Math.abs(Math.sin(th[1])) < 0.03 };
        });
        v.readout(() => {
          if (!st) return '';
          const rel = Math.abs(st.workLoad - st.workJoint) / Math.max(1e-9, Math.abs(st.workJoint), Math.abs(st.workLoad));
          return `$\\tau=J^{\\mathsf T}\\mathcal F=(${st.tau.map((x) => cn(x, 2)).join(',\\;')})$ for $F=${g3(F)}$, $m=${cn(mom.value, 2)}$.\nVirtual work for $\\delta\\theta$ of size $\\varepsilon=${fx(eps.value, 3)}$: load $${cn(st.workLoad, 4)}$, joints $\\tau\\cdot\\delta\\theta=${cn(st.workJoint, 4)}$ (relative gap $${v.sci(rel + 1e-17, 1)}$, shrinking in proportion to $\\varepsilon$).${st.sing ? ' **Singular posture:** a force along the arm needs no torque.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Kinematic singularities',
      statement: String.raw`A joint configuration $\theta$ of a serial arm is a **kinematic singularity** when the Jacobian $J(\theta)$ of 4.1 has rank less than its maximum possible value $\min(6,n)$ (for a square Jacobian: $\det J(\theta)=0$). There the set of tool twists obtainable with joint rates $\dot\theta$ is a proper subspace: the end-effector cannot move instantaneously in some directions however fast the joints move; conversely the joint rates needed for a twist near that subspace grow without bound, and by 4.2 the arm can resist some wrenches with $\tau=0$. For the planar $2$R arm with link lengths $\ell_1,\ell_2$ the tip Jacobian has
$$\det J=\ell_1\ell_2\sin\theta_2,$$
so the singularities are the stretched ($\theta_2=0$) and folded ($\theta_2=\pi$) postures, independent of $\theta_1$.`,
      idea: String.raw`The Jacobian is a linear map from $\R^n$ to the space of twists; by the fundamental theorem of linear maps (ladr-3.21) its range has dimension $n-\dim\ker J$, which drops exactly when $J$ loses rank. For the $2$R arm the two columns are $\hat z\times(p-q_1)$ and $\hat z\times(p-q_2)$, the tip velocities produced by turning each joint alone, each perpendicular to the line from its joint to the tip. They are parallel exactly when the elbow lies on the line from the shoulder to the tip, i.e. when the arm is stretched or folded, and then $\det J=0$.

For a square Jacobian, ladr-9.50 equates a nonzero determinant with invertibility. Thus the displayed determinant vanishes exactly when a square task map cannot send joint rates bijectively onto task velocities; for a rectangular Jacobian one must use rank instead of a nonexistent determinant.`,
      caption: String.raw`Drag the gold tool handle (or the sliders). The two arrows at the tool are the columns of $J$ and the shaded parallelogram is every tip velocity reachable with joint rates in $[-1,1]$: it collapses onto a line when the arm straightens. The first plot shows $\det J=\ell_1\ell_2\sin\theta_2$; the second shows the joint speed $\|\dot\theta\|$ needed to move the tool at unit speed in the direction $\psi$ (gold arrow), which explodes near $\theta_2=0$ unless the direction lies along the remaining free direction. Try $\psi$ along the arm and perpendicular to it.`,
      deps: ['robot-4.1', 'ladr-3.21', 'ladr-9.50'],
      refs: ['Lynch–Park §5.3'],
      tags: ['singularity', 'rank', 'Jacobian'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mechanical_singularity' },
      viz(v) {
        const l1 = 1.3, l2 = 1.0;
        const s1 = v.slider('$\\theta_1$ (°)', -180, 180, 35, { step: 1 }), s2 = v.slider('$\\theta_2$ (°)', -175, 175, 70, { step: 1 });
        const psi = v.slider('desired tool direction $\\psi$ (°)', -180, 180, 20, { step: 1 });
        const A = v.stage({ x: [-3.2, 3.2], y: [-2.0, 2.9], equal: true, axes: false, height: 360, full: true, title: 'a 2R arm and its Jacobian columns' });
        const B = v.stage({ x: [-180, 180], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 'θ₂ (°)', ylabel: 'det J / (ℓ₁ℓ₂)', xticks: [-180, -90, 0, 90, 180], height: 240, minWidth: 250, title: 'determinant of J' });
        const C = v.stage({ x: [-180, 180], y: [0, 8], axes: 'box', gutter: true, xlabel: 'θ₂ (°)', ylabel: '‖θ̇‖ needed', xticks: [-180, -90, 0, 90, 180], height: 240, minWidth: 250, title: 'joint speed to move at unit speed in direction ψ' });
        const hT = A.handle(1, 1, { color: 'gold', r: 8, label: 'tool' });
        hT.constrain = (x, y) => {
          const r = Math.hypot(x, y), rr = clamp(r, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3), k = r < 1e-9 ? 1 : rr / r;
          x *= k; y *= k;
          const sol = ik2R(l1, l2, x, y);
          if (sol) { const b = s2.value >= 0 ? 0 : 1; s1.set(sol[b][0] / DEG); s2.set(sol[b][1] / DEG); }
          return [x, y];
        };
        const speedFor = (a1, a2, ang) => {
          const J = planarJ([l1, l2], [a1, a2]), u = [Math.cos(ang), Math.sin(ang)];
          // J^+ u via the 2×2 inverse, regularised only for display
          const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
          const inv = [[J[1][1], -J[0][1]], [-J[1][0], J[0][0]]].map((r) => r.map((x) => x / det));
          const q = [inv[0][0] * u[0] + inv[0][1] * u[1], inv[1][0] * u[0] + inv[1][1] * u[1]];
          return { q, n: Math.hypot(q[0], q[1]) };
        };
        let st = null;
        v.render(() => {
          const a1 = s1.value * DEG, a2 = s2.value * DEG, ang = psi.value * DEG;
          const fk = planarFK([l1, l2], [a1, a2]), J = planarJ([l1, l2], [a1, a2]);
          hT.set(fk.tip[0], fk.tip[1]);
          const c1 = [J[0][0], J[1][0]], c2 = [J[0][1], J[1][1]], tp = fk.tip, K = 0.8;
          A.segment(fk.pts[0], fk.pts[1], { color: 'accent', width: 7, alpha: 0.85 });
          A.segment(fk.pts[1], fk.pts[2], { color: 'orange', width: 7, alpha: 0.85 });
          fk.pts.slice(0, 2).forEach((p) => A.circle(p[0], p[1], 0.07, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
          const P = (a, b) => [tp[0] + K * (a * c1[0] + b * c2[0]), tp[1] + K * (a * c1[1] + b * c2[1])];
          A.poly([P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)], { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.5 });
          A.arrow(tp[0], tp[1], tp[0] + K * c1[0], tp[1] + K * c1[1], { color: 'accent', width: 3.5, head: 10 });
          A.arrow(tp[0], tp[1], tp[0] + K * c2[0], tp[1] + K * c2[1], { color: 'orange', width: 3.5, head: 10 });
          A.arrow(tp[0], tp[1], tp[0] + 0.9 * Math.cos(ang), tp[1] + 0.9 * Math.sin(ang), { color: 'gold', width: 3, head: 10 });
          A.dot(tp[0], tp[1], { color: 'gold', r: 6 });
          // det curve
          B.fn((x) => Math.sin(x * DEG), { color: 'accent', width: 2.2 });
          B.hline(0, { color: 'muted' });
          B.dot(0, 0, { color: 'red', r: 5 }); B.dot(180, 0, { color: 'red', r: 5 }); B.dot(-180, 0, { color: 'red', r: 5 });
          B.dot(s2.value, Math.sin(a2), { color: 'gold', r: 7 });
          // required speed
          C.fn((x) => { const o = speedFor(a1, x * DEG, ang).n; return Number.isFinite(o) ? Math.min(o, 8) : 8; }, { color: 'red', width: 2.2, n: 720 });
          const sp = speedFor(a1, a2, ang);
          C.dot(s2.value, Math.min(sp.n, 8), { color: 'gold', r: 7 });
          const sv = svd2xn(J);
          st = { det: l1 * l2 * Math.sin(a2), detJ: J[0][0] * J[1][1] - J[0][1] * J[1][0], sp, sv, a2 };
        });
        v.readout(() => {
          if (!st) return '';
          const sing = Math.abs(Math.sin(st.a2)) < 0.06;
          return `$\\det J=${cn(st.detJ, 3)}$ (formula $\\ell_1\\ell_2\\sin\\theta_2=${cn(st.det, 3)}$); singular values $\\sigma_1=${fx(st.sv.s[0], 3)}$, $\\sigma_2=${fx(st.sv.s[1], 3)}$.\nTo move at unit speed in direction $\\psi$ the joints need $\\dot\\theta=(${cn(st.sp.q[0], 2)},${cn(st.sp.q[1], 2)})$, $\\|\\dot\\theta\\|=${fx(st.sp.n, 2)}$.${sing ? ' **Near a singularity:** the green region has collapsed to a line, and only directions along it are cheap.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Wrist, elbow and shoulder singularities',
      statement: String.raw`For a six-axis arm with a spherical wrist (3.4), driving the tool along a prescribed path with fixed orientation requires joint rates $\dot\theta=J^{-1}\mathcal V$, and these become unbounded as the path approaches a singularity of $J$. There are three classic kinds: (a) **wrist singularity**: $\sin\theta_5=0$, the wrist axes 4 and 6 become collinear and only $\theta_4\pm\theta_6$ matters, so $\dot\theta_4,\dot\theta_6$ grow like $1/\sin\theta_5$; (b) **elbow singularity**: the elbow is fully stretched ($\theta_3=0$ here) and the wrist centre sits on the boundary of the reachable sphere, where $\dot\theta_3\sim 1/\sqrt{\text{distance to full stretch}}$; (c) **shoulder singularity**: the wrist centre lies on the axis of joint 1, so $\theta_1$ is undetermined and $\dot\theta_1\sim 1/(\text{distance from the axis})$. Passing *through* the singular point is impossible at finite joint speed; passing near it demands large speeds, and in practice controllers slow the tool or stop with an error.`,
      idea: String.raw`At a singularity the Jacobian drops rank (4.3), so some tool direction cannot be produced and the joint-rate vector that produces a nearby direction is the inverse of a small singular value. In the wrist case the rank deficit is explicit: when axes 4 and 6 coincide, the two columns are equal, and the tool orientation depends only on $\theta_4+\theta_6$; a small miss of size $d$ forces the pair to swing through a half turn in a time proportional to $d$. For the elbow, $\cos\theta_3=(D^2-\ell_1^2-\ell_2^2)/(2\ell_1\ell_2)$ is flat at the stretched posture, so $\theta_3\propto\sqrt{\text{distance}}$. For the shoulder, $\theta_1=\operatorname{atan2}(y,x)$ of the wrist centre turns through $180^\circ$ as it passes the axis at distance $d$.`,
      caption: String.raw`Choose a **singularity type** and a **miss distance** $d$ (a small $d$ means the straight-line tool path comes close to the singularity). The tool moves along its path at constant speed; the chart plots every joint's speed on a log scale against the position $s$ along the path, computed from the exact inverse kinematics by following the solution continuously. Drag $s$ along the path and watch the arm. Shrink $d$: the spikes grow like $1/d$ (shoulder, wrist) or $1/\sqrt d$ (elbow). Two joints often spike together, so one curve hides another: $\theta_1$ and $\theta_6$ for the shoulder, $\theta_4$ and $\theta_6$ for the wrist.`,
      deps: ['robot-4.3', 'robot-3.4'],
      refs: ['Lynch–Park §5.3'],
      tags: ['singularity', 'six-axis arm', 'inverse kinematics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robot_kinematics' },
      viz(v) {
        const { H0, LU, LF, DT } = ARM6, RMAX = LU + LF, VT = 0.5;
        const kind = v.select('singularity', [{ value: 'wrist', label: 'wrist' }, { value: 'elbow', label: 'elbow' }, { value: 'shoulder', label: 'shoulder' }], 'shoulder', {
          onChange: (val) => s.set({ wrist: 0.5, elbow: 0.98, shoulder: 0.5 }[val]),
        });
        const dsl = v.slider('miss distance $d$ (m; rad for the wrist)', 0.003, 0.4, 0.03, { log: true, sig: 2 });
        const s = v.slider('position along the path $s$', 0, 1, 0.5, { step: 0.001 });
        const SG = v.stage({ x: [-2.0, 2.0], y: [-0.9, 2.5], equal: true, axes: false, height: 400, title: 'the arm on its path (green: the tool path)' });
        const sc = v.scene3(SG, { yaw: -0.85, pitch: 0.3, axes: false, lim: 1.5, axis: 1.2 });
        const PL = v.stage({ x: [0, 1], y: [0.01, 300], ylog: true, axes: 'box', gutter: true, xlabel: 'position along the path s', ylabel: 'joint speed (rad/s)', height: 400, minWidth: 300, title: 'joint speeds along the path' });
        const NS = 1500;
        let cache = null;
        const forearm = (r, z) => { const c3 = (r * r + z * z - LU * LU - LF * LF) / (2 * LU * LF), t3 = -Math.acos(clamp(c3, -1, 1)); return Math.atan2(z, r) - Math.atan2(LF * Math.sin(t3), LU + LF * Math.cos(t3)) + t3; };
        function build() {
          const key = kind.value + '|' + dsl.value;
          if (cache && cache.key === key) return cache;
          const d = dsl.value; let R, P;
          if (kind.value === 'shoulder') { R = Ry(90 * DEG); P = (u) => [-1.1 + 2.2 * u, d, H0 + 0.7 - DT]; }
          else if (kind.value === 'elbow') { R = Ry(90 * DEG); const r1 = RMAX - d; P = (u) => [0.7 + (r1 - 0.7) * u, 0, H0 - DT]; }
          else {
            const g0 = forearm(1.5, H0 * 0 + 0.1), dir = [Math.cos(d) * Math.cos(g0), Math.sin(d), Math.cos(d) * Math.sin(g0)];
            // tool x-axis = Rz(d) (cos g0, 0, sin g0); orientation matrix with that first column
            R = mm(Rz(d), Ry(-g0)); void dir;
            P = (u) => { const W = [1.5, 0, H0 - 0.6 + 1.4 * u]; return vadd(W, vsc(mcol(R, 0), DT)); };
          }
          const qs = pathJoints(R, P, NS);
          let len = 0; for (let k = 1; k <= NS; k++) { const a = P((k - 1) / NS), b = P(k / NS); len += norm3(vsub(b, a)); }
          const T = len / VT, sp = [];
          for (let k = 0; k <= NS; k++) {
            const a = qs[Math.max(0, k - 1)], b = qs[Math.min(NS, k + 1)];
            if (!a || !b) { sp.push(null); continue; }
            const dtt = ((Math.min(NS, k + 1) - Math.max(0, k - 1)) / NS) * T;
            sp.push(a.map((x, i) => Math.abs(b[i] - x) / dtt));
          }
          cache = { key, R, P, qs, sp, len, T };
          return cache;
        }
        let st = null;
        v.render(() => {
          const C = build(), k = Math.round(s.value * NS);
          const q = C.qs[k];
          const path = []; for (let i = 0; i <= 60; i++) path.push(C.P(i / 60));
          // speed curves
          for (let j = 0; j < 6; j++) {
            const pts = []; for (let i = 0; i <= NS; i += 2) { const sp = C.sp[i]; pts.push(sp ? [i / NS, Math.max(sp[j], 0.006)] : null); }
            PL.path(pts, { color: JC[j], width: 2 });
          }
          PL.vline(s.value, { color: 'ink', width: 1.5, alpha: 0.55 });
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.4 * Math.cos(t), 0.4 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false });
          sc.path(path, { color: 'green', width: 2, alpha: 0.8, top: false });
          let info = { ok: !!q };
          if (q) {
            const f = fk6(q), oS = f.shoulder;
            sc.line([0, 0, 0], oS, { color: 'muted', width: 7 });
            sc.line(oS, f.elbow, { color: 'accent', width: 7, alpha: 0.85 }); sc.line(f.elbow, f.Wc, { color: 'orange', width: 7, alpha: 0.85 });
            sc.line(f.Wc, f.tool, { color: 'muted', width: 4 });
            // joint-1 axis
            sc.line([0, 0, 0], [0, 0, 1.6], { color: 'faint', width: 1.2 });
            const R = f.R, Rarm = f.Rarm;
            const a4 = mcol(Rarm, 0), a6 = mcol(R, 0);
            sc.line(vsub(f.Wc, vsc(a4, 0.42)), vadd(f.Wc, vsc(a4, 0.42)), { color: 'purple', width: 2.6 });
            sc.line(vsub(f.Wc, vsc(a6, 0.5)), vadd(f.Wc, vsc(a6, 0.5)), { color: 'pink', width: 2.6 });
            drawFrame(sc, R, f.tool, 0.3, { width: 3 });
            sc.dot(f.Wc, { color: 'gold', r: 6 });
            info.q = q; info.sp = C.sp[k];
          }
          sc.flush();
          const peak = [0, 1, 2, 3, 4, 5].map((j) => Math.max(...C.sp.filter(Boolean).map((r) => r[j])));
          st = { ...info, peak, T: C.T, ok: C.qs.every(Boolean) };
        });
        // legend under the plot
        v.legend([['accent', 'θ₁'], ['orange', 'θ₂'], ['purple', 'θ₃'], ['teal', 'θ₄'], ['pink', 'θ₅'], ['gold', 'θ₆']]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return 'Some points of this path are out of reach.';
          const pk = st.peak.map((x) => fx(x, 1));
          const name = { wrist: 'wrist ($\\sin\\theta_5\\to0$)', elbow: 'elbow ($\\theta_3\\to0$)', shoulder: 'shoulder (wrist centre on the $\\theta_1$ axis)' }[kind.value];
          return `Singularity type: ${name}; the tool moves at ${VT} m/s along the path (${fx(st.T, 1)} s).\nPeak joint speeds along the whole path (rad/s): $\\dot\\theta_1\\ldots\\dot\\theta_6=(${pk.join(', ')})$. At the cursor: $\\theta=(${st.q.map((x) => fx(x / DEG, 0)).join(', ')})^\\circ$.`;
        });
      },
    },
  ],
};
void wrapPi; void unwrapTo; void dot3; void cross3; void mkT; void pof; void Tinv; void Tapply; void Ttrans; void Trot; void mt; void ellipsePts; void svd2xn;
void ARM4; void ik6;
