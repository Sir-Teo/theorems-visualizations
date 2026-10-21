// Number Theory — Chapter 3: Primitive roots, cyclotomy and primality (part 2: 3.8–3.13)
import { PAL, pcol, mod, gcd, isPrime, totient, divisors, ord, pixGrid, unitsOf, fac, cyclo, evalBig, polyTex, sieve, strongChain, powmodNum, isKorselt, bpow } from './ch03.shared.js';

const primeAtMost = (m) => { let p = Math.max(2, Math.floor(m)); while (!isPrime(p)) p--; return p; };

export default {
  collection: 'nt',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Cyclotomic polynomials',
      statement: String.raw`For $n\ge1$ the *$n$-th cyclotomic polynomial* is $\Phi_n(x)=\prod_{1\le k\le n,\ \gcd(k,n)=1}\bigl(x-e^{2\pi ik/n}\bigr)$, the monic polynomial whose roots are the primitive $n$-th roots of unity. It has degree $\varphi(n)$ and **integer** coefficients, and $x^n-1=\prod_{d\mid n}\Phi_d(x)$. For example $\Phi_p(x)=1+x+\dots+x^{p-1}$ for a prime $p$.`,
      idea: String.raw`Each of the $n$ roots of $x^n-1$ is a primitive $d$-th root of unity for exactly one divisor $d\mid n$, which gives the product formula; comparing degrees gives Gauss's identity $\sum_{d\mid n}\varphi(d)=n$ (2.10). Solving the formula for $\Phi_n$ expresses it as $(x^n-1)$ divided by the product of $\Phi_d$, $d<n$; by induction these are monic integer polynomials, and dividing a monic integer polynomial by a monic integer polynomial that divides it exactly leaves integer coefficients. Coefficients are small for small $n$: Migotti showed in 1883 that for $n$ with at most two distinct odd prime factors they all lie in $\{-1,0,1\}$, and the first $n$ that escapes this is $105=3\cdot5\cdot7$.`,
      caption: String.raw`Slide $n$. Left: the $n$-th roots of unity, with the primitive ones large and the others (roots of $\Phi_d$ for smaller $d\mid n$) faint. Middle: the integer coefficients of $\Phi_n$, found by exact polynomial division, as bars. Right: the largest $|$coefficient$|$ for every $n\le130$ — it is $1$ until $n=105$ (button), where a $-2$ first appears. The readout multiplies out $\prod(x-\zeta^k)$ numerically at a test point and compares with the integer polynomial.`,
      deps: ['nt-2.10'],
      refs: ['Ireland–Rosen ch. 13'],
      tags: ['cyclotomic', 'roots of unity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cyclotomic_polynomial' },
      viz(v) {
        const N = v.slider('$n$', 1, 130, 15, { int: true });
        const J = v.button('jump to $n=105$', () => N.set(105));
        const MAXN = 130;
        const mx = [0]; for (let n = 1; n <= MAXN; n++) mx[n] = Math.max(...cyclo(n).map(Math.abs));
        const Cs = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 330, title: 'roots of $x^n-1$ — primitive ones in colour' });
        const Bs = v.stage({ x: [0, 10], y: [-2, 2], axes: 'box', gutter: true, height: 330, xlabel: 'power $x^j$', ylabel: 'coefficient', title: 'coefficients of $\\Phi_n(x)$' });
        const Ms = v.stage({ x: [0, MAXN + 1], y: [0, 3.2], axes: 'box', gutter: true, height: 330, xlabel: '$n$', ylabel: 'max |coefficient|', title: 'largest coefficient of $\\Phi_n$' });
        Ms.onClick((x) => { const n = Math.round(x); if (n >= 1 && n <= MAXN) N.set(n); });
        let info = {};
        v.render(() => {
          const n = N.value, c = cyclo(n), phi = c.length - 1;
          Cs.circle(0, 0, 1, { color: 'grid', width: 1.2 });
          const prim = [];
          for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n, p = gcd(k, n) === 1; if (p) prim.push(t); Cs.dot(Math.cos(t), Math.sin(t), { r: p ? 6 : 3, color: p ? 'blue' : 'faint', alpha: p ? 1 : 0.8 }); }
          Cs.text(`φ(${n}) = ${phi} primitive roots`, 0, -1.28, { align: 'center', size: 12, color: 'muted' });
          const top = Math.max(1, mx[n]);
          Bs.setView([-0.7, Math.max(phi, 1) + 0.7], [-top - 0.6, top + 0.6]);
          Bs.hline(0, { color: 'grid', width: 1 });
          c.forEach((a, j) => { if (a !== 0) Bs.rect(j - 0.4, 0, j + 0.4, a, { fill: a > 0 ? 'green' : 'red', fillAlpha: 0.55, color: a > 0 ? 'green' : 'red', width: 1 }); });
          Ms.setView([0, MAXN + 1], [0, 3.2]); Ms.setTicks(null, [[0, '0'], [1, '1'], [2, '2'], [3, '3']]);
          for (let m = 1; m <= MAXN; m++) Ms.dot(m, mx[m], { r: m === n ? 6 : 2.6, color: m === n ? 'orange' : mx[m] > 1 ? 'red' : 'blue' });
          // numeric check at x0
          const x0 = 1.37; let re = 1, im = 0;
          for (const t of prim) { const a = x0 - Math.cos(t), b = -Math.sin(t); [re, im] = [re * a - im * b, re * b + im * a]; }
          let ev = 0; for (let j = c.length - 1; j >= 0; j--) ev = ev * x0 + c[j];
          let sumdeg = 0; for (const d of divisors(n)) sumdeg += cyclo(d).length - 1;
          info = { n, c, phi, re, im, ev, x0, sumdeg, max: mx[n] };
        });
        v.readout(() => {
          const { n, c, phi, re, im, ev, x0, sumdeg, max } = info;
          return `$\\Phi_{${n}}(x)=${polyTex(c, 'x', 12)}$ (degree $\\varphi(${n})=${phi}$, largest $|{\\rm coeff}|=${max}$).\n$\\prod(x_0-\\zeta^k)$ at $x_0=${x0}$: $${v.fix(re, 6)}${im < 0 ? '-' : '+'}${v.fix(Math.abs(im), 6)}i$ vs integer polynomial $${v.fix(ev, 6)}$; $\\sum_{d\\mid n}\\deg\\Phi_d=${sumdeg}=n$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Infinitely many primes ≡ 1 (mod n)',
      statement: String.raw`For every $n\ge2$ there are infinitely many primes $p\equiv1\pmod n$. More precisely: if a prime $p$ divides $\Phi_n(m)$ for an integer $m$ and $p\nmid n$, then $\operatorname{ord}_p(m)=n$, hence $p\equiv1\pmod n$; and for every integer $k$ the number $\Phi_n(kn)\equiv1\pmod n$ is not divisible by any prime dividing $n$, so *all* its prime factors are $\equiv1\pmod n$.`,
      idea: String.raw`If $p\mid\Phi_n(m)$ then $p\mid m^n-1$ (as $\Phi_n\mid x^n-1$, 3.8), so the order of $m$ divides $n$. If it were a proper divisor $d$, then $p\mid m^d-1=\prod_{e\mid d}\Phi_e(m)$, so $p$ divides $\Phi_e(m)$ for some $e<n$ as well as $\Phi_n(m)$; then $m$ is a repeated root of $x^n-1=\prod_{e\mid n}\Phi_e$ modulo $p$, so $p$ divides the derivative $nx^{n-1}$ at $m$, hence $p\mid n$. So for $p\nmid n$ the order is exactly $n$, and $n\mid p-1$ by Fermat and 3.1. Euclid's trick finishes: given primes $p_1,\dots,p_r\equiv1\pmod n$ take $m=n\,p_1\cdots p_r$. Since $\Phi_n(0)=1$, $\Phi_n(m)\equiv1$ modulo $n$ and every $p_i$, so a prime factor of $\Phi_n(m)>1$ is a new prime $\equiv1\pmod n$.`,
      caption: String.raw`Pick $n$ and how many values of $k$ to try. Each dot is a prime factor of $\Phi_n(kn)$ (height on a log scale): all are green, i.e. $\equiv1\pmod n$, and the histogram of prime factors mod $n$ has a single bar at residue $1$. Hypothesis-breaker: tick *evaluate at $k$ instead of $kn$* — now primes dividing $n$ (red) can sneak in, and the clean statement is lost. Rows too large to factor here are skipped.`,
      deps: ['nt-3.8', 'nt-3.1'],
      refs: ['Ireland–Rosen ch. 13'],
      tags: ['cyclotomic', 'primes in progressions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dirichlet%27s_theorem_on_arithmetic_progressions' },
      viz(v) {
        const N = v.slider('$n$', 2, 30, 7, { int: true });
        const K = v.slider('values of $k$ tried', 1, 30, 20, { int: true });
        const BREAK = v.toggle('evaluate at $k$ instead of $kn$', false);
        const P = v.stage({ x: [0, 31], y: [1, 1e6], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: '$k$', ylabel: 'prime factor $q$ of $\\Phi_n(m)$', title: 'prime factors of $\\Phi_n(m)$, $m=kn$' });
        const H = v.stage({ x: [-0.7, 10], y: [0, 10], axes: 'box', gutter: true, height: 340, xlabel: 'residue of $q$ modulo $n$', ylabel: 'number of prime factors', title: 'residues of those prime factors' });
        let info = {};
        const LIM = 1e34;
        v.render(() => {
          const n = N.value, kk = K.value, brk = BREAK.value, c = cyclo(n);
          const pts = [], cnt = new Array(n).fill(0), news = new Set(); let skipped = 0, maxq = 10;
          for (let k = 1; k <= kk; k++) {
            const m = brk ? k : k * n; if (m < 2) continue;
            const val = evalBig(c, BigInt(m)); if (val < 2n) continue;
            if (Number(val) > LIM) { skipped++; P.dot(k, 1.6, { r: 3, hollow: true, color: 'faint' }); continue; }
            for (const [q] of v.M.factor(val)) {
              const qn = Number(q), r = qn % n; cnt[r]++; const good = r === 1 && qn % n === 1; pts.push([k, qn, good]);
              if (good) news.add(qn); maxq = Math.max(maxq, qn);
            }
          }
          P.setView([0, kk + 1], [1, Math.max(1e3, maxq * 3)]);
          pts.forEach(([k, q, good]) => P.dot(k, q, { r: 4, color: good ? 'green' : 'red', alpha: 0.85 }));
          const top = Math.max(1, ...cnt);
          H.setView([-0.7, n - 0.3], [0, top * 1.2]);
          H.setTicks(n <= 16 ? Array.from({ length: n }, (_, i) => [i, String(i)]) : null, null);
          cnt.forEach((a, r) => { if (a) H.rect(r - 0.4, 0, r + 0.4, a, { fill: r === 1 ? 'green' : 'red', fillAlpha: 0.55, color: r === 1 ? 'green' : 'red', width: 1.2 }); });
          const bad = pts.filter((p) => !p[2]).length;
          info = { n, news: [...news].sort((a, b) => a - b), npf: pts.length, bad, skipped, brk, badDiv: pts.filter((p) => !p[2]).every((p) => n % p[1] === 0), badList: [...new Set(pts.filter((p) => !p[2]).map((p) => p[1]))] };
        });
        v.readout(() => {
          const { n, news, npf, bad, skipped, brk, badDiv, badList } = info;
          const show = news.slice(0, 14).join(', ');
          return `${npf} prime factors found, **${npf - bad}** are $\\equiv1\\pmod{${n}}$ and **${bad}** are not${skipped ? ` (${skipped} value${skipped > 1 ? 's' : ''} of $k$ too large to factor, skipped)` : ''}.\nDistinct primes $\\equiv1\\pmod{${n}}$ produced: $${show}${news.length > 14 ? ',\\dots' : ''}$ (${news.length} in all)${brk && bad ? `. The exceptions ($${badList.join(', ')}$) ${badDiv ? 'all divide $n$' : 'do not all divide $n$'} — the hypothesis $p\\nmid n$ matters.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Hypothesis',
      name: 'Artin’s primitive root conjecture',
      statement: String.raw`*Conjecture.* If the integer $a$ is neither $-1$ nor a perfect square, then $a$ is a primitive root modulo infinitely many primes $p$; more precisely the proportion of primes for which it is one tends to a positive limit. When $a$ is not a perfect power and its squarefree part is not $\equiv1\pmod4$ this limit is **Artin's constant** $C=\prod_{p}\bigl(1-\frac1{p(p-1)}\bigr)=0.3739558136\ldots$; other $a$ get a rational multiple of $C$ (and squares and $-1$ give $0$).`,
      idea: String.raw`A unit $a$ fails to be a primitive root modulo $p$ exactly when it is a $q$-th power for some prime $q\mid p-1$ (3.2). Heuristically $q$ divides $p-1$ with probability $\frac1{q-1}$ and then $a$ is a $q$-th power with probability $\frac1q$, so $q$ is the obstruction with probability $\frac1{q(q-1)}$; multiplying the survival probabilities $1-\frac1{q(q-1)}$ over all primes $q$ gives $C$. Artin stated the conjecture in 1927; Hooley proved it in 1967 *assuming* the generalized Riemann hypothesis. The conjecture is open (as of this writing) for every single base $a$; the best unconditional result is Heath-Brown's (1986): at least one of $2,3,5$ is a primitive root for infinitely many primes.`,
      caption: String.raw`Choose a base $a$. Left: the first 100 primes, green when $a$ is a primitive root. Right: the running proportion of primes $p\le x$ (up to $10^6$, computed exactly from the prime sieve) for which $a$ is a primitive root, against the predicted limit (dashed green; drawn only when the clean formula applies). Try $a=2,3,10$ (settling near $0.374$), $a=4$ or $9$ (squares: never), $a=5$ (a different rational multiple of $C$, no line drawn).`,
      deps: ['nt-3.2'],
      refs: ['Ireland–Rosen ch. 4'],
      tags: ['primitive root', 'conjecture'],
      credit: 'E. Artin, 1927 (conjectured); C. Hooley, 1967 (conditional on GRH)',
      scope: String.raw`Open for every individual base $a$ (unconditionally); proved under the generalized Riemann hypothesis. The picture is numerical evidence up to $10^6$, not a proof.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Artin%27s_conjecture_on_primitive_roots' },
      viz(v) {
        const A = v.slider('base $a$', 2, 40, 2, { int: true });
        const LIM = 1000000;
        const pr = sieve(LIM);
        const spf = new Uint32Array(LIM + 1); for (const p of pr) for (let j = p; j <= LIM; j += p) if (!spf[j]) spf[j] = p;
        let C = 1; for (const p of pr) C *= 1 - 1 / (p * (p - 1));
        const cache = new Map();
        const compute = (a) => {
          if (cache.has(a)) return cache.get(a);
          const flag = new Uint8Array(pr.length);
          for (let i = 0; i < pr.length; i++) {
            const p = pr[i]; if (p === 2 || a % p === 0) continue;
            let m = p - 1, ok = true;
            while (m > 1) { const q = spf[m]; while (m % q === 0) m /= q; if (powmodNum(a, (p - 1) / q, p) === 1) { ok = false; break; } }
            if (ok) flag[i] = 1;
          }
          const xs = [], ys = []; let c = 0, tot = 0, next = 100, idx = 0;
          for (let i = 0; i < pr.length; i++) { if (pr[i] > 2 && a % pr[i] !== 0) { tot++; c += flag[i]; } if (pr[i] >= next || i === pr.length - 1) { xs.push(pr[i]); ys.push(tot ? c / tot : 0); next = Math.ceil(next * 1.04); } }
          const r = { flag, xs, ys, c, tot }; cache.set(a, r); return r;
        };
        const sqfree = (a) => { let s = 1, m = a; for (const [p, e] of fac(a)) if (e % 2) s *= p; return s; };
        const isPow = (a) => { for (let e = 2; e <= 20; e++) { const r = Math.round(a ** (1 / e)); if (r > 1 && r ** e === a) return true; } return false; };
        const G = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 340, title: 'first 100 primes: green = $a$ is a primitive root' });
        const R = v.stage({ x: [100, LIM], y: [0, 0.7], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'primes up to $x$', ylabel: 'proportion with $a$ primitive', title: 'running proportion' });
        let info = {};
        v.render(() => {
          const a = A.value, d = compute(a), a0 = sqfree(a), sq = Math.round(Math.sqrt(a)) ** 2 === a, pw = isPow(a);
          const clean = !sq && !pw && a0 % 4 !== 1;
          const pg = pixGrid(G, 100, { pad: 4 });
          for (let i = 0; i < 100; i++) { const [x0, y0, x1, y1] = pg.cell(i), p = pr[i]; const on = d.flag[i]; G.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, { fill: on ? 'green' : 'faint', fillAlpha: on ? 0.55 : 0.12, stroke: false }); if (pg.cs >= 18) G.text(String(p), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Math.min(13, pg.cs * 0.38), weight: on ? 700 : 400, color: on ? 'ink' : 'faint' }); }
          R.setView([100, LIM], [0, 0.7]); R.setTicks(null, [[0, '0'], [0.1, '0.1'], [0.2, '0.2'], [0.3, '0.3'], [0.4, '0.4'], [0.5, '0.5'], [0.6, '0.6']]);
          if (clean) { R.hline(C, { color: 'green', width: 1.6, dash: [6, 4] }); R.text('C = ' + v.fix(C, 4), LIM * 0.8, C + 0.03, { align: 'right', size: 12, color: 'green', weight: 650 }); }
          R.path(d.xs.map((x, i) => [x, d.ys[i]]), { color: 'blue', width: 2 });
          info = { a, final: d.tot ? d.c / d.tot : 0, c: d.c, tot: d.tot, clean, sq, pw, a0 };
        });
        v.readout(() => {
          const { a, final, c, tot, clean, sq, pw, a0 } = info;
          const why = sq ? `$${a}$ is a perfect square: it is never a primitive root, as the conjecture requires` : clean ? `predicted limit $C=${v.fix(C, 6)}$ (the product over primes below $10^6$; the exact value is $0.3739558136\\ldots$), difference $${v.fix(final - C, 4)}$` : `$${a}$ is ${pw ? 'a perfect power' : `of squarefree part $${a0}\\equiv1\\pmod 4`}: the limit is a different multiple of $C$, not drawn here`;
          return `$a=${a}$ is a primitive root for ${c} of the ${tot} odd primes $p\\le10^6$ with $p\\nmid a$: proportion $${v.fix(final, 4)}$. ${why}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Korselt’s criterion and Carmichael numbers',
      statement: String.raw`A composite number $n$ satisfies $a^{n-1}\equiv1\pmod n$ for **every** $a$ coprime to $n$ (a *Carmichael number*) if and only if $n$ is squarefree and $p-1\mid n-1$ for every prime $p\mid n$. The smallest is $561=3\cdot11\cdot17$. For any other composite $n$ the bases that pass Fermat's test form a proper subgroup of $(\Z/n\Z)^\times$, hence at most half of the coprime bases.`,
      idea: String.raw`By the Chinese remainder theorem (2.4), $a^{n-1}\equiv1$ for all units $a$ modulo $n$ iff it holds modulo each prime power $p^e\mid n$. The unit group modulo $p^e$ is cyclic (3.3) of order $p^{e-1}(p-1)$, so its exponent must divide $n-1$; but $p\mid n$ and $p\nmid n-1$, which forces $e=1$ and then exactly $p-1\mid n-1$. Conversely these conditions give the identity at once. The Fermat liars always form a subgroup, so unless it is everything it has index at least $2$.`,
      caption: String.raw`Each cell is a base $a<n$: green if $a^{n-1}\equiv1\pmod n$, red if the Fermat test catches it, grey if $\gcd(a,n)>1$. Slide $n$, or press *next Carmichael number* to jump through $561,1105,1729,2465,2821$: the cells turn entirely green or grey. The readout compares the observed result with Korselt's divisibility test for each prime factor.`,
      deps: ['nt-3.4', 'nt-2.4'],
      refs: ['Hardy–Wright §6.9'],
      tags: ['Carmichael', 'Fermat test'],
      credit: 'A. Korselt, 1899 (criterion); R. D. Carmichael, 1910 (examples, including 561)',
      scope: String.raw`Alford, Granville and Pomerance proved in 1994 that there are infinitely many Carmichael numbers, so Fermat's test alone can never be made reliable.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carmichael_number' },
      viz(v) {
        const N = v.slider('$n$', 4, 3000, 561, { int: true });
        const CAR = [561, 1105, 1729, 2465, 2821];
        v.button('next Carmichael number', () => { const cur = N.value; const nx = CAR.find((c) => c > cur) || CAR[0]; N.set(nx); });
        const G = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 380, title: 'Fermat test $a^{n-1}\\bmod n$ for every base $a<n$' });
        let info = {};
        v.render(() => {
          const n = N.value, prime = isPrime(n);
          const N1 = n - 1; let pass = 0, units = 0;
          const pg = pixGrid(G, n - 1, { pad: 4 });
          for (let a = 1; a < n; a++) {
            const [x0, y0, x1, y1] = pg.cell(a - 1);
            let col, al;
            if (gcd(a, n) !== 1) { col = 'faint'; al = 0.15; } else { units++; const ok = powmodNum(a, N1, n) === 1; if (ok) pass++; col = ok ? 'green' : 'red'; al = ok ? 0.6 : 0.5; }
            G.rect(x0, y0, x1, y1, { fill: col, fillAlpha: al, stroke: false });
            if (pg.cs >= 20) G.text(String(a), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Math.min(12, pg.cs * 0.35), color: 'ink' });
          }
          const f = fac(n);
          const kors = !prime && f.every(([p, e]) => e === 1 && N1 % (p - 1) === 0);
          info = { n, prime, f, pass, units, all: pass === units, kors };
        });
        v.readout(() => {
          const { n, prime, f, pass, units, all, kors } = info;
          const fx = f.map(([p, e]) => (e === 1 ? p : `${p}^{${e}}`)).join('\\cdot');
          if (prime) return `$n=${n}$ is prime: all ${units} coprime bases pass, as Fermat's little theorem says.`;
          const rows = f.map(([p, e]) => (e > 1 ? `${p}^{${e}}\\mid n` : `(${p}-1)\\mid ${n - 1}:\\ ${(n - 1) % (p - 1) === 0 ? '\\text{yes}' : '\\text{no}'}`)).join(', \\quad ');
          return `$n=${fx}$: ${pass} of ${units} coprime bases pass (${v.fix((100 * pass) / units, 1)}%). Korselt: $${rows}$ → Carmichael: **${kors}**; every base passes: **${all}**${!all && pass / units > 0.5 + 1e-9 ? ' (impossible)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Algorithm',
      name: 'Miller–Rabin primality test',
      statement: String.raw`Let $n>2$ be odd and write $n-1=2^sd$ with $d$ odd. For a base $a\in\{2,\dots,n-2\}$ say $n$ *passes* the strong test if $a^d\equiv1$ or $a^{2^rd}\equiv-1\pmod n$ for some $0\le r<s$. Every odd prime passes for every base. If $n$ is composite, at most a quarter of the bases $a\in\{1,\dots,n-1\}$ pass (Rabin), so $k$ independent random bases give a wrong "prime" answer with probability at most $4^{-k}$. A failing base is a *witness* that $n$ is composite.`,
      idea: String.raw`If $n$ is prime, $\Z/n\Z$ has only $\pm1$ as square roots of $1$, so the chain $a^d,a^{2d},\dots,a^{2^sd}=a^{n-1}=1$ (Fermat) must climb from $1$ or pass through $-1$ before reaching $1$. For composite $n$ the chain can hit $1$ without passing $-1$ (a non-trivial square root of $1$), which Fermat's test cannot see; that is how Carmichael numbers (3.11) are unmasked. A group-theoretic counting argument over the primes dividing $n$ bounds the proportion of strong liars by $1/4$. Miller (1976) used the same test deterministically under the generalized Riemann hypothesis; Rabin (1980) made it probabilistic and unconditional. Repeated squaring (algo-2.12) computes each chain quickly.`,
      caption: String.raw`Pick $n$ and a base $a$. The strip shows the squaring chain $a^d,a^{2d},\dots,a^{n-1}$ modulo $n$ (green $=1$, gold $=-1$); a gold cell before the end or a $1$ at the start means the base is a liar. The grid colours every base: green strong liars; red witnesses that Fermat's test also catches ($a^{n-1}\not\equiv1$); gold witnesses that pass Fermat's test ($a^{n-1}\equiv1$) and are exposed only by the square-root chain. Try $n=561$ (a Carmichael number: no red among coprime bases, nearly all gold) and $n=2047$; red plus gold always exceeds three quarters. For primes everything is green.`,
      deps: ['nt-3.11', 'algo-2.12'],
      refs: ['Hardy–Wright §6.14'],
      tags: ['primality test', 'probabilistic'],
      credit: 'G. L. Miller, 1976 (deterministic under GRH); M. O. Rabin, 1980 (probabilistic)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test' },
      viz(v) {
        const N = v.slider('odd $n$', 5, 5001, 561, { int: true });
        const A = v.slider('base $a$', 2, 5000, 2, { int: true });
        const PRESET = [561, 1105, 1729, 2047, 2465, 2821, 3277, 4033, 4681];
        v.button('next tricky composite', () => { const cur = N.value; N.set(PRESET.find((c) => c > cur) || PRESET[0]); });
        const rnd = v.rng(7);
        v.button('random base', () => { const n = N.value | 1; A.set(2 + Math.floor(rnd() * (n - 3))); });
        const S = v.stage({ x: [0, 10], y: [0, 3], axes: false, height: 340, title: 'squaring chain $a^d, a^{2d},\\dots,a^{n-1} \\pmod n$' });
        const G = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 340, title: 'all bases: strong liar (green), witness (red), witness that fools Fermat (gold)' });
        let info = {};
        v.render(() => {
          let n = N.value; if (n % 2 === 0) n += 1;
          const a = 2 + ((A.value - 2) % (n - 3));
          const { d, s, chain, liar } = strongChain(a, n);
          const m = chain.length;
          S.setView([0, S.width], [0, S.height]);
          const cs = Math.min(110, (S.width - 20) / m), x00 = (S.width - cs * m) / 2;
          chain.forEach((val, i) => {
            const x0 = x00 + i * cs, col = val === 1 ? 'green' : val === n - 1 ? 'gold' : 'blue';
            S.rect(x0 + 2, S.height * 0.25, x0 + cs - 2, S.height * 0.75, { fill: col, fillAlpha: 0.4, color: col, width: 1.5 });
            S.text(String(val), x0 + cs / 2, S.height * 0.55, { align: 'center', baseline: 'middle', size: Math.min(15, cs * 0.3), weight: 700, color: 'ink' });
            S.text(i === 0 ? `a^d` : i === m - 1 ? 'a^(n−1)' : `a^(2^${i}·d)`, x0 + cs / 2, S.height * 0.88, { align: 'center', size: Math.min(11, cs * 0.17), color: 'muted' });
          });
          // grid of all bases
          let w = 0, lf = 0, fermat = 0; const tot = n - 3;
          const pg = pixGrid(G, tot, { pad: 4 });
          for (let b = 2; b <= n - 2; b++) {
            const r = strongChain(b, n), ferm = r.chain[r.chain.length - 1] === 1;
            const col = r.liar ? 'green' : ferm ? 'gold' : 'red'; if (r.liar) lf++; else w++; if (ferm && !r.liar) fermat++;
            const [x0, y0, x1, y1] = pg.cell(b - 2);
            G.rect(x0, y0, x1, y1, { fill: col, fillAlpha: b === a ? 1 : 0.5, stroke: b === a, color: 'ink', width: 2 });
          }
          info = { n, a, d, s, liar, w, lf, tot, fermat, prime: isPrime(n) };
        });
        v.readout(() => {
          const { n, a, d, s, liar, w, lf, tot, fermat, prime } = info;
          return `$n=${n}$ (${prime ? 'prime' : 'composite'}), $n-1=2^{${s}}\\cdot${d}$. Base $a=${a}$: **${liar ? 'passes (liar or prime)' : 'witness: composite'}**.\nOver all ${tot} bases $2\\le a\\le n-2$: ${w} witnesses (${v.fix((100 * w) / tot, 1)}%), ${lf} pass; ${fermat} of the witnesses would have fooled Fermat's test. ${prime ? 'A prime: every base passes.' : `Passing bases: ${v.fix((100 * lf) / (n - 1), 1)}% of $1..n-1$ (bound: at most 25%).`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Lucas–Lehmer test for Mersenne primes',
      statement: String.raw`Let $p$ be an odd prime and $M_p=2^p-1$. Define $s_0=4$, $s_{i+1}=s_i^2-2$. Then $M_p$ is prime if and only if $s_{p-2}\equiv0\pmod{M_p}$.`,
      idea: String.raw`Work in the ring $\Z[\sqrt3]$ modulo $M_p$ with $\omega=2+\sqrt3$, so $\omega^{-1}=2-\sqrt3$ and, by induction, $s_i=\omega^{2^i}+\omega^{-2^i}$ (squaring $\omega^{2^i}+\omega^{-2^i}$ gives $s_i^2-2$, which doubles the exponent). Then $s_{p-2}\equiv0$ says $\omega^{2^{p-1}}\equiv-1$, so $\omega$ has multiplicative order exactly $2^p$. If $M_p$ were composite with smallest prime factor $q$, the order of $\omega$ in a group of at most $q^2-1$ units would be at most $q^2-1\le M_p$, far below $2^p$ — impossible (this is where the order of an element, 3.1, bounds things). Conversely, when $M_p$ is prime, $3$ is a non-residue and $2$ a residue modulo $M_p$ (quadratic reciprocity, Chapter 4), and Euler's criterion in $\Z[\sqrt3]/M_p$ then forces $\omega^{2^{p-1}}\equiv-1$; this direction is only sketched here.`,
      caption: String.raw`Choose the exponent $p$. The dots are the residues $s_i/M_p\in[0,1)$, a seemingly random walk that, for a Mersenne prime, lands exactly on $0$ at the last step $i=p-2$ (green ring); otherwise it ends elsewhere (red). The grid lists every prime $p\le127$ (click one); green cells are the Mersenne exponents the test finds. $p=11$ ends nonzero: $2^{11}-1=2047=23\cdot89$. The readout also factors $M_p$ with an independent routine when it is small enough.`,
      deps: ['nt-3.1'],
      refs: ['Hardy–Wright §15.5'],
      tags: ['Mersenne', 'primality test'],
      credit: 'É. Lucas, 1878 (test proposed); D. H. Lehmer, 1930s (proof and refinement)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lucas%E2%80%93Lehmer_primality_test' },
      viz(v) {
        const P = v.slider('exponent $p$ (largest prime $\\le$ value)', 3, 127, 11, { int: true });
        const MAXP = 127;
        const ps = []; for (let p = 3; p <= MAXP; p++) if (isPrime(p)) ps.push(p);
        const run = (p) => { const M = (1n << BigInt(p)) - 1n; let s = 4n; const seq = [s]; for (let i = 0; i < p - 2; i++) { s = (s * s - 2n) % M; seq.push(s); } return { M, seq, zero: s === 0n }; };
        const res = new Map(); ps.forEach((p) => res.set(p, run(p).zero));
        const W = v.stage({ x: [-1, 10], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'step $i$', ylabel: '$s_i / M_p$', title: 'the Lucas–Lehmer sequence' });
        const G = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 340, title: 'prime exponents $p\\le127$: green = test says $M_p$ prime' });
        let sel = 11, pg = null;
        G.onClick((x, y) => { if (!pg) return; const i = pg.at(x, y); if (i >= 0) { sel = ps[i]; P.set(sel); } });
        let info = {};
        v.render(() => {
          const p = primeAtMost(Math.max(3, P.value)); sel = p;
          const { M, seq, zero } = run(p);
          W.setView([-1, p - 1], [-0.05, 1.05]);
          W.setTicks(null, [[0, '0'], [0.5, '0.5'], [1, '1']]);
          seq.forEach((s, i) => { const y = Number((s * 10000n) / M) / 10000; W.dot(i, y, { r: i === seq.length - 1 ? 7 : 3.6, color: i === seq.length - 1 ? (zero ? 'green' : 'red') : 'blue', hollow: i === seq.length - 1 && zero, width: 2.4 }); if (i) { const yy = Number((seq[i - 1] * 10000n) / M) / 10000; W.line(i - 1, yy, i, y, { color: 'faint', width: 0.8 }); } });
          pg = pixGrid(G, ps.length, { pad: 4 });
          ps.forEach((q, i) => { const [x0, y0, x1, y1] = pg.cell(i), ok = res.get(q); G.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, { fill: ok ? 'green' : 'faint', fillAlpha: ok ? 0.55 : 0.12, stroke: q === p, color: 'orange', width: 2.5 }); G.text(String(q), (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', baseline: 'middle', size: Math.min(14, pg.cs * 0.38), weight: ok ? 700 : 400, color: ok ? 'ink' : 'faint' }); });
          let cross = null;
          if (p <= 79) cross = v.M.isPrime(M) ? 'prime' : 'composite';
          let fx = null; if (!zero && p <= 67) fx = v.M.factor(M).map(([q, e]) => String(q) + (e > 1n ? '^' + e : '')).join(' × ');
          info = { p, zero, M, last: seq[seq.length - 1], cross, fx, agree: ps.filter((q) => q <= 79).every((q) => res.get(q) === v.M.isPrime((1n << BigInt(q)) - 1n)), list: ps.filter((q) => res.get(q)) };
        });
        v.readout(() => {
          const { p, zero, M, last, cross, fx, agree, list } = info;
          const Ms = p <= 30 ? String(M) : `2^{${p}}-1`;
          return `$p=${p}$: $s_{${p - 2}}\\bmod M_p=${last === 0n ? '0' : (p <= 31 ? String(last) : 'nonzero')}$ ⇒ **$M_p$ is ${zero ? 'prime' : 'composite'}**${fx ? ` ($M_p=${fx}$)` : ''}${cross ? `; independent check: ${cross}` : ''}.\nTest agrees with an independent primality routine for all $p\\le79$: **${agree}**. Exponents $\\le127$ it accepts: $${list.join(', ')}$.`;
        });
      },
    },
  ],
};
