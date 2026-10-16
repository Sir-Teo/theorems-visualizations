// Number Theory — Chapter 4, part 3: Gauss sums, reciprocity from Gauss sums, conics, and the Disquisitiones (4.11–4.15).
import { mod, gcd, powmod, isPrime, fac, pcol, PAL, nearOddPrime, legendre, jacobi, gaussSum, jw } from './ch04.shared.js';

const sq4 = (n) => (n % 4 === 1 ? 1 : -1);
const isSqFree = (n) => fac(n).every(([, e]) => e === 1);

export default {
  collection: 'nt',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Definition',
      name: 'Quadratic Gauss sums',
      statement: String.raw`For an odd prime $p$ and $\zeta=e^{2\pi i/p}$ the *quadratic Gauss sum* is
$$g_p=\sum_{a=1}^{p-1}\left(\frac ap\right)\zeta^{a}\;=\;\sum_{x=0}^{p-1}\zeta^{x^2}.$$
(The two expressions agree because $\#\{x:x^2\equiv a\}=1+\left(\frac ap\right)$.) It is a sum of $p-1$ unit vectors with signs $\pm1$ chosen by the Legendre symbol; Gauss proved that its length is exactly $\sqrt p$ — far less than the trivial bound $p-1$ — and that $g_p=\sqrt p$ for $p\equiv1\pmod 4$, $g_p=i\sqrt p$ for $p\equiv3\pmod 4$ (4.12 proves $g_p^2=\left(\frac{-1}p\right)p$).`,
      idea: String.raw`The point of the definition is the cancellation: the plain sum $\sum\zeta^a$ is $-1$ (the roots of unity add to $0$), and weighting by a *character* — a multiplicative sign pattern — still leaves a vector of size only $\sqrt p$. The weights $\left(\frac ap\right)$ are the only non-trivial multiplicative $\pm1$ weights (Euler's criterion, 4.2; cyclic group, 3.2). The $p$-th roots of unity themselves live in the complex plane as the vertices of a regular $p$-gon (algo-4.8); Gauss sums are the bridge between this geometry and quadratic residues.`,
      caption: String.raw`The chain of arrows adds the terms $\left(\frac ap\right)\zeta^a$ for $a=1,2,\dots$ head to tail (green arrows: residues, red: non-residues pointing the opposite way). Drag *terms added* to watch the walk; the gold vector is the whole sum and the dashed circle has radius $\sqrt p$. Switch *weights* to $+1$ (the walk closes into a $p$-gon and ends at $-1$) or to random signs (the end point is random, typically also of size $\sqrt p$ — but only for the Legendre signs is it exactly $\sqrt p$, every time).`,
      deps: ['nt-4.1', 'algo-4.8'],
      refs: ['Ireland–Rosen ch. 6', 'Apostol §9.9'],
      tags: ['Gauss sum', 'roots of unity', 'character'],
      credit: 'Gauss, 1801 (sums of this kind); the sign of the sum determined by Gauss in 1805',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quadratic_Gauss_sum' },
      viz(v) {
        const P = v.slider('prime $p$', 3, 101, 23, { int: true });
        const W = v.select('weights', [{ value: 'leg', label: 'Legendre symbol' }, { value: 'one', label: 'all $+1$' }, { value: 'rnd', label: 'random $\\pm1$' }], 'leg');
        const K = v.slider('terms added', 0, 100, 100, { int: true });
        let seed = 7; v.button('Resample signs', () => { seed++; });
        const S = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: true, height: 460, title: 'the chain $\\sum w(a)\\,\\zeta^a$' });
        let info = {};
        v.render(() => {
          const p = nearOddPrime(P.value, 3, 101), k = Math.min(K.value, p - 1);
          const R = v.rng(seed); const rs = []; for (let a = 0; a <= p; a++) rs.push(R() < 0.5 ? -1 : 1);
          const w = (a) => (W.value === 'leg' ? legendre(a, p) : W.value === 'one' ? 1 : rs[a]);
          const lim = Math.max(3, Math.sqrt(p) * 1.9, W.value === 'one' ? p / 3.1 : 0);
          S.setView([-lim, lim * 1.0], [-lim, lim]);
          S.circle(0, 0, Math.sqrt(p), { color: 'accent', width: 1.6, dash: true });
          S.text('radius √p', Math.sqrt(p) * 0.72, Math.sqrt(p) * 0.72 + 0.4, { size: 11.5, color: 'accent' });
          let x = 0, y = 0, fx = 0, fy = 0;
          for (let a = 1; a <= p - 1; a++) { const t = (2 * Math.PI * a) / p, c = w(a); fx += c * Math.cos(t); fy += c * Math.sin(t); }
          for (let a = 1; a <= k; a++) {
            const t = (2 * Math.PI * a) / p, c = w(a), nx = x + c * Math.cos(t), ny = y + c * Math.sin(t);
            S.arrow(x, y, nx, ny, { color: a === k ? 'gold' : c > 0 ? 'green' : 'red', width: a === k ? 2.8 : 1.8, head: 6, alpha: a === k ? 1 : 0.8 });
            x = nx; y = ny;
          }
          S.arrow(0, 0, fx, fy, { color: 'gold', width: 2.4, head: 9, alpha: 0.9 });
          S.dot(fx, fy, { r: 5, color: 'gold' });
          info = { p, fx, fy, len: Math.hypot(fx, fy), mode: W.value, xr: (() => { let a = 0, b = 0; for (let t = 0; t < p; t++) { const th = (2 * Math.PI * ((t * t) % p)) / p; a += Math.cos(th); b += Math.sin(th); } return [a, b]; })() };
        });
        v.readout(() => {
          const { p, fx, fy, len, mode, xr } = info;
          const f = (z) => v.fix(z, 4);
          return `$p=${p}$: the sum is $${f(fx)}${fy < 0 ? '-' : '+'}${f(Math.abs(fy))}\\,i$, of length $${f(len)}$ (the benchmark $\\sqrt p=${f(Math.sqrt(p))}$; the trivial bound is $${p - 1}$).` + (mode === 'leg' ? `\n$\\sum_x\\zeta^{x^2}=${f(xr[0])}${xr[1] < 0 ? '-' : '+'}${f(Math.abs(xr[1]))}\\,i$ — the same number, as claimed.` : mode === 'one' ? '\nWith all weights $+1$ the sum is $-1$: the roots of unity cancel.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'The square of the quadratic Gauss sum',
      statement: String.raw`For an odd prime $p$ and $g_p=\sum_{a=1}^{p-1}\left(\frac ap\right)\zeta^a$,
$$g_p^2=\left(\frac{-1}p\right)p=(-1)^{(p-1)/2}p .$$
Hence $|g_p|=\sqrt p$, and $g_p=\pm\sqrt p$ if $p\equiv1\pmod4$, $g_p=\pm i\sqrt p$ if $p\equiv3\pmod 4$. (The same formula holds for the Jacobi-weighted sum over any odd squarefree $n$; for non-squarefree $n$ the sum with Jacobi weights is $0$.)`,
      idea: String.raw`Write $g_p^2=\sum_{a,b}\left(\frac{ab}p\right)\zeta^{a+b}$ and substitute $b=at$ for $a\ne0$: $g_p^2=\sum_{t}\left(\frac tp\right)\sum_{a\ne0}\zeta^{a(1+t)}$ using multiplicativity of the symbol (4.2). The inner sum is $p-1$ when $t\equiv-1$ and $-1$ otherwise. So $g_p^2=\left(\frac{-1}p\right)(p-1)-\sum_{t\ne-1}\left(\frac tp\right)=\left(\frac{-1}p\right)(p-1)+\left(\frac{-1}p\right)=\left(\frac{-1}p\right)p$, because $\sum_{t\ne0}\left(\frac tp\right)=0$ (4.1) and the value at $t=-1$ has been split off. The sign of $\left(\frac{-1}p\right)$ is the first supplement (4.3).`,
      caption: String.raw`Left: the complex plane. The dots are $g_n$ (computed numerically by summing the $n$ roots of unity with Jacobi weights) for every odd $n\le 101$; primes sit on the real axis ($\equiv1$) or the imaginary axis ($\equiv3$), exactly at distance $\sqrt n$. Drag the slider to choose $n$ (it becomes the highlighted dot and arrow). Right: $\operatorname{Re}(g_n^2)/n$ for all $n$, with hollow markers at the prediction $\left(\frac{-1}n\right)$ for squarefree $n$ and $0$ otherwise; try $n=9,25,27,45$ where the hypothesis (squarefree) fails.`,
      deps: ['nt-4.11', 'nt-4.3'],
      refs: ['Ireland–Rosen ch. 6'],
      tags: ['Gauss sum', 'character'],
      credit: 'Gauss, 1801 (the value of $g^2$; its sign settled in 1805)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quadratic_Gauss_sum' },
      viz(v) {
        const N = v.slider('odd $n$', 3, 101, 13, { int: true });
        const C = v.stage({ x: [-11, 11], y: [-11, 11], equal: true, axes: true, height: 400, title: '$g_n$ in the plane' });
        const B = v.stage({ x: [1, 102], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 400, xlabel: '$n$', ylabel: '$\\operatorname{Re}(g_n^2)/n$', title: '$g_n^2/n$ for every odd $n$' });
        const G = new Map(); const gOf = (n) => { if (!G.has(n)) G.set(n, gaussSum(n, jw(n))); return G.get(n); };
        let info = {};
        v.render(() => {
          const n = N.value % 2 ? N.value : N.value + 1;
          C.circle(0, 0, Math.sqrt(n), { color: 'accent', width: 1.4, dash: true });
          for (let m = 3; m <= 101; m += 2) { const [re, im] = gOf(m); if (Math.hypot(re, im) < 1e-6 && m !== n) continue; C.dot(re, im, { r: m === n ? 6 : 2.8, color: isPrime(m) ? (m % 4 === 1 ? 'blue' : 'orange') : 'muted', alpha: m === n ? 1 : 0.7 }); }
          const [re, im] = gOf(n); C.arrow(0, 0, re, im, { color: 'gold', width: 2.4, head: 9 }); C.dot(re, im, { r: 7, color: 'gold' });
          B.hline(0, { color: 'faint' });
          for (let m = 3; m <= 101; m += 2) { const [a, b] = gOf(m), re2 = (a * a - b * b) / m, pred = isSqFree(m) ? sq4(m) : 0;
            B.rect(m - 0.8, 0, m + 0.8, re2, { fill: m === n ? 'gold' : 'accent', fillAlpha: m === n ? 0.9 : 0.4, color: m === n ? 'gold' : 'accent' });
            B.dot(m, pred, { r: 2.6, hollow: true, color: 'green' }); }
          const g2re = re * re - im * im, g2im = 2 * re * im;
          info = { n, re, im, g2re, g2im, sqf: isSqFree(n), pred: isSqFree(n) ? sq4(n) * n : 0 };
        });
        v.legend([['blue', '$p\\equiv1\\ (4)$', { dot: true }], ['orange', '$p\\equiv3\\ (4)$', { dot: true }], ['muted', 'composite', { dot: true }], ['green', 'prediction', { dot: true }]]);
        v.readout(() => {
          const { n, re, im, g2re, g2im, sqf, pred } = info; const f = (z) => v.fix(z, 3);
          return `$n=${n}$: $g_n=${f(re)}${im < 0 ? '-' : '+'}${f(Math.abs(im))}\\,i$, $g_n^2=${f(g2re)}${g2im < 0 ? '-' : '+'}${f(Math.abs(g2im))}\\,i$; the formula $\\left(\\frac{-1}n\\right)n$ predicts $${pred}$${sqf ? '' : ' (not squarefree: the sum vanishes)'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Reciprocity from Gauss sums',
      statement: String.raw`Let $p\ne q$ be odd primes and $p^*=(-1)^{(p-1)/2}p$. Then $\left(\frac{p^*}q\right)=\left(\frac qp\right)$, and this is quadratic reciprocity:
$$\left(\frac pq\right)\left(\frac qp\right)=(-1)^{\frac{p-1}2\frac{q-1}2}.$$
The proof works in the ring $\Z[\zeta_p]$ modulo $q$, comparing two expressions for $g_p^{\,q}$.`,
      idea: String.raw`Since $q$ is prime, $(x+y)^q\equiv x^q+y^q\pmod q$ (the Frobenius, 2.5), so $g_p^q\equiv\sum_a\left(\frac ap\right)\zeta^{qa}$; substituting $b=qa$ gives $g_p^q\equiv\left(\frac qp\right)g_p\pmod q$. On the other hand $g_p^q=g_p\,(g_p^2)^{(q-1)/2}=g_p\,(p^*)^{(q-1)/2}\equiv\left(\frac{p^*}q\right)g_p$ by 4.12 and Euler's criterion (4.2). Since $g_p$ is a unit mod $q$ ($g_p^2=p^*\not\equiv0$), the two signs agree. Finally $\left(\frac{p^*}q\right)=\left(\frac{-1}q\right)^{(p-1)/2}\left(\frac pq\right)$ turns this into the stated sign rule via 4.3.`,
      caption: String.raw`The elements are polynomials in $\zeta=\zeta_p$ with coefficients mod $q$ (computed in $\mathbb F_q[x]/(1+x+\dots+x^{p-1})$, written in the basis $1,\zeta,\dots,\zeta^{p-2}$). Top panel: the coefficients of $g_p^q$, found by honest repeated multiplication, as bars; the green and red outlines are the coefficients of $+g_p$ and $-g_p$. Exactly one outline is hit by every bar. Bottom: the coefficients of $g_p^2$ — a single non-zero bar at $1$, the integer $p^*\bmod q$ — which is the heart of 4.12. The readout lists the signs.`,
      deps: ['nt-4.12', 'nt-2.5', 'nt-4.2', 'nt-4.3'],
      refs: ['Apostol §9.11', 'Ireland–Rosen ch. 6'],
      tags: ['Gauss sum', 'Frobenius', 'reciprocity'],
      credit: 'Gauss, 1811 (fourth proof of reciprocity, by Gauss sums); the Frobenius form of the argument is the modern presentation',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gauss_sum#Properties_of_Gauss_sums_of_Dirichlet_characters' },
      viz(v) {
        const P = v.slider('prime $p$', 3, 31, 7, { int: true });
        const Q = v.slider('prime $q$', 3, 61, 11, { int: true });
        const A = v.stage({ x: [-0.5, 30], y: [-30, 30], axes: 'box', gutter: true, height: 260, xlabel: 'coefficient of $\\zeta^i$', ylabel: 'mod $q$', title: '$g_p^{\\,q}$ computed in $\\mathbb F_q[\\zeta_p]$' });
        const B = v.stage({ x: [-0.5, 30], y: [-30, 30], axes: 'box', gutter: true, height: 260, xlabel: 'coefficient of $\\zeta^i$', ylabel: 'mod $q$', title: '$g_p^{\\,2}$ — constant $p^*$' });
        let info = {};
        v.render(() => {
          const p = nearOddPrime(P.value, 3, 31); let q = nearOddPrime(Q.value, 3, 61); if (q === p) q = nearOddPrime(q + 2, 3, 200);
          const norm = (c) => { const t = c[p - 1]; const r = c.map((x) => mod(x - t, q)); r[p - 1] = 0; return r; };
          const mul = (a, b) => { const r = new Array(p).fill(0); for (let i = 0; i < p; i++) if (a[i]) for (let j = 0; j < p; j++) if (b[j]) r[(i + j) % p] = (r[(i + j) % p] + a[i] * b[j]) % q; return norm(r); };
          const g = norm(Array.from({ length: p }, (_, a) => (a === 0 ? 0 : mod(legendre(a, p), q))));
          let res = norm(Array.from({ length: p }, (_, i) => (i === 0 ? 1 : 0))), base = g, e = q;
          while (e > 0) { if (e & 1) res = mul(res, base); base = mul(base, base); e = Math.floor(e / 2); }
          const g2 = mul(g, g);
          const s = (x) => (x > q / 2 ? x - q : x);
          const eq = (u, w) => u.every((x, i) => x === w[i]);
          const gp = g, gm = g.map((x) => mod(-x, q));
          const sgn = eq(res, gp) ? 1 : eq(res, gm) ? -1 : 0;
          const ps = ((p - 1) / 2) % 2 ? -p : p;
          const lim = Math.max(2, Math.floor(q / 2) + 1);
          for (const [S, vec, ref] of [[A, res, true], [B, g2, false]]) {
            S.setView([-0.5, p - 1 + 0.5], [-lim, lim]); S.setTicks(null, [[-(lim - 1), String(-(lim - 1))], [0, '0'], [lim - 1, String(lim - 1)]]);
            S.hline(0, { color: 'faint' });
            for (let i = 0; i < p - 1; i++) {
              S.rect(i - 0.3, 0, i + 0.3, s(vec[i]), { fill: 'blue', fillAlpha: 0.5, color: 'blue', width: 1 });
              if (ref) { S.dot(i, s(gp[i]), { r: 6, hollow: true, color: 'green', width: 2 }); S.dot(i, s(gm[i]), { r: 6, hollow: true, color: 'red', width: 2 }); }
            }
            if (!ref) S.dot(0, s(mod(ps, q)), { r: 7, hollow: true, color: 'green', width: 2.2 });
          }
          info = { p, q, sgn, ps, lqp: legendre(q, p), lpsq: legendre(mod(ps, q), q), lpq: legendre(p, q), g2ok: g2.every((x, i) => (i === 0 ? x === mod(ps, q) : x === 0)) };
        });
        v.legend([['green', '$+g_p$', { dot: true }], ['red', '$-g_p$', { dot: true }], ['blue', 'computed', { area: true }]]);
        v.readout(() => {
          const { p, q, sgn, ps, lqp, lpsq, lpq, g2ok } = info;
          return `$p=${p}$, $q=${q}$, $p^*=${ps}$: $g_p^{\\,q}\\equiv${sgn > 0 ? '+' : sgn < 0 ? '-' : '?'}g_p$; $\\left(\\frac qp\\right)=${lqp}$, $\\left(\\frac{p^*}q\\right)=${lpsq}$ — equal. $g_p^2\\equiv p^*$ in the ring: **${g2ok}**. Hence $\\left(\\frac pq\\right)\\left(\\frac qp\\right)=${lpq * lqp}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Counting points on a conic modulo p',
      statement: String.raw`Let $p$ be an odd prime and $a,b,c\in\Z/p\Z$ with $abc\ne0$. The conic $ax^2+by^2=c$ has exactly
$$N=p-\left(\frac{-ab}p\right)$$
solutions $(x,y)\in(\Z/p\Z)^2$. In particular the circle $x^2+y^2=1$ has $p-\left(\frac{-1}p\right)$ points: $p-1$ if $p\equiv1\pmod4$ and $p+1$ if $p\equiv3\pmod4$. (For $c=0$ the count is $1+(p-1)\big(1+\left(\frac{-ab}p\right)\big)$: a pair of lines through the origin when $-ab$ is a square, the origin alone otherwise.)`,
      idea: String.raw`Let $r(u)=1+\left(\frac up\right)$ be the number of $x$ with $x^2=u$ (4.1; $r(0)=1$). Then $N=\sum_{s}r(s/a)\,r((c-s)/b)$ over $s=ax^2$, and expanding with multiplicativity (4.2) gives $N=p+\left(\frac ap\right)\!\sum_s\left(\frac sp\right)+\left(\frac bp\right)\!\sum_s\left(\frac{c-s}p\right)+\left(\frac{ab}p\right)\!\sum_s\left(\frac{s(c-s)}p\right)$. The two linear sums vanish because the non-zero residues and non-residues are equally many (4.1). For the last one, $\left(\frac{s(c-s)}p\right)=\left(\frac{-1}p\right)\left(\frac{s^2-cs}p\right)$, and a standard count shows $\sum_s\left(\frac{s^2-cs}p\right)=-1$ when $c\ne0$ (complete the square: the number of $(s,y)$ with $y^2=s^2-cs$ is the number of points of the hyperbola $X^2-y^2=c^2/4$, which factors as $(X-y)(X+y)=c^2/4$ and so has exactly $p-1$ points; but that number is also $p+\sum_s\left(\frac{s^2-cs}p\right)$). Hence $N=p-\left(\frac{-ab}p\right)$.`,
      caption: String.raw`Dots mark the solutions of $ax^2+by^2=c$ in the $p\times p$ grid of residues (a discrete “circle”; note the symmetry $x\to-x$, $y\to-y$). Change $a,b,c$ and $p$: the count stays at $p-1$ or $p+1$ and the readout compares it with $p-\left(\frac{-ab}p\right)$. Set $c=0$ to break the hypothesis: the conic degenerates into two lines (a “cross”) when $-ab$ is a square.`,
      deps: ['nt-4.1', 'nt-4.2'],
      refs: ['Ireland–Rosen ch. 8'],
      tags: ['conic', 'finite field', 'point count'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Conic_section#Conic_sections_over_a_finite_field' },
      viz(v) {
        const P = v.slider('prime $p$', 5, 47, 13, { int: true });
        const A = v.slider('$a$', 1, 46, 1, { int: true });
        const Bb = v.slider('$b$', 1, 46, 1, { int: true });
        const Cc = v.slider('$c$', 0, 46, 1, { int: true });
        const S = v.stage({ x: [-1, 47], y: [-1, 47], equal: true, axes: 'box', gutter: true, height: 440, xlabel: '$x$', ylabel: '$y$', title: 'solutions of $ax^2+by^2=c$ in $(\\mathbb Z/p)^2$' });
        let info = {};
        v.render(() => {
          const p = nearOddPrime(P.value, 5, 47), a = mod(A.value, p) || 1, b = mod(Bb.value, p) || 1, c = mod(Cc.value, p);
          S.setView([-1, p], [-1, p]);
          if (p <= 31) for (let x = 0; x < p; x++) for (let y = 0; y < p; y++) S.dot(x, y, { r: 1.2, color: 'faint' });
          let n = 0; const r = Math.max(2.5, 170 / p);
          for (let x = 0; x < p; x++) for (let y = 0; y < p; y++) if ((a * x * x + b * y * y - c) % p === 0) { n++; S.dot(x, y, { r, color: c ? 'blue' : 'orange' }); }
          const e = legendre(-a * b, p);
          info = { p, a, b, c, n, e, pred: c ? p - e : 1 + (p - 1) * (1 + e) };
        });
        v.readout(() => {
          const { p, a, b, c, n, e, pred } = info;
          return `$p=${p}$: **${n}** points on $${a}x^2+${b}y^2\\equiv${c}$; $\\left(\\frac{-ab}p\\right)=${e}$, so the formula gives $${c ? `p-(${e})` : '1+(p-1)(1+' + e + ')'}=${pred}$ — ${n === pred ? 'equal ✓' : 'different ✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Paper',
      name: 'Disquisitiones arithmeticae',
      paper: { authors: 'Carl Friedrich Gauss', year: 1801, title: 'Disquisitiones arithmeticae', venue: 'Leipzig: Gerhard Fleischer', url: 'https://archive.org/details/disquisitionesa00gaus' },
      introduces: ['nt-2.1', 'nt-3.3', 'nt-3.7', 'nt-4.6'],
      credit: 'C. F. Gauss, 1801 (written 1798, at age 21)',
      statement: String.raw`A systematic treatise on number theory in seven sections (366 numbered articles), in Latin. It fixes the notation $a\equiv b\pmod m$ (2.1) and builds the theory of congruences (linear and higher-degree, the Chinese remainder theorem), proves that moduli with primitive roots are exactly $1,2,4,p^k,2p^k$ (3.3), and devotes its fourth section to quadratic congruences: it states the law of quadratic reciprocity and gives the first complete proofs (4.6; Gauss gives a second proof in the same book). It then treats binary quadratic forms (composition, genera) and ends with the theory of the roots of $x^n-1$, showing that the regular 17-gon, and more generally every regular $n$-gon with $n$ a product of a power of $2$ and distinct Fermat primes, is constructible with ruler and compass (3.7).`,
      idea: String.raw`Before the book number theory was a collection of results of Fermat, Euler, Lagrange and Legendre. Euler and Legendre had stated reciprocity, but Legendre's attempted proof assumed the existence of certain primes; Gauss, who rediscovered the statement by himself in 1795 and proved it in 1796 after a year of work, called it the "fundamental theorem" and the *aureum theorema* — the golden theorem. The book gave the subject its language (congruences, residues, primitive roots), its first proof of reciprocity, and its first great application of algebra to geometry: the 17-gon (announced in 1796, with the full criterion of constructibility in the last section). It also began the theory of binary quadratic forms that Dirichlet and Kummer would develop into algebraic number theory.`,
      caption: String.raw`**Left, the book's golden theorem.** A grid of odd primes $p$ (horizontal) and $q$ (vertical), each cell coloured by the pair $\left(\left(\frac pq\right),\left(\frac qp\right)\right)$: green for $(+,+)$, blue for $(-,-)$, orange for the mixed pairs. The table is symmetric except exactly on the dark-bordered cells where both primes are $\equiv3\pmod4$: there the two symbols differ. **Right, the last section.** The 17th roots of unity in the order of the powers of $3$; raising the *level* splits the 16 non-trivial roots into periods of $8$, $4$, $2$, $1$ roots, each pair of periods being the roots of a quadratic equation — so everything is reached by square roots, which is what makes the 17-gon constructible. The readout evaluates Gauss's nested radical for $\cos(2\pi/17)$ against the computed cosine.`,
      deps: ['nt-2.5', 'nt-2.8', 'nt-4.2'],
      refs: [],
      tags: ['history', 'reciprocity', 'cyclotomy'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Disquisitiones_Arithmeticae' },
      viz(v) {
        const T = v.stage({ x: [-0.07, 1.01], y: [-0.07, 1.01], equal: true, axes: false, height: 420, title: '$\\left(\\frac pq\\right),\\ \\left(\\frac qp\\right)$ for odd primes' });
        const Z = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 420, title: 'the 17-gon: periods of $17$th roots of unity' });
        const L = v.slider('level $L$ (classes $2^L$)', 0, 4, 1, { int: true });
        const pr = []; for (let p = 3; p <= 61; p++) if (isPrime(p)) pr.push(p);
        let sel = [7, 11], hit = null;
        T.onClick((x, y) => { if (!hit) return; const i = Math.floor(x * pr.length), j = Math.floor(y * pr.length); if (i >= 0 && i < pr.length && j >= 0 && j < pr.length && i !== j) sel = [pr[i], pr[j]]; });
        const pw = []; { let x = 1; for (let k = 0; k < 16; k++) { pw.push(x); x = (x * 3) % 17; } }
        const COLS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        let info = {};
        v.render(() => {
          const n = pr.length, c = 1 / n; hit = true;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const p = pr[i], q = pr[j]; const x0 = i * c, y0 = j * c;
            if (i === j) { T.rect(x0, y0, x0 + c, y0 + c, { fill: 'faint', fillAlpha: 0.3, stroke: false }); continue; }
            const a = legendre(p, q), b = legendre(q, p), both3 = p % 4 === 3 && q % 4 === 3;
            T.rect(x0 + c * 0.04, y0 + c * 0.04, x0 + c * 0.96, y0 + c * 0.96, { fill: a === b ? (a > 0 ? 'green' : 'blue') : 'orange', fillAlpha: both3 ? 0.65 : 0.4, color: both3 ? 'ink' : a === b ? (a > 0 ? 'green' : 'blue') : 'orange', width: both3 ? 1.8 : 0.5 });
          }
          const [sp, sq] = sel, si = pr.indexOf(sp), sj = pr.indexOf(sq);
          T.rect(si * c, sj * c, si * c + c, sj * c + c, { color: 'gold', width: 3 });
          for (let i = 0; i < n; i += 2) { T.text(String(pr[i]), (i + 0.5) * c, -0.025, { align: 'center', baseline: 'top', size: 10, color: 'muted' }); T.text(String(pr[i]), -0.015, (i + 0.5) * c, { align: 'right', baseline: 'middle', size: 10, color: 'muted' }); }
          // 17-gon
          Z.circle(0, 0, 1, { color: 'grid', width: 1.2 });
          const m = 2 ** L.value;
          for (let k = 0; k < 16; k++) { const t = (2 * Math.PI * pw[k]) / 17; const col = COLS[(k % m) % 8];
            const x = Math.cos(t), y = Math.sin(t); if (m > 1) Z.line(x, y, Math.cos((2 * Math.PI * pw[(k + m) % 16]) / 17), Math.sin((2 * Math.PI * pw[(k + m) % 16]) / 17), { color: col, alpha: 0.35, width: 1.2 });
            Z.dot(x, y, { r: 7.5, color: col, label: String(pw[k]), labelPos: x >= 0 ? 'e' : 'w' }); }
          Z.dot(1, 0, { r: 9, color: 'ink', label: '1', labelPos: 'e' });
          const vals = []; for (let r = 0; r < m; r++) { let s = 0; for (let k = r; k < 16; k += m) s += Math.cos((2 * Math.PI * pw[k]) / 17); vals.push(s); }
          const f = (z) => v.fix(z, 4);
          const s17 = Math.sqrt(17), nest = (-1 + s17 + Math.sqrt(34 - 2 * s17) + 2 * Math.sqrt(17 + 3 * s17 - Math.sqrt(34 - 2 * s17) - 2 * Math.sqrt(34 + 2 * s17))) / 16;
          info = { vals, m, L: L.value, nest, c17: Math.cos((2 * Math.PI) / 17), f, sel, a: legendre(sp, sq), b: legendre(sq, sp) };
        });
        v.legend([['green', '$(+,+)$', { area: true }], ['blue', '$(-,-)$', { area: true }], ['orange', 'mixed', { area: true }], ['ink', 'bold edge: both $\\equiv3\\ (4)$', { area: true }]]);
        v.readout(() => {
          const { vals, m, nest, c17, f, sel: s, a, b } = info;
          const [p, q] = s;
          return `Cell $(p,q)=(${p},${q})$: $\\left(\\frac pq\\right)=${a}$, $\\left(\\frac qp\\right)=${b}$.\n${m} class${m > 1 ? 'es' : ''} of 16 non-trivial roots (periods ${m === 16 ? 'are the roots themselves; real parts' : 'are real'}): ${vals.map(f).join(', ')}.` + `\nGauss's nested radical gives $\\cos\\frac{2\\pi}{17}=${v.fix(nest, 12)}$; direct: $${v.fix(c17, 12)}$.`;
        });
      },
    },
  ],
};
