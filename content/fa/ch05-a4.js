// Rudin, Functional Analysis — Chapter 5 (part 4): uncomplemented subspaces

// ---------------------------------------------------------------- helpers
const XT = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [2 * Math.PI, '2π']];
/** Spectral norm of a complex matrix A (rows of [re, im]) by power iteration on A*A. */
function specNorm(A, it = 60) {
  const n = A[0].length; let x = Array.from({ length: n }, (_, i) => [1 / Math.sqrt(n), 0.3 * Math.sin(i) / Math.sqrt(n)]), s = 0;
  for (let k = 0; k < it; k++) {
    const y = A.map((r) => r.reduce((t, a, j) => [t[0] + a[0] * x[j][0] - a[1] * x[j][1], t[1] + a[0] * x[j][1] + a[1] * x[j][0]], [0, 0]));
    const z = Array.from({ length: n }, () => [0, 0]);
    A.forEach((r, i) => r.forEach((a, j) => { z[j][0] += a[0] * y[i][0] + a[1] * y[i][1]; z[j][1] += a[0] * y[i][1] - a[1] * y[i][0]; }));
    const nz = Math.sqrt(z.reduce((t, w) => t + w[0] * w[0] + w[1] * w[1], 0)); if (nz < 1e-300) return 0;
    s = Math.sqrt(nz); x = z.map((w) => [w[0] / nz, w[1] / nz]);
  }
  return s;
}

export default {
  collection: 'fa',
  chapter: 5,
  items: [
    {
      num: '5.15',
      kind: 'Definition',
      name: 'Projections',
      statement: String.raw`A **projection** in a topological vector space $X$ is a continuous linear map $P:X\to X$ with $P^2=P$. Its range $R(P)=\{x:Px=x\}$ and null space $N(P)$ are closed subspaces with $R(P)\cap N(P)=\{0\}$ and $R(P)+N(P)=X$; in particular $R(P)$ is complemented in $X$ (4.20), with complement $N(P)=R(I-P)$.`,
      idea: String.raw`Every $x$ splits as $x=Px+(x-Px)$ with $Px\in R(P)$ and $x-Px\in N(P)$, and $R(P)=N(I-P)$ is closed because $I-P$ is continuous. The question of this section is the converse: is every closed subspace the range of a projection? In a Hilbert space yes (orthogonal projection); in general no.`,
      deps: ['fa-4.20'],
      tags: ['projections', 'complemented subspaces'],
      verify: true,
    },
    {
      num: '5.16',
      kind: 'Theorem',
      name: 'Complemented subspaces are exactly ranges of projections',
      statement: String.raw`(a) If $P$ is a projection in a topological vector space $X$, then $X=R(P)\oplus N(P)$ with both summands closed.
(b) Conversely, let $X$ be an $F$-space and $X=A\oplus B$ with $A$, $B$ closed subspaces ($A\cap B=\{0\}$, $A+B=X$). Then the map $P(a+b)=a$ $(a\in A,\,b\in B)$ is continuous, so it is a projection with range $A$ and null space $B$.

Thus a closed subspace of an $F$-space is complemented if and only if it is the range of a continuous projection.`,
      idea: String.raw`(a) is algebra plus continuity of $P$ and $I-P$. For (b), $P$ is linear and everywhere defined; its graph is closed: if $x_n\to x$ and $Px_n\to y$, then $y\in A$ ($A$ closed) and $x_n-Px_n\to x-y\in B$ ($B$ closed), so $x=y+(x-y)$ is the decomposition of $x$ and $y=Px$. The closed graph theorem (2.15) finishes. Completeness matters: the "angle" between $A$ and $B$ must stay away from $0$, which is what $\|P\|<\infty$ measures.`,
      caption: String.raw`Left: one copy of $\R^2$ with the lines $A$ and $B$ at angle $\theta$; drag $x$ to see $x=Px+(x-Px)$, and note that $P$ maps the unit disc onto a segment of half-length $\|P\|=1/\sin\theta$. Right: $X=\ell^2$ as an orthogonal sum of such planes, $A=\bigoplus A_k$, $B=\bigoplus B_k$, both closed with $A\cap B=\{0\}$. If the angles $\theta_k$ stay away from $0$ the block norms are bounded, $A+B=X$ and $P$ is a projection; if $\theta_k\to0$ they are not — then $A+B$ is a dense, non-closed subspace and $A$ is **not** complemented by $B$.`,
      deps: ['fa-5.15', 'fa-2.15'],
      tags: ['projections', 'closed graph theorem', 'complemented subspaces'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('angles $\\theta_k$', [{ value: 'fix', label: '$\\theta_k=\\theta$ (bounded below)' }, { value: 'dec', label: '$\\theta_k=\\arctan(1/k)\\to0$' }], 'dec');
        const th0 = v.slider('$\\theta$ (first mode)', 0.08, Math.PI / 2, 0.6, { step: 0.01, fmt: (x) => `${Math.round(x * 180 / Math.PI)}°` });
        const kS = v.slider('block $k$ shown on the left', 1, 30, 3, { int: true });
        const L = v.stage({ x: [-2.4, 2.4], y: [-1.7, 1.7], equal: true, height: 340, axes: false, title: 'block $k$: $\\R^2=A_k\\oplus B_k$' });
        const R = v.stage({ x: [0.3, 30.7], y: [0, 12], height: 340, axes: 'box', xlabel: 'k', title: 'block norms $\\|P_k\\|=1/\\sin\\theta_k$' });
        const x = L.handle(0.35, 0.42, { color: 'gold', label: 'x' });
        const theta = (k) => (mode.value === 'fix' ? th0.value : Math.atan(1 / k));
        let st = {};
        v.legend([['blue', '$A_k$ and $Px$'], ['orange', '$B_k$ and $x-Px$'], ['green', '$P(\\text{unit disc})$', { area: true }], ['red', 'unbounded block norms']]);
        v.render(() => {
          const k = kS.value, t = theta(k), u = [1, 0], w = [Math.cos(t), Math.sin(t)];
          // P along B onto A:  x = a u + b w  ⇒  Px = a u
          const b = x.y / w[1], a = x.x - b * w[0];
          const nP = 1 / Math.sin(t);
          L.circle(0, 0, 1, { color: 'muted', width: 1.2, fill: 'muted', fillAlpha: 0.06 });
          L.line(-9 * u[0], 0, 9 * u[0], 0, { color: 'blue', width: 2.2 });
          L.line(-9 * w[0], -9 * w[1], 9 * w[0], 9 * w[1], { color: 'orange', width: 2.2 });
          L.line(-Math.min(nP, 2.1), 0.0, Math.min(nP, 2.1), 0, { color: 'green', width: 7, alpha: 0.55, cap: 'butt' });
          L.line(a, 0, x.x, x.y, { color: 'orange', width: 1.4, dash: [4, 4] });
          L.line(0, 0, b * w[0], b * w[1], { color: 'orange', width: 1.4, dash: [4, 4] });
          L.line(b * w[0], b * w[1], x.x, x.y, { color: 'blue', width: 1.4, dash: [4, 4] });
          L.arrow(0, 0, a, 0, { color: 'blue', width: 2.4 });
          L.arrow(0, 0, b * w[0], b * w[1], { color: 'orange', width: 2.4 });
          L.dot(a, 0, { color: 'blue', r: 4, label: 'Px', labelPos: 's' });
          L.tex('A_k', 2.0, 0.14, { color: 'blue', align: 'right' });
          L.tex('B_k', 1.25 * w[0] + 0.12, Math.min(1.55, 1.25 * w[1]), { color: 'orange', align: 'left' });
          L.corner(`θ_${k} = ${v.fix(t * 180 / Math.PI, 1)}°,  ‖P_k‖ = ${v.fix(nP, 2)}`, 'tl', { weight: 600 });
          const norms = M.range(30, 1).map((j) => 1 / Math.sin(theta(j)));
          const hi = Math.max(4, ...norms) * 1.1;
          R.setView(null, [0, hi]);
          R.bars(norms, { x0: 1, dx: 1, color: (n, i) => (i + 1 === k ? 'blue' : mode.value === 'dec' ? 'red' : 'green'), barWidth: 0.62 });
          R.corner(mode.value === 'dec' ? 'sup_k ‖P_k‖ = ∞: no projection, A + B not closed' : `sup_k ‖P_k‖ = ${v.fix(1 / Math.sin(th0.value), 2)}: P is a projection`, 'tl', { color: mode.value === 'dec' ? 'red' : 'green', weight: 600 });
          st = { k, nP, a, b, dec: mode.value === 'dec' };
        });
        v.readout(() => `$x=Px+(x-Px)$ with $Px=${v.fix(st.a, 3)}\\,e_A$ and $x-Px=${v.fix(st.b, 3)}\\,e_B$; $\\|P_{${st.k}}\\|=${v.fix(st.nP, 3)}$. ` + (st.dec ? 'Here $\\sin\\theta_k=1/\\sqrt{1+k^2}$. The vector $x=\\sum_k k^{-1}e_k^{\\perp}$ ($e_k^\\perp\\perp A_k$ in block $k$) lies in $\\ell^2$, but its $B$-components have size $\\sqrt{1+k^2}/k\\ge1$, so $x\\notin A+B$; by 5.16(b) a closed complement would force $\\sup_k\\|P_k\\|<\\infty$.' : 'The angles stay away from $0$, so $P=\\bigoplus P_k$ is bounded with $\\|P\\|=1/\\sin\\theta$ — a continuous projection, as 5.16 predicts for a closed decomposition.'));
      },
    },
    {
      num: '5.17',
      kind: 'Theorem',
      name: 'c₀ is not complemented in ℓ^∞ (Phillips)',
      statement: String.raw`There is no continuous projection of $\ell^\infty$ onto $c_0$; that is, $c_0$ is not a complemented subspace of $\ell^\infty$.`,
      idea: String.raw`*Lemma*: a countable set $S$ has an uncountable family of infinite subsets with pairwise finite intersections (take $S$ = the rationals and, for each irrational $x$, a sequence of rationals converging to $x$; or, in the binary tree, the branches). Now suppose $Q:\ell^\infty\to\ell^\infty$ is bounded with $Q(c_0)=0$ (e.g. $Q=I-P$). Fix a coordinate $n$ and $\eps>0$. If $Q\chi_{A_1},\dots,Q\chi_{A_k}$ all have $n$-th coordinate of modulus $\ge\eps$, choose unimodular $c_i$ making them positive; $y=\sum c_i\chi_{A_i}$ differs from a vector of norm $\le1$ by a finitely supported one, so $k\eps\le|(Qy)(n)|\le\|Q\|$. Hence only countably many members $A$ of the family have $Q\chi_A\ne0$; for the others $Q\chi_A=0$, although $\chi_A\notin c_0$. So $Q\ne I-P$ for any projection $P$ onto $c_0$.`,
      caption: String.raw`$\N$ realised as the nodes of the binary tree (drawn to depth $9$); each $x\in(0,1)$ gives the branch $A_x$ of prefixes of its binary expansion — uncountably many infinite sets, any two meeting only in a common initial segment. Drag the branch points on the bottom axis. The lower panel shows $y=\sum_i\chi_{A_i}$ (all $c_i=1$, the worst case): $|y|$ reaches $k$ only near the root, and from the last splitting depth on it is at most $1$. Modulo $c_0$ the sum of $k$ branches has norm $1$, which is what bounds the number of branches any $Q$ vanishing on $c_0$ can see.`,
      deps: ['fa-5.16'],
      tags: ['complemented subspaces', 'sequence spaces'],
      verify: true,
      viz(v) {
        const M = v.M;
        const D = 9;
        const kS = v.select('number of branches $k$', [2, 3, 4, 5, 6].map((k) => ({ value: k, label: String(k) })), 4);
        const T = v.stage({ x: [-0.03, 1.03], y: [-1.3, D + 0.6], height: 330, full: true, axes: false, title: 'the binary tree ($=\\N$) and the branches $A_{x_i}$' });
        const B = v.stage({ x: [-0.5, D + 0.5], y: [-0.6, 7], height: 170, full: true, axes: 'box', xticks: M.range(D + 1), title: '$\\max|y|$ over the nodes of each depth $0,1,\\dots,9$, where $y=\\sum_i\\chi_{A_{x_i}}$' });
        const X0 = [0.12, 0.31, 0.47, 0.66, 0.83, 0.93];
        const COLS = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold'];
        const hs = X0.map((x, i) => T.handle(x, -0.85, { color: COLS[i], constrain: (xx) => [M.clamp(xx, 0.001, 0.999), -0.85] }));
        // node at depth d with index j (0 ≤ j < 2^d) sits at x = (j + 0.5)/2^d, y = D − d
        const node = (x, d) => Math.min((1 << d) - 1, Math.floor(x * (1 << d)));
        let st = {};
        v.legend([['muted', 'nodes of the tree (the index set $\\N$)', { dot: true }], ['blue', 'branches $A_{x_i}$ (one colour each)'], ['red', 'nodes shared by several branches', { dot: true }]]);
        v.render(() => {
          const k = kS.value; hs.forEach((h, i) => { h.visible = i < k; });
          const xs = hs.slice(0, k).map((h) => h.x);
          // faint tree
          for (let d = 0; d < D; d++) for (let j = 0; j < 1 << d; j++) { const px = (j + 0.5) / (1 << d); T.line(px, D - d, (2 * j + 0.5) / (1 << (d + 1)), D - d - 1, { color: 'grid', width: 1 }); T.line(px, D - d, (2 * j + 1.5) / (1 << (d + 1)), D - d - 1, { color: 'grid', width: 1 }); }
          const pts = []; for (let d = 0; d <= D; d++) for (let j = 0; j < 1 << d; j++) pts.push([(j + 0.5) / (1 << d), D - d]);
          T.dots(pts, { color: 'faint', r: 1.6 });
          // branches
          xs.forEach((x, i) => {
            const path = M.range(D + 1).map((d) => [(node(x, d) + 0.5) / (1 << d), D - d]);
            T.path(path, { color: COLS[i], width: 2.6, alpha: 0.85 });
            T.line(path[D][0], 0, x, -0.85, { color: COLS[i], width: 1, dash: [3, 3] });
          });
          let split = 0;
          for (let d = 0; d <= D; d++) {
            const shared = new Map(); xs.forEach((x) => { const j = node(x, d); shared.set(j, (shared.get(j) || 0) + 1); });
            for (const [j, c] of shared) if (c > 1) { T.dot((j + 0.5) / (1 << d), D - d, { color: 'red', r: 3 + c }); split = d + 1; }
          }
          T.text('0', 0, -0.85, { size: 10.5, color: 'muted', align: 'left', dx: 4 }); T.text('1', 1, -0.85, { size: 10.5, color: 'muted', align: 'right', dx: -4 });
          // the sign-alternating sum |y| per depth
          const shared = M.range(D + 1).map((d) => { const m = new Map(); xs.forEach((x) => { const j = node(x, d); m.set(j, (m.get(j) || 0) + 1); }); return Math.max(...m.values()); });
          B.setView(null, [-0.45 * (k + 1) / 7 * 1.6, k + 1]);
          B.bars(shared, { x0: 0, dx: 1, color: (c) => (c > 1 ? 'red' : 'green'), barWidth: 0.6 });
          B.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          B.corner(split <= D ? `from depth ${split} on: |y| ≤ 1` : 'branches agree to depth > 9 — move them apart', 'tr', { color: split <= D ? 'green' : 'red', weight: 600 });
          st = { k, split, xs };
        });
        v.readout(() => `${st.k} branches: $\\|y\\|_\\infty=${st.k}$ (at the root), but $y$ agrees with a vector of norm $\\le1$ outside the finitely many nodes of depth $<${st.split}$, so $\\operatorname{dist}(y,c_0)\\le1$. Hence if $Q(c_0)=0$ and $|(Q\\chi_{A_{x_i}})(n)|\\ge\\eps$ for all $i$, then $k\\eps\\le\\|Q\\|$ — whatever $k$ is.`);
      },
    },
    {
      num: '5.18',
      kind: 'Theorem',
      name: 'Averaging a projection over a compact group',
      statement: String.raw`Suppose
(a) $X$ is a Fréchet space and $Y$ is a closed subspace of $X$;
(b) $G$ is a compact group with Haar measure $m$;
(c) $s\mapsto T_s$ is a homomorphism of $G$ into the continuous linear operators on $X$ such that $s\mapsto T_sx$ is continuous for every $x\in X$;
(d) $T_s(Y)\subset Y$ for every $s\in G$;
(e) $P$ is a continuous projection of $X$ onto $Y$.
Then $Qx=\int_G T_s^{-1}PT_sx\,dm(s)$ defines a continuous projection $Q$ of $X$ onto $Y$ that commutes with every $T_s$.`,
      idea: String.raw`The integrand $s\mapsto T_{s^{-1}}PT_sx$ is continuous, so the vector integral exists (3.27). Banach–Steinhaus (2.6) makes $\{T_s\}$ equicontinuous, so $Q$ is continuous. For $y\in Y$, $T_sy\in Y$, hence $PT_sy=T_sy$ and the integrand is $y$: $Qy=y$. The integrand always lies in $Y$, so $Q(X)\subset Y$. Finally the invariance of $m$ (5.14) gives $T_t^{-1}QT_t=\int T_{(st)}^{-1}PT_{st}\,dm(s)=Q$. In a Banach space with isometric $T_s$, also $\|Q\|\le\|P\|$.`,
      caption: String.raw`$X$ = trigonometric polynomials of degree $\le6$ (coordinates $\hat f(-6),\dots,\hat f(6)$), $G=\T$ acting by rotations $T_s$, so $T_s$ is diagonal with entries $e^{ins}$; $Y=\{\hat f(n)=0\text{ for }n<0\}$. Start from a non-invariant projection $P$ onto $Y$ (identity on $Y$ plus junk carried from negative to non-negative frequencies). Averaging $T_s^{-1}PT_s$ over $K$ rotations multiplies the $(m,n)$ entry by the average of $e^{i(n-m)s}$, which kills the junk. Left: $|Q_K|$ entry-wise. Right: the commutator norm $\max_s\|T_sQ_K-Q_KT_s\|$ (red) and $\|Q_K\|$ (blue) against $K$.`,
      deps: ['fa-5.14', 'fa-3.27', 'fa-2.6', 'fa-5.16'],
      tags: ['projections', 'Haar measure', 'averaging'],
      verify: true,
      viz(v) {
        const M = v.M;
        const N = 6, D = 2 * N + 1, freq = M.range(D).map((i) => i - N), inY = (n) => n >= 0;
        const r = v.rng(11);
        const P = freq.map((m) => freq.map((n) => {
          if (m === n) return [inY(n) ? 1 : 0, 0];
          if (inY(m) && !inY(n)) return [r.uniform(-0.55, 0.55), r.uniform(-0.55, 0.55)];
          return [0, 0];
        }));
        const how = v.select('rotations $s_j$', [{ value: 'eq', label: 'equally spaced $2\\pi j/K$' }, { value: 'rnd', label: 'random' }], 'rnd');
        const KS = v.slider('number $K$ of rotations averaged', 1, 40, 6, { int: true });
        const L = v.stage({ x: [-1.6, D + 0.3], y: [-0.3, D + 1.4], equal: true, height: 360, axes: false, title: '$|(Q_K)_{mn}|$, $\\;Q_K=\\frac1K\\sum_j T_{s_j}^{-1}PT_{s_j}$' });
        const R = v.stage({ x: [0.3, 40.7], y: [0, 2], height: 360, axes: 'box', xlabel: 'K', title: 'non-invariance and size of $Q_K$' });
        const rs = v.rng(5), RND = M.range(40).map(() => rs.uniform(0, M.TAU));
        const sAt = (j, K) => (how.value === 'eq' ? M.TAU * j / K : RND[j]);
        function QK(K) {
          return freq.map((m, a) => freq.map((n, b) => {
            let re = 0, im = 0; for (let j = 0; j < K; j++) { const t = (n - m) * sAt(j, K); re += Math.cos(t); im += Math.sin(t); }
            re /= K; im /= K; const p = P[a][b]; return [p[0] * re - p[1] * im, p[0] * im + p[1] * re];
          }));
        }
        function comm(Q) { // max over a grid of s of ‖T_s Q − Q T_s‖: entries Q_mn (e^{ims} − e^{ins})
          let w = 0; for (let k = 1; k <= 12; k++) { const s = M.TAU * k / 25; w = Math.max(w, specNorm(Q.map((row, a) => row.map((q, b) => { const c = Math.cos(freq[a] * s) - Math.cos(freq[b] * s), d = Math.sin(freq[a] * s) - Math.sin(freq[b] * s); return [q[0] * c - q[1] * d, q[0] * d + q[1] * c]; })), 30)); }
          return w;
        }
        const cache = {};
        const curve = (key) => cache[key] || (cache[key] = M.range(40, 1).map((K) => { const Q = QK(K); return { K, c: comm(Q), n: specNorm(Q) }; }));
        const nP = specNorm(P);
        let st = {};
        v.legend([['blue', 'entries of $Q_K$ (junk off the diagonal); $\\|Q_K\\|$'], ['orange', 'the block $Y\\to Y$', { dash: true }], ['red', '$\\max_s\\|T_sQ_K-Q_KT_s\\|$'], ['gold', '$\\|P\\|$', { dash: true }], ['green', '$\\|Q\\|=1$: the Riesz projection', { dash: true }]]);
        v.render(() => {
          const K = KS.value, Q = QK(K);
          for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) {
            const t = Math.min(1, Math.hypot(...Q[a][b]));
            L.rect(b, D - a - 1, b + 0.92, D - a - 0.08, { fill: v.mix('panel', a === b ? 'green' : 'blue', 0.06 + 0.94 * Math.sqrt(t)), fillAlpha: 1, stroke: false });
          }
          L.rect(N - 0.04, -0.04, D - 0.04, N + 0.96, { color: 'orange', width: 1.6, dash: [5, 4] });
          for (const n of [-6, -3, 0, 3, 6]) { L.text(String(n), n + N + 0.46, D + 0.45, { size: 10.5, color: 'muted', align: 'center' }); L.text(String(n), -0.6, D - (n + N) - 0.54, { size: 10.5, color: 'muted', align: 'center' }); }
          L.text('n →', D - 0.2, D + 1.05, { size: 10.5, color: 'muted', align: 'right' });
          L.text('m ↓', -0.6, D + 1.05, { size: 10.5, color: 'muted', align: 'center' });
          const C = curve(how.value);
          R.setView(null, [0, Math.max(2, nP * 1.15, ...C.map((c) => c.c)) ]);
          R.hline(nP, { color: 'gold', width: 1.5, dash: [6, 4] });
          R.hline(1, { color: 'green', width: 1.5, dash: [6, 4] });
          R.path(C.map((c) => [c.K, c.c]), { color: 'red', width: 2.2 });
          R.path(C.map((c) => [c.K, c.n]), { color: 'blue', width: 2.2 });
          R.dot(K, C[K - 1].c, { color: 'red', r: 5 }); R.dot(K, C[K - 1].n, { color: 'blue', r: 5 });
          R.text('‖P‖', 40.5, nP, { align: 'right', dy: -9, color: 'gold', size: 11.5 });
          st = { K, c: C[K - 1].c, n: C[K - 1].n, eq: how.value === 'eq' };
        });
        v.readout(() => `$K=${st.K}$: $\\max_s\\|T_sQ_K-Q_KT_s\\|=${v.fix(st.c, 4)}$, $\\|Q_K\\|=${v.fix(st.n, 4)}$ (and $\\|P\\|=${v.fix(nP, 3)}$). Every $Q_K$ is still a projection onto $Y$ (identity on $Y$, range in $Y$); ` + (st.eq ? `with equally spaced rotations the average is exact as soon as $K>12$: $Q$ is the diagonal $0/1$ multiplier.` : 'with random rotations the junk decays like $K^{-1/2}$; the exact Haar average $\\int_\\T$ gives the invariant projection $Q$.'));
      },
    },
    {
      num: '5.19',
      kind: 'Theorem',
      name: 'Invariant projections on L¹(T) and C(T) are idempotent multipliers',
      statement: String.raw`Let $X$ be $L^1(\T)$ or $C(\T)$, and let $Y$ be a closed translation-invariant subspace of $X$, with spectrum $E=\{n\in\Z:e^{in\theta}\in Y\}$. If $Y$ is complemented in $X$, then there is a measure $\mu\in M(\T)$ with $\hat\mu(n)=1$ for $n\in E$ and $\hat\mu(n)=0$ for $n\notin E$, and $f\mapsto\mu*f$ is a continuous projection of $X$ onto $Y$ that commutes with translations.`,
      idea: String.raw`Average a given projection over the circle group with 5.18 to get a projection $Q$ commuting with all rotations. Then $Qe_n$ is a multiple of $e_n$ ($e_n(\theta)=e^{in\theta}$), equal to $e_n$ for $n\in E$ and to $0$ otherwise, since $Q$ maps onto $Y$ and $Ye_n\cap\C e_n=\{0\}$ off $E$. The functional $f\mapsto(Qf)(0)$ (after smoothing in the $L^1$ case) is given by a measure, and translation-invariance makes $Q$ convolution with it; comparing Fourier coefficients, $\hat\mu=\chi_E$.`,
      caption: String.raw`Translation-invariant projections are Fourier multipliers by a $0/1$ sequence $\chi_E$ that must be the transform of a measure. Choose $E$ and a test function $f$. Top: $f$ and $\mu*f$. Middle: the measure $\mu$ itself (point masses as arrows, densities as curves). Bottom: $|\hat f(n)|$ (faint) and the coefficients of $\mu*f$ — exactly those with $n\in E$ survive. For $E=3\Z$, $\mu*f$ is the average of $f$ over rotations by $2\pi/3$: a small instance of averaging over a compact group.`,
      deps: ['fa-5.18', 'fa-5.14', 'rca-6.19'],
      tags: ['projections', 'Fourier multipliers', 'translation invariance'],
      verify: true,
      viz(v) {
        const M = v.M;
        const ES = {
          three: { label: '$E=3\\Z$', inE: (n) => M.mod(n, 3) === 0, mu: { atoms: [0, 1, 2].map((j) => [M.TAU * j / 3, 1 / 3]) } },
          fin: { label: '$E=\\{-2,\\dots,2\\}$', inE: (n) => Math.abs(n) <= 2, mu: { dens: (t) => M.dirichlet(2, t) } },
          even: { label: '$E=\\{0,\\pm2,\\pm4\\}$', inE: (n) => Math.abs(n) <= 4 && n % 2 === 0, mu: { dens: (t) => M.dirichlet(2, 2 * t) } },
        };
        const which = v.select('$E$', Object.entries(ES).map(([value, o]) => ({ value, label: o.label })), 'three');
        // real test functions f(θ) = Σ_{n=0}^{8} a_n cos(nθ + φ_n), so f̂(±n) = a_n e^{±iφ_n}/2
        const FS = {
          a: { label: 'test $f$ #1', a: [0.4, 0.9, 0.5, 0.8, 0.3, 0.45, 0.6, 0.25, 0.35], ph: [0, 0.3, 1.2, 2.0, 0.7, 2.6, 1.6, 0.2, 2.9] },
          b: { label: 'test $f$ #2', a: [0.2, 0.35, 1.0, 0.6, 0.7, 0.2, 0.5, 0.4, 0.15], ph: [0, 2.2, 0.4, 1.1, 2.8, 0.9, 0.1, 1.9, 0.6] },
        };
        const fw = v.select('', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'a');
        const NN = 8, ns = M.range(2 * NN + 1).map((i) => i - NN);
        const top = v.stage({ x: [0, M.TAU], y: [-2.5, 4.5], height: 210, full: true, axes: 'box', xticks: XT, title: '$f$ and $Qf=\\mu*f$' });
        const mid = v.stage({ x: [0, M.TAU], y: [-1, 3], height: 140, full: true, axes: 'box', xticks: XT, title: 'the idempotent measure $\\mu$ ($\\mu*\\mu=\\mu$): density w.r.t. $d\\theta/2\\pi$, or point masses' });
        const bot = v.stage({ x: [-NN - 0.7, NN + 0.7], y: [0, 1.1], height: 150, full: true, axes: 'box', xticks: ns.filter((n) => n % 2 === 0), xlabel: 'n', title: '$|\\hat f(n)|$ and $|\\widehat{\\mu*f}(n)|=\\chi_E(n)|\\hat f(n)|$' });
        let st = {};
        v.legend([['blue', '$f$'], ['green', '$\\mu*f$ and its coefficients'], ['orange', 'the measure $\\mu$; dots mark $E$'], ['faint', '$|\\hat f(n)|$', { area: true }]]);
        v.render(() => {
          const Ek = ES[which.value], Fk = FS[fw.value];
          const f = (t) => Fk.a.reduce((acc, a, n) => acc + a * Math.cos(n * t + Fk.ph[n]), 0);
          const g = (t) => Fk.a.reduce((acc, a, n) => acc + (Ek.inE(n) ? a * Math.cos(n * t + Fk.ph[n]) : 0), 0);
          const xs = M.linspace(0, M.TAU, 600), fv = xs.map(f), gv = xs.map(g);
          const lo = Math.min(...fv, ...gv), hi = Math.max(...fv, ...gv), pd = 0.12 * (hi - lo);
          top.setView(null, [lo - pd, hi + pd]);
          top.hline(0, { color: 'faint', width: 1 });
          top.path(xs.map((t, i) => [t, fv[i]]), { color: 'blue', width: 2 });
          top.path(xs.map((t, i) => [t, gv[i]]), { color: 'green', width: 2.6 });
          // the measure
          const dens = Ek.mu.dens;
          let lo2 = 0, hi2 = 1;
          if (dens) { const dv = xs.map(dens); lo2 = Math.min(0, ...dv); hi2 = Math.max(...dv); }
          mid.setView(null, [lo2 - 0.15 * (hi2 - lo2 + 0.5), Math.max(hi2, 1.6) * 1.15]);
          mid.hline(0, { color: 'faint', width: 1 });
          if (dens) mid.fn(dens, { color: 'orange', width: 2, domain: [0, M.TAU], fill: 'orange', fillAlpha: 0.12 });
          if (Ek.mu.atoms) for (const [a, w] of Ek.mu.atoms) { mid.arrow(a + 0.004, 0, a + 0.004, 1.4, { color: 'orange', width: 2.6 }); mid.text(`mass ${v.fix(w, 3)}`, a + 0.07, 1.2, { color: 'orange', size: 11, align: 'left' }); }
          // coefficients
          const fh = ns.map((n) => (n === 0 ? Fk.a[0] : Fk.a[Math.abs(n)] / 2));
          bot.setView(null, [-0.1 * Math.max(...fh), Math.max(...fh) * 1.2]);
          bot.bars(fh, { x0: -NN, dx: 1, color: 'faint', barWidth: 0.72 });
          bot.bars(fh.map((x, i) => (Ek.inE(ns[i]) ? x : 0)), { x0: -NN, dx: 1, color: 'green', barWidth: 0.42 });
          ns.forEach((n) => { if (Ek.inE(n)) bot.dot(n, Math.max(...fh) * 1.12, { color: 'orange', r: 3 }); });
          // total variation of μ, and a numerical check that μ*μ = μ (μ̂² = μ̂ = χ_E)
          let tv = 0; if (Ek.mu.atoms) tv += Ek.mu.atoms.reduce((acc, a) => acc + a[1], 0); if (dens) tv += M.integrate((t) => Math.abs(dens(t)), 0, M.TAU, 3000) / M.TAU;
          let maxdev = 0; for (let n = -10; n <= 10; n++) { let re = 0, im = 0; if (Ek.mu.atoms) for (const [a, w] of Ek.mu.atoms) { re += w * Math.cos(n * a); im -= w * Math.sin(n * a); } if (dens) { re += M.integrate((t) => dens(t) * Math.cos(n * t), 0, M.TAU, 2000) / M.TAU; im -= M.integrate((t) => dens(t) * Math.sin(n * t), 0, M.TAU, 2000) / M.TAU; } maxdev = Math.max(maxdev, Math.hypot(re - (Ek.inE(n) ? 1 : 0), im)); }
          st = { tv, maxdev };
        });
        v.readout(() => `$\\max_{|n|\\le10}|\\hat\\mu(n)-\\chi_E(n)|=${v.M.sci(st.maxdev, 2)}$ and $\\|\\mu\\|=${v.fix(st.tv, 4)}<\\infty$, so $Qf=\\mu*f$ is a bounded projection of $L^1(\\T)$ (and of $C(\\T)$) onto $Y_E$ with $\\|Q\\|\\le${v.fix(st.tv, 3)}$, commuting with all rotations. By 5.19 every complemented invariant subspace arises this way — so if no measure has $\\hat\\mu=\\chi_E$, $Y_E$ is not complemented (5.20).`);
      },
    },
    {
      num: '5.20',
      kind: 'Theorem',
      name: 'H¹ is not complemented in L¹; the disc algebra is not complemented in C(T)',
      statement: String.raw`(a) The space $H^1=\{f\in L^1(\T):\hat f(n)=0\text{ for all }n<0\}$ is a closed subspace of $L^1(\T)$ that is not complemented in $L^1(\T)$.
(b) The disc algebra $A=\{f\in C(\T):\hat f(n)=0\text{ for all }n<0\}$ is a closed subspace of $C(\T)$ that is not complemented in $C(\T)$.`,
      idea: String.raw`Both subspaces are translation-invariant with spectrum $E=\{0,1,2,\dots\}$. By 5.19 a projection would be convolution with a measure $\mu$ with $\hat\mu=\chi_{[0,\infty)}$, i.e. the Riesz projection $\sum\hat f(n)e^{in\theta}\mapsto\sum_{n\ge0}\hat f(n)e^{in\theta}$ would be bounded. It is not: in $L^1$ it sends the Fejér kernels (norm $1$) to functions whose $L^1$ norms grow like $\log N$; in $C(\T)$ it sends the uniformly bounded sums $\sum_{n\le N}\sin(n\theta)/n$ to functions whose sup norms grow like $\tfrac12\log N$.`,
      caption: String.raw`Choose the space and raise $N$. Top: a function $f_N$ of norm at most a fixed constant (blue) and $|Qf_N|$, where $Q$ is the only possible invariant projection onto the analytic subspace (green). Bottom: $\|Qf_N\|/\|f_N\|$ against $N$ on a log scale — it climbs like $\log N$ without bound, so no bounded invariant projection exists, and by 5.18–5.19 no bounded projection at all.`,
      deps: ['fa-5.19', 'fa-5.18'],
      see: ['rca-17.11'],
      tags: ['complemented subspaces', 'Hardy spaces', 'Fourier multipliers'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('space', [{ value: 'L1', label: '$L^1(\\T)$ and $H^1$' }, { value: 'C', label: '$C(\\T)$ and $A$' }], 'C');
        const NS = v.slider('$N$', 2, 200, 40, { int: true, log: true });
        const top = v.stage({ x: [0, M.TAU], y: [-2, 4], height: 230, full: true, axes: 'box', xticks: XT, title: '$f_N$ and $|Qf_N|$' });
        const bot = v.stage({ x: [Math.log(2) - 0.15, Math.log(200) + 0.15], y: [0, 4], height: 180, full: true, axes: 'box', xticks: [2, 5, 10, 20, 50, 100, 200].map((n) => [Math.log(n), String(n)]), xlabel: 'N', title: '$\\|Qf_N\\|/\\|f_N\\|$ against $N$ (log scale)' });
        const G = 2048, th = M.range(G).map((m) => M.TAU * (m + 0.5) / G);
        const cache = {};
        function data(md, N) {
          const key = `${md}|${N}`; if (cache[key]) return cache[key];
          let fv, qv, nf, nq;
          if (md === 'C') {
            fv = th.map((t) => { let s = 0; for (let n = 1; n <= N; n++) s += Math.sin(n * t) / n; return s; });
            qv = th.map((t) => { let re = 0, im = 0; for (let n = 1; n <= N; n++) { re += Math.sin(n * t) / (2 * n); im -= Math.cos(n * t) / (2 * n); } return Math.hypot(re, im); });
            let h = 0; for (let n = 1; n <= N; n++) h += 1 / (2 * n);
            nf = Math.max(...fv.map(Math.abs)); nq = Math.max(h, ...qv); // |Qf_N(0)| = ½ Σ 1/n
          } else {
            fv = th.map((t) => M.fejer(N, t));
            qv = th.map((t) => { let re = 0, im = 0; for (let n = 0; n <= N; n++) { const w = 1 - n / (N + 1); re += w * Math.cos(n * t); im += w * Math.sin(n * t); } return Math.hypot(re, im); });
            nf = M.mean(fv.map(Math.abs)); nq = M.mean(qv);
          }
          return (cache[key] = { fv, qv, nf, nq, r: nq / nf });
        }
        let st = {};
        v.legend([['blue', '$f_N$'], ['green', '$|Qf_N|$, $Q$ = Riesz projection'], ['red', 'ratio of norms', { dot: true }], ['muted', 'least-squares fit $a+b\\log N$', { dash: true }]]);
        v.render(() => {
          const md = mode.value, N = NS.value, Dd = data(md, N);
          const lo = Math.min(0, ...Dd.fv), hi = Math.max(...Dd.fv, ...Dd.qv);
          const cap = md === 'L1' ? Math.min(hi, 1.2 * Math.max(...Dd.qv)) : hi;
          top.setView(null, [lo - 0.08 * (cap - lo), cap * 1.08]);
          top.hline(0, { color: 'faint', width: 1 });
          top.path(th.map((t, i) => [t, Dd.fv[i]]), { color: 'blue', width: 1.8 });
          top.path(th.map((t, i) => [t, Dd.qv[i]]), { color: 'green', width: 2.2 });
          top.corner(md === 'C' ? `‖f‖∞ = ${v.fix(Dd.nf, 3)}    ‖Qf‖∞ = ${v.fix(Dd.nq, 3)}` : `‖f‖₁ = ${v.fix(Dd.nf, 3)}    ‖Qf‖₁ = ${v.fix(Dd.nq, 3)}`, 'tr', { weight: 600 });
          const Ns = [2, 3, 4, 6, 8, 11, 16, 23, 32, 45, 64, 90, 128, 160, 200];
          const pts = Ns.map((n) => [Math.log(n), data(md, n).r]);
          bot.setView(null, [0, Math.max(...pts.map((p) => p[1])) * 1.15]);
          bot.path(pts, { color: 'red', width: 2 });
          bot.dots(pts, { color: 'red', r: 3 });
          bot.dot(Math.log(N), Dd.r, { color: 'red', r: 6 });
          // least-squares line r ≈ a + b log N through the computed points
          const mx = M.mean(pts.map((p) => p[0])), my = M.mean(pts.map((p) => p[1]));
          const slope = M.sum(pts, (p) => (p[0] - mx) * (p[1] - my)) / M.sum(pts, (p) => (p[0] - mx) ** 2);
          bot.fn((x) => my + slope * (x - mx), { color: 'muted', width: 1.2, dash: [5, 4], domain: [Math.log(2), Math.log(200)] });
          st = { md, N, r: Dd.r, slope };
        });
        v.readout(() => `$N=${st.N}$: $\\|Qf_N\\|/\\|f_N\\|=${v.fix(st.r, 3)}$; the fitted slope is $${v.fix(st.slope, 3)}$ per unit of $\\log N$, so the ratio grows without bound. ` + (st.md === 'C' ? 'The partial sums $\\sum_{n\\le N}\\sin(n\\theta)/n$ stay below $\\int_0^\\pi\\frac{\\sin t}{t}dt\\approx1.852$, while their analytic halves reach $\\tfrac12\\sum_{n\\le N}\\frac1n$ at $\\theta=0$. So $A$ has no complement in $C(\\T)$.' : 'The Fejér kernels have $\\|K_N\\|_1=1$, while their analytic halves have $L^1$ norms of order $\\log N$. So $H^1$ has no complement in $L^1(\\T)$.'));
      },
    },
  ],
};
