import { hybridBias, hybridProbabilities } from './sources.audit.js';
// Cryptography — Chapter 3: Computational security and pseudorandomness
import {
  clamp, ent, bits, pixc as pix, mix2, hex, ci95, GENS, GEN_NOTE, genBits, randomBitsFrom, TESTS, testZ, ladder, paintBits,
} from './ch03.shared.js';

const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const p2 = (e) => '2' + String(Math.round(e)).split('').map((c) => SUPD[c] ?? c).join('');
const sup = (e) => String(Math.round(e)).split('').map((c) => SUPD[c] ?? c).join('');
const popc = (x) => { let c = 0; x >>>= 0; while (x) { c += x & 1; x >>>= 1; } return c; };
const log2 = Math.log2;
/** log2(2^a + 2^b) */
const lse2 = (a, b) => Math.max(a, b) + log2(1 + 2 ** -Math.abs(a - b));

export default {
  collection: 'crypto',
  chapter: 3,
  title: 'Computational security and pseudorandomness',
  summary: String.raw`Modern cryptography relaxes perfect secrecy to security against *efficient* adversaries, allowing a negligible chance of failure. Pseudorandom generators stretch a short key into a long pad that no efficient test can tell from random; pseudorandom functions extend the idea to random access, giving encryption secure even against chosen-plaintext attacks. Proofs proceed by reduction — breaking the scheme would break the primitive — often through a sequence of hybrid experiments, and the birthday bound sets the price of every collision.`,
  items: [
    // ================================================================== 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'Concrete versus asymptotic security',
      statement: String.raw`There are two ways to say that a scheme is secure against efficient attackers. **Concrete security:** the scheme is $(t,\varepsilon)$-secure if every adversary running for at most $t$ steps succeeds with probability at most $\varepsilon$ — for a fixed key length, a table of what each amount of work buys. **Asymptotic security:** the key length is a parameter $n$; adversaries are probabilistic algorithms running in time polynomial in $n$, and “secure” means their success probability is a *negligible* function of $n$ (defined in 3.2). The asymptotic statement is a statement about a whole family of concrete ones; it does not say which $n$ to use.`,
      idea: String.raw`For a scheme whose only attack is exhaustive key search, an adversary that runs for $t$ steps wins with probability about $t/2^n$, so each extra key bit doubles the work needed for a given success probability. Fixing $n$ gives the concrete picture; letting $n$ grow while the adversary’s time is a polynomial $n^c$ gives $\varepsilon(n)=n^c/2^n$, which dips below every threshold and stays there. Asymptotics buy clean theorems (closure under composition, 3.2), concrete bounds buy actual parameter choices.

The power-versus-exponential limit pma-3.20(d) proves the asymptotic claim in the exhaustive-search example. For any fixed attack exponent c and requested inverse-power threshold $n^{-d}$, multiply the success model $n^c/2^n$ by $n^d$; the result $n^{c+d}/2^n$ tends to zero. It is therefore eventually below one, giving the requested threshold. This proves negligibility in that idealized model, not a concrete safe key length or the absence of other attacks.`,
      caption: String.raw`**Left:** one key length $n$ (slider). The line is the success probability $\varepsilon=\min(1,t/2^n)$ of exhaustive search against running time $t$, both on a $\log_2$ scale; drag the gold handle to set a work budget. Everything left of the red wall has $\varepsilon\le2^{-\tau}$. **Right:** the same adversary as a function of the security parameter, either polynomial time $n^c$ or exponential time $2^{\alpha n}$; the curve leaves the unsafe zone for good only if $\varepsilon(n)$ is negligible. Try $\alpha=1$.`,
      scope: String.raw`An idealised model: the scheme’s *only* attack is exhaustive key search, so $\varepsilon(t)=t/2^n$. The budget values on the picture are illustrations, not claims about any real attacker.`,
      deps: ['crypto-1.11', 'pma-3.20'],
      tags: ['concrete security', 'asymptotics'],
      refs: ['Katz–Lindell §3.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Provable_security' },
      viz(v) {
        const sA = v.stage({ x: [0, 130], y: [-130, 2], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'running time  log₂ t', ylabel: 'success  log₂ ε', title: 'Concrete: fixed key length $n$' });
        const sB = v.stage({ x: [1, 160], y: [-130, 2], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'security parameter n', ylabel: 'success  log₂ ε(n)', title: 'Asymptotic: $n$ grows, adversary polynomial or exponential' });
        const nS = v.slider('key length $n$', 20, 128, 80, { step: 1, int: true });
        const tau = v.slider('failure level $\\tau$ (safe: $\\varepsilon\\le2^{-\\tau}$)', 1, 80, 40, { step: 1, int: true });
        const kind = v.select('Adversary time', [{ value: 'poly', label: 'polynomial $n^c$' }, { value: 'exp', label: 'exponential $2^{\\alpha n}$' }], 'poly');
        const cS = v.slider('$c$', 1, 12, 4, { step: 0.5 });
        const aS = v.slider('$\\alpha$', 0.05, 1.2, 0.5, { step: 0.05 });
        const yt = [-120, -100, -80, -60, -40, -20, 0].map((y) => [y, p2(y)]);
        sA.setTicks([0, 20, 40, 60, 80, 100, 120].map((x) => [x, p2(x)]), yt);
        sB.setTicks(null, yt);
        const H = sA.handle(60, -20, { color: 'gold', r: 8, constrain: (x) => { const xx = clamp(x, 0, 128); return [xx, Math.min(0, xx - nS.value)]; } });
        let info = null;
        v.render(() => {
          const n = nS.value, T = tau.value; cS.el.hidden = kind.value !== 'poly'; aS.el.hidden = kind.value !== 'exp';
          const eps = (x) => Math.min(0, x - n);
          sA.vband(Math.max(0, n - T), 130, { color: 'red', alpha: 0.1 });
          sA.vband(0, Math.max(0, n - T), { color: 'green', alpha: 0.08 });
          sA.fn(eps, { color: 'accent', width: 2.6, domain: [0, 130] });
          sA.hline(-T, { color: 'red', width: 1.2, dash: true });
          sA.text(`safe: ε ≤ ${p2(-T)}`, 2, -T + 5, { size: 11, color: 'red', align: 'left', weight: 600 });
          const xb = clamp(H.x, 0, 128); H.set(xb, eps(xb));
          sA.text(`budget 2${sup(xb)}  →  ε = ${p2(eps(xb))}`, xb < 70 ? xb + 3 : xb - 3, eps(xb) + (eps(xb) > -10 ? -9 : 8), { size: 11.5, color: 'gold', weight: 700, align: xb < 70 ? 'left' : 'right' });
          // right
          const poly = kind.value === 'poly', c = cS.value, al = aS.value;
          const lt = (x) => (poly ? c * log2(x) : al * x);
          const f = (x) => Math.min(0, lt(x) - x);
          sB.fn(f, { color: 'accent', width: 2.6, domain: [1, 160] });
          sB.hline(-T, { color: 'red', width: 1.2, dash: true });
          sB.vline(n, { color: 'gold', width: 1.4, dash: true });
          let last = -1; for (let x = 1; x <= 160; x++) if (f(x) > -T) last = x;
          if (last >= 0 && last < 160) { sB.vband(1, last + 0.5, { color: 'red', alpha: 0.08 }); sB.dot(last + 1, f(last + 1), { r: 5, color: 'green' }); }
          if (last >= 160) sB.vband(1, 160, { color: 'red', alpha: 0.08 });
          sB.text(poly ? `adversary time t = n^${c}` : `adversary time t = 2^(${al}·n)`, 158, -8, { size: 11.5, color: 'accent', align: 'right', weight: 700 });
          info = { n, T, xb, e: eps(xb), last, poly, c, al, fn: f(n) };
        });
        v.legend([['accent', 'success probability $\\varepsilon$'], ['red', 'unsafe ($\\varepsilon>2^{-\\tau}$)', { area: true }], ['green', 'safe', { area: true }], ['gold', 'budget / current $n$', { dash: true }]]);
        v.readout(() => {
          const i = info;
          const a = String.raw`**Concrete.** With $n=${i.n}$ key bits a budget of $2^{${v.fix(i.xb, 0)}}$ steps succeeds with probability $2^{${v.fix(i.e, 1)}}$; success stays below $2^{-${i.T}}$ up to $t=2^{${Math.max(0, i.n - i.T)}}$.`;
          const b = i.last >= 160 ? String.raw`**Asymptotic.** In this window $\varepsilon(n)$ never gets below $2^{-${i.T}}$ — the adversary is too strong (exponential time $2^{\alpha n}$ with $\alpha\ge1$ breaks the scheme at every $n$).`
            : i.last < 0 ? String.raw`**Asymptotic.** $\varepsilon(n)\le 2^{-${i.T}}$ for every $n\ge1$ shown.`
              : String.raw`**Asymptotic.** $\varepsilon(n)=2^{${i.poly ? v.fix(i.c, 1) + '\\log_2 n' : v.fix(i.al, 2) + 'n'}-n}$ exceeds $2^{-${i.T}}$ for $n\le ${i.last}$ and is below it from $n=${i.last + 1}$ on: negligible (decays faster than any $n^{-d}$), but only *from there on*.`;
          return a + '\n' + b;
        });
      },
    },

    // ================================================================== 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Negligible functions and efficient adversaries',
      statement: String.raw`A function $\mu:\mathbb N\to\mathbb R_{\ge0}$ is **negligible** if for every polynomial $p$ there is $N$ with $\mu(n)<1/p(n)$ for all $n>N$; equivalently $\mu(n)<n^{-c}$ eventually, for every constant $c$. An **efficient** (PPT) adversary is a randomized algorithm whose running time on inputs of size $n$ is bounded by a polynomial in $n$. Negligible functions are closed under addition and under multiplication by any polynomial: if $\mu,\nu$ are negligible and $p$ is a polynomial, then $\mu+\nu$ and $p\cdot\mu$ are negligible. A scheme is secure if every PPT adversary succeeds with at most negligible probability.`,
      idea: String.raw`To be below $n^{-c}$ for every $c$, a function must decay faster than every fixed power, i.e. $-\log_2\mu(n)$ must grow faster than $c\log_2 n$ for all $c$. Exponentials $2^{-n}$, subexponentials such as $2^{-\sqrt n}$ and quasi-polynomial $n^{-\log n}$ all do; $n^{-10}$ does not (it loses to $n^{-11}$). Closure under polynomial factors is what makes the definition robust: a polynomial number of repetitions of a negligible-probability event is still negligible, so the notion does not depend on the machine model.

The examples use pma-3.20(d), which beats every fixed polynomial by a fixed-base exponential. It immediately handles $n^c2^{-n}$; with $t=\sqrt n$, the expression $n^c2^{-\sqrt n}$ becomes $t^{2c}2^{-t}$ and has the same limit. For $n^{-\log n}$, eventually $\log n$ exceeds any requested exponent. These examples must hold eventually for each fixed exponent; a finite plot alone cannot establish negligibility.`,
      caption: String.raw`The vertical axis is $\log_2$ of each function, the horizontal axis (logarithmic) is $n$. Drag the slider to choose a challenge $n^{-c}$ (the dashed line) and optionally multiply every function by $n^d$. A function is negligible if it ends up below *every* dashed line; the dot marks where each one crosses for good. Try $c=10$ against $n^{-10}$, and raise $c$ to watch $2^{-\sqrt n}$ win only at astronomically large $n$.`,
      deps: ['crypto-3.1', 'pma-3.20'],
      tags: ['negligible', 'definitions'],
      refs: ['Katz–Lindell §3.1'],
      viz(v) {
        const s = v.stage({ x: [2, 1e9], y: [-300, 5], xlog: true, axes: 'box', gutter: true, height: 380, minWidth: 340, xlabel: 'n (log scale)', ylabel: 'log₂ of the function' });
        s.setTicks(null, [-300, -250, -200, -150, -100, -50, 0].map((y) => [y, p2(y)]));
        const cS = v.slider('challenge exponent $c$ in $n^{-c}$', 1, 60, 10, { step: 1, int: true });
        const dS = v.slider('multiply by $n^{d}$, $d$', 0, 20, 0, { step: 1, int: true });
        const F = [
          { name: '2^{-n}', col: 'green', f: (n) => -n, lab: '$2^{-n}$', neg: true },
          { name: '2^{-√n}', col: 'teal', f: (n) => -Math.sqrt(n), lab: '$2^{-\\sqrt n}$', neg: true },
          { name: 'n^{-log n}', col: 'purple', f: (n) => -(log2(n) ** 2), lab: '$n^{-\\log_2 n}$', neg: true },
          { name: 'n^{-10}', col: 'red', f: (n) => -10 * log2(n), lab: '$n^{-10}$', neg: false },
          { name: '1/n', col: 'orange', f: (n) => -log2(n), lab: '$1/n$', neg: false },
        ];
        let info = null;
        v.render(() => {
          const c = cS.value, d = dS.value, g = (n) => -c * log2(n);
          s.fn(g, { color: 'ink', width: 2, dash: true });
          const res = [];
          F.forEach((o) => {
            const h = (n) => o.f(n) + d * log2(n);
            s.fn((n) => Math.max(h(n), -310), { color: o.col, width: 2.4 });
            // last n (on a log grid) where h >= g
            let last = null; const N = 1500;
            for (let i = 0; i < N; i++) { const n = 2 * (5e8 ** (i / (N - 1))); if (h(n) >= g(n) - 1e-12) last = n; }
            const cross = last == null ? 2 : last;
            const never = last != null && last > 4.9e8;
            res.push({ o, never, cross });
            if (!never && cross < 4e8) s.dot(cross * 1.0, g(cross), { r: 5, color: o.col });
          });
          s.text(`challenge n^−${c}`, 4e8, -c * log2(4e8) + 18, { size: 11.5, color: 'ink', align: 'right', weight: 600 });
          info = { c, d, res };
        });
        v.legend(F.map((o) => [o.col, o.lab]).concat([['ink', 'challenge $n^{-c}$', { dash: true }]]));
        v.readout(() => {
          const lines = info.res.map(({ o, never, cross }) => `${o.lab}${info.d ? '$\\cdot n^{' + info.d + '}$' : ''}: ` + (never ? `**not below $n^{-${info.c}}$** within $n\\le 10^9$ ${o.neg ? '(it still wins eventually)' : '(it never does)'}` : `below $n^{-${info.c}}$ for all $n\\ge ${cross < 1e4 ? Math.ceil(cross) : v.sci(cross, 2)}$`));
          return lines.join('\n') + '\n' + String.raw`Negligible means: win against *every* $c$ (and every polynomial factor $n^d$). The first three do; $n^{-10}$ and $1/n$ fail as soon as $c\ge$ their exponent.`;
        });
      },
    },

    // ================================================================== 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Indistinguishable encryptions (EAV-security)',
      statement: String.raw`In the **eavesdropping experiment** $\mathsf{PrivK}^{\mathsf{eav}}_{\mathcal A,\Pi}(n)$ the adversary $\mathcal A$ is given $1^n$ and outputs two messages $m_0,m_1$ of equal length; a key $k\leftarrow\mathsf{Gen}(1^n)$ and a bit $b\leftarrow\{0,1\}$ are chosen; $\mathcal A$ receives the challenge ciphertext $c\leftarrow\mathsf{Enc}_k(m_b)$ and outputs a guess $b'$; the experiment outputs $1$ iff $b'=b$. The scheme $\Pi$ has **indistinguishable encryptions in the presence of an eavesdropper** (is EAV-secure) if for every PPT adversary $\mathcal A$ there is a negligible function $\mathsf{negl}$ with $$\Pr\bigl[\mathsf{PrivK}^{\mathsf{eav}}_{\mathcal A,\Pi}(n)=1\bigr]\le\tfrac12+\mathsf{negl}(n).$$ This is perfect indistinguishability (2.2) with the unbounded adversary replaced by a PPT one and equality replaced by “up to negligible”.`,
      idea: String.raw`Winning half the time is free (guess), so the interesting quantity is the **advantage** $\bigl|\Pr[b'=b]-\tfrac12\bigr|$. The definition is a *game* because security is a statement about every adversary; one only ever exhibits a particular $\mathcal A$ to refute it. Equal-length messages are required since encryption may reveal length. Perfect secrecy implies EAV-security trivially (2.2), and the one-time pad (2.3) is EAV-secure; the relaxation lets keys be shorter than messages, the point of 3.5–3.7.`,
      caption: String.raw`Pick a scheme (16-bit messages), a message pair and the adversary’s rule, then step through one game with the player (*New game* draws fresh $k,b$). The lower panel runs 3000 games and plots the running success rate with the $\pm1.96\sigma$ band of a pure coin flip and the exact value (computed by enumerating all keys). The pad is unbeatable; the repeated-key scheme falls to the likelihood rule — but only when the message pair is chosen so that $m_0,m_1$ differ in the structure being tested.`,
      deps: ['crypto-3.2', 'crypto-2.2'],
      tags: ['eavesdropper', 'security game'],
      refs: ['Katz–Lindell §3.2'],
      credit: 'Goldwasser & Micali, 1982/1984 (the indistinguishability game, as “polynomial security”)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ciphertext_indistinguishability' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 248, full: true });
        const sP = v.stage({ x: [0, 3000], y: [0.3, 1], axes: 'box', gutter: true, height: 260, full: true, xlabel: 'games played', ylabel: 'fraction won' });
        const scheme = v.select('Scheme', [{ value: 'otp', label: '16-bit one-time pad' }, { value: 'rep', label: '8-bit key used twice' }, { value: 'short', label: '12-bit key, padded with 0' }], 'rep');
        const pair = v.select('Messages $(m_0,m_1)$', [{ value: 0, label: '1234 / 5678' }, { value: 1, label: '1234 / 3412' }, { value: 2, label: '0000 / 00FF' }, { value: 3, label: 'ABCD / ABCF' }], 0);
        const rule = v.select('Adversary', [{ value: 'coin', label: 'guess a coin' }, { value: 'lik', label: 'likelihood rule' }], 'lik');
        let seed = 1; v.button('New game', () => { seed += 1; });
        const PAIRS = [[0x1234, 0x5678], [0x1234, 0x3412], [0x0000, 0x00ff], [0xabcd, 0xabcf]];
        const KEYSP = { otp: 65536, rep: 256, short: 4096 };
        const keyOf = (sch, k) => (sch === 'otp' ? k : sch === 'rep' ? (k << 8) | k : k << 4);
        const valid = (sch, x) => (sch === 'otp' ? true : sch === 'rep' ? (x >> 8) === (x & 255) : (x & 15) === 0);
        const guess = (sch, rl, c, ms, r) => {
          if (rl === 'coin') return r() < 0.5 ? 0 : 1;
          const a = valid(sch, c ^ ms[0]), b = valid(sch, c ^ ms[1]);
          if (a && !b) return 0; if (b && !a) return 1; return r() < 0.5 ? 0 : 1;
        };
        const exactP = (sch, rl, ms) => {
          if (rl === 'coin') return 0.5;
          let w = 0; const K = KEYSP[sch];
          for (let b = 0; b < 2; b++) for (let k = 0; k < K; k++) {
            const c = ms[b] ^ keyOf(sch, k), a = valid(sch, c ^ ms[0]), bb = valid(sch, c ^ ms[1]);
            if (a && !bb) w += b === 0 ? 1 : 0; else if (bb && !a) w += b === 1 ? 1 : 0; else w += 0.5;
          }
          return w / (2 * K);
        };
        const S = v.steps({ frames: [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }, { n: 6 }], still: 5, note: false });
        let est = null;
        v.render(() => {
          const sch = scheme.value, rl = rule.value, ms = PAIRS[pair.value];
          const r = v.rng(seed * 104729 + pair.value * 7 + 3);
          const K = KEYSP[sch];
          const k0 = Math.floor(r() * K), b0 = r() < 0.5 ? 0 : 1, c0 = ms[b0] ^ keyOf(sch, k0), g0 = guess(sch, rl, c0, ms, r);
          const P = pix(sD);
          const rows = [
            { dir: 0, text: `k ← Gen(1ⁿ):  ${sch === 'otp' ? 'k = ' + hex(k0, 4) : sch === 'rep' ? 'k = ' + hex(k0, 2) + ' (pad ' + hex(keyOf(sch, k0), 4) + ')' : 'k = ' + hex(k0, 3) + ' (pad ' + hex(keyOf(sch, k0), 4) + ')'}`, color: 'orange' },
            { dir: -1, text: `m₀ = ${hex(ms[0])},  m₁ = ${hex(ms[1])}`, color: 'accent' },
            { dir: 0, text: `b ← {0,1}:  b = ${b0};   c = Enc_k(m_b) = ${hex(c0)}`, color: 'orange' },
            { dir: 1, text: `challenge ciphertext c = ${hex(c0)}`, color: 'orange' },
            { dir: -1, text: `guess b′ = ${g0}`, color: 'accent' },
            { dir: 0, text: g0 === b0 ? 'experiment outputs 1: A wins' : 'experiment outputs 0: A loses', color: g0 === b0 ? 'green' : 'red' },
          ];
          const shown = rows.slice(0, S.frame.n);
          ladder(P, ['Adversary A', 'Challenger'], shown, { rh: 28, top: 44, x1: Math.max(70, P.W * 0.14), x2: P.W - Math.max(70, P.W * 0.14) });
          // simulation
          const NG = 3000, r2 = v.rng(seed * 7 + 99991 + pair.value * 13 + (rl === 'coin' ? 1 : 2) + sch.length * 31), run = []; let win = 0;
          for (let t = 1; t <= NG; t++) {
            const k = Math.floor(r2() * K), b = r2() < 0.5 ? 0 : 1, c = ms[b] ^ keyOf(sch, k);
            if (guess(sch, rl, c, ms, r2) === b) win++;
            if (t % 15 === 0 || t < 15) run.push([t, win / t]);
          }
          const ex = exactP(sch, rl, ms);
          const band = (sg) => Array.from({ length: 150 }, (_, i) => { const n = 20 + i * 20; return [n, clamp(0.5 + sg * 1.96 * 0.5 / Math.sqrt(n), 0.3, 1)]; });
          sP.path(band(1), { color: 'faint', width: 1.4, dash: true }); sP.path(band(-1), { color: 'faint', width: 1.4, dash: true });
          sP.hline(0.5, { color: 'muted', width: 1 });
          sP.hline(ex, { color: 'green', width: 2, dash: true });
          sP.path(run, { color: 'accent', width: 2.2 });
          sP.text(`exact ${v.fix(ex, 3)}`, 2950, Math.min(0.97, ex + 0.04), { size: 11.5, color: 'green', align: 'right', weight: 700 });
          est = { win, NG, ex, p: win / NG };
        });
        v.legend([['accent', 'running success rate'], ['green', 'exact success probability', { dash: true }], ['faint', '$\\pm1.96\\sigma$ band of a coin flip', { dash: true }]]);
        v.readout(() => `After ${est.NG} games the adversary won ${est.win} (${v.fix(est.p, 3)} $\\pm$ ${v.fix(ci95(est.p, est.NG), 3)}); exact success probability $${v.fix(est.ex, 4)}$, so the advantage is $${v.fix(est.ex - 0.5, 4)}$.` + (est.ex - 0.5 < 1e-9 ? '\nAdvantage $0$: for this scheme and adversary the game is a coin flip, as the definition demands.' : '\nA constant advantage (not negligible): this scheme is **not** EAV-secure — the experiment is lost to a fixed efficient adversary.'));
      },
    },

    // ================================================================== 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Semantic security is equivalent to indistinguishability',
      statement: String.raw`For private-key encryption of all bit strings of the supported lengths, **single-ciphertext indistinguishability** against PPT eavesdroppers is equivalent to this computational simulation property. For every PPT adversary $A$ there is a PPT simulator $S$ such that for every PPT sampler of polynomial-length pairs $(m,z)$ and every efficiently computable, polynomial-length function $f$, $$\left|\Pr[A(1^n,\mathsf{Enc}_k(m),|m|,z)=f(m,z)]-\Pr[S(1^n,|m|,z)=f(m,z)]\right|$$ is negligible in $n$. Here $k\leftarrow\mathsf{Gen}(1^n)$ is independent of the sampler, and probabilities include all random coins. The auxiliary information $z$ is given to both algorithms. This is a modern, efficiently sampled formulation of semantic security; it concerns one ciphertext, not repeated use of a key.`,
      idea: String.raw`IND implies simulation: $S$ generates a fresh key, encrypts a dummy string of the supplied length, and runs $A$ with the same auxiliary information. If replacing the real message by the dummy changes the probability of outputting $f(m,z)$ noticeably, a reduction samples $(m,z)$, submits the real/dummy pair to its IND challenge, and tests whether $A$'s output equals $f(m,z)$. Conversely, an IND adversary selects two equal-length messages and state. Sample one of those messages uniformly, give the pair and state as auxiliary information, and ask for the bit identifying the selected message. With distinct messages the ciphertext adversary has its IND success probability, whereas a simulator without the ciphertext succeeds with probability $1/2$. For equal-message cases the target function and semantic adversary can both return a fixed value; these cases contribute no IND advantage. These reductions explain the equivalence; the diagram below is one special parity example.`,
      caption: String.raw`Uniform 8-bit messages are encrypted with independent biased pad bits, $\Pr[k_i=1]=p$. The function is the parity of the $w$ least significant bits. The semantic adversary $A$ (blue) and its parity-specific IND wrapper $D$ (orange) have exact excess success $|1-2p|^w/2$; the ciphertext-free simulator $S$ (grey) has exact excess $0$. The sampled bars may be slightly negative and include normal standard-error intervals. At $p=1/2$ all exact excesses vanish.`,
      scope: String.raw`Instance: one-bit function $f$ of an 8-bit message under a biased pad; the general equivalence is proved by the two reductions in the idea, not by this simulation.`,
      deps: ['crypto-3.3'],
      tags: ['semantic security', 'reductions'],
      refs: ['Goldwasser–Micali (1984), §§5.1–5.2, Theorem 5.2, pp. 282–290', 'Boneh–Shoup v0.6, §2.2 (modern IND games); reductions supplied in the text'],
      credit: 'Goldwasser & Micali, 1984, §5.2 (original public-key semantic notion); modern simulation formulation here',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Semantic_security', 'GM original': 'https://people.csail.mit.edu/silvio/Selected%20Scientific%20Papers/Encryption/Probabilistic_Encryption.pdf' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const sB = v.stage({ x: [0.4, 3.6], y: [-0.06, 0.58], axes: 'box', gutter: true, height: 270, full: true, ylabel: 'advantage over ½' });
        const pS = v.slider('key bias $p=\\Pr[k_i=1]$', 0.5, 1, 0.8, { step: 0.01 });
        const wS = v.select('$f(m)$ = XOR of the low $w$ bits', [1, 2, 3, 4].map((w) => ({ value: w, label: `$w=${w}$` })), 1);
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const NG = 6000;
        let info = null;
        v.render(() => {
          const p = pS.value, w = wS.value, r = v.rng(seed * 31 + w);
          const kb = () => (r() < p ? 1 : 0);
          const par = (x) => popc(x & ((1 << w) - 1)) & 1;
          const delta = Math.abs(1 - 2 * p) ** w / 2; // exact advantage
          const likelier = (1 - (1 - 2 * p) ** w) / 2 > 0.5 ? 1 : 0; // likelier parity of the key bits
          let wa = 0, ws = 0, wd = 0;
          for (let t = 0; t < NG; t++) {
            // semantic game
            let m = Math.floor(r() * 256), k = 0; for (let i = 0; i < 8; i++) k |= kb() << i;
            const c = m ^ k;
            if ((par(c) ^ likelier) === par(m)) wa++;
            if ((r() < 0.5 ? 1 : 0) === par(m)) ws++;
            // distinguisher: m0 with f=0, m1 with f=1, rest random
            const rest = Math.floor(r() * 256);
            let mm0 = rest, mm1 = rest; if (par(mm0) !== 0) mm0 ^= 1; if (par(mm1) !== 1) mm1 ^= 1;
            const b = r() < 0.5 ? 0 : 1; let k2 = 0; for (let i = 0; i < 8; i++) k2 |= kb() << i;
            const c2 = (b ? mm1 : mm0) ^ k2, ga = par(c2) ^ likelier;
            if (ga === b) wd++;
          }
          const P = pix(sD), W = P.W, bx = (x, y, w2, h, t, col) => { P.rect(x, y, w2, h, { fill: col, fillAlpha: 0.14, color: col, width: 1.8, radius: 9 }); P.text(t, x + w2 / 2, y + h / 2, { size: 12.5, weight: 700, color: col, halo: false }); };
          const cw = Math.min(W - 20, 560), x0 = (W - cw) / 2;
          bx(x0 + cw * 0.28, 8, cw * 0.46, 134, '', 'orange');
          P.text('distinguisher D  (wins the game of 3.3)', x0 + cw * 0.51, 20, { size: 11.5, color: 'orange', weight: 700, halo: false });
          bx(x0 + cw * 0.4, 40, cw * 0.22, 60, 'A: guess f(m)', 'accent');
          P.text('picks m₀,m₁ with f(m₀)=0, f(m₁)=1', x0 + cw * 0.51, 118, { size: 11, color: 'muted', halo: false });
          P.text('m₀,m₁', x0 + cw * 0.12, 54, { size: 11.5, color: 'ink', halo: false }); P.arrow(x0 + cw * 0.2, 60, x0 + cw * 0.28, 60, { color: 'ink', width: 1.6 });
          P.text('c = Enc(m_b)', x0 + cw * 0.12, 90, { size: 11.5, color: 'ink', halo: false }); P.arrow(x0 + cw * 0.22, 96, x0 + cw * 0.4, 80, { color: 'ink', width: 1.6 });
          P.text('b′ = [A’s guess = f(m₁)]', x0 + cw * 0.88, 70, { size: 11.5, color: 'ink', halo: false });
          const adv = (x) => x / NG - 0.5, e = (q) => ci95(q / NG, NG);
          const vals = [[1, adv(wa), 'accent', e(wa)], [2, adv(ws), 'muted', e(ws)], [3, adv(wd), 'orange', e(wd)]];
          vals.forEach(([x, y, col, er]) => { sB.rect(x - 0.28, Math.min(y, 0), x + 0.28, Math.max(y, 0), { fill: col, fillAlpha: 0.5, color: col, width: 1.2 }); sB.line(x, y - er, x, y + er, { color: 'ink', width: 2 }); sB.text(v.fix(y, 3), x, Math.max(y, 0) + er + 0.04, { size: 11.5, weight: 700, color: col }); });
          sB.hline(0, { color: 'muted', width: 1 });
          sB.hline(delta, { color: 'green', width: 2, dash: true });
          sB.text(`exact ${v.fix(delta, 3)}`, 3.58, delta + 0.03, { size: 11, color: 'green', align: 'right', weight: 700 });
          sB.setTicks([[1, 'A  (sees c)'], [2, 'S  (sees only |m|)'], [3, 'D  (built from A)']], null);
          info = { delta, a: adv(wa), s: adv(ws), d: adv(wd) };
        });
        v.legend([['accent', 'semantic adversary A'], ['muted', 'simulator S'], ['orange', 'distinguisher D'], ['green', 'exact advantage $|1-2p|^w/2$', { dash: true }]]);
        v.readout(() => `Advantage of $\\mathcal A$ over the simulator: $${v.fix(info.a - info.s, 3)}$; advantage of $\\mathcal D$ in the indistinguishability game: $${v.fix(info.d, 3)}$. Exact value for both: $\\tfrac12|1-2p|^{w}=${v.fix(info.delta, 3)}$ (error bars $\\pm1.96\\sigma$, ${NG} games each).` + (info.delta < 1e-9 ? '\nPerfect pad: nothing leaks, and nothing can be distinguished.' : '\nThe leak a semantic adversary exploits is exactly the leak a distinguisher exploits.'));
      },
    },

    // ================================================================== 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Pseudorandom generators',
      statement: String.raw`A deterministic polynomial-time algorithm $G:\{0,1\}^n\to\{0,1\}^{\ell(n)}$ with **expansion** $\ell(n)>n$ is a **pseudorandom generator** (PRG) if for every PPT distinguisher $D$ there is a negligible function $\mathsf{negl}$ with $$\Bigl|\Pr_{s\leftarrow\{0,1\}^n}[D(G(s))=1]-\Pr_{r\leftarrow\{0,1\}^{\ell(n)}}[D(r)=1]\Bigr|\le\mathsf{negl}(n).$$ Only $2^n$ of the $2^{\ell(n)}$ strings are outputs of $G$, so an *unbounded* distinguisher always wins (is the string in the range?); pseudorandomness is the claim that no *efficient* test can notice.`,
      idea: String.raw`Statistical tests are exactly efficient distinguishers: a test that rejects random strings only rarely but rejects outputs of $G$ often is a distinguisher with non-negligible advantage. A generator is therefore refuted by exhibiting a test; it is never *proved* pseudorandom by passing tests, only believed so under an assumption (one-way functions suffice, chapter 6). Passing frequency, runs and autocorrelation tests is easy — linear shift registers do — which is why the definition quantifies over **all** efficient tests.

The product count comb-1.1 gives $2^n$ possible seeds and $2^{\ell(n)}$ possible output strings by choosing each bit. A deterministic generator has at most one image per seed, so its range has size at most $2^n$, possibly less if seeds collide. The range-membership test accepts the generator with probability one but a uniform output with probability at most $2^{n-\ell(n)}$. This is a statistical distinction; the definition withholds an efficient membership algorithm.`,
      caption: String.raw`Pick a toy generator and a test. The two bitmaps show $L=2048$ output bits of $G(s)$ (top) and of a truly random string (bottom). The histogram shows the test statistic $z$ over 300 runs of each (values beyond $\pm10$ are drawn at the edge); a test *rejects* when $|z|>2$. The readout gives the distinguisher’s advantage. The LFSR passes three tests and fails the linear-complexity test; each of the other bad generators fails a test you can find.`,
      scope: String.raw`All generators here are toys with a 32-bit seed (so the $2^{32}$-element range could be exhausted); none is a cryptographic generator, and “mixer” is only *statistically* good.`,
      deps: ['crypto-3.2', 'comb-1.1'],
      tags: ['prg', 'pseudorandomness'],
      refs: ['Katz–Lindell §3.3.1', 'Boneh–Shoup ch. 3'],
      credit: 'Blum & Micali, 1984; Yao, 1982',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pseudorandom_generator' },
      viz(v) {
        const sI = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, minWidth: 260, weight: 0.9 });
        const sH = v.stage({ x: [-10, 10], y: [0, 1], axes: 'box', gutter: true, height: 440, minWidth: 300, weight: 1.2, xlabel: 'test statistic z', ylabel: 'fraction of runs' });
        const gen = v.select('Generator', GENS, 'lfsr');
        const test = v.select('Test', TESTS, 'lin');
        const lag = v.slider('lag $k$', 1, 40, 32, { step: 1, int: true });
        let seed = 7; v.button('New seeds', () => { seed += 1; });
        const L = 2048, R = 300, GW = 64, GH = 32;
        let cacheKey = '', res = null;
        v.render(() => {
          lag.el.hidden = test.value !== 'auto';
          const key = [gen.value, test.value, lag.value, seed].join();
          if (key !== cacheKey) {
            cacheKey = key; const r = v.rng(seed * 977 + 1), zg = [], zr = []; let b0 = null, r0 = null;
            for (let i = 0; i < R; i++) {
              const g = genBits(gen.value, Math.floor(r() * 4294967296), L), rb = randomBitsFrom(r, L);
              if (i === 0) { b0 = g; r0 = rb; }
              zg.push(testZ(test.value, g, lag.value)); zr.push(testZ(test.value, rb, lag.value));
            }
            res = { zg, zr, b0, r0 };
          }
          const { zg, zr, b0, r0 } = res;
          // bitmaps
          const P = pix(sI), W = P.W, cs = Math.max(2, Math.floor(Math.min((W - 20) / GW, (P.H - 96) / (2 * GH)))), bw = cs * GW, x0 = (W - bw) / 2;
          P.text('G(s), 2048 bits', x0, 12, { size: 11.5, weight: 700, color: 'accent', align: 'left', halo: false });
          P.text('uniformly random, 2048 bits', x0, 12 + GH * cs + 34, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false });
          const paint = (bt, y0, col) => paintBits(sI, v.color(col), bt, GW, GH, x0, y0, bw);
          const yTop = 20;
          paint(b0, yTop, 'accent'); paint(r0, yTop + GH * cs + 34, 'muted');
          // hist
          const bins = 40, lo = -10, hi = 10, cnt = (zs) => { const c = new Array(bins).fill(0); zs.forEach((z) => { const i = clamp(Math.floor((z - lo) / (hi - lo) * bins), 0, bins - 1); c[i]++; }); return c.map((x) => x / zs.length); };
          const cg = cnt(zg), cr = cnt(zr), top = Math.max(0.2, ...cg, ...cr) * 1.15; sH.setView([-10, 10], [0, top]);
          const bwid = (hi - lo) / bins;
          for (let i = 0; i < bins; i++) {
            sH.rect(lo + i * bwid + 0.02, 0, lo + (i + 1) * bwid - 0.02, cr[i], { fill: 'muted', fillAlpha: 0.4, color: 'muted', width: 1 });
            sH.rect(lo + i * bwid + 0.02, 0, lo + (i + 1) * bwid - 0.02, cg[i], { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.2 });
          }
          sH.vband(-10, -2, { color: 'red', alpha: 0.07 }); sH.vband(2, 10, { color: 'red', alpha: 0.07 });
          sH.text('reject', -6, top * 0.95, { size: 11, color: 'red', weight: 700 }); sH.text('reject', 6, top * 0.95, { size: 11, color: 'red', weight: 700 });
        });
        v.legend([['accent', '$z$ for $G(s)$'], ['muted', '$z$ for random'], ['red', 'reject region $|z|>2$', { area: true }]]);
        v.readout(() => {
          const { zg, zr } = res, rate = (z) => z.filter((x) => Math.abs(x) > 2).length / z.length;
          const a = rate(zg), b = rate(zr), adv = Math.abs(a - b);
          return String.raw`${GEN_NOTE[gen.value]}` + '\n' + String.raw`Test $D$ = “reject if $|z|>2$”: $\Pr[D(G(s))=1]=${v.fix(a, 3)}$, $\Pr[D(r)=1]=${v.fix(b, 3)}$ (300 runs each, $\pm${v.fix(ci95(0.5, 300), 2)}$ at worst), advantage $${v.fix(adv, 3)}$.` + (adv > 0.5 ? ' **A constant-advantage distinguisher: not a PRG.**' : adv < 0.12 ? ' This test cannot tell them apart — which proves nothing about other tests.' : '');
        });
      },
    },

    // ================================================================== 3.6
    {
      num: '3.6',
      kind: 'Method',
      name: 'Proofs by reduction',
      statement: String.raw`To prove a scheme $\Pi$ secure **assuming** a primitive $P$ is secure: (1) state the assumption (“no efficient algorithm breaks $P$ with non-negligible probability”); (2) take an arbitrary efficient adversary $\mathcal A$ that breaks $\Pi$ with probability $\varepsilon_{\mathcal A}(n)$; (3) construct from $\mathcal A$ an efficient algorithm $\mathcal R$ — the **reduction** — that runs $\mathcal A$ as a subroutine, simulating $\Pi$’s environment for it, and breaks $P$ with probability $\varepsilon_{\mathcal R}\ge\varepsilon_{\mathcal A}/L$ in time $t_{\mathcal R}\le t_{\mathcal A}+\tau$, where the loss $L$ and overhead $\tau$ are polynomial; (4) conclude by contrapositive: if $\varepsilon_{\mathcal A}$ were non-negligible, so would $\varepsilon_{\mathcal R}$ be, contradicting (1). Concretely, if $P$ is $(t,\varepsilon)$-secure then $\Pi$ is $(t-\tau,\,L\varepsilon)$-secure.`,
      idea: String.raw`The reduction must run efficiently and must present $\mathcal A$ with exactly the distribution of the real experiment whenever $\mathcal R$’s own input is “real”; only then does $\mathcal A$’s success probability carry over. Polynomial overhead is what makes this meaningful asymptotically (the reduction is in the spirit of polynomial-time reductions, toc-13.1, with a probability instead of a yes/no answer); the *size* of $L$ and $\tau$ is what a concrete analysis cares about, since a loss of $2^{30}$ turns an $n$-bit primitive into an $(n-30)$-bit scheme.`,
      caption: String.raw`Left: the scheme’s plane (running time $t$, success $\varepsilon$, both $\log_2$). Right: the primitive’s plane, assumed to withstand exhaustive search only, $\varepsilon_P(t)=t/2^n$. Drag the gold adversary $\mathcal A$: the reduction maps it to the point $\mathcal R=(t+\tau,\varepsilon/L)$ on the right. Whenever $\mathcal R$ lands *above* the primitive’s curve the assumption is violated, so such an $\mathcal A$ cannot exist (red). The green curve on the left is therefore the security the proof delivers; raise the loss $L$ and it sinks.`,
      scope: String.raw`A model of the bookkeeping, not a particular scheme: the primitive is assumed to have the hardness curve $t/2^n$ for illustration, and the reduction’s loss and overhead are the sliders’ values.`,
      deps: ['crypto-3.2', 'toc-13.1'],
      tags: ['reductions', 'proof technique'],
      refs: ['Katz–Lindell §3.3.2'],
      viz(v) {
        const sA = v.stage({ x: [0, 100], y: [-100, 2], axes: 'box', gutter: true, height: 330, minWidth: 300, xlabel: 'log₂ t  (time)', ylabel: 'log₂ ε', title: 'Scheme Π: adversary A' });
        const sB = v.stage({ x: [0, 100], y: [-100, 2], axes: 'box', gutter: true, height: 330, minWidth: 300, xlabel: 'log₂ t  (time)', ylabel: 'log₂ ε', title: 'Primitive P: reduction R' });
        const nS = v.slider('hardness $n$', 30, 100, 80, { step: 1, int: true });
        const LS = v.slider('loss $\\log_2L$', 0, 40, 10, { step: 1, int: true });
        const TS = v.slider('overhead $\\log_2\\tau$', 0, 40, 12, { step: 1, int: true });
        const ticks = [0, 20, 40, 60, 80, 100].map((x) => [x, p2(x)]), yt = [0, -20, -40, -60, -80, -100].map((y) => [y, p2(y)]);
        sA.setTicks(ticks, yt); sB.setTicks(ticks, yt);
        const H = sA.handle(50, -25, { color: 'gold', r: 8, label: 'A', constrain: { x: [0, 100], y: [-100, 0] } });
        let info = null;
        v.render(() => {
          const n = nS.value, Lg = LS.value, tau = TS.value, ta = H.x, ea = H.y;
          const prim = (t) => Math.min(0, t - n);
          const tB = lse2(ta, tau), eB = ea - Lg;
          const bad = eB > prim(tB) + 1e-9;
          sB.fn(prim, { color: 'accent', width: 2.6, domain: [0, 100] });
          sB.between(prim, () => 2, 0, 100, { fill: 'red', fillAlpha: 0.07 });
          sB.dot(tB, eB, { r: 7, color: bad ? 'red' : 'green', label: 'R', labelPos: 'ne' });
          sB.text('assumed hardness ε = t / 2ⁿ', 98, -92, { size: 11.5, color: 'accent', align: 'right', weight: 700 });
          const scheme = (t) => Math.min(0, Lg + lse2(t, tau) - n);
          sA.fn(scheme, { color: 'green', width: 2.6, domain: [0, 100] });
          sA.between(scheme, () => 2, 0, 100, { fill: 'red', fillAlpha: 0.07 });
          sA.text('security the proof gives', 98, -92, { size: 11.5, color: 'green', align: 'right', weight: 700 });
          H.set(ta, Math.min(0, ea));
          info = { n, Lg, tau, ta, ea, tB, eB, bad };
        });
        v.legend([['green', 'scheme: provable bound', {}], ['accent', 'primitive: assumed bound', {}], ['red', 'impossible region', { area: true }], ['gold', 'adversary A', { dot: true }]]);
        v.readout(() => {
          const i = info;
          return String.raw`$\mathcal A$: $t=2^{${v.fix(i.ta, 1)}}$, $\varepsilon=2^{${v.fix(i.ea, 1)}}$ $\;\Rightarrow\;$ $\mathcal R$: $t=2^{${v.fix(i.tB, 1)}}$, $\varepsilon=2^{${v.fix(i.eB, 1)}}$, while the primitive allows at most $2^{${v.fix(Math.min(0, i.tB - i.n), 1)}}$ at that time.` + '\n' +
            (i.bad ? String.raw`**$\mathcal R$ breaks the primitive**, contradicting the assumption: no adversary can sit here. The scheme inherits ${i.n - i.Lg} bits of security instead of ${i.n}.` : String.raw`$\mathcal R$ is consistent with the assumption, so this $\mathcal A$ is not ruled out. Drag $\mathcal A$ up or right until the reduction lands in the red; the loss $2^{${i.Lg}}$ costs ${i.Lg} bits of security.`);
        });
      },
    },

    // ================================================================== 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Pseudorandom generators give EAV-secure encryption',
      statement: String.raw`Let $G:\{0,1\}^n\to\{0,1\}^{\ell(n)}$ be a pseudorandom generator. The fixed-length scheme with $\mathsf{Gen}$ choosing $k\leftarrow\{0,1\}^n$ uniformly, $\mathsf{Enc}_k(m)=G(k)\oplus m$ and $\mathsf{Dec}_k(c)=G(k)\oplus c$, for $m\in\{0,1\}^{\ell(n)}$, has indistinguishable encryptions in the presence of an eavesdropper (3.3). Quantitatively, for every adversary $\mathcal A$ there is a distinguisher $\mathcal D$ with about the same running time such that $\Pr[\mathsf{PrivK}^{\mathsf{eav}}_{\mathcal A}=1]\le\tfrac12+\mathrm{Adv}^{\mathrm{prg}}_{G,\mathcal D}$.`,
      idea: String.raw`Replace $G(k)$ by a truly random string $r$: the experiment becomes the one-time pad (2.3), where $\mathcal A$ wins with probability exactly $\tfrac12$. If $\mathcal A$ did better than $\tfrac12+\varepsilon$ against the real scheme, the distinguisher $\mathcal D$ that receives a string $y$ (either $G(k)$ or random), chooses $b$, runs $\mathcal A$ on $m_b\oplus y$ and outputs $1$ iff $\mathcal A$ guesses $b$ would see $G(k)$ with probability $\tfrac12+\varepsilon$ and a random string with probability $\tfrac12$: $\mathcal D$ distinguishes with advantage $\varepsilon$. This is the first reduction proof of the book (3.6) and a two-step hybrid (3.8).`,
      caption: String.raw`The adversary $\mathcal A$ chooses $m_0=0^{256}$ and a fixed random $m_1$ and guesses the $m_i$ for which $c\oplus m_i$ looks *less* random under the chosen statistical test. Step through the proof: (1) the real experiment, (2) the hybrid with $G(k)$ replaced by a random string, (3) the hybrid is a one-time pad (win probability exactly $\tfrac12$), (4) the reduction $\mathcal D$ wins exactly when $\mathcal A$ does, so the PRG advantage is $\mathcal A$’s advantage. The bars come from 1500 games each. Choose a *bad* generator and see $\mathcal A$ win; choose the mixer and see nothing.`,
      deps: ['crypto-3.5', 'crypto-3.6', 'crypto-3.3'],
      tags: ['stream cipher', 'reductions'],
      refs: ['Katz–Lindell §3.3.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stream_cipher' },
      viz(v) {
        const sD = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, minWidth: 300, weight: 1.15 });
        const sB = v.stage({ x: [0.4, 3.6], y: [0.3, 1], axes: 'box', gutter: true, height: 270, minWidth: 260, weight: 0.9, ylabel: 'Pr[A wins]' });
        const gen = v.select('Generator $G$', GENS, 'biased');
        const test = v.select('A’s test', TESTS.slice(0, 3), 'freq');
        const lag = v.slider('lag $k$', 1, 40, 32, { step: 1, int: true });
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const S = v.steps({ frames: [{ n: 1, note: 'The real experiment: the pad is $G(k)$.' }, { n: 2, note: 'Hybrid: replace $G(k)$ by a uniformly random string $r$.' }, { n: 3, note: 'The hybrid is the one-time pad: $\\mathcal A$ wins with probability exactly $\\tfrac12$.' }, { n: 4, note: 'The reduction $\\mathcal D(y)$ runs $\\mathcal A$ on $m_b\\oplus y$ and outputs 1 iff $\\mathcal A$ is right: $\\mathcal D$ wins exactly when $\\mathcal A$ does.' }], still: 3 });
        const L = 256, NG = 1500;
        let key = '', res = null;
        v.render(() => {
          lag.el.hidden = test.value !== 'auto';
          const k2 = [gen.value, test.value, lag.value, seed].join();
          if (k2 !== key) {
            key = k2; const r = v.rng(seed * 4099 + 5), m0 = new Uint8Array(L), m1 = randomBitsFrom(v.rng(12345), L);
            const sc = (c, m) => { const x = new Uint8Array(L); for (let i = 0; i < L; i++) x[i] = c[i] ^ m[i]; return Math.abs(testZ(test.value, x, lag.value)); };
            const A = (c) => { const a = sc(c, m0), b = sc(c, m1); return a > b ? 0 : a < b ? 1 : (r() < 0.5 ? 0 : 1); };
            let wr = 0, wi = 0;
            for (let t = 0; t < NG; t++) {
              const b = r() < 0.5 ? 0 : 1, m = b ? m1 : m0, pad = genBits(gen.value, Math.floor(r() * 4294967296), L), rnd = randomBitsFrom(r, L);
              const c1 = new Uint8Array(L), c2 = new Uint8Array(L); for (let i = 0; i < L; i++) { c1[i] = m[i] ^ pad[i]; c2[i] = m[i] ^ rnd[i]; }
              if (A(c1) === b) wr++; if (A(c2) === b) wi++;
            }
            res = { pr: wr / NG, pi: wi / NG };
          }
          const f = S.frame.n, P = pix(sD), W = P.W;
          const bx = (x, y, w, h, t, col, on) => { P.rect(x, y, w, h, { fill: col, fillAlpha: on ? 0.2 : 0.06, color: col, width: on ? 2.4 : 1.2, radius: 9 }); t.split('\n').forEach((l, i, a) => P.text(l, x + w / 2, y + h / 2 + (i - (a.length - 1) / 2) * 15, { size: 12, weight: 700, color: on ? col : 'muted', halo: false })); };
          const pw = Math.min(W - 20, 520), x0 = (W - pw) / 2;
          bx(x0, 14, pw * 0.3, 52, 'seed k\n(n bits)', 'orange', f === 1);
          P.arrow(x0 + pw * 0.3, 40, x0 + pw * 0.4, 40, { color: 'ink', width: 1.8 });
          bx(x0 + pw * 0.4, 14, pw * 0.26, 52, f === 1 || f === 4 ? 'G' : f === 2 ? 'uniform r' : 'uniform r', f >= 2 ? 'purple' : 'teal', f !== 4);
          P.text(f === 1 ? 'real: pad = G(k)' : f === 4 ? 'y from D’s challenger' : 'ideal: pad = r', x0 + pw * 0.53, 80, { size: 11.5, color: 'muted', halo: false });
          P.arrow(x0 + pw * 0.66, 40, x0 + pw * 0.74, 40, { color: 'ink', width: 1.8 });
          bx(x0 + pw * 0.74, 14, pw * 0.26, 52, 'c = m_b ⊕ pad', 'accent', true);
          P.arrow(x0 + pw * 0.87, 66, x0 + pw * 0.87, 112, { color: 'ink', width: 1.8 });
          bx(x0 + pw * 0.62, 112, pw * 0.38, 54, 'adversary A\nguess b′', 'orange', true);
          P.text('A knows m₀ = 0…0 and m₁', x0 + pw * 0.28, 140, { size: 11.5, color: 'muted', halo: false });
          if (f === 4) P.rect(x0 - 6, 6, pw + 12, 170, { fill: false, color: 'green', width: 2, dash: true, radius: 12 }), P.text('reduction D (a PRG distinguisher)', x0 + 4, 186, { size: 12, color: 'green', weight: 700, align: 'left', halo: false });
          // bars
          if (f >= 1) { sB.rect(0.65, 0.3, 1.35, res.pr, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.2 }); sB.text(v.fix(res.pr, 3), 1, res.pr + 0.035, { size: 12, weight: 700, color: 'accent' }); }
          if (f >= 2) { sB.rect(1.65, 0.3, 2.35, res.pi, { fill: 'purple', fillAlpha: 0.5, color: 'purple', width: 1.2 }); sB.text(v.fix(res.pi, 3), 2, res.pi + 0.035, { size: 12, weight: 700, color: 'purple' }); }
          if (f >= 3) sB.hline(0.5, { color: 'green', width: 2, dash: true });
          if (f >= 4) { const mid = 3.2; sB.line(mid, 0.5, mid, res.pr, { color: 'green', width: 3 }); sB.text(`ε = ${v.fix(res.pr - 0.5, 3)}`, mid - 0.05, (0.5 + res.pr) / 2, { size: 12, weight: 700, color: 'green', align: 'right' }); }
          sB.setTicks([[1, 'real'], [2, 'hybrid'], [3.2, 'PRG gap']], null);
        });
        v.legend([['accent', 'real: $G(k)$'], ['purple', 'hybrid: random $r$'], ['green', 'one-time pad: $\\tfrac12$', { dash: true }]]);
        v.readout(() => `$\\Pr[\\mathcal A$ wins, real$]=${v.fix(res.pr, 3)}$, $\\Pr[\\mathcal A$ wins, random pad$]=${v.fix(res.pi, 3)}$ (each $\\pm${v.fix(ci95(res.pr, NG), 3)}$, ${NG} games). The reduction $\\mathcal D$ outputs $1$ exactly when $\\mathcal A$ wins, so its PRG advantage is $|${v.fix(res.pr, 3)}-${v.fix(res.pi, 3)}|=${v.fix(Math.abs(res.pr - res.pi), 3)}$, which is $\\mathcal A$’s whole advantage over the pad (the random-pad probability is $\\tfrac12$ up to sampling noise).`);
      },
    },

    // ================================================================== 3.8
    {
      num: '3.8',
      kind: 'Method',
      name: 'The hybrid argument',
      statement: String.raw`Let $H_0,H_1,\dots,H_\ell$ be distributions (“hybrids”) such that $H_0$ is the real experiment and $H_\ell$ the ideal one, and let $D$ be any distinguisher. Telescoping gives $$\bigl|\Pr[D(H_0)=1]-\Pr[D(H_\ell)=1]\bigr|\le\sum_{i=1}^{\ell}\bigl|\Pr[D(H_{i-1})=1]-\Pr[D(H_i)=1]\bigr|\le\ell\cdot\max_i\bigl|\Pr[D(H_{i-1})=1]-\Pr[D(H_i)=1]\bigr|.$$ If neighbouring hybrids differ only in one component that a *single-component* distinguisher can attack, with consistently oriented real/ideal challenge embeddings, then an efficient $D$ with advantage $\varepsilon$ yields, by guessing the index $i\in\{1,\dots,\ell\}$ at random, an efficient distinguisher for that component with advantage at least $\varepsilon/\ell$. For polynomial $\ell$, a non-negligible total gap forces a non-negligible gap in a single step.`,
      idea: String.raw`The signed gaps telescope: $\sum_i(\Pr[D(H_{i-1})=1]-\Pr[D(H_i)=1])=\Pr[D(H_0)=1]-\Pr[D(H_\ell)=1]$. If the challenge can be embedded efficiently at each position with a consistent real/ideal orientation, sampling a uniform index produces a distinguisher whose signed gap is exactly the total signed gap divided by $\ell$; taking its absolute value gives $\varepsilon/\ell$. Merely averaging absolute gaps would not justify that randomized reduction, since signed gaps can cancel. The triangle inequality also guarantees a large individual step. Goldwasser–Micali's Theorem 5.1 uses adjacent message words to reduce a whole-message gap to one encrypted bit.

The triangle inequality pma-1.33(e), applied repeatedly to the real signed neighboring acceptance gaps, gives the displayed sum-of-absolute-gaps bound after telescoping. The separate randomized-index reduction averages signed gaps before taking absolute value, so it additionally needs the consistent challenge orientation stated here. The triangle inequality guarantees a large step but does not by itself construct a uniformly efficient embedding for that step.`,
      caption: String.raw`Left: the staircase of hybrids; row $i$ has its first $i$ blocks ideal (green, uniform) and the others real (red, biased). The distinguisher $D$ outputs $1$ iff the total number of $1$ bits reaches the threshold $T$. Middle: exact $\Pr[D(H_i)=1]$ (convolution of the blocks). Right: each neighbour gap $|\Delta_i|$; their sum bounds the total drop. Click a row to highlight it. With one weak block only its replacement can change the probability; with many biased blocks the gaps can vary, while their maximum is at least the total divided by $\ell$.`,
      scope: String.raw`Independent Bernoulli bits: all-block bias is $\delta$; the one-block profile biases only the middle block by $\delta$; growing biases are $\delta(j+1)/\ell$. Thus every real success probability lies in $[1/2,0.95]$. Finite convolutions compute the plotted probabilities up to floating-point rounding. Here the threshold event is monotone, so all signed gaps have the same sign; the method also applies to general efficiently embeddable hybrids.`,
      deps: ['crypto-3.5', 'pma-1.33'],
      tags: ['hybrid argument', 'proof technique'],
      refs: ['Goldwasser–Micali (1984), Theorem 5.1, pp. 284–286', 'Boneh–Shoup v0.6, §3.2, Theorem 3.2, pp. 57–59 (hybrid proof)'],
      credit: 'Goldwasser & Micali, 1984',
      links: { 'Boneh–Shoup v0.6': 'https://crypto.stanford.edu/~dabo/cryptobook/BonehShoup_0_6.pdf' },
      viz(v) {
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, minWidth: 250, weight: 1 });
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, minWidth: 250, weight: 1, xlabel: 'hybrid i', ylabel: 'Pr[D(Hᵢ) = 1]' });
        const sG = v.stage({ x: [0, 1], y: [0, 0.5], axes: 'box', gutter: true, height: 360, minWidth: 250, weight: 1, xlabel: 'step i', ylabel: 'gap |Δᵢ|' });
        const lS = v.slider('blocks $\\ell$', 2, 24, 12, { step: 1, int: true });
        const dS = v.slider('bias $\\delta$ of a real block', 0, 0.45, 0.1, { step: 0.01 });
        const prof = v.select('Weak blocks', [{ value: 'all', label: 'all blocks' }, { value: 'one', label: 'one block' }, { value: 'ramp', label: 'growing' }], 'all');
        const tS = v.slider('threshold $T$ (D says 1 iff ones $\\ge T$)', 0, 24, 8, { step: 1, int: true });
        let sel = 6;
        sP.onClick((x) => { sel = clamp(Math.round(x), 0, lS.value); });
        let info = null;
        v.render(() => {
          const l = lS.value, d = dS.value;
          tS.input.max = String(l); if (tS.value > l) tS.set(l);
          const T = tS.value, dj = (j) => hybridBias(prof.value, d, j, l);
          const pv = hybridProbabilities(l, d, prof.value, T);
          const gaps = Array.from({ length: l }, (_, i) => Math.abs(pv[i] - pv[i + 1]));
          const tot = Math.abs(pv[0] - pv[l]), sum = gaps.reduce((a, b) => a + b, 0), mx = Math.max(...gaps);
          sel = clamp(sel, 0, l);
          // matrix
          const P = pix(sM), W = P.W, H = P.H, cw = Math.min(26, (W - 40) / l), ch = Math.min(22, (H - 56) / (l + 1)), x0 = (W - cw * l) / 2 + 12, y0 = 40;
          P.text('block j →', x0, 14, { size: 11.5, color: 'muted', align: 'left', halo: false });
          P.text('hybrid i ↓', 6, 28, { size: 11.5, color: 'muted', align: 'left', halo: false });
          for (let i = 0; i <= l; i++) {
            for (let j = 0; j < l; j++) {
              const ideal = j < i, col = ideal ? 'green' : (dj(j) > 1e-9 ? 'red' : 'orange');
              P.rect(x0 + j * cw + 1, y0 + i * ch + 1, cw - 2, ch - 2, { fill: col, fillAlpha: ideal ? 0.5 : dj(j) > 1e-9 ? 0.55 : 0.28, stroke: false, radius: 3 });
            }
            P.text(String(i), x0 - 8, y0 + i * ch + ch / 2, { size: 10.5, color: i === sel ? 'gold' : 'muted', weight: i === sel ? 800 : 500, align: 'right', halo: false });
          }
          P.rect(x0 - 2, y0 + sel * ch - 1, cw * l + 4, ch + 2, { fill: false, color: 'gold', width: 2.4, radius: 5 });
          // probabilities
          sP.setView([-0.5, l + 0.5], [0, Math.min(1, Math.max(0.05, ...pv) * 1.15)]);
          sP.path(pv.map((y, i) => [i, y]), { color: 'accent', width: 2.2 });
          sP.dots(pv.map((y, i) => [i, y]), { r: 4, color: 'accent' });
          sP.dot(sel, pv[sel], { r: 7, color: 'gold' });
          sP.hline(pv[l], { color: 'green', width: 1.4, dash: true }); sP.hline(pv[0], { color: 'red', width: 1.4, dash: true });
          // gaps
          sG.setView([0.3, l + 0.7], [0, Math.max(0.05, mx * 1.3)]);
          gaps.forEach((g, i) => sG.rect(i + 1 - 0.38, 0, i + 1 + 0.38, g, { fill: i + 1 === sel || i === sel ? 'gold' : 'orange', fillAlpha: 0.55, color: 'orange', width: 1 }));
          sG.hline(tot / l, { color: 'green', width: 1.6, dash: true });
          info = { tot, sum, mx, l, T, pv, gaps };
        });
        v.legend([['red', 'real block (biased)'], ['orange', 'real block (unbiased)'], ['green', 'ideal block'], ['green', 'average gap $\\mathrm{total}/\\ell$', { dash: true }]]);
        v.readout(() => `Total gap $|\\Pr[D(H_0)=1]-\\Pr[D(H_\\ell)=1]|=${v.fix(info.tot, 4)}$ $\\le$ $\\sum_i|\\Delta_i|=${v.fix(info.sum, 4)}$ $\\le$ $\\ell\\max_i|\\Delta_i|=${v.fix(info.l * info.mx, 4)}$. The best single step has gap $${v.fix(info.mx, 4)}$ $\\ge$ total$/\\ell=${v.fix(info.tot / info.l, 4)}$: guessing the index $i$ loses at most the factor $\\ell=${info.l}$.`);
      },
    },
  ],
};
