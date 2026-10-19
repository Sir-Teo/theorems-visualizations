// Cryptography — Chapter 3 (part b): chosen-plaintext security, pseudorandom functions, the birthday bound, Goldwasser–Micali
import {
  clamp, pixc as pix, hex, ci95, coupledOracleAnswers, logNoColl, prf16, mix2, feistel8, ladder, paintBits, shuffled,
} from './ch03.shared.js';

const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const p2 = (e) => '2' + String(Math.round(e)).split('').map((c) => SUPD[c] ?? c).join('');
const parseHex = (s) => { const t = String(s).trim(); return /^[0-9a-fA-F]{1,4}$/.test(t) ? parseInt(t, 16) : NaN; };
const nfp = (x) => (x >= 1e6 ? x.toExponential(2).replace('e+', '·10^') : String(Math.round(x)));
const nf = (x) => (x >= 1e6 ? x.toExponential(2).replace(/e\+(\d+)/, (m, e) => `\\times10^{${e}}`) : String(Math.round(x)));

export default {
  collection: 'crypto',
  chapter: 3,
  items: [
    // ================================================================== 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Chosen-plaintext attacks and CPA-security',
      statement: String.raw`In the **CPA experiment** $\mathsf{PrivK}^{\mathsf{cpa}}_{\mathcal A,\Pi}(n)$ a key $k\leftarrow\mathsf{Gen}(1^n)$ and a bit $b$ are chosen; the adversary $\mathcal A$ gets oracle access to $\mathsf{Enc}_k(\cdot)$ (it may submit any plaintext and receives a fresh encryption), outputs two equal-length messages $m_0,m_1$, receives the challenge $c\leftarrow\mathsf{Enc}_k(m_b)$, may keep querying the oracle, and outputs $b'$; the experiment outputs $1$ iff $b'=b$. The scheme $\Pi$ is **CPA-secure** if for every PPT $\mathcal A$, $\Pr[\mathsf{PrivK}^{\mathsf{cpa}}_{\mathcal A,\Pi}(n)=1]\le\tfrac12+\mathsf{negl}(n)$. The oracle queries may include $m_0$ and $m_1$ themselves.`,
      idea: String.raw`The adversary is allowed to *choose* plaintexts because in practice it often can: it can make a server encrypt text it supplies, or know a message with high probability (a header, a fixed greeting). EAV-security (3.3) offers no protection here — the pad of 3.7 is secure against one eavesdropped message and broken as soon as it is used twice. CPA-security forces encryption to be **probabilistic** (or stateful): two encryptions of the same message must look unrelated, which is the content of 3.10. The multiple-message variant follows from the single-challenge one by a hybrid argument (3.8).`,
      caption: String.raw`Play the adversary. *Query the oracle* with any 16-bit message (four hex digits) before the challenge, then *send the challenge* $(m_0,m_1)$ and read off $c^*$. Finally *guess* $b$. The ladder logs everything you do; the readout tells you when $c^*$ equals an earlier oracle answer. Against the deterministic scheme a single oracle query on $m_0$ wins every time; against the randomized scheme no query helps unless the random $r$ happens to repeat.`,
      deps: ['crypto-3.3'],
      tags: ['cpa', 'security game'],
      refs: ['Katz–Lindell §3.4.2', 'Boneh–Shoup ch. 5'],
      credit: 'Formalised for symmetric encryption by Bellare, Desai, Jokipii & Rogaway, 1997',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chosen-plaintext_attack' },
      viz(v) {
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, full: true });
        const scheme = v.select('Scheme', [{ value: 'det', label: 'deterministic: $c=m\\oplus F_k(0)$' }, { value: 'rand', label: 'randomized: $(r,\\ F_k(r)\\oplus m)$' }], 'det', { onChange: () => newGame() });
        const qIn = v.input('Oracle query $m$ (hex)', '1234', { width: 80 });
        const m0In = v.input('$m_0$', '1234', { width: 80 }), m1In = v.input('$m_1$', '5678', { width: 80 });
        const bQ = v.button('Query the oracle', () => doQuery(parseHex(qIn.value)));
        const bC = v.button('Send challenge $(m_0,m_1)$', () => doChallenge(parseHex(m0In.value), parseHex(m1In.value)));
        const bG0 = v.button('Guess $b=0$', () => doGuess(0)), bG1 = v.button('Guess $b=1$', () => doGuess(1));
        const bN = v.button('New game', () => newGame());
        let G = null, seedN = 0, wins = 0, games = 0, msg = '';
        const enc = (m) => {
          if (scheme.value === 'det') { const c = m ^ prf16(G.k, 0); return { c: [c], txt: hex(c) }; }
          const r = Math.floor(G.rng() * 65536), c = prf16(G.k, r) ^ m; return { c: [r, c], txt: `(${hex(r)}, ${hex(c)})` };
        };
        const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
        function newGame() {
          seedN += 1; const rng = v.rng(seedN * 7919 + 17);
          G = { k: Math.floor(rng() * 4294967296), b: rng() < 0.5 ? 0 : 1, rng, log: [], phase: 0, qs: [], chal: null, done: null };
          msg = '';
          v.invalidate && v.invalidate();
        }
        function doQuery(m) {
          if (Number.isNaN(m)) { msg = 'Enter up to four hex digits.'; return; }
          if (G.done) return; const e = enc(m);
          G.qs.push({ m, c: e.c }); G.log.push({ dir: 1, text: `query  m = ${hex(m)}`, color: 'accent' }, { dir: -1, text: `Enc_k(m) = ${e.txt}`, color: 'orange', q: G.qs.length - 1 });
          msg = '';
        }
        function doChallenge(m0, m1) {
          if (G.phase !== 0 || G.done) return;
          if (Number.isNaN(m0) || Number.isNaN(m1)) { msg = 'Enter up to four hex digits for $m_0,m_1$.'; return; }
          if (m0 === m1) { msg = 'The two messages must differ for the game to mean anything.'; }
          const e = enc(G.b ? m1 : m0); G.phase = 1; G.chal = { m0, m1, c: e.c };
          G.log.push({ dir: 1, text: `challenge  m₀ = ${hex(m0)},  m₁ = ${hex(m1)}`, color: 'accent' }, { dir: -1, text: `c* = Enc_k(m_b) = ${e.txt}`, color: 'purple', chal: true });
        }
        function doGuess(g) {
          if (G.phase !== 1 || G.done) return;
          const ok = g === G.b; games += 1; if (ok) wins += 1; G.done = ok ? 'win' : 'lose';
          G.log.push({ dir: 1, text: `guess  b′ = ${g}`, color: 'accent' }, { dir: 0, text: ok ? `b = ${G.b}: you win` : `b = ${G.b}: you lose`, color: ok ? 'green' : 'red' });
        }
        newGame();
        doQuery(0x1234); doChallenge(0x1234, 0x5678);
        v.render(() => {
          bQ.hidden = G.done !== null; qIn.el.hidden = G.done !== null;
          bC.hidden = G.phase !== 0; m0In.el.hidden = G.phase !== 0; m1In.el.hidden = G.phase !== 0;
          bG0.hidden = G.phase !== 1 || !!G.done; bG1.hidden = bG0.hidden;
          const P = pix(sL), rows = G.log.slice(-13);
          ladder(P, ['Adversary A', 'Oracle / Challenger'], rows, { rh: 27, top: 44, x1: Math.max(70, P.W * 0.13), x2: P.W - Math.max(100, P.W * 0.15) });
        });
        v.readout(() => {
          let hint = '';
          if (G.chal) {
            const i = G.qs.findIndex((q) => same(q.c, G.chal.c));
            if (i >= 0) hint = `$c^*$ equals the oracle’s answer to query #${i + 1} ($m=${hex(G.qs[i].m)}$), so $b$ is the index of that message: ${G.qs[i].m === G.chal.m0 ? '**b = 0**' : G.qs[i].m === G.chal.m1 ? '**b = 1**' : 'but that query is neither $m_0$ nor $m_1$'}.`;
            else hint = G.phase === 1 ? '$c^*$ matches no oracle answer so far: try querying $m_0$ (or $m_1$) and compare.' : '';
          }
          return [msg, hint, `Score so far: ${wins} won of ${games} games (a fair coin would win half).`].filter(Boolean).join('\n');
        });
      },
    },

    // ================================================================== 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Deterministic encryption cannot be CPA-secure',
      statement: String.raw`If $\mathsf{Enc}_k(m)$ is a deterministic function of $k$ and $m$ (a stateless scheme with no randomness at encryption), then $\Pi$ is not CPA-secure: for any two distinct messages $m_0\ne m_1$ the following adversary wins with probability $1$. Query the oracle on $m_0$ to get $c_0$; output $(m_0,m_1)$ and receive $c^*$; output $b'=0$ if $c^*=c_0$ and $b'=1$ otherwise. For randomized encryption, let $\kappa_{k,m_0}=\Pr[\mathsf{Enc}_k(m_0;R)=\mathsf{Enc}_k(m_0;R') ]$ for independent fresh coins. Conditional on a fixed key, the same attack wins with probability $\tfrac12+\kappa_{k,m_0}/2$. With uniform $w$-bit coins, $\kappa_{k,m_0}\ge2^{-w}$; equality holds when distinct coins produce distinct ciphertexts of that message, as in the displayed construction that includes $r$ in the ciphertext.`,
      idea: String.raw`If $b=0$ the challenge is an encryption of $m_0$ under the same key; determinism forces it to equal the oracle’s answer $c_0$. If $b=1$ it encrypts a different message, and a correct scheme maps different messages to different ciphertexts under a fixed key (decryption is a function), so $c^*\neq c_0$. The attack needs one query and one comparison, hence efficiency cannot save it. For the displayed ciphertext $(r,F_k(r)\oplus m)$, the two encryptions of $m_0$ agree exactly when $r$ repeats, probability $2^{-w}$. A general encryption algorithm can map different random values to the same ciphertext, so its collision probability may be larger. The attack’s advantage is half the *ciphertext collision probability for the fixed message*, the quantity bounded in 3.12–3.13.`,
      caption: String.raw`The adversary plays 2000 games against $\mathsf{Enc}_k(m)=(r,\,F_k(r)\oplus m)$ with a $w$-bit random $r$ ($w=0$: no randomness, deterministic). Left: one game as a message diagram. Middle: the running win rate with the exact value $\tfrac12+2^{-(w+1)}$. Right: the advantage $2^{-(w+1)}$ against $w$ on a log scale — it is $\tfrac12$ at $w=0$ and negligible only when the randomness grows with the security parameter.`,
      deps: ["crypto-3.9","prob-2.1.11","prob-1.1.1"],
      tags: ['cpa', 'attacks'],
      refs: ['Katz–Lindell §3.4.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Deterministic_encryption' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 330, weight: 1.15 });
        const sR = v.stage({ x: [0, 2000], y: [0.3, 1.02], axes: 'box', gutter: true, height: 330, minWidth: 260, weight: 1, xlabel: 'games played', ylabel: 'fraction won' });
        const sA = v.stage({ x: [-0.5, 16.5], y: [-18, 0.5], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'random bits w', ylabel: 'advantage', title: 'Advantage $2^{-(w+1)}$' });
        sA.setTicks(null, [0, -4, -8, -12, -16].map((y) => [y, p2(y)]));
        const wS = v.slider('randomness $w$ (bits; 0 = deterministic)', 0, 16, 0, { step: 1, int: true });
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const NG = 2000;
        let info = null;
        v.render(() => {
          const w = wS.value, R = w === 0 ? 1 : 2 ** w, rng = v.rng(seed * 6007 + w);
          const enc = (k, m) => { const r = w === 0 ? 0 : Math.floor(rng() * R); return [r, prf16(k, r) ^ m]; };
          const m0 = 0x1234, m1 = 0x5678; let win = 0; const run = []; let demo = null;
          for (let t = 1; t <= NG; t++) {
            const k = Math.floor(rng() * 4294967296), b = rng() < 0.5 ? 0 : 1;
            const c0 = enc(k, m0), cs = enc(k, b ? m1 : m0), g = c0[0] === cs[0] && c0[1] === cs[1] ? 0 : 1;
            if (g === b) win++;
            if (t === 1) demo = { c0, cs, g, b };
            if (t % 10 === 0 || t < 10) run.push([t, win / t]);
          }
          const ex = 0.5 + 2 ** -(w + 1), P = pix(sD);
          const f = (c) => (w === 0 ? hex(c[1]) : `(${hex(c[0])}, ${hex(c[1])})`);
          ladder(P, ['Adversary A', 'Oracle / Challenger'], [
            { dir: 1, text: `query m₀ = ${hex(m0)}`, color: 'accent' },
            { dir: -1, text: `c₀ = ${f(demo.c0)}`, color: 'orange' },
            { dir: 1, text: `challenge (m₀, m₁) = (${hex(m0)}, ${hex(m1)})`, color: 'accent' },
            { dir: -1, text: `c* = ${f(demo.cs)}   [b = ${demo.b}]`, color: 'purple' },
            { dir: 0, text: demo.cs[0] === demo.c0[0] && demo.cs[1] === demo.c0[1] ? 'c* = c₀  ⇒  b′ = 0' : 'c* ≠ c₀  ⇒  b′ = 1', color: 'ink' },
            { dir: 0, text: demo.g === demo.b ? 'A wins this game' : 'A loses this game', color: demo.g === demo.b ? 'green' : 'red' },
          ], { rh: 32, top: 46, x1: Math.max(60, P.W * 0.12), x2: P.W - Math.max(100, P.W * 0.14) });
          sR.path(Array.from({ length: 100 }, (_, i) => { const n = 20 + i * 20; return [n, Math.min(1.02, 0.5 + 0.5 * 1.96 / Math.sqrt(n))]; }), { color: 'faint', width: 1.3, dash: true });
          sR.path(Array.from({ length: 100 }, (_, i) => { const n = 20 + i * 20; return [n, 0.5 - 0.5 * 1.96 / Math.sqrt(n)]; }), { color: 'faint', width: 1.3, dash: true });
          sR.hline(0.5, { color: 'muted', width: 1 }); sR.hline(ex, { color: 'green', width: 2, dash: true });
          sR.path(run, { color: 'accent', width: 2.2 });
          sA.path(Array.from({ length: 17 }, (_, i) => [i, -(i + 1)]), { color: 'accent', width: 2.2 });
          sA.dot(w, -(w + 1), { r: 7, color: 'gold' });
          info = { w, ex, win };
        });
        v.legend([['accent', 'running win rate'], ['green', 'exact $\\tfrac12+2^{-(w+1)}$', { dash: true }], ['faint', 'coin-flip band', { dash: true }]]);
        v.readout(() => `$w=${info.w}$: the attacker won ${info.win} of ${NG} games (${v.fix(info.win / NG, 3)} $\\pm$ ${v.fix(ci95(info.win / NG, NG), 3)}); exact success $\\tfrac12+2^{-${info.w + 1}}=${v.fix(info.ex, info.w > 8 ? 5 : 4)}$.` + (info.w === 0 ? '\n**Deterministic encryption: the adversary wins every game with one query.**' : info.w < 12 ? '\nThe randomness repeats often enough to leak: a non-negligible advantage.' : '\nWith this much randomness the attack’s advantage is already tiny; it is negligible exactly when $w$ grows with $n$.'));
      },
    },

    // ================================================================== 3.11
    {
      num: '3.11',
      kind: 'Definition',
      name: 'Pseudorandom functions and permutations',
      statement: String.raw`A **keyed function** $F:\{0,1\}^n\times\{0,1\}^{\ell_{\mathrm{in}}}\to\{0,1\}^{\ell_{\mathrm{out}}}$, efficiently computable, is a **pseudorandom function** (PRF) if for every PPT distinguisher $D$ with oracle access, $$\bigl|\Pr_{k}[D^{F_k(\cdot)}(1^n)=1]-\Pr_{f}[D^{f(\cdot)}(1^n)=1]\bigr|\le\mathsf{negl}(n),$$ where $k$ is uniform and $f$ is a uniformly random function from $\{0,1\}^{\ell_{\mathrm{in}}}$ to $\{0,1\}^{\ell_{\mathrm{out}}}$. A keyed **permutation** $F_k$ (with efficient inverse) is a **pseudorandom permutation** (PRP) if the same holds against a uniformly random *permutation* $\pi$, and a **strong** PRP if $D$ may also query $F_k^{-1}$. A random function has $2^{\ell_{\mathrm{out}}2^{\ell_{\mathrm{in}}}}$ possibilities, $F_k$ only $2^n$: the definition says no efficient test finds the difference.`,
      idea: String.raw`The random function is never written down: it can be sampled **lazily**. Keep a table; on a new input draw a fresh uniform output and store it, on a repeated input answer from the table (a random permutation draws among the unused outputs). A distinguisher sees only these answers, so every test is a question about the pattern of answers to $q$ queries: collisions, linear relations, repeated structure. A PRF is a PRG whose output can be accessed at random positions (3.5), and it is the primitive from which CPA-secure encryption (3.12) and message authentication are built.`,
      caption: String.raw`Left: a $16\times16$ table of all $256$ inputs of an 8-bit function. Click cells to query the box (*Real* = a keyed function, *Ideal* = a lazily filled random function or permutation): answers appear, entries that collide are ringed. Right: an automatic distinguisher (collision test, or a linearity test using $F(0)\oplus F(x)\oplus F(y)\oplus F(x\oplus y)$) is run 1500 times against each world, and $\Pr[D=1]$ is plotted for both. Pairs that the test cannot separate have advantage $\approx0$; the XOR cipher $F_k(x)=x\oplus k$ is wrecked by the linearity test.`,
      scope: String.raw`The keyed functions are toys on 8-bit inputs with a 32-bit key (a hash-based function, a 4-round Feistel permutation on nibbles, and the linear map $x\oplus k$); none is claimed to be a PRF or PRP, and with $2^{32}$ keys an unbounded distinguisher could always win.`,
      deps: ["crypto-3.5","alg-1.14a"],
      tags: ['prf', 'prp'],
      refs: ['Katz–Lindell §3.5.1', 'Boneh–Shoup ch. 4'],
      credit: 'Goldreich, Goldwasser & Micali, 1986 (PRFs; JACM 33(4):792–807)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pseudorandom_function_family' },
      viz(v) {
        const sG = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 330, weight: 1.15 });
        const sB = v.stage({ x: [0.4, 2.6], y: [0, 1.05], axes: 'box', gutter: true, height: 400, minWidth: 250, weight: 0.85, ylabel: 'Pr[D = 1]' });
        const fam = v.select('Keyed function $F_k$', [{ value: 'hash', label: 'hash, 8-bit output' }, { value: 'fei', label: 'Feistel permutation' }, { value: 'xor', label: '$x\\oplus k$' }], 'fei');
        const ideal = v.select('Ideal world', [{ value: 'func', label: 'random function' }, { value: 'perm', label: 'random permutation' }], 'func');
        const test = v.select('Distinguisher', [{ value: 'coll', label: 'no collision among $q$ queries' }, { value: 'lin', label: 'linearity test' }], 'coll');
        const qS = v.slider('queries $q$', 2, 60, 24, { step: 1, int: true });
        const world = v.select('Table shows', [{ value: 'real', label: 'Real $F_k$' }, { value: 'ideal', label: 'Ideal' }], 'real', { onChange: () => resetTable() });
        v.button('Reset table', () => resetTable());
        v.button('Query 8 random inputs', () => { for (let i = 0; i < 8; i++) query(Math.floor(tabRng() * 256)); });
        const F = (kind, k, x) => (kind === 'hash' ? mix2(k, x) & 255 : kind === 'fei' ? feistel8(k, x) : (x ^ k) & 255);
        let tab = null, tabRng = null, used = null, tkey = 0, seed0 = 1;
        function resetTable() { seed0 += 1; tabRng = v.rng(seed0 * 311 + 5); tkey = Math.floor(tabRng() * 4294967296); tab = new Map(); used = new Set(); v.invalidate && v.invalidate(); }
        function query(x) {
          if (tab.has(x)) return;
          let y;
          if (world.value === 'real') y = F(fam.value, tkey, x);
          else if (ideal.value === 'func') y = Math.floor(tabRng() * 256);
          else { do { y = Math.floor(tabRng() * 256); } while (used.has(y)); }
          used.add(y); tab.set(x, y);
        }
        resetTable(); for (let i = 0; i < 20; i++) query(Math.floor(tabRng() * 256));
        sG.onClick((x, y) => {
          const P = pix(sG), [px, py] = P.at(x, y), g = geom(P), i = Math.floor((px - g.x0) / g.cs), j = Math.floor((py - g.y0) / g.cs);
          if (i >= 0 && i < 16 && j >= 0 && j < 16) query(j * 16 + i);
        });
        const geom = (P) => { const cs = Math.max(14, Math.min((P.W - 50) / 16, (P.H - 60) / 16)); return { cs, x0: (P.W - 16 * cs) / 2 + 8, y0: 36 }; };
        const NR = 1500;
        let key = '', res = null;
        v.render(() => {
          qS.el.hidden = test.value !== 'coll';
          const P = pix(sG), g = geom(P), { cs, x0, y0 } = g;
          P.text(world.value === 'real' ? 'F_k  (key hidden)' : 'ideal ' + (ideal.value === 'func' ? 'random function' : 'random permutation') + ', filled lazily', P.W / 2, 14, { size: 12.5, weight: 700, color: world.value === 'real' ? 'accent' : 'orange', halo: false });
          const cnt = new Map(); tab.forEach((y) => cnt.set(y, (cnt.get(y) || 0) + 1));
          for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
            const x = j * 16 + i, has = tab.has(x), y = tab.get(x), dup = has && cnt.get(y) > 1;
            P.rect(x0 + i * cs + 1, y0 + j * cs + 1, cs - 2, cs - 2, { fill: has ? (world.value === 'real' ? 'accent' : 'orange') : 'faint', fillAlpha: has ? 0.3 : 0.1, color: dup ? 'red' : 'faint', width: dup ? 2.4 : 0.6, radius: 3 });
            if (has) P.text(hex(y, 2), x0 + (i + 0.5) * cs, y0 + (j + 0.5) * cs, { size: Math.min(11, cs * 0.45), weight: 600, color: 'ink', halo: false });
          }
          P.text(`${tab.size} of 256 entries determined`, P.W / 2, y0 + 16 * cs + 16, { size: 11.5, color: 'muted', halo: false });
          const k2 = [fam.value, ideal.value, test.value, qS.value].join();
          if (k2 !== key) {
            key = k2; const r = v.rng(99991 + fam.value.length * 13 + qS.value);
            const oracle = (real) => {
              const k = Math.floor(r() * 4294967296), t = new Map(), usedO = new Set();
              return (x) => {
                if (t.has(x)) return t.get(x); let y;
                if (real) y = F(fam.value, k, x); else if (ideal.value === 'func') y = Math.floor(r() * 256); else { do { y = Math.floor(r() * 256); } while (usedO.has(y)); }
                usedO.add(y); t.set(x, y); return y;
              };
            };
            const D = (O) => {
              if (test.value === 'coll') { const seen = new Set(); const xs = shuffled([...Array(256).keys()], r).slice(0, qS.value); for (const x of xs) { const y = O(x); if (seen.has(y)) return 0; seen.add(y); } return 1; }
              const x = 1 + Math.floor(r() * 255); let y2 = 1 + Math.floor(r() * 255); while (y2 === x) y2 = 1 + Math.floor(r() * 255);
              return (O(0) ^ O(x) ^ O(y2) ^ O(x ^ y2)) === 0 ? 1 : 0;
            };
            let a = 0, b = 0; for (let i = 0; i < NR; i++) { a += D(oracle(true)); b += D(oracle(false)); }
            res = { pr: a / NR, pi: b / NR };
          }
          sB.rect(0.7, 0, 1.3, res.pr, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.2 }); sB.line(1, res.pr - ci95(res.pr, NR), 1, res.pr + ci95(res.pr, NR), { color: 'ink', width: 2 });
          sB.rect(1.7, 0, 2.3, res.pi, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1.2 }); sB.line(2, res.pi - ci95(res.pi, NR), 2, res.pi + ci95(res.pi, NR), { color: 'ink', width: 2 });
          sB.text(v.fix(res.pr, 3), 1, res.pr + 0.07, { size: 12, weight: 700, color: 'accent' }); sB.text(v.fix(res.pi, 3), 2, res.pi + 0.07, { size: 12, weight: 700, color: 'orange' });
          sB.setTicks([[1, 'real F_k'], [2, 'ideal']], null);
        });
        v.legend([['accent', 'real world'], ['orange', 'ideal world'], ['red', 'colliding answers (ring)', { dot: true }]]);
        v.readout(() => `Test “${test.value === 'coll' ? 'accept if the $' + qS.value + '$ answers are all distinct' : 'accept if $F(0)\\oplus F(x)\\oplus F(y)\\oplus F(x\\oplus y)=0$'}”: $\\Pr[D=1]$ is $${v.fix(res.pr, 3)}$ for $F_k$ and $${v.fix(res.pi, 3)}$ in the ideal world (1500 runs each), so the advantage is $${v.fix(Math.abs(res.pr - res.pi), 3)}\\ (\\pm${v.fix(ci95(0.5, NR) * 1.4, 2)}$ at worst).` + (Math.abs(res.pr - res.pi) > 0.25 ? '\n**This test distinguishes them: $F_k$ is not pseudorandom against it.**' : '\nThis test cannot separate the two; a different test might.'));
      },
    },

    // ================================================================== 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'CPA-secure encryption from a pseudorandom function',
      statement: String.raw`Let $F$ be a pseudorandom function with $n$-bit keys, inputs and outputs. The scheme $\mathsf{Gen}$: $k\leftarrow\{0,1\}^n$; $\mathsf{Enc}_k(m)$: choose a fresh uniform $r\leftarrow\{0,1\}^n$ and output $(r,\;F_k(r)\oplus m)$ for $m\in\{0,1\}^n$; $\mathsf{Dec}_k(r,s)=F_k(r)\oplus s$, is CPA-secure (3.9). Quantitatively, for every PPT adversary making $q(n)$ oracle queries, $$\Pr[\mathsf{PrivK}^{\mathsf{cpa}}_{\mathcal A,\Pi}(n)=1]\le\tfrac12+\frac{q(n)}{2^n}+\mathsf{negl}(n).$$ If $F$ were replaced by a truly random function, the first two terms alone would be the exact bound.`,
      idea: String.raw`First replace $F_k$ by a random function $f$; any efficient adversary that notices the swap is a PRF distinguisher (3.11), which costs the $\mathsf{negl}(n)$ term. With $f$ random, the pad $f(r^*)$ for the challenge nonce $r^*$ is uniform, and encryption is a one-time pad *unless* $r^*$ equals one of the $q$ nonces $r_i$ used to answer oracle queries — then $f(r^*)$ is already known to $\mathcal A$. A union bound over the $q$ queries gives $\Pr[r^*\in\{r_i\}]\le q/2^n$. Randomized encryption is exactly what defeats the attack of 3.10.`,
      caption: String.raw`The adversary queries $m_0$ $q$ times, then asks for the challenge; if the challenge nonce $r^*$ equals one of the returned nonces it reads off $F(r^*)$ and always wins, otherwise it guesses. The plot shows its advantage $\Pr[\mathsf{win}]-\tfrac12=\tfrac12\Pr[\mathrm{hit}]$ against the number of queries $q$ for $n$-bit nonces: simulated games (dots, 300 each), the exact value $\tfrac12\bigl(1-(1-2^{-n})^q\bigr)$ and the theorem’s union bound $q/2^n$. Switch the nonce to *constant* (a broken implementation) and the advantage jumps to $\tfrac12$ after a single query.`,
      scope: String.raw`The simulation uses a truly random function (the first step of the proof); the nonce length $n$ is kept small (up to 12 bits) so that repeats can be seen. The loss from replacing $F_k$ by a random function is the PRF distinguishing advantage, which is not simulated.`,
      deps: ["crypto-3.11","crypto-3.9","prob-1.1.1"],
      tags: ['cpa', 'prf', 'randomized encryption'],
      refs: ['Katz–Lindell §3.5.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation' },
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 0.6], axes: 'box', gutter: true, height: 400, full: true, xlabel: 'oracle queries q', ylabel: 'advantage over ½' });
        const nS = v.slider('nonce length $n$ (bits)', 4, 12, 8, { step: 1, int: true });
        const mode = v.select('Nonce $r$', [{ value: 'rand', label: 'fresh uniform' }, { value: 'const', label: 'constant (broken)' }], 'rand');
        let seed = 1; v.button('Resample', () => { seed += 1; });
        let info = null;
        v.render(() => {
          const n = nS.value, N = 2 ** n, qmax = Math.ceil(3 * N), rng = v.rng(seed * 8191 + n + (mode.value === 'const' ? 77 : 0));
          s.setView([0, qmax], [0, 0.6]);
          const pts = [];
          for (let i = 1; i <= 14; i++) {
            const q = Math.round(qmax * i / 14); let win = 0; const T = 300;
            for (let t = 0; t < T; t++) {
              const b = rng() < 0.5 ? 0 : 1; let hit = false;
              if (mode.value === 'const') hit = true;
              else { const seen = new Set(); for (let j = 0; j < q; j++) seen.add(Math.floor(rng() * N)); hit = seen.has(Math.floor(rng() * N)); }
              const g = hit ? b : (rng() < 0.5 ? 0 : 1); if (g === b) win++;
            }
            pts.push([q, win / T - 0.5]);
          }
          const exact = (q) => (mode.value === 'const' ? 0.5 : 0.5 * (1 - (1 - 1 / N) ** q));
          s.fn(exact, { color: 'green', width: 2.4, domain: [0, qmax] });
          s.fn((q) => q / N, { color: 'red', width: 2, domain: [0, Math.min(qmax, 0.6 * N)], dash: true });
          s.dots(pts, { r: 5, color: 'accent' });
          s.text(`n = ${n}: ${N} possible nonces`, qmax * 0.98, 0.04, { size: 11.5, color: 'muted', align: 'right' });
          info = { n, N, pts, qmax, exact };
        });
        v.legend([['accent', 'simulated advantage', { dot: true }], ['green', 'exact $\\tfrac12\\Pr[\\mathrm{hit}]$'], ['red', 'union bound $q/2^n$', { dash: true }]]);
        v.readout(() => {
          const i = info, q1 = Math.round(i.N / 2), q2 = i.qmax;
          return mode.value === 'const' ? String.raw`A constant nonce makes the scheme deterministic: after one query the adversary’s advantage is $\tfrac12$, the attack of 3.10.`
            : String.raw`With $n=${i.n}$ the advantage is $\tfrac12\Pr[\mathrm{hit}]=${v.fix(i.exact(q1), 3)}$ at $q=${q1}$ queries (bound $q/2^n=${v.fix(q1 / i.N, 3)}$) and $${v.fix(i.exact(q2), 3)}$ at $q=${q2}$. The scheme stays secure while $q\ll2^n$: for $n=128$ and $q=2^{40}$ queries the bound is $2^{-88}$.`;
        });
      },
    },

    // ================================================================== 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'The birthday bound',
      statement: String.raw`Throw $q$ balls independently and uniformly into $N$ bins. The probability that some bin receives two balls is $$\mathrm{coll}(N,q)=1-\prod_{i=1}^{q-1}\Bigl(1-\frac iN\Bigr),$$ and for $q\le\sqrt{2N}$ it satisfies $$\Bigl(1-e^{-1/2}\Bigr)\frac{q(q-1)}{2N}\le\mathrm{coll}(N,q)\le\frac{q(q-1)}{2N}.$$ Consequently $\mathrm{coll}$ reaches $\tfrac12$ at $q\approx\sqrt{2\ln2}\,\sqrt N\approx1.18\sqrt N$, and $q=\Theta(\sqrt N)$ throws are necessary and sufficient to see a collision with constant probability.`,
      idea: String.raw`The $q$ balls form $\binom q2$ pairs, each colliding with probability $1/N$; the union bound over pairs gives the upper bound. For the lower bound, the factor $1-i/N\le e^{-i/N}$ gives $\Pr[\text{no collision}]\le e^{-q(q-1)/2N}$ — and $1-e^{-x}\ge(1-e^{-1/2})\,x$ for $x\le\tfrac12$. The surprise is the scale $\sqrt N$ instead of $N$: collisions among $q$ items appear when the number of *pairs* reaches $N$. In cryptography this is why an $n$-bit hash or random nonce offers only $n/2$ bits of collision resistance, and why the term $q^2/2^n$ appears in so many proofs (3.12, 3.14).`,
      caption: String.raw`Drag the gold handle along the exact collision-probability curve to choose the number of throws $q$, and change the number of bins $N$ (slider, up to $2^{36}$). Dots: first-collision times of 400 simulated experiments (for $N\le2\cdot10^7$). Dashed: $1-e^{-q^2/2N}$ and the union bound $q(q-1)/2N$. For $N\le4096$ the left panel throws the $q$ balls into the bins one by one: single-ball bins blue, collisions red. For $N=365$ the curve crosses $\tfrac12$ at $q=23$.`,
      deps: ["comb-1.6","prob-1.1.1"],
      tags: ['birthday paradox', 'collisions'],
      refs: ['Katz–Lindell §6.4.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Birthday_problem' },
      viz(v) {
        const sG = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 290, weight: 0.9 });
        const sC = v.stage({ x: [0, 1], y: [0, 1.04], axes: 'box', gutter: true, height: 380, minWidth: 330, weight: 1.25, xlabel: 'throws q', ylabel: 'Pr[some bin has two balls]' });
        const NS = v.slider('bins $N$', 16, 2 ** 36, 365, { log: true, int: true, sig: 3 });
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const H = sC.handle(23, 0.5, { color: 'gold', r: 8, constrain: (x) => { const N = NS.value, xx = clamp(Math.round(x), 2, Math.ceil(3.3 * Math.sqrt(N))); return [xx, 1 - Math.exp(logNoColl(N, xx))]; } });
        let lastN = 0, info = null, cache = null, ck = '';
        v.render(() => {
          const N = NS.value, qmax = Math.ceil(3.3 * Math.sqrt(N));
          if (N !== lastN) { lastN = N; H.set(clamp(Math.ceil(1.1774 * Math.sqrt(N)), 2, qmax), 0.5); }
          sC.setView([0, qmax], [0, 1.04]);
          // exact curve by one pass
          const K = 160, qs = Array.from({ length: K + 1 }, (_, i) => Math.max(1, Math.round(qmax * i / K))), ex = []; let s = 0, cur = 1;
          for (const q of qs) { while (cur < q) { s += Math.log1p(-cur / N); cur++; } ex.push([q, 1 - Math.exp(s)]); }
          sC.hline(0.5, { color: 'muted', width: 1, dash: true });
          sC.fn((q) => 1 - Math.exp(-q * q / (2 * N)), { color: 'purple', width: 1.8, dash: true, domain: [0, qmax] });
          sC.fn((q) => Math.min(1, q * (q - 1) / (2 * N)), { color: 'red', width: 1.8, dash: true, domain: [0, qmax] });
          sC.path(ex, { color: 'accent', width: 2.6 });
          const kk = `${N},${seed}`;
          if (kk !== ck) {
            ck = kk; cache = null;
            if (N <= 2e7) {
              const r = v.rng(seed * 1237 + 1), T = 400, times = [];
              for (let t = 0; t < T; t++) { const seen = new Set(); let q = 0; for (;;) { q++; const b = Math.floor(r() * N); if (seen.has(b)) break; seen.add(b); } times.push(q); }
              times.sort((a, b) => a - b); cache = times;
            }
          }
          if (cache) { const T = cache.length, pts = []; for (let i = 0; i <= 40; i++) { const q = Math.round(qmax * i / 40); let lo = 0, hi = T; while (lo < hi) { const m = (lo + hi) >> 1; if (cache[m] <= q) lo = m + 1; else hi = m; } pts.push([q, lo / T]); } sC.dots(pts, { r: 3.5, color: 'green' }); }
          sC.vline(1.1774 * Math.sqrt(N), { color: 'orange', width: 1.4, dash: true });
          sC.text('1.18√N', Math.min(qmax * 0.99, 1.1774 * Math.sqrt(N) + qmax * 0.01), 0.06, { size: 11, color: 'orange', weight: 700, align: 'left' });
          const q = Math.round(H.x), pq = 1 - Math.exp(logNoColl(N, q));
          H.set(q, pq);
          // grid
          const P = pix(sG);
          if (N <= 4096) {
            const cols = Math.ceil(Math.sqrt(N * P.W / Math.max(P.H - 60, 100))), rows = Math.ceil(N / cols), cs = Math.max(2, Math.min((P.W - 24) / cols, (P.H - 60) / rows)), x0 = (P.W - cols * cs) / 2, y0 = 30;
            const r = v.rng(seed * 55 + N), cnt = new Uint16Array(N); let first = -1;
            for (let i = 0; i < q; i++) { const b = Math.floor(r() * N); cnt[b]++; if (cnt[b] === 2 && first < 0) first = i + 1; }
            const ctx = sG.ctx, col = [v.color('faint', 0.5), v.color('accent', 0.85), v.color('red', 0.95)];
            for (let c = 0; c < 3; c++) { ctx.save(); ctx.fillStyle = col[c]; ctx.beginPath(); for (let b = 0; b < N; b++) if (Math.min(cnt[b], 2) === c) ctx.rect(x0 + (b % cols) * cs, y0 + Math.floor(b / cols) * cs, cs - (cs > 4 ? 1 : 0.2), cs - (cs > 4 ? 1 : 0.2)); ctx.fill(); ctx.restore(); }
            P.text(`${q} balls in ${N} bins`, P.W / 2, 12, { size: 12, weight: 700, color: 'ink', halo: false });
            const multi = cnt.reduce((a, c) => a + (c >= 2 ? 1 : 0), 0);
            P.text(multi ? `${multi} bin${multi > 1 ? 's' : ''} with ≥ 2 balls; first collision at ball ${first}` : 'no collision yet', P.W / 2, y0 + rows * cs + 16, { size: 11.5, color: multi ? 'red' : 'muted', weight: 600, halo: false });
          } else {
            P.text('Too many bins to draw one by one.', P.W / 2, P.H / 2 - 22, { size: 13, color: 'muted', halo: false });
            P.text(`√N = ${nfp(Math.sqrt(N))},  1.1774·√N = ${nfp(1.1774 * Math.sqrt(N))}`, P.W / 2, P.H / 2 + 4, { size: 13, weight: 700, color: 'orange', halo: false });
            P.text('(N ≤ 4096 shows the bins)', P.W / 2, P.H / 2 + 30, { size: 11.5, color: 'muted', halo: false });
          }
          info = { N, q, pq, half: ex.find((e) => e[1] >= 0.5) };
        });
        v.legend([['accent', 'exact'], ['purple', '$1-e^{-q^2/2N}$', { dash: true }], ['red', '$q(q-1)/2N$', { dash: true }], ['green', 'simulated', { dot: true }], ['orange', '$1.18\\sqrt N$', { dash: true }]]);
        v.readout(() => {
          const i = info, tq = Math.sqrt(2 * Math.log(2) * i.N);
          return `$N=${nf(i.N)}$ bins: with $q=${nf(i.q)}$ throws the collision probability is $${v.fix(i.pq, 4)}$ (union bound $${v.fix(Math.min(1, i.q * (i.q - 1) / (2 * i.N)), 4)}$). The half-way point is $\\sqrt{2\\ln 2\\,N}=${v.fix(tq, tq < 100 ? 1 : 0)}$ throws — that is $${v.fix(100 * tq / i.N, 4)}\\%$ of $N$.`;
        });
      },
    },

    // ================================================================== 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'PRP/PRF switching lemma',
      statement: String.raw`Let $\pi$ be a uniformly random permutation of $\{0,1\}^n$ and $f$ a uniformly random function $\{0,1\}^n\to\{0,1\}^n$. For every distinguisher $D$ (computationally unbounded) that makes at most $q$ oracle queries, $$\bigl|\Pr[D^{\pi}=1]-\Pr[D^{f}=1]\bigr|\le\frac{q(q-1)}{2^{n+1}}\le\frac{q^2}{2^{n+1}}.$$ Hence a PRP on $n$-bit blocks is also a PRF against distinguishers making $q\ll2^{n/2}$ queries, with loss $q^2/2^{n+1}$.`,
      idea: String.raw`Assume without loss of generality that $D$ never repeats a query (a repeated query gets the same answer in both worlds). Then a lazily sampled random function answers each new query with a fresh uniform value, and a random permutation answers with a fresh uniform value *among the unused ones*. The two behave identically until the function produces a **collision** — an output equal to an earlier one — which a permutation never does. So the gap is at most the probability that $q$ uniform values collide, which is the birthday bound of 3.13. It is also what limits block ciphers: with $n=64$ the lemma is vacuous after about $2^{32}$ queries.`,
      caption: String.raw`Both oracles are queried at distinct points $x_1,x_2,\dots$ with the same random coins. The demonstration caps the number of distinct inputs at $N=2^n$; repeating inputs adds no information. The left table shows the first answers in each world; the function’s answers are ringed in red at the first repeat, which the permutation can never show. The plot gives the probability that a random function collides within $q$ queries (dots: simulated, $1200$ runs per point; the permutation’s collision rate is $0$) with the exact value $1-\prod(1-i/N)$ and the lemma’s bound $q(q-1)/2N$. Move $n$ and $q$ and watch the advantage track the bound.`,
      credit: 'Folklore lemma; explicit game-based proof in Bellare & Rogaway, The Game-Playing Technique, 2004 draft, §2',
      deps: ['crypto-3.11', 'crypto-3.13'],
      tags: ['prp', 'prf', 'birthday'],
      refs: ['Bellare–Rogaway, The Game-Playing Technique, draft 0.4 (11 December 2004), §2 pp. 6–7, Lemma 1; Boneh–Shoup §4.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pseudorandom_permutation' },
      viz(v) {
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 300, weight: 1 });
        const sC = v.stage({ x: [0, 1], y: [0, 1.04], axes: 'box', gutter: true, height: 400, minWidth: 330, weight: 1.2, xlabel: 'queries q', ylabel: 'distinguishing advantage' });
        const nS = v.slider('block length $n$', 4, 14, 8, { step: 1, int: true });
        const qS = v.slider('queries $q$', 2, 400, 24, { step: 1, int: true });
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const T = 1200;
        let info = null;
        v.render(() => {
          const n = nS.value, N = 2 ** n, q = Math.min(qS.value, N), qmax = Math.min(N, Math.max(q, Math.ceil(3 * Math.sqrt(N)))), r = v.rng(seed * 4219 + n);
          // table: one run
          const rr = v.rng(seed * 733 + n * 5 + 1), show = Math.min(q, 14);
          const { f: fOut, p: pOut } = coupledOracleAnswers(rr, N, show);
          let firstColl = -1; const seenF = new Set();
          for (let i = 0; i < show; i++) { if (seenF.has(fOut[i]) && firstColl < 0) firstColl = i; seenF.add(fOut[i]); }
          const P = pix(sT), rh = Math.min(22, (P.H - 70) / (show + 1)), x1 = P.W * 0.2, x2 = P.W * 0.55, x3 = P.W * 0.86;
          P.text('x', x1 - 40, 18, { size: 12, weight: 700, color: 'muted', halo: false }); P.text('random function f(x)', x2 - 30, 18, { size: 12, weight: 700, color: 'orange', halo: false }); P.text('permutation π(x)', x3 - 8, 18, { size: 12, weight: 700, color: 'green', halo: false });
          for (let i = 0; i < show; i++) {
            const y = 38 + i * rh, coll = fOut.filter((o) => o === fOut[i]).length > 1;
            if (coll) P.rect(x2 - 62, y - rh / 2 + 1, 94, rh - 2, { fill: 'red', fillAlpha: 0.18, color: 'red', width: 1.6, radius: 5 });
            P.text(String(i + 1), x1 - 40, y, { size: 12, color: 'muted', halo: false });
            P.text(hex(fOut[i], Math.ceil(n / 4)), x2 - 15, y, { size: 12.5, weight: 700, color: coll ? 'red' : 'ink', halo: false });
            P.text(hex(pOut[i], Math.ceil(n / 4)), x3 - 8, y, { size: 12.5, weight: 700, color: 'ink', halo: false });
          }
          if (q > show) P.text(`… ${q - show} more queries`, P.W / 2, 38 + show * rh + 6, { size: 11.5, color: 'muted', halo: false });
          // plot
          sC.setView([0, qmax], [0, 1.04]);
          const exact = (x) => 1 - Math.exp(logNoColl(N, x));
          sC.fn((x) => Math.min(1, x * (x - 1) / (2 * N)), { color: 'red', width: 2, dash: true, domain: [0, qmax] });
          sC.path(Array.from({ length: 121 }, (_, i) => { const x = Math.max(1, Math.round(qmax * i / 120)); return [x, exact(x)]; }), { color: 'accent', width: 2.6 });
          const pts = [];
          for (let i = 1; i <= 14; i++) {
            const x = Math.round(qmax * i / 14); let c = 0;
            for (let t = 0; t < T; t++) { const seen = new Set(); let hit = false; for (let j = 0; j < x; j++) { const y = Math.floor(r() * N); if (seen.has(y)) { hit = true; break; } seen.add(y); } if (hit) c++; }
            pts.push([x, c / T]);
          }
          sC.dots(pts, { r: 4, color: 'orange' }); sC.dots(pts.map(([x]) => [x, 0]), { r: 3.5, color: 'green' });
          sC.vline(q, { color: 'gold', width: 1.6, dash: true });
          info = { n, N, q, adv: exact(q), bound: Math.min(1, q * (q - 1) / (2 * N)), fc: firstColl };
        });
        v.legend([['accent', 'exact $\\Pr[f$ collides$]$'], ['red', 'lemma bound $q(q-1)/2N$', { dash: true }], ['orange', 'function: collision seen', { dot: true }], ['green', 'permutation: collision seen', { dot: true }]]);
        v.readout(() => `$N=2^{${info.n}}$, $q=${info.q}$: the distinguisher “output 1 iff two answers coincide” says 1 with probability $${v.fix(info.adv, 4)}$ for a random function and $0$ for a permutation, so its advantage is $${v.fix(info.adv, 4)}\\le\\min\\{1,q(q-1)/2N\\}=${v.fix(info.bound, 4)}$. ` + (info.fc >= 0 ? `In the table the function repeats an answer at query ${info.fc + 1}.` : 'In the table shown the function happens not to repeat yet.'));
      },
    },

    // ================================================================== 3.15
    {
      num: '3.15',
      kind: 'Paper',
      name: 'Probabilistic Encryption',
      paper: { authors: 'Shafi Goldwasser and Silvio Micali', year: 1984, title: 'Probabilistic Encryption', venue: 'Journal of Computer and System Sciences 28 (2): 270–299', doi: '10.1016/0022-0000(84)90070-9' },
      introduces: ['crypto-3.3', 'crypto-3.4', 'crypto-3.8', 'crypto-9.13'],
      credit: 'Shafi Goldwasser & Silvio Micali, 1984 (conference version: STOC 1982)',
      statement: String.raw`Goldwasser and Micali argued that deterministic public-key encryption leaks partial information about the plaintext and replaced it by **probabilistic encryption**, defined with a security notion — *semantic security*, which they showed equivalent to *polynomial security* (what is now called indistinguishability of encryptions), a computational counterpart of Shannon’s perfect secrecy. Their construction encrypts one bit at a time with a trapdoor predicate: with public key $(N,y)$, $N=pq$ for primes $p,q\equiv3\pmod 4$ and $y$ a *pseudosquare* (a non-square modulo $N$ with Jacobi symbol $+1$), a bit $b$ is encrypted as $c=y^{b}r^{2}\bmod N$ for a fresh random $r\in\mathbb Z_N^*$; the holder of $p,q$ decrypts by testing whether $c$ is a square modulo $p$. Key generation samples $y$ uniformly from those pseudosquares, rather than choosing an arbitrary factor-dependent value. Under the **quadratic residuosity assumption** — that no efficient algorithm distinguishes squares from pseudosquares modulo $N$ without the factors — the scheme is secure, and longer messages are handled bit by bit by a hybrid argument.`,
      idea: String.raw`The paper made two moves: it *defined* what the adversary must not learn (any function of the plaintext; indistinguishability of two chosen plaintexts) with efficient adversaries and negligible advantage (3.2–3.4), and it gave a scheme whose security *reduces* to a number-theoretic assumption about quadratic residues (nt-4.1), proved by reduction (3.6) and a hybrid argument over the bits of the message (3.8). The ciphertext of a bit is randomised so that the same bit encrypts differently each time, the fix for the weakness of deterministic encryption (3.10). The scheme itself is inefficient (a full modulus-sized ciphertext per bit) and became the prototype for later probabilistic systems (9.13).`,
      caption: String.raw`A reconstruction on small moduli — the paper has no data or figures to reproduce, so this is a model of its construction with toy primes. Left: the residues modulo $N$ as a grid; blue = squares, orange = pseudosquares (Jacobi symbol $+1$ but not squares), light grey = Jacobi symbol $-1$, dark = not coprime to $N$. Click a cell for its square/Jacobi status. Encrypt the same bit repeatedly: randomization changes the ciphertext distribution, although samples may repeat. Right: the indistinguishability game against several adversaries, 4000 games each; among the displayed strategies, factoring-aware and exhaustive square-membership tests distinguish perfectly, while the elementary tests can have small biases at these finite toy moduli (error bars: $\pm1.96\sigma$).`,
      scope: String.raw`Toy moduli of up to 7 digits: with such $N$ an exhaustive search factors $N$ at once, so the security statement is only meaningful as $N$ grows; the scheme is the one of the paper as presented in textbooks (bit encryption $y^br^2$), not the paper’s exact notation.`,
      deps: ["crypto-3.2","nt-4.1","nt-4.8"],
      tags: ['probabilistic encryption', 'quadratic residuosity'],
      refs: ['Goldwasser–Micali (1984), §4.4 pp. 281–282 (construction); §5 pp. 282–290 (security notions and hybrid proof); §7 pp. 292–297, especially Theorem 2 (random pseudosquare auxiliary key)'],
      links: { doi: 'https://doi.org/10.1016/0022-0000(84)90070-9' },
      viz(v) {
        const sG = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 330, weight: 1.15 });
        const sB = v.stage({ x: [0.4, 6.6], y: [0, 1.05], axes: 'box', gutter: true, height: 400, minWidth: 330, weight: 1.1, ylabel: 'advantage' });
        const MODS = [[7, 11], [19, 23], [43, 47], [103, 107], [1019, 1031]];
        const nSel = v.select('Modulus $N=pq$', MODS.map(([p, q], i) => ({ value: i, label: String(p * q) })), 2);
        let seed = 1; v.button('New key $y$', () => { seed += 1; });
        let enc = { 0: [], 1: [] }, sel = -1;
        v.button('Encrypt 0 and 1 again', () => { encAgain = true; });
        let encAgain = true;
        const mulm = (a, b, m) => (a * b) % m;
        const powm = (b, e, m) => { let r = 1; b %= m; while (e > 0) { if (e & 1) r = mulm(r, b, m); b = mulm(b, b, m); e = Math.floor(e / 2); } return r; };
        const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
        let K = null, kk = '';
        function setup() {
          const [p, q] = MODS[nSel.value], N = p * q, key = `${nSel.value},${seed}`;
          if (key === kk) return; kk = key;
          const qrP = (x) => powm(x % p, (p - 1) / 2, p) === 1, qrQ = (x) => powm(x % q, (q - 1) / 2, q) === 1;
          const cls = new Uint8Array(N); // 0 not coprime, 1 square, 2 pseudosquare, 3 jacobi -1
          const sq = new Uint8Array(N); for (let x = 1; x < N; x++) if (gcd(x, N) === 1) sq[(x * x) % N] = 1;
          for (let x = 1; x < N; x++) { if (gcd(x, N) !== 1) continue; const a = qrP(x), b = qrQ(x); cls[x] = a && b ? 1 : (!a && !b ? 2 : 3); }
          const r = v.rng(seed * 9973 + nSel.value), pseudo = []; for (let x = 1; x < N; x++) if (cls[x] === 2) pseudo.push(x);
          const y = pseudo[Math.floor(r() * pseudo.length)];
          K = { p, q, N, cls, sq, y, qrP }; encAgain = true; sel = -1;
        }
        const NG = 4000;
        let res = null, rk = '';
        v.render(() => {
          setup();
          const { p, q, N, cls, sq, y } = K, r = v.rng(seed * 31 + N);
          if (encAgain) {
            const E = (b) => { let c; do { c = Math.floor(r() * N); } while (gcd(c, N) !== 1 || c === 0); const rr = c; return mulm(mulm(rr, rr, N), b ? y : 1, N); };
            enc = { 0: [E(0), E(0), E(0), E(0)], 1: [E(1), E(1), E(1), E(1)] }; encAgain = false;
          }
          if (rk !== kk) {
            rk = kk;
            const advs = [['$N/2$', (c) => (c < N / 2 ? 0 : 1)], ['even', (c) => (c % 2 === 0 ? 0 : 1)], ['$c \\bmod 3$', (c) => (c % 3 === 0 ? 0 : 1)], ['Jacobi', () => 0], ['search', (c) => (sq[c] ? 0 : 1)], ['factors', (c) => (K.qrP(c) ? 0 : 1)]];
            const wins = advs.map(() => 0), rg = v.rng(seed * 77 + N);
            for (let t = 0; t < NG; t++) {
              const b = rg() < 0.5 ? 0 : 1; let c; do { c = Math.floor(rg() * N); } while (gcd(c, N) !== 1 || c === 0);
              const ct = mulm(mulm(c, c, N), b ? y : 1, N);
              advs.forEach(([, f], i) => { if (f(ct) === b) wins[i]++; });
            }
            res = advs.map(([name], i) => ({ name, adv: Math.abs(wins[i] / NG - 0.5) }));
          }
          // grid
          const P = pix(sG), cols = Math.ceil(Math.sqrt(N)), rows = Math.ceil(N / cols);
          const cs = Math.max(0.6, Math.min((P.W - 24) / cols, (P.H - 70) / rows)), x0 = (P.W - cols * cs) / 2, y0 = 26;
          const ctx = sG.ctx, colr = [v.color('ink', 0.5), v.color('accent', 0.9), v.color('orange', 0.95), v.color('faint', 0.4)];
          for (let c = 0; c < 4; c++) { ctx.save(); ctx.fillStyle = colr[c]; ctx.beginPath(); for (let x = 0; x < N; x++) if (cls[x] === c && x > 0) ctx.rect(x0 + (x % cols) * cs, y0 + Math.floor(x / cols) * cs, cs + (cs < 1.5 ? 0.3 : -0.5), cs + (cs < 1.5 ? 0.3 : -0.5)); ctx.fill(); ctx.restore(); }
          if (sel > 0) P.rect(x0 + (sel % cols) * cs - 2, y0 + Math.floor(sel / cols) * cs - 2, cs + 4, cs + 4, { fill: false, color: 'gold', width: 2.4 });
          P.text(`ℤ_N,  N = ${p}·${q} = ${N},  pseudosquare y = ${y}`, P.W / 2, 11, { size: 12, weight: 700, color: 'ink', halo: false });
          P.text(`squares ${cls.reduce((a, c) => a + (c === 1), 0)} · pseudosquares ${cls.reduce((a, c) => a + (c === 2), 0)} · Jacobi −1: ${cls.reduce((a, c) => a + (c === 3), 0)}`, P.W / 2, y0 + rows * cs + 14, { size: 11.5, color: 'muted', halo: false });
          // bars
          res.forEach((o, i) => {
            const x = i + 1, col = i >= 4 ? 'green' : 'orange', er = ci95(0.5, NG);
            sB.rect(x - 0.34, 0, x + 0.34, o.adv, { fill: col, fillAlpha: 0.5, color: col, width: 1.2 }); sB.line(x, Math.max(0, o.adv - er), x, o.adv + er, { color: 'ink', width: 2 });
            sB.text(v.fix(o.adv, 3), x, o.adv + er + 0.06, { size: 11, weight: 700, color: col });
          });
          sB.setTicks(res.map((o, i) => [i + 1, ['r<N/2', 'c even', 'c mod 3', 'Jacobi', 'search', 'factors'][i]]), null);
          sB.text('cheap tests', 2.5, 1.0, { size: 11.5, color: 'orange', weight: 700 }); sB.text('expensive', 5.5, 1.0, { size: 11.5, color: 'green', weight: 700 });
        });
        sG.onClick((x, y) => {
          if (!K) return; const P = pix(sG), cols = Math.ceil(Math.sqrt(K.N)), rows = Math.ceil(K.N / cols), cs = Math.max(0.6, Math.min((P.W - 24) / cols, (P.H - 70) / rows)), x0 = (P.W - cols * cs) / 2, y0 = 26;
          const [px, py] = P.at(x, y), i = Math.floor((px - x0) / cs), j = Math.floor((py - y0) / cs);
          if (i >= 0 && i < cols && j >= 0 && j < rows && j * cols + i < K.N) sel = j * cols + i;
        });
        v.legend([['accent', 'square mod $N$', { dot: true }], ['orange', 'pseudosquare', { dot: true }], ['faint', 'Jacobi $-1$', { dot: true }], ['ink', 'not coprime', { dot: true }]]);
        v.readout(() => {
          const { p, q, N, cls } = K, fm = (a) => a.map((c) => String(c)).join(', ');
          let s = `Encryptions of the bit $0$ (squares): ${fm(enc[0])}; of the bit $1$ (pseudosquares): ${fm(enc[1])} — four independent randomized samples per bit; repetitions are possible.`;
          if (sel > 0) { const nm = ['not coprime to $N$', 'a **square** mod $N$', 'a **pseudosquare** (Jacobi $+1$, not a square)', 'Jacobi symbol $-1$']; s += `\nSelected residue $c=${sel}$ is ${nm[cls[sel]]}.`; }
          s += `\nTrial division factors $N$ after about $${Math.min(p, q)}$ divisions — for a 2048-bit modulus the same search needs more than $2^{1000}$.`;
          return s;
        });
      },
    },
  ],
};
