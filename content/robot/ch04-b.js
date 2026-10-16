// Robotics — Chapter 4 (part b): manipulability ellipsoids, measures and redundancy
import {
  TAU, DEG, clamp, fx,
  wrapPi, planarFK, planarJ, ik2R, svd2xn, ellipsePts,
} from './ch04.shared.js';

const cn = (x, d = 2) => fx(x, d).replace('-', '−');
const JC = ['accent', 'orange', 'purple', 'teal', 'pink', 'gold'];

/** Tool handle of a 2R arm: dragging it solves the inverse kinematics on the chosen elbow branch. */
function toolHandle(stage, l1, l2, th, branch, hook) {
  const h = stage.handle(1, 1, { color: 'gold', r: 8, label: 'tool' });
  h.constrain = (x, y) => {
    const r = Math.hypot(x, y), rr = clamp(r, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3), k = r < 1e-9 ? 1 : rr / r;
    x *= k; y *= k;
    const sol = ik2R(l1, l2, x, y);
    if (sol) { const b = branch(); th[0] = sol[b][0]; th[1] = sol[b][1]; if (hook) hook(); }
    return [x, y];
  };
  return h;
}
const sing2 = (J) => svd2xn(J);

export default {
  collection: 'robot',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Manipulability ellipsoid',
      statement: String.raw`Let $J(\theta)\in\R^{m\times n}$ be a Jacobian of full row rank $m$ (a task of $m$ coordinates of one kind, for instance the tip position in the plane, so that all coordinates share one unit). The **manipulability ellipsoid** at $\theta$ is the set of tool velocities obtainable with joint rates of at most unit size,
$$\mathcal E_v(\theta)=\{\,J\dot\theta:\ \|\dot\theta\|\le1\,\}=\{\,V:\ V^{\mathsf T}(JJ^{\mathsf T})^{-1}V\le1\,\}.$$
If $J=U\Sigma V^{\mathsf T}$ is a singular value decomposition (ladr-7.70), its principal axes are the columns $u_i$ of $U$ and the semi-axis lengths are the singular values $\sigma_i$, the square roots of the eigenvalues of $JJ^{\mathsf T}$. Long axes are directions in which the tool moves fast per unit joint rate; as $\sigma_{\min}\to0$ the ellipsoid flattens (kinematic singularity, 4.3). For a Jacobian mixing angular and linear velocities the units differ, so one ellipsoid is drawn for the angular part and another for the linear part.`,
      idea: String.raw`The map $\dot\theta\mapsto J\dot\theta$ sends the unit ball of $\R^n$ onto an ellipsoid, and the SVD shows how: the right singular vectors $v_i$ (an orthonormal set of joint-rate directions) go to $\sigma_iu_i$, orthogonal tool directions stretched by $\sigma_i$, while the null directions go to $0$. So the ellipsoid is read off the SVD directly, and the condition $V^{\mathsf T}(JJ^{\mathsf T})^{-1}V\le1$ follows by writing $\dot\theta=J^{+}V$ with the minimum-norm solution $\|\dot\theta\|^2=V^{\mathsf T}(JJ^{\mathsf T})^{-1}V$. This is the same picture as the image of a circle under a $2\times2$ matrix, with the Jacobian standing for the matrix.`,
      caption: String.raw`Left: the unit circle of joint rates $(\dot\theta_1,\dot\theta_2)$ with its two right singular directions. Right: the arm with its velocity ellipse drawn at the tool. Drag the gold dot on the circle (a joint-rate vector of norm 1) and its image $J\dot\theta$ (gold arrow) always lies on the ellipse; the singular directions map to the two axes. Drag the tool toward the stretched posture (or the base): the ellipse flattens to a segment. Use the elbow switch to compare the mirror posture.`,
      deps: ['robot-4.1', 'ladr-7.70'],
      refs: ['Lynch–Park §5.4'],
      tags: ['manipulability', 'SVD', 'ellipsoid'],
      credit: 'Yoshikawa, 1985',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robot_kinematics' },
      viz(v) {
        const l1 = 1.3, l2 = 1.0;
        const th = [0.55, 1.1];
        const elbow = v.select('elbow', [{ value: '0', label: 'down' }, { value: '1', label: 'up' }], '0');
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: true, height: 340, minWidth: 270, title: 'joint-rate space: unit circle' });
        const B = v.stage({ x: [-3.3, 3.3], y: [-2.6, 3.0], equal: true, axes: false, height: 340, minWidth: 330, title: 'the arm and its velocity ellipse' });
        const hT = toolHandle(B, l1, l2, th, () => +elbow.value);
        const hq = A.handle(Math.cos(0.9), Math.sin(0.9), { color: 'gold', r: 8, label: 'q̇' });
        hq.constrain = (x, y) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n]; };
        let last = +elbow.value;
        let st = null;
        const K = 0.8;
        v.render(() => {
          if (+elbow.value !== last) { last = +elbow.value; const tip = planarFK([l1, l2], th).tip, sol = ik2R(l1, l2, tip[0], tip[1]); if (sol) { th[0] = sol[last][0]; th[1] = sol[last][1]; } }
          const fk = planarFK([l1, l2], th), J = planarJ([l1, l2], th), sv = svd2xn(J), tp = fk.tip;
          hT.set(tp[0], tp[1]);
          // right singular vectors v_i = J^T u_i / sigma_i (or null when sigma ~ 0)
          const vs = sv.u.map((u, i) => { const s = sv.s[i]; const w = [J[0][0] * u[0] + J[1][0] * u[1], J[0][1] * u[0] + J[1][1] * u[1]]; return s > 1e-6 ? [w[0] / s, w[1] / s] : null; });
          // joint-rate side
          A.circle(0, 0, 1, { fill: false, color: 'accent', width: 2 });
          vs.forEach((w, i) => { if (!w) return; A.arrow(0, 0, w[0], w[1], { color: JC[i], width: 2.5, head: 9 }); A.arrow(0, 0, -w[0], -w[1], { color: JC[i], width: 1.5, head: 6, alpha: 0.5 }); });
          const q = [hq.x, hq.y];
          A.arrow(0, 0, q[0], q[1], { color: 'gold', width: 3, head: 10 });
          A.text('θ̇₁', 1.62, -0.12, { size: 12, color: 'muted', align: 'right' }); A.text('θ̇₂', 0.1, 1.55, { size: 12, color: 'muted' });
          // tool side
          B.segment(fk.pts[0], fk.pts[1], { color: 'accent', width: 7, alpha: 0.85 });
          B.segment(fk.pts[1], fk.pts[2], { color: 'orange', width: 7, alpha: 0.85 });
          fk.pts.slice(0, 2).forEach((p) => B.circle(p[0], p[1], 0.07, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
          B.poly(ellipsePts(tp, sv.u[0], sv.u[1], K * sv.s[0], K * sv.s[1]), { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2 });
          sv.u.forEach((u, i) => { const l = K * sv.s[i]; B.arrow(tp[0], tp[1], tp[0] + l * u[0], tp[1] + l * u[1], { color: JC[i], width: 3, head: 9 }); });
          const im = [J[0][0] * q[0] + J[0][1] * q[1], J[1][0] * q[0] + J[1][1] * q[1]];
          B.arrow(tp[0], tp[1], tp[0] + K * im[0], tp[1] + K * im[1], { color: 'gold', width: 3.5, head: 11 });
          B.dot(tp[0], tp[1], { color: 'gold', r: 6 });
          // check that the image satisfies V^T (J J^T)^-1 V = ||q_min||^2 <= 1: use the singular frame
          const c = [im[0] * sv.u[0][0] + im[1] * sv.u[0][1], im[0] * sv.u[1][0] + im[1] * sv.u[1][1]];
          const lvl = (c[0] / sv.s[0]) ** 2 + (sv.s[1] > 1e-6 ? (c[1] / sv.s[1]) ** 2 : 0);
          st = { sv, im, lvl, speed: Math.hypot(...im), q };
        });
        v.readout(() => {
          if (!st) return '';
          const { sv } = st;
          return `Singular values $\\sigma_1=${fx(sv.s[0], 3)}$, $\\sigma_2=${fx(sv.s[1], 3)}$ (the ellipse's semi-axes, $\\sigma_1\\sigma_2=|\\det J|=${fx(sv.s[0] * sv.s[1], 3)}$).\nThe joint rate $\\dot\\theta=(${cn(st.q[0], 2)},${cn(st.q[1], 2)})$ has norm 1 and gives tool velocity $(${cn(st.im[0], 2)},${cn(st.im[1], 2)})$, speed ${fx(st.speed, 2)}; in the ellipse's own coordinates $\\sum(c_i/\\sigma_i)^2=${fx(st.lvl, 3)}$ — on the boundary.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Force ellipsoid and motion–force duality',
      statement: String.raw`With the Jacobian $J\in\R^{m\times n}$ of full row rank, the **force ellipsoid** is the set of tool forces (wrenches) that the arm can hold with joint torques of at most unit size, using $\tau=J^{\mathsf T}F$ from 4.2:
$$\mathcal E_f(\theta)=\{\,F:\ \|J^{\mathsf T}F\|\le1\,\}=\{\,F:\ F^{\mathsf T}(JJ^{\mathsf T})F\le1\,\}.$$
It has **the same principal axes $u_i$** as the manipulability ellipsoid $\mathcal E_v=\{V:V^{\mathsf T}(JJ^{\mathsf T})^{-1}V\le1\}$ of 4.5, but semi-axis lengths $1/\sigma_i$ instead of $\sigma_i$. Along each principal axis, (speed gain)$\times$(force gain)$=\sigma_i\cdot\sigma_i^{-1}=1$: where the arm moves fast it pushes weakly and vice versa. At a singularity ($\sigma_{\min}\to0$) the force ellipsoid becomes infinitely long in the singular direction: the arm can resist unbounded force there with finite torque (zero torque, in fact, 4.2).`,
      idea: String.raw`The two quadratic forms use the same matrix $JJ^{\mathsf T}$, one with its inverse: in the eigenbasis $u_i$ with eigenvalues $\sigma_i^2$, $\mathcal E_v$ is $\sum c_i^2/\sigma_i^2\le1$ and $\mathcal E_f$ is $\sum\sigma_i^2c_i^2\le1$. The reciprocal lengths are the geometric face of the power identity $\tau\cdot\dot\theta=F\cdot V$ (2.10, 4.2): a given joint effort times joint speed budget buys either speed or force at the tool, not both. In a general direction $u$ the product of the two gains is at most 1 with equality only along principal axes, by Cauchy–Schwarz applied to $JJ^{\mathsf T}$.`,
      caption: String.raw`Drag the gold tool handle. The green ellipse (velocity) and the orange ellipse (force, drawn at its own scale) share their axes, and their lengths are reciprocal. The right plot shows, for a direction $\alpha$, the best tool speed $g_v(\alpha)$ and the best holding force $g_f(\alpha)$ for unit joint rates/torques: where one peaks the other dips. The gold line marks the direction $\alpha$ you choose with the slider; the readout multiplies the two gains.`,
      deps: ['robot-4.5', 'robot-4.2'],
      refs: ['Lynch–Park §5.4'],
      tags: ['manipulability', 'force', 'duality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robot_kinematics' },
      viz(v) {
        const l1 = 1.3, l2 = 1.0, th = [0.55, 1.1];
        const alpha = v.slider('direction $\\alpha$ (°)', 0, 180, 30, { step: 1 });
        const elbow = v.select('elbow', [{ value: '0', label: 'down' }, { value: '1', label: 'up' }], '0');
        const A = v.stage({ x: [-3.3, 3.3], y: [-2.6, 3.4], equal: true, axes: false, height: 360, minWidth: 330, title: 'velocity ellipse (green) and force ellipse (orange)' });
        const B = v.stage({ x: [0, 180], y: [0, 3.2], axes: 'box', gutter: true, xlabel: 'direction α (°)', ylabel: 'gain', xticks: [0, 45, 90, 135, 180], height: 360, minWidth: 280, title: 'speed gain and force gain by direction' });
        const hT = toolHandle(A, l1, l2, th, () => +elbow.value);
        let last = +elbow.value, st = null;
        const KV = 0.8, KF = 0.5;
        const gains = (J, a) => {
          const u = [Math.cos(a), Math.sin(a)];
          const a11 = J[0][0] ** 2 + J[0][1] ** 2, a12 = J[0][0] * J[1][0] + J[0][1] * J[1][1], a22 = J[1][0] ** 2 + J[1][1] ** 2; // JJ^T
          const det = a11 * a22 - a12 * a12, q = a11 * u[0] * u[0] + 2 * a12 * u[0] * u[1] + a22 * u[1] * u[1];
          const qi = det > 1e-12 ? (a22 * u[0] * u[0] - 2 * a12 * u[0] * u[1] + a11 * u[1] * u[1]) / det : Infinity;
          return { gv: Number.isFinite(qi) ? 1 / Math.sqrt(qi) : 0, gf: 1 / Math.sqrt(q) };
        };
        v.render(() => {
          if (+elbow.value !== last) { last = +elbow.value; const tip = planarFK([l1, l2], th).tip, sol = ik2R(l1, l2, tip[0], tip[1]); if (sol) { th[0] = sol[last][0]; th[1] = sol[last][1]; } }
          const fk = planarFK([l1, l2], th), J = planarJ([l1, l2], th), sv = svd2xn(J), tp = fk.tip;
          hT.set(tp[0], tp[1]);
          A.segment(fk.pts[0], fk.pts[1], { color: 'accent', width: 7, alpha: 0.85 });
          A.segment(fk.pts[1], fk.pts[2], { color: 'orange', width: 7, alpha: 0.85 });
          fk.pts.slice(0, 2).forEach((p) => A.circle(p[0], p[1], 0.07, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
          const sMin = Math.max(sv.s[1], 0.06);
          A.poly(ellipsePts(tp, sv.u[0], sv.u[1], KV * sv.s[0], KV * sv.s[1]), { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2 });
          A.poly(ellipsePts(tp, sv.u[0], sv.u[1], KF / sv.s[0], KF / sMin), { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 2 });
          const a = alpha.value * DEG, u = [Math.cos(a), Math.sin(a)], g = gains(J, a);
          A.line(tp[0] - 1.9 * u[0], tp[1] - 1.9 * u[1], tp[0] + 1.9 * u[0], tp[1] + 1.9 * u[1], { color: 'gold', width: 1.5, alpha: 0.7 });
          A.dot(tp[0] + KV * g.gv * u[0], tp[1] + KV * g.gv * u[1], { color: 'green', r: 5 });
          A.dot(tp[0] + KF * g.gf * u[0], tp[1] + KF * g.gf * u[1], { color: 'orange', r: 5 });
          A.dot(tp[0], tp[1], { color: 'gold', r: 6 });
          B.fn((x) => Math.min(gains(J, x * DEG).gv, 3.2), { color: 'green', width: 2.4, n: 360 });
          B.fn((x) => Math.min(gains(J, x * DEG).gf, 3.2), { color: 'orange', width: 2.4, n: 360 });
          B.vline(alpha.value, { color: 'gold', width: 1.5 });
          B.dot(alpha.value, Math.min(g.gv, 3.2), { color: 'green', r: 5 }); B.dot(alpha.value, Math.min(g.gf, 3.2), { color: 'orange', r: 5 });
          const a1 = sv.ang / DEG, ap = ((a1 % 180) + 180) % 180;
          B.dot(ap, Math.min(sv.s[0], 3.2), { color: 'green', hollow: true, r: 6 }); B.dot(ap, Math.min(1 / sv.s[0], 3.2), { color: 'orange', hollow: true, r: 6 });
          st = { sv, g, prod: g.gv * g.gf, a1: ap };
        });
        v.legend([['green', 'speed gain $g_v$ (tool speed per unit joint rate)'], ['orange', 'force gain $g_f$ (holdable force per unit torque)']]);
        v.readout(() => {
          if (!st) return '';
          const { sv, g } = st;
          return `Singular values $\\sigma=(${fx(sv.s[0], 3)},${fx(sv.s[1], 3)})$. Along the major axis ($\\alpha=${fx(st.a1, 0)}^\\circ$): speed gain $\\sigma_1=${fx(sv.s[0], 3)}$, force gain $1/\\sigma_1=${fx(1 / sv.s[0], 3)}$, product $1$. Along the minor axis: $\\sigma_2=${fx(sv.s[1], 3)}$ and $1/\\sigma_2=${sv.s[1] > 1e-4 ? fx(1 / sv.s[1], 2) : '\\infty'}$.\nIn your direction $\\alpha=${fx(alpha.value, 0)}^\\circ$: $g_v=${fx(g.gv, 3)}$, $g_f=${fx(g.gf, 3)}$, product $${fx(st.prod, 3)}\\le1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Manipulability measures',
      statement: String.raw`A **manipulability measure** condenses the ellipsoid of 4.5 into one number that tells how well-conditioned a posture is. With the singular values $\sigma_1\ge\dots\ge\sigma_m>0$ of the Jacobian (for a task whose coordinates share one unit) the standard choices are:
(a) Yoshikawa's index $w=\sqrt{\det(JJ^{\mathsf T})}=\sigma_1\cdots\sigma_m$, proportional to the volume of the ellipsoid, which vanishes exactly at singularities;
(b) the smallest singular value $\sigma_m$, the speed in the worst direction;
(c) the condition number $\kappa=\sigma_1/\sigma_m\ge1$, or its inverse $1/\kappa\in(0,1]$ (the *isotropy*); $\kappa=1$ means an **isotropic** posture, where the ellipsoid is a ball and the tool moves equally easily in every direction.
For the planar $2$R arm with link lengths $\ell_1,\ell_2$ all of these depend on $\theta_2$ alone: $w=\ell_1\ell_2|\sin\theta_2|$, and the eigenvalues of $JJ^{\mathsf T}$ are $\tfrac12\big(t\pm\sqrt{t^2-4w^2}\big)$ with $t=\ell_1^2+2\ell_2^2+2\ell_1\ell_2\cos\theta_2$. The condition number reaches $1$ only if $\ell_1=\sqrt2\,\ell_2$, at $\theta_2=\pm135^\circ$.`,
      idea: String.raw`All three are functions of the spectrum of $JJ^{\mathsf T}$, which for the $2$R arm has trace $t$ and determinant $w^2$ (columns of lengths $|c_1|^2=\ell_1^2+\ell_2^2+2\ell_1\ell_2\cos\theta_2$ and $|c_2|^2=\ell_2^2$, inner product $\ell_2^2+\ell_1\ell_2\cos\theta_2$), so the eigenvalues follow from the quadratic formula and depend on $\theta_2$ only. They disagree about what “best” means: $w$ is largest at an elbow of $90^\circ$ whatever the lengths, $\sigma_{\min}$ and $\kappa$ are optimised elsewhere. Isotropy requires the two columns to be orthogonal ($\cos\theta_2=-\ell_2/\ell_1$) and of equal length ($\cos\theta_2=-\ell_1/(2\ell_2)$), and both hold only for $\ell_1^2=2\ell_2^2$.`,
      caption: String.raw`The map colours the tool's workspace by the chosen measure (bright = good); because only $\theta_2$ matters the colour depends only on distance from the base, giving the concentric bands. Drag the tool handle and read the numbers; the plot on the right shows the measure against the elbow angle with the best angle marked. Slide $\ell_2/\ell_1$: for $\ell_1=\sqrt2\,\ell_2$ (ratio $0.707$) the condition number touches $1$ at $\theta_2=\pm135^\circ$.`,
      deps: ['robot-4.5'],
      refs: ['Lynch–Park §5.4'],
      tags: ['manipulability', 'condition number', 'isotropy'],
      credit: 'Manipulability index: Yoshikawa, 1985; condition number as a measure: Salisbury & Craig, 1982',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robot_kinematics' },
      viz(v) {
        const meas = v.select('measure', [
          { value: 'w', label: 'volume $w=\\sigma_1\\sigma_2$' },
          { value: 'smin', label: '$\\sigma_{\\min}$' },
          { value: 'inv', label: 'isotropy $1/\\kappa$' },
          { value: 'kappa', label: 'condition number $\\kappa$' },
        ], 'w');
        const rat = v.slider('link ratio $\\ell_2/\\ell_1$', 0.3, 1.6, 0.8, { step: 0.01 });
        const A = v.stage({ x: [-2.7, 2.7], y: [-2.7, 2.7], equal: true, axes: false, height: 400, minWidth: 330, title: 'workspace coloured by the measure' });
        const B = v.stage({ x: [0, 180], y: [0, 1], axes: 'box', gutter: true, xlabel: 'elbow angle θ₂ (°)', ylabel: 'measure', xticks: [0, 45, 90, 135, 180], height: 400, minWidth: 280, title: 'the measure as a function of θ₂' });
        const th = [0.5, 1.2];
        const hT = toolHandle(A, 1, 0.8, th, () => 0);
        const spec = (l1, l2, t2) => {
          const c = Math.cos(t2), tr = l1 * l1 + 2 * l2 * l2 + 2 * l1 * l2 * c, w = l1 * l2 * Math.abs(Math.sin(t2));
          const disc = Math.sqrt(Math.max(0, tr * tr / 4 - w * w)), a = tr / 2 + disc, b = Math.max(0, tr / 2 - disc);
          return [Math.sqrt(a), Math.sqrt(b)];
        };
        const val = (m, s) => (m === 'w' ? s[0] * s[1] : m === 'smin' ? s[1] : m === 'inv' ? (s[0] > 0 ? s[1] / s[0] : 0) : (s[1] > 1e-9 ? s[0] / s[1] : Infinity));
        // cap used for the colour scale and the curve
        const scale = (m, l1, l2) => (m === 'w' ? l1 * l2 : m === 'smin' ? Math.min(l1, l2) * 1.0 : m === 'inv' ? 1 : 8);
        let st = null;
        v.render(() => {
          const l1 = 1, l2 = rat.value, m = meas.value, R = l1 + l2;
          hT.constrain = (x, y) => {
            const r = Math.hypot(x, y), rr = clamp(r, Math.abs(l1 - l2) + 1e-3, R - 1e-3), k = r < 1e-9 ? 1 : rr / r; x *= k; y *= k;
            const sol = ik2R(l1, l2, x, y); if (sol) { th[0] = sol[0][0]; th[1] = sol[0][1]; }
            return [x, y];
          };
          const sc = scale(m, l1, l2);
          const col = (r) => {
            if (r > R || r < Math.abs(l1 - l2)) return null;
            const t2 = Math.acos(clamp((r * r - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1)), val0 = val(m, spec(l1, l2, t2));
            const t = m === 'kappa' ? 1 - clamp(Math.log(Math.max(val0, 1)) / Math.log(sc), 0, 1) : clamp(val0 / sc, 0, 1);
            return v.ramp(t, 'green');
          };
          A.raster((x, y) => col(Math.hypot(x, y)), { res: 3, key: `${m}|${rat.value.toFixed(3)}` });
          const fk = planarFK([l1, l2], th);
          hT.set(fk.tip[0], fk.tip[1]);
          A.segment(fk.pts[0], fk.pts[1], { color: 'accent', width: 6, alpha: 0.9 });
          A.segment(fk.pts[1], fk.pts[2], { color: 'orange', width: 6, alpha: 0.9 });
          fk.pts.slice(0, 2).forEach((p) => A.circle(p[0], p[1], 0.06, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
          const J = planarJ([l1, l2], th), sv = svd2xn(J);
          A.poly(ellipsePts(fk.tip, sv.u[0], sv.u[1], 0.45 * sv.s[0], 0.45 * sv.s[1]), { fill: 'gold', fillAlpha: 0.25, color: 'ink', width: 1.5 });
          A.dot(fk.tip[0], fk.tip[1], { color: 'gold', r: 6 });
          // curve of the measure against θ2
          const f = (x) => { const o = val(m, spec(l1, l2, x * DEG)); return Number.isFinite(o) ? o : NaN; };
          const ymax = m === 'kappa' ? 8 : m === 'w' ? Math.max(0.1, l1 * l2) * 1.1 : m === 'smin' ? Math.min(l1, l2) * 1.1 : 1.05;
          B.setView([0, 180], m === 'kappa' ? [1, ymax] : [0, ymax]);
          B.fn((x) => Math.min(f(x), ymax), { color: 'accent', width: 2.4, n: 360 });
          let best = { x: 0, y: m === 'kappa' ? Infinity : -Infinity };
          for (let d = 0.5; d < 180; d += 0.5) { const y = f(d); if (!Number.isFinite(y)) continue; if (m === 'kappa' ? y < best.y : y > best.y) best = { x: d, y }; }
          B.dot(best.x, Math.min(best.y, ymax), { color: 'green', r: 6 });
          B.text(`best ${fx(best.x, 1)}°`, best.x, Math.min(best.y, ymax), { size: 11.5, color: 'green', dx: 8, dy: m === 'kappa' ? -18 : 20 });
          const t2 = Math.abs(th[1]) / DEG;
          B.vline(t2, { color: 'gold', width: 1.5 });
          B.dot(t2, Math.min(f(t2), ymax), { color: 'gold', r: 6 });
          let kmin = Infinity; for (let d = 0.5; d < 180; d += 0.5) kmin = Math.min(kmin, val('kappa', spec(l1, l2, d * DEG)));
          st = { sv, best, kmin, t2 };
        });
        v.readout(() => {
          if (!st) return '';
          const { sv } = st;
          return `At the tool: $\\sigma=(${fx(sv.s[0], 3)},${fx(sv.s[1], 3)})$, $w=${fx(sv.s[0] * sv.s[1], 3)}$, $\\kappa=${sv.s[1] > 1e-6 ? fx(sv.s[0] / sv.s[1], 2) : '\\infty'}$, $1/\\kappa=${fx(sv.s[1] / sv.s[0], 3)}$ at $\\theta_2=${fx(st.t2, 0)}^\\circ$.\nOver all elbow angles the best value of the chosen measure is reached at $\\theta_2=${fx(st.best.x, 1)}^\\circ$; the smallest possible condition number for this arm is $\\kappa_{\\min}=${fx(st.kmin, 3)}$ ($=1$ only for $\\ell_2/\\ell_1=0.707$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Concept',
      name: 'Redundancy and null-space self-motion',
      statement: String.raw`An arm is **kinematically redundant** for a task when it has more joints than the task has coordinates: $n>m$, for instance a planar three-joint arm positioning its tool point in the plane ($n=3$, $m=2$). At any configuration where $J(\theta)\in\R^{m\times n}$ has rank $m$, rank–nullity (ladr-3.21) gives $\dim\ker J=n-m\ge1$. A joint velocity $\dot\theta\in\ker J$ is a **self-motion**: the joints move and the tool does not. The set of configurations reaching one fixed tool position is a curve (a union of loops, for the planar 3R arm) in joint space, and every solution of $J\dot\theta=V$ has the form
$$\dot\theta=J^{+}V+(I-J^{+}J)\,z,\qquad z\in\R^n\ \text{arbitrary},$$
the minimum-norm solution plus a null-space motion. Choosing $z=-\nabla H(\theta)$ for a secondary objective $H$ (distance from joint limits, from obstacles, a manipulability index of 4.7) uses the freedom without disturbing the task.`,
      idea: String.raw`Rank–nullity counts the freedom: $n$ joint rates, $m$ of them needed to produce the task velocity, $n-m$ left over. The matrix $I-J^{+}J$ is the orthogonal projector onto $\ker J$, so adding any vector it produces changes no tool velocity, and $J^{+}V$ is the shortest solution because it is orthogonal to the kernel. For the planar 3R arm the self-motion is easy to draw without Jacobians: fix the tool point $p$ and let the tool's heading $\phi$ vary; for each $\phi$ the wrist point $p-\ell_3(\cos\phi,\sin\phi)$ is fixed and the first two links reach it in at most two ways (4.3 and 3.3), so the family of postures is one-dimensional. Its tangent is the null vector of $J$.`,
      caption: String.raw`The tool is pinned at $p$ (drag the gold handle to move $p$). The slider $\phi$ is the tool's heading, the single parameter of the self-motion: as you move it, the elbow sweeps through a family of postures while the tool stays put (faint ghosts show the whole family for the chosen elbow branch). The right plot is the self-motion manifold in joint space $(\theta_1,\theta_2)$: a closed loop per elbow branch. The readout checks that the joint velocity along the loop is annihilated by $J$ and parallel to the null vector. Drag $p$ toward the edge of the workspace: the loop shrinks and breaks into arcs when the first two links can no longer reach.`,
      deps: ['robot-4.1', 'ladr-3.21'],
      refs: ['Lynch–Park §6.3', 'Siciliano ch. 3'],
      tags: ['redundancy', 'null space', 'self-motion'],
      credit: 'Null-space projection of a secondary objective: Liégeois, 1977',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robot_kinematics' },
      viz(v) {
        const L = [1.0, 0.9, 0.6];
        const phi = v.slider('tool heading $\\phi$ (°)', -180, 180, 40, { step: 1 });
        const br = v.select('elbow branch', [{ value: '0', label: 'up' }, { value: '1', label: 'down' }], '0');
        const showAll = v.toggle('show the family of postures', true);
        const A = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, axes: false, height: 400, minWidth: 320, title: 'a planar 3R arm with its tool fixed' });
        const B = v.stage({ x: [-180, 180], y: [-180, 180], axes: 'box', gutter: true, xlabel: 'θ₁ (°)', ylabel: 'θ₂ (°)', xticks: [-180, -90, 0, 90, 180], yticks: [-180, -90, 0, 90, 180], height: 400, minWidth: 300, title: 'self-motion manifold in joint space' });
        let p = [1.1, 0.6];
        const hP = A.handle(p[0], p[1], { color: 'gold', r: 8, label: 'p' });
        hP.constrain = (x, y) => { const r = Math.hypot(x, y), R = 2.35; if (r > R) { x *= R / r; y *= R / r; } p = [x, y]; return [x, y]; };
        const config = (ph, b) => {
          const w = [p[0] - L[2] * Math.cos(ph), p[1] - L[2] * Math.sin(ph)], sol = ik2R(L[0], L[1], w[0], w[1]);
          if (!sol) return null;
          const t = sol[b]; return [t[0], t[1], wrapPi(ph - t[0] - t[1])];
        };
        let st = null;
        v.render(() => {
          const b = +br.value, ph = phi.value * DEG;
          // the whole manifold, both branches
          for (let bb = 0; bb < 2; bb++) {
            let seg = [], prevT = null; const N = 360;
            for (let k = 0; k <= N; k++) {
              const t = config(-Math.PI + (TAU * k) / N, bb);
              if (!t) { if (seg.length) B.path(seg, { color: bb === b ? 'accent' : 'muted', width: bb === b ? 2.5 : 1.5, alpha: bb === b ? 1 : 0.6 }); seg = []; prevT = null; continue; }
              const pt = [t[0] / DEG, t[1] / DEG];
              if (prevT && (Math.abs(pt[0] - prevT[0]) > 180 || Math.abs(pt[1] - prevT[1]) > 180)) { B.path(seg, { color: bb === b ? 'accent' : 'muted', width: bb === b ? 2.5 : 1.5, alpha: bb === b ? 1 : 0.6 }); seg = []; }
              seg.push(pt); prevT = pt;
            }
            if (seg.length) B.path(seg, { color: bb === b ? 'accent' : 'muted', width: bb === b ? 2.5 : 1.5, alpha: bb === b ? 1 : 0.6 });
          }
          const cur = config(ph, b);
          if (showAll.value) {
            for (let k = 0; k < 36; k++) {
              const t = config(-Math.PI + (TAU * k) / 36, b); if (!t) continue;
              A.path(planarFK(L, t).pts, { color: 'accent', width: 1.2, alpha: 0.25 });
            }
          }
          A.circle(0, 0, L[0] + L[1] + L[2] - 0.05, { fill: false, color: 'faint', width: 1, dash: [4, 4] });
          if (cur) {
            const fk = planarFK(L, cur);
            [0, 1, 2].forEach((i) => A.segment(fk.pts[i], fk.pts[i + 1], { color: JC[i], width: 7, alpha: 0.9 }));
            fk.pts.slice(0, 3).forEach((q) => A.circle(q[0], q[1], 0.07, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }));
            A.arrow(p[0], p[1], p[0] + 0.5 * Math.cos(ph), p[1] + 0.5 * Math.sin(ph), { color: 'orange', width: 3, head: 9 });
            B.dot(cur[0] / DEG, cur[1] / DEG, { color: 'gold', r: 7 });
          } else A.corner('this heading cannot be reached: the first two links fall short of the wrist point', 'tl', { color: 'red', plate: true });
          A.dot(p[0], p[1], { color: 'gold', r: 6 });
          // self-motion check: d theta/d phi by central difference, J times it, comparison with the null vector of J
          let chk = null;
          if (cur) {
            const h = 1e-4, a = config(ph - h, b), c = config(ph + h, b);
            if (a && c) {
              const dth = [0, 1, 2].map((i) => { let d = c[i] - a[i]; d -= TAU * Math.round(d / TAU); return d / (2 * h); });
              const J = planarJ(L, cur), Jd = [J[0][0] * dth[0] + J[0][1] * dth[1] + J[0][2] * dth[2], J[1][0] * dth[0] + J[1][1] * dth[1] + J[1][2] * dth[2]];
              const nv = [J[0][1] * J[1][2] - J[0][2] * J[1][1], J[0][2] * J[1][0] - J[0][0] * J[1][2], J[0][0] * J[1][1] - J[0][1] * J[1][0]], nn = Math.hypot(...nv), dn = Math.hypot(...dth);
              const cosang = nn > 1e-9 ? Math.abs(dth[0] * nv[0] + dth[1] * nv[1] + dth[2] * nv[2]) / (nn * dn) : NaN;
              chk = { dth, Jd: Math.hypot(...Jd), cosang, dn };
            }
          }
          st = { cur, chk, ph };
        });
        v.readout(() => {
          if (!st || !st.cur) return 'Heading out of reach for this tool position.';
          const c = st.cur, k = st.chk;
          return `Joint angles $(${c.map((x) => fx(x / DEG, 1)).join(',\\;')})^\\circ$ for tool position $p=(${fx(p[0], 2)},${fx(p[1], 2)})$ — the same $p$ at every heading $\\phi$.\n${k ? `Self-motion velocity $d\\theta/d\\phi=(${k.dth.map((x) => cn(x, 2)).join(',\\;')})$: $\\|J\\,d\\theta/d\\phi\\|=${v.sci(k.Jd + 1e-17, 1)}$ (no tool motion), and it is parallel to the null vector of $J$ ($|\\cos|=${Number.isFinite(k.cosang) ? fx(k.cosang, 6) : '—'}$).` : ''}`;
        });
      },
    },
  ],
};
