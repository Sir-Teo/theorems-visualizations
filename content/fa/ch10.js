// Rudin, Functional Analysis — Chapter 10: Banach Algebras
//
// Numbering note: the numbers below follow the 2nd edition (1991) as far as they could be recalled;
// items whose number or exact formulation could not be checked against the book carry `verify: true`.

// ---------------------------------------------------------------- shared helpers (batch 1)
/** ℓ^p norm of a real array (p may be Infinity). */
function pnorm(a, p) {
  if (p === Infinity) return Math.max(0, ...a.map(Math.abs));
  return Math.pow(a.reduce((s, x) => s + Math.pow(Math.abs(x), p), 0), 1 / p);
}
/** Convolution of two finite real sequences. */
function conv(a, b) {
  const c = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) c[i + j] += a[i] * b[j];
  return c;
}
/** Phase colour (hue = argument, light bands = log-modulus contours). Returns [r,g,b,a]. */
function phaseRGB(M, re, im, alpha = 255) {
  if (!isFinite(re) || !isFinite(im)) return [245, 245, 245, alpha];
  const mod = Math.hypot(re, im), t = M.fract(Math.log2(mod + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  return [c[0], c[1], c[2], alpha];
}
/** Complex polynomials as arrays of [re, im], lowest degree first. */
function cpolyMul(p, q) {
  const r = Array.from({ length: p.length + q.length - 1 }, () => [0, 0]);
  for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) {
    r[i + j][0] += p[i][0] * q[j][0] - p[i][1] * q[j][1];
    r[i + j][1] += p[i][0] * q[j][1] + p[i][1] * q[j][0];
  }
  return r;
}
function cpolyEval(p, x, y) {
  let re = 0, im = 0;
  for (let k = p.length - 1; k >= 0; k--) { const r = re * x - im * y + p[k][0]; im = re * y + im * x + p[k][1]; re = r; }
  return [re, im];
}
/** Power-series coefficients of 1/p (p[0] ≠ 0), first N terms. */
function cpolyRecip(p, N) {
  const c = [], d = p[0][0] ** 2 + p[0][1] ** 2, inv0 = [p[0][0] / d, -p[0][1] / d];
  for (let n = 0; n < N; n++) {
    let re = n === 0 ? 1 : 0, im = 0;
    for (let k = 1; k <= Math.min(n, p.length - 1); k++) { re -= p[k][0] * c[n - k][0] - p[k][1] * c[n - k][1]; im -= p[k][0] * c[n - k][1] + p[k][1] * c[n - k][0]; }
    c.push([re * inv0[0] - im * inv0[1], re * inv0[1] + im * inv0[0]]);
  }
  return c;
}
const LOG_TICKS = (lo, hi, step = 2) => {
  const sup = (k) => String(k).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const out = [];
  for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % step === 0) out.push([k, k === 0 ? '1' : `10${sup(k)}`]);
  return out;
};

export default {
  collection: 'fa',
  chapter: 10,
  title: 'Banach Algebras',
  summary: String.raw`A Banach algebra is a Banach space with an associative multiplication satisfying $\norm{xy}\le\norm x\norm y$ and a unit of norm $1$. Neumann series make the invertible group $G(A)$ open and inversion continuous; Liouville's theorem, applied to the resolvent $\lambda\mapsto(\lambda e-x)^{-1}$, makes every spectrum a nonempty compact set of radius $\lim\norm{x^n}^{1/n}$, and Gelfand–Mazur follows. The Gleason–Kahane–Żelazko theorem characterises complex homomorphisms by their kernels, Cauchy integrals around the spectrum give a holomorphic functional calculus with the spectral mapping theorem $\sigma(f(x))=f(\sigma(x))$, exponentials generate the identity component of $G(A)$, and the chapter ends with Lomonosov's invariant subspace theorem for operators commuting with a compact operator.`,
  items: [
    // ------------------------------------------------------------------ introduction
    {
      num: '10.1',
      kind: 'Definition',
      name: 'Banach algebra',
      statement: String.raw`A **complex algebra** is a complex vector space $A$ with a multiplication $(x,y)\mapsto xy$ that is associative, distributes over addition on both sides, and satisfies $\alpha(xy)=(\alpha x)y=x(\alpha y)$ for scalars $\alpha$. A **Banach algebra** is a complex algebra that is also a Banach space, whose norm is submultiplicative,
$$\norm{xy}\le\norm x\,\norm y\qquad(x,y\in A),$$
and which has a unit $e$ ($ex=xe=x$ for all $x$) with $\norm e=1$. It is **commutative** if $xy=yx$ for all $x,y$.`,
      idea: String.raw`Submultiplicativity makes multiplication jointly continuous: $\norm{xy-x_0y_0}\le\norm{x-x_0}\norm y+\norm{x_0}\norm{y-y_0}$. It is also what makes power series in $x$ converge whenever their scalar versions do, which drives everything in the chapter. The model examples are $C(K)$ with the sup norm, the operator algebra $\mathscr B(X)$, and convolution algebras such as $\ell^1(\Z)$.`,
      caption: String.raw`The convolution algebra $\ell^1(\Z)$, whose unit is $e=\delta_0$. Drag the bar tops of $x$ (blue) and $y$ (orange); the right panel is the product $x*y$. With the $\ell^1$ norm, $\norm{x*y}_1\le\norm x_1\norm y_1$ always holds. Switch to $\ell^2$ or $\ell^\infty$ and press *flat*: the convolution of two flat sequences piles up and the inequality fails, so these norms do not make $\ell^1(\Z)$ a Banach algebra.`,
      deps: ['fa-1.2'],
      see: ['rca-18.1'],
      tags: ['Banach algebras', 'definitions'],
      viz(v) {
        const M = v.M;
        const pS = v.select('norm', [{ value: 1, label: '$\\ell^1$' }, { value: 2, label: '$\\ell^2$' }, { value: Infinity, label: '$\\ell^\\infty$' }], 1);
        const L = v.stage({ x: [-0.6, 4.6], y: [-1.35, 1.75], height: 300, xticks: [0, 1, 2, 3, 4], title: '$x$ and $y$, supported on $\\{0,\\dots,4\\}$ (drag the bar tops)' });
        const R = v.stage({ x: [-0.6, 8.6], y: [-2, 3], height: 300, xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8], title: 'the product $(x*y)_n=\\sum_k x_k\\,y_{n-k}$' });
        const off = 0.17, snap = (y) => M.clamp(Math.round(y * 20) / 20, -1.25, 1.65);
        const X0 = [0.9, 0.55, -0.35, 0.25, 0], Y0 = [0.6, -0.45, 0.8, 0, 0.3];
        const hx = X0.map((a, k) => L.handle(k - off, a, { color: 'blue', r: 5.5, constrain: (x, y) => [k - off, snap(y)] }));
        const hy = Y0.map((a, k) => L.handle(k + off, a, { color: 'orange', r: 5.5, constrain: (x, y) => [k + off, snap(y)] }));
        v.button('flat: $x=y=(1,1,1,1,1)$', () => { hx.forEach((h) => { h.y = 1; }); hy.forEach((h) => { h.y = 1; }); });
        v.button('$y=e=\\delta_0$', () => { hy.forEach((h, k) => { h.y = k === 0 ? 1 : 0; }); });
        v.button('reset', () => { hx.forEach((h, k) => { h.y = X0[k]; }); hy.forEach((h, k) => { h.y = Y0[k]; }); });
        v.legend([['blue', '$x$', { area: true }], ['orange', '$y$', { area: true }], ['green', '$x*y$', { area: true }]]);
        let st = {};
        v.render(() => {
          const p = pS.value, x = hx.map((h) => h.y), y = hy.map((h) => h.y), c = conv(x, y);
          L.bars(x, { x0: -off, dx: 1, color: 'blue', barWidth: 0.3 });
          L.bars(y, { x0: off, dx: 1, color: 'orange', barWidth: 0.3 });
          const lo = Math.min(0, ...c), hi = Math.max(0.6, ...c), pad = 0.14 * (hi - lo) + 0.15;
          R.setView(null, [lo - pad, hi + pad * 1.4]);
          R.bars(c, { x0: 0, dx: 1, color: 'green', barWidth: 0.55 });
          const nx = pnorm(x, p), ny = pnorm(y, p), nc = pnorm(c, p), ok = nc <= nx * ny * (1 + 1e-12) + 1e-12;
          const q = nx * ny > 1e-12 ? nc / (nx * ny) : NaN;
          R.corner(isFinite(q) ? `‖x*y‖ / (‖x‖ ‖y‖) = ${v.fmt(q, 3)}` : 'x or y is 0', 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          st = { p, nx, ny, nc, ok };
        });
        v.readout(() => {
          const s = st, P = s.p === Infinity ? '\\infty' : s.p;
          const rel = s.ok ? '\\le' : '>';
          return `In $\\ell^{${P}}$: $\\;\\|x\\|=${v.fix(s.nx, 3)}$, $\\|y\\|=${v.fix(s.ny, 3)}$, $\\;\\|x*y\\| = ${v.fix(s.nc, 3)} ${rel} \\|x\\|\\,\\|y\\| = ${v.fix(s.nx * s.ny, 3)}$` +
            (s.p === 1 ? ' — submultiplicative, as it must be: $\\sum_n|\\sum_k x_ky_{n-k}|\\le\\sum_k|x_k|\\sum_m|y_m|$.' : s.ok ? ' — holds for this pair, but not for every pair (try *flat*).' : ' — **fails**: this norm is not submultiplicative.');
        });
      },
    },
    {
      num: '10.2',
      kind: 'Theorem',
      name: 'Separately continuous multiplication can be renormed',
      statement: String.raw`Let $A$ be a Banach space that is also a complex algebra with a unit $e\ne0$, and suppose multiplication is separately continuous: for each fixed $x$, the maps $y\mapsto xy$ and $y\mapsto yx$ are continuous. Then $A$ carries a norm that induces the same topology as the given one and makes $A$ a Banach algebra, i.e. $\norm{xy}'\le\norm x'\norm y'$ and $\norm e'=1$.`,
      idea: String.raw`Let $M_x\in\mathscr B(A)$ be left multiplication, $M_x y=xy$, and put $\norm x'=\norm{M_x}$. Since $M_{xy}=M_xM_y$ and $M_e=I$, this norm is submultiplicative with $\norm e'=1$, and $\norm x=\norm{M_xe}\le\norm x'\norm e$. Continuity of right multiplication shows that $\{M_x\}$ is closed in $\mathscr B(A)$ (an operator commuting with all right multiplications is $M_{T e}$), so $(A,\norm\cdot')$ is complete, and the open mapping theorem makes the two complete norms equivalent.`,
      caption: String.raw`A two-dimensional real slice: $A=\R^2$ with one of three multiplications. The old norm has the orange ellipse (spanned by $u,w$ — drag them) as unit ball; it is usually not submultiplicative and $\norm e\ne1$. The blue curve is the unit sphere of $\norm x'=\norm{M_x}$: it passes through $e$, and it is squeezed between two dashed copies of the old ball, so the norms are equivalent. Right: the quotient $\norm{xy}/(\norm x\norm y)$ for 400 random pairs — red dots exceed $1$ in the old norm, never in the new one.`,
      deps: ['fa-10.1', 'fa-4.1', 'fa-2.12'],
      tags: ['Banach algebras', 'equivalent norms', 'open mapping'],
      viz(v) {
        const M = v.M;
        const ALG = {
          pw: { label: '$\\R^2$ pointwise', e: [1, 1], L: (a, b) => [[a, 0], [0, b]] },
          dual: { label: 'dual numbers $a+b\\varepsilon$', e: [1, 0], L: (a, b) => [[a, 0], [b, a]] },
          cx: { label: '$\\C=\\{a+bi\\}$', e: [1, 0], L: (a, b) => [[a, -b], [b, a]] },
        };
        const alg = v.select('multiplication', Object.entries(ALG).map(([value, o]) => ({ value, label: o.label })), 'dual');
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.95, 1.95], equal: true, height: 350, ticks: false, title: 'unit balls of $\\|\\cdot\\|$ (old) and $\\|x\\|^\\prime=\\|M_x\\|$ (new)' });
        const R = v.stage({ x: [0, 2.6], y: [-0.55, 1.55], height: 350, axes: 'box', yticks: [[0, 'new'], [1, 'old']], title: '$\\|xy\\|/(\\|x\\|\\,\\|y\\|)$ for random pairs' });
        const u = L.handle(1.25, 0.2, { color: 'orange', label: 'u' });
        const w = L.handle(-0.45, 0.8, { color: 'orange', label: 'w' });
        const rnd = v.rng(7);
        const pairs = M.range(400).map(() => [rnd.uniform(0, M.TAU), rnd.uniform(0, M.TAU), rnd.uniform(-0.32, 0.32)]);
        let st = {};
        v.legend([['orange', 'old unit ball', { area: true }], ['blue', 'new unit ball $\\{\\|M_x\\|\\le1\\}$', { area: true }], ['orange', 'old ball scaled by $1/c$ and $1/C$', { dash: true }]]);
        v.render(() => {
          const A = ALG[alg.value];
          const B = [[u.x, w.x], [u.y, w.y]], det = M.det(B);
          if (Math.abs(det) < 0.04) { L.corner('u and w are (nearly) parallel — not a norm', 'tl', { color: 'red', weight: 600 }); st = { bad: true }; return; }
          const Bi = M.inverse(B);
          const oldN = (z) => Math.hypot(Bi[0][0] * z[0] + Bi[0][1] * z[1], Bi[1][0] * z[0] + Bi[1][1] * z[1]);
          const newN = (z) => M.svd2(M.matMul(Bi, M.matMul(A.L(z[0], z[1]), B)))[0];
          const mul = (x, y) => M.matVec(A.L(x[0], x[1]), y);
          // new unit sphere, radially
          const ring = [], qs = [];
          for (let i = 0; i < 360; i++) { const t = M.TAU * i / 360, d = [Math.cos(t), Math.sin(t)], nn = newN(d); ring.push([d[0] / nn, d[1] / nn]); qs.push(nn / oldN(d)); }
          const c = Math.min(...qs), C = Math.max(...qs);
          const oldBall = (s) => M.range(181).map((i) => { const t = M.TAU * i / 180; return [s * (u.x * Math.cos(t) + w.x * Math.sin(t)), s * (u.y * Math.cos(t) + w.y * Math.sin(t))]; });
          L.poly(oldBall(1), { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 2 });
          L.path(oldBall(1 / c), { color: 'orange', width: 1.3, dash: [5, 4] });
          L.path(oldBall(1 / C), { color: 'orange', width: 1.3, dash: [5, 4] });
          L.poly(ring, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 2.4 });
          L.line(0, 0, u.x, u.y, { color: 'orange', width: 1.2, alpha: 0.7 });
          L.line(0, 0, w.x, w.y, { color: 'orange', width: 1.2, alpha: 0.7 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          L.dot(A.e[0], A.e[1], { color: 'ink', r: 5, label: 'e', labelPos: 'se' });
          // submultiplicativity test
          let mo = 0, mn = 0; const redO = [], okO = [], ptsN = [];
          for (const [a, b, j] of pairs) {
            const x = [Math.cos(a), Math.sin(a)], y = [Math.cos(b), Math.sin(b)], xy = mul(x, y);
            const qo = oldN(xy) / (oldN(x) * oldN(y)), qn = newN(xy) / (newN(x) * newN(y));
            mo = Math.max(mo, qo); mn = Math.max(mn, qn);
            (qo > 1 + 1e-9 ? redO : okO).push([qo, 1 + j]); ptsN.push([qn, j]);
          }
          R.setView([0, Math.max(1.5, mo * 1.08)], null);
          R.vline(1, { color: 'ink', width: 1.4, dash: [5, 4] });
          R.dots(okO, { color: 'orange', r: 2.6, alpha: 0.8 });
          R.dots(redO, { color: 'red', r: 2.8 });
          R.dots(ptsN, { color: 'blue', r: 2.6, alpha: 0.8 });
          R.corner(`old max ${v.fmt(mo, 3)}   ·   new max ${v.fmt(mn, 3)}`, 'tr', { color: mn <= 1 + 1e-9 ? 'green' : 'red', weight: 600 });
          st = { ne: oldN(A.e), nne: newN(A.e), mo, mn, c, C };
        });
        v.readout(() => {
          const s = st; if (s.bad) return 'Choose $u,w$ spanning the plane.';
          return `$\\|e\\| = ${v.fix(s.ne, 3)}$ but $\\|e\\|^\\prime = ${v.fix(s.nne, 3)}$. Largest quotient: old $${v.fix(s.mo, 3)}$${s.mo > 1 + 1e-9 ? ' (not submultiplicative)' : ''}, new $${v.fix(s.mn, 3)}\\le1$. Equivalence: $${v.fix(s.c, 3)}\\,\\|x\\|\\le\\|x\\|^\\prime\\le${v.fix(s.C, 3)}\\,\\|x\\|$, and indeed $c\\ge1/\\|e\\| = ${v.fix(1 / s.ne, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ complex homomorphisms
    {
      num: '10.4',
      kind: 'Definition',
      name: 'Invertible elements, G(A), complex homomorphisms',
      statement: String.raw`Let $A$ be a complex algebra with unit $e$. An element $x\in A$ is **invertible** if there is $x^{-1}\in A$ with $x^{-1}x=xx^{-1}=e$; the invertible elements form a group $G=G(A)$ under multiplication. A **complex homomorphism** of $A$ is a linear functional $\varphi:A\to\C$, not identically zero, with $\varphi(xy)=\varphi(x)\varphi(y)$ for all $x,y\in A$.`,
      idea: String.raw`An inverse, when it exists, is unique: if $yx=e=xz$ then $y=y(xz)=(yx)z=z$. Complex homomorphisms are the "points" of an algebra: on $C(K)$ they are the evaluations $f\mapsto f(p)$, on $\ell^1(\Z)$ the maps $x\mapsto\sum_n x_ne^{in\theta}$; on a noncommutative algebra such as $M_n(\C)$, $n\ge2$, there are none.`,
      deps: ['fa-10.1'],
      see: ['rca-18.2'],
      tags: ['Banach algebras', 'homomorphisms', 'definitions'],
      verify: true,
    },
    {
      num: '10.5',
      kind: 'Proposition',
      name: 'Homomorphisms send e to 1 and never kill invertibles',
      statement: String.raw`If $\varphi$ is a complex homomorphism of a complex algebra $A$ with unit $e$, then $\varphi(e)=1$, and $\varphi(x)\ne0$ for every $x\in G(A)$.`,
      idea: String.raw`Pick $y$ with $\varphi(y)\ne0$; then $\varphi(y)=\varphi(ye)=\varphi(y)\varphi(e)$, so $\varphi(e)=1$. If $x$ is invertible, $\varphi(x)\varphi(x^{-1})=\varphi(e)=1$. Hence $\varphi(x)\in\sigma(x)$ for every $x$, since $\varphi(\varphi(x)e-x)=0$.`,
      caption: String.raw`$A=\ell^1(\Z_+)$ under convolution: $x=(x_n)$ is the power series $p(z)=\sum x_nz^n$, here the cubic $p(z)=\prod_k(1-z/r_k)$, and every $z$ in the closed unit disc gives a complex homomorphism $\varphi_z(x)=p(z)$ with $\varphi_z(e)=1$. Drag the roots $r_k$ and the point $z$. Right: the coefficients of the formal inverse $1/p$. They decay geometrically (so $x^{-1}\in\ell^1$) exactly while all roots stay outside the disc; pull a root inside and $\varphi_{r_k}(x)=0$ forbids an inverse — the coefficients blow up.`,
      deps: ['fa-10.4'],
      tags: ['homomorphisms', 'invertibility'],
      verify: true,
      viz(v) {
        const M = v.M;
        const P = v.stage({ x: [-2.3, 2.3], y: [-1.9, 1.9], equal: true, height: 340, ticks: false, title: 'phase of $p$; inside the disc, $\\varphi_z(x)=p(z)$' });
        const R = v.stage({ x: [-1.5, 41], y: [-6, 6], height: 340, axes: 'box', xlabel: 'n', title: '$|c_n|$ for $1/p(z)=\\sum c_nz^n$ (log scale)' });
        const lab = ['r₁', 'r₂', 'r₃'];
        const roots = [[1.45, 0.55], [-0.55, -1.4], [-1.3, 0.85]].map(([a, b], k) => P.handle(a, b, { color: 'red', r: 6, label: lab[k], constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.25 ? [0.25 * x / (r || 1), 0.25 * y / (r || 1)] : [x, y]; } }));
        const z = P.handle(0.35, 0.3, { color: 'accent', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 1 ? [x / r, y / r] : [x, y]; } });
        let st = {};
        v.legend([['red', 'roots $r_k$ of $p$'], ['ink', 'unit circle: the homomorphisms $\\varphi_z$, $|z|\\le1$'], ['green', '$|c_n|$ when $x\\in G(A)$', { dot: true }], ['red', '$|c_n|$ when $x\\notin G(A)$', { dot: true }]]);
        v.render(() => {
          let p = [[1, 0]];
          for (const h of roots) { const d = h.x * h.x + h.y * h.y; p = cpolyMul(p, [[1, 0], [-h.x / d, h.y / d]]); }
          const key = roots.map((h) => `${h.x.toFixed(3)},${h.y.toFixed(3)}`).join('|');
          P.raster((x, y) => { const [re, im] = cpolyEval(p, x, y); return phaseRGB(M, re, im, x * x + y * y <= 1 ? 255 : 80); }, { key, res: 2 });
          P.circle(0, 0, 1, { color: 'ink', width: 2.2 });
          const rmin = Math.min(...roots.map((h) => Math.hypot(h.x, h.y)));
          const inv = rmin > 1 + 1e-3;
          const c = cpolyRecip(p, 400), lc = c.slice(0, 41).map(([a, b]) => Math.log10(Math.hypot(a, b) + 1e-300));
          const lo = Math.max(-16, Math.min(-1, ...lc) - 0.6), hi = Math.min(30, Math.max(1, ...lc) + 0.8);
          R.setView(null, [lo, hi]);
          R.setTicks(null, LOG_TICKS(lo, hi, hi - lo > 14 ? 4 : 2));
          R.hline(0, { color: 'faint', width: 1 });
          R.line(0, lc[0], 40, lc[0] - 40 * Math.log10(rmin), { color: inv ? 'green' : 'red', width: 1.3, dash: [5, 4] });
          R.dots(lc.map((l, n) => [n, l]), { color: inv ? 'green' : 'red', r: 3.2 });
          R.corner(inv ? 'decays like (1/min|r_k|)ⁿ: x⁻¹ ∈ ℓ¹' : 'no decay: x is not invertible', 'tr', { color: inv ? 'green' : 'red', weight: 600 });
          // value of the homomorphism at z, and min |p| over the disc
          const [pr, pi] = cpolyEval(p, z.x, z.y);
          let mn = Infinity;
          for (let i = 0; i <= 30; i++) for (let j = 0; j < 72; j++) { const r = i / 30, t = M.TAU * j / 72; mn = Math.min(mn, Math.hypot(...cpolyEval(p, r * Math.cos(t), r * Math.sin(t)))); }
          let ir = 0, ii = 0;
          if (inv) { const zz = cpolyEval(c, z.x, z.y); ir = zz[0]; ii = zz[1]; }
          const bad = roots.filter((h) => Math.hypot(h.x, h.y) <= 1 + 1e-3);
          for (const h of bad) P.circle(h.x, h.y, 0.13, { color: 'red', width: 2 });
          st = { pr, pi, mn, inv, ir, ii, l1: inv ? c.reduce((s, [a, b]) => s + Math.hypot(a, b), 0) : Infinity, bad: bad.length };
        });
        v.readout(() => {
          const s = st, pz = new v.Cx(s.pr, s.pi);
          const head = `$\\varphi_z(e)=1$, $\\;\\varphi_z(x)=p(z)=${pz.toString(3).replace('i', '\\,i')}$, $\\;\\min_{|z|\\le1}|p(z)| = ${v.fix(s.mn, 3)}$. `;
          if (s.inv) { const prod = pz.mul(new v.Cx(s.ir, s.ii)); return head + `$x$ is invertible, $\\|x^{-1}\\|_1=${v.fix(s.l1, 3)}$, and $\\varphi_z(x)\\,\\varphi_z(x^{-1}) = ${prod.toString(4).replace('i', '\\,i')}$.`; }
          return head + `${s.bad} root(s) in the closed disc: there $\\varphi_{r_k}(x)=0$, so by the proposition $x\\notin G(A)$.`;
        });
      },
    },
    {
      num: '10.7',
      kind: 'Theorem',
      name: 'Neumann series: the ball of radius 1 about e is invertible',
      statement: String.raw`Let $A$ be a Banach algebra and $x\in A$ with $\norm x<1$. Then
(a) $e-x$ is invertible, with $(e-x)^{-1}=\sum_{n=0}^\infty x^n$;
(b) $\norm{(e-x)^{-1}-e-x}\le\dfrac{\norm x^2}{1-\norm x}$;
(c) $|\varphi(x)|<1$ for every complex homomorphism $\varphi$ of $A$.`,
      idea: String.raw`Since $\norm{x^n}\le\norm x^n$, the partial sums $s_N=e+x+\dots+x^N$ form a Cauchy sequence, and $(e-x)s_N=s_N(e-x)=e-x^{N+1}\to e$; the limit is the inverse, and the tail from $n=2$ on is bounded by a geometric series, which is (b). For (c), if $|\varphi(x)|\ge1$, put $\lambda=\varphi(x)$: then $\norm{x/\lambda}<1$, so $e-x/\lambda$ is invertible by (a), yet $\varphi(e-x/\lambda)=0$, contradicting 10.5.`,
      caption: String.raw`$A=C(\T)$ with the sup norm and $x(e^{it})=c+a\,e^{it}+b\,e^{2it}$; drag $c$ and set $a,b$. Left: the curve $x(\T)$ — each of its points is a value $\varphi(x)$ of a point evaluation, so (c) says it stays in the open unit disc. Middle: the partial sums $s_N(\T)$ (gold) closing in on $(e-x)^{-1}(\T)$ (green). Bottom: the sup-norm error against the geometric bound $\norm x^{N+1}/(1-\norm x)$. Push $\norm x$ past $1$: the series diverges, although $e-x$ stays invertible as long as $x(\T)$ avoids $1$.`,
      deps: ['fa-10.1', 'fa-10.5'],
      see: ['rca-18.3', 'pma-3.26', 'pma-9.8'],
      tags: ['Neumann series', 'invertibility'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const aS = v.slider('$a$', 0, 1, 0.42, { step: 0.01 });
        const bS = v.slider('$b$', -0.6, 0.6, 0.18, { step: 0.01 });
        const NS = v.slider('$N$', 0, 30, 5, { int: true });
        const L = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, height: 300, ticks: false, title: 'the values $x(\\T)$ and the disc $|\\lambda|\\le\\|x\\|$' });
        const W = v.stage({ x: [-1, 3], y: [-1.5, 1.5], equal: true, height: 300, ticks: false, title: 'partial sums $s_N(\\T)$ and $(e-x)^{-1}(\\T)$' });
        const E = v.stage({ x: [-0.8, 40.8], y: [-12, 1], height: 170, full: true, axes: 'box', xlabel: 'N', title: '$\\|s_N-(e-x)^{-1}\\|_\\infty$ (log scale)' });
        const c = L.handle(0.18, 0.12, { color: 'accent', label: 'c' });
        const T = 320, ts = M.range(T + 1).map((i) => M.TAU * i / T);
        let st = {};
        v.legend([['blue', '$x(\\T)$'], ['gold', 'partial sums $s_N=\\sum_{n\\le N}x^n$'], ['green', '$(e-x)^{-1}=1/(1-x)$'], ['green', 'bound $\\|x\\|^{N+1}/(1-\\|x\\|)$', { dash: true }]]);
        v.render(() => {
          const a = aS.value, b = bS.value, N = NS.value;
          const xs = ts.map((t) => new Cx(c.x + a * Math.cos(t) + b * Math.cos(2 * t), c.y + a * Math.sin(t) + b * Math.sin(2 * t)));
          const nx = Math.max(...xs.map((z) => z.abs()));
          const one = new Cx(1, 0), dist1 = Math.min(...xs.map((z) => one.sub(z).abs()));
          const invOK = dist1 > 1e-3, conv = nx < 1;
          const tgt = invOK ? xs.map((z) => one.div(one.sub(z))) : null;
          // left panel
          L.circle(0, 0, 1, { color: 'ink', width: 1.4, dash: [5, 4] });
          L.circle(0, 0, nx, { color: conv ? 'blue' : 'red', width: 1.2, fill: conv ? 'blue' : 'red', fillAlpha: 0.08 });
          L.path(xs.map((z) => [z.re, z.im]), { color: 'blue', width: 2.4 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          L.dot(1, 0, { color: 'gold', r: 5, label: '1', labelPos: 'ne' });
          const im = M.argmax(xs, (z) => z.abs());
          L.line(0, 0, xs[im].re, xs[im].im, { color: conv ? 'blue' : 'red', width: 1.2, dash: [3, 3] });
          L.tex('\\|x\\|', xs[im].re / 2, xs[im].im / 2, { color: conv ? 'blue' : 'red', size: 14, dy: -10 });
          // partial sums
          const sums = []; let pow = xs.map(() => new Cx(1, 0)), acc = xs.map(() => new Cx(0, 0));
          const errs = [];
          for (let n = 0; n <= 40; n++) {
            acc = acc.map((s, i) => s.add(pow[i]));
            if (n <= N) sums.push(acc.slice());
            if (tgt) errs.push(Math.max(...acc.map((s, i) => s.sub(tgt[i]).abs())));
            pow = pow.map((p, i) => p.mul(xs[i]));
          }
          let bx = [Infinity, -Infinity], by = [Infinity, -Infinity];
          for (const z of (tgt || sums[sums.length - 1])) { bx = [Math.min(bx[0], z.re), Math.max(bx[1], z.re)]; by = [Math.min(by[0], z.im), Math.max(by[1], z.im)]; }
          const cxm = (bx[0] + bx[1]) / 2, cym = (by[0] + by[1]) / 2, span = Math.min(40, Math.max(1.2, bx[1] - bx[0], by[1] - by[0]) * 0.62 + 0.3);
          W.setView([cxm - span, cxm + span], [cym - span, cym + span]);
          sums.forEach((S, k) => { const last = k === sums.length - 1; W.path(S.map((z) => [z.re, z.im]), { color: 'gold', width: last ? 2.4 : 1, alpha: last ? 1 : 0.25 + 0.5 * k / Math.max(1, sums.length) }); });
          if (tgt) W.path(tgt.map((z) => [z.re, z.im]), { color: 'green', width: 2.2, dash: conv ? false : [6, 4] });
          W.dot(1, 0, { color: 'ink', r: 2.5 });
          W.corner(`s_${N}`, 'tl', { color: 'gold', weight: 600 });
          // errors
          const lerr = errs.map((e) => Math.log10(Math.max(e, 1e-16)));
          E.setView(null, [-16, Math.max(1.5, Math.min(8, Math.max(...lerr.filter(isFinite)) + 0.5))]);
          E.setTicks(null, LOG_TICKS(-16, 8, 4));
          if (conv) E.path(M.range(41).map((n) => [n, Math.log10(Math.pow(nx, n + 1) / (1 - nx))]), { color: 'green', width: 1.6, dash: [6, 4] });
          E.dots(lerr.map((l, n) => [n, l]), { color: 'gold', r: 3 });
          if (lerr.length) E.dot(N, lerr[N], { color: 'gold', r: 5.5 });
          if (!tgt) E.corner('1 ∈ x(T): e − x is not invertible', 'tr', { color: 'red', weight: 600 });
          const tail = tgt ? Math.max(...tgt.map((z, i) => z.sub(one).sub(xs[i]).abs())) : NaN;
          st = { nx, dist1, conv, tail, invOK };
        });
        v.readout(() => {
          const s = st;
          if (s.conv) return `$\\|x\\| = \\max_t|\\varphi_t(x)| = ${v.fix(s.nx, 3)} < 1$. (b): $\\|(e-x)^{-1}-e-x\\| = ${v.fix(s.tail, 4)} \\le \\|x\\|^2/(1-\\|x\\|) = ${v.fix(s.nx * s.nx / (1 - s.nx), 4)}$.`;
          return `$\\|x\\| = ${v.fix(s.nx, 3)}\\ge1$: the theorem no longer applies and $\\sum x^n$ diverges where $|x(t)|>1$. ` + (s.invOK ? `Still, $\\operatorname{dist}(1,x(\\T)) = ${v.fix(s.dist1, 3)}>0$, so $e-x$ is invertible (dashed green): $\\|x\\|<1$ is sufficient, not necessary.` : 'Now $1\\in x(\\T)$ and $e-x$ has no inverse.');
        });
      },
    },
    {
      num: '10.8',
      kind: 'Lemma',
      name: 'Zero-free entire functions of order one with f(0)=1, f′(0)=0',
      statement: String.raw`Let $f$ be an entire function with $f(0)=1$, $f'(0)=0$, and
$$0<|f(\lambda)|\le e^{|\lambda|}\qquad(\lambda\in\C).$$
Then $f(\lambda)=1$ for every $\lambda\in\C$.`,
      idea: String.raw`Because $f$ has no zeros, $f=e^g$ with $g$ entire, $g(0)=g'(0)=0$, and the growth bound says only $\Re g(\lambda)\le|\lambda|$ — a one-sided bound. On the disc $|\lambda|\le r$ the function $g/(2r-g)$ is bounded by $1$ and vanishes to second order at $0$, so a Schwarz-lemma argument gives $|g(\lambda)|\le C|\lambda|^2/r$ for $|\lambda|\le r/2$. Letting $r\to\infty$ forces $g\equiv0$.`,
      caption: String.raw`Test the hypotheses on two families. Left: drag the parameters. Middle: phase portrait of $f$; red tint marks where $|f(\lambda)|>e^{|\lambda|}$, red dots are zeros. Right: $\max_{|\lambda|=r}\log|f(\lambda)|$ against the allowed growth $r$. For $f=e^{a\lambda+c\lambda^2}$ any $c\neq0$ eventually breaks the bound, while $c=0$, $|a|\le1$ obeys it but has $f'(0)=a$. For $f=\cos(b\lambda)$, $|b|\le1$, the growth is fine and $f'(0)=0$, but $f$ has zeros. Only $f\equiv1$ survives all three.`,
      deps: ['rca-10.23', 'rca-12.2', 'rca-13.11'],
      tags: ['entire functions', 'growth'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const fam = v.select('family', [{ value: 'exp', label: '$f=e^{a\\lambda+c\\lambda^2}$' }, { value: 'cos', label: '$f=\\cos(b\\lambda)$' }], 'exp');
        const Pm = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 300, minWidth: 190, weight: 0.65, ticks: false, title: 'parameters' });
        const D = v.stage({ x: [-6, 6], y: [-4.6, 4.6], equal: true, height: 300, weight: 1.25, ticks: false, title: 'phase of $f$ on $\\C$' });
        const G = v.stage({ x: [0, 8], y: [-2, 9], height: 300, axes: 'box', xlabel: 'r', title: '$\\max_{|\\lambda|=r}\\log|f|$ vs. $r$' });
        const snap0 = (x, y) => (Math.hypot(x, y) < 0.07 ? [0, 0] : [x, y]);
        const ha = Pm.handle(0.55, 0.3, { color: 'accent', label: 'a', constrain: snap0 });
        const hc = Pm.handle(0.12, -0.06, { color: 'purple', label: 'c', constrain: snap0 });
        let st = {};
        v.render(() => {
          const isCos = fam.value === 'cos';
          hc.visible = !isCos; ha.label = isCos ? 'b' : 'a';
          const a = new Cx(ha.x, ha.y), c = new Cx(hc.x, hc.y);
          const logf = isCos ? (z) => Math.log(z.mul(a).cos().abs()) : (z) => a.mul(z).add(c.mul(z.mul(z))).re;
          const f = isCos ? (z) => z.mul(a).cos() : (z) => a.mul(z).add(c.mul(z.mul(z))).exp();
          Pm.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [4, 4] });
          Pm.text(isCos ? '|b| = 1' : '|a| = 1', 0.72, 0.86, { color: 'muted', size: 11 });
          Pm.dot(0, 0, { color: 'ink', r: 2.5 });
          const key = `${fam.value}|${ha.x.toFixed(3)},${ha.y.toFixed(3)},${hc.x.toFixed(3)},${hc.y.toFixed(3)}`;
          D.domain(f, { key, res: 2 });
          D.raster((x, y) => (logf(new Cx(x, y)) > Math.hypot(x, y) + 1e-9 ? [215, 30, 40, 120] : null), { key, id: 'viol', res: 2 });
          D.circle(0, 0, 0.12, { color: 'panel', width: 3 });
          const zeros = [];
          if (isCos && a.abs() > 1e-6) for (let k = -12; k <= 11; k++) { const zz = new Cx(Math.PI / 2 + k * Math.PI, 0).div(a); if (Math.abs(zz.re) < 6.2 && Math.abs(zz.im) < 4.8) zeros.push(zz); }
          for (const zz of zeros) D.dot(zz.re, zz.im, { color: 'red', r: 4.5 });
          // growth profile
          const rs = M.linspace(0, 8, 161), Mr = rs.map((r) => { let m = -Infinity; for (let j = 0; j < 240; j++) { const t = M.TAU * j / 240; m = Math.max(m, logf(new Cx(r * Math.cos(t), r * Math.sin(t)))); } return m; });
          const top = Math.min(30, Math.max(9, ...Mr.filter(isFinite)));
          G.setView(null, [-1.5, Math.min(top, 14)]);
          let rStar = null;
          for (let i = 0; i < rs.length; i++) if (Mr[i] > rs[i] + 1e-6) { rStar = rs[i]; break; }
          const Mfn = (r) => { const i = Math.min(160, Math.max(0, Math.round(r / 8 * 160))); return Mr[i]; };
          G.between((r) => Math.max(Mfn(r), r), (r) => r, 0, 8, { fill: 'red', fillAlpha: 0.22, n: 160 });
          G.fn((r) => r, { color: 'green', width: 2, dash: [6, 4] });
          G.path(rs.map((r, i) => [r, Mr[i]]), { color: 'blue', width: 2.4 });
          G.tex('r', 7.2, 7.2, { color: 'green', dx: -10, dy: -10 });
          const fp0 = isCos ? 0 : a.abs();
          st = { isCos, a, rStar, nz: zeros.length, fp0, one: isCos ? a.abs() < 1e-9 : a.abs() < 1e-9 && c.abs() < 1e-9 };
        });
        v.legend([['blue', '$\\max_{|\\lambda|=r}\\log|f(\\lambda)|$'], ['green', 'allowed growth $r$', { dash: true }], ['red', 'violations of $|f|\\le e^{|\\lambda|}$ / zeros', { area: true }]]);
        v.readout(() => {
          const s = st;
          if (s.one) return 'All parameters are $0$: $f\\equiv1$, the only function meeting every hypothesis.';
          const g = s.rStar != null ? `growth bound **fails** from $r\\approx${v.fix(s.rStar, 2)}$` : 'growth bound holds on $|\\lambda|\\le8$';
          const d = s.isCos ? '$f\'(0)=0$' : `$|f'(0)|=|a|=${v.fix(s.fp0, 3)}$${s.fp0 > 1e-9 ? ' $\\ne0$' : ''}`;
          const z = s.isCos ? (s.nz ? `, and $f$ has zeros (${s.nz} in view)` : '') : ', no zeros';
          return `$f(0)=1$; ${d}; ${g}${z}. Some hypothesis fails, consistent with the lemma.`;
        });
      },
    },
    {
      num: '10.9',
      kind: 'Theorem',
      name: 'Gleason–Kahane–Żelazko theorem',
      statement: String.raw`Let $\varphi$ be a linear functional on a Banach algebra $A$ — continuity is not assumed — such that $\varphi(e)=1$ and $\varphi(x)\ne0$ for every $x\in G(A)$. Then
$$\varphi(xy)=\varphi(x)\varphi(y)\qquad(x,y\in A),$$
so $\varphi$ is a complex homomorphism (and in particular continuous, with $\norm\varphi=1$).`,
      idea: String.raw`The kernel $N$ of $\varphi$ contains no invertible element, so the argument of 10.7(c) gives $|\varphi(x)|\le\norm x$: $\varphi$ is continuous. For $x\in N$ with $\norm x=1$, the entire function $f(\lambda)=\varphi(\exp(\lambda x))$ has no zeros (each $\exp(\lambda x)$ is invertible), $f(0)=1$, $f'(0)=\varphi(x)=0$ and $|f(\lambda)|\le e^{|\lambda|}$. Lemma 10.8 gives $f\equiv1$, whose $\lambda^2$ coefficient says $\varphi(x^2)=0$. Thus $\varphi(x^2)=\varphi(x)^2$ for all $x$, and polarization upgrades this to $\varphi(xy)=\varphi(x)\varphi(y)$.`,
      caption: String.raw`$A=\C^3$ with pointwise operations (functions on three points). A linear $\varphi$ with $\varphi(e)=1$ is $\varphi(x)=w_1x_1+w_2x_2+w_3x_3$ with $\sum w_k=1$; drag its weights in the left plane (the vertices are the three point evaluations $\delta_k$). Fix $x\in\ker\varphi$ (here $x_k=s_k-\varphi(s)$ for three cube roots of unity $s_k$). Right: the phase portrait of $f(\lambda)=\varphi(\exp(\lambda x))$. Unless $\varphi$ is a vertex, $f$ has zeros $\lambda_0$ (red), and $u=\exp(\lambda_0x)$ is an invertible element with $\varphi(u)=0$. Slide toward a vertex: the zeros escape to infinity and $f\to1$.`,
      deps: ['fa-10.8', 'fa-10.7', 'fa-10.5'],
      tags: ['homomorphisms', 'entire functions'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const V = [[0, 1.15], [-1.0, -0.58], [1.0, -0.58]];
        const S = [0, 1, 2].map((k) => Cx.polar(1, M.TAU * k / 3 + Math.PI / 2));
        const Wp = v.stage({ x: [-1.65, 1.65], y: [-1.25, 1.6], equal: true, height: 330, minWidth: 230, weight: 0.8, ticks: false, title: 'functionals with $\\varphi(e)=1$ (barycentric weights)' });
        const D = v.stage({ x: [-9, 9], y: [-7, 7], equal: true, height: 330, weight: 1.2, ticks: false, title: 'phase of $f(\\lambda)=\\varphi(\\exp(\\lambda x))$, $x\\in\\ker\\varphi$' });
        const bary = (x, y) => { const T = [[V[0][0] - V[2][0], V[1][0] - V[2][0]], [V[0][1] - V[2][1], V[1][1] - V[2][1]]]; const l = M.solve(T, [x - V[2][0], y - V[2][1]]); return [l[0], l[1], 1 - l[0] - l[1]]; };
        const wH = Wp.handle(0.12, 0.05, { color: 'accent', label: 'φ', constrain: (x, y) => { for (const p of V) if (Math.hypot(x - p[0], y - p[1]) < 0.09) return [p[0], p[1]]; return [x, y]; } });
        let st = {};
        v.legend([['ink', 'point evaluations $\\delta_k$ (the homomorphisms)'], ['red', 'zeros $\\lambda_0$ of $f$: $\\varphi(\\exp(\\lambda_0x))=0$', { dot: true }]]);
        v.render(() => {
          const w = bary(wH.x, wH.y);
          const phiS = S.reduce((acc, s, k) => acc.add(s.scale(w[k])), new Cx(0, 0));
          const xk = S.map((s) => s.sub(phiS));
          const vertex = w.some((t) => Math.abs(t - 1) < 1e-9);
          const f = (z) => { let s = new Cx(0, 0); for (let k = 0; k < 3; k++) if (w[k] !== 0) s = s.add(z.mul(xk[k]).exp().scale(w[k])); return s; };
          const fp = (z) => { let s = new Cx(0, 0); for (let k = 0; k < 3; k++) if (w[k] !== 0) s = s.add(z.mul(xk[k]).exp().mul(xk[k]).scale(w[k])); return s; };
          const scale = (z) => { let s = 0; for (let k = 0; k < 3; k++) s += Math.abs(w[k]) * z.mul(xk[k]).exp().abs(); return s; };
          // weights panel
          Wp.poly(V, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.6 });
          const lab = ['\\delta_1', '\\delta_2', '\\delta_3'], off = [[0, -18], [-14, 14], [14, 14]];
          V.forEach((p, k) => { Wp.dot(p[0], p[1], { color: 'ink', r: 4.5 }); Wp.tex(lab[k], p[0], p[1], { dx: off[k][0], dy: off[k][1] - 4, color: 'ink' }); });
          Wp.corner(`w = (${w.map((t) => v.fmt(t, 2)).join(', ')})`, 'bl', { color: 'accent', weight: 600 });
          // zeros: local minima of |f|/scale on a grid, refined by Newton
          const zeros = [];
          if (!vertex) {
            const nx = 73, ny = 57, g = [];
            for (let j = 0; j < ny; j++) { g.push([]); for (let i = 0; i < nx; i++) { const z = new Cx(-9 + 18 * i / (nx - 1), -7 + 14 * j / (ny - 1)); g[j].push(f(z).abs() / scale(z)); } }
            for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
              const c = g[j][i]; let isMin = c < 0.35;
              for (let dj = -1; dj <= 1 && isMin; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && g[j + dj][i + di] < c) { isMin = false; break; }
              if (!isMin) continue;
              let z = new Cx(-9 + 18 * i / (nx - 1), -7 + 14 * j / (ny - 1));
              for (let it = 0; it < 30; it++) { const d = f(z).div(fp(z)); z = z.sub(d); if (d.abs() < 1e-13) break; }
              if (f(z).abs() < 1e-8 * scale(z) && Math.abs(z.re) < 9.2 && Math.abs(z.im) < 7.2 && !zeros.some((q) => q.sub(z).abs() < 1e-4)) zeros.push(z);
            }
          }
          const key = `${w.map((t) => t.toFixed(4)).join(',')}`;
          D.domain(f, { key, res: 2 });
          for (const z of zeros) D.dot(z.re, z.im, { color: 'red', r: 5 });
          D.dot(0, 0, { color: 'ink', r: 3 });
          if (vertex) D.corner('φ is a point evaluation: f ≡ 1, no zeros', 'tl', { color: 'green', weight: 700 });
          let z0 = null; for (const z of zeros) if (!z0 || z.abs() < z0.abs()) z0 = z;
          if (z0) D.dot(z0.re, z0.im, { color: 'red', r: 7, hollow: true, width: 2.4, label: 'λ₀', labelPos: 'ne' });
          const defect = xk.reduce((acc, s, k) => acc.add(s.mul(s).scale(w[k])), new Cx(0, 0));
          st = { w, vertex, z0, n: zeros.length, defect, fz0: z0 ? f(z0).abs() : 0, umin: z0 ? Math.min(...xk.map((s) => z0.mul(s).exp().abs())) : 0 };
        });
        v.readout(() => {
          const s = st;
          if (s.vertex) return '$\\varphi$ is a vertex $\\delta_k$: it is multiplicative, $\\varphi(x^2)=\\varphi(x)^2=0$, and $f(\\lambda)=e^{\\lambda\\cdot0}\\equiv1$.';
          const base = `$\\varphi(x)=0$ but $\\varphi(x^2) = ${s.defect.toString(3).replace('i', '\\,i')}\\ne0$: not multiplicative. `;
          if (!s.z0) return base + 'No zero in view (move $\\varphi$ away from the vertex).';
          return base + `Zero $\\lambda_0 = ${s.z0.toString(3).replace('i', '\\,i')}$ ($${s.n}$ in view): $u=\\exp(\\lambda_0x)$ has all entries of modulus $\\ge ${v.fix(s.umin, 3)}$, so $u\\in G(A)$, yet $|\\varphi(u)| = ${v.sci(s.fz0, 2)}$ — the hypothesis of the theorem fails.`;
        });
      },
    },
  ],
};
