// Rudin, Real and Complex Analysis — Chapter 18: Elementary Theory of Banach Algebras
//
// Numbering note: in the 3rd edition the chapter has four sections (Introduction, The Invertible
// Elements, Ideals and Homomorphisms, Applications). The exact paragraph numbers below could not be
// checked against the book, so every item except 18.1 carries `verify: true`.

// ---------------------------------------------------------------- helpers shared by this file
// Largest eigenvalue of a 3×3 Hermitian matrix with real diagonal d1,d2,d3 and complex
// off-diagonal entries h12 = (ar,ai), h13 = (br,bi), h23 = (cr,ci) (trigonometric cubic formula).
function hermMax3(d1, d2, d3, ar, ai, br, bi, cr, ci) {
  const n12 = ar * ar + ai * ai, n13 = br * br + bi * bi, n23 = cr * cr + ci * ci;
  const c2 = d1 + d2 + d3;
  const c1 = d1 * d2 + d1 * d3 + d2 * d3 - n12 - n13 - n23;
  const pr = ar * cr - ai * ci, pi = ar * ci + ai * cr; // h12·h23
  const c0 = d1 * d2 * d3 + 2 * (pr * br + pi * bi) - d1 * n23 - d2 * n13 - d3 * n12;
  const m = c2 / 3, p = c1 - c2 * c2 / 3, q = -2 * c2 * c2 * c2 / 27 + c2 * c1 / 3 - c0;
  if (!(p < -1e-13 * (c2 * c2 + 1e-300))) return Math.max(0, m);
  const r = Math.sqrt(-p / 3);
  const arg = Math.max(-1, Math.min(1, -q / (2 * r * r * r)));
  return Math.max(0, m + 2 * r * Math.cos(Math.acos(arg) / 3));
}
// Operator 2-norm of a complex 3×3 matrix given as rows of [re, im].
function cnorm3(A) {
  const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]].map((r) => r.map(() => [0, 0]));
  for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) {
    let re = 0, im = 0;
    for (let k = 0; k < 3; k++) { const a = A[k][i], b = A[k][j]; re += a[0] * b[0] + a[1] * b[1]; im += a[0] * b[1] - a[1] * b[0]; }
    H[i][j] = [re, im];
  }
  return Math.sqrt(hermMax3(H[0][0][0], H[1][1][0], H[2][2][0], H[0][1][0], H[0][1][1], H[0][2][0], H[0][2][1], H[1][2][0], H[1][2][1]));
}
function cmatMul3(A, B) {
  const C = [];
  for (let i = 0; i < 3; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      let re = 0, im = 0;
      for (let k = 0; k < 3; k++) { const a = A[i][k], b = B[k][j]; re += a[0] * b[0] - a[1] * b[1]; im += a[0] * b[1] + a[1] * b[0]; }
      row.push([re, im]);
    }
    C.push(row);
  }
  return C;
}
// ‖xⁿ‖^{1/n} for n = 1..N, computed with rescaling so large or tiny powers do not overflow.
function powerRoots3(X, N) {
  const out = []; let P = X.map((r) => r.map((z) => z.slice())); let logS = 0;
  for (let n = 1; n <= N; n++) {
    if (n > 1) P = cmatMul3(P, X);
    let f = 0; for (const r of P) for (const z of r) f = Math.max(f, Math.abs(z[0]), Math.abs(z[1]));
    if (f === 0) { for (let k = n; k <= N; k++) out.push(0); return out; }
    P = P.map((r) => r.map((z) => [z[0] / f, z[1] / f])); logS += Math.log(f);
    out.push(Math.exp((logS + Math.log(cnorm3(P))) / n));
  }
  return out;
}
// Operator norm of a real 2×2 matrix.
const opn2 = (M, A) => M.svd2(A)[0];
// Colour for a resolvent-norm heat map of L = log10‖R(λ)‖: faint far from the spectrum, saturated
// near it, with thin level lines at L = 0, ±0.5, ±1, … (pseudospectral contours). `g` is |∇L| per
// raster cell, so the level lines stay about one cell wide whatever the local gradient.
function heatRGBA(M, L, g, lo = -0.6, hi = 1.7) {
  if (!isFinite(L)) return [70, 10, 90, 255];
  const t = M.clamp((L - lo) / (hi - lo), 0, 1);
  const c = M.cmap(1 - 0.85 * t, 'magma');
  let a = 35 + 200 * Math.pow(t, 1.15);
  if (L > lo + 0.3 && L < hi + 0.3) {
    const d = Math.abs(L * 2 - Math.round(L * 2)) / 2 / Math.max(g, 1e-12);
    if (d < 0.85) a = Math.min(255, a + 125 * (1 - d / 0.85));
  }
  return [c[0], c[1], c[2], a];
}
// Raster callback for heatRGBA; the gradient is taken numerically unless `grad` (|∇L| per data unit) is given.
function heatFn(M, S, Lfn, lo, hi, grad, res = 2) {
  return (x, y) => {
    const L = Lfn(x, y), h = res / S.scale;
    let g;
    if (grad) g = grad(x, y) * h;
    else { const a = Lfn(x + h, y), b = Lfn(x, y + h); g = Math.hypot(a - L, b - L); }
    return heatRGBA(M, L, g, lo, hi);
  };
}
const LOGTICKS = [[1, '10'], [0, '1'], [-2, '10⁻²'], [-4, '10⁻⁴'], [-6, '10⁻⁶'], [-8, '10⁻⁸'], [-10, '10⁻¹⁰'], [-12, '10⁻¹²']];

export default {
  book: 'rca',
  chapter: 18,
  title: 'Elementary Theory of Banach Algebras',
  summary: String.raw`A Banach algebra is a Banach space whose elements can also be multiplied, with $\norm{xy}\le\norm{x}\norm{y}$ and a unit of norm $1$. Neumann series show that the invertible elements form an open set on which inversion is continuous; Liouville's theorem then forces every element to have a nonempty compact spectrum, whose radius is $\lim\norm{x^n}^{1/n}$, and the Gelfand–Mazur theorem follows. For commutative algebras, maximal ideals are exactly the kernels of complex homomorphisms, so invertibility becomes a pointwise question — which yields Gelfand's short proof of Wiener's lemma on absolutely convergent Fourier series.`,
  items: [
    // ------------------------------------------------------------------ introduction
    {
      num: '18.1',
      kind: 'Definition',
      name: 'Banach algebra',
      statement: String.raw`A **complex algebra** is a complex vector space $A$ with an associative multiplication $(x,y)\mapsto xy$ that is linear in each factor: $x(y+z)=xy+xz$, $(x+y)z=xz+yz$ and $\alpha(xy)=(\alpha x)y=x(\alpha y)$ for $\alpha\in\C$.

$A$ is a **Banach algebra** if moreover $A$ is a Banach space whose norm is *submultiplicative*,
$$\norm{xy}\le\norm{x}\,\norm{y}\qquad(x,y\in A),$$
and $A$ contains a **unit** $e$ with $ex=xe=x$ for every $x$ and $\norm{e}=1$. It is **commutative** if $xy=yx$ for all $x,y$. In this chapter every Banach algebra is complex and has a unit; commutativity is assumed only when stated.

Typical examples: $C(X)$ ($X$ compact Hausdorff) with the supremum norm; the bounded operators on a Banach space (e.g. $n\times n$ matrices) with the operator norm; $\ell^1(\Z)$ with convolution.`,
      idea: String.raw`Submultiplicativity makes multiplication jointly continuous, since $xy-x_0y_0=(x-x_0)y+x_0(y-y_0)$, and completeness lets power series such as $\sum x^n$ or $\sum x^n/n!$ converge as soon as the numerical series of norms does. The condition $\norm e=1$ is a normalisation: replacing $\norm x$ by the operator norm of $y\mapsto xy$ gives an equivalent submultiplicative norm in which the unit has norm $1$. The definition extends the one used for $L^1$ in 9.19, now with a unit.`,
      caption: String.raw`A concrete Banach algebra: real $2\times2$ matrices inside $M_2(\C)$. Drag the columns of $x$ (blue) and of $y$ (orange). Left: the unit circle $S$, its image $y(S)$ and the image $xy(S)$; in the operator norm $xy(S)$ always fits inside the green circle of radius $\norm x\norm y$. Switch the norm: the column-sum norm also works, the Frobenius norm is submultiplicative but gives $\norm e=\sqrt2$, and the largest-entry norm violates $\norm{xy}\le\norm x\norm y$ (try the counterexample button).`,
      deps: ['rca-5.1', 'rca-9.19'],
      tags: ['Banach algebras', 'definitions'],
      viz(v) {
        const M = v.M;
        const NORMS = {
          op: { label: 'operator norm', f: (A) => opn2(M, A) },
          col: { label: 'max column sum', f: (A) => Math.max(Math.abs(A[0][0]) + Math.abs(A[1][0]), Math.abs(A[0][1]) + Math.abs(A[1][1])) },
          fro: { label: 'Frobenius', f: (A) => Math.hypot(A[0][0], A[0][1], A[1][0], A[1][1]) },
          max: { label: 'largest entry', f: (A) => Math.max(...A.flat().map(Math.abs)) },
        };
        const which = v.select('norm', Object.entries(NORMS).map(([value, o]) => ({ value, label: o.label })), 'op');
        const L = v.stage({ x: [-2.15, 2.15], y: [-2.15, 2.15], equal: true, height: 360, axes: false, weight: 1.25, title: 'unit circle $S$ and its images $y(S)$, $xy(S)$' });
        const B = v.stage({ x: [0.35, 5.65], y: [0, 3.2], height: 360, axes: 'box', xticks: [], yticks: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6], title: 'the axioms in the chosen norm' });
        const lim = (x, y) => { const r = Math.hypot(x, y), k = Math.min(1, 1 / Math.max(r, 1e-9)); return [x * k, y * k]; };
        const x1 = L.handle(0.95, 0.2, { color: 'blue', label: 'xe₁', constrain: lim });
        const x2 = L.handle(0.45, 0.6, { color: 'blue', label: 'xe₂', constrain: lim, labelPos: 'n' });
        const y1 = L.handle(0.85, -0.4, { color: 'orange', label: 'ye₁', labelPos: 'se', constrain: lim });
        const y2 = L.handle(-0.2, 0.55, { color: 'orange', label: 'ye₂', labelPos: 'nw', constrain: lim });
        v.button('counterexample', () => { which.set('max'); x1.set(0.7, 0.7); x2.set(0.7, -0.7); y1.set(0.5, 0.85); y2.set(-0.85, 0.5); });
        let st = {};
        v.render(() => {
          const X = [[x1.x, x2.x], [x1.y, x2.y]], Y = [[y1.x, y2.x], [y1.y, y2.y]], XY = M.matMul(X, Y);
          const nx = opn2(M, X), ny = opn2(M, Y), nxy = opn2(M, XY);
          const img = (A) => (t) => [A[0][0] * Math.cos(t) + A[0][1] * Math.sin(t), A[1][0] * Math.cos(t) + A[1][1] * Math.sin(t)];
          L.circle(0, 0, nx * ny, { color: 'green', width: 1.8, dash: [6, 5], fill: 'green', fillAlpha: 0.05 });
          L.circle(0, 0, 1, { color: 'muted', width: 1.4, dash: [3, 4] });
          L.curve(img(Y), 0, M.TAU, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.1 });
          L.curve(img(XY), 0, M.TAU, { color: 'blue', width: 2.6, fill: 'blue', fillAlpha: 0.14 });
          // where xy(S) touches the circle of radius ‖xy‖
          let best = 0, bt = 0; for (let k = 0; k < 720; k++) { const t = M.TAU * k / 720, p = img(XY)(t), r = Math.hypot(p[0], p[1]); if (r > best) { best = r; bt = t; } }
          const pk = img(XY)(bt);
          L.circle(0, 0, nxy, { color: 'blue', width: 1, alpha: 0.6 });
          L.dot(pk[0], pk[1], { color: 'blue', r: 3.5 });
          L.arrow(0, 0, x1.x, x1.y, { color: 'blue', width: 1.3, head: 7, alpha: 0.7 }); L.arrow(0, 0, x2.x, x2.y, { color: 'blue', width: 1.3, head: 7, alpha: 0.7 });
          L.arrow(0, 0, y1.x, y1.y, { color: 'orange', width: 1.3, head: 7, alpha: 0.7 }); L.arrow(0, 0, y2.x, y2.y, { color: 'orange', width: 1.3, head: 7, alpha: 0.7 });
          L.tex('\\norm{x}\\norm{y}', 0, -nx * ny, { color: 'green', baseline: 'top', dy: 4, size: 13 });
          L.tex('S', -0.72, -0.72, { color: 'muted', size: 13 });
          // bars in the chosen norm
          const N = NORMS[which.value].f, a = N(X), b = N(Y), ab = N(XY), ne = N([[1, 0], [0, 1]]);
          const okM = ab <= a * b + 1e-12, okE = Math.abs(ne - 1) < 1e-12;
          const top = Math.max(2, 1.18 * Math.max(a, b, ab, a * b, ne));
          B.setView(null, [-0.13 * top, top]);
          ['\\norm x', '\\norm y', '\\norm{xy}', '\\norm x\\norm y', '\\norm e'].forEach((lab, i) => B.tex(lab, i + 1, -0.065 * top, { size: 14, color: 'ink' }));
          B.hline(0, { color: 'faint', width: 1 });
          B.bars([a, b], { x0: 1, color: (_, i) => (i ? 'orange' : 'blue') });
          B.bars([ab], { x0: 3, color: okM ? 'blue' : 'red' });
          B.bars([a * b], { x0: 4, color: 'green' });
          B.bars([ne], { x0: 5, color: okE ? 'gray' : 'red' });
          B.hline(1, { color: 'muted', dash: [3, 4], width: 1 });
          B.text(v.fmt(ab, 3), 3, ab, { dy: -9, align: 'center', color: okM ? 'ink' : 'red' });
          B.text(v.fmt(a * b, 3), 4, a * b, { dy: -9, align: 'center' });
          B.text(v.fmt(ne, 3), 5, ne, { dy: -9, align: 'center', color: okE ? 'ink' : 'red' });
          B.corner(okM && okE ? 'both axioms hold' : !okM ? '‖xy‖ > ‖x‖‖y‖: not submultiplicative' : '‖e‖ ≠ 1', 'tr', { color: okM && okE ? 'green' : 'red', weight: 600 });
          v.legend([['blue', '$x$ and $xy(S)$'], ['orange', '$y$ and $y(S)$'], ['green', 'circle of radius $\\norm x\\norm y$ (operator norm)', { dash: true }]]);
          st = { a, b, ab, ne, okM, okE, nxy, nx, ny };
        });
        v.readout(() => {
          const s = st; if (!s.a) return '';
          return `In the ${NORMS[which.value].label}: $\\norm{xy} = ${v.fix(s.ab, 3)} ${s.okM ? '\\le' : '>'} \\norm{x}\\norm{y} = ${v.fix(s.a * s.b, 3)}$, and $\\norm{e} = ${v.fix(s.ne, 3)}$. ` +
            (s.okM && s.okE ? 'This norm makes the matrices a Banach algebra.' : s.okM ? 'Submultiplicative, but the unit has the wrong norm.' : 'This norm is not submultiplicative, so it does not define a Banach algebra.');
        });
      },
    },
    {
      num: '18.2',
      kind: 'Definition',
      name: 'Invertible elements, spectrum, spectral radius',
      statement: String.raw`Let $A$ be a Banach algebra. An element $x\in A$ is **invertible** if some $x^{-1}\in A$ satisfies $xx^{-1}=x^{-1}x=e$; the invertible elements form a group $G=G(A)$ under multiplication.

The **spectrum** of $x\in A$ is
$$\sigma(x)=\{\lambda\in\C:\ \lambda e-x\ \text{is not invertible}\},$$
and the **spectral radius** of $x$ is $\rho(x)=\sup\{\abs{\lambda}:\lambda\in\sigma(x)\}$. For $\lambda\notin\sigma(x)$ the element $(\lambda e-x)^{-1}$ is the **resolvent** of $x$ at $\lambda$.

For an $n\times n$ matrix, $\sigma(x)$ is the set of eigenvalues; in $C(X)$, $\sigma(f)$ is the range $f(X)$.`,
      idea: String.raw`Inverses are unique ($y=yxz=z$ if $yx=e=xz$), so $G$ is a group with $(xy)^{-1}=y^{-1}x^{-1}$. In $C(X)$, $\lambda-f$ has the inverse $1/(\lambda-f)$ exactly when $f$ never takes the value $\lambda$, and then $\norm{(\lambda-f)^{-1}}_\infty=1/\dist(\lambda,f(X))$. For matrices the resolvent norm can be much larger than $1/\dist(\lambda,\sigma(x))$ when $x$ is far from normal; the theorems below show that in every Banach algebra the spectrum is a nonempty compact set inside $\{\abs\lambda\le\norm x\}$.`,
      caption: String.raw`The colour is $\log_{10}\norm{(\lambda e-x)^{-1}}$, with thin level lines; it blows up exactly on $\sigma(x)$ (blue). In $C(\T)$ drag the centre $c$ of $f(e^{it})=c+e^{it}+q\,e^{-2it}$: the spectrum is the curve $f(\T)$ and $\rho(f)=\norm f_\infty$. In $M_2(\C)$ drag the eigenvalues $\mu_1,\mu_2$ of $x=\begin{pmatrix}\mu_1&s\\0&\mu_2\end{pmatrix}$ and raise $s$: the level lines bulge far beyond the two points and $\rho(x)<\norm x$. Drag the test point $\lambda$ to read off the resolvent norm.`,
      deps: ['rca-18.1'],
      see: ['fa-10.13'],
      tags: ['spectrum', 'Banach algebras', 'definitions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'fun', label: '$f\\in C(\\T)$, sup norm' }, { value: 'mat', label: '$x\\in M_2(\\C)$, operator norm' }], 'fun');
        const sQ = v.slider('wobble $q$', 0, 0.9, 0.45, { step: 0.01 });
        const sS = v.slider('off-diagonal $s$', 0, 2.5, 1.3, { step: 0.01 });
        const S = v.stage({ x: [-2.7, 2.7], y: [-1.8, 1.8], equal: true, height: 400, xlabel: 'Re λ', ylabel: 'Im λ' });
        const c = S.handle(0.25, 0.1, { color: 'blue', label: 'c', labelPos: 'n' });
        const m1 = S.handle(-0.9, 0.35, { color: 'blue', label: 'μ₁' });
        const m2 = S.handle(0.7, -0.4, { color: 'blue', label: 'μ₂', labelPos: 'se' });
        const lam = S.handle(1.75, 1.05, { color: 'gold', label: 'λ' });
        let st = {};
        v.render(() => {
          const fun = mode.value === 'fun';
          c.visible = fun; m1.visible = m2.visible = !fun; sQ.el.hidden = !fun; sS.el.hidden = fun;
          let resNorm, grad = null, spec, rho, nrm, key, near;
          if (fun) {
            const q = sQ.value, K = 480;
            const pts = M.range(K).map((k) => { const t = M.TAU * k / K; return [c.x + Math.cos(t) + q * Math.cos(2 * t), c.y + Math.sin(t) - q * Math.sin(2 * t)]; });
            const dist = (x, y) => { let d = Infinity, bi = 0; for (let k = 0; k < K; k++) { const dd = (pts[k][0] - x) ** 2 + (pts[k][1] - y) ** 2; if (dd < d) { d = dd; bi = k; } } return [Math.sqrt(d), bi]; };
            resNorm = (x, y) => 1 / dist(x, y)[0];
            grad = (x, y) => resNorm(x, y) / Math.LN10;
            rho = Math.max(...pts.map((p) => Math.hypot(p[0], p[1]))); nrm = rho;
            key = `f${c.x.toFixed(3)},${c.y.toFixed(3)},${q}`;
            const [d, bi] = dist(lam.x, lam.y); near = pts[bi];
            spec = () => S.path(pts.concat([pts[0]]), { color: 'blue', width: 3.2 });
            st = { fun, d, R: 1 / d, rho, nrm };
          } else {
            const s = sS.value, a1 = [m1.x, m1.y], a2 = [m2.x, m2.y];
            resNorm = (x, y) => {
              const ar = x - a1[0], ai = y - a1[1], br = x - a2[0], bi = y - a2[1];
              const da = ar * ar + ai * ai, db = br * br + bi * bi, D = Math.sqrt(da * db);
              const F = da + db + s * s, smax = Math.sqrt((F + Math.sqrt(Math.max(0, F * F - 4 * D * D))) / 2);
              return smax / D;
            };
            rho = Math.max(Math.hypot(...a1), Math.hypot(...a2));
            const F = a1[0] ** 2 + a1[1] ** 2 + a2[0] ** 2 + a2[1] ** 2 + s * s, D = Math.hypot(...a1) * Math.hypot(...a2);
            nrm = Math.sqrt((F + Math.sqrt(Math.max(0, F * F - 4 * D * D))) / 2);
            key = `m${a1},${a2},${s}`;
            const d1 = Math.hypot(lam.x - a1[0], lam.y - a1[1]), d2 = Math.hypot(lam.x - a2[0], lam.y - a2[1]);
            near = d1 < d2 ? a1 : a2;
            spec = () => { S.dot(a1[0], a1[1], { color: 'blue', r: 9, hollow: true, width: 2.4 }); S.dot(a2[0], a2[1], { color: 'blue', r: 9, hollow: true, width: 2.4 }); };
            st = { fun, d: Math.min(d1, d2), R: resNorm(lam.x, lam.y), rho, nrm, s };
          }
          S.raster(heatFn(M, S, (x, y) => Math.log10(resNorm(x, y)), -0.6, 1.7, grad, fun ? 3 : 2), { key, res: fun ? 3 : 2 });
          S.axes();
          S.circle(0, 0, nrm, { color: 'muted', width: 1.3, dash: [3, 5] });
          S.circle(0, 0, rho, { color: 'green', width: 1.8, dash: [7, 5] });
          spec();
          S.line(lam.x, lam.y, near[0], near[1], { color: 'gold', width: 1.4, dash: [3, 3] });
          // put the circle labels where no handle sits
          const busy = [[lam.x, lam.y]].concat(fun ? [[c.x, c.y]] : [[m1.x, m1.y], [m2.x, m2.y]]);
          const spot = (r) => [-0.72, -2.3, 2.3, 0.72, -1.57].map((a) => [r * Math.cos(a), r * Math.sin(a)]).sort((P, Q) => Math.min(...busy.map((b) => Math.hypot(Q[0] - b[0], Q[1] - b[1]))) - Math.min(...busy.map((b) => Math.hypot(P[0] - b[0], P[1] - b[1]))))[0];
          const pr = spot(rho); S.tex('\\rho', pr[0], pr[1], { color: 'green', align: pr[0] > 0 ? 'left' : 'right', dx: pr[0] > 0 ? 6 : -6, size: 14 });
          if (nrm > rho + 0.08) { const pn = spot(nrm); S.tex('\\norm{x}', pn[0], pn[1], { color: 'muted', align: pn[0] > 0 ? 'left' : 'right', dx: pn[0] > 0 ? 6 : -6, size: 13 }); }
          v.legend([['blue', fun ? '$\\sigma(f)=f(\\T)$' : '$\\sigma(x)=\\{\\mu_1,\\mu_2\\}$'], ['green', 'circle $\\abs\\lambda=\\rho$', { dash: true }], ['muted', fun ? 'circle $\\abs\\lambda=\\norm f_\\infty$ (the same)' : 'circle $\\abs\\lambda=\\norm x$', { dash: true }], ['gold', 'test point $\\lambda$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (s.R == null) return '';
          if (s.fun) return `$\\operatorname{dist}(\\lambda,f(\\T)) = ${v.fix(s.d, 3)}$, so $\\lambda e-f$ is invertible with $\\norm{(\\lambda e-f)^{-1}}_\\infty = ${v.fix(s.R, 3)}$. Spectral radius $\\rho(f)=\\norm f_\\infty = ${v.fix(s.rho, 3)}$.`;
          return `$\\norm{(\\lambda e-x)^{-1}} = ${v.fix(s.R, 3)}$ while $1/\\operatorname{dist}(\\lambda,\\sigma(x)) = ${v.fix(1 / s.d, 3)}$; $\\;\\rho(x) = ${v.fix(s.rho, 3)} ${s.nrm > s.rho + 1e-6 ? '<' : '='} \\norm x = ${v.fix(s.nrm, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ the invertible elements
    {
      num: '18.3',
      kind: 'Theorem',
      name: 'Neumann series: e − x is invertible when ‖x‖ < 1',
      statement: String.raw`Let $A$ be a Banach algebra and $x\in A$ with $\norm{x}<1$. Then
(a) $e-x$ is invertible, and $(e-x)^{-1}=\sum_{n=0}^{\infty}x^n$, the series converging in norm;
(b) $\norm{(e-x)^{-1}-e-x}\le\dfrac{\norm{x}^2}{1-\norm{x}}$.`,
      idea: String.raw`Submultiplicativity gives $\norm{x^n}\le\norm x^n$, so the partial sums $s_N=e+x+\dots+x^N$ form a Cauchy sequence and converge in the Banach space $A$. Telescoping, $(e-x)s_N=s_N(e-x)=e-x^{N+1}\to e$, so the limit is a two-sided inverse. The estimate (b) is the tail $\sum_{n\ge2}\norm x^n$. Only convergence of $\sum\norm{x^n}$ is needed — which, by the spectral radius formula (18.5), happens exactly when $\rho(x)<1$.`,
      caption: String.raw`$x$ is a real $2\times2$ matrix: drag its columns $xe_1,xe_2$ (blue) and the vector $b$. Left: the unit circle and the ellipse $x(S)$ — it lies inside the circle exactly when $\norm x<1$. The gold path visits $s_0b,s_1b,s_2b,\dots$ and homes in on $u=(e-x)^{-1}b$ (green). Right: $\norm{s_N-(e-x)^{-1}}$ on a log scale against the geometric bound $\norm x^{N+1}/(1-\norm x)$. Try the shear: $\norm x>1$, yet the series still converges because $\rho(x)<1$.`,
      deps: ['rca-18.1', 'rca-18.2', 'rca-5.1'],
      see: ['pma-3.26'],
      tags: ['Neumann series', 'invertibility'],
      verify: true,
      viz(v) {
        const M = v.M;
        const PRE = {
          con: { label: 'contraction', x: [[0.55, -0.35], [0.3, 0.45]] },
          shear: { label: '$\\norm x>1$, $\\rho(x)<1$', x: [[0.45, 1.25], [0, 0.35]] },
          exp: { label: '$\\rho(x)>1$', x: [[-1.15, 0.35], [-0.25, -0.95]] },
        };
        const L = v.stage({ x: [-2.3, 2.6], y: [-1.9, 2.3], equal: true, height: 360, axes: false, weight: 1.1, title: 'the vectors $s_Nb=b+xb+\\dots+x^Nb$' });
        const R = v.stage({ x: [-1, 31], y: [-12.5, 1.6], height: 360, axes: 'box', yticks: LOGTICKS, title: '$\\norm{s_N-(e-x)^{-1}}$ against $N$ (log scale)' });
        const lim = (x, y) => [M.clamp(x, -1.9, 1.9), M.clamp(y, -1.5, 1.9)];
        const h1 = L.handle(0.55, 0.3, { color: 'blue', label: 'xe₁', constrain: lim, labelPos: 'se' });
        const h2 = L.handle(-0.35, 0.45, { color: 'blue', label: 'xe₂', constrain: lim, labelPos: 'nw' });
        const hb = L.handle(0.9, -0.85, { color: 'ink', label: 'b', constrain: lim, labelPos: 'se' });
        v.select('preset', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'con', { onChange: (k) => { const X = PRE[k].x; h1.set(X[0][0], X[1][0]); h2.set(X[0][1], X[1][1]); } });
        let st = {};
        v.render(() => {
          const X = [[h1.x, h2.x], [h1.y, h2.y]], b = [hb.x, hb.y];
          const nx = opn2(M, X), ev = M.eig2(X), rho = Math.max(...ev.map((z) => Math.hypot(z[0], z[1])));
          const I2 = [[1, 0], [0, 1]], EmX = [[1 - X[0][0], -X[0][1]], [-X[1][0], 1 - X[1][1]]];
          const inv = M.inverse(EmX);
          L.circle(0, 0, 1, { color: 'muted', width: 1.4, dash: [4, 4] });
          L.curve((t) => [X[0][0] * Math.cos(t) + X[0][1] * Math.sin(t), X[1][0] * Math.cos(t) + X[1][1] * Math.sin(t)], 0, M.TAU, { color: 'blue', width: 2, fill: 'blue', fillAlpha: nx < 1 ? 0.13 : 0.06, dash: nx < 1 ? null : [5, 4] });
          L.arrow(0, 0, h1.x, h1.y, { color: 'blue', width: 1.2, head: 7, alpha: 0.6 }); L.arrow(0, 0, h2.x, h2.y, { color: 'blue', width: 1.2, head: 7, alpha: 0.6 });
          // partial sums s_N b
          const pts = [b.slice()]; let term = b.slice(), cur = b.slice();
          for (let n = 1; n <= 60; n++) { term = M.matVec(X, term); cur = M.vadd(cur, term); pts.push(cur.slice()); if (Math.hypot(...cur) > 40) break; }
          L.path(pts, { color: 'gold', width: 1.8 });
          L.dots(pts.slice(0, 25), { color: 'gold', r: 2.8 });
          const u = inv ? M.matVec(inv, b) : null;
          if (u && rho < 1) L.dot(u[0], u[1], { color: 'green', r: 6, label: 'u', labelPos: 'nw' });
          else if (u) L.dot(u[0], u[1], { color: 'green', r: 5, hollow: true, label: 'u', labelPos: 'ne' });
          L.corner(nx < 1 ? `‖x‖ = ${v.fmt(nx, 3)} < 1` : rho < 1 ? `‖x‖ = ${v.fmt(nx, 3)} ≥ 1, but ρ(x) = ${v.fmt(rho, 3)} < 1` : `ρ(x) = ${v.fmt(rho, 3)} ≥ 1: the series diverges`, 'tl', { color: nx < 1 ? 'green' : rho < 1 ? 'orange' : 'red', weight: 600 });
          // errors of the partial sums
          const errs = []; let S = I2, P = I2;
          for (let N = 0; N <= 30; N++) {
            if (N > 0) { P = M.matMul(P, X); S = [[S[0][0] + P[0][0], S[0][1] + P[0][1]], [S[1][0] + P[1][0], S[1][1] + P[1][1]]]; }
            const e = inv ? opn2(M, [[S[0][0] - inv[0][0], S[0][1] - inv[0][1]], [S[1][0] - inv[1][0], S[1][1] - inv[1][1]]]) : NaN;
            errs.push([N, e > 0 ? Math.log10(e) : -13]);
          }
          const lowest = Math.min(...errs.map((p) => p[1]), nx < 1 ? 31 * Math.log10(nx) - Math.log10(1 - nx) : 0);
          R.setView(null, [Math.max(-12.5, Math.floor(lowest) - 0.6), 1.6]);
          if (nx < 1) {
            R.fn((N) => (N + 1) * Math.log10(nx) - Math.log10(1 - nx), { domain: [0, 30], color: 'blue', dash: [6, 4], width: 1.6 });
            R.dot(1, Math.log10(nx * nx / (1 - nx)), { color: 'blue', r: 4, hollow: true });
          }
          R.path(errs.map((p) => (p[1] > 1.6 ? null : p)), { color: 'gold', width: 1.6 });
          R.dots(errs.filter((p) => p[1] <= 1.6), { color: rho < 1 ? 'gold' : 'red', r: 3 });
          if (rho >= 1) R.corner('errors grow: no convergence', 'tr', { color: 'red', weight: 600 });
          v.legend([['gold', 'partial sums $s_N$'], ['green', '$u=(e-x)^{-1}b$', { dot: true }]].concat(nx < 1 ? [['blue', 'bound $\\norm x^{N+1}/(1-\\norm x)$', { dash: true }]] : []));
          const est = inv ? opn2(M, [[inv[0][0] - 1 - X[0][0], inv[0][1] - X[0][1]], [inv[1][0] - X[1][0], inv[1][1] - 1 - X[1][1]]]) : NaN;
          st = { nx, rho, est, inv: !!inv };
        });
        v.readout(() => {
          const s = st; if (s.nx == null) return '';
          const head = `$\\norm x = ${v.fix(s.nx, 3)}$, $\\;\\rho(x) = ${v.fix(s.rho, 3)}$. `;
          if (s.nx < 1) return head + `Estimate (b): $\\norm{(e-x)^{-1}-e-x} = ${v.fix(s.est, 4)} \\le \\frac{\\norm x^2}{1-\\norm x} = ${v.fix(s.nx * s.nx / (1 - s.nx), 4)}$.`;
          if (s.rho < 1) return head + 'The hypothesis $\\norm x<1$ fails, but $\\norm{x^n}\\to0$ geometrically, so the Neumann series still converges.';
          return head + (s.inv ? '$e-x$ happens to be invertible, but $\\sum x^n$ diverges — the Neumann series cannot find the inverse.' : '$e-x$ is not invertible.');
        });
      },
    },
    {
      num: '18.4',
      kind: 'Theorem',
      name: 'G(A) is open and inversion is continuous',
      statement: String.raw`Let $A$ be a Banach algebra and $G=G(A)$. If $x\in G$, $h\in A$ and $\norm{h}<\tfrac12\norm{x^{-1}}^{-1}$, then $x+h\in G$ and
$$\norm{(x+h)^{-1}-x^{-1}+x^{-1}hx^{-1}}\le 2\norm{x^{-1}}^3\norm{h}^2 .$$
Consequently $G$ is an open subset of $A$, and $x\mapsto x^{-1}$ is a homeomorphism of $G$ onto $G$ — in fact it is differentiable, with derivative $h\mapsto -x^{-1}hx^{-1}$ at $x$.`,
      idea: String.raw`Write $x+h=x(e+x^{-1}h)$ with $\norm{x^{-1}h}<\tfrac12$; by 18.3 the second factor is invertible, so $x+h\in G$ and $(x+h)^{-1}=\sum_{n\ge0}(-x^{-1}h)^n x^{-1}$. Removing the terms $n=0,1$ leaves a tail of norm at most $\norm{x^{-1}}\sum_{n\ge2}(\norm{x^{-1}}\norm h)^n\le 2\norm{x^{-1}}^3\norm h^2$. Inversion is continuous by this estimate and is its own inverse, hence a homeomorphism.`,
      caption: String.raw`A two-dimensional slice of $M_2(\R)$: the symmetric matrices $pI+uE+wF$ with $E=\mathrm{diag}(1,-1)$, $F=\begin{pmatrix}0&1\\1&0\end{pmatrix}$, plotted at $(u,w)$; in this slice $\norm{h}$ is the Euclidean length. The red circle is where $\det=0$, the colour is $\log_{10}\norm{y^{-1}}$. Drag $x$ and $x+h$: the green ball of radius $\tfrac12\norm{x^{-1}}^{-1}$ never reaches the red circle (the dashed ring of radius $\norm{x^{-1}}^{-1}$ touches it exactly). Right: the second-order error along the ray through $h$ stays under $2\norm{x^{-1}}^3r^2$ inside the ball.`,
      deps: ['rca-18.3', 'rca-18.2'],
      tags: ['invertibility', 'continuity'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sp = v.slider('$p$ (multiple of $I$)', 0.5, 1.6, 1, { step: 0.01 });
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.9, 1.9], equal: true, height: 360, weight: 1.2, xlabel: 'u', ylabel: 'w', title: 'the slice $y=pI+uE+wF$; $\\det y=0$ on the red circle' });
        const R = v.stage({ x: [0, 1], y: [0, 1], height: 360, axes: 'box', title: 'second-order error along the ray, at $r=\\norm h$' });
        const X = L.handle(0.3, 0.2, { color: 'blue', label: 'x', labelPos: 'sw' });
        const H = L.handle(0.5, 0.36, { color: 'gold', label: 'x+h', labelPos: 'ne' });
        let st = {};
        const mat = (p, u, w) => [[p + u, w], [w, p - u]];
        v.render(() => {
          const p = sp.value, x = mat(p, X.x, X.y), xi = M.inverse(x);
          const smin = Math.abs(p - Math.hypot(X.x, X.y));
          const r0 = smin / 2, nxi = xi ? 1 / smin : Infinity;
          L.raster(heatFn(M, L, (u, w) => -Math.log10(Math.abs(p - Math.hypot(u, w))), -0.5, 1.6, (u, w) => 1 / (Math.abs(p - Math.hypot(u, w)) * Math.LN10), 2), { key: `p${p}`, res: 2 });
          L.axes();
          L.circle(0, 0, p, { color: 'red', width: 2.6 });
          L.text('det = 0', p * Math.cos(2.4), p * Math.sin(2.4), { color: 'red', dx: -6, align: 'right', size: 12 });
          L.text('det > 0', 0.55 * p * Math.cos(-2.3), 0.55 * p * Math.sin(-2.3), { color: 'ink', align: 'center', size: 11.5 });
          L.text('det < 0', (p + 0.38) * Math.cos(-2.3), (p + 0.38) * Math.sin(-2.3), { color: 'ink', align: 'center', size: 11.5 });
          if (xi) {
            L.circle(X.x, X.y, smin, { color: 'ink', width: 1.1, dash: [3, 4] });
            L.circle(X.x, X.y, r0, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.2 });
          }
          L.arrow(X.x, X.y, H.x, H.y, { color: 'gold', width: 1.8, head: 8 });
          // right panel: error along the ray from x through x+h
          let du = H.x - X.x, dw = H.y - X.y; const hn = Math.hypot(du, dw);
          if (hn < 1e-9) { du = 1; dw = 0; } else { du /= hn; dw /= hn; }
          const hh = [[du, dw], [dw, -du]];
          const err = (r) => {
            const y = mat(p, X.x + r * du, X.y + r * dw), yi = M.inverse(y); if (!yi || !xi) return NaN;
            const c = M.matMul(M.matMul(xi, hh), xi);
            return opn2(M, [[yi[0][0] - xi[0][0] + r * c[0][0], yi[0][1] - xi[0][1] + r * c[0][1]], [yi[1][0] - xi[1][0] + r * c[1][0], yi[1][1] - xi[1][1] + r * c[1][1]]]);
          };
          const rmax = Math.max(1.6 * r0, hn * 1.12, 0.05), ymax = Math.max(1e-6, 2.2 * 2 * nxi ** 3 * r0 * r0);
          R.setView([0, rmax], [0, ymax]);
          R.vband(0, r0, { color: 'green', alpha: 0.1, edges: true });
          R.fn((r) => 2 * nxi ** 3 * r * r, { domain: [0, rmax], color: 'green', width: 1.8, dash: [6, 4] });
          R.fn(err, { domain: [0, rmax], color: 'blue', width: 2.4, n: 300 });
          R.vline(hn, { color: 'gold', width: 1.4, dash: [3, 3] });
          const eh = err(hn); if (isFinite(eh)) R.dot(hn, Math.min(eh, ymax * 0.995), { color: 'gold', r: 5 });
          R.text('ball: r < ½‖x⁻¹‖⁻¹', r0, ymax, { dy: 12, dx: -5, align: 'right', color: 'green', size: 11.5, weight: 600 });
          v.legend([['red', '$\\det=0$ (not invertible)'], ['green', 'ball $\\norm h<\\tfrac12\\norm{x^{-1}}^{-1}$', { area: true }], ['blue', '$\\norm{(x+h)^{-1}-x^{-1}+x^{-1}hx^{-1}}$'], ['green', 'bound $2\\norm{x^{-1}}^3\\norm h^2$', { dash: true }]]);
          st = { hn, r0, nxi, eh, inside: hn < r0, inv: !!M.inverse(mat(p, H.x, H.y)) };
        });
        v.readout(() => {
          const s = st; if (s.hn == null) return '';
          return `$\\norm h = ${v.fix(s.hn, 3)}$, $\\;\\tfrac12\\norm{x^{-1}}^{-1} = ${v.fix(s.r0, 3)}$. ` + (s.inside
            ? `Inside the ball: $x+h\\in G$ and the error $${v.fix(s.eh, 4)} \\le 2\\norm{x^{-1}}^3\\norm h^2 = ${v.fix(2 * s.nxi ** 3 * s.hn ** 2, 4)}$.`
            : `Outside the ball the theorem says nothing; here $x+h$ is ${s.inv ? 'still invertible' : 'singular'}.`);
        });
      },
    },
    {
      num: '18.5',
      kind: 'Theorem',
      name: 'Nonempty compact spectrum; spectral radius formula',
      statement: String.raw`Let $A$ be a Banach algebra and $x\in A$. Then
(a) $\sigma(x)$ is compact and nonempty, and $\abs\lambda\le\norm x$ for every $\lambda\in\sigma(x)$;
(b) the spectral radius satisfies $$\rho(x)=\lim_{n\to\infty}\norm{x^n}^{1/n}=\inf_{n\ge1}\norm{x^n}^{1/n}.$$`,
      idea: String.raw`If $\abs\lambda>\norm x$ then $\lambda e-x=\lambda(e-x/\lambda)$ is invertible by 18.3, and the complement of $\sigma(x)$ is open because $G$ is (18.4); so $\sigma(x)$ is closed and bounded. For $\Lambda\in A^*$ the function $f(\lambda)=\Lambda((\lambda e-x)^{-1})$ is holomorphic off $\sigma(x)$ (18.4) and tends to $0$ at $\infty$. If $\sigma(x)$ were empty, Liouville (10.23) would give $f\equiv0$ for every $\Lambda$, hence $(\lambda e-x)^{-1}=0$ by Hahn–Banach (5.21) — absurd. For (b): $\lambda\in\sigma(x)$ forces $\lambda^n\in\sigma(x^n)$, so $\rho(x)^n\le\norm{x^n}$. Conversely $f(\lambda)=\sum\Lambda(x^n)\lambda^{-n-1}$ converges for $\abs\lambda>\rho(x)$ (10.16), so $\{x^n/\lambda^n\}$ is weakly bounded and, by Banach–Steinhaus (5.8), norm bounded: $\limsup\norm{x^n}^{1/n}\le\abs\lambda$.`,
      caption: String.raw`$x$ is the upper-triangular $3\times3$ matrix with diagonal $\mu_1,\mu_2,\mu_3$ (drag them) and superdiagonal $s$. Left, in the default picture: the phase of $f(\lambda)=\Lambda((\lambda e-x)^{-1})$ for $\Lambda$ = sum of all entries — holomorphic except at the eigenvalues and decaying at $\infty$, which is why the spectrum cannot be empty. The other picture shows $\log_{10}\norm{(\lambda e-x)^{-1}}$. Right: $\norm{x^n}^{1/n}$ (gold) starts at $\norm x$ and converges to $\rho(x)$ (green) — slowly when $s$ is large or the eigenvalues coincide. For the nilpotent preset, $\rho(x)=0<\norm x$.`,
      deps: ['rca-18.4', 'rca-18.3', 'rca-10.23', 'rca-5.21', 'rca-10.16', 'rca-5.8'],
      see: ['fa-10.13', 'rca-10.10'],
      tags: ['spectrum', 'spectral radius', 'Liouville'],
      verify: true,
      viz(v) {
        const M = v.M; const { Cx } = M;
        const pic = v.select('left', [{ value: 'phase', label: 'phase of $\\Lambda((\\lambda e-x)^{-1})$' }, { value: 'norm', label: '$\\norm{(\\lambda e-x)^{-1}}$' }], 'phase');
        const sS = v.slider('superdiagonal $s$', 0, 2, 1.4, { step: 0.01 });
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.75, 1.75], equal: true, height: 370, weight: 1.15 });
        const R = v.stage({ x: [0, 41], y: [0, 2.5], height: 370, axes: 'box', title: '$\\norm{x^n}^{1/n}$ against $n$, and $\\rho(x)$' });
        const mu = [L.handle(0.75, 0.3, { color: 'blue', label: 'μ₁' }), L.handle(-0.5, 0.45, { color: 'blue', label: 'μ₂', labelPos: 'nw' }), L.handle(-0.1, -0.55, { color: 'blue', label: 'μ₃', labelPos: 'se' })];
        const PRE = { gen: [[0.75, 0.3], [-0.5, 0.45], [-0.1, -0.55]], jor: [[0.7, 0.2], [0.7, 0.2], [0.7, 0.2]], nil: [[0, 0], [0, 0], [0, 0]] };
        v.select('preset', [{ value: 'gen', label: 'generic' }, { value: 'jor', label: '$\\mu_1=\\mu_2=\\mu_3$' }, { value: 'nil', label: 'nilpotent' }], 'gen', { onChange: (k) => PRE[k].forEach((p, i) => mu[i].set(p[0], p[1])) });
        let st = {};
        v.render(() => {
          const s = sS.value, m = mu.map((h) => [h.x, h.y]);
          const X = [[m[0], [s, 0], [0, 0]], [[0, 0], m[1], [s, 0]], [[0, 0], [0, 0], m[2]]];
          const nrm = cnorm3(X), rho = Math.max(...m.map((z) => Math.hypot(z[0], z[1])));
          const key = `${m.flat().map((t) => t.toFixed(3))}|${s}`;
          if (pic.value === 'phase') {
            const mc = m.map((z) => new Cx(z[0], z[1]));
            L.domain((z) => {
              const a = z.sub(mc[0]), b = z.sub(mc[1]), c = z.sub(mc[2]);
              const ia = a.inv(), ib = b.inv(), ic = c.inv();
              return ia.add(ib).add(ic).add(ia.mul(ib).scale(s)).add(ib.mul(ic).scale(s)).add(ia.mul(ib).mul(ic).scale(s * s));
            }, { key: 'ph' + key, res: 2 });
            L.setTitle('phase of $f(\\lambda)=\\Lambda((\\lambda e-x)^{-1})$, $\\Lambda$ = sum of entries');
          } else {
            const inv = (z) => { const d = z[0] * z[0] + z[1] * z[1]; return [z[0] / d, -z[1] / d]; };
            const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
            const logR = (x, y) => {
              const ia = inv([x - m[0][0], y - m[0][1]]), ib = inv([x - m[1][0], y - m[1][1]]), ic = inv([x - m[2][0], y - m[2][1]]);
              const u12 = mul(ia, ib).map((t) => t * s), u23 = mul(ib, ic).map((t) => t * s), u13 = mul(mul(ia, ib), ic).map((t) => t * s * s);
              return Math.log10(cnorm3([[ia, u12, u13], [[0, 0], ib, u23], [[0, 0], [0, 0], ic]]));
            };
            L.raster(heatFn(M, L, logR, -0.6, 1.7, null, 3), { key: 'n' + key, res: 3 });
            L.axes();
            L.setTitle('$\\log_{10}\\norm{(\\lambda e-x)^{-1}}$');
          }
          L.circle(0, 0, nrm, { color: 'panel', width: 4, alpha: 0.7 });
          L.circle(0, 0, nrm, { color: 'ink', width: 1.4, dash: [4, 5] });
          L.circle(0, 0, rho, { color: 'panel', width: 4, alpha: 0.7 });
          L.circle(0, 0, rho, { color: 'green', width: 2, dash: [8, 5] });
          L.text('|λ| = ‖x‖', nrm * Math.cos(-0.6), nrm * Math.sin(-0.6), { dx: 6, color: 'ink', size: 11.5 });
          // right: n-th roots of norms of powers
          const roots = powerRoots3(X, 40);
          const top = Math.max(1.2, nrm * 1.12);
          R.setView(null, [-0.05 * top, top]);
          R.hline(nrm, { color: 'ink', width: 1, dash: [4, 5] });
          R.hline(rho, { color: 'green', width: 2.2 });
          R.path(roots.map((r, i) => [i + 1, r]), { color: 'gold', width: 1.6 });
          R.dots(roots.map((r, i) => [i + 1, r]), { color: 'gold', r: 2.8 });
          R.text('‖x‖', 40.5, nrm, { dy: -9, align: 'right', color: 'ink', size: 11.5 });
          R.text('ρ(x)', 40.5, rho, { dy: rho > 0.1 * top ? 10 : -10, align: 'right', color: 'green', size: 11.5, weight: 600 });
          v.legend([['blue', 'eigenvalues $\\mu_i$ = $\\sigma(x)$', { dot: true }], ['green', '$\\rho(x)$', { dash: true }], ['ink', '$\\norm x$', { dash: true }], ['gold', '$\\norm{x^n}^{1/n}$']]);
          st = { nrm, rho, r40: roots[39], inf: Math.min(...roots) };
        });
        v.readout(() => {
          const s = st; if (s.nrm == null) return '';
          return `$\\norm x = ${v.fix(s.nrm, 3)}$, $\\;\\norm{x^{40}}^{1/40} = ${v.fix(s.r40, 4)}$, $\\;\\inf_{n\\le40}\\norm{x^n}^{1/n} = ${v.fix(s.inf, 4)}$, $\\;\\rho(x) = \\max_i\\abs{\\mu_i} = ${v.fix(s.rho, 4)}$.`;
        });
      },
    },
  ],
};
