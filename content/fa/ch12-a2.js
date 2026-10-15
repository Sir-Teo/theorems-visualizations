// Rudin, Functional Analysis — Chapter 12 (part 2): normal operators, projections, Fuglede–Putnam–Rosenblum
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => Math.hypot(...a);
const unit = (a) => { const n = nrm(a); return a.map((x) => x / n); };
const matVec = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const sub = (A, B) => A.map((r, i) => r.map((a, j) => a - B[i][j]));
/** Rotation matrix from Euler-like angles. */
function rot3(a, b, c) {
  const Rz = (t) => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
  const Rx = (t) => [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
  return mm(mm(Rz(a), Rx(b)), Rz(c));
}
const fro = (A) => Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
// complex 3×3 for 12.16
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cmm = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const cstar = (A) => A[0].map((_, j) => A.map((row) => [row[j][0], -row[j][1]]));
const csubM = (A, B) => A.map((row, i) => row.map((a, j) => [a[0] - B[i][j][0], a[1] - B[i][j][1]]));
const cfro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));

export default {
  collection: 'fa',
  chapter: 12,
  items: [
    {
      num: '12.10',
      kind: 'Theorem',
      name: 'Null spaces and ranges: N(T*) = R(T)^⊥',
      statement: String.raw`For $T\in B(H)$,
$$\mathscr N(T^*)=\mathscr R(T)^\perp,\qquad\mathscr N(T)=\mathscr R(T^*)^\perp .$$
Consequently $\overline{\mathscr R(T)}=\mathscr N(T^*)^\perp$, and $T$ has dense range if and only if $T^*$ is one-to-one.`,
      idea: String.raw`$T^*y=0$ iff $(x,T^*y)=0$ for all $x$ iff $(Tx,y)=0$ for all $x$ iff $y\perp\mathscr R(T)$. The second identity is the first applied to $T^*$, since $T^{**}=T$. Closures come from $M^{\perp\perp}=\overline M$ for subspaces of a Hilbert space.`,
      caption: String.raw`A rank-two operator $T$ on $\R^3$ (drag the panels to rotate; the sliders set $T$). Left: the range $\mathscr R(T)$ — the plane containing the image of the unit sphere (an ellipse) — and the null space of $T^*$ (red line), computed independently by solving $T^*y=0$: it is perpendicular to the plane. Right: the same for $T^*$: $\mathscr R(T^*)$ and $\mathscr N(T)$. The readout checks the orthogonality numerically.`,
      deps: ['fa-12.9', 'fa-12.2'],
      see: ['fa-4.12'],
      tags: ['Hilbert space', 'adjoint', 'range'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('rotation of the range', 0, 3.14, 0.7, { step: 0.01 });
        const bS = v.slider('tilt of the range', 0, 1.5, 0.6, { step: 0.01 });
        const sS = v.slider('second singular value', 0.2, 1.4, 0.7, { step: 0.01 });
        const L = v.stage3d({ range: 1.7, height: 340, yaw: 0.6, pitch: 0.35 });
        const R = v.stage3d({ range: 1.7, height: 340, yaw: 0.6, pitch: 0.35 });
        // null space of a 3×3 matrix of rank 2: cross product of two independent rows
        const nullOf = (A) => { const c = [cross(A[0], A[1]), cross(A[0], A[2]), cross(A[1], A[2])]; return unit(c.reduce((b, x) => (nrm(x) > nrm(b) ? x : b))); };
        let st = {};
        v.legend([['blue', 'range, and the image of the unit sphere'], ['red', 'null space of the adjoint']]);
        const panel = (S, A, title) => {
          // image of the unit sphere: ellipse in the range
          const cols = [0, 1, 2].map((j) => A.map((r) => r[j]));
          // span of the columns: an orthonormal basis by Gram–Schmidt
          let e1 = unit(cols.reduce((b, x) => (nrm(x) > nrm(b) ? x : b)));
          let e2 = cols.map((c) => c.map((x, i) => x - dot3(c, e1) * e1[i])).reduce((b, x) => (nrm(x) > nrm(b) ? x : b)); e2 = unit(e2);
          const sq = [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]].map(([a, b]) => e1.map((x, i) => a * x + b * e2[i]));
          S.poly(sq, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 1 });
          // image of great circles of the unit sphere
          for (const k of [0, 1, 2]) S.curve((t) => { const u = [Math.cos(t), Math.sin(t), 0]; const w = k === 0 ? u : k === 1 ? [u[0], 0, u[1]] : [0, u[0], u[1]]; return matVec(A, w); }, 0, M.TAU, { color: 'blue', width: 1.8, n: 120 });
          const ns = nullOf(tr(A));
          S.line(ns.map((x) => -1.5 * x), ns.map((x) => 1.5 * x), { color: 'red', width: 3 });
          S.dot(ns.map((x) => 1.5 * x), { color: 'red', label: title });
          return { e1, e2, ns };
        };
        v.render(() => {
          const Rg = rot3(aS.value, bS.value, 0.3), Dm = rot3(-0.4, 0.9, 1.1), s2 = sS.value;
          const T = mm(mm(Rg, [[1.1, 0, 0], [0, s2, 0], [0, 0, 0]]), tr(Dm));
          const a = panel(L, T, 'N(T*)'), b = panel(R, tr(T), 'N(T)');
          st = { o1: Math.max(Math.abs(dot3(a.ns, a.e1)), Math.abs(dot3(a.ns, a.e2))), o2: Math.max(Math.abs(dot3(b.ns, b.e1)), Math.abs(dot3(b.ns, b.e2))) };
        });
        v.readout(() => `Left: $\\mathscr N(T^*)\\perp\\mathscr R(T)$ up to $${v.sci(st.o1 + 1e-17, 1)}$; right: $\\mathscr N(T)\\perp\\mathscr R(T^*)$ up to $${v.sci(st.o2 + 1e-17, 1)}$.`);
      },
    },
    {
      num: '12.11',
      kind: 'Theorem',
      name: 'Characterisations of normal operators',
      statement: String.raw`$T\in B(H)$ is normal ($TT^*=T^*T$) if and only if
$$\norm{Tx}=\norm{T^*x}\qquad(x\in H).$$
If $T$ is normal, then $\mathscr N(T)=\mathscr N(T^*)$; $\mathscr R(T)$ is dense iff $T$ is one-to-one; $T$ is invertible iff $\norm{Tx}\ge c\norm x$ for some $c>0$; $Tx=\alpha x$ implies $T^*x=\bar\alpha x$; and eigenvectors for distinct eigenvalues are orthogonal.`,
      idea: String.raw`$\norm{Tx}^2-\norm{T^*x}^2=((T^*T-TT^*)x,x)$, and a self-adjoint operator whose quadratic form vanishes is $0$ (12.7). The other statements follow by applying the norm identity to $T-\alpha I$, which is normal along with $T$, and to 12.10. Orthogonality: $\alpha(x,y)=(Tx,y)=(x,T^*y)=(x,\bar\beta y)=\beta(x,y)$.`,
      caption: String.raw`A real $2\times2$ matrix $T=\begin{pmatrix}a&b\\c&d\end{pmatrix}$. Left: the images of the unit circle under $T$ (blue) and $T^*$ (orange). Right: $\norm{Tx_\theta}$ and $\norm{T^*x_\theta}$ for $x_\theta=(\cos\theta,\sin\theta)$. They coincide for every $\theta$ exactly when $T$ is normal — try $b=c$ (symmetric) or $b=-c$, $a=d$ (a rotation times a dilation). Then the eigen-directions (dashed) are orthogonal.`,
      deps: ['fa-12.9', 'fa-12.7', 'fa-12.10'],
      tags: ['normal operators', 'Hilbert space'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('$a$', -1.5, 1.5, 0.9, { step: 0.01 });
        const bS = v.slider('$b$', -1.5, 1.5, 0.8, { step: 0.01 });
        const cS = v.slider('$c$', -1.5, 1.5, 0.2, { step: 0.01 });
        const dS = v.slider('$d$', -1.5, 1.5, 0.4, { step: 0.01 });
        v.button('make it normal ($c=b$)', () => { cS.set(bS.value); });
        const L = v.stage({ x: [-2.2, 2.2], y: [-2, 2], equal: true, height: 320, axes: true, title: 'images of the unit circle under $T$ and $T^*$' });
        const R = v.stage({ x: [0, 2 * Math.PI], y: [0, 2.5], height: 320, axes: 'box', xticks: [[0, '0'], [Math.PI, 'π'], [2 * Math.PI, '2π']], xlabel: 'θ', title: '$\\|Tx_\\theta\\|$ and $\\|T^*x_\\theta\\|$' });
        let st = {};
        v.legend([['blue', '$T$'], ['orange', '$T^*$'], ['muted', 'eigen-directions (if real)', { dash: true }]]);
        v.render(() => {
          const a = aS.value, b = bS.value, c = cS.value, d = dS.value, T = [[a, b], [c, d]], Ts = [[a, c], [b, d]];
          const th = M.linspace(0, 2 * Math.PI, 241);
          const im = (A) => th.map((t) => matVec(A, [Math.cos(t), Math.sin(t)]));
          L.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          L.path(im(T), { color: 'blue', width: 2.4 });
          L.path(im(Ts), { color: 'orange', width: 2.2, dash: [6, 4] });
          const tr2 = a + d, det = a * d - b * c, disc = tr2 * tr2 / 4 - det;
          let ortho = null;
          if (disc > 1e-9) {
            const l1 = tr2 / 2 + Math.sqrt(disc), l2 = tr2 / 2 - Math.sqrt(disc);
            const ev = (l) => unit(Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : l === a ? [1, 0] : [0, 1]);
            const e1 = ev(l1), e2 = ev(l2);
            for (const e of [e1, e2]) L.line(-2.5 * e[0], -2.5 * e[1], 2.5 * e[0], 2.5 * e[1], { color: 'muted', width: 1.2, dash: [6, 4] });
            ortho = Math.abs(e1[0] * e2[0] + e1[1] * e2[1]);
          }
          const nT = th.map((t) => nrm(matVec(T, [Math.cos(t), Math.sin(t)]))), nS = th.map((t) => nrm(matVec(Ts, [Math.cos(t), Math.sin(t)])));
          R.setView(null, [0, Math.max(...nT, ...nS) * 1.15]);
          R.path(th.map((t, i) => [t, nT[i]]), { color: 'blue', width: 2.4 });
          R.path(th.map((t, i) => [t, nS[i]]), { color: 'orange', width: 2.2, dash: [6, 4] });
          const comm = fro(sub(mm(T, Ts), mm(Ts, T))), gap = Math.max(...nT.map((x, i) => Math.abs(x - nS[i])));
          st = { comm, gap, ortho };
        });
        v.readout(() => `$\\|TT^*-T^*T\\|_F = ${v.fix(st.comm, 4)}$, $\\;\\max_\\theta\\big|\\|Tx_\\theta\\|-\\|T^*x_\\theta\\|\\big| = ${v.fix(st.gap, 4)}$` + (st.ortho != null ? `; eigen-directions: $|\\cos\\angle| = ${v.fix(st.ortho, 4)}$.` : '; complex eigenvalues (no real eigen-directions).') + (st.comm < 1e-9 ? ' **Normal.**' : ''));
      },
    },
    {
      num: '12.13',
      kind: 'Theorem',
      name: 'Self-adjoint operators: spectrum between inf and sup of (Tx, x)',
      statement: String.raw`If $T\in B(H)$ is self-adjoint, put $m=\inf\{(Tx,x):\norm x=1\}$ and $M=\sup\{(Tx,x):\norm x=1\}$. Then $\sigma(T)\subset[m,M]$, both $m$ and $M$ belong to $\sigma(T)$, and $\norm T=\max(|m|,|M|)=\rho(T)$. More generally $\norm T=\rho(T)$ for every normal $T$.`,
      idea: String.raw`For $\lambda<m$, $((T-\lambda I)x,x)\ge(m-\lambda)\norm x^2$, so $T-\lambda I$ is bounded below and (being self-adjoint) invertible; similarly above $M$. To see $M\in\sigma(T)$, apply Cauchy–Schwarz to the positive form $((MI-T)x,y)$: unit vectors with $(Tx_n,x_n)\to M$ give $(MI-T)x_n\to0$. For normal $T$, $\norm{T^2}=\norm T^2$ (from $\norm{T^*T}=\norm T^2$ and 12.11), iterate, and use the spectral radius formula.`,
      caption: String.raw`A real symmetric $3\times3$ operator $T=Q\operatorname{diag}(\lambda_1,\lambda_2,\lambda_3)Q^\top$ (set the eigenvalues; drag to rotate). The unit sphere is coloured by the Rayleigh quotient $(Tx,x)$; the eigenvectors (dots, red for the extremes) are exactly where its minimum $m$ and maximum $M$ are attained — the largest and smallest eigenvalues. Every value in $[m,M]$ is taken on the sphere (it is connected), but only the eigenvalues are in the spectrum.`,
      deps: ['fa-12.11', 'fa-12.7', 'fa-10.13'],
      tags: ['self-adjoint operators', 'numerical range', 'spectrum'],
      verify: true,
      viz(v) {
        const M = v.M;
        const l1S = v.slider('$\\lambda_1$', -2, 2, 1.6, { step: 0.01 });
        const l2S = v.slider('$\\lambda_2$', -2, 2, 0.3, { step: 0.01 });
        const l3S = v.slider('$\\lambda_3$', -2, 2, -1.1, { step: 0.01 });
        const S = v.stage3d({ range: 1.5, height: 380, yaw: 0.8, pitch: 0.4 });
        const Q = rot3(0.5, 0.8, 1.3);
        let st = {};
        v.legend([['red', 'eigenvectors for $m$ and $M$'], ['ink', 'middle eigenvector']]);
        v.render(() => {
          const l = [l1S.value, l2S.value, l3S.value], D = [[l[0], 0, 0], [0, l[1], 0], [0, 0, l[2]]], T = mm(mm(Q, D), tr(Q));
          const m = Math.min(...l), Mx = Math.max(...l);
          S.surface((u, w) => [Math.sin(u) * Math.cos(w), Math.sin(u) * Math.sin(w), Math.cos(u)], [0, Math.PI], [0, 2 * Math.PI], { n: 36, alpha: 0.92, colorFn: (u, w, p) => { const q = dot3(p, matVec(T, p)); return M.cmap(Mx > m ? (q - m) / (Mx - m) : 0.5, 'diverging'); } });
          const cols = [0, 1, 2].map((j) => Q.map((r) => r[j]));
          cols.forEach((e, k) => { const ext = l[k] === m || l[k] === Mx; for (const s of [1, -1]) S.dot(e.map((x) => s * 1.02 * x), { color: ext ? 'red' : 'ink', r: 5 }); S.text(`λ${'₁₂₃'[k]}`, e.map((x) => 1.25 * x), { color: ext ? 'red' : 'ink' }); });
          // Rayleigh quotient extremes over a sample of the sphere
          let lo = Infinity, hi = -Infinity; for (let i = 0; i < 2000; i++) { const z = 1 - 2 * (i + 0.5) / 2000, r = Math.sqrt(1 - z * z), ph = i * 2.399963; const p = [r * Math.cos(ph), r * Math.sin(ph), z], q = dot3(p, matVec(T, p)); lo = Math.min(lo, q); hi = Math.max(hi, q); }
          st = { m, Mx, lo, hi, norm: Math.max(Math.abs(m), Math.abs(Mx)) };
        });
        v.readout(() => `On the sphere $(Tx,x)$ ranges over $[${v.fix(st.lo, 3)},\\,${v.fix(st.hi, 3)}]\\approx[m,M]=[${v.fix(st.m, 3)},\\,${v.fix(st.Mx, 3)}]$, the extreme eigenvalues; $\\|T\\|=\\max(|m|,|M|) = ${v.fix(st.norm, 3)}$.`);
      },
    },
    {
      num: '12.14',
      kind: 'Definition',
      name: 'Projections in a Hilbert space',
      statement: String.raw`An operator $P\in B(H)$ is a **projection** if $P^2=P=P^*$ (an orthogonal, or self-adjoint, projection). Then $\mathscr R(P)$ is closed, $\mathscr N(P)=\mathscr R(P)^\perp$, and $P$ is the orthogonal projection onto $\mathscr R(P)$ of 12.2. Conversely, the orthogonal projection onto any closed subspace is a projection in this sense. Idempotents that are not self-adjoint ($P^2=P\ne P^*$) are oblique projections.`,
      idea: String.raw`For $P^2=P$, $H=\mathscr R(P)\oplus\mathscr N(P)$ algebraically; self-adjointness makes the two summands orthogonal by 12.10, since $\mathscr N(P)=\mathscr N(P^*)=\mathscr R(P)^\perp$. Then $\norm{Px}^2=(Px,x)\le\norm x^2$.`,
      deps: ['fa-12.2', 'fa-12.10'],
      tags: ['projections', 'Hilbert space'],
      verify: true,
    },
    {
      num: '12.15',
      kind: 'Proposition',
      name: 'Idempotents: self-adjoint iff norm ≤ 1',
      statement: String.raw`Let $P\in B(H)$ with $P^2=P\ne0$. The following are equivalent: (a) $P=P^*$; (b) $\mathscr N(P)\perp\mathscr R(P)$; (c) $\norm P=1$ (equivalently $\norm P\le1$); (d) $(Px,x)\ge0$ for all $x$. If $\mathscr R(P)$ and $\mathscr N(P)$ meet at angle $\alpha$, then $\norm P=1/\sin\alpha$.`,
      idea: String.raw`(a)⇒(b) by 12.14. (b)⇒(c): $\norm{Px}^2\le\norm{Px}^2+\norm{(I-P)x}^2=\norm x^2$. (c)⇒(b): if $y\in\mathscr R(P)$ and $z\in\mathscr N(P)$ were not orthogonal, then $\norm{P(y+tz)}=\norm y>\norm{y+tz}$ for a suitable small $t$. The angle formula is a right-triangle computation in the plane spanned by the two lines.`,
      caption: String.raw`An idempotent on $\R^2$ projecting onto the line $\mathscr R(P)$ (green) along the line $\mathscr N(P)$ (orange); rotate either. The unit circle (grey) is mapped onto a segment of $\mathscr R(P)$ of half-length $\norm P=1/\sin\alpha$ (green bar). Drag $x$: $Px$ travels parallel to $\mathscr N(P)$. Only when the two lines are perpendicular is $P$ self-adjoint and $\norm P=1$.`,
      deps: ['fa-12.14', 'fa-12.10'],
      tags: ['projections', 'idempotents'],
      verify: true,
      viz(v) {
        const M = v.M;
        const rS = v.slider('angle of $\\mathscr R(P)$', 0, 180, 20, { step: 1 });
        const nS = v.slider('angle of $\\mathscr N(P)$', 0, 180, 70, { step: 1 });
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, height: 380, axes: true, title: '$P$ projects onto $\\mathscr R(P)$ along $\\mathscr N(P)$' });
        const hx = S.handle(0.4, 0.95, { color: 'blue', label: 'x' });
        let st = {};
        v.legend([['green', '$\\mathscr R(P)$ and $P(\\text{unit disc})$'], ['orange', '$\\mathscr N(P)$'], ['blue', '$x$, $Px$']]);
        v.render(() => {
          const a = rS.value * Math.PI / 180, b = nS.value * Math.PI / 180, r = [Math.cos(a), Math.sin(a)], n = [Math.cos(b), Math.sin(b)];
          const sinA = Math.abs(Math.sin(b - a));
          S.line(-5 * r[0], -5 * r[1], 5 * r[0], 5 * r[1], { color: 'green', width: 1.6 });
          S.line(-5 * n[0], -5 * n[1], 5 * n[0], 5 * n[1], { color: 'orange', width: 1.6, dash: [6, 4] });
          S.circle(0, 0, 1, { color: 'muted', width: 1.4, fill: 'muted', fillAlpha: 0.06 });
          if (sinA < 0.03) { st = { bad: true }; return; }
          // P x = α r where x = α r + β n
          const P = (x) => { const det = r[0] * n[1] - r[1] * n[0], al = (x[0] * n[1] - x[1] * n[0]) / det; return [al * r[0], al * r[1]]; };
          const norm = 1 / sinA;
          S.line(-norm * r[0], -norm * r[1], norm * r[0], norm * r[1], { color: 'green', width: 6, alpha: 0.6 });
          const x = [hx.x, hx.y], px = P(x);
          S.line(x[0], x[1], px[0], px[1], { color: 'muted', width: 1.2, dash: [3, 3] });
          S.arrow(0, 0, px[0], px[1], { color: 'blue', width: 2.6 });
          S.dot(px[0], px[1], { color: 'blue', r: 4, label: 'Px', labelPos: 'se' });
          const selfAdj = Math.abs(Math.cos(b - a)) < 1e-6;
          st = { bad: false, norm, ang: Math.asin(sinA) * 180 / Math.PI, ratio: nrm(px) / Math.max(nrm(x), 1e-9), selfAdj };
        });
        v.readout(() => (st.bad ? 'The lines coincide: no idempotent.' : `Angle $\\alpha = ${v.fix(st.ang, 1)}^\\circ$, $\\;\\|P\\| = 1/\\sin\\alpha = ${v.fix(st.norm, 3)}$; for this $x$, $\\|Px\\|/\\|x\\| = ${v.fix(st.ratio, 3)}$.` + (Math.abs(st.ang - 90) < 0.5 ? ' Perpendicular: $P=P^*$ and $\\|P\\|=1$.' : ' Oblique: $P\\ne P^*$.')));
      },
    },
    {
      num: '12.16',
      kind: 'Theorem',
      name: 'Fuglede–Putnam–Rosenblum theorem',
      statement: String.raw`Suppose $M,N,T\in B(H)$, $M$ and $N$ are normal, and
$$MT=TN .$$
Then $M^*T=TN^*$. In particular (Fuglede), an operator that commutes with a normal operator $N$ also commutes with $N^*$.`,
      idea: String.raw`Iterating $MT=TN$ gives $p(M)T=Tp(N)$ for polynomials, hence $T=e^{-\bar\lambda M}Te^{\bar\lambda N}$ for all $\lambda\in\C$. Put $f(\lambda)=e^{\lambda M^*}Te^{-\lambda N^*}$. Because $M$ commutes with $M^*$ (normality), $f(\lambda)=U_1(\lambda)\,T\,U_2(\lambda)$ with $U_1=e^{\lambda M^*-\bar\lambda M}$ and $U_2=e^{\bar\lambda N-\lambda N^*}$, both unitary since their exponents are skew-adjoint. So $\norm{f(\lambda)}\le\norm T$: $f$ is a bounded entire $B(H)$-valued function, constant by Liouville, and its derivative at $0$ is $M^*T-TN^*=0$.`,
      caption: String.raw`Take $N=M$ and $T=M^2+M$, which commutes with $M$ ($MT=TM$). Fuglede's theorem says $T$ then also commutes with $M^*$ — if $M$ is normal. Here $M$ is a $3\times3$ matrix with eigenvalues you drag and a non-normal part $k$. The bars show the entries of $M^*T-TM^*$: they vanish exactly at $k=0$. Lower panel: $\norm{M^*T-TM^*}$ against $k$, with $\norm{MT-TM}=0$ throughout — the hypothesis $MT=TN$ alone is not enough without normality.`,
      deps: ['fa-12.11', 'rca-10.23'],
      tags: ['normal operators', 'commutativity'],
      verify: true,
      viz(v) {
        const Mm = v.M;
        const kS = v.slider('non-normal part $k$', 0, 1.5, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 280, axes: true, title: 'eigenvalues of $M$' });
        const B = v.stage({ x: [0.3, 9.7], y: [0, 2], height: 280, axes: 'box', xticks: Mm.range(9).map((i) => [i + 1, `${Math.floor(i / 3) + 1}${(i % 3) + 1}`]), title: 'entries $|(M^*T-TM^*)_{ij}|$' });
        const C = v.stage({ x: [0, 1.5], y: [0, 3], height: 170, full: true, axes: 'box', xlabel: 'k', title: '$\\|M^*T-TM^*\\|_F$ (purple) and $\\|MT-TM\\|_F$ (green) against $k$' });
        const H = [[0.8, 0.4], [-0.7, 0.5], [0.1, -0.8]].map(([a, b], i) => L.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[i]}` }));
        // a fixed unitary W so that M = W (D + kU) W*
        const c = Math.cos(0.6), s = Math.sin(0.6);
        const W = [[[c, 0], [0, -s], [0, 0]], [[0, -s], [c, 0], [0, 0]], [[0, 0], [0, 0], [1, 0]]];
        const build = (l, k) => { const D = [[l[0], [k, 0], [0.6 * k, 0.3 * k]], [[0, 0], l[1], [-k, 0]], [[0, 0], [0, 0], l[2]]]; return cmm(cmm(W, D), cstar(W)); };
        const defect = (l, k) => { const M = build(l, k), T = csubM(cmm(M, M), M.map((row) => row.map((z) => [-z[0], -z[1]]))), Ms = cstar(M); return { F: csubM(cmm(Ms, T), cmm(T, Ms)), comm: cfro(csubM(cmm(M, T), cmm(T, M))) }; };
        let st = {};
        v.render(() => {
          const l = H.map((h) => [h.x, h.y]), k = kS.value, { F, comm } = defect(l, k);
          const ents = F.flat().map((z) => Math.hypot(z[0], z[1]));
          B.setView(null, [0, Math.max(0.5, ...ents) * 1.15]);
          ents.forEach((e, i) => B.rect(i + 1 - 0.32, 0, i + 1 + 0.32, e, { fill: e > 1e-9 ? 'purple' : 'green', fillAlpha: 0.75, stroke: false }));
          const ks = Mm.linspace(0, 1.5, 61), curve = ks.map((kk) => [kk, cfro(defect(l, kk).F)]), cm = ks.map((kk) => [kk, defect(l, kk).comm]);
          C.setView(null, [0, Math.max(0.5, ...curve.map((p) => p[1])) * 1.1]);
          C.path(curve, { color: 'purple', width: 2.4 });
          C.path(cm, { color: 'green', width: 2, dash: [6, 4] });
          C.vline(k, { color: 'muted', width: 1, dash: [3, 3] });
          st = { k, f: cfro(F), comm };
        });
        v.readout(() => `$\\|MT-TM\\|_F = ${v.sci(st.comm + 1e-17, 1)}$ (always $0$), $\\;\\|M^*T-TM^*\\|_F = ${v.fix(st.f, 4)}$` + (st.k === 0 ? ' — $M$ is normal and Fuglede applies.' : ' — $M$ is not normal, and $T$ fails to commute with $M^*$.'));
      },
    },
  ],
};
