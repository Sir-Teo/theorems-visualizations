// Number Theory — Chapter 2: Congruences
// Part 1 (this file): residue classes, linear congruences, units, the Chinese remainder theorem, Fermat and Euler,
// the totient function (2.1–2.9). Part 2 (ch02-b.js): Gauss's identity, Wilson, Lagrange, Hensel, divisibility tests,
// Legendre, Lucas, Kummer and Wolstenholme (2.10–2.18).
import { PAL, pcol, mod, gcd, powmod, isPrime, primeFactors, totient, divisors, ord, inv, drawClock, clockXY, clockArrow, pixGrid } from './ch02.shared.js';

export default {
  collection: 'nt',
  chapter: 2,
  title: 'Congruences',
  summary: String.raw`Working modulo $n$ replaces the integers by residue classes that can be added and multiplied, and turns divisibility questions into algebra in a finite ring. Linear congruences, the Chinese remainder theorem and the group of units come first; Fermat’s and Euler’s theorems and Wilson’s theorem describe powers and factorials; Lagrange’s theorem and Hensel’s lemma control polynomial congruences. Binomial coefficients modulo a prime obey the elegant rules of Lucas and Kummer.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Congruences and residue classes',
      statement: String.raw`Fix an integer $n\ge1$ (the *modulus*). Two integers are *congruent modulo $n$*, $a\equiv b\pmod n$, if $n\mid a-b$; equivalently $a$ and $b$ leave the same remainder on division by $n$. Congruence is an equivalence relation; its classes $[a]=a+n\Z$ are the *residue classes*, there are exactly $n$ of them, and $\{0,1,\dots,n-1\}$ is a *complete residue system*.

The relation is compatible with the arithmetic: if $a\equiv a'$ and $b\equiv b'\pmod n$, then $a+b\equiv a'+b'$ and $ab\equiv a'b'$. Hence $[a]+[b]=[a+b]$ and $[a][b]=[ab]$ are well defined, and the classes form the commutative ring $\Z/n\Z$.`,
      idea: String.raw`Reflexivity, symmetry and transitivity of $\equiv$ are the three properties of divisibility by $n$ (0 is a multiple of $n$, negatives of multiples are multiples, sums of multiples are multiples). For compatibility write $a'=a+sn$, $b'=b+tn$: then $a'+b'=a+b+(s+t)n$ and $a'b'=ab+(sb+ta+stn)n$, so the results differ by a multiple of $n$. That is the whole point: the answer modulo $n$ does not depend on which representative you computed with, so one may reduce at every step.`,
      caption: String.raw`The right panel writes the integers in rows of length $n$: **each column is one residue class**. Drag $a$, $b$ and $n$. Now replace $a$ by $a+sn$ and $b$ by $b+tn$ with the shift sliders — the representatives jump to other rows of the same columns, yet the result $a\circ b$ of the chosen operation always lands in the same class (the green hand on the clock). The readout recomputes it three ways.`,
      deps: ['nt-1.1'],
      refs: ['Hardy–Wright §5.2', 'Apostol §5.1'],
      tags: ['congruence', 'residue classes'],
      credit: 'Gauss, Disquisitiones arithmeticae, 1801',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modular_arithmetic' },
      viz(v) {
        const N = v.slider('modulus $n$', 2, 24, 7, { int: true });
        const A = v.slider('$a$', -24, 59, 23, { int: true });
        const B = v.slider('$b$', -24, 59, 16, { int: true });
        const SA = v.slider('$a \\to a + s\\,n$: shift $s$', -3, 3, 0, { int: true });
        const SB = v.slider('$b \\to b + t\\,n$: shift $t$', -3, 3, 0, { int: true });
        const OP = v.select('operation', [{ value: '+', label: '$a+b$' }, { value: '*', label: '$a\\cdot b$' }], '+');
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 340, title: 'the clock $\\mathbb Z/n\\mathbb Z$ — hands show the classes of $a$, $b$ and the result' });
        const T = v.stage({ x: [-1, 8], y: [-8, 1], axes: false, height: 340, title: 'the integers $-24,\\dots,59$ in rows of length $n$ — a column is a residue class' });
        const LO = -24, HI = 59;
        let info = {};
        v.render(() => {
          const n = N.value, a2 = A.value + SA.value * n, b2 = B.value + SB.value * n, add = OP.value === '+';
          const f = (x, y) => (add ? x + y : x * y);
          const ra = mod(A.value, n), rb = mod(B.value, n), rc = mod(f(ra, rb), n);
          info = { n, a2, b2, ra, rb, rc, c0: mod(f(A.value, B.value), n), c1: mod(f(a2, b2), n), add };
          drawClock(C, n, { R: 1 });
          const hand = (k, len, col, lab) => {
            const [x, y] = clockXY(k, n, len);
            C.arrow(0, 0, x, y, { color: col, width: 2.2, head: 8 });
            const [lx, ly] = clockXY(k, n, len - 0.14); C.text(lab, lx, ly, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: col, math: true });
          };
          const [px, py] = clockXY(rc, n, 1); C.dot(px, py, { r: 11, hollow: true, color: 'green', width: 2.2 });
          hand(rc, 0.9, 'green', add ? 'a+b' : 'ab'); hand(ra, 0.7, 'blue', 'a'); hand(rb, 0.5, 'orange', 'b');
          // table of integers
          const r0 = Math.floor(LO / n), r1 = Math.floor(HI / n), rows = r1 - r0 + 1;
          T.setView([-1.9, n - 0.4], [-(rows - 1) - 0.6, 0.6]);
          const cw = T.width / (n + 1.5), ch = T.height / (rows + 0.2);
          for (let m = LO; m <= HI; m++) {
            const c = mod(m, n), r = Math.floor(m / n) - r0;
            T.rect(c - 0.48, -r - 0.46, c + 0.48, -r + 0.46, { fill: pcol(c), fillAlpha: m === A.value || m === B.value ? 0.55 : 0.2, stroke: false });
            if (cw >= 22 && ch >= 13) T.text(v.fmt(m), c, -r, { align: 'center', baseline: 'middle', size: Math.min(11.5, ch - 3), color: 'ink' });
          }
          for (let r = 0; r < rows; r++) if (ch >= 13 || r % 3 === 0) T.text(v.fmt((r + r0) * n), -0.75, -r, { align: 'right', baseline: 'middle', size: 10.5, color: 'muted' });
          for (let c = 0; c < n; c++) T.text(String(c), c, 0.62, { align: 'center', baseline: 'bottom', size: 10.5, color: 'muted' });
          const box = (m, col, w, dash) => { if (m < LO || m > HI) return; const c = mod(m, n), r = Math.floor(m / n) - r0; T.rect(c - 0.5, -r - 0.5, c + 0.5, -r + 0.5, { color: col, width: w, dash }); };
          box(A.value, 'blue', 2.6); box(B.value, 'orange', 2.6);
          if (a2 !== A.value) box(a2, 'blue', 2, [4, 3]);
          if (b2 !== B.value) box(b2, 'orange', 2, [4, 3]);
        });
        v.readout(() => {
          const { n, a2, b2, ra, rb, rc, c0, c1, add } = info, s = add ? '+' : '\\cdot';
          const A0 = A.value, B0 = B.value;
          let t = `$a=${A0}\\equiv ${ra}$ and $b=${B0}\\equiv ${rb} \\pmod{${n}}$.`;
          if (a2 !== A0 || b2 !== B0) t += ` Other representatives: $a'=${a2}\\equiv ${ra}$, $b'=${b2}\\equiv ${rb}$.`;
          t += `\n$${A0}${s}${B0 < 0 ? `(${B0})` : B0}\\equiv ${c0}$, $\\;${ra}${s}${rb}\\equiv ${rc}$, $\\;${a2 < 0 ? `(${a2})` : a2}${s}${b2 < 0 ? `(${b2})` : b2}\\equiv ${c1} \\pmod{${n}}$ — `;
          t += c0 === rc && rc === c1 ? '**the same class every time**: the operation is well defined on residue classes.' : '**mismatch (this should never happen)**.';
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Solving linear congruences',
      statement: String.raw`Let $n\ge1$, $a,b\in\Z$ and $g=\gcd(a,n)$. The congruence $ax\equiv b\pmod n$ has a solution if and only if $g\mid b$. In that case it has exactly $g$ solutions modulo $n$, namely
$$x\equiv x_0+k\,\frac ng\pmod n,\qquad k=0,1,\dots,g-1,$$
where $x_0$ is the unique solution modulo $n/g$ of $\tfrac ag x\equiv\tfrac bg\pmod{n/g}$. In particular, if $\gcd(a,n)=1$ there is exactly one solution modulo $n$, and $a$ has an inverse modulo $n$.`,
      idea: String.raw`The congruence says $ax-b=ny$ for some integer $y$, i.e. $ax-ny=b$, a linear Diophantine equation. By Bézout's identity (1.4) the numbers $ax-ny$ are exactly the multiples of $g$, so a solution exists iff $g\mid b$. Dividing by $g$ reduces to the coprime case, where $a/g$ is invertible modulo $n/g$ (Bézout again: $\tfrac ag s+\tfrac ng t=1$), giving one solution $x_0$ modulo $n/g$ — which lifts to $g$ residues modulo $n$.`,
      caption: String.raw`The clock shows where the multiples $a\cdot0,a\cdot1,\dots,a(n-1)$ land (each gold dot is labelled by its $x$); the right panel counts how many $x$ hit each residue. Only multiples of $g=\gcd(a,n)$ are ever hit — each exactly $g$ times. Click a bar to choose $b$: if $g\nmid b$ nothing lights up; otherwise the $g$ solutions sit evenly spaced $n/g$ apart.`,
      deps: ['nt-2.1', 'nt-1.4'],
      refs: ['Hardy–Wright §5.4', 'Apostol §5.3'],
      tags: ['congruence', 'bezout'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_congruence_theorem' },
      viz(v) {
        const N = v.slider('modulus $n$', 2, 36, 12, { int: true });
        const A = v.slider('$a$', 1, 36, 8, { int: true });
        const B = v.slider('$b$', 0, 35, 4, { int: true });
        const C = v.stage({ x: [-2.3, 2.3], y: [-2.0, 2.0], equal: true, axes: false, height: 360, title: 'the clock: $x\\mapsto ax \\bmod n$ — each $x$ is written at the residue it lands on' });
        const H = v.stage({ x: [-1, 36], y: [0, 5], axes: 'box', gutter: true, height: 360, xlabel: 'residue $r$', ylabel: 'number of $x$ with $ax\\equiv r$', title: 'how often each residue is hit — click a bar to set $b$' });
        H.onClick((x) => { const r = Math.round(x); if (r >= 0 && r < N.value) B.set(r); });
        let info = {};
        v.render(() => {
          const n = N.value, a = A.value, b = mod(B.value, n), g = gcd(a, n);
          const hits = Array.from({ length: n }, () => []);
          for (let x = 0; x < n; x++) hits[(a * x) % n].push(x);
          info = { n, a, b, g, sol: hits[b] };
          drawClock(C, n, { R: 1, color: (k) => (k % g === 0 ? 'blue' : 'faint'), dim: (k) => k % g !== 0 });
          const [bx, by] = clockXY(b, n, 1); C.circle(bx, by, 0.09, { color: 'orange', width: 2.4 });
          for (let r = 0; r < n; r++) hits[r].forEach((x, j) => {
            const [px, py] = clockXY(r, n, 1.32 + 0.0 + j * 0.0);
            const L = hits[r].length, [cx, cy] = clockXY(r, n, 1.5 + 0.13 * j);
            const on = r === b;
            if (n <= 24 || on) C.text(String(x), cx, cy, { align: 'center', baseline: 'middle', size: 10.5, weight: on ? 700 : 500, color: on ? 'orange' : 'gold' });
            else C.dot(cx, cy, { r: 2, color: 'gold' });
          });
          H.setView([-1, n], [0, Math.max(2.2, g + 1.2)]);
          for (let r = 0; r < n; r++) {
            const h = hits[r].length;
            if (h) H.rect(r - 0.38, 0, r + 0.38, h, { fill: r === b ? 'orange' : 'blue', fillAlpha: 0.55, color: r === b ? 'orange' : 'blue', width: 1.2 });
          }
          H.hline(g, { color: 'green', width: 1.2, dash: [5, 4] }); H.text(`g = ${g}`, n - 0.4, g + 0.18, { align: 'right', size: 12, color: 'green', weight: 650 });
        });
        v.readout(() => {
          const { n, a, b, g, sol } = info;
          let t = `$\\gcd(${a},${n})=${g}$. Solve $${a}x\\equiv ${b}\\pmod{${n}}$: `;
          if (b % g !== 0) return t + `$${g}\\nmid ${b}$, so **no solution** — brute force agrees (no $x$ lands on $${b}$).`;
          const m = n / g, x0 = (((b / g) * inv(a / g, m)) % m + m) % m;
          t += `$${g}\\mid ${b}$, so there are exactly $g=${g}$ solutions: $x\\equiv ${x0}+k\\cdot ${m}$, i.e. $x\\in\\{${sol.join(', ')}\\}$ (found by brute force: ${sol.length} of them${sol.length === g && sol[0] === x0 ? ', matching the formula' : ''}).`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Units and reduced residue systems',
      statement: String.raw`A residue class $[a]\in\Z/n\Z$ is a *unit* if it has a multiplicative inverse: $ax\equiv1\pmod n$ is solvable. By 2.2 this happens exactly when $\gcd(a,n)=1$. The units form a group $(\Z/n\Z)^\times$ under multiplication. A *reduced residue system* modulo $n$ is a set of integers containing one representative from each unit class, for example $\{a:1\le a\le n,\ \gcd(a,n)=1\}$; its size is $\varphi(n)$ (see 2.7). Multiplying a reduced residue system by a unit again gives a reduced residue system.`,
      idea: String.raw`Solvability of $ax\equiv1$ is the case $b=1$ of 2.2, which holds iff $\gcd(a,n)\mid1$. A product of units is a unit (inverses multiply in reverse order), and the inverse of a unit is a unit, so the units are closed under the group operations. For a unit $a$ the map $x\mapsto ax$ is injective (cancel $a$) hence a permutation of the finite set $\Z/n\Z$ — and it maps units to units. For a non-unit $a$ with $g=\gcd(a,n)>1$ the map is $g$-to-one.`,
      caption: String.raw`The table shows $r\cdot c \bmod n$ (shade = value, gold = $0$). Rows of units (green tab on the left) are **permutations** of $0,\dots,n-1$ — no repeated shade — whereas rows of non-units (red tab) repeat values. Click a row to see it as a bar chart; the readout counts its distinct values, which is $n/\gcd(r,n)$.`,
      deps: ['nt-2.2'],
      refs: ['Apostol §5.4'],
      tags: ['units', 'ring'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multiplicative_group_of_integers_modulo_n' },
      viz(v) {
        const N = v.slider('modulus $n$', 2, 30, 12, { int: true });
        const R0 = v.slider('row $r$', 0, 29, 5, { int: true });
        const T = v.stage({ x: [-2, 31], y: [-1.5, 31], axes: false, height: 400, title: 'multiplication table $r\\cdot c \\bmod n$ — click a row' });
        const Bst = v.stage({ x: [-1, 31], y: [0, 31], axes: 'box', gutter: true, height: 400, xlabel: 'column $c$', ylabel: '$r c \\bmod n$', title: 'the selected row' });
        T.onClick((x, y) => { const n = N.value, r = n - 1 - Math.round(y); if (r >= 0 && r < n) R0.set(r); });
        let info = {};
        v.render(() => {
          const n = N.value, r0 = Math.min(R0.value, n - 1);
          T.setView([-2.6, n + 0.2], [-1.4, n + 0.5]);
          const big = T.width / (n + 2.8) >= 20;
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            const val = (r * c) % n, y = n - 1 - r;
            if (val === 0) T.rect(c - 0.5, y - 0.5, c + 0.5, y + 0.5, { fill: 'gold', fillAlpha: 0.5, stroke: false });
            else T.rect(c - 0.5, y - 0.5, c + 0.5, y + 0.5, { fill: v.ramp(0.08 + 0.62 * val / n, 'accent'), fillAlpha: 1, stroke: false });
            if (big && n <= 16) T.text(String(val), c, y, { align: 'center', baseline: 'middle', size: 10.5, color: 'ink' });
          }
          for (let r = 0; r < n; r++) {
            const y = n - 1 - r, unit = gcd(r, n) === 1;
            T.rect(-1.1, y - 0.46, -0.6, y + 0.46, { fill: unit ? 'green' : 'red', fillAlpha: 0.8, stroke: false });
            if (n <= 30) T.text(String(r), -1.25, y, { align: 'right', baseline: 'middle', size: 10, color: unit ? 'green' : 'muted', weight: unit ? 650 : 500 });
          }
          for (let c = 0; c < n; c += n > 20 ? 5 : 1) T.text(String(c), c, n + 0.1, { align: 'center', baseline: 'bottom', size: 10, color: 'muted' });
          T.rect(-0.5, n - 1 - r0 - 0.5, n - 0.5, n - 1 - r0 + 0.5, { color: 'ink', width: 2.4 });
          Bst.setView([-1, n], [0, n]);
          const seen = new Set();
          for (let c = 0; c < n; c++) {
            const val = (r0 * c) % n, dup = seen.has(val); seen.add(val);
            Bst.rect(c - 0.38, 0, c + 0.38, val, { fill: dup ? 'red' : 'blue', fillAlpha: 0.55, color: dup ? 'red' : 'blue', width: 1.2 });
          }
          info = { n, r0, d: seen.size, g: gcd(r0, n) };
        });
        v.readout(() => {
          const { n, r0, d, g } = info, units = []; for (let a = 1; a <= n; a++) if (gcd(a, n) === 1) units.push(a);
          let t = `Row $r=${r0}$: $\\gcd(${r0},${n})=${g}$, and the row takes **${d}** distinct values (expected $n/\\gcd=${n / (g || n)}$)`;
          t += g === 1 ? ` — all $n$ of them: a permutation, so $${r0}$ is a unit` : ` — values repeat (red bars), so $${r0}$ is not a unit`;
          t += `.\nUnits modulo $${n}$: $\\{${units.join(', ')}\\}$, a reduced residue system of size $\\varphi(${n})=${units.length}$.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Chinese remainder theorem',
      statement: String.raw`Let $m,n\ge1$ be coprime. For all integers $a,b$ the system
$$x\equiv a\pmod m,\qquad x\equiv b\pmod n$$
has a solution, and it is unique modulo $mn$. Equivalently, the map $\Z/mn\Z\to\Z/m\Z\times\Z/n\Z$, $x\mapsto(x\bmod m,\ x\bmod n)$ is a bijection (indeed a ring isomorphism), and $(\Z/mn\Z)^\times\cong(\Z/m\Z)^\times\times(\Z/n\Z)^\times$. If $\gcd(m,n)=g>1$, the system is solvable iff $a\equiv b\pmod g$, and then the solution is unique modulo $\operatorname{lcm}(m,n)$.`,
      idea: String.raw`Since $\gcd(m,n)=1$, $m$ is invertible modulo $n$ and $n$ modulo $m$ (2.2). Put $x=a\,n\,\bar n+b\,m\,\bar m$ with $n\bar n\equiv1\pmod m$ and $m\bar m\equiv1\pmod n$: this is $\equiv a$ modulo $m$ and $\equiv b$ modulo $n$. Uniqueness: two solutions differ by a number divisible by both $m$ and $n$, hence by $mn$ (Euclid's lemma). Counting finishes the bijection: both sides have $mn$ elements and the map is injective.`,
      caption: String.raw`Walk the numbers $0,1,2,\dots$ through the grid of pairs $(x\bmod m,\ x\bmod n)$: each step moves one cell right and one cell down, wrapping around. Shade = time of first visit. For coprime $m,n$ the walk of length $mn$ visits **every** cell exactly once; try $m=6,n=4$ and watch cells get revisited while others are never reached. Click a cell to read off the solution of the system.`,
      deps: ['nt-2.2'],
      refs: ['Apostol §5.7'],
      tags: ['crt', 'residue classes'],
      credit: 'Sun Zi, Sunzi suanjing, c. 3rd–5th century',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chinese_remainder_theorem' },
      viz(v) {
        const M1 = v.slider('modulus $m$ (columns)', 2, 14, 5, { int: true });
        const N1 = v.slider('modulus $n$ (rows)', 2, 14, 7, { int: true });
        const K = v.slider('walk length $L$', 0, 196, 35, { int: true });
        const S = v.stage({ x: [-1.5, 15], y: [-1.5, 15], axes: false, full: true, height: 420, title: 'the grid of pairs $(x \\bmod m,\\ x \\bmod n)$ — click a cell to choose $(a,b)$' });
        let sel = [2, 3], info = {};
        S.onClick((x, y) => { const a = Math.round(x), b = Math.round(y); if (a >= 0 && a < M1.value && b >= 0 && b < N1.value) { sel = [a, b]; v.invalidate(); } });
        v.render(() => {
          const m = M1.value, n = N1.value, total = m * n, L = Math.min(K.value, total);
          S.setView([-1.3, m + 0.3], [-1.3, n + 0.3]);
          const first = new Map(), cnt = new Map(), xs = [];
          for (let x = 0; x < L; x++) { const key = (x % m) + ',' + (x % n); if (!first.has(key)) first.set(key, x); cnt.set(key, (cnt.get(key) || 0) + 1); }
          const px = Math.min(S.width / (m + 1.6), S.height / (n + 1.6));
          for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
            const key = a + ',' + b, f = first.get(key), c = cnt.get(key) || 0;
            if (f === undefined) S.rect(a - 0.5, b - 0.5, a + 0.5, b + 0.5, { color: 'grid', width: 1, fill: 'panel', fillAlpha: 1 });
            else S.rect(a - 0.5, b - 0.5, a + 0.5, b + 0.5, { fill: v.ramp(0.08 + (0.55 * f) / Math.max(1, total), 'blue'), fillAlpha: 1, color: c > 1 ? 'red' : 'grid', width: c > 1 ? 2.4 : 1 });
            if (f !== undefined && px >= 24) S.text(String(f), a, b, { align: 'center', baseline: 'middle', size: Math.min(12, px / 2.3), color: 'ink' });
          }
          for (let a = 0; a < m; a++) S.text(String(a), a, -0.75, { align: 'center', size: 10.5, color: 'muted' });
          for (let b = 0; b < n; b++) S.text(String(b), -0.8, b, { align: 'center', baseline: 'middle', size: 10.5, color: 'muted' });
          S.text('x mod m', m / 2 - 0.5, -1.15, { align: 'center', size: 11, color: 'muted' });
          // the path
          const pts = []; for (let x = 0; x < L; x++) pts.push([x % m, x % n]);
          for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i]; if (Math.abs(p[0] - q[0]) <= 1 && Math.abs(p[1] - q[1]) <= 1) S.line(p[0], p[1], q[0], q[1], { color: 'ink', width: 1, alpha: 0.35 }); }
          if (L > 0) { const p = pts[L - 1]; S.dot(p[0], p[1], { r: 6, color: 'gold' }); }
          const [sa, sb] = sel.map((z, i) => Math.min(z, (i ? n : m) - 1));
          S.rect(sa - 0.5, sb - 0.5, sa + 0.5, sb + 0.5, { color: 'orange', width: 3 });
          info = { m, n, L, total, covered: first.size, g: gcd(m, n), sa, sb };
        });
        v.readout(() => {
          const { m, n, L, total, covered, g, sa, sb } = info;
          const sols = []; for (let x = 0; x < total; x++) if (x % m === sa && x % n === sb) sols.push(x);
          let t = `$\\gcd(${m},${n})=${g}$. After $L=${L}$ steps the walk has reached **${covered}** of the $${m}\\cdot${n}=${total}$ cells`;
          t += g === 1 ? (L >= total ? ' — every cell, each exactly once.' : ' (coprime: it will cover all of them at $L=mn$).') : `; the walk repeats after $\\operatorname{lcm}=${(m * n) / g}$ steps and only ${(m * n) / g} cells are ever reached.`;
          t += `\nSelected cell $(a,b)=(${sa},${sb})$: ` + (sols.length ? `$x\\equiv ${sa}\\ (${m}),\\ x\\equiv ${sb}\\ (${n})$ has the solution${sols.length > 1 ? 's' : ''} $x=${sols.slice(0, 6).join(', ')}$ in $[0,${total})$` + (g === 1 ? ` — unique, and by the formula $x\\equiv ${sa}\\cdot${n}\\cdot${inv(n, m)}+${sb}\\cdot${m}\\cdot${inv(m, n)}\\equiv ${mod(sa * n * inv(n, m) + sb * m * inv(m, n), total)}$.` : `, i.e. unique modulo $\\operatorname{lcm}=${(m * n) / g}$.`) : `no $x$ at all — here $a\\not\\equiv b \\pmod{${g}}$.`);
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Fermat’s little theorem',
      statement: String.raw`If $p$ is prime and $p\nmid a$, then
$$a^{p-1}\equiv1\pmod p .$$
Equivalently $a^p\equiv a\pmod p$ for every integer $a$. The conclusion can fail for composite moduli: if $n$ is composite, many $a$ have $a^{n-1}\not\equiv1\pmod n$ (a rare few composites, the *Fermat pseudoprimes to base $a$*, still pass).`,
      idea: String.raw`Since $p$ is prime, every nonzero residue is a unit (2.3), so $x\mapsto ax$ permutes $\{1,\dots,p-1\}$. Taking the product of all the numbers before and after the permutation gives $(p-1)!\equiv a^{p-1}(p-1)!\pmod p$. The factorial is a product of units, hence cancellable, and $a^{p-1}\equiv1$ remains. The only thing used is that $\{1,\dots,p-1\}$ consists entirely of units — which is exactly what fails for composite $n$.`,
      caption: String.raw`Left: an arrow $i\to ai \bmod n$ for every $i=1,\dots,n-1$. When $n$ is prime exactly one arrow enters each point (green rings): the arrows form a permutation. For composite $n$ points get 0 or several arrows (red). Right: for the chosen base $a$, each $n\le401$ is coloured — green: $a^{n-1}\equiv1$, red: fails, grey: shares a factor with $a$. Primes (dotted) are all green; the green non-primes are pseudoprimes (try $a=2$ near 341, or $a=3$ at 91). Click a cell to change $n$.`,
      deps: ['nt-2.3'],
      refs: ['Hardy–Wright §6.1', 'Apostol §5.4'],
      tags: ['fermat', 'primes'],
      credit: 'Fermat, letter to Frénicle, 1640; first proof by Euler, 1736',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermat%27s_little_theorem' },
      viz(v) {
        const N = v.slider('modulus $n$', 3, 60, 13, { int: true });
        const A = v.slider('base $a$', 2, 60, 2, { int: true });
        const C = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, height: 360, title: 'the map $i\\mapsto a\\,i \\bmod n$ on $\\{1,\\dots,n-1\\}$' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'the Fermat test $a^{n-1}\\equiv1 \\pmod n$ for $n=2,\\dots,401$ (row by row, $n=2$ top left) — click a cell ($n\\le60$) to choose $n$' });
        let grid = null, info = {};
        G.onClick((x, y) => { if (!grid) return; const i = grid.at(x, y); if (i >= 0 && i + 2 <= 60) N.set(i + 2); });
        v.legend([['green', 'passes $a^{n-1}\\equiv1$'], ['red', 'fails'], ['faint', '$\\gcd(a,n)>1$']]);
        v.render(() => {
          const n = N.value, a = A.value;
          drawClock(C, n, { R: 1, color: () => 'muted', labels: n <= 40, r: n <= 30 ? 3.5 : 2 });
          const indeg = new Array(n).fill(0);
          for (let i = 1; i < n; i++) indeg[(a * i) % n]++;
          for (let i = 1; i < n; i++) { const j = (a * i) % n; if (j !== 0) clockArrow(C, i, j, n, { color: pcol(i), alpha: 0.75, width: 1.2, head: n > 30 ? 4 : 6, shrink: 0.04 }); else { const [x, y] = clockXY(i, n, 1); C.dot(x, y, { r: 6, hollow: true, color: 'red' }); } }
          for (let k = 1; k < n; k++) { const [x, y] = clockXY(k, n, 1); C.dot(x, y, { r: n <= 30 ? 8 : 5, hollow: true, color: indeg[k] === 1 ? 'green' : 'red', width: 2 }); }
          // test grid
          grid = pixGrid(G, 400, { pad: 6 });
          for (let m = 2; m <= 401; m++) {
            const [x0, y0, x1, y1] = grid.cell(m - 2), g = gcd(a, m), ok = g === 1 && powmod(a, m - 1, m) === 1;
            G.rect(x0 + 0.5, y0 + 0.5, x1 - 0.5, y1 - 0.5, { fill: g > 1 ? 'faint' : ok ? 'green' : 'red', fillAlpha: g > 1 ? 0.25 : ok ? 0.7 : 0.4, stroke: false });
            if (isPrime(m)) G.dot((x0 + x1) / 2, (y0 + y1) / 2, { r: Math.max(1.4, grid.cs * 0.14), color: 'ink' });
            if (m === n) G.rect(x0, y0, x1, y1, { color: 'orange', width: 2.4 });
          }
          info = { n, a, perm: indeg.slice(1).every((d) => d === 1), p: isPrime(n), r: powmod(a, n - 1, n), g: gcd(a, n) };
        });
        v.readout(() => {
          const { n, a, perm, p, r, g } = info;
          let t = `$n=${n}$ is ${p ? '**prime**' : '**composite**'}; $a=${a}$. The arrows ${perm ? 'form a permutation of $\\{1,\\dots,n-1\\}$' : 'do **not** form a permutation'} (${g > 1 ? `$\\gcd(a,n)=${g}$: some multiples of $a$ collapse` : 'every point is hit once'}).`;
          t += `\n$${a}^{${n - 1}}\\bmod ${n}=${r}$` + (p && g === 1 ? ' — Fermat holds, as the theorem promises.' : r === 1 ? ' — equals 1 although $n$ is composite: **a Fermat pseudoprime** to this base.' : ' — not 1, so $n$ cannot be prime: a *Fermat witness*.');
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Necklace proof of Fermat’s little theorem',
      statement: String.raw`For a prime $p$ and any integer $a\ge1$, the number $a^p-a$ is divisible by $p$. Proof by counting: consider the $a^p$ strings of length $p$ over an alphabet of $a$ colours, and let the cyclic group $\Z/p\Z$ act on them by rotation. Then the $a$ constant strings are fixed, every other orbit has exactly $p$ elements, so
$$a^p=a+p\cdot(\text{number of full orbits}),$$
whence $p\mid a^p-a$, and for $p\nmid a$ cancelling $a$ gives $a^{p-1}\equiv1\pmod p$. The *number of $a$-coloured necklaces* of length $p$ is $\bigl(a^p-a\bigr)/p+a$.`,
      idea: String.raw`The orbit–stabiliser count (comb-10.2): an orbit of a group of order $p$ has size $p/|{\rm Stab}|$, so its size divides $p$ and is either $1$ or $p$ — here is where primality enters. An orbit of size 1 is a string equal to all its rotations, i.e. constant ($a$ of those). Everything else comes in orbits of exactly $p$ strings. No divisions or inverses mod $p$ are used until the final cancellation.`,
      caption: String.raw`Every little ring is one *necklace*: an orbit of strings under rotation (beads in $a$ colours). Pick the length $n$ and the number of colours. For prime $n$ the green frames are the $a$ single-colour necklaces (orbit size 1) and every other orbit has all $n$ rotations distinct. For composite $n$ (try 4 or 6) orbits of intermediate size appear (red frames) and the count $a^n-a$ is no longer divisible by $n$.`,
      deps: ['comb-10.4'],
      refs: ['Hardy–Wright §6.3'],
      tags: ['fermat', 'counting', 'group action'],
      credit: 'Combinatorial proof, Golomb, 1956',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Necklace_(combinatorics)' },
      viz(v) {
        const NS = v.select('length $n$', [2, 3, 4, 5, 6, 7].map((k) => ({ value: k, label: String(k) })), 5);
        const AS = v.select('colours $a$', [2, 3].map((k) => ({ value: k, label: String(k) })), 2);
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'all orbits of $a^n$ strings under rotation (one ring per orbit)' });
        const cache = new Map();
        const orbits = (n, a) => {
          const key = n + ',' + a; if (cache.has(key)) return cache.get(key);
          const tot = a ** n, top = a ** (n - 1), seen = new Uint8Array(tot), out = [];
          const rot = (c) => (c % top) * a + Math.floor(c / top);
          for (let c = 0; c < tot; c++) if (!seen[c]) {
            const mem = []; let x = c; do { seen[x] = 1; mem.push(x); x = rot(x); } while (x !== c);
            const digs = []; let y = c; for (let i = 0; i < n; i++) { digs.push(y % a); y = Math.floor(y / a); }
            out.push({ size: mem.length, digs });
          }
          out.sort((p, q) => p.size - q.size);
          cache.set(key, out); return out;
        };
        const BC = ['blue', 'orange', 'green'];
        let info = {};
        v.render(() => {
          const n = NS.value, a = AS.value, O = orbits(n, a);
          const g = pixGrid(S, O.length, { pad: 6, max: 120 });
          let full = 0, mono = 0, mid = 0;
          O.forEach((o, i) => {
            const [x0, y0, x1, y1] = g.cell(i), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = g.cs * 0.3, br = Math.max(1.6, Math.min(7, g.cs * 0.09));
            const col = o.size === n ? 'faint' : o.size === 1 ? 'green' : 'red';
            if (o.size === n) full++; else if (o.size === 1) mono++; else mid++;
            S.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, { color: col, width: o.size === n ? 1 : 2, fill: o.size === n ? undefined : col, fillAlpha: 0.12 });
            for (let k = 0; k < n; k++) { const t = Math.PI / 2 - (2 * Math.PI * k) / n; S.dot(cx + R * Math.cos(t), cy + R * Math.sin(t), { r: br, color: BC[o.digs[k]] }); }
          });
          info = { n, a, tot: a ** n, count: O.length, full, mono, mid };
        });
        v.legend([['faint', 'full orbit (size $n$)', { area: true }], ['green', 'constant string (size 1)', { area: true }], ['red', 'intermediate size', { area: true }]]);
        v.readout(() => {
          const { n, a, tot, count, full, mono, mid } = info, p = isPrime(n);
          let t = `$a^n=${a}^{${n}}=${tot}$ strings fall into **${count}** orbits: ${mono} constant, ${full} full (${n} strings each)` + (mid ? `, ${mid} of intermediate size` : '') + `.\n`;
          t += `$a^n-a=${tot - a}$ ` + ((tot - a) % n === 0 ? `$=${n}\\cdot${(tot - a) / n}$ is divisible by $n$` : `is **not** divisible by $${n}$`) + (p ? ` — as the theorem says for the prime $n=${n}$ (full orbits: $(a^n-a)/n=${(tot - a) / n}$).` : ` ($n$ is composite, so orbit sizes need not be $1$ or $n$).`);
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Euler’s totient function',
      statement: String.raw`For $n\ge1$ let $\varphi(n)$ be the number of integers $k$ with $1\le k\le n$ and $\gcd(k,n)=1$; equivalently the number of units in $\Z/n\Z$ and the size of a reduced residue system. Then $\varphi(1)=1$, $\varphi(p)=p-1$ and $\varphi(p^e)=p^e-p^{e-1}$ for a prime $p$. In general (2.9)
$$\varphi(n)=n\prod_{p\mid n}\Bigl(1-\frac1p\Bigr).$$`,
      idea: String.raw`The definition is a count of the units from 2.3. For a prime power $p^e$ the integers in $[1,p^e]$ not coprime to it are the multiples of $p$, of which there are $p^{e-1}$. The general product formula is proved in 2.9 by combining prime powers with the Chinese remainder theorem. Heuristically each prime $p\mid n$ removes a fraction $1/p$ of the residues, independently — so $\varphi(n)/n$ depends only on *which* primes divide $n$.`,
      caption: String.raw`Each dot is $(n,\varphi(n))$. Primes (green) sit on the top line $\varphi=n-1$. Even numbers lie on or below the slope-$\tfrac12$ line, multiples of 6 on or below slope $\tfrac13$, and so on: the fan of lines are the values $\prod_{p\in S}(1-1/p)$ for $S=\{2\},\{2,3\},\{2,3,5\},\dots$ Click a dot (or use the slider) to see which residues up to $n$ are units.`,
      deps: ['nt-2.3'],
      refs: ['Hardy–Wright §5.5', 'Apostol §2.3'],
      tags: ['totient', 'arithmetic function'],
      credit: 'Euler, 1763 (notation φ: Gauss, 1801)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler%27s_totient_function' },
      viz(v) {
        const NMAX = v.slider('plot $n\\le$', 50, 1000, 400, { int: true });
        const SEL = v.slider('$n$', 1, 1000, 60, { int: true });
        const P = v.stage({ x: [0, 400], y: [0, 400], axes: 'box', gutter: true, height: 380, xlabel: '$n$', ylabel: '$\\varphi(n)$', title: '$\\varphi(n)$ for $n\\le N$' });
        const U = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, title: 'the residues $1,\\dots,n$: units in green' });
        P.onClick((x) => SEL.set(Math.max(1, Math.min(NMAX.value, Math.round(x)))));
        const PHI = new Array(1001).fill(0), W = new Array(1001).fill(0);
        for (let n = 1; n <= 1000; n++) { PHI[n] = totient(n); W[n] = primeFactors(n).length; }
        const wc = ['blue', 'orange', 'purple', 'pink'];
        let info = {};
        v.render(() => {
          const N = NMAX.value; if (SEL.value > N) SEL.set(N);
          const n = Math.min(SEL.value, N);
          P.setView([0, N * 1.02], [0, N * 1.02]);
          const lines = [[1, 'p'], [0.5, '2'], [1 / 3, '2,3'], [4 / 15, '2,3,5'], [8 / 35, '2,3,5,7']];
          lines.forEach(([s, lab], i) => { P.line(0, 0, N, N * s, { color: i ? 'faint' : 'faint', width: 1.2, dash: [5, 4] }); });
          [[0.5, '$\\tfrac12$', 0.97, 'bottom'], [1 / 3, '$\\tfrac13$', 0.97, 'bottom'], [4 / 15, '$\\tfrac{4}{15}$', 0.84, 'bottom'], [8 / 35, '$\\tfrac{8}{35}$', 0.97, 'top']].forEach(([s, lab, xf, bl]) => P.text(lab, N * xf, N * xf * s, { align: 'center', baseline: bl, size: 11, color: 'muted', dy: bl === 'top' ? 5 : -5 }));
          const r = N > 600 ? 1.6 : 2.4;
          for (let m = 1; m <= N; m++) P.dot(m, PHI[m], { r, color: isPrime(m) ? 'green' : wc[Math.min(3, W[m] - 1)] ?? 'blue' });
          P.dot(n, PHI[n], { r: 6, hollow: true, color: 'gold', width: 2.4 });
          P.vline(n, { color: 'gold', width: 1, alpha: 0.5 });
          const g = pixGrid(U, n, { pad: 6 }); let cnt = 0;
          for (let k = 1; k <= n; k++) { const [x0, y0, x1, y1] = g.cell(k - 1), u = gcd(k, n) === 1; if (u) cnt++; U.rect(x0 + 0.4, y0 + 0.4, x1 - 0.4, y1 - 0.4, { fill: u ? 'green' : 'faint', fillAlpha: u ? 0.75 : 0.15, stroke: false }); if (g.cs >= 17) U.text(String(k), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Math.min(11, g.cs / 2.2), color: u ? 'ink' : 'faint' }); }
          info = { n, cnt };
        });
        v.legend([['green', 'prime'], ['blue', 'prime power'], ['orange', '2 prime factors'], ['purple', '3'], ['pink', '≥4']]);
        v.readout(() => {
          const { n, cnt } = info, pf = primeFactors(n);
          return `$n=${n}$: counting the $k\\le n$ with $\\gcd(k,n)=1$ gives **${cnt}**; the product formula $${n}${pf.map((p) => `\\bigl(1-\\tfrac1{${p}}\\bigr)`).join('')}=${totient(n)}$ ${cnt === totient(n) ? 'agrees' : 'DISAGREES'}. Ratio $\\varphi(n)/n=${(cnt / n).toFixed(4)}$ depends only on the primes ${pf.length ? '$' + pf.join(', ') + '$' : '(none)'} dividing $n$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Euler’s theorem (Euler–Fermat)',
      statement: String.raw`If $n\ge1$ and $\gcd(a,n)=1$, then
$$a^{\varphi(n)}\equiv1\pmod n .$$
More precisely the *order* $d$ of $a$ modulo $n$ (the least $d\ge1$ with $a^d\equiv1$) divides $\varphi(n)$. For a prime $n=p$ this is Fermat's little theorem; the hypothesis $\gcd(a,n)=1$ cannot be dropped.`,
      idea: String.raw`Same permutation trick as in 2.5, but with the units: if $u_1,\dots,u_{\varphi(n)}$ are the units modulo $n$ then $au_1,\dots,au_{\varphi(n)}$ is the same set in another order, so $a^{\varphi(n)}\prod u_i\equiv\prod u_i$ and the product (a unit) cancels. The picture is Lagrange's theorem in disguise: the powers $1,a,a^2,\dots,a^{d-1}$ form a subgroup of order $d$, and the units split into cosets $u\{1,a,\dots\}$ of size $d$ — so $d\cdot(\#\text{cosets})=\varphi(n)$.`,
      caption: String.raw`Choose $n$ and $a$. The arrows trace $1\to a\to a^2\to\cdots$ around the clock; the cycle closes up at 1 after exactly $d$ steps. All units are coloured by their coset of this cycle: every colour class has exactly $d$ members and there are $\varphi(n)/d$ of them. Choose $a$ with a common factor and the orbit of 1 never comes back (grey path, no Euler).`,
      deps: ['nt-2.7', 'nt-2.5'],
      refs: ['Apostol §5.4'],
      tags: ['euler', 'order', 'group'],
      credit: 'Euler, 1763',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler%27s_theorem' },
      viz(v) {
        const N = v.slider('modulus $n$', 2, 60, 21, { int: true });
        const A = v.slider('$a$', 2, 60, 5, { int: true });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 400, title: 'powers of $a$ on the clock; units coloured by coset of $\\langle a\\rangle$' });
        let info = {};
        v.render(() => {
          const n = N.value, a = A.value % n, g = gcd(a, n), phi = totient(n);
          // orbit of 1
          const path = [1 % n]; let x = 1 % n;
          for (let i = 0; i < 2 * n; i++) { x = (x * a) % n; if (path.includes(x)) { path.push(x); break; } path.push(x); }
          const closed = path[path.length - 1] === path[0] && path.length > 1, d = closed ? path.length - 1 : 0;
          const sub = new Set(path.slice(0, closed ? d : path.length));
          // cosets
          const cos = new Map(), colorOf = new Array(n).fill(-1); let nc = 0;
          if (g === 1) for (let u = 1; u < n; u++) if (gcd(u, n) === 1 && colorOf[u] < 0) { let y = u; do { colorOf[y] = nc; y = (y * a) % n; } while (y !== u); nc++; }
          drawClock(C, n, { R: 1, color: (k) => (colorOf[k] >= 0 ? pcol(colorOf[k]) : 'faint'), dim: (k) => colorOf[k] < 0 && g === 1 && gcd(k, n) !== 1 || (g !== 1 && !sub.has(k)), r: n <= 30 ? 6 : 4 });
          for (let i = 0; i + 1 < path.length; i++) if (path[i] !== path[i + 1]) clockArrow(C, path[i], path[i + 1], n, { color: closed ? 'ink' : 'red', width: 1.8, head: 8, shrink: 0.06 });
          const [hx, hy] = clockXY(1 % n, n, 1); C.dot(hx, hy, { r: 11, hollow: true, color: 'gold', width: 2.6 });
          C.text(g === 1 ? `ord = ${d}` : 'no return', 0, 0.12, { align: 'center', size: 20, weight: 700, color: g === 1 ? 'ink' : 'red' });
          C.text(`φ(${n}) = ${phi}`, 0, -0.18, { align: 'center', size: 14, color: 'muted' });
          info = { n, a, g, phi, d, nc, r: powmod(a, phi, n) };
        });
        v.readout(() => {
          const { n, a, g, phi, d, nc, r } = info;
          if (g !== 1) return `$\\gcd(${a},${n})=${g}>1$: the powers of $${a}$ never return to $1$ (they fall into a cycle of non-units), and $${a}^{\\varphi(${n})}=${a}^{${phi}}\\equiv ${r}\\pmod{${n}}$ — the hypothesis is needed.`;
          return `$\\varphi(${n})=${phi}$, and the order of $${a}$ is $d=${d}$ with $${d}\\mid${phi}$ ($${phi}=${d}\\cdot${nc}$: **${nc}** coset${nc > 1 ? 's' : ''} of size ${d}). Hence $${a}^{${phi}}=(${a}^{${d}})^{${nc}}\\equiv ${r}\\pmod{${n}}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Product formula for φ',
      statement: String.raw`$\varphi$ is multiplicative: $\varphi(mn)=\varphi(m)\varphi(n)$ whenever $\gcd(m,n)=1$. Together with $\varphi(p^e)=p^e-p^{e-1}$ this gives, for $n=p_1^{e_1}\cdots p_k^{e_k}$,
$$\varphi(n)=\prod_{i=1}^{k}p_i^{e_i-1}(p_i-1)=n\prod_{p\mid n}\Bigl(1-\frac1p\Bigr).$$
The second form is also the inclusion–exclusion count $\varphi(n)=\sum_{d\mid n}\mu(d)\,n/d$ of the residues in $[1,n]$ divisible by none of the primes of $n$.`,
      idea: String.raw`Two proofs. (i) By the Chinese remainder theorem (2.4), $(\Z/mn)^\times\cong(\Z/m)^\times\times(\Z/n)^\times$ for coprime $m,n$, since $x$ is a unit mod $mn$ iff it is one mod $m$ and mod $n$; counting gives multiplicativity. (ii) By inclusion–exclusion (comb-3.1) over the set of primes dividing $n$: the multiples of $p$ number $n/p$, the multiples of $pq$ number $n/pq$, and so on, and the alternating sum factors as $n\prod(1-1/p)$.`,
      caption: String.raw`Choose $n$ (try 210, 360, 1001-style products of distinct primes) and sieve the residues $1,\dots,n$ one prime at a time with the step slider: each cell struck by a prime is coloured by the first prime that hits it. The green survivors are the units. The bars below the grid are the terms of the inclusion–exclusion sum $n-\sum n/p+\sum n/pq-\cdots$; their running total ends exactly at $\varphi(n)$.`,
      deps: ['nt-2.7', 'nt-2.4', 'comb-3.1'],
      refs: ['Apostol §2.5', 'Apostol §5.10'],
      tags: ['totient', 'inclusion-exclusion', 'multiplicative'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler%27s_totient_function#Euler%27s_product_formula' },
      viz(v) {
        const N = v.slider('$n$', 2, 420, 210, { int: true });
        const ST = v.slider('primes applied', 0, 4, 4, { int: true });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, full: true, title: 'the residues $1,\\dots,n$, struck out by the primes dividing $n$' });
        const W = v.stage({ x: [0, 17], y: [-1, 1], axes: 'box', gutter: true, height: 230, full: true, ylabel: 'term', title: 'inclusion–exclusion terms $\\pm n/\\prod p$ over subsets of the primes; line = running total' });
        let info = {};
        v.render(() => {
          const n = N.value, ps = primeFactors(n), k = ps.length, use = Math.min(ST.value, k);
          const g = pixGrid(G, n, { pad: 4 }); let surv = 0;
          for (let m = 1; m <= n; m++) {
            const [x0, y0, x1, y1] = g.cell(m - 1), hit = ps.findIndex((p, i) => i < use && m % p === 0), alive = ps.every((p) => m % p !== 0);
            if (alive) surv++;
            const col = hit >= 0 ? pcol(hit) : alive ? 'green' : 'panel';
            G.rect(x0 + 0.3, y0 + 0.3, x1 - 0.3, y1 - 0.3, { fill: hit >= 0 ? col : alive ? 'green' : 'faint', fillAlpha: hit >= 0 ? 0.45 : alive ? 0.7 : 0.1, stroke: false });
            if (g.cs >= 16) G.text(String(m), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Math.min(10.5, g.cs / 2.1), color: alive ? 'ink' : 'muted' });
          }
          // inclusion-exclusion terms
          const terms = []; for (let mask = 0; mask < 1 << k; mask++) { let d = 1, s = 1; ps.forEach((p, i) => { if (mask >> i & 1) { d *= p; s = -s; } }); terms.push({ mask, d, s, val: s * (n / d), bits: ps.filter((p, i) => mask >> i & 1) }); }
          terms.sort((p, q) => p.bits.length - q.bits.length || p.d - q.d);
          let run = 0; const tot = terms.map((t) => (run += t.val));
          const ymax = n * 1.02, ymin = Math.min(-n * 0.52, Math.min(...tot) - n * 0.1) - n * 0.14;
          W.setView([-0.5, Math.max(8, terms.length) + 0.5], [ymin, ymax]);
          W.hline(0, { color: 'faint', width: 1 });
          terms.forEach((t, i) => {
            W.rect(i - 0.35, 0, i + 0.35, t.val, { fill: t.val > 0 ? 'blue' : 'red', fillAlpha: 0.5, color: t.val > 0 ? 'blue' : 'red', width: 1.1 });
            W.text(t.bits.length ? t.bits.join('·') : '1', i, ymin + n * 0.04, { align: 'center', baseline: 'bottom', size: 10.5, color: 'muted' });
          });
          W.path(tot.map((y, i) => [i, y]), { color: 'gold', width: 2 }); tot.forEach((y, i) => W.dot(i, y, { r: 3.5, color: 'gold' }));
          W.text(`total = ${tot[tot.length - 1]}`, terms.length - 0.4, tot[tot.length - 1], { align: 'right', baseline: 'bottom', size: 12, weight: 650, color: 'green', dy: -6 });
          info = { n, ps, surv, total: tot[tot.length - 1], use };
        });
        v.legend([['green', 'survivors = units'], ['blue', 'term $+$'], ['red', 'term $-$'], ['gold', 'running sum']]);
        v.readout(() => {
          const { n, ps, surv, total } = info;
          const fac = ps.map((p) => { let e = 0, m = n; while (m % p === 0) { m /= p; e++; } return `\\varphi(${p}^{${e}})`; }).join('\\cdot');
          return `$n=${n}$ has primes $\\{${ps.join(', ')}\\}$. Survivors: **${surv}**. Inclusion–exclusion total: **${total}**. Product formula: $${n}${ps.map((p) => `\\cdot\\tfrac{${p - 1}}{${p}}`).join('')}=${totient(n)}$. Multiplicativity: $\\varphi(n)=${fac}=${totient(n)}$. ${surv === totient(n) && total === surv ? 'All four agree.' : ''}`;
        });
      },
    },
  ],
};
