// Number Theory — Chapter 4: Quadratic residues and reciprocity
// Part 1 (this file): residues, the Legendre symbol, Euler's criterion, the two supplements, Gauss's lemma (4.1–4.5).
// Part 2 (ch04-b.js): reciprocity, Zolotarev, Jacobi, the two algorithms (4.6–4.10).
// Part 3 (ch04-c.js): Gauss sums, reciprocity from Gauss sums, conics, the Disquisitiones (4.11–4.15).
import { mod, gcd, powmod, isPrime, drawClock, clockXY, clockArrow, nearOddPrime, legendre, squaresMod, sym, totient } from './ch04.shared.js';

export default {
  collection: 'nt',
  chapter: 4,
  title: 'Quadratic residues and reciprocity',
  summary: String.raw`Which numbers are squares modulo a prime? Euler’s criterion answers it for each number, Gauss’s lemma turns it into a count of residues that change sign, and the law of quadratic reciprocity links the question for $p$ modulo $q$ with $q$ modulo $p$. We prove the law by counting lattice points and again with Gauss sums, extend the symbol to the Jacobi symbol for fast computation, and find square roots modulo $p$ explicitly.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Quadratic residues and the Legendre symbol',
      statement: String.raw`Let $p$ be an odd prime. An integer $a$ with $p\nmid a$ is a *quadratic residue* modulo $p$ if $x^2\equiv a\pmod p$ has a solution, and a *quadratic non-residue* otherwise. The *Legendre symbol* is
$$\left(\frac ap\right)=\begin{cases}\ \ 1 & a \text{ a quadratic residue mod } p,\\ -1 & a \text{ a non-residue},\\ \ \ 0 & p\mid a.\end{cases}$$
Exactly $(p-1)/2$ of the $p-1$ non-zero classes are residues, and exactly $(p-1)/2$ are non-residues: each non-zero square has precisely the two square roots $\pm x$. For a composite modulus this count fails.`,
      idea: String.raw`Squaring $x\mapsto x^2$ on the non-zero classes is two-to-one, because $x^2\equiv y^2$ means $p\mid(x-y)(x+y)$, and a prime divides one of the factors (Euclid's lemma, 1.6): $y=\pm x$. Since $x\ne-x$ for $p$ odd, the $p-1$ classes fall into $(p-1)/2$ pairs $\{x,-x\}$, each giving one square. The symbol is the sign-valued indicator of that set; multiplicativity $\left(\frac{ab}p\right)=\left(\frac ap\right)\left(\frac bp\right)$ will follow from Euler's criterion (4.2).`,
      caption: String.raw`Slide $p$ (it snaps to the nearest odd prime; with *composite* switched on it is used as it stands) and click a class $x$ on the clock: the gold arrow shows $x\mapsto x^2$ and the grey arrow $-x\mapsto x^2$ — two arrows into every square. Green dots are residues, red rings non-residues. The bar chart below gives the symbol $\left(\frac ap\right)$ for every $a$. For a composite modulus such as $15$ or $21$ the squares are no longer half of the units and the two-to-one pattern breaks.`,
      deps: ['nt-2.3', 'nt-1.5'],
      refs: ['Hardy–Wright §6.5', 'Apostol §9.2'],
      tags: ['quadratic residue', 'Legendre symbol'],
      credit: 'Legendre, Essai sur la théorie des nombres, 1798 (the symbol); the notion goes back to Euler and Fermat',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Legendre_symbol' },
      viz(v) {
        const P = v.slider('modulus $p$', 3, 61, 13, { int: true });
        const comp = v.toggle('composite', false);
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.55, 1.55], equal: true, axes: false, height: 340, title: 'the squaring map on the clock' });
        const B = v.stage({ x: [0, 62], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 340, xlabel: '$a$', ylabel: '$\\left(\\frac{a}{p}\\right)$', title: 'the Legendre symbol (or: is $a$ a square?)' });
        let sel = 3, info = {};
        C.onClick((x, y) => { const n = info.n; if (!n) return; let best = -1, bd = 1e9; for (let k = 0; k < n; k++) { const [px, py] = clockXY(k, n, 1); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = k; } } if (bd < 0.25) sel = best; });
        v.render(() => {
          const n = comp.value ? P.value : nearOddPrime(P.value, 3, 61);
          const sq = squaresMod(n), units = []; for (let a = 1; a < n; a++) if (gcd(a, n) === 1) units.push(a);
          const isUnitSq = (a) => sq.has(a % n);
          const nres = units.filter(isUnitSq).length;
          if (sel >= n) sel = n - 1;
          drawClock(C, n, { color: (k) => (k === 0 ? 'muted' : gcd(k, n) !== 1 ? 'faint' : isUnitSq(k) ? 'green' : 'red'), dim: (k) => gcd(k, n) !== 1 && k !== 0 });
          for (let k = 1; k < n; k++) if (gcd(k, n) === 1 && !isUnitSq(k)) { const [x, y] = clockXY(k, n, 1); C.dot(x, y, { r: n <= 24 ? 8 : 5, hollow: true, color: 'red', width: 1.6 }); }
          const t = (sel * sel) % n;
          if (sel > 0) {
            clockArrow(C, sel, t, n, { color: 'gold', width: 2.4, shrink: 0.07 });
            if (n - sel !== sel) clockArrow(C, n - sel, t, n, { color: 'muted', width: 1.8, shrink: 0.07 });
            C.text(`${sel}² ≡ ${t}`, 0, 0.32, { align: 'center', size: 15, weight: 700, color: 'ink' });
            C.text(`(−${sel})² = (${n - sel})² ≡ ${t}`, 0, 0.16, { align: 'center', size: 11.5, color: 'muted' });
          }
          B.setView([0, n], [-1.7, 1.7]);
          B.setTicks(null, [[-1, '−1'], [0, '0'], [1, '1']]);
          for (let a = 1; a < n; a++) {
            const u = gcd(a, n) === 1, s = isUnitSq(a) ? 1 : -1;
            if (!u) { B.rect(a - 0.35, -0.04, a + 0.35, 0.04, { fill: 'faint', color: 'faint' }); continue; }
            B.rect(a - 0.38, 0, a + 0.38, s, { fill: s > 0 ? 'green' : 'red', fillAlpha: a === sel ? 0.85 : 0.45, color: s > 0 ? 'green' : 'red', width: a === sel ? 2.4 : 1 });
          }
          info = { n, nres, units: units.length, prime: isPrime(n) };
        });
        v.readout(() => {
          const { n, nres, units, prime } = info;
          if (prime) return `$p=${n}$: **${nres}** non-zero squares and **${units - nres}** non-squares, exactly $(p-1)/2=${(n - 1) / 2}$ each. Example: $\\left(\\frac{${sel}}{${n}}\\right)=${legendre(sel, n)}$.`;
          return `$n=${n}$ is **not prime**: of its ${units} units only **${nres}** are squares (a prime would give ${(n - 1) / 2}); the grey classes are not units. The Legendre symbol is defined only for primes.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Euler’s criterion',
      statement: String.raw`Let $p$ be an odd prime and $p\nmid a$. Then
$$a^{(p-1)/2}\equiv\left(\frac ap\right)\pmod p .$$
In particular $a^{(p-1)/2}\equiv\pm1$ always, the symbol is multiplicative, $\left(\frac{ab}p\right)=\left(\frac ap\right)\left(\frac bp\right)$, and $a$ is a residue exactly when $a^{(p-1)/2}\equiv1$. For a composite odd modulus $n$ the power $a^{(n-1)/2}$ need not be $\pm1$ at all.`,
      idea: String.raw`By Fermat's little theorem (2.5), $b=a^{(p-1)/2}$ satisfies $b^2\equiv1$, hence $b\equiv\pm1$ since $\Z/p\Z$ has no zero divisors. If $a\equiv x^2$ then $b\equiv x^{p-1}\equiv1$. So the $(p-1)/2$ residues are roots of $y^{(p-1)/2}-1$, and Lagrange's theorem (2.12) says that polynomial has at most $(p-1)/2$ roots; these are therefore all of its roots, and every non-residue must give $b\equiv-1$. (With a primitive root $g$ (3.2): $a=g^k$ is a square iff $k$ is even, and $g^{k(p-1)/2}=(-1)^k$.)`,
      caption: String.raw`Choose a modulus (nearest odd prime, or nearest odd integer in composite mode) and an integer $a$, reduced modulo it. A multiple of $p$ is shown as zero and explicitly excluded from the nonzero hypothesis. The first panel plots $a^{(p-1)/2}$ reduced to $(-p/2,p/2]$ for every unit $a$: for a prime the bars sit at $\pm1$ and their colour (green square, red non-square) is decided independently by brute-force squaring. The second panel lists the repeated squarings $a,a^2,a^4,\dots$ and the product that builds the exponent $(p-1)/2$. Tick *composite* and use $n=15$ or $21$: the unit powers can differ from the prime criterion; squares still necessarily give Jacobi symbol $+1$ when coprime, but that condition is not sufficient.`,
      deps: ['nt-4.1', 'nt-3.2', 'nt-2.5', 'nt-2.12'],
      refs: ['Lee–Kumar, MIT 18.781 (2012), Lecture 9, Lemma 39, pp.1–2'],
      tags: ['Euler', 'quadratic residue', 'fast power'],
      links: { source: 'https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/d5cdd1b802194a2a236eed934da8ae36_MIT18_781S12_lec9.pdf#page=1' },
      viz(v) {
        const P = v.slider('modulus $p$', 3, 61, 23, { int: true });
        const A = v.slider('$a$', 1, 60, 5, { int: true });
        const comp = v.toggle('composite', false);
        const B = v.stage({ x: [0, 62], y: [-5, 5], axes: 'box', gutter: true, height: 320, xlabel: '$a$', ylabel: '$a^{(n-1)/2}$ mod $n$', title: 'Euler’s power for every $a$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'repeated squaring for the chosen $a$' });
        let info = {};
        B.onClick((x) => { const a = Math.round(x); if (a >= 1 && a < info.n) A.set(a); });
        v.render(() => {
          const n = comp.value ? (P.value % 2 ? P.value : P.value + 1) : nearOddPrime(P.value, 3, 61);
          const a = mod(A.value, n), e = (n - 1) / 2, sq = squaresMod(n);
          const lim = isPrime(n) ? 2.2 : Math.ceil(n / 2) + 1;
          B.setView([0, n], [-lim, lim]); B.setTicks(null, isPrime(n) || n <= 23 ? [[-1, '−1'], [0, '0'], [1, '1']] : [[-1, '−1'], [1, '1']]);
          let allPm = true, agree = true;
          for (let b = 1; b < n; b++) {
            if (gcd(b, n) !== 1) continue;
            const val = sym(powmod(b, e, n), n), isSq = sq.has((b) % n);
            if (Math.abs(val) !== 1) allPm = false;
            if (val !== (isSq ? 1 : -1)) agree = false;
            const col = isSq ? 'green' : 'red';
            B.rect(b - 0.38, 0, b + 0.38, val, { fill: col, fillAlpha: b === a ? 0.85 : 0.4, color: col, width: b === a ? 2.4 : 1 });
          }
          B.hline(1, { color: 'faint', dash: true }); B.hline(-1, { color: 'faint', dash: true });
          // squaring ladder
          const bits = []; let ee = e; while (ee > 0) { bits.push(ee & 1); ee >>= 1; }
          const rows = []; let sqv = a % n, acc = 1 % n;
          bits.forEach((bit, i) => { rows.push({ i, sq: sqv, bit, acc: bit ? (acc = (acc * sqv) % n) : acc }); sqv = (sqv * sqv) % n; });
          R.setView([0, 1], [0, 1]);
          R.text(`exponent (n−1)/2 = ${e} = ${bits.slice().reverse().join('')}₂`, 0.03, 0.94, { size: 13, weight: 700, color: 'ink' });
          const rh = Math.min(0.12, 0.8 / Math.max(rows.length, 1));
          rows.forEach((r, i) => {
            const y = 0.82 - i * rh;
            R.text(`a^${2 ** i} ≡ ${r.sq}`, 0.03, y, { size: 12.5, color: r.bit ? 'blue' : 'muted', weight: r.bit ? 700 : 500 });
            R.text(r.bit ? `× in  → product ${r.acc}` : 'skip', 0.52, y, { size: 12.5, color: r.bit ? 'gold' : 'faint' });
          });
          const fin = sym(acc, n);
          R.text(`a^${e} ≡ ${acc} ${fin !== acc ? `≡ ${fin}` : ''}`, 0.03, 0.82 - rows.length * rh - 0.03, { size: 15, weight: 700, color: Math.abs(fin) === 1 ? 'green' : 'red' });
          info = { n, a, e, val: acc, allPm, agree, isSq: sq.has(a), g: gcd(a, n) };
        });
        v.readout(() => {
          const { n, a, e, val, allPm, agree, isSq, g } = info;
          if (isPrime(n) && a === 0) return `Selected integer ${A.value} is divisible by $p=${n}$: the theorem's nonzero hypothesis fails. The displayed power is zero, and the extended Legendre symbol is zero.`;
          if (isPrime(n)) return `$${a}^{${e}}\\equiv${sym(val, n)}\\pmod{${n}}$ and $${a}$ ${isSq ? 'is' : 'is not'} a square — the criterion agrees: **${agree}**; every nonzero residue power was $\\pm1$: **${allPm}**.`;
          return `$n=${n}$ is composite: $${a}^{${e}}\\equiv${val}\\pmod{${n}}$; all unit powers are $\\pm1$: **${allPm}**; the sign tells whether $a$ is a square: **${agree}**.${g > 1 ? ` ($\\gcd(${a},${n})=${g}$.)` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'First supplement: −1 is a square iff p ≡ 1 (mod 4)',
      statement: String.raw`For an odd prime $p$,
$$\left(\frac{-1}p\right)=(-1)^{(p-1)/2}=\begin{cases}1&p\equiv1\pmod 4,\\-1&p\equiv3\pmod 4.\end{cases}$$
When $p\equiv1\pmod4$ an explicit solution of $x^2\equiv-1$ is $x=\left(\frac{p-1}2\right)!$.`,
      idea: String.raw`Put $a=-1$ in Euler's criterion (4.2): $(-1)^{(p-1)/2}\equiv\left(\frac{-1}p\right)$, and both sides are $\pm1$, so they are equal as integers. For the explicit root use Wilson's theorem: $(p-1)!\equiv-1$ and pairing $k$ with $p-k\equiv-k$ gives $(p-1)!\equiv(-1)^{(p-1)/2}\big(\tfrac{p-1}2!\big)^2$. When $(p-1)/2$ is even, this says $\big(\tfrac{p-1}2!\big)^2\equiv-1$.`,
      caption: String.raw`Left: the odd primes below 130 in two columns by residue mod 4; a prime is green when brute-force search finds some $x$ with $x^2\equiv-1$ — it is green exactly in the $1\pmod4$ column. Click a prime. Right: its clock, with $-1\equiv p-1$ marked; the gold dots are the solutions of $x^2\equiv-1$ (there are two when they exist) and the readout tests Wilson's candidate $\left(\frac{p-1}2\right)!$, which works precisely in the first column.`,
      deps: ['nt-4.2'],
      refs: ['Apostol §9.3', 'Hardy–Wright §6.5'],
      tags: ['quadratic residue', 'Wilson', 'Euler'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quadratic_residue#Prime_modulus' },
      viz(v) {
        const L = v.stage({ x: [0.3, 2.7], y: [0, 1], axes: false, height: 400, title: 'odd primes < 130, by $p \\bmod 4$' });
        const K = v.stage({ x: [-1.7, 1.7], y: [-1.6, 1.6], equal: true, axes: false, height: 400, title: 'the clock mod $p$' });
        const primes = []; for (let p = 3; p < 130; p++) if (isPrime(p)) primes.push(p);
        let sel = 13, cells = [];
        L.onClick((x, y) => { for (const c of cells) if (Math.abs(x - c.x) < 0.45 && Math.abs(y - c.y) < c.h * 0.5) { sel = c.p; v.invalidate(); return; } });
        const roots = (p) => { const r = []; for (let x = 1; x < p; x++) if ((x * x) % p === p - 1) r.push(x); return r; };
        let info = {};
        v.render(() => {
          const col1 = primes.filter((p) => p % 4 === 1), col3 = primes.filter((p) => p % 4 === 3);
          const rows = Math.max(col1.length, col3.length), h = 0.9 / rows;
          cells = [];
          L.text('p ≡ 1 (mod 4)', 1, 0.985, { align: 'center', size: 13, weight: 700, color: 'green' });
          L.text('p ≡ 3 (mod 4)', 2, 0.985, { align: 'center', size: 13, weight: 700, color: 'red' });
          [[col1, 1], [col3, 2]].forEach(([arr, cx]) => arr.forEach((p, i) => {
            const y = 0.93 - (i + 0.5) * h, ok = roots(p).length > 0;
            cells.push({ x: cx, y, p, h });
            L.rect(cx - 0.42, y - h * 0.46, cx + 0.42, y + h * 0.46, { fill: ok ? 'green' : 'red', fillAlpha: p === sel ? 0.75 : 0.28, color: p === sel ? 'ink' : ok ? 'green' : 'red', width: p === sel ? 2.2 : 0.8 });
            L.text(String(p), cx, y, { align: 'center', baseline: 'middle', size: Math.min(12, h * 300), weight: p === sel ? 700 : 500, color: 'ink' });
          }));
          const p = sel, r = roots(p), half = (p - 1) / 2;
          drawClock(K, p, { color: (k) => (k === p - 1 ? 'red' : r.includes(k) ? 'gold' : 'blue'), r: p <= 30 ? 5 : 3.2, labels: p <= 31 });
          const [mx, my] = clockXY(p - 1, p, 1); K.dot(mx, my, { r: 10, hollow: true, color: 'red', width: 2.4 });
          r.forEach((x) => { const [px, py] = clockXY(x, p, 1); K.dot(px, py, { r: 9, hollow: true, color: 'gold', width: 2.4 }); });
          K.text(r.length ? `x² ≡ −1: x = ${r.join(', ')}` : 'no x with x² ≡ −1', 0, 0.05, { align: 'center', size: 14, weight: 700, color: r.length ? 'gold' : 'red' });
          let f = 1; for (let k = 2; k <= half; k++) f = (f * k) % p;
          info = { p, half, f, f2: (f * f) % p, has: r.length > 0 };
        });
        v.readout(() => {
          const { p, half, f, f2, has } = info;
          return `$p=${p}\\equiv${p % 4}\\pmod 4$: $x^2\\equiv-1$ is solvable: **${has}**. Wilson's candidate $\\left(\\frac{${p - 1}}2\\right)!=${half}!\\equiv${f}$ has square $\\equiv${f2}$ ${f2 === p - 1 ? '$=-1$ ✓' : '$=+1$, no help'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Lemma',
      name: 'Gauss’s lemma',
      statement: String.raw`Let $p$ be an odd prime and $p\nmid a$. Reduce each of $a,2a,\dots,\tfrac{p-1}2a$ to the symmetric range $(-p/2,p/2)$, and let $\mu$ be the number of results that are **negative**. Then
$$\left(\frac ap\right)=(-1)^{\mu}.$$
Moreover the absolute values of the reduced multiples are exactly the numbers $1,2,\dots,\tfrac{p-1}2$, each once.`,
      idea: String.raw`If two reduced multiples had the same absolute value, then $ja\equiv\pm ka$ forces $j\equiv\pm k$, impossible for distinct $j,k\le(p-1)/2$; so the absolute values are a permutation of $1,\dots,(p-1)/2$. Multiply all the reduced multiples: $a^{(p-1)/2}\left(\tfrac{p-1}2\right)!\equiv(-1)^\mu\left(\tfrac{p-1}2\right)!$. Cancel the factorial (it is a unit) and apply Euler's criterion (4.2).`,
      caption: String.raw`Choose $p$ (snapped to the nearest odd prime) and an integer $a$, reduced modulo $p$. Multiples of $p$ are explicitly outside the lemma: all reduced multiples then vanish and no permutation assertion applies. Top: the number line $(-p/2,p/2)$ with the reduced multiples $ka$ labelled by $k$; blue ones are positive, red ones negative — count the red. Bottom: $|ka \bmod p|$ plotted against $k$: the heights are a permutation of $1,\dots,(p-1)/2$ (each level is used once). Move $a$ and the picture reshuffles, but the parity of the red count always matches $\left(\frac ap\right)$.`,
      deps: ['nt-4.1', 'nt-4.2'],
      refs: ['Lee–Kumar, MIT 18.781 (2012), Lecture 9, Lemma 40, pp.2–3'],
      tags: ['Gauss', 'quadratic residue', 'reciprocity'],
      links: { source: 'https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/d5cdd1b802194a2a236eed934da8ae36_MIT18_781S12_lec9.pdf#page=2' },
      viz(v) {
        const P = v.slider('prime $p$', 5, 61, 17, { int: true });
        const A = v.slider('$a$', 1, 120, 5, { int: true });
        const N = v.stage({ x: [-31, 31], y: [-1.4, 1.6], axes: false, height: 200, title: 'reduced multiples $ka$ on $(-p/2,\\,p/2)$' });
        const B = v.stage({ x: [0, 31], y: [0, 31], axes: 'box', gutter: true, height: 280, xlabel: '$k$', ylabel: '$|ka \\bmod p|$' });
        let info = {};
        v.render(() => {
          const p = nearOddPrime(P.value, 5, 61), a = mod(A.value, p), h = (p - 1) / 2;
          N.setView([-p / 2 - 1, p / 2 + 1], [-1.5, 1.7]);
          N.line(-p / 2, 0, p / 2, 0, { color: 'ink', width: 1.5 });
          for (let t = -h; t <= h; t++) { N.line(t, -0.06, t, 0.06, { color: 'muted' }); if (p <= 31 || t % 5 === 0) N.text(String(t), t, -0.25, { align: 'center', size: 10, color: 'muted' }); }
          N.vline(0, { color: 'muted', dash: true });
          B.setView([0, h + 1], [0, h + 1]);
          let mu = 0; const abs = [];
          const stack = new Map();
          for (let k = 1; k <= h; k++) {
            const r = sym(k * a, p), neg = r < 0; if (neg) mu++; abs.push(Math.abs(r));
            const lvl = (stack.get(r) || 0); stack.set(r, lvl + 1);
            N.dot(r, 0.35 + 0.0 * lvl, { r: 7, color: r === 0 ? 'muted' : neg ? 'red' : 'blue', label: String(k), labelPos: 'n' });
            B.rect(k - 0.4, 0, k + 0.4, Math.abs(r), { fill: neg ? 'red' : 'blue', fillAlpha: 0.45, color: r === 0 ? 'muted' : neg ? 'red' : 'blue' });
          }
          B.hline(h, { color: 'faint', dash: true });
          const perm = [...abs].sort((x, y) => x - y).every((x, i) => x === i + 1);
          info = { p, a, mu, perm, leg: legendre(a, p) };
        });
        v.legend([['blue', '$ka \\bmod p > 0$', { dot: true }], ['red', '$ka \\bmod p < 0$', { dot: true }], ['muted', 'zero: excluded hypothesis', { dot: true }]]);
        v.readout(() => {
          const { p, a, mu, perm, leg } = info;
          if (a === 0) return `Selected integer ${A.value} is divisible by $p=${p}$: the nonzero hypothesis fails. All reduced multiples are zero; their absolute values are not a permutation, and the extended Legendre symbol is zero.`;
          return `$p=${p}$, $a=${a}$: **$\\mu=${mu}$** negative multiples, $(-1)^\\mu=${mu % 2 ? -1 : 1}$, and $\\left(\\frac{${a}}{${p}}\\right)=${leg}$. The absolute values are a permutation of $1..${(p - 1) / 2}$: **${perm}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Second supplement: the character of 2',
      statement: String.raw`For an odd prime $p$,
$$\left(\frac 2p\right)=(-1)^{(p^2-1)/8}=\begin{cases}\ \ 1&p\equiv\pm1\pmod 8,\\-1&p\equiv\pm3\pmod 8.\end{cases}$$
Equivalently $2$ is a square modulo $p$ exactly when $p\equiv1$ or $7\pmod 8$.`,
      idea: String.raw`Apply Gauss's lemma (4.4) with $a=2$: the multiples are $2,4,\dots,p-1$, and $2k$ reduces to a negative number exactly when $2k>p/2$, i.e. $k>p/4$. So $\mu=\tfrac{p-1}2-\lfloor p/4\rfloor$, and checking the four classes $p=8m\pm1,\ 8m\pm3$ gives $\mu$ even for $\pm1$ and odd for $\pm3$. Equivalently $\mu\equiv(p^2-1)/8\pmod 2$.`,
      caption: String.raw`Left: the doubles $2,4,\dots,p-1$ on the number line $(-p/2,p/2)$; the red ones (those that overshoot $p/2$) are counted. Right: every odd prime below 200 as a dot in the column of its residue mod 8, green when $2$ is a square mod $p$ (brute force); the columns $1$ and $7$ are entirely green, $3$ and $5$ entirely red. Click a prime to see its doubles.`,
      deps: ['nt-4.4'],
      refs: ['Hardy–Wright §6.11', 'Apostol §9.3'],
      tags: ['Gauss', 'quadratic residue', 'modular classes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quadratic_reciprocity#Supplements_to_Quadratic_Reciprocity' },
      viz(v) {
        const N = v.stage({ x: [-50, 50], y: [-1.4, 1.8], axes: false, height: 300, title: 'the doubles $2k$ on $(-p/2,\\,p/2)$' });
        const G = v.stage({ x: [0, 8], y: [-0.09, 1], axes: false, height: 300, title: 'odd primes < 200 by $p \\bmod 8$' });
        const primes = []; for (let p = 3; p < 200; p++) if (isPrime(p)) primes.push(p);
        let sel = 17, hits = [];
        G.onClick((x, y) => { let best = null, bd = 0.03; for (const c of hits) { const d = Math.hypot((c.x - x) / 8, (c.y - y)); if (d < bd) { bd = d; best = c.p; } } if (best) sel = best; });
        let info = {};
        v.render(() => {
          const p = sel, h = (p - 1) / 2;
          N.setView([-p / 2 - 1, p / 2 + 1], [-1.4, 2.2]);
          N.line(-p / 2, 0, p / 2, 0, { color: 'ink', width: 1.5 }); N.vline(0, { color: 'muted', dash: true });
          N.vline(-p / 4, { color: 'faint', dash: true }); N.vline(p / 4, { color: 'faint', dash: true });
          let mu = 0;
          for (let k = 1; k <= h; k++) {
            const r = sym(2 * k, p), neg = r < 0; if (neg) mu++;
            N.dot(r, 0.0, { r: p < 60 ? 6 : 4, color: neg ? 'red' : 'blue' });
            if (p < 60) N.text(String(2 * k), r, 0.55 + (k % 2) * 0.28, { align: 'center', size: 10, color: neg ? 'red' : 'blue' });
          }
          N.text('positive', p / 4, -0.7, { align: 'center', size: 11, color: 'muted' }); N.text('negative', -p / 2 + 3, -0.7, { align: 'center', size: 11, color: 'muted' });
          const cnt = [0, 0, 0, 0, 0, 0, 0, 0]; hits = [];
          const colH = 0.9;
          for (const q of primes) { const c = q % 8, i = cnt[c]++; const x = c + 0.5, y = 0.06 + (i / 8) * colH * 0.95 + 0.03; hits.push({ x, y, p: q }); const ok = legendre(2, q) === 1;
            G.dot(x, y, { r: q === sel ? 7.5 : 4.5, color: ok ? 'green' : 'red', hollow: q === sel }); }
          [1, 3, 5, 7].forEach((c) => G.text('≡ ' + c, c + 0.5, -0.05, { align: 'center', size: 12, weight: 700, color: c === 1 || c === 7 ? 'green' : 'red', baseline: 'middle' }));
          info = { p, mu, leg: legendre(2, p), pred: (p % 8 === 1 || p % 8 === 7) ? 1 : -1 };
        });
        v.readout(() => `$p=${info.p}\\equiv${info.p % 8}\\pmod 8$: ${info.mu} of the ${(info.p - 1) / 2} doubles are negative, so $\\left(\\frac 2p\\right)=(-1)^{${info.mu}}=${info.mu % 2 ? -1 : 1}$; brute force gives $${info.leg}$; the rule $p\\equiv\\pm1$ predicts $${info.pred}$.`);
      },
    },
  ],
};
