// Rudin, Functional Analysis — Chapter 12 (part 4): positive operators, polar decomposition, the invertible group,
// representations of B*-algebras, the mean ergodic theorem
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const sub = (A, B) => A.map((r, i) => r.map((a, j) => a - B[i][j]));
const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
const mv = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
/** Symmetric 2×2 eigen-decomposition: returns [[l1, l2], [v1, v2]] with orthonormal columns. */
function eigS(A) {
  const a = A[0][0], b = A[0][1], d = A[1][1], m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const l1 = m + r, l2 = m - r, th = 0.5 * Math.atan2(2 * b, a - d);
  return [[l1, l2], [[Math.cos(th), Math.sin(th)], [-Math.sin(th), Math.cos(th)]]];
}
const fnSym = (A, f) => { const [[l1, l2], [v1, v2]] = eigS(A); return [[f(l1) * v1[0] * v1[0] + f(l2) * v2[0] * v2[0], f(l1) * v1[0] * v1[1] + f(l2) * v2[0] * v2[1]], [f(l1) * v1[1] * v1[0] + f(l2) * v2[1] * v2[0], f(l1) * v1[1] * v1[1] + f(l2) * v2[1] * v2[1]]]; };
const ellipse = (A, n = 180) => Array.from({ length: n + 1 }, (_, k) => mv(A, [Math.cos(2 * Math.PI * k / n), Math.sin(2 * Math.PI * k / n)]));
// complex helpers
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };

export default {
  book: 'fa',
  chapter: 12,
  items: [
    {
      num: '12.32',
      kind: 'Theorem',
      name: 'Positive operators have unique positive square roots',
      statement: String.raw`For $T\in B(H)$ the following are equivalent: (a) $(Tx,x)\ge0$ for every $x$; (b) $T$ is self-adjoint with $\sigma(T)\subset[0,\infty)$; (c) $T=S^*S$ for some $S\in B(H)$. Such $T$ are **positive**, $T\ge0$. Every positive $T$ has exactly one positive square root $R$ ($R\ge0$, $R^2=T$), written $T^{1/2}$; it commutes with every operator that commutes with $T$, and is invertible iff $T$ is.`,
      idea: String.raw`(a)⇒(b): $(Tx,x)$ real gives self-adjointness (12.7), and $m\ge0$ in 12.13. (b)⇒(c): $S=\int\sqrt\lambda\,dE$ via the spectral theorem. (c)⇒(a): $(S^*Sx,x)=\norm{Sx}^2$. Uniqueness of the root: if $Q\ge0$ and $Q^2=T$, then $Q$ commutes with $T$, hence with $E$ and with $R=\int\sqrt\lambda\,dE$, and $(R-Q)R(R-Q)+(R-Q)Q(R-Q)=(R^2-Q^2)(R-Q)=0$ forces $R=Q$.`,
      caption: String.raw`A symmetric $2\times2$ matrix $T$, drawn as the image of the unit circle (an ellipse whose axes are the eigenvectors). Drag the two handles to set $T$'s eigen-axes and eigenvalues; a negative eigenvalue flips one axis (red) and makes $T$ non-positive. For $T\ge0$, the square root $R=T^{1/2}$ (green ellipse) has the same axes and square-rooted lengths, and $R^2=T$. Also shown: another square root $Q$ of $T$ that is **not** positive (a reflection composed with $R$). It maps the circle onto the same ellipse, but moves individual vectors differently — compare $Rx$ and $Qx$ — and $(Qx,x)<0$ for some $x$. Positive roots are unique; square roots in general are not.`,
      deps: ['fa-12.24', 'fa-12.13', 'fa-12.7'],
      tags: ['positive operators', 'square roots'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.6, 2.6], y: [-2, 2], equal: true, height: 400, axes: true, title: 'unit circle under $T$ (blue), $R=T^{1/2}$ (green) and another root $Q$ (dashed)' });
        const h1 = S.handle(1.8, 0.7, { color: 'blue', label: 'λ₁u₁' });
        const h2 = S.handle(-0.3, 0.75, { color: 'blue', label: 'λ₂u₂', constrain: (x, y) => { const u = [h1.x, h1.y], n = Math.hypot(...u) || 1, w = [-u[1] / n, u[0] / n], s = x * w[0] + y * w[1]; return [s * w[0], s * w[1]]; } });
        let st = {};
        v.legend([['blue', '$T$'], ['green', '$R=T^{1/2}$'], ['purple', 'non-positive root $Q$', { dash: true }], ['red', 'negative eigenvalue']]);
        v.render(() => {
          const u = [h1.x, h1.y], l1 = Math.hypot(...u), e1 = u.map((x) => x / l1), w = [-e1[1], e1[0]];
          const l2 = h2.x * w[0] + h2.y * w[1];      // signed
          h2.x = l2 * w[0]; h2.y = l2 * w[1];
          const T = [[l1 * e1[0] * e1[0] + l2 * w[0] * w[0], l1 * e1[0] * e1[1] + l2 * w[0] * w[1]], [l1 * e1[1] * e1[0] + l2 * w[1] * w[0], l1 * e1[1] * e1[1] + l2 * w[1] * w[1]]];
          S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 3] });
          S.path(ellipse(T), { color: 'blue', width: 2.4 });
          S.line(-l1 * e1[0], -l1 * e1[1], l1 * e1[0], l1 * e1[1], { color: 'blue', width: 1, alpha: 0.6 });
          S.line(-l2 * w[0], -l2 * w[1], l2 * w[0], l2 * w[1], { color: l2 < 0 ? 'red' : 'blue', width: l2 < 0 ? 2.4 : 1, alpha: 0.8 });
          if (l2 >= 0) {
            const R = fnSym(T, Math.sqrt);
            const F = [[e1[0] * e1[0] - w[0] * w[0], e1[0] * e1[1] - w[0] * w[1]], [e1[1] * e1[0] - w[1] * w[0], e1[1] * e1[1] - w[1] * w[1]]];   // reflection fixing u₁, commuting with R
            const Q = mm(F, R);
            S.path(ellipse(R), { color: 'green', width: 2.4 });
            S.path(ellipse(Q), { color: 'purple', width: 1.6, dash: [6, 4] });
            const x0 = [Math.cos(2.2), Math.sin(2.2)], Rx = mv(R, x0), Qx = mv(Q, x0);
            S.dot(x0[0], x0[1], { color: 'ink', r: 4, label: 'x', labelPos: 'nw' });
            S.arrow(0, 0, Rx[0], Rx[1], { color: 'green', width: 2 }); S.dot(Rx[0], Rx[1], { color: 'green', r: 4, label: 'Rx', labelPos: 'ne' });
            S.arrow(0, 0, Qx[0], Qx[1], { color: 'purple', width: 2 }); S.dot(Qx[0], Qx[1], { color: 'purple', r: 4, label: 'Qx', labelPos: 'se' });
            st = { pos: true, l1, l2, err: fro(sub(mm(R, R), T)), errQ: fro(sub(mm(Q, Q), T)), minQ: Math.min(...eigS([[Q[0][0], (Q[0][1] + Q[1][0]) / 2], [(Q[0][1] + Q[1][0]) / 2, Q[1][1]]])[0]) };
          } else st = { pos: false, l1, l2 };
        });
        v.readout(() => {
          const s = st;
          if (!s.pos) return `$\\sigma(T)=\\{${v.fix(s.l1, 3)},\\,${v.fix(s.l2, 3)}\\}$ contains a negative number: $T$ is self-adjoint but not positive, and has no positive square root.`;
          return `$T\\ge0$ with eigenvalues $${v.fix(s.l1, 3)},\\,${v.fix(s.l2, 3)}$. $\\|R^2-T\\| = ${v.sci(s.err + 1e-17, 1)}$; the other root has $\\|Q^2-T\\| = ${v.sci(s.errQ + 1e-17, 1)}$ but $Q$ is not positive (its quadratic form reaches $${v.fix(s.minQ, 3)}<0$).`;
        });
      },
    },
    {
      num: '12.35',
      kind: 'Theorem',
      name: 'Polar decomposition T = UP',
      statement: String.raw`Every invertible $T\in B(H)$ has a unique factorisation
$$T=UP$$
with $U$ unitary and $P$ positive and invertible; namely $P=(T^*T)^{1/2}=|T|$ and $U=TP^{-1}$. If $T$ is normal, then $U$ and $P$ commute with each other and with $T$.`,
      idea: String.raw`$T^*T$ is positive and invertible, so $P=(T^*T)^{1/2}$ exists and is invertible (12.32). Then $U=TP^{-1}$ satisfies $U^*U=P^{-1}T^*TP^{-1}=I$ and is invertible, hence unitary. Uniqueness: $T^*T=PU^*UP=P^2$ forces $P$ by uniqueness of positive roots. If $T$ is normal, $T$ commutes with $T^*T$ and hence with $P$ (12.32), and then with $U$.`,
      caption: String.raw`An invertible real $2\times2$ matrix $T$ — drag the images $Te_1$, $Te_2$ of the basis vectors. The unit circle (grey) is first stretched by $P=|T|$ along its eigen-axes (green ellipse), then rotated (or reflected) rigidly by $U$ onto $T$'s image (blue). The readout checks $U^\top U=I$ and $UP=T$; $\det U=\pm1$ tells rotation from reflection. Drag $Te_1$ and $Te_2$ to be parallel: $T$ becomes singular and $P$ loses invertibility.`,
      deps: ['fa-12.32', 'fa-12.11'],
      tags: ['polar decomposition', 'positive operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.6, 2.6], y: [-2, 2], equal: true, height: 400, axes: true, title: 'circle → $P$(circle) → $U P$(circle) $=T$(circle)' });
        const a = S.handle(1.3, 0.4, { color: 'blue', label: 'Te₁' });
        const b = S.handle(0.6, 1.1, { color: 'blue', label: 'Te₂' });
        let st = {};
        v.legend([['muted', 'unit circle'], ['green', '$P$(circle), $P=(T^\\top T)^{1/2}$'], ['blue', '$T$(circle)'], ['orange', 'the rotation $U$']]);
        v.render(() => {
          const T = [[a.x, b.x], [a.y, b.y]], det = T[0][0] * T[1][1] - T[0][1] * T[1][0];
          S.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [3, 3] });
          S.path(ellipse(T), { color: 'blue', width: 2.4 });
          S.arrow(0, 0, a.x, a.y, { color: 'blue', width: 1.6, alpha: 0.6 }); S.arrow(0, 0, b.x, b.y, { color: 'blue', width: 1.6, alpha: 0.6 });
          if (Math.abs(det) < 0.02) { st = { sing: true }; return; }
          const P = fnSym(mm(tr(T), T), Math.sqrt), Pi = fnSym(mm(tr(T), T), (l) => 1 / Math.sqrt(l)), U = mm(T, Pi);
          S.path(ellipse(P), { color: 'green', width: 2.2 });
          const [[p1, p2], [v1, v2]] = eigS(P);
          S.line(0, 0, p1 * v1[0], p1 * v1[1], { color: 'green', width: 1.2 }); S.line(0, 0, p2 * v2[0], p2 * v2[1], { color: 'green', width: 1.2 });
          const ang = Math.atan2(U[1][0], U[0][0]), dU = U[0][0] * U[1][1] - U[0][1] * U[1][0];
          S.curve((t) => [0.45 * Math.cos(t), 0.45 * Math.sin(t)], 0, ang, { color: 'orange', width: 2.4, n: 60 });
          st = { sing: false, orth: fro(sub(mm(tr(U), U), [[1, 0], [0, 1]])), fac: fro(sub(mm(U, P), T)), dU, ang: ang * 180 / Math.PI, p: [p1, p2] };
        });
        v.readout(() => {
          const s = st; if (s.sing) return '$T$ is (nearly) singular: $T^\\top T$ is not invertible and the polar decomposition with invertible $P$ fails.';
          return `$\\|U^\\top U-I\\| = ${v.sci(s.orth + 1e-17, 1)}$, $\\;\\|UP-T\\| = ${v.sci(s.fac + 1e-17, 1)}$. $P$ has eigenvalues $${v.fix(s.p[0], 3)},\\,${v.fix(s.p[1], 3)}$ (the singular values of $T$); $\\det U = ${v.fix(s.dU, 3)}$` + (s.dU > 0 ? ` — a rotation by $${v.fix(s.ang, 1)}^\\circ$.` : ' — a reflection.');
        });
      },
    },
    {
      num: '12.37',
      kind: 'Theorem',
      name: 'The invertible group of B(H) is connected',
      statement: String.raw`Every unitary $U\in B(H)$ is $e^{iQ}$ for some self-adjoint $Q$, every invertible positive $P$ is $e^{S}$ for some self-adjoint $S$, so every invertible $T=UP=e^{iQ}e^{S}$ (12.35). Consequently $G(B(H))$ is connected: $t\mapsto e^{itQ}e^{tS}$ is a path in $G$ from $I$ to $T$.`,
      idea: String.raw`$\sigma(U)\subset\T$; with a Borel branch $\theta$ of the argument on $\T$ (values in $(-\pi,\pi]$), $Q=\theta(U)=\int\theta\,dE$ is self-adjoint and $e^{iQ}=U$ by the Borel calculus — no continuity of $\theta$ is needed, unlike for the holomorphic calculus. Similarly $S=\log P$. In contrast, the invertible group of a general Banach algebra need not be connected (10.34: $G(\ell^1(\Z))/G_1\cong\Z$).`,
      caption: String.raw`A real invertible $2\times2$ $T$ (drag $Te_1$, $Te_2$, keeping $\det T>0$) and the path $T_t=e^{tQ}e^{tS}$, $0\le t\le1$, with $Q$ skew and $S$ symmetric from the polar decomposition: the images of the unit circle under $T_t$ (gold, darker = later) morph from the circle into $T$'s ellipse without ever degenerating. Right: $\det T_t$ along the path stays positive. With $\det T<0$ no real path exists (det would have to cross $0$) — in $M_2(\C)$ one exists, since $\det$ can go around $0$: the complex group is connected, the real one is not.`,
      deps: ['fa-12.35', 'fa-12.24'],
      tags: ['invertible group', 'connectedness', 'exponentials'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.6, 2.6], y: [-2, 2], equal: true, height: 360, axes: true, title: 'the path $T_t=e^{tQ}e^{tS}$ applied to the unit circle' });
        const R = v.stage({ x: [0, 1], y: [-0.5, 3], height: 360, axes: 'box', xlabel: 't', title: '$\\det T_t$' });
        const a = L.handle(1.4, 0.5, { color: 'blue', label: 'Te₁' });
        const b = L.handle(-0.4, 1.0, { color: 'blue', label: 'Te₂' });
        let st = {};
        v.render(() => {
          const T = [[a.x, b.x], [a.y, b.y]], det = T[0][0] * T[1][1] - T[0][1] * T[1][0];
          L.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [3, 3] });
          L.path(ellipse(T), { color: 'blue', width: 2.4 });
          if (det <= 0.02) { R.corner(det < 0 ? 'det T < 0: not in the identity component of GL₂(ℝ)' : 'T is singular', 'tl', { color: 'red', weight: 600 }); st = { bad: true, det }; return; }
          const P = fnSym(mm(tr(T), T), Math.sqrt), Pi = fnSym(mm(tr(T), T), (l) => 1 / Math.sqrt(l)), U = mm(T, Pi);
          const th = Math.atan2(U[1][0], U[0][0]), Sl = fnSym(P, Math.log);
          const Tt = (t) => { const c = Math.cos(t * th), s = Math.sin(t * th), E = fnSym(Sl, (l) => Math.exp(t * l)); return mm([[c, -s], [s, c]], E); };
          for (let k = 0; k <= 12; k++) { const t = k / 12; L.path(ellipse(Tt(t), 120), { color: 'gold', width: 1.3, alpha: 0.25 + 0.6 * t }); }
          const dets = M.linspace(0, 1, 101).map((t) => { const A = Tt(t); return [t, A[0][0] * A[1][1] - A[0][1] * A[1][0]]; });
          R.setView(null, [Math.min(-0.3, ...dets.map((p) => p[1])), Math.max(1.5, ...dets.map((p) => p[1])) * 1.1]);
          R.hline(0, { color: 'red', width: 1.2, dash: [4, 4] });
          R.path(dets, { color: 'green', width: 2.6 });
          st = { bad: false, det, minDet: Math.min(...dets.map((p) => p[1])), th: th * 180 / Math.PI };
        });
        v.readout(() => (st.bad ? `$\\det T = ${v.fix(st.det, 3)}$: no path in the real invertible group joins $T$ to $I$.` : `Rotation angle $${v.fix(st.th, 1)}^\\circ$; along the path $\\min_t\\det T_t = ${v.fix(st.minDet, 3)}>0$, so every $T_t$ is invertible.`));
      },
    },
    {
      num: '12.41',
      kind: 'Theorem',
      name: 'Gelfand–Naimark: every B*-algebra is an operator algebra',
      statement: String.raw`Every $B^*$-algebra $A$ is isometrically $*$-isomorphic to a closed subalgebra of $B(H)$, closed under adjoints, for some Hilbert space $H$.`,
      idea: String.raw`The GNS construction. Each positive functional $F$ (a **state** if $F(e)=1$) gives a semi-inner product $\langle x,y\rangle_F=F(y^*x)$ on $A$; quotient by the null vectors and complete to get $H_F$, on which $A$ acts by left multiplication, $\pi_F(a)[x]=[ax]$ — bounded because $\norm a^2e-a^*a\ge0$. There are enough states: for hermitian $a$ some state has $F(a^2)=\norm a^2$ (Hahn–Banach on the commutative $B^*$-algebra generated by $a$, 11.18). The direct sum $\bigoplus_F\pi_F$ is then isometric.`,
      caption: String.raw`GNS for the commutative $B^*$-algebra $A=\C^3$ (functions on three points) and the state $F(a)=\sum_kp_ka_k$ given by a probability vector $p$ — drag it in the triangle. $\langle a,b\rangle_F=\sum_kp_ka_k\bar b_k$; a point with $p_k=0$ is invisible to $F$, so $H_F=\C^{\#\{p_k>0\}}$. Right: $\norm{\pi_F(a)}$ (the largest $|a_k|$ over the support of $p$) against $\norm a=\max_k|a_k|$ for the element $a$ shown. One state may lose information (inequality), but the sum over the three point-states recovers $\norm a$ exactly.`,
      deps: ['fa-11.31', 'fa-11.18', 'fa-12.9'],
      tags: ['B*-algebras', 'GNS construction', 'representations'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = [1.4, -0.6, 0.9].map((x, k) => v.slider(`$a_${k + 1}$`, -2, 2, x, { step: 0.01 }));
        const V = [[0, 1.15], [-1, -0.58], [1, -0.58]];
        const L = v.stage({ x: [-1.5, 1.5], y: [-1.1, 1.6], equal: true, height: 320, axes: false, ticks: false, title: 'states $F=\\sum p_k\\delta_k$' });
        const R = v.stage({ x: [0.3, 4.7], y: [0, 2.2], height: 320, axes: 'box', xticks: [[1, '|a₁|'], [2, '|a₂|'], [3, '|a₃|'], [4, '‖π_F(a)‖']], title: '$|a_k|$ and the norm seen by $F$' });
        const bary = (x, y) => { const T = [[V[0][0] - V[2][0], V[1][0] - V[2][0]], [V[0][1] - V[2][1], V[1][1] - V[2][1]]]; const l = M.solve(T, [x - V[2][0], y - V[2][1]]); return [l[0], l[1], 1 - l[0] - l[1]].map((t) => Math.max(0, t)); };
        const hp = L.handle(0.3, 0.15, { color: 'blue', label: 'F', constrain: (x, y) => { const p = bary(x, y), s = p[0] + p[1] + p[2]; const q = p.map((t) => t / s); const X = q[0] * V[0][0] + q[1] * V[1][0] + q[2] * V[2][0], Y = q[0] * V[0][1] + q[1] * V[1][1] + q[2] * V[2][1]; for (let k = 0; k < 3; k++) { const ed = [(k + 1) % 3, (k + 2) % 3]; if (q[k] < 0.06) { const qq = q.slice(); qq[k] = 0; const t = qq[ed[0]] + qq[ed[1]]; return [(qq[ed[0]] * V[ed[0]][0] + qq[ed[1]] * V[ed[1]][0]) / t, (qq[ed[0]] * V[ed[0]][1] + qq[ed[1]] * V[ed[1]][1]) / t]; } } return [X, Y]; } });
        let st = {};
        v.render(() => {
          const a = aS.map((s) => s.value), p = bary(hp.x, hp.y), s = p.reduce((x, y) => x + y, 0), q = p.map((t) => t / s);
          L.poly(V, { fill: 'blue', fillAlpha: 0.06, color: 'blue', width: 1.6 });
          V.forEach((P, k) => { L.dot(P[0], P[1], { color: 'ink', r: 4.5 }); L.text(`δ${'₁₂₃'[k]}`, P[0], P[1], { dy: k ? 16 : -14, color: 'ink', size: 12 }); });
          const supp = q.map((t) => t > 1e-6);
          const piNorm = Math.max(...a.map((x, k) => (supp[k] ? Math.abs(x) : 0)));
          a.forEach((x, k) => R.rect(k + 1 - 0.3, 0, k + 1 + 0.3, Math.abs(x), { fill: supp[k] ? 'blue' : 'muted', fillAlpha: supp[k] ? 0.75 : 0.3, stroke: false }));
          R.rect(4 - 0.3, 0, 4 + 0.3, piNorm, { fill: 'green', fillAlpha: 0.8, stroke: false });
          R.hline(Math.max(...a.map(Math.abs)), { color: 'ink', width: 1.4, dash: [5, 4] });
          st = { q, piNorm, norm: Math.max(...a.map(Math.abs)), dim: supp.filter(Boolean).length };
        });
        v.readout(() => `$p=(${st.q.map((t) => v.fix(t, 2)).join(',\\,')})$: $\\dim H_F = ${st.dim}$, $\\;\\|\\pi_F(a)\\| = ${v.fix(st.piNorm, 3)}$ vs. $\\|a\\| = ${v.fix(st.norm, 3)}$` + (st.piNorm < st.norm - 1e-9 ? ' — this state alone is not faithful; summing over all states fixes that.' : ' — here $\\pi_F$ already sees the full norm.'));
      },
    },
    {
      num: '12.44',
      kind: 'Theorem',
      name: 'The mean ergodic theorem',
      statement: String.raw`If $T\in B(H)$ and $\norm T\le1$, then for every $x\in H$ the averages
$$A_nx=\frac1n\big(x+Tx+\dots+T^{n-1}x\big)$$
converge in norm to $Px$, where $P$ is the orthogonal projection onto the fixed space $\mathscr N(T-I)$.`,
      idea: String.raw`For a contraction, $Tx=x$ iff $T^*x=x$, so $\mathscr N(T-I)=\mathscr N(T^*-I)=\mathscr R(T-I)^\perp$ (12.10). On the fixed space $A_n=I$. On vectors $y=(T-I)z$ the sum telescopes: $A_ny=\frac1n(T^nz-z)\to0$. By uniform boundedness ($\norm{A_n}\le1$) this extends to the closure $\overline{\mathscr R(T-I)}$, and $H=\mathscr N(T-I)\oplus\overline{\mathscr R(T-I)}$.`,
      caption: String.raw`$H=L^2(\T)$ and $T$ = rotation by the angle $2\pi\alpha$. Choose $\alpha$ rational ($T^q=I$ for some $q$, so the fixed space is the $q$-periodic functions) or irrational (fixed space = constants). Top: $f$ (blue), and the average $A_nf$ (green) over $n$ rotations, against its limit $Pf$ (dashed). Bottom: $\norm{A_nf-Pf}_2$ against $n$ (log scale), decaying like $1/n$.`,
      deps: ['fa-12.10', 'fa-12.2', 'fa-2.5'],
      tags: ['ergodic theory', 'contractions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.select('$\\alpha=$', [{ value: 'g', label: '$(\\sqrt5-1)/2$' }, { value: 'r3', label: '$1/3$' }, { value: 'r5', label: '$2/5$' }], 'g');
        const nS = v.slider('$n$', 1, 200, 12, { int: true });
        const top = v.stage({ x: [0, 1], y: [-1.6, 2.2], height: 240, full: true, axes: true, xlabel: 'θ/2π', title: '$f$, $A_nf$ and $Pf$' });
        const bot = v.stage({ x: [0, Math.log10(200)], y: [-3, 0.5], height: 200, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100']], xlabel: 'n', title: '$\\|A_nf-Pf\\|_2$ (log–log)' });
        // f has Fourier modes k = 0, 1, 3, 5, 6 ; rotation multiplies mode k by e^{2πikα}
        const MODES = [[0, 0.4, 0], [1, 0.8, 0.2], [3, 0.5, -0.4], [5, 0.35, 0.3], [6, 0.3, 0]];
        let st = {};
        v.legend([['blue', '$f$'], ['green', '$A_nf$'], ['ink', '$Pf$', { dash: true }]]);
        v.render(() => {
          const al = { g: (Math.sqrt(5) - 1) / 2, r3: 1 / 3, r5: 2 / 5 }[aS.value], n = nS.value;
          const fixed = (k) => Math.abs(((k * al) % 1 + 1) % 1) < 1e-9 || Math.abs(((k * al) % 1 + 1) % 1 - 1) < 1e-9;
          const avgFactor = (k, m) => { if (fixed(k)) return [1, 0]; const z = [Math.cos(2 * Math.PI * k * al), Math.sin(2 * Math.PI * k * al)]; let s = [0, 0], p = [1, 0]; for (let j = 0; j < m; j++) { s = cadd(s, p); p = cmul(p, z); } return [s[0] / m, s[1] / m]; };
          const evalF = (coef, t) => coef.reduce((s, [k, c]) => s + c[0] * Math.cos(2 * Math.PI * k * t) - c[1] * Math.sin(2 * Math.PI * k * t), 0);
          const f = MODES.map(([k, re, im]) => [k, [re, im]]);
          const An = MODES.map(([k, re, im]) => [k, cmul([re, im], avgFactor(k, n))]);
          const Pf = MODES.map(([k, re, im]) => [k, fixed(k) ? [re, im] : [0, 0]]);
          top.fn((t) => evalF(f, t), { color: 'blue', width: 1.8, alpha: 0.7 });
          top.fn((t) => evalF(Pf, t), { color: 'ink', width: 1.6, dash: [6, 4] });
          top.fn((t) => evalF(An, t), { color: 'green', width: 2.6 });
          const err = (m) => Math.sqrt(MODES.reduce((s, [k, re, im]) => { if (fixed(k)) return s; const c = cmul([re, im], avgFactor(k, m)); return s + (c[0] * c[0] + c[1] * c[1]) / 2; }, 0));
          const pts = M.range(200).map((i) => [Math.log10(i + 1), Math.log10(err(i + 1) + 1e-16)]);
          bot.setTicks([[0, '1'], [1, '10'], [2, '100']], [0, -1, -2, -3].map((k) => [k, k === 0 ? '1' : `10⁻${'¹²³'[-k - 1]}`]));
          bot.line(0, pts[0][1], 2.3, pts[0][1] - 2.3, { color: 'muted', width: 1, dash: [4, 4] });
          bot.path(pts, { color: 'green', width: 1.8 });
          bot.dot(Math.log10(n), Math.log10(err(n) + 1e-16), { color: 'green', r: 5 });
          st = { e: err(n), fixedModes: MODES.filter(([k]) => fixed(k)).map(([k]) => k) };
        });
        v.readout(() => `Fixed modes of $T$ among those of $f$: $k\\in\\{${st.fixedModes.join(',')}\\}$ — $Pf$ keeps exactly these. $\\|A_nf-Pf\\|_2 = ${v.fix(st.e, 4)}$.`);
      },
    },
  ],
};
