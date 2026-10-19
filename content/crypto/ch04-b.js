import { attackPopulation } from './sources.audit.js';
// Cryptography — Chapter 4, part b (items 4.5–4.8): DES, meet-in-the-middle, AES, differential and linear cryptanalysis
import {
  clamp, pixc as pix, mix2, hx, popcnt, hex, des, bitsOfHex, hexOfBits, toHex32, aes, aesKeys, bytesHex, hexBytes, SBOX, SBOXES, invS, ddt, lat, dur, sciText,
} from './ch04.shared.js';

const flipHex = (h, bit) => { const b = bitsOfHex(h); b[bit] ^= 1; return hexOfBits(b); };
const bin = (a, i, n) => a.slice(i, i + n).join('');
const hamming = (a, b) => { let c = 0; for (let i = 0; i < a.length; i++) c += a[i] ^ b[i]; return c; };

export default {
  collection: 'crypto',
  chapter: 4,
  items: [
    // ================================================================== 4.5
    {
      num: '4.5',
      kind: 'Invention',
      name: 'The Data Encryption Standard',
      statement: String.raw`The **Data Encryption Standard** (DES) is a block cipher on $64$-bit blocks with a $56$-bit key (stored in $64$ bits with parity bits). After an initial permutation $\mathrm{IP}$ the block is split into halves $(L_0,R_0)$ and passed through $16$ Feistel rounds (4.4) $$L_i=R_{i-1},\qquad R_i=L_{i-1}\oplus f(R_{i-1},K_i),\qquad f(R,K)=P\bigl(S_1\|\cdots\|S_8\,(E(R)\oplus K)\bigr),$$ where $E$ expands $32$ bits to $48$, each of eight S-boxes $S_j$ maps $6$ bits to $4$, $P$ is a fixed bit permutation and $K_i$ are $48$-bit round keys selected from the key; after the last round the halves are swapped and $\mathrm{IP}^{-1}$ is applied. Decryption is the same circuit with the round keys in reverse order. The key space has $2^{56}$ possibilities. This is a historical cipher: NIST withdrew FIPS 46-3 in 2005; the experiment explains its structure and the 1998 exhaustive-search demonstration.`,
      idea: String.raw`Feistel rounds remain invertible even though the 6-to-4-bit S-boxes are not. The 16 rounds repeatedly expand, mix keys, substitute and permute. The short key also permits exhaustive search: EFF's July 1998 FAQ reports that its machine found the DES Challenge II-2 key in about 56 hours after examining 24.8% of the space, at an average 88,803,604,509 keys per second. The project cost less than $250\,000$. A particular successful search can be shorter than the mean; the calculator uses the average half-keyspace work model rather than presenting that run's time as an average.`,
      caption: String.raw`Step through actual DES: the preset block, a new deterministic sample, round expansion, subkey, XOR and substitution outputs. Bottom left shows the 0–64 possible state-bit differences after flipping one plaintext bit. Bottom right is a hypothetical constant-rate exhaustive search of an ideal $k$-bit key space: approximately $2^{k-1}/r$ seconds, plotted on a logarithmic time scale. The hollow dot uses EFF's measured average rate but shows the model's **mean**, not the historical 56-hour result. DES and AES-128 labels indicate key lengths; this calculator does not model algorithm-specific attacks or hardware costs.`,
      scope: String.raw`DES tables and reverse-key decryption follow FIPS 46-3, pp. 8–19. Preset output and random blocks are independently checked against native OpenSSL triple-DES with the same DES key repeated (EDE then equals single DES); EFF's independently published Blaze example is another known-answer check. Sampling is reproducible, not cryptographic. The cost plot assumes uniformly located keys and fixed trial rate, and omits implementation overhead.`,
      deps: ['crypto-4.4'],
      tags: ['DES', 'block cipher', 'brute force'],
      refs: ['FIPS 46-3 (1999), DES specification pp. 8–19', 'EFF DES Cracker FAQ (July 1998), sections Does it work? and How much did it cost?'],
      credit: 'FIPS 46-3 (1999 revision); EFF DES Cracker (July 1998), primary specification and project report',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Data_Encryption_Standard', eff: 'https://en.wikipedia.org/wiki/EFF_DES_cracker', 'FIPS 46-3': 'https://csrc.nist.gov/files/pubs/fips/46-3/final/docs/fips46-3.pdf', 'EFF original report': 'https://w2.eff.org/Privacy/Crypto/Crypto_misc/DESCracker/HTML/19980716_eff_des_faq.html' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const sA = v.stage({ x: [0, 17], y: [0, 64], axes: 'box', gutter: true, height: 260, minWidth: 320, xlabel: 'round', ylabel: 'state bits differing' });
        const sC = v.stage({ x: [40, 128], y: [-6, 40], axes: 'box', gutter: true, height: 260, minWidth: 320, xlabel: 'key length k (bits)', ylabel: 'mean search time (s)' });
        const pre = v.select('Block', [{ value: 'ex', label: 'worked example' }, { value: 'rnd', label: 'random' }], 'ex');
        let seed = 1; v.button('New random', () => { seed += 1; pre.value = 'rnd'; });
        const bS = v.slider('flip plaintext bit', 0, 63, 12, { step: 1, int: true });
        const rate = v.slider('keys per second', 1e6, 1e16, 88803604509, { log: true });
        const S = v.steps({ frames: Array.from({ length: 18 }, (_, i) => ({ r: i })), start: 3, still: 5, note: false });
        const EX = { k: '133457799BBCDFF1', p: '0123456789ABCDEF', c: '85E813540F0AB405' };
        let key = '', D = null;
        v.render(() => {
          const kk = pre.value + seed + ',' + bS.value;
          if (kk !== key) {
            key = kk; let k, p;
            if (pre.value === 'ex') { k = EX.k; p = EX.p; } else { const r = v.rng(seed * 313); k = hex(mix2(seed, 1), 8) + hex(mix2(seed, 2), 8); p = hex(mix2(seed, 3), 8) + hex(mix2(seed, 4), 8); void r; }
            const a = des(k, p), b = des(k, flipHex(p, bS.value));
            const diff = [hamming(a.L[0].concat(a.R[0]), b.L[0].concat(b.R[0]))]; // after IP
            for (let i = 1; i <= 16; i++) diff.push(hamming(a.L[i].concat(a.R[i]), b.L[i].concat(b.R[i])));
            D = { k, p, a, diff, ok: a.out === EX.c && pre.value === 'ex', back: des(k, a.out, true).out === p };
          }
          const f = S.frame.r, P = pix(sD), W = P.W;
          const { a } = D;
          const title = f === 0 ? 'after the initial permutation: (L₀, R₀)' : f <= 16 ? `round ${f}:  L${f} = R${f - 1},   R${f} = L${f - 1} ⊕ f(R${f - 1}, K${f})` : 'swap halves, apply IP⁻¹  →  ciphertext';
          P.text(title, W / 2, 14, { size: 13, weight: 700, color: 'ink', halo: false });
          const Lh = f <= 16 ? toHex32(a.L[f]) : toHex32(a.R[16]), Rh = f <= 16 ? toHex32(a.R[f]) : toHex32(a.L[16]);
          const bw = Math.min(190, W * 0.3);
          P.rect(W / 2 - bw - 12, 30, bw, 28, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.6, radius: 7 });
          P.text(`${f <= 16 ? 'L' + f : 'R16'} = ${Lh}`, W / 2 - bw / 2 - 12, 44, { size: 13, weight: 700, color: 'accent', halo: false });
          P.rect(W / 2 + 12, 30, bw, 28, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.6, radius: 7 });
          P.text(`${f <= 16 ? 'R' + f : 'L16'} = ${Rh}`, W / 2 + 12 + bw / 2, 44, { size: 13, weight: 700, color: 'orange', halo: false });
          if (f >= 1 && f <= 16) {
            const rd = a.rounds[f - 1], K = a.K[f - 1], Eb = rd.E, X = rd.X, Sb = rd.S;
            const lx = 56, cw = (W - lx - 14) / 8, ys = [92, 128, 164, 218];
            const lab = [`E(R${f - 1}) (48 bits)`, `round key K${f}`, 'XOR', 'S-box outputs'];
            [['expansion E(R)', 'orange'], ['round key', 'purple'], ['E(R) ⊕ K', 'gold'], ['S-boxes', 'green']].forEach(([t, c], i) => P.text(t, 8, ys[i] - 14, { size: 10.5, weight: 700, color: c, align: 'left', halo: false }));
            void lab;
            for (let j = 0; j < 8; j++) {
              const x = lx + j * cw;
              [[bin(Eb, 6 * j, 6), 'orange'], [bin(K, 6 * j, 6), 'purple'], [bin(X, 6 * j, 6), 'gold']].forEach(([s, c], i) => {
                P.rect(x + 2, ys[i] - 8, cw - 4, 20, { fill: c, fillAlpha: 0.12, color: c, width: 1.2, radius: 4 });
                P.text(s, x + cw / 2, ys[i] + 2, { size: Math.min(11.5, cw / 4.2), weight: 600, color: c, halo: false });
              });
              P.arrow(x + cw / 2, ys[2] + 14, x + cw / 2, ys[3] - 14, { color: 'muted', width: 1.2 });
              P.rect(x + 3, ys[3] - 12, cw - 6, 26, { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.4, radius: 5 });
              P.text(`S${j + 1}: ${Sb.slice(4 * j, 4 * j + 4).join('')}`, x + cw / 2, ys[3] + 1, { size: Math.min(11.5, cw / 4.6), weight: 700, color: 'green', halo: false });
            }
            P.text(`permutation P of the 32 S-box bits: ${toHex32(rd.P)}`, W / 2, 252, { size: 12, color: 'muted', halo: false });
            P.text(`R${f} = L${f - 1} ⊕ ${toHex32(rd.P)} = ${Rh}`, W / 2, 274, { size: 12.5, color: 'ink', weight: 600, halo: false });
          } else if (f === 0) P.text(`key ${D.k}   plaintext ${D.p}`, W / 2, 110, { size: 12.5, color: 'muted', halo: false });
          else P.text(`ciphertext = ${a.out}` + (D.ok ? '   (matches the independently checked preset 85E813540F0AB405)' : ''), W / 2, 110, { size: 13, weight: 700, color: 'green', halo: false });
          // avalanche
          sA.setView([0, 17], [0, 64]);
          sA.hline(32, { color: 'green', width: 1.5, dash: true }); sA.text('ideal 32 of 64', 16.8, 36, { size: 11.5, color: 'green', align: 'right', weight: 600 });
          sA.bars(D.diff.slice(0), { x0: 0, color: (val, i) => (i === Math.min(f, 16) ? 'gold' : 'accent') });
          // cost
          const lt = (kb, rt) => (kb - 1) * Math.LOG10E * Math.LN2 - Math.log10(rt); // log10 seconds
          sC.setView([40, 128], [-6, 40]);
          const tick = [[-3, '1 ms'], [0, '1 s'], [7.5, '1 y'], [10.5, '10³ y'], [18, '10¹⁸ s'], [25, '10²⁵ s'], [35, '10³⁵ s']];
          sC.setTicks(null, tick);
          sC.path([[40, lt(40, rate.value)], [128, lt(128, rate.value)]], { color: 'accent', width: 2.6 });
          sC.path([[40, lt(40, 88803604509)], [128, lt(128, 88803604509)]], { color: 'muted', width: 1.4, dash: true });
          [[56, 'DES'], [128, 'AES-128']].forEach(([kb, l]) => { sC.dot(kb, lt(kb, rate.value), { r: 5, color: 'gold' }); sC.text(l, kb - 1.5, lt(kb, rate.value) + 2.2, { size: 11, color: 'gold', align: kb > 100 ? 'right' : 'left', weight: 700 }); });
          sC.dot(56, lt(56, 88803604509), { r: 5, color: 'muted', hollow: true });
        });
        v.legend([['accent', 'your search rate'], ['muted', 'Deep Crack 1998: $8.88036\\times10^{10}$ keys/s', { dash: true }]]);
        v.readout(() => {
          const tDES = Math.pow(2, 55) / rate.value, t = Math.pow(2, 127) / rate.value;
          return String.raw`Round ${S.frame.r <= 16 ? S.frame.r : 16}: ${D.diff[Math.min(S.frame.r, 16)]} of 64 state bits differ from the flipped-bit run. Encryption then decryption with reversed keys ${D.back ? 'returns the plaintext' : 'FAILED'}.` + '\n' +
            String.raw`At ${sciText(rate.value, 2)} keys/s an average DES key falls in **${dur(tDES)}**, an average 128-bit key in **${dur(t)}**. (EFF's 1998 run: 56 hours for DES Challenge II-2, about a quarter of the key space, consistent with the average.)`;
        });
      },
    },

    // ================================================================== 4.6
    {
      num: '4.6',
      kind: 'Algorithm',
      name: 'Meet-in-the-middle attack on double encryption',
      statement: String.raw`Let $(E,D)$ be a block cipher with key length $n$ and let $E^{(2)}_{k_1,k_2}(x)=E_{k_2}(E_{k_1}(x))$ be **double encryption**, with a $2n$-bit key. Given a known plaintext–ciphertext pair $(x,y)$ the **meet-in-the-middle attack** computes the table $\{(E_{k_1}(x),k_1)\}$ for all $2^n$ keys $k_1$, then for each $k_2$ computes $D_{k_2}(y)$ and looks it up. Every match is a candidate $(k_1,k_2)$; about $2^{2n}/2^{b}$ candidates arise for a $b$-bit block, and a few further pairs eliminate all false candidates. The cost is $O(2^n)$ time and memory instead of $2^{2n}$: double encryption is **no more than one extra bit of security**, and the same idea gives $O(2^{2n})$ against triple encryption with three independent keys.`,
      idea: String.raw`The composition forces the value $m=E_{k_1}(x)=D_{k_2}(y)$ to exist in the middle, and $m$ depends on only one of the keys from either side. So instead of searching the product of key spaces we search each side separately and intersect: a collision (meeting) in the middle value identifies the key pair. A single pair leaves false positives because $2^{2n}$ key pairs map to only $2^b$ possible value pairs; each extra pair divides their number by $2^b$. This is why DES was never doubled, and why triple DES with two or three keys has $112$ bits at best. Diffie and Hellman described the attack on double encryption in 1977; Merkle and Hellman analysed multiple encryption in 1981.`,
      caption: String.raw`A toy cipher with a $16$-bit block (a four-round Feistel network with key size $n$, slider). The plane shows all $2^n\times2^n$ key pairs; **orange dots** are the candidates surviving the meet-in-the-middle test with the first $j$ known pairs (select $j$) and the **green** dot is the real key. Compare the work counters: brute force needs $2^{2n}$ double encryptions, the attack $2\cdot2^n$ single ones. With $j=1$ roughly $2^{2n-16}$ false candidates remain; with $j=2$ the key is unique.`,
      scope: String.raw`Toy cipher with a hashed round function (not a secure design); counts of single-cipher evaluations are exact, the "work" of table look-ups is not charged. Memory for the table is $2^n$ entries.`,
      deps: ['crypto-4.5'],
      tags: ['meet in the middle', 'double encryption'],
      refs: ['Katz–Lindell §7.2.4'],
      credit: 'W. Diffie & M. Hellman, “Exhaustive cryptanalysis of the NBS Data Encryption Standard”, Computer 10(6), 1977; R. Merkle & M. Hellman, CACM 24 (1981) 465–467',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Meet-in-the-middle_attack', doi: 'https://doi.org/10.1109/C-M.1977.217750' },
      viz(v) {
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 380, minWidth: 330, xlabel: 'first key k₁', ylabel: 'second key k₂' });
        const sW = v.stage({ x: [4, 13], y: [0, 28], axes: 'box', gutter: true, height: 380, minWidth: 330, xlabel: 'key length n (bits)', ylabel: 'log₂(evaluations)' });
        const nS = v.slider('key length $n$', 4, 12, 9, { step: 1, int: true });
        const jS = v.select('Known pairs $j$', [1, 2, 3].map((j) => ({ value: j, label: String(j) })), 1);
        let seed = 1; v.button('New key', () => { seed += 1; });
        const E = (k, x) => { let l = x >> 8, r = x & 255; for (let i = 0; i < 4; i++) { const f = mix2(k * 5 + i, r) & 255; [l, r] = [r, l ^ f]; } return (r << 8) | l; };
        const D = (k, y) => { let r = y >> 8, l = y & 255; for (let i = 3; i >= 0; i--) { const f = mix2(k * 5 + i, l) & 255; [l, r] = [r ^ f, l]; } return (l << 8) | r; };
        let key = '', data = null;
        v.render(() => {
          const n = nS.value, K = 1 << n, kk = n + ',' + seed;
          if (kk !== key) {
            key = kk; const r = v.rng(seed * 9973 + n);
            const k1 = Math.floor(r() * K), k2 = Math.floor(r() * K), pairs = [];
            for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 65536); pairs.push([x, E(k2, E(k1, x))]); }
            const T = new Map(); for (let a = 0; a < K; a++) { const m = E(a, pairs[0][0]); (T.get(m) || T.set(m, []).get(m)).push(a); }
            const cand = []; for (let b = 0; b < K; b++) { const m = D(b, pairs[0][1]); const l = T.get(m); if (l) for (const a of l) cand.push([a, b]); }
            const surv = [cand, cand.filter(([a, b]) => E(b, E(a, pairs[1][0])) === pairs[1][1])]; surv.push(surv[1].filter(([a, b]) => E(b, E(a, pairs[2][0])) === pairs[2][1]));
            data = { k1, k2, surv, K, n };
          }
          const j = jS.value, c = data.surv[j - 1], K2 = data.K;
          sP.setView([0, K2], [0, K2]);
          sP.rect(0, 0, K2, K2, { color: 'faint', width: 1, fill: false });
          for (const [a, b] of c) sP.dot(a + 0.5, b + 0.5, { r: Math.max(2.5, 4 - c.length / 200), color: 'orange' });
          sP.dot(data.k1 + 0.5, data.k2 + 0.5, { r: 6, color: 'green' });
          sP.setTicks([[0, '0'], [K2 / 2, String(K2 / 2)], [K2, String(K2)]], [[0, '0'], [K2 / 2, String(K2 / 2)], [K2, String(K2)]]);
          // work plot
          sW.path([[4, 8], [13, 26]], { color: 'red', width: 2.4 });
          sW.path([[4, 5], [13, 14]], { color: 'green', width: 2.4 });
          sW.text('brute force: 2^(2n)', 12.9, 25, { size: 11.5, color: 'red', align: 'right', weight: 700 });
          sW.text('meet in the middle: 2^(n+1)', 12.9, 16.5, { size: 11.5, color: 'green', align: 'right', weight: 700 });
          sW.vline(data.n, { color: 'gold', width: 1.4, dash: true });
          sW.dot(data.n, 2 * data.n, { r: 6, color: 'red' }); sW.dot(data.n, data.n + 1, { r: 6, color: 'green' });
        });
        v.legend([['orange', 'candidate key pairs'], ['green', 'real key (and the attack’s cost line)'], ['red', 'brute force cost']]);
        v.readout(() => {
          const j = jS.value, c = data.surv[j - 1], n = data.n, found = c.some(([a, b]) => a === data.k1 && b === data.k2);
          return String.raw`Attack cost: $2\cdot2^{${n}}=${2 * data.K}$ cipher evaluations (+ a table of $${data.K}$ entries); brute force: $2^{${2 * n}}=${data.K * data.K}$ double encryptions.` + '\n' +
            String.raw`With $j=${j}$ known pair${j > 1 ? 's' : ''}: **${c.length}** candidate key pair${c.length === 1 ? '' : 's'} (expected about $2^{${2 * n}-${16 * j}}=${v.fix(Math.pow(2, 2 * n - 16 * j), 3)}$ false ones)` + (found ? ', real key among them' : ', real key missing (bug)') + (c.length === 1 ? ' — **key recovered**.' : '.');
        });
      },
    },

    // ================================================================== 4.7
    {
      num: '4.7',
      kind: 'Invention',
      name: 'AES (Rijndael)',
      statement: String.raw`The **Advanced Encryption Standard** is the block cipher Rijndael of Daemen and Rijmen restricted to a $128$-bit block and keys of $128$, $192$ or $256$ bits ($10$, $12$ or $14$ rounds). The state is a $4\times4$ array of bytes (elements of $\mathrm{GF}(2^8)$). A round is **SubBytes** (each byte replaced by $S(x)=A\,x^{-1}\oplus c$, the inverse in $\mathrm{GF}(2^8)$ followed by an affine map; $0\mapsto$ its affine image), **ShiftRows** (row $r$ rotated left by $r$), **MixColumns** (each column multiplied by a fixed MDS matrix over $\mathrm{GF}(2^8)$; omitted in the last round) and **AddRoundKey** (XOR with a round key from the key schedule), preceded by an initial AddRoundKey. It is a substitution–permutation network (4.3), not a Feistel network. Any one-byte change in the plaintext affects all $16$ output bytes after two rounds.`,
      idea: String.raw`The design follows the wide-trail strategy. SubBytes is the single non-linear layer, chosen so that the S-box has low differential and linear probabilities (4.8); ShiftRows and MixColumns then ensure that a difference in one byte becomes a difference in a whole column after one round and in all four columns after two — so any differential or linear trail through four rounds must activate at least $25$ S-boxes, which drives the best trail probabilities below $2^{-150}$. Since the round operations are all invertible and cheap in software and hardware, AES is simultaneously fast (dedicated instructions in most CPUs) and conservative. NIST announced the selection of Rijndael on 2 October 2000 after a public competition and published it as FIPS 197 on 26 November 2001.`,
      caption: String.raw`Step through the encryption of the FIPS 197 example (key $00\,01\cdots0f$, plaintext $00\,11\cdots ff$). The **left** grid is the state before the highlighted operation, the **right** grid the state after it; bytes in **red** differ from the run with one plaintext byte changed (choose which). Watch the difference move: after round 1 it fills one column, after round 2 the whole state. The bars below count differing bytes after each round, with the mean of 200 random single-byte changes in grey.`,
      scope: String.raw`Exact AES-128 (checked against FIPS 197 Appendix C.1: the ciphertext printed below should read 69C4E0D86A7B0430D8CDB78070B4C55A). The diffusion bars measure byte differences, not security.`,
      deps: ['crypto-4.3'],
      tags: ['AES', 'Rijndael', 'SPN'],
      refs: ['Katz–Lindell §7.2.5'],
      credit: 'J. Daemen & V. Rijmen (Rijndael, 1998); selected by NIST 2 Oct 2000; FIPS 197, 26 Nov 2001',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Advanced_Encryption_Standard', nist: 'https://csrc.nist.gov/pubs/fips/197/final' },
      viz(v) {
        const sS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const sB = v.stage({ x: [-0.5, 10.5], y: [0, 17], axes: 'box', gutter: true, height: 220, full: true, xlabel: 'after round', ylabel: 'bytes differing' });
        const bS = v.slider('changed plaintext byte', 0, 15, 0, { step: 1, int: true });
        const KEY = hexBytes('000102030405060708090a0b0c0d0e0f'), PT = hexBytes('00112233445566778899aabbccddeeff'), keys = aesKeys(KEY);
        const A = aes(KEY, PT, keys);
        const S = v.steps({ frames: A.trace.map((t, i) => ({ i })), start: 3, still: 6, note: false });
        let key = null, avg = null, last = null;
        v.render(() => {
          const b = bS.value;
          if (key !== b) { const pt2 = PT.slice(); pt2[b] ^= 0x01; last = aes(KEY, pt2, keys); key = b; }
          if (!avg) { const r = v.rng(7); avg = new Array(11).fill(0); for (let t = 0; t < 200; t++) { const p = Array.from({ length: 16 }, () => Math.floor(r() * 256)), p2 = p.slice(); p2[Math.floor(r() * 16)] ^= 1 << Math.floor(r() * 8); const x = aes(KEY, p, keys).trace, y = aes(KEY, p2, keys).trace; let rr = 0; x.forEach((s, i) => { if (s.op === 'AddRoundKey') { avg[rr] += s.state.reduce((q, z, k) => q + (z !== y[i].state[k] ? 1 : 0), 0) / 200; rr++; } }); } }
          const f = S.frame.i, cur = A.trace[f], prev = A.trace[Math.max(0, f - 1)], mc = last.trace;
          const P = pix(sS), W = P.W, cs = Math.min(46, (W - 120) / 9), gw = 4 * cs, gx = [W / 2 - gw - 28, W / 2 + 28];
          const grid = (st, ref, x0, y0, col, ttl) => {
            P.text(ttl, x0 + gw / 2, y0 - 14, { size: 12, color: col, weight: 700, halo: false });
            for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
              const byte = st[4 * c + r], dd = byte !== ref[4 * c + r];
              P.rect(x0 + c * cs + 1, y0 + r * cs + 1, cs - 2, cs - 2, { fill: dd ? 'red' : 'accent', fillAlpha: dd ? 0.38 : 0.08, color: dd ? 'red' : 'muted', width: dd ? 1.8 : 1, radius: 4 });
              P.text(hx(byte), x0 + (c + 0.5) * cs, y0 + (r + 0.5) * cs, { size: Math.min(14, cs / 3), weight: dd ? 700 : 500, color: dd ? 'red' : 'ink', halo: false });
            }
          };
          const op = cur.op === 'input' ? 'plaintext (input state)' : `${cur.op}${cur.round ? '  (round ' + cur.round + ')' : '  (initial)'}`;
          grid(prev.state, mc[Math.max(0, f - 1)].state, gx[0], 54, 'muted', f === 0 ? 'input' : 'before');
          grid(cur.state, mc[f].state, gx[1], 54, 'accent', 'after');
          P.arrow(gx[0] + gw + 4, 54 + 2 * cs, gx[1] - 4, 54 + 2 * cs, { color: 'orange', width: 2.4 });
          P.text(cur.op === 'input' ? '' : cur.op, W / 2, 54 + 2 * cs - 12, { size: 11.5, color: 'orange', weight: 700, halo: false });
          P.text(op, W / 2, 20, { size: 14, weight: 700, color: 'orange', halo: false });
          const nd = cur.state.reduce((q, z, k) => q + (z !== mc[f].state[k] ? 1 : 0), 0);
          P.text(`${nd} of 16 bytes differ from the modified-plaintext run`, W / 2, 54 + 4 * cs + 22, { size: 12.5, color: nd ? 'red' : 'muted', weight: 600, halo: false });
          if (f === A.trace.length - 1) P.text(`ciphertext ${bytesHex(A.out)}`, W / 2, 54 + 4 * cs + 44, { size: 12.5, weight: 700, color: 'green', halo: false });
          // bars per round
          const cnt = []; A.trace.forEach((s, i) => { if (s.op === 'AddRoundKey') cnt.push(s.state.reduce((q, z, k) => q + (z !== mc[i].state[k] ? 1 : 0), 0)); });
          sB.hline(16, { color: 'muted', width: 1, dash: true });
          cnt.forEach((c, i) => sB.rect(i - 0.3, 0, i + 0.3, c, { fill: 'red', fillAlpha: 0.5, color: 'red', width: 1.2 }));
          sB.path(avg.slice(0, 11).map((a, i) => [i, a]), { color: 'muted', width: 2, dash: true });
          sB.vline(S.frame.i === 0 ? 0 : A.trace[f].round, { color: 'gold', width: 1.6 });
        });
        v.legend([['red', 'bytes differing (this change)'], ['muted', 'mean over 200 random changes', { dash: true }]]);
        v.readout(() => String.raw`Round ${A.trace[S.frame.i].round}, ${A.trace[S.frame.i].op}. FIPS 197 check: ciphertext ${bytesHex(A.out).toUpperCase()} ${bytesHex(A.out).toUpperCase() === '69C4E0D86A7B0430D8CDB78070B4C55A' ? '= the published value' : '≠ the published value (bug)'}. Differences after rounds $0,1,2,3$: ${(() => { const o = []; A.trace.forEach((s, i) => { if (s.op === 'AddRoundKey' && o.length < 4) o.push(s.state.reduce((q, z, k) => q + (z !== last.trace[i].state[k] ? 1 : 0), 0)); }); return o.join(', '); })()} bytes.`);
      },
    },

    // ================================================================== 4.8
    {
      num: '4.8',
      kind: 'Method',
      name: 'Differential and linear cryptanalysis',
      statement: String.raw`For an invertible 4-bit S-box, $\mathrm{DDT}[a][b]=\#\{x:S(x)\oplus S(x\oplus a)=b\}$ gives differential probability $\mathrm{DDT}/16$. The table $\mathrm{LAT}[a][b]=\#\{x:a\cdot x=b\cdot S(x)\}-8$ gives signed linear bias $\mathrm{LAT}/16$, with dot products over $\mathbb F_2$. A differential attack tests predicted differences after partial decryption under guessed last-round subkeys; a linear attack tests correlations with known plaintext bits. For **independent** binary variables with biases $\epsilon_i$, the piling-up lemma gives XOR bias $2^{m-1}\prod_i\epsilon_i$. Round expressions in an actual cipher need not be independent, so this formula is not an unconditional multi-round cipher theorem. Data scales $1/p$ for observing a differential event or $1/\epsilon^2$ for detecting a fixed bias do not guarantee unique key identification.`,
      idea: String.raw`The trivial DDT cell $(0,0)$ is 16 and the trivial LAT cell is 8; only nontrivial differences/masks measure resistance. Even small individual entries do not prove cipher security. This two-layer teaching cipher is $C=S(S(P\oplus k_0)\oplus k_1)\oplus k_2$. With the true $k_2$, peeling the outer S-box yields the selected DDT probability or the selected absolute LAT bias. Wrong guesses can have equally strong population scores. Here all 16 plaintexts can be enumerated, so the gold marks show that population statistic for **every** guess. More samples reduce sampling variation but cannot separate permanently tied population scores with this statistic alone.`,
      caption: String.raw`Click any DDT/LAT cell, including trivial ones, then choose the S-box and sample size. Bars show scores in samples drawn independently with replacement; green is the known true key. Gold ticks are $N$ times the exact population differential probability, or $N$ times the absolute population linear bias. For linear scores, $N|p-1/2|$ is a population reference, not the expectation of the finite folded score $|Z-N/2|$. Resampling changes keys and data. A sample winner is not a demonstrated key-recovery theorem, and ties can persist even with unlimited data.`,
      scope: String.raw`Original 2-layer teaching model, not a simulation of DES/AES attack complexities. S-box A is Heys §2.1 Table 1; B is PRESENT §3; affine is a deliberately weak rotation/XOR. The piling-up proof and caveats follow Heys §3.2. Historical attack costs and claims about secret design history are omitted because those original research papers are not the evidence for this reconstruction.`,
      deps: ['crypto-4.3'],
      tags: ['differential cryptanalysis', 'linear cryptanalysis'],
      refs: ['Heys, A Tutorial on Linear and Differential Cryptanalysis, §§2–4, Table 1 and piling-up lemma §3.2', 'Bogdanov et al., PRESENT (2007), §3 S-box table'],
      credit: 'Teaching demonstration after Howard M. Heys, A Tutorial on Linear and Differential Cryptanalysis',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Differential_cryptanalysis', linear: 'https://en.wikipedia.org/wiki/Linear_cryptanalysis', 'Heys tutorial': 'https://cs.bc.edu/straubin/crypto2017/heys.pdf', 'PRESENT original': 'https://www.researchgate.net/publication/221291660_PRESENT_An_Ultra-Lightweight_Block_Cipher' },
      viz(v) {
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 340 });
        const sK = v.stage({ x: [-0.5, 15.5], y: [0, 1], axes: 'box', gutter: true, height: 400, minWidth: 340, xlabel: 'guess for the last key nibble k₂', ylabel: 'score' });
        const sb = v.select('S-box', [{ value: 'heys', label: 'S-box A' }, { value: 'present', label: 'S-box B' }, { value: 'linear', label: 'affine' }], 'heys');
        const mode = v.select('Table', [{ value: 'd', label: 'differential' }, { value: 'l', label: 'linear' }], 'd');
        const nS = v.slider('samples $N$', 4, 400, 60, { step: 1, int: true });
        let seed = 1; v.button('New keys', () => { seed += 1; });
        let sel = null, selKey = '';
        const T = v.table(sT, { rows: 16, cols: 16, square: true, maxCell: 24, size: 10.5, rowLabels: (i) => hx(i, 1), colLabels: (j) => hx(j, 1), cornerLabel: 'a\\b', labelSize: 10.5 });
        sT.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { sel = [c.i, c.j]; v.invalidate(); } });
        let info = null;
        v.render(() => {
          const S = SBOXES[sb.value].S, Si = invS(S), d = mode.value === 'd', tab = d ? ddt(S) : lat(S);
          const k0 = `${sb.value}${mode.value}`;
          if (selKey !== k0) { selKey = k0; let bv = -1; for (let a = 1; a < 16; a++) for (let b = d ? 0 : 1; b < 16; b++) { const val = Math.abs(tab[a][b]); if (val > bv && (d ? true : true)) { bv = val; sel = [a, b]; } } }
          const [a, b] = sel;
          T.draw({ value: (i, j) => (i === 0 && j === 0 && d ? 16 : tab[i][j]), heat: (i, j) => (d ? tab[i][j] / 16 : (tab[i][j] + 8) / 16), cmap: d ? 'magma' : 'diverging', highlight: [[a, b, 'gold']], format: (val) => String(val), size: 10.5 });
          // attack
          const r = v.rng(seed * 6131 + 5), kk = [r(), r(), r()].map((x) => Math.floor(x * 16)), N = nS.value, sc = new Array(16).fill(0);
          const enc = (p) => S[S[p ^ kk[0]] ^ kk[1]] ^ kk[2];
          if (d) {
            for (let t = 0; t < N; t++) { const p = Math.floor(r() * 16), c1 = enc(p), c2 = enc(p ^ a); for (let g = 0; g < 16; g++) if ((Si[c1 ^ g] ^ Si[c2 ^ g]) === b) sc[g]++; }
          } else {
            const zs = new Array(16).fill(0);
            for (let t = 0; t < N; t++) { const p = Math.floor(r() * 16), c = enc(p), pa = popcnt(a & p) & 1; for (let g = 0; g < 16; g++) if (((popcnt(b & Si[c ^ g]) & 1) ^ pa) === 0) zs[g]++; }
            for (let g = 0; g < 16; g++) sc[g] = Math.abs(zs[g] - N / 2);
          }
          const population = attackPopulation(S, kk, a, b, d), reference = population.map((p) => N * p);
          const mx = Math.max(...sc, ...reference, 1), top = sc.indexOf(Math.max(...sc)), ties = sc.filter((x) => x === sc[top]).length;
          sK.setView([-0.5, 15.5], [0, mx * 1.2 + 1]);
          sc.forEach((s, g) => sK.rect(g - 0.35, 0, g + 0.35, s, { fill: g === kk[2] ? 'green' : 'accent', fillAlpha: g === kk[2] ? 0.7 : 0.4, color: g === kk[2] ? 'green' : 'accent', width: 1.2 }));
          reference.forEach((score, g) => sK.line(g - .35, score, g + .35, score, { color: 'gold', width: 2.5 }));
          sK.setTicks([...Array(16).keys()].map((g) => [g, hx(g, 1)]), null);
          info = { a, b, val: tab[a][b], d, N, top, ties, key: kk[2], sc: sc[top], real: sc[kk[2]], population, scores: sc, keys: kk, S };
        });
        v.legend([['green', 'real $k_2$'], ['accent', 'wrong guesses'], ['gold', 'selected cell / exact population score']]);
        v.readout(() => {
          const i = info, p = i.val / 16;
          const head = i.d ? String.raw`Differential $${hx(i.a, 1)}\to ${hx(i.b, 1)}$: probability $${i.val}/16=${v.fix(p, 3)}$, so about $1/p\approx${p > 0 ? v.fix(1 / p, 1) : '\\infty'}$ pairs per right pair.` : String.raw`Approximation $${hx(i.a, 1)}\cdot x=${hx(i.b, 1)}\cdot S(x)$: bias $\epsilon=${i.val}/16=${v.fix(p, 3)}$, fixed-bias detection scale $1/\epsilon^2\approx${p ? v.fix(1 / (p * p), 0) : '\\infty'}$ known plaintexts.`;
          return head + '\n' + String.raw`With $N=${i.N}$ samples the top guess is $${hx(i.top, 1)}$ (score ${v.fix(i.sc, 0)}${i.ties > 1 ? ', tied with ' + (i.ties - 1) + ' other' + (i.ties > 2 ? 's' : '') : ''}); the real key nibble is $${hx(i.key, 1)}$ (score ${v.fix(i.real, 0)}): ` + (i.top === i.key && i.ties === 1 ? 'unique sample leader matching the true key in this batch.' : i.sc === i.real ? 'tied for the sample top.' : 'a wrong guess leads this batch.') + ` The exact population statistic has ${i.population.filter(x => Math.abs(x - Math.max(...i.population)) < 1e-14).length} maximizers; this score need not identify a unique key.`;
        });
      },
    },
  ],
};
