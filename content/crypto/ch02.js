// Cryptography — Chapter 2: Perfect secrecy
import {
  A, mod, clamp, norm, code, vigC, randomKey, GETTYSBURG, H2, LOG2_FACT26, LOG2_26, equivocation, pix, letterRow,
  ent, normalize, bits, textBitmap, smileyBitmap, paintBits, xorBits, randBits,
} from './ch02.shared.js';

const PASSAGE = norm(GETTYSBURG);
const hsl = (h, s, l) => { // h in degrees, s, l in 0..1 → css
  return `hsl(${h.toFixed(0)} ${(100 * s).toFixed(0)}% ${(100 * l).toFixed(0)}%)`;
};

// ---------------------------------------------------------------- 2.1 shared: a cipher on Z_4 with a chosen key distribution
const MSG4 = ['ATTACK', 'RETREAT', 'HOLD', 'WAIT'];
function keyDist4(kind, b) {
  if (kind === 'all') return [b, (1 - b) / 3, (1 - b) / 3, (1 - b) / 3];
  if (kind === 'three') return [b, (1 - b) / 2, (1 - b) / 2, 0];
  return [1, 0, 0, 0];
}
/** cond[m][c] = Pr[Enc_K(m) = c] for Enc_k(m) = m + k mod 4. */
function cond4(pk) {
  const T = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  for (let m = 0; m < 4; m++) for (let k = 0; k < 4; k++) T[m][(m + k) % 4] += pk[k];
  return T;
}

export default {
  collection: 'crypto',
  chapter: 2,
  title: 'Perfect secrecy',
  summary: String.raw`Shannon defined secrecy precisely: the ciphertext must reveal nothing about the message, whatever the prior. The one-time pad achieves this, but at a steep price that Shannon showed is unavoidable — the key must be as long as the message and can never be reused. The chapter quantifies the cost with entropy and shows what goes wrong when the rules are broken.`,
  items: [
    // ================================================================== 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Perfect secrecy',
      statement: String.raw`An encryption scheme $(\mathsf{Gen},\mathsf{Enc},\mathsf{Dec})$ with message space $\mathcal M$ is **perfectly secret** if, for every probability distribution on $\mathcal M$, every message $m\in\mathcal M$ and every ciphertext $c$ with $\Pr[C=c]>0$, $$\Pr[M=m\mid C=c]=\Pr[M=m].$$ Here the key $K$ is drawn by $\mathsf{Gen}$ independently of $M$, and $C=\mathsf{Enc}_K(M)$. Equivalently, the distribution of $C$ does not depend on which message was encrypted: $\Pr[\mathsf{Enc}_K(m)=c]=\Pr[\mathsf{Enc}_K(m')=c]$ for all $m,m',c$. The adversary is unbounded in computing power; the definition is information-theoretic.`,
      idea: String.raw`Seeing $c$ is a piece of evidence, and Bayes’ rule updates the prior on $M$ by the likelihood $\Pr[C=c\mid M=m]$. The posterior equals the prior exactly when that likelihood is the same for every $m$, which is the second formulation, and which does not mention the prior at all — so perfect secrecy holds for *all* priors or for none. A scheme leaks as soon as some message makes some ciphertext more likely than another message does.

Apply the conditional-density ratio in stat-2.1 with counting measure on the finite message and ciphertext spaces. For a positive-probability ciphertext c, the posterior mass at m is the prior mass times its ciphertext likelihood, divided by the marginal mass at c. If all message likelihoods agree, this ratio is the prior for every prior law. Conversely, a uniform full-support prior makes posterior-equals-prior force all those likelihoods to agree. Conditioning on an impossible ciphertext is excluded.`,
      caption: String.raw`Drag the four bars of the prior (the message distribution Eve believes in) and pick a cipher on $\mathbb Z_4$: $c=m+k \bmod 4$. Each group on the right is one ciphertext; blue bars are the posterior, the gold ticks the prior. For the uniform key the two always agree; restrict the key space or bias the key and watch the posteriors move away from the ticks.`,
      deps: ['crypto-1.1', 'stat-2.1'],
      tags: ['perfect secrecy', 'bayes'],
      refs: ['Katz–Lindell §2.1', 'Boneh–Shoup ch. 2'],
      credit: 'Claude Shannon, 1949',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information-theoretic_security' },
      viz(v) {
        const pr = v.stage({ x: [0.35, 4.65], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 250, weight: 0.8, title: 'Prior $\\Pr[M=m]$: drag the bar tops', xticks: MSG4.map((n, i) => [i + 1, n]) });
        const po = v.stage({ x: [0, 21], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 300, weight: 1.35, title: 'Posterior $\\Pr[M=m\\mid C=c]$ for each ciphertext $c$ (grey: $\\Pr[C=c]$)', xticks: [0, 1, 2, 3].map((c) => [5 * c + 2.5, `c = ${c}`]), yticks: [0, 0.25, 0.5, 0.75, 1].map((y) => [y, String(y)]) });
        const kind = v.select('Cipher', [{ value: 'all', label: 'Shift, 4 keys' }, { value: 'three', label: 'Shift, keys 0–2 only' }, { value: 'one', label: 'No key' }], 'all');
        const bias = v.slider('$\\Pr[k=0]$', 0, 1, 0.25, { step: 0.01 });
        let w = [0.4, 0.3, 0.2, 0.1];
        const H = MSG4.map((_, i) => {
          const h = pr.handle(i + 1, w[i], { color: 'gold', r: 7, constrain: { x: [i + 1, i + 1], y: [0.02, 1] } });
          h.onDrag = () => { w[i] = Math.max(0.02, h.y); };
          return h;
        });
        let last = null;
        v.render(() => {
          const p = normalize(w);
          H.forEach((h, i) => h.set(i + 1, p[i]));
          pr.bars(p, { x0: 1, dx: 1, color: 'gold', fillAlpha: 0.3, barWidth: 0.6 });
          kind.value === 'one' ? (bias.el.hidden = true) : (bias.el.hidden = false);
          const pk = keyDist4(kind.value, kind.value === 'one' ? 1 : bias.value);
          const T = cond4(pk), res = [];
          for (let c = 0; c < 4; c++) {
            const Pc = p.reduce((s, pm, m) => s + pm * T[m][c], 0);
            const post = Pc > 1e-12 ? p.map((pm, m) => pm * T[m][c] / Pc) : null;
            res.push({ Pc, post });
            const x0 = 5 * c + 1;
            if (post) {
              po.bars(post, { x0, dx: 1, color: (x, i) => (Math.abs(post[i] - p[i]) < 1e-9 ? 'green' : 'accent'), fillAlpha: 0.45, barWidth: 0.7 });
              post.forEach((q, i) => po.line(x0 + i - 0.42, p[i], x0 + i + 0.42, p[i], { color: 'gold', width: 3 }));
            } else po.text('never occurs', x0 + 1.5, 0.5, { size: 12, color: 'muted' });
            MSG4.forEach((n, i) => po.text(n[0], x0 + i, 0.96, { size: 11, color: 'muted', weight: 700 }));
            po.text(v.fix(Pc, 2), x0 + 1.5, 0.88, { size: 10.5, color: 'muted' });
          }
          last = { p, T, res, pk };
        });
        v.legend([['accent', 'posterior differs from the prior'], ['green', 'posterior = prior'], ['gold', 'prior', { dot: true }]]);
        v.readout(() => {
          const { p, T, res } = last;
          let dev = 0; res.forEach(({ post }) => { if (post) post.forEach((q, i) => { dev = Math.max(dev, Math.abs(q - p[i])); }); });
          let spread = 0; for (let c = 0; c < 4; c++) { const col = T.map((r) => r[c]); spread = Math.max(spread, Math.max(...col) - Math.min(...col)); }
          const same = dev < 1e-9, all = spread < 1e-9;
          return String.raw`Largest change of any posterior from the prior: $\max|\Pr[m\mid c]-\Pr[m]| = ${v.fix(dev, 3)}$ — ${same ? '**no change for this prior**' : '**Eve learns something**'}.` + '\n' +
            String.raw`Likelihood test for *every* prior: $\Pr[\mathsf{Enc}_K(m)=c]$ varies across $m$ by at most $${v.fix(spread, 3)}$ — ${all ? '**perfectly secret**' : '**not perfectly secret** (some other prior would expose it)'}.`;
        });
      },
    },

    // ================================================================== 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Perfect indistinguishability is equivalent',
      statement: String.raw`For an encryption scheme $\Pi$ with message space $\mathcal M$, the following are equivalent. (i) $\Pi$ is perfectly secret. (ii) For every adversary $\mathcal A$ — an arbitrary, unbounded procedure that picks two messages $m_0,m_1$, receives $c=\mathsf{Enc}_K(m_b)$ for a uniformly random bit $b$ and a fresh key $K$, and outputs a guess $b'$ — we have $\Pr[b'=b]=\tfrac12$. For a scheme that is not perfectly secret, the best adversary wins with probability $\tfrac12+\tfrac12\,\Delta(C_{m_0},C_{m_1})$, where $\Delta$ is the statistical distance of the two ciphertext distributions.`,
      idea: String.raw`The game success is $\tfrac12\Pr[\mathcal A(C_{m_0})=0]+\tfrac12\Pr[\mathcal A(C_{m_1})=1]=\tfrac12+\tfrac12\bigl(\Pr[\mathcal A(C_{m_1})=1]-\Pr[\mathcal A(C_{m_0})=1]\bigr)$, so it is $\tfrac12$ for every $\mathcal A$ exactly when every test accepts both ciphertext distributions equally often, i.e. when the distributions coincide (the second form of 2.1). Conversely if $\Pr[C_{m_0}=c]\neq\Pr[C_{m_1}=c]$ for some $c$, the adversary that guesses the likelier message for each $c$ wins more than half the time.

For a fixed test, its win indicator is the sum of the disjoint indicators for b=0 with output0 and b=1 with output1. Linearity prob-1.6.1 and the fair challenge bit give the two half-weighted terms in the proof. Subtracting one half leaves half the signed acceptance-probability gap. The optimal test then selects ciphertexts with the appropriate likelihood surplus; linearity itself does not assume the test and ciphertext are independent.`,
      caption: String.raw`Choose the two messages Eve submits and the key distribution (each key bit is 1 with probability $p$; $p=\tfrac12$ is the one-time pad). The right panel shows the two ciphertext distributions; Eve’s best rule guesses $m_0$ where the blue bar is taller. The left panel plays 2000 games and shows the running success rate against the exact value $\tfrac12+\tfrac12\Delta$ and the $\pm3\sigma$ band of a coin flip. Press *Resample* for new games.`,
      deps: ['crypto-2.1', 'prob-1.6.1'],
      tags: ['indistinguishability', 'security game'],
      refs: ['Katz–Lindell §2.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ciphertext_indistinguishability' },
      viz(v) {
        const NG = 2000;
        const sL = v.stage({ x: [0, NG], y: [0.3, 1], axes: 'box', gutter: true, height: 320, minWidth: 320, xlabel: 'games played', ylabel: 'fraction of games Eve wins' });
        const sR = v.stage({ x: [0, 9], y: [0, 1], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'ciphertext c', ylabel: 'Pr[ c | m ]', title: 'Ciphertext distributions' });
        const opts = Array.from({ length: 8 }, (_, i) => ({ value: i, label: bits(i, 3) }));
        const m0 = v.select('$m_0$', opts, 0), m1 = v.select('$m_1$', opts, 5);
        const sch = v.select('Key', [{ value: 'iid', label: 'bits i.i.d., $\\Pr[1]=p$' }, { value: 'fixed', label: 'first bit always 0' }], 'iid');
        const pS = v.slider('$p$', 0.5, 1, 0.5, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed += 1; });
        const dist = () => {
          if (sch.value === 'fixed') return Array.from({ length: 8 }, (_, k) => (k < 4 ? 0.25 : 0));
          const p = pS.value; return Array.from({ length: 8 }, (_, k) => { let q = 1; for (let i = 0; i < 3; i++) q *= (k >> i) & 1 ? p : 1 - p; return q; });
        };
        let info = null;
        v.render(() => {
          pS.el.hidden = sch.value !== 'iid';
          const pk = dist(), a = m0.value, b = m1.value;
          const p0 = Array.from({ length: 8 }, (_, c) => pk[c ^ a]), p1 = Array.from({ length: 8 }, (_, c) => pk[c ^ b]);
          const delta = 0.5 * p0.reduce((s, x, c) => s + Math.abs(x - p1[c]), 0), exact = 0.5 + 0.5 * delta;
          // simulate
          const r = v.rng(seed * 7919 + a * 31 + b), cum = []; pk.reduce((s, x, i) => (cum[i] = s + x), 0);
          const run = [[0, 0.5]]; let win = 0;
          for (let t = 1; t <= NG; t++) {
            const bit = r() < 0.5 ? 0 : 1, u = r(); let k = 0; while (k < 7 && u > cum[k]) k++;
            const c = (bit ? b : a) ^ k;
            let g; if (p0[c] > p1[c]) g = 0; else if (p0[c] < p1[c]) g = 1; else g = r() < 0.5 ? 0 : 1;
            if (g === bit) win++;
            if (t % 10 === 0 || t < 10) run.push([t, win / t]);
          }
          // left panel
          sL.path(Array.from({ length: 400 }, (_, i) => { const n = 1 + i * 5; return [n, 0.5 + 1.5 / Math.sqrt(n)]; }).map(([x, y]) => [x, Math.min(y, 1)]), { color: 'faint', width: 1.4, dash: true });
          sL.path(Array.from({ length: 400 }, (_, i) => { const n = 1 + i * 5; return [n, 0.5 - 1.5 / Math.sqrt(n)]; }), { color: 'faint', width: 1.4, dash: true });
          sL.hline(0.5, { color: 'muted', width: 1 });
          sL.hline(exact, { color: 'green', width: 2, dash: true });
          sL.path(run, { color: 'accent', width: 2.2 });
          sL.text(`exact ${v.fix(exact, 3)}`, NG * 0.98, Math.min(0.97, exact + 0.035), { size: 11.5, color: 'green', align: 'right', weight: 700 });
          sL.text('coin-flip band ±3σ', NG * 0.98, 0.5 + 1.5 / Math.sqrt(NG) + 0.03, { size: 11, color: 'muted', align: 'right' });
          // right panel
          const top = Math.max(0.15, ...p0, ...p1) * 1.2; sR.setView([0, 9], [0, top]);
          for (let c = 0; c < 8; c++) {
            sR.vband(c + 0.5 + 0.05, c + 1.5 - 0.05, { color: p0[c] >= p1[c] ? 'blue' : 'orange', alpha: 0.07 });
            sR.rect(c + 0.6, 0, c + 0.98, p0[c], { fill: 'blue', fillAlpha: 0.55, color: 'blue', width: 1 });
            sR.rect(c + 1.02, 0, c + 1.4, p1[c], { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
          }
          sR.setTicks(Array.from({ length: 8 }, (_, c) => [c + 1, bits(c, 3)]), null);
          info = { win, exact, delta, same: a === b };
        });
        v.legend([['blue', '$m_0$'], ['orange', '$m_1$'], ['green', 'exact success $\\tfrac12+\\tfrac12\\Delta$', { dash: true }]]);
        v.readout(() => `Statistical distance $\\Delta(C_{m_0},C_{m_1}) = ${v.fix(info.delta, 3)}$, so the best adversary wins with probability $\\tfrac12+\\tfrac12\\Delta = ${v.fix(info.exact, 3)}$; in ${NG} simulated games Eve won $${info.win}$ (${v.fix(info.win / NG, 3)}).` + (info.same ? '\n$m_0=m_1$: nothing to distinguish.' : info.delta < 1e-9 ? '\nThe two distributions coincide: no adversary can beat a coin flip, however much computing power it has.' : '\nThe distributions differ, so Eve’s likelihood rule beats the coin.'));
      },
    },

    // ================================================================== 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'The one-time pad is perfectly secret',
      statement: String.raw`Let $\ell\ge1$ and let $\mathsf{Gen}$ output a uniformly random key $k\in\{0,1\}^\ell$, $\mathsf{Enc}_k(m)=m\oplus k$ and $\mathsf{Dec}_k(c)=c\oplus k$ on messages $m\in\{0,1\}^\ell$. Then the scheme is correct and perfectly secret: for every $m$ and $c$, $\Pr[\mathsf{Enc}_K(m)=c]=2^{-\ell}$. The same holds for $\mathbb Z_{26}^\ell$ with letter-wise addition mod $26$ (the Vernam–Vigenère pad). The key must be used for **one** message only, and every message has the length $\ell$ of the key.`,
      idea: String.raw`Fix $m$ and $c$. The equation $m\oplus k=c$ has exactly one solution $k=m\oplus c$, since XOR with $m$ is a bijection of $\{0,1\}^\ell$. A uniform key hits that solution with probability $2^{-\ell}$, independent of $m$, so all messages give the same ciphertext distribution, which is the likelihood form of 2.1 and (via 2.2) the indistinguishability form.

For fixed m the map k↦$m\oplus k$ is its own inverse, so alg-1.20 makes it a bijection of the finite bit-string space. Every target ciphertext therefore has exactly one key preimage. A uniform key gives that preimage the same mass $2^{-\ell}$ for every m and c. The bijection is the reason for the uniform ciphertext law; an arbitrary deterministic map of a uniform key need not preserve uniformity.`,
      caption: String.raw`Pick a ciphertext $c$ and click the message you wish had been sent: there is **always** a key that turns $c$ into it, and exactly one. Every cell of the table (or every row, in the 3-bit view) is one message, coloured by its unique key. Restricting the key space makes cells go grey: those messages could no longer have produced $c$.`,
      deps: ['crypto-2.1', 'alg-1.20'],
      tags: ['one-time pad', 'xor'],
      refs: ['Katz–Lindell §2.2'],
      credit: 'G. Vernam, 1917–1919 (cipher invented 1917; patent filed 1918); Shannon 1949 (proof)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/One-time_pad' },
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 470, minWidth: 320 });
        const mode = v.select('Messages', [{ value: 'bits', label: '3 bits (8 messages)' }, { value: 'let', label: '2 letters (676)' }], 'let');
        const cIn = v.input('Ciphertext (2 letters)', 'QX', { width: 90 });
        const cBits = v.select('Ciphertext $c$', Array.from({ length: 8 }, (_, i) => ({ value: i, label: bits(i, 3) })), 5);
        const restrict = v.toggle('Restrict the key space to half', false);
        let sel = { a: 7, b: 8, bit: 2 };
        v.button('Random $c$', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); cIn.set(A[Math.floor(r() * 26)] + A[Math.floor(r() * 26)]); cBits.set(Math.floor(r() * 8)); });
        let geo = null, info = null;
        v.render(() => {
          const P = pix(s), { W, H } = P, bm = mode.value === 'bits';
          cIn.el.hidden = bm; cBits.el.hidden = !bm;
          const R = restrict.value;
          if (bm) {
            const c = cBits.value, rowH = Math.min(38, (H - 70) / 8), x0 = clamp((W - 360) / 2, 8, 80);
            P.text('message m', x0 + 40, 22, { size: 12, weight: 700, color: 'accent', halo: false });
            P.text('unique key k = m ⊕ c', x0 + 182, 22, { size: 12, weight: 700, color: 'gold', halo: false });
            P.text(`ciphertext c = ${bits(c, 3)}`, x0 + 318, 22, { size: 12, weight: 700, color: 'muted', halo: false });
            let ok = 0;
            for (let m = 0; m < 8; m++) {
              const k = m ^ c, y = 40 + m * rowH + rowH / 2, allowed = !R || k < 4, on = m === sel.bit;
              if (allowed) ok++;
              P.rect(x0 - 6, y - rowH / 2 + 2, 452, rowH - 4, { fill: on ? 'accent' : 'panel', fillAlpha: on ? 0.16 : 0.0, color: on ? 'accent' : 'faint', width: on ? 2 : 1, radius: 6 });
              P.text(bits(m, 3), x0 + 40, y, { size: 15, weight: 700, color: allowed ? 'accent' : 'faint', halo: false });
              P.text('⊕', x0 + 108, y, { size: 15, color: 'muted', halo: false });
              P.text(allowed ? bits(k, 3) : 'no such key', x0 + 182, y, { size: allowed ? 15 : 12, weight: 700, color: allowed ? 'gold' : 'faint', halo: false });
              P.text('=', x0 + 250, y, { size: 15, color: 'muted', halo: false });
              P.text(bits(c, 3), x0 + 318, y, { size: 15, weight: 700, color: 'ink', halo: false });
              P.text(allowed ? `Pr = 1/${R ? 4 : 8}` : 'Pr = 0', x0 + 366, y, { size: 11, color: 'muted', align: 'left', halo: false });
            }
            geo = { bits: true, x0, rowH };
            info = { nMsg: 8, nKeyed: ok, per: R ? 4 : 8, text: `ciphertext $c=${bits(c, 3)}$; the selected message $m=${bits(sel.bit, 3)}$ needs key $k=${bits(sel.bit ^ c, 3)}$` };
          } else {
            const cs = Math.max(8, Math.min((W - 90) / 26, (H - 56) / 26)), gx = 32, gy = 32;
            const cc = norm(cIn.value).padEnd(2, 'A').slice(0, 2), c1 = code(cc[0]), c2 = code(cc[1]);
            let ok = 0; const seen = new Set();
            const ctx = s.ctx; ctx.save();
            for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) {
              const k1 = mod(c1 - a, 26), k2 = mod(c2 - b, 26), allowed = !R || k1 < 13;
              if (allowed) { ok++; seen.add(k1 * 26 + k2); }
              ctx.fillStyle = allowed ? hsl(k1 / 26 * 320, 0.62, 0.3 + 0.38 * k2 / 25) : v.color('faint', 0.25);
              ctx.fillRect(gx + b * cs, gy + a * cs, cs - 0.6, cs - 0.6);
            }
            ctx.restore();
            for (let i = 0; i < 26; i++) {
              P.text(A[i], gx + i * cs + cs / 2, gy - 9, { size: Math.min(10, cs - 1), color: 'muted', halo: false });
              P.text(A[i], gx - 10, gy + i * cs + cs / 2, { size: Math.min(10, cs - 1), color: 'muted', halo: false });
            }
            P.text('2nd letter of m →', gx + 13 * cs, 11, { size: 11, color: 'muted', halo: false });
            const mx = gx + sel.b * cs, my = gy + sel.a * cs;
            P.rect(mx - 1.5, my - 1.5, cs + 2.4, cs + 2.4, { color: 'ink', width: 2.5, fill: false, radius: 2 });
            const k1 = mod(c1 - sel.a, 26), k2 = mod(c2 - sel.b, 26), sx = gx + 26 * cs + 14;
            if (W - sx > 70) {
              P.text('message', sx, gy + 8, { size: 11, color: 'muted', align: 'left', halo: false });
              P.text(A[sel.a] + A[sel.b], sx, gy + 28, { size: 20, weight: 700, color: 'accent', align: 'left', halo: false });
              P.text('+ key', sx, gy + 54, { size: 11, color: 'muted', align: 'left', halo: false });
              P.text(!R || k1 < 13 ? A[k1] + A[k2] : '—', sx, gy + 74, { size: 20, weight: 700, color: 'gold', align: 'left', halo: false });
              P.text('= ciphertext', sx, gy + 100, { size: 11, color: 'muted', align: 'left', halo: false });
              P.text(cc, sx, gy + 120, { size: 20, weight: 700, color: 'ink', align: 'left', halo: false });
            }
            geo = { bits: false, gx, gy, cs };
            info = { nMsg: 676, nKeyed: ok, per: R ? 338 : 676, distinct: seen.size, text: `ciphertext $c=\\mathrm{${cc}}$; the selected message $\\mathrm{${A[sel.a]}${A[sel.b]}}$ needs key $\\mathrm{${!R || k1 < 13 ? A[k1] + A[k2] : '—'}}$` };
          }
        });
        s.onClick((x, y) => {
          const px = s.X(x), py = s.Y(y);
          if (!geo) return;
          if (geo.bits) { const m = Math.floor((py - 40) / geo.rowH); if (m >= 0 && m < 8) sel.bit = m; }
          else { const b = Math.floor((px - geo.gx) / geo.cs), a = Math.floor((py - geo.gy) / geo.cs); if (a >= 0 && a < 26 && b >= 0 && b < 26) { sel.a = a; sel.b = b; } }
        });
        v.readout(() => `${info.text}.\n` + (info.distinct != null
          ? `Of the ${info.nMsg} messages, **${info.nKeyed}** have a key mapping them to $c$, and those keys are **${info.distinct} distinct** keys — one each; each key has probability $1/${info.per}$, so $\\Pr[\\mathsf{Enc}_K(m)=c]=1/${info.per}$ for every one of them. ${restrict.value ? 'With half the keys gone, half of the messages are now **impossible**: the posterior is no longer the prior.' : 'Every message is explained, equally likely.'}`
          : `All ${info.nKeyed} of ${info.nMsg} messages have a key mapping them to $c$, each with probability $1/${info.per}$. ${restrict.value ? 'With half the keys gone, half of the messages are **impossible**.' : 'Nothing distinguishes them.'}`));
      },
    },

    // ================================================================== 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Perfect secrecy requires as many keys as messages',
      statement: String.raw`If an encryption scheme with message space $\mathcal M$ and key space $\mathcal K$ is perfectly secret, then $|\mathcal K|\ge|\mathcal M|$. More precisely, if $|\mathcal K|<|\mathcal M|$ then for every ciphertext $c$ that can occur there is a message $m$ with $\Pr[M=m\mid C=c]=0$ even though $\Pr[M=m]>0$ (for the uniform prior on $\mathcal M$).`,
      idea: String.raw`Fix any ciphertext $c$ that occurs. Decrypting it under each key gives the set $\{\mathsf{Dec}_k(c):k\in\mathcal K\}$, which has at most $|\mathcal K|$ elements. If $|\mathcal K|<|\mathcal M|$ some message $m$ is missing from that set, so no key sends $m$ to $c$; but with the uniform prior $m$ had probability $1/|\mathcal M|>0$, and its posterior is $0$. Correctness (decryption is a function of $k$ and $c$) is what limits the set.

The pigeonhole argument comb-1.2 applies to the attempted assignment of all messages to the keys that decrypt a fixed occurring ciphertext. Each key can supply at most one message because decryption is a function. If there are fewer keys than messages, some message cannot be assigned any key. Its positive uniform-prior mass becomes zero after that ciphertext, contradicting perfect secrecy. The reasoning counts possible preimages, not an attacker’s computational effort.`,
      caption: String.raw`Choose the number of keys and a ciphertext $c$. Each key sends $c$ back to exactly one message, drawn as a line from the key to the message; messages that no line reaches (red) are ruled out. As soon as $|\mathcal K|<8$ at least one message is impossible. Switch the cipher to random permutations — it makes no difference.`,
      deps: ['crypto-2.3', 'comb-1.2'],
      tags: ['key length', 'counting'],
      refs: ['Katz–Lindell §2.3'],
      credit: 'Claude Shannon, 1949',
      viz(v) {
        const M = 8;
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 320, weight: 1.15, title: 'Decrypting the same $c$ under every key' });
        const sB = v.stage({ x: [0, M + 1], y: [0, 1], axes: 'box', gutter: true, height: 330, minWidth: 280, xlabel: 'message m', ylabel: 'probability', title: 'Posterior (uniform prior)' });
        const nk = v.slider('Number of keys $|\\mathcal K|$', 1, 8, 4, { int: true });
        const cS = v.slider('Ciphertext $c$', 0, 7, 3, { int: true });
        const cipher = v.select('Cipher', [{ value: 'shift', label: 'Shift mod 8' }, { value: 'perm', label: 'Random permutations' }], 'shift');
        let seed = 1; v.button('New permutations', () => { seed++; });
        let info = null;
        const perms = () => { const r = v.rng(seed * 101 + 3); return Array.from({ length: 8 }, () => { const a = [...Array(8).keys()]; for (let i = 7; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }); };
        v.render(() => {
          const K = nk.value, c = cS.value, P = pix(sA), { W, H } = P;
          const pm = cipher.value === 'perm' ? perms() : null;
          const dec = (k) => (pm ? pm[k].indexOf(c) : mod(c - k, M));
          const xs = (i) => 28 + (i + 0.5) * (W - 56) / 8, yK = 62, yM = H - 56;
          P.text('keys', 6, yK - 26, { size: 11, color: 'gold', weight: 700, align: 'left', halo: false });
          P.text('messages', 6, yM + 30, { size: 11, color: 'accent', weight: 700, align: 'left', halo: false });
          const hit = new Array(M).fill(0);
          for (let k = 0; k < 8; k++) {
            const used = k < K;
            P.dot(xs(k), yK, { r: 9, color: used ? 'gold' : 'faint', hollow: !used });
            P.text(String(k), xs(k), yK - 16, { size: 11, color: used ? 'ink' : 'faint', halo: false });
            if (used) { const m = dec(k); hit[m]++; P.arrow(xs(k), yK + 11, xs(m), yM - 12, { color: 'gold', width: 1.6, head: 7, alpha: 0.9 }); }
          }
          for (let m = 0; m < M; m++) {
            const imp = hit[m] === 0;
            P.rect(xs(m) - 15, yM - 11, 30, 24, { fill: imp ? 'red' : 'green', fillAlpha: 0.16, color: imp ? 'red' : 'green', width: 1.6, radius: 6 });
            P.text(String(m), xs(m), yM + 1, { size: 14, weight: 700, color: imp ? 'red' : 'green', halo: false });
          }
          // posterior: P(m|c) = Pr[k : Dec_k(c)=m] / K  (uniform prior and uniform key; Dec_k(c)=m means Enc_k(m)=c)
          const post = hit.map((h) => h / K);
          sB.bars(post, { x0: 1, dx: 1, color: (x, i) => (post[i] === 0 ? 'red' : 'green'), fillAlpha: 0.5, barWidth: 0.65 });
          sB.setView([0, M + 1], [0, Math.max(0.5, ...post) * 1.15]);
          sB.hline(1 / M, { color: 'gold', width: 2, dash: true });
          sB.text('prior 1/8', M + 0.9, 1 / M + 0.03 * Math.max(0.5, ...post), { size: 11, color: 'gold', align: 'right', weight: 700 });
          sB.setTicks(Array.from({ length: M }, (_, i) => [i + 1, String(i)]), null);
          info = { K, c, hit, impossible: hit.filter((h) => h === 0).length, post };
        });
        v.readout(() => `$|\\mathcal K| = ${info.K}$ keys can reach at most ${info.K} distinct messages from $c=${info.c}$ (here ${info.hit.filter((h) => h > 0).length}), so **${info.impossible}** of the 8 messages have posterior $0\\neq\\tfrac18$.` + (info.impossible ? ' The scheme is not perfectly secret.' : ' With $|\\mathcal K| = |\\mathcal M|$ and a Latin structure every message is still possible: perfect secrecy needs at least this many keys.'));
      },
    },

    // ================================================================== 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Shannon’s characterization of perfect secrecy',
      statement: String.raw`Let $\Pi$ be an encryption scheme with $|\mathcal M|=|\mathcal K|=|\mathcal C|$. Then $\Pi$ is perfectly secret if and only if (a) every key $k\in\mathcal K$ is chosen with probability $1/|\mathcal K|$ by $\mathsf{Gen}$, and (b) for every $m\in\mathcal M$ and $c\in\mathcal C$ there is exactly one key $k$ with $\mathsf{Enc}_k(m)=c$. In table form: the matrix $T_{k,m}=\mathsf{Enc}_k(m)$ (rows keys, columns messages) is a Latin square — every ciphertext occurs exactly once in each row (correctness) and once in each column (b) — and the keys are uniform.`,
      idea: String.raw`If (a) and (b) hold then $\Pr[\mathsf{Enc}_K(m)=c]=\Pr[K=k_{m,c}]=1/|\mathcal K|$ for every $m,c$, which is perfect secrecy. Conversely, perfect secrecy forces $\Pr[\mathsf{Enc}_K(m)=c]$ to be the same for all $m$; since 2.4’s counting argument shows every $c$ must be reachable from every $m$, and the three sets have equal size, each $(m,c)$ is reached by exactly one key, and then the common probability $1/|\mathcal K|$ must be that key’s probability.

The equality case of the counting argument uses comb-1.2: a fixed occurring ciphertext must decrypt, across the N keys, to all N messages. No message can be omitted or repeated, since then N key positions could not cover N distinct messages. Thus each message/ciphertext pair has exactly one key. Correctness also makes each fixed-key message row injective, hence bijective between two N-element sets. Perfect secrecy equates the resulting key masses, forcing the uniform law.`,
      caption: String.raw`Left: the encryption table, one row per key and one column per message, each entry a ciphertext (colour = symbol). Click a cell to change its entry. Right: the resulting ciphertext distribution $\Pr[C=c\mid M=m]$ for each message; perfect secrecy means its rows are identical. Break the Latin property (a repeated symbol in a column) or bias the keys, and the rows separate.`,
      deps: ['crypto-2.4', 'comb-1.2'],
      tags: ['latin square', 'characterization'],
      refs: ['Katz–Lindell §2.4'],
      credit: 'Claude Shannon, 1949',
      viz(v) {
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 280, weight: 1, title: 'Encryption table $\\mathsf{Enc}_k(m)$' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 280, weight: 1, title: 'Ciphertext law $\\Pr[C=c\\mid M=m]$' });
        const nSel = v.select('Size $n$', [3, 4, 5].map((n) => ({ value: n, label: String(n) })), 4);
        const bias = v.slider('$\\Pr[k=0]$ (others equal)', 0, 1, 0.25, { step: 0.01 });
        const COL = ['blue', 'orange', 'green', 'purple', 'pink'];
        let tab = null;
        const cyclic = (n) => Array.from({ length: n }, (_, k) => Array.from({ length: n }, (_, m) => (k + m) % n));
        const reset = () => { tab = cyclic(nSel.value); bias.set(1 / nSel.value); };
        reset();
        let lastN = nSel.value;
        const sync = () => { if (lastN !== nSel.value) { lastN = nSel.value; reset(); } };
        v.button('Cyclic table', () => { reset(); });
        v.button('Random Latin square', () => {
          const n = nSel.value, r = v.rng(Math.floor(Math.random() * 1e6)), rp = (m) => { const a = [...Array(m).keys()]; for (let i = m - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
          const pr = rp(n), pc = rp(n), ps = rp(n); tab = Array.from({ length: n }, (_, k) => Array.from({ length: n }, (_, m) => ps[(pr[k] + pc[m]) % n])); bias.set(1 / n);
        });
        const Tt = v.table(sT, { rows: 4, cols: 4, square: true, maxCell: 60, size: 18, rowLabels: (k) => `k=${k}`, colLabels: (m) => `m=${m}`, cornerLabel: '' });
        const Tr = v.table(sR, { rows: 4, cols: 4, square: true, maxCell: 60, size: 12, rowLabels: (m) => `m=${m}`, colLabels: (c) => `c=${c}`, cornerLabel: '' });
        sT.onClick((x, y) => { const h = Tt.hit(x, y); if (h && h.i >= 0 && h.j >= 0) tab[h.i][h.j] = (tab[h.i][h.j] + 1) % nSel.value; });
        let info = null;
        v.render(() => {
          sync();
          const n = nSel.value, pk = Array.from({ length: n }, (_, k) => (k === 0 ? bias.value : (1 - bias.value) / (n - 1)));
          const cnd = Array.from({ length: n }, () => new Array(n).fill(0));
          for (let k = 0; k < n; k++) for (let m = 0; m < n; m++) cnd[m][tab[k][m]] += pk[k];
          const rowDup = (k) => new Set(tab[k]).size < n;
          const colCount = (m, c) => tab.filter((row) => row[m] === c).length;
          const bad = (k, m) => colCount(m, tab[k][m]) !== 1;
          const validCipher = tab.every((_, k) => !rowDup(k));
          const cond_b = Array.from({ length: n }, (_, m) => Array.from({ length: n }, (_, c) => colCount(m, c) === 1)).every((r) => r.every(Boolean));
          const cond_a = pk.every((p) => Math.abs(p - 1 / n) < 1e-9);
          let spread = 0; for (let c = 0; c < n; c++) { const col = cnd.map((r) => r[c]); spread = Math.max(spread, Math.max(...col) - Math.min(...col)); }
          const perfect = spread < 1e-9;
          Tt.draw({
            rows: n, cols: n, value: (i, j) => tab[i][j], fill: (i, j) => [COL[tab[i][j]], 0.4],
            highlight: tab.flatMap((_, i) => tab[i].map((__, j) => (bad(i, j) ? [i, j, 'red'] : null)).filter(Boolean)),
            sub: (i) => `Pr ${v.fix(pk[i], 2)}`, subSize: 9,
            rowLabels: (k) => `k=${k}`, colLabels: (m) => `m=${m}`,
          });
          Tr.draw({
            rows: n, cols: n, value: (i, j) => cnd[i][j], format: (x) => v.fix(x, 2), fill: (i, j) => ['accent', 0.08 + 0.7 * cnd[i][j]],
            rowLabels: (m) => `m=${m}`, colLabels: (c) => `c=${c}`,
          });
          info = { n, validCipher, cond_a, cond_b, perfect, spread };
        });
        v.readout(() => `Valid cipher (every row injective, so decryption works): **${info.validCipher ? 'yes' : 'no'}**.  (a) all keys equally likely: **${info.cond_a ? 'yes' : 'no'}**.  (b) every $(m,c)$ has exactly one key — Latin columns, no red cell: **${info.cond_b ? 'yes' : 'no'}**.\nLikelihood test of Definition 2.1: rows of the right table differ by at most $${v.fix(info.spread, 3)}$ — **${info.perfect ? 'perfectly secret' : 'not perfectly secret'}**.${info.validCipher ? (info.perfect === (info.cond_a && info.cond_b) ? ' It agrees with (a) and (b).' : ' (disagreement: report as a bug)') : ' Some key is not decryptable, so the theorem does not apply.'}`);
      },
    },

    // ================================================================== 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Entropy bound: H(K) ≥ H(M)',
      statement: String.raw`Let $M$ be a message and $K$ an independent key, and $C=\mathsf{Enc}_K(M)$ with $M$ recoverable from $(K,C)$. Then the information the ciphertext leaks about the message is at least the amount by which the message’s entropy exceeds the key’s: $$I(M;C)\;\ge\;H(M)-H(K).$$ In particular, if the scheme leaks nothing, $I(M;C)=0$ (perfect secrecy), then $H(K)\ge H(M)$: the key must carry at least as much entropy as the message.`,
      idea: String.raw`By correctness $H(M\mid K,C)=0$, so $H(M\mid C)\le H(M,K\mid C)=H(K\mid C)+H(M\mid K,C)=H(K\mid C)\le H(K)$, the last step being “conditioning reduces entropy”. Hence $I(M;C)=H(M)-H(M\mid C)\ge H(M)-H(K)$. Perfect secrecy makes $H(M\mid C)=H(M)$, which fits under $H(K)$ only if $H(K)\ge H(M)$. Uniform messages on $\mathcal M$ recover 2.4.`,
      caption: String.raw`The message lives in $\mathbb Z_8$ and the scheme is $c=m+k\bmod 8$. Drag the prior skew (lowering $H(M)$), the number of keys and the key skew (lowering $H(K)$). On the left the five entropies as bars, with the guaranteed lower bound on the leakage marked on the green bar; on the right 300 random configurations plotted by $H(M)-H(K)$ against leakage — none can fall under the red line.`,
      deps: ['crypto-2.4', 'info-2.7'],
      tags: ['entropy', 'mutual information'],
      refs: ['Boneh–Shoup ch. 2'],
      credit: 'Claude Shannon, 1949',
      viz(v) {
        const sB = v.stage({ x: [0, 6], y: [0, 3.6], axes: 'box', gutter: true, height: 340, minWidth: 300, weight: 1, ylabel: 'bits', xticks: [[1, 'H(M)'], [2, 'H(K)'], [3, 'H(C)'], [4, 'H(M|C)'], [5, 'I(M;C)']], yticks: [0, 1, 2, 3].map((y) => [y, String(y)]) });
        const sS = v.stage({ x: [-3, 3], y: [0, 3.2], axes: 'box', gutter: true, height: 340, minWidth: 300, weight: 1, xlabel: 'H(M) − H(K)', ylabel: 'leakage I(M;C)', title: '300 random schemes' });
        const tS = v.slider('Prior skew', 0, 1.5, 0.3, { step: 0.01 });
        const kS = v.slider('Number of keys $|\\mathcal K|$', 1, 8, 4, { int: true });
        const sS2 = v.slider('Key skew', 0, 3, 0, { step: 0.01 });
        const analyse = (t, K, s) => {
          const pm = normalize(Array.from({ length: 8 }, (_, m) => Math.exp(-t * m)));
          const pk = normalize(Array.from({ length: K }, (_, k) => Math.exp(-s * k)));
          const J = Array.from({ length: 8 }, () => new Array(8).fill(0));
          for (let m = 0; m < 8; m++) for (let k = 0; k < K; k++) J[m][(m + k) % 8] += pm[m] * pk[k];
          const pc = Array.from({ length: 8 }, (_, c) => J.reduce((a, row) => a + row[c], 0));
          const HM = ent(pm), HK = ent(pk), HC = ent(pc), HMC = ent(J.flat());
          const I = Math.max(0, HM + HC - HMC);
          return { HM, HK, HC, HMC, HMgC: HM - I, I };
        };
        const pts = (() => { const r = v.rng(2718); return Array.from({ length: 300 }, () => { const K = 1 + Math.floor(r() * 8), t = r() * 1.5, s = r() < 0.3 ? 0 : r() * 3; const a = analyse(t, K, s); return [a.HM - a.HK, a.I]; }); })();
        let cur = null;
        v.render(() => {
          const a = analyse(tS.value, kS.value, sS2.value); cur = a;
          const vals = [a.HM, a.HK, a.HC, a.HMgC, a.I], cols = ['accent', 'gold', 'purple', 'teal', 'green'];
          sB.bars(vals, { x0: 1, dx: 1, color: (x, i) => cols[i], fillAlpha: 0.5, barWidth: 0.6 });
          vals.forEach((x, i) => sB.text(v.fix(x, 2), i + 1, x + 0.12, { size: 11.5, weight: 700, color: cols[i] }));
          sB.hline(a.HM, { color: 'accent', width: 1.4, dash: true });
          const lb = Math.max(0, a.HM - a.HK);
          sB.line(4.6, lb, 5.4, lb, { color: 'red', width: 3 });
          sB.text('bound', 5.38, lb + 0.2, { size: 11, color: 'red', align: 'left', weight: 700 });
          // scatter
          sS.poly([[0, 0], [3, 0], [3, 3]], { fill: 'red', fillAlpha: 0.1, hatch: true, color: 'red', width: 0.01 });
          sS.path([[-3, 0], [0, 0], [3, 3]], { color: 'red', width: 2.2 });
          sS.text('impossible', 1.9, 0.5, { size: 11.5, color: 'red', weight: 700, align: 'center' });
          sS.dots(pts, { r: 2.6, color: 'accent', alpha: 0.55 });
          sS.dot(a.HM - a.HK, a.I, { r: 7, color: 'gold' });
        });
        v.legend([['red', 'bound $I\\ge\\max(0,H(M)-H(K))$'], ['accent', 'random schemes', { dot: true }], ['gold', 'your scheme', { dot: true }]]);
        v.readout(() => {
          const a = cur;
          return String.raw`$H(M)=${v.fix(a.HM, 3)}$, $H(K)=${v.fix(a.HK, 3)}$, $H(C)=${v.fix(a.HC, 3)}$ bits; $H(M\mid C)=${v.fix(a.HMgC, 3)}$ and leakage $I(M;C)=${v.fix(a.I, 3)}$.` + '\n' +
            String.raw`Bound: $I(M;C)=${v.fix(a.I, 3)}\ \ge\ H(M)-H(K)=${v.fix(a.HM - a.HK, 3)}$ — ${a.I >= a.HM - a.HK - 1e-9 ? 'holds' : '**violated (bug)**'}. ` + (a.I < 1e-9 ? 'Zero leakage: perfect secrecy, and indeed $H(K)\\ge H(M)$.' : a.HK < a.HM - 1e-9 ? 'The key carries less entropy than the message, so some of the message must leak.' : 'The key is rich enough, but this key law is not uniform enough to hide the message.');
        });
      },
    },

    // ================================================================== 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'The two-time pad',
      statement: String.raw`If the same one-time pad $k$ encrypts two messages, $c_1=m_1\oplus k$ and $c_2=m_2\oplus k$, then $c_1\oplus c_2=m_1\oplus m_2$: the key cancels. Each ciphertext alone is still uniformly random, but the pair reveals the XOR of the two plaintexts, and for natural-language or image data that is enough to recover both (the redundancy of each plaintext lets an attacker peel them apart). The pad is “one-time” in the strictest sense: the perfect-secrecy guarantee covers a single message only.`,
      idea: String.raw`Perfect secrecy (2.3) is a statement about one ciphertext: given $(m,c)$ the key is $m\oplus c$, so a second ciphertext under the same key is *not* independent of the first. The attacker never needs the key; XORing the ciphertexts removes it and leaves $m_1\oplus m_2$, whose structure (two overlaid images, two English texts) is easy to read. This is how reused pads were exposed in practice.`,
      caption: String.raw`Two pictures are encrypted with a pad. The top row is what the senders had; the bottom row is what Eve sees. Slide *reuse* from 0% (a fresh pad for the second picture, so $c_1\oplus c_2$ is pure noise) to 100% (the same pad throughout) and watch the overlay emerge in the reused part. Change the first message and press *New pad*.`,
      deps: ['crypto-2.3'],
      tags: ['key reuse', 'one-time pad'],
      refs: ['Katz–Lindell §2.2'],
      scope: String.raw`Applies to any stream or XOR cipher that reuses its keystream (a pad, a stream cipher with a repeated nonce, WEP-style IV collisions); the pictures here are illustrative bitmaps, not real data.`,
      viz(v) {
        const GW = 72, GH = 36, N = GW * GH;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 320 });
        const txt = v.input('Message 1 (≤ 6 letters)', 'ATTACK', { width: 110 });
        const reuse = v.slider('Pad reuse', 0, 1, 1, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        let seed = 1; v.button('New pad', () => { seed++; });
        const smile = smileyBitmap(GW, GH);
        let cache = null, info = null;
        v.render(() => {
          const P = pix(s), { W } = P, t = norm(txt.value).slice(0, 6) || 'A';
          const p1 = textBitmap(t, GW, GH, 2), p2 = smile;
          const r = v.rng(seed * 977), k1 = randBits(r, N), kf = randBits(r, N), nre = Math.round(reuse.value * N);
          const k2 = new Uint8Array(N); for (let i = 0; i < N; i++) k2[i] = i < nre ? k1[i] : kf[i];
          const c1 = xorBits(p1, k1), c2 = xorBits(p2, k2), d = xorBits(c1, c2), truth = xorBits(p1, p2);
          const cols = W >= 560 ? 3 : 2, gap = 10, pw = Math.min((W - gap * (cols + 1)) / cols, 260), ph = pw * GH / GW, rowH = ph + 26;
          const panels = [['plaintext 1', p1, 'accent'], ['plaintext 2', p2, 'orange'], ['pad k (used for message 1)', k1, 'muted'], ['c₁ = m₁ ⊕ k', c1, 'ink'], ['c₂ = m₂ ⊕ k′  (k′ = k on the reused part)', c2, 'ink'], ['c₁ ⊕ c₂ — what Eve computes', d, 'red']];
          const x00 = (W - (cols * pw + (cols - 1) * gap)) / 2;
          panels.forEach(([lab, b, col], i) => {
            const cx = i % cols, cy = Math.floor(i / cols), x = x00 + cx * (pw + gap), y = 22 + cy * rowH;
            P.rect(x, y, pw, ph, { fill: 'panel', color: i === 5 ? 'red' : 'faint', width: i === 5 ? 2 : 1, radius: 3 });
            paintBits(s, v.color(col === 'muted' ? 'muted' : col), b, GW, GH, x, y, pw);
            P.text(lab, x, y - 9, { size: 11, color: i < 3 ? col : 'ink', weight: 700, align: 'left', halo: false });
          });
          let agree = 0, agreeR = 0, agreeF = 0;
          for (let i = 0; i < N; i++) { const a = d[i] === truth[i]; if (a) agree++; if (i < nre) { if (a) agreeR++; } else if (a) agreeF++; }
          let ones = 0; for (let i = 0; i < N; i++) ones += c1[i];
          info = { agree, agreeR, agreeF, nre, ones };
        });
        v.readout(() => `$c_1$ alone: ${v.fix(100 * info.ones / N, 1)}% ones — indistinguishable from noise. $c_1\\oplus c_2$ equals $m_1\\oplus m_2$ on **${info.agreeR}** of the ${info.nre} reused pixels${info.agreeR === info.nre && info.nre ? ' (exactly all of them)' : ''}${N - info.nre ? ` and on ${info.agreeF} of the ${N - info.nre} fresh-pad pixels (${v.fix(100 * info.agreeF / (N - info.nre), 1)}%, i.e. chance level)` : ''}.`);
      },
    },

    // ================================================================== 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Statistical distance',
      statement: String.raw`For two probability distributions $P,Q$ on a finite set $\Omega$, the **statistical (total variation) distance** is $$\Delta(P,Q)=\max_{S\subseteq\Omega}\bigl|P(S)-Q(S)\bigr|=\tfrac12\sum_{\omega\in\Omega}|P(\omega)-Q(\omega)|.$$ It lies in $[0,1]$, equals $0$ iff $P=Q$ and $1$ iff the supports are disjoint. For any test (distinguisher) $D:\Omega\to\{0,1\}$ the advantage $|\Pr_P[D=1]-\Pr_Q[D=1]|$ is at most $\Delta(P,Q)$, with equality for $D=\mathbf 1_S$, $S=\{\omega:P(\omega)>Q(\omega)\}$.`,
      idea: String.raw`Let $S^\ast=\{P>Q\}$. Because both sums equal one, the total surplus of $P$ over $Q$ on $S^\ast$ equals the total deficit elsewhere, so $\sum|P-Q|=2\,(P(S^\ast)-Q(S^\ast))$, which gives the half-sum formula. Any other set $S$ gains by including points of $S^\ast$ and loses by including points outside it, so $S^\ast$ is optimal. Perfect secrecy (2.1, 2.2) says $\Delta(C_{m},C_{m'})=0$ for all messages.

The finite-space additivity in prob-1.1.1a identifies the probability of a test’s accepting set with the sum of its point masses. Apply it separately to P and Q: their signed mass differences sum to zero, so positive surplus and negative deficit have equal total magnitude. Selecting exactly the positive-surplus atoms maximizes the difference and gives half the absolute-mass sum. This uses normalized probability laws; arbitrary unnormalized masses need not have that balance.`,
      caption: String.raw`Drag the bar tops of $P$ (blue) and $Q$ (orange) — they are renormalised to total mass $1$ — or choose a preset. Click bins in the top panel to build your own distinguisher $S$ (gold band). Below, the signed difference $P-Q$: the green area (where $P>Q$) equals the red area, and either equals $\Delta$. No choice of $S$ beats the optimal one.`,
      deps: ['crypto-2.1', 'prob-1.1.1a'],
      tags: ['total variation', 'distinguisher'],
      refs: ['Boneh–Shoup ch. 2'],
      viz(v) {
        const n = 8;
        const sT = v.stage({ x: [0.3, n + 0.7], y: [0, 0.5], axes: 'box', gutter: true, height: 300, minWidth: 320, ylabel: 'probability', xlabel: 'outcome ω  (click to put it in $S$)', xticks: Array.from({ length: n }, (_, i) => [i + 1, String(i + 1)]) });
        const sD = v.stage({ x: [0.3, n + 0.7], y: [-0.2, 0.2], axes: 'box', gutter: true, height: 300, minWidth: 320, ylabel: '$P-Q$', xlabel: 'outcome ω', xticks: Array.from({ length: n }, (_, i) => [i + 1, String(i + 1)]) });
        const binom = (m, p) => Array.from({ length: n }, (_, k) => v.M.binom(m, k) * p ** k * (1 - p) ** (m - k));
        const PRE = {
          bin: [binom(7, 0.5), binom(7, 0.65)],
          die: [Array(n).fill(1 / n), [0.2, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1]],
          near: [binom(7, 0.5), binom(7, 0.52)],
          disj: [[0.25, 0.25, 0.25, 0.25, 0, 0, 0, 0], [0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25]],
          same: [binom(7, 0.5), binom(7, 0.5)],
        };
        let wP = PRE.bin[0].slice(), wQ = PRE.bin[1].slice(), S = Array.from({ length: n }, (_, i) => i >= 4);
        const preset = v.select('Preset', [{ value: 'bin', label: 'Binomials' }, { value: 'die', label: 'Fair vs loaded die' }, { value: 'near', label: 'Nearly equal' }, { value: 'disj', label: 'Disjoint' }, { value: 'same', label: 'Identical' }], 'bin', { onChange: (k) => { wP = PRE[k][0].slice(); wQ = PRE[k][1].slice(); } });
        const hP = Array.from({ length: n }, (_, i) => { const h = sT.handle(i + 1 - 0.2, wP[i], { color: 'blue', r: 6, constrain: { x: [i + 0.8, i + 0.8], y: [0.0, 1] } }); h.onDrag = () => { wP[i] = Math.max(0, h.y); }; return h; });
        const hQ = Array.from({ length: n }, (_, i) => { const h = sT.handle(i + 1 + 0.2, wQ[i], { color: 'orange', r: 6, constrain: { x: [i + 1.2, i + 1.2], y: [0.0, 1] } }); h.onDrag = () => { wQ[i] = Math.max(0, h.y); }; return h; });
        sT.onClick((x) => { const i = Math.round(x) - 1; if (i >= 0 && i < n) S[i] = !S[i]; });
        let info = null;
        v.render(() => {
          const p = normalize(wP.map((x) => x + 1e-12)), q = normalize(wQ.map((x) => x + 1e-12));
          const mx = Math.max(...p, ...q), top = [0.3, 0.5, 0.75, 1].find((t) => t >= mx * 1.1) || 1;
          sT.setView([0.3, n + 0.7], [0, top]);
          hP.forEach((h, i) => h.set(i + 0.8, p[i])); hQ.forEach((h, i) => h.set(i + 1.2, q[i]));
          S.forEach((on, i) => { if (on) sT.vband(i + 0.5, i + 1.5, { color: 'gold', alpha: 0.2 }); });
          p.forEach((x, i) => { sT.rect(i + 0.62, 0, i + 0.98, x, { fill: 'blue', fillAlpha: 0.5, color: 'blue', width: 1 }); sT.rect(i + 1.02, 0, i + 1.38, q[i], { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1 }); });
          const d = p.map((x, i) => x - q[i]), dm = Math.max(0.1, ...d.map(Math.abs)) * 1.25;
          sD.setView([0.3, n + 0.7], [-dm, dm]);
          S.forEach((on, i) => { if (on) sD.vband(i + 0.5, i + 1.5, { color: 'gold', alpha: 0.2 }); });
          d.forEach((x, i) => sD.rect(i + 0.65, 0, i + 1.35, x, { fill: x >= 0 ? 'green' : 'red', fillAlpha: 0.5, color: x >= 0 ? 'green' : 'red', width: 1 }));
          sD.hline(0, { color: 'muted', width: 1 });
          d.forEach((x, i) => { if (Math.abs(x) > dm * 0.12) sD.text(v.fix(x, 3), i + 1, x + Math.sign(x) * dm * 0.08, { size: 10.5, color: x > 0 ? 'green' : 'red', weight: 700 }); });
          const delta = 0.5 * d.reduce((a, x) => a + Math.abs(x), 0);
          const yours = S.reduce((a, on, i) => a + (on ? d[i] : 0), 0);
          let best = 0; for (let mask = 0; mask < 1 << n; mask++) { let t = 0; for (let i = 0; i < n; i++) if (mask >> i & 1) t += d[i]; best = Math.max(best, Math.abs(t)); }
          const pos = d.reduce((a, x) => a + Math.max(0, x), 0);
          info = { delta, yours, best, pos };
        });
        v.legend([['blue', '$P$'], ['orange', '$Q$'], ['gold', 'your set $S$', { area: true }]]);
        v.readout(() => `$\\Delta(P,Q)=\\tfrac12\\sum|P-Q| = ${v.fix(info.delta, 4)}$; the green area is $${v.fix(info.pos, 4)}$ — the same number. Your distinguisher $S$ has advantage $|P(S)-Q(S)|=${v.fix(Math.abs(info.yours), 4)}$ ≤ Δ. Brute force over all $2^8$ sets: the best has advantage $${v.fix(info.best, 4)}$ = Δ.`);
      },
    },

    // ================================================================== 2.9
    {
      num: '2.9',
      kind: 'Concept',
      name: 'Secret splitting by XOR',
      statement: String.raw`To share a secret $s\in\{0,1\}^\ell$ among $n$ parties, choose shares $s_1,\dots,s_{n-1}$ independently and uniformly at random and set $s_n=s\oplus s_1\oplus\cdots\oplus s_{n-1}$. All $n$ shares together give back $s=s_1\oplus\cdots\oplus s_n$. Any set of at most $n-1$ shares is uniformly distributed on $(\{0,1\}^\ell)^{n-1}$, independent of $s$: it carries no information about the secret, in the perfect-secrecy sense. (An $n$-out-of-$n$ scheme; see threshold schemes for $t$-out-of-$n$.)`,
      idea: String.raw`Missing share $s_j$ is itself $s\oplus(\text{XOR of the others})$. Whatever the other shares are, $s_j$ is a one-time-pad encryption of $s$ under the uniform key $\bigoplus_{i\neq j}s_i$; by 2.3 its distribution is the same for every secret, and the other $n-2$ shares are uniform and independent of everything. So any $n-1$ shares have the same law for every $s$.

By the independent-product law prob-2.1.11 the $n-1$ initially sampled shares give every input tuple the same probability. Fix any $n-1$ observed share positions and their values. If the determined last share is unobserved, the input tuple is fixed directly; otherwise the XOR constraint uniquely fixes the one omitted initial share. Thus each observed tuple has exactly one input preimage, with the same mass for every secret. Smaller observed subsets are marginals of this uniform product law.`,
      caption: String.raw`Type a secret and choose $n$. Click shares to “collect” them; the XOR of the collected ones is shown bottom right. With all $n$ the secret appears; with one share missing — whichever it is — the result is fresh noise, and the agreement with the secret stays near 50% (the readout gives the z-score). *Reshare* draws new random shares for the same secret.`,
      deps: ['crypto-2.3', 'prob-2.1.11'],
      tags: ['secret sharing', 'xor'],
      refs: ['Katz–Lindell §15.3'],
      viz(v) {
        const GW = 72, GH = 20, N = GW * GH;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 320 });
        const secret = v.input('Secret (≤ 6 letters)', 'SECRET', { width: 110 });
        const nS = v.slider('Shares $n$', 2, 5, 4, { int: true });
        let seed = 1; v.button('Reshare', () => { seed++; });
        let got = null, lastN = 0, geo = [];
        v.button('Collect all', () => { got = got.map(() => true); });
        v.button('Clear', () => { got = got.map(() => false); });
        let info = null;
        v.render(() => {
          const n = nS.value; if (lastN !== n) { lastN = n; got = Array.from({ length: n }, (_, i) => i < n - 1); }
          const P = pix(s), { W } = P, sec = textBitmap(norm(secret.value).slice(0, 6) || 'A', GW, GH, 2);
          const r = v.rng(seed * 313 + n), sh = Array.from({ length: n - 1 }, () => randBits(r, N));
          let last = sec.slice(); sh.forEach((b) => { last = xorBits(last, b); }); sh.push(last);
          let res = new Uint8Array(N); sh.forEach((b, i) => { if (got[i]) res = xorBits(res, b); });
          const gap = 10, perRow = W >= 560 ? n : Math.min(n, 3), rowsN = Math.ceil(n / perRow), pw = Math.min((W - gap * (perRow + 1)) / perRow, 200), ph = pw * GH / GW;
          geo = [];
          sh.forEach((b, i) => {
            const cx = i % perRow, cy = Math.floor(i / perRow), x0 = (W - (perRow * pw + (perRow - 1) * gap)) / 2 + cx * (pw + gap), y = 24 + cy * (ph + 26);
            geo.push([x0, y, pw, ph]);
            const on = got[i];
            P.rect(x0, y, pw, ph, { fill: on ? 'green' : 'panel', fillAlpha: on ? 0.1 : 1, color: on ? 'green' : 'faint', width: on ? 2.4 : 1, radius: 3, dash: !on });
            paintBits(s, v.color(on ? 'ink' : 'faint'), b, GW, GH, x0, y, pw);
            P.text(`share ${i + 1}${on ? ' ✓' : ''}`, x0, y - 9, { size: 11, weight: 700, color: on ? 'green' : 'muted', align: 'left', halo: false });
          });
          const y2 = 24 + rowsN * (ph + 26) + 12, bw = Math.min((W - 3 * gap) / 2, 330), bh = bw * GH / GW;
          const xa = (W - 2 * bw - gap) / 2, xb = xa + bw + gap;
          P.rect(xa, y2, bw, bh, { fill: 'panel', color: 'accent', width: 1.6, radius: 3 }); paintBits(s, v.color('accent'), sec, GW, GH, xa, y2, bw);
          P.text('the secret', xa, y2 - 9, { size: 11.5, weight: 700, color: 'accent', align: 'left', halo: false });
          const cnt = got.filter(Boolean).length, full = cnt === n;
          P.rect(xb, y2, bw, bh, { fill: 'panel', color: full ? 'green' : 'red', width: 2, radius: 3 }); paintBits(s, v.color('ink'), res, GW, GH, xb, y2, bw);
          P.text(`XOR of the ${cnt} collected share${cnt === 1 ? '' : 's'}`, xb, y2 - 9, { size: 11.5, weight: 700, color: full ? 'green' : 'red', align: 'left', halo: false });
          let agree = 0, ones = 0; for (let i = 0; i < N; i++) { if (res[i] === sec[i]) agree++; ones += res[i]; }
          info = { n, cnt, full, agree, ones, z: (agree - N / 2) / (Math.sqrt(N) / 2), all: sec.reduce((a, b) => a + b, 0) };
        });
        s.onClick((x, y) => { const px = s.X(x), py = s.Y(y); geo.forEach(([x0, y0, w, h], i) => { if (px >= x0 && px <= x0 + w && py >= y0 && py <= y0 + h) got[i] = !got[i]; }); });
        v.readout(() => info.full ? `All ${info.n} shares: the XOR equals the secret on **${info.agree} of ${N}** pixels — exact recovery.` : `${info.cnt} of ${info.n} shares collected: the XOR agrees with the secret on ${info.agree} of ${N} pixels (z = ${v.fix(info.z, 2)}, chance is ${N / 2} ± ${v.fix(Math.sqrt(N) / 2, 0)}) and has ${v.fix(100 * info.ones / N, 1)}% ones — uniform noise. The collected shares have exactly the same law whatever the secret was.`);
      },
    },

    // ================================================================== 2.10
    {
      num: '2.10',
      kind: 'Paper',
      name: 'Communication Theory of Secrecy Systems',
      paper: { authors: 'C. E. Shannon', year: 1949, title: 'Communication Theory of Secrecy Systems', venue: 'Bell System Technical Journal 28 (4): 656–715', doi: '10.1002/j.1538-7305.1949.tb00928.x' },
      introduces: ['crypto-2.1', 'crypto-2.3', 'crypto-2.4', 'crypto-2.5', 'crypto-1.10'],
      credit: 'C. E. Shannon, 1949 (written up from a classified Bell Labs report of 1945)',
      statement: String.raw`Shannon turned cryptography into a mathematical theory by treating a cipher as a family of invertible maps indexed by a random key, and the enemy’s knowledge as probabilities. He defines **perfect secrecy** — the posterior over messages equals the prior after seeing the cryptogram — shows that the **one-time pad** achieves it and that any perfect system needs at least as much key as message (in entropy), and measures imperfect systems by the **equivocation** $H(K\mid C^n)$ of the key given $n$ letters of cryptogram, which falls to nearly zero around the **unicity distance** $U\approx H(K)/D$, where $D$ is the redundancy of the language.`,
      idea: String.raw`Before 1949 cipher security meant “nobody has broken it yet”. Shannon, building on his information theory, asked what an unlimited adversary could ever learn. If the plaintext language has redundancy $D$ bits per letter, each cryptogram letter removes about $D$ bits from the key’s uncertainty, so a key with $H(K)$ bits is pinned down after $H(K)/D$ letters, and a one-time pad whose key grows with the message never is. The paper introduced perfect secrecy, equivocation, unicity distance and the pad’s optimality, and linked them to redundancy, the same quantity data compression exploits.`,
      caption: String.raw`Left: the key equivocation $H(K\mid c_1\dots c_n)/H(K)$ for Vigenère keys of 1–3 letters, computed exactly under a bigram model of English on Gettysburg-Address windows (curves for $L=1,2,3$; Shannon’s straight-line estimate dashed); the one-time pad stays at 1. Right: choose the cipher and how many cryptogram letters Eve has seen, and test six equally sensible 12-letter messages — which could still have produced the cryptogram? The language model is the corpus bigram table of chapter 1, not Shannon’s own digram tables.`,
      deps: ['info-1.2', 'crypto-1.7'],
      tags: ['shannon', 'unicity distance', 'equivocation'],
      refs: [],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Communication_Theory_of_Secrecy_Systems' },
      viz(v) {
        const PH = ['ATTACKATDAWN', 'HOLDTHELINES', 'ABORTMISSION', 'SURRENDERNOW', 'COMEHOMESOON', 'SENDMOREFOOD'];
        const NX = 16, D = LOG2_26 - H2;
        const sL = v.stage({ x: [0, NX], y: [0, 1.08], axes: 'box', gutter: true, height: 420, minWidth: 320, weight: 1, xlabel: 'cryptogram letters seen, n', ylabel: 'H(K | c₁…cₙ) / H(K)', title: 'Key equivocation', yticks: [0, 0.25, 0.5, 0.75, 1].map((y) => [y, String(y)]) });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, minWidth: 330, weight: 1.1, title: 'Which messages are still possible?' });
        const cip = v.select('Cipher', [{ value: 1, label: 'Vigenère L=1' }, { value: 2, label: 'L=2' }, { value: 3, label: 'L=3' }, { value: 0, label: 'One-time pad' }], 3);
        const nS = v.slider('Letters seen $n$', 0, 12, 4, { int: true });
        const tru = v.select('True message', PH.map((_, i) => ({ value: i, label: String(i + 1) })), 0);
        const curves = {};
        const curveFor = (L) => {
          if (curves[L]) return curves[L];
          const W = 4, H = new Float64Array(NX + 1);
          for (let w = 0; w < W; w++) {
            const o = (97 * w + 40) % (PASSAGE.length - 30), ct = vigC(PASSAGE.slice(o, o + NX), randomKey(v.rng(500 + 13 * w + L), L));
            const e = equivocation([...ct].map(code), L, NX).H; for (let i = 0; i <= NX; i++) H[i] += e[i] / W / (L * LOG2_26);
          }
          return (curves[L] = H);
        };
        let info = null;
        v.render(() => {
          const L = cip.value, n = nS.value, cols = { 1: 'blue', 2: 'orange', 3: 'purple' };
          sL.hline(1, { color: 'green', width: L === 0 ? 3.4 : 1.8 }); sL.text('one-time pad', NX * 0.98, 1.035, { size: 11, color: 'green', align: 'right', weight: 700 });
          [1, 2, 3].forEach((l) => {
            const H = curveFor(l), sel = l === L;
            sL.path(Array.from(H, (y, i) => [i, y]), { color: cols[l], width: sel ? 3.4 : 1.4, alpha: sel || L === 0 ? 1 : 0.6 });
            sL.path(Array.from({ length: NX + 1 }, (_, i) => [i, Math.max(0, 1 - i * D / (l * LOG2_26))]), { color: cols[l], width: 1.2, dash: true, alpha: sel ? 0.9 : 0.4 });
            const U = l * LOG2_26 / D; if (U < NX) sL.dot(U, 0, { r: 4.5, color: cols[l] });
          });
          sL.vline(n, { color: 'gold', width: 2 });
          // right panel
          const P = pix(sR), { W, H: HH } = P, len = 12;
          const key = L === 0 ? randomKey(v.rng(77), len) : randomKey(v.rng(900 + L), L), Lp = L === 0 ? len : L;
          const ct = vigC(PH[tru.value], key), cc = [...ct].map(code);
          P.text('cryptogram seen:', 10, 14, { size: 11.5, weight: 700, color: 'orange', align: 'left', halo: false });
          const cw = clamp((W - 150) / 12, 9, 15);
          letterRow(P, ct.slice(0, n) + '·'.repeat(len - n), 120, 14, cw, (i) => (i < n ? 'orange' : 'faint'), { size: 13 });
          let possible = 0; const rowH = (HH - 50) / 6;
          PH.forEach((ph, j) => {
            const y = 48 + j * rowH, ks = [...ph].map((ch, i) => mod(cc[i] - code(ch), 26));
            let bad = -1; for (let i = Lp; i < n; i++) if (ks[i] !== ks[i - Lp]) { bad = i; break; }
            const ok = bad < 0; if (ok) possible++;
            P.rect(6, y - 8, W - 12, rowH - 6, { fill: ok ? 'green' : 'red', fillAlpha: 0.06, color: ok ? 'green' : 'faint', width: ok ? 1.6 : 1, radius: 6 });
            P.text(String(j + 1), 16, y + 6, { size: 12, weight: 700, color: ok ? 'green' : 'muted', halo: false });
            letterRow(P, ph.slice(0, n) + '·'.repeat(len - n), 28, y + 2, cw, (i) => (i < n ? 'ink' : 'faint'), { size: 13 });
            letterRow(P, [...Array(len)].map((_, i) => (i < n ? A[ks[i]] : '·')).join(''), 28, y + 20, cw, (i) => (i < n ? (bad >= 0 && i >= bad ? 'red' : 'gold') : 'faint'), { size: 12, weight: 500 });
            P.text(ok ? (j === tru.value ? '✓ true message' : '✓ possible') : '✗ key not periodic', 28 + len * cw + 12, y + 9, { size: 11.5, weight: 700, color: ok ? 'green' : 'red', align: 'left', halo: false });
          });
          info = { L, n, possible, Lp };
        });
        v.legend([['blue', 'L = 1'], ['orange', 'L = 2'], ['purple', 'L = 3'], ['green', 'one-time pad'], ['muted', 'Shannon: 1 − nD/H(K)', { dash: true }]]);
        v.readout(() => {
          const { L, n, possible } = info, HK = (L || 12) * LOG2_26;
          const cur = L ? `$H(K)=${L}\\log_2 26=${v.fix(HK, 1)}$ bits; with $D=\\log_2 26-h=${v.fix(D, 2)}$ bits/letter (bigram model) the unicity distance is $U=H(K)/D\\approx ${v.fix(HK / D, 1)}$ letters` : `The pad key has $H(K)=12\\log_2 26 = ${v.fix(HK, 1)}$ bits, as long as the message, so the equivocation stays at 1 for ever ($U=\\infty$)`;
          return `Eve has seen $n=${n}$ letters: **${possible} of 6** candidate messages are still consistent with the cryptogram (a candidate survives iff the key stream it implies is periodic with period ${info.Lp}).\n${cur}. The textbook figure for a simple substitution cipher, $\\log_2 26!/D$ with $D\\approx3.2$ bits/letter (a value quoted from memory), is $${v.fix(LOG2_FACT26 / 3.2, 1)}$ letters, about the 28 usually cited; this model’s $D$ is smaller, so its $U$ is larger.`;
        });
      },
    },
  ],
};
