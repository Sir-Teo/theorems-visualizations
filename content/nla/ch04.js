// Numerical Linear Algebra — Chapter 4: Gaussian elimination and Cholesky
// Part 1 (this file): 4.1–4.6 — LU factorization, the failure of elimination without pivoting, partial pivoting, the growth factor,
// its exponential worst case and why it almost never happens. Part 2 (4.7–4.12) is in ch04-b.js.
import {
  nm, nmc, sciT, dot, mv, mm, tp, eye, TAU, fl, flM, flV, hilbert,
  luFactor, luSolveFl, backErr, wilkinsonGrowth, gaussMat, relErr, normV, withSingular, geomSigma,
} from './ch04.shared.js';

const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const quant = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const maxAbsM = (A) => Math.max(...A.flat().map(Math.abs));
const sub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const TRE = [[2, 1, 1, 0], [4, 3, 3, 1], [8, 7, 9, 5], [6, 7, 9, 8]];
const sub2 = (n) => String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');

export default {
  collection: 'nla',
  chapter: 4,
  title: 'Gaussian elimination and Cholesky',
  summary: String.raw`Gaussian elimination factors $A=LU$ and solves square systems in about $2n^3/3$ operations. Without pivoting it can fail on perfectly well-conditioned matrices; partial pivoting fixes this in practice, although the worst-case growth factor is exponential — one of numerical analysis' great puzzles of stability in practice. Symmetric positive definite systems use Cholesky, which needs no pivoting at all, and banded and sparse systems exploit their structure.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Algorithm',
      name: 'Gaussian elimination as LU factorization',
      statement: String.raw`Gaussian elimination turns $A\in\mathbb R^{n\times n}$ into an upper triangular $U$ by subtracting multiples of row $k$ from the rows below it. Step $k$ uses the multipliers $\ell_{ik}=a^{(k)}_{ik}/a^{(k)}_{kk}$ ($i>k$) and sets
$$a^{(k+1)}_{ij}=a^{(k)}_{ij}-\ell_{ik}\,a^{(k)}_{kj}\qquad(i,j>k).$$
Collecting the multipliers in a unit lower triangular $L$ gives $A=LU$, with $L=L_1^{-1}\cdots L_{n-1}^{-1}$ simply the multipliers placed in their columns. The factorization exists (without row exchanges) iff all leading principal minors $\det A_{1:k,1:k}$, $k<n$, are nonzero, and is then unique. The cost is $\sum_k 2(n-k)^2\approx\tfrac23 n^3$ flops; afterwards $Ax=b$ is solved by $Ly=b$, $Ux=y$ at $O(n^2)$ each.`,
      idea: String.raw`Each elimination step is multiplication by a lower triangular matrix $L_k=I-\ell_k e_k^{\top}$ that differs from the identity in column $k$ only; $L_{n-1}\cdots L_1A=U$. The inverse of $L_k$ just flips the signs of its multipliers, and — the small miracle — the product $L_1^{-1}L_2^{-1}\cdots$ simply collects the columns side by side with no cross terms, so the multipliers can be stored in the zeros they create. The operation count is dominated by the rank-one updates of the shrinking trailing block (the $2(n-k)^2$ flops of step $k$, 1.11).`,
      caption: String.raw`Step through elimination of a $4\times4$ matrix (a classical textbook example, or a random one). Left: the working matrix; the zeros created by step $k$ are replaced by the multipliers $\ell_{ik}$ (gold), the rows still being reduced are blue. Right: the factors $L$ and $U$ as they stand; at the last step the product $LU$ is compared with $A$. The flop counter is compared with the leading-order $2n^3/3$.`,
      deps: ['nla-1.1', 'nla-1.11'],
      credit: 'Chinese "Nine Chapters", c. 200 BCE–100 CE; Gauss, c. 1809; matrix formulation as LU: Turing, 1948',
      tags: ['lu', 'elimination'],
      refs: ['Trefethen–Bau Lec. 20', 'Golub–Van Loan ch. 3'],
      verify: true,
      viz(v) {
        const kind = v.select('matrix', [{ value: 'tb', label: 'textbook example' }, { value: 'rand', label: 'random' }], 'tb');
        let seed = 1;
        v.button('Resample', () => { seed++; kind.value = 'rand'; S2.reset(); });
        const n = 4;
        const getA = () => (kind.value === 'tb' ? TRE : gaussMat(v.rng(seed * 13), n).map((r) => r.map((x) => Math.round(x * 4))));
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'working matrix', minWidth: 300 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'factors $L$ and $U$', minWidth: 300 });
        const T1 = v.table(s1, { rows: n, cols: n, maxCell: 62, size: 17 });
        const TL = v.table(s2, { rows: n, cols: n, maxCell: 40, size: 14, region: [0, 0, 0.5, 1] });
        const TU = v.table(s2, { rows: n, cols: n, maxCell: 40, size: 14, region: [0.5, 0, 1, 1] });
        let Acur = getA(), f = null;
        const mk = () => { Acur = getA(); f = luFactor(Acur, { pivot: false, record: true }); return f.steps.filter((s) => s.kind !== 'pivot').map((s, idx, arr) => ({ ...s, line: s.k < 0 ? [] : [2, 3, 4], note: s.k < 0 ? String.raw`The matrix $A$. Step $k$ will clear column $k$ below the diagonal.` : String.raw`Step $k=${s.k + 1}$: pivot $a_{${s.k + 1}${s.k + 1}}$; multipliers $\ell_{i${s.k + 1}}=a_{i${s.k + 1}}/a_{${s.k + 1}${s.k + 1}}$ are stored, then rows $i>${s.k + 1}$ lose $\ell_{i${s.k + 1}}\times$ row ${s.k + 1}.` })); };
        const S2 = v.steps({ frames: mk, still: 3, code: ['for k = 1 … n−1', '  for i = k+1 … n', '    ℓ_ik ← a_ik / a_kk        ▷ store in place of the zero', '    a_i,k+1:n ← a_i,k+1:n − ℓ_ik · a_k,k+1:n', 'return L (below the diagonal) and U (on and above)'] });
        v.render(() => {
          const fr = S2.frame, W = fr.W, k = fr.k;
          if (!W) return;
          T1.draw({
            value: (i, j) => W[i][j],
            fill: (i, j) => (j <= k && i > j ? ['gold', 0.4] : i <= k ? ['green', 0.14] : i > k && j > k ? ['blue', 0.12] : null),
            highlight: k >= 0 && k < n - 1 ? [[k, k, 'red']] : [],
            rowLabels: (i) => `row ${i + 1}`, colLabels: (j) => `${j + 1}`,
          });
          const Lc = W.map((r, i) => r.map((x, j) => (i === j ? 1 : j < i && j <= k ? x : 0)));
          const Uc = W.map((r, i) => r.map((x, j) => (j >= i || i > k + 0 ? (j >= i ? x : 0) : 0)));
          TL.draw({ value: (i, j) => Lc[i][j], fill: (i, j) => (j < i && j <= k ? ['gold', 0.4] : null), textColor: (i, j) => (j > i ? 'faint' : null) });
          TU.draw({ value: (i, j) => Uc[i][j], fill: (i, j) => (j >= i && i <= k ? ['green', 0.14] : j >= i ? ['blue', 0.1] : null), textColor: (i, j) => (j < i ? 'faint' : null) });
        });
        v.readout(() => {
          const fr = S2.frame; if (!fr.W) return '';
          const done = fr.k >= n - 2 && fr.kind === 'elim';
          let fl0 = 0; for (let k = 0; k <= fr.k && fr.kind === 'elim'; k++) fl0 += (n - k - 1) * (1 + 2 * (n - k - 1));
          const LU = mm(f.L, f.U), err = maxAbsM(sub(LU, Acur));
          return `Flops so far: **${fl0}** of **${f.flops}** in total (leading order $2n^3/3=${nm((2 * n ** 3) / 3, 1)}$; the lower-order terms matter at $n=4$). ` + (done ? `\nFinished: $\\max|LU-A|=${err < 1e-13 ? '0' : sciT(err)}$, $\\max|\\ell_{ij}|=${nm(f.mult, 2)}$.` : `\nMultipliers are free to be large — nothing bounds them yet (4.2, 4.3).`);
        });
        v.legend([['gold', 'multipliers $\\ell_{ik}$'], ['green', 'finished rows of $U$'], ['blue', 'rows still being reduced']]);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Paradox',
      name: 'Elimination without pivoting fails on easy matrices',
      statement: String.raw`Let $A=\begin{pmatrix}\varepsilon&1\\1&1\end{pmatrix}$ and $b=(1,2)^{\top}$ with $0<\varepsilon\ll1$. The problem is perfectly conditioned, $\kappa_2(A)\to\tfrac{3+\sqrt5}{2}\approx2.6$ as $\varepsilon\to0$, and the exact solution is $x=\frac1{1-\varepsilon}(1,\,1-2\varepsilon)^{\top}\approx(1,1)^{\top}$. Elimination without row exchanges uses the multiplier $\ell_{21}=1/\varepsilon$ and gets $u_{22}=1-1/\varepsilon$, which in floating point rounds to $-1/\varepsilon$ as soon as $\varepsilon<\epsilon_{\rm machine}$ (the $1$ is lost); the computed $\hat x_2=1$ is right but $\hat x_1=(1-\hat x_2)/\varepsilon=0$ has $100\%$ relative error. Exchanging the two rows first (partial pivoting) gives multiplier $\varepsilon$ and an accurate solution. So elimination without pivoting is **unstable**: the failure is a property of the algorithm, not of the problem.`,
      idea: String.raw`A tiny pivot produces a huge multiplier, and the huge multiplier magnifies the entries of the second row so that the information they carried (the "1") falls below rounding level and is destroyed. Equivalently, the computed factors $\tilde L,\tilde U$ are the exact factors of a matrix that differs from $A$ by an $O(1)$ amount — here the $(2,2)$ entry is replaced by $0$ — so the backward error is not small (3.8). Swapping rows makes every multiplier at most $1$ in modulus and removes the mechanism (4.3).`,
      caption: String.raw`Left: forward error of the computed solution of $\begin{pmatrix}\varepsilon&1\\1&1\end{pmatrix}x=(1,2)^{\top}$ against $\varepsilon$, in $p$-bit arithmetic, without (red) and with (green) row exchange; the dashed line marks the chosen $\varepsilon$. Right: the two lines $\varepsilon x_1+x_2=1$ and $x_1+x_2=2$ cross at a healthy angle — the problem is easy — and the computed solutions (red and green dots) against the exact one. Slide $\varepsilon$ below $2^{-p}$ and the red dot jumps to the wrong place.`,
      deps: ['nla-4.1', 'nla-3.9'],
      credit: 'Standard example; see Trefethen–Bau Lec. 21',
      tags: ['pivoting', 'stability'],
      refs: ['Trefethen–Bau Lec. 21', 'Higham, Accuracy and Stability §9.1'],
      viz(v) {
        const M = v.M;
        const eps = v.slider('$\\varepsilon$', 1e-14, 1, 1e-9, { log: true, sig: 2 });
        const pb = v.slider('significand bits $p$', 8, 53, 24, { int: true });
        const solve = (e, p, pivot) => {
          const A = [[e, 1], [1, 1]], b = [1, 2], f = luFactor(A, { pivot, p });
          return f.ok ? luSolveFl(f, b, p) : null;
        };
        const exact = (e) => [1 / (1 - e), 2 - 1 / (1 - e)];
        const S1 = v.stage({ x: [1e-14, 1], y: [1e-17, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'ε', ylabel: 'forward error', title: 'error of the computed solution' });
        const S2 = v.stage({ x: [-1.2, 3], y: [-0.5, 2.8], equal: true, axes: true, height: 340, title: 'the system and its computed solutions' });
        let st = null;
        v.render(() => {
          const p = pb.value, grid = Array.from({ length: 57 }, (_, i) => 10 ** (-14 + (14 * i) / 56));
          const pts = (pivot) => grid.map((e) => { const x = solve(e, p, pivot); return x ? [e, Math.max(1e-17, relErr(x, exact(e)))] : null; }).filter(Boolean);
          S1.hline(2 ** -p, { color: 'muted', width: 1, dash: true }); S1.text('2⁻ᵖ', 2e-14, 2 ** -p * 2.5, { color: 'muted', size: 12 });
          S1.path(pts(false), { color: 'red', width: 2.4 }); S1.path(pts(true), { color: 'green', width: 2.4 });
          S1.vline(eps.value, { color: 'accent', width: 1.4, dash: true });
          const e = eps.value, xr = solve(e, p, false), xg = solve(e, p, true), xe = exact(e);
          S2.fn((x) => 1 - e * x, { color: 'blue', width: 2 }); S2.fn((x) => 2 - x, { color: 'orange', width: 2 });
          S2.tex('\\varepsilon x_1+x_2=1', 1.4, 0.55, { color: 'blue', size: 13 }); S2.tex('x_1+x_2=2', 2.0, 0.45, { color: 'orange', size: 13 });
          S2.dot(xe[0], xe[1], { color: 'ink', hollow: true, r: 9 });
          if (xr) S2.dot(xr[0], xr[1], { color: 'red', r: 6, label: 'no pivoting', labelPos: 'sw' });
          if (xg) S2.dot(xg[0], xg[1], { color: 'green', r: 4, label: 'pivoting', labelPos: 'ne' });
          st = { xr, xg, kappa: M.svd([[e, 1], [1, 1]]).S[0] / M.svd([[e, 1], [1, 1]]).S[1], er: xr ? relErr(xr, xe) : NaN, eg: xg ? relErr(xg, xe) : NaN, u: 2 ** -p };
        });
        v.legend([['red', 'no row exchange'], ['green', 'partial pivoting'], ['ink', 'exact solution', { dot: true }]]);
        v.readout(() => st ? `$\\kappa_2(A)=${nm(st.kappa, 3)}$, $\\epsilon_{\\rm machine}=2^{-${pb.value}}=${sciT(st.u)}$. Computed $\\hat x$ without pivoting: $(${st.xr ? st.xr.map((t) => nm(t, 4)).join(',\\ ') : 'fail'})$, error $${sciT(st.er)}$; with pivoting: $(${st.xg.map((t) => nm(t, 4)).join(',\\ ')})$, error $${sciT(st.eg)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Algorithm',
      name: 'Partial pivoting: PA = LU',
      statement: String.raw`At step $k$ of elimination, choose as pivot the entry of largest modulus in column $k$ on or below the diagonal, $|a^{(k)}_{pk}|=\max_{i\ge k}|a^{(k)}_{ik}|$, and exchange rows $k$ and $p$ before eliminating. This yields
$$PA=LU,$$
with $P$ a permutation matrix, $L$ unit lower triangular and $U$ upper triangular, and **every multiplier satisfies $|\ell_{ij}|\le1$**. The factorization exists for every nonsingular $A$ (and, with a zero pivot column, even for singular ones). Searching the columns costs $O(n^2)$ comparisons in total, negligible against the $\tfrac23n^3$ flops. In practice $Ax=b$ is solved as $Ly=Pb$, $Ux=y$.`,
      idea: String.raw`Row exchanges cannot break the structure of 4.1, because swapping rows before the elimination is the same as having started with a permuted matrix; one can push all the permutations to the left, $P=P_{n-1}\cdots P_1$, at the cost of permuting the multipliers stored so far. If the entire column below the diagonal is zero the matrix is singular, otherwise a nonzero pivot exists. Choosing the largest one makes $|\ell_{ik}|=|a_{ik}|/|a_{kk}|\le1$ by construction; this is what prevents the blow-up of 4.2.`,
      caption: String.raw`Step through partial pivoting on a $5\times5$ matrix. First the candidates in the current column are marked (gold) and the largest is chosen (red); then the two rows are exchanged (the row labels follow the permutation) and the column is cleared. The dots on the right are $|\ell_{ij}|$ computed so far (green, always $\le1$) against the multipliers elimination *without* pivoting would have used (red rings, no bound). The preset "small pivot" has a tiny leading entry.`,
      deps: ['nla-4.2'],
      credit: 'Pivoting is classical; analysed by Wilkinson, 1961',
      tags: ['pivoting', 'lu'],
      refs: ['Trefethen–Bau Lec. 21', 'Golub–Van Loan ch. 3'],
      viz(v) {
        const n = 5;
        const kind = v.select('matrix', [{ value: 'rand', label: 'random' }, { value: 'small', label: 'small pivot' }], 'rand');
        let seed = 3;
        v.button('Resample', () => { seed++; S3.reset(); });
        kind.el && kind.el.addEventListener && 0;
        const getA = () => {
          const A = gaussMat(v.rng(seed * 7), n).map((r) => r.map((x) => Math.round(x * 5) / 2));
          if (kind.value === 'small') A[0][0] = 0.02;
          return A;
        };
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: 'working matrix (multipliers stored below the diagonal)', minWidth: 330 });
        const s2 = v.stage({ x: [0, 11], y: [0.003, 300], ylog: true, axes: 'box', gutter: true, height: 340, title: 'multipliers $|\\ell_{ij}|$', minWidth: 260, xlabel: 'multiplier number', ylabel: '|ℓ|' });
        const T = v.table(s1, { rows: n, cols: n, maxCell: 56, size: 15 });
        let Acur, fp, fn_;
        const kindOf = {};
        const S3 = v.steps({
          frames: () => {
            Acur = getA(); fp = luFactor(Acur, { pivot: true, record: true }); fn_ = luFactor(Acur, { pivot: false });
            return fp.steps.map((s) => ({
              ...s,
              line: s.kind === 'pivot' ? [2] : s.kind === 'swap' ? [3] : s.kind === 'elim' ? [4, 5, 6] : [],
              note: s.kind === 'start' ? String.raw`The matrix $A$ with its rows in the original order.` : s.kind === 'pivot' ? String.raw`Column ${s.k + 1}: the largest $|a_{ik}|$ for $i\ge${s.k + 1}$ sits in position ${s.piv + 1} of the current ordering${s.piv === s.k ? ' (already on the diagonal)' : ''}.` : s.kind === 'swap' ? String.raw`Exchange rows ${s.k + 1} and ${s.piv + 1} (stored multipliers travel with their rows).` : String.raw`Eliminate below the pivot; every multiplier is at most $1$.`,
            }));
          },
          still: 4,
          code: ['for k = 1 … n−1', '  p ← argmax_{i ≥ k} |a_ik|        ▷ pivot search', '  swap rows k and p', '  for i = k+1 … n', '    ℓ_ik ← a_ik / a_kk           ▷ |ℓ_ik| ≤ 1', '    a_i,k+1:n ← a_i,k+1:n − ℓ_ik a_k,k+1:n'],
        });
        v.render(() => {
          const fr = S3.frame, W = fr.W, k = fr.k;
          if (!W) return;
          const cand = (i, j) => (fr.kind === 'pivot' || fr.kind === 'swap') && j === k && i >= k;
          T.draw({
            value: (i, j) => W[i][j],
            fill: (i, j) => (cand(i, j) ? ['gold', i === fr.piv ? 0.65 : 0.25] : fr.kind === 'elim' && j <= k && i > j ? ['green', 0.3] : null),
            highlight: fr.kind === 'pivot' || fr.kind === 'swap' ? [[fr.kind === 'swap' ? k : fr.piv, k, 'red']] : [],
            rowLabels: (i) => `row ${fr.perm[i] + 1}`, colLabels: (j) => `${j + 1}`,
          });
          const mine = [], none = [];
          let c = 0;
          const last = fr.kind === 'elim' ? fr.k : fr.k - 1;
          for (let j = 0; j < n - 1; j++) for (let i = j + 1; i < n; i++) {
            c++;
            if (j <= last) mine.push([c, Math.max(0.0031, Math.abs(W[i][j]))]);
            none.push([c, Math.max(0.0031, Math.abs(fn_.L[i][j]))]);
          }
          s2.hline(1, { color: 'muted', width: 1.4, dash: true }); s2.text('bound 1', 8.4, 1.5, { color: 'muted', size: 12 });
          s2.dots(none.map(([x, y]) => [x, Math.min(y, 290)]), { color: 'red', r: 5, hollow: true });
          s2.dots(mine, { color: 'green', r: 4.5 });
        });
        v.legend([['green', '$|\\ell_{ij}|$ with pivoting', { dot: true }], ['red', '$|\\ell_{ij}|$ without pivoting', { dot: true }], ['gold', 'pivot candidates']]);
        v.readout(() => {
          const fr = S3.frame; if (!fr.W) return '';
          let m = 0; if (fr.kind === 'elim') for (let j = 0; j <= fr.k; j++) for (let i = j + 1; i < n; i++) m = Math.max(m, Math.abs(fr.W[i][j]));
          const fin = fr.kind === 'elim' && fr.k === n - 2;
          const PA = fp.perm.map((r) => Acur[r]), err = maxAbsM(sub(mm(fp.L, fp.U), PA));
          return `Largest multiplier so far with pivoting: $${nm(m, 3)}$ (never above $1$); without pivoting the largest would be $${nm(fn_.mult, 1)}$.` + (fin ? `\nDone: $\\max|PA-LU|=${err < 1e-13 ? '0' : sciT(err)}$, permutation $(${fp.perm.map((q) => q + 1).join(',\\,')})$.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Growth factor and stability of Gaussian elimination',
      statement: String.raw`Let $\hat L,\hat U$ be the factors computed by Gaussian elimination (with partial pivoting) in floating point and $\rho=\max_{i,j}|u_{ij}|/\max_{i,j}|a_{ij}|$ the **growth factor**. Then $\hat L\hat U=PA+\delta A$ with
$$\frac{\|\delta A\|}{\|A\|}=O(\rho\,\epsilon_{\rm machine}),$$
the constant depending polynomially on $n$ (and, for the solution of $Ax=b$ via $\hat L,\hat U$ and two triangular solves, the backward error is again $O(\rho\,\epsilon_{\rm machine})$). Hence elimination is backward stable **if and only if $\rho$ is of moderate size**; with partial pivoting $\rho\le2^{n-1}$ always, but typically $\rho$ is tiny (4.5, 4.6). Without pivoting $\rho$ is unbounded (4.2).`,
      idea: String.raw`In the update $a_{ij}\leftarrow a_{ij}-\ell_{ik}a_{kj}$ every operation commits a relative error $\epsilon_{\rm machine}$ in a quantity of size at most $\rho\max|a|$ (the intermediate entries are the entries of $U$ at an earlier stage), and each entry of $L\hat U$ accumulates at most $n$ such errors. Summing gives an absolute error $O(n\rho\,\epsilon_{\rm machine}\max|a|)$ entrywise in $\delta A$; the cheap bound $|\ell_{ij}|\le1$ keeps the $L$-part harmless. So everything hinges on how large the entries of $U$ get. A proof is in Wilkinson's 1961 paper; the constants here are not tracked.`,
      caption: String.raw`Each dot is one solve of $Ax=b$ for a random $n\times n$ matrix in $p$-bit arithmetic: horizontal, the growth factor $\rho$; vertical, the backward error $\|b-A\hat x\|_\infty/(\|A\|_\infty\|\hat x\|_\infty)$ in units of $\epsilon_{\rm machine}$. Red: elimination without pivoting, whose growth factor ranges over orders of magnitude and drags the error with it (below the dashed line $y=\rho$). Green: the same matrices with partial pivoting — all with tiny $\rho$ and error $\approx\epsilon_{\rm machine}$. Purple: the Wilkinson matrices of 4.5 for $n=5,\dots,40$, where $\rho=2^{n-1}$.`,
      deps: ['nla-4.3', 'nla-3.8'],
      credit: 'J. H. Wilkinson, 1961',
      links: { doi: 'https://doi.org/10.1145/321075.321076' },
      tags: ['growth-factor', 'stability'],
      refs: ['Trefethen–Bau Lec. 22', 'Wilkinson 1961, J. ACM 8: 281–330'],
      viz(v) {
        const M = v.M;
        const pb = v.slider('significand bits $p$', 12, 40, 24, { int: true });
        const nn = v.slider('dimension $n$ (random matrices)', 4, 24, 12, { int: true });
        const showW = v.toggle('Wilkinson matrices', true);
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [0.7, 1e12], y: [0.01, 1e12], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: 'growth factor ρ', ylabel: 'backward error / ε', title: 'backward error against growth factor' });
        let st = null;
        const cache = {};
        const data = (p, n, sd) => {
          const key = `${p}/${n}/${sd}`;
          if (cache[key]) return cache[key];
          const r = v.rng(sd * 101 + n), red = [], green = [], pur = [], u = 2 ** -p;
          const one = (A, piv) => { const f = luFactor(A, { pivot: piv, p }); if (!f.ok) return null; const xt = Array.from({ length: n }, () => r.normal()), b = mv(A, xt), x = luSolveFl(f, b, p); return [f.rho, backErr(A, x, b) / u]; };
          for (let t = 0; t < 160; t++) { const A = gaussMat(r, n), a = one(A, false), b = one(A, true); if (a && a[1] < 1e11) red.push(a); if (b) green.push(b); }
          for (let m = 5; m <= 40; m++) { const W = wilkinsonGrowth(m), f = luFactor(W, { pivot: true, p }), xt = Array.from({ length: m }, () => r.normal()), b = mv(W, xt), x = luSolveFl(f, b, p); pur.push([f.rho, backErr(W, x, b) / u]); }
          return (cache[key] = { red, green, pur });
        };
        v.render(() => {
          const d = data(pb.value, nn.value, seed), cl = (a) => a.map(([x, y]) => [x, Math.max(0.02, y)]);
          S.path([[0.7, 0.7], [1e12, 1e12]], { color: 'muted', width: 1.4, dash: true });
          S.text('error = ρ ε', 3e9, 6e9, { color: 'muted', size: 12 });
          S.hline(1, { color: 'faint', width: 1, dash: true });
          if (showW.value) S.dots(cl(d.pur), { color: 'purple', r: 4 });
          S.dots(cl(d.red), { color: 'red', r: 3 });
          S.dots(cl(d.green), { color: 'green', r: 3.2 });
          const corr = (() => { const xs = d.red.map((q) => Math.log10(q[0])), ys = d.red.map((q) => Math.log10(Math.max(1e-3, q[1]))), mx = M.mean(xs), my = M.mean(ys); let sxy = 0, sxx = 0, syy = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); })();
          st = { corr, rmed: median(d.red.map((q) => q[0])), rmax: Math.max(...d.red.map((q) => q[0])), gmax: Math.max(...d.green.map((q) => q[0])), gerr: median(d.green.map((q) => q[1])), over: d.red.filter((q) => q[1] > q[0] * 3).length + d.green.filter((q) => q[1] > q[0] * 3).length };
        });
        v.legend([['red', 'no pivoting', { dot: true }], ['green', 'partial pivoting', { dot: true }], ['purple', 'Wilkinson matrices', { dot: true }], ['muted', 'error = ρ ε', { dash: true }]]);
        v.readout(() => st ? `Without pivoting: median $\\rho=${nm(st.rmed, 1)}$, largest $\\rho=${st.rmax > 1e4 ? sciT(st.rmax) : nm(st.rmax, 0)}$; correlation of $\\log\\rho$ with $\\log$(error) $=${nm(st.corr, 2)}$. With pivoting: largest $\\rho=${nm(st.gmax, 1)}$, median error $${nm(st.gerr, 2)}\\,\\epsilon_{\\rm machine}$. Points more than $3\\times$ above the line $\\rho\\epsilon$: ${st.over}.` : '');
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Paradox',
      name: 'Exponential worst-case growth with partial pivoting',
      statement: String.raw`Let $W_n$ have $1$ on the diagonal and in the last column, $-1$ everywhere below the diagonal and $0$ elsewhere:
$$W_4=\begin{pmatrix}1&0&0&1\\-1&1&0&1\\-1&-1&1&1\\-1&-1&-1&1\end{pmatrix}.$$
Gaussian elimination with partial pivoting performs **no** row exchanges on $W_n$ (ties are broken in favour of the diagonal), every multiplier is $-1$, and the last column doubles at each step: the final pivot is $u_{nn}=2^{n-1}$. So the growth factor of 4.4 attains the maximum possible value $\rho=2^{n-1}$ for partial pivoting, and in $p$-bit arithmetic one expects a backward error of order $2^{n-1}\epsilon_{\rm machine}$ — all digits are lost once $2^{n-1}\gtrsim 1/\epsilon_{\rm machine}$, i.e. around $n\approx 54$ in double precision.`,
      idea: String.raw`Adding row $k$ (all entries $-1$ to the left of the last column) to each row below it turns the last-column entry $1$ into $2$, then into $4$, … (the multiplier $-1$ means *adding* the pivot row). The matrix is built so that the diagonal entry stays the unique-by-tie maximum, so pivoting is never triggered and the doubling cannot be avoided. The matrix is the extreme case in Wilkinson's bound $\rho\le2^{n-1}$ (4.4), obtained by bounding each entry by twice the previous maximum.`,
      caption: String.raw`Left: the last column of the working matrix after each elimination step, as bars of $\log_2|u_{in}|$ — the entries double ($1,2,4,\dots,2^{n-1}$). Right: the relative error of the computed solution of $W_nx=b$ in $p$-bit arithmetic (orange) against the dimension $n$, with the line $2^{n-1}\epsilon_{\rm machine}$ (purple dashed); the error rises with the growth and leaves the plot at $100\%$ near $2^{n-1}\approx1/\epsilon_{\rm machine}$. With $p=53$ this takes $n\approx 55$; lower $p$ to see it sooner. (Random matrices do not behave like this: 4.6.)`,
      deps: ['nla-4.4'],
      credit: 'J. H. Wilkinson, 1961',
      tags: ['growth-factor', 'counterexample'],
      refs: ['Trefethen–Bau Lec. 22'],
      viz(v) {
        const n = v.slider('dimension $n$', 3, 60, 12, { int: true });
        const pb = v.slider('significand bits $p$', 12, 53, 53, { int: true });
        const S1 = v.stage({ x: [0, 61], y: [-1, 61], axes: 'box', gutter: true, height: 330, xlabel: 'row i', ylabel: 'log₂|u_in|', title: 'last column after elimination', minWidth: 300 });
        const S2 = v.stage({ x: [2, 60], y: [1e-17, 10], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'n', ylabel: 'relative error', title: 'accuracy of the computed solution', minWidth: 300 });
        const cache = {};
        const errAt = (m, p) => {
          const k = `${m}/${p}`; if (k in cache) return cache[k];
          const W = wilkinsonGrowth(m), r = v.rng(m * 31 + 7), xt = Array.from({ length: m }, () => Math.round(r.uniform(-1, 1) * 256) / 256), b = mv(W, xt), f = luFactor(W, { pivot: true, p }), x = luSolveFl(f, b, p);
          return (cache[k] = relErr(x, xt));
        };
        let st = null;
        v.render(() => {
          const m = n.value, p = pb.value, W = wilkinsonGrowth(m), f = luFactor(W, { pivot: true, p });
          const bars = f.U.map((row, i) => Math.log2(Math.max(1e-9, Math.abs(row[m - 1]))));
          S1.bars(bars.map((b) => Math.max(b, 0.001)), { x0: 1, dx: 1, color: 'orange' });
          S1.path([[0, 0], [m + 1, m]], { color: 'muted', width: 1, dash: true });
          S1.text('= i − 1', m * 0.6, m * 0.6 + 4, { color: 'muted', size: 12 });
          const pts = []; for (let k = 3; k <= 60; k++) pts.push([k, Math.max(1e-17, errAt(k, p))]);
          S2.path([[2, 2 ** 1 * 2 ** -p], [60, 2 ** 59 * 2 ** -p]], { color: 'purple', width: 1.6, dash: true });
          S2.hline(1, { color: 'red', width: 1, dash: true });
          S2.path(pts.map(([x, y]) => [x, Math.min(y, 9)]), { color: 'orange', width: 2.2 });
          S2.vline(m, { color: 'accent', width: 1.2, dash: true });
          st = { rho: f.rho, err: errAt(m, p), mult: f.mult, swaps: f.perm.some((q, i) => q !== i) };
        });
        v.legend([['orange', 'column entries / relative error'], ['purple', '$2^{n-1}\\epsilon_{\\rm machine}$', { dash: true }]]);
        v.readout(() => st ? `$n=${n.value}$: growth factor $\\rho=${st.rho > 1e6 ? sciT(st.rho) : nm(st.rho, 0)}=2^{${n.value - 1}}$, largest multiplier $${nm(st.mult, 0)}$, row exchanges: ${st.swaps ? 'some' : 'none'}. Relative error of $\\hat x$ at $\\epsilon_{\\rm machine}=2^{-${pb.value}}$: $${sciT(st.err)}$ (the line gives $2^{n-1}\\epsilon_{\\rm machine}=${sciT(2 ** (n.value - 1) * 2 ** -pb.value)}$).` : '');
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Gaussian elimination is stable in practice',
      statement: String.raw`Although the growth factor of partial pivoting can reach $2^{n-1}$ (4.5), in numerical practice it essentially never does. For random matrices with independent standard normal entries the observed growth factor is small and increases slowly with $n$ — empirically about like $n^{2/3}$ (Trefethen & Schreiber, 1990) — for example a few units for $n=10$ and about $10$–$20$ for $n=100$ to $1000$; matrices with $\rho$ of exponential size have been constructed only artificially (Wilkinson's, and later extremal examples), and in decades of use no genuine large-scale problem is known to have been spoiled by it. Why such matrices are so rare is not fully understood; this is one of the "mysteries of Gaussian elimination".`,
      idea: String.raw`There is no complete theorem. A heuristic: large growth needs a very particular sign and magnitude pattern in many entries *at once*, so that the multipliers stay near $-1$ and the pivoting never intervenes, and the set of such matrices has tiny measure; perturbing $W_n$ by a small random matrix destroys the growth, as the screenshot of 4.4 shows. Trefethen and Schreiber gave a statistical model of the pivoting process that fits the $n^{2/3}$ law; Higham & Higham (1989) showed that large growth is attainable for every $n$ (they construct real matrices with $\rho\ge n/2$) but only for special matrices. I quote the exponent from memory of the literature, hence the flag.`,
      caption: String.raw`Left: histogram of $\rho$ for many random Gaussian $n\times n$ matrices (choose $n$), computed in double precision with partial pivoting, with the median marked. Right: median (blue) and 95th percentile (orange) of $\rho$ against $n$ on log–log axes, with the reference lines $n^{1/2}$, $n^{2/3}$ and the worst case $2^{n-1}$, which immediately leaves the picture. Resample to see how little the statistics move.`,
      deps: ['nla-4.5'],
      credit: 'L. N. Trefethen & R. S. Schreiber, 1990; N. J. Higham & D. J. Higham, 1989',
      links: { doi: 'https://doi.org/10.1137/0611023' },
      tags: ['growth-factor', 'random-matrices'],
      refs: ['Trefethen–Bau Lec. 22', 'Trefethen & Schreiber, SIMAX 11 (1990) 335–360'],
      verify: true,
      viz(v) {
        const nsel = v.select('matrix size', [8, 16, 32, 64].map((k) => ({ value: k, label: `$n=${k}$` })), 32);
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S1 = v.stage({ x: [0, 40], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'growth factor ρ', ylabel: 'frequency', title: 'distribution of ρ', minWidth: 300 });
        const S2 = v.stage({ x: [6, 160], y: [1, 1e3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'n', ylabel: 'ρ', title: 'growth against size', minWidth: 300 });
        const cache = {};
        const sample = (n, sd) => {
          const k = `${n}/${sd}`; if (cache[k]) return cache[k];
          const cnt = n <= 32 ? 400 : n <= 64 ? 200 : 60, r = v.rng(sd * 977 + n), out = [];
          for (let t = 0; t < cnt; t++) out.push(luFactor(gaussMat(r, n), { pivot: true }).rho);
          return (cache[k] = out);
        };
        const SIZES = [8, 16, 32, 64, 128];
        let st = null;
        v.render(() => {
          const n = nsel.value, d = sample(n, seed), md = median(d), hi = Math.max(8, Math.ceil(quant(d, 0.995) * 1.15));
          S1.setView([0, hi], [0, 1]);
          const h = v.M.histogram(d, { bins: 28, range: [0, hi] }), mx = Math.max(...h.density);
          S1.hist({ edges: h.edges, counts: h.counts.map((c) => c / mx) }, { color: 'accent', fillAlpha: 0.35 });
          S1.vline(md, { color: 'orange', width: 2 });
          const meds = [], p95 = [];
          for (const m of SIZES) { const dd = sample(m, seed); meds.push([m, median(dd)]); p95.push([m, quant(dd, 0.95)]); }
          S2.path([[6, Math.sqrt(6) * 0.8], [160, Math.sqrt(160) * 0.8]], { color: 'muted', width: 1.2, dash: true });
          S2.path([[6, 6 ** (2 / 3) * 0.8], [160, 160 ** (2 / 3) * 0.8]], { color: 'muted', width: 1.2, dash: true });
          S2.path(Array.from({ length: 40 }, (_, i) => { const m = 6 + i * 0.5; return [m, 2 ** (m - 1)]; }).filter(([, y]) => y <= 1e3).concat([[11, 1e3]]), { color: 'red', width: 2.4 });
          S2.text('n^½', 100, 8.5, { color: 'muted', size: 12 }); S2.text('n^⅔', 100, 25, { color: 'muted', size: 12 }); S2.text('2^(n−1)', 9.4, 400, { color: 'red', size: 12 });
          S2.path(p95, { color: 'orange', width: 2 }); S2.dots(p95, { color: 'orange', r: 4 });
          S2.path(meds, { color: 'accent', width: 2 }); S2.dots(meds, { color: 'accent', r: 4 });
          const lx = meds.map((q) => Math.log(q[0])), ly = meds.map((q) => Math.log(q[1])), mx2 = v.M.mean(lx), my2 = v.M.mean(ly);
          let a = 0, b = 0; lx.forEach((x, i) => { a += (x - mx2) * (ly[i] - my2); b += (x - mx2) ** 2; });
          st = { n, md, max: Math.max(...d), slope: a / b, cnt: d.length, big: meds[meds.length - 1] };
        });
        v.legend([['accent', 'median ρ'], ['orange', '95th percentile'], ['red', 'worst case $2^{n-1}$'], ['muted', '$n^{1/2}$, $n^{2/3}$', { dash: true }]]);
        v.readout(() => st ? `$n=${st.n}$, ${st.cnt} matrices: median $\\rho=${nm(st.md, 1)}$, largest $\\rho=${nm(st.max, 1)}$, against $2^{n-1}=${st.n > 40 ? sciT(2 ** (st.n - 1)) : nm(2 ** (st.n - 1), 0)}$. Fitted exponent of the median over $n=8,\\dots,128$: $\\rho\\sim n^{${nm(st.slope, 2)}}$.` : '');
      },
    },
  ],
};
