// Combinatorics — Chapter 2: Permutations (items 2.7–2.12; 2.1–2.6 are in ch02.js)
import {
  CAT, fact, binom, pen, toPx, fitGrid, allPerms, range, inversions, descentSet, des, maj, wordStr, shuffled,
  intPartitions, polyEval, qBinomPoly, polyTex, letterBox, kSubsets,
} from './ch02.shared.js';

/** Foata's second fundamental transformation, with every intermediate stage kept for the step player. */
function foata(w) {
  const frames = []; let g = [w[0]];
  frames.push({ k: 0, phase: 'init', g: g.slice(), x: w[0], cuts: [], ng: g.slice(), blocks: [g.slice()], note: String.raw`Start with the working word $\gamma=w_1$. Letters of $w$ are fed in one at a time.` });
  for (let k = 1; k < w.length; k++) {
    const x = w[k], last = g[g.length - 1], big = last > x, blocks = []; let cur = [], cuts = [];
    g.forEach((e, i) => { cur.push(e); if (big ? e > x : e < x) { blocks.push(cur); cuts.push(i); cur = []; } });
    if (cur.length) blocks.push(cur);
    const ng = blocks.flatMap((b) => [b[b.length - 1], ...b.slice(0, -1)]).concat([x]);
    frames.push({ k, phase: 'cut', g: g.slice(), x, big, cuts, blocks, ng, note: `New letter $x=${x + 1}$. The last letter of $\\gamma$ is ${last + 1}, ${big ? 'larger' : 'smaller'} than $x$, so cut after every letter ${big ? 'larger' : 'smaller'} than ${x + 1} (red bars).` });
    g = ng;
    frames.push({ k, phase: 'rot', g: g.slice(), x, big, cuts, blocks, ng: g.slice(), note: `Rotate each block (its last letter, in teal, goes to the front) and append $x=${x + 1}$. Now $\\operatorname{inv}(\\gamma)=\\operatorname{maj}(w_1\\cdots w_${k + 1})=${maj(w.slice(0, k + 1))}$.` });
  }
  return { frames, image: g };
}

export default {
  collection: 'comb',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Descents and Eulerian numbers',
      credit: 'Euler, 1755 (the numbers); MacMahon later named the statistics',
      statement: String.raw`A **descent** of a permutation $w=w_1\cdots w_n$ is a position $i$ with $w_i>w_{i+1}$; $\operatorname{des}(w)$ is their number, $0\le \operatorname{des}(w)\le n-1$. The **Eulerian number** $A(n,k)$ is the number of permutations of $[n]$ with exactly $k$ descents. They satisfy $A(n,k)=(k+1)\,A(n-1,k)+(n-k)\,A(n-1,k-1)$, the symmetry $A(n,k)=A(n,n-1-k)$, and $\sum_k A(n,k)=n!$. (An *ascent* is a position with $w_i<w_{i+1}$.)`,
      idea: String.raw`Insert $n$ into a permutation of $[n-1]$ in one of the $n$ gaps. Inserting into a descent gap, or at the very end, leaves the number of descents unchanged; inserting into an ascent gap or at the very front adds one. A permutation with $k$ descents has $k$ descent gaps plus the end gap, $k+1$ unchanged-count choices, and $n-1-k$ ascent gaps plus the front, $n-k$ count-raising choices — hence the recurrence. The symmetry comes from complementing every entry ($w_i\mapsto n+1-w_i$), which turns descents into ascents (1.1: a bijection preserves counts).`,
      caption: String.raw`Left: a permutation as a mountain range — descents are the red downhill segments. Click two points to swap their heights (or use the buttons). Right: the Eulerian triangle, filled by actually tallying every permutation of each size up to $n$; the gold cell is where your permutation lives. Notice the mirror symmetry and that each entry is built from its two parents by the weights $(k+1)$ and $(n-k)$.`,
      deps: ['comb-2.1'],
      refs: ['Stanley EC1 §1.4'],
      tags: ['descents', 'eulerian numbers'],
      viz(v) {
        let seed = 6, w = shuffled(v.rng(seed), 6), sel = null;
        const nS = v.slider('$n$', 2, 8, 6, { int: true, onChange: () => { w = shuffled(v.rng(++seed), nS.value); sel = null; } });
        v.button('Random', () => { w = shuffled(v.rng(++seed), nS.value); sel = null; });
        v.button('Sort up (0 descents)', () => { w = range(nS.value); sel = null; });
        v.button('Sort down (max)', () => { w = range(nS.value).reverse(); sel = null; });
        const A = v.stage({ x: [0.4, 6.6], y: [0.4, 6.6], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'position $i$', ylabel: '$w_i$', title: 'mountain range of $w$ (click two points to swap)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.1, title: 'Eulerian triangle $A(m,k)$, tallied over all $m!$ permutations' });
        const cache = new Map();
        const row = (m) => { if (!cache.has(m)) { const r = Array(m).fill(0); allPerms(m).forEach((p) => { r[des(p)]++; }); cache.set(m, r); } return cache.get(m); };
        A.onClick((x, y) => {
          const n = nS.value, i = Math.round(x) - 1; if (i < 0 || i >= n) return;
          if (sel == null) sel = i; else { if (sel !== i) [w[sel], w[i]] = [w[i], w[sel]]; sel = null; }
        });
        v.render(() => {
          const n = nS.value, d = descentSet(w);
          A.setView([0.4, n + 0.6], [0.4, n + 0.6]); A.setTicks(range(n).map((i) => i + 1), range(n).map((i) => i + 1));
          for (let i = 0; i + 1 < n; i++) A.line(i + 1, w[i] + 1, i + 2, w[i + 1] + 1, { color: w[i] > w[i + 1] ? 'red' : 'blue', width: w[i] > w[i + 1] ? 3.4 : 2.4, alpha: w[i] > w[i + 1] ? 1 : 0.8 });
          d.forEach((i) => A.text('↓', i + 1.5, (w[i] + w[i + 1]) / 2 + 1.35, { align: 'center', size: 13, color: 'red', halo: false }));
          w.forEach((x, i) => A.dot(i + 1, x + 1, { r: sel === i ? 9 : 6.5, color: sel === i ? 'gold' : 'ink' }));
          const P = pen(v, B), W = P.W, H = P.H, N = n, cw = Math.min(60, (W - 60) / N), rh = Math.min(46, (H - 20) / N), cx = W / 2 + 14, y0 = 12;
          P.line(cx, y0 - 4, cx, y0 + N * rh + 2, { color: 'muted', width: 1, dash: true, alpha: 0.6 });
          for (let m = 1; m <= N; m++) {
            const r = row(m), mx = Math.max(...r), yy = y0 + (m - 1) * rh;
            P.text(`${m}`, 12, yy + rh / 2, { size: 12, color: 'muted', halo: false, align: 'left' });
            r.forEach((a, k) => {
              const xx = cx + (k - (m - 1) / 2) * cw, cur = m === N && k === d.length;
              P.rect(xx - cw / 2 + 2, yy + 2, cw - 4, rh - 4, { fill: cur ? 'gold' : 'accent', fillAlpha: cur ? 0.95 : 0.1 + 0.55 * a / mx, color: cur ? 'gold' : 'faint', width: 1, r: 4 });
              P.text(String(a), xx, yy + rh / 2, { align: 'center', size: Math.min(14, cw * 0.32), weight: cur ? 700 : 500, color: cur ? 'panel' : 'ink', halo: false });
            });
          }
          P.tex('m', 12, H - 12, { size: 13, color: 'muted', align: 'left' });
        });
        v.legend([['red', 'descent', { dot: true }], ['blue', 'ascent', { dot: true }], ['gold', 'cell of your permutation', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, d = descentSet(w), okRec = (() => { for (let m = 2; m <= n; m++) { const a = row(m), b = row(m - 1); for (let k = 0; k < m; k++) if (a[k] !== (k + 1) * (b[k] ?? 0) + (m - k) * (k ? b[k - 1] : 0)) return false; } return true; })();
          const r = row(n), sym = r.every((x, k) => x === r[n - 1 - k]);
          return `$w=${wordStr(w)}$ has $\\operatorname{des}(w)=${d.length}$ (descents at positions ${d.length ? d.map((i) => i + 1).join(', ') : 'none'}); there are $A(${n},${d.length})=${r[d.length]}$ such permutations among ${fact(n)}.\nRow ${n}: ${r.join(', ')}  (sum ${r.reduce((a, b) => a + b, 0)}). Symmetric: ${sym ? '✓' : '✗'}.  Recurrence $A(m,k)=(k+1)A(m-1,k)+(m-k)A(m-1,k-1)$ holds in every tallied entry: ${okRec ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'MacMahon: major index and inversions are equidistributed',
      credit: 'MacMahon, 1913; the bijection by Foata, 1968',
      statement: String.raw`For a permutation $w$ let $\operatorname{maj}(w)=\sum_{i:\,w_i>w_{i+1}} i$ be the **major index** (the sum of the descent positions). Then for every $n$ and $m$, the number of permutations of $[n]$ with $\operatorname{maj}=m$ equals the number with $\operatorname{inv}=m$:
$$\sum_{w\in S_n}q^{\operatorname{maj}(w)}=\sum_{w\in S_n}q^{\operatorname{inv}(w)}=[n]_q!.$$
Moreover there is an explicit bijection $\phi:S_n\to S_n$ (Foata's) with $\operatorname{inv}(\phi(w))=\operatorname{maj}(w)$.`,
      idea: String.raw`By 2.6 the right-hand side is already known. For the major index one builds $w$ letter by letter and tracks how $\operatorname{maj}$ grows; Foata's map does this concretely. Process $w_1,w_2,\dots$ and keep a word $\gamma$. To append $x=w_k$: cut $\gamma$ after each letter greater than $x$ if its last letter exceeds $x$, otherwise after each letter smaller than $x$; in each block move the last letter to the front; then append $x$. The rule is arranged so that, by induction on $k$, the working word satisfies $\operatorname{inv}(\gamma_k)=\operatorname{maj}(w_1\cdots w_k)$: appending $x$ must raise the right-hand side by $k-1$ when $w_{k-1}>w_k$ and by $0$ otherwise, and the rotations are exactly what makes the left-hand side do the same. Every step can be undone (the last letters of $\gamma$ and the final $x$ tell which cut rule was used), so $\phi$ is a bijection.`,
      caption: String.raw`Left: both statistics tallied over every permutation of $[n]$ — bars are $\operatorname{inv}$, rings are $\operatorname{maj}$. They agree bar by bar. Right: Foata's map on one permutation, step by step. For each new letter $x$ (gold) the word built so far is cut (red bars), each block rotated (its last letter, shown in teal, jumps to the front) and $x$ is appended. Press *New permutation* for another example.`,
      deps: ['comb-2.6', 'comb-2.7'],
      refs: ['Stanley EC1 §1.4'],
      tags: ['major index', 'inversions', 'equidistribution'],
      viz(v) {
        let seed = 3, w = shuffled(v.rng(seed), 5);
        const nS = v.slider('$n$', 3, 8, 5, { int: true, onChange: () => { w = shuffled(v.rng(++seed), nS.value); rebuild(); } });
        v.button('New permutation', () => { w = shuffled(v.rng(++seed), nS.value); rebuild(); });
        let F = foata(w);
        const S = v.steps({ frames: F.frames, start: 0, still: F.frames.length - 1, speed: 1.2, note: true });
        function rebuild() { F = foata(w); S.reset(F.frames, { at: 'start' }); }
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'statistic value $m$', title: 'inversions (bars) and major index (rings)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.15, title: 'Foata’s map $w\\mapsto\\phi(w)$' });
        const cache = new Map(), tally = (n) => {
          if (!cache.has(n)) { const L = n * (n - 1) / 2 + 1, a = Array(L).fill(0), b = Array(L).fill(0), seen = new Set(); allPerms(n).forEach((p) => { a[inversions(p)]++; b[maj(p)]++; seen.add(foata(p).image.join()); }); cache.set(n, { a, b, img: seen.size }); }
          return cache.get(n);
        };
        v.render(() => {
          const n = nS.value, { a, b } = tally(n), mx = Math.max(...a);
          A.setView([-0.8, a.length - 0.2], [0, mx * 1.15]); A.setTicks(null, null);
          a.forEach((c, m) => { A.rect(m - 0.4, 0, m + 0.4, c, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }); A.dot(m, b[m], { r: 5.5, hollow: true, color: 'orange' }); });
          A.dot(maj(w), 0, { r: 7, color: 'gold' });
          const P = pen(v, B), W = P.W, f = S.frame, bw = Math.min(42, (W - 70) / n), x0 = 60 + (W - 70 - n * bw) / 2, bh = Math.min(34, bw * 0.85);
          const rowW = (y, lab, arr, st) => { P.tex('w', 10, y + bh / 2, { size: 15, color: 'muted', align: 'left' }); arr.forEach((e, i) => st(e, i, x0 + i * bw + 2, y)); };
          // input
          rowW(26, '', w, (e, i, x, y) => letterBox(P, x, y, bw - 4, bh, e + 1, { fill: i <= f.k ? CAT[e % CAT.length] : 'panel', fillAlpha: i <= f.k ? 0.9 : 1, color: i === f.k ? 'gold' : i < f.k ? CAT[e % CAT.length] : 'faint', width: i === f.k ? 3.4 : 1.2, text: i <= f.k ? 'panel' : 'faint', weight: 700 }));
          const y2 = P.H / 2 - bh / 2;
          if (f.phase === 'init') {
            P.tex('\\gamma', 8, y2 + bh / 2, { size: 15, color: 'muted', align: 'left' });
            letterBox(P, x0 + 2, y2, bw - 4, bh, w[0] + 1, { fill: CAT[w[0] % CAT.length], fillAlpha: 0.9, color: CAT[w[0] % CAT.length], text: 'panel', weight: 700 });
          } else if (f.phase === 'cut') {
            P.tex('\\gamma', 8, y2 + bh / 2, { size: 15, color: 'muted', align: 'left' });
            f.g.forEach((e, i) => letterBox(P, x0 + i * bw + 2, y2, bw - 4, bh, e + 1, { fill: CAT[e % CAT.length], fillAlpha: 0.9, color: CAT[e % CAT.length], text: 'panel', weight: 700 }));
            f.cuts.forEach((i) => P.line(x0 + (i + 1) * bw, y2 - 8, x0 + (i + 1) * bw, y2 + bh + 8, { color: 'red', width: 3 }));
            letterBox(P, x0 + f.g.length * bw + 2, y2, bw - 4, bh, f.x + 1, { fill: 'panel', color: 'gold', width: 3.4, text: 'ink', weight: 700 });
          } else {
            P.tex('\\gamma', 8, y2 + bh / 2, { size: 15, color: 'muted', align: 'left' });
            let pos = 0;
            f.blocks.forEach((blk) => {
              const x1 = x0 + pos * bw;
              P.rect(x1 + 0.5, y2 - 6, blk.length * bw - 1, bh + 12, { color: 'faint', width: 1.2, r: 6, dash: true });
              [blk[blk.length - 1], ...blk.slice(0, -1)].forEach((e, t) => { letterBox(P, x1 + t * bw + 2, y2, bw - 4, bh, e + 1, { fill: CAT[e % CAT.length], fillAlpha: 0.9, color: t === 0 && blk.length > 1 ? 'teal' : CAT[e % CAT.length], width: t === 0 && blk.length > 1 ? 3.4 : 1.2, text: 'panel', weight: 700 }); });
              pos += blk.length;
            });
            letterBox(P, x0 + pos * bw + 2, y2, bw - 4, bh, f.x + 1, { fill: CAT[f.x % CAT.length], fillAlpha: 0.9, color: 'gold', width: 3.4, text: 'panel', weight: 700 });
          }
          // result
          const done = S.i === S.n - 1, res = F.image;
          P.tex('\\phi(w)', 8, P.H - 46 + bh / 2, { size: 14, color: done ? 'green' : 'faint', align: 'left' });
          res.forEach((e, i) => letterBox(P, x0 + i * bw + 2, P.H - 46, bw - 4, bh, e + 1, { fill: done ? CAT[e % CAT.length] : 'panel', fillAlpha: done ? 0.9 : 1, color: done ? 'green' : 'faint', width: done ? 2.4 : 1, text: done ? 'panel' : 'faint', weight: 700 }));
        });
        v.legend([['accent', '$\\#\\{w:\\operatorname{inv}(w)=m\\}$'], ['orange', '$\\#\\{w:\\operatorname{maj}(w)=m\\}$', { dot: true }], ['gold', '$\\operatorname{maj}$ of your $w$', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, { a, b, img } = tally(n), same = a.every((x, i) => x === b[i]), im = F.image;
          return `Over all ${fact(n)} permutations of $[${n}]$: the lists $(\\#\\operatorname{inv}=m)$ and $(\\#\\operatorname{maj}=m)$ are ${same ? 'identical ✓' : 'DIFFERENT'}: ${a.join(', ')}.\n$w=${wordStr(w)}$: $\\operatorname{maj}(w)=${maj(w)}$; $\\phi(w)=${wordStr(im)}$ has $\\operatorname{inv}=${inversions(im)}$ ${inversions(im) === maj(w) ? '✓' : '✗'}.  $\\phi$ takes ${img} distinct values on ${fact(n)} inputs ${img === fact(n) ? '(a bijection) ✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Gaussian (q-binomial) coefficients',
      credit: 'Gauss, 1811',
      statement: String.raw`The **Gaussian binomial coefficient** is the polynomial
$$\binom nk_q=\frac{[n]_q!}{[k]_q!\,[n-k]_q!}=\prod_{i=0}^{k-1}\frac{1-q^{\,n-i}}{1-q^{\,i+1}}\in\mathbb Z[q],\qquad 0\le k\le n.$$
It satisfies $\binom nk_q=\binom{n-1}{k-1}_q+q^k\binom{n-1}{k}_q$, has degree $k(n-k)$, palindromic non-negative integer coefficients, and the coefficient of $q^m$ is the number of partitions of $m$ that fit inside a $k\times(n-k)$ box. At $q=1$ it equals the ordinary $\binom nk$.`,
      idea: String.raw`The quotient is a polynomial because the $q$-Pascal rule — checked by putting both sides over a common denominator — builds it from $\binom{n}{0}_q=\binom nn_q=1$ by additions and multiplications by $q^k$ alone, and the product form follows by induction. Combinatorially, a $k$-subset $\{a_1<\dots<a_k\}$ of $[n]$ weighted by $q^{\sum(a_i-i)}$ is a partition in the $k\times(n-k)$ box (the lattice path of the subset, as in 1.10, bounds its Ferrers diagram), which is why the coefficients are non-negative and palindromic: complementing the box exchanges a partition with its complement. Letting $q\to1$ turns each $[m]_q$ into $m$ and recovers $\binom nk$.`,
      caption: String.raw`Choose $n$ and $k$. Left: the coefficients of $\binom nk_q$ as a symmetric bar chart; click a bar to see, in the middle, every partition of that size drawn as a Ferrers diagram in the $k\times(n-k)$ box. Right: the polynomial evaluated at $q$; slide $q$ to $1$ (green dashed line) where it meets the ordinary binomial coefficient.`,
      deps: ['comb-1.6', 'comb-2.6'],
      refs: ['Aigner ch. 1'],
      tags: ['q-analogue', 'binomial coefficients', 'partitions'],
      viz(v) {
        let sel = 4;
        const nS = v.slider('$n$', 1, 10, 6, { int: true, onChange: () => { if (kS.value > nS.value) kS.set(nS.value); } });
        const kS = v.slider('$k$', 0, 10, 3, { int: true, onChange: () => { if (kS.value > nS.value) kS.set(nS.value); } });
        const qS = v.slider('$q$', 0, 2, 0.5, { step: 0.01 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'power $m$ of $q$', title: 'coefficients of $\\binom nk_q$ (click a bar)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1, title: 'partitions of $m$ in the box' });
        const C = v.stage({ x: [0, 2], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$q$', title: '$\\binom nk_q$ as a function of $q$' });
        const K = () => Math.min(kS.value, nS.value);
        A.onClick((x) => { const L = K() * (nS.value - K()); const m = Math.round(x); if (m >= 0 && m <= L) sel = m; });
        v.render(() => {
          const n = nS.value, k = K(), c = qBinomPoly(n, k), L = k * (n - k), q = qS.value; sel = Math.min(sel, L);
          const mx = Math.max(...c);
          A.setView([-0.8, L + 0.8], [0, mx * 1.18]); A.setTicks(null, null);
          c.forEach((a, m) => { A.rect(m - 0.4, 0, m + 0.4, a, { fill: m === sel ? 'gold' : 'accent', fillAlpha: m === sel ? 0.95 : 0.6, color: m === sel ? 'gold' : 'accent', width: 1 }); if (L < 22) A.text(String(a), m, a + mx * 0.05, { align: 'center', size: 11.5, color: 'ink', halo: false }); });
          // gallery
          const P = pen(v, B), parts = intPartitions(sel, n - k).filter((p) => p.length <= k);
          P.text(`${parts.length} partition${parts.length === 1 ? '' : 's'} of ${sel} in a ${k} × ${n - k} box`, 10, 16, { size: 12.5, color: 'ink', weight: 600 });
          if (L === 0) P.text('box is empty', P.W / 2, P.H / 2, { align: 'center', size: 13, color: 'muted' });
          else {
            const g = fitGrid(parts.length, P.W - 16, P.H - 40, k / (n - k), 7, 80), qc = g.w / (n - k);
            parts.forEach((p, i) => {
              const [gx, gy] = g.at(i), X = 8 + gx, Y = 32 + gy;
              P.rect(X, Y, g.w, g.h, { color: 'faint', width: 1, fill: 'panel' });
              p.forEach((len, r) => { for (let j = 0; j < len; j++) P.rect(X + j * qc + 0.5, Y + r * qc + 0.5, qc - 1, qc - 1, { fill: 'gold', fillAlpha: 0.9, color: 'gold', width: 0.5 }); });
            });
          }
          // evaluation curve
          const top = Math.max(binom(n, k) * 1.3, polyEval(c, 2) * 0.5, 2);
          C.setView([0, 2], [0, Math.min(top, Math.max(binom(n, k) * 2.2, 3))]); C.setTicks(null, null);
          C.fn((t) => polyEval(c, t), { color: 'accent', width: 2.6, domain: [0, 2] });
          C.hline(binom(n, k), { color: 'green', dash: true, width: 1.8 }); C.vline(1, { color: 'green', dash: true, width: 1.2, alpha: 0.6 });
          C.dot(1, binom(n, k), { r: 6, color: 'green' }); C.dot(q, polyEval(c, q), { r: 7, color: 'gold' });
          C.text(`$\\binom{${n}}{${k}}=${binom(n, k)}$`, 1.04, binom(n, k), { size: 12, color: 'green', dx: 4, dy: -10, halo: true });
        });
        v.readout(() => {
          const n = nS.value, k = K(), c = qBinomPoly(n, k), q = qS.value, val = polyEval(c, q);
          let prod = 1; for (let i = 0; i < k; i++) prod *= Math.abs(q - 1) < 1e-9 ? (n - i) / (i + 1) : (1 - q ** (n - i)) / (1 - q ** (i + 1));
          const sum = c.reduce((a, b) => a + b, 0), pal = c.every((x, i) => x === c[c.length - 1 - i]);
          return `$\\binom{${n}}{${k}}_q = ${polyTex(c, { max: 6 })}$ (degree ${c.length - 1}). At $q=${v.fix(q, 2)}$: polynomial $=${v.fix(val, 4)}$, product formula $=${v.fix(prod, 4)}$ ${Math.abs(val - prod) < 1e-6 * Math.max(1, Math.abs(val)) ? '✓' : '✗'}.\nCoefficient sum $=${sum}=\\binom{${n}}{${k}}$ ${sum === binom(n, k) ? '✓' : '✗'}; palindromic ${pal ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'q-binomials count subspaces over a finite field',
      statement: String.raw`Let $q$ be a prime power and $\mathbb F_q$ the field with $q$ elements. The number of $k$-dimensional subspaces of $\mathbb F_q^{\,n}$ is exactly the Gaussian binomial coefficient evaluated at $q$:
$$\#\{U\le\mathbb F_q^n:\dim U=k\}=\binom nk_q.$$
Each subspace has a unique basis in reduced row echelon form; the coefficient of $q^m$ in $\binom nk_q$ counts the pivot patterns with exactly $m$ free entries.`,
      idea: String.raw`Count ordered bases instead: a $k$-tuple of independent vectors in $\mathbb F_q^n$ can be chosen in $(q^n-1)(q^n-q)\cdots(q^n-q^{k-1})$ ways (each new vector avoids the span of the previous ones, which has $q^{i}$ elements), and each $k$-dimensional space has $(q^k-1)\cdots(q^k-q^{k-1})$ ordered bases. The quotient is the product formula of 2.9 at $q$. Second proof, which also explains the *coefficients*: row reduction sends a subspace to a unique echelon matrix; fixing the pivot columns $p_1<\dots<p_k$ leaves $m=\sum_i(n-p_i-(k-i))$ free entries (those right of a pivot and not in a pivot column), each arbitrary in $\mathbb F_q$, so that pivot pattern carries $q^m$ subspaces. Summing over patterns gives $\sum_m(\#\text{patterns with }m\text{ free})\,q^m=\binom nk_q$.`,
      caption: String.raw`Every little square is one subspace, grouped (same colour) by pivot columns; counts are exact. Press *Sample* to draw random independent $k$-tuples of vectors and reduce each to echelon form: the square it lands on lights up. Dependent tuples are discarded. The right panel compares how often each pivot pattern was hit with its predicted share $q^{m}/\binom nk_q$ — uniform over subspaces means a pattern with $m$ free entries is hit in proportion to $q^m$.`,
      deps: ['comb-2.9', 'ladr-2.34'],
      refs: ['Stanley EC1 §1.10'],
      tags: ['finite fields', 'subspaces', 'q-analogue'],
      viz(v) {
        let seed = 17, tries = 0, dep = 0, found = null, hits = null, E = null;
        const qS = v.select('field', [{ value: 2, label: '$\\mathbb F_2$' }, { value: 3, label: '$\\mathbb F_3$' }], 2, { onChange: () => reset() });
        const nS = v.slider('$n$', 2, 6, 5, { int: true, onChange: () => reset() });
        const kS = v.slider('$k$', 1, 5, 2, { int: true, onChange: () => reset() });
        v.button('Sample 20', () => sample(20)); v.button('Sample 300', () => sample(300)); v.button('Clear', () => reset(true));
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, title: 'all $k$-dimensional subspaces, one square each' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'pivot columns (patterns sorted by number of free entries)', title: 'share of samples landing in each pivot pattern' });
        const modinv = (a, q) => { for (let x = 1; x < q; x++) if ((a * x) % q === 1) return x; return 0; };
        function enumerate(q, n, k) {
          const pats = [], subs = [], index = new Map();
          kSubsets(n, k).forEach((piv) => {
            const free = []; piv.forEach((p, r) => { for (let c = p + 1; c < n; c++) if (!piv.includes(c)) free.push([r, c]); });
            pats.push({ piv, free: free.length, name: piv.map((x) => x + 1).join(''), start: 0, size: q ** free.length });
          });
          pats.sort((a, b) => a.free - b.free || (a.name < b.name ? -1 : 1));
          pats.forEach((pt, gi) => {
            pt.start = subs.length; const free = []; pt.piv.forEach((p, r) => { for (let c = p + 1; c < n; c++) if (!pt.piv.includes(c)) free.push([r, c]); });
            for (let code = 0; code < pt.size; code++) {
              const M = pt.piv.map((p) => { const row = Array(n).fill(0); row[p] = 1; return row; }); let t = code;
              free.forEach(([r, c]) => { M[r][c] = t % q; t = Math.floor(t / q); });
              index.set(M.map((r) => r.join('')).join('|'), subs.length); subs.push(gi);
            }
          });
          return { pats, subs, index, total: subs.length };
        }
        function rref(M, q) {
          const A2 = M.map((r) => r.slice()), n = A2[0].length; let r = 0;
          for (let c = 0; c < n && r < A2.length; c++) {
            let p = r; while (p < A2.length && A2[p][c] === 0) p++;
            if (p === A2.length) continue;
            [A2[r], A2[p]] = [A2[p], A2[r]]; const iv = modinv(A2[r][c], q); A2[r] = A2[r].map((x) => (x * iv) % q);
            for (let i = 0; i < A2.length; i++) if (i !== r && A2[i][c]) { const f = A2[i][c]; A2[i] = A2[i].map((x, j) => (((x - f * A2[r][j]) % q) + q) % q); }
            r++;
          }
          return { M: A2, rank: r };
        }
        function reset(keep) {
          const q = qS.value, n = Math.min(nS.value, q === 3 ? 5 : 6), k = Math.min(kS.value, n);
          if (n !== nS.value) nS.set(n); if (k !== kS.value) kS.set(k);
          E = enumerate(q, n, k); found = new Uint8Array(E.total); hits = Array(E.pats.length).fill(0); tries = 0; dep = 0;
          if (!keep) sample(120);
        }
        function sample(N) {
          const q = qS.value, n = nS.value, k = kS.value, r = v.rng(++seed * 31 + tries);
          for (let t = 0; t < N; t++) {
            const M = range(k).map(() => range(n).map(() => Math.floor(r() * q))); tries++;
            const R = rref(M, q); if (R.rank < k) { dep++; continue; }
            const id = E.index.get(R.M.map((x) => x.join('')).join('|')); found[id] = 1; hits[E.subs[id]]++;
          }
        }
        reset();
        v.render(() => {
          const q = qS.value, n = nS.value, k = kS.value, P = pen(v, A), tot = E.total, W = P.W, H = P.H;
          const g = fitGrid(tot, W - 16, H - 34, 1, 1.5, 22, 'top'); const cell = g.w;
          E.subs.forEach((gi, i) => { const [x, y] = g.at(i), col = CAT[gi % CAT.length]; P.rect(8 + x, 28 + y, cell, cell, { fill: found[i] ? col : 'faint', fillAlpha: found[i] ? 0.95 : 0.16 }); });
          P.text(`${tot} subspaces; ${found.reduce((a, b) => a + b, 0)} found in ${tries - dep} samples`, 8, 14, { size: 12.5, color: 'ink', weight: 600 });
          const tl = hits.reduce((a, b) => a + b, 0) || 1, ng = E.pats.length;
          B.setView([-0.8, ng - 0.2], [0, Math.max(...E.pats.map((p) => p.size / tot), ...hits.map((h) => h / tl)) * 1.2]); B.setTicks(range(ng).filter((i) => ng <= 12 || i % 3 === 0).map((i) => [i, E.pats[i].name]), null);
          E.pats.forEach((pt, i) => { B.rect(i - 0.38, 0, i + 0.38, hits[i] / tl, { fill: CAT[i % CAT.length], fillAlpha: 0.8, color: CAT[i % CAT.length], width: 1 }); B.dot(i, pt.size / tot, { r: 5, hollow: true, color: 'ink' }); });
        });
        v.legend([['muted', 'observed share of samples (colour = pivot pattern)'], ['ink', 'predicted: $q^m/\\binom nk_q$', { dot: true }]]);
        v.readout(() => {
          const q = qS.value, n = nS.value, k = kS.value, c = qBinomPoly(n, k), val = polyEval(c, q);
          let num = 1, den = 1; for (let i = 0; i < k; i++) { num *= q ** n - q ** i; den *= q ** k - q ** i; }
          const byFree = {}; E.pats.forEach((p) => { byFree[p.free] = (byFree[p.free] || 0) + 1; });
          const coef = c.map((_, m) => byFree[m] || 0), ok = coef.every((x, i) => x === c[i]);
          return `Enumerated echelon matrices over $\\mathbb F_${q}$: **${E.total}** subspaces. $\\binom{${n}}{${k}}_{${q}}=${polyTex(c, { max: 5 })}\\big|_{q=${q}}=${val}$ ${val === E.total ? '✓' : '✗'}; ordered-bases count $\\prod(q^n-q^i)/\\prod(q^k-q^i)=${num / den}$ ${num / den === E.total ? '✓' : '✗'}.\nPatterns with $m$ free entries: ${coef.join(', ')} — the coefficients of $\\binom{${n}}{${k}}_q$ ${ok ? '✓' : '✗'}. Dependent tuples discarded: ${dep} of ${tries}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Definition',
      name: 'Involutions',
      statement: String.raw`An **involution** is a permutation $\pi$ with $\pi\circ\pi=\mathrm{id}$. Equivalently every cycle has length 1 or 2, equivalently $\pi$ is a *matching*: some pairs $\{i,j\}$ are joined by an arc and the rest of $[n]$ are fixed points; equivalently its permutation matrix is symmetric. The number $a_n$ of involutions of $[n]$ satisfies
$$a_n=a_{n-1}+(n-1)\,a_{n-2},\quad a_0=a_1=1,\qquad a_n=\sum_{j\ge0}\frac{n!}{2^j\,j!\,(n-2j)!},$$
so $a_0,a_1,\dots=1,1,2,4,10,26,76,232,\dots$.`,
      idea: String.raw`The condition $\pi^2=\mathrm{id}$ forces every orbit of $i\mapsto\pi(i)$ to have size dividing $2$ (2.1). For the recurrence, look at the point $n$: either it is fixed, leaving an involution of $[n-1]$ ($a_{n-1}$ ways), or it is joined to one of the other $n-1$ points, leaving an involution of the remaining $n-2$ points ($(n-1)a_{n-2}$ ways) — sum and product rules (1.1). The sum counts instead the involutions with exactly $j$ pairs: choose $2j$ points, split them into $j$ unordered pairs, which is $\frac{(2j)!}{2^jj!}$ ways.`,
      caption: String.raw`Click a point and then another to join them by an arc (click a joined point twice to release it); points without an arc are fixed. Every involution of $[n]$ appears once in the gallery on the right, grouped by what happens to $n$: fixed (blue group) or joined to $j$ (orange groups) — the group sizes are the two terms of the recurrence. Yours is outlined in gold.`,
      deps: ['comb-2.1'],
      refs: ['Stanley EC1 ch. 1'],
      tags: ['involutions', 'matchings'],
      viz(v) {
        let sel = null, mate = [3, 2, 1, 0, 4, 5];
        const nS = v.slider('$n$', 1, 7, 6, { int: true, onChange: () => { mate = range(nS.value).map((i) => i); sel = null; } });
        v.button('Random', () => { const r = v.rng(Math.floor(Math.random() * 1e6)), n = nS.value, o = r.shuffle(range(n)); mate = range(n); for (let i = 0; i + 1 < n; i += 2) if (r() < 0.7) { mate[o[i]] = o[i + 1]; mate[o[i + 1]] = o[i]; } });
        v.button('All fixed', () => { mate = range(nS.value); sel = null; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'a matching with fixed points (click two points)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.15, title: 'all involutions of $[n]$' });
        const cache = new Map();
        const gallery = (n) => {
          if (!cache.has(n)) {
            const out = [], m = range(n), go = (rest, cur) => {
              if (!rest.length) { out.push(cur.slice()); return; }
              const a = rest[0], tail = rest.slice(1);
              cur[a] = a; go(tail, cur);
              tail.forEach((b, i) => { cur[a] = b; cur[b] = a; go(tail.filter((_, j) => j !== i), cur); cur[b] = b; });
              cur[a] = a;
            };
            go(m.slice().reverse(), range(n));   // process n first: groups by the fate of the largest point
            const key = (a) => (a[n - 1] === n - 1 ? -1 : a[n - 1]);
            out.sort((a, b) => key(a) - key(b));
            cache.set(n, { list: out, brute: allPerms(n).filter((p) => p.every((x, i) => p[x] === i)).length });
          }
          return cache.get(n);
        };
        const geomA = () => { const n = nS.value, W = A.width, dx = Math.min(70, (W - 40) / n); return { n, dx, x0: (W - n * dx) / 2 + dx / 2, base: A.height * 0.78 }; };
        A.onClick((x, y) => {
          const { n, dx, x0 } = geomA(), [px] = toPx(A, x, y), i = Math.round((px - x0) / dx); if (i < 0 || i >= n) return;
          if (sel == null) sel = i;
          else if (sel === i) { const j = mate[i]; if (j !== i) { mate[i] = i; mate[j] = j; } sel = null; }
          else { [i, sel].forEach((a) => { const m = mate[a]; if (m !== a) { mate[m] = m; } }); mate[i] = sel; mate[sel] = i; sel = null; }
        });
        const arcs = (P, mt, x0, dx, base, st) => {
          const n = mt.length;
          for (let i = 0; i < n; i++) if (mt[i] > i) {
            const xa = x0 + i * dx, xb = x0 + mt[i] * dx, hh = Math.min((xb - xa) * 0.9, st.max ?? 999);
            P.quad(xa, base, (xa + xb) / 2, base - hh * 1.35, xb, base, { color: st.color ? st.color(i, mt[i]) : CAT[i % CAT.length], width: st.width ?? 2.8, alpha: st.alpha });
          }
        };
        v.render(() => {
          const { n, dx, x0, base } = geomA(), P = pen(v, A);
          arcs(P, mate, x0, dx, base, { width: 3.2 });
          for (let i = 0; i < n; i++) {
            const fixed = mate[i] === i;
            P.circle(x0 + i * dx, base, fixed ? 9 : 8, { fill: fixed ? 'panel' : CAT[Math.min(i, mate[i]) % CAT.length], color: sel === i ? 'gold' : fixed ? 'muted' : CAT[Math.min(i, mate[i]) % CAT.length], width: sel === i ? 4 : 2.2 });
            P.text(String(i + 1), x0 + i * dx, base + 26, { align: 'center', size: 14, color: 'ink', weight: 600, halo: false });
          }
          P.text('hollow = fixed point', 10, A.height - 12, { size: 12, color: 'muted', align: 'left', halo: false });
          // gallery
          const Q = pen(v, B), { list } = gallery(n), g = fitGrid(list.length, Q.W - 12, Q.H - 12, 0.55, 5, 150), cw = g.w;
          const same = (a) => a.every((x, i) => x === mate[i]);
          list.forEach((mt, i) => {
            const [gx, gy] = g.at(i), X = 6 + gx, Y = 6 + gy, f = mt[n - 1] === n - 1, d = cw / (n + 0.4), xs = X + d * 0.7, base2 = Y + g.h * 0.8;
            Q.rect(X, Y, g.w, g.h, { fill: f ? 'blue' : 'orange', fillAlpha: 0.1, color: same(mt) ? 'gold' : 'faint', width: same(mt) ? 3 : 0.8, r: 4 });
            arcs(Q, mt, xs, d, base2, { width: Math.max(1, d * 0.1), max: g.h * 0.6, color: (a, b) => (b === n - 1 || a === n - 1 ? 'orange' : 'muted') });
            for (let j = 0; j < n; j++) Q.dot(xs + j * d, base2, Math.max(1.4, d * 0.13), { fill: mt[j] === j ? (j === n - 1 ? 'blue' : 'muted') : (mt[j] === n - 1 || j === n - 1 ? 'orange' : 'muted') });
          });
        });
        v.legend([['blue', '$n$ is fixed: $a_{n-1}$ involutions', { area: true }], ['orange', '$n$ joined to some $j$: $(n-1)\\,a_{n-2}$', { area: true }], ['gold', 'your involution']]);
        v.readout(() => {
          const n = nS.value, { list, brute } = gallery(n), a = [1, 1]; for (let i = 2; i <= 9; i++) a.push(a[i - 1] + (i - 1) * a[i - 2]);
          const pairs = mate.filter((x, i) => x > i).length, f = n - 2 * pairs, nf = list.filter((m) => m[n - 1] === n - 1).length;
          return `Yours: ${pairs} arc${pairs === 1 ? '' : 's'}, ${f} fixed point${f === 1 ? '' : 's'}; $\\pi\\circ\\pi=\\mathrm{id}$ ${mate.every((x, i) => mate[x] === i) ? '✓' : '✗'}.\n$n=${n}$: gallery has ${list.length} involutions; brute force over all ${fact(n)} permutations with $\\pi^2=\\mathrm{id}$: ${brute}; recurrence $a_{${n}}=a_{${n - 1}}+${n - 1}a_{${n - 2 < 0 ? 0 : n - 2}}=${a[n - 1]}+${(n - 1) * (n >= 2 ? a[n - 2] : 0)}=${a[n]}$ ${list.length === a[n] && brute === a[n] ? '✓' : '✗'}  (${nf} with $n$ fixed).`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Definition',
      name: 'Pattern avoidance in permutations',
      credit: 'Knuth, 1968 (stack-sortable permutations); Simion & Schmidt, 1985',
      statement: String.raw`A permutation $w\in S_n$ **contains** the pattern $p\in S_k$ if some subsequence $w_{i_1}\cdots w_{i_k}$ ($i_1<\dots<i_k$) is *order-isomorphic* to $p$ — it has the same up/down relations between every pair of entries; otherwise $w$ **avoids** $p$. Write $\operatorname{Av}_n(p)$ for the set of avoiders. For every one of the six patterns $p$ of length $3$, $|\operatorname{Av}_n(p)|=C_n=\frac1{n+1}\binom{2n}{n}$, the Catalan number; patterns of length 4 split into several different counting sequences.`,
      idea: String.raw`Containment is a partial order on all permutations of all sizes, and avoidance classes are its down-sets. Reversing the word, complementing the values or inverting the permutation maps avoiders of $p$ bijectively onto avoiders of the correspondingly changed pattern, so the six patterns of length 3 fall into just two symmetry classes, $\{123,321\}$ and $\{132,213,231,312\}$; a bijection between the classes (Simion–Schmidt) shows that all six counts coincide. For $231$ (or $312$) Knuth's stack argument gives the Catalan recursion: split a $132$-avoider at the position of $n$; everything left of it exceeds everything to its right, so $|\operatorname{Av}_n|=\sum_i|\operatorname{Av}_{i}|\,|\operatorname{Av}_{n-1-i}|$. Length 4 breaks the coincidence: the three patterns $1234$, $1324$, $1342$ have different counts for $n\ge 6$ or so, as the purple bars show once $n$ is large enough.`,
      caption: String.raw`Pick a pattern and a size. Left: the permutation as a point plot; each occurrence of the pattern is a red polyline through three or four points, and points in an occurrence turn red. Click two points to swap them, or ask for a random avoider. Right: how many permutations of $[n]$ avoid each pattern, by exact enumeration — all six length-3 bars are the same height, the Catalan number (dashed).`,
      deps: ['comb-2.1'],
      refs: ['Aigner ch. 7'],
      tags: ['pattern avoidance', 'catalan numbers'],
      viz(v) {
        const PATS = ['123', '132', '213', '231', '312', '321', '1234', '1324', '1342'];
        const pat = (s) => s.split('').map((c) => +c - 1);
        let seed = 9, w = shuffled(v.rng(seed), 6), sel = null;
        const pS = v.select('pattern', PATS, '132');
        const nS = v.slider('$n$', 3, 8, 6, { int: true, onChange: () => { w = shuffled(v.rng(++seed), nS.value); sel = null; } });
        const occ = (w2, p) => {
          const k = p.length, out = [], cur = [];
          const go = (start) => {
            if (cur.length === k) { out.push(cur.slice()); return; }
            for (let i = start; i < w2.length; i++) {
              let ok = true; for (let a = 0; a < cur.length && ok; a++) ok = (w2[cur[a]] < w2[i]) === (p[a] < p[cur.length]);
              if (ok) { cur.push(i); go(i + 1); cur.pop(); }
            }
          };
          go(0); return out;
        };
        const cache = new Map();
        const counts = (n) => { if (!cache.has(n)) cache.set(n, PATS.map((s) => { const p = pat(s); return allPerms(n).filter((x) => !occ(x, p).length).length; })); return cache.get(n); };
        v.button('Random permutation', () => { w = shuffled(v.rng(++seed), nS.value); sel = null; });
        v.button('Random avoider', () => { const p = pat(pS.value), av = allPerms(nS.value).filter((x) => !occ(x, p).length), r = v.rng(++seed); w = av[Math.floor(r() * av.length)].slice(); sel = null; });
        v.button('Random containing', () => { const p = pat(pS.value); const r = v.rng(++seed); for (let t = 0; t < 400; t++) { const x = shuffled(r, nS.value); if (occ(x, p).length) { w = x; break; } } sel = null; });
        const A = v.stage({ x: [0.4, 6.6], y: [0.4, 6.6], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'position $i$', ylabel: '$w_i$', title: 'occurrences of the pattern (click two points to swap)' });
        const B = v.stage({ x: [-0.6, 8.6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'pattern', title: 'number of avoiders in $S_n$' });
        A.onClick((x) => { const n = nS.value, i = Math.round(x) - 1; if (i < 0 || i >= n) return; if (sel == null) sel = i; else { if (sel !== i) [w[sel], w[i]] = [w[i], w[sel]]; sel = null; } });
        v.render(() => {
          const n = nS.value, p = pat(pS.value), os = occ(w, p), inOcc = new Set(os.flat());
          A.setView([0.4, n + 0.6], [0.4, n + 0.6]); A.setTicks(range(n).map((i) => i + 1), range(n).map((i) => i + 1));
          os.slice(0, 300).forEach((o) => A.path(o.map((i) => [i + 1, w[i] + 1]), { color: 'red', width: 1.8, alpha: Math.max(0.12, Math.min(0.6, 5 / os.length)) }));
          w.forEach((x, i) => A.dot(i + 1, x + 1, { r: sel === i ? 9 : 6.5, color: sel === i ? 'gold' : inOcc.has(i) ? 'red' : 'accent' }));
          A.corner(os.length ? `contains ${pS.value}: ${os.length} occurrence${os.length === 1 ? '' : 's'}` : `avoids ${pS.value} ✓`, 'tr', { color: os.length ? 'red' : 'green', weight: 700, plate: true });
          const c = counts(n), cat = binom(2 * n, n) / (n + 1), mx = Math.max(...c);
          B.setView([-0.6, 8.6], [0, mx * 1.15]); B.setTicks(PATS.map((s, i) => [i, s]), null);
          c.forEach((a, i) => { const sl = PATS[i] === pS.value; B.rect(i - 0.38, 0, i + 0.38, a, { fill: sl ? 'gold' : i < 6 ? 'accent' : 'purple', fillAlpha: sl ? 0.95 : 0.65, color: sl ? 'gold' : i < 6 ? 'accent' : 'purple', width: 1 }); B.text(String(a), i, a + mx * 0.04, { align: 'center', size: 11, color: 'ink', halo: false }); });
          B.hline(cat, { color: 'green', dash: true, width: 2 });
        });
        v.legend([['accent', 'length 3'], ['purple', 'length 4'], ['green', 'Catalan number $C_n$', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, c = counts(n), cat = binom(2 * n, n) / (n + 1), p = pat(pS.value), os = occ(w, p), k = PATS.indexOf(pS.value);
          const same3 = c.slice(0, 6).every((x) => x === cat);
          return `$w=${wordStr(w)}$ ${os.length ? `contains ${pS.value} (${os.length} occurrence${os.length === 1 ? '' : 's'}; first at positions ${os[0].map((i) => i + 1).join(', ')})` : `avoids ${pS.value}`}. ${c[k]} of the ${fact(n)} permutations of $[${n}]$ avoid ${pS.value}.\nAll six length-3 classes have size $C_${n}=${cat}$: ${same3 ? '✓' : '✗'}. Length 4 (1234, 1324, 1342): ${c.slice(6).join(', ')} — ${new Set(c.slice(6)).size > 1 ? 'no longer equal' : 'equal so far'}.`;
        });
      },
    },
  ],
};
