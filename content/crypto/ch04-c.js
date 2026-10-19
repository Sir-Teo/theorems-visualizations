import { toyModeTamper } from './sources.audit.js';
// Cryptography — Chapter 4, part c (items 4.9–4.12): ECB, CBC/CTR, padding oracle, side channels
import {
  clamp, pixc as pix, mix2, hx, popcnt, feistel8, feistel8inv, aesKeys, aes, aesDec, SBOX, textBitmap, smileyBitmap, bytesHex,
} from './ch04.shared.js';

const printable = (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '·');

export default {
  collection: 'crypto',
  chapter: 4,
  items: [
    // ================================================================== 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'ECB mode leaks patterns',
      statement: String.raw`In **electronic codebook (ECB) mode** a long message is cut into blocks $m_1,\dots,m_t$ and each is encrypted independently with the same key: $c_i=E_k(m_i)$. The scheme is deterministic and stateless, so $m_i=m_j\iff c_i=c_j$: an eavesdropper sees exactly which blocks of the plaintext coincide. By 3.10 any deterministic scheme fails CPA-security, and ECB is not even EAV-secure for messages of two or more blocks (take $m_0=0^{\ell}0^{\ell}$, $m_1=0^{\ell}1^{\ell}$ and test whether $c_1=c_2$). In structured data — images, tables, headers, repeated records — large parts of the structure survive. Modes with a random IV (CBC) or a nonce counter (CTR) do not have this problem.`,
      idea: String.raw`Encryption with a fixed key is a *fixed* permutation of block values, i.e. a substitution cipher on an alphabet of $2^{b}$ symbols; the frequency and equality structure of the plaintext is carried over unchanged. Whether this matters depends on how much of the data repeats at the block level: a flat-coloured image repeats enormously, a photograph with sensor noise barely at all. CBC makes $c_i$ depend on $c_{i-1}$ and so on the whole prefix; CTR XORs a pseudorandom pad that differs for every block — both make equal blocks give independent-looking ciphertexts (3.12).`,
      caption: String.raw`A $64\times48$ picture in which **each pixel is one 8-bit block** (a toy 8-bit block cipher, so one pixel = one block); bytes are drawn with a colour map. Left: the plaintext; right: the ciphertext in the chosen mode. In ECB the outline is plainly visible, merely recoloured. In CBC and CTR the image becomes noise. The slider adds random low-order bits to each plaintext pixel (like sensor noise): the more noise bits, the fewer equal blocks and the less ECB leaks.`,
      scope: String.raw`Toy 8-bit block cipher (a 4-round Feistel network), so equalities of blocks are far more frequent than with a real 128-bit block — real photographs encrypted with AES-ECB leak less, flat regions of diagrams as much. The CTR pad is a hash-mixer idealisation of a pseudorandom function. The effect is classical and was shown on bitmaps in many textbooks.`,
      deps: ['crypto-3.10'],
      tags: ['ECB', 'modes of operation', 'determinism'],
      refs: ['Katz–Lindell §3.6.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Electronic_codebook_(ECB)' },
      viz(v) {
        const W = 64, H = 48;
        const sP = v.stage({ x: [0, W], y: [0, H], equal: true, axes: false, height: 300, title: 'plaintext (each pixel = one block)' });
        const sC = v.stage({ x: [0, W], y: [0, H], equal: true, axes: false, height: 300, title: 'ciphertext' });
        const img = v.select('Picture', [{ value: 'smile', label: 'smiley' }, { value: 'text', label: 'text' }], 'smile');
        const mode = v.select('Mode', ['ECB', 'CBC', 'CTR'], 'ECB');
        const nb = v.slider('random low bits per pixel', 0, 8, 0, { step: 1, int: true });
        let seed = 1; v.button('New key', () => { seed += 1; });
        let key = '', D = null;
        v.render(() => {
          const kk = [img.value, nb.value, seed].join();
          if (kk !== key) {
            key = kk;
            const mask = img.value === 'smile' ? smileyBitmap(W, H) : textBitmap('ECB', W, H, 3), mk = (1 << nb.value) - 1;
            const p = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) p[i] = ((mask[i] ? 0xC8 : 0x28) & ~mk & 255) | (mix2(seed + 5, i) & mk);
            const k = mix2(seed, 99) & 0xffff, c = { ECB: new Uint8Array(W * H), CBC: new Uint8Array(W * H), CTR: new Uint8Array(W * H) };
            let prev = mix2(seed, 7) & 255;
            for (let i = 0; i < W * H; i++) { c.ECB[i] = feistel8(k, p[i]); c.CBC[i] = feistel8(k, p[i] ^ prev); prev = c.CBC[i]; c.CTR[i] = p[i] ^ (mix2(k, 1000 + i) & 255); }
            const stat = (a) => { const s = new Set(a); let eq = 0; for (let y = 0; y < H; y++) for (let x = 0; x + 1 < W; x++) if (a[y * W + x] === a[y * W + x + 1]) eq++; return { distinct: s.size, eq: eq / (H * (W - 1)) }; };
            D = { p, c, sp: stat(p), sc: { ECB: stat(c.ECB), CBC: stat(c.CBC), CTR: stat(c.CTR) } };
          }
          const col = (b) => v.M.cmap(b / 255, 'viridis');
          sP.raster((x, y) => col(D.p[(H - 1 - Math.floor(clamp(y, 0, H - 0.01))) * W + Math.floor(clamp(x, 0, W - 0.01))]), { res: 2, key: key + 'p' });
          const cc = D.c[mode.value];
          sC.raster((x, y) => col(cc[(H - 1 - Math.floor(clamp(y, 0, H - 0.01))) * W + Math.floor(clamp(x, 0, W - 0.01))]), { res: 2, key: key + 'c' + mode.value });
        });
        v.readout(() => {
          const s = D.sc[mode.value];
          return String.raw`Plaintext: ${D.sp.distinct} distinct block values among ${W * H} blocks; horizontally adjacent blocks are equal in **${v.fix(100 * D.sp.eq, 0)}%** of the pairs.` + '\n' +
            String.raw`${mode.value} ciphertext: ${s.distinct} distinct values; adjacent blocks equal in **${v.fix(100 * s.eq, 1)}%** (random bytes: 0.4%).` + (mode.value === 'ECB' && D.sp.eq > 0.2 ? ' The equality pattern is the picture.' : '');
        });
      },
    },

    // ================================================================== 4.10
    {
      num: '4.10',
      kind: 'Algorithm',
      name: 'CBC and counter modes',
      statement: String.raw`For a block cipher $E_k$ on $b$-bit blocks, **CBC** sets $c_0=\mathrm{IV}$ and $c_i=E_k(m_i\oplus c_{i-1})$, and decrypts $m_i=E_k^{-1}(c_i)\oplus c_{i-1}$. The IV must be unpredictable before the plaintext is chosen; an independent uniform IV is a sufficient choice. **CTR** uses distinct counter input blocks $T_i$ and sets $c_i=m_i\oplus F_k(T_i)$, decrypting with the same XOR. Counter blocks must be unique **across all blocks of all messages under a key**, including prevention of wrap/reuse; unique starting values alone do not exclude overlapping ranges. With efficient constructions, appropriate superpolynomial block spaces and polynomial usage, secure PRPs give CPA-secure random-IV CBC; a secure PRF gives nonce-respecting CPA-secure CTR on disjoint counter inputs. CBC's bounds include birthday terms; substituting a PRP for the CTR PRF also incurs a switching term. Neither mode alone authenticates. A CTR ciphertext-bit flip flips exactly that plaintext bit. A CBC ciphertext-block change produces an uncontrolled nonzero change in its plaintext block, and the same XOR difference in the next block when present.`,
      idea: String.raw`Distinct CTR inputs to a random function yield independent pads; a PRF reduction carries this to computational confidentiality. Reusing an input reuses a pad, revealing an XOR of plaintexts. CBC's fresh unpredictable IV prevents an adversary from arranging the first cipher input by cancelling a predicted IV. Its proof replaces the block cipher by a random function through switching and bounds collisions among internal inputs. These are security reductions under explicit usage assumptions, whereas the diagram checks only decryption and tampering identities. NIST SP 800-38A specifies the operations and IV/counter requirements; Boneh–Shoup supplies the security proofs.`,
      caption: String.raw`Type a message: the first six **UTF-8 bytes** are shown as toy one-byte blocks (empty input uses A). Change mode, ciphertext/header block and bit. Red plaintext cells differ after tampering. In CTR a payload-bit flip affects exactly one bit; changing its counter header may alter multiple pads, with collisions possible. In CBC, changing the IV flips only the corresponding bit of the first plaintext block; a payload change affects that block and, when present, the same bit of the next. The block slider adapts to the actual byte count.`,
      scope: String.raw`Tampering illustration with an exhaustible 8-bit Feistel permutation and a deterministic non-cryptographic hash mixer for CTR pads; neither is a secure primitive or an ideal PRF. The toy counter wraps modulo 256 and is unsuitable for repeated-key use. No authentication, padding or production encryption is implemented. Specification: NIST SP 800-38A §§6.2,6.5, Appendices B,C,D; asymptotic proofs: Boneh–Shoup v0.6 Theorems 5.3–5.4 and nonce-based CTR §5.5.2.`,
      deps: ['crypto-3.12'],
      tags: ['CBC', 'CTR', 'modes of operation'],
      refs: ['NIST SP 800-38A (2001), §§6.2,6.5, Appendices B–D', 'Boneh–Shoup v0.6, §§5.4.2–5.4.3, Theorems 5.3–5.4; §5.5.2 nonce-based CTR'],
      credit: 'NIST SP 800-38A (2001), specification; Boneh–Shoup v0.6, security reductions',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation', 'NIST SP 800-38A': 'https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf', 'Boneh–Shoup v0.6': 'https://crypto.stanford.edu/~dabo/cryptobook/BonehShoup_0_6.pdf' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const msg = v.input('Message', 'PAY 10', { width: 160 });
        const mode = v.select('Mode', ['CBC', 'CTR'], 'CBC');
        const jS = v.slider('tamper with block', 0, 6, 1, { step: 1, int: true });
        const bS = v.slider('flip bit', 0, 7, 0, { step: 1, int: true });
        let seed = 1; v.button('New key & IV', () => { seed += 1; });
        const D = (k, y) => feistel8inv(k, y);
        let info = null;
        v.render(() => {
          const m = Array.from(new TextEncoder().encode(msg.value || 'A').slice(0, 6)), t = m.length, text = m.map(printable).join('');
          const k = mix2(seed, 5) & 0xffff, iv = mix2(seed, 17) & 255, cbc = mode.value === 'CBC';
          jS.input.max = String(t); if (jS.value > t) jS.set(t);
          const j = jS.value, bit = bS.value;
          const { c, c2, m2 } = toyModeTamper(m, k, iv, cbc, j, bit);
          const P = pix(sD), Wd = P.W, nbk = t + 1, cw = Math.min(110, (Wd - 30) / nbk), x0 = (Wd - nbk * cw) / 2;
          const bx = (x, y, w, h, txt, col, on = true, sz = 12) => { P.rect(x, y, w, h, { fill: col, fillAlpha: on ? 0.14 : 0.05, color: col, width: on ? 1.6 : 1, radius: 6 }); P.text(txt, x + w / 2, y + h / 2, { size: sz, weight: 700, color: col, halo: false }); };
          P.text(cbc ? 'CBC encryption:  c_i = E_k(m_i ⊕ c_{i−1})' : 'CTR encryption:  c_i = m_i ⊕ F_k(ctr + i)', 10, 12, { size: 12.5, weight: 700, color: 'ink', align: 'left', halo: false });
          for (let i = 0; i <= t; i++) {
            const x = x0 + i * cw + 3, w = cw - 6;
            if (i === 0) { bx(x, 28, w, 26, cbc ? 'IV = ' + hx(iv) : 'ctr = ' + hx(iv), 'purple'); continue; }
            if (cbc) { bx(x, 28, w, 26, 'm' + i + ' = ' + printable(m[i - 1]), 'accent'); P.text('⊕', x + w / 2, 66, { size: 14, color: 'ink', halo: false }); P.arrow(x + w / 2, 54, x + w / 2, 60, { color: 'ink', width: 1.3 }); bx(x, 76, w, 24, 'E_k', 'orange', true); P.arrow(x + w / 2, 72, x + w / 2, 76, { color: 'ink', width: 1.3 }); P.arrow(x - 4, 66, x + w / 2 - 8, 66, { color: 'purple', width: 1.3 }); }
            else { bx(x, 28, w, 26, 'ctr+' + i, 'purple'); bx(x, 62, w, 24, 'F_k', 'orange', true); P.arrow(x + w / 2, 54, x + w / 2, 62, { color: 'ink', width: 1.3 }); P.text('⊕ m' + i + ' = ' + printable(m[i - 1]), x + w / 2, 100, { size: 11, color: 'accent', weight: 700, halo: false }); P.arrow(x + w / 2, 86, x + w / 2, 91, { color: 'ink', width: 1.3 }); }
          }
          const yc = 122;
          P.text('ciphertext (hex)', 10, yc - 8, { size: 11.5, color: 'orange', weight: 700, align: 'left', halo: false });
          for (let i = 0; i <= t; i++) { const x = x0 + i * cw + 3, w = cw - 6, hit = i === j; bx(x, yc, w, 26, (i === 0 ? (cbc ? 'IV ' : 'ctr ') : 'c' + i + ' ') + hx(c2[i]), hit ? 'red' : 'orange', true, 12); if (hit) P.text(`bit ${bit} flipped`, x + w / 2, yc + 40, { size: 11, color: 'red', weight: 700, halo: false }); }
          const yd = 208;
          P.text('decryption of the tampered ciphertext (red = differs from the original message)', 10, yd - 12, { size: 11.5, color: 'green', weight: 700, align: 'left', halo: false });
          let dmg = 0;
          for (let i = 1; i <= t; i++) { const x = x0 + i * cw + 3, w = cw - 6, bad = m2[i - 1] !== m[i - 1]; if (bad) dmg++; bx(x, yd, w, 38, `${printable(m2[i - 1])}  (${hx(m2[i - 1])})`, bad ? 'red' : 'green', true, 13); P.text(bad ? `Δ = ${(m2[i - 1] ^ m[i - 1]).toString(2).padStart(8, '0')}` : 'unchanged', x + w / 2, yd + 52, { size: 10.5, color: bad ? 'red' : 'muted', halo: false, weight: bad ? 700 : 400 }); }
          P.text(`plaintext  ${text}   →   tampered result  ${m2.map(printable).join('')}`, Wd / 2, 296, { size: 13, weight: 700, color: 'ink', halo: false });
          info = { dmg, t, j, cbc, bit, m, m2, c, c2, k, iv };
        });
        v.readout(() => {
          const i = info; if (!i) return '';
          const pos = i.j === 0 ? (i.cbc ? 'the IV' : 'the counter value') : `ciphertext block $c_${i.j}$`;
          return String.raw`Flipping bit ${i.bit} of ${pos} changes **${i.dmg}** of the ${i.t} plaintext block${i.t > 1 ? 's' : ''}` + (i.cbc ? (i.j === 0 ? ': the first block gets exactly that bit flipped (the attacker controls it).' : i.j < i.t ? String.raw`: block $m_${i.j}$ has an uncontrolled nonzero change, and $m_${i.j + 1}$ gets exactly the flipped bit — a chosen change.` : String.raw`: only block $m_${i.j}$, and it has an uncontrolled nonzero change.`) : (i.j === 0 ? ': a changed counter header can alter all pad positions, but toy pad collisions may leave some bytes unchanged.' : String.raw`: only $m_${i.j}$, and exactly bit ${i.bit} — a chosen change.`)) + ' Neither mode detects tampering.';
        });
      },
    },

    // ================================================================== 4.11
    {
      num: '4.11',
      kind: 'Algorithm',
      name: 'Padding-oracle attack on CBC',
      statement: String.raw`Let CBC-mode encryption (4.10) pad the message with $p$ bytes of value $p$ ($1\le p\le16$, PKCS#7) and let a server decrypt incoming ciphertexts and reply with one bit — **padding valid** or **invalid** — even indirectly (an error message, a timing difference). Then an attacker who sees a ciphertext $c_0\|c_1\|\cdots\|c_t$ can recover the whole plaintext **without the key**, using at most $256$ oracle queries per byte. For block $c_j$ with intermediate value $I=E_k^{-1}(c_j)$ (so that $m_j=I\oplus c_{j-1}$) the attacker submits $c'\|c_j$ for chosen $c'$: the server decrypts to $I\oplus c'$, and learns whether the end of that string is a valid padding. Choosing the last byte of $c'$ until the answer is “valid” yields $I_{16}$, hence $m_{j,16}=I_{16}\oplus c_{j-1,16}$; then the second-to-last byte, and so on.`,
      idea: String.raw`CBC decryption is $m_j=E_k^{-1}(c_j)\oplus c_{j-1}$, and the attacker can alter $c_{j-1}$ at will, i.e. XOR any difference into $m_j$ while $I=E_k^{-1}(c_j)$ stays fixed. The server's check leaks one bit about $I\oplus c'$: for the last byte exactly one of $256$ guesses $g$ makes $I_{16}\oplus g=\mathtt{01}$ (valid padding), which reveals $I_{16}=g\oplus\mathtt{01}$. Having $I_{16}$ the attacker sets the last byte to produce $\mathtt{02}$ and searches the next byte for a valid $\mathtt{02\,02}$, and so on: $16$ bytes cost about $16\cdot128$ queries. The cure is to authenticate first and give no distinguishable error: encrypt-then-MAC (5.17) means a forged $c'$ is rejected before decryption, with the same response whatever the padding. This was Vaudenay's 2002 observation, and it later broke real SSL/TLS and web frameworks.`,
      caption: String.raw`The attacker sees a CBC-AES ciphertext of the chosen message and only an oracle “padding OK / bad”. Press play: the attack runs and the plaintext appears byte by byte (gold = the byte now being attacked, with the current guess; the strip shows the latest oracle answers). The staircase at the bottom counts queries against recovered bytes — the slope is about $128$ queries per byte. Switch the server to **uniform errors** (a MAC is checked first): every query fails, the attack learns nothing and stops after $256$ queries.`,
      scope: String.raw`Exact AES-128 CBC with PKCS#7 padding, random key and IV per run; the attack is the textbook one (with the usual extra check for the last byte, which can look valid for a two-byte padding). The oracle is simulated. Real attacks also need the attacker to be able to submit modified ciphertexts and observe the response (POODLE 2014, Lucky Thirteen 2013 are descendants).`,
      deps: ['crypto-4.10'],
      tags: ['padding oracle', 'CBC', 'chosen-ciphertext attack'],
      refs: ['Katz–Lindell §5.1.1'],
      credit: 'S. Vaudenay, “Security flaws induced by CBC padding — applications to SSL, IPSEC, WTLS …”, EUROCRYPT 2002, 534–545',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Padding_oracle_attack', doi: 'https://doi.org/10.1007/3-540-46035-7_35' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true });
        const sS = v.stage({ x: [0, 1], y: [0, 33], axes: 'box', gutter: true, height: 220, full: true, xlabel: 'oracle queries', ylabel: 'bytes recovered' });
        const msgSel = v.select('Message', [{ value: 0, label: '1 block' }, { value: 1, label: '2 blocks' }], 1);
        const srv = v.select('Server', [{ value: 'leak', label: 'distinguishes padding errors' }, { value: 'uni', label: 'uniform errors (MAC first)' }], 'leak');
        let seed = 1; v.button('New key', () => { seed += 1; });
        const MSG = ['ATTACK AT DAWN', 'PAY BOB 100 EUR, PIN 4821'];
        let key = '', A = null;
        const compute = () => {
          const r = v.rng(seed * 8191 + msgSel.value), K = Array.from({ length: 16 }, () => Math.floor(r() * 256)), keys = aesKeys(K);
          const raw = [...MSG[msgSel.value]].map((c) => c.charCodeAt(0)), pad = 16 - (raw.length % 16), pt = raw.concat(Array(pad).fill(pad)), nb = pt.length / 16;
          const c = [Array.from({ length: 16 }, () => Math.floor(r() * 256))];
          for (let b = 0; b < nb; b++) { const x = pt.slice(16 * b, 16 * b + 16).map((z, i) => z ^ c[b][i]); c.push(aes(K, x, keys).out); }
          let queries = 0; const ev = [], got = [];
          const leak = srv.value === 'leak';
          const oracle = (prev, blk) => { queries++; if (!leak) return false; const d = aesDec(K, blk, keys).map((z, i) => z ^ prev[i]), p = d[15]; if (p < 1 || p > 16) return false; for (let i = 0; i < p; i++) if (d[15 - i] !== p) return false; return true; };
          let abort = false;
          for (let b = 1; b <= nb && !abort; b++) {
            const prev = c[b - 1], I = new Array(16).fill(0), pl = new Array(16).fill(0);
            for (let pos = 15; pos >= 0 && !abort; pos--) {
              const padv = 16 - pos; let found = false;
              for (let g = 0; g < 256; g++) {
                const cp = new Array(16).fill(0); for (let k = pos + 1; k < 16; k++) cp[k] = I[k] ^ padv; cp[pos] = g;
                let ok = oracle(cp, c[b]); let ev1 = { blk: b, pos, g, ok, verify: false };
                if (ok && pos === 15) { const c2 = cp.slice(); c2[14] ^= 1; const ok2 = oracle(c2, c[b]); ev.push(ev1); ev1 = { blk: b, pos, g, ok: ok2, verify: true }; ok = ok2; }
                if (ok) { I[pos] = g ^ padv; pl[pos] = I[pos] ^ prev[pos]; ev.push({ ...ev1, done: pl[pos] }); found = true; break; } else ev.push(ev1);
              }
              if (!found) abort = true;
            }
            got.push(pl);
          }
          return { ev, nb, pt, total: ev.length, queries, abort };
        };
        let q = 0;
        v.animate((t) => {
          const kk = [seed, msgSel.value, srv.value].join();
          if (kk !== key) { key = kk; A = compute(); }
          q = Math.floor(A.total * clamp(t / 9, 0, 1)); if (t >= 9) q = A.total;
          const P = pix(sD), W = P.W, nbk = A.nb, cw = Math.min(26, (W - 100) / 16);
          const done = {}; let rec = 0, cur = null;
          for (let i = 0; i < q; i++) { const e = A.ev[i]; cur = e; if (e.done != null) { done[e.blk + ',' + e.pos] = e.done; rec++; } }
          const x0 = (W - 16 * cw) / 2;
          P.text('recovered plaintext (hex over ASCII), block by block — PKCS#7 padding included', W / 2, 14, { size: 12, color: 'muted', halo: false });
          for (let b = 1; b <= nbk; b++) {
            const y = 34 + (b - 1) * 66;
            for (let i = 0; i < 16; i++) {
              const dv = done[b + ',' + i], isCur = cur && cur.blk === b && cur.pos === i && dv == null && q < A.total;
              P.rect(x0 + i * cw + 1, y, cw - 2, 44, { fill: dv != null ? 'green' : isCur ? 'gold' : 'faint', fillAlpha: dv != null ? 0.18 : isCur ? 0.35 : 0.08, color: dv != null ? 'green' : isCur ? 'gold' : 'muted', width: isCur ? 2 : 1, radius: 4 });
              if (dv != null) { P.text(hx(dv), x0 + (i + 0.5) * cw, y + 13, { size: 10.5, color: 'green', weight: 600, halo: false }); P.text(printable(dv), x0 + (i + 0.5) * cw, y + 32, { size: 14, weight: 700, color: dv <= 16 ? 'muted' : 'ink', halo: false }); }
              else if (isCur) P.text(hx(cur.g), x0 + (i + 0.5) * cw, y + 22, { size: 11, color: 'gold', weight: 700, halo: false });
            }
          }
          const ys = 34 + nbk * 66 + 4;
          P.text(`oracle queries so far: ${q}${cur ? `   — current guess ${hx(cur.g)} for byte ${cur.pos + 1} of block ${cur.blk}` : ''}`, W / 2, ys, { size: 12.5, weight: 700, color: 'ink', halo: false });
          const last = A.ev.slice(Math.max(0, q - 24), q);
          last.forEach((e, i) => { const x = (W - 24 * 18) / 2 + i * 18; P.rect(x, ys + 14, 16, 20, { fill: e.ok ? 'green' : 'red', fillAlpha: e.ok ? 0.5 : 0.14, color: e.ok ? 'green' : 'red', width: 1, radius: 3 }); P.text(e.ok ? '✓' : '✗', x + 8, ys + 24, { size: 11, color: e.ok ? 'green' : 'red', halo: false }); });
          if (A.abort && q >= A.total) P.text('uniform errors: no guess ever looks valid — the attack gets no information and stops', W / 2, ys + 52, { size: 12.5, color: 'red', weight: 700, halo: false });
          // staircase
          let c = 0; const pts = [[0, 0]]; for (let i = 0; i < A.total; i++) { if (A.ev[i].done != null) c++; if (A.ev[i].done != null || i === A.total - 1) pts.push([i + 1, c]); }
          sS.setView([0, Math.max(300, A.total * 1.05)], [0, A.nb * 16 + 1]);
          sS.path(pts, { color: 'faint', width: 1.4 }); sS.path(pts.filter((p) => p[0] <= q), { color: 'accent', width: 2.6 });
          sS.dot(q, rec, { r: 6, color: 'gold' });
          sS.path([[0, 0], [A.nb * 16 * 128, A.nb * 16]], { color: 'muted', width: 1.2, dash: true });
          A.rec = rec; A.q = q;
        }, { period: 12, still: 9 });
        v.legend([['accent', 'bytes recovered'], ['muted', 'average 128 queries per byte', { dash: true }]]);
        v.readout(() => A ? String.raw`${A.q} queries so far, ${A.rec} of ${A.nb * 16} plaintext bytes recovered` + (A.q >= A.total ? (A.abort ? String.raw`. Without a padding oracle the attack stops after $${A.total}$ queries with nothing.` : String.raw`. Full run: **${A.total} queries** for ${A.nb * 16} bytes (${v.fix(A.total / (A.nb * 16), 0)} per byte; expected $\approx128$ plus a few for the last-byte check). The key was never used.`) : '.') : '');
      },
    },

    // ================================================================== 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Side-channel attacks',
      statement: String.raw`A **side channel** is information about a secret computation that leaks through the physical implementation — running time, power consumption, electromagnetic emission, cache behaviour, sound, faults — rather than through the algorithm's inputs and outputs. A cipher that is secure in the black-box model of 3.9 may therefore be broken in practice. In **differential/correlation power analysis** the attacker records $N$ power traces of the device encrypting known plaintexts $p_i$ and, for each guess $g$ of a key byte, correlates the *predicted* leakage $h_i(g)=\mathrm{HW}\bigl(S(p_i\oplus g)\bigr)$ (Hamming weight of the first-round S-box output) with the measured power at each time sample; for the correct guess $g=k$ the correlation $\rho$ peaks, for wrong guesses it stays near $0\pm1/\sqrt N$. **Countermeasures** (constant-time code, masking, hiding, blinding) shift the problem to the implementation; masking randomises intermediate values so that a single sample is independent of the secret.`,
      idea: String.raw`CMOS gates draw current when bits switch, so the instantaneous power is roughly an affine function of the Hamming weight of the data being processed plus noise. Because $S$ is non-linear, a wrong key guess $g\neq k$ produces a prediction $\mathrm{HW}(S(p\oplus g))$ that is almost uncorrelated with the true intermediate $S(p\oplus k)$, so only the right guess correlates, and the signal-to-noise ratio of the *statistic* improves like $\sqrt N$: more traces defeat more noise, and each key byte can be attacked separately ($256$ guesses rather than $2^{128}$). Kocher's 1996 timing attack and the 1999 differential power analysis of Kocher, Jaffe and Jun launched the field; Brier, Clavier and Olivier's correlation power analysis (2004) is the version shown here. Masking splits a value into random shares so that each single sample leaks nothing (but combinations of two samples can still leak: second-order attacks).`,
      caption: String.raw`**Simulated** power traces of the first AES S-box lookup (a model: leakage $=\mathrm{HW}(S(p\oplus k))$ at sample 12 plus Gaussian noise; not measured data). **Top left:** a few traces. **Top right:** correlation of the best wrong guess and of the true key against every time sample: the true key peaks exactly at the leaking sample. **Bottom:** the correlation of each of the $256$ key-byte guesses at that sample. Raise the number of traces or lower the noise and the true key stands out; switch on **masking** and the peak vanishes.`,
      scope: String.raw`Leakage model and noise are assumptions of this simulation (Hamming-weight model, independent Gaussian noise). Masking is shown at first order only (a fresh random mask on every trace); second-order attacks combining two samples are not simulated.`,
      deps: ['crypto-4.7'],
      tags: ['side channel', 'power analysis', 'implementation security'],
      refs: ['Katz–Lindell §12.5.6', 'Boneh–Shoup ch. 4'],
      credit: 'P. Kocher, CRYPTO ’96 (timing); P. Kocher, J. Jaffe & B. Jun, CRYPTO ’99 (differential power analysis); E. Brier, C. Clavier & F. Olivier, CHES 2004 (correlation power analysis)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Side-channel_attack' },
      viz(v) {
        const T = 30, LS = 12;
        const sT = v.stage({ x: [0, T], y: [-6, 17], axes: 'box', gutter: true, height: 250, minWidth: 320, xlabel: 'time sample', ylabel: 'power (a.u.)' });
        const sR = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', gutter: true, height: 250, minWidth: 320, xlabel: 'time sample', ylabel: 'correlation ρ' });
        const sG = v.stage({ x: [-1, 256], y: [0, 1], axes: 'box', gutter: true, height: 240, full: true, xlabel: 'key-byte guess g', ylabel: '|ρ| at the leaking sample' });
        const nS = v.slider('number of traces $N$', 5, 2000, 150, { log: true, int: true });
        const sig = v.slider('noise $\\sigma$', 0.2, 12, 3, { step: 0.1 });
        const mask = v.select('Implementation', [{ value: 0, label: 'unprotected' }, { value: 1, label: 'masked' }], 0);
        let seed = 1; v.button('New key', () => { seed += 1; });
        const HW = Array.from({ length: 256 }, (_, i) => popcnt(i));
        const base = (t) => 5 + 1.6 * Math.sin(t / 2.3) + 0.9 * Math.cos(t / 1.3);
        let key = '', D = null;
        v.render(() => {
          const kk = [nS.value, sig.value, mask.value, seed].join();
          if (kk !== key) {
            key = kk; const r = v.rng(seed * 7717 + 3), N = nS.value, s = sig.value, kb = Math.floor(r() * 256);
            const gauss = () => r.normal();
            const traces = [], pts = new Uint8Array(N);
            for (let i = 0; i < N; i++) {
              const p = Math.floor(r() * 256); pts[i] = p;
              const inter = SBOX[p ^ kb] ^ (mask.value ? Math.floor(r() * 256) : 0), tr = new Float64Array(T);
              for (let t = 0; t < T; t++) tr[t] = base(t) + s * gauss() + (t === LS ? HW[inter] : t === LS + 1 ? 0.4 * HW[p] : 0);
              traces.push(tr);
            }
            // correlation of every guess at every sample (only needed for true key and best wrong over time; compute all at LS first)
            const corrAt = (t, g) => { let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; for (let i = 0; i < N; i++) { const x = HW[SBOX[pts[i] ^ g]], y = traces[i][t]; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; } const cv = sxy - sx * sy / N, vx = sxx - sx * sx / N, vy = syy - sy * sy / N; return vx > 0 && vy > 0 ? cv / Math.sqrt(vx * vy) : 0; };
            const rho = Array.from({ length: 256 }, (_, g) => corrAt(LS, g));
            let bw = -1, bv = -1; rho.forEach((c, g) => { if (g !== kb && Math.abs(c) > bv) { bv = Math.abs(c); bw = g; } });
            const trueT = Array.from({ length: T }, (_, t) => corrAt(t, kb)), wrongT = Array.from({ length: T }, (_, t) => corrAt(t, bw));
            const rank = rho.filter((c, g) => g !== kb && Math.abs(c) > Math.abs(rho[kb])).length + 1;
            D = { N, kb, traces, rho, trueT, wrongT, bw, rank, bv };
          }
          for (let i = 0; i < Math.min(4, D.traces.length); i++) sT.path(Array.from({ length: T }, (_, t) => [t, D.traces[i][t]]), { color: ['accent', 'teal', 'purple', 'orange'][i], width: 1.5, alpha: 0.75 });
          sT.vline(LS, { color: 'gold', width: 1.2, dash: true }); sT.text('S-box lookup', LS + 0.4, 15.2, { size: 11, color: 'gold', weight: 600, align: 'left' });
          sR.hline(0, { color: 'faint', width: 1 });
          sR.path(D.wrongT.map((c, t) => [t, c]), { color: 'muted', width: 1.8 });
          sR.path(D.trueT.map((c, t) => [t, c]), { color: 'green', width: 2.4 });
          const band = 3 / Math.sqrt(D.N); sR.hband(-band, band, { color: 'faint', alpha: 0.18 });
          sG.setView([-1, 256], [0, Math.max(0.25, Math.max(...D.rho.map(Math.abs)) * 1.15)]);
          D.rho.forEach((c, g) => sG.rect(g - 0.4, 0, g + 0.4, Math.abs(c), { fill: g === D.kb ? 'green' : 'accent', fillAlpha: g === D.kb ? 0.85 : 0.5, color: g === D.kb ? 'green' : 'accent', width: g === D.kb ? 2 : 0.6 }));
          sG.hline(3 / Math.sqrt(D.N), { color: 'red', width: 1.4, dash: true });
        });
        v.legend([['green', 'true key byte'], ['muted', 'best wrong guess'], ['red', '$3/\\sqrt N$ noise level', { dash: true }]]);
        v.readout(() => {
          const rs = D.rank === 1 && D.rho[D.kb] !== 0 ? String.raw`**the true key byte ${hx(D.kb)} ranks first**` : String.raw`the true key byte ${hx(D.kb)} ranks only **#${D.rank}** of 256`;
          return String.raw`$N=${D.N}$ traces, noise $\sigma=${v.fix(sig.value, 1)}$: ${rs} with $|\rho|=${v.fix(Math.abs(D.rho[D.kb]), 3)}$ against $${v.fix(D.bv, 3)}$ for the best wrong guess (random guesses give $\approx1/\sqrt N=${v.fix(1 / Math.sqrt(D.N), 3)}$).` + (mask.value ? ' The mask makes the sample independent of $S(p\\oplus k)$: no first-order leakage.' : '');
        });
      },
    },
  ],
};
