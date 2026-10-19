// Numerical Linear Algebra — Chapter 4: Gaussian elimination and Cholesky
// Part 2 (this file): 4.7–4.12 — Cholesky factorization and its stability, tridiagonal solvers, fill-in and orderings in sparse
// elimination, iterative refinement, and the Bunch–Kaufman LDLᵀ factorization. Part 1 (4.1–4.6) is in ch04.js.
import {
  nm, sciT, dot, mv, mm, tp, eye, fl, flM, flV, flChol, withSingular, geomSigma, randQ,
  luFactor, luSolveFl, gaussMat, randSPD, relErr, normV, spy, symbolicChol, minDegree, gridPattern, arrowPattern, ldltD,
} from './ch04.shared.js';

import { auditedLDLT as ldlt, numericalInertia, blockEigenvalues } from './ch04-factorization.audit.js';

const maxAbsM = (A) => Math.max(...A.flat().map(Math.abs));
const sub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const spec = (M, A) => M.svd(A).S[0];

export default {
  collection: 'nla',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Algorithm',
      name: 'Cholesky factorization',
      statement: String.raw`A real symmetric matrix $A$ is positive definite iff it has a factorization $A=R^{\top}R$ with $R$ upper triangular with **positive diagonal**; this $R$ is unique (the Cholesky factor). It is computed row by row,
$$r_{kk}=\Big(a_{kk}-\sum_{i<k}r_{ik}^2\Big)^{1/2},\qquad r_{kj}=\frac1{r_{kk}}\Big(a_{kj}-\sum_{i<k}r_{ik}r_{ij}\Big)\quad(j>k),$$
and the algorithm breaks down — a square root of a nonpositive number is required — exactly when $A$ is not positive definite. It exploits symmetry, so it costs about $\tfrac13n^3$ flops, half of LU, and no pivoting is needed (4.8). Used as the cheapest test of positive definiteness.`,
      idea: String.raw`One step of elimination on a symmetric positive definite matrix, $A=\begin{pmatrix}a_{11}&w^{\top}\\w&K\end{pmatrix}=R_1^{\top}\begin{pmatrix}1&0\\0&K-ww^{\top}/a_{11}\end{pmatrix}R_1$ with $R_1=\begin{pmatrix}\sqrt{a_{11}}&w^{\top}/\sqrt{a_{11}}\\0&I\end{pmatrix}$, preserves symmetry and positive definiteness of the trailing block $K-ww^{\top}/a_{11}$ (a Schur complement; it is $x^{\top}Ax>0$ for the vectors $x=(-w^{\top}y/a_{11},y)$). Hence $a_{11}>0$ at every stage and induction proves existence; positivity of the diagonal pins down uniqueness. Working with $R$ rather than $LU$ halves the work since the symmetric half of the update is never formed.`,
      caption: String.raw`Step through the computation of the rows of $R$ for $A=B-sI$ (a symmetric positive definite $B$ with smallest eigenvalue $\lambda_{\min}$ shifted down by $s$). Left: $A$; right: $R$ with the row being computed in gold. The flop counter is compared with LU on the same matrix. Raise the shift $s$ past $\lambda_{\min}(B)$ and $A$ is no longer positive definite: the step-through stops with a negative number under the square root, at a row that depends on how the shift interacts with the matrix.`,
      deps: ['nla-4.1', 'ladr-7.63'],
      credit: 'A.-L. Cholesky, before 1918; published posthumously by Commandant Benoît, Bulletin géodésique 2 (1924) 67–77',
      links: { doi: 'https://doi.org/10.1007/BF03031308' },
      tags: ['cholesky', 'spd'],
      refs: ['Trefethen–Bau Lec. 23', 'Golub–Van Loan ch. 4'],
      viz(v) {
        const M = v.M, n = 4;
        const B = [[4, 2, 2, 1], [2, 5, 3, 2], [2, 3, 6, 3], [1, 2, 3, 7]], lmin = M.eigSym(B).values.slice().sort((a, b) => a - b)[0];
        const sh = v.slider('shift $s$ (A = B − sI)', 0, lmin * 1.5, 0, { step: 0.01, onChange: () => S.reset(undefined, { at: 'keep' }) });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'matrix $A$', minWidth: 280 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'Cholesky factor $R$ (so far)', minWidth: 280 });
        const TA = v.table(s1, { rows: n, cols: n, maxCell: 56, size: 15 }), TR = v.table(s2, { rows: n, cols: n, maxCell: 56, size: 15 });
        const make = () => {
          const A = B.map((r, i) => r.map((x, j) => (i === j ? x - sh.value : x))), R = Array.from({ length: n }, () => new Array(n).fill(null));
          const frames = [{ k: -1, R: R.map((r) => r.slice()), A, flops: 0, line: [], note: String.raw`$A=B-sI$ with $s=${nm(sh.value, 2)}$. Compute $R$ one row at a time.` }];
          let flops = 0, bad = null;
          for (let k = 0; k < n && !bad; k++) {
            let s = A[k][k]; for (let i = 0; i < k; i++) s -= R[i][k] ** 2;
            flops += 2 * k + 1;
            if (!(s > 1e-12)) { bad = { k, s }; frames.push({ k, R: R.map((r) => r.slice()), A, flops, fail: bad, line: [3], note: String.raw`Row ${k + 1}: the radicand is $a_{${k + 1}${k + 1}}-\sum r_{i${k + 1}}^2=${nm(s, 3)}\le0$ — no real square root: **$A$ is not positive definite.**` }); break; }
            R[k][k] = Math.sqrt(s);
            for (let j = k + 1; j < n; j++) { let t = A[k][j]; for (let i = 0; i < k; i++) t -= R[i][k] * R[i][j]; R[k][j] = t / R[k][k]; flops += 2 * k + 1; }
            for (let j = 0; j < k; j++) R[k][j] = 0;
            frames.push({ k, R: R.map((r) => r.map((x) => x)), A, flops, line: [3, 4], note: String.raw`Row ${k + 1}: $r_{${k + 1}${k + 1}}=\sqrt{${nm(s, 3)}}=${nm(R[k][k], 3)}$, then the entries to its right are divided by it.` });
          }
          return frames;
        };
        const S = v.steps({ frames: make, still: 4, code: ['for k = 1 … n', '  s ← a_kk − Σ_{i<k} r_ik²', '  if s ≤ 0: fail          ▷ A not positive definite', '  r_kk ← √s', '  for j = k+1 … n:  r_kj ← (a_kj − Σ_{i<k} r_ik r_ij) / r_kk'] });
        v.render(() => {
          const f = S.frame; if (!f.A) return;
          TA.draw({ value: (i, j) => f.A[i][j], fill: (i, j) => (i === f.k ? ['gold', 0.3] : null), format: 2 });
          TR.draw({ value: (i, j) => f.R[i][j], fill: (i, j) => (i === f.k && f.R[i][j] !== null ? ['gold', 0.35] : f.R[i][j] !== null && i < f.k ? ['green', 0.12] : null), format: 3 });
        });
        v.readout(() => {
          const f = S.frame; if (!f.A) return '';
          const A = f.A, lu = luFactor(A, { pivot: false }), lam = M.eigSym(A).values;
          return `$\\lambda_{\\min}(A)=${nm(Math.min(...lam), 3)}$ (positive iff Cholesky succeeds). Flops of Cholesky so far: **${f.flops}**` + (f.k === n - 1 || f.fail ? ` of ${f.fail ? 'a total that stops at the failure' : 'total'}; LU of the same matrix: ${lu.flops}, i.e. Cholesky costs about ${nm(f.flops / lu.flops, 2)} of LU (leading orders $\\tfrac13n^3$ vs $\\tfrac23n^3$).` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Cholesky is backward stable without pivoting',
      statement: String.raw`Let $A$ be symmetric positive definite and let the Cholesky algorithm run to completion in floating point, producing $\tilde R$. Then
$$\tilde R^{\top}\tilde R=A+\delta A,\qquad\frac{\|\delta A\|}{\|A\|}=O(\epsilon_{\rm machine}),$$
and solving $Ax=b$ by two triangular solves is backward stable, whatever the condition number of $A$ — **provided the algorithm does not break down**, which is guaranteed when $c\,n^{3/2}\kappa(A)\,\epsilon_{\rm machine}<1$ for a modest constant $c$. The reason no growth is possible: the entries of the exact factor obey $r_{ij}^2\le\sum_i r_{ij}^2=a_{jj}$, so
$$\max_{i,j}|r_{ij}|\le\max_j\sqrt{a_{jj}}\le\sqrt{\|A\|_2},$$
i.e. the "growth factor" of Cholesky is bounded by $1$ (relative to $\sqrt{\|A\|}$) with no pivoting at all.`,
      idea: String.raw`The identity $a_{jj}=\sum_{i\le j}r_{ij}^2$ bounds every entry in column $j$ of $R$ by $\sqrt{a_{jj}}$, and the largest diagonal entry of a positive definite matrix is at most its largest eigenvalue. The rounding errors made in forming each $r_{ij}$ are then of relative size $\epsilon_{\rm machine}$ times quantities no bigger than $\|A\|$, so the same entrywise error analysis as for LU (4.4) applies with growth factor $1$. The full proof (Wilkinson 1968) also shows the computed pivots stay positive when $\kappa(A)\epsilon_{\rm machine}$ is small.`,
      caption: String.raw`Left: for random SPD matrices (dimension $n$, condition numbers from $1$ to $10^{10}$) the largest entry of the exact Cholesky factor, plotted against $\sqrt{\|A\|_2}$ — every dot lies on or under the diagonal (the bound). Right: the backward error $\|A-\tilde R^{\top}\tilde R\|/\|A\|$ of Cholesky in $p$-bit arithmetic against $\kappa(A)$: flat at $\epsilon_{\rm machine}$, until near $\kappa\approx1/\epsilon_{\rm machine}$ the algorithm breaks down (red crosses along the top: a computed pivot was not positive), which is a statement about the conditioning of $A$, not growth.`,
      deps: ['nla-4.7', 'nla-3.8'],
      credit: 'J. H. Wilkinson, 1968 (and 1961)',
      tags: ['cholesky', 'stability'],
      refs: ['Trefethen–Bau Lec. 23', 'Higham, Accuracy and Stability ch. 10'],
      viz(v) {
        const M = v.M;
        const nn = v.slider('dimension $n$', 3, 14, 8, { int: true });
        const pb = v.slider('significand bits $p$', 10, 40, 24, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S1 = v.stage({ x: [0.1, 12], y: [0.1, 12], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: '√‖A‖₂', ylabel: 'max |r_ij|', title: 'entries of R are bounded by √‖A‖', minWidth: 300 });
        const S2 = v.stage({ x: [1, 1e10], y: [1e-17, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'κ(A)', ylabel: 'backward error', title: 'backward error of Cholesky', minWidth: 300 });
        let st = null;
        v.render(() => {
          const n = nn.value, p = pb.value, u = 2 ** -p, r = v.rng(seed * 59 + n), pts = [], be = [], fails = [];
          let worst = 0, bmax = 0, nf = 0;
          for (let t = 0; t < 90; t++) {
            const kap = 10 ** r.uniform(0, 10), scale = 10 ** r.uniform(-1.8, 1.7), A = randSPD(M, r, n, kap).map((row) => row.map((x) => x * scale));
            const L = M.cholesky(A);
            if (L) { const mx = maxAbsM(L), sn = Math.sqrt(spec(M, A)); pts.push([sn, mx]); worst = Math.max(worst, mx / sn); }
            const kA = kap, Ap = A.map((row) => row.slice()), Lp = flChol(Ap, p);
            if (!Lp) { fails.push([kA, 4]); nf++; } else { const e = spec(M, sub(Ap, mm(Lp, tp(Lp)))) / spec(M, Ap); be.push([kA, Math.max(1e-17, e)]); bmax = Math.max(bmax, e / u); }
          }
          S1.path([[0.1, 0.1], [12, 12]], { color: 'muted', width: 1.4, dash: true }); S1.text('max|r| = √‖A‖', 4, 6.5, { color: 'muted', size: 12 });
          S1.dots(pts, { color: 'accent', r: 3.5 });
          S2.hline(u, { color: 'muted', width: 1, dash: true }); S2.text('ε', 1.5, u * 2.6, { color: 'muted', size: 13 });
          S2.vline(1 / u, { color: 'red', width: 1, dash: true });
          S2.dots(be, { color: 'green', r: 3.5 }); S2.dots(fails, { color: 'red', r: 4.5 });
          st = { worst, bmax, nf, u, n };
        });
        v.legend([['accent', 'largest $|r_{ij}|$', { dot: true }], ['green', 'backward error', { dot: true }], ['red', 'breakdown (pivot $\\le0$)', { dot: true }]]);
        v.readout(() => st ? `Largest ratio $\\max|r_{ij}|/\\sqrt{\\|A\\|_2}=${nm(st.worst, 3)}\\le1$. Backward error up to ${nm(st.bmax, 2)}$\\,\\epsilon_{\\rm machine}$ (with $\\epsilon_{\\rm machine}=${sciT(st.u)}$), breakdowns (non-positive computed pivot): ${st.nf} of 90 matrices, only to be expected for $\\kappa$ near or above $1/\\epsilon_{\\rm machine}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Algorithm',
      name: 'Banded and tridiagonal solvers (Thomas algorithm)',
      statement: String.raw`For a tridiagonal system with sub-, main and super-diagonals $a_i,b_i,c_i$ and right-hand side $d_i$, **provided all computed elimination pivots are nonzero**, the Thomas algorithm is
$$w_i=a_i/b_{i-1},\quad b_i\leftarrow b_i-w_ic_{i-1},\quad d_i\leftarrow d_i-w_id_{i-1}\quad(i=2,\ldots,n),$$
followed by $x_n=d_n/b_n$ and $x_i=(d_i-c_ix_{i+1})/b_i$. Counting each scalar addition, subtraction, multiplication and division as one flop gives $5(n-1)+1+3(n-1)=8n-7$. Nonsingularity alone does not ensure nonzero pivots: $\begin{pmatrix}0&1\\1&0\end{pmatrix}$ needs an interchange. Strict row diagonal dominance or positive definiteness in the symmetric case prevents exact-arithmetic breakdown. General tridiagonal systems can instead use partial pivoting; its upper factor can have a second superdiagonal (LAPACK DGTSV). For lower/upper bandwidths $\beta,\gamma$, band elimination without pivoting preserves those bandwidths and costs $O(n(\beta+1)(\gamma+1))$ including the solves; partial pivoting can increase the upper bandwidth to $\beta+\gamma$ (LAPACK DGBTRF).`,
      idea: String.raw`Only row $k+1$ has an entry to eliminate in column $k$, so each forward step costs five operations and back substitution costs three per remaining row. Strict row diagonal dominance is inherited by the trailing Schur complement, ensuring nonzero pivots; it does **not** imply every multiplier has modulus below one. For example, $\begin{pmatrix}2&1\\100&101\end{pmatrix}$ is strictly row diagonally dominant but its first multiplier is $50$. The display uses such safe strictly dominant systems, while the LAPACK reference includes row swaps for general systems.`,
      caption: String.raw`Left: step through the Thomas algorithm for an $8\times8$ system (a diagonally dominant matrix; Resample for another): the forward sweep modifies one diagonal entry and one right-hand side per row, then back substitution fills in $x$ from the bottom. Only the tridiagonal cells are ever touched. Right: operation counts against $n$ on log–log axes: Thomas $8n-7$ (slope $1$) against dense LU $\tfrac23n^3$ (slope $3$); the gap at your chosen $n$ is in the readout.`,
      deps: ['nla-4.1'],
      credit: 'Thomas algorithm (conventional name); pivoted variant documented in LAPACK DGTSV',
      tags: ['banded', 'tridiagonal'],
      refs: ['LAPACK DGTSV, purpose and elimination/back-substitution source (April 2011)', 'LAPACK DGBTRF, purpose/band storage (November 2006)'],
      viz(v) {
        const M = v.M, n = 8;
        let seed = 1;
        v.button('Resample', () => { seed++; S.reset(); });
        const nbig = v.slider('$n$ for the operation counts', 4, 1e6, 1000, { log: true, sig: 2, int: true });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, title: 'tridiagonal system $[A\\mid d]$ and solution', minWidth: 340 });
        const s2 = v.stage({ x: [3, 1e6], y: [10, 1e18], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'n', ylabel: 'flops', title: 'cost against n', minWidth: 280 });
        const T = v.table(s1, { rows: n, cols: n + 2, maxCell: 44, size: 12.5, square: false, cellAspect: 1.15 });
        let sys = null;
        const make = () => {
          const r = v.rng(seed * 17 + 3);
          const a = Array.from({ length: n }, (_, i) => (i ? -Math.round(r.uniform(0.5, 1.5) * 10) / 10 : 0)), c = Array.from({ length: n }, (_, i) => (i < n - 1 ? -Math.round(r.uniform(0.5, 1.5) * 10) / 10 : 0));
          const b = Array.from({ length: n }, (_, i) => Math.ceil(Math.abs(a[i]) + Math.abs(c[i]) + 0.5 + r.uniform(0, 1.2)) ), d = Array.from({ length: n }, () => Math.round(r.uniform(-4, 4)));
          sys = { a, b: b.slice(), c, d: d.slice(), b0: b.slice(), d0: d.slice() };
          const bb = b.slice(), dd = d.slice(), x = new Array(n).fill(null), frames = [], snap = (o) => frames.push({ b: bb.slice(), d: dd.slice(), x: x.slice(), ...o });
          let flops = 0;
          snap({ stage: 'start', i: -1, flops, line: [], note: String.raw`Tridiagonal $A$ (only three diagonals stored), right-hand side $d$.` });
          for (let i = 1; i < n; i++) { const w = a[i] / bb[i - 1]; bb[i] -= w * c[i - 1]; dd[i] -= w * dd[i - 1]; flops += 5; snap({ stage: 'fwd', i, w, flops, line: [2, 3, 4], note: String.raw`Row ${i + 1}: $w=a_{${i + 1}}/b_{${i}}=${nm(w, 3)}$; update $b_{${i + 1}}$ and $d_{${i + 1}}$ (one cell each).` }); }
          x[n - 1] = dd[n - 1] / bb[n - 1]; flops += 1; snap({ stage: 'bwd', i: n - 1, flops, line: [5], note: String.raw`Back substitution starts: $x_{${n}}=d_{${n}}/b_{${n}}=${nm(x[n - 1], 3)}$.` });
          for (let i = n - 2; i >= 0; i--) { x[i] = (dd[i] - c[i] * x[i + 1]) / bb[i]; flops += 3; snap({ stage: 'bwd', i, flops, line: [6], note: String.raw`$x_{${i + 1}}=(d_{${i + 1}}-c_{${i + 1}}x_{${i + 2}})/b_{${i + 1}}=${nm(x[i], 3)}$.` }); }
          sys.x = x.slice(); sys.flops = flops;
          return frames;
        };
        const S = v.steps({ frames: make, still: 11, code: ['for i = 2 … n', '  w ← a_i / b_{i−1}', '  b_i ← b_i − w c_{i−1}', '  d_i ← d_i − w d_{i−1}', 'x_n ← d_n / b_n', 'for i = n−1 … 1:  x_i ← (d_i − c_i x_{i+1}) / b_i'] });
        v.render(() => {
          const f = S.frame; if (!f.b) return;
          const band = (i, j) => Math.abs(i - j) <= 1;
          T.draw({
            value: (i, j) => (j === n ? f.d[i] : j === n + 1 ? f.x[i] : !band(i, j) ? null : j === i ? f.b[i] : j === i - 1 ? (f.stage === 'bwd' || (f.stage === 'fwd' && i <= f.i) ? 0 : sys.a[i]) : sys.c[i]),
            fill: (i, j) => (j === n ? (f.stage === 'fwd' && i === f.i ? ['gold', 0.4] : ['blue', 0.1]) : j === n + 1 ? (f.x[i] !== null ? ['green', 0.25] : null) : band(i, j) ? (f.stage === 'fwd' && i === f.i && j >= i - 1 && j <= i ? ['gold', 0.4] : ['blue', 0.1]) : null),
            colLabels: (j) => (j < n ? `${j + 1}` : j === n ? 'd' : 'x'), rowLabels: (i) => `${i + 1}`, format: 2,
          });
          const nb = nbig.value;
          const sweep = (fn) => Array.from({ length: 60 }, (_, k) => { const m = 3 * (1e6 / 3) ** (k / 59); return [m, fn(m)]; });
          s2.path(sweep((m) => 8 * m - 7), { color: 'green', width: 2.6 }); s2.path(sweep((m) => (2 * m ** 3) / 3), { color: 'red', width: 2.6 });
          s2.path(sweep((m) => m ** 3 / 3), { color: 'orange', width: 1.6, dash: true });
          s2.vline(nb, { color: 'accent', width: 1.2, dash: true });
          s2.text('Thomas  8n−7', 3e4, 1e3, { color: 'green', size: 12 }); s2.text('dense LU  2n³/3', 6, 4e8, { color: 'red', size: 12 }); s2.text('Cholesky  n³/3', 6, 4e6, { color: 'orange', size: 12 });
        });
        v.legend([['green', 'Thomas'], ['red', 'dense LU'], ['orange', 'dense Cholesky', { dash: true }]]);
        v.readout(() => {
          const f = S.frame; if (!f.b) return '';
          const nb = Math.round(nbig.value), xd = M.solve(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === i ? sys.b0[i] : j === i - 1 ? sys.a[i] : j === i + 1 ? sys.c[i] : 0))), sys.d0);
          const done = f.x.every((t) => t !== null);
          return `Flops so far: **${f.flops}** (a full solve is $8n-7=${8 * n - 7}$ for $n=${n}$). ` + (done ? `Solution agrees with a dense solve to $${sciT(Math.max(...f.x.map((t, i) => Math.abs(t - xd[i]))))}$. ` : '') + `\nAt $n=${nb}$: Thomas $8n-7=${sciT(8 * nb - 7)}$ flops, dense LU $\\tfrac23n^3=${sciT((2 * nb ** 3) / 3)}$ — a factor $${sciT(((2 * nb ** 3) / 3) / (8 * nb - 7))}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Fill-in and reordering in sparse elimination',
      statement: String.raw`For a symmetric positive definite matrix, write $PAP^{\top}=LL^{\top}$. Eliminating vertex $k$ joins its remaining graph neighbours into a clique: the Schur update $a_{ij}\leftarrow a_{ij}-a_{ik}a_{jk}/a_{kk}$ can create nonzeros where $A$ had zeros. This is a **symbolic** pattern prediction, excluding numerical cancellations. For the arrow pattern (dense first row/column and diagonal), eliminating the hub first creates a full lower triangle with $n(n+1)/2$ entries; eliminating all leaves before the hub creates no fill and leaves $2n-1$ entries. An ordering can strongly affect storage. The minimum-degree heuristic repeatedly eliminates a vertex with the fewest remaining neighbours, updating the filled graph at every step (Tinney–Walker (1967), §III.A, scheme 2).`,
      idea: String.raw`The hub-first and leaves-first counts follow directly by induction on the neighbour-clique rule. This rule also shows that elimination creates no edges between initially disconnected components. Minimum degree is a heuristic, with no claim that it always minimizes fill; Tinney and Walker explicitly discuss topology-dependent performance. The pictures calculate exact symbolic counts for the selected ordering, rather than bounds on all orderings.`,
      caption: String.raw`Left: the permuted input pattern; right: the lower symbolic Cholesky pattern, original entries blue and fill red. The grid uses a $6\times6$ five-point stencil. Compare the actual counts under all four orderings; a random order need not be the worst. No numerical factorization or cancellation is being simulated. The arrow pattern has exactly 136 factor entries in natural order and 31 in reversed order ($n=16$).`,
      deps: ['nla-4.7'],
      credit: 'Tinney & Walker, 1967, §III.A, scheme 2 (minimum degree)',
      links: { doi: 'https://doi.org/10.1109/PROC.1967.6011' },
      tags: ['sparse', 'ordering'],
      refs: ['Tinney–Walker, Proc.IEEE 55(11), 1801–1809, §III.A pp. 1805–1806'],
      viz(v) {
        const mat = v.select('matrix', [{ value: 'arrow', label: 'arrow ($n=16$)' }, { value: 'grid', label: 'grid Laplacian ($6\\times6$)' }], 'arrow');
        const ord = v.select('ordering', [{ value: 'nat', label: 'natural' }, { value: 'rev', label: 'reversed' }, { value: 'md', label: 'minimum degree' }, { value: 'rnd', label: 'random' }], 'nat');
        let seed = 1;
        v.button('New random order', () => { seed++; ord.value = 'rnd'; });
        const S1 = v.stage({ x: [-0.5, 16.5], y: [-0.5, 16.5], equal: true, axes: false, height: 380, title: 'pattern of $PAP^{\\top}$', minWidth: 280 });
        const S2 = v.stage({ x: [-0.5, 16.5], y: [-0.5, 16.5], equal: true, axes: false, height: 380, title: 'pattern of the Cholesky factor', minWidth: 280 });
        let st = null;
        v.render(() => {
          const P = mat.value === 'arrow' ? arrowPattern(16) : gridPattern(6), n = P.length;
          let o = Array.from({ length: n }, (_, i) => i);
          if (ord.value === 'rev') o.reverse(); else if (ord.value === 'md') o = minDegree(P); else if (ord.value === 'rnd') o = v.rng(seed * 11).shuffle(o);
          const { Lpat, Apat, nnzL } = symbolicChol(P, o);
          const w = n;
          S1.setView([-0.5, w + 0.5], [-0.5, w + 0.5]); S2.setView([-0.5, w + 0.5], [-0.5, w + 0.5]);
          spy(S1, Apat, (i, j) => (Apat[i][j] ? 'blue' : null));
          spy(S2, Lpat, (i, j) => (Lpat[i][j] ? (Apat[i][j] ? 'blue' : 'red') : null));
          const nnzA = Apat.flat().filter(Boolean).length, lowA = (nnzA + n) / 2;
          st = { n, nnzL, lowA, fill: nnzL - lowA };
        });
        v.legend([['blue', 'nonzero of $A$'], ['red', 'fill-in']]);
        v.readout(() => st ? `$n=${st.n}$: $A$ has $${st.lowA}$ nonzeros on or below the diagonal; its Cholesky factor has $${st.nnzL}$ — **fill-in: ${st.fill}** (${nm((100 * st.nnzL) / (st.n * (st.n + 1) / 2), 0)}% of a full triangle).` : '');
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Method',
      name: 'Iterative refinement',
      statement: String.raw`Iterative refinement reuses a computed LU factorization while repeating
$$r_s=b-A\hat x_s,\qquad A d_s\approx r_s,\qquad \hat x_{s+1}=\hat x_s+d_s.$$
In exact residual/update arithmetic, if the correction solver is the fixed linear map $C$, the error obeys $e_{s+1}=(I-CA)e_s$. Thus $\|I-CA\|<1$ is a sufficient contraction condition. With rounding, residual and update errors add a limiting error term. A small $\kappa(A)u$ is a useful guide **only with the dimension and factorization-error constants included**; $\kappa u\ge1$ by itself neither proves convergence nor proves divergence. Higher precision residuals can improve accuracy substantially. Each correction costs $O(n^2)$ after the factors are formed.`,
      idea: String.raw`Subtract $x$ from the update and use $b=Ax$ to obtain the error recurrence. Moler (1967) equations (5)–(11), pp. 317–320, bound a rounded variant, including factorization, residual and iterate-update terms. Working-precision residuals can sometimes improve forward accuracy too; they provide a weaker accuracy guarantee. Here factors and correction solves use simulated $p$-bit arithmetic, while residuals **and iterate updates** use JavaScript double precision. This differs from Moler's particular working-precision iterate model.`,
      caption: String.raw`The bold curve measures error against a chosen vector $x_*$; $b=Ax_*$ is itself formed in double precision, so data formation also affects the comparison. Dashed $(\kappa u)^{s+1}$ and $10^{-16}\kappa$ curves are heuristic scales, not bounds, predicted equalities or mandatory floors. Faint curves use three other condition numbers. Error can exceed 100%, and the plot expands to show it. A failed rounded factorization is reported rather than connected through a missing value.`,
      deps: ['nla-4.3'],
      credit: 'C. B. Moler, Iterative Refinement in Floating Point, 1967',
      links: { doi: 'https://doi.org/10.1145/321386.321394' },
      tags: ['refinement', 'accuracy'],
      refs: ['Golub–Van Loan ch. 3', 'Moler, J. ACM 14 (1967) 316–321'],
      viz(v) {
        const M = v.M, n = 10, SW = 12;
        const kap = v.slider('condition number $\\kappa(A)$', 1, 1e8, 1e3, { log: true, sig: 2 });
        const pb = v.slider('significand bits $p$', 8, 26, 24, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [0, SW], y: [1e-17, 10], ylog: true, axes: 'box', gutter: true, height: 400, full: true, xlabel: 'refinement sweeps s', ylabel: 'relative error', title: 'error after each sweep' });
        const run = (k, p) => {
          const r = v.rng(seed * 73 + 5), A = withSingular(M, r, n, n, geomSigma(n, k)), xt = Array.from({ length: n }, () => r.normal()), b = mv(A, xt), f = luFactor(A, { pivot: true, p });
          if (!f.ok) return [];
          let x = luSolveFl(f, b, p), out = [relErr(x, xt)];
          for (let s = 0; s < SW; s++) {
            const res = b.map((bi, i) => bi - A[i].reduce((q, a, j) => q + a * x[j], 0)), d = luSolveFl(f, res, p);
            x = x.map((t, i) => t + d[i]); out.push(relErr(x, xt));
          }
          return out.every(Number.isFinite) ? out : [];
        };
        let st = null;
        v.render(() => {
          const p = pb.value, u = 2 ** -p, k = kap.value;
          const others = [1e2, 1e4, 1e6].map(g => run(g,p)), e = run(k,p);
          const ymax = Math.max(10, ...e, ...others.flat(),(k*u)**(SW+1)) * 2; S.setView([0, SW], [1e-17,ymax]);
          for (const other of others) S.path(other.map((e, s) => [s, Math.max(1e-17, e)]), { color: 'muted', width: 1, alpha: 0.5 });
          S.path(Array.from({ length: SW + 1 }, (_, s) => [s, Math.max(1e-17, Math.min(ymax, (k * u) ** (s + 1)))]), { color: 'purple', width: 1.6, dash: true });
          S.hline(1e-16 * k, { color: 'orange', width: 1, dash: true });
          S.path(e.map((q, s) => [s, Math.max(1e-17, q)]), { color: 'accent', width: 3 }); S.dots(e.map((q, s) => [s, Math.max(1e-17, q)]), { color: 'accent', r: 4 });
          const gains = []; for (let s = 0; s < 4; s++) if (e[s] > 1e-14 * k && e[s + 1] > 0) gains.push(Math.log10(e[s] / e[s + 1]));
          st = { u, k, gain: gains.length ? M.mean(gains) : NaN, expect: -Math.log10(k * u), last: e[SW], first: e[0], failed: !e.length };
        });
        v.legend([['accent', 'error after s sweeps'], ['purple', '$(\\kappa\\epsilon)^{s+1}$', { dash: true }], ['orange', '$10^{-16}\\kappa$', { dash: true }], ['muted', 'other $\\kappa$ (1e2, 1e4, 1e6)']]);
        v.readout(() => st?.failed ? '**Rounded factorization or correction solve failed.** Increase the significand precision or resample.' : st ? `$\\epsilon_{\\rm machine}=2^{-${pb.value}}=${sciT(st.u)}$, $\\kappa\\epsilon_{\\rm machine}=${sciT(st.k * st.u)}$. Initial error $${sciT(st.first)}$, after ${SW} sweeps $${sciT(st.last)}$. Digits gained per sweep: measured ${isFinite(st.gain) ? nm(st.gain, 2) : '—'}, heuristic $\\log_{10}(1/\\kappa\\epsilon)=${nm(st.expect, 2)}$.${st.k * st.u > 0.5 ? ' Here $\\kappa\\epsilon\\gtrsim1$: no convergence guaranteed.' : ''}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Algorithm',
      name: 'Symmetric indefinite factorization (LDLᵀ)',
      statement: String.raw`Every symmetric matrix $A$ has a factorization
$$PAP^{\top}=LDL^{\top},$$
with $P$ a permutation, $L$ unit lower triangular and $D$ **block diagonal with $1\times1$ and $2\times2$ blocks**. The Bunch–Kaufman diagonal pivoting method chooses at each step either a $1\times1$ pivot or a $2\times2$ pivot block, by a diagonal pivoting rule ($\alpha=(1+\sqrt{17})/8\approx0.64$ in the Bunch–Kaufman rule); an efficient implementation costs $\tfrac13n^3+O(n^2)$ flops, like Cholesky, and the factors preserve symmetry. A $2\times2$ block is needed because a matrix such as $\begin{pmatrix}0&1\\1&0\end{pmatrix}$ has zero diagonal, so no $1\times1$ pivot exists. By Sylvester's law of inertia the numbers of positive, negative and zero eigenvalues of $A$ equal those of $D$ (a $2\times2$ block with negative determinant contributes one positive and one negative eigenvalue).`,
      idea: String.raw`A Schur complement with symmetric row/column interchanges preserves symmetry. The Bunch–Kaufman rule compares the current diagonal with the largest column entry, then tests a candidate row before selecting a scalar or a two-by-two pivot; it does not simply search the diagonal. LAPACK DSYTF2 documents these tests with $\alpha=(1+\sqrt{17})/8$. The displayed implementation follows the lower-triangular rule. Congruence preserves inertia: $x^{\top}Ax=(L^{\top}P x)^{\top}D(L^{\top}P x)$ after the corresponding coordinate change. This gives the equality of exact sign counts. Finite precision near-zero sign classification is only numerical evidence, so uncertain counts are labelled as such.`,
      caption: String.raw`The block diagonal $D$ and the actual eigenvalue locations of $A=B-\sigma I$ are shown. The horizontal range expands to include every eigenvalue. The helper normalizes the matrix before elimination to avoid absolute small-pivot thresholds. Numerical signs use a scale-relative tolerance separately for $A$ and $D$; values in that tolerance are labelled "near zero", not proven exact zeros. The readout gives a relative reconstruction residual. With scalar pivoting only, an exact zero pivot causes a reported breakdown.`,
      deps: ['nla-4.7', 'nla-4.3'],
      credit: 'Bunch–Kaufman diagonal pivoting, as implemented in LAPACK DSYTF2/DSYTRF',
      links: { doi: 'https://doi.org/10.1090/S0025-5718-1977-0428694-0' },
      tags: ['ldl', 'inertia'],
      refs: ['LAPACK DSYTRF purpose; DSYTF2 lower-triangle pivot tests and updates (April 2011)'],
      viz(v) {
        const M = v.M, n = 6;
        const kind = v.select('matrix $B$', [{ value: 'zero', label: 'zero diagonal' }, { value: 'gen', label: 'general' }], 'zero');
        const sig = v.slider('shift $\\sigma$ ($A=B-\\sigma I$)', -5, 5, 0.4, { step: 0.05 });
        const piv = v.toggle('pivot with 2×2 blocks', true);
        let seed = 2;
        v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: '$D$ in $PAP^{\\top}=LDL^{\\top}$', minWidth: 300 });
        const s2 = v.stage({ x: [-6, 6], y: [-1, 1], axes: 'box', gutter: true, height: 330, xlabel: 'eigenvalues of A', yticks: [], title: 'spectrum of $A$', minWidth: 300 });
        const T = v.table(s1, { rows: n, cols: n, maxCell: 52, size: 13 });
        let st = null;
        v.render(() => {
          const r = v.rng(seed * 29 + 1), B = Array.from({ length: n }, () => new Array(n).fill(0));
          for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const t = Math.round(r.uniform(-3, 3) * 2) / 2; B[i][j] = B[j][i] = i === j ? (kind.value === 'zero' ? 0 : t) : t; }
          const A = B.map((row, i) => row.map((x, j) => (i === j ? x - sig.value : x)));
          const f = ldlt(A, { pivoting: piv.value }), D = ldltD(f), ev = M.eigSym(A).values;
          const cnt = numericalInertia(ev, n), inD = numericalInertia(blockEigenvalues(f), n);
          const radius = Math.max(1,...ev.map(Math.abs)) * 1.15; s2.setView([-radius,radius],[-1,1]);
          const PA = f.perm.map((i) => f.perm.map((j) => A[i][j])), recon = mm(mm(f.L, D), tp(f.L)), err = maxAbsM(sub(PA, recon)) / (maxAbsM(A) || 1);
          const blockAt = new Array(n).fill(null); for (const b of f.blocks) for (let i = 0; i < b.size; i++) blockAt[b.k + i] = b;
          T.draw({
            value: (i, j) => (blockAt[i] && blockAt[i] === blockAt[j] ? D[i][j] : null),
            fill: (i, j) => (blockAt[i] && blockAt[i] === blockAt[j] ? [blockAt[i].size === 2 ? 'orange' : 'blue', 0.25] : null),
            format: 2, rowLabels: (i) => `${f.perm[i] + 1}`, colLabels: (j) => `${f.perm[j] + 1}`,
          });
          s2.hline(0, { color: 'faint', width: 1 }); s2.vline(0, { color: 'muted', width: 1.4, dash: true });
          ev.forEach((x, i) => s2.dot(x, 0, { color: x > cnt.tol ? 'blue' : x < -cnt.tol ? 'red' : 'ink', r: 6 }));
          st = { cnt, inD, twos: f.twoByTwo, err, breakdown: f.breakdown, ok: f.breakdown < 0 };
        });
        v.legend([['blue', 'positive eigenvalue', { dot: true }], ['red', 'negative eigenvalue', { dot: true }]]);
        v.readout(() => st ? (st.ok ? `Numerical signs of $A$: ${st.cnt.pos} positive, ${st.cnt.neg} negative, ${st.cnt.zero} near zero (tolerance $${sciT(st.cnt.tol)}$). Signs of $D$: ${st.inD.pos} / ${st.inD.neg} / ${st.inD.zero} (tolerance $${sciT(st.inD.tol)}$). ${st.cnt.zero || st.inD.zero ? 'Near-zero signs are unresolved numerically.' : st.cnt.pos === st.inD.pos && st.cnt.neg === st.inD.neg ? '**Sign counts agree** (numerical illustration of Sylvester).' : '**Numerical sign counts disagree**; no exact inertia conclusion.'} Two-by-two blocks: ${st.twos}. Relative max-entry reconstruction residual $${sciT(st.err)}$.` : `**Breakdown:** scalar-only elimination meets an exact zero pivot at step ${st.breakdown + 1}; only the completed part of $D$ is shown. Switch block pivoting on.`) : '');
      },
    },
  ],
};
