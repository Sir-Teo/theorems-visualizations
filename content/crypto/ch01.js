// Cryptography — Chapter 1: Classical ciphers and their cryptanalysis (items 1.1–1.6; 1.7–1.11 in ch01-b.js)
import {
  A, mod, clamp, norm, code, shiftC, affineC, affineD, VALID_A, subC, subInv, vigC, isPerm, randomPerm, randomKey, shuffled,
  EN_P, EN_ORDER, EN_SOURCE, EN_N, FACT26, LOG2_FACT26, TOP_BIGRAMS, BI, SUM_P2, GETTYSBURG,
  counts, total, icOf, icText, crossEnt, climbSubstitution, sciText, dur, AGE_UNIVERSE_S, groups5, rowsOf,
  pix, letterRow, tile, dashedBox,
} from './ch01.shared.js';

const PASSAGE = norm(GETTYSBURG);

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
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
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
      idea: String.raw`Correctness is just $(x+k)-k\equiv x$. The attack uses redundancy: of the 26 candidate decryptions only one is a sentence, because English letter frequencies are far from uniform — the true plaintext scores best against the English letter model (here: the lowest cross-entropy, measured with the letter counts of a 3.5-trillion-letter corpus). Very short ciphertexts can have two readable decryptions, which is the idea behind unicity distance (item 1.10).`,
      caption: String.raw`Type a message and turn the wheel (slider, or drag the inner ring). The table lists all 26 decryptions of the ciphertext with their English-likeness score; click a row to try that key. Tick *Paste a ciphertext* to attack a ciphertext whose key you do not know.`,
      deps: ['crypto-1.1'],
      tags: ['shift cipher', 'brute force'],
      refs: ['Katz–Lindell §1.3'],
      credit: 'Julius Caesar, 1st century BCE (as reported by Suetonius, Life of Julius Caesar §56)',
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
  ],
};
