// Abstract Algebra (Judson) — Chapter 7, part 2: the matrix (Hill) cipher, one-way functions, RSA and signatures (7.4–7.5a).
import { ABC, m26, gcdN, invMod, mapText, lettersOnly, powmod, euclidRows, smSteps, SMALL_PRIMES, hillPair, hillInverse, rsaExample, signatureDemo, SIGN_KEYS } from './ch07.shared.js';

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
      statement: String.raw`Group the plaintext into pairs of letters, regard each pair as a column vector $\mathbf p=(p_1,p_2)^{\!\top}\in\mathbb Z_{26}^2$, and encrypt with an integer key matrix $A$ and fixed offset $\mathbf b$: $\mathbf c=A\mathbf p+\mathbf b \pmod{26}$. Decryption is possible exactly when $A$ is invertible mod $26$, i.e. $\gcd(\det A,26)=1$, and then $\mathbf p=A^{-1}(\mathbf c-\mathbf b)$ with $A^{-1}=(\det A)^{-1}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$ computed mod $26$. For a mixing matrix, a cipher letter can depend on both letters of a pair. Single-letter frequencies alone then lose the simple substitution pattern. This is a polygraphic cipher; identity or diagonal keys do not mix both letters. Judson’s Example 7.4 uses $A=\begin{pmatrix}3&5\\1&2\end{pmatrix}$ and $\mathbf b=(2,2)^\top$, giving HELP $\mapsto$ RRGR.`,
      idea: String.raw`The linear part $\mathbf p\mapsto A\mathbf p$ is a homomorphism of the group $\mathbb Z_{26}^2$ (matrices over $\mathbb Z_{26}$, as in 3.14). It is a bijection iff it has an inverse matrix, and the adjugate formula for the inverse works over $\mathbb Z_{26}$ as soon as $\det A$ is a unit (7.3). Adding the offset translates the image without changing invertibility. If $\det A$ shares a factor with $26$, the images of the 676 pairs overlap and some ciphertext pairs are never produced.`,
      caption: String.raw`Edit $A$ and the two offset entries. The initial values reproduce HELP $\mapsto$ RRGR; use offset zero for the linear Hill variant. Left: the 676 plaintext pairs, coloured by the first letter of their ciphertext pair; the gold point is the chosen pair of your message. Right: the ciphertext plane — a cell is blue if exactly one pair lands on it, red if several do, empty if none. With $\gcd(\det A,26)=1$ every cell is blue; set $\det A$ even and holes and collisions appear.`,
      deps: ['alg-7.3', 'alg-3.14'],
      refs: ['Judson §7.1'],
      tags: ['cryptography', 'matrices'],
      credit: 'Lester S. Hill, “Cryptography in an Algebraic Alphabet”, Amer. Math. Monthly 36 (1929), 306–312 (the Hill cipher)',
      links: { doi: 'https://doi.org/10.1080/00029890.1929.11986963', source: 'https://twjudson.github.io/aata-files/aata-20230811.pdf#page=95' },
      viz(v) {
        const A = [v.slider('$a$', 0, 25, 3, { int: true }), v.slider('$b$', 0, 25, 5, { int: true }), v.slider('$c$', 0, 25, 1, { int: true }), v.slider('$d$', 0, 25, 2, { int: true })];
        const offset = [v.slider('Offset $b_1$', 0, 25, 2, { int: true }), v.slider('Offset $b_2$', 0, 25, 2, { int: true })];
        const msg = v.input('Message', 'HELP', { width: 220 });
        const pick = v.slider('Pair #', 1, 12, 1, { int: true });
        const L = v.stage({ x: [0, 26], y: [0, 26], axes: 'box', gutter: true, height: 300, xlabel: 'first letter', ylabel: 'second letter', title: 'plaintext pairs', xticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']], yticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']] });
        const R = v.stage({ x: [0, 26], y: [0, 26], axes: 'box', gutter: true, height: 300, xlabel: 'first cipher letter', ylabel: 'second', title: 'ciphertext pairs: how many plaintext pairs land here', xticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']], yticks: [[0.5, 'A'], [6.5, 'G'], [12.5, 'M'], [18.5, 'S'], [25.5, 'Z']] });
        let info = null;
        v.render(() => {
          const [a, b, c, d] = A.map((x) => x.value);
          const det = m26(a * d - b * c), unit = gcdN(det, 26) === 1;
          const off = offset.map(x => x.value), img = (p1, p2) => hillPair([a,b,c,d], off, [p1,p2]);
          const cnt = Array.from({ length: 26 }, () => Array(26).fill(0));
          for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) { const [u, w] = img(i, j); cnt[u][w]++; }
          const letters = lettersOnly(msg.value).slice(0, 24);
          const padded = letters.length % 2 ? letters + 'X' : letters;
          const pairs = []; for (let i = 0; i + 1 < padded.length; i += 2) pairs.push([ABC.indexOf(padded[i]), ABC.indexOf(padded[i + 1])]);
          const sel = Math.min(pairs.length, pick.value) - 1;
          const key = `${a},${b},${c},${d},${off}`;
          L.raster((x, y) => { const i = Math.floor(x), j = Math.floor(y); if (i < 0 || j < 0 || i > 25 || j > 25) return null; return v.ramp(img(i, j)[0] / 25, 'accent'); }, { res: 3, key: 'L' + key });
          R.raster((x, y) => { const i = Math.floor(x), j = Math.floor(y); if (i < 0 || j < 0 || i > 25 || j > 25) return null; const n = cnt[i][j]; return n === 0 ? null : n === 1 ? v.rgb('blue').slice(0, 3) : v.rgb('red').slice(0, 3); }, { res: 3, key: 'R' + key });
          L.axes(); R.axes();
          pairs.forEach((p, i) => { L.dot(p[0] + 0.5, p[1] + 0.5, { r: i === sel ? 6 : 3.5, color: i === sel ? 'gold' : 'ink' }); const q = img(...p); R.dot(q[0] + 0.5, q[1] + 0.5, { r: i === sel ? 6 : 3.5, color: i === sel ? 'gold' : 'ink' }); });
          const image = cnt.flat().filter((n) => n > 0).length;
          info = { a, b, c, d, off, det, unit, pairs, padded, image, sel };
        });
        v.readout(() => {
          const { a, b, c, d, off, det, unit, pairs, padded, image, sel } = info;
          const encPairs = pairs.map((p) => { const q = hillPair([a,b,c,d], off, p); return ABC[q[0]] + ABC[q[1]]; });
          const cipher = encPairs.join('');
          let line = String.raw`$\det A=${a * d - b * c}\equiv ${det}\pmod{26}$, $\gcd(${det},26)=${gcdN(det, 26)}$ — ${unit ? '**invertible**' : '**not invertible**: only ' + image + ' of 676 ciphertext pairs occur'}.`;
          if (unit) {
            const di = invMod(det, 26), [ia, ib, ic, id] = hillInverse([a,b,c,d]);
            const back = encPairs.map((e) => { const x = ABC.indexOf(e[0]), y = ABC.indexOf(e[1]); return hillPair([ia,ib,ic,id], [0,0], [x-off[0],y-off[1]]).map(z=>ABC[z]).join(''); }).join('');
            line += '\n' + String.raw`$A^{-1}=${di}\begin{pmatrix}${d}&${m26(-b)}\\${m26(-c)}&${a}\end{pmatrix}\equiv\begin{pmatrix}${ia}&${ib}\\${ic}&${id}\end{pmatrix}$; subtracting offset $(${off.join(',')})^\top$ and applying it returns **${back}** ${back === padded ? '(= the padded plaintext ✓)' : '(≠ plaintext)'}.`;
          }
          return line + '\n' + `**${padded.match(/../g)?.join(' ') ?? ''}** → **${encPairs.join(' ')}**` + ' (letters only, at most 24; odd lengths padded with X)' ;
        });
      },
    },
    // ------------------------------------------------------------------ 7.4a
    {
      num: '7.4a',
      kind: 'Concept',
      name: 'Public-key cryptography and one-way functions',
      statement: String.raw`A candidate **one-way function family** is efficiently computable but is assumed hard to invert on typical randomly chosen inputs as the key size grows. A trapdoor permutation additionally has a secret that makes inversion efficient. RSA with distinct primes $p,q$ and $\gcd(E,(p-1)(q-1))=1$ is a candidate: $x\mapsto x^E\bmod pq$ is a permutation, and its secret exponent inverts it. Factoring the modulus suffices to find that exponent. The converse reduction from arbitrary RSA plaintext recovery to factoring is not established; the original RSA paper explicitly leaves it as a conjecture (§IX.D).`,
      idea: String.raw`Repeated squaring takes a number of modular multiplications proportional to the bit length of $E$. Trial division and exhaustive message search grow much faster in the digit length of $n$, but neither is the best general attack. The plot assigns a modular multiplication $d^2$ work units and an odd trial division $d$ units, where $d$ is the modulus's decimal length. These are chosen comparison weights, not measured CPU costs or a security estimate. The loop used here counts 19 multiplications for $E=65537$, including multiplication by the identity and the final unused square; a leading-bit implementation can use 17.`,
      caption: String.raw`Choose the digits of the toy modulus. Blue counts modular multiplications from a BigInt run, weighted by $d^2$; orange weights odd trial divisions by $d$; red weights exhaustive plaintext search. The factors pass the runtime primality test (probable primes, not certificates); their simple generation rule is not secure key generation. Odd trial divisions are actually counted through 14 digits and extrapolated after that. Times assume $10^9$ model units per second. Faster attacks and actual processor costs are outside this comparison.`,
      deps: ['alg-7.1a'],
      see: ['crypto-9.4', 'crypto-6.1'],
      refs: ['Judson §7.2', 'Rivest–Shamir–Adleman (1978), §IX.D'],
      links: { source: 'https://people.csail.mit.edu/rivest/Rsapaper.pdf' },
      tags: ['cryptography', 'complexity'],
      scope: String.raw`Illustrates chosen work models for two elementary attacks, not RSA security or a cryptographic benchmark. The number field sieve and other faster attacks are not drawn. Raw RSA also permits public dictionary tests on small plaintext sets.`,
      viz(v) {
        const dS = v.slider('Digits of $n$', 4, 40, 12, { int: true });
        const s = v.stage({ x: [4, 40], y: [1, 1e26], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'digits of n', ylabel: 'model work units' });
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
          if (digits <= 14) { const nn = Number(n); let c = 0; for (let t = 3; t <= nn; t += 2) { c++; if (nn % t === 0) break; } o.measured = c; }
          memo.set(d, o); return o;
        };
        v.render(() => {
          const ds = []; for (let d = 4; d <= 40; d++) ds.push(d);
          s.setView([4, 40], [1, 2 * Math.max(...ds.map(d => keyFor(d).brute))]);
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
          return String.raw`$n=${k.p}\times${k.q}$ has ${k.digits} digits. Evaluation: ${k.mults} modular multiplications ≈ $${v.sci(k.fwd, 2)}$ model units (${timeText(k.fwd / rate)}).` + '\n' + String.raw`Trial division: smallest factor $${k.p}$ needs ${k.measured != null ? `**${k.measured.toLocaleString('en')}** divisions (measured)` : '≈ ' + (Number(k.p) / 2).toExponential(1) + ' divisions (extrapolated)'} ≈ $${v.sci(k.trial, 2)}$ model units (${timeText(k.trial / rate)}).` + '\n' + String.raw`Trying every $x$: ≈ $${v.sci(k.brute, 2)}$ model units (${timeText(k.brute / rate)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Algorithm',
      name: 'RSA cryptosystem',
      statement: String.raw`Choose distinct primes $p,q$; put $n=pq$ and $\varphi(n)=(p-1)(q-1)$; choose a positive integer $E$ with $\gcd(E,\varphi(n))=1$ and find a positive integer $D$ with $ED\equiv1\pmod{\varphi(n)}$ by the Euclidean algorithm. Publish $(n,E)$ and keep $D$ secret. A message $x\in\{0,\dots,n-1\}$ is encrypted as $y=x^{E}\bmod n$ and decrypted as $y^{D}\bmod n=x$. Correctness is Euler’s theorem: $x^{ED}=x^{1+k\varphi(n)}\equiv x\pmod n$ (for $x$ coprime to $n$, and in fact for every $x$ when $n$ is a product of distinct primes).`,
      idea: String.raw`Since $ED=1+k\varphi(n)$, Euler’s theorem (6.18) gives $x^{ED}\equiv x$ whenever $\gcd(x,n)=1$; for residues divisible by $p$ or $q$ the same congruence holds modulo each prime separately by Fermat (6.19) and combines by the Chinese remainder theorem. $D$ is found by the extended Euclidean algorithm (2.10), and $x^E$ is computed by repeated squaring (4.28). Factoring $n$ reveals $\varphi(n)$ and hence $D$; knowing $\varphi(n)$ also reveals the factors through $p+q=n-\varphi(n)+1$. This does not prove that recovering a plaintext is equivalent to factoring. Raw RSA is deterministic and can leak messages from small dictionaries.`,
      caption: String.raw`Pick primes $p,q$ and an exponent $E$. Left: the encryption map $x\mapsto x^E\bmod n$ for all $x$ — a scrambled permutation. Right: encrypt then decrypt every $x$; correct points sit on the diagonal, failures are red. Break it: choose $E$ sharing a factor with $\varphi(n)$ (no $D$ exists, and the left map stops being one-to-one) or set $q=p$ (the formula $(p-1)(q-1)$ is then the wrong $\varphi$).`,
      deps: ['alg-7.4a', 'alg-6.18', 'alg-2.10', 'alg-4.28'],
      see: ['crypto-9.6'],
      refs: ['Judson §7.2'],
      tags: ['cryptography', 'RSA'],
      credit: 'Rivest, Shamir & Adleman, Commun. ACM 21(2) (1978), 120–126',
      scope: String.raw`Textbook RSA with tiny primes, for understanding only; this is the RSA primitive, not a secure encryption scheme by itself (RFC 8017 §5).`,
      links: { source: 'https://people.csail.mit.edu/rivest/Rsapaper.pdf', textbook: 'https://twjudson.github.io/aata-files/aata-20230811.pdf#page=96', specification: 'https://www.rfc-editor.org/rfc/rfc8017' },
      viz(v) {
        const pI = v.slider('Prime $p$ (index)', 0, SMALL_PRIMES.length - 1, 7, { int: true });
        const qI = v.slider('Prime $q$ (index)', 0, SMALL_PRIMES.length - 1, 8, { int: true });
        const eS = v.slider('Exponent $E$', 2, 997, 487, { int: true });
        const xS = v.slider('Message $x$', 0, 200, 25, { int: true });
        const mk = (extra) => ({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, ...extra });
        const L = v.stage(mk({ xlabel: 'x', ylabel: 'x^E mod n', title: 'encrypt: x ↦ x^E mod n' }));
        const R = v.stage(mk({ xlabel: 'x', ylabel: 'decrypt(encrypt(x))', title: 'decrypt after encrypt' }));
        let info = null;
        v.render(() => {
          const p = SMALL_PRIMES[pI.value], q = SMALL_PRIMES[qI.value], E = eS.value;
          const result = rsaExample(p,q,E), {n,m:phi,g,D,enc,dec,image:imgCount,fails} = result;
          const x = xS.value % n, y = enc[x];
          L.setView([0, n], [0, n]); R.setView([0, n], [0, n]);
          L.dots(enc.map((c, i) => [i, c]), { color: 'accent', r: 1.6 });
          L.dot(x, y, { color: 'gold', r: 6, label: 'x → ' + y, labelPos: 'ne' });
          if (dec) { R.dots(dec.map((c, i) => [i, c]).filter(([i, c]) => c === i), { color: 'green', r: 1.6 }); R.dots(dec.map((c, i) => [i, c]).filter(([i, c]) => c !== i), { color: 'red', r: 2.4 }); }
          else R.text('no inverse exponent modulo m', n / 2, n / 2, { size: 14, color: 'red', align: 'center' });
          info = { p, q, n, phi, E, g, D, x, y, imgCount, fails, back: D != null ? powmod(y, D, n) : null };
        });
        v.readout(() => {
          const { p, q, n, phi, E, g, D, x, y, imgCount, fails, back } = info;
          const rows = euclidRows(phi, E % phi || phi);
          const sm = smSteps(E);
          let l1 = String.raw`$p=${p},\ q=${q}$, $n=${n}$, $m=(p-1)(q-1)=${phi}$${p===q ? ' (not the totient)' : String.raw` $=\varphi(n)$`}, $E=${E}$ ($=${sm.bits}_2$: ${sm.squarings} squarings and ${sm.multiplies} multiplications).`;
          if (p === q) l1 += String.raw` **$p=q$**: the true $\varphi(p^2)=p(p-1)=${p * (p - 1)}\ne(p-1)(q-1)$.`;
          let l2;
          if (D == null) l2 = String.raw`$\gcd(E,m)=${g}>1$: no inverse exponent modulo $m$. The map has ${imgCount} distinct outputs for ${n} messages — information is lost.`;
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
      statement: String.raw`With textbook RSA keys and $n_A<n_B$, Alice can apply her secret exponent to $x<n_A$, producing $s=x^{D_A}\bmod n_A$, then send $c=s^{E_B}\bmod n_B$. Bob recovers $s=c^{D_B}\bmod n_B$ and $x=s^{E_A}\bmod n_A$. This demonstrates the inverse operations and the sign-then-encrypt arithmetic described by Judson. A meaningful recovered word alone does **not** prove who sent it: raw RSA plus a dictionary check is forgeable. Secure RSA signature schemes specify message encoding and a verification rule (RFC 8017 §§5, 8–9).`,
      idea: String.raw`Anyone can choose a candidate signature $s$ and compute $x=s^{E_A}\bmod n_A$ using Alice's public key, then encrypt $s$ for Bob using his public key. Trying candidates until $x$ is a dictionary word produces a pair that passes this toy check without Alice's private exponent. This is an existential forgery: Eve obtains some accepted message, not necessarily an arbitrary preselected one. The public exponent identity is necessary for verification, but this word test is insufficient for authentication.`,
      caption: String.raw`Choose a word and an alteration. Honest arithmetic recovers the selected word. The digit-change and unsigned-word attacks may fail the dictionary check. **Eve searches signatures** instead enumerates candidate signatures using only public keys until a different dictionary word appears; Bob then accepts a word Alice never sent. Turn signing off to see why public encryption alone cannot identify a sender. “Word accepted” is the toy dictionary result, not proof of origin.`,
      deps: ['alg-7.5'],
      see: ['crypto-10.1'],
      refs: ['Judson §7.2, Message Verification', 'RFC 8017 §§5, 8–9'],
      links: { source: 'https://www.rfc-editor.org/rfc/rfc8017' },
      tags: ['cryptography', 'signatures'],
      scope: String.raw`Toy keys ($n_A=17947$, $n_B=20711$) and a hand-made 62-word dictionary demonstrate arithmetic and a forgery; they implement no secure signature scheme.`,
      viz(v) {
        const word = v.select('Message', ['BUY', 'PAY', 'YES', 'NOT', 'SAY'], 'BUY');
        const signed = v.toggle('Alice signs', true);
        const attack = v.select('In transit', [{ value: 'none', label: 'honest' }, { value: 'flip', label: 'one digit changed' }, { value: 'eve', label: 'Eve sends unsigned word' }, { value: 'forge', label: 'Eve searches signatures' }], 'none');
        const s = v.stage({ x: [0, 10], y: [0, 5], axes: false, height: 330 });
        const [KA, KB] = SIGN_KEYS;
        const box = (cx, cy, w, h, top, bot, col) => {
          s.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, { color: col, fill: col, fillAlpha: 0.1, radius: 8 });
          s.text(top, cx, cy + 0.2, { size: 11, color: col, align: 'center', baseline: 'middle' });
          s.text(bot, cx, cy - 0.22, { size: 12, color: 'ink', align: 'center', baseline: 'middle' });
        };
        let info = null;
        v.render(() => {
          const result = signatureDemo(word.value, signed.value, attack.value);
          const {w,x,sg,sA,c0,c,sB,xB,wd,ok} = result;
          info = result;
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
          box(1.0, 1.3, 1.7, 1.0, ok ? 'word accepted' : 'not in dictionary', wd ?? 'not a word', ok ? 'green' : 'red');
                    s.arrow(8.9, 2.05, 7.35, 1.5, { color: 'muted' }); s.arrow(5.45, 1.3, 4.55, 1.3, { color: 'muted' }); s.arrow(2.65, 1.3, 1.9, 1.3, { color: 'muted' });
        });
        v.readout(() => {
          const { w, x, sA, c, sB, xB, wd, ok, sg, trials } = info;
          return String.raw`Alice $(n_A,E_A,D_A)=(${KA.n},${KA.E},${KA.D})$, Bob $(n_B,E_B,D_B)=(${KB.n},${KB.E},${KB.D})$; letters are numbered in base 26, so ${w} is $x=${x}<n_A$.` + '\n' + String.raw`Bob obtains $${xB}$ ${wd ? `= **${wd}**` : '(≥ 17576, not even a 3-letter block)'} → ${ok ? '**word accepted; sender not authenticated by this check**' : '**not a word: message rejected**'}.` + (attack.value === 'forge' && sg ? `\nEve found this accepted word after **${trials}** public candidate-signature tests, without Alice’s private exponent.` : '');
        });
      },
    },
  ],
};
