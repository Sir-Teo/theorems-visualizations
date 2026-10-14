// Rudin, Functional Analysis — Chapter 11 (part 3): spectra of sums and products, isometric Gelfand
// transforms, involutions on Δ, maximal commutative subalgebras
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
const madd = (A, B) => A.map((row, i) => row.map((a, j) => cadd(a, B[i][j])));
const msub = (A, B) => A.map((row, i) => row.map((a, j) => csub(a, B[i][j])));
const fro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const diagC = (d) => d.map((z, i) => d.map((_, j) => (i === j ? z : [0, 0])));
const realM = (A) => A.map((r) => r.map((x) => [x, 0]));
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
  let R = Array.from({ length: n }, (_, k) => cmul([0.4, 0.9], cexpi(2 * Math.PI * k / n + 0.3)));
  const sc = 1 + Math.max(...c.slice(0, n).map(cabs)); R = R.map((z) => [z[0] * sc, z[1] * sc]);
  for (let it = 0; it < 300; it++) {
    let moved = 0;
    R = R.map((z, i) => { let d = [1, 0]; R.forEach((w, j) => { if (j !== i) d = cmul(d, csub(z, w)); }); const step = cdiv(p(z), d); moved = Math.max(moved, cabs(step)); return csub(z, step); });
    if (moved < 1e-13) break;
  }
  return R;
}
/** Operator 2-norm of a complex matrix (power iteration on A*A). */
function opnorm(A, it = 80) {
  const n = A[0].length; let v = Array.from({ length: n }, (_, i) => [1 / Math.sqrt(n), (i % 2 ? 0.37 : -0.21) / Math.sqrt(n)]), s = 0;
  for (let k = 0; k < it; k++) {
    const w = A.map((row) => row.reduce((acc, a, j) => cadd(acc, cmul(a, v[j])), [0, 0]));
    const u = A[0].map((_, j) => A.reduce((acc, row, i) => cadd(acc, cmul(cconj(row[j]), w[i])), [0, 0]));
    const nu = Math.sqrt(u.reduce((acc, z) => acc + z[0] * z[0] + z[1] * z[1], 0)); if (nu < 1e-300) return 0;
    s = Math.sqrt(nu); v = u.map((z) => [z[0] / nu, z[1] / nu]);
  }
  return s;
}
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), d)}i`;
/** Polynomial (complex coefficient list) helpers. */
const pmul = (a, b) => { const r = Array.from({ length: a.length + b.length - 1 }, () => [0, 0]); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = cadd(r[i + j], cmul(x, y)); })); return r; };
const peval = (a, z) => { let s = [0, 0]; for (let k = a.length - 1; k >= 0; k--) s = cadd(cmul(s, z), a[k]); return s; };

export default {
  book: 'fa',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.6
    {
      num: '11.6',
      kind: 'Theorem',
      name: 'Spectra of sums and products in a commutative algebra',
      statement: String.raw`If $A$ is a commutative Banach algebra and $x,y\in A$, then
$$\sigma(x+y)\subset\sigma(x)+\sigma(y),\qquad\sigma(xy)\subset\sigma(x)\,\sigma(y),$$
and consequently $\rho(x+y)\le\rho(x)+\rho(y)$ and $\rho(xy)\le\rho(x)\rho(y)$.`,
      idea: String.raw`By 11.5(e) every $\lambda\in\sigma(x+y)$ is $h(x+y)$ for some $h\in\Delta$, and $h(x+y)=h(x)+h(y)$ with $h(x)\in\sigma(x)$, $h(y)\in\sigma(y)$; likewise $h(xy)=h(x)h(y)$. The point is that the **same** $h$ evaluates both summands. The inclusions are usually strict, since only the pairs $(h(x),h(y))$ coming from one $h$ occur. Without commutativity both inclusions fail (see 11.21).`,
      caption: String.raw`$A=C(\T)$, where $\Delta=\T$ and $\sigma(f)=f(\T)$. $f(t)=e^{it}+a\,e^{-2it}$ (red) and $g(t)=c+b\,e^{ikt}$ (blue); drag $a$, $b$, $c$ in the small panel and set $k$. The grey cloud is the set $\sigma(f)+\sigma(g)$ of all sums $f(s)+g(t)$, or the products $f(s)g(t)$. The green curve $\sigma(f+g)$, resp. $\sigma(fg)$, uses only $s=t$, so it stays inside the cloud and fills only a thin part of it.`,
      deps: ['fa-11.5', 'fa-10.13'],
      tags: ['commutative Banach algebras', 'spectrum'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'sum', label: '$\\sigma(f+g)$' }, { value: 'prod', label: '$\\sigma(fg)$' }], 'sum');
        const kS = v.slider('frequency $k$ of $g$', 1, 5, 3, { int: true });
        const S = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 380, axes: true, title: 'spectra in $\\C$' });
        const P = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 380, weight: 0.45, minWidth: 200, axes: true, ticks: false, title: 'coefficients' });
        const ha = P.handle(0.45, 0.15, { color: 'red', label: 'a' });
        const hb = P.handle(0.35, -0.55, { color: 'blue', label: 'b' });
        const hc = P.handle(-0.4, 0.3, { color: 'blue', label: 'c' });
        let st = {};
        v.legend([['red', '$\\sigma(f)=f(\\T)$'], ['blue', '$\\sigma(g)=g(\\T)$'], ['muted', '$\\sigma(f)+\\sigma(g)$ (or $\\sigma(f)\\sigma(g)$)', { area: true }], ['green', '$\\sigma(f+g)$ (or $\\sigma(fg)$)']]);
        v.render(() => {
          const a = [ha.x, ha.y], b = [hb.x, hb.y], c = [hc.x, hc.y], k = kS.value, prod = mode.value === 'prod';
          const f = (t) => cadd(cexpi(t), cmul(a, cexpi(-2 * t))), g = (t) => cadd(c, cmul(b, cexpi(k * t)));
          const op = prod ? cmul : cadd;
          const n = 150, cloud = [];
          for (let i = 0; i < n; i++) { const fs = f(2 * Math.PI * i / n); for (let j = 0; j < n; j++) cloud.push(op(fs, g(2 * Math.PI * j / n))); }
          const ext = Math.max(3.2, 1.05 * Math.max(...cloud.map((z) => Math.max(Math.abs(z[0]), Math.abs(z[1])))));
          S.setView([-ext, ext], [-ext, ext]);
          S.dots(cloud, { color: 'muted', r: 1.1, alpha: 0.18 });
          S.curve((t) => f(t), 0, 2 * Math.PI, { n: 400, color: 'red', width: 2.2 });
          S.curve((t) => g(t), 0, 2 * Math.PI, { n: 400, color: 'blue', width: 2.2 });
          S.curve((t) => op(f(t), g(t)), 0, 2 * Math.PI, { n: 900, color: 'green', width: 2.8 });
          P.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          let rf = 0, rg = 0, rs = 0;
          for (let i = 0; i < 1440; i++) { const t = 2 * Math.PI * i / 1440, F = f(t), G = g(t); rf = Math.max(rf, cabs(F)); rg = Math.max(rg, cabs(G)); rs = Math.max(rs, cabs(op(F, G))); }
          st = { rf, rg, rs, prod };
        });
        v.readout(() => {
          const s = st;
          return s.prod ? `$\\rho(fg)=${v.fix(s.rs, 3)}\\;\\le\\;\\rho(f)\\rho(g)=${v.fix(s.rf, 3)}\\cdot${v.fix(s.rg, 3)}=${v.fix(s.rf * s.rg, 3)}$.` : `$\\rho(f+g)=${v.fix(s.rs, 3)}\\;\\le\\;\\rho(f)+\\rho(g)=${v.fix(s.rf, 3)}+${v.fix(s.rg, 3)}=${v.fix(s.rf + s.rg, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.12
    {
      num: '11.12',
      kind: 'Theorem',
      name: 'The Gelfand transform is isometric iff ‖x²‖ = ‖x‖²',
      statement: String.raw`Let $A$ be a commutative Banach algebra. Then $\norm{\hat x}_\infty=\norm x$ for every $x\in A$ if and only if
$$\norm{x^2}=\norm x^2\qquad(x\in A).$$
In that case $A$ is semisimple and $\hat A$ is a closed subalgebra of $C(\Delta)$.`,
      idea: String.raw`If $\norm{x^2}=\norm x^2$ for all $x$, induction gives $\norm{x^{2^k}}=\norm x^{2^k}$, so the spectral radius formula (10.13) along the subsequence $n=2^k$ yields $\rho(x)=\norm x$, and $\rho(x)=\norm{\hat x}_\infty$ by 11.9. Conversely $\norm{\hat x^2}_\infty=\norm{\hat x}_\infty^2$ always holds in $C(\Delta)$. An isometry has trivial kernel (so $\operatorname{rad}A=0$) and closed range. In general $\norm{x^n}^{1/n}$ decreases toward $\norm{\hat x}_\infty$, and the gap measures how far the norm is from a sup norm.`,
      caption: String.raw`$x=1+az+bz^2$ (drag $a,b$) in two Banach algebras with the same $\Delta=\overline U$: $\ell^1(\Z_+)$ (norm $\sum|c_n|$) and the disc algebra (sup norm). Left: $|\hat x|$ on $\Delta$; the dot marks its maximum $\norm{\hat x}_\infty=\rho(x)$. Right: $\norm{x^n}^{1/n}$ for $n=1,\dots,64$ (dots at $n=2^k$, the subsequence used in the proof). With the sup norm it is constant, because $\norm{x^2}=\norm x^2$. In $\ell^1$ it starts at $\norm x$ and creeps down to $\rho(x)$.`,
      deps: ['fa-11.9', 'fa-10.13', 'fa-11.13'],
      tags: ['Gelfand transform', 'commutative Banach algebras'],
      verify: true,
      viz(v) {
        const M = v.M;
        const nrm = v.select('norm', [{ value: 'l1', label: '$\\ell^1(\\Z_+)$: $\\sum|c_n|$' }, { value: 'sup', label: 'disc algebra: $\\max_{\\overline U}|x|$' }], 'l1');
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: false, ticks: false, title: '$|\\hat x|$ on $\\Delta=\\overline U$; handles $a$, $b$' });
        const R = v.stage({ x: [-0.2, 6.5], y: [0, 3], height: 340, axes: 'box', xlabel: 'n', xticks: [0, 1, 2, 3, 4, 5, 6].map((k) => [k, String(2 ** k)]), title: '$\\|x^n\\|^{1/n}$ ($n$ on a log scale)' });
        const ha = L.handle(0, 0.8, { color: 'orange', label: 'a' });
        const hb = L.handle(0.7, 0, { color: 'purple', label: 'b' });
        let st = {}, cache = { key: '' };
        v.legend([['ink', '$\\|x^n\\|^{1/n}$'], ['orange', '$\\|x\\|$', { dash: true }], ['green', '$\\rho(x)=\\|\\hat x\\|_\\infty$', { dash: true }]]);
        v.render(() => {
          const a = [ha.x, ha.y], b = [hb.x, hb.y], x = [[1, 0], a, b];
          L.raster((p, q) => { if (p * p + q * q > 1) return null; const m = cabs(peval(x, [p, q])), t = Math.min(1, m / 3); return M.cmap(t, 'viridis'); }, { key: `${a}|${b}`, res: 3 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.5 });
          let rho = 0, arg = [1, 0];
          for (let i = 0; i < 1440; i++) { const z = cexpi(2 * Math.PI * i / 1440), m = cabs(peval(x, z)); if (m > rho) { rho = m; arg = z; } }
          L.dot(arg[0], arg[1], { color: 'green', r: 5, label: 'max', labelPos: arg[0] > 0 ? 'e' : 'w' });
          const key = `${a}|${b}`;
          if (cache.key !== key) {
            const l1 = []; let p = [[1, 0]];
            for (let n = 1; n <= 64; n++) { p = pmul(p, x); let s = 0; for (const c of p) s += cabs(c); l1.push(Math.pow(s, 1 / n)); }
            cache = { key, l1 };
          }
          const sup = nrm.value === 'sup', seq = sup ? cache.l1.map(() => rho) : cache.l1, nx = seq[0];
          R.setView(null, [Math.min(rho, nx) - 0.25 * Math.max(0.4, nx - rho), Math.max(rho, nx) + 0.25 * Math.max(0.4, nx - rho)]);
          R.hline(nx, { color: 'orange', width: 1.6, dash: [6, 4] });
          R.hline(rho, { color: 'green', width: 1.8, dash: [6, 4] });
          R.path(seq.map((y, i) => [Math.log2(i + 1), y]), { color: 'ink', width: 2.2 });
          [1, 2, 4, 8, 16, 32, 64].forEach((n) => R.dot(Math.log2(n), seq[n - 1], { color: 'ink', r: 3.5 }));
          st = { sup, nx, n2: sup ? rho * rho : cache.l1[1] ** 2, rho, last: seq[63] };
        });
        v.readout(() => {
          const s = st;
          return `$\\|x\\|=${v.fix(s.nx, 4)}$, $\\|x^2\\|=${v.fix(s.n2, 4)}$ vs $\\|x\\|^2=${v.fix(s.nx * s.nx, 4)}$; $\\rho(x)=${v.fix(s.rho, 4)}$, $\\|x^{64}\\|^{1/64}=${v.fix(s.last, 4)}$. ` + (s.sup ? 'Sup norm: $\\|x^2\\|=\\|x\\|^2$ and the Gelfand transform is an isometry.' : (s.nx - s.rho > 1e-6 ? 'In $\\ell^1(\\Z_+)$ the transform shrinks this $x$: $\\|\\hat x\\|_\\infty<\\|x\\|$.' : 'For this $x$ the two happen to agree.'));
        });
      },
    },
    // ------------------------------------------------------------------ 11.16
    {
      num: '11.16',
      kind: 'Theorem',
      name: 'Involutions act on Δ; semisimple ⇒ the involution is continuous',
      statement: String.raw`Let $A$ be a commutative Banach algebra with an involution.
(a) For each $h\in\Delta$, $\tilde h(x)=\overline{h(x^*)}$ defines an element $\tilde h\in\Delta$. The map $\tau:h\mapsto\tilde h$ is a homeomorphism of $\Delta$ with $\tau\circ\tau=\mathrm{id}$, and $\widehat{x^*}=\overline{\hat x\circ\tau}$.
(b) If $A$ is semisimple, the involution is continuous: there is a $C$ with $\norm{x^*}\le C\norm x$.`,
      idea: String.raw`(a) $\tilde h$ is linear and multiplicative because the involution reverses products and conjugates scalars, and $\tilde h(e)=1$ (11.15). $\tilde h_\alpha\to\tilde h$ whenever $h_\alpha\to h$ pointwise, so $\tau$ is continuous; it is its own inverse. (b) Closed graph theorem (2.15). If $x_n\to x$ and $x_n^*\to y$, then for every $h$, $h(y)=\lim h(x_n^*)=\lim\overline{\tilde h(x_n)}=\overline{\tilde h(x)}=h(x^*)$, since $\tilde h$ is continuous. So $y-x^*$ lies in the radical, which is $\{0\}$.`,
      caption: String.raw`Two involutions on algebras whose $\Delta$ you can see. **Disc algebra**, $f^*(z)=\overline{f(\bar z)}$: here $\tau(w)=\bar w$, a reflection of the disc. **$\ell^1(\Z)$**, $x^*_n=\overline{x_{-n}}$: here $\Delta=\T$ and $\tau=\mathrm{id}$. Drag the point $w$ and the coefficients of $f=c_0+c_1z+c_2z^2$ (right). The readout checks $\widehat{f^*}(w)=\overline{\hat f(\tau w)}$. The colour shows $|\operatorname{Im}\widehat{(f+f^*)}|$ for the hermitian element $f+f^*$: it vanishes exactly on the fixed points of $\tau$ (the real diameter, or the whole circle).`,
      deps: ['fa-11.15', 'fa-11.9', 'fa-11.7', 'fa-2.15'],
      tags: ['involutions', 'commutative Banach algebras', 'automatic continuity'],
      verify: true,
      viz(v) {
        const M = v.M;
        const alg = v.select('algebra', [{ value: 'disc', label: "disc algebra, $f^*(z)=\\overline{f(\\bar z)}$" }, { value: 'l1', label: "$\\ell^1(\\Z)$, $x^*_n=\\overline{x_{-n}}$" }], 'disc');
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: true, ticks: false, title: '$\\Delta$, the point $w$ and $\\tau(w)$' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 340, weight: 0.6, minWidth: 220, axes: true, ticks: false, title: 'coefficients $c_0,c_1,c_2$' });
        const hw = L.handle(0.45, 0.55, { color: 'blue', label: 'w', constrain: (x, y) => { const r = Math.hypot(x, y); if (alg.value === 'l1') return [x / (r || 1), y / (r || 1)]; return r > 1 ? [x / r, y / r] : [x, y]; } });
        const hc = [[0.2, 0.3], [0.6, -0.4], [-0.3, 0.5]].map(([x, y], k) => R.handle(x, y, { color: ['orange', 'purple', 'teal'][k], label: `c${'₀₁₂'[k]}` }));
        let st = {};
        v.legend([['blue', '$w$'], ['red', '$\\tau(w)$'], ['muted', '$|\\operatorname{Im}(f+f^*)^\\wedge|$ (bright = large)', { area: true }]]);
        v.render(() => {
          const disc = alg.value === 'disc', c = hc.map((h) => [h.x, h.y]);
          if (!disc) { const r = Math.hypot(hw.x, hw.y); if (Math.abs(r - 1) > 1e-9) hw.set(hw.x / (r || 1), hw.y / (r || 1)); }
          // f̂(w) = Σ c_n w^n; disc: (f*)^(w) = conj f̂(w̄); ℓ¹(Z): x* has coefficients conj c_{−n}, so (x*)^(w) = Σ conj(c_n) w^{−n} = conj f̂(w) on |w| = 1
          const fh = (z) => peval(c, z);
          const fsh = (z) => (disc ? cconj(fh(cconj(z))) : cconj(fh(z)));
          if (disc) L.raster((x, y) => { if (x * x + y * y > 1) return null; const z = [x, y], im = Math.abs(fh(z)[1] + fsh(z)[1]), t = Math.min(1, im / 1.5); return M.cmap(0.15 + 0.8 * t, 'magma'); }, { key: `d${c}`, res: 3 });
          else for (let i = 0; i < 360; i++) { const t0 = 2 * Math.PI * i / 360; L.line(Math.cos(t0), Math.sin(t0), Math.cos(t0 + 0.018), Math.sin(t0 + 0.018), { color: 'green', width: 6, alpha: 0.4 }); }
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          if (disc) L.line(-1, 0, 1, 0, { color: 'green', width: 2.6 });
          const w = [hw.x, hw.y], tw = disc ? cconj(w) : w;
          L.dot(tw[0], tw[1], { color: 'red', r: 6, hollow: true, label: 'τ(w)', labelPos: 'se' });
          if (disc) L.line(w[0], w[1], tw[0], tw[1], { color: 'red', width: 1, dash: [3, 3] });
          R.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          const lhs = fsh(w), rhs = cconj(fh(tw)), herm = cadd(fh(w), fsh(w));
          st = { disc, lhs, rhs, herm, err: cabs(csub(lhs, rhs)) };
        });
        v.readout(() => {
          const s = st;
          return `$\\widehat{f^*}(w)=${fmtC(v, s.lhs)}$, $\\overline{\\hat f(\\tau w)}=${fmtC(v, s.rhs)}$ (difference $${s.err < 1e-14 ? '0' : v.sci(s.err, 1)}$ up to rounding). Hermitian element: $\\widehat{(f+f^*)}(w)=${fmtC(v, s.herm)}$` + (s.disc ? ' — real only on the real diameter, the fixed set of $\\tau$.' : ' — real everywhere on $\\Delta$: this involution is **symmetric** ($\\tau=\\mathrm{id}$).');
        });
      },
    },
    // ------------------------------------------------------------------ 11.21
    {
      num: '11.21',
      kind: 'Theorem',
      name: 'Maximal commutative subalgebras; commuting elements',
      statement: String.raw`Let $A$ be a Banach algebra (not necessarily commutative) and $B$ a maximal commutative subalgebra of $A$. Then $B$ is closed, $e\in B$, and
$$\sigma_B(x)=\sigma_A(x)\qquad(x\in B).$$
Consequently, if $x,y\in A$ commute, then $\sigma(x+y)\subset\sigma(x)+\sigma(y)$ and $\sigma(xy)\subset\sigma(x)\sigma(y)$, so $\rho(x+y)\le\rho(x)+\rho(y)$ and $\rho(xy)\le\rho(x)\rho(y)$.`,
      idea: String.raw`$B$ equals its commutant within $A$: anything commuting with all of $B$ can be adjoined, so by maximality it already lies in $B$. Commutants are closed and contain $e$. If $x\in B$ and $x-\lambda e$ is invertible in $A$, its inverse commutes with everything that commutes with $x$, so it lies in $B$. Hence $\sigma_B(x)\subset\sigma_A(x)$, and the reverse inclusion is trivial. Zorn's lemma puts any commuting pair $x,y$ into a maximal commutative $B$, and 11.6 applies inside $B$.`,
      caption: String.raw`$A=M_3(\C)$, with $x$ diagonal in one basis (eigenvalues $\lambda_k$, red) and $y$ diagonal in a second basis that is rotated by the angle $\theta$ (eigenvalues $\mu_k$, blue). Grey dots: the nine sums $\lambda_j+\mu_k$ (or products). Green: the actual eigenvalues of $x+y$ (or $xy$), computed from the matrices. At $\theta=0$, $x$ and $y$ commute, and $\sigma(x+y)=\{\lambda_k+\mu_k\}$ sits on three of the nine dots. Turn $\theta$: the commutator grows and the eigenvalues leave the grid.`,
      deps: ['fa-11.6', 'fa-10.10', 'fa-11.5'],
      tags: ['Banach algebras', 'spectrum', 'commuting elements'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'sum', label: '$x+y$' }, { value: 'prod', label: '$xy$' }], 'sum');
        const thS = v.slider('angle $\\theta$ between the eigenbases', 0, 1.2, 0, { step: 0.005 });
        const S = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 380, axes: true, title: '$\\sigma(x)$, $\\sigma(y)$ and $\\sigma(x+y)$ in $\\C$' });
        const HL = [[1.1, 0.5], [-0.9, 0.8], [0.2, -1.0]].map(([a, b], k) => S.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        const HM = [[0.6, -0.3], [0.9, 0.9], [-1.2, -0.6]].map(([a, b], k) => S.handle(a, b, { color: 'blue', r: 6, label: `μ${'₁₂₃'[k]}` }));
        const Sm = [[1, 0.6, -0.4], [0, 1, 0.8], [0, 0, 1]], Si = [[1, -0.6, 0.4 + 0.48], [0, 1, -0.8], [0, 0, 1]];   // S and S⁻¹ (unipotent)
        let st = {};
        v.legend([['muted', 'all $\\lambda_j+\\mu_k$ (or $\\lambda_j\\mu_k$)'], ['green', 'eigenvalues of $x+y$ (or $xy$)'], ['green', 'paired values $\\lambda_k+\\mu_k$', { dot: true }]]);
        v.render(() => {
          const th = thS.value, prod = mode.value === 'prod', op = prod ? cmul : cadd;
          const L = HL.map((h) => [h.x, h.y]), Mu = HM.map((h) => [h.x, h.y]);
          const c1 = Math.cos(th), s1 = Math.sin(th), c2 = Math.cos(0.7 * th), s2 = Math.sin(0.7 * th);
          const Rot = [[c1, -s1, 0], [s1 * c2, c1 * c2, -s2], [s1 * s2, c1 * s2, c2]];        // orthogonal
          const RotT = Rot[0].map((_, j) => Rot.map((r) => r[j]));
          const X = mmul(mmul(realM(Sm), diagC(L)), realM(Si));
          const Y = mmul(mmul(mmul(mmul(realM(Sm), realM(Rot)), diagC(Mu)), realM(RotT)), realM(Si));
          const Z = prod ? mmul(X, Y) : madd(X, Y), ev = eigC(Z);
          const comm = fro(msub(mmul(X, Y), mmul(Y, X)));
          const grid = []; L.forEach((l) => Mu.forEach((m) => grid.push(op(l, m))));
          const paired = L.map((l, k) => op(l, Mu[k]));
          const ext = Math.max(2.4, 1.15 * Math.max(...[...grid, ...ev].map((z) => Math.max(Math.abs(z[0]) * 0.8, Math.abs(z[1])))));
          S.setView([-ext * 1.25, ext * 1.25], [-ext, ext]);
          grid.forEach((z) => S.dot(z[0], z[1], { color: 'muted', r: 4 }));
          paired.forEach((z) => S.dot(z[0], z[1], { color: 'green', r: 8, hollow: true }));
          ev.forEach((z) => S.dot(z[0], z[1], { color: 'green', r: 4.5 }));
          const off = Math.max(...ev.map((z) => Math.min(...grid.map((g) => cabs(csub(z, g))))));
          const rx = Math.max(...L.map(cabs)), ry = Math.max(...Mu.map(cabs)), rz = Math.max(...ev.map(cabs));
          st = { comm, off, rx, ry, rz, prod };
        });
        v.readout(() => {
          const s = st, bound = s.prod ? s.rx * s.ry : s.rx + s.ry;
          return `$\\|xy-yx\\|=${v.fix(s.comm, 3)}$. Largest distance from an eigenvalue of $x${s.prod ? '' : '+'}y$ to the grey grid: $${v.fix(s.off, 3)}$. $\\rho(x${s.prod ? '' : '+'}y)=${v.fix(s.rz, 3)}$ vs $\\rho(x)${s.prod ? '\\rho(y)' : '+\\rho(y)'}=${v.fix(bound, 3)}$` + (s.comm < 1e-9 ? ' — commuting: the inclusion holds.' : s.rz > bound + 1e-6 ? ' — the inequality **fails**: $x$ and $y$ do not commute.' : '.');
        });
      },
    },
  ],
};
