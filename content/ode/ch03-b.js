// Ordinary Differential Equations & Dynamical Systems — Chapter 3 (part b): classification, stability, fundamental matrices, variation of constants
import { flow, mmul, madd, mscale, mvec, eye, fro, opnorm, expm, eig2, classify2, orbitLin, matFlow, polyArea, polyFromRootsC, epoly, C, spline } from './ch03.shared.js';

const trim = (pts, cap = 1e5) => { const o = []; for (const p of pts) { if (!p.every((q) => isFinite(q) && Math.abs(q) <= cap)) break; o.push(p); } return o; };
const COLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];

export default {
  collection: 'ode',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Classification of planar linear systems',
      statement: String.raw`Let $A$ be a real $2\times2$ matrix with trace $\tau$ and determinant $\Delta$; its eigenvalues are $\lambda_\pm=\tfrac12\big(\tau\pm\sqrt{\tau^2-4\Delta}\big)$. The phase portrait of $\dot x=Ax$ is, up to a linear change of coordinates, determined by $(\tau,\Delta)$ and (on the parabola) the diagonalizability of $A$:
- $\Delta<0$: a **saddle** (real eigenvalues of opposite signs);
- $\Delta>0$, $\tau^2>4\Delta$: a **node**, stable if $\tau<0$, unstable if $\tau>0$;
- $\Delta>0$, $\tau^2<4\Delta$: a **spiral**, stable if $\tau<0$, unstable if $\tau>0$; if $\tau=0$ a **centre** (closed ellipses);
- $\tau^2=4\Delta>0$: a **degenerate node** (one eigendirection) or a **star** ($A=\lambda I$);
- $\Delta=0$: a line of equilibria (or all of the plane, if $A=0$).`,
      idea: String.raw`The eigenvalues are the roots of $\lambda^2-\tau\lambda+\Delta$, with sum $\tau$ and product $\Delta$ (trace and determinant as sum and product of the eigenvalues, ladr-8.52 and ladr-9.55). Their signs and whether they are real or complex decide everything: two real roots of opposite sign are the saddle ($\Delta<0$), two of the same sign the node; complex roots $\alpha\pm i\beta$ give rotation with growth rate $\alpha=\tau/2$ (3.6). On the parabola the root is double and the Jordan structure (3.7) separates the degenerate node from the star.`,
      caption: String.raw`Drag the point $(\tau,\Delta)$ around the left plane; the right panel shows the portrait of the companion system $\dot x=y,\ \dot y=-\Delta x+\tau y$ (it has trace $\tau$ and determinant $\Delta$), with its separatrices when there is a saddle, and the third panel shows where the eigenvalues sit. Crossing the parabola $\tau^2=4\Delta$ turns spirals into nodes, the axis $\tau=0$ flips the stability, and $\Delta=0$ is where an eigenvalue passes through $0$. (A companion matrix is never a multiple of $I$, so on the parabola you only see the degenerate node.)`,
      deps: ['ode-3.6', 'ode-3.7', 'ladr-8.52', 'ladr-9.55'],
      refs: ['Strogatz §5.2', 'Hirsch–Smale–Devaney ch. 4'],
      tags: ['classification', 'trace-determinant'],
      viz(v) {
        const sT = v.stage({ x: [-4, 4], y: [-2.5, 5], axes: true, height: 380, xlabel: 'τ', ylabel: 'Δ', title: 'the trace–determinant plane', weight: 1, minWidth: 250 });
        const sP = v.stage({ x: [-3, 3], y: [-3, 3], axes: 'box', gutter: true, height: 380, xlabel: 'x', ylabel: 'y', title: 'phase portrait', weight: 1.2 });
        const sE = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 380, xlabel: 'Re λ', ylabel: 'Im λ', title: 'eigenvalues', weight: 0.8, minWidth: 200 });
        const H = sT.handle(-1, 2.2, { color: 'accent', label: '$(\\tau,\\Delta)$', labelPos: 'ne', constrain: { x: [-3.9, 3.9], y: [-2.4, 4.9] } });
        const pp = v.phasePlane(sP, { f: (x, y, t, p) => [y, -p.det * x + p.tr * y], params: { tr: () => H.x, det: () => H.y }, field: 'stream', nullclines: false, separatrices: true, seeds: [[1.5, 1.0]], tMax: 60 });
        const lab = (txt, x, y) => sT.text(txt, x, y, { size: 11, color: 'muted', align: 'center' });
        v.render(() => {
          sT.between((t) => t * t / 4, () => 5, -4, 4, { fill: 'accent', fillAlpha: 0.04 });
          sT.fn((t) => t * t / 4, { color: 'accent', width: 2, domain: [-4, 4] });
          sT.hline(0, { color: 'muted', width: 1.2 }); sT.vline(0, { color: 'muted', width: 1.2 });
          lab('saddle', 0, -1.6); lab('stable node', -2.75, 0.8); lab('unstable node', 2.7, 0.8); lab('stable spiral', -1.4, 3.4); lab('unstable spiral', 1.4, 3.4);
          sT.text('centres (τ = 0)', 0.12, 4.2, { size: 11, color: 'muted', align: 'left' });
          sT.text('Δ = τ²/4', 2.3, 1.85, { size: 11, color: 'accent', align: 'left' });
          pp.draw();
          const e = eig2([[0, 1], [-H.y, H.x]]);
          sE.dot(e.l1[0], e.l1[1], { r: 6, color: 'accent' }); sE.dot(e.l2[0], e.l2[1], { r: 6, color: 'orange' });
          sE.vline(0, { color: 'red', width: 1.2, alpha: 0.5 });
        });
        pp.legend();
        v.readout(() => {
          const e = eig2([[0, 1], [-H.y, H.x]]), cls = classify2(H.x, H.y, 0.02);
          const ev = e.disc >= 0 ? `$\\lambda=${v.fix(e.l1[0], 2)},\\ ${v.fix(e.l2[0], 2)}$` : `$\\lambda=${v.fix(e.l1[0], 2)}\\pm${v.fix(e.l1[1], 2)}i$`;
          return `$\\tau=${v.fix(H.x, 2)}$, $\\Delta=${v.fix(H.y, 2)}$, $\\tau^2-4\\Delta=${v.fix(e.disc, 2)}$: **${cls}**, ${ev}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Stability of linear systems by eigenvalues',
      statement: String.raw`Let $A$ be a real $n\times n$ matrix and $s(A)=\max\{\operatorname{Re}\lambda:\lambda\text{ an eigenvalue}\}$. Then
(a) every solution of $\dot x=Ax$ tends to $0$ as $t\to\infty$ (equivalently, $0$ is asymptotically stable) if and only if $s(A)<0$; in that case $\|e^{tA}\|\le Ce^{-\mu t}$ for every $\mu<-s(A)$ and a constant $C=C(\mu)$;
(b) all solutions are bounded for $t\ge0$ (the origin is Lyapunov stable) if and only if $s(A)\le0$ and every eigenvalue with real part $0$ has equal algebraic and geometric multiplicity (only $1\times1$ Jordan blocks);
(c) if $s(A)>0$ some solution grows exponentially.`,
      idea: String.raw`By 3.7 every entry of $e^{tA}$ is a combination of terms $t^je^{\lambda t}$ with $j$ smaller than the Jordan block size. Such a term tends to $0$ iff $\operatorname{Re}\lambda<0$, because a polynomial cannot beat an exponential, and it stays bounded iff $\operatorname{Re}\lambda<0$ or ($\operatorname{Re}\lambda=0$ and $j=0$). A block of size $\ge2$ on the imaginary axis therefore produces a factor $t$, which is unbounded.`,
      caption: String.raw`Drag the real eigenvalue $\rho$ and the complex pair $\alpha\pm i\beta$ in the left plane; the $3\times3$ matrix $A=P\,\mathrm{diag}(\rho,R(\alpha,\beta))P^{-1}$ is disguised by a fixed non-orthogonal $P$. Five solutions are drawn in space (drag to rotate) and their size $\log\|x(t)\|$ in the right panel, with the line of slope $s(A)$ dashed. While $s(A)<0$ all curves sink; as soon as an eigenvalue crosses into the right half-plane some solution escapes, and at $s=0$ the pair $\pm i\beta$ gives bounded rotation.`,
      deps: ['ode-3.7'],
      refs: ['Teschl §9.1'],
      tags: ['stability', 'eigenvalues'],
      viz(v) {
        const sL = v.stage({ x: [-2.2, 2.2], y: [-3.4, 3.4], axes: true, height: 360, xlabel: 'Re λ', ylabel: 'Im λ', title: 'spectrum of $A$', weight: 0.8, minWidth: 220 });
        const s3 = v.stage3d({ range: 2.2, height: 360, title: 'solutions in $\\mathbb{R}^3$', weight: 1.2, labels: ['x₁', 'x₂', 'x₃'] });
        const sN = v.stage({ x: [0, 10], y: [-6, 6], axes: 'box', gutter: true, height: 360, xlabel: 't', ylabel: 'log ‖x‖', title: '$\\log\\|x(t)\\|$', weight: 1, minWidth: 230 });
        const R = sL.handle(-0.7, 0, { color: 'accent', label: '$\\rho$', labelPos: 'nw', constrain: { x: [-2.1, 2.1], y: [0, 0] } });
        const Mu = sL.handle(-0.5, 1.6, { color: 'orange', label: '$\\mu$', labelPos: 'ne', constrain: { x: [-2.1, 2.1], y: [0.3, 3.3] } });
        const Tm = v.slider('time span $T$', 2, 10, 6, { step: 0.1 });
        const P = [[1, 0.3, 0.0], [0.2, 1, -0.3], [0.1, 0.2, 1]];
        const Pinv = (() => { const M = [[...P[0], 1, 0, 0], [...P[1], 0, 1, 0], [...P[2], 0, 0, 1]]; for (let i = 0; i < 3; i++) { let p = i; for (let r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]]; const d = M[i][i]; for (let j = 0; j < 6; j++) M[i][j] /= d; for (let r = 0; r < 3; r++) if (r !== i) { const f = M[r][i]; for (let j = 0; j < 6; j++) M[r][j] -= f * M[i][j]; } } return M.map((r) => r.slice(3)); })();
        const seeds = [[1, 0.2, 0.1], [-0.4, 0.9, 0.3], [0.2, -0.8, -0.6], [-0.7, -0.3, 0.8], [0.3, 0.4, -0.9]].map((x) => mscale([x], 1)[0]);
        const cols = ['accent', 'orange', 'green', 'purple', 'red'];
        let info = null;
        v.render(() => {
          const rho = R.x, al = Mu.x, be = Mu.y;
          sL.vline(0, { color: 'red', width: 1.2, alpha: 0.6 });
          sL.dot(rho, 0, { r: 6, color: 'accent' }); sL.dot(al, be, { r: 6, color: 'orange' }); sL.dot(al, -be, { r: 5, color: 'orange', hollow: true });
          const D = [[rho, 0, 0], [0, al, -be], [0, be, al]], A = mmul(mmul(P, D), Pinv), T = Tm.value;
          const E = expm(A, T / 120);
          let slopeSum = 0, cnt = 0;
          seeds.forEach((x0, i) => {
            let x = x0; const pts = [x0], ln = [[0, Math.log(Math.hypot(...x0))]];
            for (let k = 1; k <= 120; k++) { x = mvec(E, x); pts.push(x); ln.push([(T * k) / 120, Math.log(Math.hypot(...x))]); }
            const inb = [], rng = 2.15;
            for (const p of pts) { if (p.some((q) => Math.abs(q) > rng)) break; inb.push(p); }
            s3.path(inb, { color: cols[i], width: 2 }); s3.dot(inb[inb.length - 1], { r: 4, color: cols[i] });
            sN.clip(() => sN.path(ln, { color: cols[i], width: 1.8 }));
            const a = ln[60], b = ln[120]; slopeSum += (b[1] - a[1]) / (b[0] - a[0]); cnt++;
          });
          s3.dot([0, 0, 0], { r: 4, color: 'ink' });
          const sa = Math.max(rho, al);
          sN.line(0, 0, T, sa * T, { color: 'ink', width: 1.4, dash: [6, 4], alpha: 0.7 });
          info = { sa, slope: slopeSum / cnt, rho, al, be };
        });
        v.legend([['accent', 'five solutions'], ['ink', 'slope $s(A)$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { sa, slope, rho, al, be } = info;
          const verdict = sa < -1e-9 ? 'all solutions decay to $0$ (asymptotically stable)' : sa > 1e-9 ? 'some solutions grow exponentially (unstable)' : 'the pair on the axis gives bounded rotation (stable, not asymptotically)';
          return `Eigenvalues $${v.fix(rho, 2)}$, $${v.fix(al, 2)}\\pm${v.fix(be, 2)}i$: $s(A)=${v.fix(sa, 2)}$, so ${verdict}.\nMean growth rate of $\\log\\|x\\|$ over the second half of the run: $${v.fix(slope, 3)}$ (generic solutions approach $s(A)$ when $s(A)\\neq0$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Fundamental matrices and the Wronskian',
      statement: String.raw`For $\dot x=A(t)x$ with $A$ continuous on an interval $I$, a *fundamental matrix* is a matrix $\Phi(t)$ whose columns are $n$ solutions and which is invertible for one (equivalently every) $t\in I$. Its determinant $W(t)=\det\Phi(t)$ is the *Wronskian* of the $n$ solutions. Every solution is $x(t)=\Phi(t)c$ for a unique constant vector $c$, and the *principal matrix* $\Phi(t,s)=\Phi(t)\Phi(s)^{-1}$ (the solution operator from time $s$ to $t$) satisfies $\Phi(t,s)\Phi(s,r)=\Phi(t,r)$. For constant $A$, $\Phi(t,s)=e^{(t-s)A}$. $n$ solutions are linearly independent as functions if and only if $W(t_0)\ne0$ at one $t_0$ — and then $W(t)\ne0$ at all $t$.`,
      idea: String.raw`Solutions are determined by their value at one time (uniqueness, 2.4), so the map $x(t_0)\mapsto x(t)$ is linear and invertible (run the equation backward) and carries a basis to a basis; hence a Wronskian that is non-zero at one time is non-zero at all times, and one that vanishes at one time vanishes always. The precise formula for $W(t)$ is Liouville's formula (3.11).`,
      caption: String.raw`Drag the two starting vectors $a=x_1(0)$ and $b=x_2(0)$ and slide $t$. The curves are the two solutions; the arrows are $x_1(t)$, $x_2(t)$ and the shaded parallelogram they span has the signed area $W(t)$, plotted on the right for all times. Choose a system (constant, periodic, time-varying trace). The area may swell, shrink, or oscillate — it never reaches zero unless you drag $b$ onto the line through $a$: then $W\equiv0$ for all $t$, because the solutions are dependent.`,
      deps: ['ode-3.1'],
      refs: ['Teschl §3.4'],
      tags: ['fundamental matrix', 'wronskian'],
      viz(v) {
        const SYS = {
          const: { label: 'constant', A: () => [[0, 1], [-1.2, -0.3]], tex: String.raw`\begin{pmatrix}0&1\\-1.2&-0.3\end{pmatrix}` },
          per: { label: 'periodic', A: (t) => [[0, 1], [-(1.1 + 0.8 * Math.cos(2 * t)), -0.2]], tex: String.raw`\begin{pmatrix}0&1\\-(1.1+0.8\cos2t)&-0.2\end{pmatrix}` },
          trace: { label: 'oscillating trace', A: (t) => [[0.5 * Math.cos(t), 1.2], [-0.9, 0.5 * Math.cos(t) - 0.1]], tex: String.raw`\begin{pmatrix}\tfrac12\cos t&1.2\\-0.9&\tfrac12\cos t-0.1\end{pmatrix}` },
        };
        const which = v.select('system $A(t)=$', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'per');
        const tt = v.slider('time $t$', 0, 6, 1.5, { step: 0.02 });
        const T = 6;
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x₁', ylabel: 'x₂', title: 'two solutions and the parallelogram they span', weight: 1.2 });
        const sw = v.stage({ x: [0, T], y: [-2, 2], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'W', title: 'the Wronskian $W(t)=\\det\\Phi(t)$', weight: 1, minWidth: 250 });
        const lim = { x: [-2.2, 2.2], y: [-1.8, 1.8] };
        const Ha = s.handle(1, 0, { color: 'accent', label: '$a$', labelPos: 'ne', constrain: lim });
        const Hb = s.handle(0, 1, { color: 'orange', label: '$b$', labelPos: 'nw', constrain: lim });
        v.legend([['accent', 'solution from $a$'], ['orange', 'solution from $b$'], ['gold', 'parallelogram, area $W(t)$']]);
        let info = null;
        v.render(() => {
          const S = SYS[which.value], N = 300, ts = tt.value;
          const Af = (t) => S.A(t);
          const Y0 = [[Ha.x, Hb.x], [Ha.y, Hb.y]];
          const tr = matFlow(Af, Y0, 0, T, N, true);
          const c1 = tr.map(([, Y]) => [Y[0][0], Y[1][0]]), c2 = tr.map(([, Y]) => [Y[0][1], Y[1][1]]);
          const W = tr.map(([t, Y]) => [t, Y[0][0] * Y[1][1] - Y[0][1] * Y[1][0]]);
          s.clip(() => { s.path(c1, { color: 'accent', width: 2.2, alpha: 0.8 }); s.path(c2, { color: 'orange', width: 2.2, alpha: 0.8 }); });
          const k = Math.round((ts / T) * N), Y = tr[k][1];
          const p1 = [Y[0][0], Y[1][0]], p2 = [Y[0][1], Y[1][1]];
          s.poly([[0, 0], p1, [p1[0] + p2[0], p1[1] + p2[1]], p2], { fill: 'gold', fillAlpha: 0.2, color: 'gold', width: 1.4 });
          s.arrow(0, 0, p1[0], p1[1], { color: 'accent', width: 2.6 }); s.arrow(0, 0, p2[0], p2[1], { color: 'orange', width: 2.6 });
          const wm = Math.max(0.5, ...W.map((q) => Math.abs(q[1])));
          sw.setView([0, T], [-1.15 * wm, 1.15 * wm]);
          sw.hline(0, { color: 'red', width: 1.2, alpha: 0.7 });
          sw.path(W, { color: 'gold', width: 2.8 }); sw.vline(ts, { color: 'muted', width: 1, dash: [4, 4] }); sw.dot(ts, W[k][1], { r: 6, color: 'gold' });
          let mn = Infinity; for (const q of W) mn = Math.min(mn, Math.abs(q[1]));
          info = { w0: W[0][1], wt: W[k][1], mn, ts, tex: S.tex };
        });
        v.readout(() => {
          if (!info) return '';
          const { w0, wt, mn, ts, tex } = info;
          return `$A(t)=${tex}$.\n$W(0)=${v.fix(w0, 3)}$, $W(${v.fix(ts, 2)})=${v.fix(wt, 3)}$, $\\min_{[0,6]}|W|=${v.fix(mn, 3)}$ — ${Math.abs(w0) < 1e-6 ? '**dependent solutions**: $W\\equiv0$.' : mn > 1e-6 ? 'never zero: the two solutions stay linearly independent, so $\\Phi(t)$ is a fundamental matrix.' : 'numerically zero.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Liouville’s formula (Abel’s identity)',
      statement: String.raw`Let $\Phi$ be a fundamental matrix of $\dot x=A(t)x$ with $A$ continuous. Then its Wronskian satisfies $W'=\operatorname{tr}A(t)\,W$, that is
$$\det\Phi(t)=\det\Phi(t_0)\,\exp\!\Big(\int_{t_0}^{t}\operatorname{tr}A(s)\,ds\Big).$$
Equivalently, the flow multiplies $n$-dimensional volume by $\exp\int\operatorname{tr}A$. For the second-order equation $y''+p(t)y'+q(t)y=0$ (with $x=(y,y')$, $\operatorname{tr}A=-p$) this is *Abel's identity*: the Wronskian of two solutions is $W(t_0)\exp\!\big(-\int_{t_0}^tp\big)$.`,
      idea: String.raw`Differentiate the determinant row by row (the determinant is multilinear, pma-9.34): $\frac{d}{dt}\det\Phi=\sum_i\det(\Phi\text{ with row }i\text{ replaced by its derivative})$. The derivative of row $i$ is $\sum_ja_{ij}\times$ row $j$; by the alternating property only the term $j=i$ survives, contributing $a_{ii}\det\Phi$. Summing gives $\operatorname{tr}A\det\Phi$, a scalar linear equation solved by separation (1.4).`,
      caption: String.raw`Edit the coefficients of $A(t)=\begin{pmatrix}a_1+b\cos\omega t&1\\-2&a_2+b\sin\omega t\end{pmatrix}$. Left: a unit disc of initial conditions is carried by the flow to time $t$; its area (computed from the polygon) is compared with $\pi\exp\int\operatorname{tr}A$. Right: the area ratio (gold, from the moving polygon), the Wronskian from the fundamental matrix (accent) and Liouville's prediction (green, dashed) lie on one curve.`,
      deps: ['ode-3.10', 'pma-9.34'],
      refs: ['Teschl §3.4'],
      credit: 'Abel, 1827 (second order); Liouville and Ostrogradski, 1838 (general)',
      tags: ['liouville formula', 'phase volume'],
      viz(v) {
        const a1 = v.slider('$a_1$', -1, 1, -0.2, { step: 0.02 });
        const a2 = v.slider('$a_2$', -1, 1, -0.1, { step: 0.02 });
        const bb = v.slider('$b$', 0, 1.5, 0.9, { step: 0.02 });
        const om = v.slider('$\\omega$', 0.3, 3, 1.4, { step: 0.02 });
        const tt = v.slider('time $t$', 0, 6, 3, { step: 0.02 });
        const T = 6, N = 240, M = 72;
        const s = v.stage({ x: [-3.5, 3.5], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x₁', ylabel: 'x₂', title: 'the unit disc of initial conditions, carried by the flow', weight: 1.1 });
        const sw = v.stage({ x: [0, T], y: [0, 3], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'ratio', title: 'volume factor', weight: 1, minWidth: 250 });
        v.legend([['accent', '$\\det\\Phi(t)$ (fundamental matrix)'], ['gold', 'area of the polygon $/\\pi$', { dot: true }], ['green', '$\\exp\\int_0^t\\operatorname{tr}A$', { dash: true }], ['faint', 'initial disc']]);
        const circ = Array.from({ length: M }, (_, i) => [Math.cos((2 * Math.PI * i) / M), Math.sin((2 * Math.PI * i) / M)]);
        let info = null, last = '', cache = null;
        v.render(() => {
          const key = [a1.value, a2.value, bb.value, om.value].join('|');
          if (key !== last) {
            last = key;
            const Af = (t) => [[a1.value + bb.value * Math.cos(om.value * t), 1], [-2, a2.value + bb.value * Math.sin(om.value * t)]];
            const orbits = circ.map((p) => flow((t, x) => mvec(Af(t), x), 0, p, T, N).map((q) => q[1]));
            const Phi = matFlow(Af, eye(2), 0, T, N, true);
            cache = { orbits, Phi };
          }
          const { orbits, Phi } = cache, k = Math.round((tt.value / T) * N);
          const ints = (t) => a1.value * t + a2.value * t + bb.value * (Math.sin(om.value * t) / om.value + (1 - Math.cos(om.value * t)) / om.value);
          const poly = orbits.map((o) => o[k]);
          s.path(circ.concat([circ[0]]), { color: 'faint', width: 1.2 });
          s.clip(() => s.poly(poly, { fill: 'gold', fillAlpha: 0.16, color: 'gold', width: 2.4 }));
          const area = Math.abs(polyArea(poly));
          const W = [], G = [], Ar = [];
          for (let i = 0; i <= N; i += 2) { const t = (T * i) / N; W.push([t, Phi[i][1][0][0] * Phi[i][1][1][1] - Phi[i][1][0][1] * Phi[i][1][1][0]]); G.push([t, Math.exp(ints(t))]); Ar.push([t, Math.abs(polyArea(orbits.map((o) => o[i]))) / Math.PI]); }
          const top = Math.max(1.5, ...W.map((q) => q[1]), ...G.map((q) => q[1]));
          sw.setView([0, T], [0, Math.min(1.1 * top, 60)]);
          sw.path(G, { color: 'green', width: 2.4, dash: [7, 5] }); sw.path(W, { color: 'accent', width: 2.6 });
          Ar.forEach((q, i) => { if (i % 3 === 0) sw.dot(q[0], q[1], { r: 3.2, color: 'gold' }); });
          sw.vline(tt.value, { color: 'muted', width: 1, dash: [4, 4] });
          let dev = 0; for (let i = 0; i < W.length; i++) dev = Math.max(dev, Math.abs(W[i][1] - G[i][1]) / Math.max(1, G[i][1]));
          let dev2 = 0; for (let i = 0; i < W.length; i++) dev2 = Math.max(dev2, Math.abs(Ar[i][1] - G[i][1]) / Math.max(1, G[i][1]));
          info = { area, pred: Math.PI * Math.exp(ints(tt.value)), dev, dev2, tr0: a1.value + a2.value + bb.value };
        });
        v.readout(() => {
          if (!info) return '';
          return `At time $t=${v.fix(tt.value, 2)}$: area of the evolved disc $=${v.fix(info.area, 4)}$; $\\pi\\exp\\int_0^t\\operatorname{tr}A=${v.fix(info.pred, 4)}$. Largest relative gap over $[0,6]$: Wronskian vs formula $${v.sci(Math.max(info.dev, 1e-16), 1)}$, polygon area vs formula $${v.sci(Math.max(info.dev2, 1e-16), 1)}$ (polygon with ${M} vertices).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Method',
      name: 'Variation of constants (Duhamel’s formula)',
      statement: String.raw`Let $A$ and $g$ be continuous on an interval and let $\Phi(t,s)$ be the principal matrix of $\dot x=A(t)x$. The solution of $\dot x=A(t)x+g(t)$ with $x(t_0)=x_0$ is
$$x(t)=\Phi(t,t_0)x_0+\int_{t_0}^{t}\Phi(t,s)\,g(s)\,ds .$$
For constant $A$, $\Phi(t,s)=e^{(t-s)A}$. The integral is a superposition of free evolutions of "impulses" $g(s)\,ds$ delivered at the times $s$; each decays or grows from its arrival time according to the homogeneous system.`,
      idea: String.raw`Look for a solution $x=\Phi(t,t_0)c(t)$ with variable coefficients (the constants "vary"). Then $\dot x=A\Phi c+\Phi\dot c$, so $\Phi\dot c=g$, $\dot c=\Phi(t_0,t)g(t)$, and integrating $c$ gives the formula (with 3.3 for the constant case). Reading it as a Riemann sum, each slice $g(s_j)\Delta s$ is a small kick that evolves freely afterwards by linearity (3.1); the full response is the sum of the evolved kicks.`,
      caption: String.raw`Edit the forcing $f(s)$ for the oscillator $\ddot y+2\zeta\omega_0\dot y+\omega_0^2y=f(t)$ ($\omega_0=1$, starting at rest) by dragging the knots. The right panel cuts $f$ into $N$ slices; each slice launches a decaying wave $f(s_j)\Delta s\,h(t-s_j)$ (faint curves, $h$ the impulse response). Their sum (accent) matches the RK4 solution of the ODE (green, dashed) as $N$ grows. Move $t$ to see which slices have been delivered so far.`,
      deps: ['ode-3.10', 'ode-3.3'],
      refs: ['Teschl §3.4 pp. 83–84, Theorem 3.12, Eqs. (3.92)–(3.97)'],
      credit: 'Mathematical source: G. Teschl, Ordinary Differential Equations and Dynamical Systems, full author preliminary edition; exact theorem and equation locators are listed in the references',
      sourceUrl: 'https://www.mat.univie.ac.at/~gerald/ftp/book-ode/ode.pdf',
      tags: ['variation of constants', 'impulse response'],
      viz(v) {
        const zeta = v.slider('damping $\\zeta$', 0.05, 1.2, 0.18, { step: 0.01 });
        const NN = v.slider('number of slices $N$', 4, 80, 14, { int: true });
        const tt = v.slider('time $t$', 0, 12, 12, { step: 0.05 });
        const T = 12;
        const sf = v.stage({ x: [0, T], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 320, xlabel: 's', ylabel: 'f', title: 'forcing $f(s)$ cut into slices (drag the knots)', weight: 1, minWidth: 260 });
        const sy = v.stage({ x: [0, T], y: [-3.2, 3.2], axes: 'box', gutter: true, height: 320, xlabel: 't', ylabel: 'y', title: 'response: sum of evolved kicks', weight: 1.2 });
        const ks = [0, 2, 4, 6, 8, 10, 12], f0 = [0, 1, 0.6, -0.8, -1, 0.2, 0];
        const KH = ks.map((k, i) => sf.handle(k, f0[i], { color: 'accent', constrain: { x: [k, k], y: [-1.4, 1.4] } }));
        v.legend([['faint', 'single kicks $f(s_j)\\Delta s\\,h(t-s_j)$'], ['accent', 'their sum'], ['green', 'RK4 solution of the ODE', { dash: true }]]);
        let info = null;
        v.render(() => {
          const z = zeta.value, A = [[0, 1], [-1, -2 * z]], N = NN.value;
          const f = spline(ks, KH.map((h) => h.y));
          const hf = (tau) => (tau < 0 ? 0 : expm(A, tau)[0][1]);
          sf.fn(f, { color: 'accent', width: 2.4, domain: [0, T] });
          const dS = T / N, tn = tt.value;
          for (let j = 0; j < N; j++) { const sj = (j + 0.5) * dS, w = f(sj) * dS; sf.rect(j * dS, 0, (j + 1) * dS, f(sj), { fill: sj <= tn ? 'orange' : 'muted', fillAlpha: sj <= tn ? 0.4 : 0.15, color: 'muted', width: 0.6 }); }
          sf.vline(tn, { color: 'muted', width: 1, dash: [4, 4] });
          const hs = []; for (let i = 0; i <= 240; i++) hs.push(i * T / 240); const H = hs.map((tau) => hf(tau));
          const hAt = (tau) => { if (tau < 0) return 0; const u = (tau / T) * 240, i = Math.min(239, Math.floor(u)), w = u - i; return H[i] * (1 - w) + H[i + 1] * w; };
          const total = hs.map(() => 0);
          for (let j = 0; j < N; j++) {
            const sj = (j + 0.5) * dS, w = f(sj) * dS, pts = [];
            for (let i = 0; i <= 240; i++) { const t = hs[i], y = t >= sj ? w * hAt(t - sj) : 0; if (t <= tn) total[i] += y; if (t >= sj && t <= tn) pts.push([t, y]); }
            if (pts.length > 1) sy.path(pts, { color: 'faint', width: 1, alpha: 0.9 });
          }
          sy.path(hs.map((t, i) => [t, total[i]]).filter(([t]) => t <= tn), { color: 'accent', width: 2.8 });
          const rk = flow((t, x) => [x[1], -x[0] - 2 * z * x[1] + f(t)], 0, [0, 0], T, 600);
          sy.path(rk.map(([t, x]) => [t, x[0]]).filter(([t]) => t <= tn), { color: 'green', width: 2, dash: [6, 4] });
          // error at tn
          let k = 0; while (k < 240 && hs[k] < tn) k++;
          const ri = Math.min(599, Math.floor((tn / T) * 600)), rw = (tn / T) * 600 - ri;
          const ex = rk[ri][1][0] * (1 - rw) + rk[ri + 1][1][0] * rw;
          info = { sum: total[Math.min(240, Math.round((tn / T) * 240))], ex, N };
        });
        v.readout(() => {
          if (!info) return '';
          return `With $N=${info.N}$ kicks the sum gives $y(${v.fix(tt.value, 2)})\\approx${v.fix(info.sum, 4)}$; the ODE solver gives $${v.fix(info.ex, 4)}$ (difference $${v.sci(Math.max(1e-16, Math.abs(info.sum - info.ex)), 1)}$, shrinking like $1/N^{2}$ for the midpoint slices).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Order-n linear equations and the characteristic polynomial',
      statement: String.raw`Consider $y^{(n)}+a_{n-1}y^{(n-1)}+\dots+a_1y'+a_0y=0$ with constant coefficients and characteristic polynomial $p(\lambda)=\lambda^n+a_{n-1}\lambda^{n-1}+\dots+a_0$. It is equivalent to the first-order system $\dot x=Cx$ for $x=(y,y',\dots,y^{(n-1)})$ with the companion matrix $C$, whose characteristic polynomial is $p$. If $p=\prod_k(\lambda-\lambda_k)^{m_k}$, then the $n$ functions
$$t^{j}e^{\lambda_kt}\quad(0\le j<m_k)$$
form a basis of the (complex) solutions; for a real equation a complex pair $\alpha\pm i\beta$ of multiplicity $m$ contributes the real functions $t^je^{\alpha t}\cos\beta t$ and $t^je^{\alpha t}\sin\beta t$, $j<m$.`,
      idea: String.raw`The companion matrix has a single eigenvector $(1,\lambda,\dots,\lambda^{n-1})$ for each root, so each root has exactly one Jordan block of size equal to its multiplicity; 3.7 then gives the solutions $t^je^{\lambda t}$ for $y$ itself. Directly: writing $D=d/dt$, the equation is $p(D)y=0$, and $(D-\lambda)^m$ kills $t^je^{\lambda t}$ for $j<m$ because $(D-\lambda)(t^je^{\lambda t})=jt^{j-1}e^{\lambda t}$. The $n$ functions are independent (the Wronskian is non-zero at $0$, 3.10).`,
      caption: String.raw`Drag the real roots $\rho_1,\rho_2$ and the complex pair $\mu$ in the left plane; the multiplicity sliders set how often each is repeated. The right panel draws the basis solutions $t^je^{\lambda t}$ (real and imaginary parts for $\mu$). The readout writes the polynomial and checks, by applying the operator $p(D)$ to each basis function exactly (as an exponential polynomial), that every residual is zero.`,
      deps: ['ode-3.5', 'ode-3.7'],
      refs: ['Teschl §3.3'],
      tags: ['characteristic polynomial', 'higher order'],
      viz(v) {
        const m1 = v.slider('multiplicity of $\\rho_1$', 0, 3, 1, { int: true });
        const m2 = v.slider('multiplicity of $\\rho_2$', 0, 2, 1, { int: true });
        const m3 = v.slider('multiplicity of $\\alpha\\pm i\\beta$', 0, 2, 1, { int: true });
        const sR = v.stage({ x: [-2.5, 2.5], y: [-3.4, 3.4], axes: true, height: 380, xlabel: 'Re λ', ylabel: 'Im λ', title: 'roots of $p$', weight: 0.8, minWidth: 220 });
        const s = v.stage({ x: [0, 6], y: [-4, 4], axes: 'box', gutter: true, height: 380, xlabel: 't', ylabel: 'y', title: 'basis solutions', weight: 1.4 });
        const R1 = sR.handle(-1.2, 0, { color: 'accent', label: '$\\rho_1$', labelPos: 'ne', constrain: { x: [-2.3, 2.3], y: [0, 0] } });
        const R2 = sR.handle(0.4, 0, { color: 'orange', label: '$\\rho_2$', labelPos: 'ne', constrain: { x: [-2.3, 2.3], y: [0, 0] } });
        const MU = sR.handle(-0.8, 1.8, { color: 'green', label: '$\\mu$', labelPos: 'ne', constrain: { x: [-2.3, 2.3], y: [0.25, 3.2] } });
        let info = null;
        v.render(() => {
          let a = m1.value, b = m2.value, c = m3.value;
          if (a + b + c === 0) { a = 1; m1.set(1); }
          const groups = [];
          if (a) groups.push({ l: [R1.x, 0], m: a, real: true });
          if (b) groups.push({ l: [R2.x, 0], m: b, real: true });
          if (c) groups.push({ l: [MU.x, MU.y], m: c, real: false });
          const roots = [];
          for (const g of groups) for (let k = 0; k < g.m; k++) { roots.push(g.l); if (!g.real) roots.push([g.l[0], -g.l[1]]); }
          const n = roots.length, coef = polyFromRootsC(roots).map((z) => z[0]);   // real polynomial: ascending a_0..a_n
          sR.vline(0, { color: 'red', width: 1.2, alpha: 0.5 });
          for (const g of groups) { sR.dot(g.l[0], g.l[1], { r: 5 + 2 * g.m, color: g.real ? 'accent' : 'green', label: g.m > 1 ? `×${g.m}` : undefined, labelPos: 'se' }); if (!g.real) sR.dot(g.l[0], -g.l[1], { r: 5 + 2 * g.m, color: 'green', hollow: true }); }
          // basis functions and residuals of p(D)
          const funcs = []; let worst = 0, ci = 0;
          for (const g of groups) for (let j = 0; j < g.m; j++) {
            const cc = new Array(j + 1).fill(0).map(() => [0, 0]); cc[j] = [1, 0]; const E = { l: g.l, c: cc };
            // residual: sum_k a_k D^k E at samples
            let Dk = E, res = 0;
            const derivs = [E]; for (let k = 1; k <= n; k++) derivs.push(epoly.deriv(derivs[k - 1]));
            for (let ti = 0; ti <= 12; ti++) { const t = ti * 0.25; let sacc = [0, 0]; for (let k = 0; k <= n; k++) sacc = C.add(sacc, C.mul([coef[k], 0], epoly.value(derivs[k], t))); const sc = Math.max(1, C.abs(epoly.value(E, t)), ...derivs.map((d) => C.abs(epoly.value(d, t)))); res = Math.max(res, C.abs(sacc) / sc); }
            worst = Math.max(worst, res);
            const col = COLS[ci++ % COLS.length];
            if (g.real) s.fn((t) => epoly.value(E, t)[0], { color: col, width: 2.2, domain: [0, 6], n: 300 });
            else { const c2 = COLS[ci++ % COLS.length]; s.fn((t) => epoly.value(E, t)[0], { color: col, width: 2.2, domain: [0, 6], n: 400 }); s.fn((t) => epoly.value(E, t)[1], { color: c2, width: 2.2, domain: [0, 6], n: 400 }); }
          }
          info = { n, coef, worst };
        });
        v.readout(() => {
          if (!info) return '';
          const { n, coef, worst } = info;
          const terms = []; for (let k = n; k >= 0; k--) { const a = coef[k]; if (Math.abs(a) < 5e-4 && k < n) continue; const mag = v.fix(Math.abs(a), 2), pow = k === 0 ? '' : k === 1 ? '\\lambda' : `\\lambda^{${k}}`; terms.push((terms.length ? (a < 0 ? '-' : '+') : a < 0 ? '-' : '') + (k === n ? '' : k === 0 ? mag : mag === '1.00' ? '' : mag) + pow); }
          return `Order $n=${n}$: $p(\\lambda)=${terms.join('')}$. Largest relative residual of $p(D)y_i=0$ over the $n$ basis functions: $${worst < 1e-12 ? '<10^{-12}' : v.sci(worst, 2)}$ — they are all solutions, and they are $n$ independent ones.`;
        });
      },
    },
  ],
};
