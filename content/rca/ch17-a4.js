// Rudin, Real and Complex Analysis — Chapter 17 (part 4: the shift operator, conjugate functions)

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];
const rOf = (x) => 1 - Math.pow(10, -x);
const R_TICKS = [[0, '0'], [1, '0.9'], [2, '0.99'], [3, '0.999'], [4, '0.9999']];
function nodes(n = 480, c = 0, pw = 3) {
  const th = [], w = []; const h = 2 / n;
  for (let i = 0; i <= n; i++) {
    const s = -1 + i * h, jac = pw * Math.PI * Math.pow(Math.abs(s), pw - 1); if (!jac) continue;
    th.push(c + Math.PI * Math.sign(s) * Math.pow(Math.abs(s), pw)); w.push((i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * jac * h / 3 / TAU);
  }
  return { th, w };
}
function meanC(g, n = 480, c = 0) { const { th, w } = nodes(n, c); let s = 0; for (let i = 0; i < th.length; i++) s += w[i] * g(th[i]); return s; }
/**
 * Double-exponential (tanh–sinh) quadrature of ∫ over an arc of length ell. The integrand receives the distances
 * (dL, dR) to the two ends of the arc, both computed without cancellation, so log singularities at the ends are harmless.
 */
function deArc(ell, g, h = 0.04, smax = 3.6) {
  let acc = 0; const K = Math.round(smax / h);
  for (let k = -K; k <= K; k++) {
    const s = k * h, u = Math.PI / 2 * Math.sinh(s), e2 = Math.exp(2 * u);
    const w = (Math.PI / 2) * Math.cosh(s) / Math.cosh(u) ** 2;
    const dL = ell / (1 + 1 / e2), dR = ell / (1 + e2);
    if (!(dL > 0 && dR > 0) || !isFinite(w)) continue;
    acc += w * g(dL, dR);
  }
  return acc * h * ell / 2;
}
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const conj = (a) => [a[0], -a[1]];
const bfac = (a, x, y) => cdiv([x - a[0], y - a[1]], [1 - (a[0] * x + a[1] * y), a[1] * x - a[0] * y]);
function hergArc(t1, L, x, y) {
  const a = [Math.cos(t1), Math.sin(t1)], b = [Math.cos(t1 + L), Math.sin(t1 + L)];
  const q = cdiv([b[0] - x, b[1] - y], [a[0] - x, a[1] - y]);
  let arg = Math.atan2(q[1], q[0]); if (arg <= 0) arg += TAU;
  return [arg / Math.PI - L / TAU, -0.5 * Math.log(q[0] * q[0] + q[1] * q[1]) / Math.PI];
}
/** Σ c_n z^n at z = x + iy (coefficients as [re, im] pairs). */
function horner(c, x, y) { let s = [0, 0]; for (let n = c.length - 1; n >= 0; n--) s = [s[0] * x - s[1] * y + c[n][0], s[0] * y + s[1] * x + c[n][1]]; return s; }
function phaseRGB(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
function discPhase(v, S, F, key, res = 2) { S.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = F(x, y); return phaseRGB(v.M, w[0], w[1]); }, { key, res }); }
const onCircle = (x, y) => { const t = Math.atan2(y, x); return [Math.cos(t), Math.sin(t)]; };
const angle = (h) => Math.atan2(h.y, h.x);
const ccw = (a, b) => { let L = b - a; while (L <= 0) L += TAU; while (L > TAU) L -= TAU; return L; };

export default {
  collection: 'rca',
  chapter: 17,
  items: [
    // ------------------------------------------------------------------ the shift operator
    {
      num: '17.20',
      kind: 'Definition',
      name: 'The shift operator and invariant subspaces',
      verify: true,
      statement: String.raw`Regard $H^2$ as the closed subspace of $L^2(\T)$ consisting of the functions whose Fourier coefficients vanish for all negative indices (17.12). The **shift operator** $S$ is multiplication by $e^{i\theta}$:
$$(Sf)(e^{i\theta})=e^{i\theta}f(e^{i\theta}).$$
On $L^2(\T)$ it is unitary; it maps $H^2$ isometrically onto the proper subspace $zH^2=\{f\in H^2:f(0)=0\}$, and in terms of Taylor coefficients $S(a_0,a_1,a_2,\dots)=(0,a_0,a_1,\dots)$. A closed subspace $M$ of $H^2$ (or of $L^2(\T)$) is **$S$-invariant** if $S(M)\subset M$.`,
      idea: String.raw`Under the Parseval isometry $H^2\cong\ell^2(\{0,1,2,\dots\})$ (4.26), $S$ is the unilateral right shift: an isometry that is not onto, whose adjoint $S^*(a_0,a_1,\dots)=(a_1,a_2,\dots)$ is the backward shift, $S^*f=(f-f(0))/z$. On all of $L^2(\T)$, i.e. on two-sided sequences, the same multiplication is the unitary bilateral shift. The obvious invariant subspaces are $z^kH^2$ — functions vanishing to order $k$ at $0$ — and more generally $\varphi H^2$ for an inner function $\varphi$; Beurling's theorem (17.21) says there are no others.`,
      caption: String.raw`Apply $S^k$ or its adjoint $(S^*)^k$ to $f(z)=\frac{0.9+z}{1-0.7e^{0.9i}z}$. The phase portraits show $f$ and the result: $S^kf=z^kf$ acquires a zero of order $k$ at the origin, so it lies in the invariant subspace $z^kH^2$; $(S^*)^kf$ simply forgets the first $k$ Taylor coefficients. The bars are the Taylor coefficients $|a_n|$ before (outline) and after (filled): the norm is preserved by $S^k$ but not by $(S^*)^k$.`,
      deps: ['rca-17.12', 'rca-4.26'],
      see: ['fa-4.10'],
      tags: ['shift operator', 'Hilbert space'],
      viz(v) {
        const op = v.select('operator', [{ value: 'S', label: '$S^k$ (shift)' }, { value: 'B', label: '$(S^*)^k$ (backward shift)' }], 'S');
        const kS = v.slider('$k$', 0, 6, 2, { int: true });
        const NC = 80, w = [0.7 * Math.cos(0.9), 0.7 * Math.sin(0.9)];
        // a_0 = 0.9, a_n = 0.9 w^n + w^{n−1} (n ≥ 1)
        const A = []; let wn1 = [1, 0];
        for (let n = 0; n < NC; n++) { if (n === 0) A.push([0.9, 0]); else { const wn = cmul(wn1, w); A.push([0.9 * wn[0] + wn1[0], 0.9 * wn[1] + wn1[1]]); wn1 = wn; } }
        const o = { x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 250, axes: false, minWidth: 220 };
        const L = v.stage({ ...o, title: '$f$' });
        const R = v.stage({ ...o, title: 'result' });
        const B = v.stage({ x: [-0.8, 24.8], y: [0, 1.6], height: 190, axes: 'box', full: true, xlabel: 'n', title: 'Taylor coefficients $|a_n|$ (outline: $f$; filled: result)' });
        let st = null;
        v.render(() => {
          const k = kS.value, shift = op.value === 'S';
          const res = shift ? Array.from({ length: k }, () => [0, 0]).concat(A) : A.slice(k);
          discPhase(v, L, (x, y) => horner(A, x, y), 'f');
          discPhase(v, R, (x, y) => horner(res, x, y), op.value + k);
          for (const S of [L, R]) S.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          R.setTitle(shift ? `$S^{${k}}f=z^{${k}}f\\in z^{${k}}H^2$` : `$(S^*)^{${k}}f=\\sum_{n\\ge0}a_{n+${k}}z^n$`);
          if (shift && k > 0) R.dot(0, 0, { color: 'ink', r: 4, label: `zero of order ${k}`, labelPos: 'se', math: false, labelSize: 11.5 });
          const top = Math.max(...A.slice(0, 25).map(cabs)) * 1.18;
          B.setView(null, [-top * 0.09, top]);
          if (shift && k > 0) B.vband(-0.5, k - 0.5, { color: 'green', alpha: 0.08 });
          if (!shift && k > 0) B.vband(-0.5, k - 0.5, { color: 'red', alpha: 0.07 });
          for (let n = 0; n <= 24; n++) {
            const a = cabs(A[n]); B.rect(n - 0.36, 0, n + 0.36, a, { color: 'muted', width: 1.2, dash: [3, 2] });
            const b = n < res.length ? cabs(res[n]) : 0; if (b > 0) B.rect(n - 0.3, 0, n + 0.3, b, { fill: 'accent', fillAlpha: 0.75, stroke: false });
          }
          if (shift && k > 0) B.text(`first ${k} coefficients 0`, (k - 1) / 2, top * 0.92, { color: 'green', size: 11.5, align: k > 3 ? 'center' : 'left' });
          if (!shift && k > 0) B.text(`a₀…a${'₀₁₂₃₄₅₆'[k - 1]} discarded`, (k - 1) / 2, top * 0.92, { color: 'red', size: 11.5, align: k > 3 ? 'center' : 'left' });
          const n2 = (c) => Math.sqrt(c.reduce((s0, q) => s0 + q[0] * q[0] + q[1] * q[1], 0));
          st = { k, shift, nf: n2(A), nr: n2(res), lost: Math.sqrt(A.slice(0, k).reduce((s0, q) => s0 + q[0] * q[0] + q[1] * q[1], 0)) };
          v.legend([['muted', '$|a_n|$ of $f$', { dash: true }], ['accent', '$|a_n|$ of the result', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return s.shift
            ? `$\\|f\\|_2 = ${v.fix(s.nf, 4)}$, $\\;\\|S^{${s.k}}f\\|_2 = ${v.fix(s.nr, 4)}$: $S$ is an isometry, and $S^{${s.k}}(H^2)=z^{${s.k}}H^2$ is a proper invariant subspace.`
            : `$\\|f\\|_2 = ${v.fix(s.nf, 4)}$, $\\;\\|(S^*)^{${s.k}}f\\|_2 = ${v.fix(s.nr, 4)} = \\big(\\|f\\|_2^2-\\sum_{n<${s.k}}|a_n|^2\\big)^{1/2}$: the discarded coefficients carry norm $${v.fix(s.lost, 4)}$, so $S^*$ is not an isometry (though $S^*S=I$).`;
        });
      },
    },
    {
      num: '17.21',
      kind: 'Theorem',
      name: "Beurling's theorem on invariant subspaces of H²",
      credit: 'Beurling, 1949',
      verify: true,
      statement: String.raw`Let $M\ne\{0\}$ be a closed $S$-invariant subspace of $H^2$. Then there is an inner function $\varphi$, unique up to a constant factor of modulus $1$, such that
$$M=\varphi H^2=\{\varphi f:\ f\in H^2\}.$$
More generally, if $M$ is a closed subspace of $L^2(\T)$ with $S(M)\subset M$, then either $S(M)=M$, and $M=\chi_EL^2(\T)$ for some measurable $E\subset\T$; or $S(M)\ne M$, and $M=\varphi H^2$ for some measurable $\varphi$ with $|\varphi|=1$ a.e.`,
      idea: String.raw`If $S(M)\ne M$, pick $\varphi\in M\ominus S(M)$ with $\|\varphi\|_2=1$ (4.11). Then $\varphi\perp S^n\varphi$ for $n\ge1$, i.e. $\int|\varphi|^2e^{-in\theta}\,d\sigma=0$ for all $n\ne0$, so $|\varphi|=1$ a.e. Hence $\{\varphi e^{in\theta}\}_{n\ge0}$ is orthonormal in $M$ with closed span $\varphi H^2$. If $g\in M$ is orthogonal to $\varphi H^2$, then also $\varphi\perp S^ng$ for $n\ge1$ (as $S^ng\in S(M)$), so all Fourier coefficients of $g\bar\varphi$ vanish and $g=0$ (4.26). Inside $H^2$ the case $S(M)=M$ cannot occur ($\bigcap_kz^kH^2=0$), and $\varphi\in H^2$ with $|\varphi^*|=1$ is inner. With 17.17 this identifies the invariant subspace generated by $f$ as $M_fH^2$: $f$ is cyclic for $S$ exactly when $f$ is outer.`,
      caption: String.raw`$M=[f]$ is the closed span of $f,zf,z^2f,\dots$ for the cubic $f(z)=(z-\beta_1)(z-\beta_2)(z-\beta_3)$; drag the zeros in and out of the disc. Beurling predicts $[f]=\varphi H^2$ with $\varphi$ the Blaschke product of the zeros inside $U$ (left), so the distance from $1$ to $[f]$ must be $\sqrt{1-|\varphi(0)|^2}$. The chart computes $\operatorname{dist}(1,\operatorname{span}\{z^kf:k<N\})^2$ honestly (Gram matrix, Cholesky) and watches it converge to $1-\prod_{|\beta_j|<1}|\beta_j|^2$ — and to $0$ when every zero is outside (an outer, cyclic $f$). The middle panel is the computed projection of $1$, which approaches $\overline{\varphi(0)}\,\varphi$.`,
      deps: ['rca-17.20', 'rca-17.14', 'rca-17.17', 'rca-4.11', 'rca-4.26'],
      see: ['fa-4.12'],
      tags: ['shift operator', 'invariant subspaces', 'inner functions'],
      viz(v) {
        const NMAX = 140;
        const NS = v.slider('$N$ (number of shifts $z^kf$)', 1, NMAX, 24, { int: true });
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.45, 1.45], equal: true, height: 290, axes: false, minWidth: 240, title: 'zeros $\\beta_j$ of $f$; inner factor $\\varphi$ in $U$' });
        const P = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 290, axes: false, minWidth: 220, title: 'projection of $1$ onto $\\mathrm{span}\\{z^kf\\}_{k<N}$' });
        const C = v.stage({ x: [0, NMAX + 1], y: [0, 1], height: 190, axes: 'box', full: true, xlabel: 'N', title: '$\\mathrm{dist}\\big(1,\\ \\mathrm{span}\\{f,zf,\\dots,z^{N-1}f\\}\\big)^2$' });
        const Z = [[0.5, 0.3], [-1.04, 0.3], [0.2, -1.25]].map(([x, y], j) => L.handle(x, y, { color: 'ink', r: 6, label: `β${'₁₂₃'[j]}`, labelPos: 'ne' }));
        let st = null;
        v.render(() => {
          const B = Z.map((h) => [h.x, h.y]);
          // coefficients of f = Π (z − β_j)
          let c = [[1, 0]];
          for (const b of B) { const nc = Array.from({ length: c.length + 1 }, () => [0, 0]); for (let i = 0; i < c.length; i++) { nc[i + 1][0] += c[i][0]; nc[i + 1][1] += c[i][1]; const m = cmul(c[i], [-b[0], -b[1]]); nc[i][0] += m[0]; nc[i][1] += m[1]; } c = nc; }
          const D = c.length - 1;
          const rho = (d) => { let s = [0, 0]; for (let m = 0; m + d <= D; m++) { const t = cmul(c[m], conj(c[m + d])); s[0] += t[0]; s[1] += t[1]; } return s; };
          const RH = Array.from({ length: D + 1 }, (_, d) => rho(d));
          // banded Cholesky of the Hermitian Toeplitz Gram matrix G[i][j] = ρ(i − j)
          const Lc = Array.from({ length: NMAX }, () => new Map());
          const get = (i, j) => Lc[i].get(j) || [0, 0];
          const diag = [];
          for (let i = 0; i < NMAX; i++) {
            for (let j = Math.max(0, i - D); j <= i; j++) {
              let s = RH[i - j].slice();
              for (let k = Math.max(0, i - D); k < j; k++) { const t = cmul(get(i, k), conj(get(j, k))); s[0] -= t[0]; s[1] -= t[1]; }
              if (i === j) { const d = Math.sqrt(Math.max(s[0], 1e-300)); Lc[i].set(i, [d, 0]); diag.push(d); }
              else { const d = get(j, j)[0]; Lc[i].set(j, [s[0] / d, s[1] / d]); }
            }
          }
          const c0 = cabs(c[0]) ** 2;
          const dist2 = diag.map((d) => Math.max(0, 1 - c0 / (d * d)));
          const inside = B.filter((b) => Math.hypot(b[0], b[1]) < 1);
          const lim = 1 - inside.reduce((p, b) => p * (b[0] * b[0] + b[1] * b[1]), 1);
          // projection for the current N: the normal equations are conj(G) x = b with b = conj(c0) e_0, i.e. G conj(x) = c0 e_0
          const N = NS.value;
          const y = []; for (let i = 0; i < N; i++) { let s = i === 0 ? c[0].slice() : [0, 0]; for (let k = Math.max(0, i - D); k < i; k++) { const t = cmul(get(i, k), y[k]); s = [s[0] - t[0], s[1] - t[1]]; } const d = get(i, i)[0]; y.push([s[0] / d, s[1] / d]); }
          const xv = new Array(N); for (let i = N - 1; i >= 0; i--) { let s = y[i].slice(); for (let k = i + 1; k <= Math.min(N - 1, i + D); k++) { const t = cmul(conj(get(k, i)), xv[k]); s = [s[0] - t[0], s[1] - t[1]]; } const d = get(i, i)[0]; xv[i] = [s[0] / d, s[1] / d]; }
          for (let i = 0; i < N; i++) xv[i] = conj(xv[i]);
          const phi = (x, yy) => { let p = [1, 0]; for (const b of inside) p = cmul(p, bfac(b, x, yy)); return p; };
          const key = B.join('|');
          L.raster((x, yy) => { if (x * x + yy * yy >= 1) return null; const w = phi(x, yy); return phaseRGB(v.M, w[0], w[1]); }, { key, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          for (const b of B) if (Math.hypot(b[0], b[1]) >= 1) L.circle(b[0], b[1], 0.1, { color: 'green', width: 1.6, dash: [3, 2] });
          L.corner(inside.length ? `φ = Blaschke product of ${inside.length} zero${inside.length > 1 ? 's' : ''}` : 'φ ≡ 1: f is outer (cyclic)', 'tl', { color: inside.length ? 'ink' : 'green', weight: 600 });
          const proj = (x, yy) => cmul(horner(c, x, yy), horner(xv, x, yy));
          discPhase(v, P, proj, key + '|' + N);
          P.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          // error against the exact projection conj(φ(0)) φ on |z| = 1/2
          const p0 = conj(phi(0, 0)); let err = 0;
          for (let k = 0; k < 64; k++) { const t = TAU * k / 64, x = 0.5 * Math.cos(t), yy = 0.5 * Math.sin(t); const e = cmul(p0, phi(x, yy)), q = proj(x, yy); err = Math.max(err, cabs([e[0] - q[0], e[1] - q[1]])); }
          // chart
          C.hline(lim, { color: 'green', width: 1.6, dash: [6, 4] });
          C.tex('1-|\\varphi(0)|^2', NMAX, lim, { color: 'green', size: 13, align: 'right', baseline: lim > 0.85 ? 'top' : 'bottom', dy: lim > 0.85 ? 4 : -3 });
          C.path(dist2.map((d, i) => [i + 1, d]), { color: 'accent', width: 2.4 });
          C.vline(N, { color: 'muted', width: 1, dash: [3, 4] });
          C.dot(N, dist2[N - 1], { color: 'accent', r: 5 });
          st = { N, d: dist2[N - 1], lim, nin: inside.length, err };
          v.legend([['accent', '$\\mathrm{dist}^2$ computed from $\\{z^kf\\}_{k<N}$'], ['green', 'Beurling: $1-\\prod_{|\\beta_j|<1}|\\beta_j|^2$', { dash: true }], ['green', 'zero outside $\\overline U$ (outer factor)', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$N = ${s.N}$: $\\mathrm{dist}^2 = ${v.fix(s.d, 5)}$, Beurling's limit $= ${v.fix(s.lim, 5)}$` + (s.nin ? '' : ' (no zero in $U$: $f$ is outer, hence cyclic, $[f]=H^2$)') + `. Projection vs. $\\overline{\\varphi(0)}\\varphi$ on $|z|=\\frac12$: max error $${v.sci(s.err, 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ conjugate functions
    {
      num: '17.23',
      kind: 'Definition',
      name: 'The conjugate function f̃',
      verify: true,
      statement: String.raw`Let $f\in L^1(\T)$ be real, let $u=P[f]$ be its Poisson integral, and let $v$ be the harmonic conjugate of $u$ in $U$ with $v(0)=0$, so that
$$F(z)=u(z)+iv(z)=\frac1{2\pi}\int_{-\pi}^{\pi}\frac{e^{it}+z}{e^{it}-z}f(e^{it})\,dt$$
is holomorphic in $U$. The **conjugate function** of $f$ is the radial limit
$$\tilde f(e^{i\theta})=\lim_{r\to1}v(re^{i\theta}),$$
which exists for almost every $\theta$ (17.24). On the Fourier side, if $f\sim\sum c_ne^{in\theta}$ then $\tilde f\sim\sum(-i\,\sgn n)\,c_ne^{in\theta}$: conjugation turns $\cos n\theta$ into $\sin n\theta$ and $\sin n\theta$ into $-\cos n\theta$.`,
      idea: String.raw`The Herglotz integral $F$ has real part $P[f]$ (the real part of $\frac{e^{it}+z}{e^{it}-z}$ is the Poisson kernel) and $F(0)=\hat f(0)$ is real, which pins down $v$. Expanding the kernel, $F(z)=\hat f(0)+2\sum_{n\ge1}\hat f(n)z^n$, which gives the Fourier description. For $f\in L^2$, Parseval makes conjugation an isometry on the functions of mean zero, $\|\tilde f\|_2^2=\|f\|_2^2-|\hat f(0)|^2$; for $f\in L^1$ or $L^\infty$ it is *not* bounded — a jump of $f$ produces a logarithmic singularity of $\tilde f$.`,
      caption: String.raw`Choose $f$ (for the arc, drag its endpoints). Top: $f$ (black), the conjugate function $\tilde f$ (blue) and $v(re^{i\theta})$ for the chosen $r$ (gold), converging to $\tilde f$. Each jump of $f$ creates a logarithmic spike of $\tilde f$. Left: phase portrait of $F=u+iv$. Right: $F$ maps the circles $|z|=r$ onto the gold curves, which approach the boundary curve $f+i\tilde f$ (blue); for the indicator of an arc, $F$ maps $U$ onto the strip $0<\Re w<1$.`,
      deps: ['rca-11.5', 'rca-11.10', 'rca-17.9'],
      see: ['rca-17.26'],
      tags: ['conjugate function', 'Hilbert transform'],
      viz(v) {
        const TRI = 401;
        const EX = {
          arc: { label: 'indicator of an arc' },
          sq: { label: 'square wave $\\sgn\\theta$' },
          saw: { label: 'sawtooth $\\theta/\\pi$' },
          tri: { label: 'triangle $|\\theta|/\\pi-\\frac12$' },
          trig: { label: '$\\cos2\\theta+0.6\\sin5\\theta$' },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'arc');
        const rS = v.slider('$r$', 0.5, 0.995, 0.9, { step: 0.005 });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-2, 2], height: 230, axes: 'box', full: true, xticks: PI_TICKS, xlabel: 'θ', title: '$f$, $\\tilde f$ and $v(re^{i\\theta})$' });
        const L = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 270, axes: false, minWidth: 220, title: 'phase portrait of $F=u+iv$' });
        const W = v.stage({ x: [-1.5, 2.5], y: [-2, 2], equal: true, height: 270, axes: true, weight: 1.3, title: '$F(re^{i\\theta})$ and the boundary curve $f+i\\tilde f$' });
        const E1 = L.handle(Math.cos(-0.6), Math.sin(-0.6), { color: 'red', r: 6, constrain: onCircle });
        const E2 = L.handle(Math.cos(1.4), Math.sin(1.4), { color: 'red', r: 6, constrain: onCircle });
        const triF = (x, y) => { let s = [0, 0], zn = [x, y]; const z2 = cmul([x, y], [x, y]); for (let n = 1; n <= TRI; n += 2) { s[0] += zn[0] / (n * n); s[1] += zn[1] / (n * n); zn = cmul(zn, z2); } return [-4 / Math.PI ** 2 * s[0], -4 / Math.PI ** 2 * s[1]]; };
        const triT = (t) => { let s = 0; for (let n = 1; n <= TRI; n += 2) s += Math.sin(n * t) / (n * n); return -4 / Math.PI ** 2 * s; };
        let st = null;
        v.render(() => {
          const key = which.value, r = rS.value;
          E1.visible = E2.visible = key === 'arc';
          const a = angle(E1), La = ccw(a, angle(E2));
          const inArc = (t) => { let d = t - a; while (d < 0) d += TAU; while (d >= TAU) d -= TAU; return d < La; };
          let F, f, ft;
          if (key === 'arc') { F = (x, y) => hergArc(a, La, x, y); f = (t) => (inArc(t) ? 1 : 0); ft = (t) => Math.log(Math.abs(Math.sin((t - a) / 2) / Math.sin((t - a - La) / 2))) / Math.PI; }
          else if (key === 'sq') { F = (x, y) => { const h = hergArc(0, Math.PI, x, y); return [2 * h[0] - 1, 2 * h[1]]; }; f = (t) => (t > 0 ? 1 : -1); ft = (t) => 2 / Math.PI * Math.log(Math.abs(Math.tan(t / 2))); }
          else if (key === 'saw') { F = (x, y) => [2 / Math.PI * Math.atan2(y, 1 + x), -2 / Math.PI * 0.5 * Math.log((1 + x) ** 2 + y * y)]; f = (t) => t / Math.PI; ft = (t) => -2 / Math.PI * Math.log(Math.abs(2 * Math.cos(t / 2))); }
          else if (key === 'tri') { F = triF; f = (t) => Math.abs(t) / Math.PI - 0.5; ft = triT; }
          else { F = (x, y) => { const z2 = cmul([x, y], [x, y]), z5 = cmul(cmul(z2, z2), [x, y]); return [z2[0] + 0.6 * z5[1], z2[1] - 0.6 * z5[0]]; }; f = (t) => Math.cos(2 * t) + 0.6 * Math.sin(5 * t); ft = (t) => Math.sin(2 * t) - 0.6 * Math.cos(5 * t); }
          const kk = key + (key === 'arc' ? `${a},${La}` : '');
          discPhase(v, L, F, kk);
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          if (key === 'arc') L.curve((s) => [1.05 * Math.cos(a + La * s), 1.05 * Math.sin(a + La * s)], 0, 1, { color: 'red', width: 3 });
          L.circle(0, 0, r, { color: 'panel', width: 4 }); L.circle(0, 0, r, { color: 'gold', width: 1.8 });
          // top: graphs
          const yr = key === 'trig' ? [-1.9, 1.9] : key === 'tri' ? [-0.75, 0.75] : [-2.2, 2.2];
          T.setView(null, yr);
          const jumps = key === 'arc' ? [a, a + La].map((t) => Math.atan2(Math.sin(t), Math.cos(t))) : key === 'sq' ? [0] : [];
          const segs = [-Math.PI, ...jumps.slice().sort((p, q) => p - q), Math.PI];
          for (let i = 0; i + 1 < segs.length; i++) T.fn(f, { color: 'ink', width: 2, domain: [segs[i] + 1e-9, segs[i + 1] - 1e-9] });
          T.fn(ft, { color: 'accent', width: 2.2, n: 2400 });
          T.fn((t) => F(r * Math.cos(t), r * Math.sin(t))[1], { color: 'gold', width: 2, n: 1600 });
          // right: images of circles and the boundary curve
          const curve = (rr) => { const pts = []; for (let k = 0; k <= 720; k++) { const t = -Math.PI + TAU * k / 720; const w = F(rr * Math.cos(t), rr * Math.sin(t)); pts.push(w); } return pts; };
          const bnd = []; let fprev = null;
          for (let k = 0; k <= 3000; k++) { const t = -Math.PI + TAU * (k + 0.5) / 3001; const yv = ft(t), fv = f(t); if (fprev != null && Math.abs(fv - fprev) > 0.3) bnd.push(null); fprev = fv; bnd.push(Math.abs(yv) < 50 ? [fv, yv] : null); }
          let xs0 = Infinity, xs1 = -Infinity; for (const q of bnd) if (q) { xs0 = Math.min(xs0, q[0]); xs1 = Math.max(xs1, q[0]); }
          const cx = (xs0 + xs1) / 2, hw = Math.max(1.2, (xs1 - xs0) * 0.8);
          W.setView([cx - hw * 1.25, cx + hw * 1.25], [-2.3, 2.3]);
          W.path(bnd, { color: 'accent', width: 2.2 });
          for (const [rr, al] of [[0.5, 0.45], [0.8, 0.7], [r, 1]]) W.path(curve(rr), { color: 'gold', width: rr === r ? 2.2 : 1.4, alpha: al });
          W.dot(F(0, 0)[0], F(0, 0)[1], { color: 'ink', r: 4, label: 'F(0)', labelPos: 'sw' });
          // Parseval check ‖f̃‖₂² = ‖f‖₂² − f̂(0)²
          const NQ = 6000; let s2 = 0, s1 = 0, sft = 0;
          for (let k = 0; k < NQ; k++) { const t = -Math.PI + TAU * (k + 0.5) / NQ; const fv = f(t); s1 += fv; s2 += fv * fv; }
          if (key === 'arc' || key === 'sq') {
            const g = (dL, dR) => (Math.log(Math.sin(dL / 2) / Math.sin(dR / 2)) / Math.PI) ** 2;
            sft = key === 'arc' ? (deArc(La, g) + deArc(TAU - La, g)) / TAU : 4 * 2 * deArc(Math.PI, g) / TAU;
          } else if (key === 'saw') sft = deArc(TAU, (dL, dR) => (2 / Math.PI * Math.log(2 * Math.sin(Math.min(dL, dR) / 2))) ** 2) / TAU;
          else { for (let k = 0; k < NQ; k++) { const t = -Math.PI + TAU * (k + 0.5) / NQ; sft += ft(t) ** 2; } sft /= NQ; }
          const m0 = s1 / NQ;
          st = { lhs: sft, rhs: s2 / NQ - m0 * m0, v0: F(0, 0)[1], key };
          v.legend([['ink', '$f$'], ['accent', '$\\tilde f$ / boundary curve $f+i\\tilde f$'], ['gold', '$v(re^{i\\theta})$ / image of $|z|=r$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$v(0) = ${v.fix(Math.abs(s.v0) < 5e-13 ? 0 : s.v0, 4)}$. Parseval: $\\|\\tilde f\\|_2^2 = ${v.fix(s.lhs, 4)}$ and $\\|f\\|_2^2-\\hat f(0)^2 = ${v.fix(s.rhs, 4)}$.`;
        });
      },
    },
    {
      num: '17.24',
      kind: 'Theorem',
      name: 'Positive real part forces Hᵖ for p < 1 (Kolmogorov)',
      credit: 'Kolmogorov, 1925',
      verify: true,
      statement: String.raw`If $F\in H(U)$ and $\Re F>0$ in $U$, then $F\in H^p$ for every $0<p<1$; in fact
$$M_p(F;r)^p\le\sec\big(\tfrac{p\pi}{2}\big)\,|F(0)|^p\qquad(0\le r<1).$$
Consequently, for every real $f\in L^1(\T)$ the function $F=u+iv$ of 17.23 lies in $H^p$ for all $p<1$, the conjugate function $\tilde f$ exists a.e., and $\|\tilde f\|_p\le C_p\|f\|_1$ for $0<p<1$, with $C_p$ depending only on $p$.`,
      idea: String.raw`Use the principal branch of $F^p$, which is holomorphic because $F$ omits the closed left half-plane. If $w=|w|e^{i\phi}$ with $|\phi|<\pi/2$, then $\Re(w^p)=|w|^p\cos(p\phi)\ge|w|^p\cos(p\pi/2)$, so $|F|^p\le\sec(p\pi/2)\,\Re(F^p)$. Averaging over $|z|=r$ and using the mean value property of the harmonic function $\Re(F^p)$ gives the bound. For $f\ge0$, $F$ is the Herglotz integral of $f$ with $F(0)=\|f\|_1$; a general real $f$ is $f^+-f^-$. Radial limits then exist by 17.9, and $|v|\le|F|$ with Fatou's lemma bounds $\|\tilde f\|_p$.`,
      caption: String.raw`$F$ is the Herglotz integral of a positive measure: a point mass ($F=\frac{1+z}{1-z}$) or an arc. Left: $F$ maps the circles $|z|=r$ into the right half-plane. Middle: $w\mapsto w^p$ folds that half-plane into the sector $|\arg\zeta|<p\pi/2$, where $|\zeta|\le\sec(p\pi/2)\Re\zeta$ — and $\Re\zeta$ averages to $\Re F(0)^p$ on every circle. Right: $M_p(F;r)$ stays below the bound for $p<1$; for the point mass and $p\ge1$ it diverges, so the restriction $p<1$ is sharp.`,
      deps: ['rca-17.23', 'rca-17.9', 'rca-11.12', 'rca-1.28'],
      tags: ['conjugate function', 'Hardy spaces', 'Herglotz'],
      viz(v) {
        const ex = v.select('measure', [{ value: 'pt', label: 'point mass: $F=\\frac{1+z}{1-z}$' }, { value: 'arc', label: 'arc $|t|<1$' }], 'pt');
        const pS = v.slider('$p$', 0.1, 1.5, 0.6, { step: 0.02 });
        const rS = v.slider('$r$', 0.3, 0.98, 0.8, { step: 0.01 });
        const W = v.stage({ x: [-0.6, 4.2], y: [-2.6, 2.6], equal: true, height: 270, axes: true, minWidth: 200, title: '$w=F(re^{i\\theta})$ in $\\Re w>0$' });
        const Zs = v.stage({ x: [-0.4, 2.8], y: [-1.7, 1.7], equal: true, height: 270, axes: true, minWidth: 200, title: '$\\zeta=w^p$ in the sector $|\\arg\\zeta|<\\frac{p\\pi}2$' });
        const C = v.stage({ x: [0, 3.6], y: [0, 2], height: 270, axes: 'box', xticks: R_TICKS.slice(0, 4), xlabel: 'r', minWidth: 220, title: '$\\log_{10}M_p(F;r)$' });
        const powP = (w, p) => { const m = Math.pow(Math.hypot(w[0], w[1]), p), t = p * Math.atan2(w[1], w[0]); return [m * Math.cos(t), m * Math.sin(t)]; };
        let st = null;
        v.render(() => {
          const key = ex.value, p = pS.value, r = rS.value;
          const F = key === 'pt' ? (x, y) => cdiv([1 + x, y], [1 - x, -y]) : (x, y) => hergArc(-1, 2, x, y);
          const F0 = F(0, 0)[0];
          const circ = (rr) => { const pts = []; for (let k = 0; k <= 720; k++) { const t = -Math.PI + TAU * k / 720; pts.push(F(rr * Math.cos(t), rr * Math.sin(t))); } return pts; };
          if (key === 'pt') { W.setView([-0.6, 4.2], [-2.6, 2.6]); Zs.setView([-0.4, 2.8], [-1.7, 1.7]); } else { W.setView([-0.25, 1.25], [-1.1, 1.1]); Zs.setView([-0.25, 1.25], [-1, 1]); }
          W.rect(0, -50, 50, 50, { fill: 'green', fillAlpha: 0.05, stroke: false });
          W.vline(0, { color: 'green', width: 1.4 });
          const rs = [0.3, 0.6, r];
          rs.forEach((rr, i) => { const c = circ(rr); W.path(c, { color: i === 2 ? 'accent' : 'muted', width: i === 2 ? 2.2 : 1.2 }); Zs.path(c.map((w) => powP(w, p)), { color: i === 2 ? 'accent' : 'muted', width: i === 2 ? 2.2 : 1.2 }); });
          W.dot(F0, 0, { color: 'ink', r: 4, label: 'F(0)', labelPos: 'n' });
          // sector
          const ang = Math.min(p, 1) * Math.PI / 2, Lr = 10;
          Zs.poly([[0, 0], [Lr * Math.cos(ang), Lr * Math.sin(ang)], [Lr * Math.cos(ang), -Lr * Math.sin(ang)]], { fill: p < 1 ? 'green' : 'red', fillAlpha: 0.06, stroke: false });
          Zs.line(0, 0, Lr * Math.cos(ang), Lr * Math.sin(ang), { color: p < 1 ? 'green' : 'red', width: 1.4, dash: [5, 4] });
          Zs.line(0, 0, Lr * Math.cos(ang), -Lr * Math.sin(ang), { color: p < 1 ? 'green' : 'red', width: 1.4, dash: [5, 4] });
          const z0 = powP([F0, 0], p);
          Zs.vline(z0[0], { color: 'ink', width: 1, dash: [2, 4] });
          Zs.dot(z0[0], 0, { color: 'ink', r: 4, label: 'F(0)ᵖ', labelPos: 'n' });
          // means
          const xs = v.M.linspace(0, 3.5, 60);
          const cl = key === 'pt' ? 0 : 1;
          const lm = xs.map((x) => { const rr = rOf(x); const m = meanC((t) => Math.pow(cabs(F(rr * Math.cos(t), rr * Math.sin(t))), p), 1600, cl) + (key === 'arc' ? 0 : 0); return [x, Math.log10(m) / p]; });
          const bound = p < 1 ? Math.log10(Math.pow(1 / Math.cos(p * Math.PI / 2), 1 / p) * Math.abs(F0)) : null;
          const ys = lm.map((q) => q[1]).concat(bound != null ? [bound] : []);
          const y0 = Math.min(...ys), y1 = Math.max(...ys), pd = Math.max(0.05, (y1 - y0) * 0.15);
          C.setView(null, [y0 - pd, y1 + pd]);
          if (bound != null) { C.hline(bound, { color: 'green', width: 1.5, dash: [6, 4] }); C.tex('\\sec(\\frac{p\\pi}2)^{1/p}|F(0)|', 3.5, bound, { color: 'green', size: 12, align: 'right', baseline: 'bottom', dy: -3 }); }
          const blows = key === 'pt' && p >= 1;
          C.path(lm, { color: blows ? 'red' : 'accent', width: 2.4 });
          C.vline(-Math.log10(1 - r), { color: 'muted', width: 1, dash: [3, 4] });
          st = { p, end: 10 ** lm[lm.length - 1][1], bound: bound != null ? 10 ** bound : null, blows };
          v.legend([['accent', 'images of $|z|=r$ (current $r$)'], ['muted', '$r=0.3,\\ 0.6$'], ['green', '$\\Re w>0$ and its image sector', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.bound != null) return `$p = ${v.fix(s.p, 2)}$: $\\;M_p(F;0.9997) = ${v.fix(s.end, 4)} \\le \\sec(\\frac{p\\pi}2)^{1/p}|F(0)| = ${v.fix(s.bound, 4)}$.`;
          return `$p = ${v.fix(s.p, 2)} \\ge 1$: $\\;M_p(F;0.9997) = ${v.fmt(s.end, 4)}$` + (s.blows ? ' and growing without bound: $\\frac{1+z}{1-z}\\notin H^1$.' : ' — still finite here, but the sector argument no longer applies.');
        });
      },
    },
    {
      num: '17.26',
      kind: 'Theorem',
      name: "M. Riesz's theorem on conjugate functions",
      credit: 'M. Riesz, 1927',
      statement: String.raw`Suppose $1<p<\infty$. There is a constant $A_p<\infty$ such that
$$\|\tilde f\|_p\le A_p\|f\|_p$$
for every real $f\in L^p(\T)$. Equivalently, if $u=P[f]$ and $v$ is its harmonic conjugate with $v(0)=0$, then $M_p(v;r)\le A_p\|f\|_p$ for all $r<1$, so $F=u+iv\in H^p$. The statement fails for $p=1$ and for $p=\infty$.`,
      idea: String.raw`Let $1<p\le2$ and first take $f\ge0$ (a trigonometric polynomial, say), so $F=u+iv$ has positive real part; write $F=|F|e^{i\phi}$ with $|\phi|<\pi/2$. An elementary inequality $|\sin\phi|^p\le A\cos^p\phi-B\cos(p\phi)$ on $(-\frac\pi2,\frac\pi2)$, with $A,B>0$ depending on $p$, gives $|v|^p\le A\,u^p-B\,\Re(F^p)$. Averaging over $|z|=r$, the harmonic term contributes $-B\,F(0)^p\le0$, so $M_p(v;r)^p\le A\,M_p(u;r)^p\le A\|f\|_p^p$. Split a real $f$ into $f^+-f^-$ and pass to general $f\in L^p$ by density. For $2<p<\infty$ use duality: $\int\tilde f g=-\int f\tilde g$, and $L^{p}$ is the dual of $L^{p'}$ (6.16) with $p'<2$.`,
      caption: String.raw`Choose $f$ and $p$. Top: $f$ (black) and $\tilde f$ (blue). Bottom: the ratio $\|\tilde f\|_p/\|f\|_p$, computed by quadrature that resolves the logarithmic singularities, as a function of $p$ (log scale), together with the best possible constant $A_p=\cot\frac{\pi}{2p^*}$, $p^*=\max(p,p')$, found by Pichorides (1972). At $p=2$ the ratio is $\le1$ (Parseval). As $p\to\infty$ the ratio for the square wave grows without bound — $f$ is bounded, $\tilde f$ is not; with the Poisson kernel $P_\rho$, $\rho\to1$, it blows up as $p\to1$.`,
      deps: ['rca-17.23', 'rca-17.24', 'rca-6.16', 'rca-3.5'],
      see: ['rca-17.13', 'fa-4.10'],
      tags: ['conjugate function', 'Lᵖ bounds', 'Hilbert transform'],
      viz(v) {
        const EX = {
          sq: { label: 'square wave' },
          arc: { label: 'indicator of $|\\theta|<\\ell/2$' },
          saw: { label: 'sawtooth $\\theta/\\pi$' },
          poi: { label: 'Poisson kernel $P_\\rho$' },
          trig: { label: '$\\cos\\theta+\\cos3\\theta$' },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const lS = v.slider('arc length $\\ell$', 0.2, 6, 1.5, { step: 0.05 });
        const rhoS = v.slider('$\\rho$', 0.3, 0.995, 0.9, { step: 0.005 });
        const pS = v.slider('$p$', 0, 1, 0.35, { step: 0.002, fmt: (u) => v.fmt(Math.pow(10, Math.log10(1.02) + u * (Math.log10(40) - Math.log10(1.02))), 3) });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-2.5, 2.5], height: 210, axes: 'box', full: true, xticks: PI_TICKS, xlabel: 'θ', title: '$f$ and its conjugate $\\tilde f$' });
        const C = v.stage({ x: [Math.log10(1.02), Math.log10(40)], y: [-0.5, 1.5], height: 250, axes: 'box', full: true, xlabel: 'p', title: '$\\|\\tilde f\\|_p/\\|f\\|_p$ against $p$ (log–log), and the sharp constant $A_p$' });
        const PT = [1.02, 1.1, 1.5, 2, 3, 5, 10, 20, 40];
        C.setTicks(PT.map((p) => [Math.log10(p), String(p)]), undefined);
        const Ap = (p) => (p <= 2 ? Math.tan(Math.PI / (2 * p)) : 1 / Math.tan(Math.PI / (2 * p)));
        const pOf = (u) => Math.pow(10, Math.log10(1.02) + u * (Math.log10(40) - Math.log10(1.02)));
        const lnr = (dL, dR) => Math.log(Math.sin(dL / 2) / Math.sin(dR / 2));
        // ‖f‖_p and ‖f̃‖_p for each example (normalised by dθ/2π)
        const norms = (key, p, ell, rho) => {
          if (key === 'sq') return [1, Math.pow(2 * deArc(Math.PI, (a, b) => Math.abs(2 / Math.PI * lnr(a, b)) ** p) / TAU, 1 / p)];
          if (key === 'arc') return [Math.pow(ell / TAU, 1 / p), Math.pow((deArc(ell, (a, b) => Math.abs(lnr(a, b) / Math.PI) ** p) + deArc(TAU - ell, (a, b) => Math.abs(lnr(a, b) / Math.PI) ** p)) / TAU, 1 / p)];
          if (key === 'saw') return [Math.pow(1 / (p + 1), 1 / p), Math.pow(deArc(TAU, (a, b) => Math.abs(2 / Math.PI * Math.log(2 * Math.sin(Math.min(a, b) / 2))) ** p) / TAU, 1 / p)];
          if (key === 'poi') { const P = (t) => (1 - rho * rho) / (1 - 2 * rho * Math.cos(t) + rho * rho), Q = (t) => 2 * rho * Math.sin(t) / (1 - 2 * rho * Math.cos(t) + rho * rho); return [Math.pow(meanC((t) => P(t) ** p, 3000, 0), 1 / p), Math.pow(meanC((t) => Math.abs(Q(t)) ** p, 3000, 0), 1 / p)]; }
          let a = 0, b = 0; const NQ = 2048; for (let k = 0; k < NQ; k++) { const t = TAU * k / NQ; a += Math.abs(Math.cos(t) + Math.cos(3 * t)) ** p; b += Math.abs(Math.sin(t) + Math.sin(3 * t)) ** p; } return [Math.pow(a / NQ, 1 / p), Math.pow(b / NQ, 1 / p)];
        };
        let cache = {}, st = null;
        v.render(() => {
          const key = which.value, ell = lS.value, rho = rhoS.value, p = pOf(pS.value);
          lS.el.hidden = key !== 'arc'; rhoS.el.hidden = key !== 'poi';
          let f, ft, jumps = [];
          if (key === 'sq') { f = (t) => (t > 0 ? 1 : -1); ft = (t) => 2 / Math.PI * Math.log(Math.abs(Math.tan(t / 2))); jumps = [0]; }
          else if (key === 'arc') { f = (t) => (Math.abs(t) < ell / 2 ? 1 : 0); ft = (t) => Math.log(Math.abs(Math.sin((t + ell / 2) / 2) / Math.sin((t - ell / 2) / 2))) / Math.PI; jumps = [-ell / 2, ell / 2]; }
          else if (key === 'saw') { f = (t) => t / Math.PI; ft = (t) => -2 / Math.PI * Math.log(Math.abs(2 * Math.cos(t / 2))); }
          else if (key === 'poi') { f = (t) => (1 - rho * rho) / (1 - 2 * rho * Math.cos(t) + rho * rho); ft = (t) => 2 * rho * Math.sin(t) / (1 - 2 * rho * Math.cos(t) + rho * rho); }
          else { f = (t) => Math.cos(t) + Math.cos(3 * t); ft = (t) => Math.sin(t) + Math.sin(3 * t); }
          const yr = key === 'poi' ? [-Math.min(12, 1 / (1 - rho)) * 1.15, Math.min(25, (1 + rho) / (1 - rho)) * 1.05] : key === 'arc' ? [-1.4, 2] : [-2.3, 2.3];
          T.setView(null, yr);
          const segs = [-Math.PI, ...jumps, Math.PI];
          for (let i = 0; i + 1 < segs.length; i++) T.fn(f, { color: 'ink', width: 2, domain: [segs[i] + 1e-9, segs[i + 1] - 1e-9], n: 1200 });
          T.fn(ft, { color: 'accent', width: 2.2, n: 3000 });
          const ck = `${key}|${key === 'arc' ? ell : ''}|${key === 'poi' ? rho : ''}`;
          if (!cache[ck]) { const us = v.M.linspace(0, 1, 70); cache = { [ck]: us.map((u) => { const pp = pOf(u); const [a, b] = norms(key, pp, ell, rho); return [Math.log10(pp), Math.log10(b / a)]; }) }; }
          const curve = cache[ck];
          const [na, nb] = norms(key, p, ell, rho);
          const bnd = v.M.linspace(Math.log10(1.02), Math.log10(40), 120).map((x) => [x, Math.log10(Ap(10 ** x))]);
          const ys = curve.map((q) => q[1]).concat([Math.log10(Ap(p)), -0.1]);
          C.setView(null, [Math.min(...ys) - 0.12, Math.max(...bnd.map((q) => q[1])) + 0.1]);
          C.setTicks(undefined, [-1, -0.5, 0, 0.5, 1, 1.5, 2].map((k) => [k, v.fmt(10 ** k, 2)]));
          C.path(bnd, { color: 'green', width: 2, dash: [6, 4] });
          C.vline(Math.log10(2), { color: 'faint', width: 1 });
          C.path(curve, { color: 'accent', width: 2.6 });
          const lx = Math.log10(p);
          C.vline(lx, { color: 'muted', width: 1, dash: [3, 4] });
          C.dot(lx, Math.log10(nb / na), { color: 'accent', r: 5.5 });
          C.dot(lx, Math.log10(Ap(p)), { color: 'green', r: 4.5 });
          st = { p, na, nb, A: Ap(p) };
          v.legend([['ink', '$f$'], ['accent', '$\\tilde f$; ratio $\\|\\tilde f\\|_p/\\|f\\|_p$'], ['green', 'sharp constant $A_p$ (Pichorides)', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$p = ${v.fmt(s.p, 3)}$: $\\;\\|f\\|_p = ${v.fmt(s.na, 4)}$, $\\;\\|\\tilde f\\|_p = ${v.fmt(s.nb, 4)}$, ratio $= ${v.fmt(s.nb / s.na, 4)} \\le A_p = ${v.fmt(s.A, 4)}$.`;
        });
      },
    },
  ],
};
