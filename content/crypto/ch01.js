// Cryptography — Chapter 1: Classical ciphers and their cryptanalysis (items 1.1–1.6; 1.7–1.11 in ch01-b.js)
import {
  A, mod, clamp, norm, code, shiftC, affineC, affineD, VALID_A, subC, subInv, vigC, isPerm, randomPerm, randomKey, shuffled,
  EN_P, EN_ORDER, EN_SOURCE, EN_N, FACT26, LOG2_FACT26, TOP_BIGRAMS, BI, SUM_P2, GETTYSBURG,
  LOGB, counts, total, icOf, icText, crossEnt, climbSubstitution, sciText, dur, AGE_UNIVERSE_S, groups5, rowsOf,
  pix, letterRow, tile, dashedBox,
} from './ch01.shared.js';

const PASSAGE = norm(GETTYSBURG);
const BI_LOG = (a, b) => LOGB[a][b];

// ---------------------------------------------------------------- 1.1 shared: the five toy schemes
const log10 = Math.log10;
const SCHEMES = {
  shift: { label: 'Shift', gen: (r) => ({ k: Math.floor(r() * 26) }), enc: (m, k) => shiftC(m, k.k), dec: (c, k) => shiftC(c, -k.k), show: (k) => `k = ${k.k}`, same: (a, b) => a.k === b.k, lg: () => log10(26), size: () => '26' },
  affine: { label: 'Affine', gen: (r) => ({ a: VALID_A[Math.floor(r() * 12)], b: Math.floor(r() * 26) }), enc: (m, k) => affineC(m, k.a, k.b), dec: (c, k) => affineD(c, k.a, k.b), show: (k) => `(a, b) = (${k.a}, ${k.b})`, same: (x, y) => x.a === y.a && x.b === y.b, lg: () => log10(312), size: () => '12·26 = 312' },
  vig: { label: 'Vigenère', gen: (r) => ({ w: randomKey(r, 5) }), enc: (m, k) => vigC(m, k.w), dec: (c, k) => vigC(c, k.w, true), show: (k) => k.w, same: (a, b) => a.w === b.w, lg: () => 5 * log10(26), size: () => '26⁵ ≈ 1.2×10⁷' },
  sub: { label: 'Substitution', gen: (r) => ({ p: randomPerm(r) }), enc: (m, k) => subC(m, k.p), dec: (c, k) => subC(c, subInv(k.p)), show: (k) => k.p, same: (a, b) => a.p === b.p, lg: () => LOG2_FACT26 * log10(2), size: () => '26! ≈ 4.0×10²⁶' },
  pad: { label: 'Pad as long as m', gen: (r, n) => ({ w: randomKey(r, Math.max(1, n)) }), enc: (m, k) => vigC(m, k.w), dec: (c, k) => vigC(c, k.w, true), show: (k) => k.w, same: (a, b) => a.w === b.w, lg: (n) => Math.max(1, n) * log10(26), size: (n) => `26^${Math.max(1, n)}` },
};
/** Exhaustive correctness check Dec_k(Enc_k(m)) = m over random pairs, and how often a *different* key still decrypts correctly. */
function schemeStats(id, trials, r) {
  const S = SCHEMES[id]; let ok = 0, wrongOk = 0, wrongN = 0;
  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(r() * 30), m = randomKey(r, n), k = S.gen(r, n), c = S.enc(m, k);
    if (S.dec(c, k) === m) ok++;
    let k2 = S.gen(r, n); if (S.same(k, k2)) continue;
    wrongN++; if (S.dec(c, k2) === m) wrongOk++;
  }
  return { ok, trials, wrongOk, wrongN };
}

// ---------------------------------------------------------------- 1.5/1.6 shared: histogram drawing and passages
/** Two stacked bar charts (plain above, cipher below) with arcs showing where the biggest bars moved. */
function sortedCounts(c) { return c.slice().sort((a, b) => b - a); }

export default {
  collection: 'crypto',
  chapter: 1,
  title: 'Classical ciphers and their cryptanalysis',
  summary: String.raw`For two thousand years ciphers were invented and broken in turn. Shift and substitution ciphers fall to brute force and letter frequencies, the Vigenère cipher to periodicity, and even the Enigma to mathematics and machinery. The lessons — publish the method and keep only the key secret, make the key space huge, and measure redundancy — became the principles of modern cryptography: precise definitions, explicit assumptions and proofs.`,
  items: [
    // ================================================================== 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Private-key encryption schemes',
      statement: String.raw`A **private-key (symmetric) encryption scheme** consists of a message space $\mathcal M$ and three algorithms. $\mathsf{Gen}$ outputs a key $k$ from a key space $\mathcal K$; $\mathsf{Enc}$ takes a key $k$ and a message $m\in\mathcal M$ and outputs a ciphertext $c$; $\mathsf{Dec}$ takes $k$ and $c$ and outputs a message. The scheme is **correct** when $\mathsf{Dec}_k(\mathsf{Enc}_k(m)) = m$ for every $m\in\mathcal M$ and every key $k$ that $\mathsf{Gen}$ can output. The two parties share the same $k$, agreed in advance over a secure channel; the eavesdropper sees $c$ and, by assumption, the three algorithms and the spaces $\mathcal M$, $\mathcal K$ — everything except $k$.`,
      idea: String.raw`The definition fixes the *syntax* of a cipher and the one property every cipher must have, correctness; it deliberately says nothing yet about security, which is the hard part and the subject of the rest of the book. Each classical cipher fits it: $\mathsf{Gen}$ draws a uniform shift, a pair $(a,b)$, a keyword or a permutation, and $\mathsf{Enc}$, $\mathsf{Dec}$ are the obvious inverse maps. Correctness is a property of all pairs $(k,m)$ at once, so a single wrong key (Bob's copy differs from Alice's) already breaks it.`,
      caption: String.raw`Pick a scheme, type a message and press **Gen** for fresh keys. Switch on *Bob holds a different key* to watch correctness fail: the readout counts how often a mismatched key still recovers the message. Eve sees only the ciphertext tile.`,
      deps: [],
      tags: ['encryption', 'key'],
      refs: ['Katz–Lindell §1.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Symmetric-key_algorithm' },
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290 });
        const scheme = v.select('Scheme', Object.entries(SCHEMES).map(([value, o]) => ({ value, label: o.label })), 'vig');
        const msg = v.input('Message m', 'MEET ME AT DAWN', { width: 250 });
        let ctr = 3; v.button('Gen: new key', () => { ctr++; });
        const wrong = v.toggle('Bob holds a different key', false);
        const stats = {};
        const st = (id) => (stats[id] ||= schemeStats(id, 400, v.rng(11)));
        const state = () => {
          const S = SCHEMES[scheme.value], m = msg.value, n = norm(m).length, r = v.rng(ctr * 97 + 5);
          const k = S.gen(r, n); let k2 = k;
          if (wrong.value) { const r2 = v.rng(ctr * 31 + 7); k2 = S.gen(r2, n); for (let i = 1; S.same(k, k2) && i < 50; i++) k2 = S.gen(v.rng(ctr * 31 + 7 + i), n); }
          const c = S.enc(m, k), m2 = S.dec(c, k2);
          return { S, m, n, k, k2, c, m2, ok: m2 === m.toUpperCase() };
        };
        v.render(() => {
          const P = pix(s), { W } = P, X = state(), tw = clamp(W * 0.19, 70, 190), bw = clamp(W * 0.11, 56, 110), cx = [0.115, 0.31, 0.5, 0.69, 0.885].map((f) => f * W);
          const yTop = 122, th = 76;
          // Gen and the secret channel
          const gw = clamp(W * 0.36, 150, 330);
          tile(P, W / 2 - gw / 2, 8, gw, 54, 'Gen  →  key  k', X.S.show(X.k).length > 26 ? X.S.show(X.k).slice(0, 25) + '…' : X.S.show(X.k), 'gold', { center: true, rows: 1, size: 13.5 });
          const keyColL = 'gold';
          P.path([[W / 2 - gw / 2, 36], [cx[1], 36], [cx[1], yTop + th / 2 - 24]], { color: keyColL, width: 1.8, dash: true });
          P.path([[W / 2 + gw / 2, 36], [cx[3], 36], [cx[3], yTop + th / 2 - 24]], { color: X.ok ? keyColL : 'red', width: 1.8, dash: true });
          P.arrow(cx[1], yTop + th / 2 - 36, cx[1], yTop + th / 2 - 24, { color: keyColL, head: 7 });
          P.arrow(cx[3], yTop + th / 2 - 36, cx[3], yTop + th / 2 - 24, { color: X.ok ? keyColL : 'red', head: 7 });
          P.text('secret channel', cx[1] + 8, 82, { size: 10.5, color: 'muted', halo: false, align: 'left' });
          P.text(wrong.value ? 'secret channel: k′ ≠ k' : 'secret channel: same k', cx[3] + 8, 82, { size: 10.5, color: wrong.value ? 'red' : 'muted', halo: false, align: 'left' });
          // flow
          tile(P, cx[0] - tw / 2, yTop, tw, th, 'message  m', X.m.toUpperCase(), 'blue');
          tile(P, cx[2] - tw / 2, yTop, tw, th, 'ciphertext  c', X.c, 'orange');
          tile(P, cx[4] - tw / 2, yTop, tw, th, wrong.value ? "Dec_k′(c)" : 'Dec_k(c)', X.m2, X.ok ? 'green' : 'red');
          [[1, 'Enc', 'blue'], [3, 'Dec', 'teal']].forEach(([i, lab, col]) => {
            P.rect(cx[i] - bw / 2, yTop + th / 2 - 22, bw, 44, { fill: col, fillAlpha: 0.14, color: col, width: 2, radius: 10 });
            P.text(lab + (i === 1 ? '_k' : wrong.value ? '_k′' : '_k'), cx[i], yTop + th / 2, { size: 15, weight: 700, color: col, halo: false, align: 'center' });
          });
          P.arrow(cx[0] + tw / 2, yTop + th / 2, cx[1] - bw / 2, yTop + th / 2, { color: 'ink', head: 8 });
          P.arrow(cx[1] + bw / 2, yTop + th / 2, cx[2] - tw / 2, yTop + th / 2, { color: 'ink', head: 8 });
          P.arrow(cx[2] + tw / 2, yTop + th / 2, cx[3] - bw / 2, yTop + th / 2, { color: 'ink', head: 8 });
          P.arrow(cx[3] + bw / 2, yTop + th / 2, cx[4] - tw / 2, yTop + th / 2, { color: 'ink', head: 8 });
          // people
          dashedBox(P, cx[0] - tw / 2 - 6, yTop - 22, cx[1] + bw / 2 - cx[0] + tw / 2 + 12, th + 34, 'blue', 'Alice');
          dashedBox(P, cx[3] - bw / 2 - 6, yTop - 22, cx[4] + tw / 2 - cx[3] + bw / 2 + 12, th + 34, 'teal', 'Bob');
          // Eve
          const ey = yTop + th + 34;
          P.line(cx[2], yTop + th, cx[2], ey, { color: 'red', width: 1.6, dash: true });
          P.rect(cx[2] - 112, ey, 224, 40, { fill: 'red', fillAlpha: 0.08, color: 'red', width: 1.6, radius: 8 });
          P.text('Eve sees c and the algorithms,', cx[2], ey + 14, { size: 11.5, color: 'red', weight: 600, halo: false, align: 'center' });
          P.text('not the key', cx[2], ey + 29, { size: 11.5, color: 'red', weight: 600, halo: false, align: 'center' });
        });
        v.readout(() => {
          const X = state(), t = st(scheme.value), lg = X.S.lg(X.n);
          const sz = lg > 6 ? `10^{${v.fix(lg, 1)}}` : String(Math.round(10 ** lg));
          return String.raw`$|\mathcal K| = ${scheme.value === 'sub' ? '26! \\approx 4.0\\times10^{26}' : sz}$ keys ($\approx ${v.fix(lg / log10(2), 1)}$ bits). For this $m$: $\mathsf{Dec}${wrong.value ? "_{k'}" : '_k'}(\mathsf{Enc}_k(m)) ${X.ok ? '=' : '\\neq'} m$ ${X.ok ? '✓' : '✗'}.` + '\n' +
            (wrong.value ? `With a mismatched key the message came back in **${t.wrongOk}** of ${t.wrongN} random trials (${v.fix(100 * t.wrongOk / Math.max(1, t.wrongN), 1)}%): correctness needs both parties to hold the *same* $k$.`
              : `Correctness checked on ${t.trials} random pairs $(k,m)$ with the true key: **${t.ok}/${t.trials}** decrypt correctly ✓.`);
        });
      },
    },

    // ================================================================== 1.2
    {
      num: '1.2',
      kind: 'Principle',
      name: 'Kerckhoffs’s principle',
      statement: String.raw`A cryptosystem must remain secure even if everything about it except the key is public: the algorithms $\mathsf{Gen},\mathsf{Enc},\mathsf{Dec}$, the message and key spaces, and any amount of ciphertext. Security must rest on the secrecy of the key alone. (Kerckhoffs’s second desideratum of 1883: the system should not require secrecy, and it should not be a problem if it falls into the hands of the enemy.)`,
      idea: String.raw`A design is hard to change and is copied into every device, so it leaks as soon as one device is captured or one insider talks; a key is short, can be drawn afresh at random and can be replaced after a compromise by delivering a few bytes. Publishing the design also lets many people attack it, so flaws are found before the enemy exploits them, and one published cipher can serve everybody, each with their own key. Shannon’s later maxim — assume the enemy knows the system — is the same rule.`,
      caption: String.raw`Choose what the enemy obtains: the design, the key, or both. The left system keeps its *design* secret, the right one keeps only a *key* secret. Watch which systems break, what the attacker can do with an intercepted ciphertext, and how much it costs to repair.`,
      deps: ['crypto-1.1'],
      tags: ['principle', 'security'],
      refs: ['Katz–Lindell §1.2'],
      credit: 'Auguste Kerckhoffs, “La cryptographie militaire”, Journal des sciences militaires, 1883',
      scope: String.raw`the repair-cost comparison is a schematic model with illustrative numbers; the toy ciphers stand in for any secret design and any public keyed algorithm.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kerckhoffs%27s_principle' },
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 322 });
        const leak = v.select('The enemy obtains', [{ value: 'none', label: 'nothing' }, { value: 'design', label: 'the design' }, { value: 'key', label: 'the key' }, { value: 'both', label: 'design and key' }], 'design');
        const nSt = v.slider('Stations $n$', 2, 1000, 50, { log: true, int: true, sig: 2 });
        const bits = v.slider('Key size $b$ (bits)', 40, 256, 128, { int: true, step: 8 });
        const rate = 1e12;
        const m = 'ATTACK AT DAWN', secretDesign = (x) => shiftC([...x].reverse().join(''), 3), unDesign = (x) => [...shiftC(x, -3)].reverse().join('');
        const keyB = 'HYDRANGEA';
        const cA = secretDesign(m), cB = vigC(m, keyB);
        const status = () => {
          const l = leak.value, dl = l === 'design' || l === 'both', kl = l === 'key' || l === 'both';
          return { dl, kl, aBroken: dl, bBroken: kl };
        };
        v.render(() => {
          const P = pix(s), { W } = P, X = status(), cw = (W - 18) / 2, y0 = 6;
          const card = (x, title, col, broken, rows) => {
            P.rect(x, y0, cw, 306, { fill: broken ? 'red' : 'green', fillAlpha: 0.05, color: broken ? 'red' : 'green', width: 2, radius: 12 });
            P.text(title, x + 14, y0 + 16, { size: 14.5, weight: 700, color: col, align: 'left', halo: false });
            const bx = x + cw - 104; P.rect(bx, y0 + 6, 92, 22, { fill: broken ? 'red' : 'green', fillAlpha: 0.85, color: broken ? 'red' : 'green', radius: 11 });
            P.text(broken ? 'BROKEN' : 'SECURE', bx + 46, y0 + 17, { size: 12, weight: 700, color: 'panel', halo: false, align: 'center' });
            const offs = [0, 58, 116, 196]; rows.forEach((r, i) => r(x + 14, y0 + 44 + offs[i], cw - 28));
          };
          const item = (label, sub, state, x, y, w) => { // state: 'secret' | 'public' | 'leaked' | 'none'
            const col = state === 'leaked' ? 'red' : state === 'secret' ? 'gold' : state === 'public' ? 'blue' : 'muted';
            P.rect(x, y, w, 46, { fill: col, fillAlpha: 0.1, color: col, width: 1.8, radius: 8, dash: state === 'none' });
            P.text(label, x + 10, y + 15, { size: 12.5, weight: 700, color: col, align: 'left', halo: false });
            P.text(sub, x + 10, y + 33, { size: 11.5, color: 'ink', align: 'left', halo: false });
            const tag = { secret: 'SECRET', public: 'PUBLIC', leaked: 'LEAKED', none: '—' }[state];
            P.text(tag, x + w - 10, y + 15, { size: 11, weight: 700, color: col, align: 'right', halo: false });
          };
          const line = (txt, x, y, col = 'ink', w = 600, size = 12) => P.text(txt, x, y, { size, weight: w, color: col, align: 'left', halo: false });
          const fit = (str, w, per = 6.6) => { const n = Math.floor(w / per); return str.length > n ? str.slice(0, n - 1) + '…' : str; };
          // left card: secret design
          card(6, 'Secret design', 'gold', X.aBroken, [
            (x, y, w) => item('Design D', 'reverse the text, then shift by 3', X.dl ? 'leaked' : 'secret', x, y, w),
            (x, y, w) => item('Key', 'none: the design is the whole secret', 'none', x, y, w),
            (x, y, w) => {
              line('Intercepted:  ' + cA, x, y + 6, 'orange', 700, 12.5);
              line(X.dl ? 'Attacker runs the leaked design backwards:' : 'Attacker has c only, and no idea of D.', x, y + 26, 'muted', 500, 11.5);
              line(X.dl ? '→  ' + unDesign(cA) : '→  (has to reverse-engineer D)', x, y + 46, X.dl ? 'red' : 'green', 700, 13);
            },
            (x, y, w) => {
              line('Repair after a leak', x, y + 4, 'ink', 700, 12);
              line(fit(X.dl ? `invent a new design and rebuild all ${nSt.value} stations` : 'nothing to repair so far', w - 4, 6.4), x, y + 24, X.dl ? 'red' : 'muted', 500, 11.5);
              line(fit('a single captured station exposes D', w - 4, 6.2), x, y + 42, 'muted', 500, 11);
            },
          ]);
          card(12 + cw, 'Public design + secret key', 'blue', X.bBroken, [
            (x, y, w) => item('Design D', 'published; open to peer attack', 'public', x, y, w),
            (x, y, w) => item('Key k', `${bits.value} bits, drawn at random`, X.kl ? 'leaked' : 'secret', x, y, w),
            (x, y, w) => {
              line('Intercepted:  ' + cB, x, y + 6, 'orange', 700, 12.5);
              if (X.kl) { line('Attacker uses the leaked key:', x, y + 26, 'muted', 500, 11.5); line('→  ' + vigC(cB, keyB, true), x, y + 46, 'red', 700, 13); }
              else {
                const T = Math.pow(2, bits.value - 1) / rate;
                line(fit(X.dl ? `Knows D, not k: searches 2^${bits.value} keys at 10¹²/s:` : `Knows nothing but c: searching 2^${bits.value} keys at 10¹²/s:`, w, 6.2), x, y + 26, 'muted', 500, 11.5);
                line('→  about ' + dur(T) + (T > AGE_UNIVERSE_S ? `  (${sciText(T / AGE_UNIVERSE_S, 2)} × age of the universe)` : ''), x, y + 46, T < 3600 * 24 * 365 ? 'red' : 'green', 700, 12.5);
              }
            },
            (x, y, w) => {
              line('Repair after a leak', x, y + 4, 'ink', 700, 12);
              line(fit(X.kl ? `draw a fresh key; send ${nSt.value} × ${bits.value / 8} = ${nSt.value * bits.value / 8} bytes` : X.dl ? 'nothing: the design was never a secret' : 'nothing to repair so far', w - 4, 6.4), x, y + 24, X.kl ? 'orange' : 'muted', 500, 11.5);
              line(fit('the same algorithm keeps serving everybody', w - 4, 6.2), x, y + 42, 'muted', 500, 11);
            },
          ]);
        });
        v.readout(() => {
          const X = status(), T = Math.pow(2, bits.value - 1) / 1e12;
          const a = X.aBroken ? 'broken: the secret *was* the design and cannot be changed without rebuilding every station' : 'secure only for as long as the design stays hidden, and it sits inside all $n$ stations';
          const b = X.bBroken ? 'broken until the key is replaced, and a new key is only ' + (bits.value / 8) + ' bytes per station' : X.dl ? 'still secure: the enemy knows the algorithm, but searching $2^{' + bits.value + '}$ keys takes ' + dur(T) : 'secure; the design may be public';
          return `**Secret design** is ${a}.\n**Public design + key** is ${b}.`;
        });
      },
    },

    // ================================================================== 1.3
    {
      num: '1.3',
      kind: 'Model',
      name: 'Shift cipher and exhaustive key search',
      statement: String.raw`The **shift cipher** on the alphabet $\mathbb Z_{26}$ encrypts a letter $x$ under the key $k\in\{0,\dots,25\}$ as $\mathsf{Enc}_k(x) = x + k \bmod 26$ and decrypts as $x - k \bmod 26$, letter by letter (for $k=3$ this is Caesar’s cipher). Since $|\mathcal K| = 26$, an attacker who knows only that the plaintext is English can try all 26 keys and keep the decryption that reads as English: **exhaustive key search**. Keys are tried in at most $26$ steps, so the cipher offers no security.`,
      idea: String.raw`Correctness is just $(x+k)-k\equiv x$. The attack uses redundancy: of the 26 candidate decryptions only one is a sentence, because English letter frequencies are far from uniform — the true plaintext scores best against the English letter model (here: the lowest cross-entropy, measured with the letter counts of a 3.5-trillion-letter corpus). Very short ciphertexts can have two readable decryptions, which is the idea behind unicity distance (item 1.10).

The residue-class arithmetic in nt-2.1 makes the shift and its inverse well defined: replacing a letter representative by a congruent integer does not change its encrypted class. Addition by k followed by addition by -k gives the original class modulo 26. This proves correctness of the letter map; it supplies no security against the exhaustive search described here.`,
      caption: String.raw`Type a message and turn the wheel (slider, or drag the inner ring). The table lists all 26 decryptions of the ciphertext with their English-likeness score; click a row to try that key. Tick *Paste a ciphertext* to attack a ciphertext whose key you do not know.`,
      deps: ['crypto-1.1', 'nt-2.1'],
      tags: ['shift cipher', 'brute force'],
      refs: ['Katz–Lindell §1.3'],
      credit: 'Julius Caesar, 1st century BCE (as reported by Suetonius, Life of Julius Caesar 56.6)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Caesar_cipher' },
      viz(v) {
        const wheel = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 380, weight: 1, minWidth: 300 });
        const tab = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.35, minWidth: 360 });
        const pt = v.input('Plaintext', 'MEET ME AT THE FORUM AT NOON', { width: 280 });
        const kSl = v.slider('Key $k$', 0, 25, 3, { int: true });
        const own = v.toggle('Paste a ciphertext', false);
        const ctIn = v.input('Ciphertext', 'WKH HQHPB DWWDFNV DW GDZQ', { width: 280 });
        let guess = null; // selected row
        const cipher = () => (own.value ? ctIn.value.toUpperCase() : shiftC(pt.value, kSl.value));
        const rows = () => {
          const ct = cipher(), L = norm(ct);
          const res = Array.from({ length: 26 }, (_, k) => ({ k, text: shiftC(ct, -k), ce: L.length ? crossEnt(shiftC(L, -k)) : 0 }));
          const order = res.slice().sort((a, b) => a.ce - b.ce);
          return { res, best: order[0], second: order[1], L, ct };
        };
        wheel.onDrag((x, y, phase) => {
          const a = Math.atan2(y, x), k = mod(Math.round((Math.PI / 2 - a) / (2 * Math.PI) * 26) , 26);
          if (Math.hypot(x, y) > 0.35 && !own.value) { kSl.set(mod(k - 0, 26)); guess = null; }
        });
        tab.onClick((x, y) => {
          const P = pix(tab), [px, py] = P.at(x, y), i = Math.floor((py - 52) / 12.6);
          if (i >= 0 && i < 26) guess = i;
        });
        v.render(() => {
          const R = rows(), kShow = guess != null ? guess : own.value ? R.best.k : kSl.value;
          // ---- wheel: outer ring plaintext alphabet, inner ring ciphertext letters rotated by k
          const ro = 1.12, ri = 0.8, step = 2 * Math.PI / 26;
          wheel.circle(0, 0, ro + 0.1, { color: 'faint', width: 1.2, fill: false });
          wheel.circle(0, 0, 0.62, { color: 'faint', width: 1.2, fill: false });
          for (let i = 0; i < 26; i++) {
            const a = Math.PI / 2 - i * step, ai = a - kShow * 0 ; // plain letter i on the outer ring (fixed)
            wheel.text(A[i], ro * Math.cos(a), ro * Math.sin(a), { size: 14, weight: 700, color: 'blue', align: 'center', halo: false });
            const ci = mod(i + kShow, 26); // cipher letter under plain letter i (inner ring rotates)
            wheel.text(A[ci], ri * Math.cos(a), ri * Math.sin(a), { size: 13, weight: 700, color: 'orange', align: 'center', halo: false });
            wheel.line(0.9 * Math.cos(a), 0.9 * Math.sin(a), 0.99 * Math.cos(a), 0.99 * Math.sin(a), { color: 'faint', width: 1 });
          }
          wheel.text('plain', 0, 0.2, { size: 12, color: 'blue', weight: 700, align: 'center', halo: false });
          wheel.text('cipher', 0, -0.08, { size: 12, color: 'orange', weight: 700, align: 'center', halo: false });
          wheel.text(`k = ${kShow}`, 0, -0.36, { size: 15, color: 'ink', weight: 700, align: 'center', halo: false });
          // a mark on A: shows the rotation
          wheel.arrow(0, 0.3, 0, 0.5, { color: 'gold', width: 2.2, head: 7 });
          // ---- table
          const P = pix(tab), { W, H } = P, rh = 12.6, y0 = 52, tx = 52, bx = W - 150, bw = 118;
          P.text('k', 14, 38, { size: 11, color: 'muted', align: 'center', weight: 700, halo: false });
          P.text('decryption of the ciphertext with key k', tx, 38, { size: 11, color: 'muted', align: 'left', weight: 700, halo: false });
          P.text('English-likeness (bits/letter)', bx, 38, { size: 11, color: 'muted', align: 'left', weight: 700, halo: false });
          const ces = R.res.map((r) => r.ce), lo = Math.min(...ces), hi = Math.max(...ces);
          const truth = own.value ? null : kSl.value;
          R.res.forEach((r, i) => {
            const y = y0 + i * rh, isBest = r.k === R.best.k, sel = r.k === guess;
            if (isBest || sel) P.rect(4, y - 6, W - 8, rh, { fill: isBest ? 'green' : 'accent', fillAlpha: 0.14, stroke: false, radius: 4 });
            P.text(String(r.k), 14, y, { size: 11, weight: 700, color: isBest ? 'green' : r.k === truth ? 'orange' : 'muted', align: 'center', halo: false });
            const cw = 8.1, maxc = Math.max(8, Math.floor((bx - tx - 14) / cw));
            const txt = r.text.length > maxc ? r.text.slice(0, maxc - 1) + '…' : r.text;
            for (let j = 0; j < txt.length; j++) if (txt[j] !== ' ') P.text(txt[j], tx + (j + 0.5) * cw, y, { size: 11.5, weight: isBest ? 700 : 500, color: isBest ? 'green' : 'ink', align: 'center', halo: false });
            const frac = hi > lo ? (hi - r.ce) / (hi - lo) : 0;
            P.rect(bx, y - 3.5, Math.max(1.5, bw * frac), 7, { fill: isBest ? 'green' : 'muted', fillAlpha: isBest ? 0.85 : 0.35, stroke: false, radius: 2 });
            P.text(r.ce.toFixed(2), bx + bw + 6, y, { size: 10.5, color: isBest ? 'green' : 'muted', align: 'left', halo: false });
          });
        });
        v.readout(() => {
          const R = rows(); if (R.L.length < 2) return 'Type at least two letters.';
          const gap = R.second.ce - R.best.ce, truth = own.value ? null : kSl.value;
          const hit = truth == null ? '' : R.best.k === truth ? ` — the true key ($k = ${truth}$) ✓` : ` — **not** the true key ($k = ${truth}$): too short to tell`;
          return String.raw`26 keys tried (at most $\log_2 26\approx 4.7$ bits to search). Best-scoring key: **$k = ${R.best.k}$** with ${v.fix(R.best.ce, 2)} bits/letter${hit}.` + '\n' +
            String.raw`Runner-up: $k=${R.second.k}$ at ${v.fix(R.second.ce, 2)}; the gap is ${v.fix(gap, 2)} bits/letter. English itself costs ${v.fix(-EN_P.reduce((a, p) => a + p * Math.log2(p), 0), 2)} bits/letter; a random shift of it costs about ${v.fix(-EN_P.reduce((a, p) => a + (1 / 26) * Math.log2(p), 0), 2)}. Letter model: ${EN_SOURCE}.` +
            (own.value ? '' : '\n' + String.raw`Reading: ciphertext letter $=$ plaintext $+\,${kSl.value}$ (mod 26).`);
        });
      },
    },

    // ================================================================== 1.4
    {
      num: '1.4',
      kind: 'Principle',
      name: 'Sufficient key-space principle',
      statement: String.raw`Any secure encryption scheme must have a key space large enough to rule out exhaustive search: an attacker who tries every key, at the fastest rate any adversary could reach, must still need an unaffordable amount of time. With $b$-bit keys a search finds the key after about $2^{b-1}$ trials on average, so at $R$ guesses per second it needs $2^{b-1}/R$ seconds. The principle is a *necessary* condition only: a huge key space does not by itself make a scheme secure (see the monoalphabetic substitution cipher, item 1.5).`,
      idea: String.raw`Exhaustive key search supplies an upper bound on an attacker’s optimal work, since other attacks may be faster. That search’s cost is linear in $2^b$, hence exponential in the key length: every added bit approximately doubles its expected work while costing the defender almost nothing, which is why designers pick keys with enough margin ($\ge 128$ bits today) to survive faster hardware, parallel machines and decades of progress.

For $N$ equally likely keys in a fixed search order, write the number of trials as the sum of the indicators that trial $j$ is reached. Linearity of expectation prob-1.6.1 gives the sum of $(N-j+1)/N$ for $j=1,\ldots,N$, namely $(N+1)/2$. With $N=2^b$ this is the displayed approximate half-keyspace work; dividing by a fixed trial rate converts trials to time. No independence of those indicators is needed.`,
      caption: String.raw`Each straight line is the average search time against $b$-bit keys for one attacker speed. Drag the point along the gold line (or the slider) to choose $b$, and change the attacker’s speed. The purple point is a real data point: the 56-bit DES key found by EFF’s Deep Crack in 1998.`,
      deps: ['crypto-1.3', 'prob-1.6.1'],
      tags: ['key space', 'brute force'],
      refs: ['Katz–Lindell §1.3'],
      scope: String.raw`average time for a uniformly random key and an attacker who can test $R$ keys per second; the speeds shown are illustrative, except Deep Crack (EFF: over $9\times10^{10}$ keys per second, 1998).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brute-force_attack' },
      viz(v) {
        const L2 = Math.log10(2);
        const yOf = (b, R) => (b - 1) * L2 - Math.log10(R);
        const secs = [[0, '1 s'], [Math.log10(3600), '1 hour'], [Math.log10(86400), '1 day'], [Math.log10(31557600), '1 year'], [Math.log10(31557600 * 100), '100 years'], [Math.log10(AGE_UNIVERSE_S), 'age of universe']];
        const s = v.stage({ x: [0, 140], y: [-3, 36], axes: 'box', gutter: { l: 66, r: 10, t: 24, b: 46 }, height: 410, xlabel: 'key length b (bits)', ylabel: 'average search time, log₁₀ of seconds', xticks: [0, 20, 40, 56, 80, 100, 128].map((x) => [x, String(x)]), yticks: [[-3, '10⁻³'], ...secs.slice(0, 4).map((x) => x), [Math.log10(AGE_UNIVERSE_S), '13.8 Gyr'], [25, '10²⁵'], [30, '10³⁰'], [35, '10³⁵']] });
        const rate = v.slider('Attacker speed $R$ (keys/s)', 1e3, 1e21, 1e12, { log: true, sig: 2, fmt: (x) => sciText(x, 2) });
        const bSl = v.slider('Key length $b$ (bits)', 1, 140, 56, { int: true, onChange: (b) => hb.set(b, yOf(b, rate.value)) });
        const hb = s.handle(56, yOf(56, 1e12), { color: 'gold', r: 8, label: 'b', constrain: (x) => { const b = clamp(Math.round(x), 1, 140); return [b, yOf(b, rate.value)]; } });
        hb.onDrag = () => { bSl.set(Math.round(hb.x)); };
        const presets = [{ R: 1e9, c: 'blue', name: 'laptop-class, $10^{9}$ keys/s' }, { R: 9e10, c: 'purple', name: 'EFF Deep Crack 1998, $9\\times10^{10}$' }, { R: 1e18, c: 'teal', name: 'a hypothetical $10^{18}$ keys/s' }];
        const marks = [[4.7, 'shift'], [8.3, 'affine'], [37.6, 'Vigenère-8'], [56, 'DES'], [128, 'AES-128']];
        v.render(() => {
          s.clip(() => {
            secs.forEach(([y, lab], i) => s.hline(y, { color: i === 5 ? 'red' : 'faint', width: i === 5 ? 1.6 : 1, dash: true }));
          });
          secs.forEach(([y, lab], i) => s.text(lab, 139, y + 0.9, { size: 10.5, color: i === 5 ? 'red' : 'muted', align: 'right', halo: true }));
          marks.forEach(([b, lab], i) => { s.vline(b, { color: 'faint', width: 1, dash: true }); s.text(lab, b + 1, 34.2 - (i % 2) * 1.8, { size: 10.5, color: 'muted', align: 'left' }); });
          presets.forEach((p) => { s.line(1, yOf(1, p.R), 140, yOf(140, p.R), { color: p.c, width: 1.6, alpha: 0.8 }); });
          s.line(1, yOf(1, rate.value), 140, yOf(140, rate.value), { color: 'gold', width: 3 });
          s.dot(56, Math.log10(56 * 3600), { r: 6, color: 'purple', hollow: true });
          s.text('DES key found in 56 h (1998)', 58, Math.log10(56 * 3600) - 1.8, { size: 10.5, color: 'purple', align: 'left' });
          hb.set(bSl.value, yOf(bSl.value, rate.value));
        });
        v.legend([['gold', 'your speed'], ['blue', 'laptop $10^9$/s'], ['purple', 'Deep Crack $9\\times10^{10}$/s'], ['teal', '$10^{18}$/s'], ['red', 'age of the universe', { dash: true }]]);
        v.readout(() => {
          const b = bSl.value, T = Math.pow(2, b - 1) / rate.value, ratio = T / AGE_UNIVERSE_S;
          const deep = Math.pow(2, 55) / 9e10;
          return String.raw`$b = ${b}$ bits: $2^{${b - 1}}$ trials on average at ${sciText(rate.value, 2)} keys/s $\Rightarrow$ **${dur(T)}**` + (ratio > 1e-3 ? String.raw` (${ratio >= 1 ? sciText(ratio, 2) : v.fix(ratio, 3)} $\times$ the age of the universe, 13.8 Gyr)` : '') + '.\n' +
            String.raw`Check against history: searching all of DES’s $2^{56}$ keys at $9\times10^{10}$/s would take at most ${dur(2 * deep)}; Deep Crack found the winning key after 56 hours, about ${v.fix(100 * 56 * 3600 / (2 * deep), 0)}% of a full search — a lucky but unremarkable draw.`;
        });
      },
    },

    // ================================================================== 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Monoalphabetic substitution cipher',
      statement: String.raw`A **monoalphabetic substitution cipher** has as key a permutation $\pi$ of the alphabet and replaces every plaintext letter $x$ by $\pi(x)$, always the same one. There are $26! \approx 4.03\times 10^{26}$ keys ($\approx 88.4$ bits), far beyond exhaustive search, yet the cipher is insecure: because each letter is renamed consistently, the multiset of letter counts of the ciphertext is exactly that of the plaintext, only moved to other letters. Shift ($26$ keys) and affine ($12\cdot 26 = 312$ keys) ciphers are special cases.`,
      idea: String.raw`A large key space is necessary (item 1.4) but not sufficient. The cipher leaks the *shape* of the plaintext distribution: the sorted letter frequencies of the ciphertext coincide with those of the plaintext, and so does the index of coincidence $\sum_i n_i(n_i-1)/N(N-1)$. Since English has a very uneven, well-measured shape, the permutation can be read off from the data (item 1.6); the cipher hides *which* letter is frequent, not *that* some letters are.

The permutation count comb-1.5 gives the key-space size: assign the image of the first alphabet letter in 26 ways, the second in 25 remaining ways, and continue down to one. Thus there are $26!$ full substitutions. This counts bijections rather than arbitrary 26-to-26 functions; the latter would include maps that lose information and cannot decrypt. The count does not remove the frequency invariant exploited here.`,
      caption: String.raw`Choose the key family and press **New key**. The two bar charts are the plaintext and ciphertext letter counts: the same bars, moved by the key (lines trace the six tallest). The right panel sorts both by size: the curves coincide exactly, whatever the key. Edit the text freely.`,
      deps: ['crypto-1.4', 'comb-1.5'],
      tags: ['substitution', 'frequencies'],
      refs: ['Katz–Lindell §1.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Substitution_cipher' },
      viz(v) {
        const text = GETTYSBURG.slice(0, GETTYSBURG.indexOf('We have come') + 30);
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 372, weight: 1.6, minWidth: 420 });
        const sr = v.stage({ x: [0.5, 26.5], y: [0, 0.14], axes: 'box', gutter: true, height: 372, weight: 1, minWidth: 300, xlabel: 'rank (1 = most frequent letter)', ylabel: 'relative frequency', yticks: [0, 0.04, 0.08, 0.12].map((y) => [y, String(Math.round(y * 100)) + '%']), xticks: [1, 5, 10, 15, 20, 26].map((x) => [x, String(x)]) });
        const fam = v.select('Key family', [{ value: 'shift', label: 'shift (26)' }, { value: 'affine', label: 'affine (312)' }, { value: 'perm', label: 'any permutation (26!)' }], 'perm');
        let ctr = 1; v.button('New key', () => { ctr++; });
        const inp = v.input('Plaintext', text, { width: 380 });
        const keyOf = () => {
          const r = v.rng(ctr * 7919 + 13);
          if (fam.value === 'shift') { const k = Math.floor(r() * 25) + 1; return [...A].map((_, i) => A[(i + k) % 26]).join(''); }
          if (fam.value === 'affine') { const a = VALID_A[1 + Math.floor(r() * 11)], b = Math.floor(r() * 26); return [...A].map((_, i) => A[(a * i + b) % 26]).join(''); }
          return randomPerm(r);
        };
        const calc = () => {
          const key = keyOf(), P = norm(inp.value), C = subC(P, key), cp = counts(P), cc = counts(C);
          return { key, P, C, cp, cc };
        };
        const palette = ['red', 'orange', 'gold', 'green', 'teal', 'purple'];
        v.render(() => {
          const X = calc(), P = pix(s), { W } = P, n = X.P.length || 1;
          const left = 30, cw = (W - 2 * left) / 26;
          // key table
          P.text('key π: each plaintext letter (blue) is replaced by the letter below it (orange)', 8, 10, { size: 11, color: 'muted', weight: 600, align: 'left', halo: false });
          for (let i = 0; i < 26; i++) {
            const x = left + (i + 0.5) * cw;
            P.text(A[i], x, 30, { size: 12.5, weight: 700, color: 'blue', align: 'center', halo: false });
            P.text('↓', x, 41, { size: 8, color: 'faint', align: 'center', halo: false });
            P.text(X.key[i], x, 54, { size: 12.5, weight: 700, color: 'orange', align: 'center', halo: false });
          }
          // histograms
          const hMax = Math.max(...X.cp, ...X.cc, 1), top1 = 84, bh = 92, top2 = 234;
          const bars = (cnt, y0, col, lab) => {
            P.line(left, y0 + bh, W - left, y0 + bh, { color: 'faint', width: 1 });
            P.text(lab, 8, y0 - 1, { size: 11, color: col, weight: 700, align: 'left', halo: false });
            for (let i = 0; i < 26; i++) {
              const h = (cnt[i] / hMax) * (bh - 8), x = left + i * cw;
              if (h > 0) P.rect(x + 2, y0 + bh - h, cw - 4, h, { fill: col, fillAlpha: 0.5, color: col, width: 1, radius: 2 });
              P.text(A[i], x + cw / 2, y0 + bh + 11, { size: 10.5, color: col, align: 'center', weight: 600, halo: false });
            }
          };
          bars(X.cp, top1, 'blue', 'plaintext letter counts');
          bars(X.cc, top2, 'orange', 'ciphertext letter counts');
          const order = [...Array(26).keys()].sort((a, b) => X.cp[b] - X.cp[a]).slice(0, 6);
          order.forEach((i, r) => { const j = X.key.charCodeAt(i) - 65; if (X.cp[i]) P.line(left + (i + 0.5) * cw, top1 + bh + 20, left + (j + 0.5) * cw, top2 - 6, { color: palette[r], width: 2, alpha: 0.9 }); });
          // sorted curves
          sr.setView([0.5, 26.5], [0, Math.max(0.14, Math.max(...X.cp) / n * 1.1)]);
          const sp = X.cp.slice().sort((a, b) => b - a).map((c) => c / n), sc = X.cc.slice().sort((a, b) => b - a).map((c) => c / n);
          const en = EN_P.slice().sort((a, b) => b - a);
          sr.path(en.map((y, i) => [i + 1, y]), { color: 'muted', width: 1.6, dash: true });
          sr.path(sp.map((y, i) => [i + 1, y]), { color: 'blue', width: 4, alpha: 0.5 });
          sr.path(sc.map((y, i) => [i + 1, y]), { color: 'orange', width: 1.8 });
          sr.dots(sc.map((y, i) => [i + 1, y]), { r: 3, color: 'orange' });
        });
        v.legend([['blue', 'plaintext, sorted'], ['orange', 'ciphertext, sorted'], ['muted', 'English corpus, sorted', { dash: true }]]);
        v.readout(() => {
          const X = calc(), n = X.P.length;
          if (n < 10) return 'Type at least ten letters.';
          const same = X.cp.slice().sort((a, b) => b - a).every((c, i) => c === X.cc.slice().sort((a, b) => b - a)[i]);
          const nk = fam.value === 'shift' ? 25 : fam.value === 'affine' ? 311 : null;
          const T = (nk ? nk : Number(FACT26)) / 1e9;
          return String.raw`Key family: ${nk ? `${nk + 1} keys` : '$26!\\approx 4.03\\times10^{26}$ keys'}; searching them at $10^9$ keys/s takes ${dur(T)}.` + '\n' +
            String.raw`Sorted counts of ciphertext = sorted counts of plaintext: **${same ? '✓ identical' : '✗'}**. Index of coincidence: plaintext $${v.fix(icOf(X.cp), 4)}$, ciphertext $${v.fix(icOf(X.cc), 4)}$ (uniform random text: $1/26 = 0.0385$; English corpus $\sum p_i^2 = ${v.fix(SUM_P2, 4)}$, ${EN_SOURCE}).`;
        });
      },
    },

    // ================================================================== 1.6
    {
      num: '1.6',
      kind: 'Method',
      name: 'Frequency analysis',
      statement: String.raw`**Frequency analysis** breaks a monoalphabetic substitution cipher using the statistics of the plaintext language. Count the ciphertext letters; the most frequent ones stand for the most frequent English letters ($\mathrm{E},\mathrm{T},\mathrm{A},\mathrm{O},\mathrm{I},\mathrm{N},\dots$); refine the guess with pairs of letters (digrams such as TH, HE, IN, ER) and with the words that start to appear, until the whole permutation is determined. It succeeds when the ciphertext is long enough that the counts are close to the language’s true frequencies.`,
      idea: String.raw`The cipher renames letters but keeps every statistic of the text (item 1.5), so counts alone give a first, partly wrong assignment, and each correct letter makes its neighbours’ identity predictable through digram statistics. Scoring a candidate key by the log-likelihood of the decryption under a bigram model of English (here estimated from billions of letters) turns the hand method into hill-climbing: swap two letters of the key, keep the swap if the text becomes more English.

The positive-product logarithm identity pma-8.6 converts a bigram-model likelihood into a sum of transition log-probabilities, together with the initial-letter term. Maximizing that sum is equivalent to maximizing the likelihood, since log is increasing. A zero transition probability instead gives zero likelihood and cannot be treated as a finite log term. This algebra explains the scoring rule; it does not prove that hill-climbing finds the best substitution or that the language model is exact.`,
      caption: String.raw`Bars: ciphertext letters by frequency, with the English letter for that rank underneath. Click a ciphertext letter, then click the plaintext letter you think it stands for; the text below fills in. **Rank match** assigns by frequency alone, **Hill-climb** runs the bigram search. Paste any substitution ciphertext into the field.`,
      deps: ['crypto-1.5', 'pma-8.6'],
      tags: ['cryptanalysis', 'frequencies'],
      refs: ['Katz–Lindell §1.3'],
      credit: 'Al-Kindi, 9th century (A Manuscript on Deciphering Cryptographic Messages)',
      scope: String.raw`needs a ciphertext of a few hundred letters; with fewer, the counts differ too much from the language’s.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frequency_analysis' },
      viz(v) {
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 266, full: true });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 236, full: true });
        const sC = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 168, full: true });
        const PLAIN = PASSAGE.slice(0, 420);
        let seed = 5, puzzle = null;
        const mk = () => { const r = v.rng(seed * 101 + 3), key = randomPerm(r); puzzle = { key, plain: PLAIN, cipher: subC(PLAIN, key), dec: subInv(key) }; return groups5(puzzle.cipher); };
        let guess = Array(26).fill(-1), sel = -1;
        const inp = v.input('Ciphertext', mk(), { width: 360, onChange: () => { guess = Array(26).fill(-1); sel = -1; } });
        v.button('New puzzle', () => { seed++; inp.set(mk()); guess = Array(26).fill(-1); sel = -1; });
        v.button('Rank match', () => { const c = counts(norm(inp.value)), by = [...Array(26).keys()].sort((a, b) => c[b] - c[a]); guess = Array(26).fill(-1); by.forEach((ci, i) => { if (c[ci]) guess[ci] = code(EN_ORDER[i]); }); });
        v.button('Hill-climb', () => { const ct = norm(inp.value); if (ct.length < 30) return; const res = climbSubstitution(ct, v.rng(99 + seed), { restarts: 8, iters: 6000 }); const c = counts(ct); guess = res.dec.map((p, ci) => (c[ci] ? p : -1)); });
        v.button('Clear', () => { guess = Array(26).fill(-1); sel = -1; });
        const info = () => {
          const ct = norm(inp.value), c = counts(ct), by = [...Array(26).keys()].sort((a, b) => c[b] - c[a] || a - b);
          const truth = puzzle && ct === puzzle.cipher ? puzzle.dec : null;
          return { ct, c, by, truth, n: ct.length };
        };
        const place = (ci, p) => { for (let j = 0; j < 26; j++) if (guess[j] === p) guess[j] = -1; guess[ci] = p; };
        const L = { left: 14, cw: 0 };
        sA.onClick((x, y) => {
          const P = pix(sA), [px, py] = P.at(x, y), I = info(), cw = (P.W - 78) / 26, i = Math.floor((px - 64) / cw);
          if (i < 0 || i > 25) return;
          if (py < 196) { sel = I.by[i]; }
          else if (py > 214 && py < 250 && sel >= 0) { place(sel, i); }
        });
        v.render(() => {
          const I = info(), P = pix(sA), { W } = P, cw = (W - 78) / 26, n = Math.max(1, I.n), hMax = Math.max(...I.c, 1) / n;
          // bars sorted by frequency rank
          const top = 20, bh = 112;
          P.line(64, top + bh, W - 14, top + bh, { color: 'faint', width: 1 });
          P.text('ciphertext letters by frequency (bars) · English frequency at the same rank (dots)', 14, 9, { size: 11, weight: 600, color: 'muted', align: 'left', halo: false });
          I.by.forEach((ci, r) => {
            const x = 64 + r * cw, f = I.c[ci] / n, h = (f / Math.max(hMax, EN_P[code(EN_ORDER[0])])) * (bh - 8);
            const isSel = ci === sel;
            P.rect(x + 2, top + bh - h, cw - 4, Math.max(h, 0), { fill: isSel ? 'gold' : 'orange', fillAlpha: isSel ? 0.7 : 0.45, color: isSel ? 'gold' : 'orange', width: 1, radius: 2 });
            const eh = (EN_P[code(EN_ORDER[r])] / Math.max(hMax, EN_P[code(EN_ORDER[0])])) * (bh - 8);
            P.dot(x + cw / 2, top + bh - eh, { r: 3, color: 'blue' });
            P.text(A[ci], x + cw / 2, top + bh + 14, { size: 13, weight: 700, color: isSel ? 'gold' : 'orange', align: 'center', halo: false });
            P.text(EN_ORDER[r], x + cw / 2, top + bh + 31, { size: 10.5, weight: 600, color: 'muted', align: 'center', halo: false });
            const g = guess[ci];
            const okc = I.truth ? (g === code(I.truth[ci]) ? 'green' : 'red') : 'green';
            P.text(g >= 0 ? A[g].toLowerCase() : '·', x + cw / 2, top + bh + 50, { size: 14, weight: 700, color: g >= 0 ? okc : 'faint', align: 'center', halo: false });
          });
          P.text('cipher', 8, top + bh + 14, { size: 9.5, color: 'orange', weight: 700, align: 'left', halo: false });
          P.text('English', 8, top + bh + 31, { size: 9.5, color: 'muted', weight: 700, align: 'left', halo: false });
          P.text('your key', 8, top + bh + 50, { size: 9.5, color: 'green', weight: 700, align: 'left', halo: false });
          // plaintext strip
          P.text(sel >= 0 ? `assign a plaintext letter to ciphertext letter ${A[sel]}:` : 'click a ciphertext letter above, then choose its plaintext letter:', 64, 216, { size: 11, color: 'muted', weight: 600, align: 'left', halo: false });
          const used = new Set(guess.filter((x) => x >= 0));
          for (let i = 0; i < 26; i++) {
            const x = 64 + i * cw, isU = used.has(i), cur = sel >= 0 && guess[sel] === i;
            P.rect(x + 1.5, 224, cw - 3, 30, { fill: cur ? 'green' : 'accent', fillAlpha: cur ? 0.35 : isU ? 0.04 : 0.12, color: cur ? 'green' : 'faint', width: 1.2, radius: 5 });
            P.text(A[i], x + cw / 2, 239, { size: 13, weight: 700, color: isU ? 'faint' : 'blue', align: 'center', halo: false });
          }
        });
        v.render(() => {
          const I = info(), P = pix(sB), { W } = P, cw = 10.2, per = Math.max(16, Math.floor((W - 28) / cw)), rows = Math.min(5, Math.ceil(I.n / per));
          const shown = I.ct.slice(0, per * rows);
          rowsOf(shown, per).forEach((r, k) => {
            const y = 20 + k * 44;
            letterRow(P, r, 14, y, cw, () => 'muted', { size: 12.5, weight: 600 });
            for (let i = 0; i < r.length; i++) {
              const ci = code(r[i]), g = guess[ci];
              const col = g < 0 ? 'faint' : I.truth ? (g === code(I.truth[ci]) ? 'green' : 'red') : 'green';
              P.text(g >= 0 ? A[g].toLowerCase() : '·', 14 + (i + 0.5) * cw, y + 18, { size: 14, weight: 700, color: col, align: 'center', halo: false });
            }
          });
          if (I.n > shown.length) P.text(`… ${I.n - shown.length} more letters`, 14, 20 + rows * 44, { size: 11, color: 'muted', align: 'left', halo: false });
        });
        v.render(() => {
          const I = info(), P = pix(sC), { W } = P, N = Math.max(1, I.n - 1);
          const dg = {}; for (let i = 0; i + 1 < I.ct.length; i++) { const k = I.ct.substr(i, 2); dg[k] = (dg[k] || 0) + 1; }
          const top = Object.entries(dg).sort((a, b) => b[1] - a[1]).slice(0, 8), biTot = TOP_BIGRAMS.reduce((s, x) => s + x[1], 0);
          const colW = W / 2 - 14;
          P.text('most common ciphertext digrams → what your key reads', 14, 12, { size: 11, weight: 700, color: 'orange', align: 'left', halo: false });
          P.text('most common English digrams (' + EN_SOURCE.split(',')[0] + ')', W / 2 + 6, 12, { size: 11, weight: 700, color: 'blue', align: 'left', halo: false });
          top.forEach(([d, k], i) => {
            const y = 34 + i * 16, g = [...d].map((ch) => (guess[code(ch)] >= 0 ? A[guess[code(ch)]].toLowerCase() : '·')).join('');
            P.text(d, 20, y, { size: 12.5, weight: 700, color: 'orange', align: 'left', halo: false });
            P.rect(54, y - 5, Math.max(2, (k / top[0][1]) * (colW - 190)), 10, { fill: 'orange', fillAlpha: 0.35, stroke: false, radius: 2 });
            P.text(`${v.fix(100 * k / N, 1)}%`, 60 + (k / top[0][1]) * (colW - 190), y, { size: 10.5, color: 'muted', align: 'left', halo: false });
            P.text('→ ' + g, colW - 52, y, { size: 13, weight: 700, color: 'green', align: 'left', halo: false });
            const [e, ek] = TOP_BIGRAMS[i];
            P.text(e, W / 2 + 12, y, { size: 12.5, weight: 700, color: 'blue', align: 'left', halo: false });
            P.rect(W / 2 + 46, y - 5, (ek / TOP_BIGRAMS[0][1]) * (colW - 110), 10, { fill: 'blue', fillAlpha: 0.35, stroke: false, radius: 2 });
            P.text(`${v.fix(100 * ek / biTot, 2)}%`, W / 2 + 52 + (ek / TOP_BIGRAMS[0][1]) * (colW - 110), y, { size: 10.5, color: 'muted', align: 'left', halo: false });
          });
        });
        v.readout(() => {
          const I = info(); if (I.n < 20) return 'Paste at least 20 letters of ciphertext.';
          const assigned = guess.filter((g, ci) => g >= 0 && I.c[ci]).length, present = I.c.filter((x) => x).length;
          let acc = '', ce = '';
          if (I.truth) { let ok = 0, tot = 0; I.ct.split('').forEach((ch) => { tot++; if (guess[code(ch)] === code(I.truth[code(ch)])) ok++; }); acc = assigned ? ` Against the true plaintext: **${v.fix(100 * ok / tot, 1)}%** of the letters are right.` : ''; }
          const dec = [...I.ct].map((ch) => guess[code(ch)]), pairs = []; for (let i = 1; i < dec.length; i++) if (dec[i - 1] >= 0 && dec[i] >= 0) pairs.push(-BI_LOG(dec[i - 1], dec[i]));
          if (pairs.length > 30) ce = ` On the ${pairs.length} decoded letter pairs the bigram model reads **${v.fix(pairs.reduce((a, b) => a + b, 0) / pairs.length, 2)}** bits/letter (English: about 3.3, random letters: 4.7+).`;
          return `${assigned} of the ${present} ciphertext letters assigned.${acc}${ce}`;
        });
      },
    },
  ],
};
