// Rudin, Functional Analysis — Chapter 3 (part 3): compact convex sets, 3.15–3.20

const d2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Clip a convex polygon to {x : a·x ≤ b}. */
function clipLe(poly, a, b) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = d2(a, P) - b, fq = d2(a, Q) - b;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** Barycentric coordinates of p in triangle abc. */
function bary(p, a, b, c) {
  const det = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
  const l1 = ((b[0] - p[0]) * (c[1] - p[1]) - (c[0] - p[0]) * (b[1] - p[1])) / det;
  const l2 = ((c[0] - p[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (c[1] - p[1])) / det;
  return [l1, l2, 1 - l1 - l2];
}
const subDigits = (n) => String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');

export default {
  collection: 'fa',
  chapter: 3,
  items: [
    {
      num: '3.15',
      kind: 'Theorem',
      name: 'Banach–Alaoglu theorem',
      credit: 'Banach & Alaoglu, 1932',
      statement: String.raw`If $V$ is a neighbourhood of $0$ in a topological vector space $X$ and
$$K=\{\Lambda\in X^*:\ |\Lambda x|\le1\ \text{for every }x\in V\},$$
then $K$ is weak$^*$-compact.`,
      idea: String.raw`Since $V$ absorbs every $x$, there is $\gamma(x)<\infty$ with $|\Lambda x|\le\gamma(x)$ for all $\Lambda\in K$. So $K$ sits inside the product $P=\prod_{x\in X}\{|z|\le\gamma(x)\}$ of compact discs, which is compact by Tychonoff's theorem, and the weak$^*$ topology on $K$ is exactly the product (pointwise) topology. Finally $K$ is closed in $P$: linearity $f(\alpha x+\beta y)=\alpha f(x)+\beta f(y)$ and the bound $|f|\le1$ on $V$ are each conditions on finitely many coordinates, preserved under pointwise limits — and they force continuity.`,
      caption: String.raw`$X=c_0$, $V$ its open unit ball, so $K$ is the unit ball of $X^*=\ell^1$. Watching three coordinates $\Lambda\mapsto(\Lambda x_1,\Lambda x_2,\Lambda x_3)$ with $x_3=x_1+x_2$: every $\Lambda\in K$ lands in the box $\prod[-\|x_i\|,\|x_i\|]$ (a finite piece of Tychonoff's product), on the plane $z=x+y$ (linearity is a closed condition), inside the blue polygon (the image of $K$). Slide $n$ (the bars on the right show $\Lambda_n$): the sequences $e_n^*$ and $\tfrac12(-1)^ne_1^*+\tfrac12e_{n+1}^*$ have no norm-convergent subsequence, yet their images pile up at weak$^*$ cluster points (green). Drag to rotate.`,
      deps: ['fa-3.14', 'fa-3.8'],
      tags: ['weak* topology', 'compactness', 'Banach–Alaoglu'],
      viz(v) {
        const M = v.M;
        const XS = {
          a: { label: '$x_1, x_2$ (A)', x1: [1, 0.55, -0.3, 0.75, 0.2, -0.5], x2: [0.15, -0.8, 0.6, 0.35, -0.65, 0.3] },
          b: { label: '$x_1, x_2$ (B)', x1: [0.9, -0.9, 0.4, 0.1, 0.6, 0], x2: [0.8, 0.7, -0.5, 0.9, -0.2, 0.4] },
        };
        const SEQ = {
          esc: { label: '$\\Lambda_n=e_n^*$', f: (n) => ({ [n]: 1 }) },
          alt: { label: '$\\tfrac12(-1)^n e_1^*+\\tfrac12e_{n+1}^*$', f: (n) => { const o = { 1: 0.5 * (n % 2 ? -1 : 1) }; o[n + 1] = 0.5; return o; } },
          rot: { label: '$0.6\\cos n\\,e_1^*+0.4\\sin n\\,e_2^*$', f: (n) => ({ 1: 0.6 * Math.cos(n), 2: 0.4 * Math.sin(n) }) },
        };
        const xs = v.select('test vectors', Object.entries(XS).map(([value, o]) => ({ value, label: o.label })), 'a');
        const seq = v.select('sequence', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const nS = v.slider('$n$', 1, 120, 40, { int: true });
        const S3 = v.stage3d({ range: 2.1, height: 380, yaw: -0.55, pitch: 0.42, labels: ['Λx₁', 'Λx₂', 'Λx₃'], title: '$\\Lambda\\mapsto(\\Lambda x_1,\\Lambda x_2,\\Lambda x_3)$ inside the box $\\prod_i[-\\|x_i\\|_\\infty,\\|x_i\\|_\\infty]$', weight: 1.4 });
        const B = v.stage({ x: [0.3, 12.7], y: [-1.1, 1.1], height: 380, axes: 'box', xticks: [1, 4, 8, 12], yticks: [-0.5, 0, 0.5, 1], title: 'coefficients of $\\Lambda_n\\in\\ell^1$' });
        let st = {};
        v.render(() => {
          const X = XS[xs.value], x1 = X.x1, x2 = X.x2, x3 = x1.map((a, k) => a + x2[k]);
          const g = [M.norm(x1, Infinity), M.norm(x2, Infinity), M.norm(x3, Infinity)];
          const phi = (o) => { let a = 0, b = 0; for (const k in o) { const i = +k - 1; if (i < x1.length) { a += o[k] * x1[i]; b += o[k] * x2[i]; } } return [a, b, a + b]; };
          // the box
          const C = [-1, 1];
          for (const i of C) for (const j of C) {
            S3.line([i * g[0], j * g[1], -g[2]], [i * g[0], j * g[1], g[2]], { color: 'faint', width: 1 });
            S3.line([i * g[0], -g[1], j * g[2]], [i * g[0], g[1], j * g[2]], { color: 'faint', width: 1 });
            S3.line([-g[0], i * g[1], j * g[2]], [g[0], i * g[1], j * g[2]], { color: 'faint', width: 1 });
          }
          // the plane z = x + y inside the box
          let sq = [[-g[0], -g[1]], [g[0], -g[1]], [g[0], g[1]], [-g[0], g[1]]];
          sq = clipLe(clipLe(sq, [1, 1], g[2]), [-1, -1], g[2]);
          S3.poly(sq.map(([a, b]) => [a, b, a + b]), { fill: 'teal', fillAlpha: 0.08, color: 'teal', alpha: 0.5, width: 1, bias: 0.4 });
          // image of K: hull of ±(x1_k, x2_k)
          const pts = []; x1.forEach((a, k) => { pts.push([a, x2[k]]); pts.push([-a, -x2[k]]); });
          const H = M.hull(pts);
          S3.poly(H.map(([a, b]) => [a, b, a + b]), { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 1.6, bias: 0.2 });
          // the sequence
          const n = nS.value, F = SEQ[seq.value].f;
          const orbit = M.range(n, 1).map((m) => phi(F(m)));
          orbit.forEach((p, i) => S3.dot(p, { color: 'gold', r: i === n - 1 ? 6 : 3, alpha: i === n - 1 ? 1 : 0.75 }));
          const clusters = seq.value === 'esc' ? [[0, 0, 0]] : seq.value === 'alt' ? [phi({ 1: 0.5 }), phi({ 1: -0.5 })] : [];
          clusters.forEach((p) => S3.dot(p, { color: 'green', r: 7 }));
          if (seq.value === 'rot') S3.curve((t) => phi({ 1: 0.6 * Math.cos(t), 2: 0.4 * Math.sin(t) }), 0, M.TAU, { color: 'green', width: 2.2, n: 120 });
          // coefficient bars
          const o = F(n), bars = M.range(12).map((k) => o[k + 1] || 0);
          B.bars(bars, { x0: 1, dx: 1, color: (b) => (b >= 0 ? 'gold' : 'orange'), barWidth: 0.6, fillAlpha: 0.85 });
          B.hline(0, { color: 'faint', width: 1 });
          if (n + 1 > 12 && seq.value !== 'rot') B.text(`mass at index ${n + (seq.value === 'alt' ? 1 : 0)} →`, 12.6, 0.5, { align: 'right', color: 'gold', size: 12 });
          const last = orbit[n - 1];
          st = { last, l1: Object.values(o).reduce((s, z) => s + Math.abs(z), 0), seq: seq.value, g };
        });
        v.legend([['faint', 'box $\\prod[-\\gamma(x_i),\\gamma(x_i)]$'], ['teal', 'plane $\\Lambda x_3=\\Lambda x_1+\\Lambda x_2$', { area: true }], ['blue', 'image of $K$', { area: true }], ['gold', '$\\Lambda_1,\\dots,\\Lambda_n$', { dot: true }], ['green', 'weak$^*$ cluster points', { dot: true }]]);
        v.readout(() => {
          const s = st, p = s.last;
          const cl = s.seq === 'esc' ? '$\\|\\Lambda_m-\\Lambda_n\\|_1=2$ for $m\\ne n$, so no subsequence converges in norm, yet $0$ is a weak$^*$ cluster point (indeed $\\Lambda_n\\to0$ weak$^*$).' : s.seq === 'alt' ? '$\\|\\Lambda_m-\\Lambda_n\\|_1\\ge1$ for $m\\ne n$, so no subsequence converges in norm, yet $\\pm\\tfrac12e_1^*$ are weak$^*$ cluster points.' : 'This sequence has no limit; every point of the green ellipse is a cluster point.';
          return `$\\|\\Lambda_n\\|_1 = ${v.fix(s.l1, 3)}\\le1$; $(\\Lambda_nx_1,\\Lambda_nx_2,\\Lambda_nx_3) = (${p.map((z) => v.fix(z, 3)).join(',\\,')})$ with $\\Lambda_nx_3-\\Lambda_nx_1-\\Lambda_nx_2 = ${v.fix(Math.abs(p[2] - p[0] - p[1]) < 5e-4 ? 0 : p[2] - p[0] - p[1], 3)}$. ${cl}`;
        });
      },
    },
    {
      num: '3.16',
      kind: 'Theorem',
      name: 'Weak*-compact sets are metrizable when X is separable',
      statement: String.raw`If $X$ is a separable topological vector space and $K\subset X^*$ is weak$^*$-compact, then $K$ is metrizable in the weak$^*$ topology.`,
      idea: String.raw`Let $\{x_n\}$ be countable and dense. The functions $f_n(\Lambda)=\Lambda x_n$ are weak$^*$-continuous and separate points of $X^*$ (a continuous $\Lambda$ vanishing on a dense set is $0$). The topology they induce is metrizable, e.g. by $d(\Lambda,\Lambda')=\sum_n2^{-n}\min(1,|\Lambda x_n-\Lambda'x_n|)$, and by 3.8(b) it coincides with the weak$^*$ topology on the compact set $K$.`,
      caption: String.raw`$X=c_0$, $K$ the unit ball of $\ell^1$, and the separating sequence $x_n=e_n$, giving $d(\Lambda,\Lambda')=\sum_n2^{-n}|\lambda_n-\lambda'_n|$. Left: the matrix $d(\Lambda_i,\Lambda_j)$ for the first 30 terms of a sequence in $K$; right: the norm distances $\|\Lambda_i-\Lambda_j\|_1$. Blocks of small $d$ reveal weak$^*$ convergence and cluster points that the norm cannot see. Drag the cursor to read off a pair.`,
      deps: ['fa-3.8', 'fa-3.14'],
      tags: ['weak* topology', 'metrizability'],
      viz(v) {
        const M = v.M;
        const NN = 30, D = 64;
        const SEQ = {
          esc: { label: '$e_m^*$', f: (m) => M.range(D).map((k) => +(k === m - 1)) },
          alt: { label: '$\\tfrac12(-1)^m e_1^*+\\tfrac12e_{m+1}^*$', f: (m) => M.range(D).map((k) => (k === 0 ? 0.5 * (m % 2 ? -1 : 1) : 0) + (k === m ? 0.5 : 0)) },
          norm: { label: '$(1-\\tfrac1m)e_1^*+\\tfrac1m e_m^*$', f: (m) => M.range(D).map((k) => (k === 0 ? 1 - 1 / m : 0) + (k === m - 1 ? 1 / m : 0)) },
        };
        const seq = v.select('sequence $\\Lambda_m$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const opt = { x: [-2.5, NN + 0.5], y: [-3.4, NN + 0.5], equal: true, height: 340, axes: false };
        const L = v.stage({ ...opt, title: 'weak$^*$ metric $d(\\Lambda_i,\\Lambda_j)$' });
        const R = v.stage({ ...opt, title: 'norm distance $\\|\\Lambda_i-\\Lambda_j\\|_1$' });
        const cur = L.handle(24, 9, { color: 'red', constrain: (x, y) => [M.clamp(Math.round(x), 1, NN), M.clamp(Math.round(y), 1, NN)] });
        let cache = {}, st = {};
        v.render(() => {
          const key = seq.value;
          if (!cache[key]) {
            const T = M.range(NN, 1).map(SEQ[key].f);
            const dm = T.map((a) => T.map((b) => M.sum(a, (z, k) => Math.pow(2, -(k + 1)) * Math.abs(z - b[k]))));
            const nm = T.map((a) => T.map((b) => M.sum(a, (z, k) => Math.abs(z - b[k]))));
            cache[key] = { dm, nm, dmax: Math.max(...dm.flat(), 1e-9) };
          }
          const { dm, nm, dmax } = cache[key];
          const cell = (A, x, y) => (x < 0.5 || y < 0.5 || x > NN + 0.5 || y > NN + 0.5 ? NaN : A[M.clamp(Math.round(y), 1, NN) - 1][M.clamp(Math.round(x), 1, NN) - 1]);
          for (const S of [L, R]) {
            S.rect(0.5, 0.5, NN + 0.5, NN + 0.5, { color: 'faint', width: 1 });
            for (const t of [1, 10, 20, 30]) { S.text(String(t), t, -0.6, { align: 'center', color: 'muted', size: 11 }); S.text(String(t), -0.4, t, { align: 'right', color: 'muted', size: 11 }); }
            S.text('j', NN / 2 + 0.5, -2.2, { color: 'muted', math: true, align: 'center' });
            S.text('i', -1.9, NN / 2 + 3, { color: 'muted', math: true, align: 'center' });
          }
          L.heat((x, y) => cell(dm, x, y) / dmax, { range: [0, 1], cmap: 'viridis', res: 2, key: `d${key}` });
          R.heat((x, y) => cell(nm, x, y) / 2, { range: [0, 1], cmap: 'viridis', res: 2, key: `n${key}` });
          const i = cur.y, j = cur.x;
          for (const S of [L, R]) { S.rect(j - 0.5, i - 0.5, j + 0.5, i + 0.5, { color: 'red', width: 2 }); S.hline(i, { color: 'red', width: 0.8, alpha: 0.5 }); S.vline(j, { color: 'red', width: 0.8, alpha: 0.5 }); }
          L.corner(`yellow = ${v.fmt(dmax, 3)}`, 'tr', { color: 'muted', size: 11.5 });
          R.corner('yellow = 2', 'tr', { color: 'muted', size: 11.5 });
          st = { i, j, d: dm[i - 1][j - 1], n: nm[i - 1][j - 1], key };
        });
        v.readout(() => {
          const s = st;
          const tail = s.key === 'esc' ? 'here $d(\\Lambda_m,0)=2^{-m}\\to0$: weak$^*$ convergence to $0$, invisible in norm.' : s.key === 'alt' ? 'the checkerboard shows two weak$^*$ cluster points, $\\pm\\tfrac12e_1^*$.' : 'this sequence converges in norm too, and both pictures agree.';
          return `$d(\\Lambda_{${s.i}},\\Lambda_{${s.j}}) = ${v.fix(s.d, 5)}$, $\\;\\|\\Lambda_{${s.i}}-\\Lambda_{${s.j}}\\|_1 = ${v.fix(s.n, 3)}$ — ${tail}`;
        });
      },
    },
    {
      num: '3.17',
      kind: 'Theorem',
      name: 'Equicontinuous sequences have weak*-convergent subsequences',
      statement: String.raw`Let $V$ be a neighbourhood of $0$ in a separable topological vector space $X$, and let $\{\Lambda_n\}\subset X^*$ satisfy $|\Lambda_nx|\le1$ for all $x\in V$ and all $n$. Then some subsequence $\{\Lambda_{n_i}\}$ and some $\Lambda\in X^*$ satisfy $\Lambda x=\lim_i\Lambda_{n_i}x$ for every $x\in X$.`,
      idea: String.raw`All $\Lambda_n$ lie in the set $K$ of 3.15, which is weak$^*$-compact, and metrizable by 3.16 because $X$ is separable. In a compact metric space every sequence has a convergent subsequence. Concretely this is Cantor's diagonal argument: refine the index set so that $\Lambda_nx_1$ converges, then $\Lambda_nx_2$, and so on, and take the $k$-th index of the $k$-th refinement.`,
      caption: String.raw`$X=\ell^1$, $\Lambda_n=(\cos n\theta_k)_k\in\ell^\infty$ with $\theta_k=\sqrt2,\sqrt3,\sqrt5$, tested on $x_k=e_k$. Row $k$ plots $\Lambda_nx_k$ against $n$ (log scale) for the indices that survived rows $1,\dots,k-1$. In each row the interval is halved repeatedly, keeping the half with more points (gold band); the surviving indices pass to the next row. The diagonal picks $n_1<n_2<n_3$ (circled) form a subsequence along which every coordinate settles.`,
      deps: ['fa-3.15', 'fa-3.16'],
      tags: ['weak* topology', 'compactness', 'diagonal argument'],
      viz(v) {
        const M = v.M;
        const N = 20000, TH = [Math.SQRT2, Math.sqrt(3), Math.sqrt(5)];
        const val = TH.map((th) => { const a = new Float64Array(N + 1); for (let n = 1; n <= N; n++) a[n] = Math.cos(n * th); return a; });
        const dS = v.slider('bisection steps per row', 1, 4, 3, { int: true });
        const S = v.stage({ x: [-0.15, Math.log10(N) + 0.05], y: [-8.1, 1.25], height: 420, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '10³'], [4, '10⁴']], yticks: [], xlabel: 'n' });
        let st = {};
        v.render(() => {
          const d = dS.value;
          let idx = M.range(N, 1); const rows = []; let prev = 0; const picks = [];
          for (let k = 0; k < 3; k++) {
            let lo = -1, hi = 1;
            for (let s = 0; s < d; s++) {
              const mid = (lo + hi) / 2; let a = 0, b = 0;
              for (const n of idx) if (val[k][n] >= lo && val[k][n] <= hi) { if (val[k][n] < mid) a++; else b++; }
              if (a >= b) hi = mid; else lo = mid;
            }
            const keep = idx.filter((n) => val[k][n] >= lo && val[k][n] <= hi);
            rows.push({ all: idx, keep, lo, hi });
            const pk = keep.find((n) => n > prev);
            picks.push(pk); prev = pk ?? prev;
            idx = keep;
          }
          rows.forEach((r, k) => {
            const y0 = -3.1 * k;
            const Y = (z) => y0 + z;
            S.rect(-0.15, Y(-1.05), Math.log10(N) + 0.05, Y(1.05), { fill: 'grid', fillAlpha: 0.25, stroke: false });
            S.rect(-0.15, Y(r.lo), Math.log10(N) + 0.05, Y(r.hi), { fill: 'gold', fillAlpha: 0.22, stroke: false });
            S.dots(r.all.map((n) => [Math.log10(n), Y(val[k][n])]), { color: 'faint', r: 1.2 });
            S.dots(r.keep.map((n) => [Math.log10(n), Y(val[k][n])]), { color: k === 0 ? 'blue' : k === 1 ? 'purple' : 'teal', r: 1.8 });
            S.text(`Λₙx${subDigits(k + 1)}`, -0.12, Y(0.75), { align: 'left', color: 'ink', size: 12.5, weight: 600 });
            S.text(`${r.keep.length} of ${r.all.length} indices kept`, Math.log10(N) + 0.02, Y(-0.85), { align: 'right', color: 'muted', size: 11.5 });
            picks.forEach((p, j) => { if (p && j >= k) S.dot(Math.log10(p), Y(val[k][p]), { hollow: true, color: 'red', r: 6, width: 2 }); });
          });
          st = { picks, rows };
        });
        v.legend([['gold', 'the kept half-interval', { area: true }], ['faint', 'indices from the previous row', { dot: true }], ['red', 'diagonal picks $n_1<n_2<n_3$', { dot: true }]]);
        v.readout(() => {
          const s = st, p = s.picks;
          const w = s.rows.map((r) => `[${v.fix(r.lo, 3)},${v.fix(r.hi, 3)}]`).join(',\\ ');
          return `Diagonal indices $n_1,n_2,n_3 = ${p.map((x) => x ?? '-').join(',\\ ')}$. Along them, $\\Lambda_{n_i}x_k$ lies in the $k$-th kept interval $${w}$ for every $i\\ge k$; with more steps and rows the intervals shrink to the limit $\\Lambda x_k$.`;
        });
      },
    },
    {
      num: '3.18',
      kind: 'Theorem',
      name: 'Weakly bounded sets are bounded',
      statement: String.raw`In a locally convex space $X$, a set $E$ is weakly bounded (i.e. $\{\Lambda x:x\in E\}$ is bounded for every $\Lambda\in X^*$) if and only if it is bounded in the original topology.`,
      idea: String.raw`Original boundedness implies weak boundedness trivially. Conversely, given a neighbourhood $U$ of $0$, take a closed convex balanced $V$ with $V\subset U$ and its polar $K=\{\Lambda:|\Lambda|\le1\text{ on }V\}$, weak$^*$-compact by 3.15 and convex. The maps $\Lambda\mapsto\Lambda x$ ($x\in E$) are pointwise bounded on $K$, so a Baire-category argument on the compact convex set $K$ (the uniform boundedness principle 2.9) makes them uniformly bounded: $|\Lambda x|\le\gamma$ on $K\times E$. By 3.7, $E\subset\gamma V\subset\gamma U$.`,
      caption: String.raw`The contrapositive in $X=\ell^2$, with $E=\{c_ne_n\}$. If $c_n\to\infty$ (gold, log–log axes), a **single** functional sees it: the "gliding hump" vector $y$ (blue) has spikes $1/j$ at the first $n_j$ with $c_{n_j}\ge j^2$, so $\|y\|_2^2\le\sum j^{-2}$, yet $|\langle c_{n_j}e_{n_j},y\rangle|\ge j$ (red) is unbounded. With $c_n=1$ the set is bounded and every functional is bounded on it.`,
      deps: ['fa-3.15', 'fa-3.7', 'fa-2.9'],
      tags: ['boundedness', 'weak topologies', 'uniform boundedness'],
      viz(v) {
        const M = v.M;
        const C = {
          one: { label: '$c_n=1$', c: () => 1 },
          log: { label: '$c_n=\\log(1+n)$', c: (n) => Math.log(1 + n) },
          q: { label: '$c_n=n^{1/4}$', c: (n) => Math.pow(n, 0.25) },
          h: { label: '$c_n=\\sqrt n$', c: (n) => Math.sqrt(n) },
        };
        const which = v.select('$E=\\{c_ne_n\\}$ with', Object.entries(C).map(([value, o]) => ({ value, label: o.label })), 'q');
        const L7 = 7;
        const top = v.stage({ x: [-0.3, L7 + 0.15], y: [-1.35, 3.8], height: 260, full: true, axes: 'box', xticks: M.range(7, 1).map((k) => [k, `10${'⁰¹²³⁴⁵⁶⁷'[k]}`]), yticks: [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '10³']], title: '$\\|c_ne_n\\|=c_n$ (gold) and $|\\langle c_ne_n,y\\rangle|$ at the humps (red)' });
        const bot = v.stage({ x: [-0.3, L7 + 0.15], y: [0, 1.15], height: 170, full: true, axes: 'box', xticks: M.range(7, 1).map((k) => [k, `10${'⁰¹²³⁴⁵⁶⁷'[k]}`]), yticks: [0, 0.5, 1], title: 'the witness $y\\in\\ell^2$: spikes $y_{n_j}=1/j$' });
        let st = {};
        v.render(() => {
          const o = C[which.value], c = o.c;
          top.setView(null, [-1.35, Math.max(1.2, Math.log10(c(1e7)) + 0.45)]);
          top.fn((t) => Math.log10(c(Math.pow(10, t))), { domain: [0, L7], color: 'gold', width: 2.6 });
          const humps = [];
          if (which.value === 'one') {
            for (let j = 1; j <= 12; j++) humps.push({ n: Math.round(Math.pow(10, (j - 1) * L7 / 12)), y: 1 / j, v: 1 / j });
          } else {
            let n = 1;
            for (let j = 1; j <= 60; j++) {
              const target = j * j; let lo = n, hi = n;
              while (c(hi) < target && hi < 1e7) hi *= 2;
              if (c(hi) < target) break;
              while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (c(m) >= target) hi = m; else lo = m; }
              n = c(lo) >= target ? lo : hi;
              humps.push({ n, y: 1 / j, v: c(n) / j });
              n += 1;
            }
          }
          humps.forEach((h) => { const x = Math.log10(h.n); bot.line(x, 0, x, h.y, { color: 'blue', width: 2.2 }); bot.dot(x, h.y, { color: 'blue', r: 3.5 }); });
          humps.forEach((h) => top.dot(Math.log10(h.n), Math.log10(h.v), { color: 'red', r: 4.5 }));
          const y2 = M.sum(humps, (h) => h.y * h.y), best = Math.max(...humps.map((h) => h.v));
          st = { k: humps.length, y2, best, bounded: which.value === 'one', last: humps[humps.length - 1] };
        });
        v.legend([['gold', '$c_n=\\|c_ne_n\\|$'], ['red', '$|\\langle c_{n_j}e_{n_j},y\\rangle| = c_{n_j}/j$', { dot: true }], ['blue', 'witness $y$', { dot: true }]]);
        v.readout(() => {
          const s = st;
          if (s.bounded) return `$E=\\{e_n\\}$ is bounded: for any $y\\in\\ell^2$ (e.g. the blue one), $|\\langle e_n,y\\rangle| = |y_n|\\le\\|y\\|_2 = ${v.fix(Math.sqrt(s.y2), 3)}$.`;
          return `${s.k} humps up to $n=10^7$: $\\|y\\|_2^2 = ${v.fix(s.y2, 4)} < \\pi^2/6$, so $y\\in\\ell^2$, but $|\\langle c_ne_n,y\\rangle|$ reaches $${v.fmt(s.best, 4)}$ at $n=${s.last.n}$ and keeps growing: $E$ is not weakly bounded — matching the fact that it is not bounded.`;
        });
      },
    },
    {
      num: '3.19',
      kind: 'Definition',
      name: 'Convex hull and closed convex hull',
      statement: String.raw`The **convex hull** $\co(E)$ of a subset $E$ of a vector space is the intersection of all convex sets containing $E$; equivalently, the set of all convex combinations $t_1x_1+\dots+t_nx_n$ with $x_i\in E$, $t_i\ge0$, $\sum t_i=1$. In a topological vector space the **closed convex hull** $\overline{\co}(E)$ is the closure of $\co(E)$, the smallest closed convex set containing $E$.`,
      idea: String.raw`The set of convex combinations is convex (a convex combination of convex combinations is one) and lies in every convex set containing $E$ (induction on $n$), so it is the smallest convex set containing $E$. In infinite dimensions $\co(E)$ need not be closed even for compact $E$, which is why $\overline{\co}$ is needed.`,
      caption: String.raw`Drag the seven points of $E$ and the probe $p$. The shaded polygon is $\co(E)$. When $p$ is inside, it is written as a convex combination of three points of $E$ (found in a fan triangulation of the hull); the weights are shown on the connecting segments and add up to $1$.`,
      deps: [],
      tags: ['convexity', 'convex hull'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, axes: false });
        const R = v.rng(7);
        const E = M.range(7).map((i) => { const t = M.TAU * i / 7 + R.uniform(-0.3, 0.3), r = R.uniform(0.7, 1.45); return S.handle(r * Math.cos(t) * 1.25, r * Math.sin(t), { color: 'blue', r: 6 }); });
        const p = S.handle(0.35, 0.2, { color: 'gold', label: 'p' });
        let st = {};
        v.render(() => {
          const P = E.map((h) => [h.x, h.y]), H = M.hull(P), q = [p.x, p.y];
          S.poly(H, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 2 });
          for (let i = 1; i + 1 < H.length; i++) S.path([H[0], H[i], H[i + 1]], { color: 'blue', width: 0.8, alpha: 0.35, dash: [3, 4], close: true });
          let tri = null, w = null;
          for (let i = 1; i + 1 < H.length && !tri; i++) { const b = bary(q, H[0], H[i], H[i + 1]); if (b.every((z) => z >= -1e-9)) { tri = [H[0], H[i], H[i + 1]]; w = b; } }
          if (tri) {
            tri.forEach((a, k) => {
              S.line(q[0], q[1], a[0], a[1], { color: 'green', width: 1.3 + 3 * w[k], alpha: 0.85 });
              const m = [(q[0] + 2 * a[0]) / 3, (q[1] + 2 * a[1]) / 3];
              S.text(`t${'₁₂₃'[k]} = ${v.fix(w[k], 2)}`, m[0], m[1], { color: 'green', size: 12.5, weight: 600, dy: -10 });
            });
            S.poly(tri, { fill: 'green', fillAlpha: 0.1, stroke: false });
          }
          S.corner(tri ? 'p ∈ co(E)' : 'p ∉ co(E)', 'tl', { color: tri ? 'green' : 'red', weight: 600 });
          st = { tri, w, q };
        });
        v.legend([['blue', '$E$ and $\\co(E)$', { area: true }], ['green', 'a convex combination giving $p$']]);
        v.readout(() => {
          const s = st;
          if (!s.tri) return '$p$ is outside the hull: no convex combination of points of $E$ equals $p$.';
          return `$p = ${s.w.map((z, k) => `${v.fix(z, 3)}\\,x_{${k + 1}}`).join(' + ')}$, $\\;t_1+t_2+t_3 = ${v.fix(s.w[0] + s.w[1] + s.w[2], 3)}$, all $t_i\\ge0$.`;
        });
      },
    },
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Compactness of convex hulls',
      statement: String.raw`Let $X$ be a topological vector space.
(a) If $A_1,\dots,A_n$ are compact convex sets in $X$, then $\co(A_1\cup\dots\cup A_n)$ is compact.
(b) If $X$ is locally convex and $E\subset X$ is totally bounded, then $\co(E)$ is totally bounded.
(c) If $X$ is a Fréchet space and $K\subset X$ is compact, then $\overline{\co}(K)$ is compact.
(d) If $K\subset\R^n$ is compact, then $\co(K)$ is compact.`,
      idea: String.raw`(a) $\co(\bigcup A_i)$ is the image of the compact set $S\times A_1\times\dots\times A_n$ ($S$ the simplex) under the continuous map $(s,a)\mapsto\sum s_ia_i$. (b) Cover $E$ by $F+V$ with $F$ finite and $V$ convex; then $\co(E)\subset\co(F)+V$, and $\co(F)$ is compact by (a). (c) In a complete metric space, a closed totally bounded set is compact; apply (b). (d) Carathéodory: in $\R^n$ every convex combination can be shortened to one of at most $n+1$ points, so $\co(K)$ is the continuous image of $S\times K^{n+1}$.`,
      caption: String.raw`Left, part (a): a disc $A_1$ and a triangle $A_2$ (drag the centre and the vertices). Every point $p$ of $\co(A_1\cup A_2)$ is $(1-s)a_1+sa_2$ with $a_i\in A_i$ — drag $p$ to see one such decomposition. Right, part (d): $x$ starts as the average of all $12$ points of $K\subset\R^2$; each step of Carathéodory's reduction (slider) uses an affine dependence among the support points to drop one, until only $n+1=3$ remain. Dot size is the weight.`,
      deps: ['fa-3.19'],
      tags: ['convexity', 'compactness', 'Carathéodory'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.75, 1.75], equal: true, height: 330, ticks: false, axes: false, title: '(a) $\\co(A_1\\cup A_2)=\\{(1-s)a_1+sa_2\\}$' });
        const R = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.45], equal: true, height: 330, ticks: false, axes: false, title: '(d) Carathéodory reduction in $\\R^2$' });
        const c1 = L.handle(-1.2, 0.35, { color: 'blue' });
        const r1 = v.slider('radius of $A_1$', 0.2, 0.9, 0.55, { step: 0.01 });
        const T = [[0.9, 0.95], [1.65, -0.6], [0.35, -1.0]].map(([x, y]) => L.handle(x, y, { color: 'red', r: 6 }));
        const p = L.handle(-0.05, 0.05, { color: 'gold', label: 'p' });
        const steps = v.slider('reduction steps', 0, 9, 9, { int: true });
        let seed = 3;
        v.button('new $K$', () => { seed++; });
        let st = {};
        v.render(() => {
          // ---- (a)
          const c = [c1.x, c1.y], r = r1.value, tri = M.hull(T.map((h) => [h.x, h.y])), q = [p.x, p.y];
          const disc = M.range(96).map((i) => [c[0] + r * Math.cos(M.TAU * i / 96), c[1] + r * Math.sin(M.TAU * i / 96)]);
          const H = M.hull(disc.concat(tri));
          L.poly(H, { fill: 'purple', fillAlpha: 0.1, color: 'purple', width: 1.6, dash: [6, 4] });
          L.circle(c[0], c[1], r, { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 2 });
          L.poly(tri, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 2 });
          L.tex('A_1', c[0], c[1] + r + 0.2, { color: 'blue', size: 16 });
          const tc = [M.mean(tri.map((z) => z[0])), M.mean(tri.map((z) => z[1]))];
          L.tex('A_2', tc[0], tc[1], { color: 'red', size: 16 });
          let best = null;
          for (let k = 0; k <= 400; k++) {
            const s = k / 400, cs = [q[0] - (1 - s) * c[0], q[1] - (1 - s) * c[1]];
            const sT = tri.map((z) => [s * z[0], s * z[1]]);
            const z = s < 1e-9 ? [0, 0] : (M.pointInPoly(cs, sT) ? cs : M.closestOnConvexPoly(cs, sT));
            const slack = (1 - s) * r - M.dist(cs, z);
            if (!best || slack > best.slack) best = { s, z, slack };
          }
          let dec = null;
          if (best.slack >= -1e-6) {
            const s = best.s, a2 = s > 1e-9 ? [best.z[0] / s, best.z[1] / s] : tri[0];
            const a1 = s < 1 - 1e-9 ? [(q[0] - s * a2[0]) / (1 - s), (q[1] - s * a2[1]) / (1 - s)] : c;
            dec = { s, a1, a2 };
            L.line(a1[0], a1[1], a2[0], a2[1], { color: 'green', width: 2.2 });
            const dv = M.normalize([a2[0] - a1[0], a2[1] - a1[1]]);
            L.dot(a1[0], a1[1], { color: 'blue', r: 5 });
            L.dot(a2[0], a2[1], { color: 'red', r: 5 });
            L.tex('a_1', a1[0] - 0.22 * dv[0] - 0.12 * dv[1], a1[1] - 0.22 * dv[1] + 0.12 * dv[0], { color: 'blue', size: 15 });
            L.tex('a_2', a2[0] + 0.24 * dv[0] - 0.12 * dv[1], a2[1] + 0.24 * dv[1] + 0.12 * dv[0], { color: 'red', size: 15 });
          }
          L.corner(dec ? `s = ${v.fix(dec.s, 3)}` : 'p ∉ co(A₁ ∪ A₂)', 'tl', { color: dec ? 'green' : 'red', weight: 600 });
          // ---- (d)
          const Rg = v.rng(seed);
          const K = M.range(12).map(() => { const t = Rg.uniform(0, M.TAU), rr = Math.sqrt(Rg.uniform(0.15, 1)) * 1.25; return [rr * Math.cos(t), 0.95 * rr * Math.sin(t)]; });
          let sup = M.range(12), t = M.range(12).map(() => 1 / 12);
          const x = [M.sum(K, (z) => z[0]) / 12, M.sum(K, (z) => z[1]) / 12];
          for (let it = 0; it < steps.value && sup.length > 3; it++) {
            const [i0, i1, i2, i3] = sup.slice(0, 4).map((k) => K[k]);
            const m3 = (a, b, cc) => a[0] * (b[1] - cc[1]) - b[0] * (a[1] - cc[1]) + cc[0] * (a[1] - b[1]);
            const a = [m3(i1, i2, i3), -m3(i0, i2, i3), m3(i0, i1, i3), -m3(i0, i1, i2)];
            let lam = Infinity, drop = -1;
            a.forEach((ai, k) => { if (ai > 1e-14 && t[k] / ai < lam) { lam = t[k] / ai; drop = k; } });
            if (drop < 0) break;
            for (let k = 0; k < 4; k++) t[k] = Math.max(0, t[k] - lam * a[k]);
            t[drop] = 0;
            sup = sup.filter((_, k) => k !== drop); t = t.filter((_, k) => k !== drop);
          }
          const HK = M.hull(K);
          R.poly(HK, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 1.5 });
          if (sup.length === 3) R.poly(sup.map((k) => K[k]), { fill: 'green', fillAlpha: 0.15, color: 'green', width: 1.8 });
          K.forEach((z, k) => R.dot(z[0], z[1], { color: 'muted', r: 3 }));
          sup.forEach((k, j) => R.dot(K[k][0], K[k][1], { color: 'blue', r: 3 + 40 * t[j] }));
          R.dot(x[0], x[1], { color: 'gold', r: 5.5, label: 'x', labelPos: 'ne' });
          const recon = [M.sum(sup, (k, j) => t[j] * K[k][0]), M.sum(sup, (k, j) => t[j] * K[k][1])];
          R.corner(`${sup.length} points carry x`, 'tl', { color: sup.length === 3 ? 'green' : 'blue', weight: 600 });
          st = { dec, m: sup.length, err: M.dist(recon, x), tsum: M.sum(t), tmin: Math.min(...t) };
        });
        v.legend([['blue', '$A_1$; support of $x$ (size = weight)', { area: true }], ['red', '$A_2$', { area: true }], ['purple', '$\\co(A_1\\cup A_2)$', { dash: true }], ['green', 'decomposition / final triangle']]);
        v.readout(() => {
          const s = st;
          const a = s.dec ? `(a): $p=(1-s)a_1+sa_2$ with $s=${v.fix(s.dec.s, 3)}$.` : '(a): $p$ lies outside the hull.';
          return `${a} (d): $x$ is a convex combination of ${s.m} points of $K$ (weights $\\ge ${v.fix(Math.max(0, s.tmin), 3)}$, sum $${v.fix(s.tsum, 3)}$, reconstruction error $${s.err < 1e-12 ? '<10^{-12}' : v.fmt(s.err, 2)}$)${s.m === 3 ? ' — no more than $n+1=3$ are needed.' : '.'}`;
        });
      },
    },
  ],
};
