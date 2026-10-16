// Abstract Algebra (Judson) — Chapter 3: Groups, part 3
// Subgroups, ℤ₄ versus the Klein four-group, the subgroup test and the one-step subgroup test (3.23a–3.31).
// Parts 1–2: ch03.js, ch03-b.js. Shared group machinery: ch03.shared.js.
import { elColor, cyclic, units, klein, dihedral, quaternion, orderOf, generated, allSubgroups, covers, subgroupTest, latticeLayout, roster } from './ch03.shared.js';

const lab = (s) => (/^\d+$/.test(s) ? s : `$${s}$`);
const GROUPS = () => ({ Z12: cyclic(12), D4: dihedral(4), Q8: quaternion(), U15: units(15) });
const GOPTS = [{ value: 'Z12', label: '$\\mathbb Z_{12}$' }, { value: 'D4', label: '$D_4$' }, { value: 'Q8', label: '$Q_8$' }, { value: 'U15', label: '$U(15)$' }];
/** Row of clickable element chips; members of sel are filled. */
function chips(v, s, getG) {
  const pos = (G) => { const n = G.n, w = Math.min(0.1, 0.94 / n); return Array.from({ length: n }, (_, i) => [0.5 + (i - (n - 1) / 2) * w, 0.5]); };
  return {
    draw(sel, ring = () => null) {
      const G = getG();
      pos(G).forEach(([x, y], i) => {
        const on = sel.has(i), r = ring(i);
        s.dot(x, y, { r: 15, color: on ? elColor(v, i, G.n) : 'muted', hollow: !on, alpha: on ? 0.9 : 0.55 });
        if (r) { const c = s.ctx; c.save(); c.beginPath(); c.arc(s.X(x), s.Y(y), 20, 0, 2 * Math.PI); c.strokeStyle = v.color(r); c.lineWidth = 2.4; c.setLineDash([4, 3]); c.stroke(); c.restore(); }
        if (/^\d+$/.test(G.L[i])) s.text(G.L[i], x, y, { align: 'center', size: 12.5, weight: 700, color: on ? 'panel' : 'ink', halo: false });
        else s.tex(G.L[i], x, y, { size: 13.5, color: on ? 'panel' : 'ink' });
      });
    },
    hit(x, y) { const G = getG(), P = pos(G); for (let i = 0; i < G.n; i++) if (Math.hypot(s.X(P[i][0]) - s.X(x), s.Y(P[i][1]) - s.Y(y)) < 18) return i; return -1; },
  };
}
/** Subgroup lattice of G on a graph kit object (nodes = subgroups, positioned by order). */
function setLattice(Gr, G, subs) {
  const pos = latticeLayout(subs, [0.08, 0.92], [0.1, 0.9]);
  Gr.nodes = subs.map((H, i) => ({ id: i, x: pos[i][0], y: pos[i][1], label: H.length === 1 ? '{e}' : H.length === G.n ? 'G' : `order ${H.length}` }));
  Gr.edges = covers(subs).map(([a, b]) => ({ from: a, to: b }));
}
const sameSet = (A, B) => A.length === B.length && A.every((x) => B.includes(x));

export default {
  collection: 'alg',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.23a
    {
      num: '3.23a',
      kind: 'Definition',
      name: 'Subgroup',
      statement: String.raw`A **subgroup** of a group $G$ is a subset $H\subset G$ that is itself a group under the operation of $G$ restricted to $H$. Every group with at least two elements has the **trivial subgroup** $\{e\}$ and $G$ itself; a subgroup $H\ne G$ is **proper**. The operation must be inherited: $GL_2(\mathbb R)$ is a group and a subset of $(\mathbb M_2(\mathbb R),+)$, but not a subgroup of it.`,
      idea: String.raw`Restricting the operation to $H$ makes sense only if products of elements of $H$ stay in $H$ (closure); associativity is then inherited for free, and what remains is that $H$ contain an identity and inverses — which, by uniqueness, must be those of $G$. The subgroups of a finite group are organised in a **lattice**, ordered by inclusion, and comparing lattices is a first way to tell groups apart.`,
      caption: String.raw`Click elements to choose a subset $H$. The middle panel is the Cayley table restricted to $H\times H$: products that escape $H$ are red, and the table turns green only when $H$ is a subgroup. The lattice on the right shows every subgroup of $G$ (labelled by order); your $H$ lights up gold when it is one, and otherwise the smallest subgroup containing it is ringed orange. Click a node to select that subgroup.`,
      deps: ['alg-3.7a'],
      refs: ['Judson §3.3'],
      tags: ['groups', 'subgroups'],
      viz(v) {
        const GR = GROUPS();
        let H = new Set([0, 4, 8]);
        const which = v.select('group', GOPTS, 'Z12', { onChange: (k) => { H = new Set(k === 'Z12' ? [0, 4, 8] : k === 'D4' ? [0, 2, 4] : k === 'Q8' ? [0, 2] : [0, 3]); } });
        const c = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 64, full: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1 });
        const g = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1, title: 'all subgroups of $G$' });
        const CH = chips(v, c, () => GR[which.value]);
        c.onClick((x, y) => { const i = CH.hit(x, y); if (i >= 0) { if (H.has(i)) H.delete(i); else H.add(i); } });
        const T = v.table(s, { rows: 3, cols: 3, maxCell: 44, size: 14 });
        const Gr = v.graph(g, { nodes: [], edges: [], layout: 'none', draggable: false, r: 12, fontSize: 12, shape: 'box' });
        Gr.onClick = ({ node }) => { if (node) { const G = GR[which.value]; H = new Set(allSubgroups(G)[+node.id]); } return true; };
        v.render(() => {
          const G = GR[which.value], arr = [...H].sort((a, b) => a - b), t = subgroupTest(G, H), subs = allSubgroups(G), gen = generated(G, arr);
          CH.draw(H, (i) => (!t.ok && gen.includes(i) && !H.has(i) ? 'orange' : null));
          if (arr.length) T.draw({ rows: arr.length, cols: arr.length, rowLabels: (i) => lab(G.L[arr[i]]), colLabels: (j) => lab(G.L[arr[j]]), cornerLabel: `$${G.sym}$`,
            value: (i, j) => lab(G.L[G.T[arr[i]][arr[j]]]), fill: (i, j) => (H.has(G.T[arr[i]][arr[j]]) ? [t.ok ? 'green' : elColor(v, G.T[arr[i]][arr[j]], G.n), t.ok ? 0.3 : 0.18] : ['red', 0.45]) });
          else s.text('H is empty', 0.5, 0.5, { align: 'center', size: 14, color: 'red' });
          s.setTitle(t.ok ? `$H$ is a subgroup of order ${arr.length}` : 'restricted table $H\\times H$');
          setLattice(Gr, G, subs);
          const hit = subs.findIndex((K) => sameSet(K, arr)), ring = subs.findIndex((K) => sameSet(K, gen));
          Gr.draw({ nodeFill: (id) => (+id === hit ? 'gold' : null), nodeRing: (id) => (hit < 0 && +id === ring ? 'orange' : null), edgeColor: () => 'muted' });
        });
        v.readout(() => {
          const G = GR[which.value], t = subgroupTest(G, H), L = G.L, arr = t.arr, subs = allSubgroups(G);
          if (!arr.length) return 'The empty set is not a subgroup — it contains no identity.';
          if (t.ok) return String.raw`$H = ${roster(G, H)}$ **is a subgroup** of $${G.tex}$ (order ${arr.length}${G.n % arr.length === 0 ? `, dividing $|G| = ${G.n}$` : ''}). $${G.tex}$ has ${subs.length} subgroups in all.`;
          const why = [];
          if (t.close) why.push(String.raw`$${L[t.close[0]]}${G.add ? '+' : ''}${L[t.close[1]]} = ${L[G.T[t.close[0]][t.close[1]]]}\notin H$`);
          if (!t.hasE) why.push(`the identity $${L[G.e]}$ is missing`);
          if (t.inv != null) why.push(`$${L[t.inv]}^{-1} = ${L[G.inv[t.inv]]}\\notin H$`);
          return String.raw`$H = ${roster(G, H)}$ is **not a subgroup**: ${why.join('; ')}. The smallest subgroup containing it is $${roster(G, generated(G, arr))}$ (ringed).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.28
    {
      num: '3.28',
      kind: 'Concept',
      name: 'The Klein four-group versus ℤ₄',
      statement: String.raw`$\mathbb Z_4$ and the **Klein four-group** $\mathbb Z_2\times\mathbb Z_2$ (pairs added coordinatewise mod 2) are both abelian groups of order 4, but they are different groups: apart from $\{e\}$ and itself, $\mathbb Z_4$ has a single subgroup, $\{0,2\}$, while $\mathbb Z_2\times\mathbb Z_2$ has three, $\{(0,0),(0,1)\}$, $\{(0,0),(1,0)\}$ and $\{(0,0),(1,1)\}$.`,
      idea: String.raw`Every element of $\mathbb Z_2\times\mathbb Z_2$ added to itself gives $(0,0)$, so each non-identity element generates a subgroup of order 2 — three of them. In $\mathbb Z_4$ the element $1$ (and $3$) runs through all four elements before returning to $0$, and only $2$ generates a proper nontrivial subgroup. Since a relabelling of elements would carry subgroups to subgroups, no relabelling can turn one table into the other: the subgroup lattices — a chain versus a diamond — are invariants.`,
      caption: String.raw`Click a header element in either table to see the subgroup $\langle a\rangle=\{e,a,a^2,\ldots\}$ it generates: its rows and columns light up and its node in the lattice below turns gold. In $\mathbb Z_4$ the lattice is a chain and $1$ generates everything; in $\mathbb Z_2\times\mathbb Z_2$ it is a diamond and no single element generates the group.`,
      deps: ['alg-3.23a'],
      refs: ['Judson §3.3'],
      tags: ['groups', 'subgroups'],
      credit: 'Felix Klein (Vierergruppe), 1884',
      viz(v) {
        const Z4 = cyclic(4), V = klein(), sel = [1, 1];
        const st = [v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, title: '$\\mathbb Z_4$', minWidth: 340 }), v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, title: '$\\mathbb Z_2\\times\\mathbb Z_2$', minWidth: 340 })];
        const lt = [v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, minWidth: 340 }), v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, minWidth: 340 })];
        const GS = [Z4, V], Ts = st.map((s) => v.table(s, { rows: 4, cols: 4, maxCell: 50, size: 13 })), Grs = lt.map((s) => v.graph(s, { nodes: [], edges: [], layout: 'none', draggable: false, r: 16, fontSize: 12, shape: 'box' }));
        st.forEach((s, k) => s.onClick((x, y) => { const c = Ts[k].hit(x, y); if (c) sel[k] = c.j === -1 ? c.i : c.i === -1 ? c.j : sel[k]; }));
        v.render(() => {
          GS.forEach((G, k) => {
            const a = sel[k], H = generated(G, [a]), subs = allSubgroups(G);
            Ts[k].draw({ rows: 4, cols: 4, rowLabels: (i) => lab(G.L[i]), colLabels: (j) => lab(G.L[j]), cornerLabel: '+', value: (i, j) => lab(G.L[G.T[i][j]]),
              fill: (i, j) => (H.includes(i) && H.includes(j) ? ['gold', 0.4] : [elColor(v, G.T[i][j], 4), 0.14]), rowLabelColor: (i) => (i === a ? 'gold' : null), colLabelColor: (j) => (j === a ? 'gold' : null) });
            const pos = latticeLayout(subs, [0.1, 0.9], [0.14, 0.86]);
            Grs[k].nodes = subs.map((K, i) => ({ id: i, x: pos[i][0], y: pos[i][1], label: K.map((x) => G.L[x]).join(', ') }));
            Grs[k].edges = covers(subs).map(([p, q]) => ({ from: p, to: q }));
            const hit = subs.findIndex((K) => sameSet(K, H));
            Grs[k].draw({ nodeFill: (id) => (+id === hit ? 'gold' : null), edgeColor: () => 'muted' });
          });
        });
        v.readout(() => {
          const ord = (G) => G.L.map((l, i) => `$${l}$:${orderOf(G, i)}`).join(', ');
          return String.raw`$\langle ${Z4.L[sel[0]]}\rangle = ${roster(Z4, generated(Z4, [sel[0]]))}$ in $\mathbb Z_4$; $\langle ${V.L[sel[1]]}\rangle = ${roster(V, generated(V, [sel[1]]))}$ in $\mathbb Z_2\times\mathbb Z_2$. Orders of elements — $\mathbb Z_4$: ${ord(Z4)}; Klein: ${ord(V)}. $\mathbb Z_4$ has ${allSubgroups(Z4).length} subgroups, the Klein group ${allSubgroups(V).length}: **not the same group**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.30
    {
      num: '3.30',
      kind: 'Proposition',
      name: 'Subgroup test',
      statement: String.raw`A subset $H$ of a group $G$ is a subgroup if and only if
(1) the identity $e$ of $G$ is in $H$;
(2) $h_1,h_2\in H$ implies $h_1h_2\in H$;
(3) $h\in H$ implies $h^{-1}\in H$.`,
      idea: String.raw`If $H$ is a subgroup, its own identity $e_H$ satisfies $e_He_H=e_H=ee_H$, so $e_H=e$ by cancellation; (2) is closure, and the inverse of $h$ in $H$ is its inverse in $G$ by uniqueness. Conversely, (1)–(3) together with associativity inherited from $G$ are exactly the group axioms for $H$. None of the three conditions can be dropped in general: in $\mathbb Z$, the set $\{0,1,2,\ldots\}$ satisfies (1) and (2) but not (3). (In a *finite* group, a nonempty subset closed under products is automatically a subgroup.)`,
      caption: String.raw`Click row or column headers of the table to put elements into $H$ or take them out (rows and columns of $H$ are shaded). The three conditions are checked live, and a failure is pinned to its witness: a red cell is a product leaving $H$, an orange cell pairs $h$ with an inverse outside $H$. Switch to $\mathbb Z$ for infinite candidates on the number line, where condition (3) can fail on its own.`,
      deps: ['alg-3.23a', 'alg-3.17'],
      refs: ['Judson §3.3'],
      tags: ['groups', 'subgroups'],
      viz(v) {
        const GR = { Z12: cyclic(12), D3: dihedral(3) };
        let H = new Set([0, 3, 6, 9]);
        const which = v.select('group', [{ value: 'Z12', label: '$\\mathbb Z_{12}$' }, { value: 'D3', label: '$S_3 = D_3$' }, { value: 'Z', label: '$\\mathbb Z$' }], 'Z12', { onChange: (k) => { H = new Set(k === 'D3' ? [0, 1, 3] : [0, 3, 6, 9]); pre.el.hidden = k !== 'Z'; } });
        const ZS = { m3: { tex: '3\\mathbb Z', f: (x) => x % 3 === 0 }, nat: { tex: '\\{0, 1, 2, \\ldots\\}', f: (x) => x >= 0 }, small: { tex: '\\{-1, 0, 1\\}', f: (x) => Math.abs(x) <= 1 }, odd: { tex: '\\text{odd integers}', f: (x) => Math.abs(x % 2) === 1 }, u23: { tex: '2\\mathbb Z\\cup 3\\mathbb Z', f: (x) => x % 2 === 0 || x % 3 === 0 } };
        const pre = v.select('subset of $\\mathbb Z$', [{ value: 'm3', label: '$3\\mathbb Z$' }, { value: 'nat', label: '$\\{0,1,2,\\ldots\\}$' }, { value: 'small', label: '$\\{-1,0,1\\}$' }, { value: 'odd', label: 'odd' }, { value: 'u23', label: '$2\\mathbb Z\\cup3\\mathbb Z$' }], 'nat');
        pre.el.hidden = true;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, full: true });
        const T = v.table(s, { rows: 6, cols: 6, maxCell: 40, size: 13, region: [0, 0, 0.72, 1] });
        s.onClick((x, y) => { if (which.value === 'Z') return; const c = T.hit(x, y); if (!c) return; const k = c.j === -1 ? c.i : c.i === -1 ? c.j : null; if (k == null) return; if (H.has(k)) H.delete(k); else H.add(k); });
        const zTest = () => {
          const f = ZS[pre.value].f, R = 30; let close = null, inv = null;
          for (let a = -R; a <= R && !close; a++) if (f(a)) for (let b = -R; b <= R; b++) if (f(b) && !f(a + b)) { if (!close || Math.abs(a) + Math.abs(b) < Math.abs(close[0]) + Math.abs(close[1])) close = [a, b]; }
          for (let a = 0; a <= R && inv == null; a++) for (const x of [a, -a]) if (f(x) && !f(-x)) { inv = x; break; }
          return { hasE: f(0), close, inv };
        };
        const badge = (ok, txt, k) => s.text(`${ok ? '✓' : '✗'} ${txt}`, 0.75, 0.82 - k * 0.12, { size: 13.5, weight: 700, color: ok ? 'green' : 'red' });
        v.render(() => {
          if (which.value === 'Z') {
            const f = ZS[pre.value].f, t = zTest(), X = (x) => 0.04 + ((x + 12) / 24) * 0.66, y0 = 0.45;
            s.line(0.02, y0, 0.72, y0, { color: 'muted', width: 1.2 });
            for (let x = -12; x <= 12; x++) { s.dot(X(x), y0, { r: f(x) ? 7 : 3, color: f(x) ? 'accent' : 'muted', hollow: !f(x) }); if (x % 3 === 0 || Math.abs(x) <= 2) s.text(String(x).replace('-', '−'), X(x), y0, { dy: 18, align: 'center', size: 11, color: 'muted' }); }
            s.text('…', 0.005, y0, { size: 18, color: 'muted' });
            if (t.close) { const [a, b] = t.close, c2 = a + b; if (Math.abs(c2) <= 12) { s.arrow(X(a), y0 + 0.06, X(c2), y0 + 0.06, { color: 'red', width: 2 }); s.text(`${a} + ${b} = ${c2} ∉ H`, X(c2), y0 + 0.13, { align: 'center', size: 12.5, color: 'red', weight: 700 }); } }
            if (t.inv != null && Math.abs(t.inv) <= 12) { s.arrow(X(t.inv), y0 - 0.08, X(-t.inv), y0 - 0.08, { color: 'orange', width: 2 }); s.text(`−(${t.inv}) = ${-t.inv} ∉ H`, X(-t.inv), y0 - 0.16, { align: 'center', size: 12.5, color: 'orange', weight: 700 }); }
            badge(t.hasE, '(1) contains 0', 0); badge(!t.close, '(2) closed under +', 1); badge(t.inv == null, '(3) closed under −', 2);
            return;
          }
          const G = GR[which.value], n = G.n, t = subgroupTest(G, H), hl = [];
          if (t.close) hl.push([t.close[0], t.close[1], 'red']);
          if (t.inv != null) hl.push([t.inv, G.inv[t.inv], 'orange']);
          if (!t.hasE) hl.push([G.e, G.e, 'red']);
          T.draw({ rows: n, cols: n, rowLabels: (i) => lab(G.L[i]), colLabels: (j) => lab(G.L[j]), cornerLabel: `$${G.sym}$`, value: (i, j) => lab(G.L[G.T[i][j]]),
            fill: (i, j) => (H.has(i) && H.has(j) ? (H.has(G.T[i][j]) ? ['accent', 0.3] : ['red', 0.4]) : H.has(i) || H.has(j) ? ['accent', 0.07] : null),
            rowLabelColor: (i) => (H.has(i) ? 'accent' : 'faint'), colLabelColor: (j) => (H.has(j) ? 'accent' : 'faint'), highlight: hl });
          badge(t.hasE, '(1) contains e', 0); badge(!t.close, '(2) closed under products', 1); badge(t.inv == null, '(3) closed under inverses', 2);
          s.text(t.ok ? 'a subgroup' : 'not a subgroup', 0.75, 0.38, { size: 15, weight: 800, color: t.ok ? 'green' : 'red' });
        });
        v.readout(() => {
          if (which.value === 'Z') {
            const t = zTest(), z = ZS[pre.value], ok = t.hasE && !t.close && t.inv == null, bits = [];
            if (!t.hasE) bits.push('$0\\notin H$');
            if (t.close) bits.push(`$${t.close[0]} + ${t.close[1] < 0 ? `(${t.close[1]})` : t.close[1]} = ${t.close[0] + t.close[1]}\\notin H$`);
            if (t.inv != null) bits.push(`$-(${t.inv}) = ${-t.inv}\\notin H$`);
            return ok ? `$H = ${z.tex}$ passes all three conditions: a subgroup of $\\mathbb Z$.` : `$H = ${z.tex}$ fails: ${bits.join('; ')}.${pre.value === 'nat' ? ' It satisfies (1) and (2), so condition (3) is genuinely needed.' : ''}`;
          }
          const G = GR[which.value], t = subgroupTest(G, H), L = G.L, bits = [];
          if (!t.arr.length) return 'The empty set fails condition (1).';
          if (!t.hasE) bits.push(`$${L[G.e]}\\notin H$`);
          if (t.close) bits.push(`$${G.add ? `${L[t.close[0]]} + ${L[t.close[1]]}` : `${L[t.close[0]]}${L[t.close[1]]}`} = ${L[G.T[t.close[0]][t.close[1]]]}\\notin H$`);
          if (t.inv != null) bits.push(`$${L[t.inv]}^{-1} = ${L[G.inv[t.inv]]}\\notin H$`);
          return t.ok ? `$H = ${roster(G, H)}$ satisfies (1), (2) and (3): **a subgroup** of order ${t.arr.length}.` : `$H = ${roster(G, H)}$ is **not a subgroup**: ${bits.join('; ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.31
    {
      num: '3.31',
      kind: 'Proposition',
      name: 'One-step subgroup test: gh⁻¹ ∈ H',
      statement: String.raw`A subset $H$ of a group $G$ is a subgroup if and only if $H\ne\varnothing$ and $gh^{-1}\in H$ whenever $g,h\in H$.`,
      idea: String.raw`A subgroup clearly passes. Conversely, take any $g\in H$: then $gg^{-1}=e\in H$; next $eh^{-1}=h^{-1}\in H$ for every $h\in H$; finally $h_1h_2=h_1(h_2^{-1})^{-1}\in H$. So the single condition delivers the identity (the diagonal of the $gh^{-1}$ table), inverses (the row of $e$) and closure, and the three-condition test applies. Nonemptiness is essential — the empty set passes the condition vacuously.`,
      caption: String.raw`Click elements to choose $H$. The table lists $gh^{-1}$ for $g$ (row) and $h$ (column) in $H$; any entry outside $H$ is red, and $H$ is a subgroup exactly when no cell escapes. The green diagonal is where $gg^{-1}=e$ appears, and the teal row (when $e\in H$) lists the inverses $h^{-1}$ — the two facts the proof extracts first.`,
      deps: ['alg-3.30'],
      refs: ['Judson §3.3'],
      tags: ['groups', 'subgroups'],
      viz(v) {
        const GR = GROUPS();
        let H = new Set([0, 3, 6, 9, 2]);
        const which = v.select('group', GOPTS, 'Z12', { onChange: (k) => { H = new Set(k === 'Z12' ? [0, 3, 6, 9, 2] : k === 'D4' ? [0, 1, 2, 3] : k === 'Q8' ? [0, 1, 2, 3] : [0, 1, 3]); } });
        const c = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 64, full: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, full: true, title: 'the table of $gh^{-1}$ ($g$ = row, $h$ = column)' });
        const CH = chips(v, c, () => GR[which.value]);
        c.onClick((x, y) => { const i = CH.hit(x, y); if (i >= 0) { if (H.has(i)) H.delete(i); else H.add(i); } });
        const T = v.table(s, { rows: 4, cols: 4, maxCell: 44, size: 13 });
        v.render(() => {
          const G = GR[which.value], arr = [...H].sort((a, b) => a - b), q = (g, h) => G.T[g][G.inv[h]];
          CH.draw(H);
          if (!arr.length) { s.text('H = ∅ passes the condition vacuously — which is why H ≠ ∅ is required', 0.5, 0.5, { align: 'center', size: 13.5, color: 'red' }); return; }
          const ei = arr.indexOf(G.e), hl = [];
          arr.forEach((_, i) => hl.push([i, i, 'green']));
          if (ei >= 0) arr.forEach((_, j) => { if (j !== ei) hl.push([ei, j, 'teal']); });
          T.draw({ rows: arr.length, cols: arr.length, rowLabels: (i) => lab(G.L[arr[i]]), colLabels: (j) => `$${G.L[arr[j]]}^{-1}$`, cornerLabel: '',
            value: (i, j) => lab(G.L[q(arr[i], arr[j])]), fill: (i, j) => (H.has(q(arr[i], arr[j])) ? [elColor(v, q(arr[i], arr[j]), G.n), 0.22] : ['red', 0.45]), highlight: hl });
        });
        v.readout(() => {
          const G = GR[which.value], arr = [...H].sort((a, b) => a - b), q = (g, h) => G.T[g][G.inv[h]], L = G.L;
          if (!arr.length) return 'With $H = \\varnothing$ there is nothing to test, so the condition holds vacuously — but $\\varnothing$ is not a subgroup. Hence the hypothesis $H \\ne \\varnothing$.';
          let bad = null; for (const g of arr) { for (const h of arr) if (!H.has(q(g, h))) { bad = [g, h]; break; } if (bad) break; }
          const t = subgroupTest(G, H);
          if (!bad) return String.raw`All ${arr.length ** 2} products $gh^{-1}$ stay in $H = ${roster(G, H)}$, so $H$ **is a subgroup** — in agreement with the three-condition test ${t.ok ? '✓' : '✗'}.`;
          return String.raw`$${L[bad[0]]}\,(${L[bad[1]]})^{-1} = ${L[q(bad[0], bad[1])]}\notin H$: **not a subgroup** (the three-condition test agrees: ${t.ok ? 'passes?!' : 'it fails too'}).`;
        });
      },
    },
  ],
};
