// Rudin, Functional Analysis — Chapter 10 (part 2): basic properties of spectra
//
// Numbering note: recalled, not checked against the book; uncertain items carry `verify: true`.

// ---------------------------------------------------------------- complex matrices: entries [re, im], rows of entries
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const csqrt = (a) => { const r = cabs(a), x = Math.sqrt((r + a[0]) / 2), y = Math.sign(a[1] || 1) * Math.sqrt(Math.max(0, (r - a[0]) / 2)); return [x, y]; };
const mmul = (A, B) => A.map((row, i) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const msub = (A, B) => A.map((row, i) => row.map((a, j) => csub(a, B[i][j])));
const ident = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [i === j ? 1 : 0, 0]));
const lamI = (n, l) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? [l[0], l[1]] : [0, 0])));
/** Operator (spectral) norm by power iteration on A*A. */
function opnorm(A, it = 40) {
  const n = A.length; let v = Array.from({ length: n }, (_, i) => [1 / Math.sqrt(n), (i % 2 ? 0.3 : -0.2) / Math.sqrt(n)]), s = 0;
  for (let k = 0; k < it; k++) {
    const w = A.map((row) => row.reduce((acc, a, j) => cadd(acc, cmul(a, v[j])), [0, 0]));
    const u = A[0].map((_, j) => A.reduce((acc, row, i) => cadd(acc, cmul([row[j][0], -row[j][1]], w[i])), [0, 0]));
    const nu = Math.sqrt(u.reduce((acc, z) => acc + z[0] * z[0] + z[1] * z[1], 0)); if (nu < 1e-300) return 0;
    s = Math.sqrt(nu); v = u.map((z) => [z[0] / nu, z[1] / nu]);
  }
  return s;
}
/** Smallest singular value of a 2×2 complex matrix: |det| / s_max. */
function smin2(A) {
  const T = A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0), det = cabs(csub(cmul(A[0][0], A[1][1]), cmul(A[0][1], A[1][0])));
  const smax = Math.sqrt((T + Math.sqrt(Math.max(0, T * T - 4 * det * det))) / 2);
  return smax > 0 ? det / smax : 0;
}
function eig2(A) {
  const tr = cadd(A[0][0], A[1][1]), det = csub(cmul(A[0][0], A[1][1]), cmul(A[0][1], A[1][0]));
  const h = [tr[0] / 2, tr[1] / 2], d = csqrt(csub(cmul(h, h), det));
  return [cadd(h, d), csub(h, d)];
}
/** Inverse of a 3×3 complex matrix by the adjugate (null if singular). */
function inv3(A) {
  const c = (i, j) => { const r = [0, 1, 2].filter((k) => k !== i), s = [0, 1, 2].filter((k) => k !== j); const m = csub(cmul(A[r[0]][s[0]], A[r[1]][s[1]]), cmul(A[r[0]][s[1]], A[r[1]][s[0]])); return (i + j) % 2 ? [-m[0], -m[1]] : m; };
  const det = cadd(cadd(cmul(A[0][0], c(0, 0)), cmul(A[0][1], c(0, 1))), cmul(A[0][2], c(0, 2)));
  if (cabs(det) < 1e-300) return null;
  return [0, 1, 2].map((i) => [0, 1, 2].map((j) => cdiv(c(j, i), det)));
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), d)}i`;

export default {
  book: 'fa',
  chapter: 10,
  items: [
    {
      num: '10.10',
      kind: 'Definition',
      name: 'Spectrum and spectral radius',
      statement: String.raw`Let $A$ be a Banach algebra and $x\in A$. The **spectrum** of $x$ is
$$\sigma(x)=\{\lambda\in\C:\ \lambda e-x\ \text{is not invertible}\},$$
and the **spectral radius** of $x$ is $\rho(x)=\sup\{|\lambda|:\lambda\in\sigma(x)\}$. On the complement of $\sigma(x)$, the **resolvent** $\lambda\mapsto(\lambda e-x)^{-1}$ is defined.`,
      idea: String.raw`In $M_n(\C)$ the spectrum is the set of eigenvalues; in $C(K)$ it is the range of the function; in $\ell^1(\Z)$ it is the image of the unit circle under the Fourier series. By 10.7, $\lambda e-x$ is invertible when $|\lambda|>\norm x$, so $\sigma(x)$ lies in the closed disc of radius $\norm x$ and $\rho(x)\le\norm x$ — with strict inequality possible.`,
      caption: String.raw`A $2\times2$ complex matrix $x=\begin{pmatrix}a&b\\c&d\end{pmatrix}$: drag $a$ and $d$, set $b$ and $c$. The colour is $\log_{10}\norm{(\lambda e-x)^{-1}}$ over the $\lambda$-plane: it blows up exactly at the spectrum (red), the eigenvalues. Dashed circles: radius $\rho(x)$ (green) and $\norm x$ (orange). Increase $b$ with $c=0$: the matrix becomes far from normal, $\norm x$ grows while $\rho(x)$ does not, and the resolvent becomes large on a whole region around the spectrum.`,
      deps: ['fa-10.4', 'fa-10.7'],
      see: ['rca-18.2'],
      tags: ['Banach algebras', 'spectrum'],
      verify: true,
      viz(v) {
        const M = v.M;
        const bS = v.slider('$b$', -3, 3, 1.6, { step: 0.01 });
        const cS = v.slider('$c$', -1.5, 1.5, 0, { step: 0.01 });
        const S = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, height: 400, axes: true, title: '$\\log_{10}\\|(\\lambda e-x)^{-1}\\|$' });
        const ha = S.handle(-0.8, 0.4, { color: 'red', label: 'a' });
        const hd = S.handle(0.9, -0.3, { color: 'red', label: 'd' });
        let st = {};
        v.legend([['red', 'spectrum $\\sigma(x)$', { dot: true }], ['green', 'radius $\\rho(x)$', { dash: true }], ['orange', 'radius $\\|x\\|$', { dash: true }]]);
        v.render(() => {
          const X = [[[ha.x, ha.y], [bS.value, 0]], [[cS.value, 0], [hd.x, hd.y]]];
          S.heat((lr, li) => { const B = msub(lamI(2, [lr, li]), X), s = smin2(B); return s > 0 ? -Math.log10(s) : 6; }, { range: [-1, 3], cmap: 'magma', res: 2, key: JSON.stringify(X) });
          S.axes();
          const ev = eig2(X), rho = Math.max(...ev.map(cabs)), nx = opnorm(X);
          S.circle(0, 0, rho, { color: 'green', width: 2, dash: [6, 4] });
          S.circle(0, 0, nx, { color: 'orange', width: 2, dash: [6, 4] });
          ev.forEach((z) => S.dot(z[0], z[1], { color: 'red', r: 5 }));
          st = { ev, rho, nx };
        });
        v.readout(() => `$\\sigma(x)=\\{${st.ev.map((z) => fmtC(v, z, 2)).join(',\\;')}\\}$, $\\;\\rho(x) = ${v.fix(st.rho, 3)}\\le\\|x\\| = ${v.fix(st.nx, 3)}$.`);
      },
    },
    {
      num: '10.12',
      kind: 'Theorem',
      name: 'G(A) is open and inversion is differentiable',
      statement: String.raw`Let $A$ be a Banach algebra. If $x\in G(A)$ and $h\in A$ with $\norm h<\frac1{2}\norm{x^{-1}}^{-1}$, then $x+h\in G(A)$ and
$$\norm{(x+h)^{-1}-x^{-1}+x^{-1}hx^{-1}}\le2\norm{x^{-1}}^3\norm h^2 .$$
Hence $G(A)$ is an open set, and $x\mapsto x^{-1}$ is a homeomorphism of $G(A)$ onto itself, differentiable with derivative $h\mapsto-x^{-1}hx^{-1}$.`,
      idea: String.raw`Write $x+h=x(e+x^{-1}h)$ and apply the Neumann series 10.7 to $y=-x^{-1}h$, which has $\norm y\le\norm{x^{-1}}\norm h<\frac12$: $(x+h)^{-1}=\sum_n(-x^{-1}h)^nx^{-1}$. The terms with $n\ge2$ add up to at most $\norm{x^{-1}}^3\norm h^2/(1-\frac12)$. Inversion is its own inverse, so it is a homeomorphism.`,
      caption: String.raw`A plane slice $x+s\,h_1+t\,h_2$ through $M_2(\R)\subset M_2(\C)$, with $h_1=\begin{pmatrix}1&0\\0&-1\end{pmatrix}$, $h_2=\begin{pmatrix}0&1\\1&0\end{pmatrix}$ (so $\norm{sh_1+th_2}=\sqrt{s^2+t^2}$). The colour is $\log_{10}\norm{(x+h)^{-1}}$; red curve: the non-invertible matrices. The green disc of radius $1/\norm{x^{-1}}$ never meets it (G is open), and on the inner disc of half that radius the theorem's estimate holds. Drag $x+h$ (purple): the readout compares the second-order error with $2\norm{x^{-1}}^3\norm h^2$.`,
      deps: ['fa-10.7', 'fa-10.4'],
      see: ['pma-9.8'],
      tags: ['Banach algebras', 'invertibility'],
      verify: true,
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 400, axes: true, xlabel: 's', ylabel: 't', title: '$\\log_{10}\\|(x+sh_1+th_2)^{-1}\\|$ on the slice' });
        const hx = S.handle(0, 0, { color: 'ink', r: 6, label: 'x' });
        const hh = S.handle(0.16, 0.1, { color: 'purple', label: 'x+h' });
        const X0 = [[0.6, 0.5], [-0.3, 0.4]];
        const mat = (s, t) => [[X0[0][0] + s, X0[0][1] + t], [X0[1][0] + t, X0[1][1] - s]];
        const inv2 = (A) => { const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
        const n2 = (A) => M.svd2(A)[0];
        let st = {};
        v.legend([['red', 'non-invertible: $\\det=0$'], ['green', 'ball of radius $1/\\|x^{-1}\\|$ (in $G$)', { area: true }], ['purple', '$x+h$']]);
        v.render(() => {
          S.heat((s, t) => { const A = mat(s, t), d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return Math.log10(n2(inv2(A))); }, { range: [-0.6, 2], cmap: 'viridis', res: 2, key: 'slice' });
          S.axes();
          // det = 0 curve: (a+s)(d−s) − (b+t)(c+t) = 0
          const pts = [];
          for (let i = 0; i <= 600; i++) { const s = -2 + 4 * i / 600; const a = X0[0][0] + s, d = X0[1][1] - s, b = X0[0][1], c = X0[1][0]; const disc = (b + c) ** 2 - 4 * (b * c - a * d); if (disc >= 0) { const r = Math.sqrt(disc); pts.push([s, (-(b + c) + r) / 2], [s, (-(b + c) - r) / 2]); } }
          S.dots(pts, { color: 'red', r: 1.6 });
          const x = mat(hx.x, hx.y), xi = inv2(x), nxi = n2(xi), R = 1 / nxi;
          S.circle(hx.x, hx.y, R, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.12 });
          S.circle(hx.x, hx.y, R / 2, { color: 'green', width: 1.4, dash: [5, 4] });
          const hs = hh.x - hx.x, ht = hh.y - hx.y, nh = Math.hypot(hs, ht);
          S.line(hx.x, hx.y, hh.x, hh.y, { color: 'purple', width: 1.6, dash: [4, 3] });
          const xh = mat(hh.x, hh.y), dxh = xh[0][0] * xh[1][1] - xh[0][1] * xh[1][0];
          let err = NaN;
          if (Math.abs(dxh) > 1e-12) { const H = [[hs, ht], [ht, -hs]], lin = M.matMul(M.matMul(xi, H), xi), E = inv2(xh).map((row, i) => row.map((a, j) => a - xi[i][j] + lin[i][j])); err = n2(E); }
          st = { R, nh, err, bound: 2 * nxi ** 3 * nh * nh, inside: nh < R / 2, sing: Math.abs(dxh) <= 1e-12 };
        });
        v.readout(() => {
          const s = st;
          const head = `$\\|x^{-1}\\|^{-1} = ${v.fix(s.R, 3)}$, $\\;\\|h\\| = ${v.fix(s.nh, 3)}$. `;
          if (s.sing) return head + '$x+h$ is singular.';
          return head + `Error $\\|(x+h)^{-1}-x^{-1}+x^{-1}hx^{-1}\\| = ${v.fix(s.err, 4)}$` + (s.inside ? ` $\\le 2\\|x^{-1}\\|^3\\|h\\|^2 = ${v.fix(s.bound, 4)}$.` : ` (bound $${v.fix(s.bound, 4)}$; outside the inner disc it is not guaranteed).`);
        });
      },
    },
    {
      num: '10.13',
      kind: 'Theorem',
      name: 'The spectrum is compact and nonempty; spectral radius formula',
      statement: String.raw`If $A$ is a Banach algebra and $x\in A$, then
(a) $\sigma(x)$ is compact and nonempty, and
(b) $\displaystyle\rho(x)=\lim_{n\to\infty}\norm{x^n}^{1/n}=\inf_{n\ge1}\norm{x^n}^{1/n}$.`,
      idea: String.raw`(a) $\sigma(x)$ is closed (G is open, 10.12) and bounded by $\norm x$. If it were empty, then for every $\Lambda\in A^*$ the function $f(\lambda)=\Lambda((\lambda e-x)^{-1})$ would be entire and tend to $0$ at $\infty$, hence vanish by Liouville; Hahn–Banach would force $(\lambda e-x)^{-1}=0$, absurd. (b) If $\lambda^n\in\sigma(x^n)$ then $\lambda\in\sigma(x)$ via the factorisation $\lambda^ne-x^n=(\lambda e-x)p(x)$, so $\rho(x)\le\inf\norm{x^n}^{1/n}$. Conversely, $f(\lambda)=\sum\Lambda(x^n)\lambda^{-n-1}$ converges for $|\lambda|>\rho(x)$; uniform boundedness turns this into $\limsup\norm{x^n}^{1/n}\le\rho(x)$.`,
      caption: String.raw`$x$ is an upper-triangular $3\times3$ matrix: its eigenvalues $\lambda_1,\lambda_2,\lambda_3$ (drag them) and a nilpotent part scaled by $k$. Left: $\log_{10}\norm{(\lambda e-x)^{-1}}$ with the spectrum (red) and the circles $\rho(x)$ (green) and $\norm x$ (orange). Right: $\norm{x^n}^{1/n}$ against $n$. It starts at $\norm x$, may first rise and then slowly decreases to $\rho(x)$ — never below. With a large $k$ the convergence is slow: $\norm{x^n}$ can grow for a long time before the geometric decay wins.`,
      deps: ['fa-10.12', 'fa-10.10', 'rca-10.23', 'fa-3.4a', 'fa-2.5'],
      see: ['rca-18.5'],
      tags: ['Banach algebras', 'spectrum', 'spectral radius'],
      verify: true,
      viz(v) {
        const M = v.M;
        const kS = v.slider('nilpotent part $k$', 0, 6, 2.5, { step: 0.05 });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, axes: true, title: '$\\log_{10}\\|(\\lambda e-x)^{-1}\\|$' });
        const R = v.stage({ x: [0, 81], y: [0, 3], height: 340, axes: 'box', xlabel: 'n', title: '$\\|x^n\\|^{1/n}$' });
        const H = [[0.85, 0.2], [-0.3, 0.55], [-0.45, -0.6]].map(([a, b], k) => L.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        let st = {};
        v.legend([['red', '$\\sigma(x)$', { dot: true }], ['green', '$\\rho(x)$', { dash: true }], ['orange', '$\\|x\\|$', { dash: true }], ['blue', '$\\|x^n\\|^{1/n}$', { dot: true }]]);
        v.render(() => {
          const k = kS.value, l = H.map((h) => [h.x, h.y]);
          const X = [[l[0], [k, 0], [0.5 * k, 0.4 * k]], [[0, 0], l[1], [-k, 0]], [[0, 0], [0, 0], l[2]]];
          L.heat((a, b) => { const B = msub(lamI(3, [a, b]), X), Bi = inv3(B); return Bi ? Math.log10(opnorm(Bi, 12)) : 6; }, { range: [-0.5, 3], cmap: 'magma', res: 3, key: JSON.stringify(X) });
          L.axes();
          const rho = Math.max(...l.map(cabs)), nx = opnorm(X);
          L.circle(0, 0, rho, { color: 'green', width: 2, dash: [6, 4] });
          L.circle(0, 0, Math.min(nx, 6), { color: 'orange', width: 2, dash: [6, 4] });
          // ‖x^n‖^{1/n}
          let P = ident(3); const pts = []; let inf = Infinity;
          for (let n = 1; n <= 80; n++) { P = mmul(P, X); const r = Math.pow(opnorm(P, 25), 1 / n); pts.push([n, r]); inf = Math.min(inf, r); }
          R.setView(null, [0, Math.max(1.2, nx * 1.1, ...pts.map((p) => p[1])) ]);
          R.hline(rho, { color: 'green', width: 2, dash: [6, 4] });
          R.hline(nx, { color: 'orange', width: 1.6, dash: [6, 4] });
          R.dots(pts, { color: 'blue', r: 2.8 });
          st = { rho, nx, last: pts[pts.length - 1][1], inf };
        });
        v.readout(() => `$\\rho(x) = ${v.fix(st.rho, 4)}$, $\\;\\|x\\| = ${v.fix(st.nx, 3)}$, $\\;\\|x^{80}\\|^{1/80} = ${v.fix(st.last, 4)}$, $\\;\\min_{n\\le80}\\|x^n\\|^{1/n} = ${v.fix(st.inf, 4)}\\ge\\rho(x)$.`);
      },
    },
    {
      num: '10.14',
      kind: 'Theorem',
      name: 'Gelfand–Mazur theorem',
      statement: String.raw`If $A$ is a Banach algebra in which every nonzero element is invertible (a division algebra), then $A$ is isometrically isomorphic to $\C$: every $x\in A$ equals $\lambda e$ for some $\lambda\in\C$.`,
      idea: String.raw`By 10.13, $\sigma(x)\ne\varnothing$; pick $\lambda\in\sigma(x)$. Then $\lambda e-x$ is not invertible, so in a division algebra it is $0$. Complex scalars are essential — Liouville's theorem is what makes the spectrum nonempty — and indeed the quaternions are a real Banach division algebra different from $\R$ and $\C$.`,
      caption: String.raw`The scalar function $f(\lambda)=\operatorname{tr}\,(\lambda e-x)^{-1}$ (phase portrait) for an element $x$ of three algebras (drag the diagonal entries $a$, $b$). Its poles are exactly $\sigma(x)$, and $\lambda f(\lambda)\to\dim A$ at infinity — so the poles cannot all disappear (Liouville). In $\C$ there is one pole $a$ and $ae-x=0$. In $\C^2$ (diagonal matrices) and in $M_2(\C)$, at each pole $\lambda$ the element $\lambda e-x$ is non-invertible **but not zero** (rank $1$): these are not division algebras.`,
      deps: ['fa-10.13'],
      see: ['rca-18.7'],
      tags: ['Banach algebras', 'division algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const alg = v.select('$A=$', [{ value: 'C', label: '$\\C$' }, { value: 'C2', label: '$\\C^2$ (diagonal)' }, { value: 'M2', label: '$M_2(\\C)$' }], 'M2');
        const bS = v.slider('off-diagonal entry ($M_2$)', -2, 2, 0.9, { step: 0.01 });
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.8, 1.8], equal: true, height: 360, axes: true, title: 'phase portrait of $f(\\lambda)=\\operatorname{tr}(\\lambda e-x)^{-1}$' });
        const ha = S.handle(-0.9, 0.5, { color: 'red', label: 'a' });
        const hb = S.handle(0.8, -0.4, { color: 'red', label: 'b' });
        let st = {};
        v.render(() => {
          const key = alg.value;
          hb.visible = key !== 'C'; bS.el.hidden = key !== 'M2';
          const a = [ha.x, ha.y], b = [hb.x, hb.y], off = key === 'M2' ? bS.value : 0;
          // for the triangular x = [[a, off], [c, b]] with c chosen so that the eigenvalues are not a, b (general position)
          const X = key === 'C' ? [[a]] : [[a, [off, 0]], [[key === 'M2' ? 0.6 * off : 0, 0], b]];
          const ev = key === 'C' ? [a] : eig2(X);
          const f = (z) => { let s = new v.Cx(0, 0); for (const e of ev) s = s.add(new v.Cx(1, 0).div(z.sub(new v.Cx(e[0], e[1])))); return s; };
          S.domain(f, { key: JSON.stringify([key, X]), res: 2 });
          S.axes();
          ev.forEach((e) => S.circle(e[0], e[1], 0.12, { color: 'ink', width: 2 }));
          // rank of λe − x at the first pole
          let rank = 0;
          if (key === 'C') rank = 0;
          else { const B = msub(lamI(2, ev[0]), X); const nz = B.flat().some((z) => cabs(z) > 1e-9); rank = nz ? 1 : 0; }
          st = { key, ev, rank };
        });
        v.readout(() => {
          const s = st;
          const sp = `$\\sigma(x)=\\{${s.ev.map((z) => fmtC(v, z, 2)).join(',\\;')}\\}$. `;
          return sp + (s.key === 'C' ? 'At the pole, $ae-x=0$: in a division algebra non-invertible means zero, so $x=ae$.' : `At $\\lambda_1$, $\\lambda_1e-x$ is non-invertible of rank $${s.rank}$ — ${s.rank ? 'nonzero, so $A$ is not a division algebra.' : 'zero only because $x$ happens to be scalar.'}`);
        });
      },
    },
    {
      num: '10.17',
      kind: 'Lemma',
      name: 'An open subset with no boundary inside W is a union of components',
      statement: String.raw`Suppose $V$ and $W$ are open subsets of some topological space, $V\subset W$, and $W$ contains no boundary point of $V$. Then $V$ is a union of components of $W$.`,
      idea: String.raw`Let $\Omega$ be a component of $W$ that meets $V$. Then $\Omega\cap V$ is open, and it is relatively closed in $\Omega$: a limit point of $V$ inside $\Omega\subset W$ is not a boundary point of $V$ by hypothesis, so it lies in $V$. Connectedness of $\Omega$ gives $\Omega\subset V$.`,
      caption: String.raw`$W$ (light blue) has three components; $V=W\cap\{\text{half-plane}\}$ for a half-plane you rotate and shift. Red: the boundary points of $V$ that lie in $W$ — the part of the edge line inside $W$. When there are none, every component of $W$ is either entirely in $V$ (green outline) or disjoint from it (grey): $V$ is a union of components.`,
      deps: [],
      see: ['rca-18.8'],
      tags: ['topology', 'components'],
      verify: true,
      viz(v) {
        const M = v.M;
        const thS = v.slider('angle of the half-plane', 0, 360, 30, { step: 1 });
        const dS = v.slider('offset', -2.5, 2.5, 0.9, { step: 0.01 });
        const S = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 360, axes: false, ticks: false });
        const COMP = [
          { inside: (x, y) => (x + 1.6) ** 2 + (y - 0.5) ** 2 < 0.8, draw: (s, o) => s.circle(-1.6, 0.5, Math.sqrt(0.8), o), pts: () => M.range(80).map((i) => [-1.6 + Math.sqrt(0.8) * Math.cos(M.TAU * i / 80), 0.5 + Math.sqrt(0.8) * Math.sin(M.TAU * i / 80)]) },
          { inside: (x, y) => { const r = Math.hypot(x - 0.9, y + 0.2); return r > 0.55 && r < 1.1; }, draw: (s, o) => { s.circle(0.9, -0.2, 1.1, o); s.circle(0.9, -0.2, 0.55, o); }, pts: () => M.range(80).flatMap((i) => [[0.9 + 1.1 * Math.cos(M.TAU * i / 80), -0.2 + 1.1 * Math.sin(M.TAU * i / 80)], [0.9 + 0.55 * Math.cos(M.TAU * i / 80), -0.2 + 0.55 * Math.sin(M.TAU * i / 80)]]) },
          { inside: (x, y) => Math.abs(x - 2.3) < 0.35 && Math.abs(y - 1.3) < 0.5, draw: (s, o) => s.rect(1.95, 0.8, 2.65, 1.8, o), pts: () => [[1.95, 0.8], [2.65, 0.8], [2.65, 1.8], [1.95, 1.8]] },
        ];
        let st = {};
        v.legend([['blue', '$W$', { area: true }], ['purple', '$V$', { area: true }], ['red', '$\\partial V\\cap W$']]);
        v.render(() => {
          const th = thS.value * Math.PI / 180, d = dS.value, n = [Math.cos(th), Math.sin(th)];
          const inH = (x, y) => x * n[0] + y * n[1] < d;
          const inW = (x, y) => COMP.some((c) => c.inside(x, y));
          S.raster((x, y) => (inW(x, y) ? (inH(x, y) ? [125, 80, 200, 150] : [70, 120, 220, 60]) : null), { key: `${th}|${d}`, res: 2 });
          // edge line and its part inside W
          const p0 = [n[0] * d, n[1] * d], dir = [-n[1], n[0]];
          S.line(p0[0] - 8 * dir[0], p0[1] - 8 * dir[1], p0[0] + 8 * dir[0], p0[1] + 8 * dir[1], { color: 'muted', width: 1, dash: [5, 4] });
          const hits = [];
          for (let i = 0; i <= 1600; i++) { const s = -8 + 16 * i / 1600, x = p0[0] + s * dir[0], y = p0[1] + s * dir[1]; if (inW(x, y)) hits.push([x, y]); }
          S.dots(hits, { color: 'red', r: 2.2 });
          let unions = 0;
          COMP.forEach((c) => {
            const P = c.pts(), allIn = P.every(([x, y]) => inH(x, y)), allOut = P.every(([x, y]) => !inH(x, y));
            c.draw(S, { color: allIn ? 'green' : allOut ? 'muted' : 'red', width: 2 });
            if (allIn) unions++;
          });
          st = { bad: hits.length > 0, unions };
        });
        v.readout(() => (st.bad ? 'Some boundary points of $V$ lie in $W$ (red): the hypothesis fails, and $V$ cuts a component in two.' : `No boundary point of $V$ lies in $W$, and $V$ is the union of ${st.unions} whole component(s) of $W$.`));
      },
    },
    {
      num: '10.18',
      kind: 'Theorem',
      name: 'Spectrum in a closed subalgebra',
      statement: String.raw`Suppose $A$ is a Banach algebra, $x\in A$, $\Omega$ is an open set in $\C$, and $\sigma_A(x)\subset\Omega$. Then $\sigma_A(x+y)\subset\Omega$ for all $y$ of sufficiently small norm (upper semicontinuity). Moreover, if $B$ is a closed subalgebra of $A$ containing $e$ and $x\in B$, then
$$\sigma_A(x)\subset\sigma_B(x)\qquad\text{and}\qquad\partial\sigma_B(x)\subset\sigma_A(x),$$
so $\sigma_B(x)$ is $\sigma_A(x)$ together with some (possibly none) of the bounded components of $\C\setminus\sigma_A(x)$.`,
      idea: String.raw`Upper semicontinuity: $\norm{(\lambda e-x)^{-1}}$ is bounded on the closed set $\C\setminus\Omega$ (it tends to $0$ at $\infty$), so $\lambda e-x-y$ stays invertible there for small $\norm y$ (10.12). For the subalgebra: an inverse in $B$ is an inverse in $A$, giving $\sigma_A\subset\sigma_B$. If $\lambda\in\partial\sigma_B(x)$, take $\lambda_n\to\lambda$ outside $\sigma_B$; were $\lambda\notin\sigma_A$, the inverses $(\lambda_ne-x)^{-1}\in B$ would converge in $A$ to $(\lambda e-x)^{-1}$, which would then lie in the closed set $B$. Lemma 10.17 then identifies $\sigma_B$ as a union of components.`,
      caption: String.raw`$A=\ell^1(\Z)$ (absolutely convergent Fourier series) and $B=\ell^1(\Z_+)$ (power series), $x=c_0\delta_0+c_1\delta_1+c_2\delta_2+c_3\delta_3$. Then $\sigma_A(x)$ is the curve $\hat x(\T)$ and $\sigma_B(x)=\hat x(\overline{U})$ fills in the holes of positive winding number (orange). Drag $\lambda$: the bars on the right are the coefficients of $(\lambda e-x)^{-1}$ computed in $A$ (Laurent coefficients). Outside the filled region they vanish for negative indices — the inverse lies in $B$; inside a hole the inverse exists in $A$ but needs negative indices: $\lambda\in\sigma_B(x)\setminus\sigma_A(x)$.`,
      deps: ['fa-10.17', 'fa-10.12', 'fa-10.13'],
      see: ['rca-18.9'],
      tags: ['Banach algebras', 'spectrum', 'subalgebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const c2S = v.slider('$c_2$', -1, 1, 0.55, { step: 0.01 });
        const c3S = v.slider('$c_3$', -1, 1, 0.3, { step: 0.01 });
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.2, 2.2], equal: true, height: 360, axes: true, title: '$\\sigma_A(x)=\\hat x(\\T)$ and $\\sigma_B(x)=\\hat x(\\overline U)$' });
        const R = v.stage({ x: [-12.5, 12.5], y: [-1, 1], height: 360, axes: 'box', xlabel: 'n', title: 'coefficients of $(\\lambda e-x)^{-1}$ in $\\ell^1(\\Z)$' });
        const hl = L.handle(0.35, 0.15, { color: 'blue', label: 'λ' });
        const N = 256;
        let st = {};
        v.legend([['blue', '$\\sigma_A$: the curve'], ['orange', 'holes filled in $\\sigma_B$', { area: true }], ['green', 'coefficients $n\\ge0$'], ['red', 'coefficients $n<0$']]);
        v.render(() => {
          const c = [[0.1, 0], [1, 0], [c2S.value, 0.15], [c3S.value, -0.1]];
          const xh = (z) => { let s = [0, 0], p = [1, 0]; for (const ck of c) { s = cadd(s, cmul(ck, p)); p = cmul(p, z); } return s; };
          const curve = M.range(N + 1).map((k) => xh([Math.cos(M.TAU * k / N), Math.sin(M.TAU * k / N)]));
          const wind = (w) => { let tot = 0; for (let k = 0; k < N; k++) { const a = csub(curve[k], w), b = csub(curve[k + 1], w); tot += Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]); } return Math.round(tot / M.TAU); };
          L.raster((x, y) => { const k = wind([x, y]); return k > 0 ? [230, 140, 40, Math.min(220, 70 + 60 * k)] : null; }, { key: `${c2S.value},${c3S.value}`, res: 3 });
          L.path(curve, { color: 'blue', width: 2.4 });
          const lam = [hl.x, hl.y], k = wind(lam);
          let dmin = Infinity; for (const p of curve) dmin = Math.min(dmin, cabs(csub(p, lam)));
          // Laurent coefficients of 1/(λ − x̂) on the circle
          const g = M.range(N).map((j) => { const z = [Math.cos(M.TAU * j / N), Math.sin(M.TAU * j / N)]; return cdiv([1, 0], csub(lam, xh(z))); });
          const coef = []; for (let n = -12; n <= 12; n++) { let s = [0, 0]; for (let j = 0; j < N; j++) { const t = -M.TAU * j * n / N; s = cadd(s, cmul(g[j], [Math.cos(t), Math.sin(t)])); } coef.push([n, cabs(s) / N]); }
          const onCurve = dmin < 0.03;
          const mx = Math.max(...coef.map((p) => p[1]), 0.1);
          R.setView(null, [0, onCurve ? 1 : mx * 1.15]);
          if (!onCurve) coef.forEach(([n, a]) => R.rect(n - 0.35, 0, n + 0.35, a, { fill: n < 0 ? 'red' : 'green', fillAlpha: 0.75, stroke: false }));
          else R.corner('λ ∈ σ_A(x): no inverse at all', 'tl', { color: 'red', weight: 600 });
          const neg = coef.filter(([n]) => n < 0).reduce((s, [, a]) => s + a, 0);
          st = { k, onCurve, neg };
        });
        v.readout(() => {
          const s = st;
          if (s.onCurve) return '$\\lambda$ is on the curve: $\\lambda\\in\\sigma_A(x)\\subset\\sigma_B(x)$.';
          return s.k > 0 ? `Winding number $${s.k}$: $\\lambda\\in\\sigma_B(x)\\setminus\\sigma_A(x)$ — the inverse in $A$ has negative-index mass $${v.fix(s.neg, 3)}$, so it is not in $B$.` : `Winding number $0$: $\\lambda\\notin\\sigma_B(x)$ — the inverse is a power series (negative-index mass $${v.sci(s.neg + 1e-17, 1)}$).`;
        });
      },
    },
  ],
};
