// Algorithms — Chapter 10: Greedy algorithms, spanning trees and matroids (items 10.9–10.16; 10.1–10.8 in ch10.js, 10.17–10.22 in ch10-c.js)
import { K, ids, plural, clamp, fmt, rngOf, sumOf, huffman, wpl, entropy, bruteCodeLengths, textFreqs, drawForest, R, TX, LN, strip, blob, eKey, UF, ranked, wOf, totalW, compCount, isSpanningTree, mstBrute, kruskalTrace, KRUSKAL_CODE, primTrace, PRIM_CODE, randomTree, treePath, MST_POS, MST_EDGES, nodesFrom, COMPC } from './ch10.shared.js';

// ---------------------------------------------------------------- the road map shared by 10.12–10.17
const mapGraph = (v, s, extra = {}) => v.graph(s, { weights: true, layout: 'none', nodes: nodesFrom(MST_POS, { a: { notePos: 'w' }, h: { notePos: 'e' } }), edges: MST_EDGES.map(([a, b, w]) => [a, b, w]), ...extra });
/** Permute the 15 weights 1…15 by a seed (seed 0 = the original weights). */
function reweight(G, seed) {
  if (!seed) { G.edges.forEach((e, i) => { e.w = MST_EDGES[i][2]; }); return; }
  const r = rngOf(seed * 7919 + 13), perm = Array.from({ length: G.edges.length }, (_, i) => i + 1).sort(() => r() - 0.5);
  G.edges.forEach((e, i) => { e.w = perm[i]; });
}
const mstCache = new Map();
function mstOf(G) { const key = G.edges.map((e) => `${eKey(e)}${wOf(e)}`).join(','); if (!mstCache.has(key)) { if (mstCache.size > 60) mstCache.clear(); mstCache.set(key, mstBrute(G)); } return mstCache.get(key); }
/** Row(s) of small labelled edge cells inside the pixel box [X0, X0 + Wd]; st(e) → {color, fill, note}. Returns the bottom y. */
function edgeCells(s, G, list, X0, Y0, Wd, st, o = {}) {
  const cw = o.w ?? 50, ch = 26, gap = 5, per = Math.max(1, Math.floor((Wd + gap) / (cw + gap)));
  list.forEach((e, i) => {
    const r = Math.floor(i / per), c = i % per, X = X0 + c * (cw + gap), Y = Y0 + r * (ch + 22), t = st(e) || {};
    R(s, X, Y, X + cw, Y + ch, { fill: t.fill || t.color || 'muted', fillAlpha: t.fill ? t.alpha ?? 0.6 : 0.1, color: t.color || 'muted', width: t.width ?? 1.4, radius: 5, dash: t.dash });
    TX(s, `${G.lab(e.from)}${G.lab(e.to)}`, X + cw / 2, Y + ch / 2 + 0.5, { align: 'center', size: 12.5, weight: 700, color: t.fill ? 'panel' : 'ink', halo: false });
    TX(s, fmt(wOf(e)), X + cw / 2, Y + ch + 9, { align: 'center', size: 10.5, weight: 600, color: t.noteColor || 'muted' });
  });
  return Y0 + (Math.floor((list.length - 1) / per) + 1) * (ch + 22);
}

// ---------------------------------------------------------------- 10.9 prefix-code tries
function parseCodes(str) {
  const out = []; let bad = 0;
  for (const tok of String(str).split(/[\s,;]+/).filter(Boolean)) { const m = tok.match(/^(.+?)[:=]([01]+)$/); if (m && out.length < 16) out.push({ sym: m[1], bits: m[2] }); else bad++; }
  return { codes: out, bad };
}
function buildTrie(codes) {
  const nodes = new Map([['', { p: '', kids: [], syms: [] }]]);
  for (const c of codes) { let p = ''; for (const b of c.bits) { const q = p + b; if (!nodes.has(q)) { nodes.set(q, { p: q, kids: [], syms: [] }); nodes.get(p).kids.push(q); } p = q; } nodes.get(p).syms.push(c.sym); }
  for (const n of nodes.values()) n.kids.sort();
  const below = (p) => { const n = nodes.get(p); return n.kids.some((k) => nodes.get(k).syms.length || below(k)); };
  for (const n of nodes.values()) n.bad = n.syms.length > 1 || (n.syms.length > 0 && below(n.p));
  return nodes;
}
function parseCount(codes, bits) {
  const ways = new Array(bits.length + 1).fill(0); ways[bits.length] = 1;
  for (let i = bits.length - 1; i >= 0; i--) for (const c of codes) if (bits.startsWith(c.bits, i)) ways[i] += ways[i + c.bits.length];
  return ways[0];
}

export default {
  collection: 'algo',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.9
    {
      num: '10.9',
      kind: 'Definition',
      name: 'Prefix codes as binary trees',
      statement: String.raw`A **binary code** assigns to each symbol of an alphabet a nonempty bit string, its **codeword**. A code is a **prefix code** (prefix-free) if no codeword is a proper prefix of another and no two symbols share a codeword. Such a code corresponds to a binary tree whose leaves are the symbols: the codeword of a leaf spells the path from the root, $0$ for a left edge and $1$ for a right edge. Conversely every binary tree with the symbols on (some of) its leaves defines a prefix code. A bit string is **decoded** by walking down from the root, reading one bit per edge, and emitting a symbol and returning to the root each time a leaf is reached. The cost of the code for symbol frequencies $f_x$ is $\sum_x f_x\,|c(x)|$, the weighted depth of the leaves.`,
      idea: String.raw`Prefix-freeness is exactly what lets the decoder act without lookahead: the first time the walk reaches a codeword it knows that symbol is the right one, because no longer codeword starts with it. If one codeword is a prefix of another, the symbol sits on an internal node, and a bit string can be parsed in more than one way (for example $a=0$, $b=01$, $c=1$ reads $01$ as $ab$... or as $b$). Restricting attention to prefix codes costs nothing in compression: any uniquely decodable code has lengths satisfying Kraft's inequality $\sum_x 2^{-|c(x)|}\le1$ (McMillan), and the same inequality is enough to build a prefix code with those lengths (info-4.3), so no uniquely decodable code beats the best prefix code.`,
      caption: String.raw`Type a code table as symbol:bits pairs (like a:0 b:10), or pick one of the presets. The tree draws itself: boxes are codewords, and any codeword sitting above another codeword (or shared by two symbols) turns red. Type a bit string and **drag the slider** to read it one bit at a time: the gold path is the decoder's walk, and the readout counts how many different ways the whole string can be split into codewords. A prefix code always gives exactly one.`,
      deps: ['info-4.3'],
      refs: ['CLRS 4e §15.3'],
      tags: ['coding'],
      viz(v) {
        const PRESETS = { good: 'a:0 b:10 c:110 d:111', bad: 'a:0 b:01 c:1 d:011', inc: 'a:00 b:01 c:100', fixed: 'a:00 b:01 c:10 d:11' };
        const pre = v.select('preset', [{ value: 'good', label: 'prefix code' }, { value: 'bad', label: 'not prefix-free' }, { value: 'inc', label: 'incomplete' }, { value: 'fixed', label: 'fixed length' }], 'good', { onChange: () => { code.set(PRESETS[pre.value]); bitsIn.set(pre.value === 'bad' ? '0110' : pre.value === 'inc' ? '0010001' : pre.value === 'fixed' ? '00011110' : '010110111'); v.invalidate(); } });
        const code = v.input('code table', PRESETS.good, { width: 280, onChange: () => v.invalidate() });
        const bitsIn = v.input('bit string', '010110111', { width: 200, onChange: () => v.invalidate() });
        const pos = v.slider('bits read', 0, 24, 5, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330 });
        let info = null;
        v.render(() => {
          const { codes, bad } = parseCodes(code.value), nodes = buildTrie(codes), W = s.width, Hh = s.height;
          const bits = String(bitsIn.value).replace(/[^01]/g, '').slice(0, 24), k = Math.min(pos.value, bits.length);
          // leaf order layout
          const pxs = new Map(); let leaf = 0, maxD = 0;
          const place = (p, d) => { maxD = Math.max(maxD, d); const n = nodes.get(p); if (!n.kids.length) { pxs.set(p, [leaf++, d]); return leaf - 1; } const xs = n.kids.map((q) => place(q, d + 1)); const x = (xs[0] + xs[xs.length - 1]) / 2; pxs.set(p, [x, d]); return x; };
          place('', 0);
          const L = Math.max(1, leaf), dx = Math.min(76, (W - 60) / L), dy = Math.min(54, (Hh - 74) / Math.max(1, maxD)), X = (x) => (W - dx * (L - 1)) / 2 + x * dx, Y = (d) => 52 + d * dy;
          // decoder walk
          let cur = '', out = [], path = [''];
          for (let i = 0; i < k; i++) { const nx = cur + bits[i]; if (!nodes.has(nx)) { path = [cur, 'x']; cur = null; break; } cur = nx; path.push(cur); if (nodes.get(cur).syms.length) { out.push(nodes.get(cur).syms[0]); cur = ''; path = ['']; } }
          const pathSet = new Set(path.filter((x) => x !== 'x'));
          for (const [p, n] of nodes) for (const q of n.kids) {
            const [x1, d1] = pxs.get(p), [x2, d2] = pxs.get(q), on = pathSet.has(p) && pathSet.has(q) && path.indexOf(q) === path.indexOf(p) + 1;
            LN(s, X(x1), Y(d1) + 11, X(x2), Y(d2) - 11, { color: on ? 'gold' : 'muted', width: on ? 3.2 : 1.6 });
            TX(s, q[q.length - 1], (X(x1) + X(x2)) / 2 + (X(x2) < X(x1) ? -9 : 9), (Y(d1) + Y(d2)) / 2, { size: 12, weight: 700, color: 'orange' });
          }
          for (const [p, n] of nodes) {
            const [x, d] = pxs.get(p), isCode = n.syms.length > 0, hot = cur != null && p === cur;
            const col = n.bad ? 'red' : isCode ? 'green' : 'muted';
            if (isCode) { R(s, X(x) - 19, Y(d) - 12, X(x) + 19, Y(d) + 12, { fill: 'panel', fillAlpha: 1, stroke: false, radius: 6 }); R(s, X(x) - 19, Y(d) - 12, X(x) + 19, Y(d) + 12, { fill: col, fillAlpha: 0.22, color: col, width: hot ? 3 : 1.6, radius: 6 }); TX(s, n.syms.join('='), X(x), Y(d) + 0.5, { align: 'center', size: 13, weight: 700, color: 'ink', halo: false }); TX(s, p, X(x), Y(d) + 24, { align: 'center', size: 10.5, color: n.bad ? 'red' : 'muted', weight: 600 }); }
            else { s.dot(s.invX(X(x)), s.invY(Y(d)), { r: p === '' ? 7 : 4.5, color: hot ? 'gold' : 'muted', fill: hot ? 'gold' : 'panel' }); }
            if (hot && !isCode) s.dot(s.invX(X(x)), s.invY(Y(d)), { r: 8, color: 'gold', fill: 'gold' });
          }
          TX(s, `decoded so far: ${out.length ? out.join(' ') : '—'}${cur == null ? '   (no codeword continues this way)' : cur ? `   reading: ${cur}` : ''}`, 8, 16, { size: 12.5, weight: 700, color: 'muted', align: 'left' });
          const kraft = sumOf(codes, (c) => 2 ** -c.bits.length), pf = [...nodes.values()].every((n) => !n.bad);
          const ways = bits.length ? parseCount(codes, bits) : 1;
          info = { codes, bad, kraft, pf, ways, bits, k, out, leaves: codes.length };
        });
        v.legend([['green', 'codeword (a leaf, or a node with nothing below)'], ['red', 'codeword that is a prefix of another, or duplicated'], ['gold', 'the decoder\'s walk']]);
        v.readout(() => {
          if (!info) return '';
          const { codes, bad, kraft, pf, ways, bits, k, out } = info;
          const kf = `$\\sum_x 2^{-|c(x)|}=${kraft === 1 ? '1' : String(Math.round(kraft * 1000) / 1000)}$`;
          return `${plural(codes.length, 'codeword')}${bad ? ` (${plural(bad, 'entry', 'entries')} ignored)` : ''} · ${pf ? '**prefix code**' : '**not a prefix code**'} · ${kf}${kraft > 1 ? ' > 1: impossible for a prefix code' : kraft < 1 ? ' < 1: the tree has unused leaves' : ' (complete tree)'} · ${bits ? `bit string ${bits.slice(0, k)}|${bits.slice(k)}: it can be split into codewords in ${ways} way${ways === 1 ? '' : 's'}${ways > 1 ? ' — ambiguous' : ways === 0 ? ' — it cannot be decoded' : ''}${k ? `; the decoder has emitted ${out.length}` : ''}` : 'type a bit string to decode'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.10
    {
      num: '10.10',
      kind: 'Algorithm',
      name: 'Huffman coding',
      statement: String.raw`Given an alphabet with frequencies $f_x>0$, **Huffman's algorithm** builds a binary prefix code tree bottom-up. Start with one single-leaf tree per symbol, each weighted by its frequency, kept in a min-priority queue. While more than one tree remains, remove the two lightest trees, join them under a new root whose weight is the sum of their weights, and put the new tree back. The last tree is the code tree: left edges read $0$, right edges $1$. With a binary heap it takes $O(n\log n)$ time for $n$ symbols. Its average code length $L=\sum_x \frac{f_x}{F}|c(x)|$ (with $F=\sum f_x$) satisfies $H\le L<H+1$, where $H$ is the entropy of the distribution.`,
      idea: String.raw`Rare symbols should get long codewords and common symbols short ones, and in an optimal tree the two rarest symbols sit as siblings at the deepest level. So Huffman's algorithm decides that pair first, glues the two rarest symbols into one new symbol of the combined frequency, and solves the smaller problem; this is greedy choice plus optimal substructure (7.3). The cost bookkeeping is neat: every merge adds the weight of the new root to the total, because each leaf below it gets one level deeper, so the weighted depth equals the sum of all the merged weights. The priority queue is the binary heap of chapter 3 (3.8). Correctness is theorem 10.11.`,
      caption: String.raw`Type any text. The letters become leaves weighted by their counts; **step through** the merges (the gold tree is the one just created) until one tree is left, whose edges then read out the code. The table shows the code and the bar chart compares the average length with a fixed-length code and with the entropy bound $H$, which no code can beat. Try a text with one very common letter, or with all letters equally frequent.`,
      deps: ['algo-10.9', 'algo-3.8'],
      refs: ['CLRS 4e §15.3', 'KT §4.8'],
      tags: ['greedy', 'coding'],
      credit: 'D. A. Huffman, 1952',
      viz(v) {
        const txt = v.input('text', 'abracadabra', { width: 300, onChange: () => S.reset({ at: 'keep' }) });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1.5, title: 'the forest of trees' });
        const tb = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1, title: 'code and cost' });
        let model = null;
        const build = () => {
          const { list, cut, all } = textFreqs(String(txt.value).slice(0, 200), 14);
          const H = list.length ? huffman(list) : null;
          model = { list, cut, all, H };
          return H ? H.frames : [{ forest: [], hot: [], note: 'Type some text.' }];
        };
        const S = v.steps({ frames: build, code: ['put every symbol in a min-heap keyed by its frequency', 'while the heap holds more than one tree:', '  x ← extract-min;   y ← extract-min', '  z ← a new root with children x, y;   weight(z) = weight(x) + weight(y)', '  insert z', 'return the last tree          ▷ edges read 0 (left) and 1 (right)'], codeTitle: 'Huffman(f)', speed: 1.1, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, M = model, done = S.atEnd;
          drawForest(s, f.forest, { hot: new Set(f.hot), bits: done, top: 24 });
          if (!M || !M.H) return;
          const { list, H } = M, n = list.length, F = H.total;
          // table
          const rows = list.length, rh = Math.min(20, (tb.height - 140) / Math.max(1, rows));
          TX(tb, 'symbol', 14, 22, { size: 11.5, weight: 700, color: 'muted', align: 'left' }); TX(tb, 'count', 78, 22, { size: 11.5, weight: 700, color: 'muted', align: 'left' }); TX(tb, 'codeword', 134, 22, { size: 11.5, weight: 700, color: 'muted', align: 'left' });
          list.forEach((it, i) => { const y = 42 + i * rh; TX(tb, it.sym, 14, y, { size: 12.5, weight: 700, color: 'ink', align: 'left' }); TX(tb, it.w, 78, y, { size: 12, color: 'muted', align: 'left' }); TX(tb, done ? H.codes[it.sym] : '…', 134, y, { size: 12.5, weight: 600, color: done ? 'green' : 'faint', align: 'left' }); });
          const fix = Math.max(1, Math.ceil(Math.log2(n))), Hh = entropy(list), by = 42 + rows * rh + 24, bw = tb.width - 150, sc = bw / Math.max(fix, H.avg, Hh, 1) * 0.92;
          [['fixed length', fix, 'orange'], ['Huffman', H.avg, 'green'], ['entropy $H$', Hh, 'purple']].forEach(([lab, val, col], i) => { const y = by + i * 30; TX(tb, lab.replace('$H$', 'H'), 14, y + 9, { size: 11.5, weight: 600, color: 'muted', align: 'left' }); R(tb, 100, y, 100 + val * sc, y + 18, { fill: col, fillAlpha: 0.5, color: col, width: 1.4, radius: 3 }); TX(tb, r2(val), 106 + val * sc, y + 9, { size: 11.5, weight: 700, color: 'ink', align: 'left' }); });
        });
        function r2(x) { return String(Math.round(x * 1000) / 1000); }
        v.legend([['gold', 'tree just created'], ['teal', 'symbol (leaf)'], ['accent', 'merged tree'], ['orange', 'edge digit', { dot: true }]]);
        v.readout(() => {
          const M = model; if (!M || !M.H) return 'type some text';
          const { list, H, cut, all } = M, n = list.length, F = H.total;
          const bruteOk = n <= 9 ? bruteCodeLengths(list.map((x) => x.w)) : null, cost = Math.round(H.avg * F * 1e6) / 1e6, Hh = entropy(list), fix = Math.max(1, Math.ceil(Math.log2(n)));
          return `${n} symbols${cut ? ` (the ${n} most frequent of ${all})` : ''}, ${F} characters · Huffman cost $\\sum f_x|c(x)|=${cost}$ bits, average $${r2(H.avg)}$ bits per symbol against ${fix} for a fixed-length code, and $H=${r2(Hh)}$ · $H\\le L<H+1$: ${Hh <= H.avg + 1e-9 && H.avg < Hh + 1 ? '✓' : '✗'}${bruteOk != null ? ` · exhaustive search over all code-length assignments: ${bruteOk} ${Math.abs(bruteOk - cost) < 1e-6 ? '(equal ✓)' : '(✗)'}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.11
    {
      num: '10.11',
      kind: 'Theorem',
      name: 'Huffman codes are optimal',
      statement: String.raw`Let $f_1,\dots,f_n$ ($n\ge2$) be positive frequencies. Among all binary prefix codes for $n$ symbols with these frequencies, the code produced by Huffman's algorithm (10.10) minimises the cost $\sum_x f_x|c(x)|$ (the weighted depth of the leaves of the code tree). Moreover, if $x,y$ are two symbols of least frequency, some optimal tree has $x$ and $y$ as siblings at maximum depth, and if $T'$ is obtained from an optimal tree $T$ of that form by replacing the pair $x,y$ by one leaf $z$ with $f_z=f_x+f_y$, then $T'$ is optimal for the smaller alphabet and $\mathrm{cost}(T)=\mathrm{cost}(T')+f_x+f_y$.`,
      idea: String.raw`Induction on $n$, with two lemmas. (1) *Greedy choice.* In any optimal tree the deepest leaves have sibling leaves (else the tree can be shortened), and swapping a deepest leaf $a$ with a rarest leaf $x$ changes the cost by $(f_x-f_a)(d_a-d_x)\le0$, so $x$ and then $y$ can be moved to the bottom siblings without loss: an exchange argument (10.3). (2) *Reduction.* Merging the sibling pair into $z$ removes exactly one level from each of them, so the cost drops by $f_x+f_y$, independent of the rest of the tree. So an optimal tree for the big alphabet, in the bottom-siblings form, becomes an optimal tree for the small one, which by induction is what Huffman builds. The proof uses nothing about probabilities except that frequencies are positive and additive.`,
      caption: String.raw`Pick a **starting tree** (any prefix code you like; the slider draws a random one) and **step through** the proof. Each round swaps the two rarest leaves down into the deepest sibling pair (gold) and then merges them. The chart tracks $Q=\mathrm{cost}(\text{current tree})+\text{merged weights so far}$: the swaps can only lower it, the merges leave it unchanged, and when the tree has shrunk to one leaf $Q$ equals Huffman's cost, which therefore never exceeds the cost of the tree you started from.`,
      deps: ['algo-10.10', 'algo-10.3'],
      refs: ['CLRS 4e §15.3', 'KT §4.8'],
      tags: ['greedy', 'coding'],
      viz(v) {
        const wts = v.input('frequencies', 'a:40 b:25 c:15 d:12 e:5 f:3', { width: 260, onChange: () => S.reset({ at: 'start' }) });
        const seed = v.slider('starting tree #', 1, 40, 5, { int: true, onChange: () => S.reset({ at: 'start' }) });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1.5 });
        const ch = v.stage({ x: [0, 10], y: [0, 100], axes: 'box', gutter: true, height: 330, xlabel: 'step', ylabel: '$Q$ (bits)', weight: 1, title: 'cost + merged weights' });
        const parseW = () => { const out = []; for (const t of String(wts.value).split(/[\s,;]+/)) { const m = t.match(/^(.+?)[:=](\d+(?:\.\d+)?)$/); if (m && +m[2] > 0 && out.length < 7) out.push({ sym: m[1], w: +m[2] }); } return out; };
        let nid = 0;
        const clone = (t) => ({ ...t, kids: t.kids ? t.kids.map(clone) : undefined });
        const leavesOf = (t, d = 0, par = null) => (t.kids ? t.kids.flatMap((k) => leavesOf(k, d + 1, t)) : [{ node: t, d, par }]);
        const cost = (t, d = 0) => (t.kids ? sumOf(t.kids, (k) => cost(k, d + 1)) : t.w * d);
        const randomTree = (list, sd) => { const r = rngOf(sd * 131 + 7); let pool = list.map((x) => ({ id: nid++, sym: x.sym, w: x.w })); pool = pool.sort(() => r() - 0.5); while (pool.length > 1) { const i = Math.floor(r() * pool.length); const a = pool.splice(i, 1)[0], j = Math.floor(r() * pool.length), b = pool.splice(j, 1)[0]; pool.push({ id: nid++, w: a.w + b.w, kids: r() < 0.5 ? [a, b] : [b, a] }); } return pool[0]; };
        const frames = () => {
          const list = parseW(); nid = 0;
          if (list.length < 2) return [{ tree: { id: 0, w: 1, sym: '?' }, Q: 0, hot: [], note: 'Give at least two frequencies, like a:40 b:25 c:15.' }];
          let T = randomTree(list, seed.value), merged = 0; const F = [];
          const push = (note, hot, extra = {}) => F.push({ tree: clone(T), Q: cost(T) + merged, cost: cost(T), merged, hot, note, ...extra });
          push(`A starting tree $T$ for ${list.length} symbols, of cost ${cost(T)}. Nothing about it is special: it is any prefix code.`, []);
          let guard = 0;
          while (T.kids && guard++ < 20) {
            const L = leavesOf(T).sort((p, q) => p.node.w - q.node.w || p.node.id - q.node.id), x = L[0].node, y = L[1].node;
            const maxD = Math.max(...L.map((l) => l.d)), cand = L.filter((l) => l.d === maxD && l.par.kids.every((k) => !k.kids));
            let best = null, bs = -1;
            for (const c of cand) { const sib = c.par.kids.find((k) => k !== c.node), sc = [c.node, sib].filter((q) => q === x || q === y).length; if (sc > bs) { bs = sc; best = [c.node, sib]; } }
            const [a, b] = best, need = [x, y].filter((q) => !best.includes(q)), free = best.filter((q) => q !== x && q !== y);
            need.forEach((q, i) => {
              const p = free[i], before = cost(T), ps = p.sym, pw = p.w, qs = q.sym, qw = q.w;
              [p.sym, q.sym] = [qs, ps]; [p.w, q.w] = [qw, pw];
              push(`Swap leaf ${qs} (weight ${qw}) with the deepest-level leaf ${ps} (weight ${pw}): the cost changes by $(f_x-f_a)(d_a-d_x)\\le0$, here ${before} → ${cost(T)}.`, [p.id, q.id]);
            });
            const par = L.find((l) => l.node === a).par, w1 = a.w, w2 = b.w, s1 = a.sym, s2 = b.sym;
            par.kids = undefined; par.sym = s1 + s2; par.w = w1 + w2; merged += par.w;
            push(`The two rarest symbols ${s1} and ${s2} are now siblings at the bottom. **Merge** them into one leaf ${s1 + s2} of weight ${w1 + w2}: the cost falls by exactly ${w1 + w2}, which goes into the running total of merged weights.`, [par.id], { merge: true });
          }
          F.push({ ...F[F.length - 1], hot: [], end: true, note: `One leaf is left, so the tree's own cost is 0 and $Q=$ ${merged}, the sum of the merged weights: Huffman's cost. Along the way $Q$ never rose, so Huffman's cost is at most the cost ${F[0].Q} of the tree we started from.` });
          return F;
        };
        const S = v.steps({ frames, speed: 0.9, start: 0, still: 'end' });
        v.render(() => {
          const f = S.frame; drawForest(s, [f.tree], { hot: new Set(f.hot), top: 26, maxDx: 70 });
          const Qs = S.frames.map((g) => g.Q), mx = Math.max(10, ...Qs) * 1.1;
          ch.setView([-0.5, Math.max(3, Qs.length - 0.5)], [0, mx]); ch.setTicks(Qs.length <= 14 ? Qs.map((_, i) => i) : null, null);
          ch.path(Qs.slice(0, S.i + 1).map((q, i) => [i, q]), { color: 'accent', width: 2.4 });
          Qs.forEach((q, i) => ch.dot(i, q, { r: i === S.i ? 7 : 4, color: S.frames[i].merge ? 'green' : i === S.i ? 'gold' : 'accent', fill: i <= S.i ? (S.frames[i].merge ? 'green' : 'accent') : 'panel' }));
          if (S.frames[0]) ch.hline(S.frames[S.frames.length - 1].Q, { color: 'green', width: 1.6, dash: [5, 4] });
        });
        v.legend([['accent', '$Q$ after a swap'], ['green', '$Q$ after a merge (unchanged)', { dot: true }], ['green', 'Huffman\'s cost', { dash: true }]]);
        v.readout(() => {
          const list = parseW(), f = S.frame; if (list.length < 2) return 'enter at least two frequencies';
          const H = huffman(list), opt = list.length <= 9 ? bruteCodeLengths(list.map((x) => x.w)) : null, hc = Math.round(H.avg * H.total * 1e6) / 1e6;
          const Qs = S.frames.map((g) => g.Q), mono = Qs.every((q, i) => i === 0 || q <= Qs[i - 1] + 1e-9);
          return `step ${S.i}: tree cost ${f.cost ?? 0}, merged weights ${f.merged ?? 0}, $Q=${f.Q}$ · $Q$ nonincreasing so far: ${Qs.slice(0, S.i + 1).every((q, i, a) => i === 0 || q <= a[i - 1] + 1e-9) ? '✓' : '✗'} · Huffman cost ${hc}${opt != null ? `, exhaustive optimum ${opt} ${Math.abs(opt - hc) < 1e-6 ? '✓' : '✗'}` : ''} · final $Q$ ${Qs[Qs.length - 1]} ${mono ? '' : '(not monotone ✗)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.12
    {
      num: '10.12',
      kind: 'Definition',
      name: 'Minimum spanning trees',
      statement: String.raw`Let $G=(V,E)$ be a connected undirected graph with edge weights $w:E\to\mathbb R$. A **spanning tree** is a set $T\subseteq E$ of edges that connects all vertices and contains no cycle; equivalently, a connected subgraph with $|V|-1$ edges, or an acyclic one with $|V|-1$ edges. Its weight is $w(T)=\sum_{e\in T}w(e)$. A **minimum spanning tree** (MST) is a spanning tree of least weight. An MST always exists, because a connected graph has at least one spanning tree and there are only finitely many; it need not be unique, but it is unique when all edge weights are distinct. For a disconnected graph the analogue is a minimum spanning forest.`,
      idea: String.raw`The three descriptions of a tree are equivalent by counting: a connected graph on $n$ vertices needs at least $n-1$ edges, and an acyclic one has at most $n-1$, since every added edge between components merges two of them. The minimum spanning tree problem asks for the cheapest way to connect everything, the original application being an electrical network (Borůvka's motivation in 1926). Its structure is unusually forgiving: the cut and cycle properties (10.13, 10.14) say which edges *must* and *cannot* belong to an MST, and every greedy rule built on them is correct. By contrast, finding a cheapest *tour* is hard.`,
      caption: String.raw`**Click edges** to build a spanning tree: chosen edges turn thick green, and an edge that closes a cycle turns red. The readout checks the three conditions (n − 1 edges, connected, acyclic) and compares your weight with the true minimum, found by exhaustive search over all spanning trees. Show the optimum to compare, or draw new weights to try a different instance. Weights are all distinct, so the MST is unique.`,
      deps: ['algo-8.1'],
      refs: ['CLRS 4e §21.1'],
      tags: ['mst', 'graphs'],
      viz(v) {
        const seedS = v.slider('weights (0 = original)', 0, 12, 0, { int: true, onChange: () => { reweight(G, seedS.value); chosen.clear(); } });
        const show = v.toggle('show the minimum spanning tree', false);
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.4 });
        const ch = v.stage({ x: [0, 3.4], y: [0, 100], axes: 'box', gutter: true, height: 340, ylabel: 'weight', weight: 0.6, xticks: [[0.7, 'yours'], [1.7, 'minimum'], [2.7, 'spanning']] });
        const G = mapGraph(v, s, { draggable: true });
        const chosen = new Set(), cyc = new Set();
        G.onClick = ({ edge, node }) => { if (node) return true; if (edge) { if (chosen.has(edge)) chosen.delete(edge); else chosen.add(edge); return true; } return true; };
        let info = null;
        v.render(() => {
          const order = [...chosen], u = new UF(ids(G)); cyc.clear();
          for (const e of order.sort((a, b) => G.edges.indexOf(a) - G.edges.indexOf(b))) if (!u.union(e.from, e.to)) cyc.add(e);
          const M = mstOf(G), mine = new Set(M.best);
          const comps = compCount(G, [...chosen]), n = ids(G).length, tree = isSpanningTree(G, [...chosen]) && cyc.size === 0;
          G.draw({
            edgeColor: (e) => (cyc.has(e) ? 'red' : chosen.has(e) ? 'green' : show.value && mine.has(e) ? 'gold' : null),
            edgeWidth: (e) => (chosen.has(e) ? 4.4 : show.value && mine.has(e) ? 4 : null),
            edgeDash: (e) => (!chosen.has(e) && show.value && mine.has(e) ? [6, 4] : null),
            nodeColor: () => 'accent',
          });
          const tw = totalW(chosen);
          ch.setView([0, 3.4], [0, Math.max(60, tw, M.w) * 1.15]);
          const bars = [[0.7, tw, tree ? 'green' : 'blue'], [1.7, M.w, 'gold']];
          bars.forEach(([x, h, c]) => { ch.rect(x - 0.35, 0, x + 0.35, h, { fill: c, fillAlpha: 0.5, color: c, width: 1.4 }); ch.text(fmt(h), x, h + 2.5, { align: 'center', weight: 700, size: 12.5 }); });
          ch.setTicks([[0.7, 'yours'], [1.7, 'minimum']], null);
          info = { M, comps, n, tree, tw, cyc: cyc.size, k: chosen.size };
        });
        v.legend([['green', 'your edges'], ['red', 'closes a cycle'], ['gold', 'the minimum spanning tree', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { M, comps, n, tree, tw, cyc: c, k } = info;
          return `${plural(k, 'edge')} chosen (a tree on ${n} vertices has ${n - 1}) · ${comps} component${comps === 1 ? '' : 's'} · ${plural(c, 'cycle-closing edge')} · weight ${fmt(tw)} · ${tree ? `a spanning tree ✓, ${tw === M.w ? '**and a minimum one**: the true minimum is ' + fmt(M.w) : `${fmt(tw - M.w)} above the minimum ${fmt(M.w)}`}` : `not yet a spanning tree · the minimum over all ${M.all} spanning trees is ${fmt(M.w)}${M.count > 1 ? ` (${M.count} tie)` : ' (unique)'}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.13
    {
      num: '10.13',
      kind: 'Theorem',
      name: 'Cut property',
      statement: String.raw`Let $G=(V,E,w)$ be a connected weighted graph and $S$ a subset of vertices with $\emptyset\ne S\ne V$; the edges with exactly one end in $S$ form the **cut** $\delta(S)$. If $e$ is a lightest edge of the cut $\delta(S)$, then **some minimum spanning tree contains $e$**. If $e$ is the *unique* lightest edge of the cut (in particular, if all weights are distinct), then *every* minimum spanning tree contains $e$. More generally, if $A$ is contained in some MST and no edge of $A$ crosses the cut, then $A\cup\{e\}$ is also contained in some MST.`,
      idea: String.raw`Exchange argument (10.3). Let $T$ be a spanning tree that does not contain $e=uv$. Adding $e$ to $T$ closes a cycle $C$. The cycle passes from $u\in S$ to $v\notin S$ via $e$, so it must come back across the cut by some other edge $f\in C\cap\delta(S)$. Since $e$ is lightest in the cut, $w(e)\le w(f)$, and $T'=T-f+e$ is again a spanning tree (removing $f$ from $T+e$ opens the only cycle) with $w(T')=w(T)-w(f)+w(e)\le w(T)$. Applied to a minimum tree $T$ this yields a minimum tree containing $e$; if $w(e)<w(f)$ strictly, then $T$ was not minimum to begin with. The statement about $A$ follows because $f$ cannot lie in $A$, no edge of $A$ crossing the cut.`,
      caption: String.raw`**Click vertices** to move them between the shaded side $S$ and the rest; the lightest crossing edge $e$ is gold. The slider draws a random spanning tree that avoids $e$ (blue). Adding $e$ closes an orange cycle, the cycle must cross the cut again at a red edge $f$, and swapping $f$ for $e$ never makes the tree heavier. The bars show that and that the true minimum tree (which contains $e$) is no heavier still.`,
      deps: ['algo-10.12', 'algo-10.3'],
      refs: ['CLRS 4e §21.1', 'KT §4.5'],
      tags: ['mst'],
      viz(v) {
        const rv = v.slider('random tree #', 1, 60, 4, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.5 });
        const ch = v.stage({ x: [0, 5.6], y: [0, 100], axes: 'box', gutter: true, height: 340, ylabel: 'weight', weight: 0.8 });
        const G = mapGraph(v, s, { draggable: false });
        const side = new Set(['a', 'b', 'c']);
        G.onClick = ({ node }) => { if (!node) return true; const id = K(node.id); if (side.has(id)) side.delete(id); else side.add(id); return true; };
        let info = null;
        v.render(() => {
          const n = ids(G).length, valid = side.size > 0 && side.size < n;
          blob(v, s, G.nodes.filter((x) => side.has(K(x.id))).map((x) => [x.x, x.y]), 26, { color: 'blue', alpha: 0.13, edge: 0.5 });
          let e = null, T = [], f = null, cyc = [], T2 = [];
          const cross = (x) => side.has(K(x.from)) !== side.has(K(x.to));
          if (valid) {
            const cut = ranked(G).filter(cross); e = cut[0];
            T = randomTree(G, rv.value, [], [e]); cyc = treePath(T, e.from, e.to) || [];
            f = cyc.filter(cross).sort((a, b) => wOf(a) - wOf(b))[0] || null;
            T2 = T.filter((x) => x !== f).concat(e);
          }
          const tset = new Set(T), cset = new Set(cyc);
          G.draw({
            nodeColor: (id) => (side.has(K(id)) ? 'blue' : 'orange'),
            nodeFill: (id) => (side.has(K(id)) ? 'blue' : null),
            edgeColor: (x) => (x === e ? 'gold' : x === f ? 'red' : cset.has(x) ? 'orange' : tset.has(x) ? 'blue' : cross(x) && valid ? 'faint' : null),
            edgeWidth: (x) => (x === e ? 6 : x === f ? 4.6 : tset.has(x) ? 3.6 : null),
            edgeDash: (x) => (cset.has(x) && x !== f ? [6, 4] : null),
          });
          const M = mstOf(G);
          ch.setView([0, 5.6], [0, Math.max(40, valid ? totalW(T) : 0, M.w) * 1.2]);
          if (valid) {
            const bars = [[0.5, wOf(f), 'red'], [1.4, wOf(e), 'gold'], [2.6, totalW(T), 'blue'], [3.6, totalW(T2), 'green'], [4.7, M.w, 'accent']];
            bars.forEach(([x, h, c]) => { ch.rect(x - 0.38, 0, x + 0.38, h, { fill: c, fillAlpha: 0.5, color: c, width: 1.4 }); ch.text(fmt(h), x, h + 1.8, { align: 'center', weight: 700, size: 12 }); });
            ch.setTicks([[0.5, 'w(f)'], [1.4, 'w(e)'], [2.6, 'T'], [3.6, 'T−f+e'], [4.7, 'MST']], null);
          } else ch.corner('choose a proper subset S', 'tl', { color: 'muted', plate: true });
          info = { valid, e, f, T, T2, M, cyc };
        });
        v.legend([['blue', 'side $S$ (shaded) and the random tree $T$'], ['gold', 'lightest crossing edge $e$'], ['orange', 'cycle in $T+e$', { dash: true }], ['red', 'the other crossing edge $f$']]);
        v.readout(() => {
          if (!info) return '';
          const { valid, e, f, T, T2, M } = info;
          if (!valid) return 'the cut is empty: choose some vertices for $S$ and leave some outside';
          const inMst = new Set(M.best).has(e), nCut = ranked(G).filter((x) => side.has(K(x.from)) !== side.has(K(x.to))).length;
          return `the cut has ${nCut} edges; its lightest is $e=${eKey(e)}$ of weight ${fmt(wOf(e))} · random tree $T$ (weight ${fmt(totalW(T))}) lacks $e$; $T+e$ has a cycle through the cut again at $f=${f ? eKey(f) : '?'}$ (weight ${f ? fmt(wOf(f)) : '?'} ≥ ${fmt(wOf(e))} ✓) · $T-f+e$ has weight ${fmt(totalW(T2))} ≤ ${fmt(totalW(T))} ${totalW(T2) <= totalW(T) ? '✓' : '✗'} and is a spanning tree: ${isSpanningTree(G, T2) ? '✓' : '✗'} · $e$ belongs to the (unique) minimum tree of weight ${fmt(M.w)}: ${inMst ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.14
    {
      num: '10.14',
      kind: 'Theorem',
      name: 'Cycle property',
      statement: String.raw`Let $C$ be a cycle in a connected weighted graph $G$ and let $e$ be an edge of $C$ that is heavier than every other edge of $C$ (a **unique heaviest** edge; this holds for every cycle when weights are distinct). Then **no minimum spanning tree contains $e$**. If $e$ is only *a* heaviest edge of $C$ (ties allowed), then some minimum spanning tree avoids $e$, and in fact deleting $e$ from $G$ does not change the weight of the minimum spanning tree.`,
      idea: String.raw`Suppose a spanning tree $T$ contains $e=uv$. Deleting $e$ splits $T$ into two components, one containing $u$ and the other $v$. The rest of the cycle $C-e$ is a path from $u$ to $v$, so some other edge $f\in C$ joins the two components. Then $T'=T-e+f$ is a spanning tree and $w(T')=w(T)-w(e)+w(f)<w(T)$ because $e$ is the heaviest edge of $C$. Hence $T$ was not minimum. This is the mirror image of the cut property (10.13): there an edge is *forced* because it is lightest across a cut, here it is *forbidden* because it is heaviest around a cycle. Both are exchange arguments (10.3), and between them they say that for every edge, either a cut certifies its membership or a cycle certifies its exclusion.`,
      caption: String.raw`The slider walks through every simple cycle of the graph; its heaviest edge $e$ is red, and the bars show the weights around the cycle. A random spanning tree $T$ **forced to contain $e$** is drawn in blue. Deleting $e$ splits it in two, and the lightest cycle edge $f$ crossing the split (gold) reconnects it: the new tree $T-e+f$ is strictly lighter. The minimum spanning tree never uses a heaviest cycle edge, which the readout checks by exhaustive search.`,
      deps: ['algo-10.12', 'algo-10.3'],
      refs: ['KT §4.5'],
      tags: ['mst'],
      viz(v) {
        const cs = v.slider('cycle #', 1, 120, 7, { int: true });
        const rv = v.slider('random tree #', 1, 60, 3, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.5 });
        const ch = v.stage({ x: [0, 9], y: [0, 16], axes: 'box', gutter: true, height: 340, ylabel: 'edge weight', xlabel: 'around the cycle', weight: 0.8 });
        const G = mapGraph(v, s, { draggable: false });
        // every simple cycle, as edge lists, by DFS from the smallest vertex
        const cycles = (() => {
          const I = ids(G).map(K), ix = new Map(I.map((u, i) => [u, i])), out = [];
          for (const st of I) {
            const go = (u, path, edges, on) => {
              for (const { id, edge } of G.adj(u)) {
                const x = K(id); if (edges.includes(edge)) continue;
                if (x === st && edges.length >= 2) { if (ix.get(path[1]) < ix.get(u)) out.push({ nodes: path.slice(), edges: edges.concat(edge) }); continue; }
                if (ix.get(x) < ix.get(st) || on.has(x)) continue;
                on.add(x); path.push(x); edges.push(edge); go(x, path, edges, on); edges.pop(); path.pop(); on.delete(x);
              }
            };
            go(st, [st], [], new Set([st]));
          }
          return out.sort((a, b) => a.edges.length - b.edges.length || sumOf(a.edges, wOf) - sumOf(b.edges, wOf));
        })();
        let info = null;
        v.render(() => {
          const C = cycles[(cs.value - 1) % cycles.length], e = C.edges.reduce((b, x) => (wOf(x) > wOf(b) ? x : b));
          const T = randomTree(G, rv.value, [e], []), Tset = new Set(T);
          const comp = new UF(ids(G)); for (const x of T) if (x !== e) comp.union(x.from, x.to);
          const cross = C.edges.filter((x) => x !== e && comp.find(x.from) !== comp.find(x.to));
          const f = cross.sort((a, b) => wOf(a) - wOf(b))[0], T2 = T.filter((x) => x !== e).concat(f), cset = new Set(C.edges);
          G.draw({
            edgeColor: (x) => (x === e ? 'red' : x === f ? 'gold' : cset.has(x) ? 'orange' : Tset.has(x) ? 'blue' : null),
            edgeWidth: (x) => (x === e || x === f ? 6 : cset.has(x) ? 4 : Tset.has(x) ? 3.2 : null),
            edgeDash: (x) => (cset.has(x) && x !== e && x !== f ? [6, 4] : null),
          });
          const ws = C.edges.map(wOf), n = ws.length;
          ch.setView([0, n + 1.5], [0, Math.max(16, ...ws) + 1]);
          ch.setTicks(C.edges.map((_, i) => i + 1), null);
          C.edges.forEach((x, i) => { const c = x === e ? 'red' : x === f ? 'gold' : 'orange'; ch.rect(i + 0.6, 0, i + 1.4, wOf(x), { fill: c, fillAlpha: 0.5, color: c, width: 1.4 }); ch.text(`${G.lab(x.from)}${G.lab(x.to)}`, i + 1, wOf(x) + 0.7, { align: 'center', size: 10.5, color: 'muted', weight: 600 }); });
          const M = mstOf(G);
          info = { C, e, f, T, T2, M, tot: totalW(T), tot2: totalW(T2) };
        });
        v.legend([['red', 'heaviest edge $e$ of the cycle'], ['orange', 'other edges of the cycle', { dash: true }], ['blue', 'random spanning tree $T\\ni e$'], ['gold', 'reconnecting edge $f$']]);
        v.readout(() => {
          if (!info) return '';
          const { C, e, f, T, T2, M, tot, tot2 } = info;
          return `cycle ${(cs.value - 1) % cycles.length + 1} of ${cycles.length}: ${plural(C.edges.length, 'edge')}, heaviest $e=${eKey(e)}$ (${fmt(wOf(e))}) · $T$ contains $e$ (weight ${fmt(tot)}); dropping $e$ and adding $f=${eKey(f)}$ (${fmt(wOf(f))}) gives weight ${fmt(tot2)} < ${fmt(tot)} ${tot2 < tot ? '✓' : '✗'}, a spanning tree: ${isSpanningTree(G, T2) ? '✓' : '✗'} · the minimum spanning tree (weight ${fmt(M.w)}) ${new Set(M.best).has(e) ? 'contains $e$ ✗' : 'avoids $e$ ✓'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.15
    {
      num: '10.15',
      kind: 'Algorithm',
      name: 'Kruskal’s algorithm',
      statement: String.raw`**Kruskal's algorithm** finds a minimum spanning tree of a connected weighted graph. Sort the edges by weight. Start with the forest $T=\emptyset$ in which every vertex is its own component, and scan the edges in sorted order, adding an edge to $T$ when its endpoints lie in different components and discarding it otherwise. When $|V|-1$ edges have been accepted, $T$ is a minimum spanning tree. With a union-find structure (6.11) each of the $m$ edges costs two find operations and at most one union, so the total time is $O(m\log m)$, dominated by sorting.`,
      idea: String.raw`When the scan reaches an edge $e=uv$ between two different components, take the cut $\delta(S)$ where $S$ is the component of $u$. No already-accepted edge crosses it, and $e$ is the first edge in sorted order that does (all lighter crossing edges were scanned earlier and discarded, which can only happen if they joined vertices already connected, hence not crossing $S$). So $e$ is a lightest edge of this cut, and the cut property (10.13) shows that $T\cup\{e\}$ still extends to a minimum spanning tree. An edge discarded because its ends are already connected would close a cycle in which it is the heaviest edge so far, which is the cycle property (10.14). The invariant "$T$ is contained in some MST" therefore holds throughout.`,
      caption: String.raw`**Step through** the sorted edge list (right): each edge is checked against the union-find colouring of the vertices, green if it joins two colours, red if both ends have the same colour. Component hulls merge as trees grow. **Click a weight on the graph** to change it (shift-click lowers): the algorithm re-runs and the readout compares its weight with the exhaustive minimum. Ties are broken by edge position, consistently.`,
      deps: ['algo-10.13', 'algo-6.11'],
      refs: ['CLRS 4e §21.2', 'Erickson Ch. 7'],
      tags: ['mst', 'greedy'],
      credit: 'J. B. Kruskal, 1956',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.5 });
        const ls = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 340, weight: 1, title: 'edges in sorted order' });
        const G = mapGraph(v, s, { editable: { editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true }, onChange: () => S.reset({ at: 'keep' }) });
        let run = null;
        const S = v.steps({ frames: () => { run = kruskalTrace(G); return run.frames; }, code: KRUSKAL_CODE, codeTitle: 'Kruskal(G)', speed: 1.4, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, reps = [...new Set(Object.values(f.comp))], colOf = (id) => COMPC[reps.indexOf(f.comp[K(id)]) % COMPC.length];
          for (const r of reps) { const mem = G.nodes.filter((x) => f.comp[K(x.id)] === r); if (mem.length > 1) blob(v, s, mem.map((x) => [x.x, x.y]), 24, { color: colOf(mem[0].id), alpha: 0.12, edge: 0.5 }); }
          G.draw({
            nodeColor: (id) => colOf(id), nodeFill: (id) => colOf(id), labelColor: undefined,
            edgeColor: (e) => (f.chosen.has(e) ? 'green' : f.edge === e ? (f.ok ? 'green' : 'red') : null),
            edgeWidth: (e) => (f.chosen.has(e) ? 4.6 : f.edge === e ? 6 : null),
            edgeDash: (e) => (f.edge === e && !f.ok ? [6, 4] : null),
            dim: f.order.filter((e, i) => i < f.k && !f.chosen.has(e) && f.edge !== e),
          });
          const done = new Map(); f.order.forEach((e, i) => { if (i < f.k) done.set(e, f.chosen.has(e)); });
          edgeCells(ls, G, f.order, 10, 34, ls.width - 20, (e) => (f.edge === e ? { color: 'gold', fill: f.ok ? 'green' : 'red', width: 3, noteColor: 'ink' } : done.has(e) ? (done.get(e) ? { color: 'green', fill: 'green', alpha: 0.5 } : { color: 'red', dash: [3, 2], noteColor: 'red' }) : { color: 'muted' }));
        });
        v.legend([['green', 'accepted: joins two components'], ['red', 'rejected: would close a cycle', { dash: true }], ['gold', 'edge being examined']]);
        v.readout(() => {
          if (!run) return '';
          const f = S.frame, M = mstBrute(G), n = ids(G).length;
          return `${plural(f.chosen.size, 'edge')} accepted of ${n - 1} needed · ${plural(compCount(G, [...f.chosen]), 'component')} · weight so far ${fmt(f.weight)}${S.atEnd ? ` · final weight ${fmt(run.weight)} against the exhaustive minimum ${fmt(M.w)} ${Math.abs(run.weight - M.w) < 1e-9 ? '✓' : '✗'}${M.count > 1 ? ` (${M.count} minimum trees tie)` : ''}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.16
    {
      num: '10.16',
      kind: 'Algorithm',
      name: 'Prim’s (Jarník’s) algorithm',
      statement: String.raw`**Prim's algorithm** (also called Jarník's, or Prim–Jarník) grows a single tree. Start with $S=\{r\}$ for a chosen root $r$ and $T=\emptyset$. While $S\ne V$, take the lightest edge $uv$ with $u\in S$ and $v\notin S$, and add $v$ to $S$ and $uv$ to $T$. On a connected graph the result is a minimum spanning tree. With a binary heap keyed by the cheapest known edge to each outside vertex it runs in $O(m\log n)$ time, and in $O(m+n\log n)$ with a Fibonacci heap; it is the same loop as Dijkstra's algorithm (9.8), with the key $w(u,v)$ instead of $d[u]+w(u,v)$.`,
      idea: String.raw`At each step the cut $\delta(S)$ separates the tree from the rest, no edge of the tree crosses it, and the algorithm picks a lightest crossing edge, so by the cut property (10.13) the tree built so far remains contained in some minimum spanning tree. The root does not matter for the weight; different roots can produce different (equally light) trees only when weights tie. The priority queue holds, for every outside vertex, the lightest edge to the tree, which is exactly the set of candidates for the next step. The name history is tangled: Jarník published the algorithm in 1930 (in Czech), Prim rediscovered it in 1957, and Dijkstra again in 1959, so it is also called the DJP algorithm.`,
      caption: String.raw`**Click a vertex** to choose the root, then step through. The tree (green, with filled vertices) grows by one vertex at a time; the shaded region is $S$ and the orange edges are the cut. The list on the right is the priority queue of crossing edges: the lightest, at the front, is taken. The readout compares the final weight with Kruskal's tree and with the exhaustive minimum.`,
      deps: ['algo-10.13', 'algo-3.8'],
      refs: ['CLRS 4e §21.2', 'Erickson Ch. 7'],
      tags: ['mst', 'greedy'],
      credit: 'V. Jarník, 1930; R. C. Prim, 1957',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.5 });
        const ls = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 340, weight: 1, title: 'crossing edges (priority queue)' });
        const G = mapGraph(v, s, { editable: { editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true }, onChange: () => S.reset({ at: 'keep' }) });
        let root = 'a', run = null;
        G.onClick = ({ node }) => { if (!node) return false; root = K(node.id); S.reset({ at: 'start' }); return true; };
        const S = v.steps({ frames: () => { run = primTrace(G, root); return run.frames; }, code: PRIM_CODE, codeTitle: 'Prim(G, r)', speed: 1.1, start: 'end', still: 5 });
        v.render(() => {
          const f = S.frame;
          blob(v, s, G.nodes.filter((x) => f.S.has(K(x.id))).map((x) => [x.x, x.y]), 26, { color: 'green', alpha: 0.12, edge: 0.5 });
          const crossSet = new Set(f.cross);
          G.draw({
            nodeColor: (id) => (f.S.has(K(id)) ? 'green' : null), nodeFill: (id) => (f.S.has(K(id)) ? 'green' : null), nodeRing: (id) => (K(id) === root ? 'gold' : null),
            edgeColor: (e) => (f.T.has(e) ? 'green' : f.pick === e ? 'gold' : crossSet.has(e) ? 'orange' : null),
            edgeWidth: (e) => (f.T.has(e) ? 4.6 : f.pick === e ? 6 : crossSet.has(e) ? 2.6 : null),
          });
          edgeCells(ls, G, f.cross, 10, 34, ls.width - 20, (e, i) => (f.pick === e ? { color: 'gold', fill: 'gold', width: 3 } : { color: 'orange' }));
          if (!f.cross.length) TX(ls, f.end ? 'the queue is empty' : '', 14, 50, { size: 13, color: 'faint', align: 'left' });
        });
        v.legend([['green', 'tree $T$ and set $S$'], ['orange', 'edges across the cut'], ['gold', 'lightest crossing edge / root ring']]);
        v.readout(() => {
          if (!run) return '';
          const f = S.frame, M = mstBrute(G), kr = kruskalTrace(G);
          return `root ${G.lab(root)} (click a vertex to change it) · $|S|=${f.S.size}$ of ${ids(G).length}, tree weight ${fmt(f.weight)}${S.atEnd ? ` · final ${fmt(run.weight)}, Kruskal ${fmt(kr.weight)}, exhaustive minimum ${fmt(M.w)} ${Math.abs(run.weight - M.w) < 1e-9 && Math.abs(kr.weight - M.w) < 1e-9 ? '✓' : '✗'}` : ` · ${plural(f.cross.length, 'edge')} cross the cut`}`;
        });
      },
    },
  ],
};
