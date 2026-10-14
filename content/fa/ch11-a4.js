// Rudin, Functional Analysis — Chapter 11 (part 4): positive elements, square roots, the B*-algebra
// facts behind Gelfand–Naimark, states, and positive functionals as measures (abstract Bochner)
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
      deps: ['fa-11.18', 'fa-10.18', 'fa-11.15'],
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
      kind: 'Theorem',
      name: 'Hermitian square roots',
      statement: String.raw`Let $A$ be a Banach algebra with an involution, let $x\in A$ be hermitian, and suppose that $\sigma(x)$ contains no real number $\lambda\le0$. Then there is a hermitian $y\in A$ with
$$y^2=x ,$$
and $y$ can be taken in the closed subalgebra generated by $e$ and $x$.`,
      idea: String.raw`$\Omega=\C\setminus(-\infty,0]$ is an open set containing $\sigma(x)$, and the principal square root $f(\lambda)=\lambda^{1/2}$ is holomorphic in $\Omega$. The holomorphic functional calculus (10.26, 10.27) gives $y=\tilde f(x)=\frac1{2\pi i}\int_\Gamma\lambda^{1/2}(\lambda e-x)^{-1}d\lambda$, with $y^2=\widetilde{f^2}(x)=x$. Applying the involution to the Cauchy integral replaces $x$ by $x^*$ and $f$ by $\lambda\mapsto\overline{f(\bar\lambda)}$, which is $f$ again for the principal branch. Since $x^*=x$, this gives $y^*=y$. No norm condition on the involution is needed, and in a $B^*$-algebra this is the square root of a positive element.`,
      caption: String.raw`$x$ is a $2\times2$ matrix with eigenvalues $\lambda_1,\lambda_2$ (drag them), either hermitian (real eigenvalues, orthogonal eigenvectors) or general. The square root is computed literally as the Cauchy integral $\frac1{2\pi i}\oint\sqrt\zeta\,(\zeta-x)^{-1}d\zeta$ over the purple circles, which have to avoid the cut $(-\infty,0]$ (red). The readout checks $\norm{y^2-x}$ and $\norm{y-y^*}$, and the green dots are $\sigma(y)=\sqrt{\sigma(x)}$, in the right half-plane. Drag an eigenvalue onto the cut: no contour fits. If $x$ has a negative eigenvalue, it has no hermitian square root at all.`,
      deps: ['fa-10.26', 'fa-10.27', 'fa-10.30', 'fa-11.15'],
      tags: ['involutions', 'square roots', 'functional calculus'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('$x$', [{ value: 'herm', label: 'hermitian' }, { value: 'gen', label: 'general (not normal)' }], 'herm', { onChange: (m) => { if (m === 'herm') H.forEach((h) => h.set(h.x, 0)); } });
        const thS = v.slider('eigenbasis angle', 0, Math.PI, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-2.2, 3.2], y: [-1.7, 1.7], equal: true, height: 360, axes: true, title: '$\\sigma(x)$ (blue), the cut, the contours, $\\sigma(y)$ (green)' });
        const H = [[0.6, 0], [2.2, 0]].map(([a, b], k) => S.handle(a, b, { color: 'blue', r: 6, label: `λ${'₁₂'[k]}`, constrain: (x, y) => [x, mode.value === 'herm' ? 0 : y] }));
        const csq = (z) => { const r = cabs(z), re = Math.sqrt(Math.max(0, (r + z[0]) / 2)), im = Math.sqrt(Math.max(0, (r - z[0]) / 2)); return [re, z[1] < 0 ? -im : im]; };
        const dcut = (z) => (z[0] >= 0 ? cabs(z) : Math.abs(z[1]));
        const m2 = (A, B) => [[cadd(cmul(A[0][0], B[0][0]), cmul(A[0][1], B[1][0])), cadd(cmul(A[0][0], B[0][1]), cmul(A[0][1], B[1][1]))], [cadd(cmul(A[1][0], B[0][0]), cmul(A[1][1], B[1][0])), cadd(cmul(A[1][0], B[0][1]), cmul(A[1][1], B[1][1]))]];
        const star = (A) => [[cconj(A[0][0]), cconj(A[1][0])], [cconj(A[0][1]), cconj(A[1][1])]];
        const fro2 = (A, B) => Math.sqrt([0, 1].reduce((s, i) => s + [0, 1].reduce((t, j) => t + cabs(csub(A[i][j], B[i][j])) ** 2, 0), 0));
        let st = {};
        v.legend([['red', 'the cut $(-\\infty,0]$'], ['purple', 'contour $\\Gamma$'], ['green', '$\\sigma(y)=\\sqrt{\\sigma(x)}$', { dot: true }]]);
        v.render(() => {
          const herm = mode.value === 'herm', L = H.map((h) => [h.x, herm ? 0 : h.y]), th = thS.value, c = Math.cos(th), s = Math.sin(th);
          const Sm = herm ? [[[c, 0], [-s, 0]], [[s, 0], [c, 0]]] : [[[1, 0], [0.9, 0]], [[0.2, 0], [1, 0]]];
          const det = cmul(Sm[0][0], Sm[1][1]), dS = csub(det, cmul(Sm[0][1], Sm[1][0]));
          const Si = [[cdiv(Sm[1][1], dS), cdiv(csub([0, 0], Sm[0][1]), dS)], [cdiv(csub([0, 0], Sm[1][0]), dS), cdiv(Sm[0][0], dS)]];
          const X = m2(m2(Sm, [[L[0], [0, 0]], [[0, 0], L[1]]]), Si);
          S.line(-2.4, 0, 0, 0, { color: 'red', width: 5, alpha: 0.7 });
          const d1 = dcut(L[0]), d2 = dcut(L[1]), sep = cabs(csub(L[0], L[1])), mid = [(L[0][0] + L[1][0]) / 2, (L[0][1] + L[1][1]) / 2], dm = dcut(mid);
          let circles = null;
          if (Math.min(d1, d2) > 0.04) {
            if (dm > 0.5 * sep * 1.25 + 0.03) circles = [[mid, 0.5 * sep + 0.55 * (dm - 0.5 * sep)]];
            else circles = [[L[0], Math.min(0.7 * d1, 0.45 * sep)], [L[1], Math.min(0.7 * d2, 0.45 * sep)]];
          }
          let Y = null;
          if (circles) {
            Y = [[[0, 0], [0, 0]], [[0, 0], [0, 0]]];
            const n = 256;
            for (const [cz, r] of circles) {
              S.circle(cz[0], cz[1], r, { color: 'purple', width: 2 });
              for (let k = 0; k < n; k++) {
                const t = 2 * Math.PI * k / n, e = [Math.cos(t), Math.sin(t)], z = cadd(cz, [r * e[0], r * e[1]]);
                const a = csub(z, X[0][0]), b = csub([0, 0], X[0][1]), cc = csub([0, 0], X[1][0]), d = csub(z, X[1][1]), dt = csub(cmul(a, d), cmul(b, cc));
                const w = cmul(csq(z), [r * e[0] / n, r * e[1] / n]);    // √ζ · dζ/(2πi) with the trapezoid weight 2π/n
                const inv = [[cdiv(d, dt), cdiv(csub([0, 0], b), dt)], [cdiv(csub([0, 0], cc), dt), cdiv(a, dt)]];
                for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) Y[i][j] = cadd(Y[i][j], cmul(w, inv[i][j]));
              }
            }
            const tr = cadd(Y[0][0], Y[1][1]), dY = csub(cmul(Y[0][0], Y[1][1]), cmul(Y[0][1], Y[1][0])), hh = [tr[0] / 2, tr[1] / 2], rt = csq(csub(cmul(hh, hh), dY));
            [cadd(hh, rt), csub(hh, rt)].forEach((z) => S.dot(z[0], z[1], { color: 'green', r: 5 }));
          }
          st = { ok: !!circles, herm, err: Y ? fro2(m2(Y, Y), X) : NaN, asym: Y ? fro2(Y, star(Y)) : NaN, neg: L.some((z) => Math.abs(z[1]) < 1e-9 && z[0] <= 0) };
        });
        v.readout(() => {
          const s = st;
          if (!s.ok) return 'An eigenvalue lies on (or next to) the cut $(-\\infty,0]$: no contour in $\\Omega$ surrounds $\\sigma(x)$.' + (s.neg && s.herm ? ' A hermitian matrix with a negative eigenvalue has no hermitian square root: $y^2$ would have nonnegative eigenvalues.' : '');
          return `$\\|y^2-x\\|=${v.sci(s.err + 1e-17, 1)}$, $\\|y-y^*\\|=${v.sci(s.asym + 1e-17, 1)}$` + (s.herm ? ' — $y$ is hermitian, as the theorem says.' : ' — $x$ is not hermitian here, so neither is $y$; it is still a square root.');
        });
      },
    },
    // ------------------------------------------------------------------ 11.27
    {
      num: '11.27',
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
      idea: String.raw`(a) If $x=x^*$, then $e^{itx}$ is unitary, so its spectrum lies on $\T$ and $\sigma(x)\subset\R$ by the spectral mapping theorem. (b) For normal $x$, the $B^*$ identity gives $\norm{x^{2}}^2=\norm{(xx^*)(xx^*)^*}=\norm{xx^*}^2=\norm x^4$, so $\norm{x^{2^k}}=\norm x^{2^k}$ and $\rho(x)=\norm x$. (c) is (b) for the hermitian $yy^*$ combined with $\norm{yy^*}=\norm y^2$. (d) is the cone property 11.25. (e) Let $a=yy^*$, $f=\max(\cdot,0)$ and $g=\max(-\,\cdot,0)$ on $\sigma(a)$, so $a=f(a)-g(a)$ and $f(a)g(a)=0$. Put $z=g(a)^{1/2}y$. Then $zz^*=g(a)^{1/2}a\,g(a)^{1/2}=-g(a)^2$ has spectrum in $(-\infty,0]$, so $z=0$ by 11.27, hence $g(a)=0$. (f) follows from (e).`,
      caption: String.raw`$A=M_2(\R)$ acting on the plane. Drag the columns $ye_1$, $ye_2$ of $y$. Left: the unit circle and its image under $y$; the semi-axes (grey) are the singular values $s_1\ge s_2$. Right: $\sigma(yy^*)=\{s_1^2,s_2^2\}$ (green) always lies in $[0,\infty)$, and $\sigma(e+yy^*)$ (teal) lies in $[1,\infty)$. The orange tick is $\norm y^2$ and the purple tick is $\norm{yy^*}$. With the operator norm (a $B^*$ norm) both sit on the largest green dot: $\rho(yy^*)=\norm{yy^*}=\norm y^2$. Switch to the max-column-sum norm, a perfectly good Banach-algebra norm that is not a $B^*$ norm, and (c) fails.`,
      deps: ['fa-11.18', 'fa-11.25', 'fa-11.27', 'fa-11.26', 'fa-10.28'],
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
    // ------------------------------------------------------------------ 11.33
    {
      num: '11.33',
      kind: 'Theorem',
      name: 'Positive functionals are measures on Δ (abstract Bochner)',
      statement: String.raw`Let $A$ be a commutative Banach algebra with unit and a **symmetric** involution, meaning $h(x^*)=\overline{h(x)}$ for every $h\in\Delta$ and $x\in A$. Then
$$F(x)=\int_\Delta\hat x\,d\mu\qquad(x\in A)$$
sets up a one-to-one correspondence between the positive linear functionals $F$ on $A$ with $F(e)\le1$ and the positive regular Borel measures $\mu$ on $\Delta$ with $\mu(\Delta)\le1$, and it is isometric: $\norm F=F(e)=\mu(\Delta)$.`,
      idea: String.raw`Symmetry makes $\hat u$ real for hermitian $u$. If $t>\norm{\hat u}_\infty=\rho(u)$, then $\sigma(te-u)\subset(0,2t)$, so $te-u=y^2$ with $y$ hermitian (11.26) and $F(te-u)=F(yy^*)\ge0$. Hence $|F(u)|\le F(e)\norm{\hat u}_\infty$, and with $x=u+iv$ and 11.31 one gets $|F(x)|\le F(e)\norm{\hat x}_\infty$. So $F$ is $\Phi\circ\Gamma$ for a functional $\Phi$ of norm $F(e)$ on $\hat A$, which is dense in $C(\Delta)$ by Stone–Weierstrass, because symmetry makes it closed under conjugation. The Riesz representation theorem turns $\Phi$ into $\mu$. Conversely $\int\widehat{xx^*}d\mu=\int|\hat x|^2d\mu\ge0$. For $\ell^1(\Z)$ this is Herglotz's theorem, and for $L^1(\R^n)$ with a unit adjoined it gives Bochner's theorem on positive-definite functions.`,
      caption: String.raw`Herglotz's theorem, the case $A=\ell^1(\Z)$ with $\alpha^*_n=\overline{\alpha_{-n}}$. This involution is symmetric, with $\Delta=\T$ (11.13). A positive functional is $F(\alpha)=\sum\alpha_nc_n$, where $c$ is **positive-definite**: $\sum c_{j-k}\alpha_j\bar\alpha_k=F(\alpha*\alpha^*)\ge0$. The theorem says $c_n=\int e^{-in\theta}d\mu$ for a positive $\mu$ on $\T$. Take real sequences with $c_0=1$, $c_{\pm1}$, $c_{\pm2}$ and $c_n=0$ for $|n|>2$, and drag $(c_1,c_2)$. Such a $c$ is positive-definite exactly when $p(\theta)=1+2c_1\cos\theta+2c_2\cos2\theta\ge0$ (green region), and then $\mu=p\,\frac{d\theta}{2\pi}$. Right: $p(\theta)$. Bottom: the smallest eigenvalue of the Toeplitz matrices $[c_{j-k}]_{0\le j,k\le N}$ for $N=1,\dots,24$. They decrease to $\min p$ (Szegő), so they stay $\ge0$ inside the region and eventually go negative outside it.`,
      deps: ['fa-11.31', 'fa-11.26', 'fa-11.16', 'fa-11.13', 'pma-7.33', 'rca-2.14'],
      see: ['rca-11.30'],
      tags: ['positive functionals', 'Bochner', 'positive-definite functions'],
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
