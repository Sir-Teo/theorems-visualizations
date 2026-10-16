// Deep Learning Theory — Chapter 2: Universal approximation and expressivity (items 2.1–2.6; 2.7–2.11 in ch02-b.js)
//
// Every approximation on screen is actually constructed or fitted (least squares on output weights, exact interpolation,
// Maurey–Barron sampling), and every error is measured on a grid or a seeded test sample.
import {
  clamp, sigm, rand, hashStr, memo, lstsq, colRank, modulus, tent, sawtooth, note, titler, mnus, tsci, tbig, plEval, plSimplify, plPieces,
} from './ch02.shared.js';

const CYC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'blue'];
/** 1D targets on [0,1] shared by 2.1 (each with a short description of its regularity). */
const TARGETS1 = {
  smooth: { f: (x) => 0.5 + 0.35 * Math.sin(7 * x) * Math.exp(-x) + 0.1 * Math.cos(17 * x), label: 'smooth' },
  kink: { f: (x) => 0.2 + 0.9 * Math.abs(x - 0.43) - 0.6 * Math.max(0, x - 0.8), label: 'kinks' },
  sqrt: { f: (x) => 0.1 + 0.8 * Math.sqrt(Math.abs(x - 0.3)) * (x < 0.3 ? 0.6 : 1), label: '$\\sqrt{|x-0.3|}$' },
  jump: { f: (x) => (x < 0.55 ? 0.25 + 0.2 * x : 0.75 + 0.1 * Math.sin(9 * x)), label: 'jump' },
};
const NS1 = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256];

export default {
  collection: 'deep',
  chapter: 2,
  title: 'Universal approximation and expressivity',
  summary: String.raw`Wide enough shallow networks approximate any continuous function on a compact set, provided the activation is not a polynomial — the universal approximation theorem. That guarantee says nothing about cost: generic Lipschitz targets need a number of units exponential in the dimension, while targets whose Fourier transform has a finite first moment escape the curse at a dimension-free rate (Barron). Depth changes the accounting: composing layers multiplies the number of linear pieces, so some functions that deep networks compute cheaply need exponentially wide shallow ones, $x^2$ and products are approximated with error falling exponentially in depth, narrow but deep networks are universal too, and a two-layer network with about $2n$ weights can memorise any $n$ labelled points.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: 'Universal approximation by ReLU networks in 1D',
      statement: String.raw`Let $f:[a,b]\to\R$ be continuous and let $\omega_f(\delta)=\sup\{|f(x)-f(y)|:|x-y|\le\delta\}$ be its modulus of continuity. For every $n\ge1$, the shallow ReLU network with $n$ hidden units
$$N_n(x)=f(x_0)+\sum_{k=0}^{n-1}c_k\,\mathrm{ReLU}(x-x_k),\qquad x_k=a+k\,\tfrac{b-a}n,$$
with $c_0$ the slope of the first segment and $c_k$ the change of slope at $x_k$, is the piecewise-linear interpolant of $f$ at the $n+1$ equally spaced knots, and
$$\sup_{x\in[a,b]}|f(x)-N_n(x)|\le\omega_f\!\left(\tfrac{b-a}n\right)\xrightarrow[n\to\infty]{}0 .$$
So shallow ReLU networks are dense in $C[a,b]$ with the sup norm. If $f$ is $L$-Lipschitz the error is at most $L(b-a)/n$, and if $f\in C^2$ it is at most $\norm{f''}_\infty(b-a)^2/(8n^2)$.`,
      idea: String.raw`A continuous piecewise-linear function is a sum of hinges, one per kink (1.3), so the interpolant is exactly a width-$n$ ReLU network. On each cell $[x_k,x_{k+1}]$ the interpolant is a convex combination of $f(x_k)$ and $f(x_{k+1})$, both within $\omega_f(h)$ of $f(x)$ for every $x$ in the cell, so the error is at most $\omega_f(h)$. The whole proof then rests on uniform continuity: a continuous function on the compact interval has $\omega_f(h)\to0$ (pma-4.19). A discontinuous target breaks exactly this step: near a jump of size $J$ the error never drops below about $J/2$.`,
      caption: String.raw`Left: the target (grey) and the width-$n$ ReLU interpolant (blue), with the gap between them shaded and the largest gap marked. Choose a target or *draw your own* (drag across the left panel), or type a formula. Right, on log scales: the measured sup error for $n=1,\dots,256$ (dots) and the bound $\omega_f(1/n)$ (line), computed from the target itself; smooth targets fall like $n^{-2}$, kinks like $n^{-1}$, $\sqrt{|x|}$ like $n^{-1/2}$, and the jump never falls.`,
      deps: ['deep-1.3', 'pma-4.19'],
      refs: ['Prince §3.2'],
      tags: ['universal approximation', 'ReLU'],
      viz(v) {
        const tgS = v.select('target', [...Object.entries(TARGETS1).map(([k, t]) => ({ value: k, label: t.label })), { value: 'draw', label: 'draw' }, { value: 'formula', label: 'formula' }], 'smooth');
        const fx = v.input('$f(x)=$', '0.5 + 0.3 sin(12 x^2)', { vars: ['x'], width: 200 });
        const nS = v.slider('hidden units $n$', 1, 256, 8, { log: true, int: true });
        const sL = v.stage({ x: [0, 1], y: [-0.05, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$x$', weight: 1.2, title: 'target $f$ and the ReLU interpolant $N_n$' });
        const sR = v.stage({ x: [0.8, 320], y: [1e-6, 1], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', weight: 0.9, title: 'sup error against $n$' });
        const G = 1024, drawn = Float64Array.from({ length: G + 1 }, (_, i) => 0.5 + 0.3 * Math.sin(6.3 * i / G));
        let last = null;
        sL.onDrag((x, y, ph) => { if (tgS.value !== 'draw') tgS.set('draw'); const i = Math.round(clamp(x, 0, 1) * G); y = clamp(y, 0, 1); if (ph === 'start' || !last) last = [i, y]; const [i0, y0] = last, a = Math.min(i, i0), b = Math.max(i, i0); for (let j = a; j <= b; j++) drawn[j] = i === i0 ? y : y0 + ((y - y0) * (j - i0)) / (i - i0); last = [i, y]; ver++; if (ph === 'end') last = null; });
        let ver = 0;
        const target = () => {
          const k = tgS.value; if (TARGETS1[k]) return TARGETS1[k].f;
          if (k === 'draw') return (x) => { const u = clamp(x, 0, 1) * G, i = Math.min(G - 1, Math.floor(u)); return drawn[i] + (drawn[i + 1] - drawn[i]) * (u - i); };
          const f = fx.fn; return f ? (x) => { const y = f(x); return isFinite(y) ? y : 0; } : () => 0;
        };
        const curves = memo();
        const interp = (f, n) => { const P = []; for (let k = 0; k <= n; k++) P.push([k / n, f(k / n)]); return P; };
        const sup = (f, P) => { let e = 0, at = 0; for (let i = 0; i <= 4000; i++) { const x = i / 4000, d = Math.abs(f(x) - plEval(P, x)); if (d > e) { e = d; at = x; } } return { e, at }; };
        let info = null;
        v.render(() => {
          fx.el.hidden = tgS.value !== 'formula';
          const f = target(), n = nS.value, P = interp(f, n);
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 400; i++) { const y = f(i / 400); lo = Math.min(lo, y); hi = Math.max(hi, y); }
          if (tgS.value !== 'draw') { const pad = 0.08 * (hi - lo || 1); sL.setView([0, 1], [Math.min(-0.05, lo - pad), Math.max(1.05, hi + pad)]); } else sL.setView([0, 1], [-0.05, 1.05]);
          sL.between(f, (x) => plEval(P, x), 0, 1, { fill: 'red', fillAlpha: 0.18, n: 800 });
          sL.fn(f, { color: 'muted', width: 3, n: 1200 });
          sL.path(P, { color: 'accent', width: 2.2 });
          if (n <= 64) sL.dots(P, { r: 3, color: 'accent' });
          const S = sup(f, P);
          sL.line(S.at, f(S.at), S.at, plEval(P, S.at), { color: 'red', width: 2.4 });
          // error curve
          const key = tgS.value + '|' + (tgS.value === 'draw' ? ver : tgS.value === 'formula' ? fx.value : '');
          const C = curves(key, () => { const vals = Array.from({ length: 4097 }, (_, i) => f(i / 4096)), om = modulus(vals); return NS1.map((m) => [m, sup(f, interp(f, m)).e, om(4096 / m)]); });
          sR.path(C.map((c) => [c[0], Math.max(c[2], 1e-7)]), { color: 'orange', width: 2.4 });
          sR.dots(C.map((c) => [c[0], Math.max(c[1], 1e-7)]), { r: 3.6, color: 'accent' });
          for (const [p, lab] of [[1, 'n^{-1}'], [2, 'n^{-2}']]) { sR.fn((m) => 0.3 * m ** -p, { color: 'faint', width: 1, dash: [4, 4] }); sR.tex(lab, 260, 0.3 * 260 ** -p, { color: 'muted', size: 12, dy: -9, align: 'right' }); }
          sR.vline(n, { color: 'gold', width: 1.4 }); sR.dot(n, Math.max(S.e, 1e-7), { r: 5, color: 'gold' });
          const vals = Array.from({ length: 4097 }, (_, i) => f(i / 4096));
          info = { n, e: S.e, om: modulus(vals)(4096 / n), slope: Math.log(C[C.length - 1][1] / C[C.length - 5][1]) / Math.log(C[C.length - 1][0] / C[C.length - 5][0]) };
        });
        v.legend([['muted', 'target $f$'], ['accent', 'ReLU network $N_n$ (dots right: measured sup error)'], ['orange', 'bound $\\omega_f(1/n)$'], ['red', 'largest gap']]);
        v.readout(() => info && String.raw`$n=${info.n}$ hidden units: $\lVert f-N_n\rVert_\infty=${tsci(info.e, 3)}$ $\le\omega_f(1/n)=${tsci(info.om, 3)}$ ${info.e <= info.om + 1e-12 ? '✓' : '✗'} · measured rate between $n=64$ and $256$: error $\propto n^{${mnus(info.slope.toFixed(2))}}$` + (info.slope > -0.1 ? ' — **not converging: the target is not continuous**' : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Universal approximation theorem (Cybenko, Hornik)',
      credit: 'Cybenko, 1989; Hornik, Stinchcombe & White, 1989; Hornik, 1991; Leshno, Lin, Pinkus & Schocken, 1993',
      statement: String.raw`Let $K\subset\R^d$ be compact and $\sigma:\R\to\R$ continuous. If $\sigma$ is **sigmoidal** ($\sigma(t)\to1$ as $t\to\infty$ and $\to0$ as $t\to-\infty$; Cybenko), or more generally if $\sigma$ is **not a polynomial** (Leshno–Lin–Pinkus–Schocken), then the shallow networks
$$g(x)=\sum_{k=1}^N v_k\,\sigma(w_k\cdot x+b_k),\qquad N\in\N,\ v_k,b_k\in\R,\ w_k\in\R^d,$$
are dense in $C(K)$ with the sup norm: for every continuous $f$ and $\eps>0$ some $g$ has $\sup_K|f-g|<\eps$. The theorem asserts existence only; it gives no bound on $N$ (see 2.4, 2.5). Discontinuous targets cannot be approximated uniformly, since uniform limits of continuous functions are continuous; they can still be approximated in $L^p$.`,
      idea: String.raw`Cybenko's proof is by duality. If the closure of the span were a proper subspace of $C(K)$, the Hahn–Banach theorem (rca-5.19) would give a non-zero bounded linear functional vanishing on it, and by the Riesz representation theorem (rca-6.19) that functional is a signed measure $\mu$ with $\int\sigma(w\cdot x+b)\,d\mu=0$ for all $w,b$. Steepening $\sigma(\lambda(w\cdot x+b))$ into a step shows $\mu$ gives zero mass to every half-space, which forces $\mu=0$ — a contradiction (2.11 shows this argument). Alternative routes go through Stone–Weierstrass (pma-7.32): ridge functions $\cos(w\cdot x)$ span a dense algebra, and each one-dimensional ridge is approximated as in 2.1.`,
      caption: String.raw`A two-dimensional target on the unit square (left) and the best least-squares combination of $N$ ridge units $\sigma(w_k\cdot x+b_k)$ with seeded random directions and offsets (middle); right, the error $|f-g|$. Raise $N$ and the error map fades; below, the sup and root-mean-square errors against $N$. With the *disc* target (a jump along a circle), the RMS error keeps falling but the sup error is stuck near half the jump: uniform approximation of a discontinuous function is impossible. Try ReLU units too.`,
      deps: ['deep-2.1', 'pma-7.32', 'rca-5.19', 'rca-6.19'],
      refs: ['Goodfellow §6.4', 'Prince §3.2'],
      tags: ['universal approximation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Universal_approximation_theorem' },
      viz(v) {
        const tgS = v.select('target', [{ value: 'bumps', label: 'two bumps' }, { value: 'wave', label: 'saddle wave' }, { value: 'disc', label: 'disc (discontinuous)' }], 'bumps');
        const actS = v.select('units', [{ value: 'sig', label: 'sigmoid' }, { value: 'relu', label: 'ReLU' }], 'sig');
        const nS = v.slider('units $N$', 1, 256, 24, { log: true, int: true });
        const TG = {
          bumps: (x, y) => Math.exp(-18 * ((x - 0.3) ** 2 + (y - 0.35) ** 2)) - 0.8 * Math.exp(-12 * ((x - 0.7) ** 2 + (y - 0.7) ** 2)),
          wave: (x, y) => Math.sin(5 * x) * Math.cos(4 * y) * 0.8,
          disc: (x, y) => ((x - 0.5) ** 2 + (y - 0.52) ** 2 < 0.09 ? 0.8 : -0.2),
        };
        const sT = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 250, axes: false, minWidth: 220, title: 'target $f$' });
        const sA = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 250, axes: false, minWidth: 220, title: 'network $g$ ($N$ units)' });
        const sE = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 250, axes: false, minWidth: 220, title: 'error $|f-g|$' });
        const sC = v.stage({ x: [0.8, 320], y: [2e-4, 1.5], xlog: true, ylog: true, height: 210, full: true, axes: 'box', gutter: true, xlabel: 'units $N$', title: 'error against the number of units' });
        const units = (act, N) => { const r = rand(hashStr('ua2|' + act)), U = []; for (let k = 0; k < 256; k++) { const th = r() * 2 * Math.PI, s = act === 'sig' ? 6 + 18 * r() : 1, p = [r() * 1.2 - 0.1, r() * 1.2 - 0.1]; const w = [s * Math.cos(th), s * Math.sin(th)]; U.push([w[0], w[1], -(w[0] * p[0] + w[1] * p[1])]); } return U.slice(0, N); };
        const phi = (act, u, x, y) => { const z = u[0] * x + u[1] * y + u[2]; return act === 'sig' ? sigm(z) : Math.max(0, z); };
        const TR = []; for (let i = 0; i < 30; i++) for (let j = 0; j < 30; j++) TR.push([(i + 0.5) / 30, (j + 0.5) / 30]);
        const fit = (tg, act, N) => { const U = units(act, N), f = TG[tg]; const A = TR.map(([x, y]) => [1, ...U.map((u) => phi(act, u, x, y))]), c = lstsq(A, TR.map(([x, y]) => f(x, y)), 1e-9); const g = (x, y) => { let s = c[0]; for (let k = 0; k < U.length; k++) s += c[k + 1] * phi(act, U[k], x, y); return s; }; return g; };
        const errs = (tg, g) => { const f = TG[tg]; let sup = 0, ss = 0, n = 0; for (let i = 0; i <= 70; i++) for (let j = 0; j <= 70; j++) { const x = i / 70, y = j / 70, d = Math.abs(f(x, y) - g(x, y)); sup = Math.max(sup, d); ss += d * d; n++; } return [sup, Math.sqrt(ss / n)]; };
        const fits = memo(), curves = memo();
        let info = null;
        v.render(() => {
          const tg = tgS.value, act = actS.value, N = nS.value, f = TG[tg];
          const g = fits([tg, act, N].join('|'), () => fit(tg, act, N));
          const key = [tg, act, N].join('|');
          sT.heat(f, { cmap: 'theme-diverging', neg: 'accent', pos: 'orange', range: [-1, 1], res: 3, key: tg });
          sA.heat(g, { cmap: 'theme-diverging', neg: 'accent', pos: 'orange', range: [-1, 1], res: 3, key });
          sE.heat((x, y) => Math.abs(f(x, y) - g(x, y)), { cmap: 'theme', color: 'red', range: [0, 0.25], res: 3, key });
          const [sup, rms] = errs(tg, g);
          note(sE, `sup ${sup.toFixed(3)}`, 'tl');
          if (N <= 40) units(act, N).forEach((u) => { const nn = Math.hypot(u[0], u[1]), p0 = [(-u[2] * u[0]) / (nn * nn), (-u[2] * u[1]) / (nn * nn)], d = [-u[1] / nn, u[0] / nn]; sA.line(p0[0] - 3 * d[0], p0[1] - 3 * d[1], p0[0] + 3 * d[0], p0[1] + 3 * d[1], { color: 'ink', width: 0.7, alpha: 0.3 }); });
          const C = curves(tg + '|' + act, () => [1, 2, 4, 8, 16, 32, 64, 128, 256].map((m) => [m, ...errs(tg, fit(tg, act, m))]));
          sC.path(C.map((c) => [c[0], c[1]]), { color: 'red', width: 2.4 }); sC.dots(C.map((c) => [c[0], c[1]]), { r: 3.4, color: 'red' });
          sC.path(C.map((c) => [c[0], c[2]]), { color: 'accent', width: 2.4 }); sC.dots(C.map((c) => [c[0], c[2]]), { r: 3.4, color: 'accent' });
          sC.vline(N, { color: 'gold', width: 1.4 }); sC.dot(N, sup, { r: 5, color: 'gold' }); sC.dot(N, rms, { r: 5, color: 'gold' });
          if (tg === 'disc') sC.hline(0.5, { color: 'muted', width: 1, dash: [5, 4] });
          info = { N, sup, rms, tg, last: C[C.length - 1] };
        });
        v.legend([['accent', 'RMS error'], ['red', 'sup error'], ['gold', 'current $N$', { dot: true }]]);
        v.readout(() => info && String.raw`$N=${info.N}$ units (${3 * info.N + 1} parameters, output weights by least squares on a $30\times30$ grid): sup error ${info.sup.toFixed(4)}, RMS error ${info.rms.toFixed(4)} on a $71\times71$ grid` + (info.tg === 'disc' ? ` · at $N=256$ the sup error is still ${info.last[1].toFixed(3)} $\approx\tfrac12\times$ jump $=0.5$: **no continuous $g$ can do better than half the jump**` : ` · at $N=256$: sup ${info.last[1].toFixed(4)}`));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Universality needs a non-polynomial activation',
      credit: 'Leshno, Lin, Pinkus & Schocken, 1993',
      statement: String.raw`Let $\sigma$ be continuous (more generally, locally bounded and continuous almost everywhere). Shallow networks $\sum_k v_k\sigma(w_k\cdot x+b_k)$ are dense in $C(K)$ for every compact $K\subset\R^d$ **if and only if $\sigma$ is not a polynomial**. If $\sigma$ is a polynomial of degree $p$, every such network, of any width, is a polynomial of degree at most $p$ in $x$: the networks span a fixed finite-dimensional space (for $d=1$, of dimension at most $p+1$), so the best approximation error to a target outside it is bounded away from zero no matter how many units are used.`,
      idea: String.raw`The easy direction: $(w\cdot x+b)^p$ expands into monomials of degree $\le p$, so sums of such units stay in the polynomials of degree $\le p$, a closed proper subspace. The hard direction (Leshno et al.) shows that if $\sigma$ is not a polynomial, then derivatives in $w$ of $\sigma(wx+b)$ produce $x^k\sigma^{(k)}(b)$ with $\sigma^{(k)}(b)\neq0$ for some $b$ and every $k$; such derivatives are limits of difference quotients, i.e. of networks, so all monomials, hence all polynomials, lie in the closure, and the Weierstrass theorem (pma-7.26) finishes. The same reasoning shows deep polynomial networks are polynomials of bounded degree too.`,
      caption: String.raw`Shallow networks on $[-1,1]$ with seeded inner weights (kinks or centres spread evenly over $[-1,1]$, random slopes) and least-squares output weights, fitted to a wiggly target. Left: the fits at the chosen width. Right: the error against width (log scale). The $x^2$ and $x^3$ networks hit a floor at exactly the error of the best quadratic or cubic polynomial (dashed), because their feature matrix never has rank above $3$ or $4$ (readout); $\tanh$ and ReLU keep improving.`,
      deps: ['deep-2.2', 'pma-7.26'],
      refs: ['Goodfellow §6.4'],
      tags: ['activation', 'polynomial'],
      viz(v) {
        const nS = v.slider('width $N$', 1, 64, 12, { int: true });
        const tf = (x) => Math.sin(4 * x) + 0.5 * Math.cos(9 * x + 0.5) + 0.3 * x + 0.9 * x * x - 0.3;
        const ACT = [['sq', 'purple', '$z^2$', (z) => z * z], ['cube', 'teal', '$z^3$', (z) => z * z * z], ['tanh', 'accent', '$\\tanh z$', Math.tanh], ['relu', 'orange', 'ReLU', (z) => Math.max(0, z)]];
        const sL = v.stage({ x: [-1, 1], y: [-2.2, 2.2], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'target and fits at width $N$' });
        const sR = v.stage({ x: [1, 64], y: [1e-5, 4], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'width $N$', title: 'sup error against width' });
        const X = Array.from({ length: 401 }, (_, i) => -1 + i / 200), Y = X.map(tf);
        const U = (() => { const r = rand(31), o = []; for (let k = 0; k < 64; k++) { const w = (r() < 0.5 ? -1 : 1) * (1.5 + 3 * r()), c = -1.05 + 2.1 * ((k * 0.6180339887 + 0.31) % 1); o.push([w, -w * c]); } return o; })();
        const fitW = (phi, N) => { const A = X.map((x) => [1, ...U.slice(0, N).map(([w, b]) => phi(w * x + b))]), c = lstsq(A, Y, 1e-12); const g = (x) => { let s = c[0]; for (let k = 0; k < N; k++) s += c[k + 1] * phi(U[k][0] * x + U[k][1]); return s; }; return { g, A }; };
        const supE = (g) => X.reduce((m, x, i) => Math.max(m, Math.abs(g(x) - Y[i])), 0);
        const poly = (p) => { const A = X.map((x) => Array.from({ length: p + 1 }, (_, j) => x ** j)), c = lstsq(A, Y, 1e-14); return supE((x) => c.reduce((s, cj, j) => s + cj * x ** j, 0)); };
        const floors = { sq: poly(2), cube: poly(3) };
        // least-squares minimizes the mean square, so the floor is that of the L2-best polynomial measured in sup norm
        const curves = memo();
        const C = () => curves('c', () => ACT.map(([k, , , phi]) => Array.from({ length: 64 }, (_, i) => [i + 1, supE(fitW(phi, i + 1).g)])));
        let info = null;
        v.render(() => {
          const N = nS.value, cs = C();
          sL.fn(tf, { color: 'muted', width: 3.4 });
          const ranks = {};
          ACT.forEach(([k, col, , phi]) => { const { g, A } = fitW(phi, N); sL.fn(g, { color: col, width: 2 }); ranks[k] = colRank(A.map((r) => r.slice(1)), 1e-8); });
          ACT.forEach(([k, col], i) => { sR.path(cs[i], { color: col, width: 2.2 }); sR.dot(N, cs[i][N - 1][1], { r: 4.5, color: col }); });
          sR.hline(floors.sq, { color: 'purple', width: 1.2, dash: [5, 4] }); sR.hline(floors.cube, { color: 'teal', width: 1.2, dash: [5, 4] });
          sR.vline(N, { color: 'gold', width: 1.2 });
          info = { N, ranks, e: Object.fromEntries(ACT.map(([k], i) => [k, cs[i][N - 1][1]])) };
        });
        v.legend([['muted', 'target'], ...ACT.map(([, c, l]) => [c, `activation ${l}`]), ['purple', 'best quadratic / cubic (L² fit)', { dash: true }]]);
        v.readout(() => info && String.raw`width $N=${info.N}$ · rank of the $401\times N$ feature matrix: $z^2$ → **${info.ranks.sq}**, $z^3$ → **${info.ranks.cube}**, $\tanh$ → ${info.ranks.tanh}, ReLU → ${info.ranks.relu} · sup errors $${tsci(info.e.sq)}$, $${tsci(info.e.cube)}$, $${tsci(info.e.tanh)}$, $${tsci(info.e.relu)}$ · floors of the best quadratic and cubic: ${floors.sq.toFixed(3)}, ${floors.cube.toFixed(3)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Curse of dimensionality for approximation',
      statement: String.raw`Approximating functions by local units — bumps, hat functions, or ReLU networks that build them — costs exponentially many units in the dimension. To approximate every $1$-Lipschitz function on $[0,1]^d$ to sup-norm accuracy $\eps$ with a grid of local units, the mesh must be $h\approx\eps$ (up to a factor $\sqrt d$), so about $(1/\eps)^d$ units are needed; equivalently, with $N$ units the error decays only like $N^{-1/d}$. This is not a weakness of grids: for the whole Lipschitz class, any method with $N$ parameters depending continuously on the target has worst-case error of order $N^{-1/d}$ (DeVore, Howard & Micchelli 1989). Escaping the curse requires restricting the target class (2.5) or exploiting structure such as compositions or low intrinsic dimension.`,
      idea: String.raw`Piecewise-multilinear interpolation on a grid of spacing $h=1/n$ is a sum of $(n+1)^d$ tensor-product hat functions; each point lies in a cell whose corners are within $h\sqrt d$ of it, so the error of a $1$-Lipschitz target is at most $h\sqrt d$. Making that $\le\eps$ needs $n\ge\sqrt d/\eps$, i.e. $N=(n+1)^d\approx(\sqrt d/\eps)^d$ units. The lower bound comes from packing: on a grid of $(1/\eps)^d$ cells one can place independent bumps of height $\eps$ with any sign pattern, and a method with fewer parameters cannot tell all $2^{(1/\eps)^d}$ patterns apart.`,
      caption: String.raw`Left: in $d=2$, the distance $f(x)=\min_j\lVert x-c_j\rVert$ to a seeded cloud of points (red; a $1$-Lipschitz target with kinks everywhere) and its approximation by $(n+1)^2$ hat units on an $n\times n$ grid; grey contours are $f$, black ones the approximation. Right: measured sup error (over seeded random test points) against the number of units for $d=1,2,3,4$, with the bound $\sqrt d/n$ dashed: the slope is $-1/d$, so each extra dimension makes the line flatter. Set the accuracy $\eps$ and read how many units each dimension needs.`,
      deps: ['deep-2.1'],
      refs: ['Prince §20.1', 'Prince §8'],
      tags: ['curse of dimensionality', 'approximation'],
      viz(v) {
        const nS = v.slider('grid cells per side $n$ (left)', 1, 24, 5, { int: true });
        const eS = v.slider('accuracy $\\varepsilon$', 0.005, 0.3, 0.05, { log: true });
                const sL = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 0.9, minWidth: 240, xlabel: '$x_1$', ylabel: '$x_2$', title: '$d=2$: hat-function approximation' });
        const sR = v.stage({ x: [1, 1e5], y: [3e-3, 2], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, weight: 1.1, xlabel: 'number of units $N$', title: 'sup error against $N$' });
        const CENT = [1, 2, 3, 4].map((d) => { const r = rand(77 + d), o = []; for (let j = 0; j < 12 * d; j++) o.push(Array.from({ length: d }, () => r())); return o; });
        /** 1-Lipschitz target: distance to a seeded cloud of points (kinks along Voronoi edges everywhere) */
        const cone = (x, d) => { let best = Infinity; for (const c of CENT[d - 1]) { let s = 0; for (let i = 0; i < d; i++) s += (x[i] - c[i]) ** 2; if (s < best) best = s; } return Math.sqrt(best); };
        /** multilinear interpolation of the cone on an n-per-side grid in d dims */
        const interp = (x, d, n) => {
          const i0 = [], t = []; for (let k = 0; k < d; k++) { const u = clamp(x[k], 0, 1) * n, i = Math.min(n - 1, Math.floor(u)); i0.push(i); t.push(u - i); }
          let s = 0;
          for (let m = 0; m < 1 << d; m++) { let w = 1; const c = []; for (let k = 0; k < d; k++) { const b = (m >> k) & 1; w *= b ? t[k] : 1 - t[k]; c.push((i0[k] + b) / n); } if (w) s += w * cone(c, d); }
          return s;
        };
        const TEST = (d) => { const r = rand(40 + d), o = []; for (let i = 0; i < 3000; i++) o.push(Array.from({ length: d }, () => r())); return o; };
        const DCOL = ['accent', 'green', 'orange', 'purple'];
        const NMAX = { 1: 4096, 2: 160, 3: 32, 4: 14 };
        const curves = memo();
        const C = () => curves('c', () => [1, 2, 3, 4].map((d) => { const T = TEST(d), out = []; for (let n = 1; n <= NMAX[d]; n = Math.max(n + 1, Math.round(n * 1.5))) { let e = 0; for (const x of T) e = Math.max(e, Math.abs(interp(x, d, n) - cone(x, d))); out.push([(n + 1) ** d, e, n]); } return out; }));
        let info = null;
        v.render(() => {
          const n = nS.value;
          sL.heat((x, y) => interp([x, y], 2, n), { cmap: 'theme', color: 'accent', range: [0, 0.3], res: 3, key: 'g' + n });
          sL.contour((x, y) => cone([x, y], 2), [0.05, 0.1, 0.15], { color: 'muted', width: 1, res: 120 });
          sL.contour((x, y) => interp([x, y], 2, n), [0.05, 0.1, 0.15], { color: 'ink', width: 1.4, res: 120 });
          for (let k = 0; k <= n; k++) { sL.vline(k / n, { color: 'gold', width: 0.8, alpha: 0.6 }); sL.hline(k / n, { color: 'gold', width: 0.8, alpha: 0.6 }); }
          CENT[1].forEach((c) => sL.dot(c[0], c[1], { r: 3, color: 'red' }));
          const cs = C();
          cs.forEach((pts, i) => { const d = i + 1; sR.fn((N) => Math.sqrt(d) / (N ** (1 / d) - 1), { color: DCOL[i], width: 1, dash: [4, 4], alpha: 0.8 }); sR.path(pts, { color: DCOL[i], width: 2.4 }); sR.dots(pts, { r: 3, color: DCOL[i] }); });
          sR.hline(eS.value, { color: 'red', width: 1.4 });
          const need = (d) => (Math.ceil(Math.sqrt(d) / eS.value) + 1) ** d;
          const slopes = cs.map((pts) => { const a = pts[pts.length - 4], b = pts[pts.length - 1]; return Math.log(b[1] / a[1]) / Math.log(b[0] / a[0]); });
          let e2 = 0; for (let i = 0; i <= 60; i++) for (let j = 0; j <= 60; j++) e2 = Math.max(e2, Math.abs(interp([i / 60, j / 60], 2, n) - cone([i / 60, j / 60], 2)));
          info = { n, e2, need, slopes };
        });
        v.legend([['accent', '$d=1$'], ['green', '$d=2$'], ['orange', '$d=3$'], ['purple', '$d=4$'], ['muted', 'bound $\\sqrt d/n$', { dash: true }], ['red', 'target accuracy $\\varepsilon$']]);
        v.readout(() => info && String.raw`left: $(n+1)^2=${(info.n + 1) ** 2}$ units, sup error ${info.e2.toFixed(4)} $\le\sqrt2/n=${(Math.SQRT2 / info.n).toFixed(4)}$ · measured slopes ${info.slopes.map((s, i) => `$d=${i + 1}$: ${mnus(s.toFixed(2))}`).join(', ')} (theory $-1/d$) · units guaranteeing $\varepsilon=${eS.value.toFixed(3)}$: ${[1, 2, 3, 5, 10, 20].map((d) => `$d=${d}$: $${tbig(info.need(d))}$`).join(' · ')}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Barron’s theorem: dimension-free approximation rates',
      credit: 'Barron, 1993 (building on Maurey and Jones, 1992)',
      statement: String.raw`Let $f:\R^d\to\R$ have a Fourier representation $f(x)=\int e^{i\omega\cdot x}\hat F(d\omega)$ with finite **Barron constant** $C_f=\int\lVert\omega\rVert\,|\hat F|(d\omega)$, and let $\mu$ be any probability measure on the unit ball $B$. Then for every $n$ there is a shallow network with $n$ sigmoidal units,
$$f_n(x)=c_0+\sum_{k=1}^n c_k\,\sigma(w_k\cdot x+b_k),\qquad\text{with}\qquad \lVert f-f_n\rVert_{L^2(\mu)}\le\frac{2C_f}{\sqrt n}.$$
The rate $n^{-1/2}$ does not depend on $d$, unlike the $n^{-1/d}$ of generic Lipschitz targets (2.4). The dimension hides in $C_f$: the class of functions with $C_f\le C$ shrinks rapidly as $d$ grows, and functions with heavy Fourier tails (rough or discontinuous ones) have $C_f=\infty$.`,
      idea: String.raw`Write $f-f(0)$ as an average: each Fourier mode $\cos(\omega\cdot x+\varphi)-\cos\varphi$ is a 1D function of the ridge $z=\hat\omega\cdot x$ with derivative bounded by $\lVert\omega\rVert$, hence (integrating its derivative, as in 2.1) an average of step units $\mathbf 1\{\hat\omega\cdot x\ge t\}$ with coefficients at most $2\lVert\omega\rVert$. Weighting modes by $\lVert\omega\rVert|\hat F|$ turns $f-f(0)$ into the expectation of a random step unit with coefficient bounded by $2C_f$. Maurey's lemma: the average of $n$ independent draws has mean-square error at most $(2C_f)^2/n$ — so some draw does at least that well. Steep sigmoids approximate the steps.`,
      caption: String.raw`The proof run as an experiment. Targets on the unit ball in $d=2$, $10$ and $50$ are sums of a few Fourier modes, so $C_f$ is known exactly. Each line is one seeded run of Barron's construction — $n$ random step units with bounded coefficients — and plots the $L^2(\mu)$ error ($\mu$ uniform on the ball, 600 test points) against $n$: all three fall like $n^{-1/2}$ under the bound $2C_f/\sqrt n$. Right: the target and $f_n$ along a line through the ball, for the chosen $d$ and $n$ — a staircase of $n$ steps. The *rough* target has hundreds of modes with heavy tails, so $C_f$ is enormous and the bound is useless.`,
      deps: ['deep-2.2', 'rca-9.1'],
      refs: ['Goodfellow §6.4'],
      tags: ['Barron', 'approximation rates'],
      viz(v) {
        const tgS = v.select('target', [{ value: 'smooth', label: 'smooth (6 modes)' }, { value: 'rough', label: 'rough (heavy Fourier tail)' }], 'smooth');
        const dS = v.select('slice in dimension', [{ value: 2, label: '$d=2$' }, { value: 10, label: '$d=10$' }, { value: 50, label: '$d=50$' }], 10);
        const nS = v.slider('units $n$ (slice)', 1, 4096, 64, { log: true, int: true });
        const DS = [2, 10, 50], DC = { 2: 'accent', 10: 'green', 50: 'purple' };
        const sR = v.stage({ x: [0.8, 5000], y: [1e-3, 30], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: 'units $n$', weight: 1.1, title: '$L^2(\\mu)$ error of the $n$-unit network' });
        const sS = v.stage({ x: [-1, 1], y: [-1.5, 1.5], height: 320, axes: 'box', gutter: true, xlabel: 'position $s$ along a line through the ball', weight: 1, title: 'target and $f_n$ along a line' });
        const model = memo();
        const build = (tg, d) => {
          const r = rand(hashStr('barron|' + tg + '|' + d)), atoms = [];
          const K = tg === 'smooth' ? 6 : 400;
          for (let k = 0; k < K; k++) {
            const g = Array.from({ length: d }, () => r.normal()), nn = Math.hypot(...g), th = g.map((u) => u / nn);
            const rad = tg === 'smooth' ? 1.5 + 2.5 * r() : 0.5 * (k + 1), a = tg === 'smooth' ? (r() < 0.5 ? -1 : 1) * (0.15 + 0.2 * r()) : (r() < 0.5 ? -1 : 1) * 0.9 * (k + 1) ** -1.15;
            atoms.push({ th, r: rad, a, ph: r() * 2 * Math.PI });
          }
          if (tg === 'smooth') { atoms[0].th = Array.from({ length: d }, (_, i) => (i === 0 ? 1 : 0)); atoms[0].a = 0.6; atoms[0].r = 4; }
          const Cf = atoms.reduce((s, A) => s + Math.abs(A.a) * A.r, 0);
          const f = (z) => atoms.reduce((s, A, k) => s + A.a * Math.cos(A.r * z[k] + A.ph), 0); // z[k] = θ_k·x
          // test points uniform in the ball, with their ridge coordinates
          const T = []; for (let i = 0; i < 600; i++) { const g = Array.from({ length: d }, () => r.normal()), nn = Math.hypot(...g), rr = r() ** (1 / d), x = g.map((u) => (u / nn) * rr); T.push(atoms.map((A) => A.th.reduce((s, t, j) => s + t * x[j], 0))); }
          const f0 = atoms.reduce((s, A) => s + A.a * Math.cos(A.ph), 0), fT = T.map(f);
          // importance weights ∝ |a_k| r_k, cumulative for sampling
          const cum = []; let acc = 0; for (const A of atoms) { acc += (Math.abs(A.a) * A.r) / Cf; cum.push(acc); }
          const draw = (rr) => { const u = rr(); let k = 0; while (k < cum.length - 1 && cum[k] < u) k++; const A = atoms[k], t = rr() * 2 - 1, sg = Math.sign(A.a), s = Math.sin(A.r * t + A.ph); return t >= 0 ? { k, t, up: true, c: -2 * Cf * sg * s } : { k, t, up: false, c: 2 * Cf * sg * s }; };
          const H = (U, z) => (U.up ? (z[U.k] >= U.t ? 1 : 0) : (z[U.k] <= U.t ? 1 : 0));
          // one run up to 4096 units, errors at powers of two
          const ru = rand(hashStr('run|' + tg + '|' + d)), units = [], sums = new Float64Array(T.length), curve = [];
          for (let n = 1; n <= 4096; n++) { const U = draw(ru); units.push(U); for (let i = 0; i < T.length; i++) sums[i] += U.c * H(U, T[i]); if ((n & (n - 1)) === 0) { let e = 0; for (let i = 0; i < T.length; i++) { const g = f0 + sums[i] / n; e += (g - fT[i]) ** 2; } curve.push([n, Math.sqrt(e / T.length)]); } }
          const th0 = atoms[0].th, slice = []; for (let i = 0; i <= 600; i++) { const sv = -1 + i / 300, z = atoms.map((A) => sv * A.th.reduce((a, t, j) => a + t * th0[j], 0)); slice.push({ s: sv, z, f: f(z) }); }
          const mf = fT.reduce((a, b) => a + b, 0) / fT.length, sd = Math.sqrt(fT.reduce((a, b) => a + (b - mf) ** 2, 0) / fT.length);
          return { atoms, Cf, f, f0, curve, units, H, d, slice, sd };
        };
        let info = null;
        v.render(() => {
          const tg = tgS.value, M = DS.map((d) => model(tg + d, () => build(tg, d)));
          const Cf = M.map((m) => m.Cf);
          sR.setView([0.8, 5000], tg === 'smooth' ? [3e-3, 30] : [3e-3, 3000]);
          M.forEach((m) => { sR.fn((n) => (2 * m.Cf) / Math.sqrt(n), { color: DC[m.d], width: 1, dash: [5, 4], alpha: 0.7 }); sR.path(m.curve, { color: DC[m.d], width: 2.4 }); sR.dots(m.curve, { r: 3, color: DC[m.d] }); });
          sR.vline(nS.value, { color: 'gold', width: 1.2 });
          // slice
          const d = +dS.value, m = M[DS.indexOf(d)], n = nS.value;
          const lo = [], pts = [], approx = [];
          for (const P of m.slice) { pts.push([P.s, P.f]); let g = 0; for (let k = 0; k < n; k++) g += m.units[k].c * m.H(m.units[k], P.z); approx.push([P.s, m.f0 + g / n]); lo.push(P.f); }
          const yl = Math.max(0.8, ...lo.map(Math.abs)) * 1.3; sS.setView([-1, 1], [-yl, yl]);
          sS.path(pts, { color: 'muted', width: 3 }); sS.path(approx, { color: DC[d], width: 1.8 });
          const slopes = M.map((mm) => { const c = mm.curve, a = c[c.length - 7], b = c[c.length - 1]; return Math.log(b[1] / a[1]) / Math.log(b[0] / a[0]); });
          info = { tg, Cf, slopes, err: M.map((mm) => mm.curve[mm.curve.length - 1][1]), sd: M.map((mm) => mm.sd), d };
        });
        v.legend([['accent', '$d=2$'], ['green', '$d=10$'], ['purple', '$d=50$'], ['muted', 'bound $2C_f/\\sqrt n$ (dashed) · target (slice)']]);
        v.readout(() => info && String.raw`Barron constants $C_f=${info.Cf.map((c) => c.toFixed(1)).join(',\ ')}$ for $d=2,10,50$ · measured slopes of $\log$ error vs $\log n$ (64 to 4096 units): ${info.slopes.map((s) => mnus(s.toFixed(2))).join(', ')} (theory $-0.5$) · errors at $n=4096$: ${info.err.map((e) => e.toFixed(4)).join(', ')} (the targets' own standard deviations: ${info.sd.map((e) => e.toFixed(3)).join(', ')}), bound $2C_f/64$: ${info.Cf.map((c) => (c / 32).toFixed(3)).join(', ')}` + (info.tg === 'smooth' ? ` · a grid would need $\\approx(\\sqrt{50}/${info.err[2].toFixed(3)})^{50}=10^{${Math.round(50 * Math.log10(Math.sqrt(50) / info.err[2]))}}$ units for the same error in $d=50$` : ' · **with $C_f$ this large the bound is vacuous**: the guarantee needs a finite first Fourier moment'));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Depth separation: the sawtooth construction',
      credit: 'Telgarsky, 2015 and 2016',
      statement: String.raw`Let $T(x)=2\,\mathrm{ReLU}(x)-4\,\mathrm{ReLU}(x-\tfrac12)$, the tent map on $[0,1]$, computed by one layer of two ReLU units. Its $k$-fold composition $T^{\circ k}$ is a sawtooth with $2^k$ linear pieces and $2^{k-1}$ teeth, computed by a network of depth $k$ and width $2$ with $6k+1$ parameters. A shallow ReLU network with $m$ hidden units has at most $m+1$ pieces, so representing $T^{\circ k}$ exactly needs $m\ge2^k-1$ units; more strongly, any network with at most $2^{k}/4$ pieces, such as a shallow one with fewer than $2^k/4$ units, is far from it on average: $\int_0^1|T^{\circ k}-g|\,dx\ge c$ for an absolute constant $c>0$ (Telgarsky). More generally, functions computed by networks of depth $k^3$ and constant width need width exponential in $k$ to be approximated by networks of depth $k$.`,
      idea: String.raw`Composition multiplies pieces (1.5): $T$ maps each half of $[0,1]$ onto all of $[0,1]$, so $T^{\circ k}$ runs through $[0,1]$ $2^{k-1}$ times up and as many times down. Telgarsky's counting argument: a piecewise-linear $g$ with $p$ pieces crosses the level $\tfrac12$ at most $p$ times, so it stays on one side of $\tfrac12$ across most of the $2^k$ triangles that $T^{\circ k}$ makes above and below that level, and on each such triangle it misses a fixed fraction of the triangle's area. The sawtooth's oscillation is the resource that depth buys cheaply and width buys expensively.`,
      caption: String.raw`Top left: one tent layer — drag its apex (the composition still has $2^k$ pieces as long as $T$ maps $[0,1]$ onto itself). Top right: piece counts on a log scale — the deep network's $2^k$ against the $2k+1$ pieces of a shallow network with the same number of parameters. Bottom: the sawtooth $T^{\circ k}$ (blue) and the least-squares best shallow network with that parameter budget (orange, knots evenly spaced); the readout gives the $L^1$ error, which stays large.`,
      deps: ['deep-1.6'],
      refs: ['Prince §4.5', 'Goodfellow §15.5'],
      tags: ['depth separation', 'sawtooth'],
      viz(v) {
        const kS = v.slider('depth $k$', 1, 8, 4, { int: true });
        const sT = v.stage({ x: [0, 1], y: [-0.06, 1.1], height: 220, axes: 'box', gutter: true, xlabel: '$x$', weight: 0.8, minWidth: 220, title: 'one layer: tent $T$ (2 units)' });
        const sP = v.stage({ x: [0.5, 8.5], y: [1, 400], ylog: true, height: 220, axes: 'box', gutter: true, xlabel: 'depth $k$', weight: 1.2, title: 'linear pieces, same parameter count $6k+1$' });
        const sC = v.stage({ x: [0, 1], y: [-0.15, 1.15], height: 260, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: 'deep sawtooth $T^{\\circ k}$ vs the best shallow network' });
        const A = sT.handle(0.5, 1, { color: 'accent', label: 'apex', labelPos: 'ne', constrain: (x) => [clamp(x, 0.12, 0.88), 1] });
        const X = Array.from({ length: 2001 }, (_, i) => i / 2000);
        let info = null;
        v.render(() => {
          const k = kS.value, p = A.x, m = 2 * k;
          sT.path([[0, 0], [p, 1], [1, 0]], { color: 'accent', width: 3 });
          sT.line(0, 0, 1, 1, { color: 'faint', width: 1, dash: [4, 4] });
          // counts
          const deep = [], shal = []; for (let j = 1; j <= 8; j++) { deep.push([j, 2 ** j]); shal.push([j, 2 * j + 1]); }
          sP.path(deep, { color: 'accent', width: 2.4 }); sP.dots(deep, { r: 3.5, color: 'accent' });
          sP.path(shal, { color: 'orange', width: 2.4 }); sP.dots(shal, { r: 3.5, color: 'orange' });
          sP.vline(k, { color: 'gold', width: 1.2 });
          // exact sawtooth and shallow fit
          const f = (x) => sawtooth(x, k, p), Y = X.map(f);
          const knots = Array.from({ length: m }, (_, i) => (i + 0.5) / m);
          const Am = X.map((x) => [1, x, ...knots.map((t) => Math.max(0, x - t))]), c = lstsq(Am, Y, 1e-10);
          const g = (x) => c[0] + c[1] * x + knots.reduce((s, t, i) => s + c[i + 2] * Math.max(0, x - t), 0);
          sC.hline(0.5, { color: 'faint', width: 1, dash: [4, 4] });
          sC.fn(f, { color: 'accent', width: 2.2, n: 3000 }); sC.fn(g, { color: 'orange', width: 2.4 });
          knots.forEach((t) => sC.dot(t, g(t), { r: 3, color: 'orange' }));
          let l1 = 0; for (let i = 0; i < X.length; i++) l1 += Math.abs(Y[i] - g(X[i])); l1 /= X.length;
          let cross = 0; for (let i = 1; i < X.length; i++) if ((g(X[i - 1]) - 0.5) * (g(X[i]) - 0.5) < 0) cross++;
          info = { k, pieces: plPieces(X.map((x, i) => [x, Y[i]])), m, l1, cross };
        });
        v.legend([['accent', 'deep, width 2: $2^k$ pieces'], ['orange', 'shallow, $2k$ units: $\\le 2k+1$ pieces'], ['faint', 'level $\\tfrac12$', { dash: true }]]);
        v.readout(() => info && String.raw`$k=${info.k}$: deep network ($k$ layers × 2 units, ${6 * info.k + 1} parameters) has **${info.pieces} pieces** · shallow network with ${info.m} units (${3 * info.m + 1} parameters) has ${info.m + 1} pieces, crosses $\tfrac12$ ${info.cross} times against the sawtooth's ${2 ** info.k}, $L^1$ error **${info.l1.toFixed(3)}** (the mean of $|T^{\circ k}-\tfrac12|$ is $0.25$) · exact shallow representation would need $2^k-1=${2 ** info.k - 1}$ units`);
      },
    },
  ],
};
