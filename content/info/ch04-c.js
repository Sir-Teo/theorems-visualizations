// Information & Coding Theory — Chapter 4: Source coding (items 4.13–4.17; 4.1–4.5 in ch04.js, 4.6–4.12 in ch04-b.js)
//
// Credits checked Oct 2026 against Crossref: Ziv & Lempel, IEEE Trans. IT 23 (3): 337–343 (1977) [abstract wording checked
// on IEEE Xplore]; Ziv & Lempel, IEEE Trans. IT 24 (5): 530–536 (1978); Elias, IEEE Trans. IT 21 (2): 194–203 (1975).
// Knuth & Yao, "The complexity of nonuniform random number generation", in Algorithms and Complexity (Academic Press, 1976),
// pp. 357–428 (page range from two secondary citations). Item 4.16 uses Grünwald–Vitányi's author chapter (2007).
// Compressor examples include toy LZ formats and a fractional KT model loss.
// Item 4.16 distinguishes emitted prefix bits, a constructive bound and unknown decoder constants.

import { clamp, sum, H, h2, hashStr, LET, barEd, resizeP, lz78, lz78Bits, ktBits, markovRate, markovBits, bitsStr, mono, pw2, log2, commas } from './ch04.shared.js';
import { complexityPlotData } from './complexity-audit.shared.js';

const COL = ['accent', 'orange', 'teal', 'purple', 'pink', 'gold', 'green'];
const lgx = (x) => Math.floor(Math.log2(x) + 1e-12);
const binStr = (n) => n.toString(2);
const gamma = (n) => '0'.repeat(lgx(n)) + binStr(n);
const delta = (n) => { const L = lgx(n); return gamma(L + 1) + binStr(n).slice(1); };
/** Decode a concatenated stream of Elias gamma (kind 'g') or delta ('d') codewords. */
function eliasDecode(bits, kind) {
  const out = []; let i = 0;
  const readG = () => { let z = 0; while (i + z < bits.length && bits[i + z] === '0') z++; if (i + 2 * z + 1 > bits.length) return null; const v = parseInt(bits.slice(i + z, i + 2 * z + 1), 2); i += 2 * z + 1; return v; };
  while (i < bits.length) {
    if (kind === 'g') { const v = readG(); if (v === null) break; out.push({ v, end: i }); }
    else { const Lp = readG(); if (Lp === null) break; const L = Lp - 1; if (i + L > bits.length) break; const v = parseInt('1' + bits.slice(i, i + L), 2); i += L; out.push({ v: L ? v : 1, end: i }); }
  }
  return out;
}

export default {
  collection: 'info',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Algorithm',
      name: 'Lempel–Ziv universal compression',
      statement: String.raw`Lempel–Ziv coding compresses a string without knowing the source's statistics. In the **tree-structured (LZ78) version** the string $x_1x_2\dots x_n$ is parsed from left to right into **distinct phrases**, each phrase being the shortest string not yet seen as a phrase; hence every phrase is an earlier phrase $w$ followed by one new symbol $a$. A phrase is sent as the pair (index of $w$, symbol $a$). With $c(n)$ phrases the code length is about $c(n)\,(\log_2c(n)+\log_2|\mathcal A|)$ bits. (The **sliding-window (LZ77) version** points instead to the longest match in the recent past, see 4.17.)

**Theorem.** For a stationary ergodic source with entropy rate $\mathcal H$ (3.11),
$$\frac1n\,\ell_{LZ}(X_1\dots X_n)\ \longrightarrow\ \mathcal H\qquad\text{with probability }1,$$
so one scheme is asymptotically optimal for all such sources at once, although the convergence can be slow (the error decays only like $1/\log n$).`,
      idea: String.raw`The phrases are distinct, so the number of phrases of length $\ell$ is limited, which forces $c(n)\le\frac{n}{(1-\varepsilon)\log n}$ for every string (a combinatorial bound). The coding cost is then $c\log c\approx$ the number of bits needed to name a phrase in the dictionary. The optimality argument compares with a finite-state description of the source: a Markov model of order $k$ cannot make the phrases much more compressible than $\log c$ bits each, and the entropy rate appears because, for an ergodic source, most phrases are typical (3.15, Shannon–McMillan–Breiman) and a typical string of length $m$ has probability $2^{-m\mathcal H}$, so a dictionary with $c$ phrases forces $\log\frac1P\gtrsim c\log c$. Hence $\frac1n c\log c\lesssim\mathcal H$ eventually, and the matching upper bound is the code length itself.`,
      caption: String.raw`Left: type text (any characters, up to 70) and step through its LZ78 parse; each phrase is a coloured run and is drawn as a new leaf of the dictionary tree (gold = newest phrase; edges are labelled with the added symbol). Below: for a binary Markov source with flip probabilities $a$ (0→1) and $b$ (1→0), the compression rate of LZ78 (pointer cost $\lceil\log_2 j\rceil+1$ bits for phrase $j$) is plotted against the length $n$ of a sample; it creeps down toward the entropy rate (line) only slowly, as the theorem warns.`,
      deps: ['info-4.1', 'info-3.11'],
      refs: ['Cover–Thomas §13.4', 'MacKay ch. 6'],
      tags: ['universal coding', 'Lempel–Ziv'],
      credit: 'J. Ziv & A. Lempel, 1977 (sliding window) and 1978 (tree-structured parsing; IEEE Trans. Inform. Theory 24 (5): 530–536)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/LZ77_and_LZ78' },
      viz(v) {
        const txt = v.input('text', 'abracadabra abracadabra abra', { width: 300 });
        const stepS = v.slider('phrases shown', 1, 70, 70, { int: true });
        const aS = v.slider('flip prob. $a$ (0→1)', 0.02, 0.6, 0.1, { step: 0.01 });
        const bS = v.slider('flip prob. $b$ (1→0)', 0.02, 0.6, 0.3, { step: 0.01 });
        let seed = 13; v.button('Resample source', () => { seed++; });
        const sA = v.stage({ x: [0, 1], y: [0, 1], height: 160, axes: false, title: 'LZ78 parse of the text', full: true });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, title: 'dictionary tree', minWidth: 300 });
        const sR = v.stage({ x: [20, 32768], y: [0, 1.1], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: 'sample length n', ylabel: 'bits per symbol', title: 'LZ78 rate on a Markov source', minWidth: 300 });
        let cache = null, info = {};
        v.render(() => {
          const text = String(txt.value).slice(0, 70);
          const ph = lz78(text), shown = Math.min(stepS.value, ph.length);
          // parse row
          const per = 34, rows = Math.max(1, Math.ceil(text.length / per));
          sA.setView([-0.3, per + 0.3], [-(rows - 1) * 1.7 - 1.1, 1.1]);
          const owner = new Array(text.length).fill(-1); ph.slice(0, shown).forEach((p, k) => { for (let i = p.from; i < p.to; i++) owner[i] = k; });
          for (let i = 0; i < text.length; i++) {
            const r = Math.floor(i / per), c = i % per, y = -r * 1.7, k = owner[i];
            if (k >= 0) sA.rect(c + 0.03, y - 0.5, c + 0.97, y + 0.5, { fill: COL[k % COL.length], fillAlpha: ph[k].partial ? 0.1 : 0.32, color: COL[k % COL.length], width: k === shown - 1 ? 2.2 : 1 });
            else sA.rect(c + 0.03, y - 0.5, c + 0.97, y + 0.5, { color: 'faint', width: 1 });
            sA.text(text[i] === ' ' ? '␣' : text[i], c + 0.5, y, { align: 'center', size: 13, weight: 600, color: k >= 0 ? 'ink' : 'muted', halo: false });
            if (k >= 0 && ph[k].from === i) sA.text(String(k + 1), c + 0.1, y, { dy: -16, size: 10, color: 'muted', align: 'left', halo: false });
          }
          // tree
          const ch = new Map(); ph.slice(0, shown).forEach((p, k) => { if (p.partial) return; if (!ch.has(p.parent)) ch.set(p.parent, []); ch.get(p.parent).push(k + 1); });
          const pos = new Map(); let leaf = 0, maxd = 0;
          const walk = (nd, d) => { maxd = Math.max(maxd, d); const kids = ch.get(nd) || []; if (!kids.length) { pos.set(nd, { x: leaf++, d }); return; } kids.forEach((k) => walk(k, d + 1)); const xs = kids.map((k) => pos.get(k).x); pos.set(nd, { x: (Math.min(...xs) + Math.max(...xs)) / 2, d }); };
          walk(0, 0);
          sT.setView([-0.7, Math.max(leaf - 0.3, 3)], [-maxd - 0.6, 0.7]);
          pos.forEach((q, nd) => { if (nd === 0) return; const p = ph[nd - 1], pp = pos.get(p.parent); sT.line(pp.x, -pp.d, q.x, -q.d, { color: 'muted', width: 1.2 }); sT.text(p.ch === ' ' ? '␣' : p.ch, (pp.x + q.x) / 2, -(pp.d + q.d) / 2, { dx: 7, dy: -7, size: 11.5, weight: 700, color: 'orange', halo: false }); });
          pos.forEach((q, nd) => { sT.dot(q.x, -q.d, { r: nd === 0 ? 5 : 10, color: nd === shown ? 'gold' : nd === 0 ? 'ink' : 'accent' }); if (nd) sT.text(String(nd), q.x, -q.d, { align: 'center', size: 10.5, weight: 700, color: 'ink', halo: false }); });
          // rate
          const key = `${aS.value}|${bS.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const NN = 32768, x = markovBits(NN, aS.value, bS.value, v.rng(hashStr(key))), P = lz78(x), pts = [];
            let j = 0; for (let e = 5; e <= 15; e += 0.25) { const n = Math.round(pw2(e)); while (j < P.length && P[j].to <= n) j++; const c = j + (P[j] && P[j].from < n ? 1 : 0); pts.push([n, lz78Bits(c, 2) / n]); }
            cache = { key, pts, hr: markovRate(aS.value, bS.value) };
          }
          sR.path(cache.pts, { color: 'accent', width: 2.2 });
          sR.hline(cache.hr, { color: 'green', width: 2 });
          sR.hline(1, { color: 'faint', dash: true });
          sR.text(`entropy rate ${v.fix(cache.hr, 3)}`, 22, cache.hr, { dy: -9, size: 11.5, color: 'green', weight: 600, align: 'left' });
          const last = cache.pts[cache.pts.length - 1];
          sR.dot(last[0], last[1], { r: 5, color: 'gold' });
          info = { c: ph.length, n: text.length, shown, hr: cache.hr, last: last[1], bits: lz78Bits(ph.length, new Set(text).size || 1) };
        });
        v.readout(() => `Text of ${info.n} symbols → ${info.c} phrases (showing ${info.shown}); about $c(\\log_2c+\\log_2|\\mathcal A|)\\approx${v.fix(info.bits, 0)}$ bits against $${info.n}\\log_2|\\mathcal A|$ uncompressed (short texts do not compress: the dictionary has to be paid for). On the Markov sample, rate at $n=32768$ is $${v.fix(info.last, 3)}$ against the entropy rate $${v.fix(info.hr, 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Algorithm',
      name: 'Elias codes for the integers',
      statement: String.raw`For a positive integer $n$ with binary expansion of $\lfloor\log_2n\rfloor+1$ digits, write $L=\lfloor\log_2n\rfloor$.

**Elias gamma code** $\gamma(n)$: $L$ zeros followed by the binary expansion of $n$ (which starts with a 1); length $2L+1$.

**Elias delta code** $\delta(n)$: $\gamma(L+1)$ followed by the $L$ digits of $n$ after its leading 1; length $L+2\lfloor\log_2(L+1)\rfloor+1$.

Both are prefix codes for all positive integers at once (no bound on $n$ is needed), and $\sum_{n\ge1}2^{-|\gamma(n)|}=1$. They are universal codes: for any decreasing probability law on the integers the expected length is within a constant factor ($\gamma$) or $1+o(1)$ factor ($\delta$ with $H\to\infty$) of the entropy.`,
      idea: String.raw`A plain binary number is not self-delimiting: the decoder does not know where it stops. The gamma code fixes this by announcing the length first, in unary: $L$ zeros tell how many digits follow the first 1. That spends about $\log n$ bits on the number and another $\log n$ on its length. The delta code announces the length $L+1$ itself with the gamma code, which needs only $2\log\log n$ bits, so the total is $\log n+2\log\log n+O(1)$. Kraft's inequality (4.3) confirms the codes are prefix codes: $\gamma$ uses $2^L$ codewords of length $2L+1$ for each $L$, so $\sum_n2^{-|\gamma(n)|}=\sum_L2^L2^{-2L-1}=1$.

The gamma-code Kraft sum groups the $2^L$ integers with binary length $L+1$, each of code length $2L+1$. Their total contribution is $2^{-L-1}$. The geometric-series theorem pma-3.26 at ratio $1/2$ gives the full sum $1$ as $L$ runs from zero to infinity; its finite partial sum is $1-2^{-K-1}$ through level $K$. This checks the countably infinite Kraft mass, while the unary length field supplies the direct parsing argument.`,
      caption: String.raw`Choose an integer $n$ (log slider) and a code: its codeword is drawn with the unary length prefix in orange and the binary digits in blue. In the second box type several integers: their concatenated gamma/delta codewords form one bit stream with no separators, and the decoder reads it back, cutting it uniquely. Right: the codeword length against $n$ (log axis) for gamma, delta and plain binary; the gap above $\log_2n$ is the price of not knowing the size in advance.`,
      deps: ['info-4.3', 'pma-3.26'],
      refs: ['MacKay ch. 7'],
      tags: ['universal codes', 'integers'],
      credit: 'P. Elias, 1975 (IEEE Trans. Inform. Theory 21 (2): 194–203)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Elias_gamma_coding' },
      viz(v) {
        const nS = v.slider('integer $n$', 1, 1e6, 37, { int: true, log: true });
        const kind = v.select('code', [{ value: 'g', label: 'gamma $\\gamma$' }, { value: 'd', label: 'delta $\\delta$' }], 'g');
        const list = v.input('stream of integers', '5, 1, 12, 3, 40', { width: 200 });
        const sA = v.stage({ x: [0, 1], y: [0, 1], height: 150, axes: false, title: 'codeword of $n$', full: true });
        const sB = v.stage({ x: [0, 1], y: [0, 1], height: 200, axes: false, title: 'a stream of codewords and its decoding', minWidth: 320 });
        const sL = v.stage({ x: [1, 1e6], y: [0, 45], xlog: true, height: 200, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'length (bits)', title: 'codeword length', minWidth: 320 });
        let info = {};
        const lenG = (n) => 2 * lgx(n) + 1, lenD = (n) => { const L = lgx(n); return L + 2 * lgx(L + 1) + 1; };
        const cells = (st, str, x0, y, colors, cw) => { for (let i = 0; i < str.length; i++) { const c = colors(i); st.rect(x0 + i * cw + 0.1 * cw, y - 0.34, x0 + (i + 1) * cw - 0.1 * cw, y + 0.34, { fill: c, fillAlpha: 0.22, color: c, width: 1.3 }); st.text(str[i], x0 + (i + 0.5) * cw, y, { align: 'center', size: 13, weight: 700, color: 'ink', halo: false }); } };
        v.render(() => {
          const n = nS.value, k = kind.value, L = lgx(n), cw = 1 / 40;
          const word = k === 'g' ? gamma(n) : delta(n);
          sA.setView([0, Math.max(0.9, word.length * cw + 0.1) ], [-2.4, 1.2]);
          // colour roles
          const g1 = k === 'g' ? L : gamma(L + 1).length;
          const role = (i) => (k === 'g' ? (i < L ? 'orange' : 'accent') : (i < g1 ? (i < lgx(L + 1) ? 'orange' : 'purple') : 'accent'));
          cells(sA, word, 0.02, 0.1, role, cw);
          sA.text(k === 'g' ? `γ(${n}) = ${word}` : `δ(${n}) = ${word}`, 0.02, -0.85, { align: 'left', size: 14, weight: 700, color: 'ink' });
          sA.text(k === 'g' ? `${L} zero${L === 1 ? '' : 's'} announce the ${L + 1} binary digits of n = ${binStr(n)}` : `γ(${L + 1}) = ${gamma(L + 1)} announces the length ${L + 1}; then the ${L} digits of n after its leading 1`, 0.02, -1.6, { align: 'left', size: 12, color: 'muted' });
          // stream
          const ints = String(list.value).split(/[^0-9]+/).filter(Boolean).map((x) => clamp(parseInt(x, 10), 1, 1e6)).slice(0, 8);
          const enc = ints.map((m) => (k === 'g' ? gamma(m) : delta(m))); const stream = enc.join('');
          const dec = eliasDecode(stream, k);
          sB.setView([0, 1], [-4.2, 1.4]);
          const per = Math.min(48, Math.max(24, Math.floor(sB.width / 17))), c2 = 1 / per;
          let pos = 0; const ownerCol = []; enc.forEach((w, j) => { for (let i = 0; i < w.length; i++) ownerCol.push(COL[j % COL.length]); });
          for (let i = 0; i < stream.length && i < per * 3; i++) { const r = Math.floor(i / per), c = i % per, y = 0.55 - r * 0.85; sB.rect(c * c2 + 0.08 * c2, y - 0.32, (c + 1) * c2 - 0.08 * c2, y + 0.32, { fill: ownerCol[i], fillAlpha: 0.28, color: ownerCol[i], width: 1 }); sB.text(stream[i], (c + 0.5) * c2, y, { align: 'center', size: 11.5, weight: 700, color: 'ink', halo: false }); }
          sB.text(`decoded: ${dec.map((d) => d.v).join(', ')}`, 0.01, -3.4, { align: 'left', size: 13, weight: 700, color: dec.map((d) => d.v).join() === ints.join() ? 'green' : 'red' });
          sB.text(`${stream.length} bits for ${ints.length} integers${stream.length > per * 3 ? ' (first ' + per * 3 + ' shown)' : ''}`, 0.01, -2.9 + 0.1, { align: 'left', size: 11.5, color: 'muted' });
          // lengths
          const pts = (f) => Array.from({ length: 121 }, (_, i) => { const x = Math.round(Math.pow(1e6, i / 120)); return [Math.max(1, x), f(Math.max(1, x))]; });
          sL.path(pts(lenG), { color: 'orange', width: 2 }); sL.path(pts(lenD), { color: 'purple', width: 2 });
          sL.path(pts((x) => lgx(x) + 1), { color: 'muted', width: 1.4, dash: true }); sL.path(pts((x) => Math.log2(x)), { color: 'green', width: 1.4, dash: true });
          sL.dot(n, k === 'g' ? lenG(n) : lenD(n), { r: 6, color: 'gold' });
          info = { n, k, len: word.length, lg: lenG(n), ld: lenD(n), bin: L + 1, ok: dec.map((d) => d.v).join() === ints.join(), cnt: ints.length };
        });
        v.legend([['orange', 'gamma'], ['purple', 'delta'], ['muted', 'plain binary (not a prefix code)', { dash: true }], ['green', '$\\log_2 n$', { dash: true }]]);
        v.readout(() => `$n=${info.n}$: plain binary ${info.bin} bits, $|\\gamma(n)|=${info.lg}$, $|\\delta(n)|=${info.ld}$ (so $\\gamma$ implicitly gives $n$ the probability $2^{-${info.lg}}$, roughly $1/n^2$). Stream decoded correctly: ${info.ok ? '**yes**' : '**no**'}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Algorithm',
      name: 'Generating a distribution from fair coins (Knuth–Yao)',
      statement: String.raw`Let $p=(p_1,\dots,p_m)$ be a probability distribution and write $p_i=\sum_{j\ge1}b_{ij}2^{-j}$ with binary digits $b_{ij}\in\{0,1\}$ (the terminating expansion if there are two). Build a binary tree whose level $j$ has $\sum_ib_{ij}$ leaves, one labelled $i$ for each $i$ with $b_{ij}=1$, and all other nodes internal. Flipping a fair coin to walk down from the root and outputting the label of the leaf reached generates $X\sim p$ exactly, and this **discrete distribution generating (DDG) tree** is optimal: the expected number of fair flips $E$ satisfies
$$H(p)\ \le\ E\ <\ H(p)+2,$$
with $E=H(p)$ exactly when all $p_i$ are powers of $\frac12$. No scheme using fair bits can use fewer flips on average than the DDG tree (Knuth–Yao 1976).`,
      idea: String.raw`A leaf at depth $j$ is reached with probability $2^{-j}$, and outcome $i$ owns one leaf at each level where its $j$-th binary digit is 1, so its total probability is $\sum_jb_{ij}2^{-j}=p_i$: the tree is exact. The tree's leaves form a prefix code (4.3) whose "probabilities" are $2^{-\text{depth}}$, and the number of flips is a codeword length. The lower bound $E\ge H$ is the source coding bound (4.5) run backwards: coin flips are a code for the output $X$. For the upper bound, outcome $i$ has a leaf at depth $\approx\log\frac1{p_i}$ plus the excess caused by the later digits, which a counting argument bounds by two extra flips on average.`,
      caption: String.raw`Drag the bars to choose a target distribution on 2–5 outcomes (or use a preset). The tree is built level by level from the binary digits of the probabilities (leaves coloured by outcome, grey nodes continue downward; only the first 9 levels are drawn). Press Flip to run the generator once, with a fair coin: the path taken is highlighted. The right panel compares the output frequencies of 4000 runs with the target and the mean number of flips with the entropy and $H+2$.`,
      deps: ['info-4.3', 'info-1.2'],
      refs: ['Cover–Thomas §5.11'],
      tags: ['random generation', 'entropy'],
      credit: 'D. E. Knuth & A. C. Yao, 1976 ("The complexity of nonuniform random number generation", in Algorithms and Complexity, Academic Press, 357–428)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fast_Dice_Roller' },
      viz(v) {
        const nS = v.slider('outcomes', 2, 6, 3, { int: true });
        const ed = barEd(v, { title: 'target distribution (drag)', p: [0.5, 0.3, 0.2], height: 190, minWidth: 260, weight: 0.8 });
        v.button('Uniform', () => { ed.p = Array.from({ length: nS.value }, () => 1 / nS.value); });
        v.button('Dyadic', () => { const n = nS.value; ed.p = Array.from({ length: n }, (_, i) => Math.pow(2, -Math.min(i + 1, n - 1))); });
        let seed = 21, flipN = 0; v.button('Flip', () => { flipN++; });
        const sT = v.stage({ x: [-0.4, 9.4], y: [-6, 1], height: 320, axes: false, title: 'the DDG tree', minWidth: 380, weight: 1.5 });
        const sH = v.stage({ x: [-0.6, 5.6], y: [0, 1], height: 250, axes: 'box', gutter: true, title: 'output of 4000 runs', ylabel: 'frequency', minWidth: 300 });
        let last = 3, info = {};
        const J = 44;
        const build = (p) => {
          const bits = p.map((x) => { const b = []; let f = x; for (let j = 0; j < J; j++) { f *= 2; if (f >= 1 - 1e-12) { b.push(1); f -= 1; } else b.push(0); } return b; });
          const levels = []; let d = 1;
          for (let j = 0; j < J; j++) {
            const leaves = []; p.forEach((_, i) => { if (bits[i][j]) leaves.push(i); });
            const total = 2 * d; levels.push({ leaves, d: total - leaves.length, total }); d = total - leaves.length;
            if (d <= 0) break;
          }
          return levels;
        };
        v.render(() => {
          if (nS.value !== last) { last = nS.value; ed.p = resizeP(ed.p, last); }
          const p = ed.p, m = p.length, Hh = H(p);
          ed.draw({ values: true, alpha: 0.45 });
          const levels = build(p);
          let Eflips = 0; levels.forEach((lv, j) => { Eflips += (j + 1) * lv.leaves.length * Math.pow(2, -(j + 1)); });
          // simulate
          const r = v.rng(hashStr(`${p.join()}|${seed}`)); const T = 4000, cnt = new Array(m).fill(0); let flips = 0;
          const walk = (rr) => { let cur = 0, fl = 0; for (let j = 0; j < levels.length; j++) { const idx = 2 * cur + (rr() < 0.5 ? 0 : 1); fl++; const lv = levels[j]; if (idx < lv.leaves.length) return { out: lv.leaves[idx], fl, path: null }; cur = idx - lv.leaves.length; } return { out: 0, fl, path: null }; };
          for (let i = 0; i < T; i++) { const w = walk(r); cnt[w.out]++; flips += w.fl; }
          // tree drawing, first 9 levels
          const DR = Math.min(9, levels.length);
          const maxn = Math.max(...levels.slice(0, DR).map((lv) => lv.total), 2);
          sT.setView([-0.5, DR + 0.5], [-(maxn - 0.5), 1.2]);
          // single run path
          const rr1 = v.rng(hashStr(`flip|${flipN}|${p.join()}`)); let cur = 0, pathPts = [[0, 0]], res = null;
          const nodeY = (j, idx, tot) => -(idx + (maxn - tot) / 2) * 1; // centred per level
          const posOf = (j, idx) => { const lv = levels[j - 1]; return [j, nodeY(j, idx, lv.total)]; };
          let curIdx = 0; let curPos = [0, nodeY(0, 0, 1)];
          if (flipN > 0) { for (let j = 0; j < levels.length; j++) { const idx = 2 * cur + (rr1() < 0.5 ? 0 : 1), lv = levels[j]; if (j < DR) pathPts.push(posOf(j + 1, idx)); if (idx < lv.leaves.length) { res = { out: lv.leaves[idx], fl: j + 1 }; break; } cur = idx - lv.leaves.length; } }
          let prevInternal = [[0, nodeY(0, 0, 1)]];
          for (let j = 1; j <= DR; j++) {
            const lv = levels[j - 1], nxt = [];
            for (let k = 0; k < lv.total; k++) {
              const par = prevInternal[Math.floor(k / 2)]; if (!par) continue; const q = posOf(j, k);
              sT.line(par[0], par[1], q[0], q[1], { color: 'faint', width: 1.2 });
              if (k < lv.leaves.length) { const o = lv.leaves[k]; sT.rect(q[0] - 0.22, q[1] - 0.3, q[0] + 0.22, q[1] + 0.3, { fill: COL[o % COL.length], fillAlpha: 0.55, color: COL[o % COL.length], width: 1.4, radius: 3 }); sT.text(LET[o], q[0], q[1], { align: 'center', size: 11.5, weight: 700, color: 'ink', halo: false }); }
              else { sT.dot(q[0], q[1], { r: 4.5, color: 'muted' }); nxt.push(q); }
            }
            prevInternal = nxt;
          }
          sT.dot(0, nodeY(0, 0, 1), { r: 6, color: 'ink' });
          if (flipN > 0) sT.path(pathPts, { color: 'gold', width: 3.2 });
          if (levels.length > DR) sT.text('… continues', DR + 0.4, -(maxn - 0.5) + 0.3, { align: 'right', size: 11, color: 'muted' });
          // histogram
          sH.setView([-0.6, m - 0.4], [0, Math.max(0.2, Math.max(...p, ...cnt.map((c) => c / T)) * 1.18)]); sH.setTicks(p.map((_, i) => [i, LET[i]]), null);
          p.forEach((x, i) => { sH.rect(i - 0.36, 0, i - 0.02, x, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1 }); sH.rect(i + 0.02, 0, i + 0.36, cnt[i] / T, { fill: 'green', fillAlpha: 0.45, color: 'green', width: 1 }); });
          info = { Hh, E: Eflips, mean: flips / T, res, T, depthTerm: levels.length < J };
        });
        v.legend([['accent', 'target $p$', { area: true }], ['green', 'empirical (4000 runs)', { area: true }], ['gold', 'one run (Flip)']]);
        v.readout(() => `$H(p)=${v.fix(info.Hh, 3)}$ ≤ expected flips $E=${v.fix(info.E, 3)}$ < $H+2=${v.fix(info.Hh + 2, 3)}$${info.depthTerm ? ' (finite tree: all $p_i$ are dyadic rationals)' : ''}; mean over ${commas(info.T)} runs: $${v.fix(info.mean, 3)}$.` + (info.res ? ` Last Flip: outcome **${LET[info.res.out]}** after ${info.res.fl} coin flip${info.res.fl === 1 ? '' : 's'}.` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.16
    {
      num: '4.16',
      kind: 'Theorem',
      name: 'Kolmogorov complexity and entropy',
      statement: String.raw`Fix a universal **conditional prefix machine** and a known finite alphabet $\mathcal X$ of size $m$. Let $K(x\mid n)$ be the length of its shortest self-delimiting program that prints $x$, with $n$ supplied for free. For $n\ge1$ i.i.d. symbols $X_1,\dots,X_n$ with any law $P$ on $\mathcal X$, there is a constant $c$ depending on the machine and fixed alphabet, but not on $n$ or $P$, such that
$$nH(P)\;\le\;\mathbb E\,K(X^n\mid n)\;\le\;nH(P)+m\lceil\log_2(n+1)\rceil+1+c.$$
Consequently $\mathbb E K(X^n\mid n)/n\to H(P)$. This is an **expectation** theorem, not a pointwise complexity estimate for each string. The alphabet and its representation are fixed; for a binary source $H(P)=h(p)$.`,
      idea: String.raw`For fixed $n$, shortest prefix programs for different outputs form a prefix code, so the source-coding inequality gives the lower bound. For the upper bound, encode all $m$ type counts in $m\lceil\log_2(n+1)\rceil$ bits, followed by the string's rank among the $M_T$ strings of its type in $\lceil\log_2M_T\rceil$ bits (zero if $M_T=1$). Given $n$, the count field has fixed length and fixes the rank-field length, so this is a conditional prefix code. Every positive-probability type is uniform under an i.i.d. law; hence $\mathbb E\log_2M_T=H(X^n\mid T)\le H(X^n)=nH(P)$. A fixed decoder contributes $c$, giving the bound without a typical-sequence assumption or knowledge of $P$. A compressor yields $K(x\mid n)\le\ell(x)+c_{\rm decoder}$ only when its description is conditionally prefix-decodable; the decoder constant is generally unknown.`,
      caption: String.raw`Choose a length and a followed coin bias, switch between two **seeded simulations**, and press Resample to change the seed. The left panel uses one string at each bias; the right panel uses prefixes of one string at the followed bias. Green is the ideal i.i.d. entropy. Orange is a constructive prefix-length bound for the add-half (KT) predictive distribution $Q$: $\lceil-\log_2Q(x)\rceil+1$, computed with exact integer rounding; these KT codewords are not emitted here. Purple is the actual bit length of a custom binary LZ78 parent/symbol pair code, decoded with $n$ known. Finite curves can lie above or below entropy; only the theorem concerns an ideal i.i.d. expectation.`,
      deps: ['toc-11.11', 'info-3.1'],
      refs: ['Grünwald–Vitányi, Algorithmic Information Theory (2007), Definition 6, p. 16; Theorem 10, p. 21 (computable distributions); elementary conditional type-class adaptation above'],
      tags: ['Kolmogorov complexity', 'entropy'],
      credit: 'Origins of algorithmic complexity: R. J. Solomonoff (1964), A. N. Kolmogorov (1965), G. J. Chaitin (1966); see Grünwald–Vitányi (2007), §1',
      scope: String.raw`The stated finite-alphabet conditional bound is derived by the displayed type-class code; it does not require computability of $P$. The source's Theorem 10 instead states the unconditional computable-distribution bound with overhead $K(P)+O(1)$. In the illustration, KT's fractional ideal loss is not an emitted code length. Its displayed integer bound uses a Shannon–Fano–Elias midpoint prefix construction; LZ78 emits real bit pairs and stops after the known $n$ decoded symbols. Each gives an upper bound on $K$ only after its own fixed decoder constant is added. Both browser generators are deterministic: with fixed bias, algorithm and seed, their prefixes have $K(x^n\mid n)\le C$ for an unspecified constant. Neither curve estimates actual $K$, and no numerical value is assigned to $C$.`,
      links: { source: 'https://homepages.cwi.nl/~pdg/ftp/HPI.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Kolmogorov_complexity' },
      viz(v) {
        const nS = v.slider('length $n$', 100, 20000, 4000, { int: true, step:100 });
        const pS = v.slider('followed bias $p$', 0.02, 0.5, 0.15, { step: 0.01 });
        const src = v.select('seeded generator', [{ value: 'coin', label: 'coin-model simulation' }, { value: 'prng', label: 'xorshift simulation' }], 'coin');
        let seed = 9; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [0, 0.52], y: [0, 1.5], height: 310, axes: 'box', gutter: true, xlabel: 'bias p', ylabel: 'bits per symbol', title: 'description lengths, one string per bias', minWidth: 320 });
        const s2 = v.stage({ x: [100, 20000], y: [0, 1.5], xlog: true, height: 310, axes: 'box', gutter: true, xlabel: 'known length n', ylabel: 'bits per symbol', title: 'prefixes at the followed bias', minWidth: 320 });
        let cache = null, info = null;
        v.render(() => {
          const n = nS.value, p = pS.value, mode = src.value, key = `${n}|${p}|${mode}|${seed}`;
          if (!cache || cache.key !== key) cache = {key,...complexityPlotData(n,p,mode,seed)};
          const high1 = Math.max(1.05,...cache.grid.flatMap(q => [q.kt,q.lz]))*1.08;
          const high2 = Math.max(1.05,...cache.curve.flatMap(q => [q.kt,q.lz]))*1.08;
          s1.setView([0,.52],[0,high1]); s2.setView([100,20000],[0,high2]);
          s1.path(Array.from({length:53},(_,i) => [i/100,h2(i/100)]),{color:'green',width:2.2});
          for (const [field,color] of [['kt','orange'],['lz','purple']]) {
            const grid = cache.grid.map(q => [q.p,q[field]]), curve = cache.curve.map(q => [q.n,q[field]]);
            s1.path(grid,{color,width:1.5,alpha:.8}); s1.dots(grid,{color,r:3.5});
            s2.path(curve,{color,width:2});
            s2.dot(n,cache.selected[field],{color,r:4.5});
          }
          s1.vline(p,{color:'faint',dash:true}); s2.vline(n,{color:'faint',dash:true});
          s2.hline(h2(p),{color:'green',width:2.2});
          info = {n,p,h:h2(p),...cache.selected,seed};
        });
        v.legend([['green','ideal i.i.d. entropy $h(p)$'],['orange','KT constructive prefix bound'],['purple','emitted LZ78 pair bits']]);
        v.readout(() => info && String.raw`At $p=${v.fix(info.p,2)}$ and $n=${info.n}$: entropy $h(p)=${v.fix(info.h,3)}$; KT ideal loss $${v.fix(info.ideal,3)}$, constructive prefix bound $${v.fix(info.kt,3)}$, emitted LZ78 length $${v.fix(info.lz,3)}$ bits/symbol. Seed ${info.seed}. To bound $K/n$, add each decoder's unknown constant divided by $n$. Both plotted sources are seeded; fixed settings have a constant-size conditional generator description, whose size is not measured here.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.17
    {
      num: '4.17',
      kind: 'Paper',
      name: 'A Universal Algorithm for Sequential Data Compression',
      paper: { authors: 'Jacob Ziv and Abraham Lempel', year: 1977, title: 'A Universal Algorithm for Sequential Data Compression', venue: 'IEEE Transactions on Information Theory 23 (3): 337–343', doi: '10.1109/TIT.1977.1055714' },
      introduces: ['info-4.13'],
      statement: String.raw`Ziv and Lempel presented a compression algorithm that needs no knowledge of the source: it keeps a **sliding window** of the most recent symbols and, at each step, replaces the longest string starting at the current position that already occurs in the window by a **pointer** to it, written as a (distance back, length, next symbol) triple. The paper investigates its performance not for a probabilistic source but for individual sequences, relative to the best that finite-state (block-to-variable and variable-to-block) coders designed for a completely known source could do. In their words, the compression ratio achieved by the universal code **uniformly approaches the lower bounds** attainable by such codes. The later probabilistic reading (4.13) is that for a stationary ergodic source the compression rate tends to the entropy rate.`,
      idea: String.raw`Before 1977 practical compression meant a code tailored to the source's measured statistics (Shannon–Fano, Huffman, 4.5) or an adaptive scheme with a probability model (arithmetic coding, 4.12). The paper's idea is that a sequence which repeats itself can be described by pointing at its own past: no probabilities are estimated at all. A match of length $\ell$ costs about $\log(\text{window})+\log\ell$ bits however long $\ell$ is, and for a source of entropy rate $\mathcal H$ the longest match at a typical position has length about $\log(\text{window})/\mathcal H$, which makes the cost per symbol tend to $\mathcal H$. This paper (LZ77) and its tree-structured companion of 1978 (LZ78) are the ancestors of GIF, DEFLATE (zip, gzip, PNG) and their relatives.`,
      caption: String.raw`Type or paste text (up to 120 characters), choose the window size $W$, and step through the parse. At each position the algorithm looks back over the window (shaded) for the longest string that starts at the cursor (it may even run on past the cursor: a "self-overlapping" match), shown as a green copy with an arrow from its source and the new symbol in orange; the emitted triple (distance, length, next symbol) is listed. A 120-character text is far too short to approach any limit, so the lower panel runs a faster version of the same parser (matches of fewer than 6 symbols are sent as literals) on a long binary Markov sample (flip probabilities $a,b$) with an Elias-gamma-coded length and a $\lceil\log_2W\rceil$-bit distance, for four window sizes, and plots bits per symbol against the entropy rate. This is a modern minimal re-implementation with my own code for the triples, not a reproduction of the paper's code or tables; the curves fall toward the entropy rate as the window grows, but slowly.`,
      deps: ['info-4.5', 'info-3.11'],
      refs: [],
      tags: ['Lempel–Ziv', 'universal coding', 'history'],
      credit: 'Ziv & Lempel, 1977',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/LZ77_and_LZ78' },
      viz(v) {
        const txt = v.input('text', 'she sells sea shells by the sea shore, the shells she sells are sea shells for sure', { width: 340 });
        const wS = v.slider('window $W$', 4, 64, 32, { int: true, log: true });
        const stepS = v.slider('step', 0, 60, 9, { int: true });
        const aS = v.slider('flip prob. $a$ (0→1)', 0.01, 0.4, 0.03, { step: 0.01 });
        const bS = v.slider('flip prob. $b$ (1→0)', 0.01, 0.4, 0.06, { step: 0.01 });
        let seed = 77; v.button('Resample source', () => { seed++; });
        const sA = v.stage({ x: [0, 1], y: [0, 1], height: 230, axes: false, title: 'sliding-window parse', full: true });
        const sR = v.stage({ x: [100, 60000], y: [0, 1.4], xlog: true, height: 290, axes: 'box', gutter: true, xlabel: 'sample length n', ylabel: 'bits per symbol', title: 'LZ77 rate on a binary Markov source, four window sizes', full: true });
        const WS = [32, 256, 2048, 16384], WC = ['red', 'orange', 'teal', 'accent'];
        // brute-force longest match (for the short text)
        const parse = (x, W, Lmax) => {
          const n = x.length, out = []; let i = 0;
          while (i < n) {
            let bestL = 0, bestD = 0;
            for (let s = Math.max(0, i - W); s < i; s++) { let k = 0; while (k < Lmax && i + k < n - 1 && x[s + k] === x[i + k]) k++; if (k > bestL) { bestL = k; bestD = i - s; } }
            out.push({ pos: i, d: bestD, l: bestL, ch: x[i + bestL] }); i += bestL + 1;
          }
          return out;
        };
        // hash-bucket parse for long binary strings: matches shorter than MINL are sent as literals
        const MINL = 6, gam = (m) => 2 * lgx(m) + 1;
        const fastCost = (x, W) => {
          const n = x.length, buckets = Array.from({ length: 1 << MINL }, () => []), ends = [], cum = []; let i = 0, tot = 0, ins = 0;
          const key = (j) => { let k = 0; for (let t = 0; t < MINL; t++) k = (k << 1) | x[j + t]; return k; };
          while (i < n) {
            let bestL = 0;
            if (i + MINL < n) {
              const lst = buckets[key(i)];
              for (let t = lst.length - 1; t >= 0 && lst[t] >= i - W; t--) { const s = lst[t]; let k = 0; while (i + k < n - 1 && x[s + k] === x[i + k]) k++; if (k > bestL) bestL = k; }
            }
            if (bestL < MINL) bestL = 0;
            tot += gam(bestL + 1) + (bestL > 0 ? Math.ceil(log2(Math.max(2, Math.min(W, i)))) : 0) + 1;
            const nxt = i + bestL + 1;
            for (; ins < nxt && ins + MINL <= n; ins++) buckets[key(ins)].push(ins);
            ins = Math.max(ins, nxt); i = nxt; ends.push(Math.min(n, nxt)); cum.push(tot);
          }
          return { ends, cum };
        };
        let cache = null, info = {};
        v.render(() => {
          const text = String(txt.value).slice(0, 120), W = wS.value;
          const T = parse(text, W, 64), shown = Math.min(stepS.value, T.length);
          const per = 40, rows = Math.max(1, Math.ceil(text.length / per)), RS = 1.7;
          sA.setView([-0.4, per + 0.4], [-(rows - 1) * RS - 0.8, 1.0]);
          const cur = shown < T.length ? T[shown] : null, start = cur ? cur.pos : text.length;
          const cell = (i) => [i % per, -Math.floor(i / per) * RS];
          const own = new Array(text.length).fill(-1); T.slice(0, shown).forEach((t, k) => { for (let i = t.pos; i <= Math.min(text.length - 1, t.pos + t.l); i++) own[i] = k; });
          for (let i = 0; i < text.length; i++) {
            const [c, y] = cell(i), inW = cur && i >= cur.pos - W && i < cur.pos;
            const isMatch = cur && i >= cur.pos && i < cur.pos + cur.l, isNew = cur && i === cur.pos + cur.l, isSrc = cur && cur.l > 0 && i >= cur.pos - cur.d && i < cur.pos - cur.d + cur.l;
            let col = isNew ? 'orange' : isMatch || isSrc ? 'green' : inW ? 'accent' : null, fa = isSrc ? 0.4 : isMatch || isNew ? 0.5 : 0.12;
            if (!col && own[i] >= 0) { col = 'muted'; fa = own[i] % 2 ? 0.1 : 0.22; }
            sA.rect(c + 0.03, y - 0.5, c + 0.97, y + 0.5, { fill: col || false, fillAlpha: fa, color: col || 'faint', width: isMatch || isNew || isSrc ? 2 : 1 });
            sA.text(text[i] === ' ' ? '␣' : text[i], c + 0.5, y, { align: 'center', size: 13, weight: 600, color: i < start || col ? 'ink' : 'muted', halo: false });
          }
          if (cur && cur.l > 0) { const [c1, y1] = cell(cur.pos - cur.d), [c2, y2] = cell(cur.pos); sA.arrow(c1 + 0.5, y1 - 0.58, c2 + 0.5, y2 - 0.58, { color: 'green', width: 2 }); }
          // long runs
          const key = `${aS.value}|${bS.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const NN = 60000, x = markovBits(NN, aS.value, bS.value, v.rng(hashStr(key)));
            const curves = WS.map((Wl) => { const r = fastCost(x, Wl), pts = []; let j = 0; for (let e = 0; e <= 30; e++) { const n = Math.round(100 * Math.pow(600, e / 30)); while (j < r.ends.length - 1 && r.ends[j] < n) j++; pts.push([n, r.cum[j] / r.ends[j]]); } return pts; });
            cache = { key, curves, hr: markovRate(aS.value, bS.value) };
          }
          sR.hline(1, { color: 'faint', dash: true });
          cache.curves.forEach((pts, k) => sR.path(pts, { color: WC[k], width: 2 }));
          sR.hline(cache.hr, { color: 'green', width: 2.4 });
          sR.text(`entropy rate ${v.fix(cache.hr, 3)}`, 110, cache.hr, { dy: -9, align: 'left', size: 11.5, color: 'green', weight: 600 });
          info = { n: text.length, T: T.length, shown, hr: cache.hr, ends: cache.curves.map((p) => p[p.length - 1][1]), cur, list: T.slice(0, shown).map((t) => `(${t.d},${t.l},${t.ch === undefined ? '∅' : t.ch === ' ' ? '␣' : t.ch})`) };
        });
        v.legend([['red', '$W=32$'], ['orange', '$W=256$'], ['teal', '$W=2048$'], ['accent', '$W=16384$'], ['green', 'entropy rate']]);
        v.readout(() => `Text: ${info.n} symbols → ${info.T} triples (distance, length, next symbol); emitted so far: ${info.list.slice(-8).join(' ') || 'none'}` + (info.cur ? `. Next phrase: copy ${info.cur.l} symbol${info.cur.l === 1 ? '' : 's'} from ${info.cur.d} back, then “${info.cur.ch === ' ' ? '␣' : info.cur.ch}”.` : '.') + `\nBinary Markov sample, $n=60000$, rate with $W=32,256,2048,16384$: $${info.ends.map((x) => v.fix(x, 2)).join(', ')}$ bits per symbol against the entropy rate $${v.fix(info.hr, 3)}$: the larger the window, the closer, but the overhead of the pointers shrinks only like $1/\\log W$.`);
      },
    },
  ],
};
