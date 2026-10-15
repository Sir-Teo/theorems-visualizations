// Algorithms — Chapter 1: Correctness, cost and growth

// ---------- shared helpers ----------
const arr = (a) => '[' + a.join(', ') + ']';
const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function isPrimeSmall(q) { if (q < 2) return false; for (let d = 2; d * d <= q; d++) if (q % d === 0) return false; return true; }
function bitLen(x) { return x === 0n ? 1 : x.toString(2).length; }
/** BigInt → TeX, shortened to scientific notation when long. */
function bigTex(x) { const s = x.toString(); return s.length <= 12 ? s : `${s[0]}.${s.slice(1, 4)}\\times10^{${s.length - 1}}`; }

// 1.1 — problems with a correct and a subtly flawed procedure, and a brute-force checker
function insertionSort(a) { const A = a.slice(); for (let j = 1; j < A.length; j++) { const k = A[j]; let i = j - 1; while (i >= 0 && A[i] > k) { A[i + 1] = A[i]; i--; } A[i + 1] = k; } return A; }
function bubbleShort(a) { const A = a.slice(); for (let p = 0; p < A.length - 2; p++) for (let i = 0; i + 1 < A.length; i++) if (A[i] > A[i + 1]) [A[i], A[i + 1]] = [A[i + 1], A[i]]; return A; }
const PROBLEMS = {
  sort: {
    gen: (r) => Array.from({ length: 6 }, () => rint(r, 1, 20)),
    good: { name: 'insertion sort', run: insertionSort },
    bad: { name: 'bubble sort with one pass too few', run: bubbleShort },
    check: (x, y) => { const s = x.slice(); for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (s[j] < s[i]) [s[i], s[j]] = [s[j], s[i]]; return s.every((t, i) => t === y[i]); },
    show: arr, out: arr, spec: 'output: the same numbers in nondecreasing order',
  },
  gcd: {
    gen: (r) => [rint(r, 2, 96), rint(r, 2, 96)],
    good: { name: 'Euclid’s algorithm', run: ([a, b]) => gcd(a, b) },
    bad: { name: 'product of the shared primes', run: ([a, b]) => { let p = 1; for (let q = 2; q <= Math.min(a, b); q++) if (isPrimeSmall(q) && a % q === 0 && b % q === 0) p *= q; return p; } },
    check: ([a, b], y) => { let d = 1; for (let k = 1; k <= Math.min(a, b); k++) if (a % k === 0 && b % k === 0) d = k; return d === y; },
    show: ([a, b]) => `(${a}, ${b})`, out: String, spec: 'output: the largest integer dividing both',
  },
  max: {
    gen: (r) => Array.from({ length: 6 }, () => rint(r, 1, 30)),
    good: { name: 'scan all n entries', run: (a) => a.reduce((m, t) => Math.max(m, t)) },
    bad: { name: 'scan that stops at entry n − 1', run: (a) => a.slice(0, -1).reduce((m, t) => Math.max(m, t)) },
    check: (x, y) => x.includes(y) && x.every((t) => t <= y),
    show: arr, out: String, spec: 'output: an entry that no entry exceeds',
  },
};

// 1.2 — factorial on a register machine, charged two ways
const RAM_CODE = ['r ← 1', 'i ← 2', 'while i ≤ n', '  r ← r · i', '  i ← i + 1', 'return r'];
function ramRun(n, w, frames) {
  const wd = (x) => Math.ceil(bitLen(BigInt(x)) / w);
  let r = 1n, i = 2, unit = 0, word = 0;
  const step = (line, cw, note) => { unit += 1; word += cw; if (frames) frames.push({ line, r, i, unit, word, cw, note }); };
  step(1, 1, 'Load the constant 1 into register r: one operation.');
  step(2, 1, 'Load 2 into register i.');
  for (;;) {
    if (i > n) { step(3, wd(i), `$i = ${i} > n$: leave the loop.`); break; }
    step(3, wd(i), `Compare $i = ${i}$ with $n = ${n}$.`);
    const cw = wd(r) * wd(i); r *= BigInt(i);
    step(4, cw, `Multiply: unit cost 1, but a ${w}-bit machine needs ${cw} word product${cw > 1 ? 's' : ''} (r now has ${bitLen(r)} bits).`);
    i++; step(5, wd(i), `Increment i to ${i}.`);
  }
  step(6, 1, `Return $r = ${n}! = ${bigTex(r)}$.`);
  return { unit, word };
}

// 1.3 — exact case distributions over all inputs of size n
function insCount(a) { const A = a.slice(); let c = 0; for (let j = 1; j < A.length; j++) { const k = A[j]; let i = j - 1; while (i >= 0) { c++; if (A[i] > k) { A[i + 1] = A[i]; i--; } else break; } A[i + 1] = k; } return c; }
function caseDist(alg, n) {
  const counts = new Map();
  if (alg === 'lin') { for (let k = 1; k <= n; k++) counts.set(k, 1); counts.set(n, (counts.get(n) || 0) + 1); }
  else {                                            // Heap's algorithm over all n! permutations
    const a = Array.from({ length: n }, (_, k) => k), c = new Array(n).fill(0);
    const add = () => { const x = insCount(a); counts.set(x, (counts.get(x) || 0) + 1); };
    add(); let i = 0;
    while (i < n) { if (c[i] < i) { if (i % 2) [a[c[i]], a[i]] = [a[i], a[c[i]]]; else [a[0], a[i]] = [a[i], a[0]]; add(); c[i]++; i = 0; } else { c[i] = 0; i++; } }
  }
  let tot = 0, sum = 0, lo = Infinity, hi = -Infinity, pmax = 0;
  for (const [x, m] of counts) { tot += m; sum += x * m; lo = Math.min(lo, x); hi = Math.max(hi, x); pmax = Math.max(pmax, m); }
  return { counts, tot, mean: sum / tot, lo, hi, pmax };
}

// 1.4 — running maximum, correct and buggy, with the invariant evaluated at every loop boundary
const INV_CODE = {
  ok: ['best ← A[1]', 'for i ← 2 to n', '  if A[i] > best', '    best ← A[i]', 'return best'],
  zero: ['best ← 0', 'for i ← 1 to n', '  if A[i] > best', '    best ← A[i]', 'return best'],
  prev: ['best ← A[1]', 'for i ← 2 to n', '  if A[i] > A[i−1]', '    best ← A[i]', 'return best'],
};
function invFrames(A, bug) {
  const n = A.length, F = [], pmax = (k) => Math.max(...A.slice(0, k));
  let best, k;
  const snap = (line, cur, phase, note) => F.push({ line, k, best, cur, phase, pm: k ? pmax(k) : null, holds: k ? best === pmax(k) : null, note });
  if (bug === 'zero') { best = 0; k = 0; snap(1, null, 'init', 'best ← 0 before anything has been examined: the prefix is empty, so the claim has nothing to say yet.'); }
  else { best = A[0]; k = 1; snap(1, null, 'init', `**Initialization**: best = A[1] = ${best}, the maximum of the one-entry prefix.`); }
  for (let i = k; i < n; i++) {
    const test = bug === 'prev' ? A[i] > A[i - 1] : A[i] > best, old = best;
    if (test) best = A[i];
    k = i + 1;
    const ok = best === pmax(k), cmp = bug === 'prev' ? `A[${i + 1}] = ${A[i]} ${test ? '>' : '≤'} A[${i}] = ${A[i - 1]}` : `A[${i + 1}] = ${A[i]} ${test ? '>' : '≤'} best = ${old}`;
    snap(test ? [3, 4] : 3, i, 'maint', `${cmp}${test ? `, so best ← ${A[i]}` : ''}. Max of A[1..${k}] is ${pmax(k)}: ${ok ? 'the invariant still holds.' : '**the invariant is broken.**'}`);
  }
  snap(5, null, 'term', best === pmax(n) ? `**Termination**: the loop ran to i = n, so the invariant says best = max A = ${best}.` : `Return ${best}, but max A = ${pmax(n)}: the output is wrong.`);
  return F;
}

// 1.5 — binary search frames: one stacked row per probe
const BS_CODE = ['lo ← 1;  hi ← n', 'while lo ≤ hi', '  mid ← ⌊(lo + hi)/2⌋', '  if A[mid] = x:  return mid', '  if A[mid] < x:  lo ← mid + 1', '  else:  hi ← mid − 1', 'return 0     // not found'];
function bsFrames(A, x, bug) {
  const n = A.length, F = [], rows = [], p = A.indexOf(x) + 1; // p = 0 when absent
  let lo = 1, hi = n, probes = 0;
  const inv = () => !p || (lo <= p && p <= hi);
  const snap = (o) => F.push({ lo, hi, probes, rows: rows.slice(), inv: inv(), ...o });
  rows.push({ lo, hi, mid: 0 });
  snap({ line: 1, note: `The window $[1, ${n}]$ is the whole array: if $x$ is anywhere, it is in the window.` });
  const seen = new Set();
  while (lo <= hi) {
    if (seen.has(lo + ',' + hi)) { snap({ line: 2, stuck: true, hold: 3, note: `The window $[${lo}, ${hi}]$ came back unchanged: the size $hi-lo+1$ did not decrease, so this loop never ends.` }); return F; }
    seen.add(lo + ',' + hi);
    const mid = Math.floor((lo + hi) / 2); probes++;
    if (A[mid - 1] === x) { rows.push({ lo: mid, hi: mid, mid, found: true }); snap({ line: [3, 4], mid, found: mid, hold: 2, note: `$A[${mid}] = ${x}$: found after ${probes} probe${probes > 1 ? 's' : ''}.` }); return F; }
    const less = A[mid - 1] < x;
    if (less) lo = bug ? mid : mid + 1; else hi = mid - 1;
    rows.push({ lo, hi, mid });
    snap({ line: less ? [3, 5] : [3, 6], mid, note: `$A[${mid}] = ${A[mid - 1]} ${less ? '<' : '>'} ${x}$: discard the ${less ? 'left' : 'right'} part. Window $[${lo}, ${hi}]$, size ${Math.max(0, hi - lo + 1)}.` });
  }
  snap({ line: 7, hold: 2, note: `The window is empty, so by the invariant $x = ${x}$ is not in the array.` });
  return F;
}

// 1.6 — processes with a candidate variant
const VARIANT = {
  euclid: {
    label: 'Euclid', code: ['while b ≠ 0', '  (a, b) ← (b, a mod b)', 'return a'], vname: 'b', kind: 'int',
    frames(r) {
      let a = rint(r, 120, 400), b = rint(r, 30, a - 1); const F = [{ state: [a, b], v: b, line: 1, note: `Start with $(a, b) = (${a}, ${b})$. Variant: $b$.` }];
      while (b) { [a, b] = [b, a % b]; F.push({ state: [a, b], v: b, line: 2, note: `$(a, b) \\leftarrow (${a}, ${b})$: the new $b$ is a remainder, so it is smaller than the old one.` }); }
      F.push({ state: [a, b], v: 0, line: 3, end: true, note: `$b = 0$: return $\\gcd = ${a}$.` }); return F;
    },
  },
  bubble: {
    label: 'bubble swaps', code: ['while some A[i] > A[i+1]', '  swap the first such pair', 'return A'], vname: 'inversions', kind: 'int',
    frames(r) {
      const A = Array.from({ length: 9 }, () => rint(r, 1, 20)), inv = () => { let c = 0; for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) if (A[i] > A[j]) c++; return c; };
      const F = [{ state: A.slice(), v: inv(), line: 1, note: `Variant: the number of inversions (pairs out of order), here ${inv()}.` }];
      for (;;) { const i = A.findIndex((t, k) => k + 1 < A.length && t > A[k + 1]); if (i < 0) break; [A[i], A[i + 1]] = [A[i + 1], A[i]]; F.push({ state: A.slice(), hi: [i, i + 1], v: inv(), line: 2, note: `Swap positions ${i + 1} and ${i + 2}: exactly one inversion disappears.` }); }
      F.push({ state: A.slice(), v: 0, line: 3, end: true, note: 'No adjacent pair is out of order: sorted.' }); return F;
    },
  },
  bsearch: {
    label: 'binary search', code: ['while lo ≤ hi', '  probe mid, keep one half', 'return'], vname: 'hi − lo + 1', kind: 'int',
    frames(r) {
      const n = 63, x = rint(r, 0, 127); let lo = 1, hi = n; const F = [{ state: { lo, hi, n }, v: n, line: 1, note: `Search for ${x} among $2, 4, \\dots, 126$. Variant: the window size.` }];
      while (lo <= hi) { const mid = (lo + hi) >> 1, val = 2 * mid; if (val === x) { F.push({ state: { lo: mid, hi: mid, n, mid }, v: 1, line: 2, note: `Found ${x} at position ${mid}.` }); F.push({ state: { lo: mid, hi: mid, n, mid }, v: 0, line: 3, end: true, note: 'Return: the loop is left.' }); return F; }
        if (val < x) lo = mid + 1; else hi = mid - 1; F.push({ state: { lo, hi, n, mid }, v: Math.max(0, hi - lo + 1), line: 2, note: `Probe position ${mid} (value ${val}); keep the half that can still hold ${x}.` }); }
      F.push({ state: { lo, hi, n }, v: 0, line: 3, end: true, note: 'Empty window: not found.' }); return F;
    },
  },
  halve: {
    label: 'halving a real', code: ['while x > 0', '  x ← x / 2'], vname: 'x', kind: 'real',
    frames(r) { let x = rint(r, 2, 9); const F = [{ state: x, v: x, line: 1, note: `Start at $x = ${x}$. Candidate variant: $x$ itself.` }]; for (let k = 1; k <= 40; k++) { x /= 2; F.push({ state: x, v: x, line: 2, note: `$x = ${x.toExponential(2).replace(/e([-+]\d+)/, '\\times10^{$1}')} > 0$: still running.` }); } return F; },
  },
  collatz: {
    label: 'Collatz', code: ['while n ≠ 1', '  if n even:  n ← n/2', '  else:  n ← 3n + 1'], vname: 'n', kind: 'none',
    frames(r, seed) { let m = 2 * seed + 25; const F = [{ state: m, v: m, line: 1, note: `Start at $n = ${m}$. Candidate variant: $n$.` }]; while (m !== 1 && F.length < 400) { const ev = m % 2 === 0; m = ev ? m / 2 : 3 * m + 1; F.push({ state: m, v: m, line: ev ? 2 : 3, note: ev ? `Even: halve to ${m}.` : `Odd: $3n+1 = ${m}$ — the candidate went **up**.` }); } return F; },
  },
};

// 1.8 — pairs (f, g) with their exact lim inf / lim sup of f/g
const PAIRS = {
  quad: { label: '$3n^2+40n+200$ vs $n^2$', f: (n) => 3 * n * n + 40 * n + 200, g: (n) => n * n, ft: '3n^2+40n+200', gt: 'n^2', L: 3, U: 3, La: true, Ua: false },
  lin: { label: '$100n+10^3$ vs $n^2$', f: (n) => 100 * n + 1000, g: (n) => n * n, ft: '100n+1000', gt: 'n^2', L: 0, U: 0, La: false, Ua: false },
  nlog: { label: '$n\\log_2 n$ vs $n$', f: (n) => n * Math.log2(n), g: (n) => n, ft: 'n\\log_2 n', gt: 'n', L: Infinity, U: Infinity, La: false, Ua: false },
  wav: { label: '$n(2+\\sin\\ln n)$ vs $n$', f: (n) => n * (2 + Math.sin(Math.log(n))), g: (n) => n, ft: 'n(2+\\sin\\ln n)', gt: 'n', L: 1, U: 3, La: true, Ua: true },
};
const NS = (() => { const a = []; for (let n = 1; n <= 2000; n++) a.push(n); for (let k = 1; k <= 1500; k++) a.push(Math.round(2000 * Math.pow(500, k / 1500))); return a; })();

export default {
  collection: 'algo',
  chapter: 1,
  title: 'Correctness, cost and growth',
  summary: String.raw`What it means for a procedure to solve a problem, and how to argue that it does: loop invariants for correctness, decreasing variants for termination. Cost is counted in an idealized machine, and asymptotic notation strips away constant factors so that only the shape of growth remains. The chapter closes with the handful of estimates (geometric sums, sums compared with integrals, harmonic numbers, the size of $n!$) that every later analysis leans on.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Problem, instance and algorithm',
      statement: String.raw`A **computational problem** specifies, for every admissible input, which outputs are acceptable; it is a relation between inputs and outputs (sorting: the output must be the input rearranged in nondecreasing order). A single input is an **instance** of the problem. An **algorithm** is a finite, unambiguous procedure built from elementary steps; it **solves** (is *correct* for) the problem if on *every* instance it halts and returns an acceptable output. A single instance on which a procedure fails or never halts shows that it does not solve the problem.`,
      idea: String.raw`Correctness is a statement about *all* instances, usually infinitely many, so testing can expose a bug but can never establish correctness. That is why the chapter turns at once to proof techniques: loop invariants for "the output is right" (1.4) and decreasing variants for "it halts" (1.6). Cost (1.3) is likewise a function of the instance, summarized by its size.`,
      caption: String.raw`Pick a problem and a procedure; the seed draws eight instances and a brute-force checker grades each output. The flawed procedures pass many tests (the readout counts 2000 more instances) — yet one red row is enough to disqualify them.`,
      deps: [],
      refs: ['CLRS 4e §1.1'],
      tags: ['foundations'],
      viz(v) {
        const prob = v.select('', [{ value: 'sort', label: 'sorting' }, { value: 'gcd', label: 'gcd' }, { value: 'max', label: 'maximum' }], 'sort');
        const proc = v.select('procedure', [{ value: 'good', label: 'correct' }, { value: 'bad', label: 'flawed' }], 'bad');
        const seed = v.slider('seed', 1, 60, 3, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
        const T = v.table(s, { rows: 8, cols: 3, square: false, cellAspect: 4.4, maxCell: 32, size: 13, colLabels: ['instance', 'output', 'checker'], rowLabels: (k) => '#' + (k + 1) });
        let key = '', bulk = 0, ro = '';
        v.render(() => {
          const P = PROBLEMS[prob.value], A = P[proc.value], r = v.rng(seed.value * 7919);
          const inst = Array.from({ length: 8 }, () => P.gen(r)), outs = inst.map(A.run), ok = inst.map((x, i) => P.check(x, outs[i]));
          if (key !== prob.value + proc.value) { key = prob.value + proc.value; const q = v.rng(2024); bulk = 0; for (let k = 0; k < 2000; k++) { const x = P.gen(q); if (P.check(x, A.run(x))) bulk++; } }
          T.draw({
            value: (i, j) => (j === 0 ? P.show(inst[i]) : j === 1 ? P.out(outs[i]) : ok[i] ? '✓ correct' : '✗ wrong'),
            fill: (i, j) => (j === 2 ? [ok[i] ? 'green' : 'red', 0.25] : j === 1 && !ok[i] ? ['red', 0.1] : null),
            textColor: (i, j) => (j === 2 ? (ok[i] ? 'green' : 'red') : 'ink'),
          });
          const good = ok.filter(Boolean).length;
          ro = `**${A.name}** (${P.spec}): ${good}/8 here, ${bulk}/2000 random instances. ` + (bulk === 2000 && good === 8 ? 'No failure found — consistent with correctness, which still has to be *proved*.' : `${good < 8 ? 'Instance #' + (ok.indexOf(false) + 1) + ' is a counterexample' : 'All eight pass, but other instances fail'}: not an algorithm for this problem.`);
        });
        v.readout(() => ro);
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'The RAM model of computation',
      credit: 'Cook & Reckhow, 1973',
      statement: String.raw`The **random-access machine** (RAM) is an idealized computer with an unbounded array of memory cells, each addressable in one step, executing one instruction at a time. Arithmetic ($+,-,\times,\div$, comparison), data movement (load, store, copy) and control (branch, call, return) each cost **one unit**. The running time of an algorithm on an instance is the number of instructions it executes. In the **word RAM**, each cell holds a $w$-bit word with $w \ge \log_2 n$ for inputs of size $n$, so that an index fits in a cell; operating on a number of $b$ bits then costs about $\lceil b/w\rceil$ word operations (more for multiplication).`,
      scope: String.raw`Unit cost is realistic while operands fit in a machine word (integers polynomial in the input size). Programs that build huge numbers, such as $n!$ or $2^{2^n}$ by repeated squaring, must be charged by word or by bit, or the model would let them do impossible amounts of work in one step. The model also ignores caches, parallelism and memory hierarchy.`,
      idea: String.raw`The model fixes what "one step" means, so that running time becomes a precise function of the instance (1.3). Real machines differ from it by constant factors, which asymptotic notation (1.8) discards; the word-size cap is what keeps those factors constant.`,
      caption: String.raw`Step through $n!$ computed by repeated multiplication. Under unit cost register $r$ is one box however large it grows; under the word RAM it splits into $w$-bit words and each multiplication costs one word product per word. The right panel shows the two totals for every $n$.`,
      deps: ['algo-1.1'],
      refs: ['CLRS 4e §2.2'],
      tags: ['foundations', 'models'],
      viz(v) {
        const n = v.slider('$n$', 2, 40, 22, { int: true, onChange: () => S.reset(undefined, { at: 'keep' }) });
        const w = v.slider('word size $w$ (bits)', 4, 64, 8, { int: true, step: 4, onChange: () => S.reset(undefined, { at: 'keep' }) });
        const model = v.select('charge', [{ value: 'unit', label: 'unit cost' }, { value: 'word', label: 'word RAM' }], 'word');
        const reg = v.stage({ x: [0, 16], y: [0, 7], axes: false, height: 230 });
        const cs = v.stage({ x: [2, 40], y: [0, 1], axes: 'box', height: 230, xlabel: 'n', title: 'total operations for $n!$' });
        const S = v.steps({ frames: () => { const F = []; ramRun(n.value, w.value, F); return F; }, code: RAM_CODE, codeTitle: 'Factorial(n)', speed: 5, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, W = w.value, unitM = model.value === 'unit';
          // registers i and n
          reg.text(unitM ? 'unit cost: a register holds any integer' : `word RAM: registers hold ${W}-bit words`, 0.3, 6.5, { baseline: 'middle', size: 12, color: 'muted' });
          [['i', f.i], ['n', n.value]].forEach(([nm, val], k) => {
            const x0 = 1.2 + k * 3.4;
            reg.rect(x0, 4.4, x0 + 2, 5.5, { fill: 'teal', fillAlpha: 0.15, color: 'teal', width: 1.5 });
            reg.text(String(val), x0 + 1, 4.95, { align: 'center', baseline: 'middle', size: 14, weight: 600 });
            reg.text(nm, x0 - 0.25, 4.95, { align: 'right', baseline: 'middle', math: true, size: 15 });
          });
          // register r
          const bits = bitLen(f.r), words = Math.ceil(bits / W);
          reg.tex(String.raw`r = ${bigTex(f.r)}`, 1.2, 3.35, { size: 15, align: 'left', baseline: 'middle' });
          reg.text('r', 0.95, 2.05, { align: 'right', baseline: 'middle', math: true, size: 15 });
          if (unitM) {
            reg.rect(1.2, 1.5, 14.8, 2.6, { fill: 'accent', fillAlpha: 0.15, color: 'accent', width: 1.8 });
            reg.text(`one register · ${bits} bits`, 8, 2.05, { align: 'center', baseline: 'middle', size: 13, weight: 600, color: 'accent' });
          } else {
            const cw = Math.min(1.6, 13.6 / words);
            for (let k = 0; k < words; k++) { const x0 = 1.2 + k * cw; reg.rect(x0, 1.5, x0 + cw * 0.92, 2.6, { fill: k === words - 1 ? 'orange' : 'accent', fillAlpha: 0.22, color: k === words - 1 ? 'orange' : 'accent', width: 1.2 }); }
          }
          reg.text(unitM ? 'any size, one unit per operation' : `${words} word${words > 1 ? 's' : ''} × ${W} bits`, 1.2, 0.7, { baseline: 'middle', size: 12, color: 'muted' });
          reg.text(`last step cost: ${f.line === 4 ? (unitM ? '1 unit' : `${f.cw} word product${f.cw > 1 ? 's' : ''}`) : '1'}`, 15.6, 0.7, { align: 'right', baseline: 'middle', size: 12, color: f.line === 4 && !unitM && f.cw > 1 ? 'orange' : 'muted' });
          // totals for every n
          const U = [], Wd = [];
          for (let m = 2; m <= 40; m++) { const t = ramRun(m, W); U.push([m, t.unit]); Wd.push([m, t.word]); }
          const ymax = Wd[Wd.length - 1][1] * 1.08;
          cs.setView([2, 40], [0, ymax]);
          cs.path(U, { color: 'accent', width: 2.2 }); cs.path(Wd, { color: 'orange', width: 2.2 });
          cs.vline(n.value, { color: 'faint', dash: true });
          cs.dot(n.value, f.unit, { color: 'accent', r: 5 }); cs.dot(n.value, f.word, { color: 'orange', r: 5 });
        });
        v.legend([['accent', 'unit-cost RAM: 3n + 1'], ['orange', 'word RAM (current w)']]);
        v.readout(() => { const f = S.frame; return `So far: **${f.unit}** unit operations, **${f.word}** word operations · $r$ has ${bitLen(f.r)} bits $= ${Math.ceil(bitLen(f.r) / w.value)}$ words · full run: $3n+1 = ${3 * n.value + 1}$ unit ops vs ${ramRun(n.value, w.value).word} word ops.`; });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Worst-, best- and average-case running time',
      statement: String.raw`Let $T(x)$ be the number of RAM steps an algorithm takes on instance $x$, and let $I_n$ be the set of instances of size $n$. The **worst-case** running time is $T_{\max}(n) = \max_{x\in I_n} T(x)$, the **best-case** time is $T_{\min}(n) = \min_{x\in I_n} T(x)$, and for a probability distribution on $I_n$ (often uniform) the **average-case** time is the expectation $\bar T(n) = \mathbb E\,[T(x)]$. Always $T_{\min}(n) \le \bar T(n) \le T_{\max}(n)$.`,
      idea: String.raw`Different instances of the same size can cost very different amounts, so a single number per size needs a policy. The worst case is a guarantee for every input; the average case depends on the assumed distribution. For insertion sort the three are $n-1$, $\tfrac{n(n-1)}{4}+n-H_n$ and $\tfrac{n(n-1)}2$ comparisons: the average is still quadratic.`,
      caption: String.raw`Each column shows how all inputs of size $n$ are spread over comparison counts (every permutation for insertion sort; every position of the key, or its absence, for linear search). Slide $n$ to see the best, average and worst curves pull apart; the right panel is the full distribution at the chosen $n$.`,
      deps: ['algo-1.2'],
      refs: ['CLRS 4e §2.2'],
      tags: ['foundations'],
      viz(v) {
        const alg = v.select('', [{ value: 'ins', label: 'insertion sort' }, { value: 'lin', label: 'linear search' }], 'ins');
        const nn = v.slider('$n$', 1, 8, 6, { int: true });
        const vio = v.stage({ x: [0.4, 8.6], y: [-0.5, 29.5], axes: 'box', height: 320, xlabel: 'n', ylabel: 'comparisons', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const hs = v.stage({ x: [0, 16], y: [0, 1], axes: 'box', height: 320, title: 'share of inputs of size $n$ by number of comparisons' });
        const cache = {};
        const D = (a, n) => cache[a + n] || (cache[a + n] = caseDist(a, n));
        v.render(() => {
          const a = alg.value, N = nn.value, top = a === 'ins' ? 29.5 : 9.5;
          vio.setView([0.4, 8.6], [-0.5, top]);
          const lo = [], hi = [], mu = [];
          for (let n = 1; n <= 8; n++) {
            const d = D(a, n), sel = n === N;
            for (const [x, m] of d.counts) { const hw = 0.42 * m / d.pmax; vio.rect(n - hw, x - 0.38, n + hw, x + 0.38, { fill: sel ? 'accent' : 'muted', fillAlpha: sel ? 0.55 : 0.25, stroke: false }); }
            lo.push([n, d.lo]); hi.push([n, d.hi]); mu.push([n, d.mean]);
          }
          vio.path(hi, { color: 'red', width: 2 }); vio.path(mu, { color: 'gold', width: 2 }); vio.path(lo, { color: 'green', width: 2 });
          for (const [pts, c] of [[hi, 'red'], [mu, 'gold'], [lo, 'green']]) vio.dot(N, pts[N - 1][1], { color: c, r: 4.5 });
          const d = D(a, N);
          hs.setView([d.lo - 1.2, d.hi + 1.2], [0, (d.pmax / d.tot) * 1.18]);
          for (const [x, m] of d.counts) hs.rect(x - 0.4, 0, x + 0.4, m / d.tot, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 });
          hs.vline(d.lo, { color: 'green', width: 2 }); hs.vline(d.mean, { color: 'gold', width: 2, dash: true }); hs.vline(d.hi, { color: 'red', width: 2 });
        });
        v.legend([['red', 'worst case'], ['gold', 'average (uniform)'], ['green', 'best case']]);
        v.readout(() => {
          const N = nn.value, d = D(alg.value, N); let H = 0; for (let k = 1; k <= N; k++) H += 1 / k;
          const form = alg.value === 'ins' ? String.raw`\;(= n-1,\ \tfrac{n(n-1)}4+n-H_n = ${v.fix(N * (N - 1) / 4 + N - H, 3)},\ \tfrac{n(n-1)}2)` : String.raw`\;(= 1,\ \tfrac{n(n+3)}{2(n+1)},\ n)`;
          return `Over all ${d.tot} ${alg.value === 'ins' ? 'permutations' : 'cases'} of size ${N}: best **${d.lo}**, average **${v.fix(d.mean, 3)}**, worst **${d.hi}** $${form}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Loop invariant',
      credit: 'Floyd, 1967; Hoare, 1969',
      statement: String.raw`A **loop invariant** is a statement about the program's variables that is true each time control reaches the loop test. To use it one shows:

(i) **initialization** — it holds before the first iteration;
(ii) **maintenance** — if it holds before an iteration, it holds after that iteration;
(iii) **termination** — when the loop exits, the invariant together with the exit condition implies the property we want.

Steps (i)–(ii) are an induction on the number of iterations; step (iii) converts the invariant into correctness of the output.`,
      idea: String.raw`An invariant packages "what has been accomplished so far" into a claim that survives each iteration. For a running maximum it is "best equals the maximum of the prefix already scanned": true for a one-entry prefix, preserved because the new maximum is either the old one or the new entry, and at exit the prefix is the whole array. Halting itself is a separate argument (1.6).`,
      caption: String.raw`Drag the bars to edit the array, then step. The scanned prefix is green while best (gold line) equals its true maximum (dashed) and turns red where the invariant fails. The buggy versions break initialization or maintenance — sometimes still returning the right answer by luck; make every entry negative or reorder to expose them.`,
      deps: ['algo-1.1'],
      refs: ['CLRS 4e §2.1'],
      tags: ['correctness'],
      viz(v) {
        const A = [-2, 5, 3, 7, 1, 4, 6, 2], n = A.length;
        const bug = v.select('version', [{ value: 'ok', label: 'correct' }, { value: 'zero', label: 'best ← 0' }, { value: 'prev', label: 'compare with A[i−1]' }], 'ok', { onChange: () => { S.setCode(INV_CODE[bug.value]); S.reset(undefined, { at: 'keep' }); } });
        const s = v.stage({ x: [-1.7, n + 0.7], y: [-5.6, 10.6], axes: false, height: 320 });
        const S = v.steps({ frames: () => invFrames(A, bug.value), code: INV_CODE.ok, codeTitle: 'Max(A)', speed: 1.4, start: 'end' });
        A.forEach((a, i) => { const h = s.handle(i + 1, a, { color: 'accent', r: 6, constrain: (x, y) => [i + 1, Math.max(-5, Math.min(9, Math.round(y)))] }); h.onDrag = () => { if (A[i] !== h.y) { A[i] = h.y; S.reset(undefined, { at: 'keep' }); } }; });
        v.render(() => {
          const f = S.frame;
          s.line(-0.2, 0, n + 0.55, 0, { color: 'faint', width: 1 });
          for (let i = 0; i < n; i++) {
            const inPre = i < f.k, col = i === f.cur ? 'gold' : inPre ? (f.holds === false ? 'red' : 'green') : 'accent';
            s.rect(i + 0.62, 0, i + 1.38, A[i], { fill: col, fillAlpha: i === f.cur ? 0.6 : 0.35, color: col, width: 1.2 });
            s.text(String(A[i]), i + 1, A[i] >= 0 ? -0.75 : 0.75, { align: 'center', baseline: 'middle', size: 12, weight: 600, color: 'muted' });
          }
          const same = f.k && f.pm === f.best, close = f.k && Math.abs(f.pm - f.best) < 1.3, up = f.best > f.pm ? -1 : 1;
          if (f.k) {
            s.line(-0.2, f.pm, f.k + 0.5, f.pm, { color: 'green', width: 1.6, dash: [5, 4] });
            if (!same) s.text(`max = ${f.pm}`, -1.6, f.pm, { baseline: 'middle', dy: close ? -9 * up : 0, size: 12, weight: 600, color: 'green' });
          }
          s.line(-0.2, f.best, (f.k || 0.5) + 0.5, f.best, { color: 'gold', width: 2.6 });
          s.text(same ? `best = max = ${f.best}` : `best = ${f.best}`, -1.6, f.best, { baseline: 'middle', dy: same ? -9 : close ? 9 * up : 0, size: 12, weight: 600, color: same ? 'green' : 'gold' });
          if (f.k) s.vband(0.5, f.k + 0.5, { color: f.holds === false ? 'red' : 'green', alpha: 0.05 });
          s.text(f.phase === 'init' ? 'initialization' : f.phase === 'term' ? 'termination' : `after i = ${f.k}`, n + 0.6, -5.2, { align: 'right', size: 12, color: 'muted' });
        });
        v.readout(() => {
          const F = S.frames, init = F[0], maint = F.filter((f) => f.phase === 'maint'), bad = maint.find((f) => !f.holds), end = F[F.length - 1];
          const iTxt = init.k === 0 ? 'vacuous (empty prefix)' : init.holds ? '✓' : '✗';
          return `Invariant **best = max A[1..k]** — initialization: ${iTxt} · maintenance: ${bad ? `**✗ broken at k = ${bad.k}** (best ${bad.best}, true max ${bad.pm})` : `✓ in all ${maint.length} iterations`} · output ${end.best} ${end.best === Math.max(...A) ? '= max A ✓' : `≠ max A = ${Math.max(...A)} ✗`}${bad && end.best === Math.max(...A) ? ' (right by luck: the proof is broken)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Algorithm',
      name: 'Binary search',
      credit: 'Mauchly, 1946; Lehmer, 1960',
      statement: String.raw`**Input:** a sorted array $A[1..n]$ and a value $x$. **Output:** an index $i$ with $A[i] = x$, or "not found". Keep a window $[lo, hi]$, initially $[1, n]$; probe $mid = \lfloor (lo+hi)/2 \rfloor$, return it if $A[mid] = x$, and otherwise continue in the half that can still contain $x$. **Guarantee:** the answer is correct, and at most $\lceil \log_2(n+1)\rceil$ probes are made, so the worst-case time is $\Theta(\log n)$.`,
      idea: String.raw`Invariant (1.4): *if $x$ occurs in $A$, it occurs in $A[lo..hi]$* — sortedness makes the discarded half safe. A window of size $s$ leaves at most $\lfloor s/2 \rfloor$ after an unsuccessful probe, so the size, a nonnegative integer, strictly drops (1.6) and after $k$ probes is below $(n+1)/2^k$; it is empty once $2^k \ge n+1$. The off-by-one update $lo \leftarrow mid$ breaks the variant and the loop can run forever.`,
      caption: String.raw`Choose the target with the slider or by clicking a cell. Each row is the window after one probe (gold = probed cell); step through and watch the invariant check. The buggy update $lo \leftarrow mid$ gets stuck on a two-cell window.`,
      deps: ['algo-1.4', 'algo-1.3'],
      refs: ['Erickson Ch. 1', 'CLRS 4e Ex. 2.3-6'],
      tags: ['searching', 'correctness'],
      viz(v) {
        const base = (() => { const r = v.rng(11), a = [rint(r, 1, 3)]; for (let k = 1; k < 31; k++) a.push(a[k - 1] + rint(r, 1, 3)); return a; })();
        const nn = v.slider('$n$', 1, 31, 31, { int: true, onChange: () => S.reset() });
        const xs = v.slider('target $x$', 0, 95, 61, { int: true, onChange: () => S.reset() });
        const bug = v.toggle('buggy: lo ← mid', false, { onChange: () => { S.setCode(bug.value ? BS_CODE.map((l, i) => (i === 4 ? '  if A[mid] < x:  lo ← mid   // bug' : l)) : BS_CODE); S.reset(); } });
        const s = v.stage({ x: [0, 35], y: [-7.6, 1.6], axes: false, height: 320 });
        const arrOf = () => base.slice(0, nn.value);
        const S = v.steps({ frames: () => bsFrames(arrOf(), xs.value, bug.value), code: BS_CODE, codeTitle: 'Binary-Search(A, x)', speed: 1.2, start: 'end' });
        s.onClick((x, y) => { const i = Math.round(x); if (i >= 1 && i <= nn.value && y > -0.6 && y < 1.2) { xs.set(arrOf()[i - 1]); S.reset(); } });
        v.render(() => {
          const f = S.frame, A = arrOf(), n = A.length, W = Math.max(n, 16) + 3.6, cw = 0.92;
          s.setView([0.2, W], [-7.6, 1.6]);
          f.rows.forEach((row, k) => {
            const y = -k * 1.05, last = k === f.rows.length - 1;
            for (let i = 1; i <= n; i++) {
              const inW = i >= row.lo && i <= row.hi, isMid = i === row.mid, isX = A[i - 1] === xs.value;
              const col = isMid ? (row.found ? 'green' : 'gold') : inW ? 'accent' : 'faint';
              s.rect(i - cw / 2, y - 0.42, i + cw / 2, y + 0.42, { fill: col, fillAlpha: isMid ? 0.6 : inW ? (last ? 0.3 : 0.16) : 0.08, color: isX && inW ? 'green' : col, width: isX && inW ? 2 : 1 });
              if (k === 0 || inW || isMid) s.text(String(A[i - 1]), i, y, { align: 'center', baseline: 'middle', size: n > 24 ? 9.5 : 11, color: inW || isMid ? 'ink' : 'muted', weight: isMid ? 700 : 500 });
            }
            const size = Math.max(0, row.hi - row.lo + 1);
            s.text(k === 0 ? `${size}` : `→ ${size}`, n + 0.8, y, { baseline: 'middle', size: 11.5, color: row.found ? 'green' : last && f.stuck ? 'red' : 'muted', weight: last ? 600 : 500 });
          });
          if (f.stuck) s.text('stuck: window repeats', n + 0.8, -f.rows.length * 1.05 + 0.1, { baseline: 'middle', size: 11.5, color: 'red', weight: 700 });
        });
        v.readout(() => {
          const F = S.frames, n = nn.value, bound = Math.ceil(Math.log2(n + 1)), f = S.frame, last = F[F.length - 1], ok = F.every((g) => g.inv);
          return `Probes so far **${f.probes}** (whole run: ${last.stuck ? '∞' : last.probes}) vs $\\lceil\\log_2(n+1)\\rceil = ${bound}$ · invariant "$x\\in A \\Rightarrow x\\in A[lo..hi]$": ${ok ? '✓ at every step' : '✗'} · ${last.stuck ? '**never terminates**' : last.found ? `found at index ${last.found}` : 'not in the array'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Termination by a decreasing variant',
      credit: 'Turing, 1949; Floyd, 1967',
      statement: String.raw`A **variant** (or ranking function) of a loop is an expression in the program's variables whose value is a **nonnegative integer** at every loop test and **strictly decreases** with each iteration. If a loop has a variant, it terminates, after at most as many iterations as the variant's initial value. More generally any quantity in a well-ordered set that strictly decreases will do; a positive *real* quantity that decreases is not enough.`,
      idea: String.raw`The values of the variant form a strictly decreasing sequence of nonnegative integers, and such a sequence has at most $v_0+1$ terms because the integers below $v_0$ are finite in number (equivalently: $\mathbb N$ is well-ordered). Euclid's remainder, a binary-search window and the inversion count of an array are variants. Halving a positive real decreases forever without stopping, and for the Collatz map no variant is known — whether it always halts is open.`,
      caption: String.raw`Choose a loop and a seed, then step. The lower panel plots the candidate variant after each iteration: green drops, red rises. Integer variants hit bottom; halving a real keeps dropping without ever reaching 0; Collatz climbs as often as it falls.`,
      deps: ['algo-1.4'],
      refs: ['CLRS 4e §2.1', 'Erickson Ch. 1'],
      tags: ['correctness'],
      viz(v) {
        const proc = v.select('', Object.entries(VARIANT).map(([value, P]) => ({ value, label: P.label })), 'euclid', { onChange: () => { S.setCode(VARIANT[proc.value].code); S.reset(); } });
        const seed = v.slider('seed', 1, 40, 1, { int: true, onChange: () => S.reset() });
        const top = v.stage({ x: [0, 10], y: [0, 1], axes: false, height: 170, full: true });
        const bot = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', height: 210, full: true });
        const S = v.steps({ frames: () => VARIANT[proc.value].frames(v.rng(seed.value * 31 + 7), seed.value), code: VARIANT.euclid.code, codeTitle: 'loop', speed: 3, start: 'end' });
        v.render(() => {
          const P = VARIANT[proc.value], F = S.frames.filter((g) => !g.end), f = S.frame, i = Math.min(S.i, F.length - 1), st = f.state;
          // state picture
          if (proc.value === 'euclid') {
            const M = F[0].state[0]; top.setView([0, 10], [0, 3]);
            [['a', st[0], 'accent', 2], ['b', st[1], 'orange', 1]].forEach(([nm, val, c, y]) => { top.rect(0.8, y - 0.35, 0.8 + 8.6 * val / M, y + 0.35, { fill: c, fillAlpha: 0.35, color: c }); top.text(nm, 0.6, y, { align: 'right', baseline: 'middle', math: true, size: 15 }); top.text(String(val), 0.9 + 8.6 * val / M, y, { dx: 4, baseline: 'middle', size: 12, weight: 600 }); });
          } else if (proc.value === 'bubble') {
            top.setView([0.3, 9.7], [-1, 21.5]);
            st.forEach((h, k) => { const c = f.hi && f.hi.includes(k) ? 'gold' : 'accent'; top.rect(k + 0.62, 0, k + 1.38, h, { fill: c, fillAlpha: 0.45, color: c }); top.text(String(h), k + 1, h, { align: 'center', dy: -8, size: 11, color: 'muted' }); });
          } else if (proc.value === 'bsearch') {
            top.setView([0, 64.5], [0, 3]);
            for (let k = 1; k <= st.n; k++) { const inW = k >= st.lo && k <= st.hi, c = k === st.mid ? 'gold' : inW ? 'accent' : 'faint'; top.rect(k - 0.42, 1, k + 0.42, 2, { fill: c, fillAlpha: inW || k === st.mid ? 0.55 : 0.12, stroke: false }); }
            top.text(`window [${st.lo}, ${st.hi}]`, 32, 0.45, { align: 'center', baseline: 'middle', size: 12, color: 'muted' });
          } else {
            top.setView([0, 10], [0, 3]);
            top.tex(proc.value === 'halve' ? String.raw`x = ${st.toExponential(3).replace(/e([-+]\d+)/, '\\times10^{$1}')}` : `n = ${st}`, 5, 1.7, { align: 'center', baseline: 'middle', size: 26 });
            top.text(proc.value === 'halve' ? 'positive and shrinking, but never 0' : st % 2 === 0 ? 'even' : 'odd', 5, 0.6, { align: 'center', baseline: 'middle', size: 12, color: 'muted' });
          }
          // variant history
          const vmax = Math.max(...F.map((g) => g.v)), N = F.length - 1;
          bot.setView([-0.5, Math.max(N, 4) + 0.5], [0, vmax * 1.1]);
          bot.hline(0, { color: 'ink', width: 1 });
          for (let k = 1; k <= N; k++) { const up = F[k].v > F[k - 1].v, c = k <= i ? (up ? 'red' : 'green') : 'faint'; bot.line(k - 1, F[k - 1].v, k, F[k].v, { color: c, width: k <= i ? 2 : 1 }); }
          const pr = N > 60 ? 2 : 3.5;
          F.forEach((g, k) => { if (k <= i) bot.dot(k, g.v, { r: k === i ? 5.5 : pr, color: k === i ? 'gold' : 'accent' }); });
          bot.setTitle(`candidate variant ${P.vname} after each iteration`);
        });
        v.readout(() => {
          const P = VARIANT[proc.value], F = S.frames.filter((g) => !g.end), ups = F.slice(1).filter((g, k) => g.v > F[k].v).length, N = F.length - 1;
          if (P.kind === 'int') return `${P.vname}: ${F.slice(0, 12).map((g) => g.v).join(' → ')}${N >= 12 ? ' → …' : ''} — a nonnegative integer that drops at every iteration ✓, so at most $v_0 = ${F[0].v}$ iterations; this run took ${N}.`;
          if (P.kind === 'real') return `After 40 halvings $x = ${F[N].v.toExponential(2).replace(/e([-+]\d+)/, '\\times10^{$1}')} > 0$: the candidate strictly decreases and stays positive, yet in exact arithmetic the loop **never ends** — a real quantity can decrease forever.`;
          return `$n$ rose in **${ups}** of ${N} iterations (peak ${Math.max(...F.map((g) => g.v))}) before reaching 1: $n$ is not a variant, and no variant is known — termination for every start is the open Collatz problem.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Algorithm',
      name: 'Euclid’s algorithm and Lamé’s bound',
      credit: 'Euclid, c. 300 BC; Lamé, 1844',
      statement: String.raw`**Input:** integers $a \ge b \ge 0$, not both $0$. **Output:** $\gcd(a, b)$. While $b \ne 0$ replace $(a, b)$ by $(b,\ a \bmod b)$; then return $a$. **Correctness:** $\gcd(a, b) = \gcd(b, a \bmod b)$ and $\gcd(a, 0) = a$. **Lamé's bound:** if $a > b \ge 1$ and the loop makes $k \ge 1$ division steps, then $b \ge F_{k+1}$ and $a \ge F_{k+2}$ (Fibonacci numbers, $F_1 = F_2 = 1$). Hence $k \le 1 + \log_\varphi b$ with $\varphi = \tfrac{1+\sqrt5}2$, so the algorithm takes $O(\log b)$ steps, and consecutive Fibonacci numbers are the worst case.`,
      idea: String.raw`A common divisor of $a$ and $b$ divides $a - qb$, and conversely, so the invariant "$\gcd$ of the pair is unchanged" holds (1.4); $b$ is a decreasing variant (1.6). For the bound, run the steps backwards: the last pair is at least $(2, 1) = (F_3, F_2)$, and each earlier pair satisfies $a = qb + r \ge b + r$, so the pairs grow at least as fast as Fibonacci numbers. Quotients all equal to $1$ — consecutive Fibonacci inputs — are exactly the slowest case.`,
      caption: String.raw`Set $a$ and $b$ (or press *Fibonacci pair*): Euclid carves the rectangle into squares, one colour per division step, the number in a strip being the quotient. On the right every $b \le 1000$ shows its worst step count over all $a$ (Fibonacci $b$ in gold) against Lamé's staircase and $1 + \log_\varphi b$.`,
      deps: ['algo-1.6', 'algo-1.3'],
      see: ['nt-1.4'],
      refs: ['CLRS 4e §31.2', 'Knuth TAOCP Vol. 2 §4.5.3'],
      tags: ['number theory', 'correctness'],
      viz(v) {
        const FIB = [1, 1]; while (FIB[FIB.length - 1] < 2000) FIB.push(FIB[FIB.length - 1] + FIB[FIB.length - 2]); // FIB[k−1] = F_k
        const steps = (a, b) => { let k = 0; while (b) { [a, b] = [b, a % b]; k++; } return k; };
        const lame = (b) => { let k = 1; while (FIB[k + 1] <= b) k++; return k; };          // largest k with F_{k+1} ≤ b
        const WORST = [0]; for (let b = 1; b <= 1000; b++) { let m = 0; for (let a = b + 1; a <= 2 * b; a++) m = Math.max(m, steps(a, b)); WORST.push(m); }
        const a = v.slider('$a$', 1, 1000, 89, { int: true }), b = v.slider('$b$', 1, 1000, 55, { int: true });
        let fi = 9;
        v.button('Fibonacci pair', () => { fi = fi >= 15 ? 5 : fi + 1; a.set(FIB[fi]); b.set(FIB[fi - 1]); });
        const rect = v.stage({ x: [0, 89], y: [0, 55], equal: true, axes: false, height: 320 });
        const pl = v.stage({ x: [1, 1000], y: [0, 16.5], xlog: true, height: 320, title: 'division steps against the smaller input $b$' });
        const COLS = ['blue', 'teal', 'purple', 'orange', 'pink', 'green', 'gold', 'red'];
        v.render(() => {
          const A = a.value, B = b.value, hi = Math.max(A, B), lo = Math.min(A, B);
          rect.setView([0, A], [0, B]);
          let x = 0, y = 0, W = A, H = B, k = 0;
          while (W > 0 && H > 0) {
            const c = COLS[k % COLS.length];
            if (W >= H) { const q = Math.floor(W / H); rect.rect(x, y, x + q * H, y + H, { fill: c, fillAlpha: 0.3, color: c, width: 1.4 }); if (q <= 60) for (let j = 1; j < q; j++) rect.line(x + j * H, y, x + j * H, y + H, { color: c, width: 0.8 }); if (q * H > A / 25 && H > B / 25) rect.text(String(q), x + q * H / 2, y + H / 2, { align: 'center', baseline: 'middle', size: Math.min(15, 7 + H * 260 / B / 25), weight: 700, color: c }); x += q * H; W -= q * H; }
            else { const q = Math.floor(H / W); rect.rect(x, y, x + W, y + q * W, { fill: c, fillAlpha: 0.3, color: c, width: 1.4 }); if (q <= 60) for (let j = 1; j < q; j++) rect.line(x, y + j * W, x + W, y + j * W, { color: c, width: 0.8 }); if (q * W > B / 25 && W > A / 25) rect.text(String(q), x + W / 2, y + q * W / 2, { align: 'center', baseline: 'middle', size: Math.min(15, 7 + W * 260 / A / 25), weight: 700, color: c }); y += q * W; H -= q * W; }
            k++;
          }
          // worst cases and Lamé's bound
          for (let bb = 1; bb <= 1000; bb++) if (!FIB.includes(bb)) pl.dot(bb, WORST[bb], { r: 1.4, color: 'muted' });
          const stair = []; for (let bb = 1; bb <= 1000; bb++) { stair.push([bb, lame(bb)]); stair.push([bb + 1, lame(bb)]); }
          pl.path(stair, { color: 'green', width: 2 });
          pl.fn((t) => 1 + Math.log(t) / Math.log((1 + Math.sqrt(5)) / 2), { color: 'orange', width: 1.8, dash: [6, 4] });
          FIB.forEach((F, j) => { if (j >= 1 && F <= 1000) pl.dot(F, WORST[F], { r: 3.5, color: 'gold' }); });
          pl.dot(lo, steps(hi, lo), { r: 6, color: 'accent', label: `(${hi}, ${lo})`, labelPos: 'nw' });
        });
        v.legend([['muted', 'worst over all a', { dot: true }], ['gold', 'b a Fibonacci number', { dot: true }], ['green', 'Lamé: largest $k$ with $F_{k+1} \\le b$'], ['orange', '$1 + \\log_\\varphi b$', { dash: true }]]);
        v.readout(() => {
          const A = a.value, B = b.value, hi = Math.max(A, B), lo = Math.min(A, B), k = steps(hi, lo), L = lame(lo);
          const qs = []; let x = hi, y = lo; while (y) { qs.push(Math.floor(x / y)); [x, y] = [y, x % y]; }
          return `$\\gcd(${hi}, ${lo}) = ${x}$ in **${k}** division steps (quotients ${qs.join(', ')}) · Lamé allows at most ${L} for $b = ${lo}$ ($1+\\log_\\varphi b = ${v.fix(1 + Math.log(lo) / Math.log(1.618034), 2)}$)${k === L ? ' — **the bound is attained**' : ''}${qs.slice(0, -1).every((q) => q === 1) && qs.length > 1 ? ' · all quotients 1: consecutive Fibonacci numbers' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Asymptotic notation: O, Ω and Θ',
      credit: 'Bachmann, 1894; Landau, 1909; Knuth, 1976',
      statement: String.raw`For functions $f, g$ from the positive integers to the nonnegative reals:

- $f = O(g)$ if there are constants $c > 0$ and $n_0$ with $f(n) \le c\,g(n)$ for all $n \ge n_0$;
- $f = \Omega(g)$ if there are $c > 0$ and $n_0$ with $f(n) \ge c\,g(n)$ for all $n \ge n_0$;
- $f = \Theta(g)$ if there are $c_1, c_2 > 0$ and $n_0$ with $c_1 g(n) \le f(n) \le c_2 g(n)$ for all $n \ge n_0$.

Thus $f = \Theta(g)$ exactly when $f = O(g)$ and $f = \Omega(g)$. The equals sign is a convention: $O(g)$ is a set of functions and $f = O(g)$ means $f \in O(g)$.`,
      idea: String.raw`The constant $c$ absorbs machine-dependent factors (1.2) and the threshold $n_0$ ignores small inputs, so only the growth rate of a running time (1.3) survives. A pair $(c, n_0)$ that works is a *witness*; to refute $f = O(g)$ one must defeat every $c$, typically by showing $f/g$ is unbounded (1.10).`,
      caption: String.raw`On log–log axes choose a pair and a relation, set the constants and drag $n_0$. The region $n \ge n_0$ turns green when $(c, n_0)$ is a witness and red dots mark violations; the readout also reports what happens beyond the window, from the exact $\liminf$ and $\limsup$ of $f/g$.`,
      deps: ['algo-1.3'],
      refs: ['CLRS 4e §3.2'],
      tags: ['asymptotics'],
      viz(v) {
        const pair = v.select('', Object.entries(PAIRS).map(([value, P]) => ({ value, label: P.label })), 'quad');
        const rel = v.select('claim', [{ value: 'O', label: '$O$' }, { value: 'W', label: '$\\Omega$' }, { value: 'T', label: '$\\Theta$' }], 'T');
        const c1 = v.slider('$c_1$ (lower)', 0.01, 100, 2, { log: true, decimals: 2 });
        const c2 = v.slider('$c_2$ (upper)', 0.01, 100, 4, { log: true, decimals: 2 });
        const s = v.stage({ x: [1, 1e6], y: [1, 1e15], xlog: true, ylog: true, height: 300, full: true, title: '$f$ and the scaled bounds (log–log)' });
        const q = v.stage({ x: [1, 1e6], y: [1e-3, 1e3], xlog: true, ylog: true, height: 190, full: true, title: 'the ratio $f(n)/g(n)$ must stay between the constants for $n \\ge n_0$' });
        let Y0 = 1, last = '', info = null;
        const h = s.handle(10, 1, { color: 'green', label: 'n₀', labelPos: 'ne', constrain: (x) => [Math.max(1, Math.min(1e6, Math.round(x))), Y0] });
        const clip = (y) => (y >= 1e-3 && y <= 1e3 ? y : NaN);
        v.render(() => {
          const P = PAIRS[pair.value], R = rel.value, useL = R !== 'O', useU = R !== 'W';
          c1.el.hidden = !useL; c2.el.hidden = !useU;
          if (last !== pair.value) { last = pair.value; let lo = Infinity, hi = 0; for (const n of [1, 2, 10, 1e3, 1e6]) for (const y of [P.f(n), 0.01 * P.g(n), 100 * P.g(n)]) if (y > 0) { lo = Math.min(lo, y); hi = Math.max(hi, y); } Y0 = lo / 2; s.setView([1, 1e6], [lo / 12, hi * 3]); h.set(h.x, Y0); }
          const n0 = h.x, C1 = c1.value, C2 = c2.value, bad = [];
          for (const n of NS) { if (n < n0) continue; const f = P.f(n), g = P.g(n); if ((useU && f > C2 * g) || (useL && f < C1 * g)) bad.push(n); }
          const tailU = !useU || C2 > P.U || (P.Ua && C2 >= P.U), tailL = !useL || C1 < P.L || (P.La && C1 <= P.L);
          info = { bad, tailU, tailL, n0, P, R };
          const ok = !bad.length && tailU && tailL, step = Math.max(1, Math.ceil(bad.length / 160));
          for (const st of [s, q]) { st.vband(n0, 1e6, { color: ok ? 'green' : 'red', alpha: 0.07 }); st.vline(n0, { color: 'green', width: 1.5 }); }
          if (useU && useL) s.between((n) => C1 * P.g(n), (n) => C2 * P.g(n), 1, 1e6, { fill: 'orange', fillAlpha: 0.07 });
          if (useU) s.fn((n) => C2 * P.g(n), { color: 'orange', width: 2, dash: [7, 4] });
          if (useL) s.fn((n) => C1 * P.g(n), { color: 'purple', width: 2, dash: [7, 4] });
          s.fn(P.f, { color: 'accent', width: 2.6 });
          for (let k = 0; k < bad.length; k += step) s.dot(bad[k], P.f(bad[k]), { r: 2.6, color: 'red' });
          // ratio panel
          if (useU && useL) q.hband(C1, C2, { color: 'orange', alpha: 0.07 });
          if (useU) q.hline(C2, { color: 'orange', width: 2, dash: [7, 4] });
          if (useL) q.hline(C1, { color: 'purple', width: 2, dash: [7, 4] });
          q.fn((n) => clip(P.f(n) / P.g(n)), { color: 'accent', width: 2.4 });
          for (let k = 0; k < bad.length; k += step) { const y = P.f(bad[k]) / P.g(bad[k]); if (y >= 1e-3 && y <= 1e3) q.dot(bad[k], y, { r: 2.4, color: 'red' }); }
        });
        v.legend([['accent', '$f(n)$'], ['orange', '$c_2\\,g(n)$', { dash: true }], ['purple', '$c_1\\,g(n)$', { dash: true }], ['red', 'violation', { dot: true }]]);
        v.readout(() => {
          const { bad, tailU, tailL, n0, P, R } = info, name = { O: 'O', W: '\\Omega', T: '\\Theta' }[R];
          const truth = { O: P.U < Infinity, W: P.L > 0, T: P.U < Infinity && P.L > 0 }[R];
          const lim = `\\liminf f/g = ${P.L === Infinity ? '\\infty' : P.L},\\ \\limsup f/g = ${P.U === Infinity ? '\\infty' : P.U}`;
          const win = bad.length ? `**✗ fails** at ${bad.length > 1 ? `${bad.length} sampled n in [${n0}, 10⁶], first n = ${bad[0]}` : `n = ${bad[0]}`}` : `✓ on $[${n0}, 10^6]$`;
          const tail = tailU && tailL ? 'and beyond, since the constants clear the limits ✓' : '**but fails again beyond $10^6$**: the constants do not clear the limits';
          return `$f = ${P.ft},\\ g = ${P.gt}$: ${win} ${bad.length ? '' : tail} · $${lim}$, so $f ${truth ? '=' : '\\ne'} ${name}(g)$${truth ? (bad.length || !(tailU && tailL) ? ' — adjust the constants or $n_0$ to find a witness' : ' — witnessed by these constants') : ''}.`;
        });
      },
    },
  ],
};
