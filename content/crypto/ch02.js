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
      idea: String.raw`Seeing $c$ is a piece of evidence, and Bayes’ rule updates the prior on $M$ by the likelihood $\Pr[C=c\mid M=m]$. The posterior equals the prior exactly when that likelihood is the same for every $m$, which is the second formulation, and which does not mention the prior at all — so perfect secrecy holds for *all* priors or for none. A scheme leaks as soon as some message makes some ciphertext more likely than another message does.`,
      caption: String.raw`Drag the four bars of the prior (the message distribution Eve believes in) and pick a cipher on $\mathbb Z_4$: $c=m+k \bmod 4$. Each group on the right is one ciphertext; blue bars are the posterior, the gold ticks the prior. For the uniform key the two always agree; restrict the key space or bias the key and watch the posteriors move away from the ticks.`,
      deps: ['crypto-1.1'],
      tags: ['perfect secrecy', 'bayes'],
      refs: ['Katz–Lindell §2.1', 'Boneh–Shoup ch. 2'],
      credit: 'Claude Shannon, 1949',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information-theoretic_security' },
      viz(v) {
        const pr = v.stage({ x: [0.35, 4.65], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 250, weight: 0.8, title: 'Prior $\\Pr[M=m]$: drag the bar tops', xticks: MSG4.map((n, i) => [i + 1, n]) });
        const po = v.stage({ x: [0, 21], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 300, weight: 1.35, title: 'Posterior $\\Pr[M=m\\mid C=c]$ for each ciphertext $c$', xticks: [0, 1, 2, 3].map((c) => [5 * c + 2.5, `c = ${c}`]), yticks: [0, 0.25, 0.5, 0.75, 1].map((y) => [y, String(y)]) });
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
            po.text(`Pr[c] = ${v.fix(Pc, 2)}`, x0 + 1.5, 0.88, { size: 11, color: 'muted' });
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
      idea: String.raw`The game success is $\tfrac12\Pr[\mathcal A(C_{m_0})=0]+\tfrac12\Pr[\mathcal A(C_{m_1})=1]=\tfrac12+\tfrac12\bigl(\Pr[\mathcal A(C_{m_1})=1]-\Pr[\mathcal A(C_{m_0})=1]\bigr)$, so it is $\tfrac12$ for every $\mathcal A$ exactly when every test accepts both ciphertext distributions equally often, i.e. when the distributions coincide (the second form of 2.1). Conversely if $\Pr[C_{m_0}=c]\neq\Pr[C_{m_1}=c]$ for some $c$, the adversary that guesses the likelier message for each $c$ wins more than half the time.`,
      caption: String.raw`Choose the two messages Eve submits and the key distribution (each key bit is 1 with probability $p$; $p=\tfrac12$ is the one-time pad). The right panel shows the two ciphertext distributions; Eve’s best rule guesses $m_0$ where the blue bar is taller. The left panel plays 2000 games and shows the running success rate against the exact value $\tfrac12+\tfrac12\Delta$ and the $\pm3\sigma$ band of a coin flip. Press *Resample* for new games.`,
      deps: ['crypto-2.1'],
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
      idea: String.raw`Fix $m$ and $c$. The equation $m\oplus k=c$ has exactly one solution $k=m\oplus c$, since XOR with $m$ is a bijection of $\{0,1\}^\ell$. A uniform key hits that solution with probability $2^{-\ell}$, independent of $m$, so all messages give the same ciphertext distribution, which is the likelihood form of 2.1 and (via 2.2) the indistinguishability form.`,
      caption: String.raw`Pick a ciphertext $c$ and click the message you wish had been sent: there is **always** a key that turns $c$ into it, and exactly one. Every cell of the table (or every row, in the 3-bit view) is one message, coloured by its unique key. Restricting the key space makes cells go grey: those messages could no longer have produced $c$.`,
      deps: ['crypto-2.1'],
      tags: ['one-time pad', 'xor'],
      refs: ['Katz–Lindell §2.2'],
      credit: 'Vernam 1917; Shannon 1949 (proof)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/One-time_pad' },
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 320 });
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
              P.rect(x0 - 6, y - rowH / 2 + 2, 352 + 40, rowH - 4, { fill: on ? 'accent' : 'panel', fillAlpha: on ? 0.16 : 0.0, color: on ? 'accent' : 'faint', width: on ? 2 : 1, radius: 6 });
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
      idea: String.raw`Fix any ciphertext $c$ that occurs. Decrypting it under each key gives the set $\{\mathsf{Dec}_k(c):k\in\mathcal K\}$, which has at most $|\mathcal K|$ elements. If $|\mathcal K|<|\mathcal M|$ some message $m$ is missing from that set, so no key sends $m$ to $c$; but with the uniform prior $m$ had probability $1/|\mathcal M|>0$, and its posterior is $0$. Correctness (decryption is a function of $k$ and $c$) is what limits the set.`,
      caption: String.raw`Choose the number of keys and a ciphertext $c$. Each key sends $c$ back to exactly one message, drawn as a line from the key to the message; messages that no line reaches (red) are ruled out. As soon as $|\mathcal K|<8$ at least one message is impossible. Switch the cipher to random permutations — it makes no difference.`,
      deps: ['crypto-2.3'],
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
      idea: String.raw`If (a) and (b) hold then $\Pr[\mathsf{Enc}_K(m)=c]=\Pr[K=k_{m,c}]=1/|\mathcal K|$ for every $m,c$, which is perfect secrecy. Conversely, perfect secrecy forces $\Pr[\mathsf{Enc}_K(m)=c]$ to be the same for all $m$; since 2.4’s counting argument shows every $c$ must be reachable from every $m$, and the three sets have equal size, each $(m,c)$ is reached by exactly one key, and then the common probability $1/|\mathcal K|$ must be that key’s probability.`,
      caption: String.raw`Left: the encryption table, one row per key and one column per message, each entry a ciphertext (colour = symbol). Click a cell to change its entry. Right: the resulting ciphertext distribution $\Pr[C=c\mid M=m]$ for each message; perfect secrecy means its rows are identical. Break the Latin property (a repeated symbol in a column) or bias the keys, and the rows separate.`,
      deps: ['crypto-2.4'],
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
        nSel.el.addEventListener?.('click', () => {});
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

//__MORE__
  ],
};
