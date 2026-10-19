// Abstract Algebra (Judson) — Chapter 7: Introduction to Cryptography
// Part 1 (this file): the shift code, private-key versus public-key systems, breaking a shift code by letter
// frequencies, and the affine code (7.1–7.3).
// Part 2 (ch07-b.js): the matrix (Hill) cipher, one-way functions, RSA and signatures with RSA (7.4–7.5a).
import { ABC, ENG, m26, gcdN, invMod, UNITS26, mapText, counts26, abcTicks, powmod, lettersOnly } from './ch07.shared.js';

const clean = (t) => String(t).toUpperCase().replace(/[^A-Z ]/g, '');
const SAMPLES = {
  short: 'WHY DID IT FAIL',
  medium: 'THE LETTER E APPEARS MORE OFTEN THAN ANY OTHER LETTER IN ENGLISH',
  long: 'THE FREQUENCY OF LETTERS IN ENGLISH IS FAR FROM UNIFORM AND THE LETTER E APPEARS MORE OFTEN THAN ANY OTHER SO A CIPHER THAT REPLACES EACH LETTER BY ANOTHER LETTER ALWAYS THE SAME ONE KEEPS THE SHAPE OF THE HISTOGRAM AND ONLY SLIDES IT ALONG THE ALPHABET',
};

export default {
  collection: 'alg',
  chapter: 7,
  title: 'Introduction to Cryptography',
  summary: String.raw`Classical private-key systems — shift codes, affine codes and matrix ciphers — are built from modular arithmetic and broken by counting letter frequencies. Public-key cryptography separates the encryption key from the decryption key; the RSA system realises the idea with Euler’s theorem and the difficulty of factoring, and the same arithmetic lets a sender sign a message.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Concept',
      name: 'Shift code (Caesar cipher)',
      statement: String.raw`Number the letters $A=0,\dots,Z=25$. For a key $k\in\mathbb Z_{26}$ the **shift code** encrypts a letter $p$ as $c=p+k \pmod{26}$ and decrypts by $p=c-k \pmod{26}$. Encryption is a bijection of $\mathbb Z_{26}$ for every key, so there are exactly $26$ keys (one of them, $k=0$, leaves the message unchanged). Julius Caesar is traditionally reported to have used $k=3$.`,
      idea: String.raw`Congruence classes mod $26$ (1.30) make the alphabet a clock face: adding $k$ turns the clock by $k$ places, and subtracting $k$ turns it back, so encryption and decryption are inverse rotations. Because the key is a single element of the additive group $\mathbb Z_{26}$ that must be known to both parties, this is a *private-key* system; with only 26 keys it can be broken by trying them all.`,
      caption: String.raw`Slide $k$ to rotate the inner ring; the gold spoke shows what the selected letter (click any letter on the outer ring) becomes. Type a message to encrypt it, or switch to *Decrypt* and paste a ciphertext. Set $k=3$ for Caesar’s code, $k=13$ for ROT13 (its own inverse).`,
      deps: ['alg-1.30'],
      see: ['crypto-1.3'],
      refs: ['Judson §7.1'],
      tags: ['cryptography', 'modular arithmetic'],
      credit: 'Julius Caesar',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Caesar_cipher' },
      viz(v) {
        const mode = v.select('Mode', ['Encrypt', 'Decrypt'], 'Encrypt');
        const kS = v.slider('Key $k$', 0, 25, 3, { int: true });
        const msg = v.input('Message', 'ATTACK AT DAWN', { width: 240 });
        const s = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 400 });
        let sel = 7;
        const ang = (j) => Math.PI / 2 - (2 * Math.PI * j) / 26;
        s.onClick((x, y) => {
          if (Math.hypot(x, y) < 0.45) return;
          sel = m26(Math.round(((Math.PI / 2 - Math.atan2(y, x)) / (2 * Math.PI)) * 26));
        });
        const enc = () => mode.value === 'Encrypt';
        v.render(() => {
          const k = kS.value, e = enc();
          s.circle(0, 0, 1.0, { color: 'faint' });
          s.circle(0, 0, 0.68, { color: 'faint' });
          for (let j = 0; j < 26; j++) {
            const a = ang(j), c = Math.cos(a), d = Math.sin(a);
            const inner = ABC[m26(e ? j + k : j - k)];
            s.line(0.68 * c, 0.68 * d, 1.0 * c, 1.0 * d, { color: 'grid', width: 1 });
            s.text(ABC[j], 1.17 * c, 1.17 * d, { size: 16, color: j === sel ? 'gold' : 'accent', align: 'center', baseline: 'middle' });
            s.text(inner, 0.84 * c, 0.84 * d, { size: 16, color: j === sel ? 'gold' : 'orange', align: 'center', baseline: 'middle' });
          }
          const a = ang(sel);
          s.line(0.68 * Math.cos(a), 0.68 * Math.sin(a), 1.0 * Math.cos(a), 1.0 * Math.sin(a), { color: 'gold', width: 3 });
          s.text(e ? 'plaintext' : 'ciphertext', 0, 0.12, { size: 12, color: 'accent', align: 'center' });
          s.text(e ? 'ciphertext' : 'plaintext', 0, -0.1, { size: 12, color: 'orange', align: 'center' });
          s.text(`k = ${k}`, 0, -0.32, { size: 14, color: 'ink', align: 'center' });
        });
        v.readout(() => {
          const k = kS.value, e = enc(), t = clean(msg.value).slice(0, 80);
          const out = mapText(t, (p) => m26(e ? p + k : p - k));
          const j = sel, o = m26(e ? j + k : j - k);
          return String.raw`Selected: $${ABC[j]}=${j}\ \mapsto\ ${j}${e ? '+' : '-'}${k}\equiv ${o}\pmod{26}$, i.e. $${ABC[o]}$.` + '\n' + `**${t || '(empty)'}** → **${out || '(empty)'}**` + '\n' + String.raw`Key space: $|\mathbb Z_{26}|=26$ keys${k === 0 ? ' — $k=0$ hides nothing' : ''}${k === 13 ? ' — $13+13\\equiv 0$, so ROT13 undoes itself' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.1a
    {
      num: '7.1a',
      kind: 'Definition',
      name: 'Cryptosystems: private key and public key',
      statement: String.raw`A **cryptosystem** consists of a set of plaintexts, a set of ciphertexts, a set of keys, an encryption rule $E_K$ and a decryption rule $D_{K'}$ with $D_{K'}(E_K(x))=x$ for every plaintext $x$. In a **private-key** (symmetric) system the decrypting key $K'$ is the same as, or easily computed from, the encrypting key $K$, so the key must be kept secret by both parties. In a **public-key** system the encrypting key may be published because computing $K'$ from $K$ is believed to be computationally infeasible.`,
      idea: String.raw`The dividing line is not the shape of the algorithm but who must know what. For a shift code, anybody who learns the encrypting key $k$ learns the decrypting key $-k$ at once, so the key has to travel to the receiver secretly. A public-key system breaks this link with a one-way function (7.4a): publishing $E_K$ costs nothing because inverting it appears to require a hard computation such as factoring (7.5).`,
      caption: String.raw`Switch between the two kinds of system and move the letter slider. Then let Eve learn the encrypting key: against the shift code she recovers the plaintext instantly; against the toy RSA key she is left needing the factors of $n$ (the trial-division count is shown; a real $n$ has hundreds of digits).`,
      deps: [],
      refs: ['Judson ch. 7'],
      tags: ['cryptography', 'keys'],
      scope: String.raw`The public-key half uses the textbook toy key $n=3233=53\cdot 61$, $E=17$, $D=2753$ — far too small to be secure, and plain RSA without padding is not secure in practice either.`,
      viz(v) {
        const kind = v.select('System', [{ value: 'priv', label: 'private key (shift code)' }, { value: 'pub', label: 'public key (toy RSA)' }], 'priv');
        const x = v.slider('Plaintext letter', 0, 25, 7, { int: true });
        const eve = v.toggle('Eve learns the encrypting key', false);
        const s = v.stage({ x: [0, 10], y: [0, 5.2], axes: false, height: 330 });
        const N = 3233, E = 17, D = 2753, k = 3;
        const box = (cx, cy, w, h, label, col, sub) => {
          s.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, { color: col, fill: col, fillAlpha: 0.1, radius: 8 });
          s.text(label, cx, cy + (sub ? 0.18 : 0), { size: 12, color: col, align: 'center', baseline: 'middle' });
          if (sub) s.text(sub, cx, cy - 0.28, { size: 11, color: 'ink', align: 'center', baseline: 'middle' });
        };
        v.render(() => {
          const priv = kind.value === 'priv', p = x.value;
          const c = priv ? m26(p + k) : powmod(p, E, N);
          const back = priv ? m26(c - k) : powmod(c, D, N);
          const cy = 2.1;
          box(1, cy, 1.7, 1.5, 'plaintext', 'accent', priv ? ABC[p] + ' = ' + p : String(p));
          box(3, cy, 1.5, 1.0, 'encrypt', 'ink');
          box(5, cy, 1.7, 1.5, 'ciphertext', 'orange', priv ? ABC[c] + ' = ' + c : String(c));
          box(7, cy, 1.5, 1.0, 'decrypt', 'ink');
          box(9, cy, 1.7, 1.5, 'plaintext', 'green', priv ? ABC[back] + ' = ' + back : String(back));
          for (const xx of [1.95, 3.8, 5.95, 7.8]) s.arrow(xx - 0.2 + (xx > 5 ? 0 : 0), cy, xx + 0.45, cy, { color: 'muted' });
          // keys
          if (priv) {
            box(3, 4.1, 1.5, 0.8, 'key k = 3', 'purple');
            box(7, 4.1, 1.5, 0.8, 'key −k', 'purple');
            s.line(3.8, 4.1, 6.2, 4.1, { color: 'purple', dash: true });
            s.text('same secret', 5, 4.45, { size: 11, color: 'purple', align: 'center' });
          } else {
            box(3, 4.1, 1.5, 0.8, 'public E, n', 'green');
            box(7, 4.1, 1.5, 0.8, 'private D', 'red');
            s.text('published', 3, 4.75, { size: 11, color: 'green', align: 'center' });
            s.text('kept secret', 7, 4.75, { size: 11, color: 'red', align: 'center' });
          }
          s.arrow(3, 3.65, 3, 2.65, { color: priv ? 'purple' : 'green' });
          s.arrow(7, 3.65, 7, 2.65, { color: priv ? 'purple' : 'red' });
          // Eve
          s.text('Eve listens here', 5, 0.7, { size: 12, color: 'red', align: 'center' });
          s.arrow(5, 1.0, 5, 1.3, { color: 'red' });
          if (eve.value) {
            s.rect(2.3, 0.1, 7.7, 0.45, { color: 'red', fill: 'red', fillAlpha: 0.08 });
            s.text(priv ? 'decrypting key = −k: found at once' : 'needs D: must factor n first', 5, 0.28, { size: 11, color: 'red', align: 'center', baseline: 'middle' });
          }
        });
        v.readout(() => {
          const priv = kind.value === 'priv', p = x.value;
          if (priv) {
            const c = m26(p + 3);
            return String.raw`Shift code, $k=3$: $E_k(${p})=${p}+3=${c}$, $D_{k'}(${c})=${c}-3=${p}$ with $k'=-k\equiv 23$.` + (eve.value ? `\nEve, knowing $k=3$, writes down $k'=-3$ and reads the plaintext **${ABC[p]}** immediately: *one key, no secret left*.` : '\nBoth parties must hold the same key, which has to be delivered secretly.');
          }
          const c = powmod(p, 17, N);
          let steps = 0; for (let d = 3; d <= 53; d += 2) { steps++; if (N % d === 0) break; }
          return String.raw`Toy RSA, $n=${N}$, $E=17$: $E(${p})=${p}^{17}\bmod ${N}=${c}$; with $D=2753$: $${c}^{2753}\bmod ${N}=${powmod(c, 2753, N)}$.` + (eve.value ? `\nEve knows $(n,E)=(3233,17)$ but not $D$; she must factor $n$: trial division needs **${steps}** divisions to find $53$, then $\\varphi(n)=52\\cdot 60=3120$ and $D=17^{-1}\\bmod 3120$. Trivial here — hopeless for a 600-digit $n$.` : '\nAnyone may encrypt with the published $(n,E)$; only the holder of $D$ can decrypt.');
        });
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Concept',
      name: 'Breaking a shift code by letter frequencies',
      statement: String.raw`A shift code replaces every occurrence of a plaintext letter by the same ciphertext letter, so the histogram of the ciphertext is the histogram of the plaintext cyclically shifted by the key $k$. Since English letters occur with very uneven frequencies ($E$, $T$, $A$ most often), the shift can be found as the one for which the shifted ciphertext histogram best matches the English one — without trying decryptions by hand. The method needs a long enough text to have English-like statistics.`,
      idea: String.raw`Encryption acts on the multiset of letters by the permutation $j\mapsto j+k$, so the count vector $(n_0,\dots,n_{25})$ is rotated cyclically. Scoring every rotation $g$ by the correlation $\sum_j f_{j+g}\,e_j$ with the English frequencies $e_j$ turns key recovery into finding a maximum among 26 numbers. For short texts the sampling noise in $f$ is larger than the gap between the best and second-best rotation, and the attack can fail.`,
      caption: String.raw`The bars are the English frequencies; the orange line is the ciphertext histogram slid left by your guess $g$. Drag $g$ until the peaks align (or press *Best match*), then read the decrypted text. Choose *short* text (12 letters: it is a deliberately unlucky sample whose own statistics are unlike English): the correlation chart (right) picks the wrong shift for every key.`,
      deps: ['alg-7.1'],
      see: ['crypto-1.6'],
      refs: ['Judson §7.1'],
      tags: ['cryptography', 'frequency analysis'],
      scope: String.raw`Works for monoalphabetic ciphers on texts long enough to resemble the language’s statistics. The English table is the commonly quoted published one, rounded.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frequency_analysis' },
      viz(v) {
        const len = v.select('Text length', [{ value: 'short', label: 'short (12 letters)' }, { value: 'medium', label: 'medium (53)' }, { value: 'long', label: 'long (207)' }], 'long');
        const key = v.slider('True key $k$ (secret)', 0, 25, 11, { int: true });
        const g = v.slider('Guess $g$', 0, 25, 0, { int: true });
        const s = v.stage({ x: [0, 26], y: [0, 18], axes: 'box', gutter: true, height: 300, ylabel: '% of letters', xticks: abcTicks, title: 'letter frequencies, ciphertext slid left by $g$' });
        const t = v.stage({ x: [0, 26], y: [0, 1.1], axes: 'box', gutter: true, height: 300, ylabel: 'match score', xlabel: 'guess $g$', title: 'correlation with English for every shift', xticks: [[0.5, '0'], [5.5, '5'], [10.5, '10'], [15.5, '15'], [20.5, '20'], [25.5, '25']] });
        let st = null;
        const calc = () => {
          const pt = lettersOnly(SAMPLES[len.value]), ct = mapText(pt, (p) => m26(p + key.value));
          const n = counts26(ct), tot = n.reduce((a, b) => a + b, 0);
          const f = n.map((c) => (100 * c) / tot);
          const score = Array.from({ length: 26 }, (_, gg) => ENG.reduce((a, e, j) => a + e * f[m26(j + gg)], 0));
          const order = [...score.keys()].sort((a, b) => score[b] - score[a]);
          st = { pt, ct, f, score, best: order[0], second: order[1], ratio: score[order[0]] / score[order[1]] };
        };
        v.button('Best match', () => { calc(); g.set(st.best); });
        v.render(() => {
          calc();
          s.bars(ENG, { x0: 0.5, dx: 1, color: 'accent' });
          const pts = Array.from({ length: 26 }, (_, j) => [j + 0.5, st.f[m26(j + g.value)]]);
          s.path(pts, { color: 'orange', width: 2.5 });
          s.dots(pts, { color: 'orange', r: 3 });
          const mx = Math.max(...st.score);
          t.bars(st.score.map((x) => x / mx), { x0: 0.5, dx: 1, color: (x, i) => (i === st.best ? 'green' : i === g.value ? 'gold' : 'faint') });
          if (!st.shown) st.shown = true;
        });
        v.legend([['accent', 'English'], ['orange', 'ciphertext, shifted', { dot: true }], ['green', 'best shift'], ['gold', 'your guess']]);
        v.readout(() => {
          const dec = mapText(st.ct, (c) => m26(c - g.value));
          const ok = st.best === key.value;
          return `Ciphertext: **${st.ct.slice(0, 60)}${st.ct.length > 60 ? '…' : ''}**` + '\n' + `Decrypted with $g=${g.value}$: **${dec.slice(0, 60)}${dec.length > 60 ? '…' : ''}**` + '\n' + String.raw`Best-scoring shift: $${st.best}$ (the true key is $${key.value}$: ${ok ? '**recovered**' : '**missed — the text is too short for the statistics**'}). Best/second-best score ratio $${st.ratio.toFixed(3)}$ (the closer to 1, the less decisive).`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3',
      kind: 'Concept',
      name: 'Affine cryptosystem',
      statement: String.raw`For $a,b\in\mathbb Z_{26}$ the **affine code** is $f(p)=ap+b\pmod{26}$. The map $f$ is a permutation of $\mathbb Z_{26}$ (so it can be decrypted) if and only if $\gcd(a,26)=1$, i.e. $a$ is a unit of $\mathbb Z_{26}$; then $f^{-1}(c)=a^{-1}(c-b)$. The allowed multipliers are $1,3,5,7,9,11,15,17,19,21,23,25$ — twelve of them — so there are $12\cdot26=312$ keys.`,
      idea: String.raw`Adding $b$ is a rotation. Multiplying by $a$ is injective exactly when $a$ has an inverse mod $26$ (3.11a): if $\gcd(a,26)=d>1$ then $a\cdot(26/d)\equiv0=a\cdot 0$, so two plaintext letters collide and no decryption can tell them apart. When $\gcd(a,26)=1$ the Euclidean algorithm gives $a^{-1}$ and $f^{-1}$.`,
      caption: String.raw`Choose $a$ and $b$. Each arrow joins a plaintext letter (top) to its ciphertext letter (bottom). Green arrows: the target is hit once. Red arrows: two letters collide on a ciphertext letter (shown in red), and ciphertext letters that no arrow reaches are dimmed — the code cannot be decrypted. Try $a=13$ or $a=2$.`,
      deps: ['alg-7.1', 'alg-3.11a'],
      see: ['crypto-1.5'],
      refs: ['Judson §7.1'],
      tags: ['cryptography', 'units'],
      viz(v) {
        const a = v.slider('Multiplier $a$', 0, 25, 7, { int: true });
        const b = v.slider('Shift $b$', 0, 25, 3, { int: true });
        const msg = v.input('Message', 'AFFINE CODES', { width: 220 });
        const s = v.stage({ x: [-0.2, 26.2], y: [-0.8, 1.8], axes: false, height: 280 });
        let info = null;
        v.render(() => {
          const A = a.value, B = b.value, hit = Array(26).fill(0);
          for (let p = 0; p < 26; p++) hit[m26(A * p + B)]++;
          info = { hit, perm: hit.every((h) => h === 1), image: hit.filter((h) => h > 0).length };
          for (let p = 0; p < 26; p++) {
            const c = m26(A * p + B), bad = hit[c] > 1;
            s.line(p + 0.5, 1.27, c + 0.5, 0.08, { color: bad ? 'red' : 'green', width: 1.6, alpha: 0.8 });
            s.text(ABC[p], p + 0.5, 1.4, { size: 12, color: 'accent', align: 'center', baseline: 'middle' });
          }
          for (let c = 0; c < 26; c++) s.text(ABC[c], c + 0.5, -0.05, { size: 12, color: hit[c] > 1 ? 'red' : hit[c] === 0 ? 'faint' : 'orange', align: 'center', baseline: 'middle' });
          s.text('plaintext p', 13, 1.8, { size: 12, color: 'accent', align: 'center' });
          s.text('ciphertext ap + b', 13, -0.6, { size: 12, color: 'orange', align: 'center' });
        });
        v.readout(() => {
          const A = a.value, B = b.value, d = gcdN(A, 26), inv = invMod(A, 26);
          const t = clean(msg.value).slice(0, 60);
          let line;
          if (d === 1) {
            const c = mapText(t, (p) => m26(A * p + B));
            line = String.raw`Inverse: $a^{-1}=${inv}$, so $p=${inv}(c-${B})\bmod 26$. **${t}** → **${c}** → **${mapText(c, (x) => m26(inv * (x - B)))}**.`;
          } else line = String.raw`No inverse for $a=${A}$: only ${info.image} distinct ciphertext letters occur, so ${26 - info.image} plaintext letters are lost. Decryption is ambiguous.`;
          return String.raw`$\gcd(${A},26)=${d}$ — ${info.perm ? '**permutation of the alphabet**' : '**not one-to-one**'}.` + '\n' + line + '\n' + String.raw`Units mod 26: $\{${UNITS26.join(',')}\}$, so $12\cdot26=312$ affine keys.`;
        });
      },
    },
  ],
};
