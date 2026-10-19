import { spnRun, spnPermutation } from './sources.audit.js';
// Cryptography — Chapter 4: Stream ciphers, block ciphers and modes of operation (items 4.1–4.4)
import {
  clamp, pixc as pix, mix2, hx, popcnt, hex, lfsrBits, lfsrPeriod, bm, predict, rc4, chachaInit, quarter, SBOXES, invS,
} from './ch04.shared.js';

export default {
  collection: 'crypto',
  chapter: 4,
  title: 'Stream ciphers, block ciphers and modes of operation',
  summary: String.raw`Chapter 3 assumed pseudorandom generators and functions; this chapter builds them. Stream ciphers expand a short key into a keystream (linear registers fail at once, RC4 leaks through a statistical bias, ChaCha20 uses only add-rotate-xor). Block ciphers are keyed permutations built from rounds: substitution–permutation networks spread every bit of change across the block (the avalanche effect), Feistel networks invert for any round function, and DES and AES are the two standards that follow. Their security is tested by meet-in-the-middle, differential and linear cryptanalysis, and a block cipher only becomes an encryption scheme through a mode of operation — where ECB leaks patterns, CBC and counter mode do not, a padding oracle can still undo CBC, and a physical side channel can undo any implementation.`,
  items: [
    // ================================================================== 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Linear-feedback shift registers',
      statement: String.raw`A **linear-feedback shift register** (LFSR) of length $n$ over $\mathbb F_2$ is a register of $n$ bits $(s_t,\dots,s_{t+n-1})$ that outputs $s_t$ and shifts, the new bit being a fixed XOR of tapped positions: $$s_{t+n}=\bigoplus_{i=0}^{n-1}c_i\,s_{t+i},\qquad c_i\in\{0,1\},\ c_0=1.$$ (a) The output is periodic with period at most $2^n-1$ from any non-zero state, and exactly $2^n-1$ from every non-zero state iff the connection polynomial $x^n+\sum c_ix^i$ is *primitive*. (b) **Berlekamp–Massey**: from any $2L$ consecutive output bits of a sequence of linear complexity $L$ one can compute the shortest LFSR producing it, in $O(L^2)$ steps; so $2n$ keystream bits of an $n$-bit LFSR reveal the taps and the entire future keystream. A bare LFSR is therefore *not* a secure pseudorandom generator, however random its output looks to statistical tests (3.5).`,
      idea: String.raw`Because the update is linear, the next $n$ bits are an invertible-linear image of the register contents, and the recurrence for $s_{t+n}$ is a linear equation in the unknown taps: $n$ unknowns need $n$ equations, each equation coming from $n+1$ consecutive known bits, so about $2n$ bits suffice. Berlekamp–Massey solves this incrementally: it keeps the shortest register that explains the prefix so far, and when the next bit disagrees ("a discrepancy") it corrects the register by an earlier correction term — the register length can jump only when the prefix is long enough to force it. A truly random string has linear complexity about $N/2$ after $N$ bits, an LFSR sequence stops growing at $L=n$. Designers repair the weakness with *non-linear* combiners or filters, which drives the complexity up again.`,
      caption: String.raw`A secret $n$-bit LFSR (choose its length, tap set and source). **Top:** the register with its tapped positions. **Middle:** the *linear complexity profile*, i.e. Berlekamp–Massey's register length after each prefix of the keystream; a random string follows the dashed line $N/2$, an LFSR climbs to $n$ and stays there. **Bottom:** the attacker sees the first $N$ bits (slider), runs Berlekamp–Massey, and predicts the next 48 bits (green = correct, red = wrong). Switch the source to *filtered* (an AND mixed into the output) or *random* and prediction fails.`,
      scope: String.raw`Bits are generated with a seeded toy generator; the filtered source outputs $\ell_t\oplus(\ell_{t+1}\wedge\ell_{t+3})$ of an LFSR sequence $\ell$, a textbook example of a non-linear filter and *not* a vetted design.`,
      deps: ['crypto-3.5'],
      tags: ['LFSR', 'stream cipher'],
      refs: ['Katz–Lindell §7.1.1'],
      credit: 'J. L. Massey, “Shift-register synthesis and BCH decoding”, IEEE Trans. Inf. Theory 15 (1969) 122–127 (Berlekamp–Massey algorithm)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear-feedback_shift_register', doi: 'https://doi.org/10.1109/TIT.1969.1054260' },
      viz(v) {
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 118, full: true });
        const sP = v.stage({ x: [0, 130], y: [0, 70], axes: 'box', gutter: true, height: 250, full: true, minWidth: 300, xlabel: 'keystream bits seen  N', ylabel: 'linear complexity L(N)' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 118, full: true });
        const nS = v.slider('register length $n$', 3, 16, 8, { step: 1, int: true });
        const src = v.select('Keystream', [{ value: 'lfsr', label: 'plain LFSR' }, { value: 'filt', label: 'filtered (non-linear)' }, { value: 'rand', label: 'random bits' }], 'lfsr');
        const tapsel = v.select('Taps', [{ value: 'prim', label: 'primitive' }, { value: 'rand', label: 'random' }], 'prim');
        const Ns = v.slider('bits seen $N$', 2, 130, 24, { step: 1, int: true });
        let seed = 1; v.button('New secret', () => { seed += 1; });
        const primCache = {};
        const primTaps = (n) => { if (primCache[n]) return primCache[n]; for (let t = 1; t < (1 << n); t += 2) if (lfsrPeriod(n, t) === (1 << n) - 1) return (primCache[n] = t); return 1; };
        let info = null, key = '', data = null;
        v.render(() => {
          const n = nS.value, kk = [n, src.value, tapsel.value, seed].join();
          if (kk !== key) {
            key = kk; const r = v.rng(seed * 7919 + n);
            let taps = tapsel.value === 'prim' ? primTaps(n) : ((Math.floor(r() * (1 << n)) | 1) & ((1 << n) - 1));
            if (tapsel.value === 'prim' && seed > 1) { const all = []; for (let t = 1; t < (1 << n) && all.length < 40; t += 2) if (lfsrPeriod(n, t) === (1 << n) - 1) all.push(t); taps = all[(seed - 1) % all.length]; }
            const st = 1 + Math.floor(r() * ((1 << n) - 1)), L = 200;
            let b;
            if (src.value === 'rand') { b = new Uint8Array(L); for (let i = 0; i < L; i++) b[i] = r() < 0.5 ? 1 : 0; }
            else { const l = lfsrBits(n, taps, st, L + 4); if (src.value === 'lfsr') b = l.slice(0, L); else { b = new Uint8Array(L); for (let i = 0; i < L; i++) b[i] = l[i] ^ (l[i + 1] & l[i + 3]); } }
            const prof = bm(b).Lprof;
            data = { taps, st, b, prof, per: lfsrPeriod(n, taps) };
          }
          const { taps, st, b, prof, per } = data, N = Ns.value;
          // register
          let P = pix(sR), W = P.W, cs = Math.min(40, (W - 70) / n), x0 = (W - n * cs) / 2, y0 = 56;
          for (let i = 0; i < n; i++) {
            const on = (taps >> i) & 1, bit = (st >> i) & 1;
            P.rect(x0 + i * cs + 1, y0, cs - 2, 30, { fill: on ? 'orange' : 'faint', fillAlpha: on ? 0.22 : 0.1, color: on ? 'orange' : 'muted', width: on ? 2 : 1, radius: 5 });
            P.text(String(bit), x0 + (i + 0.5) * cs, y0 + 15, { size: 14, weight: 700, color: 'ink', halo: false });
            if (on) P.line(x0 + (i + 0.5) * cs, y0, x0 + (i + 0.5) * cs, 28, { color: 'orange', width: 1.6 });
          }
          P.line(x0 + 0.5 * cs, 28, x0 + (n - 0.5) * cs, 28, { color: 'orange', width: 1.6 });
          P.dot(x0 + (n - 0.5) * cs, 28, { r: 8, color: 'orange', hollow: true });
          P.text('⊕', x0 + (n - 0.5) * cs, 28, { size: 13, weight: 700, color: 'orange', halo: false });
          P.line(x0 + (n - 0.5) * cs, 28, x0 + (n - 0.5) * cs, y0 - 1, { color: 'orange', width: 1.6 });
          P.text('output  ←', x0 - 6, y0 + 15, { size: 11.5, color: 'muted', align: 'right', halo: false });
          P.text(`state at time 0 (leftmost bit is output next); tapped cells in orange.  Period ${per}${per === (1 << n) - 1 ? ' = 2ⁿ−1 (maximal)' : ''}`, W / 2, 104, { size: 11.5, color: 'muted', halo: false });
          // profile
          const win = Math.max(70, Math.min(130, 2 * Math.max(n, 4) + 40));
          sP.setView([0, 130], [0, Math.max(40, Math.min(70, 0.5 * 130 + 6))]);
          sP.path(Array.from({ length: 131 }, (_, i) => [i, i / 2]), { color: 'muted', width: 1.4, dash: true });
          sP.text('random: N/2', 128, 62, { size: 11.5, color: 'muted', align: 'right', weight: 600 });
          sP.path(Array.from({ length: 131 }, (_, i) => [i, prof[i]]), { color: 'accent', width: 2.6 });
          sP.vline(N, { color: 'gold', width: 1.6, dash: true });
          sP.vline(2 * n, { color: 'green', width: 1.2, dash: true });
          sP.text(`2n = ${2 * n}`, 2 * n + 1.5, 4, { size: 11.5, color: 'green', align: 'left', weight: 600 });
          sP.dot(N, prof[N], { r: 6, color: 'gold' });
          // prediction
          const obs = b.subarray(0, N), res = bm(obs), pred = predict(obs, res.C, res.L, 48);
          let ok = 0; for (let i = 0; i < 48; i++) if (pred[i] === b[N + i]) ok++;
          P = pix(sB); W = P.W; const cw = Math.min(14, (W - 20) / 48);
          const xs = (W - 48 * cw) / 2;
          P.text(`observed: ${N} bits (last ${Math.min(N, 24)} shown)`, 10, 14, { size: 11.5, color: 'accent', align: 'left', weight: 600, halo: false });
          const sh = Math.min(N, 24);
          for (let i = 0; i < sh; i++) P.text(String(b[N - sh + i]), 250 + i * 11, 14, { size: 12, color: 'accent', weight: 600, halo: false, align: 'left' });
          P.text('actual next 48:', xs, 42, { size: 11, color: 'muted', align: 'left', halo: false });
          P.text('predicted:', xs, 76, { size: 11, color: 'muted', align: 'left', halo: false });
          for (let i = 0; i < 48; i++) {
            P.text(String(b[N + i]), xs + (i + 0.5) * cw, 56, { size: 12.5, weight: 600, color: 'ink', halo: false });
            const good = pred[i] === b[N + i];
            P.rect(xs + i * cw + 1, 84, cw - 2, 22, { fill: good ? 'green' : 'red', fillAlpha: 0.2, color: good ? 'green' : 'red', width: 1.2, radius: 3 });
            P.text(String(pred[i]), xs + (i + 0.5) * cw, 95, { size: 12, color: good ? 'green' : 'red', weight: 700, halo: false });
          }
          info = { n, taps, N, L: res.L, ok, per, win };
        });
        v.legend([['accent', 'linear complexity profile'], ['muted', 'random sequence: $N/2$', { dash: true }], ['gold', 'bits seen', { dash: true }], ['green', '$N=2n$', { dash: true }]]);
        v.readout(() => {
          const i = info, poly = [`x^{${i.n}}`].concat([...Array(i.n).keys()].reverse().filter((k) => (i.taps >> k) & 1).map((k) => (k === 0 ? '1' : k === 1 ? 'x' : `x^{${k}}`))).join('+');
          return String.raw`Secret taps: $s_{t+${i.n}}=\bigoplus_{i\in\{${[...Array(i.n).keys()].filter((k) => (i.taps >> k) & 1).join(',')}\}}s_{t+i}$, polynomial $${poly}$.` + '\n' +
            String.raw`Berlekamp–Massey on the first $${i.N}$ bits finds a register of length $L=${i.L}$; it predicts ${i.ok} of the next 48 bits correctly` + (i.ok === 48 ? String.raw` — the whole keystream is broken${i.N >= 2 * i.n ? '' : ' (lucky: fewer than $2n$ bits seen)'}.` : String.raw` (a guesser gets $24\pm3.5$). ` + (i.N < 2 * i.n ? String.raw`Fewer than $2n=${2 * i.n}$ bits: not enough equations yet.` : String.raw`The sequence has high linear complexity, so no short register explains it.`));
        });
      },
    },

    // ================================================================== 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'RC4 and ChaCha20',
      statement: String.raw`**RC4** initializes a 256-entry permutation from its key, then updates indices $i,j$, swaps $S[i],S[j]$, and outputs $S[(S[i]+S[j])\bmod256]$ (index arithmetic modulo 256). Its second output byte has an approximately doubled frequency at zero across independent keys, a useful distinguishing bias. Mantin–Shamir's Theorem 1 analyzes a uniformly random initial permutation; the key-scheduled RC4 experiment here is a separate measurement. **ChaCha20**, as specified in RFC 8439 §2, has a 256-bit key, a 32-bit block counter and a 96-bit nonce. Its 512-bit state undergoes 20 alternating column/diagonal rounds, using modular addition, XOR and rotations $16,12,8,7$, followed by addition of the input state and little-endian serialization. Counter inputs must not repeat under a key/nonce; the 32-bit counter must not wrap. A flat byte histogram is not a security proof.`,
      idea: String.raw`The RC4 event is about the permutation **before the first output step**: if $S_0[2]=0$ and $S_0[1]\ne2$, the first step leaves location 2 untouched, and the second swap forces the second output to zero. Under a uniform initial permutation this event has probability approximately $1/256$; treating the remaining outputs as approximately uniform yields the paper's approximate $2/256$ bias, not an exact formula for RC4 key scheduling. Its §3.3 reports success above 0.64 using 200 streams. ChaCha's additions introduce carries and its rotations spread differences. The diffusion plot measures working states **before feed-forward**, with one uniformly selected counter bit flipped; reaching a mean near half the bits illustrates mixing and does not quantify a security margin.`,
      caption: String.raw`Left: the second keystream byte over the selected number of reproducibly sampled keys. The y-axis expands to contain every bar; the dashed line is the uniform expectation. RC4 uses 16-byte keys; ChaCha20 uses 32-byte keys with fixed nonce and counter 1. Right: mean working-state Hamming distance over 1000 trials after each round, before feed-forward, for a counter bit chosen uniformly among all 32 bits. The readout describes only the preselected zero-byte statistic in this batch.`,
      scope: String.raw`Actual RC4 and RFC 8439 ChaCha20 round computations, checked against RFC known-answer vectors. Toy sampling uses a deterministic non-cryptographic PRNG. Mantin–Shamir Theorem 1 assumes a uniform permutation, whereas the histogram uses RC4 key scheduling; the approximate theoretical argument and the empirical comparison are distinct. These finite tests do not establish pseudorandomness.`,
      deps: ['crypto-4.1'],
      tags: ['RC4', 'ChaCha', 'bias'],
      refs: ['Mantin–Shamir, A Practical Attack on Broadcast RC4, LNCS 2355, pp. 152–164, Theorems 1–2', 'RFC 6229 §2 (RC4 vectors)', 'RFC 8439 §§2.1–2.4 (quarter round, state and block vectors)'],
      credit: 'Mantin & Shamir, FSE 2001 (proceedings 2002), §§2–3; Nir & Langley, RFC 8439 (2018), ChaCha20 specification',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/RC4', rfc: 'https://www.rfc-editor.org/rfc/rfc8439', 'RC4 original (pp. 152–164)': 'https://www.researchgate.net/profile/Ljupco-Kocarev/publication/220942382_Cryptanalysis_of_SBLH/links/0deec53a9c28f923e9000000/Cryptanalysis-of-SBLH.pdf', 'RC4 vectors': 'https://www.rfc-editor.org/rfc/rfc6229' },
      viz(v) {
        const sH = v.stage({ x: [0, 256], y: [0, 4], axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'value of the second keystream byte', ylabel: 'count ÷ expected' });
        const sC = v.stage({ x: [0, 20.5], y: [0, 270], axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'ChaCha rounds r', ylabel: 'state bits changed (of 512)' });
        const cip = v.select('Cipher (left)', ['RC4', 'ChaCha20'], 'RC4');
        const nS = v.select('Number of keys', [{ value: 4096, label: '4 096' }, { value: 16384, label: '16 384' }, { value: 65536, label: '65 536' }], 16384);
        const rS = v.slider('rounds $r$ (right)', 1, 20, 4, { step: 1, int: true });
        let seed = 1; v.button('Resample', () => { seed += 1; });
        let key = '', D = null;
        const chi = (h, N) => { let c = 0; const e = N / 256; for (let i = 0; i < 256; i++) c += (h[i] - e) ** 2 / e; return c; };
        const rnd = (r) => (Math.floor(r() * 65536) * 65536 + Math.floor(r() * 65536)) >>> 0;
        const rnd1 = (s, rd) => { if (rd % 2 === 1) { quarter(s, 0, 4, 8, 12); quarter(s, 1, 5, 9, 13); quarter(s, 2, 6, 10, 14); quarter(s, 3, 7, 11, 15); } else { quarter(s, 0, 5, 10, 15); quarter(s, 1, 6, 11, 12); quarter(s, 2, 7, 8, 13); quarter(s, 3, 4, 9, 14); } };
        v.render(() => {
          const N = nS.value, kk = N + ',' + seed;
          if (kk !== key) {
            key = kk; const r = v.rng(seed * 6007 + 11);
            const hr = new Uint32Array(256), hc = new Uint32Array(256), kb = new Array(16), kw = new Array(8), nonce = [0x09000000, 0x4a000000, 0];
            const av = new Float64Array(21), s = new Uint32Array(16), s2 = new Uint32Array(16), NA = 1000;
            for (let t = 0; t < N; t++) {
              for (let i = 0; i < 16; i++) kb[i] = Math.floor(r() * 256);
              hr[rc4(kb, 2)[1]]++;
              for (let i = 0; i < 8; i++) kw[i] = rnd(r);
              const init = chachaInit(kw, 1, nonce);
              const w = Uint32Array.from(init); for (let rd = 1; rd <= 20; rd++) rnd1(w, rd);
              hc[((w[0] + init[0]) >>> 8) & 255]++;
              if (t < NA) {
                s.set(init); s2.set(init); s2[12] ^= 1 << Math.floor(r() * 32);
                for (let rd = 1; rd <= 20; rd++) { rnd1(s, rd); rnd1(s2, rd); let c = 0; for (let i = 0; i < 16; i++) c += popcnt(s[i] ^ s2[i]); av[rd] += c / NA; }
              }
            }
            D = { hr, hc, chiR: chi(hr, N), chiC: chi(hc, N), av };
          }
          const rc = cip.value === 'RC4', h = rc ? D.hr : D.hc, e = N / 256;
          const ymax = Math.max(2.6, Math.max(...h) / e * 1.15);
          sH.setView([0, 256], [0, ymax]);
          sH.hline(1, { color: 'muted', width: 1.4, dash: true });
          for (let i = 0; i < 256; i++) sH.rect(i + 0.1, 0, i + 0.9, h[i] / e, { fill: i === 0 ? 'red' : (rc ? 'accent' : 'teal'), fillAlpha: i === 0 ? 0.8 : 0.55, color: i === 0 ? 'red' : (rc ? 'accent' : 'teal'), width: 0.6 });
          sH.text(`value 0: ${h[0]} (uniform: ${v.fix(e, 0)})`, 255, ymax * .94, { size: 11.5, color: 'red', align: 'right', weight: 700 });
          sC.setView([0, 20.5], [0, Math.max(270, ...Array.from(D.av, x => x * 1.08))]);
          sC.hline(256, { color: 'green', width: 1.8, dash: true });
          sC.text('ideal 256 (half of 512)', 20, 240, { size: 11.5, color: 'green', align: 'right', weight: 600 });
          sC.path(Array.from({ length: 20 }, (_, i) => [i + 1, D.av[i + 1]]), { color: 'teal', width: 2.4 });
          for (let i = 1; i <= 20; i++) sC.dot(i, D.av[i], { r: i === rS.value ? 7 : 3.5, color: i === rS.value ? 'gold' : 'teal' });
        });
        v.legend([['accent', 'RC4 counts'], ['teal', 'ChaCha counts / diffusion'], ['red', 'value 0']]);
        v.readout(() => {
          const rc = cip.value === 'RC4', N = nS.value, h = rc ? D.hr : D.hc, e = N / 256, r = rS.value;
          return String.raw`${rc ? 'RC4' : 'ChaCha20'}, ${N} random keys: the second byte was $0$ in ${h[0]} of them, $${v.fix(h[0] / e, 2)}\times$ the uniform expectation; that is $${v.fix((h[0] - e) / Math.sqrt(e * (1 - 1 / 256)), 1)}$ standard deviations from the uniform expectation` + (Math.abs(h[0] - e) > 4 * Math.sqrt(e) ? '. The chosen zero-byte test shows a greater-than-4σ deviation in this batch.' : '. The chosen zero-byte test shows no greater-than-4σ deviation in this batch.') + '\n' +
            String.raw`ChaCha: after $r=${r}$ round${r > 1 ? 's' : ''}, flipping one counter bit changed $${v.fix(D.av[r], 1)}$ of the 512 state bits (${v.fix(D.av[r] / 5.12, 0)}%).`;
        });
      },
    },

    // ================================================================== 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Substitution–permutation networks and the avalanche effect',
      statement: String.raw`A **substitution–permutation network** on $n=\ell m$ bits alternates round-key XOR, $m$ invertible $\ell$-bit substitutions on disjoint groups, and a fixed bit permutation. Here the final round omits the permutation and is followed by a final key XOR. Every layer is invertible, so each keyed network is a permutation. Nonlinear substitutions complicate algebraic relations; permutations spread active bits between substitutions. An **avalanche** measurement asks how output differences spread. The stronger strict avalanche condition requires, for each input bit and each output bit, flip probability $1/2$ over uniform inputs; a mean Hamming distance near $n/2$ alone does not establish it. Affine networks can spread a one-bit difference widely but still satisfy simple linear equations and are insecure.`,
      idea: String.raw`The transpose wiring sends bits from each substituted nibble to several other nibbles. Nonlinear substitutions then make subsequent differences depend on the input. The affine option here is specifically a bit rotation XOR a constant, so every key and every number of rounds preserve Hamming weight one; a general invertible affine map need not do that. The displayed network has 16 bits and four 4-bit substitutions. It is inspired by the tutorial SPN, not an AES implementation: AES uses a $4\times4$ array of bytes and a different diffusion layer. Good measured diffusion alone does not rule out differential, linear or other attacks.`,
      caption: String.raw`A 16-bit teaching SPN with Heys's Table 1 S-box, the PRESENT §3 S-box, or a deliberately weak affine rotation. Left: the input, all round states and the final whitening state (ciphertext); changed bits are red. Green wiring indicates the bit permutation between substitution groups, not literal bit values before substitution. Right: mean Hamming distance over 400 sampled inputs and independent round keys. The green reference is $8$; a uniformly random permutation on distinct 16-bit inputs has mean $8\cdot65536/65535$, extremely close to that reference. Resampling and changing controls alter the experiment, not a security theorem.`,
      scope: String.raw`The S-box tables are checked directly against Heys §2.1 Table 1 and Bogdanov et al. (2007) §3. Round keys use a reproducible non-cryptographic mixer; this is not PRESENT or AES and has no cryptographic security claim. It demonstrates mean diffusion, not the per-bit strict avalanche criterion.`,
      deps: ['crypto-3.11'],
      tags: ['SPN', 'avalanche', 'confusion and diffusion'],
      refs: ['Heys, A Tutorial on Linear and Differential Cryptanalysis, §§2.1–2.4, Tables 1–2', 'Bogdanov et al., PRESENT (CHES 2007), §3 (S-box table)'],
      credit: 'Teaching SPN after Howard M. Heys; alternate S-box from Bogdanov et al., PRESENT (2007)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Substitution%E2%80%93permutation_network', 'Heys tutorial': 'https://cs.bc.edu/straubin/crypto2017/heys.pdf', 'PRESENT original': 'https://www.researchgate.net/publication/221291660_PRESENT_An_Ultra-Lightweight_Block_Cipher' },
      viz(v) {
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 330 });
        const sA = v.stage({ x: [0, 8.5], y: [0, 16], axes: 'box', gutter: true, height: 400, minWidth: 330, xlabel: 'rounds', ylabel: 'mean changed output bits' });
        const bS = v.slider('flipped input bit', 0, 15, 5, { step: 1, int: true });
        const rS = v.slider('rounds $R$', 1, 8, 4, { step: 1, int: true });
        const sb = v.select('S-box', [{ value: 'heys', label: 'S-box A' }, { value: 'present', label: 'S-box B' }, { value: 'linear', label: 'affine' }], 'heys');
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const PERM = spnPermutation, run = spnRun;
        let keyA = '', curve = null, info = null;
        v.render(() => {
          const S = SBOXES[sb.value].S, R = rS.value, b = bS.value, r = v.rng(seed * 131 + 17);
          const ks = Array.from({ length: 9 }, (_, i) => mix2(seed * 977 + i, 31) & 0xffff), x = Math.floor(r() * 65536);
          const a = run(S, x, ks, R), c = run(S, x ^ (1 << b), ks, R);
          const key2 = sb.value + seed;
          if (key2 !== keyA) {
            keyA = key2; const rr = v.rng(99 + seed); curve = Array.from({ length: 9 }, () => 0);
            for (let t = 0; t < 400; t++) {
              const kk = Array.from({ length: 9 }, () => Math.floor(rr() * 65536)), xx = Math.floor(rr() * 65536), bb = Math.floor(rr() * 16);
              const p = run(S, xx, kk, 8), q = run(S, xx ^ (1 << bb), kk, 8);
              for (let i = 1; i <= 8; i++) curve[i] += popcnt(p[i] ^ q[i]) / 400;
            }
            curve[0] = 1;
          }
          // trial panel
          const P = pix(sT), W = P.W, H = P.H, cs = Math.min(20, (W - 90) / 16), x0 = (W - 16 * cs) / 2 + 22, top = 26, rh = Math.min(48, (H - 55) / (R + 2));
          const rows = R + 2;
          P.text('input', 8, top - 12, { size: 11, color: 'muted', align: 'left', halo: false });
          for (let i = 0; i < rows; i++) {
            const y = top + i * rh, d = a[i] ^ c[i];
            P.text(i === 0 ? 'x' : i === R + 1 ? 'out' : `r${i}`, x0 - 12, y + 9, { size: 11, color: 'muted', align: 'right', halo: false });
            for (let j = 0; j < 16; j++) {
              const bit = 15 - j, dd = (d >> bit) & 1;
              P.rect(x0 + j * cs + 1, y, cs - 2, 18, { fill: dd ? 'red' : 'faint', fillAlpha: dd ? 0.55 : 0.1, color: dd ? 'red' : 'muted', width: dd ? 1.6 : 0.8, radius: 3 });
              P.text(String((a[i] >> bit) & 1), x0 + (j + 0.5) * cs, y + 9, { size: 10.5, color: 'ink', halo: false, weight: dd ? 700 : 400 });
            }
            if (i < R) {
              for (let g = 0; g < 4; g++) P.rect(x0 + g * 4 * cs - 1, y - 3, 4 * cs + 2, 24, { fill: false, color: 'orange', width: 1.2, radius: 5, dash: true });
              if (i === 0) P.text('S', x0 + 16 * cs + 12, y + 9, { size: 11, color: 'orange', weight: 700, halo: false });
              // permutation lines to the next row: output bit j of the S layer goes to PERM(j) (last round: no permutation)
              if (i < R - 1 || false) {
                // after S, state before permutation is not stored; draw permutation lines by position
                for (let j = 0; j < 16; j++) {
                  const tj = PERM(j), changedNext = ((a[i + 1] ^ c[i + 1]) >> tj) & 1, col = changedNext ? 'red' : 'green';
                  P.line(x0 + (15 - j + 0.5) * cs, y + 21, x0 + (15 - tj + 0.5) * cs, y + rh - 2, { color: col, width: changedNext ? 1.4 : 0.7, alpha: changedNext ? 0.9 : 0.35 });
                }
              }
            } else if (i === R) { P.text('final key XOR →', x0 + 8 * cs, y + rh - 6, { size: 10, color: 'muted', halo: false });
            }
          }
          P.text(`input bit ${b} flipped`, W / 2, H - 8, { size: 11.5, color: 'red', weight: 600, halo: false });
          // curve
          sA.hline(8, { color: 'green', width: 1.6, dash: true });
          sA.text('ideal: 8 of 16', 8.4, 8.8, { size: 11.5, color: 'green', align: 'right', weight: 600 });
          sA.path(Array.from({ length: 9 }, (_, i) => [i, curve[i]]), { color: 'accent', width: 2.6 });
          for (let i = 0; i <= 8; i++) sA.dot(i, curve[i], { r: i === R ? 7 : 3.5, color: i === R ? 'gold' : 'accent' });
          const dn = popcnt(a[R + 1] ^ c[R + 1]);
          info = { dn, avg: curve[R], R, b };
        });
        v.legend([['red', 'changed bit'], ['orange', 'S-box blocks', { dash: true }], ['accent', 'average over 400 trials']]);
        v.readout(() => String.raw`Flipping input bit $${info.b}$ changed **${info.dn}** of the 16 output bits after $R=${info.R}$ rounds; averaged over 400 random inputs and keys the figure is $${v.fix(info.avg, 2)}$ (reference $8$; the exact random-permutation mean is $8\cdot65536/65535$).` + (info.avg < 3 ? ' This batch has low mean diffusion; this statistic alone does not classify a cipher.' : ''));
      },
    },

    // ================================================================== 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Feistel networks are invertible',
      statement: String.raw`Let $F_1,\dots,F_r:\{0,1\}^{n/2}\to\{0,1\}^{n/2}$ be **arbitrary** functions (they need not be invertible). The $r$-round **Feistel network** maps a block $(L_0,R_0)$ to $(L_r,R_r)$ by $$L_i=R_{i-1},\qquad R_i=L_{i-1}\oplus F_i(R_{i-1})\qquad(i=1,\dots,r).$$ Then the map $(L_0,R_0)\mapsto(R_r,L_r)$ (outputs swapped after the last round) is a **permutation** of $\{0,1\}^n$, and its inverse is the same network with the round functions applied in the reverse order $F_r,\dots,F_1$. If the $F_i$ are keyed pseudorandom functions, then (Luby–Rackoff) three rounds give a pseudorandom permutation and four rounds a strong one (secure also against inverse queries).`,
      idea: String.raw`One round can be undone given the next state: $(L_i,R_i)$ determines $R_{i-1}=L_i$ and then $L_{i-1}=R_i\oplus F_i(L_i)$, which only *evaluates* $F_i$ and never inverts it. So a round is a bijection of the $n$-bit block, a composition of bijections is a bijection, and decryption is the same circuit with reversed keys. The XOR is what makes this work; without it ($R_i=F_i(R_{i-1})$) information about $L_{i-1}$ is destroyed and the map collapses. This freedom is why block ciphers like DES (4.5) can use S-boxes that are not themselves invertible. Luby and Rackoff (1988) proved the PRF-to-PRP statement in the parent theorem's setting, via a switching lemma like 3.14.`,
      caption: String.raw`Blocks are $8$ bits ($L,R$ are nibbles). **Click the bar chart** to set the round function $F$ (a table of 16 nibbles; round $i$ uses $F_i(x)=F(x\oplus k_i)$ with distinct constants $k_i$). Choose the plaintext, then read the forward trace (left) and the backward trace (right, same network with the keys reversed): the plaintext returns. The readout checks *all 256* plaintexts. Try *random $F$* or make $F$ constant; then switch to **no XOR** and watch the number of distinct outputs collapse.`,
      scope: String.raw`Toy size ($8$-bit block, a single table $F$ shared by all rounds up to a key XOR). The Luby–Rackoff statement is quoted, not demonstrated.`,
      deps: ['crypto-3.11'],
      tags: ['Feistel', 'permutation'],
      refs: ['Katz–Lindell §7.2.2'],
      credit: 'H. Feistel, 1973 (the construction, used in IBM’s Lucifer); M. Luby & C. Rackoff, SIAM J. Comput. 17 (1988) 373–386',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Feistel_cipher', doi: 'https://doi.org/10.1137/0217022' },
      viz(v) {
        const sF = v.stage({ x: [0, 16], y: [-0.5, 17.2], axes: 'box', gutter: true, height: 200, full: true, xlabel: 'input nibble x', ylabel: 'F(x)', xticks: [0, 4, 8, 12, 15].map((t) => [t + 0.5, hx(t, 1)]), yticks: [0, 4, 8, 12, 15].map((t) => [t, hx(t, 1)]) });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 262, full: true });
        const rS = v.slider('rounds $r$', 1, 8, 4, { step: 1, int: true });
        const pS = v.slider('plaintext', 0, 255, 0x3c, { step: 1, int: true });
        const st = v.select('Round', [{ value: 'f', label: 'Feistel: $R_i=L_{i-1}\\oplus F_i(R_{i-1})$' }, { value: 'x', label: 'no XOR: $R_i=F_i(R_{i-1})$' }], 'f');
        const F = [0xE, 4, 0xD, 1, 2, 0xF, 0xB, 8, 3, 0xA, 6, 0xC, 5, 9, 0, 7].map((x, i) => (x * 5 + i) & 15);
        let sd = 1; v.button('Random $F$', () => { const r = v.rng(sd++ * 55 + 3); for (let i = 0; i < 16; i++) F[i] = Math.floor(r() * 16); });
        v.button('Constant $F$', () => { F.fill(7); });
        v.button('Permutation $F$', () => { const r = v.rng(sd++ * 55 + 9), a = [...Array(16).keys()]; for (let i = 15; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } a.forEach((x, i) => { F[i] = x; }); });
        const K = [3, 9, 5, 14, 7, 2, 11, 6];
        sF.onClick((x, y) => { const i = Math.floor(x); if (i >= 0 && i < 16) F[i] = clamp(Math.round(y), 0, 15); v.invalidate(); });
        const fi = (i, x) => F[(x ^ K[i]) & 15];
        const enc = (p, r, mode) => { let L = p >> 4, R = p & 15; const tr = [[L, R]]; for (let i = 0; i < r; i++) { const nR = mode === 'f' ? L ^ fi(i, R) : fi(i, R); L = R; R = nR; tr.push([L, R]); } return { out: (R << 4) | L, tr }; };
        const dec = (c, r) => { let R = c >> 4, L = c & 15; const tr = [[L, R]]; for (let i = r - 1; i >= 0; i--) { const pR = L, pL = R ^ fi(i, L); L = pL; R = pR; tr.push([L, R]); } return { out: (L << 4) | R, tr }; };
        let info = null;
        v.render(() => {
          const r = rS.value, p = pS.value, mode = st.value;
          for (let i = 0; i < 16; i++) { const dup = F.indexOf(F[i]) !== i || F.lastIndexOf(F[i]) !== i; sF.rect(i + 0.15, -0.5, i + 0.85, F[i] + 0.0001, { fill: dup ? 'red' : 'accent', fillAlpha: 0.35, color: dup ? 'red' : 'accent', width: 1.3 }); sF.text(hx(F[i], 1), i + 0.5, F[i] + 0.9, { size: 11.5, color: dup ? 'red' : 'accent', weight: 700 }); }
          const e = enc(p, r, mode), d = mode === 'f' ? dec(e.out, r) : null;
          const P = pix(sT), W = P.W, rows = r + 1, rh = Math.min(30, 200 / rows), colx = [W * 0.04, W * 0.54];
          P.text('encryption  (L,R) → (L,R)', colx[0] + 8, 14, { size: 12, weight: 700, color: 'accent', align: 'left', halo: false });
          P.text(mode === 'f' ? 'decryption: same network, keys reversed' : 'no decryption exists', colx[1] + 8, 14, { size: 12, weight: 700, color: mode === 'f' ? 'green' : 'red', align: 'left', halo: false });
          const draw = (tr, x0, col, label) => tr.forEach(([L, R], i) => {
            const y = 36 + i * rh, w = W * 0.15;
            P.rect(x0 + 10, y, w, rh - 8, { fill: col, fillAlpha: 0.12, color: col, width: 1.4, radius: 5 }); P.text(hx(L, 1), x0 + 10 + w / 2, y + (rh - 8) / 2, { size: 13, weight: 700, color: col, halo: false });
            P.rect(x0 + 20 + w, y, w, rh - 8, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.4, radius: 5 }); P.text(hx(R, 1), x0 + 20 + w + w / 2, y + (rh - 8) / 2, { size: 13, weight: 700, color: 'orange', halo: false });
            if (i < tr.length - 1) P.text(label(i), x0 + 30 + 2 * w + 6, y + rh / 2 - 2, { size: 11, color: 'muted', align: 'left', halo: false });
          });
          draw(e.tr, colx[0], 'accent', (i) => `F${i + 1}(R) = ${hx(fi(i, e.tr[i][1]), 1)}`);
          if (d) draw(d.tr, colx[1], 'green', (i) => `F${r - i}(R′) = ${hx(fi(r - 1 - i, d.tr[i][0]), 1)}`);
          P.text(`plaintext ${hx(p)}  →  ciphertext ${hx(e.out)}` + (d ? `  →  decrypted ${hx(d.out.valueOf())}` : ''), W / 2, 36 + rows * rh + 12, { size: 12.5, weight: 700, color: d && d.out === p ? 'green' : 'ink', halo: false });
          const imgs = new Set(), back = new Set(); let okAll = 0;
          for (let q = 0; q < 256; q++) { const o = enc(q, r, mode).out; imgs.add(o); if (mode === 'f' && dec(o, r).out === q) okAll++; }
          void back;
          const distinctF = new Set(F).size;
          info = { distinctF, nOut: imgs.size, okAll, mode, d: d ? d.out === p : false };
        });
        v.readout(() => String.raw`$F$ takes ${info.distinctF} distinct values on 16 inputs` + (info.distinctF < 16 ? ' (**not** a bijection; repeated values in red)' : ' (a bijection)') + String.raw`. The $${rS.value}$-round network sends the 256 plaintexts to **${info.nOut}** distinct ciphertexts` + (info.mode === 'f' ? String.raw`, and running it backwards recovers the plaintext for **${info.okAll} of 256** inputs: a permutation, whatever $F$ is.` : String.raw`: information is lost, so the map cannot be inverted.`));
      },
    },
  ],
};
