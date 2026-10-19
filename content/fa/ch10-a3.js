import { hermiteJordan } from './ch10-source.shared.js';
// Rudin, Functional Analysis — Chapter 10 (part 3): the symbolic (holomorphic functional) calculus
//
// Source: full Rudin second-edition sections and proofs reviewed; see verification ledger.

// ---------------------------------------------------------------- complex scalars [re, im] and small complex matrices
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const clog = (a) => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])];
const csin = (a) => [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cscale = (a, k) => [a[0] * k, a[1] * k];
const mmul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), [0, 0])));
const madd = (A, B) => A.map((row, i) => row.map((a, j) => cadd(a, B[i][j])));
const msub = (A, B) => A.map((row, i) => row.map((a, j) => csub(a, B[i][j])));
const mscale = (A, z) => A.map((row) => row.map((a) => cmul(a, z)));
const zeros = (n) => Array.from({ length: n }, () => Array.from({ length: n }, () => [0, 0]));
const ident = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [i === j ? 1 : 0, 0]));
const lamI = (n, l) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? [l[0], l[1]] : [0, 0])));
/** Frobenius norm (cheap stand-in for small error measurements). */
const fro = (A) => Math.sqrt(A.flat().reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
function inv(A) {
  const n = A.length;
  if (n === 2) { const d = csub(cmul(A[0][0], A[1][1]), cmul(A[0][1], A[1][0])); return [[cdiv(A[1][1], d), cdiv(cscale(A[0][1], -1), d)], [cdiv(cscale(A[1][0], -1), d), cdiv(A[0][0], d)]]; }
  const c = (i, j) => { const r = [0, 1, 2].filter((k) => k !== i), s = [0, 1, 2].filter((k) => k !== j); const m = csub(cmul(A[r[0]][s[0]], A[r[1]][s[1]]), cmul(A[r[0]][s[1]], A[r[1]][s[0]])); return (i + j) % 2 ? cscale(m, -1) : m; };
  const det = cadd(cadd(cmul(A[0][0], c(0, 0)), cmul(A[0][1], c(0, 1))), cmul(A[0][2], c(0, 2)));
  return [0, 1, 2].map((i) => [0, 1, 2].map((j) => cdiv(c(j, i), det)));
}
/** (1/2πi) ∮ f(λ) (λe − x)^{-1} dλ over a list of circles [centre, radius] (trapezoid rule, N nodes each). */
function cauchy(f, X, circles, N = 192) {
  const n = X.length; let S = zeros(n);
  for (const [c, r] of circles) for (let k = 0; k < N; k++) {
    const t = 2 * Math.PI * (k + 0.5) / N, d = [r * Math.cos(t), r * Math.sin(t)], lam = cadd(c, d);
    S = madd(S, mscale(inv(msub(lamI(n, lam), X)), cmul(f(lam), cscale(d, 1 / N))));
  }
  return S;
}
/** A fixed, well-conditioned similarity used to hide the triangular structure. */
const SIM3 = [[[1, 0], [0.4, 0.2], [-0.3, 0]], [[0.2, -0.1], [1, 0], [0.5, 0.1]], [[0, 0.3], [-0.2, 0], [1, 0]]];
const SIM3I = inv(SIM3);
const tri3 = (l, k) => [[l[0], [0.8 * k, 0], [0.3 * k, 0.2 * k]], [[0, 0], l[1], [-0.6 * k, 0]], [[0, 0], [0, 0], l[2]]];
const conj3 = (T) => mmul(mmul(SIM3, T), SIM3I);
const fmtC = (v, z, d = 3) => `${v.fix(z[0], d)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), d)}i`;
/** Small circles around the points of a finite spectrum, avoiding each other and the points in `avoid`. */
function smallCircles(spec, avoid = [], cap = 0.45) {
  return spec.map((z, i) => { let r = cap; spec.forEach((w, j) => { if (j !== i) r = Math.min(r, cabs(csub(z, w)) / 2.2); }); avoid.forEach((w) => { r = Math.min(r, cabs(csub(z, w)) / 1.6); }); return [z, Math.max(r, 1e-3)]; });
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));

export default {
  collection: 'fa',
  chapter: 10,
  items: [
    {
      num: '10.22',
      kind: 'Definition',
      name: 'Integrals of A-valued functions along paths',
      statement: String.raw`If $f$ is a continuous $A$-valued function on a compact Hausdorff space with complex Borel measure $\mu$, its vector integral exists. For each $x\in A$,
$$x\int f\,d\mu=\int xf\,d\mu,\qquad\left(\int f\,d\mu\right)x=\int fx\,d\mu.$$
In particular, these identities apply to integration along contours.`,
      idea: String.raw`Left and right multiplication by a fixed element are bounded linear operators. Apply the defining scalar-functional characterization of the vector integral to either operator, and use separation by the continuous dual.`,
      deps: ['fa-3.29', 'fa-3.4a', 'fa-10.1'],
      tags: ['Banach algebras', 'vector integrals'],
      },
    {
      num: '10.23', kind: 'Definition', name: 'Contours surrounding a compact set',
      statement: String.raw`For compact $K\subset\Omega\subset\C$ with $\Omega$ open, a surrounding contour is a finite collection of oriented line segments in $\Omega\setminus K$ whose winding number is $1$ on $K$ and $0$ outside $\Omega$. Integration sums the segment integrals. Such contours exist and give the Cauchy formula for every function holomorphic on $\Omega$. Neither the sets nor the contour need be connected.`,
      idea: String.raw`Cover $K$ by finitely many sufficiently small grid squares contained in $\Omega$ and cancel their shared oriented edges. The remaining edges have the required winding numbers.`,
      deps: ['rca-13.5'], tags: ['contours', 'functional calculus'], },
    {
      num: '10.24',
      kind: 'Lemma',
      name: 'Cauchy integrals of the resolvent give powers of x',
      statement: String.raw`Let $x\in A$, $\alpha\notin\sigma(x)$, and let $\Gamma$ surround $\sigma(x)$ in $\C\setminus\{\alpha\}$ as in10.23. For every integer $n$,
$$\frac1{2\pi i}\int_\Gamma(\alpha-\lambda)^n(\lambda e-x)^{-1}\,d\lambda=(\alpha e-x)^n.$$
In particular, integrating $\lambda^n$ around the spectrum gives $x^n$ for $n\ge0$.`,
      idea: String.raw`The resolvent identity gives a recurrence between the integrals for exponents $n$ and $n+1$. The exponent-zero integral is $e$, by the Neumann series on a large circle and contour deformation. The recurrence then works in both directions because $\alpha e-x$ is invertible.`,
      caption: String.raw`$x$ is a $3\times3$ matrix with eigenvalues $\lambda_1,\lambda_2,\lambda_3$ (drag them) — a similarity hides its triangular form. Drag the contour circle and change its radius and the power $n$. The integral is computed with $192$ nodes. If the circle encloses the whole spectrum, the result is $x^n$ to rounding error. If it encloses only part of it, you get $x^nP$ instead, where $P$ is the Riesz projection onto the enclosed eigenvalues — the readout reports both comparisons and $\operatorname{tr}P$ = the number enclosed.`,
      deps: ['fa-10.22', 'fa-10.23', 'fa-10.13'],
      tags: ['Banach algebras', 'Cauchy integrals'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('power $n$', 0, 5, 2, { int: true });
        const rS = v.slider('radius of the contour', 0.2, 2.2, 1.6, { step: 0.01 });
        const S = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 360, axes: true, title: 'spectrum and the contour $\\Gamma$' });
        const H = [[0.9, 0.4], [-0.6, 0.7], [0.1, -0.9]].map(([a, b], k) => S.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        const hc = S.handle(0, 0, { color: 'purple', r: 6, label: 'centre', labelPos: 's' });
        let st = {};
        v.legend([['red', 'eigenvalues (red: enclosed, grey: outside)'], ['purple', '$\\Gamma$']]);
        v.render(() => {
          const l = H.map((h) => [h.x, h.y]), X = conj3(tri3(l, 1)), n = nS.value, r = rS.value, c = [hc.x, hc.y];
          const inside = l.map((z) => cabs(csub(z, c)) < r);
          const tooClose = l.some((z) => Math.abs(cabs(csub(z, c)) - r) < 0.05);
          S.circle(c[0], c[1], r, { color: tooClose ? 'red' : 'purple', width: 2.4, fill: 'purple', fillAlpha: 0.06 });
          H.forEach((h, k) => { h.color = inside[k] ? 'red' : 'muted'; });
          if (tooClose) { S.corner('Γ passes through the spectrum', 'tl', { color: 'red', weight: 600 }); st = { bad: true }; return; }
          const I = cauchy((z) => { let p = [1, 0]; for (let k = 0; k < n; k++) p = cmul(p, z); return p; }, X, [[c, r]]);
          const P = cauchy(() => [1, 0], X, [[c, r]]);
          let Xn = ident(3); for (let k = 0; k < n; k++) Xn = mmul(Xn, X);
          const e1 = fro(msub(I, Xn)) / Math.max(fro(Xn), 1e-12), e2 = fro(msub(I, mmul(Xn, P))) / Math.max(fro(Xn), 1e-12);
          const tr = cadd(cadd(P[0][0], P[1][1]), P[2][2]);
          st = { bad: false, e1, e2, tr, cnt: inside.filter(Boolean).length, n };
        });
        v.readout(() => {
          const s = st; if (s.bad) return 'Move the contour off the eigenvalues.';
          return `Encloses ${s.cnt} of 3 eigenvalues; $\\operatorname{tr}P = ${v.fix(s.tr[0], 6)}$. Relative errors: $\\|\\tfrac1{2\\pi i}\\oint\\lambda^{${s.n}}R(\\lambda)d\\lambda-x^{${s.n}}\\| = ${v.sci(s.e1 + 1e-17, 1)}$, $\\;\\|\\cdots-x^{${s.n}}P\\| = ${v.sci(s.e2 + 1e-17, 1)}$.`;
        });
      },
    },
    {
      num: '10.26',
      kind: 'Definition',
      name: 'The holomorphic functional calculus f ↦ f̃(x)',
      statement: String.raw`Let $\Omega\subset\C$ be open and $A_\Omega=\{x\in A:\sigma(x)\subset\Omega\}$. For $f\in H(\Omega)$ and $x\in A_\Omega$ define
$$\tilde f(x)=\frac1{2\pi i}\int_\Gamma f(\lambda)\,(\lambda e-x)^{-1}\,d\lambda ,$$
where $\Gamma$ is any cycle in $\Omega\setminus\sigma(x)$ with $\operatorname{Ind}_\Gamma(\lambda)=1$ on $\sigma(x)$ and $0$ off $\Omega$. By Cauchy's theorem the value does not depend on $\Gamma$; by10.25 it agrees with $p(x)$ when $f=p$ is a polynomial, and with $(\alpha e-x)^{-1}$ when $f(\lambda)=(\alpha-\lambda)^{-1}$.`,
      idea: String.raw`The formula is Cauchy's integral formula $f(\mu)=\frac1{2\pi i}\int_\Gamma f(\lambda)(\lambda-\mu)^{-1}d\lambda$ with the scalar $\mu$ replaced by the element $x$. Such cycles always exist (RCA 13.5), and two admissible cycles are homologous in $\Omega\setminus\sigma(x)$, so they give the same integral of the holomorphic $A$-valued integrand.`,
      deps: ['fa-10.25', 'fa-10.22', 'fa-10.20'],
      tags: ['Banach algebras', 'functional calculus'],
      },
    {
      num: '10.27',
      kind: 'Theorem',
      name: 'The functional calculus is an algebra isomorphism',
      statement: String.raw`For $A_\Omega=\{x:\sigma(x)\subset\Omega\}$, the collection $H(A_\Omega)=\{\tilde f:f\in H(\Omega)\}$ is a complex algebra. The map $f\mapsto\tilde f$ is an algebra isomorphism onto it. Compact-uniform convergence $f_n\to f$ on $\Omega$ implies $\tilde f_n(x)\to\tilde f(x)$ for each $x\in A_\Omega$. The functions $\lambda\mapsto\lambda$ and $\lambda\mapsto1$ extend to $x\mapsto x$ and $x\mapsto e$.`,
      idea: String.raw`Continuity: $\norm{\tilde f(x)}\le\frac{\ell(\Gamma)}{2\pi}\max_\Gamma|f|\cdot\max_\Gamma\norm{(\lambda e-x)^{-1}}$. Multiplicativity holds for rational functions with poles off $\Omega$ (they are handled by10.25 and the resolvent identity), and Runge's theorem (RCA 13.9) makes rational functions dense in $H(\Omega)$; continuity extends the identity. Injectivity follows by evaluation at scalar elements: $\tilde f(ae)=f(a)e$.`,
      caption: String.raw`A $3\times3$ matrix $x$ (drag its eigenvalues); the contour is a union of small circles around the spectrum. Left: the spectrum and the contour. Right: the Taylor polynomials $p_N$ of $e^\lambda$ converge to $e^\lambda$ uniformly on the contour (green, sampled contour error), and correspondingly $p_N(x)\to\widetilde{\exp}(x)$ (purple dots) — continuity of the calculus. The readout checks multiplicativity, $\widetilde{(fg)}(x)=\tilde f(x)\tilde g(x)$, for $f=e^\lambda$ and $g=\sin\lambda$, with all three computed as contour integrals.`,
      deps: ['fa-10.26', 'fa-10.25', 'rca-13.9'],
      tags: ['Banach algebras', 'functional calculus'],
      viz(v) {
        const M = v.M;
        const kS = v.slider('non-normal part $k$', 0, 2, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 330, axes: true, title: 'spectrum and contour' });
        const R = v.stage({ x: [0, 25], y: [-16, 2], height: 330, axes: 'box', xlabel: 'N', title: 'errors of the Taylor polynomials $p_N$ of $e^\\lambda$ (log)' });
        const H = [[1.1, 0.5], [-0.9, 0.6], [0.2, -1]].map(([a, b], k) => L.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        let st = {};
        v.legend([['green', '$\\max_\\Gamma|p_N-e^\\lambda|$'], ['purple', '$\\|p_N(x)-\\widetilde{\\exp}(x)\\|$', { dot: true }]]);
        v.render(() => {
          const l = H.map((h) => [h.x, h.y]), X = conj3(tri3(l, kS.value));
          const circ = smallCircles(l);
          circ.forEach(([c, r]) => L.circle(c[0], c[1], r, { color: 'purple', width: 2 }));
          const E = cauchy(cexp, X, circ), Sn = cauchy(csin, X, circ), ES = cauchy((z) => cmul(cexp(z), csin(z)), X, circ);
          const mult = fro(msub(ES, mmul(E, Sn))) / fro(ES);
          // Taylor polynomials
          const nodes = []; circ.forEach(([c, r]) => { for (let k = 0; k < 64; k++) { const t = 2 * Math.PI * k / 64; nodes.push(cadd(c, [r * Math.cos(t), r * Math.sin(t)])); } });
          const scal = [], mat = []; let P = zeros(3), Xp = ident(3), fact = 1;
          const pN = nodes.map(() => [0, 0]), zp = nodes.map(() => [1, 0]);
          for (let N = 0; N <= 24; N++) {
            if (N > 0) { fact *= N; Xp = mmul(Xp, X); nodes.forEach((z, i) => { zp[i] = cmul(zp[i], z); }); }
            P = madd(P, mscale(Xp, [1 / fact, 0]));
            nodes.forEach((z, i) => { pN[i] = cadd(pN[i], cscale(zp[i], 1 / fact)); });
            scal.push([N, Math.log10(Math.max(...nodes.map((z, i) => cabs(csub(pN[i], cexp(z))))) + 1e-300)]);
            mat.push([N, Math.log10(fro(msub(P, E)) + 1e-300)]);
          }
          R.setTicks(null, [0, -4, -8, -12, -16].map((k) => [k, p10(k)]));
          R.path(scal, { color: 'green', width: 2.2 });
          R.dots(mat, { color: 'purple', r: 3.6 });
          st = { mult, last: mat[24][1] };
        });
        v.readout(() => `$\\|\\widetilde{(e^\\lambda\\sin\\lambda)}(x)-\\widetilde{\\exp}(x)\\,\\widetilde{\\sin}(x)\\|/\\|\\cdot\\| = ${v.sci(st.mult + 1e-17, 1)}$: multiplicative. Taylor polynomials: $\\|p_{24}(x)-\\widetilde{\\exp}(x)\\| = 10^{${v.fix(st.last, 1)}}$.`);
      },
    },
    {
      num: '10.28',
      kind: 'Theorem',
      name: 'Spectral mapping theorem',
      statement: String.raw`Suppose $x\in A_\Omega$ and $f\in H(\Omega)$. Then
(a) $\tilde f(x)$ is invertible in $A$ if and only if $f(\lambda)\ne0$ for every $\lambda\in\sigma(x)$;
(b) $\sigma(\tilde f(x))=f(\sigma(x))$.`,
      idea: String.raw`(a) If $f$ has no zero on $\sigma(x)$, then $1/f$ is holomorphic on a neighbourhood of $\sigma(x)$ and $\widetilde{(1/f)}(x)$ is the inverse, by 10.27. If $f(\alpha)=0$ for some $\alpha\in\sigma(x)$, write $f(\lambda)=(\alpha-\lambda)g(\lambda)$; then $\tilde f(x)=(\alpha e-x)\tilde g(x)=\tilde g(x)(\alpha e-x)$, and a commuting product with a non-invertible factor is not invertible. (b) Apply (a) to $f-\mu$: $\mu\in\sigma(\tilde f(x))$ iff $f-\mu$ vanishes somewhere on $\sigma(x)$.`,
      caption: String.raw`Left: the spectrum of a $3\times3$ matrix $x$ (drag the eigenvalues) and the contour. Right: the predicted spectrum $f(\sigma(x))$ (rings) and the spectrum of $\tilde f(x)$ computed from the contour integral (dots) — they coincide. Choose $f$: $e^\lambda$, $\lambda^2$ (which can merge two eigenvalues), $\sin\lambda$, or $1/(\lambda-c)$ with a pole $c$ you can drag: as $c$ approaches the spectrum, $\tilde f(x)=(x-ce)^{-1}$ blows up, and if $c\in\sigma(x)$ the function is no longer holomorphic on a neighbourhood of $\sigma(x)$.`,
      deps: ['fa-10.27', 'fa-10.13'],
      see: ['rca-18.9'],
      tags: ['Banach algebras', 'functional calculus', 'spectrum'],
      viz(v) {
        const M = v.M;
        const F = {
          exp: { label: '$e^\\lambda$', f: cexp },
          sq: { label: '$\\lambda^2$', f: (z) => cmul(z, z) },
          sin: { label: '$\\sin\\lambda$', f: csin },
          rec: { label: '$1/(\\lambda-c)$', f: null },
        };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const L = v.stage({ x: [-2.2, 2.2], y: [-2, 2], equal: true, height: 330, axes: true, title: '$\\sigma(x)$ and the contour' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, axes: true, title: '$f(\\sigma(x))$ (rings) and $\\sigma(\\tilde f(x))$ (dots)' });
        const H = [[0.8, 0.5], [-0.8, 0.5], [0.3, -0.9]].map(([a, b], k) => L.handle(a, b, { color: 'red', r: 6, label: `λ${'₁₂₃'[k]}` }));
        const hc = L.handle(1.5, -1.2, { color: 'orange', r: 6, label: 'c' });
        let st = {};
        v.legend([['red', '$\\sigma(x)$'], ['purple', 'contour'], ['blue', '$f(\\sigma(x))$ predicted / computed']]);
        v.render(() => {
          const key = which.value, c = [hc.x, hc.y];
          hc.visible = key === 'rec';
          const f = key === 'rec' ? (z) => cdiv([1, 0], csub(z, c)) : F[key].f;
          const l = H.map((h) => [h.x, h.y]), X = conj3(tri3(l, 0.7));
          const circ = smallCircles(l, key === 'rec' ? [c] : []);
          circ.forEach(([z, r]) => L.circle(z[0], z[1], r, { color: 'purple', width: 2 }));
          if (key === 'rec') L.dot(c[0], c[1], { color: 'orange', r: 5 });
          const Y = cauchy(f, X, circ, 256);
          const D = mmul(mmul(SIM3I, Y), SIM3);           // = f̃(T), upper triangular: its diagonal is σ(f̃(x))
          const comp = [0, 1, 2].map((i) => D[i][i]), pred = l.map(f);
          const all = [...comp, ...pred].filter((z) => isFinite(z[0]));
          const m = Math.max(1.5, ...all.map((z) => Math.max(Math.abs(z[0]), Math.abs(z[1])))) * 1.2;
          R.setView([-m, m], [-m, m]);
          pred.forEach((z) => R.circle(z[0], z[1], m * 0.035, { color: 'blue', width: 2 }));
          comp.forEach((z) => R.dot(z[0], z[1], { color: 'blue', r: 3.5 }));
          const err = Math.max(...comp.map((z, i) => cabs(csub(z, pred[i]))));
          const dmin = key === 'rec' ? Math.min(...l.map((z) => cabs(csub(z, c)))) : Infinity;
          st = { err, pred, dmin, key, nY: fro(Y) };
        });
        v.readout(() => {
          const s = st;
          return `$f(\\sigma(x))=\\{${s.pred.map((z) => fmtC(v, z, 2)).join(',\\;')}\\}$; computed spectrum of $\\tilde f(x)$ agrees to $${v.sci(s.err + 1e-17, 1)}$.` + (s.key === 'rec' ? ` Distance from $c$ to $\\sigma(x)$: $${v.fix(s.dmin, 3)}$, $\\|(x-ce)^{-1}\\|_F = ${v.fix(s.nY, 2)}$.` : '');
        });
      },
    },
    {
      num: '10.29',
      kind: 'Theorem',
      name: 'Composition: (g∘f)~(x) = g̃(f̃(x))',
      statement: String.raw`Suppose $x\in A_\Omega$, $f\in H(\Omega)$, $\Omega_1$ is an open set containing $f(\sigma(x))$, $g\in H(\Omega_1)$, and $h=g\circ f$ on a neighbourhood of $\sigma(x)$ where this makes sense. Then $\tilde f(x)\in A_{\Omega_1}$ and
$$\tilde h(x)=\tilde g\big(\tilde f(x)\big).$$`,
      idea: String.raw`$\sigma(\tilde f(x))=f(\sigma(x))\subset\Omega_1$ by 10.28, so $\tilde g(\tilde f(x))$ is defined. For each $\mu$ on a contour around $f(\sigma(x))$, the function $\lambda\mapsto(\mu-f(\lambda))^{-1}$ is holomorphic near $\sigma(x)$, and by 10.27 its calculus is $(\mu e-\tilde f(x))^{-1}$. Insert this into the Cauchy integral for $\tilde g$ and exchange the order of integration (Fubini for the vector integrals).`,
      caption: String.raw`$x$ is a $2\times2$ matrix with eigenvalues $\lambda_1,\lambda_2$, $f=\exp$ and $g=\operatorname{Log}$, the principal logarithm (cut along $(-\infty,0]$). Left: $\lambda$-plane with the strip $|\operatorname{Im}\lambda|<\pi$; right: the $\mu$-plane with $e^{\sigma(x)}$, the cut, and the contour used for $\operatorname{Log}$. The readout computes $\widetilde{\operatorname{Log}}\big(\widetilde{\exp}(x)\big)$ and $\widetilde{(\operatorname{Log}\circ\exp)}(x)$ separately: they always agree. They equal $x$ only while both eigenvalues stay in the strip — drag one out and $\operatorname{Log}\circ\exp$ becomes $\lambda-2\pi i$ near it.`,
      deps: ['fa-10.28', 'fa-10.27'],
      tags: ['Banach algebras', 'functional calculus'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.5, 2.5], y: [-5, 5], equal: true, height: 360, axes: true, title: '$\\lambda$-plane' });
        const R = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, height: 360, axes: true, title: '$\\mu$-plane: $e^{\\sigma(x)}$ and the cut of Log' });
        const h1 = L.handle(0.3, 1.2, { color: 'red', label: 'λ₁' });
        const h2 = L.handle(-0.4, -2.2, { color: 'red', label: 'λ₂' });
        const V = [[[1, 0], [0.5, 0.2]], [[-0.3, 0], [1, 0]]], Vi = inv(V);
        let st = {};
        v.legend([['blue', 'strip $|\\operatorname{Im}\\lambda|<\\pi$', { area: true }], ['red', 'cut of Log'], ['purple', 'contours']]);
        v.render(() => {
          const l = [[h1.x, h1.y], [h2.x, h2.y]];
          const X = mmul(mmul(V, [[l[0], [0, 0]], [[0, 0], l[1]]]), Vi);
          L.hband(-Math.PI, Math.PI, { color: 'blue', alpha: 0.1, edges: true });
          R.line(-4, 0, 0, 0, { color: 'red', width: 3 });
          // contours around λ_k avoiding each other and the lines Im λ = π(2m+1)
          const circL = l.map((z, i) => { let r = 0.4; r = Math.min(r, cabs(csub(z, l[1 - i])) / 2.2); const d = Math.abs(((z[1] - Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI); r = Math.min(r, Math.abs(Math.PI - d) * 0.9); return [z, Math.max(r, 1e-3)]; });
          circL.forEach(([z, r]) => L.circle(z[0], z[1], r, { color: 'purple', width: 2 }));
          const mu = l.map(cexp);
          const circR = mu.map((w, i) => { let r = 0.6 * cabs(w); r = Math.min(r, cabs(csub(w, mu[1 - i])) / 2.2); if (w[0] < 0) r = Math.min(r, Math.abs(w[1]) * 0.9); return [w, Math.max(r, 1e-4)]; });
          mu.forEach((w) => R.dot(w[0], w[1], { color: 'blue', r: 5 }));
          circR.forEach(([w, r]) => R.circle(w[0], w[1], r, { color: 'purple', width: 2 }));
          const onCut = mu.some((w) => w[0] < 0 && Math.abs(w[1]) < 1e-3 * cabs(w)) || circL.some(([, r]) => r < 2e-3);
          if (onCut) { st = { bad: true }; return; }
          const Ex = cauchy(cexp, X, circL, 256);
          const lhs = cauchy(clog, Ex, circR, 256);
          const rhs = cauchy((z) => clog(cexp(z)), X, circL, 256);
          const inStrip = l.every((z) => Math.abs(z[1]) < Math.PI);
          st = { bad: false, agree: fro(msub(lhs, rhs)) / fro(rhs), toX: fro(msub(rhs, X)), inStrip };
        });
        v.readout(() => {
          const s = st; if (s.bad) return 'An eigenvalue has $e^\\lambda$ on the cut of Log — $g$ is not holomorphic near $f(\\sigma(x))$. Move it.';
          return `$\\|\\widetilde{\\operatorname{Log}}(\\widetilde{\\exp}(x))-\\widetilde{(\\operatorname{Log}\\circ\\exp)}(x)\\| = ${v.sci(s.agree + 1e-17, 1)}$ (relative). Distance to $x$: $${v.fix(s.toX, 4)}$` + (s.inStrip ? ' — both eigenvalues in the strip, so $\\operatorname{Log}(\\exp(x))=x$.' : ' — an eigenvalue left the strip: $\\operatorname{Log}\\circ\\exp\\ne\\mathrm{id}$ there.');
        });
      },
    },
    {
      num: '10.30',
      kind: 'Theorem',
      name: 'Logarithms and roots',
      statement: String.raw`Suppose $x\in A$ and $\sigma(x)$ does not separate $0$ from $\infty$ (that is, $0$ lies in the unbounded component of $\C\setminus\sigma(x)$). Then
(a) $x^{-1}$ is a limit of polynomials in $x$;
(b) $x=\exp(y)$ for some $y\in A$ (a logarithm of $x$), and
(c) $x$ has roots of every order: $x=z^n$ for some $z\in A$, for each positive integer $n$. If $\sigma(x)\subset(0,\infty)$, these roots can be chosen with spectrum in $(0,\infty)$.`,
      idea: String.raw`Let $\Omega$ be a simply connected neighbourhood of $\sigma(x)$ not containing $0$ — possible exactly because $0$ is in the unbounded component. On $\Omega$ there is a holomorphic logarithm $\log$, and Runge's theorem approximates $1/\lambda$ by polynomials uniformly near $\sigma(x)$. Then $y=\widetilde{\log}(x)$ satisfies $\exp(y)=x$ by 10.29, and $z=\exp(y/n)$ is an $n$-th root.`,
      caption: String.raw`$A=\ell^1(\Z)$ and $x=\hat x$ a trigonometric polynomial, so $\sigma(x)$ is the closed curve $\hat x(\T)$. Right: the continuous argument of $\hat x(e^{i\theta})$, unwrapped from $\theta=0$ to $2\pi$. It returns to its start exactly when the winding number about $0$ is $0$; then $y=\log|\hat x|+i\arg\hat x$ is a continuous logarithm, and the square root $e^{y/2}$ (dashed) is a closed curve. In a "figure eight" ($c_{-2}$ large compared with $c_1$) $0$ can sit inside a loop with total winding $0$: the theorem's hypothesis fails, yet a logarithm exists — the condition is sufficient, not necessary.`,
      deps: ['fa-10.29', 'fa-10.28', 'rca-13.9'],
      tags: ['Banach algebras', 'logarithms', 'winding number'],
      viz(v) {
        const M = v.M;
        const c1S = v.slider('$c_1$ (coefficient of $e^{i\\theta}$)', -1.5, 1.5, 1, { step: 0.01 });
        const cmS = v.slider('$c_{-2}$ (coefficient of $e^{-2i\\theta}$)', -1.5, 1.5, 0.35, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, height: 360, axes: true, title: '$\\sigma(x)=\\hat x(\\T)$ and $\\sigma(\\sqrt x)$' });
        const R = v.stage({ x: [0, 2 * Math.PI], y: [-8, 8], height: 360, axes: 'box', xticks: [[0, '0'], [Math.PI, 'π'], [2 * Math.PI, '2π']], xlabel: 'θ', title: 'continuous $\\arg\\hat x(e^{i\\theta})$' });
        const hc = L.handle(1.3, 0.2, { color: 'blue', label: 'c₀' });
        const N = 720;
        let st = {};
        v.legend([['blue', '$\\hat x(\\T)$'], ['purple', '$e^{y/2}$: a square root', { dash: true }], ['red', '$0$']]);
        v.render(() => {
          const c0 = [hc.x, hc.y], c1 = c1S.value, cm = cmS.value;
          const xh = (t) => cadd(cadd(c0, [c1 * Math.cos(t), c1 * Math.sin(t)]), [cm * Math.cos(-2 * t), cm * Math.sin(-2 * t)]);
          const pts = M.range(N + 1).map((k) => xh(2 * Math.PI * k / N));
          L.path(pts, { color: 'blue', width: 2.4 });
          L.dot(0, 0, { color: 'red', r: 5, label: '0', labelPos: 'sw' });
          // separation of 0 from ∞: flood fill on a grid
          const G = 160, lo = -3, hi = 3, cell = (hi - lo) / G, blocked = new Uint8Array(G * G);
          for (const p of pts) { const i = Math.floor((p[0] - lo) / cell), j = Math.floor((p[1] - lo) / cell); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < G && jj < G) blocked[jj * G + ii] = 1; } }
          const seen = new Uint8Array(G * G), q = [];
          for (let i = 0; i < G; i++) for (const j of [0, G - 1]) { for (const [a, b] of [[i, j], [j, i]]) { const k = b * G + a; if (!blocked[k] && !seen[k]) { seen[k] = 1; q.push(k); } } }
          while (q.length) { const k = q.pop(), a = k % G, b = (k - a) / G; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const na = a + da, nb = b + db; if (na < 0 || nb < 0 || na >= G || nb >= G) continue; const kk = nb * G + na; if (!blocked[kk] && !seen[kk]) { seen[kk] = 1; q.push(kk); } } }
          const k0 = Math.floor((0 - lo) / cell) * G + Math.floor((0 - lo) / cell);
          const separated = !seen[k0] && !blocked[k0];
          // unwrapped argument
          const args = []; let prev = Math.atan2(pts[0][1], pts[0][0]), acc = prev;
          for (let k = 0; k <= N; k++) { const a = Math.atan2(pts[k][1], pts[k][0]); let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; prev = a; args.push([2 * Math.PI * k / N, acc]); }
          const wind = Math.round((args[N][1] - args[0][1]) / (2 * Math.PI));
          const minAbs = Math.min(...pts.map(cabs));
          const onCurve = minAbs < 0.02;
          R.setView(null, [Math.min(-7, ...args.map((p) => p[1])) - 0.5, Math.max(7, ...args.map((p) => p[1])) + 0.5]);
          R.hline(args[0][1], { color: 'muted', width: 1, dash: [4, 4] });
          R.path(args, { color: wind === 0 ? 'green' : 'red', width: 2.4 });
          if (!onCurve) {
            const root = pts.map((p, k) => { const r = Math.sqrt(cabs(p)), a = args[k][1] / 2; return [r * Math.cos(a), r * Math.sin(a)]; });
            L.path(root, { color: 'purple', width: 2, dash: [6, 4] });
            if (wind !== 0) { L.dot(root[0][0], root[0][1], { color: 'purple', r: 4 }); L.dot(root[N][0], root[N][1], { color: 'purple', r: 4, hollow: true }); }
          }
          st = { wind, separated, onCurve };
        });
        v.readout(() => {
          const s = st;
          if (s.onCurve) return 'The sampled curve comes near $0$; move it away before interpreting winding.';
          const sep = s.separated ? 'The flood-fill sample suggests separation' : 'The flood-fill sample finds a route to infinity';
          if (s.wind !== 0) return `${sep}; sampled winding number $${s.wind}$. If the curve avoids zero, this forbids a logarithm. ` + (s.wind % 2 ? 'Odd winding also forbids a square root.' : 'Even winding permits a square root: the half-argument curve closes.');
          return `${sep}; winding number $0$: a continuous logarithm exists, hence $x=\\exp(y)$ and $\\sqrt x=\\exp(y/2)$.` + (s.separated ? ' Here the hypothesis of the theorem fails, but the conclusion still holds.' : '');
        });
      },
    },
    {
      num: '10.31', kind: 'Theorem', name: 'Polynomial identities reduce the functional calculus',
      statement: String.raw`Let $P(\lambda)=\prod_j(\lambda-a_j)^{m_j}$ have degree $n$, and suppose $P(x)=0$. Then $\sigma(x)\subset\{a_j\}$. For any $f$ holomorphic on an open neighborhood of these roots, there is a polynomial $Q$ of degree less than $n$ with $f-Q=Pg$ for a holomorphic $g$ on that neighborhood, and $\tilde f(x)=Q(x)$.`,
      idea: String.raw`Cancel the principal parts of $f/P$ at the roots of $P$. This produces the Hermite interpolation polynomial $Q$, matching derivatives through order $m_j-1$ at $a_j$. The algebra property gives $\tilde f(x)-Q(x)=P(x)\tilde g(x)=0$.`,
      caption: String.raw`A Jordan block $x=\mu I+kN$, $N^2=0$, satisfies $(x-\mu I)^2=0$. The exact Hermite polynomial for $f=\exp$ is $Q(\lambda)=e^\mu[1+(\lambda-\mu)]$. Compare its action on the draggable vector with a matrix exponential computed by its power series. Switch to values-only interpolation to see why the derivative condition matters when $k\ne0$.`,
      deps: ['fa-10.27', 'fa-10.28'], tags: ['functional calculus', 'Hermite interpolation'], viz: hermiteJordan,
    },
    {
      num: '10.31a',
      kind: 'Corollary',
      name: 'Disconnected spectrum gives idempotents',
      statement: String.raw`Suppose $x\in A$ and $\sigma(x)\subset\Omega_0\cup\Omega_1$, where $\Omega_0,\Omega_1$ are disjoint open sets that both meet $\sigma(x)$. Let $f=0$ on $\Omega_0$ and $f=1$ on $\Omega_1$. Then $e_1=\tilde f(x)$ satisfies
$$e_1^2=e_1,\qquad e_1x=xe_1,\qquad e_1\ne0,\ e_1\ne e,$$
so $A$ contains a nontrivial idempotent commuting with $x$ (the **Riesz projection**), and $\sigma(xe_1)$ relative to $e_1Ae_1$ is $\sigma(x)\cap\Omega_1$.`,
      idea: String.raw`$f$ is holomorphic on $\Omega=\Omega_0\cup\Omega_1$ and $f^2=f$, so $\tilde f(x)^2=\tilde f(x)$ by 10.27; it commutes with $x$ since $\lambda f$ and $f\lambda$ agree. By the spectral mapping theorem $\sigma(e_1)=f(\sigma(x))=\{0,1\}$, so $e_1$ is neither $0$ (spectrum $\{0\}$) nor $e$ (spectrum $\{1\}$).`,
      caption: String.raw`Exercise17 consequence: a real $2\times2$ matrix with distinct real eigenvalues $\lambda_1,\lambda_2$ (sliders) and eigen-directions at angles $\theta_1,\theta_2$. Bottom: the real axis with the spectrum and the contour circle (drag its centre, set its radius). Top: the plane on which $x$ acts. The Riesz projection $e_1=\frac1{2\pi i}\oint(\lambda e-x)^{-1}d\lambda$ is computed numerically; drag the vector $u$ to see $e_1u$ (green, along the enclosed eigen-direction) and $(e-e_1)u$ (orange) — an oblique projection. Enclose both eigenvalues or none to get $e$ or $0$.`,
      deps: ['fa-10.28', 'fa-10.27'],
      tags: ['Banach algebras', 'idempotents', 'Riesz projection'],
      viz(v) {
        const M = v.M;
        const l1S = v.slider('$\\lambda_1$', -2, 2, -0.8, { step: 0.01 });
        const l2S = v.slider('$\\lambda_2$', -2, 2, 1.1, { step: 0.01 });
        const t1S = v.slider('$\\theta_1$', 0, 180, 20, { step: 1 });
        const t2S = v.slider('$\\theta_2$', 0, 180, 110, { step: 1 });
        const rS = v.slider('contour radius', 0.1, 2.5, 0.6, { step: 0.01 });
        const P = v.stage({ x: [-2.5, 2.5], y: [-2, 2], equal: true, height: 300, axes: true, title: 'the plane: $u=e_1u+(e-e_1)u$' });
        const Ls = v.stage({ x: [-2.5, 2.5], y: [-1.2, 1.2], equal: true, height: 150, full: true, axes: true, title: '$\\lambda$-plane: $\\sigma(x)$ and the contour' });
        const hu = P.handle(1.2, 1.1, { color: 'blue', label: 'u' });
        const hc = Ls.handle(-0.6, 0, { color: 'purple', r: 6, label: 'centre', labelPos: 's' });
        let st = {};
        v.legend([['blue', '$u$'], ['green', '$e_1u$'], ['orange', '$(e-e_1)u$'], ['muted', 'eigen-directions', { dash: true }]]);
        v.render(() => {
          const l1 = l1S.value, l2 = l2S.value, a1 = t1S.value * Math.PI / 180, a2 = t2S.value * Math.PI / 180, r = rS.value, c = [hc.x, hc.y];
          const Vm = [[[Math.cos(a1), 0], [Math.cos(a2), 0]], [[Math.sin(a1), 0], [Math.sin(a2), 0]]];
          const degenerate = Math.abs(Math.sin(a2 - a1)) < 0.05 || Math.abs(l1 - l2) < 0.02;
          Ls.circle(c[0], c[1], r, { color: 'purple', width: 2.2, fill: 'purple', fillAlpha: 0.06 });
          Ls.dot(l1, 0, { color: 'red', r: 5, label: 'λ₁', labelPos: 'n' }); Ls.dot(l2, 0, { color: 'red', r: 5, label: 'λ₂', labelPos: 'n' });
          for (const a of [a1, a2]) P.line(-3 * Math.cos(a), -3 * Math.sin(a), 3 * Math.cos(a), 3 * Math.sin(a), { color: 'muted', width: 1.2, dash: [5, 4] });
          if (degenerate || [l1, l2].some((l) => Math.abs(Math.hypot(l - c[0], c[1]) - r) < 0.03)) { st = { bad: true }; return; }
          const X = mmul(mmul(Vm, [[[l1, 0], [0, 0]], [[0, 0], [l2, 0]]]), inv(Vm));
          const E = cauchy(() => [1, 0], X, [[c, r]], 256);
          const u = [hu.x, hu.y], Eu = [E[0][0][0] * u[0] + E[0][1][0] * u[1], E[1][0][0] * u[0] + E[1][1][0] * u[1]], Fu = [u[0] - Eu[0], u[1] - Eu[1]];
          P.arrow(0, 0, Eu[0], Eu[1], { color: 'green', width: 2.6 });
          P.arrow(Eu[0], Eu[1], u[0], u[1], { color: 'orange', width: 2.6 });
          P.arrow(0, 0, u[0], u[1], { color: 'blue', width: 1.6, alpha: 0.6 });
          const idem = fro(msub(mmul(E, E), E)), comm = fro(msub(mmul(E, X), mmul(X, E))), tr = E[0][0][0] + E[1][1][0];
          st = { bad: false, idem, comm, tr };
        });
        v.readout(() => {
          const s = st; if (s.bad) return 'Separate the eigenvalues and eigen-directions, and keep the contour off the spectrum.';
          const kind = Math.round(s.tr) === 0 ? '$e_1=0$ (nothing enclosed)' : Math.round(s.tr) === 2 ? '$e_1=e$ (everything enclosed)' : 'a nontrivial idempotent of rank $1$';
          return `$\\|e_1^2-e_1\\| = ${v.sci(s.idem + 1e-17, 1)}$, $\\;\\|e_1x-xe_1\\| = ${v.sci(s.comm + 1e-17, 1)}$, $\\;\\operatorname{tr}e_1 = ${v.fix(s.tr, 6)}$: ${kind}.`;
        });
      },
    },
  ],
};
