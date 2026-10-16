// Information & Coding Theory — Chapter 4: Source coding and data compression (items 4.1–4.5 here; 4.6–4.12 in ch04-b.js; 4.13–4.17 in ch04-c.js)
//
// House style as in chapters 1–3: bits, log base 2; the source p is blue, codes and bounds orange, optimal / success green,
// failures red. Everything shown is computed (Huffman, Sardinas–Patterson, polynomial powers), never drawn by hand.
// Credits were checked in Oct 2026: Kraft 1949 (MIT M.S. thesis record, DSpace), Sardinas–Patterson 1953 (IRE Convention
// Record 8, 104–108, from secondary citations), McMillan 1956 (Crossref), Shannon 1948 and Huffman 1952 (Crossref).

import { clamp, sum, H, KL, hashStr, LET, barEd, resizeP, shannonLens, expLen, kraft, huffLens, canon, parseBook, parses, sardinasPatterson,
  PRESETS, drawTree, nodeX, nodeY, pw2, log2, mono } from './ch04.shared.js';

const SEG = ['accent', 'orange', 'teal', 'purple', 'pink'];
const PRE = {
  prefix: ['prefix', '0, 10, 110, 111', '10110111'],
  suffix: ['suffix code (UD, not prefix)', '0, 01, 11', '0110111'],
  ud: ['UD, not prefix', '0, 01, 011, 111', '01101110'],
  amb: ['ambiguous', '0, 01, 10', '010'],
  amb2: ['ambiguous (longer)', '1, 10, 01, 011', '10011'],
  sing: ['singular', '0, 0, 10', '010'],
};
const presetOpts = Object.entries(PRE).map(([k, a]) => ({ value: k, label: a[0] }));
const classify = (book) => {
  const uniq = new Set(book);
  const singular = uniq.size < book.length;
  const sp = sardinasPatterson([...uniq]);
  let prefix = !singular;
  if (prefix) { const C = [...uniq]; for (let i = 0; i < C.length && prefix; i++) for (let j = 0; j < C.length; j++) if (i !== j && C[j].startsWith(C[i])) { prefix = false; break; } }
  return { singular, ud: !singular && sp.ud, prefix, sp };
};
/** Codebook + message controls shared by 4.1 and 4.2. */
function bookUI(v, def, withBits) {
  const st = { bookStr: PRE[def][1], bits: PRE[def][2] };
  let book, bitsIn;
  const sel = v.select('example', presetOpts, def, {
    onChange: (k) => { st.bookStr = PRE[k][1]; book.set(PRE[k][1]); if (withBits) { st.bits = PRE[k][2]; bitsIn.set(PRE[k][2]); } v.invalidate(); },
  });
  book = v.input('codebook', PRE[def][1], { width: 200, onChange: () => { st.bookStr = book.value; } });
  if (withBits) bitsIn = v.input('bit stream', PRE[def][2], { width: 200, onChange: () => { st.bits = bitsIn.value; } });
  st.get = () => ({ book: parseBook(book.value), bits: withBits ? String(bitsIn.value).replace(/[^01]/g, '').slice(0, 24) : '' });
  return st;
}
/** Draw a bit string as cells at x = i..i+1 on row y and segmentations (lists of words) below it. */
function drawParses(v, s, bits, list, total, { y0 = 0, maxRows = 5, bitColor = 'ink' } = {}) {
  const n = bits.length;
  for (let i = 0; i < n; i++) {
    s.rect(i + 0.04, y0 - 0.45, i + 0.96, y0 + 0.45, { color: 'faint', width: 1.2, fill: 'panel', fillAlpha: 0.0 });
    s.text(bits[i], i + 0.5, y0, { align: 'center', size: 14, weight: 700, color: bitColor, halo: false });
  }
  list.slice(0, maxRows).forEach((words, r) => {
    const y = y0 - 1.25 * (r + 1); let x = 0;
    words.forEach((w, k) => {
      const col = SEG[k % SEG.length];
      s.rect(x + 0.04, y - 0.42, x + w.length - 0.04, y + 0.42, { color: col, width: 1.5, fill: col, fillAlpha: 0.2, radius: 4 });
      s.text(w, x + w.length / 2, y, { align: 'center', size: 13, weight: 600, color: 'ink', halo: false });
      x += w.length;
    });
  });
  if (total > maxRows) s.text(`… and ${total - maxRows >= 1e6 ? 'many' : total - maxRows} more`, 0.2, y0 - 1.25 * (maxRows + 1), { size: 12, color: 'muted' });
  return list.length;
}

export default {
  collection: 'info',
  chapter: 4,
  title: 'Source coding and data compression',
  summary: String.raw`A prefix code can be decoded instantly, and the Kraft inequality says exactly which codeword lengths prefix codes can have; McMillan showed uniquely decodable codes can do no better. The source coding theorem pins the optimal expected length within one bit of the entropy, Huffman’s greedy algorithm attains the optimum, and arithmetic and block coding remove the remaining overhead. Universal schemes like Lempel–Ziv approach the entropy rate without knowing the source, and Kolmogorov complexity measures the same quantity one string at a time.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Nonsingular, uniquely decodable and prefix codes',
      statement: String.raw`A **(binary symbol) code** for a source alphabet $\mathcal X$ is a map $C:\mathcal X\to\{0,1\}^*$; $C(x)$ is the codeword of $x$ and $\ell(x)=|C(x)|$ its length. The code is

(a) **nonsingular** if $C$ is injective (different symbols get different codewords);

(b) **uniquely decodable** (UD) if its extension $C(x_1x_2\cdots x_n)=C(x_1)C(x_2)\cdots C(x_n)$ is injective on all finite strings, that is, every concatenation of codewords can be split into codewords in only one way;

(c) a **prefix code** (instantaneous) if no codeword is a prefix of another.

Every prefix code is UD and every UD code is nonsingular, and neither implication reverses. A prefix code can be decoded on the fly: the moment a codeword has been read it can be output, with no look-ahead.`,
      idea: String.raw`The chain of implications is short: if codewords are never prefixes of one another, then from the start of a stream exactly one codeword can match, so the first symbol is determined, and the argument repeats; hence prefix $\Rightarrow$ UD. Taking one-symbol strings shows UD $\Rightarrow$ nonsingular. For the converses, $\{0,\,01,\,11\}$ is UD but not prefix (after reading a $0$ the decoder cannot yet tell whether the word is $0$ or the start of $01$, but one more bit settles it, and no string has two parses), and $\{0,\,01,\,10\}$ is nonsingular but not UD, since $010=0\cdot10=01\cdot0$. Whether a given finite code is UD is decided by the Sardinas–Patterson test (4.2).`,
      caption: String.raw`Choose an example codebook or type your own (words in $\{0,1\}$ separated by commas) and a bit stream of up to 24 bits. Every way of cutting the stream into codewords is drawn as a row of coloured pieces. A prefix code always yields at most one row; an ambiguous code gives several rows for one stream (red); and a stream that no concatenation can produce gives none. The readout classifies the code.`,
      deps: ['toc-1.1'],
      refs: ['Cover–Thomas §5.1', 'MacKay ch. 5'],
      tags: ['prefix codes', 'unique decodability'],
      credit: 'Terminology as in Cover & Thomas (the classes were studied from Shannon, 1948, onward)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prefix_code' },
      viz(v) {
        const ui = bookUI(v, 'amb', true);
        const s = v.stage({ x: [-0.4, 24.4], y: [-7.6, 1], height: 300, axes: false, title: 'every way to cut the stream into codewords' });
        let info = {};
        v.render(() => {
          const { book, bits } = ui.get();
          const cl = classify(book), P = parses(book, bits, 6);
          s.setView([-0.4, Math.max(bits.length, 12) + 0.4], [-7.6, 1]);
          drawParses(v, s, bits, P.list, P.total, { y0: 0, maxRows: 5, bitColor: 'ink' });
          if (!bits.length) s.text('type a bit stream', 12, -3, { align: 'center', color: 'muted' });
          else if (P.total === 0) s.text('no parse: the stream is not a concatenation of codewords', 6, -3, { align: 'center', color: 'red', size: 13, weight: 600 });
          else if (P.total > 1) s.text(`${P.total >= 1e6 ? 'many' : P.total} parses: the stream is ambiguous`, 12, -6.9, { align: 'center', color: 'red', size: 13, weight: 600 });
          else s.text('exactly one parse', 12, -6.9, { align: 'center', color: 'green', size: 13, weight: 600 });
          info = { cl, n: book.length, total: P.total, book, bits };
        });
        v.readout(() => {
          const c = info.cl;
          if (!info.n) return 'Enter at least one codeword.';
          const lab = (b, t, f) => (b ? `**${t}**` : f);
          return `Code $\\{${info.book.join(',\\,')}\\}$: ${lab(!c.singular, 'nonsingular', 'singular (a repeated codeword)')}; ${lab(c.ud, 'uniquely decodable', 'not uniquely decodable')}; ${lab(c.prefix, 'prefix', 'not prefix')}.\nThe stream has ${info.total >= 1e6 ? 'very many' : info.total} parse${info.total === 1 ? '' : 's'}${info.total > 1 && c.ud ? ' (impossible for a UD code, a bug!)' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Algorithm',
      name: 'Sardinas–Patterson test for unique decodability',
      statement: String.raw`Let $C$ be a finite set of nonempty binary words. Define the sets of **dangling suffixes**
$$S_1=\{\,w:\ uw=v\ \text{for some distinct } u,v\in C\,\},\qquad S_{k+1}=\{\,w:\ cw\in S_k\text{ or }sw\in C\ \text{for some } c\in C,\ s\in S_k\,\}.$$
Then $C$ is uniquely decodable **if and only if** no $S_k$ contains a codeword. The sets are subsets of the finite set of suffixes of codewords, so some $S_k$ is empty or repeats an earlier set after finitely many rounds, and the test terminates. If some $S_k$ contains a codeword, the construction yields a string with two different parses.`,
      idea: String.raw`A dangling suffix records the amount by which one parse of a string runs ahead of another: $S_1$ is what is left when one codeword begins another. Each further codeword that the lagging parse adds either fits inside the suffix (a shorter suffix remains) or overshoots it (the roles swap and a new suffix remains). The two parses can be brought level, which is exactly an ambiguity, precisely when the leftover suffix is itself a codeword. If this never happens and the leftover sets die out or cycle, no ambiguity exists. Tracking which codewords were used gives the explicit pair of parses.`,
      caption: String.raw`Pick an example or type a codebook. Move the slider to reveal the dangling-suffix sets $S_1,S_2,\dots$ one round at a time; a suffix that is itself a codeword turns red and stops the test. For an ambiguous code the two conflicting parses of the same string are drawn underneath (the strings are assembled from the recorded history of the construction). A prefix code has $S_1=\varnothing$ at once.`,
      deps: ['info-4.1'],
      refs: ['MacKay ch. 5'],
      tags: ['unique decodability', 'algorithm'],
      credit: 'A. A. Sardinas & G. W. Patterson, 1953 (IRE Convention Record 8, 104–108; earlier Univ. of Pennsylvania report, 1950)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sardinas%E2%80%93Patterson_algorithm' },
      viz(v) {
        const ui = bookUI(v, 'amb2', false);
        const step = v.slider('rounds shown', 1, 8, 8, { int: true });
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 300, axes: false, title: 'dangling suffixes round by round' });
        const sb = v.stage({ x: [-0.4, 24.4], y: [-3.2, 1], height: 150, axes: false, title: 'two parses of one string' });
        let info = {};
        const chip = (txt, x, y, bad, w) => {
          s.rect(x, y - 3, x + w, y + 3, { color: bad ? 'red' : 'accent', width: 1.4, fill: bad ? 'red' : 'accent', fillAlpha: bad ? 0.25 : 0.1, radius: 5 });
          s.text(txt, x + w / 2, y, { align: 'center', size: 12.5, weight: 600, color: bad ? 'red' : 'ink', halo: false });
        };
        v.render(() => {
          const { book } = ui.get(); const C = [...new Set(book)];
          const r = sardinasPatterson(C), isC = new Set(C);
          const shown = Math.min(step.value, r.rounds.length), upx = 100 / Math.max(300, s.width);
          s.text('code', 1, 95, { size: 12, color: 'muted', weight: 600 });
          C.slice(0, 10).forEach((w, i) => chip(w, 1, 87 - i * 8.2, false, Math.max(7, (w.length * 8 + 14) * upx)));
          const colW = Math.min(18, 80 / Math.max(2, Math.min(shown, 8)));
          for (let k = 0; k < shown; k++) {
            const X = 22 + k * colW, set = r.rounds[k];
            s.text(`S${k + 1}`, X, 95, { size: 12, color: 'muted', weight: 600 });
            if (!set.length) s.text('∅', X + 2, 85, { size: 18, color: 'green', weight: 700 });
            set.slice(0, 10).forEach((w, i) => chip(w, X, 87 - i * 8.2, isC.has(w), Math.max(6, (w.length * 8 + 14) * upx)));
            if (set.length > 10) s.text(`+${set.length - 10}`, X, 87 - 10 * 8.2, { size: 11, color: 'muted' });
          }
          sb.el.style.display = r.witness ? '' : 'none';
          if (r.witness) {
            const w = r.witness, text = w.text;
            drawParses(v, sb, text.slice(0, 24), [w.a, w.b], 2, { y0: 0.3, maxRows: 2 });
          }
          info = { r, shown, n: C.length, C };
        });
        v.readout(() => {
          const r = info.r; if (!info.n) return 'Enter at least one codeword.';
          const done = info.shown >= r.rounds.length;
          let msg = `After ${info.shown} of ${r.rounds.length} round${r.rounds.length === 1 ? '' : 's'}. `;
          if (done) msg += r.witness ? `A dangling suffix is a codeword: **not uniquely decodable**; the string ${r.witness.text.length > 20 ? 'below' : '`' + r.witness.text + '`'} has two parses.` : r.loop ? '**Uniquely decodable**: the suffix sets repeat without ever containing a codeword.' : '**Uniquely decodable**: the suffix sets die out.';
          return msg;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Kraft inequality',
      statement: String.raw`Let $\ell_1,\dots,\ell_m$ be positive integers. A binary **prefix code** with these codeword lengths exists **if and only if**
$$\sum_{i=1}^m 2^{-\ell_i}\ \le\ 1 .$$
Moreover, when the sum is at most $1$ the code can be built greedily by listing the lengths in increasing order and giving each word the next unused binary string of its length (the canonical code). (The same inequality holds for infinite prefix codes, with the sum over infinitely many words.)`,
      idea: String.raw`Place the codewords in the infinite binary tree: a word of length $\ell$ is a node at depth $\ell$, and it **claims** the whole subtree below it, which contains a fraction $2^{-\ell}$ of the leaves at any deeper level $D$. A set of words is prefix-free exactly when these claims are disjoint, so their total, $\sum 2^{-\ell_i}$, cannot exceed the whole tree, $1$. Conversely, process the lengths from shortest to longest: at the moment a word of length $\ell$ is placed, the earlier (shorter) claims occupy a whole number of slots of size $2^{-\ell}$, and the sum being at most $1$ leaves at least one slot free.`,
      caption: String.raw`Set how many codewords you want of each length $1,\dots,5$. The canonical code is assigned in the binary tree (big dots = codewords, grey = the subtree each one blocks, bottom row = leaves coloured by owner) and the same claims are stacked as slices of length $2^{-\ell}$ along a unit bar. While the total stays within $1$ everything fits; add one word too many and the first word that has nowhere to go is drawn in red past the end of the bar.`,
      deps: ['info-4.1'],
      refs: ['Cover–Thomas §5.2'],
      tags: ['Kraft inequality', 'prefix codes'],
      credit: 'L. G. Kraft, 1949 (MIT M.S. thesis; the converse and the extension to UD codes: McMillan, 1956)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kraft%E2%80%93McMillan_inequality' },
      viz(v) {
        const D = 5;
        const ns = [1, 1, 2, 0, 0].map((d, i) => v.slider(`words of length ${i + 1}`, 0, 8, d, { int: true }));
        const s = v.stage({ x: [-0.02, 1.02], y: [-D - 0.7, 0.6], height: 330, axes: false, title: 'prefix code in the binary tree' });
        const sb = v.stage({ x: [0, 1.1], y: [-0.5, 1.5], height: 150, axes: 'box', gutter: true, xlabel: 'Σ 2^(−ℓ)', title: 'the claims, as slices of a unit bar' });
        const COL = ['accent', 'orange', 'teal', 'purple', 'pink'];
        let info = {};
        v.render(() => {
          const lens = []; ns.forEach((sl, i) => { for (let k = 0; k < sl.value; k++) lens.push(i + 1); });
          const c = canon(lens), S = kraft(lens);
          // owner of each node: words placed
          const placed = []; // {l, code}
          (c.order || []).forEach((i, k) => { if (c.words[i]) placed.push({ l: lens[i], code: parseInt(c.words[i], 2), w: c.words[i] }); });
          const own = new Map(); placed.forEach((p, k) => own.set(`${p.l}:${p.code}`, p));
          const blocked = (d, i) => { for (let a = 1; a <= d; a++) if (own.has(`${a}:${i >> (d - a)}`)) return true; return false; };
          drawTree(s, D, {
            edgeFn: (d, i) => (blocked(d, i) ? { color: COL[(placed.find((p) => p.l <= d && p.code === i >> (d - p.l))?.l || 1) - 1], alpha: 0.35, width: 2 } : null),
            nodeFn: (d, i, x, y) => {
              const o = own.get(`${d}:${i}`);
              if (o) { s.dot(x, y, { r: 8, color: COL[d - 1] }); if (d <= 4) s.text(o.w, x, y, { dy: -17, align: 'center', size: 11, weight: 700, color: COL[d - 1], halo: false }); }
              else if (!blocked(d, i)) s.dot(x, y, { r: d === D ? 4.5 : 3, color: 'faint' });
              else if (d === D) { const p = placed.find((q) => q.l <= d && q.code === i >> (d - q.l)); s.dot(x, y, { r: 5, color: COL[p.l - 1] }); }
            },
          });
          for (let d = 1; d <= D; d++) s.text(`ℓ=${d}`, 0.0, -d, { dx: -2, size: 10.5, color: 'muted', align: 'left', dy: -9 });
          // unit bar
          let x = 0; const sorted = lens.slice().sort((a, b) => a - b);
          sb.setView([0, Math.max(1.05, S + 0.03)], [-0.5, 1.5]);
          sb.rect(0, 0, 1, 1, { color: 'ink', width: 1.6, fill: false });
          sorted.forEach((l, k) => {
            const w = pw2(-l), over = x + w > 1 + 1e-9;
            sb.rect(x, 0.05, x + w, 0.95, { color: over ? 'red' : COL[l - 1], width: 1, fill: over ? 'red' : COL[l - 1], fillAlpha: over ? 0.5 : 0.35, hatch: over });
            x += w;
          });
          sb.vline(1, { color: 'green', width: 2 });
          info = { S, lens, ok: c.ok, fail: c.fail, total: lens.length, placed: placed.length };
        });
        v.readout(() => {
          const i = info; if (!i.total) return 'Choose some codeword lengths.';
          const sumTxt = i.lens.slice().sort((a, b) => a - b).map((l) => `2^{-${l}}`).join('+');
          return `$\\sum 2^{-\\ell_i}=${sumTxt.length > 70 ? '' : sumTxt + '='}${v.fix(i.S, 4)}$ for ${i.total} word${i.total === 1 ? '' : 's'}. ` + (i.ok ? `**${i.S <= 1 + 1e-12 ? '≤ 1: a prefix code exists' : ''}** and the canonical code places all of them${i.S === 1 ? ' (a complete code: every leaf is used)' : ''}.` : `**> 1**: the canonical construction runs out of room after ${i.placed} word${i.placed === 1 ? '' : 's'}; no prefix code has these lengths.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'McMillan’s theorem',
      statement: String.raw`If a binary code with codeword lengths $\ell_1,\dots,\ell_m$ is **uniquely decodable**, then
$$\sum_{i=1}^m 2^{-\ell_i}\le 1 .$$
Together with Kraft's inequality (4.3): for every UD code there is a prefix code with the same codeword lengths, so nothing is lost by restricting attention to prefix codes. (The statement extends to countably infinite UD codes.)`,
      idea: String.raw`Let $S=\sum 2^{-\ell_i}$ and look at the $k$-th power $S^k=\sum_{i_1,\dots,i_k}2^{-(\ell_{i_1}+\cdots+\ell_{i_k})}=\sum_{M}N_M 2^{-M}$, where $N_M$ counts the $k$-tuples of codewords whose total length is $M$. Unique decodability makes the $N_M$ tuples of total length $M$ distinct binary strings of length $M$, so $N_M\le 2^M$. Hence $S^k\le\sum_{M=k}^{k\ell_{\max}}1\le k\,\ell_{\max}$, which grows only linearly in $k$. A number $S>1$ has exponentially growing powers, so $S>1$ is impossible; taking $k$-th roots and $k\to\infty$ gives $S\le1$.`,
      caption: String.raw`Choose the codeword lengths as in 4.3 and the power $k$. Left: for each total length $M$ the ratio $N_M/2^M$, computed by expanding $(\sum_\ell n_\ell z^{\ell})^k$; a unique decoder needs every ratio $\le1$ (orange line). Right (log scale): $S^k$ against the linear bound $k\ell_{\max}$. With $S\le1$ everything stays below; with $S>1$ the power overtakes the bound at some $k$ and the bars break through the line, proving that two tuples collide. Such a code cannot be uniquely decodable.`,
      deps: ['info-4.3', 'info-4.2'],
      refs: ['Cover–Thomas §5.5'],
      tags: ['Kraft–McMillan', 'unique decodability'],
      credit: 'B. McMillan, 1956 (IRE Trans. Inform. Theory 2 (4): 115–116)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kraft%E2%80%93McMillan_inequality' },
      viz(v) {
        const ns = [2, 1, 1, 0].map((d, i) => v.slider(`words of length ${i + 1}`, 0, 6, d, { int: true }));
        const kS = v.slider('power $k$', 1, 14, 8, { int: true });
        const s1 = v.stage({ x: [0, 1], y: [0, 1.5], height: 270, axes: 'box', gutter: true, xlabel: 'total length M of k codewords', ylabel: 'N(M) / 2^M', title: 'how crowded is each length of string?' });
        const s2 = v.stage({ x: [1, 14], y: [1, 100], ylog: true, height: 270, axes: 'box', gutter: true, xlabel: 'k', ylabel: 'value (log scale)', title: '$S^k$ against the linear bound' });
        v.legend([['orange', 'unique-decoding limit $N_M\\le 2^M$ / bound $k\\ell_{\\max}$', { dash: true }], ['accent', 'ratio $N_M/2^M$ / $S^k$'], ['red', 'ratio above 1: two tuples collide', { area: true }]]);
        let info = {};
        const powPoly = (P, k) => { let R = [1]; for (let t = 0; t < k; t++) { const Q = new Array(R.length + P.length - 1).fill(0); for (let a = 0; a < R.length; a++) if (R[a]) for (let b = 0; b < P.length; b++) if (P[b]) Q[a + b] += R[a] * P[b]; R = Q; } return R; };
        v.render(() => {
          const P = [0, ...ns.map((x) => x.value)], k = kS.value;
          const S = P.reduce((a, c, l) => a + c * pw2(-l), 0), lmax = P.reduce((a, c, l) => (c ? l : a), 0);
          if (!lmax) { info = { S: 0, lmax: 0 }; return; }
          const R = powPoly(P, k), ratio = R.map((c, M) => c / pw2(M));
          const top = Math.max(1.4, Math.max(...ratio) * 1.12);
          s1.setView([k - 0.8, k * lmax + 0.8], [0, top]);
          const tk = []; for (let M = k; M <= k * lmax; M += Math.max(1, Math.ceil((k * lmax - k) / 8))) tk.push(M);
          s1.setTicks(tk, null);
          s1.hline(1, { color: 'orange', width: 2, dash: true });
          for (let M = k; M <= k * lmax; M++) if (ratio[M] > 0) s1.rect(M - 0.4, 0, M + 0.4, ratio[M], { fill: ratio[M] > 1 + 1e-9 ? 'red' : 'accent', fillAlpha: 0.5, color: ratio[M] > 1 + 1e-9 ? 'red' : 'accent', width: 1 });
          let kstar = 0; for (let t = 1; t <= 60; t++) if (Math.pow(S, t) > t * lmax) { kstar = t; break; }
          const top2 = Math.max(10, Math.pow(S, 14), 14 * lmax) * 1.6;
          s2.setView([0.6, 14.4], [Math.min(0.3, Math.pow(S, 14) * 0.8), top2]);
          s2.path(Array.from({ length: 14 }, (_, i) => [i + 1, Math.pow(S, i + 1)]), { color: 'accent', width: 2.2 });
          s2.path(Array.from({ length: 14 }, (_, i) => [i + 1, (i + 1) * lmax]), { color: 'orange', width: 2, dash: true });
          s2.dot(k, Math.pow(S, k), { r: 5.5, color: 'gold' });
          info = { S, lmax, k, Sk: Math.pow(S, k), kstar, maxRatio: Math.max(...ratio) };
        });
        v.readout(() => {
          const i = info; if (!i.lmax) return 'Choose some codeword lengths.';
          return `$S=\\sum2^{-\\ell}=${v.fix(i.S, 4)}$, $S^{${i.k}}=${i.Sk < 1e6 ? v.fix(i.Sk, 3) : v.sci(i.Sk, 3)}$ against $k\\ell_{\\max}=${i.k * i.lmax}$; largest ratio $N_M/2^M=${v.fix(i.maxRatio, 3)}$. ` + (i.S <= 1 + 1e-12 ? '**$S\\le1$**: no contradiction; such lengths admit a (prefix) code.' : `**$S>1$**: ${i.kstar ? `from $k=${i.kstar}$ on, $S^k>k\\ell_{\\max}$, ` : ''}so the code cannot be uniquely decodable.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Shannon’s source coding theorem for symbol codes',
      statement: String.raw`Let $X$ have distribution $p$ on a finite alphabet and let $L=\sum_x p(x)\ell(x)$ be the expected length of a binary uniquely decodable code. Then
$$L\ \ge\ H(X),$$
with equality iff $\ell(x)=-\log_2p(x)$ for all $x$ (possible only if every $p(x)$ is a power of $\tfrac12$). Conversely, the **Shannon code** with $\ell(x)=\lceil-\log_2p(x)\rceil$ is a prefix code with $L<H(X)+1$. Hence the optimal expected length $L^*$ of a UD code (attained by a prefix code, for example Huffman's) satisfies
$$H(X)\ \le\ L^*\ <\ H(X)+1 .$$`,
      idea: String.raw`Write the excess as $L-H=\sum_x p(x)\log\frac{p(x)}{2^{-\ell(x)}}=D(p\,\|\,r)-\log c$ where $c=\sum2^{-\ell}$ and $r=2^{-\ell}/c$ is a probability distribution. Now $c\le1$ by McMillan (4.4), so $-\log c\ge0$, and $D(p\|r)\ge0$ is Gibbs' inequality (2.2); hence $L\ge H$, with equality exactly when $r=p$ and $c=1$. For the upper bound, the lengths $\lceil-\log p\rceil$ satisfy $\sum2^{-\ell}\le\sum p=1$, so Kraft (4.3) provides a prefix code, and rounding up adds less than one bit per symbol.`,
      caption: String.raw`Drag the bars to change the distribution (press Random for a new one, Dyadic for powers of $\frac12$). Top right: for every symbol its ideal length $-\log_2p$ (grey), the Shannon length $\lceil-\log_2p\rceil$ (orange) and its length in a Huffman code (green), all computed. Bottom: the expected lengths on a line: the entropy $H$, the optimal $L^*$ and the Shannon code, with the window $[H,H+1)$ shaded. With dyadic probabilities all three lengths coincide and everything collapses onto $H$.`,
      deps: ['info-4.4', 'info-2.2'],
      refs: ['Cover–Thomas §5.4', 'MacKay ch. 5'],
      tags: ['source coding', 'entropy'],
      credit: 'C. E. Shannon, 1948; optimal prefix codes: D. A. Huffman, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shannon%27s_source_coding_theorem' },
      viz(v) {
        const nS = v.slider('alphabet size', 2, 8, 6, { int: true });
        let seed = 7;
        const ed = barEd(v, { title: 'source distribution $p$ (drag the bars)', minWidth: 300, p: [0.34, 0.22, 0.17, 0.12, 0.09, 0.06], height: 230 });
        v.button('Random', () => { seed++; const r = v.rng(seed), q = Array.from({ length: nS.value }, () => Math.pow(r(), 2.2) + 0.02); const t = sum(q); ed.p = q.map((x) => x / t); });
        v.button('Dyadic', () => { const n = nS.value; const q = Array.from({ length: n }, (_, i) => pw2(-(Math.min(i + 1, n - 1)))); ed.p = q; });
        const sM = v.stage({ x: [-0.6, 5.6], y: [0, 4], height: 230, axes: 'box', gutter: true, ylabel: 'codeword length (bits)', title: 'code length of each symbol', minWidth: 300 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 230, axes: false, title: 'expected lengths against the window $[H,H+1)$', minWidth: 300 });
        let info = {};
        let lastN = 6;
        v.render(() => {
          if (nS.value !== lastN) { lastN = nS.value; ed.p = resizeP(ed.p, lastN); }
          const p = ed.p, n = p.length, Hh = H(p), ls = shannonLens(p), lh = huffLens(p);
          const Ls = expLen(p, ls), Lh = expLen(p, lh);
          ed.draw({ values: true, alpha: 0.35 });
          const hmax = Math.max(...ls, ...lh, 3);
          sM.setView([-0.6, n - 0.4], [0, hmax + 0.6]);
          sM.setTicks(p.map((_, i) => [i, LET[i]]), null);
          p.forEach((x, i) => {
            const id = -Math.log2(Math.max(x, 1e-9));
            sM.rect(i - 0.36, 0, i - 0.12, id, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1 });
            sM.rect(i - 0.1, 0, i + 0.14, ls[i], { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1 });
            sM.rect(i + 0.16, 0, i + 0.4, lh[i], { fill: 'green', fillAlpha: 0.45, color: 'green', width: 1 });
          });
          s2.setView([0, Math.max(hmax, Hh + 1.3) + 0.4], [0, 1]);
          s2.vband(Hh, Hh + 1, { color: 'green', alpha: 0.1 });
          s2.vline(Hh, { color: 'green', width: 2 });
          s2.vline(Hh + 1, { color: 'green', width: 1.2, dash: true });
          s2.dot(Lh, 0.62, { r: 7, color: 'green' }); s2.text(`L* = ${v.fix(Lh, 3)}`, Lh, 0.62, { dx: 12, dy: -14, align: 'left', size: 12, color: 'green', weight: 700 });
          s2.dot(Ls, 0.3, { r: 7, color: 'orange' }); s2.text(`Shannon ${v.fix(Ls, 3)}`, Ls, 0.3, { dx: 12, dy: -14, align: 'left', size: 12, color: 'orange', weight: 700 });
          s2.text(`H = ${v.fix(Hh, 3)}`, Hh, 0.92, { dx: -4, align: 'right', size: 12, color: 'green', weight: 600 });
          s2.text('H + 1', Hh + 1, 0.92, { dx: 4, align: 'left', size: 12, color: 'green', weight: 600 });
          info = { Hh, Ls, Lh, kr: kraft(ls) };
        });
        v.legend([['muted', 'ideal $-\\log_2p$'], ['orange', 'Shannon length $\\lceil-\\log_2p\\rceil$'], ['green', 'Huffman length']]);
        v.readout(() => `$H=${v.fix(info.Hh, 4)}$ ≤ $L^*=${v.fix(info.Lh, 4)}$ ≤ $L_{\\text{Shannon}}=${v.fix(info.Ls, 4)}$ < $H+1=${v.fix(info.Hh + 1, 4)}$.  Redundancy of the optimal code: $L^*-H=${v.fix(info.Lh - info.Hh, 4)}$ bits. Kraft sum of the Shannon lengths: $${v.fix(info.kr, 3)}\\le1$.`);
      },
    },
  ],
};
