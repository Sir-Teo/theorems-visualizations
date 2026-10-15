// Combinatorics — Chapter 1: Basic counting (items 1.1–1.10; 1.11–1.19 are in ch01-b.js)
//
// House style for the chapter: every count is shown by *listing* the objects (trees of choices,
// galleries of subsets, words and paths) next to the formula, and the readout compares the number
// of objects actually generated with the formula. Elements of a ground set keep a fixed colour
// (CAT[i]) across panels so that a bijection can be followed by eye.
import { CAT, LET, binom, fact, fall, kSubsets, perms, kPerms, fitGrid, pen, toPx } from './ch01.shared.js';

/** Choice shapes for 1.1: stage 0 = disc, 1 = square, 2 = diamond. */
function shapeAt(P, stage, x, y, r, col, st = {}) {
  if (stage === 0) P.dot(x, y, r, { fill: col, ...st });
  else if (stage === 1) P.rect(x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76, { fill: col, ...st });
  else P.path([[x, y - r * 1.15], [x + r * 1.15, y], [x, y + r * 1.15], [x - r * 1.15, y]], { fill: col, close: true, ...st });
}
/** Words of length n over {0,1} in binary order; bit i (from the left) = letter i. */
const bitsOf = (w, n) => Array.from({ length: n }, (_, i) => (w >> (n - 1 - i)) & 1);
const popcount = (w) => { let c = 0; while (w) { c += w & 1; w >>= 1; } return c; };
/** Nonnegative 'nice' tick values up to about max (for bar charts whose window starts below 0). */
function niceTicks(max, target = 5) {
  const raw = Math.max(1, max) / target, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p, st = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, out = [];
  for (let t = 0; t <= max * 1.001; t += st) out.push(Math.round(t * 1e6) / 1e6);
  return out;
}

export default {
  collection: 'comb',
  chapter: 1,
  title: 'Basic counting',
  summary: String.raw`Counting starts with two rules — add over disjoint cases, multiply over independent stages — and two quiet principles: pigeonhole and double counting. From them come the binomial coefficients and their identities, multisets, lattice paths and the first appearance of the Stirling and partition numbers. The twelvefold way organises all of these as ways of putting balls into boxes, the Stirling numbers turn out to be the change of basis between powers and falling factorials, and Stirling's formula tells us how fast the central binomial coefficient grows.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Sum and product rules',
      statement: String.raw`**Sum rule.** If a finite set $A$ is the union of pairwise disjoint subsets $A_1,\dots,A_m$, then $|A| = |A_1| + \cdots + |A_m|$.

**Product rule.** Suppose every object of a set $A$ is produced by a sequence of $k$ choices, different sequences giving different objects, where the first choice can be made in $n_1$ ways and, whatever the earlier choices were, the $i$-th choice can be made in $n_i$ ways. Then $|A| = n_1 n_2 \cdots n_k$. In particular $|A_1\times\cdots\times A_k| = |A_1|\cdots|A_k|$.`,
      idea: String.raw`The sum rule is what counting means: count the pieces one at a time. The product rule is the sum rule used repeatedly: sorting the objects by their first choice splits $A$ into $n_1$ disjoint classes, each produced by the remaining $k-1$ choices and so, by induction, of size $n_2\cdots n_k$. Only the *number* of options at each stage has to be independent of the earlier choices, not the options themselves — which is exactly what makes the falling factorials of 1.5 work.`,
      caption: String.raw`Set the numbers of shirts, trousers and pairs of shoes, and put "and" or "or" between consecutive stages. The tree has one leaf per outfit; the little stack under each leaf is the outfit itself (disc = shirt, square = trousers, diamond = shoes, colour = which one). With "and" every node of a level has the same number of children, so the leaves multiply; an "or" splits the tree into disjoint subtrees whose leaves add. Click a leaf to trace its choices.`,
      deps: [],
      refs: ['Stanley EC1 §1.1', 'Aigner ch. 1'],
      tags: ['counting', 'foundations'],
      viz(v) {
        const NAMES = ['shirt', 'trousers', 'shoes'];
        const sz = [
          v.slider('shirts', 1, 4, 3, { int: true }),
          v.slider('trousers', 1, 4, 2, { int: true }),
          v.slider('pairs of shoes', 1, 4, 3, { int: true }),
        ];
        const OPS = [{ value: 'and', label: 'and (×)' }, { value: 'or', label: 'or (+)' }];
        const op = [v.select('shirt · trousers', OPS, 'and'), v.select('trousers · shoes', OPS, 'and')];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390 });
        let sel = 7, leaves = [], slot = 10, groups = [[0, 1, 2]];
        s.onClick((x, y) => {
          const [px] = toPx(s, x, y); let best = -1, bd = Infinity;
          leaves.forEach((lf, i) => { const d = Math.abs(lf.x - px); if (d < bd) { bd = d; best = i; } });
          if (best >= 0 && bd < Math.max(9, slot * 0.6)) sel = best === sel ? null : best;
        });
        v.render(() => {
          const P = pen(v, s), W = P.W, H = P.H, n = sz.map((c) => c.value);
          groups = [[0]];
          op.forEach((o, i) => { if (o.value === 'and') groups[groups.length - 1].push(i + 1); else groups.push([i + 1]); });
          leaves = [];
          groups.forEach((g, gi) => {
            const tot = g.reduce((a, i) => a * n[i], 1);
            for (let t = 0; t < tot; t++) { let r = t; const opts = []; for (let d = g.length - 1; d >= 0; d--) { opts[d] = r % n[g[d]]; r = Math.floor(r / n[g[d]]); } leaves.push({ g: gi, opts }); }
          });
          if (sel != null && sel >= leaves.length) sel = null;
          const D = Math.max(...groups.map((g) => g.length)), m = 22, gapG = groups.length > 1 ? 30 : 0;
          slot = (W - 2 * m - gapG * (groups.length - 1)) / leaves.length;
          leaves.forEach((lf, i) => { lf.x = m + slot * (i + 0.5) + gapG * lf.g; });
          const q = Math.max(3.2, Math.min(10, slot * 0.36)), rootY = 46, iconTop = H - 12 - D * q * 2.5, rowH = (iconTop - 22 - rootY) / D;
          // nodes: key = group|prefix
          const nodes = new Map();
          leaves.forEach((lf, i) => {
            const g = groups[lf.g];
            for (let d = 1; d <= g.length; d++) {
              const key = lf.g + '|' + lf.opts.slice(0, d).join(','); let nd = nodes.get(key);
              if (!nd) { nd = { xs: [], d, stage: g[d - 1], opt: lf.opts[d - 1], g: lf.g, parent: d > 1 ? lf.g + '|' + lf.opts.slice(0, d - 1).join(',') : null, leaves: [] }; nodes.set(key, nd); }
              nd.xs.push(lf.x); nd.leaves.push(i);
            }
          });
          for (const nd of nodes.values()) { nd.x = nd.xs.reduce((a, b) => a + b, 0) / nd.xs.length; nd.y = rootY + nd.d * rowH; const g = groups[nd.g]; let below = 1; for (let d = nd.d; d < g.length; d++) below *= n[g[d]]; nd.r = Math.max(2.4, Math.min(11, slot * below * 0.34)); }
          const onSel = (nd) => sel != null && nd.leaves.includes(sel);
          // edges
          const rootX = W / 2;
          for (const nd of nodes.values()) {
            const par = nd.parent ? nodes.get(nd.parent) : { x: rootX, y: rootY };
            P.line(par.x, par.y, nd.x, nd.y, { color: onSel(nd) ? 'gold' : 'faint', width: onSel(nd) ? 3.2 : Math.max(0.7, Math.min(1.6, slot * 0.12)) });
          }
          // drop lines from shallow leaves to the outfit row
          leaves.forEach((lf, i) => {
            const g = groups[lf.g], nd = nodes.get(lf.g + '|' + lf.opts.join(','));
            if (g.length < D) P.line(nd.x, nd.y + nd.r + 2, nd.x, iconTop - 6, { color: i === sel ? 'gold' : 'faint', width: i === sel ? 2.4 : 0.8, dash: [3, 3] });
          });
          // root and nodes
          P.dot(rootX, rootY, 6, { fill: 'ink' });
          P.text('start', rootX + 10, rootY - 2, { size: 11, color: 'muted' });
          for (const nd of nodes.values()) shapeAt(P, nd.stage, nd.x, nd.y, nd.r, CAT[nd.opt], onSel(nd) ? { color: 'ink', width: 1.6 } : {});
          // outfits under the leaves
          leaves.forEach((lf, i) => {
            const g = groups[lf.g];
            if (i === sel) P.rect(lf.x - q * 1.25, iconTop - 4, q * 2.5, g.length * q * 2.5 + 2, { fill: 'gold', fillAlpha: 0.22, r: 3 });
            g.forEach((st, d) => shapeAt(P, st, lf.x, iconTop + q * 1.2 + d * q * 2.5, q * 0.85, CAT[lf.opts[d]]));
          });
          // group brackets and key
          if (groups.length > 1) groups.forEach((g, gi) => {
            const xs = leaves.filter((lf) => lf.g === gi).map((lf) => lf.x), a = Math.min(...xs) - slot * 0.45, b = Math.max(...xs) + slot * 0.45;
            P.path([[a, iconTop - 9], [a, iconTop - 13], [b, iconTop - 13], [b, iconTop - 9]], { color: 'muted', width: 1.2 });
            P.text(g.map((i) => NAMES[i]).join(' and '), (a + b) / 2, iconTop - 21, { size: 11, color: 'muted', align: 'center' });
          });
          let kx = 12; [0, 1, 2].forEach((st) => { shapeAt(P, st, kx + 5, 16, 5, 'muted'); P.text(NAMES[st], kx + 14, 16, { size: 11.5, color: 'muted' }); kx += 22 + NAMES[st].length * 7; });
          const expr = groups.map((g) => g.map((i) => n[i]).join(String.raw`\times `)).join(' + ');
          s.corner(`$${expr} = ${leaves.length}$ outfits`, 'tr', { size: 15, color: 'ink' });
        });
        v.readout(() => {
          const n = sz.map((c) => c.value), N = leaves.length;
          let t;
          if (groups.length === 1) t = `An outfit is a shirt **and** trousers **and** shoes. Each of the ${n[0]} shirt nodes has ${n[1]} children and each of those has ${n[2]}, so the leaves number $${n[0]}\\times${n[1]}\\times${n[2]} = ${N}$ (product rule).`;
          else if (groups.length === 3) t = `An outfit is now a shirt **or** trousers **or** shoes: three disjoint kinds of leaf, so the counts add, $${n[0]}+${n[1]}+${n[2]} = ${N}$ (sum rule).`;
          else t = `Two disjoint kinds of outfit (${groups.map((g) => g.map((i) => NAMES[i]).join(' and ')).join(' **or** ')}): multiply inside each kind, add across kinds — ${N} leaves.`;
          if (sel != null && leaves[sel]) { const lf = leaves[sel], g = groups[lf.g]; t += ` Selected leaf: ${g.map((st, d) => `${NAMES[st]} ${lf.opts[d] + 1}`).join(' · ')}.`; }
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Principle',
      name: 'Pigeonhole principle',
      credit: 'Dirichlet, 1834',
      statement: String.raw`If $n$ objects are placed in $k$ boxes, then some box contains at least $\lceil n/k\rceil$ of them. In particular, if $n>k$ some box contains at least two objects, and if $n > mk$ some box contains more than $m$. The bound is sharp: distributing the objects as evenly as possible puts at most $\lceil n/k\rceil$ in every box.`,
      scope: String.raw`Holds for every placement whatsoever of finitely many objects into finitely many boxes. It is a pure existence statement: it says a crowded box exists, not which one.`,
      idea: String.raw`If every box held at most $\lceil n/k\rceil-1$ objects, then, since $\lceil n/k\rceil - 1 < n/k$, the sum rule (1.1) would give fewer than $k\cdot n/k = n$ objects in total. The argument never looks at *how* the objects were placed, which is why the principle powers existence proofs such as Erdős–Szekeres (1.3) and Ramsey's theorem without producing the crowded box.`,
      caption: String.raw`Click a box to drop a ball into it (shift-click takes one out), or use the buttons. However you balance, the fullest box (red outline) never goes below the dashed level $\lceil n/k\rceil$. The right panel records the fullest box after every ball against the staircase $\lceil n/k\rceil$: the shaded region under it is unreachable, and the "emptiest box" strategy runs exactly along its edge.`,
      deps: ['comb-1.1'],
      refs: ['Aigner ch. 1'],
      tags: ['pigeonhole', 'existence'],
      viz(v) {
        let k = 5, seq = [];
        const counts = () => { const c = Array(k).fill(0); for (const b of seq) c[b]++; return c; };
        const greedy = () => { const c = counts(); let b = 0; c.forEach((x, i) => { if (x < c[b]) b = i; }); seq.push(b); };
        const fill = () => { seq = []; for (let i = 0; i < 2 * k + 1; i++) greedy(); };
        v.slider('boxes $k$', 2, 8, 5, { int: true, onChange: (x) => { k = x; fill(); } });
        fill();
        const r = v.rng(11);
        v.button('Drop into the emptiest box', () => { if (seq.length < 64) greedy(); });
        v.button('Drop at random', () => { if (seq.length < 64) seq.push(Math.floor(r() * k)); });
        v.button('Undo', () => { seq.pop(); });
        v.button('Empty all', () => { seq = []; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.3 });
        const B = v.stage({ x: [0, 12], y: [0, 4], axes: 'box', height: 330, weight: 1, xlabel: 'balls n', ylabel: 'fullest box', title: 'fullest box after each ball' });
        let geo = null;
        A.onClick((x, y, mod) => {
          if (!geo) return; const [px] = toPx(A, x, y); const b = Math.floor((px - geo.x0) / geo.bw);
          if (b < 0 || b >= k) return;
          if (mod.shift) { const i = seq.lastIndexOf(b); if (i >= 0) seq.splice(i, 1); } else if (seq.length < 64) seq.push(b);
        });
        v.render(() => {
          const P = pen(v, A), W = P.W, H = P.H, c = counts(), n = seq.length, mx = Math.max(0, ...c), ceil = Math.ceil(n / k);
          const cap = Math.max(4, mx + 1, ceil + 1), x0 = 12, bw = (W - 86) / k, top = 34, bot = H - 30, rr = Math.min(bw * 0.3, (bot - top) / (2 * cap) * 0.92);
          geo = { x0, bw };
          const lvl = (h) => bot - h * 2 * rr * 1.04, xe = x0 + k * bw;
          for (let b = 0; b < k; b++) {
            const xl = x0 + b * bw + bw * 0.12, w = bw * 0.76, full = c[b] === mx && mx > 0;
            P.rect(xl, top - 6, w, bot - top + 8, { fill: full ? 'red' : 'muted', fillAlpha: full ? 0.07 : 0.05, color: full ? 'red' : 'faint', width: full ? 2.2 : 1.2, r: 4 });
            for (let j = 0; j < c[b]; j++) P.dot(x0 + (b + 0.5) * bw, lvl(j) - rr, rr * 0.92, { fill: CAT[b % CAT.length] });
            P.text(String(c[b]), x0 + (b + 0.5) * bw, bot + 15, { align: 'center', size: 13, weight: 600, color: full ? 'red' : 'ink' });
          }
          if (n > 0) {
            P.line(x0, lvl(ceil) + 0.5, xe + 6, lvl(ceil) + 0.5, { color: 'red', width: 1.6, dash: [7, 5] });
            P.text(`⌈n/k⌉ = ${ceil}`, xe + 10, lvl(ceil), { size: 12, color: 'red', weight: 700 });
            P.line(x0, lvl(n / k), xe + 6, lvl(n / k), { color: 'muted', width: 1.1, dash: [2, 4] });
            P.text(`n/k = ${v.fmt(n / k, 3)}`, xe + 10, lvl(n / k) + (Math.abs(lvl(n / k) - lvl(ceil)) < 16 ? 14 : 0), { size: 11, color: 'muted' });
          }
          A.corner(`${n} balls · ${k} boxes`, 'tl', { color: 'ink', weight: 600 });
          // history panel
          const hist = [0]; const cc = Array(k).fill(0); for (const b of seq) { cc[b]++; hist.push(Math.max(...cc)); }
          const xm = Math.max(12, n + 1), ym = Math.max(4, Math.max(...hist) + 1);
          B.setView([0, xm], [0, ym]);
          B.setTicks(null, Array.from({ length: ym + 1 }, (_, i) => i));
          const step = (f) => { const pts = []; for (let t = 0; t <= xm; t++) { pts.push([t, f(t)]); pts.push([t + 1, f(t)]); } return pts; };
          const stair = step((t) => Math.ceil(t / k));
          B.path(stair.concat([[xm + 1, 0], [0, 0]]), { fill: 'red', fillAlpha: 0.08, stroke: false, close: true });
          B.path(stair, { color: 'red', width: 4, alpha: 0.45 });
          const hp = []; hist.forEach((h, t) => { hp.push([t, h]); if (t < n) hp.push([t + 1, h]); });
          B.path(hp, { color: 'gold', width: 2.2 });
          hist.forEach((h, t) => B.dot(t, h, { r: t === n ? 5 : 3.2, color: h === Math.ceil(t / k) ? 'green' : 'gold' }));
          B.text('unreachable', xm * 0.55, 0.35, { align: 'center', size: 11.5, color: 'red', weight: 600 });
        });
        v.legend([['red', '$\\lceil n/k\\rceil$ (the bound)'], ['gold', 'your fullest box'], ['green', 'meets the bound', { dot: true }]]);
        v.readout(() => {
          const c = counts(), n = seq.length, mx = Math.max(0, ...c), ceil = Math.ceil(n / k);
          if (!n) return 'No balls yet — drop some in.';
          return `$n = ${n}$ balls in $k = ${k}$ boxes: the fullest box holds **${mx}** $\\ge \\lceil ${n}/${k}\\rceil = ${ceil}$. ` + (mx === ceil ? 'This filling is as balanced as possible and still reaches the bound.' : `This filling exceeds the bound by ${mx - ceil}; "emptiest box" would reach it exactly — but never go below it.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Erdős–Szekeres monotone subsequence theorem',
      credit: 'Erdős & Szekeres, 1935',
      statement: String.raw`Every sequence of $r^2+1$ distinct real numbers has a monotone subsequence (strictly increasing or strictly decreasing) of length $r+1$. More generally, any sequence of more than $rs$ distinct real numbers has an increasing subsequence of length $r+1$ or a decreasing subsequence of length $s+1$. Both bounds are sharp: some sequences of length $r^2$ (resp. $rs$) have neither.`,
      idea: String.raw`Label the $k$-th term with $(i_k, d_k)$, the lengths of the longest increasing and longest decreasing subsequences *ending* at it. For $j<k$ the labels differ: if $a_j<a_k$ then $i_k>i_j$, and if $a_j>a_k$ then $d_k>d_j$. If every label lay in $\{1,\dots,r\}^2$ we would have $r^2+1$ distinct pigeons in $r^2$ holes, contradicting the pigeonhole principle (1.2). The sharp example is $r$ increasing runs of length $r$, each run lower than the one before.`,
      caption: String.raw`Drag terms up and down, shuffle, or load the extremal sequence. Each term carries $i_k$ (green, above) and $d_k$ (red, below), and the right panel puts term $k$ at the point $(i_k, d_k)$. Labels never collide, so with $r^2+1$ terms some term must land outside the shaded $r\times r$ box; the green and red chains are the longest monotone runs ending at the gold term. Switch to length $r^2$: the extremal sequence then fills the box exactly.`,
      deps: ['comb-1.2'],
      see: ['algo-7.6', 'comb-7.5'],
      refs: ['Aigner ch. 1'],
      tags: ['pigeonhole', 'sequences'],
      viz(v) {
        const MAXN = 26;
        let mode = 'extremal', sel = null, seed = 3;
        const rS = v.slider('$r$', 2, 5, 3, { int: true, onChange: () => fresh(mode) });
        const lenS = v.select('length', [{ value: 'plus', label: '$r^2+1$' }, { value: 'sq', label: '$r^2$ (one short)' }], 'plus', { onChange: () => fresh(mode) });
        v.button('Shuffle', () => { seed++; fresh('shuffle'); });
        v.button('Extremal sequence', () => fresh('extremal'));
        const A = v.stage({ x: [0.3, 10.7], y: [-0.05, 1.09], axes: false, height: 330, weight: 1.45, title: 'the sequence (drag any term)' });
        const B = v.stage({ x: [0.3, 5.7], y: [0.3, 5.7], axes: false, height: 330, weight: 1, equal: true, title: 'term $k$ placed at $(i_k, d_k)$' });
        const hs = Array.from({ length: MAXN }, (_, i) => A.handle(i + 1, 0.5, { color: 'blue', r: 6, constrain: (x, y) => [i + 1, v.M.clamp(y, 0.04, 0.98)] }));
        hs.forEach((h, i) => { h.onDrag = () => { sel = i; }; });
        const N = () => rS.value * rS.value + (lenS.value === 'plus' ? 1 : 0);
        function fresh(m) {
          mode = m; const r = rS.value, n = N(); let vals;
          if (m === 'extremal') {
            vals = []; for (let b = 0; b < r; b++) for (let t = 0; t < r; t++) vals.push((r - 1 - b) * r + t + 1);
            if (n > r * r) vals.push(Math.floor((r * r) / 2) + 0.5);
          } else { const q = v.rng(seed * 977); vals = q.shuffle(Array.from({ length: n }, (_, i) => i + 1)); }
          const lo = Math.min(...vals), hi = Math.max(...vals);
          hs.forEach((h, i) => { h.visible = i < n; h.x = i + 1; h.y = i < n ? 0.06 + (0.9 * (vals[i] - lo)) / (hi - lo) : 0.5; });
          sel = null; v.invalidate();
        }
        fresh('extremal');
        let st = null;
        B.onClick((x, y) => { if (!st) return; let best = -1, bd = 0.45; st.inc.forEach((iv, k) => { const d = Math.hypot(iv - x, st.dec[k] - y); if (d < bd) { bd = d; best = k; } }); sel = best >= 0 ? best : null; });
        const chain = (ptr, i) => { const c = []; while (i >= 0) { c.unshift(i); i = ptr[i]; } return c; };
        v.render(() => {
          const r = rS.value, n = N(), a = hs.slice(0, n).map((h) => h.y);
          const inc = [], dec = [], pi = [], pd = [];
          for (let i = 0; i < n; i++) {
            inc[i] = 1; dec[i] = 1; pi[i] = -1; pd[i] = -1;
            for (let j = 0; j < i; j++) {
              if (a[j] < a[i] && inc[j] + 1 > inc[i]) { inc[i] = inc[j] + 1; pi[i] = j; }
              if (a[j] > a[i] && dec[j] + 1 > dec[i]) { dec[i] = dec[j] + 1; pd[i] = j; }
            }
          }
          const esc = inc.map((x, i) => x > r || dec[i] > r), firstEsc = esc.indexOf(true);
          const cur = sel != null && sel < n ? sel : firstEsc >= 0 ? firstEsc : n - 1;
          st = { inc, dec, esc, cur, maxI: Math.max(...inc), maxD: Math.max(...dec) };
          hs.forEach((h, i) => { h.color = i === cur ? 'gold' : esc[i] ? 'green' : 'blue'; });
          A.setView([0.3, n + 0.7], [-0.05, 1.09]);
          A.path(a.map((y, i) => [i + 1, y]), { color: 'faint', width: 1 });
          const ci = chain(pi, cur), cd = chain(pd, cur);
          A.path(ci.map((i) => [i + 1, a[i]]), { color: 'green', width: 3.2 });
          A.path(cd.map((i) => [i + 1, a[i]]), { color: 'red', width: 3.2, dash: [7, 5] });
          for (let i = 0; i < n; i++) {
            A.text(String(inc[i]), i + 1, a[i], { dy: -15, align: 'center', size: 11.5, weight: 700, color: 'green' });
            A.text(String(dec[i]), i + 1, a[i], { dy: 15, align: 'center', size: 11.5, weight: 700, color: 'red' });
          }
          // pigeonhole grid
          const M = Math.max(r + 1, st.maxI, st.maxD);
          B.setView([0.3, M + 0.7], [0.3, M + 0.7]);
          for (let i = 1; i <= M; i++) for (let d = 1; d <= M; d++) {
            const inside = i <= r && d <= r;
            B.rect(i - 0.47, d - 0.47, i + 0.47, d + 0.47, { fill: inside ? 'blue' : 'green', fillAlpha: inside ? 0.1 : 0.05, color: inside ? 'blue' : 'faint', width: inside ? 1 : 0.6, alpha: inside ? 0.35 : 1 });
          }
          B.rect(0.5, 0.5, r + 0.5, r + 0.5, { color: 'blue', width: 2.2 });
          for (let i = 1; i <= M; i++) { B.text(String(i), i, 0.5, { dy: 9, align: 'center', size: 10.5, color: 'green', halo: false }); B.text(String(i), 0.5, i, { dx: -7, align: 'right', size: 10.5, color: 'red', halo: false }); }
          for (let k = 0; k < n; k++) {
            const col = k === cur ? 'gold' : esc[k] ? 'green' : 'blue';
            B.dot(inc[k], dec[k], { r: k === cur ? 11 : 9.5, color: col });
            B.text(String(k + 1), inc[k], dec[k], { align: 'center', size: k + 1 > 9 ? 9.5 : 11, weight: 700, color: 'panel', halo: false });
          }
          B.text(`${r}×${r} = ${r * r} holes`, r + 0.5, r + 0.5, { dx: -4, dy: -10, align: 'right', size: 11.5, color: 'blue', weight: 600 });
        });
        v.legend([['green', '$i_k$: longest increasing run ending at term $k$'], ['red', '$d_k$: longest decreasing run ending at $k$', { dash: true }], ['gold', 'selected term', { dot: true }]]);
        v.readout(() => {
          if (!st) return ''; const r = rS.value, n = N();
          let t = `$${n}$ terms, labels in ${r * r} holes. Longest increasing subsequence **${st.maxI}**, longest decreasing **${st.maxD}**. `;
          if (n > r * r) t += `The ${n} labels are distinct and only ${r * r} fit in the box, so one escapes: term ${st.cur + 1} ends a monotone run of length ${Math.max(st.inc[st.cur], st.dec[st.cur])} $\\ge r+1 = ${r + 1}$.`;
          else t += st.maxI <= r && st.maxD <= r ? `With only $r^2 = ${n}$ terms every label fits: no monotone subsequence of length ${r + 1} — the bound $r^2+1$ is sharp.` : `A label escapes here, but $r^2$ terms do not force it (try the extremal sequence).`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Method',
      name: 'Double counting',
      statement: String.raw`To prove that two expressions are equal, exhibit one finite set that each of them counts. The basic instance: for a relation $R\subseteq A\times B$ between finite sets,
$$\sum_{a\in A}\bigl|\{b : (a,b)\in R\}\bigr| \;=\; |R| \;=\; \sum_{b\in B}\bigl|\{a : (a,b)\in R\}\bigr|,$$
i.e. the row sums and the column sums of the 0/1 incidence matrix have the same total. For example, in every finite graph $\sum_v \deg v = 2|E|$ (the handshake lemma; hence the number of odd-degree vertices is even), and $\sum_{k} k\binom nk = n\,2^{n-1}$.`,
      idea: String.raw`Both sides count the 1s of one matrix, grouped by rows on one side and by columns on the other; the sum rule (1.1) makes the two totals equal. For the handshake lemma the matrix is vertices × edges, and every column (an edge) holds exactly two 1s. For the binomial identity it is subsets × elements of an $n$-set: row $S$ holds $|S|$ ones, and every column holds $2^{n-1}$, since exactly half of the subsets contain a given element.`,
      caption: String.raw`Click cells of the people × clubs matrix to change memberships; in the handshake view click two vertices to add or remove the edge between them. The Σ column and the Σ row are computed separately, and their totals (bottom-right) always agree. In the third view the rows are the subsets of an $n$-set: summed by size they give $\sum_k k\binom nk$, summed by element $n2^{n-1}$ — two stacks of the same height.`,
      deps: ['comb-1.1'],
      see: ['graph-1.2.1'],
      refs: ['Aigner ch. 1'],
      tags: ['double counting', 'bijections'],
      viz(v) {
        const mode = v.select('', [{ value: 'clubs', label: 'people × clubs' }, { value: 'hand', label: 'handshake lemma' }, { value: 'sub', label: 'subsets × elements' }], 'clubs');
        const nS = v.slider('$n$', 2, 4, 4, { int: true });
        const PEOPLE = ['Ana', 'Ben', 'Caz', 'Dev', 'Eli'], CLUBS = ['chess', 'choir', 'drama', 'rowing'];
        const M = [[1, 0, 1, 0], [1, 1, 0, 1], [0, 1, 1, 1], [0, 0, 1, 0], [1, 0, 0, 1]];
        const VN = 6; let E = [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [1, 4], [4, 5]], pick = null;
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], axes: false, height: 350, weight: 1, equal: true });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 1 });
        const TL = v.table(L, { rows: 6, cols: 5, size: 13, maxCell: 46, labelSize: 12.5 });
        const TR = v.table(R, { rows: 7, cols: 8, size: 12, maxCell: 40, labelSize: 11.5 });
        const vpos = (i) => [Math.cos(Math.PI / 2 - (2 * Math.PI * i) / VN), Math.sin(Math.PI / 2 - (2 * Math.PI * i) / VN)];
        L.onClick((x, y) => {
          if (mode.value === 'clubs') { const c = TL.hit(x, y); if (c && c.i >= 0 && c.i < 5 && c.j >= 0 && c.j < 4) M[c.i][c.j] ^= 1; }
          else if (mode.value === 'hand') {
            let hit = -1; for (let i = 0; i < VN; i++) { const [px, py] = vpos(i); if (Math.hypot(px - x, py - y) < 0.22) hit = i; }
            if (hit < 0) { pick = null; return; }
            if (pick == null || pick === hit) { pick = pick === hit ? null : hit; return; }
            const a = Math.min(pick, hit), b = Math.max(pick, hit), idx = E.findIndex((e) => e[0] === a && e[1] === b);
            if (idx >= 0) E.splice(idx, 1); else { E.push([a, b]); E.sort((p, q) => p[0] - q[0] || p[1] - q[1]); }
            pick = null;
          }
        });
        let info = '';
        v.render(() => {
          const md = mode.value; nS.el.hidden = md !== 'sub';
          if (md === 'clubs') {
            const rs = M.map((r) => r.reduce((a, b) => a + b, 0)), cs = CLUBS.map((_, j) => M.reduce((a, r) => a + r[j], 0)), T = rs.reduce((a, b) => a + b, 0);
            TL.draw({
              rows: 6, cols: 5, rowLabels: [...PEOPLE, 'Σ'], colLabels: [...CLUBS, 'Σ'],
              value: (i, j) => (i < 5 && j < 4 ? M[i][j] : i < 5 ? rs[i] : j < 4 ? cs[j] : `${T} = ${cs.reduce((a, b) => a + b, 0)}`),
              fill: (i, j) => (i < 5 && j < 4 ? (M[i][j] ? ['blue', 0.32] : null) : i === 5 && j === 4 ? ['green', 0.3] : i === 5 ? ['purple', 0.14] : ['orange', 0.14]),
              textColor: (i, j) => (i < 5 && j < 4 && !M[i][j] ? 'faint' : j === 4 && i < 5 ? 'orange' : i === 5 && j < 4 ? 'purple' : 'ink'),
              weight: (i, j) => (i === 5 || j === 4 ? 700 : 500),
            });
            // bipartite picture
            const P = pen(v, R), W = P.W, H = P.H, xl = W * 0.26, xr = W * 0.74;
            const py = (i) => 48 + (i * (H - 82)) / 4, cy = (j) => 60 + (j * (H - 106)) / 3;
            for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if (M[i][j]) P.line(xl, py(i), xr, cy(j), { color: 'blue', width: 1.8, alpha: 0.55 });
            for (let i = 0; i < 5; i++) { P.dot(xl, py(i), 11, { fill: 'orange' }); P.text(String(rs[i]), xl, py(i), { align: 'center', size: 12, color: 'panel', weight: 700, halo: false }); P.text(PEOPLE[i], xl - 17, py(i), { align: 'right', size: 12.5 }); }
            for (let j = 0; j < 4; j++) { P.rect(xr - 11, cy(j) - 11, 22, 22, { fill: 'purple', r: 4 }); P.text(String(cs[j]), xr, cy(j), { align: 'center', size: 12, color: 'panel', weight: 700, halo: false }); P.text(CLUBS[j], xr + 17, cy(j), { size: 12.5 }); }
            P.text('number inside = row / column sum', W / 2, 16, { align: 'center', size: 11.5, color: 'muted' });
            P.text(`${T} membership lines`, W / 2, H - 12, { align: 'center', size: 12, color: 'muted' });
            info = `Row sums (clubs per person) ${rs.join(' + ')} $= ${T}$; column sums (members per club) ${cs.join(' + ')} $= ${T}$. Both count the same ${T} (person, club) pairs — the lines on the right.`;
          } else if (md === 'hand') {
            const deg = Array(VN).fill(0); for (const [a, b] of E) { deg[a]++; deg[b]++; }
            for (const [a, b] of E) { const [x1, y1] = vpos(a), [x2, y2] = vpos(b); L.line(x1, y1, x2, y2, { color: 'blue', width: 2.4 }); }
            for (let i = 0; i < VN; i++) {
              const [x, y] = vpos(i), odd = deg[i] % 2 === 1;
              L.dot(x, y, { r: 14, color: i === pick ? 'gold' : odd ? 'red' : 'teal' });
              L.text(LET[i], x, y, { align: 'center', size: 13, weight: 700, color: 'panel', halo: false });
              L.text(`deg ${deg[i]}`, x * 1.25, y * 1.2, { align: 'center', size: 11, color: odd ? 'red' : 'muted', weight: 600 });
            }
            L.corner(pick == null ? 'click two vertices to toggle an edge' : `now click a second vertex`, 'tl');
            const m = E.length, sd = deg.reduce((a, b) => a + b, 0);
            TR.draw({
              rows: VN + 1, cols: m + 1, rowLabels: [...LET.slice(0, VN).split(''), 'Σ'], colLabels: [...E.map(([a, b]) => LET[a] + LET[b]), 'Σ'],
              value: (i, j) => (i < VN && j < m ? (E[j][0] === i || E[j][1] === i ? 1 : '') : i < VN ? deg[i] : j < m ? 2 : `${sd}`),
              fill: (i, j) => (i < VN && j < m ? (E[j][0] === i || E[j][1] === i ? ['blue', 0.32] : null) : i === VN && j === m ? ['green', 0.3] : i === VN ? ['purple', 0.14] : ['orange', 0.14]),
              textColor: (i, j) => (j === m && i < VN ? (deg[i] % 2 ? 'red' : 'orange') : i === VN && j < m ? 'purple' : 'ink'),
              weight: (i, j) => (i === VN || j === m ? 700 : 500),
            });
            const odd = deg.filter((d) => d % 2).length;
            info = `Degrees ${deg.join(' + ')} $= ${sd}$ and every edge column holds two 1s: $2|E| = 2\\cdot ${m} = ${2 * m}$. So $\\sum\\deg = 2|E|$ is even, and the number of odd-degree vertices (red) is **${odd}**, an even number.`;
          } else {
            const n = nS.value, rows = 1 << n, sz = (S) => popcount(S);
            TL.draw({
              rows: rows + 1, cols: n + 1, maxCell: 40,
              rowLabels: [...Array.from({ length: rows }, (_, S) => (S ? '{' + bitsOf(S, n).map((b, i) => (b ? LET[i] : '')).join('') + '}' : '∅')), 'Σ'],
              colLabels: [...LET.slice(0, n).split(''), 'Σ'],
              value: (i, j) => (i < rows && j < n ? (bitsOf(i, n)[j] ? 1 : '') : i < rows ? sz(i) : j < n ? rows / 2 : `${n * rows / 2}`),
              fill: (i, j) => (i < rows && j < n ? (bitsOf(i, n)[j] ? [CAT[sz(i) % CAT.length], 0.32] : null) : i === rows && j === n ? ['green', 0.3] : i === rows ? ['purple', 0.14] : ['orange', 0.14]),
              weight: (i, j) => (i === rows || j === n ? 700 : 500),
            });
            const P = pen(v, R), W = P.W, H = P.H, tot = n * rows / 2, top = 50, bot = H - 40, hpx = (bot - top) / tot, bw = W * 0.22;
            const xa = W * 0.2, xb = W * 0.58;
            let y = bot;
            for (let k = 1; k <= n; k++) { const h = k * binom(n, k) * hpx; P.rect(xa, y - h, bw, h, { fill: CAT[k % CAT.length], fillAlpha: 0.45, color: 'panel', width: 1.5 }); if (h > 15) P.text(`${k}·${binom(n, k)}`, xa + bw / 2, y - h / 2, { align: 'center', size: 12, weight: 600 }); y -= h; }
            y = bot;
            for (let j = 0; j < n; j++) { const h = (rows / 2) * hpx; P.rect(xb, y - h, bw, h, { fill: 'purple', fillAlpha: 0.18 + 0.12 * (j % 2), color: 'panel', width: 1.5 }); P.text(`${LET[j]}: ${rows / 2}`, xb + bw / 2, y - h / 2, { align: 'center', size: 12, weight: 600 }); y -= h; }
            P.text('rows, by size k', xa + bw / 2, bot + 16, { align: 'center', size: 11.5, color: 'orange', weight: 600 });
            P.text('columns, by element', xb + bw / 2, bot + 16, { align: 'center', size: 11.5, color: 'purple', weight: 600 });
            P.line(xa - 6, top - 0.5, xb + bw + 6, top - 0.5, { color: 'green', width: 1.6, dash: [5, 4] });
            P.text(`both stacks = ${tot}`, W / 2, top - 14, { align: 'center', size: 12.5, color: 'green', weight: 700 });
            const terms = []; for (let k = 1; k <= n; k++) terms.push(`${k}\\cdot${binom(n, k)}`);
            info = `Counting the 1s by rows: $\\sum_k k\\binom{${n}}{k} = ${terms.join('+')} = ${tot}$. By columns: each of the ${n} elements lies in half of the $2^{${n}}$ subsets, $${n}\\cdot 2^{${n - 1}} = ${tot}$.`;
          }
        });
        v.readout(() => info);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Permutations and falling factorials',
      statement: String.raw`A **$k$-permutation** of an $n$-element set is a sequence of $k$ distinct elements of it — equivalently an injective map $\{1,\dots,k\}\to[n]$. Their number is the **falling factorial**
$$n^{\underline k} = n(n-1)\cdots(n-k+1) = \frac{n!}{(n-k)!}\qquad (0\le k\le n),$$
with $n^{\underline 0} = 1$ and $n^{\underline k} = 0$ for $k>n$. The case $k=n$ counts the $n!$ **permutations** (orderings) of the set.`,
      idea: String.raw`Fill seat 1, then seat 2, and so on. Seat $i$ can take any of the $n-i+1$ people not yet seated. *Which* people are left depends on the earlier choices, but *how many* does not, and that is all the product rule (1.1) needs.`,
      caption: String.raw`Click people to seat them in order (click a seat to empty it and the seats after it). Below, every one of the $n^{\underline k}$ seatings is drawn as a little column (seat 1 on top), nested by the person in seat 1 (blocks), then seat 2 (rows), then the rest. The blocks still compatible with your partial seating stay lit: each new seat divides the candidates by the number of choices it had.`,
      deps: ['comb-1.1'],
      refs: ['Stanley EC1 §1.1'],
      tags: ['permutations', 'counting'],
      viz(v) {
        let seats = [0, 2];
        const nS = v.slider('people $n$', 2, 6, 5, { int: true, onChange: () => { seats = seats.filter((p) => p < nS.value); kS.set(Math.min(kS.value, nS.value)); } });
        const kS = v.slider('seats $k$', 1, 4, 3, { int: true, onChange: () => { if (kS.value > nS.value) kS.set(nS.value); seats = seats.slice(0, kS.value); } });
        v.button('Clear seats', () => { seats = []; });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 128, full: true });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, full: true, title: 'all ordered seatings, nested by seat 1 (blocks) and seat 2 (rows)' });
        const NM = ['Ada', 'Bo', 'Cy', 'Di', 'Ed', 'Flo'];
        let geo = null;
        T.onClick((x, y) => {
          if (!geo) return; const [px, py] = toPx(T, x, y);
          for (let i = 0; i < geo.n; i++) if (Math.hypot(px - geo.px(i), py - geo.py) < 17) { if (!seats.includes(i) && seats.length < geo.k) seats.push(i); return; }
          for (let j = 0; j < geo.k; j++) if (Math.abs(px - geo.sx(j)) < 24 && Math.abs(py - geo.py) < 24 && j < seats.length) { seats = seats.slice(0, j); return; }
        });
        v.render(() => {
          const n = nS.value, k = Math.min(kS.value, n); seats = seats.filter((p) => p < n).slice(0, k);
          const P = pen(v, T), W = P.W, H = P.H, py = H * 0.5, gap = Math.min(46, (W * 0.42) / n);
          geo = { n, k, py, px: (i) => 30 + gap * (i + 0.5), sx: (j) => W * 0.5 + 34 + j * Math.min(84, (W * 0.5 - 90) / Math.max(1, k - 0.3)) };
          P.text('people', 22, 16, { size: 12, color: 'muted', weight: 600 });
          for (let i = 0; i < n; i++) {
            const used = seats.includes(i);
            P.dot(geo.px(i), py, 15, { fill: CAT[i], fillAlpha: used ? 0.22 : 1 });
            P.text(LET[i].toUpperCase(), geo.px(i), py, { align: 'center', size: 13, weight: 700, color: used ? 'muted' : 'panel', halo: false });
            P.text(NM[i], geo.px(i), py + 26, { align: 'center', size: 10.5, color: 'muted', halo: false });
          }
          P.text('seats', W * 0.5 + 12, 16, { size: 12, color: 'muted', weight: 600 });
          for (let j = 0; j < k; j++) {
            const x = geo.sx(j), filled = j < seats.length, next = j === seats.length;
            P.rect(x - 22, py - 22, 44, 44, { fill: next ? 'gold' : 'muted', fillAlpha: next ? 0.18 : 0.06, color: next ? 'gold' : 'faint', width: next ? 2.2 : 1.3, r: 6 });
            P.text(String(j + 1), x - 18, py - 15, { size: 10, color: 'muted', halo: false });
            if (filled) { P.dot(x, py, 15, { fill: CAT[seats[j]] }); P.text(LET[seats[j]].toUpperCase(), x, py, { align: 'center', size: 13, weight: 700, color: 'panel', halo: false }); }
            P.text(`${n - j} choices`, x, py + 36, { align: 'center', size: 11.5, color: next ? 'gold' : j < seats.length ? 'green' : 'muted', weight: 600 });
            if (j < k - 1) P.text('×', (x + geo.sx(j + 1)) / 2, py + 36, { align: 'center', size: 13, color: 'muted' });
          }
          const tot = fall(n, k);
          P.tex(String.raw`n^{\underline{${k}}} = ${Array.from({ length: k }, (_, j) => n - j).join(String.raw`\cdot `)} = ${tot}`, W - 12, 18, { align: 'right', size: 15 });
          // nested listing
          const Q = pen(v, B), BW = Q.W, BH = Q.H, all = kPerms(n, k);
          const cols = n, rowsN = k >= 2 ? n - 1 : 1, per = k >= 3 ? fall(n - 2, k - 2) : 1, sub = k >= 4 ? n - 3 : per;
          const cw = (BW - 16 - (cols - 1) * 8) / cols, rh = (BH - 14 - (rowsN - 1) * 4) / rowsN;
          const nsub = per / sub, q = Math.max(2.2, Math.min(22, (cw - 8 - (nsub - 1) * 4) / (per * 1.3), (rh - 6) / (k + 0.3)));
          const pre = seats;
          all.forEach((w) => {
            const c = w[0], rIdx = k >= 2 ? w[1] - (w[1] > w[0] ? 1 : 0) : 0;
            const idxInRow = all.filter((u) => u[0] === w[0] && (k < 2 || u[1] === w[1])).indexOf(w);
            const sb = Math.floor(idxInRow / sub), x0 = 8 + c * (cw + 8), y0 = 7 + rIdx * (rh + 4);
            const rowW = per * q * 1.3 + (nsub - 1) * 4, xs = x0 + (cw - rowW) / 2 + idxInRow * q * 1.3 + sb * 4, ys = y0 + (rh - k * q) / 2;
            const match = pre.every((p, t) => w[t] === p), exact = match && pre.length === k;
            w.forEach((p, t) => { Q.rect(xs, ys + t * q, q * 1.05, q * 0.92, { fill: CAT[p], fillAlpha: match ? 0.95 : 0.16 }); if (q >= 15 && match) Q.text(LET[p].toUpperCase(), xs + q * 0.52, ys + t * q + q * 0.47, { align: 'center', size: q * 0.55, weight: 700, color: 'panel', halo: false }); });
            if (exact) Q.rect(xs - 2, ys - 2, q * 1.05 + 4, k * q + 3, { color: 'ink', width: 2 });
          });
          for (let c = 0; c < cols; c++) { const lit = !pre.length || pre[0] === c; Q.rect(8 + c * (cw + 8) - 2, 3, cw + 4, BH - 6, { color: lit ? CAT[c] : 'faint', width: lit && pre.length ? 2 : 1, r: 5, alpha: lit ? 0.9 : 0.5 }); }
        });
        v.readout(() => {
          const n = nS.value, k = Math.min(kS.value, n), tot = fall(n, k);
          let left = tot; for (let j = 0; j < seats.length; j++) left /= n - j;
          return `$n^{\\underline{${k}}} = ${tot}$ ordered seatings${k === n ? ` $= ${n}!$ (all permutations)` : ''}. ` + (seats.length ? `Seated so far: ${seats.map((p) => LET[p].toUpperCase()).join(', ')} — **${left}** seatings remain compatible (lit), $= ${tot}/(${Array.from({ length: seats.length }, (_, j) => n - j).join('\\cdot')})$.` : 'Click people to start seating them.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Binomial coefficients',
      statement: String.raw`For integers $0\le k\le n$ the **binomial coefficient** $\binom nk$ ("$n$ choose $k$") is the number of $k$-element subsets of an $n$-element set; set $\binom nk = 0$ when $k<0$ or $k>n$. Counting ordered selections in two ways gives
$$\binom nk = \frac{n^{\underline k}}{k!} = \frac{n!}{k!\,(n-k)!},$$
and taking complements gives the symmetry $\binom nk = \binom n{n-k}$.`,
      idea: String.raw`Each $k$-subset can be listed in $k!$ orders (1.5 with $k=n$), and every ordered selection of $k$ distinct elements comes from exactly one subset. So the $n^{\underline k}$ ordered selections split into $\binom nk$ classes of size $k!$, and double counting (1.4) gives $\binom nk\cdot k! = n^{\underline k}$.`,
      caption: String.raw`Click elements of the $n$-set to build a subset; its size is $k$. On the right each row is one $k$-subset and the row is filled with its $k!$ orderings (each ordering a strip of coloured squares, read left to right). So the table holds every ordered selection exactly once: rows × columns $= n^{\underline k}$. Your subset's row is highlighted.`,
      deps: ['comb-1.5', 'comb-1.4'],
      refs: ['Stanley EC1 §1.2', 'Aigner ch. 1'],
      tags: ['binomial coefficients', 'subsets'],
      viz(v) {
        let set = [0, 2, 3];
        const nS = v.slider('$n$', 3, 6, 5, { int: true, onChange: () => { set = set.filter((i) => i < nS.value); } });
        v.button('Clear', () => { set = []; });
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], axes: false, equal: true, height: 340, weight: 0.7, title: 'click to choose' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.6 });
        const pos = (i, n) => [Math.cos(Math.PI / 2 - (2 * Math.PI * i) / n), Math.sin(Math.PI / 2 - (2 * Math.PI * i) / n)];
        A.onClick((x, y) => { const n = nS.value; for (let i = 0; i < n; i++) { const [px, py] = pos(i, n); if (Math.hypot(px - x, py - y) < 0.3) { set = set.includes(i) ? set.filter((j) => j !== i) : [...set, i].sort((a, b) => a - b); return; } } });
        v.render(() => {
          const n = nS.value, k = set.length;
          A.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          for (let i = 0; i < n; i++) {
            const [x, y] = pos(i, n), on = set.includes(i);
            A.dot(x, y, { r: on ? 17 : 14, color: CAT[i], alpha: on ? 1 : 0.25 });
            A.text(LET[i], x, y, { align: 'center', size: 15, weight: 700, color: on ? 'panel' : 'ink', halo: false, math: true });
          }
          A.text(`k = ${k}`, 0, 0, { align: 'center', size: 18, weight: 700, color: 'ink' });
          // table of subsets × orderings
          const P = pen(v, B), W = P.W, H = P.H, subs = kSubsets(n, k), rows = subs.length, ords = k <= 4 ? perms(Array.from({ length: k }, (_, i) => i)) : null;
          const lw = 18 + n * 9, top = 30, rh = Math.min(30, (H - top - 8) / rows), cols = ords ? ords.length : 1;
          const gw = (W - lw - 10) / cols, q = Math.max(2.5, Math.min(rh * 0.62, (gw - 5) / Math.max(1, k)));
          P.text(k <= 4 ? `${rows} subsets × ${cols} orderings each` : `${rows} subsets (each has k! = ${fact(k)} orderings — too many to draw)`, lw, 13, { size: 12, color: 'muted', weight: 600 });
          subs.forEach((S, r) => {
            const y = top + r * rh, cur = S.length === set.length && S.every((x, i) => x === set[i]);
            if (cur) P.rect(4, y, W - 8, rh, { fill: 'gold', fillAlpha: 0.2, r: 4 });
            P.text(k ? '{' + S.map((i) => LET[i]).join(',') + '}' : '∅', lw - 8, y + rh / 2, { align: 'right', size: Math.min(12, rh * 0.62), color: cur ? 'ink' : 'muted', weight: cur ? 700 : 500, halo: false });
            if (!ords) { S.forEach((e, t) => P.rect(lw + t * (q + 1), y + (rh - q) / 2, q, q, { fill: CAT[e] })); return; }
            ords.forEach((o, c) => {
              const x0 = lw + c * gw + (gw - k * q) / 2;
              o.forEach((t, u) => { const e = S[t]; P.rect(x0 + u * q, y + (rh - q) / 2, q - 0.8, q, { fill: CAT[e], fillAlpha: cur ? 1 : 0.8 }); if (q >= 13) P.text(LET[e], x0 + u * q + q / 2 - 0.4, y + rh / 2, { align: 'center', size: q * 0.7, color: 'panel', weight: 700, halo: false }); });
            });
          });
          if (!k) P.text('the empty set has one ordering, the empty word', lw + 8, top + rh / 2, { size: 12, color: 'muted' });
        });
        v.readout(() => {
          const n = nS.value, k = set.length, c = binom(n, k);
          const idx = kSubsets(n, k).findIndex((S) => S.every((x, i) => x === set[i])) + 1;
          return `$\\binom{${n}}{${k}} = \\dfrac{${n}^{\\underline{${k}}}}{${k}!} = \\dfrac{${fall(n, k)}}{${fact(k)}} = ${c}$: the table has ${c} rows of ${fact(k)} ordered selections, $${c}\\times${fact(k)} = ${fall(n, k)}$. Your subset {${set.map((i) => LET[i]).join(', ')}} is row ${idx} of ${c}; its complement is an $${n - k}$-subset, so $\\binom{${n}}{${k}} = \\binom{${n}}{${n - k}}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Binomial theorem',
      statement: String.raw`For every integer $n\ge 0$ and all elements $x,y$ of a commutative ring (in particular all real or complex numbers),
$$(x+y)^n = \sum_{k=0}^{n}\binom nk x^{n-k}y^k .$$`,
      idea: String.raw`Multiplying out $(x+y)(x+y)\cdots(x+y)$ means choosing $x$ or $y$ from each of the $n$ brackets in every possible way, which produces $2^n$ words. A word with $k$ letters $y$ equals $x^{n-k}y^k$ (here commutativity is used), and such words correspond to the $k$-subsets of brackets from which $y$ was taken, so there are $\binom nk$ of them (1.6).`,
      caption: String.raw`Each column is one of the $2^n$ ways of picking $x$ (blue) or $y$ (orange) from the brackets, read top to bottom. Turn on "collect like terms" to sort the words by their number of $y$'s: the blocks have widths $\binom nk$, the coefficients. Click a word to see its monomial; the sliders for $x$ and $y$ check the identity numerically.`,
      deps: ['comb-1.6'],
      refs: ['Stanley EC1 §1.2', 'Aigner ch. 1'],
      tags: ['binomial coefficients', 'polynomials'],
      viz(v) {
        let sel = 9, last = null, t0 = 0, from = null;
        const nS = v.slider('$n$', 1, 7, 5, { int: true, onChange: () => { sel = Math.min(sel, (1 << nS.value) - 1); from = null; } });
        const col = v.toggle('collect like terms', true, { onChange: () => { t0 = performance.now(); } });
        const xS = v.slider('$x$', -2, 2, 1.5, { step: 0.05 }), yS = v.slider('$y$', -2, 2, 0.5, { step: 0.05 });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
        let geo = null;
        s.onClick((x, y) => { if (!geo) return; const [px] = toPx(s, x, y); let best = -1, bd = Infinity; geo.xs.forEach((cx, w) => { const d = Math.abs(cx - px); if (d < bd) { bd = d; best = w; } }); if (bd < Math.max(6, geo.cw)) sel = best; });
        v.render(() => {
          const P = pen(v, s), W = P.W, H = P.H, n = nS.value, N = 1 << n, left = 64, top = 30, bot = 70;
          const order = Array.from({ length: N }, (_, w) => w);
          const sorted = order.slice().sort((a, b) => popcount(a) - popcount(b) || a - b);
          const gap = 12, cwB = (W - left - 14) / N, cwS = (W - left - 14 - gap * n) / N;
          const target = new Array(N), base = new Array(N);
          sorted.forEach((w, i) => { target[w] = left + cwS * (i + 0.5) + gap * popcount(w); });
          order.forEach((w, i) => { base[w] = left + cwB * (i + 0.5); });
          const key = n + '|' + col.value;
          if (last !== key) { if (last && last.split('|')[0] == String(n)) { from = geo ? geo.xs.slice() : null; t0 = performance.now(); } else from = null; last = key; }
          let u = from ? Math.min(1, (performance.now() - t0) / 450) : 1; if (u < 1) v.invalidate();
          u = u * u * (3 - 2 * u);
          const dest = col.value ? target : base, xs = dest.map((x, w) => (from ? from[w] + (x - from[w]) * u : x)), cw = col.value ? cwS : cwB;
          geo = { xs, cw };
          const rh = (H - top - bot) / n;
          for (let i = 0; i < n; i++) P.text('(x + y)', left - 8, top + (i + 0.5) * rh, { align: 'right', size: Math.min(13, rh * 0.6), color: 'muted', math: true, halo: false });
          for (let w = 0; w < N; w++) {
            const b = bitsOf(w, n), x = xs[w], isSel = w === sel;
            b.forEach((bit, i) => {
              P.rect(x - cw * 0.42, top + i * rh + 1, cw * 0.84, rh - 2, { fill: bit ? 'orange' : 'blue', fillAlpha: isSel ? 0.95 : 0.55 });
              if (cw > 15 && rh > 14) P.text(bit ? 'y' : 'x', x, top + (i + 0.5) * rh, { align: 'center', size: Math.min(13, rh * 0.55, cw * 0.6), color: 'panel', weight: 700, math: true, halo: false });
            });
            if (isSel) P.rect(x - cw * 0.5, top - 3, cw, n * rh + 6, { color: 'ink', width: 2, r: 3 });
          }
          if (col.value && u === 1) for (let k = 0; k <= n; k++) {
            const ws = sorted.filter((w) => popcount(w) === k), a = xs[ws[0]] - cw * 0.45, b = xs[ws[ws.length - 1]] + cw * 0.45, yb = top + n * rh + 8;
            P.path([[a, yb], [a, yb + 5], [b, yb + 5], [b, yb]], { color: CAT[k % CAT.length], width: 1.6 });
            const stag = b - a < 26 && k % 2 ? 16 : 0;
            P.text(String(binom(n, k)), (a + b) / 2, yb + 16 + stag, { align: 'center', size: 12.5, weight: 700, color: CAT[k % CAT.length] });
            if (b - a > 44) P.tex(`x^{${n - k}}y^{${k}}`.replace('x^{0}', '').replace('y^{0}', '').replace(/\^\{1\}/g, '') || '1', (a + b) / 2, yb + 38, { size: 13, color: 'muted' });
          }
          P.text(col.value ? `${N} words in blocks of ${Array.from({ length: n + 1 }, (_, k) => binom(n, k)).join(', ')}` : `${N} words in binary order`, left, 14, { size: 12, color: 'muted', weight: 600 });
        });
        v.readout(() => {
          const n = nS.value, b = bitsOf(sel, n), k = b.reduce((a, c) => a + c, 0), x = xS.value, y = yS.value;
          const lhs = Math.pow(x + y, n); let rhs = 0; for (let j = 0; j <= n; j++) rhs += binom(n, j) * Math.pow(x, n - j) * Math.pow(y, j);
          const mono = (`x^{${n - k}}y^{${k}}`.replace('x^{0}', '').replace('y^{0}', '').replace(/\^\{1\}/g, '')) || '1';
          return `Selected word $${b.map((c) => (c ? 'y' : 'x')).join('\\,')} = ${mono}$, one of the $\\binom{${n}}{${k}} = ${binom(n, k)}$ words with ${k} $y$'s. Check: $(${v.fix(x, 2)} + ${v.fix(y, 2)})^{${n}} = ${v.fix(lhs, 4)}$ and $\\sum_k\\binom{${n}}{k}x^{${n}-k}y^k = ${v.fix(rhs, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Pascal’s rule and Pascal’s triangle',
      credit: 'Pascal, 1654 (known earlier to al-Karajī, Jia Xian and Yang Hui)',
      statement: String.raw`For $n\ge 1$ and every integer $k$,
$$\binom nk = \binom{n-1}{k-1} + \binom{n-1}{k}.$$
Writing $\binom n0,\dots,\binom nn$ as row $n$ of a triangle therefore gives **Pascal's triangle**, in which every entry is the sum of the two entries above it; $\binom nk$ is also the number of downward paths from the apex to entry $k$ of row $n$.`,
      idea: String.raw`Split the $k$-subsets of $\{1,\dots,n\}$ by whether they contain $n$. Deleting $n$ turns those that do into the $(k-1)$-subsets of $\{1,\dots,n-1\}$; those that do not are exactly the $k$-subsets of $\{1,\dots,n-1\}$. The sum rule (1.1) adds the two classes. Downward paths split the same way, according to their last step, so they are counted by the same recursion and the same numbers.`,
      caption: String.raw`Step the player to grow the triangle entry by entry, or click any entry: its two parents light up — orange for the subsets that contain $n$, teal for those that avoid it. The ribbons are the downward paths from the apex, each edge as wide as the number of paths through it, split by the parent they pass through; the right panel lists the subsets themselves, split the same way.`,
      deps: ['comb-1.6'],
      refs: ['Stanley EC1 §1.2', 'Aigner ch. 1'],
      tags: ['binomial coefficients', 'recursion'],
      viz(v) {
        const cellsOf = (N) => { const c = []; for (let n = 0; n <= N; n++) for (let k = 0; k <= n; k++) c.push([n, k]); return c; };
        const framesOf = (N) => cellsOf(N).map(([n, k]) => ({
          n, k,
          note: n === 0 ? String.raw`Row 0: $\binom00 = 1$ (the empty set).` : k === 0 || k === n ? String.raw`Edge: $\binom{${n}}{${k}} = 1$ — only one parent lies inside the triangle.` : String.raw`$\binom{${n}}{${k}} = \binom{${n - 1}}{${k - 1}} + \binom{${n - 1}}{${k}} = ${binom(n - 1, k - 1)} + ${binom(n - 1, k)} = ${binom(n, k)}$`,
        }));
        const NS = v.slider('rows', 4, 11, 8, { int: true, onChange: () => { const f = S.frame; S.reset(framesOf(NS.value), { at: f && f.n <= NS.value ? cellsOf(NS.value).findIndex(([a, b]) => a === f.n && b === f.k) : 'end' }); } });
        const start = cellsOf(8).findIndex(([a, b]) => a === 6 && b === 2);
        const S = v.steps({ frames: framesOf(8), start, still: start, speed: 4 });
        const A = v.stage({ x: [-4.6, 4.6], y: [-8.6, 0.6], axes: false, equal: true, height: 360, weight: 1.25 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1 });
        const at = (n, k) => [k - n / 2, -n];
        A.onClick((x, y) => {
          const N = NS.value; let best = null, bd = 0.5;
          cellsOf(N).forEach(([n, k], i) => { const [cx, cy] = at(n, k); const d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = i; } });
          if (best != null) S.set(best);
        });
        v.render(() => {
          const N = NS.value, f = S.frame, idx = S.i, cn = f.n, ck = f.k;
          A.setView([-N / 2 - 1.5, N / 2 + 0.6], [-N - 0.5, 0.5]);
          const tot = binom(cn, ck), wmax = 0.42;
          // ribbons: paths to each parent, edge width ∝ number of paths through it
          const flow = (tn, tk, color) => {
            const T = binom(tn, tk); if (!T) return;
            for (let a = 0; a < tn; a++) for (let b = 0; b <= a; b++) for (const d of [0, 1]) {
              const cnt = binom(a, b) * binom(tn - a - 1, tk - b - d); if (!cnt) continue;
              const [x1, y1] = at(a, b), [x2, y2] = at(a + 1, b + d);
              A.line(x1, y1, x2, y2, { color, width: Math.max(1, ((cnt / Math.max(1, tot)) * wmax) * A.scale), alpha: 0.45 });
            }
          };
          if (cn > 0) {
            flow(cn - 1, ck - 1, 'orange'); flow(cn - 1, ck, 'teal');
            if (ck > 0) { const [x1, y1] = at(cn - 1, ck - 1), [x2, y2] = at(cn, ck); A.line(x1, y1, x2, y2, { color: 'orange', width: Math.max(1.5, (binom(cn - 1, ck - 1) / tot) * wmax * A.scale), alpha: 0.75 }); }
            if (ck < cn) { const [x1, y1] = at(cn - 1, ck), [x2, y2] = at(cn, ck); A.line(x1, y1, x2, y2, { color: 'teal', width: Math.max(1.5, (binom(cn - 1, ck) / tot) * wmax * A.scale), alpha: 0.75 }); }
          }
          cellsOf(N).forEach(([n, k], i) => {
            const [x, y] = at(n, k), grown = i <= idx;
            const isCur = n === cn && k === ck, isL = n === cn - 1 && k === ck - 1, isR = n === cn - 1 && k === ck;
            const colr = isCur ? 'gold' : isL ? 'orange' : isR ? 'teal' : null;
            A.circle(x, y, 0.34, { fill: colr || 'panel', fillAlpha: colr ? 0.92 : 1, color: colr || (grown ? 'muted' : 'faint'), width: colr ? 2 : 1, alpha: grown ? 1 : 0.6 });
            if (grown) { const val = binom(n, k); A.text(String(val), x, y, { align: 'center', size: Math.min(13, A.scale * (val > 99 ? 0.25 : 0.33)), weight: colr ? 700 : 500, color: colr ? 'panel' : 'ink', halo: false }); }
          });
          for (let n = 0; n <= N; n++) A.text(`n = ${n}`, -N / 2 - 1.4, -n, { size: 10.5, color: 'muted', halo: false });
          // subsets panel
          const P = pen(v, B), W = P.W, H = P.H;
          if (cn === 0) { P.text('row 0: the only subset of ∅ is ∅', W / 2, H / 2, { align: 'center', size: 13, color: 'muted' }); return; }
          const subs = kSubsets(cn, ck), withN = subs.filter((S2) => S2.includes(cn - 1)), without = subs.filter((S2) => !S2.includes(cn - 1));
          const draw = (list, y0, h, colr, title) => {
            P.text(title, 10, y0 + 10, { size: 12, color: colr, weight: 700 });
            if (!list.length) { P.text('none', 10, y0 + 32, { size: 12, color: 'muted' }); return; }
            if (list.length > 140) { P.text(`${list.length} subsets — too many to draw`, 10, y0 + 32, { size: 12, color: 'muted' }); return; }
            const g = fitGrid(list.length, W - 16, h - 26, 1 / (cn * 1.12), 5, cn * 22);
            const qq = g.w / cn;
            list.forEach((S2, i) => {
              const [x, y] = g.at(i); const X = x + 8, Y = y + y0 + 22;
              for (let e = 0; e < cn; e++) { const on = S2.includes(e); P.rect(X + e * qq + 0.5, Y, qq - 1, g.h, { fill: on ? (e === cn - 1 ? colr : 'ink') : 'muted', fillAlpha: on ? (e === cn - 1 ? 0.95 : 0.7) : 0.1 }); }
            });
          };
          const hA = H * (withN.length + 1) / (subs.length + 2);
          draw(withN, 0, Math.max(60, Math.min(H - 60, hA)), 'orange', `contain ${cn}: ${withN.length} = C(${cn - 1},${ck - 1})`);
          draw(without, Math.max(60, Math.min(H - 60, hA)), H - Math.max(60, Math.min(H - 60, hA)), 'teal', `avoid ${cn}: ${without.length} = C(${cn - 1},${ck})`);
        });
        v.legend([['gold', 'current entry', { dot: true }], ['orange', 'paths via $\\binom{n-1}{k-1}$ — subsets containing $n$'], ['teal', 'paths via $\\binom{n-1}{k}$ — subsets avoiding $n$']]);
        v.readout(() => { const f = S.frame; return f.n ? `$\\binom{${f.n}}{${f.k}} = ${binom(f.n, f.k)}$ = ${binom(f.n - 1, f.k - 1)} paths through the orange parent + ${binom(f.n - 1, f.k)} through the teal parent. Each subset strip on the right is a $${f.k}$-subset of $\\{1,\\dots,${f.n}\\}$ (squares = elements 1 to ${f.n}).` : 'Row 0.'; });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Vandermonde’s identity',
      credit: 'Zhu Shijie, 1303; Vandermonde, 1772',
      statement: String.raw`For all nonnegative integers $m$, $n$ and $k$,
$$\binom{m+n}{k} = \sum_{j=0}^{k}\binom mj\binom n{k-j}.$$`,
      idea: String.raw`Count committees of $k$ people chosen from $m$ women and $n$ men. Directly there are $\binom{m+n}k$. Sorted by the number $j$ of women, the committees with $j$ women number $\binom mj\binom n{k-j}$ (product rule), and these classes are disjoint (sum rule), so double counting (1.4) equates the two totals. On lattice paths (1.10): a path of $m+n$ steps with $k$ up-steps crosses the line "after $m$ steps" at exactly one point, and splitting there gives the same sum.`,
      caption: String.raw`A path is a committee: step $i$ goes up if person $i$ is chosen, the first $m$ steps being the women. Every path crosses the dashed diagonal after $m$ steps at one point $j$ (women chosen); ribbon widths count paths, coloured by $j$. The bars count committees with $j$ women and stack up to $\binom{m+n}k$. Click a bar or a crossing point to isolate its paths.`,
      deps: ['comb-1.6', 'comb-1.4'],
      refs: ['Stanley EC1 §1.2', 'Aigner ch. 1'],
      tags: ['binomial coefficients', 'identities'],
      viz(v) {
        let selJ = null;
        const mS = v.slider('women $m$', 1, 6, 4, { int: true, onChange: () => clampK() });
        const nS = v.slider('men $n$', 1, 6, 5, { int: true, onChange: () => clampK() });
        const kS = v.slider('committee size $k$', 0, 12, 4, { int: true, onChange: () => clampK() });
        function clampK() { if (kS.value > mS.value + nS.value) kS.set(mS.value + nS.value); selJ = null; }
        const A = v.stage({ x: [-0.6, 5.6], y: [-0.6, 4.6], axes: false, equal: true, height: 340, weight: 1.15, title: 'paths: up = chosen, first $m$ steps = women' });
        const B = v.stage({ x: [-0.7, 6], y: [0, 10], axes: 'box', height: 340, weight: 1, title: 'committees by the number $j$ of women' });
        const range = () => { const m = mS.value, n = nS.value, k = Math.min(kS.value, m + n); const js = []; for (let j = Math.max(0, k - n); j <= Math.min(m, k); j++) js.push(j); return { m, n, k, js }; };
        A.onClick((x, y) => { const { m, js } = range(); let best = null, bd = 0.45; js.forEach((j) => { const d = Math.hypot(m - j - x, j - y); if (d < bd) { bd = d; best = j; } }); selJ = best === selJ ? null : best; });
        B.onClick((x) => { const { js } = range(); const j = Math.round(x); selJ = js.includes(j) && j !== selJ ? j : null; });
        v.render(() => {
          const { m, n, k, js } = range(), X = m + n - k, tot = binom(m + n, k);
          A.setView([-0.7, X + 0.7], [-0.7, k + 0.9]);
          for (let x = 0; x <= X; x++) A.line(x, 0, x, k, { color: 'grid', width: 1 });
          for (let y = 0; y <= k; y++) A.line(0, y, X, y, { color: 'grid', width: 1 });
          // diagonal x + y = m
          A.line(Math.max(0, m - k) - 0.3, Math.min(m, k) + 0.3, Math.min(m, X) + 0.3, m - Math.min(m, X) - 0.3, { color: 'muted', width: 1.5, dash: [6, 4] });
          const P2 = (x1, y1, x2, y2) => binom(x2 - x1 + y2 - y1, y2 - y1) * (x2 >= x1 && y2 >= y1 ? 1 : 0);
          const wscale = 0.42 * A.scale / Math.max(1, tot);
          js.forEach((j) => {
            const cx = m - j, cy = j, faded = selJ != null && selJ !== j, col = CAT[j % CAT.length];
            for (let x = 0; x <= X; x++) for (let y = 0; y <= k; y++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
              const x2 = x + dx, y2 = y + dy; if (x2 > X || y2 > k) continue;
              let cnt;
              if (x2 + y2 <= m) cnt = P2(0, 0, x, y) * P2(x2, y2, cx, cy) * P2(cx, cy, X, k);
              else if (x + y >= m) cnt = P2(0, 0, cx, cy) * P2(cx, cy, x, y) * P2(x2, y2, X, k);
              else cnt = 0;
              if (cnt) A.line(x, y, x2, y2, { color: col, width: Math.max(0.8, cnt * wscale), alpha: faded ? 0.08 : 0.42 });
            }
          });
          js.forEach((j) => {
            const c = binom(m, j) * binom(n, k - j), col = CAT[j % CAT.length], faded = selJ != null && selJ !== j;
            A.dot(m - j, j, { r: 6.5, color: col, alpha: faded ? 0.35 : 1 });
            A.text(`${binom(m, j)}·${binom(n, k - j)}`, m - j, j, { dx: 9, dy: -10, size: 11.5, weight: 700, color: col, alpha: faded ? 0.4 : 1 });
          });
          A.dot(0, 0, { r: 4.5, color: 'ink', label: 'start', labelPos: 'sw' });
          A.dot(X, k, { r: 4.5, color: 'ink', label: `(${X}, ${k})`, labelPos: 'ne' });
          // bars
          const J = Math.min(m, k), ymax = tot * 1.12 || 1;
          B.setView([-0.7, J + 2.2], [-ymax * 0.1, ymax]);
          B.hline(0, { color: 'muted', width: 1 });
          B.setTicks(Array.from({ length: J + 1 }, (_, j) => [j, 'j = ' + j]).concat([[J + 1.4, 'all']]), niceTicks(tot));
          js.forEach((j) => {
            const c = binom(m, j) * binom(n, k - j), col = CAT[j % CAT.length], faded = selJ != null && selJ !== j;
            B.rect(j - 0.36, 0, j + 0.36, c, { fill: col, fillAlpha: faded ? 0.15 : 0.6, color: col, width: 1.4, alpha: faded ? 0.4 : 1 });
            B.text(String(c), j, c, { dy: -9, align: 'center', size: 11.5, weight: 600, color: col });
          });
          let y = 0;
          js.forEach((j) => { const c = binom(m, j) * binom(n, k - j), col = CAT[j % CAT.length]; B.rect(J + 1.05, y, J + 1.75, y + c, { fill: col, fillAlpha: selJ === j ? 0.9 : 0.55, color: 'panel', width: 1.2 }); y += c; });
          B.text(`C(${m + n},${k}) = ${tot}`, J + 1.4, tot, { dy: -9, align: 'center', size: 11.5, weight: 700, color: 'ink' });
        });
        v.readout(() => {
          const { m, n, k, js } = range(), tot = binom(m + n, k);
          const terms = js.map((j) => `\\tbinom{${m}}{${j}}\\tbinom{${n}}{${k - j}}`).join(' + '), nums = js.map((j) => binom(m, j) * binom(n, k - j)).join(' + ');
          return `$\\binom{${m + n}}{${k}} = ${terms}$, i.e. $${tot} = ${nums}$.` + (selJ != null ? ` Selected: committees with ${selJ} women — choose them in $\\binom{${m}}{${selJ}} = ${binom(m, selJ)}$ ways and the ${k - selJ} men in $\\binom{${n}}{${k - selJ}} = ${binom(n, k - selJ)}$ ways.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Lattice paths are counted by binomial coefficients',
      statement: String.raw`The number of lattice paths from $(0,0)$ to $(a,b)$ ($a, b\ge 0$ integers) that use unit steps east, $E=(1,0)$, and north, $N=(0,1)$, is
$$\binom{a+b}{a} = \binom{a+b}{b}.$$`,
      idea: String.raw`A path is a word of $a+b$ letters, $a$ of them $E$ and $b$ of them $N$, and it is determined by the set of positions of its $N$ steps, an arbitrary $b$-subset of the $a+b$ steps (1.6). Equivalently, the number $P(x,y)$ of paths to $(x,y)$ satisfies $P(x,y) = P(x-1,y) + P(x,y-1)$ with $P=1$ on the axes: Pascal's rule (1.8) turned through 45°. The recursion survives obstacles; the closed formula does not.`,
      caption: String.raw`Drag the corner. Each lattice point shows the number of paths that reach it (the sum of its left and lower neighbours); the gold paths are uniform random samples and the blue one is spelled out in the readout as a word and as a subset. Click lattice points to block them: the recursion keeps counting the surviving paths, but the corner no longer equals the binomial coefficient.`,
      deps: ['comb-1.6'],
      see: ['comb-1.8'],
      refs: ['Aigner ch. 1'],
      tags: ['lattice paths', 'bijections'],
      viz(v) {
        const AX = 11, BY = 7;
        let seed = 4; const blocked = new Set();
        const s = v.stage({ x: [-0.8, AX + 0.8], y: [-0.8, BY + 0.8], axes: false, equal: true, height: 370 });
        const corner = s.handle(6, 4, { color: 'accent', r: 8, constrain: (x, y) => [v.M.clamp(Math.round(x), 1, AX), v.M.clamp(Math.round(y), 1, BY)] });
        v.button('Resample paths', () => { seed++; });
        v.button('Clear blocks', () => { blocked.clear(); });
        s.onClick((x, y) => {
          const X = Math.round(x), Y = Math.round(y);
          if (Math.hypot(X - x, Y - y) > 0.3 || X < 0 || Y < 0 || X > AX || Y > BY || (X === 0 && Y === 0) || (X === corner.x && Y === corner.y)) return;
          const key = X + ',' + Y; if (blocked.has(key)) blocked.delete(key); else blocked.add(key);
        });
        let info = null;
        v.render(() => {
          const a = corner.x, b = corner.y, isB = (x, y) => blocked.has(x + ',' + y);
          // forward counts P and backward counts F (to the corner)
          const Pc = [], F = [];
          for (let x = 0; x <= a; x++) { Pc.push([]); for (let y = 0; y <= b; y++) Pc[x][y] = isB(x, y) ? 0 : x === 0 && y === 0 ? 1 : (x ? Pc[x - 1][y] : 0) + (y ? Pc[x][y - 1] : 0); }
          for (let x = a; x >= 0; x--) { F[x] = []; for (let y = b; y >= 0; y--) F[x][y] = isB(x, y) ? 0 : x === a && y === b ? 1 : (x < a ? F[x + 1][y] : 0) + (y < b ? F[x][y + 1] : 0); }
          for (let x = 0; x <= AX; x++) s.line(x, 0, x, BY, { color: 'grid', width: 1 });
          for (let y = 0; y <= BY; y++) s.line(0, y, AX, y, { color: 'grid', width: 1 });
          for (let x = 0; x <= a; x++) s.line(x, 0, x, b, { color: 'faint', width: 1.4 });
          for (let y = 0; y <= b; y++) s.line(0, y, a, y, { color: 'faint', width: 1.4 });
          // sample uniform random paths
          const r = v.rng(seed * 131 + a * 17 + b), paths = [];
          if (F[0][0] > 0) for (let t = 0; t < 7; t++) {
            let x = 0, y = 0; const pts = [[0, 0]], word = [];
            while (x < a || y < b) { const fe = x < a ? F[x + 1][y] : 0, fn = y < b ? F[x][y + 1] : 0; if (r() * (fe + fn) < fe) { x++; word.push('E'); } else { y++; word.push('N'); } pts.push([x, y]); }
            paths.push({ pts, word });
          }
          paths.forEach((p, t) => { if (t) { const o = (t - 3.5) * 0.035; s.path(p.pts.map(([x, y]) => [x + o, y - o]), { color: 'gold', width: 2.2, alpha: 0.55 }); } });
          if (paths.length) s.path(paths[0].pts, { color: 'blue', width: 3.6 });
          for (let x = 0; x <= AX; x++) for (let y = 0; y <= BY; y++) {
            const inR = x <= a && y <= b;
            if (isB(x, y)) { s.line(x - 0.16, y - 0.16, x + 0.16, y + 0.16, { color: 'red', width: 3 }); s.line(x - 0.16, y + 0.16, x + 0.16, y - 0.16, { color: 'red', width: 3 }); continue; }
            s.dot(x, y, { r: inR ? 3.2 : 2, color: inR ? 'ink' : 'faint' });
            if (inR) s.text(String(Pc[x][y]), x, y, { dx: 4, dy: -9, size: Pc[x][y] > 999 ? 9.5 : 10.5, color: x === a && y === b ? 'accent' : 'muted', weight: x === a && y === b ? 700 : 500 });
          }
          s.text(`(${a}, ${b})`, a, b, { dx: 12, dy: 12, size: 12, color: 'accent', weight: 700 });
          info = { a, b, cnt: Pc[a][b], word: paths[0] ? paths[0].word : null };
        });
        v.legend([['blue', 'one path, spelled out below'], ['gold', 'more uniform random paths'], ['red', 'blocked point (click to toggle)']]);
        v.readout(() => {
          if (!info) return ''; const { a, b, cnt, word } = info, C = binom(a + b, a);
          const pos = word ? word.map((c, i) => (c === 'N' ? i + 1 : 0)).filter(Boolean) : [];
          let t = blocked.size ? `With ${blocked.size} blocked point${blocked.size > 1 ? 's' : ''} the corner count is **${cnt}**, not $\\binom{${a + b}}{${a}} = ${C}$: the formula counts unobstructed paths, while the recursion counts whatever survives. ` : `Paths to $(${a},${b})$: **${cnt}** $= \\binom{${a + b}}{${a}} = ${C}$ ✓. `;
          if (word) t += `Blue path: ${word.join('')} — its N-steps sit at positions $\\{${pos.join(',')}\\}$, a ${b}-subset of the ${a + b} steps.`;
          else t += 'No path reaches the corner.';
          return t;
        });
      },
    },
  ],
};
