// Algorithms — Chapter 3 (papers): Hoare, "Quicksort" (1962)

// ---------- Hoare's partition-exchange sort, instrumented ----------
// Partition in the form Hoare published it (two pointers moving towards each other and exchanging
// out-of-place pairs), written as in Sedgewick's analysis: the bound X is moved to A[lo], i scans up
// while A[i] < X, j scans down while A[j] > X, crossed pointers end the pass and X drops into place j.
const QS_CODE = [
  'nest ← { [1, n] }                  ▷ Hoare’s “nest” of postponed segments',
  'while the nest is not empty',
  '  [lo, hi] ← pop(nest)',
  '  X ← the key at a random place of [lo, hi]; move it to lo   ▷ the bound',
  '  i ← lo;  j ← hi + 1',
  '  repeat i ← i + 1 until A[i] ≥ X   (or i = hi)',
  '  repeat j ← j − 1 until A[j] ≤ X',
  '  if i < j: exchange A[i] ↔ A[j] and go back to line 6',
  '  exchange A[lo] ↔ A[j]             ▷ X is now in its final place',
  '  push the longer part, then the shorter one, onto the nest',
];
const pickBound = (rule, lo, hi, rng) => (rule === 'first' ? lo : rule === 'middle' ? (lo + hi) >> 1 : lo + Math.floor(rng() * (hi - lo + 1)));

/** Full trace of the sort on a small array: one frame per pop, bound, pointer scan, exchange, placement and push. */
function hoareTrace(vals, rule, rng) {
  const A = vals.slice(), n = A.length, fin = new Array(n).fill(false), nest = [[0, n - 1]], frames = [];
  let cmp = 0, exch = 0, maxNest = 1;
  const snap = (o) => frames.push({ A: A.slice(), fin: fin.slice(), nest: nest.map((s) => s.slice()), cmp, exch, maxNest, ...o });
  snap({ line: 1, note: `The whole array $A[1..${n}]$ is the only segment in the nest.` });
  while (nest.length) {
    const [lo, hi] = nest.pop();
    snap({ line: [2, 3], lo, hi, phase: 'pop', note: `Take the segment $A[${lo + 1}..${hi + 1}]$ (${hi - lo + 1} keys) from the nest.` });
    const p = pickBound(rule, lo, hi, rng);
    [A[lo], A[p]] = [A[p], A[lo]];
    const X = A[lo];
    snap({ line: [4, 5], lo, hi, X, from: p, phase: 'bound', note: `The bound is $X = ${X}$ (taken from place ${p + 1}${p === lo ? '' : ' and moved to the front'}).` });
    let i = lo, j = hi + 1;
    for (;;) {
      const i0 = i + 1;
      do { i++; cmp++; if (!(A[i] < X)) break; } while (i < hi);
      snap({ line: 6, lo, hi, X, i, j, seen: [i0, i], phase: 'scan', note: `The lower pointer moves up past keys smaller than $X$ and stops at place ${i + 1} (key ${A[i]}).` });
      const j0 = j - 1;
      do { j--; cmp++; } while (X < A[j]);
      const crossed = i >= j;
      snap({ line: 7, lo, hi, X, i, j, seen: [j, j0], phase: 'scan', note: crossed ? `The upper pointer stops at place ${j + 1}; the pointers have **crossed**, so every key left of $j$ is $\\le X$ and every key right of it is $\\ge X$.` : `The upper pointer moves down past keys larger than $X$ and stops at place ${j + 1} (key ${A[j]}).` });
      if (crossed) break;
      [A[i], A[j]] = [A[j], A[i]]; exch++;
      snap({ line: 8, lo, hi, X, i, j, swap: [i, j], phase: 'swap', note: `Both keys were on the wrong side: exchange them (${exch} exchange${exch > 1 ? 's' : ''} so far).` });
    }
    [A[lo], A[j]] = [A[j], A[lo]]; fin[j] = true;
    snap({ line: 9, lo, hi, X, q: j, phase: 'place', note: `$X = ${X}$ drops into place ${j + 1}, its final position; the segment splits ${j - lo} | ${hi - j}.` });
    const L = [lo, j - 1], R = [j + 1, hi], parts = (L[1] - L[0]) >= (R[1] - R[0]) ? [L, R] : [R, L];
    for (const [a, b] of parts) { if (b > a) nest.push([a, b]); else if (b === a) fin[a] = true; }
    maxNest = Math.max(maxNest, nest.length);
    snap({ line: 10, q: j, phase: 'push', note: nest.length ? `The nest now holds ${nest.length} segment${nest.length > 1 ? 's' : ''}; the shorter part is on top and is sorted first.` : 'The nest is empty: the array is sorted.' });
  }
  return { frames, cmp, exch, maxNest };
}
/** The same sort without frames, for the statistics: returns {cmp, exch, maxNest}. */
function hoareCount(a, rule, rng) {
  const n = a.length, nest = [0, n - 1]; let cmp = 0, exch = 0, maxNest = 1;
  while (nest.length) {
    const hi = nest.pop(), lo = nest.pop();
    const p = pickBound(rule, lo, hi, rng); let t = a[lo]; a[lo] = a[p]; a[p] = t;
    const X = a[lo]; let i = lo, j = hi + 1;
    for (;;) {
      do { i++; cmp++; if (!(a[i] < X)) break; } while (i < hi);
      do { j--; cmp++; } while (X < a[j]);
      if (i >= j) break;
      t = a[i]; a[i] = a[j]; a[j] = t; exch++;
    }
    t = a[lo]; a[lo] = a[j]; a[j] = t;
    const lLen = j - lo, rLen = hi - j;
    if (lLen >= rLen) { if (lLen > 1) nest.push(lo, j - 1); if (rLen > 1) nest.push(j + 1, hi); }
    else { if (rLen > 1) nest.push(j + 1, hi); if (lLen > 1) nest.push(lo, j - 1); }
    maxNest = Math.max(maxNest, nest.length / 2);
  }
  return { cmp, exch, maxNest };
}
/** Exact mean comparison count of this implementation on n distinct keys in random order:
 *  a pass over m keys costs m + 1 comparisons unless the bound is the largest key (then m), i.e. m + 1 − 1/m on average,
 *  and both parts are again in random order: E_m = m + 1 − 1/m + (2/m) Σ_{k<m} E_k. */
function exactMeans(N) {
  const E = new Float64Array(N + 1); let S = 0;
  for (let m = 2; m <= N; m++) { S += E[m - 1]; E[m] = m + 1 - 1 / m + (2 / m) * S; }
  return E;
}
const harmonicN = (n) => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / k; return s; };
const log2Fact = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return s; };
const lgam = (x) => { // Stirling series for ln Γ(x), x ≥ 1 (shifted up for small x): smooth log₂ x! for the chart
  let a = 0; while (x < 8) { a -= Math.log(x); x += 1; }
  return a + (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x) - 1 / (360 * x ** 3);
};

export default {
  collection: 'algo',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.20
    {
      num: '3.20',
      kind: 'Paper',
      name: 'Quicksort',
      paper: { authors: 'C. A. R. Hoare', year: 1962, title: 'Quicksort', venue: 'The Computer Journal 5 (1): 10–16', doi: '10.1093/comjnl/5.1.10' },
      introduces: ['algo-3.9'],
      credit: 'C. A. R. Hoare, 1962 (algorithm devised 1959–61)',
      statement: String.raw`Hoare's paper describes **quicksort**, a method for sorting $n$ items in place in a computer's random-access store, and analyses its cost.

(a) **Partition.** Choose one key as the *bound* $X$. A lower pointer moves up from the left end until it meets a key $\ge X$, an upper pointer moves down from the right end until it meets a key $\le X$; the two keys are exchanged and the scans continue until the pointers cross. The segment is then split into a lower part with keys $\le X$ and an upper part with keys $\ge X$, and $X$ itself can be put in its final place between them.

(b) **Recursion.** Each part is sorted in the same way; the bounds of a part that has to wait are kept in a store Hoare called the *nest* (a stack), which never needs more than about $\log_2 n$ entries if the shorter part is always sorted first. No other extra storage is used.

(c) **Cost.** For keys in random order (equivalently, with the bound chosen at random) the expected number of comparisons grows like $2n\ln n\approx 1.39\,n\log_2 n$, only 39% above the information-theoretic minimum $\log_2 n!\approx n\log_2 n$, and asymptotically there is one exchange for every six comparisons. If the bound is always an extreme key the cost becomes quadratic, about $n^2/2$ comparisons; choosing the bound at random makes this exceedingly unlikely on every input.`,
      idea: String.raw`In 1959 Hoare, a visiting student in Moscow working on machine translation, needed to sort the words of a sentence; back in England at Elliott Brothers he was asked to program Shell's new sorting method for the Elliott 803 and found his own partition-exchange idea faster. The known internal methods were insertion-type sorts, quadratic or nearly so, and merge sorting, which needs a second array as large as the first. Hoare published the procedures as Algorithms 63–65 (Partition, Quicksort, Find) in *Communications of the ACM* in 1961, and in this paper explained the method, analysed its expected cost and compared it favourably with the others in speed, storage and ease of programming. It introduced quicksort and partitioning (3.9), the divide-and-conquer pattern (2.1) with all the work done *before* the recursive calls, and the habit of analysing an algorithm's *average* behaviour; its sister procedure Find is quickselect (3.17). Modern analysis made the estimate exact — the mean is $2(n+1)H_n-4n$ comparisons when each pass compares $m-1$ keys with the bound (3.11) — and explained why stopping on keys *equal* to the bound, as Hoare's pointers do, keeps many duplicates harmless. Refined versions (median-of-three bounds, introsort's fallback to heapsort, dual pivots) are still the default sorts of C++, Java and many other libraries.`,
      caption: String.raw`Step through Hoare's partition on 16 keys: the gold line is the bound $X$, green bars lie left of the lower pointer $i$ (keys $< X$ already passed), orange bars right of the upper pointer $j$ (keys $> X$), and solid bars are in their final places. Below the bars, the nest: each grey bracket is a postponed segment. **Drag a bar up or down** to edit the array, or pick an input. Right: comparisons against $n$ (log–log) for the chosen bound rule and input — dots are measured means over many runs (computed now, not taken from the paper), the black line is the exact mean of this implementation on random input, the gold dashed line Hoare's estimate $2n\ln n$ (quoted as secondary sources attribute it; the paywalled original was not consulted). Choose *first key* with *sorted* input to watch the dots climb onto the quadratic worst case, and *few distinct* to see that equal keys do no harm.`,
      deps: ['algo-3.1', 'algo-2.1'],
      see: ['algo-3.10', 'algo-3.11', 'algo-3.17', 'algo-3.12'],
      refs: [],
      tags: ['sorting', 'randomized', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quicksort' },
      viz(v) {
        const n = 16, VMAX = 50;
        const base = [27, 9, 41, 16, 33, 5, 48, 21, 12, 37, 30, 18, 44, 3, 25, 39];
        let vals = base.slice(), seed = 11;
        const rule = v.select('bound', [{ value: 'random', label: 'random key (Hoare)' }, { value: 'first', label: 'first key' }, { value: 'middle', label: 'middle key' }], 'random', { onChange: () => S.reset() });
        const inp = v.select('input', [{ value: 'random', label: 'random' }, { value: 'sorted', label: 'sorted' }, { value: 'reversed', label: 'reversed' }, { value: 'few', label: 'few distinct' }], 'random', { onChange: (k) => { vals = makeInput(k); S.reset(); } });
        v.button('Shuffle', () => { seed++; inp.set('random'); vals = makeInput('random'); S.reset(); });
        function makeInput(k) {
          const r = v.rng(seed * 7 + 1), sorted = base.slice().sort((a, b) => a - b);
          if (k === 'sorted') return sorted;
          if (k === 'reversed') return sorted.reverse();
          if (k === 'few') return Array.from({ length: n }, () => 12 * r.int(1, 3) + 4);
          return seed === 11 ? base.slice() : r.shuffle(sorted);
        }
        const B = v.stage({ x: [-0.7, n - 0.3], y: [-6.2, 64], axes: false, height: 300, weight: 1.25, minWidth: 330, title: 'the array and the bound; below it, the nest' });
        const C = v.stage({ x: [6, 3000], y: [5, 6e6], xlog: true, ylog: true, axes: 'box', height: 300, weight: 1, minWidth: 290, xlabel: 'n', title: 'comparisons vs $n$' });
        let run = null;
        const trace = () => { run = hoareTrace(vals, rule.value, v.rng(seed * 31 + 5)); return run.frames; };
        const f0 = trace(), first = Math.max(0, f0.findIndex((f) => f.phase === 'swap'));
        const S = v.steps({ frames: trace, code: QS_CODE, codeTitle: 'Quicksort (Hoare 1962), with the nest', codePos: 'below', speed: 4, start: first, still: first });
        // drag a bar to change its key
        let dragI = -1;
        B.onDrag((x, y, phase) => {
          if (phase === 'start') { const k = Math.round(x); dragI = k >= 0 && k < n && y > -0.5 ? k : -1; }
          if (dragI < 0) return;
          vals[dragI] = Math.max(1, Math.min(VMAX, Math.round(y)));
          if (phase === 'end') dragI = -1;
          S.reset({ at: 'start' });
        });
        // measured statistics for the chart (memoized per bound rule × input type)
        const NS = [8, 16, 32, 64, 128, 256, 512, 1024, 2048];
        const EX = exactMeans(4096);
        let statKey = '', stat = null;
        const stats = () => {
          const key = rule.value + '|' + inp.value;
          if (key === statKey) return stat;
          const r = v.rng(97), out = [];
          for (const m of NS) {
            const runs = inp.value === 'random' || inp.value === 'few' || rule.value === 'random' ? (m <= 256 ? 60 : m <= 1024 ? 16 : 6) : 1;
            let sc = 0, se = 0;
            for (let t = 0; t < runs; t++) {
              const a = new Float64Array(m);
              if (inp.value === 'sorted') for (let k = 0; k < m; k++) a[k] = k;
              else if (inp.value === 'reversed') for (let k = 0; k < m; k++) a[k] = m - k;
              else if (inp.value === 'few') for (let k = 0; k < m; k++) a[k] = Math.floor(r() * 3);
              else { for (let k = 0; k < m; k++) a[k] = k; for (let k = m - 1; k > 0; k--) { const u = Math.floor(r() * (k + 1)); const tt = a[k]; a[k] = a[u]; a[u] = tt; } }
              const res = hoareCount(a, rule.value, r); sc += res.cmp; se += res.exch;
            }
            out.push({ m, c: sc / runs, e: se / runs });
          }
          statKey = key; stat = out; return out;
        };
        v.render(() => {
          const f = S.frame, act = f.lo != null && f.phase !== 'push';
          // ---- bars
          const W = 0.36;
          for (let k = 0; k < n; k++) {
            const val = f.A[k];
            let col = 'muted', alpha = 0.28, stroke = 'muted', width = 1.1;
            if (f.fin[k]) { col = 'ink'; alpha = 0.55; stroke = 'ink'; }
            if (act && k >= f.lo && k <= f.hi) {
              col = 'accent'; alpha = 0.22; stroke = 'accent';
              if (f.X != null && k === f.lo && f.phase !== 'place') { col = 'gold'; alpha = 0.75; stroke = 'gold'; width = 2; }
              else if (f.i != null) {
                if (k > f.lo && k < f.i) { col = 'green'; alpha = 0.4; stroke = 'green'; }
                if (k > f.j && k <= f.hi) { col = 'orange'; alpha = 0.4; stroke = 'orange'; }
                if (k === f.i || k === f.j) { width = 2.4; stroke = k === f.i ? 'green' : 'orange'; }
              }
              if (f.phase === 'place' && k === f.q) { col = 'gold'; alpha = 0.8; stroke = 'gold'; width = 2.2; }
            }
            if (f.swap && (k === f.swap[0] || k === f.swap[1])) { width = 2.8; }
            B.rect(k - W, 0, k + W, val, { fill: col, fillAlpha: alpha, color: stroke, width });
            B.text(String(val), k, val + 1.6, { align: 'center', size: 10.5, color: f.fin[k] ? 'ink' : 'muted' });
          }
          B.line(-0.6, 0, n - 0.4, 0, { color: 'faint', width: 1 });
          if (f.swap) { const [a, b] = f.swap, top = 53.5; B.path([[a, top - 1.6], [a, top], [b, top], [b, top - 1.6]], { color: 'ink', width: 1.4 }); B.text('exchange', (a + b) / 2, top + 1.9, { align: 'center', size: 10.5, color: 'ink' }); }
          if (act) {
            if (f.X != null) B.line(f.lo - 0.45, f.X, f.hi + 0.45, f.X, { color: 'gold', width: 1.6, dash: [5, 4] });
            if (f.i != null && f.phase !== 'place') {
              const pi = Math.min(f.i, n - 1), pj = Math.max(f.j, 0);
              B.arrow(pi, -2.1, pi, -0.35, { color: 'green', width: 2, head: 6 }); B.text('i', pi - 0.28, -1.5, { align: 'right', size: 13, color: 'green', math: true });
              if (f.j <= f.hi) { B.arrow(pj, -2.1, pj, -0.35, { color: 'orange', width: 2, head: 6 }); B.text('j', pj + 0.28, -1.5, { align: 'left', size: 13, color: 'orange', math: true }); }
            }
          }
          // nest: postponed segments as brackets, top of the stack first
          const nest = f.nest.slice().reverse();
          nest.slice(0, 4).forEach(([a, b], d) => {
            const y = -3.1 - 0.85 * d;
            B.path([[a - 0.4, y + 0.55], [a - 0.4, y], [b + 0.4, y], [b + 0.4, y + 0.55]], { color: d === 0 ? 'accent' : 'muted', width: 1.8 });
          });
          if (nest.length > 4) B.text(`+${nest.length - 4} more`, n - 0.4, -5.9, { align: 'right', size: 10, color: 'muted' });
          B.corner((f.X != null && act ? `bound X = ${f.X} · ` : '') + `comparisons ${f.cmp} · exchanges ${f.exch}`, 'tl', { color: 'ink' });
          // ---- chart
          const st = stats(), xs = [8, 2048];
          C.fn((x) => x * (x - 1) / 2, { domain: xs, color: 'red', width: 1.6, dash: [6, 4] });
          C.fn((x) => x * Math.log2(x), { domain: xs, color: 'blue', width: 1.8 });
          C.fn((x) => 2 * x * Math.log(x), { domain: xs, color: 'gold', width: 2, dash: [7, 4] });
          C.fn((x) => lgam(x + 1) / Math.LN2, { domain: xs, color: 'green', width: 1.6 });
          C.path(NS.map((m) => [m, EX[m]]), { color: 'ink', width: 1.2 });
          C.dots(st.map((o) => [o.m, o.c]), { r: 4.2, color: 'accent' });
          C.dot(n, run.cmp, { r: 7, hollow: true, color: 'gold', width: 2.4 });
          C.text('n²/2', 600, 600 * 599 / 2 * 1.9, { size: 11, color: 'red', align: 'center' });
          C.text('log₂ n!', 2300, log2Fact(2048) * 0.42, { size: 11, color: 'green', align: 'right' });
        });
        v.legend([['accent', 'measured mean', { dot: true }], ['ink', 'exact mean (random order)'], ['gold', '$2n\\ln n$ (Hoare)', { dash: true }], ['blue', '$n\\log_2 n$'], ['green', '$\\log_2 n!$ (lower bound)'], ['red', 'worst case', { dash: true }], ['gold', 'this array', { dot: true }]]);
        v.readout(() => {
          const st = stats(), big = st[st.length - 1], E16 = EX[n];
          const ratio = big.c / (2 * big.m * Math.log(big.m)), ce = big.e > 0 ? big.c / big.e : Infinity;
          return `this run: **${run.cmp}** comparisons, **${run.exch}** exchanges; nest held at most ${run.maxNest} segments ($\\log_2 ${n} = 4$) · for $n = ${n}$: $n\\log_2 n = 64$, $2n\\ln n = ${v.fix(2 * n * Math.log(n), 1)}$, exact mean ${v.fix(E16, 1)}, worst case $\\binom{n}{2} = 120$ · at $n = ${big.m}$ the measured mean is ${Math.round(big.c).toLocaleString('en-US')} $= ${v.fix(ratio, 3)}\\times 2n\\ln n$` +
            (isFinite(ce) ? ` with ${v.fix(ce, 1)} comparisons per exchange` : '') + ` · modern exact value for the textbook count of $m-1$ comparisons per pass: $2(n{+}1)H_n - 4n = ${v.fix(2 * (n + 1) * harmonicN(n) - 4 * n, 1)}$ at $n = ${n}$`;
        });
      },
    },
  ],
};
