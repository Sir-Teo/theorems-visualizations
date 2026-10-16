// Numerical Analysis — Chapter 3: Polynomial interpolation (items 3.10–3.17)
import { tsci, lg, clamp, linspace, equiPts, chebPts, nodesOf, baryW, chebW, bary, lagr, lebFn, lebMax, divdiff, newtonEval, omega, T, chebCoeffs, cadd, csub, cmul, cdiv, cabs, potEqui, potCheb, potOf, bisectRoot } from './ch03.shared.js';

const COL = ['accent', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold', 'blue'];
const NODEOPTS = [{ value: 'equi', label: 'equispaced' }, { value: 'cheb', label: 'Chebyshev' }];
const interp = (xs, ys) => { const w = baryW(xs); return (x) => bary(xs, w, ys, x); };
const EULER = 0.5772156649015329;
/** Piecewise-linear function through (xs[i], ys[i]) (xs sorted). */
function pl(xs, ys) {
  return (x) => {
    if (x <= xs[0]) return ys[0]; const n = xs.length - 1; if (x >= xs[n]) return ys[n];
    let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
  };
}

export default {
  collection: 'num',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Lebesgue constant',
      statement: String.raw`For nodes $x_0<\dots<x_n$ in $[a,b]$ let $I_n:C[a,b]\to\mathcal P_n$ be the interpolation operator. Its norm in the sup norm is the **Lebesgue constant**
$$\Lambda_n=\|I_n\|=\max_{x\in[a,b]}\lambda_n(x),\qquad \lambda_n(x)=\sum_{j=0}^n|\ell_j(x)|,$$
the maximum of the **Lebesgue function** $\lambda_n$. It is the worst-case amplification of data errors: perturbing the values by at most $\delta$ changes the interpolant by at most $\Lambda_n\delta$, and this is attained for a suitable sign pattern. Moreover $\|f-I_nf\|\le(1+\Lambda_n)\,\|f-p^*\|$ for the best approximation $p^*$ of degree $\le n$.`,
      idea: String.raw`Since $I_nf=\sum f(x_j)\ell_j$, the triangle inequality gives $|I_nf(x)|\le\lambda_n(x)\max|f(x_j)|$, and choosing data $y_j=\operatorname{sgn}\ell_j(x^*)$ at a maximiser $x^*$ makes equality hold, so $\Lambda_n$ is the norm of the operator. The error bound follows because $I_n$ reproduces polynomials: $f-I_nf=(f-p^*)-I_n(f-p^*)$. This is exactly the condition number of the interpolation problem (nla-3.1): a large $\Lambda_n$ means ill-posed data-to-polynomial map, regardless of the algorithm used.`,
      caption: String.raw`Top: the Lebesgue function for a node set you choose — pick equispaced or Chebyshev points, or drag the orange nodes along the axis. The red dot is its maximum $\Lambda_n$. Bottom: take the data $y_j=\cos 3x_j$ and add $\pm\delta$ with the signs of $\ell_j(x^*)$; the perturbed interpolant departs from the original by exactly $\delta\Lambda_n$ at $x^*$. Dragging nodes toward each other (or toward one end) makes $\Lambda_n$ explode.`,
      deps: ['num-3.2', 'nla-3.1'],
      refs: ['Trefethen ATAP ch. 15'],
      tags: ['lebesgue constant', 'conditioning'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lebesgue_constant' },
      viz(v) {
        const NMAX = 12;
        const preset = v.select('nodes', [{ value: 'equi', label: 'equispaced' }, { value: 'cheb', label: 'Chebyshev' }, { value: 'custom', label: 'dragged' }], 'equi', { onChange: () => place() });
        const nn = v.slider('degree $n$', 3, NMAX, 8, { int: true, onChange: () => place() });
        const dl = v.slider('data error $\\delta$', 0, 0.3, 0.1, { step: 0.005 });
        const a = v.stage({ x: [-1.1, 1.1], y: [0, 4], axes: 'box', gutter: true, xlabel: 'x', height: 250, title: 'Lebesgue function $\\lambda_n(x)=\\sum|\\ell_j(x)|$' });
        const b = v.stage({ x: [-1.1, 1.1], y: [-2, 2], axes: 'box', gutter: true, xlabel: 'x', height: 250, title: 'worst-case data error' });
        const H = Array.from({ length: NMAX + 1 }, () => a.handle(0, 0, { color: 'orange', constrain: 'x' }));
        H.forEach((h) => { h.onDrag = () => { preset.value = 'custom'; }; });
        function place() { const n = nn.value, xs = nodesOf(preset.value === 'cheb' ? 'cheb' : 'equi', n); H.forEach((h, i) => h.set(i <= n ? xs[i] : 0, 0)); }
        place();
        let info = {};
        v.legend([['accent', 'interpolant of exact data'], ['red', 'interpolant of perturbed data']]);
        v.render(() => {
          const n = nn.value; H.forEach((h, i) => { h.visible = i <= n; });
          const xs = H.slice(0, n + 1).map((h) => h.x).sort((p, q) => p - q);
          let gap = Infinity; for (let i = 0; i < n; i++) gap = Math.min(gap, xs[i + 1] - xs[i]);
          xs.forEach((x) => a.vline(x, { color: 'faint', alpha: 0.35 }));
          if (gap < 2e-3) { a.corner('two nodes coincide', 'tl', { color: 'red' }); info = { bad: true }; return; }
          const w = baryW(xs), M = lebMax(xs, w);
          const ymax = Math.max(M.L * 1.15, 2); a.setView([-1.1, 1.1], [0, ymax]);
          a.hline(1, { color: 'faint' });
          a.fn((x) => lebFn(xs, w, x), { color: 'accent', width: 2.2, domain: [xs[0], xs[n]], n: 900 });
          a.dot(M.x, M.L, { color: 'red', r: 5, label: 'Λ', labelPos: 'n' });
          const f = (x) => Math.cos(3 * x), ys = xs.map(f), sg = xs.map((_, j) => Math.sign(lagr(xs, w, j, M.x)) || 1);
          const y2 = ys.map((y, j) => y + dl.value * sg[j]), p = interp(xs, ys), q = interp(xs, y2);
          let lo = -1, hi = 1; for (let i = 0; i <= 200; i++) { const x = xs[0] + (xs[n] - xs[0]) * i / 200; lo = Math.min(lo, q(x), p(x)); hi = Math.max(hi, q(x), p(x)); }
          b.setView([-1.1, 1.1], [Math.max(lo, -8) - 0.2, Math.min(hi, 8) + 0.2]);
          b.clip(() => { b.fn(p, { color: 'accent', width: 2, domain: [xs[0], xs[n]] }); b.fn(q, { color: 'red', width: 2, domain: [xs[0], xs[n]] }); });
          xs.forEach((x, j) => b.dot(x, ys[j], { color: 'accent', r: 3 }));
          xs.forEach((x, j) => b.dot(x, y2[j], { color: 'red', r: 3, hollow: true }));
          b.vline(M.x, { color: 'gold', alpha: 0.6 });
          const ec = lebMax(chebPts(n)).L, ee = lebMax(equiPts(n)).L;
          info = { L: M.L, x: M.x, diff: Math.abs(q(M.x) - p(M.x)), d: dl.value, n, ec, ee };
        });
        v.readout(() => info.bad ? 'nodes must be distinct' : `$\\Lambda_${info.n}=${v.fmt(info.L, 4)}$ at $x^*=${v.fix(info.x, 3)}$ (for comparison: Chebyshev ${v.fmt(info.ec, 3)}, equispaced ${v.fmt(info.ee, 4)})\n$|\\tilde p-p|(x^*)=${tsci(info.diff, 4)}$ versus $\\delta\\Lambda_n=${tsci(info.d * info.L, 4)}$: the bound is attained`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Lebesgue constants: logarithmic versus exponential growth',
      statement: String.raw`For the $n+1$ Chebyshev points $\cos(j\pi/n)$ the Lebesgue constant grows only logarithmically,
$$\Lambda_n^{\rm Cheb}=\frac2\pi\Bigl(\log n+\gamma+\log\frac8\pi\Bigr)+o(1)\approx\frac2\pi\log n+0.96,$$
($\gamma$ is Euler's constant), whereas for $n+1$ equispaced points it grows exponentially,
$$\Lambda_n^{\rm equi}\sim\frac{2^{\,n+1}}{e\,n\log n}\qquad(n\to\infty).$$
Since $\Lambda_n$ is the norm of the interpolation operator (3.10), Chebyshev interpolation is well-conditioned for every $n$ in practice, while equispaced interpolation loses digits roughly like $2^n$.`,
      idea: String.raw`Write $\ell_j(x)=\omega(x)/\bigl((x-x_j)\,\omega'(x_j)\bigr)$. For equispaced nodes with spacing $h$, $|\omega'(x_j)|=h^n\,j!\,(n-j)!$ is smallest for $j$ near the middle, so the middle basis functions carry binomial factors of size $\binom{n}{n/2}\sim2^n/\sqrt n$ that nothing cancels — the source of the exponential growth. For Chebyshev points the clustering at the ends keeps $|\omega|$ and $|\omega'(x_j)|$ in balance and $\lambda_n$ is of the same size as the Lebesgue function of Fourier partial sums, $\sim\frac2\pi\log n$. The exact asymptotics are quoted here, not re-derived; the picture computes $\Lambda_n$ honestly for $n\le60$ and compares.`,
      caption: String.raw`Dots: $\Lambda_n$ computed by maximising the Lebesgue function for every $n\le60$ (log scale; green = Chebyshev, red = equispaced). The dashed curves are the asymptotic formulas of the statement. On the log axis the Chebyshev points rise only like $\log n$ while the equispaced points climb along a straight line of slope $\log_{10}2$ per step, to about $3\times10^{15}$ at $n=60$ — as many digits as double precision has. Drag the marker to read off both values.`,
      deps: ['num-3.10', 'num-3.6'],
      refs: ['Trefethen ATAP ch. 15'],
      scope: String.raw`Asymptotic statements as $n\to\infty$; the picture computes the exact constants for $n\le60$ and compares. The equispaced asymptotic prefactor was checked numerically (within 7% at $n=60$) but not against the original sources.`,
      verify: true,
      tags: ['lebesgue constant', 'growth'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lebesgue_constant' },
      viz(v) {
        const s = v.stage({ x: [0, 60], y: [1, 1e16], ylog: true, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'Λₙ', height: 360, title: 'Lebesgue constants of $n+1$ points' });
        const hn = s.handle(30, 1, { color: 'gold', constrain: 'x', label: 'n', labelPos: 'n' });
        const eq = [], ch = [];
        for (let n = 1; n <= 60; n++) { eq.push(lebMax(equiPts(n)).L); ch.push(lebMax(chebPts(n)).L); }
        const asE = (n) => 2 ** (n + 1) / (Math.E * n * Math.log(n)), asC = (n) => (2 / Math.PI) * (Math.log(n) + EULER + Math.log(8 / Math.PI));
        let info = {};
        v.legend([['red', 'equispaced'], ['green', 'Chebyshev'], ['muted', 'asymptotic formulas', { dash: true }]]);
        v.render(() => {
          const n = clamp(Math.round(hn.x), 2, 60); hn.set(n, 1);
          s.path(eq.map((y, i) => [i + 1, y]), { color: 'red', width: 1.6 }); s.dots(eq.map((y, i) => [i + 1, y]), { color: 'red', r: 2.5 });
          s.path(ch.map((y, i) => [i + 1, y]), { color: 'green', width: 1.6 }); s.dots(ch.map((y, i) => [i + 1, y]), { color: 'green', r: 2.5 });
          s.fn(asE, { color: 'muted', dash: true, domain: [2, 60] }); s.fn(asC, { color: 'muted', dash: true, domain: [2, 60] });
          s.vline(n, { color: 'faint' });
          info = { n, e: eq[n - 1], c: ch[n - 1], ae: asE(n), ac: asC(n) };
        });
        v.readout(() => `$n=${info.n}$: equispaced $\\Lambda_n=${tsci(info.e, 4)}$ (formula $${tsci(info.ae, 3)}$, ratio ${v.fix(info.e / info.ae, 3)}); Chebyshev $\\Lambda_n=${v.fix(info.c, 4)}$ (formula ${v.fix(info.ac, 4)})\ndata errors of size $10^{-16}$ are amplified to about $${tsci(1e-16 * info.e, 2)}$ (equispaced) versus $${tsci(1e-16 * info.c, 2)}$ (Chebyshev)`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Faber’s theorem: no universal node system',
      statement: String.raw`For every triangular array of nodes $\{x^{(n)}_j\}_{0\le j\le n}\subset[-1,1]$ there is a continuous function $f$ on $[-1,1]$ for which the interpolants $I_nf$ do **not** converge uniformly to $f$. Underlying this is the fact that the Lebesgue constants of any array are unbounded: $\Lambda_n\ge c\log n$ for some $c>0$ independent of the array (Faber's estimate), so by the uniform boundedness principle $\sup_n\|I_nf\|_\infty=\infty$ for some $f\in C[-1,1]$.`,
      idea: String.raw`The maps $I_n:C[-1,1]\to C[-1,1]$ are bounded linear operators with $\|I_n\|=\Lambda_n$ (3.10). By the Banach–Steinhaus theorem (rca-5.8), if $\sup_n\|I_nf\|_\infty<\infty$ for every continuous $f$, then $\sup_n\Lambda_n<\infty$. Faber's estimate says $\Lambda_n\to\infty$ for every array, so some continuous $f$ has $\sup_n\|I_nf\|_\infty=\infty$; and if $I_nf\to f$ uniformly the norms $\|I_nf\|$ would be bounded, so the interpolants of that $f$ cannot converge. Constructively one adds "humps": $g_{n_k}$ is the piecewise-linear function of norm $1$ with values $\pm1$ at the nodes of level $n_k$, chosen so that $\|I_{n_k}g_{n_k}\|=\Lambda_{n_k}$.`,
      caption: String.raw`Choose a node family and $n$. Top left: the hump $g_n$ — a piecewise-linear function of sup norm $1$ with values $\pm1$ at the nodes — and its interpolant $I_ng_n$ (red), which reaches height $\Lambda_n$. Top right: $\|I_nf\|_\infty$ (dots) for $f=\sum_{k\le K}2^{-k}g_{n_k}$, where $n_k$ is the first $n$ with $\Lambda_n\ge16^k$ (orange lines). The dots can never exceed $\|f\|_\infty\Lambda_n$ (dashed), and for equispaced nodes they follow the exponential growth of $\Lambda_n$: the hump at $n_k$ alone contributes $2^{-k}\Lambda_{n_k}\ge8^k$ while $\|f\|_\infty\le1$. For Chebyshev points $\Lambda_n<4$ for all $n\le60$, so not even the first hump exists in this range: a divergent $f$ exists, but it needs astronomically large $n_k$ and cannot be drawn.`,
      deps: ['num-3.11', 'rca-5.8'],
      refs: ['Trefethen ATAP ch. 15'],
      credit: 'G. Faber, 1914 (Jahresbericht der Deutschen Mathematiker-Vereinigung 23)',
      scope: String.raw`Faber's theorem says the sequence of interpolants of some continuous $f$ diverges for **every** array; it does not say a given smooth $f$ diverges (Chebyshev interpolants of Lipschitz or analytic functions converge). The picture shows a finite sum of humps, not the full divergent function.`,
      tags: ['faber', 'uniform boundedness', 'nodes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Faber%27s_theorem' },
      viz(v) {
        const NM = 60, KMAX = 5;
        const kind = v.select('nodes', NODEOPTS, 'equi');
        const nn = v.slider('degree $n$', 2, 40, 16, { int: true });
        const KK = v.slider('humps $K$', 1, KMAX, 3, { int: true });
        const a = v.stage({ x: [-1, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'a hump $g_n$ and its interpolant' });
        const b = v.stage({ x: [0, 40], y: [0.5, 1e16], ylog: true, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'norm', height: 320, title: 'interpolating a sum of humps' });
        const cache = {};
        function setup(k) {
          if (cache[k]) return cache[k];
          const L = [], humps = [];
          for (let n = 1; n <= NM; n++) L.push(lebMax(nodesOf(k, n)).L);
          for (let j = 1; j <= KMAX; j++) { const n = L.findIndex((q) => q >= 16 ** j) + 1; if (n < 1) break; const xs = nodesOf(k, n), w = baryW(xs), M = lebMax(xs, w); humps.push({ n, xs, g: pl(xs, xs.map((_, i) => Math.sign(lagr(xs, w, i, M.x)) || 1)) }); }
          return (cache[k] = { L, humps, norms: {} });
        }
        function norms(k, K) {
          const S = setup(k), key = K; if (S.norms[key]) return S.norms[key];
          const hs = S.humps.slice(0, K), f = (x) => hs.reduce((t, h, i) => t + 2 ** -(i + 1) * h.g(x), 0), out = [];
          for (let n = 1; n <= 40; n++) { const xs = nodesOf(k, n), p = interp(xs, xs.map(f)); let m = 0; for (let i = 0; i <= 600; i++) m = Math.max(m, Math.abs(p(-1 + i / 300))); out.push(m); }
          return (S.norms[key] = out);
        }
        let info = {};
        v.legend([['accent', '$g_n$'], ['red', '$I_ng_n$']]);
        v.render(() => {
          const k = kind.value, n = nn.value, S = setup(k), xs = nodesOf(k, n), w = baryW(xs), M = lebMax(xs, w);
          const sg = xs.map((_, j) => Math.sign(lagr(xs, w, j, M.x)) || 1), g = pl(xs, sg), p = interp(xs, sg);
          a.setView([-1, 1], [-Math.min(M.L, 40) * 1.15 - 0.2, Math.min(M.L, 40) * 1.15 + 0.2]);
          a.clip(() => { a.fn(g, { color: 'accent', width: 2, n: 800 }); a.fn(p, { color: 'red', width: 1.6, n: 1200 }); });
          xs.forEach((x, j) => a.dot(x, sg[j], { color: 'accent', r: 3 }));
          a.dot(M.x, p(M.x), { color: 'gold', r: 5 });
          const K = Math.min(KK.value, S.humps.length);
          let nk = '';
          if (K > 0) {
            const N = norms(k, K);
            b.path(N.map((y, i) => [i + 1, Math.max(y, 0.5)]), { color: 'accent', width: 1.4 }); b.dots(N.map((y, i) => [i + 1, Math.max(y, 0.5)]), { color: 'accent', r: 2.5 });
            S.humps.slice(0, K).forEach((h) => { if (h.n <= 40) b.vline(h.n, { color: 'orange', alpha: 0.6, dash: true }); });
            nk = S.humps.slice(0, K).map((h) => h.n).join(', ');
          }
          b.path(S.L.slice(0, 40).map((y, i) => [i + 1, y]), { color: 'muted', dash: true, width: 1.2 });
          b.vline(n, { color: 'faint' });
          info = { n, L: M.L, peak: Math.max(...Array.from({ length: 401 }, (_, i) => Math.abs(p(-1 + i / 200)))), K, nk, avail: S.humps.length };
        });
        v.readout(() => `$n=${info.n}$: $\\|g_n\\|_\\infty=1$ but $\\|I_ng_n\\|_\\infty=${v.fmt(info.peak, 5)}=\\Lambda_n=${v.fmt(info.L, 5)}$\n` + (info.avail === 0 ? 'no hump with $\\Lambda_n\\ge16$ exists for $n\\le60$ in this family (the dashed curve is $\\Lambda_n$): the divergent $f$ cannot be drawn' : `humps at $n_k=${info.nk}$ (orange); dashed grey = $\\Lambda_n$; dots = $\\|I_nf\\|_\\infty$ with $\\|f\\|_\\infty\\le1$`));
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Hermite integral formula for the interpolation error',
      statement: String.raw`Let $f$ be analytic in a region containing a simple closed contour $\Gamma$ and its interior, let $x_0,\dots,x_n$ and $x$ lie inside $\Gamma$, and let $p$ interpolate $f$ at the nodes. Then
$$f(x)-p(x)=\frac1{2\pi i}\oint_\Gamma\frac{\omega(x)}{\omega(z)}\,\frac{f(z)}{z-x}\,dz,\qquad\omega(z)=\prod_{j=0}^n(z-x_j).$$
Consequently the error is small when $|\omega(x)|\ll|\omega(z)|$ on a contour that stays away from the singularities of $f$.`,
      idea: String.raw`The integrand has simple poles at $z=x$ (residue $f(x)$) and at each node $z=x_j$ (residue giving $-\sum_j f(x_j)\ell_j(x)=-p(x)$ by the Lagrange form), so by the residue theorem — Cauchy's formula (rca-10.15) — the integral over $\Gamma$ equals $f(x)-p(x)$ provided $f$ itself has no singularities inside. This turns the interpolation error into an estimate of $|\omega(x)/\omega(z)|$, a ratio that is exponentially small in $n$ when $x$ lies in a smaller level set of $|\omega|$ than the contour: the idea behind potential theory (3.14).`,
      caption: String.raw`The function is $f(z)=1/(z^2+a^2)$ with poles $\pm ia$ (red; drag the upper one) and the contour is the ellipse with foci $\pm1$ and parameter $\rho$ (orange; slider). Drag the gold marker $x$ along $[-1,1]$. The readout compares the true error $f(x)-p(x)$ with the numerically computed contour integral: they agree to many digits as long as the ellipse contains no pole, and **disagree** (by the residues) once $\rho$ is large enough that a pole is enclosed (when both poles are inside, the integral is $\approx0$: the integrand decays like $|z|^{-(n+3)}$, so the contour can be pushed to infinity). Right: the size of the integrand around the contour.`,
      deps: ['num-3.4', 'rca-10.15'],
      refs: ['Trefethen ATAP ch. 11'],
      credit: 'C. Hermite, 1878 (letter to Borchardt, Journal für die reine und angewandte Mathematik 84: 70–79)',
      scope: String.raw`Requires $f$ analytic on and inside $\Gamma$; if a singularity is enclosed the formula picks up extra residues. Here the contour is an ellipse and the poles are a conjugate pair.`,
      tags: ['hermite', 'contour integral', 'error'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polynomial_interpolation' },
      viz(v) {
        const kind = v.select('nodes', NODEOPTS, 'cheb');
        const nn = v.slider('degree $n$', 2, 24, 8, { int: true });
        const rho = v.slider('ellipse parameter $\\rho$', 1.05, 3, 1.8, { step: 0.01 });
        const s = v.stage({ x: [-1.9, 1.9], y: [-1.45, 1.45], equal: true, axes: true, height: 340, title: 'the complex plane' });
        const g = v.stage({ x: [0, 2 * Math.PI], y: [1e-12, 1e8], ylog: true, axes: 'box', gutter: true, xlabel: 'position on the contour (angle θ)', height: 340, title: 'size of the integrand' });
        const pole = s.handle(0, 0.9, { color: 'red', constrain: 'y', label: 'ia', labelPos: 'e' });
        const hx = s.handle(0.3, 0, { color: 'gold', constrain: 'x', label: 'x' });
        let info = {};
        v.legend([['orange', 'contour $\\Gamma$'], ['red', 'poles of $f$'], ['gold', '$x$']]);
        v.render(() => {
          const n = nn.value, xs = nodesOf(kind.value, n), R = rho.value, aa = Math.max(Math.abs(pole.y), 0.05), x = clamp(hx.x, -1, 1);
          pole.set(0, aa);
          const f = (z) => cdiv([1, 0], cadd(cmul(z, z), [aa * aa, 0])), fr = (t) => 1 / (t * t + aa * aa);
          const p = interp(xs, xs.map(fr));
          const A = (R + 1 / R) / 2, B = (R - 1 / R) / 2;
          s.curve((t) => [A * Math.cos(t), B * Math.sin(t)], 0, 2 * Math.PI, { color: 'orange', width: 2.2 });
          xs.forEach((q) => s.dot(q, 0, { color: 'ink', r: 2.5 }));
          s.dot(0, aa, { color: 'red', r: 5 }); s.dot(0, -aa, { color: 'red', r: 5 });
          s.dot(x, 0, { color: 'gold', r: 5 });
          // trapezoid rule for the contour integral (periodic, spectrally accurate away from the poles)
          const N = 1600; let I = [0, 0]; const mag = [];
          const om = (z) => { let q = [1, 0]; for (const t of xs) q = cmul(q, [z[0] - t, z[1]]); return q; };
          const omx = omega(xs, x);
          for (let k = 0; k < N; k++) {
            const t = 2 * Math.PI * (k + 0.5) / N, z = [A * Math.cos(t), B * Math.sin(t)], dz = [-A * Math.sin(t), B * Math.cos(t)];
            const val = cmul(cmul(cdiv([omx, 0], om(z)), cdiv(f(z), csub(z, [x, 0]))), dz);
            I = cadd(I, val); if (k % 8 === 0) mag.push([t, Math.max(cabs(val), 1e-12)]);
          }
          I = [I[1] * 2 * Math.PI / N / (2 * Math.PI) , -I[0] * 2 * Math.PI / N / (2 * Math.PI)]; // (1/2πi)·ΣΔt → multiply by −i
          const mn = Math.min(...mag.map((q) => q[1])), mx = Math.max(...mag.map((q) => q[1]));
          g.setView([0, 2 * Math.PI], [mn / 3, mx * 3]);
          g.path(mag, { color: 'orange', width: 1.8 });
          const err = fr(x) - p(x), inside = B > aa;
          info = { err, I: I[0], im: I[1], inside, R, B, aa, n };
        });
        v.readout(() => `true error $f(x)-p(x)=${tsci(info.err, 5)}$; contour integral $=${tsci(info.I, 5)}$ (imaginary part $${tsci(Math.abs(info.im) + 1e-30, 1)}$)\n` + (info.inside ? `**the pole $ia$ lies inside the ellipse** (semi-minor axis ${v.fix(info.B, 3)} > ${v.fix(info.aa, 3)}): the integral no longer equals the error` : 'the ellipse contains no singularity of $f$: formula holds'));
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Potential theory and convergence regions',
      statement: String.raw`Let the interpolation nodes have limiting distribution $\mu$ on $[-1,1]$ and let $U(z)=\int\log|z-t|\,d\mu(t)$ be its logarithmic potential. Then $|\omega_n(z)|^{1/n}\to e^{U(z)}$ away from the nodes. If $f$ is analytic inside and on a level curve $\{U=c\}$ of the potential that encloses $[-1,1]$, then the interpolants converge geometrically — like $e^{n(U(x)-c)}$ at $x$ — at every $x$ with $U(x)<c$ (in particular on the segment of the real axis inside that curve); and they diverge at $x$ if $f$ has a singularity $\zeta$ with $U(\zeta)<U(x)$. For Chebyshev points $U$ is constant on $[-1,1]$, so the whole interval lies inside every level curve; for equispaced points $U(x)=-1+\tfrac12\bigl[(1+x)\log(1+x)+(1-x)\log(1-x)\bigr]$ is smallest in the middle and largest at the ends.`,
      idea: String.raw`By the Hermite formula (3.13), $f(x)-p_n(x)$ is a contour integral of $f(z)\,\omega_n(x)/\omega_n(z)$, and $|\omega_n(x)/\omega_n(z)|\approx e^{n(U(x)-U(z))}$. Choosing the contour inside the region where $U(z)$ exceeds $U(x)$ makes the integrand exponentially small; a singularity of $f$ at which $U(\zeta)<U(x)$ cannot be avoided and contributes a term growing like $e^{n(U(x)-U(\zeta))}$. This is Runge's analysis of 1901 (3.17), phrased with the potential. The harmonicity of $U$ off the support (rca-11.3) is what makes the level curves the natural contours.`,
      caption: String.raw`Green shading is the region $U(z)<U(\zeta)$ in which interpolants converge; the contour lines are level curves of $U$. Drag the red pole $\zeta$ (its conjugate is mirrored). Equispaced nodes: the region is a lens that pinches off the ends of $[-1,1]$ when $\zeta$ is close — below, the errors for $n=10,20,30$ shrink inside the real-axis segment $|x|<x_c$ and blow up outside it. Chebyshev nodes: the region is bounded by a Bernstein ellipse through $\zeta$ and always contains $[-1,1]$.`,
      deps: ['num-3.13', 'rca-11.3'],
      refs: ['Trefethen ATAP ch. 12'],
      scope: String.raw`Asymptotic as $n\to\infty$ for nodes whose counting measure tends to $\mu$; the picture uses the two classical measures (uniform and arcsine) and a function with a conjugate pair of poles, $f(x)=1/|x-\zeta|^2$.`,
      tags: ['potential theory', 'convergence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Potential_theory' },
      viz(v) {
        const kind = v.select('nodes', NODEOPTS, 'equi');
        const s = v.stage({ x: [-1.6, 1.6], y: [-1.1, 1.1], equal: true, axes: true, height: 340, title: 'level curves of $U$ and the convergence region' });
        const e = v.stage({ x: [-1, 1], y: [1e-16, 1e10], ylog: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: '|f − pₙ|', height: 340, title: 'actual interpolation errors' });
        const z = s.handle(0.15, 0.3, { color: 'red', label: 'ζ' });
        let info = {};
        v.legend([['green', 'n = 10'], ['teal', 'n = 20'], ['purple', 'n = 30']]);
        v.render(() => {
          const k = kind.value, U = potOf(k), zx = z.x, zy = Math.max(Math.abs(z.y), 0.03); z.set(z.x, zy);
          const Uz = U(zx, zy);
          const on = v.ramp(0.3, 'green'), pk = v.rgb('panel').slice(0, 3).join(',');
          s.raster((x, y) => (U(x, y) < Uz ? on : null), { res: 3, key: `${k}|${zx.toFixed(3)}|${zy.toFixed(3)}|${pk}` });
          const lv = []; for (let i = 0; i < 8; i++) lv.push(Uz + (i - 5) * 0.12);
          s.clip(() => s.contour((x, y) => U(x, y), lv, { color: 'muted', width: 0.8, alpha: 0.7, res: 110 }));
          s.clip(() => s.contour((x, y) => U(x, y), [Uz], { color: 'green', width: 2.4, res: 150 }));
          s.line(-1, 0, 1, 0, { color: 'ink', width: 3 });
          s.dot(zx, zy, { color: 'red', r: 5 }); s.dot(zx, -zy, { color: 'red', r: 5 });
          const f = (t) => 1 / ((t - zx) ** 2 + zy * zy);
          [[10, 'green'], [20, 'teal'], [30, 'purple']].forEach(([n, c]) => {
            const xs = nodesOf(k, n), p = interp(xs, xs.map(f)), pts = [];
            for (let i = 0; i <= 400; i++) { const x = -1 + i / 200; pts.push([x, Math.max(Math.abs(f(x) - p(x)), 1e-16)]); }
            e.path(pts, { color: c, width: 1.5 });
          });
          // real segment of convergence
          let xc = null;
          const g = (x) => U(x, 0) - Uz;
          if (k === 'cheb') xc = g(0) < 0 ? 1 : 0;
          else { if (g(1) < 0) xc = 1; else if (g(0) >= 0) xc = 0; else { let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (g(m) < 0) lo = m; else hi = m; } xc = lo; } }
          if (xc < 1) { e.vline(xc, { color: 'red', dash: true }); e.vline(-xc, { color: 'red', dash: true }); }
          info = { xc, rate: Math.exp(U(1, 0) - Uz), k, Uz };
        });
        v.readout(() => (info.xc >= 1 ? 'the whole segment $[-1,1]$ lies in the convergence region: interpolants converge everywhere on it' : `convergence on the real axis only for $|x|<x_c=${v.fix(info.xc, 4)}$ (red dashed): outside it the error grows like $e^{n(U(x)-U(\\zeta))}$`) + `\nat $x=1$ the error changes by a factor $e^{U(1)-U(\\zeta)}=${v.fix(info.rate, 3)}$ per extra degree`);
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Algorithm',
      name: 'Hermite interpolation',
      statement: String.raw`Given $m$ distinct nodes $x_1,\dots,x_m$ with prescribed values $y_j$ and slopes $d_j$, there is exactly one polynomial $H$ of degree $\le 2m-1$ with $H(x_j)=y_j$ and $H'(x_j)=d_j$. It is the Newton interpolant (3.3) at the **doubled** nodes $x_1,x_1,x_2,x_2,\dots$ with the convention $f[x_j,x_j]=d_j$. It is also the limit of the ordinary interpolant at the $2m$ nodes $x_j\pm\varepsilon/2$ with values $y_j\pm d_j\varepsilon/2$ as $\varepsilon\to0$. For $f\in C^{2m}$: $f(x)-H(x)=\dfrac{f^{(2m)}(\xi)}{(2m)!}\prod_j(x-x_j)^2$.`,
      idea: String.raw`Divided differences (3.3) are continuous in their arguments, so letting two nodes merge turns $f[x_j,x_{j}+\varepsilon]=(y'-y)/\varepsilon$ into the derivative; the Newton form with repeated nodes then solves the Hermite conditions. Uniqueness comes from counting: the difference of two such polynomials has degree $\le 2m-1$ and a double zero at each of $m$ nodes, i.e. $2m$ zeros with multiplicity. The error formula is that of 3.4 with each node counted twice.`,
      caption: String.raw`Drag the gold values and the orange slope handles at each node: the black curve is the unique degree-5 Hermite interpolant, matching both. The dashed red curve is the ordinary interpolant through the *split* nodes $x_j\pm\varepsilon/2$ (slider $\varepsilon$): as $\varepsilon\to0$ it collapses onto the black curve, and the readout gives the maximum gap. Use "sample from $f$" to draw data from a real function and compare with the error formula.`,
      deps: ['num-3.3'],
      refs: ['Süli–Mayers ch. 6'],
      credit: 'C. Hermite, 1878',
      tags: ['hermite', 'interpolation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hermite_interpolation' },
      viz(v) {
        const X = [-1.2, 0.1, 1.3], m = 3, Y = [0.4, -0.6, 0.8], D = [1.2, 0.8, -1.5];
        const eps = v.slider('splitting $\\varepsilon$', 0.002, 0.8, 0.3, { log: true, sig: 2 });
        let fsrc = false; const F = (x) => Math.cos(2 * x) + 0.3 * x;
        const s = v.stage({ x: [-2, 2], y: [-2.2, 2.2], axes: 'box', gutter: true, xlabel: 'x', height: 360, title: 'Hermite interpolant (degree $\\le5$)' });
        const L = 0.5;
        const HV = X.map((x, j) => s.handle(x, Y[j], { color: 'gold', constrain: 'y' }));
        const HS = X.map((x, j) => s.handle(x + L, Y[j] + D[j] * L, { color: 'orange', constrain: 'y' }));
        HV.forEach((h, j) => { h.onDrag = () => { Y[j] = h.y; fsrc = false; }; });
        HS.forEach((h, j) => { h.onDrag = () => { D[j] = (h.y - Y[j]) / L; fsrc = false; }; });
        v.button('sample from $f=\\cos2x+0.3x$', () => { X.forEach((x, j) => { Y[j] = F(x); D[j] = -2 * Math.sin(2 * x) + 0.3; }); fsrc = true; });
        let info = {};
        v.legend([['ink', 'Hermite $H$'], ['red', 'ordinary interpolant at $x_j\\pm\\varepsilon/2$', { dash: true }], ['faint', '$f$ (when sampled)']]);
        v.render(() => {
          const z = [], yz = [];
          for (let j = 0; j < m; j++) { z.push(X[j], X[j]); yz.push(Y[j], Y[j]); }
          // divided differences with repeated nodes
          const n = 2 * m, T0 = [yz.slice()];
          for (let k = 1; k < n; k++) { const prev = T0[k - 1], row = []; for (let i = 0; i < n - k; i++) { const dx = z[i + k] - z[i]; row.push(dx === 0 ? D[Math.floor(i / 2)] : (prev[i + 1] - prev[i]) / dx); } T0.push(row); }
          const c = T0.map((r) => r[0]), H = (x) => newtonEval(z, c, x, n);
          HV.forEach((h, j) => { h.set(X[j], Y[j]); }); HS.forEach((h, j) => { h.set(X[j] + L, Y[j] + D[j] * L); });
          const e = eps.value, xs2 = [], ys2 = [];
          for (let j = 0; j < m; j++) { xs2.push(X[j] - e / 2, X[j] + e / 2); ys2.push(Y[j] - D[j] * e / 2, Y[j] + D[j] * e / 2); }
          const q = interp(xs2, ys2);
          if (fsrc) s.fn(F, { color: 'faint', width: 1.4 });
          s.clip(() => { s.fn(q, { color: 'red', dash: true, width: 1.6 }); s.fn(H, { color: 'ink', width: 2.6 }); });
          X.forEach((x, j) => { s.segment([x - 0.3, Y[j] - 0.3 * D[j]], [x + 0.7, Y[j] + 0.7 * D[j]], { color: 'orange', alpha: 0.7 }); });
          let gap = 0, ferr = 0; for (let i = 0; i <= 300; i++) { const x = -1.5 + 3 * i / 300; gap = Math.max(gap, Math.abs(H(x) - q(x))); if (fsrc) ferr = Math.max(ferr, Math.abs(F(x) - H(x))); }
          let dres = 0; for (let j = 0; j < m; j++) { const h = 1e-6; dres = Math.max(dres, Math.abs(H(X[j]) - Y[j]), Math.abs((H(X[j] + h) - H(X[j] - h)) / (2 * h) - D[j])); }
          info = { gap, ferr, dres, e };
        });
        v.readout(() => `$H$ matches all $6$ conditions: max residual in values and slopes $${tsci(info.dres + 1e-30, 2)}$\nmax gap between $H$ and the split-node interpolant ($\\varepsilon=${v.fmt(info.e, 2)}$) on $[-1.5,1.5]$: $${tsci(info.gap, 3)}$` + (info.ferr ? `\n$\\max|f-H|=${tsci(info.ferr, 3)}$ for sampled data` : ''));
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Phenomenon',
      name: 'Aliasing in Chebyshev interpolation',
      statement: String.raw`Let $p$ be the interpolant of $T_m$ in the $n+1$ Chebyshev points $\cos(j\pi/n)$ with $m>n$. Then $p=T_k$, where $k\in\{0,\dots,n\}$ is determined by $m\equiv\pm k\pmod{2n}$. In other words $T_m$ and $T_k$ are indistinguishable on the grid: high-degree content is **aliased** to the lower degree $k$ in the Chebyshev coefficients of the interpolant.`,
      idea: String.raw`On the grid $\theta_j=j\pi/n$ the values are $T_m(\cos\theta_j)=\cos(mj\pi/n)$. Because $\cos$ is even and $2\pi$-periodic, $\cos(mj\pi/n)=\cos(kj\pi/n)$ whenever $m\equiv\pm k\pmod{2n}$, so the two polynomials share all data; by uniqueness (3.1) the degree-$\le n$ interpolant of $T_m$ is $T_k$. This is the Chebyshev analogue of the Nyquist–Shannon aliasing of sampled sinusoids, where frequencies above half the sampling rate fold back.`,
      caption: String.raw`Choose $n$ and the degree $m$. Left: $T_m$ (thin blue), the grid points, and the interpolant (thick green) — which is a smooth low-degree wave. Right: the Chebyshev coefficients of the interpolant, **computed from the grid values** (not from the formula); the single bar sits at the predicted alias $k$ (orange mark). Sweep $m$ upward and the bar walks to $n$ and folds back down: $m\mapsto 2n-m$, then $m-2n$, and so on.`,
      deps: ['num-3.7'],
      refs: ['Trefethen ATAP ch. 4'],
      tags: ['aliasing', 'chebyshev'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Aliasing' },
      viz(v) {
        const nn = v.slider('grid size $n$', 4, 16, 8, { int: true });
        const mm = v.slider('degree $m$ of $T_m$', 0, 64, 13, { int: true });
        const a = v.stage({ x: [-1, 1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: '$T_m$ and its interpolant' });
        const b = v.stage({ x: [-0.5, 16.5], y: [-0.2, 1.3], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'coefficient of $T_k$', height: 330, title: 'Chebyshev coefficients of the interpolant' });
        let info = {};
        v.legend([['blue', '$T_m$'], ['green', 'interpolant'], ['orange', 'predicted alias $k$']]);
        v.render(() => {
          const n = nn.value, m = mm.value, xs = chebPts(n), ys = xs.map((x) => T(m, x)), p = interp(xs, ys), a_ = chebCoeffs(ys);
          const r = m % (2 * n), k = r <= n ? r : 2 * n - r;
          a.hline(1, { color: 'faint' }); a.hline(-1, { color: 'faint' });
          a.fn((x) => T(m, x), { color: 'blue', width: 1, alpha: 0.7, n: 1600 });
          a.fn(p, { color: 'green', width: 2.8 });
          xs.forEach((x, j) => a.dot(x, ys[j], { color: 'gold', r: 4 }));
          b.setView([-0.5, n + 0.5], [-0.2, 1.3]);
          b.bars(a_.map((q) => Math.abs(q) < 1e-12 ? 0 : q), { x0: 0, dx: 1, color: 'green' });
          b.dot(k, 1.15, { color: 'orange', r: 6 });
          let dev = 0; for (let i = 0; i <= 200; i++) { const x = -1 + i / 100; dev = Math.max(dev, Math.abs(p(x) - T(k, x))); }
          const big = a_.map((q, i) => [Math.abs(q), i]).sort((u, w) => w[0] - u[0])[0];
          info = { n, m, k, dev, got: big[1], amp: a_[big[1]], rest: a_.reduce((t, q, i) => (i === big[1] ? t : Math.max(t, Math.abs(q))), 0) };
        });
        v.readout(() => `$n=${info.n}$, $m=${info.m}$: $m\\bmod 2n$ gives alias $k=${info.k}$; the computed coefficients have their only nonzero entry at $k=${info.got}$ (value ${v.fix(info.amp, 6)}; all others $\\le${tsci(info.rest + 1e-30, 1)}$)\n$\\max|p-T_k|=${tsci(info.dev + 1e-30, 2)}$: the interpolant of $T_m$ is $T_k$`);
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Paper',
      name: 'Über empirische Funktionen und die Interpolation…',
      paper: { authors: 'C. Runge', year: 1901, title: 'Über empirische Funktionen und die Interpolation zwischen äquidistanten Ordinaten', venue: 'Zeitschrift für Mathematik und Physik 46: 224–243', url: 'https://archive.org/details/zeitschriftfrma12runggoog' },
      introduces: ['num-3.5', 'num-3.14'],
      credit: 'C. Runge, 1901',
      statement: String.raw`Runge asked whether interpolating a function in more and more equidistant points reproduces it, and showed that in general it does not. By a contour-integral argument he proved that the interpolation polynomials of a function analytic on the segment converge only inside a region of the complex plane bounded by a level curve (his “$U$-curve”) determined by the nodes and by the singularities of the function: if a singularity lies inside the curve through the endpoints' side, convergence is possible only on part of the segment. For his example $f(x)=1/(1+x^2)$ on $[-5,5]$ (singularities at $\pm i$), the curve through $\pm i$ meets the real axis near $\pm3.63$, so interpolation converges only for $|x|<3.63$ and diverges between $3.63$ and $5$; with the $11$ integer nodes $-5,\dots,5$ the deviation at $x=\pm4.5$ is at least $1.53$, while at $x=\pm0.5$ it is at most $0.044$, and raising the degree makes the first worse and the second smaller.`,
      idea: String.raw`Runge was interested in how to fit a curve to measured, equally spaced ordinates; he observed that a high-degree interpolation polynomial through equidistant ordinates can misbehave even for an analytic function, and he explained why with the integral representation of the interpolation error (the Hermite formula, 3.13) and the level curves of a potential-like function (3.14). What was believed before was that more nodes give a better fit; what the paper changed was the understanding that convergence depends on where in the complex plane the singularities of $f$ sit relative to the node distribution. It introduced the divergence example now called the Runge phenomenon (3.5) and the potential-theoretic convergence region (3.14).`,
      caption: String.raw`The paper's example $f=1/(1+x^2)$ on $[-5,5]$, recomputed (the paper prints numbers, not a plot). Slide the number of equispaced nodes (the button gives Runge's $11$ integer nodes): the interpolant matches in the middle and blows up near the ends; the error panel (log scale) has its break at the dashed lines $x=\pm3.63$. The complex plane shows $z=\pm i$ and the level curve through them: its crossing with the real axis is the number Runge quotes. Switch to Chebyshev nodes to see the cure.`,
      scope: String.raw`Recomputation, not a copy of the paper's figures: the paper contains no plot for this example, only the quoted deviations ($1.53$ at $\pm4.5$, $0.044$ at $\pm0.5$) and the crossing point $\pm3.63$, which are compared with our values in the readout.`,
      deps: ['num-3.1', 'num-3.4'],
      refs: [],
      verify: true,
      tags: ['runge', 'history', 'interpolation'],
      links: { archive: 'https://archive.org/details/zeitschriftfrma12runggoog', wikipedia: 'https://en.wikipedia.org/wiki/Runge%27s_phenomenon' },
      viz(v) {
        const f = (x) => 1 / (1 + x * x);
        const kind = v.select('nodes', NODEOPTS, 'equi');
        const nn = v.slider('number of nodes $n+1$', 3, 31, 11, { int: true });
        v.button('Runge’s 11 integer nodes', () => { kind.set('equi'); nn.set(11); });
        const a = v.stage({ x: [-5, 5], y: [-1.2, 1.6], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$f(x)=1/(1+x^2)$ on $[-5,5]$' });
        const e = v.stage({ x: [-5, 5], y: [1e-8, 1e6], ylog: true, axes: 'box', gutter: true, xlabel: 'x', ylabel: '|f − p|', height: 300, title: 'error of the interpolant' });
        const c = v.stage({ x: [-6, 6], y: [-3.4, 3.4], equal: true, axes: true, height: 300, title: 'complex plane: the level curve through $\\pm i$' });
        let info = {};
        v.legend([['ink', '$f$'], ['accent', 'interpolant'], ['red', '$|f-p|$']]);
        v.render(() => {
          const N = nn.value, n = N - 1, xs = nodesOf(kind.value, n).map((t) => 5 * t), p = interp(xs, xs.map(f));
          const PU = potOf(kind.value), Us = (x, y) => PU(x / 5, y / 5), Ui = Us(0, 1);
          let xc = 0; { let lo = 0, hi = 5.9; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Us(m, 0) < Ui) lo = m; else hi = m; } xc = lo; }
          a.setView([-5, 5], [-1.2, 1.6]);
          a.fn(f, { color: 'ink', width: 1.6 });
          a.clip(() => a.fn(p, { color: 'accent', width: 2.2, n: 800 }));
          xs.forEach((x) => a.dot(x, f(x), { color: 'gold', r: 3 }));
          const pts = []; for (let i = 0; i <= 600; i++) { const x = -5 + i / 60; pts.push([x, Math.max(Math.abs(f(x) - p(x)), 1e-8)]); }
          e.path(pts, { color: 'red', width: 1.6 });
          if (xc < 5) { e.vline(xc, { color: 'faint', dash: true }); e.vline(-xc, { color: 'faint', dash: true }); }
          const on = v.ramp(0.3, 'green'), pk = v.rgb('panel').slice(0, 3).join(',');
          c.raster((x, y) => (Us(x, y) < Ui ? on : null), { res: 3, key: 'runge-region' + kind.value + pk });
          c.clip(() => c.contour((x, y) => Us(x, y), [Ui], { color: 'green', width: 2.4, res: 160 }));
          c.line(-5, 0, 5, 0, { color: 'ink', width: 3 });
          c.dot(0, 1, { color: 'red', r: 5 }); c.dot(0, -1, { color: 'red', r: 5 }); c.dot(xc, 0, { color: 'green', r: 4 }); c.dot(-xc, 0, { color: 'green', r: 4 });
          // Runge's own numbers: 11 integer nodes
          const x11 = Array.from({ length: 11 }, (_, i) => i - 5), p11 = interp(x11, x11.map(f));
          info = { d45: Math.abs(f(4.5) - p11(4.5)), d05: Math.abs(f(0.5) - p11(0.5)), N, pk: Math.max(...pts.map((q) => q[1])), xc, cheb: kind.value === 'cheb' };
        });
        v.readout(() => `Runge's 11 integer nodes: deviation at $x=4.5$ is $${v.fix(info.d45, 4)}$ (paper: not less than $1.53$), at $x=0.5$ it is $${v.fix(info.d05, 4)}$ (paper: not more than $0.044$)\nlevel curve through $\\pm i$ meets the real axis at $\\pm${v.fix(info.xc, 4)}$ for ${info.cheb ? 'Chebyshev' : 'equispaced'} nodes (paper, equispaced: about $\\pm3.63$); current interpolant: ${info.N} nodes, max error $${tsci(info.pk, 3)}$`);
      },
    },
  ],
};
