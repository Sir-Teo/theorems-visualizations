// Numerical Linear Algebra — Chapter 2: QR factorization and least squares
// Part 1 (this file): 2.1–2.7 — projectors, QR, Gram–Schmidt (classical, modified, loss of orthogonality), Householder, Givens.
// The rest of the chapter (least squares: 2.8–2.15) is in ch02-b.js.
import {
  nm, nmc, matT, vecT, dot, add, sub, scl, len, unit, mv, mm, tp, eye, fro, msub, perp, TAU, sciT, drawTile, arcPts,
  cols, fromCols, cross, orthErr, gramSchmidt, householderQR, planeBasis, circ3, rightAngle3,
} from './ch02.shared.js';

const SUB = '₁₂₃₄₅';
const CC = ['blue', 'purple', 'teal'];

export default {
  collection: 'nla',
  chapter: 2,
  title: 'QR factorization and least squares',
  summary: String.raw`Orthogonal projectors split space into a subspace and its complement, and QR factorization builds an orthonormal basis for the column space of a matrix. Gram–Schmidt does this by subtracting projections — fragilely in its classical form — while Householder reflections and Givens rotations introduce zeros by orthogonal transformations. Least squares problems, the workhorse of data fitting, are solved by normal equations, QR or the SVD, with regularization when the data are noisy.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Projectors and orthogonal projectors',
      statement: String.raw`A square matrix $P$ is a **projector** if $P^2=P$. It splits space as $\mathbb R^m=\operatorname{range}P\oplus\operatorname{null}P$: every $x$ is $Px+(I-P)x$ with $Px\in\operatorname{range}P$ and $(I-P)x\in\operatorname{null}P$, and $I-P$ is the *complementary projector* onto $\operatorname{null}P$. A projector is **orthogonal** when $\operatorname{null}P\perp\operatorname{range}P$, which happens exactly when $P=P^{\top}$. Then $\|P\|_2=1$ (for $P\ne0$), while an oblique projector has $\|P\|_2>1$. If $Q$ has orthonormal columns, $P=QQ^{\top}$ is the orthogonal projector onto $\operatorname{range}Q$.`,
      idea: String.raw`$P^2=P$ forces $Px=x$ on the range, so the range is the set of fixed points and $x-Px$ is killed by $P$: that gives the direct sum. If the two pieces are perpendicular, $\|x\|^2=\|Px\|^2+\|(I-P)x\|^2\ge\|Px\|^2$, hence $\|P\|_2\le1$; if they are not, a vector in the null space can be nearly parallel to the range and its projection is much longer than the vector itself, with $\|P\|_2=1/\sin\theta$ for the angle $\theta$ between the two subspaces. Symmetry is the matrix expression of orthogonality of the two subspaces (the inner-product facts of the orthogonality definition in linear algebra, ladr-6.55).`,
      caption: String.raw`Projection of the plane onto the line through the origin (blue handle $r$) *along* a direction (orange handle $n$, the null space). Drag the point $x$: its shadow $Px$ is where the dashed line through $x$, parallel to $n$, meets the range. The unit circle (grey) is mapped onto the green segment: its half-length is $\|P\|_2$. Press **Make orthogonal** to turn $n$ perpendicular to $r$: $P$ becomes symmetric and the green segment shrinks to the unit one; tilt $n$ back towards $r$ and the norm blows up.`,
      deps: ['ladr-6.55', 'nla-1.1'],
      tags: ['projectors', 'orthogonality'],
      refs: ['Trefethen–Bau Lec. 6'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.4, 3.4], y: [-2.4, 2.4], equal: true, axes: true, height: 400 });
        const onCircle = (R) => (x, y) => { const L = Math.hypot(x, y) || 1; return [(R * x) / L, (R * y) / L]; };
        const rH = S.handle(1.9, 0.7, { color: 'accent', label: 'r', constrain: onCircle(2) });
        const nH = S.handle(-0.4, 1.4, { color: 'orange', label: 'n', constrain: onCircle(1.5) });
        const xH = S.handle(-1.1, 1.7, { color: 'gold', label: 'x' });
        v.button('Make orthogonal', () => { const r = unit([rH.x, rH.y]); const w = perp(r); nH.set(1.5 * w[0] * Math.sign(nH.x * w[0] + nH.y * w[1] || 1), 1.5 * w[1] * Math.sign(nH.x * w[0] + nH.y * w[1] || 1)); });
        const cloud = Array.from({ length: 14 }, (_, k) => [1.6 * Math.cos(TAU * k / 14 + 0.3) * (0.55 + 0.45 * ((k * 7) % 5) / 4), 1.6 * Math.sin(TAU * k / 14 + 0.3) * (0.55 + 0.45 * ((k * 3) % 4) / 3)]);
        let st = null;
        v.render(() => {
          const r = unit([rH.x, rH.y]), n = unit([nH.x, nH.y]), w = perp(n), den = dot(w, r);
          S.line(-3.4 * r[0], -3.4 * r[1], 3.4 * r[0], 3.4 * r[1], { color: 'accent', width: 2.2, alpha: 0.55 });
          S.line(-3.4 * n[0], -3.4 * n[1], 3.4 * n[0], 3.4 * n[1], { color: 'orange', width: 1.4, alpha: 0.35, dash: true });
          if (Math.abs(den) < 1e-3) { S.corner('n is parallel to r: no projector onto this line along n', 'tl', { color: 'red', weight: 700 }); st = null; return; }
          const P = [[r[0] * w[0] / den, r[0] * w[1] / den], [r[1] * w[0] / den, r[1] * w[1] / den]];
          const nP = 1 / Math.abs(den);
          S.circle(0, 0, 1, { color: 'muted', width: 1.2, alpha: 0.8 });
          // image of the unit circle: a segment of half-length ||P|| on the range
          S.line(-nP * r[0], -nP * r[1], nP * r[0], nP * r[1], { color: 'green', width: 5, alpha: 0.5 });
          cloud.forEach((c) => { const pc = mv(P, c); S.line(c[0], c[1], pc[0], pc[1], { color: 'faint', width: 1, alpha: 0.8 }); S.dot(c[0], c[1], { r: 2.5, color: 'muted' }); S.dot(pc[0], pc[1], { r: 2.5, color: 'green' }); });
          const x = [xH.x, xH.y], px = mv(P, x), qx = sub(x, px);
          S.arrow(px[0], px[1], x[0], x[1], { color: 'orange', width: 2.4 });
          S.arrow(0, 0, px[0], px[1], { color: 'green', width: 3 });
          S.dot(px[0], px[1], { r: 5.5, color: 'green', label: 'Px', labelPos: px[1] > 0 ? 'se' : 'nw' });
          S.tex('(I-P)x', add(px, scl(qx, 0.5))[0] + 0.1, add(px, scl(qx, 0.5))[1], { color: 'orange', size: 13, dx: 22, dy: 6 });
          const sv = M.svd(P).S[0], idem = fro(msub(mm(P, P), P)), asym = fro(msub(P, tp(P)));
          const ang = Math.acos(Math.min(1, Math.abs(den))) * 180 / Math.PI;
          S.corner(asym < 2e-3 ? 'orthogonal projector' : 'oblique projector', 'tl', { color: asym < 2e-3 ? 'green' : 'orange', weight: 700 });
          st = { P, sv, idem, asym, nP, ang };
        });
        v.legend([['accent', 'range $P$'], ['orange', 'null space direction $n$', { dash: true }], ['green', 'image of the unit circle']]);
        v.readout(() => st ? `$P=${matT(st.P, 3)}$, $\\;\\|P^2-P\\|_F=${sciT(st.idem)}$ (a projector), $\\;\\|P-P^{\\top}\\|_F=${sciT(st.asym)}$.\n$\\|P\\|_2=${nm(st.sv, 3)}$, which equals $1/\\sin\\theta=${nm(st.nP, 3)}$ for the angle $\\theta=${nm(st.ang, 1)}^\\circ$ between range and null space; it is $1$ only when they are perpendicular.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Existence and uniqueness of QR factorization',
      statement: String.raw`Every $A\in\mathbb R^{m\times n}$ with $m\ge n$ has a reduced factorization $A=\hat Q\hat R$ with $\hat Q\in\mathbb R^{m\times n}$ having orthonormal columns and $\hat R\in\mathbb R^{n\times n}$ upper triangular. If $A$ has full column rank, there is exactly one such factorization with $r_{jj}>0$ for all $j$ (any other has $r_{jj}$ of either sign, $\hat Q\hat R=(\hat QD)(D\hat R)$ with $D$ a diagonal matrix of signs), and then $\operatorname{span}(q_1,\dots,q_j)=\operatorname{span}(a_1,\dots,a_j)$ for every $j$. If the columns are dependent, a factorization still exists but $\hat Q$ is no longer determined.`,
      idea: String.raw`The triangular shape says $a_j=\sum_{i\le j}r_{ij}q_i$: each column is built from the previous $q$'s plus a new direction. Existence is the Gram–Schmidt construction: remove from $a_j$ its projection onto $\operatorname{span}(q_1,\dots,q_{j-1})$ (the orthogonal projector of 2.1); the remainder is nonzero exactly when $a_j$ is independent of the earlier columns, and normalising it gives $q_j$ with $r_{jj}=\|{\rm remainder}\|>0$. Uniqueness follows by induction: the direction of $q_j$ is forced to be that remainder, up to sign, so the only freedom is $D$.`,
      caption: String.raw`Drag $a_1,a_2$ in space. The teal and orange unit arrows are $q_1,q_2$, the green disc is the plane they span, and the tiles show $A=\hat Q\hat R$ with $\hat R$ triangular and $r_{jj}>0$. Switch on **flip the sign of $q_2$**: $\hat Q\hat R$ is still exactly $A$, but $r_{22}<0$ — that is the only non-uniqueness. Choose **$a_2$ parallel to $a_1$**: $r_{22}$ becomes $0$, the plane degenerates to a line and $q_2$ is no longer determined.`,
      deps: ['ladr-7.58', 'nla-2.1'],
      tags: ['qr', 'uniqueness'],
      refs: ['Trefethen–Bau Lec. 7'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.85, 1.85], equal: true, axes: false, height: 420, minWidth: 300, title: '$a_1,a_2\\to q_1,q_2$' });
        const T = v.stage({ x: [0, 8.8], y: [0, 4], equal: true, axes: false, height: 300, minWidth: 300, title: '$A=\\hat Q\\hat R$' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.32, axis: 1.6, lim: 1.5 });
        const H = [sc.handle([1.2, 0.2, 0.15], { color: 'blue', label: 'a₁', onDrag: () => keep() }), sc.handle([0.4, 1.1, 0.5], { color: 'purple', label: 'a₂', onDrag: () => keep() })];
        const mode = v.select('', [{ value: 'free', label: '$a_2$ free' }, { value: 'par', label: '$a_2$ parallel to $a_1$' }], 'free', {
          onChange: (k) => { H[1].visible = k === 'free'; tS.el.hidden = k === 'free'; keep(); },
        });
        const tS = v.slider('$a_2=t\\,a_1$, $t=$', -1.5, 1.5, 0.7, { step: 0.05 });
        tS.el.hidden = true;
        const flip = v.toggle('flip the sign of $q_2$ (and row 2 of $\\hat R$)', false);
        function keep() { if (mode.value === 'par') H[1].set(scl(H[0].p, tS.value)); }
        let st = null;
        v.render(() => {
          keep();
          const A = H.map((h) => h.p);
          const { Q, R } = gramSchmidt(A, 'classical', 1e-6);
          const Rm = R.map((r) => r.slice());
          const q = Q.map((c) => (c ? c.slice() : null));
          if (flip.value && q[1]) { q[1] = scl(q[1], -1); Rm[1] = Rm[1].map((x) => -x); }
          sc.begin();
          const pb = Q[1] ? [Q[0], Q[1]] : null;
          if (pb) sc.disc(pb[0], pb[1], 1.6, { fill: 'green', color: 'green', fillAlpha: 0.1, grid: true });
          else if (Q[0]) sc.line(scl(Q[0], -1.6), scl(Q[0], 1.6), { color: 'green', width: 5, alpha: 0.45 });
          A.forEach((a, k) => sc.arrow([0, 0, 0], a, { color: CC[k], width: 3.2 }));
          q.forEach((c, k) => { if (c) { sc.arrow([0, 0, 0], c, { color: ['teal', 'orange'][k], width: 2.4 }); sc.tex(`q_${k + 1}`, scl(c, 1.14), { color: ['teal', 'orange'][k], size: 15, dy: k ? 0 : 16 }); } });
          sc.flush();
          S.corner(Q[1] ? 'independent columns: Q, R determined (up to signs)' : 'dependent columns: r₂₂ = 0, q₂ undetermined', 'tl', { color: Q[1] ? 'muted' : 'red', weight: 700 });
          // tiles
          const Am = fromCols(A), Qm = fromCols(q.map((c) => c || [0, 0, 0])), Rt = [[Rm[0][0], Rm[0][1]], [Rm[1][0], Rm[1][1]]];
          drawTile(T, Am, 0.1, 0.5, 2, 3);
          T.text('=', 2.85, 2, { size: 26, align: 'center', baseline: 'middle', color: 'muted' });
          drawTile(T, Qm, 3.5, 0.5, 2, 3, { frame: 'teal' });
          drawTile(T, Rt, 6.3, 1.5, 2, 2, { frame: 'orange' });
          T.text('A', 1.1, 3.8, { size: 15, align: 'center', color: 'muted' });
          T.text('Q̂', 4.5, 3.8, { size: 15, align: 'center', color: 'teal' });
          T.text('R̂', 7.3, 3.8, { size: 15, align: 'center', color: 'orange' });
          const QR = mm(Qm, Rt);
          st = { err: fro(msub(QR, Am)), orth: q[1] ? orthErr(M, Qm) : q[0] ? 0 : 1, r11: Rm[0][0], r22: Rm[1][1], span: q[1] ? Math.abs(dot(q[1], unit(cross(A[0], A[1])))) : null };
        });
        v.legend([['blue', '$a_1$'], ['purple', '$a_2$'], ['teal', '$q_1$'], ['orange', '$q_2$'], ['green', 'span', { area: true }]]);
        v.readout(() => st ? `$\\|A-\\hat Q\\hat R\\|_F=${sciT(st.err)}$, $\\;\\|\\hat Q^{\\top}\\hat Q-I\\|=${sciT(st.orth)}$. Diagonal of $\\hat R$: $r_{11}=\\|a_1\\|=${nm(st.r11, 3)}$, $r_{22}=${nm(st.r22, 3)}$${st.r22 < -1e-9 ? ' (negative: not the normalised factorization)' : Math.abs(st.r22) < 1e-6 ? ': $a_2\\in\\operatorname{span}(a_1)$' : ''}.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Algorithm',
      name: 'Classical Gram–Schmidt',
      statement: String.raw`Given linearly independent $a_1,\dots,a_n\in\mathbb R^m$, classical Gram–Schmidt computes for $j=1,\dots,n$
$$v_j=a_j-\sum_{i<j}(q_i^{\top}a_j)\,q_i,\qquad r_{jj}=\|v_j\|_2,\qquad q_j=v_j/r_{jj},$$
with $r_{ij}=q_i^{\top}a_j$ for $i<j$. In exact arithmetic $q_1,\dots,q_n$ are orthonormal and $A=QR$ with $R$ upper triangular, $r_{jj}>0$: this is the QR factorization of 2.2. It costs about $2mn^2$ flops.`,
      idea: String.raw`At step $j$ the sum is the orthogonal projection of $a_j$ onto $\operatorname{span}(q_1,\dots,q_{j-1})$ (the projector $\sum q_iq_i^{\top}$ of 2.1), so $v_j$ is the part of $a_j$ perpendicular to everything already built; it is nonzero by independence. Every coefficient $r_{ij}$ is computed from the *original* column $a_j$ — which is what makes the method "classical", simple to state, and numerically fragile (2.5).`,
      caption: String.raw`Step through the algorithm (▶ or the scrubber). For each $a_j$ the dashed drops are its perpendicular projections onto the earlier axes $q_i$ (gold points are $r_{ij}q_i$); subtracting them leaves $v_j$ (red), which is normalised to $q_j$. Drag $a_1,a_2,a_3$ to change the problem; make $a_3$ nearly lie in the plane of $a_1,a_2$ and watch $v_3$, hence $r_{33}$, collapse.`,
      deps: ['nla-2.2', 'ladr-6.32'],
      credit: 'J. P. Gram, 1883; E. Schmidt, 1907',
      tags: ['gram-schmidt', 'orthogonalization'],
      refs: ['Trefethen–Bau Lec. 8'],
      viz(v) {
        const S = v.stage({ x: [-2.3, 2.3], y: [-1.85, 1.85], equal: true, axes: false, height: 390, full: true });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.3, axis: 1.6, lim: 1.6, hint: false });
        const A0 = [[1.3, 0.2, 0.1], [0.9, 1.1, 0.2], [0.7, 0.5, 1.1]];
        const H = A0.map((a, k) => sc.handle(a, { color: CC[k], label: `a${SUB[k]}`, onDrag: () => Sx.reset(undefined, { at: 'keep' }) }));
        const frames = () => gsFrames(H.map((h) => h.p), 'classical');
        const Sx = v.steps({
          frames,
          still: 5,
          codeTitle: 'classical Gram–Schmidt',
          code: ['for j = 1 … n', '  v ← a_j', '  for i = 1 … j−1', '    r_ij ← q_iᵀ a_j        ▷ from the original column', '    v ← v − r_ij q_i', '  r_jj ← ‖v‖,   q_j ← v / r_jj'],
        });
        v.render(() => { drawGS(sc, S, Sx.frame, H.map((h) => h.p)); });
        v.legend([['blue', '$a_1$'], ['purple', '$a_2$'], ['teal', '$a_3$'], ['gold', '$r_{ij}q_i$'], ['red', '$v_j$'], ['green', '$q_j$']]);
        v.readout(() => { const f = Sx.frame; return f.info || ''; });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Algorithm',
      name: 'Modified Gram–Schmidt',
      statement: String.raw`Modified Gram–Schmidt starts from $v_j=a_j$ and, for $i=1,\dots,j-1$ **in turn**, sets
$$r_{ij}=q_i^{\top}v_j,\qquad v_j\leftarrow v_j-r_{ij}q_i,$$
then $r_{jj}=\|v_j\|_2$ and $q_j=v_j/r_{jj}$. In exact arithmetic the output equals that of classical Gram–Schmidt (2.3), since $q_i^{\top}q_k=0$ for $k\neq i$ makes $q_i^{\top}v_j=q_i^{\top}a_j$. In floating point the two differ: each coefficient is taken against the partly orthogonalised vector, so errors committed earlier are partially corrected. The cost is the same, $\approx 2mn^2$ flops.`,
      idea: String.raw`Subtracting $r_{ij}q_i$ right after computing it means the next inner product $q_{i+1}^{\top}v_j$ sees a vector from which the $q_i$-component is already gone. If $q_{i+1}$ is not exactly orthogonal to $q_i$ (because of rounding), the classical coefficient $q_{i+1}^{\top}a_j$ still contains a spurious $q_i$-part and the subtraction leaves residue; the modified coefficient does not. The final subtraction always leaves $v_j$ exactly orthogonal to the *last* $q_i$ used.`,
      caption: String.raw`Both algorithms process $a_3$ against the same $q_1$ and a slightly wrong $q_2'$ (tilted towards $q_1$ by the angle $\delta$, the stand-in for a rounding error; $\delta=0$ is exact arithmetic). Step through: they agree on the first subtraction; in the second, classical takes its coefficient from $a_3$ (left), modified from the reduced vector (right). Raise $\delta$ and compare the final inner products $q_1^{\top}v$, $q_2'^{\top}v$ in the readout: modified is exactly orthogonal to $q_2'$, classical to neither.`,
      deps: ['nla-2.3'],
      credit: 'Björck, 1967 (analysis of the modified method)',
      tags: ['gram-schmidt', 'stability'],
      refs: ['Trefethen–Bau Lec. 8'],
      viz(v) {
        const mk = (title) => v.stage({ x: [-2.1, 2.1], y: [-1.75, 1.75], equal: true, axes: false, height: 380, minWidth: 300, title });
        const Sc = mk('classical: $r_{23}=q_2^{\\top}a_3$'), Sm = mk('modified: $r_{23}=q_2^{\\top}v$');
        const sc = v.scene3(Sc, { yaw: -0.5, pitch: 0.3, axis: 1.5, lim: 1.5, hint: false }), sm = v.scene3(Sm, { yaw: -0.5, pitch: 0.3, axis: 1.5, lim: 1.5, hint: false });
        const a3 = sc.handle([0.7, 0.55, 1.05], { color: 'teal', label: 'a₃', onDrag: () => a3m.set(a3.p) });
        const a3m = sm.handle([0.7, 0.55, 1.05], { color: 'teal', label: 'a₃', onDrag: () => a3.set(a3m.p) });
        const delta = v.slider('error angle $\\delta$ in $q_2$ (degrees)', 0, 25, 10, { step: 0.5 });
        let lastY = sc.yaw, lastP = sc.pitch, st = null;
        const Sx = v.steps({
          frames: () => [
            { k: 0, note: String.raw`The orthonormal $q_1=e_1$ and $q_2'$ (tilted by $\delta$ from $e_2$ towards $q_1$) are given; $a_3$ is to be orthogonalised against them.`, line: [1] },
            { k: 1, note: String.raw`First subtraction, the same for both: $r_{13}=q_1^{\top}a_3$, remove $r_{13}q_1$.`, line: [3, 4] },
            { k: 2, note: String.raw`Second subtraction. Classical measures $q_2'^{\top}a_3$ (left); modified measures $q_2'^{\top}v$ (right), with $v=a_3-r_{13}q_1$.`, line: [3, 4] },
            { k: 3, note: String.raw`Result: the two vectors $v$ differ, and so do their inner products with $q_1$ and $q_2'$.`, line: [5] },
          ],
          still: 3,
          code: ['v ← a_j', 'for i = 1 … j−1', '  r_ij ← q_iᵀ v      ▷ classical: q_iᵀ a_j', '  v ← v − r_ij q_i', 'r_jj ← ‖v‖,  q_j ← v / r_jj'],
        });
        v.render(() => {
          if (sc.yaw !== lastY || sc.pitch !== lastP) { sm.yaw = sc.yaw; sm.pitch = sc.pitch; } else if (sm.yaw !== lastY || sm.pitch !== lastP) { sc.yaw = sm.yaw; sc.pitch = sm.pitch; }
          lastY = sc.yaw; lastP = sc.pitch;
          const a = a3.p, d = (delta.value * Math.PI) / 180;
          const q1 = [1, 0, 0], q2 = [Math.sin(d), Math.cos(d), 0];
          const r13 = dot(q1, a), v1 = sub(a, scl(q1, r13));
          const rC = dot(q2, a), vC = sub(v1, scl(q2, rC));         // classical: both coefficients from a
          const rM = dot(q2, v1), vM = sub(v1, scl(q2, rM));       // modified: second from v1
          const k = Sx.frame.k;
          const draw = (sx, S, mod) => {
            sx.begin();
            sx.disc([1, 0, 0], [0, 1, 0], 1.45, { fill: 'green', color: 'green', fillAlpha: 0.06, grid: true });
            sx.arrow([0, 0, 0], q1, { color: 'teal', width: 2.2 }); sx.tex('q_1', scl(q1, 1.12), { color: 'teal', size: 14 });
            sx.arrow([0, 0, 0], q2, { color: 'orange', width: 2.2 }); sx.tex("q_2'", add(scl(q2, 1.12), [0, 0.05, 0]), { color: 'orange', size: 14 });
            sx.arrow([0, 0, 0], a, { color: 'faint', width: 1.4, alpha: 0.6 });
            if (k >= 1) { sx.line(a, scl(q1, r13), { color: 'gold', width: 1.2, dash: true }); sx.dot(scl(q1, r13), { color: 'gold', r: 4 }); sx.arrow(a, v1, { color: 'gold', width: 2.2 }); }
            if (k >= 2) {
              const src = mod ? v1 : a, rr = mod ? rM : rC;
              sx.line(src, scl(q2, rr), { color: 'gold', width: 1.2, dash: true }); sx.dot(scl(q2, rr), { color: 'gold', r: 4 });
              sx.arrow(v1, sub(v1, scl(q2, rr)), { color: 'gold', width: 2.2 });
            }
            if (k >= 3) sx.arrow([0, 0, 0], mod ? vM : vC, { color: 'red', width: 3.4 });
            sx.dot(a, { color: 'teal', r: 4 });
            sx.flush();
          };
          draw(sc, Sc, false); draw(sm, Sm, true);
          const nC = len(vC), nM = len(vM);
          st = { c1: dot(q1, vC) / nC, c2: dot(q2, vC) / nC, m1: dot(q1, vM) / nM, m2: dot(q2, vM) / nM, k };
        });
        v.legend([['teal', '$q_1$'], ['orange', "$q_2'$"], ['gold', 'subtracted parts'], ['red', 'result $v$']]);
        v.readout(() => st ? (st.k < 3 ? `Cosines of the angles between the current vectors and $q_1$, $q_2'$ are shown after the last step.` : `Cosine between the result and $q_1$, $q_2'$ (should be $0$ for both):\nclassical $${nm(st.c1, 4)}$, $${nm(st.c2, 4)}$; modified $${nm(st.m1, 4)}$, $${sciT(st.m2)}$ — the last subtraction makes modified exactly orthogonal to $q_2'$.`) : '');
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Phenomenon',
      name: 'Loss of orthogonality in Gram–Schmidt',
      statement: String.raw`In floating-point arithmetic with unit roundoff $\epsilon_{\rm mach}$, for a matrix $A$ of full column rank and condition number $\kappa=\kappa_2(A)$ the computed $Q$ of **classical** Gram–Schmidt can lose orthogonality as badly as $\|Q^{\top}Q-I\|_2\approx \epsilon_{\rm mach}\kappa^2$, **modified** Gram–Schmidt as $\epsilon_{\rm mach}\kappa$ (Björck), while **Householder** QR stays at $O(\epsilon_{\rm mach})$ whatever $\kappa$ is. Once $\kappa\gtrsim\epsilon_{\rm mach}^{-1/2}$ (resp. $\epsilon_{\rm mach}^{-1}$) the computed $Q$ is no longer orthonormal to any useful degree. The bounds are worst-case upper bounds; the measured loss is typically close to them.`,
      idea: String.raw`Orthogonalisation subtracts nearly equal quantities when $a_j$ is almost in the span of the earlier columns: $v_j$ is tiny relative to $a_j$ ($\|v_j\|\approx\sigma_{\min}$), so the rounding errors of the subtraction, of size $\epsilon\|a_j\|$, are amplified by $\|a_j\|/\|v_j\|\approx\kappa$ when normalising. Classical GS uses all earlier errors in $q_i^{\top}a_j$ uncorrected, giving one more factor of $\kappa$; modified GS (2.4) re-measures against the reduced vector. Householder QR (2.6) builds $Q$ as a product of reflectors, orthogonal to machine precision by construction.`,
      caption: String.raw`A $24\times10$ matrix $A=U\Sigma V^{\top}$ with random orthogonal $U,V$ and singular values spaced geometrically from $1$ down to $1/\kappa$. Each curve is $\|Q^{\top}Q-I\|_2$ of the $Q$ that the method really computed in double precision, on log–log axes, against the dashed reference lines $\epsilon\kappa$ and $\epsilon\kappa^2$. Slide $\kappa$ (the dots) and press **New matrix** to see it is not a one-off; classical saturates at order $1$ near $\kappa\approx10^{8}$.`,
      deps: ['nla-2.4'],
      tags: ['stability', 'orthogonality', 'floating-point'],
      refs: ['Trefethen–Bau Lec. 9'],
      scope: String.raw`Rounding-error behaviour in IEEE double precision ($\epsilon_{\rm mach}\approx1.1\times10^{-16}$); the constants depend on $m,n$ and on the matrix.`,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [1, 1e16], y: [1e-17, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'condition number κ(A)', ylabel: '‖QᵀQ − I‖₂', full: true });
        let seed = 5;
        const m = 24, n = 10, eps = 1.1e-16;
        const kap = v.slider('$\\kappa$', 1, 1e15, 1e7, { log: true, sig: 2 });
        v.button('New matrix', () => { seed++; cache = null; });
        const build = (k, r) => {
          const U = M.qr(Array.from({ length: m }, () => Array.from({ length: n }, () => r.normal())), { thin: true }).Q;
          const V = M.qr(Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()))).Q;
          return { U, V };
        };
        let cache = null, UV = null;
        const mat = (k) => { const sg = Array.from({ length: n }, (_, i) => k ** (-i / (n - 1))); return U_(UV.U, sg, UV.V); };
        const U_ = (U, sg, V) => U.map((ur) => V.map((_, c) => ur.reduce((s, x, j) => s + x * sg[j] * V[c][j], 0)));
        const run = (k) => {
          const A = mat(k), C = cols(A);
          const eC = orthErr(M, fromCols(gramSchmidt(C, 'classical', 0).Q)), eM = orthErr(M, fromCols(gramSchmidt(C, 'modified', 0).Q));
          const eH = orthErr(M, M.qr(A, { thin: true }).Q);
          return [eC, eM, eH];
        };
        v.render(() => {
          if (!cache) { UV = build(0, v.rng(seed)); const ks = Array.from({ length: 46 }, (_, i) => 10 ** (i / 3)); cache = { ks, vals: ks.map(run) }; }
          const fl = (x) => Math.max(1e-17, x);
          const names = ['red', 'orange', 'green'];
          S.path([[1, eps], [1e16, eps]], { color: 'faint', width: 1, dash: true });
          S.path(cache.ks.map((k) => [k, Math.min(10, eps * k)]), { color: 'purple', width: 1.4, dash: true, alpha: 0.8 });
          S.path(cache.ks.map((k) => [k, Math.min(10, eps * k * k)]), { color: 'red', width: 1.4, dash: true, alpha: 0.8 });
          names.forEach((c, i) => S.path(cache.ks.map((k, j) => [k, fl(cache.vals[j][i])]), { color: c, width: 2.6 }));
          const k = kap.value, e = run(k);
          S.vline(k, { color: 'gold', width: 1, alpha: 0.6 });
          e.forEach((x, i) => S.dot(k, fl(x), { color: names[i], r: 6 }));
          S.text('ε κ²', 2.5e4, 3e-2, { color: 'red', size: 13 }); S.text('ε κ', 1e3, 4e-13, { color: 'purple', size: 13 });
          cache.cur = e;
        });
        v.legend([['red', 'classical GS'], ['orange', 'modified GS'], ['green', 'Householder'], ['red', '$\\epsilon\\kappa^2$', { dash: true }], ['purple', '$\\epsilon\\kappa$', { dash: true }]]);
        v.readout(() => cache?.cur ? `At $\\kappa=${v.sci(kap.value, 2)}$: classical $${sciT(cache.cur[0])}$ (reference $\\epsilon\\kappa^2=${v.sci(Math.min(1e5, eps * kap.value ** 2), 1)}$), modified $${sciT(cache.cur[1])}$ ($\\epsilon\\kappa=${v.sci(eps * kap.value, 1)}$), Householder $${sciT(cache.cur[2])}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Algorithm',
      name: 'Householder triangularization',
      statement: String.raw`For a nonzero $x\in\mathbb R^k$ and $v=x+\operatorname{sgn}(x_1)\|x\|_2e_1$, the **Householder reflector** $H=I-2vv^{\top}/v^{\top}v$ is symmetric and orthogonal and maps $x$ to $-\operatorname{sgn}(x_1)\|x\|_2e_1$. Householder triangularization applies $H_1,\dots,H_n$ to $A\in\mathbb R^{m\times n}$, $H_k$ acting on rows $k{:}m$ and zeroing the entries below the diagonal of column $k$:
$$H_n\cdots H_1A=R,\qquad A=QR,\quad Q=H_1\cdots H_n.$$
It costs $2mn^2-\tfrac23n^3$ flops, and $Q$ is orthogonal to machine precision whatever the conditioning of $A$ (3.10). The sign in $v$ is chosen so that no cancellation occurs in $x_1\pm\|x\|$.`,
      idea: String.raw`$H$ is the mirror image in the hyperplane perpendicular to $v$; a reflection preserves lengths, so it can carry $x$ to any vector of the same length, in particular onto the axis $\pm\|x\|e_1$ — the two possible mirrors are $\perp(x-\|x\|e_1)$ and $\perp(x+\|x\|e_1)$. Taking the farther one ($v=x+\operatorname{sgn}(x_1)\|x\|e_1$) keeps $\|v\|\ge\|x\|$, whereas the nearer mirror has $\|v\|\to0$ when $x$ is almost on the axis and the subtraction $x_1-\|x\|$ cancels catastrophically. Products of orthogonal matrices (1.2) are orthogonal, so $Q$ is too.`,
      caption: String.raw`A $3\times2$ matrix; drag $a_1,a_2$. Step 1: the mirror (grey disc) is perpendicular to $v$ (red) and swings $a_1$ (blue) onto the $e_1$ axis, taking $a_2$ along; step 2 reflects the lower part of the reflected second column in a mirror containing $e_1$, so column 1 is untouched. The tiles show the matrix after each reflection. Switch **nearer mirror** to see the sign choice that cancels; **$a_1$ almost along $e_1$** puts $a_1$ near the axis where the readout shows the naive $x_1-\|x\|$ losing digits.`,
      deps: ['nla-2.2', 'nla-1.2'],
      credit: 'A. S. Householder, 1958',
      tags: ['householder', 'qr'],
      refs: ['Trefethen–Bau Lec. 10'],
      viz(v) {
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.8, 1.8], equal: true, axes: false, height: 400, minWidth: 320, title: 'the mirror and the column it reflects' });
        const Tt = v.stage({ x: [0, 11.2], y: [0, 4.6], equal: true, axes: false, height: 270, minWidth: 320, title: 'the matrix after each reflection' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.28, axis: 1.8, lim: 1.7, hint: false, labels: ['e₁', 'e₂', 'e₃'] });
        const H = [sc.handle([1.25, 0.55, 0.4], { color: 'blue', label: 'a₁', onDrag: () => Sx.reset(undefined, { at: 'keep' }) }), sc.handle([0.5, 0.9, -0.7], { color: 'purple', label: 'a₂', onDrag: () => Sx.reset(undefined, { at: 'keep' }) })];
        v.button('$a_1$ almost along $e_1$', () => { H[0].set([1.3, 4e-6, 3e-6]); Sx.reset(undefined, { at: 'keep' }); });
        const bad = v.toggle('nearer mirror (sign that cancels)', false, { onChange: () => Sx.reset(undefined, { at: 'keep' }) });
        const reflect = (x, w) => sub(x, scl(w, (2 * dot(w, x)) / dot(w, w)));
        const frames = () => {
          const a1 = H[0].p, a2 = H[1].p, s = bad.value ? -1 : 1;
          const sg = (t) => (t >= 0 ? 1 : -1);
          const n1 = len(a1), w1 = sub(a1, scl([1, 0, 0], -s * sg(a1[0]) * n1));          // x + s sgn(x1) ||x|| e1
          const b1 = reflect(a1, w1), b2 = reflect(a2, w1);
          const y = [b2[1], b2[2]], ny = len(y), w2v = [0, ...sub(y, scl([1, 0], -s * sg(y[0]) * ny))];
          const c2 = [b2[0], ...(len(w2v) ? [reflect([0, ...y], w2v)[1], reflect([0, ...y], w2v)[2]] : y)];
          const A0 = [[...a1], [...a2]], A1 = [b1, b2], A2 = [b1, c2];
          const mat = (cs) => fromCols(cs);
          const naive = a1[0] - n1, stable = -(a1[1] ** 2 + a1[2] ** 2) / (a1[0] + n1);
          const cancel = a1[0] > 0 ? Math.abs(naive - stable) / Math.abs(stable || 1) : null;
          return [
            { k: 0, A: mat(A0), note: String.raw`The matrix $A=(a_1\ a_2)$.`, line: [] },
            { k: 1, A: mat(A0), w: w1, from: a1, to: b1, other: a2, otherTo: b2, note: String.raw`Reflect $x=a_1$ across the mirror $\perp v$ onto the $e_1$ axis.`, line: [2, 3, 4], cancel },
            { k: 2, A: mat(A1), note: String.raw`$H_1A$: column 1 is $(\mp\|a_1\|,0,0)^{\top}$.`, line: [5] },
            { k: 3, A: mat(A1), w: w2v, from: [0, ...y].map((t, i) => (i === 0 ? b2[0] : t)), to: c2, base: [b2[0], 0, 0], note: String.raw`Second reflector acts on rows 2–3 only: its mirror contains $e_1$, so column 1 stays.`, line: [2, 3, 4] },
            { k: 4, A: mat(A2), note: String.raw`$H_2H_1A=R$ is upper triangular.`, line: [5] },
          ];
        };
        const Sx = v.steps({
          frames, still: 3,
          codeTitle: 'Householder QR',
          code: ['for k = 1 … n', '  x ← A[k:m, k]', '  v ← sign(x₁)‖x‖ e₁ + x', '  v ← v / ‖v‖', '  A[k:m, k:n] ← A[k:m, k:n] − 2 v (vᵀ A[k:m, k:n])'],
        });
        v.render(() => {
          const f = Sx.frame, a1 = H[0].p, a2 = H[1].p;
          sc.begin();
          sc.arrow([0, 0, 0], [1.1, 0, 0], { color: 'faint', width: 1.4, alpha: 0.7 });
          if (f.w && len(f.w) > 1e-9) {
            const wu = unit(f.w);
            const t1 = unit(cross(wu, Math.abs(wu[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])), t2 = cross(wu, t1);
            sc.disc(t1, t2, 1.5, { fill: 'muted', color: 'muted', fillAlpha: 0.12, grid: true });
            sc.arrow([0, 0, 0], scl(wu, 0.9), { color: 'red', width: 3 });
            sc.tex('v', scl(wu, 1.02), { color: 'red', size: 15 });
          }
          if (f.k === 0) { sc.arrow([0, 0, 0], a1, { color: 'blue', width: 3.2 }); sc.arrow([0, 0, 0], a2, { color: 'purple', width: 3.2 }); }
          if (f.k === 1) {
            sc.arrow([0, 0, 0], f.from, { color: 'blue', width: 3.2 }); sc.arrow([0, 0, 0], f.to, { color: 'blue', width: 3.2, alpha: 0.45 });
            sc.line(f.from, f.to, { color: 'faint', width: 1, dash: true });
            sc.arrow([0, 0, 0], f.other, { color: 'purple', width: 2.6 }); sc.arrow([0, 0, 0], f.otherTo, { color: 'purple', width: 2.6, alpha: 0.45 });
          }
          if (f.k === 2) { sc.arrow([0, 0, 0], f.A.map((r) => r[0]), { color: 'blue', width: 3.2 }); sc.arrow([0, 0, 0], f.A.map((r) => r[1]), { color: 'purple', width: 3.2 }); }
          if (f.k === 3) {
            sc.arrow([0, 0, 0], f.A.map((r) => r[0]), { color: 'blue', width: 3.2 });
            sc.arrow([0, 0, 0], f.from, { color: 'purple', width: 3.2 }); sc.arrow([0, 0, 0], f.to, { color: 'purple', width: 3.2, alpha: 0.45 });
            sc.line(f.from, f.to, { color: 'faint', width: 1, dash: true });
          }
          if (f.k === 4) { sc.arrow([0, 0, 0], f.A.map((r) => r[0]), { color: 'blue', width: 3.2 }); sc.arrow([0, 0, 0], f.A.map((r) => r[1]), { color: 'purple', width: 3.2 }); }
          sc.flush();
          // tiles: A, H1 A, H2 H1 A
          const fr = Sx.frames, ks = [0, 2, 4], titles = ['A', 'H₁A', 'H₂H₁A = R'];
          ks.forEach((k, t) => {
            const x0 = 0.15 + t * 3.75;
            if (f.k >= k) { drawTile(Tt, fr[k].A, x0, 0.4, 2.2, 3.3, { frame: f.k === k || (f.k === k + 1) ? 'accent' : 'muted' }); Tt.text(titles[t], x0 + 1.1, 4.1, { size: 14, align: 'center', color: 'muted' }); }
            if (t < 2 && f.k >= k + 2) Tt.arrow(x0 + 2.35, 2, x0 + 3.4, 2, { color: 'muted', width: 1.6 });
          });
        });
        v.legend([['blue', '$a_1$'], ['purple', '$a_2$'], ['red', 'normal $v$ of the mirror'], ['muted', 'mirror', { area: true }]]);
        v.readout(() => {
          const f = Sx.frame;
          const l1 = f.k >= 4 ? `$R=${matT(f.A.slice(0, 2).map((r) => r.slice()).map((r, i) => r), 3)}$ has zeros below its diagonal.` : '';
          const fr1 = Sx.frames[1];
          const c = fr1 && fr1.cancel != null ? `For the current $a_1$ the naive $x_1-\\|x\\|$ has relative error $${v.sci(Math.max(fr1.cancel, 1e-17), 1)}$ against the stable $-(x_2^2+x_3^2)/(x_1+\\|x\\|)$; the sign of 2.6 avoids it.` : `$x_1<0$: with this sign convention no cancellation either way.`;
          return `${l1 ? l1 + '\\n' : ''}${c}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Algorithm',
      name: 'Givens rotations',
      statement: String.raw`For a pair $(a,b)\in\mathbb R^2$ with $r=\sqrt{a^2+b^2}\neq0$ put $c=a/r$, $s=b/r$. The plane rotation $G=\begin{pmatrix}c&s\\-s&c\end{pmatrix}$ is orthogonal and $G\binom ab=\binom r0$. Embedded in rows $j$ and $i$ of the identity, it replaces those two rows of a matrix by combinations of them, changes nothing else, and makes the entry $(i,j)$ zero. Applying one rotation per subdiagonal entry, column by column, triangularises $A$: $G_N\cdots G_1A=R$. A dense $m\times n$ matrix needs about $n(m-\tfrac{n+1}2)$ rotations; a matrix with few nonzeros below the diagonal (Hessenberg, banded) needs only as many rotations as it has such entries.`,
      idea: String.raw`In the plane, rotating the vector $(a,b)$ through the angle $-\theta$, $\theta=\operatorname{atan2}(b,a)$, puts it on the first axis; rotations are orthogonal (1.2), so rows are mixed without changing lengths and $\|A\|_F$ is preserved. Zeroing in column order with the pivot row $j$ never recreates a zero already made, because the two rows involved are already zero in all earlier columns. Unlike a Householder reflector, a rotation touches just two rows, which is why it is the tool for structured or sparse matrices.`,
      caption: String.raw`Click an orange-outlined entry below the diagonal (the left-most unfinished column is active) to zero it by rotating its row against the pivot row. The right panel shows the pair $(a,b)$ being rotated onto the axis by the angle $\theta$. **Auto** finishes the sweep; **Undo**/**Reset** step back. Compare the count of rotations for the dense matrix with the Hessenberg one.`,
      deps: ['nla-1.2'],
      credit: 'W. Givens, 1958 (also Jacobi, 1846, in the eigenvalue context)',
      tags: ['givens', 'qr', 'sparse'],
      refs: ['Golub–Van Loan ch. 5'],
      viz(v) {
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 320, title: 'the matrix; click an entry below the diagonal' });
        const P = v.stage({ x: [-9, 9], y: [-6.5, 6.5], equal: true, axes: true, height: 330, minWidth: 320, title: 'the pair being rotated' });
        const base = {
          dense: [[3, 1, -2, 4], [4, -1, 2, 0], [-2, 5, 1, -3], [2, 0, -4, 1], [-1, 3, 2, 2]],
          hess: [[3, 1, -2, 4], [4, -1, 2, 0], [0, 5, 1, -3], [0, 0, -4, 1], [0, 0, 0, 2]],
        };
        const kind = v.select('', [{ value: 'dense', label: 'dense $5\\times4$' }, { value: 'hess', label: 'upper Hessenberg' }], 'dense', { onChange: () => { hist = []; } });
        let hist = [];
        const T = v.table(S, { rows: 5, cols: 4, square: false, cellAspect: 1.25, maxCell: 60, size: 15, format: (x) => (Math.abs(x) < 1e-9 ? '0' : nmc(x, 2)), rowLabels: (i) => `$${i + 1}$`, colLabels: (j) => `$${j + 1}$` });
        const apply = (A, h) => {
          const B = A.map((r) => r.slice()), { i, j, c, s } = h;
          for (let k = 0; k < B[0].length; k++) { const p = B[j][k], q = B[i][k]; B[j][k] = c * p + s * q; B[i][k] = -s * p + c * q; }
          return B;
        };
        const current = () => { let A = base[kind.value].map((r) => r.slice()); hist.forEach((h) => { A = apply(A, h); }); return A; };
        const active = (A) => { for (let j = 0; j < 4; j++) { for (let i = j + 1; i < 5; i++) if (Math.abs(A[i][j]) > 1e-9) return j; } return -1; };
        const rot = (A, i, j) => { const a = A[j][j], b = A[i][j], r = Math.hypot(a, b); return { i, j, c: a / r, s: b / r, a, b, r }; };
        hist = [rot(base.dense, 4, 0)];
        S.onClick((x, y) => {
          const c = T.hit(x, y), A = current();
          if (c && c.i > c.j && c.j === active(A) && Math.abs(A[c.i][c.j]) > 1e-9) { hist.push(rot(A, c.i, c.j)); v.invalidate(); }
        });
        v.button('Auto', () => { let A = current(); for (let g = 0; g < 40; g++) { const j = active(A); if (j < 0) break; let i = 4; while (Math.abs(A[i][j]) < 1e-9) i--; const h = rot(A, i, j); hist.push(h); A = apply(A, h); } });
        v.button('Undo', () => { hist.pop(); });
        v.button('Reset', () => { hist = []; });
        let st = null;
        v.render(() => {
          const A0 = base[kind.value], A = current(), act = active(A), last = hist[hist.length - 1];
          const click = [];
          if (act >= 0) for (let i = act + 1; i < 5; i++) if (Math.abs(A[i][act]) > 1e-9) click.push([i, act, 'orange']);
          T.draw({
            value: (i, j) => A[i][j],
            fill: (i, j) => (i > j && Math.abs(A[i][j]) < 1e-9 ? ['green', 0.3] : last && (i === last.i || i === last.j) ? ['gold', 0.2] : null),
            highlight: click,
          });
          // the pair
          if (last) {
            const R = Math.max(2, last.r * 1.15);
            P.setView([-1.4 * R, 1.4 * R], [-R * 1.05, R * 1.05]);
            P.circle(0, 0, last.r, { color: 'faint', width: 1.2, dash: true });
            P.arrow(0, 0, last.a, last.b, { color: 'orange', width: 3 }); P.dot(last.a, last.b, { r: 4, color: 'orange' });
            P.arrow(0, 0, last.r, 0, { color: 'green', width: 3 }); P.dot(last.r, 0, { r: 4, color: 'green' });
            const th = Math.atan2(last.b, last.a);
            P.path(Array.from({ length: 24 }, (_, k) => [0.45 * last.r * Math.cos((th * k) / 23), 0.45 * last.r * Math.sin((th * k) / 23)]), { color: 'gold', width: 2 });
            P.tex(`\\theta=${nm((th * 180) / Math.PI, 1)}^\\circ`, 0.5 * last.r, 0.12 * last.r, { color: 'gold', size: 14, dy: -12 });
            P.tex(`(a,b)=(${nm(last.a, 2)},${nm(last.b, 2)})`, last.a, last.b, { color: 'orange', size: 13, dy: last.b > 0 ? -14 : 14 });
            P.tex(`r=${nm(last.r, 2)}`, last.r, 0, { color: 'green', size: 13, dy: 16, dx: -4 });
          } else { P.setView([-9, 9], [-6.5, 6.5]); P.text('click an entry below the diagonal', 0, 3, { align: 'center', color: 'muted', size: 14, plate: true }); }
          let nz = 0; for (let j = 0; j < 4; j++) for (let i = j + 1; i < 5; i++) if (Math.abs(base[kind.value][i][j]) > 1e-9) nz++;
          const done = A.every((r, i) => r.every((x, j) => i <= j || Math.abs(x) < 1e-9));
          st = { n: hist.length, nz, done, fro: fro(A), fro0: fro(A0) };
        });
        v.readout(() => st ? `Rotations applied: **${st.n}** of the **${st.nz}** needed (one per nonzero subdiagonal entry of this matrix)${st.done ? ' — upper triangular reached.' : '.'} $\\|A\\|_F=${nm(st.fro, 4)}$ stays equal to its start value $${nm(st.fro0, 4)}$ (rotations are orthogonal).` : '');
      },
    },
  ],
};

// ============================ Gram–Schmidt step frames and drawing (shared by 2.3 and 2.4's helpers) ============================
function gsFrames(A, mode) {
  const n = A.length, q = [], frames = [{ j: -1, q: [], A, info: String.raw`Three vectors $a_1,a_2,a_3\in\mathbb R^3$ to orthonormalise.`, note: String.raw`Three vectors $a_1,a_2,a_3$. We want orthonormal $q_1,q_2,q_3$ with $\operatorname{span}(q_1..q_j)=\operatorname{span}(a_1..a_j)$.`, line: [] }];
  const R = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    let vv = A[j].slice();
    const parts = [];
    for (let i = 0; i < j; i++) {
      if (!q[i]) continue;
      const r = dot(q[i], mode === 'classical' ? A[j] : vv);
      R[i][j] = r; parts.push({ i, r, foot: scl(q[i], r) }); vv = sub(vv, scl(q[i], r));
    }
    const nv = len(vv);
    if (j > 0) {
      frames.push({ j, stage: 'proj', q: q.map((x) => x && x.slice()), A, parts: parts.slice(), v: null, note: `Project $a_${j + 1}$ onto each earlier $q_i$: $r_{i${j + 1}}=q_i^{\\top}a_${j + 1}$.`, line: [3, 4], info: parts.map((p) => `$r_{${p.i + 1}${j + 1}}=${nm(p.r, 3)}$`).join(', ') });
      frames.push({ j, stage: 'sub', q: q.map((x) => x && x.slice()), A, parts: parts.slice(), v: vv.slice(), note: `Subtract: $v_${j + 1}=a_${j + 1}-\\sum_i r_{i${j + 1}}q_i$, perpendicular to $q_1..q_${j}$.`, line: [5], info: `$\\|v_${j + 1}\\|=${nm(nv, 4)}$` });
    }
    q.push(nv > 1e-9 ? scl(vv, 1 / nv) : null);
    R[j][j] = nv;
    frames.push({ j, stage: 'norm', q: q.map((x) => x && x.slice()), A, parts: j > 0 ? parts.slice() : [], v: vv.slice(), note: `Normalise: $r_{${j + 1}${j + 1}}=\\|v_${j + 1}\\|=${nm(nv, 3)}$, $q_${j + 1}=v_${j + 1}/r_{${j + 1}${j + 1}}$.`, line: [6], info: `$r_{${j + 1}${j + 1}}=${nm(nv, 4)}$` });
  }
  const orth = (() => { let e = 0; for (let i = 0; i < n; i++) for (let k = i + 1; k < n; k++) if (q[i] && q[k]) e = Math.max(e, Math.abs(dot(q[i], q[k]))); return e; })();
  frames.push({ j: n, stage: 'done', q: q.map((x) => x && x.slice()), A, parts: [], v: null, note: `Done: $A=QR$ with $R$ upper triangular.`, line: [], info: `$R=${matT(R, 3)}$, $\\max|q_i^{\\top}q_k|=${sciT(orth)}$ for $i\\neq k$.` });
  return frames;
}
function drawGS(sc, S, f, A) {
  sc.begin();
  const j = f.j, qs = f.q || [];
  qs.forEach((q, i) => {
    if (!q) return;
    sc.line(scl(q, -1.5), scl(q, 1.5), { color: 'faint', width: 1, alpha: 0.7 });
    sc.arrow([0, 0, 0], q, { color: 'green', width: 3 }); sc.tex(`q_${i + 1}`, scl(q, 1.13), { color: 'green', size: 15 });
  });
  if (j >= 0 && j < A.length) {
    const a = A[j];
    sc.arrow([0, 0, 0], a, { color: CC[j], width: f.stage === 'norm' && j > 0 ? 1.6 : 3.6, alpha: f.stage === 'norm' ? 0.55 : 1 });
    if (f.stage === 'proj' || f.stage === 'sub') {
      let cur = a;
      (f.parts || []).forEach((p) => { sc.line(a, p.foot, { color: 'gold', width: 1.1, dash: true }); sc.dot(p.foot, { color: 'gold', r: 4 }); });
      if (f.stage === 'sub') (f.parts || []).forEach((p) => { const nx = sub(cur, p.foot); sc.arrow(cur, nx, { color: 'gold', width: 2.2 }); cur = nx; });
    }
    if (f.v && (f.stage === 'sub' || f.stage === 'norm')) { sc.arrow([0, 0, 0], f.v, { color: 'red', width: f.stage === 'sub' ? 3.6 : 2.2, alpha: f.stage === 'sub' ? 1 : 0.55 }); sc.tex(`v_${j + 1}`, scl(f.v, 1.1), { color: 'red', size: 14 }); }
  }
  A.forEach((a, k) => { if (k !== j) sc.arrow([0, 0, 0], a, { color: CC[k], width: 1.4, alpha: 0.28 }); });
  sc.flush();
}
