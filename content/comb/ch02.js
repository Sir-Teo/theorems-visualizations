// Combinatorics — Chapter 2: Permutations (items 2.1–2.6; 2.7–2.12 are in ch02-b.js)
//
// House style: every statistic (cycles, records, inversions, …) is tallied by running through *all*
// n! permutations, and the readouts compare that tally with the closed form the theorem claims.
// Elements and cycles keep a fixed colour (CAT[i]) so that a bijection can be followed by eye.
import {
  CAT, cyclesOf, fact, stirling1, pen, toPx, fitGrid, allPerms, range, inversions, cycleCount, lrMaxima, sgn, lcmAll,
  wordStr, cycStr, cycTex, cycleType, shuffled, polyMul, qFactPoly, polyTex, arrowQuad, letterBox,
} from './ch02.shared.js';

/** Rising-factorial coefficients: the coefficient of x^k in x(x+1)…(x+n−1). */
function risePoly(n) { let r = [1]; for (let i = 0; i < n; i++) r = polyMul(r, [i, 1]); return r; }
const harmonic = (n) => { let h = 0; for (let i = 1; i <= n; i++) h += 1 / i; return h; };

export default {
  collection: 'comb',
  chapter: 2,
  title: 'Permutations',
  summary: String.raw`A permutation can be read as a list, as a product of disjoint cycles or as a set of inversions, and each reading gives its own statistics. We count permutations by cycles, records, inversions and descents, find that some of these statistics share a distribution for non-obvious reasons, and meet $q$-analogues that count the same objects with an extra weight. Random permutations have surprisingly regular cycle structure.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Cycle decomposition of a permutation',
      statement: String.raw`A permutation of $[n]=\{1,\dots,n\}$ is a bijection $\pi:[n]\to[n]$. Following $i\mapsto\pi(i)\mapsto\pi(\pi(i))\mapsto\cdots$ must return to $i$ (a bijection on a finite set cannot merge two orbits), so $[n]$ splits into disjoint **cycles** $(a_1\,a_2\,\dots\,a_\ell)$ meaning $\pi(a_1)=a_2,\dots,\pi(a_\ell)=a_1$. The list of cycles, ignoring the order of the cycles and the starting point inside each, determines $\pi$ and is determined by it. A cycle of length 1 is a **fixed point**; the multiset of cycle lengths is the **cycle type** of $\pi$, a partition of $n$.`,
      idea: String.raw`The relation "$j=\pi^m(i)$ for some $m\ge 0$" is an equivalence relation on $[n]$: reflexive and transitive clearly, symmetric because $\pi^{N}=\mathrm{id}$ for $N=n!$ (a permutation has finite order). Its classes are the cycles, and each class is traversed in one fixed cyclic order. So a permutation is the same thing as a set partition of $[n]$ together with a cyclic arrangement of each block — a bijection between the permutations and the "sets of necklaces" that will be the starting point of exponential generating functions.`,
      caption: String.raw`Top: two-line notation, with a string from each bottom entry $\pi(i)$ to the top entry of the same name, coloured by cycle. Click two bottom entries to swap their values: a swap either **merges** two cycles into one or **splits** one into two, and the readout says which. Bottom: the functional graph, falling apart into disjoint coloured rings. Try the one-big-cycle and identity buttons for the extremes.`,
      deps: ['comb-1.5'],
      refs: ['Stanley EC1 §1.3'],
      tags: ['permutations', 'cycles'],
      viz(v) {
        let seed = 4, w = shuffled(v.rng(seed), 9), sel = null, last = 'Click two entries of the bottom row to swap their values.';
        const nS = v.slider('$n$', 2, 12, 9, { int: true, onChange: () => { w = shuffled(v.rng(++seed), nS.value); sel = null; last = 'New permutation.'; } });
        v.button('Shuffle', () => { w = shuffled(v.rng(++seed), nS.value); sel = null; last = 'Shuffled.'; });
        v.button('Identity', () => { w = range(nS.value); sel = null; last = 'Identity: every element is a fixed point.'; });
        v.button('One big cycle', () => { const n = nS.value; w = range(n).map((i) => (i + 1) % n); sel = null; last = 'The long cycle $(1\\,2\\,\\dots\\,n)$.'; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, title: 'two-line notation (click two bottom entries to swap)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.3, title: 'functional graph $i \\to \\pi(i)$' });
        const geom = () => { const n = nS.value, W = A.width, cw = Math.min(50, (W - 70) / n); return { n, cw, x0: 52 + (W - 62 - n * cw) / 2, bh: Math.min(30, cw * 0.8) }; };
        A.onClick((x, y) => {
          const { n, cw, x0 } = geom(); const [px, py] = toPx(A, x, y);
          const j = Math.floor((px - x0) / cw); if (j < 0 || j >= n || py < A.height * 0.5) return;
          if (sel == null) { sel = j; return; }
          if (sel === j) { sel = null; return; }
          const before = cycleCount(w); [w[sel], w[j]] = [w[j], w[sel]]; sel = null;
          const after = cycleCount(w);
          last = after < before ? '**Merged** two cycles into one (the two swapped entries were in different cycles).' : after > before ? '**Split** one cycle into two (the two swapped entries were in the same cycle).' : 'Swapped two entries.';
        });
        v.render(() => {
          const { n, cw, x0, bh } = geom(); const P = pen(v, A), H = A.height;
          const cyc = cyclesOf(w), colOf = Array(n);
          cyc.forEach((c, k) => c.forEach((e) => { colOf[e] = CAT[k % CAT.length]; }));
          const yT = 34, yB = H - 34 - bh;
          for (let j = 0; j < n; j++) {
            const xa = x0 + (w[j] + 0.5) * cw, xb = x0 + (j + 0.5) * cw;
            P.quad(xb, yB, xb, (yT + bh + yB) / 2, xa, yT + bh, { color: colOf[j], width: 2.4, alpha: 0.9 });
          }
          for (let j = 0; j < n; j++) {
            letterBox(P, x0 + j * cw + 2, yT, cw - 4, bh, j + 1, { color: 'muted', text: 'muted', weight: 500 });
            letterBox(P, x0 + j * cw + 2, yB, cw - 4, bh, w[j] + 1, { fill: colOf[j], fillAlpha: 0.9, color: sel === j ? 'ink' : colOf[j], width: sel === j ? 3 : 1.2, text: 'panel', weight: 700 });
          }
          P.tex('i', 14, yT + bh / 2, { size: 15, color: 'muted', align: 'left' }); P.tex('\\pi(i)', 8, yB + bh / 2, { size: 15, color: 'muted', align: 'left' });
          // graph
          const Q = pen(v, B), W2 = Q.W, H2 = Q.H, g = fitGrid(cyc.length, W2 - 10, H2 - 10, 1, 8, 190);
          cyc.forEach((c, k) => {
            const [gx, gy] = g.at(k), cx = 5 + gx + g.w / 2, cy = 5 + gy + g.h / 2 - 8, L = c.length, col = CAT[k % CAT.length];
            const r = Math.min(g.w, g.h) * 0.36, sp = L === 1 ? 99 : 2 * Math.PI * r / L, nr = Math.min(15, sp * 0.34, r * 0.55 + 3);
            const pos = c.map((_, t) => (L === 1 ? [cx, cy] : L === 2 ? [cx + (t ? r : -r), cy] : [cx + r * Math.sin(2 * Math.PI * t / L), cy - r * Math.cos(2 * Math.PI * t / L)]));
            c.forEach((e, t) => {
              const [x1, y1] = pos[t], [x2, y2] = pos[(t + 1) % L];
              if (L === 1) { Q.circle(x1, y1 - nr - 5, 7, { color: col, width: 2 }); return; }
              const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
              if (L === 2) { const nx = -uy, ny = ux, bx = (x1 + x2) / 2 + nx * r * 0.7, by = (y1 + y2) / 2 + ny * r * 0.7; arrowQuad(Q, x1 + ux * nr * 0.8 + nx * 4, y1 + uy * nr * 0.8 + ny * 4, bx, by, x2 - ux * nr * 0.8 + nx * 4, y2 - uy * nr * 0.8 + ny * 4, { color: col, width: 2 }); return; }
              Q.arrow(x1 + ux * (nr + 1), y1 + uy * (nr + 1), x2 - ux * (nr + 2), y2 - uy * (nr + 2), { color: col, width: 2, head: 7 });
            });
            c.forEach((e, t) => { Q.circle(pos[t][0], pos[t][1], nr, { fill: col, fillAlpha: 0.92, color: col }); Q.text(String(e + 1), pos[t][0], pos[t][1], { align: 'center', size: Math.min(14, nr * 1.15), weight: 700, color: 'panel', halo: false }); });
            Q.text('(' + c.map((e) => e + 1).join(' ') + ')', cx, 5 + gy + g.h - 4, { align: 'center', size: 11.5, color: 'muted', halo: false });
          });
        });
        v.readout(() => {
          const cyc = cyclesOf(w), ty = cycleType(w), fp = ty.filter((x) => x === 1).length;
          return `$\\pi = ${cycTex(cyc)}$ — **${cyc.length}** cycle${cyc.length === 1 ? '' : 's'}, cycle type $(${ty.join(',')})$, ${fp} fixed point${fp === 1 ? '' : 's'}, order $\\operatorname{lcm}=${lcmAll(ty)}$.\n${last}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Counting permutations by number of cycles',
      credit: 'Stirling, 1730 (the unsigned Stirling numbers of the first kind)',
      statement: String.raw`Let $c(n,k)$ be the number of permutations of $[n]$ with exactly $k$ cycles. Then $c(n,k)=c(n-1,k-1)+(n-1)\,c(n-1,k)$ with $c(0,0)=1$, and
$$\sum_{k} c(n,k)\,x^k = x(x+1)(x+2)\cdots(x+n-1).$$
In particular $\sum_k c(n,k)=n!$ and $c(n,k)$ is the coefficient of $x^k$ in the rising factorial $x^{\overline n}$.`,
      idea: String.raw`Build a permutation of $[n]$ from one of $[n-1]$ by deciding where $n$ goes. Either $n$ is a new cycle $(n)$ by itself — cycle count goes up by one — or $n$ is slipped into an existing cycle right after one of the $n-1$ other elements, leaving the cycle count unchanged. Every permutation of $[n]$ arises exactly once (delete $n$ from its cycle), so the sum and product rules (1.1) give the recurrence. Weighting each permutation by $x^{\#\text{cycles}}$, the new-cycle choice contributes a factor $x$ and the $n-1$ insertions contribute $n-1$: the weight is multiplied by $x+(n-1)$ at each step.`,
      caption: String.raw`Slide $n$. The bars tally the cycle counts of all $n!$ permutations of $[n]$ — green is the share coming from "$n$ is a new fixed point", blue the share where $n$ is inserted into an old cycle — and the rings are the coefficients of $x(x+1)\cdots(x+n-1)$. They agree. The right panel takes one sample permutation of $[n-1]$ (press *New sample*) and lists its $n$ children.`,
      deps: ['comb-2.1', 'comb-1.15'],
      refs: ['Stanley EC1 §1.3'],
      tags: ['cycles', 'stirling numbers'],
      viz(v) {
        let seed = 2, sample = [];
        const cache = new Map();
        const stats = (n) => {
          if (cache.has(n)) return cache.get(n);
          const direct = Array(n + 2).fill(0), isNew = Array(n + 2).fill(0), ins = Array(n + 2).fill(0), m = n - 1;
          allPerms(n).forEach((p) => { direct[cycleCount(p)]++; });
          allPerms(m).forEach((p) => {
            const c0 = cycleCount(p); isNew[c0 + 1]++;                       // child: n is a fixed point
            for (let j = 0; j < m; j++) { const q = p.concat([p[j]]); q[j] = m; ins[cycleCount(q)]++; }   // child: n after j
          });
          const r = { direct, isNew, ins, poly: risePoly(n) }; cache.set(n, r); return r;
        };
        const resample = () => { sample = shuffled(v.rng(++seed), nS.value - 1); };
        const nS = v.slider('$n$', 1, 8, 6, { int: true, onChange: resample });
        v.button('New sample', resample);
        resample();
        const A = v.stage({ x: [0, 9], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'number of cycles $k$', title: 'permutations of $[n]$ by number of cycles', weight: 1.1 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, title: 'the $n$ children of one permutation of $[n-1]$' });
        v.legend([['green', '$n$ a new cycle: $c(n-1,k-1)$'], ['blue', '$n$ inserted: $(n-1)\\,c(n-1,k)$'], ['ink', 'coefficient of $x^k$ in $x(x+1)\\cdots(x+n-1)$', { dot: true }]]);
        v.render(() => {
          const n = nS.value, S = stats(n), top = Math.max(...S.direct) * 1.12;
          A.setView([0.2, n + 0.8], [0, top]); A.setTicks(range(n).map((k) => k + 1), null);
          for (let k = 1; k <= n; k++) {
            A.rect(k - 0.36, 0, k + 0.36, S.isNew[k], { fill: 'green', fillAlpha: 0.85, color: 'green', width: 1 });
            A.rect(k - 0.36, S.isNew[k], k + 0.36, S.isNew[k] + S.ins[k], { fill: 'blue', fillAlpha: 0.8, color: 'blue', width: 1 });
            A.dot(k, S.poly[k], { r: 6, hollow: true, color: 'ink' });
            A.text(String(S.direct[k]), k, S.direct[k] + top * 0.04, { align: 'center', size: 11.5, color: 'ink', halo: false });
          }
          // children list
          const P = pen(v, B), W = P.W, m = n - 1, p = sample.slice(0, m);
          const base = cycStr(cyclesOf(p));
          P.text(m ? `sample σ of [${m}]: ${base}  —  ${cycleCount(p)} cycle${cycleCount(p) === 1 ? '' : 's'}` : 'the empty permutation', 12, 16, { size: 12.5, color: 'ink', weight: 600 });
          const kids = [{ lab: `new cycle`, q: p.concat([m]), col: 'green' }];
          for (let j = 0; j < m; j++) { const q = p.concat([p[j]]); q[j] = m; kids.push({ lab: `after ${j + 1}`, q, col: 'blue' }); }
          const rh = Math.min(32, (P.H - 40) / kids.length);
          kids.forEach((kd, i) => {
            const y = 38 + i * rh;
            P.rect(10, y, 78, rh - 5, { fill: kd.col, fillAlpha: 0.85, color: kd.col, r: 5 });
            P.text(kd.lab, 49, y + (rh - 5) / 2, { align: 'center', size: 11.5, color: 'panel', weight: 700, halo: false });
            P.text(cycStr(cyclesOf(kd.q)), 100, y + (rh - 5) / 2, { size: 13.5, color: 'ink', halo: false });
            P.text(`${cycleCount(kd.q)} cycle${cycleCount(kd.q) === 1 ? '' : 's'}`, W - 10, y + (rh - 5) / 2, { align: 'right', size: 11.5, color: kd.col, weight: 600, halo: false });
          });
        });
        v.readout(() => {
          const n = nS.value, S = stats(n), ok = S.direct.slice(1, n + 1).every((c, i) => c === S.poly[i + 1]), tot = S.direct.reduce((a, b) => a + b, 0);
          const rec = S.direct.slice(1, n + 1).every((c, i) => c === S.isNew[i + 1] + S.ins[i + 1]);
          return `$n=${n}$: tally over all $${n}!=${fact(n)}$ permutations, $k=1,\\dots,${n}$: **${S.direct.slice(1, n + 1).join(', ')}** (total ${tot}).\nCoefficients of $x(x+1)\\cdots(x+${n - 1})$: ${S.poly.slice(1, n + 1).join(', ')} — ${ok ? 'identical ✓' : 'MISMATCH'}. New-cycle + inserted children reproduce every bar: ${rec ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Cycle structure of a random permutation',
      statement: String.raw`Let $\pi$ be a uniformly random permutation of $[n]$. Then:
(a) the length of the cycle containing $1$ is uniform on $\{1,\dots,n\}$;
(b) for each $1\le j\le n$ the expected number of cycles of length $j$ is exactly $1/j$ (so a random permutation has about one fixed point, half a transposition, a third of a 3-cycle, …);
(c) the expected number of cycles is the harmonic number $H_n=1+\tfrac12+\cdots+\tfrac1n\approx\ln n+0.577$.`,
      idea: String.raw`For (a) count: the cycle of $1$ has length $\ell$ for exactly $(n-1)(n-2)\cdots(n-\ell+1)\cdot(n-\ell)!=(n-1)!$ permutations — choose, in order, the other $\ell-1$ elements of that cycle, then permute the rest — and $(n-1)!/n!=1/n$ does not depend on $\ell$. For (b), a given $j$-subset can be arranged in a cycle in $(j-1)!$ ways and the other $n-j$ elements permuted in $(n-j)!$ ways, so a fixed $j$-cycle appears with probability $(j-1)!(n-j)!/n!$; multiplying by the $\binom nj$ subsets gives $1/j$ (linearity of expectation). Summing (b) over $j$ gives (c). The recurrence of 2.2 is a second proof of (c): each step adds a cycle with probability $1/i$.`,
      caption: String.raw`Choose $n$ and the number of random permutations to sample. Left: how often the cycle through $1$ has each length — flat, at height $1/n$ (dashed). Middle: average number of cycles of each length against $1/j$. Right: the running average of the number of cycles settles on $H_n$. Press *Resample* for a fresh batch with a new seed.`,
      deps: ['comb-2.2', 'algo-1.14'],
      refs: ['Stanley EC1 §1.3'],
      tags: ['cycles', 'random permutations', 'expectation'],
      viz(v) {
        let seed = 11;
        const nS = v.slider('$n$', 3, 100, 20, { int: true });
        const NS = v.slider('samples', 200, 50000, 5000, { int: true, log: true, sig: 2 });
        v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'length of the cycle containing 1', title: 'cycle through $1$', weight: 1 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'cycle length $j$', title: 'mean number of $j$-cycles', weight: 1 });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'permutations sampled', title: 'running mean of #cycles', weight: 1 });
        let key = '', R = null;
        const run = () => {
          const n = nS.value, N = Math.round(NS.value), k = `${n}|${N}|${seed}`;
          if (k === key) return R; key = k;
          const r = v.rng(seed * 7919 + n), len1 = Array(n + 1).fill(0), cnt = Array(n + 1).fill(0), run = [];
          let tot = 0, tot2 = 0; const step = Math.max(1, Math.floor(N / 160));
          const p = range(n), seen = new Uint8Array(n);
          for (let t = 1; t <= N; t++) {
            for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = p[i]; p[i] = p[j]; p[j] = x; }
            seen.fill(0); let cyc = 0;
            for (let i = 0; i < n; i++) if (!seen[i]) { let L = 0, j = i; while (!seen[j]) { seen[j] = 1; j = p[j]; L++; } cyc++; cnt[L]++; if (i === 0) len1[L]++; }
            tot += cyc; tot2 += cyc * cyc;
            if (t % step === 0 || t === N) run.push([t, tot / t]);
          }
          const mean = tot / N, sd = Math.sqrt(Math.max(0, tot2 / N - mean * mean));
          return (R = { n, N, len1: len1.map((c) => c / N), cnt: cnt.map((c) => c / N), run, mean, se: sd / Math.sqrt(N) });
        };
        v.render(() => {
          const { n, N, len1, cnt, run: rn } = run(), H = harmonic(n), cap = Math.min(n, 30);
          A.setView([0, n + 1], [0, Math.max(2.2 / n, ...len1.slice(1)) * 1.1]); A.setTicks(null, null);
          A.bars(len1.slice(1), { x0: 1, color: 'accent' }); A.hline(1 / n, { color: 'green', dash: true, width: 2 });
          B.setView([0, cap + 1], [0, 1.15]); B.setTicks(null, null);
          B.bars(cnt.slice(1, cap + 1), { x0: 1, color: 'orange' });
          for (let j = 1; j <= cap; j++) B.dot(j, 1 / j, { r: 4.5, hollow: true, color: 'green' });
          C.setView([0, N], [Math.max(0, H - 1.6), H + 1.6]); C.setTicks(null, null);
          C.hline(H, { color: 'green', dash: true, width: 2 }); C.path(rn.map(([t, m]) => [t, m]), { color: 'gold', width: 2.2 });
          C.text(`$H_{${n}}=${v.fix(H, 3)}$`, N * 0.98, H + 0.25, { align: 'right', size: 12, color: 'green' });
        });
        v.legend([['green', 'theory: $1/n$, $1/j$, $H_n$', { dash: true }], ['accent', 'sampled (cycle through 1)'], ['orange', 'sampled (mean count of $j$-cycles)'], ['gold', 'running mean of the number of cycles']]);
        v.readout(() => {
          const { n, N, len1, cnt, mean, se } = run(), H = harmonic(n);
          const spread = Math.max(...len1.slice(1)) - Math.min(...len1.slice(1)), chk = cnt.reduce((a, c, j) => a + c * j, 0);
          return `Mean number of cycles over ${N} samples: **${v.fix(mean, 3)}** ± ${v.fix(se, 3)} (standard error) against $H_{${n}}=${v.fix(H, 3)}$.\nCycle through 1: frequencies between ${v.fix(Math.min(...len1.slice(1)), 4)} and ${v.fix(Math.max(...len1.slice(1)), 4)}, target $1/n=${v.fix(1 / n, 4)}$ (spread ${v.fix(spread, 4)}). Check $\\sum_j j\\cdot(\\text{mean \\# of } j\\text{-cycles})=${v.fix(chk, 3)}$, must be exactly $n=${n}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Fundamental bijection: cycles and records',
      credit: 'Foata, 1965 (the “fundamental transformation”)',
      statement: String.raw`For a permutation $\pi$ of $[n]$, write each cycle with its largest element first, order the cycles by increasing first element, and erase the parentheses. The result is a word $\hat\pi$ — a permutation in one-line notation — and $\pi\mapsto\hat\pi$ is a bijection of $S_n$ onto itself under which **the number of cycles of $\pi$ equals the number of left-to-right maxima ("records") of $\hat\pi$**. The inverse reads the word and opens a new cycle at every record.`,
      idea: String.raw`In the word, the cycle leaders are exactly the left-to-right maxima: leaders increase from cycle to cycle by construction, and every other entry sits in a cycle behind a larger leader. So cutting before each record recovers the cycles, and each cycle is read starting at its maximum, so the construction can be undone. This explains 2.2 at once: the number of words with $k$ records is the number of permutations with $k$ cycles — and one sees directly that a new record can be placed at the end in one way, a non-record in $n-1$ ways.`,
      caption: String.raw`Step through the transformation (or switch direction to go from a word back to cycles): rotate each cycle to start at its maximum, sort the cycles by leader, erase the brackets. Elements keep the colour of the cycle they started in. The right panel plots the final word; gold rings are the records, and the staircase is the running maximum. The readout re-reads the word back into cycles and checks that the original permutation returns.`,
      deps: ['comb-2.1'],
      refs: ['Stanley EC1 §1.3'],
      tags: ['cycles', 'records', 'bijection'],
      viz(v) {
        let seed = 5, p = shuffled(v.rng(seed), 9);
        const nS = v.slider('$n$', 3, 12, 9, { int: true, onChange: () => { p = shuffled(v.rng(++seed), nS.value); rebuild(); } });
        const dir = v.select('direction', [{ value: 'f', label: 'cycles → word' }, { value: 'b', label: 'word → cycles' }], 'f', { onChange: () => rebuild() });
        v.button('New permutation', () => { p = shuffled(v.rng(++seed), nS.value); rebuild(); });
        const layout = (cycs, br) => {
          const pos = Array(p.length), spans = []; let x = 0;
          cycs.forEach((c, i) => {
            if (br) x += 0.2; const x0 = x;
            c.forEach((e) => { pos[e] = x + 0.5; x += 1; });
            if (br) { spans.push([x0, x]); x += 0.2; if (i < cycs.length - 1) x += 0.25; }
          });
          return { pos, spans, total: x };
        };
        const mk = () => {
          const cyc = cyclesOf(p), rot = cyc.map((c) => { const m = c.indexOf(Math.max(...c)); return c.slice(m).concat(c.slice(0, m)); });
          const srt = rot.slice().sort((a, b) => a[0] - b[0]), flat = srt.flat();
          const F = (cs, br, k, note) => ({ ...layout(cs, br), cs, br, k, note });
          const f = [
            F(cyc, true, 0, String.raw`The cycles of $\pi$, each written from its least element, ordered by least element.`),
            F(rot, true, 1, String.raw`Rotate every cycle so that its **largest** element comes first (the *leader*).`),
            F(srt, true, 2, String.raw`Order the cycles by increasing leader.`),
            F([flat], false, 3, String.raw`Erase the parentheses. The leaders are exactly the left-to-right maxima of the word, so every record starts a new cycle when we read back.`),
          ];
          const noteB = [
            String.raw`The word $\hat\pi$, one-line notation.`, String.raw`Mark every left-to-right maximum (record): each opens a new cycle.`,
            String.raw`Bracket the word into cycles, cutting before each record.`, String.raw`Rotate each cycle to start at its least element: this is $\pi$ again.`,
          ];
          const frames = dir.value === 'f' ? f : f.slice().reverse().map((fr, i) => ({ ...fr, note: noteB[i] }));
          const cmap = Array(p.length); cyc.forEach((c, i) => c.forEach((e) => { cmap[e] = i; }));
          return { frames, flat, cmap };
        };
        let M = mk();
        const S = v.steps({ frames: M.frames, start: 0, still: 3, transition: 0.6, speed: 0.8 });
        function rebuild() { M = mk(); S.reset(M.frames, { at: 'start' }); }
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, weight: 1.3, title: '$\\pi$ as cycles, then as a word' });
        const B = v.stage({ x: [0.5, 9.5], y: [0.5, 9.5], axes: 'box', gutter: true, height: 270, xlabel: 'position $i$', title: 'the word $\\hat\\pi$: records', weight: 1 });
        v.render(() => {
          const P = pen(v, A), W = P.W, f = S.frame, g = S.prev || f, tw = S.tween;
          const tot = Math.max(...M.frames.map((fr) => fr.total)), sc = Math.min(54, (W - 20) / tot), x0 = (W - tot * sc) / 2, bh = Math.min(38, sc * 0.85), y = P.H / 2 - bh / 2;
          const fin = M.frames.find((fr) => fr.k === 3), lead = new Set(cyclesOf(p).map((c) => Math.max(...c)));
          const nowF = f.k === 3 || (dir.value === 'b' && f.k >= 1);
          const drawBr = (fr, alpha) => fr.spans.forEach(([a, b]) => {
            const xa = x0 + a * sc, xb = x0 + b * sc;
            P.path([[xa + 5, y - 6], [xa, y - 6], [xa, y + bh + 6], [xa + 5, y + bh + 6]], { color: 'ink', width: 1.8, alpha });
            P.path([[xb - 5, y - 6], [xb, y - 6], [xb, y + bh + 6], [xb - 5, y + bh + 6]], { color: 'ink', width: 1.8, alpha });
          });
          if (g !== f && g.br && tw < 1) drawBr(g, Math.max(0, 1 - tw * 1.6)); if (f.br) drawBr(f, g.br && g !== f ? 1 : Math.min(1, 0.3 + tw));
          p.forEach((_, e) => {
            const xe = x0 + ((1 - tw) * g.pos[e] + tw * f.pos[e] - 0.5) * sc + (sc - bh) / 2 * 0, isLead = lead.has(e) && f.k >= 1, c = CAT[M.cmap[e] % CAT.length];
            letterBox(P, xe + 2, y, sc - 4, bh, e + 1, { fill: c, fillAlpha: 0.9, color: isLead ? 'gold' : c, width: isLead ? 3.2 : 1.2, text: 'panel', weight: 700 });
          });
          P.text(f.k === 0 ? 'cycles (least element first)' : f.k === 1 ? 'rotated: leader = largest' : f.k === 2 ? 'sorted by leader' : 'one-line word (brackets erased)', 12, 20, { size: 13, color: 'muted', weight: 600 });
          if (nowF || f.k === 3) P.text('gold outline = leader = left-to-right maximum', W - 12, H0(P) - 14, { align: 'right', size: 12, color: 'muted', halo: false });
          // B: the word
          const n = p.length, w = M.flat;
          B.setView([0.5, n + 0.5], [0.5, n + 0.5]); B.setTicks(range(n).map((i) => i + 1), range(n).map((i) => i + 1));
          const rec = new Set(lrMaxima(w)), show = f.k === 3 || tw < 1 && g.k === 3;
          const stairs = []; let m = 0; w.forEach((x, i) => { const nm = Math.max(m, x + 1); stairs.push([i + 0.5, nm]); stairs.push([i + 1.5, nm]); m = nm; });
          B.path(stairs, { color: 'gold', width: 1.8, alpha: show ? 0.9 : 0.25 });
          w.forEach((x, i) => { B.dot(i + 1, x + 1, { r: 6.5, color: CAT[M.cmap[x] % CAT.length], hollow: false }); if (rec.has(i)) B.dot(i + 1, x + 1, { r: 11, hollow: true, color: 'gold' }); });
        });
        const H0 = (P) => P.H;
        v.readout(() => {
          const w = M.flat, rec = lrMaxima(w), blocks = []; rec.forEach((s, i) => blocks.push(w.slice(s, rec[i + 1] ?? w.length)));
          const q = Array(w.length); blocks.forEach((b) => b.forEach((e, t) => { q[e] = b[(t + 1) % b.length]; }));
          const back = q.every((x, i) => x === p[i]), k = cycleCount(p);
          return `$\\pi=${cycTex(cyclesOf(p))}$  ↦  $\\hat\\pi = ${wordStr(w)}$.  Cycles of $\\pi$: **${k}**; records of $\\hat\\pi$: **${rec.length}** ${k === rec.length ? '✓' : '✗'}.\nReading $\\hat\\pi$ back (cut before each record, close up each block) gives $\\pi$ again: ${back ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Inversions and the sign of a permutation',
      statement: String.raw`An **inversion** of a permutation $w=w_1w_2\cdots w_n$ is a pair of positions $i<j$ with $w_i>w_j$; write $\operatorname{inv}(w)$ for their number, $0\le\operatorname{inv}(w)\le\binom n2$. The **sign** of $w$ is $\operatorname{sgn}(w)=(-1)^{\operatorname{inv}(w)}$. Swapping two *adjacent* entries changes $\operatorname{inv}$ by exactly $\pm1$, hence flips the sign; and $\operatorname{sgn}(w)=(-1)^{\,n-c(w)}$ where $c(w)$ is the number of cycles of $w$ (viewed as a function).`,
      idea: String.raw`Adjacent swaps: exchanging $w_i,w_{i+1}$ changes the relative order of that one pair only, so $\operatorname{inv}$ goes up or down by one. Every permutation is reached from the identity by adjacent swaps (bubble sort), and the identity has $0$ inversions and $n$ cycles. For the cycle formula: a swap of two entries (in any positions) changes the number of cycles by $\pm1$ — it merges or splits (2.1) — and an arbitrary transposition is an odd number of adjacent ones. So both $(-1)^{\operatorname{inv}}$ and $(-1)^{n-c}$ flip with every swap and agree at the identity: they are equal.`,
      caption: String.raw`Strings join each value on the top row to its position on the bottom row; every **crossing** (red dot) is one inversion. Click two *neighbouring* bottom entries to swap them — the crossing count moves by one, and the walk on the right alternates between even (blue) and odd (orange) levels. The readout compares the sign from inversions with the sign from cycles.`,
      deps: ['comb-2.1'],
      refs: ['Stanley EC1 §1.3'],
      tags: ['inversions', 'sign', 'parity'],
      viz(v) {
        let seed = 8, w = range(7), sel = null, hist = [0];
        { const r = v.rng(21); for (let t = 0; t < 14; t++) { const i = Math.floor(r() * 6); [w[i], w[i + 1]] = [w[i + 1], w[i]]; hist.push(inversions(w)); } }
        const reset = () => { sel = null; hist = [inversions(w)]; };
        const nS = v.slider('$n$', 3, 10, 7, { int: true, onChange: () => { w = shuffled(v.rng(++seed), nS.value); reset(); } });
        const swap = (i) => { [w[i], w[i + 1]] = [w[i + 1], w[i]]; hist.push(inversions(w)); sel = null; };
        v.button('Shuffle', () => { w = shuffled(v.rng(++seed), nS.value); reset(); });
        v.button('Random neighbour swap', () => { const r = v.rng(++seed + hist.length); swap(Math.floor(r() * (nS.value - 1))); });
        v.button('Bubble-sort step', () => { for (let i = 0; i + 1 < w.length; i++) if (w[i] > w[i + 1]) { swap(i); return; } });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.15, title: 'strings between two rows: crossings = inversions' });
        const B = v.stage({ x: [0, 30], y: [0, 10], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'adjacent swaps performed', title: 'number of inversions along the walk' });
        const geom = () => { const n = nS.value, W = A.width, cw = Math.min(56, (W - 24) / n); return { n, cw, x0: (W - n * cw) / 2, bh: Math.min(30, cw * 0.75) }; };
        A.onClick((x, y) => {
          const { n, cw, x0 } = geom(); const [px, py] = toPx(A, x, y);
          const j = Math.floor((px - x0) / cw); if (j < 0 || j >= n || py < A.height * 0.55) return;
          if (sel != null && Math.abs(sel - j) === 1) swap(Math.min(sel, j)); else sel = sel === j ? null : j;
        });
        v.render(() => {
          const { n, cw, x0, bh } = geom(), P = pen(v, A), H = A.height, yT = 40, yB = H - 40 - bh, tx = (val) => x0 + (val + 0.5) * cw, bx = (j) => x0 + (j + 0.5) * cw;
          const y0 = yT + bh, y1 = yB;
          w.forEach((val, j) => P.line(tx(val), y0, bx(j), y1, { color: CAT[val % CAT.length], width: 2.6, alpha: 0.75 }));
          let k = 0;
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (w[i] > w[j]) {
            const a = tx(w[i]), b = tx(w[j]), c = bx(i), d = bx(j), t = (b - a) / ((c - a) - (d - b));
            P.dot(a + (c - a) * t, y0 + (y1 - y0) * t, 5.5, { fill: 'red', color: 'panel', width: 1.2 }); k++;
          }
          for (let val = 0; val < n; val++) letterBox(P, tx(val) - cw / 2 + 2, yT, cw - 4, bh, val + 1, { fill: CAT[val % CAT.length], fillAlpha: 0.9, color: CAT[val % CAT.length], text: 'panel', weight: 700 });
          for (let j = 0; j < n; j++) letterBox(P, x0 + j * cw + 2, yB, cw - 4, bh, w[j] + 1, { fill: CAT[w[j] % CAT.length], fillAlpha: 0.9, color: sel === j ? 'ink' : CAT[w[j] % CAT.length], width: sel === j ? 3 : 1.2, text: 'panel', weight: 700 });
          P.text('top: values  ·  bottom: positions — click two neighbours', 8, H - 12, { size: 12, color: 'muted', align: 'left', halo: false });
          P.text(`${k} crossing${k === 1 ? '' : 's'}`, A.width - 10, H - 12, { size: 13, color: 'red', weight: 700, align: 'right', halo: false });
          // walk
          const mx = n * (n - 1) / 2, view = hist.slice(-31), off = hist.length - view.length;
          B.setView([-0.5, Math.max(10, view.length) - 0.5 + off], [-0.5, Math.min(mx, Math.max(...view) + 3) + 0.5]); B.setTicks(null, null);
          for (let y = 0; y <= mx; y++) B.hband(y - 0.5, y + 0.5, { color: y % 2 ? 'orange' : 'blue', alpha: 0.07 });
          B.path(view.map((h, i) => [i + off, h]), { color: 'muted', width: 1.6 });
          view.forEach((h, i) => B.dot(i + off, h, { r: 5.5, color: h % 2 ? 'orange' : 'blue' }));
        });
        v.legend([['blue', 'even: sign $+1$', { dot: true }], ['orange', 'odd: sign $-1$', { dot: true }], ['red', 'crossing = inversion', { dot: true }]]);
        v.readout(() => {
          const inv = inversions(w), c = cycleCount(w), s1 = sgn(w), s2 = (w.length - c) % 2 ? -1 : 1;
          return `$w=${wordStr(w)}$: $\\operatorname{inv}(w)=${inv}$, so $\\operatorname{sgn}(w)=(-1)^{${inv}}=${s1 > 0 ? '+1' : '-1'}$. Cycles: $c(w)=${c}$, $(-1)^{n-c}=(-1)^{${w.length - c}}=${s2 > 0 ? '+1' : '-1'}$ ${s1 === s2 ? '✓' : '✗'}.\nAfter ${hist.length - 1} adjacent swap${hist.length === 2 ? '' : 's'}: $\\operatorname{inv}\\equiv\\operatorname{inv}_0+${hist.length - 1}\\pmod 2$ ${(hist[0] + hist.length - 1) % 2 === inv % 2 ? '✓' : '✗'} (each swap flips the parity).`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Inversions are counted by the q-factorial',
      credit: 'Rodrigues, 1839 (inversion tables); the q-factorial notation is later',
      statement: String.raw`$$\sum_{w\in S_n} q^{\operatorname{inv}(w)} \;=\; [1]_q\,[2]_q\cdots[n]_q \;=\; [n]_q!,\qquad [m]_q=1+q+\cdots+q^{m-1}.$$
Equivalently, the number of permutations of $[n]$ with exactly $m$ inversions is the coefficient of $q^m$ in $(1)(1+q)(1+q+q^2)\cdots(1+q+\cdots+q^{n-1})$. At $q=1$ this is $n!$.`,
      idea: String.raw`Build $w$ by inserting $1,2,\dots,n$ in turn. When the largest element so far, $i$, is inserted into a word of the smaller ones, it can go in $i$ places, and putting it with exactly $c_i\in\{0,\dots,i-1\}$ of the existing letters to its right creates exactly $c_i$ new inversions and no others (every earlier pair is unaffected). So permutations correspond bijectively to *inversion tables* $(c_1,\dots,c_n)$ with $0\le c_i<i$, and $\operatorname{inv}=\sum c_i$. The sum over independent choices of $q^{\sum c_i}$ factorises by the product rule (1.1) into $\prod_i(1+q+\cdots+q^{i-1})$.`,
      caption: String.raw`Click a cell in each column of the staircase: column $i$ is "where do I insert $i$?", with $c_i$ = how many existing letters lie to its right. The word below is built by those insertions, with $c_i$ printed under each letter. On the right the histogram counts inversions over **all** $n!$ permutations; rings are the coefficients of $[n]_q!$ and the gold bar is the permutation you built.`,
      deps: ['comb-2.5'],
      refs: ['Stanley EC1 §1.3'],
      tags: ['inversions', 'q-analogue', 'generating function'],
      viz(v) {
        let c = [0, 1, 0, 2, 1, 3];
        const nS = v.slider('$n$', 2, 8, 6, { int: true, onChange: () => { c = c.slice(0, nS.value); while (c.length < nS.value) c.push(0); c = c.map((x, i) => Math.min(x, i)); } });
        v.button('Random', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); c = range(nS.value).map((i) => Math.floor(r() * (i + 1))); });
        v.button('Identity', () => { c = range(nS.value).map(() => 0); });
        v.button('Reverse (max)', () => { c = range(nS.value).map((i) => i); });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.05, title: 'inversion table: a staircase of independent choices' });
        const B = v.stage({ x: [0, 28], y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'inversions', title: 'permutations of $[n]$ by inversions' });
        const geom = () => { const n = nS.value, W = A.width, H = A.height, cw = Math.min(52, (W - 30) / n), ch = Math.min(30, (H - 150) / n); return { n, cw, ch, x0: (W - n * cw) / 2, yb: H - 44, W, H }; };
        A.onClick((x, y) => {
          const { n, cw, ch, x0, yb } = geom(); const [px, py] = toPx(A, x, y);
          const i = Math.floor((px - x0) / cw), k = Math.floor((yb - py) / ch);
          if (i >= 0 && i < n && k >= 0 && k <= i) c[i] = k;
        });
        const build = () => { let wd = []; c.forEach((ci, i) => { wd.splice(i - ci, 0, i); }); return wd; };
        const cache = new Map(), tally = (n) => { if (!cache.has(n)) { const t = Array(n * (n - 1) / 2 + 1).fill(0); allPerms(n).forEach((p) => { t[inversions(p)]++; }); cache.set(n, t); } return cache.get(n); };
        v.render(() => {
          const { n, cw, ch, x0, yb, W } = geom(), P = pen(v, A), wd = build();
          wd.forEach((e, t) => { const bw = Math.min(40, (W - 20) / n); letterBox(P, (W - n * bw) / 2 + t * bw + 2, 10, bw - 4, 30, e + 1, { fill: CAT[e % CAT.length], fillAlpha: 0.9, color: CAT[e % CAT.length], text: 'panel', weight: 700 });
            P.text(String(c[e]), (W - n * bw) / 2 + t * bw + bw / 2, 52, { align: 'center', size: 12, color: 'muted', halo: false }); });
          P.tex('c_i', 8, 52, { size: 14, color: 'muted', align: 'left' });
          for (let i = 0; i < n; i++) {
            for (let k = 0; k <= i; k++) {
              const on = c[i] === k, col = CAT[i % CAT.length], fillOn = k <= c[i];
              P.rect(x0 + i * cw + 2, yb - (k + 1) * ch + 1.5, cw - 4, ch - 3, { fill: on ? col : fillOn ? col : 'panel', fillAlpha: on ? 0.95 : fillOn ? 0.22 : 1, color: on ? col : 'faint', width: on ? 2 : 1, r: 3 });
              if (on) P.text(String(k), x0 + (i + 0.5) * cw, yb - (k + 0.5) * ch, { align: 'center', size: 12, color: 'panel', weight: 700, halo: false });
            }
            P.text(`${i + 1}`, x0 + (i + 0.5) * cw, yb + 14, { align: 'center', size: 12.5, color: CAT[i % CAT.length], weight: 700, halo: false });
          }
          P.tex('\\text{insert letter } i \\text{ with } c_i \\text{ letters to its right}', W / 2, yb + 33, { align: 'center', size: 12.5, color: 'muted' });
          const t = tally(n), q = qFactPoly(n), cur = c.reduce((a, b) => a + b, 0), mx = Math.max(...t);
          B.setView([-0.8, t.length - 0.2], [0, mx * 1.15]); B.setTicks(null, null);
          t.forEach((cnt, m) => { B.rect(m - 0.4, 0, m + 0.4, cnt, { fill: m === cur ? 'gold' : 'accent', fillAlpha: m === cur ? 0.95 : 0.55, color: m === cur ? 'gold' : 'accent', width: 1 }); B.dot(m, q[m], { r: 5.5, hollow: true, color: 'ink' }); });
        });
        v.legend([['accent', 'permutations with $m$ inversions (tally)'], ['ink', 'coefficient of $q^m$ in $[n]_q!$', { dot: true }], ['gold', 'your permutation']]);
        v.readout(() => {
          const n = nS.value, t = tally(n), q = qFactPoly(n), wd = build(), cur = c.reduce((a, b) => a + b, 0);
          const ok = t.every((x, i) => x === q[i]);
          return `$w=${wordStr(wd)}$ has $\\operatorname{inv}=${c.join('+')}=${cur}$; recount from the word: ${inversions(wd)} ${inversions(wd) === cur ? '✓' : '✗'}. ${t[cur]} of the ${fact(n)} permutations share this value.\n$[${n}]_q! = ${polyTex(q, { max: 6 })}$; tally over all permutations ${ok ? 'agrees coefficient by coefficient ✓' : 'DISAGREES'}.`;
        });
      },
    },
  ],
};
