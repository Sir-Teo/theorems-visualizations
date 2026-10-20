import {nm,sciT,mm,eye,flSolve,hilbert,hilbertInv,hilbertKappa} from './ch03.shared.js';
const spec=(M,A)=>A.length&&A[0].length?M.svd(A).S[0]:0;
const sub=(A,B)=>A.map((r,i)=>r.map((x,j)=>x-B[i][j]));

export default {
      num: '3.15',
      kind: 'Paper',
      name: 'Numerical inverting of matrices of high order',
      paper: { authors: 'John von Neumann and H. H. Goldstine', year: 1947, title: 'Numerical inverting of matrices of high order', venue: 'Bulletin of the American Mathematical Society 53 (11): 1021–1099', doi: '10.1090/S0002-9904-1947-08909-6' },
      introduces: ['nla-3.2'],
      statement: String.raw`Von Neumann and Goldstine analyze rounding in scaled, fixed-point matrix inversion. They separate errors of modeling, observations, finite approximation and computation (§1.1), focusing on the last. Their digital arithmetic has a fixed radix point and $s$ digits (§2.1); its input numbers are treated as exact (§2.2). Their rigorous estimates are conditional deterministic estimates, not an assumption of independent random roundoff (§2.3).

The direct error analysis specializes to symmetric nonnegative definite matrices (§5.1; their terminology includes semidefinite matrices, §3.3 footnote 21). Nonsingular general matrices are handled through a Gram matrix (§§5.1,6.9). Their elimination uses positioning for size by row and column permutations (§4.2), rather than the partial row pivoting simulated below. The numerical precision estimates in §7.8 additionally assume statistical information about matrix norms and conditioning; they are not universal guarantees for arbitrary matrices.`,
      idea: String.raw`In §7.4 the paper interprets an approximate inverse of P as the exact inverse of a nearby matrix P′, with bounded entrywise perturbations; its alternative is proximity to a singular matrix. This anticipates the distinction between input sensitivity and computational error. The separate modern illustration uses conditioning (3.2–3.3). The experiment compares error with the scale $\kappa_2(A)u$; that scale alone is not a universal bound for elimination and samples need not lie on a diagonal. Growth, dimension, the right-hand sides and input rounding also matter. Relative inverse error can exceed one.`,
      caption: String.raw`Simulated $p$-bit partial-pivoted elimination first rounds its input. Orange: relative inverse error; green: unnormalized residual $\|AX-I\|_2$ against the unrounded input. For Hilbert matrices, the reference inverse is the known integer inverse of the **exact rational** matrix, converted to doubles; $\kappa_2$ is estimated from the largest singular values of that matrix and its reference inverse. Thus its error includes binary input approximation and low-precision input rounding. Random-matrix inverses and condition numbers use double-precision references. Right: three Gaussian samples (orange) and one Hilbert sample (blue) per order, irrespective of the selected left-panel family. Purple $\kappa_2 u$, grey $4^nu$ and the scatter diagonal are comparison scales, not validated paper bounds. The red horizontal guide is the value one. Plotted errors or residuals below $10^{-17}$, including zero, are placed at that display floor; numerical readouts retain the computed values. The axes expand to show all finite samples. A missing solve is reported; points are not joined across failures.`,
      deps: ['nla-4.1', 'nla-1.4', 'nla-3.1'],
      tags: ['history', 'matrix-inversion', 'rounding-error'],
      refs: ['Original 1947 §§1.1,2.1–2.3,3.3,4.2,5.1,6.9,7.4,7.8; pp1023–1039,1045,1051–1056,1081–1082,1091–1099'],
      links: { original:'https://doi.org/10.1090/S0002-9904-1947-08909-6', archivedOriginal:'https://web.archive.org/web/20250204013009id_/https://www.ams.org/journals/bull/1947-53-11/S0002-9904-1947-08909-6/S0002-9904-1947-08909-6.pdf' },
      verify: true,
      scope: 'Original full 79-page publisher PDF read through a public archive for the stated historical sections. The visualization is an authored modern floating-point experiment with partial row pivoting, not a reproduction of the paper’s fixed-point algorithm or a test of its conditional bounds. The paper’s ‘definite’ means nonnegative symmetric, with nonsingularity required for inversion. Its general-case Gram reduction and additional §7.8 statistical hypotheses are not run here. Reference inverses, norms and simulated arithmetic use underlying JavaScript doubles; this is not arbitrary precision or an exact reproduction of the historical analysis.',
      viz(v) {
        const M = v.M;
        const fam = v.select('matrices', [{ value: 'rand', label: 'random Gaussian' }, { value: 'hil', label: 'Hilbert' }], 'hil');
        const pb = v.slider('significand bits $p$', 12, 26, 24, { int: true });
        const nmax = v.slider('largest order $N$', 6, 24, 16, { int: true });
        for(const c of[pb,nmax]){const set=c.set;c.set=x=>{const lo=c===pb?12:6,hi=c===pb?26:24;if(!Number.isInteger(x)||x<lo||x>hi)throw new RangeError('Saved precision/order must be an integer in its declared range');return set(x);};}
        let seed = 1;
        v.shareState('matrix experiment seed',{get:()=>seed,validate:s=>Number.isSafeInteger(s)&&s>=1&&s<=2147483647,set:s=>{seed=s;}});
        v.button('Resample', () => { seed=seed===2147483647?1:seed+1; });
        const L = v.stage({ x: [1, 25], y: [1e-20, 1e12], ylog: true, axes: 'box', gutter: true, height: 350, full:true, xlabel: 'order n', ylabel:'error or residual',title:'inverse error and residual versus order' });
        const R = v.stage({ x: [1e-12, 1e8], y: [1e-12, 1e8], xlog: true, ylog: true, axes: 'box', gutter: true, height: 350, full:true, xlabel:'estimated κ₂(A)·u',ylabel:'relative inverse error',title:'error versus comparison scale κ₂u' });
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
          L.setView([1, N + 1], [1e-20, 1e12]);
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
          L.setView([1,N+1],[1e-20,ymax]);
          const scatter=all.concat(allH), hi=Math.max(1,...scatter.flat())*1000, lo=Math.min(1e-12,...scatter.flat().filter(x=>x>0))/1000;
          R.setView([lo,hi],[lo,hi]);
          L.path(four, { color: 'muted', width: 1.6 });
          L.path(kap, { color: 'purple', width: 2, dash: true });
          L.dots(resid, { color: 'green', r: 2.4 });
          for(let i=1;i<main.length;i++) if(main[i][0]===main[i-1][0]+1) L.path([main[i-1],main[i]],{color:'orange',width:2.4}); L.dots(main, { color: 'orange', r: 3.6 });
          L.hline(1, { color: 'red', width: 1.2, dash: true, alpha: 0.7 });
          R.path([[lo*10, lo*10], [hi/10, hi/10]], { color: 'muted', width: 1.6 });
          R.hline(1, { color: 'red', width: 1.2, dash: true, alpha: 0.7 });
          R.dots(all, { color: 'orange', r: 3.4 });
          R.dots(allH, { color: 'blue', r: 3.4 });
          const worst = Math.max(...all.concat(allH).filter((q) => q[0] < 0.01).map((q) => q[1] / q[0]), 0);
          const tl = trial(k, N, p, seed);
          st = { u, N, worst, kappaN: tl.kappa, errN: tl.err, resN: tl.res, failed, lastFailed: tl.failed };
        });
        v.legend([['orange', 'error of the computed inverse'], ['green', 'residual $\\|AX-I\\|$'], ['blue','Hilbert scatter samples'], ['red','unit reference',{dash:true}], ['purple', '$\\kappa_2\\,u$', { dash: true }], ['muted', '$4^{n}u$ (authored comparison)']]);
        v.readout(() => st ? `Sample seed ${seed}; $u=2^{-${pb.value}}=${sciT(st.u)}$. At $n=${st.N}$: estimated reference $\\kappa_2=${sciT(st.kappaN)}$, ${st.lastFailed ? '**rounded elimination failed**' : `relative inverse error $${sciT(st.errN)}$, residual $${sciT(st.resN)}$`}. Selected-family failures: ${st.failed}. Across the displayed successful samples with estimated $\\kappa u<0.01$, maximum error / $(\\kappa u)$: $${nm(st.worst, 2)}$. This is a sample statistic, not a universal bound or a result from the 1947 paper.` : '');
      },
    };
