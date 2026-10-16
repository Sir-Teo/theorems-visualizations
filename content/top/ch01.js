// Topology — Chapter 1: Topological spaces (items 1.1–1.8; 1.9–1.16 are in ch01-b.js)
import { pc, inF, members, famOf, setOf, setName, setTex, checkTop, generate, allTops, isT0, classesOf, countPreorders, intF, clF, coversAmong, powerPos, powerSpec, glyph, ALL, psFrom, psInter, psClos, psInt, psComp, psEq, psHas, psTex, drawPSet } from './ch01.shared.js';

const FULL = (n) => (1 << n) - 1;
const listTex = (F, n) => members(F, n).map((m) => setTex(m, n)).join(',\\,');

/** Clip a convex polygon to the half-plane {z : nx(z−c)_x + ny(z−c)_y < 0} (Sutherland–Hodgman, one edge). */
function clipHalf(poly, [nx, ny], [cx, cy]) {
  const f = ([x, y]) => nx * (x - cx) + ny * (y - cy), out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
    if (fp < 0) out.push(P);
    if ((fp < 0) !== (fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** Largest r with f(r) true, by bisection on [0, hi] (f monotone: true then false). */
function largest(f, hi) { if (!f(1e-9)) return 0; let lo = 0; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (f(m)) lo = m; else hi = m; } return lo; }

const LAT = new Map();
/** The lattice of all topologies on n points: layers by number of open sets, covering pairs, barycentric ordering. */
function lattice(n) {
  if (LAT.has(n)) return LAT.get(n);
  const T = allTops(n), sizes = [...new Set(T.map(pc))].sort((a, b) => a - b);
  const layers = sizes.map((sz) => T.filter((F) => pc(F) === sz).sort((a, b) => a - b));
  const layerOf = new Map(); layers.forEach((L, j) => L.forEach((F) => layerOf.set(F, j)));
  const covers = [];
  for (const A of T) for (const B of T) {
    if (A === B || (A & B) !== A) continue;
    const ja = layerOf.get(A), jb = layerOf.get(B); let ok = true;
    for (let j = ja + 1; j < jb && ok; j++) for (const C of layers[j]) if ((A & C) === A && (C & B) === C) { ok = false; break; }
    if (ok) covers.push([A, B]);
  }
  const down = new Map(T.map((F) => [F, []])), up = new Map(T.map((F) => [F, []]));
  for (const [a, b] of covers) { up.get(a).push(b); down.get(b).push(a); }
  const rank = new Map(); layers.forEach((L) => L.forEach((F, i) => rank.set(F, (i + 0.5) / L.length)));
  const sweep = (order, nb) => { for (const j of order) { const L = layers[j]; const key = new Map(L.map((F) => { const ns = nb.get(F); return [F, ns.length ? ns.reduce((s, G) => s + rank.get(G), 0) / ns.length : rank.get(F)]; })); L.sort((a, b) => key.get(a) - key.get(b)); L.forEach((F, i) => rank.set(F, (i + 0.5) / L.length)); } };
  const idx = layers.map((_, j) => j);
  for (let it = 0; it < 6; it++) { sweep(idx.slice(1), down); sweep(idx.slice(0, -1).reverse(), up); }
  const pos = new Map();
  layers.forEach((L, j) => { const dx = Math.min(8.8 / L.length, 1.35); L.forEach((F, i) => pos.set(F, [5.4 + (i - (L.length - 1) / 2) * dx, 0.45 + (5.1 * j) / Math.max(layers.length - 1, 1)])); });
  const res = { T, layers, sizes, covers, pos };
  LAT.set(n, res); return res;
}

export default {
  collection: 'top',
  chapter: 1,
  title: 'Topological spaces',
  summary: String.raw`A topology is nothing more than a declaration of which subsets count as open, subject to three rules abstracted from the open sets of a metric space. Bases, subbases, metrics, orders and subspaces are the standard ways of producing topologies, and closure, interior and limit points carry over unchanged. Spaces with few open sets misbehave — a sequence can converge to many points at once, and sequences no longer detect closure — which is why the Hausdorff condition and nets appear so early.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Topological space',
      statement: String.raw`A **topology** on a set $X$ is a collection $\tau$ of subsets of $X$, called the **open sets**, such that

(i) $\varnothing\in\tau$ and $X\in\tau$;

(ii) the union of any subcollection of $\tau$ (finite or infinite) belongs to $\tau$;

(iii) the intersection of any two (hence of any finitely many) members of $\tau$ belongs to $\tau$.

A **topological space** is a pair $(X,\tau)$. A subset $C\subset X$ is **closed** when $X\setminus C$ is open; by De Morgan, closed sets are closed under arbitrary intersections and finite unions, and a set may be open, closed, both or neither.`,
      idea: String.raw`The axioms are exactly the properties of open sets in a metric space proved in 2.24 of Rudin, promoted from theorems to a definition: everything that can be said using only open sets — continuity, convergence, compactness, connectedness — then makes sense with no distances at all. The asymmetry is forced: in $\R$ the open intervals $(-1/n,1/n)$ have intersection $\{0\}$, which is not open, so only finite intersections can be required. On a finite set every union is finite, so a family is a topology exactly when it contains $\varnothing$ and $X$ and is closed under *pairwise* unions and intersections — which is what the checker tests.`,
      caption: String.raw`Click subsets in the left lattice to declare them open (filled). Any union or intersection that is missing is ringed in red, with dashed lines from the two open sets that produce it; the right panel draws the Hasse diagram of your family, missing sets as red ghosts. **Generate** replaces your family by the smallest topology containing it (it is used as a subbasis). Valid topologies you build are counted — there are 29 on three points.`,
      deps: ['pma-2.24'],
      see: ['rca-1.2'],
      refs: ['Munkres §12'],
      tags: ['topology', 'open sets'],
      credit: 'Hausdorff, 1914 (neighbourhood axioms); Kuratowski and Alexandrov, 1920s (open-set form)',
      viz(v) {
        const TOTAL = [1, 1, 4, 29, 355];
        const fam = {
          1: famOf([0, 1]),
          2: famOf([0, 1, 3]),
          3: famOf([0, setOf([1]), setOf([3]), setOf([1, 2]), setOf([2, 3]), 7]),
          4: famOf([0, setOf([1]), setOf([1, 2]), setOf([3, 4]), 15]),
        };
        const found = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
        const saved = {};
        let n = 3, lastMsg = '';
        const L = v.stage({ x: [0, 10], y: [0, 7.4], axes: false, height: 330, title: 'subsets of $X$ — click to toggle “open”' });
        const Rt = v.stage({ x: [0, 10], y: [0, 7.4], axes: false, height: 330, title: 'Hasse diagram of the family (inclusion upward)' });
        const G = v.graph(L, { ...powerSpec(3, [0.7, 9.3], [0.7, 6.7]), shape: 'box', r: 10, fontSize: 12, draggable: false, layout: 'none' });
        const H = v.graph(Rt, { nodes: [], edges: [], shape: 'box', r: 10, fontSize: 12, draggable: false, layout: 'none' });
        G.onClick = ({ node }) => { if (node) { fam[n] ^= 1 << node.id; lastMsg = ''; } return true; };
        v.select('points $n$', ['1', '2', '3', '4'].map((s) => ({ value: s, label: s })), '3', { onChange: (s) => { n = +s; G.set(powerSpec(n, [0.7, 9.3], [0.7, 6.7])); lastMsg = ''; } });
        v.button('Generate', () => { const before = pc(fam[n]); const g = generate(fam[n], n); fam[n] = g.top; lastMsg = `Generated: using your ${before} sets as a subbasis, finite intersections give a basis of ${pc(g.basis)} sets and their unions give ${pc(g.top)} open sets.`; });
        v.button('Indiscrete', () => { fam[n] = famOf([0, FULL(n)]); lastMsg = ''; });
        v.button('Discrete', () => { fam[n] = (2 ** (1 << n)) - 1; lastMsg = ''; });
        v.button('Save as τ₀', () => { const c = checkTop(fam[n], n); if (c.ok) { saved[n] = fam[n]; lastMsg = 'Saved this topology as τ₀; keep editing to compare (purple dots mark τ₀).'; } else lastMsg = 'Only a valid topology can be saved as τ₀.'; });
        const closedT = v.toggle('show closed sets', false);
        let hkey = '', chk = null;
        v.render(() => {
          const F = fam[n], full = FULL(n);
          chk = checkTop(F, n);
          if (chk.ok) found[n].add(F);
          const missSet = new Set(chk.missing.map((o) => o.w));
          // witness lines for (up to three) missing unions/intersections
          const pos = powerPos(n, [0.7, 9.3], [0.7, 6.7]);
          chk.missing.slice(0, 3).forEach((o) => {
            if (o.op !== '∪' && o.op !== '∩') return;
            for (const a of [o.a, o.b]) L.line(pos[a][0], pos[a][1], pos[o.w][0], pos[o.w][1], { color: 'red', width: 1.6, dash: [5, 4], alpha: 0.8 });
          });
          const closed = (m) => inF(F, full & ~m);
          G.draw({
            nodeFill: (id) => (inF(F, id) ? 'accent' : null),
            nodeColor: (id) => (missSet.has(id) ? 'red' : null),
            nodeRing: (id) => (missSet.has(id) ? 'red' : closedT.value && closed(id) ? 'green' : null),
            nodeNote: saved[n] != null ? (id) => (inF(saved[n], id) ? '●' : null) : null,
            noteColor: 'purple', notePos: 'ne',
            edgeColor: (e) => (inF(F, e.from) && inF(F, e.to) ? 'accent' : null),
            edgeWidth: (e) => (inF(F, e.from) && inF(F, e.to) ? 2.2 : 1.1),
          });
          L.corner(`found ${found[n].size} of ${TOTAL[n]} topologies on ${n} point${n > 1 ? 's' : ''}`, 'tl', { color: found[n].size === TOTAL[n] ? 'green' : 'muted', weight: 600 });
          // Hasse diagram of the family together with the missing sets
          const list = [...members(F, n), ...chk.missing.map((o) => o.w)];
          const key = n + ':' + list.join(',');
          if (key !== hkey) {
            hkey = key;
            const ranks = Array.from({ length: n + 1 }, () => []);
            for (const m of list) ranks[pc(m)].push(m);
            const used = ranks.map((r, k) => (r.length ? k : -1)).filter((k) => k >= 0);
            const nodes = [];
            used.forEach((k, j) => {
              const r = ranks[k].sort((a, b) => a - b), y = used.length > 1 ? 0.8 + (5.9 * j) / (used.length - 1) : 3.7;
              const dx = Math.min(1.75, 8.6 / Math.max(r.length, 1));
              r.forEach((m, i) => nodes.push({ id: m, label: setName(m, n), x: 5 + (i - (r.length - 1) / 2) * dx, y }));
            });
            H.set({ nodes, edges: coversAmong(list).map(([a, b]) => ({ from: a, to: b })) });
          }
          H.draw({
            nodeFill: (id) => (missSet.has(id) ? null : 'accent'),
            nodeColor: (id) => (missSet.has(id) ? 'red' : null),
            labelColor: (id) => (missSet.has(id) ? 'red' : null),
            edgeColor: (e) => (missSet.has(e.from) || missSet.has(e.to) ? 'red' : 'accent'),
            edgeDash: (e) => (missSet.has(e.from) || missSet.has(e.to) ? [5, 4] : null),
            edgeWidth: 2,
          });
          Rt.corner(chk.ok ? `a topology: ${pc(F)} open sets` : `${chk.missing.length} set${chk.missing.length > 1 ? 's' : ''} missing`, 'tl', { color: chk.ok ? 'green' : 'red', weight: 600 });
        });
        v.legend([['accent', 'open (in the family)', { dot: true }], ['red', 'missing union / intersection', { dot: true }], ['green', 'closed (complement open)', { dot: true }], ['purple', 'member of saved τ₀', { dot: true }]]);
        v.readout(() => {
          if (!chk) return '';
          const F = fam[n];
          let t;
          if (chk.ok) {
            const closedList = members(F, n).map((m) => FULL(n) & ~m).sort((a, b) => pc(a) - pc(b) || a - b).map((m) => setTex(m, n)).join(',\\,');
            t = `**✓ A topology** on $X=${setTex(FULL(n), n)}$ with ${pc(F)} open sets. Closed sets: $${closedList}$.`;
          } else {
            const parts = chk.missing.map((o) => o.op === 'empty' ? '$\\varnothing$ (axiom i)' : o.op === 'full' ? '$X$ (axiom i)' : `$${setTex(o.a, n)}${o.op === '∪' ? '\\cup' : '\\cap'}${setTex(o.b, n)}=${setTex(o.w, n)}$`);
            t = `**✗ Not a topology** — missing ${parts.join(', ')}.`;
          }
          if (saved[n] != null && chk.ok) {
            const S = saved[n];
            const rel = S === F ? 'equal to τ₀' : (S & F) === S ? 'strictly **finer** than τ₀ (τ₀ ⊂ τ)' : (S & F) === F ? 'strictly **coarser** than τ₀ (τ ⊂ τ₀)' : '**not comparable** with τ₀';
            t += ` This τ is ${rel}.`;
          }
          return t + (lastMsg ? ' ' + lastMsg : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Discrete, indiscrete, cofinite and Sierpiński spaces',
      statement: String.raw`Let $X$ be any set.

(a) The **discrete topology** declares every subset of $X$ open; it is the largest topology on $X$.

(b) The **indiscrete** (trivial) **topology** is $\{\varnothing, X\}$; it is the smallest.

(c) The **cofinite** (finite complement) **topology** consists of $\varnothing$ together with every $U\subset X$ whose complement $X\setminus U$ is finite. On a finite set it is the discrete topology.

(d) The **Sierpiński space** is $X=\{0,1\}$ with open sets $\varnothing$, $\{1\}$, $\{0,1\}$.

A sequence $x_n$ **converges** to $p$ when every open set containing $p$ contains $x_n$ for all but finitely many $n$.`,
      idea: String.raw`The cofinite family is a topology because complements turn unions into intersections of finite sets (finite) and a pairwise intersection into a union of two finite sets (finite). Convergence depends only on the open sets containing $p$: in the discrete space $\{p\}$ itself is one, so only eventually constant sequences converge; in the indiscrete space $X$ is the only one, so every sequence converges to every point. In the cofinite topology an open $U\ni p$ omits only finitely many points, and a sequence that visits each point finitely often must eventually avoid all of them — so it converges to *every* point at once. In the Sierpiński space the only open set containing $0$ is $X$, so every sequence converges to $0$.`,
      caption: String.raw`Points of $X$ run across, terms $x_n$ climb upward (gold inside the open set $U$, red outside). Click a column to choose $p$; $U$ (orange) is the smallest open set containing $p$, or — in the cofinite topology — $X$ minus $k$ points chosen by the slider to catch early terms. The green line marks where the tail enters $U$ for good; the readout lists every limit of the sequence.`,
      deps: ['top-1.1'],
      refs: ['Munkres §12'],
      tags: ['examples', 'convergence'],
      credit: 'Sierpiński, 1928 (two-point space)',
      viz(v) {
        const NC = 12, NR = 14;
        const SEQ = {
          id: { label: '$x_n=n$', f: (n) => n, R: [], ev: null },
          cst: { label: '$x_n=3$', f: () => 3, R: [3], ev: 3 },
          alt: { label: '$1,2,1,2,\\dots$', f: (n) => (n % 2 ? 1 : 2), R: [1, 2], ev: null },
          mix: { label: '$1,2,1,3,1,4,\\dots$', f: (n) => (n % 2 ? 1 : n / 2 + 1), R: [1], ev: null },
        };
        const SSEQ = {
          one: { label: '$1,1,1,\\dots$', f: () => 1, ev: 1 },
          zero: { label: '$0,0,0,\\dots$', f: () => 0, ev: 0 },
          alt: { label: '$0,1,0,1,\\dots$', f: (n) => (n % 2 ? 0 : 1), ev: null },
          late: { label: '$0,0,0,0,1,1,\\dots$', f: (n) => (n <= 4 ? 0 : 1), ev: 1 },
        };
        const top = v.select('topology', [{ value: 'disc', label: 'discrete' }, { value: 'ind', label: 'indiscrete' }, { value: 'cof', label: 'cofinite' }, { value: 'sier', label: 'Sierpiński' }], 'cof');
        const seqN = v.select('sequence', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'id');
        const seqS = v.select('sequence', Object.entries(SSEQ).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const kS = v.slider('$k$ points removed from $U$', 0, 6, 3, { int: true });
        const s = v.stage({ x: [-0.9, 14.2], y: [-1.9, NR + 1.9], axes: false, height: 380 });
        let p = 6, pS = 0, info = null;
        const colX = (c) => (top.value === 'sier' ? (c === 0 ? 4.5 : 9.5) : c > NC ? NC + 1.35 : c);
        s.onClick((x, y) => {
          if (top.value === 'sier') { pS = x < 7 ? 0 : 1; return; }
          const c = Math.round(x); if (c >= 1 && c <= NC) p = c;
        });
        v.render(() => {
          const sier = top.value === 'sier', T = top.value;
          seqN.el.hidden = sier; seqS.el.hidden = !sier; kS.el.hidden = T !== 'cof';
          const S = sier ? SSEQ[seqS.value] : SEQ[seqN.value];
          const P = sier ? pS : p;
          // the open set U ∋ p
          let F = [];
          if (T === 'cof') { // remove the first k distinct values ≠ p visited by the sequence
            for (let n = 1; F.length < kS.value && n < 200; n++) { const x = S.f(n); if (x !== P && !F.includes(x)) F.push(x); }
          }
          const inU = (x) => (T === 'disc' ? x === P : T === 'ind' ? true : T === 'cof' ? !F.includes(x) : P === 1 ? x === 1 : true);
          const cols = sier ? [0, 1] : [...Array.from({ length: NC }, (_, i) => i + 1), NC + 1];
          for (const c of cols) {
            const X = colX(c), w = sier ? 1.6 : 0.42, member = c > NC ? inU(1000) : inU(c);
            if (member) s.rect(X - w, 0.45, X + w, NR + 0.55, { fill: 'orange', fillAlpha: c === P ? 0.26 : 0.13, color: 'orange', width: c === P ? 1.8 : 0, stroke: c === P, radius: 4 });
            const lab = c > NC ? '…' : String(c);
            if (c === P) s.dot(X, -0.55, { r: 11, color: 'accent', alpha: 0.9 });
            s.text(lab, X, -0.55, { align: 'center', size: 13, weight: 700, color: c === P ? 'panel' : 'ink', halo: c !== P });
            if (!member && T === 'cof') s.text('× removed', X, -1.4, { align: 'center', size: 10.5, color: 'red', weight: 700 });
          }
          s.text('n', -0.55, NR + 1.0, { align: 'center', color: 'muted', math: true, size: 15 });
          for (const r of [1, 5, 10, NR]) s.text(String(r), -0.55, r, { align: 'center', color: 'muted', size: 11 });
          // terms
          let last = 0;
          for (let n = 1; n <= 400; n++) if (!inU(S.f(n))) last = n;
          const finite = last < 300;
          for (let n = 1; n <= NR; n++) {
            const x = S.f(n), X = colX(sier ? x : Math.min(x, NC + 1)), ok = inU(x);
            s.dot(X, n, { r: 5, color: ok ? 'gold' : 'red' });
          }
          if (finite && last + 0.5 <= NR + 0.5) {
            s.line(0.3, last + 0.5, 14.1, last + 0.5, { color: 'green', width: 1.6, dash: [6, 4] });
            s.text(last ? `from n = ${last + 1} on, every term lies in U` : 'every term lies in U', 14.1, last + 0.5, { align: 'right', baseline: 'bottom', dy: -3, color: 'green', weight: 600, size: 11.5 });
          }
          // limits, decided from the shape of the sequence
          let lim;
          if (sier) lim = S.ev === 1 ? 'both 0 and 1' : 'only 0';
          else if (T === 'disc') lim = S.ev != null ? `only ${S.ev}` : 'none';
          else if (T === 'ind') lim = 'every point of ℕ';
          else lim = S.R.length === 0 ? 'every point of ℕ' : S.R.length === 1 ? `only ${S.R[0]}` : 'none';
          const desc = { disc: 'every subset is open', ind: 'open sets: ∅ and ℕ only', cof: 'open: ∅ and sets with finite complement', sier: 'open sets: ∅, {1}, {0,1}' }[T];
          s.corner(desc, 'tr', { color: 'muted', weight: 600 });
          info = { finite, last, F, lim, P, T, sier };
        });
        v.legend([['orange', 'open set $U\\ni p$', { area: true }], ['gold', '$x_n\\in U$', { dot: true }], ['red', '$x_n\\notin U$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { finite, last, F, lim, P, T, sier } = info;
          const U = T === 'disc' ? `\\{${P}\\}` : T === 'ind' ? (sier ? '\\{0,1\\}' : '\\N') : T === 'cof' ? (F.length ? `\\N\\setminus\\{${F.join(',')}\\}` : '\\N') : P === 1 ? '\\{1\\}' : '\\{0,1\\}';
          const tail = finite ? (last ? `the terms outside it are $x_1,\\dots$ up to $n=${last}$ only, so the tail from $n=${last + 1}$ stays in $U$` : 'every term lies in it') : 'infinitely many terms lie outside it, so $x_n\\not\\to p$';
          return `$U=${U}$ is open and contains $p=${P}$; ${tail}. **Limits of this sequence: ${lim}.**`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Basis and subbasis of a topology',
      statement: String.raw`A **basis** for a topology on $X$ is a family $\mathscr B$ of subsets of $X$ (the basic sets) such that

(B1) every $x\in X$ lies in at least one $B\in\mathscr B$;

(B2) if $x\in B_1\cap B_2$ with $B_1,B_2\in\mathscr B$, then there is $B_3\in\mathscr B$ with $x\in B_3\subset B_1\cap B_2$.

The **topology generated by** $\mathscr B$ declares $U$ open when every $x\in U$ has some $B\in\mathscr B$ with $x\in B\subset U$; equivalently, the open sets are exactly the unions of basic sets.

A **subbasis** is any family $\mathscr S$ of subsets whose union is $X$. The topology it generates consists of all unions of finite intersections of members of $\mathscr S$; the finite intersections form a basis, and this is the smallest topology containing $\mathscr S$.`,
      idea: String.raw`(B1) makes $X$ open and (B2) makes the intersection of two open sets open: a point of $U\cap V$ has basic sets $B_1\subset U$ and $B_2\subset V$, and (B2) fits a third inside both. Unions are automatic. For a subbasis no condition is needed, because finite intersections of finite intersections are again finite intersections, so (B2) holds by construction. Open discs, open squares and convex open polygons (finite intersections of open half-planes) all generate the usual topology of $\R^2$; half-planes alone fail (B2), and closed discs fail it at every boundary point.`,
      caption: String.raw`Left: drag the centres $c_1,c_2$ and the point $x\in B_1\cap B_2$; the green set is the largest member of the family around $x$ inside $B_1\cap B_2$ — or there is none, and (B2) fails. Try half-planes, and closed discs with $x$ on the boundary (it snaps) or after **Tangent**. Right: an open crescent $U$ is the union of the basic sets drawn around a grid of its points; drag $y$.`,
      deps: ['top-1.1'],
      refs: ['Munkres §13'],
      tags: ['basis', 'generating topologies'],
      viz(v) {
        const fam = v.select('family', [{ value: 'disc', label: 'open discs' }, { value: 'sq', label: 'open squares' }, { value: 'half', label: 'open half-planes' }, { value: 'cdisc', label: 'closed discs' }], 'disc', {
          onChange: (f) => { if (f === 'cdisc') { const th = Math.atan2(c2.y - c1.y, c2.x - c1.x) - 0.5; X.set(c1.x + R1 * Math.cos(th), c1.y + R1 * Math.sin(th)); } },
        });
        const tanB = v.button('Tangent', () => { const d = Math.hypot(c2.x - c1.x, c2.y - c1.y) || 1, ux = (c2.x - c1.x) / d, uy = (c2.y - c1.y) / d; c2.set(c1.x + ux * (R1 + R2), c1.y + uy * (R1 + R2)); X.set(c1.x + ux * R1, c1.y + uy * R1); });
        const A = v.stage({ x: [-2.5, 2.5], y: [-2.1, 2.1], equal: true, axes: false, height: 340, title: '(B2): a basic set around $x$ inside $B_1\\cap B_2$' });
        const B = v.stage({ x: [-2.2, 2.2], y: [-2.1, 2.1], equal: true, axes: false, height: 340, title: 'an open set is a union of basic sets' });
        const R1 = 1.25, R2 = 1.05;
        const N1 = [-0.39, 0.92], N2 = [0.93, 0.36];
        const c1 = A.handle(-0.55, 0.1, { color: 'blue', label: '$c_1$' }), c2 = A.handle(0.6, -0.15, { color: 'purple', label: '$c_2$' });
        const snap = (x, y) => {
          if (fam.value !== 'cdisc') return [x, y];
          for (const [c, r] of [[c1, R1], [c2, R2]]) { const d = Math.hypot(x - c.x, y - c.y); if (Math.abs(d - r) < 0.07 && d > 0) return [c.x + ((x - c.x) * r) / d, c.y + ((y - c.y) * r) / d]; }
          return [x, y];
        };
        const X = A.handle(0.1, -0.3, { color: 'ink', label: '$x$', constrain: snap });
        const Y = B.handle(-1.2, -0.55, { color: 'ink', label: '$y$' });
        // the open crescent U = {|z| < 1.75} minus the closed disc |z − C| ≤ 0.95
        const UR = 1.75, C = [0.9, 0.4], CR = 0.95;
        const inU = (x, y) => Math.hypot(x, y) < UR && Math.hypot(x - C[0], y - C[1]) > CR;
        const dU = (x, y) => Math.min(UR - Math.hypot(x, y), Math.hypot(x - C[0], y - C[1]) - CR);
        const sqFits = (x, y, r) => (Math.abs(x) + r) ** 2 + (Math.abs(y) + r) ** 2 < UR * UR && Math.hypot(Math.max(Math.abs(C[0] - x) - r, 0), Math.max(Math.abs(C[1] - y) - r, 0)) > CR;
        const view = [[-2.5, -2.1], [2.5, -2.1], [2.5, 2.1], [-2.5, 2.1]];
        const tri = (x, y, r) => [0, 1, 2].map((k) => [x + r * Math.cos(Math.PI / 2 + (2 * Math.PI * k) / 3), y + r * Math.sin(Math.PI / 2 + (2 * Math.PI * k) / 3)]);
        let st = null;
        // the largest member of the family around (x, y) inside U, as a drawing function
        const basicIn = (x, y, F) => {
          if (!inU(x, y)) return null;
          if (F === 'disc') { const r = dU(x, y); return (o) => B.circle(x, y, r * 0.92, o); }
          if (F === 'cdisc') { const r = dU(x, y) * 0.6; return (o) => B.circle(x, y, r, { ...o, dash: null }); }
          if (F === 'sq') { const r = largest((t) => sqFits(x, y, t), 2) * 0.92; return (o) => B.rect(x - r, y - r, x + r, y + r, o); }
          const r = dU(x, y) * 0.92; return (o) => B.poly(tri(x, y, r), o);
        };
        v.render(() => {
          const F = fam.value; tanB.hidden = F !== 'cdisc';
          const closed = F === 'cdisc', dash = closed ? null : [6, 4];
          // ---- left: B1, B2 and the best B3
          let rho = 0, wedge = null;
          if (F === 'half') {
            const H1 = clipHalf(view, N1, [c1.x, c1.y]), H2 = clipHalf(view, N2, [c2.x, c2.y]);
            A.poly(H1, { fill: 'blue', fillAlpha: 0.1, stroke: false }); A.poly(H2, { fill: 'purple', fillAlpha: 0.1, stroke: false });
            for (const [N, c, col] of [[N1, c1, 'blue'], [N2, c2, 'purple']]) A.line(c.x - 6 * N[1], c.y + 6 * N[0], c.x + 6 * N[1], c.y - 6 * N[0], { color: col, width: 1.8, dash });
            wedge = clipHalf(H1, N2, [c2.x, c2.y]);
            const inside = N1[0] * (X.x - c1.x) + N1[1] * (X.y - c1.y) < 0 && N2[0] * (X.x - c2.x) + N2[1] * (X.y - c2.y) < 0;
            if (inside) {
              A.poly(wedge, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2, dash });
              // a half-plane through x parallel to H1 sticks out of H2: show the part outside
              const q = [X.x + 0.25 * N1[0], X.y + 0.25 * N1[1]], H3 = clipHalf(view, N1, q);
              const out = clipHalf(H3, [-N2[0], -N2[1]], [c2.x, c2.y]);
              if (out.length > 2) A.poly(out, { fill: 'red', fillAlpha: 0.08, hatch: 'red', hatchAlpha: 0.35, stroke: false });
              A.line(q[0] - 6 * N1[1], q[1] + 6 * N1[0], q[0] + 6 * N1[1], q[1] - 6 * N1[0], { color: 'red', width: 1.5, dash: [3, 4] });
              A.tex('H_3', q[0] + 1.75 * N1[1] + 0.3 * N1[0], q[1] - 1.75 * N1[0] + 0.3 * N1[1], { color: 'red' });
            }
            st = { F, inside, rho: 0 };
          } else {
            const shape = (c, r, o) => (F === 'sq' ? A.rect(c.x - r, c.y - r, c.x + r, c.y + r, o) : A.circle(c.x, c.y, r, o));
            shape(c1, R1, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 1.8, dash });
            shape(c2, R2, { fill: 'purple', fillAlpha: 0.1, color: 'purple', width: 1.8, dash });
            const d = (c) => (F === 'sq' ? Math.max(Math.abs(X.x - c.x), Math.abs(X.y - c.y)) : Math.hypot(X.x - c.x, X.y - c.y));
            const m1 = R1 - d(c1), m2 = R2 - d(c2);
            const inside = closed ? m1 >= -1e-9 && m2 >= -1e-9 : m1 > 0 && m2 > 0;
            rho = inside ? Math.max(0, Math.min(m1, m2)) : 0;
            if (inside && rho > 1e-6) shape(X, rho, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2, dash });
            if (inside && rho <= 1e-6) A.circle(X.x, X.y, 0.16, { color: 'red', width: 2, dash: [3, 3] });
            st = { F, inside, rho, tangent: Math.abs(Math.hypot(c2.x - c1.x, c2.y - c1.y) - (R1 + R2)) < 1e-6 };
          }
          if (F === 'half') {
            A.tex('H_1', c1.x - 1.3 * N1[1] - 0.35 * N1[0], c1.y + 1.3 * N1[0] - 0.35 * N1[1], { color: 'blue' });
            A.tex('H_2', c2.x + 1.4 * N2[1] - 0.35 * N2[0], c2.y - 1.4 * N2[0] - 0.35 * N2[1], { color: 'purple' });
          } else { A.tex('B_1', c1.x - 0.75, c1.y + 0.95, { color: 'blue' }); A.tex('B_2', c2.x + 0.75, c2.y - 0.8, { color: 'purple' }); }
          A.corner(st.inside ? (F === 'half' ? 'no half-plane fits — the wedge is a finite intersection' : st.rho > 1e-6 ? `B₃ fits: radius ${v.fmt(st.rho, 3)}` : 'no basic set of positive size fits') : 'move x into B₁ ∩ B₂', 'bl', { color: st.inside ? (F === 'half' || st.rho <= 1e-6 ? 'red' : 'green') : 'muted', weight: 600, plate: true });
          // ---- right: U covered by basic sets
          B.circle(0, 0, UR, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.6, dash: [6, 4] });
          B.circle(C[0], C[1], CR, { fill: 'panel', fillAlpha: 1, color: 'accent', width: 1.6, dash: [6, 4] });
          for (let gx = -1.7; gx <= 1.7; gx += 0.34) for (let gy = -1.7; gy <= 1.7; gy += 0.34) {
            const draw = basicIn(gx, gy, F === 'half' ? 'half' : F);
            if (draw) draw({ fill: 'orange', fillAlpha: 0.045, color: 'orange', width: 0.8, alpha: 0.45 });
          }
          const dy = basicIn(Y.x, Y.y, F);
          if (dy) dy({ fill: 'green', fillAlpha: 0.28, color: 'green', width: 2, dash: closed ? null : [5, 3] });
          B.tex('U', -1.45, 1.45, { color: 'accent', size: 17 });
          B.corner(F === 'half' ? 'basic sets: triangles = intersections of 3 half-planes' : F === 'cdisc' ? 'closed discs inside U also cover it' : `basic sets: ${F === 'sq' ? 'squares' : 'discs'} inside U`, 'bl', { color: 'muted', weight: 600 });
        });
        v.legend([['blue', '$B_1$', { area: true }], ['purple', '$B_2$', { area: true }], ['green', 'basic set $B_3$ with $x\\in B_3\\subset B_1\\cap B_2$', { area: true }], ['orange', 'basic sets inside $U$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { F, inside, rho } = st;
          if (!inside) return 'Drag $x$ into $B_1\\cap B_2$.';
          if (F === 'half') return '**(B2) fails for half-planes:** a half-plane containing $x$ is never inside the wedge $H_1\\cap H_2$ (the red hatched part sticks out). Half-planes are a **subbasis**, not a basis: the wedge is a finite intersection, and the finite intersections — convex open polygons — form a basis for the usual topology.';
          if (F === 'cdisc' && rho <= 1e-6) return `**(B2) fails:** $x$ lies on the boundary of ${st.tangent ? 'both discs, which are tangent, so $B_1\\cap B_2=\\{x\\}$' : '$B_1\\cap B_2$'}, and no closed disc of positive radius around $x$ fits inside. Used as a subbasis, closed discs generate the **discrete** topology, since two tangent closed discs meet in a single point.`;
          return `$B_3$ = the ${F === 'sq' ? 'square' : 'disc'} of radius $${v.fix(rho, 3)}$ about $x$ satisfies $x\\in B_3\\subset B_1\\cap B_2$ ✓` + (F === 'cdisc' ? ' — here; now put $x$ on the boundary.' : `. Open ${F === 'sq' ? 'squares' : 'discs'} satisfy (B2) everywhere, and both families generate the usual topology of $\\R^2$: every disc contains a concentric square and vice versa.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Finer and coarser topologies',
      statement: String.raw`If $\tau$ and $\tau'$ are topologies on the same set $X$ with $\tau\subset\tau'$, then $\tau'$ is **finer** (larger) than $\tau$ and $\tau$ is **coarser** (smaller) than $\tau'$; *strictly* so if $\tau\ne\tau'$. Two topologies are **comparable** if one contains the other.

The topologies on $X$ form a complete lattice under inclusion: the discrete topology is the finest and the indiscrete the coarsest; any two have a **meet** $\tau_1\wedge\tau_2=\tau_1\cap\tau_2$ and a **join** $\tau_1\vee\tau_2$, the topology generated by $\tau_1\cup\tau_2$ as a subbasis. For bases: $\mathscr B'$ generates a topology finer than $\mathscr B$ does if and only if for every $B\in\mathscr B$ and $x\in B$ there is $B'\in\mathscr B'$ with $x\in B'\subset B$.`,
      idea: String.raw`An intersection of topologies satisfies the axioms (each union or intersection lies in every one of them), so the meet is just $\tau_1\cap\tau_2$; but a union of two topologies usually misses some unions and intersections, and generating from it (1.3) adds exactly what is needed. Finer means more open sets, hence fewer convergent sequences and more continuous functions *out of* the space: the identity $(X,\tau')\to(X,\tau)$ is continuous precisely when every $\tau$-open set is $\tau'$-open, i.e. $\tau\subset\tau'$. Counting the lattice is a classical problem: 1, 4, 29, 355, 6942 topologies on 1–5 points.`,
      caption: String.raw`The Hasse diagram of *all* topologies on $n$ points, finer ones higher; each glyph is the power set with its open sets filled. Click two topologies (they become $\tau_1$, blue, and $\tau_2$, orange): their meet and join are ringed, and the interval between them stays bright. Below, the join's new sets (gold) are those created by unions or intersections across $\tau_1$ and $\tau_2$; the table counts topologies by enumeration ($n\le4$) and as preorders ($n=5$).`,
      deps: ['top-1.1', 'top-1.3'],
      refs: ['Munkres §13'],
      tags: ['lattice of topologies', 'counting'],
      viz(v) {
        const init = {
          2: [famOf([0, 1, 3]), famOf([0, 2, 3])],
          3: [famOf([0, setOf([1]), setOf([1, 2]), 7]), famOf([0, setOf([2, 3]), 7])],
          4: [famOf([0, setOf([1]), setOf([1, 2]), 15]), famOf([0, setOf([2, 3]), setOf([2, 3, 4]), 15])],
        };
        let n = 3, sel = init[3].slice(), next = 0;
        v.select('points $n$', [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4 (355 topologies)' }], '3', { onChange: (x) => { n = +x; sel = init[n].slice(); next = 0; } });
        const M = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 380, full: true, title: 'all topologies on $n$ points, ordered by inclusion — finer is higher' });
        const D = v.stage({ x: [0, 12], y: [0, 4.6], axes: false, height: 210, weight: 1.7, title: 'the open sets of $\\tau_1$, $\\tau_2$ and their join' });
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 210, weight: 1, title: 'how many topologies on $n$ points?' });
        const counts = [1, 2, 3, 4].map((k) => ({ top: allTops(k).length, t0: allTops(k).filter((F) => isT0(F, k)).length, cls: classesOf(k) }));
        const c5 = countPreorders(5); counts.push({ top: c5.pre, t0: c5.po, cls: c5.classes });
        const tab = v.table(Tb, { rows: 5, cols: 3, square: false, cellAspect: 1.9, maxCell: 30, size: 13, rowLabels: ['1', '2', '3', '4', '5'], colLabels: ['all', 'T₀', 'up to ≅'], cornerLabel: 'n' });
        M.onClick((x, y) => {
          const L = lattice(n); let best = null, bd = Infinity;
          for (const F of L.T) { const [px, py] = L.pos.get(F); const d = Math.hypot(M.X(px) - M.X(x), M.Y(py) - M.Y(y)); if (d < bd) { bd = d; best = F; } }
          if (best != null && bd < 26) { sel[next] = best; next = 1 - next; }
        });
        let st = null;
        v.render(() => {
          const L = lattice(n), [t1, t2] = sel;
          const meet = t1 & t2, join = generate(t1 | t2, n).top;
          const inI = (F) => (meet & F) === meet && (F & join) === F;
          const big = n <= 3, w = n === 2 ? 34 : 30, h = n === 2 ? 30 : 26;
          for (const [a, b] of L.covers) {
            const [x1, y1] = L.pos.get(a), [x2, y2] = L.pos.get(b), hl = inI(a) && inI(b);
            M.line(x1, y1, x2, y2, { color: hl ? 'muted' : 'faint', width: big ? (hl ? 1.6 : 1) : hl ? 0.9 : 0.5, alpha: big ? (hl ? 0.9 : 0.5) : hl ? 0.55 : 0.16 });
          }
          const role = (F) => [F === t1 && 'accent', F === t2 && 'orange', F === join && 'green', F === meet && 'purple'].filter(Boolean);
          for (const F of L.T) {
            const [px, py] = L.pos.get(F), X = M.X(px), Y = M.Y(py), r = role(F), dim = !inI(F);
            if (big) {
              M.ctx.save();
              M.ctx.beginPath(); M.ctx.roundRect(X - w / 2 - 3, Y - h / 2 - 3, w + 6, h + 6, 6);
              M.ctx.fillStyle = v.color('panel'); M.ctx.fill();
              M.ctx.lineWidth = r.length ? 2.6 : 1; M.ctx.strokeStyle = v.color(r[0] || 'faint', r.length ? 1 : 0.7); M.ctx.stroke();
              if (r.length > 1) { M.ctx.beginPath(); M.ctx.roundRect(X - w / 2 - 7, Y - h / 2 - 7, w + 14, h + 14, 9); M.ctx.lineWidth = 2.2; M.ctx.strokeStyle = v.color(r[1]); M.ctx.stroke(); }
              M.ctx.restore();
              glyph(v, M, F, n, X, Y, w, h, F === t1 ? 'accent' : F === t2 ? 'orange' : 'ink', dim ? 0.35 : 1);
            } else {
              M.dot(px, py, { r: r.length ? 5.5 : 2.4, color: r[0] || 'muted', alpha: r.length ? 1 : dim ? 0.35 : 0.85 });
              if (r.length > 1) M.circle(px, py, 0.07, { color: r[1], width: 2 });
            }
          }
          // labels for the four special topologies
          const tags = new Map();
          for (const [F, t, c] of [[t1, 'τ₁', 'accent'], [t2, 'τ₂', 'orange'], [join, 'τ₁∨τ₂', 'green'], [meet, 'τ₁∧τ₂', 'purple']]) { const o = tags.get(F) || []; o.push([t, c]); tags.set(F, o); }
          for (const [F, list] of tags) {
            const [px, py] = L.pos.get(F);
            M.text(list.map((q) => q[0]).join(' = '), px, py, { dx: big ? w / 2 + 10 : 9, color: list[0][1], weight: 700, size: 12, plate: true });
          }
          L.sizes.forEach((sz, j) => M.text(`${sz} open`, 0.05, 0.45 + (5.1 * j) / Math.max(L.sizes.length - 1, 1), { color: 'muted', size: 10.5 }));
          // detail: τ1, τ2, join
          const boxes = [[t1, 'τ₁', 'accent', 0.2], [t2, 'τ₂', 'orange', 4.2], [join, 'τ₁ ∨ τ₂', 'green', 8.2]];
          for (const [F, name, col, x0] of boxes) {
            const pos = powerPos(n, [x0 + 0.35, x0 + 3.25], [0.45, 3.45]);
            for (let m = 0; m < 1 << n; m++) for (let i = 0; i < n; i++) if (!(m & (1 << i))) D.line(pos[m][0], pos[m][1], pos[m | (1 << i)][0], pos[m | (1 << i)][1], { color: 'faint', width: 1 });
            for (let m = 0; m < 1 << n; m++) {
              const isNew = F === join && inF(join, m) && !inF(t1 | t2, m);
              if (n <= 3) {
                if (inF(F, m)) D.text(setName(m, n), pos[m][0], pos[m][1], { align: 'center', color: isNew ? 'gold' : col, weight: 700, size: 11.5, plate: true });
                else D.text(setName(m, n), pos[m][0], pos[m][1], { align: 'center', color: 'muted', size: 10.5, alpha: 0.6 });
              } else D.dot(pos[m][0], pos[m][1], { r: inF(F, m) ? 4.5 : 3, color: isNew ? 'gold' : inF(F, m) ? col : 'muted', hollow: !inF(F, m) });
            }
            D.text(`${name}: ${pc(F)} open sets`, x0 + 1.8, 4.2, { align: 'center', color: col, weight: 700, size: 12 });
          }
          tab.draw({ value: (i, j) => [counts[i].top, counts[i].t0, counts[i].cls][j], activeRow: n - 1, activeColor: 'accent', textColor: (i, j) => (i === 4 ? 'purple' : 'ink') });
          st = { t1, t2, meet, join };
        });
        v.legend([['accent', '$\\tau_1$', { dot: true }], ['orange', '$\\tau_2$', { dot: true }], ['purple', 'meet $\\tau_1\\cap\\tau_2$', { dot: true }], ['green', 'join: generated by $\\tau_1\\cup\\tau_2$', { dot: true }], ['gold', 'new sets in the join', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { t1, t2, meet, join } = st;
          const rel = t1 === t2 ? 'equal' : (t1 & t2) === t1 ? '$\\tau_1\\subset\\tau_2$: $\\tau_2$ is finer' : (t1 & t2) === t2 ? '$\\tau_2\\subset\\tau_1$: $\\tau_1$ is finer' : 'not comparable';
          const bad = members(t2, n).find((m) => !inF(t1, m));
          const id = bad == null ? 'The identity $(X,\\tau_1)\\to(X,\\tau_2)$ **is continuous**: every $\\tau_2$-open set is $\\tau_1$-open.' : `The identity $(X,\\tau_1)\\to(X,\\tau_2)$ **is not continuous**: $${setTex(bad, n)}$ is $\\tau_2$-open but its preimage is not $\\tau_1$-open.`;
          const extra = pc(join) - pc(t1 | t2);
          return `$\\tau_1$ and $\\tau_2$ are ${rel}. Meet: ${pc(meet)} open sets; join: ${pc(join)}${extra ? ` (${extra} created by generating)` : ''}. ${id} Topologies on ${n} points: **${allTops(n).length}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Metric topology; metrizable spaces',
      statement: String.raw`Let $d$ be a metric on $X$. The balls $B_d(x,\eps)=\{y: d(x,y)<\eps\}$ form a basis; the topology they generate is the **metric topology** of $d$. Thus $U$ is open exactly when every $x\in U$ has some $\eps>0$ with $B_d(x,\eps)\subset U$ — the definition of Rudin 2.18. A topological space is **metrizable** if its topology is the metric topology of some metric on it.

Different metrics can give the same topology: $d$ and $d'$ do so exactly when every $d$-ball about a point contains a $d'$-ball about that point, and vice versa.`,
      idea: String.raw`Balls satisfy (B2) because a ball is a neighbourhood of each of its points (Rudin 2.19): if $y\in B(x,\eps)$, then $B(y,\eps-d(x,y))\subset B(x,\eps)$ by the triangle inequality. On $\R^2$ the taxicab, Euclidean and maximum metrics satisfy $d_\infty\le d_2\le d_1\le 2d_\infty$, so each kind of ball contains a ball of the others with comparable radius: they define one topology, the usual one. The discrete metric ($d=1$ off the diagonal) has $B(x,1)=\{x\}$, so every set is open. The French railway metric (distances measured through the hub $O$ unless both points lie on one ray from $O$) has thin segments as small balls away from $O$: it is metrizable by definition, but strictly finer than the usual topology.`,
      caption: String.raw`Click a cell of the table to choose a metric (row) and a set (column); the table itself is computed by testing every sample point of the set for a ball inside it. In the picture, drag $x$ (it snaps to edges, the segment and the point): the filled shape is the largest ball of the chosen metric around $x$ inside the set, with the largest $d_1$, $d_2$, $d_\infty$ balls outlined — whenever one exists, all three do.`,
      deps: ['top-1.3', 'pma-2.15', 'pma-2.19'],
      refs: ['Munkres §20'],
      tags: ['metric spaces', 'metrizability'],
      viz(v) {
        const SETS = [
          { key: 'disc', label: 'disc', open: true, has: (x, y) => Math.hypot(x - 0.3, y - 0.2) < 1.15 },
          { key: 'osq', label: 'open □', open: true, has: (x, y) => Math.abs(x - 0.1) < 0.95 && Math.abs(y - 0.1) < 0.95 },
          { key: 'csq', label: 'closed □', open: false, has: (x, y) => Math.abs(x - 0.1) <= 0.95 + 1e-12 && Math.abs(y - 0.1) <= 0.95 + 1e-12 },
          { key: 'seg', label: 'segment', open: false, has: (x, y) => { const r = Math.hypot(x, y); return r > 0.45 && r < 1.75 && Math.abs(Math.atan2(y, x) - 0.6) < 1e-9; } },
          { key: 'pt', label: 'point', open: false, has: (x, y) => Math.abs(x - 0.9) < 1e-12 && Math.abs(y + 0.7) < 1e-12 },
        ];
        const SEG = [0.6, 0.45, 1.75];
        const METRICS = ['$d_1$', '$d_2$', '$d_\\infty$', 'discrete', 'railway'];
        const norm = (x, y, k) => (k === 0 ? Math.abs(x) + Math.abs(y) : k === 1 ? Math.hypot(x, y) : Math.max(Math.abs(x), Math.abs(y)));
        // exit distance from p along the unit direction u (sets are convex, so A ∩ ray is an initial segment)
        const exitT = (A, px, py, ux, uy) => { if (!A.has(px, py)) return 0; let lo = 0, hi = 5; if (A.has(px + hi * ux, py + hi * uy)) return hi; for (let k = 0; k < 44; k++) { const m = (lo + hi) / 2; if (A.has(px + m * ux, py + m * uy)) lo = m; else hi = m; } return lo; };
        const DIRS = Array.from({ length: 144 }, (_, i) => (2 * Math.PI * i) / 144);
        /** sup{r : B_d(p, r) ⊂ A} for metric k (0 = d1, 1 = d2, 2 = d∞, 3 = discrete, 4 = railway). */
        function radius(A, px, py, k) {
          if (!A.has(px, py)) return 0;
          if (k === 3) return 1;
          if (k === 4) {
            const r0 = Math.hypot(px, py);
            if (r0 < 1e-12) return radius(A, px, py, 1);
            const ux = px / r0, uy = py / r0;
            return Math.min(exitT(A, px, py, ux, uy), exitT(A, px, py, -ux, -uy), r0);
          }
          let r = Infinity;
          for (const th of DIRS) { const ux = Math.cos(th), uy = Math.sin(th); r = Math.min(r, exitT(A, px, py, ux, uy) * norm(ux, uy, k)); if (r < 1e-9) return 0; }
          return r;
        }
        // sample points of each set (boundary points that belong to it included)
        const samples = (A) => {
          if (A.key === 'disc') return Array.from({ length: 40 }, (_, i) => { const t = i * 2.4, rr = 1.14 * Math.sqrt((i + 0.5) / 40); return [0.3 + rr * Math.cos(t), 0.2 + rr * Math.sin(t)]; });
          if (A.key === 'osq' || A.key === 'csq') { const e = A.key === 'csq' ? 0.95 : 0.949; const out = []; for (const a of [-1, -0.5, 0, 0.5, 1]) for (const b of [-1, -0.5, 0, 0.5, 1]) out.push([0.1 + a * e, 0.1 + b * e]); return out; }
          if (A.key === 'seg') return [0.5, 0.8, 1.1, 1.4, 1.7].map((r) => [r * Math.cos(SEG[0]), r * Math.sin(SEG[0])]);
          return [[0.9, -0.7]];
        };
        const table = METRICS.map((_, k) => SETS.map((A) => { let worst = null; for (const [x, y] of samples(A)) if (radius(A, x, y, k) <= 1e-9) { worst = [x, y]; break; } return { open: worst == null, worst }; }));
        let mk = 1, sk = 2;
        const P = v.stage({ x: [-2, 2.2], y: [-1.75, 2.0], equal: true, axes: false, height: 340, weight: 1.15, title: 'largest ball about $x$ inside the set' });
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, title: 'is the set open? (click a cell)' });
        const T = v.table(Tb, { rows: 5, cols: 5, square: false, cellAspect: 1.25, maxCell: 46, size: 16, rowLabels: METRICS, colLabels: SETS.map((A) => A.label), labelSize: 11.5 });
        Tb.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0) mk = c.i; if (c && c.j >= 0) { sk = c.j; place(); } });
        const snap = (x, y) => {
          const A = SETS[sk];
          if (A.key === 'pt') return Math.hypot(x - 0.9, y + 0.7) < 0.25 ? [0.9, -0.7] : [x, y];
          if (A.key === 'seg') { const r = x * Math.cos(SEG[0]) + y * Math.sin(SEG[0]), off = -x * Math.sin(SEG[0]) + y * Math.cos(SEG[0]); if (Math.abs(off) < 0.15 && r > 0.46 && r < 1.74) return [r * Math.cos(SEG[0]), r * Math.sin(SEG[0])]; return [x, y]; }
          if (A.key === 'csq') { let [a, b] = [x - 0.1, y - 0.1]; if (Math.abs(Math.abs(a) - 0.95) < 0.07 && Math.abs(b) <= 0.95) a = Math.sign(a) * 0.95; if (Math.abs(Math.abs(b) - 0.95) < 0.07 && Math.abs(a) <= 0.95) b = Math.sign(b) * 0.95; return [a + 0.1, b + 0.1]; }
          return [x, y];
        };
        const X = P.handle(0.62, 0.4, { color: 'ink', label: '$x$', constrain: snap });
        function place() { const A = SETS[sk]; const p = A.key === 'pt' ? [0.9, -0.7] : A.key === 'seg' ? [1.1 * Math.cos(SEG[0]), 1.1 * Math.sin(SEG[0])] : A.key === 'csq' ? [0.62, 0.4] : [0.75, 0.55]; X.set(p[0], p[1]); }
        let st = null;
        v.render(() => {
          const A = SETS[sk];
          // railway lines
          if (mk === 4) for (let i = 0; i < 12; i++) { const th = (Math.PI * i) / 6 + 0.6; P.line(0, 0, 3 * Math.cos(th), 3 * Math.sin(th), { color: 'faint', width: 1, alpha: 0.7 }); }
          if (mk === 4) P.dot(0, 0, { r: 4, color: 'muted', label: 'O', labelPos: 'sw' });
          // the set
          if (A.key === 'disc') P.circle(0.3, 0.2, 1.15, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.8, dash: [6, 4] });
          if (A.key === 'osq' || A.key === 'csq') P.rect(-0.85, -0.85, 1.05, 1.05, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.8, dash: A.key === 'osq' ? [6, 4] : null });
          if (A.key === 'seg') { const [th, a, b] = SEG; P.line(a * Math.cos(th), a * Math.sin(th), b * Math.cos(th), b * Math.sin(th), { color: 'accent', width: 4 }); P.dot(a * Math.cos(th), a * Math.sin(th), { hollow: true, color: 'accent' }); P.dot(b * Math.cos(th), b * Math.sin(th), { hollow: true, color: 'accent' }); }
          if (A.key === 'pt') P.dot(0.9, -0.7, { r: 5, color: 'accent' });
          // balls
          const r = [0, 1, 2, 3, 4].map((k) => radius(A, X.x, X.y, k));
          const ballK = (k, rr, o) => (k === 0 ? P.ball(X.x, X.y, rr, { p: 1, ...o }) : k === 1 ? P.circle(X.x, X.y, rr, o) : P.rect(X.x - rr, X.y - rr, X.x + rr, X.y + rr, o));
          const cols = ['teal', 'green', 'purple'];
          for (let k = 0; k < 3; k++) if (r[k] > 1e-9 && k !== mk) ballK(k, r[k], { color: cols[k], width: 1.3, dash: [4, 3], alpha: 0.85 });
          if (mk < 3 && r[mk] > 1e-9) ballK(mk, r[mk], { fill: cols[mk], fillAlpha: 0.28, color: cols[mk], width: 2.2 });
          if (mk === 3 && r[3] > 0) { P.circle(X.x, X.y, 0.13, { color: 'green', width: 2.4 }); P.text('B(x, 1) = {x}', X.x, X.y, { dx: 14, dy: 16, color: 'green', weight: 700, size: 12, plate: true }); }
          if (mk === 4 && r[4] > 1e-9) { const r0 = Math.hypot(X.x, X.y), ux = X.x / r0, uy = X.y / r0; P.line(X.x - r[4] * ux, X.y - r[4] * uy, X.x + r[4] * ux, X.y + r[4] * uy, { color: 'green', width: 7, alpha: 0.55 }); }
          if (r[mk] <= 1e-9 && A.has(X.x, X.y)) P.circle(X.x, X.y, 0.12, { color: 'red', width: 2, dash: [3, 3] });
          P.corner(!A.has(X.x, X.y) ? 'x is not in the set' : r[mk] > 1e-9 ? `ball of radius ${v.fmt(Math.min(r[mk], 9), 3)} fits` : 'no ball about x fits inside', 'bl', { color: !A.has(X.x, X.y) ? 'muted' : r[mk] > 1e-9 ? 'green' : 'red', weight: 600, plate: true });
          T.draw({
            value: (i, j) => (table[i][j].open ? '✓' : '✗'),
            textColor: (i, j) => (table[i][j].open ? 'green' : 'red'),
            fill: (i, j) => (i === mk && j === sk ? ['accent', 0.22] : null),
            highlight: [[mk, sk]], activeRow: mk, activeCol: sk, activeColor: 'faint',
          });
          st = { A, r, inA: A.has(X.x, X.y) };
        });
        v.legend([['teal', '$d_1$ ball', { area: true }], ['green', '$d_2$ ball', { area: true }], ['purple', '$d_\\infty$ ball', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { A, r, inA } = st, names = ['d_1', 'd_2', 'd_\\infty', '\\text{disc}', '\\text{rail}'];
          const row = table[mk], col = table.map((rw) => rw[sk].open);
          const verdict = row[sk].open ? `**open** in ${METRICS[mk]}` : `**not open** in ${METRICS[mk]} (the sample point $(${v.fix(row[sk].worst[0], 2)}, ${v.fix(row[sk].worst[1], 2)})$ has no ball inside)`;
          const here = inA ? `At $x$ the largest balls have radii ${[0, 1, 2].map((k) => `$${names[k]}$: ${v.fix(r[k], 3)}`).join(', ')} — all zero or all positive. ` : '';
          return `${here}The ${A.label === 'disc' ? 'open disc' : A.label === 'point' ? 'single point' : A.label.replace('□', 'square')} is ${verdict}. Columns agree on the rows $d_1,d_2,d_\\infty$ (one topology); the discrete row is all ✓; the railway row (${col[4] ? 'open' : 'not open'} here) is strictly between.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Order topology',
      statement: String.raw`Let $X$ be a set with a simple (total) order and at least two elements. The **order topology** on $X$ is generated by the basis consisting of

- all open intervals $(a,b)=\{x: a<x<b\}$;
- all intervals $[a_0,b)$, if $X$ has a least element $a_0$;
- all intervals $(a,b_0]$, if $X$ has a largest element $b_0$.

The open rays $(a,\to)$ and $(\leftarrow,b)$ form a subbasis. Examples: $\R$ gets its usual topology; $\N$ and $\Z$ get the discrete topology; the dictionary order on $\{1,2\}\times\N$ is *not* discrete; and the **ordered square** $I\times I$ with the dictionary order ($(x,y)<(x',y')$ iff $x<x'$, or $x=x'$ and $y<y'$) has thin vertical segments as neighbourhoods of most points.`,
      idea: String.raw`The intersection of two intervals is an interval, so (B2) holds and the intervals form a basis (1.3). Whether a point is isolated depends only on the order near it: $\{n\}=(n-1,n+1)$ in $\N$ because $n$ has an immediate predecessor and successor, while $2\times1$ in $\{1,2\}\times\N$ has no immediate predecessor, so every interval around it contains infinitely many points $1\times n$. In the ordered square a point $(x,y)$ with $0<y<1$ lies in $\{x\}\times(y-\eps,y+\eps)$, an interval of the order; but a point on the top edge $(x,1)$ is followed by the whole next column's bottom, so its intervals spill sideways and contain open rectangles.`,
      caption: String.raw`On the lines, drag the endpoints $a<b$ and the point $p$ (they snap to points of the set); the rows above shrink the interval toward $p$ and count what is left besides $p$. Try $p=2\times1$ in $\{1,2\}\times\N$. In the ordered square, drag $p$ (it snaps to the top and bottom edges) and change $\eps$; the inset magnifies the column of $p$ sideways.`,
      deps: ['top-1.3'],
      refs: ['Munkres §14'],
      tags: ['order topology', 'examples'],
      viz(v) {
        const mode = v.select('ordered set', [{ value: 'R', label: '$\\R$' }, { value: 'N', label: '$\\N$' }, { value: 'W', label: '$\\{1,2\\}\\times\\N$' }, { value: 'S', label: 'ordered square $I\\times I$' }], 'W', { onChange: () => reset() });
        const eps = v.slider('$\\varepsilon$', 0.03, 0.3, 0.12, { step: 0.01 });
        const s = v.stage({ x: [-0.6, 10.6], y: [-1.5, 3.9], height: 330, axes: false, full: true });
        // points of {1,2}×N: (c, n) at position 0.3 + 4.7(1 − 1/n) for c = 1 and 5 + 4.7(1 − 1/n) for c = 2
        const NW = 80, wpos = (c, n) => (c === 1 ? 0.3 : 5) + 4.7 * (1 - 1 / n);
        const WP = []; for (const c of [1, 2]) for (let n = 1; n <= NW; n++) WP.push({ c, n, x: wpos(c, n) });
        const cmpW = (P, Q) => (P.c - Q.c) || (P.n - Q.n);
        const nearW = (x) => WP.reduce((b, P) => (Math.abs(P.x - x) < Math.abs(b.x - x) ? P : b), WP[0]);
        const lineSnap = (x) => { const m = mode.value; if (m === 'R') return v.M.clamp(x, 0, 10); if (m === 'N') return v.M.clamp(Math.round(x), 1, 10); return nearW(x).x; };
        const ha = s.handle(3.4, 0, { color: 'orange', label: '$a$', labelPos: 'n', constrain: (x) => [Math.min(lineSnap(x), hp.x - 1e-6), 0] });
        const hb = s.handle(6.8, 0, { color: 'orange', label: '$b$', labelPos: 'n', constrain: (x) => [Math.max(lineSnap(x), hp.x + 1e-6), 0] });
        const hp = s.handle(5, 0, { color: 'accent', label: '$p$', labelPos: 'n', constrain: (x) => [lineSnap(v.M.clamp(x, ha.x + 1e-6, hb.x - 1e-6)), 0] });
        const hq = s.handle(0.42, 0.55, { color: 'accent', label: '$p$', constrain: (x, y) => { const X = v.M.clamp(x, 0, 1); let Y = v.M.clamp(y, 0, 1); if (Y > 0.96) Y = 1; if (Y < 0.04) Y = 0; return [X, Y]; } });
        function reset() {
          const m = mode.value;
          if (m === 'S') return;
          if (m === 'R') { ha.set(3.4, 0); hp.set(5.2, 0); hb.set(6.8, 0); }
          if (m === 'N') { ha.set(2, 0); hp.set(5, 0); hb.set(8, 0); }
          if (m === 'W') { ha.set(wpos(1, 3), 0); hp.set(wpos(2, 1), 0); hb.set(wpos(2, 3), 0); }
        }
        reset();
        const rowsY = [1.05, 1.95, 2.85];
        let st = null;
        v.render(() => {
          const m = mode.value, sq = m === 'S';
          eps.el.hidden = !sq; for (const h of [ha, hb, hp]) h.visible = !sq; hq.visible = sq;
          if (sq) {
            s.setScale({ equal: true, x: [-0.15, 2.45], y: [-0.17, 1.17] });
            const { x, y } = hq, e = eps.value;
            const a = y - e < 0 ? [x - e, 1 + y - e] : [x, y - e], b = y + e > 1 ? [x + e, y + e - 1] : [x, y + e];
            const least = x === 0 && y === 0, largest = x === 1 && y === 1;
            s.rect(0, 0, 1, 1, { fill: 'accent', fillAlpha: 0.05, color: 'muted', width: 1.2 });
            // the interval (a, b) of the dictionary order, drawn in the square and magnified in the inset
            const Z = 0.45 / e, cx = 1.85, mapX = (u) => cx + (u - x) * Z;
            const paint = (X, inset) => {
              const col = 'orange';
              if (a[0] === b[0] || least || largest) {
                const y0 = least ? 0 : a[1], y1 = largest ? 1 : b[1];
                s.line(X(x), y0, X(x), y1, { color: col, width: inset ? 7 : 3.2 });
                if (!least) s.dot(X(x), y0, { hollow: true, color: col, r: inset ? 4.5 : 3 });
                if (!largest) s.dot(X(x), y1, { hollow: true, color: col, r: inset ? 4.5 : 3 });
              } else {
                s.rect(X(a[0]), 0, X(b[0]), 1, { fill: col, fillAlpha: 0.3, stroke: false });
                s.line(X(a[0]), a[1], X(a[0]), 1, { color: col, width: inset ? 7 : 3.2 });
                s.line(X(b[0]), 0, X(b[0]), b[1], { color: col, width: inset ? 7 : 3.2 });
                s.dot(X(a[0]), a[1], { hollow: true, color: col, r: inset ? 4.5 : 3 }); s.dot(X(b[0]), b[1], { hollow: true, color: col, r: inset ? 4.5 : 3 });
              }
            };
            paint((u) => u, false);
            s.clip(() => { s.rect(1.35, 0, 2.35, 1, { fill: 'accent', fillAlpha: 0.04, color: 'muted', width: 1 }); for (let k = -9; k <= 9; k++) if (k) s.vline(cx + k * 0.055, { color: 'faint', width: 0.8, alpha: 0.6 }); paint(mapX, true); s.vline(cx, { color: 'accent', width: 1, dash: [3, 3], alpha: 0.6 }); s.dot(cx, y, { r: 5, color: 'accent' }); }, [1.35, 2.35], [-0.01, 1.01]);
            s.rect(1.35, 0, 2.35, 1, { color: 'muted', width: 1.2 });
            s.text(`column x = ${v.fix(x, 3)}, magnified ×${Math.round(Z)} sideways`, 1.85, 1.08, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            s.text('ordered square I × I', 0.5, 1.08, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            s.text('(0,0)', 0, -0.06, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' }); s.text('(1,1)', 1, 1.03, { align: 'center', baseline: 'bottom', size: 10.5, color: 'muted' });
            st = { m, spill: a[0] !== b[0] && !least && !largest, x, y, least, largest };
            return;
          }
          s.setScale({ equal: false, x: [-0.6, 10.6], y: [-1.5, 3.9] });
          // the space itself on the base line
          const base = (Y, alpha = 1) => {
            if (m === 'R') { s.line(-0.3, Y, 10.3, Y, { color: 'ink', width: 2, alpha }); return; }
            s.line(m === 'N' ? 0.5 : 0, Y, 10.3, Y, { color: 'faint', width: 1.2, alpha });
            if (m === 'N') for (let n = 1; n <= 10; n++) s.dot(n, Y, { r: 3.4, color: 'ink', alpha });
            else for (const P of WP) s.dot(P.x, Y, { r: Math.max(0.9, 3.6 - 0.32 * P.n), color: 'ink', alpha, ring: false });
          };
          base(0);
          if (m === 'R') for (let k = 0; k <= 10; k++) s.text(String(k), k, -0.55, { align: 'center', size: 11, color: 'muted' });
          if (m === 'N') for (let n = 1; n <= 10; n++) s.text(String(n), n, -0.55, { align: 'center', size: 11, color: 'muted' });
          if (m === 'W') for (const [c, n] of [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]]) s.text(`${c}×${n}`, wpos(c, n), -0.55, { align: 'center', size: 11, color: c === 2 && n === 1 ? 'accent' : 'muted', weight: c === 2 && n === 1 ? 700 : 500 });
          s.text(m === 'R' ? '…' : '…', 10.45, 0, { size: 13, color: 'muted' });
          // the interval (a, b) and shrinking ones
          const P = m === 'W' ? nearW(hp.x) : null, A = m === 'W' ? nearW(ha.x) : null, B = m === 'W' ? nearW(hb.x) : null;
          const rows = [];
          for (let k = 0; k < 4; k++) {
            let lo, hi, count;
            if (m === 'R') { lo = hp.x - (hp.x - ha.x) / 3 ** k; hi = hp.x + (hb.x - hp.x) / 3 ** k; count = '∞'; }
            else if (m === 'N') { const ia = hp.x - Math.max(1, Math.ceil((hp.x - ha.x) / 2 ** k)), ib = hp.x + Math.max(1, Math.ceil((hb.x - hp.x) / 2 ** k)); lo = ia; hi = ib; count = ib - ia - 2; }
            else {
              // shrink toward P in the order of {1,2}×N
              let a = A, b = B;
              if (k > 0) {
                if (P.c === 2 && P.n === 1) a = A.c === 1 ? { c: 1, n: Math.min(NW, A.n * 3 ** k) } : A; else a = cmpW(A, P) < 0 ? (A.c === P.c ? { c: P.c, n: Math.max(A.n, P.n - Math.max(1, Math.ceil((P.n - A.n) / 2 ** k))) } : { c: P.c, n: Math.max(1, P.n - 1 - Math.floor((P.n - 1) / 2 ** k)) }) : A;
                b = B.c === P.c ? { c: P.c, n: P.n + Math.max(1, Math.ceil((B.n - P.n) / 2 ** k)) } : { c: B.c, n: B.n };
                if (b.c !== P.c && k > 1) b = { c: P.c, n: P.n + 1 };
                if (a.c !== P.c && !(P.c === 2 && P.n === 1) && k > 1) a = P.n > 1 ? { c: P.c, n: P.n - 1 } : a;
              }
              lo = wpos(a.c, a.n); hi = wpos(b.c, b.n);
              const infinite = a.c === 1 && cmpW(b, { c: 2, n: 1 }) >= 0 && (P.c === 2 && P.n === 1 || cmpW(a, P) < 0 && P.c === 2 && a.c === 1);
              count = infinite ? '∞' : (a.c === b.c ? b.n - a.n - 2 : NaN);
            }
            rows.push({ lo, hi, count });
          }
          const drawIv = (lo, hi, Y, strong) => {
            s.line(lo, Y, hi, Y, { color: 'orange', width: strong ? 7 : 5, alpha: strong ? 0.45 : 0.6, cap: 'butt' });
            const inside = m === 'R' ? [] : m === 'N' ? Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => n > lo && n < hi) : WP.filter((Q) => Q.x > lo + 1e-9 && Q.x < hi - 1e-9).map((Q) => Q.x);
            for (const x of inside) if (Math.abs(x - hp.x) > 1e-9) s.dot(x, Y, { r: m === 'W' ? 2.6 : 3.6, color: 'gold' });
            s.dot(lo, Y, { hollow: true, color: 'orange', r: 3.8 }); s.dot(hi, Y, { hollow: true, color: 'orange', r: 3.8 });
            s.dot(hp.x, Y, { r: 4.2, color: 'accent' });
          };
          drawIv(rows[0].lo, rows[0].hi, 0, true);
          rows.slice(1).forEach((r, k) => {
            const Y = rowsY[k]; base(Y, 0.35); drawIv(r.lo, r.hi, Y, false);
            const c = r.count, txt = c === '∞' ? 'infinitely many other points' : c === 0 ? 'only p: {p} is open' : `${c} other point${c === 1 ? '' : 's'}`;
            s.text(txt, 10.55, Y + 0.32, { align: 'right', size: 11.5, color: c === 0 ? 'green' : c === '∞' ? 'red' : 'muted', weight: 600 });
          });
          s.corner('shrinking basic intervals about p', 'tl', { color: 'muted', weight: 600 });
          st = { m, P, rows };
        });
        v.legend([['orange', 'basic open interval', { area: true }], ['accent', 'the point $p$', { dot: true }], ['gold', 'other points in the interval', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m } = st;
          if (m === 'S') {
            const { spill, x, y, least, largest } = st;
            if (least || largest) return `$p$ is the ${least ? 'least' : 'largest'} element, so its basic neighbourhoods are the half-open intervals ${least ? '$[(0,0),b)$' : '$(a,(1,1)]$'} of the order.`;
            return spill ? `$p=(${v.fix(x, 2)},${v.fix(y, 0)})$ lies on the ${y === 1 ? 'top' : 'bottom'} edge: the next (or previous) point of the order is at the other end of the column, so every interval around $p$ **spills into the neighbouring columns** and contains an open rectangle.` : `$p=(${v.fix(x, 2)},${v.fix(y, 2)})$ has the **vertical sliver** $\\{${v.fix(x, 2)}\\}\\times(${v.fix(y - eps.value, 2)},${v.fix(y + eps.value, 2)})$ as a basic neighbourhood — an interval of the order containing no open rectangle. Each column $\\{x\\}\\times(0,1)$ is open: uncountably many disjoint open sets.`;
          }
          if (m === 'R') return 'Every interval about $p$ contains infinitely many other points: no point of $\\R$ is isolated, and the order topology is the usual one.';
          if (m === 'N') return '$\\{p\\}=(p-1,p+1)$ — and $\\{1\\}=[1,2)$ since $1$ is the least element — so every singleton is open: **the order topology on $\\N$ is discrete**, the same as its subspace topology from $\\R$.';
          const P = st.P;
          return P.c === 2 && P.n === 1 ? '$2\\times1$ has **no immediate predecessor**: every interval about it contains infinitely many points $1\\times n$, so $\\{2\\times1\\}$ is not open and $1\\times n\\to2\\times1$. Every other point is isolated — this countable well-ordered set is not discrete, unlike $\\N$.' : `$${P.c}\\times${P.n}$ has an immediate predecessor and successor (or is least), so it is isolated; drag $p$ to $2\\times1$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Subspace topology',
      statement: String.raw`Let $(X,\tau)$ be a topological space and $Y\subset X$. The **subspace topology** on $Y$ is
$$\tau_Y=\{\,U\cap Y : U\in\tau\,\}:$$
a set is open in $Y$ exactly when it is the trace on $Y$ of an open set of $X$. If $\mathscr B$ is a basis for $\tau$, the traces $B\cap Y$ form a basis for $\tau_Y$. A set can be open (or closed) in $Y$ without being open (or closed) in $X$; if $Y$ is itself open in $X$, open sets of $Y$ are open in $X$.

For $Y\subset\R$ there is also the order topology of $Y$ (1.6); the two agree when $Y$ is an interval, but can differ otherwise.`,
      idea: String.raw`Traces respect the operations in the axioms: $\bigcup(U_\alpha\cap Y)=(\bigcup U_\alpha)\cap Y$ and $(U\cap Y)\cap(V\cap Y)=(U\cap V)\cap Y$, so $\tau_Y$ is a topology; for metric spaces this is Rudin's 2.30 (relatively open sets are traces of open sets). Closed sets of $Y$ are then the traces $C\cap Y$ of closed sets $C$, equivalently the sets $T\subset Y$ with $T=Y\cap\overline T$. A gap in $Y$ lets one interval of $\R$ cut off a whole piece, which is how $[0,1]$ becomes open *and* closed in $[0,1]\cup(2,3)$. The order topology only uses intervals with endpoints *in* $Y$, so it cannot cut at a gap that $Y$ approaches from one side.`,
      caption: String.raw`Drag the endpoints of the open interval $U=(a,b)$ of $\R$ (orange); green is its trace $U\cap Y$, and purple is what remains of $Y$. The readout decides, exactly, whether the trace is open in $\R$, open in $Y$ and closed in $Y$. Switch on **order topology** to use only intervals of $Y$ with endpoints in $Y$ (the handles snap to $Y$; beyond its ends they become rays).`,
      deps: ['top-1.1', 'top-1.6'],
      see: ['pma-2.30'],
      refs: ['Munkres §16'],
      tags: ['subspaces', 'relative topology'],
      viz(v) {
        const YS = {
          a: { label: '$[0,1)$', tex: '[0,1)', Y: psFrom([[0, 1, ALL, true, false]]), parts: [[0, 1, true, false]], pts: [] },
          b: { label: '$[0,1]\\cup(2,3)$', tex: '[0,1]\\cup(2,3)', Y: psFrom([[0, 1, ALL, true, true], [2, 3]]), parts: [[0, 1, true, true], [2, 3, false, false]], pts: [] },
          c: { label: '$[0,1)\\cup\\{2\\}$', tex: '[0,1)\\cup\\{2\\}', Y: psFrom([[0, 1, ALL, true, false]], [2]), parts: [[0, 1, true, false]], pts: [2] },
        };
        const which = v.select('$Y$', Object.entries(YS).map(([value, o]) => ({ value, label: o.label })), 'a', { onChange: (k) => { if (k === 'a') { ha.set(-0.5, YU); hb.set(0.5, YU); } if (k === 'b') { ha.set(-0.4, YU); hb.set(1.5, YU); } if (k === 'c') { ha.set(1.5, YU); hb.set(2.5, YU); } } });
        const ord = v.toggle('order topology on $Y$', false);
        const s = v.stage({ x: [-1.3, 4.3], y: [-1.75, 2.45], axes: false, height: 320, full: true });
        const YU = 1.75, YY = 0.75, YT = -0.25, YC = -1.15, LO = -1.3, HI = 4.3;
        // snap to Y (order mode): nearest point of Y, or ±∞ beyond its ends
        const snapY = (x, side) => {
          const D = YS[which.value];
          if (!ord.value) return x;
          const lo = D.parts[0][0], hi = Math.max(...D.parts.map((q) => q[1]), ...D.pts);
          if (side < 0 && x < lo - 0.3) return -Infinity;
          if (side > 0 && x > hi + 0.3) return Infinity;
          let best = null, bd = Infinity;
          for (const [a, b, lc, rc] of D.parts) { const c = v.M.clamp(x, lc ? a : a + 0.02, rc ? b : b - 0.02); if (Math.abs(c - x) < bd) { bd = Math.abs(c - x); best = c; } }
          for (const q of D.pts) if (Math.abs(q - x) < bd) { bd = Math.abs(q - x); best = q; }
          return best;
        };
        const show = (x) => (x === -Infinity ? LO + 0.15 : x === Infinity ? HI - 0.15 : x);
        const ha = s.handle(-0.5, YU, { color: 'orange', label: '$a$', constrain: (x) => [show(Math.min(snapY(x, -1), hb.x - 0.02)), YU] });
        const hb = s.handle(0.5, YU, { color: 'orange', label: '$b$', constrain: (x) => [show(Math.max(snapY(x, 1), ha.x + 0.02)), YU] });
        let st = null;
        v.render(() => {
          const D = YS[which.value], Y = D.Y;
          let a = ha.x, b = hb.x;
          if (ord.value) { a = snapY(ha.x, -1); b = snapY(hb.x, 1); if (!(a < b)) b = Infinity; ha.x = show(a); hb.x = show(b); }
          const U = psFrom([[a, b]]);
          const T = psInter(U, Y), C = psInter(Y, psComp(T));
          const openR = psEq(T, psInt(T)), closedY = psEq(T, psInter(Y, psClos(T)));
          // rows
          for (const [yy, lab] of [[YU, 'ℝ'], [YY, 'Y'], [YT, 'U ∩ Y'], [YC, 'Y ∖ (U ∩ Y)']]) {
            s.line(LO + 0.05, yy, HI - 0.05, yy, { color: 'faint', width: 1 });
            s.text(lab, HI - 0.08, yy + 0.3, { size: 11.5, color: 'muted', weight: 700, align: 'right' });
          }
          for (let k = -1; k <= 4; k++) s.text(String(k).replace('-', '−'), k, YC - 0.42, { align: 'center', size: 10.5, color: 'muted' });
          for (let k = -1; k <= 4; k++) s.line(k, YC - 0.12, k, YC + 0.06, { color: 'faint', width: 1 });
          if (ord.value) drawPSet(s, psInter(U, psFrom([[-9, 9]])), YU, { color: 'orange', width: 6, lo: LO, hi: HI });
          else drawPSet(s, U, YU, { color: 'orange', width: 6, lo: LO, hi: HI });
          if (a === -Infinity) s.arrow(LO + 0.6, YU, LO + 0.05, YU, { color: 'orange', width: 2 });
          if (b === Infinity) s.arrow(HI - 0.6, YU, HI - 0.05, YU, { color: 'orange', width: 2 });
          drawPSet(s, Y, YY, { color: 'accent', width: 6, lo: LO, hi: HI });
          drawPSet(s, T, YT, { color: 'green', width: 6, lo: LO, hi: HI });
          drawPSet(s, C, YC, { color: 'purple', width: 6, lo: LO, hi: HI });
          s.corner(ord.value ? 'basic sets of the order topology of Y: intervals with ends in Y, and rays' : 'basic sets of the subspace topology: traces of open intervals', 'tl', { color: 'muted', weight: 600 });
          st = { D, T, C, openR, closedY, a, b };
        });
        v.legend([['orange', ord.value ? 'interval of $Y$' : 'open $U\\subset\\R$', { area: true }], ['accent', '$Y$', { area: true }], ['green', 'trace $U\\cap Y$', { area: true }], ['purple', 'complement in $Y$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { D, T, openR, closedY } = st;
          const f = (x) => String(+x.toFixed(2));
          const t = psTex(T, f);
          let r = `$U\\cap Y = ${t}$ is **open in $Y$**${openR ? ' and open in $\\R$' : ', but **not open in $\\R$**'}; it is ${closedY ? '**also closed in $Y$**' : 'not closed in $Y$'}.`;
          if (ord.value) {
            if (which.value === 'a') r += ' Here $Y$ is an interval, and its order topology equals the subspace topology.';
            if (which.value === 'b') r += ' In the order topology every interval containing $1$ reaches into $(2,3)$ (that part has no least element), so $[0,1]$ is **not open** there, although it is open in the subspace topology: **the topologies differ**.';
            if (which.value === 'c') r += ' In the order topology the basic sets about $2$ are $(a,2]$ with $a\\in Y$, which always contain points of $[0,1)$ near $1$: $\\{2\\}$ is **not open** there, although $\\{2\\}=Y\\cap(1.5,2.5)$ is open in the subspace topology.';
          } else if (which.value === 'b') r += ' Take $U=(-0.4,1.5)$: the trace $[0,1]$ is open and closed in $Y$.';
          else if (which.value === 'c') r += ' $\\{2\\}=Y\\cap(1.5,2.5)$ is open in $Y$; now switch on the order topology.';
          return r;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Interior, closure and boundary',
      statement: String.raw`Let $A$ be a subset of a topological space $X$.

- The **interior** $\operatorname{int}A$ is the union of all open sets contained in $A$ — the largest open subset of $A$.
- The **closure** $\overline A$ is the intersection of all closed sets containing $A$ — the smallest closed superset of $A$.
- The **boundary** is $\partial A=\overline A\setminus\operatorname{int}A=\overline A\cap\overline{X\setminus A}$.

Thus $\operatorname{int}A\subset A\subset\overline A$, with equality on the left iff $A$ is open and on the right iff $A$ is closed, and $X\setminus\overline A=\operatorname{int}(X\setminus A)$. A point $x$ lies in $\overline A$ iff every open set containing $x$ meets $A$ (it suffices to test basic open sets), and in $\operatorname{int}A$ iff some open set containing $x$ lies inside $A$.`,
      idea: String.raw`Unions of open sets are open and intersections of closed sets are closed, so the largest open subset and the smallest closed superset exist. Complementation swaps them: $X\setminus\overline A$ is the largest open set missing $A$. The neighbourhood description follows: $x\notin\overline A$ exactly when some open $U\ni x$ lies in $X\setminus A$, i.e. misses $A$. So all three operators are computed from the neighbourhoods of each point — change the topology and they change, even for the same set.`,
      caption: String.raw`Paint a set $A$ in the plane, made of open squares, edges and vertices of a grid (brush: closed squares, single cells, or erase). Blue is $\operatorname{int}A$, red is $\partial A$ — solid where it belongs to $A$, dashed or hollow where it does not. Each cell's neighbourhood is exact: in the Euclidean plane it is everything touching the cell, in the Sorgenfrey plane only the cells up and to the right, so the lower-left edges of a closed square become interior. In **finite space** click the points to choose $A$.`,
      deps: ['top-1.1'],
      see: ['pma-2.26'],
      refs: ['Munkres §17'],
      tags: ['closure', 'interior', 'boundary'],
      viz(v) {
        const W = 28, H = 13, NX = 2 * W + 1, NY = 2 * H + 1;
        const K = (X, Y) => Y * NX + X;
        const inG = (X, Y) => X >= 0 && Y >= 0 && X < NX && Y < NY;
        let A = new Uint8Array(NX * NY);
        const star = (X, Y, sorg) => {
          const out = [];
          const xs = sorg ? (X % 2 ? [X] : [X, X + 1]) : X % 2 ? [X] : [X - 1, X, X + 1];
          const ys = sorg ? (Y % 2 ? [Y] : [Y, Y + 1]) : Y % 2 ? [Y] : [Y - 1, Y, Y + 1];
          for (const a of xs) for (const b of ys) out.push([a, b]);
          return out;
        };
        const opInt = (S, sorg) => { const R = new Uint8Array(S.length); for (let Y = 0; Y < NY; Y++) for (let X = 0; X < NX; X++) R[K(X, Y)] = star(X, Y, sorg).every(([a, b]) => inG(a, b) && S[K(a, b)]) ? 1 : 0; return R; };
        const opCl = (S, sorg) => { const R = new Uint8Array(S.length); for (let Y = 0; Y < NY; Y++) for (let X = 0; X < NX; X++) R[K(X, Y)] = star(X, Y, sorg).some(([a, b]) => inG(a, b) && S[K(a, b)]) ? 1 : 0; return R; };
        const closedSq = (i, j, val = 1) => { for (let a = 2 * i; a <= 2 * i + 2; a++) for (let b = 2 * j; b <= 2 * j + 2; b++) A[K(a, b)] = val; };
        function preset() {
          A = new Uint8Array(NX * NY);
          // an open blob with part of its boundary added
          const C = new Uint8Array(NX * NY), sv = A; A = C;
          for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) if (Math.hypot(i + 0.5 - 5.5, j + 0.5 - 6.5) < 3.9) closedSq(i, j);
          A = sv;
          const blob = opInt(C, false);
          for (let k = 0; k < A.length; k++) if (blob[k]) A[k] = 1;
          for (let Y = 0; Y < NY; Y++) for (let X = 0; X < NX; X++) if (C[K(X, Y)] && !blob[K(X, Y)] && X <= 11 && Y <= 13) A[K(X, Y)] = 1;
          // a closed square
          for (let i = 12; i < 17; i++) for (let j = 3; j < 8; j++) closedSq(i, j);
          // a staircase of edges
          let X = 2 * 19, Y = 2 * 2;
          for (let k = 0; k < 6; k++) { for (let t = 0; t <= 2; t++) A[K(X + t, Y)] = 1; X += 2; for (let t = 0; t <= 2; t++) A[K(X, Y + t)] = 1; Y += 2; }
          // isolated vertices and an open square without its edges
          for (const [i, j] of [[20, 10], [22, 11], [24, 9]]) A[K(2 * i, 2 * j)] = 1;
          A[K(2 * 26 + 1, 2 * 3 + 1)] = 1;
        }
        preset();
        const presets = [
          { name: 'τ = {∅, {1}, {3}, {1,2}, {1,3}, {1,2,3}, X}', F: famOf([0, setOf([1]), setOf([3]), setOf([1, 2]), setOf([1, 3]), setOf([1, 2, 3]), 15]) },
          { name: 'nested: τ = {∅, {1}, {1,2}, {1,2,3}, X}', F: famOf([0, setOf([1]), setOf([1, 2]), setOf([1, 2, 3]), 15]) },
          { name: 'particular point: open sets are ∅ and the sets containing 1', F: famOf([0, ...Array.from({ length: 8 }, (_, k) => 1 | (k << 1))]) },
          { name: 'partition: τ = {∅, {1,2}, {3,4}, X}', F: famOf([0, setOf([1, 2]), setOf([3, 4]), 15]) },
        ];
        let pk = 0, Af = setOf([1, 4]);
        const topo = v.select('space', [{ value: 'E', label: 'Euclidean plane' }, { value: 'S', label: 'Sorgenfrey plane' }, { value: 'F', label: 'finite space' }], 'E');
        const brush = v.select('brush', [{ value: 'csq', label: 'closed squares' }, { value: 'cell', label: 'single cells' }, { value: 'erase', label: 'erase' }], 'csq');
        const view = v.select('show', [{ value: 'all', label: 'all' }, { value: 'A', label: '$A$' }, { value: 'int', label: '$\\operatorname{int}A$' }, { value: 'cl', label: '$\\overline A$' }, { value: 'bd', label: '$\\partial A$' }], 'all');
        const bReset = v.button('Reset example', () => preset());
        const bClear = v.button('Clear', () => { A = new Uint8Array(NX * NY); });
        const bNext = v.button('Next topology', () => { pk = (pk + 1) % presets.length; });
        const s = v.stage({ x: [-0.4, W + 0.4], y: [-0.45, H + 0.45], equal: true, axes: false, height: 400, full: true });
        const cellAt = (x, y) => {
          const fx = x - Math.round(x), fy = y - Math.round(y);
          let X, Y;
          if (Math.abs(fx) < 0.2 && Math.abs(fy) < 0.2) { X = 2 * Math.round(x); Y = 2 * Math.round(y); }
          else if (Math.abs(fy) < 0.16) { X = 2 * Math.floor(x) + 1; Y = 2 * Math.round(y); }
          else if (Math.abs(fx) < 0.16) { X = 2 * Math.round(x); Y = 2 * Math.floor(y) + 1; }
          else { X = 2 * Math.floor(x) + 1; Y = 2 * Math.floor(y) + 1; }
          return inG(X, Y) ? [X, Y] : null;
        };
        // finite-space layout: power set on the left, points on the right
        const fpos = powerPos(4, [0.8, 13.6], [0.9, 12.2]);
        const ptX = (i) => 17 + 2.6 * i, ROWS = [[10.6, 'A'], [7.9, 'int A'], [5.9, 'cl A'], [3.9, '∂A']];
        s.onDrag((x, y, phase) => {
          if (topo.value === 'F') {
            if (phase !== 'start') return;
            for (let i = 0; i < 4; i++) if (Math.hypot(x - ptX(i), y - ROWS[0][0]) < 0.9) Af ^= 1 << i;
            for (let m = 0; m < 16; m++) if (Math.abs(x - fpos[m][0]) < 0.9 && Math.abs(y - fpos[m][1]) < 0.45) Af = m;
            return;
          }
          const c = cellAt(x, y); if (!c) return;
          const [X, Y] = c;
          if (brush.value === 'csq') { if (X % 2 && Y % 2) closedSq((X - 1) / 2, (Y - 1) / 2); else A[K(X, Y)] = 1; }
          else A[K(X, Y)] = brush.value === 'erase' ? 0 : 1;
        });
        let st = null;
        v.render(() => {
          const T = topo.value, fin = T === 'F';
          brush.el.hidden = fin; view.el.hidden = fin; bReset.hidden = fin; bClear.hidden = fin; bNext.hidden = !fin;
          if (fin) {
            const F = presets[pk].F, I = intF(F, 4, Af), Cl = clF(F, 4, Af), Bd = Cl & ~I;
            for (let m = 0; m < 16; m++) for (let i = 0; i < 4; i++) if (!(m & (1 << i))) s.line(fpos[m][0], fpos[m][1], fpos[m | (1 << i)][0], fpos[m | (1 << i)][1], { color: 'faint', width: 1 });
            for (let m = 0; m < 16; m++) {
              const open = inF(F, m), closed = inF(F, 15 & ~m);
              const ring = m === Af ? 'ink' : m === I ? 'accent' : m === Cl ? 'orange' : null;
              s.text(setName(m, 4), fpos[m][0], fpos[m][1], { align: 'center', size: 11.5, weight: open ? 700 : 500, color: open ? 'accent' : closed ? 'green' : 'muted', plate: open || closed || !!ring });
              if (ring) s.rect(fpos[m][0] - 0.95, fpos[m][1] - 0.42, fpos[m][0] + 0.95, fpos[m][1] + 0.42, { color: ring, width: 2.4, radius: 7 });
            }
            if (I !== Af) s.arrow(fpos[I][0], fpos[I][1] + 0.45, fpos[Af][0], fpos[Af][1] - 0.48, { color: 'accent', width: 1.6, head: 7 });
            if (Cl !== Af) s.arrow(fpos[Af][0], fpos[Af][1] + 0.45, fpos[Cl][0], fpos[Cl][1] - 0.48, { color: 'orange', width: 1.6, head: 7 });
            s.text('subsets of X = {1,2,3,4}: open in blue, closed in green', 7.2, 13.05, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            const sets = [Af, I, Cl, Bd], cols = ['ink', 'accent', 'orange', 'red'];
            ROWS.forEach(([yy, lab], r) => {
              s.text(lab, 15.6, yy, { align: 'right', size: 13, weight: 700, color: cols[r] });
              for (let i = 0; i < 4; i++) {
                const isIn = (sets[r] >> i) & 1;
                s.dot(ptX(i), yy, { r: r === 0 ? 11 : 8, color: cols[r], hollow: !isIn, width: 2 });
                if (r === 0) s.text(String(i + 1), ptX(i), yy, { align: 'center', size: 12, weight: 700, color: isIn ? 'panel' : 'ink', halo: false });
              }
            });
            s.text('click a point (or a subset) to change A', 20.9, 12.2, { align: 'center', size: 11.5, color: 'muted' });
            s.text(presets[pk].name, 20.9, 1.8, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            st = { fin, F, I, Cl, Bd };
            return;
          }
          const sorg = T === 'S';
          const I = opInt(A, sorg), Cl = opCl(A, sorg), Ac = A.map((x) => 1 - x), ClC = opCl(Ac, sorg);
          // grid
          for (let i = 0; i <= W; i++) s.line(i, 0, i, H, { color: 'grid', width: 0.8 });
          for (let j = 0; j <= H; j++) s.line(0, j, W, j, { color: 'grid', width: 0.8 });
          const V = view.value;
          const show = (k) => (V === 'all' ? Cl[k] : V === 'A' ? A[k] : V === 'int' ? I[k] : V === 'cl' ? Cl[k] : Cl[k] && !I[k]);
          const colorOf = (k) => (V === 'A' ? 'ink' : V === 'cl' ? 'orange' : V === 'int' || (V === 'all' && I[k]) ? 'accent' : 'red');
          // squares, then edges, then vertices
          for (let pass = 2; pass >= 0; pass--) for (let Y = 0; Y < NY; Y++) for (let X = 0; X < NX; X++) {
            const dim = (X % 2) + (Y % 2); if (dim !== pass) continue;
            const k = K(X, Y); if (!show(k)) continue;
            const col = colorOf(k), member = A[k], ghost = (V === 'all' || V === 'bd' || V === 'cl') && !member;
            const x = X / 2, y = Y / 2;
            if (dim === 2) s.rect(x - 0.5, y - 0.5, x + 0.5, y + 0.5, { fill: col, fillAlpha: 0.32, stroke: false });
            else if (dim === 1) { const hz = X % 2 === 1; s.line(hz ? x - 0.5 : x, hz ? y : y - 0.5, hz ? x + 0.5 : x, hz ? y : y + 0.5, { color: col, width: ghost ? 2.2 : 3.6, dash: ghost ? [3, 3] : null }); }
            else s.dot(x, y, { r: ghost ? 3.2 : 3.6, color: col, hollow: ghost, width: 1.6 });
          }
          let nA = 0, nI = 0, nC = 0, nB = 0, okId = true, subset = true;
          for (let k = 0; k < A.length; k++) { nA += A[k]; nI += I[k]; nC += Cl[k]; nB += Cl[k] && !I[k] ? 1 : 0; if ((Cl[k] && !I[k] ? 1 : 0) !== (Cl[k] && ClC[k] ? 1 : 0)) okId = false; if (I[k] > A[k] || A[k] > Cl[k]) subset = false; }
          const II = opInt(I, sorg); let idem = true; for (let k = 0; k < A.length; k++) if (II[k] !== I[k]) idem = false;
          s.corner(sorg ? 'Sorgenfrey: neighbourhoods [x, x+ε) × [y, y+ε)' : 'Euclidean: neighbourhoods are small discs', 'tr', { color: 'muted', weight: 600, plate: true });
          st = { fin, nA, nI, nC, nB, okId, subset, idem, sorg };
        });
        v.legend([['accent', 'interior', { area: true }], ['red', 'boundary, in $A$'], ['red', 'boundary, not in $A$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.fin) {
            const { I, Cl, Bd } = st;
            return `$A=${setTex(Af, 4)}$: $\\operatorname{int}A=${setTex(I, 4)}$ (the largest open set inside $A$), $\\overline A=${setTex(Cl, 4)}$ (the smallest closed set containing $A$), $\\partial A=${setTex(Bd, 4)}$. ${Af === I ? '$A$ is open. ' : ''}${Af === Cl ? '$A$ is closed. ' : ''}`;
          }
          const { nA, nI, nC, nB, okId, subset, idem, sorg } = st;
          return `Cells: $|A|=${nA}$, $|\\operatorname{int}A|=${nI}$, $|\\overline A|=${nC}$, $|\\partial A|=${nB}$. Checks: $\\operatorname{int}A\\subset A\\subset\\overline A$ ${subset ? '✓' : '✗'}, $\\partial A=\\overline A\\cap\\overline{X\\setminus A}$ ${okId ? '✓' : '✗'}, $\\operatorname{int}\\operatorname{int}A=\\operatorname{int}A$ ${idem ? '✓' : '✗'}.` + (sorg ? ' In the Sorgenfrey plane the left and bottom edges of the closed square are interior, and the open blob gains interior along its lower-left boundary.' : ' Open squares are open, so they are never boundary; edges and vertices on the rim are.');
        });
      },
    },
  ],
};
