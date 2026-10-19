// Numerical Analysis — Chapter 4 (continued): rational approximation of exp, Padé, Froissart doublets, acceleration (items 4.15–4.18)
import { clamp, linspace, rationalExpBest, pade, polyEvalAsc, tsci, sci } from './ch04.shared.js';

const H_INV = 9.2890254919; // 1/H, Halphen's constant H = 0.1076539192...

// complex helpers on [re, im]
const cexp = (z) => [Math.exp(z[0]) * Math.cos(z[1]), Math.exp(z[0]) * Math.sin(z[1])];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cpow = (z, k) => { let r = [1, 0]; for (let i = 0; i < k; i++) r = cmul(r, z); return r; };
const cinv = (z) => { const d = z[0] * z[0] + z[1] * z[1]; return [z[0] / d, -z[1] / d]; };

export default {
  collection: 'num',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Halphen’s constant for rational approximation of eˣ',
      statement: String.raw`Let $E_{n}$ be the minimax error of the best real rational approximation of type $(n,n)$ to $e^{-x}$ on $[0,\infty)$. Then $\lim_{n\to\infty}E_n^{1/n}=H=0.10765\ldots=1/9.28903\ldots$, the **Halphen constant**, a value expressible through complete elliptic integrals; the sharper asymptotic is $E_n\sim2H^{\,n+1/2}$ (Aptekarev). In particular the conjecture of Cody–Meinardus–Varga that the limit is $1/9$ is false, although it is very close: each extra degree buys about $0.968$ of a decimal digit ($\log_{10}9.289$).`,
      idea: String.raw`The problem is a potential-theory problem: the poles and zeros of the optimal rational functions distribute along curves in the plane that minimize a weighted logarithmic energy (compare 3.14), and the minimal energy is an elliptic-integral expression. The deep asymptotic results are quoted from the stated theorem rather than derived by this illustration. Gonchar and Rakhmanov proved that the limit exists and found it; the numerics of Cody, Meinardus and Varga had suggested $9$ because the ratios $E_{n-1}/E_n$ are already near $9.3$ for small $n$. The numerical estimates below are computed here by a rational Remez iteration, not read from a table.`,
      caption: String.raw`Choose the degree $n$ (up to $9$). Left: $e^{-x}$ and its computed type-$(n,n)$ rational approximant; middle: the error as a function of $t=(x-3)/(x+3)$ (which maps $[0,\infty)$ to $[-1,1)$): a nondefective minimax approximant equioscillates $2n+2$ times, the signature of a best rational approximation. Right: the successive ratios $E_{n-1}/E_n$ creep up toward the Halphen limit $9.289$ (dashed).`,
      deps: ['num-4.14'],
      refs: ['Trefethen ATAP Theorem25.2 and (25.18), full author manuscript chap25.m'],
      scope: String.raw`Real rational approximation on the half-line $[0,\infty)$; the displayed $E_n$ are finite-grid double-precision Remez estimates. No uniform relative-error guarantee is supplied; degree9 is close to the method’s numerical limit.`,
      tags: ['rational approximation', 'exponential', 'potential theory'],
      links: { wikipedia: 'https://mathworld.wolfram.com/One-NinthConstant.html' },
      viz(v) {
        const nn = v.slider('degree $n$', 1, 9, 4, { int: true });
        const A = v.stage({ x: [0, 8], y: [-0.1, 1.1], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$e^{-x}$ and $r_n$' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't', height: 300, title: '(error)$/E_n$ against $t=(x-3)/(x+3)$' });
        const C = v.stage({ x: [1.5, 9.5], y: [8, 10], axes: 'box', gutter: true, xlabel: 'n', height: 300, title: '$E_{n-1}/E_n$' });
        const R = [];
        const get = (n) => R[n] || (R[n] = rationalExpBest(n, v.M.svd, 3, 400));
        let info = {};
        v.render(() => {
          const n = nn.value, S = get(n), ex = (x) => Math.exp(-x);
          A.fn(ex, { color: 'ink', width: 2, domain: [0, 8] }); A.fn(S.r, { color: 'accent', width: 2, dash: true, domain: [0, 8], n: 500 });
          B.setView([-1, 1], [-1.4, 1.4]); B.hline(1, { color: 'red', dash: true }); B.hline(-1, { color: 'red', dash: true }); B.hline(0, { color: 'faint' });
          B.fn((t) => { const x = 3 * (1 + t) / (1 - t); return t >= 0.99999 ? 0 : (S.r(x) - Math.exp(-x)) / S.E; }, { color: 'accent', width: 2, n: 1500, domain: [-1, 0.99999] });
          const pts = []; for (let k = 2; k <= 9; k++) pts.push([k, get(k - 1).E / get(k).E]);
          C.hline(H_INV, { color: 'green', dash: true });
          C.path(pts, { color: 'accent', width: 2 }); C.dots(pts, { color: 'accent', r: 4 });
          C.vline(n, { color: 'gold', alpha: 0.6 });
          info = { n, E: S.E, ratio: n > 1 ? get(n - 1).E / S.E : NaN, asym: 2 * Math.pow(1 / H_INV, n + 0.5) };
        });
        v.readout(() => `$n=${info.n}$: $E_n=${v.sci(info.E, 4)}$` + (info.n > 1 ? `, $E_{n-1}/E_n=${v.fix(info.ratio, 3)}$` : '') + `; the asymptotic formula $2H^{n+1/2}$ gives $${v.sci(info.asym, 3)}$ ($H^{-1}=9.28903\\ldots$)`);
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Definition',
      name: 'Padé approximation',
      statement: String.raw`Let $f(z)=\sum_{k\ge0}c_kz^k$. In the regular normalized case, the **Padé approximant** of type $(L,M)$ is the rational function $r=p/q$, $\deg p\le L$, $\deg q\le M$, whose Taylor series agrees with that of $f$ through order $L+M$: $f(z)q(z)-p(z)=O(z^{L+M+1})$. The denominator solves the linear system $\sum_{j=0}^Mq_jc_{L+i-j}=0$, $i=1,\dots,M$ ($q_0=1$) and then $p=(fq)_{\le L}$. In defective cases this normalized system can fail or contact order can drop after cancelling a common power of $z$; a nonzero null vector of the homogeneous Toeplitz system gives the general construction. Unlike the Taylor polynomial of the same degree, $r$ can represent poles, and often converges (in capacity or measure) far outside the disc of convergence of the series.`,
      idea: String.raw`Matching $L+M+1$ Taylor coefficients with $L+M+1$ free parameters of a rational function is a linear problem in this regular case; the extra freedom is spent on placing the poles where $f$ is singular. For Stieltjes functions such as $\log(1+z)/z$ convergence outside the disc follows from orthogonal polynomials (4.11); in general there are no guarantees (see 4.17).`,
      caption: String.raw`Choose a function and the type $(L,M)$. Left: $f$ (black), its Taylor polynomial of the same order (red dashed) and the Padé approximant (blue) on the real axis; beyond the radius of convergence the Taylor polynomial explodes while the Padé approximant stays close. Right: the poles (×) and zeros (○) of the approximant in the complex plane, with the singularities of $f$ (green) and the circle of convergence of the series. Move the point $x_0$ to compare the errors.`,
      deps: ['pma-8.1', 'num-4.14'],
      refs: ['Trefethen ATAP Theorems27.1–27.4 and normalized-solve discussion following (27.12), full chap27.m'],
      tags: ['rational approximation', 'padé'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pad%C3%A9_approximant' },
      viz(v) {
        const binomHalf = (k) => { let r = 1; for (let j = 0; j < k; j++) r *= (0.5 - j) / (j + 1); return r; };
        const FN = {
          log: { f: (x) => Math.log(1 + x), c: (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) / k), sing: [[-1, 0]], R: 1, xr: [-0.9, 6], yr: [-2, 3], x0: 3, nm: '$\\log(1+z)$' },
          sqrt: { f: (x) => Math.sqrt(1 + x), c: binomHalf, sing: [[-1, 0]], R: 1, xr: [-0.9, 8], yr: [-1, 4], x0: 4, nm: '$\\sqrt{1+z}$' },
          lor: { f: (x) => 1 / (1 + x * x), c: (k) => (k % 2 ? 0 : (k % 4 === 0 ? 1 : -1)), sing: [[0, 1], [0, -1]], R: 1, xr: [-3, 3], yr: [-1, 1.5], x0: 2, nm: '$1/(1+z^2)$' },
          exp: { f: Math.exp, c: (k) => { let r = 1; for (let j = 2; j <= k; j++) r /= j; return r; }, sing: [], R: Infinity, xr: [-6, 3], yr: [-1, 3], x0: -4, nm: '$e^{z}$' },
        };
        const fsel = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.nm })), 'log');
        const Ls = v.slider('numerator degree $L$', 0, 8, 3, { int: true });
        const Ms = v.slider('denominator degree $M$', 0, 8, 3, { int: true });
        const A = v.stage({ x: [-1, 6], y: [-2, 3], axes: 'box', gutter: true, xlabel: 'x', height: 330, title: '$f$, Taylor polynomial and Padé approximant' });
        const Z = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, axes: true, height: 330, title: 'poles ×, zeros ○ in $\\mathbb C$' });
        const H0 = A.handle(3, 0, { color: 'gold', constrain: 'x', r: 6, label: 'x₀', labelPos: 'n' });
        let last = '', info = {};
        v.legend([['ink', '$f$'], ['red', 'Taylor polynomial', { dash: true }], ['accent', 'Padé $[L/M]$'], ['green', 'singularities of $f$']]);
        v.render(() => {
          const k = fsel.value, F = FN[k];
          if (last !== k) { last = k; A.setView(F.xr, F.yr); H0.set(F.x0, 0); }
          const L = Ls.value, M = Ms.value, c = Array.from({ length: L + M + 3 }, (_, j) => F.c(j));
          let P = pade(c, L, M), Le = L, Me = M;
          while (!P && Me > 0 && Le > 0) { Le--; Me--; P = pade(c, Le, Me); }
          const tay = (x) => polyEvalAsc(c.slice(0, L + M + 1), x);
          A.fn(F.f, { color: 'ink', width: 2, n: 500 }); A.clip(() => A.fn(tay, { color: 'red', width: 1.6, dash: true, n: 500 }));
          if (P) A.clip(() => A.fn((x) => polyEvalAsc(P.p, x) / polyEvalAsc(P.q, x), { color: 'accent', width: 2.2, n: 800 }));
          if (Number.isFinite(F.R)) Z.circle(0, 0, F.R, { color: 'muted', dash: true });
          F.sing.forEach((s) => Z.dot(s[0], s[1], { color: 'green', r: 6 }));
          let np = 0, nz = 0;
          if (P) {
            const poles = M > 0 ? v.M.polyRoots(P.q) : [], zeros = L > 0 ? v.M.polyRoots(P.p) : [];
            zeros.forEach((z) => { Z.dot(z.re, z.im, { color: 'accent', r: 5, hollow: true }); }); poles.forEach((z) => { Z.dot(z.re, z.im, { color: 'red', r: 3.5 }); });
            np = poles.length; nz = zeros.length;
          }
          H0.set(H0.x, F.f(H0.x));
          const x0 = H0.x, ft = F.f(x0), ep = P ? polyEvalAsc(P.p, x0) / polyEvalAsc(P.q, x0) : NaN;
          info = { P, x0, et: Math.abs(tay(x0) - ft), ep: Math.abs(ep - ft), L, M, Le, Me, R: F.R };
        });
        v.readout(() => info.P
          ? `at $x_0=${v.fix(info.x0, 2)}$ (radius of convergence of the series: ${Number.isFinite(info.R) ? info.R : '$\\infty$'}): Taylor polynomial error $${v.sci(info.et + 1e-30, 2)}$, Padé $[${info.L}/${info.M}]$ error $${v.sci(info.ep + 1e-30, 2)}$` + (info.Le !== info.L || info.Me !== info.M ? `\n(the system for $[${info.L}/${info.M}]$ is singular — a degenerate block of the Padé table — so the equivalent $[${info.Le}/${info.Me}]$ approximant is shown)` : '')
          : `the Padé system for $[${info.L}/${info.M}]$ is singular for this function (it sits inside a degenerate block of the Padé table): change $L$ or $M$`);
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Paradox',
      name: 'Spurious poles (Froissart doublets)',
      statement: String.raw`When a rational approximation is computed from slightly inexact data — Taylor coefficients contaminated by rounding or noise of size $\delta$ — and the requested degree exceeds what the data can support, the computed $r=p/q$ acquires **Froissart doublets**: pole–zero pairs that nearly cancel, at essentially random places (typically near the circle $|z|=1$ for Taylor data). They do not affect $r$ much away from them, but they are poles of $r$, ruin pole-location and convergence statements, and mean that Padé approximants of a *fixed* function need not converge pointwise as the degree grows. Truncating small singular values can suppress noise-induced doublets, but is not a universal pointwise-convergence guarantee. Spurious pairs can also occur in exact-data Padé sequences.`,
      idea: String.raw`Noise in $c_k$ looks like the Taylor series of a random function with radius of convergence $1$, singular everywhere on $|z|=1$; to fit it the denominator places poles near the circle, each matched by a zero whose residue is tiny — small-residue doublets then fit the noise with little effect away from their poles. This numerical mechanism differs from the exact-data phenomenon. Small singular values signal numerically unsupported degrees. Thresholding can reduce the requested type, but numerical rank is tolerance-dependent and is not exactly a count of near-cancelling root pairs.`,
      caption: String.raw`The data are the Taylor coefficients of a function with four poles (green) plus noise of size $\delta$. Raise the degree $m$ ($L=M=m$) or the noise: in the naive computation (red ×, blue ○) pole–zero pairs appear (a red pole sitting inside a blue zero ring, often near $|z|=1$) while the four true poles stay put; the readout counts them. Switch to *robust* to see the doublets vanish. *Resample* draws new noise.`,
      deps: ['num-4.16'],
      refs: ['Trefethen ATAP ch.27, SVD algorithm and exact/noisy doublet discussion, full chap27.m'],
      tags: ['rational approximation', 'noise', 'padé'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pad%C3%A9_approximant' },
      viz(v) {
        const poles = [[1.5, 0, 1, 0], [-1.9, 0, 0.8, 0], [1.1, 1.8, 0.5, 0.3], [1.1, -1.8, 0.5, -0.3]]; // [re, im, a_re, a_im]
        const ctrue = (k) => poles.reduce((s, p) => { const t = cmul([p[2], p[3]], cpow(cinv([p[0], p[1]]), k + 1)); return s + t[0]; }, 0);
        const mode = v.select('method', [{ value: 'naive', label: 'naive Padé' }, { value: 'robust', label: 'robust (SVD)' }], 'naive');
        const mm = v.slider('degree $m$ ($L=M$)', 3, 22, 14, { int: true });
        const dl = v.slider('noise $\\delta$', 1e-14, 1e-4, 1e-8, { log: true, sig: 2, fmt: (x) => sci(x, 1) });
        const Z = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 380, title: 'poles ×, zeros ○ of the computed approximant' });
        let seed = 1; v.button('resample noise', () => { seed++; });
        let info = {};
        v.legend([['green', 'true poles'], ['red', 'computed poles'], ['accent', 'computed zeros'], ['muted', '$|z|=1$', { dash: true }]]);
        v.render(() => {
          const m = mm.value, d = dl.value, r = v.rng(seed * 7919);
          const c = Array.from({ length: 2 * m + 2 }, (_, k) => ctrue(k) + d * r.normal());
          let p, q;
          if (mode.value === 'naive') { const P = pade(c, m, m); if (P) { p = P.p; q = P.q; } }
          else {
            let L = m, M = m, ok = false;
            const tol = Math.max(3 * d, 1e-13) * Math.sqrt(c.reduce((s, x) => s + x * x, 0));
            for (let guard = 0; guard < 40 && M > 0; guard++) {
              const C = []; for (let i = 1; i <= M; i++) { const row = []; for (let j = 0; j <= M; j++) { const kk = L + i - j; row.push(kk >= 0 ? c[kk] : 0); } C.push(row); }
              const B = C.concat([new Array(M + 1).fill(0)]), sv = v.M.svd(B);
              const rank = sv.S.filter((s) => s > tol).length;
              if (rank >= M) { const k = M; q = sv.V.map((row) => row[k]); ok = true; break; }
              L -= M - rank; M = rank; if (L < 0) L = 0;
            }
            if (M === 0) { q = [1]; ok = true; }
            if (ok) { const q0 = q[0] || 1; q = q.map((x) => x / q0); p = []; for (let i = 0; i <= L; i++) { let s = 0; for (let j = 0; j <= Math.min(i, q.length - 1); j++) s += q[j] * c[i - j]; p.push(s); } }
          }
          Z.circle(0, 0, 1, { color: 'muted', dash: true });
          poles.forEach((pl) => Z.dot(pl[0], pl[1], { color: 'green', r: 7 }));
          let np = 0, nd = 0;
          if (p && q) {
            const pr = q.length > 1 ? v.M.polyRoots(q) : [], zr = p.length > 1 ? v.M.polyRoots(p) : [];
            const pairs = [];
            pr.forEach((a) => { let best = null, bd = 1e9; zr.forEach((b) => { const dd = Math.hypot(a.re - b.re, a.im - b.im); if (dd < bd) { bd = dd; best = b; } }); if (best && bd < 0.08) pairs.push([a, best]); });
            pairs.forEach(([a, b]) => Z.line(a.re, a.im, b.re, b.im, { color: 'orange', width: 1.5 }));
            zr.forEach((b) => Z.dot(b.re, b.im, { color: 'accent', r: 5, hollow: true })); pr.forEach((a) => Z.dot(a.re, a.im, { color: 'red', r: 3 }));
            np = pr.length; nd = pairs.length;
          }
          info = { np, nd, ok: !!(p && q) };
        });
        v.readout(() => info.ok ? `computed denominator degree ${info.np}; **${info.nd}** pole–zero pairs closer than $0.08$ (Froissart doublets). The function itself has $4$ poles.` : 'the linear system is numerically singular: no approximant computed (choose the robust method)');
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Method',
      name: 'Analytic continuation and convergence acceleration',
      statement: String.raw`Padé approximants and the equivalent **Wynn epsilon algorithm** $\varepsilon^{(n)}_{k+1}=\varepsilon^{(n+1)}_{k-1}+1/(\varepsilon^{(n+1)}_k-\varepsilon^{(n)}_k)$, $\varepsilon_{-1}=0$, $\varepsilon_0^{(n)}=S_n$ turn the partial sums $S_n$ of a power series into a sequence $\varepsilon_{2k}^{(0)}$ (the Shanks transform, equal to the regular diagonal Padé approximant evaluated at $z$ when the required denominators are nonzero) that can converge where $S_n$ diverges or crawls: it sums the Euler series $\sum(-1)^kk!z^k$, continues $\log(1+z)$ and $\arctan z$ beyond $|z|=1$, and accelerates Leibniz’s $\pi/4=1-\frac13+\frac15-\cdots$. Analyticity along a path alone does not ensure Padé convergence. Additional structure can justify particular cases; arbitrary analytic or formal series have no general guarantee. The factorially divergent Euler series is interpreted through the Borel integral $\int_0^\infty e^{-t}/(1+zt)\,dt$, not as an ordinary convergent sum.`,
      idea: String.raw`A convergent Taylor series determines an analytic germ and its continuation on a chosen branch where continuation exists; the Padé approximants re-express the same information by a rational function whose poles line up along the branch cuts, so it keeps converging outside the disc. The epsilon algorithm computes them without solving linear systems: it is a sequence transformation that eliminates the dominant geometric-like error modes. Aitken’s $\Delta^2$ (2.11) is its first step.`,
      caption: String.raw`Pick a series and the evaluation point $z$. Left: digits of accuracy against the number $N$ of terms for the raw partial sums (grey), one Aitken step (orange) and Wynn’s epsilon (blue); for $|z|>1$ or the factorially divergent Euler series the raw sums never converge while epsilon does, up to rounding error (the late wobble). Right: poles (red ×) and zeros (blue ○) of the diagonal Padé approximant — they line up along the singular directions of $f$ ($(-\infty,-1]$ for $\log(1+z)$, the imaginary axis beyond $\pm i$ for $\arctan$, the negative axis for the Euler series), which is the analytic continuation at work.`,
      deps: ['num-4.16', 'rca-16.9'],
      refs: ['Trefethen ATAP ch.28, (28.5–13), epsilon/eta extrapolation and Euler Borel-integral discussion, full chap28.m'],
      scope: String.raw`Works for series whose sum is a Stieltjes-like function (poles on a cut); computed here in double precision, so beyond roughly $12$–$14$ digits the algorithm amplifies rounding errors.`,
      tags: ['acceleration', 'padé', 'continuation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shanks_transformation' },
      viz(v) {
        const fact = (k) => { let r = 1; for (let j = 2; j <= k; j++) r *= j; return r; };
        const EXACT_EULER = (x) => v.M.integrate((t) => Math.exp(-t) / (1 + x * t), 0, 50, 20000);
        const SER = {
          euler: { c: (k) => (k % 2 ? -1 : 1) * fact(k), ex: EXACT_EULER, nm: 'Euler $\\sum(-1)^kk!z^k$', zr: [0.2, 3], z0: 1, vr: [-8, 2] },
          log: { c: (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) / k), ex: (x) => Math.log1p(x), nm: '$\\log(1+z)$', zr: [0.3, 8], z0: 3, vr: [-8, 2] },
          atan: { c: (k) => (k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) / k : 0), ex: Math.atan, nm: '$\\arctan z$', zr: [0.5, 8], z0: 1, vr: [-3, 3] },
        };
        const sel = v.select('series', Object.entries(SER).map(([value, o]) => ({ value, label: o.nm })), 'log');
        const zs = v.slider('evaluation point $z$', 0.2, 8, 1, { step: 0.1 });
        const NN = v.slider('terms $N$', 4, 24, 14, { int: true });
        const A = v.stage({ x: [1, 24], y: [-1, 16.5], axes: 'box', gutter: true, xlabel: 'N (number of partial sums used)', ylabel: 'correct digits', height: 340, title: 'digits of accuracy' });
        const Z = v.stage({ x: [-8, 2], y: [-3.5, 3.5], equal: true, axes: true, height: 340, title: 'Padé poles × and zeros ○' });
        const wynn = (S) => { // returns the last even-column entry eps_{2k}^{(0)} using all of S
          const n = S.length; let prev = new Array(n + 1).fill(0), cur = S.slice(); let best = S[n - 1], level = 0;
          for (let k = 1; k < n; k++) {
            const next = []; for (let i = 0; i < cur.length - 1; i++) { const dd = cur[i + 1] - cur[i]; next.push(prev[i + 1] + (dd === 0 ? 1e300 : 1 / dd)); }
            prev = cur; cur = next; level++;
            if (level % 2 === 0 && cur.length > 0 && Number.isFinite(cur[0])) best = cur[0];
            if (cur.length < 2) break;
          }
          return best;
        };
        let last = '', info = {};
        v.legend([['muted', 'raw partial sum'], ['orange', 'Aitken $\\Delta^2$'], ['accent', 'Wynn $\\varepsilon$']]);
        v.render(() => {
          const k = sel.value, F = SER[k];
          if (last !== k) { last = k; zs.set(F.z0); }
          const z = zs.value, ex = F.ex(z), c = Array.from({ length: 30 }, (_, j) => F.c(j));
          const S = []; let acc = 0; for (let j = 0; j < 30; j++) { acc += c[j] * Math.pow(z, j); S.push(acc); }
          const dig = (val) => { const e = Math.abs(val - ex) / Math.abs(ex); return Number.isFinite(e) ? clamp(-Math.log10(Math.max(e, 1e-17)), 0, 16.5) : 0; };
          const raw = [], ait = [], eps = [];
          for (let N = 1; N <= 24; N++) {
            raw.push([N, dig(S[N - 1])]);
            if (N >= 3) { const a = S[N - 3], b = S[N - 2], cc = S[N - 1], d2 = cc - 2 * b + a; ait.push([N, dig(d2 === 0 ? cc : cc - (cc - b) ** 2 / d2)]); }
            if (N >= 3) eps.push([N, dig(wynn(S.slice(0, N)))]);
          }
          A.path(raw, { color: 'muted', width: 2 }); A.path(ait, { color: 'orange', width: 2 }); A.path(eps, { color: 'accent', width: 2.6 });
          A.vline(NN.value, { color: 'gold', alpha: 0.6 });
          const N = NN.value, m = Math.min(9, Math.floor((N - 1) / 2));
          const P = m >= 1 ? pade(c, m, m) : null;
          Z.setView(F.vr, [-3.5, 3.5]);
          Z.circle(0, 0, 1, { color: 'muted', dash: true });
          if (P) {
            (P.p.length > 1 ? v.M.polyRoots(P.p) : []).forEach((r) => Z.dot(r.re, r.im, { color: 'accent', r: 5, hollow: true }));
            (P.q.length > 1 ? v.M.polyRoots(P.q) : []).forEach((r) => Z.dot(r.re, r.im, { color: 'red', r: 3.5 }));
          }
          Z.dot(z, 0, { color: 'gold', r: 5 });
          info = { z, ex, raw: S[N - 1], ait: ait.length ? ait[Math.max(0, N - 3)][1] : 0, epsv: wynn(S.slice(0, N)), N, m };
        });
        v.readout(() => `$z=${v.fix(info.z, 2)}$, exact value $${v.fix(info.ex, 10)}$ ($N=${info.N}$ terms)\nraw partial sum $${v.sci(info.raw, 4)}$; Wynn $\\varepsilon$: $${v.fix(info.epsv, 10)}$` + `\nright: the Padé approximant $[${info.m}/${info.m}]$ built from the same Taylor coefficients`);
      },
    },
  ],
};
