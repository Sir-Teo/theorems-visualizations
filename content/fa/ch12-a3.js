// Rudin, Functional Analysis — Chapter 12 (part 3): resolutions of the identity and the spectral theorem
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const n = Math.hypot(...a); return a.map((x) => x / n); };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function rot3(a, b, c) {
  const Rz = (t) => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
  const Rx = (t) => [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
  const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  return mm(mm(Rz(a), Rx(b)), Rz(c));
}
/** Convex hull of planar points (monotone chain). */
function hull(P) {
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

export default {
  book: 'fa',
  chapter: 12,
  items: [
    {
      num: '12.17',
      kind: 'Definition',
      name: 'Resolution of the identity (projection-valued measure)',
      statement: String.raw`Let $\mathfrak M$ be a $\sigma$-algebra in a set $\Omega$. A **resolution of the identity** on $\mathfrak M$ is a map $E:\mathfrak M\to B(H)$ such that
(a) $E(\varnothing)=0$, $E(\Omega)=I$;
(b) each $E(\omega)$ is a self-adjoint projection;
(c) $E(\omega'\cap\omega'')=E(\omega')E(\omega'')$;
(d) if $\omega'\cap\omega''=\varnothing$, then $E(\omega'\cup\omega'')=E(\omega')+E(\omega'')$;
(e) for all $x,y\in H$, $E_{x,y}(\omega)=(E(\omega)x,y)$ is a complex measure on $\mathfrak M$.
Then the $E(\omega)$ commute, ranges of disjoint sets are orthogonal, $E_{x,x}(\omega)=\norm{E(\omega)x}^2$, and $\omega\mapsto E(\omega)x$ is a countably additive $H$-valued measure.`,
      idea: String.raw`The prototype: $H=L^2(\mu)$, a measurable $\varphi$, and $E(\omega)$ = multiplication by $1_{\varphi^{-1}(\omega)}$. Then (c) is $1_A1_B=1_{A\cap B}$, and $E_{x,y}(\omega)=\int_{\varphi^{-1}(\omega)}x\bar y\,d\mu$ is the image of $x\bar y\,d\mu$ under $\varphi$. The spectral theorem says that every normal operator is, up to unitary equivalence, of this form.`,
      caption: String.raw`$H=L^2[0,1]$ and $\varphi(t)$ the green function; $E(\omega)$ multiplies by the indicator of $\varphi^{-1}(\omega)$. Drag the ends of the Borel set $\omega$ (an interval on the vertical $\lambda$-axis): the set $\varphi^{-1}(\omega)\subset[0,1]$ lights up, and $E(\omega)x$ (purple) is $x$ cut down to it. Right: the measure $E_{x,x}$ — the distribution of $|x|^2\,dt$ pushed forward by $\varphi$ — whose mass on $\omega$ is $\norm{E(\omega)x}^2$.`,
      deps: ['fa-12.14', 'rca-6.1'],
      tags: ['spectral theory', 'projection-valued measures'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [0, 1], y: [-1.3, 1.6], height: 330, weight: 1.4, axes: true, title: '$\\varphi$ (green), $x$ (blue), $E(\\omega)x$ (purple)' });
        const R = v.stage({ x: [0, 4], y: [-1.3, 1.6], height: 330, axes: 'box', xlabel: 'density', title: '$E_{x,x}$ on the $\\lambda$-axis' });
        const h1 = L.handle(0.02, 0.2, { color: 'orange', r: 6, constrain: (x, y) => [0.02, M.clamp(y, -1.2, 1.5)] });
        const h2 = L.handle(0.02, 0.9, { color: 'orange', r: 6, label: 'ω', labelPos: 'e', constrain: (x, y) => [0.02, M.clamp(y, -1.2, 1.5)] });
        const phi = (t) => 0.9 * Math.sin(5 * t) + 0.4 * t, x = (t) => 1 + 0.5 * Math.cos(9 * t);
        const n = 2000, ts = M.linspace(0, 1, n + 1);
        let st = {};
        v.legend([['green', '$\\varphi$'], ['blue', '$x$'], ['purple', '$E(\\omega)x$'], ['orange', '$\\omega$ and $\\varphi^{-1}(\\omega)$', { area: true }]]);
        v.render(() => {
          const a = Math.min(h1.y, h2.y), b = Math.max(h1.y, h2.y);
          L.hband(a, b, { color: 'orange', alpha: 0.1 });
          L.line(0.02, a, 0.02, b, { color: 'orange', width: 6 });
          // φ^{-1}(ω) as intervals
          let runs = [], cur = null; ts.forEach((t) => { const ins = phi(t) >= a && phi(t) <= b; if (ins && !cur) cur = [t, t]; if (ins) cur[1] = t; if (!ins && cur) { runs.push(cur); cur = null; } }); if (cur) runs.push(cur);
          runs.forEach(([p, q]) => { L.vband(p, q, { color: 'orange', alpha: 0.18 }); L.line(p, -1.25, q, -1.25, { color: 'orange', width: 5 }); });
          L.fn(phi, { color: 'green', width: 2.4 });
          L.fn(x, { color: 'blue', width: 1.6, alpha: 0.7 });
          L.fn((t) => (phi(t) >= a && phi(t) <= b ? x(t) : NaN), { color: 'purple', width: 3 });
          // E_{x,x}: histogram of φ weighted by |x|²
          const nb = 70, lo = -1.3, hi = 1.6, w = (hi - lo) / nb, hist = new Float64Array(nb);
          ts.forEach((t) => { const k = Math.floor((phi(t) - lo) / w); if (k >= 0 && k < nb) hist[k] += x(t) ** 2 / n; });
          R.setView([0, Math.max(...hist) / w * 1.1], [lo, hi]);
          for (let k = 0; k < nb; k++) { const y0 = lo + k * w, inn = y0 + w / 2 >= a && y0 + w / 2 <= b; R.rect(0, y0, hist[k] / w, y0 + w, { fill: inn ? 'orange' : 'blue', fillAlpha: inn ? 0.8 : 0.45, stroke: false }); }
          const mass = ts.reduce((s, t) => s + (phi(t) >= a && phi(t) <= b ? x(t) ** 2 : 0), 0) / n, tot = ts.reduce((s, t) => s + x(t) ** 2, 0) / n;
          st = { mass, tot, runs: runs.length };
        });
        v.readout(() => `$\\varphi^{-1}(\\omega)$ has ${st.runs} piece(s). $\\|E(\\omega)x\\|^2 = E_{x,x}(\\omega) = ${v.fix(st.mass, 4)}$ out of $\\|x\\|^2 = E_{x,x}(\\R) = ${v.fix(st.tot, 4)}$.`);
      },
    },
    {
      num: '12.21',
      kind: 'Theorem',
      name: 'Integration against a resolution of the identity',
      statement: String.raw`Let $E$ be a resolution of the identity on $\mathfrak M$ and $L^\infty(E)$ the algebra of bounded measurable functions modulo $E$-null sets, with the essential sup norm. There is a unique isometric $*$-isomorphism $\Psi$ of $L^\infty(E)$ onto a closed normal subalgebra of $B(H)$ with
$$(\Psi(f)x,y)=\int_\Omega f\,dE_{x,y}\qquad(x,y\in H),$$
written $\Psi(f)=\int f\,dE$. Moreover $\norm{\Psi(f)x}^2=\int|f|^2\,dE_{x,x}$, and an operator commutes with every $E(\omega)$ iff it commutes with every $\Psi(f)$.`,
      idea: String.raw`Define $\Psi$ on simple functions by $\Psi(\sum\alpha_i1_{\omega_i})=\sum\alpha_iE(\omega_i)$ with disjoint $\omega_i$: it is multiplicative by 12.17(c), and $\norm{\Psi(s)x}^2=\sum|\alpha_i|^2\norm{E(\omega_i)x}^2$ shows $\norm{\Psi(s)}=\norm s_\infty$ (essential sup: sets of $E$-measure zero do not count). Extend by uniform density of simple functions.`,
      caption: String.raw`The same multiplication picture: $T=M_\varphi$ on $L^2[0,1]$ with $\varphi(t)=t^2+0.3t$ strictly increasing, so single points are $E$-null. Shape $f$ on the spectrum $[0,1.3]$ with the handles; a spike at $\lambda_0$ (adjustable) changes $f$ only on a null set. $\Psi(f)=M_{f\circ\varphi}$, and the readout compares $\norm{\Psi(f)}$ with $\sup|f|$ and with the essential sup, and checks $\norm{\Psi(f)x}^2=\int|f|^2dE_{x,x}$ for $x=1$.`,
      deps: ['fa-12.17', 'fa-11.18'],
      tags: ['spectral theory', 'functional calculus'],
      verify: true,
      viz(v) {
        const M = v.M;
        const spS = v.slider('spike height at $\\lambda_0$', 0, 3, 2.2, { step: 0.01 });
        const L = v.stage({ x: [0, 1.3], y: [-1.5, 3.2], height: 300, axes: true, xlabel: 'λ', title: '$f$ on $\\sigma(T)=[0,1.3]$ (drag the knots)' });
        const R = v.stage({ x: [0, 1], y: [-1.5, 3.2], height: 300, axes: true, xlabel: 't', title: '$\\Psi(f)=$ multiplication by $f\\circ\\varphi$ on $L^2[0,1]$' });
        const K = [0, 0.33, 0.66, 1, 1.3].map((x, i) => L.handle(x, [0.6, 1.2, -0.8, 0.4, 1.0][i], { color: 'blue', r: 5.5, constrain: (a, b) => [x, M.clamp(b, -1.4, 2.6)] }));
        const hs = L.handle(0.8, -1.35, { color: 'red', r: 5, label: 'λ₀', labelPos: 'e', constrain: (a) => [M.clamp(a, 0.05, 1.25), -1.35] });
        const phi = (t) => t * t + 0.3 * t;
        let st = {};
        v.legend([['blue', '$f$'], ['red', 'spike on the null set $\\{\\lambda_0\\}$'], ['purple', '$f\\circ\\varphi$']]);
        v.render(() => {
          const knots = K.map((h) => [h.x, h.y]), l0 = hs.x, sp = spS.value;
          const fb = (l) => { for (let i = 0; i + 1 < knots.length; i++) if (l <= knots[i + 1][0]) { const u = (l - knots[i][0]) / (knots[i + 1][0] - knots[i][0]); return knots[i][1] * (1 - u) + knots[i + 1][1] * u; } return knots[knots.length - 1][1]; };
          L.fn(fb, { color: 'blue', width: 2.4 });
          L.line(l0, fb(l0), l0, fb(l0) + sp, { color: 'red', width: 2 }); L.dot(l0, fb(l0) + sp, { color: 'red', r: 4.5 });
          R.fn((t) => fb(phi(t)), { color: 'purple', width: 2.4, n: 1500 });
          const ts = M.linspace(0, 1, 20001);
          const ess = Math.max(...ts.map((t) => Math.abs(fb(phi(t))))), supAll = Math.max(ess, Math.abs(fb(l0) + sp));
          const lhs = ts.reduce((s, t) => s + fb(phi(t)) ** 2, 0) / ts.length;
          // ∫|f|² dE_{1,1}: E_{1,1} is the image of dt under φ, density 1/φ'(φ^{-1}(λ))
          const inv = (l) => (-0.3 + Math.sqrt(0.09 + 4 * l)) / 2;
          const rhs = M.integrate((l) => fb(l) ** 2 / (2 * inv(l) + 0.3), 0, 1.3, 4000);
          st = { ess, supAll, lhs, rhs };
        });
        v.readout(() => `$\\|\\Psi(f)\\| = \\operatorname{ess\\,sup}|f| = ${v.fix(st.ess, 3)}$, while $\\sup|f| = ${v.fix(st.supAll, 3)}$ counts the spike on a null set. $\\|\\Psi(f)1\\|^2 = ${v.fix(st.lhs, 4)}$, $\\int|f|^2dE_{1,1} = ${v.fix(st.rhs, 4)}$.`);
      },
    },
    {
      num: '12.22',
      kind: 'Theorem',
      name: 'Commutative *-algebras of operators are integrals against one E',
      statement: String.raw`Let $\mathscr A$ be a closed normal subalgebra of $B(H)$ (commutative and closed under the involution) containing $I$, with maximal ideal space $\Delta$. There is a unique resolution of the identity $E$ on the Borel sets of $\Delta$ such that
$$T=\int_\Delta\hat T\,dE\qquad(T\in\mathscr A).$$
Moreover $E(\omega)\ne0$ for every nonempty open $\omega\subset\Delta$, and an operator commutes with every $T\in\mathscr A$ iff it commutes with every $E(\omega)$.`,
      idea: String.raw`By Gelfand–Naimark (11.18) $T\mapsto\hat T$ is an isometric $*$-isomorphism $\mathscr A\to C(\Delta)$. For fixed $x,y$, $\hat T\mapsto(Tx,y)$ is a bounded functional on $C(\Delta)$, so the Riesz representation theorem gives regular measures $\mu_{x,y}$ with $(Tx,y)=\int\hat T\,d\mu_{x,y}$. For Borel $f$, $(x,y)\mapsto\int f\,d\mu_{x,y}$ is a bounded sesquilinear form, hence (12.8) $(\Phi(f)x,y)$; $E(\omega)=\Phi(1_\omega)$ is the resolution.`,
      caption: String.raw`A two-generator example: commuting self-adjoint $A,B$ on $\R^3$, both diagonal in one orthonormal basis (drag in the 3D panel to rotate it). $\Delta$ is the joint spectrum $\{(a_k,b_k)\}$ (left; set the eigenvalues with the sliders), and $E(\{k\})$ is the projection onto the $k$-th basis vector (arrows). Then $A=\sum a_kE_k$ and $B=\sum b_kE_k$; the readout checks that $A$ and $B$ commute and that the $E_k$ are orthogonal projections summing to $I$.`,
      deps: ['fa-12.21', 'fa-11.18', 'rca-6.19', 'fa-12.8'],
      tags: ['spectral theory', 'commutative algebras of operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = [1.2, -0.4, 0.5].map((x, k) => v.slider(`$a_${k + 1}$`, -1.5, 1.5, x, { step: 0.01 }));
        const bS = [0.3, 1.0, -0.9].map((x, k) => v.slider(`$b_${k + 1}$`, -1.5, 1.5, x, { step: 0.01 }));
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 320, axes: true, xlabel: 'a', ylabel: 'b', title: 'joint spectrum $\\Delta=\\{(a_k,b_k)\\}$' });
        const S = v.stage3d({ range: 1.5, height: 320, yaw: 0.7, pitch: 0.4 });
        const Q = rot3(0.4, 0.9, 0.3), cols = [0, 1, 2].map((j) => Q.map((r) => r[j]));
        const COL = ['blue', 'orange', 'green'];
        let st = {};
        v.render(() => {
          const a = aS.map((s) => s.value), b = bS.map((s) => s.value);
          a.forEach((ak, k) => L.dot(ak, b[k], { color: COL[k], r: 6, label: `${k + 1}`, labelPos: 'ne', math: false }));
          cols.forEach((e, k) => { S.arrow([0, 0, 0], e, { color: COL[k], width: 3 }); S.text(`E${'₁₂₃'[k]}`, e.map((x) => 1.18 * x), { color: COL[k] }); });
          // A = Q diag(a) Qᵀ, B = Q diag(b) Qᵀ; E_k = e_k e_kᵀ
          const P = cols.map((e) => e.map((x) => e.map((y) => x * y)));
          const A = [0, 1, 2].map((i) => [0, 1, 2].map((j) => a.reduce((s, ak, k) => s + ak * P[k][i][j], 0)));
          const B = [0, 1, 2].map((i) => [0, 1, 2].map((j) => b.reduce((s, bk, k) => s + bk * P[k][i][j], 0)));
          const AB = [0, 1, 2].map((i) => [0, 1, 2].map((j) => [0, 1, 2].reduce((s, k) => s + A[i][k] * B[k][j] - B[i][k] * A[k][j], 0)));
          const comm = Math.sqrt(AB.flat().reduce((s, x) => s + x * x, 0));
          const sumI = Math.sqrt([0, 1, 2].reduce((s, i) => s + [0, 1, 2].reduce((t, j) => t + ((P[0][i][j] + P[1][i][j] + P[2][i][j]) - (i === j ? 1 : 0)) ** 2, 0), 0));
          const orth = Math.max(Math.abs(dot3(cols[0], cols[1])), Math.abs(dot3(cols[0], cols[2])), Math.abs(dot3(cols[1], cols[2])));
          st = { comm, sumI, orth };
        });
        v.readout(() => `$\\|AB-BA\\| = ${v.sci(st.comm + 1e-17, 1)}$ (a commutative $*$-algebra); $\\;\\|E_1+E_2+E_3-I\\| = ${v.sci(st.sumI + 1e-17, 1)}$; $E_jE_k=0$ for $j\\ne k$ up to $${v.sci(st.orth + 1e-17, 1)}$. Each operator in the algebra is $\\sum_k\\hat T(k)E_k$.`);
      },
    },
    {
      num: '12.23',
      kind: 'Theorem',
      name: 'The spectral theorem for normal operators',
      statement: String.raw`If $T\in B(H)$ is normal, there is a unique resolution of the identity $E$ on the Borel subsets of $\sigma(T)$ such that
$$T=\int_{\sigma(T)}\lambda\,dE(\lambda).$$
Furthermore, every $S\in B(H)$ that commutes with $T$ commutes with every $E(\omega)$.`,
      idea: String.raw`Apply 12.22 to the closed normal algebra generated by $I,T,T^*$, whose maximal ideal space is homeomorphic to $\sigma(T)$ via $h\mapsto h(T)$ (as in 11.10); then $\hat T$ becomes the identity function $\lambda$. If $ST=TS$, then $ST^*=T^*S$ by Fuglede (12.16), so $S$ commutes with the whole algebra and hence with $E$ by 12.22.`,
      caption: String.raw`A normal $3\times3$ operator $T=\sum\lambda_kP_k$ (drag the eigenvalues). For a unit vector $x$ (set its components in the eigenbasis with the sliders), the spectral measure $E_{x,x}$ puts mass $|\langle x,u_k\rangle|^2$ at $\lambda_k$ (dot areas). Then $(Tx,x)=\int\lambda\,dE_{x,x}$ is the **centre of mass** (purple) — it always lies in the convex hull of $\sigma(T)$, the numerical range of a normal operator — and $\norm{Tx}^2=\int|\lambda|^2dE_{x,x}$.`,
      deps: ['fa-12.22', 'fa-12.16', 'fa-11.10'],
      see: ['fa-13.30'],
      tags: ['spectral theorem', 'normal operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const alS = v.slider('$x$: angle $\\alpha$', 0, 90, 35, { step: 0.5 });
        const beS = v.slider('$x$: angle $\\beta$', 0, 90, 30, { step: 0.5 });
        const S = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 360, axes: true, title: '$\\sigma(T)$, the masses of $E_{x,x}$ and their centre $(Tx,x)$' });
        const H = [[1.2, 0.6], [-0.9, 0.7], [0.2, -1.1]].map(([a, b], k) => S.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        let st = {};
        v.legend([['red', 'eigenvalues'], ['orange', 'masses $E_{x,x}(\\{\\lambda_k\\})$', { area: true }], ['purple', '$(Tx,x)$'], ['muted', 'convex hull of $\\sigma(T)$', { dash: true }]]);
        v.render(() => {
          const al = alS.value * Math.PI / 180, be = beS.value * Math.PI / 180;
          const c = [Math.cos(al) * Math.cos(be), Math.sin(al) * Math.cos(be), Math.sin(be)], w = c.map((x) => x * x);
          const l = H.map((h) => [h.x, h.y]);
          S.poly(hull(l), { fill: 'muted', fillAlpha: 0.08, color: 'muted', width: 1.4, dash: [5, 4] });
          l.forEach((z, k) => S.circle(z[0], z[1], 0.05 + 0.35 * Math.sqrt(w[k]), { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.4 }));
          const cm = l.reduce((s, z, k) => cadd(s, [z[0] * w[k], z[1] * w[k]]), [0, 0]);
          l.forEach((z) => S.line(z[0], z[1], cm[0], cm[1], { color: 'faint', width: 1 }));
          S.dot(cm[0], cm[1], { color: 'purple', r: 6, label: '(Tx,x)', labelPos: 'se', math: false });
          const nTx = Math.sqrt(l.reduce((s, z, k) => s + (z[0] * z[0] + z[1] * z[1]) * w[k], 0));
          st = { w, cm, nTx };
        });
        v.readout(() => `Masses $(${st.w.map((x) => v.fix(x, 3)).join(',\\,')})$, total $1$. $(Tx,x) = ${v.fix(st.cm[0], 3)}${st.cm[1] < 0 ? '-' : '+'}${v.fix(Math.abs(st.cm[1]), 3)}i$, $\\;\\|Tx\\| = \\big(\\int|\\lambda|^2dE_{x,x}\\big)^{1/2} = ${v.fix(st.nTx, 3)}$.`);
      },
    },
    {
      num: '12.24',
      kind: 'Theorem',
      name: 'Borel functional calculus for normal operators',
      statement: String.raw`Let $T$ be normal with spectral decomposition $E$, and for bounded Borel functions $f$ on $\sigma(T)$ put $f(T)=\int f\,dE$. Then $f\mapsto f(T)$ is a $*$-homomorphism with $\norm{f(T)}\le\sup|f|$ (equality for continuous $f$), it agrees with the holomorphic calculus of 10.26 when $f$ is holomorphic near $\sigma(T)$, every $f(T)$ is normal, and $f(T)$ commutes with every operator that commutes with $T$. In particular $E(\omega)=1_\omega(T)$.`,
      idea: String.raw`Everything is inherited from 12.21. Agreement with the holomorphic calculus: both are continuous homomorphisms that send $\lambda\mapsto T$ and $1\mapsto I$, and rational functions with poles off $\sigma(T)$ are dense (Runge).`,
      caption: String.raw`Functions of a normal $3\times3$ matrix that are **not** holomorphic — the Borel calculus allows them. Drag the eigenvalues. $f=1_{\{\operatorname{Re}\lambda>c\}}$ (drag the line) gives the spectral projection $E(\{\operatorname{Re}\lambda>c\})$, a projection commuting with $T$ of rank equal to the number of eigenvalues to the right; $f=|\lambda|$ gives $|T|=(T^*T)^{1/2}$; $f=\bar\lambda$ gives $T^*$. The readout checks $f(T)^2=f(T)$, $f(T)T=Tf(T)$, $\norm{f(T)}=\max_{\sigma}|f|$, as appropriate.`,
      deps: ['fa-12.23', 'fa-12.21'],
      tags: ['spectral theorem', 'functional calculus'],
      verify: true,
      viz(v) {
        const M = v.M;
        const fS = v.select('$f=$', [{ value: 'ind', label: '$1_{\\{\\operatorname{Re}\\lambda>c\\}}$' }, { value: 'abs', label: '$|\\lambda|$' }, { value: 'conj', label: '$\\bar\\lambda$' }], 'ind');
        const S = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 360, axes: true, title: '$\\sigma(T)$ and $f$' });
        const H = [[1.0, 0.6], [-0.9, 0.5], [0.4, -1.0]].map(([a, b], k) => S.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        const hc = S.handle(0.1, 1.45, { color: 'purple', r: 6, label: 'c', labelPos: 'e', constrain: (x) => [M.clamp(x, -1.9, 1.9), 1.45] });
        // a fixed unitary U (complex), T = U diag(λ) U*
        const th = 0.7, ph = 0.4;
        const U = [[[Math.cos(th), 0], [0, Math.sin(th)], [0, 0]], [[0, Math.sin(th)], [Math.cos(th), 0], [0, 0]], [[0, 0], [0, 0], [Math.cos(ph), Math.sin(ph)]]];
        const cmm = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
        const cstar = (A) => A[0].map((_, j) => A.map((row) => [row[j][0], -row[j][1]]));
        const diag = (d) => [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? d[i] : [0, 0])));
        const fro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
        const msub = (A, B) => A.map((row, i) => row.map((a, j) => [a[0] - B[i][j][0], a[1] - B[i][j][1]]));
        let st = {};
        v.render(() => {
          const key = fS.value, l = H.map((h) => [h.x, h.y]), c = hc.x;
          hc.visible = key === 'ind';
          const f = key === 'ind' ? (z) => [z[0] > c ? 1 : 0, 0] : key === 'abs' ? (z) => [cabs(z), 0] : (z) => [z[0], -z[1]];
          if (key === 'ind') { S.vband(c, 10, { color: 'green', alpha: 0.1 }); S.vline(c, { color: 'purple', width: 1.6, dash: [5, 4] }); }
          l.forEach((z) => { const fz = f(z); S.text(`f = ${v.fmt(fz[0], 2)}${Math.abs(fz[1]) > 1e-9 ? (fz[1] < 0 ? ' − ' : ' + ') + v.fmt(Math.abs(fz[1]), 2) + 'i' : ''}`, z[0], z[1], { dy: 18, color: 'ink', size: 11, align: 'center' }); });
          const T = cmm(cmm(U, diag(l)), cstar(U)), F = cmm(cmm(U, diag(l.map(f))), cstar(U));
          const idem = fro(msub(cmm(F, F), F)), comm = fro(msub(cmm(F, T), cmm(T, F)));
          const adj = fro(msub(F, cstar(T))), absq = fro(msub(cmm(F, F), cmm(cstar(T), T)));
          st = { key, idem, comm, adj, absq, rank: l.filter((z) => z[0] > c).length };
        });
        v.readout(() => {
          const s = st;
          if (s.key === 'ind') return `$E=1_{\\{\\operatorname{Re}\\lambda>c\\}}(T)$: $\\|E^2-E\\| = ${v.sci(s.idem + 1e-17, 1)}$, $\\;\\|ET-TE\\| = ${v.sci(s.comm + 1e-17, 1)}$, rank $${s.rank}$ — a spectral projection that no holomorphic function of $T$ could produce when eigenvalues lie on both sides.`;
          if (s.key === 'abs') return `$f(T)=|T|$: $\\;\\|f(T)^2-T^*T\\| = ${v.sci(s.absq + 1e-17, 1)}$, $\\;\\|f(T)T-Tf(T)\\| = ${v.sci(s.comm + 1e-17, 1)}$.`;
          return `$f(\\lambda)=\\bar\\lambda$ gives $f(T)=T^*$: $\\;\\|f(T)-T^*\\| = ${v.sci(s.adj + 1e-17, 1)}$.`;
        });
      },
    },
    {
      num: '12.26',
      kind: 'Theorem',
      name: 'Eigenvalues of normal operators are the atoms of E',
      statement: String.raw`Let $T$ be normal with spectral decomposition $E$, and $\lambda\in\C$. Then
(a) $\mathscr N(T-\lambda I)=\mathscr R(E(\{\lambda\}))$, so $\lambda$ is an eigenvalue iff $E(\{\lambda\})\ne0$;
(b) $\lambda\in\sigma(T)$ iff $E(\omega)\ne0$ for every open $\omega\ni\lambda$;
(c) every isolated point of $\sigma(T)$ is an eigenvalue;
(d) if $\sigma(T)$ is countable, $H$ has an orthonormal basis of eigenvectors of $T$.`,
      idea: String.raw`(a) $\norm{(T-\lambda I)x}^2=\int|\mu-\lambda|^2\,dE_{x,x}(\mu)$ vanishes iff $E_{x,x}$ is concentrated at $\lambda$, i.e. $E(\{\lambda\})x=x$. (b) If $E(\omega)=0$ for a disc $\omega$ around $\lambda$, then $f(\mu)=1/(\mu-\lambda)$ is bounded $E$-a.e. and $f(T)$ inverts $T-\lambda I$; conversely 12.22. (c) follows from (b) with $\omega=\{\lambda\}$ open in $\sigma(T)$. (d): the ranges of the $E(\{\lambda\})$ are mutually orthogonal and add up to $E(\sigma(T))=I$.`,
      caption: String.raw`$T=M_\varphi$ on $L^2[0,1]$, with $\varphi$ (green) flat on a middle interval at height $c$ and increasing elsewhere, with a gap. $\sigma(T)$ is the range of $\varphi$ (blue on the $\lambda$-axis). Drag $\lambda$ along the axis: $E(\{\lambda\})$ multiplies by $1_{\varphi^{-1}(\lambda)}$, which is nonzero only at $\lambda=c$ — the only eigenvalue, with eigenfunctions supported on the flat piece (purple). The rest of the spectrum is continuous: $\lambda$ there is in $\sigma(T)$ but $\mathscr N(T-\lambda I)=\{0\}$. The value $c$ is an isolated point of $\sigma(T)$ when the flat piece sits inside the gap.`,
      deps: ['fa-12.23', 'fa-12.21'],
      tags: ['spectral theorem', 'eigenvalues'],
      verify: true,
      viz(v) {
        const M = v.M;
        const cS = v.slider('height $c$ of the flat piece', 0, 2, 1.1, { step: 0.01 });
        const S = v.stage({ x: [0, 1], y: [-0.2, 2.2], height: 360, weight: 1.6, axes: true, xlabel: 't', title: '$\\varphi$ and $\\varphi^{-1}(\\lambda)$' });
        const A = v.stage({ x: [-0.5, 0.5], y: [-0.2, 2.2], height: 360, minWidth: 140, weight: 0.4, axes: false, ticks: false, title: '$\\sigma(T)$' });
        const hl = A.handle(0, 0.5, { color: 'red', label: 'λ', labelPos: 'e', constrain: (x, y) => [0, M.clamp(y, -0.15, 2.15)] });
        let st = {};
        v.legend([['green', '$\\varphi$'], ['blue', '$\\sigma(T)=$ range of $\\varphi$'], ['purple', 'eigenfunction support $\\varphi^{-1}(c)$']]);
        v.render(() => {
          const c = cS.value;
          const phi = (t) => (t < 0.35 ? 0.8 * t / 0.35 : t < 0.6 ? c : 1.35 + 0.8 * (t - 0.6) / 0.4);
          S.fn(phi, { color: 'green', width: 2.6, n: 2000 });
          S.vband(0.35, 0.6, { color: 'purple', alpha: 0.08 });
          // spectrum: [0, 0.8] ∪ {c} ∪ [1.35, 2.15]
          const segs = [[0, 0.8], [1.35, 2.15]];
          segs.forEach(([a, b]) => A.line(0, a, 0, b, { color: 'blue', width: 7 }));
          A.dot(0, c, { color: 'blue', r: 6 });
          const lam = hl.y;
          S.hline(lam, { color: 'red', width: 1.4, dash: [5, 4] });
          const onFlat = Math.abs(lam - c) < 0.012;
          const inSpec = segs.some(([a, b]) => lam >= a - 1e-9 && lam <= b + 1e-9) || onFlat;
          // the preimage
          const pre = [];
          for (let i = 0; i <= 2000; i++) { const t = i / 2000; if (Math.abs(phi(t) - lam) < 0.004) pre.push(t); }
          if (onFlat) S.line(0.35, 0, 0.6, 0, { color: 'purple', width: 7 });
          else pre.forEach((t) => S.dot(t, 0, { color: 'red', r: 4 }));
          const isolated = !segs.some(([a, b]) => c >= a - 0.02 && c <= b + 0.02);
          st = { onFlat, inSpec, isolated, c };
        });
        v.readout(() => {
          const s = st;
          if (s.onFlat) return `$\\lambda=c$: $\\varphi^{-1}(c)=[0.35,0.6]$ has positive measure, so $E(\\{c\\})\\ne0$ and $c$ is an eigenvalue (eigenfunctions: anything supported there)` + (s.isolated ? ' — and it is an isolated point of $\\sigma(T)$.' : '.');
          return s.inSpec ? '$\\lambda\\in\\sigma(T)$, but $\\varphi^{-1}(\\lambda)$ is a single point (red), a null set: $E(\\{\\lambda\\})=0$, no eigenvector — continuous spectrum.' : '$\\lambda\\notin\\sigma(T)$: $\\varphi-\\lambda$ is bounded away from $0$, and $T-\\lambda I$ is invertible.';
        });
      },
    },
    {
      num: '12.30',
      kind: 'Theorem',
      name: 'Compact normal operators are diagonal',
      statement: String.raw`If $T\in B(H)$ is compact and normal, then $\sigma(T)\setminus\{0\}$ consists of eigenvalues $\lambda_1,\lambda_2,\dots$ (finitely many, or a sequence tending to $0$), each with a finite-dimensional eigenspace, and
$$T=\sum_k\lambda_kP_k$$
with $P_k$ the orthogonal projections onto the eigenspaces, the series converging in operator norm. $H$ has an orthonormal basis of eigenvectors of $T$ (allowing the eigenvalue $0$).`,
      idea: String.raw`By the Riesz–Schauder theory (4.25) every $\lambda\ne0$ in $\sigma(T)$ is an isolated eigenvalue of finite multiplicity, so $\sigma(T)$ is countable and 12.26(d) applies, with $P_k=E(\{\lambda_k\})$. Norm convergence: $\norm{T-\sum_{k\le n}\lambda_kP_k}=\sup_{k>n}|\lambda_k|\to0$, since the remainder is normal with spectrum $\{\lambda_k:k>n\}\cup\{0\}$ and its norm is its spectral radius (12.13).`,
      caption: String.raw`A compact normal operator on $\ell^2$: diagonal with eigenvalues $\lambda_k=r^ke^{ik\theta}$ spiralling into $0$ (the only possible accumulation point; $0\in\sigma(T)$ but is not an eigenvalue). Choose $r$, $\theta$ and the truncation $n$. Right: $\norm{T-T_n}=\sup_{k>n}|\lambda_k|$ for the finite-rank truncations $T_n=\sum_{k\le n}\lambda_kP_k$ (log scale) — they converge to $T$ in norm. At $r=1$ the operator is no longer compact (unitary), and the truncations stop converging in norm.`,
      deps: ['fa-12.26', 'fa-4.25', 'fa-12.13'],
      tags: ['compact operators', 'spectral theorem', 'normal operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const rS = v.slider('$r$', 0.5, 1, 0.82, { step: 0.005 });
        const tS = v.slider('$\\theta$', 0, 3.14, 0.9, { step: 0.01 });
        const nS = v.slider('truncation $n$', 0, 40, 6, { int: true });
        const L = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 330, axes: true, title: 'eigenvalues $\\lambda_k=r^ke^{ik\\theta}$' });
        const R = v.stage({ x: [0, 40], y: [-4, 0.3], height: 330, axes: 'box', xlabel: 'n', title: '$\\|T-T_n\\|$ (log scale)' });
        let st = {};
        v.legend([['blue', 'kept in $T_n$', { dot: true }], ['muted', 'remainder', { dot: true }]]);
        v.render(() => {
          const r = rS.value, th = tS.value, n = nS.value;
          const lam = M.range(120).map((k) => [Math.pow(r, k + 1) * Math.cos((k + 1) * th), Math.pow(r, k + 1) * Math.sin((k + 1) * th)]);
          L.path(lam, { color: 'faint', width: 1 });
          lam.forEach((z, k) => L.dot(z[0], z[1], { color: k < n ? 'blue' : 'muted', r: k < n ? 4 : 2.5 }));
          L.dot(0, 0, { color: 'red', r: 4, label: '0', labelPos: 'sw' });
          const tail = (m) => Math.max(...lam.slice(m).map(cabs));
          const pts = M.range(41).map((m) => [m, Math.log10(tail(m) + 1e-300)]);
          R.setTicks(null, [0, -1, -2, -3, -4].map((k) => [k, k === 0 ? '1' : `10⁻${'¹²³⁴'[-k - 1]}`]));
          R.path(pts, { color: 'blue', width: 2.2 });
          R.dot(n, Math.log10(tail(n) + 1e-300), { color: 'blue', r: 5.5 });
          st = { err: tail(n), r };
        });
        v.readout(() => `$\\|T-T_{${nS.value}}\\| = \\sup_{k>${nS.value}}|\\lambda_k| = ${v.fix(st.err, 4)}$` + (st.r < 1 ? ' — tends to $0$: $T$ is a norm limit of finite-rank operators.' : ' — does not tend to $0$: $|\\lambda_k|=1$, $T$ is not compact.'));
      },
    },
  ],
};
