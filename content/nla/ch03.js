// Numerical Linear Algebra — Chapter 3: Conditioning, floating point and stability
// Part 1 (this file): 3.1–3.8 — condition numbers, the Hilbert matrix, Wilkinson's polynomial, floating-point numbers and the axiom,
// accuracy and backward stability. Part 2 (3.9–3.15) is in ch03-b.js.
import {
  nm, nmc, matT, vecT, sciT, dot, mv, mm, tp, len, TAU, svd22, colHandles, ellPts, arcPts,
  fl, arith, flSolve, flChol, flForward, flBack, flQRSolve, hilbert, hilbertInv, hilbertKappa, geomSigma, randQ, relErr, toyFloats, normV,
} from './ch03.shared.js';

// ---- 3.1 helpers: a few problems f : R² → R^k
const PROBLEMS = {
  sum: { f: (x) => [x[0] + x[1]], start: [1, -0.9] },
  prod: { f: (x) => [x[0] * x[1]], start: [1.5, 1.2] },
  root: { f: (x) => { const d = x[0] * x[0] - x[1]; return d < 0 ? null : [x[0] + Math.sqrt(d)]; }, start: [1, 0.95] },
  lines: { f: (x) => { const d = x[0] - x[1]; return Math.abs(d) < 1e-12 ? null : [1 / d, x[0] / d]; }, start: [1, 0.6] },
};
/** ‖J‖₂ of the Jacobian of f at x (central differences). */
function jacNorm(M, f, x) {
  const h = 1e-6 * Math.max(1, len(x)), cols = [0, 1].map((j) => {
    const xp = x.slice(), xm = x.slice(); xp[j] += h; xm[j] -= h;
    const a = f(xp), b = f(xm);
    return a && b ? a.map((t, i) => (t - b[i]) / (2 * h)) : null;
  });
  if (!cols[0] || !cols[1]) return NaN;
  return cols[0].length === 1 ? Math.hypot(cols[0][0], cols[1][0]) : M.svd(cols[0].map((_, i) => [cols[0][i], cols[1][i]])).S[0];
}

// ---- 3.5 helpers: Wilkinson's polynomial ∏(x − k), k = 1..20, perturbed by Σ t_j x^j
const WC = (() => {
  let c = [1n];
  for (let k = 1n; k <= 20n; k++) { const n = new Array(c.length + 1).fill(0n); c.forEach((a, i) => { n[i + 1] += a; n[i] -= k * a; }); c = n; }
  return c.map(Number); // ascending coefficients of the exact polynomial
})();
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
/** Perturbed polynomial in factored form plus the perturbation: ∏(z − k) + Σ t_j z^j (accurate near the roots, unlike a power-basis Horner sum). */
function wilkEval(z, t) {
  let p = [1, 0];
  for (let k = 1; k <= 20; k++) p = cmul(p, [z[0] - k, z[1]]);
  let zp = [1, 0];
  for (let k = 0; k <= 19; k++) { if (t[k]) { p[0] += t[k] * zp[0]; p[1] += t[k] * zp[1]; } zp = cmul(zp, z); }
  return p;
}
/** All 20 roots by the Durand–Kerner iteration (started near 1..20). */
function wilkRoots(t) {
  const z = Array.from({ length: 20 }, (_, i) => [i + 1 + 1e-3 * Math.cos(i), 1e-3 * Math.sin(3 * i + 1) + 1e-4]);
  let ok = false;
  for (let it = 0; it < 600; it++) {
    let mx = 0;
    for (let i = 0; i < 20; i++) {
      let d = [1, 0];
      for (let j = 0; j < 20; j++) if (j !== i) d = cmul(d, [z[i][0] - z[j][0], z[i][1] - z[j][1]]);
      const fv = wilkEval(z[i], t), den = d[0] * d[0] + d[1] * d[1];
      const q = [(fv[0] * d[0] + fv[1] * d[1]) / den, (fv[1] * d[0] - fv[0] * d[1]) / den];
      z[i] = [z[i][0] - q[0], z[i][1] - q[1]];
      mx = Math.max(mx, Math.hypot(q[0], q[1]));
    }
    if (mx < 1e-13) { ok = true; break; }
  }
  return { z, ok };
}
/** p'(k) for the unperturbed polynomial, k = 1..20: (−1)^(20−k) (k−1)! (20−k)!. */
const WDER = (k) => { let f = 1; for (let j = 1; j <= 20; j++) if (j !== k) f *= k - j; return f; };

export default {
  collection: 'nla',
  chapter: 3,
  title: 'Conditioning, floating point and stability',
  summary: String.raw`Two separate questions decide whether a computed answer can be trusted: how sensitive the problem is to perturbations (its condition number) and whether the algorithm behaves like an exact computation on slightly perturbed data (backward stability). Floating-point arithmetic commits a relative error of at most machine epsilon per operation, and a backward stable algorithm applied to a well-conditioned problem is accurate. Householder QR and back substitution are backward stable; solving least squares by the normal equations is not.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Condition number of a problem',
      statement: String.raw`A *problem* is a map $f:X\to Y$ between normed spaces, evaluated at data $x$. Its **relative condition number** at $x$ is
$$\kappa(x)=\lim_{\delta\to0}\ \sup_{\|\delta x\|\le\delta\|x\|}\ \frac{\|f(x+\delta x)-f(x)\|/\|f(x)\|}{\|\delta x\|/\|x\|},$$
the largest relative output change per unit of relative input change, for infinitesimal perturbations. If $f$ is differentiable with Jacobian $J(x)$ then $\kappa(x)=\|J(x)\|\,\|x\|/\|f(x)\|$. A problem is **well-conditioned** if $\kappa$ is small (say below $10^{2}$) and **ill-conditioned** if it is huge; $\kappa=\infty$ marks a problem with no stable answer (a double root, parallel lines).`,
      idea: String.raw`To first order $f(x+\delta x)-f(x)\approx J(x)\,\delta x$, and the largest value of $\|J\delta x\|$ over $\|\delta x\|\le\delta\|x\|$ is $\|J\|\,\delta\|x\|$ by the definition of the induced norm; dividing by $\|f(x)\|$ and by $\delta\|x\|/\|x\|$ gives the formula. Conditioning is a property of the *problem* alone, not of any algorithm that solves it; a subtraction of nearly equal numbers has a huge $\kappa$ because $\|J\|$ is moderate while $\|f(x)\|$ is tiny.`,
      caption: String.raw`Choose a problem. The blue cloud is $240$ perturbed copies of the input $x$ (gold handle, draggable) within relative distance $\rho$; the orange cloud is their images. The readout compares the exact $\kappa=\|J\|\|x\|/\|f(x)\|$ with the largest observed ratio of relative changes. Drag $x$ towards cancellation ($x_1\approx-x_2$ for the sum, $x_2\approx x_1^2$ for the root, $x_1\approx x_2$ for the lines) and the output cloud blows up relative to the input cloud. Make $\rho$ large and the estimate drifts from $\kappa$: the definition is a limit.`,
      deps: ['nla-1.4'],
      credit: 'Systematic theory of condition for general problems: J. R. Rice, 1966 (“A Theory of Condition”)',
      tags: ['conditioning', 'sensitivity'],
      refs: ['Trefethen–Bau Lec. 12'],
      viz(v) {
        const M = v.M, r = v.rng(11);
        const dirs = Array.from({ length: 240 }, () => { const a = TAU * r(), s = Math.sqrt(r()); return [s * Math.cos(a), s * Math.sin(a)]; });
        const sel = v.select('problem', [{ value: 'sum', label: '$x_1+x_2$' }, { value: 'prod', label: '$x_1x_2$' }, { value: 'root', label: 'root $t^2-2x_1t+x_2$' }, { value: 'lines', label: 'lines $y=x_1u,\\ y=x_2u+1$' }], 'sum', {
          onChange: (val) => h.set(...PROBLEMS[val].start),
        });
        const rho = v.slider('relative perturbation $\\rho$', 1e-4, 0.3, 0.03, { log: true, sig: 2 });
        const IN = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 300, minWidth: 240, title: 'input $x$ (drag the handle)' });
        const ZIN = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 300, minWidth: 240, title: 'input, magnified: perturbed copies of $x$' });
        const OUT = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 300, minWidth: 240, title: 'output $f$ of those copies' });
        const h = IN.handle(1, -0.9, { color: 'gold', label: 'x' });
        let st = null;
        v.render(() => {
          const P = PROBLEMS[sel.value], x = [h.x, h.y], f0 = P.f(x), rad = rho.value * len(x);
          IN.circle(x[0], x[1], Math.max(rad, 0.04), { fill: 'blue', fillAlpha: 0.15, color: 'blue', width: 1.2 });
          const pts = dirs.map((d) => [x[0] + rad * d[0], x[1] + rad * d[1]]);
          ZIN.setView([x[0] - 1.25 * rad, x[0] + 1.25 * rad], [x[1] - 1.25 * rad, x[1] + 1.25 * rad]);
          ZIN.circle(x[0], x[1], rad, { color: 'blue', width: 1.2, dash: true });
          ZIN.dots(pts, { color: 'blue', r: 2.3 });
          ZIN.dot(x[0], x[1], { color: 'gold', r: 5 });
          ZIN.corner(`window half-width ${v.fmt(1.25 * rad, 2)}`, 'bl', { color: 'muted' });
          if (!f0) { OUT.setView([-1, 1], [-1, 1]); OUT.text('no real answer at this x', 0, 0, { align: 'center', color: 'red', size: 15 }); st = { none: true }; return; }
          let best = 0, spread = 0;
          const outs = [];
          pts.forEach((q, i) => {
            const y = P.f(q); if (!y) return;
            outs.push([y, i]);
            const dy = Math.hypot(...y.map((t, k) => t - f0[k])), dx = Math.hypot(q[0] - x[0], q[1] - x[1]);
            if (dx > 0) best = Math.max(best, (dy / (len(f0) || 1e-300)) / (dx / len(x)));
            spread = Math.max(spread, dy);
          });
          const R = Math.max(spread * 1.25, 1e-9 * Math.max(1, len(f0)));
          OUT.setView([f0[0] - R, f0[0] + R], [(f0[1] ?? 0) - R, (f0[1] ?? 0) + R]);
          outs.forEach(([y, i]) => OUT.dot(y[0], y.length === 2 ? y[1] : (f0[1] ?? 0) + 0.85 * R * dirs[i][1], { color: 'orange', r: 2.3 }));
          OUT.dot(f0[0], f0.length === 2 ? f0[1] : 0, { color: 'gold', r: 6 });
          OUT.corner(`window half-width ${v.fmt(R, 2)}${f0.length === 1 ? ' (vertical: jitter only)' : ''}`, 'bl', { color: 'muted' });
          const kap = jacNorm(M, P.f, x) * len(x) / len(f0);
          st = { kap, est: best, outRel: spread / len(f0), f0, relIn: rho.value };
        });
        v.legend([['blue', 'perturbed inputs'], ['orange', 'their images'], ['gold', '$x$, $f(x)$']]);
        v.readout(() => !st ? '' : st.none ? 'The problem has no solution here (no real root, or parallel lines): $\\kappa=\\infty$ nearby.' : `$\\kappa=\\|J\\|\\|x\\|/\\|f(x)\\|=${nm(st.kap, 3)}$; largest observed ratio of relative changes $=${nm(st.est, 3)}$ (it approaches $\\kappa$ as $\\rho\\to0$).\nInput spread $\\le${nm(st.relIn * 100, 2)}\\%$ of $\\|x\\|$; output spread $\\le${nm(st.outRel * 100, 3)}\\%$ of $\\|f(x)\\|$.`);
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Condition number of a matrix κ(A) = σ₁/σₙ',
      statement: String.raw`For an invertible $A\in\mathbb C^{m\times m}$ the **condition number** (in the 2-norm) is
$$\kappa(A)=\|A\|_2\,\|A^{-1}\|_2=\frac{\sigma_1}{\sigma_m},$$
the ratio of the largest to the smallest singular value; $\kappa(A)=\infty$ for singular $A$. It is the condition number (3.1) of $x\mapsto Ax$ in the worst case over $x$, and of $b\mapsto A^{-1}b$ in the worst case over $b$; always $\kappa(A)\ge1$, with equality exactly for scalar multiples of unitary matrices. Moreover $1/\kappa(A)=\min\{\|\Delta A\|/\|A\|:\ A+\Delta A \text{ singular}\}$: $\kappa$ measures the relative distance to the nearest singular matrix.`,
      idea: String.raw`From the SVD, $\|A\|_2=\sigma_1$ and $\|A^{-1}\|_2=1/\sigma_m$ (1.7), so the two descriptions agree. For the map $x\mapsto Ax$ the Jacobian is $A$, so $\kappa=\|A\|\|x\|/\|Ax\|$, largest when $x$ is a right singular vector of $\sigma_m$ (where $\|Ax\|=\sigma_m\|x\|$). The distance statement is the Eckart–Young theorem: the closest singular matrix is $A-\sigma_mu_mv_m^{\top}$, at distance exactly $\sigma_m$.`,
      caption: String.raw`Drag the columns $a_1,a_2$ of a $2\times2$ matrix (right panel). The unit circle (left) is sent to the ellipse with semi-axes $\sigma_1,\sigma_2$ along the left singular vectors; $\kappa$ is the ratio of the axes. Push the columns together and the ellipse flattens, $\kappa\to\infty$. The hollow red points are the columns of the nearest singular matrix $A-\sigma_2f_2e_2^{\top}$: the distance to them, relative to $\|A\|$, is exactly $1/\kappa$.`,
      deps: ['nla-3.1', 'nla-1.7'],
      credit: 'The term and the formula ‖A‖‖A⁻¹‖: A. M. Turing, 1948 (the earliest use known to N. J. Higham); the ratio of extreme singular values already controls the error bounds of von Neumann and Goldstine, 1947',
      tags: ['conditioning', 'svd'],
      refs: ['Trefethen–Bau Lec. 12'],
      viz(v) {
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: true, height: 340, minWidth: 280, title: 'input: unit circle and right singular vectors' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 340, minWidth: 280, title: 'output: the image ellipse, columns $a_1,a_2$' });
        const H = colHandles(R, [[2.0, 1.1], [0.6, 1.2]], { grid: 0.05 });
        let st = null;
        v.render(() => {
          const A = H.A, S = svd22(A), [s1, s2] = S.s, kap = s2 > 1e-12 ? s1 / s2 : Infinity;
          L.path(ellPts([[1, 0], [0, 1]], 1), { color: 'muted', width: 1.4 });
          [0, 1].forEach((k) => L.arrow(0, 0, S.e[k][0], S.e[k][1], { color: ['red', 'green'][k], width: 2.4 }));
          L.tex('e_1', S.e[0][0] * 1.18, S.e[0][1] * 1.18, { color: 'red' }); L.tex('e_2', S.e[1][0] * 1.22, S.e[1][1] * 1.22, { color: 'green' });
          R.path(ellPts(A, 1), { color: 'accent', width: 2.2 });
          [0, 1].forEach((k) => R.arrow(0, 0, S.f[k][0] * S.s[k], S.f[k][1] * S.s[k], { color: ['red', 'green'][k], width: 2.4 }));
          R.tex('\\sigma_1f_1', S.f[0][0] * s1 * 1.1, S.f[0][1] * s1 * 1.1, { color: 'red', dy: -4 });
          if (s2 > 0.05) R.tex('\\sigma_2f_2', S.f[1][0] * s2 * 1.5, S.f[1][1] * s2 * 1.5, { color: 'green' });
          // nearest singular matrix B = A − σ₂ f₂ e₂ᵀ
          const B = A.map((row, i) => row.map((t, j) => t - s2 * S.f[1][i] * S.e[1][j]));
          [0, 1].forEach((j) => {
            R.line(A[0][j], A[1][j], B[0][j], B[1][j], { color: 'red', width: 1.4, dash: true });
            R.dot(B[0][j], B[1][j], { hollow: true, color: 'red', r: 5 });
          });
          st = { s1, s2, kap, rel: s1 > 0 ? s2 / s1 : 0, det: S.det, n1: len([A[0][0], A[1][0]]), n2: len([A[0][1], A[1][1]]) };
        });
        v.legend([['accent', '$A\\cdot$(unit circle)'], ['red', '$\\sigma_1$ direction'], ['green', '$\\sigma_2$ direction'], ['red', 'nearest singular matrix', { dot: true }]]);
        v.readout(() => st ? `$\\sigma_1=${nm(st.s1, 3)}$, $\\sigma_2=${nm(st.s2, 3)}$, so $\\kappa(A)=\\sigma_1/\\sigma_2=${isFinite(st.kap) ? nm(st.kap, 2) : '\\infty'}$ and $\\det A=${nm(st.det, 3)}$.\nDistance to the nearest singular matrix: $\\|\\Delta A\\|_2/\\|A\\|_2=\\sigma_2/\\sigma_1=${nm(st.rel, 4)}=1/\\kappa$.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Perturbation bound for linear systems',
      statement: String.raw`Let $A$ be invertible and $Ax=b$, $b\ne0$. If $b$ is replaced by $b+\delta b$, the solution changes by $\delta x=A^{-1}\delta b$ with
$$\frac{\|\delta x\|}{\|x\|}\le\kappa(A)\,\frac{\|\delta b\|}{\|b\|}.$$
If instead $A$ is replaced by $A+\delta A$ (with $\|\delta A\|\,\|A^{-1}\|<1$), then, to first order in $\|\delta A\|$,
$$\frac{\|\delta x\|}{\|x\|}\le\kappa(A)\,\frac{\|\delta A\|}{\|A\|}.$$
Both bounds are sharp: for suitable $b$ and $\delta b$ (or $\delta A$) equality holds.`,
      idea: String.raw`For $b$: $\|\delta x\|\le\|A^{-1}\|\|\delta b\|$ and $\|b\|=\|Ax\|\le\|A\|\|x\|$; multiply the two inequalities. Equality needs $x$ along the direction $A$ stretches most ($v_1$, so $\|b\|=\sigma_1\|x\|$) and $\delta b$ along the direction $A^{-1}$ stretches most ($u_m$). For $A$: subtracting $Ax=b$ from $(A+\delta A)(x+\delta x)=b$ gives $\delta x\approx-A^{-1}\delta A\,x$, whence the bound by the same two norm inequalities. This is 3.1 applied to $b\mapsto A^{-1}b$ and $A\mapsto A^{-1}b$, with $\kappa(A)$ from 3.2.`,
      caption: String.raw`Each blue dot is one random trial for a random $3\times3$ matrix with condition number $\kappa$ (slider): a random right-hand side $b$, a random perturbation (of $b$, or of $A$) of random relative size $\rho$. Horizontal: the bound $\kappa\rho$; vertical: the observed relative change in the solution. Every dot lies on or below the diagonal. Gold dots use the extremal choice ($b$ along $u_1$, perturbation along $u_m$): they sit exactly on it. Raise $\kappa$: typical random trials sit well below the bound, the worst case does not.`,
      deps: ['nla-3.2'],
      tags: ['conditioning', 'linear-systems'],
      refs: ['Trefethen–Bau Lec. 12'],
      viz(v) {
        const M = v.M, r0 = v.rng(21), U = randQ(M, r0, 3, 3), V = randQ(M, r0, 3, 3);
        const kap = v.slider('condition number $\\kappa(A)$', 1, 1e4, 100, { log: true, sig: 2 });
        const mode = v.select('perturb', [{ value: 'b', label: '$b$ (exact)' }, { value: 'A', label: '$A$ (first order)' }], 'b');
        let seed = 5;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [1e-9, 0.1], y: [1e-12, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'bound  κ(A)·(relative size of the perturbation)', ylabel: 'observed ‖δx‖/‖x‖', title: 'observed change against the theorem’s bound' });
        let st = null;
        v.render(() => {
          const k = kap.value, sg = geomSigma(3, k);
          const A = mm(U.map((row) => row.map((x, j) => x * sg[j])), tp(V)), Ai = M.inverse(A), r = v.rng(seed * 7919 + (mode.value === 'b' ? 1 : 2));
          const rnd3 = () => [r.normal(), r.normal(), r.normal()];
          const u = (j) => U.map((row) => row[j]), vv = (j) => V.map((row) => row[j]);
          const pts = [], worst = [];
          let maxR = 0;
          for (let i = 0; i < 160; i++) {
            const rho = 10 ** (-8 + 6 * r()) / k, b = rnd3();
            let ratio;
            if (mode.value === 'b') {
              const d = rnd3(), dn = rho * normV(b) / normV(d), db = d.map((t) => t * dn), x = mv(Ai, b);
              ratio = normV(mv(Ai, db)) / normV(x);
            } else {
              const G = [rnd3(), rnd3(), rnd3()], Gn = M.svd(G).S[0], dA = G.map((row) => row.map((t) => t * rho * sg[0] / Gn)), x = mv(Ai, b);
              const dx = M.solve(A.map((row, i2) => row.map((t, j) => t + dA[i2][j])), b).map((t, i2) => t - x[i2]);
              ratio = normV(dx) / normV(x);
            }
            pts.push([k * rho, ratio]); maxR = Math.max(maxR, ratio / (k * rho));
          }
          for (let i = 0; i < 24; i++) {
            const rho = 10 ** (-8 + 6 * (i / 23)) / k;
            let ratio;
            if (mode.value === 'b') {
              const b = u(0), x = mv(Ai, b), db = u(2).map((t) => t * rho), dx = mv(Ai, db);
              ratio = normV(dx) / normV(x);
            } else {
              const x = vv(0), b = mv(A, x), dA = u(2).map((t) => vv(0).map((s) => t * s * rho * sg[0]));
              const dx = M.solve(A.map((row, i2) => row.map((t, j) => t + dA[i2][j])), b).map((t, i2) => t - x[i2]);
              ratio = normV(dx) / normV(x);
            }
            worst.push([k * rho, ratio]);
          }
          S.path([[1e-9, 1e-9], [0.1, 0.1]], { color: 'ink', width: 1.6 });
          S.dots(pts, { color: 'blue', r: 2.6 });
          S.dots(worst, { color: 'gold', r: 3.6 });
          S.text('bound', 3e-3, 6e-3, { color: 'ink', size: 12 });
          st = { k, maxR, worstR: Math.max(...worst.map((p) => p[1] / p[0])), minR: Math.min(...worst.map((p) => p[1] / p[0])) };
        });
        v.legend([['ink', 'bound  $\\kappa\\rho$'], ['blue', 'random trials'], ['gold', 'extremal choice', { dot: true }]]);
        v.readout(() => st ? `$\\kappa(A)=${nm(st.k, 1)}$. Largest observed (relative change)/(bound) over 160 random trials: $${nm(st.maxR, 3)}\\le1$; for the extremal choice (gold) the ratio is $${nm(st.minR, 3)}$ to $${nm(st.worstR, 3)}$: the bound is sharp.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'The Hilbert matrix: extreme ill-conditioning',
      statement: String.raw`The $n\times n$ Hilbert matrix $H_n=\big(1/(i+j-1)\big)_{i,j=1}^n$ is symmetric positive definite and has an exact inverse with integer entries, yet its condition number grows exponentially: $\kappa_2(H_n)=O\big((1+\sqrt2)^{4n}/\sqrt n\big)$, i.e. a factor $\approx e^{3.5}\approx34$ per extra row. Already $\kappa_2(H_5)\approx4.8\times10^{5}$ and $\kappa_2(H_{10})\approx1.6\times10^{13}$. Consequently, in double precision (unit roundoff $\approx1.1\times10^{-16}$) a linear system $H_nx=b$ is solved with essentially no correct digits by $n\approx12$, by *any* algorithm, since the stored data $H_n$ and $b$ are already perturbed at the level $10^{-16}$.`,
      idea: String.raw`$H_n$ is the Gram matrix of the monomials $1,t,\dots,t^{n-1}$ in $L^2(0,1)$; these functions are almost linearly dependent, so some unit coefficient vector gives a function of tiny norm (a tiny $\sigma_n$), while $\sigma_1$ stays bounded (below $\pi$, by Hilbert's inequality). By the perturbation bound (3.3) a data error of relative size $\epsilon$ is amplified by up to $\kappa$. The picture computes $\kappa$ from the exact integer inverse and compares it with the observed error.`,
      caption: String.raw`Left: for $n=1,\dots,16$ the condition number $\kappa(H_n)$ (from the exact inverse), the line $\kappa\cdot\epsilon_{\rm machine}$, and the relative error of the computed solution of $H_nx=b$ with $b=H_n\mathbf 1$ (true solution all ones), by the chosen method and arithmetic. The error climbs with $\kappa$ and reaches $100\%$ (the red line) at an $n$ that you can read off for each arithmetic. Right: the error $\hat x_i-1$ of every component for the $n$ you choose. The fitted slope of $\log\kappa$ is printed below.`,
      deps: ['nla-3.3'],
      credit: 'The matrix: D. Hilbert, 1894 (Acta Math.); growth rate of κ as stated e.g. on the Hilbert-matrix article of Wikipedia (J. Todd, 1954, studied its condition)',
      tags: ['conditioning', 'hilbert-matrix'],
      refs: ['Golub–Van Loan ch. 2'],
      viz(v) {
        const M = v.M, N = 16;
        const kappas = Array.from({ length: N }, (_, i) => (i === 0 ? 1 : hilbertKappa(M, i + 1)));
        const meth = v.select('method', [{ value: 'lu', label: 'Gaussian elimination (pivoting)' }, { value: 'chol', label: 'Cholesky' }, { value: 'qr', label: 'Householder QR' }], 'lu');
        const prec = v.select('arithmetic', [{ value: 24, label: 'single (24 bit)' }, { value: 53, label: 'double (53 bit)' }], 53);
        const nn = v.slider('size $n$ in the right panel', 2, N, 8, { int: true });
        const cache = {};
        const solve = (n, m, p) => {
          const key = `${m}-${p}-${n}`;
          if (cache[key]) return cache[key];
          const H = hilbert(n), b = H.map((row) => row.reduce((s, t) => s + t, 0));
          let x = null;
          if (m === 'lu') x = flSolve(H, b, p);
          else if (m === 'qr') x = flQRSolve(H, b, p);
          else { const Lc = flChol(H, p); if (Lc) x = flBack(tp(Lc), flForward(Lc, b.map((t) => fl(t, p)), p), p); }
          return (cache[key] = x);
        };
        const L = v.stage({ x: [0.5, N + 0.5], y: [1e-18, 1e26], ylog: true, axes: 'box', gutter: true, height: 400, minWidth: 340, xlabel: 'order n', ylabel: '', title: 'condition number and error' });
        const R = v.stage({ x: [0.3, 16.7], y: [-1, 1], axes: 'box', gutter: true, height: 400, minWidth: 280, xlabel: 'component i', ylabel: 'computed − exact', title: 'error of each component of the computed solution' });
        let st = null;
        v.render(() => {
          const p = prec.value, m = meth.value, eps = 2 ** -p;
          L.path(kappas.map((k, i) => [i + 1, k]), { color: 'ink', width: 2 });
          L.dots(kappas.map((k, i) => [i + 1, k]), { color: 'ink', r: 3 });
                    L.path(kappas.map((k, i) => [i + 1, k * eps]), { color: 'purple', width: 1.8, dash: true });
          L.hline(1, { color: 'red', width: 1.4, dash: true });
          const errs = [];
          for (let n = 1; n <= N; n++) {
            const x = solve(n, m, p);
            errs.push(x ? [n, Math.max(1e-18, relErr(x, new Array(n).fill(1)))] : null);
          }
          const seg = errs.filter(Boolean);
          L.path(seg, { color: 'orange', width: 2.2 });
          L.dots(seg, { color: 'orange', r: 3.4 });
          const brk = errs.findIndex((e) => !e);
          if (brk >= 0) L.text('Cholesky breaks down from n = ' + (brk + 1), brk + 1, 3e-9, { color: 'red', size: 12 });
          L.text('κ(Hₙ)', 3, kappas[2] * 1000, { color: 'ink', size: 12 });
          L.text('κ·ε', 12.6, kappas[11] * eps * 60, { color: 'purple', size: 12 });
          L.text('relative error', 9.3, 1e-11, { color: 'orange', size: 12 });
          L.text('100% error', 2.4, 12, { color: 'red', size: 11 });
          const n = nn.value, x = solve(n, m, p);
          R.hline(0, { color: 'green', width: 2 });
          if (x) {
            const dev = x.map((t) => t - 1), mx = Math.max(1e-12, ...dev.map(Math.abs)) * 1.25;
            R.setView([0.3, 16.7], [-mx, mx]);
            dev.forEach((d, i) => R.line(i + 1, 0, i + 1, d, { color: 'orange', width: 3 }));
            R.dots(dev.map((d, i) => [i + 1, d]), { color: 'orange', r: 4.5 });
            R.corner(`vertical scale ±${v.fmt(mx, 2)} (exact value 1)`, 'tr', { color: 'muted' });
          } else { R.setView([0.3, 16.7], [-1, 1]); R.text('Cholesky breaks down: not numerically positive definite', 8.5, 0.3, { align: 'center', color: 'red', size: 13 }); }
          // slope of log κ for n ≥ 6
          const xs = [], ys = [];
          for (let i = 5; i < N; i++) { xs.push(i + 1); ys.push(Math.log(kappas[i])); }
          const lr = M.linreg(xs, ys);
          st = { n, kap: kappas[n - 1], x, slope: lr.slope, err: x ? relErr(x, new Array(n).fill(1)) : NaN, eps };
        });
        v.legend([['ink', '$\\kappa(H_n)$'], ['purple', '$\\kappa\\,\\epsilon_{\\rm machine}$', { dash: true }], ['orange', 'relative error'], ['red', '100% error', { dash: true }], ['green', 'exact solution']]);
        v.readout(() => st ? `$n=${st.n}$: $\\kappa(H_n)=${sciT(st.kap)}$, $\\kappa\\epsilon_{\\rm machine}=${sciT(st.kap * st.eps)}$, observed relative error $=${isFinite(st.err) ? sciT(st.err) : '\\text{breakdown}'}$.\nSlope of $\\ln\\kappa(H_n)$ against $n$ (for $n\\ge6$): $${nm(st.slope, 3)}$ — compare $4\\ln(1+\\sqrt2)=${nm(4 * Math.log(1 + Math.SQRT2), 3)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Phenomenon',
      name: 'Wilkinson’s polynomial: sensitive roots',
      statement: String.raw`The polynomial $w(x)=\prod_{k=1}^{20}(x-k)=x^{20}-210x^{19}+\cdots+20!$ has twenty well-separated integer roots, yet they are extremely sensitive to its coefficients. Changing the coefficient $-210$ of $x^{19}$ by $-2^{-23}\approx-1.2\times10^{-7}$ (a relative change of $5.7\times10^{-10}$) moves the roots to, among others, $20.847$ and the five complex pairs $10.095\pm0.644i$, $11.794\pm1.652i$, $13.992\pm2.519i$, $16.731\pm2.813i$, $19.502\pm1.940i$. To first order, root $k$ moves by $-\delta a_j\,k^j/w'(k)$ when the coefficient $a_j$ changes by $\delta a_j$, and $|w'(k)|=(k-1)!\,(20-k)!$ is tiny compared with $k^{19}$ for $k$ near $15$–$20$. So *finding roots* of a polynomial from its coefficients is ill-conditioned even when the roots are well separated.`,
      idea: String.raw`Differentiate $w(\alpha(t))+t\,x^{j}\big|_{x=\alpha}=0$ implicitly: $\alpha'(0)=-\alpha^{j}/w'(\alpha)$. The coefficients of $w$ have wildly varying size ($20!\approx2.4\times10^{18}$) and the root condition number $\sum_j|a_j|\,k^{\,j-1}/|w'(k)|$ is astronomically large for $k\approx15$: a *problem* (3.1) whose conditioning has nothing to do with an algorithm. The picture finds the roots of the exact perturbed polynomial (a Durand–Kerner iteration on the factored form $\prod(x-k)+\sum t_jx^j$, so no rounding enters) and also draws the first-order prediction, which fails once the roots collide.`,
      caption: String.raw`Dots: the 20 roots of the perturbed polynomial in the complex plane (rings: the true roots $1,\dots,20$). First mode: Wilkinson's perturbation of the $x^{19}$ coefficient only — the slider scales it from $0$ to a few times $2^{-23}$; the roots near $14$–$20$ fly off the axis and pair up as complex conjugates while $1,\dots,5$ barely move. Second mode: every coefficient is multiplied by $1+\delta\,\xi_j$ with random $\xi_j$ (resample for other draws). Lower panel: actual displacement of each root against the first-order prediction $|\sum_j t_j k^j/w'(k)|$; the two agree for tiny perturbations (slide the size down) and part company when the roots collide.`,
      deps: ['nla-3.1'],
      credit: 'J. H. Wilkinson, 1959 (“The evaluation of the zeros of ill-conditioned polynomials”, Numer. Math. 1: 150–166); the polynomial became famous through his 1963 book Rounding Errors in Algebraic Processes',
      tags: ['conditioning', 'polynomials', 'roots'],
      refs: ['Trefethen–Bau Lec. 12'],
      viz(v) {
        const mode = v.select('perturb', [{ value: 'wilk', label: 'coefficient of $x^{19}$ only' }, { value: 'rand', label: 'all coefficients, random' }], 'wilk');
        const sw = v.slider('size of the $x^{19}$ change, units of $2^{-23}$', 0.001, 4, 1, { log: true, sig: 2 });
        const sr = v.slider('relative size $\\delta$ of each coefficient change', 1e-14, 1e-7, 1e-10, { log: true, sig: 2 });
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const syncVis = () => { sw.el.hidden = mode.value !== 'wilk'; sr.el.hidden = mode.value !== 'rand'; };
        const P = v.stage({ x: [0, 22], y: [-5, 5], equal: true, axes: 'box', gutter: true, height: 320, full: true, xlabel: 'Re', ylabel: 'Im', title: 'roots of the perturbed polynomial in $\\mathbb C$' });
        const D = v.stage({ x: [0.5, 20.5], y: [1e-15, 1e4], ylog: true, axes: 'box', gutter: true, height: 260, full: true, xlabel: 'root k', ylabel: 'displacement |Δα|', title: 'displacement of root $k$: actual vs first-order prediction' });
        let st = null;
        v.render(() => {
          syncVis();
          const t = new Array(20).fill(0);
          if (mode.value === 'wilk') t[19] = -(2 ** -23) * sw.value;
          else { const r = v.rng(seed * 101); for (let j = 0; j < 20; j++) t[j] = sr.value * r.normal() * WC[j]; }
          const { z, ok } = wilkRoots(t);
          // match computed roots to k = 1..20 by greedy nearest assignment
          const free = new Set(z.map((_, i) => i)), asg = new Array(21);
          const pairs = [];
          for (let k = 1; k <= 20; k++) z.forEach((q, i) => pairs.push([Math.hypot(q[0] - k, q[1]), k, i]));
          pairs.sort((a, b) => a[0] - b[0]);
          const usedK = new Set();
          for (const [, k, i] of pairs) if (!usedK.has(k) && free.has(i)) { asg[k] = z[i]; usedK.add(k); free.delete(i); }
          for (let k = 1; k <= 20; k++) P.dot(k, 0, { hollow: true, color: 'muted', r: 6 });
          let maxD = 0, ncomplex = 0;
          for (let k = 1; k <= 20; k++) {
            const q = asg[k], d = Math.hypot(q[0] - k, q[1]);
            maxD = Math.max(maxD, d);
            if (Math.abs(q[1]) > 1e-6 * Math.max(1, Math.abs(q[0]))) ncomplex++;
            P.line(k, 0, q[0], q[1], { color: 'faint', width: 1 });
            P.dot(q[0], q[1], { color: Math.abs(q[1]) > 1e-6 ? 'red' : 'blue', r: 4.5 });
            // first-order prediction
            let s = 0; for (let j = 0; j < 20; j++) s += t[j] * k ** j;
            const pred = Math.abs(s / WDER(k)), act = Math.max(1e-15, d);
            D.dot(k, act, { color: 'orange', r: 5 });
            D.dot(k, Math.max(1e-15, pred), { hollow: true, color: 'ink', r: 7 });
          }
          st = { ok, maxD, ncomplex, k20: asg[20], t19: t[19] };
        });
        v.legend([['muted', 'true roots $1..20$', { dot: true }], ['blue', 'real computed roots', { dot: true }], ['red', 'complex computed roots', { dot: true }], ['orange', 'actual displacement', { dot: true }], ['ink', 'first-order prediction', { dot: true }]]);
        v.readout(() => st ? `Largest root displacement $${nm(st.maxD, 3)}$; roots that left the real axis: $${st.ncomplex}$ of $20$. The root near $20$ is at $${nm(st.k20[0], 4)}${Math.abs(st.k20[1]) > 1e-6 ? `\\pm${nm(Math.abs(st.k20[1]), 3)}i` : ''}$.${st.ok ? '' : '\nThe root-finding iteration did not fully converge for this perturbation.'}` : '');
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Floating-point numbers and machine epsilon',
      statement: String.raw`A **floating-point number system** with $p$ significant bits is the set $\mathbb F=\{0\}\cup\{\pm(1+k2^{1-p})\,2^{e}:\ 0\le k<2^{p-1},\ e\in\mathbb Z\ (\text{within the exponent range})\}$. The numbers are spaced $2^{e+1-p}$ apart in $[2^e,2^{e+1})$: the *absolute* gaps double at each power of $2$ while the *relative* gap stays between $2^{-p}$ and $2^{1-p}$. Rounding to the nearest element of $\mathbb F$ gives $|\mathrm{fl}(x)-x|\le\epsilon_{\rm machine}|x|$ with the **machine epsilon** (unit roundoff) $\epsilon_{\rm machine}=2^{-p}$. IEEE 754 double precision has $p=53$, so $\epsilon_{\rm machine}=2^{-53}\approx1.11\times10^{-16}$ (single: $p=24$, $2^{-24}\approx5.96\times10^{-8}$). *Convention:* many languages report instead the gap between $1$ and the next float, $2\epsilon_{\rm machine}=2^{1-p}$ (MATLAB \`eps\` $=2^{-52}$); the two differ by a factor $2$.`,
      idea: String.raw`In each binade $[2^e,2^{e+1})$ there are exactly $2^{p-1}$ equally spaced numbers, so the gap is $2^{e+1-p}$. Relative to a point $x\in[2^e,2^{e+1})$ it is $2^{e+1-p}/x\in(2^{-p},2^{1-p}]$. Rounding moves $x$ by at most half a gap, hence a relative error of at most $2^{-p}$: the bound is attained just above a power of two and is a factor $2$ better just below the next one, the sawtooth in the picture. Everything in the rest of the chapter rests on this one inequality (3.7).`,
      caption: String.raw`Top: all positive numbers of a toy system with $p$ bits (exponent unlimited, no subnormals) on a number line; orange ticks are the powers of $2$. Drag the gold handle $x$: the green mark is $\mathrm{fl}(x)$. Bottom: the relative gap between neighbours (blue steps) and the relative rounding error $|\mathrm{fl}(x)-x|/|x|$ (orange), in units of $\epsilon_{\rm machine}$: the error never exceeds $1$ and the relative gap never exceeds $2$, whatever the binade. Increase $p$ and both shrink as $2^{-p}$.`,
      deps: [],
      credit: 'IEEE 754 standard for binary floating-point arithmetic (first published 1985)',
      tags: ['floating-point', 'rounding'],
      refs: ['Trefethen–Bau Lec. 13'],
      viz(v) {
        const pb = v.select('significand bits $p$', [3, 4, 5, 6].map((t) => ({ value: t, label: String(t) })), 4);
        const A = v.stage({ x: [0, 16.6], y: [-1.5, 1.5], axes: false, height: 220, full: true, title: 'the floating-point numbers on the line' });
        const B = v.stage({ x: [0.5, 16], y: [0, 2.5], xlog: true, axes: 'box', gutter: true, height: 300, full: true, xlabel: 'x', ylabel: 'in units of ε', title: 'relative gap and relative rounding error' });
        const h = A.handle(5.3, 0, { color: 'gold', label: 'x', constrain: (x) => [Math.max(0.55, Math.min(15.9, x)), 0] });
        let st = null;
        v.render(() => {
          const p = pb.value, eps = 2 ** -p, F = toyFloats(p, 0.5, 16);
          F.forEach((x) => { const pw = Math.abs(Math.log2(x) - Math.round(Math.log2(x))) < 1e-12; A.line(x, -0.45, x, pw ? 0.9 : 0.45, { color: pw ? 'orange' : 'blue', width: pw ? 2.4 : 1.4 }); });
          [0.5, 1, 2, 4, 8, 16].forEach((x) => A.text(String(x), x, -0.95, { align: 'center', color: 'orange', size: 12 }));
          const x = h.x, fx = fl(x, p);
          A.line(x, 0, fx, 0, { color: 'green', width: 3 });
          A.dot(fx, 0.0, { color: 'green', r: 5 });
          A.text('fl(x)', fx, 1.2, { align: 'center', color: 'green', size: 12 });
          // relative gaps
          const gp = [];
          for (let i = 0; i + 1 < F.length; i++) gp.push([F[i], (F[i + 1] - F[i]) / F[i] / eps]);
          gp.forEach(([a, g], i) => B.line(a, g, F[i + 1], g, { color: 'blue', width: 2 }));
          B.dots(gp.map((q) => [q[0], q[1]]), { color: 'blue', r: 2.5 });
          const err = [];
          for (let k = 0; k <= 600; k++) { const xx = 0.5 * 32 ** (k / 600); err.push([xx, Math.abs(fl(xx, p) - xx) / xx / eps]); }
          B.path(err, { color: 'orange', width: 1.4 });
          B.hline(1, { color: 'green', dash: true, width: 1.2 }); B.hline(2, { color: 'red', dash: true, width: 1.2 });
          B.text('rounding error ≤ ε', 0.62, 1.08, { color: 'green', size: 12 }); B.text('relative gap ≤ 2ε', 0.62, 2.1, { color: 'red', size: 12 });
          const e = Math.floor(Math.log2(x));
          st = { p, eps, x, fx, gap: 2 ** (e + 1 - p), rel: Math.abs(fx - x) / x, count: F.length };
        });
        v.legend([['blue', 'floating-point numbers / relative gap'], ['orange', 'powers of 2 / rounding error'], ['green', 'fl(x)']]);
        v.readout(() => st ? `$p=${st.p}$: $\\epsilon_{\\rm machine}=2^{-${st.p}}=${nm(st.eps, 5)}$; gap at $x$: $${nm(st.gap, 5)}$; $x=${nm(st.x, 4)}\\mapsto\\mathrm{fl}(x)=${nm(st.fx, 5)}$, relative error $${nm(st.rel / st.eps, 3)}\\,\\epsilon_{\\rm machine}\\ (\\le1)$.\nReal formats: double $p=53$, $\\epsilon_{\\rm machine}=${nm(2 ** -53 * 1e16, 3)}\\times10^{-16}$; single $p=24$, $\\epsilon_{\\rm machine}=${nm(2 ** -24 * 1e8, 3)}\\times10^{-8}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Principle',
      name: 'Fundamental axiom of floating-point arithmetic',
      statement: String.raw`**Axiom.** (i) For every real $x$ in the range of the system there is $\varepsilon$ with $|\varepsilon|\le\epsilon_{\rm machine}$ and $\mathrm{fl}(x)=x(1+\varepsilon)$. (ii) For all $x,y\in\mathbb F$ and each basic operation $*\in\{+,-,\times,\div\}$ with floating-point counterpart $\circledast$, the computed result satisfies
$$x\circledast y=(x*y)(1+\varepsilon),\qquad|\varepsilon|\le\epsilon_{\rm machine},$$
i.e. *each operation returns the exact result of the operation, rounded*. The axiom holds in IEEE arithmetic barring overflow and underflow. It says nothing about the operands being the results of earlier computations: if $x$ and $y$ already carry rounding errors, $x\circledast y$ may differ from the intended real result $\tilde x*\tilde y$ by a large *relative* amount (cancellation in a subtraction), although it is an accurate result for the operands actually given. Also $(a+b)+c\ne a+(b+c)$ in general.`,
      idea: String.raw`The axiom is a consequence of correct rounding: the computed value is the floating-point number nearest the exact result of the operation on the given operands, and by 3.6 such a rounding errs by at most the relative amount $\epsilon_{\rm machine}$. Every error analysis in the chapter replaces each flop by $(\text{exact})(1+\varepsilon)$ and bookkeeps the $\varepsilon$'s.`,
      caption: String.raw`Pick an operation and a precision $p$. Each of the $2000$ trials draws two random operands. Top: histogram of $\log_{10}(\text{relative error}/\epsilon_{\rm machine})$ of the computed result against the exact result *of the same operands*; the red line is the axiom's bound $0$, and no trial crosses it. Bottom: the same errors against the position of the exact result inside its binade; the green curve $1/m$ is the largest possible rounding error for a result with mantissa $m$ (half a gap). Now switch on “operands are rounded reals”: the operands are $\mathrm{fl}$ of random reals and the error is measured against the exact result for the *real* operands; for subtraction it is unbounded in units of $\epsilon_{\rm machine}$ (cancellation). The last line shows $(a+b)+c\ne a+(b+c)$ in $p$ bits.`,
      deps: ['nla-3.6'],
      credit: 'J. H. Wilkinson’s floating-point error analysis, 1950s–1960s (standard model of arithmetic)',
      tags: ['floating-point', 'rounding'],
      refs: ['Trefethen–Bau Lec. 13'],
      viz(v) {
        const pb = v.slider('significand bits $p$', 4, 24, 10, { int: true });
        const op = v.select('operation', [{ value: '+', label: '$x+y$' }, { value: '-', label: '$x-y$' }, { value: '*', label: '$x\\times y$' }, { value: '/', label: '$x/y$' }], '-');
        const real = v.toggle('operands are rounded reals', false);
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const H = v.stage({ x: [-5, 3], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'log₁₀(relative error / ε)', ylabel: 'density', title: 'error of one operation in units of ε' });
        const SC = v.stage({ x: [1, 2], y: [1e-3, 10], ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'mantissa of the exact result, in [1, 2)', ylabel: 'error / ε', title: 'the same errors against the position in the binade' });
        let st = null;
        v.render(() => {
          const p = pb.value, eps = 2 ** -p, r = v.rng(seed * 31 + 7), f = op.value;
          const apply = (a, b) => (f === '+' ? a + b : f === '-' ? a - b : f === '*' ? a * b : a / b);
          const logs = [], pts = [];
          let mx = 0, over = 0;
          for (let i = 0; i < 2000; i++) {
            const mag = () => (r() < 0.5 ? -1 : 1) * 2 ** (-3 + 6 * r());
            let a = mag(), b = mag();
            if ((f === '-' || f === '+') && r() < 0.5) b = (f === '-' ? 1 : -1) * a * (1 + (r() - 0.5) * 0.2); // near-cancelling operands
            const fa = fl(a, p), fb = fl(b, p);
            const computed = fl(apply(fa, fb), p), exact = real.value ? apply(a, b) : apply(fa, fb);
            const e = exact === 0 ? 0 : Math.abs(computed - exact) / Math.abs(exact) / eps;
            mx = Math.max(mx, e); if (e > 1 + 1e-9) over++;
            if (e > 0) { logs.push(Math.log10(e)); const lg2 = Math.log2(Math.abs(exact)); pts.push([2 ** (lg2 - Math.floor(lg2)), e]); }
          }
          const lo = real.value ? -5 : -5, hi = real.value ? 6 : 1;
          const hh = v.M.histogram(logs, { bins: 44, range: [lo, hi] });
          H.setView([lo, hi], [0, Math.max(...hh.density) * 1.15 || 1]);
          H.hist(logs, { range: [lo, hi], bins: 44, density: true, color: 'blue' });
          H.vline(0, { color: 'red', width: 2 });
          SC.setView([1, 2], real.value ? [1e-3, 1e8] : [1e-3, 10]);
          SC.dots(pts.map(([x, e]) => [x, Math.max(1.5e-3, e)]), { color: real.value ? 'orange' : 'blue', r: 1.8 });
          SC.hline(1, { color: 'red', width: 2 });
          SC.path(Array.from({ length: 60 }, (_, k) => { const m = 1 + k / 59; return [m, 1 / m]; }), { color: 'green', width: 2 });
          const a1 = 1, b1 = 0.75 * eps, c1 = 0.75 * eps;
          st = { mx, over, left: fl(fl(a1 + b1, p) + c1, p), right: fl(a1 + fl(b1 + c1, p), p), eps, p };
        });
        v.readout(() => st ? `Largest error observed: $${nm(st.mx, 3)}\\,\\epsilon_{\\rm machine}$; trials above the bound $\\epsilon_{\\rm machine}$: $${st.over}$ of $2000$.\nAssociativity fails: with $a=1$, $b=c=0.75\\,\\epsilon_{\\rm machine}$, in $${st.p}$ bits $(a+b)+c=${nm(st.left, 8)}$ but $a+(b+c)=${nm(st.right, 8)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Accuracy, stability and backward stability',
      statement: String.raw`Let $\tilde f$ be an algorithm (a floating-point implementation) for the problem $f$, run in arithmetic with $\epsilon_{\rm machine}$. It is **accurate** if $\|\tilde f(x)-f(x)\|/\|f(x)\|=O(\epsilon_{\rm machine})$ for all $x$; **stable** if $\|\tilde f(x)-f(\tilde x)\|/\|f(\tilde x)\|=O(\epsilon_{\rm machine})$ for some $\tilde x$ with $\|\tilde x-x\|/\|x\|=O(\epsilon_{\rm machine})$; and **backward stable** if $\tilde f(x)=f(\tilde x)$ *exactly* for some $\tilde x$ with $\|\tilde x-x\|/\|x\|=O(\epsilon_{\rm machine})$: the computed answer is the exact answer to a slightly perturbed question. The constants may depend on the dimension but not on $x$. Accuracy is a statement about the *forward* error and depends on the conditioning of $f$; backward stability is a property of the algorithm alone.`,
      idea: String.raw`The set $\{\tilde x:\ f(\tilde x)=\tilde f(x)\}$ is the set of inputs *explaining* the computed output. Backward stability asks that this set comes within $O(\epsilon_{\rm machine})\|x\|$ of the true data $x$; because the data of a real problem is only known to that accuracy anyway, nothing more can be asked of an algorithm. By 3.1, a backward error $\eta$ translates into a forward error of at most $\kappa\eta$ (3.9). The algorithm below, for the smaller root of $t^2-2bt+c$, shows both outcomes for the *same* well-conditioned problem.`,
      caption: String.raw`Problem: the smaller root $t=b-\sqrt{b^2-c}$ of $t^2-2bt+c$ with $b=1$ and $0<c<1$. The plane is the space of *relative* perturbations $(\eta_b,\eta_c)$ of the data, in units of $\epsilon_{\rm machine}$; the origin is the actual data. The red line is the set of data whose exact root equals the computed $\hat t$; its distance from the origin is the backward error. The green disc has radius $1$ (backward stable = the line crosses a small multiple of it). Algorithm 1 (naive $b-\sqrt{b^2-c}$) loses all accuracy as $c\to0$ though the problem stays well conditioned; algorithm 2 ($c/(b+\sqrt{b^2-c})$) keeps the line near the origin. Bottom: errors against $c$.`,
      deps: ['nla-3.7', 'nla-3.1'],
      credit: 'Backward error analysis was developed and championed by J. H. Wilkinson (ACM Turing Award 1970), building on earlier work of von Neumann–Goldstine and Turing',
      tags: ['stability', 'backward-error'],
      refs: ['Trefethen–Bau Lec. 14'],
      viz(v) {
        const alg = v.select('algorithm', [{ value: 'naive', label: '1: $b-\\sqrt{b^2-c}$' }, { value: 'stable', label: '2: $c/(b+\\sqrt{b^2-c})$' }], 'naive');
        const pb = v.slider('significand bits $p$', 8, 24, 12, { int: true });
        const lc = v.slider('$\\log_{10}c$', -8, -0.02, -3, { step: 0.01 });
        const P = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: true, height: 340, minWidth: 320, title: 'relative perturbation of the data, in units of $\\epsilon$' });
        const E = v.stage({ x: [-8, 0], y: [1e-1, 1e9], ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 340, xlabel: 'log₁₀ c', ylabel: 'error / ε', title: 'errors of both algorithms' });
        const run = (name, c0, p) => {
          const F = arith(p), b = 1, c = fl(c0, p), s = F.mul(b, b), d = F.sub(s, c), rt = F.sqrt(d);
          const tHat = name === 'naive' ? F.sub(b, rt) : F.div(c, F.add(b, rt));
          const ex = c / (b + Math.sqrt(b * b - c)); // exact root of the stored data, accurate in double
          const resid = 2 * tHat * b - tHat * tHat - c, nrm = Math.hypot(c, 2 * tHat * b);
          const kap = (b * Math.abs(1 - b / Math.sqrt(b * b - c)) + c / (2 * Math.sqrt(b * b - c))) / ex;
          return { tHat, ex, back: Math.abs(resid) / nrm, fwd: Math.abs(tHat - ex) / ex, kap, resid, c, nrm };
        };
        let st = null;
        v.render(() => {
          const p = pb.value, eps = 2 ** -p, c0 = 10 ** lc.value, R = run(alg.value, c0, p);
          const dist = R.back / eps, view = Math.max(4, Math.min(1e6, 1.8 * dist));
          P.setView([-view, view], [-view, view]);
          // line  c·ηc − 2 b t̂ ηb = resid  (coordinates in units of ε)
          const a = R.c, bq = -2 * R.tHat, rhs = R.resid / eps, nn = Math.hypot(a, bq);
          const foot = [(bq * rhs) / (nn * nn), (a * rhs) / (nn * nn)], d2 = [a / nn, -bq / nn];
          P.line(foot[0] - 3 * view * d2[0], foot[1] - 3 * view * d2[1], foot[0] + 3 * view * d2[0], foot[1] + 3 * view * d2[1], { color: 'red', width: 2.4 });
          P.circle(0, 0, 1, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 2.6 });
          P.text('radius 1 (ε)', 0, -0.07 * view, { align: 'center', color: 'green', size: 12 });
          P.dot(0, 0, { color: 'ink', r: 4 });
          P.dot(foot[0], foot[1], { color: 'red', r: 5 });
          P.corner(`distance to the red line: ${v.fmt(dist, 3)} ε`, 'tl', { color: 'red', plate: true });
          // error curves
          const cs = Array.from({ length: 150 }, (_, i) => -8 + (7.98 * i) / 149);
          const get = (name, key) => cs.map((l) => { const q = run(name, 10 ** l, p); return [l, Math.max(0.11, q[key] / eps)]; });
          E.path(get('naive', 'fwd'), { color: 'red', width: 2.2 });
          E.path(get('stable', 'fwd'), { color: 'green', width: 2.2 });
          E.path(get('naive', 'back'), { color: 'red', width: 1.4, dash: true });
          E.path(get('stable', 'back'), { color: 'green', width: 1.4, dash: true });
          E.path(cs.map((l) => [l, run('stable', 10 ** l, p).kap]), { color: 'muted', width: 1.6 });
          E.vline(lc.value, { color: 'gold', width: 1.6 });
          st = { ...R, eps, dist };
        });
        v.legend([['red', 'algorithm 1 forward error'], ['green', 'algorithm 2 forward error'], ['red', 'backward errors (dashed)', { dash: true }], ['muted', 'condition number $\\kappa$']]);
        v.readout(() => st ? `$c=${sciT(st.c)}$: exact root $t=${sciT(st.ex)}$, computed $\\hat t=${sciT(st.tHat)}$; forward error $${nm(st.fwd / st.eps, 3)}\\,\\epsilon$, backward error $${nm(st.back / st.eps, 3)}\\,\\epsilon$, condition number $\\kappa=${nm(st.kap, 3)}$.\n${st.dist <= 8 ? 'Backward stable here: the computed root is the exact root of data within a few $\\epsilon$ of the true data.' : 'Not backward stable here: no data within a few $\\epsilon$ of the true data has $\\hat t$ as its root.'}` : '');
      },
    },
  ],
};
