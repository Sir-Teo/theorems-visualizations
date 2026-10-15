// Algorithms — Chapter 2: Recurrences and divide and conquer (items 2.1–2.7; 2.8–2.14 in ch02-b.js)

const LG = Math.log2;
// TeX for a (possibly huge) number
function tnum(x, sig = 3) {
  if (!isFinite(x)) return '\\infty';
  const a = Math.abs(x);
  if (a >= 1e6) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${m.toFixed(sig - 1)}\\times10^{${e}}`; }
  if (Number.isInteger(x) || a >= 100) return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  return String(+x.toPrecision(sig));
}
// f(n) = n^d (lg n)^k, with lg n floored at 1 so that negative k stays finite
const fpow = (n, d, k) => Math.pow(n, d) * (k ? Math.pow(Math.max(LG(n), 1), k) : 1);
const FN = { c: ['1', 0, 0], lg: ['\\lg n', 0, 1], sq: ['\\sqrt n', 0.5, 0], n: ['n', 1, 0], nlg: ['n\\lg n', 1, 1], n2: ['n^2', 2, 0], n3: ['n^3', 3, 0] };

// Complete a-ary recursion tree drawn level by level in x ∈ [x0, x1], level i at y = ys(i).
// Levels with more than `cap` nodes become a shaded band fed by fans from the last drawn level.
function treeLevels(s, a, L, x0, x1, ys, o = {}) {
  const cap = o.cap ?? 64, colOf = o.levelColor || (() => 'accent');
  const levels = [];
  for (let i = 0; i < L; i++) {
    const cnt = Math.pow(a, i);
    if (cnt > cap) { levels.push(null); continue; }
    const w = (x1 - x0) / cnt; levels.push(Array.from({ length: cnt }, (_, j) => x0 + (j + 0.5) * w));
  }
  for (let i = 1; i < L; i++) {
    const P = levels[i - 1], C = levels[i];
    if (P && C) C.forEach((x, j) => s.line(P[Math.floor(j / a)], ys(i - 1), x, ys(i), { color: 'muted', width: 1, alpha: 0.55 }));
    else if (P && !C) { const w = (x1 - x0) / P.length; P.forEach((x, j) => s.poly([[x, ys(i - 1)], [x0 + (j + 1) * w, ys(i) + 0.18], [x0 + j * w, ys(i) + 0.18]], { fill: colOf(i), fillAlpha: 0.1, stroke: false })); }
  }
  for (let i = 0; i < L; i++) {
    const C = levels[i], y = ys(i), col = colOf(i);
    if (C) {
      const slot = Math.abs(s.X(x0 + (x1 - x0) / C.length) - s.X(x0)), r = Math.max(1.6, Math.min(o.r ?? 7, slot * 0.36));
      C.forEach((x) => s.dot(x, y, { r, color: col }));
    } else {
      s.rect(x0, y - 0.18, x1, y + 0.18, { fill: col, fillAlpha: 0.22, color: col, width: 1 });
      s.text(`${tnum(Math.pow(a, i)).replace(/\{,\}/g, ',').replace(/\\times10\^\{(\d+)\}/, ' × 10^$1')} nodes`, (x0 + x1) / 2, y, { align: 'center', size: 11, color: 'ink', weight: 600 });
    }
  }
}

// ---- 2.3 merge sort frames: every frame a full snapshot
const MS_CODE = [
  'Merge-Sort(A, lo, hi):   ▷ sorts A[lo..hi)',
  '  if hi − lo ≤ 1: return',
  '  mid ← lo + ⌈(hi − lo)/2⌉',
  '  Merge-Sort(A, lo, mid);  Merge-Sort(A, mid, hi)',
  '  L ← A[lo..mid);  R ← A[mid..hi);  i, j ← 0;  k ← lo',
  '  while i < |L| and j < |R|:',
  '    if L[i] ≤ R[j]:  A[k] ← L[i];  i ← i + 1   ▷ 1 comparison',
  '    else:  A[k] ← R[j];  j ← j + 1',
  '    k ← k + 1',
  '  copy the rest of L or R into A[k..hi)',
];
function mergeFrames(vals) {
  const n = vals.length, A = vals.slice(), frames = [], done = []; let C = 0;
  const snap = (o) => frames.push({ A: A.slice(), C, done: done.slice(), ...o });
  snap({ line: 1, note: `Unsorted input of length ${n}. The recursion first splits it down to single elements, which are sorted already.` });
  (function sort(lo, hi, dep) {
    if (hi - lo <= 1) { done.push([lo, hi, dep]); return; }
    const mid = lo + Math.ceil((hi - lo) / 2);
    sort(lo, mid, dep + 1); sort(mid, hi, dep + 1);
    const L = A.slice(lo, mid), R = A.slice(mid, hi), seg = [lo, mid, hi, dep]; let i = 0, j = 0, k = lo;
    snap({ seg, L, R, i, j, k, line: [4, 5], note: `Both halves are sorted. Copy them to $L$ and $R$ and merge back into $A[${lo}..${hi})$.` });
    while (i < L.length && j < R.length) {
      C++; const x = L[i], y = R[j], tl = x <= y;
      A[k++] = tl ? L[i++] : R[j++];
      snap({ seg, L, R, i, j, k, cmp: [tl ? i - 1 : i, tl ? j : j - 1], line: [6, tl ? 7 : 8], note: `Compare ${x} with ${y}: ${tl ? `${x} ≤ ${y}, take it from $L$` : `${y} < ${x}, take it from $R$`}. Output $A[${lo}..${k})$ = the ${k - lo} smallest of the two halves, in order.` });
    }
    const rest = L.length - i + R.length - j;
    while (i < L.length) A[k++] = L[i++];
    while (j < R.length) A[k++] = R[j++];
    done.push([lo, hi, dep]);
    snap({ seg, L, R, i, j, k, line: 10, hold: 1.3, note: `One side is used up: the ${rest} element${rest === 1 ? '' : 's'} left over ${rest === 1 ? 'is' : 'are'} copied without comparing. $A[${lo}..${hi})$ is sorted.` });
  })(0, n, 0);
  frames[frames.length - 1].note = `Sorted, after **${C}** comparisons.`;
  return frames;
}
// input that forces every merge to interleave completely (worst case)
const worstPerm = (arr) => (arr.length <= 1 ? arr : worstPerm(arr.filter((_, i) => i % 2 === 0)).concat(worstPerm(arr.filter((_, i) => i % 2 === 1))));

export default {
  collection: 'algo',
  chapter: 2,
  title: 'Recurrences and divide and conquer',
  summary: String.raw`Splitting a problem into smaller copies of itself, solving those recursively and stitching the answers together produces running times that satisfy recurrences. Recursion trees make the cost of each level visible, and the master theorem reads off the answer from which levels dominate; Akra–Bazzi extends this to uneven splits, and floors, ceilings and changes of variables do not disturb the picture. Merge sort, the Tower of Hanoi, fast exponentiation, inversion counting and backtracking search are the first examples.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Method',
      name: 'Divide and conquer',
      statement: String.raw`**Divide and conquer** solves an instance of size $n$ in three steps:
(a) **divide** it into $a\ge 1$ instances of the same problem, each strictly smaller;
(b) **conquer** them by recursive calls, solving every instance below a fixed size directly (the *base cases*);
(c) **combine** the $a$ sub-answers into an answer for the whole instance.

The calls form a **recursion tree**: the root is the input, the children of a node are its subinstances, the leaves are base cases. The algorithm is correct as soon as the base cases are solved correctly and the combine step turns correct sub-answers into a correct answer, and its running time is the sum over all nodes of the divide and combine work done there, which leads to a recurrence such as $T(n)=a\,T(n/b)+D(n)+C(n)$.`,
      idea: String.raw`Correctness is strong induction on the size: sizes strictly decrease along every branch, so every branch ends in a base case (a decreasing variant, 1.6), the leaves are right, and each combine step preserves rightness on the way up. Cost is bookkeeping: charge every node for its own divide and combine work and add everything up, level by level if the tree is regular (the recursion-tree method, 2.6). For the maximum of $n$ numbers, the combine step at a node with $k$ children makes $k-1$ comparisons, and a leaf of size $m$ solved by scanning makes $m-1$; the total is $n-1$ for *every* tree, because each comparison eliminates one candidate.`,
      caption: String.raw`Click a box to split that subarray into the chosen number of parts, click a split box again to collapse it. Single elements are base cases (green). **Solve leaves** scans each larger leaf directly (teal); a parent combines as soon as all its children are solved. The numbers beside the boxes are comparisons charged to that node; their sum is always $n-1$.`,
      deps: ['algo-1.1', 'algo-1.6'],
      refs: ['CLRS 4e §2.3', 'Erickson Ch. 1'],
      tags: ['divide and conquer'],
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350 });
        const kSel = v.select('split into', ['2', '3', '4'], '2');
        const nS = v.slider('n', 2, 12, 8, { int: true, onChange: () => { vals = base.slice(0, nS.value); root = mk(0, nS.value); rebuild(); } });
        const rng = v.rng(11);
        let base = [5, 2, 9, 4, 7, 1, 8, 3, 6, 11, 10, 12], vals = base.slice(0, 8);
        const mk = (lo, hi) => ({ lo, hi, kids: [], direct: false, solved: false, res: null, cost: 0 });
        let root = mk(0, 8);
        const split = (nd, k) => { const m = nd.hi - nd.lo; k = Math.min(k, m); let lo = nd.lo; nd.kids = []; nd.direct = false; for (let t = 0; t < k; t++) { const sz = Math.floor(m / k) + (t < m % k ? 1 : 0); nd.kids.push(mk(lo, lo + sz)); lo += sz; } };
        split(root, 2); split(root.kids[0], 2); split(root.kids[0].kids[0], 2);
        const update = (nd) => {
          const m = nd.hi - nd.lo; nd.solved = false; nd.res = null; nd.cost = 0; nd.how = null;
          if (nd.kids.length) { nd.kids.forEach(update); if (nd.kids.every((c) => c.solved)) Object.assign(nd, { solved: true, res: Math.max(...nd.kids.map((c) => c.res)), cost: nd.kids.length - 1, how: 'combine' }); }
          else if (m === 1) Object.assign(nd, { solved: true, res: vals[nd.lo], how: 'base' });
          else if (nd.direct) Object.assign(nd, { solved: true, res: Math.max(...vals.slice(nd.lo, nd.hi)), cost: m - 1, how: 'direct' });
        };
        const G = v.graph(s, { nodes: [], edges: [], layout: 'none', shape: 'box', draggable: false, fontSize: 12, notePos: 'e' });
        let stats = {};
        function rebuild() {
          update(root);
          const nodes = [], edges = []; stats = { direct: 0, combine: 0, depth: 0, count: 0, open: 0 };
          (function walk(nd, id, dep) {
            const sub = vals.slice(nd.lo, nd.hi).join(' ');
            nodes.push({ id, ref: nd, label: nd.solved && nd.hi - nd.lo > 1 ? `${sub}\n→ ${nd.res}` : sub });
            stats.count++; stats.depth = Math.max(stats.depth, dep);
            if (nd.how === 'direct') stats.direct += nd.cost; if (nd.how === 'combine') stats.combine += nd.cost;
            if (!nd.kids.length && !nd.solved) stats.open++;
            nd.kids.forEach((c, t) => { walk(c, id + '.' + t, dep + 1); edges.push([id, id + '.' + t]); });
          })(root, 'r', 0);
          G.set({ nodes, edges }).layout('tree', { root: 'r' });
        }
        G.onClick = ({ node }) => {
          if (!node) return true; const nd = node.ref;
          if (nd.kids.length) nd.kids = []; else if (nd.hi - nd.lo > 1) split(nd, +kSel.value);
          rebuild(); v.invalidate(); return true;
        };
        v.button('Split all', () => { (function go(nd) { if (nd.hi - nd.lo > 1) { if (!nd.kids.length) split(nd, +kSel.value); nd.kids.forEach(go); } })(root); rebuild(); });
        v.button('Solve leaves', () => { (function go(nd) { if (nd.kids.length) nd.kids.forEach(go); else nd.direct = true; })(root); rebuild(); });
        v.button('Reset', () => { root = mk(0, vals.length); rebuild(); });
        v.button('Shuffle', () => { base = rng.shuffle(base); vals = base.slice(0, nS.value); rebuild(); });
        rebuild();
        v.render(() => G.draw({
          nodeFill: (id, n) => (n.ref.how === 'base' ? 'green' : n.ref.how === 'direct' ? 'teal' : n.ref.how === 'combine' ? 'green' : null),
          nodeColor: (id, n) => (n.ref.solved ? null : n.ref.kids.length ? 'accent' : 'orange'),
          nodeNote: (id, n) => (n.ref.cost ? `${n.ref.cost}` : null),
          noteColor: 'gold',
        }));
        v.legend([['green', 'base case / combined', { dot: true }], ['teal', 'solved by scanning', { dot: true }], ['orange', 'leaf still to solve', { dot: true }], ['gold', 'comparisons at a node', { dot: true }]]);
        v.readout(() => {
          const n = vals.length, tot = stats.direct + stats.combine;
          return `${stats.count} subproblems, depth ${stats.depth} · comparisons: ${stats.direct} scanning leaves + ${stats.combine} combining = **${tot}**` +
            (root.solved ? ` $= n-1 = ${n - 1}$ ✓ · maximum **${root.res}**` : ` · ${stats.open} ${stats.open === 1 ? 'leaf' : 'leaves'} unsolved, so the root is not solved yet`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Algorithm',
      name: 'Tower of Hanoi',
      statement: String.raw`$n$ disks of different sizes sit on peg A, largest at the bottom. A move takes the top disk of one peg to another peg, never onto a smaller disk. The recursive algorithm moves the tower from a source to a target peg: move the top $n-1$ disks to the spare peg, move disk $n$ to the target, move the $n-1$ disks from the spare peg onto it. It makes exactly $M(n)=2^n-1$ moves, and no solution uses fewer.`,
      idea: String.raw`The move count obeys $M(0)=0$, $M(n)=2M(n-1)+1$, and $M(n)+1$ doubles each time, so $M(n)=2^n-1$. Optimality: disk $n$ must move at least once, and at the moment it first moves the other $n-1$ disks must all sit on the third peg, which takes at least $M(n-1)$ moves; afterwards they must be moved on top of it again, another $M(n-1)$. The recursion tree is a complete binary tree with one move per call, made in in-order.`,
      caption: String.raw`Step through the recursion: the gold node of the call tree is the call making the current move, orange rings mark the calls waiting on the stack, blue nodes have made their move. Switch to **you play** and drag disks between pegs yourself; the tree then lights up as long as your moves agree with the recursion.`,
      deps: ['algo-2.1'],
      refs: ['Erickson Ch. 1'],
      credit: 'Édouard Lucas, 1883',
      tags: ['recursion'],
      viz(v) {
        const mode = v.select('', [{ value: 'rec', label: 'recursion plays' }, { value: 'you', label: 'you play' }], 'rec', { onChange: () => { setMode(); } });
        const nS = v.slider('disks n', 1, 6, 4, { int: true, onChange: () => { build(); S.reset(); resetUser(); } });
        const P = v.stage({ x: [0, 9], y: [-0.75, 3.9], axes: false, height: 210, full: true });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true });
        const G = v.graph(T, { nodes: [], edges: [], layout: 'none', r: 10, draggable: false, fontSize: 10.5, autoRadius: false });
        const PEGX = [1.5, 4.5, 7.5], NAMES = 'ABC', DCOL = ['red', 'orange', 'gold', 'green', 'teal', 'blue'];
        let moves = [], parent = {}, frames = [];
        function build() {
          const n = nS.value, nodes = [], edges = []; moves = []; parent = {};
          (function rec(k, a, b, c, id) {
            if (k === 0) return; nodes.push({ id, label: String(k) });
            if (k > 1) { edges.push([id, id + 'l']); edges.push([id, id + 'r']); parent[id + 'l'] = id; parent[id + 'r'] = id; }
            rec(k - 1, a, c, b, id + 'l'); moves.push({ k, from: a, to: b, id }); rec(k - 1, c, b, a, id + 'r');
          })(n, 0, 2, 1, 'x');
          const r = Math.max(5, Math.min(10, 220 / 2 ** (n - 1) * 1.6));
          G.set({ nodes, edges, r, fontSize: r < 8 ? 0.01 : 10.5 }).layout('tree', { root: 'x' });
          const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
          frames = [{ pegs: pegs.map((p) => p.slice()), m: 0, line: 1, note: `Call Hanoi(${n}, A → C). Nothing has moved yet.` }];
          moves.forEach((mv, i) => {
            pegs[mv.to].push(pegs[mv.from].pop());
            frames.push({ pegs: pegs.map((p) => p.slice()), m: i + 1, cur: mv.id, line: 4, note: `Call Hanoi(${mv.k}, ${NAMES[mv.from]} → ${NAMES[mv.to]}) moves disk ${mv.k} from ${NAMES[mv.from]} to ${NAMES[mv.to]}.${i + 1 === moves.length ? ` Done in ${moves.length} = 2^${n} − 1 moves.` : ''}` });
          });
          return frames;
        }
        build();
        const S = v.steps({ frames: () => build(), code: ['Hanoi(n, src → dst, via):', '  if n = 0: return', '  Hanoi(n − 1, src → via, dst)', '  move disk n from src to dst', '  Hanoi(n − 1, via → dst, src)'], codeTitle: 'recursive solution', speed: 2, start: 6 });
        // user play state
        let U = null, held = null, um = [], msg = '';
        function resetUser() { const n = nS.value; U = [Array.from({ length: n }, (_, i) => n - i), [], []]; held = null; um = []; msg = ''; }
        resetUser();
        function setMode() { const you = mode.value === 'you'; S.el.hidden = you; if (S.codeEl) S.codeEl.hidden = you; if (S.noteEl) S.noteEl.hidden = you; resetBtn.hidden = !you; v.invalidate(); }
        const resetBtn = v.button('Restart puzzle', () => resetUser()); resetBtn.hidden = true;
        const nearest = (x) => [0, 1, 2].reduce((b, i) => (Math.abs(PEGX[i] - x) < Math.abs(PEGX[b] - x) ? i : b), 0);
        P.onDrag((x, y, ph) => {
          if (mode.value !== 'you') return;
          if (ph === 'start') { const p = nearest(x); if (U[p].length) held = { k: U[p].pop(), from: p, x, y }; }
          else if (ph === 'move' && held) { held.x = x; held.y = y; }
          else if (ph === 'end' && held) {
            const p = nearest(x), top = U[p][U[p].length - 1];
            if (p !== held.from && (top == null || top > held.k)) { U[p].push(held.k); um.push([held.from, p]); msg = ''; }
            else { U[held.from].push(held.k); msg = p === held.from ? '' : `Illegal: disk ${held.k} cannot go on disk ${top}.`; }
            held = null;
          }
        });
        const disk = (k, x, y, n, a = 1) => {
          const w = 0.55 + 2.3 * k / n, col = DCOL[(k - 1) % 6];
          P.rect(x - w / 2, y, x + w / 2, y + 0.46, { fill: col, fillAlpha: Math.min(a, 1), color: a > 1.5 ? 'ink' : col, width: a > 1.5 ? 2.5 : 1.2 });
          P.text(String(k), x, y + 0.23, { align: 'center', size: 11, weight: 700, color: 'panel' });
        };
        v.render(() => {
          const n = nS.value, you = mode.value === 'you', f = S.frame, pegs = you ? U : f.pegs;
          P.line(0.2, 0, 8.8, 0, { color: 'muted', width: 3 });
          PEGX.forEach((x, i) => { P.line(x, 0, x, 3.3, { color: 'muted', width: 4, alpha: 0.6 }); P.text(NAMES[i], x, -0.42, { align: 'center', size: 13, weight: 700, color: 'muted' }); });
          pegs.forEach((pg, i) => pg.forEach((k, h) => disk(k, PEGX[i], h * 0.5, n, !you && f.cur && moves[f.m - 1].k === k ? 2 : 1)));
          if (!you && f.m) { const mv = moves[f.m - 1]; P.arrow(PEGX[mv.from], 3.55, PEGX[mv.to], 3.55, { color: 'gold', width: 2 }); }
          if (you && held) disk(held.k, held.x, held.y - 0.23, n, 0.6);
          // call tree
          let done = new Set(), stack = new Set(), cur = null;
          if (!you) { for (let i = 0; i < f.m; i++) done.add(moves[i].id); cur = f.cur; for (let q = parent[cur]; q; q = parent[q]) stack.add(q); }
          else { let m = 0; while (m < um.length && m < moves.length && um[m][0] === moves[m].from && um[m][1] === moves[m].to) m++; for (let i = 0; i < m; i++) done.add(moves[i].id); if (m < moves.length && m === um.length) cur = moves[m].id; }
          G.draw({ nodeFill: (id) => (id === cur ? 'gold' : done.has(id) ? 'accent' : null), nodeRing: (id) => (stack.has(id) ? 'orange' : null), nodeColor: (id) => (done.has(id) || id === cur ? null : 'muted') });
          if (you) T.corner(cur ? 'gold = the move the recursion would make next' : um.length ? 'you have left the recursion’s path' : '', 'tl', { color: cur ? 'gold' : 'red' });
        });
        v.legend([['gold', 'current call', { dot: true }], ['orange', 'on the call stack', { dot: true }], ['accent', 'move made', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, min = 2 ** n - 1;
          if (mode.value === 'you') { const solved = U[2].length === n; return `Your moves: **${um.length}** · minimum $2^{${n}}-1 = ${min}$` + (solved ? (um.length === min ? ' · solved optimally ✓' : ` · solved with ${um.length - min} extra moves`) : '') + (msg ? ` · ${msg}` : ''); }
          const f = S.frame; let depth = 0; if (f.cur) for (let q = parent[f.cur]; q; q = parent[q]) depth++;
          return `Moves so far **${f.m}** of $M(${n}) = 2^{${n}}-1 = ${min}$` + (f.cur ? ` · current call at recursion depth ${depth}` : '') + ` · calls in the tree: ${moves.length}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Algorithm',
      name: 'Merge sort',
      statement: String.raw`**Merge sort** sorts $A[1..n]$ by sorting the first $\lceil n/2\rceil$ and the last $\lfloor n/2\rfloor$ elements recursively and then **merging** the two sorted halves: repeatedly compare the smallest remaining element of each half and move the smaller one to the output. It is correct and stable, and it makes at most $n\lceil\lg n\rceil-2^{\lceil\lg n\rceil}+1\le n\lg n$ comparisons, so its running time is $\Theta(n\lg n)$ on every input.`,
      idea: String.raw`The merge keeps an invariant (1.4): the output so far is the sorted union of the consumed prefixes of $L$ and $R$, and every remaining element is at least as large. Each comparison outputs one element, and when one side runs out the rest is copied for free, so merging $m$ elements costs at most $m-1$ comparisons. Summed over the recursion tree that is at most $n$ per level over $\lceil\lg n\rceil$ levels; the exact worst case $W(n)=W(\lceil n/2\rceil)+W(\lfloor n/2\rfloor)+n-1$ solves to the bound above (2.8).`,
      caption: String.raw`Step through the run on an array you shuffle (or pick sorted, reversed, or the worst case). Top: the array, with the merged output in green; bottom: the copies $L$ (blue) and $R$ (purple) with the two compared heads in gold and the consumed prefixes faded. The bars at the bottom are the subproblems of the recursion tree, level by level. The comparison counter never passes $n\lg n$.`,
      deps: ['algo-2.1', 'algo-1.4'],
      refs: ['CLRS 4e §2.3', 'KT §5.1'],
      credit: 'John von Neumann, 1945',
      tags: ['sorting', 'divide and conquer'],
      viz(v) {
        const rng = v.rng(5);
        let vals = [7, 3, 10, 1, 12, 5, 8, 2, 11, 6, 9, 4];
        const nS = v.slider('n', 2, 32, 12, { int: true, onChange: () => { vals = rng.shuffle(Array.from({ length: nS.value }, (_, i) => i + 1)); S.reset(); } });
        const f0 = mergeFrames(vals);
        const S = v.steps({ frames: () => mergeFrames(vals), code: MS_CODE, codeTitle: 'Merge-Sort(A, 0, n)', speed: 2.5, codePos: 'below', start: f0.length - 9 });
        const sorted = () => Array.from({ length: vals.length }, (_, i) => i + 1);
        v.button('Shuffle', () => { vals = rng.shuffle(vals); S.reset(); });
        v.button('Sorted', () => { vals = sorted(); S.reset(); });
        v.button('Reversed', () => { vals = sorted().reverse(); S.reset(); });
        v.button('Worst case', () => { vals = worstPerm(sorted()); S.reset(); });
        const s = v.stage({ x: [-0.7, 11.7], y: [-20, 13], axes: false, height: 400 });
        let total = 0, totalFor = null;
        v.render(() => {
          const f = S.frame, n = vals.length, H = n, yb = -1.18 * H - 1, D = Math.ceil(LG(n));
          const yl = (dep) => yb - 0.16 * H - 0.8 - dep * Math.max(0.6, 0.075 * H);
          s.setView([-0.7, n - 0.3], [yl(D) - 0.6, H + 1.2]);
          if (totalFor !== vals) { totalFor = vals; total = S.frames[S.n - 1].C; }
          const bw = 0.36, lab = n <= 20;
          const bar = (x, y0, h, col, a, outline) => { s.rect(x - bw, y0, x + bw, y0 + h, { fill: col, fillAlpha: a, color: outline || col, width: outline ? 2.5 : 1 }); if (lab) s.text(String(h), x, y0 + h, { align: 'center', dy: -8, size: 10.5, color: a < 0.3 ? 'faint' : 'ink' }); };
          s.line(-0.6, 0, n - 0.4, 0, { color: 'faint', width: 1 });
          const [lo, mid, hi] = f.seg || [-1, -1, -1];
          f.A.forEach((h, p) => {
            if (p >= lo && p < hi) bar(p, 0, h, p < f.k ? 'green' : 'muted', p < f.k ? 0.7 : 0.14);
            else bar(p, 0, h, 'accent', 0.5);
          });
          s.text('A', -0.6, H * 0.92, { size: 13, weight: 700, color: 'muted' });
          if (f.seg) {
            s.line(-0.6, yb, n - 0.4, yb, { color: 'faint', width: 1 });
            f.L.forEach((h, t) => { const head = f.cmp && t === f.cmp[0]; bar(lo + t, yb, h, 'blue', t < f.i && !head ? 0.13 : 0.6, head ? 'gold' : null); });
            f.R.forEach((h, t) => { const head = f.cmp && t === f.cmp[1]; bar(mid + t, yb, h, 'purple', t < f.j && !head ? 0.13 : 0.6, head ? 'gold' : null); });
            s.text('L', lo - 0.45, yb + H * 0.92, { size: 13, weight: 700, color: 'blue', align: 'right' });
            s.text('R', mid - 0.45, yb + H * 0.92, { size: 13, weight: 700, color: 'purple', align: 'right' });
            if (f.k < hi) s.arrow(f.k, -0.25 * H + 0, f.k, -0.04 * H, { color: 'gold', width: 2 });
          }
          // recursion tree of subproblems, level by level
          const all = []; (function seg(a, b, d) { all.push([a, b, d]); if (b - a > 1) { const m = a + Math.ceil((b - a) / 2); seg(a, m, d + 1); seg(m, b, d + 1); } })(0, n, 0);
          const isDone = new Set(f.done.map(([a, b]) => a + ':' + b));
          for (const [a, b, d] of all) {
            const cur = f.seg && a === lo && b === hi, ok = isDone.has(a + ':' + b);
            s.line(a - 0.38, yl(d), b - 0.62, yl(d), { color: cur ? 'gold' : ok ? 'green' : 'faint', width: cur ? 5 : 3.5, alpha: ok || cur ? 1 : 0.6 });
          }
          s.text('levels', -0.6, yl(0) + 0.55, { size: 10.5, color: 'muted' });
          s.corner(`comparisons: ${f.C}`, 'tr', { color: 'gold', weight: 700 });
        });
        v.legend([['green', 'merged output', { area: true }], ['blue', 'L', { area: true }], ['purple', 'R', { area: true }], ['gold', 'compared now', { area: true }]]);
        v.readout(() => {
          const n = vals.length, c = Math.ceil(LG(n)), W = n * c - 2 ** c + 1, f = S.frame;
          return `Comparisons so far **${f.C}** · this input needs ${total} in all $\\le$ worst case $n\\lceil\\lg n\\rceil-2^{\\lceil\\lg n\\rceil}+1 = ${W}$ $\\le n\\log_2 n = ${v.fix(n * LG(n), 1)}$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Recurrence relation',
      statement: String.raw`A **recurrence** defines a function on the integers by expressing each value in terms of values at smaller arguments, e.g.
$$T(n)=\begin{cases}c & n=1,\\ 2\,T(\lfloor n/2\rfloor)+n & n\ge 2.\end{cases}$$
Because every recursive argument is strictly smaller, the recurrence together with its **base cases** determines $T(n)$ for every $n$ (by strong induction). *Solving* a recurrence means finding a closed form or, in algorithm analysis, the asymptotic order $\Theta(g(n))$; changing the constant base values changes $T$ but, for the recurrences of divide and conquer, not its order.`,
      idea: String.raw`Running times of recursive algorithms satisfy recurrences because the cost of a call is the cost of its subcalls plus the work done outside them (2.1). Unfolding the recurrence walks down a chain (or tree) of smaller arguments that must end in a base case, which is why the base case pins everything down. The order is then read off by the substitution method (2.5), recursion trees (2.6) or the master theorem (2.7), and checked here against the exact values: $T(n)/g(n)$ settles to a positive constant exactly when $T=\Theta(g)$ (1.10).`,
      caption: String.raw`Pick a recurrence and a candidate $g(n)$. Left: the exact values $T(n)$ (log–log) with $c\cdot g(n)$ fitted at the right end; the gold chain is the unfolding of $T(n)$ for the $n$ on the slider, down to the base case. Right: $T(n)/g(n)$, which levels off only for the right guess. Changing the base value $c$ rescales $T$ but not the verdict.`,
      deps: ['algo-2.1', 'algo-1.8'],
      refs: ['CLRS 4e Ch. 4'],
      tags: ['recurrences'],
      viz(v) {
        const R = {
          ms: { tex: String.raw`T(n)=2T(\lfloor n/2\rfloor)+n`, N: 65536, dep: (n) => n >> 1, step: (T, n) => 2 * T[n >> 1] + n, un: (n, T) => `2\\,T(${n >> 1}) + ${n} = 2\\cdot${tnum(T[n >> 1])} + ${n}` },
          bs: { tex: String.raw`T(n)=T(\lfloor n/2\rfloor)+1`, N: 65536, dep: (n) => n >> 1, step: (T, n) => T[n >> 1] + 1, un: (n, T) => `T(${n >> 1}) + 1 = ${tnum(T[n >> 1])} + 1` },
          ka: { tex: String.raw`T(n)=3T(\lfloor n/2\rfloor)+n`, N: 65536, dep: (n) => n >> 1, step: (T, n) => 3 * T[n >> 1] + n, un: (n, T) => `3\\,T(${n >> 1}) + ${n} = 3\\cdot${tnum(T[n >> 1])} + ${n}` },
          is: { tex: String.raw`T(n)=T(n-1)+n`, N: 65536, dep: (n) => n - 1, step: (T, n) => T[n - 1] + n, un: (n, T) => `T(${n - 1}) + ${n} = ${tnum(T[n - 1])} + ${n}` },
          ha: { tex: String.raw`T(n)=2T(n-1)+1`, N: 1000, dep: (n) => n - 1, step: (T, n) => 2 * T[n - 1] + 1, un: (n, T) => `2\\,T(${n - 1}) + 1 = 2\\cdot${tnum(T[n - 1])} + 1` },
          fi: { tex: String.raw`T(n)=T(n-1)+T(n-2)`, N: 1000, base2: true, dep: (n) => n - 1, step: (T, n) => T[n - 1] + T[n - 2], un: (n, T) => `T(${n - 1}) + T(${n - 2}) = ${tnum(T[n - 1])} + ${tnum(T[n - 2])}` },
        };
        const PHI = (1 + Math.sqrt(5)) / 2;
        const Gs = { lg: ['\\lg n', (n) => LG(n)], n: ['n', (n) => n], nlg: ['n\\lg n', (n) => n * LG(n)], k3: ['n^{\\lg 3}', (n) => n ** LG(3)], n2: ['n^2', (n) => n * n], e2: ['2^n', (n) => 2 ** n], ph: ['\\varphi^n', (n) => PHI ** n] };
        const rec = v.select('$T(n) =$', Object.entries(R).map(([value, r]) => ({ value, label: `$${r.tex.replace('T(n)=', '')}$` })), 'ms');
        const gs = v.select('guess $g(n)$', Object.entries(Gs).map(([value, g]) => ({ value, label: `$${g[0]}$` })), 'nlg');
        const cS = v.slider('base value $c$', 1, 10, 1, { int: true });
        const nS = v.slider('unfold $T(n)$ at $n$', 2, 1000, 100, { int: true, log: true });
        const A = v.stage({ x: [1, 65536], y: [1, 1e10], xlog: true, ylog: true, axes: 'box', height: 300, title: 'exact $T(n)$ and $c\\cdot g(n)$', xlabel: 'n' });
        const B = v.stage({ x: [2, 65536], y: [0, 2], xlog: true, axes: 'box', height: 300, title: '$T(n)/g(n)$', xlabel: 'n' });
        let key = '', T = null;
        const table = () => {
          const r = R[rec.value], k = rec.value + cS.value;
          if (k !== key) { key = k; T = new Float64Array(r.N + 1); for (let n = 1; n <= r.N; n++) T[n] = n === 1 || (r.base2 && n === 2) ? cS.value : r.step(T, n); }
          return T;
        };
        const sample = (N) => { const out = new Set(); for (let t = 0; t <= 160; t++) out.add(Math.round(N ** (t / 160))); return [...out].filter((n) => n >= 1 && n <= N); };
        let verdict = '';
        v.render(() => {
          const r = R[rec.value], T = table(), g = Gs[gs.value][1], N = r.N, ns = sample(N).filter((n) => isFinite(T[n]));
          const top = ns[ns.length - 1], cfit = T[top] / g(top), ymax = Math.max(...ns.map((n) => T[n]));
          A.setView([1, N], [Math.max(0.5, Math.min(...ns.map((n) => T[n])) / 2), ymax * 4]);
          A.fn((n) => cfit * g(n), { color: 'orange', width: 2, dash: [6, 4] });
          A.dots(ns.map((n) => [n, T[n]]), { r: 2.2, color: 'accent' });
          const n0 = Math.min(nS.value, N), chain = []; for (let m = n0; m >= 1; m = m === 1 || (r.base2 && m <= 2) ? 0 : r.dep(m)) chain.push([m, T[m]]);
          A.path(chain, { color: 'gold', width: 1.5 }); A.dots(chain, { r: 3.4, color: 'gold' });
          A.dot(n0, T[n0], { r: 5, color: 'gold', label: `T(${n0})`, labelPos: 'nw' });
          const rs = ns.filter((n) => n >= 2).map((n) => [n, T[n] / g(n)]).filter(([, q]) => isFinite(q) && q > 0);
          const qmax = Math.max(...rs.slice(Math.floor(rs.length / 3)).map((p) => p[1]));
          B.setView([2, N], [0, Math.max(1e-9, qmax) * 1.3]);
          B.path(rs, { color: 'accent', width: 2 });
          const q = (m) => { const x = rs.reduce((b, p) => (Math.abs(Math.log(p[0] / m)) < Math.abs(Math.log(b[0] / m)) ? p : b), rs[0]); return x[1]; };
          const q1 = q(N / 16), q2 = q(N / 4), q3 = q(N), rel = Math.max(Math.abs(q3 - q2), Math.abs(q2 - q1)) / q3;
          verdict = !isFinite(rel) || q3 === 0 ? 'the ratio collapses to 0: $g$ grows too fast' : rel < 0.06 ? `the ratio levels off near ${v.fix(q3, 3)}: $T = \\Theta(${Gs[gs.value][0]})$` : q3 > q2 && q2 > q1 ? 'the ratio keeps growing: $g$ is too small' : 'the ratio keeps falling: $g$ is too big';
          B.hline(q3, { color: rel < 0.06 ? 'green' : 'red', dash: true, width: 1.2 });
          B.corner(rel < 0.06 ? 'levels off ✓' : q3 > q2 ? 'grows: guess too small' : 'falls: guess too big', 'tr', { color: rel < 0.06 ? 'green' : 'red', weight: 700 });
        });
        v.legend([['accent', 'exact $T(n)$', { dot: true }], ['orange', '$c\\cdot g(n)$', { dash: true }], ['gold', 'unfolding to the base case', { dot: true }]]);
        v.readout(() => {
          const r = R[rec.value], T = table(), n = Math.min(nS.value, r.N), base = n === 1 || (r.base2 && n === 2);
          return `$T(${n}) = ${base ? `c = ${cS.value}` : `${r.un(n, T)} = ${tnum(T[n])}`}$ · ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Method',
      name: 'Substitution method',
      statement: String.raw`To prove $T(n)\le g(n)$ for all $n\ge n_0$, where $T(n)=a\,T(\lfloor n/b\rfloor)+f(n)$: **guess** the form of $g$, typically $g(n)=c\,h(n)-d\,\ell(n)$ with $\ell$ of lower order, then prove it by strong induction, checking
(a) the **base cases** $T(n)\le g(n)$ for $n_0\le n<b\,n_0$ (whose recursive argument falls below $n_0$), and
(b) the **inductive step** $a\,g(\lfloor n/b\rfloor)+f(n)\le g(n)$ for $n\ge b\,n_0$,
which together give $T(n)\le a\,T(\lfloor n/b\rfloor)+f(n)\le a\,g(\lfloor n/b\rfloor)+f(n)\le g(n)$. Lower bounds are proved the same way. The induction must close with the *same* constants; a correct order of growth can still fail the step, and subtracting a lower-order term often repairs it.`,
      idea: String.raw`The method is strong induction on $n$ applied to a guess, so all the work is in the inequality (b), which must hold for the very constants $c$ and $d$ fixed in advance. The classic trap is $T(n)=2T(\lfloor n/2\rfloor)+1$ with the guess $cn$: the step gives $2c\lfloor n/2\rfloor+1$, which exceeds $cn$ by $1$ at every even $n$, although $T(n)=\Theta(n)$ is true. Strengthening the claim to $cn-d$ makes the induction hypothesis stronger too, and the step closes for $d\ge 1$.`,
      caption: String.raw`Choose a recurrence and the form of the guess, then tune $c$, the subtracted lower-order term $d$ and the threshold $n_0$. Bottom: the slack $g(n)-[a\,g(\lfloor n/2\rfloor)+f(n)]$ of the inductive step at each $n\ge 2n_0$ (signed log scale), red where the step fails; orange ticks are the base cases. Top: the exact $T(n)$ against $g(n)$.`,
      deps: ['algo-2.4'],
      refs: ['CLRS 4e §4.3'],
      tags: ['recurrences'],
      viz(v) {
        const REC = { A: [String.raw`2T(\lfloor n/2\rfloor)+n`, 2, (n) => n], B: [String.raw`2T(\lfloor n/2\rfloor)+1`, 2, () => 1], C: [String.raw`4T(\lfloor n/2\rfloor)+n`, 4, (n) => n] };
        const H = { n: ['n', (n) => n, '1', () => 1], nlg: ['n\\lg n', (n) => n * LG(n), 'n', (n) => n], n2: ['n^2', (n) => n * n, 'n', (n) => n] };
        const rec = v.select('$T(n) =$', Object.entries(REC).map(([value, r]) => ({ value, label: `$${r[0]}$` })), 'B');
        const hs = v.select('guess $c\\,h(n) - d\\,\\ell(n)$, $h =$', Object.entries(H).map(([value, h]) => ({ value, label: `$${h[0]}$` })), 'n');
        const cS = v.slider('$c$', 0.25, 8, 2, { step: 0.25 });
        const dS = v.slider('$d$', 0, 6, 0, { step: 0.25 });
        const n0S = v.slider('$n_0$', 1, 8, 1, { int: true });
        const NMAX = 4096, NB = 96;
        const A = v.stage({ x: [1, NMAX], y: [1, 1e8], xlog: true, ylog: true, axes: 'box', height: 220, full: true, title: 'exact $T(n)$ (dots) and the guess $g(n)$', xlabel: 'n' });
        const B = v.stage({ x: [0, NB + 1], y: [-3.4, 3.4], axes: 'box', height: 230, full: true, title: 'slack of the inductive step at each $n$', xlabel: 'n',
          yticks: [[-3, '−1000'], [-2, '−100'], [-1, '−10'], [0, '0'], [1, '10'], [2, '100'], [3, '1000']] });
        const slog = (x) => Math.sign(x) * Math.log10(1 + Math.abs(x));
        let res = {};
        v.render(() => {
          const [, a, f] = REC[rec.value], [, h, , l] = H[hs.value], c = cS.value, d = dS.value, n0 = n0S.value;
          const T = new Float64Array(NMAX + 1); for (let n = 1; n <= NMAX; n++) T[n] = n === 1 ? 1 : a * T[n >> 1] + f(n);
          const g = (n) => c * h(n) - d * l(n);
          let baseFail = null, stepFail = null, trueFail = null, minSlack = Infinity;
          for (let n = n0; n < 2 * n0; n++) if (T[n] > g(n) + 1e-9 && baseFail == null) baseFail = n;
          for (let n = 2 * n0; n <= NMAX; n++) { const sl = g(n) - (a * g(n >> 1) + f(n)); if (sl < -1e-9 && stepFail == null) stepFail = n; if (n <= NB) minSlack = Math.min(minSlack, sl); }
          for (let n = n0; n <= NMAX; n++) if (T[n] > g(n) + 1e-9) { trueFail = n; break; }
          res = { baseFail, stepFail, trueFail, n0 };
          // top: T and g
          const ymax = Math.max(T[NMAX], g(NMAX)) * 3;
          A.setView([1, NMAX], [0.5, ymax]);
          A.vband(n0, 2 * n0 - 1 + 0.5, { color: 'orange', alpha: 0.12 });
          A.fn((n) => (g(n) > 0 ? g(n) : NaN), { domain: [1, NMAX], color: 'accent', width: 2 });
          const pts = []; for (let t = 0; t <= 120; t++) pts.push(Math.round(NMAX ** (t / 120)));
          [...new Set(pts)].forEach((n) => A.dot(n, T[n], { r: 2.4, color: n >= n0 && T[n] > g(n) + 1e-9 ? 'red' : 'ink' }));
          // bottom: slack bars
          let ym = 0.45; for (let n = 2 * n0; n <= NB; n++) ym = Math.max(ym, Math.abs(slog(g(n) - (a * g(n >> 1) + f(n)))) * 1.25);
          B.setView(null, [-ym, ym]);
          const tk = [[0, '0']]; for (const t of [1, 10, 100, 1000, 1e4, 1e5]) if (slog(t) < ym) { const lab = t >= 1000 ? `${t / 1000}k` : String(t); tk.push([slog(t), lab], [-slog(t), '−' + lab]); }
          B.setTicks(null, tk);
          B.hline(0, { color: 'muted', width: 1 });
          for (let n = 1; n <= NB; n++) {
            if (n < n0) continue;
            if (n < 2 * n0) { const ok = T[n] <= g(n) + 1e-9; B.rect(n - 0.4, -0.04 * ym, n + 0.4, 0.04 * ym, { fill: ok ? 'orange' : 'red', fillAlpha: 0.9, stroke: false }); continue; }
            const sl = g(n) - (a * g(n >> 1) + f(n)), y = slog(sl);
            B.rect(n - 0.4, 0, n + 0.4, Math.abs(y) < 0.02 * ym ? 0.02 * ym * Math.sign(y || 1) : y, { fill: sl < -1e-9 ? 'red' : 'green', fillAlpha: 0.75, stroke: false });
          }
          B.corner(stepFail == null ? 'inductive step holds for every n ≥ 2n₀ checked' : `step fails first at n = ${stepFail}`, 'tr', { color: stepFail == null ? 'green' : 'red', weight: 700 });
        });
        v.legend([['green', 'step holds', { area: true }], ['red', 'step fails', { area: true }], ['orange', 'base case checked directly', { area: true }], ['accent', '$g(n)$']]);
        v.readout(() => {
          const { baseFail, stepFail, trueFail, n0 } = res;
          const b = baseFail == null ? `base cases $${n0}\\le n<${2 * n0}$ ✓` : `base case fails at $n=${baseFail}$`;
          const st = stepFail == null ? 'inductive step ✓ for all $n \\le 4096$' : `inductive step fails at $n=${stepFail}$`;
          const concl = baseFail == null && stepFail == null ? ` ⇒ **proved**: $T(n)\\le g(n)$ for all $n\\ge${n0}$` : trueFail == null ? ' · the bound itself is true up to 4096, but this induction does not prove it' : ` · and indeed $T(${trueFail}) > g(${trueFail})$`;
          return `${b} · ${st}${concl}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Method',
      name: 'Recursion-tree method',
      statement: String.raw`For $T(n)=a\,T(n/b)+f(n)$ with $T(1)=\Theta(1)$, draw the **recursion tree**: level $i$ has $a^i$ nodes, each a subproblem of size $n/b^i$ costing $f(n/b^i)$, and the tree ends after $\log_b n$ levels with $a^{\log_b n}=n^{\log_b a}$ leaves. Summing level by level,
$$T(n)=\sum_{i=0}^{\log_b n-1}a^i f\!\left(n/b^i\right)+\Theta\!\left(n^{\log_b a}\right).$$
When the level sums form a geometric series the total is $\Theta$ of the largest level: the root if they shrink, the leaves if they grow, and (number of levels) × (level cost) if they are equal. The resulting guess is then proved by substitution (2.5).`,
      idea: String.raw`Every unit of work in the algorithm is done at exactly one node of the tree, so summing all nodes gives $T(n)$ exactly. Grouping by level turns a recursion into a sum, and for $f(n)=n^d$ the level sums are $n^d(a/b^d)^i$, a geometric series with ratio $a/b^d$. A geometric sum is within a constant factor of its largest term (1.12), which explains the three outcomes and is the core of the master theorem (2.7).`,
      caption: String.raw`Choose $a$, $b$, $f(n)$ and the depth. The tree is drawn level by level (deep levels become bands); on the right each level's total cost $a^i f(n/b^i)$ is a bar. Watch the bars grow, stay level or shrink, and compare the biggest level with the total in the readout.`,
      deps: ['algo-2.4', 'algo-1.12'],
      refs: ['CLRS 4e §4.4', 'Erickson Ch. 1'],
      tags: ['recurrences'],
      viz(v) {
        const aS = v.slider('$a$', 1, 8, 2, { int: true });
        const bS = v.slider('$b$', 2, 4, 2, { int: true });
        const fSel = v.select('$f(n)$', Object.entries(FN).map(([value, f]) => ({ value, label: `$${f[0]}$` })), 'n');
        const KS = v.slider('depth $\\log_b n$', 1, 8, 4, { int: true });
        const s = v.stage({ x: [0, 100], y: [-6, 0.8], axes: false, height: 400, full: true });
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, K = KS.value, [ft, d, k] = FN[fSel.value], n = b ** K;
          s.setView([0, 100], [-(K + 1.75), 0.75]);
          const lev = []; for (let i = 0; i <= K; i++) lev.push(i < K ? a ** i * fpow(n / b ** i, d, k) : a ** K);
          const mx = Math.max(...lev), tot = lev.reduce((x, y) => x + y, 0), arg = lev.indexOf(mx);
          s.text('size', 9.5, 0.55, { align: 'right', size: 10.5, color: 'muted' });
          s.tex('\\text{level total } a^i f(n/b^i)', 60, 0.55, { size: 12, color: 'muted' });
          treeLevels(s, a, K + 1, 13, 52, (i) => -i, { cap: 81, levelColor: (i) => (i === K ? 'green' : i === arg ? 'orange' : 'accent') });
          for (let i = 0; i <= K; i++) {
            const y = -i, sz = n / b ** i, col = i === K ? 'green' : i === arg ? 'orange' : 'accent';
            s.text(tnum(sz).replace(/\{,\}/g, ','), 9.5, y, { align: 'right', size: 11, color: 'muted' });
            s.rect(60, y - 0.36, 60 + 38 * lev[i] / mx, y - 0.08, { fill: col, fillAlpha: 0.7, color: col, width: 1 });
            s.tex(i < K ? `${a}^{${i}}\\cdot f(${tnum(sz)}) = ${tnum(lev[i])}` : `${a}^{${K}}\\cdot T(1) = ${tnum(lev[i])}`, 60, y + 0.02, { size: 12, baseline: 'bottom', color: 'ink' });
          }
          s.line(60, -(K + 0.65), 98, -(K + 0.65), { color: 'faint', width: 1 });
          s.tex(`\\textstyle\\sum = T(${tnum(n)}) = ${tnum(tot)}`, 60, -(K + 1.05), { size: 13, color: 'ink', align: 'left' });
          // direct evaluation of the recurrence, as a check of the level sum
          let Tn = 1; for (let j = 1; j <= K; j++) Tn = a * Tn + fpow(b ** j, d, k);
          info = { a, b, n, K, ft, d, k, lev, tot, mx, arg, Tn };
        });
        v.legend([['accent', 'level', { dot: true }], ['orange', 'most expensive level', { dot: true }], ['green', 'leaves', { dot: true }]]);
        v.readout(() => {
          const { a, b, K, ft, d, k, lev, tot, mx, arg, Tn } = info, r = k === 0 ? a / b ** d : null;
          const shape = r == null ? (lev[1] > lev[0] ? 'level totals rise' : 'level totals fall') : Math.abs(r - 1) < 1e-9 ? 'all levels cost the same: $T = $ (levels) × (level cost)' : r > 1 ? `levels grow by $a/b^d = ${v.fix(r, 3)}$: the leaves dominate` : `levels shrink by $a/b^d = ${v.fix(r, 3)}$: the root dominates`;
          return `$T(n) = ${a}\\,T(n/${b}) + ${ft}$ · ${shape} · biggest level (${arg === K ? 'leaves' : `level ${arg}`}) is ${v.fix(100 * mx / tot, 1)}% of the total · level sum ${tnum(tot)} = recurrence evaluated directly ${tnum(Tn)} ${Math.abs(tot - Tn) <= 1e-9 * tot ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Master theorem',
      statement: String.raw`Let $a\ge 1$ and $b>1$ be constants, $f(n)\ge 0$, and $T(n)=a\,T(n/b)+f(n)$ (with $n/b$ read as $\lfloor n/b\rfloor$ or $\lceil n/b\rceil$ and $T=\Theta(1)$ on small inputs). Compare $f$ with the **watershed** function $n^{\log_b a}$:
(1) if $f(n)=O(n^{\log_b a-\eps})$ for some $\eps>0$, then $T(n)=\Theta(n^{\log_b a})$;
(2) if $f(n)=\Theta(n^{\log_b a}\lg^k n)$ for some $k\ge 0$, then $T(n)=\Theta(n^{\log_b a}\lg^{k+1} n)$;
(3) if $f(n)=\Omega(n^{\log_b a+\eps})$ for some $\eps>0$ and $f$ satisfies the regularity condition $a f(n/b)\le c f(n)$ for some $c<1$ and all large $n$, then $T(n)=\Theta(f(n))$.

The cases do not cover everything: $f(n)=n^{\log_b a}/\lg n$ falls in the gap between (1) and (2).`,
      idea: String.raw`Sum the recursion tree (2.6): level $i$ costs $a^i f(n/b^i)$ and there are $n^{\log_b a}$ leaves. In case 1 the level sums grow geometrically toward the leaves, in case 3 regularity makes them shrink geometrically from the root, and a geometric series is dominated by its largest term (1.12). In case 2 the $\log_b n$ levels all cost about $n^{\log_b a}\lg^k(n/b^i)$, and summing $\lg^k$ over the levels gives the extra logarithm. Floors and ceilings only perturb the sizes by bounded amounts (2.8).`,
      caption: String.raw`Set $a$, $b$ and $f(n)=n^d\lg^k n$. Left: the point $(\log_b a,\,d)$ lands in case 1 (below the diagonal), case 2 (on it; switch on the boundary lock to sit there exactly and vary $k$) or case 3 (above it); famous algorithms are marked. Right: the level costs of the recursion tree on a log scale: rising, flat or falling. Bottom: the exact $T(n)$ divided by the predicted order levels off.`,
      deps: ['algo-2.6', 'algo-1.12'],
      refs: ['CLRS 4e §4.5'],
      credit: 'Bentley, Haken & Saxe, 1980',
      tags: ['recurrences'],
      viz(v) {
        const aS = v.slider('$a$', 1, 16, 3, { int: true });
        const bS = v.slider('$b$', 1.5, 6, 2, { step: 0.5 });
        const dS = v.slider('$d$ in $f(n)=n^d\\lg^k n$', 0, 3, 1, { step: 0.05 });
        const kS = v.select('$k$', ['-2', '-1', '0', '1', '2'], '0');
        const lock = v.toggle('boundary: $d = \\log_b a$', false, { onChange: () => { dS.el.hidden = lock.value; } });
        const P = v.stage({ x: [0, 4], y: [0, 4], axes: 'box', height: 300, title: 'the point $(\\log_b a,\\ d)$: horizontal $\\log_b a$, vertical $d$' });
        const L = v.stage({ x: [-0.6, 20.6], y: [1, 1e6], ylog: true, axes: 'box', height: 300, title: 'level costs $a^i f(n/b^i)$, level $i = 0$ (root) to leaves' });
        const R = v.stage({ x: [10, 1e15], xlog: true, y: [0, 2], axes: 'box', height: 170, full: true, title: 'exact $T(n)$ ÷ predicted order, at $n = b^j$', xlabel: 'n' });
        const FAMOUS = [[0, 0, 'binary search', 6, -10, 'left'], [1, 1, 'merge sort', 6, 9, 'left'], [LG(3), 1, 'Karatsuba', 6, 9, 'left'], [LG(7), 2, 'Strassen', -6, -9, 'right'], [3, 2, 'naive 8-way', 6, 9, 'left']];
        let M = {};
        const fe = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : v.fix(x, 3));
        v.render(() => {
          const a = aS.value, b = bS.value, k = +kS.value, e = Math.log(a) / Math.log(b), d = lock.value ? e : dS.value, tol = 1e-9;
          let cs, g, pred;
          if (d < e - tol) { cs = 1; g = (n) => n ** e; pred = `n^{${fe(e)}}`; }
          else if (d > e + tol) { cs = 3; g = (n) => fpow(n, d, k); pred = `n^{${fe(d)}}${k ? `\\lg^{${k}} n` : ''}`; }
          else if (k >= 0) { cs = 2; g = (n) => n ** e * LG(n) ** (k + 1); pred = `n^{${fe(e)}}\\lg^{${k + 1}} n`; }
          else if (k === -1) { cs = 0; g = (n) => n ** e * LG(LG(n)); pred = `n^{${fe(e)}}\\lg\\lg n`; }
          else { cs = 0; g = (n) => n ** e; pred = `n^{${fe(e)}}`; }
          const col = ['red', 'blue', 'green', 'orange'][cs];
          // plane
          const m = Math.max(4, e + 0.6, d + 0.6); P.setView([0, m], [0, m]);
          P.poly([[0, 0], [m, m], [m, 0]], { fill: 'blue', fillAlpha: 0.1, stroke: false });
          P.poly([[0, 0], [0, m], [m, m]], { fill: 'orange', fillAlpha: 0.1, stroke: false });
          P.line(0, 0, m, m, { color: 'green', width: 3 });
          P.text('case 1: leaves dominate', m * 0.97, m * 0.13, { align: 'right', size: 11.5, color: 'blue', weight: 600 });
          P.text('case 3: root dominates', m * 0.06, m * 0.9, { size: 11.5, color: 'orange', weight: 600 });
          P.text('case 2', m * 0.6, m * 0.6, { size: 11.5, color: 'green', weight: 600, dx: -8, dy: -12, align: 'right' });
          FAMOUS.forEach(([x, y, t, dx, dy, al]) => { P.dot(x, y, { r: 2.6, color: 'muted' }); P.text(t, x, y, { size: 9.5, color: 'muted', dx, dy, align: al }); });
          P.dot(e, d, { r: 7, color: col });
          // level profile, n = b^K with K ≈ 20 / lg b
          const K = Math.max(3, Math.min(20, Math.round(20 / LG(b)))), n = b ** K, lev = [];
          for (let i = 0; i <= K; i++) lev.push(i < K ? a ** i * fpow(n / b ** i, d, k) : a ** K);
          const lo = Math.min(...lev), hi = Math.max(...lev);
          L.setView([-0.6, K + 0.6], [lo / 40, hi * 4]);
          lev.forEach((c, i) => { const cc = i === K ? 'green' : 'accent'; L.rect(i - 0.36, lo / 4, i + 0.36, c, { fill: cc, fillAlpha: 0.65, color: cc, width: 1 }); });
          L.corner(`n = ${b}^${K}`, 'tr', { color: 'muted' });
          // exact T(b^j) / g(b^j)
          const J = Math.floor(15 / Math.log10(b)), pts = []; let T = 1;
          for (let j = 1; j <= J; j++) { const nj = b ** j; T = a * T + fpow(nj, d, k); if (nj >= 10) pts.push([nj, T / g(nj)]); }
          const qm = Math.max(...pts.map((p) => p[1]));
          R.setView([10, b ** J], [0, qm * 1.25]);
          R.path(pts, { color: col, width: 2.2 }); R.dots(pts, { r: 2.2, color: col });
          const reg = cs === 3 ? a * fpow(n / b, d, k) / fpow(n, d, k) : null;
          M = { a, b, k, e, d, cs, pred, last: pts[pts.length - 1][1], prev: pts[Math.floor(pts.length * 0.75)][1], reg };
        });
        v.legend([['blue', 'case 1', { dot: true }], ['green', 'case 2', { dot: true }], ['orange', 'case 3', { dot: true }], ['red', 'gap: beyond the theorem', { dot: true }]]);
        v.readout(() => {
          const { a, b, k, e, d, cs, pred, last, prev, reg } = M;
          const fT = `n^{${fe(d)}}${k ? `\\lg^{${k}} n` : ''}`;
          const head = `$T(n) = ${a}\\,T(n/${b}) + ${fT}$, $\\log_b a = ${fe(e)}$: `;
          const body = cs === 1 ? `$d < \\log_b a$ ⇒ **case 1**, $T(n) = \\Theta(${pred})$`
            : cs === 3 ? `$d > \\log_b a$ ⇒ **case 3** (regularity: $a f(n/b)/f(n) \\to ${v.fix(reg, 3)} < 1$ ✓), $T(n) = \\Theta(${pred})$`
            : cs === 2 ? `$d = \\log_b a$, $k = ${k} \\ge 0$ ⇒ **case 2**, $T(n) = \\Theta(${pred})$`
            : `$d = \\log_b a$ but $k = ${k} < 0$: **no case applies**; summing the tree still gives $\\Theta(${pred})$`;
          return `${head}${body} · exact/predicted at the largest $n$: ${v.fix(last, 3)} (at 3/4 of the range: ${v.fix(prev, 3)})`;
        });
      },
    },
  ],
};
