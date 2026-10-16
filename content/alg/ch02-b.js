// Abstract Algebra (Judson) — Chapter 2, part 2: Bézout's identity, Euclid's algorithm, primes, Euclid's lemma, the
// infinitude of primes and unique factorization (2.10–2.15). Shared number theory and pictures: ch02.shared.js.
import { mod, gcd, egcd, euclid, divisors, isPrime, sub, par, factorTex, buildTree, leaves, depth, layoutTree, drawTree, hitTree, numberLine, tile, hop } from './ch02.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ------------------------------------------------------------------ BigInt primality and factoring (for 2.14)
const B = (x) => BigInt(x);
function powmod(b, e, m) { let r = B(1); b %= m; while (e > B(0)) { if (e & B(1)) r = (r * b) % m; b = (b * b) % m; e >>= B(1); } return r; }
/** Miller–Rabin with the first twelve prime bases: deterministic below 3.3·10²⁴. */
function isPrimeBig(n) {
  if (n < B(2)) return false;
  for (const p of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37].map(B)) { if (n === p) return true; if (n % p === B(0)) return false; }
  let d = n - B(1), r = 0; while ((d & B(1)) === B(0)) { d >>= B(1); r++; }
  for (const a of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37].map(B)) {
    let x = powmod(a, d, n); if (x === B(1) || x === n - B(1)) continue;
    let comp = true; for (let i = 1; i < r; i++) { x = (x * x) % n; if (x === n - B(1)) { comp = false; break; } }
    if (comp) return false;
  }
  return true;
}
const bgcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a < B(0) ? -a : a; };
/** Pollard–Brent rho: a nontrivial factor of the composite n. */
function rho(n) {
  if (n % B(2) === B(0)) return B(2);
  for (let c = B(1); c < B(50); c++) {
    let y = B(2), x = y, g = B(1), q = B(1), r = 1, ys = y; const f = (z) => (z * z + c) % n;
    do {
      x = y; for (let i = 0; i < r; i++) y = f(y);
      let k = 0;
      while (k < r && g === B(1)) { ys = y; for (let i = 0; i < Math.min(64, r - k); i++) { y = f(y); q = (q * (x > y ? x - y : y - x)) % n; } g = bgcd(q, n); k += 64; }
      r *= 2;
    } while (g === B(1) && r < (1 << 22));
    if (g === n) { do { ys = f(ys); g = bgcd(x > ys ? x - ys : ys - x, n); } while (g === B(1)); }
    if (g !== n && g !== B(1)) return g;
  }
  return null;
}
function factorBig(n) {
  const out = [];
  for (const p of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47].map(B)) while (n % p === B(0)) { out.push(p); n /= p; }
  for (let p = B(53); p * p <= n && p < B(20000); p += B(2)) while (n % p === B(0)) { out.push(p); n /= p; }
  const stack = n > B(1) ? [n] : [];
  while (stack.length) { const m = stack.pop(); if (isPrimeBig(m)) { out.push(m); continue; } const d = rho(m); if (!d) { out.push(m); continue; } stack.push(d, m / d); }
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
const group = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default {
  collection: 'alg',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'The gcd is the least positive combination ar + bs',
      statement: String.raw`Let $a$ and $b$ be nonzero integers. Then there are integers $r$ and $s$ with
$$\gcd(a,b)=ar+bs.$$
Moreover the greatest common divisor of $a$ and $b$ is unique. (In fact $\gcd(a,b)$ is the smallest positive integer of the form $ar+bs$.)`,
      idea: String.raw`Let $S=\{am+bn>0: m,n\in\mathbb Z\}$, nonempty since it contains $|a|$. By well-ordering (2.6) it has a least element $d=ar+bs$. Divide $a$ by $d$ (2.9): $a=dq+r'$ with $0\le r'<d$, and $r'=a-(ar+bs)q$ is again a combination; being smaller than $d$ it cannot be positive, so $r'=0$ and $d\mid a$. Likewise $d\mid b$. Any common divisor of $a$ and $b$ divides every combination, in particular $d$. Uniqueness: two gcds divide each other and are positive, so they are equal.`,
      caption: String.raw`Every lattice point $(r,s)$ is coloured by the value $ar+bs$ (blue positive, red negative); the parallel lines are the levels $ar+bs = 0, \pm d, \pm 2d,\ldots$ with $d=\gcd(a,b)$. Drag the gold point. The smallest positive value anywhere is $d$ (gold dots, line $ar+bs=d$), and the strip below shows that the positive values are exactly the multiples of $d$.`,
      deps: ['alg-2.9a', 'alg-2.6', 'alg-2.9'],
      see: ['nt-1.4'],
      refs: ['Judson §2.2'],
      tags: ['gcd', 'bezout'],
      credit: 'Bachet 1621 (for integers); Bézout 1779 (for polynomials)',
      viz(v) {
        const A = v.slider('$a$', 1, 30, 15, { int: true }), Bs = v.slider('$b$', 1, 30, 6, { int: true });
        const R = 7;
        const s = v.stage({ x: [-R - 0.9, R + 0.9], y: [-R - 0.9, R + 0.9], equal: true, axes: false, height: 360 });
        const t = v.stage({ x: [-1, 41], y: [-1.3, 1.6], axes: false, height: 120, full: true });
        const P = s.handle(1, -2, { color: 'gold', r: 8, constrain: (x, y) => [clamp(Math.round(x), -R, R), clamp(Math.round(y), -R, R)] });
        v.render(() => {
          const a = A.value, b = Bs.value, d = gcd(a, b), M = Math.max(...[-1, 1].flatMap((i) => [-1, 1].map((j) => Math.abs(a * i * R + b * j * R))));
          s.line(-R - 0.6, 0, R + 0.6, 0, { color: 'faint', width: 1 }); s.line(0, -R - 0.6, 0, R + 0.6, { color: 'faint', width: 1 });
          s.text('r', R + 0.75, 0, { size: 14, math: true, color: 'muted' }); s.text('s', 0, R + 0.75, { size: 14, math: true, color: 'muted', align: 'center' });
          s.clip(() => {
            for (const k of [0, 1]) {
              const c = k * d, col = k === 1 ? 'gold' : 'muted';
              s.line(-R - 1, (c + a * (R + 1)) / b, R + 1, (c - a * (R + 1)) / b, { color: col, width: k === 1 ? 2.2 : 1, alpha: k === 1 || k === 0 ? 0.9 : 0.55 });
            }
          }, [-R - 0.7, R + 0.7], [-R - 0.7, R + 0.7]);
          for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) {
            const val = a * r + b * q;
            if (val === d) { s.dot(r, q, { r: 6, color: 'gold' }); continue; }
            const u = Math.min(1, Math.abs(val) / M) ** 0.6;
            s.dot(r, q, { r: 3.6, color: val === 0 ? 'ink' : v.mix(v.color('faint'), v.color(val > 0 ? 'blue' : 'red'), 0.35 + 0.65 * u) });
          }
          const val = a * P.x + b * P.y;
          s.text(`${a}·${par(P.x)} + ${b}·${par(P.y)} = ${sub(val)}`, P.x, P.y, { dx: 12, dy: -14, size: 12.5, weight: 700, color: 'ink', plate: true });
          // strip: which positive values occur on the grid
          const occ = new Set(); for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) { const x = a * r + b * q; if (x > 0 && x <= 40) occ.add(x); }
          numberLine(v, t, 0, 40, 0, { every: 5 });
          for (let x = 1; x <= 40; x++) if (occ.has(x)) t.dot(x, 0.55, { r: x === d ? 6.5 : 4.5, color: x === d ? 'gold' : 'blue' });
          t.text('values ar + bs > 0 on the grid', 40, 1.3, { align: 'right', size: 11.5, color: 'muted' });
          t.text(`least = ${d}`, d, 0.55, { dx: 10, dy: -12, size: 12, weight: 800, color: 'gold' });
        });
        v.legend([['blue', 'ar + bs > 0', { dot: true }], ['red', 'ar + bs < 0', { dot: true }], ['gold', 'ar + bs = gcd', { dot: true }]]);
        v.readout(() => {
          const a = A.value, b = Bs.value, d = gcd(a, b), { x, y } = egcd(a, b);
          let mult = true, least = Infinity; for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) { const z = a * r + b * q; if (z % d) mult = false; if (z > 0) least = Math.min(least, z); }
          return `$\\gcd(${a}, ${b}) = ${d} = ${a}\\cdot ${par(x)} + ${b}\\cdot ${par(y)}$. On the grid: least positive value $= ${least}$ ${least === d ? '✓' : '✗'}, every value a multiple of ${d} ${mult ? '✓' : '✗'}. Solutions of $ar + bs = ${d}$ repeat every step $(${b / d}, ${sub(-a / d)})$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Corollary',
      name: 'Relatively prime integers combine to 1',
      statement: String.raw`If $a$ and $b$ are relatively prime integers, then there exist integers $r$ and $s$ with $ar+bs=1$. (Conversely, $ar+bs=1$ forces $\gcd(a,b)=1$, since a common divisor divides $1$.)`,
      idea: String.raw`Immediate from Theorem 2.10 with $\gcd(a,b)=1$. A frog that can only jump $+a$ or $-b$ makes the statement physical: its position is always $ra-sb$, a multiple of $\gcd(a,b)$, so it can land on $1$ only if the gcd is $1$; and when it is, the greedy rule “jump right when at or left of $0$, otherwise jump left” cycles through all $a+b$ positions of $(-b,a]$ and therefore lands on $1$.`,
      caption: String.raw`Step the frog: blue hops are $+a$, orange hops are $-b$, and it jumps right whenever it is at or left of $0$. For coprime $a, b$ it reaches the green target $1$, and the hop counts give $r$ and $s$. Try $a=6$, $b=4$: the frog only ever visits multiples of $2$ (the green ticks) and returns to $0$ without touching $1$.`,
      deps: ['alg-2.10'],
      refs: ['Judson §2.2'],
      tags: ['bezout', 'coprime'],
      viz(v) {
        const A = v.slider('$a$', 1, 12, 7, { int: true, onChange: () => S.reset({ at: 'end' }) }), Bs = v.slider('$b$', 1, 12, 5, { int: true, onChange: () => S.reset({ at: 'end' }) });
        const s = v.stage({ x: [-13, 13], y: [-1.6, 1.6], axes: false, height: 200, full: true });
        const walk = () => {
          const a = A.value, b = Bs.value, fr = [{ pos: 0, r: 0, s: 0, hops: [], note: 'The frog starts at $0$.' }];
          let pos = 0, r = 0, q = 0; const hops = [];
          for (let i = 0; i < a + b + 2; i++) {
            const from = pos; if (pos <= 0) { pos += a; r++; } else { pos -= b; q++; }
            hops.push([from, pos]);
            const done = pos === 1, back = pos === 0;
            fr.push({ pos, r, s: q, hops: hops.slice(), note: done ? `Landed on $1 = ${r}\\cdot ${a} - ${q}\\cdot ${b}$.` : back ? `Back at $0$ after visiting every reachable spot — all multiples of $${gcd(a, b)}$. $1$ is out of reach.` : `${from <= 0 ? `At $${sub(from)} \\le 0$: jump $+${a}$` : `At $${from} > 0$: jump $-${b}$`} to $${sub(pos)}$.` });
            if (done || back) break;
          }
          return fr;
        };
        const S = v.steps({ frames: walk, start: 'end', still: 'end', speed: 2.5 });
        v.render(() => {
          const a = A.value, b = Bs.value, g = gcd(a, b), f = S.frame, lo = -b - 1, hi = a + 1;
          s.setView([Math.min(-6, lo) - 0.8, Math.max(6, hi) + 0.8], [-2, 2]);
          numberLine(v, s, Math.min(-6, lo), Math.max(6, hi), 0, { every: 5 });
          for (let x = Math.min(-6, lo); x <= Math.max(6, hi); x++) if (x % g === 0) s.line(x, -0.1, x, 0.1, { color: 'green', width: 3 });
          s.dot(1, 0, { r: 9, hollow: true, color: 'green' });
          s.text('target 1', 1, 0, { dy: 46, align: 'center', size: 11, weight: 700, color: 'green' });
          const H = f.hops || [];
          H.forEach(([x0, x1], i) => { const last = i === H.length - 1, up = x1 > x0; hop(v, s, x0, x1, 0, up ? 30 : -30, { color: up ? 'blue' : 'orange', width: last ? 3 : 1.6, alpha: last ? 1 : 0.45 }); });
          const visited = new Set([0, ...H.map((h) => h[1])]);
          for (const x of visited) s.dot(x, 0, { r: 4, color: 'ink' });
          s.dot(f.pos ?? 0, 0, { r: 8, color: 'gold' });
          s.text('frog', f.pos ?? 0, 0, { dy: -42, align: 'center', size: 11.5, weight: 800, color: 'gold' });
          s.corner(`position = ${f.r ?? 0}·${a} − ${f.s ?? 0}·${b} = ${sub(f.pos ?? 0)}`, 'tl', { size: 13, weight: 700, color: 'ink' });
        });
        v.legend([['blue', '+a hop'], ['orange', '−b hop'], ['green', 'multiples of gcd(a, b)']]);
        v.readout(() => {
          const a = A.value, b = Bs.value, g = gcd(a, b), fr = walk(), L = fr[fr.length - 1];
          return g === 1 ? `$\\gcd(${a}, ${b}) = 1$ and the frog reaches $1$ after ${L.r} right hops and ${L.s} left hops: $${a}\\cdot ${L.r} + ${b}\\cdot ${par(-L.s)} = ${a * L.r - b * L.s}$ ✓ — so $r = ${L.r}$, $s = ${sub(-L.s)}$.` : `$\\gcd(${a}, ${b}) = ${g}$: every position $r\\cdot ${a} - s\\cdot ${b}$ is a multiple of $${g}$, so $1$ is unreachable — no $r, s$ give $${a}r + ${b}s = 1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Algorithm',
      name: 'Euclidean algorithm',
      statement: String.raw`To compute $\gcd(a,b)$ for integers $a\ge b>0$, divide repeatedly (2.9):
$$a=bq_1+r_1,\quad b=r_1q_2+r_2,\quad r_1=r_2q_3+r_3,\ \ldots,\quad r_{n-2}=r_{n-1}q_n+r_n,\quad r_{n-1}=r_nq_{n+1}.$$
The remainders strictly decrease, so the process stops, and the last nonzero remainder $r_n$ is $\gcd(a,b)$. Running the equations backwards expresses $r_n=ar+bs$ (back-substitution). Judson’s example: $\gcd(2415,945)=105=2415\cdot2+945\cdot(-5)$.`,
      idea: String.raw`Each division keeps the set of common divisors unchanged: from $a=bq+r$, a number divides $a$ and $b$ exactly when it divides $b$ and $r$. So $\gcd(a,b)=\gcd(b,r_1)=\cdots=\gcd(r_n,0)=r_n$. Geometrically, a division cuts as many $b\times b$ squares as fit off an $a\times b$ rectangle; the last square fits the leftover exactly, and its side measures both $a$ and $b$. Back-substitution replaces each remainder by its defining equation, from the bottom row up, keeping $\gcd=a_is_i+b_it_i$ true on every row.`,
      caption: String.raw`Step through: each division cuts the largest squares that fit off the rectangle (the newest ones gold) and fills a row of the table. Then back-substitution climbs the table, filling $s,t$ with $\gcd = a\,s + b\,t$ on every row. Choose an example or set $a, b$; Fibonacci neighbours like $89, 55$ make the longest runs.`,
      deps: ['alg-2.9', 'alg-2.9a', 'alg-2.10'],
      see: ['nt-1.3', 'algo-1.7'],
      refs: ['Judson §2.2'],
      tags: ['gcd', 'algorithm'],
      credit: 'Euclid, Elements VII.1–2, c. 300 BC',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euclidean_algorithm' },
      viz(v) {
        const PRE = { j: [2415, 945], f: [89, 55], e: [1071, 462], c: [64, 27] };
        const pre = v.select('example', [{ value: 'j', label: '2415, 945' }, { value: 'f', label: '89, 55' }, { value: 'e', label: '1071, 462' }, { value: 'c', label: '64, 27' }], 'j', { onChange: (k) => { A.set(PRE[k][0]); Bs.set(PRE[k][1]); S.reset({ at: 'end' }); } });
        const A = v.slider('$a$', 1, 3000, 2415, { int: true, onChange: () => S.reset({ at: 'end' }) }), Bs = v.slider('$b$', 1, 3000, 945, { int: true, onChange: () => S.reset({ at: 'end' }) });
        void pre;
        const s = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 300, weight: 1.15 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1 });
        const T = v.table(t, { rows: 4, cols: 7, maxCell: 34, square: false, cellAspect: 1.55, size: 12.5, margin: 6, colLabels: ['$a$', '$b$', '$q$', '$r$', '$s$', '$t$', '$as+bt$'], colWeights: [1, 1, 0.7, 1, 0.8, 0.8, 1.2] });
        const run = () => { const a = Math.max(A.value, Bs.value), b = Math.min(A.value, Bs.value); return { a, b, ...euclid(a, b) }; };
        const S = v.steps({
          frames: () => {
            const E = run(), R = E.rows, fr = [{ div: 0, back: null, note: `A $${E.a}\\times ${E.b}$ rectangle.` }];
            R.forEach((w, i) => fr.push({ div: i + 1, back: null, note: `$${w.a} = ${w.b}\\cdot ${w.q} + ${w.r}$: cut ${w.q} square${w.q > 1 ? 's' : ''} of side ${w.b}${w.r ? `, leaving ${w.b} × ${w.r}` : ' — nothing is left, so the gcd is ' + w.b}.` }));
            for (let i = R.length - 1; i >= 0; i--) {
              const w = R[i], n = R[i + 1];
              const note = !n ? `Back-substitution starts on the last row: $${E.g} = ${w.a}\\cdot 0 + ${w.b}\\cdot 1$.` : `Replace $${w.r} = ${w.a} - ${w.q}\\cdot ${w.b}$: $${E.g} = ${w.b}\\cdot ${par(n.s)} + ${w.r}\\cdot ${par(n.t)} = ${w.a}\\cdot ${par(w.s)} + ${w.b}\\cdot ${par(w.t)}$.`;
              fr.push({ div: R.length, back: i, note });
            }
            return fr;
          },
          start: 'end', still: 'end', speed: 1.5,
        });
        const COLS = ['blue', 'teal', 'purple', 'orange', 'pink', 'green'];
        v.render(() => {
          const E = run(), f = S.frame, R = E.rows, nd = f.div ?? R.length;
          const pad = 0.04 * E.a; s.setView([-pad, E.a + pad], [-pad, E.b + pad]);
          s.rect(0, 0, E.a, E.b, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.05 });
          let x = 0, y = 0, w = E.a, h = E.b;
          for (let i = 0; i < nd; i++) {
            const q = R[i].q, side = R[i].b, col = i === nd - 1 && f.back == null ? 'gold' : COLS[i % COLS.length], tiny = side * s.scale < 2.5;
            if (tiny) { const x1 = w >= h ? x + q * side : x + w, y1 = w >= h ? y + h : y + q * side; s.rect(x, y, x1, y1, { fill: col, fillAlpha: 0.5, color: col, width: 1 }); }
            for (let k = 0; k < q && !tiny; k++) {
              const x0 = w >= h ? x + k * side : x, y0 = w >= h ? y : y + k * side;
              s.rect(x0, y0, x0 + side, y0 + side, { fill: col, fillAlpha: 0.42, color: col, width: 1.2 });
              if (k === 0 && side * s.scale > 26) s.text(String(side), x0 + side / 2, y0 + side / 2, { align: 'center', size: side * s.scale > 60 ? 14 : 11, weight: 700 });
            }
            if (w >= h) { x += q * side; w -= q * side; } else { y += q * side; h -= q * side; }
          }
          if (w > 0 && h > 0) s.rect(x, y, x + w, y + h, { color: 'accent', width: 2.4, dash: [6, 4], fill: false });
          const nb = f.back;
          T.draw({
            rows: R.length,
            value: (i, j) => { const r = R[i]; if (i >= nd) return null; if (j < 4) return [r.a, r.b, r.q, r.r][j]; if (nb == null || i < nb) return null; return j === 4 ? r.s : j === 5 ? r.t : r.a * r.s + r.b * r.t; },
            fill: (i, j) => (i === nd - 1 && nb == null && j < 4 ? ['gold', 0.35] : nb != null && i === nb && j >= 4 ? ['green', 0.4] : i === R.length - 1 && j === 1 && i < nd ? ['gold', 0.25] : j >= 4 && nb != null && i > nb ? ['green', 0.12] : null),
            rowLabels: (i) => String(i + 1),
          });
        });
        v.readout(() => {
          const E = run(), r0 = E.rows[0];
          return `$\\gcd(${E.a}, ${E.b}) = ${E.g} = ${E.a}\\cdot ${par(r0.s)} + ${E.b}\\cdot ${par(r0.t)}$ ${E.a * r0.s + E.b * r0.t === E.g ? '✓' : '✗'} in ${E.rows.length} division${E.rows.length > 1 ? 's' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12a
    {
      num: '2.12a',
      kind: 'Definition',
      name: 'Prime and composite numbers',
      statement: String.raw`An integer $p>1$ is **prime** if its only positive divisors are $1$ and $p$. An integer $n>1$ that is not prime is **composite**: it can be written $n=ab$ with $1<a,b<n$. The number $1$ is neither prime nor composite.`,
      idea: String.raw`Divisors of $n$ come in pairs $d\cdot\frac nd$, which is the same as the ways of arranging $n$ tokens in a rectangle with $d$ rows. A prime admits only the $1\times p$ strip; any genuine rectangle exhibits a factorization. Sieving out multiples, as Eratosthenes did, leaves exactly the primes.`,
      caption: String.raw`Pick $n$ with the slider or by clicking the number grid, and press **Next rectangle** to cycle through every way of arranging $n$ tokens in a rectangle. Primes (blue in the grid) only ever give the single strip.`,
      deps: [],
      refs: ['Judson §2.2'],
      tags: ['primes'],
      viz(v) {
        let wi = -1;
        const N = v.slider('$n$', 2, 60, 12, { int: true, onChange: () => { wi = -1; } });
        v.button('Next rectangle', () => { wi++; });
        const s = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 300, weight: 1.25 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1 });
        const T = v.table(t, { rows: 6, cols: 10, maxCell: 36, size: 12.5, margin: 6 });
        t.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { const n = c.i * 10 + c.j + 1; if (n >= 2) { N.set(n); wi = -1; } } });
        const shapes = (n) => divisors(n).filter((d) => d * d <= n).map((d) => [d, n / d]);
        v.render(() => {
          const n = N.value, sh = shapes(n), [r, c] = sh[((wi % sh.length) + sh.length) % sh.length], cell = Math.min(0.9 / c, 0.62 / r);
          const W = cell * c, H = cell * r, x0 = 0.5 - W / 2, y0 = 0.52 - H / 2;
          s.rect(x0 - cell * 0.15, y0 - cell * 0.15, x0 + W + cell * 0.15, y0 + H + cell * 0.15, { radius: 8, color: r === 1 ? (isPrime(n) ? 'accent' : 'muted') : 'orange', width: 1.6, fill: r === 1 ? 'accent' : 'orange', fillAlpha: 0.06 });
          const rad = Math.max(2, Math.min(11, cell * s.scale * 0.36));
          for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s.dot(x0 + (j + 0.5) * cell, y0 + H - (i + 0.5) * cell, { r: rad, color: r === 1 ? 'accent' : 'orange' });
          s.text(`${r} × ${c}`, 0.5, y0 + H + cell * 0.15, { dy: -14, align: 'center', size: 14, weight: 800, color: r === 1 ? 'accent' : 'orange' });
          s.text(sh.map(([a, b]) => `${a}×${b}`).join('   '), 0.5, 0.08, { align: 'center', size: 12, color: 'muted' });
          s.corner(isPrime(n) ? `${n} is prime: only the strip` : `${n} is composite: ${sh.length - 1} genuine rectangle${sh.length > 2 ? 's' : ''}`, 'tl', { size: 13, weight: 700, color: isPrime(n) ? 'accent' : 'orange' });
          T.draw({ value: (i, j) => i * 10 + j + 1, fill: (i, j) => { const m = i * 10 + j + 1; return m === 1 ? null : isPrime(m) ? ['accent', 0.35] : ['muted', 0.08]; }, textColor: (i, j) => (isPrime(i * 10 + j + 1) ? 'ink' : 'muted'), highlight: [[Math.floor((n - 1) / 10), (n - 1) % 10, 'gold']] });
        });
        v.legend([['accent', 'prime', { dot: true }], ['orange', 'genuine rectangle (composite)', { dot: true }]]);
        v.readout(() => {
          const n = N.value, D = divisors(n), pr = Array.from({ length: 60 }, (_, i) => i + 1).filter(isPrime);
          return `Divisors of ${n}: $\\{${D.join(', ')}\\}$ — ${isPrime(n) ? `only $1$ and $${n}$, so **${n} is prime**` : `$${n} = ${D[1]}\\cdot ${n / D[1]}$, so **${n} is composite**`}. Primes up to 60: ${pr.length} of them.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Lemma',
      name: 'Euclid’s lemma',
      statement: String.raw`Let $a$ and $b$ be integers and $p$ a prime. If $p\mid ab$, then $p\mid a$ or $p\mid b$.`,
      idea: String.raw`Suppose $p\nmid a$. The only positive divisors of $p$ are $1$ and $p$, so $\gcd(a,p)=1$, and Corollary 2.11 gives $ar+ps=1$. Multiply by $b$: $b=(ab)r+p(bs)$. Both terms are divisible by $p$, so $p\mid b$. Primality is essential: $6\mid 2\cdot3$, but $6$ divides neither factor.`,
      caption: String.raw`Cell $(a,b)$ of the grid is shaded when $p\mid ab$. For a prime $p$ every shaded cell lies in a row or column whose index is a multiple of $p$ (green). Choose a composite $p$ and red cells appear: products divisible by $p$ although neither factor is. Click a cell for the Bézout argument with actual numbers.`,
      deps: ['alg-2.11', 'alg-2.12a'],
      see: ['nt-1.5'],
      refs: ['Judson §2.2'],
      tags: ['primes', 'divisibility'],
      credit: 'Euclid, Elements VII.30',
      viz(v) {
        const NN = 20;
        const P = v.select('$p$', [2, 3, 5, 7, 4, 6, 9, 10].map((p) => ({ value: p, label: isPrime(p) ? `$${p}$` : `$${p}$ (composite)` })), 3);
        let sel = [5, 7];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, full: true });
        const T = v.table(s, { rows: NN, cols: NN, maxCell: 19, minCell: 12, size: 9, labelSize: 10, margin: 4, rowLabels: (i) => String(i + 1), colLabels: (j) => String(j + 1), cornerLabel: '$a\\backslash b$' });
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i + 1, c.j + 1]; });
        v.render(() => {
          const p = +P.value;
          T.draw({
            value: (i, j) => (sel[0] === i + 1 && sel[1] === j + 1 ? (i + 1) * (j + 1) : null),
            fill: (i, j) => { const a = i + 1, b = j + 1; if ((a * b) % p) return a % p === 0 || b % p === 0 ? ['green', 0.06] : null; return a % p === 0 || b % p === 0 ? ['green', 0.5] : ['red', 0.85]; },
            highlight: [[sel[0] - 1, sel[1] - 1, 'gold']],
            rowLabelColor: (i) => ((i + 1) % p === 0 ? 'green' : 'muted'), colLabelColor: (j) => ((j + 1) % p === 0 ? 'green' : 'muted'),
          });
        });
        v.legend([['green', 'p | ab, and p divides a factor', { area: true }], ['red', 'p | ab, but p divides neither factor', { area: true }]]);
        v.readout(() => {
          const p = +P.value, [a, b] = sel, ab = a * b; let bad = 0, ex = null;
          for (let x = 1; x <= NN; x++) for (let y = 1; y <= NN; y++) if ((x * y) % p === 0 && x % p && y % p) { bad++; if (!ex) ex = [x, y]; }
          let txt;
          if (ab % p) txt = `$${p}\\nmid ${a}\\cdot ${b} = ${ab}$.`;
          else if (a % p === 0) txt = `$${p}\\mid ${ab}$ and $${p}\\mid ${a}$.`;
          else if (isPrime(p)) { const { x, y } = egcd(a, p); txt = `$${p}\\mid ${ab}$, $${p}\\nmid ${a}$, so $\\gcd(${a}, ${p}) = 1$: $${a}\\cdot ${par(x)} + ${p}\\cdot ${par(y)} = 1$, hence $${b} = ${ab}\\cdot ${par(x)} + ${p}\\cdot ${par(b * y)}$, a multiple of $${p}$ ✓.`; }
          else txt = b % p === 0 ? `$${p}\\mid ${ab}$ and $${p}\\mid ${b}$.` : `$${p}\\mid ${ab}$ but $${p}\\nmid ${a}$ and $${p}\\nmid ${b}$ — **the lemma fails**: $${p}$ is not prime.`;
          return `${txt} Red cells in the grid: **${bad}**${isPrime(p) ? ' — none, as Euclid’s lemma promises for a prime' : ex ? `, e.g. $${p}\\mid ${ex[0]}\\cdot ${ex[1]}$` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Euclid: there are infinitely many primes',
      statement: String.raw`There are infinitely many prime numbers.`,
      idea: String.raw`Given any finite list of primes $p_1,\ldots,p_n$, consider $N=p_1p_2\cdots p_n+1$. Dividing $N$ by any $p_i$ leaves remainder $1$, so no $p_i$ divides $N$. But $N>1$ has a prime factor (by the factorization of 2.15, or simply its least divisor $>1$), and that prime is missing from the list. So no finite list contains all primes. Note that $N$ itself need not be prime: $2\cdot3\cdot5\cdot7\cdot11\cdot13+1=30031=59\cdot509$.`,
      caption: String.raw`Click primes to put them on the list (blue). The number $N$ = product $+1$ leaves remainder $1$ on division by each listed prime, and its factorization (factored exactly, with big-integer arithmetic) always shows a prime not on the list, in green. **Add the new prime** puts the smallest one on the list; starting from $\{2\}$ this builds the Euclid–Mullin sequence $2, 3, 7, 43, 13, 53, 5, \ldots$`,
      deps: ['alg-2.12a'],
      see: ['nt-1.8'],
      refs: ['Judson §2.2'],
      tags: ['primes', 'infinity'],
      credit: 'Euclid, Elements IX.20, c. 300 BC',
      viz(v) {
        const PAL = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
        let list = [2, 3, 5, 7, 11, 13].map(B);
        const prod = () => list.reduce((x, y) => x * y, B(1));
        let cache = { key: '', f: [] };
        const facts = () => { const N = prod() + B(1), key = String(N); if (cache.key !== key) cache = { key, f: factorBig(N) }; return { N, f: cache.f }; };
        const LIM = B(10) ** B(18);
        v.button('Add the new prime', () => { if (prod() > LIM) return; const { f } = facts(); const nw = f.find((p) => !list.includes(p)); if (nw) list.push(nw); });
        v.button('Start from {2}', () => { list = [B(2)]; });
        v.button('Clear', () => { list = []; });
        const s = v.stage({ x: [0, 16], y: [0, 4.4], axes: false, height: 265, full: true });
        const chipX = (i) => 0.75 + i * 1.03;
        s.onClick((x, y) => { if (y < 3.3 || y > 4.25) return; const i = Math.round((x - 0.75) / 1.03); if (i < 0 || i >= PAL.length) return; const p = B(PAL[i]), k = list.indexOf(p); if (k >= 0) list.splice(k, 1); else list.push(p); });
        v.render(() => {
          const { N, f } = facts(), big = list.filter((p) => p > B(47));
          s.text('primes ≤ 47 (click):', 0.25, 4.3, { size: 11, color: 'muted' });
          PAL.forEach((p, i) => { const on = list.includes(B(p)); tile(v, s, chipX(i), 3.75, p, { color: on ? 'accent' : 'muted', fillAlpha: on ? 0.5 : 0.06, w: 32 }); if (on) s.text('rem 1', chipX(i), 3.75, { dy: 22, align: 'center', size: 9.5, color: 'accent', weight: 700 }); });
          if (big.length) { s.text('also on the list:', 0.25, 2.85, { size: 11, color: 'muted' }); let x = 2.4; for (const p of big) { const w = (14 + 7.6 * String(p).length) / s.scale; tile(v, s, x + w / 2, 2.85, String(p), { color: 'accent', fillAlpha: 0.5 }); x += w + 0.2; } }
          const ptxt = list.length ? (list.length > 9 ? `${list.slice(0, 4).join('·')} ⋯ ${list[list.length - 1]}` : list.join(' · ')) : '(empty product)';
          s.text(`N = ${ptxt} + 1 = ${group(N)}`, 0.25, 2.25, { size: 14, weight: 700, color: 'ink' });
          s.text('N mod p = 1 for every listed p, so no listed prime divides N.', 0.25, 1.7, { size: 11.5, color: 'muted' });
          s.text('N =', 0.25, 1.0, { size: 14, weight: 700 });
          const fresh = f.filter((p) => !list.includes(p)), least = fresh[0];
          let x = 1.35; f.forEach((p, i) => { const w = (14 + 7.6 * String(p).length) / s.scale; tile(v, s, x + w / 2, 1.0, String(p), { color: p === least ? 'gold' : 'green', fillAlpha: 0.45 }); x += w; if (i < f.length - 1) { s.text('·', x + 0.12, 1.0, { align: 'center', size: 16, weight: 800 }); x += 0.24; } });
          s.text(N === B(1) ? '' : f.length === 1 ? 'N itself is prime — and new.' : `${f.length} prime factors, ${fresh.length === f.length ? 'all' : fresh.length} new.`, 0.25, 0.35, { size: 12, weight: 700, color: 'green' });
          if (prod() > LIM) s.corner('the numbers get big: adding stops here', 'br', { size: 11, color: 'red' });
        });
        v.legend([['accent', 'on the list', { area: true }], ['green', 'prime factor of N (not on the list)', { area: true }], ['gold', 'smallest new prime', { area: true }]]);
        v.readout(() => {
          const { N, f } = facts(), fresh = f.filter((p) => !list.includes(p));
          if (!list.length) return 'With the empty list, $N = 1$ has no prime factor — the argument needs at least one prime to start, or take $N = 2$.';
          const ok = f.every((p) => !list.includes(p)) && list.every((p) => N % p === B(1));
          return `$N = ${group(N).replace(/ /g, '\\,')} = ${f.map(String).join('\\cdot ')}$. Remainder $1$ on division by all ${list.length} listed primes ${ok ? '✓' : '✗'}; new prime${fresh.length > 1 ? 's' : ''} found: $${fresh.join(', ')}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Fundamental theorem of arithmetic',
      statement: String.raw`Every integer $n>1$ can be written as a product of primes, $n=p_1p_2\cdots p_k$ (not necessarily distinct). The factorization is unique up to order: if also $n=q_1q_2\cdots q_l$ with all $q_j$ prime, then $k=l$ and the $q_j$ are the $p_i$ rearranged.`,
      idea: String.raw`**Existence** by strong induction (2.5): a prime is its own factorization, and a composite $n=ab$ with $1<a,b<n$ multiplies the factorizations of $a$ and $b$. **Uniqueness** by Euclid’s lemma (2.13): $p_1$ divides $q_1q_2\cdots q_l$, hence divides some $q_j$, hence equals it; cancel and repeat (formally, induct on $n$). Euclid’s lemma is what fails in number systems without unique factorization — in the even numbers $2\mathbb Z$, whose “primes” are the numbers $2\cdot$odd, $60=2\cdot30=6\cdot10$ in two different ways.`,
      caption: String.raw`Two factor trees for the same $n$: click any composite node to change how it splits (the small $k/m$ counts the options). However the trees branch, the green leaves form the same multiset of primes. Switch to the world of even numbers $2\mathbb Z$, where the irreducibles are $2, 6, 10, 14, 18, \ldots$, and the two trees disagree.`,
      deps: ['alg-2.13', 'alg-2.5'],
      see: ['nt-1.6'],
      refs: ['Judson §2.2'],
      tags: ['primes', 'factorization'],
      credit: 'Euclid (essentially); first stated and proved in full by Gauss, Disquisitiones Arithmeticae, 1801',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_theorem_of_arithmetic' },
      viz(v) {
        const ch = [new Map(), new Map()];
        const N = v.slider('$n$', 4, 1000, 360, { int: true, onChange: () => { ch[0].clear(); ch[1].clear(); } });
        const even = v.toggle('even numbers only ($2\\mathbb Z$)', false, { onChange: () => { ch[0].clear(); ch[1].clear(); } });
        const st = [0, 1].map(() => v.stage({ x: [0, 1], y: [-5.4, 0.5], axes: false, height: 330 }));
        const nOf = () => (even.value && N.value % 2 ? N.value + 1 : N.value);
        const trees = () => [0, 1].map((side) => buildTree(nOf(), (n, path, opts) => (ch[side].has(path) ? ch[side].get(path) : side === 0 ? 0 : opts.length - 1), even.value));
        let laid = [[], []];
        st.forEach((s, side) => s.onClick((x, y) => { const t = hitTree(s, laid[side], x, y); if (t && !t.leaf) { ch[side].set(t.path, (t.k + 1) % t.opts.length); for (const k of [...ch[side].keys()]) if (k.startsWith(t.path) && k !== t.path) ch[side].delete(k); } }));
        const ms = (L) => L.slice().sort((a, b) => a - b);
        v.render(() => {
          const Ts = trees(), Ls = Ts.map((T) => ms(leaves(T))), same = Ls[0].join(',') === Ls[1].join(',');
          Ts.forEach((T, side) => {
            const s = st[side], d = Math.max(1, depth(T)), dy = Math.min(1.15, 4.35 / d);
            laid[side] = layoutTree(T, 0.05, 0.95, 0, dy);
            drawTree(v, s, T, { hint: true, leafColor: same ? 'green' : 'red' });
            s.text(Ls[side].join(' · '), 0.5, -5.15, { align: 'center', size: 13.5, weight: 800, color: same ? 'green' : 'red' });
            s.corner(side === 0 ? 'tree 1' : 'tree 2', 'tl', { size: 11.5 });
          });
        });
        v.readout(() => {
          const n = nOf(), Ts = trees(), Ls = Ts.map((T) => ms(leaves(T))), same = Ls[0].join(',') === Ls[1].join(',');
          if (!even.value) return `Both trees end in $${n} = ${factorTex(n)}$ ${same ? '✓' : '✗'}: ${leaves(Ts[0]).length} prime factors counted with multiplicity, whichever splits you choose.`;
          if (same) return `In $2\\mathbb Z$, $${n}$ factors into irreducibles as $${Ls[0].join('\\cdot ')}$ in both trees${Ls[0].length === 1 ? ` — it is itself irreducible (twice an odd number)` : '; try other splits or another $n$ (e.g. 60, 180, 360)'}.`;
          const p = Ls[1].find((x) => !Ls[0].includes(x)) ?? Ls[0].find((x) => !Ls[1].includes(x)), other = Ls[1].includes(p) ? Ls[0] : Ls[1];
          const none = other.every((x) => !(x % p === 0 && (x / p) % 2 === 0)), divN = n % p === 0 && (n / p) % 2 === 0;
          return `In $2\\mathbb Z$: $${n} = ${Ls[0].join('\\cdot ')} = ${Ls[1].join('\\cdot ')}$ — **two different factorizations into irreducibles**. Euclid’s lemma fails there: $${p}$ divides the product $${n} = ${p}\\cdot ${n / p}$ ${divN ? '✓' : '✗'} but none of $${other.join(', ')}$ ${none ? '✓' : '✗'} (in $2\\mathbb Z$, $x$ divides $y$ when $y/x$ is an even integer).`;
        });
      },
    },
  ],
};
