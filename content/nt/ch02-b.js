// Number Theory — Chapter 2: Congruences, part 2 (2.10–2.18): Gauss's identity, Wilson, Lagrange's root bound, Hensel,
// divisibility tests, Legendre's formula, Lucas, Kummer, Wolstenholme.
import { PAL, pcol, mod, gcd, powmod, isPrime, primeFactors, totient, divisors, inv, vp, digitsOf, clockXY, drawClock, pixGrid } from './ch02.shared.js';

export default {
  collection: 'nt',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Gauss’s identity Σ φ(d) = n',
      statement: String.raw`For every $n\ge1$,
$$\sum_{d\mid n}\varphi(d)=n .$$
More precisely, among the $n$ fractions $\tfrac1n,\tfrac2n,\dots,\tfrac nn$, exactly $\varphi(d)$ have reduced denominator $d$, for each divisor $d$ of $n$ (and no other denominators occur).`,
      idea: String.raw`Reduce $k/n$ to lowest terms $a/d$: then $d\mid n$ and $1\le a\le d$ with $\gcd(a,d)=1$. Conversely each divisor $d$ and each $a$ coprime to $d$ gives exactly one $k=an/d$. So the fractions with denominator $d$ are in bijection with a reduced residue system modulo $d$ and there are $\varphi(d)$ of them. Every one of the $n$ fractions has exactly one reduced denominator, so the groups partition the $n$ fractions.`,
      caption: String.raw`The $n$ fractions $k/n$ sit at the angles $2\pi k/n$ on the circle, each coloured by its reduced denominator. The bar chart gives, for every divisor $d$ of $n$, the number of points of that colour (bar) next to $\varphi(d)$ (ring marker) — they coincide, and the bars stack up to exactly $n$.`,
      deps: ['nt-2.7'],
      refs: ['Apostol §2.3'],
      tags: ['totient', 'fractions'],
      credit: 'Gauss, Disquisitiones arithmeticae, art. 39, 1801',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler%27s_totient_function#Divisor_sum' },
      viz(v) {
        const N = v.slider('$n$', 1, 120, 30, { int: true });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.6, 1.6], equal: true, axes: false, height: 380, title: 'the fractions $k/n$ on the circle, coloured by reduced denominator' });
        const B = v.stage({ x: [-1, 20], y: [0, 40], axes: 'box', gutter: true, height: 380, xlabel: 'divisor $d$ of $n$', ylabel: 'count', title: 'fractions with reduced denominator $d$ — bars versus $\\varphi(d)$ rings' });
        let info = {};
        v.render(() => {
          const n = N.value, ds = divisors(n), idx = new Map(ds.map((d, i) => [d, i]));
          const cnt = ds.map(() => 0);
          const small = n <= 36;
          C.circle(0, 0, 1, { color: 'grid', width: 1.2 });
          for (let k = 1; k <= n; k++) {
            const g = gcd(k, n), d = n / g, i = idx.get(d); cnt[i]++;
            const [x, y] = clockXY(k, n, 1);
            C.dot(x, y, { r: n <= 40 ? 6 : n <= 80 ? 4 : 3, color: pcol(i) });
            if (small) { const [lx, ly] = clockXY(k, n, 1.2); C.tex(d === 1 ? '1' : `\\tfrac{${k / g}}{${d}}`, lx, ly, { size: n <= 20 ? 12 : 9.5, color: pcol(i), align: 'center', baseline: 'middle' }); }
          }
          const rank = ds.length;
          B.setView([-0.7, rank - 0.3], [0, Math.max(...ds.map((d) => totient(d)), 2) * 1.2]);
          B.setTicks(ds.map((d, i) => [i, String(d)]), null);
          ds.forEach((d, i) => {
            B.rect(i - 0.33, 0, i + 0.33, cnt[i], { fill: pcol(i), fillAlpha: 0.55, color: pcol(i), width: 1.3 });
            B.dot(i, totient(d), { r: 6, hollow: true, color: 'ink', width: 2 });
          });
          info = { n, ds, cnt, ok: ds.every((d, i) => cnt[i] === totient(d)) };
        });
        v.readout(() => {
          const { n, ds, cnt, ok } = info;
          return `$n=${n}$, divisors $${ds.join(', ')}$. Counts per denominator: ${ds.map((d, i) => `$d=${d}$: ${cnt[i]}`).join(' · ')}. ${ok ? 'Each equals $\\varphi(d)$' : '**MISMATCH**'}, and $\\sum_{d\\mid n}\\varphi(d)=${ds.map((d) => totient(d)).join('+')}=${ds.reduce((s, d) => s + totient(d), 0)}=n$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Wilson’s theorem',
      statement: String.raw`For every prime $p$,
$$(p-1)!\equiv-1\pmod p .$$
Conversely, if $n>1$ and $(n-1)!\equiv-1\pmod n$, then $n$ is prime; so $n$ is prime exactly when $n\mid(n-1)!+1$. For composite $n>4$ one has in fact $(n-1)!\equiv0\pmod n$, and $3!\equiv2\pmod4$.`,
      idea: String.raw`Modulo a prime every nonzero residue $u$ is a unit, with a unique inverse $u^{-1}$ in $\{1,\dots,p-1\}$ (2.2). Pair up each $u$ with $u^{-1}$: the product of each pair is $1$. The only unpaired elements are those with $u=u^{-1}$, i.e. $u^2\equiv1$, i.e. $p\mid(u-1)(u+1)$ — by Euclid's lemma $u=1$ or $u=p-1$. So the whole product is $1\cdot(p-1)\equiv-1$. For composite $n=ab$ with $1<a\le b<n$, the factors $a$ and $b$ (or $a$ and $2a$ if $a=b$, $n>4$) appear in $(n-1)!$, forcing $n\mid(n-1)!$.`,
      caption: String.raw`Each chord joins a unit $u$ to its inverse $u^{-1}$ modulo $n$; gold rings mark the units that are their own inverse. For a prime modulus the nonzero residues are paired up completely, except $1$ and $n-1$ (try 13, 17, 23). For composite $n$ the non-units (faded) are stuck outside any pairing, and the product $(n-1)!$ collapses to $0$ — except $n=4$, where it is $2$.`,
      deps: ['nt-2.3'],
      refs: ['Hardy–Wright §6.6', 'Apostol §5.6'],
      tags: ['wilson', 'factorial', 'primality'],
      credit: 'Ibn al-Haytham (c. 1000), Waring/Wilson (1770), Lagrange proved it, 1771',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wilson%27s_theorem' },
      viz(v) {
        const N = v.slider('modulus $n$', 2, 41, 13, { int: true });
        const C = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 420, title: 'each unit joined to its inverse; gold = self-inverse' });
        let info = {};
        v.render(() => {
          const n = N.value, inverse = new Array(n).fill(-1), units = [];
          for (let u = 1; u < n; u++) if (gcd(u, n) === 1) { inverse[u] = inv(u, n); units.push(u); }
          drawClock(C, n, { R: 1, color: (k) => (k && inverse[k] > 0 ? 'blue' : 'faint'), dim: (k) => k === 0 || inverse[k] < 0, r: n <= 24 ? 5 : 3.5 });
          let pairs = 0; const selfInv = [];
          for (const u of units) {
            const w = inverse[u];
            if (w === u) { selfInv.push(u); continue; }
            if (u < w) { pairs++; const [x1, y1] = clockXY(u, n, 1), [x2, y2] = clockXY(w, n, 1); C.line(x1, y1, x2, y2, { color: pcol(pairs - 1), width: 1.6, alpha: 0.8 }); }
          }
          for (const u of selfInv) { const [x, y] = clockXY(u, n, 1); C.circle(x, y, 0.07, { color: 'gold', width: 2.6 }); }
          let fact = 1, prod = 1; for (let k = 1; k < n; k++) { fact = (fact * k) % n; if (gcd(k, n) === 1) prod = (prod * k) % n; }
          info = { n, units: units.length, pairs, selfInv, fact, prod };
        });
        v.readout(() => {
          const { n, units, pairs, selfInv, fact, prod } = info;
          const p = isPrime(n);
          return `$n=${n}$ is ${p ? '**prime**' : '**composite**'}. ${units} units form ${pairs} inverse pairs plus the self-inverse ${selfInv.length === 1 ? 'unit' : 'units'} $${selfInv.join(', ')}$. $(n-1)!\\bmod n=${fact}$` + (fact === n - 1 ? ' $=-1$: Wilson’s congruence **holds**.' : ' — not $-1$, so $n$ is not prime (the converse of Wilson).') + `\nProduct of the *units* only: $${prod}$` + (prod === n - 1 ? ' $\\equiv-1$' : prod === 1 ? ' $\\equiv+1$' : '') + ` — pairs contribute $1$, so it equals the product of the self-inverse units.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Lagrange: a polynomial mod p has at most deg roots',
      statement: String.raw`Let $p$ be prime and $f(x)=c_dx^d+\cdots+c_0$ a polynomial with integer coefficients and $p\nmid c_d$. Then the congruence $f(x)\equiv0\pmod p$ has at most $d$ solutions modulo $p$. (Equivalently: a nonzero polynomial of degree $d$ over the field $\mathbb F_p$ has at most $d$ roots.) The hypothesis that $p$ is prime is essential: modulo $8$ the congruence $x^2\equiv1$ has four solutions.`,
      idea: String.raw`Induction on $d$ (this is the factor theorem, ladr-4.6, over the field $\Z/p\Z$). If $r$ is a root, divide: $f(x)=(x-r)g(x)+f(r)\equiv(x-r)g(x)$ with $\deg g=d-1$. Any other root $s\not\equiv r$ makes $(s-r)g(s)\equiv0$, and since $p$ is prime, $s-r$ is a unit so $g(s)\equiv0$. By induction $g$ has at most $d-1$ roots. Modulo a composite $n=ab$, $(s-r)g(s)\equiv0$ no longer forces $g(s)\equiv0$: zero-divisors let extra roots appear.`,
      caption: String.raw`Dots are the values $f(x)\bmod m$ for $x=0,\dots,m-1$; the roots (value $0$) are circled in green. Choose a polynomial with the coefficient sliders or pick a preset: for a prime modulus the number of roots never exceeds the degree. Switch to the composite presets ($x^2-1\bmod 8$, $x^2-x\bmod 6$, $x^4-1\bmod 16$) and the bound collapses.`,
      deps: ['nt-2.3', 'ladr-4.6'],
      refs: ['Hardy–Wright §7.4', 'Apostol §5.5'],
      tags: ['polynomial', 'roots', 'field'],
      credit: 'Lagrange, 1768',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Polynomial_congruence' },
      viz(v) {
        const PRE = [
          { k: 'a', label: '$x^4-1 \\ (13)$', c: [-1, 0, 0, 0, 1], m: 13 },
          { k: 'b', label: '$x^3-2 \\ (7)$', c: [-2, 0, 0, 1, 0], m: 7 },
          { k: 'c', label: '$x^2+1 \\ (11)$', c: [1, 0, 1, 0, 0], m: 11 },
          { k: 'd', label: '$x^2-1 \\ (8)$', c: [-1, 0, 1, 0, 0], m: 8 },
          { k: 'e', label: '$x^2-x \\ (6)$', c: [0, -1, 1, 0, 0], m: 6 },
          { k: 'f', label: '$x^4-1 \\ (16)$', c: [-1, 0, 0, 0, 1], m: 16 },
        ];
        const C = [4, 3, 2, 1, 0].map((i) => v.slider(`$c_${i}$`, -9, 9, PRE[0].c[i], { int: true }));
        const M = v.slider('modulus $m$', 2, 60, 13, { int: true });
        const SEL = v.select('preset', PRE.map((p) => ({ value: p.k, label: p.label })), 'a', { onChange: (k) => { const p = PRE.find((q) => q.k === k); [4, 3, 2, 1, 0].forEach((i, j) => C[j].set(p.c[i])); M.set(p.m); } });
        const S = v.stage({ x: [-1, 14], y: [-1, 14], axes: 'box', gutter: true, height: 360, full: true, xlabel: '$x$', ylabel: '$f(x) \\bmod m$', title: 'the values of $f$ modulo $m$ — roots circled' });
        let info = {};
        const ev = (x, m) => { let r = 0; for (let j = 0; j < 5; j++) r = mod(r * x + C[j].value, m); return r; };
        v.render(() => {
          const m = M.value;
          S.setView([-1, m], [-1, m]);
          const roots = [];
          for (let x = 0; x < m; x++) { const y = ev(x, m); if (y === 0) roots.push(x); }
          S.hline(0, { color: 'green', width: 1.2, alpha: 0.5 });
          for (let x = 0; x < m; x++) { const y = ev(x, m); S.dot(x, y, { r: m <= 30 ? 4.5 : 3, color: y === 0 ? 'green' : 'blue' }); }
          for (const x of roots) { S.dot(x, 0, { r: 10, hollow: true, color: 'green', width: 2.4 }); if (m <= 40) S.text(String(x), x, 0, { align: 'center', baseline: 'bottom', size: 11.5, color: 'green', weight: 700, dy: -15 }); }
          let deg = -1; for (let j = 0; j < 5; j++) if (mod(C[j].value, m) !== 0) { deg = 4 - j; break; }
          info = { m, roots, deg };
        });
        const poly = () => { const t = []; [4, 3, 2, 1, 0].forEach((i, j) => { const c = C[j].value; if (!c) return; const a = Math.abs(c), co = a === 1 && i > 0 ? '' : String(a), xp = i === 0 ? '' : i === 1 ? 'x' : `x^{${i}}`; t.push(`${t.length ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '')}${co}${xp}`); }); return t.length ? t.join('') : '0'; };
        v.readout(() => {
          const { m, roots, deg } = info, p = isPrime(m);
          let t = `$f(x)=${poly()}$ modulo $${m}$ (${p ? 'prime' : '**composite**'}): ${roots.length} root${roots.length === 1 ? '' : 's'}${roots.length ? ' $x\\equiv ' + roots.join(',\\ ') + '$' : ''}. Degree modulo $m$: ${deg < 0 ? '$f\\equiv0$ (every residue is a root)' : '$d=' + deg + '$'}. `;
          if (deg < 0) t += 'The zero polynomial is excluded from the theorem.';
          else if (p) t += roots.length <= deg ? `$${roots.length}\\le${deg}$ — **Lagrange’s bound holds**.` : '**violated?!**';
          else t += roots.length > deg ? `$${roots.length}>${deg}$: **the bound fails** — $\\Z/${m}\\Z$ has zero-divisors, so the induction step breaks.` : `$${roots.length}\\le${deg}$ here, but for composite moduli this is no longer guaranteed.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Hensel’s lemma',
      statement: String.raw`Let $f$ be a polynomial with integer coefficients, $p$ a prime, $k\ge1$, and suppose $f(r)\equiv0\pmod{p^k}$ with $f'(r)\not\equiv0\pmod p$ (a *simple* root). Then there is a unique $r'\bmod p^{k+1}$ with $r'\equiv r\pmod{p^k}$ and $f(r')\equiv0\pmod{p^{k+1}}$, given by the Newton step
$$r'=r-f(r)\,\bigl(f'(r)\bigr)^{-1}\pmod{p^{k+1}} .$$
Hence every simple root mod $p$ lifts uniquely to roots mod $p^2,p^3,\dots$ (a $p$-adic root). If $f'(r)\equiv0\pmod p$ the lift may fail or be non-unique.`,
      idea: String.raw`Taylor-expand: $f(r+tp^k)\equiv f(r)+tp^kf'(r)\pmod{p^{k+1}}$ because higher terms carry $p^{2k}$ and $2k\ge k+1$. Write $f(r)=p^k s$; we need $s+tf'(r)\equiv0\pmod p$. When $f'(r)$ is invertible mod $p$ this has exactly one solution $t$ (2.2). When $p\mid f'(r)$ it has either no solution (if $p\nmid s$) or every $t$ works (if $p\mid s$) — branching or dying, never the clean unique lift.`,
      caption: String.raw`Row $k$ lists the residues mod $p^k$ left to right (as fractions $r/p^k$ of the interval); green ticks are the solutions of $f(r)\equiv0\pmod{p^k}$, found by brute force, and the grey lines join each root to the root mod $p^{k-1}$ below it. For a simple root the tree is a single path: the digits of the $p$-adic root appear one per row. A double root ($x^2-3$ at $p=3$) dies, and $x^2-17$ at $p=2$ branches — the hypothesis matters.`,
      deps: ['nt-2.12'],
      refs: ['Apostol §5.9', 'Hardy–Wright §8.3'],
      tags: ['hensel', 'p-adic', 'lifting'],
      credit: 'Hensel, 1897 (Gauss, Newton’s method modulo $p$)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hensel%27s_lemma' },
      viz(v) {
        const FS = [
          { k: 'a', label: '$x^2-2$', f: (x) => x * x - 2, d: (x) => 2 * x },
          { k: 'b', label: '$x^2-17$', f: (x) => x * x - 17, d: (x) => 2 * x },
          { k: 'c', label: '$x^2-3$', f: (x) => x * x - 3, d: (x) => 2 * x },
          { k: 'd', label: '$x^2+1$', f: (x) => x * x + 1, d: (x) => 2 * x },
          { k: 'e', label: '$x^3-2$', f: (x) => x * x * x - 2, d: (x) => 3 * x * x },
        ];
        const FSEL = v.select('polynomial', FS.map((q) => ({ value: q.k, label: q.label })), 'a');
        const PSEL = v.select('prime $p$', [2, 3, 5, 7].map((q) => ({ value: q, label: String(q) })), 7);
        const KS = v.slider('levels $k$', 1, 6, 4, { int: true });
        const S = v.stage({ x: [-0.02, 1.02], y: [0, 7], axes: false, height: 340, full: true, title: 'solutions of $f(r)\\equiv0 \\pmod{p^k}$, level by level' });
        let info = {};
        v.render(() => {
          const F = FS.find((q) => q.k === FSEL.value), p = PSEL.value;
          const Kmax = Math.max(1, Math.floor(Math.log(800) / Math.log(p))), K = Math.min(KS.value, Kmax);
          S.setView([-0.07, 1.05], [-0.4, K + 0.7]);
          const sols = [];
          for (let k = 1; k <= K; k++) { const q = p ** k, L = []; for (let r = 0; r < q; r++) if (mod(F.f(r), q) === 0) L.push(r); sols.push(L); }
          for (let k = 1; k <= K; k++) {
            const q = p ** k, y = K - k + 0.5;
            S.line(0, y, 1, y, { color: 'grid', width: 1 });
            S.text(`mod ${p}${k > 1 ? '^' + k : ''}`.replace(/\^(\d)/, (_, d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]), -0.012, y, { align: 'right', baseline: 'middle', size: 11, color: 'muted' });
            const step = 1 / q; if (q <= 100) for (let r = 0; r < q; r++) S.line(r * step + step / 2, y - 0.05, r * step + step / 2, y + 0.05, { color: 'faint', width: 1 });
            for (const r of sols[k - 1]) {
              const x = r * step + step / 2;
              if (k > 1) { const par = r % (p ** (k - 1)), px = par / (p ** (k - 1)) + 0.5 / (p ** (k - 1)); S.line(px, y + 1 - 0.18, x, y + 0.18, { color: 'ink', width: 1.1, alpha: 0.35 }); }
              S.line(x, y - 0.17, x, y + 0.17, { color: 'green', width: Math.max(2, Math.min(5, step * S.width * 0.6)) });
            }
            S.text(`${sols[k - 1].length}`, 1.045, y, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'green' });
          }
          // the Newton lifts of every simple root mod p
          const lifts = [];
          for (const r1 of sols[0]) if (mod(F.d(r1), p) !== 0) {
            let r = r1, ok = true; const seq = [r1];
            for (let k = 1; k < K; k++) { const q = p ** (k + 1), dinv = inv(mod(F.d(r), q), q); if (dinv === null) { ok = false; break; } r = mod(r - F.f(r) * dinv, q); seq.push(r); ok = ok && sols[k].includes(r); }
            lifts.push({ seq, ok });
          }
          info = { F, p, K, Kmax, counts: sols.map((L) => L.length), lifts, simple: sols[0].filter((r) => mod(F.d(r), p) !== 0).length, rootsP: sols[0].length };
        });
        v.readout(() => {
          const { p, K, Kmax, counts, lifts, simple, rootsP } = info;
          let t = `Number of solutions mod $p^k$ for $k=1..${K}$: **${counts.join(', ')}**${KS.value > Kmax ? ` (capped at $k=${Kmax}$ for $p=${p}$)` : ''}. ${rootsP} root${rootsP === 1 ? '' : 's'} mod $${p}$, ${simple} simple.`;
          if (lifts.length) t += '\nNewton lifts $r\\mapsto r-f(r)/f\'(r)$ of the simple roots: ' + lifts.map((l) => `$${l.seq.join('\\to ')}$ ${l.ok ? '✓' : '✗'}`).join(' · ') + ' — each agrees with the brute-force solutions.';
          if (rootsP > simple) t += `\nA multiple root mod $p$ (where $f'\\equiv0$) is present: the tree there branches or ends — Hensel's hypothesis fails.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Divisibility tests from powers of ten',
      statement: String.raw`Let $N=\sum_{i=0}^{r}a_i10^i$ with decimal digits $a_i$, and let $d\ge2$. Since $10^i\equiv w_i\pmod d$ with $w_i=10^i\bmod d$,
$$N\equiv\sum_{i}a_iw_i\pmod d .$$
In particular: $N\equiv\sum a_i\pmod 9$ and $\pmod 3$ (as $10\equiv1$); $N\equiv\sum(-1)^ia_i\pmod{11}$ (as $10\equiv-1$); and for $d=7,11,13$ the weights repeat in blocks of three digits because $1001=7\cdot11\cdot13$, so $N\equiv(\text{alternating sum of 3-digit blocks})$. The period of $(w_i)$ is the order of $10$ modulo $d$ (when $\gcd(d,10)=1$).`,
      idea: String.raw`Congruences respect addition and multiplication (2.1), so $N=\sum a_i10^i\equiv\sum a_i(10^i\bmod d)$. The test is only as good as the weights: $d=3,9$ have all weights $1$, $d=11$ alternates $1,-1$, and $d=7$ cycles through $1,3,2,-1,-3,-2$ with period $6=\operatorname{ord}_7 10$, giving no shortcut except the $1001$ trick. Powers of ten modulo $2^k,5^k$ vanish eventually: divisibility by $2^k$ or $5^k$ depends on the last $k$ digits.`,
      caption: String.raw`Type a number (up to 24 digits) and choose $d$. Each digit sits above its weight $w_i=10^i\bmod d$ (shown in the symmetric range) and below it the contribution $a_iw_i$ is drawn as a signed bar. Their sum, reduced modulo $d$, is the remainder of $N$: the readout checks it against an independent long division digit by digit.`,
      deps: ['nt-2.1'],
      refs: ['Hardy–Wright §9.5'],
      tags: ['divisibility', 'decimal'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Divisibility_rule' },
      viz(v) {
        const IN = v.input('number $N$', '3141592653589793', { width: 260, placeholder: 'digits' });
        const D = v.select('divisor $d$', [3, 7, 9, 11, 13, 37, 101].map((k) => ({ value: k, label: String(k) })), 7);
        const S = v.stage({ x: [-1, 24], y: [-3, 3], axes: false, height: 300, full: true, title: 'digits $a_i$, weights $w_i=10^i \\bmod d$, contributions $a_iw_i$ (most significant digit on the left)' });
        let info = {};
        const sym = (w, d) => (w > d / 2 ? w - d : w);
        v.render(() => {
          let txt = String(IN.value ?? '').replace(/[^0-9]/g, '').slice(0, 24); if (!txt) txt = '0';
          const d = D.value, L = txt.length, digs = txt.split('').map(Number);
          const ws = []; for (let i = 0, w = 1 % d; i < L; i++, w = (w * 10) % d) ws.push(sym(w, d));
          const cons = digs.map((a, j) => a * ws[L - 1 - j]), maxc = Math.max(1, ...cons.map(Math.abs));
          S.setView([-1.9, L + 0.3], [-1.6, 3.9]);
          const cw = S.width / (L + 1.6);
          for (let j = 0; j < L; j++) {
            const i = L - 1 - j, x = j + 0.5;
            S.rect(x - 0.45, 2.1, x + 0.45, 3.1, { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1.2 });
            S.text(String(digs[j]), x, 2.6, { align: 'center', baseline: 'middle', size: Math.min(20, cw * 0.65), weight: 650 });
            S.text(`10^${i}`.replace(/\^(\d+)/, (_, e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')), x, 3.25, { align: 'center', baseline: 'bottom', size: Math.min(10, cw * 0.4), color: 'faint' });
            S.rect(x - 0.45, 0.8, x + 0.45, 1.8, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.2 });
            S.text(v.fmt(ws[i]), x, 1.3, { align: 'center', baseline: 'middle', size: Math.min(16, cw * 0.55), color: 'orange', weight: 650 });
            const h = (cons[j] / maxc) * 0.62;
            S.rect(x - 0.32, h >= 0 ? 0 : h, x + 0.32, h >= 0 ? h : 0, { fill: cons[j] >= 0 ? 'teal' : 'red', fillAlpha: 0.55, color: cons[j] >= 0 ? 'teal' : 'red', width: 1 });
            if (cw >= 22) S.text(v.fmt(cons[j]), x, h >= 0 ? h + 0.12 : h - 0.12, { align: 'center', baseline: h >= 0 ? 'bottom' : 'top', size: Math.min(11, cw * 0.4), color: 'muted' });
          }
          S.line(0, 0, L, 0, { color: 'muted', width: 1 });
          S.text('$a_i$', -0.15, 2.6, { align: 'right', size: 13, color: 'muted' }); S.text('$w_i$', -0.15, 1.3, { align: 'right', size: 13, color: 'orange' }); S.text('$a_iw_i$', -0.15, 0.0, { align: 'right', size: 13, color: 'teal' });
          let rem = 0; for (const a of digs) rem = (rem * 10 + a) % d;
          const tot = cons.reduce((s, x) => s + x, 0);
          let per = 0; { let w = 1 % d; do { w = (w * 10) % d; per++; } while (w !== 1 % d && per < 200); if (gcd(10, d) !== 1) per = 0; }
          info = { txt, d, tot, red: mod(tot, d), rem, per, ws: ws.slice(0, 8) };
        });
        v.readout(() => {
          const { txt, d, tot, red, rem, per, ws } = info;
          return `$N=${txt}$, $d=${d}$. Weights (low digits first): $${ws.join(', ')},\\dots$${per ? ` — period ${per}` : ''}. $\\sum a_iw_i=${tot}\\equiv${red}$, and long division gives the remainder **${rem}** ${red === rem ? '— identical' : '— MISMATCH'}. ${rem === 0 ? `So $${d}\\mid N$.` : `So $${d}\\nmid N$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Legendre’s formula for the prime power in n!',
      statement: String.raw`For a prime $p$ and $n\ge1$, the exponent of $p$ in $n!$ is
$$v_p(n!)=\sum_{k\ge1}\Bigl\lfloor\frac n{p^k}\Bigr\rfloor=\frac{n-s_p(n)}{p-1},$$
where $s_p(n)$ is the sum of the base-$p$ digits of $n$. Consequently $n!=\prod_p p^{v_p(n!)}$ and the number of trailing zeros of $n!$ in base $10$ is $v_5(n!)$.`,
      idea: String.raw`By unique factorization (1.6), $v_p(n!)=\sum_{m\le n}v_p(m)$, and $v_p(m)=\#\{k\ge1:p^k\mid m\}$. Swap the order of summation: for fixed $k$ the multiples of $p^k$ among $1,\dots,n$ number $\lfloor n/p^k\rfloor$. In the picture, stack a block in column $m$ for each power $p^k$ dividing $m$; counting by rows gives Legendre's sum, counting by columns gives the factorisation. The digit-sum form follows by summing the geometric series in base $p$.`,
      caption: String.raw`Column $m$ is a tower with one block for each $k$ such that $p^k\mid m$, coloured by layer $k$. Layer $k$ has $\lfloor n/p^k\rfloor$ blocks (counted on the right); the total number of blocks is $v_p(n!)$. The readout compares it with the exponent found by actually factorising $n!$ with big integers.`,
      deps: ['nt-1.6'],
      refs: ['Apostol ch. 3'],
      tags: ['factorial', 'valuation'],
      credit: 'Legendre, 1808',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Legendre%27s_formula' },
      viz(v) {
        const N = v.slider('$n$', 1, 200, 100, { int: true });
        const P = v.select('prime $p$', [2, 3, 5, 7].map((k) => ({ value: k, label: String(k) })), 3);
        const S = v.stage({ x: [0, 201], y: [0, 8], axes: 'box', gutter: true, height: 340, full: true, xlabel: '$m$', ylabel: 'layer $k$', title: 'one block in column $m$ for every $p^k$ dividing $m$' });
        let info = {};
        v.render(() => {
          const n = N.value, p = P.value, top = Math.max(2, Math.floor(Math.log(n) / Math.log(p)) + 0.001) + 0.8;
          S.setView([0, n * 1.18 + 4], [0, Math.ceil(top) + 0.5]);
          let tot = 0, layers = [];
          for (let k = 1; p ** k <= n; k++) {
            let c = 0;
            for (let m = p ** k; m <= n; m += p ** k) { c++; S.rect(m - 0.42, k - 1 + 0.06, m + 0.42, k - 0.06, { fill: pcol(k - 1), fillAlpha: 0.7, stroke: false }); }
            layers.push(c); tot += c;
            S.text(`k=${k}: ${c}`, n + 2 + n * 0.01, k - 0.5, { align: 'left', baseline: 'middle', size: 12, weight: 650, color: pcol(k - 1) });
          }
          let f = 1n; for (let m = 2n; m <= BigInt(n); m++) f *= m;
          let e = 0, bp = BigInt(p); while (f % bp === 0n) { f /= bp; e++; }
          const digs = digitsOf(n, p), sp = digs.reduce((s, x) => s + x, 0);
          info = { n, p, tot, layers, e, sp, digs };
        });
        v.readout(() => {
          const { n, p, tot, layers, e, sp, digs } = info;
          return `$v_{${p}}(${n}!)=${layers.length ? layers.map((c, i) => `\\lfloor ${n}/${p}^{${i + 1}}\\rfloor`).join('+') : '0'}=${layers.join('+') || 0}=${tot}$; factorising $${n}!$ directly gives exponent **${e}** ${e === tot ? '✓' : '✗'}. Digit-sum form: $${n}=(${[...digs].reverse().join('')})_{${p}}$, $s_p=${sp}$, $(n-s_p)/(p-1)=${(n - sp) / (p - 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.16
    {
      num: '2.16',
      kind: 'Theorem',
      name: 'Lucas’s theorem: binomial coefficients mod p',
      statement: String.raw`Let $p$ be prime and write $n=\sum n_ip^i$, $k=\sum k_ip^i$ in base $p$ (digits $0\le n_i,k_i<p$). Then
$$\binom nk\equiv\prod_i\binom{n_i}{k_i}\pmod p,$$
with the convention $\binom ab=0$ for $b>a$. In particular $\binom nk\not\equiv0\pmod p$ iff $k_i\le n_i$ for every digit position $i$, so row $n$ of Pascal's triangle has exactly $\prod_i(n_i+1)$ entries not divisible by $p$.`,
      idea: String.raw`Modulo $p$, $(1+x)^p\equiv1+x^p$ (the middle binomials $\binom pj$ are divisible by $p$; 2.5), hence $(1+x)^n=\prod_i(1+x)^{n_ip^i}\equiv\prod_i(1+x^{p^i})^{n_i}\pmod p$. Expand and compare the coefficient of $x^k$: because $0\le k_i\le p-1$, the powers $x^{p^i\cdot j}$ with $j<p$ combine into the base-$p$ expansion of the exponent in only one way, so the coefficient of $x^k$ is exactly $\prod\binom{n_i}{k_i}$.`,
      caption: String.raw`Pascal's triangle with every entry coloured by its residue modulo $p$ (white = divisible by $p$). The triangle is self-similar: blocks of size $p^j$ repeat scaled by the digit. Click any entry: the readout expands $n$ and $k$ in base $p$ and multiplies the small binomials — it always reproduces the entry. Try $p=2$ for the Sierpiński pattern.`,
      deps: ['comb-1.6', 'nt-2.5'],
      refs: ['Hardy–Wright §6.2'],
      tags: ['binomial', 'pascal', 'fractal'],
      credit: 'Lucas, 1878',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lucas%27s_theorem' },
      viz(v) {
        const P = v.select('prime $p$', [2, 3, 5, 7].map((k) => ({ value: k, label: String(k) })), 2);
        const R = v.slider('rows', 8, 128, 64, { int: true });
        const S = v.stage({ x: [-64, 64], y: [-130, 2], axes: false, height: 460, full: true, title: 'Pascal’s triangle modulo $p$ — click an entry' });
        let sel = [37, 12], tri = null, triP = 0, triR = 0, info = {};
        S.onClick((x, y) => { const n = Math.round(-y), k = Math.round(x + n / 2); if (n >= 0 && n < R.value && k >= 0 && k <= n) { sel = [n, k]; v.invalidate(); } });
        v.render(() => {
          const p = P.value, rows = R.value;
          if (!tri || triP !== p || triR !== rows) { tri = [[1 % p]]; for (let n = 1; n < rows; n++) { const r = [1 % p]; for (let k = 1; k < n; k++) r.push((tri[n - 1][k - 1] + tri[n - 1][k]) % p); r.push(1 % p); tri.push(r); } triP = p; triR = rows; }
          S.setView([-rows / 2 - 1, rows / 2 + 1], [-rows - 1, 1]);
          const ctx = S.ctx, cw = Math.abs(S.X(1) - S.X(0)), chh = Math.abs(S.Y(0) - S.Y(1));
          for (let n = 0; n < rows; n++) for (let k = 0; k <= n; k++) {
            const r = tri[n][k]; if (!r) continue;
            ctx.fillStyle = v.color(PAL[(r - 1) % 8], p === 2 ? 0.85 : 0.75);
            ctx.fillRect(S.X(k - n / 2 - 0.5) + 0.3, S.Y(-n + 0.5) + 0.3, cw - 0.6, chh - 0.6);
          }
          const [sn, sk] = sel.map((z, i) => z);
          if (sel[0] < rows) { S.rect(sel[1] - sel[0] / 2 - 0.5, -sel[0] - 0.5, sel[1] - sel[0] / 2 + 0.5, -sel[0] + 0.5, { color: 'ink', width: 2.4 }); S.dot(sel[1] - sel[0] / 2, -sel[0], { r: 3, color: 'ink' }); }
          // level lines at p^j
          for (let j = 1; p ** j < rows; j++) S.line(-(p ** j) / 2 - 1, -(p ** j) + 0.5, p ** j / 2 + 1, -(p ** j) + 0.5, { color: 'ink', width: 1, alpha: 0.35, dash: [4, 4] });
          info = { p, rows };
        });
        v.readout(() => {
          const { p, rows } = info; let [n, k] = sel; if (n >= rows) { n = rows - 1; k = Math.min(k, n); }
          const dn = digitsOf(n, p, 1), dk = digitsOf(k, p, dn.length), small = (a, b) => { if (b > a) return 0; let r = 1; for (let i = 0; i < b; i++) r = (r * (a - i)) / (i + 1); return r; };
          const parts = dn.map((a, i) => small(a, dk[i] ?? 0)), prod = parts.reduce((s, x) => (s * x) % p, 1);
          return `$\\binom{${n}}{${k}}\\bmod ${p}=${tri[n][k]}$ (from the table). Base $${p}$: $${n}=(${[...dn].reverse().join('')})_${p}$, $${k}=(${[...dk].reverse().join('')})_${p}$, so Lucas gives $${[...dn].reverse().map((a, i) => `\\binom{${a}}{${[...dk].reverse()[i]}}`).join('\\cdot')}=${[...parts].reverse().join('\\cdot')}\\equiv${prod}$ ${prod === tri[n][k] ? '✓' : '✗'}. Row $${n}$ has $${dn.map((a) => a + 1).join('\\cdot')}=${dn.reduce((s, a) => s * (a + 1), 1)}$ entries not divisible by $${p}$ (counted from the table: ${tri[n].filter((x) => x).length}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Theorem',
      name: 'Kummer’s theorem: carries count the power of p',
      statement: String.raw`Let $p$ be prime and $0\le k\le n$. The exponent of $p$ in the binomial coefficient $\binom nk$ equals the number of carries when $k$ and $n-k$ are added in base $p$:
$$v_p\binom nk=\#\{\text{carries in }k+(n-k)\text{ in base }p\}=\frac{s_p(k)+s_p(n-k)-s_p(n)}{p-1}.$$
In particular $p\nmid\binom nk$ iff the addition has no carry (consistent with Lucas's theorem).`,
      idea: String.raw`Combine Legendre's formula (2.15) with the digit-sum form: $v_p\binom nk=v_p(n!)-v_p(k!)-v_p((n-k)!)=\dfrac{s_p(k)+s_p(n-k)-s_p(n)}{p-1}$. Adding two numbers in base $p$, each carry replaces $p$ in one column by $1$ in the next, so it lowers the digit sum by $p-1$: $s_p(a+b)=s_p(a)+s_p(b)-(p-1)\cdot\#\text{carries}$. Equating the two expressions proves the claim.`,
      caption: String.raw`Left: the addition $k+(n-k)=n$ written in base $p$; red arrows are carries. Right: the valuation $v_p\binom nk$ for all $n\le 64$ (stronger colour = higher power; pale green = $0$). The selected entry (click to move it) has exactly as many carries as its colour says. The valuation is computed independently by Legendre's formula, not from the carries.`,
      deps: ['nt-2.15', 'comb-1.6'],
      refs: ['Hardy–Wright §6.2'],
      tags: ['binomial', 'carries', 'valuation'],
      credit: 'Kummer, 1852',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kummer%27s_theorem' },
      viz(v) {
        const P = v.select('prime $p$', [2, 3, 5, 7].map((k) => ({ value: k, label: String(k) })), 2);
        const NN = v.slider('$n$', 1, 63, 45, { int: true });
        const KK = v.slider('$k$', 0, 63, 17, { int: true });
        const A = v.stage({ x: [-9, 3], y: [-1, 6], axes: false, height: 360, title: 'adding $k$ and $n-k$ in base $p$' });
        const H = v.stage({ x: [-4, 66], y: [-5, 66], axes: false, height: 360, title: '$v_p\\binom nk$ for $0\\le k\\le n\\le 63$ — click to choose $(n,k)$' });
        H.onClick((x, y) => { const n = Math.round(y), k = Math.round(x); if (n >= 1 && n <= 63 && k >= 0 && k <= n) { NN.set(n); KK.set(k); } });
        const vf = (n, p) => { let s = 0; for (let q = p; q <= n; q *= p) s += Math.floor(n / q); return s; };
        const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
        let info = {};
        v.render(() => {
          const p = P.value, n = NN.value, k = Math.min(KK.value, n), m = n - k, L = Math.max(digitsOf(n, p).length, 1);
          const dk = digitsOf(k, p, L), dm = digitsOf(m, p, L), dn = digitsOf(n, p, L);
          let carry = 0, carries = []; const sumd = [];
          for (let i = 0; i < L; i++) { const t = dk[i] + dm[i] + carry; sumd.push(t % p); carry = t >= p ? 1 : 0; carries.push(carry); }
          A.setView([-L - 1.8, 2.6], [-0.8, 5.6]);
          for (let i = 0; i < L; i++) {
            const x = -i;
            A.rect(x - 0.42, 3.2, x + 0.42, 3.9, { fill: 'blue', fillAlpha: 0.12, stroke: false });
            A.text(String(dk[i]), x, 3.55, { align: 'center', baseline: 'middle', size: 20, weight: 600 });
            A.rect(x - 0.42, 2.2, x + 0.42, 2.9, { fill: 'orange', fillAlpha: 0.12, stroke: false });
            A.text(String(dm[i]), x, 2.55, { align: 'center', baseline: 'middle', size: 20, weight: 600 });
            A.rect(x - 0.42, 0.7, x + 0.42, 1.5, { fill: 'green', fillAlpha: 0.15, stroke: false });
            A.text(String(dn[i]), x, 1.1, { align: 'center', baseline: 'middle', size: 20, weight: 700, color: 'green' });
            if (carries[i] && i + 1 < L + 1) { A.arrow(x - 0.2, 4.35, x - 1 + 0.2, 4.35, { color: 'red', width: 2, head: 8 }); A.text('1', x - 0.5, 4.8, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: 'red' }); }
            A.text(`${p}${sup[i] ?? ''}`.replace(/^(\d)⁰$/, '$1⁰'), x, 5.45, { align: 'center', baseline: 'middle', size: 10.5, color: 'faint' });
          }
          A.line(-L + 0.55, 2.0, 0.55, 2.0, { color: 'ink', width: 1.5 });
          A.text('k', -L - 0.9, 3.55, { align: 'center', baseline: 'middle', size: 14, color: 'blue', math: true }); A.text('+ (n−k)', -L - 0.9, 2.55, { align: 'center', baseline: 'middle', size: 13, color: 'orange' }); A.text('n', -L - 0.9, 1.1, { align: 'center', baseline: 'middle', size: 14, color: 'green', math: true });
          A.text(`${k} + ${m} = ${n}`, -L / 2 + 0.5, 0.1, { align: 'center', baseline: 'middle', size: 13, color: 'muted' });
          // heat triangle
          const val = (nn, kk) => vf(nn, p) - vf(kk, p) - vf(nn - kk, p);
          const vmax = Math.max(1, ...[...Array(64).keys()].map((nn) => val(nn, Math.floor(nn / 2))));
          const ctx = H.ctx, cw = Math.abs(H.X(1) - H.X(0)), chh = Math.abs(H.Y(0) - H.Y(1));
          for (let nn = 0; nn <= 63; nn++) for (let kk = 0; kk <= nn; kk++) {
            const vv = val(nn, kk); ctx.fillStyle = vv === 0 ? v.color('green', 0.18) : v.rgb ? `rgb(${v.ramp(0.25 + 0.75 * vv / vmax, 'accent').map((c) => Math.round(c)).join(',')})` : 'blue';
            ctx.fillRect(H.X(kk - 0.5) + 0.2, H.Y(nn + 0.5) + 0.2, cw - 0.4, chh - 0.4);
          }
          H.rect(k - 0.5, n - 0.5, k + 0.5, n + 0.5, { color: 'ink', width: 3.2 });
          H.text('$k$', 32, -3, { align: 'center', size: 12, color: 'muted' }); H.text('$n$', -3.2, 32, { align: 'center', size: 12, color: 'muted' });
          let carryCount = carries.reduce((s, c) => s + c, 0);
          info = { p, n, k, m, carryCount, vv: val(n, k), dk, dm, dn };
        });
        v.readout(() => {
          const { p, n, k, m, carryCount, vv, dk, dm, dn } = info, sp = (d) => d.reduce((s, x) => s + x, 0);
          return `$k=${k}=(${[...dk].reverse().join('')})_${p}$, $n-k=${m}=(${[...dm].reverse().join('')})_${p}$: **${carryCount}** carr${carryCount === 1 ? 'y' : 'ies'}. Independently, Legendre gives $v_${p}(${n}!)-v_${p}(${k}!)-v_${p}(${m}!)=${vv}$ ${vv === carryCount ? '✓' : '✗'}; digit sums: $(${sp(dk)}+${sp(dm)}-${sp(dn)})/${p - 1}=${(sp(dk) + sp(dm) - sp(dn)) / (p - 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.18
    {
      num: '2.18',
      kind: 'Theorem',
      name: 'Wolstenholme’s theorem',
      statement: String.raw`For every prime $p\ge5$,
$$1+\frac12+\cdots+\frac1{p-1}=\frac AB\ \text{ with } p^2\mid A,\qquad\text{and}\qquad\binom{2p-1}{p-1}\equiv1\pmod{p^3}.$$
(The first is a statement about the numerator of the harmonic number $H_{p-1}$ in lowest terms; the second is equivalent to it.) Both fail for $p=2,3$. Primes with $p^3\mid A$ (equivalently $\binom{2p-1}{p-1}\equiv1 \pmod{p^4}$) are called *Wolstenholme primes*; only $16843$ and $2124679$ are known.`,
      idea: String.raw`Let $f(x)=\prod_{k=1}^{p-1}(x-k)=\sum_j(-1)^js_jx^{p-1-j}$, so $s_{p-2}=(p-1)!\,H_{p-1}$. Modulo $p$, $f\equiv x^{p-1}-1$ (Fermat; 2.12), hence $p\mid s_j$ for $1\le j\le p-2$. Evaluate at $x=p$: $f(p)=(p-1)!$ gives, after cancelling, $s_{p-2}=p^{p-2}-s_1p^{p-3}+\cdots+s_{p-3}\,p$. Every term is divisible by $p^2$ once $p\ge5$ (the last because $p\mid s_{p-3}$), so $p^2\mid s_{p-2}$, and $(p-1)!$ is a unit. For the binomial, $\binom{2p-1}{p-1}=\prod_{k<p}(1+\tfrac pk)\equiv1+pH_{p-1}+p^2e_2\pmod{p^3}$ with $e_2\equiv0\pmod p$.`,
      caption: String.raw`For every $n\le120$ the top panel plots $\kappa(n)$ = the largest $e$ with $n^e\mid A_n$ (numerator of $H_{n-1}$), computed with exact big-integer fractions; the lower panel does the same for $\binom{2n-1}{n-1}-1$. Primes $\ge5$ (green) reach $2$ and $3$ respectively; $p=2,3$ (orange) fall short; composites (grey) never come close. Use the slider to read the actual numbers for one $n$.`,
      deps: ['nt-2.11'],
      refs: ['Hardy–Wright §7.8'],
      tags: ['harmonic numbers', 'binomial', 'primes'],
      credit: 'Wolstenholme, 1862',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wolstenholme%27s_theorem' },
      viz(v) {
        const NMAX = 120;
        const N = v.slider('$n$', 2, NMAX, 13, { int: true });
        const A = v.stage({ x: [0, NMAX + 1], y: [0, 5], axes: 'box', gutter: true, height: 230, full: true, xlabel: '$n$', ylabel: '$e$ with $n^e \\mid A_n$', title: 'numerator $A_n$ of $H_{n-1}=1+\\tfrac12+\\dots+\\tfrac1{n-1}$' });
        const B = v.stage({ x: [0, NMAX + 1], y: [0, 5], axes: 'box', gutter: true, height: 230, full: true, xlabel: '$n$', ylabel: '$e$ with $n^e \\mid \\binom{2n-1}{n-1}-1$', title: '$\\binom{2n-1}{n-1}-1$' });
        // exact data
        const num = [], bin = [], kap = [], kapB = [];
        let hn = 0n, hd = 1n; const g = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
        let binom = 1n; // C(2n-1,n-1), starting n=1: C(1,0)=1
        const pw = (n, X) => { if (X === 0n) return 9; let e = 0, q = BigInt(n); while (X % q === 0n) { X /= q; e++; if (e > 8) break; } return e; };
        for (let n = 2; n <= NMAX; n++) {
          // H_{n-1}: add 1/(n-1)
          hn = hn * BigInt(n - 1) + hd; hd = hd * BigInt(n - 1); const gg = g(hn, hd); hn /= gg; hd /= gg;
          binom = (binom * 2n * BigInt(2 * n - 1)) / BigInt(n); // C(2n-1,n-1) from C(2n-3,n-2)
          num[n] = hn; bin[n] = binom - 1n; kap[n] = pw(n, hn); kapB[n] = pw(n, binom - 1n);
        }
        let info = {};
        const draw = (S, arr, ref) => {
          S.hline(ref, { color: 'green', width: 1.2, dash: [5, 4] });
          S.text(`$p^${ref}$`, NMAX + 0.5, ref + 0.18, { align: 'right', size: 12, color: 'green' });
          for (let n = 2; n <= NMAX; n++) {
            const pr = isPrime(n), col = pr ? (n >= 5 ? 'green' : 'orange') : 'faint', h = Math.min(arr[n], 5);
            if (h > 0) S.rect(n - 0.4, 0, n + 0.4, h, { fill: col, fillAlpha: pr ? 0.7 : 0.5, color: col, width: 1 });
            else S.dot(n, 0.0, { r: 1.6, color: col });
          }
        };
        v.render(() => {
          A.setView([0, NMAX + 1], [0, 5]); B.setView([0, NMAX + 1], [0, 5]);
          draw(A, kap, 2); draw(B, kapB, 3);
          const n = N.value; A.vline(n, { color: 'gold', width: 1.4, alpha: 0.7 }); B.vline(n, { color: 'gold', width: 1.4, alpha: 0.7 });
          info = { n };
        });
        v.legend([['green', 'prime $\\ge5$'], ['orange', 'prime $2,3$'], ['faint', 'composite']]);
        v.readout(() => {
          const { n } = info, p = isPrime(n), a = String(num[n]), bb = String(bin[n]);
          const sh = (s) => (s.length > 28 ? s.slice(0, 12) + '…' + s.slice(-10) + ` (${s.length} digits)` : s);
          return `$n=${n}$ (${p ? 'prime' : 'composite'}). Numerator of $H_{${n - 1}}$: $${sh(a)}$, divisible by $${n}$ to the power **${kap[n]}**${p && n >= 5 ? ' ($\\ge2$, Wolstenholme)' : ''}. $\\binom{${2 * n - 1}}{${n - 1}}-1=${sh(bb)}$ is divisible by $${n}$ to the power **${kapB[n] > 8 ? '8+' : kapB[n]}**${p && n >= 5 ? ' ($\\ge3$)' : ''}.`;
        });
      },
    },
  ],
};
