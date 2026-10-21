// Number Theory — Chapter 4, part 2: reciprocity, Zolotarev, Jacobi, and the two algorithms (4.6–4.10).
import { mod, gcd, powmod, isPrime, fac, nearOddPrime, legendre, jacobi, squaresMod, inversions, nonResidue, sym } from './ch04.shared.js';

export default {
  collection: 'nt',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Law of quadratic reciprocity',
      statement: String.raw`Let $p$ and $q$ be distinct odd primes. Then
$$\left(\frac pq\right)\left(\frac qp\right)=(-1)^{\frac{p-1}2\cdot\frac{q-1}2}.$$
Thus $\left(\frac pq\right)=\left(\frac qp\right)$ unless $p\equiv q\equiv3\pmod 4$, in which case the two symbols are opposite. Together with the two supplements (4.3, 4.5) this lets one decide the solvability of every congruence $x^2\equiv a\pmod p$.`,
      idea: String.raw`Gauss's lemma (4.4) with $a=q$ gives $\left(\frac qp\right)=(-1)^{S_1}$ where $S_1=\sum_{x=1}^{(p-1)/2}\lfloor qx/p\rfloor$ (Eisenstein's form: for odd $q$ the sign count $\mu$ and $S_1$ have the same parity). Now $S_1$ counts the lattice points $(x,y)$ with $1\le x\le\frac{p-1}2$ lying under the diagonal $y=qx/p$ of the $\frac p2\times\frac q2$ rectangle, and by symmetry $S_2=\sum_{y=1}^{(q-1)/2}\lfloor py/q\rfloor$ counts those above it; no lattice point lies on the diagonal because $p,q$ are coprime. Together they fill the rectangle: $S_1+S_2=\frac{p-1}2\cdot\frac{q-1}2$.`,
      caption: String.raw`The rectangle holds the lattice points $1\le x\le\frac{p-1}2$, $1\le y\le\frac{q-1}2$, split by the diagonal into the $S_1$ blue points below (they give $\left(\frac qp\right)$) and the $S_2$ orange points above (they give $\left(\frac pq\right)$). Change $p$ and $q$: the two counts always add up to the area count $\frac{p-1}2\frac{q-1}2$, so the product of the two signs is its parity. Switch off *primes only*: coprime odd composite inputs still obey reciprocity for the Jacobi symbols. Noncoprime or equal inputs have diagonal points and fall outside that coprime statement; the readout includes those points in the total rather than asserting a false two-part count.`,
      deps: ['nt-4.4', 'nt-4.3', 'nt-4.5'],
      refs: ['Lee–Kumar, MIT 18.781 (2012), Lecture 9, Theorems 41–42, pp.3–6'],
      tags: ['reciprocity', 'lattice points', 'Eisenstein'],
      links: { source: 'https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/d5cdd1b802194a2a236eed934da8ae36_MIT18_781S12_lec9.pdf#page=5' },
      viz(v) {
        const P = v.slider('$p$', 3, 61, 11, { int: true });
        const Q = v.slider('$q$', 3, 61, 7, { int: true });
        const pr = v.toggle('primes only', true);
        const S = v.stage({ x: [-3, 33], y: [-3, 33], equal: true, axes: 'box', gutter: true, height: 420, xlabel: '$x$ (from $p$)', ylabel: '$y$ (from $q$)', title: 'the $\\frac p2\\times\\frac q2$ rectangle of lattice points' });
        let info = {};
        v.render(() => {
          let p = pr.value ? nearOddPrime(P.value, 3, 61) : (P.value % 2 ? P.value : P.value + 1);
          let q = pr.value ? nearOddPrime(Q.value, 3, 61) : (Q.value % 2 ? Q.value : Q.value + 1);
          const hp = (p - 1) / 2, hq = (q - 1) / 2;
          S.setView([-p * 0.04, p / 2 + p * 0.06], [-q * 0.04, q / 2 + q * 0.06]);
          S.rect(0, 0, p / 2, q / 2, { color: 'ink', width: 1.5 });
          S.line(0, 0, p / 2, q / 2, { color: 'gold', width: 2.5 });
          let s1 = 0, s2 = 0, on = 0;
          const r = Math.max(2.2, Math.min(7, 220 / Math.max(p, q)));
          for (let x = 1; x <= hp; x++) for (let y = 1; y <= hq; y++) {
            const d = q * x - p * y; // >0: below diagonal (y < qx/p)
            if (d > 0) { s1++; S.dot(x, y, { r, color: 'blue' }); } else if (d < 0) { s2++; S.dot(x, y, { r, color: 'orange' }); } else { on++; S.dot(x, y, { r: r + 1.5, color: 'red' }); }
          }
          const lpq = pr.value ? legendre(p, q) : jacobi(p, q), lqp = pr.value ? legendre(q, p) : jacobi(q, p);
          info = { p, q, s1, s2, on, hp, hq, lpq, lqp, prime: isPrime(p) && isPrime(q), g: gcd(p, q) };
        });
        v.legend([['blue', '$S_1$: below the diagonal', { dot: true }], ['orange', '$S_2$: above', { dot: true }], ['red', 'on the diagonal', { dot: true }]]);
        v.readout(() => {
          const { p, q, s1, s2, on, hp, hq, lpq, lqp, prime, g } = info;
          const tot = hp * hq, sign = tot % 2 ? -1 : 1;
          const head = `$p=${p},\\ q=${q}$: $S_1=${s1}$ below, $S_2=${s2}$ above, $D=${on}$ on the diagonal; $S_1+S_2+D=${s1+s2+on}=\\frac{${p-1}}2\\cdot\\frac{${q-1}}2=${tot}$.`;
          if (g !== 1) return head + ` The inputs are not coprime ($\\gcd=${g}$), so reciprocity is not asserted. Both Jacobi symbols are zero; the diagonal points cannot be assigned to either strict side.`;
          if (!prime) return head + `\nCoprime odd inputs: the Jacobi extension gives $\\left(\\frac pq\\right)\\left(\\frac qp\\right)=${lpq * lqp}$, equal to the reciprocity sign $${sign}$.`;
          return head + `\n$\\left(\\frac qp\\right)=(-1)^{S_1}=${s1 % 2 ? -1 : 1}$ (symbol: $${lqp}$), $\\left(\\frac pq\\right)=(-1)^{S_2}=${s2 % 2 ? -1 : 1}$ (symbol: $${lpq}$); product $${lpq * lqp}$ $=(-1)^{${tot}}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Lemma',
      name: 'Zolotarev’s lemma',
      statement: String.raw`Let $p$ be an odd prime and $p\nmid a$. Consider the permutation $\pi_a:\ x\mapsto ax\bmod p$ of the $p-1$ non-zero residues $\{1,\dots,p-1\}$. Then
$$\operatorname{sgn}(\pi_a)=\left(\frac ap\right).$$
Equivalently, the number of inversions of the sequence $a\cdot1,\ a\cdot2,\dots,a(p-1)$ (reduced mod $p$) is even exactly when $a$ is a quadratic residue.`,
      idea: String.raw`The map $a\mapsto\operatorname{sgn}(\pi_a)$ is a homomorphism from $(\Z/p\Z)^\times$ to $\{\pm1\}$ (the sign of a permutation is multiplicative, comb-2.5, and $\pi_{ab}=\pi_a\circ\pi_b$). Because the unit group is cyclic (3.2), generated by a primitive root $g$, a homomorphism onto $\{\pm1\}$ is determined by its value at $g$. The permutation $\pi_g$ is a single $(p-1)$-cycle, which is odd since $p-1$ is even, so $\operatorname{sgn}(\pi_g)=-1$. Hence $\operatorname{sgn}(\pi_a)=(-1)^k$ for $a=g^k$, which is $\left(\frac ap\right)$ by Euler's criterion.`,
      caption: String.raw`Left column: $x=1,\dots,p-1$; right column: $ax \bmod p$; each string joins $x$ to its image. Every crossing of two strings is an inversion (gold dots). Slide $a$ and $p$: the number of crossings changes wildly, but its parity always agrees with $\left(\frac ap\right)$. For $a=1$ there are no crossings; for $a=-1$ every pair crosses, $\binom{p-1}2$ of them — odd exactly when $p\equiv3\pmod4$, as in 4.3.`,
      deps: ['nt-4.1', 'nt-4.2', 'nt-3.2', 'comb-2.5'],
      refs: ['Ireland–Rosen ch. 5'],
      tags: ['permutation', 'sign', 'Legendre symbol'],
      credit: 'Zolotarev, 1872',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zolotarev%27s_lemma' },
      viz(v) {
        const P = v.slider('prime $p$', 5, 29, 13, { int: true });
        const A = v.slider('$a$', 1, 60, 5, { int: true });
        const S = v.stage({ x: [-0.25, 1.25], y: [0, 1], axes: false, height: 440, title: 'strings $x\\to ax \\bmod p$' });
        let info = {};
        v.render(() => {
          const p = nearOddPrime(P.value, 5, 29), a = mod(A.value, p) || 1, n = p - 1;
          const ys = (k) => 0.97 - (k - 1) * (0.94 / (n - 1));
          S.setView([-0.25, 1.25], [0, 1]);
          const img = []; for (let x = 1; x <= n; x++) img.push((a * x) % p);
          for (let x = 1; x <= n; x++) S.line(0, ys(x), 1, ys(img[x - 1]), { color: 'blue', alpha: 0.55, width: 1.4 });
          let cross = 0;
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (img[i] > img[j]) {
            cross++;
            const di = (i + 1) - img[i] , dj = (j + 1) - img[j]; // in index units; t where lines meet
            const t = ((j + 1) - (i + 1)) / (((j + 1) - (i + 1)) - (img[j] - img[i]));
            const yy = ys(i + 1) + t * (ys(img[i]) - ys(i + 1));
            S.dot(t, yy, { r: 3, color: 'gold' });
          }
          for (let x = 1; x <= n; x++) { S.dot(0, ys(x), { r: 3.5, color: 'ink' }); S.text(String(x), -0.04, ys(x), { align: 'right', baseline: 'middle', size: 11, color: 'muted' }); S.dot(1, ys(x), { r: 3.5, color: 'ink' }); S.text(String(x), 1.04, ys(x), { align: 'left', baseline: 'middle', size: 11, color: 'muted' }); }
          S.text('x', 0, 1.0, { align: 'center', size: 12, color: 'muted', baseline: 'bottom' }); S.text('ax mod p', 1, 1.0, { align: 'center', size: 12, color: 'muted', baseline: 'bottom' });
          info = { p, a, cross, inv: inversions(img), leg: legendre(a, p) };
        });
        v.readout(() => `$p=${info.p}$, $a=${info.a}$: **${info.cross}** crossings, $\\operatorname{sgn}(\\pi_a)=(-1)^{${info.cross}}=${info.cross % 2 ? -1 : 1}$; $\\left(\\frac{${info.a}}{${info.p}}\\right)=${info.leg}$. Inversion count by direct comparison: ${info.inv}.`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Jacobi symbol and its reciprocity law',
      statement: String.raw`For an odd positive integer $n=p_1^{e_1}\cdots p_r^{e_r}$ and any integer $a$, the *Jacobi symbol* is
$$\left(\frac an\right)=\prod_{i}\left(\frac a{p_i}\right)^{e_i}.$$
It is multiplicative in $a$ and in $n$, depends only on $a\bmod n$, and satisfies $\left(\frac{-1}n\right)=(-1)^{(n-1)/2}$, $\left(\frac2n\right)=(-1)^{(n^2-1)/8}$ and, for odd coprime positive $m,n$, the reciprocity law
$$\left(\frac mn\right)\left(\frac nm\right)=(-1)^{\frac{m-1}2\cdot\frac{n-1}2}.$$
Caution: $\left(\frac an\right)=-1$ proves that $a$ is not a square mod $n$, but $\left(\frac an\right)=1$ does **not** prove it is one when $n$ is composite.`,
      idea: String.raw`Everything follows from the prime case (4.6, 4.3, 4.5) by multiplying over the prime factors. For the law one uses that for odd $a,b$ we have $\frac{ab-1}2\equiv\frac{a-1}2+\frac{b-1}2\pmod 2$, and likewise $\frac{a^2b^2-1}8\equiv\frac{a^2-1}8+\frac{b^2-1}8\pmod 2$, so the sign rules for $-1$, $2$ and reciprocity extend multiplicatively from primes to products. The warning is simple: if $n=pq$ and $a$ is a non-residue modulo both, the two signs $-1$ multiply to $+1$ although $a$ is not a square modulo $p$ (hence not modulo $n$).`,
      caption: String.raw`Choose an odd $n$ (try $15$); an even slider value is rounded up. The chart covers every nonzero class $a$. Left: for every $a$ the bar gives $\left(\frac an\right)$; a gold cap marks the classes that really are squares mod $n$ (found by brute force) — **red hatched bars** are the traps where the symbol is $+1$ but $a$ is not a square. Right: a table of $\left(\frac mn\right)\left(\frac nm\right)$ against the predicted sign $(-1)^{\frac{m-1}2\frac{n-1}2}$ for odd coprime $m,n\le31$; every cell agrees (green), the dark cells are the pairs with both $\equiv3\pmod4$.`,
      deps: ['nt-4.6', 'nt-4.1'],
      refs: ['Lee–Kumar, MIT 18.781 (2012), Lecture 10, pp.1–2'],
      tags: ['Jacobi symbol', 'reciprocity'],
      links: { source: 'https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/785c307302fa0fd1113b0fd6bdaf6f4a_MIT18_781S12_lec10.pdf#page=2' },
      viz(v) {
        const N = v.slider('odd $n$', 3, 99, 15, { int: true });
        const B = v.stage({ x: [0, 100], y: [-1.7, 1.9], axes: 'box', gutter: true, height: 360, xlabel: '$a$', ylabel: '$\\left(\\frac an\\right)$', title: 'the Jacobi symbol against actual squares' });
        const T = v.stage({ x: [1, 32], y: [1, 32], equal: true, axes: 'box', gutter: true, height: 360, xlabel: '$m$', ylabel: '$n$', title: '$\\left(\\frac mn\\right)\\left(\\frac nm\\right)$ vs. the predicted sign' });
        let info = {};
        v.render(() => {
          const n = N.value % 2 ? N.value : N.value + 1, sq = squaresMod(n);
          B.setView([0, n], [-1.7, 1.9]); B.setTicks(null, [[-1, '−1'], [0, '0'], [1, '1']]);
          let traps = 0;
          for (let a = 1; a < n; a++) {
            const j = jacobi(a, n), isq = sq.has(a);
            if (isq) B.dot(a, 1.45, { r: Math.max(2.5, Math.min(5, 150 / n)), color: 'gold' });
            if (j === 0) { B.rect(a - 0.35, -0.05, a + 0.35, 0.05, { fill: 'faint', color: 'faint' }); continue; }
            const trap = j === 1 && !isq; if (trap) traps++;
            B.rect(a - 0.4, 0, a + 0.4, j, { fill: trap ? 'red' : j > 0 ? 'green' : 'blue', fillAlpha: 0.45, color: trap ? 'red' : j > 0 ? 'green' : 'blue', width: 1, hatch: trap });

          }
          B.text('gold = a really is a square mod n', n * 0.98, 1.75, { align: 'right', size: 11, color: 'gold' });
          let ok = 0, tot = 0;
          for (let m = 3; m <= 31; m += 2) for (let k = 3; k <= 31; k += 2) {
            if (gcd(m, k) !== 1) { T.rect(m - 1, k - 1, m + 1, k + 1, { fill: 'faint', fillAlpha: 0.2, stroke: false }); continue; }
            const prod = jacobi(m, k) * jacobi(k, m), pred = (((m - 1) / 2) * ((k - 1) / 2)) % 2 ? -1 : 1; tot++;
            const good = prod === pred; if (good) ok++;
            T.rect(m - 1, k - 1, m + 1, k + 1, { fill: !good ? 'red' : pred < 0 ? 'ink' : 'green', fillAlpha: pred < 0 ? 0.55 : 0.4, stroke: false });
          }
          T.rect(n > 31 ? 31 : n, 1, n > 31 ? 31 : n, 31, { color: 'gold', width: 0 });
          info = { n, traps, ok, tot, f: fac(n) };
        });
        v.readout(() => {
          const { n, traps, ok, tot, f } = info;
          const fs = f.map(([p, e]) => (e > 1 ? `${p}^{${e}}` : `${p}`)).join('\\cdot');
          return `$n=${fs}$: **${traps}** class${traps === 1 ? '' : 'es'} $a$ with $\\left(\\frac an\\right)=+1$ that are *not* squares mod $n$${isPrime(n) ? ' (none for a prime)' : ''}. Reciprocity table: ${ok} of ${tot} pairs agree.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Algorithm',
      name: 'Computing Legendre symbols by reciprocity',
      statement: String.raw`To evaluate $\left(\frac an\right)$ for odd $n>0$ (a Jacobi symbol; a Legendre symbol when $n$ is prime) without factoring $n$: set $s\leftarrow1$ and repeat
(a) $a\leftarrow a\bmod n$; if $a=0$ stop with $0$ unless $n=1$;
(b) while $a$ is even: $a\leftarrow a/2$, and flip $s$ if $n\equiv\pm3\pmod 8$;
(c) swap $a\leftrightarrow n$, and flip $s$ if both are $\equiv3\pmod 4$;
until $n=1$; the answer is $s$ (or $0$ if the gcd was $>1$). The number of rounds is $O(\log n)$, like Euclid's algorithm.`,
      idea: String.raw`Each rule is one property of the Jacobi symbol (4.8): reducing mod $n$, pulling out the factor $2$ with the second supplement, and flipping with reciprocity. The pair $(a,n)$ evolves exactly like the pair in the Euclidean algorithm (1.3), so the inputs shrink geometrically and the process ends with a gcd: $n=1$ means coprime. No factorisation is needed, which is why this beats Euler's criterion for large inputs; for a prime $n$ the answer agrees with $a^{(n-1)/2}\bmod n$.`,
      caption: String.raw`Choose $a$ and an odd $n$ and step through. The left panel lists the pairs $(a,n)$ so far with the rule used and the running sign; the right panel plots $\log_2$ of the two numbers against the step — they only shrink. The note under the picture confirms the answer by Euler's criterion when $n$ is prime. Try consecutive Fibonacci numbers for the slowest case.`,
      deps: ['nt-4.8', 'nt-4.5', 'nt-4.6', 'nt-1.3'],
      refs: ['Apostol §9.6', 'Apostol §9.7'],
      tags: ['Jacobi symbol', 'Euclid', 'algorithm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jacobi_symbol#Calculating_the_Jacobi_symbol' },
      viz(v) {
        const A = v.slider('$a$', 1, 5000, 1001, { int: true, onChange: () => S && S.reset(undefined, { at: 'start' }) });
        const N = v.slider('odd $n$', 3, 5001, 9907, { int: true, onChange: () => S && S.reset(undefined, { at: 'start' }) });
        let S = null;
        const run = () => {
          const n0 = N.value % 2 ? N.value : N.value + 1;
          let a = A.value, n = n0, s = 1; const fr = [], hist = [];
          const push = (o) => { hist.push({ a, n, s, tag: o.tag }); fr.push({ ...o, hist: hist.slice(), a, n, s, vars: { a, n, s } }); };
          push({ tag: 'start', line: 1, note: `Start: compute $\\left(\\frac{${a}}{${n}}\\right)$ with $s=1$.` });
          for (let guard = 0; guard < 60; guard++) {
            if (a >= n) { const na = a % n; a = na; push({ tag: 'reduce', line: 2, note: `Reduce $a$ modulo $n$: $a=${a}$.` }); }
            if (a === 0) { s = n === 1 ? s : 0; push({ tag: 'zero', line: 5, final: true, note: n === 1 ? `$a=0$ but $n=1$: the symbol is $${s}$.` : `$a=0$ with $n=${n}>1$: $\\gcd(a,n)>1$, the symbol is $0$.` }); break; }
            while (a % 2 === 0) { a /= 2; const f = n % 8 === 3 || n % 8 === 5; if (f) s = -s; push({ tag: 'half', line: 3, note: `$a$ even: halve it ($a=${a}$). Since $n=${n}\\equiv${n % 8}\\pmod 8$ the factor $2$ ${f ? 'contributes $-1$' : 'contributes $+1$'}.` }); }
            if (a === 1) { push({ tag: 'one', line: 5, final: true, note: `$\\left(\\frac1n\\right)=1$. Answer $s=${s}$.` }); break; }
            const f = a % 4 === 3 && n % 4 === 3; if (f) s = -s; const t = a; a = n; n = t;
            push({ tag: 'swap', line: 4, note: `Reciprocity: swap. ${f ? 'Both were $\\equiv3\\pmod4$: flip the sign.' : 'No sign change.'} Now $\\left(\\frac{${a}}{${n}}\\right)$.` });
          }
          return fr;
        };
        const H = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'the computation so far' });
        const G = v.stage({ x: [0, 12], y: [0, 14], axes: 'box', gutter: true, height: 330, xlabel: 'step', ylabel: '$\\log_2$', title: 'the numbers shrink' });
        S = v.steps({ frames: run, speed: 1.2, start: 'end', still: 'end', codePos: 'below', counter: 'step',
          code: ['$s \\leftarrow 1$', 'repeat:   $a \\leftarrow a \\bmod n$', '    while $a$ even:  $a \\leftarrow a/2$;  flip $s$ if $n\\equiv\\pm3 \\pmod 8$', '    swap $a \\leftrightarrow n$;  flip $s$ if both $\\equiv3 \\pmod 4$', 'until $a=0$ or $a=1$   // answer $s$ (0 if $\\gcd>1$)'] });
        let info = {};
        v.render(() => {
          const f = S.frame, hist = f.hist || [], all = S.frames;
          const rows = Math.min(hist.length, 14), h = 0.92 / 14;
          const shown = hist.slice(-14);
          shown.forEach((r, i) => { const y = 0.95 - i * h; const last = i === shown.length - 1;
            H.text(`(${r.a}/${r.n})`, 0.03, y, { size: 13, weight: last ? 700 : 500, color: last ? 'ink' : 'muted' });
            H.text(`s = ${r.s > 0 ? '+1' : r.s < 0 ? '−1' : '0'}`, 0.40, y, { size: 12.5, color: r.s > 0 ? 'green' : r.s < 0 ? 'red' : 'muted', weight: 600 });
            H.text(r.tag, 0.62, y, { size: 12, color: 'faint' }); });
          G.setView([0, Math.max(6, all.length)], [0, 14]);
          const pts = (key, col) => { G.path(all.map((fr, i) => [i, Math.log2(Math.max(1, fr[key]))]), { color: col, width: 1.5, alpha: 0.35 }); all.forEach((fr, i) => { if (i <= S.i) G.dot(i, Math.log2(Math.max(1, fr[key])), { r: 4, color: col }); }); };
          pts('a', 'blue'); pts('n', 'orange'); G.vline(S.i, { color: 'gold', dash: true });
          const n0 = N.value % 2 ? N.value : N.value + 1, last = all[all.length - 1];
          info = { n0, a: A.value, ans: last ? last.s : 0, prime: isPrime(n0), euler: isPrime(n0) ? legendre(A.value, n0) : null, rounds: all.length };
        });
        v.legend([['blue', '$a$', { dot: true }], ['orange', '$n$', { dot: true }]]);
        v.readout(() => `$\\left(\\frac{${info.a}}{${info.n0}}\\right)=${info.ans}$ after ${info.rounds - 1} step${info.rounds === 2 ? '' : 's'}.${info.prime ? ` $n$ is prime: Euler's criterion gives $${info.euler}$ — ${info.euler === info.ans ? 'agrees' : 'DISAGREES'}.` : ' $n$ is composite: this is the Jacobi symbol.'}`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Algorithm',
      name: 'Square roots modulo a prime (Tonelli–Shanks)',
      statement: String.raw`Let $p$ be an odd prime and $a$ a quadratic residue mod $p$. Write $p-1=Q\,2^S$ with $Q$ odd, pick a non-residue $z$, and set $M=S$, $c=z^Q$, $t=a^Q$, $R=a^{(Q+1)/2}$ (all mod $p$). While $t\ne1$: find the least $i$ with $t^{2^i}\equiv1$ (so $0<i<M$), put $b=c^{2^{M-i-1}}$, and update $M\leftarrow i$, $c\leftarrow b^2$, $t\leftarrow tb^2$, $R\leftarrow Rb$. Then $R^2\equiv a\pmod p$. The invariant is $R^2\equiv at$ with $t$ of 2-power order dividing $2^{M-1}$ and $c$ of order exactly $2^M$; $M$ strictly decreases, so there are at most $S$ rounds.`,
      idea: String.raw`Initially $R^2=a^{Q+1}=a\cdot a^Q=at$, and $t$ lies in the subgroup of order $2^S$ of the cyclic group $(\Z/p\Z)^\times$ (3.2); it is in fact in the subgroup of index $2$ because $a$ is a square (Euler's criterion, 4.2). If $t\ne1$ with order $2^i$, then $b=c^{2^{M-i-1}}$ has order $2^{i+1}$, so $b^2$ has order $2^i$ and $b^{2^i}=-1$; multiplying $t$ by $b^2$ kills the top order of $t$ (order of $tb^2$ divides $2^{i-1}$) while $R^2=at$ stays equal to $a\,t$ after $R\to Rb$. When $t=1$, $R^2=a$.`,
      caption: String.raw`Choose $p$ (snaps to a prime) and $a$ and step through. The bars show $e=\log_2\operatorname{ord}(t)$ after each round: it falls strictly and the loop ends when $e$ reaches the “order $1$” level. The ledger on the right records $M,c,t,R$ and the invariant $R^2\equiv a t$ at each step. Choose a non-residue $a$ (the readout says when): the algorithm refuses at the start, which is the hypothesis breaking. Primes with a large power of $2$ in $p-1$, such as $97$, $257$ or $641$, make the loop long.`,
      deps: ['nt-4.2', 'nt-3.2'],
      refs: ['Ireland–Rosen ch. 5'],
      tags: ['square root', 'algorithm', 'Tonelli–Shanks'],
      credit: 'Tonelli, 1891; Shanks, 1973 (independently)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm' },
      viz(v) {
        const P = v.slider('prime $p$', 5, 1000, 97, { int: true, onChange: () => S && S.reset(undefined, { at: 'start' }) });
        const A = v.slider('$a$', 1, 1000, 2, { int: true, onChange: () => S && S.reset(undefined, { at: 'start' }) });
        let S = null;
        const eOrd = (t, p) => { let e = 0, x = t; while (x !== 1 && e < 40) { x = (x * x) % p; e++; } return e; };
        const run = () => {
          const p = nearOddPrime(P.value, 5, 1000), a = mod(A.value, p) || 1;
          let Q = p - 1, Sx = 0; while (Q % 2 === 0) { Q /= 2; Sx++; }
          const fr = [];
          if (legendre(a, p) !== 1) { fr.push({ bad: true, p, a, Q, Sx, line: 1, note: `$p-1=${Q}\\cdot2^{${Sx}}$. But $a=${a}$ is a non-residue ($a^{(p-1)/2}\\equiv-1$): no square root exists, the algorithm would loop forever.` }); return fr; }
          const z = nonResidue(p);
          let M = Sx, c = powmod(z, Q, p), t = powmod(a, Q, p), R = powmod(a, (Q + 1) / 2, p);
          const rec = (o) => fr.push({ p, a, Q, Sx, z, M, c, t, R, e: eOrd(t, p), inv: (R * R) % p === (a * t) % p, vars: { M, c, t, R }, ...o });
          rec({ line: 1, note: `$p-1=${p - 1}=${Q}\\cdot2^{${Sx}}$ ($Q=${Q}$, $S=${Sx}$). Smallest non-residue $z=${z}$.` });
          rec({ line: 2, note: `$M=${M}$, $c=z^Q\\equiv${c}$, $t=a^Q\\equiv${t}$, $R=a^{(Q+1)/2}\\equiv${R}$. Then $R^2\\equiv${(R * R) % p}$ and $a t\\equiv${(a * t) % p}$: equal.` });
          for (let g = 0; g < 40 && t !== 1; g++) {
            const i = eOrd(t, p); let b = c; for (let k = 0; k < M - i - 1; k++) b = (b * b) % p;
            const oldM = M; M = i; c = (b * b) % p; t = (t * c) % p; R = (R * b) % p;
            rec({ line: 3, note: `$\\operatorname{ord}(t)=2^{${i}}$ (least $i$ with $t^{2^i}\\equiv1$). $b=c^{2^{${oldM - i - 1}}}\\equiv${b}$. Update: $M=${M}$, $c=b^2\\equiv${c}$, $t\\leftarrow tb^2\\equiv${t}$, $R\\leftarrow Rb\\equiv${R}$.` });
          }
          rec({ line: 4, final: true, note: `$t=1$, so $R^2\\equiv a t=a$: the roots are $\\pm${R}$, i.e. $${R}$ and $${p - R}$.` });
          return fr;
        };
        const Bs = v.stage({ x: [0, 8], y: [0, 6], axes: 'box', gutter: true, height: 300, xlabel: 'round', ylabel: '$\\log_2 \\operatorname{ord}(t)$', title: 'the order of $t$ falls' });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'ledger' });
        S = v.steps({ frames: run, speed: 0.9, start: 'end', still: 'end', codePos: 'below',
          code: ['write $p-1 = Q\\,2^S$;  pick a non-residue $z$', '$M \\leftarrow S,\\ c \\leftarrow z^Q,\\ t \\leftarrow a^Q,\\ R \\leftarrow a^{(Q+1)/2}$', 'while $t \\neq 1$:  $i \\leftarrow$ least with $t^{2^i}=1$;  $b \\leftarrow c^{2^{M-i-1}}$;', '        $M \\leftarrow i,\\ c \\leftarrow b^2,\\ t \\leftarrow t b^2,\\ R \\leftarrow R b$', 'return $R$   // $R^2 \\equiv a \\pmod p$'] });
        let info = {};
        v.render(() => {
          const frs = S.frames, f = S.frame;
          if (f.bad) { Bs.setView([0, 8], [0, 6]); L.text('a is a quadratic non-residue', 0.5, 0.5, { align: 'center', size: 15, color: 'red', weight: 700 }); info = { bad: true, p: f.p, a: f.a }; return; }
          const rounds = frs.length - 1, top = Math.max(2, f.Sx);
          Bs.setView([0, Math.max(rounds, 3) + 0.5], [0, top + 0.5]); Bs.setTicks(null, Array.from({ length: top + 1 }, (_, k) => [k, String(k)]));
          frs.forEach((fr, k) => { if (k < 1) return; const on = k <= S.i; Bs.rect(k - 1 - 0.35 + 0.5, 0, k - 1 + 0.35 + 0.5, fr.e, { fill: 'blue', fillAlpha: on ? 0.55 : 0.12, color: 'blue', width: 1 }); });
          Bs.hline(f.Sx - 1, { color: 'faint', dash: true });
          const shown = frs.slice(1, S.i + 1), h = Math.min(0.12, 0.8 / 9);
          ['step', 'M', 'c', 't', 'R', 'R² = a·t'].forEach((h, j) => L.text(h, [0.06, 0.2, 0.35, 0.5, 0.65, 0.8][j], 0.95, { size: 12, color: 'muted', weight: 700 }));
          shown.slice(-8).forEach((fr, k) => { const y = 0.83 - k * h; const idx = frs.indexOf(fr) - 1; const last = fr === f;
            L.text(`${idx}`, 0.06, y, { size: 12.5, color: last ? 'ink' : 'muted', weight: last ? 700 : 500 });
            [fr.M, fr.c, fr.t, fr.R].forEach((val, j) => L.text(String(val), 0.2 + j * 0.15, y, { size: 12.5, color: last ? 'ink' : 'muted', weight: last ? 700 : 500 }));
            L.text(fr.inv ? '✓' : '✗', 0.82, y, { size: 13, color: fr.inv ? 'green' : 'red', weight: 700 }); });
          info = { p: f.p, a: f.a, R: f.R, fin: f.final, Q: f.Q, Sx: f.Sx, rounds: frs.length - 3 };
        });
        v.readout(() => info.bad ? `$a=${info.a}$ is **not** a square modulo $${info.p}$ (Euler: $a^{(p-1)/2}\\equiv-1$): there is nothing to compute.` : `$p=${info.p}$, $p-1=${info.Q}\\cdot2^{${info.Sx}}$, $a=${info.a}$: ${info.fin ? `root $R=${info.R}$, $R^2\\equiv${(info.R * info.R) % info.p}$ ${(info.R * info.R) % info.p === info.a ? '= a ✓' : '≠ a ✗'}; ` : ''}the loop needs at most $S=${info.Sx}$ rounds (this input uses ${Math.max(0, info.rounds)}).`);
      },
    },
  ],
};
