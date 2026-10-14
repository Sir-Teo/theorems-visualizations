// Rudin, Functional Analysis — Chapter 11 (part 4): square roots, positive elements, the B*-algebra
// facts behind Gelfand–Naimark, positive functionals and Herglotz's theorem
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cconj = (a) => [a[0], -a[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cexpi = (t) => [Math.cos(t), Math.sin(t)];
const mmul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const mstar = (A) => A[0].map((_, j) => A.map((row) => cconj(row[j])));
/** Eigenvalues of a small complex matrix: characteristic polynomial (Faddeev–LeVerrier), then Durand–Kerner. */
function eigC(A) {
  const n = A.length, c = new Array(n + 1).fill(null); c[n] = [1, 0];
  let Mk = A.map((r) => r.map(() => [0, 0]));
  for (let k = 1; k <= n; k++) {
    const AM = mmul(A, Mk);
    Mk = AM.map((r, i) => r.map((z, j) => (i === j ? cadd(z, c[n - k + 1]) : z)));
    const T = mmul(A, Mk); let tr = [0, 0]; for (let i = 0; i < n; i++) tr = cadd(tr, T[i][i]);
    c[n - k] = [-tr[0] / k, -tr[1] / k];
  }
  const p = (z) => { let s = [0, 0]; for (let k = n; k >= 0; k--) s = cadd(cmul(s, z), c[k]); return s; };
  const sc = 1 + Math.max(...c.slice(0, n).map(cabs));
  let R = Array.from({ length: n }, (_, k) => cmul([0.4 * sc, 0.9 * sc], cexpi(2 * Math.PI * k / n + 0.3)));
  for (let it = 0; it < 400; it++) {
    let moved = 0;
    R = R.map((z, i) => { let d = [1, 0]; R.forEach((w, j) => { if (j !== i) d = cmul(d, csub(z, w)); }); const step = cdiv(p(z), d); moved = Math.max(moved, cabs(step)); return csub(z, step); });
    if (moved < 1e-14) break;
  }
  return R;
}
// real 2×2 helpers: matrices [[a, b], [c, d]]
const mul2 = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]], [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
const add2 = (X, Y) => [[X[0][0] + Y[0][0], X[0][1] + Y[0][1]], [X[1][0] + Y[1][0], X[1][1] + Y[1][1]]];
const sc2 = (X, k) => [[X[0][0] * k, X[0][1] * k], [X[1][0] * k, X[1][1] * k]];
const tr2 = (X) => [[X[0][0], X[1][0]], [X[0][1], X[1][1]]];
const I2 = [[1, 0], [0, 1]];
/** Eigen-decomposition of a real symmetric 2×2 matrix: {l: [λmin, λmax], v: [unit eigenvector of λmin, of λmax]}. */
function sym2(X) {
  const a = X[0][0], b = (X[0][1] + X[1][0]) / 2, d = X[1][1], m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  const th = 0.5 * Math.atan2(2 * b, a - d), v2 = [Math.cos(th), Math.sin(th)], v1 = [-Math.sin(th), Math.cos(th)];
  return { l: [m - r, m + r], v: [v1, v2] };
}
const norm2 = (X) => { const s = sym2(mul2(tr2(X), X)); return Math.sqrt(Math.max(0, s.l[1])); };   // operator 2-norm
const norm1 = (X) => Math.max(Math.abs(X[0][0]) + Math.abs(X[1][0]), Math.abs(X[0][1]) + Math.abs(X[1][1])); // max column sum
const rho2 = (X) => { const t = X[0][0] + X[1][1], det = X[0][0] * X[1][1] - X[0][1] * X[1][0], disc = t * t / 4 - det; return disc >= 0 ? Math.max(Math.abs(t / 2 + Math.sqrt(disc)), Math.abs(t / 2 - Math.sqrt(disc))) : Math.sqrt(det); };
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), d)}i`;
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
/** Smallest eigenvalue of a real symmetric matrix (cyclic Jacobi). */
function minEigSym(A) {
  const n = A.length, a = A.map((r) => r.slice());
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
    }
  }
  return Math.min(...a.map((r, i) => r[i]));
}

export default {
  book: 'fa',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.24
    {
      num: '11.24',
      kind: 'Lemma',
      name: 'Hermitian square roots of e − x',
      statement: String.raw`Let $A$ be a Banach algebra with an involution, and let $x\in A$ be hermitian with $\rho(x)<1$. Then there is a hermitian $y\in A$, commuting with $x$, such that
$$y^2=e-x .$$`,
      idea: String.raw`Take the binomial series of $\sqrt{1-t}$: $y=\sum_{n\ge0}\binom{1/2}{n}(-x)^n$. Its coefficients are $O(n^{-3/2})$ and $\norm{x^n}^{1/n}\to\rho(x)<1$ (10.13), so the series converges absolutely in $A$. Multiplying two absolutely convergent series of powers of $x$ obeys the same Cauchy-product identity as for numbers, so $y^2=e-x$. Each partial sum is a real polynomial in the hermitian $x$, hence hermitian, and so is the limit (11.15). This lemma is how positivity is propagated without any norm condition on the involution: if $F$ is positive, $F(e-x)=F(yy^*)\ge0$.`,
      caption: String.raw`$x$ a real symmetric $2\times2$ matrix with eigenvalues $t_1,t_2$ (drag them on the axis) in an eigenbasis turned by $\theta$. Top: $\sqrt{1-t}$ (green) and the partial sum $s_N(t)$ of its binomial series (gold); $y_N=s_N(x)$ acts on each eigenvector by $s_N(t_k)$. Bottom: the matrix error $\norm{y_N^2-(e-x)}$ against $N$, from actual matrix powers. It decays geometrically when $\rho(x)<1$, only like $N^{-1/2}$ at $\rho(x)=1$, and the series diverges once an eigenvalue leaves $[-1,1]$.`,
      deps: ['fa-11.14', 'fa-10.13', 'fa-11.15'],
      tags: ['involutions', 'square roots', 'power series'],
      verify: true,
      viz(v) {
        const M = v.M;
        const thS = v.slider('eigenbasis angle $\\theta$', 0, Math.PI, 0.6, { step: 0.01 });
        const NS = v.slider('partial sum $N$', 0, 60, 8, { int: true });
        const T = v.stage({ x: [-1.6, 1.6], y: [-0.6, 2.2], height: 250, full: true, axes: true, xlabel: 't', title: '$\\sqrt{1-t}$ and $s_N(t)=\\sum_{n\\le N}\\binom{1/2}{n}(-t)^n$' });
        const B = v.stage({ x: [0, 60], y: [-16, 2], height: 210, full: true, axes: 'box', xlabel: 'N', yticks: [[-15, '10⁻¹⁵'], [-10, '10⁻¹⁰'], [-5, '10⁻⁵'], [0, '1']], title: '$\\|y_N^2-(e-x)\\|$ (log scale)' });
        const h1 = T.handle(-0.55, 0, { color: 'red', label: 't₁', labelPos: 's', constrain: (x) => [M.clamp(x, -1.5, 1.5), 0] });
        const h2 = T.handle(0.8, 0, { color: 'red', label: 't₂', labelPos: 's', constrain: (x) => [M.clamp(x, -1.5, 1.5), 0] });
        const bin = [1]; for (let n = 1; n <= 80; n++) bin.push(bin[n - 1] * (0.5 - n + 1) / n);
        const sN = (t, N) => { let s = 0, p = 1; for (let n = 0; n <= N; n++) { s += bin[n] * p; p *= -t; } return s; };
        let st = {};
        v.legend([['green', '$\\sqrt{1-t}$'], ['gold', '$s_N(t)$'], ['red', 'eigenvalues of $x$'], ['ink', 'matrix error']]);
        v.render(() => {
          const t1 = h1.x, t2 = h2.x, th = thS.value, N = NS.value, c = Math.cos(th), s = Math.sin(th);
          const R = [[c, -s], [s, c]], X = mul2(mul2(R, [[t1, 0], [0, t2]]), tr2(R));
          T.vband(-1, 1, { color: 'green', alpha: 0.06 });
          T.fn((t) => (t <= 1 ? Math.sqrt(1 - t) : NaN), { color: 'green', width: 2.6 });
          T.fn((t) => M.clamp(sN(t, N), -5, 5), { color: 'gold', width: 2.2, n: 500 });
          [t1, t2].forEach((t) => { T.vline(t, { color: 'red', width: 1, dash: [3, 3] }); const y = sN(t, N); if (Math.abs(y) < 2.2) T.dot(t, y, { color: 'gold', r: 4 }); });
          // matrix partial sums y_N = Σ binom(1/2,n) (−X)^n and their errors
          const errs = []; let Y = [[0, 0], [0, 0]], P = I2, yN = null;
          const E = add2(I2, sc2(X, -1));
          for (let n = 0; n <= 60; n++) {
            Y = add2(Y, sc2(P, bin[n])); P = mul2(P, sc2(X, -1));
            const D = add2(mul2(Y, Y), sc2(E, -1)); errs.push(Math.log10(Math.max(1e-16, norm2(D))));
            if (n === N) yN = Y;
          }
          B.path(errs.map((e, n) => [n, M.clamp(e, -16, 2)]), { color: 'ink', width: 2.2 });
          B.dot(N, M.clamp(errs[N], -16, 2), { color: 'gold', r: 5 });
          const rho = Math.max(Math.abs(t1), Math.abs(t2));
          st = { rho, err: 10 ** errs[N], asym: Math.abs(yN[0][1] - yN[1][0]), N };
        });
        v.readout(() => {
          const s = st;
          return `$\\rho(x)=${v.fix(s.rho, 3)}$. $\\|y_{${s.N}}^2-(e-x)\\|=${v.sci(s.err, 2)}$; $y_N$ is symmetric ($|y_{12}-y_{21}|=${v.fix(s.asym, 3)}$). ` + (s.rho < 1 ? 'The series converges geometrically.' : s.rho < 1.0001 ? 'At $\\rho(x)=1$ it still converges, but slowly.' : 'An eigenvalue lies outside $[-1,1]$: the series diverges.');
        });
      },
    },
    // ------------------------------------------------------------------ 11.25
    {
      num: '11.25',
      kind: 'Theorem',
      name: 'Positive elements of a B*-algebra form a closed convex cone',
      statement: String.raw`Let $A$ be a $B^*$-algebra and $x\in A$ hermitian. The following are equivalent:
(a) $\sigma(x)\subset[0,\infty)$;
(b) $\norm{te-x}\le t$ for some (equivalently, every) $t\ge\norm x$;
(c) $x=h^2$ for some hermitian $h$, which may be chosen with $\sigma(h)\subset[0,\infty)$, and is then unique.
Such $x$ are called **positive**. They form a closed convex cone: sums and nonnegative multiples of positive elements are positive.`,
      idea: String.raw`Work in the closed $*$-subalgebra generated by $x$ and $e$, which is a commutative $B^*$-algebra, hence $C(\sigma(x))$ by 11.18 (the spectrum is real, so it is the same in $A$, by 10.18). There (a)$\Leftrightarrow$(b) says that $|t-\lambda|\le t$ on $\sigma(x)\subset[-t,t]$ exactly when $\lambda\ge0$, and (c) is $h=\sqrt{\hat x}$. Convexity uses (b), which needs no commutativity: $\norm{(s+t)e-(x+y)}\le\norm{se-x}+\norm{te-y}\le s+t$. Closedness is clear from (b).`,
      caption: String.raw`Real symmetric $2\times2$ matrices $\begin{pmatrix}a&b\\b&c\end{pmatrix}$ as points of $\R^3$, with coordinates $\big(\frac{a-c}2,\,b,\,\frac{a+c}2\big)$. The positive ones fill the round cone (drag to rotate). Set $x$ with the sliders; $y$ is a fixed positive matrix. The segment from $x$ to $y$ and the point $x+y$ stay in the cone whenever $x$ does. Right: criterion (b). With $t=\norm x$, $\norm{te-x}\le t$ exactly when $\sigma(x)$ lies in $[0,2t]$ (green).`,
      deps: ['fa-11.18', 'fa-10.18', 'fa-11.24'],
      tags: ['B*-algebras', 'positive elements', 'cones'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('$a$', -1, 1.5, 0.9, { step: 0.01 });
        const bS = v.slider('$b$', -1, 1, 0.35, { step: 0.01 });
        const cS = v.slider('$c$', -1, 1.5, 0.3, { step: 0.01 });
        const S3 = v.stage3d({ range: 1.95, height: 360, yaw: -0.8, pitch: 0.3, axisLength: 1.45, labels: ['(a−c)/2', 'b', '(a+c)/2'], title: 'the cone of positive matrices' });
        const R = v.stage({ x: [-1.6, 3.4], y: [-1, 1], height: 360, weight: 0.8, axes: false, ticks: false, title: 'criterion (b): $\\|te-x\\|\\le t$, $t=\\|x\\|$' });
        const Ym = [[0.25, -0.3], [-0.3, 0.9]];
        const coord = (X) => [(X[0][0] - X[1][1]) / 2, X[0][1], (X[0][0] + X[1][1]) / 2];
        let st = {};
        v.legend([['blue', '$x$'], ['purple', '$y$'], ['green', '$x+y$; segment $[x,y]$']]);
        v.render(() => {
          const X = [[aS.value, bS.value], [bS.value, cS.value]], XY = add2(X, Ym);
          S3.surface((u, p) => [u * Math.cos(p), u * Math.sin(p), u], [0, 1.35], [0, 2 * Math.PI], { n: 26, color: 'green', alpha: 0.18, wire: true, shade: false });
          const px = coord(X), py = coord(Ym), ps = coord(XY);
          const sx = sym2(X), pos = sx.l[0] >= -1e-12, ssum = sym2(XY);
          S3.line([px[0], px[1], 0], px, { color: 'blue', width: 1, dash: [3, 3] });
          S3.line(px, py, { color: pos ? 'green' : 'red', width: 2.4 });
          S3.dot(px, { color: pos ? 'blue' : 'red', r: 6, label: 'x' });
          S3.dot(py, { color: 'purple', r: 5.5, label: 'y' });
          S3.dot(ps, { color: ssum.l[0] >= -1e-12 ? 'green' : 'red', r: 5.5, label: 'x+y' });
          // right: the real line with σ(x) and the interval [0, 2t]
          const t = Math.max(Math.abs(sx.l[0]), Math.abs(sx.l[1])), sc = 2.6 / Math.max(2 * t, 1);
          const X0 = (lam) => -0.8 + (lam + 0.6) * sc * 1.0;
          R.line(-1.6, 0, 3.4, 0, { color: 'muted', width: 1.2 });
          R.rect(X0(0), -0.12, X0(2 * t), 0.12, { color: 'green', fill: 'green', fillAlpha: 0.2 });
          R.text('0', X0(0), -0.3, { color: 'muted', size: 12 }); R.text('2t', X0(2 * t), -0.3, { color: 'muted', size: 12 }); R.text('t', X0(t), -0.3, { color: 'muted', size: 12 });
          R.dot(X0(t), 0, { color: 'orange', r: 4 });
          sx.l.forEach((l, k) => R.dot(X0(l), 0, { color: l >= -1e-12 ? 'blue' : 'red', r: 6, label: `λ${'₁₂'[k]}`, labelPos: k ? 'ne' : 'nw' }));
          const nte = Math.max(Math.abs(t - sx.l[0]), Math.abs(t - sx.l[1]));
          R.text(`‖te − x‖ = ${v.fmt(nte, 3)}`, 0.9, 0.62, { color: nte <= t + 1e-12 ? 'green' : 'red', size: 13 });
          R.text(`t = ${v.fmt(t, 3)}`, 0.9, 0.42, { color: 'orange', size: 13 });
          const h = pos ? add2(sc2([[sx.v[0][0] ** 2, sx.v[0][0] * sx.v[0][1]], [sx.v[0][0] * sx.v[0][1], sx.v[0][1] ** 2]], Math.sqrt(Math.max(0, sx.l[0]))), sc2([[sx.v[1][0] ** 2, sx.v[1][0] * sx.v[1][1]], [sx.v[1][0] * sx.v[1][1], sx.v[1][1] ** 2]], Math.sqrt(Math.max(0, sx.l[1])))) : null;
          const herr = h ? norm2(add2(mul2(h, h), sc2(X, -1))) : NaN;
          st = { l: sx.l, pos, nte, t, h, herr, lsum: ssum.l[0] };
        });
        v.readout(() => {
          const s = st;
          return `$\\sigma(x)=\\{${v.fix(s.l[0], 3)},\\,${v.fix(s.l[1], 3)}\\}$: ` + (s.pos ? `**positive**; $\\|te-x\\|=${v.fix(s.nte, 3)}\\le t$, and $h=\\sqrt x$ satisfies $\\|h^2-x\\|=${v.sci(s.herr + 1e-17, 1)}$.` : `not positive; $\\|te-x\\|=${v.fix(s.nte, 3)}>t=${v.fix(s.t, 3)}$.`) + ` Smallest eigenvalue of $x+y$: $${v.fix(s.lsum, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.26
    {
      num: '11.26',
      kind: 'Lemma',
      name: 'σ(xy) and σ(yx) agree off 0; σ(xx*) ≤ 0 forces x = 0',
      statement: String.raw`(a) In every Banach algebra, $\sigma(xy)\cup\{0\}=\sigma(yx)\cup\{0\}$.
(b) If $A$ is a $B^*$-algebra, $x\in A$, and $\sigma(xx^*)\subset(-\infty,0]$, then $x=0$.`,
      idea: String.raw`(a) If $\lambda\ne0$ and $u=(\lambda e-xy)^{-1}$, then $\lambda^{-1}(e+yux)$ inverts $\lambda e-yx$, as one checks by multiplying out. (b) Write $x=u+iv$ with $u,v$ hermitian (11.15). Then $x^*x=2u^2+2v^2-xx^*$. Both $u^2$ and $v^2$ are positive, and so is $-xx^*$ by hypothesis, so $x^*x$ is positive by the cone property 11.25. By (a), $\sigma(xx^*)$ then lies in $[0,\infty)$ as well as in $(-\infty,0]$. So $\sigma(xx^*)=\{0\}$, and $\norm x^2=\norm{xx^*}=\rho(xx^*)=0$ for the hermitian $xx^*$.`,
      caption: String.raw`Part (a) with rectangular matrices: $x$ is $2\times3$ and $y$ is $3\times2$, so $xy$ is $2\times2$ and $yx$ is $3\times3$. Their eigenvalues (filled purple: $xy$; orange rings: $yx$) coincide, except that $yx$ has one extra eigenvalue $0$. Move along the family with the slider or resample. Switch to $y=x^*$: then both $xx^*$ and $x^*x$ have their spectra on $[0,\infty)$, which is the content of (b) for matrices.`,
      deps: ['fa-10.10', 'fa-11.15', 'fa-11.25'],
      tags: ['spectrum', 'B*-algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        let rng = v.rng(7);
        const randM = (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => [rng.uniform(-1, 1), rng.uniform(-1, 1)]));
        let X0 = randM(2, 3), X1 = randM(2, 3), Y0 = randM(3, 2);
        const mode = v.select('$y=$', [{ value: 'free', label: 'independent' }, { value: 'star', label: '$x^*$' }], 'free');
        const sS = v.slider('family parameter $s$', -1, 1, 0.3, { step: 0.005 });
        v.button('Resample', () => { rng = v.rng(Math.floor(Math.random() * 1e9)); X0 = randM(2, 3); X1 = randM(2, 3); Y0 = randM(3, 2); });
        const S = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 360, axes: true, title: 'eigenvalues of $xy$ ($2\\times2$) and $yx$ ($3\\times3$)' });
        let st = {};
        v.legend([['purple', '$\\sigma(xy)$', { dot: true }], ['orange', '$\\sigma(yx)$ (rings)'], ['green', '$[0,\\infty)$']]);
        v.render(() => {
          const s = sS.value, star = mode.value === 'star';
          const x = X0.map((r, i) => r.map((z, j) => cadd(z, [X1[i][j][0] * s, X1[i][j][1] * s])));
          const y = star ? mstar(x) : Y0;
          const e1 = eigC(mmul(x, y)), e2 = eigC(mmul(y, x));
          const ext = Math.max(2, 1.2 * Math.max(...[...e1, ...e2].map((z) => Math.max(Math.abs(z[0]) * 0.75, Math.abs(z[1])))));
          S.setView([-ext * 1.5, ext * 1.5], [-ext, ext]);
          if (star) S.line(0, 0, ext * 1.5, 0, { color: 'green', width: 5, alpha: 0.35 });
          e2.forEach((z) => S.dot(z[0], z[1], { color: 'orange', r: 9, hollow: true }));
          e1.forEach((z) => S.dot(z[0], z[1], { color: 'purple', r: 4.5 }));
          const extra = e2.slice().sort((a, b) => cabs(a) - cabs(b))[0];
          const match = Math.max(...e1.map((z) => Math.min(...e2.map((w) => cabs(csub(z, w))))));
          st = { e1, e2, extra, match, star, imMax: Math.max(...[...e1, ...e2].map((z) => Math.abs(z[1]))), reMin: Math.min(...[...e1, ...e2].map((z) => z[0])) };
        });
        v.readout(() => {
          const s = st;
          const base = `$\\sigma(xy)=\\{${s.e1.map((z) => fmtC(v, z)).join(',\\;')}\\}$; the eigenvalues of $yx$ match them to within $${v.sci(s.match + 1e-17, 1)}$, plus the extra eigenvalue $${fmtC(v, s.extra)}$.`;
          return base + (s.star ? ` With $y=x^*$ all eigenvalues are real ($|\\mathrm{Im}|\\le${v.sci(s.imMax + 1e-17, 1)}$) and $\\ge${v.fix(s.reMin, 4)}$.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 11.28
    {
      num: '11.28',
      kind: 'Theorem',
      name: 'Spectral facts in B*-algebras: σ(yy*) ⊂ [0,∞)',
      statement: String.raw`Let $A$ be a $B^*$-algebra. Then:
(a) hermitian elements have real spectra;
(b) if $x$ is normal, then $\rho(x)=\norm x$;
(c) $\rho(yy^*)=\norm y^2$ for every $y\in A$;
(d) if $u,v$ are hermitian with $\sigma(u),\sigma(v)\subset[0,\infty)$, then $\sigma(u+v)\subset[0,\infty)$;
(e) $\sigma(yy^*)\subset[0,\infty)$ for every $y\in A$;
(f) $e+yy^*$ is invertible for every $y\in A$.`,
      idea: String.raw`(a) If $x=x^*$, then $e^{itx}$ is unitary, so its spectrum lies on $\T$ and $\sigma(x)\subset\R$ by the spectral mapping theorem. (b) For normal $x$, the $B^*$ identity gives $\norm{x^{2}}^2=\norm{(xx^*)(xx^*)^*}=\norm{xx^*}^2=\norm x^4$, so $\norm{x^{2^k}}=\norm x^{2^k}$ and $\rho(x)=\norm x$. (c) is (b) for the hermitian $yy^*$ combined with $\norm{yy^*}=\norm y^2$. (d) is the cone property 11.25. (e) Let $f=\max(\cdot,0)$ and $g=\max(-\,\cdot,0)$ on $\sigma(yy^*)$ and $z=y\,g(yy^*)^{1/2}$. Then $zz^*=-g(yy^*)^2$ has spectrum in $(-\infty,0]$, so $z=0$ by 11.26, hence $g=0$. (f) follows from (e).`,
      caption: String.raw`$A=M_2(\R)$ acting on the plane. Drag the columns $ye_1$, $ye_2$ of $y$. Left: the unit circle and its image under $y$; the semi-axes (grey) are the singular values $s_1\ge s_2$. Right: $\sigma(yy^*)=\{s_1^2,s_2^2\}$ (green) always lies in $[0,\infty)$, and $\sigma(e+yy^*)$ (teal) lies in $[1,\infty)$. The orange tick is $\norm y^2$ and the purple tick is $\norm{yy^*}$. With the operator norm (a $B^*$ norm) both sit on the largest green dot: $\rho(yy^*)=\norm{yy^*}=\norm y^2$. Switch to the max-column-sum norm, a perfectly good Banach-algebra norm that is not a $B^*$ norm, and (c) fails.`,
      deps: ['fa-11.18', 'fa-11.25', 'fa-11.26', 'fa-10.28'],
      tags: ['B*-algebras', 'positive elements', 'spectrum'],
      verify: true,
      viz(v) {
        const M = v.M;
        const nrm = v.select('norm on $M_2$', [{ value: 'op', label: 'operator norm ($B^*$)' }, { value: 'l1', label: 'max column sum' }], 'op');
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 340, axes: true, title: 'unit circle and its image under $y$' });
        const R = v.stage({ x: [-0.5, 6], y: [-1, 1], height: 340, axes: false, ticks: false, title: 'spectra and norms on $\\R$' });
        const h1 = L.handle(1.3, 0.4, { color: 'blue', label: 'ye₁' });
        const h2 = L.handle(0.7, 0.9, { color: 'purple', label: 'ye₂' });
        let st = {};
        v.legend([['green', '$\\sigma(yy^*)$'], ['teal', '$\\sigma(e+yy^*)$'], ['orange', '$\\|y\\|^2$'], ['purple', '$\\|yy^*\\|$']]);
        v.render(() => {
          const Y = [[h1.x, h2.x], [h1.y, h2.y]], YY = mul2(Y, tr2(Y)), sy = sym2(YY), sv = sy.l.map((l) => Math.sqrt(Math.max(0, l)));
          L.circle(0, 0, 1, { color: 'muted', width: 1.4, dash: [4, 4] });
          L.curve((t) => [Y[0][0] * Math.cos(t) + Y[0][1] * Math.sin(t), Y[1][0] * Math.cos(t) + Y[1][1] * Math.sin(t)], 0, 2 * Math.PI, { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.08 });
          // semi-axes: left singular vectors = eigenvectors of yy*
          sy.v.forEach((u, k) => L.line(-sv[k] * u[0], -sv[k] * u[1], sv[k] * u[0], sv[k] * u[1], { color: 'ink', width: 1.4, alpha: 0.6 }));
          L.line(0, 0, h1.x, h1.y, { color: 'blue', width: 1, alpha: 0.5 }); L.line(0, 0, h2.x, h2.y, { color: 'purple', width: 1, alpha: 0.5 });
          const op = nrm.value === 'op', ny = op ? norm2(Y) : norm1(Y), nyy = op ? norm2(YY) : norm1(YY), rYY = sy.l[1];
          const hi = Math.max(6, ny * ny, nyy, 1 + rYY) * 1.08;
          R.setView([-0.06 * hi, hi], [-1, 1]);
          R.rect(-0.06 * hi, -0.08, 0, 0.08, { color: 'red', fill: 'red', fillAlpha: 0.25, stroke: false });
          R.line(-0.06 * hi, 0, hi, 0, { color: 'muted', width: 1.2 });
          for (let k = 0; k <= Math.floor(hi); k++) R.text(String(k), k, -0.18, { color: 'muted', size: 11 });
          R.vline(ny * ny, { color: 'orange', width: 2.2, dash: [6, 4] });
          R.vline(nyy, { color: 'purple', width: 2.2, dash: [2, 3] });
          sy.l.forEach((l) => { R.dot(l, 0.32, { color: 'green', r: 6 }); R.dot(1 + l, -0.42, { color: 'teal', r: 6 }); });
          R.text('σ(yy*)', 0.02 * hi, 0.55, { color: 'green', size: 12, align: 'left' });
          R.text('σ(e+yy*)', 0.02 * hi, -0.65, { color: 'teal', size: 12, align: 'left' });
          const rY = rho2(Y);
          st = { op, ny, nyy, rYY, l: sy.l, rY };
        });
        v.readout(() => {
          const s = st;
          return `$\\sigma(yy^*)=\\{${v.fix(s.l[0], 3)},\\,${v.fix(s.l[1], 3)}\\}\\subset[0,\\infty)$, so $e+yy^*$ is invertible. $\\rho(yy^*)=${v.fix(s.rYY, 3)}$, $\\|yy^*\\|=${v.fix(s.nyy, 3)}$, $\\|y\\|^2=${v.fix(s.ny * s.ny, 3)}$` + (s.op ? ' — equal, as (c) says.' : ' — with this norm (c) fails: it is not a $B^*$ norm.') + ` Also $\\rho(y)=${v.fix(s.rY, 3)}$ vs $\\|y\\|=${v.fix(s.ny, 3)}$: equal only when $y$ is normal (b).`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.30
    {
      num: '11.30',
      kind: 'Definition',
      name: 'Positive functionals and states',
      statement: String.raw`Let $A$ be a Banach algebra with unit and involution. A linear functional $F$ on $A$ is **positive** if
$$F(xx^*)\ge0\qquad(x\in A),$$
and a positive $F$ with $F(e)=1$ is a **state**. On $C(K)$ the positive functionals are the positive measures and the states are the probability measures; on $M_n(\C)$, $F(x)=\operatorname{tr}(\rho x)$ with a density matrix $\rho\ge0$, $\operatorname{tr}\rho=1$.`,
      idea: String.raw`Positivity is an algebraic condition. 11.31 shows that it forces boundedness and $\norm F=F(e)$ in a $B^*$-algebra, so states are exactly the functionals of norm $1$ with $F(e)=1$. States are the noncommutative probability measures, and the GNS construction (12.41) turns each one into a Hilbert-space representation.`,
      caption: String.raw`Functionals $F_\rho(x)=\operatorname{tr}(\rho x)$ on real symmetric $2\times2$ matrices, with $\rho=\frac12\begin{pmatrix}1+r_z&r_x\\r_x&1-r_z\end{pmatrix}$, so $F_\rho(e)=1$. Drag the Bloch vector $r$. $F_\rho$ is positive, a state, exactly when $|r|\le1$ (green disc; pure states on the circle). Outside, the eigenvalue $\frac{1-|r|}2$ of $\rho$ is negative, and its eigenvector $u$ gives a witness $g=uu^{T}$ with $F_\rho(gg^*)<0$. Dotted: level lines of $r\mapsto F_\rho(x)$ for a hermitian $x$ with eigenvalues $\lambda_1,\lambda_2$ (turn its eigenbasis with the slider). Right: all states take values $F(x)\in[\lambda_1,\lambda_2]$.`,
      deps: ['fa-11.14'],
      tags: ['positive functionals', 'states'],
      verify: true,
      viz(v) {
        const M = v.M;
        const thS = v.slider('eigenbasis of $x$: angle', 0, Math.PI, 0.4, { step: 0.01 });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 320, axes: true, title: 'Bloch vectors $r$; states = the disc' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1, 1], height: 320, weight: 0.8, axes: false, ticks: false, title: '$F_\\rho(x)$ for $x$ with $\\sigma(x)=\\{-1,\\,\\frac12\\}$' });
        const hr = L.handle(0.55, 0.35, { color: 'blue', label: 'r' });
        let st = {};
        v.legend([['green', 'states ($|r|\\le1$)', { area: true }], ['red', 'not positive']]);
        v.render(() => {
          const rx = hr.x, rz = hr.y, rr = Math.hypot(rx, rz), pos = rr <= 1 + 1e-12;
          const rho = [[(1 + rz) / 2, rx / 2], [rx / 2, (1 - rz) / 2]];
          L.circle(0, 0, 1, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.12 });
          L.tex('r_x', 1.62, -0.16, { color: 'muted', size: 14 }); L.tex('r_z', 0.16, 1.6, { color: 'muted', size: 14 });
          L.arrow(0, 0, rx, rz, { color: pos ? 'blue' : 'red', width: 2 });
          const th = thS.value, c = Math.cos(th), s = Math.sin(th);
          const X = mul2(mul2([[c, -s], [s, c]], [[-1, 0], [0, 0.5]]), tr2([[c, -s], [s, c]]));
          const Fx = rho[0][0] * X[0][0] + 2 * rho[0][1] * X[0][1] + rho[1][1] * X[1][1];
          // level lines of r ↦ F_ρ(x) (affine in r)
          for (let lev = -1; lev <= 0.5 + 1e-9; lev += 0.25) {
            // F = (X11+X22)/2 + rz (X11−X22)/2 + rx X12
            const A = X[0][1], B = (X[0][0] - X[1][1]) / 2, C0 = (X[0][0] + X[1][1]) / 2;
            const nn = Math.hypot(A, B); if (nn < 1e-9) continue;
            const d = (lev - C0) / nn, ux = A / nn, uz = B / nn;
            L.line(d * ux - 2 * uz, d * uz + 2 * ux, d * ux + 2 * uz, d * uz - 2 * ux, { color: 'muted', width: 1, alpha: 0.45, dash: [2, 3] });
          }
          const ev = sym2(rho), u = ev.v[0], wit = ev.l[0];      // g = u uᵀ ⇒ F(g g*) = λ_min(ρ)
          if (!pos) L.line(-u[0] * 0.4 + rx, -u[1] * 0.4 + rz, u[0] * 0.4 + rx, u[1] * 0.4 + rz, { color: 'red', width: 2 });
          // right: the interval [λ1, λ2] and the value F(x)
          R.line(-1.5, 0, 1.5, 0, { color: 'muted', width: 1.2 });
          R.rect(-1, -0.1, 0.5, 0.1, { color: 'green', fill: 'green', fillAlpha: 0.2 });
          R.text('λ₁ = −1', -1, -0.3, { color: 'muted', size: 12 }); R.text('λ₂ = ½', 0.5, -0.3, { color: 'muted', size: 12 });
          R.dot(M.clamp(Fx, -1.55, 1.55), 0, { color: pos ? 'blue' : 'red', r: 6, label: 'F(x)' });
          st = { rr, pos, Fx, wit, ev: ev.l };
        });
        v.readout(() => {
          const s = st;
          return `$|r|=${v.fix(s.rr, 3)}$, eigenvalues of $\\rho$: $${v.fix(s.ev[0], 3)}$, $${v.fix(s.ev[1], 3)}$; $F_\\rho(e)=1$, $F_\\rho(x)=${v.fix(s.Fx, 3)}$. ` + (s.pos ? '**A state**: $F_\\rho(gg^*)=\\operatorname{tr}(\\rho gg^*)\\ge0$ for every $g$.' : `**Not positive**: the witness $g=uu^T$ gives $F_\\rho(gg^*)=${v.fix(s.wit, 3)}<0$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 11.32
    {
      num: '11.32',
      kind: 'Theorem',
      name: 'Positive functionals on commutative B*-algebras are measures',
      statement: String.raw`Let $A$ be a commutative $B^*$-algebra with maximal ideal space $\Delta$. For every positive linear functional $F$ on $A$ there is a unique positive regular Borel measure $\mu$ on $\Delta$ such that
$$F(x)=\int_\Delta\hat x\,d\mu\qquad(x\in A),$$
and $\mu(\Delta)=F(e)=\norm F$.`,
      idea: String.raw`By Gelfand–Naimark (11.18), $x\mapsto\hat x$ is an isometric $*$-isomorphism onto $C(\Delta)$, so $\Phi=F\circ\Gamma^{-1}$ is a linear functional on $C(\Delta)$. It is positive in the usual sense: every $f\ge0$ is $|g|^2=g\bar g$ with $g=\sqrt f$, and $\Phi(g\bar g)=F(yy^*)\ge0$. The Riesz representation theorem produces $\mu\ge0$, and $\norm F=\mu(\Delta)=F(e)$ agrees with 11.31(d). Uniqueness is the uniqueness part of Riesz.`,
      caption: String.raw`$A=C[0,1]$, so $\Delta=[0,1]$ and $\hat x=x$. The functional is $F(f)=\int f\,d\mu$ with $\mu=c\,dt+\sum_kw_k\delta_{t_k}$; drag the atoms (position and weight) and set $c$. Test $F$ on $|g|^2$ for the bump $g$ (centre $s$, width $\varepsilon$). The bottom curve recovers $\mu$ from $F$ alone, as $F(\varphi_{s,\varepsilon})/\int\varphi_{s,\varepsilon}$ for narrow bumps $\varphi$. Give an atom negative weight and $F$ stops being positive: a narrow $g$ on that atom has $F(|g|^2)<0$, and the recovered measure dips below zero.`,
      deps: ['fa-11.31', 'fa-11.18', 'rca-2.14'],
      tags: ['positive functionals', 'Riesz representation', 'B*-algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const cS = v.slider('density $c$', 0, 2, 0.6, { step: 0.01 });
        const eS = v.slider('bump width $\\varepsilon$', 0.02, 0.3, 0.08, { step: 0.005 });
        const T = v.stage({ x: [0, 1], y: [-1.2, 2.1], height: 260, full: true, axes: true, title: 'the measure $\\mu$ (bars: atoms, band: density) and $|g|^2$' });
        const B = v.stage({ x: [0, 1], y: [-4, 8], height: 200, full: true, axes: true, title: 'recovered from $F$: $F(\\varphi_{s,\\varepsilon})/\\int\\varphi_{s,\\varepsilon}$' });
        const A = [[0.22, 0.8], [0.55, 0.5], [0.8, 1.1]].map(([t, w], k) => T.handle(t, w, { color: 'blue', r: 6, label: `w${'₁₂₃'[k]}`, constrain: (x, y) => [M.clamp(x, 0.03, 0.97), M.clamp(y, -1, 1.5)] }));
        const hs = T.handle(0.4, 0, { color: 'gold', label: 's', labelPos: 's', constrain: (x) => [M.clamp(x, 0, 1), 0] });
        const bump = (x, s, e) => { const u = (x - s) / e; return Math.abs(u) < 1 ? Math.exp(-1 / (1 - u * u)) : 0; };
        let st = {};
        v.legend([['blue', '$\\mu$'], ['gold', '$|g|^2$'], ['green', 'recovered density (positive)'], ['red', 'negative part']]);
        v.render(() => {
          const c = cS.value, eps = eS.value, s = hs.x, atoms = A.map((h) => [h.x, h.y]);
          const F = (f) => c * M.integrate(f, 0, 1, 2000) + atoms.reduce((acc, [t, w]) => acc + w * f(t), 0);
          T.hband(0, c, { color: 'blue', alpha: 0.12 });
          T.hline(c, { color: 'blue', width: 1.2, dash: [4, 3] });
          atoms.forEach(([t, w]) => T.line(t, 0, t, w, { color: w >= 0 ? 'blue' : 'red', width: 4 }));
          const g2 = (x) => bump(x, s, eps) ** 2 / Math.exp(-2);
          T.fn(g2, { color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.2, n: 800 });
          const val = F(g2);
          // recovered density, with a fixed narrow recovery width
          const er = 0.02, xs = M.linspace(0, 1, 401), norm = M.integrate((x) => bump(x, 0.5, er), 0.5 - er, 0.5 + er, 200);
          const rec = xs.map((x) => F((y) => bump(y, x, er)) / norm);
          B.setView(null, span([...rec.map((r) => M.clamp(r, -30, 60)), 0, c * 1.5], 2, 0.1));
          B.hline(c, { color: 'blue', width: 1, dash: [4, 3] });
          B.path(xs.map((x, i) => [x, rec[i]]), { color: 'green', width: 2.2 });
          B.path(xs.map((x, i) => [x, rec[i] < 0 ? rec[i] : null]).map((p) => (p[1] === null ? null : p)), { color: 'red', width: 2.6 });
          const mass = c + atoms.reduce((a2, [, w]) => a2 + w, 0), pos = atoms.every(([, w]) => w >= 0);
          st = { val, mass, pos };
        });
        v.readout(() => {
          const s = st;
          return `$F(|g|^2)=${v.fix(s.val, 4)}$, $F(e)=\\mu([0,1])=${v.fix(s.mass, 3)}$. ` + (s.pos ? '$\\mu\\ge0$: $F$ is positive and $\\|F\\|=F(e)$.' : (s.val < 0 ? '**$F$ is not positive**: this $g$ is a witness.' : 'An atom is negative, so $F$ is not positive: move $g$ onto it and narrow it.'));
        });
      },
    },
    // ------------------------------------------------------------------ 11.33
    {
      num: '11.33',
      kind: 'Theorem',
      name: 'Herglotz–Bochner: positive-definite sequences',
      statement: String.raw`A function $c:\Z\to\C$ is **positive-definite** if $\sum_{j,k}c_{j-k}\,\alpha_j\bar\alpha_k\ge0$ for all finitely supported $(\alpha_j)$. This holds if and only if there is a positive Borel measure $\mu$ on $\T$ with
$$c_n=\int_{\T}e^{-in\theta}\,d\mu(\theta)\qquad(n\in\Z).$$
(The same argument, with $L^1(\R^n)$ in place of $\ell^1(\Z)$, gives Bochner's theorem for continuous positive-definite functions on $\R^n$.)`,
      idea: String.raw`Define $F$ on $\ell^1(\Z)$ by $F(\alpha)=\sum\alpha_nc_n$. With the involution $\alpha^*_n=\overline{\alpha_{-n}}$, $F(\alpha*\alpha^*)=\sum_{j,k}c_{j-k}\alpha_j\bar\alpha_k$, so $c$ is positive-definite exactly when $F$ is positive on the finitely supported elements. Then $|c_n|\le c_0$ (11.31), $F$ extends to a bounded positive functional, and the abstract Bochner theorem (11.32, applied through the symmetric involution on $\Delta=\T$ of 11.13) writes it as $\int\hat\alpha\,d\mu$. The converse is the computation $\sum c_{j-k}\alpha_j\bar\alpha_k=\int|\sum\alpha_je^{-ij\theta}|^2d\mu\ge0$.`,
      caption: String.raw`Real sequences with $c_0=1$, $c_{\pm1}$, $c_{\pm2}$ and $c_n=0$ for $|n|>2$. Drag $(c_1,c_2)$. Such a $c$ is positive-definite exactly when $p(\theta)=1+2c_1\cos\theta+2c_2\cos2\theta\ge0$; the green region is where this holds, and then $\mu=p\,\frac{d\theta}{2\pi}$. Right: $p(\theta)$. Bottom: the smallest eigenvalue of the Toeplitz matrices $[c_{j-k}]_{0\le j,k\le N}$ for $N=1,\dots,24$. They decrease to $\min p$ (Szegő), so they stay $\ge0$ inside the region and eventually go negative outside it.`,
      deps: ['fa-11.32', 'fa-11.13', 'fa-11.31'],
      see: ['rca-11.30'],
      tags: ['positive-definite functions', 'Bochner', 'Fourier coefficients'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 330, axes: true, xlabel: 'c₁', ylabel: 'c₂', title: 'positive-definite $(c_1,c_2)$' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [-1, 3], height: 330, axes: true, xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], xlabel: 'θ', title: '$p(\\theta)=1+2c_1\\cos\\theta+2c_2\\cos2\\theta$' });
        const B = v.stage({ x: [0.5, 24.5], y: [-0.5, 1.2], height: 170, full: true, axes: 'box', xlabel: 'N', xticks: [1, 4, 8, 12, 16, 20, 24], title: '$\\lambda_{\\min}$ of the Toeplitz matrix $[c_{j-k}]_{0\\le j,k\\le N}$' });
        const hc = L.handle(0.3, 0.1, { color: 'blue', label: '(c₁,c₂)' });
        const minP = (c1, c2) => { let m = Infinity; for (let i = 0; i < 360; i++) { const t = 2 * Math.PI * i / 360; m = Math.min(m, 1 + 2 * c1 * Math.cos(t) + 2 * c2 * Math.cos(2 * t)); } return m; };
        let st = {};
        v.legend([['green', '$p\\ge0$: positive-definite', { area: true }], ['ink', '$p(\\theta)$; dotted: $\\min p$'], ['purple', '$\\lambda_{\\min}(T_N)$']]);
        v.render(() => {
          const c1 = hc.x, c2 = hc.y;
          L.raster((a, b) => (minP(a, b) >= 0 ? [40, 170, 90, 70] : null), { key: 'pd', res: 2 });
          const p = (t) => 1 + 2 * c1 * Math.cos(t) + 2 * c2 * Math.cos(2 * t), mp = minP(c1, c2);
          R.setView(null, span([-1, 3, mp, 1 + 2 * Math.abs(c1) + 2 * Math.abs(c2)], 2, 0.06));
          R.hband(R.bounds.y[0], 0, { color: 'red', alpha: 0.06 });
          R.fn(p, { color: 'ink', width: 2.4, fill: mp >= 0 ? 'green' : 'red', fillAlpha: 0.12 });
          const lam = [];
          for (let N = 1; N <= 24; N++) { const T = Array.from({ length: N + 1 }, (_, j) => Array.from({ length: N + 1 }, (_, k) => { const d = Math.abs(j - k); return d === 0 ? 1 : d === 1 ? c1 : d === 2 ? c2 : 0; })); lam.push(minEigSym(T)); }
          B.setView(null, span([...lam, mp, 0, 1], 0.5, 0.12));
          B.hband(B.bounds.y[0], 0, { color: 'red', alpha: 0.06 });
          B.hline(mp, { color: 'ink', width: 1.2, dash: [1, 3] });
          B.path(lam.map((l, i) => [i + 1, l]), { color: 'purple', width: 2 });
          lam.forEach((l, i) => B.dot(i + 1, l, { color: l >= -1e-12 ? 'purple' : 'red', r: 3.5 }));
          st = { mp, lam, c1, c2 };
        });
        v.readout(() => {
          const s = st, last = s.lam[s.lam.length - 1];
          return `$\\min p=${v.fix(s.mp, 4)}$, $\\lambda_{\\min}(T_{24})=${v.fix(last, 4)}$. ` + (s.mp >= 0 ? `Positive-definite: $c_n$ are the Fourier coefficients of $\\mu=p\\,d\\theta/2\\pi\\ge0$ (here $|c_n|\\le c_0=1$).` : `**Not positive-definite**: some Toeplitz quadratic form is negative, and the would-be density $p$ dips below $0$.`);
        });
      },
    },
  ],
};
