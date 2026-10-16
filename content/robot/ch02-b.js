// Robotics — Chapter 2: Rigid-body motions (part b: 2.6, 2.7, 2.9, 2.10, 2.11)
import {
  TAU, DEG, clamp, vadd, vsub, vsc, dot3, cross3, norm3, unit3, I3, mm, mt, mv, madd, msc, mcol, fro, orthErr, skew, Rx, Ry, Rz,
  rotFromVec, rotAngle, mkT, Rof, pof, Tmul, Tinv, Tapply, Ttrans, Trot, fro4, I4, adjoint, mv6, tr6, twistAt,
  AXC, drawBody, drawFrame, frameLabels, inBall, fx, bmat,
} from './ch02.shared.js';

const HB = [0.7, 0.5, 0.12];
const LAT = []; for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) LAT.push([x * 0.9, y * 0.9, z * 0.9]);
const cn = (x, d = 2) => fx(x, d).replace('-', '−');
const g3 = (a, d = 2) => `(${a.map((x) => fx(x, d)).join(',')})`;

export default {
  collection: 'robot',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Definition',
      name: 'Homogeneous transformations and SE(3)',
      statement: String.raw`A rigid motion of space, $x\mapsto Rx+p$ with $R\in SO(3)$ and $p\in\R^3$, is encoded by the $4\times4$ **homogeneous transformation matrix**
$$T=\begin{bmatrix}R&p\\0&1\end{bmatrix},\qquad \begin{bmatrix}x'\\1\end{bmatrix}=T\begin{bmatrix}x\\1\end{bmatrix}.$$
The set of all such matrices is the group $SE(3)$ of rigid motions (special Euclidean group), of dimension $6$. If $T_{ab}$ gives the pose of frame $\{b\}$ in frame $\{a\}$, then points convert by $x_a=T_{ab}x_b$, frames chain by $T_{ac}=T_{ab}T_{bc}$ (left to right, following the chain of frames), and $T^{-1}=\begin{bmatrix}R^{\mathsf T}&-R^{\mathsf T}p\\0&1\end{bmatrix}$. Rigid motions preserve distances and handedness; the group is not commutative.`,
      idea: String.raw`Appending a $1$ to every point turns the affine map $x\mapsto Rx+p$ into a linear one, so that composition becomes matrix multiplication: $R_1(R_2x+p_2)+p_1=(R_1R_2)x+(R_1p_2+p_1)$ is the top row of $T_1T_2$. The bottom row $(0,0,0,1)$ is preserved by products and by the inverse formula, which is checked by multiplying out $T\,T^{-1}=I$. Six degrees of freedom are the three of $R$ (2.1) and the three of $p$, matching the count of item 1.1. For a robot arm, the pose of each link relative to its parent is one such matrix and the pose of the tool in the base is their ordered product; reversing the order moves the tool to the wrong place because $SE(3)$ does not commute.`,
      caption: String.raw`Move the four joint sliders of this arm (a base turn, shoulder, elbow, and a wrist roll). Each link carries a frame; pick a frame in **show** to see its $4\times4$ matrix $T_{0k}$ in the right panel, with the rotation block in blue and the translation column in orange. The gold dot is a point fixed in the tool frame, mapped to the base by the product. Turn on **wrong order** to multiply the transforms in the reverse order: the red frame is where the tool would land.`,
      deps: ['robot-2.1'],
      refs: ['Lynch–Park §3.3'],
      tags: ['SE(3)', 'homogeneous', 'frames'],
      viz(v) {
        const q1 = v.slider('base turn $q_1$ (°)', -180, 180, 40, { step: 1 });
        const q2 = v.slider('shoulder $q_2$ (°)', -30, 110, 45, { step: 1 });
        const q3 = v.slider('elbow $q_3$ (°)', -140, 140, -70, { step: 1 });
        const q4 = v.slider('wrist roll $q_4$ (°)', -180, 180, 60, { step: 1 });
        const which = v.select('show', [{ value: '0', label: '{1}' }, { value: '1', label: '{2}' }, { value: '2', label: '{3}' }, { value: '3', label: '{4}' }, { value: '4', label: '{tool}' }], '4');
        const wrong = v.toggle('wrong order', false);
        const S = v.stage({ x: [-2.8, 2.8], y: [-1.7, 2.7], equal: true, axes: false, height: 400, title: 'a 4-joint arm with a frame on each link' });
        const sc = v.scene3(S, { yaw: -0.85, pitch: 0.3, axes: false, lim: 1.5, axis: 1.5 });
        const B = v.stage({ x: [-0.8, 4.8], y: [-0.6, 5.0], equal: true, axes: false, height: 400, title: 'the matrix of the chosen frame' });
        const L1 = 1.0, L2 = 0.85, L3 = 0.3, O = [0, 0, 0], PT = [0.05, 0.28, 0.2];
        const lab = ['T_{01}', 'T_{02}', 'T_{03}', 'T_{04}', 'T_{0t}'];
        let st = null;
        v.render(() => {
          const a1 = q1.value * DEG, a2 = q2.value * DEG, a3 = q3.value * DEG, a4 = q4.value * DEG;
          const Ts = [mkT(Rz(a1), [0, 0, 0.45]), Trot(Ry(-a2)), Tmul(Ttrans([L1, 0, 0]), Trot(Ry(-a3))), Tmul(Ttrans([L2, 0, 0]), Trot(Rx(a4))), Ttrans([L3, 0, 0])];
          const Tc = []; let acc = I4(); for (const T of Ts) { acc = Tmul(acc, T); Tc.push(acc); }
          const rev = Ts.slice().reverse().reduce((A, T) => Tmul(A, T), I4());
          const org = Tc.map(pof);
          sc.begin();
          const floor = []; for (let i = 0; i < 40; i++) { const t = (TAU * i) / 40; floor.push([0.45 * Math.cos(t), 0.45 * Math.sin(t), 0]); }
          sc.path(floor, { color: 'muted', width: 2, close: true, top: false }); sc.line([0, 0, 0], [0, 0, 0.45], { color: 'muted', width: 6 });
          const links = [[org[0], org[2]], [org[2], org[3]], [org[3], org[4]]];
          sc.line(org[0], org[1], { color: 'muted', width: 7 });
          sc.line(org[1], org[2], { color: 'accent', width: 7, alpha: 0.85 }); sc.line(org[2], org[3], { color: 'orange', width: 7, alpha: 0.85 }); sc.line(org[3], org[4], { color: 'purple', width: 7, alpha: 0.85 });
          void links;
          drawFrame(sc, I3(), [0, 0, 0], 0.55, { width: 2, alpha: 0.9 }); frameLabels(sc, I3(), [0, 0, 0], 0.55, ['x_0', 'y_0', 'z_0'], { size: 12 });
          const k = +which.value;
          Tc.forEach((T, i) => { if (i !== k) drawFrame(sc, Rof(T), pof(T), 0.3, { width: 1.5, alpha: 0.7 }); sc.dot(pof(T), { color: 'ink', r: 3.5 }); });
          drawFrame(sc, Rof(Tc[k]), pof(Tc[k]), 0.6, { width: 3 });
          sc.tex(['1', '2', '3', '4', 't'].map((s) => `\\{${s}\\}`)[k], vadd(pof(Tc[k]), [0.1, 0.1, 0.25]), { size: 14, color: 'ink' });
          const pw = Tapply(Tc[4], PT);
          sc.line(pof(Tc[4]), pw, { color: 'gold', width: 1.6, dash: true }); sc.dot(pw, { color: 'gold', r: 6 });
          if (wrong.value) { drawFrame(sc, Rof(rev), pof(rev), 0.5, { color: 'red', width: 2.6 }); sc.dot(pof(rev), { color: 'red', r: 6 }); sc.tex('\\text{wrong order}', vadd(pof(rev), [0, 0, 0.3]), { color: 'red', size: 12 }); }
          sc.flush();
          // matrix panel
          const T = Tc[k];
          for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
            const x = j, y = 3 - i, isR = i < 3 && j < 3, isP = i < 3 && j === 3;
            B.rect(x + 0.04, y + 0.04, x + 0.96, y + 0.96, { fill: isR ? 'accent' : isP ? 'orange' : 'muted', fillAlpha: isR ? 0.2 : isP ? 0.3 : 0.1, color: isR ? 'accent' : isP ? 'orange' : 'faint', width: 1, radius: 4 });
            B.text(cn(T[i][j], 2), x + 0.5, y + 0.5, { size: 15, align: 'center', baseline: 'middle', color: 'ink' });
          }
          B.text('R', 1.5, 4.35, { size: 16, align: 'center', color: 'accent', math: true }); B.text('p', 3.5, 4.35, { size: 16, align: 'center', color: 'orange', math: true });
          B.tex(`${lab[k]}=T_{01}\\cdots ${['T_{01}', 'T_{12}', 'T_{23}', 'T_{34}', 'T_{4t}'][k]}`, 2, -0.35, { size: 15, align: 'center', color: 'muted' });
          const Ti = Tinv(T);
          st = { T, pw, pt: PT, err: fro4(madd4(Tmul(T, Ti), I4())), errR: orthErr(Rof(T)), dRev: norm3(vsub(pof(rev), pof(Tc[4]))), tool: Tc[4] };
        });
        v.readout(() => {
          if (!st) return '';
          return `Tool-frame point $(${fx(PT[0])},${fx(PT[1])},${fx(PT[2])})$ is at $T_{0t}\\,x=${g3(st.pw)}$ in the base frame; the base position of the tool is $${g3(pof(st.tool))}$.\nChecks for the chosen frame: $\\|R^{\\mathsf T}R-I\\|=${v.sci(st.errR + 1e-17, 2)}$, $\\|TT^{-1}-I\\|=${v.sci(st.err + 1e-17, 2)}$ with $T^{-1}=[R^{\\mathsf T},\\,-R^{\\mathsf T}p]$.${wrong.value ? `\nThe reversed product places the tool $${fx(st.dRev, 2)}$ away from the true position — rigid motions do not commute.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Twists',
      statement: String.raw`The velocity of a moving rigid body at an instant is a **twist** $\mathcal V=(\omega,v)\in\R^6$: $\omega$ is the angular velocity, and $v$ is the velocity of the body-fixed point currently at the origin of the reference frame. Then the body-fixed point currently at $x$ has velocity $\dot x=v+\omega\times x$, so the whole velocity field is determined by six numbers. In the fixed frame $\{s\}$ this is the **spatial twist** $\mathcal V_s$; written in the coordinates of a frame $\{b\}$ attached to the body (with $\omega_b=R^{\mathsf T}\omega$ and $v_b$ the velocity of the body point at $\{b\}$'s origin, in $\{b\}$-coordinates) it is the **body twist** $\mathcal V_b$. These are the two ways of reading off the velocity $\dot T\,T^{-1}=[\mathcal V_s]$ and $T^{-1}\dot T=[\mathcal V_b]$, where $[\mathcal V]=\begin{bmatrix}[\omega]&v\\0&0\end{bmatrix}\in\mathfrak{se}(3)$. For $\omega\neq0$ the field is that of a **screw motion**: rotation at rate $|\omega|$ about the axis through $q=\omega\times v/|\omega|^2$ in the direction $\hat\omega$, combined with sliding along it at pitch $h=\omega\cdot v/|\omega|^2$.`,
      idea: String.raw`A rigid motion $T(t)$ moves each point by $\dot x=\dot Rq+\dot p$; writing $q=R^{\mathsf T}(x-p)$ gives $\dot x=[\omega](x-p)+\dot p$, which is $v+\omega\times x$ with $v=\dot p-\omega\times p$, the velocity of the point at the origin. The body-frame version differs only in where the origin and axes sit: it reports the velocity of the point at the body frame's origin, in the body's own axes. A point $x_0$ on the line $\{q+\lambda\hat\omega\}$ has $v+\omega\times x_0=h\,\omega$, parallel to the axis, which is the screw interpretation (and the infinitesimal form of 2.8); at $\omega=0$ every point moves with the same $v$, a pure translation.`,
      caption: String.raw`Drag the green dot ($\omega$) and the orange dot ($v$, the velocity of the point at the base origin) to set the spatial twist; the arrows show the velocity of the body-fixed point at each grid location. Drag the teal dot to move a body frame $\{b\}$ and use the slider to turn it. The bars on the right are the six components of $\mathcal V_s$ and $\mathcal V_b$ — the same motion with different numbers. The green line is the screw axis; points on it move only along it, with speed $h|\omega|$.`,
      deps: ['robot-2.6', 'robot-2.2'],
      refs: ['Lynch–Park §3.3'],
      credit: 'R. S. Ball, 1900 (theory of screws)',
      tags: ['twist', 'screw axis', 'velocity field'],
      viz(v) {
        const Rfix = rotFromVec([0.4, -0.3, 0]);
        const ang = v.slider('turn body $\\{b\\}$ about $z$ (°)', -180, 180, 35, { step: 1 });
        const scr = v.toggle('show screw axis', true);
        const S = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 420, title: 'velocity field of a moving body' });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.35, axes: false, lim: 1.5 });
        const hw = sc.handle([0.15, 0.1, 0.9], { color: 'green', label: 'ω', lim: 1.5, snap: inBall(1.5) });
        const hv = sc.handle([0.9, -0.1, 0.3], { color: 'orange', label: 'v', lim: 1.5, snap: inBall(1.5) });
        const hp = sc.handle([0.95, 0.7, 0.35], { color: 'teal', label: 'b', lim: 1.5 });
        const B = v.stage({ x: [0.3, 6.7], y: [-2, 2], axes: false, height: 420, title: 'the six numbers of the twist', minWidth: 280 });
        const names = ['ω₁', 'ω₂', 'ω₃', 'v₁', 'v₂', 'v₃'];
        let st = null;
        v.render(() => {
          const Rb = mm(Rz(ang.value * DEG), Rfix), p = hp.p, w = hw.p, vv = hv.p, Vs = [...w, ...vv], O = [0, 0, 0];
          const vp = twistAt(Vs, p), Vb = [...mv(mt(Rb), w), ...mv(mt(Rb), vp)];
          sc.begin();
          drawBody(sc, Rb, p, [0.45, 0.32, 0.1], { alpha: 0.2 }); drawFrame(sc, Rb, p, 0.55, { width: 2.2 });
          drawFrame(sc, I3(), O, 0.55, { color: 'muted', width: 1.8 });
          for (const x of LAT) { const vel = twistAt(Vs, x); sc.dot(x, { color: 'faint', r: 2 }); sc.arrow(x, vadd(x, vsc(vel, 0.32)), { color: 'accent', width: 1.5, head: 6, alpha: 0.7, top: false }); }
          const wl = norm3(w); let screw = null;
          if (wl > 0.03) {
            const s = vsc(w, 1 / wl), q = vsc(cross3(w, vv), 1 / (wl * wl)), h = dot3(w, vv) / (wl * wl);
            screw = { s, q, h };
            if (scr.value && norm3(q) < 3.2) { sc.line(vsub(q, vsc(s, 2.6)), vadd(q, vsc(s, 2.6)), { color: 'green', width: 2.2, alpha: 0.9 }); sc.dot(q, { color: 'green', r: 4 }); }
          }
          sc.arrow(O, vadd(O, vsc(vv, 0.32)), { color: 'orange', width: 3.2, head: 9 }); sc.dot(O, { color: 'orange', r: 4 });
          sc.arrow(p, vadd(p, vsc(vp, 0.32)), { color: 'teal', width: 3.2, head: 9 });
          sc.arrow(O, vsc(w, 1), { color: 'green', width: 2.6, head: 9, alpha: 0.9 });
          sc.flush();
          // bars
          const mx = Math.max(1.5, ...Vs.map(Math.abs), ...Vb.map(Math.abs)) * 1.15;
          B.setView([0.3, 6.7], [-mx, mx]); B.hline(0, { color: 'muted', width: 1 });
          for (let i = 0; i < 6; i++) {
            const x = i + 1;
            B.rect(x - 0.36, 0, x - 0.02, Vs[i], { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1.2 });
            B.rect(x + 0.02, 0, x + 0.36, Vb[i], { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.2 });
            B.text(names[i], x, -mx * 0.93, { size: 13, align: 'center', color: 'muted' });
          }
          B.vline(3.5, { color: 'faint', dash: true });
          let chk = 0; if (screw) chk = norm3(vsub(twistAt(Vs, screw.q), vsc(w, screw.h)));
          st = { Vs, Vb, screw, wl, chk, vp };
        });
        v.legend([['accent', '$\\mathcal V_s$ (space frame)'], ['orange', '$\\mathcal V_b$ (body frame)'], ['green', 'screw axis']]);
        v.readout(() => {
          if (!st) return '';
          const { Vs, Vb, screw, wl, chk } = st;
          const sc2 = screw ? `Screw axis: through $q=${g3(screw.q)}$ along $\\hat\\omega=${g3(screw.s)}$, pitch $h=${fx(screw.h, 3)}$; the body point at $q$ moves with $v+\\omega\\times q=h\\omega$ (check, difference $${v.sci(chk + 1e-17, 1)}$).` : 'With $\\omega\\approx0$ the motion is a pure translation: every point moves with the same velocity $v$.';
          return `$\\mathcal V_s=(\\omega,v)=(${g3(Vs.slice(0, 3))},\\,${g3(Vs.slice(3))})$, $\\ \\mathcal V_b=(R^{\\mathsf T}\\omega,\\ R^{\\mathsf T}(v+\\omega\\times p))=(${g3(Vb.slice(0, 3))},\\,${g3(Vb.slice(3))})$; $|\\omega|=${fx(wl, 3)}$ in both.\n${sc2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'The adjoint map: changing frames for twists',
      statement: String.raw`For $T=(R,p)\in SE(3)$ the **adjoint** is the $6\times6$ matrix
$$[\mathrm{Ad}_T]=\begin{bmatrix}R&0\\ [p]R&R\end{bmatrix},$$
and it converts twists from the frame $\{b\}$ with pose $T=T_{sb}$ to the frame $\{s\}$: $\mathcal V_s=[\mathrm{Ad}_{T_{sb}}]\,\mathcal V_b$, i.e. $\omega_s=R\omega_b$ and $v_s=[p]R\omega_b+Rv_b$. It is linear, $[\mathrm{Ad}_{T_1T_2}]=[\mathrm{Ad}_{T_1}][\mathrm{Ad}_{T_2}]$, and $[\mathrm{Ad}_T]^{-1}=[\mathrm{Ad}_{T^{-1}}]$. The two velocity fields $x\mapsto v_s+\omega_s\times x$ and $q\mapsto v_b+\omega_b\times q$ describe the same physical motion.`,
      idea: String.raw`Under a change of frame the twist matrix transforms by conjugation, $[\mathcal V_s]=T[\mathcal V_b]T^{-1}$ (the "same" $\dot T=T[\mathcal V_b]=[\mathcal V_s]T$). Multiplying this out block by block gives the rotation of $\omega$ and the extra term: the velocity of the point at the origin of $\{s\}$ differs from the velocity of the point at the origin of $\{b\}$ by $-\omega\times p=p\times\omega$. So $[p]R$ is the lever-arm correction, and nothing but the rotation $R$ is needed when the frames share an origin ($p=0$, the 2.2 case).`,
      caption: String.raw`Define the twist in the body frame by dragging its two handles (they ride on the body: the green dot $\omega_b$ and the orange dot $v_b$, measured in the body's axes) and place the body with the teal dot and the two angle sliders. The thick orange arrows are the velocity field computed from $\mathcal V_b$ alone; the thin blue arrows come from $\mathcal V_s=[\mathrm{Ad}_T]\mathcal V_b$. They coincide. Tick **wrong adjoint** to drop the $[p]R$ block: the fields separate and the readout shows by how much. The matrix is shown on the right with its blocks coloured.`,
      deps: ['robot-2.7'],
      refs: ['Lynch–Park §3.3'],
      tags: ['adjoint', 'twist', 'change of frame'],
      viz(v) {
        const Rfix = rotFromVec([0.3, -0.2, 0.1]);
        const heading = v.slider('body heading (°)', -180, 180, 50, { step: 1 });
        const tilt = v.slider('body tilt (°)', -90, 90, 25, { step: 1 });
        const wrong = v.toggle('wrong adjoint (drop $[p]R$)', false);
        const S = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: false, height: 420, title: 'one motion, two descriptions' });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.35, axes: false, lim: 2.5 });
        const hp = sc.handle([0.9, 0.7, 0.3], { color: 'teal', label: 'b', lim: 1.4 });
        const hw = sc.handle([1, 1, 1.4], { color: 'green', label: 'ω', lim: 3.5 });
        const hv = sc.handle([1.6, 0.4, 0.6], { color: 'orange', label: 'v', lim: 3.5 });
        const B = v.stage({ x: [0, 10], y: [-0.6, 6.9], equal: true, axes: false, height: 420, title: 'twist in {s} = adjoint × twist in {b}', minWidth: 300 });
        let wb = [0.1, 0.1, 0.9], vb = [0.7, -0.2, 0.3], st = null;
        v.render(() => {
          const Rb = mm(Rz(heading.value * DEG), mm(Rx(tilt.value * DEG), Rfix)), p = hp.p, T = mkT(Rb, p), O = [0, 0, 0];
          if (hw.dragging) wb = mv(mt(Rb), vsub(hw.p, p)); else hw.p = vadd(p, mv(Rb, wb));
          if (hv.dragging) vb = mv(mt(Rb), vsub(hv.p, p)); else hv.p = vadd(p, mv(Rb, vb));
          const Vb = [...wb, ...vb], Ad = adjoint(T);
          const AdUse = Ad.map((r) => r.slice()); if (wrong.value) for (let i = 3; i < 6; i++) for (let j = 0; j < 3; j++) AdUse[i][j] = 0;
          const Vs = mv6(AdUse, Vb), Vsgood = mv6(Ad, Vb);
          sc.begin();
          drawBody(sc, Rb, p, [0.45, 0.32, 0.1], { alpha: 0.18 }); drawFrame(sc, Rb, p, 0.55, { width: 2.2 });
          drawFrame(sc, I3(), O, 0.55, { color: 'muted', width: 1.8 });
          let gap = 0;
          for (const x of LAT) {
            const a = twistAt(Vs, x), q = mv(mt(Rb), vsub(x, p)), b = mv(Rb, twistAt(Vb, q));
            gap = Math.max(gap, norm3(vsub(a, b)));
            sc.arrow(x, vadd(x, vsc(b, 0.3)), { color: 'orange', width: 4, head: 8, alpha: 0.55, top: false });
            sc.arrow(x, vadd(x, vsc(a, 0.3)), { color: 'accent', width: 1.5, head: 6, alpha: 1, top: false, bias: -0.5 });
          }
          sc.line(p, hw.p, { color: 'green', dash: true, alpha: 0.7 }); sc.line(p, hv.p, { color: 'orange', dash: true, alpha: 0.7 });
          sc.flush();
          // matrix panel
          const vs = Vs, X0 = 2.2;
          B.tex('\\mathcal V_s', 0.5, 6.6, { size: 15, align: 'center', color: 'accent' }); B.tex('[\\mathrm{Ad}_T]', X0 + 3, 6.6, { size: 15, align: 'center', color: 'ink' }); B.tex('\\mathcal V_b', 9.5, 6.6, { size: 15, align: 'center', color: 'orange' });
          for (let i = 0; i < 6; i++) {
            const y = 5.5 - i;
            B.rect(0.05, y + 0.05, 0.95, y + 0.95, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1, radius: 3 });
            B.text(cn(vs[i], 1), 0.5, y + 0.5, { size: 11.5, align: 'center', baseline: 'middle' });
            B.rect(9.05, y + 0.05, 9.95, y + 0.95, { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1, radius: 3 });
            B.text(cn(Vb[i], 1), 9.5, y + 0.5, { size: 11.5, align: 'center', baseline: 'middle' });
            for (let j = 0; j < 6; j++) {
              const blk = i < 3 && j < 3 ? 'R' : i >= 3 && j >= 3 ? 'R' : i >= 3 ? 'pR' : '0', x = X0 + j;
              const col = blk === 'R' ? 'accent' : blk === 'pR' ? 'orange' : 'muted';
              B.rect(x + 0.05, y + 0.05, x + 0.95, y + 0.95, { fill: col, fillAlpha: blk === '0' ? 0.05 : blk === 'pR' && wrong.value ? 0.02 : 0.2, color: blk === '0' ? 'faint' : col, width: 1, radius: 3, ...(blk === 'pR' && wrong.value ? { dash: true } : {}) });
              B.text(blk === '0' ? '0' : cn(AdUse[i][j], 2), x + 0.5, y + 0.5, { size: 11.5, align: 'center', baseline: 'middle', color: blk === '0' ? 'faint' : 'ink' });
            }
          }
          B.text('=', 1.6, 3, { size: 18, align: 'center', color: 'muted' }); B.text('×', 8.6, 3, { size: 18, align: 'center', color: 'muted' });
          const AdI = adjoint(Tinv(T)), prod = mm6(Ad, AdI);
          st = { Vs, Vb, Vsgood, gap, invErr: fro6(prod), T };
        });
        v.readout(() => {
          if (!st) return '';
          return `$\\mathcal V_b=(${g3(st.Vb.slice(0, 3))},${g3(st.Vb.slice(3))})$, and $\\mathcal V_s=[\\mathrm{Ad}_T]\\mathcal V_b=(${g3(st.Vs.slice(0, 3))},${g3(st.Vs.slice(3))})$.\nLargest difference between the two velocity fields over the 27 grid points: $${v.sci(st.gap + 1e-17, 2)}$${wrong.value ? ' — **the lever-arm term $[p]R$ is missing, so the frames disagree**' : ' — the same motion'}. Group law: $\\|\\mathrm{Ad}_T\\mathrm{Ad}_{T^{-1}}-I\\|=${v.sci(st.invErr + 1e-17, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Definition',
      name: 'Wrenches and the power pairing',
      statement: String.raw`A force $f$ acting at a point $r$ of a rigid body, together with any pure torques, is summarised by the **wrench** $\mathcal F=(m,f)\in\R^6$ in a chosen frame, where $m=r\times f+(\text{pure torque})$ is the total moment about the frame's origin. Wrenches are the dual of twists: the **power** delivered to a body moving with the twist $\mathcal V=(\omega,v)$ is
$$P=\mathcal F\cdot\mathcal V=m\cdot\omega+f\cdot v ,$$
and this number is the same in every frame. Hence if $\mathcal V_a=[\mathrm{Ad}_{T_{ab}}]\mathcal V_b$ then wrenches transform by the transpose, $\mathcal F_b=[\mathrm{Ad}_{T_{ab}}]^{\mathsf T}\mathcal F_a$, which is not the same rule as for twists (the dual of a rotation by $R$ is again $R$, but the $[p]R$ block moves from the lower-left to the upper-right).`,
      idea: String.raw`Physically, the power of a force $f$ at the body point $r$ is $f\cdot\dot r=f\cdot(v+\omega\times r)=f\cdot v+(r\times f)\cdot\omega$ by the scalar triple product, and this is $f\cdot v+m\cdot\omega$; nothing in it refers to a frame. Expressing $\mathcal V$ and $\mathcal F$ in frame $\{b\}$ rather than $\{a\}$ moves some of the power from the "moment times rotation" term to the "force times velocity" term, but the total cannot change. Then $\mathcal F_a\cdot(\mathrm{Ad}\,\mathcal V_b)=(\mathrm{Ad}^{\mathsf T}\mathcal F_a)\cdot\mathcal V_b$ is just the definition of the transpose, which is where the transformation rule comes from. It is the same duality as torque and joint velocity in the robot Jacobian later.`,
      caption: String.raw`A planar slice (the wrench is $(m_z,f_x,f_y)$, the twist $(\omega_z,v_x,v_y)$). Drag the **blue dot** (where the force acts) and the **red dot** (the force's tip), the **gold dot** (the centre about which the body instantaneously turns) and the slider for its rate. Frame $\{s\}$ sits at the origin; drag the **teal dot** to put frame $\{b\}$ elsewhere and tilt it with the slider. The bars show the moment term, the force term and their sum in both frames: the two terms differ, but the sums are equal and match the physical power $f\cdot v_P$. Tick **mismatch frames** to pair $\{b\}$-forces with $\{s\}$-velocities and watch the power stop agreeing.`,
      deps: ['robot-2.7', 'mech-2.8'],
      refs: ['Lynch–Park §3.4'],
      credit: 'R. S. Ball, 1900 (theory of screws)',
      tags: ['wrench', 'power', 'duality'],
      viz(v) {
        const phi = v.slider('frame $\\{b\\}$ tilt (°)', -180, 180, 30, { step: 1 });
        const rate = v.slider('turning rate $\\omega$ (rad/s)', -2, 2, 1.2, { step: 0.01 });
        const mis = v.toggle('mismatch frames', false);
        const S = v.stage({ x: [-3.6, 3.6], y: [-2.7, 2.7], equal: true, axes: false, height: 400, title: 'a planar body, a force and a motion' });
        const B = v.stage({ x: [0, 9], y: [-1, 1], axes: false, height: 400, title: 'power in each frame', minWidth: 270 });
        const P = S.handle(1.1, 0.4, { color: 'accent', r: 8, label: 'P' });
        let f = [0.7, 1.15];
        const Fh = S.handle(P.x + f[0], P.y + f[1], { color: 'red', r: 7, label: 'F' });
        Fh.onDrag = () => { f = [Fh.x - P.x, Fh.y - P.y]; const n = Math.hypot(f[0], f[1]); if (n > 2.6) f = [(f[0] * 2.6) / n, (f[1] * 2.6) / n]; };
        const C = S.handle(-1.3, -0.5, { color: 'gold', r: 8, label: 'C' });
        const Bh = S.handle(-2.2, 1.2, { color: 'teal', r: 8, label: 'b' });
        const poly = [[-2.0, -1.2], [1.9, -1.5], [2.8, 0.2], [1.4, 1.9], [-1.2, 1.6], [-2.4, 0.3]];
        const rot = (a, p) => [Math.cos(a) * p[0] - Math.sin(a) * p[1], Math.sin(a) * p[0] + Math.cos(a) * p[1]];
        const rotT = (a, p) => rot(-a, p), crs = (a, b) => a[0] * b[1] - a[1] * b[0];
        const vel = (w, c, x) => [-w * (x[1] - c[1]), w * (x[0] - c[0])];
        let st = null;
        v.render(() => {
          Fh.set(P.x + f[0], P.y + f[1]);
          const w = rate.value, a = phi.value * DEG, c = [C.x, C.y], pp = [P.x, P.y], bo = [Bh.x, Bh.y], O = [0, 0];
          S.poly(poly, { fill: 'accent', fillAlpha: 0.07, color: 'muted', width: 1.4 });
          // frames
          const frame = (o, ang, col, nm) => { const ex = rot(ang, [0.8, 0]), ey = rot(ang, [0, 0.8]); S.arrow(o[0], o[1], o[0] + ex[0], o[1] + ex[1], { color: col, width: 2.2, head: 8 }); S.arrow(o[0], o[1], o[0] + ey[0], o[1] + ey[1], { color: col, width: 2.2, head: 8 }); S.tex(nm, o[0] - 0.28, o[1] - 0.28, { color: col, size: 14 }); };
          frame(O, 0, 'ink', '\\{s\\}'); frame(bo, a, 'teal', '\\{b\\}');
          // twist: rotation about C
          S.dot(C.x, C.y, { r: 3, color: 'gold' });
          const sweep = Math.sign(w || 1) * Math.min(4.2, 1 + 1.4 * Math.abs(w));
          S.curve((t) => [c[0] + 0.55 * Math.cos(t), c[1] + 0.55 * Math.sin(t)], 0.5, 0.5 + sweep, { color: 'gold', width: 2.2 });
          const aEnd = 0.5 + sweep; S.arrow(c[0] + 0.55 * Math.cos(aEnd - Math.sign(w || 1) * 0.12), c[1] + 0.55 * Math.sin(aEnd - Math.sign(w || 1) * 0.12), c[0] + 0.55 * Math.cos(aEnd), c[1] + 0.55 * Math.sin(aEnd), { color: 'gold', width: 2.2, head: 9 });
          const vP = vel(w, c, pp);
          S.arrow(pp[0], pp[1], pp[0] + 0.5 * vP[0], pp[1] + 0.5 * vP[1], { color: 'gold', width: 3, head: 9 });
          // force
          S.arrow(pp[0], pp[1], pp[0] + f[0], pp[1] + f[1], { color: 'red', width: 3, head: 10 });
          // moment about s origin (circular arrow) and about b
          const ms = crs(pp, f), mb0 = crs(vsub2(pp, bo), f);
          const arcM = (o, m, col, rad) => { if (Math.abs(m) < 0.02) return; const sg = Math.sign(m), L = Math.min(4.6, 1.2 + Math.abs(m)); S.curve((t) => [o[0] + rad * Math.cos(t), o[1] + rad * Math.sin(t)], 2.2, 2.2 + sg * L, { color: col, width: 2, dash: true }); const e = 2.2 + sg * L; S.arrow(o[0] + rad * Math.cos(e - sg * 0.1), o[1] + rad * Math.sin(e - sg * 0.1), o[0] + rad * Math.cos(e), o[1] + rad * Math.sin(e), { color: col, width: 2, head: 8 }); };
          arcM(O, ms, 'red', 0.5); arcM(bo, mb0, 'red', 0.5);
          // numbers
          const vs = vel(w, c, O), fb = rotT(a, f), vob = vel(w, c, bo), vb = rotT(a, vob);
          const mb = mb0;
          const Ps = [ms * w, f[0] * vs[0] + f[1] * vs[1]], vUse = mis.value ? vs : vb;
          const Pb = [mb * w, fb[0] * vUse[0] + fb[1] * vUse[1]], phys = f[0] * vP[0] + f[1] * vP[1];
          // bars
          const mx = Math.max(1, ...Ps.map(Math.abs), ...Pb.map(Math.abs), Math.abs(Ps[0] + Ps[1]), Math.abs(Pb[0] + Pb[1]), Math.abs(phys)) * 1.15;
          B.setView([0, 9], [-mx, mx * 1.3]); B.hline(0, { color: 'muted', width: 1 });
          const bar = (x, val, col, lab) => { B.rect(x - 0.4, 0, x + 0.4, val, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 }); B.text(lab, x, -mx * 0.93, { size: 11.5, align: 'center', color: 'muted' }); B.text(cn(val, 2), x, val + (val >= 0 ? 1 : -1) * mx * 0.07, { size: 11.5, align: 'center' }); };
          bar(1, Ps[0], 'orange', 'm·ω'); bar(2, Ps[1], 'purple', 'f·v'); bar(3, Ps[0] + Ps[1], 'green', 'sum {s}');
          bar(5.5, Pb[0], 'orange', 'm·ω'); bar(6.5, Pb[1], 'purple', 'f·v'); bar(7.5, Pb[0] + Pb[1], mis.value ? 'red' : 'green', 'sum {b}');
          B.hline(phys, { color: 'green', dash: true, width: 1.6 }); B.text('physical power f·v_P', 0.1, phys + mx * 0.07, { size: 11.5, color: 'green', align: 'left' });
          B.text('frame {s}', 2, mx * 1.2, { size: 12.5, color: 'ink', align: 'center' }); B.text('frame {b}', 6.5, mx * 1.2, { size: 12.5, color: 'teal', align: 'center' });
          st = { ms, mb, fb, vs, vb, Ps, Pb, phys, f, vP };
        });
        v.readout(() => {
          if (!st) return '';
          const { ms, mb, fb, vs, vb, Ps, Pb, phys } = st;
          return `Frame $\\{s\\}$: $\\mathcal F_s=(m,f)=(${fx(ms)},\\,${fx(st.f[0])},${fx(st.f[1])})$, $\\mathcal V_s=(\\omega,v)=(${fx(rate.value)},\\,${fx(vs[0])},${fx(vs[1])})$, power $m\\omega+f\\cdot v=${fx(Ps[0] + Ps[1], 4)}$.\nFrame $\\{b\\}$: $\\mathcal F_b=(${fx(mb)},\\,${fx(fb[0])},${fx(fb[1])})$, $\\mathcal V_b=(${fx(rate.value)},\\,${fx(vb[0])},${fx(vb[1])})$, power $=${fx(Pb[0] + Pb[1], 4)}$; physical $f\\cdot v_P=${fx(phys, 4)}$.${mis.value ? ' **The $\\{b\\}$ force is paired with the $\\{s\\}$ velocity, so the number is meaningless.**' : ' The two frames split the power differently and agree on the total.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Rotations do not commute',
      statement: String.raw`In general $R_1R_2\neq R_2R_1$ for rotations in three dimensions: turning a body by $\alpha$ about the fixed $x$-axis and then by $\beta$ about the fixed $y$-axis gives, for example for $\alpha=\beta=90^\circ$, a different orientation from doing the two turns in the opposite order. Rotations about a single common axis do commute (and so do all rotations in the plane). The failure is of second order for small angles: $R_y(\beta)R_x(\alpha)R_y(\beta)^{-1}R_x(\alpha)^{-1}$ is a rotation through an angle $\approx|\alpha\beta|$ about the $z$-axis, so the two orders differ by a rotation of size proportional to the product of the angles, which is why small rotations (angular velocities) can be added in any order to first order.`,
      idea: String.raw`With $R=e^{[a]}$ and $S=e^{[b]}$ one has $e^{[a]}e^{[b]}e^{-[a]}e^{-[b]}=e^{[[a],[b]]+\dots}$ where the Lie bracket of the skew matrices is $[[a],[b]]=[a\times b]$; the commutator is therefore a rotation about $a\times b$ of size $|a\times b|$ to leading order, and it vanishes exactly when the rotation vectors are parallel. For $a=\alpha\hat x$, $b=\beta\hat y$, $a\times b=\alpha\beta\,\hat z$. This second-order effect is what the bracket on $\mathfrak{so}(3)$ measures (2.2), and the same non-commutativity underlies why Euler angles must be applied in a stated order (2.4) and why the order of quaternion factors matters (2.5).`,
      caption: String.raw`Set the two turns with the sliders. The left book is turned first about the fixed $x$-axis then about the fixed $y$-axis, the right one in the opposite order; the faint ghosts are the books after the first turn. The plot shows the angle between the two results when both turns are scaled together by $s$: on log axes it follows a line of slope $2$ for small turns, the second-order law $\approx s^2|\alpha\beta|/m^2$. Make one slider $0$ and the two books agree.`,
      deps: ['robot-2.1'],
      refs: ['Lynch–Park §3.2'],
      tags: ['commutator', 'non-commutativity', 'SO(3)'],
      viz(v) {
        const al = v.slider('turn about fixed $x$: $\\alpha$ (°)', -180, 180, 90, { step: 1 });
        const be = v.slider('turn about fixed $y$: $\\beta$ (°)', -180, 180, 90, { step: 1 });
        const mk = (title) => v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 300, minWidth: 240, title });
        const SA = mk('first x, then y'), SB = mk('first y, then x');
        const cam = { yaw: -0.7, pitch: 0.3, axes: false, lim: 1.5 };
        const sa = v.scene3(SA, { ...cam, axis: 1.2 }), sb = v.scene3(SB, { ...cam, axis: 1.2, hint: false });
        const P = v.stage({ x: [0.02, Math.PI], y: [1e-4, 4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 250, xlabel: 'size of the turns (rad)', ylabel: 'angle between results (rad)', title: 'the difference is second order' });
        const O = [0, 0, 0], BODY = [0.6, 0.42, 0.1];
        const ord = (a, b) => ({ A: mm(Ry(b), Rx(a)), B: mm(Rx(a), Ry(b)) });
        const diff = (a, b) => { const { A, B } = ord(a, b); return rotAngle(mm(A, mt(B))); };
        let st = null;
        v.render(() => {
          const a = al.value * DEG, b = be.value * DEG, { A, B } = ord(a, b);
          sa.begin(); drawBody(sa, Rx(a), O, BODY, { color: 'muted', alpha: 0.05, edgeAlpha: 0.35, width: 0.8 }); sa.line(O, [1.3, 0, 0], { color: 'faint' }); sa.line(O, [0, 1.3, 0], { color: 'faint' });
          drawBody(sa, A, O, BODY); drawFrame(sa, A, O, 0.9, { width: 2 }); sa.flush();
          sb.begin(); drawBody(sb, Ry(b), O, BODY, { color: 'muted', alpha: 0.05, edgeAlpha: 0.35, width: 0.8 }); sb.line(O, [1.3, 0, 0], { color: 'faint' }); sb.line(O, [0, 1.3, 0], { color: 'faint' });
          drawBody(sb, B, O, BODY); drawFrame(sb, B, O, 0.9, { width: 2 }); sb.flush();
          // the two results side by side: tip of body x-axis
          const m = Math.max(Math.abs(a), Math.abs(b), 1e-6);
          const f = (s) => Math.max(diff((a * s) / m, (b * s) / m), 1e-12);
          P.fn(f, { color: 'accent', width: 2.6, domain: [0.02, Math.PI], n: 120 });
          const c2 = Math.abs(a * b) / (m * m);
          P.fn((s) => c2 * s * s, { color: 'orange', dash: true, width: 1.8, domain: [0.02, Math.PI], n: 40 });
          if (m > 0.02) P.dot(m, Math.max(diff(a, b), 1e-12), { color: 'gold', r: 6 });
          const slope = m > 0.02 ? (Math.log(f(Math.min(0.2, Math.PI)) / f(0.02))) / Math.log(10) : NaN;
          st = { d: diff(a, b), m, slope, c2 };
        });
        v.legend([['accent', 'angle between $R_yR_x$ and $R_xR_y$'], ['orange', 'second-order law $|\\alpha\\beta|\\,s^2/m^2$', { dash: true }], ['gold', 'current turns']]);
        v.readout(() => {
          if (!st) return '';
          const a = al.value * DEG, b = be.value * DEG;
          return `$\\alpha=${fx(al.value, 0)}^\\circ$, $\\beta=${fx(be.value, 0)}^\\circ$: the two final orientations differ by a rotation of $${fx(st.d / DEG, 2)}^\\circ$ ($${fx(st.d, 3)}$ rad); the leading term $|\\alpha\\beta|=${fx(Math.abs(a * b), 3)}$ rad${Math.abs(a * b) > 1.5 ? ' is no longer a good estimate for large turns' : ' predicts it well'}.\n${Number.isFinite(st.slope) ? `Slope of the blue curve between $s=0.02$ and $s=0.2$ on the log–log plot: $${fx(st.slope, 3)}$ (a straight second-order line has slope $2$).` : 'One of the turns is zero: the rotations share an axis, commute, and the two results are identical.'}`;
        });
      },
    },
  ],
};

function madd4(A, B) { return A.map((r, i) => r.map((x, j) => x - B[i][j])); }
function vsub2(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function mm6(A, B) { return A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0))); }
function fro6(A) { let s = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) s += (A[i][j] - (i === j ? 1 : 0)) ** 2; return Math.sqrt(s); }
