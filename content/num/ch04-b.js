// Numerical Analysis — Chapter 4 (continued): best approximation in the sup norm (items 4.6–4.9)
import { lg, clamp, linspace, chebPts, chebInterp, supDiff, baryW, bary, remez, bestErr, lebMax, tsci } from './ch04.shared.js';

const FUNS = {
  exp: { f: Math.exp, tex: 'e^x' },
  lin: { f: (x) => x, tex: 'x' },
  abs: { f: (x) => Math.abs(x), tex: '|x|' },
  cos: { f: (x) => Math.cos(3 * x), tex: '\\cos3x' },
  runge: { f: (x) => 1 / (1 + 25 * x * x), tex: '\\frac1{1+25x^2}' },
};

export default {
  collection: 'num',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Existence and uniqueness of best approximation',
      statement: String.raw`Let $f$ be real-valued and continuous on $[a,b]$ and let $V$ be a finite-dimensional subspace of $C[a,b]$. Then there is at least one $p^*\in V$ minimizing $\|f-p\|_\infty$ (**existence**; true in any normed space for finite-dimensional $V$). For $V=\mathcal P_n$, the real polynomials of degree $\le n$, the minimizer is **unique** by equioscillation (4.7). Polynomial spaces have the **Haar property**: each nonzero element has at most $\dim V-1$ zeros. For a non-Haar space (such as span$\{1,x^2\}$ on $[-1,1]$) uniqueness can fail: the set of best approximations may be a whole segment.`,
      idea: String.raw`Existence: $p\mapsto\|f-p\|$ is continuous and tends to $\infty$ as $\|p\|\to\infty$, so it attains its minimum on a closed ball of the finite-dimensional $V$, which is compact (extreme value theorem, pma-4.16). The set of minimizers is convex because the norm is. For polynomial uniqueness: if two minimizers differed, their average would also be one, and the error would have to equal $\pm E$ at too many points for a nonzero element of $V$ with too many zeros to exist.`,
      caption: String.raw`Right: the map $(\text{coefficients})\mapsto\|f-p\|_\infty$ for the degree-1 approximation $p=\alpha+\beta x$ (or for the non-Haar family $\alpha+\beta x^2$), as a colour map; drag the gold point to choose $p$, shown on the left with its error band. For $e^x$ and lines the bowl has one lowest point. Choose $f=x$ with the family $\alpha+\beta x^2$ and the bottom of the bowl becomes a flat green valley — a whole segment of best approximations.`,
      deps: ['num-4.1', 'pma-4.16'],
      refs: ['Trefethen ATAP Theorem10.1, complete existence/equioscillation/uniqueness proofs in chap10.m'],
      scope: String.raw`Sup norm on a compact interval; the Haar condition is what makes uniqueness hold for algebraic polynomials.`,
      tags: ['best approximation', 'uniqueness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Haar_space' },
      viz(v) {
        const space = v.select('family', [{ value: 'lin', label: '$\\alpha+\\beta x$ (Haar)' }, { value: 'sq', label: '$\\alpha+\\beta x^2$ (not Haar)' }], 'lin');
        const fsel = v.select('$f$', [{ value: 'exp', label: '$e^x$' }, { value: 'lin', label: '$x$' }, { value: 'abs', label: '$|x|$' }], 'exp');
        const L = v.stage({ x: [-1, 1], y: [-1.2, 3.2], axes: 'box', gutter: true, xlabel: 'x', height: 340, title: '$f$ and the chosen $p$' });
        const R = v.stage({ x: [-2, 2], y: [-2, 2], axes: 'box', gutter: true, xlabel: '$\\beta$', ylabel: '$\\alpha$', height: 340, equal: true, title: 'sup error as a function of $(\\beta,\\alpha)$' });
        const H = R.handle(1, 1, { color: 'gold', r: 7 });
        const xs = linspace(-1, 1, 121);
        const NG = 121; const cache = {};
        const basis = (sp, x) => (sp === 'lin' ? x : x * x);
        const grid = (sp, fk) => {
          const key = sp + fk; if (cache[key]) return cache[key];
          const f = FUNS[fk].f, G = [];
          let best = Infinity, bi = 0, bj = 0;
          for (let j = 0; j < NG; j++) { G.push([]); for (let i = 0; i < NG; i++) { const b = -2 + 4 * i / (NG - 1), a = -2 + 4 * j / (NG - 1); let m = 0; for (const x of xs) m = Math.max(m, Math.abs(f(x) - a - b * basis(sp, x))); G[j].push(m); if (m < best) { best = m; bi = i; bj = j; } } }
          // refine the lowest point by shrinking local searches
          let ba = -2 + 4 * bj / (NG - 1), bb = -2 + 4 * bi / (NG - 1), w = 0.04;
          const E = (a, b) => { let m = 0; for (const x of xs) m = Math.max(m, Math.abs(f(x) - a - b * basis(sp, x))); return m; };
          for (let r = 0; r < 14; r++) { let be = E(ba, bb), na = ba, nb = bb; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const a = ba + j * w / 4, b = bb + i * w / 4, e = E(a, b); if (e < be - 1e-15) { be = e; na = a; nb = b; } } ba = na; bb = nb; w *= 0.6; }
          const emin = E(ba, bb); let n = 0, minx = 9, maxx = -9, miny = 9, maxy = -9;
          for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) if (G[j][i] < emin + 0.03) { n++; const b = -2 + 4 * i / (NG - 1), a = -2 + 4 * j / (NG - 1); minx = Math.min(minx, b); maxx = Math.max(maxx, b); miny = Math.min(miny, a); maxy = Math.max(maxy, a); }
          return (cache[key] = { G, emin, ba, bb, ext: Math.hypot(maxx - minx, maxy - miny), E });
        };
        const look = (G) => (b, a) => { const fi = (b + 2) / 4 * (NG - 1), fj = (a + 2) / 4 * (NG - 1); const i = clamp(Math.floor(fi), 0, NG - 2), j = clamp(Math.floor(fj), 0, NG - 2), u = fi - i, w = fj - j; return (1 - u) * (1 - w) * G[j][i] + u * (1 - w) * G[j][i + 1] + (1 - u) * w * G[j + 1][i] + u * w * G[j + 1][i + 1]; };
        let info = {};
        v.render(() => {
          const sp = space.value, fk = fsel.value, f = FUNS[fk].f, g = grid(sp, fk), at = look(g.G);
          R.heat((b, a) => Math.log10(at(b, a) + 1e-3), { range: [Math.log10(g.emin + 1e-3), Math.log10(g.emin + 4)], cmap: 'viridis', res: 3, key: sp + fk });
          R.contour(at, [g.emin + 0.03], { color: 'green', width: 2.4 });
          R.dot(g.bb, g.ba, { color: 'green', r: 4 });
          const a = H.y, b = H.x, p = (x) => a + b * basis(sp, x), E = g.E(a, b);
          L.between((x) => p(x) - E, (x) => p(x) + E, -1, 1, { fill: 'blue', fillAlpha: 0.12 });
          L.fn(f, { color: 'ink', width: 2 });
          L.fn(p, { color: 'gold', width: 2 });
          L.fn((x) => g.ba + g.bb * basis(sp, x), { color: 'green', width: 1.6, dash: true });
          info = { E, g, sp, fk };
        });
        v.readout(() => `your $p$: $\\|f-p\\|_\\infty=${v.fix(info.E, 4)}$; smallest value on the map $E^*=${v.fix(info.g.emin, 4)}$ at $(\\beta,\\alpha)\\approx(${v.fix(info.g.bb, 3)},${v.fix(info.g.ba, 3)})$\n` + (info.g.ext > 0.6 ? `the set of near-minimizers (green outline) stretches over a distance $\\approx${v.fix(info.g.ext, 2)}$: a broad sampled valley is visible; this alone does not prove nonuniqueness` : 'the sampled near-minimizers form a small region; this alone does not prove uniqueness'));
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Chebyshev equioscillation theorem',
      statement: String.raw`Let $f$ be real-valued and continuous on $[a,b]$ and $n\ge0$. A polynomial $p$ of degree $\le n$ is the best sup-norm approximation of $f$ if and only if the error $f-p$ attains its maximum modulus $\|f-p\|_\infty$ with alternating signs at $n+2$ points $x_0<\dots<x_{n+1}$ of $[a,b]$: $(f-p)(x_j)=\pm(-1)^j\|f-p\|_\infty$. In particular the best approximation is unique, and its error has at least $n+2$ extrema of equal height.`,
      idea: String.raw`If $p$ has fewer than $n+2$ alternation points, a small polynomial of degree $\le n$ can be built with the sign pattern of the error at the (at most $n+1$) sign changes — it has a zero between consecutive alternation points, so its degree allows it — and subtracting a multiple of it from $p$ lowers the maximal error everywhere it is attained. Conversely if $n+2$ alternation points exist, a better $q$ would make $p-q$ (degree $\le n$) change sign $n+1$ times, which is too many roots (the de la Vallée-Poussin argument). This is the Haar-space characterization at work (4.6).`,
      caption: String.raw`The $n+1$ gold handles set the values of a degree-$n$ polynomial (it interpolates them at Chebyshev points); the bottom panel shows the error $f-p$, with the points where it reaches its maximum height marked. The numerical alternation check reports a near-best candidate when at least $n+2$ marked points alternate in sign. Press *snap to best* to jump to the Remez solution and see the error level out at $\pm E^*$; The theorem concerns exact extrema; this display locates them on a finite grid with a tolerance.`,
      deps: ['num-4.6'],
      refs: ['Trefethen ATAP Theorem10.1 and its complete proof, chap10.m'],
      tags: ['best approximation', 'equioscillation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equioscillation_theorem' },
      viz(v) {
        const fsel = v.select('$f$', [{ value: 'exp', label: '$e^x$' }, { value: 'cos', label: '$\\cos3x$' }, { value: 'runge', label: '$\\frac1{1+25x^2}$' }], 'exp');
        const nn = v.slider('degree $n$', 1, 5, 3, { int: true });
        const A = v.stage({ x: [-1, 1], y: [-1.2, 3], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$f$ and $p$' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: 'error $f-p$' });
        const H = [0, 1, 2, 3, 4, 5].map(() => A.handle(0, 0, { color: 'gold', constrain: 'y', r: 6 }));
        let last = '', hint = 0;
        const rng = v.rng(5);
        const jit = Array.from({ length: 6 }, () => (rng() - 0.5) * 0.5);
        v.button('snap to best', () => { const f = FUNS[fsel.value].f, n = nn.value, H0 = remez(f, n, { iters: 14 }), p = H0[H0.length - 1].p; chebPts(n).forEach((x, j) => H[j].set(x, p(x))); });
        v.button('perturb', () => { const rr = v.rng(Math.floor(Math.random() * 1e6)); H.forEach((h) => h.set(h.x, h.y + (rr() - 0.5) * 0.3)); });
        let info = {};
        v.legend([['ink', '$f$'], ['gold', '$p$'], ['green', 'extremal points'], ['red', '$\\pm E^*$ (best error)', { dash: true }]]);
        v.render(() => {
          const f = FUNS[fsel.value].f, n = nn.value, key = fsel.value + n;
          const xs = chebPts(n);
          H.forEach((h, j) => { h.visible = j <= n; });
          if (key !== last) { last = key; xs.forEach((x, j) => H[j].set(x, f(x) + jit[j] * (j % 2 ? 1 : -1))); }
          xs.forEach((x, j) => { if (Math.abs(H[j].x - x) > 1e-12) H[j].set(x, H[j].y); });
          const ys = xs.map((_, j) => H[j].y), w = baryW(xs), p = (x) => bary(xs, w, ys, x);
          const best = remez(f, n, { iters: 14, M: 800 }), Es = best[best.length - 1].emax;
          A.fn(f, { color: 'ink', width: 2 }); A.fn(p, { color: 'gold', width: 2.2 });
          const M = 1200, X = [], E = []; let mx = 0;
          for (let i = 0; i <= M; i++) { const x = -Math.cos(Math.PI * i / M); X.push(x); const e = f(x) - p(x); E.push(e); mx = Math.max(mx, Math.abs(e)); }
          const top = Math.max(mx, Es) * 1.3 + 1e-12; B.setView([-1, 1], [-top, top]);
          B.fn((x) => f(x) - p(x), { color: 'gold', width: 2, n: 800 });
          B.hline(Es, { color: 'red', dash: true }); B.hline(-Es, { color: 'red', dash: true }); B.hline(0, { color: 'faint' });
          // alternating extremal points: local extrema of |e| within 3% of the max
          const ext = [];
          for (let i = 0; i <= M; i++) { const a = Math.abs(E[i]), l = i > 0 ? Math.abs(E[i - 1]) : -1, r = i < M ? Math.abs(E[i + 1]) : -1; if (a >= l && a >= r && a >= 0.97 * mx) ext.push([X[i], E[i]]); }
          const alt = []; for (const c of ext) { const Lc = alt[alt.length - 1]; if (Lc && Math.sign(Lc[1]) === Math.sign(c[1])) { if (Math.abs(c[1]) > Math.abs(Lc[1])) alt[alt.length - 1] = c; } else alt.push(c); }
          alt.forEach((c) => B.dot(c[0], c[1], { color: 'green', r: 5 }));
          info = { mx, Es, k: alt.length, n };
        });
        v.readout(() => `$\\|f-p\\|_\\infty=${v.sci(info.mx, 3)}$ versus the numerical Remez estimate $E^*=${v.sci(info.Es, 3)}$; alternating extremal points found: **${info.k}** (need $n+2=${info.n + 2}$)\n` + (info.k >= info.n + 2 ? '**near-best candidate on the sampled grid**' : 'the sampled extrema do not yet establish equioscillation'));
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Algorithm',
      name: 'Remez exchange algorithm',
      statement: String.raw`To find the best degree-$n$ polynomial approximation of $f$ on $[-1,1]$: pick a reference $x_0<\dots<x_{n+1}$; solve the $n+2$ linear equations $f(x_j)-p(x_j)=(-1)^jh$ for $p$ (degree $\le n$) and the level $h$; replace the reference by the locations of the extrema of $f-p$ (keeping alternation) and repeat. Each step gives the bracket $|h|\le E^*\le\|f-p\|_\infty$ (de la Vallée-Poussin) and for smooth $f$ the two bounds converge quadratically to the best error $E^*$.`,
      idea: String.raw`For a given reference the levelled solution has $|h|$ equal to the best error *on that finite set*, hence a lower bound for $E^*$, while $\|f-p\|_\infty$ is an upper bound as for any $p$. Moving the reference to the extrema of the error increases $|h|$ strictly until the error equioscillates, which by the equioscillation theorem (4.7) means $p$ is the best approximation. The linear solves use the barycentric formula (3.9): $h$ is a quotient of divided differences.`,
      caption: String.raw`Slide the iteration count to step through Remez. Left: $f$, the current $p_k$ and the reference points (gold). Right: the error curve, the level $\pm h$ (dashed) it is forced to have on the reference, and the actual maximum. The readout lists the bracket $|h|\le E^*\le\max|f-p|$ per iteration. Try the *equispaced* start, or $|x|$ and the Runge function, where the reference must travel far.`,
      deps: ['num-4.7'],
      refs: ['Trefethen ATAP ch. 10'],
      credit: 'Remez, 1934',
      tags: ['best approximation', 'remez'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Remez_algorithm' },
      viz(v) {
        const fsel = v.select('$f$', [{ value: 'exp', label: '$e^x$' }, { value: 'abs', label: '$|x|$' }, { value: 'runge', label: 'Runge' }, { value: 'cos', label: '$\\cos 3x$' }], 'runge');
        const init = v.select('start', [{ value: 'cheb', label: 'Chebyshev points' }, { value: 'equi', label: 'equispaced' }], 'equi');
        const nn = v.slider('degree $n$', 1, 12, 6, { int: true });
        const kk = v.slider('iteration $k$', 0, 9, 3, { int: true });
        const A = v.stage({ x: [-1, 1], y: [-0.3, 1.2], axes: 'box', gutter: true, xlabel: 'x', height: 320, title: '$f$, $p_k$ and the reference' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'x', height: 320, title: 'error $f-p_k$' });
        let info = {};
        v.legend([['ink', '$f$'], ['accent', '$p_k$'], ['gold', 'reference points'], ['red', '$\\pm h$', { dash: true }], ['green', '$\\pm\\max|f-p_k|$', { dash: true }]]);
        v.render(() => {
          const f = FUNS[fsel.value].f, n = nn.value;
          const H = remez(f, n, { iters: 10, init: init.value, M: 1200 });
          const k = Math.min(kk.value, H.length - 1), st = H[k];
          const fr = []; for (let i = 0; i <= 200; i++) fr.push(f(-1 + i / 100));
          const lo = Math.min(...fr), hi = Math.max(...fr), pad = (hi - lo) * 0.25 + 1e-9;
          A.setView([-1, 1], [lo - pad, hi + pad]);
          A.fn(f, { color: 'ink', width: 2 }); A.fn(st.p, { color: 'accent', width: 2 });
          st.refs.forEach((x) => A.dot(x, f(x), { color: 'gold', r: 4 }));
          const e0 = supDiff(f, st.p, 600), top = Math.max(e0, Math.abs(st.h)) * 1.4 + 1e-14;
          B.setView([-1, 1], [-top, top]);
          B.fn((x) => f(x) - st.p(x), { color: 'accent', width: 2, n: 700 });
          B.hline(0, { color: 'faint' });
          for (const s of [1, -1]) { B.hline(s * Math.abs(st.h), { color: 'red', dash: true }); B.hline(s * e0, { color: 'green', dash: true }); }
          st.refs.forEach((x, j) => B.dot(x, f(x) - st.p(x), { color: 'gold', r: 4 }));
          info = { H, k, rows: H.slice(0, k + 1).map((s) => [Math.abs(s.h), s.emax]), conv: kk.value > H.length - 1 };
        });
        v.readout(() => info.rows.map((r, i) => `iteration ${i}: $|h|=${v.sci(r[0], 4)}\\;\\le\\;E^*\\;\\le\\;\\max|f-p|=${v.sci(r[1], 4)}$`).join('\n') + (info.conv ? '\n(converged earlier: further iterations change nothing)' : ''));
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Chebyshev interpolants are near-best',
      statement: String.raw`Let $p_n$ be the interpolant of $f\in C[-1,1]$ at the $n+1$ Chebyshev points and $p_n^*$ its best sup-norm approximation of degree $\le n$. Then
$$\|f-p_n\|_\infty\le(1+\Lambda_n)\|f-p_n^*\|_\infty,\qquad \Lambda_n\le\tfrac2\pi\log(n+1)+1,$$
where $\Lambda_n$ is the Lebesgue constant of the nodes. Thus the bound grows only logarithmically: it is $2+\tfrac2\pi\log(n+1)$, less than $10$ even at $n=10^5$, although computing it takes $O(n\log n)$ operations instead of an iteration.`,
      idea: String.raw`Interpolation is a linear projection $f\mapsto p_n$ that reproduces polynomials of degree $\le n$ and has norm $\Lambda_n$ (the Lebesgue constant, 3.10–3.11). For the best approximation $p^*$, $f-p_n=(f-p^*)-(p_n-p^*)=(f-p^*)-\mathcal I(f-p^*)$, and the triangle inequality gives the factor $1+\Lambda_n$. The logarithmic growth of $\Lambda_n$ for Chebyshev points is what makes the bound modest.`,
      caption: String.raw`Left: for the chosen function, sup errors of the best approximation (Remez, green) and of the Chebyshev interpolant (blue) against $n$ — the curves are hard to tell apart on a log scale. Right: the ratio interpolant/best for five functions and every even $n$, always below the black curve $1+\Lambda_n$ (estimated by numerical maximization) and mostly below $2$.`,
      deps: ['num-4.7', 'num-3.11'],
      refs: ['Trefethen ATAP Theorems15.1–15.2 and16.1, projection-error proof in chap15.m and chap16.m'],
      tags: ['best approximation', 'interpolation', 'lebesgue'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lebesgue%27s_lemma' },
      viz(v) {
        const names = Object.keys(FUNS).filter((k) => k !== 'lin');
        const fsel = v.select('highlight', names.map((k) => ({ value: k, label: `$${FUNS[k].tex}$` })), 'exp');
        const A = v.stage({ x: [2, 24], y: [1e-14, 2], ylog: true, axes: 'box', gutter: true, xlabel: 'degree n', height: 330, title: 'sup errors' });
        const B = v.stage({ x: [2, 24], y: [0.9, 5], axes: 'box', gutter: true, xlabel: 'degree n', height: 330, title: 'interpolant error / best error' });
        const NS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
        const DATA = {};
        for (const k of names) {
          DATA[k] = NS.map((n) => { const f = FUNS[k].f, eb = bestErr(f, n, { iters: 14, M: 700 }), ei = supDiff(f, chebInterp(f, n), 1500); return { n, eb, ei, r: ei / eb }; }).filter((d) => isFinite(d.eb));
        }
        const LEB = NS.map((n) => 1 + lebMax(chebPts(n)).L);
        const COLS = ['accent', 'orange', 'purple', 'teal', 'pink'];
        let info = {};
        v.legend([['green', 'best (Remez)'], ['accent', 'Chebyshev interpolant'], ['ink', '$1+\\Lambda_n$']]);
        v.render(() => {
          const k = fsel.value, D = DATA[k].filter((d) => d.eb > 1e-13);
          A.path(D.map((d) => [d.n, d.eb]), { color: 'green', width: 2.4 }); A.path(D.map((d) => [d.n, d.ei]), { color: 'accent', width: 1.6, dash: [5, 3] });
          B.path(NS.map((n, i) => [n, LEB[i]]), { color: 'ink', width: 2 });
          let worst = 0;
          names.forEach((nm, ci) => { const dd = DATA[nm].filter((d) => d.eb > 1e-13); B.dots(dd.map((d) => [d.n, d.r]), { color: nm === k ? 'red' : COLS[ci % 5], r: nm === k ? 5 : 3 }); dd.forEach((d) => { worst = Math.max(worst, d.r / LEB[NS.indexOf(d.n)]); }); });
          info = { k, worst, d: D[D.length - 1] };
        });
        v.readout(() => `highlighted (red dots): $${FUNS[info.k].tex}$, at $n=${info.d.n}$ ratio $${v.fix(info.d.r, 3)}$. Over all functions and degrees shown, the largest value of ratio$/(1+\\Lambda_n)$ is $${v.fix(info.worst, 3)}\\le1$ ✓ (points are drawn only while the best error exceeds $10^{-13}$, above rounding level).`);
      },
    },
  ],
};
