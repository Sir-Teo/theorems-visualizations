// Rudin, Functional Analysis — Chapter 1, part 6: the examples C(Ω), H(Ω), C^∞(Ω) and 𝒟_K,
// and L^p with 0 < p < 1 (1.44–1.47).

const TAU = 2 * Math.PI;
const bump = (x) => (Math.abs(x) < 1 ? Math.E * Math.exp(-1 / (1 - x * x)) : 0);
// polynomial helpers (coefficient arrays, c[0] + c[1] x + ...)
const padd = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
const pmul = (a, b) => { const out = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; })); return out; };
const pder = (a) => a.slice(1).map((x, i) => x * (i + 1));
const peval = (a, x) => a.reduceRight((s, c) => s * x + c, 0);
/** P_n with φ^{(n)}(x) = P_n(x) (1-x²)^{-2n} φ(x) for φ(x) = e·exp(-1/(1-x²)). */
const BUMP_P = (() => {
  const h = [1, 0, -1], h2 = pmul(h, h), x = [0, 1];
  const P = [[1]];
  for (let n = 0; n < 9; n++) { const Pn = P[n]; P.push(padd(padd(pmul(h2, pder(Pn)), pmul(pmul([0, 4 * n], h), Pn)), pmul([0, -2], Pn))); }
  return P;
})();
function bumpDeriv(n, x) {
  if (Math.abs(x) >= 1) return 0;
  const h = 1 - x * x;
  return peval(BUMP_P[n], x) * Math.exp(1 - 1 / h - 2 * n * Math.log(h));
}

export default {
  collection: 'fa',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.44
    {
      num: '1.44',
      kind: 'Definition',
      name: 'The space C(Ω)',
      statement: String.raw`Let $\Omega$ be a nonempty open subset of a Euclidean space, and choose compact sets $K_1\subset K_2\subset\cdots$ with $K_n$ in the interior of $K_{n+1}$ and $\bigcup K_n=\Omega$. On the space $C(\Omega)$ of continuous complex functions on $\Omega$, the seminorms
$$p_n(f)=\sup\{\abs{f(x)}:x\in K_n\}$$
form a separating family and define (1.37) the topology of uniform convergence on compact subsets of $\Omega$, independent of the choice of $(K_n)$. It is induced by a complete invariant metric, so $C(\Omega)$ is a Fréchet space; it is not locally bounded, hence not normable.`,
      idea: String.raw`Every compact $K\subset\Omega$ lies in some $K_n$, so the sets $V_n=\{p_n<1/n\}$ form a countable convex local base and 1.24 gives an invariant metric, e.g. $d(f,g)=\sum_n2^{-n}\frac{p_n(f-g)}{1+p_n(f-g)}$. A Cauchy sequence converges uniformly on each $K_n$, and the limit is continuous: completeness. No $V_n$ is bounded, since $V_n$ imposes no condition outside $K_n$.`,
      caption: String.raw`$\Omega=(0,1)$ with $K_n=[2^{-n},1-2^{-n}]$ (nested orange windows). Pick $f$: the bars show $p_n(f)$ for $n=1,\dots,8$ and the readout the Fréchet distance $d(f,0)$. $1/x$ belongs to $C(\Omega)$ although it is unbounded: every $p_n$ is finite. The last choice, a bump of height $t$ sitting outside $K_3$, lies in $V_3=\{p_3<1/3\}$ for every $t$ while $p_5$ grows without bound — $V_3$ is not a bounded set.`,
      deps: ['fa-1.37', 'fa-1.24', 'fa-1.8'],
      see: ['pma-7.15'],
      tags: ['function spaces', 'Fréchet spaces'],
      viz(v) {
        const FN = {
          inv: { label: '$1/x$', f: (x) => 1 / x, y: [-0.5, 34] },
          osc: { label: '$\\sin(1/x)$', f: (x) => Math.sin(1 / x), y: [-1.4, 1.4] },
          spk: { label: 'bump of height $t$ near $0$', f: null, y: null },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'inv');
        const tS = v.slider('$t$', 0, 20, 8, { step: 0.1 });
        const T = v.stage({ x: [0, 1], y: [-0.5, 34], height: 270, full: true, axes: 'box', title: '$f$ on $\\Omega=(0,1)$ and the compact sets $K_1\\subset K_2\\subset\\cdots$' });
        const B = v.stage({ x: [0.3, 8.7], y: [0, 1], height: 170, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6, 7, 8], title: '$p_n(f)=\\sup_{K_n}|f|$' });
        let st = {};
        v.render(() => {
          const k = which.value, t = tS.value;
          const c = 3 / 64, w = 1 / 64; // bump centred in (2^-5, 2^-4)... supported in (1/32, 1/16)
          const f = k === 'spk' ? (x) => t * bump((x - c) / w) : FN[k].f;
          T.setView([0, 1], k === 'spk' ? [-0.5, Math.max(1.5, t * 1.12)] : FN[k].y);
          for (let n = 1; n <= 6; n++) T.vband(Math.pow(2, -n), 1 - Math.pow(2, -n), { color: 'orange', alpha: 0.035 });
          for (let n = 1; n <= 6; n++) { T.vline(Math.pow(2, -n), { color: 'orange', width: 0.8, alpha: 0.5 }); T.vline(1 - Math.pow(2, -n), { color: 'orange', width: 0.8, alpha: 0.5 }); }
          T.text('K₁', 0.5, T.bounds.y[1], { align: 'center', baseline: 'top', dy: 6, color: 'orange', size: 12 });
          T.fn(f, { domain: [0.003, 0.997], color: 'blue', width: 2.2, n: 3000 });
          const p = [];
          for (let n = 1; n <= 8; n++) { const a = Math.pow(2, -n), b = 1 - a; let m = 0; for (let i = 0; i <= 3000; i++) m = Math.max(m, Math.abs(f(a + (b - a) * i / 3000))); p.push(m); }
          B.setView(null, [0, Math.max(1, ...p) * 1.15]);
          p.forEach((m, i) => B.rect(i + 1 - 0.3, 0, i + 1 + 0.3, m, { fill: k === 'spk' && i < 3 ? 'green' : 'accent', fillAlpha: 0.75, stroke: false }));
          const d = p.reduce((s, m, i) => s + Math.pow(2, -(i + 1)) * m / (1 + m), 0);
          st = { k, p, d, t };
        });
        v.readout(() => {
          const s = st; if (!s.p) return '';
          const head = `$d(f,0)\\approx${v.fix(s.d, 4)}$ (first 8 terms). `;
          if (s.k === 'spk') return head + `$p_1=p_2=p_3=0$, so $f\\in V_3$ for every $t$, but $p_5(f) = ${v.fix(s.p[4], 2)}$: $V_3$ is unbounded, and $C(\\Omega)$ is not locally bounded.`;
          if (s.k === 'inv') return head + `$p_n(1/x)=2^n$: finite for each $n$, unbounded in $n$ — fine in $C(\\Omega)$.`;
          return head + 'Every $p_n\\le1$.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.45
    {
      num: '1.45',
      kind: 'Definition',
      name: 'The space H(Ω)',
      statement: String.raw`For an open set $\Omega\subset\C$, the holomorphic functions $H(\Omega)$ form a subspace of $C(\Omega)$, with the topology of uniform convergence on compact sets (1.44). It is closed, because locally uniform limits of holomorphic functions are holomorphic, so $H(\Omega)$ is a Fréchet space. By Montel's theorem every closed bounded subset of $H(\Omega)$ is compact: $H(\Omega)$ has the Heine–Borel property. Hence (1.23) it is not locally bounded, and not normable.`,
      idea: String.raw`A bounded set in $H(\Omega)$ is a family uniformly bounded on each compact set; Cauchy's estimates then bound derivatives, the family is equicontinuous, and Arzelà–Ascoli with a diagonal argument yields locally uniformly convergent subsequences. In $C(\Omega)$ the same boundedness gives no control on oscillation, and compactness fails.`,
      caption: String.raw`Left: phase portrait of $f_k(z)=z^k$ on the unit disc $D$, with the compact disc $K_r=\{\abs z\le r\}$. Right: for each $k$, the distance $\min_{j<k}\sup_{K_r}\abs{f_k-f_j}$ to the closest earlier term. For the bounded family $z^k$ in $H(D)$ it tends to $0$ — a convergent subsequence exists, as Montel predicts. For the equally bounded family $\sin(k\,\Re z)$ in $C(D)$ it stays large: no subsequence converges uniformly on $K_r$.`,
      deps: ['fa-1.44', 'fa-1.23'],
      see: ['rca-10.28', 'rca-14.6'],
      tags: ['function spaces', 'Heine–Borel', 'holomorphic functions'],
      viz(v) {
        const kS = v.slider('$k$', 1, 40, 6, { int: true });
        const rS = v.slider('$r$', 0.3, 0.97, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 320, ticks: false, axes: false, title: 'phase portrait of $z^k$ on $D$' });
        const R = v.stage({ x: [0, 41], y: [0, 2.2], height: 320, axes: 'box', xlabel: 'k', title: '$\\min_{j<k}\\sup_{K_r}|f_k-f_j|$' });
        const cache = {};
        function curves(r) {
          const key = r.toFixed(2); if (cache[key]) return cache[key];
          const pts = []; for (let a = 0; a < 48; a++) for (let b = 1; b <= 12; b++) { const rr = r * b / 12, t = TAU * a / 48; pts.push([rr * Math.cos(t), rr * Math.sin(t)]); }
          const xs = Array.from({ length: 301 }, (_, i) => -r + 2 * r * i / 300);
          const H = [], C = [];
          const zpow = (k) => pts.map(([x, y]) => { const m = Math.pow(Math.hypot(x, y), k), t = k * Math.atan2(y, x); return [m * Math.cos(t), m * Math.sin(t)]; });
          const Z = Array.from({ length: 41 }, (_, k) => (k ? zpow(k) : null));
          for (let k = 2; k <= 40; k++) {
            let bh = Infinity, bc = Infinity;
            for (let j = 1; j < k; j++) {
              let mh = 0; for (let i = 0; i < pts.length; i++) mh = Math.max(mh, Math.hypot(Z[k][i][0] - Z[j][i][0], Z[k][i][1] - Z[j][i][1]));
              let mc = 0; for (const x of xs) mc = Math.max(mc, Math.abs(Math.sin(k * x) - Math.sin(j * x)));
              bh = Math.min(bh, mh); bc = Math.min(bc, mc);
            }
            H.push([k, bh]); C.push([k, bc]);
          }
          return (cache[key] = { H, C });
        }
        v.render(() => {
          const k = kS.value, r = rS.value;
          L.domain((z) => z.pow(k), { key: k, res: 2 });
          L.raster((x, y) => (x * x + y * y > 1 ? [250, 250, 250, 255] : null), { key: 'mask', id: 'mask', res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          L.circle(0, 0, r, { color: 'panel', width: 4 });
          L.circle(0, 0, r, { color: 'ink', width: 1.6, dash: [5, 4] });
          L.tex('K_r', r * 0.71, -r * 0.71, { color: 'ink', dx: 10, dy: 10 });
          const { H, C } = curves(r);
          R.path(C, { color: 'red', width: 2.2 });
          R.path(H, { color: 'blue', width: 2.2 });
          if (k >= 2) { R.dot(k, H[k - 2][1], { color: 'blue', r: 4.5 }); R.dot(k, C[k - 2][1], { color: 'red', r: 4.5 }); }
          R.text('C(D): sin(k·Re z)', 40, Math.min(2.1, C[C.length - 1][1] + 0.08), { color: 'red', size: 12, align: 'right', baseline: 'bottom' });
          R.text('H(D): zᵏ → 0', 39, H[H.length - 1][1] + 0.14, { color: 'blue', size: 12, align: 'right', baseline: 'bottom' });
        });
        v.readout(() => {
          const r = rS.value, k = kS.value;
          return `$\\sup_{K_r}|z^k| = r^k = ${v.fmt(Math.pow(r, k), 3)}$: the whole sequence $z^k$ converges to $0$ uniformly on $K_r$, while $\\sin(k\\,\\Re z)$ keeps oscillating with amplitude $1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.46
    {
      num: '1.46',
      kind: 'Definition',
      name: 'The spaces C^∞(Ω) and 𝒟_K',
      statement: String.raw`For $\Omega\subset\R^n$ open, $C^\infty(\Omega)$ is the space of infinitely differentiable complex functions on $\Omega$. With $K_N$ as in 1.44 and multi-indices $\alpha$, the seminorms
$$p_N(f)=\max\{\abs{D^\alpha f(x)}:x\in K_N,\ \abs\alpha\le N\}$$
make $C^\infty(\Omega)$ a Fréchet space with the Heine–Borel property. For a compact $K\subset\Omega$, $\mathscr D_K=\{f\in C^\infty(\Omega):\operatorname{supp}f\subset K\}$ is a closed subspace, hence also a Fréchet space with the Heine–Borel property. Neither is normable.`,
      idea: String.raw`Convergence means uniform convergence of every derivative on every compact set; completeness follows because uniform limits of derivatives are derivatives of the limit. For Heine–Borel, a bounded set has every $D^\alpha f$ uniformly bounded on each $K_N$, so each family of derivatives is equicontinuous, and Arzelà–Ascoli with a diagonal argument extracts convergent subsequences. $\mathscr D_K$ is the intersection of the kernels of the continuous functionals $f\mapsto f(x)$, $x\notin K$.`,
      caption: String.raw`A test function in $\mathscr D_K$, $K=[-1,1]$: the bump $\varphi_a(x)=\varphi(x/a)$ of width $a$ (derivatives computed exactly from $\varphi(x)=e\cdot e^{-1/(1-x^2)}$). The middle panel shows its $N$-th derivative, the bars $\log_{10}$ of $\sup\abs{\varphi_a^{(j)}}$ for $j=0,\dots,8$. Shrinking $a$ leaves the height $1$ untouched but inflates the $j$-th derivative like $a^{-j}$: the family $\{\varphi_a\}$ is bounded in the sup norm but not in $\mathscr D_K$, whose topology sees every derivative.`,
      deps: ['fa-1.44', 'fa-1.37'],
      tags: ['function spaces', 'test functions', 'Fréchet spaces'],
      viz(v) {
        const aS = v.slider('width $a$', 0.15, 1, 0.6, { step: 0.01 });
        const NS = v.slider('derivative $N$', 0, 8, 3, { int: true });
        const T = v.stage({ x: [-1.25, 1.25], y: [-0.1, 1.15], height: 170, full: true, axes: 'box', title: '$\\varphi_a$ and $K=[-1,1]$' });
        const D = v.stage({ x: [-1.25, 1.25], y: [-1, 1], height: 210, full: true, axes: 'box', title: 'the derivative $\\varphi_a^{(N)}$' });
        const B = v.stage({ x: [-0.6, 8.6], y: [-1, 12], height: 170, full: true, axes: 'box', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8], yticks: [[0, '1'], [3, '10³'], [6, '10⁶'], [9, '10⁹'], [12, '10¹²'], [15, '10¹⁵'], [18, '10¹⁸']], title: '$\\log_{10}\\sup|\\varphi_a^{(j)}|$, $j=0,\\dots,8$ (outlines: $a=1$)' });
        const supD = (j, a) => { let m = 0; for (let i = 1; i < 2000; i++) { const x = -1 + 2 * i / 2000; m = Math.max(m, Math.abs(bumpDeriv(j, x))); } return m * Math.pow(a, -j); };
        const base = Array.from({ length: 9 }, (_, j) => supD(j, 1));
        let st = {};
        v.render(() => {
          const a = aS.value, N = NS.value;
          for (const Sx of [T, D]) Sx.vband(-1, 1, { color: 'orange', alpha: 0.07, edges: true });
          T.fn((x) => bump(x / a), { color: 'blue', width: 2.4, n: 800 });
          T.text('K', 1, 1.05, { color: 'orange', size: 13, align: 'right', dx: -6 });
          const dN = (x) => bumpDeriv(N, x / a) * Math.pow(a, -N);
          const m = base[N] * Math.pow(a, -N);
          D.setView(null, [-m * 1.15, m * 1.15]);
          D.fn(dN, { color: 'purple', width: 2.2, n: 1600 });
          D.hline(m, { color: 'purple', dash: [4, 4], width: 1 }); D.hline(-m, { color: 'purple', dash: [4, 4], width: 1 });
          D.text(`sup = ${v.fmt(m, 3)}`, 1.2, m, { color: 'purple', align: 'right', baseline: 'bottom', dy: -3, size: 12 });
          B.setView(null, [-1, Math.max(12, Math.log10(base[8] * Math.pow(a, -8)) + 0.8)]);
          for (let j = 0; j <= 8; j++) {
            const val = Math.log10(base[j] * Math.pow(a, -j));
            B.rect(j - 0.32, -1, j + 0.32, val, { fill: j === N ? 'purple' : 'accent', fillAlpha: 0.75, stroke: false });
            B.rect(j - 0.38, -1, j + 0.38, Math.log10(base[j]), { color: 'muted', width: 1.2, dash: [3, 3] });
          }
          st = { a, N, m, pN: Math.max(...Array.from({ length: N + 1 }, (_, j) => base[j] * Math.pow(a, -j))) };
        });
        v.readout(() => `$\\sup|\\varphi_a| = 1$ for every $a$, but $\\sup|\\varphi_a^{(${st.N})}| = ${v.fmt(st.m, 4)}$, so the seminorm $p_{${st.N}}(\\varphi_a)=\\max_{j\\le${st.N}}\\sup|\\varphi_a^{(j)}| = ${v.fmt(st.pN, 4)}$ (taking $K_${st.N}\\supset K$). As $a\\to0$ these blow up: the set $\\{\\varphi_a\\}$ is not bounded in $\\mathscr D_K$.`);
      },
    },
    // ------------------------------------------------------------------ 1.47
    {
      num: '1.47',
      kind: 'Definition',
      name: 'The spaces L^p with 0 < p < 1',
      statement: String.raw`Fix $0<p<1$ and let $L^p=L^p([0,1])$ with Lebesgue measure. Put $\Delta(f)=\int_0^1\abs{f}^p$ and $d(f,g)=\Delta(f-g)$. Then $d$ is a complete invariant metric, so $L^p$ is an F-space, and $L^p$ is locally bounded. But the only convex open subsets of $L^p$ are $\emptyset$ and $L^p$; consequently $L^p$ is not locally convex, not normable, and $0$ is the only continuous linear functional on $L^p$.`,
      idea: String.raw`The inequality $\abs{a+b}^p\le\abs a^p+\abs b^p$ for $0<p<1$ makes $d$ a metric; completeness is proved as for $p\ge1$, and the balls $\{\Delta<r\}$ are bounded since $\Delta(tf)=t^p\Delta(f)$. Now let $V$ be convex, open and contain $0$, so $V\supset\{\Delta<r\}$. Given $f$, split $[0,1]$ into $n$ intervals carrying equal shares of $\Delta(f)$ and let $g_i=nf\mathbf 1_{I_i}$; then $\Delta(g_i)=n^{p-1}\Delta(f)<r$ for large $n$, and $f=\frac1n\sum g_i\in V$. If $\Lambda$ is continuous and linear, $\{\abs{\Re\Lambda}<1\}$ is such a set, so $\Re\Lambda$ is bounded on $L^p$, hence $0$.`,
      caption: String.raw`Drag the five handles to shape $f$ (blue). The orange cuts split $[0,1]$ into $n$ pieces carrying equal shares of $\Delta(f)$, and the coloured blocks are the functions $g_i=n f\mathbf 1_{I_i}$, whose average is exactly $f$. The bottom chart shows $\Delta(g_i)=n^{p-1}\Delta(f)$ against $n$: once it drops below the radius $r$ of a ball $\{\Delta<r\}$ (dashed), every $g_i$ lies in that ball, so $f$ lies in its convex hull — any convex open set containing $0$ swallows all of $L^p$.`,
      deps: ['fa-1.8', 'fa-1.39', 'fa-1.24'],
      see: ['rca-3.5', 'rca-3.11'],
      tags: ['function spaces', 'convexity', 'F-spaces'],
      viz(v) {
        const pS = v.slider('$p$', 0.1, 0.95, 0.5, { step: 0.01 });
        const nS = v.slider('$n$', 1, 40, 6, { int: true });
        const rS = v.slider('ball radius $r$', 0.05, 1, 0.25, { step: 0.01 });
        const T = v.stage({ x: [0, 1], y: [0, 3], height: 280, full: true, axes: 'box', title: '$f$, the cuts, and the pieces $g_i=nf\\,\\mathbf 1_{I_i}$' });
        const C = v.stage({ x: [0, 41], y: [0, 1.2], height: 170, full: true, axes: 'box', xlabel: 'n', title: '$\\Delta(g_i)=n^{p-1}\\Delta(f)$' });
        const xs = [0, 0.25, 0.5, 0.75, 1], init = [0.6, 1.4, 0.4, 0.9, 1.2];
        const H = xs.map((x, i) => T.handle(x, init[i], { color: 'blue', r: 6, constrain: (px, py) => [x, Math.max(0.02, Math.min(2.9, py))] }));
        let st = {};
        v.render(() => {
          const p = pS.value, n = nS.value, r = rS.value;
          const f = (x) => { const k = Math.min(3, Math.floor(x * 4)), t = x * 4 - k; return H[k].y * (1 - t) + H[k + 1].y * t; };
          // cumulative Δ and equal-mass cuts
          const M = 4000, cum = [0];
          for (let i = 1; i <= M; i++) { const x = (i - 0.5) / M; cum.push(cum[i - 1] + Math.pow(Math.abs(f(x)), p) / M); }
          const D = cum[M];
          const cuts = [0]; let j = 1;
          for (let i = 1; i <= M && cuts.length < n; i++) while (cuts.length < n && cum[i] >= D * j / n) { cuts.push(i / M); j++; }
          cuts.push(1);
          const top = Math.max(3, ...Array.from({ length: 200 }, (_, i) => n * f((i + 0.5) / 200)) ) ;
          T.setView([0, 1], [0, Math.min(top, n * 3) * 1.05]);
          const cols = ['teal', 'purple', 'pink', 'gold'];
          for (let i = 0; i < n; i++) {
            const a = cuts[i], b = cuts[i + 1];
            const g = []; for (let k = 0; k <= 30; k++) { const x = a + (b - a) * k / 30; g.push([x, n * f(x)]); }
            T.poly([[a, 0], ...g, [b, 0]], { fill: cols[i % 4], fillAlpha: 0.28, color: cols[i % 4], width: 1 });
          }
          for (const c of cuts.slice(1, -1)) T.vline(c, { color: 'orange', width: 1, dash: [4, 3] });
          T.fn(f, { color: 'blue', width: 2.6 });
          // chart
          C.setView(null, [0, Math.max(1.1 * D, r * 1.3)]);
          C.hline(r, { color: 'green', dash: [6, 4], width: 1.6 });
          C.fn((m) => Math.pow(m, p - 1) * D, { domain: [1, 40], color: 'accent', width: 2.2 });
          const val = Math.pow(n, p - 1) * D;
          C.dot(n, val, { color: val < r ? 'green' : 'red', r: 5 });
          C.text('r', 40.5, r, { color: 'green', size: 12, align: 'right', baseline: 'bottom', dy: -3 });
          st = { D, val, r, n, p };
        });
        v.legend([['blue', '$f$ (average of the $g_i$)'], ['teal', 'pieces $g_i$', { area: true }], ['green', 'radius $r$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.D == null) return '';
          return `$\\Delta(f) = ${v.fix(s.D, 3)}$, $\\Delta(g_i) = ${s.n}^{${v.fix(s.p - 1, 2)}}\\cdot\\Delta(f) = ${v.fix(s.val, 4)}$ ` + (s.val < s.r ? `$< r$: all $g_i$ lie in the ball $\\{\\Delta<${v.fix(s.r, 2)}\\}$, and $f=\\frac1n\\sum g_i$ lies in its convex hull.` : `$\\ge r$ — increase $n$; since $p<1$ the value tends to $0$.`);
        });
      },
    },
  ],
};
