// Number Theory — Chapter 3: Primitive roots, cyclotomy and primality
// Part 1 (this file): order, primitive roots, Gauss's theorem on moduli, structure of the unit group, indices,
// decimal periods and the regular 17-gon (3.1–3.7). Part 2 (ch03-b.js): cyclotomic polynomials, primes ≡ 1 (mod n),
// Artin's conjecture, Carmichael numbers, Miller–Rabin and Lucas–Lehmer (3.8–3.13).
import { PAL, pcol, mod, gcd, isPrime, totient, divisors, ord, drawClock, clockXY, clockArrow, pixGrid, unitsOf, hasRoot, smallestRoot, gaussShape, fac, lcm, unitFactors, lambda, orderCounts } from './ch03.shared.js';

const primeAtMost = (m) => { let p = Math.max(2, Math.floor(m)); while (!isPrime(p)) p--; return p; };

export default {
  collection: 'nt',
  chapter: 3,
  title: 'Primitive roots, cyclotomy and primality',
  summary: String.raw`Every unit modulo $n$ has an order, and modulo a prime some unit has the largest possible order — a primitive root — so the unit group is cyclic. Gauss determined exactly which moduli have primitive roots and used the same circle of ideas to construct the regular 17-gon. Orders explain repeating decimals, cyclotomic polynomials give primes in the progression $1 \pmod n$, and Fermat’s theorem in reverse becomes a family of fast primality tests.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Multiplicative order',
      statement: String.raw`Let $n\ge2$ and let $a$ be an integer with $\gcd(a,n)=1$. The *order* of $a$ modulo $n$, written $\operatorname{ord}_n(a)$, is the least $k\ge1$ with $a^k\equiv1\pmod n$. It exists, and $a^m\equiv1\pmod n$ holds exactly when $\operatorname{ord}_n(a)\mid m$. In particular $\operatorname{ord}_n(a)\mid\varphi(n)$.

If $\gcd(a,n)>1$ no power of $a$ is ever $\equiv1$, so the order is not defined.`,
      idea: String.raw`The powers of a unit cannot be all different (there are finitely many classes), and multiplying by the inverse of $a$ shows the sequence is purely periodic from $a^0=1$, so some $a^k\equiv1$. Dividing $m$ by the least such $k$ with remainder shows that $a^m\equiv1$ forces $k\mid m$. Euler's theorem (2.8) says $a^{\varphi(n)}\equiv1$, hence $k\mid\varphi(n)$.`,
      caption: String.raw`Drag $n$ and $a$: the arrows follow $1\to a\to a^2\to\cdots$ round the clock, and the numbers mark the first visit at each step. For a unit the walk closes up at $1$ after exactly $\operatorname{ord}_n(a)$ steps. The bar chart lists the order of every unit modulo $n$ (click a bar to pick that unit): all bars land on divisors of $\varphi(n)$ (green line). Now choose $a$ with a common factor with $n$: the walk never returns to $1$.`,
      deps: ['nt-2.3', 'nt-2.8'],
      refs: ['Hardy–Wright §6.8', 'Apostol §10.1'],
      tags: ['order', 'units', 'cyclic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multiplicative_order' },
      viz(v) {
        const N = v.slider('modulus $n$', 2, 60, 13, { int: true });
        const A = v.slider('$a$', 1, 60, 5, { int: true });
        const C = v.stage({ x: [-1.75, 1.75], y: [-1.5, 1.5], equal: true, axes: false, height: 360, title: 'powers of $a$ walk round the clock' });
        const B = v.stage({ x: [0, 60], y: [0, 60], axes: 'box', gutter: true, height: 360, xlabel: 'unit $u$', ylabel: '$\\operatorname{ord}_n(u)$', title: 'order of every unit — click a bar' });
        B.onClick((x) => { const u = Math.round(x); if (u >= 1 && u < N.value) A.set(u); });
        let info = {};
        v.render(() => {
          const n = N.value, a = mod(A.value, n) || n; const aa = mod(a, n);
          const phi = totient(n), g = gcd(aa, n);
          // orbit of a under multiplication, starting from 1
          const seq = [1 % n], first = new Map([[1 % n, 0]]); let x = 1 % n, mu = 0, per = 0;
          for (let k = 1; k <= n + 2; k++) { x = (x * aa) % n; if (first.has(x)) { mu = first.get(x); per = k - mu; break; } first.set(x, k); seq.push(x); }
          info = { n, a: aa, g, phi, mu, per, ord: g === 1 ? per : 0, len: seq.length };
          drawClock(C, n, { R: 1, color: (k) => (gcd(k, n) === 1 ? 'blue' : 'faint'), dim: (k) => gcd(k, n) !== 1 });
          for (let k = 0; k < seq.length; k++) {
            const nx = k + 1 < seq.length ? seq[k + 1] : seq[mu];
            clockArrow(C, seq[k], nx, n, { color: k >= seq.length - 1 && g === 1 ? 'green' : 'gold', width: 2, alpha: 0.9 });
          }
          if (n <= 30) seq.forEach((r, k) => { const [px, py] = clockXY(r, n, 0.78 - (k % 3) * 0.0); C.text(String(k), px, py, { align: 'center', baseline: 'middle', size: 11, weight: 700, color: g === 1 && k === 0 ? 'green' : 'orange' }); });
          const [x1, y1] = clockXY(1 % n, n, 1); C.dot(x1, y1, { r: 11, hollow: true, color: 'green', width: 2.2 });
          const [x2, y2] = clockXY(aa, n, 1); C.dot(x2, y2, { r: 9, hollow: true, color: 'orange', width: 2.2 });
          // bar chart of orders
          const us = unitsOf(n), os = us.map((u) => ord(u, n));
          B.setView([0, n], [0, phi * 1.12]);
          B.setTicks(null, divisors(phi).filter((d) => d <= phi).map((d) => [d, String(d)]));
          us.forEach((u, i) => B.rect(u - 0.4, 0, u + 0.4, os[i], { fill: u === aa ? 'orange' : 'blue', fillAlpha: u === aa ? 0.8 : 0.45, color: u === aa ? 'orange' : 'blue', width: 1 }));
          B.hline(phi, { color: 'green', width: 1.4, dash: [5, 4] }); B.text('φ(n) = ' + phi, n - 0.5, phi * 1.06, { align: 'right', size: 12, color: 'green', weight: 650 });
          info.allDiv = os.every((o) => phi % o === 0);
        });
        v.readout(() => {
          const { n, a, g, phi, mu, per, allDiv } = info;
          if (g !== 1) return `$\\gcd(${a},${n})=${g}>1$: the powers of $${a}$ run into a cycle of length ${per} after ${mu} step${mu === 1 ? '' : 's'} and **never return to 1**, so $\\operatorname{ord}_{${n}}(${a})$ does not exist.`;
          return `$\\operatorname{ord}_{${n}}(${a})=${per}$, and $${per}\\mid\\varphi(${n})=${phi}$ ($\\varphi(n)/\\mathrm{ord}=${phi / per}$). Every unit's order divides $\\varphi(${n})$: **${allDiv}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Primitive roots modulo a prime',
      statement: String.raw`Let $p$ be a prime. For every divisor $d$ of $p-1$ there are exactly $\varphi(d)$ residues modulo $p$ of order $d$. In particular there are exactly $\varphi(p-1)\ge1$ *primitive roots* (residues of order $p-1$), and the unit group $(\Z/p\Z)^\times$ is cyclic, generated by any of them.

The statement is special to prime moduli: for composite $n$ the counts need not equal $\varphi(d)$, and primitive roots may be absent (see 3.3).`,
      idea: String.raw`Let $\psi(d)$ be the number of elements of order $d$. Every unit has an order dividing $p-1$, so $\sum_{d\mid p-1}\psi(d)=p-1=\sum_{d\mid p-1}\varphi(d)$ (Gauss's identity, 2.10). If some $a$ has order $d$, then $1,a,\dots,a^{d-1}$ are $d$ distinct roots of $x^d-1$, which by Lagrange's theorem (2.12) has at most $d$ roots modulo $p$; so they are all the roots, and the elements of order $d$ are the $a^j$ with $\gcd(j,d)=1$: that is $\varphi(d)$ of them. Hence $\psi(d)\in\{0,\varphi(d)\}$, and since the two sums agree, $\psi(d)=\varphi(d)$ for every $d$.`,
      caption: String.raw`Choose a modulus $m$ (a prime is the interesting case). Each bar counts the units of a given order $d\mid\varphi(m)$ and the green marker sits at $\varphi(d)$; click a bar to light up those elements on the clock (green ring = primitive roots). For primes every bar reaches its marker. Slide $m$ to a composite such as $8$ or $15$: bars drop to $0$ or exceed the markers and the top bar disappears — no primitive root.`,
      deps: ['nt-3.1', 'nt-2.12', 'nt-2.10'],
      refs: ['Apostol §10.4', 'Ireland–Rosen ch. 4'],
      tags: ['primitive root', 'cyclic group'],
      credit: 'Gauss, Disquisitiones arithmeticae, 1801 (first rigorous proof of existence for prime moduli)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Primitive_root_modulo_n' },
      viz(v) {
        const M = v.slider('modulus $m$', 3, 130, 31, { int: true });
        const C = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 360, title: 'units on the clock — highlighted: the selected order' });
        const H = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 360, xlabel: 'order $d$ (divisors of $\\varphi(m)$)', ylabel: 'number of units of order $d$', title: 'how many units have each order?' });
        let sel = -1, cur = { divs: [] };
        H.onClick((x) => { const i = Math.round(x); if (i >= 0 && i < cur.divs.length) sel = i; });
        let lastM = 0;
        v.render(() => {
          const m = M.value, phi = totient(m), divs = divisors(phi), us = unitsOf(m);
          const cnt = divs.map(() => 0); const ordOf = new Map();
          us.forEach((u) => { const o = ord(u, m); ordOf.set(u, o); const i = divs.indexOf(o); if (i >= 0) cnt[i]++; });
          if (m !== lastM) { sel = Math.max(0, divs.length - 2); lastM = m; }
          if (sel >= divs.length) sel = divs.length - 1;
          const d0 = divs[sel];
          const exact = divs.every((d, i) => cnt[i] === totient(d));
          const roots = us.filter((u) => ordOf.get(u) === phi);
          cur = { m, phi, divs, cnt, exact, roots, prime: isPrime(m) };
          drawClock(C, m, { R: 1, labels: m <= 40, color: (k) => (ordOf.get(k) === d0 ? 'orange' : ordOf.get(k) ? 'blue' : 'faint'), dim: (k) => !ordOf.get(k) || ordOf.get(k) !== d0 });
          roots.forEach((u) => { const [x, y] = clockXY(u, m, 1); C.dot(x, y, { r: m <= 40 ? 11 : 6, hollow: true, color: 'green', width: 2.2 }); });
          const top = Math.max(2, ...cnt, ...divs.map((d) => totient(d)));
          H.setView([-0.7, divs.length - 0.3], [0, top * 1.15]);
          H.setTicks(divs.map((d, i) => [i, String(d)]), null);
          divs.forEach((d, i) => {
            const ok = cnt[i] === totient(d);
            H.rect(i - 0.34, 0, i + 0.34, cnt[i], { fill: i === sel ? 'orange' : ok ? 'blue' : 'red', fillAlpha: i === sel ? 0.7 : 0.45, color: i === sel ? 'orange' : ok ? 'blue' : 'red', width: 1.2 });
            H.dot(i, totient(d), { r: 6, color: 'green', hollow: true, width: 2 });
          });
          H.text('green ○ = φ(d)', divs.length - 0.4, top * 1.07, { align: 'right', size: 12, color: 'green', weight: 650 });
        });
        v.readout(() => {
          const { m, phi, cnt, divs, exact, roots, prime } = cur;
          if (roots.length === 0) return `$m=${m}$ is ${prime ? 'prime' : 'composite'}: $\\varphi(m)=${phi}$ but **no unit has order ${phi}** — no primitive root. Counts match $\\varphi(d)$ for every $d$: ${exact}.`;
          return `$m=${m}$ ${prime ? 'is prime' : 'is composite (it still has roots, see 3.3)'}: $\\varphi(${phi})=${totient(phi)}$ primitive root${totient(phi) === 1 ? '' : 's'}${prime ? '' : ` ($${roots.length}$ found)`}: $${roots.slice(0, 12).join(', ')}${roots.length > 12 ? ',\\dots' : ''}$. Counts equal $\\varphi(d)$ for all $d\\mid ${phi}$: **${exact}**${prime && !exact ? ' (impossible)' : ''}. Total $\\sum\\psi(d)=${cnt.reduce((s, c) => s + c, 0)}=\\varphi(m)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Gauss: which moduli have primitive roots',
      statement: String.raw`The modulus $n\ge1$ has a primitive root (a unit of order $\varphi(n)$, i.e. $(\Z/n\Z)^\times$ is cyclic) if and only if $n$ is $1$, $2$, $4$, $p^k$ or $2p^k$ with $p$ an odd prime and $k\ge1$.`,
      idea: String.raw`By the Chinese remainder theorem (2.4), two factors with even unit-group orders prevent a cyclic product: this excludes two distinct odd prime factors, and a factor $4$ together with an odd prime. For an odd prime $p$, choose a primitive root $g$ modulo $p$ (3.2). It is not enough to lift $g$ as a root of $X^{p-1}-1$: that keeps its order at $p-1$. Instead choose $h=g$ or $g+p$ so that $h^{p-1}\not\equiv1\pmod{p^2}$; at least one works because their $(p-1)$st powers differ by $(p-1)g^{p-2}p$ modulo $p^2$. Repeated binomial expansion then shows that $h^{(p-1)p^j}-1$ is divisible by $p^{j+1}$ but not $p^{j+2}$, giving order $(p-1)p^{k-1}$ modulo $p^k$. CRT gives the same unit group for $2p^k$. Finally every odd unit has square $1$ modulo $8$; repeated squaring raises this congruence one power of $2$ at a time, so modulo $2^k$, $k\ge3$, its order is at most $2^{k-2}<\varphi(2^k)$.`,
      caption: String.raw`Each cell is a modulus $n\le200$, green if some unit has order $\varphi(n)$ (found by brute force). The green cells are exactly $1,2,4,p^k,2p^k$ — the readout checks every one of the 200. Click any cell: the bars show the order of each of its units against $\varphi(n)$ (green) and the largest possible order $\lambda(n)$ (orange). Try $n=8$: every unit squares to $1$, so no order exceeds $2<\varphi(8)=4$.`,
      deps: ['nt-3.2', 'nt-2.4'],
      refs: ['Apostol §10.6', 'Apostol §10.8'],
      tags: ['primitive root', 'Gauss'],
      credit: 'Gauss, Disquisitiones arithmeticae, 1801',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Primitive_root_modulo_n' },
      viz(v) {
        const LIM = 200;
        const has = [false]; for (let n = 1; n <= LIM; n++) has[n] = hasRoot(n);
        let mism = 0, count = 0; for (let n = 1; n <= LIM; n++) { if (has[n] !== gaussShape(n)) mism++; if (has[n]) count++; }
        let sel = 8;
        const G = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 380, title: 'moduli $1\\dots200$: green = has a primitive root' });
        const B = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 380, xlabel: 'unit $u$ modulo $n$', ylabel: '$\\operatorname{ord}_n(u)$', title: 'orders of the units of the selected $n$' });
        let pg = null;
        G.onClick((x, y) => { if (!pg) return; const i = pg.at(x, y); if (i >= 0) sel = i + 1; });
        v.render(() => {
          pg = pixGrid(G, LIM, { pad: 4 });
          for (let i = 0; i < LIM; i++) {
            const n = i + 1, [x0, y0, x1, y1] = pg.cell(i);
            G.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, { fill: has[n] ? 'green' : 'faint', fillAlpha: has[n] ? 0.55 : 0.12, stroke: n === sel, color: 'orange', width: 2.5 });
            if (pg.cs >= 18) G.text(String(n), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Math.min(12, pg.cs * 0.36), weight: has[n] ? 700 : 400, color: has[n] ? 'ink' : 'faint' });
          }
          const n = sel, phi = totient(n), us = unitsOf(n), os = us.map((u) => (n === 1 ? 1 : ord(u, n))), lam = lambda(n);
          B.setView([0, Math.max(n, 2)], [0, phi * 1.15 + 0.5]);
          B.setTicks(null, divisors(phi).map((d) => [d, String(d)]));
          us.forEach((u, i) => B.rect(u - 0.4, 0, u + 0.4, os[i], { fill: os[i] === phi ? 'green' : 'blue', fillAlpha: 0.5, color: os[i] === phi ? 'green' : 'blue', width: 1 }));
          B.hline(phi, { color: 'green', width: 1.4, dash: [5, 4] });
          if (lam !== phi) B.hline(lam, { color: 'orange', width: 1.6 });
          B.text(`n = ${n}: φ = ${phi}` + (lam !== phi ? `,  λ = ${lam}` : ''), Math.max(n, 2) - 0.3, phi * 1.07 + 0.2, { align: 'right', size: 12, color: 'ink', weight: 650 });
        });
        v.readout(() => {
          const n = sel, f = fac(n), phi = totient(n), lam = lambda(n);
          const shape = gaussShape(n);
          const tex = f.map(([p, e]) => (e === 1 ? `${p}` : `${p}^{${e}}`)).join('\\cdot');
          return `Moduli $\\le${LIM}$ with a primitive root: **${count}**; mismatches with the list $1,2,4,p^k,2p^k$: **${mism}**.\n$n=${n}=${tex}$: largest order of a unit $=${lam}$, $\\varphi(n)=${phi}$ — ${has[n] ? 'a primitive root exists' : `none exists (${lam} < ${phi})`}; of the Gauss form: ${shape}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Structure of the unit group (ℤ/nℤ)ˣ',
      statement: String.raw`Let $n=2^{e}p_1^{e_1}\cdots p_r^{e_r}$ with odd primes $p_i$. By the Chinese remainder theorem $(\Z/n\Z)^\times\cong(\Z/2^e\Z)^\times\times\prod_i(\Z/p_i^{e_i}\Z)^\times$. Each odd factor is cyclic of order $p_i^{e_i-1}(p_i-1)$; $(\Z/2^e\Z)^\times$ is trivial for $e\le1$, cyclic of order $2$ for $e=2$, and $\Z/2\times\Z/2^{e-2}$ for $e\ge3$ (generated by $-1$ and $5$). Consequently the exponent of the group (the largest order of a unit) is $\lambda(n)=\operatorname{lcm}$ of the factor orders, with the usual special case $2^{e-2}$ for $2^e$, $e\ge3$.`,
      idea: String.raw`The decomposition is the Chinese remainder theorem (2.4) applied to the prime-power factorization. Odd prime powers have primitive roots (3.3). For $2^e$ with $e\ge3$, $5$ has order $2^{e-2}$ and $-1\notin\langle5\rangle$ (all powers of $5$ are $\equiv1\pmod 4$), so $\{\pm5^j\}$ already gives all $2\cdot2^{e-2}=\varphi(2^e)$ units. The order of $(a_1,\dots,a_s)$ in a product is the lcm of the component orders.`,
      caption: String.raw`Type $n$. The left panel draws one ring per cyclic factor (a ring of $m$ dots is $\Z/m$; dots are the powers of a generator). The right panel counts, by brute force over all units modulo $n$, how many have each order (bars), and compares with the number predicted from the product of rings (green circles). They agree for every $n$. Notice that the group is cyclic exactly when there is a single ring — the Gauss moduli of 3.3 — and that $\lambda(n)$ is the largest bar.`,
      deps: ['nt-3.3', 'nt-2.4'],
      refs: ['Ireland–Rosen ch. 4'],
      tags: ['unit group', 'structure'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Multiplicative_group_of_integers_modulo_n' },
      viz(v) {
        const N = v.slider('modulus $n$', 3, 360, 120, { int: true });
        const R = v.stage({ x: [-1.4, 6], y: [-1.7, 1.7], equal: true, axes: false, height: 300, title: 'the cyclic factors of $(\\mathbb Z/n\\mathbb Z)^\\times$' });
        const H = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: 'order $d$ of an element', ylabel: 'number of units of order $d$', title: 'brute force (bars) vs the product of rings (○)' });
        let info = {};
        v.render(() => {
          const n = N.value, fs = unitFactors(n), phi = totient(n);
          const ord2 = fs.map((f) => f.order);
          R.setView([-1.4, Math.max(1.8, fs.length * 2.7 - 1.0)], [-1.8, 1.9]);
          fs.forEach((f, i) => {
            const cx = i * 2.7, m = f.order, big = m > 36;
            R.circle(cx, 0, 1, { color: 'grid', width: 1 });
            const K = big ? 36 : m;
            for (let k = 0; k < K; k++) { const t = Math.PI / 2 - (2 * Math.PI * k) / K; R.dot(cx + Math.cos(t), Math.sin(t), { r: K <= 12 ? 5 : 3, color: PAL[i % 8], alpha: k === 0 ? 1 : 0.8 }); }
            R.text(f.tag + (big ? '  (' + m + ' dots, 36 drawn)' : ''), cx, -1.35, { align: 'center', size: 12, color: 'ink', weight: 600 });
            R.text(m === 1 ? '' : String(m), cx, 0, { align: 'center', baseline: 'middle', size: 18, color: PAL[i % 8], weight: 700 });
          });
          if (!fs.length) R.text('trivial group', 0, 0, { align: 'center', size: 14, color: 'muted' });
          const pred = orderCounts(ord2);
          const us = unitsOf(n), act = new Map(); us.forEach((u) => { const o = ord(u, n); act.set(o, (act.get(o) || 0) + 1); });
          const keys = [...new Set([...act.keys(), ...pred.keys()])].sort((a, b) => a - b);
          let agree = keys.every((k) => (act.get(k) || 0) === (pred.get(k) || 0));
          const top = Math.max(...act.values(), ...pred.values());
          H.setView([-0.7, keys.length - 0.3], [0, top * 1.18]);
          H.setTicks(keys.map((k, i) => [i, String(k)]), null);
          keys.forEach((k, i) => { H.rect(i - 0.34, 0, i + 0.34, act.get(k) || 0, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1.2 }); H.dot(i, pred.get(k) || 0, { r: 6, hollow: true, color: 'green', width: 2 }); });
          info = { n, fs, phi, lam: lambda(n), agree, maxOrd: Math.max(...act.keys()), cyc: fs.length <= 1 };
        });
        v.readout(() => {
          const { n, fs, phi, lam, agree, maxOrd, cyc } = info;
          const grp = fs.length ? fs.map((f) => `\\mathbb Z/${f.order}`).join('\\times') : '1';
          return `$(\\mathbb Z/${n}\\mathbb Z)^\\times\\cong ${grp}$, order $\\varphi(${n})=${phi}$; $\\lambda(${n})=${lam}$ and the largest order found by brute force is $${maxOrd}$. Predicted and counted order distributions agree: **${agree}**. Cyclic: ${cyc} (3.3 predicts ${gaussShape(n)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Index (discrete logarithm)',
      statement: String.raw`Let $p$ be a prime and $g$ a primitive root modulo $p$. Every $a\not\equiv0$ is congruent to $g^k$ for exactly one $k\in\{0,\dots,p-2\}$; this $k=\operatorname{ind}_g(a)$ is the *index* (discrete logarithm) of $a$ to the base $g$. It satisfies $\operatorname{ind}_g(ab)\equiv\operatorname{ind}_g a+\operatorname{ind}_g b\pmod{p-1}$ and $a^m\equiv1\iff(p-1)\mid m\operatorname{ind}_g a$: multiplication of units becomes addition of residues modulo $p-1$.`,
      idea: String.raw`Because $g$ has order $p-1$ (3.2), the powers $g^0,\dots,g^{p-2}$ are $p-1$ distinct units, hence all of them, so $\operatorname{ind}_g$ is a bijection from units to $\Z/(p-1)\Z$. Adding exponents multiplies powers, and $g^k\equiv g^l$ exactly when $k\equiv l\pmod{p-1}$, which gives the additivity. Computing $g^k$ from $k$ is fast; no comparably quick general method for computing $k$ from $g^k$ is known, and that asymmetry is what cryptography uses.`,
      caption: String.raw`Left: the map $k\mapsto g^k \bmod p$ is a bijection onto $1,\dots,p-1$ that looks like noise. Right: its inverse $a\mapsto\operatorname{ind}_g a$. Pick $a$ and $b$ (orange, purple) and watch $ab$ (green) land on the sum of the indices. Switch to a base that is not a primitive root: the powers repeat, and the grey units on the right never appear as a power, so there is no index at all.`,
      deps: ['nt-3.2'],
      refs: ['Apostol §10.10'],
      tags: ['index', 'discrete logarithm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Discrete_logarithm' },
      viz(v) {
        const P = v.slider('prime $p$ (largest prime $\\le$ value)', 5, 101, 37, { int: true });
        const J = v.slider('which primitive root $g$', 1, 8, 1, { int: true });
        const A = v.slider('$a$', 1, 100, 5, { int: true });
        const B = v.slider('$b$', 1, 100, 11, { int: true });
        const BAD = v.toggle('base is not a primitive root', false);
        const L = v.stage({ x: [-1, 40], y: [0, 40], axes: 'box', gutter: true, height: 340, xlabel: 'exponent $k$', ylabel: '$g^k \\bmod p$', title: '$k\\mapsto g^k$' });
        const Rg = v.stage({ x: [0, 40], y: [-1, 40], axes: 'box', gutter: true, height: 340, xlabel: 'unit $a$', ylabel: '$\\operatorname{ind}_g a$', title: 'the inverse map $a\\mapsto \\operatorname{ind}_g a$' });
        let info = {};
        v.render(() => {
          const p = primeAtMost(P.value), phi = p - 1;
          const roots = unitsOf(p).filter((u) => ord(u, p) === phi);
          let g = roots[Math.min(J.value, roots.length) - 1];
          if (BAD.value) { g = 2; while (g < p && ord(g, p) === phi) g++; if (g >= p) g = 1; }
          const pw = [1]; for (let k = 1; k < phi; k++) pw.push((pw[k - 1] * g) % p);
          const idx = new Map(); pw.forEach((x, k) => { if (!idx.has(x)) idx.set(x, k); });
          const a = ((A.value - 1) % phi) + 1, b = ((B.value - 1) % phi) + 1, ab = (a * b) % p;
          L.setView([-1, phi], [0, p]); Rg.setView([0, p], [-1, phi]);
          const full = idx.size === phi;
          pw.forEach((x, k) => L.dot(k, x, { r: 3.4, color: full ? 'blue' : 'red', alpha: 0.85 }));
          for (let u = 1; u < p; u++) { if (idx.has(u)) Rg.dot(u, idx.get(u), { r: 3.4, color: 'blue', alpha: 0.85 }); else Rg.dot(u, 0, { r: 3.2, color: 'faint', hollow: true }); }
          const mark = (u, col, lab) => { if (idx.has(u)) { const k = idx.get(u); L.dot(k, u, { r: 7, color: col }); Rg.dot(u, k, { r: 7, color: col, label: lab, labelPos: 'ne' }); L.vline(k, { color: col, alpha: 0.25 }); Rg.hline(k, { color: col, alpha: 0.3 }); } };
          mark(a % p, 'orange', 'a'); mark(b % p, 'purple', 'b'); mark(ab, 'green', 'ab');
          info = { p, g, phi, full, a: a % p, b: b % p, ab, ia: idx.get(a % p), ib: idx.get(b % p), iab: idx.get(ab), nrep: phi - idx.size };
        });
        v.readout(() => {
          const { p, g, phi, full, a, b, ab, ia, ib, iab, nrep } = info;
          if (!full) return `$g=${g}$ has order ${ord(g, p)} < ${phi}: only ${phi - nrep} of the $${phi}$ units are powers of $g$ (grey: no index exists). Not a bijection.`;
          return `$p=${p}$, $g=${g}$ (order ${phi}). $\\operatorname{ind}(${a})=${ia}$, $\\operatorname{ind}(${b})=${ib}$, $${a}\\cdot${b}\\equiv${ab}$ with $\\operatorname{ind}(${ab})=${iab}$; and $${ia}+${ib}=${ia + ib}\\equiv${(ia + ib) % phi}\\pmod{${phi}}$ — **${(ia + ib) % phi === iab}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Period of the decimal expansion of 1/p',
      statement: String.raw`Let $d\ge2$ and write $d=2^a5^bd'$ with $\gcd(d',10)=1$. The decimal expansion of $1/d$ is eventually periodic: its pre-period has length $\max(a,b)$ and its minimal period is $\operatorname{ord}_{d'}(10)$ (equal to $1$ when $d'=1$, where the expansion terminates). In particular for a prime $p\ne2,5$ the period of $1/p$ is $\operatorname{ord}_p(10)$, a divisor of $p-1$, and equals the maximum $p-1$ exactly when $10$ is a primitive root modulo $p$.`,
      idea: String.raw`Long division produces the remainders $r_0=1$, $r_k\equiv10\,r_{k-1}\pmod d$, so $r_k\equiv10^k\pmod d$, and the digits are determined by the remainders; the expansion repeats the first time a remainder repeats. When $\gcd(d,10)=1$ the remainders return to $1$ precisely after $\operatorname{ord}_d(10)$ steps (3.1), so the period is the order. Factors $2^a5^b$ of the denominator delay the start of the cycle by $\max(a,b)$ steps.`,
      caption: String.raw`Slide $d$. On the clock, arrows go from each remainder to the next ($r\mapsto10r\bmod d$), starting at $1$; the grid on the right writes the digits, grey before the cycle and coloured inside it. Choose $d=7$: the six remainders form one full cycle (a primitive root) while for $d=13$ the cycle has only 6 of the 12 units and $1/13=0.\overline{076923}$. Prime $d$ with a full cycle are marked in the readout.`,
      deps: ['nt-3.1'],
      refs: ['Hardy–Wright §9.6'],
      tags: ['decimals', 'order'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Repeating_decimal' },
      viz(v) {
        const D = v.slider('denominator $d$', 2, 100, 7, { int: true });
        const C = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: 360, title: 'remainders: $r\\mapsto 10r \\bmod d$' });
        const T = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 360, title: 'the digits of $1/d$' });
        let info = {};
        v.render(() => {
          const d = D.value;
          const rems = [1 % d], digs = [], first = new Map([[1 % d, 0]]); let r = 1 % d, mu = 0, per = 0;
          for (let k = 1; k < 3 * d + 5; k++) { digs.push(Math.floor((10 * r) / d)); r = (10 * r) % d; if (first.has(r)) { mu = first.get(r); per = k - mu; break; } first.set(r, k); rems.push(r); }
          if (r === 0 && per === 0) { mu = digs.length; per = 1; }
          drawClock(C, d, { R: 1, labels: d <= 36, color: (k) => (first.has(k) && first.get(k) >= mu ? 'blue' : first.has(k) ? 'orange' : 'faint'), dim: (k) => !first.has(k) });
          for (let k = 0; k < rems.length; k++) { const nx = k + 1 < rems.length ? rems[k + 1] : rems[mu]; clockArrow(C, rems[k], nx, d, { color: k >= mu ? 'gold' : 'orange', width: 2, alpha: 0.9, shrink: 0.04 }); }
          const [x0, y0] = clockXY(1 % d, d, 1); C.dot(x0, y0, { r: 10, hollow: true, color: 'green', width: 2.2 });
          // digit grid
          const total = Math.min(160, mu + 2 * per + (per === 1 && mu === digs.length ? 0 : 0));
          const shown = []; for (let k = 0; k < total; k++) { if (k < digs.length) shown.push(digs[k]); else { shown.push(digs[mu + ((k - mu) % per)]); } }
          T.setView([0, T.width], [0, T.height]);
          const cols = Math.min(Math.max(1, shown.length), 12), rows = Math.ceil(shown.length / cols), cs = Math.min(52, (T.width - 20) / cols, (T.height - 20) / rows);
          const gx = (T.width - cols * cs) / 2, gy = (T.height - rows * cs) / 2;
          shown.forEach((dg, i) => { const c = i % cols, rr = Math.floor(i / cols); const x1 = gx + c * cs, y2 = T.height - gy - rr * cs, y1 = y2 - cs, x2 = x1 + cs; const inCycle = i >= mu; const cyc = inCycle ? (i - mu) % per : -1; const second = inCycle && i - mu >= per; T.rect(x1 + 1, y1 + 1, x2 - 1, y2 - 1, { fill: inCycle ? pcol(cyc) : 'faint', fillAlpha: inCycle ? (second ? 0.18 : 0.5) : 0.15, stroke: false }); if (cs >= 13) T.text(String(dg), (x1 + x2) / 2, (y1 + y2) / 2, { align: 'center', baseline: 'middle', size: Math.min(18, cs * 0.55), weight: 700, color: second ? 'muted' : 'ink' }); });
          let d2 = d; let a2 = 0, a5 = 0; while (d2 % 2 === 0) { d2 /= 2; a2++; } while (d2 % 5 === 0) { d2 /= 5; a5++; }
          const o = d2 === 1 ? 1 : ord(10, d2);
          info = { d, mu, per, pre: Math.max(a2, a5), o, d2, prime: isPrime(d), digs: digs.slice(0, mu + per) };
        });
        v.readout(() => {
          const { d, mu, per, pre, o, d2, prime, digs } = info;
          const rep = digs.slice(0, mu).join('') + (per ? '\\overline{' + digs.slice(mu).join('') + '}' : '');
          const full = []; for (let p = 3; p <= 100; p++) if (isPrime(p) && p !== 5 && ord(10, p) === p - 1) full.push(p);
          return `$1/${d}=0.${d2 === 1 ? digs.join('') : rep}$: pre-period ${mu} (predicted $\\max(a,b)=${pre}$), period ${d2 === 1 ? 'none (terminates)' : per} (predicted $\\operatorname{ord}_{${d2}}(10)=${o}$)${prime && d !== 2 && d !== 5 ? `; ${per === d - 1 ? '**full period $p-1$**: 10 is a primitive root' : `period $${per}<p-1=${d - 1}$`}` : ''}.\nPrimes below 100 with full period $p-1$: $${full.join(', ')}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Constructibility of the regular 17-gon',
      statement: String.raw`The regular 17-gon can be constructed with ruler and compass. Equivalently $\cos(2\pi/17)$ is obtained from rational numbers by finitely many field operations and square roots: with $\zeta=e^{2\pi i/17}$ and the primitive root $g=3$, the *Gauss periods* $\eta=\sum_{i\equiv r\ (2^L)}\zeta^{3^i}$ ($0\le i<16$, level $L=0,\dots,4$) are obtained by successively solving quadratic equations, starting from $\eta_0+\eta_1=-1$, $\eta_0\eta_1=-4$.`,
      idea: String.raw`The Galois-type structure is the cyclic group $(\Z/17\Z)^\times$ of order $16=2^4$ (3.2): the primitive root $3$ lets us order the $16$ nontrivial roots $\zeta^{3^i}$ and split them into the even-indexed and odd-indexed ones, then into classes mod $4$, mod $8$ and finally singletons. Each split halves a class sum $\eta$ into two sub-sums that are the roots of a quadratic $x^2-\eta x+\pi=0$ whose coefficients lie in the previous level. Square roots are constructible, so $2\cos(2\pi/17)$ is. The only primes for which this halving works for $\Z/p$ are those with $p-1$ a power of $2$, which is where Fermat primes (and nt-1.11 on Fermat numbers) enter.`,
      caption: String.raw`Mode *Gauss periods*: the slider sets the level; vertices of one colour belong to the same period (labels are the exponents $3^i \bmod 17$). On the right every period is placed at its real value, joined to the two sub-periods it splits into; the readout shows that the two children add up to the parent and gives their product. Mode *construction* steps through Richmond's ruler-and-compass construction, computed here with exact coordinates: the length $OH$ ends up equal to $\cos(6\pi/17)$.`,
      deps: ['nt-3.2', 'nt-1.11'],
      refs: ['Hardy–Wright §5.8'],
      tags: ['constructible', 'cyclotomy', 'Gauss'],
      credit: 'Gauss, 1796 (constructibility, published in the Disquisitiones arithmeticae, 1801); construction after H. W. Richmond, 1893',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heptadecagon' },
      viz(v) {
        const MODE = v.select('view', [{ value: 'periods', label: 'Gauss periods' }, { value: 'build', label: 'ruler-and-compass construction' }], 'periods');
        const LV = v.slider('split level $L$', 0, 4, 1, { int: true });
        const ST = v.slider('construction step', 0, 8, 8, { int: true });
        const C = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 400, title: 'the 17th roots of unity' });
        const T = v.stage({ x: [-3.5, 2.5], y: [-0.6, 4.6], axes: 'box', gutter: true, height: 400, xlabel: 'real part of the period', ylabel: 'level $L$', title: 'splitting the periods (real parts)' });
        const g = 3, expo = [1]; for (let i = 1; i < 16; i++) expo.push((expo[i - 1] * g) % 17);
        const zr = (j) => Math.cos((2 * Math.PI * j) / 17), zi = (j) => Math.sin((2 * Math.PI * j) / 17);
        const period = (cls, L) => { let re = 0, im = 0; for (let i = 0; i < 16; i++) if (i % (1 << L) === cls) { re += zr(expo[i]); im += zi(expo[i]); } return [re, im]; };
        // Richmond construction coordinates
        const J = [0, 0.25];
        const angOJA = Math.atan2(1, 0.25); // angle at J between JO (pointing down) and JA: tan = OA/OJ
        const aE = angOJA / 4, E = [0.25 * Math.tan(aE), 0], F = [-0.25 * Math.tan(Math.PI / 4 - aE), 0];
        const cK = (1 + F[0]) / 2, rK = (1 - F[0]) / 2, K = [0, Math.sqrt(rK * rK - cK * cK)];
        const RR = Math.hypot(K[0] - E[0], K[1] - E[1]), Gp = [E[0] - RR, 0], Hp = [E[0] + RR, 0];
        const P5 = [Gp[0], Math.sqrt(1 - Gp[0] ** 2)], P3 = [Hp[0], Math.sqrt(1 - Hp[0] ** 2)];
        const mid = [P3[0] + P5[0], P3[1] + P5[1]], ml = Math.hypot(...mid), P4 = [mid[0] / ml, mid[1] / ml];
        const STEPS = ['circle, radii OA and OB', 'J on OB with OJ = OB/4', 'E on OA with ∠OJE = ¼∠OJA', 'F on OA with ∠EJF = 45°', 'circle on diameter AF meets OB at K', 'circle centre E through K meets OA at G, H', 'perpendiculars at G, H meet the circle at P₅, P₃', 'bisect arc P₃P₅ to get P₄', 'step the chord P₃P₄ around the circle'];
        let info = {};
        v.render(() => {
          const build = MODE.value === 'build';
          C.setTitle(build ? 'Richmond’s construction of the regular 17-gon' : 'the 17th roots of unity, coloured by period');
          T.el.style.display = build ? 'none' : '';
          LV.el.hidden = build; ST.el.hidden = !build;
          C.circle(0, 0, 1, { color: 'grid', width: 1.4 });
          if (!build) {
            const L = LV.value, K2 = 1 << L;
            for (let i = 0; i < 16; i++) { const j = expo[i]; C.dot(zr(j), zi(j), { r: 6, color: pcol(i % K2), label: String(j), labelPos: 'n' }); }
            C.dot(1, 0, { r: 6, color: 'ink' });
            for (let c = 0; c < K2 && L > 0; c++) { const mem = []; for (let i = 0; i < 16; i++) if (i % K2 === c) mem.push(expo[i]); if (L <= 3 && K2 >= 2) { const [pr, pi] = period(c, L); C.arrow(0, 0, pr * 0.25, pi * 0.25, { color: pcol(c), width: 2, head: 6 }); } }
            C.text('period vectors drawn at ¼ size', 0, -1.22, { align: 'center', size: 11, color: 'muted' });
            // tree
            const rank3 = new Map(Array.from({ length: 8 }, (_, c) => [c, period(c, 3)[0]]).sort((p, q) => p[1] - q[1]).map(([c], i) => [c, i]));
            for (let l = 0; l <= 3; l++) for (let c = 0; c < 1 << l; c++) {
              const [re] = period(c, l); T.dot(re, 3.9 - l, { r: 6, color: pcol(c) });
              if (l < 3) for (const c2 of [c, c + (1 << l)]) { const [re2] = period(c2, l + 1); T.line(re, 3.9 - l, re2, 3.9 - l - 1, { color: 'faint', width: 1 }); }
              T.text(v.fix(re, 3), re, 3.9 - l + (l === 3 && rank3.get(c) % 2 ? -0.3 : 0.28), { align: 'center', size: 10, color: 'muted' });
            }
            T.setTicks(null, [[3.9, '0'], [2.9, '1'], [1.9, '2'], [0.9, '3']]);
            const Lc = Math.min(L, 4);
            let msg;
            if (Lc === 0) { const [a] = period(0, 1), [b] = period(1, 1); msg = `$\\eta_0+\\eta_1=${v.fix(a + b, 4)}$, $\\eta_0\\eta_1=${v.fix(a * b, 4)}$: roots of $x^2+x-4$, i.e. $(-1\\pm\\sqrt{17})/2$ = ${v.fix((-1 + Math.sqrt(17)) / 2, 4)}, ${v.fix((-1 - Math.sqrt(17)) / 2, 4)}.`; }
            else if (Lc < 4) { const [s0] = period(0, Lc - 1), [s1] = period(0, Lc), [s2] = period(1 << (Lc - 1), Lc); msg = `Level ${Lc - 1} period $${v.fix(s0, 4)}$ splits into $${v.fix(s1, 4)}$ and $${v.fix(s2, 4)}$: sum $${v.fix(s1 + s2, 4)}$, product $${v.fix(s1 * s2, 4)}$ — roots of $x^2-(${v.fix(s0, 4)})x+(${v.fix(s1 * s2, 4)})$.`; }
            else msg = `Level 4: each class is a single root $\\zeta^{j}$; the last split solves $x^2-\\eta x+1=0$ with $\\eta=2\\cos(2\\pi j/17)$, giving the pair $\\zeta^{\\pm j}$ (the roots $e^{\\pm i\\theta}$).`;
            info = { build, msg };
          } else {
            const s = ST.value;
            const pt = (P, lab, col = 'ink', pos = 'ne') => C.dot(P[0], P[1], { r: 5, color: col, label: lab, labelPos: pos });
            C.line(-1.3, 0, 1.3, 0, { color: 'grid', width: 1 }); C.line(0, -1.2, 0, 1.2, { color: 'grid', width: 1 });
            pt([0, 0], 'O', 'ink', 'sw'); pt([1, 0], 'A', 'ink', 'se'); pt([0, 1], 'B', 'ink', 'nw');
            if (s >= 1) pt(J, 'J', 'orange', 'ne');
            if (s >= 2) { C.line(J[0], J[1], 1, 0, { color: 'muted', width: 1.2 }); C.line(J[0], J[1], E[0], E[1], { color: 'orange', width: 1.6 }); pt(E, 'E', 'orange', 'se'); }
            if (s >= 3) { C.line(J[0], J[1], F[0], F[1], { color: 'orange', width: 1.6 }); pt(F, 'F', 'orange', 'sw'); }
            if (s >= 4) { C.circle((1 + F[0]) / 2, 0, (1 - F[0]) / 2, { color: 'teal', width: 1.4 }); pt(K, 'K', 'teal', 'ne'); }
            if (s >= 5) { C.circle(E[0], 0, RR, { color: 'purple', width: 1.4 }); pt(Gp, 'G', 'purple', 'sw'); pt(Hp, 'H', 'purple', 'se'); }
            if (s >= 6) { C.line(Gp[0], 0, P5[0], P5[1], { color: 'green', width: 1.4 }); C.line(Hp[0], 0, P3[0], P3[1], { color: 'green', width: 1.4 }); pt(P5, 'P₅', 'green', 'nw'); pt(P3, 'P₃', 'green', 'ne'); }
            if (s >= 7) { pt(P4, 'P₄', 'green', 'n'); }
            if (s >= 8) { const side = Math.hypot(P3[0] - P4[0], P3[1] - P4[1]); const pts = []; for (let k = 0; k < 17; k++) { const t = ((2 * Math.PI) / 17) * k; pts.push([Math.cos(t), Math.sin(t)]); } C.path([...pts, pts[0]], { color: 'blue', width: 2 }); pts.forEach((q) => C.dot(q[0], q[1], { r: 3.5, color: 'blue' })); info.side = side; }
            const ex = Math.max(Math.abs(Hp[0] - Math.cos((6 * Math.PI) / 17)), Math.abs(Gp[0] - Math.cos((10 * Math.PI) / 17)));
            info = { build, step: s, desc: STEPS[s], ex, side: Math.hypot(P3[0] - P4[0], P3[1] - P4[1]), chord: 2 * Math.sin(Math.PI / 17) };
          }
        });
        v.readout(() => {
          if (!info.build) return info.msg;
          return `Step ${info.step}: ${info.desc}.\n$OH=${v.fix(Hp[0], 10)}$ vs $\\cos(6\\pi/17)=${v.fix(Math.cos((6 * Math.PI) / 17), 10)}$, $OG=${v.fix(Gp[0], 10)}$ vs $\\cos(10\\pi/17)=${v.fix(Math.cos((10 * Math.PI) / 17), 10)}$ (error $${v.sci(info.ex, 2)}$); $|P_3P_4|=${v.fix(info.side, 8)}$ vs side $2\\sin(\\pi/17)=${v.fix(info.chord, 8)}$.`;
        });
      },
    },
  ],
};
