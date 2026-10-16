// Graph Theory (Diestel) — Chapter 5, part Z1 (§5.4: list colouring, choice number, kernels, Alon, Thomassen, Galvin)
import {
  K, ix, CP, GAL, gstage, placed, loadSpec, masksOf, masksOfG, outMasks, full, lowBit, popc, bitsOf, listColour, countListColourings,
  chiOf, isKernel, allKernels, hasKernel, chips, ring, rnd, randList, galvin, kernelColouring, inPoly, faceWalks, ixE, spread,
  randomTriangulation, triDraw, isKconn, relaxPlane, complementA, edgesOf,
} from './ch05-z.shared.js';

const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const K24 = () => ({ P: [[-1.5, 1], [1.5, 1], [-2.25, -1], [-0.75, -1], [0.75, -1], [2.25, -1]], E: [0, 1].flatMap((a) => [2, 3, 4, 5].map((b) => [a, b])) });
const loadDi = (G, spec) => { G.set({ nodes: spec.nodes.map((n) => ({ ...n })), edges: spec.edges.map((e) => ({ ...e })), directed: true }); G.layout('none'); };
const sub = (a) => a.map((x) => x + 1).join(', ');

// ---------- Thomassen's induction (the proof of the stronger statement), run on a straight-line near-triangulation ----------
/** Colour S from the lists L given that cyc[0], cyc[1] are already coloured; records colour events and notes in ev. */
function thomassen(Am, P, S, cyc, col, L, ev) {
  const k = cyc.length, c0 = cyc[0], c1 = cyc[1], one = (x) => x + 1;
  if (k === 3 && popc(S) === 3) {
    const v = cyc[2], al = L[v] & ~(1 << col[c0]) & ~(1 << col[c1]); col[v] = lowBit(al);
    ev.push({ v, c: col[v], note: `the triangle ${one(c0)}${one(c1)}${one(v)} is closed: vertex ${one(v)} has at least 3 colours and two neighbours` }); return;
  }
  const region = (cy) => { const poly = cy.map((u) => P[u]); let m = 0; for (let u = 0; u < P.length; u++) if ((S >> u & 1) && (cy.includes(u) || inPoly(P[u], poly))) m |= 1 << u; return m; };
  for (let i = 0; i < k; i++) for (let j = i + 2; j < k; j++) {
    if (i === 0 && j === k - 1) continue;
    if (!(Am[cyc[i]] >> cyc[j] & 1)) continue;
    const a = cyc.slice(i, j + 1), b = cyc.slice(j).concat(cyc.slice(0, i + 1)), rot = (x) => [x[x.length - 1], ...x.slice(0, -1)];
    let first, second;
    if (i === 0) { first = a; second = rot(b); } else { const r = k - j; first = b.slice(r).concat(b.slice(0, r)); second = rot(a); }
    ev.push({ note: `chord ${one(cyc[i])}${one(cyc[j])} splits the graph into two smaller near-triangulations; the part containing the coloured edge ${one(c0)}${one(c1)} goes first` });
    thomassen(Am, P, region(first), first, col, L, ev);
    ev.push({ note: `second part: its chord edge ${one(second[0])}${one(second[1])} is now coloured` });
    thomassen(Am, P, region(second), second, col, L, ev); return;
  }
  const vk = cyc[k - 1], oldMask = cyc.reduce((m, u) => m | (1 << u), 0), two = bitsOf(L[vk] & ~(1 << col[c0])).slice(0, 2);
  const S2 = S & ~(1 << vk), ids = bitsOf(S2), at = new Map(ids.map((u, i) => [u, i])), E = [];
  ids.forEach((a2, i) => ids.forEach((b2, j) => { if (i < j && (Am[a2] >> b2 & 1)) E.push([i, j]); }));
  const Hs = ixE(ids.length, E), walk = faceWalks(Hs, ids.map((u) => P[u])).find((f) => f.area < 0).walk.map((i) => ids[i]);
  let w = walk; const ix0 = w.indexOf(c0);
  if (w[(ix0 + 1) % w.length] !== c1) w = w.slice().reverse();
  const r0 = w.indexOf(c0), newCyc = w.slice(r0).concat(w.slice(0, r0)), L2 = L.slice();
  for (const u of newCyc) if (!(oldMask >> u & 1)) L2[u] &= ~((1 << two[0]) | (1 << two[1]));
  ev.push({ note: `no chord: delete ${one(vk)}, remove its two candidate colours from the lists of its inner neighbours (they stay at 3 or more), colour the rest first` });
  thomassen(Am, P, S2, newCyc, col, L2, ev);
  const c = two.find((x) => x !== col[cyc[k - 2]]); col[vk] = c;
  ev.push({ v: vk, c, note: `vertex ${one(vk)} returns: it takes whichever of its two reserved colours its outer neighbour ${one(cyc[k - 2])} did not use` });
}

export default {
  collection: 'graph',
  chapter: 5,
  items: [
    // =====================================================================================================  5.4
    {
      num: '5.4.1a', kind: 'Definition', name: 'List colouring and choice number', verify: true,
      statement: String.raw`A **list assignment** gives every vertex $v$ of a graph $G$ a set $L(v)$ of colours. A **colouring from the lists** is a proper vertex colouring $c$ with $c(v)\in L(v)$ for all $v$. The graph $G$ is **$k$-choosable** if a colouring from the lists exists for every assignment with $|L(v)|=k$ at every vertex. The **choice number** (list-chromatic number) $\operatorname{ch}(G)$ is the least $k$ for which $G$ is $k$-choosable. Giving all vertices the same list shows $\chi(G)\le\operatorname{ch}(G)$.`,
      idea: String.raw`The point of lists is that the adversary may give neighbouring vertices *different* lists, so a colour that is fine at one vertex may be forbidden at another. Ordinary colouring is the special case of identical lists, hence $\chi\le\operatorname{ch}$; the two can differ a lot (5.4.1), and for some graphs they agree (5.4.5). Greedy colouring shows $\operatorname{ch}(G)\le\Delta(G)+1$ just as it does for $\chi$.`,
      caption: String.raw`Click a vertex, then click colours in the strip below to add them to or remove them from its list. The app searches for a colouring from the lists (shown as filled vertices) and counts how many there are. *Adversarial lists* gives size-2 lists for which $K_{3,3}$, $K_{2,4}$ and $C_5$ have **no** colouring although $\chi(K_{3,3})=\chi(K_{2,4})=2$. *Identical lists* is ordinary colouring.`,
      deps: ['graph-5.1.1a'], refs: ['Diestel §5.4'], tags: ['list colouring', 'choice number'], credit: 'Vizing, 1976; Erdős, Rubin & Taylor, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/List_coloring' },
      viz(v) {
        const PRE = { c4: GAL.c4, c5: GAL.c5, k33: GAL.k33, k24: K24 };
        const ex = v.select('graph', [{ value: 'c4', label: '$C_4$' }, { value: 'c5', label: '$C_5$' }, { value: 'k33', label: '$K_{3,3}$' }, { value: 'k24', label: '$K_{2,4}$' }], 'k33', { onChange: () => load('adv') });
        const q = v.slider('colours', 3, 6, 3, { int: true });
        const ksz = v.slider('list size for random lists', 1, 4, 2, { int: true });
        const s = gstage(v, { height: 360 });
        let L = [], sel = null, nV = 0;
        const G = v.graph(s, { nodes: [], edges: [], r: 14, draggable: false, onClick: ({ node, x, y }) => {
          if (node) { sel = sel === node.id ? null : node.id; return true; }
          if (sel != null && y < 1.5) { const i = Math.round((x - (5 - ((q.value - 1) * 0.5))) / 1.0); if (i >= 0 && i < q.value) L[sel] ^= 1 << i; return true; }
          return true;
        } });
        const ADV = { k33: [3, 5, 6, 3, 5, 6], k24: [3, 12, 5, 9, 6, 10], c4: [3, 3, 3, 3], c5: [3, 3, 3, 3, 3] };
        function load(mode) {
          const g = PRE[ex.value](); loadSpec(G, placed(g.P, g.E, [1.4, 2.0, 8.6, 5.3])); nV = g.P.length; sel = null;
          if (mode === 'adv') { L = ADV[ex.value].slice(); q.set(ex.value === 'k24' ? 4 : 3); }
          else if (mode === 'same') L = new Array(nV).fill((1 << ksz.value) - 1);
          else { const r = rnd(Math.floor(Math.random() * 1e6)); L = Array.from({ length: nV }, () => randList(q.value, ksz.value, r)); }
        }
        v.button('adversarial lists', () => load('adv'));
        v.button('random lists', () => load('rand'));
        v.button('identical lists', () => load('same'));
        load('adv');
        let info = null;
        v.render(() => {
          const { A, n } = masksOfG(G), S = full(n), col = listColour(A, S, L), cnt = col ? countListColourings(A, S, L, 999) : 0;
          G.draw({ nodeFill: (id) => (col && col[+id] >= 0 ? CP[col[+id]] : null), nodeColor: (id) => (col ? null : 'red') });
          for (let i = 0; i < n; i++) chips(v, s, G, i, L[i]);
          if (sel != null) ring(v, s, G, [sel], 'ink', 19);
          const x0 = 5 - ((q.value - 1) * 0.5);
          for (let i = 0; i < q.value; i++) { const on = sel != null && (L[sel] >> i & 1); s.dot(x0 + i, 0.85, { r: on ? 11 : 7, color: CP[i], hollow: sel != null && !on }); }
          s.text(sel == null ? 'click a vertex, then colours here to edit its list' : `list of vertex ${sel + 1}`, 5, 0.25, { size: 12, color: 'muted', align: 'center' });
          info = { n, chi: chiOf(A, S), found: !!col, cnt, sizes: L.map(popc) };
        });
        v.readout(() => !info ? '' : `$|L|$ = ${info.sizes.join(', ')} · $\\chi(G)=${info.chi}$ · **${info.found ? `colouring from the lists found; ${info.cnt >= 999 ? '≥ 999' : info.cnt} in all ✓` : 'no colouring from these lists ✗'}**${!info.found && Math.min(...info.sizes) >= info.chi ? ' — so $G$ is not $' + Math.min(...info.sizes) + '$-choosable, although $\\chi(G)=' + info.chi + '$' : ''}`);
      },
    },
    {
      num: '5.4.1', kind: 'Theorem', name: 'Alon: the choice number grows with the average degree', verify: true,
      statement: String.raw`There is a function $o(1)\to0$ such that every graph $G$ of average degree $d$ satisfies
$$\operatorname{ch}(G)\;\ge\;\bigl(\tfrac12+o(1)\bigr)\log_2 d\qquad(d\to\infty).$$
In particular there are bipartite graphs, for which $\chi=2$, with arbitrarily large choice number.`,
      idea: String.raw`Alon's proof is probabilistic: it assigns random lists of size $k$ and shows that, once the degrees are large compared with roughly $4^k$, some vertex always has all its colours forbidden by its neighbours. The picture shows the same mechanism in its cleanest explicit form, the Erdős–Rubin–Taylor lists on $K_{n,n}$: give the vertices on each side **all** $k$-subsets of a palette of $2k-1$ colours. The colours used on the top side form a set $X$ that must hit every $k$-subset of the palette, so $|X|\ge k$; likewise the colours used on the bottom side must number at least $k$, and they must be disjoint from $X$. Needing $2k$ colours from a palette of $2k-1$ is impossible, so $K_{n,n}$ with $n=\binom{2k-1}{k}\approx4^k$ is not $k$-choosable.`,
      caption: String.raw`Choose $k$ and click colours in the strip to put them into the set $X$ of colours used on the top side. A top vertex can be coloured if its list meets $X$; a bottom vertex if its list is **not** inside $X$. Red cells are vertices left without a colour. Whatever $X$ you try, some cell is red: with $|X|<k$ the top side fails, with $|X|\ge k$ the bottom side does. The chart records the bound $\operatorname{ch}(K_{n,n})\ge k+1$ at $n=\binom{2k-1}{k}$ against the curve $\tfrac12\log_2 n$.`,
      deps: ['graph-5.4.1a', 'graph-1.2.1a'], refs: ['Diestel §5.4'], tags: ['list colouring', 'probabilistic method'], credit: 'Alon, 1990s',
      scope: String.raw`The $o(1)$ is asymptotic: for small $d$ the bound says nothing. The explicit instance uses only the complete bipartite graph; Alon's theorem is for arbitrary graphs.`,
      viz(v) {
        const kS = v.slider('list size $k$', 1, 4, 3, { int: true, onChange: () => reset() });
        let k = 3, pal = 5, lists = [], X = 0, cols = 5, rows = 2;
        const mkStage = (title) => v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, title, minWidth: 300 });
        const sA = mkStage('top side: lists of $k$ colours'), sB = mkStage('bottom side');
        const sP = v.stage({ x: [0, 7], y: [0, 1], axes: false, height: 80, title: 'click colours to put them into $X$', full: true });
        const sC = v.stage({ x: [1, 10000], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 250, xlabel: '$n$', ylabel: 'lower bound on ch', title: 'lower bounds for $\\operatorname{ch}(K_{n,n})$', full: true });
        function reset() {
          k = kS.value; pal = 2 * k - 1; lists = []; for (let m = 0; m < 1 << pal; m++) if (popc(m) === k) lists.push(m);
          cols = k >= 4 ? 7 : Math.min(5, lists.length); rows = Math.ceil(lists.length / cols); X = 0;
          for (const s of [sA, sB]) s.setView([0, cols], [0, rows]); sP.setView([0, pal], [0, 1]);
        }
        reset();
        sP.onClick((x) => { const i = Math.floor(x); if (i >= 0 && i < pal) X ^= 1 << i; v.invalidate(); });
        const cell = (s, i, color, filled) => {
          const cx = i % cols, ry = rows - 1 - Math.floor(i / cols);
          s.rect(cx + 0.06, ry + 0.08, cx + 0.94, ry + 0.92, { fill: color, fillAlpha: filled ? 0.28 : 0.1, color, radius: 6 });
          const c = s.ctx, bs = bitsOf(lists[i]), X0 = s.X(cx + 0.5) - ((bs.length - 1) * 10) / 2, Y0 = s.Y(ry + 0.5);
          bs.forEach((b, j) => { c.beginPath(); c.arc(X0 + j * 10, Y0, 3.6, 0, 2 * Math.PI); c.fillStyle = v.color(CP[b]); c.fill(); if (X >> b & 1) { c.lineWidth = 1.3; c.strokeStyle = v.color('ink'); c.stroke(); } });
        };
        let info = null;
        v.render(() => {
          let uA = 0, uB = 0;
          lists.forEach((m, i) => { const okA = (m & X) !== 0, okB = (m & ~X) !== 0; cell(sA, i, okA ? 'green' : 'red', true); cell(sB, i, okB ? 'green' : 'red', true); uA += okA ? 0 : 1; uB += okB ? 0 : 1; });
          for (let i = 0; i < pal; i++) { const on = X >> i & 1; sP.dot(i + 0.5, 0.5, { r: on ? 15 : 9, color: CP[i], hollow: !on }); }
          sC.fn((x) => 0.5 * Math.log2(x), { color: 'muted', dash: true, domain: [1, 10000] });
          const pts = []; for (let kk = 1; kk <= 8; kk++) pts.push([binom(2 * kk - 1, kk), kk + 1]);
          pts.forEach(([x, y], i) => sC.dot(x, y, { r: i + 1 === k ? 7 : 4.5, color: i + 1 === k ? 'accent' : 'orange', label: i + 1 === k ? `$k=${k}$` : null, labelPos: 'nw' }));
          info = { uA, uB, a: popc(X), n: lists.length };
        });
        v.legend([['orange', 'bound $\\operatorname{ch}\\ge k+1$ at $n=\\binom{2k-1}{k}$', { dot: true }], ['muted', '$\\tfrac12\\log_2 n$ (order of Alon’s bound)', { dash: true }], ['green', 'vertex can be coloured', { area: true }], ['red', 'vertex has no colour left', { area: true }]]);
        v.readout(() => `$K_{n,n}$ with $n=\\binom{${2 * k - 1}}{${k}}=${info.n}$ and a palette of ${2 * k - 1} colours. $|X|=${info.a}$: top vertices without a colour **${info.uA}** (every list outside $X$), bottom vertices without a colour **${info.uB}** (every list inside $X$). Always at least one, so $K_{${info.n},${info.n}}$ is not ${k}-choosable.`);
      },
    },
    {
      num: '5.4.2', kind: 'Theorem', name: 'Thomassen: planar graphs are 5-choosable',
      statement: String.raw`Every planar graph is 5-choosable. This follows from a stronger statement that can be proved by induction. Let $G$ be a plane near-triangulation (every bounded face is a triangle, the outer face is bounded by a cycle $C$) and let $v_1v_2$ be an edge of $C$ whose ends are already coloured with different colours. If every vertex of $C$ other than $v_1,v_2$ has a list of at least 3 colours and every inner vertex a list of at least 5 colours, then the colouring extends to a colouring of $G$ from the lists.`,
      idea: String.raw`Planar graphs are subgraphs of near-triangulations (4.2.8), so the strong statement suffices. If $C$ has a chord, it cuts $G$ into two smaller near-triangulations: colour the one containing $v_1v_2$, then the other one, whose chord is now coloured. Otherwise delete the neighbour $v_k$ of $v_1$ on $C$; pick two colours in $L(v_k)$ different from $c(v_1)$ and remove them from the lists of the inner neighbours of $v_k$, which become outer vertices of $G-v_k$ and still have $\ge3$ colours. Colour $G-v_k$ by induction, then give $v_k$ the one of its two reserved colours not used on its neighbour $v_{k-1}$.`,
      caption: String.raw`A random plane near-triangulation with random lists of 5 colours on inner vertices and 3 on outer ones (dots above the vertices); the two bold outer vertices are precoloured. The slider walks through the induction in the order in which colours are finally fixed, and the text says which case of the proof applies. Increase *outer vertices removed* to get an outer cycle of length 4 or more, where chords can occur. New instance draws another triangulation and other lists.`,
      deps: ['graph-5.4.1a', 'graph-4.2.8'], refs: ['Diestel §5.4'], tags: ['list colouring', 'planar graphs'], credit: 'Thomassen, 1994',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/List_coloring' },
      scope: String.raw`Five lists are needed in general: Voigt (1993) found a planar graph that is not 4-choosable.`,
      viz(v) {
        const nS = v.slider('vertices', 6, 14, 9, { int: true, onChange: () => build() });
        const qS = v.slider('colours in the palette', 5, 8, 6, { int: true, onChange: () => build() });
        const rmS = v.slider('outer vertices removed', 0, 2, 0, { int: true, onChange: () => build() });
        const s = gstage(v, { height: 380 });
        const G = v.graph(s, { nodes: [], edges: [], r: 13, draggable: false });
        let seed = 3, inst = null;
        const t = v.slider('colours fixed so far', 0, 20, 20, { int: true });
        function build() {
          const n = nS.value, r = v.rng(seed * 7919 + n), T = triDraw(randomTriangulation(n, r, 8)), P0 = relaxPlane(n, T.E, spread(n, T.E, T.pos, 60, [0, 1, 2]), [0, 1, 2]);
          // delete outer vertices (keeping 2-connectivity) to get a longer outer cycle
          let keep = full(n), Am = masksOf(n, T.E), outer = [0, 1, 2];
          for (let rm = 0; rm < rmS.value; rm++) {
            const cand = outer.filter((u) => u !== 0 && u !== 1);
            let done = false;
            for (const u of cand) {
              const k2 = keep & ~(1 << u), ids = bitsOf(k2), E2 = []; ids.forEach((a, i) => ids.forEach((b, j) => { if (i < j && (Am[a] >> b & 1)) E2.push([i, j]); }));
              const H2 = ixE(ids.length, E2); if (!isKconn(H2, 2)) continue;
              const w = faceWalks(H2, ids.map((x) => P0[x])).find((f) => f.area < 0).walk.map((i) => ids[i]);
              keep = k2; outer = w; done = true; break;
            }
            if (!done) break;
          }
          const ids = bitsOf(keep), at = new Map(ids.map((u, i) => [u, i])), E = [];
          ids.forEach((a, i) => ids.forEach((b, j) => { if (i < j && (Am[a] >> b & 1)) E.push([i, j]); }));
          const P = ids.map((u) => P0[u]), H = ixE(ids.length, E), Am2 = masksOf(ids.length, E);
          const walk = faceWalks(H, P).find((f) => f.area < 0).walk; let cyc = walk.slice();
          const rr = rnd(seed * 31 + 7), q = qS.value, L = new Array(ids.length), onC = new Set(cyc);
          for (let u = 0; u < ids.length; u++) L[u] = randList(q, onC.has(u) ? 3 : 5, rr);
          const col = new Int8Array(ids.length).fill(-1), a0 = Math.floor(rr() * q); let a1 = Math.floor(rr() * (q - 1)); if (a1 >= a0) a1++;
          col[cyc[0]] = a0; col[cyc[1]] = a1; L[cyc[0]] = 1 << a0; L[cyc[1]] = 1 << a1;
          const ev = []; thomassen(Am2, P, full(ids.length), cyc, col, L, ev);
          const nCol = ev.filter((e) => e.v != null).length; t.set(nCol);
          inst = { n: ids.length, E, P, L, col, ev, cyc, nCol, Am: Am2 };
          loadSpec(G, placed(P, E, [1.2, 0.9, 8.8, 5.7]));
        }
        v.button('new instance', () => { seed++; build(); });
        build();
        let info = null;
        v.render(() => {
          const I = inst; t.el.hidden = false;
          let shown = 0; const done = new Set([I.cyc[0], I.cyc[1]]), cur = [];
          let last = null; for (const e of I.ev) { if (e.v != null) { if (shown >= t.value) break; shown++; done.add(e.v); last = e; } else if (shown <= t.value) cur.push(e); }
          const cyc = new Set(I.cyc), cw = (e) => { const [a, b] = [e.from, e.to]; return cyc.has(+a) && cyc.has(+b) && Math.abs(I.cyc.indexOf(+a) - I.cyc.indexOf(+b)) % (I.cyc.length - 1) <= 1 ? 3.5 : 1.5; };
          G.draw({ nodeFill: (id) => (done.has(+id) ? CP[I.col[+id]] : null), edgeWidth: cw, nodeNote: null });
          for (let u = 0; u < I.n; u++) chips(v, s, G, u, I.L[u], { r: 3.3, gap: 8.5, dy: -21, dim: done.has(u) && u !== I.cyc[0] && u !== I.cyc[1], mark: done.has(u) ? I.col[u] : null });
          ring(v, s, G, [I.cyc[0], I.cyc[1]], 'ink', 18);
          let ok = true; for (const [a, b] of I.E) if (I.col[a] === I.col[b] || I.col[a] < 0) ok = false; for (let u = 0; u < I.n; u++) if (!(I.L[u] >> I.col[u] & 1)) ok = false;
          info = { ok, last, note: last ? last.note : 'only the two precoloured vertices (ringed) are fixed', shown };
        });
        v.readout(() => !info ? '' : `After ${info.shown} of ${inst.nCol} colours: ${info.note}.\nFinal colouring proper and from the lists: **${info.ok ? '✓' : '✗'}**.`);
      },
    },
    {
      num: '5.4.2a', kind: 'Hypothesis', name: 'List colouring conjecture', verify: true,
      statement: String.raw`The **list-chromatic index** $\operatorname{ch}'(G)$ of a graph (or multigraph) $G$ is the choice number of its line graph, the least $k$ such that for every assignment of $k$ colours to each *edge* a proper edge colouring from the lists exists. The **list colouring conjecture** asserts $\operatorname{ch}'(G)=\chi'(G)$ for every (multi)graph $G$. It is open in general; it is known for bipartite graphs (5.4.4).`,
      idea: String.raw`Since identical lists give ordinary edge colourings, $\chi'\le\operatorname{ch}'$ always, and the conjecture says the adversary gains nothing from lists. By Vizing's theorem (5.3.2) the number $\chi'$ is either $\Delta$ or $\Delta+1$, so the conjecture predicts that $\Delta+1$ list colours always suffice for simple graphs. No counterexample is known, and the evidence below is of course not a proof.`,
      caption: String.raw`Choose a graph and a list size $k$. *Search* tries to make the number of colourings from the lists as small as possible by changing one colour of one edge list at a time (hill climbing with restarts, counted up to 300). With $k<\chi'$ every assignment fails already (identical lists). With $k=\chi'$ the search should never reach 0; it reports the smallest number found. The thin dashed edges show a failing assignment when $k<\chi'$.`,
      deps: ['graph-5.4.1a', 'graph-5.1.1b'], refs: ['Diestel §5.4'], tags: ['list colouring', 'conjecture'], credit: 'origin unclear, 1970s–80s',
      scope: String.raw`Verified here only for the few small graphs of the picture, and only by random search for bad lists.`,
      viz(v) {
        const PRE = { k4: GAL.k4, c5: GAL.c5, k33: GAL.k33, pet: GAL.petersen, house: GAL.house };
        const ex = v.select('graph', [{ value: 'k4', label: '$K^4$' }, { value: 'c5', label: '$C_5$' }, { value: 'house', label: 'house' }, { value: 'k33', label: '$K_{3,3}$' }, { value: 'pet', label: 'Petersen' }], 'k4', { onChange: () => load() });
        const kS = v.slider('list size $k$', 2, 5, 3, { int: true, onChange: () => same() });
        const s = gstage(v, { height: 360 });
        const G = v.graph(s, { nodes: [], edges: [], r: 8, draggable: false });
        let E = [], n = 0, LA = [], chiP = 0, L = [], bestCnt = null, tried = 0, rg = rnd(11);
        function load() {
          const g = PRE[ex.value](); n = g.P.length; E = g.E; loadSpec(G, placed(g.P, g.E, [1.6, 0.8, 8.4, 5.7], () => ''));
          const m = E.length; LA = new Array(m).fill(0);
          for (let a = 0; a < m; a++) for (let b = a + 1; b < m; b++) if (E[a].some((x) => E[b].includes(x))) { LA[a] |= 1 << b; LA[b] |= 1 << a; }
          chiP = chiOf(LA, full(m)); kS.set(chiP); same();
        }
        function same() { L = E.map(() => (1 << kS.value) - 1); bestCnt = null; tried = 0; }
        const cntOf = (LL) => countListColourings(LA, full(E.length), LL, 300);
        v.button('search for bad lists', () => {
          const k = kS.value, pal = k + 2, m = E.length; let best = 1e9, bestL = null; const t0 = performance.now();
          for (let rst = 0; rst < 40 && performance.now() - t0 < 1500 && best > 0; rst++) {
            let cur = E.map(() => randList(pal, k, rg)), c = cntOf(cur);
            for (let it = 0; it < 120 && c > 0; it++) {
              const e = Math.floor(rg() * m), nl = cur.slice(), bs = bitsOf(nl[e]), out = bs[Math.floor(rg() * bs.length)], free = bitsOf(full(pal) & ~nl[e]);
              nl[e] = (nl[e] & ~(1 << out)) | (1 << free[Math.floor(rg() * free.length)]);
              const c2 = cntOf(nl); if (c2 <= c) { cur = nl; c = c2; }
            }
            tried++; if (c < best) { best = c; bestL = cur; }
          }
          L = bestL; bestCnt = best;
        });
        v.button('identical lists', () => same());
        load();
        let info = null;
        v.render(() => {
          const m = E.length, col = listColour(LA, full(m), L);
          const ec = col && !col.timeout ? col : null;
          G.draw({ edgeColor: (e) => (ec ? CP[ec[ix(G).eix.get(e)]] : 'red'), edgeWidth: () => 4, edgeDash: (e) => (ec ? null : [4, 4]) });
          const H = ix(G); E.forEach(([a, b], k2) => {
            const na = G.node(H.ids[a]), nb = G.node(H.ids[b]), c = s.ctx, bs = bitsOf(L[k2]), tt = 0.3 + 0.1 * (k2 % 3), mx = s.X(na.x) + tt * (s.X(nb.x) - s.X(na.x)), my = s.Y(na.y) + tt * (s.Y(nb.y) - s.Y(na.y));
            bs.forEach((x, j) => { c.beginPath(); c.arc(mx + (j - (bs.length - 1) / 2) * 8, my - 8, 3.4, 0, 2 * Math.PI); c.fillStyle = v.color(CP[x]); c.fill(); c.lineWidth = 0.8; c.strokeStyle = v.color('panel'); c.stroke(); });
          });
          info = { m, found: !!ec, cnt: ec ? countListColourings(LA, full(m), L, 999) : 0, k: kS.value };
        });
        v.readout(() => !info ? '' : `${info.m} edges, $\\chi'=${chiP}$, list size $k=${info.k}$. Colourings from the current lists: **${info.found ? (info.cnt >= 999 ? '≥ 999' : info.cnt) : 'none'}**.${bestCnt != null ? ` Search (${tried} restarts): fewest colourings found = **${bestCnt}**${bestCnt === 0 ? (info.k < chiP ? ' — as it must be for $k<\\chi\'$' : ' — a counterexample to the conjecture!') : ' — the conjecture survives this search'}.` : ''}`);
      },
    },
    {
      num: '5.4.2b', kind: 'Definition', name: 'Kernels of directed graphs', verify: true,
      statement: String.raw`Let $D$ be a directed graph. A set $K\subseteq V(D)$ is a **kernel** of $D$ if it is independent (no arc has both ends in $K$) and **absorbing**: every vertex outside $K$ is the tail of an arc ending in $K$.`,
      idea: String.raw`Think of a kernel as a set of "winning positions": nobody in it can move to another member, and from everywhere else one can move into it. Not every digraph has one: the directed triangle has none, since a single vertex leaves its predecessor unabsorbed and two vertices are joined by an arc. Digraphs without directed cycles always have a kernel (take the sinks and work backwards), and so, by a theorem of Richardson, do digraphs without directed odd cycles. Kernels turn out to be exactly what is needed to colour from lists (5.4.3).`,
      caption: String.raw`Click vertices to build a set $K$ (ringed), click an arc to reverse it. Arcs inside $K$ are drawn red (independence fails); a vertex outside $K$ with no arc into $K$ gets a red ring (not absorbed). *Show a kernel* selects one if it exists; *reset* restores the preset. Try the directed triangle and pentagon (no kernel), the directed square (two kernels) and the transitive tournament (exactly one).`,
      deps: ['graph-1.10.1a'], refs: ['Diestel §5.4'], tags: ['kernels', 'directed graphs'],
      viz(v) {
        const PR = {
          c3: () => ({ P: [[0, 1], [-0.87, -0.5], [0.87, -0.5]], A: [[0, 2], [2, 1], [1, 0]] }),
          c4: () => ({ P: [[-1, 1], [1, 1], [1, -1], [-1, -1]], A: [[0, 1], [1, 2], [2, 3], [3, 0]] }),
          c5: () => ({ P: GAL.c5().P, A: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] }),
          tour: () => ({ P: [[-1, 1], [1, 1], [1, -1], [-1, -1]], A: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] }),
          bip: () => ({ P: GAL.c4().P, A: [[0, 1], [2, 1], [2, 3], [0, 3]] }),
        };
        const ex = v.select('digraph', [{ value: 'c3', label: 'directed $C_3$' }, { value: 'c4', label: 'directed $C_4$' }, { value: 'c5', label: 'directed $C_5$' }, { value: 'tour', label: 'transitive tournament' }, { value: 'bip', label: 'sources and sinks' }], 'c3', { onChange: () => load() });
        const s = gstage(v, { height: 340 });
        let Ksel = 0;
        const G = v.graph(s, { nodes: [], edges: [], directed: true, r: 14, draggable: false, onClick: ({ node, edge }) => {
          if (node) { Ksel ^= 1 << +node.id; return true; }
          if (edge) { [edge.from, edge.to] = [edge.to, edge.from]; return true; }
          return true;
        } });
        function load() { const g = PR[ex.value](); loadDi(G, { ...placed(g.P, g.A, [2.2, 0.9, 7.8, 5.6]), edges: g.A.map(([a, b]) => ({ from: a, to: b })) }); Ksel = 0; }
        v.button('show a kernel', () => { const O = outMasks(G), n = G.nodes.length, k = hasKernel(O, full(n)); if (k >= 0) Ksel = k; });
        v.button('reset', load);
        load();
        let info = null;
        v.render(() => {
          const O = outMasks(G), n = G.nodes.length, S = full(n), all = allKernels(O, S);
          const inside = new Set(); G.edges.forEach((e) => { if ((Ksel >> +e.from & 1) && (Ksel >> +e.to & 1)) inside.add(e); });
          const bad = []; for (let u = 0; u < n; u++) if (!(Ksel >> u & 1) && !(O[u] & Ksel)) bad.push(u);
          G.draw({ nodeFill: (id) => (Ksel >> +id & 1 ? 'green' : null), edgeColor: (e) => (inside.has(e) ? 'red' : null), edgeWidth: (e) => (inside.has(e) ? 3.5 : null) });
          ring(v, s, G, bad, 'red', 19);
          info = { ok: isKernel(O, S, Ksel), indep: inside.size === 0, nbad: bad.length, nk: all.length, ex: all.slice(0, 4).map((k) => '{' + sub(bitsOf(k)) + '}').join(', ') };
        });
        v.readout(() => !info ? '' : `$K$ = {${sub(bitsOf(Ksel))}}: independent **${info.indep ? '✓' : '✗'}**, absorbing **${info.nbad === 0 ? '✓' : `✗ (${info.nbad} not absorbed)`}** → kernel **${info.ok ? '✓' : '✗'}**.\nThis digraph has **${info.nk}** kernel${info.nk === 1 ? '' : 's'}${info.nk ? ': ' + info.ex : ''}.`);
      },
    },
    {
      num: '5.4.3', kind: 'Lemma', name: 'Orientations with kernels allow colouring from lists',
      statement: String.raw`Let $H$ be a graph and $L$ a list assignment. Suppose $H$ has an orientation $D$ such that every induced subdigraph of $D$ has a kernel, and $d^+_D(v)<|L(v)|$ for every vertex $v$. Then $H$ has a colouring from the lists.`,
      idea: String.raw`Induction on $|H|$. Pick a colour $c$ and let $U$ be the set of vertices with $c$ in their list. Take a kernel $K$ of $D[U]$, colour its vertices with $c$ (they are independent, so this is proper) and delete them. Every other vertex of $U$ has an arc into $K$, so after deleting $K$ its out-degree has dropped by one; removing $c$ from its list also drops the list by one, so the inequality $d^+<|L|$ survives. Vertices outside $U$ keep their lists and cannot gain out-degree. Repeat with the next colour.`,
      caption: String.raw`The orientation is shown by arrows (click an arc to reverse it); lists have $d^+(v)+1$ random colours, the minimum the lemma allows. Step through the colours: for each colour the vertices holding it (ringed) form $U$, a kernel of $D[U]$ (squares) receives the colour, and everything else in $U$ loses it. Checks on the right: lists large enough? kernels in all $2^n$ induced subdigraphs? The directed pentagon violates the second hypothesis and the procedure can get stuck.`,
      deps: ['graph-5.4.2b', 'graph-5.4.1a'], refs: ['Diestel §5.4'], tags: ['list colouring', 'kernels'],
      viz(v) {
        const ACY = (g) => ({ P: g.P, A: g.E.map(([a, b]) => (a < b ? [a, b] : [b, a])) });
        const PR = {
          house: () => ACY(GAL.house()), k4: () => ACY(GAL.k4()), pet: () => ACY(GAL.petersen()),
          c5: () => ({ P: GAL.c5().P, A: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] }),
          c4: () => ({ P: GAL.c4().P, A: [[0, 1], [2, 1], [2, 3], [0, 3]] }),
        };
        const ex = v.select('graph and orientation', [{ value: 'house', label: 'house, acyclic' }, { value: 'k4', label: '$K^4$, acyclic' }, { value: 'c4', label: '$C_4$, sources and sinks' }, { value: 'c5', label: 'directed $C_5$' }, { value: 'pet', label: 'Petersen, acyclic' }], 'house', { onChange: () => load() });
        const qS = v.slider('colours', 4, 7, 5, { int: true, onChange: () => relist() });
        const t = v.slider('colours processed', 0, 7, 7, { int: true });
        const s = gstage(v, { height: 360 });
        const G = v.graph(s, { nodes: [], edges: [], directed: true, r: 14, draggable: false, onClick: ({ edge }) => { if (edge) { [edge.from, edge.to] = [edge.to, edge.from]; relist(); } return true; } });
        let L0 = [], seed = 1; const memo = {};
        function load() { const g = PR[ex.value](); loadDi(G, { ...placed(g.P, g.A, [1.6, 0.9, 8.4, 5.6]), edges: g.A.map(([a, b]) => ({ from: a, to: b })) }); relist(); }
        function relist() {
          const O = outMasks(G), r = rnd(seed * 101 + G.nodes.length), q = qS.value;
          L0 = O.map((o) => randList(q, Math.min(q, popc(o) + 1), r)); t.set(q);
        }
        v.button('new random lists', () => { seed++; relist(); });
        load();
        let info = null;
        v.render(() => {
          const O = outMasks(G), n = G.nodes.length, q = qS.value, S = full(n);
          const key = O.join(','); if (memo.key !== key) { memo.key = key; memo.bad = -1; for (let X = S; X > 0; X--) if (hasKernel(O, X) < 0) { memo.bad = X; break; } } const badSub = memo.bad;
          const sizeOk = L0.every((l, u) => popc(O[u]) < popc(l));
          const L = L0.slice(); let alive = S; const col = new Int8Array(n).fill(-1); let stuck = false, stepNo = 0, cur = null;
          for (let c = 0; c < q && alive; c++) {
            let U = 0; for (let u = 0; u < n; u++) if ((alive >> u & 1) && (L[u] >> c & 1)) U |= 1 << u;
            if (!U) continue;
            const Kk = hasKernel(O, U);
            if (stepNo < t.value) { stepNo++; cur = { c, U, K: Kk }; }
            if (Kk < 0) { stuck = true; if (stepNo >= t.value) break; else break; }
            if (stepNo <= t.value) { for (let u = 0; u < n; u++) { if (Kk >> u & 1) col[u] = c; else if (U >> u & 1) L[u] &= ~(1 << c); } alive &= ~Kk; }
          }
          G.draw({ nodeFill: (id) => (col[+id] >= 0 ? CP[col[+id]] : null) });
          for (let u = 0; u < n; u++) chips(v, s, G, u, L[u], { r: 3.6, gap: 9, dy: -23, dim: col[u] >= 0 });
          if (cur && cur.K >= 0) { ring(v, s, G, bitsOf(cur.U), CP[cur.c], 19); for (const u of bitsOf(cur.K)) { const nd = G.node(u), c = s.ctx; c.save(); c.strokeStyle = v.color('ink'); c.lineWidth = 2.2; c.strokeRect(s.X(nd.x) - 11, s.Y(nd.y) - 11, 22, 22); c.restore(); } }
          info = { sizeOk, badSub, stuck: stuck && cur && cur.K < 0, done: col.every((c) => c >= 0), cur, q, n };
        });
        v.readout(() => !info ? '' : `Lists large enough ($d^+<|L|$): **${info.sizeOk ? '✓' : '✗'}** · kernels in every induced subdigraph: **${info.badSub < 0 ? '✓' : '✗ (none for {' + sub(bitsOf(info.badSub)) + '})'}**.\n${info.cur ? `Colour ${info.cur.c + 1}: $U$ = {${sub(bitsOf(info.cur.U))}}, ${info.cur.K >= 0 ? `kernel = {${sub(bitsOf(info.cur.K))}}` : '**no kernel — the procedure is stuck**'}.` : 'no colour processed yet'} ${info.done ? 'All vertices coloured, properly and from the lists ✓.' : ''}`);
      },
    },
    {
      num: '5.4.4', kind: 'Theorem', name: 'Galvin: bipartite graphs have ch′(G) = χ′(G)',
      statement: String.raw`Every bipartite graph $G$ has $\operatorname{ch}'(G)=\chi'(G)$: if $\chi'(G)=k$, then for any assignment of $k$ colours to each edge there is a proper edge colouring from the lists.`,
      idea: String.raw`Fix a proper edge colouring $c$ with $k$ colours (it exists by 5.3.1). Orient the line graph: if edges $e,e'$ meet in a vertex of the first side, direct $e\to e'$ when $c(e')<c(e)$; if they meet in a vertex of the second side, direct $e\to e'$ when $c(e')>c(e)$. At an edge $e$ the out-neighbours at its first end are those of smaller colour and at its second end those of larger colour, so $d^+(e)\le(c(e)-1)+(k-c(e))=k-1<k$. In any set $F$ of edges, a stable matching of $F$ (it exists by Gale–Shapley, 2.1.4), with first-side vertices preferring small colours and second-side vertices large ones, is a kernel of the induced subdigraph. Lemma 5.4.3 now gives the list colouring.`,
      caption: String.raw`Left: a bipartite graph, properly edge-coloured with $\Delta$ colours. Click edges to remove them from or restore them to the subgraph $F$. The Gale–Shapley stable matching of $F$ (bold) is computed live. Right: the line graph $L(G)$ with Galvin's orientation; click an edge on the left to highlight its out-arcs. The matching is a kernel of $D[F]$ (squares): independent, and every other edge of $F$ has an arc into it. The count at the bottom checks **all** subsets $F$.`,
      deps: ['graph-5.4.3', 'graph-2.1.4', 'graph-5.4.2a'], refs: ['Diestel §5.4'], tags: ['list colouring', 'stable matching'], credit: 'Galvin, 1995',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/List_edge-coloring' },
      scope: String.raw`Bipartite graphs (the proof also works for multigraphs). The small graphs here are simple.`,
      viz(v) {
        const PR = {
          k33: () => ({ ...GAL.k33(), side: [0, 0, 0, 1, 1, 1] }),
          cube: () => { const P = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]; const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]; return { P, E, side: [0, 1, 0, 1, 1, 0, 1, 0] }; },
          k23: () => ({ P: [[-1, 1], [1, 1], [-2, -1], [0, -1], [2, -1]], E: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4]], side: [0, 0, 1, 1, 1] }),
          c6: () => ({ P: GAL.c6().P, E: GAL.c6().E, side: [0, 1, 0, 1, 0, 1] }),
        };
        const ex = v.select('bipartite graph', [{ value: 'k23', label: '$K_{2,3}$' }, { value: 'c6', label: '$C_6$' }, { value: 'k33', label: '$K_{3,3}$' }, { value: 'cube', label: 'cube' }], 'k33', { onChange: () => load() });
        const sA = gstage(v, { height: 330, title: '$G$, edge-coloured; click edges to choose $F$' }), sB = gstage(v, { height: 330, title: 'line graph with Galvin’s orientation' });
        const GA = v.graph(sA, { nodes: [], edges: [], r: 9, draggable: false, onClick: ({ edge }) => { if (edge) { const k2 = ix(GA).eix.get(edge); F ^= 1 << k2; foc = k2; } return true; } });
        const GB = v.graph(sB, { nodes: [], edges: [], directed: true, r: 11, draggable: false });
        let S0 = null, F = 0, foc = 0, Gv = null, ec = null, allOk = 0, nSub = 0, kmax = 0;
        function load() {
          const g = PR[ex.value](), n = g.P.length, m = g.E.length;
          loadSpec(GA, placed(g.P, g.E, [1.2, 0.9, 8.8, 5.6], () => ''));
          const LA = new Array(m).fill(0); for (let a = 0; a < m; a++) for (let b = a + 1; b < m; b++) if (g.E[a].some((x) => g.E[b].includes(x))) { LA[a] |= 1 << b; LA[b] |= 1 << a; }
          const deg = new Array(n).fill(0); g.E.forEach(([a, b]) => { deg[a]++; deg[b]++; }); kmax = Math.max(...deg);
          ec = listColour(LA, full(m), new Array(m).fill((1 << kmax) - 1));
          Gv = galvin(n, g.E, g.side, ec); S0 = g; F = full(m); foc = 0;
          allOk = 0; nSub = 0; for (let X = 1; X <= full(m); X++) { nSub++; if (isKernel(Gv.O, X, Gv.kernelOf(X))) allOk++; }
          const ang = Array.from(ec, (c, k2) => [k2, c]).sort((p, q) => p[1] - q[1]); const pos = new Array(m);
          ang.forEach(([k2], i) => { const th = Math.PI / 2 - (2 * Math.PI * i) / m; pos[k2] = [5 + 2.6 * Math.cos(th), 3.2 + 2.4 * Math.sin(th)]; });
          const arcs = []; for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) if (Gv.O[a] >> b & 1) arcs.push({ from: a, to: b });
          loadDi(GB, { nodes: pos.map(([x, y], i) => ({ id: i, x, y, label: String(ec[i] + 1) })), edges: arcs });
        }
        load();
        let info = null;
        v.render(() => {
          const m = S0.E.length, M = Gv.kernelOf(F), H = ix(GA);
          const inF = (e) => (F >> H.eix.get(e) & 1);
          GA.draw({ edgeColor: (e) => (inF(e) ? CP[ec[H.eix.get(e)]] : 'faint'), edgeWidth: (e) => (M >> H.eix.get(e) & 1 ? 6 : inF(e) ? 2.2 : 1.2), edgeDash: (e) => (inF(e) ? null : [3, 4]) });
          const HB = ix(GB), outF = foc;
          GB.draw({ nodeFill: (id) => (M >> +id & 1 ? CP[ec[+id]] : null), nodeColor: (id) => (F >> +id & 1 ? CP[ec[+id]] : 'faint'),
            edgeColor: (e) => ((+e.from === outF) ? 'orange' : 'faint'), edgeWidth: (e) => ((+e.from === outF) ? 2.6 : 0.8), dim: bitsOf(full(m) & ~F).map(String) });
          const dplus = Gv.O.map(popc), ok = isKernel(Gv.O, F, M);
          info = { ok, sz: popc(F), msz: popc(M), maxd: Math.max(...dplus), k: kmax, foc: outF, dfoc: dplus[outF], bad: popc(F & ~M) };
        });
        v.readout(() => !info ? '' : `$k=\\Delta=${info.k}$ colours; largest out-degree in $L(G)$ is **${info.maxd}** $<k$ ✓. For the current $F$ ($|F|=${info.sz}$): stable matching of size ${info.msz} is a kernel of $D[F]$: **${info.ok ? '✓' : '✗'}**. Checked all ${nSub} nonempty $F$: kernel in **${allOk}** of them. (Edge ${info.foc + 1} has out-degree ${info.dfoc}.)`);
      },
    },
    {
      num: '5.4.5', kind: 'Corollary', name: 'Bipartite graphs satisfy ch′(G) = Δ(G)',
      statement: String.raw`Every bipartite graph $G$ satisfies $\operatorname{ch}'(G)=\Delta(G)$: whatever lists of $\Delta(G)$ colours are given to the edges, a proper edge colouring from the lists exists.`,
      idea: String.raw`By König's theorem (5.3.1) $\chi'(G)=\Delta(G)$, and by Galvin's theorem (5.4.4) $\operatorname{ch}'(G)=\chi'(G)$. Since $\operatorname{ch}'\ge\chi'\ge\Delta$ holds anyway, the content is the upper bound: the colouring is actually produced by the kernel procedure of 5.4.3 on the oriented line graph.`,
      caption: String.raw`A random bipartite graph with random lists of $s$ colours per edge, drawn from a palette of $q$ colours. For $s\ge\Delta$ the kernel procedure (colour by colour, one stable matching per colour) always succeeds; edges are painted in the colour they receive. Reduce $s$ below $\Delta$ and the same random lists may still work, but *identical lists* on a vertex of maximum degree cannot: $\Delta$ edges need $\Delta$ colours.`,
      deps: ['graph-5.4.4', 'graph-5.3.1'], refs: ['Diestel §5.4'], tags: ['list colouring', 'edge colouring'],
      viz(v) {
        const aS = v.slider('left vertices', 2, 5, 4, { int: true, onChange: () => gen() });
        const bS = v.slider('right vertices', 2, 5, 4, { int: true, onChange: () => gen() });
        const pS = v.slider('edge density', 0.3, 0.9, 0.6, { step: 0.05, onChange: () => gen() });
        const sS = v.slider('list size $s$', 1, 6, 3, { int: true, onChange: () => lists() });
        const qS = v.slider('palette size $q$', 3, 8, 5, { int: true, onChange: () => lists() });
        const mode = v.select('lists', [{ value: 'rand', label: 'random' }, { value: 'same', label: 'identical' }], 'rand', { onChange: () => lists() });
        const s = gstage(v, { height: 360 });
        const G = v.graph(s, { nodes: [], edges: [], r: 11, draggable: false });
        let seed = 5, g = null, Gv = null, L = [], Dl = 0, res = null;
        function gen() {
          const a = aS.value, b = bS.value, r = rnd(seed * 977 + a * 31 + b), E = [];
          for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) if (r() < pS.value) E.push([i, a + j]);
          if (!E.length) E.push([0, a]);
          const n = a + b, side = Array.from({ length: n }, (_, i) => (i < a ? 0 : 1)), P = [];
          for (let i = 0; i < a; i++) P.push([(i - (a - 1) / 2) * 1.5, 1]); for (let j = 0; j < b; j++) P.push([(j - (b - 1) / 2) * 1.5, -1]);
          const m = E.length; if (m > 20) { E.length = 20; }
          const deg = new Array(n).fill(0); E.forEach(([x, y]) => { deg[x]++; deg[y]++; }); Dl = Math.max(...deg);
          const LA = new Array(E.length).fill(0); for (let x = 0; x < E.length; x++) for (let y = x + 1; y < E.length; y++) if (E[x].some((t) => E[y].includes(t))) { LA[x] |= 1 << y; LA[y] |= 1 << x; }
          const ec = listColour(LA, full(E.length), new Array(E.length).fill((1 << Dl) - 1));
          g = { n, E, side, P, LA }; Gv = galvin(n, E, side, ec); loadSpec(G, placed(P, E, [1.5, 1.2, 8.5, 5.2], () => ''));
          sS.set(Math.max(1, Math.min(6, Dl))); lists();
        }
        function lists() {
          const q = Math.max(qS.value, sS.value), r = rnd(seed * 13 + 1);
          L = g.E.map(() => (mode.value === 'same' ? (1 << sS.value) - 1 : randList(q, sS.value, r)));
        }
        v.button('new graph', () => { seed++; gen(); });
        v.button('new lists', () => { seed++; lists(); });
        gen();
        v.render(() => {
          const q = Math.max(qS.value, sS.value), m = g.E.length, kc = sS.value >= Dl ? kernelColouring(Gv, L, 8) : null;
          const bt = kc && !kc.stuck ? null : listColour(g.LA, full(m), L);
          const col = kc && !kc.stuck ? kc.col : (bt && !bt.timeout ? bt : null);
          const H = ix(G);
          G.draw({ edgeColor: (e) => (col ? CP[col[H.eix.get(e)]] : 'red'), edgeWidth: () => 4.5, nodeNote: (id) => String(H.adj[H.at(id)].length), noteColor: () => 'muted' });
          const mid = (k2) => { const [a, b] = g.E[k2], na = G.node(H.ids[a]), nb = G.node(H.ids[b]), tt = 0.3 + 0.1 * (k2 % 3); return [s.X(na.x) + tt * (s.X(nb.x) - s.X(na.x)), s.Y(na.y) + tt * (s.Y(nb.y) - s.Y(na.y))]; };
          g.E.forEach((_, k2) => { const bs = bitsOf(L[k2]), [mx, my] = mid(k2), c = s.ctx; bs.forEach((x, j) => { c.beginPath(); c.arc(mx + (j - (bs.length - 1) / 2) * 8, my - 8, 3.4, 0, 2 * Math.PI); c.fillStyle = v.color(CP[x]); c.fill(); }); });
          res = { Dl, s: sS.value, how: kc && !kc.stuck ? 'kernel procedure' : col ? 'backtracking (lists shorter than $\\Delta$)' : null, m, steps: kc ? kc.steps.length : 0 };
        });
        v.readout(() => `$\\Delta=${res.Dl}$, ${res.m} edges, lists of $s=${res.s}$ colours: ${res.how ? `proper colouring from the lists found by the **${res.how}** ✓${res.steps && res.how[0] === 'k' ? ` (${res.steps} colour rounds)` : ''}` : '**no colouring from these lists** ✗'}${res.s >= res.Dl ? ' — guaranteed by the corollary' : res.s < res.Dl && !res.how ? ' — fewer than $\\Delta$ colours cannot work in general' : ''}.`);
      },
    },
  ],
};
