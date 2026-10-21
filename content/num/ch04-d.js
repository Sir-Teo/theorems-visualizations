// Numerical Analysis — Chapter 4 (continued): rational approximation of exp, Padé, Froissart doublets, acceleration (items 4.15–4.18)
import { clamp, linspace, rationalExpBest, pade, polyEvalAsc, tsci, sci } from './ch04.shared.js';
import { rationalExpAudit, padeWithFallback, epsilonForSeries, eulerIntegral } from './numerical-source-audit.shared.js';

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
      idea: String.raw`The problem is a potential-theory problem: the poles and zeros of the optimal rational functions distribute along curves in the plane that minimize a weighted logarithmic energy (compare 3.14), and the minimal energy is an elliptic-integral expression. Gonchar and Rakhmanov proved that the limit exists and found it; the $1/9$ conjecture was superseded by the Halphen constant. The displayed finite-degree ratios illustrate the asymptotic trend. The numbers below are numerical estimates from rational Remez with continuously refined extrema, not exact constants or certified minimax errors.`,
      caption: String.raw`Choose the degree $n$ (up to $9$). Left: $e^{-x}$ and its numerical type-$(n,n)$ Remez approximation; middle: the error as a function of $t=(x-9)/(x+9)$ (which maps $[0,\infty)$ to $[-1,1)$): compare the numerically refined alternating extrema; they illustrate the characterization, without a floating-point certificate. Right: the successive ratios $E_{n-1}/E_n$ creep up toward the Halphen limit $9.289$ (dashed).`,
      deps: ['num-4.14'],
      refs: ['Trefethen ATAP Theorem 25.2, equation (25.18)'],
      credit: 'Cody, Meinardus & Varga, 1969 (numerical evidence); Gonchar & Rakhmanov, 1989 (the limit); Aptekarev, 2002 (sharp asymptotics)',
      scope: String.raw`Real rational approximation on the half-line $[0,\infty)$; the displayed errors and peak spread are numerical estimates in double precision. No fixed relative accuracy or global minimax certificate is claimed. The endpoint $t=1$ represents $x=\infty$ and is evaluated by the rational limit, not forced to zero.`,
      tags: ['rational approximation', 'exponential', 'potential theory'],
      links: { wikipedia: 'https://mathworld.wolfram.com/One-NinthConstant.html' },
      viz(v) {
        const nn = v.slider('degree $n$', 1, 9, 4, { int: true });
        const A = v.stage({ x: [0, 8], y: [-0.1, 1.1], axes: 'box', gutter: true, xlabel: 'x', height: 300, title: '$e^{-x}$ and $r_n$' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't', height: 300, title: '(error)$/E_n$ against $t=(x-9)/(x+9)$' });
        const C = v.stage({ x: [1.5, 9.5], y: [8, 10], axes: 'box', gutter: true, xlabel: 'n', height: 300, title: '$E_{n-1}/E_n$' });
        const R = [];
        const get = (n) => R[n] || (R[n] = rationalExpAudit(n, v.M.svd));
        let info = {};
        v.render(() => {
          const n = nn.value, S = get(n), ex = (x) => Math.exp(-x);
          A.fn(ex, { color: 'ink', width: 2, domain: [0, 8] }); A.fn(S.r, { color: 'accent', width: 2, dash: true, domain: [0, 8], n: 500 });
          B.setView([-1, 1], [-1.4, 1.4]); B.hline(1, { color: 'red', dash: true }); B.hline(-1, { color: 'red', dash: true }); B.hline(0, { color: 'faint' });
          B.fn((t) => { return (S.at(t) - (t>=1 ? 0 : Math.exp(-9*(1+t)/(1-t))))/S.E; }, { color: 'accent', width: 2, n: 1500, domain: [-1, 1] });
          const pts = []; for (let k = 2; k <= 9; k++) pts.push([k, get(k - 1).E / get(k).E]);
          C.hline(H_INV, { color: 'green', dash: true });
          C.path(pts, { color: 'accent', width: 2 }); C.dots(pts, { color: 'accent', r: 4 });
          C.vline(n, { color: 'gold', alpha: 0.6 });
          info = { n, E: S.E, ratio: n > 1 ? get(n - 1).E / S.E : NaN, asym: 2 * Math.pow(1 / H_INV, n + 0.5), spread: (S.E-S.minPeak)/S.E, nalt: S.alt.length };
        });
        v.readout(() => `$n=${info.n}$: $E_n\\approx${v.sci(info.E, 4)}$` + (info.n > 1 ? `, $E_{n-1}/E_n=${v.fix(info.ratio, 3)}$` : '') + `; the asymptotic formula $2H^{n+1/2}$ gives $${v.sci(info.asym, 3)}$ ($H^{-1}=9.28903\\ldots$)\nrefined alternating extrema: ${info.nalt}; relative peak spread $${v.sci(info.spread,2)}$ (numerical diagnostic)`);
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Definition',
      name: 'Padé approximation',
      statement: String.raw`For a formal power series $f(z)=\sum_{k\ge0}c_kz^k$, its type-$(L,M)$ **Padé approximant** is the rational function of numerator degree $\le L$ and denominator degree $\le M$ that matches as many initial coefficients as possible. Generically $(f-r)(z)=O(z^{L+M+1})$. More generally the characterization is $O(z^{L+M+1-d})$, where $d=\min(L-\deg p,M-\deg q)$ for the reduced fraction (with the usual special convention for $r=0$). When a normalized full-order solution exists, $q_0=1$, $\sum_{j=0}^Mq_jc_{L+i-j}=0$ for $i=1,\dots,M$ (negative-index $c_k=0$), and $p=(fq)_{\le L}$. Degenerate entries need not admit this normalization with full matching order.`,
      idea: String.raw`Matching $L+M+1$ Taylor coefficients with $L+M+1$ free parameters of a rational function is a linear problem (with the denominator normalized when possible); the extra freedom is spent on placing the poles where $f$ is singular. For Stieltjes-type examples (such as $\log(1+z)/z$) suitable Padé sequences converge off the branch cut through their connection with orthogonal polynomials (4.11); in general there are no guarantees (see 4.17).`,
      caption: String.raw`Choose a function and the type $(L,M)$. Left: $f$ (black), its Taylor polynomial of the same order (red dashed) and the Padé approximant (blue) on the real axis; beyond the radius of convergence the Taylor polynomial can grow while Padé may remain accurate; neither behavior is universal (in particular the exponential has infinite Taylor radius). Right: the poles (red dots) and zeros (blue rings) of the approximant in the complex plane, with the singularities of $f$ (green) and the circle of convergence of the series. Move the point $x_0$ to compare the errors.`,
      deps: ['pma-8.1', 'num-4.14'],
      refs: ['Trefethen ATAP Theorem 27.1 and equations (27.5)–(27.8)'],
      credit: 'Padé, 1892 (thesis; the idea goes back to Frobenius, 1881)',
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
        const Z = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, axes: true, height: 330, title: 'poles (red dots), zeros (blue rings) in $\\mathbb C$' });
        const H0 = A.handle(3, 0, { color: 'gold', constrain: 'x', r: 6, label: 'x₀', labelPos: 'n' });
        let last = '', info = {};
        v.legend([['ink', '$f$'], ['red', 'Taylor polynomial', { dash: true }], ['accent', 'Padé $[L/M]$'], ['green', 'singularities of $f$']]);
        v.render(() => {
          const k = fsel.value, F = FN[k];
          if (last !== k) { last = k; A.setView(F.xr, F.yr); H0.set(F.x0, 0); }
          const L = Ls.value, M = Ms.value, c = Array.from({ length: L + M + 3 }, (_, j) => F.c(j));
          const result = padeWithFallback(c,L,M), P=result.P, Le=result.L, Me=result.M;
          const tay = (x) => polyEvalAsc(c.slice(0, L + M + 1), x);
          A.fn(F.f, { color: 'ink', width: 2, n: 500 }); A.clip(() => A.fn(tay, { color: 'red', width: 1.6, dash: true, n: 500 }));
          if (P) A.clip(() => A.fn((x) => polyEvalAsc(P.p, x) / polyEvalAsc(P.q, x), { color: 'accent', width: 2.2, n: 800 }));
          if (Number.isFinite(F.R)) Z.circle(0, 0, F.R, { color: 'muted', dash: true });
          F.sing.forEach((s) => Z.dot(s[0], s[1], { color: 'green', r: 6 }));
          let np = 0, nz = 0;
          if (P) {
            const poles = M > 0 ? v.M.polyRoots(P.q) : [], zeros = L > 0 ? v.M.polyRoots(P.p) : [];
            zeros.forEach((z) => { Z.dot(z.re, z.im, { color: 'accent', r: 5, hollow: true }); }); poles.forEach((z) => { Z.dot(z.re, z.im, { color: 'red', r: 3.5 }); });
            np = poles.length; nz = zeros.length; const rr=[...poles,...zeros,...F.sing.map(([re,im])=>({re,im}))]; const xx=Math.max(4,...rr.map(z=>Math.abs(z.re))), yy=Math.max(3,...rr.map(z=>Math.abs(z.im))); Z.setView([-1.15*xx,1.15*xx],[-1.15*yy,1.15*yy]);
          }
          H0.set(clamp(H0.x,F.xr[0],F.xr[1]), F.f(clamp(H0.x,F.xr[0],F.xr[1])));
          const x0 = H0.x, ft = F.f(x0), ep = P ? polyEvalAsc(P.p, x0) / polyEvalAsc(P.q, x0) : NaN;
          info = { P, x0, et: Math.abs(tay(x0) - ft), ep: Math.abs(ep - ft), L, M, Le, Me, R: F.R };
        });
        v.readout(() => info.P
          ? `at $x_0=${v.fix(info.x0, 2)}$ (radius of convergence of the series: ${Number.isFinite(info.R) ? info.R : '$\\infty$'}): Taylor polynomial error $${v.sci(info.et + 1e-30, 2)}$, shown rational $[${info.Le}/${info.Me}]$ error $${v.sci(info.ep + 1e-30, 2)}$` + (info.Le !== info.L || info.Me !== info.M ? `\n(the normalized full-order system for $[${info.L}/${info.M}]$ is inconsistent or numerically rank deficient — so a lower-type $[${info.Le}/${info.Me}]$ fallback is shown; full requested matching order is not claimed)` : '')
          : `no normalized full-order solution was obtained for $[${info.L}/${info.M}]$: change $L$ or $M$ (this does not disprove generalized Padé existence)`);
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Paradox',
      name: 'Spurious poles (Froissart doublets)',
      statement: String.raw`When a rational approximation is computed from slightly inexact data — Taylor coefficients contaminated by rounding or noise of size $\delta$ — and the requested degree exceeds what the data can support, the computed $r=p/q$ can acquire **Froissart doublets**: pole–zero pairs that nearly cancel, at essentially random places (typically near the circle $|z|=1$ for Taylor data). They do not affect $r$ much away from them, but they are poles of $r$, ruin pole-location and convergence statements, and mean that Padé approximants of a *fixed* function need not converge pointwise as the degree grows. SVD rank truncation can reduce doublets caused by noise, but does not guarantee their removal for every input; doublets can also occur in exact Padé theory.`,
      idea: String.raw`An idealized infinite iid perturbation of Taylor coefficients typically has radius of convergence $1$; finite noisy coefficient data can mimic this obstruction, to fit it the denominator places poles near the circle, each matched by a zero whose residue is tiny — nothing is gained by it, and exact arithmetic does not exclude such pairs for general functions. The linear system $\sum q_jc_{L+i-j}=0$ is often numerically rank deficient, so discarding singular values below $\delta$ chooses a lower type heuristically.`,
      caption: String.raw`The data are the Taylor coefficients of a function with four poles (green) plus noise of size $\delta$. Raise the degree $m$ ($L=M=m$) or the noise: in the naive computation (red dots, blue rings) pole–zero pairs appear (a red pole sitting inside a blue zero ring, often near $|z|=1$) while sufficiently supported true poles may be recovered; the readout counts them. Switch to *SVD rank truncation* to compare a noise-based reduction of type. This teaching implementation is a simplified rank-truncation heuristic, not the complete robust Padé algorithm. *Resample* draws new noise.`,
      deps: ['num-4.16'],
      refs: ['Trefethen ATAP ch. 26', 'Trefethen ATAP ch. 27'],
      credit: 'Froissart, 1969; robust Padé: Gonnet, Güttel & Trefethen, 2013',
      tags: ['rational approximation', 'noise', 'padé'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pad%C3%A9_approximant' },
      viz(v) {
        const poles = [[1.5, 0, 1, 0], [-1.9, 0, 0.8, 0], [1.1, 1.8, 0.5, 0.3], [1.1, -1.8, 0.5, -0.3]]; // [re, im, a_re, a_im]
        const ctrue = (k) => poles.reduce((s, p) => { const t = cmul([p[2], p[3]], cpow(cinv([p[0], p[1]]), k + 1)); return s + t[0]; }, 0);
        const mode = v.select('method', [{ value: 'naive', label: 'naive Padé' }, { value: 'robust', label: 'SVD rank truncation' }], 'naive');
        const mm = v.slider('degree $m$ ($L=M$)', 3, 22, 14, { int: true });
        const dl = v.slider('noise $\\delta$', 1e-14, 1e-4, 1e-8, { log: true, sig: 2, fmt: (x) => sci(x, 1) });
        const Z = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 380, title: 'poles (red dots), zeros (blue rings) of the computed approximant' });
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
            const tol = 10*d*Math.sqrt(m+1) + 1e-13*Math.sqrt(c.reduce((s,x)=>s+x*x,0));
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
          let np = 0, nd = 0, outside=0;
          if (p && q) {
            const pr = q.length > 1 ? v.M.polyRoots(q) : [], zr = p.length > 1 ? v.M.polyRoots(p) : [];
            const pairs = [];
            pr.forEach((a) => { let best = null, bd = 1e9; zr.forEach((b) => { const dd = Math.hypot(a.re - b.re, a.im - b.im); if (dd < bd) { bd = dd; best = b; } }); if (best && bd < 0.08) pairs.push([a, best]); });
            Z.clip(() => { pairs.forEach(([a, b]) => Z.line(a.re, a.im, b.re, b.im, { color: 'orange', width: 1.5 }));
            zr.forEach((b) => Z.dot(b.re, b.im, { color: 'accent', r: 5, hollow: true })); pr.forEach((a) => Z.dot(a.re, a.im, { color: 'red', r: 3 }));
            });
            np = pr.length; nd = pairs.length; outside=[...pr,...zr].filter(a=>a.re<Z.bounds.x[0]||a.re>Z.bounds.x[1]||a.im<Z.bounds.y[0]||a.im>Z.bounds.y[1]).length;
          }
          info = { np, nd, outside, ok: !!(p && q) };
        });
        v.readout(() => info.ok ? `computed denominator degree ${info.np}; **${info.nd}** pole–zero candidate pairs closer than $0.08$ (distance alone does not certify a tiny residue). The function itself has $4$ poles. Roots outside the displayed window: ${info.outside} (clipped).` : 'the linear system is numerically singular: no approximant computed (choose the robust method)');
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Method',
      name: 'Analytic continuation and convergence acceleration',
      statement: String.raw`Padé approximants and the equivalent **Wynn epsilon algorithm** $\varepsilon^{(n)}_{k+1}=\varepsilon^{(n+1)}_{k-1}+1/(\varepsilon^{(n+1)}_k-\varepsilon^{(n)}_k)$, $\varepsilon_{-1}=0$, $\varepsilon_0^{(n)}=S_n$ turn the partial sums $S_n=\sum_{j=0}^n c_jz^j$ of a power series into a sequence $\varepsilon_{2k}^{(0)}$ (the Shanks transform, equal to the diagonal Padé approximant evaluated at $z$) that can converge where $S_n$ diverges or crawls: it sums the Euler series $\sum(-1)^kk!z^k$, continues $\log(1+z)$ and $\arctan z$ beyond $|z|=1$, and accelerates Leibniz’s $\pi/4=1-\frac13+\frac15-\cdots$. Analyticity along a path alone is not a convergence guarantee for a Padé sequence. Euler’s factorial series has radius zero: here its assigned value is the Stieltjes/Borel integral $\int_0^\infty e^{-t}/(1+zt)\,dt$ for $z>0$, not a Taylor sum.`,
      idea: String.raw`A convergent Taylor series determines an analytic germ and its continuation along admissible paths; the Padé approximants re-express the same information by a rational function whose poles line up along the branch cuts, which can allow convergence outside the original disc under suitable hypotheses. The epsilon algorithm computes them without solving linear systems: it is a sequence transformation that eliminates the dominant geometric-like error modes. Aitken’s $\Delta^2$ (2.11) is its first step.`,
      caption: String.raw`Pick a series and the evaluation point $z$. Left: digits of accuracy against the number $N$ of terms for the raw partial sums (grey), one Aitken step (orange) and Wynn’s epsilon (blue); the raw sums can diverge while acceleration improves selected cases. Undefined epsilon divisions are reported as breakdown, never replaced by a large artificial number; missing points indicate unavailable transforms. Right: poles (red dots) and zeros (blue rings) of the corresponding Padé approximant — they line up along the singular directions of $f$ ($(-\infty,-1]$ for $\log(1+z)$, the imaginary axis beyond $\pm i$ for $\arctan$, the negative axis for the Euler series), which is the analytic continuation at work.`,
      deps: ['num-4.16', 'rca-16.9'],
      refs: ['Trefethen ATAP ch. 28'],
      credit: 'Shanks, 1955; Wynn, 1956',
      scope: String.raw`Works for series whose sum is a Stieltjes-like function (poles on a cut); computed here in double precision, so rounding and zero denominators can cause breakdown at any degree. Even-column entries use $2k+1$ partial sums; an even number of supplied sums leaves the last one unused for the entry with superscript zero. For arctan, zero Taylor terms are skipped before Aitken/epsilon; this is Padé for arctan(z)/z in w=z², then multiplied by z. The pole panel uses the available epsilon level, capped at 9 for stable root plotting. Reference values are numerical; digit plots are capped near 13 correct digits.`,
      tags: ['acceleration', 'padé', 'continuation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shanks_transformation' },
      viz(v) {
        const fact = (k) => { let r = 1; for (let j = 2; j <= k; j++) r *= j; return r; };
        const EXACT_EULER = eulerIntegral;
        const SER = {
          euler: { c: (k) => (k % 2 ? -1 : 1) * fact(k), ex: EXACT_EULER, nm: 'Euler $\\sum(-1)^kk!z^k$', zr: [0.2, 3], z0: 1, vr: [-8, 2] },
          log: { c: (k) => (k === 0 ? 0 : (k % 2 ? 1 : -1) / k), ex: (x) => Math.log1p(x), nm: '$\\log(1+z)$', zr: [0.3, 8], z0: 3, vr: [-8, 2] },
          atan: { c: (k) => (k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) / k : 0), ex: Math.atan, nm: '$\\arctan z$', zr: [0.5, 8], z0: 1, vr: [-3, 3] },
        };
        const sel = v.select('series', Object.entries(SER).map(([value, o]) => ({ value, label: o.nm })), 'log');
        const zs = v.slider('evaluation point $z$', 0.2, 8, 1, { step: 0.1 });
        const NN = v.slider('terms $N$', 4, 24, 14, { int: true });
        const A = v.stage({ x: [1, 24], y: [-1, 16.5], axes: 'box', gutter: true, xlabel: 'N (number of partial sums used)', ylabel: 'correct digits', height: 340, title: 'digits of accuracy' });
        const Z = v.stage({ x: [-8, 2], y: [-3.5, 3.5], equal: true, axes: true, height: 340, title: 'Padé poles (red dots) and zeros (blue rings)' });
        let last = '', info = {};
        v.legend([['muted', 'raw partial sum'], ['orange', 'Aitken $\\Delta^2$'], ['accent', 'Wynn $\\varepsilon$']]);
        v.render(() => {
          const k = sel.value, F = SER[k];
          if (last !== k) { last = k; zs.set(F.z0); }
          const z = zs.value, ex = F.ex(z), c = Array.from({ length: 30 }, (_, j) => F.c(j));
          const S = []; let acc = 0; for (let j = 0; j < 30; j++) { acc += c[j] * Math.pow(z, j); S.push(acc); }
          const dig = (val) => { const e = Math.abs(val - ex) / Math.abs(ex); return Number.isFinite(e) ? clamp(-Math.log10(Math.max(e, 5e-14)), 0, 14) : 0; };
          const raw = [], ait = [], eps = [];
          for (let N = 1; N <= 24; N++) {
            raw.push([N, dig(S[N - 1])]);
            if (N >= 3) { const T=k==='atan'?S.slice(0,N).filter((_,i)=>i%2===1):S.slice(0,N); if(T.length>=3){const [a,b,cc]=T.slice(-3),d2=cc-2*b+a;if(d2!==0)ait.push([N,dig(cc-(cc-b)**2/d2)]);} }
            if (N >= 3) {const W=epsilonForSeries(S.slice(0,N),k); if(W.level>0)eps.push([N,dig(W.value)]);}
          }
          A.path(raw, { color: 'muted', width: 2 }); A.path(ait, { color: 'orange', width: 2 }); A.path(eps, { color: 'accent', width: 2.6 });
          A.vline(NN.value, { color: 'gold', alpha: 0.6 });
          const N = NN.value, W=epsilonForSeries(S.slice(0,N),k), m=Math.min(9,W.level/2);
          let P;
          if(k==='atan'){
            const cw=Array.from({length:2*m+1},(_,j)=>(j%2?-1:1)/(2*j+1)),Q=pade(cw,m,m);
            if(Q){P={p:new Array(2*Q.p.length).fill(0),q:new Array(2*Q.q.length-1).fill(0)};Q.p.forEach((x,i)=>P.p[2*i+1]=x);Q.q.forEach((x,i)=>P.q[2*i]=x);}
          }else P=pade(c,m,m);
          Z.setView([F.vr[0],Math.max(F.vr[1],z+.5)], [-3.5, 3.5]);
          Z.circle(0, 0, 1, { color: 'muted', dash: true });
          const rootList=[];
          if (P) {
            const zr=P.p.length>1?v.M.polyRoots(P.p):[],pr=P.q.length>1?v.M.polyRoots(P.q):[];rootList.push(...zr,...pr);Z.clip(() => {
            zr.forEach((r) => Z.dot(r.re, r.im, { color: 'accent', r: 5, hollow: true }));
            pr.forEach((r) => Z.dot(r.re, r.im, { color: 'red', r: 3.5 }));
            });
          }
          Z.dot(z, 0, { color: 'gold', r: 5 });
          info = { z, ex, raw: S[N - 1], eps: W, N, m, pd: P ? P.p.length-1 : null, qd: P ? P.q.length-1 : null, kind:k, outside: rootList.filter(r=>r.re<Z.bounds.x[0]||r.re>Z.bounds.x[1]||r.im<Z.bounds.y[0]||r.im>Z.bounds.y[1]).length };
        });
        v.readout(() => `$z=${v.fix(info.z, 2)}$, reference value $${v.fix(info.ex, 10)}$ ($N=${info.N}$ terms)\nraw partial sum $${v.sci(info.raw, 4)}$; Wynn $\\varepsilon$: $${v.fix(info.eps.value, 10)}$` + `\nepsilon entry level ${info.eps.level} uses ${info.eps.used} partial sums${info.eps.breakdown ? "; zero/nonfinite division encountered: a lower available entry is shown" : ""}. Right: shown Padé type $[${info.pd}/${info.qd}]$${info.kind==='atan' ? "; atan uses the nonzero odd terms and Padé in w=z²" : " (diagonal type capped at 9)"}; ${info.outside} roots outside the displayed window (clipped).`);
      },
    },
  ],
};
