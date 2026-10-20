// Bioinformatics Algorithms — Chapter 2: Pairwise sequence alignment (items 2.1–2.5; 2.6–2.8 in ch02-b.js, 2.10–2.13 in ch02-c.js; 2.9 is the cross-listed Hirschberg item of algo)
//
// House style: every protein is a real UniProt sequence (accessions in ch02.shared.js and in the captions), the substitution
// matrices are the NCBI BLOSUM62 / PAM250 tables, and every table, path and score on screen is computed live by the same
// Gotoh aligner (shared file), whose result is re-scored independently from the printed alignment in each readout.
import {
  AA, B62, PAM250, PROT, scoreFn, align, alnScore, linPtrs, fmtN, cleanSeq, drawAln, opsToAln, countsOf, delannoy,
  logOdds, aaIndex,
} from './ch02.shared.js';

export default {
  collection: 'bioinf',
  chapter: 2,
  title: 'Pairwise sequence alignment',
  summary: String.raw`Comparing two sequences means finding the best path through an edit graph, which dynamic programming does exactly. Scores come from log-odds substitution matrices; Needleman–Wunsch finds global alignments and Smith–Waterman local ones, with affine gaps, fitting and overlap variants for real tasks. Hirschberg’s divide-and-conquer trick cuts memory to linear, and banding speeds alignment of similar sequences. Below about 25% identity, alignments become unreliable. The chapter ends with the two founding papers, Needleman–Wunsch (1970) and Smith–Waterman (1981).`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Concept',
      name: 'Alignment as a path through the edit graph',
      statement: String.raw`Let $s=s_1\cdots s_n$ and $t=t_1\cdots t_m$. The **edit graph** has a vertex $(i,j)$ for each $0\le i\le n,\ 0\le j\le m$ and three kinds of edges: a diagonal $(i-1,j-1)\to(i,j)$ (align $s_i$ with $t_j$), a vertical $(i-1,j)\to(i,j)$ (align $s_i$ with a gap) and a horizontal $(i,j-1)\to(i,j)$ (align $t_j$ with a gap). Paths from $(0,0)$ to $(n,m)$ correspond one-to-one with global alignments of $s$ and $t$, and the number of them is the Delannoy number $D(n,m)$, which grows exponentially.`,
      idea: String.raw`Reading a path left to right and writing down one alignment column per edge gives a gapped pair of strings whose rows, with the gaps deleted, are $s$ and $t$; conversely every such pair of rows is read off from exactly one path, because each column consumes a prefix step of $s$, of $t$, or of both. The graph is the picture that turns "compare two strings" into "optimise over paths", which the next items solve; it is the grid-graph form of the Hamming/edit-distance view from the k-mer chapter, with insertions and deletions allowed.`,
      caption: String.raw`**Click** a node next to the end of your path (right, below, or diagonally below-right) to extend it; click an earlier node to cut the path back there. The alignment it spells is written underneath, with its score under the three sliders. Green diagonals join equal letters. Press *reveal* to overlay an optimal path and see whether yours is as good; the readout counts how many paths exist in all.`,
      deps: ['bioinf-1.4'],
      refs: ['Durbin ch. 2', 'Compeau–Pevzner ch. 5'],
      tags: ['alignment', 'graphs', 'dynamic programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sequence_alignment' },
      viz(v) {
        const EX = { gatt: ['GATTACA', 'GCATGCT'], short: ['ACGTT', 'AGCTT'], ins: ['ACGGTA', 'ACTA'] };
        const ex = v.select('example', [{ value: 'gatt', label: 'GATTACA / GCATGCT' }, { value: 'short', label: 'ACGTT / AGCTT' }, { value: 'ins', label: 'ACGGTA / ACTA' }], 'short', {
          onChange: (k) => { sIn.set(EX[k][0]); tIn.set(EX[k][1]); path = [[0, 0]]; },
        });
        const sIn = v.input('rows $s$', EX.short[0], { width: 120, onChange: () => { path = [[0, 0]]; } });
        const tIn = v.input('columns $t$', EX.short[1], { width: 120, onChange: () => { path = [[0, 0]]; } });
        const mat = v.slider('match', 0, 4, 1, { int: true });
        const mis = v.slider('mismatch', -4, 0, -1, { int: true });
        const gap = v.slider('gap cost', 0, 4, 2, { int: true });
        const reveal = v.toggle('reveal an optimal path', false);
        v.button('clear path', () => { path = [[0, 0]]; });
        v.button('walk the diagonal', () => { const { s, t } = seqs(); path = [[0, 0]]; while (path.length <= Math.min(s.length, t.length)) path.push([path.length, path.length]); });
        const sg = v.stage({ x: [-1.6, 6], y: [-6, 1.6], equal: true, axes: false, height: 400, title: 'the edit graph' });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true, title: 'the alignment your path spells' });
        let path = null;
        const seqs = () => ({ s: cleanSeq(sIn.value, 'A-Z', 9) || 'A', t: cleanSeq(tIn.value, 'A-Z', 9) || 'A' });
        const opts = () => ({ score: scoreFn('simple', mat.value, mis.value), go: gap.value, ge: gap.value });
        const opOf = (a, b) => (b[0] > a[0] && b[1] > a[1] ? 'D' : b[0] > a[0] ? 'V' : 'H');
        sg.onClick((x, y) => {
          const { s, t } = seqs(), j = Math.round(x), i = Math.round(-y);
          if (i < 0 || j < 0 || i > s.length || j > t.length || Math.hypot(x - j, -y - i) > 0.42) return;
          const end = path[path.length - 1], at = path.findIndex((p) => p[0] === i && p[1] === j);
          if (at >= 0) { path = path.slice(0, at + 1); return; }
          const di = i - end[0], dj = j - end[1];
          if (di >= 0 && dj >= 0 && di <= 1 && dj <= 1 && di + dj > 0) path.push([i, j]);
        });
        v.render(() => {
          const { s, t } = seqs(), n = s.length, m = t.length, o = opts();
          if (!path) { const q = align(s, t, o).path; path = q.slice(0, Math.max(1, q.length - 2)); }
          if (path.some((p) => p[0] > n || p[1] > m)) path = [[0, 0]];
          sg.setView([-1.7, m + 0.7], [-n - 0.7, 1.7]);
          const opt = align(s, t, o);
          for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
            if (j < m) sg.line(j, -i, j + 1, -i, { color: 'grid', width: 1.2 });
            if (i < n) sg.line(j, -i, j, -i - 1, { color: 'grid', width: 1.2 });
            if (i < n && j < m) sg.line(j, -i, j + 1, -i - 1, { color: s[i] === t[j] ? 'green' : 'grid', width: s[i] === t[j] ? 2.4 : 1, alpha: s[i] === t[j] ? 0.55 : 1 });
          }
          if (reveal.value) for (let k = 0; k + 1 < opt.path.length; k++) sg.line(opt.path[k][1], -opt.path[k][0], opt.path[k + 1][1], -opt.path[k + 1][0], { color: 'gold', width: 8, alpha: 0.35 });
          for (let k = 0; k + 1 < path.length; k++) {
            const a = path[k], b = path[k + 1], op = opOf(a, b);
            sg.arrow(a[1], -a[0], b[1], -b[0], { color: op === 'D' ? 'accent' : 'orange', width: 3.4, head: 9 });
          }
          for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) sg.dot(j, -i, { r: 3.2, color: 'muted' });
          const end = path[path.length - 1];
          for (const [di, dj] of [[1, 0], [0, 1], [1, 1]]) { const i = end[0] + di, j = end[1] + dj; if (i <= n && j <= m) sg.dot(j, -i, { r: 7, hollow: true, color: 'gold' }); }
          sg.dot(end[1], -end[0], { r: 7, color: 'accent' });
          sg.dot(0, 0, { r: 6, color: 'green', label: 'start', labelPos: 'nw' });
          sg.dot(m, -n, { r: 6, color: end[0] === n && end[1] === m ? 'green' : 'red', label: 'end', labelPos: 'se' });
          for (let j = 1; j <= m; j++) sg.text(t[j - 1], j - 0.5, 0.9, { align: 'center', size: 15, weight: 700, color: 'accent' });
          for (let i = 1; i <= n; i++) sg.text(s[i - 1], -0.9, -i + 0.5, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: 'accent' });
          const ops = path.slice(1).map((p, k) => opOf(path[k], p));
          const aln = opsToAln(s, t, ops);
          if (ops.length) drawAln(sa, aln, o.score, { labels: ['s', 't'] }); else { sa.setView([0, 1], [0, 1]); sa.text('Extend the path from the top-left corner.', 0.5, 0.5, { align: 'center', color: 'muted', size: 14 }); }
        });
        v.readout(() => {
          const { s, t } = seqs(), n = s.length, m = t.length, o = opts();
          if (!path) return '';
          const ops = path.slice(1).map((p, k) => opOf(path[k], p)), aln = opsToAln(s, t, ops), sc = alnScore(aln.top, aln.bot, o), opt = align(s, t, o);
          const done = path[path.length - 1][0] === n && path[path.length - 1][1] === m, c = countsOf(aln);
          return `your path: **${ops.length}** edges, ${c.ident} identities, ${c.gaps} gap positions, score **${fmtN(sc)}**${done ? '' : ' (so far; the path has not reached the corner)'}\n` +
            `best possible: **${fmtN(opt.score)}**${done ? (sc === opt.score ? ' — yours is optimal' : ` — yours is ${fmtN(opt.score - sc)} short`) : ''}   ·   number of corner-to-corner paths: $D(${n},${m}) = ${delannoy(n, m).toLocaleString('en-US')}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Algorithm',
      name: 'Longest common subsequence by dynamic programming',
      statement: String.raw`A **common subsequence** of $s$ and $t$ is a string obtainable from both by deleting letters. Let $c[i,j]$ be the length of a longest common subsequence of $s_1\cdots s_i$ and $t_1\cdots t_j$. Then $c[i,0]=c[0,j]=0$ and
$$c[i,j]=\begin{cases}c[i-1,j-1]+1 & s_i=t_j,\\ \max(c[i-1,j],\,c[i,j-1]) & s_i\ne t_j,\end{cases}$$
so the whole table, and an actual longest subsequence by tracing back from $c[n,m]$, costs $O(nm)$ time. Equivalently it is the best alignment that scores $+1$ per match and $0$ for everything else, with no use of mismatch columns.`,
      idea: String.raw`The optimal-substructure argument: if the last letters agree, some longest common subsequence uses them (swap them in if not), so the answer is one more than for the shorter prefixes; if they disagree, at least one of them is not used, which gives the max of two subproblems. Only $(n+1)(m+1)$ distinct subproblems exist, so each is solved once (the dynamic-programming method of algo-7.2, applied as in algo-7.7); arrows remembering which case won let the trace-back recover a string.`,
      caption: String.raw`Edit either sequence or choose an example, then **step** through the fill: the gold cell is computed from the orange cells it depends on, and a small arrow records the winner. After the last cell the trace-back (green) walks from the corner; each green diagonal step is a letter of the subsequence. Try two strings with no common letters, or identical strings.`,
      deps: ['bioinf-2.1', 'algo-7.7'],
      refs: ['Compeau–Pevzner ch. 5'],
      tags: ['alignment', 'dynamic programming', 'lcs'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Longest_common_subsequence' },
      viz(v) {
        const CODE = ['c[i, 0] ← 0;   c[0, j] ← 0', 'for i ← 1 to n', '  for j ← 1 to m', '    if $s_i = t_j$', '      c[i, j] ← c[i−1, j−1] + 1          // ↖', '    else', '      c[i, j] ← max(c[i−1, j], c[i, j−1])  // ↑ ←', 'trace back from (n, m): each ↖ gives a letter'];
        const EX = { a: ['AACCTTGG', 'ACACTGTGA'], b: ['GATTACA', 'GCATGCT'], c: ['ACGTACGT', 'TGCATGCA'] };
        let X = EX.a[0], Y = EX.a[1];
        const clean = (z) => cleanSeq(z, 'A-Z', 10) || 'A';
        const xin = v.input('$s$', X, { width: 130, onChange: (z) => { X = clean(z); S.reset(); } });
        const yin = v.input('$t$', Y, { width: 130, onChange: (z) => { Y = clean(z); S.reset(); } });
        v.select('example', [{ value: 'a', label: 'AACCTTGG / ACACTGTGA' }, { value: 'b', label: 'GATTACA / GCATGCT' }, { value: 'c', label: 'ACGTACGT / TGCATGCA' }], 'a', {
          onChange: (k) => { X = EX[k][0]; Y = EX[k][1]; xin.set(X); yin.set(Y); S.reset(); },
        });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400 });
        const T = v.table(st, { maxCell: 40, size: 14.5 });
        function frames() {
          const n = X.length, m = Y.length, c = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null)), p = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
          const out = [], snap = (o) => out.push({ vals: c.map((r) => r.slice()), ptr: p.map((r) => r.slice()), ...o });
          for (let i = 0; i <= n; i++) c[i][0] = 0; for (let j = 0; j <= m; j++) c[0][j] = 0;
          snap({ line: 1, note: 'A common subsequence of a prefix and the empty string is empty, so row 0 and column 0 are 0.' });
          for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
            const a = X[i - 1], b = Y[j - 1];
            if (a === b) { c[i][j] = c[i - 1][j - 1] + 1; p[i][j] = [-1, -1]; snap({ cur: [i, j], deps: [[i - 1, j - 1]], line: [4, 5], note: `**${a}** = **${b}**: extend the diagonal, $c[${i},${j}] = ${c[i - 1][j - 1]} + 1 = ${c[i][j]}$.` }); }
            else { const up = c[i - 1][j], left = c[i][j - 1]; c[i][j] = Math.max(up, left); p[i][j] = up >= left ? [-1, 0] : [0, -1]; snap({ cur: [i, j], deps: [[i - 1, j], [i, j - 1]], line: [6, 7], note: `**${a}** ≠ **${b}**: take the larger of above (${up}) and left (${left}), giving ${c[i][j]} ${up >= left ? '↑' : '←'}.` }); }
          }
          let i = n, j = m; const path = [[i, j]], got = [];
          snap({ path: path.slice(), line: 8, note: `Table complete: the longest common subsequence has length **${c[n][m]}**. Now trace back from the corner.` });
          while (i > 0 && j > 0) {
            const [di, dj] = p[i][j]; if (di && dj) got.unshift(X[i - 1]);
            i += di; j += dj; path.push([i, j]);
            snap({ path: path.slice(), line: 8, hold: 0.6, note: `Letters collected so far (read backwards): **${got.join('') || '—'}**` });
          }
          snap({ path: path.slice(), line: 8, hold: 2, note: `A longest common subsequence of ${X} and ${Y}: **${got.join('') || '(empty)'}**, length ${got.length}.`, result: got.join('') });
          return out;
        }
        const S = v.steps({ frames, code: CODE, codeTitle: 'LCS(s, t)', speed: 4, start: 'end' });
        v.render(() => {
          const f = S.frame, key = (i, j) => i * 100 + j, path = f.path || [];
          const onPath = new Set(path.map(([i, j]) => key(i, j))), deps = new Set((f.deps || []).map(([i, j]) => key(i, j))), diag = new Set();
          for (let k = 0; k + 1 < path.length; k++) if (path[k][0] - path[k + 1][0] === 1 && path[k][1] - path[k + 1][1] === 1 && X[path[k][0] - 1] === Y[path[k][1] - 1]) diag.add(key(...path[k]));
          T.draw({
            rows: X.length + 1, cols: Y.length + 1, rowLabels: ['', ...X], colLabels: ['', ...Y], cornerLabel: '',
            value: (i, j) => f.vals[i][j],
            fill: (i, j) => (f.cur && f.cur[0] === i && f.cur[1] === j ? ['gold', 0.42] : deps.has(key(i, j)) ? ['orange', 0.3] : diag.has(key(i, j)) ? ['green', 0.42] : onPath.has(key(i, j)) ? ['green', 0.16] : null),
            textColor: (i, j) => (f.vals[i][j] == null ? null : onPath.has(key(i, j)) || (f.cur && f.cur[0] === i && f.cur[1] === j) ? 'ink' : 'muted'),
            weight: (i, j) => (onPath.has(key(i, j)) || (f.cur && f.cur[0] === i && f.cur[1] === j) ? 700 : 500),
            highlight: f.cur ? [f.cur] : [], activeRow: f.cur?.[0], activeCol: f.cur?.[1],
          });
          for (let i = 0; i <= X.length; i++) for (let j = 0; j <= Y.length; j++) if (f.ptr[i][j] && !(f.cur && f.cur[0] === i && f.cur[1] === j)) T.pointer(i, j, f.ptr[i][j], { color: onPath.has(key(i, j)) ? 'green' : 'faint' });
          if (f.cur) { const [di, dj] = f.ptr[f.cur[0]][f.cur[1]]; T.arrow(f.cur, [f.cur[0] + di, f.cur[1] + dj], { color: 'accent', width: 2.2 }); }
          for (let k = 0; k + 1 < path.length; k++) T.arrow(path[k], path[k + 1], { color: 'green', width: 2.6 });
        });
        v.readout(() => {
          const r = align(X, Y, { score: scoreFn('simple', 1, -1e3), go: 0, ge: 0 }), L = r.score;
          return `$|\\mathrm{LCS}| = ${L}$ (checked by the general aligner with match $+1$, no mismatch columns allowed, free gaps)  ·  indel distance $n + m - 2|\\mathrm{LCS}| = ${X.length + Y.length - 2 * L}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Concept',
      name: 'Alignment as a longest path in a DAG',
      statement: String.raw`Give every edge of the edit graph a weight: the substitution score $\sigma(s_i,t_j)$ on a diagonal edge and the gap score $-d$ on a vertical or horizontal edge. The graph is acyclic (every edge increases $i+j$), so the heaviest path from $(0,0)$ to any vertex $(i,j)$ is found by visiting vertices in topological order and taking the best incoming edge: $F(i,j)=\max\{F(i-1,j-1)+\sigma(s_i,t_j),\,F(i-1,j)-d,\,F(i,j-1)-d\}$. The values $F(i,j)$ are exactly the entries of the alignment table, and the longest path is an optimal global alignment. Longest common subsequence is the special case with weight $1$ on match diagonals (mismatch diagonals absent) and $0$ on gap edges.`,
      idea: String.raw`Longest paths in a DAG are easy because a topological order (algo-9.5) means every vertex's predecessors are final when it is reached; row-major order is one such order here. Reading the recurrence of the previous item as "best incoming edge" shows it is nothing but that relaxation, which is why every variant of alignment in this chapter (local, affine, fitting) is a modification of the graph, not a new algorithm.`,
      caption: String.raw`The grid graph (left) and its table (right) fill in together, one vertex per step in topological order; each vertex shows the longest-path value found so far. Gold edges are the candidates for the current vertex. At the end the green path is the optimum. Switch the weights between *LCS* and *alignment scoring*; the readout checks the DAG's answer against an independent run of the general aligner.`,
      deps: ['bioinf-2.2', 'algo-9.5'],
      refs: ['Compeau–Pevzner ch. 5'],
      tags: ['alignment', 'dag', 'longest path'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Directed_acyclic_graph' },
      viz(v) {
        let X = 'ACGT', Y = 'AGTT', mode = 'lcs';
        const xin = v.input('$s$', X, { width: 100, onChange: (z) => { X = cleanSeq(z, 'A-Z', 5) || 'A'; rebuild(); } });
        const yin = v.input('$t$', Y, { width: 100, onChange: (z) => { Y = cleanSeq(z, 'A-Z', 5) || 'A'; rebuild(); } });
        v.select('edge weights', [{ value: 'lcs', label: 'LCS (match 1, else 0)' }, { value: 'score', label: 'scoring (+1, −1, gap −1)' }], 'lcs', { onChange: (m) => { mode = m; rebuild(); } });
        const sg = v.stage({ x: [-0.8, 5.4], y: [-5.2, 0.8], equal: true, axes: false, height: 330, title: 'the edit graph as a weighted DAG', minWidth: 300 });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'the alignment table', minWidth: 300 });
        const T = v.table(st, { maxCell: 44, size: 14 });
        const wDiag = (i, j) => (mode === 'lcs' ? (X[i - 1] === Y[j - 1] ? 1 : null) : (X[i - 1] === Y[j - 1] ? 1 : -1));
        const wGap = () => (mode === 'lcs' ? 0 : -1);
        const id = (i, j) => `${i},${j}`;
        const G = v.graph(sg, { directed: true, layout: 'none', draggable: false, shape: 'circle', r: 8, autoRadius: false, nodes: [{ id: '0,0', x: 0, y: 0 }], edges: [] });
        function rebuild() {
          const n = X.length, m = Y.length, nodes = [], edges = [];
          for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) nodes.push({ id: id(i, j), x: j, y: -i, label: '', notePos: 'nw' });
          for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
            if (j < m) edges.push({ from: id(i, j), to: id(i, j + 1), w: wGap(), kind: 'h' });
            if (i < n) edges.push({ from: id(i, j), to: id(i + 1, j), w: wGap(), kind: 'v' });
            if (i < n && j < m && wDiag(i + 1, j + 1) !== null) edges.push({ from: id(i, j), to: id(i + 1, j + 1), w: wDiag(i + 1, j + 1), kind: 'd' });
          }
          G.set({ nodes, edges, directed: true });
          sg.setView([-1, m + 1.2], [-n - 1.2, 1]);
          S.reset(undefined, { at: 'end' });
        }
        function frames() {
          const n = X.length, m = Y.length, F = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null)), B = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null)), out = [];
          const snap = (o) => out.push({ F: F.map((r) => r.slice()), B: B.map((r) => r.slice()), ...o });
          F[0][0] = 0; snap({ cur: [0, 0], cands: [], line: 1, note: 'The source $(0,0)$ has longest-path value 0.' });
          for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
            if (i === 0 && j === 0) continue;
            const c = [];
            if (i > 0 && j > 0 && wDiag(i, j) !== null) c.push({ from: [i - 1, j - 1], w: wDiag(i, j), kind: 'd' });
            if (i > 0) c.push({ from: [i - 1, j], w: wGap(), kind: 'v' });
            if (j > 0) c.push({ from: [i, j - 1], w: wGap(), kind: 'h' });
            let best = -Infinity, bk = null;
            for (const e of c) { const val = F[e.from[0]][e.from[1]] + e.w; e.val = val; if (val > best) { best = val; bk = e; } }
            F[i][j] = best; B[i][j] = bk.from;
            snap({ cur: [i, j], cands: c, line: [2, 3], note: `Vertex $(${i},${j})$: incoming ${c.map((e) => `$${e.val}$`).join(', ')} → keep the maximum, **${best}**.` });
          }
          const path = [[n, m]]; let [i, j] = [n, m];
          while (i || j) { [i, j] = B[i][j]; path.push([i, j]); }
          snap({ path, line: 4, hold: 2, note: `Longest path to the sink has weight **${F[n][m]}**; the green edges are an optimal alignment.` });
          return out;
        }
        const S = v.steps({ frames, code: ['F(source) ← 0', 'for each vertex u in topological order', '  F(u) ← max over incoming edges (p → u) of F(p) + w(p → u)', '  remember the winning predecessor', 'trace the winners back from the sink'], codeTitle: 'Longest path in a DAG', speed: 5, start: 'end' });
        rebuild();
        v.render(() => {
          const f = S.frame, n = X.length, m = Y.length, pathSet = new Set((f.path || []).map((p) => id(...p)));
          const isCand = (e) => (f.cands || []).some((c) => id(...c.from) === e.from && e.to === id(...f.cur) && c.kind === e.kind);
          const onPathEdge = (e) => { const p = f.path; if (!p) return false; for (let k = 0; k + 1 < p.length; k++) if (id(...p[k + 1]) === e.from && id(...p[k]) === e.to) return true; return false; };
          G.draw({
            nodeNote: (nid) => { const [i, j] = nid.split(',').map(Number); return f.F[i][j] === null ? null : String(f.F[i][j]).replace('-', '−'); },
            noteColor: (nid) => (pathSet.has(nid) ? 'green' : 'muted'),
            nodeFill: (nid) => (f.cur && id(...f.cur) === nid ? 'gold' : pathSet.has(nid) ? 'green' : null),
            nodeColor: (nid) => { const [i, j] = nid.split(',').map(Number); return f.F[i][j] === null ? 'faint' : 'accent'; },
            edgeColor: (e) => (onPathEdge(e) ? 'green' : isCand(e) ? 'gold' : e.kind === 'd' ? 'accent' : 'faint'),
            edgeWidth: (e) => (onPathEdge(e) ? 3.4 : isCand(e) ? 3 : 1.4),
            edgeLabel: (e) => (e.kind === 'd' ? String(e.w).replace('-', '−') : mode === 'score' && e.kind !== 'd' && isCand(e) ? '−1' : null),
            edgeLabelColor: (e) => (e.w > 0 ? 'green' : 'muted'),
            arrows: true,
          });
          const path = f.path || [], onP = new Set(path.map((p) => id(...p)));
          T.draw({
            rows: n + 1, cols: m + 1, rowLabels: ['', ...X], colLabels: ['', ...Y], cornerLabel: '',
            value: (i, j) => f.F[i][j], fill: (i, j) => (f.cur && f.cur[0] === i && f.cur[1] === j ? ['gold', 0.42] : onP.has(id(i, j)) ? ['green', 0.3] : f.F[i][j] !== null ? ['accent', 0.1] : null),
            highlight: f.cur ? [f.cur] : [], textColor: (i, j) => (f.F[i][j] === null ? null : 'ink'),
          });
        });
        v.readout(() => {
          const sc = mode === 'lcs' ? scoreFn('simple', 1, -1e3) : scoreFn('simple', 1, -1), go = mode === 'lcs' ? 0 : 1;
          const f = S.frame, r = align(X, Y, { score: sc, go, ge: go });
          const mine = f.F[X.length][Y.length];
          return `DAG value at the sink so far: **${mine === null ? '…' : String(mine).replace('-', '−')}**  ·  general aligner (table recursion): **${fmtN(r.score)}**${mine !== null && mine === r.score ? '  ✓ equal' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Substitution matrices as log-odds scores (PAM, BLOSUM)',
      statement: String.raw`A substitution score should measure how much more often two residues $a,b$ are found aligned in related proteins than chance would put them together: with $p_{ab}$ the observed frequency of aligned pairs and $q_a$ the background frequency of $a$,
$$s(a,b)=\frac1\lambda\log\frac{p_{ab}}{q_aq_b},$$
usually rounded to an integer (BLOSUM uses half-bit units, $\lambda=\ln2/2$). A positive score says "seen together more than by chance". Summing such scores over the columns of an alignment is the log of a likelihood ratio between "related" and "unrelated"; PAM matrices extrapolate pair frequencies from closely related sequences by powers of a Markov chain, BLOSUM matrices count them directly in conserved blocks of sequences clustered at a given identity.`,
      idea: String.raw`The likelihood-ratio form is the relative-entropy idea (info-2.1) in disguise: the expected score of a pair drawn from the "related" distribution is $\sum p_{ab}s(a,b)=H(p\|q)/\lambda\ge0$, while for unrelated residues it is negative, which is what makes local alignment possible. Which pairs get high scores is biochemistry: Ile/Val/Leu are readily exchanged and score positively, Trp/Cys are rarely replaced and score high only against themselves.

For positive pair and background probabilities, the product-log identity in pma-8.6 turns a product of per-column likelihood ratios into the sum of the unrounded log-odds scores. This interpretation assumes the column factorization used by the scoring model. Integer rounding and gap penalties are additional modeling choices; the logarithm identity alone does not calibrate them or establish relatedness.`,
      caption: String.raw`This builds a BLOSUM-like matrix from **real aligned proteins**: 91 pairs from five UniProt families (globins, cytochrome c, lysozyme/lactalbumin, serine proteases, thioredoxins) are aligned locally and every aligned column is counted. The slider drops pairs more identical than a threshold, a crude cousin of BLOSUM's clustering. **Click** a cell for $p_{ab}$, $q_aq_b$ and the score; the scatter plot compares the matrix you built with the published BLOSUM62 (the sparse data is why it is noisy).`,
      scope: String.raw`The pair counts here come from only 91 pairs (about ten thousand columns), so rare residues have few observations and a pseudo-count is added; the published matrices use thousands of conserved blocks.`,
      credit: 'Dayhoff, Schwartz & Orcutt, 1978 (PAM); Henikoff & Henikoff, 1992 (BLOSUM)',
      deps: ['bioinf-2.1','info-2.1','pma-8.6'],
      refs: ['Durbin ch. 2'],
      tags: ['substitution matrix', 'log-odds', 'blosum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/BLOSUM' },
      viz(v) {
        const thr = v.slider('use pairs up to this % identity', 25, 100, 62, { int: true });
        const which = v.select('matrix shown', [{ value: 'mine', label: 'counted here' }, { value: 'b62', label: 'BLOSUM62' }, { value: 'pam', label: 'PAM250' }], 'mine');
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 560, title: 'substitution scores', minWidth: 440, weight: 1.5 });
        const sc = v.stage({ x: [-8, 12], y: [-8, 12], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'counted here (half-bit units)', ylabel: 'published BLOSUM62', title: 'my matrix against BLOSUM62', minWidth: 280 });
        const T = v.table(st, { maxCell: 27, size: 10.5 });
        let sel = [aaIndex('W'), aaIndex('F')], L = null, Lkey = null;
        st.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const get = () => { if (Lkey !== thr.value) { L = logOdds(thr.value); Lkey = thr.value; } return L; };
        const value = (i, j) => (which.value === 'mine' ? Math.round(get().S[i][j]) : which.value === 'b62' ? B62[i][j] : PAM250[i][j]);
        v.render(() => {
          const Lo = get();
          T.draw({
            rows: 20, cols: 20, rowLabels: AA.split(''), colLabels: AA.split(''), cornerLabel: '',
            value: (i, j) => value(i, j), size: 10.5,
            fill: (i, j) => { const x = value(i, j); return x >= 0 ? ['green', Math.min(0.6, 0.06 + 0.06 * x)] : ['red', Math.min(0.5, 0.05 + 0.05 * -x)]; },
            highlight: [sel], activeRow: sel[0], activeCol: sel[1],
          });
          sc.line(-8, -8, 12, 12, { color: 'faint', dash: true });
          for (let i = 0; i < 20; i++) for (let j = i; j < 20; j++) sc.dot(Lo.S[i][j], B62[i][j], { r: 2.6, color: i === sel[0] && j === sel[1] || i === sel[1] && j === sel[0] ? 'gold' : 'purple' });
          const [a, b] = [Math.min(sel[0], sel[1]), Math.max(sel[0], sel[1])];
          sc.dot(Lo.S[a][b], B62[a][b], { r: 6, color: 'gold', label: AA[a] + AA[b], labelPos: 'ne' });
        });
        v.readout(() => {
          const Lo = get(), [i, j] = sel, a = Math.min(i, j), b = Math.max(i, j);
          const xs = [], ys = []; for (let p = 0; p < 20; p++) for (let q = p; q < 20; q++) { xs.push(Lo.S[p][q]); ys.push(B62[p][q]); }
          const mx = xs.reduce((u, w) => u + w) / xs.length, my = ys.reduce((u, w) => u + w) / ys.length;
          let sxy = 0, sxx = 0, syy = 0; xs.forEach((x, k) => { sxy += (x - mx) * (ys[k] - my); sxx += (x - mx) ** 2; syy += (ys[k] - my) ** 2; });
          const r = sxy / Math.sqrt(sxx * syy), e = Lo.E[a][b], p = Lo.P[a][b];
          return `**${AA[i]}–${AA[j]}**: counted ${Lo.c[a][b]} times · $p = ${v.sci(p, 3)}$ · $q_aq_b$-expected $= ${v.sci(e, 3)}$ (${v.fix(e * Lo.N, 1)} columns) · observed/expected ${v.fix(p / e, 2)} · smoothed $2\\log_2\\frac{c+1}{Nq_aq_b+1} = ${v.fix(Lo.S[a][b], 2)}$ → **${Math.round(Lo.S[a][b])}**  (BLOSUM62: **${B62[i][j]}**, PAM250: ${PAM250[i][j]})\n` +
            `${Lo.pairs} pairs, ${Lo.N.toLocaleString('en-US')} aligned columns · correlation of the 210 scores with BLOSUM62: $r = ${v.fix(r, 2)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Algorithm',
      name: 'Needleman–Wunsch global alignment',
      statement: String.raw`Given a score $\sigma(a,b)$ and a linear gap cost $d$ per gapped position, the best global alignment score $F(i,j)$ of $s_1\cdots s_i$ with $t_1\cdots t_j$ satisfies $F(0,0)=0$, $F(i,0)=-id$, $F(0,j)=-jd$ and
$$F(i,j)=\max\{F(i-1,j-1)+\sigma(s_i,t_j),\ F(i-1,j)-d,\ F(i,j-1)-d\}.$$
$F(n,m)$ is the optimal score, and tracing back the arrows that achieved each maximum from $(n,m)$ to $(0,0)$ yields an optimal alignment. Time and space are $O(nm)$. Scores must be additive over columns for this to be valid.`,
      idea: String.raw`It is the longest-path computation of the DAG item with the diagonal weights supplied by a substitution matrix: any prefix of an optimal path is an optimal path to its endpoint, so each cell needs only its three neighbours. Ties give several optimal alignments; the traceback shown prefers diagonals. Changing $\sigma$ or $d$ changes the answer, which is why the choice of matrix (log-odds, previous item) carries the biology.`,
      caption: String.raw`Edit the sequences or choose an example, pick a scoring system, and drag the gap cost. The table is recomputed; small arrows show every optimal predecessor and the bold green path is the traceback. **Click a cell** to see its three candidate values. The alignment is written underneath (| identical, : positive score, · negative).`,
      credit: 'Needleman & Wunsch, 1970',
      deps: ['bioinf-2.2', 'bioinf-2.4'],
      refs: ['Durbin ch. 2'],
      tags: ['alignment', 'global alignment', 'dynamic programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm' },
      viz(v) {
        const EX = {
          heag: ['HEAGAWGHEE', 'PAWHEAE', 'a classic teaching pair'],
          globin: [PROT.HBA_HUMAN.seq.slice(5, 19), PROT.HBB_HUMAN.seq.slice(2, 16), 'human α- and β-globin fragments (UniProt P69905, P68871)'],
          dna: ['GATTACA', 'GCATGCT', 'DNA'],
        };
        let sq = EX.heag[0], tq = EX.heag[1];
        const sin = v.input('$s$ (rows)', sq, { width: 190, onChange: (z) => { sq = cleanSeq(z, 'A-Z', 16) || 'A'; } });
        const tin = v.input('$t$ (columns)', tq, { width: 190, onChange: (z) => { tq = cleanSeq(z, 'A-Z', 16) || 'A'; } });
        v.select('example', [{ value: 'heag', label: 'HEAGAWGHEE / PAWHEAE' }, { value: 'globin', label: 'globin fragments' }, { value: 'dna', label: 'GATTACA / GCATGCT' }], 'heag', {
          onChange: (k) => { sq = EX[k][0]; tq = EX[k][1]; sin.set(sq); tin.set(tq); sel = null; },
        });
        const mat = v.select('scores', [{ value: 'blosum62', label: 'BLOSUM62' }, { value: 'pam250', label: 'PAM250' }, { value: 'simple', label: 'match/mismatch' }], 'blosum62');
        const ma = v.slider('match', 0, 6, 2, { int: true }), mi = v.slider('mismatch', -6, 0, -1, { int: true });
        const gp = v.slider('gap cost $d$', 0, 12, 5, { int: true });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, title: 'dynamic-programming table' });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true, title: 'optimal global alignment' });
        const T = v.table(st, { maxCell: 42, size: 13 });
        let sel = null;
        st.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const opts = () => ({ score: scoreFn(mat.value, ma.value, mi.value), go: gp.value, ge: gp.value });
        v.render(() => {
          ma.el.hidden = mi.el.hidden = mat.value !== 'simple';
          const o = opts(), r = align(sq, tq, o), n = sq.length, m = tq.length;
          if (sel && (sel[0] > n || sel[1] > m)) sel = null;
          const onP = new Set(r.path.map(([i, j]) => i * 100 + j));
          T.draw({
            rows: n + 1, cols: m + 1, rowLabels: ['', ...sq], colLabels: ['', ...tq], cornerLabel: '',
            value: (i, j) => r.H[i][j], fill: (i, j) => (onP.has(i * 100 + j) ? ['green', 0.3] : i === n && j === m ? ['gold', 0.3] : null),
            highlight: sel ? [sel] : [], weight: (i, j) => (onP.has(i * 100 + j) ? 700 : 500),
          });
          for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) if (i + j > 0) for (const d of linPtrs(r, i, j)) T.pointer(i, j, d, { color: onP.has(i * 100 + j) ? 'green' : 'faint' });
          for (let k = 0; k + 1 < r.path.length; k++) T.arrow(r.path[k + 1], r.path[k], { color: 'green', width: 2.6 });
          drawAln(sa, r, o.score, { labels: ['s', 't'] });
        });
        v.readout(() => {
          const o = opts(), r = align(sq, tq, o), n = sq.length, m = tq.length, re = alnScore(r.top, r.bot, o);
          let line = `optimal global score **${fmtN(r.score)}** · ${r.ident} identities in ${r.len} columns (${v.fix((100 * r.ident) / r.len, 0)}%) · ${r.gaps} gap positions · re-scored from the printed alignment: ${fmtN(re)}${re === r.score ? ' ✓' : ' ✗'}`;
          if (sel) {
            const [i, j] = sel, c = [];
            if (i > 0 && j > 0) c.push(`↖ ${fmtN(r.H[i - 1][j - 1])} + ${o.score(sq[i - 1], tq[j - 1])}`);
            if (i > 0) c.push(`↑ ${fmtN(r.H[i - 1][j])} − ${o.go}`); if (j > 0) c.push(`← ${fmtN(r.H[i][j - 1])} − ${o.go}`);
            line += `\ncell $(${i},${j})$ = max( ${c.join(' ,  ')} ) = **${fmtN(r.H[i][j])}**`;
          }
          return line;
        });
      },
    },
  ],
};
