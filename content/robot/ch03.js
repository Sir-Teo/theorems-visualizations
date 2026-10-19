// Robotics — Chapter 3: Forward kinematics and closed chains
import {
  TAU, DEG, clamp, vadd, vsub, vsc, dot3, cross3, norm3, unit3, I3, mm, mt, mv, madd, msc, mcol, fro, orthErr, Rx, Ry, Rz,
  mkT, Rof, pof, Tmul, Tinv, Tapply, Ttrans, Trot, I4, twistExp, adjoint, mv6,
  AXC, drawFrame, frameLabels, circleAbout, fx, bmat,
  screwRev, screwPris, poe, dhA, dhAmod, arcAbout,
} from './ch03.shared.js';

const sub4 = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const f4 = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((t, x) => t + x * x, 0), 0));
const cn = (x, d = 2) => fx(x, d).replace('-', '−');
const g3 = (a, d = 2) => `(${a.map((x) => fx(x, d)).join(',')})`;
const JC = ['accent', 'orange', 'purple', 'teal', 'pink', 'gold'];

export default {
  collection: 'robot',
  chapter: 3,
  title: 'Forward kinematics and closed chains',
  summary: String.raw`Forward kinematics computes where the end-effector is from the joint values. The product-of-exponentials formula does this with one screw axis per joint and no fuss about frame conventions, while Denavit–Hartenberg parameters give the classical four-number description of each link. Closed chains such as the Stewart–Gough platform reverse the difficulty: their inverse kinematics is easy and their forward kinematics hard, and their singularities come in two kinds, one of which makes the mechanism uncontrollable.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Product-of-exponentials formula',
      statement: String.raw`Consider an open chain of $n$ one-degree-of-freedom joints. In the **home configuration** (all joint values $0$) let $M\in SE(3)$ be the pose of the end-effector frame in the fixed frame $\{s\}$, and let $\mathcal S_i=(\omega_i,v_i)\in\R^6$ be the screw axis of joint $i$, also written in $\{s\}$: for a revolute joint $\omega_i$ is the unit vector along the axis and $v_i=-\omega_i\times q_i$ with $q_i$ any point of the axis; for a prismatic joint $\omega_i=0$ and $v_i$ is the unit direction of sliding. Then for joint values $\theta_1,\dots,\theta_n$ the end-effector pose is
$$T(\theta)=e^{[\mathcal S_1]\theta_1}\,e^{[\mathcal S_2]\theta_2}\cdots e^{[\mathcal S_n]\theta_n}\,M,$$
where each $e^{[\mathcal S_i]\theta_i}\in SE(3)$ is the screw motion of 2.7 and mech-10.19. The joint nearest the base stands leftmost, and the order of the factors matters. Equivalently, with the screw axes $\mathcal B_i=[\mathrm{Ad}_{M^{-1}}]\mathcal S_i$ written in the end-effector frame, $T(\theta)=M\,e^{[\mathcal B_1]\theta_1}\cdots e^{[\mathcal B_n]\theta_n}$.`,
      idea: String.raw`Move only the last joint: the tool turns about the fixed axis $\mathcal S_n$ of the home pose, so $T=e^{[\mathcal S_n]\theta_n}M$. Now let the earlier joints move too. Joint $i$'s axis has been carried by the motion $T_{i-1}=e^{[\mathcal S_1]\theta_1}\cdots e^{[\mathcal S_{i-1}]\theta_{i-1}}$ of everything between it and the base, so its current axis is $\mathrm{Ad}_{T_{i-1}}\mathcal S_i$ (the adjoint of 2.9). Because $e^{[\mathrm{Ad}_T\mathcal S]\theta}=T\,e^{[\mathcal S]\theta}T^{-1}$, turning about the moved axis and then applying $T_{i-1}$ equals applying $T_{i-1}$ first and then turning about the home axis, and the telescoping gives the product above. By Chasles' theorem every rigid motion is a screw motion (mech-10.19), which is why one exponential per joint is enough. No link frames are needed, only $M$ and the $\mathcal S_i$.`,
      caption: String.raw`Move the five joint sliders of this arm (base turn, shoulder, elbow, forearm roll, wrist pitch). The thin dashed lines are the **home** screw axes $\mathcal S_i$, fixed in space; the bold coloured lines are where each joint axis is **now**, namely $\mathrm{Ad}_{T_{i-1}}\mathcal S_i$, carried along by the joints nearer the base. The arm is drawn independently, link by link, and the readout checks that its tool frame equals the product of exponentials. Switch on **reverse the product** to multiply the factors from the other end: the red frame ends up somewhere else, so the order matters.`,
      deps: ['mech-10.19', 'robot-2.6', 'robot-2.7', 'robot-2.9'],
      refs: ['Lynch–Park §4.1'],
      credit: 'R. W. Brockett, 1984 (product-of-exponentials formula for manipulators)',
      tags: ['forward kinematics', 'screw axis', 'product of exponentials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Product_of_exponentials_formula' },
      viz(v) {
        const L1 = 1.0, L2 = 0.9, H0 = 0.45, W1 = 0.25, W2 = 0.35;
        const q = [[0, 0, 0], [0, 0, H0], [L1, 0, H0], [L1 + L2, 0, H0], [L1 + L2 + W1, 0, H0]];
        const w = [[0, 0, 1], [0, -1, 0], [0, -1, 0], [1, 0, 0], [0, -1, 0]];
        const S = w.map((wi, i) => screwRev(wi, q[i]));
        const M = Ttrans([L1 + L2 + W1 + W2, 0, H0]);
        const sl = [
          v.slider('base turn $\\theta_1$ (°)', -180, 180, 40, { step: 1 }),
          v.slider('shoulder $\\theta_2$ (°)', -20, 110, 50, { step: 1 }),
          v.slider('elbow $\\theta_3$ (°)', -140, 140, -80, { step: 1 }),
          v.slider('forearm roll $\\theta_4$ (°)', -180, 180, 60, { step: 1 }),
          v.slider('wrist pitch $\\theta_5$ (°)', -110, 110, 40, { step: 1 }),
        ];
        const rev = v.toggle('reverse the product (wrong order)', false);
        const SC = v.stage({ x: [-1.3, 3.1], y: [-0.9, 1.7], equal: true, axes: false, height: 420, title: 'an arm with its screw axes' });
        const sc = v.scene3(SC, { yaw: -0.85, pitch: 0.3, axes: false, lim: 1.5, axis: 1.2 });
        const B = v.stage({ x: [0, 10], y: [0, 6.6], axes: false, height: 420, title: 'the data of the formula', minWidth: 300 });
        let st = null;
        v.render(() => {
          const th = sl.map((s) => s.value * DEG);
          const Tp = poe(S, th, M), Tw = poe(S, th, M, true);
          // independent construction, link by link
          const locals = [Trot(Rz(th[0])), Tmul(Ttrans([0, 0, H0]), Trot(Ry(-th[1]))), Tmul(Ttrans([L1, 0, 0]), Trot(Ry(-th[2]))), Tmul(Ttrans([L2, 0, 0]), Trot(Rx(th[3]))), Tmul(Ttrans([W1, 0, 0]), Trot(Ry(-th[4]))), Ttrans([W2, 0, 0])];
          const C = []; let acc = I4(); for (const T of locals) { acc = Tmul(acc, T); C.push(acc); }
          const org = [[0, 0, 0], ...C.map(pof)];
          // current axes
          let P = I4(); const cur = [];
          for (let i = 0; i < 5; i++) { cur.push({ p: Tapply(P, q[i]), d: mv(Rof(P), w[i]) }); P = Tmul(P, twistExp(S[i].map((x) => x * th[i]))); }
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.4 * Math.cos(t), 0.4 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false });
          sc.line(org[0], org[1], { color: 'muted', width: 7 });
          sc.line(org[1], org[3], { color: 'accent', width: 7, alpha: 0.85 }); sc.line(org[3], org[4], { color: 'orange', width: 7, alpha: 0.85 });
          sc.line(org[4], org[5], { color: 'purple', width: 7, alpha: 0.85 }); sc.line(org[5], org[6], { color: 'teal', width: 6, alpha: 0.9 });
          for (let i = 0; i < 5; i++) {
            sc.line(vadd(q[i], vsc(w[i], -0.62)), vadd(q[i], vsc(w[i], 0.62)), { color: JC[i], width: 1.3, dash: true, alpha: 0.5, top: false });
            sc.line(vadd(cur[i].p, vsc(cur[i].d, -0.62)), vadd(cur[i].p, vsc(cur[i].d, 0.62)), { color: JC[i], width: 3, alpha: 0.95 });
            sc.tex(`\\mathcal S_${i + 1}`, vadd(q[i], vadd(vsc(w[i], 0.72), i === 0 ? [0.1, 0, 0] : [0, 0, 0])), { color: JC[i], size: 12 });
          }
          for (const o of org) sc.dot(o, { color: 'ink', r: 3 });
          drawFrame(sc, I3(), [0, 0, 0], 0.45, { width: 1.6, alpha: 0.7, color: 'muted' });
          drawFrame(sc, Rof(Tp), pof(Tp), 0.4, { width: 3 });
          sc.dot(pof(Tp), { color: 'gold', r: 5 });
          if (rev.value) { drawFrame(sc, Rof(Tw), pof(Tw), 0.4, { color: 'red', width: 2.6 }); sc.dot(pof(Tw), { color: 'red', r: 6 }); sc.tex('\\text{reversed}', vadd(pof(Tw), [0, 0, 0.3]), { color: 'red', size: 12 }); }
          sc.flush();
          // table of the screw axes
          B.text('screw axes in the fixed frame', 0.2, 6.2, { size: 12.5, color: 'muted', align: 'left' });
          B.text('ω', 3.0, 5.6, { size: 14, color: 'muted', align: 'center', math: true }); B.text('v = −ω × q', 6.6, 5.6, { size: 14, color: 'muted', align: 'center', math: true }); B.text('θ', 9.3, 5.6, { size: 14, color: 'muted', align: 'center', math: true });
          for (let i = 0; i < 5; i++) {
            const y = 4.8 - i * 0.82;
            B.rect(0.1, y - 0.34, 9.9, y + 0.34, { fill: JC[i], fillAlpha: 0.1, color: JC[i], width: 1, radius: 4 });
            B.tex(`\\mathcal S_${i + 1}`, 0.7, y, { color: JC[i], size: 15, align: 'center' });
            B.text(`(${w[i].map((x) => cn(x, 0)).join(', ')})`, 3.0, y, { size: 13.5, align: 'center', baseline: 'middle', color: 'ink' });
            B.text(`(${S[i].slice(3).map((x) => cn(x, 2)).join(', ')})`, 6.6, y, { size: 13.5, align: 'center', baseline: 'middle', color: 'ink' });
            B.text(`${cn(sl[i].value, 0)}°`, 9.3, y, { size: 13.5, align: 'center', baseline: 'middle', color: JC[i] });
          }
          B.tex('T(\\theta)=e^{[\\mathcal S_1]\\theta_1}\\cdots e^{[\\mathcal S_5]\\theta_5}\\,M', 5.0, 0.7, { size: 15, align: 'center', color: 'ink' });
          st = { Tp, Tw, err: f4(sub4(Tp, C[5])), wrong: norm3(vsub(pof(Tw), pof(Tp))), wrongR: f4(sub4(Tw, Tp)) };
        });
        v.readout(() => {
          if (!st) return '';
          const p = pof(st.Tp);
          return `Tool position from the product of exponentials: $${g3(p)}$. Built link by link (rotate, move along the link, rotate, …) the tool frame differs by $\\|T_{\\rm exp}-T_{\\rm links}\\|=${v.sci(st.err + 1e-17, 2)}$, so the formula reproduces the geometry, with only five screw axes and one home pose $M$ (tool at $(${fx(M[0][3])},0,${fx(M[2][3])})$).\nMultiplying the same exponentials in the reverse order puts the tool at a point $${v.fix(st.wrong, 3)}$ away${rev.value ? ' (the red frame)' : ''}: the factors do not commute.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Method',
      name: 'Denavit–Hartenberg parameters',
      statement: String.raw`The **Denavit–Hartenberg (DH) convention** describes a serial chain of one-degree-of-freedom joints with four numbers per link. Number the joints $1,\dots,n$ and attach to link $i$ a frame $\{i\}$ in the following way (**classical form**): $z_{i-1}$ lies along the axis of joint $i$; $x_i$ is perpendicular to $z_{i-1}$ and intersects it; $y_i$ completes a right-handed frame. Frame $\{0\}$ sits on the base. The four parameters of link $i$ are
- $\theta_i$: the angle from $x_{i-1}$ to $x_i$ about $z_{i-1}$;
- $d_i$: the distance from $O_{i-1}$ to the foot of the common perpendicular, measured along $z_{i-1}$;
- $a_i$: the length of the common perpendicular, measured along $x_i$;
- $\alpha_i$: the angle from $z_{i-1}$ to $z_i$ about $x_i$.

Exactly one of $\theta_i$ (revolute) or $d_i$ (prismatic) is the joint variable. The pose of frame $i$ relative to frame $i-1$ is $A_i=\mathrm{Rot}(z,\theta_i)\,\mathrm{Trans}(z,d_i)\,\mathrm{Trans}(x,a_i)\,\mathrm{Rot}(x,\alpha_i)$, and the end-effector pose is $T_{0n}=A_1A_2\cdots A_n$. (Some books, including Lynch–Park, use a *modified* form in which the frame is attached to the near end of each link and the product is $\mathrm{Rot}(x,\alpha_{i-1})\mathrm{Trans}(x,a_{i-1})\mathrm{Rot}(z,\theta_i)\mathrm{Trans}(z,d_i)$; the numbers are indexed differently.)`,
      idea: String.raw`Two skew lines (the axes of consecutive joints) have a unique common perpendicular, and the pair is described up to rigid motion by its length $a_i$ and the twist angle $\alpha_i$ between the lines. Placing $x_i$ along the common perpendicular fixes the frame except for how far along $z_{i-1}$ and how much about $z_{i-1}$ it sits, which are $d_i$ and $\theta_i$. A general rigid motion has six parameters; the two rules on $x_i$ (perpendicular to, and meeting, $z_{i-1}$) remove two, leaving four. For each rule-abiding choice, $A_i$ is a product of four elementary motions and the chain is a matrix product (item 2.6). The same pose is obtained from the product of exponentials of 3.1 by reading the screw axes off the zero-configuration frames: joint $i$ turns about $z_{i-1}$ through $O_{i-1}$.`,
      caption: String.raw`Choose a robot (a 3R elbow arm, or a SCARA with a sliding third joint) and move its joints. Each frame $\{i\}$ shows its $z$ (blue) and $x$ (red) axes. Pick a **link** $i$ to dissect: the orange segment is $d_i$ along $z_{i-1}$, the purple segment is $a_i$ along $x_i$, and the two arcs are $\theta_i$ (about $z_{i-1}$) and $\alpha_i$ (about $x_i$). The table lists the four numbers of every link; the joint variable is shaded orange. The readout checks the two frame rules and compares the DH product with the product of exponentials built from the same frames.`,
      deps: ['robot-2.6'],
      refs: ['Lynch–Park App. C', 'Siciliano ch. 2'],
      credit: 'J. Denavit & R. S. Hartenberg, 1955',
      tags: ['Denavit–Hartenberg', 'forward kinematics', 'frames'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Denavit%E2%80%93Hartenberg_parameters' },
      viz(v) {
        const ROB = {
          elbow: { n: 3, rows: [{ t: 'R', d: 0.55, a: 0, al: 90 }, { t: 'R', d: 0, a: 1.0, al: 0 }, { t: 'R', d: 0, a: 0.8, al: 0 }], name: 'elbow arm RRR' },
          scara: { n: 4, rows: [{ t: 'R', d: 0.7, a: 1.0, al: 0 }, { t: 'R', d: 0, a: 0.8, al: 180 }, { t: 'P', d: 0.25, a: 0, al: 0 }, { t: 'R', d: 0.12, a: 0, al: 0 }], name: 'SCARA RRPR' },
        };
        const which = v.select('robot', [{ value: 'elbow', label: 'elbow arm (RRR)' }, { value: 'scara', label: 'SCARA (RRPR)' }], 'elbow');
        const a1 = v.slider('$q_1$ (°)', -180, 180, 35, { step: 1 }), a2 = v.slider('$q_2$ (°)', -150, 150, 40, { step: 1 });
        const a3 = v.slider('elbow arm $q_3$ / SCARA $q_4$ (°)', -150, 150, -60, { step: 1 }), sl = v.slider('SCARA slide $q_3$ (length)', 0, 0.5, 0.15, { step: 0.01 });
        const link = v.select('dissect link', ['1', '2', '3', '4'], '2');
        const SC = v.stage({ x: [-1.7, 2.7], y: [-0.9, 1.7], equal: true, axes: false, height: 420, title: 'frames attached by the DH rules' });
        const sc = v.scene3(SC, { yaw: -0.8, pitch: 0.3, axes: false, lim: 1.5, axis: 1.2 });
        const B = v.stage({ x: [0, 10], y: [0, 7.4], axes: false, height: 420, title: 'the DH table', minWidth: 300 });
        const frames = (rob, q) => {
          const F = [I4()], rows = [];
          rob.rows.forEach((r, i) => {
            const th = r.t === 'R' ? q[i] : 0, d = r.d + (r.t === 'P' ? q[i] : 0), A = dhA(th, d, r.a, r.al * DEG);
            rows.push({ th, d, a: r.a, al: r.al * DEG }); F.push(Tmul(F[i], A));
          });
          return { F, rows };
        };
        let st = null;
        v.render(() => {
          const key = which.value, rob = ROB[key], n = rob.n;
          sl.el.hidden = key !== 'scara';
          const q = key === 'elbow' ? [a1.value * DEG, a2.value * DEG, a3.value * DEG] : [a1.value * DEG, a2.value * DEG, sl.value, a3.value * DEG];
          const { F, rows } = frames(rob, q), { F: F0 } = frames(rob, q.map(() => 0));
          const ik = Math.min(+link.value, n);
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.4 * Math.cos(t), 0.4 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false });
          // links: O_{i-1} -> foot -> O_i
          let chk = 0, chkLine = 0;
          for (let i = 1; i <= n; i++) {
            const Op = pof(F[i - 1]), zp = mcol(Rof(F[i - 1]), 2), Oi = pof(F[i]), xi = mcol(Rof(F[i]), 0), foot = vadd(Op, vsc(zp, rows[i - 1].d));
            sc.line(Op, foot, { color: JC[i - 1], width: 6, alpha: 0.85 }); sc.line(foot, Oi, { color: JC[i - 1], width: 6, alpha: 0.85 });
            sc.line(vadd(Op, vsc(zp, -0.55)), vadd(Op, vsc(zp, 0.55)), { color: JC[i - 1], width: 1.3, dash: true, alpha: 0.6, top: false });
            chk = Math.max(chk, Math.abs(dot3(xi, zp)));
            const cr = cross3(xi, zp), cn2 = norm3(cr); chkLine = Math.max(chkLine, cn2 < 1e-9 ? 0 : Math.abs(dot3(vsub(Oi, Op), cr)) / cn2);
          }
          for (let i = 0; i <= n; i++) {
            const R = Rof(F[i]), p = pof(F[i]), big = i === ik || i === ik - 1;
            sc.arrow(p, vadd(p, vsc(mcol(R, 2), big ? 0.42 : 0.28)), { color: 'accent', width: big ? 2.8 : 1.8, head: 8 });
            sc.arrow(p, vadd(p, vsc(mcol(R, 0), big ? 0.42 : 0.28)), { color: 'red', width: big ? 2.8 : 1.8, head: 8 });
            sc.dot(p, { color: 'ink', r: 3.2 });
            sc.tex(`\\{${i}\\}`, vadd(p, vadd(vsc(mcol(R, 0), -0.1), [0, 0, -0.18])), { color: 'muted', size: 11.5 });
          }
          // dissected link
          {
            const Op = pof(F[ik - 1]), zp = mcol(Rof(F[ik - 1]), 2), xp = mcol(Rof(F[ik - 1]), 0), Oi = pof(F[ik]), xi = mcol(Rof(F[ik]), 0), zi = mcol(Rof(F[ik]), 2);
            const r = rows[ik - 1], foot = vadd(Op, vsc(zp, r.d));
            if (Math.abs(r.d) > 1e-6) { sc.line(Op, foot, { color: 'orange', width: 4.5 }); sc.tex(`d_${ik}`, vadd(vadd(Op, vsc(zp, r.d / 2)), vsc(xp, -0.14)), { color: 'orange', size: 13 }); }
            if (Math.abs(r.a) > 1e-6) { sc.line(foot, Oi, { color: 'purple', width: 4.5 }); sc.tex(`a_${ik}`, vadd(vadd(foot, vsc(vsub(Oi, foot), 0.5)), [0, 0, 0.14]), { color: 'purple', size: 13 }); }
            if (Math.abs(r.th) > 1e-3) sc.path(arcAbout(foot, zp, xp, r.th, 0.3), { color: 'orange', width: 2.2 });
            if (Math.abs(r.al) > 1e-3) sc.path(arcAbout(Oi, xi, zp, r.al, 0.3), { color: 'purple', width: 2.2 });
            void zi;
          }
          sc.flush();
          // table
          const cols = [1.6, 3.6, 5.6, 7.6, 9.2];
          B.text('link', cols[0], 6.8, { size: 12.5, color: 'muted', align: 'center' });
          ['\\theta_i\\ (^\\circ)', 'd_i', 'a_i', '\\alpha_i\\ (^\\circ)'].forEach((h, k) => B.tex(h, cols[k + 1], 6.8, { size: 14, color: 'muted', align: 'center' }));
          for (let i = 0; i < n; i++) {
            const y = 5.8 - i * 0.95, r = rows[i], sel = i + 1 === ik, isP = rob.rows[i].t === 'P';
            B.rect(0.15, y - 0.4, 9.85, y + 0.4, { fill: sel ? 'accent' : 'muted', fillAlpha: sel ? 0.14 : 0.05, color: sel ? 'accent' : 'faint', width: sel ? 1.8 : 1, radius: 4 });
            B.text(String(i + 1), cols[0], y, { size: 14, align: 'center', baseline: 'middle', color: JC[i] });
            const vals = [r.th / DEG, r.d, r.a, r.al / DEG], dec = [1, 2, 2, 1];
            vals.forEach((x, k) => {
              const isVar = (k === 0 && !isP) || (k === 1 && isP);
              if (isVar) B.rect(cols[k + 1] - 0.85, y - 0.3, cols[k + 1] + 0.85, y + 0.3, { fill: 'orange', fillAlpha: 0.28, color: 'orange', width: 1, radius: 4 });
              B.text(cn(x, dec[k]), cols[k + 1], y, { size: 13.5, align: 'center', baseline: 'middle', color: 'ink' });
            });
          }
          B.text('shaded = the joint variable', 5, 0.55, { size: 12, color: 'orange', align: 'center' });
          // product of exponentials built from the zero-configuration frames
          let Pm = I4();
          for (let i = 0; i < n; i++) {
            const z = mcol(Rof(F0[i]), 2), o = pof(F0[i]), S = rob.rows[i].t === 'R' ? screwRev(z, o) : screwPris(z);
            Pm = Tmul(Pm, twistExp(S.map((x) => x * q[i])));
          }
          const Tpoe = Tmul(Pm, F0[n]);
          st = { err: f4(sub4(Tpoe, F[n])), chk, chkLine, tip: pof(F[n]), n, rob, key };
        });
        v.readout(() => {
          if (!st) return '';
          return `${st.rob.name}: the frame rules hold, $\\max_i|x_i\\cdot z_{i-1}|=${v.sci(st.chk + 1e-17, 1)}$ and the line of $x_i$ meets the axis $z_{i-1}$ (distance $${v.sci(st.chkLine + 1e-17, 1)}$).\nEnd frame $T_{0${st.n}}=A_1\\cdots A_${st.n}$ puts the tip at $${g3(st.tip)}$. The product of exponentials with $\\mathcal S_i$ read off the zero-configuration frames ($\\omega_i=z_{i-1}$ through $O_{i-1}$; a slide for the prismatic joint) gives the same matrix: $\\|T_{\\rm DH}-T_{\\rm PoE}\\|=${v.sci(st.err + 1e-17, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Planar 2R and 3R arms',
      statement: String.raw`A planar $nR$ arm has $n$ revolute joints with parallel axes (perpendicular to the plane) and links of lengths $\ell_1,\dots,\ell_n$. With joint angles $\theta_i$ measured each from the previous link, the tool position and heading are, for $n=2$ and $n=3$,
$$x=\ell_1\cos\theta_1+\ell_2\cos(\theta_1+\theta_2)\;[+\ell_3\cos(\theta_1+\theta_2+\theta_3)],\qquad y=\ell_1\sin\theta_1+\ell_2\sin(\theta_1+\theta_2)\;[+\ell_3\sin(\theta_1+\theta_2+\theta_3)],$$
and $\phi=\theta_1+\cdots+\theta_n$. The same pose is the $3\times3$ matrix product $\prod_i \mathrm{Rot}(\theta_i)\mathrm{Trans}(\ell_i,0)$ in $SE(2)$, and the product of exponentials with screw axes $\mathcal S_i=(1;\,y_i,\,-x_i)$ through the joint centres $(x_i,y_i)$ of the home pose (arm stretched along the $x$-axis). The reachable set of the tip is the annulus $\max(0,\,2\ell_{\max}-\sum\ell_i)\le r\le\sum\ell_i$.`,
      idea: String.raw`Each link adds a vector of fixed length whose direction is the running sum of the joint angles, because rotations about parallel axes compose by adding angles; so the closed form is a sum of $n$ unit vectors. The $SE(2)$ product does the same with matrices, and the exponentials of 3.1 turn each joint into a rotation about a fixed point. For $n=2$ the tip distance from the base is $\sqrt{\ell_1^2+\ell_2^2+2\ell_1\ell_2\cos\theta_2}$ (law of cosines), which sweeps from $|\ell_1-\ell_2|$ to $\ell_1+\ell_2$ as $\theta_2$ goes round the circle and gives the annulus. With three links the heading is no longer tied to the position, which anticipates the redundancy of chapter 4.`,
      caption: String.raw`Drag the joint handles to set the angles (each handle sits at the end of its link), or change the link lengths. The dashed circles are the paths of the tip when only joint 1 (blue) or only joint 2 (orange) moves; the shaded ring is the set the tip can reach. The orange arrow at the tip is the heading $\phi$. Switch between $2$R and $3$R: in the 3R arm the same tip point has many headings.`,
      deps: ['robot-3.1', 'robot-2.6'],
      refs: ['Lynch–Park §4.1'],
      tags: ['planar arm', 'forward kinematics', 'SE(2)'],
      viz(v) {
        const mode = v.select('arm', [{ value: '2', label: '2R' }, { value: '3', label: '3R' }], '2');
        const l1 = v.slider('$\\ell_1$', 0.4, 1.2, 1.2, { step: 0.01 }), l2 = v.slider('$\\ell_2$', 0.4, 1.2, 0.9, { step: 0.01 }), l3 = v.slider('$\\ell_3$', 0.4, 1.2, 0.7, { step: 0.01 });
        const loci = v.toggle('show the tip paths of single joints', true);
        const S = v.stage({ x: [-3.7, 3.7], y: [-3.3, 3.3], equal: true, axes: false, height: 400, title: 'a planar arm' });
        let th = [0.8, 0.9, -0.7];
        const Ls = () => [l1.value, l2.value, l3.value];
        const ends = (n) => { const L = Ls(), pts = [[0, 0]]; let a = 0, x = 0, y = 0; for (let i = 0; i < n; i++) { a += th[i]; x += L[i] * Math.cos(a); y += L[i] * Math.sin(a); pts.push([x, y]); } return pts; };
        const hs = [0, 1, 2].map((i) => S.handle(1, 0, { color: JC[i], r: 7, label: `θ${i + 1}` }));
        hs.forEach((h, i) => {
          h.constrain = (x, y) => {
            const n = +mode.value, pts = ends(n);
            if (i >= n) return [pts[n][0], pts[n][1]];
            const c = pts[i], absAng = Math.atan2(y - c[1], x - c[0]);
            let pre = 0; for (let k = 0; k < i; k++) pre += th[k];
            th[i] = absAng - pre;
            const e = ends(n); return [e[i + 1][0], e[i + 1][1]];
          };
        });
        const circ = (c, r) => { const o = []; for (let k = 0; k <= 80; k++) o.push([c[0] + r * Math.cos((TAU * k) / 80), c[1] + r * Math.sin((TAU * k) / 80)]); return o; };
        let st = null;
        v.render(() => {
          const n = +mode.value, L = Ls().slice(0, n), tot = L.reduce((a, b) => a + b, 0), lmax = Math.max(...L), inner = Math.max(0, 2 * lmax - tot);
          l3.el.hidden = n < 3;
          const pts = ends(n);
          hs.forEach((h, i) => { h.visible = i < n; if (i < n) h.set(pts[i + 1][0], pts[i + 1][1]); });
          S.rings([circ([0, 0], tot), circ([0, 0], inner)], { evenodd: true, fill: 'green', fillAlpha: 0.1, color: 'green', width: 1.2 });
          S.text('reachable', 0, tot + 0.2, { size: 11.5, color: 'green', align: 'center' });
          if (loci.value) {
            S.circle(0, 0, Math.hypot(pts[n][0], pts[n][1]), { color: 'accent', width: 1.2, dash: [5, 4], fill: false, alpha: 0.7 });
            if (n >= 2) S.circle(pts[1][0], pts[1][1], Math.hypot(pts[n][0] - pts[1][0], pts[n][1] - pts[1][1]), { color: 'orange', width: 1.2, dash: [5, 4], fill: false, alpha: 0.7 });
          }
          for (let i = 0; i < n; i++) {
            S.segment(pts[i], pts[i + 1], { color: JC[i], width: 7, alpha: 0.85 });
          }
          pts.forEach((p, i) => { S.circle(p[0], p[1], 0.07, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }); void i; });
          const phi = th.slice(0, n).reduce((a, b) => a + b, 0), tp = pts[n];
          S.arrow(tp[0], tp[1], tp[0] + 0.55 * Math.cos(phi), tp[1] + 0.55 * Math.sin(phi), { color: 'orange', width: 3, head: 10 });
          S.dot(tp[0], tp[1], { color: 'gold', r: 6 });
          // three computations of the same pose
          const Lall = Ls();
          let x = 0, y = 0, a = 0;
          for (let i = 0; i < n; i++) { a += th[i]; x += Lall[i] * Math.cos(a); y += Lall[i] * Math.sin(a); }
          // SE(2) product written out explicitly
          const R2 = (t) => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]], Tr = (l) => [[1, 0, l], [0, 1, 0], [0, 0, 1]];
          const m3 = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
          let P2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; for (let i = 0; i < n; i++) P2 = m3(P2, m3(R2(th[i]), Tr(Lall[i])));
          // product of exponentials
          const Sx = [], home = []; { let cx = 0; for (let i = 0; i < n; i++) { home.push([cx, 0, 0]); Sx.push(screwRev([0, 0, 1], [cx, 0, 0])); cx += Lall[i]; } const M = Ttrans([cx, 0, 0]); const Tpoe = poe(Sx, th.slice(0, n), M);
            st = { x, y, phi: a, e2: Math.hypot(P2[0][2] - x, P2[1][2] - y, Math.atan2(P2[1][0], P2[0][0]) - Math.atan2(Math.sin(a), Math.cos(a))), ePoe: Math.hypot(Tpoe[0][3] - x, Tpoe[1][3] - y, Tpoe[2][3]), n, r: Math.hypot(x, y), tot, inner }; }
        });
        v.readout(() => {
          if (!st) return '';
          const { x, y, phi, n } = st, phiw = ((phi + Math.PI) % TAU + TAU) % TAU - Math.PI;
          return `Tool $(x,y)=(${cn(x, 3)},${cn(y, 3)})$, heading $\\phi=${cn(phiw / DEG, 1)}^\\circ$, distance $r=${fx(st.r, 3)}\\in[${fx(st.inner, 2)},${fx(st.tot, 2)}]$.\nThe closed form, the $SE(2)$ matrix product $\\prod\\mathrm{Rot}(\\theta_i)\\mathrm{Trans}(\\ell_i,0)$ and the ${n}-factor product of exponentials agree: largest difference $${v.sci(Math.max(st.e2, st.ePoe) + 1e-17, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Model',
      name: 'The six-axis arm with a spherical wrist',
      statement: String.raw`A common industrial arm has six revolute joints, the last three of whose axes meet in a single point $W$, the **wrist centre** (a **spherical wrist**). Write $R_{\rm arm}(\theta_1,\theta_2,\theta_3)$ for the orientation of the forearm frame and $R_{\rm w}(\theta_4,\theta_5,\theta_6)$ for the rotation produced by the wrist, so that the tool orientation is $R=R_{\rm arm}R_{\rm w}$. Then: (a) the position of $W$ depends only on $\theta_1,\theta_2,\theta_3$, and the tool position is $p_W+d\,R\,e_x$ for a fixed tool offset $d$; (b) with the wrist built as roll–pitch–roll, $R_{\rm w}=R_x(\theta_4)R_y(\theta_5)R_x(\theta_6)$, any desired $R$ is reached by choosing $\theta_4,\theta_5,\theta_6$ from the matrix $R_{\rm w}=R_{\rm arm}^{\mathsf T}R$, except at the **wrist singularity** $\sin\theta_5=0$, where only $\theta_4+\theta_6$ (or $\theta_4-\theta_6$) matters. In the model drawn here the first three joints are a base turn about the vertical axis followed by two pitch joints.`,
      idea: String.raw`Forward kinematics is the product of exponentials of 3.1 (or the matrix product of 2.6). Each of the three wrist axes passes through $W$, so a rotation about any of them fixes $W$; hence the last three factors only rotate the frame about $W$, and $p_W$ is a function of $\theta_1,\theta_2,\theta_3$ alone. Conversely the first three joints move the point $W$ and also rotate the forearm, but the wrist can undo that rotation because three roll–pitch–roll angles cover every orientation, which is the same count as in 2.1: three numbers in $SO(3)$. This is the kinematic decoupling that makes the inverse problem for such arms solvable in two stages (position first, then orientation).`,
      caption: String.raw`The six sliders are the joints. Move **joints 4–6**: the gold wrist centre does not budge, only the tool frame turns. Move **joints 1–3**: the wrist centre moves on the sphere of reach about the shoulder (the faint circles show its horizontal and vertical sections, reached when the elbow is straight) and the tool frame rotates with the forearm. Switch on **hold the tool orientation**: joints 4–6 then adjust themselves (roll–pitch–roll solved from $R_{\rm arm}^{\mathsf T}R$) so the tool keeps pointing down while joints 1–3 place it. Put joint 5 at $0^\circ$ to meet the wrist singularity.`,
      deps: ['robot-3.1', 'robot-2.1'],
      refs: ['Lynch–Park §4.1', 'Siciliano ch. 2'],
      tags: ['industrial arm', 'wrist centre', 'decoupling'],
      viz(v) {
        const H0 = 0.5, LU = 1.1, LF = 1.0, DT = 0.55;
        const s1 = v.slider('base turn $\\theta_1$ (°)', -180, 180, 30, { step: 1 }), s2 = v.slider('shoulder $\\theta_2$ (°)', -20, 110, 50, { step: 1 }), s3 = v.slider('elbow $\\theta_3$ (°)', -140, 140, -70, { step: 1 });
        const s4 = v.slider('wrist roll $\\theta_4$ (°)', -180, 180, 40, { step: 1 }), s5 = v.slider('wrist pitch $\\theta_5$ (°)', -179, 179, 50, { step: 1 }), s6 = v.slider('tool roll $\\theta_6$ (°)', -180, 180, -30, { step: 1 });
        const hold = v.toggle('hold the tool orientation (pointing down) while moving joints 1–3', false);
        const SC = v.stage({ x: [-2.8, 2.8], y: [-1.8, 2.8], equal: true, axes: false, height: 430, title: 'six joints, the last three meeting at one point' });
        const sc = v.scene3(SC, { yaw: -0.85, pitch: 0.3, axes: false, lim: 1.5, axis: 1.2 });
        const Rref = Ry(90 * DEG); // tool x-axis pointing straight down
        let st = null;
        v.render(() => {
          const t1 = s1.value * DEG, t2 = s2.value * DEG, t3 = s3.value * DEG;
          const Rarm = mm(Rz(t1), mm(Ry(-t2), Ry(-t3)));
          const Parm = (() => { let T = Trot(Rz(t1)); T = Tmul(T, Tmul(Ttrans([0, 0, H0]), Trot(Ry(-t2)))); const Tel = Tmul(T, Tmul(Ttrans([LU, 0, 0]), Trot(Ry(-t3)))); return { T, Tel }; })();
          const Wc = pof(Tmul(Parm.Tel, Ttrans([LF, 0, 0])));
          let t4 = s4.value * DEG, t5 = s5.value * DEG, t6 = s6.value * DEG;
          if (hold.value) {
            const Rw = mm(mt(Rarm), Rref), cb = clamp(Rw[0][0], -1, 1);
            t5 = Math.acos(cb);
            if (Math.abs(Math.sin(t5)) < 1e-9) { t4 = 0; t6 = Math.atan2(Rw[2][1], Rw[1][1]); }
            else { t4 = Math.atan2(Rw[1][0], -Rw[2][0]); t6 = Math.atan2(Rw[0][1], Rw[0][2]); }
          }
          const Rw = mm(Rx(t4), mm(Ry(t5), Rx(t6))), R = mm(Rarm, Rw);
          const tool = vadd(Wc, vsc(mcol(R, 0), DT));
          // wrist centre must not depend on 4..6: recompute with another wrist setting
          const R2 = mm(Rarm, mm(Rx(t4 + 1.1), mm(Ry(t5 - 0.7), Rx(t6 + 2.0)))), tool2 = vadd(Wc, vsc(mcol(R2, 0), DT));
          const oS = [0, 0, H0], oE = pof(Parm.Tel);
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.4 * Math.cos(t), 0.4 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false });
          { const c = [], c2 = [], ex = [Math.cos(t1), Math.sin(t1), 0]; for (let k = 0; k <= 64; k++) { const t = (TAU * k) / 64; c.push(vadd(oS, [(LU + LF) * Math.cos(t), (LU + LF) * Math.sin(t), 0])); c2.push(vadd(oS, vadd(vsc(ex, (LU + LF) * Math.cos(t)), [0, 0, (LU + LF) * Math.sin(t)]))); }
            sc.path(c, { color: 'faint', width: 1.2, alpha: 0.9, top: false }); sc.path(c2, { color: 'faint', width: 1.2, alpha: 0.9, top: false }); }
          sc.line([0, 0, 0], oS, { color: 'muted', width: 7 });
          sc.line(oS, oE, { color: 'accent', width: 7, alpha: 0.85 }); sc.line(oE, Wc, { color: 'orange', width: 7, alpha: 0.85 });
          sc.line(Wc, tool, { color: 'muted', width: 4 });
          const ax4 = mcol(Rarm, 0), ax5 = mcol(mm(Rarm, Rx(t4)), 1), ax6 = mcol(mm(Rarm, mm(Rx(t4), Ry(t5))), 0);
          [[ax4, 'purple', '4'], [ax5, 'teal', '5'], [ax6, 'pink', '6']].forEach(([a, c, nm]) => {
            sc.line(vsub(Wc, vsc(a, 0.42)), vadd(Wc, vsc(a, 0.42)), { color: c, width: 2.6 });
            sc.tex(`\\theta_${nm}`, vadd(Wc, vsc(a, 0.56)), { color: c, size: 12 });
          });
          drawFrame(sc, I3(), [0, 0, 0], 0.45, { width: 1.6, alpha: 0.7, color: 'muted' });
          drawFrame(sc, R, tool, 0.35, { width: 3 });
          sc.dot(Wc, { color: 'gold', r: 7 });
          sc.tex('W', vadd(Wc, [0.0, 0.0, 0.22]), { color: 'gold', size: 15 });
          sc.flush();
          void tool2;
          st = { Wc, tool, dW: norm3(vsub(vsub(tool2, vsc(mcol(R2, 0), DT)), Wc)), t4, t5, t6, R, singular: Math.abs(Math.sin(t5)) < 0.02, hold: hold.value, dRot: orthErr(R) };
        });
        s4.el.hidden = s5.el.hidden = s6.el.hidden = false;
        v.readout(() => {
          if (!st) return '';
          const d = (x) => cn(x / DEG, 1);
          return `Wrist centre $W=${g3(st.Wc)}$ — it is fixed by $\\theta_1,\\theta_2,\\theta_3$: changing the wrist angles to a different triple moves it by $${v.sci(st.dW + 1e-17, 1)}$\nTool position $p_W+d\\,Re_x=${g3(st.tool)}$, $\\|R^{\\mathsf T}R-I\\|=${v.sci(st.dRot + 1e-17, 1)}$.\n${st.hold ? `Holding the tool pointing down, the wrist solved for $(\\theta_4,\\theta_5,\\theta_6)=(${d(st.t4)}^\\circ,${d(st.t5)}^\\circ,${d(st.t6)}^\\circ)$ (the sliders are overridden).` : `Wrist angles $(${d(st.t4)}^\\circ,${d(st.t5)}^\\circ,${d(st.t6)}^\\circ)$.`}${st.singular ? ' **Wrist singularity:** axes 4 and 6 coincide, only $\\theta_4+\\theta_6$ matters.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Paper',
      name: 'A Kinematic Notation for Lower-Pair Mechanisms',
      paper: { authors: 'J. Denavit and R. S. Hartenberg', year: 1955, title: 'A Kinematic Notation for Lower-Pair Mechanisms Based on Matrices', venue: 'Journal of Applied Mechanics 22 (2): 215–221', doi: '10.1115/1.4011045' },
      introduces: ['robot-3.2'],
      credit: 'J. Denavit & R. S. Hartenberg, 1955',
      statement: String.raw`Denavit and Hartenberg proposed a systematic way to describe any **lower-pair mechanism** (one whose joints are surface contacts: revolute, prismatic, helical, cylindrical, spherical, planar pairs) so that its kinematics can be handled by matrix algebra. In the modern revolute/prismatic serial-chain convention illustrated here, attaching a coordinate frame to each link reduces each consecutive transform to **four parameters**, a joint angle, an offset along the joint axis, a link length and a twist angle; each pair of frames is related by a $4\times4$ matrix built from those four numbers, and the pose of the last link in the first is the product of these matrices. The notation covers space mechanisms as well as planar ones. Here we use today's names and symbols $(\theta_i,d_i,a_i,\alpha_i)$ and the classical product $A_i=\mathrm{Rot}(z,\theta_i)\mathrm{Trans}(z,d_i)\mathrm{Trans}(x,a_i)\mathrm{Rot}(x,\alpha_i)$; the paper's own symbols and frame placement are not reproduced.`,
      idea: String.raw`Before this paper the common symbolic language for mechanisms was Reuleaux's notation, which, the authors argued, did not record all the numbers needed to describe a mechanism completely. Denavit and Hartenberg gave a rule for placing the frames and a $4\times4$ matrix for each link, which turned loop-closure and position analysis into matrix algebra on a computer or by hand. Their four-number description became the **Denavit–Hartenberg parameters** (3.2), later the standard table of robot manufacturers' kinematics, and it rests on the homogeneous matrices of 2.6. Modern books use both classical and modified DH conventions; their frame placements and parameter indexing must not be interchanged. General multi-degree-of-freedom lower pairs require appropriate joint decomposition rather than treating each as one scalar revolute or prismatic joint. This summary follows the paper's abstract and standard accounts of it, not a reading of its full text.`,
      verify: true,
      caption: String.raw`Build a serial chain of up to four links: pick a **link**, then set its four parameters $(a,\alpha,d,\theta)$ with the sliders. The frames the convention attaches are drawn on the chain (red $x$, blue $z$), the link table is shown on the right, and the pose of the last frame is the product of the $4\times4$ matrices. Switch the **convention** between the classical form and the modified form: the frames move, the table is re-indexed, and the final pose is unchanged. This is a reconstruction in modern notation, not the paper's own figures or data.`,
      deps: ['robot-2.6'],
      see: ['robot-3.2'],
      refs: [],
      tags: ['Denavit–Hartenberg', 'lower pair', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Denavit%E2%80%93Hartenberg_parameters' },
      viz(v) {
        const P = [
          { a: 0, al: 90, d: 0.6, th: 30 }, { a: 1.0, al: 0, d: 0, th: 40 }, { a: 0.8, al: 0, d: 0, th: -50 }, { a: 0.4, al: -90, d: 0.2, th: 20 },
        ];
        const nJ = v.slider('number of links', 1, 4, 3, { int: true });
        const conv = v.select('convention', [{ value: 'cl', label: 'classical (frame i on link i)' }, { value: 'mod', label: 'modified (Craig; Lynch–Park)' }], 'cl');
        const sel = v.select('link', ['1', '2', '3', '4'], '1');
        const cur = () => P[Math.min(+sel.value, nJ.value) - 1];
        const sa = v.slider('link length $a$', -1.5, 1.5, P[0].a, { step: 0.01, onChange: (x) => { cur().a = x; } });
        const sal = v.slider('twist $\\alpha$ (°)', -180, 180, P[0].al, { step: 1, onChange: (x) => { cur().al = x; } });
        const sd = v.slider('offset $d$', -1, 1, P[0].d, { step: 0.01, onChange: (x) => { cur().d = x; } });
        const sth = v.slider('joint angle $\\theta$ (°)', -180, 180, P[0].th, { step: 1, onChange: (x) => { cur().th = x; } });
        let lastSel = '1';
        const SC = v.stage({ x: [-1.7, 2.9], y: [-1.0, 1.9], equal: true, axes: false, height: 440, title: 'a serial chain with its frames' });
        const sc = v.scene3(SC, { yaw: -0.8, pitch: 0.3, axes: false, lim: 1.5, axis: 1.2 });
        const B = v.stage({ x: [0, 10], y: [0, 7.4], axes: false, height: 440, title: 'the link table', minWidth: 300 });
        let st = null;
        v.render(() => {
          const n = nJ.value, k = Math.min(+sel.value, n);
          if (sel.value !== lastSel || +sel.value > n) { lastSel = sel.value; const c = P[k - 1]; sa.set(c.a); sal.set(c.al); sd.set(c.d); sth.set(c.th); }
          const modern = conv.value === 'mod';
          // classical chain
          const Fcl = [I4()]; for (let i = 0; i < n; i++) Fcl.push(Tmul(Fcl[i], dhA(P[i].th * DEG, P[i].d, P[i].a, P[i].al * DEG)));
          // modified chain: same numbers re-indexed, with a final fixed transform (a_n, alpha_n)
          let Tm = I4(); const G = [];
          for (let i = 0; i < n; i++) { const A = dhAmod(i === 0 ? 0 : P[i - 1].al * DEG, i === 0 ? 0 : P[i - 1].a, P[i].th * DEG, P[i].d); Tm = Tmul(Tm, A); G.push(Tm); }
          const Tend = Tmul(Tm, Tmul(Ttrans([P[n - 1].a, 0, 0]), Trot(Rx(P[n - 1].al * DEG))));
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.35 * Math.cos(t), 0.35 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false });
          for (let i = 1; i <= n; i++) {
            const Op = pof(Fcl[i - 1]), zp = mcol(Rof(Fcl[i - 1]), 2), Oi = pof(Fcl[i]), foot = vadd(Op, vsc(zp, P[i - 1].d)), hl = i === k;
            sc.line(Op, foot, { color: JC[i - 1], width: hl ? 7 : 5, alpha: hl ? 0.95 : 0.6 }); sc.line(foot, Oi, { color: JC[i - 1], width: hl ? 7 : 5, alpha: hl ? 0.95 : 0.6 });
            sc.line(vadd(Op, vsc(zp, -0.5)), vadd(Op, vsc(zp, 0.5)), { color: JC[i - 1], width: 1.3, dash: true, alpha: 0.6, top: false });
          }
          const fr = modern ? G.map((T, i) => ({ T, name: i + 1 })).concat([{ T: Tend, name: 't' }]) : Fcl.map((T, i) => ({ T, name: i }));
          for (const { T, name } of fr) {
            const R = Rof(T), p = pof(T);
            sc.arrow(p, vadd(p, vsc(mcol(R, 2), 0.32)), { color: 'accent', width: 2.2, head: 7 }); sc.arrow(p, vadd(p, vsc(mcol(R, 0), 0.32)), { color: 'red', width: 2.2, head: 7 });
            sc.dot(p, { color: 'ink', r: 3 }); sc.tex(`\\{${name}\\}`, vadd(p, [0.12, 0, -0.2]), { color: 'ink', size: 11.5 });
          }
          sc.dot(pof(Fcl[n]), { color: 'gold', r: 5.5 });
          sc.flush();
          // table
          const cols = modern ? [0.9, 2.7, 4.5, 6.3, 8.1] : [0.9, 2.7, 4.5, 6.3, 8.1];
          const heads = modern ? ['link', '\\alpha_{i-1}', 'a_{i-1}', 'd_i', '\\theta_i'] : ['link', '\\theta_i', 'd_i', 'a_i', '\\alpha_i'];
          heads.forEach((h, j) => (j ? B.tex(h, cols[j] + 0.4, 6.8, { size: 14, color: 'muted', align: 'center' }) : B.text(h, cols[j], 6.8, { size: 13, color: 'muted', align: 'center' })));
          for (let i = 0; i <= n; i++) {
            if (!modern && i === n) break;
            const y = 5.85 - i * 0.95;
            const row = modern
              ? (i < n ? [i === 0 ? 0 : P[i - 1].al, i === 0 ? 0 : P[i - 1].a, P[i].d, P[i].th] : [P[n - 1].al, P[n - 1].a, null, null])
              : [P[i].th, P[i].d, P[i].a, P[i].al];
            const isSel = i + 1 === k && (!modern || i < n);
            B.rect(0.1, y - 0.4, 9.9, y + 0.4, { fill: isSel ? 'accent' : 'muted', fillAlpha: isSel ? 0.14 : 0.05, color: isSel ? 'accent' : 'faint', width: isSel ? 1.8 : 1, radius: 4 });
            B.text(modern && i === n ? 'tool' : String(i + 1), cols[0], y, { size: 14, align: 'center', baseline: 'middle', color: modern && i === n ? 'ink' : JC[i] });
            row.forEach((x, j) => {
              const isVar = modern ? j === 3 : j === 0;
              if (x == null) { B.text('—', cols[j + 1] + 0.4, y, { size: 13, align: 'center', baseline: 'middle', color: 'muted' }); return; }
              if (isVar) B.rect(cols[j + 1] - 0.5, y - 0.3, cols[j + 1] + 1.3, y + 0.3, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1, radius: 4 });
              const deg = modern ? j === 0 || j === 3 : j === 0 || j === 3;
              B.text(cn(x, deg ? 0 : 2) + (deg ? '°' : ''), cols[j + 1] + 0.4, y, { size: 13.5, align: 'center', baseline: 'middle', color: 'ink' });
            });
          }
          B.tex(modern ? 'A_i=\\mathrm{Rot}(x,\\alpha_{i-1})\\mathrm{Trans}(x,a_{i-1})\\mathrm{Rot}(z,\\theta_i)\\mathrm{Trans}(z,d_i)' : 'A_i=\\mathrm{Rot}(z,\\theta_i)\\mathrm{Trans}(z,d_i)\\mathrm{Trans}(x,a_i)\\mathrm{Rot}(x,\\alpha_i)', 5, 0.7, { size: 13, color: 'muted', align: 'center' });
          st = { n, errConv: f4(sub4(Tend, Fcl[n])), orth: orthErr(Rof(Fcl[n])), tip: pof(Fcl[n]) };
        });
        v.readout(() => {
          if (!st) return '';
          return `Pose of the last frame, as the product of ${st.n} matrices $A_i$: position $${g3(st.tip)}$, $\\|R^{\\mathsf T}R-I\\|=${v.sci(st.orth + 1e-17, 1)}$ (a rigid motion).\nThe classical product $\\prod\\mathrm{Rot}(z,\\theta_i)\\mathrm{Trans}(z,d_i)\\mathrm{Trans}(x,a_i)\\mathrm{Rot}(x,\\alpha_i)$ and the modified product, which uses the same ${4 * st.n} numbers re-indexed plus a final fixed transform, agree to $${v.sci(st.errConv + 1e-17, 2)}$. Each link needs $4$ numbers where an arbitrary frame transform needs $6$.`;
        });
      },
    },
  ],
};
