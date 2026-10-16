// Abstract Algebra (Judson) — Chapter 2: The Integers
// Part 1 (this file): induction in its two forms, well-ordering, the division algorithm and the gcd (2.1–2.9a).
// Part 2 (ch02-b.js): Bézout, Euclid's algorithm, primes, Euclid's lemma and unique factorization (2.10–2.15).
import { mod, gcd, divisors, isPrime, spf, sub, par, buildTree, leaves, depth, layoutTree, drawTree, numberLine, tile, hop } from './ch02.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
/** Pascal's triangle rows 0..n. */
const pascal = (n) => { const R = [[1]]; for (let i = 1; i <= n; i++) { const p = R[i - 1]; R.push(Array.from({ length: i + 1 }, (_, k) => (p[k - 1] || 0) + (p[k] || 0))); } return R; };
/** Is n a sum of two squares of integers? */
const sumTwoSq = (n) => { if (n < 0) return false; for (let x = 0; x * x <= n; x++) { const y = Math.round(Math.sqrt(n - x * x)); if (y * y === n - x * x) return true; } return false; };

export default {
  collection: 'alg',
  chapter: 2,
  title: 'The Integers',
  summary: String.raw`Ordinary induction, strong induction and the well-ordering principle are set side by side and shown to be interchangeable ways of saying that the natural numbers have no hidden corners. The division algorithm then leads to the greatest common divisor as an integer combination $ar+bs$, to Euclid’s algorithm for computing it, to Euclid’s lemma on primes dividing products, to the infinitude of primes and to the uniqueness of prime factorization.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Principle',
      name: 'First principle of mathematical induction',
      statement: String.raw`Let $S(n)$ be a statement about integers $n$, and let $n_0$ be an integer. Suppose that
(a) $S(n_0)$ is true (the **base case**), and
(b) for every integer $k\ge n_0$, if $S(k)$ is true then $S(k+1)$ is true (the **inductive step**).

Then $S(n)$ is true for every integer $n\ge n_0$.`,
      idea: String.raw`If some $n\ge n_0$ made $S(n)$ false, there would be a first such $n$ (this is where well-ordering, 2.6, enters — the two principles are equivalent). It cannot be $n_0$ by (a), and if it were $k+1$ then $S(k)$ would be true and (b) would force $S(k+1)$. The dominoes are the classical picture: (a) tips the first one, and (b) says that each falling domino knocks over the next. Both halves are needed — a valid step with no base case proves nothing, and a base case with a step that only works from some point on leaves a gap.`,
      caption: String.raw`Choose a claim and the starting value $n_0$. Each domino $n$ carries a badge saying whether $S(n)$ is actually true. The push is the base case; a red gap marks a $k$ where the inductive step's argument breaks. Try $n^2<2^n$ from $n_0=1$ (the chain breaks at once) and from $n_0=5$, and the false formula whose step works perfectly but whose base case never holds.`,
      deps: [],
      refs: ['Judson §2.1'],
      tags: ['induction', 'proof'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mathematical_induction' },
      viz(v) {
        const NMAX = 14, W = 0.24, H = 1.5, LEAN = Math.acos(W);
        const p10 = (k) => BigInt(10) ** BigInt(k);
        const CL = {
          pow: { label: '$2^n > n+4$', tex: '2^n > n+4', n0: 3, S: (n) => 2 ** n > n + 4, ok: () => true,
            show: (n) => `2^{${n}} = ${2 ** n} ${2 ** n > n + 4 ? '>' : '\\le'} ${n + 4}`, step: String.raw`2^{k+1} = 2\cdot 2^k > 2(k+4) = 2k+8 > (k+1)+4`, need: 'valid for every $k \\ge 1$' },
          sq: { label: '$n^2 < 2^n$', tex: 'n^2 < 2^n', n0: 1, S: (n) => n * n < 2 ** n, ok: (k) => k >= 3,
            show: (n) => `${n}^2 = ${n * n} ${n * n < 2 ** n ? '<' : '\\ge'} 2^{${n}} = ${2 ** n}`, step: String.raw`2^{k+1} = 2\cdot 2^k > 2k^2 \ge (k+1)^2`, need: 'the last inequality needs $k^2 \\ge 2k+1$, which holds only for $k \\ge 3$' },
          nine: { label: '$9 \\mid 10^{n+1}+3\\cdot 10^n+5$', tex: '9 \\mid 10^{n+1}+3\\cdot 10^n+5', n0: 1, S: (n) => (p10(n + 1) + BigInt(3) * p10(n) + BigInt(5)) % BigInt(9) === BigInt(0), ok: () => true,
            show: (n) => `10^{${n + 1}} + 3\\cdot 10^{${n}} + 5 = ${p10(n + 1) + BigInt(3) * p10(n) + BigInt(5)} = 9\\cdot ${(p10(n + 1) + BigInt(3) * p10(n) + BigInt(5)) / BigInt(9)}`, step: String.raw`10^{k+2}+3\cdot 10^{k+1}+5 = 10\,(10^{k+1}+3\cdot 10^k+5) - 45`, need: 'a multiple of 9 times 10, minus 45: valid for every $k$' },
          sum: { label: '$1+\\cdots+n = \\frac{n(n+1)}{2}$', tex: '1+2+\\cdots+n = \\tfrac{n(n+1)}{2}', n0: 1, S: () => true, ok: () => true,
            show: (n) => `1+\\cdots+${n} = ${(n * (n + 1)) / 2} = \\tfrac{${n}\\cdot ${n + 1}}{2}`, step: String.raw`\tfrac{k(k+1)}{2} + (k+1) = \tfrac{(k+1)(k+2)}{2}`, need: 'valid for every $k$' },
          bad: { label: 'false: $\\ldots = \\frac{n(n+1)}{2}+1$', tex: '1+2+\\cdots+n = \\tfrac{n(n+1)}{2}+1', n0: 1, S: () => false, ok: () => true,
            show: (n) => `1+\\cdots+${n} = ${(n * (n + 1)) / 2} \\ne ${(n * (n + 1)) / 2 + 1}`, step: String.raw`\tfrac{k(k+1)}{2}+1 + (k+1) = \tfrac{(k+1)(k+2)}{2}+1`, need: 'the step works for every $k$' },
        };
        const claim = v.select('claim', Object.entries(CL).map(([value, c]) => ({ value, label: c.label })), 'pow', { onChange: (k) => { N0.set(CL[k].n0); v.restart(); } });
        const N0 = v.slider('$n_0$', 1, 6, 3, { int: true, onChange: () => v.restart() });
        const s = v.stage({ x: [0, 17], y: [-0.75, 2.3], equal: true, axes: false, height: 205, full: true });
        const layout = () => {
          const c = CL[claim.value], n0 = N0.value, xs = [0, 1];
          for (let k = 1; k < NMAX; k++) xs.push(xs[k] + 1 + (k >= n0 && !c.ok(k) ? 0.95 : 0));
          let end = NMAX; for (let k = n0; k < NMAX; k++) if (!c.ok(k)) { end = k; break; }
          return { c, n0, xs, base: c.S(n0), end };
        };
        const T0 = 0.6, DT = 0.27, FALL = 0.36;
        const domino = (x, phi, st) => {
          const px = x + W / 2, cs = Math.cos(phi), sn = Math.sin(phi);
          const P = [[-W, 0], [0, 0], [0, H], [-W, H]].map(([a, b]) => [px + a * cs + b * sn, -a * sn + b * cs]);
          s.poly(P, st);
        };
        v.animate((t) => {
          const L = layout(), { c, n0, xs } = L;
          s.setView([Math.min(0.2, xs[n0] - 1.25), xs[NMAX] + 1.6], [-0.75, 2.3]);
          s.line(0.3, 0, xs[NMAX] + 1.5, 0, { color: 'muted', width: 1.5 });
          for (let k = 1; k <= NMAX; k++) {
            const x = xs[k], active = k >= n0, truth = c.S(k);
            let phi = 0;
            if (active && L.base && k <= L.end) {
              const u = ease((t - (T0 + DT * (k - n0))) / FALL);
              phi = u * (k === L.end ? Math.PI / 2 : LEAN);
            }
            const fallen = phi > 0.01;
            domino(x, phi, active ? { fill: fallen ? 'accent' : 'panel', fillAlpha: fallen ? 0.55 : 1, color: k === n0 && !L.base ? 'red' : 'accent', width: 1.8 } : { fill: 'faint', fillAlpha: 0.25, color: 'faint', width: 1.2 });
            s.text(String(k), x, 0, { dy: 14, align: 'center', size: 12, weight: k === n0 ? 800 : 600, color: active ? 'ink' : 'muted' });
            s.text(truth ? '✓' : '✗', x, H, { dy: -16, align: 'center', size: 13, weight: 800, color: truth ? 'green' : 'red', alpha: active ? 1 : 0.45 });
            if (active && k < NMAX && !c.ok(k)) {
              const gx = (x + xs[k + 1]) / 2 + 0.25;
              s.line(gx, -0.25, gx, 1.8, { color: 'red', width: 1.6, dash: [4, 4] });
              s.text('step fails', gx, 1.95, { align: 'center', size: 11, weight: 700, color: 'red' });
            }
          }
          // the push = base case
          const x0 = xs[n0];
          if (L.base) { const u = clamp(t / T0, 0, 1); s.arrow(x0 - 0.95 + 0.45 * u, H * 0.8, x0 - 0.18 - 0.05 * (1 - u), H * 0.8, { color: 'gold', width: 3 }); s.text('push', x0 - 0.55, H * 0.8, { dy: -13, align: 'center', size: 11, weight: 800, color: 'gold', plate: true }); }
          else { s.text('✗', x0, H / 2, { align: 'center', size: 22, weight: 800, color: 'red' }); s.text(`S(${n0}) is false: no push`, x0 - 0.15, -0.62, { align: 'left', size: 11.5, weight: 700, color: 'red' }); }
          s.corner('badge = is S(n) actually true?', 'tr', { size: 11.5 });
        }, { period: T0 + DT * NMAX + FALL + 2.2, still: T0 + DT * NMAX + FALL + 1.5 });
        v.readout(() => {
          const L = layout(), { c, n0 } = L;
          const head = String.raw`$S(n):\ ${c.tex}$, from $n_0 = ${n0}$. **Base:** $${c.show(n0)}$ ${L.base ? '✓' : '✗'}. **Step:** $${c.step}$ — ${c.need}.`;
          let tail;
          if (!L.base) tail = `Without a true base case nothing starts${c.ok(n0) ? ', even though the step is valid' : ''}.`;
          else if (L.end < NMAX) tail = `The chain stops after domino ${L.end}: the step from $k = ${L.end}$ is not justified, and indeed $S(${L.end + 1})$ is ${c.S(L.end + 1) ? 'true by luck' : '**false**'}.`;
          else { let all = true; for (let k = n0; k <= NMAX; k++) if (!c.S(k)) all = false; tail = `Every domino from ${n0} on falls: $S(n)$ holds for all $n \\ge ${n0}$ (checked directly up to ${NMAX}: ${all ? '✓' : '✗'}).`; }
          return `${head}\n${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Binomial theorem by induction',
      statement: String.raw`For real numbers $a,b$ and every $n\in\mathbb N$,
$$(a+b)^n=\sum_{k=0}^{n}\binom nk a^k b^{n-k},\qquad \binom nk=\frac{n!}{k!\,(n-k)!}.$$
The induction rests on Pascal’s rule $\binom{n+1}{k}=\binom nk+\binom n{k-1}$ for $1\le k\le n$.`,
      idea: String.raw`The base case $n=1$ reads $a+b=a+b$. For the step write $(a+b)^{n+1}=(a+b)^n\cdot a+(a+b)^n\cdot b$: multiplying by $b$ keeps every power of $a$, multiplying by $a$ raises each power by one. Collecting the two contributions to $a^kb^{n+1-k}$ gives $\binom n{k-1}+\binom nk$, which Pascal’s rule (a two-line computation with factorials) identifies as $\binom{n+1}k$. So each row of Pascal’s triangle is the previous row plus a shifted copy of itself — the induction step, drawn.`,
      caption: String.raw`The slider $n$ grows the triangle one row per induction step; click any entry to see the two entries above it that add up to it. The bars on the right are the coefficients of $(a+b)^n$: the blue part comes from multiplying row $n-1$ by $b$, the orange part from multiplying it by $a$ (shifted one place).`,
      deps: ['alg-2.1'],
      see: ['comb-1.7'],
      refs: ['Judson §2.1'],
      tags: ['induction', 'binomial'],
      credit: 'Pascal, Traité du triangle arithmétique, 1654 (the triangle is much older)',
      viz(v) {
        let sel = [5, 2];
        const N = v.slider('$n$', 1, 12, 5, { int: true, onChange: (n) => { sel = [n, Math.min(sel[1], n)]; } });
        const s = v.stage({ x: [-6.6, 6.6], y: [-12.6, 0.8], axes: false, height: 340, weight: 1.15 });
        const t = v.stage({ x: [-0.7, 12.7], y: [0, 10], axes: false, height: 340, weight: 1 });
        const at = (i, k) => [k - i / 2, -i];
        s.onClick((x, y) => {
          const n = N.value, i = clamp(Math.round(-y), 0, n), k = clamp(Math.round(x + i / 2), 0, i);
          sel = [i, k];
        });
        t.onClick((x) => { const n = N.value, k = clamp(Math.round(x), 0, n); sel = [n, k]; });
        v.render(() => {
          const n = N.value, R = pascal(n), [si, sk] = sel[0] <= n ? sel : [n, 0];
          s.setView([-n / 2 - 0.8, n / 2 + 0.8], [-n - 0.75, 0.75]);
          const par0 = si > 0 ? [[si - 1, sk - 1], [si - 1, sk]].filter(([i, k]) => k >= 0 && k <= i) : [];
          for (const [i, k] of par0) { const [x0, y0] = at(i, k), [x1, y1] = at(si, sk); s.line(x0, y0, x1, y1, { color: k === sk - 1 ? 'orange' : 'blue', width: 2.4 }); }
          for (let i = 0; i <= n; i++) for (let k = 0; k <= i; k++) {
            const [x, y] = at(i, k), isSel = i === si && k === sk, isPar = par0.some(([a, b]) => a === i && b === k);
            const col = isSel ? 'gold' : isPar ? (k === sk - 1 ? 'orange' : 'blue') : i === n ? 'accent' : 'muted';
            tile(v, s, x, y, R[i][k], { color: col, fillAlpha: isSel ? 0.45 : isPar ? 0.3 : i === n ? 0.12 : 0.05, size: n > 9 ? 11 : 12.5, w: n > 9 ? 27 : 31, h: 21, text: i === n || isSel || isPar ? 'ink' : 'muted' });
          }
          s.corner(`row ${n} = row ${n - 1} + shifted row ${n - 1}`, 'tl', { size: 11.5 });
          // bars: coefficient of a^k b^(n-k) = C(n-1,k) (from ·b) + C(n-1,k-1) (from ·a)
          const P = R[n - 1] || [1], top = Math.max(...R[n]);
          t.setView([-0.7, n + 0.7], [-top * 0.16, top * 1.2]);
          for (let k = 0; k <= n; k++) {
            const lo = P[k] || 0, hi = P[k - 1] || 0, w = 0.36, hl = si === n && sk === k;
            if (lo) t.rect(k - w, 0, k + w, lo, { fill: 'blue', fillAlpha: hl ? 0.7 : 0.45, color: 'blue', width: 1 });
            if (hi) t.rect(k - w, lo, k + w, lo + hi, { fill: 'orange', fillAlpha: hl ? 0.7 : 0.45, color: 'orange', width: 1 });
            if (hl) t.rect(k - w - 0.08, 0, k + w + 0.08, lo + hi, { color: 'gold', width: 2.5, fill: false });
            t.text(String(lo + hi), k, lo + hi, { dy: -9, align: 'center', size: n > 9 ? 10 : 11.5, weight: 700 });
            t.text(String(k), k, 0, { dy: 11, align: 'center', size: 11, color: 'muted' });
          }
          t.text('power k of a', n / 2, -top * 0.1, { align: 'center', size: 11, color: 'muted', dy: 8 });
        });
        v.legend([['blue', 'row n−1, times b'], ['orange', 'row n−1 shifted, times a'], ['gold', 'selected entry']]);
        v.readout(() => {
          const n = N.value, R = pascal(n), [si, sk] = sel[0] <= n ? sel : [n, 0];
          const rule = si === 0 ? '$\\binom00 = 1$ (the base of the triangle).' : sk === 0 || sk === si ? `$\\binom{${si}}{${sk}} = 1$ (an edge of the triangle).` : `$\\binom{${si}}{${sk}} = \\binom{${si - 1}}{${sk - 1}} + \\binom{${si - 1}}{${sk}} = ${R[si - 1][sk - 1]} + ${R[si - 1][sk]} = ${R[si][sk]}$.`;
          const term = (k) => { const c = R[n][k], A = k ? (k > 1 ? `a^{${k}}` : 'a') : '', B = n - k ? (n - k > 1 ? `b^{${n - k}}` : 'b') : ''; return `${c > 1 ? c : ''}${A}${B}`; };
          const exp = n <= 6 ? `$(a+b)^{${n}} = ${R[n].map((_, k) => term(n - k)).join(' + ')}$.` : `Coefficients of $(a+b)^{${n}}$: ${R[n].join(', ')}.`;
          let S = BigInt(0); R[n].forEach((c, k) => { S += BigInt(c) * BigInt(2) ** BigInt(k) * BigInt(3) ** BigInt(n - k); });
          return `${rule} ${exp} Check at $a = 2, b = 3$: $\\sum_k \\binom{${n}}{k}2^k3^{${n}-k} = ${S} = 5^{${n}}$ ${S === BigInt(5) ** BigInt(n) ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Principle',
      name: 'Second principle of induction (strong induction)',
      statement: String.raw`Let $S(n)$ be a statement about integers and $n_0$ an integer. Suppose that $S(n_0)$ is true, and that for every $k\ge n_0$, the truth of all of $S(n_0),S(n_0+1),\ldots,S(k)$ implies the truth of $S(k+1)$. Then $S(n)$ is true for every $n\ge n_0$.`,
      idea: String.raw`Apply the first principle (2.1) to the stronger statement $T(n)$: “$S(n_0),\ldots,S(n)$ are all true”. $T(n_0)$ is $S(n_0)$, and $T(k)$ gives $S(k+1)$ by hypothesis, hence $T(k+1)$. The point of the strong form is that the step may lean on *any* earlier case, not just the previous one. The model example is factorization: to factor $k+1=ab$ you need the cases $a$ and $b$, which can be far below $k$.`,
      caption: String.raw`Step through $n = 2, 3, 4, \ldots$: green numbers are already proved to be products of primes. For a composite $n = a\cdot b$ the gold arcs show the two earlier cases the step uses — the dashed arc to $n-1$, all that ordinary induction would offer, is of no help. Below, the factor tree of $n$ is assembled from the trees of $a$ and $b$.`,
      deps: ['alg-2.1'],
      refs: ['Judson §2.1'],
      tags: ['induction', 'primes'],
      viz(v) {
        const NN = v.slider('up to', 12, 60, 36, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const s = v.stage({ x: [1, 61], y: [-1.1, 2.6], axes: false, height: 170, full: true });
        const t = v.stage({ x: [0, 1], y: [-5.5, 0.45], axes: false, height: 225, full: true });
        const S = v.steps({
          frames: () => Array.from({ length: NN.value - 1 }, (_, i) => { const k = i + 2, p = spf(k); return { k, note: p === k ? `$${k}$ is prime: it is its own factorization (a leaf).` : `$${k} = ${p}\\cdot ${k / p}$ with both factors smaller than ${k}: the cases $S(${p})$ and $S(${k / p})$, already proved, factor ${k} into primes.` }; }),
          start: 'end', still: 'end', speed: 3,
        });
        v.render(() => {
          const N = NN.value, k = S.frame.k ?? N, p = spf(k), q = k / p;
          s.setView([0.9, N + 1.1], [-1.1, 2.6]);
          s.line(1.4, 0, N + 0.6, 0, { color: 'muted', width: 1.2 });
          for (let m = 2; m <= N; m++) {
            const done = m < k, cur = m === k, used = p !== k && (m === p || m === q);
            s.dot(m, 0, { r: cur ? 6.5 : used ? 6 : 4, color: cur ? 'gold' : used ? 'gold' : done ? 'green' : 'faint', hollow: !done && !cur && !used });
            if (m % 5 === 0 || cur || used || m === 2) s.text(String(m), m, 0, { dy: 15, align: 'center', size: 11, weight: cur || used ? 800 : 500, color: cur || used ? 'ink' : 'muted' });
          }
          if (p !== k) {
            const hgt = (d) => Math.min(58, 10 + 2.2 * d);
            if (k - 1 !== p && k - 1 !== q) hop(v, s, k, k - 1, 0, 9, { color: 'muted', dash: true, width: 1.4 });
            hop(v, s, k, q, 0, hgt(k - q), { color: 'gold', width: 2.4 });
            if (q !== p) hop(v, s, k, p, 0, hgt(k - p) + 6, { color: 'gold', width: 2.4 });
            s.corner(`${k} = ${p} · ${q}: uses S(${p}) and S(${q})`, 'tl', { size: 12.5, color: 'ink', weight: 700 });
          } else s.corner(`${k} is prime`, 'tl', { size: 12.5, color: 'green', weight: 700 });
          const T = buildTree(k), d = Math.max(1, depth(T)), dy = Math.min(1.25, 5.2 / d);
          layoutTree(T, 0.04, 0.96, 0, dy);
          drawTree(v, t, T, { style: (n) => (n === T ? { color: 'gold', fillAlpha: 0.25 } : n.path === 'L' || n.path === 'R' ? { ring: true } : null) });
          t.corner(p === k ? 'a prime is a one-node tree' : 'the two subtrees are the trees of the earlier cases', 'bl', { size: 11.5 });
        });
        v.legend([['green', 'proved (earlier cases)', { dot: true }], ['gold', 'current case and the cases it uses', { dot: true }]]);
        v.readout(() => {
          const N = NN.value, k = S.frame.k ?? N, p = spf(k);
          let ok = true; for (let m = 2; m <= N; m++) { const L = leaves(buildTree(m)); if (!L.every(isPrime) || L.reduce((a, b) => a * b, 1) !== m) ok = false; }
          const gap = p === k ? '' : ` Ordinary induction would hand you only $S(${k - 1})$, which says nothing about $${k} = ${p}\\cdot ${k / p}$.`;
          return `Case $n = ${k}$:${gap} Every $n$ from 2 to ${N} came out as a product of primes ${ok ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Principle',
      name: 'Principle of well-ordering',
      statement: String.raw`Every nonempty subset of the natural numbers $\mathbb N=\{1,2,3,\ldots\}$ has a least element: if $\varnothing\ne S\subseteq\mathbb N$, there is $m\in S$ with $m\le s$ for all $s\in S$. (A set with this property for all its nonempty subsets is called **well-ordered**.)`,
      idea: String.raw`The principle is equivalent to induction (Theorem 2.8 derives it from induction, and induction follows back from it). The reason it holds is finiteness below every point: if $s\in S$, only the finitely many numbers $1,\ldots,s$ can compete for the minimum, so checking them in order must stop. Both hypotheses matter. The empty set has no least element, and in $\mathbb Z$ or among the positive rationals a nonempty set can descend forever ($\ldots,-14,-7,0$ or $1,\tfrac12,\tfrac13,\ldots$).`,
      caption: String.raw`Choose a set by a rule, or click numbers to make your own. The pointer sweeps up from $1$ and stops at the least element, never needing to look past any member. Then allow negative integers: for the infinite rules the pointer marches left forever, because every member has a smaller one.`,
      deps: [],
      see: ['logic-9.1'],
      refs: ['Judson §2.1'],
      tags: ['well-ordering', 'natural numbers'],
      viz(v) {
        const R = {
          sq: { label: '$n^2 > 500$', f: (n) => n * n > 500 },
          oc: { label: 'odd composite', f: (n) => Math.abs(n) % 2 === 1 && Math.abs(n) > 1 && !isPrime(Math.abs(n)) },
          ns: { label: 'not a sum of 2 squares', f: (n) => !sumTwoSq(n) },
          m7: { label: '$n \\equiv 5 \\pmod 7$', f: (n) => mod(n, 7) === 5 },
          pick: { label: 'my picks', f: (n) => picks.has(n) },
        };
        let picks = new Set([17, 26, 31, 38]);
        const rule = v.select('set S', Object.entries(R).map(([value, r]) => ({ value, label: r.label })), 'sq', { onChange: () => v.restart() });
        const Z = v.toggle('allow negative integers ($\\mathbb Z$)', false, { onChange: () => v.restart() });
        const s = v.stage({ x: [-0.5, 40.5], y: [-0.9, 2.2], axes: false, height: 185, full: true });
        s.onClick((x) => { const n = Math.round(x), lo = Z.value ? -40 : 1; if (n < lo || n > 40) return; if (rule.value !== 'pick') { picks = new Set(); for (let m = lo; m <= 40; m++) if (R[rule.value].f(m)) picks.add(m); rule.value = 'pick'; } if (picks.has(n)) picks.delete(n); else picks.add(n); v.restart(); });
        const info = () => {
          const f = R[rule.value].f, lo = Z.value ? -40 : 1, mem = []; for (let n = lo; n <= 40; n++) if (f(n)) mem.push(n);
          let below = null; if (Z.value && mem.length) for (let n = mem[0] - 1; n >= -2000; n--) if (f(n)) { below = n; break; }
          let beyond = null; if (!mem.length) for (let n = 41; n <= 2000; n++) if (f(n)) { beyond = n; break; }
          return { f, lo, mem, below, beyond, least: !Z.value ? (mem[0] ?? beyond) : below == null ? mem[0] : null };
        };
        v.animate((t) => {
          const I = info(), { lo, mem } = I;
          s.setView([lo - 1.5, 41.2], [-0.9, 2.2]);
          numberLine(v, s, lo, 40, 0, { every: 5 });
          s.corner(Z.value ? 'universe: ℤ' : 'universe: ℕ = {1, 2, 3, …}', 'bl', { size: 11.5 });
          for (let n = lo; n <= 40; n++) if (I.f(n)) s.dot(n, 0.75, { r: 5, color: 'accent' });
          s.text('S', lo - 1, 0.75, { align: 'center', size: 15, math: true, color: 'accent' });
          if (I.least != null && I.least <= 40) {
            const m = I.least, pos = Math.min(m, lo + Math.floor(t / 0.09));
            if (pos > lo) s.rect(lo - 0.4, -0.22, pos - 0.6, 0.22, { fill: 'green', fillAlpha: 0.22, stroke: false });
            s.arrow(pos, 1.85, pos, 1.05, { color: 'gold', width: 2.6 });
            if (pos === m) { s.circle(m, 0.75, 0.55, { color: 'gold', width: 2.6, fill: false }); s.text(`least element ${sub(m)}`, m, 1.9, { dx: 10, align: 'left', size: 12.5, weight: 700, color: 'gold' }); }
            else s.text(`checking ${sub(pos)}`, pos, 1.9, { dx: 8, align: 'left', size: 11.5, color: 'muted' });
          } else if (mem.length) {
            const desc = mem.slice().reverse(), cyc = desc.length + 4, i = Math.floor(t / 0.3) % cyc;
            if (i < desc.length) { const m = desc[i]; s.arrow(m, 1.85, m, 1.05, { color: 'gold', width: 2.6 }); s.text(`${sub(m)} — but a smaller member exists`, m, 1.9, { dx: m < 0 ? 10 : -10, align: m < 0 ? 'left' : 'right', size: 11.5, color: 'red', weight: 700 }); }
            else { s.arrow(lo + 3, 1.4, lo - 1.2, 1.4, { color: 'red', width: 2.6 }); s.text(`… ${sub(I.below)} ∈ S, and on to −∞`, lo + 3.5, 1.4, { align: 'left', size: 12, weight: 700, color: 'red' }); }
          } else if (I.beyond == null) s.corner('S is empty: there is nothing to find', 'tl', { size: 12.5, color: 'red', weight: 700 });
          else s.corner(`no member up to 40 — the least is ${I.beyond}`, 'tl', { size: 12.5, color: 'gold', weight: 700 });
        }, { period: 6.5, still: 6 });
        v.readout(() => {
          const I = info();
          if (!I.mem.length && I.beyond == null) return 'The empty set has no least element — the hypothesis “nonempty” cannot be dropped.';
          if (I.least != null) return Z.value ? `Even in $\\mathbb Z$ this set is bounded below, and its least element is $${sub(I.least)}$.` : `Least element: $${I.least}$. The sweep only had to test the ${I.least - 1} numbers below it — finitely many, because any member of $S$ bounds the search.`;
          return `In $\\mathbb Z$ this set has **no least element**: below every member there is another (e.g. $${sub(I.below)}\\in S$, below everything shown). Well-ordering is a property of $\\mathbb N$, not of $\\mathbb Z$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Lemma',
      name: '1 is the least positive natural number',
      statement: String.raw`The principle of mathematical induction implies that $1$ is the least element of $\mathbb N$: there is no natural number $m$ with $0<m<1$.`,
      idea: String.raw`Let $S=\{n\in\mathbb N: n\ge 1\}$. Then $1\in S$, and $n\ge1$ gives $n+1\ge1$, so $S$ is closed under $n\mapsto n+1$. By induction $S=\mathbb N$, so every natural number is at least $1$. The content is that $\mathbb N$ contains nothing but what can be reached from $1$ by adding $1$; in the positive rationals the same set $S$ contains $1$ and is closed under $+1$ but misses $\tfrac12$, so induction — and the lemma — fail there.`,
      caption: String.raw`The green region is $S=\{x\ge1\}$; the hops show it contains $1$ and is closed under $+1$. Drag the point $x$. In $\mathbb N$ it can only sit on a number reached by hops; switch to the positive rationals and it can slip into $(0,1)$, which the right panel magnifies.`,
      deps: ['alg-2.1'],
      refs: ['Judson §2.1'],
      tags: ['induction', 'natural numbers'],
      viz(v) {
        const U = v.select('universe', [{ value: 'N', label: '$\\mathbb N$' }, { value: 'Q', label: '$\\mathbb Q^+$' }], 'N', { onChange: (u) => { X.set(u === 'Q' ? 0.5 : 3, 0); v.restart(); } });
        const s = v.stage({ x: [-0.5, 6.5], y: [-1.1, 1.9], axes: false, height: 230, weight: 1.7 });
        const z = v.stage({ x: [-0.08, 1.08], y: [-1.1, 1.9], axes: false, height: 230, weight: 1, minWidth: 200 });
        const snapQ = (x) => { let best = 1, bd = 9; for (let q = 1; q <= 6; q++) { const p = Math.max(1, Math.round(x * q)), c = p / q; if (Math.abs(c - x) < bd - 1e-9) { bd = Math.abs(c - x); best = c; } } return clamp(best, 1 / 6, 6.2); };
        const X = s.handle(3, 0, { color: 'accent', label: 'x', constrain: (x) => [U.value === 'N' ? clamp(Math.round(x), 1, 6) : snapQ(x), 0] });
        const frac = (x) => { for (let q = 1; q <= 12; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-9) return q === 1 ? String(p) : `${p}/${q}`; } return x.toFixed(3); };
        v.animate((t) => {
          const Q = U.value === 'Q';
          s.rect(1, -0.32, 6.5, 0.32, { fill: 'green', fillAlpha: 0.16, stroke: false });
          s.text('S = {x ≥ 1}', 6.4, -0.6, { align: 'right', size: 12, weight: 700, color: 'green' });
          numberLine(v, s, 0, 6, 0, { every: 1, labelDy: 10 });
          if (Q) for (let q = 2; q <= 4; q++) for (let p = 1; p < 6 * q; p++) if (gcd(p, q) === 1) s.dot(p / q, 0, { r: 2.4, color: p / q < 1 ? 'red' : 'muted' });
          for (let n = 1; n <= 6; n++) s.dot(n, 0, { r: 5, color: 'ink' });
          const shown = Math.min(5, Math.floor(t / 0.55));
          for (let n = 1; n <= shown; n++) hop(v, s, n, n + 1, 0, 26, { color: 'accent', width: 2 });
          s.text('1 ∈ S', 1, 0.7, { align: 'center', size: 11.5, weight: 700, color: 'accent', dy: -2 });
          if (shown >= 1) s.text('n ∈ S ⇒ n+1 ∈ S', 3.5, 1.45, { align: 'center', size: 11.5, weight: 700, color: 'accent' });
          // magnifier of (0, 1)
          z.rect(0, -0.32, 1, 0.32, { fill: Q ? 'red' : 'faint', fillAlpha: 0.08, stroke: false });
          numberLine(v, z, 0, 1, 0, { every: 1, labelDy: 10 });
          z.text('(0, 1) magnified', 0.5, 1.6, { align: 'center', size: 12, weight: 700, color: 'muted' });
          if (Q) { for (let q = 2; q <= 12; q++) for (let p = 1; p < q; p++) if (gcd(p, q) === 1) z.dot(p / q, 0.45 - 0.06 * q, { r: 2.6, color: 'red' }); z.text('rationals with denominator ≤ 12', 0.5, -0.75, { align: 'center', size: 11, color: 'red' }); }
          else z.text('no natural numbers here', 0.5, 0.6, { align: 'center', size: 12.5, weight: 700, color: 'green' });
          if (X.x < 1) { z.dot(X.x, 0, { r: 6, color: 'accent' }); z.text('x', X.x, 0, { dy: -14, align: 'center', size: 14, math: true, color: 'accent' }); }
          s.corner(Q ? 'universe: positive rationals' : 'universe: ℕ = {1, 2, 3, …}', 'tl', { size: 12 });
          void frac;
        }, { period: 5, still: 4.5 });
        v.readout(() => {
          const x = X.x, Q = U.value === 'Q';
          const lab = (() => { for (let q = 1; q <= 6; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-9) return q === 1 ? String(p) : `\\tfrac{${p}}{${q}}`; } return String(x); })();
          if (!Q) return `$x = ${lab}$ ${x === 1 ? 'is the starting point $1$' : `$= 1 ${'+ 1 '.repeat(x - 1)}$, reached from $1$ by ${x - 1} hop${x > 2 ? 's' : ''}`}, so $x\\in S$. Induction gives $S = \\mathbb N$: every natural number is $\\ge 1$, and $(0,1)$ contains none.`;
          if (Number.isInteger(x)) return `$x = ${lab}$ is reached from $1$ by hops — but $\\mathbb Q^+$ has more: drag $x$ below 1.`;
          return `$x = ${lab}$ ${x < 1 ? 'is positive and smaller than 1' : 'lies between the hops'}: no chain of $+1$ steps from $1$ reaches it. $S = \\{x\\ge1\\}$ contains $1$ and is closed under $+1$, yet $S \\ne \\mathbb Q^+$ — **induction fails in $\\mathbb Q^+$**, and with it the lemma.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Induction implies well-ordering',
      statement: String.raw`The principle of mathematical induction implies the principle of well-ordering: every nonempty subset of $\mathbb N$ has a least element.`,
      idea: String.raw`Suppose $S\subseteq\mathbb N$ has no least element, and let $T$ be the set of $n$ lying below every element of $S$. Then $1\in T$: otherwise $1\in S$, and by Lemma 2.7 it would be least. If $1,\ldots,n\in T$ then $n+1\in T$: otherwise $n+1\in S$ would be least. By induction $T=\mathbb N$, so no natural number lies in $S$ — $S$ is empty. Read forwards, the same induction is a search that can only halt by finding the least element.`,
      caption: String.raw`Click numbers to build $S$ (red squares). Step through the induction: the green set $T$ of numbers below all of $S$ grows one number at a time. The only way it can stop is by running into a member of $S$ — which is then the least one. Clear $S$ and $T$ swallows everything.`,
      deps: ['alg-2.7', 'alg-2.6'],
      refs: ['Judson §2.1'],
      tags: ['well-ordering', 'induction'],
      viz(v) {
        const NMAX = 30;
        let S0 = new Set([12, 17, 25]);
        v.button('Clear S', () => { S0 = new Set(); St.reset({ at: 'end' }); });
        v.button('Random S', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); S0 = new Set(); const k = r.int(1, 4); for (let i = 0; i < k; i++) S0.add(r.int(3, NMAX)); St.reset({ at: 'end' }); });
        const s = v.stage({ x: [0.3, NMAX + 0.7], y: [-1.0, 2.1], axes: false, height: 190, full: true });
        s.onClick((x) => { const n = Math.round(x); if (n < 1 || n > NMAX) return; if (S0.has(n)) S0.delete(n); else S0.add(n); St.reset({ at: 'end' }); });
        const St = v.steps({
          frames: () => {
            const m = S0.size ? Math.min(...S0) : null, K = m ?? NMAX, out = [{ j: 0, note: 'Let $T = \\{n\\in\\mathbb N : n < s$ for every $s\\in S\\}$ and grow it by induction.' }];
            for (let j = 1; j <= K; j++) out.push({ j, hit: S0.has(j), note: S0.has(j) ? `$${j}\\in S$, so $${j}\\notin T$ — but $1, \\ldots, ${j - 1}$ are all in $T$, so none of them is in $S$: **$${j}$ is the least element of $S$**.` : j === 1 ? '$1 \\notin S$, so $1$ is below every element of $S$ (Lemma 2.7: nothing is below 1): $1 \\in T$.' : `$1,\\ldots,${j - 1}\\in T$ and $${j}\\notin S$, so $${j}$ is below every element of $S$: $${j}\\in T$.` });
            if (m == null) out.push({ j: NMAX + 1, note: '…and so on forever: $T = \\mathbb N$. Nothing is left for $S$: a set without a least element is **empty**.' });
            return out;
          },
          start: 'end', still: 'end', speed: 4,
        });
        v.render(() => {
          const f = St.frame, j = f.j ?? 0, Tn = f.hit ? j - 1 : Math.min(j, NMAX);
          numberLine(v, s, 1, NMAX, 0, { every: 5 });
          if (Tn > 0) s.rect(0.55, -0.14, Tn + 0.45, 0.14, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.2 });
          for (let n = 1; n <= NMAX; n++) s.dot(n, 0, { r: n <= Tn ? 5 : 3.5, color: n <= Tn ? 'green' : 'muted' });
          for (const n of S0) { s.rect(n - 0.3, 0.62, n + 0.3, 1.02, { fill: 'red', fillAlpha: f.hit && n === j ? 0.8 : 0.4, color: 'red', width: 1.4, radius: 3 }); }
          if (S0.size) s.text('S', 0.6, 0.82, { size: 15, math: true, color: 'red' });
          if (Tn > 0) s.text('T', 0.6, -0.62, { size: 15, math: true, color: 'green' });
          if (j >= 1 && j <= NMAX) { s.arrow(j, 1.85, j, f.hit ? 1.1 : 0.35, { color: 'gold', width: 2.6 }); if (f.hit) s.text('least element of S', j, 1.95, { dx: 8, align: 'left', size: 12.5, weight: 700, color: 'gold' }); }
          if (j > NMAX) s.text('T = ℕ  ⇒  S = ∅', NMAX / 2, 1.5, { align: 'center', size: 14, weight: 800, color: 'green' });
        });
        v.readout(() => {
          const m = S0.size ? Math.min(...S0) : null;
          return m == null ? '$S = \\varnothing$: the induction never stops, $T = \\mathbb N$. (Contrapositive of the theorem: no least element forces $S$ empty.)' : `$S = \\{${[...S0].sort((a, b) => a - b).join(', ')}\\}$: the induction runs through $T = \\{1, \\ldots, ${m - 1}\\}$ and halts at $${m} = \\min S$ ✓.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Division algorithm',
      statement: String.raw`Let $a$ and $b$ be integers with $b>0$. Then there are unique integers $q$ and $r$ with
$$a=bq+r\qquad\text{and}\qquad 0\le r<b.$$`,
      idea: String.raw`**Existence:** the set $S=\{a-bk: k\in\mathbb Z,\ a-bk\ge0\}$ is nonempty (take $k$ very negative), so by well-ordering (2.6, with $0$ allowed) it has a least element $r=a-bq$. If $r\ge b$, then $r-b=a-b(q+1)$ would be a smaller element of $S$; so $0\le r<b$. **Uniqueness:** if $a=bq+r=bq'+r'$ with both remainders in $[0,b)$, then $b(q-q')=r'-r$ is a multiple of $b$ of absolute value less than $b$, hence $0$.`,
      caption: String.raw`Drag $a$ along the line (negative values too) and change $b$. Copies of the bar $b$ are laid from $0$ toward $a$: $q$ whole copies fit, and the gold leftover is $r$. The dots on the upper row are the set $S$ of nonnegative values $a-bk$; its least element (ringed) is exactly the remainder.`,
      deps: ['alg-2.6'],
      see: ['nt-1.1'],
      refs: ['Judson §2.2'],
      tags: ['division', 'integers'],
      viz(v) {
        const B = v.slider('$b$', 1, 12, 7, { int: true });
        const s = v.stage({ x: [-45, 65], y: [-1.0, 2.3], axes: false, height: 215, full: true });
        const A = s.handle(47, 0, { color: 'accent', label: 'a', labelPos: 's', constrain: (x) => [clamp(Math.round(x), -42, 62), 0] });
        v.render(() => {
          const a = A.x, b = B.value, q = Math.floor(a / b), r = a - b * q;
          numberLine(v, s, -42, 62, 0, { every: 10, labelDy: 8 });
          for (let k = Math.ceil(-42 / b); k * b <= 62; k++) s.line(k * b, -0.18, k * b, 0.18, { color: 'ink', width: 1.6 });
          const k0 = Math.min(0, q), k1 = Math.max(0, q);
          for (let k = k0; k < k1; k++) s.rect(k * b, 0.28, (k + 1) * b, 0.78, { fill: k % 2 ? 'blue' : 'teal', fillAlpha: 0.45, color: k % 2 ? 'blue' : 'teal', width: 1 });
          if (r) s.rect(q * b, 0.28, a, 0.78, { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1.2 });
          s.text(`${Math.abs(q)} cop${Math.abs(q) === 1 ? 'y' : 'ies'} of b${q < 0 ? ' backwards' : ''}`, (k0 + k1) * b / 2 || 0, 0.53, { align: 'center', size: 11.5, weight: 700, color: 'ink', plate: true });
          s.text(`r = ${r}`, q * b + r / 2, 0.98, { align: 'center', size: 12, weight: 800, color: 'gold' });
          // S = {a − bk ≥ 0}
          s.text('S = {a − bk ≥ 0}', -42, 1.75, { align: 'left', size: 12, weight: 700, color: 'purple' });
          for (let x = r; x <= 62; x += b) s.dot(x, 1.75, { r: x === r ? 5.5 : 4, color: 'purple' });
          s.dot(r, 1.75, { r: 10, hollow: true, color: 'gold' });
          s.text('least', r, 1.75, { dy: -19, align: 'center', size: 11, weight: 700, color: 'gold' });
          s.dot(0, 0, { r: 4, color: 'ink' });
        });
        v.readout(() => {
          const a = A.x, b = B.value, q = Math.floor(a / b), r = a - b * q;
          return `$${sub(a)} = ${b}\\cdot ${par(q)} + ${r}$ with $0 \\le ${r} < ${b}$ ✓. Uniqueness: $q = ${sub(q + 1)}$ would leave $${sub(r - b)} < 0$, and $q = ${sub(q - 1)}$ would leave $${r + b} \\ge ${b}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9a
    {
      num: '2.9a',
      kind: 'Definition',
      name: 'Greatest common divisor; relatively prime',
      statement: String.raw`For integers $a,b$, we say $b$ **divides** $a$, written $b\mid a$, if $a=bk$ for some integer $k$. For integers $a,b$ not both zero, a positive integer $d$ is a **greatest common divisor** of $a$ and $b$, written $d=\gcd(a,b)$, if $d\mid a$ and $d\mid b$, and every common divisor $d'$ of $a$ and $b$ also divides $d$. Integers $a$ and $b$ are **relatively prime** if $\gcd(a,b)=1$.`,
      idea: String.raw`Judson’s definition asks more than “largest”: every common divisor must divide $d$. That such a $d$ exists, and is unique, is part of Theorem 2.10. For positive $a,b$ it agrees with the largest common divisor, and the common divisors of $a$ and $b$ turn out to be exactly the divisors of $\gcd(a,b)$ — visible in the middle row of the picture.`,
      caption: String.raw`Change $a$ and $b$. The divisors of each sit in their own row, in columns by value, so common divisors line up vertically and drop into the middle row; that row is exactly the list of divisors of the gold gcd. Coprime pairs have only $1$ in common.`,
      deps: ['alg-2.9'],
      see: ['nt-1.2'],
      refs: ['Judson §2.2'],
      tags: ['gcd', 'divisibility'],
      viz(v) {
        const A = v.slider('$a$', 1, 120, 24, { int: true }), Bs = v.slider('$b$', 1, 120, 36, { int: true });
        const s = v.stage({ x: [0, 1], y: [-0.6, 2.6], axes: false, height: 250, full: true });
        v.render(() => {
          const a = A.value, b = Bs.value, d = gcd(a, b), Da = divisors(a), Db = divisors(b), cols = [...new Set([...Da, ...Db])].sort((x, y) => x - y), n = cols.length;
          const X = (m) => 0.1 + (0.86 * (cols.indexOf(m) + 0.5)) / n, w = Math.min(30, (s.width * 0.86) / n - 3);
          s.text(`a = ${a}`, 0.02, 2, { size: 13, weight: 800, color: 'blue' });
          s.text(`gcd`, 0.02, 1, { size: 13, weight: 800, color: 'gold' });
          s.text(`b = ${b}`, 0.02, 0, { size: 13, weight: 800, color: 'red' });
          for (const m of cols) if (Da.includes(m) && Db.includes(m)) { s.line(X(m), 2, X(m), 0, { color: 'green', width: 2, alpha: 0.5 }); }
          for (const m of Da) tile(v, s, X(m), 2, m, { color: Db.includes(m) ? 'green' : 'blue', fillAlpha: Db.includes(m) ? 0.3 : 0.1, w, size: w < 24 ? 10.5 : 12 });
          for (const m of Db) tile(v, s, X(m), 0, m, { color: Da.includes(m) ? 'green' : 'red', fillAlpha: Da.includes(m) ? 0.3 : 0.1, w, size: w < 24 ? 10.5 : 12 });
          for (const m of divisors(d)) tile(v, s, X(m), 1, m, { color: m === d ? 'gold' : 'green', fillAlpha: m === d ? 0.55 : 0.3, w, size: w < 24 ? 10.5 : 12, width: m === d ? 2.6 : 1.4 });
          s.corner(d === 1 ? `gcd(${a}, ${b}) = 1: relatively prime` : `gcd(${a}, ${b}) = ${d}`, 'tr', { size: 13, weight: 800, color: d === 1 ? 'green' : 'gold' });
        });
        v.readout(() => {
          const a = A.value, b = Bs.value, d = gcd(a, b), com = divisors(a).filter((m) => b % m === 0);
          return `Common divisors of ${a} and ${b}: $\\{${com.join(', ')}\\}$ = divisors of $${d}$ ${com.join(',') === divisors(d).join(',') ? '✓' : '✗'}. Each divides $${d}$, so $\\gcd(${a}, ${b}) = ${d}$${d === 1 ? ' — the two numbers are **relatively prime**' : ''}.`;
        });
      },
    },
  ],
};
