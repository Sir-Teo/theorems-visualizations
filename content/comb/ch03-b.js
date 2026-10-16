// Combinatorics — Chapter 3, part b: sign-reversing involutions, Lindström–Gessel–Viennot and tilings (items 3.9–3.14)
//
// Every count below is produced by listing the objects (all distinct partitions of n, all families of paths in a
// grid, all plane partitions in a box, all tilings of small boards) and is compared with the closed form;
// the large random tilings are sampled by domino shuffling, which was tested exhaustively against the exact tilings
// of the small Aztec diamonds (see ch03.shared.js).
import {
  CAT, pen, binom, fact, range, commas, perms, fitGrid, drawFerrers,
  distinctPartitions, franklin, eulerProduct,
  pathCount, detNum, randomPath, disjointFamilies,
  macmahon, ppBrute, ppFaces, ppPaths, ppFlip, iso,
  inAz, azCells, domType, domCells, shuffleStep, azRandom, azCount, azValid, DIR_COLOR,
  rectCount, rectSample, kasteleynProduct,
} from './ch03.shared.js';

export default {
  collection: 'comb',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Method',
      name: 'Sign-reversing involutions',
      credit: 'The involution on partitions into distinct parts is Franklin’s, 1881 (a proof of Euler’s pentagonal number theorem)',
      statement: String.raw`Let $X$ be a finite set with a sign $\varepsilon:X\to\{+1,-1\}$ and let $\iota:X\to X$ be an involution ($\iota\circ\iota=\mathrm{id}$) which is **sign-reversing** wherever it moves a point: $\varepsilon(\iota x)=-\varepsilon(x)$ whenever $\iota x\neq x$. Then
$$\sum_{x\in X}\varepsilon(x)=\sum_{x:\ \iota x=x}\varepsilon(x),$$
the signed count of the fixed points. If the fixed points are few (or all of one sign), a signed sum with huge cancellation is reduced to a small honest count. Example (Franklin): for partitions of $n$ into distinct parts, with sign $(-1)^{\#\text{parts}}$, there is an involution whose fixed points exist only when $n=k(3k\pm1)/2$, which proves Euler's pentagonal number theorem $\prod_{k\ge1}(1-x^k)=\sum_{k\in\mathbb Z}(-1)^kx^{k(3k-1)/2}$.`,
      idea: String.raw`The points not fixed by $\iota$ split into pairs $\{x,\iota x\}$ of opposite sign, and every pair contributes $0$, so only fixed points survive — exactly the argument by which the binomial theorem gives $\sum_k(-1)^k\binom nk=0$ (the involution toggles whether element $1$ is in the subset), and the same cancellation mechanism that underlies 3.1. Franklin's map moves the smallest part onto the top of the staircase, or the other way round, changing the number of parts by one; it breaks down only when the two moves collide, which happens just for the two "pentagonal" shapes.`,
      caption: String.raw`Left: all the signed objects — partitions of $n$ into distinct parts as Ferrers diagrams (blue: even number of parts, $+$; red: odd, $-$), each shown beside its partner under the involution. Slide **pairs cancelled** to fade the cancelling pairs; what remains (green) are the fixed points. Right: the coefficient of $x^n$ in $\prod(1-x^k)$ — it is $0$ except at the pentagonal numbers. Switch to *subsets* for the simplest involution (toggle element 1), which has no fixed point at all.`,
      scope: String.raw`$n\le20$ for the partitions (all of them are listed and the involution is verified to be an involution on every one).`,
      deps: ['comb-3.1'],
      refs: ['Stanley EC1 §2.6', 'Aigner ch. 5'],
      tags: ['involution', 'partitions', 'pentagonal numbers'],
      viz(v) {
        const mode = v.select('example', [{ value: 'franklin', label: 'distinct partitions (Franklin)' }, { value: 'subsets', label: 'subsets of $[m]$' }], 'franklin');
        const nS = v.slider('$n$', 1, 20, 12, { int: true });
        const fS = v.slider('pairs cancelled', 0, 1, 0.5, { step: 0.01 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, weight: 1.6, title: 'objects, their partners, and the fixed points' });
        const C = v.stage({ x: [-1, 41], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 420, weight: 1, xlabel: '$n$', ylabel: 'coefficient of $x^n$', title: '$\\prod_k(1-x^k)$: the signed count' });
        const coef = eulerProduct(40);
        let info = null;
        const build = () => {
          const n = nS.value;
          if (mode.value === 'subsets') {
            const m = Math.min(n, 5), units = [], seen = new Set();
            for (let S = 0; S < 1 << m; S++) { if (seen.has(S)) continue; const T = S ^ 1; seen.add(S); seen.add(T); units.push({ a: S, b: T, fixed: false }); }
            return { units, kind: 'sub', m, sumSigned: 0, nfix: 0, ok: true, total: 1 << m };
          }
          const Ps = distinctPartitions(n), units = [], seen = new Set(); let ok = true, signed = 0, nfix = 0;
          for (const l of Ps) {
            signed += l.length % 2 ? -1 : 1;
            const key = l.join(','); if (seen.has(key)) continue;
            const f = franklin(l), back = franklin(f.mate);
            if (back.mate.join(',') !== key || (!f.fixed && (f.mate.length - l.length) % 2 === 0)) ok = false;
            seen.add(key); if (f.fixed) { units.push({ a: l, fixed: true }); nfix++; } else { seen.add(f.mate.join(',')); units.push({ a: l, b: f.mate, fixed: false }); }
          }
          return { units, kind: 'par', sumSigned: signed, nfix, ok, total: Ps.length };
        };
        v.render(() => {
          info = build(); const n = nS.value, P = pen(v, A), U = info.units, W = P.W, H = P.H;
          const pairs = U.filter((u) => !u.fixed), cancelled = Math.floor(fS.value * pairs.length + 1e-9);
          const order = [...pairs, ...U.filter((u) => u.fixed)]; info.cancelled = cancelled; info.pairs = pairs.length;
          const g = fitGrid(order.length, W - 16, H - 14, info.kind === 'sub' ? 0.5 : 0.62, 8, 400, 'top');
          const maxLen = info.kind === 'par' ? Math.max(...U.map((u) => Math.max(u.a.length, (u.b || u.a).length))) : 1;
          const maxPart = info.kind === 'par' ? n : 1;
          order.forEach((u, idx) => {
            const [bx, by] = g.at(idx), gx = bx + 8, gy = by + 7, cancelledU = !u.fixed && idx < cancelled, al = cancelledU ? 0.16 : 1;
            P.rect(gx, gy, g.w, g.h, { fill: u.fixed ? 'green' : 'panel', fillAlpha: u.fixed ? 0.13 : 1, color: u.fixed ? 'green' : 'faint', width: u.fixed ? 2.4 : 1, r: 6, alpha: al });
            const half = g.w / 2;
            if (info.kind === 'par') {
              const q = Math.max(2, Math.min((half - 14) / maxPart, (g.h - 12) / maxLen, 14));
              const draw = (l, x0, sgnCol) => drawFerrers(P, l, x0, gy + 6, q, { boxes: true, color: sgnCol, alpha: cancelledU ? 0.15 : 0.85 });
              draw(u.a, gx + 6, u.a.length % 2 ? 'red' : 'blue');
              if (!u.fixed) { draw(u.b, gx + half + 6, u.b.length % 2 ? 'red' : 'blue'); P.text('⇄', gx + half, gy + g.h / 2, { align: 'center', size: Math.min(15, g.w / 8), color: 'muted', halo: false, alpha: al }); }
            } else {
              const m = info.m, q = Math.min((half - 12) / m, (g.h - 12), 14);
              const draw = (S, x0) => { const col = (S.toString(2).split('1').length - 1) % 2 ? 'red' : 'blue'; for (let i = 0; i < m; i++) P.rect(x0 + i * q, gy + g.h / 2 - q / 2, q - 1.5, q - 1.5, { fill: S >> i & 1 ? col : 'panel', fillAlpha: S >> i & 1 ? (cancelledU ? 0.18 : 0.85) : 1, color: S >> i & 1 ? col : 'muted', width: 1, alpha: al }); };
              draw(u.a, gx + 6); draw(u.b, gx + half + 6); P.text('⇄', gx + half, gy + g.h / 2, { align: 'center', size: 13, color: 'muted', halo: false, alpha: al });
            }
          });
          C.setView([-1, 41], [-1.7, 1.7]); C.setTicks([0, 5, 10, 15, 20, 25, 30, 35, 40], [-1, 0, 1]);
          C.hline(0, { color: 'faint' });
          C.bars(coef, { x0: 0, color: (val) => (val > 0 ? 'blue' : val < 0 ? 'red' : 'faint') });
          C.vline(n, { color: 'gold', width: 2.4 });
        });
        v.legend([['blue', 'even number of parts ($+$)', { dot: true }], ['red', 'odd ($-$)', { dot: true }], ['green', 'fixed point', { dot: true }]]);
        v.readout(() => {
          const n = nS.value;
          if (info.kind === 'sub') return String.raw`All $2^{${info.m}}=${info.total}$ subsets of $[${info.m}]$ come in $${info.total / 2}$ pairs $\{S,\ S\triangle\{1\}\}$ of opposite sign, so $\sum_S(-1)^{|S|}=0$ and there are no fixed points; ${info.cancelled} pairs are faded.`;
          const fixed = info.units.filter((u) => u.fixed).map((u) => `(${u.a.join(',')})`).join(', ');
          let pent = ''; for (let k = 1; k < 10; k++) { if (k * (3 * k - 1) / 2 === n) pent = ` $n=${n}=k(3k-1)/2$ with $k=${k}$`; if (k * (3 * k + 1) / 2 === n) pent = ` $n=${n}=k(3k+1)/2$ with $k=${k}$`; }
          return String.raw`The ${info.total} partitions of $${n}$ into distinct parts form ${info.pairs} pairs (parts changed by Franklin's map, parity of the number of parts flipped) and ${info.nfix} fixed point${info.nfix === 1 ? '' : 's'}${fixed ? ' ' + fixed : ''}; the map is an involution on all of them ${info.ok ? '✓' : '✗'}. Signed count $\sum(-1)^{\#\text{parts}}=${info.sumSigned}$, the coefficient of $x^{${n}}$ in $\prod(1-x^k)$ is $${coef[n]}$ ${info.sumSigned === coef[n] ? '✓' : '✗'}.${pent ? pent + '.' : ' $n$ is not a pentagonal number, so nothing survives.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Lindström–Gessel–Viennot lemma',
      credit: 'Lindström, 1973; Gessel and Viennot, 1985 (an earlier probabilistic form is due to Karlin and McGregor)',
      statement: String.raw`Let $G$ be a finite acyclic directed graph, $A_1,\dots,A_k$ vertices ("sources") and $B_1,\dots,B_k$ vertices ("sinks"), and let $M_{ij}$ be the number of directed paths from $A_i$ to $B_j$. Then
$$\det\,(M_{ij})_{i,j=1}^k=\sum_{\sigma\in S_k}\operatorname{sgn}(\sigma)\cdot\#\{(P_1,\dots,P_k):\ P_i:A_i\to B_{\sigma(i)}\ \text{pairwise vertex-disjoint}\}.$$
In particular, when every vertex-disjoint family must have $\sigma=\mathrm{id}$ (e.g. the points lie in "compatible" positions in a planar graph), the determinant counts the non-intersecting families of paths.`,
      idea: String.raw`Expand the determinant over permutations (ladr 9.46): $\det M=\sum_\sigma\operatorname{sgn}\sigma\prod_iM_{i\sigma(i)}$ is a signed count of *all* families $(\sigma;P_1,\dots,P_k)$ with $P_i:A_i\to B_{\sigma(i)}$. Define a sign-reversing involution (3.9) on the families that contain an intersection: take the first vertex $v$ where a path meets another one (first along the lowest-numbered path involved), and swap the tails of the two paths after $v$. This replaces $\sigma$ by $\sigma$ composed with a transposition, so the sign flips, and it is its own inverse. Only the families with no intersection are fixed, so only they remain in the sum. In the lattice case $M_{ij}=\binom{\Delta x+\Delta y}{\Delta x}$ (1.10).`,
      caption: String.raw`Drag the sources $A_i$ (squares) and sinks $B_j$ (rings) on the grid; paths take unit steps east or north. The readout shows the matrix of path counts and its determinant, compared with the signed count of vertex-disjoint families found by listing all of them. Right: that count for each $\sigma$. Press *New family* for a random family of paths $A_i\to B_{\sigma(i)}$; if two paths meet, the first meeting point is ringed in red and the control **after tail swap** shows the partner family, with the two tails exchanged and the sign reversed.`,
      deps: ['comb-3.9', 'comb-1.10', 'ladr-9.46'],
      refs: ['Aigner ch. 5', 'Stanley EC1 §2.7'],
      tags: ['determinants', 'lattice paths', 'involution'],
      viz(v) {
        const GW = 6, GH = 4;
        let seed = 7, R = v.rng(seed), fam = null, famKey = '';
        const kS = v.select('paths $k$', [{ value: '2', label: '$k=2$' }, { value: '3', label: '$k=3$' }], '2');
        const showS = v.select('show', [{ value: 'orig', label: 'random family' }, { value: 'swap', label: 'after tail swap' }], 'orig');
        v.button('New family', () => { R = v.rng(++seed); famKey = ''; });
        const A = v.stage({ x: [-0.7, GW + 0.7], y: [-0.7, GH + 0.7], equal: true, axes: false, height: 340, weight: 1.35, title: 'lattice paths (east / north steps)' });
        const B = v.stage({ x: [-0.6, 7], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'permutation $\\sigma$ (the end point of path $i$ is $B_{\\sigma(i)}$)', ylabel: 'signed count', title: 'vertex-disjoint families by $\\sigma$' });
        const snap = (x, y) => [Math.max(0, Math.min(GW, Math.round(x))), Math.max(0, Math.min(GH, Math.round(y)))];
        const start = [[0, 1], [1, 0], [3, 0]], end = [[3, 4], [4, 3], [6, 3]];
        const hA = start.map((p, i) => A.handle(p[0], p[1], { color: CAT[i], label: `A${i + 1}`, r: 9, constrain: snap }));
        const hB = end.map((p, i) => A.handle(p[0], p[1], { color: CAT[i], label: `B${i + 1}`, r: 9, constrain: snap }));
        const cache = new Map();
        const families = (As, Bs) => { const key = JSON.stringify([As, Bs]); if (!cache.has(key)) { if (cache.size > 80) cache.clear(); cache.set(key, disjointFamilies(As, Bs)); } return cache.get(key); };
        const swapTails = (paths) => {
          // first vertex (along the lowest-numbered path) lying on another path
          for (let i = 0; i < paths.length; i++) for (let s = 0; s < paths[i].length; s++) {
            const p = paths[i][s];
            for (let j = 0; j < paths.length; j++) if (j !== i) { const t = paths[j].findIndex((q) => q[0] === p[0] && q[1] === p[1]); if (t >= 0) {
              const out = paths.map((q) => q.slice()); out[i] = [...paths[i].slice(0, s), ...paths[j].slice(t)]; out[j] = [...paths[j].slice(0, t), ...paths[i].slice(s)];
              return { paths: out, v: p, i, j };
            } }
          }
          return null;
        };
        let st = null;
        v.render(() => {
          const k = Number(kS.value);
          hA.forEach((h, i) => { h.visible = i < k; }); hB.forEach((h, i) => { h.visible = i < k; });
          const As = hA.slice(0, k).map((h) => [h.x, h.y]), Bs = hB.slice(0, k).map((h) => [h.x, h.y]);
          const M = As.map((a) => Bs.map((b) => pathCount(a, b))), det = detNum(M), F = families(As, Bs);
          // lattice
          for (let x = 0; x <= GW; x++) for (let y = 0; y <= GH; y++) A.dot(x, y, { r: 2.2, color: 'faint' });
          // random family: uniform path for a random admissible sigma
          const key = JSON.stringify([As, Bs, seed]);
          if (key !== famKey) {
            famKey = key; const cand = perms(range(k)).filter((sg) => sg.every((j, i) => M[i][j] > 0));
            if (!cand.length) fam = null; else { const sg = cand[Math.floor(R() * cand.length)]; fam = { sigma: sg, paths: sg.map((j, i) => randomPath(R, As[i], Bs[j])) }; }
          }
          let shown = null, sw = null, inv = '';
          if (fam) {
            sw = swapTails(fam.paths);
            if (sw) { const back = swapTails(sw.paths); inv = back && JSON.stringify(back.paths) === JSON.stringify(fam.paths) ? 'back to the original ✓' : 'does not return ✗'; }
            shown = showS.value === 'swap' && sw ? sw.paths : fam.paths;
            if (showS.value === 'swap' && sw) fam.paths.forEach((p) => A.path(p.map(([x, y]) => [x, y]), { color: 'faint', width: 3, alpha: 0.5 }));
            shown.forEach((p, i) => { const o = (i - (k - 1) / 2) * 0.07; A.path(p.map(([x, y]) => [x + o, y - o]), { color: CAT[i], width: 3.4, alpha: 0.9 }); });
            if (sw) A.dot(sw.v[0], sw.v[1], { r: 11, hollow: true, color: 'red' });
          }
          for (let i = 0; i < k; i++) { A.rect(As[i][0] - 0.13, As[i][1] - 0.13, As[i][0] + 0.13, As[i][1] + 0.13, { fill: CAT[i], fillAlpha: 0.9, color: CAT[i] }); A.dot(Bs[i][0], Bs[i][1], { r: 8, hollow: true, color: CAT[i] }); }
          // right panel: signed counts
          const rows = F.bySigma, vals = rows.map((r) => r.sign * r.count), mx = Math.max(1, ...vals.map(Math.abs), Math.abs(F.signed));
          B.setView([-0.6, rows.length + 0.6], [-mx * 1.2, mx * 1.2]);
          B.setTicks([...rows.map((r, i) => [i, r.sigma.map((x) => x + 1).join('')]), [rows.length, 'Σ']], null); B.hline(0, { color: 'faint' });
          B.bars(vals, { x0: 0, color: (val) => (val < 0 ? 'blue' : 'orange') });
          B.rect(rows.length - 0.4, 0, rows.length + 0.4, F.signed, { fill: 'green', fillAlpha: 0.75, color: 'green' });
          B.hline(det, { color: 'green', dash: true, width: 1.6 });
          st = { M, det, F, sw, inv, fam, k };
        });
        v.legend([['orange', '$+$ (even $\\sigma$)', { dot: true }], ['blue', '$-$ (odd $\\sigma$)', { dot: true }], ['green', 'sum = $\\det M$', { dot: true }]]);
        v.readout(() => {
          const { M, det, F, sw, inv, fam, k } = st, tex = `\\begin{pmatrix}${M.map((r) => r.join('&')).join('\\\\')}\\end{pmatrix}`;
          const fl = fam ? (sw ? `The random family meets itself; swapping the tails after the red vertex (paths ${sw.i + 1} and ${sw.j + 1}) changes $\\sigma$ by a transposition (sign reversed) and applying the swap again goes ${inv}.` : 'The random family has no common vertex: it is a fixed point of the involution and is counted by the determinant.') : 'There is no path family between these points (some $M_{ij}=0$ for every $\\sigma$).';
          return String.raw`$M=${tex}$, $\det M=${det}$. Listing all vertex-disjoint families gives the signed count $\sum_\sigma\operatorname{sgn}\sigma\cdot\#=${F.signed}$ ${F.signed === det ? '✓' : '✗'}. ${fl}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'MacMahon’s formula for lozenge tilings',
      credit: 'MacMahon (plane partitions in a box), 1890s–1916; the determinant proof is the Gessel–Viennot one',
      statement: String.raw`The number of tilings of a hexagon with side lengths $a,b,c,a,b,c$ by unit lozenges (rhombi with angle $60^\circ$) is
$$\prod_{i=1}^{a}\prod_{j=1}^{b}\frac{i+j+c-1}{i+j-1}.$$
It equals the number of plane partitions that fit in an $a\times b\times c$ box — arrays $(\pi_{ij})_{i\le a,\,j\le b}$ of integers $0\le\pi_{ij}\le c$ with weakly decreasing rows and columns — because a lozenge tiling is exactly the picture of a stack of unit cubes seen from the direction $(1,1,1)$.`,
      idea: String.raw`The three kinds of lozenges are the visible faces (top, left, right) of the cubes. Drawing, in each tiling, the $c$ paths that cross the lozenges having a vertical edge turns a tiling into a family of $c$ non-intersecting lattice paths, each with $a$ steps of one kind and $b$ of the other, between two fixed vertical sides. By 3.10 their number is the determinant $\det\big[\binom{a+b}{b+j-i}\big]_{i,j=1}^c$, and this determinant can be evaluated as the product above.`,
      caption: String.raw`The picture is both a stack of cubes (the plane partition, heights drawn as columns) and a lozenge tiling of the hexagon. **Click a blue top face to add a cube** to that column, shift-click to remove one; *Random tiling* runs random cube additions/removals; resize the box with the sliders. Tick *paths* to draw the $c$ non-intersecting paths. The readout compares MacMahon's product with a listing of all plane partitions in the box and with the LGV determinant.`,
      scope: String.raw`Box sides up to $5$; the brute-force listing is shown when it has fewer than $2\times10^6$ plane partitions.`,
      deps: ['comb-3.10'],
      refs: ['Stanley EC1 §2.7', 'Aigner ch. 5'],
      tags: ['plane partitions', 'lozenge tilings', 'LGV'],
      viz(v) {
        let seed = 3, R = v.rng(seed), P = Array.from({ length: 5 }, () => Array(5).fill(0));
        const aS = v.slider('$a$', 1, 5, 3, { int: true, onChange: () => scramble() });
        const bS = v.slider('$b$', 1, 5, 3, { int: true, onChange: () => scramble() });
        const cS = v.slider('$c$', 1, 5, 3, { int: true, onChange: () => scramble() });
        const pathsT = v.toggle('paths', true);
        const dims = () => [aS.value, bS.value, cS.value];
        function scramble() { const [a, b, c] = dims(); P = Array.from({ length: 5 }, () => Array(5).fill(0)); for (let t = 0; t < 600 * a * b * c; t++) ppFlip(P, a, b, c, R); }
        v.button('Random tiling', () => { const [a, b, c] = dims(); for (let t = 0; t < 300 * a * b * c; t++) ppFlip(P, a, b, c, R); });
        v.button('Empty', () => { P = Array.from({ length: 5 }, () => Array(5).fill(0)); });
        v.button('Full box', () => { const [a, b, c] = dims(); P = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => (i < a && j < b ? c : 0))); });
        scramble();
        const S = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: false, height: 400, weight: 1.4, title: 'cubes ⇄ lozenge tiling of the hexagon' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 0.8, title: 'counts' });
        const limit = 2e6; const bruteCache = new Map();
        let faces = [];
        S.onClick((x, y, mod) => {
          const [a, b, c] = dims();
          for (const f of faces) if (f.t === 'z') {
            const pts = f.pts; let inside = false;
            for (let i = 0, j = 3; i < 4; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; }
            if (!inside) continue;
            const { i, j } = f;
            if (!(mod && mod.shift)) { if (P[i][j] < c && (!i || P[i - 1][j] > P[i][j]) && (!j || P[i][j - 1] > P[i][j])) P[i][j]++; }
            else if (P[i][j] > 0 && (i + 1 >= a || P[i + 1][j] < P[i][j]) && (j + 1 >= b || P[i][j + 1] < P[i][j])) P[i][j]--;
            return;
          }
        });
        let st = null;
        v.render(() => {
          const [a, b, c] = dims();
          // centre the hexagon: x range [-b*s3, a*s3], y range [-(a+b)/2, c]
          const s3 = Math.sqrt(3) / 2, xl = -b * s3, xr = a * s3, yl = -(a + b) / 2 + 0, yh = c;
          const cxm = (xl + xr) / 2, cym = (yl + yh) / 2, half = Math.max((xr - xl) / 2, (yh - yl) / 2) * 1.1 + 0.4;
          S.setView([cxm - half * 1.25, cxm + half * 1.25], [cym - half, cym + half]);
          faces = ppFaces(P, a, b, c);
          const col = { z: ['blue', 0.85], x: ['orange', 0.85], y: ['green', 0.85] };
          for (const f of faces) S.poly(f.pts, { fill: col[f.t][0], fillAlpha: col[f.t][1], color: 'panel', width: 1.6 });
          const paths = ppPaths(faces);
          if (pathsT.value) paths.forEach((p, i) => { S.path(p, { color: 'ink', width: 2.8, alpha: 0.9 }); S.dot(p[0][0], p[0][1], { r: 3.5, color: 'ink' }); S.dot(p[p.length - 1][0], p[p.length - 1][1], { r: 3.5, color: 'ink' }); });
          const nz = faces.filter((f) => f.t === 'z').length, nx = faces.filter((f) => f.t === 'x').length, ny = faces.filter((f) => f.t === 'y').length;
          const cubes = P.slice(0, a).reduce((s, r) => s + r.slice(0, b).reduce((u, x) => u + x, 0), 0);
          const total = macmahon(a, b, c), key = `${a},${b},${c}`;
          if (!bruteCache.has(key)) bruteCache.set(key, total <= BigInt(limit) ? ppBrute(a, b, c) : null);
          const M = Array.from({ length: c }, (_, i) => Array.from({ length: c }, (_, j) => binom(a + b, b + j - i)));
          st = { a, b, c, nz, nx, ny, cubes, total, brute: bruteCache.get(key), det: detNum(M), paths, lens: paths.map((p) => p.length - 1) };
          // right: count panel
          const Q = pen(v, T), W = Q.W, H = Q.H;
          const rows = [['top faces', nz, a * b, 'blue'], ['left faces', nx, b * c, 'orange'], ['right faces', ny, a * c, 'green']];
          rows.forEach(([lab, got, want, colr], i) => { const y = 36 + i * 46; Q.rect(16, y, 22, 22, { fill: colr, fillAlpha: 0.85, color: colr, r: 3 }); Q.text(`${lab}: ${got} = ${want === got ? '' : '≠ '}${want}`, 48, y + 11, { size: 13, align: 'left', color: 'ink', halo: false }); });
          Q.text(`${cubes} cubes in the stack`, 16, 190, { size: 13, align: 'left', color: 'muted', halo: false });
          Q.text(`${paths.length} paths, ${a + b} steps each`, 16, 214, { size: 13, align: 'left', color: 'muted', halo: false });
          Q.text(`plane partitions in the box:`, 16, 262, { size: 13, align: 'left', color: 'muted', halo: false });
          Q.text(commas(total), 16, 288, { size: 22, align: 'left', color: 'green', weight: 700, halo: false });
        });
        v.legend([['blue', 'top lozenge', { dot: true }], ['orange', 'left', { dot: true }], ['green', 'right', { dot: true }]]);
        v.readout(() => {
          const { a, b, c, total, brute, det, nz, nx, ny, lens } = st;
          return String.raw`$\prod_{i\le${a},\,j\le${b}}\frac{i+j+${c}-1}{i+j-1}=${commas(total)}$ tilings of the $${a}\times${b}\times${c}$ hexagon. ${brute != null ? `Listing every plane partition in the box finds $${commas(brute)}$ ${BigInt(brute) === total ? '✓' : '✗'}; ` : 'The box is too large to list here; '}the LGV determinant $\det\big[\binom{${a + b}}{${b}+j-i}\big]_{i,j\le ${c}}=${commas(det)}$ ${BigInt(det) === total ? '✓' : '✗'}. This tiling uses ${nz}, ${nx}, ${ny} lozenges of the three kinds (always $ab,\,bc,\,ac$) and its ${lens.length} paths have lengths ${lens.join(', ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Aztec diamond theorem',
      credit: 'Elkies, Kuperberg, Larsen and Propp, 1992 (“Alternating-sign matrices and domino tilings”, I–II), where domino shuffling also first appears',
      statement: String.raw`The Aztec diamond of order $n$ is the union of the unit squares whose centres $(x,y)$ satisfy $|x|+|y|\le n$ (half-integer coordinates); it has $2n(n+1)$ squares. The number of ways to tile it with dominoes (two unit squares sharing an edge) is
$$2^{\,n(n+1)/2}.$$
Moreover a uniformly random tiling of order $n+1$ can be built from one of order $n$ by *domino shuffling*: delete the pairs of dominoes that are about to slide into each other, slide every other domino one step in its direction, and fill each remaining $2\times2$ hole with two parallel dominoes chosen by a fair coin.`,
      idea: String.raw`The count is proved in several ways; the one behind the picture is the shuffling bijection. Colour the squares as a chessboard, so every domino has a direction (N, S, E or W) given by which of its squares is black; sliding each domino one step in its direction maps tilings of order $n$ into configurations in the order-$(n+1)$ diamond, in which the only uncovered cells form $2\times2$ blocks that can be refilled in two ways. Keeping track of the "bad blocks" removed first shows that every tiling of order $n+1$ arises from the same number of choices, so $|\mathcal T_{n+1}|=2^{\,n+1}|\mathcal T_n|$ and $|\mathcal T_n|=2^{1+2+\cdots+n}$.`,
      caption: String.raw`A uniformly random tiling of the Aztec diamond of order $n$ (colours = the direction N, S, E, W of each domino), built by $n$ shuffling steps. Use **stage of the last step** to watch the final step from order $n-1$ to $n$: *destroy* (bad blocks in grey), *slide*, then *create* (new blocks, outlined). The readout lists the exact number of tilings found by exhaustive search (orders $\le5$) against $2^{n(n+1)/2}$.`,
      scope: String.raw`The shuffling algorithm was checked against exhaustive enumeration: for order 3, 64 000 shuffled samples hit all 64 tilings with frequencies within 10% of uniform; for order $\le 5$ the tilings are listed and counted.`,
      deps: ['comb-3.10'],
      refs: ['Stanley EC1 §2.7'],
      tags: ['domino tilings', 'Aztec diamond', 'shuffling'],
      viz(v) {
        let seed = 12;
        const nS = v.slider('order $n$', 1, 14, 6, { int: true });
        const stageS = v.select('stage of the last step', [{ value: 'before', label: 'order $n-1$' }, { value: 'destroy', label: 'destroy' }, { value: 'slide', label: 'slide' }, { value: 'create', label: 'create (order $n$)' }], 'create');
        v.button('New tiling', () => { seed++; cache = null; });
        const S = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: false, height: 440, weight: 1.5, title: 'the tiling' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, weight: 0.65, title: 'tilings of order $n$' });
        let cache = null;
        const make = (n) => {
          if (cache && cache.n === n) return cache;
          const r = v.rng(seed * 997 + n), rnd = () => r(); let t = []; const info = {}; let prev = [];
          for (let m = 0; m < n; m++) { prev = t; t = shuffleStep(t, m, rnd, info); }
          return (cache = { n, t, prev, info: n ? info : { bad: [], slid: [], created: [], n: 0 } });
        };
        const cnt = range(6).map((i) => (i <= 5 && i >= 1 ? azCount(i) : 1));
        let st = null;
        v.render(() => {
          const n = nS.value, { t, prev, info } = make(n), k = stageS.value;
          const R0 = n + 0.6; S.setView([-R0, R0], [-R0, R0]);
          const drawDom = (d, order, o = {}) => {
            const [c0, c1] = domCells(d), x0 = Math.min(c0[0], c1[0]), y0 = Math.min(c0[1], c1[1]), x1 = Math.max(c0[0], c1[0]) + 1, y1 = Math.max(c0[1], c1[1]) + 1;
            const col = o.color || DIR_COLOR[domType(d, order)];
            S.rect(x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, { fill: col, fillAlpha: o.alpha ?? 0.85, color: o.edge || col, width: o.width ?? 0.8, radius: n > 8 ? 1 : 3 });
          };
          let shownOrder = n;
          if (n >= 1 && k !== 'create') {
            const ord = n - 1; shownOrder = ord;
            if (k === 'before') prev.forEach((d) => drawDom(d, ord));
            else if (k === 'destroy') {
              const badSet = new Set(info.bad.map((d) => `${d.x},${d.y},${d.h}`));
              prev.forEach((d) => (badSet.has(`${d.x},${d.y},${d.h}`) ? drawDom(d, ord, { color: 'muted', alpha: 0.55, edge: 'red', width: 2 }) : drawDom(d, ord)));
            } else { // slide: dominoes now sit inside the order-n diamond, holes show the 2x2 blocks to fill
              for (const [x, y] of azCells(n)) S.rect(x + 0.08, y + 0.08, x + 0.92, y + 0.92, { fill: 'faint', fillAlpha: 0.28, color: 'faint', width: 0.5 });
              info.slid.forEach((d) => drawDom(d, n));
            }
          } else t.forEach((d) => drawDom(d, n));
          if (k === 'create' && n >= 1) info.created.forEach((d) => { const [c0, c1] = domCells(d); S.rect(Math.min(c0[0], c1[0]) + 0.04, Math.min(c0[1], c1[1]) + 0.04, Math.max(c0[0], c1[0]) + 0.96, Math.max(c0[1], c1[1]) + 0.96, { color: 'ink', width: 1.8, fill: null, stroke: true }); });
          S.corner(n < 1 ? 'empty diamond' : k === 'before' ? `tiling of order ${n - 1}` : k === 'destroy' ? `${info.bad.length / 2} bad blocks removed (grey)` : k === 'slide' ? `slid: ${info.slid.length} dominoes, holes = ${info.created.length / 2} blocks` : `order ${n}: ${info.created.length / 2} new blocks (outlined)`, 'tl', { plate: true });
          const valid = azValid(t, n);
          st = { n, valid, bad: info.bad.length / 2, blocks: info.created.length / 2 };
          // right: table of counts
          const Q = pen(v, T), W = Q.W;
          Q.text('n', 20, 24, { size: 12, color: 'muted', halo: false, align: 'left' }); Q.text('tilings', 70, 24, { size: 12, color: 'muted', halo: false, align: 'left' });
          for (let m = 1; m <= 8; m++) {
            const y = 52 + (m - 1) * 38, cur = m === n;
            if (cur) Q.rect(8, y - 15, W - 16, 30, { fill: 'gold', fillAlpha: 0.2, color: 'gold', r: 5 });
            Q.text(String(m), 20, y, { size: 14, color: 'ink', halo: false, align: 'left' });
            const val = 2 ** (m * (m + 1) / 2); Q.text(commas(val), 70, y, { size: 14, color: 'ink', halo: false, align: 'left', weight: cur ? 700 : 500 });
            Q.text(m <= 5 ? '✓' : '', W - 22, y, { size: 13, color: 'green', halo: false, align: 'center' });
          }
          Q.text('✓ = confirmed by listing', 12, 52 + 8 * 38, { size: 11, color: 'muted', halo: false, align: 'left' });
        });
        v.legend([['blue', 'N', { dot: true }], ['orange', 'S', { dot: true }], ['green', 'E', { dot: true }], ['red', 'W', { dot: true }]]);
        v.readout(() => {
          const { n, valid, bad, blocks } = st;
          const exact = n >= 1 && n <= 5 ? `Listing every tiling of the order-${n} diamond gives ${commas(cnt[n])} $=2^{${n * (n + 1) / 2}}$ ${cnt[n] === 2 ** (n * (n + 1) / 2) ? '✓' : '✗'}. ` : `$2^{${n * (n + 1) / 2}}=${commas(2 ** (n * (n + 1) / 2))}$ tilings (too many to list; the pattern for $n\\le5$ is confirmed above). `;
          return String.raw`${exact}The last shuffling step removed ${bad} bad block${bad === 1 ? '' : 's'} and filled ${blocks} blocks by coin flips; the result tiles the order-$${n}$ diamond exactly (${2 * n * (n + 1)} squares) ${valid ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Phenomenon',
      name: 'Arctic circle of random domino tilings',
      credit: 'Jockusch, Propp and Shor (preprint 1995, arXiv 1998): the “arctic circle theorem”',
      statement: String.raw`Take a uniformly random domino tiling of the Aztec diamond of order $n$. As $n\to\infty$, with probability tending to $1$ the tiling looks perfectly ordered ("frozen": a brick-wall pattern of dominoes all pointing the same way) outside the circle of radius $n/\sqrt2$ inscribed in the diamond, and disordered inside it; the four frozen regions are the four corners between the circle and the diamond.`,
      idea: String.raw`By 3.12 uniform tilings can be grown by shuffling. Following the dominoes of one direction along a diagonal turns the shuffling into a totally asymmetric exclusion process on a line, whose stationary measures can be classified; this gives the density of each domino type and shows it becomes degenerate exactly outside the circle. Equivalently, the number of tilings in which a given region is frozen is so much smaller than the number with entropy inside that the constrained tilings essentially never occur.`,
      caption: String.raw`A random tiling of an Aztec diamond of order $n$, sampled by domino shuffling (3.12). Drag $\rho$ to move the circle of radius $\rho\,n/\sqrt2$ ($\rho=1$ is the theorem's circle). The readout counts, for dominoes outside / inside the circle, the fraction pointing in the direction that dominates their quarter (N, S, E or W corner region): outside it is almost $1$, inside it is far from it. Increase $n$ and watch the boundary of the frozen regions get sharper.`,
      scope: String.raw`An asymptotic statement ($n\to\infty$); at finite $n$ the boundary between frozen and disordered regions is rough, so the fractions are close to, not exactly, $1$ outside the circle.`,
      deps: ['comb-3.12'],
      refs: ['Stanley EC1 §2.7'],
      tags: ['domino tilings', 'arctic circle', 'random'],
      viz(v) {
        let seed = 5, cache = null;
        const nS = v.slider('order $n$', 8, 90, 48, { int: true });
        const rhoS = v.slider('circle radius $\\rho$ (in units of $n/\\sqrt2$)', 0.3, 1.3, 1, { step: 0.01 });
        const circT = v.toggle('circle', true);
        v.button('New tiling', () => { seed++; cache = null; });
        const S = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 500, weight: 1.4, title: 'random tiling of the Aztec diamond' });
        const Hs = v.stage({ x: [0, 1.4], y: [0, 1.05], axes: 'box', gutter: true, height: 500, weight: 0.8, xlabel: 'distance from the centre, $r/(n/\\sqrt2)$', ylabel: 'fraction in the quarter’s majority direction', title: 'order against disorder' });
        const make = (n) => {
          if (cache && cache.n === n) return cache;
          const r = v.rng(seed * 31 + n), t = azRandom(n, () => r());
          return (cache = { n, t, ms: t.map((d) => { const [a, b] = domCells(d); return [(a[0] + b[0]) / 2 + 0.5, (a[1] + b[1]) / 2 + 0.5, domType(d, n)]; }) });
        };
        const sector = (x, y) => (Math.abs(x) > Math.abs(y) ? (x > 0 ? 0 : 1) : (y > 0 ? 2 : 3));
        let st = null;
        v.render(() => {
          const n = nS.value, { t, ms } = make(n), rho = rhoS.value, R = (n / Math.SQRT2) * rho;
          S.setView([-n - 0.5, n + 0.5], [-n - 0.5, n + 0.5]);
          const ctx = S.ctx;
          t.forEach((d, i) => {
            const [c0, c1] = domCells(d), x0 = Math.min(c0[0], c1[0]), y0 = Math.min(c0[1], c1[1]), x1 = Math.max(c0[0], c1[0]) + 1, y1 = Math.max(c0[1], c1[1]) + 1;
            ctx.fillStyle = v.color(DIR_COLOR[ms[i][2]], 0.9);
            const px0 = S.X(x0), px1 = S.X(x1), py0 = S.Y(y1), py1 = S.Y(y0);
            ctx.fillRect(px0 + 0.4, py0 + 0.4, px1 - px0 - 0.8, py1 - py0 - 0.8);
          });
          if (circT.value) S.circle(0, 0, R, { color: 'ink', width: 2.6 });
          // statistics per sector: majority type
          const cnt = [0, 1, 2, 3].map(() => ({ N: 0, S: 0, E: 0, W: 0 }));
          ms.forEach(([x, y, ty]) => { cnt[sector(x, y)][ty]++; });
          const maj = cnt.map((c) => Object.keys(c).reduce((a, b) => (c[a] >= c[b] ? a : b)));
          let outT = 0, outF = 0, inT = 0, inF = 0;
          const bins = Array.from({ length: 14 }, () => [0, 0]);
          ms.forEach(([x, y, ty]) => {
            const r = Math.hypot(x, y), same = ty === maj[sector(x, y)] ? 1 : 0;
            if (r > R) { outT++; outF += same; } else { inT++; inF += same; }
            const bi = Math.min(13, Math.floor((r / (n / Math.SQRT2)) * 10)); bins[bi][0]++; bins[bi][1] += same;
          });
          Hs.setView([0, 1.4], [0, 1.05]);
          Hs.vline(1, { color: 'ink', dash: true, width: 1.6 }); Hs.hline(1, { color: 'faint' });
          bins.forEach(([tot, sm], i) => { if (tot) Hs.rect(i / 10 + 0.01, 0, (i + 1) / 10 - 0.01, sm / tot, { fill: i / 10 >= 1 ? 'green' : 'orange', fillAlpha: 0.6, color: i / 10 >= 1 ? 'green' : 'orange' }); });
          if (circT.value) Hs.vline(rho, { color: 'gold', width: 2.4 });
          st = { n, outT, outF, inT, inF, maj };
        });
        v.legend([['blue', 'N', { dot: true }], ['orange', 'S', { dot: true }], ['green', 'E', { dot: true }], ['red', 'W', { dot: true }]]);
        v.readout(() => {
          const { n, outT, outF, inT, inF } = st;
          const f = (a, b) => (b ? v.fix((100 * a) / b, 1) + '%' : '—');
          return String.raw`Order $n=${n}$ (${commas(2 * n * (n + 1) / 2)} dominoes). Outside the circle ($${commas(outT)}$ dominoes) ${f(outF, outT)} point in their quarter's dominant direction; inside ($${commas(inT)}$ dominoes) only ${f(inF, inT)}. Bars: the same fraction in rings of width $0.1\cdot n/\sqrt2$ — close to $1$ beyond the circle (green), and well below it inside (orange).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Kasteleyn’s formula for domino tilings of a rectangle',
      credit: 'Kasteleyn, 1961; Temperley and Fisher, 1961 (independently)',
      statement: String.raw`The number of domino tilings of an $m\times n$ rectangle is
$$T(m,n)=\prod_{j=1}^{\lceil m/2\rceil}\prod_{k=1}^{\lceil n/2\rceil}\Big(4\cos^2\frac{\pi j}{m+1}+4\cos^2\frac{\pi k}{n+1}\Big).$$
For $m,n$ both odd the product contains the factor $j=\tfrac{m+1}2,k=\tfrac{n+1}2$ equal to $0$, matching the fact that an odd number of squares cannot be tiled. For instance $T(8,8)=12\,988\,816$, and $T(2,n)$ is a Fibonacci number.`,
      idea: String.raw`Tilings are perfect matchings of the grid graph, and the number of perfect matchings of a *planar* bipartite graph is the absolute value of the determinant of a suitably signed ("Kasteleyn") adjacency matrix: the signs are chosen so that every matching contributes with the same sign. For the rectangle this matrix is $D=A_m\otimes I+iI\otimes A_n$ with $A_m$ the path adjacency matrix, whose eigenvalues are $2\cos\frac{\pi j}{m+1}$, so $|\det D|$ is a product of the moduli $\sqrt{4\cos^2\frac{\pi j}{m+1}+4\cos^2\frac{\pi k}{n+1}}$, and pairing $j$ with $m+1-j$ gives the product above (the determinant formula of ladr 9.46 makes the signed count a determinant).`,
      caption: String.raw`Choose the board size $m\times n$. Left: a **uniformly random** tiling, drawn exactly from the transfer-matrix counts (button *New tiling*). Middle: the table of $T(m,n)$ (click to choose a size). Right: the factors $4\cos^2\frac{\pi j}{m+1}+4\cos^2\frac{\pi k}{n+1}$ whose product is the count. The readout compares the product with an exact count by transfer matrices, and, for boards of area at most $36$, with a plain listing of all tilings.`,
      deps: ['ladr-9.46'],
      refs: ['Stanley EC1 §4.7'],
      tags: ['domino tilings', 'perfect matchings', 'determinants'],
      viz(v) {
        let seed = 17, R = v.rng(seed), tiling = [];
        const mS = v.slider('rows $m$', 1, 10, 6, { int: true, onChange: () => resample() });
        const nS = v.slider('columns $n$', 1, 10, 8, { int: true, onChange: () => resample() });
        const resample = () => { R = v.rng(++seed); const m = mS.value, n = nS.value; tiling = (m * n) % 2 ? [] : rectSample(m, n, () => R()); };
        v.button('New tiling', () => resample());
        resample();
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.1, title: 'a random tiling' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.0, title: '$T(m,n)$' });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.8, title: 'the factors' });
        const tableN = 8;
        const brute = (m, n) => {
          const occ = Array.from({ length: m }, () => Array(n).fill(false)); let cnt = 0;
          const go = (p) => { while (p < m * n && occ[Math.floor(p / n)][p % n]) p++; if (p === m * n) { cnt++; return; } const r = Math.floor(p / n), c = p % n;
            occ[r][c] = true;
            if (c + 1 < n && !occ[r][c + 1]) { occ[r][c + 1] = true; go(p + 1); occ[r][c + 1] = false; }
            if (r + 1 < m) { occ[r + 1][c] = true; go(p + 1); occ[r + 1][c] = false; }
            occ[r][c] = false; };
          go(0); return cnt;
        };
        B.onClick((x, y) => {
          const px = B.X(x), py = B.Y(y), cw = (B.width - 40) / tableN, ch = (B.height - 40) / tableN;
          const j = Math.floor((px - 34) / cw), i = Math.floor((py - 30) / ch);
          if (i >= 0 && i < tableN && j >= 0 && j < tableN) { mS.set(i + 1); nS.set(j + 1); resample(); }
        });
        let st = null;
        v.render(() => {
          const m = mS.value, n = nS.value, P = pen(v, A), W = P.W, H = P.H, s = Math.min((W - 20) / n, (H - 20) / m), x0 = (W - n * s) / 2, y0 = (H - m * s) / 2;
          for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) P.rect(x0 + c * s, y0 + r * s, s, s, { fill: (r + c) % 2 ? 'faint' : 'panel', fillAlpha: (r + c) % 2 ? 0.3 : 1, color: 'faint', width: 0.8 });
          tiling.forEach((d, i) => { const w = d.h ? 2 : 1, h = d.h ? 1 : 2, col = d.h ? 'blue' : 'orange'; P.rect(x0 + d.x * s + 2, y0 + d.y * s + 2, w * s - 4, h * s - 4, { fill: col, fillAlpha: 0.85, color: col, width: 1, r: Math.min(8, s * 0.2) }); });
          if ((m * n) % 2) P.text('odd area: no tiling', W / 2, H / 2, { align: 'center', size: 16, weight: 700, color: 'red' });
          // table
          const Q = pen(v, B), cw = (Q.W - 40) / tableN, ch = (Q.H - 40) / tableN, TT = (a, b) => rectCount(a, b);
          for (let j = 1; j <= tableN; j++) Q.text(String(j), 34 + (j - 0.5) * cw, 16, { align: 'center', size: 11, color: 'muted', halo: false });
          for (let i = 1; i <= tableN; i++) {
            Q.text(String(i), 22, 30 + (i - 0.5) * ch, { align: 'center', size: 11, color: 'muted', halo: false });
            for (let j = 1; j <= tableN; j++) { const val = TT(i, j), cur = i === m && j === n;
              Q.rect(34 + (j - 1) * cw + 1, 30 + (i - 1) * ch + 1, cw - 2, ch - 2, { fill: cur ? 'gold' : val ? 'accent' : 'faint', fillAlpha: cur ? 0.9 : val ? 0.08 + 0.4 * Math.log10(val + 1) / 7.2 : 0.15, color: cur ? 'gold' : 'faint', width: cur ? 2.4 : 0.6, r: 3 });
              const txt = val >= 1e6 ? (val / 1e6).toFixed(val >= 1e7 ? 0 : 1) + 'M' : val >= 1e4 ? Math.round(val / 1e3) + 'k' : String(val);
              Q.text(txt, 34 + (j - 0.5) * cw, 30 + (i - 0.5) * ch, { align: 'center', size: Math.min(11, cw * 0.28), color: val ? 'ink' : 'muted', halo: false, weight: cur ? 700 : 400 });
            }
          }
          // factors heat
          const K = kasteleynProduct(m, n), Cp = pen(v, C), jm = Math.ceil(m / 2), kn = Math.ceil(n / 2), fs = Math.min((Cp.W - 36) / kn, (Cp.H - 40) / jm, 56), fx = (Cp.W - kn * fs) / 2 + 8, fy = 28;
          K.factors.forEach(({ j, k, v: val }) => {
            Cp.rect(fx + (k - 1) * fs + 1, fy + (j - 1) * fs + 1, fs - 2, fs - 2, { fill: val < 1e-9 ? 'red' : 'accent', fillAlpha: val < 1e-9 ? 0.35 : 0.1 + 0.55 * val / 8, color: 'faint', width: 0.8, r: 3 });
            Cp.text(val < 1e-9 ? '0' : val.toFixed(2), fx + (k - 0.5) * fs, fy + (j - 0.5) * fs, { align: 'center', size: Math.min(12, fs * 0.28), color: 'ink', halo: false });
          });
          Cp.tex('j\\downarrow,\\ k\\rightarrow', 10, 14, { size: 12, color: 'muted', align: 'left' });
          st = { m, n, K, exact: TT(m, n), list: m * n <= 36 ? brute(m, n) : null };
        });
        v.readout(() => {
          const { m, n, K, exact, list } = st;
          return String.raw`$T(${m},${n})=\prod_{j\le${Math.ceil(m / 2)},\,k\le${Math.ceil(n / 2)}}(\cdots)=${commas(Math.round(K.value))}$ (the product of ${K.factors.length} factors, evaluated in floating point: $${K.value.toPrecision(9)}$). Exact transfer-matrix count: $${commas(exact)}$ ${Math.round(K.value) === exact ? '✓' : '✗'}.${list != null ? ` Listing all tilings of the $${m}\\times${n}$ board finds $${commas(list)}$ ${list === exact ? '✓' : '✗'}.` : ''}`;
        });
      },
    },
  ],
};
