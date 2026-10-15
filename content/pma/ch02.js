// Rudin, Principles of Mathematical Analysis — Chapter 2: Basic Topology (items 2.1–2.14: countability)

// Cells of an infinite array read along anti-diagonals in Rudin's order
// x11; x21, x12; x31, x22, x13; ...  Returns [[n, k], ...] (row n, column k).
function diagCells(maxD, exists = () => true) {
  const out = [];
  for (let d = 1; d <= maxD; d++) for (let n = d; n >= 1; n--) { const k = d - n + 1; if (exists(n, k)) out.push([n, k]); }
  return out;
}
// Inverse of the diagonal numbering: position i (1-based) -> [n, k].
function diagInv(i) {
  let d = 1;
  while ((d * (d + 1)) / 2 < i) d++;
  const pos = i - (d * (d - 1)) / 2;
  return [d - pos + 1, pos];
}
// Segment between two cell centres a, b trimmed to the outside of boxes with half-sizes hw, hh.
function trimSeg(a, b, hw, hh, gap = 0.05) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.min(dx ? (hw + gap) / Math.abs(dx) : Infinity, dy ? (hh + gap) / Math.abs(dy) : Infinity);
  return [a[0] + t * dx, a[1] + t * dy, b[0] - t * dx, b[1] - t * dy];
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
const minus = (s) => String(s).replace('-', '−');

export default {
  collection: 'pma',
  chapter: 2,
  title: 'Basic Topology',
  summary: String.raw`The chapter opens by making "how many" precise: finite, countable and uncountable sets, with the facts that subsets, countable unions and finite products of countable sets stay countable, while Cantor's diagonal argument shows that the 0–1 sequences (and hence $\R$) do not. It then introduces metric spaces and their basic vocabulary — neighbourhoods, limit points, open and closed sets, closures, relative openness. The second half studies compact sets (culminating in the Heine–Borel and Weierstrass theorems in $\R^k$), perfect sets such as the Cantor set, and connected sets.`,
  items: [
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Equivalent sets (same cardinal number)',
      statement: String.raw`Two sets $A$ and $B$ are **equivalent**, written $A\sim B$, if there is a mapping of $A$ onto $B$ that is one-to-one (a bijection); one also says that $A$ and $B$ have the same cardinal number. The relation $\sim$ is
(a) reflexive: $A\sim A$;
(b) symmetric: $A\sim B$ implies $B\sim A$;
(c) transitive: $A\sim B$ and $B\sim C$ imply $A\sim C$.`,
      idea: String.raw`The identity map gives reflexivity, the inverse of a bijection is a bijection (symmetry), and a composition of bijections is a bijection (transitivity). Equivalence compares sets by *matching* their elements, not by containment, so an infinite set can be equivalent to a proper subset of itself — something a finite set can never do.`,
      caption: String.raw`Each line joins $x\in A$ (top) to its partner $f(x)\in B$ (bottom). Drag the gold point along $A$, or flip the arrows to read $f^{-1}$. In the first and last examples $B$ is (equivalent to) a proper part of $A$, yet every element on each side has exactly one partner.`,
      deps: [],
      tags: ['cardinality', 'sets'],
      viz(v) {
        const N = 24;
        const fInt = (n) => (n % 2 === 0 ? n / 2 : -(n - 1) / 2);
        const fCont = (x) => x / (1 - Math.abs(x));
        const MAPS = {
          even: { ax: (n) => (n - 0.5) / N, bx: (m) => (m - 0.5) / N, f: (n) => 2 * n, A: 'J', B: '2J' },
          int: { ax: (n) => (n - 0.5) / N, bx: (z) => 0.5 + z / 25.5, f: fInt, A: 'J', B: '\\Z' },
          cont: { ax: (x) => (x + 1) / 2, bx: (y) => 0.5 + y / 21, f: fCont, A: '(-1,1)', B: '\\R' },
        };
        const which = v.select('', [
          { value: 'even', label: '$n\\mapsto 2n$ onto the even numbers' },
          { value: 'int', label: '$J\\to\\Z$ (zig-zag of 2.5)' },
          { value: 'cont', label: '$x\\mapsto \\frac{x}{1-|x|}$ from $(-1,1)$ to $\\R$' },
        ], 'even');
        const inv = v.toggle('read backwards ($f^{-1}$)', false);
        const S = v.stage({ x: [-0.1, 1.02], y: [-0.6, 1.3], height: 290, axes: false });
        const YA = 1, YB = 0;
        const h = S.handle(MAPS.even.ax(5), YA, {
          color: 'gold',
          constrain: (x) => {
            if (which.value === 'cont') return [v.M.clamp(x, 0.004, 0.996), YA];
            const n = v.M.clamp(Math.round(x * N + 0.5), 1, N);
            return [(n - 0.5) / N, YA];
          },
        });
        let last = 'even', cur = null;
        v.render(() => {
          const w = which.value, G = MAPS[w];
          if (last !== w) { last = w; h.x = w === 'cont' ? G.ax(0.6) : G.ax(5); h.y = YA; }
          const back = inv.value;
          // the two lines
          S.line(-0.02, YA, 1.0, YA, { color: 'muted', width: 1.2 });
          S.line(-0.02, YB, 1.0, YB, { color: 'muted', width: 1.2 });
          S.tex(G.A, -0.022, YA, { color: 'blue', size: w === 'cont' ? 15 : 17, align: 'right' });
          S.tex(G.B, -0.022, YB, { color: 'teal', size: 17, align: 'right' });
          S.text(back ? 'f⁻¹' : 'f', -0.045, 0.5, { align: 'center', math: true, color: 'muted', size: 17 });
          const pairs = [];
          if (w === 'cont') {
            for (let x = -0.95; x < 0.951; x += 0.05) pairs.push([x, fCont(x)]);
          } else for (let n = 1; n <= N; n++) pairs.push([n, G.f(n)]);
          // correspondence lines
          for (const [a, b] of pairs) S.line(G.ax(a), YA - 0.03, G.bx(b), YB + 0.03, { color: 'faint', width: 1.1 });
          // points / ticks
          if (w === 'cont') {
            S.line(0, YA, 1, YA, { color: 'blue', width: 3 });
            S.dot(0, YA, { hollow: true, color: 'blue', r: 4.5 }); S.dot(1, YA, { hollow: true, color: 'blue', r: 4.5 });
            for (const x of [-1, -0.5, 0, 0.5, 1]) S.text(minus(x), G.ax(x), YA + 0.13, { align: 'center', size: 11, color: 'muted' });
            S.arrow(0.5, YB, 1.0, YB, { color: 'teal', width: 3, head: 9 }); S.arrow(0.5, YB, 0.0, YB, { color: 'teal', width: 3, head: 9 });
            for (const y of [-10, -5, 0, 5, 10]) { S.line(G.bx(y), YB - 0.03, G.bx(y), YB + 0.03, { color: 'teal', width: 1.4 }); S.text(minus(y), G.bx(y), YB - 0.14, { align: 'center', size: 11, color: 'muted' }); }
          } else {
            for (let n = 1; n <= N; n++) { S.dot(G.ax(n), YA, { color: 'blue', r: 3.6 }); if (n <= 12 || n % 2 === 0) S.text(String(n), G.ax(n), YA + 0.13, { align: 'center', size: 10.5, color: 'muted' }); }
            if (w === 'even') {
              for (let m = 1; m <= N; m++) {
                if (m % 2) S.dot(G.bx(m), YB, { hollow: true, color: 'faint', r: 3 });
                else { S.dot(G.bx(m), YB, { color: 'teal', r: 3.6 }); S.text(String(m), G.bx(m), YB - 0.14, { align: 'center', size: 10.5, color: 'muted' }); }
              }
              S.corner('B = {2, 4, 6, …} is a proper subset of A = J, yet A ~ B', 'bl', { color: 'teal', weight: 600 });
            } else {
              for (let z = -12; z <= 12; z++) { S.dot(G.bx(z), YB, { color: 'teal', r: 3.6 }); if (z % 2 === 0 || Math.abs(z) < 4) S.text(minus(z), G.bx(z), YB - 0.14, { align: 'center', size: 10.5, color: 'muted' }); }
              S.corner('0, 1, −1, 2, −2, … lists ℤ without repetition', 'bl', { color: 'teal', weight: 600 });
            }
          }
          if (w === 'cont') S.corner('the lines near ±1 leave the picture: f(x) → ±∞', 'bl', { color: 'teal', weight: 600 });
          // the selected pair
          const a = w === 'cont' ? h.x * 2 - 1 : Math.round(h.x * N + 0.5);
          const b = G.f(a);
          const x1 = G.ax(a), x2 = G.bx(b);
          if (back) S.arrow(x2, YB + 0.03, x1, YA - 0.05, { color: 'gold', width: 3, head: 11 });
          else S.arrow(x1, YA - 0.03, x2, YB + 0.05, { color: 'gold', width: 3, head: 11 });
          if (x2 > -0.1 && x2 < 1.02) S.dot(x2, YB, { color: 'gold', r: 6 });
          cur = { a, b, w };
        });
        v.legend([['blue', 'the set $A$'], ['teal', 'the set $B$'], ['gold', 'a chosen pair $(x, f(x))$']]);
        v.readout(() => {
          if (!cur) return '';
          const { a, b, w } = cur;
          const pre = inv.value ? `$f^{-1}(${minus(w === 'cont' ? v.fix(b, 3) : b)}) = ${minus(w === 'cont' ? v.fix(a, 3) : a)}$` : `$f(${minus(w === 'cont' ? v.fix(a, 3) : a)}) = ${minus(w === 'cont' ? v.fix(b, 3) : b)}$`;
          const why = { even: 'every even number $2n$ comes from exactly one $n$.', int: '$f(n)=n/2$ for even $n$ and $-(n-1)/2$ for odd $n$; each integer is hit once.', cont: 'the inverse is $y\\mapsto y/(1+|y|)$, so each real number is hit once.' }[w];
          return `${pre} — ${why}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Finite, countable and uncountable sets',
      statement: String.raw`For a positive integer $n$ let $J_n=\{1,2,\dots,n\}$, and let $J=\{1,2,3,\dots\}$. A set $A$ is
(a) **finite** if $A\sim J_n$ for some $n$ (the empty set is also called finite);
(b) **infinite** if it is not finite;
(c) **countable** if $A\sim J$;
(d) **uncountable** if it is neither finite nor countable;
(e) **at most countable** if it is finite or countable.`,
      idea: String.raw`A bijection $f:J\to A$ is the same thing as a list $f(1),f(2),f(3),\dots$ of the elements of $A$ in which each element occurs exactly once, so "countable" means "can be listed as an infinite sequence without repetition". The integers (2.5) and, as later theorems show, the rationals are countable; Cantor's diagonal argument (2.14) produces an uncountable set.`,
      deps: ['pma-2.3'],
      tags: ['cardinality', 'countability'],
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Infinite subsets of countable sets are countable',
      statement: String.raw`If $A$ is countable and $E\subset A$ is infinite, then $E$ is countable.`,
      idea: String.raw`List $A$ as $x_1,x_2,x_3,\dots$ with no repetitions. Let $n_1$ be the first index with $x_{n_1}\in E$ and, recursively, $n_k$ the first index after $n_{k-1}$ with $x_{n_k}\in E$. Since $E$ is infinite this search never fails, and $k\mapsto x_{n_k}$ is a one-to-one map of $J$ onto $E$. In this sense countable sets are the smallest infinite sets.`,
      caption: String.raw`Choose a countable set $A$ (listed along the top as $x_1,x_2,\dots$) and an infinite subset $E$ (gold outlines). The orange scanner walks along the list; whenever it meets a point of $E$ it hands it the next free label $k$ in the bottom row, which records $n_k$. In the last example $E$ is finite: the labels stop at $6$, so $E\sim J_6$ rather than $J$.`,
      deps: ['pma-2.4'],
      tags: ['countability'],
      viz(v) {
        const N = 24;
        const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
        const listJ = Array.from({ length: N }, (_, i) => ({ val: i + 1, txt: String(i + 1) }));
        const listZ = Array.from({ length: N }, (_, i) => { const n = i + 1; const z = n % 2 === 0 ? n / 2 : -(n - 1) / 2; return { val: z, txt: minus(z) }; });
        const listQ = [];
        for (let q = 2; listQ.length < N; q++) for (let p = 1; p < q && listQ.length < N; p++) if (gcd(p, q) === 1) listQ.push({ val: p / q, p, q, txt: `${p}/${q}` });
        const EX = {
          primes: { label: 'primes in $J$', A: listJ, inE: (o) => isPrime(o.val), An: 'J' },
          squares: { label: 'squares in $J$', A: listJ, inE: (o) => Number.isInteger(Math.sqrt(o.val)), An: 'J' },
          neg: { label: 'negatives in $\\Z$', A: listZ, inE: (o) => o.val < 0, An: '\\Z' },
          unit: { label: '$\\{\\frac1m\\}$ in $\\Q\\cap(0,1)$', A: listQ, inE: (o) => o.p === 1, An: '\\Q\\cap(0,1)' },
          fin: { label: 'divisors of 12', A: listJ, inE: (o) => 12 % o.val === 0, An: 'J', finite: true },
        };
        const which = v.select('$E$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'primes', { onChange: () => v.restart() });
        const S = v.stage({ x: [-2.0, N + 0.6], y: [-1.25, 3.3], height: 290, axes: false });
        const rate = 2.2, YT = 2.15, YB = 0, hw = 0.44, hh = 0.38;
        let state = { nk: [], scanned: 0 };
        v.animate((t) => {
          const E = EX[which.value];
          const scanned = Math.min(N, Math.floor(t * rate));
          S.tex(`A=${E.An}`, -1.05, YT, { color: 'blue', size: 14 });
          S.tex('E', -1.05, YB, { color: 'gold', size: 16 });
          S.text('n', -0.05, YT + hh + 0.28, { align: 'right', size: 10, color: 'muted', math: true });
          S.text('k', -0.05, YB - hh - 0.3, { align: 'right', size: 10, color: 'muted', math: true });
          let k = 0; const nk = [], vals = [];
          for (let n = 1; n <= N; n++) {
            const o = E.A[n - 1], inE = E.inE(o), seen = n <= scanned;
            S.rect(n - hw, YT - hh, n + hw, YT + hh, seen ? { fill: inE ? 'gold' : 'faint', fillAlpha: inE ? 0.42 : 0.22, color: inE ? 'gold' : 'grid', width: inE ? 1.8 : 1 } : { color: inE ? 'gold' : 'grid', width: inE ? 1.8 : 1 });
            S.text(o.txt, n, YT, { align: 'center', size: o.txt.length > 3 ? 9.5 : 11.5, color: seen && !inE ? 'muted' : 'ink', halo: false });
            S.text(String(n), n, YT + hh + 0.28, { align: 'center', size: 9.5, color: 'muted', halo: false });
            if (seen && inE) {
              k++; nk.push(n); vals.push(o.txt);
              S.arrow(n, YT - hh - 0.04, k, YB + hh + 0.06, { color: 'green', width: 1.6, head: 7, alpha: 0.85 });
            }
          }
          for (let j = 1; j <= N; j++) {
            const filled = j <= k;
            S.rect(j - hw, YB - hh, j + hw, YB + hh, filled ? { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.4 } : { color: 'grid', width: 1 });
            if (filled) S.text(vals[j - 1], j, YB, { align: 'center', size: vals[j - 1].length > 3 ? 9.5 : 11.5, halo: false });
            S.text(String(j), j, YB - hh - 0.3, { align: 'center', size: 9.5, color: 'muted', halo: false });
          }
          if (scanned < N) {
            const n = scanned + 1;
            S.rect(n - 0.52, YT - 0.56, n + 0.52, YT + 0.56, { color: 'orange', width: 2.4 });
          }
          if (scanned >= N) S.corner(E.finite ? 'no further point of E will ever appear: E ~ J₆' : 'the scan never runs dry, since E is infinite', 'br', { color: E.finite ? 'red' : 'green', weight: 600 });
          state = { nk, scanned, k };
        }, { period: N / rate + 3 });
        v.t = 5.5;
        v.legend([['gold', 'points of $E$ in the list of $A$', { area: true }], ['green', '$k\\mapsto x_{n_k}$'], ['orange', 'scanner']]);
        v.readout(() => {
          const s = state, E = EX[which.value];
          const list = s.nk.length ? s.nk.join(', ') : '\\;';
          const more = s.scanned < N || !E.finite ? ', \\dots' : '';
          return `$n_1, n_2, \\dots = ${list}${more}$ — ` + (E.finite ? 'here $E$ is finite, so the labels stop and the hypothesis "infinite" fails.' : 'each $n_k$ is the first index after $n_{k-1}$ landing in $E$, and $f(k)=x_{n_k}$ is a bijection $J\\to E$.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'A countable union of countable sets is countable',
      statement: String.raw`Let $E_1,E_2,E_3,\dots$ be countable sets and put $S=\bigcup_{n=1}^{\infty}E_n$. Then $S$ is countable.`,
      idea: String.raw`Write $E_n=\{x_{n1},x_{n2},x_{n3},\dots\}$ as the $n$-th row of an infinite array and read the array along its anti-diagonals: $x_{11};\ x_{21},x_{12};\ x_{31},x_{22},x_{13};\dots$ Each entry is reached after finitely many steps. Skipping entries that already appeared shows that $S$ is equivalent to a subset of $J$, so it is at most countable (2.8); and $S\supset E_1$ is infinite, so $S$ is countable.`,
      caption: String.raw`Choose a family $\{E_n\}$; row $n$ lists $E_n$. The orange path reads the array diagonal by diagonal. A new element of $S$ gets the next number (green, top-left of its cell); an element that already appeared in an earlier cell is skipped (red). Every cell is reached after finitely many steps — that is the whole proof.`,
      deps: ['pma-2.8', 'pma-2.4'],
      tags: ['countability'],
      viz(v) {
        const R = 7, C = 9, D = 7;
        const FAM = {
          mult: { label: '$E_n=\\{n,2n,3n,\\dots\\}$', txt: (n, k) => String(n * k), key: (n, k) => String(n * k) },
          frac: { label: '$E_n=\\{k/n : k\\in J\\}$', txt: (n, k) => `${k}/${n}`, key: (n, k) => { const g = gcd(n, k); return `${k / g}/${n / g}`; } },
          odd: { label: '$E_n=\\{2^{n-1}(2k-1)\\}$ (disjoint)', txt: (n, k) => String(2 ** (n - 1) * (2 * k - 1)), key: (n, k) => String(2 ** (n - 1) * (2 * k - 1)) },
        };
        const which = v.select('', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'mult', { onChange: () => v.restart() });
        const S = v.stage({ x: [-0.95, C + 0.85], y: [-R - 0.9, -0.15], height: 390, axes: false });
        const cells = diagCells(D);
        const rate = 2.1, hw = 0.36, hh = 0.3;
        let state = { listed: [], dups: 0, steps: 0 };
        v.animate((t) => {
          const F = FAM[which.value];
          const steps = Math.min(cells.length, Math.floor(t * rate) + 1);
          const info = new Map(), seen = new Set(), listed = []; let dups = 0;
          for (let i = 0; i < steps; i++) {
            const [n, k] = cells[i], key = F.key(n, k);
            const dup = seen.has(key);
            if (dup) dups++; else { seen.add(key); listed.push(F.txt(n, k)); }
            info.set(`${n},${k}`, { dup, order: dup ? 0 : listed.length, cur: i === steps - 1 });
          }
          // jumps from the end of one diagonal to the start of the next (drawn under the cells)
          for (let i = 0; i + 1 < steps; i++) {
            const [n1, k1] = cells[i], [n2, k2] = cells[i + 1];
            if (n1 + k1 !== n2 + k2) S.line(k1, -n1, k2, -n2, { color: 'orange', width: 1.2, dash: [3, 4], alpha: 0.5 });
          }
          // cell backgrounds
          for (let n = 1; n <= R; n++) for (let k = 1; k <= C; k++) {
            const I = info.get(`${n},${k}`);
            const st = !I ? { color: 'grid', width: 1 } : I.dup ? { fill: 'red', fillAlpha: 0.14, color: 'red', width: 1.2 } : { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.4 };
            S.rect(k - hw, -n - hh, k + hw, -n + hh, { fill: 'panel', fillAlpha: 1, stroke: false });
            S.rect(k - hw, -n - hh, k + hw, -n + hh, st);
          }
          // reading path along each diagonal
          for (let i = 0; i + 1 < steps; i++) {
            const [n1, k1] = cells[i], [n2, k2] = cells[i + 1];
            if (n1 + k1 === n2 + k2) { const [x1, y1, x2, y2] = trimSeg([k1, -n1], [k2, -n2], hw, hh); S.arrow(x1, y1, x2, y2, { color: 'orange', width: 2.2, head: 8 }); }
          }
          // values and order badges
          for (let n = 1; n <= R; n++) {
            S.tex(`E_{${n}}`, -0.35, -n, { color: 'blue', size: 15 });
            S.text('⋯', C + 0.6, -n, { align: 'center', color: 'muted', size: 14 });
            for (let k = 1; k <= C; k++) {
              const I = info.get(`${n},${k}`);
              const txt = F.txt(n, k);
              S.text(txt, k, -n, { align: 'center', size: txt.length > 3 ? 11 : 12.5, color: I ? (I.dup ? 'red' : 'ink') : 'muted', halo: false });
              if (I && I.dup) S.line(k - 0.22, -n - 0.02, k + 0.22, -n + 0.02, { color: 'red', width: 1.4 });
              if (I && !I.dup) S.text(String(I.order), k - hw + 0.04, -n + hh - 0.02, { align: 'left', baseline: 'top', size: 10, color: 'green', weight: 700, halo: false });
              if (I && I.cur) S.rect(k - hw - 0.05, -n - hh - 0.06, k + hw + 0.05, -n + hh + 0.06, { color: 'orange', width: 2.4 });
            }
          }
          for (let k = 1; k <= C; k++) S.text('⋮', k, -R - 0.62, { align: 'center', color: 'muted', size: 13 });
          state = { listed, dups, steps };
        }, { period: cells.length / rate + 3 });
        v.t = 6.5;
        v.legend([['gold', 'new element of $S$', { area: true }], ['red', 'repeat, skipped', { area: true }], ['orange', 'diagonal reading order']]);
        v.readout(() => {
          const s = state;
          const shown = s.listed.slice(0, 16).join(', ') + (s.listed.length > 16 ? ', …' : '');
          return `$s_1,\\dots,s_{${s.listed.length}}$ = ${shown}, … — ${s.dups} repeat${s.dups === 1 ? '' : 's'} skipped so far. Each $s_j$ is a distinct element of $S$, and every element of $S$ eventually appears.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12a
    {
      num: '2.12a',
      kind: 'Corollary',
      name: 'At most countable unions of at most countable sets',
      statement: String.raw`Suppose $A$ is at most countable and that $B_\alpha$ is at most countable for every $\alpha\in A$. Then $T=\bigcup_{\alpha\in A}B_\alpha$ is at most countable.`,
      idea: String.raw`Put $B_\alpha$ in row $\alpha$ of an array whose rows may be finite and whose number of rows may be finite. The diagonal reading from 2.12 still reaches every entry that exists, so $T$ is equivalent to a subset of $J$, which is at most countable by 2.8. Whether $T$ ends up finite or countable depends on the sizes involved; finitely many finite sets give a finite union.`,
      caption: String.raw`Set the number of sets $B_\alpha$ (the last stop is $|A|=\infty$) and resample their sizes. Here $B_\alpha$ is the set of the first $\ell_\alpha$ multiples of $\alpha$, where $\ell_\alpha$ is finite or $\infty$. The diagonal sweep skips missing cells and repeated values; it terminates when $T$ is finite and runs forever when $T$ is countable.`,
      deps: ['pma-2.12', 'pma-2.8'],
      tags: ['countability'],
      viz(v) {
        const R = 8, C = 10, hw = 0.36, hh = 0.3, rate = 3;
        let seed = 4;
        const m = v.slider('number of sets $|A|$', 1, 9, 4, { int: true, fmt: (x) => (x >= 9 ? '∞' : String(x)), onChange: () => v.restart() });
        v.button('Resample sizes $\\ell_\\alpha$', () => { seed++; v.restart(); });
        const S = v.stage({ x: [-0.95, C + 2.2], y: [-R - 0.9, -0.2], height: 380, axes: false });
        let state = {};
        v.animate((t) => {
          const r = v.rng(seed * 7919 + 13);
          const len = [0];
          for (let a = 1; a <= R; a++) len.push(r() < 0.3 ? Infinity : r.int(1, 5));
          const infA = m.value >= 9, rows = infA ? R : m.value;
          S.setView(null, [-Math.max(rows, 5) - 0.9, -0.2]);
          const exists = (n, k) => n <= rows && k <= Math.min(len[n], C);
          const cells = diagCells(R + C, exists);
          const steps = Math.min(cells.length, Math.floor(t * rate) + 1);
          const info = new Map(), seen = new Set(); let dups = 0;
          for (let i = 0; i < steps; i++) {
            const [n, k] = cells[i], val = n * k;
            const dup = seen.has(val);
            if (dup) dups++; else seen.add(val);
            info.set(`${n},${k}`, { dup, order: dup ? 0 : seen.size, cur: i === steps - 1 && steps < cells.length });
          }
          // the sweep: consecutive visited cells (under the cells; the boxes hide what they cover)
          for (let i = 0; i + 1 < steps; i++) {
            const [n1, k1] = cells[i], [n2, k2] = cells[i + 1];
            const same = n1 + k1 === n2 + k2 && n1 - n2 === 1;
            if (same) { const [x1, y1, x2, y2] = trimSeg([k1, -n1], [k2, -n2], hw, hh, 0.03); S.line(x1, y1, x2, y2, { color: 'orange', width: 2 }); }
            else S.line(k1, -n1, k2, -n2, { color: 'orange', width: 1.1, dash: [3, 4], alpha: 0.32 });
          }
          for (let n = 1; n <= rows; n++) {
            S.tex(`B_{${n}}`, -0.4, -n, { color: 'blue', size: 15 });
            const L = Math.min(len[n], C);
            for (let k = 1; k <= L; k++) {
              const I = info.get(`${n},${k}`);
              S.rect(k - hw, -n - hh, k + hw, -n + hh, { fill: 'panel', fillAlpha: 1, stroke: false });
              S.rect(k - hw, -n - hh, k + hw, -n + hh, !I ? { color: 'grid', width: 1 } : I.dup ? { fill: 'red', fillAlpha: 0.14, color: 'red', width: 1.2 } : { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.4 });
              S.text(String(n * k), k, -n, { align: 'center', size: 12, color: I ? (I.dup ? 'red' : 'ink') : 'muted', halo: false });
              if (I && I.dup) S.line(k - 0.2, -n - 0.02, k + 0.2, -n + 0.02, { color: 'red', width: 1.4 });
              if (I && !I.dup) S.text(String(I.order), k - hw + 0.04, -n + hh - 0.02, { align: 'left', baseline: 'top', size: 10, color: 'green', weight: 700, halo: false });
              if (I && I.cur) S.rect(k - hw - 0.05, -n - hh - 0.06, k + hw + 0.05, -n + hh + 0.06, { color: 'orange', width: 2.4 });
            }
            if (len[n] === Infinity) S.text('⋯', C + 0.55, -n, { align: 'center', size: 14, color: 'muted' });
            S.tex(len[n] === Infinity ? '\\ell_{' + n + '}=\\infty' : `\\ell_{${n}}=${len[n]}`, C + 1.05, -n, { align: 'left', size: 13, color: len[n] === Infinity ? 'purple' : 'muted' });
          }
          if (infA) S.text('⋮  infinitely many more rows', 0.6, -R - 0.6, { align: 'left', size: 12, color: 'purple' });
          const finite = !infA && len.slice(1, rows + 1).every((x) => x < Infinity);
          const done = steps >= cells.length;
          if (finite && done) S.corner(`sweep finished: T is finite, |T| = ${seen.size}`, 'br', { color: 'green', weight: 600 });
          state = { finite, done, count: seen.size, dups, rows, infA };
        }, { period: 30 });
        v.t = 4;
        v.legend([['gold', 'new element of $T$', { area: true }], ['red', 'repeat, skipped', { area: true }], ['orange', 'diagonal sweep']]);
        v.readout(() => {
          const s = state; if (s.count == null) return '';
          if (s.finite) return `Finitely many finite sets: ${s.done ? `the sweep stops, and $T$ is finite with $|T| = ${s.count}$` : `the sweep will stop; so far ${s.count} elements`} (${s.dups} repeats skipped).`;
          return `${s.infA ? 'Infinitely many sets' : 'At least one infinite $B_\\alpha$'}: the sweep never stops, yet every element of $T$ gets a number after finitely many steps — $T$ is countable. (${s.count} listed so far, ${s.dups} repeats.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Finite tuples from a countable set form a countable set',
      statement: String.raw`Let $A$ be countable and let $B_n$ be the set of all $n$-tuples $(a_1,\dots,a_n)$ with $a_k\in A$ for $k=1,\dots,n$ (the $a_k$ need not be distinct). Then $B_n$ is countable.`,
      idea: String.raw`Induction on $n$, starting from $B_1=A$. An $n$-tuple is a pair $(b,a)$ with $b\in B_{n-1}$ and $a\in A$. For each fixed $b$ the pairs $(b,a)$ form a copy of $A$, hence a countable set, and there are countably many $b$ by the induction hypothesis. So $B_n$ is a countable union of countable sets, which is countable by 2.12.`,
      caption: String.raw`Take $A=J$. Left: the pairs $b=(a_1,a_2)$, numbered $b_1,b_2,\dots$ by the diagonal reading of 2.12. Right: row $j$ holds the triples $(b_j,a_3)$, $a_3=1,2,\dots$ — a copy of $A$ for each $b_j$ — and the same diagonal reading numbers all triples. The gold ring on the left marks the $b_j$ used by the current triple.`,
      deps: ['pma-2.12', 'pma-2.4'],
      tags: ['countability'],
      viz(v) {
        const KMAX = 21, G = 7, rate = 1.5, ROWS = 6, COLS = 6, hw = 0.45, hh = 0.31;
        const L = v.stage({ x: [0.2, 7.8], y: [0.2, 7.8], equal: true, height: 350, axes: false, weight: 0.85, title: '$B_2$: the pair $b_j=(a_1,a_2)$' });
        const R = v.stage({ x: [-1.75, COLS + 0.65], y: [-ROWS - 0.75, 0.05], height: 350, axes: false, weight: 1.15, title: '$B_3$: row $j$ holds the triples $(b_j,\\,a_3)$' });
        const pos = (j, k) => { const d = j + k - 1; return (d * (d - 1)) / 2 + (d - j + 1); };
        let state = {};
        v.animate((t) => {
          const K = Math.min(KMAX, Math.floor(t * rate) + 1);
          const [j, a3] = diagInv(K), [b1, b2] = diagInv(j);
          // ---- left: B2 lattice with its diagonal numbering
          for (let x = 1; x <= G; x++) { L.text(String(x), x, 0.45, { align: 'center', size: 11, color: 'muted' }); L.text(String(x), 0.45, x, { align: 'center', size: 11, color: 'muted' }); }
          L.tex('a_1', 7.55, 0.45, { size: 13, color: 'muted' }); L.tex('a_2', 0.45, 7.6, { size: 13, color: 'muted' });
          for (let i = 1; i < 28; i++) {
            const [n1, k1] = diagInv(i), [n2, k2] = diagInv(i + 1);
            if (n1 + k1 === n2 + k2) L.arrow(v.M.lerp(n1, n2, 0.22), v.M.lerp(k1, k2, 0.22), v.M.lerp(n1, n2, 0.8), v.M.lerp(k1, k2, 0.8), { color: 'orange', width: 1.6, head: 7, alpha: 0.6 });
          }
          for (let x = 1; x <= G; x++) for (let y = 1; y <= G; y++) {
            const jj = pos(x, y), on = jj <= 28, row = jj <= ROWS;
            L.dot(x, y, { r: on ? 4.5 : 3, color: on ? (row ? 'purple' : 'blue') : 'faint' });
            if (on) L.textPx(String(jj), L.X(x) + 10, L.Y(y) - 11, { size: 10, color: row ? 'purple' : 'blue', align: 'left', weight: row ? 700 : 600 });
          }
          L.circle(b1, b2, 9.5 / L.scale, { color: 'gold', width: 3 });
          // ---- right: the array of triples
          for (let k = 1; k <= COLS; k++) R.tex(`a_3=${k}`, k, -0.28, { size: 12, color: 'muted' });
          const info = new Map();
          for (let i = 1; i <= K; i++) { const [jj, kk] = diagInv(i); info.set(`${jj},${kk}`, i); }
          for (let i = 1; i < K; i++) {
            const [j1, k1] = diagInv(i), [j2, k2] = diagInv(i + 1);
            if (j1 + k1 !== j2 + k2) R.line(k1, -j1, k2, -j2, { color: 'orange', width: 1.2, dash: [3, 4], alpha: 0.5 });
          }
          for (let jj = 1; jj <= ROWS; jj++) {
            const [x, y] = diagInv(jj);
            R.tex(`b_{${jj}}=(${x},${y})`, -0.95, -jj, { size: 13.5, color: jj === j ? 'gold' : 'purple' });
            for (let k = 1; k <= COLS; k++) {
              const ord = info.get(`${jj},${k}`);
              R.rect(k - hw, -jj - hh, k + hw, -jj + hh, { fill: 'panel', fillAlpha: 1, stroke: false });
              R.rect(k - hw, -jj - hh, k + hw, -jj + hh, ord ? { fill: 'gold', fillAlpha: 0.28, color: 'gold', width: 1.4 } : { color: 'grid', width: 1 });
            }
          }
          for (let i = 1; i < K; i++) {
            const [j1, k1] = diagInv(i), [j2, k2] = diagInv(i + 1);
            if (j1 + k1 === j2 + k2) { const [x1, y1, x2, y2] = trimSeg([k1, -j1], [k2, -j2], hw, hh); R.arrow(x1, y1, x2, y2, { color: 'orange', width: 2, head: 7 }); }
          }
          for (let jj = 1; jj <= ROWS; jj++) {
            const [x, y] = diagInv(jj);
            for (let k = 1; k <= COLS; k++) {
              const ord = info.get(`${jj},${k}`);
              R.text(`(${x},${y},${k})`, k + 0.06, -jj - 0.05, { align: 'center', size: 10, color: ord ? 'ink' : 'muted', halo: false });
              if (ord) R.text(String(ord), k - hw + 0.04, -jj + hh - 0.02, { align: 'left', baseline: 'top', size: 9, color: 'green', weight: 700, halo: false });
              if (ord === K) R.rect(k - hw - 0.05, -jj - hh - 0.06, k + hw + 0.05, -jj + hh + 0.06, { color: 'orange', width: 2.4 });
            }
            R.text('⋯', COLS + 0.55, -jj, { align: 'center', size: 13, color: 'muted' });
          }
          for (let k = 1; k <= COLS; k++) R.text('⋮', k, -ROWS - 0.55, { align: 'center', size: 12, color: 'muted' });
          state = { K, j, a3, b1, b2 };
        }, { period: KMAX / rate + 3 });
        v.t = 8;
        v.legend([['purple', 'pairs $b_1,\\dots,b_6$ used as row labels', { dot: true }], ['gold', 'current triple and its $b_j$', { area: true }], ['orange', 'diagonal reading order']]);
        v.readout(() => {
          const s = state; if (!s.K) return '';
          return `triple number ${s.K} is $(b_{${s.j}},\\,a_3)$ with $b_{${s.j}}=(${s.b1},${s.b2})$ and $a_3=${s.a3}$, i.e. $(${s.b1},${s.b2},${s.a3})$. Every triple sits in some row $j$ and column $a_3$, so it is reached after finitely many steps.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13a
    {
      num: '2.13a',
      kind: 'Corollary',
      name: 'The rational numbers are countable',
      statement: String.raw`The set $\Q$ of all rational numbers is countable.`,
      idea: String.raw`Every rational number has the form $b/a$ with $b\in\Z$ and $a\in J$. The pairs $(a,b)$ form a countable set by 2.13 (the integers are countable), so the set of quotients $b/a$ is at most countable; it is infinite, so it is countable (2.8). That different pairs such as $(2,1)$ and $(4,2)$ name the same rational only produces harmless repetitions.`,
      caption: String.raw`The lattice point $(a,b)$ names the rational $b/a$, the slope of the ray from the origin; read it off where the ray crosses the green line $a=1$. Pairs are visited shell by shell ($a+|b|$ constant, dashed). A point on an already-used ray is a repeat (red) and is skipped. Watch the green line fill up with a set that is dense, yet listed one element at a time.`,
      deps: ['pma-2.13', 'pma-2.8'],
      see: ['pma-1.20'],
      tags: ['countability', 'rationals'],
      viz(v) {
        const H = 7, rate = 2.4;
        const pairs = [];
        for (let h = 1; h <= H; h++) for (let a = 1; a <= h; a++) { const b = h - a; pairs.push([a, b]); if (b) pairs.push([a, -b]); }
        const S = v.stage({ x: [-0.55, 7.6], y: [-6.9, 6.9], height: 440, xlabel: 'a', ylabel: 'b', xticks: [1, 2, 3, 4, 5, 6, 7], yticks: [-6, -4, -2, 2, 4, 6] });
        let state = {};
        const fracTex = (b, a) => { const g = gcd(a, b) || 1; const p = b / g, q = a / g; return q === 1 ? `${p}` : `${p < 0 ? '-' : ''}\\tfrac{${Math.abs(p)}}{${q}}`; };
        v.animate((t) => {
          const K = Math.min(pairs.length, Math.floor(t * rate) + 1);
          const seen = new Set(); let curNew = false, nNew = 0;
          // the Q-line a = 1
          S.vline(1, { color: 'green', width: 2.2, alpha: 0.9 });
          // current shell
          const [ca, cb] = pairs[K - 1], hcur = ca + Math.abs(cb);
          if (hcur > 1) S.path([[1, hcur - 1], [hcur, 0], [1, 1 - hcur]], { color: 'orange', width: 1.3, dash: [5, 4] });
          for (let i = 0; i < K; i++) {
            const [a, b] = pairs[i], g = gcd(a, b), key = `${b / g}/${a / g}`;
            const dup = seen.has(key);
            if (!dup) { seen.add(key); nNew++; S.line(0, 0, a, b, { color: 'green', width: 1, alpha: 0.28 }); S.line(0.92, b / a, 1.08, b / a, { color: 'green', width: 2.2 }); }
            if (i === K - 1) curNew = !dup;
          }
          // lattice
          for (let a = 1; a <= H; a++) for (let b = -6; b <= 6; b++) S.dot(a, b, { r: 2.4, color: 'faint', ring: false });
          for (let i = 0; i < K; i++) {
            const [a, b] = pairs[i], g = gcd(a, b);
            const first = pairs.findIndex(([x, y]) => x * b === y * a) === i; // first pair on this ray
            S.dot(a, b, first ? { r: 4.2, color: 'blue' } : { r: 4.2, color: 'red', hollow: true, width: 2 });
            if (g > 1 && i < K - 1) { /* repeated ray: nothing more */ }
          }
          S.line(0, 0, ca, cb, { color: 'gold', width: 2.6 });
          S.dot(ca, cb, { r: 6.5, color: 'gold' });
          S.dot(1, cb / ca, { r: 5, color: curNew ? 'green' : 'red' });
          S.tex(fracTex(cb, ca).replace('tfrac', 'frac'), 1, cb / ca, { align: 'right', dx: -24, color: curNew ? 'green' : 'red', size: 19 });
          S.dot(0, 0, { r: 3, color: 'ink' });
          state = { K, a: ca, b: cb, curNew, nNew };
        }, { period: pairs.length / rate + 3 });
        v.t = 12.5;
        v.legend([['green', 'listed rationals on the line $a=1$'], ['blue', 'first pair on its ray', { dot: true }], ['red', 'repeat (same ray)', { dot: true }], ['orange', 'current shell $a+|b|=h$', { dash: true }]]);
        v.readout(() => {
          const s = state; if (!s.K) return '';
          return `pair number ${s.K}: $(a,b)=(${s.a},${minus(s.b)})\\mapsto b/a = ${fracTex(s.b, s.a)}$ — ` + (s.curNew ? `new; it is rational number ${s.nNew} in the list.` : 'already listed, skip.') + ` So far ${s.nNew} distinct rationals from ${s.K} pairs.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: "Cantor's diagonal argument: 0–1 sequences are uncountable",
      statement: String.raw`Let $A$ be the set of all sequences $s=(s(1),s(2),s(3),\dots)$ whose terms are $0$ or $1$. Then $A$ is uncountable.`,
      idea: String.raw`Take any countable subset $E=\{s_1,s_2,s_3,\dots\}$ of $A$ and flip its diagonal: $s(n)=1-s_n(n)$. Then $s\in A$ but $s$ differs from $s_n$ in the $n$-th term, so $s\notin E$. Thus every countable subset of $A$ is a proper subset, and $A$ cannot be countable; it is clearly infinite. Reading binary expansions, the same argument shows that $\R$ is uncountable.`,
      caption: String.raw`Click any digit to change the list. The orange diagonal determines the green sequence $s$: each diagonal digit is flipped, so $s$ disagrees with row $i$ in column $i$. Press **Append** to add $s$ to the list (its label turns green): the diagonal grows and a new missing sequence appears. (Digits of $s$ past the last row are decided by later rows of the infinite list.)`,
      deps: ['pma-2.4'],
      see: ['pma-2.43'],
      tags: ['countability', 'diagonal argument'],
      viz(v) {
        const M = 12, N0 = 7, NMAX = 12;
        let rows = [];
        const init = (seed) => { const r = v.rng(seed); rows = []; for (let i = 0; i < N0; i++) rows.push(Array.from({ length: M }, () => (r() < 0.5 ? 1 : 0))); };
        init(13);
        const diag = () => rows.map((row, i) => 1 - row[i]);
        v.button('Append $s$ to the list', () => { if (rows.length < NMAX) { const s = diag(); rows.push(Array.from({ length: M }, (_, k) => (k < s.length ? s[k] : 0))); } });
        v.button('New list', () => init(1 + Math.floor(Math.random() * 1e6)));
        v.button('Reset', () => init(13));
        const S = v.stage({ x: [-1.3, M + 3.1], y: [-N0 - 2.5, -0.1], height: 430, axes: false });
        S.onClick((x, y) => {
          const k = Math.round(x), i = Math.round(-y);
          if (i >= 1 && i <= rows.length && k >= 1 && k <= M && Math.abs(x - k) < 0.45 && Math.abs(-y - i) < 0.45) rows[i - 1][k - 1] ^= 1;
        });
        let state = {};
        v.render(() => {
          const N = rows.length, s = diag();
          S.setView(null, [-N - 2.5, -0.1]);
          const hw = 0.43, hh = 0.38, ys = -N - 1.55;
          for (let k = 1; k <= M; k++) S.text(String(k), k, -0.38, { align: 'center', size: 10, color: 'muted' });
          for (let i = 1; i <= N; i++) {
            S.tex(`s_{${i}}`, -0.55, -i, { color: i > N0 ? 'green' : 'blue', size: 15 });
            for (let k = 1; k <= M; k++) {
              const d = rows[i - 1][k - 1], isD = i === k;
              S.rect(k - hw, -i - hh, k + hw, -i + hh, { fill: d ? 'blue' : 'panel', fillAlpha: d ? 0.2 : 1, color: isD ? 'orange' : 'grid', width: isD ? 2.6 : 1 });
              S.text(String(d), k, -i, { align: 'center', size: 13, color: isD ? 'orange' : 'ink', weight: isD ? 700 : 500, halo: false });
            }
            S.text('⋯', M + 0.6, -i, { align: 'center', size: 14, color: 'muted' });
            S.tex(`s(${i})\\ne s_{${i}}(${i})`, M + 0.95, -i, { align: 'left', size: 12.5, color: 'green' });
          }
          S.line(0.45, ys + 0.62, M + 0.55, ys + 0.62, { color: 'muted', width: 1 });
          S.tex('s', -0.55, ys, { color: 'green', size: 17 });
          for (let k = 1; k <= M; k++) {
            if (k <= N) {
              S.rect(k - hw, ys - hh, k + hw, ys + hh, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2 });
              S.text(String(s[k - 1]), k, ys, { align: 'center', size: 13, color: 'green', weight: 700, halo: false });
            } else {
              S.rect(k - hw, ys - hh, k + hw, ys + hh, { color: 'faint', width: 1, dash: [3, 3] });
              S.text('·', k, ys, { align: 'center', size: 13, color: 'faint', halo: false });
            }
          }
          S.text('⋯', M + 0.6, ys, { align: 'center', size: 14, color: 'muted' });
          state = { N, s };
        });
        v.legend([['orange', 'diagonal digits $s_n(n)$', { area: true }], ['green', '$s(n) = 1 - s_n(n)$', { area: true }], ['blue', 'digit 1', { area: true }]]);
        v.readout(() => {
          const { N, s } = state; if (!N) return '';
          return `$s = ${s.join('')}\\ldots$ differs from $s_i$ in place $i$ for every $i\\le ${N}$, so $s\\notin\\{s_1,\\dots,s_{${N}}\\}$.` + (N >= NMAX ? ' (The demo list is full; the real list never is.)' : '');
        });
      },
    },
  ],
};
