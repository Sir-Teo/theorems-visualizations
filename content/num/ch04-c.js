// Numerical Analysis — Chapter 4 (continued): least squares, orthogonal polynomials, CF and rational approximation of |x| (items 4.10–4.14)
import { clamp, linspace, chebPts, chebInterp, supDiff, remez, bestErr, gaussLegendre, legendreAll, legendreCoef, legendreEval, seriesCoef, cfApprox, newmanAbs } from './ch04.shared.js';
import { orthogonalAudit, newmanAudit } from './numerical-source-audit.shared.js';

const SGN = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

export default {
  collection: 'num',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Best approximation in the 2-norm',
      statement: String.raw`Let $V$ be a finite-dimensional subspace of an inner-product space (here $L^2[-1,1]$ with $\langle f,g\rangle=\int_{-1}^1fg$). For every $f$ there is exactly one $p\in V$ minimizing $\|f-p\|_2$, and it is characterized by orthogonality: $f-p\perp V$. For $V=\mathcal P_n$ this means $\langle f-p,x^k\rangle=0$, $k=0,\dots,n$, i.e. the **normal equations** with the Hilbert matrix; and $\|f-q\|_2^2=\|f-p\|_2^2+\|p-q\|_2^2$ for every $q\in V$ (Pythagoras).`,
      idea: String.raw`This is the orthogonal projection onto $V$, as in best approximation from a finite orthonormal set (rca-4.14), and the same condition is what makes least squares problems solvable by normal equations (nla-2.9). If $f-p\perp V$, then for any $q\in V$ the vectors $f-p$ and $p-q$ are orthogonal, so Pythagoras gives $\|f-q\|^2=\|f-p\|^2+\|p-q\|^2\ge\|f-p\|^2$ with equality only for $q=p$. Contrast with the sup norm: the $L^2$ error is spread over the interval instead of equioscillating.`,
      caption: String.raw`Pick $f$ and the degree $n$ ($L^2$ fit in orange). The middle panel shows the normalized inner products $\langle f-p,x^k\rangle/(\|f-p\|\|x^k\|)$: zero for $k\le n$, not for $k>n$. The slider *perturb* adds $\delta\,x^j$ to $p$; the readout checks Pythagoras exactly. The right panel compares the residual of the $L^2$ fit with the equioscillating residual of the sup-norm best fit (green).`,
      deps: ['rca-4.14', 'nla-2.9'],
      refs: ['Süli–Mayers ch. 9'],
      credit: 'Legendre, 1805; Gauss, 1809 (least squares)',
      tags: ['least squares', 'projection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Least_squares' },
      viz(v) {
        const F = { abs: (x) => Math.abs(x), sgn: SGN, exp: (x) => Math.exp(2 * x), cos: (x) => Math.cos(6 * x) };
        const fsel = v.select('$f$', [{ value: 'abs', label: '$|x|$' }, { value: 'sgn', label: 'sign$(x)$' }, { value: 'exp', label: '$e^{2x}$' }, { value: 'cos', label: '$\\cos 6x$' }], 'abs');
        const nn = v.slider('degree $n$', 0, 9, 3, { int: true });
        const jj = v.slider('perturb $x^j$, $j$', 0, 9, 1, { int: true });
        const dd = v.slider('amount $\\delta$', -0.3, 0.3, 0, { step: 0.005 });
        const A = v.stage({ x: [-1, 1], y: [-1.5, 3], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$f$ and fits' });
        const B = v.stage({ x: [-0.5, 13.5], y: [-1.05, 1.05], axes: 'box', gutter: true, xlabel: 'k', height: 300, title: 'normalized $\\langle f-p,x^k\\rangle$' });
        const C = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: 'residuals' });
        const { x: gx, w: gw } = gaussLegendre(500);
        let info = {};
        v.legend([['ink', '$f$'], ['orange', '$L^2$ best $p$'], ['gold', '$p+\\delta x^j$'], ['accent', '$L^2$ residual'], ['green', 'sup-norm residual']]);
        v.render(() => {
          const f = F[fsel.value], n = nn.value, c = legendreCoef(f, n, 500), p = (x) => legendreEval(c, x, n);
          const q = (x) => p(x) + dd.value * Math.pow(x, jj.value);
          A.fn(f, { color: 'ink', width: 1.8, n: 600 }); A.fn(p, { color: 'orange', width: 2.4 });
          if (Math.abs(dd.value) > 0) A.fn(q, { color: 'gold', width: 1.8, dash: true });
          const ip = (g, h) => { let s = 0; for (let i = 0; i < gx.length; i++) s += gw[i] * g(gx[i]) * h(gx[i]); return s; };
          const r = (x) => f(x) - p(x), rn = Math.sqrt(ip(r, r));
          const vals = []; for (let k = 0; k <= 13; k++) vals.push(rn > 0 ? ip(r, (x) => Math.pow(x, k)) / (rn * Math.sqrt(ip((x) => Math.pow(x, k), (x) => Math.pow(x, k)))) : 0);
          B.bars(vals, { x0: 0, color: (val, i) => (i <= n ? 'green' : 'orange') });
          B.vline(n + 0.5, { color: 'muted', dash: true });
          const m = Math.max(...linspace(-1, 1, 400).map((x) => Math.abs(r(x)))), top = m * 1.3 + 1e-9;
          C.setView([-1, 1], [-top, top]); C.hline(0, { color: 'faint' });
          C.fn(r, { color: 'accent', width: 2, n: 700 });
          let es = null;
          if (fsel.value !== 'sgn') { const H = remez(f, n, { iters: 14, M: 800 }), pp = H[H.length - 1].p; C.fn((x) => f(x) - pp(x), { color: 'green', width: 1.6, dash: true, n: 700 }); es = H[H.length - 1].emax; }
          const e2 = ip(r, r), eq = ip((x) => f(x) - q(x), (x) => f(x) - q(x)), dq = ip((x) => p(x) - q(x), (x) => p(x) - q(x));
          info = { e2, eq, dq, es, max: Math.max(...vals.slice(0, n + 1).map(Math.abs)), m };
        });
        v.readout(() => `largest $|\\text{normalized inner product}|$ for $k\\le n$: $${v.sci(info.max + 1e-30, 2)}$ (zero up to quadrature rounding)\nPythagoras: $\\|f-q\\|^2=${v.fix(info.eq, 6)}$ and $\\|f-p\\|^2+\\|p-q\\|^2=${v.fix(info.e2 + info.dq, 6)}$` + (info.es ? `\nsup norm of the $L^2$ residual $${v.fix(info.m, 4)}$ versus the best possible $${v.fix(info.es, 4)}$` : ''));
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Orthogonal polynomials and the three-term recurrence',
      statement: String.raw`Let $w\ge0$ be a weight on $[-1,1]$ with $0<\int_{-1}^1w(x)\,dx<\infty$ and $\langle f,g\rangle_w=\int fgw$. Gram–Schmidt applied to $1,x,x^2,\dots$ produces monic polynomials $\pi_0,\pi_1,\dots$, $\deg\pi_k=k$, orthogonal to all polynomials of lower degree. With $\pi_0=1$ and $\pi_1=x-\alpha_0$, they satisfy, for $k\ge1$, a **three-term recurrence**
$$\pi_{k+1}(x)=(x-\alpha_k)\pi_k(x)-\beta_k\pi_{k-1}(x),\qquad\alpha_k=\tfrac{\langle x\pi_k,\pi_k\rangle}{\langle\pi_k,\pi_k\rangle},\ \beta_k=\tfrac{\langle\pi_k,\pi_k\rangle}{\langle\pi_{k-1},\pi_{k-1}\rangle},$$
equivalently multiplication by $x$ is a tridiagonal (Jacobi) matrix in the orthonormal basis. The zeros of $\pi_n$ are real, simple, lie inside the interval and interlace those of $\pi_{n-1}$ (and are the eigenvalues of the $n\times n$ Jacobi matrix). Conversely (Favard) any such monic recurrence with real $\alpha_k$ and $\beta_k>0$ comes from a positive measure on $\mathbb R$; positivity alone does not confine its support to $[-1,1]$.`,
      idea: String.raw`Since $\langle x\pi_k,\pi_j\rangle=\langle\pi_k,x\pi_j\rangle$ and $x\pi_j$ has degree $j+1<k$ whenever $j<k-1$, the projection of $x\pi_k$ onto $\pi_j$ vanishes for $j<k-1$: only three terms survive. Real simple zeros: a sign-change argument — if $\pi_n$ had fewer than $n$ sign changes, a polynomial of lower degree would not be orthogonal to it. Interlacing follows from the recurrence (Sturm-type argument). The tridiagonal matrix of $x$ is the same structure that appears in Lanczos’s method for symmetric eigenproblems.`,
      caption: String.raw`Choose a weight (Legendre, Chebyshev, Jacobi with sliders $\alpha,\beta$, or $|x|$). The page runs Gram–Schmidt on the monomials in the weighted inner product (discretized by Gauss–Chebyshev quadrature) and shows the orthonormal polynomials, the matrix of $\langle x\pi_k,\pi_j\rangle$ (only the three central diagonals are nonzero — the readout lists the largest off-diagonal entry) and, below, the zeros of $\pi_n$ (gold) and $\pi_{n-1}$ (blue), which interlace. Polynomial curves beyond vertical range ±6 are clipped explicitly.`,
      deps: ['num-4.10'],
      refs: ['Trefethen ATAP ch. 17, equations (17.6)–(17.9)', 'NIST DLMF §18.2(i), (iv), (vi), (viii)'],
      credit: 'Three-term recurrence; Favard’s converse',
      tags: ['orthogonal polynomials', 'recurrence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Orthogonal_polynomials' },
      viz(v) {
        const wsel = v.select('weight', [{ value: 'leg', label: 'Legendre $w=1$' }, { value: 'cheb', label: 'Chebyshev $1/\\sqrt{1-x^2}$' }, { value: 'jac', label: 'Jacobi' }, { value: 'abs', label: '$|x|$' }], 'jac');
        const al = v.slider('$\\alpha$ (at $+1$)', -0.5, 3, 2, { step: 0.5 });
        const be = v.slider('$\\beta$ (at $-1$)', -0.5, 3, 0, { step: 0.5 });
        const nn = v.slider('degree $n$', 2, 8, 5, { int: true });
        const P = v.stage({ x: [-1, 1], y: [-3, 3], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: 'orthonormal polynomials $\\hat\\pi_0,\\dots,\\hat\\pi_n$' });
        const Mx = v.stage({ x: [-0.5, 9.5], y: [-9.5, 0.5], axes: false, height: 300, title: '$\\langle x\\hat\\pi_k,\\hat\\pi_j\\rangle$ (rows $j$, columns $k$)', equal: true });
        const Z = v.stage({ x: [-1.05, 1.05], y: [-0.3, 2.3], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: 'zeros of $\\pi_n$ and $\\pi_{n-1}$' });
        const NQ = 400, xq = Array.from({ length: NQ }, (_, i) => Math.cos((2 * i + 1) * Math.PI / (2 * NQ)));
        let info = {};
        const COL = ['accent', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold', 'blue'];
        v.render(() => {
          al.el.hidden = be.el.hidden = wsel.value !== 'jac';
          const w = { leg: () => 1, cheb: (x) => 1 / Math.sqrt(1 - x * x), jac: (x) => Math.pow(1 - x, al.value) * Math.pow(1 + x, be.value), abs: (x) => Math.abs(x) }[wsel.value];
          const n = nn.value, m = 9;
          const { J, a, b, evalAll } = orthogonalAudit(w, NQ, m);
          let off = 0; for (let j = 0; j <= m; j++) for (let k = 0; k <= m; k++) if (Math.abs(j-k)>1) off=Math.max(off,Math.abs(J[j][k]));
          const grid = linspace(-1, 1, 200), vals = grid.map(evalAll), ymax = Math.max(...vals.map((r) => Math.max(...r.slice(0, n + 1).map(Math.abs))));
          const yc = Math.min(ymax * 1.1, 6); P.setView([-1, 1], [-yc, yc]);
          P.clip(() => { for (let k = 0; k <= n; k++) P.path(grid.map((x, i) => [x, vals[i][k]]), { color: COL[k % 9], width: 1.6 }); });
          // matrix picture
          const mm = 9, sc = Math.max(...J.flat().map(Math.abs));
          for (let j = 0; j < mm; j++) for (let k = 0; k < mm; k++) { const val = J[j][k]; Mx.rect(k - 0.45, -j - 0.45, k + 0.45, -j + 0.45, { fill: Math.abs(val) < 1e-9 ? 'faint' : val > 0 ? 'accent' : 'red', fillAlpha: Math.abs(val) < 1e-9 ? 0.08 : 0.15 + 0.7 * Math.min(1, Math.abs(val) / sc), stroke: false }); }
          // Jacobi eigenvalues
          const jac = (N) => { const T = []; for (let i = 0; i < N; i++) { T.push(new Array(N).fill(0)); T[i][i] = a[i]; if (i > 0) { T[i][i - 1] = b[i]; T[i - 1][i] = b[i]; } } return v.M.eigSym(T).values.slice().sort((p, q) => p - q); };
          const z1 = jac(n), z0 = jac(n - 1);
          Z.hline(1.5, { color: 'faint' }); Z.hline(0.5, { color: 'faint' });
          z1.forEach((x) => Z.dot(x, 1.5, { color: 'gold', r: 5 })); z0.forEach((x) => Z.dot(x, 0.5, { color: 'accent', r: 5 }));
          z0.forEach((x, i) => Z.line(x, 0.5, x, 1.5, { color: 'faint', alpha: 0.6 }));
          let inter = true; for (let i = 0; i < z0.length; i++) if (!(z1[i] < z0[i] && z0[i] < z1[i + 1])) inter = false;
          info = { off, inter, n, a: a.slice(0, 4), b: b.slice(1, 4), zr: z1 };
        });
        v.readout(() => `largest entry of $\\langle x\\hat\\pi_k,\\hat\\pi_j\\rangle$ with $|j-k|>1$: $${v.sci(info.off + 1e-30, 2)}$ (the discrete weighted sum is tridiagonal to rounding; it approximates the continuous weight)\nzeros of $\\pi_${info.n}$: ${info.zr.map((x) => v.fix(x, 3)).join(', ')} — all real, simple, in $(-1,1)$; interlacing with $\\pi_${info.n - 1}$: ${info.inter ? '**yes**' : 'no'}`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Definition',
      name: 'Legendre polynomials as orthogonal polynomials',
      statement: String.raw`The **Legendre polynomials** $P_k$ are the orthogonal polynomials for $w\equiv1$ on $[-1,1]$, normalized by $P_k(1)=1$; they satisfy $(k+1)P_{k+1}=(2k+1)xP_k-kP_{k-1}$ and $\int_{-1}^1P_jP_k=\frac{2}{2k+1}\delta_{jk}$. The expansion $f=\sum c_kP_k$, $c_k=\frac{2k+1}2\int fP_k$, has partial sums $S_n f$ that are the best degree-$n$ approximations in $L^2[-1,1]$ (4.10).`,
      idea: String.raw`Orthogonality turns the normal equations into a diagonal system, so each coefficient is an independent inner product and adding a degree adds one term without changing the others. Legendre polynomials are the solutions of Legendre’s differential equation (ode-4.5) and also the Gauss-quadrature polynomials for $w\equiv1$. They are $L^2$-optimal but not sup-norm optimal: the Chebyshev interpolant of the same degree, which has no $L^2$ optimality, usually beats $S_nf$ in the maximum norm and costs less to compute.`,
      caption: String.raw`Left: $f$, its Legendre partial sum $S_nf$ (orange) and the Chebyshev interpolant (blue). Right: errors against $n$ for both, in the norm you select. In the $L^2$ norm the orange curve is always lowest (it is optimal); in the sup norm the interpolant is typically as good or better and never far behind.`,
      deps: ['num-4.11', 'ode-4.5'],
      refs: ['Süli–Mayers ch. 9'],
      credit: 'Legendre, 1782',
      tags: ['legendre', 'orthogonal polynomials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Legendre_polynomials' },
      viz(v) {
        const F = { abs: (x) => Math.abs(x), runge: (x) => 1 / (1 + 25 * x * x), sgn: SGN, exp: (x) => Math.exp(Math.sin(4 * x)) };
        const fsel = v.select('$f$', [{ value: 'abs', label: '$|x|$' }, { value: 'runge', label: 'Runge' }, { value: 'sgn', label: 'sign$(x)$' }, { value: 'exp', label: '$e^{\\sin4x}$' }], 'runge');
        const norm = v.select('norm', [{ value: 'l2', label: '$L^2$' }, { value: 'sup', label: 'sup' }], 'l2');
        const nn = v.slider('degree $n$', 1, 40, 10, { int: true });
        const A = v.stage({ x: [-1, 1], y: [-1.3, 1.7], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: '$f$, $S_nf$ and the interpolant' });
        const B = v.stage({ x: [1, 40], y: [1e-8, 2], ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 330, title: 'error against degree' });
        const { x: gx, w: gw } = gaussLegendre(500);
        const cache = {};
        let info = {};
        v.legend([['ink', '$f$'], ['orange', 'Legendre partial sum'], ['accent', 'Chebyshev interpolant']]);
        v.render(() => {
          const k = fsel.value, f = F[k];
          if (!cache[k]) {
            const c = legendreCoef(f, 40, 500), L2 = [], SU = [], L2c = [], SUc = [], ns = [];
            const grid = linspace(-1, 1, 500);
            const P = gx.map((x) => legendreAll(40, x)), Pg = grid.map((x) => legendreAll(40, x));
            for (let n = 1; n <= 40; n++) {
              ns.push(n); let e2 = 0, es = 0; const pc = chebInterp(f, n); let e2c = 0, esc = 0;
              for (let i = 0; i < gx.length; i++) { let s = 0; for (let j = 0; j <= n; j++) s += c[j] * P[i][j]; const d = f(gx[i]) - s, dc = f(gx[i]) - pc(gx[i]); e2 += gw[i] * d * d; e2c += gw[i] * dc * dc; }
              for (let i = 0; i < grid.length; i++) { let s = 0; for (let j = 0; j <= n; j++) s += c[j] * Pg[i][j]; es = Math.max(es, Math.abs(f(grid[i]) - s)); esc = Math.max(esc, Math.abs(f(grid[i]) - pc(grid[i]))); }
              L2.push(Math.sqrt(e2)); SU.push(es); L2c.push(Math.sqrt(e2c)); SUc.push(esc);
            }
            cache[k] = { c, L2, SU, L2c, SUc, ns };
          }
          const D = cache[k], n = nn.value;
          A.fn(f, { color: 'ink', width: 1.5, n: 600 });
          A.clip(() => { A.fn((x) => legendreEval(D.c, x, n), { color: 'orange', width: 2.2, n: 600 }); A.fn(chebInterp(f, n), { color: 'accent', width: 1.6, n: 600, dash: true }); });
          const [e1, e2] = norm.value === 'l2' ? [D.L2, D.L2c] : [D.SU, D.SUc];
          B.path(D.ns.map((m, i) => [m, Math.max(e1[i], 1e-17)]), { color: 'orange', width: 2.2 });
          B.path(D.ns.map((m, i) => [m, Math.max(e2[i], 1e-17)]), { color: 'accent', width: 2, dash: [5, 3] });
          B.vline(n, { color: 'gold', alpha: 0.6 });
          info = { a: e1[n - 1], b: e2[n - 1], n, norm: norm.value };
        });
        v.readout(() => `$n=${info.n}$, ${info.norm === 'l2' ? '$L^2$' : 'sup'} error: Legendre partial sum $${v.sci(info.a, 3)}$, Chebyshev interpolant $${v.sci(info.b, 3)}$ — ratio interpolant/Legendre $${v.fix(info.b / info.a, 2)}$` + (info.norm === 'l2' ? ' (always $\\ge1$: the partial sum is the $L^2$ optimum)' : ''));
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Method',
      name: 'Carathéodory–Fejér approximation',
      statement: String.raw`Let $f$ be real with an absolutely convergent Chebyshev series $f=\sum a_kT_k$ and form the Hankel matrix $H_n=(a_{n+1+i+j})_{i,j\ge0}$ with largest singular value $\sigma_1$ (for the real symmetric $H_n$, the dominant eigenvalue $\lambda$ in modulus, with eigenvector $u$). The **CF approximant** of degree $n$ is the polynomial obtained from $f$ by subtracting the curve $e_{CF}(\theta)=\lambda\cos\big((n+1)\theta+2\arg u(e^{i\theta})\big)$, $u(z)=\sum u_jz^j$, and keeping the coefficients of $T_0,\dots,T_n$. The method often gives near-best errors for rapidly decaying coefficients, but rapid decay by itself is not a uniform quantitative error bound. In ATAP Theorem 20.2, for fixed degree $m$, if $f$ has a Lipschitz $(3m+3)$rd derivative and $f^{(m+1)}(0)\ne0$, the CF and minimax approximants to $f(sx)$ differ by $O(s^{3m+4})$ as $s\to0$.`,
      idea: String.raw`The Carathéodory–Fejér–Schur circle problem has an exact constant-modulus error determined by the Hankel eigenpair (ATAP Theorem 20.1). The Chebyshev problem is the real part of that circle problem, with the neglected coefficients (those beyond the Hankel truncation and the small mismatch between the two problems) controlling the gap. Hence a near-equioscillating error of size $\approx\sigma_1$, essentially the Remez curve, with no iteration (cf. Remez, 4.8; near-best interpolants, 4.9).`,
      caption: String.raw`Left: error curves of the CF approximant (accent) and of a numerical Remez approximation (green), with the level $\pm\sigma_1$ (red): compare their closeness and departure from equal ripple heights. Right: $\sigma_1$, the CF error and the best error against $n$ — numerical curves that may be close on the log scale (the $|x|$ example, with slowly decaying coefficients, shows where the approximation degrades).`,
      deps: ['num-4.9'],
      refs: ['Trefethen ATAP Theorems 20.1–20.2', 'Gutknecht–Trefethen (1982), §§1–3'],
      credit: 'Carathéodory & Fejér, 1911; as an approximation method: Trefethen & Gutknecht, early 1980s',
      scope: String.raw`The construction uses a 50×50 Hankel truncation, approximate coefficients from a degree-1000 interpolant and a 512-point cosine transform. Sampled errors and Remez values are estimates, not certified bounds; unresolved ratios are omitted. The construction here is the polynomial case; the $\sigma_1\approx E_n^*$ agreement relies on rapidly decaying $a_k$ (it is excellent for $e^x$, good for the Runge function, only approximate for $|x|$).`,
      tags: ['best approximation', 'hankel', 'svd'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carath%C3%A9odory%E2%80%93Fej%C3%A9r_problem' },
      viz(v) {
        const F = { exp: { f: Math.exp, nm: '$e^x$' }, runge: { f: (x) => 1 / (1 + 25 * x * x), nm: 'Runge' }, sq: { f: (x) => Math.sqrt(1.5 + x), nm: '$\\sqrt{1.5+x}$' }, abs: { f: Math.abs, nm: '$|x|$' } };
        const fsel = v.select('$f$', Object.entries(F).map(([value, o]) => ({ value, label: o.nm })), 'runge');
        const nn = v.slider('degree $n$', 1, 12, 5, { int: true });
        const A = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'error curves' });
        const B = v.stage({ x: [1, 12], y: [1e-16, 1], ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 320, title: '$\\sigma_1$, CF error, best error' });
        const cache = {};
        let info = {};
        v.legend([['accent', 'CF error $f-p_{CF}$'], ['green', 'best error $f-p^*$', { dash: true }], ['red', '$\\pm\\sigma_1$', { dash: true }], ['orange', '$\\sigma_1$'], ['gold', 'CF error (norm)'], ['green', 'best']]);
        v.render(() => {
          const k = fsel.value, f = F[k].f, a = seriesCoef('f4.13' + k, f, 1000);
          if (!cache[k]) { cache[k] = []; for (let n = 1; n <= 12; n++) { const cf = cfApprox(a, n, v.M.eigSym, 50); const best = bestErr(f, n, { iters: 14, M: 900 }); cache[k].push({ n, s: Math.abs(cf.lam), c: supDiff(f, cf.p, 1500), b: best }); } }
          const D = cache[k], n = nn.value, cf = cfApprox(a, n, v.M.eigSym, 50);
          const H = remez(f, n, { iters: 14, M: 900 }), pb = H[H.length - 1].p;
          const sg = Math.abs(cf.lam), top = Math.max(D[n - 1].c, sg) * 1.35;
          A.setView([-1, 1], [-top, top]);
          A.hline(sg, { color: 'red', dash: true }); A.hline(-sg, { color: 'red', dash: true }); A.hline(0, { color: 'faint' });
          A.fn((x) => f(x) - pb(x), { color: 'green', width: 1.8, dash: true, n: 900 });
          A.fn((x) => f(x) - cf.p(x), { color: 'accent', width: 2.2, n: 900 });
          B.path(D.map((d) => [d.n, d.s]), { color: 'orange', width: 3 });
          B.path(D.map((d) => [d.n, d.c]), { color: 'gold', width: 2 });
          B.path(D.filter((d) => isFinite(d.b)).map((d) => [d.n, d.b]), { color: 'green', width: 1.6, dash: true });
          B.vline(n, { color: 'gold', alpha: 0.5 });
          info = { s: sg, c: D[n - 1].c, b: D[n - 1].b, n };
        });
        v.readout(() => `$n=${info.n}$: Hankel singular value $\\sigma_1=${v.sci(info.s, 4)}$, sampled CF error $${v.sci(info.c, 4)}$; ` + (Number.isFinite(info.b) && info.b>5e-14 ? `Remez error estimate $${v.sci(info.b,4)}$, ratio $${v.fix(info.c/info.b,4)}$` : 'Remez comparison unresolved at this degree/rounding level (no ratio claimed).'));

      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Phenomenon',
      name: 'Rational functions beat polynomials for |x| (Newman)',
      statement: String.raw`The best degree-$n$ polynomial approximation of $|x|$ on $[-1,1]$ has error $E_n(|x|)\sim\beta/n$ with $\beta=0.2801694990\ldots$ (Bernstein’s constant, Varga–Carpenter): painfully slow. For even $n>4$, rational functions of type $(n,n)$ achieve $\|\,|x|-r\|\le 3e^{-\sqrt n}$ (Newman, 1964), with the explicit $r(x)=x\frac{p(x)-p(-x)}{p(x)+p(-x)}$, $p(x)=\prod_{k=0}^{n-1}(x+e^{-k/\sqrt n})$, whereas the best rational error satisfies $E_{nn}\sim8e^{-\pi\sqrt n}$ (Stahl). The singularity at $0$ is resolved by poles piling up along the imaginary axis.`,
      idea: String.raw`A polynomial cannot bend sharply at $0$ without large degree, which is why smoothness controls polynomial convergence (4.3). A rational function can place poles and zeros near $0$, geometrically clustered toward the singular point with ratio $e^{-1/\sqrt n}$: Newman’s product is a single clever choice of them, and his estimate of $\prod$ ratios gives the root-exponential rate. This is the same “exponential clustering near the singularity” that underlies the approximation of $x^\alpha$ and of $\sqrt{x}$.`,
      caption: String.raw`Slide the even degree $n\ge6$. Left: $|x|$ near the origin with the numerical Remez polynomial of degree $n$ (orange) and Newman’s rational function of the same degree (accent). Right: both errors against $n$ on a log scale; polynomial errors follow $0.28/n$ (dashed) while the rational error falls like $e^{-\sqrt n}$, below Newman’s bound $3e^{-\sqrt n}$. Stahl’s asymptotic $8e^{-\pi\sqrt n}$ describes the best rational function, not this explicit Newman function; the two curves need not be close.`,
      deps: ['num-4.7'],
      refs: ['Newman (1964), p. 11 Theorem A and its proof', 'Trefethen ATAP Theorem 25.1'],
      credit: 'Newman, 1964; polynomial constant and sharp rational asymptotic as in ATAP Theorem 25.1',
      tags: ['rational approximation', 'singularity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bernstein%27s_constant' },
      viz(v) {
        const nn = v.slider('even degree $n$', 6, 40, 12, { step: 2 });
        const A = v.stage({ x: [-0.4, 0.4], y: [-0.02, 0.45], axes: 'box', gutter: true, xlabel: 'x', height: 340, title: '$|x|$ near the origin' });
        const B = v.stage({ x: [6, 40], y: [1e-8, 1], ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 340, title: 'sup error on $[-1,1]$' });
        const NS = []; for (let n = 6; n <= 40; n += 2) NS.push(n);
        const polyE = NS.map((n) => bestErr(Math.abs, n, { iters: 14, M: 2000 }));
        const ratE = (n) => { const r = newmanAudit(n); let e = 0; for (let i = 0; i <= 3000; i++) { const x = (i / 3000) ** 2; e = Math.max(e, Math.abs(x - r(x))); } return e; };
        const ratAll = []; for (let n = 6; n <= 40; n += 2) ratAll.push([n, ratE(n)]);
        let info = {};
        v.legend([['ink', '$|x|$'], ['orange', 'best polynomial'], ['accent', 'Newman rational'], ['muted', '$0.28/n$', { dash: true }], ['red', '$3e^{-\\sqrt n}$ (Newman bound)', { dash: true }], ['green', '$8e^{-\\pi\\sqrt n}$ (Stahl)', { dash: true }]]);
        v.render(() => {
          const n = nn.value, pe = n, H = remez(Math.abs, pe, { iters: 14, M: 2000 }), p = H[H.length - 1].p, r = newmanAudit(n);
          A.fn(Math.abs, { color: 'ink', width: 2 }); A.clip(() => { A.fn(p, { color: 'orange', width: 2, n: 800 }); A.fn(r, { color: 'accent', width: 2, n: 1200 }); });
          B.path(NS.map((m, i) => [m, polyE[i]]).filter((q) => isFinite(q[1])), { color: 'orange', width: 2.4 });
          B.path(ratAll.map((q) => [q[0], Math.max(q[1], 1e-17)]), { color: 'accent', width: 2.4 });
          B.path(NS.map((m) => [m, 0.2801694990 / m]), { color: 'muted', dash: true });
          B.path(ratAll.map((q) => [q[0], 3 * Math.exp(-Math.sqrt(q[0]))]), { color: 'red', dash: true });
          B.path(ratAll.map((q) => [q[0], 8 * Math.exp(-Math.PI * Math.sqrt(q[0]))]), { color: 'green', dash: true });
          B.vline(n, { color: 'gold', alpha: 0.6 });
          info = { n, pe, ep: polyE[NS.indexOf(pe)], er: ratAll[(n - 6)/2][1] };
        });
        v.readout(() => `even degree ${info.n}: sampled Newman error $${v.sci(info.er,3)}$; ` + (Number.isFinite(info.ep) ? `sampled Remez polynomial error $${v.sci(info.ep,3)}$ ($nE_n\\approx${v.fix(info.pe*info.ep,4)}$, polynomial asymptotic constant $\\beta\\approx0.2802$); ratio polynomial/Newman $${v.fix(info.ep/info.er,1)}$` : 'Remez polynomial comparison unresolved at this degree; no error ratio claimed.'));

      },
    },
  ],
};
