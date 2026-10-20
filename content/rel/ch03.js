// Special & General Relativity — Chapter 3: Four-vectors and Minkowski geometry
import { gam, toMoving, fromMoving, P, lightLines, ETA, mm, mv, tr, boost4, mdot, invCurve, osc, equalAccelGap, thomasTable } from './ch03.shared.js';

export default {
  collection: 'rel',
  chapter: 3,
  title: 'Four-vectors and Minkowski geometry',
  summary: String.raw`Minkowski space is a vector space with an indefinite inner product, and physics is written in terms of objects that transform simply under boosts: four-vectors, one-forms and tensors. Four-velocity and four-acceleration describe motion geometrically, and the reversed triangle inequality explains why straight worldlines age the most. Uniform acceleration gives hyperbolic worldlines, a horizon in flat space, and the surprising Bell spaceship and Thomas precession effects.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Four-vectors and the Minkowski metric',
      credit: 'Minkowski, lecture of September 1908 (published 1909)',
      statement: String.raw`Minkowski space is $\R^4$ with coordinates $x^\mu=(ct,x,y,z)$ and the indefinite symmetric bilinear form $\eta(A,B)=A^0B^0-A^1B^1-A^2B^2-A^3B^3$, signature $(+,-,-,-)$ (many authors use the opposite sign). A **four-vector** is a quadruple $A^\mu$ that changes under a Lorentz transformation exactly as coordinate differences do, $A'^\mu=\Lambda^\mu{}_\nu A^\nu$. Because $\Lambda^{\!\top}\eta\Lambda=\eta$, the number $\eta(A,A)=A^0{}^2-|\mathbf A|^2$ is the same in every frame; its sign makes $A$ **timelike** ($>0$), **null** ($=0$) or **spacelike** ($<0$).`,
      idea: String.raw`Rel-2.13 says the Lorentz transformations are exactly the linear maps that preserve $\eta$, so any expression built from $\eta$ alone cannot depend on the frame. The form is symmetric and non-degenerate, so by the diagonalisation theorem for symmetric forms (ladr-9.12) it has an orthonormal basis, and the signature $(+,-,-,-)$ is the one that survives from the invariant interval of rel-1.7. In the language of manifolds this is the flat pseudo-Riemannian metric of mfd-8.10: a boost is a hyperbolic rotation, which moves $A$ along the curve $\eta(A,A)=\text{const}$ rather than round a circle.`,
      caption: String.raw`**Drag the vector $A$** (the blue handle) and the **boost slider.** The right panel redraws the same vector in the boosted frame $S'$: its components change, but the tip slides along the dashed green curve $A^0{}^2-A^1{}^2=\text{const}$ and $\eta(A,A)$ in the readout does not move. The colour of the arrow records the causal type: blue timelike, gold null, orange spacelike; the buttons jump to one of each. Switch on the **Euclidean** toggle to use $t^2+x^2$ instead and watch that number change with the boost, because the tip leaves the red circle.`,
      deps: ['rel-2.13', 'ladr-9.12', 'mfd-8.10'],
      refs: ['Schutz §2.1', 'Carroll ch. 1'],
      tags: ['four-vector', 'Minkowski metric', 'invariant'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Four-vector' },
      viz(v) {
        const R = 4;
        const bS = v.slider('boost $v/c$', -0.9, 0.9, 0.5, { step: 0.01 });
        const eu = v.toggle('Euclidean "length" $t^2+x^2$ instead (wrong)', false);
        v.button('timelike', () => H.set(0.8, 2.4)); v.button('null', () => H.set(2.3, 2.3)); v.button('spacelike', () => H.set(2.8, 0.9));
        const A = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: true, height: 400, minWidth: 300, title: 'frame $S$: $(x, ct)$' });
        const B = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: true, height: 400, minWidth: 300, title: 'the same vector in the boosted frame $S\'$' });
        const H = A.handle(0.8, 2.4, { color: 'accent', label: 'A', labelPos: 'ne', constrain: { x: [-3.7, 3.7], y: [-3.7, 3.7] } });
        let st = {};
        v.render(() => {
          const b = bS.value, t = H.y, x = H.x, [tp, xp] = toMoving(b, t, x);
          const s2 = t * t - x * x, tol = 0.05 * (t * t + x * x);
          const col = Math.abs(s2) < tol ? 'gold' : s2 > 0 ? 'accent' : 'orange';
          for (const [S, tt, xx] of [[A, t, x], [B, tp, xp]]) {
            lightLines(S, 8);
            if (eu.value) S.circle(0, 0, Math.hypot(t, x), { color: 'red', width: 1.4, dash: [5, 4], alpha: 0.8 });
            else invCurve(S, tt, xx);
            S.line(xx, 0, xx, tt, { color: 'faint', dash: [3, 3] }); S.line(0, tt, xx, tt, { color: 'faint', dash: [3, 3] });
            S.arrow(0, 0, xx, tt, { color: col, width: 2.8 });
            if (S === B) S.dot(xx, tt, { r: 5.5, color: col });
            S.text('x', R - 0.15, 0, { dy: -10, align: 'right', color: 'muted', math: true }); S.text('ct', 0.1, R - 0.25, { dx: 6, color: 'muted', math: true });
          }
          st = { b, t, x, tp, xp, s2, col, cls: Math.abs(s2) < tol ? 'null (approximately)' : s2 > 0 ? 'timelike' : 'spacelike' };
        });
        v.legend([['accent', 'timelike'], ['gold', 'null'], ['orange', 'spacelike'], ['green', 'invariant curve $\\eta(A,A)=$ const', { dash: true }]]);
        v.readout(() => {
          const { b, t, x, tp, xp, s2, cls } = st; if (t === undefined) return '';
          const l1 = String.raw`$v/c=${v.fix(b, 2)}$. In $S$: $A^\mu=(${v.fix(t, 2)},\,${v.fix(x, 2)})$. In $S'$: $A'^\mu=(${v.fix(tp, 2)},\,${v.fix(xp, 2)})$. The vector is **${cls}**.`;
          return l1 + '\n' + (eu.value ? String.raw`$t^2+x^2$ is $${v.fix(t * t + x * x, 3)}$ in $S$ but $${v.fix(tp * tp + xp * xp, 3)}$ in $S'$: not a property of the vector.`
            : String.raw`$\eta(A,A)=${v.fix(s2, 4)}$ in $S$ and $${v.fix(tp * tp - xp * xp, 4)}$ in $S'$: the same number.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Minkowski orthogonality',
      statement: String.raw`Two four-vectors $A$ and $B$ are **Minkowski-orthogonal** when $\eta(A,B)=0$. Since $\eta$ is Lorentz-invariant, orthogonality does not depend on the frame. In a $(ct,x)$ diagram, $A=(a^0,a^1)$ is orthogonal to $B=\lambda\,(a^1,a^0)$: the two arrows are mirror images in the light line, so a timelike vector is orthogonal to a spacelike one, never to another timelike vector. A null vector is orthogonal to itself, and therefore to the whole null direction it spans; the orthogonal complement of a timelike vector is the spacelike "simultaneity" hyperplane of its own rest frame.`,
      idea: String.raw`Solving $a^0b^0-a^1b^1=0$ gives $b^0/b^1=a^1/a^0$, which is a reflection in the line $ct=x$. A boost rotates both arrows hyperbolically, i.e. it carries the mirror pair to another mirror pair, which is the invariance of $\eta(A,B)$ (rel-3.1). The Euclidean angle drawn on the page is therefore not meaningful: it is only $90^\circ$ when $A$ lies on a coordinate axis. The picture of a spacelike line orthogonal to a worldline is exactly the line of simultaneity of rel-1.6.

For a nonzero $A\in\R^4$, the linear functional $T_A(B)=\eta(A,B)$ is nonzero because the metric is nondegenerate. Its range is therefore all of $\R$; rank-nullity (ladr 3.21) gives $\dim\ker T_A=4-1=3$. This is the orthogonal hyperplane. When $A$ is timelike, its rest frame makes the equation $B^0=0$, so every nonzero member is spacelike. For $A=0$, instead, the kernel is all of $\R^4$ and has dimension four. In the planar ratio above the denominators must be nonzero; the original linear equation, or $B=\lambda(a^1,a^0)$ for nonzero planar $A$, also handles the coordinate axes and $B=0$.`,
      caption: String.raw`**Drag $A$** and scale $B=\lambda(a^1,a^0)$ with the slider; the dashed line is the set of all vectors orthogonal to $A$. Boost with the slider: both arrows move, yet remain mirror images of each other, and $\eta(A,B)$ stays $0$. The readout also gives the angle you would measure on the page with a protractor. The button **null** puts $A$ on the light cone: its orthogonal line then coincides with $A$ itself.`,
      deps: ['rel-3.1', 'ladr-3.21'],
      refs: ['Schutz §2.5'],
      tags: ['orthogonality', 'light cone', 'simultaneity'],
      viz(v) {
        const R = 4;
        const bS = v.slider('boost $v/c$', -0.9, 0.9, 0.45, { step: 0.01 });
        const lam = v.slider('$\\lambda$ (scale of $B$)', -1.6, 1.6, 0.9, { step: 0.01 });
        v.button('null', () => H.set(2.4, 2.4));
        const A = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: true, height: 400, minWidth: 300, title: 'frame $S$' });
        const B = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: true, height: 400, minWidth: 300, title: 'frame $S\'$: still mirror images' });
        const H = A.handle(0.9, 2.1, { color: 'accent', label: 'A', labelPos: 'ne', constrain: { x: [-3.7, 3.7], y: [-3.7, 3.7] } });
        let st = {};
        v.render(() => {
          const b = bS.value, l = lam.value, ta = H.y, xa = H.x, tb = l * xa, xb = l * ta;
          const [tap, xap] = toMoving(b, ta, xa), [tbp, xbp] = toMoving(b, tb, xb);
          for (const [S, t1, x1, t2, x2] of [[A, ta, xa, tb, xb], [B, tap, xap, tbp, xbp]]) {
            lightLines(S, 8);
            const n = Math.hypot(t2, x2);
            if (n > 1e-6) S.line(-7 * x2 / n, -7 * t2 / n, 7 * x2 / n, 7 * t2 / n, { color: 'green', dash: [5, 4], width: 1.3, alpha: 0.8 });
            S.arrow(0, 0, x1, t1, { color: 'accent', width: 2.8 }); S.arrow(0, 0, x2, t2, { color: 'orange', width: 2.8 });
            if (S === B) S.text('A', x1, t1, { dx: 10, dy: -8, color: 'accent', math: true }); S.text('B', x2, t2, { dx: 10, dy: -8, color: 'orange', math: true });
          }
          const ctn = (2 * l * ta * xa) / (Math.hypot(ta, xa) * Math.hypot(l * xa, l * ta) || 1);
          st = { b, ta, xa, tb, xb, tap, xap, tbp, xbp, ang: (Math.acos(Math.max(-1, Math.min(1, ctn))) * 180) / Math.PI, cls: Math.abs(ta * ta - xa * xa) < 0.05 * (ta * ta + xa * xa) ? 'null' : ta * ta > xa * xa ? 'timelike' : 'spacelike' };
        });
        v.legend([['accent', '$A$'], ['orange', '$B$ (mirror image of $A$)'], ['green', 'all vectors orthogonal to $A$', { dash: true }], ['gold', 'light', { dash: true }]]);
        v.readout(() => {
          const { b, ta, xa, tb, xb, tap, xap, tbp, xbp, ang, cls } = st; if (ta === undefined) return '';
          return String.raw`$A$ is ${cls}. $\eta(A,B)=${v.fix(ta * tb - xa * xb, 4)}$ in $S$, $\eta(A',B')=${v.fix(tap * tbp - xap * xbp, 4)}$ in $S'$ ($v/c=${v.fix(b, 2)}$).` + '\n' +
            String.raw`The angle between the arrows on the page is $${v.fix(ang, 1)}^\circ$ (not $90^\circ$): orthogonality here is the mirror reflection in the light line, not a right angle.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Reversed triangle inequality',
      statement: String.raw`Let $O$ and $Q$ be events with $Q$ in the future of $O$ and timelike separated, and let $M$ be an event such that $O\to M$ and $M\to Q$ are both future-directed and timelike. Then
$$\tau(O,M)+\tau(M,Q)\ \le\ \tau(O,Q),$$
where $\tau(X,Y)=\sqrt{(\Delta t)^2-|\Delta\mathbf x|^2}$ (units $c=1$), with equality exactly when $M$ lies on the straight segment $OQ$. Consequently, of all timelike worldlines from $O$ to $Q$ the straight one has the **greatest** proper time. (For vectors: $\|A+B\|\ge\|A\|+\|B\|$ for future timelike $A,B$.)`,
      idea: String.raw`Boost to the frame in which $O\to Q$ is purely temporal, so $\tau(O,Q)=\Delta t$. The two legs are timelike by hypothesis, so each $\tau(\cdot)=\sqrt{\Delta t_i^2-\Delta x_i^2}\le\Delta t_i$, with $\Delta t_1+\Delta t_2=\Delta t$ and $\Delta x_1+\Delta x_2=0$; hence the sum of the proper times is at most $\Delta t$, with equality only if both $\Delta x_i=0$. Proper time is invariant (rel-1.9), so this frame costs nothing. The sign flip relative to Euclid arises from the minus in $\eta$.`,
      caption: String.raw`**Drag $M$ and $Q$.** Left: the shaded diamond is where $M$ makes two timelike legs; outside it the bent path is not a possible worldline and turns red. Right: slide $M$ horizontally at its height and compare two sums as functions of $x_M$: the Minkowski sum of proper times (blue) has its **maximum** on the straight line, equal to $\tau(O,Q)$, while the Euclidean sum of lengths (red) has its minimum there, the ordinary triangle inequality.`,
      deps: ['rel-3.2', 'rel-1.9'],
      refs: ['Taylor–Wheeler §5.7', 'Carroll ch. 1'],
      tags: ['triangle inequality', 'proper time', 'twin paradox'],
      scope: String.raw`Flat spacetime, timelike legs only; the direction of the inequality reverses compared with Euclidean geometry.`,
      viz(v) {
        const A = v.stage({ x: [-3.6, 3.6], y: [-0.8, 5.6], equal: true, axes: true, height: 420, minWidth: 300, weight: 1.1, title: 'two paths from $O$ to $Q$ (axes $x$, $ct$)' });
        const Bc = v.stage({ x: [-3.6, 3.6], y: [0, 7], axes: 'box', gutter: true, height: 420, minWidth: 280, weight: 0.9, xlabel: '$x_M$ at the height of $M$', ylabel: 'total over the two legs', title: 'sliding $M$ sideways' });
        const Q = A.handle(0.6, 4.0, { color: 'green', label: 'Q', labelPos: 'ne', constrain: (x, y) => { const t = Math.max(1.5, Math.min(5, y)); return [Math.max(-0.8 * t, Math.min(0.8 * t, x)), t]; } });
        const M = A.handle(1.4, 2.0, { color: 'orange', label: 'M', labelPos: 'e', constrain: { x: [-3.4, 3.4], y: [-0.5, 5.3] } });
        const tau = (dt, dx) => (dt > Math.abs(dx) ? Math.sqrt(dt * dt - dx * dx) : null);
        let st = {};
        v.render(() => {
          const tq = Q.y, xq = Q.x, tm = M.y, xm = M.x;
          A.poly([[0, 0], [(tq + xq) / 2, (tq + xq) / 2], [xq, tq], [-(tq - xq) / 2, (tq - xq) / 2]], { fill: 'green', fillAlpha: 0.1, stroke: false });
          lightLines(A, 8, {}); A.line(xq - 8, tq + 8, xq + 8, tq - 8, { color: 'gold', width: 1, alpha: 0.4, dash: [4, 4] }); A.line(xq - 8, tq - 8, xq + 8, tq + 8, { color: 'gold', width: 1, alpha: 0.4, dash: [4, 4] });
          const t1 = tau(tm, xm), t2 = tau(tq - tm, xq - xm), valid = t1 !== null && t2 !== null;
          A.segment([0, 0], [xq, tq], { color: 'green', width: 2.8 });
          A.path([[0, 0], [xm, tm], [xq, tq]], { color: valid ? 'orange' : 'red', width: 2.6, dash: valid ? undefined : [5, 4] });
          A.dot(0, 0, { r: 5, color: 'ink', label: 'O', labelPos: 'sw' });
          const direct = tau(tq, xq), eu = Math.hypot(tm, xm) + Math.hypot(tq - tm, xq - xm), euD = Math.hypot(tq, xq);
          // right panel: scan x_M at the height of M
          const mk = [], eK = [];
          for (let i = 0; i <= 240; i++) {
            const xx = -3.6 + (7.2 * i) / 240, a = tau(tm, xx), b2 = tau(tq - tm, xq - xx);
            mk.push(a !== null && b2 !== null ? [xx, a + b2] : null); eK.push([xx, Math.hypot(tm, xx) + Math.hypot(tq - tm, xq - xx)]);
          }
          Bc.hline(direct, { color: 'green', dash: [5, 4], width: 1.4 }); Bc.hline(euD, { color: 'red', dash: [5, 4], width: 1.2, alpha: 0.7 });
          Bc.path(eK, { color: 'red', width: 2.2 }); Bc.path(mk, { color: 'accent', width: 2.8 });
          const yi = valid ? t1 + t2 : eu;
          Bc.dot(xm, valid ? t1 + t2 : eu, { r: 6, color: valid ? 'orange' : 'red' }); Bc.dot(xm, eu, { r: 4, color: 'red', hollow: true });
          st = { valid, t1, t2, direct, eu, euD, yi };
        });
        v.legend([['green', 'straight path $O\\to Q$'], ['orange', 'bent path $O\\to M\\to Q$'], ['accent', 'sum of proper times (right)'], ['red', 'sum of Euclidean lengths (right)']]);
        v.readout(() => {
          const { valid, t1, t2, direct, eu, euD } = st; if (direct === undefined) return '';
          return (valid ? String.raw`$\tau(O,M)+\tau(M,Q)=${v.fix(t1, 3)}+${v.fix(t2, 3)}=${v.fix(t1 + t2, 3)}\ \le\ \tau(O,Q)=${v.fix(direct, 3)}$. The bent path ages **${v.fix(direct - t1 - t2, 3)}** less.`
            : String.raw`$M$ is outside the diamond: one leg is not timelike, so the bent path is not the worldline of anything (the proper-time sum is undefined).`) + '\n' +
            String.raw`For comparison, in the Euclidean plane: $|OM|+|MQ|=${v.fix(eu, 3)}\ \ge\ |OQ|=${v.fix(euD, 3)}$, the opposite inequality.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Four-velocity',
      statement: String.raw`For a particle with worldline $x^\mu(\tau)$ parametrised by its proper time, the **four-velocity** is $u^\mu=dx^\mu/d\tau$. In the lab frame, with ordinary velocity $\mathbf v$ and $\gamma=(1-v^2/c^2)^{-1/2}$,
$$u^\mu=\gamma\,(c,\ \mathbf v),\qquad \eta(u,u)=c^2.$$
It is a four-vector (the quotient of the displacement four-vector $dx^\mu$ by the invariant $d\tau$), always future timelike with Minkowski length $c$: it is the unit tangent to the worldline.`,
      idea: String.raw`$d\tau=dt/\gamma$ (rel-1.9), so $dx^\mu/d\tau=\gamma\,dx^\mu/dt$ gives the components above. Its length is fixed because $d\tau^2=\eta(dx,dx)/c^2$ (rel-3.1) is exactly the statement $\eta(u,u)=c^2$. Geometrically, in a boost the tip of $u$ slides along the hyperboloid $\eta(u,u)=c^2$, which is the set of all possible velocities; the ordinary speed $v$ is only a coordinate on it, and is bounded by $c$ while $u$ itself is not.

On a smooth timelike segment, $d\tau/dt=1/\gamma$ is positive. The chain rule (pma 5.5) therefore converts each coordinate derivative from lab time to proper time: $dx^\mu/d\tau=(dx^\mu/dt)(dt/d\tau)$. This yields the displayed factor $\gamma$ component by component. Null curves have no such positive proper-time parameter, so this step concerns massive-particle timelike motion.`,
      caption: String.raw`The particle moves with $v(t)=V\sin\omega t$ (sliders for $V$ and $\omega$). **Slide the time** to move along the worldline (gold dots mark equal steps of proper time $\Delta\tau=0.5$, crowding together as the speed rises). The blue arrow is $u$; it keeps Minkowski length $1$ although it looks longer when the worldline tilts. Right: the unit hyperbola of all four-velocities, with the whole trip traced on it.`,
      deps: ['rel-3.1', 'rel-1.9', 'pma-5.5'],
      refs: ['Schutz §2.3', 'Carroll ch. 1'],
      tags: ['four-velocity', 'worldline', 'proper time'],
      viz(v) {
        const Vs = v.slider('top speed $V/c$', 0.1, 0.95, 0.8, { step: 0.01 });
        const Ws = v.slider('$\\omega$', 0.4, 1.4, 0.7, { step: 0.01 });
        const T = 7, Ts = v.slider('lab time $t$', 0, T, 2.4, { step: 0.01 });
        const A = v.stage({ x: [-1.2, 5.2], y: [-0.4, 7.4], equal: true, axes: true, height: 460, minWidth: 300, weight: 1, title: 'worldline in the lab frame' });
        const B = v.stage({ x: [-3.6, 3.6], y: [-0.4, 3.8], equal: true, axes: true, height: 460, minWidth: 280, weight: 1, title: 'four-velocities: $u^0{}^2-u^1{}^2=1$' });
        let st = {};
        v.render(() => {
          const o = osc(Vs.value, Ws.value), t = Ts.value;
          const tauT = o.tau(T, 700), tauAt = (tt) => { const f = (tt / T) * 700, i = Math.min(699, Math.floor(f)); return tauT[i] + (tauT[i + 1] - tauT[i]) * (f - i); };
          lightLines(A, 12);
          A.curve((s) => P(s, o.x(s)), 0, T, { color: 'ink', width: 2.2 });
          for (let k = 1, i = 0; k * 0.5 <= tauT[700]; k++) { while (i < 700 && tauT[i] < k * 0.5) i++; const tt = (i / 700) * T; A.dot(o.x(tt), tt, { r: 3, color: 'gold' }); }
          const px = o.x(t), u = o.u(t);
          A.line(px - 12, t - 12, px + 12, t + 12, { color: 'gold', dash: [4, 4], width: 1, alpha: 0.5 }); A.line(px - 12, t + 12, px + 12, t - 12, { color: 'gold', dash: [4, 4], width: 1, alpha: 0.5 });
          A.arrow(px, t, px + u[1], t + u[0], { color: 'accent', width: 3 }); A.dot(px, t, { r: 5, color: 'ink' });
          A.tex('u', px + u[1] / 2, t + u[0] / 2, { dx: 12, dy: -4, color: 'accent' });
          lightLines(B, 8);
          B.curve((s) => [Math.sinh(s), Math.cosh(s)], -2.2, 2.2, { color: 'green', width: 1.4, dash: [5, 4] });
          const tr_ = []; for (let i = 0; i <= 300; i++) { const tt = (i / 300) * T, uu = o.u(tt); tr_.push([uu[1], uu[0]]); }
          B.path(tr_, { color: 'faint', width: 3 });
          B.arrow(0, 0, u[1], u[0], { color: 'accent', width: 3 }); B.dot(u[1], u[0], { r: 5.5, color: 'accent' });
          st = { t, g: u[0], vv: o.vel(t), u, tau: tauAt(t), V: Vs.value };
        });
        v.legend([['ink', 'worldline'], ['gold', 'equal steps of proper time', { dot: true }], ['accent', '$u$'], ['green', '$\\eta(u,u)=1$', { dash: true }]]);
        v.readout(() => {
          const { t, g, vv, u, tau, V } = st; if (g === undefined) return '';
          return String.raw`At $t=${v.fix(t, 2)}$: $v/c=${v.fix(vv, 3)}$, $\gamma=${v.fix(g, 3)}$, proper time elapsed $\tau=${v.fix(tau, 3)}$ (a lab-time lead of ${v.fix(t - tau, 3)}).` + '\n' +
            String.raw`$u^\mu/c=(\gamma,\gamma v/c)=(${v.fix(u[0], 3)},\,${v.fix(u[1], 3)})$, and $\eta(u,u)/c^2=${v.fix(u[0] * u[0] - u[1] * u[1], 6)}$ at every point of the trip.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Four-acceleration and proper acceleration',
      statement: String.raw`The **four-acceleration** of a particle is $a^\mu=du^\mu/d\tau$. Differentiating $\eta(u,u)=c^2$ gives $\eta(a,u)=0$: $a$ is always Minkowski-orthogonal to $u$, hence spacelike (or zero). Its magnitude $\alpha=\sqrt{-\eta(a,a)}$ is the **proper acceleration**, the reading of an accelerometer carried by the particle. For motion along $x$ with lab acceleration $dv/dt$ one finds $\alpha=\gamma^3\,dv/dt$ (units $c=1$), and the four-acceleration is $a^\mu=\gamma^4\,(v\,\dot v,\ \dot v)$ in the components $(a^0,a^1)$.`,
      idea: String.raw`Differentiate the identity $\eta(u,u)=c^2$ along the worldline: $2\eta(u,a)=0$. By rel-3.2, the vectors orthogonal to a timelike $u$ are spacelike, so $a$ is spacelike. In the instantaneous rest frame $u=(c,\mathbf 0)$ and $a^\mu=(0,\mathbf a_{\rm rest})$, where $\mathbf a_{\rm rest}$ is the ordinary acceleration there, which is what an on-board spring balance measures. In the lab, $a^1=\gamma\,d(\gamma v)/dt=\gamma^4\dot v$ and $a^0=\gamma\,d\gamma/dt=\gamma^4v\dot v$, so $\sqrt{(a^1)^2-(a^0)^2}=\gamma^4\dot v\sqrt{1-v^2}=\gamma^3\dot v$.

In inertial coordinates the metric coefficients are constant. Apply the finite sum and product rules (pma 5.3) to the differentiable proper-time components in $(u^0)^2-\sum_{j=1}^3(u^j)^2=c^2$: their derivative is $2u^0a^0-2\sum_{j=1}^3u^ja^j=2\eta(u,a)=0$. This is a componentwise differentiation argument on any local proper-time interval of a smooth timelike worldline, distinct from converting lab-time derivatives by the chain rule (rel-3.4). A coordinate-dependent metric would contribute additional derivative terms; the displayed calculation uses a fixed inertial frame in flat spacetime.`,
      caption: String.raw`The same oscillating trip as in 3.4. Left: **slide the time**; the red arrow is $a$ (drawn at the scale shown in the readout when it is large), always the mirror image of $u$ in the light line, so $\eta(u,a)=0$. Right: the accelerometer reading $\alpha(t)$ (blue) against the lab acceleration $dv/dt$ (grey): at high speed the lab acceleration becomes tiny while the proper acceleration stays large by the factor $\gamma^3$.`,
      deps: ['rel-3.4', 'rel-3.2', 'pma-5.3'],
      refs: ['Schutz §2.3'],
      tags: ['four-acceleration', 'proper acceleration', 'accelerometer'],
      viz(v) {
        const Vs = v.slider('top speed $V/c$', 0.1, 0.95, 0.9, { step: 0.01 });
        const Ws = v.slider('$\\omega$', 0.4, 1.2, 0.8, { step: 0.01 });
        const T = 7, Ts = v.slider('lab time $t$', 0, T, 1.2, { step: 0.01 });
        const A = v.stage({ x: [-1.2, 5.6], y: [-0.8, 7.2], equal: true, axes: true, height: 440, minWidth: 300, weight: 1, title: 'worldline, $u$ and $a$' });
        const B = v.stage({ x: [0, T], y: [-2, 2], axes: 'box', gutter: true, height: 440, minWidth: 280, weight: 1, xlabel: 'lab time $t$', ylabel: 'acceleration', title: 'what the accelerometer reads' });
        let st = {};
        v.render(() => {
          const o = osc(Vs.value, Ws.value), t = Ts.value;
          lightLines(A, 12);
          A.curve((s) => P(s, o.x(s)), 0, T, { color: 'ink', width: 2.2 });
          const px = o.x(t), u = o.u(t), a4 = o.a4(t), al = Math.abs(o.alpha(t)), sc = al > 1.2 ? 1.2 / al : 1;
          A.arrow(px, t, px + u[1], t + u[0], { color: 'accent', width: 3 });
          A.arrow(px, t, px + a4[1] * sc, t + a4[0] * sc, { color: 'red', width: 3 });
          A.dot(px, t, { r: 5, color: 'ink' });
          A.tex('u', px + u[1] / 2, t + u[0] / 2, { dx: 12, dy: -4, color: 'accent' }); A.tex('a', px + (a4[1] * sc) / 2, t + (a4[0] * sc) / 2, { dx: 12, dy: 6, color: 'red' });
          let m = 0.5; for (let i = 0; i <= 200; i++) m = Math.max(m, Math.abs(o.alpha((i / 200) * T)));
          B.setView([0, T], [-1.15 * m, 1.15 * m]);
          B.hline(0, { color: 'faint' });
          B.fn((s) => o.acc(s), { color: 'muted', width: 2, domain: [0, T] }); B.fn((s) => o.alpha(s), { color: 'accent', width: 2.8, domain: [0, T] });
          B.vline(t, { color: 'gold', dash: [4, 4] }); B.dot(t, o.alpha(t), { r: 5.5, color: 'accent' }); B.dot(t, o.acc(t), { r: 4.5, color: 'muted' });
          st = { t, g: o.gam(t), acc: o.acc(t), alpha: o.alpha(t), ua: u[0] * a4[0] - u[1] * a4[1], aa: a4[0] * a4[0] - a4[1] * a4[1], sc };
        });
        v.legend([['ink', 'worldline'], ['accent', '$u$ (and $\\alpha$ at right)'], ['red', '$a$'], ['muted', 'lab acceleration $dv/dt$']]);
        v.readout(() => {
          const { t, g, acc, alpha, ua, aa, sc } = st; if (g === undefined) return '';
          return String.raw`At $t=${v.fix(t, 2)}$: $\gamma=${v.fix(g, 3)}$, $dv/dt=${v.fix(acc, 3)}$, $\alpha=\gamma^3\,dv/dt=${v.fix(alpha, 3)}$. Check $\eta(u,a)=${v.fix(ua, 6)}$ and $-\eta(a,a)=${v.fix(-aa, 4)}=\alpha^2=${v.fix(alpha * alpha, 4)}$.` + (sc < 1 ? String.raw` The arrow for $a$ is drawn at ${v.fix(sc, 2)} of its true length.` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Hyperbolic motion: constant proper acceleration',
      credit: 'Born, 1909 (who named it "hyperbolic motion")',
      statement: String.raw`A particle that starts from rest at the origin and keeps constant proper acceleration $\alpha$ along $x$ has
$$\begin{gathered}v=c\tanh\frac{\alpha\tau}{c},\qquad\\ ct=\frac{c^2}{\alpha}\sinh\frac{\alpha\tau}{c},\qquad\\ x=\frac{c^2}{\alpha}\Big(\cosh\frac{\alpha\tau}{c}-1\Big),\end{gathered}$$
so that $(x+c^2/\alpha)^2-(ct)^2=(c^2/\alpha)^2$: the worldline is a hyperbola. Its speed tends to $c$ but never reaches it; its rapidity is $\varphi=\alpha\tau/c$. For $\alpha\tau\ll c$ it reduces to Newton's $x=\tfrac12\alpha t^2$.`,
      idea: String.raw`Constant magnitude of $a$ (rel-3.5) with $a\perp u$ means $du/d\tau=\alpha\,\hat e$ where $\hat e$ is the unit spacelike vector orthogonal to $u$, with $\eta(\hat e,\hat e)=-1$, so $\sqrt{-\eta(du/d\tau,du/d\tau)}=\alpha$; rotating $u$ by a boost of rapidity rate $\alpha/c$ gives $u=c(\cosh\varphi,\sinh\varphi)$ with $\varphi=\alpha\tau/c$ (rel-2.3). Integrating $u=dx/d\tau$ yields the formulas. The hyperbola has asymptotes $x+c^2/\alpha=\pm ct$, and shipboard time grows only like the logarithm of the Earth-frame distance.

With the stated constant proper acceleration, the rapidity is linear in proper time. The smooth hyperbolic components of $u^\mu$ have the displayed coordinate functions as antiderivatives. The fundamental theorem (pma 6.21) evaluates their integrals on each finite proper-time interval; the initial position and rest condition fix the constants. This is exact integration of the ideal prescribed motion, not a fuel-consumption or variable-thrust model.`,
      caption: String.raw`**Set the acceleration** (in units of Earth's $g$) **and the ship time.** Left: the hyperbolic worldline, in light-years and years, with a dot per ship year, against Newton's parabola (red dashed); the gold line is the asymptote. Right: speed against ship time, $\tanh$ against Newton's unbounded line. The toggle flips the ship at the midpoint to arrive at rest. The readout works out three trips at the chosen acceleration: round figures, no engine-physics, just the formula.`,
      deps: ['rel-3.5', 'rel-2.3', 'pma-6.21'],
      refs: ['Taylor–Wheeler §2.9', 'Schutz ch. 2'],
      tags: ['hyperbolic motion', 'proper acceleration', 'rapidity'],
      scope: String.raw`Flat spacetime, one dimension, ideal constant-thrust engine (propellant mass, radiation and drag ignored). Distances: Proxima Centauri about 4.24 ly; Galactic Centre $8178\pm 13_{\rm stat}\pm22_{\rm sys}$ pc, i.e. about 26,670 ly (GRAVITY Collaboration 2019).`,
      viz(v) {
        const g0 = 9.80665, c = 299792458, yr = 365.25 * 86400, ly = c * yr;
        const cg = (c / g0) / yr;        // c/g in years (≈ 0.969)
        const gly = g0 * yr * yr / ly;   // g in ly/yr² (≈ 1.032)
        const gS = v.slider('acceleration $\\alpha/g$', 0.1, 3, 1, { step: 0.05 });
        const tS = v.slider('ship time $\\tau$ (years)', 0.2, 8, 3.2, { step: 0.05 });
        const flip = v.toggle('flip at the midpoint and arrive at rest', false);
        const A = v.stage({ x: [-3, 30], y: [-1, 30], equal: true, axes: true, height: 440, minWidth: 300, weight: 1.1, title: 'worldline: $x$ (light-years), $ct$ (years)' });
        const B = v.stage({ x: [0, 8], y: [0, 1.1], axes: 'box', gutter: true, height: 440, minWidth: 260, weight: 0.9, xlabel: 'ship time $\\tau$ (years)', ylabel: '$v/c$', title: 'speed' });
        let st = {};
        v.render(() => {
          const al = gS.value, ct = cg / al; // c/α in years
          const half = tS.value / 2, fl = flip.value;
          const pos = (s) => { // lab (x, t) at ship time s
            const f = (q) => [ct * (Math.cosh(q / ct) - 1) * 1, ct * Math.sinh(q / ct)]; // x in ly (c=1 → ly/yr)
            if (!fl || s <= half) return f(s);
            const e = f(half), m = f(tS.value - s); return [2 * e[0] - m[0], 2 * e[1] - m[1]];
          };
          const end = pos(tS.value), X = end[0], Tt = end[1], W = Math.max(X, Tt, 1);
          A.setView([-ct - 0.05 * W, W * 1.05], [-0.1 * W, W * 1.1]);
          A.line(-ct, 0, W * 1.1, W * 1.1 + ct, { color: 'gold', dash: [6, 4], width: 1.2, alpha: 0.6 });
          A.clip(() => { A.fn((x) => Math.sqrt((2 * Math.max(x, 0)) / (al * gly)), { color: 'red', dash: [5, 4], width: 1.4, domain: [0, 1.1 * W] }); });
          A.curve((s) => P(pos(s)[1], pos(s)[0]), 0, tS.value, { color: 'accent', width: 2.8, n: 160 });
          for (let k = 1; k <= tS.value; k++) { const p = pos(k); A.dot(p[0], p[1], { r: 3.4, color: 'orange' }); }
          const spd = (s) => (fl ? Math.tanh(Math.min(s, tS.value - s) / ct) : Math.tanh(s / ct));
          B.setView([0, tS.value], [0, 1.12]);
          B.hline(1, { color: 'gold', dash: [5, 4] });
          B.fn((s) => Math.min(s / ct, 1.12), { color: 'red', dash: [5, 4], width: 1.6, domain: [0, tS.value] });
          B.fn(spd, { color: 'accent', width: 2.8, domain: [0, tS.value] });
          const g1 = Math.cosh(Math.min(fl ? half : tS.value, 1e3) / ct);
          st = { al, ct, X, Tt, g1, v1: spd(tS.value), v: spd(fl ? half : tS.value) };
        });
        v.legend([['accent', 'relativistic'], ['red', 'Newtonian', { dash: true }], ['gold', 'light / asymptote', { dash: true }], ['orange', 'each ship year', { dot: true }]]);
        v.readout(() => {
          const { al, ct, X, Tt, g1 } = st; if (!ct) return '';
          const trip = (d) => { const ph = Math.acosh(1 + (d * gly * al) / 2); return [2 * ct * ph, 2 * ct * Math.sinh(ph), Math.cosh(ph)]; };
          const row = (nm, d) => { const [sh, ea, gm] = trip(d); return String.raw`${nm}: ship time ${v.fix(sh, 1)} yr, Earth-frame time ${v.fmt(ea, 3)} yr, peak $\gamma=${v.fmt(gm, 3)}$`; };
          return String.raw`$\alpha=${v.fix(al, 2)}\,g$ gives $c/\alpha=${v.fix(ct, 3)}$ yr. After $\tau$ the ship has gone ${v.fix(X, 2)} ly in ${v.fix(Tt, 2)} yr of Earth-frame time; $\gamma=${v.fix(g1, 2)}$ (Newton would predict a distance of ${v.fix(0.5 * al * gly * Tt * Tt, 1)} ly).` + '\n' +
            String.raw`Accelerate to the midpoint, flip, decelerate (formula $\tau=\tfrac{2c}{\alpha}\operatorname{arcosh}(1+\alpha d/2c^2)$):` + '\n' +
            row('Proxima Centauri, 4.24 ly', 4.24) + ';\n' + row('a star 100 ly away', 100) + ';\n' + row('Galactic Centre, 26,670 ly', 26670) + '.';
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Rindler horizon',
      credit: 'Rindler, 1966 (Am. J. Phys. 34, 1174); the horizon in the uniformly accelerated frame',
      statement: String.raw`An observer with constant proper acceleration $\alpha$ (rel-3.6) has the worldline $x^2-c^2t^2=(c^2/\alpha)^2$. Light signals sent in the $+x$ direction from events with $x-ct\le0$ never reach the observer: the null line $x=ct$ is an **event horizon** for the accelerating observer, a horizon in perfectly flat spacetime. In particular a lab clock at $x=0$ that ticks forever is seen by the observer to tick only up to its time $t=0$; the ticks it sends later are never received, and the lab times just before $0$ arrive at ever larger ship times (logarithmically).`,
      idea: String.raw`A signal from $(t_e,x_e)$ moves along $x=t+c$, with $c=x_e-t_e$ (units $c=1$, $\alpha=1$). It meets the hyperbola $x^2-t^2=1$ where $2ct+c^2=1$, i.e. at $t=(1-c^2)/(2c)$, which exists and is on the observer's future only for $c>0$. For $c\le0$ the signal runs parallel to the asymptote or below it and never intersects the hyperbola. The ship's proper time at reception, $\tau=\operatorname{arsinh}t$, diverges like $-\ln c$ as $c\to0^+$. The line $t=x$ is the boundary of the observer's causal past, which is the idea (rel-1.8) of the light cone applied to a whole worldline.`,
      caption: String.raw`The rocket (blue hyperbola, units $c/\alpha=1$) accelerates to the right; the lab at $x=0$ emits a tick every $\Delta t$ (slider), sending a light pulse to the right. **Drag the event $E$**: a pulse from it is drawn and, if it can arrive, the arrival marker shows the ship time. The shaded wedge $x<ct$ is the region whose events the rocket can never see. Right: ship time of reception against emission time, which diverges at the horizon.`,
      deps: ['rel-3.6', 'rel-1.8'],
      refs: ['Taylor–Wheeler §2.9'],
      tags: ['Rindler horizon', 'event horizon', 'accelerated observer'],
      scope: String.raw`Uniform acceleration forever (a rocket that cuts its engines has no horizon), flat spacetime; signals sent toward the rocket.`,
      viz(v) {
        const dS = v.slider('tick spacing $\\Delta t$ of the lab clock', 0.25, 1.5, 0.5, { step: 0.05 });
        const A = v.stage({ x: [-2, 4.5], y: [-3.2, 4], equal: true, axes: true, height: 440, minWidth: 320, weight: 1.1, title: 'lab diagram ($c/\\alpha=1$)' });
        const B = v.stage({ x: [-3, 0.2], y: [-2, 5], axes: 'box', gutter: true, height: 440, minWidth: 260, weight: 0.9, xlabel: 'emission time at the lab clock, $t_e$', ylabel: 'ship time of reception $\\tau$', title: 'when the signals are received' });
        const E = A.handle(-0.4, 0.9, { color: 'purple', label: 'E', labelPos: 'nw', constrain: { x: [-1.8, 3], y: [-2.8, 3.5] } });
        const hit = (te, xe) => { const c = xe - te; if (c <= 1e-9) return null; const th = (1 - c * c) / (2 * c); return { t: th, x: Math.sqrt(1 + th * th), tau: Math.asinh(th) }; };
        let st = {};
        v.render(() => {
          A.poly([[-9, -9], [9, 9], [-9, 9]], { fill: 'red', fillAlpha: 0.1, stroke: false });
          A.line(-2.5, -2.5, 5, 5, { color: 'red', width: 1.8, alpha: 0.8 }); A.line(-2.5, 2.5, 2.5, -2.5, { color: 'gold', width: 1, alpha: 0.4, dash: [4, 4] });
          A.curve((s) => [Math.cosh(s), Math.sinh(s)], -1.9, 1.9, { color: 'accent', width: 3 });
          A.line(0, -3.2, 0, 4, { color: 'ink', width: 1.4, alpha: 0.6 });
          A.text('horizon', 2.2, 2.2, { color: 'red', size: 12, align: 'left', dx: -62, dy: -12 }); A.text('never seen by the rocket', -2.4, 3.5, { color: 'red', size: 12, align: 'left' });
          const d = dS.value; let nr = 0; const pts = [];
          for (let k = -Math.floor(3 / d); k * d <= 3.5; k++) {
            const te = k * d, h = hit(te, 0);
            A.dot(0, te, { r: 3.2, color: 'ink' });
            if (h) { A.clip(() => A.segment([0, te], [h.x, h.t], { color: 'gold', width: 1.1, alpha: 0.8 })); A.dot(h.x, h.t, { r: 3.4, color: 'accent' }); pts.push([te, h.tau]); nr++; }
            else A.clip(() => A.segment([0, te], [6, 6 + te], { color: 'red', width: 1.1, alpha: 0.55, dash: [4, 4] }));
          }
          const he = hit(E.y, E.x);
          if (he) { A.segment([E.x, E.y], [he.x, he.t], { color: 'purple', width: 2 }); A.dot(he.x, he.t, { r: 6, color: 'purple' }); }
          else { const L = 5 - E.x; A.segment([E.x, E.y], [E.x + L, E.y + L], { color: 'purple', width: 2, dash: [5, 4] }); }
          // right panel
          const curve = []; for (let i = 0; i <= 200; i++) { const te = -3 + (2.99 * i) / 200, h = hit(te, 0); curve.push(h ? [te, h.tau] : null); }
          B.vline(0, { color: 'red', dash: [5, 4], width: 1.4 });
          B.path(curve, { color: 'accent', width: 2.8 });
          for (const [te, ta] of pts) B.dot(te, ta, { r: 4, color: 'gold' });
          if (he) B.dot(E.y, he.tau, { r: 6, color: 'purple' });
          st = { he, c: E.x - E.y, nr, d };
        });
        v.legend([['accent', 'rocket worldline'], ['gold', 'ticks received', { dot: true }], ['red', 'ticks never received', { dash: true }], ['purple', 'signal from $E$']]);
        v.readout(() => {
          const { he, c, nr, d } = st; if (c === undefined) return '';
          return (he ? String.raw`A signal from $E$ ($x-ct=${v.fix(c, 2)}>0$) reaches the rocket at lab time $${v.fix(he.t, 2)}$, ship time $\tau=${v.fix(he.tau, 2)}$.` : String.raw`$E$ has $x-ct=${v.fix(c, 2)}\le0$: it lies behind the horizon, and nothing it sends can ever reach the rocket.`) + '\n' +
            String.raw`The lab clock's ticks with $t_e<0$ are all received (${nr} of them are in the window); those with $t_e\ge0$ never are, however long the rocket waits. Tick spacing ${v.fix(d, 2)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Paradox',
      name: 'Bell’s spaceship paradox',
      credit: 'Dewan & Beran, 1959; popularised by J. S. Bell, 1976',
      statement: String.raw`Two identical rockets $A$ (behind) and $B$ (ahead) are at rest a distance $L$ apart in a frame $S$, joined by a taut thread of rest length $L$. At a given moment both ignite and follow the same acceleration programme as functions of $S$-time, so that in $S$ their separation is $L$ forever. After the engines stop at the same $S$-time, the rockets are at rest in a frame $S'$ moving with speed $v$ relative to $S$, and their separation there is $\gamma L>L$. The thread, which cannot stretch indefinitely, breaks. The resolution is that length contraction is not about *stress*: the thread is being stretched in its own rest frame.`,
      idea: String.raw`In $S$ the gap is constant, so the thread is not shortened by contraction as a free rod would be (rel-1.11): a moving *free* object of rest length $L$ would have length $L/\gamma$. The gap $L$ in $S$ is therefore the contracted version of a proper gap $\gamma L$ (contraction applied backwards). Algebraically: the two cut-off events are simultaneous in $S$ but, by the Lorentz transformation (rel-2.1), the front rocket stops $\gamma vL/c^2$ earlier in $S'$, and until the rear one stops too it is still moving away: $x'_B-x'_A=L/\gamma+\gamma v^2L/c^2=\gamma L$. The relativity of simultaneity (rel-1.6) is what makes the identical programmes not identical in $S'$.`,
      caption: String.raw`The rear rocket's engine accelerates at $g=1$ (units $c^2/g=1$); **set the rapidity at which both cut their engines**, the natural thread length $L$, and the breaking strain. Left: in $S$ the two worldlines are the same hyperbola shifted by $L$, with the thread (green) at constant length. Right: the same worldlines in the final rest frame $S'$ (hyperbolae turned into curves, then vertical): the gap measured after both have stopped is $\gamma L$, the red part being the stretch. Beyond the breaking strain the thread snaps.`,
      deps: ['rel-3.6', 'rel-1.11', 'rel-1.6'],
      refs: ['Schutz §1.11'],
      tags: ['Bell spaceship', 'length contraction', 'simultaneity'],
      scope: String.raw`Idealised point rockets with prescribed identical $S$-time programmes; a thread that is stretched only elastically and is dimensionless in cross-section. The paradox is about the thread, not the rockets: if each rocket instead maintains the same proper acceleration in its own frame, the separation stays $L$ in their rest frame (see 3.9).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bell%27s_spaceship_paradox' },
      viz(v) {
        const eS = v.slider('rapidity at engine cut-off', 0, 2, 1.1, { step: 0.01 });
        const LS = v.slider('thread length $L$', 0.3, 2, 1, { step: 0.05 });
        const kS = v.slider('breaking strain (stretch at which it snaps)', 1.2, 4, 1.8, { step: 0.05 });
        const A = v.stage({ x: [-0.6, 7.8], y: [-1.6, 5.8], equal: true, axes: true, height: 440, minWidth: 300, weight: 1, title: 'launch frame $S$' });
        const B = v.stage({ x: [-0.6, 9.4], y: [-4.6, 2.6], equal: true, axes: true, height: 440, minWidth: 300, weight: 1, title: 'final rest frame $S\'$ of the rockets' });
        let st = {};
        v.render(() => {
          const eta = eS.value, L = LS.value, b = Math.tanh(eta), g = Math.cosh(eta), tc = Math.sinh(eta), kb = kS.value;
          const broke = g > kb;
          const xw = (t, sh) => (t <= tc ? Math.sqrt(1 + t * t) : Math.sqrt(1 + tc * tc) + b * (t - tc)) + sh;
          const tEnd = tc + 1.6;
          lightLines(A, 12);
          for (const [sh, c] of [[0, 'accent'], [L, 'orange']]) A.curve((s) => P(s, xw(s, sh)), -1.2, tEnd, { color: c, width: 2.8, n: 120 });
          for (let k = -1; k * 0.5 <= tEnd; k++) { const t = k * 0.5; A.segment([xw(t, 0), t], [xw(t, L), t], { color: broke && t > tc ? 'red' : 'green', width: 1.3, alpha: broke && t > tc ? 0.5 : 0.9, dash: broke && t > tc ? [3, 3] : undefined }); }
          A.dot(xw(tc, 0), tc, { r: 4.5, color: 'ink' }); A.dot(xw(tc, L), tc, { r: 4.5, color: 'ink' }); A.line(-1, tc, 7.6, tc, { color: 'faint', dash: [3, 3] });
          A.text('A', 0.5, -1, { color: 'accent', math: true, dx: 8 }); A.text('B', L + 0.5, -1, { color: 'orange', math: true, dx: 8 });
          // S'
          const mp = (t, x) => P(...toMoving(b, t, x));
          lightLines(B, 12);
          for (const [sh, c] of [[0, 'accent'], [L, 'orange']]) {
            B.clip(() => {
              B.curve((s) => mp(s, xw(s, sh)), -1.2, tc, { color: c, width: 2.8, n: 120 });
              const e = toMoving(b, tc, xw(tc, sh)); B.line(e[1], e[0], e[1], 2.6, { color: c, width: 2.8 });
              B.dot(e[1], e[0], { r: 4.5, color: 'ink' });
            });
          }
          const x0 = 1, x1 = 1 + g * L, y = 1.4;
          B.line(x0, y, x0 + L, y, { color: 'green', width: 4 }); B.line(x0 + L, y, x1, y, { color: broke ? 'red' : 'orange', width: 4 });
          B.measure(x0, y + 0.5, x1, y + 0.5, `γL = ${v.fix(g * L, 2)}`);
          st = { eta, b, g, L, kb, broke };
        });
        v.legend([['accent', 'rocket A'], ['orange', 'rocket B'], ['green', 'thread, rest length $L$'], ['red', 'stretch / broken thread']]);
        v.readout(() => {
          const { eta, b, g, L, kb, broke } = st; if (!g) return '';
          return String.raw`Both stop at rapidity ${v.fix(eta, 2)} ($v/c=${v.fix(b, 3)}$, $\gamma=${v.fix(g, 3)}$). In $S$ the gap is still $L=${v.fix(L, 2)}$; in the rockets' frame it is $\gamma L=${v.fix(g * L, 3)}$, a stretch factor $\gamma=${v.fix(g, 2)}$.` + '\n' +
            (broke ? String.raw`The stretch exceeds the breaking strain ${v.fix(kb, 2)}: **the thread snapped** during the acceleration, at the moment its required length passed $${v.fix(kb * L, 2)}$.` : String.raw`The stretch is below the breaking strain ${v.fix(kb, 2)}: the thread survives, but it is under tension. Raise the cut-off rapidity until it breaks.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Born rigid motion',
      credit: 'Born, 1909',
      statement: String.raw`An extended body moves in a **Born-rigid** way if the proper distance between every pair of its neighbouring worldlines, measured in their common instantaneous rest frame, is constant. For a rod accelerated along its length this forces different proper accelerations: if the rear has proper acceleration $\alpha_r=c^2/\rho$, the front, a rest length $L$ ahead, must have $\alpha_f=c^2/(\rho+L)<\alpha_r$. The worldlines are then the nested hyperbolae $x^2-c^2t^2=\rho^2$ and $=(\rho+L)^2$, and all the lines of simultaneity pass through the common origin of the asymptotes. Equal accelerations (3.8) are **not** Born-rigid.`,
      idea: String.raw`The hyperbolae $x=\rho\cosh\varphi$, $ct=\rho\sinh\varphi$ for different $\rho$ share the same rapidity $\varphi$ on the ray $ct=x\tanh\varphi$ (rel-3.6, rel-2.3), and that ray is the line of simultaneity of the instantaneous rest frame (rel-1.6), so the proper separation of two such points is $\Delta\rho=L$, constant. Clocks at different $\rho$ advance by $\rho\,d\varphi$ while the rod's rapidity advances by $d\varphi$, so the front clock runs fast compared with the rear one, as in a uniform gravitational field. Equal accelerations (rel-3.8) break rigidity because the front point's simultaneous event is not on the same ray.`,
      caption: String.raw`**Choose Born-rigid or equal-acceleration** and move the rapidity slider. Left: the two worldlines of the ends, and the rod at the chosen instant (the green segment is the instantaneous rest frame's line of simultaneity); in the Born case every such segment points back toward the origin $O$, the crossing of the asymptotes. Right: the proper length against rapidity: constant $L$ for Born, growing without bound for equal acceleration (the stretch of 3.8).`,
      deps: ['rel-3.6', 'rel-3.8'],
      refs: ['Schutz §1.11'],
      tags: ['Born rigidity', 'rigid body', 'accelerated frame'],
      scope: String.raw`Flat spacetime, rod accelerated along its own length. Born rigidity is a restrictive condition (the Herglotz–Noether theorem limits which rigid motions exist); the body cannot be brought from rest to rotation while remaining Born-rigid.`,
      viz(v) {
        const mode = v.select('accelerations', [{ value: 'born', label: 'Born-rigid (different $\\alpha$)' }, { value: 'eq', label: 'equal $\\alpha$ (Bell)' }], 'born');
        const rS = v.slider('rear radius $\\rho=c^2/\\alpha_r$', 0.4, 2.5, 1, { step: 0.05 });
        const LS = v.slider('rest length $L$', 0.2, 2.5, 1.2, { step: 0.05 });
        const eS = v.slider('rapidity $\\varphi$', 0, 1.25, 0.8, { step: 0.01 });
        const A = v.stage({ x: [-1.2, 8.5], y: [-3.5, 6.5], equal: true, axes: true, height: 440, minWidth: 300, weight: 1.1, title: 'the two ends of the rod (axes $x$, $ct$)' });
        const B = v.stage({ x: [0, 1.25], y: [0, 3], axes: 'box', gutter: true, height: 440, minWidth: 260, weight: 0.9, xlabel: 'rapidity $\\varphi$', ylabel: 'proper length / $L$', title: 'rest-frame length' });
        let st = {};
        v.render(() => {
          const rho = rS.value, L = LS.value, eta = eS.value, born = mode.value === 'born';
          lightLines(A, 12);
          for (let k = -3; k <= 5; k++) { const ph = k * 0.25; A.line(0, 0, 9 * Math.cosh(ph) / Math.cosh(ph) , 9 * Math.tanh(ph), { color: 'faint', width: 0.8, alpha: 0.5 }); }
          const rear = (s) => [rho * Math.cosh(s), rho * Math.sinh(s)];
          const front = born ? (s) => [(rho + L) * Math.cosh(s), (rho + L) * Math.sinh(s)] : (s) => { const t = rho * Math.sinh(s); return [Math.sqrt(rho * rho + t * t) + L, t]; };
          A.curve((s) => rear(s), -1.0, 1.25, { color: 'accent', width: 2.8, n: 100 });
          A.curve((s) => front(s), -1.0, 1.25, { color: 'orange', width: 2.8, n: 100 });
          // the rod at the instant of rapidity eta: from the rear event along the line of simultaneity of the rear's rest frame
          const r0 = rear(eta); let f0, Lp;
          if (born) { f0 = front(eta); Lp = L; } else { const e = equalAccelGap(rho, L, eta); f0 = [e.xB, e.tB]; Lp = e.Lp; }
          A.segment(r0, f0, { color: 'green', width: 4 }); A.dot(r0[0], r0[1], { r: 5, color: 'ink' }); A.dot(f0[0], f0[1], { r: 5, color: 'ink' });
          A.dot(0, 0, { r: 4, color: 'muted', label: 'O', labelPos: 'sw' });
          // right panel
          const bornC = [], eqC = []; let m = 1.2;
          for (let i = 0; i <= 100; i++) { const ph = (1.25 * i) / 100; bornC.push([ph, 1]); const q = equalAccelGap(rho, L, ph).Lp / L; eqC.push([ph, q]); m = Math.max(m, q); }
          B.setView([0, 1.25], [0, Math.min(m * 1.08, 12)]);
          B.path(bornC, { color: 'accent', width: born ? 3 : 1.6, alpha: born ? 1 : 0.5 }); B.path(eqC, { color: 'orange', width: born ? 1.6 : 3, alpha: born ? 0.5 : 1 });
          B.vline(eta, { color: 'gold', dash: [4, 4] }); B.dot(eta, Lp / L, { r: 6, color: 'green' });
          st = { rho, L, eta, born, Lp, af: born ? 1 / (rho + L) : 1 / rho, ar: 1 / rho };
        });
        v.legend([['accent', 'rear end'], ['orange', 'front end'], ['green', 'the rod at that instant'], ['accent', 'Born-rigid (right)'], ['orange', 'equal acceleration (right)']]);
        v.readout(() => {
          const { rho, L, eta, born, Lp, af, ar } = st; if (!L) return '';
          return String.raw`Rear: $\alpha_r=1/\rho=${v.fix(ar, 3)}$ (units $c=1$); front: $\alpha_f=${v.fix(af, 3)}$${born ? String.raw`$=1/(\rho+L)$, smaller by the factor $\rho/(\rho+L)=${v.fix(rho / (rho + L), 3)}$` : String.raw`, equal to $\alpha_r$`}.` + '\n' +
            String.raw`At rapidity $\varphi=${v.fix(eta, 2)}$ the proper length of the rod is $${v.fix(Lp, 3)}$ (${born ? 'constant' : 'ratio ' + v.fix(Lp / L, 3)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Thomas precession',
      credit: 'L. H. Thomas, 1926–27 (Nature 117, 514; Phil. Mag. 3, 1)',
      statement: String.raw`A gyroscope carried along a curved path, with no torque on it (Fermi–Walker transport: its spin four-vector stays orthogonal to $u$ and is transported without rotation in the instantaneous rest frame), nevertheless appears to turn when its axis is compared with fixed lab directions through the sequence of rest frames. The angular velocity is
$$\boldsymbol\omega_T=\frac{\gamma^2}{\gamma+1}\,\frac{\mathbf a\times\mathbf v}{c^2},$$
retrograde to the orbit. For uniform circular motion with speed $v=\beta c$, after one lap the axis has turned by $-2\pi(\gamma-1)$, which for small $\beta$ is about $-\pi\beta^2$.`,
      idea: String.raw`Successive boosts in different directions do not compose to a boost but to a boost and a rotation (the Wigner–Thomas rotation of rel-2.14); a path whose velocity direction keeps changing accumulates such rotations at a rate proportional to $\mathbf a\times\mathbf v$. In the lab frame the Fermi–Walker equation is $\dot{S}^\mu=-(a\cdot S)\,u^\mu$ (rel-3.5): the spin keeps $\eta(S,u)=0$ only if its time component follows the motion. Integrating it for a circle and reading off the rest-frame spin gives a rotation of $-(\gamma-1)\omega$ per unit lab time. In atoms the same kinematics halves the spin–orbit coupling, which is how Thomas resolved the factor-of-two anomaly in the fine structure.`,
      caption: String.raw`A gyroscope orbits on a circle of radius $1$ at speed $\beta$; the slider counts laps (fractions allowed). The **blue arrow** is its spin in its own rest frame, found by integrating the Fermi–Walker transport equation numerically (the integrator's output is not the formula); the two grey arrows are the direction of motion and the fixed lab direction where a Newtonian gyroscope would still point. Right: turns per lap against $\beta$: the integrator (gold dot at your $\beta$) agrees with $\gamma-1$ and tends to the small-speed value $\beta^2/2$.`,
      deps: ['rel-2.14', 'rel-3.5'],
      refs: ['Taylor–Wheeler ch. L'],
      tags: ['Thomas precession', 'gyroscope', 'Fermi–Walker transport'],
      scope: String.raw`A torque-free gyroscope on a prescribed circular path in flat spacetime; gravitational (geodetic) precession is a separate effect that adds to it near a mass.`,
      viz(v) {
        const bS = v.slider('speed $\\beta=v/c$', 0.05, 0.95, 0.6, { step: 0.01 });
        const lS = v.slider('laps completed', 0, 6, 1.35, { step: 0.01 });
        const A = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, height: 420, minWidth: 300, weight: 1, title: 'lab frame: orbit and gyroscope axis' });
        const B = v.stage({ x: [0, 0.96], y: [0, 2.4], axes: 'box', gutter: true, height: 420, minWidth: 260, weight: 0.9, xlabel: '$\\beta$', ylabel: 'turns per lap', title: 'precession per lap' });
        let cache = { b: -1 };
        v.render(() => {
          const b = bS.value;
          if (cache.b !== b) cache = { b, tab: thomasTable(b, 360) };
          const tab = cache.tab, n = tab.length - 1, per = tab[n], g = 1 / Math.sqrt(1 - b * b);
          const laps = lS.value, nl = Math.floor(laps), fr = laps - nl, idx = fr * n, i0 = Math.min(n - 1, Math.floor(idx));
          const phi = nl * per + tab[i0] + (tab[i0 + 1] - tab[i0]) * (idx - i0);
          const th = 2 * Math.PI * laps, px = Math.cos(th), py = Math.sin(th);
          A.circle(0, 0, 1, { color: 'faint', width: 1.4 });
          A.arrow(px, py, px - 0.55 * Math.sin(th), py + 0.55 * Math.cos(th), { color: 'muted', width: 1.5 });
          A.arrow(px, py, px + 0.6, py, { color: 'muted', width: 1.6, alpha: 0.7 });
          A.arrow(px, py, px + 0.6 * Math.cos(phi), py + 0.6 * Math.sin(phi), { color: 'accent', width: 3.2 });
          A.dot(px, py, { r: 6, color: 'gold' });
          // right panel
          B.fn((x) => 1 / Math.sqrt(1 - x * x) - 1, { color: 'accent', width: 2.8, domain: [0, 0.95] });
          B.fn((x) => (x * x) / 2, { color: 'red', dash: [5, 4], width: 1.6, domain: [0, 0.95] });
          B.dot(b, Math.abs(per) / (2 * Math.PI), { r: 6, color: 'gold' });
          cache.out = { b, g, per, phi, laps, norm: tab.norm };
        });
        v.legend([['accent', 'rest-frame spin axis (integrated)'], ['muted', 'direction of motion / fixed reference'], ['accent', '$\\gamma-1$ (right)'], ['red', '$\\beta^2/2$ (right)', { dash: true }]]);
        v.readout(() => {
          const o = cache.out; if (!o) return '';
          return String.raw`$\beta=${v.fix(o.b, 2)}$, $\gamma=${v.fix(o.g, 3)}$. Numerical turn of the axis after one lap: $${v.fix((o.per * 180) / Math.PI, 2)}^\circ$; the formula $-360^\circ(\gamma-1)$ gives $${v.fix(-360 * (o.g - 1), 2)}^\circ$.` + '\n' +
            String.raw`After ${v.fix(o.laps, 2)} laps the axis has turned by $${v.fix((o.phi * 180) / Math.PI, 1)}^\circ$ (retrograde: against the orbit); its length stays $${v.fix(o.norm, 6)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Definition',
      name: 'One-forms and index notation',
      statement: String.raw`A **one-form** (covector) $\tilde\omega$ is a linear map from four-vectors to numbers, $V\mapsto\tilde\omega(V)=\omega_\mu V^\mu$. Its components transform with the *inverse* Lorentz matrix, $\omega'_\mu=\omega_\nu(\Lambda^{-1})^\nu{}_\mu$, so that the contraction $\omega_\mu V^\mu$ is invariant. Upper (contravariant) indices label vector components, lower (covariant) indices one-form components; the metric lowers and raises them: $V_\mu=\eta_{\mu\nu}V^\nu=(V^0,-V^1,-V^2,-V^3)$ and $\omega^\mu=\eta^{\mu\nu}\omega_\nu$. The gradient $\partial_\mu f$ of a scalar field is the model one-form.`,
      idea: String.raw`The set of one-forms is the dual space of the vector space (ladr-3.110), so a one-form is determined by its values on a basis, and pairing it with a vector is the natural invariant $\omega(V)$ with no metric needed. Lorentz invariance of $\omega_\mu V^\mu$ forces the inverse-transpose law for $\omega_\mu$. The metric $\eta$ (rel-3.1) is a particular isomorphism between the two spaces; "lowering an index" produces $\eta(V,\cdot)$, whose level lines are precisely the Minkowski-orthogonals to $V$ (rel-3.2).`,
      caption: String.raw`A one-form is shown as a **stack of level lines** $\omega_\mu x^\mu=k$ (here $k$ = integer, spaced by $1/|\omega|$); **drag the vector $V$ and the one-form handle $\Omega$** (whose position is $(\omega_1,\omega_0)$). The number of lines the arrow of $V$ pierces, counted by the highlighted ones, is $\omega(V)$. Switch to **lower the index** to use $V_\flat=\eta(V,\cdot)$: its level lines are parallel to the Minkowski-orthogonal of $V$, and $V_\flat(V)=\eta(V,V)$. Boosting changes both sets of components but not the count.`,
      deps: ['rel-3.1', 'ladr-3.110'],
      refs: ['Schutz §3.3', 'Carroll ch. 1'],
      tags: ['one-form', 'covector', 'index notation'],
      viz(v) {
        const bS = v.slider('boost $v/c$', -0.9, 0.9, 0.4, { step: 0.01 });
        const mode = v.select('one-form', [{ value: 'free', label: 'free one-form $\\Omega$' }, { value: 'low', label: 'lowered vector $V_\\flat$' }], 'free');
        const R = 4;
        const A = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: true, height: 440, minWidth: 320, weight: 1.2, title: 'level lines of a one-form and a vector (axes $x$, $ct$)' });
        const V = A.handle(1.0, 2.1, { color: 'accent', label: 'V', labelPos: 'ne', constrain: { x: [-3.6, 3.6], y: [-3.6, 3.6] } });
        const W = A.handle(-0.6, 0.9, { color: 'orange', label: 'Ω', labelPos: 'ne', constrain: { x: [-1.6, 1.6], y: [-1.6, 1.6] } });
        let st = {};
        v.render(() => {
          const b = bS.value, g = gam(b), low = mode.value === 'low';
          W.visible = !low;
          const w0 = low ? V.y : W.y, w1 = low ? -V.x : W.x, V0 = V.y, V1 = V.x;
          const nrm = Math.hypot(w0, w1);
          if (nrm > 0.06) {
            const dir = [-w0 / nrm, w1 / nrm], nn = [w1 / nrm, w0 / nrm]; // plot coordinates (x, t)
            const val = w0 * V0 + w1 * V1, kmax = Math.ceil(nrm * 6.2);
            for (let k = -kmax; k <= kmax; k++) {
              const c = [nn[0] * k / nrm, nn[1] * k / nrm];
              const inside = (val >= 0 ? k >= 0 && k <= val : k <= 0 && k >= val) && k !== 0;
              A.line(c[0] - 12 * dir[0], c[1] - 12 * dir[1], c[0] + 12 * dir[0], c[1] + 12 * dir[1], { color: low ? 'green' : 'orange', width: inside ? 2.4 : 1, alpha: inside ? 0.95 : 0.35 });
            }
          }
          lightLines(A, 8);
          A.arrow(0, 0, V1, V0, { color: 'accent', width: 3.2 });
          const [V0p, V1p] = toMoving(b, V0, V1);
          const w0p = g * (w0 + b * w1), w1p = g * (w1 + b * w0);
          st = { b, g, w0, w1, V0, V1, V0p, V1p, w0p, w1p, val: w0 * V0 + w1 * V1, nrm, low };
        });
        v.legend([['accent', 'vector $V$'], ['orange', 'level lines of $\\Omega$'], ['green', 'level lines of $V_\\flat$']]);
        v.readout(() => {
          const { b, w0, w1, V0, V1, V0p, V1p, w0p, w1p, val, low } = st; if (w0 === undefined) return '';
          return String.raw`$V^\mu=(${v.fix(V0, 2)},${v.fix(V1, 2)})\to V'^\mu=(${v.fix(V0p, 2)},${v.fix(V1p, 2)})$; ${low ? String.raw`$V_\mu=(${v.fix(w0, 2)},${v.fix(w1, 2)})$ (lowering flips the sign of the space component)` : String.raw`$\omega_\mu=(${v.fix(w0, 2)},${v.fix(w1, 2)})$`}$\to ${low ? "V'_\\mu" : "\\omega'_\\mu"}=(${v.fix(w0p, 2)},${v.fix(w1p, 2)})$ at $v/c=${v.fix(b, 2)}$.` + '\n' +
            String.raw`${low ? String.raw`$V_\mu V^\mu$` : String.raw`$\omega_\mu V^\mu$`}$=${v.fix(val, 4)}$ in $S$ and $${low ? "V'_\\mu" : "\\omega'_\\mu"}\,V'^\mu=${v.fix(w0p * V0p + w1p * V1p, 4)}$ in $S'$: the same number.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Definition',
      name: 'Tensors and their transformation law',
      statement: String.raw`A tensor of type $(p,q)$ is a multilinear map taking $p$ one-forms and $q$ vectors to a number (ladr-9.25). Its components in a basis carry $p$ upper and $q$ lower indices, and under a Lorentz transformation each upper index transforms with $\Lambda$ and each lower index with $\Lambda^{-1}$: for a rank-2 contravariant tensor, $T'^{\mu\nu}=\Lambda^\mu{}_\alpha\Lambda^\nu{}_\beta T^{\alpha\beta}$. Full contractions with $\eta$ (the trace $T^\mu{}_\mu=\eta_{\mu\nu}T^{\mu\nu}$, or $T_{\mu\nu}T^{\mu\nu}$) are scalars: the same in every frame, although the individual components mix.`,
      idea: String.raw`A tensor is a multilinear object, so its transformation law is the one forced by requiring that the numbers $T(\tilde\omega,\ldots,V,\ldots)$ do not depend on the basis; each index is a copy of the single-index rule for vectors or one-forms (rel-3.1, rel-3.11). A contraction pairs an upper with a lower index and so cancels a $\Lambda$ against a $\Lambda^{-1}$. The classic examples are the energy-momentum tensor of a fluid and the electromagnetic field tensor, whose components "mix electric and magnetic fields" under boosts.`,
      caption: String.raw`The heat map shows the sixteen components $T^{\mu\nu}$ (rows $\mu=0..3$, columns $\nu=0..3$; red positive, blue negative) of a chosen **example**, seen by an observer **boosted** by $(\beta_x,\beta_y)$. The components change a lot; the invariants in the readout do not. Right: the energy density $T'^{00}$ as a function of $\beta_x$ (not invariant) against the invariant trace (flat line); the gold dot is your current boost.`,
      deps: ['rel-3.11', 'ladr-9.25'],
      refs: ['Schutz §3.2', 'Carroll ch. 1'],
      tags: ['tensor', 'transformation law', 'invariants'],
      scope: String.raw`Rank-2 contravariant tensors with proper boosts; the electromagnetic example uses the convention $F^{0i}=-E^i$, $F^{ij}=-\epsilon^{ijk}B^k$ with signature $(+,-,-,-)$ and units $c=1$.`,
      viz(v) {
        const ex = v.select('example', [{ value: 'dust', label: 'dust $\\rho u^\\mu u^\\nu$' }, { value: 'rad', label: 'radiation $p=\\rho/3$' }, { value: 'em', label: 'electromagnetic field $F^{\\mu\\nu}$' }], 'dust');
        const bx = v.slider('observer boost $\\beta_x$', -0.9, 0.9, 0.5, { step: 0.01 });
        const by = v.slider('observer boost $\\beta_y$', -0.9, 0.9, 0.3, { step: 0.01 });
        const fl = v.slider('fluid speed along $x$ in its first frame', 0, 0.9, 0, { step: 0.01 });
        const A = v.stage({ x: [-0.2, 4.2], y: [-0.2, 4.2], equal: true, axes: false, height: 400, minWidth: 300, weight: 1, title: 'the components of the tensor (rows $\\mu$, columns $\\nu$)' });
        const B = v.stage({ x: [-0.9, 0.9], y: [-1, 5], axes: 'box', gutter: true, height: 400, minWidth: 260, weight: 0.9, xlabel: 'boost $\\beta_x$ ($\\beta_y=0$)', ylabel: 'component or invariant', title: 'what changes and what does not' });
        const base = (kind) => {
          if (kind === 'em') { const E = [0.8, 0.3, 0], Bf = [0, 0.2, 0.6]; return [[0, -E[0], -E[1], -E[2]], [E[0], 0, -Bf[2], Bf[1]], [E[1], Bf[2], 0, -Bf[0]], [E[2], -Bf[1], Bf[0], 0]]; }
          const w = fl.value, g = gam(w), u = [g, g * w, 0, 0], rho = 1, p = kind === 'rad' ? rho / 3 : 0;
          return u.map((a, i) => u.map((b2, j) => (rho + p) * a * b2 - p * ETA[i][j]));
        };
        const lower = (T) => T.map((r, i) => r.map((x, j) => x * ETA[i][i] * ETA[j][j]));
        const trace = (T) => T.reduce((s, r, i) => s + r[i] * ETA[i][i], 0);
        const sq = (T) => { let s = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s += T[i][j] * T[i][j] * ETA[i][i] * ETA[j][j]; return s; };
        const xf = (L, T) => mm(L, mm(T, tr(L)));
        let st = {};
        v.render(() => {
          const kind = ex.value; fl.el.hidden = kind === 'em';
          const T0 = base(kind), L = boost4(bx.value, by.value, 0), T = xf(L, T0);
          let m = 1e-6; for (const r of T) for (const x of r) m = Math.max(m, Math.abs(x));
          for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
            const x = T[i][j], c = v.diverge ? v.diverge(x / m) : [128, 128, 128];
            A.rect(j + 0.04, 3 - i + 0.04, j + 0.96, 3 - i + 0.96, { fill: c, fillAlpha: 1, color: 'faint', width: 1, radius: 4 });
            A.text(v.fix(Math.abs(x) < 5e-4 ? 0 : x, 2), j + 0.5, 3 - i + 0.5, { size: 13, align: 'center', baseline: 'middle', color: 'ink' });
          }
          for (let k = 0; k < 4; k++) { A.text(String(k), k + 0.5, 4.08, { color: 'muted', align: 'center', size: 11 }); A.text(String(k), -0.1, 3 - k + 0.5, { color: 'muted', align: 'right', baseline: 'middle', size: 11 }); }
          const tr0 = kind === 'em' ? 0 : trace(T0);
          B.hline(0, { color: 'faint' });
          const c00 = [], inv = [];
          for (let i = 0; i <= 90; i++) { const b = -0.9 + (1.8 * i) / 90; const Tt = xf(boost4(b, 0, 0), T0); c00.push([b, kind === 'em' ? Tt[0][1] ** 2 + Tt[0][2] ** 2 + Tt[0][3] ** 2 : Tt[0][0]]); inv.push([b, kind === 'em' ? 0.5 * sq(Tt) : trace(Tt)]); }
          let mx = 1; for (const [, y] of c00) mx = Math.max(mx, Math.abs(y)); B.setView([-0.9, 0.9], [-0.2 * mx, 1.1 * mx]);
          B.path(c00, { color: 'orange', width: 2.6 }); B.path(inv, { color: 'accent', width: 2.8, dash: [6, 4] });
          const cur = xf(boost4(bx.value, 0, 0), T0);
          B.dot(bx.value, kind === 'em' ? cur[0][1] ** 2 + cur[0][2] ** 2 + cur[0][3] ** 2 : cur[0][0], { r: 5.5, color: 'gold' });
          st = { kind, T0, T, tr0, trN: trace(T), sq0: sq(T0), sqN: sq(T), lorentzPres: sq(T) };
        });
        v.legend([['orange', 'a component that changes: $T^{00}$, or $E^2$ for the field (right)'], ['accent', 'the invariant: trace, or $B^2-E^2$ (right)', { dash: true }]]);
        v.readout(() => {
          const { kind, T, tr0, trN, sq0, sqN } = st; if (!T) return '';
          if (kind === 'em') {
            const E = [T[1][0], T[2][0], T[3][0]], Bf = [-T[2][3], -T[3][1], -T[1][2]];
            const e2 = E.reduce((s, x) => s + x * x, 0), b2 = Bf.reduce((s, x) => s + x * x, 0), eb = E[0] * Bf[0] + E[1] * Bf[1] + E[2] * Bf[2];
            return String.raw`Fields seen by this observer: $|\mathbf E|=${v.fix(Math.sqrt(e2), 3)}$, $|\mathbf B|=${v.fix(Math.sqrt(b2), 3)}$ (they mix under a boost). Invariants: $F_{\mu\nu}F^{\mu\nu}=2(B^2-E^2)=${v.fix(sqN, 4)}$ (unboosted $${v.fix(sq0, 4)}$), $\mathbf E\cdot\mathbf B=${v.fix(eb, 4)}$.`;
          }
          return String.raw`Energy density seen: $T^{00}=${v.fix(T[0][0], 3)}$; momentum density $T^{0i}=(${v.fix(T[0][1], 3)},${v.fix(T[0][2], 3)},${v.fix(T[0][3], 3)})$. Invariants: $\eta_{\mu\nu}T^{\mu\nu}=${v.fix(trN, 5)}$ (before the boost: $${v.fix(tr0, 5)}$), $T_{\mu\nu}T^{\mu\nu}=${v.fix(sqN, 5)}$ ($${v.fix(sq0, 5)}$).`;
        });
      },
    },
  ],
};
