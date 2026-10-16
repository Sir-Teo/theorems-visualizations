// Ordinary Differential Equations & Dynamical Systems — Chapter 3: Linear systems and the matrix exponential
import { flow, mmul, madd, mscale, mvec, eye, fro, opnorm, expm, expmPartial, eig2, classify2, orbitLin, matHandles } from './ch03.shared.js';

/** Largest finite prefix of a polyline (stops when a coordinate exceeds cap). */
function trim(pts, cap = 1e5) { const o = []; for (const p of pts) { if (!isFinite(p[0]) || !isFinite(p[1]) || Math.abs(p[0]) > cap || Math.abs(p[1]) > cap) break; o.push(p); } return o; }
const orb = (A, p, T, n) => trim(orbitLin(A, p, T, n).map((q) => q[1]));
const ring = (n, r, ph = 0.3) => Array.from({ length: n }, (_, i) => [r * Math.cos(ph + (2 * Math.PI * i) / n), r * Math.sin(ph + (2 * Math.PI * i) / n)]);

export default {
  collection: 'ode',
  chapter: 3,
  title: 'Linear systems and the matrix exponential',
  summary: String.raw`Linear systems are the one class of differential equations we can solve completely: the matrix exponential gives the flow of $\dot x=Ax$, and its behaviour is dictated by the eigenvalues and the Jordan structure of $A$. In the plane, the trace and determinant sort every system into saddles, nodes, spirals and centres. Time-dependent and forced systems are handled by fundamental matrices and variation of constants, periodic coefficients by Floquet theory, and the damped, driven oscillator is the model that ties it all together.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Linear systems of ODEs',
      statement: String.raw`A *linear system* is an equation $\dot x=A(t)x+g(t)$ for $x(t)\in\R^n$, with $A$ an $n\times n$ matrix function and $g$ a vector function, both continuous. It is *homogeneous* when $g\equiv0$ and *autonomous* (constant coefficients) when $A$ does not depend on $t$. For the homogeneous system the map $x_0\mapsto x(t)$ is linear in the initial value: if $\varphi,\psi$ are solutions and $\alpha,\beta\in\R$, then $\alpha\varphi+\beta\psi$ is a solution (superposition), so the solutions form a vector space. The right-hand side is globally Lipschitz in $x$ on every bounded time interval, so solutions exist and are unique for all time.`,
      idea: String.raw`Differentiation and matrix multiplication are linear, so $\frac{d}{dt}(\alpha\varphi+\beta\psi)=\alpha A\varphi+\beta A\psi=A(\alpha\varphi+\beta\psi)$. Since $|A(t)x-A(t)y|\le\|A(t)\|\,|x-y|$ the field is Lipschitz with constant $\max\|A\|$ on any compact time interval; Picard–Lindelöf (2.4) gives uniqueness and the linear growth bound $|f|\le\|A\||x|$ rules out blow-up, so solutions are global (this is the content of 2.12). Everything later in the chapter exploits the vector-space structure.`,
      caption: String.raw`Drag the two arrows $Ae_1$ and $Ae_2$ (the columns of $A$) to edit the matrix; the arrows of the field $x\mapsto Ax$ follow. Drag the starting points $p$ and $q$. The green curve is the solution from $p+q$ and the dashed gold curve is the sum of the solutions from $p$ and $q$: they coincide. Turn on the nonlinear term and superposition fails, with the failure measured below.`,
      deps: ['ode-1.1', 'pma-9.4'],
      refs: ['Teschl §3.2', 'Hirsch–Smale–Devaney ch. 2'],
      tags: ['linear systems', 'superposition'],
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x₁', ylabel: 'x₂', title: 'the field $Ax$ and superposition of solutions' });
        const MH = matHandles(s, [[-0.3, -1], [1, -0.2]], { range: 2.1, l1: '$Ae_1$', l2: '$Ae_2$' });
        const P = s.handle(1.1, 0.3, { color: 'gold', label: '$p$', labelPos: 'se', constrain: { x: [-2.8, 2.8], y: [-2.0, 2.0] } });
        const Q = s.handle(-0.3, 1.2, { color: 'purple', label: '$q$', labelPos: 'nw', constrain: { x: [-2.8, 2.8], y: [-2.0, 2.0] } });
        const T = v.slider('time span $T$', 0.5, 8, 4, { step: 0.05 });
        const nl = v.toggle('add a nonlinear term $\\varepsilon(x_1x_2,\\,-x_1^2)$', false);
        v.legend([['gold', 'solution from $p$'], ['purple', 'solution from $q$'], ['green', 'solution from $p+q$'], ['orange', '$\\varphi_p+\\varphi_q$ (sum of the two)', { dash: true }]]);
        let info = null;
        v.render(() => {
          const A = MH.A(), eps = nl.value ? 0.35 : 0;
          const F = (t, [x, y]) => { const u = mvec(A, [x, y]); return [u[0] + eps * x * y, u[1] - eps * x * x]; };
          s.field((x, y) => mvec(A, [x, y]), { spacing: 38, color: 'muted', alpha: 0.5 });
          const n = 400, pp = trim(flow(F, 0, [P.x, P.y], T.value, n).map(([t, y]) => y)), qq = trim(flow(F, 0, [Q.x, Q.y], T.value, n).map(([t, y]) => y));
          const ss = trim(flow(F, 0, [P.x + Q.x, P.y + Q.y], T.value, n).map(([t, y]) => y));
          const m = Math.min(pp.length, qq.length), sum = [];
          for (let i = 0; i < m; i++) sum.push([pp[i][0] + qq[i][0], pp[i][1] + qq[i][1]]);
          s.clip(() => {
            s.path(pp, { color: 'gold', width: 2.4 }); s.path(qq, { color: 'purple', width: 2.4 });
            s.path(ss, { color: 'green', width: 3 }); s.path(sum, { color: 'orange', width: 2.2, dash: [7, 5] });
          });
          s.arrow(0, 0, P.x, P.y, { color: 'gold', width: 1.2, alpha: 0.5 }); s.arrow(0, 0, Q.x, Q.y, { color: 'purple', width: 1.2, alpha: 0.5 });
          s.dot(P.x + Q.x, P.y + Q.y, { r: 4, color: 'green', label: '$p+q$', labelPos: 'ne' });
          MH.draw();
          let dev = 0, sc = 1; const k = Math.min(m, ss.length);
          for (let i = 0; i < k; i++) { dev = Math.max(dev, Math.hypot(ss[i][0] - sum[i][0], ss[i][1] - sum[i][1])); sc = Math.max(sc, Math.hypot(ss[i][0], ss[i][1])); }
          info = { dev, sc, A, eps, full: k === n + 1 && ss.length === n + 1, tr: A[0][0] + A[1][1], det: A[0][0] * A[1][1] - A[0][1] * A[1][0] };
        });
        v.readout(() => {
          if (!info) return '';
          const { dev, sc, A, eps, full } = info;
          const M = A.map((r) => r.map((x) => v.fix(x, 2)));
          let r = `$A=\\begin{pmatrix}${M[0][0]}&${M[0][1]}\\\\${M[1][0]}&${M[1][1]}\\end{pmatrix}$, trace $${v.fix(info.tr, 2)}$, determinant $${v.fix(info.det, 2)}$.\n`;
          if (!full) r += 'A solution left the window of numerical validity (it grew beyond $10^5$); shorten $T$.\n';
          r += `Superposition defect $\\max_t|\\varphi_{p+q}-\\varphi_p-\\varphi_q|=${dev < 1e-9 ? '<10^{-9}' : v.sci(dev, 2)}$ (relative to the size of the solution: $${v.sci(dev / sc, 2)}$)${eps === 0 ? ': zero, as for every linear system.' : ': the field is not linear any more, so the sum of two solutions is no longer a solution.'}`;
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'The matrix exponential',
      statement: String.raw`For a real or complex $n\times n$ matrix $A$ the matrix exponential is the sum of the exponential series
$$e^{A}=\sum_{k=0}^{\infty}\frac{A^{k}}{k!}=I+A+\frac{A^2}{2}+\frac{A^3}{6}+\cdots .$$
The series converges absolutely in operator norm for every $A$, with tail $\big\|\sum_{k>m}A^k/k!\big\|\le\frac{\|A\|^{m+1}}{(m+1)!}e^{\|A\|}$. The map $t\mapsto e^{tA}$ is smooth, $e^{0}=I$, $e^{(s+t)A}=e^{sA}e^{tA}$, $e^{tA}$ is always invertible with inverse $e^{-tA}$, and $\det e^{A}=e^{\operatorname{tr}A}$.`,
      idea: String.raw`The space of matrices with the operator norm is a normed algebra with $\|BA\|\le\|B\|\|A\|$ (9.7), so $\|A^k/k!\|\le\|A\|^k/k!$. The scalar series $\sum\|A\|^k/k!$ converges, and the Weierstrass M-test (7.10) turns this into absolute and locally uniform convergence of the matrix series, hence a continuous (indeed smooth, by termwise differentiation) function of $t$. The group law needs the binomial theorem for $(sA+tA)^k$, which is legitimate because $sA$ and $tA$ commute.`,
      caption: String.raw`Drag $Ae_1$ and $Ae_2$ to choose $A$ and slide $t$. The accent parallelogram is the image of the unit square under the partial sum $S_n(tA)=I+tA+\dots+(tA)^n/n!$, the dashed green one is its image under the true $e^{tA}$. Raise $n$: the two merge. The right panel plots the operator-norm error against $n$ together with the tail bound; for large $\|tA\|$ the first terms get *worse* before the factorial wins.`,
      deps: ['ode-3.1', 'pma-9.7', 'pma-7.10'],
      refs: ['Teschl §3.1'],
      tags: ['matrix exponential', 'series'],
      viz(v) {
        const s = v.stage({ x: [-5, 5], y: [-4, 4], equal: true, axes: 'box', gutter: true, height: 400, xlabel: 'x₁', ylabel: 'x₂', title: 'the unit square under $S_n(tA)$ and under $e^{tA}$', weight: 1.3 });
        const NMAX = 30;
        const sd = v.stage({ x: [0, NMAX], y: [1e-16, 1e5], ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'n', ylabel: 'error', title: '$\\|e^{tA}-S_n(tA)\\|$', weight: 1, minWidth: 250 });
        const MH = matHandles(s, [[0.4, -1], [1, 0.3]], { range: 2.4, parallelogram: false, l1: '$Ae_1$', l2: '$Ae_2$' });
        const t = v.slider('$t$', 0, 3, 1.6, { step: 0.02 });
        const n = v.slider('number of terms $n$', 0, NMAX, 3, { int: true });
        v.legend([['accent', 'image under $S_n(tA)$'], ['green', 'image under $e^{tA}$', { dash: true }], ['muted', 'earlier partial sums'], ['red', 'error (operator norm)', { dot: true }], ['orange', 'tail bound $\\frac{\\|tA\\|^{n+1}}{(n+1)!}e^{\\|tA\\|}$', { dash: true }]]);
        const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
        const img = (M) => sq.map((p) => mvec(M, p));
        const grid = (M, col, w, al, dash) => { for (let i = 0; i <= 4; i++) { const a = i / 4; s.path([mvec(M, [a, 0]), mvec(M, [a, 1])], { color: col, width: w, alpha: al, dash }); s.path([mvec(M, [0, a]), mvec(M, [1, a])], { color: col, width: w, alpha: al, dash }); } };
        let info = null;
        v.render(() => {
          const A = MH.A(), tt = t.value, k = n.value, E = expm(A, tt);
          for (let j = Math.max(0, k - 4); j < k; j++) s.poly(img(expmPartial(A, tt, j)), { color: 'muted', width: 1, fill: false, stroke: true, alpha: 0.35 });
          const Sn = expmPartial(A, tt, k);
          s.clip(() => {
            s.poly(img(Sn), { fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 2.6 });
            grid(Sn, 'accent', 1, 0.45);
            s.poly(img(E), { fill: false, color: 'green', width: 2.4, dash: [7, 5] });
          });
          s.arrow(0, 0, MH.h1.x, MH.h1.y, { color: 'accent', width: 2 }); s.arrow(0, 0, MH.h2.x, MH.h2.y, { color: 'orange', width: 2 });
          const nt = fro(mscale(A, tt)), nA = opnorm(mscale(A, tt));
          const errs = [], bnds = []; let fac = 1;
          for (let j = 0; j <= NMAX; j++) {
            errs.push(Math.max(1e-16, opnorm(madd(E, expmPartial(A, tt, j), -1))));
            if (j > 0) fac *= j;
            bnds.push(Math.max(1e-16, (Math.pow(nA, j + 1) / (fac * (j + 1))) * Math.exp(nA)));
          }
          sd.path(bnds.map((b, j) => [j, b]), { color: 'orange', width: 2, dash: [5, 4] });
          sd.path(errs.map((e, j) => [j, e]), { color: 'red', width: 2 });
          errs.forEach((e, j) => sd.dot(j, e, { r: j === k ? 6 : 3, color: j === k ? 'gold' : 'red' }));
          info = { err: errs[k], nA, tt, det: E[0][0] * E[1][1] - E[0][1] * E[1][0], tr: A[0][0] + A[1][1], k };
        });
        v.readout(() => {
          if (!info) return '';
          const { err, nA, tt, det, tr } = info;
          return `$\\|tA\\|=${v.fix(nA, 2)}$; after $n=${info.k}$ terms the operator-norm error is $${err <= 1e-16 ? '<10^{-16}' : v.sci(err, 2)}$.\nUnit-square area under $e^{tA}$: $\\det e^{tA}=${v.fix(det, 4)}$ and $e^{t\\operatorname{tr}A}=${v.fix(Math.exp(tt * tr), 4)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'e^{tA} is the flow of ẋ = Ax',
      statement: String.raw`For a constant matrix $A$ the unique solution of $\dot x=Ax$, $x(0)=x_0$ is $x(t)=e^{tA}x_0$, defined for all $t\in\R$. Consequently the flow $\Phi_t=e^{tA}$ is a group of invertible linear maps ($\Phi_{s+t}=\Phi_s\Phi_t$, $\Phi_0=I$) and
$$\frac{d}{dt}e^{tA}=Ae^{tA}=e^{tA}A,\qquad \det e^{tA}=e^{t\operatorname{tr}A}.$$
The columns of $e^{tA}$ are the solutions starting at the standard basis vectors, so $e^{tA}$ is a fundamental matrix with value $I$ at $t=0$.`,
      idea: String.raw`Differentiating the series for $e^{tA}$ termwise (legitimate by the uniform convergence from 3.2) gives $Ae^{tA}$, and $e^{0}=I$, so $t\mapsto e^{tA}x_0$ solves the initial value problem. Uniqueness comes from Picard–Lindelöf (2.4) because the field is globally Lipschitz. The group law is then uniqueness again: $t\mapsto e^{(s+t)A}x_0$ and $t\mapsto e^{tA}e^{sA}x_0$ solve the same problem. The determinant formula is Liouville's formula (3.11) at constant $A$.`,
      caption: String.raw`The letter F is a cloud of initial points. Slide $t$: the accent shape is the image under the *exact* $e^{tA}$ and the gold dots are the same points advanced by numerical RK4 integration of $\dot x=Ax$ — they sit on top of each other. Pick a preset or drag $Ae_1$, $Ae_2$. Faint curves are the orbits of the corner points; the area of the F is multiplied by $e^{t\operatorname{tr}A}$.`,
      deps: ['ode-3.2', 'ode-2.4'],
      refs: ['Teschl §3.1'],
      tags: ['flow', 'matrix exponential'],
      viz(v) {
        const PRE = { spiral: [[-0.3, -1.6], [1.6, -0.3]], saddle: [[1, 0.5], [0.5, -1]], shear: [[0, 1], [0, 0]], rotation: [[0, -1], [1, 0]], node: [[-1, 0.4], [0, -2]] };
        const pre = v.select('preset', [{ value: 'spiral', label: 'spiral' }, { value: 'saddle', label: 'saddle' }, { value: 'node', label: 'node' }, { value: 'shear', label: 'shear' }, { value: 'rotation', label: 'rotation' }], 'spiral', { onChange: (val) => MH.set(PRE[val]) });
        const t = v.slider('$t$', -2, 3, 1.0, { step: 0.02 });
        const s = v.stage({ x: [-4, 4], y: [-2.6, 2.6], equal: true, axes: 'box', gutter: true, height: 400, xlabel: 'x₁', ylabel: 'x₂', title: 'a cloud of initial points carried by the flow' });
        const MH = matHandles(s, PRE.spiral, { range: 2.2, parallelogram: false, l1: '$Ae_1$', l2: '$Ae_2$' });
        // the letter F as a polygon (data units) and boundary sample points
        const Fp = [[0.5, 0.5], [0.8, 0.5], [0.8, 1.4], [1.7, 1.4], [1.7, 1.7], [0.8, 1.7], [0.8, 2.2], [1.9, 2.2], [1.9, 2.5], [0.5, 2.5]].map(([x, y]) => [1.45 * (x - 1.2), 1.45 * (y - 1.5)]);
        const pts = []; for (let i = 0; i < Fp.length; i++) { const a = Fp[i], b = Fp[(i + 1) % Fp.length], m = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.16)); for (let j = 0; j < m; j++) pts.push([a[0] + ((b[0] - a[0]) * j) / m, a[1] + ((b[1] - a[1]) * j) / m]); }
        v.legend([['accent', 'image under $e^{tA}$'], ['gold', 'numerical solutions of $\\dot x=Ax$', { dot: true }], ['muted', 'orbits of the corners'], ['faint', 'the initial F']]);
        let info = null;
        v.render(() => {
          const A = MH.A(), tt = t.value, E = expm(A, tt), F = (_, x) => mvec(A, x);
          s.poly(Fp, { fill: 'muted', fillAlpha: 0.1, color: 'faint', width: 1.2 });
          for (const c of Fp) { s.path(orb(A, c, tt, 60), { color: 'muted', width: 1, alpha: 0.5 }); }
          const Ep = Fp.map((p) => mvec(E, p));
          s.clip(() => s.poly(Ep, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2.6 }));
          let dev = 0; const num = [];
          const nst = Math.max(40, Math.ceil(Math.abs(tt) * 80));
          for (const p of pts) { const y = flow(F, 0, p, tt, nst).at(-1)[1]; num.push(y); const e = mvec(E, p); dev = Math.max(dev, Math.hypot(y[0] - e[0], y[1] - e[1])); }
          s.clip(() => { for (const y of num) s.dot(y[0], y[1], { r: 2.6, color: 'gold' }); });
          MH.draw();
          const h = expm(A, tt / 2), grp = fro(madd(mmul(h, h), E, -1));
          const ar = Math.abs(((x) => { let a = 0; for (let i = 0; i < x.length; i++) { const [x1, y1] = x[i], [x2, y2] = x[(i + 1) % x.length]; a += x1 * y2 - x2 * y1; } return a / 2; })(Ep));
          const a0 = Math.abs(((x) => { let a = 0; for (let i = 0; i < x.length; i++) { const [x1, y1] = x[i], [x2, y2] = x[(i + 1) % x.length]; a += x1 * y2 - x2 * y1; } return a / 2; })(Fp));
          info = { dev, grp, ratio: ar / a0, tr: A[0][0] + A[1][1], tt };
        });
        v.readout(() => {
          if (!info) return '';
          const { dev, grp, ratio, tr, tt } = info;
          return `Largest gap between $e^{tA}x_0$ and the integrated solution over the cloud: $${dev < 1e-9 ? '<10^{-9}' : v.sci(dev, 2)}$ (RK4 error).\nArea of the image $/$ area of the F $=${v.fix(ratio, 4)}$ and $e^{t\\operatorname{tr}A}=${v.fix(Math.exp(tt * tr), 4)}$; group law defect $\\|e^{tA/2}e^{tA/2}-e^{tA}\\|=${v.sci(Math.max(grp, 1e-17), 1)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Paradox',
      name: 'e^{A+B} ≠ e^A e^B unless A and B commute',
      statement: String.raw`For commuting matrices, $AB=BA$, one has $e^{A+B}=e^{A}e^{B}=e^Be^A$. For non-commuting matrices the identity is in general false, and even $e^Ae^B\ne e^Be^A$: the two products differ at second order by the commutator,
$$e^{A}e^{B}=e^{A+B+\frac12[A,B]+\cdots},\qquad [A,B]=AB-BA,$$
(Baker–Campbell–Hausdorff). What survives in general is the *Lie product formula* $e^{A+B}=\lim_{k\to\infty}\big(e^{A/k}e^{B/k}\big)^{k}$.`,
      idea: String.raw`Expand both sides to second order: $e^{A+B}=I+A+B+\tfrac12(A^2+AB+BA+B^2)+\cdots$, whereas $e^Ae^B=I+A+B+\tfrac12(A^2+2AB+B^2)+\cdots$; the difference is $\tfrac12(AB-BA)$. When $AB=BA$ the binomial theorem applies term by term and the series agree (this is exactly the proof of the group law $e^{(s+t)A}=e^{sA}e^{tA}$ in 3.2). Splitting the time step into $k$ pieces makes each commutator error $O(1/k^2)$, so $k$ steps accumulate only $O(1/k)$.`,
      caption: String.raw`Choose $A=\mathrm{diag}(p,q)$ and a second matrix $B$ of a chosen type with strength $u$. The images of the unit circle under $e^{A+B}$ (blue), $e^Ae^B$ (red) and $e^Be^A$ (orange, dashed) are different ellipses unless $[A,B]=0$ (for the rotation or shear generator that happens exactly when $p=q$ resp. never unless $u=0$; for the diagonal $B$ always). The green curve is the Lie product $(e^{A/k}e^{B/k})^k$: raise $k$ and it closes in on the blue ellipse.`,
      deps: ['ode-3.2'],
      refs: ['Teschl §3.1'],
      tags: ['commutator', 'matrix exponential'],
      viz(v) {
        const p = v.slider('$A=\\mathrm{diag}(p,q)$: $p$', -1.2, 1.2, 0.8, { step: 0.02 });
        const q = v.slider('$q$', -1.2, 1.2, -0.4, { step: 0.02 });
        const bt = v.select('$B$', [{ value: 'rot', label: 'rotation generator $u\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$' }, { value: 'shear', label: 'shear $u\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$' }, { value: 'diag', label: 'diagonal $u\\,\\mathrm{diag}(1,-1)$' }], 'rot');
        const u = v.slider('strength $u$', -2, 2, 1, { step: 0.02 });
        const kk = v.slider('Lie product steps $k$', 1, 60, 4, { int: true });
        const s = v.stage({ x: [-4.5, 4.5], y: [-2.6, 2.6], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x₁', ylabel: 'x₂', title: 'images of the unit circle' });
        v.legend([['accent', '$e^{A+B}$'], ['red', '$e^{A}e^{B}$'], ['orange', '$e^{B}e^{A}$', { dash: true }], ['green', '$(e^{A/k}e^{B/k})^k$', { dash: true }], ['faint', 'unit circle']]);
        const circ = Array.from({ length: 121 }, (_, i) => [Math.cos((2 * Math.PI * i) / 120), Math.sin((2 * Math.PI * i) / 120)]);
        const img = (M) => circ.map((c) => mvec(M, c));
        let info = null;
        v.render(() => {
          const A = [[p.value, 0], [0, q.value]], B = bt.value === 'rot' ? [[0, -u.value], [u.value, 0]] : bt.value === 'shear' ? [[0, u.value], [0, 0]] : [[u.value, 0], [0, -u.value]];
          const S = expm(madd(A, B), 1), AB = mmul(expm(A, 1), expm(B, 1)), BA = mmul(expm(B, 1), expm(A, 1));
          const k = kk.value, L = mmul(expm(A, 1 / k), expm(B, 1 / k)); let Lk = eye(2); for (let i = 0; i < k; i++) Lk = mmul(Lk, L);
          s.path(circ, { color: 'faint', width: 1.2 });
          s.clip(() => {
            s.path(img(BA), { color: 'orange', width: 2.4, dash: [7, 5] });
            s.path(img(AB), { color: 'red', width: 2.8 });
            s.path(img(Lk), { color: 'green', width: 2.2, dash: [3, 4] });
            s.path(img(S), { color: 'accent', width: 3 });
          });
          const Cm = madd(mmul(A, B), mmul(B, A), -1);
          info = { cn: fro(Cm), dAB: fro(madd(S, AB, -1)), dBA: fro(madd(AB, BA, -1)), dL: fro(madd(S, Lk, -1)), k };
        });
        v.readout(() => {
          if (!info) return '';
          const { cn, dAB, dBA, dL, k } = info, z = (x) => (x < 1e-12 ? '<10^{-12}' : v.sci(x, 2));
          return `$\\|[A,B]\\|=${v.fix(cn, 3)}$, $\\|e^{A+B}-e^Ae^B\\|=${z(dAB)}$, $\\|e^Ae^B-e^Be^A\\|=${z(dBA)}$.\n${cn < 1e-12 ? '$A$ and $B$ commute: all three ellipses coincide.' : 'They do not commute: the ellipses differ.'} Lie product with $k=${k}$: error $${z(dL)}$ (compare $\\|[A,B]\\|/2k\\approx${v.fix(cn / (2 * k), 4)}$ for small steps).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Eigenvector solutions and the diagonalizable case',
      statement: String.raw`If $Av=\lambda v$ with $v\ne0$ then $x(t)=e^{\lambda t}v$ solves $\dot x=Ax$. If $A$ has $n$ linearly independent eigenvectors $v_1,\dots,v_n$ with eigenvalues $\lambda_1,\dots,\lambda_n$ (that is, $A$ is diagonalizable, $A=V\Lambda V^{-1}$ with $V=(v_1\cdots v_n)$), then every solution is
$$x(t)=\sum_{j=1}^{n}c_je^{\lambda_jt}v_j,\qquad c=V^{-1}x(0),$$
and $e^{tA}=Ve^{t\Lambda}V^{-1}$. In the coordinates $c$ the system decouples into $n$ scalar equations $\dot c_j=\lambda_jc_j$.`,
      idea: String.raw`Applying $A$ to $e^{\lambda t}v$ gives $\lambda e^{\lambda t}v=\frac{d}{dt}(e^{\lambda t}v)$, so eigenvectors give straight-line solutions. When the eigenvectors form a basis (the equivalent conditions of 5.55 in linear algebra), these $n$ solutions are independent, hence by superposition (3.1) and uniqueness they exhaust all solutions. Since $A^k=V\Lambda^kV^{-1}$, the exponential series sums to $Ve^{t\Lambda}V^{-1}$.`,
      caption: String.raw`Drag the two eigenvectors $v_1,v_2$ (the lines through them are the invariant lines) and choose $\lambda_1,\lambda_2$. Drag the starting point $x_0$ (gold): the parallelogram shows its decomposition $x_0=c_1v_1+c_2v_2$, and the moving components $c_je^{\lambda_jt}v_j$ add up to the solution (accent curve). Make $v_1\parallel v_2$ and $A$ is no longer diagonalizable by these vectors: the picture degenerates.`,
      deps: ['ode-3.3', 'ladr-5.8', 'ladr-5.55'],
      refs: ['Teschl §3.2', 'Hirsch–Smale–Devaney ch. 2'],
      tags: ['eigenvectors', 'diagonalization'],
      viz(v) {
        const l1 = v.slider('$\\lambda_1$', -2, 2, -0.5, { step: 0.02 });
        const l2 = v.slider('$\\lambda_2$', -2, 2, 0.8, { step: 0.02 });
        const tau = v.slider('time $t$', -3, 3, 0.6, { step: 0.02 });
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, axes: 'box', gutter: true, height: 400, xlabel: 'x₁', ylabel: 'x₂', title: 'eigenlines, the decomposition of $x_0$ and the solution' });
        const lim = { x: [-2.8, 2.8], y: [-2.2, 2.2] };
        const H1 = s.handle(1.4, 0.5, { color: 'accent', label: '$v_1$', labelPos: 'ne', constrain: lim });
        const H2 = s.handle(-0.5, 1.5, { color: 'orange', label: '$v_2$', labelPos: 'nw', constrain: lim });
        const X0 = s.handle(1.0, -1.4, { color: 'gold', label: '$x_0$', labelPos: 'se', constrain: lim });
        v.legend([['accent', 'line $\\mathbb{R}v_1$ / component $c_1e^{\\lambda_1t}v_1$'], ['orange', 'line $\\mathbb{R}v_2$ / component $c_2e^{\\lambda_2t}v_2$'], ['gold', 'solution through $x_0$'], ['muted', 'other solutions']]);
        let info = null;
        v.render(() => {
          const V = [[H1.x, H2.x], [H1.y, H2.y]], dv = V[0][0] * V[1][1] - V[0][1] * V[1][0], a = l1.value, b = l2.value;
          const L = 6, n1 = Math.hypot(H1.x, H1.y) || 1, n2 = Math.hypot(H2.x, H2.y) || 1;
          s.line(-L * H1.x / n1, -L * H1.y / n1, L * H1.x / n1, L * H1.y / n1, { color: 'accent', width: 1.4, alpha: 0.6 });
          s.line(-L * H2.x / n2, -L * H2.y / n2, L * H2.x / n2, L * H2.y / n2, { color: 'orange', width: 1.4, alpha: 0.6 });
          if (Math.abs(dv) < 0.03) { info = { deg: true }; s.arrow(0, 0, H1.x, H1.y, { color: 'accent', width: 2.4 }); s.arrow(0, 0, H2.x, H2.y, { color: 'orange', width: 2.4 }); return; }
          const Vi = [[V[1][1] / dv, -V[0][1] / dv], [-V[1][0] / dv, V[0][0] / dv]];
          const A = mmul(mmul(V, [[a, 0], [0, b]]), Vi);
          const sol = (x0, t) => { const c = mvec(Vi, x0); return [c[0] * Math.exp(a * t) * H1.x + c[1] * Math.exp(b * t) * H2.x, c[0] * Math.exp(a * t) * H1.y + c[1] * Math.exp(b * t) * H2.y]; };
          s.clip(() => {
            for (const p of ring(12, 1.5, 0.2).concat(ring(12, 2.6, 0.45))) { s.path(orb(A, p, 4, 120), { color: 'muted', width: 1, alpha: 0.4 }); s.path(orb(A, p, -4, 120), { color: 'muted', width: 1, alpha: 0.4 }); }
            s.path(orb(A, [X0.x, X0.y], 4, 240), { color: 'gold', width: 2.6 }); s.path(orb(A, [X0.x, X0.y], -4, 240), { color: 'gold', width: 2.6, alpha: 0.5 });
          });
          const c = mvec(Vi, [X0.x, X0.y]), t = tau.value;
          const e1 = [c[0] * Math.exp(a * t) * H1.x, c[0] * Math.exp(a * t) * H1.y], e2 = [c[1] * Math.exp(b * t) * H2.x, c[1] * Math.exp(b * t) * H2.y];
          s.poly([[0, 0], e1, [e1[0] + e2[0], e1[1] + e2[1]], e2], { fill: 'gold', fillAlpha: 0.1, color: 'gold', width: 1, alpha: 0.6 });
          s.arrow(0, 0, e1[0], e1[1], { color: 'accent', width: 2.6 }); s.arrow(0, 0, e2[0], e2[1], { color: 'orange', width: 2.6 });
          s.dot(e1[0] + e2[0], e1[1] + e2[1], { r: 6, color: 'gold' });
          s.arrow(0, 0, H1.x, H1.y, { color: 'accent', width: 1.2, alpha: 0.5 }); s.arrow(0, 0, H2.x, H2.y, { color: 'orange', width: 1.2, alpha: 0.5 });
          const ex = mvec(expm(A, t), [X0.x, X0.y]);
          info = { c, a, b, t, err: Math.hypot(ex[0] - e1[0] - e2[0], ex[1] - e1[1] - e2[1]), cls: classify2(A[0][0] + A[1][1], A[0][0] * A[1][1] - A[0][1] * A[1][0]) };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.deg) return '$v_1$ and $v_2$ are (nearly) parallel: they do not form a basis, so they cannot diagonalize $A$. A defective matrix needs a Jordan block (3.7).';
          const { c, a, b, t, err, cls } = info;
          return `$x_0=${v.fix(c[0], 2)}\\,v_1${c[1] < 0 ? '-' : '+'}${v.fix(Math.abs(c[1]), 2)}\\,v_2$; at time $t=${v.fix(t, 2)}$ the coefficients have become $c_1e^{\\lambda_1t}=${v.fix(c[0] * Math.exp(a * t), 2)}$, $c_2e^{\\lambda_2t}=${v.fix(c[1] * Math.exp(b * t), 2)}$. Disagreement with $e^{tA}x_0$: $${err < 1e-9 ? '<10^{-9}' : v.sci(err, 2)}$. Type: **${cls}**.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Complex eigenvalues give rotation and spirals',
      statement: String.raw`Let $A$ be a real $2\times2$ matrix with eigenvalues $\alpha\pm i\beta$, $\beta>0$. Then there is a real invertible $P$ with $P^{-1}AP=\begin{pmatrix}\alpha&-\beta\\\beta&\alpha\end{pmatrix}$ (its columns are the real and imaginary parts of a complex eigenvector), and
$$e^{tA}=e^{\alpha t}\,P\begin{pmatrix}\cos\beta t&-\sin\beta t\\\sin\beta t&\cos\beta t\end{pmatrix}P^{-1}.$$
Every non-zero solution therefore turns around the origin with angular speed $\beta$ in the coordinates given by $P$, with period $2\pi/\beta$, while its radius is multiplied by $e^{\alpha t}$: it spirals outward if $\alpha>0$, inward if $\alpha<0$, and runs on a closed ellipse if $\alpha=0$.`,
      idea: String.raw`Write the complex eigenvector as $w=u+iz$ with $Aw=(\alpha+i\beta)w$; taking real and imaginary parts gives $Au=\alpha u-\beta z$, $Az=\beta u+\alpha z$, which is the matrix above in the basis $(u,z)$. The block is $\alpha I+\beta J$ with $J^2=-I$ and $\alpha I$ commuting with $\beta J$, so by 3.4 its exponential is $e^{\alpha t}e^{\beta tJ}$, and $e^{\beta tJ}=\cos\beta t\,I+\sin\beta t\,J$ by the series for sine and cosine (the same computation as $e^{i\theta}=\cos\theta+i\sin\theta$ of the exponential function in complex analysis, rca-0.6).`,
      caption: String.raw`Drag the eigenvalue $\alpha+i\beta$ in the left plane and the basis vectors $u,z$ (they shear the picture) in the right one, and drag the start $x_0$. The integrator measures the time the trajectory needs to turn once around (in the $P$-coordinates) — the readout compares it with $2\pi/\beta$ — and the gold marks sit at multiples of that time; the radius ratio per turn is compared with $e^{2\pi\alpha/\beta}$.`,
      deps: ['ode-3.5', 'rca-0.6'],
      refs: ['Hirsch–Smale–Devaney ch. 2'],
      tags: ['complex eigenvalues', 'spirals'],
      viz(v) {
        const sl = v.stage({ x: [-1.6, 1.6], y: [-3.3, 3.3], axes: true, height: 380, xlabel: 'Re λ', ylabel: 'Im λ', title: 'the eigenvalue $\\alpha+i\\beta$', weight: 1, minWidth: 220 });
        const s = v.stage({ x: [-3.4, 3.4], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x₁', ylabel: 'x₂', title: 'trajectory in the phase plane', weight: 1.6 });
        const L = sl.handle(-0.2, 1.4, { color: 'accent', label: '$\\lambda$', labelPos: 'ne', constrain: { x: [-1.4, 1.4], y: [0.25, 3.1] } });
        const U = s.handle(1.1, 0.0, { color: 'accent', label: '$u$', labelPos: 'ne', constrain: { x: [-2.6, 2.6], y: [-2.6, 2.6] } });
        const Z = s.handle(0.5, 0.9, { color: 'orange', label: '$z$', labelPos: 'nw', constrain: { x: [-2.6, 2.6], y: [-2.6, 2.6] } });
        const X0 = s.handle(1.8, 0.2, { color: 'gold', label: '$x_0$', labelPos: 'se', constrain: { x: [-3, 3], y: [-2.8, 2.8] } });
        v.legend([['gold', 'trajectory'], ['gold', 'marks at multiples of the measured period', { dot: true }], ['muted', 'other trajectories'], ['accent', 'basis $u$, $z$']]);
        let info = null;
        v.render(() => {
          const al = L.x, be = L.y, Pm = [[U.x, Z.x], [U.y, Z.y]], dP = Pm[0][0] * Pm[1][1] - Pm[0][1] * Pm[1][0];
          sl.line(0, -3.3, 0, 3.3, { color: 'red', width: 1.2, alpha: 0.5 });
          sl.dot(al, be, { r: 6, color: 'accent' }); sl.dot(al, -be, { r: 5, hollow: true, color: 'accent' });
          
          if (Math.abs(dP) < 0.05) { info = { deg: true }; s.arrow(0, 0, U.x, U.y, { color: 'accent', width: 2 }); s.arrow(0, 0, Z.x, Z.y, { color: 'orange', width: 2 }); return; }
          const Pi = [[Pm[1][1] / dP, -Pm[0][1] / dP], [-Pm[1][0] / dP, Pm[0][0] / dP]];
          const A = mmul(mmul(Pm, [[al, -be], [be, al]]), Pi);
          const F = (t, x) => mvec(A, x);
          s.clip(() => {
            for (const p of ring(7, 1.0, 0.7).concat(ring(9, 2.2, 0.1))) s.path(trim(flow(F, 0, p, Math.min(40, 3.5 * 2 * Math.PI / be), 500).map((q) => q[1]), 50), { color: 'muted', width: 1, alpha: 0.35 });
          });
          // measured period: unwrap the angle in P-coordinates along an RK4 trajectory
          const Tend = Math.min(60, 2.4 * 2 * Math.PI / be), N = 4000, tr = flow(F, 0, [X0.x, X0.y], Tend, N);
          let ang = 0, prev = null, Tm = null, rad0 = null, radT = null; const marks = [];
          for (let i = 0; i <= N; i++) {
            const z = mvec(Pi, tr[i][1]), th = Math.atan2(z[1], z[0]); if (prev !== null) { let d = th - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; ang += d; } else ang = 0; prev = th;
            if (Tm === null && ang >= 2 * Math.PI && i > 0) { Tm = tr[i][0]; radT = Math.hypot(z[0], z[1]); rad0 = Math.hypot(...mvec(Pi, tr[0][1])); }
          }
          const path = trim(tr.map((q) => q[1]), 50); s.clip(() => s.path(path, { color: 'gold', width: 2.6 }));
          if (Tm) { for (let k = 0; k * Tm <= Tend; k++) { const q = flow(F, 0, [X0.x, X0.y], k * Tm, Math.max(10, k * 200)).at(-1)[1]; if (Math.hypot(...q) < 50) s.dot(q[0], q[1], { r: 4, color: 'gold' }); } }
          s.arrow(0, 0, U.x, U.y, { color: 'accent', width: 2 }); s.arrow(0, 0, Z.x, Z.y, { color: 'orange', width: 2 });
          info = { al, be, Tm, ratio: Tm ? radT / rad0 : null, cls: classify2(2 * al, al * al + be * be) };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.deg) return '$u$ and $z$ are (nearly) parallel and do not form a basis.';
          const { al, be, Tm, ratio, cls } = info;
          return `$\\lambda=${v.fix(al, 2)}${'+'}${v.fix(be, 2)}i$: **${cls}**.\nPredicted period $2\\pi/\\beta=${v.fix((2 * Math.PI) / be, 4)}$; measured from the simulation: $${Tm ? v.fix(Tm, 4) : '\\text{(more than the shown time)}'}$. Radius ratio per turn: predicted $e^{2\\pi\\alpha/\\beta}=${v.fix(Math.exp((2 * Math.PI * al) / be), 4)}$, measured $${ratio ? v.fix(ratio, 4) : '-'}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Jordan blocks and polynomial–exponential solutions',
      statement: String.raw`Every complex square matrix is similar to a block-diagonal Jordan matrix, $A=SJS^{-1}$, whose blocks are $J_m(\lambda)=\lambda I+N$ with $N$ the nilpotent shift ($N^m=0$). Since $\lambda I$ and $N$ commute,
$$e^{tJ_m(\lambda)}=e^{\lambda t}\Big(I+tN+\frac{t^2N^2}{2!}+\dots+\frac{t^{m-1}N^{m-1}}{(m-1)!}\Big).$$
Hence every component of every solution of $\dot x=Ax$ is a sum of terms $t^{j}e^{\lambda t}$ (with $j<$ the size of the largest Jordan block of $\lambda$), and for a defective eigenvalue the polynomial factors cannot be avoided: for $A=\begin{pmatrix}\lambda&1\\0&\lambda\end{pmatrix}$, $e^{tA}=e^{\lambda t}\begin{pmatrix}1&t\\0&1\end{pmatrix}$.`,
      idea: String.raw`Choose a basis adapted to the Jordan form (generalized eigenvectors, the decomposition 8.22 in linear algebra). On a block $\lambda I+N$ the two summands commute, so $e^{t\lambda I}e^{tN}$ by 3.4, and the exponential series of the nilpotent $N$ terminates. Conversely, a double root of the characteristic polynomial with only one eigenvector forces the second solution to carry a factor $t$: the $2\times2$ matrix $\begin{pmatrix}\lambda&1\\0&\lambda\end{pmatrix}$ has a single eigendirection.`,
      caption: String.raw`The matrix $A=\begin{pmatrix}\lambda+\delta/2&1\\0&\lambda-\delta/2\end{pmatrix}$ has eigenvalues $\lambda\pm\delta/2$ with eigenvectors $(1,0)$ and $(1,-\delta)$. Slide the gap $\delta$ to $0$: the two eigenlines merge into one, the node degenerates, and the solution from $(0,1)$ (right) becomes $(t,1)e^{\lambda t}$, a hump of height $1/(e|\lambda|)$ at $t=1/|\lambda|$ before the decay takes over. Dashed curves: the Jordan formula at $\delta=0$.`,
      deps: ['ode-3.3', 'ladr-8.46'],
      refs: ['Teschl §3.8', 'Hirsch–Smale–Devaney ch. 6'],
      credit: 'C. Jordan, 1870 (Weierstrass had related results earlier)',
      tags: ['jordan form', 'defective matrices'],
      viz(v) {
        const lam = v.slider('$\\lambda$ (mean eigenvalue)', -1.6, 1.0, -0.8, { step: 0.02 });
        const dl = v.slider('eigenvalue gap $\\delta$', 0, 1.6, 0.9, { step: 0.01 });
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x₁', ylabel: 'x₂', title: 'phase portrait and eigenlines', weight: 1.2 });
        const sp = v.stage({ x: [0, 8], y: [-0.2, 1.2], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'components', title: 'the solution from $x_0=(0,1)$', weight: 1.2, minWidth: 240 });
        v.legend([['accent', '$x_1(t)$'], ['orange', '$x_2(t)$'], ['green', 'Jordan limit $te^{\\lambda t}$, $e^{\\lambda t}$', { dash: true }], ['red', 'eigenlines']]);
        let info = null;
        v.render(() => {
          const l0 = lam.value, d = dl.value, a = l0 + d / 2, b = l0 - d / 2, A = [[a, 1], [0, b]];
          s.clip(() => {
            for (const p of ring(10, 1.2, 0.2).concat(ring(14, 2.4, 0.5))) { s.path(orb(A, p, 5, 150), { color: 'muted', width: 1.1, alpha: 0.5 }); s.path(orb(A, p, -5, 150), { color: 'muted', width: 1.1, alpha: 0.5 }); }
          });
          const e2 = Math.hypot(1, d);
          s.line(-4, 0, 4, 0, { color: 'red', width: 1.6, alpha: 0.8 });
          if (d > 1e-6) s.line(-4 / e2, 4 * d / e2, 4 / e2, -4 * d / e2, { color: 'red', width: 1.6, alpha: 0.8 });
          const sol = (t) => { const x1 = d > 1e-9 ? (Math.exp(a * t) - Math.exp(b * t)) / (a - b) : t * Math.exp(l0 * t); return [x1, Math.exp(b * t)]; };
          const T = 8, pts1 = [], pts2 = []; let mx = 0, tm = 0;
          for (let i = 0; i <= 400; i++) { const t = (T * i) / 400, y = sol(t); pts1.push([t, y[0]]); pts2.push([t, y[1]]); if (y[0] > mx) { mx = y[0]; tm = t; } }
          const top = Math.max(1.2, mx * 1.15);
          sp.setView([0, T], [-0.25 * top / 1.2, top]);
          sp.hline(0, { color: 'muted', width: 1 });
          sp.path(pts1, { color: 'accent', width: 2.8 }); sp.path(pts2, { color: 'orange', width: 2.8 });
          if (d > 1e-6) { sp.fn((t) => t * Math.exp(l0 * t), { color: 'green', width: 1.8, dash: [6, 4], domain: [0, T] }); sp.fn((t) => Math.exp(l0 * t), { color: 'green', width: 1.8, dash: [6, 4], domain: [0, T] }); }
          sp.dot(tm, mx, { r: 5, color: 'gold' });
          info = { a, b, d, mx, tm, l0, ang: Math.atan2(d, 1) };
        });
        v.readout(() => {
          if (!info) return '';
          const { a, b, d, mx, tm, l0, ang } = info;
          return `Eigenvalues $${v.fix(a, 2)}$ and $${v.fix(b, 2)}$; the angle between the eigenvectors $(1,0)$ and $(1,-\\delta)$ is $${v.fix((ang * 180) / Math.PI, 1)}^\\circ$ ${d < 1e-6 ? '— the eigenlines have merged: **one** eigenvector, a Jordan block.' : '.'}\n$x_1$ peaks at $t=${v.fix(tm, 2)}$ with value $${v.fix(mx, 3)}$${l0 < 0 ? ` (at $\\delta=0$: $t=1/|\\lambda|=${v.fix(1 / Math.abs(l0), 2)}$, value $1/(e|\\lambda|)=${v.fix(1 / (Math.E * Math.abs(l0)), 3)}$)` : ''}.`;
        });
      },
    },
  ],
};
