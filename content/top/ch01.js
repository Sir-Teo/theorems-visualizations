// Topology — Chapter 1: Topological spaces (items 1.1–1.8; 1.9–1.16 are in ch01-b.js)
import { pc, inF, members, famOf, setOf, setName, setTex, checkTop, generate, allTops, isT0, classesOf, countPreorders, intF, clF, coversAmong, powerPos, powerSpec, glyph } from './ch01.shared.js';

const FULL = (n) => (1 << n) - 1;
const listTex = (F, n) => members(F, n).map((m) => setTex(m, n)).join(',\\,');

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
  ],
};
