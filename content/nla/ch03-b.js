// Numerical Linear Algebra — Chapter 3: Conditioning, floating point and stability
// Part 2 (this file): 3.9–3.15 — backward stability and accuracy, Householder QR, back substitution, least squares conditioning,
// the normal equations, and the von Neumann–Goldstine paper. Part 1 (3.1–3.8) is in ch03.js.
import {
  nm, nmc, matT, vecT, sciT, dot, mv, mm, tp, len, fro, TAU, drawTile, eye, arith,
  fl, flM, flV, flSolve, flBack, flQRSolve, flHouseholder, flGS, flGSSolve, flNormalEq, flMM, hilbert, hilbertInv, hilbertKappa,
  withSingular, geomSigma, randQ, relErr, normV,
} from './ch03.shared.js';

const spec = (M, A) => (A.length && A[0].length ? M.svd(A).S[0] : 0);
const sub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
/** Householder QR in p bits normalised so that diag(R) ≥ 0 (to compare with M.qr and with Gram–Schmidt). */
function hhPos(A, p) {
  const { Q, R } = flHouseholder(A, p), n = R.length;
  for (let j = 0; j < n; j++) if (R[j][j] < 0) { for (let i = 0; i < Q.length; i++) Q[i][j] = -Q[i][j]; for (let k = 0; k < n; k++) R[j][k] = -R[j][k]; }
  return { Q, R };
}
const logGrid = (a, b, n) => Array.from({ length: n }, (_, i) => 10 ** (a + ((b - a) * i) / (n - 1)));
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export default {
  collection: 'nla',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Backward stable + well conditioned ⇒ accurate',
      statement: String.raw`Let $\tilde f$ be a backward stable algorithm for a problem $f$ with condition number $\kappa(x)$ (3.1), run in arithmetic with unit roundoff $\epsilon_{\rm machine}$. Then the relative error satisfies
$$\frac{\|\tilde f(x)-f(x)\|}{\|f(x)\|}=O\big(\kappa(x)\,\epsilon_{\rm machine}\big).$$
Applied to solving $Ax=b$ by a backward stable solver: $\|\hat x-x\|/\|x\|=O(\kappa(A)\,\epsilon_{\rm machine})$, and the *residual* is always small, $\|A\hat x-b\|/(\|A\|\|\hat x\|)=O(\epsilon_{\rm machine})$, however ill-conditioned $A$ may be. The bound is a bound on the worst case; the constants depend on the dimension but not on $A$. When $\kappa\epsilon_{\rm machine}\gtrsim1$ nothing is guaranteed.`,
      idea: String.raw`Backward stability gives $\tilde f(x)=f(\tilde x)$ with $\|\tilde x-x\|/\|x\|=O(\epsilon_{\rm machine})$. By the definition of the condition number (3.1), $\|f(\tilde x)-f(x)\|/\|f(x)\|\le(\kappa(x)+o(1))\,\|\tilde x-x\|/\|x\|$. Composing the two inequalities gives the theorem; for linear systems the second step is the perturbation bound 3.3. The theorem says the *only* source of inaccuracy in a backward stable method is the sensitivity of the problem itself.`,
      caption: String.raw`Each dot is one solve of $Ax=b$ with a random $n\times n$ matrix of the singular values $1\ge\dots\ge1/\kappa$, in arithmetic with $p$ bits (inputs are rounded to $p$ bits first). Orange: relative error of the computed $\hat x$ against the true $x$; green: the relative residual $\|A\hat x-b\|/(\|A\|\|\hat x\|)$ (the backward error). Purple dashed: the line $\kappa\,\epsilon_{\rm machine}$. The orange dots follow it, a constant factor below to a few above, until they reach $100\%$ at $\kappa\approx1/\epsilon_{\rm machine}$; the green dots stay flat at $\epsilon_{\rm machine}$ for every $\kappa$: the algorithm solves a nearby problem exactly, and the problem is simply sensitive.`,
      deps: ['nla-3.8'],
      tags: ['stability', 'accuracy'],
      refs: ['Trefethen–Bau Lec. 15'],
      viz(v) {
        const M = v.M;
        const solver = v.select('solver', [{ value: 'qr', label: 'Householder QR' }, { value: 'lu', label: 'elimination with partial pivoting' }], 'qr');
        const pb = v.slider('significand bits $p$', 8, 26, 24, { int: true });
        const nn = v.slider('dimension $n$', 3, 12, 6, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [1, 1e12], y: [1e-17, 1e2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: 'condition number κ(A)', ylabel: 'error', title: 'forward error and backward error against κ(A)' });
        let st = null;
        v.render(() => {
          const p = pb.value, n = nn.value, u = 2 ** -p, r = v.rng(seed * 977 + n);
          const fwd = [], bwd = [];
          let worst = 0;
          for (const k of logGrid(0, 12, 25)) for (let t = 0; t < 3; t++) {
            const A = withSingular(M, r, n, n, geomSigma(n, k)), xt = Array.from({ length: n }, () => r.normal()), b = mv(A, xt);
            const x = solver.value === 'lu' ? flSolve(A, b, p) : flQRSolve(A, b, p);
            if (!x || x.some((q) => !isFinite(q))) continue;
            const Ap = flM(A, p), bp = flV(b, p), res = normV(bp.map((q, i) => q - dot(Ap[i], x))) / (spec(M, Ap) * normV(x));
            const e = relErr(x, xt);
            fwd.push([k, Math.min(e, 50)]); bwd.push([k, Math.max(res, 1e-17)]);
            if (k * u < 0.01) worst = Math.max(worst, e / (k * u));
          }
          S.path([[1, u], [1e12, u]], { color: 'green', width: 1, dash: true, alpha: 0.7 });
          S.path([[1, u], [1e12, 1e12 * u]], { color: 'purple', width: 2, dash: true });
          S.hline(1, { color: 'red', width: 1.4, dash: true });
          S.dots(bwd, { color: 'green', r: 3 });
          S.dots(fwd, { color: 'orange', r: 3.4 });
          S.text('κ ε', 3e9, 3e9 * u * 3, { color: 'purple', size: 13 });
          S.text('ε', 2, u * 2.4, { color: 'green', size: 13 });
          S.text('100% error', 2, 1.6, { color: 'red', size: 11 });
          st = { u, n, worst, bmax: Math.max(...bwd.map((q) => q[1])) };
        });
        v.legend([['orange', 'relative forward error', { dot: true }], ['green', 'relative residual (backward error)', { dot: true }], ['purple', '$\\kappa\\epsilon_{\\rm machine}$', { dash: true }], ['red', '100% error', { dash: true }]]);
        v.readout(() => st ? `$\\epsilon_{\\rm machine}=2^{-${pb.value}}=${sciT(st.u)}$, $n=${st.n}$. Largest backward error over all trials: $${sciT(st.bmax)}$ ($=${nm(st.bmax / st.u, 2)}\\,\\epsilon_{\\rm machine}$). Largest forward error / $(\\kappa\\epsilon_{\\rm machine})$ among trials with $\\kappa\\epsilon_{\\rm machine}<0.01$: $${nm(st.worst, 2)}$ — a modest constant.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Backward stability of Householder QR',
      statement: String.raw`Let $A\in\mathbb R^{m\times n}$ ($m\ge n$) be factored by Householder triangularization (2.6) in floating-point arithmetic, producing $\tilde R$ and the explicit factor $\tilde Q$. Then there is an exactly orthogonal $Q$ with
$$\tilde Q\tilde R=A+\delta A,\qquad\frac{\|\delta A\|}{\|A\|}=O(\epsilon_{\rm machine}),\qquad\|\tilde Q-Q\|=O(\epsilon_{\rm machine}),$$
the constants growing only polynomially with $m,n$. Consequently $\tilde Q$ is orthogonal to working accuracy, $\|\tilde Q^{\top}\tilde Q-I\|=O(\epsilon_{\rm machine})$, *whatever the condition number of $A$*. Classical and modified Gram–Schmidt do not have this property: the loss of orthogonality of the computed $\tilde Q$ grows like $\kappa(A)\epsilon_{\rm machine}$ (modified) or $\kappa(A)^2\epsilon_{\rm machine}$ (classical).`,
      idea: String.raw`Each Householder reflector is a rank-one orthogonal transformation $H=I-2vv^{\top}/v^{\top}v$; applying it in floating point to a vector gives the exact result of applying a reflector $\tilde H$ (built from the computed $v$) to a slightly perturbed vector, with a relative perturbation $O(\epsilon_{\rm machine})$ per step. Because the transformations are exactly orthogonal, the errors of the $n$ steps neither amplify each other nor depend on the singular values of $A$; they simply add up to a backward error of size $O(mn\,\epsilon_{\rm machine})\|A\|$. Gram–Schmidt subtracts projections onto vectors that are themselves inexact, and the errors feed on the near-dependence of the columns.`,
      caption: String.raw`Factor random $12\times6$ matrices with condition number $\kappa$ (horizontal) in $p$-bit arithmetic with the algorithm of your choice, three matrices per value of $\kappa$. Blue: backward error $\|A-\tilde Q\tilde R\|/\|A\|$; orange: loss of orthogonality $\|\tilde Q^{\top}\tilde Q-I\|$; purple: the error $\|\tilde Q-Q\|$ of the computed factor against the factor computed in double precision; black: the largest relative error of a diagonal entry of $\tilde R$. For Householder, blue and orange are flat at $\epsilon_{\rm machine}$ for every $\kappa$ — but purple and black climb: the factors themselves are inaccurate (see 3.11). Switch to modified or classical Gram–Schmidt and the orthogonality (orange) deteriorates like $\kappa\epsilon$ resp. $\kappa^2\epsilon$ while the backward error of the product stays small.`,
      deps: ['nla-3.9', 'nla-2.6'],
      tags: ['qr', 'stability'],
      refs: ['Trefethen–Bau Lec. 16'],
      viz(v) {
        const M = v.M;
        const alg = v.select('algorithm', [{ value: 'hh', label: 'Householder' }, { value: 'mgs', label: 'modified Gram–Schmidt' }, { value: 'cgs', label: 'classical Gram–Schmidt' }], 'hh');
        const pb = v.slider('significand bits $p$', 10, 26, 24, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [1, 1e10], y: [1e-17, 1e2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: 'condition number κ(A)', ylabel: 'error', title: 'what Householder keeps small, and what it does not' });
        const run = (A, p) => (alg.value === 'hh' ? hhPos(A, p) : flGS(A, alg.value === 'mgs' ? 'modified' : 'classical', p));
        let st = null;
        v.render(() => {
          const p = pb.value, u = 2 ** -p, r = v.rng(seed * 31 + 5), pts = { back: [], orth: [], qerr: [], rerr: [] };
          let maxBack = 0, maxOrth = 0;
          for (const k of logGrid(0, 10, 21)) for (let t = 0; t < 3; t++) {
            const A0 = withSingular(M, r, 12, 6, geomSigma(6, k)), A = flM(A0, p);
            const { Q, R } = run(A, p), ref = M.qr(A, { thin: true });
            const back = spec(M, sub(A, mm(Q, R))) / spec(M, A), I6 = eye(6), orth = spec(M, sub(mm(tp(Q), Q), I6));
            const qe = fro(sub(Q, ref.Q));
            let re = 0;
            for (let i = 0; i < 6; i++) if (Math.abs(ref.R[i][i]) > 1e-14) re = Math.max(re, Math.abs(R[i][i] - ref.R[i][i]) / Math.abs(ref.R[i][i]));
            pts.back.push([k, Math.max(1e-17, back)]); pts.orth.push([k, Math.max(1e-17, orth)]);
            pts.qerr.push([k, Math.max(1e-17, qe)]); pts.rerr.push([k, Math.max(1e-17, re)]);
            maxBack = Math.max(maxBack, back / u); maxOrth = Math.max(maxOrth, orth / u);
          }
          S.hline(u, { color: 'muted', width: 1, dash: true });
          S.path([[1, u], [1e10, 1e10 * u]], { color: 'muted', width: 1, dash: true, alpha: 0.7 });
          S.hline(1, { color: 'red', width: 1.2, dash: true });
          S.dots(pts.rerr, { color: 'ink', r: 2.6 });
          S.dots(pts.qerr, { color: 'purple', r: 2.6 });
          S.dots(pts.orth, { color: 'orange', r: 3.2 });
          S.dots(pts.back, { color: 'blue', r: 3.2 });
          S.text('ε', 1.6, u * 2.5, { color: 'muted', size: 13 }); S.text('κ ε', 2e8, 2e8 * u * 3, { color: 'muted', size: 13 });
          st = { u, maxBack, maxOrth };
        });
        v.legend([['blue', '$\\|A-\\tilde Q\\tilde R\\|/\\|A\\|$', { dot: true }], ['orange', '$\\|\\tilde Q^{\\top}\\tilde Q-I\\|$', { dot: true }], ['purple', '$\\|\\tilde Q-Q\\|$', { dot: true }], ['ink', 'diagonal of $\\tilde R$', { dot: true }]]);
        v.readout(() => st ? `$\\epsilon_{\\rm machine}=${sciT(st.u)}$. Over all trials: backward error $\\le${nm(st.maxBack, 2)}\\,\\epsilon_{\\rm machine}$; loss of orthogonality $\\le${st.maxOrth > 1e4 ? sciT(st.maxOrth) : nm(st.maxOrth, 3)}\\,\\epsilon_{\\rm machine}$ ${alg.value === 'hh' ? '(both flat: backward stable)' : alg.value === 'mgs' ? '(grows like $\\kappa\\epsilon$)' : '(grows like $\\kappa^2\\epsilon$ until it saturates at $1$)'}.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Paradox',
      name: 'Inaccurate Q and R, but an accurate product QR',
      statement: String.raw`For an ill-conditioned matrix $A$, the factors $\tilde Q,\tilde R$ computed by Householder QR can be *wrong* in their leading digits: $\|\tilde Q-Q\|$ is of order $\kappa(A)\epsilon_{\rm machine}$ and the small diagonal entries of $\tilde R$ have comparable relative errors (the QR factorization is itself an ill-conditioned function of $A$) — and yet the product reproduces the data to working accuracy, $\|A-\tilde Q\tilde R\|/\|A\|=O(\epsilon_{\rm machine})$ (3.10). There is no contradiction: with $\delta Q=\tilde Q-Q$ and $\delta R=\tilde R-R$ one has the exact identity
$$\tilde Q\tilde R-QR=\delta Q\,\tilde R+Q\,\delta R=\sum_j \delta q_j\,\tilde r_j^{\top}+Q\,\delta R,$$
($\tilde r_j^{\top}$ the $j$-th row of $\tilde R$), and the large errors $\delta q_j$ of $\tilde Q$ occur precisely in the columns $j$ for which the row $\tilde r_j$ is small, so every term $\|\delta q_j\|\|\tilde r_j\|$ stays at the level $\epsilon_{\rm machine}\|A\|$. The errors sit in directions that $\tilde R$ nearly annihilates.`,
      idea: String.raw`Backward stability says $\tilde Q\tilde R$ is the product for a matrix $A+\delta A$ with a tiny $\delta A$. The QR factorization of $A+\delta A$ differs from that of $A$ by the perturbation of the *factorization problem*, whose condition number grows with $\kappa(A)$; so the computed pair is close to the exact factors of a *nearby* matrix, not of $A$. The $j$-th column of $Q$ is determined by the first $j$ columns of $A$; when $A$ has a tiny singular value, a perturbation of size $\epsilon$ rotates the last columns of $Q$ by a large angle, but those columns are multiplied by the correspondingly tiny rows of $R$. Accuracy of the factors would need a small forward error; the algorithm only promises a small backward error (3.8, 3.9). I checked the column-by-column picture numerically for the examples shown; it is an illustration, not a proof.`,
      caption: String.raw`A random $6\times4$ matrix with condition number $\kappa$ (slider), factored by Householder in $p$-bit arithmetic and in double precision (the reference). Left: sizes of the three errors on a log scale: the factor errors grow with $\kappa$ while the product error stays at $\epsilon_{\rm machine}$ (red line). Right, for each column $j=1,\dots,4$: the error $\|\delta q_j\|$ of the $j$-th column of $\tilde Q$ (blue), the size of the $j$-th row of $\tilde R$ relative to $\|\tilde R\|$ (purple) and the product of the two, $\|\delta q_j\|\|\tilde r_j\|/\|A\|$ (green). As $\kappa$ grows the blue bars rise on the later columns and the purple ones fall by the same factor: the green stays near $\epsilon_{\rm machine}$.`,
      deps: ['nla-3.10'],
      tags: ['qr', 'stability'],
      refs: ['Trefethen–Bau Lec. 16'],
      viz(v) {
        const M = v.M;
        const kap = v.slider('condition number $\\kappa(A)$', 1, 1e6, 1e5, { log: true, sig: 2 });
        const pb = v.slider('significand bits $p$', 10, 26, 24, { int: true });
        let seed = 4;
        v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [1e-9, 10], y: [0, 4], xlog: true, axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'size of the error', ylabel: '', yticks: [], title: 'errors of the factors and of their product' });
        const R = v.stage({ x: [0.4, 4.6], y: [1e-10, 10], ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'column j', ylabel: '', xticks: [1, 2, 3, 4], title: 'column by column: error of $q_j$ against the size of row $j$ of $\\tilde R$' });
        let st = null;
        v.render(() => {
          const p = pb.value, u = 2 ** -p, r = v.rng(seed * 13 + 1), n = 4;
          const A = flM(withSingular(M, r, 6, n, geomSigma(n, kap.value)), p);
          const c = hhPos(A, p), e = hhPos(A, 53);
          const dQ = sub(c.Q, e.Q), eQ = spec(M, dQ), eA = spec(M, sub(A, mm(c.Q, c.R))) / spec(M, A), nA = spec(M, A);
          let eR = 0;
          for (let i = 0; i < n; i++) if (Math.abs(e.R[i][i]) > 1e-14) eR = Math.max(eR, Math.abs(c.R[i][i] - e.R[i][i]) / Math.abs(e.R[i][i]));
          const rows = [[3, eQ, 'blue', '‖Q̃ − Q‖'], [2, eR, 'purple', 'rel. error of diag R̃'], [1, eA, 'green', '‖A − Q̃R̃‖/‖A‖']];
          rows.forEach(([y, val, col, lab]) => {
            L.rect(1e-9, y - 0.32, Math.max(1.2e-9, val), y + 0.32, { fill: col, fillAlpha: 0.55, stroke: false });
            L.text(`${lab} = ${val < 1e-300 ? '0' : val.toExponential(1).replace('e-', '·10⁻').replace('e+', '·10')}`, 1.6e-9, y, { color: 'ink', size: 12, baseline: 'middle', plate: true });
          });
          L.vline(u, { color: 'red', width: 2 });
          L.text('ε', u * 1.25, 3.85, { color: 'red', size: 13 });
          const fl9 = (x) => Math.max(1e-10, x);
          const eqj = [], rj = [], pr = [];
          for (let j = 0; j < n; j++) {
            const dq = Math.hypot(...dQ.map((row) => row[j])), rn = Math.hypot(...c.R[j]);
            eqj.push(dq); rj.push(rn / spec(M, c.R)); pr.push((dq * rn) / nA);
          }
          R.hline(u, { color: 'red', width: 2 });
          const draw = (vals, dx, col) => vals.forEach((val, j) => { R.line(j + 1 + dx, 1e-10, j + 1 + dx, fl9(val), { color: col, width: 7, alpha: 0.75 }); });
          draw(eqj, -0.22, 'blue'); draw(rj, 0, 'purple'); draw(pr, 0.22, 'green');
          st = { u, eQ, eR, eA, kappa: spec(M, A) * spec(M, M.pinv(A)), prMax: Math.max(...pr), eqMax: Math.max(...eqj) };
        });
        v.legend([['blue', 'error of $\\tilde Q$ / of column $j$'], ['purple', 'error of $\\tilde R$ diagonal / size of row $j$'], ['green', 'error of $\\tilde Q\\tilde R$ / $\\|\\delta q_j\\|\\|\\tilde r_j\\|$'], ['red', '$\\epsilon_{\\rm machine}$']]);
        v.readout(() => st ? `$\\kappa(A)=${sciT(st.kappa)}$, $\\epsilon_{\\rm machine}=${sciT(st.u)}$: $\\|\\tilde Q-Q\\|=${sciT(st.eQ)}$, relative error of the diagonal of $\\tilde R$ up to $${sciT(st.eR)}$, but $\\|A-\\tilde Q\\tilde R\\|/\\|A\\|=${sciT(st.eA)}$.\nLargest single-column error $\\|\\delta q_j\\|=${sciT(st.eqMax)}$, yet every product $\\|\\delta q_j\\|\\|\\tilde r_j\\|/\\|A\\|\\le${sciT(st.prMax)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Backward stability of back substitution',
      statement: String.raw`Let $R\in\mathbb R^{m\times m}$ be upper triangular and nonsingular and let $\hat x$ be the solution of $Rx=b$ computed by back substitution in floating-point arithmetic. Then there is an upper triangular $\delta R$ with
$$(R+\delta R)\hat x=b,\qquad\frac{|\delta r_{ij}|}{|r_{ij}|}\le m\,\epsilon_{\rm machine}\ \ (i\le j)$$
(to first order): the computed solution is the exact solution of a nearby triangular system, perturbed *entry by entry* by a small relative amount (so zeros stay zero). By 3.9 the relative error of $\hat x$ is then $O(\kappa(R)\,\epsilon_{\rm machine})$; the residual $b-R\hat x$ is always small.`,
      idea: String.raw`Row $i$ computes $\hat x_i=\big(b_i-\sum_{j>i}r_{ij}\hat x_j\big)/r_{ii}$ with $m-i+1$ floating-point operations, each contributing a factor $(1+\varepsilon)$ by the axiom 3.7. These factors can be moved onto the *coefficients* $r_{ij}$ of that row (not onto $\hat x_j$, which later rows reuse), giving $\hat x_i$ as the exact solution of row $i$ of a system with entries $r_{ij}(1+\theta_{ij})$ and $|\theta_{ij}|\le(m-i+1)\epsilon_{\rm machine}$ up to $O(\epsilon^2)$. The picture computes the smallest such perturbation per row (Oettli–Prager), whose relative size is $|\rho_i|/(|R||\hat x|)_i$.`,
      caption: String.raw`Left: the triangular matrix $R$ (blue positive, red negative) and the computed solution $\hat x$. Right: the relative entry perturbation $\omega_i=|\rho_i|/(|R||\hat x|)_i$ that row $i$ needs, where $\rho=b-R\hat x$ is the exact residual of the computed solution — this $\omega_i$ is the size of the perturbation $\delta R$ with $|\delta r_{ij}|=\omega_i|r_{ij}|$ for which $(R+\delta R)\hat x=b$ exactly. The values $\omega_i/\epsilon_{\rm machine}$ (log scale) never exceed the dimension $m$ (red line). Switch to the Kahan-type matrix ($1$ on the diagonal, $-1$ above): $\kappa$ grows like $2^m$ and the *forward* error (readout) becomes huge, yet $\omega_i$ stay tiny. Use fewer bits $p$ to make everything visible.`,
      deps: ['nla-3.9'],
      tags: ['stability', 'triangular'],
      refs: ['Trefethen–Bau Lec. 17'],
      viz(v) {
        const M = v.M;
        const mat = v.select('matrix', [{ value: 'rand', label: 'random' }, { value: 'kahan', label: 'Kahan type ($1$ on the diagonal, $-1$ above)' }], 'rand');
        const nn = v.slider('size $m$', 3, 10, 8, { int: true });
        const pb = v.slider('significand bits $p$', 8, 26, 12, { int: true });
        let seed = 2;
        v.button('Resample', () => { seed++; });
        const T = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 320, minWidth: 280, title: 'the triangular matrix $R$ and the solution' });
        const B = v.stage({ x: [0, 11], y: [1e-2, 30], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'row i', ylabel: 'ω / ε', title: 'relative perturbation each row needs' });
        let st = null;
        v.render(() => {
          const n = nn.value, p = pb.value, u = 2 ** -p, r = v.rng(seed * 17 + n);
          let R = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j < i ? 0 : j === i ? 1 + Math.abs(r.normal()) : r.normal())));
          if (mat.value === 'kahan') R = R.map((row, i) => row.map((_, j) => (j < i ? 0 : j === i ? 1 : -1)));
          const b = Array.from({ length: n }, () => r.normal());
          R = flM(R, p); const bq = flV(b, p);
          const x = flBack(R, bq, p), xe = (() => { const y = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = bq[i]; for (let j = i + 1; j < n; j++) s -= R[i][j] * y[j]; y[i] = s / R[i][i]; } return y; })();
          const rho = bq.map((bi, i) => bi - dot(R[i], x)), om = rho.map((q, i) => Math.abs(q) / (R[i].reduce((s, t, j) => s + Math.abs(t) * Math.abs(x[j]), 0) || 1));
          const sc = n > 8 ? 0.9 : 1;
          drawTile(T, R, 0.02, 0.28, 0.62 * sc, 0.62 * sc, { d: 2 });
          T.text('x̂', 0.82, 0.93, { color: 'ink', size: 14, align: 'center' });
          x.forEach((q, i) => T.text(nmc(q, 2), 0.82, 0.9 - (i + 0.5) * (0.62 * sc) / n, { size: 11, align: 'center', baseline: 'middle', color: 'orange' }));
          T.text('R', 0.33 * sc, 0.97, { color: 'ink', size: 14, align: 'center' });
          B.setView([0, n + 1], [1e-2, 3 * n]);
          om.forEach((q, i) => { const val = Math.max(1.5e-2, q / u); B.line(i + 1, 1e-2, i + 1, val, { color: 'green', width: 6, alpha: 0.7 }); B.dot(i + 1, val, { color: 'green', r: 5 }); });
          B.hline(n, { color: 'red', width: 2 });
          B.text(`bound m = ${n}`, n + 0.9, n * 1.5, { color: 'red', size: 12, align: 'right' });
          st = { n, u, omega: Math.max(...om) / u, fwd: relErr(x, xe), kap: spec(M, R) * spec(M, M.pinv(R)) };
        });
        v.legend([['green', 'row perturbation $\\omega_i/\\epsilon$'], ['red', 'bound $m\\,\\epsilon_{\\rm machine}$'], ['orange', 'computed $\\hat x$']]);
        v.readout(() => st ? `$m=${st.n}$, $\\epsilon_{\\rm machine}=${sciT(st.u)}$: largest relative entry perturbation $\\omega=${nm(st.omega, 3)}\\,\\epsilon_{\\rm machine}\\le m\\epsilon_{\\rm machine}$.\n$\\kappa(R)=${sciT(st.kap)}$, relative forward error of $\\hat x$: $${sciT(st.fwd)}$ (compare $\\kappa\\epsilon_{\\rm machine}=${sciT(st.kap * st.u)}$).` : '');
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Conditioning of least squares problems',
      statement: String.raw`Let $A\in\mathbb R^{m\times n}$ have full rank and let $b\in\mathbb R^m$ with $b\notin\operatorname{range}(A)^{\perp}$. Write $x=A^{+}b$, $y=Ax=Pb$, $\theta\in[0,\pi/2)$ for the angle between $b$ and $y$, $\kappa=\kappa(A)=\sigma_1/\sigma_n$ and $\eta=\|A\|\|x\|/\|y\|\in[1,\kappa]$. The 2-norm relative condition numbers of the least squares problem are
$$\kappa_{b\to y}=\frac1{\cos\theta},\quad\kappa_{b\to x}=\frac{\kappa}{\eta\cos\theta},\quad\kappa_{A\to x}\le\kappa+\frac{\kappa^{2}\tan\theta}{\eta},$$
(the last to first order, with a matching perturbation within a small factor). So the solution is as sensitive as $\kappa$ when $\theta$ is small and $\eta\approx1$, as $\kappa/\eta$ in $b$, but acquires a term $\kappa^{2}\tan\theta$ when the residual is large; it is infinitely sensitive as $\theta\to\pi/2$ ($x\to0$).`,
      idea: String.raw`$x=A^{+}b$ is linear in $b$, so $\delta x=A^{+}\delta b$ and the largest $\|\delta x\|/\|\delta b\|$ is $1/\sigma_n$, attained for $\delta b$ along the last left singular vector; with $\|b\|=\|y\|/\cos\theta$ and $\|y\|=\sigma_1\|x\|/\eta$ this gives $\kappa/(\eta\cos\theta)$. For $A$, differentiating $A^{\top}(b-Ax)=0$ gives $\delta x=-A^{+}\delta A\,x+(A^{\top}A)^{-1}\delta A^{\top}r$ with $r=b-y$; the first term is bounded by $\kappa\|\delta A\|/\|A\|\cdot\|x\|$, the second by $\|r\|\|\delta A\|/\sigma_n^{2}=\kappa^{2}\tan\theta\,\|\delta A\|\|x\|/(\eta\|A\|)$ — it carries the *square* of $\kappa$ and is present only when $r\ne0$.`,
      caption: String.raw`Curves: the condition numbers $\kappa_{b\to x}$ (blue) and the bound $\kappa+\kappa^2\tan\theta/\eta$ for $A\to x$ (red) as functions of the angle $\theta$ between $b$ and its projection onto $\operatorname{range}A$ ($A$ is $6\times2$ with singular values $1$ and $1/\kappa$). Drag the gold handle $b$ on the quarter circle in the right panel (it sets $\theta$), and use the sliders for $\kappa$ and the direction of $x$ in the right-singular basis (this sets $\eta\in[1,\kappa]$). Circles at the current $\theta$: the worst relative sensitivity actually found numerically for perturbations of $b$ (blue; it matches the formula) and of $A$ (red, a local search; it lands on or just below the bound). Near $\theta=90^{\circ}$ both blow up; with $b$ in the range the $\kappa^2$ term disappears.`,
      deps: ['nla-3.2', 'nla-2.8'],
      tags: ['least-squares', 'conditioning'],
      refs: ['Trefethen–Bau Lec. 18'],
      viz(v) {
        const M = v.M, r0 = v.rng(41), U = randQ(M, r0, 6, 3), V = randQ(M, r0, 2, 2);
        const kap = v.slider('condition number $\\kappa(A)$', 1, 1e4, 100, { log: true, sig: 2 });
        const phi = v.slider('direction of $x$ (0° = $v_1$, 90° = $v_2$)', 0, 90, 30, { step: 1, fmt: (t) => `${v.fix(t, 0)}°` });
        const C = v.stage({ x: [0, 90], y: [1, 1e8], ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 340, xlabel: 'angle θ between b and range(A), degrees', ylabel: 'condition number', title: 'sensitivity of the solution $x$' });
        const G = v.stage({ x: [-0.15, 1.3], y: [-0.15, 1.3], equal: true, axes: false, height: 340, minWidth: 260, title: 'the angle $\\theta$: drag $b$' });
        const hb = G.handle(Math.cos(0.6), Math.sin(0.6), { color: 'gold', label: 'b', constrain: (x, y) => { const t = Math.min(Math.max(Math.atan2(y, x), 0), 1.553); return [Math.cos(t), Math.sin(t)]; } });
        let st = null;
        v.render(() => {
          const k = kap.value, s1 = 1, s2 = 1 / k, th = Math.atan2(hb.y, hb.x), ph = (phi.value * Math.PI) / 180;
          const u = (j) => U.map((row) => row[j]), vc = (j) => V.map((row) => row[j]);
          const A = U.map((row) => [row[0] * s1 * V[0][0] + row[1] * s2 * V[0][1], row[0] * s1 * V[1][0] + row[1] * s2 * V[1][1]]);
          const x = [Math.cos(ph) * V[0][0] + Math.sin(ph) * V[0][1], Math.cos(ph) * V[1][0] + Math.sin(ph) * V[1][1]];
          const y = mv(A, x), ny = normV(y), eta = s1 / ny, w = u(2), b = y.map((t, i) => t + ny * Math.tan(th) * w[i]);
          const kb = (t) => k / (eta * Math.cos(t)), kA = (t) => k + (k * k * Math.tan(t)) / eta;
          const deg = (t) => (t * 180) / Math.PI;
          const ts = Array.from({ length: 180 }, (_, i) => (i / 179) * 1.5533);
          C.setView([0, 90], [1, 10 ** Math.ceil(Math.log10(kA(1.5533) * 2))]);
          C.path(ts.map((t) => [deg(t), kb(t)]), { color: 'blue', width: 2.4 });
          C.path(ts.map((t) => [deg(t), kA(t)]), { color: 'red', width: 2.4 });
          C.hline(k, { color: 'muted', width: 1, dash: true });
          C.text('κ(A)', 85, k * 1.4, { color: 'muted', size: 12 });
          C.vline(deg(th), { color: 'gold', width: 1.4, dash: true });
          // numerical worst case for δb: along u2
          const xb = M.lstsq(A, b), db = u(1).map((t) => t * 1e-6 * normV(b)), xb2 = M.lstsq(A, b.map((t, i) => t + db[i]));
          const sb = (normV(xb2.map((t, i) => t - xb[i])) / normV(xb)) / (1e-6);
          // local search for the worst δA (linearised map δA ↦ δx), ‖δA‖₂ = ρ‖A‖₂
          const Ai = M.pinv(A), Gi = M.inverse(mm(tp(A), A)), rr = b.map((t, i) => t - y[i]);
          const lin = (D) => { const t1 = mv(Ai, mv(D, x)), t2 = mv(Gi, mv(tp(D), rr)); return normV(t2.map((q, i) => q - t1[i])) / normV(x) * s1 / spec(M, D); };
          const rnd = v.rng(99);
          let D = u(1).map((q, i) => [q * x[0] + 1.0 * w[i] * vc(1)[0], q * x[1] + 1.0 * w[i] * vc(1)[1]]);
          let best = lin(D), step = 0.5;
          for (let it = 0; it < 500; it++) {
            const D2 = D.map((row) => row.map((q) => q + step * rnd.normal() * 0.3));
            const f2 = lin(D2);
            if (f2 > best) { best = f2; D = D2; } else if (it % 50 === 49) step *= 0.6;
          }
          C.dot(deg(th), Math.max(1.01, sb), { hollow: true, color: 'blue', r: 8 });
          C.dot(deg(th), Math.max(1.01, best), { hollow: true, color: 'red', r: 8 });
          // geometry
          const ex = Math.cos(th), ey = Math.sin(th);
          G.line(-0.1, 0, 1.2, 0, { color: 'green', width: 5, alpha: 0.35 });
          G.text('range(A)', 1.0, -0.09, { color: 'green', size: 12 });
          G.arrow(0, 0, ex, ey, { color: 'gold', width: 2.6 });
          G.arrow(0, 0, ex, 0, { color: 'blue', width: 2.6 });
          G.arrow(ex, 0, ex, ey, { color: 'red', width: 2.6 });
          G.path(Array.from({ length: 21 }, (_, i) => [0.28 * Math.cos((th * i) / 20), 0.28 * Math.sin((th * i) / 20)]), { color: 'ink', width: 1.4 });
          G.tex('\\theta', 0.36 * Math.cos(th / 2) + 0.03, 0.36 * Math.sin(th / 2), { color: 'ink' });
          G.tex('y=Ax', ex / 2, -0.04, { color: 'blue', dy: 12 }); G.tex('r', ex + 0.06, ey / 2, { color: 'red' });
          st = { k, eta, th: deg(th), kb: kb(th), kA: kA(th), sb, best, cos: Math.cos(th) };
        });
        v.legend([['blue', '$\\kappa_{b\\to x}=\\kappa/(\\eta\\cos\\theta)$'], ['red', '$\\kappa+\\kappa^2\\tan\\theta/\\eta$ (for $A\\to x$)'], ['gold', 'current $\\theta$'], ['muted', '$\\kappa(A)$', { dash: true }]]);
        v.readout(() => st ? `$\\kappa=${nm(st.k, 1)}$, $\\eta=${nm(st.eta, 2)}$, $\\theta=${nm(st.th, 1)}^{\\circ}$ ($\\cos\\theta=${nm(st.cos, 3)}$).\nPerturbing $b$: formula $\\kappa/(\\eta\\cos\\theta)=${nm(st.kb, 3)}$, worst found numerically $${nm(st.sb, 3)}$. Perturbing $A$: bound $\\kappa+\\kappa^2\\tan\\theta/\\eta=${nm(st.kA, 3)}$, worst found $${nm(st.best, 3)}$ (never above the bound).` : '');
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Phenomenon',
      name: 'Instability of the normal equations',
      statement: String.raw`Solving the least squares problem by forming and solving the normal equations $A^{\top}A\,x=A^{\top}b$ (with Cholesky) is **not backward stable**. Even when the residual is zero and the problem is well behaved, the computed solution has a relative error of order $\kappa(A)^2\epsilon_{\rm machine}$ (the condition number of $A^{\top}A$ is $\kappa(A)^2$, and forming $A^{\top}A$ already loses this much), whereas Householder QR (and modified Gram–Schmidt when the right-hand side is carried along as an extra column of $A$) give errors of order $\kappa(A)\epsilon_{\rm machine}$ when the residual is small, and $\kappa^2\tan\theta\,\epsilon_{\rm machine}$ at worst (3.13). When $\kappa(A)\gtrsim\epsilon_{\rm machine}^{-1/2}$, $A^{\top}A$ is no longer numerically positive definite and the Cholesky factorization may break down.`,
      idea: String.raw`The normal equations replace $A$ by $A^{\top}A$, whose singular values are $\sigma_j^2$: the condition number is squared (2.9, 3.2), and rounding $A^{\top}A$ to working precision alone perturbs it by $O(\epsilon_{\rm machine})\|A\|^2$, which relative to its smallest singular value $\sigma_n^2$ is $O(\kappa^2\epsilon_{\rm machine})$. A Householder QR solve works with the orthogonal factors, never squares the spread of the singular values, and is backward stable (3.10); its error is governed by the condition number of the least squares problem (3.13). Gram–Schmidt QR is competitive only if $b$ is treated as an extra column of $A$; forming $\tilde Q^{\top}b$ with the computed, non-orthogonal $\tilde Q$ inherits the loss of orthogonality (3.10) — the experiment below shows that variant as unstable as the normal equations.`,
      caption: String.raw`The same random $20\times6$ fitting problems (condition number $\kappa$, horizontal) are solved in $p$-bit arithmetic by Householder QR (blue), modified Gram–Schmidt with $b$ appended as a column of $A$ (teal), modified Gram–Schmidt followed by $\tilde Q^{\top}b$ (purple) and the normal equations with Cholesky (red); vertical: relative error of the solution against the true $x$. Dashed lines: $\kappa\epsilon_{\rm machine}$ and $\kappa^2\epsilon_{\rm machine}$. The red dots follow the steeper line and then stop altogether (hollow marks at the top: Cholesky breaks down because $A^{\top}A$ is numerically singular), twice as many digits lost; so does the purple variant of Gram–Schmidt, whose computed $\tilde Q$ is not orthogonal. Switch on a *large residual* ($\theta=45^{\circ}$) to see the $\kappa^2\tan\theta$ term that even QR methods cannot avoid (3.13).`,
      deps: ['nla-3.13', 'nla-2.9', 'nla-3.10'],
      tags: ['least-squares', 'stability', 'normal-equations'],
      refs: ['Trefethen–Bau Lec. 19'],
      viz(v) {
        const M = v.M;
        const pb = v.slider('significand bits $p$', 12, 26, 24, { int: true });
        const big = v.toggle('large residual ($\\theta=45^{\\circ}$)', false);
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [1, 1e10], y: [1e-17, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: 'condition number κ(A)', ylabel: 'relative error of the solution', title: 'three ways to solve the same least squares problems' });
        let st = null;
        v.render(() => {
          const p = pb.value, u = 2 ** -p, r = v.rng(seed * 59 + 3), m = 20, n = 6;
          const hh = [], gs = [], ga = [], ne = [], fails = [];
          let firstFail = null;
          for (const k of logGrid(0, 10, 22)) for (let t = 0; t < 2; t++) {
            const A = withSingular(M, r, m, n, geomSigma(n, k)), xt = Array.from({ length: n }, () => r.normal());
            let b = mv(A, xt);
            if (big.value) {
              const Q = M.qr(A, { thin: true }).Q, g = Array.from({ length: m }, () => r.normal()), pg = mv(Q, mv(tp(Q), g)), w = g.map((q, i) => q - pg[i]), s = normV(b) / normV(w);
              b = b.map((q, i) => q + w[i] * s);
            }
            const x1 = flQRSolve(A, b, p), x2 = flGSSolve(A, b, p, 'modified'), x3 = flNormalEq(A, b, p);
            const Aug = A.map((row, i) => [...row, b[i]]), G = flGS(Aug, 'modified', p), x4 = flBack(G.R.slice(0, n).map((row) => row.slice(0, n)), G.R.slice(0, n).map((row) => row[n]), p);
            hh.push([k, Math.min(relErr(x1, xt), 1e3)]); gs.push([k, Math.min(relErr(x2, xt), 1e3)]); ga.push([k, Math.min(relErr(x4, xt), 1e3)]);
            if (x3 && x3.every(isFinite)) ne.push([k, Math.min(relErr(x3, xt), 1e3)]); else { fails.push([k, 3e3]); if (firstFail === null) firstFail = k; }
          }
          S.path([[1, u], [1e10, 1e10 * u]], { color: 'muted', width: 1.4, dash: true });
          S.path([[1, u], [1e10, 1e20 * u]], { color: 'muted', width: 1.4, dash: true, alpha: 0.7 });
          S.hline(1, { color: 'red', width: 1.1, dash: true, alpha: 0.6 });
          S.text('κ ε', 6e8, 6e8 * u * 4, { color: 'muted', size: 13 }); S.text('κ² ε', 2e4, 4e8 * u * 3, { color: 'muted', size: 13 });
          S.dots(ne, { color: 'red', r: 3.6 });
          S.dots(gs, { color: 'purple', r: 3.2 });
          S.dots(ga, { color: 'teal', r: 3.2 });
          S.dots(hh, { color: 'blue', r: 3.2 });
          S.dots(fails, { color: 'red', r: 5, hollow: true });
          st = { u, firstFail, kmax: 1 / Math.sqrt(u) };
        });
        v.legend([['blue', 'Householder QR', { dot: true }], ['teal', 'MGS on the augmented matrix $(A\\ b)$', { dot: true }], ['purple', 'MGS, then $\\tilde Q^{\\top}b$', { dot: true }], ['red', 'normal equations (Cholesky)', { dot: true }], ['muted', '$\\kappa\\epsilon$, $\\kappa^2\\epsilon$', { dash: true }]]);
        v.readout(() => st ? `$\\epsilon_{\\rm machine}=${sciT(st.u)}$; the normal equations are expected to break down near $\\kappa\\approx\\epsilon_{\\rm machine}^{-1/2}=${sciT(st.kmax)}$${st.firstFail ? `; first breakdown observed at $\\kappa=${sciT(st.firstFail)}$` : ''}.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Paper',
      name: 'Numerical inverting of matrices of high order',
      paper: { authors: 'John von Neumann and H. H. Goldstine', year: 1947, title: 'Numerical inverting of matrices of high order', venue: 'Bulletin of the American Mathematical Society 53 (11): 1021–1099', doi: '10.1090/S0002-9904-1947-08909-6' },
      introduces: ['nla-3.2'],
      statement: String.raw`Von Neumann and Goldstine's 1947 paper studies rounding error in matrix inversion. Its bibliographic record is given above. This entry's detailed historical summary remains under source review: the original publisher PDF was unavailable during this audit. The visualization is a separate modern experiment with partial-pivoted elimination, not a reproduction of the paper's algorithms, tables or bounds.`,
      idea: String.raw`Conditioning separates sensitivity of the input matrix from errors introduced by a numerical algorithm (3.2–3.3). The experiment compares error with the scale $\kappa_2(A)u$; that scale alone is not a universal bound for elimination and samples need not lie on a diagonal. Growth, dimension, the right-hand sides and input rounding also matter. Relative inverse error can exceed one.`,
      caption: String.raw`Simulated $p$-bit partial-pivoted elimination first rounds its input. Orange: relative inverse error; green: unnormalized residual $\|AX-I\|_2$ against the unrounded input. For Hilbert matrices, the reference inverse is the known integer inverse of the **exact rational** matrix, converted to doubles; $\kappa_2$ is estimated from the largest singular values of that matrix and its reference inverse. Thus its error includes binary input approximation and low-precision input rounding. Random-matrix inverses and condition numbers use double-precision references. Purple $\kappa u$, grey $4^nu$ and the scatter diagonal are comparison scales, not validated paper bounds. The axes expand to show all finite samples. A missing solve is reported; points are not joined across failures.`,
      deps: ['nla-4.1', 'nla-1.4', 'nla-3.1'],
      tags: ['history', 'matrix-inversion', 'rounding-error'],
      refs: [],
      verify: true,
      scope: 'Original 1947 text unavailable (publisher HTTP 403); historical source review remains open. Modern finite numerical experiment only. Reference inverses, norms and simulated arithmetic use underlying JavaScript doubles; this is not arbitrary precision or an exact reproduction of the historical analysis.',
      viz(v) {
        const M = v.M;
        const fam = v.select('matrices', [{ value: 'rand', label: 'random Gaussian' }, { value: 'hil', label: 'Hilbert' }], 'hil');
        const pb = v.slider('significand bits $p$', 12, 26, 24, { int: true });
        const nmax = v.slider('largest order $N$', 6, 24, 16, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [1, 25], y: [1e-17, 1e12], ylog: true, axes: 'box', gutter: true, height: 380, minWidth: 340, xlabel: 'order n', ylabel: 'relative error of the computed inverse', title: 'error of the computed inverse against the order' });
        const R = v.stage({ x: [1e-12, 1e8], y: [1e-12, 1e8], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, minWidth: 320, xlabel: 'κ(A)·ε_machine', ylabel: 'error of the inverse', title: 'measured error against the comparison scale κ·ε' });
        const cache = {};
        const trial = (kind, n, p, s) => {
          const key = `${kind}-${n}-${p}-${s}`;
          if (Object.hasOwn(cache,key)) return cache[key];
          let A, Ainv, kappa;
          if (kind === 'hil') { A = hilbert(n); Ainv = hilbertInv(n); kappa = hilbertKappa(M, n); } else {
            const r = v.rng(s * 1009 + n * 7); A = Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()));
            Ainv = M.inverse(A); kappa = spec(M, A) * spec(M, Ainv);
          }
          const X = flSolve(A, eye(n), p);
          if (!X || !X.flat().every(Number.isFinite)) return (cache[key] = {n,kappa,failed:true});
          const err = spec(M, sub(X, Ainv)) / spec(M, Ainv), Ap = A, res = spec(M, sub(mm(Ap, X), eye(n)));
          return (cache[key] = { n, kappa, err, res });
        };
        let st = null;
        v.render(() => {
          const p = pb.value, u = 2 ** -p, N = nmax.value, k = fam.value;
          L.setView([1, N + 1], [1e-17, 1e12]);
          const main = [], resid = [], kap = [], four = [], all = [], allH = []; let failed = 0;
          for (let n = 2; n <= N; n++) {
            const t = trial(k, n, p, seed);
            if(t.failed) failed++; else {main.push([n, Math.max(1e-17, t.err)]); resid.push([n, Math.max(1e-17, t.res)]);}
            kap.push([n, t.kappa * u]); four.push([n, 4 ** n * u]);
            for (let s2 = 0; s2 < 2; s2++) { const t2 = trial('rand', n, p, seed + 100 + s2); if (!t2.failed) all.push([t2.kappa * u, Math.max(1e-17, t2.err)]); }
            const t3 = trial('rand', n, p, seed); if (!t3.failed) all.push([t3.kappa * u, Math.max(1e-17, t3.err)]);
            const th = trial('hil', n, p, seed); if (!th.failed) allH.push([th.kappa * u, Math.max(1e-17, th.err)]);
          }
          const ymax = Math.max(1,...main.concat(resid,kap,four).map(q=>q[1]))*10;
          L.setView([1,N+1],[1e-17,ymax]);
          const scatter=all.concat(allH), hi=Math.max(1,...scatter.flat())*10, lo=Math.min(1e-12,...scatter.flat().filter(x=>x>0))/10;
          R.setView([lo,hi],[lo,hi]);
          L.path(four, { color: 'muted', width: 1.6 });
          L.path(kap, { color: 'purple', width: 2, dash: true });
          L.dots(resid, { color: 'green', r: 2.4 });
          for(let i=1;i<main.length;i++) if(main[i][0]===main[i-1][0]+1) L.path([main[i-1],main[i]],{color:'orange',width:2.4}); L.dots(main, { color: 'orange', r: 3.6 });
          L.hline(1, { color: 'red', width: 1.2, dash: true, alpha: 0.7 });
          L.text('4ⁿ ε', Math.min(N - 3, 12), Math.min(4 ** Math.min(N - 3, 12) * u * 5, 1e10), { color: 'muted', size: 12 });
          L.text('κ ε', 3.2, (kap[1] ? kap[1][1] : 1e-10) * 12, { color: 'purple', size: 12 });
          R.path([[lo, lo], [hi, hi]], { color: 'muted', width: 1.6 });
          R.hline(1, { color: 'red', width: 1.2, dash: true, alpha: 0.7 });
          R.dots(all, { color: 'orange', r: 3.4 });
          R.dots(allH, { color: 'blue', r: 3.4 });
          const worst = Math.max(...all.concat(allH).filter((q) => q[0] < 0.01).map((q) => q[1] / q[0]), 0);
          const tl = trial(k, N, p, seed);
          st = { u, N, worst, kappaN: tl.kappa, errN: tl.err, resN: tl.res, failed, lastFailed: tl.failed };
        });
        v.legend([['orange', 'error of the computed inverse'], ['green', 'residual $\\|AX-I\\|$'], ['purple', '$\\kappa\\,\\epsilon_{\\rm machine}$', { dash: true }], ['muted', '$4^{n}\\epsilon_{\\rm machine}$']]);
        v.readout(() => st ? `$u=2^{-${pb.value}}=${sciT(st.u)}$. At $n=${st.N}$: estimated reference $\\kappa_2=${sciT(st.kappaN)}$, ${st.lastFailed ? '**rounded elimination failed**' : `relative inverse error $${sciT(st.errN)}$`}. Selected-family failures: ${st.failed}. Across the displayed successful samples with estimated $\\kappa u<0.01$, maximum error / $(\\kappa u)$: $${nm(st.worst, 2)}$. This is a sample statistic, not a universal bound or a result from the 1947 paper.` : '');
      },
    },
  ],
};
