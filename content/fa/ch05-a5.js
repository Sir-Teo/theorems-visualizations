// Rudin, Functional Analysis — Chapter 5 (part 5): sums of Poisson kernels, more fixed point theorems

// ---------------------------------------------------------------- helpers
const XT = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [2 * Math.PI, '2π']];
const d2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Clip a polygon to the half-plane {x : a·x ≤ b} (Sutherland–Hodgman). */
function clipHalf(poly, a, b) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], fp = d2(a, P) - b, fq = d2(a, Q) - b;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** Intersection of two convex polygons (B given counter-clockwise). */
function clipConvex(A, B) {
  let P = A.slice();
  for (let i = 0; i < B.length && P.length; i++) { const u = B[i], w = B[(i + 1) % B.length], n = [w[1] - u[1], -(w[0] - u[0])]; P = clipHalf(P, n, d2(n, u)); }
  return P;
}
const ccw = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a >= 0 ? P : P.slice().reverse(); };
const diam = (P) => { let m = 0; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) m = Math.max(m, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1])); return m; };
// the probability simplex on three states, drawn as a triangle
const VTX = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]];
const toXY = (p) => [p[0] * VTX[0][0] + p[1] * VTX[1][0] + p[2] * VTX[2][0], p[0] * VTX[0][1] + p[1] * VTX[1][1] + p[2] * VTX[2][1]];
const toBary = ([x, y]) => { const c = y / VTX[2][1], b = x - 0.5 * c; return [1 - b - c, b, c]; };
const rowTimes = (p, P) => [0, 1, 2].map((j) => p[0] * P[0][j] + p[1] * P[1][j] + p[2] * P[2][j]);
const matMul3 = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));

export default {
  book: 'fa',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ sums of Poisson kernels
    {
      num: '5.22',
      kind: 'Theorem',
      name: 'Every L¹ function is a sum of Poisson kernels',
      statement: String.raw`Let $\{\alpha_i\}$ be a sequence in the open unit disc $U$ such that almost every point of $\T$ is a nontangential limit of some subsequence of $\{\alpha_i\}$, and let $P_\alpha(e^{i\theta})=\frac{1-|\alpha|^2}{|e^{i\theta}-\alpha|^2}$ be the Poisson kernel. Then every $f\in L^1(\T)$ with $\|f\|_1<1$ has a representation
$$f=\sum_{i=1}^\infty c_iP_{\alpha_i}\qquad\text{with}\qquad\sum_{i=1}^\infty|c_i|<1,$$
the series converging in $L^1(\T)$.`,
      idea: String.raw`Let $T:\ell^1\to L^1(\T)$, $T(c)=\sum c_iP_{\alpha_i}$; it is bounded since $\|P_\alpha\|_1=1$. Its adjoint maps $g\in L^\infty=(L^1)^*$ to the sequence $\big(\int gP_{\alpha_i}\,\tfrac{d\theta}{2\pi}\big)_i=\big(P[g](\alpha_i)\big)_i$ — the values of the Poisson integral of $g$ at the points $\alpha_i$. By Fatou's theorem $P[g]$ has nontangential limit $g$ a.e., so $\sup_i|P[g](\alpha_i)|\ge\|g\|_\infty$: $T^*$ is an isometry. Theorem 4.13 then says that $T$ maps the open unit ball of $\ell^1$ onto the open unit ball of $L^1$.`,
      caption: String.raw`Points $\alpha_i$ on circles of radius $1-0.9\cdot2^{-k}$ with $32\cdot2^{k-1}$ points each ($k=1,\dots,7$), so every boundary point is approached inside a Stolz angle. Layer $k$ approximates the current residual by its Poisson integral at that radius, discretised as $\sum_jc_jP_{\alpha_j}$ with $c_j$ = (average of the residual on the $j$-th arc)$/m_k$, so $\sum|c_j|\le\|\text{residual}\|_1$. Left: the points, dot size growing with $m_k|c_i|$ (blue $c_i>0$, orange $c_i<0$). Right: $f$ and the partial sum. Starting at a finer layer brings $\sum|c_i|$ closer to $\|f\|_1$. Switch the points to stay in $|z|\le0.7$: the residual stalls and $\sum|c_i|$ piles up — the nontangential hypothesis matters.`,
      deps: ['fa-4.13', 'rca-11.24'],
      see: ['rca-11.9'],
      tags: ['Poisson kernel', 'duality', 'L1'],
      verify: true,
      viz(v) {
        const M = v.M;
        const FS = {
          step: { label: 'signed steps', f: (t) => (t > 0.6 && t < 2.1 ? 1.8 : t > 3.6 && t < 5.0 ? -1.4 : 0) },
          spike: { label: 'integrable spike', f: (t) => 0.32 / Math.sqrt(Math.abs(t - 4.1) + 1e-3) - 0.25 },
          tri: { label: 'triangle wave', f: (t) => 1.2 * (Math.abs(M.mod(3 * t / Math.PI, 2) - 1) - 0.5) },
        };
        const which = v.select('$f$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'step');
        const where = v.select('points $\\alpha_i$', [{ value: 'nt', label: 'accumulate at $\\T$ nontangentially' }, { value: 'in', label: 'stay in $|z|\\le0.7$' }], 'nt');
        const K0 = v.select('first layer used', [1, 3, 5].map((k) => ({ value: k, label: `$k_0=${k}$` })), 3);
        const LS = v.slider('number of layers used', 1, 7, 3, { int: true });
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 330, axes: false, weight: 0.8, title: 'the points $\\alpha_i\\in U$ and the coefficients $c_i$' });
        const R = v.stage({ x: [0, M.TAU], y: [-2, 2], height: 330, axes: 'box', xticks: XT, weight: 1.3, title: '$f$ and the partial sum $\\sum c_iP_{\\alpha_i}$' });
        const G = 8192, th = M.range(G).map((m) => M.TAU * (m + 0.5) / G);
        const cache = {};
        // layer k: radius 1 − 0.9·2^{−k}, 32·2^{k−1} equally spaced points (nontangential approach); or radius 0.7, 64 points
        function build(fk, wk, k0) {
          const key = `${fk}|${wk}|${k0}`; if (cache[key]) return cache[key];
          const f = th.map(FS[fk].f), nf = M.mean(f.map(Math.abs));
          let r = f.slice(); const layers = [];
          for (let k = k0; k <= 7; k++) {
            const rad = wk === 'nt' ? 1 - 0.9 * Math.pow(0.5, k) : 0.7, m = wk === 'nt' ? 32 * 2 ** (k - 1) : 64, per = G / m;
            const ker = M.range(G).map((d) => M.poisson(rad, M.TAU * d / G));
            const pts = [];
            for (let j = 0; j < m; j++) {
              let s = 0; for (let q = 0; q < per; q++) s += r[j * per + q];
              const c = s / per / m, t = M.TAU * (j + 0.5) / m; pts.push({ x: rad * Math.cos(t), y: rad * Math.sin(t), c });
            }
            const S = new Float64Array(G), off = per / 2;
            pts.forEach((p, j) => { if (!p.c) return; const s0 = j * per + off; for (let i = 0; i < G; i++) S[i] += p.c * ker[((i - s0) % G + G) % G]; });
            r = r.map((y, i) => y - S[i]);
            const prev = layers.length ? layers[layers.length - 1] : { sum: th.map(() => 0), l1: 0 };
            layers.push({ k, pts, rad, sum: prev.sum.map((y, i) => y + S[i]), res: M.mean(r.map(Math.abs)), l1: prev.l1 + M.sum(pts, (p) => Math.abs(p.c)) });
          }
          return (cache[key] = { f, nf, fmax: Math.max(...f.map(Math.abs)), layers });
        }
        let st = {};
        v.legend([['blue', '$f$; points with $c_i>0$'], ['orange', 'points with $c_i<0$', { dot: true }], ['gold', 'partial sum $\\sum c_iP_{\\alpha_i}$']]);
        v.render(() => {
          const inn = where.value === 'in', k0 = inn ? 1 : K0.value, B = build(which.value, where.value, k0), K = Math.min(LS.value, B.layers.length);
          L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          if (inn) L.circle(0, 0, 0.7, { color: 'red', width: 1, dash: [4, 4] });
          for (let k = 0; k < K; k++) {
            const lay = B.layers[k], m = lay.pts.length;
            for (const p of lay.pts) { if (Math.abs(p.c) * m < 1e-3 * B.fmax) continue; const rr = Math.min(5.5, 0.9 + 3.4 * Math.sqrt(Math.abs(p.c) * m / B.fmax)); L.dot(p.x, p.y, { color: p.c > 0 ? 'blue' : 'orange', r: rr, ring: false, alpha: 0.8 }); }
          }
          const lay = B.layers[K - 1];
          const lo = Math.min(...B.f, ...lay.sum), hi = Math.max(...B.f, ...lay.sum), pd = 0.1 * (hi - lo);
          R.setView(null, [Math.max(lo - pd, -4), Math.min(hi + 2.4 * pd, 5)]);
          R.hline(0, { color: 'faint', width: 1 });
          R.path(th.map((t, i) => [t, B.f[i]]), { color: 'blue', width: 2 });
          R.path(th.map((t, i) => [t, lay.sum[i]]), { color: 'gold', width: 2.2 });
          R.corner(`‖f‖₁ = ${v.fix(B.nf, 3)}    Σ|cᵢ| = ${v.fix(lay.l1, 3)}    ‖f − Σ cᵢPᵢ‖₁ = ${v.fix(lay.res, 4)}`, 'tl', { color: inn ? 'red' : 'ink', weight: 600 });
          st = { K, k0, nf: B.nf, l1: lay.l1, res: lay.res, inn, npts: B.layers.slice(0, K).reduce((s, l) => s + l.pts.length, 0), hist: B.layers.slice(0, K).map((l) => l.res) };
        });
        v.readout(() => `${st.npts} points in ${st.K} layer${st.K > 1 ? 's' : ''}: residual $\\|f-\\sum c_iP_{\\alpha_i}\\|_1$ after each layer ${st.hist.map((x) => v.fix(x, 4)).join(', ')}; $\\sum|c_i|=${v.fix(st.l1, 4)}=${v.fix(st.l1 / st.nf, 3)}\\,\\|f\\|_1$. ` + (st.inn ? 'With the points kept inside $|z|\\le0.7$ every $\\sum c_iP_{\\alpha_i}$ with $\\sum|c_i|<\\infty$ is real-analytic on $\\T$, so a step function is never reached and the coefficients only pile up.' : `Each layer removes a fixed fraction of the residual, so $\\sum|c_i|\\le\\|f\\|_1/(1-\\delta)$ as in the proof of 4.13; starting at a finer layer (larger $k_0$) makes $\\delta$ smaller and brings $\\sum|c_i|$ down towards $\\|f\\|_1$.`));
      },
    },
    // ------------------------------------------------------------------ two more fixed point theorems
    {
      num: '5.23',
      kind: 'Theorem',
      name: 'Markov–Kakutani fixed point theorem',
      statement: String.raw`Let $K$ be a nonempty compact convex set in a topological vector space $X$, and let $\Phi$ be a commuting collection of continuous affine maps of $K$ into $K$. Then there is $p\in K$ with $Tp=p$ for every $T\in\Phi$.`,
      idea: String.raw`For $T\in\Phi$ put $T_n=\frac1n(I+T+\dots+T^{n-1})$: continuous affine maps of $K$ into $K$, all commuting, so $T_n(K)$ is compact, and $T_n S_m(K)=S_mT_n(K)\subset T_n(K)\cap S_m(K)$ gives the finite intersection property. Any $p$ in the intersection of all the sets $T_n(K)$ is fixed: writing $p=T_nx$, one gets $Tp-p=\frac1n(T^nx-x)\in\frac1n(K-K)$ for every $n$, and $K-K$ is compact, hence bounded, so $Tp=p$. No local convexity and no equicontinuity are needed — commutativity replaces them.`,
      caption: String.raw`$K$ = probability vectors on three states, $T$ and $S$ = Markov chains acting by $p\mapsto pP$ (affine, continuous). The orange and purple triangles are $T_n(K)$ and $S_n(K)$, the images of $K$ under the Cesàro averages; their intersection (green) shrinks to the common fixed points. Drag $x_0$: its orbit under $T$ (gold) may cycle forever, but its running averages converge. Choose non-commuting chains and the two triangles shrink to different points.`,
      deps: ['fa-1.15'],
      tags: ['fixed points', 'Markov chains', 'convexity'],
      viz(v) {
        const M = v.M;
        const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const CYC = [[0, 1, 0], [0, 0, 1], [1, 0, 0]];
        const CH = [[0.1, 0.7, 0.2], [0.5, 0.1, 0.4], [0.3, 0.6, 0.1]];
        const RED = [[1, 0, 0], [0, 1, 0], [0.45, 0.25, 0.3]];
        const OTH = [[0.8, 0.1, 0.1], [0.6, 0.3, 0.1], [0.7, 0.1, 0.2]];
        const MODES = {
          cyc: { label: 'cyclic $T$, $S=T^2$', T: CYC, S: matMul3(CYC, CYC), comm: true },
          lazy: { label: 'a chain $T$, $S=\\frac12(I+T)$', T: CH, S: CH.map((r, i) => r.map((x, j) => 0.5 * x + 0.5 * I3[i][j])), comm: true },
          red: { label: 'absorbing chain, $S=T^2$', T: RED, S: matMul3(RED, RED), comm: true },
          nc: { label: 'non-commuting', T: CH, S: OTH, comm: false },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'cyc');
        const nS = v.slider('$n$ (Cesàro length)', 1, 40, 4, { int: true });
        const S = v.stage({ x: [-0.12, 1.12], y: [-0.12, 0.98], equal: true, height: 400, axes: false });
        const x0 = S.handle(0.22, 0.12, { color: 'gold', label: 'x₀', constrain: (x, y) => { const b = toBary([x, y]).map((t) => Math.max(0, t)); const s = b[0] + b[1] + b[2]; return toXY(b.map((t) => t / s)); } });
        const avgMat = (P, n) => { let A = I3.map((r) => r.slice()), Pk = I3; for (let k = 1; k < n; k++) { Pk = matMul3(Pk, P); A = A.map((r, i) => r.map((x, j) => x + Pk[i][j])); } return A.map((r) => r.map((x) => x / n)); };
        let st = {};
        v.legend([['blue', '$K$ = probability vectors', { area: true }], ['orange', '$T_n(K)$'], ['purple', '$S_n(K)$'], ['green', '$T_n(K)\\cap S_n(K)$; averages of the orbit', { area: true }], ['gold', 'orbit $x_0P^k$', { dot: true }]]);
        v.render(() => {
          const Mo = MODES[which.value], n = nS.value;
          S.poly(VTX, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.08 });
          ['e₁', 'e₂', 'e₃'].forEach((lab, i) => S.text(lab, VTX[i][0] + [-0.05, 0.05, 0][i], VTX[i][1] + [-0.04, -0.04, 0.05][i], { color: 'blue', align: 'center', size: 13, math: true }));
          const TA = ccw(avgMat(Mo.T, n).map(toXY)), SA = ccw(avgMat(Mo.S, n).map(toXY));
          const inter = clipConvex(TA, SA);
          if (inter.length >= 3) S.poly(inter, { fill: 'green', fillAlpha: 0.32, stroke: false });
          S.poly(TA, { color: 'orange', width: 2.2 });
          S.poly(SA, { color: 'purple', width: 2.2, dash: [6, 4] });
          // orbit of x0 under T and its Cesàro averages
          let p = toBary([x0.x, x0.y]); const orb = [p];
          for (let k = 1; k < 40; k++) { p = rowTimes(p, Mo.T); orb.push(p); }
          S.dots(orb.slice(1, n).map(toXY), { color: 'gold', r: 3.4 });
          const avgs = []; let acc = [0, 0, 0];
          orb.forEach((q, k) => { acc = acc.map((a, j) => a + q[j]); avgs.push(toXY(acc.map((a) => a / (k + 1)))); });
          S.path(avgs.slice(0, n), { color: 'green', width: 1.8 });
          const an = toBary(avgs[n - 1]);
          S.dot(avgs[n - 1][0], avgs[n - 1][1], { color: 'green', r: 5.5 });
          const dT = Math.hypot(...[0, 1, 2].map((j) => rowTimes(an, Mo.T)[j] - an[j])), dS = Math.hypot(...[0, 1, 2].map((j) => rowTimes(an, Mo.S)[j] - an[j]));
          const sep = inter.length < 3;
          S.corner(Mo.comm ? (which.value === 'red' ? 'fixed points: the whole edge e₁e₂' : 'T, S commute: the green set shrinks to the common fixed point') : sep ? 'T, S do not commute: Tₙ(K) ∩ Sₙ(K) = ∅' : 'T, S do not commute: raise n', 'tl', { color: Mo.comm ? 'green' : 'red', weight: 600 });
          st = { n, dT, dS, sep, comm: Mo.comm, diamT: diam(TA), diamI: inter.length >= 3 ? diam(inter) : 0 };
        });
        v.readout(() => `$n=${st.n}$: $\\operatorname{diam}T_n(K)=${v.fix(st.diamT, 3)}$; for the average $a_n$ of the orbit, $|a_nT-a_n|=${v.fix(st.dT, 4)}$ and $|a_nS-a_n|=${v.fix(st.dS, 4)}$. ` + (st.comm ? 'Rudin\'s estimate $|a_nT-a_n|\\le\\frac1n\\operatorname{diam}(K-K)$ forces the limit to be fixed by $T$, and commutativity makes it fixed by $S$ as well.' : (st.sep ? 'The averaged images are disjoint, and indeed $T$ and $S$ have different stationary vectors: without commutativity the conclusion fails.' : 'The two families of averaged images will separate as $n$ grows.')));
      },
    },
    {
      num: '5.24',
      kind: 'Theorem',
      name: 'Invariant Hahn–Banach extensions',
      statement: String.raw`Let $Y$ be a subspace of a normed space $X$ and let $\Gamma$ be a commutative semigroup of bounded linear operators on $X$ with $\|T\|\le1$ and $T(Y)\subset Y$ for every $T\in\Gamma$. If $f\in Y^*$ satisfies $f(Ty)=f(y)$ for all $y\in Y$ and $T\in\Gamma$, then $f$ has an extension $\Lambda\in X^*$ with $\|\Lambda\|=\|f\|$ and $\Lambda(Tx)=\Lambda x$ for all $x\in X$ and $T\in\Gamma$.`,
      idea: String.raw`Let $K$ be the set of all norm-preserving extensions of $f$; by Hahn–Banach it is nonempty, and it is convex and weak$^*$-compact (Banach–Alaoglu). For $T\in\Gamma$, $\Lambda\mapsto\Lambda\circ T$ maps $K$ into $K$ (it still extends $f$ because $f\circ T=f$ on $Y$, and $\|\Lambda T\|\le\|\Lambda\|$), and these maps are affine, weak$^*$-continuous and commute. Markov–Kakutani (5.23) gives a common fixed point $\Lambda$: an invariant extension. The classical case is $X=\ell^\infty$, $Y=c$, $f=\lim$, $\Gamma$ = the shifts: the result is a **Banach limit**.`,
      caption: String.raw`Banach limits: $\Lambda$ on $\ell^\infty$ with $\|\Lambda\|=1$, $\Lambda=\lim$ on convergent sequences, and $\Lambda(Sx)=\Lambda x$ for the shift $S$. Top: a sequence $x$ (gold) and the window of length $N$ with the largest average. Bottom: the largest and smallest averages over windows of length $N$ (any position). Invariance forces every Banach limit $\Lambda x$ into the limit of this band, and every value there occurs (green bracket). For $(-1)^n$ and $\sin n$ the band collapses — $\Lambda x=0$ is forced; for long blocks of $0$s and $1$s Hahn–Banach leaves the whole interval $[0,1]$ free.`,
      deps: ['fa-5.23', 'fa-3.3', 'fa-3.15'],
      see: ['rca-5.16'],
      tags: ['Hahn–Banach', 'fixed points', 'Banach limits'],
      verify: true,
      viz(v) {
        const M = v.M;
        const LEN = 24000;
        const SEQ = {
          conv: { label: '$1+\\frac{(-1)^n}{\\sqrt{n+1}}$', x: (n) => 1 + (-1) ** n / Math.sqrt(n + 1) },
          alt: { label: '$(-1)^n$', x: (n) => (-1) ** n },
          sin: { label: '$\\sin n$', x: (n) => Math.sin(n) },
          blk: { label: 'blocks of $0$s and $1$s', x: (n) => (Math.floor(Math.log2(n + 1)) % 2 === 0 ? 1 : 0) },
        };
        const which = v.select('$x=$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const NS = v.slider('window length $N$', 1, 512, 24, { int: true, log: true });
        const top = v.stage({ x: [-2, 202], y: [-1.3, 1.3], height: 200, full: true, axes: 'box', title: 'the sequence $x_n$ (first 200 terms) and the best window of length $N$' });
        const bot = v.stage({ x: [0, Math.log(512) + 0.4], y: [-1.2, 1.2], height: 220, full: true, axes: 'box', xticks: [1, 4, 16, 64, 256, 512].map((n) => [Math.log(n), String(n)]), xlabel: 'N', title: '$\\max_k$ and $\\min_k$ of $\\frac1N\\sum_{j=k}^{k+N-1}x_j$ — the band in which every Banach limit $\\Lambda x$ must lie' });
        const cache = {};
        function prep(key) {
          if (cache[key]) return cache[key];
          const x = M.range(LEN).map(SEQ[key].x), pre = [0]; for (let i = 0; i < LEN; i++) pre.push(pre[i] + x[i]);
          const Ns = M.range(48).map((i) => Math.max(1, Math.round(Math.exp(Math.log(512) * i / 47))));
          const band = Ns.map((N) => { let lo = Infinity, hi = -Infinity, kh = 0; const kmax = key === 'conv' ? LEN - N : LEN - N; const k0 = key === 'conv' ? Math.floor(LEN / 2) : 0; for (let k = k0; k <= kmax; k++) { const a = (pre[k + N] - pre[k]) / N; if (a < lo) lo = a; if (a > hi) { hi = a; kh = k; } } return { N, lo, hi, kh }; });
          return (cache[key] = { x, pre, band });
        }
        let st = {};
        v.legend([['gold', '$x_n$', { dot: true }], ['blue', 'Cesàro means $\\frac1n\\sum_{j<n}x_j$'], ['orange', 'max / min window averages'], ['green', 'possible values of $\\Lambda x$', { area: true }]]);
        v.render(() => {
          const key = which.value, P = prep(key), N = NS.value, x = P.x;
          const ylo = Math.min(...x.slice(0, 200)), yhi = Math.max(...x.slice(0, 200));
          top.setView(null, [ylo - 0.25, yhi + 0.25]);
          // best window of length N among those starting below 200 − N (visible)
          let best = 0, bk = 0; for (let k = 0; k + N <= 200; k++) { const a = (P.pre[k + N] - P.pre[k]) / N; if (k === 0 || a > best) { best = a; bk = k; } }
          if (N <= 200) { top.vband(bk - 0.5, bk + N - 0.5, { color: 'orange', alpha: 0.13 }); top.line(bk - 0.5, best, bk + N - 0.5, best, { color: 'orange', width: 2.4 }); }
          top.dots(x.slice(0, 200).map((y, n) => [n, y]), { color: 'gold', r: 2.2 });
          top.path(M.range(200).map((n) => [n, P.pre[n + 1] / (n + 1)]), { color: 'blue', width: 2 });
          // band
          const B = P.band, lim = B[B.length - 1];
          const blo = Math.min(...B.map((b) => b.lo)), bhi = Math.max(...B.map((b) => b.hi));
          bot.setView(null, [blo - 0.12 * (bhi - blo + 0.2), bhi + 0.12 * (bhi - blo + 0.2)]);
          bot.path(B.map((b) => [Math.log(b.N), b.hi]).concat(B.slice().reverse().map((b) => [Math.log(b.N), b.lo])), { fill: 'orange', fillAlpha: 0.12, stroke: false, close: true });
          bot.path(B.map((b) => [Math.log(b.N), b.hi]), { color: 'orange', width: 2 });
          bot.path(B.map((b) => [Math.log(b.N), b.lo]), { color: 'orange', width: 2 });
          bot.vline(Math.log(N), { color: 'muted', width: 1, dash: [4, 4] });
          const xr = Math.log(512) + 0.2;
          bot.line(xr, lim.lo, xr, lim.hi, { color: 'green', width: 7, alpha: 0.7, cap: 'butt' });
          if (lim.hi - lim.lo < 0.02) bot.dot(xr, (lim.hi + lim.lo) / 2, { color: 'green', r: 5 });
          const cur = B.reduce((a, b) => (Math.abs(b.N - N) < Math.abs(a.N - N) ? b : a), B[0]);
          bot.dot(Math.log(cur.N), cur.hi, { color: 'orange', r: 4.5 }); bot.dot(Math.log(cur.N), cur.lo, { color: 'orange', r: 4.5 });
          st = { key, lo: lim.lo, hi: lim.hi, N: cur.N, clo: cur.lo, chi: cur.hi, ces: P.pre[LEN] / LEN };
        });
        v.readout(() => {
          const s = st, free = s.hi - s.lo > 0.05;
          const head = `Windows of length $${s.N}$: averages range over $[${v.fix(s.clo, 3)},\\,${v.fix(s.chi, 3)}]$; at $N=512$: $[${v.fix(s.lo, 3)},\\,${v.fix(s.hi, 3)}]$. `;
          if (s.key === 'conv') return head + 'The sequence converges to $1$, and every Banach limit extends $\\lim$: the band collapses onto $\\Lambda x=1$.';
          return head + (free ? 'Shift-invariance only confines $\\Lambda x$ to this interval, and Hahn–Banach (with the sublinear functional $p(x)=\\lim_N\\sup_k\\frac1N\\sum_{j=k}^{k+N-1}x_j$) realises every value in it.' : s.key === 'alt' ? 'Invariance alone pins down $\\Lambda x=0$: here $x+Sx=0$, so $2\\Lambda x=\\Lambda x+\\Lambda Sx=0$.' : 'All long windows average to nearly $0$ ($\\sin n$ is almost convergent), so every Banach limit has $\\Lambda x=0$ although $x$ does not converge.');
        });
      },
    },
    {
      num: '5.25',
      kind: 'Definition',
      name: 'Noncontracting families of maps',
      statement: String.raw`Let $Q$ be a subset of a locally convex space $X$. A collection $\mathscr S$ of maps of $Q$ into $Q$ is **noncontracting** if, whenever $x\ne y$ in $Q$, the point $0$ does not lie in the closure of $\{Tx-Ty:T\in\mathscr S\}$; equivalently, there is a continuous seminorm $p$ on $X$ with $\inf_{T\in\mathscr S}p(Tx-Ty)>0$.`,
      idea: String.raw`A group of isometries of a normed space is noncontracting ($\|Tx-Ty\|=\|x-y\|$), and so is any equicontinuous group (the inverses cannot shrink differences that the maps would have to expand back). Constant maps, or contractions toward a point, are the typical contracting families — and they can easily lack a common fixed point.`,
      deps: [],
      tags: ['fixed points', 'semigroups'],
      verify: true,
    },
    {
      num: '5.26',
      kind: 'Lemma',
      name: 'Small slices of separable weakly compact convex sets',
      statement: String.raw`Let $K$ be a nonempty, weakly compact, convex set in a locally convex space $X$ that is separable (in the original topology), let $p$ be a continuous seminorm on $X$, and let $\eps>0$. Then $K$ contains a closed convex set $K_1\ne K$ such that $p(x-y)<\eps$ for all $x,y\in K\setminus K_1$.`,
      idea: String.raw`Let $E$ be the weak closure of the set of extreme points of $K$: it is weakly compact, and $K=\overline{\co}(E)$ by Krein–Milman (3.23). Separability covers $E$ by countably many weakly closed $p$-balls of radius $\eps/4$, so by Baire's theorem one of them, $B$, meets $E$ in a relatively weakly open nonempty set. Put $K_1=\overline{\co}(E\setminus B)$ and $K_2=\overline{\co}(E\cap B)$; Milman's theorem (3.25) shows $K_1\ne K$, and a convex-combination estimate shows that points of $K$ outside a slightly enlarged $K_1$ lie within $\eps/2$ of $K_2$, whose $p$-diameter is at most $\eps/2$.`,
      caption: String.raw`The planar version of "shaving off a small cap". Drag the direction $u$ around $K$ and choose $\eps$: $K_1=K\cap\{\langle u,x\rangle\le h_K(u)-\eta\}$, and $\eta^*(u)$ is the deepest cut whose cap $K\setminus K_1$ has diameter $<\eps$. The right panel plots $\eta^*$ for every direction: it is positive everywhere for the ellipse, and drops to $0$ exactly at the edge normals of a polygon, where every cap contains a whole edge. (In infinite dimensions the unit ball of $L^1$ has no small slices at all; weak compactness is what rules this out.)`,
      deps: ['fa-3.23', 'fa-3.25', 'fa-2.2'],
      tags: ['convexity', 'extreme points', 'dentability'],
      verify: true,
      viz(v) {
        const M = v.M;
        const SH = {
          poly: { label: 'polygon', P: [[1.25, -0.2], [0.9, 0.75], [-0.1, 0.95], [-1.05, 0.35], [-0.95, -0.6], [0.2, -0.9]] },
          ell: { label: 'ellipse', P: M.range(240).map((i) => [1.2 * Math.cos(M.TAU * i / 240), 0.8 * Math.sin(M.TAU * i / 240)]) },
          dee: { label: 'half-disc', P: M.range(121).map((i) => [Math.cos(Math.PI * i / 120 - Math.PI / 2), Math.sin(Math.PI * i / 120 - Math.PI / 2)]).map(([x, y]) => [x * 1.1 - 0.35, y]) },
        };
        const which = v.select('$K$', Object.entries(SH).map(([value, o]) => ({ value, label: o.label })), 'poly');
        const eS = v.slider('$\\varepsilon$', 0.1, 1.2, 0.7, { step: 0.01 });
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.45, 1.45], equal: true, height: 330, axes: false, title: '$K$, the direction $u$, and the cap $K\\setminus K_1$' });
        const R = v.stage({ x: [0, M.TAU], y: [0, 1], height: 330, axes: 'box', xticks: XT, title: 'deepest admissible cut $\\eta^*(u)$ for every direction $u=e^{i\\phi}$' });
        const uh = L.handle(1.45 * Math.cos(0.5), 1.45 * Math.sin(0.5), { color: 'accent', label: 'u', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [1.45 * x / r, 1.45 * y / r]; } });
        const hK = (P, u) => Math.max(...P.map((q) => d2(q, u)));
        const capOf = (P, u, eta) => clipHalf(P, [-u[0], -u[1]], -(hK(P, u) - eta));
        function etaStar(P, u, eps) {
          const width = hK(P, u) + hK(P, [-u[0], -u[1]]);
          if (diam(capOf(P, u, 1e-7)) >= eps) return 0;
          let lo = 0, hi = width; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (diam(capOf(P, u, m)) < eps) lo = m; else hi = m; }
          return lo;
        }
        const cache = {};
        const profile = (key, eps) => { const k = `${key}|${eps}`; if (cache[k]) return cache[k]; const P = ccw(SH[key].P); return (cache[k] = M.range(361).map((i) => { const ph = M.TAU * i / 360; return [ph, etaStar(P, [Math.cos(ph), Math.sin(ph)], eps)]; })); };
        let st = {};
        v.legend([['blue', '$K$', { area: true }], ['green', 'the cap $K\\setminus K_1$, diameter $<\\varepsilon$', { area: true }], ['orange', 'the cut $\\langle u,x\\rangle=h_K(u)-\\eta^*$']]);
        v.render(() => {
          const key = which.value, P = ccw(SH[key].P), eps = eS.value;
          const ph = Math.atan2(uh.y, uh.x), u = [Math.cos(ph), Math.sin(ph)];
          const eta = etaStar(P, u, eps), h = hK(P, u);
          L.poly(P, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.14 });
          const cap = capOf(P, u, Math.max(eta, 1e-9));
          if (eta > 0 && cap.length >= 2) L.poly(cap, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.35 });
          const c0 = [u[0] * (h - eta), u[1] * (h - eta)], tg = [-u[1], u[0]];
          L.line(c0[0] - 3 * tg[0], c0[1] - 3 * tg[1], c0[0] + 3 * tg[0], c0[1] + 3 * tg[1], { color: 'orange', width: 1.8, dash: [6, 4] });
          L.arrow(0, 0, 1.3 * u[0], 1.3 * u[1], { color: 'accent', width: 1.4, head: 8 });
          if (eta === 0) { const face = P.filter((q) => d2(q, u) > h - 1e-6); L.corner(`every cap contains a face of length ${v.fix(diam(face.length > 1 ? face : capOf(P, u, 1e-7)), 2)} ≥ ε`, 'tl', { color: 'red', weight: 600 }); }
          else L.corner(`η* = ${v.fix(eta, 3)}, cap diameter < ${v.fix(eps, 2)}`, 'tl', { color: 'green', weight: 600 });
          const prof = profile(key, eps);
          const hi = Math.max(0.2, ...prof.map((q) => q[1])) * 1.12;
          R.setView(null, [0, hi]);
          R.path(prof.concat([[M.TAU, 0], [0, 0]]), { fill: 'green', fillAlpha: 0.15, stroke: false, close: true });
          R.path(prof, { color: 'green', width: 2 });
          const phm = M.mod(ph, M.TAU);
          R.vline(phm, { color: 'accent', width: 1.2, dash: [4, 4] });
          R.dot(phm, eta, { color: eta > 0 ? 'green' : 'red', r: 5 });
          st = { eta, eps, mn: Math.min(...prof.map((q) => q[1])), key };
        });
        v.readout(() => (st.eta > 0 ? `In direction $u$ a cut of depth $\\eta^*=${v.fix(st.eta, 4)}$ leaves a closed convex $K_1\\ne K$ whose complement in $K$ has diameter $<\\varepsilon=${v.fix(st.eps, 2)}$ — the conclusion of 5.26.` : `In this direction every cap contains a whole face, so no cut works; but other directions do (the green profile), so a suitable $K_1$ still exists.`) + (st.key === 'ell' ? ' For the ellipse every boundary point is exposed and $\\eta^*$ stays bounded below.' : ` Near the normals of flat edges $\\eta^*$ drops towards $0$ (smallest sampled value $${v.fix(st.mn, 4)}$).`));
      },
    },
    {
      num: '5.28',
      kind: 'Theorem',
      name: 'Ryll-Nardzewski fixed point theorem',
      statement: String.raw`Let $Q$ be a nonempty weakly compact convex set in a locally convex space $X$, and let $\mathscr S$ be a noncontracting semigroup of weakly continuous affine maps of $Q$ into $Q$. Then there is $p\in Q$ with $Tp=p$ for every $T\in\mathscr S$.`,
      idea: String.raw`Fixed-point sets are weakly compact, so it suffices to treat finitely many $T_1,\dots,T_n\in\mathscr S$. Their average $T_0=\frac1n\sum T_i$ is affine and weakly continuous, so Markov–Kakutani (5.23, in the weak topology) gives $x_0$ with $T_0x_0=x_0$. Suppose some $T_ix_0\ne x_0$; noncontraction gives a seminorm $p$ and $\eps>0$ with $p(ST_ix_0-Sx_0)\ge\eps$ for all $S$ in the (countable) semigroup generated by the $T_i$. Apply 5.26 to the weakly closed convex hull $K$ of the orbit $\{Sx_0\}$ (separable): some $Sx_0$ lies in the small cap $K\setminus K_1$, and $Sx_0=\frac1n\sum ST_ix_0$ forces one $ST_ix_0$ with $T_ix_0\ne x_0$ into that cap too — within $\eps$ of $Sx_0$, a contradiction.`,
      caption: String.raw`$Q$ = a regular hexagon in $\R^2$. With the isometries $T_1$ (rotation by $60^\circ$) and $T_2$ (a reflection) the semigroup is noncontracting: drag $x,y$ and see that $\inf_T|Tx-Ty|=|x-y|$ over all words (gold and purple orbits). The fixed point $x_0$ of $T_0=\frac12(T_1+T_2)$ (green ring) is then fixed by $T_1$ and $T_2$ separately. Switch to two contractions toward different points: the semigroup contracts ($\inf_T|Tx-Ty|=0$), $T_0$ still has a fixed point, but it is not fixed by $T_1$ or $T_2$ — and there is no common fixed point.`,
      deps: ['fa-5.23', 'fa-5.25', 'fa-5.26'],
      tags: ['fixed points', 'weak topology', 'semigroups'],
      verify: true,
      viz(v) {
        const M = v.M;
        const HEX = M.range(6).map((j) => [Math.cos(M.TAU * j / 6), Math.sin(M.TAU * j / 6)]);
        const A = [0.55, 0.5], B = [-0.6, -0.3];
        const MODES = {
          iso: { label: 'isometries: rotation and reflection', T: [(p) => [0.5 * p[0] - Math.sqrt(3) / 2 * p[1], Math.sqrt(3) / 2 * p[0] + 0.5 * p[1]], (p) => [p[0], -p[1]]], ok: true },
          con: { label: 'contractions toward $a$ and $b$', T: [(p) => [(p[0] + A[0]) / 2, (p[1] + A[1]) / 2], (p) => [(p[0] + B[0]) / 2, (p[1] + B[1]) / 2]], ok: false },
        };
        const which = v.select('$\\mathscr S$ generated by', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'iso');
        const LS = v.slider('word length $\\le$', 1, 6, 4, { int: true });
        const S = v.stage({ x: [-1.5, 1.5], y: [-1.15, 1.15], equal: true, height: 380, axes: false });
        const inQ = (x, y) => (M.pointInPoly([x, y], HEX) ? [x, y] : M.closestOnConvexPoly([x, y], HEX));
        const xh = S.handle(0.5, 0.2, { color: 'gold', label: 'x', constrain: inQ });
        const yh = S.handle(-0.1, -0.45, { color: 'purple', label: 'y', constrain: inQ });
        let st = {};
        v.legend([['blue', '$Q$', { area: true }], ['gold', 'orbit of $x$', { dot: true }], ['purple', 'orbit of $y$', { dot: true }], ['green', 'fixed point of $T_0=\\frac12(T_1+T_2)$'], ['red', 'where $T_1,T_2$ move it']]);
        v.render(() => {
          const Mo = MODES[which.value], Lw = LS.value;
          S.poly(HEX, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.12 });
          if (which.value === 'con') { S.dot(A[0], A[1], { color: 'ink', r: 3, label: 'a', labelPos: 'ne' }); S.dot(B[0], B[1], { color: 'ink', r: 3, label: 'b', labelPos: 'sw' }); }
          // all words of length ≤ Lw applied to x and y
          let fr = [[[xh.x, xh.y], [yh.x, yh.y]]], all = fr.slice(), minD = Math.hypot(xh.x - yh.x, xh.y - yh.y);
          for (let l = 1; l <= Lw; l++) { const nx = []; for (const [p, q] of fr) for (const T of Mo.T) { const a = T(p), b = T(q); nx.push([a, b]); minD = Math.min(minD, Math.hypot(a[0] - b[0], a[1] - b[1])); } fr = nx; all = all.concat(nx); }
          S.dots(all.map((w) => w[0]), { color: 'gold', r: 2.6, alpha: 0.85 });
          S.dots(all.map((w) => w[1]), { color: 'purple', r: 2.6, alpha: 0.85 });
          if (which.value === 'con') { const last = fr[0]; S.line(last[0][0], last[0][1], last[1][0], last[1][1], { color: 'red', width: 1.6 }); }
          // fixed point of T0 by iteration
          let z = [0.3, 0.1]; for (let k = 0; k < 200; k++) { const a = Mo.T[0](z), b = Mo.T[1](z); z = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
          const t1 = Mo.T[0](z), t2 = Mo.T[1](z), m1 = Math.hypot(t1[0] - z[0], t1[1] - z[1]), m2 = Math.hypot(t2[0] - z[0], t2[1] - z[1]);
          if (m1 > 1e-6) S.arrow(z[0], z[1], t1[0], t1[1], { color: 'red', width: 2 });
          if (m2 > 1e-6) S.arrow(z[0], z[1], t2[0], t2[1], { color: 'red', width: 2 });
          if (m1 > 1e-6) S.text('T₁x₀', t1[0], t1[1], { color: 'red', dy: -12, align: 'center', size: 12 });
          if (m2 > 1e-6) S.text('T₂x₀', t2[0], t2[1], { color: 'red', dy: 12, align: 'center', size: 12 });
          S.dot(z[0], z[1], { color: 'green', r: 8, hollow: true, width: 2.4, label: 'x₀', labelPos: 'nw' });
          S.corner(Mo.ok ? `inf |Tx − Ty| = ${v.fix(minD, 3)} > 0: noncontracting` : `inf |Tx − Ty| = ${v.fix(minD, 4)} → 0: contracting`, 'tl', { color: Mo.ok ? 'green' : 'red', weight: 600 });
          st = { m1, m2, minD, d: Math.hypot(xh.x - yh.x, xh.y - yh.y), ok: Mo.ok, n: all.length };
        });
        v.readout(() => `Over ${st.n} words: $\\min|Tx-Ty|=${v.fix(st.minD, 4)}$ (with $|x-y|=${v.fix(st.d, 4)}$). For the fixed point $x_0$ of $T_0$: $|T_1x_0-x_0|=${v.fix(st.m1, 4)}$, $|T_2x_0-x_0|=${v.fix(st.m2, 4)}$. ` + (st.ok ? 'Noncontracting, so $x_0$ is a common fixed point, as Ryll-Nardzewski asserts.' : 'The semigroup contracts, the averaging trick breaks down, and $T_1$, $T_2$ have no common fixed point ($a\\ne b$).'));
      },
    },
  ],
};
