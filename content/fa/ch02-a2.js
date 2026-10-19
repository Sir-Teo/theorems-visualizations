// Rudin, Functional Analysis — Chapter 2: Completeness (part 2: 2.7–2.12)

// ---------------------------------------------------------------- helpers
/** Keep {x : <a,x> <= c} of a convex polygon. */
function clipHalf(poly, a, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = a[0] * P[0] + a[1] * P[1] - c, fq = a[0] * Q[0] + a[1] * Q[1] - c;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** Nearest point of a (possibly non-convex) polygon region to p (p itself if inside). */
function nearestIn(M, p, poly) {
  if (M.pointInPoly(p, poly)) return p.slice();
  let best = null, bd = Infinity;
  for (let i = 0; i < poly.length; i++) { const q = M.closestOnSegment(p, poly[i], poly[(i + 1) % poly.length]); const d = M.dist(p, q); if (d < bd) { bd = d; best = q; } }
  return best;
}
const sci = (x) => { if (!(x > 0)) return '0'; if (x >= 1e-3) return String(+x.toPrecision(2)); const e = Math.floor(Math.log10(x)); return `${+(x / 10 ** e).toFixed(1)}\\cdot10^{${e}}`; };
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');

export default {
  collection: 'fa',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Pointwise convergence on a set of second category',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces and $\{\Lambda_n\}$ a sequence of continuous linear mappings of $X$ into $Y$.
(a) If the set $C$ of all $x\in X$ for which $\{\Lambda_nx\}$ is a Cauchy sequence in $Y$ is of the second category in $X$, then $C=X$.
(b) If the set $L$ of all $x\in X$ at which $\Lambda x=\lim_n\Lambda_nx$ exists is of the second category in $X$, and $Y$ is an F-space, then $L=X$ and $\Lambda:X\to Y$ is continuous.`,
      idea: String.raw`Cauchy sequences are bounded, so $C$ lies in the set of bounded orbits; being of the second category, it forces $\{\Lambda_n\}$ to be equicontinuous (2.5). $C$ is a subspace of the second category, hence dense. For $x\in X$ pick $x'\in C$ with $x-x'\in V$, where $\Lambda_n(V)\subset W$ for all $n$; then $\Lambda_nx-\Lambda_mx=\Lambda_n(x-x')+(\Lambda_nx'-\Lambda_mx')+\Lambda_m(x'-x)\in W+W+W$ for large $m,n$, so $x\in C$. For (b), $L\subset C$ gives $C=X$; completeness of $Y$ turns Cauchy into convergent, and $\Lambda(V)\subset\overline W$ shows $\Lambda$ is continuous.`,
      caption: String.raw`$X=\ell^2$, $Y=\R$, and $x_k=\pm k^{-\alpha}$ (in $\ell^2$ exactly when $\alpha>\tfrac12$). Left: the first coordinates of $x$ and the weights $w_k$ of $\Lambda_nx=\sum_{k\le n}w_kx_k$. Right: the sequence $\Lambda_nx$. With $w_k=1$, the set $C$ of convergent $x$ is a dense subspace (it contains every finitely supported $x$) but not all of $\ell^2$ — take $\alpha\le1$ with equal signs — so by (a) $C$ is of the first category. With $w_k=1/k$, every $x$ converges and the limit $\Lambda$ is continuous, as (b) says.`,
      deps: ['fa-2.5', 'fa-2.3', 'fa-1.25', 'fa-1.8'],
      tags: ['Banach–Steinhaus', 'pointwise convergence'],
      viz(v) {
        const M = v.M;
        const NN = 10000;
        const fam = v.select('$\\Lambda_nx$', [{ value: 'A', label: '$\\sum_{k\\le n}x_k$' }, { value: 'B', label: '$\\sum_{k\\le n}x_k/k$' }], 'A');
        const sg = v.select('signs', [{ value: 'p', label: '$x_k=k^{-\\alpha}$' }, { value: 'a', label: '$x_k=(-1)^{k+1}k^{-\\alpha}$' }], 'p');
        const al = v.slider('$\\alpha$', 0.55, 1.6, 0.8, { step: 0.01 });
        const X = v.stage({ x: [-1.2, 30.7], y: [-1.15, 1.15], height: 250, axes: 'box', title: '$x$ (bars) and weights $w_k$ (dots)' });
        const Y = v.stage({ x: [-0.12, 4.12], y: [0, 6], height: 250, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '10³'], [4, '10⁴']], title: '$\\Lambda_nx$ against $n$ (log scale)' });
        const idx = [...new Set(M.range(401).map((i) => Math.round(Math.pow(10, i / 100))))];
        let info = {};
        v.render(() => {
          const a = al.value, alt = sg.value === 'a', A = fam.value === 'A';
          const xk = (k) => (alt && k % 2 === 0 ? -1 : 1) * Math.pow(k, -a);
          const wk = (k) => (A ? 1 : 1 / k);
          // partial sums
          const S = new Float64Array(NN + 1); let nx2 = 0;
          for (let k = 1; k <= NN; k++) { S[k] = S[k - 1] + wk(k) * xk(k); nx2 += Math.pow(k, -2 * a); }
          nx2 += Math.pow(NN, 1 - 2 * a) / (2 * a - 1);          // tail of sum k^{-2a}
          const nx = Math.sqrt(nx2);
          const pw = A ? a : a + 1;                               // |w_k x_k| = k^{-pw}
          const conv = alt || pw > 1;
          let lim = null;
          if (conv) lim = alt ? (S[NN] + S[NN - 1]) / 2 : S[NN] + Math.pow(NN, 1 - pw) / (pw - 1) - 0.5 * Math.pow(NN, -pw);
          // X panel
          X.setView(null, alt ? [-1.15, 1.15] : [-0.12, 1.15]);
          X.bars(M.range(30, 1).map(xk), { color: 'accent', fillAlpha: 0.75 });
          X.path(M.range(30, 1).map((k) => [k, wk(k)]), { color: 'orange', width: 1.2, alpha: 0.7 });
          X.dots(M.range(30, 1).map((k) => [k, wk(k)]), { color: 'orange', r: 3 });
          X.hline(0, { color: 'faint', width: 1 });
          // Y panel
          const pts = idx.map((n) => [Math.log10(n), S[n]]);
          const ys = pts.map((p) => p[1]).concat(lim == null ? [] : [lim]);
          const lo = Math.min(0, ...ys), hi = Math.max(...ys), pad = 0.12 * (hi - lo || 1);
          Y.setView(null, [lo - pad, hi + pad]);
          Y.hline(0, { color: 'faint', width: 1 });
          if (lim != null) { Y.hline(lim, { color: 'green', width: 1.6, dash: [6, 4] }); Y.text('limit Λx', 4.08, lim, { align: 'right', baseline: 'bottom', dy: -4, color: 'green', size: 11 }); }
          Y.path(pts, { color: 'gold', width: 2 });
          Y.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], { color: 'gold', r: 4 });
          Y.corner(conv ? 'Cauchy: x ∈ C' : 'not Cauchy: x ∉ C', 'br', { color: conv ? 'green' : 'red', weight: 600 });
          const opn = A ? Math.sqrt(NN) : Math.sqrt(M.range(NN, 1).reduce((s, k) => s + 1 / (k * k), 0));
          info = { A, conv, lim, nx, SN: S[NN], opn, a };
          v.legend([['accent', '$x_k$', { area: true }], ['orange', '$w_k$', { dot: true }], ['gold', '$\\Lambda_nx$, $n\\le10^4$'], ['green', '$\\lim\\Lambda_nx$', { dash: true }]]);
        });
        v.readout(() => {
          const s = info; if (s.A == null) return '';
          const head = `$\\|x\\|_2 = ${v.fix(s.nx, 3)}$, $\\;\\Lambda_{10^4}x = ${v.fmt(s.SN, 4)}$.`;
          if (s.A) return head + ` $\\|\\Lambda_n\\| = \\sqrt n\\to\\infty$, so $C\\neq\\ell^2$` + (s.conv ? ` (this $x$ happens to lie in $C$; try equal signs with $\\alpha\\le1$).` : ` — this $x$ is not in $C$. By (a), $C$ is of the first category although it is dense.`);
          return head + ` $\\|\\Lambda_n\\|\\le\\pi/\\sqrt6$ for all $n$; $\\Lambda x \\approx ${v.fix(s.lim, 4)}$ and $|\\Lambda x|\\le\\frac{\\pi}{\\sqrt6}\\|x\\|_2 = ${v.fix(Math.PI / Math.sqrt(6) * s.nx, 3)}$ — the limit is continuous.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Pointwise limits of continuous linear maps on an F-space',
      statement: String.raw`Let $\{\Lambda_n\}$ be a sequence of continuous linear mappings of an F-space $X$ into a topological vector space $Y$. If $\Lambda x=\lim_{n\to\infty}\Lambda_nx$ exists for every $x\in X$, then $\Lambda$ is continuous.`,
      idea: String.raw`A convergent sequence is bounded, so every orbit $\{\Lambda_nx\}$ is bounded and 2.6 makes $\{\Lambda_n\}$ equicontinuous: for a neighbourhood $W$ of $0$ in $Y$ there is $V$ with $\Lambda_n(V)\subset W$ for all $n$. Letting $n\to\infty$ gives $\Lambda(V)\subset\overline W$, and since closed neighbourhoods of $0$ form a local base (1.11), $\Lambda$ is continuous. Without completeness the limit of continuous maps can be discontinuous.`,
      caption: String.raw`$\Lambda_nf=n\int_0^{1/n}f$ on $C[0,1]$, so $\Lambda_nf\to f(0)$ for every $f$. Left: a spike $f_h$ of height $1$ and width $h$, the averaging window, and the averages $\Lambda_mf_h$ plotted at $x=1/m$, converging to $f_h(0)=1$. Right: the ratio $|\Lambda f_h|/\norm{f_h}$ for the limit (red/green) and for $\Lambda_n$ (gold). With the sup norm (complete) everything stays $\le1$. With the $L^1$ norm (not complete) each $\Lambda_n$ is still bounded, by $n$, but the limit $f\mapsto f(0)$ is not: its ratio is $2/h$.`,
      deps: ['fa-2.6', 'fa-2.3', 'fa-1.11'],
      tags: ['Banach–Steinhaus', 'continuity'],
      viz(v) {
        const M = v.M;
        const nrm = v.select('norm on $C[0,1]$', [{ value: 'sup', label: '$\\|f\\|_\\infty$ (complete)' }, { value: 'L1', label: '$\\|f\\|_1$ (not complete)' }], 'sup');
        const nS = v.slider('$n$', 1, 40, 5, { int: true });
        const hS = v.slider('spike width $h$', 0.002, 1, 0.12, { log: true, fmt: (x) => v.fmt(x, 2) });
        const A = v.stage({ x: [-0.09, 1.03], y: [-0.1, 1.32], height: 270, axes: 'box', title: '$f_h$, window $[0,1/n]$ and the averages $\\Lambda_mf_h$ at $x=1/m$' });
        const B = v.stage({ x: [-2.8, 0.05], y: [-0.35, 3.1], height: 270, axes: 'box', xticks: [[-2, '0.01'], [-1, '0.1'], [0, '1']], yticks: [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '1000']], title: '$|\\Lambda f_h|/\\|f_h\\|$ and $|\\Lambda_n f_h|/\\|f_h\\|$ against $h$' });
        const tent = (h) => (x) => Math.max(0, 1 - x / h);
        const avg = (m, h) => (h >= 1 / m ? 1 - 1 / (2 * m * h) : (m * h) / 2);
        const fnorm = (h, kind) => (kind === 'sup' ? 1 : h / 2);
        let info = {};
        v.render(() => {
          const n = nS.value, h = hS.value, kind = nrm.value;
          // A
          A.vband(0, 1 / n, { color: 'orange', alpha: 0.16, edges: true });
          A.fn(tent(h), { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.15, n: 1200 });
          const an = avg(n, h);
          A.line(0, an, 1 / n, an, { color: 'gold', width: 3 });
          const dots = M.range(60, 1).map((m) => [1 / m, avg(m, h)]);
          A.path(dots, { color: 'gold', width: 1, alpha: 0.5 });
          A.dots(dots, { color: 'gold', r: 2.6 });
          A.dot(1 / n, an, { color: 'gold', r: 5, label: `Λ${sub(n)}f`, math: false, labelPos: 'ne' });
          A.dot(0, 1, { color: 'green', r: 5.5 });
          A.corner('green dot: Λf = f(0) = 1', 'tr', { color: 'green', weight: 600 });
          A.tex(`1/n`, 1 / n, 1.32, { color: 'orange', baseline: 'top', dy: 3, align: 'left', dx: 4, size: 13 });
          // B: log-log ratios
          const us = M.linspace(-2.8, 0, 300);
          const lim = (u) => Math.log10(1 / fnorm(Math.pow(10, u), kind));
          const lnn = (u) => { const hh = Math.pow(10, u); return Math.log10(Math.max(1e-3, avg(n, hh) / fnorm(hh, kind))); };
          const bad = kind === 'L1';
          B.setView(null, bad ? [-0.35, 3.1] : [-1.9, 1.0]);
          B.hline(Math.log10(kind === 'sup' ? 1 : n), { color: 'gold', width: 1, dash: [3, 3], alpha: 0.8 });
          B.path(us.map((u) => [u, lim(u)]), { color: bad ? 'red' : 'green', width: 2.4 });
          B.path(us.map((u) => [u, lnn(u)]), { color: 'gold', width: 2 });
          B.vline(Math.log10(h), { color: 'muted', width: 1, dash: [2, 3] });
          B.dot(Math.log10(h), lim(Math.log10(h)), { color: bad ? 'red' : 'green', r: 5 });
          B.dot(Math.log10(h), lnn(Math.log10(h)), { color: 'gold', r: 4.5 });
          B.text(kind === 'sup' ? '‖Λₙ‖ = 1' : `‖Λₙ‖ = n = ${n}`, -2.75, Math.log10(kind === 'sup' ? 1 : n), { baseline: 'bottom', dy: -3, color: 'gold', size: 11 });
          B.corner(bad ? 'limit unbounded: ratio 2/h → ∞' : 'limit bounded: ratio = 1', 'tr', { color: bad ? 'red' : 'green', weight: 600 });
          info = { n, h, kind, an, nf: fnorm(h, kind) };
          v.legend([['accent', '$f_h$'], ['orange', 'window $[0,1/n]$', { area: true }], ['gold', '$\\Lambda_m f_h$, $\\Lambda_n$'], [bad ? 'red' : 'green', 'limit $\\Lambda f = f(0)$']]);
        });
        v.readout(() => {
          const s = info; if (!s.kind) return '';
          const head = `$\\Lambda_{${s.n}}f_h = ${v.fix(s.an, 3)}$, $\\;\\Lambda f_h = f_h(0) = 1$, $\\;\\|f_h\\| = ${v.fmt(s.nf, 3)}$.`;
          return head + (s.kind === 'sup'
            ? ' In the Banach space $(C[0,1],\\|\\cdot\\|_\\infty)$ every $\\|\\Lambda_n\\|=1$ and $|f(0)|\\le\\|f\\|_\\infty$: the limit is continuous, as 2.8 guarantees.'
            : ` Each $\\Lambda_n$ is $\\|\\cdot\\|_1$-continuous with norm $n$, but $|\\Lambda f_h|/\\|f_h\\|_1 = ${v.fmt(1 / s.nf, 3)}$: the pointwise limit is discontinuous. The space is not complete, so 2.8 does not apply.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Uniform boundedness on compact convex sets',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces, $K$ a compact convex set in $X$, and $\Gamma$ a collection of continuous linear mappings of $X$ into $Y$ such that the orbit $\Gamma(x)$ is bounded in $Y$ for every $x\in K$. Then there is a bounded set $B\subset Y$ with $\Lambda(K)\subset B$ for every $\Lambda\in\Gamma$.`,
      idea: String.raw`Fix balanced neighbourhoods with $\overline W+\overline W\subset U$ and put $E=\bigcap_\Lambda\Lambda^{-1}(\overline W)$. Every $x\in K$ lies in some $nE$, so $K=\bigcup_n(K\cap nE)$, a countable union of closed sets. $K$ is compact Hausdorff, so Baire's theorem (2.2(b)) gives $n$, $x_0\in K$ and a balanced $V$ with $K\cap(x_0+V)\subset nE$. Compactness gives $p>1$ with $K\subset x_0+pV$. For $x\in K$ the point $z=(1-p^{-1})x_0+p^{-1}x$ lies in $K$ by **convexity** and in $x_0+V$, so $z\in nE$; then $\Lambda x=p\Lambda z-(p-1)\Lambda x_0\in pn(\overline W+\overline W)\subset pnU$. Convexity cannot be dropped: in $\ell^2$, $K=\{0\}\cup\{e_k/k\}$ is compact, every orbit of $\Lambda_mx=m^2x_m$ on $K$ is bounded, but $\sup_m|\Lambda_m(e_k/k)|=k$ is not bounded on $K$.`,
      caption: String.raw`A picture of the proof in $\R^2$ with five functionals $\Lambda_j$ and $E=\{|\Lambda_j|\le1\}$ (orange: $nE$). Drag $x_0$ inside $K\cap nE$: the largest disc $x_0+V$ whose part in $K$ stays in $nE$ is drawn green, and $p$ is the factor with $K\subset x_0+pV$. Drag $x\in K$: the point $z=x_0+(x-x_0)/p$ lies in the shrunken copy of $K$, hence in $nE$, and the bars confirm $|\Lambda_jx|\le(2p-1)n$. For a non-convex $K$, $z$ can leave $K$ (red), where the hypothesis gives no information.`,
      deps: ['fa-2.2', 'fa-2.1', 'fa-1.6'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §2.9, pp. 46–47'],
      tags: ['uniform boundedness', 'compactness', 'convexity'],
      viz(v) {
        const M = v.M;
        const shape = v.select('$K$', [{ value: 'cvx', label: 'convex' }, { value: 'ncv', label: 'not convex' }], 'cvx', {
          onChange: (val) => { if (val === 'ncv') { nS.value = 2; x0.x = 1.0; x0.y = 0.3; xh.x = 3.1; xh.y = -0.6; } else { nS.value = 1; x0.x = 0.55; x0.y = 0.1; xh.x = 3.0; xh.y = 1.0; } },
        });
        const nS = v.slider('level $n$', 1, 3, 1, { int: true });
        const S = v.stage({ x: [-1.9, 3.7], y: [-1.9, 2.3], equal: true, axes: false, height: 370, title: '$K$, the set $nE$, and the convex shrink $z=x_0+(x-x_0)/p$' });
        const R = v.stage({ x: [0.4, 5.6], y: [-0.4, 6], axes: 'box', height: 370, xticks: [[1, 'Λ₁'], [2, 'Λ₂'], [3, 'Λ₃'], [4, 'Λ₄'], [5, 'Λ₅']], title: '$|\\Lambda_jz|$ (green) and $|\\Lambda_jx|$ (gold)' });
        const KS = {
          cvx: [[0.1, -1.0], [2.6, -0.75], [3.3, 0.7], [2.2, 1.95], [0.35, 1.2]],
          ncv: [[0.1, -1.0], [3.1, -1.1], [3.4, -0.35], [1.25, -0.25], [1.2, 0.75], [3.2, 0.95], [2.6, 2.0], [0.35, 1.45]],
        };
        const as = M.range(5, 1).map((j) => { const t = 0.35 + (j * Math.PI) / 5, c = 0.75 + 0.18 * Math.sin(2.2 * j); return [c * Math.cos(t), c * Math.sin(t)]; });
        let Ebase = [[-60, -60], [60, -60], [60, 60], [-60, 60]];
        for (const a of as) { Ebase = clipHalf(Ebase, a, 1); Ebase = clipHalf(Ebase, [-a[0], -a[1]], 1); }
        const K = () => KS[shape.value];
        const x0 = S.handle(0.55, 0.1, { color: 'ink', constrain: (x, y) => nearestIn(M, [x, y], K()) });
        const xh = S.handle(3.0, 1.0, { color: 'gold', constrain: (x, y) => nearestIn(M, [x, y], K()) });
        let info = {};
        v.render(() => {
          const P = K(), n = nS.value;
          const nE = Ebase.map((p) => [p[0] * n, p[1] * n]);
          const c = [x0.x, x0.y];
          const inE = M.pointInPoly(c, nE);
          // r: distance from x0 to the part of K outside nE (sampled along the edges of nE inside K, and K's own vertices outside nE)
          let r = Infinity;
          for (let i = 0; i < nE.length; i++) { const A = nE[i], B = nE[(i + 1) % nE.length]; for (let t = 0; t <= 1; t += 1 / 300) { const q = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]; if (M.pointInPoly(q, P)) r = Math.min(r, M.dist(c, q)); } }
          const far = Math.max(...P.map((q) => M.dist(c, q)));
          if (!inE) r = 0;
          const p = r === 0 ? Infinity : Math.max(1, far / r);
          // drawing
          S.poly(nE, { fill: 'orange', fillAlpha: 0.08, color: 'orange', width: 1.6, dash: [6, 4] });
          S.poly(P, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          const top = nE.reduce((m, q) => (q[1] > m[1] ? q : m), [0, -99]);
          S.tex(`${n === 1 ? '' : n}E`, top[0], top[1], { color: 'orange', baseline: 'bottom', dy: -3 });
          S.tex('K', P[2][0], P[2][1], { color: 'accent', align: 'left', dx: 6 });
          const x = [xh.x, xh.y];
          let z = null, zin = false;
          if (isFinite(p)) {
            const rr = Math.min(r, far);
            S.circle(c[0], c[1], rr, { color: 'green', width: 1.4, dash: [4, 3], fill: 'green', fillAlpha: 0.06 });
            S.poly(P.map((q) => [c[0] + (q[0] - c[0]) / p, c[1] + (q[1] - c[1]) / p]), { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.5 });
            z = [c[0] + (x[0] - c[0]) / p, c[1] + (x[1] - c[1]) / p];
            zin = M.pointInPoly(z, P) || M.dist(nearestIn(M, z, P), z) < 1e-9;
            S.line(c[0], c[1], x[0], x[1], { color: 'muted', width: 1.2, dash: [3, 3] });
            S.dot(z[0], z[1], { color: zin ? 'green' : 'red', r: 5.5, label: zin ? 'z' : 'z ∉ K', labelPos: 'sw' });
            S.tex('x_0+V', c[0], c[1] - rr, { color: 'green', baseline: 'top', dy: 3, size: 13 });
          } else S.corner('x₀ must lie in K ∩ nE', 'tl', { color: 'red', weight: 600 });
          S.tex('x_0', c[0], c[1], { align: 'right', baseline: 'bottom', dx: -8, dy: -6, color: 'ink' });
          S.tex('x', x[0], x[1], { align: 'left', baseline: 'bottom', dx: 8, dy: -6, color: 'gold' });
          // bars
          const Lx = as.map((a) => Math.abs(M.dot(a, x)));
          const Lz = z ? as.map((a) => Math.abs(M.dot(a, z))) : [];
          const bound = isFinite(p) ? (2 * p - 1) * n : null;
          const actual = Math.max(...as.map((a) => Math.max(...P.map((q) => Math.abs(M.dot(a, q))))));
          const ymax = 1.15 * Math.max(n, ...Lx, bound ?? 0, actual);
          R.setView(null, [-0.07 * ymax, ymax]);
          if (z) R.bars(Lz, { x0: 0.8, color: zin ? 'green' : 'red', barWidth: 0.32, fillAlpha: 0.8 });
          R.bars(Lx, { x0: 1.2, color: 'gold', barWidth: 0.32, fillAlpha: 0.85 });
          R.hline(n, { color: 'orange', width: 1.6, dash: [6, 4] });
          R.text('n', 5.55, n, { align: 'right', baseline: 'bottom', dy: -3, color: 'orange', math: true });
          if (bound) { R.hline(bound, { color: 'green', width: 1.6, dash: [6, 4] }); R.text('(2p−1)n', 5.55, bound, { align: 'right', baseline: 'bottom', dy: -3, color: 'green', size: 12 }); }
          info = { r, p, n, bound, actual, zin, ok: !!z };
          v.legend([['accent', '$K$', { area: true }], ['orange', '$nE$ (all $|\\Lambda_j|\\le n$)', { dash: true }], ['green', '$x_0+(K-x_0)/p\\subset nE$', { area: true }], ['gold', '$x$ and $|\\Lambda_jx|$']]);
        });
        v.readout(() => {
          const s = info; if (s.n == null) return '';
          if (!s.ok) return 'Move $x_0$ into $K\\cap nE$ (or raise $n$): Baire guarantees that some $K\\cap nE$ has interior relative to $K$.';
          if (!s.zin) return `$p = ${v.fix(s.p, 2)}$: $z$ is **not** in $K$, so the hypothesis says nothing about $\\Lambda_jz$ and the bound $(2p-1)n$ is no longer justified. (In $\\R^2$ it happens to hold anyway; in $\\ell^2$ the non-convex $\\{0\\}\\cup\\{e_k/k\\}$ defeats it.)`;
          return `$p = ${v.fix(s.p, 2)}$: $z$ lies in $K\\cap(x_0+V)\\subset nE$. Bound $(2p-1)n = ${v.fix(s.bound, 2)}$ versus the true $\\max_{K,j}|\\Lambda_jx| = ${v.fix(s.actual, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Definition',
      name: 'Open mappings',
      statement: String.raw`Let $S$ and $T$ be topological spaces and $f:S\to T$. $f$ is **open at** $p\in S$ if $f(V)$ contains a neighbourhood of $f(p)$ whenever $V$ is a neighbourhood of $p$; $f$ is **open** if $f(U)$ is open in $T$ for every open $U\subset S$. Thus $f$ is open exactly when it is open at every point. Because vector topologies are translation invariant, a linear map between topological vector spaces is open as soon as it is open at $0$, i.e. as soon as the image of every neighbourhood of $0$ contains a neighbourhood of $0$.`,
      idea: String.raw`Openness is the mirror image of continuity: continuity pulls open sets back to open sets, openness pushes them forward. A continuous bijection is a homeomorphism exactly when it is open, which is why the open mapping theorem yields continuous inverses. For linear $\Lambda$, $\Lambda(x+V)=\Lambda x+\Lambda(V)$, so openness at $0$ propagates to every point.`,
      deps: ['fa-1.6'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §2.10, pp. 47–48'],
      tags: ['open mapping'],
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Open mapping theorem',
      credit: 'Banach, 1929',
      statement: String.raw`Suppose
(a) $X$ is an F-space,
(b) $Y$ is a topological vector space,
(c) $\Lambda:X\to Y$ is continuous and linear, and
(d) $\Lambda(X)$ is of the second category in $Y$.
Then (i) $\Lambda(X)=Y$, (ii) $\Lambda$ is an open mapping, and (iii) $Y$ is an F-space.`,
      idea: String.raw`For a neighbourhood $V$ of $0$ in $X$ choose $W$ with $W-W\subset V$. Since $\Lambda(X)=\bigcup_k k\Lambda(W)$ is of the second category, some $k\Lambda(W)$, hence $\Lambda(W)$, has closure with interior, and so $\overline{\Lambda(V)}$ contains a neighbourhood of $0$. To remove the closure, use completeness: given $y$, solve $\Lambda x=y$ approximately with $x_1\in V_1$, then the error approximately with $x_2\in V_2$, and so on, with the $V_k$ shrinking geometrically; $x=\sum x_k$ converges because $X$ is complete and $\Lambda x=y$. So $\Lambda$ is open, $\Lambda(X)$ is an open subspace, hence all of $Y$, and $Y\cong X/\ker\Lambda$ is an F-space by 1.41.`,
      caption: String.raw`$X=Y=\R^2$; drag the columns $\Lambda e_1,\Lambda e_2$ and the target $y$. Right: $\Lambda(B_X)$ and the largest ball $\delta B_Y$ inside it. The gold path is the completeness step of the proof: each $x_k$ is taken from a coarse finite net of $c_kB_X$, and every step cuts the error $|y-\Lambda s_k|$ by a fixed factor, so $s_k=x_1+\dots+x_k$ converges (left) to some $x$ with $\Lambda x=y$. For rank one, $\Lambda(X)$ is a line — of the first category — and $\Lambda(B_X)$ contains no ball: the error stalls.`,
      deps: ['fa-2.10', 'fa-2.1', 'fa-1.8', 'fa-1.41'],
      see: ['rca-5.9', 'rca-5.10'],
      tags: ['open mapping', 'Baire category'],
      viz(v) {
        const M = v.M;
        const pre = v.select('$\\Lambda$', [{ value: 'inv', label: 'onto' }, { value: 'near', label: 'nearly singular' }, { value: 'r1', label: 'rank 1' }], 'inv', { onChange: (val) => setPreset(val) });
        const pS = v.select('$B_X$', [{ value: '2', label: '$\\ell^2$ ball' }, { value: '1', label: '$\\ell^1$ ball' }, { value: 'inf', label: '$\\ell^\\infty$ ball' }], '2');
        const X = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 330, title: '$X$: $B_X$ and $s_k=x_1+\\dots+x_k\\to x$' });
        const Y = v.stage({ x: [-2.3, 2.3], y: [-1.8, 1.8], equal: true, axes: false, height: 330, title: '$Y$: $\\Lambda(B_X)\\supset\\delta B_Y$, and $\\Lambda s_k\\to y$' });
        const c1 = Y.handle(1.25, 0.3, { color: 'purple' });
        const c2 = Y.handle(0.4, 0.95, { color: 'teal' });
        const yh = Y.handle(-0.75, 0.62, { color: 'gold', label: 'y' });
        function setPreset(val) {
          c1.x = 1.25; c1.y = 0.3;
          if (val === 'inv') { c2.x = 0.4; c2.y = 0.95; }
          if (val === 'near') { c2.x = 1.0; c2.y = 0.42; }
          if (val === 'r1') { c2.x = -0.6; c2.y = -0.144; }
        }
        let info = {};
        v.render(() => {
          const p = pS.value === 'inf' ? Infinity : +pS.value;
          const L = [[c1.x, c2.x], [c1.y, c2.y]];
          const det = L[0][0] * L[1][1] - L[0][1] * L[1][0];
          const ball = M.unitBall(p, 240);
          const img = ball.map((q) => M.matVec(L, q));
          const opn = Math.max(...img.map((q) => Math.hypot(q[0], q[1])));
          let delta = 0;
          if (Math.abs(det) > 1e-6 * opn * opn) { delta = Infinity; for (let i = 0; i < img.length; i++) { const q = M.closestOnSegment([0, 0], img[i], img[(i + 1) % img.length]); delta = Math.min(delta, Math.hypot(q[0], q[1])); } }
          const yv = [yh.x, yh.y];
          // the iteration
          const steps = []; let s = [0, 0];
          const rank1 = delta < 0.02;
          let net = [];
          if (!rank1) {
            const h = M.clamp((0.62 * delta) / opn, 0.015, 0.5);
            for (let a = -1; a <= 1 + 1e-9; a += h) for (let b = -1; b <= 1 + 1e-9; b += h) if (M.norm([a, b], p) <= 1 + 1e-9) net.push([a, b]);
          }
          for (let k = 0; k < 8; k++) {
            const r = M.vsub(yv, M.matVec(L, s)), rn = Math.hypot(r[0], r[1]);
            if (rn < 1e-12) break;
            let xk;
            if (!rank1) {
              const ck = rn / delta;
              let best = null, bd = Infinity;
              for (const u of net) { const w = M.matVec(L, u); const d = Math.hypot(r[0] - ck * w[0], r[1] - ck * w[1]); if (d < bd) { bd = d; best = u; } }
              xk = M.vscale(best, ck);
            } else {
              // least squares along the image line: the best any x can do
              const col = Math.hypot(c1.x, c1.y) > 1e-9 ? [c1.x, c1.y] : [c2.x, c2.y];
              const u = M.normalize(col), t = M.dot(r, u);
              const A = M.matVec(L, [1, 0]), B = M.matVec(L, [0, 1]);
              const a1 = M.dot(A, u), b1 = M.dot(B, u), nn = a1 * a1 + b1 * b1 || 1;
              xk = [(a1 * t) / nn, (b1 * t) / nn];
            }
            s = M.vadd(s, xk);
            steps.push({ s: s.slice(), err: Math.hypot(...M.vsub(yv, M.matVec(L, s))), c: rank1 ? null : rn / delta });
          }
          const c1net = !rank1 && steps.length ? net.map((u) => M.vscale(M.matVec(L, u), Math.hypot(...yv) / delta)) : [];
          // X panel
          const sx = [[0, 0], ...steps.map((q) => q.s)];
          const R = Math.max(1.5, 1.15 * Math.max(...sx.map((q) => Math.hypot(q[0], q[1]))));
          X.setView([-R * 1.2, R * 1.2], [-R, R]);
          X.line(-99, 0, 99, 0, { color: 'faint', width: 1 }); X.line(0, -99, 0, 99, { color: 'faint', width: 1 });
          X.poly(ball, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2 });
          X.tex('B_X', ball[30][0], ball[30][1], { color: 'accent', align: 'left', baseline: 'bottom', dx: 4 });
          for (let i = 1; i < sx.length; i++) X.arrow(sx[i - 1][0], sx[i - 1][1], sx[i][0], sx[i][1], { color: 'gold', width: 1.8, head: 7 });
          const xf = sx[sx.length - 1];
          X.dot(xf[0], xf[1], { color: rank1 ? 'red' : 'green', r: 5, label: 'x', labelPos: 'ne' });
          // Y panel
          const ext = Math.max(2.0, 1.1 * Math.max(opn, Math.hypot(...yv), Math.hypot(c1.x, c1.y), Math.hypot(c2.x, c2.y)));
          Y.setView([-ext * 1.25, ext * 1.25], [-ext, ext]);
          Y.line(-99, 0, 99, 0, { color: 'faint', width: 1 }); Y.line(0, -99, 0, 99, { color: 'faint', width: 1 });
          if (rank1) {
            const col = Math.hypot(c1.x, c1.y) > 1e-9 ? [c1.x, c1.y] : [c2.x, c2.y], u = M.normalize(col);
            Y.line(-u[0] * 99, -u[1] * 99, u[0] * 99, u[1] * 99, { color: 'red', width: 1.4, dash: [6, 4] });
            Y.corner('Λ(X) is a line: first category, no interior', 'bl', { color: 'red', weight: 600 });
          }
          Y.poly(img, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2.2 });
          if (c1net.length < 4000) Y.dots(c1net, { color: 'muted', r: 1.5, alpha: 0.4 });
          if (!rank1) { Y.circle(0, 0, delta, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.6 }); Y.tex('\\delta B_Y', 0, -delta, { color: 'green', baseline: 'top', dy: 2, size: 13 }); }
          Y.arrow(0, 0, c1.x, c1.y, { color: 'purple', width: 2 }); Y.arrow(0, 0, c2.x, c2.y, { color: 'teal', width: 2 });
          Y.tex('\\Lambda e_1', c1.x, c1.y, { color: 'purple', align: 'left', baseline: 'top', dx: 8, dy: 4, size: 13 });
          Y.tex('\\Lambda e_2', c2.x, c2.y, { color: 'teal', align: 'left', baseline: 'bottom', dx: 8, dy: -4, size: 13 });
          const ly = sx.map((q) => M.matVec(L, q));
          Y.path(ly, { color: 'gold', width: 1.6 });
          Y.dots(ly.slice(1), { color: 'gold', r: 3 });
          if (rank1) { const last = ly[ly.length - 1]; Y.line(last[0], last[1], yv[0], yv[1], { color: 'red', width: 1.6, dash: [3, 3] }); }
          info = { delta, det, steps, rank1, opn, xn: M.norm(xf, p), yn: Math.hypot(...yv) };
          v.legend([['accent', '$B_X$ and $\\Lambda(B_X)$', { area: true }], ['green', '$\\delta B_Y\\subset\\Lambda(B_X)$', { area: true }], ['gold', 'iterates $s_k$, $\\Lambda s_k$'], ['muted', 'net $c_1\\Lambda(N)$ for step 1', { dot: true }], ['purple', '$\\Lambda e_1$'], ['teal', '$\\Lambda e_2$']]);
        });
        v.readout(() => {
          const s = info; if (!s.steps) return '';
          const errs = s.steps.slice(0, 6).map((q) => sci(q.err)).join(',\\ ');
          if (s.rank1) return `$\\det\\Lambda = ${v.fix(s.det, 3)}$: $\\Lambda(B_X)$ is a segment. Errors $|y-\\Lambda s_k|$: $${errs}$ — stuck at the distance from $y$ to the line $\\Lambda(X)$; $\\Lambda$ is neither onto nor open.`;
          return `$\\delta = ${v.fix(s.delta, 3)}$. Errors $|y-\\Lambda s_k|$: $${errs},\\dots\\to0$. The limit $x$ has $\\|x\\| = ${v.fix(s.xn, 3)}\\le C\\,|y|/\\delta$ with $|y| = ${v.fix(s.yn, 3)}$: $\\Lambda(B_X)$ contains a ball, so $\\Lambda$ is open.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Corollary',
      name: 'Inverse mapping theorem and comparable complete topologies',
      credit: 'Banach, 1929',
      statement: String.raw`(a) A continuous linear mapping $\Lambda$ of an F-space $X$ onto an F-space $Y$ is open.
(b) If, in addition, $\Lambda$ is one-to-one, then $\Lambda^{-1}:Y\to X$ is continuous.
(c) If $X$ and $Y$ are Banach spaces and $\Lambda:X\to Y$ is continuous, linear, one-to-one and onto, there are constants $0<a\le b<\infty$ with $a\norm{x}\le\norm{\Lambda x}\le b\norm{x}$ for every $x\in X$.
(d) If $\tau_1\subset\tau_2$ are vector topologies on a vector space $X$ and both $(X,\tau_1)$ and $(X,\tau_2)$ are F-spaces, then $\tau_1=\tau_2$.`,
      idea: String.raw`(a) $Y=\Lambda(X)$ is an F-space, hence of the second category in itself by Baire's theorem, so the open mapping theorem applies. (b) An open continuous bijection has a continuous inverse. (c) is (b) for normed spaces: $b=\norm\Lambda$ and $a=1/\norm{\Lambda^{-1}}$. (d) Apply (b) to the identity map $(X,\tau_2)\to(X,\tau_1)$, which is continuous because $\tau_1\subset\tau_2$.`,
      caption: String.raw`Three operators on sequence spaces; drag $j$ to run through a family of test vectors $x^{(j)}$ (left) and their images (right); the bottom panel collects all the ratios $\|\Lambda x^{(j)}\|/\|x^{(j)}\|$. A diagonal operator with multipliers in $[\tfrac12,2]$ maps $\ell^2$ onto $\ell^2$, and every ratio stays in $[a,b]$ — that is (c). With multipliers $1/k$ the map is one-to-one but not onto, and the ratios tend to $0$. The identity $(\ell^1,\norm\cdot_1)\to(\ell^1,\norm\cdot_2)$ is a continuous bijection whose inverse is unbounded, because its target is not complete; equivalently the comparable topologies differ, which (d) rules out for F-spaces.`,
      deps: ['fa-2.11', 'fa-2.2', 'fa-1.8'],
      see: ['rca-5.10'],
      tags: ['open mapping', 'inverse'],
      viz(v) {
        const M = v.M;
        const NK = 40;
        const op = v.select('$\\Lambda$', [{ value: 'diag', label: '$m_k\\in[\\frac12,2]$ on $\\ell^2$' }, { value: 'decay', label: '$m_k=1/k$ on $\\ell^2$' }, { value: 'id', label: '$\\mathrm{id}:\\ell^1\\to(\\ell^1,\\|\\cdot\\|_2)$' }], 'diag');
        const jS = v.slider('test vector $j$', 1, NK, 9, { int: true });
        const A = v.stage({ x: [-1.5, NK + 0.7], y: [-0.08, 1.15], height: 200, axes: 'box', xticks: [10, 20, 30, 40], title: '$x^{(j)}\\in X$' });
        const B = v.stage({ x: [-1.5, NK + 0.7], y: [-0.08, 1.15], height: 200, axes: 'box', xticks: [10, 20, 30, 40], title: '$\\Lambda x^{(j)}\\in Y$' });
        const C = v.stage({ x: [-0.6, NK + 0.7], y: [-0.38, 2.3], height: 170, axes: 'box', full: true, xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], yticks: [0.5, 1, 1.5, 2], title: '$\\|\\Lambda x^{(j)}\\|/\\|x^{(j)}\\|$ for every test vector' });
        const mult = (k, o) => (o === 'diag' ? 1.25 + 0.75 * Math.sin(1.3 * k + 0.4) : o === 'decay' ? 1 / k : 1);
        // test vectors: a bump centred at j for the diagonal operators; for id the flat vector with j ones
        const testVec = (j, o) => {
          if (o === 'id') return M.range(NK, 1).map((k) => (k <= j ? 1 / j : 0));
          return M.range(NK, 1).map((k) => Math.exp(-((k - j) ** 2) / 1.2));
        };
        const nrm = (x, p) => M.norm(x, p);
        const ratio = (j, o) => {
          const x = testVec(j, o);
          if (o === 'id') return nrm(x, 2) / nrm(x, 1);
          const y = x.map((xk, i) => mult(i + 1, o) * xk);
          return nrm(y, 2) / nrm(x, 2);
        };
        const infm = Math.min(...M.range(5000, 1).map((k) => mult(k, 'diag'))), supm = Math.max(...M.range(5000, 1).map((k) => mult(k, 'diag')));
        let info = {};
        v.render(() => {
          const o = op.value, j = jS.value;
          const x = testVec(j, o);
          const y = o === 'id' ? x : x.map((xk, i) => mult(i + 1, o) * xk);
          const top = 1.2 * Math.max(0.05, ...x, ...y);
          A.setView(null, [-0.15 * top, top]); B.setView(null, [-0.15 * top, top]);
          A.bars(x, { color: 'accent', fillAlpha: 0.8 });
          B.bars(y, { color: 'gold', fillAlpha: 0.85 });
          if (o !== 'id') {
            const ms = M.range(NK, 1).map((k) => [k, mult(k, o) * (o === 'decay' ? 1 : 0.5)]);
            B.path(ms, { color: 'purple', width: 1.4, alpha: 0.7 });
            B.corner(o === 'decay' ? 'purple: multipliers mₖ = 1/k' : 'purple: multipliers mₖ (scaled ×½)', 'br', { color: 'purple', size: 11 });
          }
          const p = o === 'id' ? 1 : 2;
          A.corner(`‖x‖${o === 'id' ? '₁' : '₂'} = ${v.fmt(nrm(x, p), 3)}`, 'tr', { color: 'accent', weight: 600 });
          B.corner(`‖Λx‖₂ = ${v.fmt(nrm(y, 2), 3)}`, 'tr', { color: 'gold', weight: 600 });
          // ratios
          const rs = M.range(NK, 1).map((jj) => ratio(jj, o));
          const a = o === 'diag' ? infm : 0, b = o === 'diag' ? supm : 1;
          C.hband(a, b, { color: o === 'diag' ? 'green' : 'red', alpha: 0.1 });
          C.hline(b, { color: 'muted', width: 1, dash: [4, 4] });
          if (o === 'diag') C.hline(a, { color: 'green', width: 1.6, dash: [6, 4] });
          C.path(rs.map((r, i) => [i + 1, r]), { color: 'accent', width: 1, alpha: 0.5 });
          C.dots(rs.map((r, i) => [i + 1, r]), { color: 'accent', r: 3 });
          C.dot(j, rs[j - 1], { color: 'gold', r: 6 });
          if (o === 'diag') C.text(`a = inf mₖ = ${v.fmt(a, 3)} > 0`, NK + 0.5, a, { align: 'right', baseline: 'top', dy: 5, color: 'green', weight: 600, size: 12 });
          else C.corner('inf = 0: no constant a > 0', 'tr', { color: 'red', weight: 600 });
          info = { o, j, r: rs[j - 1], a, b };
          v.legend([['accent', '$x^{(j)}$', { area: true }], ['gold', '$\\Lambda x^{(j)}$', { area: true }], [o === 'diag' ? 'green' : 'red', 'allowed range $[a,b]$', { area: true }]]);
        });
        v.readout(() => {
          const s = info; if (!s.o) return '';
          const head = `$\\|\\Lambda x^{(${s.j})}\\|/\\|x^{(${s.j})}\\| = ${v.fix(s.r, 4)}$. `;
          if (s.o === 'diag') return head + `$\\Lambda$ maps $\\ell^2$ onto $\\ell^2$ with inverse $(y_k/m_k)$: $a\\|x\\|\\le\\|\\Lambda x\\|\\le b\\|x\\|$ with $a=${v.fix(s.a, 3)}$, $b=${v.fix(s.b, 3)}$.`;
          if (s.o === 'decay') return head + '$\\Lambda$ is continuous and one-to-one, but $y=(1/k)\\in\\ell^2$ has no preimage, since $(1,1,1,\\dots)\\notin\\ell^2$. Not onto — so no lower bound is promised, and indeed there is none.';
          return head + `Here the ratio is $1/\\sqrt{${s.j}}$. $\\Lambda$ is onto, continuous and one-to-one, but $(\\ell^1,\\|\\cdot\\|_2)$ is not complete, and $\\Lambda^{-1}$ is unbounded.`;
        });
      },
    },
  ],
};
