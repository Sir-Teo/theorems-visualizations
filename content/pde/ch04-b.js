// Partial Differential Equations — Chapter 4: Separation of variables and Fourier series (part b: 4.5, 4.6, 4.7, 4.9)
import { eigModes, trigCoef, trigSum, bernoulliPeriodic } from './ch04.shared.js';

// 2π-periodic test functions on (−π, π] shared by 4.6 and 4.7
const wrap = (x) => { const t = (((x + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); return t - Math.PI; };
const FUNS = {
  square: { f: (x) => { const y = wrap(x); return y === 0 ? 0 : Math.sign(y); }, jumps: [0, Math.PI], label: 'square wave (jumps)' },
  saw: { f: (x) => wrap(x) / Math.PI, jumps: [Math.PI], label: 'sawtooth (jump at $\\pm\\pi$)' },
  tri: { f: (x) => Math.abs(wrap(x)) / Math.PI, jumps: [], label: 'triangle (kinks)' },
  spike: { f: (x) => Math.exp(-((wrap(x) / 0.35) ** 2)), jumps: [], label: 'smooth spike' },
};

export default {
  collection: 'pde',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Orthogonal eigenfunctions for symmetric boundary conditions',
      statement: String.raw`Let $X_m,X_n$ be eigenfunctions of $-X''=\lambda X$ on $[a,b]$, with eigenvalues $\lambda_m\ne\lambda_n$, under boundary conditions that are *symmetric*, meaning that $\big[f'g-fg'\big]_a^b=0$ for every pair $f,g$ obeying them (this holds for Dirichlet, Neumann, periodic and Robin conditions at each end, with any real Robin coefficients, and for mixtures). Then $\int_a^bX_mX_n\,dx=0$. Moreover all eigenvalues are real, and, since the quotient $\lambda=\int X'^2+\text{(boundary terms)}\Big/\int X^2$ is positive when the boundary terms are, all eigenvalues are positive for Dirichlet and for Robin conditions with $h\ge0$. For conditions that are not symmetric the conclusion can fail.`,
      idea: String.raw`Multiply $-X_m''=\lambda_mX_m$ by $X_n$ and $-X_n''=\lambda_nX_n$ by $X_m$ and subtract; the left side is $-(X_m''X_n-X_mX_n'')=-(X_m'X_n-X_mX_n')'$, an exact derivative, so integrating over $[a,b]$ gives $(\lambda_n-\lambda_m)\int X_mX_n=\big[X_m'X_n-X_mX_n'\big]_a^b$ (Green's second identity in one dimension, vcalc-8.9). Symmetric boundary conditions are exactly those that kill the right side. Hence orthogonality; reality of $\lambda$ follows by applying the same identity with $X_n=\overline{X_m}$.`,
      caption: String.raw`Pick the boundary condition at each end ($h$ is the Robin coefficient). The heat map is the matrix of numerical inner products $\langle X_i,X_j\rangle=\int_0^1X_iX_j\,dx$ of the first eight eigenfunctions (found numerically for Robin; the numbers shown are those above $0.005$): diagonal for every symmetric choice. The sliders $m,n$ test the identity $(\lambda_n-\lambda_m)\langle X_m,X_n\rangle=[X_m'X_n-X_mX_n']_0^1$ with both sides computed independently. Switch on *break symmetry*: the condition $u(0)=0$, $u'(1)=a\,u'(0)$ couples the two ends, the boundary term no longer vanishes and the matrix gets off-diagonal entries. (These real eigenfunctions $\sin\mu x$, $\cos\mu=a$, do not even form a complete set: this operator is not self-adjoint.)`,
      deps: ['pde-4.3', 'vcalc-8.9'],
      refs: ['Strauss §5.3'],
      credit: 'Sturm & Liouville, 1836–37',
      verify: true,
      tags: ['orthogonality', 'eigenfunctions', 'self-adjoint'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm%E2%80%93Liouville_theory' },
      viz(v) {
        const M = v.M, K = 8, NQ = 800;
        const L = v.select('left end', [{ value: 'D', label: 'D' }, { value: 'N', label: 'N' }, { value: 'R', label: 'Robin' }], 'D');
        const R = v.select('right end', [{ value: 'D', label: 'D' }, { value: 'N', label: 'N' }, { value: 'R', label: 'Robin' }], 'R');
        const hS = v.slider('Robin coefficient $h$', 0.1, 15, 3, { step: 0.1 });
        const brk = v.toggle('break symmetry: $u(0)=0,\\ u\'(1)=a\\,u\'(0)$', false);
        const aS = v.slider('$a$', -0.9, 0.9, 0.5, { step: 0.05 });
        const mS = v.slider('$m$', 1, K, 1, { int: true });
        const nS = v.slider('$n$', 1, K, 3, { int: true });
        const G = v.stage({ x: [0.5, K + 0.5], y: [0.5, K + 0.5], equal: true, axes: 'box', gutter: true, height: 330, xlabel: 'j', ylabel: 'i', title: 'Gram matrix $\\langle X_i,X_j\\rangle$', minWidth: 300, xticks: M.range(K).map((i) => i + 1), yticks: M.range(K).map((i) => i + 1) });
        const E = v.stage({ x: [0, 1], y: [-2, 2], axes: 'box', gutter: true, height: 330, xlabel: 'x', title: 'the first four eigenfunctions', minWidth: 280 });
        let key = '', modes = [], gram = [], offmax = 0, lhs = 0, rhs = 0;
        const build = () => {
          const k = [brk.value, L.value, R.value, hS.value, aS.value].join();
          if (k === key) return; key = k;
          if (brk.value) {
            const a = aS.value, th = Math.acos(a), mus = [];
            for (let j = 0; mus.length < K; j++) { mus.push(th + 2 * Math.PI * j); if (mus.length < K) mus.push(2 * Math.PI - th + 2 * Math.PI * j); }
            modes = mus.sort((p, q) => p - q).map((mu) => {
              let s = 0; for (let i = 0; i < 400; i++) s += Math.sin(mu * (i + 0.5) / 400) ** 2; const nr = Math.sqrt(s / 400);
              return { lam: mu * mu, X: (x) => Math.sin(mu * x) / nr, dX: (x) => (mu * Math.cos(mu * x)) / nr };
            });
          } else modes = eigModes(L.value, R.value, hS.value, hS.value, K);
          gram = modes.map((p) => modes.map((q) => { let s = 0; for (let i = 0; i < NQ; i++) { const x = (i + 0.5) / NQ; s += p.X(x) * q.X(x); } return s / NQ; }));
          offmax = 0; gram.forEach((row, i) => row.forEach((val, j) => { if (i !== j) offmax = Math.max(offmax, Math.abs(val)); }));
        };
        v.render(() => {
          build();
          aS.el.hidden = !brk.value; hS.el.hidden = brk.value || (L.value !== 'R' && R.value !== 'R'); L.el.hidden = brk.value; R.el.hidden = brk.value;
          const n = modes.length;
          G.heat((x, y) => { const i = Math.round(y) - 1, j = Math.round(x) - 1; return i >= 0 && j >= 0 && i < n && j < n ? gram[i][j] : 0; }, { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 2, key: key + 'h' });
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i === j || Math.abs(gram[i][j]) > 0.005) G.text(v.fix(gram[i][j], 2), j + 1, i + 1, { size: 10.5, align: 'center', baseline: 'middle', color: i === j ? 'ink' : 'ink' });
          modes.slice(0, 4).forEach((m, i) => E.fn(m.X, { color: ['accent', 'orange', 'green', 'purple'][i], width: 2.2 }));
          const m = modes[mS.value - 1], q = modes[nS.value - 1];
          const ip = gram[mS.value - 1][nS.value - 1];
          lhs = (q.lam - m.lam) * ip;
          rhs = m.dX(1) * q.X(1) - m.X(1) * q.dX(1) - (m.dX(0) * q.X(0) - m.X(0) * q.dX(0));
        });
        v.legend([['accent', '$X_1$'], ['orange', '$X_2$'], ['green', '$X_3$'], ['purple', '$X_4$']]);
        v.readout(() => `largest off-diagonal entry: ${v.sci(offmax, 2).replace(/^/, '$') + '$'} ${offmax < 1e-4 ? '✓ orthogonal' : '✗ not orthogonal: the boundary term does not vanish'}\n$(\\lambda_n-\\lambda_m)\\langle X_m,X_n\\rangle=${v.fix(lhs, 5)}$ and $[X_m'X_n-X_mX_n']_0^1=${v.fix(rhs, 5)}$ (for $m=${mS.value}$, $n=${nS.value}$)`);
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Mean-square convergence and Parseval’s identity',
      statement: String.raw`Let $f$ be square-integrable on $(-\pi,\pi)$ with Fourier coefficients $a_n,b_n$ and partial sums $S_N=\frac{a_0}2+\sum_{n\le N}(a_n\cos nx+b_n\sin nx)$. Then $S_N$ is the best approximation to $f$ in $L^2$ among trigonometric polynomials of degree $\le N$, the *Bessel inequality* $\pi\big(\tfrac{a_0^2}2+\sum_{n\le N}a_n^2+b_n^2\big)\le\int f^2$ holds, and the trigonometric system is complete: $\|f-S_N\|_{L^2}\to0$. Equivalently, *Parseval's identity* holds,
$$\int_{-\pi}^\pi f(x)^2\,dx=\pi\Big(\frac{a_0^2}2+\sum_{n=1}^\infty a_n^2+b_n^2\Big),$$
and $\|f-S_N\|^2=\|f\|^2-\pi\big(\tfrac{a_0^2}2+\sum_{n\le N}a_n^2+b_n^2\big)$ exactly. Mean-square convergence does *not* imply pointwise or uniform convergence.`,
      idea: String.raw`The orthogonality relations (4.5, pma-8.10) make $S_N$ the orthogonal projection onto a finite-dimensional subspace, so the Pythagorean identity gives $\|f\|^2=\|S_N\|^2+\|f-S_N\|^2$ and with it Bessel's inequality and the exact formula for the error. Completeness is the real content: continuous functions are uniformly approximable by trigonometric polynomials (Weierstrass), hence in $L^2$; continuous functions are dense in $L^2$; the best-approximation property then transfers the approximation to the Fourier partial sums (see pma-11.40 and rca-4.26 for the Hilbert-space proof).`,
      caption: String.raw`Choose a function and add Fourier terms with the slider $N$. Top: $f$ (grey), $S_N$ (orange). Middle: $\|f-S_N\|^2$ against $N$ on a log scale (it decreases monotonically, as the best-approximation property demands) with the current $N$ marked. Right: the bar fills up to $\|f\|^2$ as the Parseval sum $\pi(\frac{a_0^2}{2}+\sum a_n^2+b_n^2)$ accumulates. The readout checks $\|f-S_N\|^2$ computed directly by quadrature against $\|f\|^2$ minus the partial Parseval sum. The *sup* error of the square wave never goes to zero (the Gibbs overshoot, 4.8), though its $L^2$ error does.`,
      deps: ['pde-4.4', 'pma-11.40', 'rca-4.26'],
      refs: ['Strauss §5.4'],
      credit: 'identity of Parseval, 1799 (for series); completeness for $L^2$: Riesz and Fischer, 1907',
      verify: true,
      tags: ['Parseval', 'L2 convergence', 'completeness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parseval%27s_identity' },
      viz(v) {
        const M = v.M, KM = 64;
        const fsel = v.select('function', Object.keys(FUNS).map((k) => ({ value: k, label: FUNS[k].label })), 'square');
        const nS = v.slider('terms $N$', 0, KM, 5, { int: true });
        const A = v.stage({ x: [-Math.PI, Math.PI], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 240, xlabel: 'x', title: '$f$ and $S_N$', minWidth: 300, xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']] });
        const B = v.stage({ x: [0, KM], y: [1e-3, 10], ylog: true, axes: 'box', gutter: true, height: 240, xlabel: 'N', title: '$\\|f-S_N\\|^2$ (log scale)', minWidth: 250 });
        const C = v.stage({ x: [0, 1], y: [0, 1.1], axes: 'box', gutter: true, height: 240, title: 'Parseval sum / $\\|f\\|^2$', minWidth: 160, weight: 0.45, xticks: [] });
        let key = '', cf = null, nf = 0, err = [], direct = 0, supErr = 0, via = 0, frac = 0;
        v.render(() => {
          if (key !== fsel.value) { key = fsel.value; cf = trigCoef(FUNS[key].f, KM); nf = 0; const nq = 4000; for (let i = 0; i < nq; i++) { const x = -Math.PI + ((i + 0.5) * 2 * Math.PI) / nq; nf += FUNS[key].f(x) ** 2 * ((2 * Math.PI) / nq); }
            err = []; let acc = (Math.PI * cf.a[0] ** 2) / 2; err.push(nf - acc); for (let n = 1; n <= KM; n++) { acc += Math.PI * (cf.a[n] ** 2 + cf.b[n] ** 2); err.push(Math.max(1e-12, nf - acc)); } }
          const f = FUNS[key].f, N = nS.value;
          A.fn(f, { color: 'muted', width: 1.8, n: 800 });
          A.fn((x) => trigSum(cf, N, x), { color: 'orange', width: 2.4, n: 800 });
          const lo = Math.min(...err.slice(1)) / 2, hi = Math.max(...err) * 2;
          B.setScale({ ylog: true, y: [Math.max(1e-6, lo), hi] });
          B.path(err.map((e, n) => [n, e]), { color: 'accent', width: 2.2 });
          B.dot(N, err[N], { color: 'orange', r: 6 });
          let acc = (Math.PI * cf.a[0] ** 2) / 2; for (let n = 1; n <= N; n++) acc += Math.PI * (cf.a[n] ** 2 + cf.b[n] ** 2);
          via = nf - acc; frac = acc / nf;
          C.rect(0.15, 0, 0.85, 1, { color: 'ink', width: 1.5, fill: false });
          C.rect(0.15, 0, 0.85, Math.min(1, frac), { fill: 'green', fillAlpha: 0.55, stroke: false });
          C.hline(1, { color: 'ink', width: 1.5, dash: [4, 3] });
          let d = 0, sup = 0; const nq = 2000; for (let i = 0; i < nq; i++) { const x = -Math.PI + ((i + 0.5) * 2 * Math.PI) / nq, e = f(x) - trigSum(cf, N, x); d += (e * e * 2 * Math.PI) / nq; sup = Math.max(sup, Math.abs(e)); }
          direct = d; supErr = sup;
        });
        v.legend([['muted', '$f$'], ['orange', '$S_N$'], ['green', 'Parseval partial sum', { area: true }]]);
        v.readout(() => `$\\|f\\|^2=${v.fix(nf, 4)}$ · $\\|f-S_N\\|^2$ by quadrature $=${v.fix(direct, 5)}$ and $\\|f\\|^2-\\pi(\\dots)=${v.fix(via, 5)}$ ✓ · Parseval sum is ${v.fix(100 * frac, 3)}% of $\\|f\\|^2$ · $\\sup|f-S_N|=${v.fix(supErr, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Pointwise and uniform convergence of Fourier series',
      statement: String.raw`Let $f$ be $2\pi$-periodic and piecewise $C^1$ (finitely many jumps, with $f'$ piecewise continuous). Then at every point $x$ the partial sums converge to the average of the one-sided limits, $S_N(x)\to\tfrac12\big(f(x^+)+f(x^-)\big)$ (so to $f(x)$ where $f$ is continuous). If in addition $f$ is continuous, the convergence is *uniform* on $\R$ and $\sum(|a_n|+|b_n|)<\infty$. Without continuity the convergence is still uniform on every closed interval free of jumps, but not near a jump.`,
      idea: String.raw`Write $S_N(x)=\frac1\pi\int f(x+y)D_N(y)\,dy$ with the Dirichlet kernel $D_N(y)=\frac{\sin((N+\frac12)y)}{2\sin(y/2)}$. Subtracting the average of the one-sided limits leaves $\int g(y)\sin((N+\tfrac12)y)\,dy$ where $g(y)=\big(f(x+y)-f(x^\pm)\big)/(2\sin\frac y2)$ is bounded (this is where piecewise differentiability enters) and so integrable; the Riemann–Lebesgue lemma sends this to $0$. For continuous piecewise $C^1$ $f$, Bessel's inequality (4.6) applied to $f'$ gives $\sum n^2(a_n^2+b_n^2)<\infty$, hence by Cauchy–Schwarz $\sum(|a_n|+|b_n|)<\infty$, and the Weierstrass $M$-test (pma-7.10) gives uniform convergence.`,
      caption: String.raw`Choose a function and move the gold probe along the axis. Left: $f$ and the partial sum $S_N$. Middle: the value $S_N(x_0)$ at the probe for $N=1,2,\dots,80$, converging to the green target line, the average of the one-sided limits (at a jump it is the *midpoint* of the jump, not either side). Right: the sup error on log–log axes for all of $\R$ (blue) and for the part of the circle at distance $\ge0.3$ from every jump (orange). For the triangle wave both go to zero like $1/N$; for the square wave only the orange curve does, while the blue stays at about $1$, half the size of the jump, however many terms you take. The cusp $|x|^{1/2}$ is continuous but not piecewise $C^1$: convergence is still uniform but slow, about $N^{-1/2}$.`,
      deps: ['pde-4.6', 'pma-8.14', 'pma-7.10'],
      refs: ['Strauss §5.4'],
      credit: 'Dirichlet, 1829',
      verify: true,
      tags: ['pointwise convergence', 'uniform convergence', 'Dirichlet kernel'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convergence_of_Fourier_series' },
      viz(v) {
        const M = v.M, NM = 80;
        const F2 = { ...FUNS, cusp: { f: (x) => Math.sqrt(Math.abs(wrap(x))) / 1.7, jumps: [], label: 'cusp $|x|^{1/2}$' } };
        delete F2.spike;
        const fsel = v.select('function', Object.keys(F2).map((k) => ({ value: k, label: F2[k].label })), 'square');
        const nS = v.slider('terms $N$', 1, NM, 10, { int: true });
        const A = v.stage({ x: [-Math.PI, Math.PI], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: '$f$ and $S_N$', minWidth: 280, xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']] });
        const B = v.stage({ x: [0, NM], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 250, xlabel: 'N', title: '$S_N(x_0)$ at the probe', minWidth: 250 });
        const C = v.stage({ x: [1, NM], y: [1e-3, 2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 250, xlabel: 'N', title: 'sup error', minWidth: 250 });
        const P = A.handle(1.2, -1.35, { color: 'gold', r: 8, label: 'probe', constrain: (x) => [M.clamp(x, -Math.PI, Math.PI), -1.35] });
        let key = '', cf = null, supAll = [], supAway = [], grid = [];
        const NG = 721;
        const build = () => {
          cf = trigCoef(F2[key].f, NM, 3000);
          grid = Array.from({ length: NG }, (_, i) => -Math.PI + (2 * Math.PI * i) / (NG - 1));
          const fv = grid.map(F2[key].f), S = grid.map(() => cf.a[0] / 2);
          const jumps = F2[key].jumps.flatMap((j) => [j, j - 2 * Math.PI, j + 2 * Math.PI]);
          const far = grid.map((x) => jumps.every((j) => Math.abs(x - j) >= 0.3));
          supAll = []; supAway = [];
          for (let n = 1; n <= NM; n++) {
            let sa = 0, sf = 0;
            for (let i = 0; i < NG; i++) { S[i] += cf.a[n] * Math.cos(n * grid[i]) + cf.b[n] * Math.sin(n * grid[i]); const e = Math.abs(S[i] - fv[i]); if (e > sa) sa = e; if (far[i] && e > sf) sf = e; }
            supAll.push(Math.max(1e-6, sa)); supAway.push(Math.max(1e-6, sf));
          }
        };
        let tgt = 0, curv = 0, dev = 0, slope = 0;
        v.render(() => {
          if (key !== fsel.value) { key = fsel.value; build(); }
          const f = F2[key].f, N = nS.value, x0 = P.x;
          A.fn(f, { color: 'muted', width: 1.8, n: 800 });
          A.fn((x) => trigSum(cf, N, x), { color: 'orange', width: 2.4, n: 800 });
          A.vline(x0, { color: 'gold', width: 1.4, dash: [4, 3] });
          tgt = 0.5 * (f(x0 + 1e-9) + f(x0 - 1e-9));
          const seq = []; let s = cf.a[0] / 2; seq.push([0, s]);
          for (let n = 1; n <= NM; n++) { s += cf.a[n] * Math.cos(n * x0) + cf.b[n] * Math.sin(n * x0); seq.push([n, s]); }
          B.hline(tgt, { color: 'green', width: 2 });
          B.path(seq, { color: 'orange', width: 1.8 }); B.dot(N, seq[N][1], { color: 'orange', r: 6 });
          curv = seq[N][1]; dev = Math.abs(seq[NM][1] - tgt);
          C.path(supAll.map((e, i) => [i + 1, e]), { color: 'accent', width: 2.2 });
          if (F2[key].jumps.length) C.path(supAway.map((e, i) => [i + 1, e]), { color: 'orange', width: 2.2 });
          C.dot(N, supAll[N - 1], { color: 'accent', r: 5 });
          const a0 = 20, pts = []; for (let n = a0; n <= NM; n++) pts.push([Math.log(n), Math.log(F2[key].jumps.length ? supAway[n - 1] : supAll[n - 1])]);
          slope = M.linreg(pts.map((p) => p[0]), pts.map((p) => p[1])).slope;
        });
        v.legend([['muted', '$f$'], ['orange', '$S_N$ / sup error away from jumps'], ['accent', 'sup error on all of $\\R$'], ['green', 'average of one-sided limits']]);
        v.readout(() => `$S_{${nS.value}}(x_0)=${v.fix(curv, 4)}$, target $\\frac12(f(x_0^+)+f(x_0^-))=${v.fix(tgt, 4)}$, gap at $N=${NM}$: $${v.sci(dev, 2)}$\nsup error at $N=${nS.value}$: ${v.fix(supAll[nS.value - 1], 4)} · log–log slope of the ${F2[key].jumps.length ? 'error away from the jumps' : 'sup error'} for $N\\in[20,${NM}]$: ${v.fix(slope, 2)} ${F2[key].jumps.length ? '(the error on all of $\\R$ does not go to 0 near a jump)' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Smoothness and decay of Fourier coefficients',
      statement: String.raw`Let $f$ be $2\pi$-periodic with Fourier coefficients $c_n=\frac1{2\pi}\int f(x)e^{-inx}dx$. (a) If $f\in C^{k-1}$ and $f^{(k-1)}$ is absolutely continuous with $f^{(k)}\in L^2$ (piecewise continuous suffices), then $c_n=(in)^{-k}\,\widehat{f^{(k)}}(n)$, so $\sum n^{2k}|c_n|^2<\infty$ and $|c_n|=o(n^{-k})$. A jump of $f^{(k-1)}$ of size $J$ forces $|c_n|\sim J/(2\pi n^{k})$, and so the decay rate is *exactly* $n^{-k}$. (b) Conversely, if $|c_n|\le C|n|^{-k-1-\varepsilon}$ then $f\in C^k$. (c) $f$ extends to an analytic function in a strip $|\Im z|<\rho$ if and only if $|c_n|\lesssim e^{-\rho|n|}$.`,
      idea: String.raw`Integrate by parts $k$ times: each integration moves a derivative from $e^{-inx}$ onto $f$ and produces a factor $1/(in)$; the boundary terms cancel by periodicity as long as $f,\dots,f^{(k-1)}$ are continuous, and when $f^{(k-1)}$ jumps the boundary terms are $J/(in)^{k}\cdot e^{-inx_0}/(2\pi)$. The last integral is a Fourier coefficient of an integrable function, so it tends to $0$ by the Riemann–Lebesgue lemma (rca-5.12). Part (c) is the Paley–Wiener-type statement: shifting the contour of integration into the complex strip gains the factor $e^{-\rho n}$.`,
      caption: String.raw`The log–log plot shows $|c_n|$ for five $2\pi$-periodic functions normalised to unit $L^2$ norm: a sawtooth (jump), a triangle wave (kink), and the next two Bernoulli-type functions with a jump in $f''$ and $f'''$, plus the analytic function $1/(1-2r\cos x+r^2)$ (its tail bends downward). Slopes $-1,-2,-3,-4$ appear, and the analytic curve falls through all straight lines. Select the function to highlight (right: its graph and the partial sum $S_N$, which hugs smoother functions much faster); the readout fits the log–log slope for $5\le n\le80$ (for the analytic function it fits a slope that keeps steepening, and the exponential rate $\ln(1/r)$ per mode is shown). The data are computed by FFT of $8192$ samples.`,
      deps: ['pde-4.6', 'rca-5.12'],
      refs: ['Strauss §5.4'],
      tags: ['Fourier coefficients', 'smoothness', 'decay'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series#Convergence' },
      viz(v) {
        const M = v.M, NS = 8192, NM = 100;
        const sel = v.select('highlight', [{ value: 0, label: 'jump' }, { value: 1, label: 'kink' }, { value: 2, label: '$C^1$' }, { value: 3, label: '$C^2$' }, { value: 4, label: 'analytic' }], 1);
        const rS = v.slider('analytic: $r$', 0.3, 0.9, 0.6, { step: 0.05 });
        const nS = v.slider('terms $N$ in the picture', 1, 30, 4, { int: true });
        const A = v.stage({ x: [1, NM], y: [1e-14, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 280, xlabel: 'n', title: '$|c_n|$ (unit $L^2$ norm)', minWidth: 320 });
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 280, xlabel: 'x', title: 'the highlighted function and $S_N$', minWidth: 280, xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']] });
        const cols = ['red', 'orange', 'gold', 'green', 'accent'];
        const names = ['jump', 'kink', '$C^1$', '$C^2$', 'analytic'];
        const mk = (r) => [bernoulliPeriodic(1), bernoulliPeriodic(2), bernoulliPeriodic(3), bernoulliPeriodic(4), (x) => 1 / (1 - 2 * r * Math.cos(x) + r * r) - 1 / (1 - r * r)];
        let rkey = null, data = [], fs = [], cfs = [], slope = 0;
        v.render(() => {
          if (rkey !== rS.value) {
            rkey = rS.value; fs = mk(rkey);
            data = fs.map((f) => {
              const x = Float64Array.from({ length: NS }, (_, j) => f(((j + 0.5) * 2 * Math.PI) / NS)), z = M.fftReal(x);
              let nrm = 0; for (let j = 0; j < NS; j++) nrm += x[j] * x[j]; nrm = Math.sqrt(nrm / NS);
              return Array.from({ length: NM }, (_, i) => (2 * Math.hypot(z.re[i + 1], z.im[i + 1])) / NS / nrm / Math.SQRT2);
            });
            cfs = fs.map((f) => trigCoef((x) => f(x), 30, 2048));
          }
          const k = +sel.value;
          rS.el.hidden = false;
          data.forEach((d, i) => A.path(d.map((c, n) => [n + 1, Math.max(c, 1e-15)]), { color: cols[i], width: i === k ? 3.4 : 1.4, alpha: i === k ? 1 : 0.55 }));
          [1, 2, 3, 4].forEach((s) => A.path([[1, 1.6 * 1 ** -s * 0.4], [NM, 1.6 * 0.4 * NM ** -s]], { color: 'faint', width: 1, dash: [3, 4] }));
          const f = fs[k], norm = Math.sqrt(M.integrate((x) => f(x) ** 2, -Math.PI, Math.PI, 400) / (2 * Math.PI)), sc = norm > 0 ? 1 / norm : 1;
          B.fn((x) => f(x) * sc, { color: 'muted', width: 1.8, n: 600 });
          B.fn((x) => trigSum(cfs[k], nS.value, x) * sc, { color: 'orange', width: 2.4, n: 600 });
          const pts = []; for (let n = 5; n <= 80; n++) pts.push([Math.log(n), Math.log(Math.max(data[k][n - 1], 1e-300))]);
          slope = M.linreg(pts.map((p) => p[0]), pts.map((p) => p[1])).slope;
        });
        v.legend(cols.map((c, i) => [c, names[i]]));
        v.readout(() => {
          const k = +sel.value;
          return k < 4 ? `${names[k]}: fitted log–log slope $${v.fix(slope, 2)}$, expected $-${k + 1}$ (a jump in $f^{(${k})}$) ✓ · dashed grey lines are slopes $-1,\\dots,-4$`
            : `analytic, $r=${v.fix(rS.value, 2)}$: $|c_n|\\propto r^n$, rate $\\ln(1/r)=${v.fix(Math.log(1 / rS.value), 3)}$ per mode (strip width $\\rho=\\ln(1/r)$); the log–log slope fitted over $[5,80]$ is only a poor summary: $${v.fix(slope, 1)}$ and steepening. The curve flattens at about $10^{-15}$ (rounding floor).`;
        });
      },
    },
  ],
};
