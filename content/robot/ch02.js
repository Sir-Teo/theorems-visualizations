// Robotics — Chapter 2: Rigid-body motions
import {
  TAU, DEG, clamp, vadd, vsub, vsc, dot3, cross3, norm3, unit3, I3, mm, mt, mv, madd, msc, mcol, det3, fro, orthErr, skew, Rx, Ry, Rz,
  eulerZYX, rodrigues, rotFromVec, logRot, rotAngle, qMul, qDot, qNorm, qFromAxisAngle, qToR, qFromR, qSlerp,
  mkT, Rof, pof, Tmul, Tinv, Tapply, Ttrans, Trot, fro4, eulerFromR,
  AXC, drawBody, drawFrame, frameLabels, drawBall, circleAbout, inBall, onSphere, fx, bmat, piTicks,
} from './ch02.shared.js';

const HB = [0.7, 0.5, 0.12]; // half-sizes of the "book" used as a test body

export default {
  collection: 'robot',
  chapter: 2,
  title: 'Rigid-body motions',
  summary: String.raw`Rotations form the group $SO(3)$ and rigid motions the group $SE(3)$, and both are best understood through their exponential coordinates: every rotation is a turn about some axis, every rigid motion a screw. Angular velocities and twists live in the corresponding Lie algebras, wrenches are their dual, and the adjoint map changes the frame in which they are expressed. These tools make the kinematics of the following chapters short, and the pictures in this chapter are the ones to keep in mind when a formula gets heavy.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Rotation matrices and SO(3)',
      statement: String.raw`A **rotation matrix** is a real $3\times3$ matrix $R$ with $R^{\mathsf T}R=I$ and $\det R=+1$; the set of all of them is the group $SO(3)$. If $\{a\}$ and $\{b\}$ are two right-handed frames with a common origin, the columns of $R_{ab}$ are the axes of $\{b\}$ written in the coordinates of $\{a\}$, so $p_a=R_{ab}\,p_b$ converts the coordinates of a point. The inverse is the transpose, $R_{ab}^{-1}=R_{ab}^{\mathsf T}=R_{ba}$, and frames chain by multiplication, $R_{ac}=R_{ab}R_{bc}$. $SO(3)$ is closed under products and inverses, has dimension $3$, and is not commutative.`,
      idea: String.raw`Orthonormal columns mean the frame's axes are unit and mutually perpendicular, which is exactly $R^{\mathsf T}R=I$; this forces $\det R=\pm1$ and the sign $+1$ says the frame is right-handed (no mirror image). Lengths and angles are preserved because $\langle Rx,Ry\rangle=x^{\mathsf T}R^{\mathsf T}Ry=\langle x,y\rangle$. Nine entries minus six independent equations $R^{\mathsf T}R=I$ leave three free numbers, which is why a rotation has three degrees of freedom (item 1.1). Products of orthogonal matrices are orthogonal, so $SO(3)$ is a group; the orthonormal bases of linear algebra (ladr-7.44) are its rows and columns.`,
      caption: String.raw`Drag the **blue dot** in the left ball: it is the rotation vector of $R_{ab}$ (direction = axis, distance from the centre = angle, the surface is $180^\circ$). The middle ball does the same for $R_{bc}$, and the right panel shows frames $a$, $b$, $c$ together with $R_{ac}=R_{ab}R_{bc}$. Drag the background to look around. Switch on **corrupt one entry** to break orthogonality: the body is sheared, $\det R$ is no longer $1$ and the matrix leaves $SO(3)$.`,
      deps: ['ladr-7.44', 'mech-10.1'],
      refs: ['Lynch–Park §3.2'],
      tags: ['rotation', 'SO(3)', 'frames'],
      viz(v) {
        const k = 1.5 / Math.PI;
        const bad = v.toggle('corrupt one entry of $R_{ab}$', false);
        const mk = (title) => v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 290, minWidth: 240, title });
        const SA = mk('frame b seen from a'), SB = mk('frame c seen from b'), SC = mk('a, b, c together');
        const cam = { yaw: -0.7, pitch: 0.32, axes: false, lim: 1.5 };
        const sA = v.scene3(SA, { ...cam, hint: false }), sB = v.scene3(SB, { ...cam, hint: false }), sC = v.scene3(SC, cam);
        const hA = sA.handle(vsc([0.5, 0.3, 1.0], k), { color: 'accent', snap: inBall(1.5), lim: 1.5 });
        const hB = sB.handle(vsc([0.9, -0.6, 0.2], k), { color: 'accent', snap: inBall(1.5), lim: 1.5 });
        const O = [0, 0, 0];
        let st = null;
        v.render(() => {
          const Rab = rotFromVec(vsc(hA.p, 1 / k)), Rbc = rotFromVec(vsc(hB.p, 1 / k));
          if (bad.value) Rab[0][1] += 0.3;
          const Rac = mm(Rab, Rbc);
          sA.begin(); drawBall(sA, 1.5);
          drawFrame(sA, I3(), O, 1.0, { color: 'faint', width: 1.4 }); drawBody(sA, Rab, O, HB); drawFrame(sA, Rab, O, 1.0); frameLabels(sA, Rab, O, 1.0, ['x_b', 'y_b', 'z_b']);
          sA.line(O, hA.p, { color: 'accent', dash: true, alpha: 0.6 }); sA.flush();
          sB.begin(); drawBall(sB, 1.5);
          drawFrame(sB, I3(), O, 1.0, { color: 'faint', width: 1.4 }); drawBody(sB, Rbc, O, HB); drawFrame(sB, Rbc, O, 1.0); frameLabels(sB, Rbc, O, 1.0, ['x_c', 'y_c', 'z_c']);
          sB.line(O, hB.p, { color: 'accent', dash: true, alpha: 0.6 }); sB.flush();
          sC.begin();
          drawFrame(sC, I3(), O, 1.15, { color: 'muted', width: 1.4, alpha: 0.8 }); frameLabels(sC, I3(), O, 1.15, ['x_a', 'y_a', 'z_a'], { color: 'muted' });
          drawFrame(sC, Rab, O, 0.85, { width: 1.6, alpha: 0.45 });
          drawBody(sC, Rac, O, HB); drawFrame(sC, Rac, O, 1.15); frameLabels(sC, Rac, O, 1.15, ['x_c', 'y_c', 'z_c']);
          sC.flush();
          st = { Rab, Rbc, Rac };
        });
        v.readout(() => {
          if (!st) return '';
          const { Rab, Rbc, Rac } = st, e = orthErr(Rab), d = det3(Rab), ok = e < 1e-9 && Math.abs(d - 1) < 1e-9;
          const q = [0.6, -0.3, 0.9], lhs = mv(Rac, q), rhs = mv(Rab, mv(Rbc, q)), comm = fro(madd(mm(Rab, Rbc), msc(mm(Rbc, Rab), -1)));
          return `$R_{ab}=${bmat(Rab)}$, $\\det R_{ab}=${fx(d, 3)}$, $\\|R_{ab}^{\\mathsf T}R_{ab}-I\\|=${v.sci(e + 1e-17, 2)}$ — ${ok ? '**a rotation** (an element of $SO(3)$)' : '**not a rotation**: the columns are no longer orthonormal and $\\det\\neq1$'}.\n$R_{ac}=R_{ab}R_{bc}$ has $\\det=${fx(det3(Rac), 3)}$; a point $q_c=(0.6,-0.3,0.9)$ lands at $R_{ac}q_c$ and at $R_{ab}(R_{bc}q_c)$, which differ by $${v.sci(norm3(vsub(lhs, rhs)) + 1e-17, 2)}$. Order matters: $\\|R_{ab}R_{bc}-R_{bc}R_{ab}\\|=${fx(comm, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Angular velocity and skew-symmetric matrices',
      statement: String.raw`If a body's orientation $R(t)\in SO(3)$ changes smoothly, then $\dot R R^{\mathsf T}$ is a **skew-symmetric** matrix, $[\omega]=\dot RR^{\mathsf T}$, where $[\omega]=\begin{bmatrix}0&-\omega_3&\omega_2\\ \omega_3&0&-\omega_1\\ -\omega_2&\omega_1&0\end{bmatrix}$ and the vector $\omega=(\omega_1,\omega_2,\omega_3)$ is the **angular velocity in the fixed frame**. Then $[\omega]p=\omega\times p$, so a body-fixed point at $p=Rq$ moves with velocity $\dot p=\omega\times p$. In the moving frame, $R^{\mathsf T}\dot R=[\omega_b]$ with $\omega_b=R^{\mathsf T}\omega$. The skew-symmetric $3\times3$ matrices form the Lie algebra $\mathfrak{so}(3)$, and conversely $\dot R=[\omega]R$ keeps $R$ in $SO(3)$ only when the matrix is skew-symmetric.`,
      idea: String.raw`Differentiate $RR^{\mathsf T}=I$: $\dot RR^{\mathsf T}+R\dot R^{\mathsf T}=0$, i.e. $A+A^{\mathsf T}=0$ for $A=\dot RR^{\mathsf T}$. A skew-symmetric $3\times3$ matrix has three free entries, so it can be packaged as a vector, and the matrix–vector product $[\omega]p$ is exactly the cross product (item mech-9.4 in the mechanics collection, where $\dot{\mathbf r}=\boldsymbol\omega\times\mathbf r$). Going the other way, if $A$ has a symmetric part then $\frac{d}{dt}(R^{\mathsf T}R)=R^{\mathsf T}(A+A^{\mathsf T})R\neq0$ and the "rigid" body is stretched.`,
      caption: String.raw`Drag the **green dot** to set $\omega$ (its direction is the instantaneous axis, its length the rate in rad/s); the body spins and each marked point carries the arrow $\omega\times p$ and its circle about the axis. The readout compares those arrows with a finite-difference derivative of $R(t)$, and checks $\dot RR^{\mathsf T}=[\omega]$. Switch on **break it** to add a symmetric part to the matrix: the arrows still follow $Ap$, but the body swells and $\det R$ drifts from $1$.`,
      deps: ['robot-2.1', 'mech-9.4'],
      refs: ['Lynch–Park §3.2'],
      tags: ['angular velocity', 'so(3)', 'skew-symmetric'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 400, title: 'a spinning body, with its angular velocity' });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.38, axes: false, lim: 1.5 });
        const W = sc.handle([0.3, 0.2, 1.05], { color: 'green', label: 'ω', lim: 1.5, snap: inBall(1.5) });
        const brk = v.toggle('break it: add a symmetric part to the matrix', false);
        const R0 = rotFromVec([0.5, -0.35, 0.25]);
        const Q = [[0.7, 0.5, 0.12], [-0.7, 0.5, -0.12], [0.7, -0.5, -0.12], [-0.7, -0.5, 0.12]], QC = ['red', 'gold', 'purple', 'teal'];
        const SYM = [[0.08, 0.05, 0], [0.05, 0, 0], [0, 0, -0.03]];
        let st = null;
        v.animate((t) => {
          const w = W.p, A = brk.value ? madd(skew(w), SYM) : skew(w);
          const Rt = (s) => mm(M.expm(msc(A, s)), R0), h = 1e-4;
          const R = Rt(t), Rd = msc(madd(Rt(t + h), msc(Rt(t - h), -1)), 1 / (2 * h));
          const wl = norm3(w), wu = unit3(w), O = [0, 0, 0];
          sc.begin();
          if (wl > 0.02) sc.line(vsc(wu, -1.9), vsc(wu, 1.9), { color: 'green', width: 1.4, dash: true, alpha: 0.7 });
          drawBody(sc, R, O, HB, { alpha: 0.2 });
          let err = 0;
          Q.forEach((q, i) => {
            const p = mv(R, q), vel = mv(A, p);
            if (!brk.value && wl > 0.02) sc.path(circleAbout(p, wu), { color: QC[i], width: 1, alpha: 0.35, top: false });
            sc.arrow(p, vadd(p, vsc(vel, 0.6)), { color: QC[i], width: 2.4, head: 8 });
            sc.dot(p, { color: QC[i], r: 4.5 });
            err = Math.max(err, norm3(vsub(mv(Rd, q), vel)));
          });
          sc.arrow(O, w, { color: 'green', width: 3.2, head: 11, top: false });
          sc.flush();
          st = { w, A, R, errV: err, errS: fro(madd(mm(Rd, mt(R)), msc(A, -1))), e: orthErr(R), d: det3(R) };
        }, { period: 8, still: 1.4 });
        v.readout(() => {
          if (!st) return '';
          const { w, A, errV, errS, e, d } = st;
          const wb = mv(mt(st.R), w);
          return `$\\omega=(${fx(w[0])},${fx(w[1])},${fx(w[2])})$, $|\\omega|=${fx(norm3(w))}$ rad/s; $[\\omega]=${bmat(skew(w))}$.\nVelocity of the marked points: finite-difference $\\dot R\\,q$ versus ${brk.value ? '$Ap$' : '$\\omega\\times p=[\\omega]p$'}, largest gap $${v.sci(errV + 1e-17, 2)}$; $\\|\\dot RR^{\\mathsf T}-${brk.value ? 'A' : '[\\omega]'}\\|=${v.sci(errS + 1e-17, 2)}$.\n${brk.value ? `The matrix is **not skew** ($\\|A+A^{\\mathsf T}\\|=${fx(fro(madd(A, mt(A))), 2)}$): after $t$ seconds $\\|R^{\\mathsf T}R-I\\|=${fx(e, 3)}$, $\\det R=${fx(d, 3)}$ — the body is no longer rigid.` : `Body-frame angular velocity $\\omega_b=R^{\\mathsf T}\\omega=(${fx(wb[0])},${fx(wb[1])},${fx(wb[2])})$ has the same length; $\\|R^{\\mathsf T}R-I\\|=${v.sci(e + 1e-17, 2)}$, $\\det R=${fx(d, 3)}$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Exponential coordinates and Rodrigues’ formula',
      statement: String.raw`Let $\hat\omega\in\R^3$ be a unit vector and $\theta\in\R$. The matrix exponential of $[\hat\omega]\theta$ is the rotation about the axis $\hat\omega$ through the angle $\theta$, given in closed form by **Rodrigues' formula**
$$e^{[\hat\omega]\theta}=I+\sin\theta\,[\hat\omega]+(1-\cos\theta)\,[\hat\omega]^2 .$$
Every $R\in SO(3)$ arises this way: the map $[\hat\omega]\theta\mapsto e^{[\hat\omega]\theta}$ from $\mathfrak{so}(3)$ onto $SO(3)$ is surjective. Conversely, if $R\neq I$ then $\theta=\arccos\frac{\operatorname{tr}R-1}{2}\in[0,\pi]$ and, for $\theta<\pi$, $[\hat\omega]=\frac{1}{2\sin\theta}(R-R^{\mathsf T})$; when $\theta=\pi$ the axis is only determined up to sign. The vector $\hat\omega\theta$ is the **exponential coordinates** of $R$, and $\log R=[\hat\omega]\theta$.`,
      idea: String.raw`The cube of a unit axis matrix satisfies $[\hat\omega]^3=-[\hat\omega]$, so the power series $\sum_k([\hat\omega]\theta)^k/k!$ splits into the series of $\sin\theta$ on odd powers and of $1-\cos\theta$ on even ones, which is Rodrigues' formula. The result fixes $\hat\omega$ (since $[\hat\omega]\hat\omega=0$) and turns the plane perpendicular to it by $\theta$, because $\dot R=[\hat\omega]R$ is the angular velocity of 2.2 with constant axis. For the converse, the trace of the formula is $1+2\cos\theta$ and its antisymmetric part is $\sin\theta[\hat\omega]$, and these two equations solve for $\theta$ and $\hat\omega$; the case $\theta=\pi$ kills the antisymmetric part and needs the symmetric part $R+I=2\hat\omega\hat\omega^{\mathsf T}$.`,
      caption: String.raw`**Axis → R:** drag the green dot to aim $\hat\omega$ (it stays on the sphere) and move the $\theta$ slider; the ghost bodies are the intermediate turns $\theta/4,\theta/2,3\theta/4$ and the gold curve is the path of a body point. **R → axis:** pick any orientation with the roll–pitch–yaw sliders and the matrix logarithm finds the axis and angle that reach it. The right panel plots $\cos\theta=(\operatorname{tr}R-1)/2$, the quantity the logarithm inverts; past $\theta=\pi$ the principal logarithm switches to the opposite axis.`,
      deps: ['robot-2.2', 'mech-10.1', 'ladr-8.46'],
      refs: ['Lynch–Park §3.2'],
      credit: 'O. Rodrigues, 1840',
      tags: ['Rodrigues', 'exponential map', 'axis–angle'],
      viz(v) {
        const M = v.M;
        const mode = v.select('direction', [{ value: 'fwd', label: 'axis, angle → R' }, { value: 'inv', label: 'R → axis, angle (log)' }], 'fwd');
        const th = v.slider('angle $\\theta$ (rad)', 0, TAU, 1.9, { step: 0.01 });
        const roll = v.slider('roll $\\phi$ (°)', -180, 180, 40, { step: 1 }), pitch = v.slider('pitch $\\vartheta$ (°)', -89, 89, 25, { step: 1 }), yaw = v.slider('yaw $\\psi$ (°)', -180, 180, 110, { step: 1 });
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 380, title: 'rotation about an axis' });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.36, axes: false, lim: 1.5 });
        const ax = sc.handle(vsc(unit3([0.5, 0.3, 0.8]), 1.5), { color: 'green', label: 'ω', snap: onSphere(1.5), lim: 1.5 });
        const P = v.stage({ x: [0, TAU], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 380, xlabel: 'angle θ', ylabel: '(tr R − 1)/2', xticks: piTicks(0, TAU), title: 'what the trace remembers' });
        const p0 = [0.7, 0.5, 0.12], O = [0, 0, 0];
        let st = null;
        v.render(() => {
          const inv = mode.value === 'inv';
          th.el.hidden = inv; roll.el.hidden = pitch.el.hidden = yaw.el.hidden = !inv;
          let w, ang, R;
          if (inv) {
            R = eulerZYX(yaw.value * DEG, pitch.value * DEG, roll.value * DEG);
            const r = logRot(R); ang = norm3(r); w = ang < 1e-9 ? [0, 0, 1] : vsc(r, 1 / ang); ax.set(vsc(w, 1.5)); ax.visible = false;
          } else {
            ax.visible = true; w = unit3(ax.p); ang = th.value; R = rodrigues(w, ang);
          }
          sc.begin();
          sc.line(vsc(w, -1.9), vsc(w, 1.9), { color: 'green', width: 2, alpha: 0.8 });
          for (let i = 1; i <= 3; i++) drawBody(sc, rodrigues(w, (ang * i) / 4), O, HB, { color: 'muted', alpha: 0.05, edgeAlpha: 0.3, width: 0.8 });
          const arc = []; for (let i = 0; i <= 40; i++) arc.push(mv(rodrigues(w, (ang * i) / 40), p0));
          sc.path(arc, { color: 'gold', width: 2.2 });
          drawBody(sc, R, O, HB); drawFrame(sc, R, O, 1.0);
          sc.dot(mv(R, p0), { color: 'gold', r: 5 });
          sc.arrow(O, vsc(w, 1.55), { color: 'green', width: 3, head: 11 });
          sc.flush();
          const tr = R[0][0] + R[1][1] + R[2][2];
          P.fn((x) => Math.cos(x), { color: 'ink', width: 1.8 });
          P.vband(Math.PI, TAU, { color: 'orange', alpha: 0.08 }); P.vline(Math.PI, { color: 'orange', dash: true });
          P.text('θ > π: same as 2π − θ', 4.71, 1.12, { size: 11.5, color: 'orange', align: 'center' }); P.text('about the opposite axis', 4.71, 0.92, { size: 11.5, color: 'orange', align: 'center' });
          const lg = logRot(R);
          P.dot(ang, (tr - 1) / 2, { color: 'gold', r: 6 });
          if (inv) P.dot(norm3(lg), Math.cos(norm3(lg)), { color: 'green', r: 5, hollow: true });
          st = { w, ang, R, tr, lg };
        });
        v.legend([['ink', 'cos θ'], ['gold', 'this rotation'], ['orange', 'principal log flips axis', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { w, ang, R, lg } = st, K = skew(w);
          const E = M.expm(msc(K, ang)), rod = fro(madd(E, msc(R, -1)));
          const back = rotFromVec(lg), logErr = fro(madd(back, msc(R, -1)));
          const a = `Axis $\\hat\\omega=(${fx(w[0], 3)},${fx(w[1], 3)},${fx(w[2], 3)})$, $\\theta=${fx(ang, 3)}$ rad $=${fx(ang / DEG, 1)}^\\circ$, $\\operatorname{tr}R=1+2\\cos\\theta=${fx(st.tr, 3)}$.`;
          const b = `\nRodrigues' $I+\\sin\\theta[\\hat\\omega]+(1-\\cos\\theta)[\\hat\\omega]^2$ against the series $\\sum([\\hat\\omega]\\theta)^k/k!$ (computed numerically): $\\|\\cdot\\|=${v.sci(rod + 1e-17, 2)}$. $R\\hat\\omega-\\hat\\omega$ has size $${v.sci(norm3(vsub(mv(R, w), w)) + 1e-17, 2)}$ (the axis is fixed).`;
          const c = `\nLogarithm: $\\theta_{\\log}=\\arccos\\frac{\\operatorname{tr}R-1}{2}=${fx(norm3(lg), 3)}$ with axis $(${fx(unit3(lg)[0], 3)},${fx(unit3(lg)[1], 3)},${fx(unit3(lg)[2], 3)})$; $\\|e^{\\log R}-R\\|=${v.sci(logErr + 1e-17, 2)}$${ang > Math.PI + 1e-9 && mode.value === 'fwd' ? ' — here $\\theta>\\pi$, so the logarithm returns the equivalent turn $2\\pi-\\theta$ about $-\\hat\\omega$' : ''}.`;
          return a + b + c;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Phenomenon',
      name: 'Euler angles and gimbal lock',
      statement: String.raw`Three successive rotations about coordinate axes give a three-number parametrisation of orientation; for yaw–pitch–roll, $R=R_z(\psi)R_y(\vartheta)R_x(\varphi)$. No such parametrisation of $SO(3)$ by three angles is free of trouble: when the middle angle is $\vartheta=\pm90^\circ$ the first and third rotation axes coincide, the map $(\psi,\vartheta,\varphi)\mapsto R$ loses rank (only $\psi\mp\varphi$ matters), and the angle rates $(\dot\psi,\dot\vartheta,\dot\varphi)$ needed to realise a given angular velocity become unbounded as $\vartheta\to\pm90^\circ$. This is **gimbal lock**. It is a property of the coordinates, not of the orientations: a topological reason is that $SO(3)$ is not a product of three circles.`,
      idea: String.raw`The angular velocity is a combination of the three axis directions, $\omega=\dot\psi\,\hat z+\dot\vartheta\,\hat y_1+\dot\varphi\,\hat x_2$, with $\hat y_1$ the pitch axis after yaw and $\hat x_2$ the roll axis after yaw and pitch. The matrix with these columns has determinant $\cos\vartheta$; at $\vartheta=90^\circ$ the roll axis equals $-\hat z$, so $\hat z$ and $\hat x_2$ are parallel and the three columns span only a plane. Solving for the rates therefore divides by $\cos\vartheta$ (Cramer's rule). An orientation is still perfectly fine there, which is why quaternions or rotation matrices (2.1, 2.5) are used to represent attitude.`,
      caption: String.raw`Set yaw, pitch and roll: the outer ring turns about the vertical, the middle about the pitch axis, the inner about the roll axis. The orange and blue lines are the first and third axes; push the pitch to $\pm90^\circ$ and they merge. The right plot shows the angle rates needed to spin the body about a fixed world axis at $1$ rad/s: the rates of yaw and roll blow up like $1/\cos\vartheta$ near the lock (rotating about the world $z$-axis is harmless: choose $x$ or $y$).`,
      deps: ['robot-2.1', 'mech-10.15'],
      refs: ['Lynch–Park App. B'],
      tags: ['Euler angles', 'gimbal lock', 'singularity'],
      viz(v) {
        const yaw = v.slider('yaw $\\psi$ (°)', -180, 180, 35, { step: 1 });
        const pitch = v.slider('pitch $\\vartheta$ (°)', -90, 90, 50, { step: 0.5 });
        const roll = v.slider('roll $\\varphi$ (°)', -180, 180, 20, { step: 1 });
        const dir = v.select('spin the body about the world axis', [{ value: '0', label: 'x' }, { value: '1', label: 'y' }, { value: '2', label: 'z' }], '0');
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 390, title: 'three nested gimbals' });
        const sc = v.scene3(S, { yaw: -0.8, pitch: 0.3, axes: false, lim: 1.5 });
        const P = v.stage({ x: [-90, 90], y: [0, 6], axes: 'box', gutter: true, height: 390, xlabel: 'pitch ϑ (°)', ylabel: 'angle rate needed (rad/s)', xticks: [[-90, '−90'], [-45, '−45'], [0, '0'], [45, '45'], [90, '90']], title: 'rates for a unit spin about a fixed axis' });
        const O = [0, 0, 0], ez = [0, 0, 1];
        const ring = (c, a, b, r) => { const pts = []; for (let i = 0; i <= 64; i++) { const t = (TAU * i) / 64; pts.push(vadd(c, vadd(vsc(a, r * Math.cos(t)), vsc(b, r * Math.sin(t))))); } return pts; };
        const rates = (ps, tt, e) => {
          const F1 = Rz(ps), F2 = mm(F1, Ry(tt)), a = ez, b = mcol(F1, 1), c = mcol(F2, 0), det = dot3(a, cross3(b, c));
          if (Math.abs(det) < 1e-9) return { det, r: [Infinity, Infinity, Infinity] };
          return { det, r: [dot3(e, cross3(b, c)) / det, dot3(a, cross3(e, c)) / det, dot3(a, cross3(b, e)) / det] };
        };
        let st = null;
        v.render(() => {
          const ps = yaw.value * DEG, tt = pitch.value * DEG, ph = roll.value * DEG;
          const F1 = Rz(ps), F2 = mm(F1, Ry(tt)), F3 = mm(F2, Rx(ph));
          const y1 = mcol(F1, 1), x2 = mcol(F2, 0), y2 = mcol(F2, 1);
          sc.begin();
          sc.path(ring(O, y1, ez, 1.65), { color: 'orange', width: 3.2 });
          sc.line(vsc(y1, 1.65), vsc(y1, 1.2), { color: 'purple', width: 3 }); sc.line(vsc(y1, -1.65), vsc(y1, -1.2), { color: 'purple', width: 3 });
          sc.path(ring(O, x2, y2, 1.2), { color: 'purple', width: 3.2 });
          sc.line(vsc(x2, 1.2), vsc(x2, 0.9), { color: 'teal', width: 3 }); sc.line(vsc(x2, -1.2), vsc(x2, -0.9), { color: 'teal', width: 3 });
          sc.path(ring(O, x2, mcol(F3, 2), 0.9), { color: 'teal', width: 3.2 });
          sc.line(vsc(ez, -1.95), vsc(ez, 1.95), { color: 'orange', width: 1.6, dash: true, alpha: 0.9 });
          sc.line(vsc(x2, -1.95), vsc(x2, 1.95), { color: 'accent', width: 1.6, dash: true, alpha: 0.9 });
          drawBody(sc, F3, O, [0.55, 0.38, 0.1], { alpha: 0.28 }); drawFrame(sc, F3, O, 0.8, { width: 2 });
          sc.tex('\\text{yaw axis}', vsc(ez, 2.1), { color: 'orange', size: 12 }); sc.tex('\\text{roll axis}', vsc(x2, 2.12), { color: 'accent', size: 12 });
          sc.flush();
          const e = [0, 0, 0]; e[+dir.value] = 1;
          const rr = rates(ps, tt, e), lock = Math.abs(Math.cos(tt)) < 0.04;
          if (lock) S.corner('GIMBAL LOCK: yaw and roll axes coincide', 'tl', { color: 'red', weight: 700 });
          const f = (k) => (x) => { const q = rates(ps, x * DEG, e).r[k]; return Math.abs(q); };
          P.clip(() => {
            P.fn(f(0), { color: 'orange', width: 2, n: 360 }); P.fn(f(1), { color: 'purple', width: 2, n: 360 }); P.fn(f(2), { color: 'teal', width: 2, n: 360 });
          });
          P.vline(pitch.value, { color: 'gold', dash: true, width: 1.5 });
          rr.r.forEach((q, i) => { if (Number.isFinite(q)) P.dot(pitch.value, Math.min(Math.abs(q), 5.9), { color: ['orange', 'purple', 'teal'][i], r: 5 }); });
          const Wm = [ez, y1, x2].map((c) => c.slice());
          st = { rr, lock, rank: v.M.rank(Wm, 1e-4), det: Math.cos(tt), R: F3 };
        });
        v.legend([['orange', 'yaw rate $\\dot\\psi$'], ['purple', 'pitch rate $\\dot\\vartheta$'], ['teal', 'roll rate $\\dot\\varphi$']]);
        v.readout(() => {
          if (!st) return '';
          const { rr, rank, det } = st, g = (x) => (Number.isFinite(x) ? fx(x, 2) : '\\infty');
          return `Axes $\\hat z,\\ \\hat y_1,\\ \\hat x_2$ span a space of dimension **${rank}**; $\\det=\\cos\\vartheta=${fx(det, 3)}$.\nRates to spin about the world ${'xyz'[+dir.value]}-axis at 1 rad/s: $\\dot\\psi=${g(rr.r[0])}$, $\\dot\\vartheta=${g(rr.r[1])}$, $\\dot\\varphi=${g(rr.r[2])}$ ${st.lock ? '— unbounded: some directions of rotation are out of reach with finite rates' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Unit quaternions',
      statement: String.raw`A **unit quaternion** $q=(w,\mathbf u)=w+u_1\mathbf i+u_2\mathbf j+u_3\mathbf k$ with $w^2+|\mathbf u|^2=1$ is a point of the 3-sphere $S^3$. With $q=(\cos\frac\theta2,\ \sin\frac\theta2\,\hat\omega)$ it represents the rotation $R(q)=e^{[\hat\omega]\theta}$, whose matrix is $R=I+2w[\mathbf u]+2[\mathbf u]^2$. The product of quaternions (Hamilton's rules $\mathbf i^2=\mathbf j^2=\mathbf k^2=\mathbf{ijk}=-1$) corresponds to composition, $R(q_1q_2)=R(q_1)R(q_2)$, and $q$ and $-q$ give the same rotation: $S^3\to SO(3)$ is a two-to-one covering. The great-circle interpolation (**slerp**) $q(t)=\frac{\sin((1-t)\Omega)}{\sin\Omega}q_0+\frac{\sin(t\Omega)}{\sin\Omega}q_1$, with $\cos\Omega=q_0\!\cdot q_1$, turns the body about one fixed axis at constant angular speed.`,
      idea: String.raw`Half-angles appear because $q$ acts on a vector $x$ by $q(0,x)q^{-1}$, which is conjugation and sees $q$ twice. This realises Rodrigues' formula (2.3) algebraically, with no trigonometry in the product and a single normalisation to repair numerical drift, and it is free of the singularity of Euler angles (2.4). Geodesics of $S^3$ are great circles, and along one the rotation $q_0^{-1}q(t)$ keeps a fixed axis and an angle growing linearly in $t$; interpolating the three Euler angles instead follows a curve that is neither the shortest nor of constant speed. Because of $q\sim-q$ one must pick the sign with $q_0\!\cdot q_1\ge0$ to take the short way.`,
      caption: String.raw`Left: the unit quaternions $(u_1,u_2,u_3)$ with $w\ge0$ fill the unit ball (the surface $w=0$ is the $180^\circ$ turn; the point at the centre is "no rotation"). Drag the two **blue dots** $q_0,q_1$; the blue arc is the slerp path, the orange one the path of Euler-angle interpolation. Middle: the bodies at the parameter $t$, with the tip trace of one body axis. Right: angular speed along each path — constant for slerp. Untick **short way** to see the long way round the circle.`,
      deps: ['robot-2.3', 'mech-10.20'],
      refs: ['Lynch–Park App. B'],
      credit: 'W. R. Hamilton, 1843',
      tags: ['quaternion', 'slerp', 'S³'],
      viz(v) {
        const kq = 1.5, O = [0, 0, 0];
        const tS = v.slider('parameter $t$', 0, 1, 0.45, { step: 0.005 });
        const short = v.toggle('short way', true);
        const mk = (title, extra) => v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 300, minWidth: 250, title, ...extra });
        const SB = mk('unit quaternions: the ball w ≥ 0'), SR = mk('orientation along the path');
        const SP = v.stage({ x: [0, 1], y: [0, 4], axes: 'box', gutter: true, height: 300, minWidth: 250, xlabel: 't', ylabel: 'angular speed (rad)', title: 'speed along the path' });
        const sb = v.scene3(SB, { yaw: -0.7, pitch: 0.35, axes: false, lim: 1.5 }), sr = v.scene3(SR, { yaw: -0.7, pitch: 0.35, axes: false, lim: 1.5, hint: false });
        const fromE = (a, b, c) => { const q = qFromR(eulerZYX(a * DEG, b * DEG, c * DEG)); return vsc(q.slice(1), kq); };
        const h0 = sb.handle(fromE(-80, 15, -60), { color: 'accent', label: 'q₀', snap: inBall(kq), lim: kq });
        const h1 = sb.handle(fromE(100, 80, 60), { color: 'accent', label: 'q₁', snap: inBall(kq), lim: kq });
        const toQ = (h) => { const u = vsc(h.p, 1 / kq), w = Math.sqrt(Math.max(0, 1 - dot3(u, u))); return [w, u[0], u[1], u[2]]; };
        const tip0 = [1.1, 0, 0];
        let st = null;
        v.render(() => {
          const q0 = toQ(h0), q1 = toQ(h1), sh = short.value;
          const R0 = qToR(q0), R1 = qToR(q1);
          const e0 = eulerFromR(R0), e1 = eulerFromR(R1), wr = (a) => a - TAU * Math.round(a / TAU);
          const eul = (t) => eulerZYX(e0[0] + wr(e1[0] - e0[0]) * t, e0[1] + (e1[1] - e0[1]) * t, e0[2] + wr(e1[2] - e0[2]) * t);
          const sl = (t) => qSlerp(q0, q1, t, sh), slR = (t) => qToR(sl(t));
          const proj = (q) => (q[0] < 0 ? vsc(q.slice(1), -kq) : vsc(q.slice(1), kq));
          // ball panel
          sb.begin(); drawBall(sb, kq);
          const seg = []; let cur = [];
          for (let i = 0; i <= 120; i++) { const q = sl(i / 120); if (cur.length && (q[0] < 0) !== (cur.sneg)) { seg.push(cur); cur = []; } cur.sneg = q[0] < 0; cur.push(proj(q)); }
          seg.push(cur); seg.forEach((s) => sb.path(s, { color: 'accent', width: 2.6 }));
          for (let i = 1; i < seg.length; i++) { sb.dot(seg[i - 1][seg[i - 1].length - 1], { color: 'gold', r: 3.5 }); sb.dot(seg[i][0], { color: 'gold', r: 3.5 }); }
          let ep = []; const eps = [];
          for (let i = 0; i <= 120; i++) { const pp = proj(qFromR(eul(i / 120))); if (ep.length && norm3(vsub(pp, ep[ep.length - 1])) > 0.6 * kq) { eps.push(ep); ep = []; } ep.push(pp); }
          eps.push(ep); eps.forEach((e) => sb.path(e, { color: 'orange', width: 2, alpha: 0.9 }));
          sb.dot(proj(sl(tS.value)), { color: 'gold', r: 6 }); sb.dot(proj(qFromR(eul(tS.value))), { color: 'orange', r: 5 });
          sb.line(O, h0.p, { color: 'faint', dash: true }); sb.line(O, h1.p, { color: 'faint', dash: true });
          sb.flush();
          // bodies panel
          sr.begin();
          drawBody(sr, R0, O, HB, { color: 'muted', alpha: 0.06, edgeAlpha: 0.35, width: 0.8 }); drawBody(sr, R1, O, HB, { color: 'muted', alpha: 0.06, edgeAlpha: 0.35, width: 0.8 });
          const t1 = [], t2 = []; for (let i = 0; i <= 80; i++) { t1.push(mv(slR(i / 80), tip0)); t2.push(mv(eul(i / 80), tip0)); }
          sr.path(t2, { color: 'orange', width: 1.6, alpha: 0.9 }); sr.path(t1, { color: 'accent', width: 2.2 });
          drawBody(sr, eul(tS.value), O, HB, { color: 'orange', alpha: 0.1, edgeAlpha: 0.7, width: 1.1 });
          drawBody(sr, slR(tS.value), O, HB, { alpha: 0.26 }); drawFrame(sr, slR(tS.value), O, 0.95, { width: 2 });
          sr.flush();
          // speed panel
          const hh = 1e-3, spd = (f, t) => rotAngle(mm(mt(f(t)), f(t + hh))) / hh;
          const n = 90, a = [], b = []; let mx = 0, LE = 0, LS = 0;
          for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * (1 - hh); const s1 = spd(slR, t), s2 = spd(eul, t); a.push([t, s1]); b.push([t, s2]); mx = Math.max(mx, s1, s2); LS += s1 / n; LE += s2 / n; }
          SP.setView([0, 1], [0, Math.max(1, mx * 1.2)]);
          SP.path(b, { color: 'orange', width: 2.2 }); SP.path(a, { color: 'accent', width: 2.6 });
          SP.vline(tS.value, { color: 'gold', dash: true });
          const Om = 2 * Math.acos(clamp(Math.abs(qDot(q0, q1)), 0, 1));
          st = { q0, q1, LE, LS, Om, d: qDot(q0, q1), ns: qNorm(sl(tS.value)), R: slR(tS.value) };
        });
        v.legend([['accent', 'slerp'], ['orange', 'Euler-angle lerp'], ['gold', 'current $t$']]);
        v.readout(() => {
          if (!st) return '';
          const { q0, q1, LE, LS, d, ns, R } = st, f = (q) => `(${q.map((x) => fx(x, 2)).join(',')})`;
          return `$q_0=${f(q0)}$, $q_1=${f(q1)}$, $q_0\\!\\cdot q_1=${fx(d, 3)}$${d < 0 && !short.value ? ' — negative: this path goes the long way, turning through more than $180^\\circ$' : ''}.\n$|q(t)|=${fx(ns, 6)}$, $\\|R^{\\mathsf T}R-I\\|=${v.sci(orthErr(R) + 1e-17, 2)}$. Total angle turned: slerp $${fx(LS, 3)}$ rad (constant speed), Euler interpolation $${fx(LE, 3)}$ rad${LE > LS * 1.001 ? ' — a longer, uneven route' : ''}.`;
        });
      },
    },
  ],
};
