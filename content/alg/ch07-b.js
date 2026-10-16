// Abstract Algebra (Judson) — Chapter 7, part 2: the matrix (Hill) cipher, one-way functions, RSA and signatures (7.4–7.5a).
import { ABC, m26, gcdN, invMod, mapText, lettersOnly, powmod, euclidRows, smSteps, SMALL_PRIMES } from './ch07.shared.js';

const WORDS = ['THE', 'AND', 'FOR', 'NOT', 'YES', 'BUY', 'PAY', 'SAY', 'ONE', 'TWO', 'SIX', 'TEN', 'CAT', 'DOG', 'SUN', 'MAN', 'BOY', 'DAY', 'WAY', 'NEW', 'OLD', 'BIG', 'RED', 'GET', 'HAS', 'HER', 'HIS', 'HOW', 'ITS', 'MAY', 'OUR', 'OUT', 'SEE', 'USE', 'WHO', 'ALL', 'ANY', 'CAN', 'HAD', 'NOW', 'TOO', 'WAR', 'SEA', 'AIR', 'ASK', 'END', 'EYE', 'FAR', 'FEW', 'GOD', 'KEY', 'LAW', 'LET', 'LOW', 'MAP', 'OIL', 'PUT', 'RUN', 'SET', 'TOP', 'WIN', 'YET'];
const wordNum = (w) => 676 * ABC.indexOf(w[0]) + 26 * ABC.indexOf(w[1]) + ABC.indexOf(w[2]);
const numWord = (x) => (x < 17576 ? ABC[Math.floor(x / 676)] + ABC[Math.floor(x / 26) % 26] + ABC[x % 26] : null);
const timeText = (sec) => {
  if (sec < 1e-3) return 'under a millisecond';
  if (sec < 1) return `${(sec * 1000).toPrecision(2)} ms`;
  if (sec < 120) return `${sec < 10 ? sec.toFixed(2) : Math.round(sec)} s`;
  if (sec < 7200) return `${Math.round(sec / 60)} min`;
  if (sec < 172800) return `${Math.round(sec / 3600)} h`;
  const yr = sec / 3.156e7;
  if (yr < 1e4) return yr < 2 ? `${Math.round(sec / 86400)} days` : `${yr < 100 ? yr.toFixed(1) : Math.round(yr)} years`;
  return `10^${Math.round(Math.log10(yr) * 10) / 10} years`;
};

export default {
  collection: 'alg',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Concept',
      name: 'Polyalphabetic cipher by a 2 × 2 matrix',
      statement: String.raw`Group the plaintext into pairs of letters, regard each pair as a column vector $\mathbf p=(p_1,p_2)^{\!\top}\in\mathbb Z_{26}^2$, and encrypt with an integer key matrix $A$: $\mathbf c=A\mathbf p \pmod{26}$. Decryption is possible exactly when $A$ is invertible mod $26$, i.e. $\gcd(\det A,26)=1$, and then $\mathbf p=A^{-1}\mathbf c$ with $A^{-1}=(\det A)^{-1}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$ computed mod $26$. Because the cipher letters depend on both letters of a pair, the same plaintext letter is encrypted differently in different places, so single-letter frequency counting no longer applies directly.`,
      idea: String.raw`The pair map $\mathbf p\mapsto A\mathbf p$ is a homomorphism of the group $\mathbb Z_{26}^2$ (matrices over $\mathbb Z_{26}$, as in 3.14). It is a bijection iff it has an inverse matrix, and the adjugate formula for the inverse works over $\mathbb Z_{26}$ as soon as $\det A$ is a unit (7.3). If $\det A$ shares a factor with $26$, the images of the 676 pairs overlap and some ciphertext pairs are never produced.`,
      caption: String.raw`Edit the entries of $A$. Left: the 676 plaintext pairs, coloured by the first letter of their ciphertext pair; the gold point is the chosen pair of your message. Right: the ciphertext plane — a cell is blue if exactly one pair lands on it, red if several do, empty if none. With $\gcd(\det A,26)=1$ every cell is blue; set $\det A$ even and holes and collisions appear.`,
      deps: ['alg-7.3', 'alg-3.14'],
      refs: ['Judson §7.1'],
      tags: ['cryptography', 'matrices'],
      credit: 'Lester S. Hill, “Cryptography in an Algebraic Alphabet”, Amer. Math. Monthly 36 (1929), 306–312 (the Hill cipher)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hill_cipher' },
      viz(v) {
        const A = [v.slider('$a$', 0, 25, 3, { int: true }), v.slider('$b$', 0, 25, 3, { int: true }), v.slider('$c$', 0, 25, 2, { int: true }), v.slider('$d$', 0, 25, 5, { int: true })];
        const msg = v.input('Message', 'HELP ME NOW', { width: 220 });
        const pick = v.slider('Pair #', 1, 6, 1, { int: true });
        const L = v.stage({ x: [0, 26], y: [0, 26], axes: 'box', gutter: true, height: 300, xlabel: 'first letter', ylabel: 'second letter', title: 'plaintext pairs', xticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']], yticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']] });
        const R = v.stage({ x: [0, 26], y: [0, 26], axes: 'box', gutter: true, height: 300, xlabel: 'first cipher letter', ylabel: 'second', title: 'ciphertext pairs: how many plaintext pairs land here', xticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']], yticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']] });
        let info = null;
        v.render(() => {
          const [a, b, c, d] = A.map((x) => x.value);
          const det = m26(a * d - b * c), unit = gcdN(det, 26) === 1;
          const img = (p1, p2) => [m26(a * p1 + b * p2), m26(c * p1 + d * p2)];
          const cnt = Array.from({ length: 26 }, () => Array(26).fill(0));
          for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) { const [u, w] = img(i, j); cnt[u][w]++; }
          const letters = lettersOnly(msg.value).slice(0, 24);
          const padded = letters.length % 2 ? letters + 'X' : letters;
          const pairs = []; for (let i = 0; i + 1 < padded.length; i += 2) pairs.push([ABC.indexOf(padded[i]), ABC.indexOf(padded[i + 1])]);
          const sel = Math.min(pairs.length, pick.value) - 1;
          const key = `${a},${b},${c},${d}`;
          L.raster((x, y) => { const i = Math.floor(x), j = Math.floor(y); if (i < 0 || j < 0 || i > 25 || j > 25) return null; return v.ramp(img(i, j)[0] / 25, 'accent'); }, { res: 3, key: 'L' + key });
          R.raster((x, y) => { const i = Math.floor(x), j = Math.floor(y); if (i < 0 || j < 0 || i > 25 || j > 25) return null; const n = cnt[i][j]; return n === 0 ? null : n === 1 ? v.rgb('blue').slice(0, 3) : v.rgb('red').slice(0, 3); }, { res: 3, key: 'R' + key });
          L.axes(); R.axes();
          pairs.forEach((p, i) => { L.dot(p[0] + 0.5, p[1] + 0.5, { r: i === sel ? 6 : 3.5, color: i === sel ? 'gold' : 'ink' }); const q = img(...p); R.dot(q[0] + 0.5, q[1] + 0.5, { r: i === sel ? 6 : 3.5, color: i === sel ? 'gold' : 'ink' }); });
          const image = cnt.flat().filter((n) => n > 0).length;
          info = { a, b, c, d, det, unit, pairs, padded, image, sel };
        });
        v.readout(() => {
          const { a, b, c, d, det, unit, pairs, padded, image, sel } = info;
          const encPairs = pairs.map((p) => { const q = [m26(a * p[0] + b * p[1]), m26(c * p[0] + d * p[1])]; return ABC[q[0]] + ABC[q[1]]; });
          const cipher = encPairs.join('');
          let line = String.raw`$\det A=${a * d - b * c}\equiv ${det}\pmod{26}$, $\gcd(${det},26)=${gcdN(det, 26)}$ — ${unit ? '**invertible**' : '**not invertible**: only ' + image + ' of 676 ciphertext pairs occur'}.`;
          if (unit) {
            const di = invMod(det, 26), ia = m26(di * d), ib = m26(-di * b), ic = m26(-di * c), id = m26(di * a);
            const back = encPairs.map((e) => { const x = ABC.indexOf(e[0]), y = ABC.indexOf(e[1]); return ABC[m26(ia * x + ib * y)] + ABC[m26(ic * x + id * y)]; }).join('');
            line += '\n' + String.raw`$A^{-1}=${di}\begin{pmatrix}${d}&${m26(-b)}\\${m26(-c)}&${a}\end{pmatrix}\equiv\begin{pmatrix}${ia}&${ib}\\${ic}&${id}\end{pmatrix}$; applying it to the ciphertext returns **${back}** ${back === padded ? '(= the padded plaintext ✓)' : '(≠ plaintext)'}.`;
          }
          const repeated = padded.length >= 2 && new Set(padded).size < padded.length;
          return line + '\n' + `**${padded.match(/../g)?.join(' ') ?? ''}** → **${encPairs.join(' ')}**` + (repeated ? ' — repeated letters get different ciphertext letters when their partners differ.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 7.4a
    {
      num: '7.4a',
      kind: 'Concept',
      name: 'Public-key cryptography and one-way functions',
      statement: String.raw`A public-key system rests on a **one-way function**: a map $f$ that anyone can evaluate quickly but whose inverse cannot be computed in practice without extra secret information (a *trapdoor*). The standard example is $x\mapsto x^{E}\bmod n$ with $n=pq$ a product of two large primes: evaluation takes about $\log_2E$ multiplications mod $n$, whereas inverting it with no knowledge of the factors of $n$ is believed to be as hard as factoring $n$. That a function is one-way has not been *proved*; it is a belief backed by the failure of the best known algorithms.`,
      idea: String.raw`Square-and-multiply (4.28) makes evaluation cost grow like a power of the number of digits $d$ (about $17d^2$ digit operations for $E=65537$). Undoing it by trying all messages costs about $n/2$ evaluations, and finding a factor of $n$ by trial division costs about $\sqrt n$ steps — both grow exponentially in $d$. Cleverer factoring algorithms exist and are far faster than trial division, but still outgrow evaluation fast enough that a few hundred digits are out of reach.`,
      caption: String.raw`The slider sets the number of digits of $n=pq$ (two primes of about equal size). Blue: the work to evaluate $x^{65537}\bmod n$ (counted from a real BigInt run). Orange: trial division for the smaller prime factor (measured by actually running it up to 14 digits, extrapolated beyond). Red: brute force over all $x$. The time estimate assumes $10^9$ digit-operations per second — an assumption, not a benchmark.`,
      deps: ['alg-7.1a'],
      see: ['crypto-9.4', 'crypto-6.1'],
      refs: ['Judson §7.2'],
      tags: ['cryptography', 'complexity'],
      scope: String.raw`Illustrates the cost gap for the simplest attacks (trial division, exhaustive search); the number field sieve and other subexponential factoring algorithms are faster than trial division and are not drawn here.`,
      viz(v) {
        const dS = v.slider('Digits of $n$', 4, 40, 12, { int: true });
        const s = v.stage({ x: [4, 40], y: [1, 1e26], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'digits of n', ylabel: 'digit operations' });
        const memo = new Map();
        const nextPrime = (x) => { x = x % 2n === 0n ? x + 1n : x; while (!v.M.isPrime(x)) x += 2n; return x; };
        const keyFor = (d) => {
          if (memo.has(d)) return memo.get(d);
          const h = Math.floor(d / 2), p = nextPrime(3n * 10n ** BigInt(Math.max(h - 1, 0))), q = nextPrime(7n * 10n ** BigInt(Math.max(d - h - 1, 0)));
          const n = p * q;
          // evaluation: count the modular multiplications square-and-multiply really performs
          let mults = 0, r = 1n, b = 123456789n % n; for (let e = 65537n; e > 0n; e >>= 1n) { if (e & 1n) { r = (r * b) % n; mults++; } b = (b * b) % n; mults++; }
          const digits = n.toString().length, fwd = mults * digits * digits;
          const trial = (Number(p) - 1) / 2 * digits, brute = (Number(n) / 2) * fwd;
          const o = { p, q, n, mults, digits, fwd, trial, brute, measured: null };
          if (n < 9000000000000000n) { const nn = Number(n); let c = 0; for (let t = 3; t <= nn; t += 2) { c++; if (nn % t === 0) break; } o.measured = c; }
          memo.set(d, o); return o;
        };
        v.render(() => {
          const ds = []; for (let d = 4; d <= 40; d++) ds.push(d);
          s.path(ds.map((d) => [d, keyFor(d).fwd]), { color: 'accent', width: 2.5 });
          s.path(ds.map((d) => [d, keyFor(d).trial]), { color: 'orange', width: 2.5 });
          s.path(ds.map((d) => [d, keyFor(d).brute]), { color: 'red', width: 2.5 });
          const k = keyFor(dS.value);
          s.vline(dS.value, { color: 'gold', alpha: 0.7 });
          s.dot(dS.value, k.fwd, { color: 'accent', r: 5 }); s.dot(dS.value, k.trial, { color: 'orange', r: 5 }); s.dot(dS.value, k.brute, { color: 'red', r: 5 });
        });
        v.legend([['accent', 'evaluate $x^E \\bmod n$'], ['orange', 'factor n by trial division'], ['red', 'invert by trying every $x$']]);
        v.readout(() => {
          const k = keyFor(dS.value), rate = 1e9;
          return String.raw`$n=${k.p}\times${k.q}$ has ${k.digits} digits. Evaluation: ${k.mults} modular multiplications ≈ $${v.sci(k.fwd, 2)}$ digit-ops (${timeText(k.fwd / rate)}).` + '\n' + String.raw`Trial division: smallest factor $${k.p}$ needs ${k.measured != null ? `**${k.measured.toLocaleString('en')}** divisions (measured)` : '≈ ' + (Number(k.p) / 2).toExponential(1) + ' divisions (extrapolated)'} ≈ $${v.sci(k.trial, 2)}$ digit-ops (${timeText(k.trial / rate)}).` + '\n' + String.raw`Trying every $x$: ≈ $${v.sci(k.brute, 2)}$ digit-ops (${timeText(k.brute / rate)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Algorithm',
      name: 'RSA cryptosystem',
      statement: String.raw`Choose distinct primes $p,q$; put $n=pq$ and $\varphi(n)=(p-1)(q-1)$; choose $E$ with $\gcd(E,\varphi(n))=1$ and find $D$ with $ED\equiv1\pmod{\varphi(n)}$ by the Euclidean algorithm. Publish $(n,E)$ and keep $D$ secret. A message $x\in\{0,\dots,n-1\}$ is encrypted as $y=x^{E}\bmod n$ and decrypted as $y^{D}\bmod n=x$. Correctness is Euler’s theorem: $x^{ED}=x^{1+k\varphi(n)}\equiv x\pmod n$ (for $x$ coprime to $n$, and in fact for every $x$ when $n$ is a product of distinct primes).`,
      idea: String.raw`Since $ED=1+k\varphi(n)$, Euler’s theorem (6.18) gives $x^{ED}\equiv x$ whenever $\gcd(x,n)=1$; for the few $x$ divisible by $p$ or $q$ the same congruence holds modulo each prime separately by Fermat (6.19) and combines by the Chinese remainder theorem. $D$ is found by the extended Euclidean algorithm (2.10), and $x^E$ is computed by repeated squaring (4.28). The security rests on the difficulty of recovering $\varphi(n)$, equivalently the factors of $n$, from $n$ alone.`,
      caption: String.raw`Pick primes $p,q$ and an exponent $E$. Left: the encryption map $x\mapsto x^E\bmod n$ for all $x$ — a scrambled permutation. Right: encrypt then decrypt every $x$; correct points sit on the diagonal, failures are red. Break it: choose $E$ sharing a factor with $\varphi(n)$ (no $D$ exists, and the left map stops being one-to-one) or set $q=p$ (the formula $(p-1)(q-1)$ is then the wrong $\varphi$).`,
      deps: ['alg-7.4a', 'alg-6.18', 'alg-2.10', 'alg-4.28'],
      see: ['crypto-9.6'],
      refs: ['Judson §7.2'],
      tags: ['cryptography', 'RSA'],
      credit: 'Rivest, Shamir & Adleman, Commun. ACM 21(2) (1978), 120–126; the same scheme was found earlier, in secret, by Clifford Cocks at GCHQ (1973) and became public decades later',
      verify: true,
      scope: String.raw`Textbook RSA with tiny primes, for understanding only; real use needs primes of hundreds of digits and randomized padding.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/RSA_cryptosystem' },
      viz(v) {
        const pI = v.slider('Prime $p$ (index)', 0, SMALL_PRIMES.length - 1, 4, { int: true });
        const qI = v.slider('Prime $q$ (index)', 0, SMALL_PRIMES.length - 1, 7, { int: true });
        const eS = v.slider('Exponent $E$', 2, 199, 7, { int: true });
        const xS = v.slider('Message $x$', 0, 200, 42, { int: true });
        const mk = (extra) => ({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, ...extra });
        const L = v.stage(mk({ xlabel: 'x', ylabel: 'x^E mod n', title: 'encrypt: x ↦ x^E mod n' }));
        const R = v.stage(mk({ xlabel: 'x', ylabel: 'decrypt(encrypt(x))', title: 'decrypt after encrypt' }));
        let info = null;
        v.render(() => {
          const p = SMALL_PRIMES[pI.value], q = SMALL_PRIMES[qI.value], n = p * q, phi = (p - 1) * (q - 1), E = eS.value;
          const g = gcdN(E, phi), D = g === 1 ? invMod(E % phi, phi) : null;
          const x = xS.value % n, y = powmod(x, E, n);
          const enc = Array.from({ length: n }, (_, i) => powmod(i, E, n));
          const imgCount = new Set(enc).size;
          let fails = 0; const dec = D != null ? enc.map((c, i) => { const r = powmod(c, D, n); if (r !== i) fails++; return r; }) : null;
          L.setView([0, n], [0, n]); R.setView([0, n], [0, n]);
          L.dots(enc.map((c, i) => [i, c]), { color: 'accent', r: 1.6 });
          L.dot(x, y, { color: 'gold', r: 6, label: 'x → ' + y, labelPos: 'ne' });
          if (dec) { R.dots(dec.map((c, i) => [i, c]).filter(([i, c]) => c === i), { color: 'green', r: 1.6 }); R.dots(dec.map((c, i) => [i, c]).filter(([i, c]) => c !== i), { color: 'red', r: 2.4 }); }
          else R.text('no D exists: gcd(E, φ) > 1', n / 2, n / 2, { size: 14, color: 'red', align: 'center' });
          info = { p, q, n, phi, E, g, D, x, y, imgCount, fails, back: D != null ? powmod(y, D, n) : null };
        });
        v.readout(() => {
          const { p, q, n, phi, E, g, D, x, y, imgCount, fails, back } = info;
          const rows = euclidRows(phi, E % phi || phi);
          const sm = smSteps(E);
          let l1 = String.raw`$p=${p},\ q=${q}$, $n=${n}$, $\varphi=(p-1)(q-1)=${phi}$, $E=${E}$ ($=${sm.bits}_2$: ${sm.squarings} squarings and ${sm.multiplies} multiplications).`;
          if (p === q) l1 += String.raw` **$p=q$**: the true $\varphi(p^2)=p(p-1)=${p * (p - 1)}\ne(p-1)(q-1)$.`;
          let l2;
          if (D == null) l2 = String.raw`$\gcd(E,\varphi)=${g}>1$: no $D$ with $ED\equiv1$. Only ${imgCount} of ${n} messages have distinct encryptions — information is lost.`;
          else l2 = 'Euclid: ' + rows.map((r) => String.raw`$${r.a}=${r.q}\cdot${r.b}+${r.r}$`).join(', ') + String.raw` ⟹ $D=${D}$ (check $E D=${E * D}\equiv ${(E * D) % phi}\pmod{${phi}}$).`;
          const l3 = D == null ? '' : String.raw`$x=${x}$: $y=x^{E}\bmod n=${y}$; $y^{D}\bmod n=${back}$ ${back === x ? '✓' : '✗'}. Decryption correct for ${n - fails} of ${n} messages${fails ? ` (**${fails} fail**)` : ''}.`;
          return [l1, l2, l3].filter(Boolean).join('\n');
        });
      },
    },
    // ------------------------------------------------------------------ 7.5a
    {
      num: '7.5a',
      kind: 'Algorithm',
      name: 'Message verification with RSA',
      statement: String.raw`Alice has public key $(n_A,E_A)$ and secret exponent $D_A$; Bob has $(n_B,E_B)$ and $D_B$, with $n_A<n_B$. To send a message $x<n_A$ with proof of origin, Alice computes the **signature** $s=x^{D_A}\bmod n_A$ (only she can) and sends $c=s^{E_B}\bmod n_B$. Bob recovers $s=c^{D_B}\bmod n_B$ and then $x=s^{E_A}\bmod n_A$, using Alice’s public key. If $x$ is a meaningful message, it can only have come from the holder of $D_A$. Without the signing step anybody can send a ciphertext to Bob, since his encrypting key is public.`,
      idea: String.raw`RSA's two operations commute and invert each other: $(x^{D_A})^{E_A}\equiv x$ as well as $(x^{E})^{D}\equiv x$ (Euler, 6.18). Signing applies the *private* exponent, so verification with the public exponent works for everybody. A forger who changes $c$ or builds one from scratch produces a number which Bob maps to an essentially random value mod $n_A$; the chance that it is a meaningful message is tiny, which is why the message must carry redundancy (here: it must be a word from a small dictionary).`,
      caption: String.raw`Pick a word, then tamper in transit: change a digit of the ciphertext, or let Eve send her own word. Bob’s verification (is the result a dictionary word?) passes only for the honest message. Switch off the signature and Eve’s forged word is accepted — encryption alone proves nothing about the sender.`,
      deps: ['alg-7.5'],
      see: ['crypto-10.1'],
      refs: ['Judson §7.2'],
      tags: ['cryptography', 'signatures'],
      scope: String.raw`Toy keys ($n_A=17947$, $n_B=20711$) and a hand-made 62-word dictionary stand in for real redundancy; practical signatures sign a hash of the message with padding, never the raw message.`,
      viz(v) {
        const word = v.select('Message', ['BUY', 'PAY', 'YES', 'NOT', 'SAY'], 'BUY');
        const signed = v.toggle('Alice signs', true);
        const attack = v.select('In transit', [{ value: 'none', label: 'honest' }, { value: 'flip', label: 'one digit changed' }, { value: 'eve', label: 'Eve sends her word' }], 'none');
        const s = v.stage({ x: [0, 10], y: [0, 5], axes: false, height: 330 });
        const mkKey = (p, q, E) => { const n = p * q, phi = (p - 1) * (q - 1); return { n, E, D: invMod(E, phi), p, q }; };
        const KA = mkKey(131, 137, 7), KB = mkKey(139, 149, 5);
        const box = (cx, cy, w, h, top, bot, col) => {
          s.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, { color: col, fill: col, fillAlpha: 0.1, radius: 8 });
          s.text(top, cx, cy + 0.2, { size: 11, color: col, align: 'center', baseline: 'middle' });
          s.text(bot, cx, cy - 0.22, { size: 12, color: 'ink', align: 'center', baseline: 'middle' });
        };
        let info = null;
        v.render(() => {
          const w = word.value, x = wordNum(w), sg = signed.value;
          const sA = sg ? powmod(x, KA.D, KA.n) : x;
          const c0 = powmod(sA, KB.E, KB.n);
          const eveX = wordNum('PAY') === x ? wordNum('NOT') : wordNum('PAY');
          const c = attack.value === 'flip' ? (c0 % 10 === 0 ? c0 + 1 : c0 - 1) : attack.value === 'eve' ? powmod(eveX, KB.E, KB.n) : c0;
          const sB = powmod(c, KB.D, KB.n);
          const xB = sg ? powmod(sB, KA.E, KA.n) : sB;
          const wd = numWord(xB), ok = wd != null && WORDS.includes(wd);
          info = { w, x, sA, c0, c, sB, xB, wd, ok, sg };
          s.text('Alice', 5, 4.75, { size: 13, color: 'accent', align: 'center' });
          box(1.2, 3.8, 1.9, 1.0, 'message x', `${w} = ${x}`, 'accent');
          box(4, 3.8, 1.9, 1.0, sg ? 's = x^D_A mod n_A' : '(no signing)', String(sA), 'purple');
          box(6.9, 3.8, 1.9, 1.0, 'c = s^E_B mod n_B', String(c0), 'orange');
          s.arrow(2.2, 3.8, 3.0, 3.8, { color: 'muted' }); s.arrow(5.0, 3.8, 5.9, 3.8, { color: 'muted' });
          s.arrow(7.9, 3.4, 8.5, 3.05, { color: 'muted' });
          s.text('Bob', 5, 0.3, { size: 13, color: 'green', align: 'center' });
          const tamper = attack.value !== 'none';
          box(8.9, 2.55, 1.9, 1.0, tamper ? 'c received (altered)' : 'c received', String(c), tamper ? 'red' : 'orange');
          box(6.4, 1.3, 1.9, 1.0, 's = c^D_B mod n_B', String(sB), 'purple');
          box(3.6, 1.3, 1.9, 1.0, sg ? 'x = s^E_A mod n_A' : '(no verifying)', String(xB), 'accent');
          box(1.0, 1.3, 1.7, 1.0, ok ? 'accepted' : 'REJECTED', wd ?? 'not a word', ok ? 'green' : 'red');
                    s.arrow(8.9, 2.05, 7.35, 1.5, { color: 'muted' }); s.arrow(5.45, 1.3, 4.55, 1.3, { color: 'muted' }); s.arrow(2.65, 1.3, 1.9, 1.3, { color: 'muted' });
        });
        v.readout(() => {
          const { w, x, sA, c, sB, xB, wd, ok, sg } = info;
          return String.raw`Alice $(n_A,E_A,D_A)=(${KA.n},${KA.E},${KA.D})$, Bob $(n_B,E_B,D_B)=(${KB.n},${KB.E},${KB.D})$; letters are numbered in base 26, so ${w} is $x=${x}<n_A$.` + '\n' + String.raw`Bob obtains $${xB}$ ${wd ? `= **${wd}**` : '(≥ 17576, not even a 3-letter block)'} → ${ok ? `valid word${sg ? ', verified as Alice’s' : ' — but with no signature he cannot tell who sent it'}` : '**not a word: message rejected**'}.` + (attack.value === 'eve' && ok && !sg ? '\nEve has forged a message.' : '');
        });
      },
    },
  ],
};
