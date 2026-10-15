// Topology — Chapter 1: Topological spaces (items 1.1–1.8; 1.9–1.16 are in ch01-b.js)
import { pc, inF, members, famOf, setOf, setName, setTex, checkTop, generate, allTops, isT0, classesOf, countPreorders, intF, clF, coversAmong, powerPos, powerSpec, glyph } from './ch01.shared.js';

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
          onChange: (f) => { if (f === 'cdisc') { const d = Math.hypot(c2.x - c1.x, c2.y - c1.y) || 1; X.set(c1.x + ((c2.x - c1.x) * R1) / d, c1.y + ((c2.y - c1.y) * R1) / d); } },
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
  ],
};
