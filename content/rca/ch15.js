// Rudin, Real and Complex Analysis — Chapter 15: Zeros of Holomorphic Functions

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (same scheme as Stage.domain): hue = arg w, bands = log2|w|.
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// A small "×" with a halo, for zeros / singular points drawn on top of a phase portrait.
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
// y-ticks 10^k for a log10 axis on [lo, hi]
const logTicks = (lo, hi, step = 1) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % step === 0) out.push([k, k === 0 ? '1' : `10${sup(k)}`]); return out; };
// Taylor coefficients a_j of φ_p(z) = (1 − E_p(z)) / z^{p+1}  (all ≥ 0, Σ a_j = 1)
function elemCoeffs(p, J = 220) {
  const b = new Float64Array(J + 1); b[0] = 1; // exp(z + z²/2 + … + z^p/p) = Σ b_j z^j
  for (let n = 0; n < J; n++) { let s = 0; for (let m = 1; m <= Math.min(p, n + 1); m++) s += b[n + 1 - m]; b[n + 1] = s / (n + 1); }
  return Array.from(b, (bj, j) => bj / (p + 1 + j));
}

export default {
  collection: 'rca',
  chapter: 15,
  title: 'Zeros of Holomorphic Functions',
  summary: String.raw`Where can a holomorphic function vanish? Infinite products answer the question: when $\sum|1-f_n|$ converges locally uniformly, $\prod f_n$ is holomorphic and its zeros are exactly those of the factors. With Weierstrass's elementary factors any discrete set (with multiplicities) is the zero set of a function in $H(\Omega)$; combined with Mittag-Leffler this solves interpolation problems and shows that finitely generated ideals of $H(\Omega)$ are principal. Growth conditions change the picture: Jensen's formula ties the zeros in a disc to the average of $\log|f|$, which forces the Blaschke condition $\sum(1-|\alpha_n|)<\infty$ on zeros of bounded (even Nevanlinna) functions — and conversely Blaschke products realise every such sequence. The chapter ends with the Müntz–Szász theorem, an approximation result proved with exactly this zero-counting.`,
  items: [
    // ------------------------------------------------------------------ infinite products
    {
      num: '15.2',
      kind: 'Definition',
      name: 'Convergence of an infinite product',
      statement: String.raw`Let $\{u_n\}$ be a sequence of complex numbers and put
$$p_N=\prod_{n=1}^{N}(1+u_n)=(1+u_1)(1+u_2)\cdots(1+u_N).$$
The $p_N$ are the **partial products**. If $p=\lim_{N\to\infty}p_N$ exists, the infinite product **converges** and we write $p=\prod_{n=1}^\infty(1+u_n)$.

The definition allows $p=0$ — even when no factor vanishes — which is why the theory concentrates on products with $\sum|u_n|<\infty$, where the limit is $0$ only if some factor is $0$ (15.4).`,
      idea: String.raw`It is the series definition with sums replaced by products. Two features have no analogue for series: a product can "converge" to $0$ by leaking modulus ($\prod(1-\frac{1}{n+1})=\lim\frac1{N+1}=0$), and if $p\ne0$ then $1+u_n=p_n/p_{n-1}\to1$, i.e. $u_n\to0$. Taking logarithms turns the product into $\sum\log(1+u_n)$, and since $|\log(1+u)|\approx|u|$ for small $u$, absolute convergence of $\sum u_n$ is the natural sufficient condition.`,
      caption: String.raw`Choose a sequence and raise $N$. Left: the partial products $p_0=1,p_1,\dots,p_N$ in the plane (gold), the limit (green ring) when there is one. Right: $|p_N|$ and $\sum_{n\le N}|u_n|$ on a log scale. Only the first two examples have $\sum|u_n|<\infty$; the third converges to $0$ although no factor is $0$; in the last, $|p_N|$ converges but $p_N$ keeps turning.`,
      deps: ['pma-3.1'],
      see: ['pma-3.22'],
      tags: ['infinite products'],
      viz(v) {
        const { Cx } = v.M;
        const EX = {
          abs: { label: '$1+\\frac{0.9\\,e^{in}}{n^{1.4}}$', u: (n) => Cx.polar(0.9 / n ** 1.4, n), verdict: 'Converges to a nonzero limit, and $\\sum|u_n|<\\infty$' },
          tele: { label: '$1-\\frac{1}{(n+1)^2}$', u: (n) => new Cx(-1 / (n + 1) ** 2, 0), lim: new Cx(0.5, 0), verdict: 'Telescopes: $p_N=\\frac{N+2}{2(N+1)}\\to\\frac12$' },
          zero: { label: '$1-\\frac{1}{n+1}$', u: (n) => new Cx(-1 / (n + 1), 0), lim: new Cx(0, 0), verdict: 'Here $p_N=\\frac1{N+1}\\to0$ although no factor is $0$ — here $\\sum|u_n|=\\infty$' },
          harm: { label: '$1+\\frac1n$', u: (n) => new Cx(1 / n, 0), verdict: 'Here $p_N=N+1\\to\\infty$: the product diverges' },
          spin: { label: '$1+\\frac{i}{n}$', u: (n) => new Cx(0, 1 / n), verdict: 'Here $|p_N|$ converges, but $\\arg p_N=\\sum\\arctan\\frac1n\\to\\infty$: no limit' },
        };
        // limit of the absolutely convergent example, computed once
        { let p = new Cx(1, 0); for (let n = 1; n <= 200000; n++) p = p.mul(EX.abs.u(n).add(1)); EX.abs.lim = p; }
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'abs');
        const Ns = v.slider('$N$', 1, 200, 40, { int: true });
        const L = v.stage({ x: [-0.5, 2], y: [-1, 1], equal: true, height: 340, title: 'partial products $p_N$ in $\\mathbb C$' });
        const R = v.stage({ x: [0, 200], y: [-2.5, 2.5], height: 340, axes: 'box', xlabel: 'N', title: '$|p_N|$ and $\\sum_{n\\le N}|u_n|$ (log scale)' });
        let st = null;
        v.legend([['gold', 'partial products $p_N$'], ['green', 'limit $p$', { dot: true }], ['blue', '$|p_N|$'], ['orange', '$\\sum_{n\\le N}|u_n|$']]);
        v.render(() => {
          const E = EX[which.value], N = Ns.value;
          const pts = [[1, 0]]; let p = new Cx(1, 0), sum = 0;
          const lp = [], ls = [];
          for (let n = 1; n <= 200; n++) {
            const u = E.u(n); p = p.mul(u.add(1)); sum += u.abs();
            if (n <= N) pts.push([p.re, p.im]);
            lp.push([n, Math.log10(p.abs())]); ls.push([n, Math.log10(sum)]);
          }
          const pN = pts[pts.length - 1];
          // fit the view to the path (and to 0, 1)
          let x0 = Math.min(0, ...pts.map((q) => q[0])), x1 = Math.max(1, ...pts.map((q) => q[0])), y0 = Math.min(0, ...pts.map((q) => q[1])), y1 = Math.max(0, ...pts.map((q) => q[1]));
          if (E.lim) { x0 = Math.min(x0, E.lim.re); x1 = Math.max(x1, E.lim.re); }
          const pad = 0.12 * Math.max(x1 - x0, y1 - y0, 1);
          L.setView([x0 - pad, x1 + pad], [y0 - pad, y1 + pad]);
          if (which.value === 'spin') { const r = Math.sqrt(Math.sinh(Math.PI) / Math.PI); L.circle(0, 0, r, { color: 'blue', width: 1.4, dash: [5, 4] }); }
          L.path(pts, { color: 'gold', width: 1.8 });
          L.dots(pts, { color: 'gold', r: 2.2 });
          L.dot(1, 0, { color: 'ink', r: 4, label: 'p₀ = 1', labelPos: 'nw' });
          if (E.lim) L.dot(E.lim.re, E.lim.im, { color: 'green', r: 8, hollow: true, width: 2.4, label: 'p', labelPos: which.value === 'abs' ? 'sw' : 'nw' });
          L.dot(pN[0], pN[1], { color: 'gold', r: 6, label: `p${sub(N)}`, labelPos: 'ne' });
          xMark(L, 0, 0, 'muted', 4);
          // right: log-scale curves
          const all = lp.concat(ls).map((q) => q[1]).filter(isFinite);
          const lo = Math.min(-0.5, Math.floor(Math.min(...all)) - 0.3), hi = Math.max(0.5, Math.ceil(Math.max(...all)) + 0.3);
          R.setView(null, [lo, hi]);
          R.setTicks(null, logTicks(lo, hi));
          R.hline(0, { color: 'faint', width: 1 });
          R.path(ls, { color: 'orange', width: 2.2 });
          R.path(lp, { color: 'blue', width: 2.4 });
          R.vline(N, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(N, lp[N - 1][1], { color: 'blue', r: 4.5 });
          R.dot(N, ls[N - 1][1], { color: 'orange', r: 4.5 });
          st = { E, N, p: new Cx(pN[0], pN[1]), sum: Math.pow(10, ls[N - 1][1]) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$p_{${s.N}} = ${s.p.toString(4).replace('i', '\\,i')}$, $\\;|p_{${s.N}}| = ${v.fmt(s.p.abs(), 4)}$, $\\;\\sum_{n\\le ${s.N}}|u_n| = ${v.fmt(s.sum, 4)}$. ${s.E.verdict}${s.E.lim ? `; limit $p = ${s.E.lim.toString(4).replace('i', '\\,i')}$.` : '.'}`;
        });
      },
    },
    {
      num: '15.3',
      kind: 'Lemma',
      name: 'Partial products are controlled by $\\sum|u_n|$',
      statement: String.raw`Let $u_1,\dots,u_N$ be complex numbers and put
$$p_N=\prod_{n=1}^N(1+u_n),\qquad p_N^*=\prod_{n=1}^N(1+|u_n|).$$
Then
(a) $p_N^*\le\exp\big(|u_1|+\cdots+|u_N|\big)$, and
(b) $|p_N-1|\le p_N^*-1$.`,
      idea: String.raw`(a) is $1+x\le e^x$ for $x\ge0$, multiplied over $n$. (b) is an induction: $p_{k+1}-1=(p_k-1)(1+u_{k+1})+u_{k+1}$, so $|p_{k+1}-1|\le(p_k^*-1)(1+|u_{k+1}|)+|u_{k+1}|=p_{k+1}^*-1$. Equivalently: expand the product; every monomial in $p_N-1$ is bounded by the corresponding monomial of $p_N^*-1$. Equality holds when all $u_n$ point in the same direction as positive reals.`,
      caption: String.raw`Drag the factors $u_n$ (left) and choose how many are used. Right: the path $1\to p_1\to\cdots\to p_N$ always stays in the green disc of radius $p_N^*-1$ about $1$, which in turn lies inside the orange circle of radius $e^{\sum|u_n|}-1$. Press "align" to rotate every $u_n$ onto the positive axis — the extreme case, where $p_N$ lands exactly on the green circle.`,
      deps: ['rca-15.2'],
      tags: ['infinite products', 'inequalities'],
      viz(v) {
        const { Cx } = v.M;
        const U = v.stage({ x: [-0.42, 0.42], y: [-0.34, 0.34], equal: true, height: 330, axes: false, weight: 0.8, title: 'the numbers $u_1,\\dots,u_5$' });
        const R = v.stage({ x: [0, 2], y: [-1, 1], equal: true, height: 330, title: 'partial products $p_k$ around $1$' });
        const init = [[0.22, 0.12], [0.17, -0.11], [0.04, 0.21], [0.2, 0.02], [-0.07, 0.17]];
        const H = init.map(([x, y], i) => U.handle(x, y, { color: 'accent', label: `u${'₁₂₃₄₅'[i]}`, labelPos: 'ne' }));
        const Ns = v.slider('number of factors $N$', 1, 5, 5, { int: true });
        v.button('align all $u_n$ with $\\mathbb R_+$', () => { for (const h of H) { h.x = Math.hypot(h.x, h.y); h.y = 0; } });
        v.button('reset', () => { H.forEach((h, i) => { h.x = init[i][0]; h.y = init[i][1]; }); });
        let st = null;
        v.legend([['gold', 'path $1\\to p_1\\to\\cdots\\to p_N$'], ['green', 'disc $|w-1|\\le p_N^*-1$', { area: true }], ['orange', 'circle $|w-1|=e^{\\sum|u_n|}-1$', { dash: true }]]);
        v.render(() => {
          const N = Ns.value;
          H.forEach((h, i) => { h.color = i < N ? 'accent' : 'gray'; });
          U.hline(0, { color: 'faint', width: 1 }); U.vline(0, { color: 'faint', width: 1 });
          U.circle(0, 0, 0.25, { color: 'faint', width: 1, dash: [3, 4] }); U.text('|u| = 0.25', 0.25 * Math.SQRT1_2, -0.25 * Math.SQRT1_2, { color: 'muted', size: 11, dx: 6, dy: 8 });
          H.forEach((h, i) => U.arrow(0, 0, h.x, h.y, { color: i < N ? 'accent' : 'faint', width: 1.6, head: 7, alpha: i < N ? 0.7 : 0.5 }));
          let p = new Cx(1, 0), ps = 1, sum = 0; const pts = [[1, 0]], star = [[1, 0]];
          for (let i = 0; i < N; i++) { const u = new Cx(H[i].x, H[i].y); p = p.mul(u.add(1)); ps *= 1 + u.abs(); sum += u.abs(); pts.push([p.re, p.im]); star.push([ps, 0]); }
          const rStar = ps - 1, rExp = Math.exp(sum) - 1;
          const half = Math.max(0.5, rExp * 1.18);
          R.setView([1 - half, 1 + half], [-half * 0.85, half * 0.85]);
          R.circle(1, 0, rStar, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.12 });
          R.circle(1, 0, rExp, { color: 'orange', width: 1.8, dash: [6, 4] });
          R.path(star, { color: 'faint', width: 1.4 });
          R.dots(star.slice(1), { color: 'faint', r: 2.5 });
          R.path(pts, { color: 'gold', width: 2.2 });
          R.dots(pts.slice(1, -1), { color: 'gold', r: 3 });
          R.line(1, 0, p.re, p.im, { color: 'ink', width: 1.2, dash: [3, 3] });
          R.dot(1, 0, { color: 'ink', r: 4, label: '1', labelPos: 'sw' });
          R.dot(p.re, p.im, { color: 'gold', r: 6, label: `p${'₁₂₃₄₅'[N - 1]}`, labelPos: 'ne' });
          R.dot(ps, 0, { color: 'green', r: 4, label: `p*${'₁₂₃₄₅'[N - 1]}`, labelPos: 'se' });
          st = { N, d: Math.hypot(p.re - 1, p.im), rStar, rExp };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const eq = Math.abs(s.d - s.rStar) < 1e-9 ? ' — equality: all $u_n$ point the same way' : '';
          return `$|p_${s.N}-1| = ${v.fix(s.d, 4)} \\;\\le\\; p_${s.N}^*-1 = ${v.fix(s.rStar, 4)} \\;\\le\\; e^{\\sum|u_n|}-1 = ${v.fix(s.rExp, 4)}$${eq}`;
        });
      },
    },
    {
      num: '15.4',
      kind: 'Theorem',
      name: 'Uniform convergence of $\\prod(1+u_n)$',
      statement: String.raw`Let $\{u_n\}$ be bounded complex functions on a set $S$ such that $\sum|u_n(s)|$ converges uniformly on $S$. Then the product
$$f(s)=\prod_{n=1}^\infty\big(1+u_n(s)\big)$$
converges uniformly on $S$, and $f(s_0)=0$ at a point $s_0\in S$ if and only if $u_n(s_0)=-1$ for some $n$. Moreover the product may be taken in any order: if $\{n_k\}$ is a permutation of $\{1,2,3,\dots\}$, then also $f(s)=\prod_{k=1}^\infty\big(1+u_{n_k}(s)\big)$ on $S$.`,
      idea: String.raw`Uniform convergence of $\sum|u_n|$ plus boundedness makes $\sum|u_n|\le C$ on $S$, so $|p_N|\le e^C$ by 15.3(a). For $M>N$, $p_M-p_N=p_N\big(\prod_{N<n\le M}(1+u_n)-1\big)$, and 15.3(b) bounds the bracket by $e^{\varepsilon}-1$ once the tail is $<\varepsilon$: the partial products are uniformly Cauchy. The same estimate with $\varepsilon<\tfrac12$ gives $|p_M|\ge\tfrac12|p_N|$, so $f(s_0)\neq0$ unless an early factor vanishes. For a rearrangement, $q_M$ eventually contains every factor of $p_N$, and the leftover factors have tail sum $<\varepsilon$.`,
      caption: String.raw`$S=[-2.6,2.6]$ and $u_n(s)=-s^2/n^2$, so $f(s)=\prod(1-s^2/n^2)=\frac{\sin\pi s}{\pi s}$. The gold curve is $p_N$; the blue band has half-width $\sup_S|p_N-f|$. Below, that sup on a log scale (gold) under the bound $\sup_S|p_N|\,(e^{\sum_{\text{rest}}\sup|u_n|}-1)$ from the proof (orange). Switch to the rearranged order (blocks of growing length taken backwards: $12,11,\dots,1,\;36,35,\dots,13,\;\dots$): the zeros at $\pm1,\pm2$ (red rings) only appear once their factors have been used, but the limit is the same.`,
      deps: ['rca-15.3', 'rca-15.2'],
      see: ['pma-3.55'],
      tags: ['infinite products', 'uniform convergence'],
      viz(v) {
        const R0 = 2.6, NMAX = 80, K = 521;
        const xs = v.M.linspace(-R0, R0, K);
        const f = (s) => (Math.abs(s) < 1e-12 ? 1 : Math.sin(Math.PI * s) / (Math.PI * s));
        const natural = Array.from({ length: NMAX }, (_, i) => i + 1);
        const blocks = []; for (let k = 1, size = 12; blocks.length < NMAX; k += size, size *= 2) for (let j = k + size - 1; j >= k && blocks.length < NMAX; j--) blocks.push(j);
        const ORD = { nat: natural, rev: blocks };
        const Z2 = Math.PI ** 2 / 6;
        const pre = {};
        for (const [key, ord] of Object.entries(ORD)) {
          const err = new Float64Array(NMAX + 1), sp = new Float64Array(NMAX + 1), tail = new Float64Array(NMAX + 1);
          const P = new Float64Array(K).fill(1);
          let used = 0;
          for (let N = 0; N <= NMAX; N++) {
            if (N > 0) { const n = ord[N - 1]; used += 1 / (n * n); for (let i = 0; i < K; i++) P[i] *= 1 - (xs[i] * xs[i]) / (n * n); }
            let e = 0, m = 0; for (let i = 0; i < K; i++) { e = Math.max(e, Math.abs(P[i] - f(xs[i]))); m = Math.max(m, Math.abs(P[i])); }
            err[N] = e; sp[N] = m; tail[N] = Z2 - used;
          }
          pre[key] = { err, bound: Array.from(sp, (m, N) => m * (Math.exp(R0 * R0 * tail[N]) - 1)) };
        }
        const order = v.select('order of the factors', [{ value: 'nat', label: '$n=1,2,3,\\dots$' }, { value: 'rev', label: 'rearranged: $12,11,\\dots,1,\\,36,\\dots,13,\\,\\dots$' }], 'nat');
        const Ns = v.slider('factors used $N$', 0, NMAX, 10, { int: true });
        const T = v.stage({ x: [-2.8, 2.8], y: [-0.5, 1.2], height: 270, full: true, xlabel: 's', title: '$p_N(s)=\\prod_{k\\le N}\\big(1+u_{n_k}(s)\\big)$ on $S=[-2.6,2.6]$' });
        const B = v.stage({ x: [0, NMAX], y: [-3.6, 1.2], height: 190, full: true, axes: 'box', xlabel: 'N', yticks: logTicks(-3, 1), title: '$\\sup_S|p_N-f|$ (log scale)' });
        let st = null;
        v.legend([['ink', '$f(s)=\\frac{\\sin \\pi s}{\\pi s}$'], ['gold', '$p_N$'], ['blue', '$f\\pm\\sup_S|p_N-f|$', { area: true }], ['orange', 'bound from 15.3', { dash: true }], ['red', 'zero of $f$ not yet in $p_N$', { dot: true }]]);
        v.render(() => {
          const ord = ORD[order.value], N = Ns.value, D = pre[order.value];
          const used = new Set(ord.slice(0, N));
          const pN = (s) => { let p = 1; for (const n of used) p *= 1 - (s * s) / (n * n); return p; };
          const e = D.err[N];
          T.between((s) => f(s) + e, (s) => f(s) - e, -R0, R0, { fill: 'blue', fillAlpha: 0.13, n: 400 });
          T.fn(f, { color: 'ink', width: 2, domain: [-R0, R0] });
          T.fn(pN, { color: 'gold', width: 2.6, domain: [-R0, R0] });
          T.vline(-R0, { color: 'muted', dash: [3, 4], width: 1 }); T.vline(R0, { color: 'muted', dash: [3, 4], width: 1 });
          for (let n = 1; n <= 2; n++) for (const s of [-n, n]) T.dot(s, 0, used.has(n) ? { color: 'ink', r: 4 } : { color: 'red', r: 5, hollow: true, width: 2.2 });
          // bottom: error curves
          const other = order.value === 'nat' ? 'rev' : 'nat';
          const curve = (arr) => Array.from(arr, (y, k) => [k, Math.max(-3.5, Math.log10(y + 1e-300))]);
          B.path(curve(pre[other].err), { color: 'faint', width: 1.6 });
          B.path(curve(D.bound), { color: 'orange', width: 1.8, dash: [6, 4] });
          B.path(curve(D.err), { color: 'gold', width: 2.6 });
          B.vline(N, { color: 'gold', width: 1.2, dash: [4, 4] });
          B.dot(N, Math.max(-3.5, Math.log10(e + 1e-300)), { color: 'gold', r: 5 });
          B.corner(`faint: the other order`, 'tr');
          st = { N, e, b: D.bound[N], missing: [1, 2].filter((n) => !used.has(n)), ord: ord.slice(0, Math.min(N, 8)) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const miss = s.missing.length ? ` The factors with $n\\in\\{${s.missing.join(',')}\\}$ are not yet used, so $p_N\\ne0$ at $s=\\pm${s.missing.join(',\\pm')}$ where $f=0$.` : ' Every zero of $f$ in $S$ is the zero of a factor already used.';
          return `$\\sup_S|p_{${s.N}}-f| = ${v.sci(s.e, 3)} \\le ${v.sci(s.b, 3)}$ (bound).${miss}`;
        });
      },
    },
    {
      num: '15.5',
      kind: 'Theorem',
      name: '$\\prod(1-u_n)>0$ iff $\\sum u_n<\\infty$',
      statement: String.raw`Suppose $0\le u_n<1$ for every $n$. Then
$$\prod_{n=1}^\infty(1-u_n)>0\iff\sum_{n=1}^\infty u_n<\infty .$$`,
      idea: String.raw`The partial products $P_N=\prod_{n\le N}(1-u_n)$ decrease, so the product always converges to some $P\ge0$. If $\sum u_n=\infty$, then $P_N\le\exp(-\sum_{n\le N}u_n)\to0$ because $1-u\le e^{-u}$. If $\sum u_n<\infty$, choose $N_0$ with $\sum_{n>N_0}u_n<\frac12$; then (by induction on $M$, as in 15.3(b)) $\prod_{N_0<n\le M}(1-u_n)\ge1-\sum_{N_0<n\le M}u_n>\frac12$, so $P\ge\frac12P_{N_0}>0$ — no factor vanishes since $u_n<1$.`,
      caption: String.raw`Here $u_n=c/n^s$. Top: $P_N$ (blue) against $\log_{10}N$ up to $N=10^5$, under the upper bound $e^{-\sum_{n\le N}u_n}$ (orange). Bottom: the partial sums $\sum_{n\le N}u_n$. Push $s$ below $1$: the sums diverge and the product is squeezed to $0$. For $s>1$ the green line is the lower bound $P_{N_0}\,(1-\sum_{n>N_0}u_n)$ from the proof.`,
      deps: ['rca-15.2', 'rca-15.3'],
      see: ['pma-3.28'],
      tags: ['infinite products', 'series'],
      viz(v) {
        const sS = v.slider('exponent $s$', 0.5, 2.5, 1.5, { step: 0.01 });
        const cS = v.slider('$c$', 0.05, 0.95, 0.6, { step: 0.01 });
        const XT = [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴'], [5, '10⁵']];
        const T = v.stage({ x: [-0.05, 5.05], y: [-0.03, 1.03], height: 250, full: true, axes: 'box', xticks: XT, title: '$P_N=\\prod_{n\\le N}(1-c\\,n^{-s})$ against $N$ (log scale)' });
        const B = v.stage({ x: [-0.05, 5.05], y: [0, 4], height: 170, full: true, axes: 'box', xticks: XT, title: '$\\sum_{n\\le N}c\\,n^{-s}$' });
        let st = null;
        v.legend([['blue', '$P_N$'], ['orange', 'upper bound $e^{-\\sum_{n\\le N}u_n}$'], ['green', 'lower bound $P_{N_0}(1-\\sum_{n>N_0}u_n)$', { dash: true }]]);
        v.render(() => {
          const s = sS.value, c = cS.value, NMAX = 100000;
          const tail = (N) => (s > 1 ? c * Math.pow(N + 0.5, 1 - s) / (s - 1) : Infinity);
          const marks = new Set(); for (let j = 0; j <= 400; j++) marks.add(Math.round(Math.pow(10, 5 * j / 400)));
          const pP = [], pE = [], pS = [];
          let P = 1, S = 0, N0 = null, PN0 = null;
          for (let n = 1; n <= NMAX; n++) {
            const u = c * Math.pow(n, -s); P *= 1 - u; S += u;
            if (N0 == null && tail(n) < 0.5) { N0 = n; PN0 = P; }
            if (marks.has(n)) { const x = Math.log10(n); pP.push([x, P]); pE.push([x, Math.exp(-S)]); pS.push([x, S]); }
          }
          T.path(pE, { color: 'orange', width: 2 });
          T.path(pP, { color: 'blue', width: 2.8 });
          let lower = null;
          if (N0 != null) {
            lower = PN0 * (1 - tail(N0));
            T.hline(lower, { color: 'green', width: 1.8, dash: [6, 4] });
            T.dot(Math.log10(N0), PN0, { color: 'green', r: 4.5, label: 'N₀', labelPos: 'ne' });
          }
          const conv = s > 1;
          T.corner(conv ? 'Σ uₙ < ∞  ⇒  ∏(1 − uₙ) > 0' : 'Σ uₙ = ∞  ⇒  ∏(1 − uₙ) = 0', 'tr', { color: conv ? 'green' : 'red', weight: 600 });
          const top = Math.max(1, S * 1.12);
          B.setView(null, [0, top]);
          if (conv) { const lim = S + tail(NMAX); B.hline(lim, { color: 'green', width: 1.5, dash: [6, 4] }); B.tex(`\\textstyle\\sum u_n\\approx ${v.fix(lim, 3)}`, 4.9, lim, { color: 'green', size: 13, align: 'right', baseline: 'top', dy: 5 }); }
          B.path(pS, { color: conv ? 'purple' : 'red', width: 2.4 });
          const est = conv ? P * Math.exp(-tail(NMAX)) : 0;
          st = { s, P, S, conv, est, N0, lower };
        });
        v.readout(() => {
          const q = st; if (!q) return '';
          if (q.conv) return `$s=${v.fix(q.s, 2)}>1$: $\\;\\sum_{n\\le10^5}u_n = ${v.fix(q.S, 4)}$, $P_{10^5} = ${v.fmt(q.P, 4)}$; the tail beyond $N_0=${q.N0}$ is $<\\tfrac12$, so $P\\ge${v.fmt(q.lower, 3)}>0$ (estimated limit $${v.fmt(q.est, 4)}$).`;
          return `$s=${v.fix(q.s, 2)}\\le1$: $\\;\\sum_{n\\le10^5}u_n = ${v.fix(q.S, 2)}$ grows without bound and $P_{10^5} = ${v.sci(q.P, 3)}\\le e^{-${v.fix(q.S, 1)}}$, so the product is $0$.`;
        });
      },
    },
    {
      num: '15.6',
      kind: 'Theorem',
      name: 'Products of holomorphic functions',
      statement: String.raw`Let $f_n\in H(\Omega)$ $(n=1,2,3,\dots)$, suppose no $f_n$ is identically $0$ on any component of $\Omega$, and suppose
$$\sum_{n=1}^\infty|1-f_n(z)|$$
converges uniformly on compact subsets of $\Omega$. Then $f(z)=\prod_{n=1}^\infty f_n(z)$ converges uniformly on compact subsets of $\Omega$, so $f\in H(\Omega)$, and
$$m(f;z)=\sum_{n=1}^\infty m(f_n;z)\qquad(z\in\Omega),$$
where $m(g;z)$ denotes the multiplicity of the zero of $g$ at $z$ ($0$ if $g(z)\ne0$).`,
      idea: String.raw`Apply 15.4 with $u_n=f_n-1$ on each compact $K\subset\Omega$: the product converges uniformly on $K$, so $f\in H(\Omega)$ by the Weierstrass theorem on locally uniform limits (10.28). On $K$, $|1-f_n|<\frac12$ for $n>N$, so the tail $g_N=\prod_{n>N}f_n$ has no zeros there (15.4 again), and $f=f_1\cdots f_N\,g_N$ shows that the multiplicities simply add. In particular each point is a zero of only finitely many $f_n$, and $f$ is not identically $0$ on any component.`,
      caption: String.raw`Here $f_n(z)=1-z^4/n^4$, so $\sum|1-f_n|\le R^4\sum n^{-4}$ on $|z|\le R$ and $\prod f_n=\frac{\sin\pi z\,\sinh\pi z}{\pi^2z^2}$, with simple zeros at $\pm n,\pm in$. Left: phase portrait of the partial product $p_N$ and the compact set $K$ (drag the handle on its boundary). Right: $\sup_K|p_N-f|$ — attained on $\partial K$ by the maximum principle — with the hypothesis' tail $\sup_K\sum_{n>N}|1-f_n|$ dashed. "Each factor twice" doubles every multiplicity. "$1-z/n$" breaks the hypothesis ($\sum|z|/n=\infty$): the partial products never settle (plotted: the Cauchy gap $\sup_K|p_{2N}-p_N|$).`,
      deps: ['rca-15.4', 'rca-10.28', 'rca-10.18'],
      see: ['rca-15.9'],
      tags: ['infinite products', 'holomorphic', 'zeros'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const lim = (z) => { if (z.abs() < 1e-6) return one; const w = z.scale(Math.PI); const sh = w.exp().sub(w.neg().exp()).scale(0.5); return w.sin().mul(sh).div(w.mul(w)); };
        const MODES = {
          single: { label: '$f_n=1-\\frac{z^4}{n^4}$', k: (n) => n, q: true, f: lim, per: 4 },
          double: { label: 'each factor twice', k: (n) => Math.ceil(n / 2), q: true, f: (z) => { const w = lim(z); return w.mul(w); }, per: 8 },
          fails: { label: '$f_n=1-\\frac{z}{n}$ (fails)', k: (n) => n, q: false, f: null, per: 1 },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'single');
        const Ns = v.slider('factors $N$', 1, 40, 5, { int: true });
        const L = v.stage({ x: [-4.3, 4.3], y: [-3.25, 3.25], equal: true, height: 350, weight: 1.25, title: 'phase of $p_N=f_1f_2\\cdots f_N$ and the compact set $K$' });
        const R = v.stage({ x: [1, 40], y: [-9, 3], height: 350, axes: 'box', xlabel: 'N', title: '$\\sup_K|p_N-f|$ (log scale)' });
        const ANG = 0.62;
        const kh = L.handle(2.5 * Math.cos(ANG), 2.5 * Math.sin(ANG), { color: 'ink', r: 6, label: '∂K', labelPos: 'ne', constrain: (x, y) => { let r = v.M.clamp(x * Math.cos(ANG) + y * Math.sin(ANG), 0.4, 3.9); const d = r - Math.round(r); if (Math.abs(d) < 0.08) r = Math.round(r) + (d < 0 ? -0.08 : 0.08); return [r * Math.cos(ANG), r * Math.sin(ANG)]; } });
        const fac = (M, n, z) => { if (!M.q) return one.sub(z.scale(1 / n)); const k = M.k(n), w = z.scale(1 / k), w2 = w.mul(w); return one.sub(w2.mul(w2)); };
        const prod = (M, N, z) => { let p = one; for (let n = 1; n <= N; n++) p = p.mul(fac(M, n, z)); return p; };
        let st = null;
        v.render(() => {
          const key = which.value, M = MODES[key], N = Ns.value;
          const Rk = Math.hypot(kh.x, kh.y);
          L.domain((z) => prod(M, N, z), { key: `${key},${N}`, res: 2, contours: false });
          L.circle(0, 0, Rk, { color: 'panel', width: 5 });
          L.circle(0, 0, Rk, { color: 'ink', width: 2 });
          // zeros of p_N with multiplicities
          const mult = new Map();
          for (let n = 1; n <= N; n++) { const k = M.k(n); const zs = M.q ? [[k, 0], [-k, 0], [0, k], [0, -k]] : [[k, 0]]; for (const [a, b] of zs) { const id = `${a},${b}`; mult.set(id, (mult.get(id) || 0) + 1); } }
          for (const [id, m] of mult) { const [a, b] = id.split(',').map(Number); if (Math.abs(a) <= 4.3 && Math.abs(b) <= 3.2) { L.dot(a, b, { color: 'ink', r: 3.4 }); if (m > 1) L.text(String(m), a, b, { color: 'ink', size: 12.5, weight: 700, dx: 9, dy: -9 }); } }
          // right panel
          const circ = Array.from({ length: 128 }, (_, j) => Cx.polar(Rk, 2 * Math.PI * (j + 0.5) / 128));
          const pts = [], tl = [];
          for (let n = 1; n <= 40; n++) {
            let e = 0;
            for (const z of circ) { const d = M.f ? prod(M, n, z).sub(M.f(z)) : prod(M, 2 * n, z).sub(prod(M, n, z)); e = Math.max(e, d.abs()); }
            pts.push([n, Math.log10(e + 1e-300)]);
            if (M.q) { let t = 0; for (let m = n + 1; m <= 3000; m++) t += 1 / (M.k(m) ** 4); tl.push([n, Math.log10(Rk ** 4 * t)]); }
          }
          const ys = pts.concat(tl).map((q) => q[1]);
          const lo = Math.max(-16, Math.floor(Math.min(...ys)) - 0.5), hi = Math.ceil(Math.max(...ys)) + 0.5;
          R.setView(null, [lo, hi]);
          R.setTicks(null, logTicks(lo, hi, hi - lo > 10 ? 2 : 1));
          R.setTitle(M.f ? '$\\sup_K|p_N-f|$ (log scale)' : 'Cauchy gap $\\sup_K|p_{2N}-p_N|$ (log scale)');
          if (tl.length) R.path(tl, { color: 'orange', width: 1.8, dash: [6, 4] });
          R.path(pts, { color: M.f ? 'gold' : 'red', width: 2.6 });
          R.vline(N, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(N, pts[N - 1][1], { color: M.f ? 'gold' : 'red', r: 5 });
          if (!M.f) R.corner('Σ|1 − fₙ(z)| = |z| Σ 1/n = ∞', 'tr', { color: 'red', weight: 600 });
          // zeros inside K: argument principle for p_N, and the count for the limit
          const wind = v.M.winding((t) => prod(M, N, Cx.polar(Rk, 2 * Math.PI * t)), 0, 1600);
          const limCount = Math.floor(Rk) * M.per;
          st = { key, N, Rk, wind, limCount, err: Math.pow(10, pts[N - 1][1]) };
          v.legend(M.f ? [['ink', 'zeros of $p_N$ (number = multiplicity)', { dot: true }], ['gold', '$\\sup_K|p_N-f|$'], ['orange', '$\\sup_K\\sum_{n>N}|1-f_n|$', { dash: true }]] : [['ink', 'zeros of $p_N$', { dot: true }], ['red', 'Cauchy gap: does not tend to $0$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.key === 'fails') return `Radius of $K$: $${v.fix(s.Rk, 2)}$. $\\sup_K|p_{${2 * s.N}}-p_{${s.N}}| = ${v.sci(s.err, 3)}$ — the partial products are not uniformly Cauchy, so no holomorphic limit is produced (15.9 repairs this with exponential factors).`;
          return `Radius of $K$: $${v.fix(s.Rk, 2)}$. $\\sup_K|p_{${s.N}}-f| = ${v.sci(s.err, 3)}$. Zeros of $p_{${s.N}}$ in $K$ (argument principle): $${s.wind}$; zeros of $f$ in $K$, counted by $\\sum_n m(f_n;z)$: $${s.limCount}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ Weierstrass factors
    {
      num: '15.7',
      kind: 'Definition',
      name: 'Elementary factors $E_p$',
      statement: String.raw`Put $E_0(z)=1-z$ and, for $p=1,2,3,\dots$,
$$E_p(z)=(1-z)\exp\Big(z+\frac{z^2}{2}+\cdots+\frac{z^p}{p}\Big).$$
These entire functions are Weierstrass's **elementary factors**. The only zero of $E_p$ is a simple zero at $z=1$.`,
      idea: String.raw`The exponent is the $p$-th partial sum of $-\log(1-z)=\sum_{k\ge1}z^k/k$, so for $|z|<1$, $E_p(z)=\exp\big(-\sum_{k>p}z^k/k\big)$: the convergence factor cancels the first $p$ terms of the logarithm of $1-z$, leaving $E_p(z)=1-O(|z|^{p+1})$. Larger $p$ makes $E_p$ flatter near $0$ (15.8), which is what lets products $\prod E_{p_n}(z/z_n)$ converge even when $\prod(1-z/z_n)$ does not.`,
      caption: String.raw`Left: phase portrait of $E_p$ with its zero at $1$; the shaded green region is where $|E_p(z)-1|<0.1$ — it swells towards the unit disc as $p$ grows. Right: $E_p(x)$ for real $x$ and several $p$ (selected one in blue): all vanish at $x=1$, and near $0$ they hug the line $y=1$ to order $p+1$.`,
      deps: [],
      tags: ['Weierstrass factors', 'entire functions'],
      viz(v) {
        const { Cx } = v.M;
        const PS = [0, 1, 2, 3, 5, 8];
        const E = (p, z) => { let s = new Cx(0, 0), w = z; for (let k = 1; k <= p; k++) { s = s.add(w.scale(1 / k)); w = w.mul(z); } return new Cx(1, 0).sub(z).mul(s.exp()); };
        const Er = (p, x) => { let s = 0, w = x; for (let k = 1; k <= p; k++) { s += w / k; w *= x; } return (1 - x) * Math.exp(s); };
        const which = v.select('$p$', PS.map((p) => ({ value: p, label: String(p) })), 2);
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.8, 1.8], equal: true, height: 340, title: 'phase of $E_p$; green: $|E_p-1|<0.1$' });
        const R = v.stage({ x: [-1.6, 1.45], y: [-0.4, 2.3], height: 340, axes: true, xlabel: 'x', title: '$E_p(x)$ on the real axis' });
        let st = null;
        v.legend([['green', '$\\{|E_p(z)-1|<0.1\\}$', { area: true }], ['ink', 'unit circle', { dash: true }], ['blue', 'selected $E_p(x)$'], ['faint', 'other $p$']]);
        v.render(() => {
          const p = which.value;
          L.domain((z) => E(p, z), { key: `E${p}`, res: 2, alpha: 1 });
          const g = v.rgb('green'), pn = v.rgb('panel');
          L.raster((x, y) => (E(p, new Cx(x, y)).sub(1).abs() < 0.1 ? [g[0] * 0.8 + pn[0] * 0.2, g[1] * 0.8 + pn[1] * 0.2, g[2] * 0.8 + pn[2] * 0.2, 175] : null), { key: `m${p}`, id: 'mask', res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.4, dash: [5, 4] });
          xMark(L, 1, 0, 'ink', 6);
          L.tex('1', 1, 0, { color: 'ink', size: 14, dx: 12, dy: 12 });
          for (const q of PS) if (q !== p) R.fn((x) => Er(q, x), { color: 'faint', width: 1.4 });
          R.hline(1, { color: 'green', width: 1.2, dash: [5, 4] });
          R.fn((x) => Er(p, x), { color: 'blue', width: 3 });
          R.dot(1, 0, { color: 'ink', r: 4 });
          R.tex(`E_{${p}}`, -1.25, Math.min(2.15, Er(p, -1.25)), { color: 'blue', size: 15, dx: 14, dy: -10 });
          // radius of the region |E_p − 1| < 0.1 along the positive axis
          let r = 0; while (r < 1.5 && Math.abs(Er(p, r + 0.001) - 1) < 0.1) r += 0.001;
          st = { p, r };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$E_{${s.p}}(z) = (1-z)\\exp\\big(${s.p === 0 ? '0' : Array.from({ length: s.p }, (_, k) => (k ? `\\frac{z^{${k + 1}}}{${k + 1}}` : 'z')).slice(0, 4).join('+') + (s.p > 4 ? '+\\cdots' : '')}\\big)$; along $[0,1)$, $|E_{${s.p}}(x)-1|<0.1$ for $x<${v.fix(s.r, 3)}$.`;
        });
      },
    },
    {
      num: '15.8',
      kind: 'Lemma',
      name: '$|1-E_p(z)|\\le|z|^{p+1}$ on the closed unit disc',
      statement: String.raw`For $|z|\le1$ and $p=0,1,2,\dots$,
$$|1-E_p(z)|\le|z|^{p+1}.$$`,
      idea: String.raw`For $p=0$ it is an identity. For $p\ge1$, differentiating gives $-E_p'(z)=z^p\exp\big(z+\cdots+\frac{z^p}{p}\big)$, whose Taylor coefficients are all $\ge0$. Integrating from $0$, $1-E_p(z)=z^{p+1}\varphi(z)$ where $\varphi=\sum a_jz^j$ has $a_j\ge0$, and $\varphi(1)=1-E_p(1)=1$, i.e. $\sum a_j=1$. Hence $|\varphi(z)|\le\sum a_j|z|^j\le\sum a_j=1$ for $|z|\le1$.`,
      caption: String.raw`Left: the ratio $|1-E_p(z)|/|z|^{p+1}=|\varphi(z)|$ over the closed unit disc — it never exceeds $1$, reaching $1$ only at $z=1$. Drag $z$ to read it off. Right: the Taylor coefficients $a_j$ of $\varphi$, all nonnegative, with running sum (green) tending to exactly $1$ — the whole proof in one picture.`,
      deps: ['rca-15.7'],
      tags: ['Weierstrass factors', 'estimates'],
      viz(v) {
        const PS = [0, 1, 2, 3, 5];
        const which = v.select('$p$', PS.map((p) => ({ value: p, label: String(p) })), 2);
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: false, title: '$|\\varphi(z)|=|1-E_p(z)|\\,/\\,|z|^{p+1}$ on $|z|\\le1$' });
        const R = v.stage({ x: [-0.7, 16.7], y: [0, 1.08], height: 340, axes: 'box', xlabel: 'j', title: 'coefficients $a_j\\ge0$ of $\\varphi$, and $\\sum_{i\\le j}a_i$' });
        const z = L.handle(0.55, 0.45, { color: 'gold', label: 'z', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 1 ? [x / m, y / m] : [x, y]; } });
        let st = null;
        v.legend([['accent', '$a_j$', { area: true }], ['green', 'partial sums $\\to\\varphi(1)=1$']]);
        v.render(() => {
          const p = which.value;
          const a = elemCoeffs(p);
          const phi = (x, y) => { let re = 0, im = 0; for (let j = a.length - 1; j >= 0; j--) { const t = re * x - im * y + a[j]; im = re * y + im * x; re = t; } return Math.hypot(re, im); };
          L.heat((x, y) => (x * x + y * y <= 1 ? phi(x, y) : NaN), { range: [0, 1], cmap: 'viridis', key: `p${p}`, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          for (const r of [0.25, 0.5, 0.75]) L.circle(0, 0, r, { color: 'panel', width: 1, alpha: 0.5, dash: [2, 4] });
          L.dot(1, 0, { color: 'red', r: 4.5, label: '|φ(1)| = 1', labelPos: 'ne' });
          const val = phi(z.x, z.y);
          // colour bar
          for (let i = 0; i < 40; i++) { const c = v.M.cmap(i / 39, 'viridis'); L.rect(-1.12 + i * 0.012, -1.12, -1.12 + (i + 1) * 0.012, -1.06, { fill: [c[0], c[1], c[2]], fillAlpha: 1, stroke: false }); }
          L.text('0', -1.12, -1.0, { size: 10.5, color: 'muted' }); L.text('1', -0.64, -1.0, { size: 10.5, color: 'muted', align: 'right' });
          const J = 17;
          R.bars(a.slice(0, J), { x0: 0, color: 'accent', fillAlpha: 0.7 });
          let cs = 0; const cum = a.slice(0, J).map((x, j) => { cs += x; return [j, cs]; });
          R.hline(1, { color: 'green', width: 1.2, dash: [5, 4] });
          R.path(cum, { color: 'green', width: 2.2 });
          R.dots(cum, { color: 'green', r: 3 });
          const total = a.reduce((s, x) => s + x, 0);
          st = { p, val, mod: Math.hypot(z.x, z.y), a, total, cs };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const first = s.a.slice(0, 4).map((x) => v.fmt(x, 3)).join(',\\ ');
          return `$p=${s.p}$: $a_0,\\dots,a_3 = ${first}$, $\\;\\sum_j a_j = ${v.fix(s.total, 6)}$. At $|z| = ${v.fix(s.mod, 3)}$: $|1-E_{${s.p}}(z)| = ${v.sci(s.val * s.mod ** (s.p + 1), 3)} \\le |z|^{${s.p + 1}} = ${v.sci(s.mod ** (s.p + 1), 3)}$ (ratio $${v.fix(s.val, 3)}$).`;
        });
      },
    },
  ],
};
