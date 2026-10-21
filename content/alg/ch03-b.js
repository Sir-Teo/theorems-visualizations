// Abstract Algebra (Judson) — Chapter 3: Groups, part 2
// Order of a group, uniqueness of identity and inverses, (ab)⁻¹ = b⁻¹a⁻¹, (a⁻¹)⁻¹ = a, solving ax = b, cancellation,
// laws of exponents, subgroups, ℤ₄ versus the Klein four-group, and the two subgroup tests (3.16a–3.31).
// Part 1: ch03.js. Shared group machinery: ch03.shared.js.
import { EC, elColor, gcd, cyclic, units, klein, dihedral, quaternion, finish, mm, partial, axisOf, drawFigure, assocFail, latinFails, orderOf, power, generated, allSubgroups, covers, subgroupTest, latticeLayout, roster, prodTex, MENU, drawCayley } from './ch03.shared.js';

const lab = (s) => (/^\d+$/.test(s) ? s : `$${s}$`);
/** A row of clickable element chips across a stage; returns {draw(sel, style), hit(x, y)}. */
function chips(v, s, getG, y = 0.5) {
  const pos = (G) => { const n = G.n, w = Math.min(0.11, 0.92 / n); return Array.from({ length: n }, (_, i) => [0.5 + (i - (n - 1) / 2) * w, y]); };
  return {
    draw(sel, st = () => ({})) {
      const G = getG(), P = pos(G);
      P.forEach(([x, yy], i) => {
        const on = sel.has(i), o = st(i) || {};
        s.dot(x, yy, { r: 15, color: on ? elColor(v, i, G.n) : 'muted', hollow: !on, alpha: on ? 1 : 0.6 });
        if (o.ring) { const c = s.ctx; c.save(); c.beginPath(); c.arc(s.X(x), s.Y(yy), 20, 0, 2 * Math.PI); c.strokeStyle = v.color(o.ring); c.lineWidth = 2.4; c.stroke(); c.restore(); }
        s.tex(G.L[i], x, yy, { size: 13.5, color: on ? 'panel' : 'ink' });
      });
    },
    hit(x, yy) { const G = getG(), P = pos(G); for (let i = 0; i < G.n; i++) if (Math.hypot(s.X(P[i][0]) - s.X(x), s.Y(P[i][1]) - s.Y(yy)) < 18) return i; return -1; },
  };
}
/** Draw a subgroup lattice with the graph kit (nodes positioned by order). */
function lattice(v, Gr, G, subs, focus) {
  const pos = latticeLayout(subs, [0.1, 0.9], [0.12, 0.88]);
  Gr.nodes = subs.map((H, i) => ({ id: i, x: pos[i][0], y: pos[i][1], label: H.length === 1 ? '$\\{e\\}$' : H.length === G.n ? `$${G.tex}$` : `$${H.length}$` }));
  Gr.edges = covers(subs).map(([a, b]) => ({ from: a, to: b }));
}

export default {
  collection: 'alg',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.16a
    {
      num: '3.16a',
      kind: 'Definition',
      name: 'Order of a group',
      statement: String.raw`A group is **finite** (has finite order) if it has finitely many elements, and **infinite** otherwise. The **order** of a finite group $G$ is its number of elements, written $|G|$; for an infinite group one writes $|G|=\infty$. For example $|\mathbb Z_n|=n$, $|U(n)|=\varphi(n)$, $|S_3|=6$, $|Q_8|=8$ and $|\mathbb Z|=\infty$.`,
      idea: String.raw`Order is the crudest invariant of a group, but already a strong one: later (Lagrange's theorem) the order of every subgroup and of every element will have to divide $|G|$. Groups of the same order can still be very different — $\mathbb Z_6$ and $S_3$ both have six elements, one abelian and one not; $\mathbb Z_4$ and $U(8)$ both have four, one cyclic and one not.`,
      caption: String.raw`Pick a group to lay out its elements on the shelf — $\mathbb Z_n$ and $U(n)$ follow the slider $n$; $\mathbb Z$ never ends. The chart compares $|\mathbb Z_n|=n$ (grey) with $|U(n)|=\varphi(n)$ (bars) for $n\le 40$: the bars reach $n-1$ exactly at the primes.`,
      deps: ['alg-3.7a'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'order'],
      viz(v) {
        const which = v.select('group', [{ value: 'Zn', label: '$\\mathbb Z_n$' }, { value: 'Un', label: '$U(n)$' }, { value: 'D3', label: '$S_3$' }, { value: 'Q8', label: '$Q_8$' }, { value: 'D4', label: '$D_4$' }, { value: 'Z', label: '$\\mathbb Z$' }], 'Un');
        const N = v.slider('$n$', 2, 40, 15, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 3.2], axes: false, height: 150, full: true });
        const b = v.stage({ x: [1.5, 40.5], y: [0, 42], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'n', ylabel: 'order' });
        const G = () => (which.value === 'Zn' ? cyclic(N.value) : which.value === 'Un' ? units(N.value) : which.value === 'D3' ? dihedral(3) : which.value === 'Q8' ? quaternion() : which.value === 'D4' ? dihedral(4) : null);
        v.animate((tt) => {
          const g = G();
          if (!g) {
            const off = (tt * 1.2) % 1;
            for (let k = -8; k <= 9; k++) { const x = 5 + (k - off) * 0.62; if (x < 0.3 || x > 9.7) continue; s.dot(x, 1.7, { r: 13, color: elColor(v, ((k % 8) + 8) % 8, 8) }); s.text(String(k + Math.floor(tt * 1.2)).replace('-', '−'), x, 1.7, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false }); }
            s.text('…', 0.2, 1.7, { size: 22, color: 'muted' }); s.text('…', 9.6, 1.7, { size: 22, color: 'muted' });
            s.text('|ℤ| = ∞ : the shelf never ends', 5, 0.55, { align: 'center', size: 14, weight: 700 });
          } else {
            const n = g.n, per = Math.min(n, 20), rows = Math.ceil(n / per), w = Math.min(0.62, 9.4 / per);
            for (let i = 0; i < n; i++) { const r = Math.floor(i / per), c = i % per, x = 5 + (c - (Math.min(per, n - r * per) - 1) / 2) * w, y = 2.3 - r * 0.75; s.dot(x, y, { r: 14, color: elColor(v, i, n) }); if (/^\d+$/.test(g.L[i])) s.text(g.L[i], x, y, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false }); else s.tex(g.L[i], x, y + 0.42, { size: 13 }); }
            s.text(`|${g.tex.replace(/\\mathbb Z_\{(\d+)\}/, 'ℤ$1').replace('D_{3}', 'S₃').replace('D_{4}', 'D₄').replace('Q_8', 'Q₈')}| = ${n}`, 5, 0.45, { align: 'center', size: 14, weight: 700 });
          }
          const n0 = N.value;
          for (let n = 2; n <= 40; n++) { const ph = units(n).n, sel = n === n0; b.rect(n - 0.36, 0, n + 0.36, n, { fill: 'muted', fillAlpha: 0.12, stroke: false }); b.rect(n - 0.36, 0, n + 0.36, ph, { fill: sel ? 'gold' : ph === n - 1 ? 'green' : 'accent', fillAlpha: sel ? 0.85 : 0.55, stroke: false }); }
          b.line(1.5, 0.5, 40.5, 39.5, { color: 'muted', width: 1, dash: [4, 4] });
          b.text(`φ(${n0}) = ${units(n0).n}`, n0, units(n0).n, { dy: -10, align: 'center', size: 11.5, weight: 700, color: 'gold' });
        }, { period: 1e6, still: 0, autoplay: true });
        v.legend([['muted', '$|\\mathbb Z_n| = n$', { area: true }], ['accent', '$|U(n)| = \\varphi(n)$', { area: true }], ['green', 'prime $n$: $\\varphi(n) = n-1$', { area: true }]]);
        v.readout(() => {
          const g = G();
          if (!g) return String.raw`$\mathbb Z$ is an **infinite** group: $|\mathbb Z| = \infty$.`;
          return String.raw`$|${g.tex}| = ${g.n}$${which.value === 'Un' ? String.raw` $= \\varphi(${N.value})$` : ''}; the group is ${g.abelian ? 'abelian' : 'nonabelian'}. ${which.value === 'Un' ? `Its elements are the residues coprime to ${N.value}.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Proposition',
      name: 'The identity element is unique',
      statement: String.raw`A group $G$ has exactly one identity element: if $e$ and $e'$ both satisfy $eg=ge=g$ and $e'g=ge'=g$ for all $g\in G$, then $e=e'$.`,
      idea: String.raw`Compute $ee'$ in two ways: since $e$ is an identity, $ee'=e'$; since $e'$ is an identity, $ee'=e$. Hence $e=ee'=e'$. Only the two-sided identity property is used — not associativity or inverses. With one-sided identities the conclusion fails: under $x\circ y=y$ every element is a *left* identity (and there is no right identity at all).`,
      caption: String.raw`Click a row of the table to propose it as a second identity $e'$. Its row and column are compared with the headers; cells where $e'x\ne x$ or $xe'\ne x$ turn red, and the cell $e\,e'$ — which must equal both $e$ and $e'$ — is ringed. Only the true identity survives. The last option, $x\circ y=y$, has many left identities but no two-sided one.`,
      deps: ['alg-3.7a'],
      refs: ['Judson §3.2'],
      tags: ['groups'],
      viz(v) {
        const LZ = finish({ key: 'LZ', tex: '(\\{a,b,c\\}, x\\circ y = y)', n: 3, sym: '\\circ', L: ['a', 'b', 'c'], T: [[0, 1, 2], [0, 1, 2], [0, 1, 2]] });
        const GR = { Z6: cyclic(6), D3: dihedral(3), Q8: quaternion(), LZ };
        const which = v.select('structure', [{ value: 'Z6', label: '$\\mathbb Z_6$' }, { value: 'D3', label: '$D_3$' }, { value: 'Q8', label: '$Q_8$' }, { value: 'LZ', label: '$x\\circ y = y$' }], 'D3', { onChange: () => { cand = 1; } });
        let cand = 1;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, full: true });
        const T = v.table(s, { rows: 6, cols: 6, maxCell: 40, size: 14 });
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0) cand = c.i; });
        v.render(() => {
          const G = GR[which.value], n = G.n, e = G.e, c = cand % n;
          const badRow = (j) => G.T[c][j] !== j, badCol = (i) => G.T[i][c] !== i;
          const hl = []; for (let j = 0; j < n; j++) if (badRow(j)) hl.push([c, j, 'red']); for (let i = 0; i < n; i++) if (badCol(i)) hl.push([i, c, 'red']);
          if (e != null) hl.push([e, c, 'gold']);
          drawCayley(v, T, G, { alpha: 0.16, draw: { activeRow: c, activeCol: c, highlight: hl, rowLabels: (i) => lab(G.L[i]), colLabels: (j) => lab(G.L[j]), value: (i, j) => lab(G.L[G.T[i][j]]) } });
        });
        v.readout(() => {
          const G = GR[which.value], n = G.n, c = cand % n, e = G.e, L = G.L;
          const rowOk = G.T[c].every((x, j) => x === j), colOk = G.T.every((r, i) => r[c] === i);
          if (which.value === 'LZ') return String.raw`In $x\circ y = y$ every row repeats the header, so $${L[c]}$ is a **left** identity ($${L[c]}\circ x = x$ for all $x$) — and so are the other two: three left identities. But the column of $${L[c]}$ is constant, so $x\circ ${L[c]} = ${L[c]} \ne x$: there is **no** two-sided identity, and nothing contradicts Proposition 3.17.`;
          if (rowOk && colOk) return String.raw`$e' = ${L[c]}$ passes both tests — it is the identity $e$ itself. Any other candidate would have to satisfy $e = e e' = e'$.`;
          return String.raw`$e' = ${L[c]}$ fails: ${!rowOk ? String.raw`$${L[c]}\,${L[G.T[c].findIndex((x, j) => x !== j)]} = ${L[G.T[c][G.T[c].findIndex((x, j) => x !== j)]]}$ is not $${L[G.T[c].findIndex((x, j) => x !== j)]}$` : ''}${!rowOk && !colOk ? ', and ' : ''}${!colOk ? 'its column differs from the header' : ''}. The ringed cell shows $e\,e' = ${L[G.T[e][c]]}$: an identity $e'$ would force it to be $e$ as well, i.e. $e' = e = ${L[e]}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Proposition',
      name: 'Inverses are unique',
      statement: String.raw`In a group $G$, each element $g$ has exactly one inverse: if $gg'=g'g=e$ and $gg''=g''g=e$, then $g'=g''$. It is denoted $g^{-1}$.`,
      idea: String.raw`Insert $e=gg''$ and re-bracket:
$$g'=g'e=g'(gg'')=(g'g)g''=eg''=g''.$$
The middle step is associativity — that is where the proof really works. In the row of $g$ in a Cayley table, $e$ therefore appears exactly once, in the column of $g^{-1}$. In a non-associative structure an element can have two inverses, and the chain breaks exactly at the re-bracketing.`,
      caption: String.raw`Click a row $g$. The cells of row $g$ and column $g$ that hold $e$ are ringed green — exactly one of each, in the same position, giving $g^{-1}$. The readout runs the chain $g'=g'e=g'(gg'')=(g'g)g''=eg''=g''$ with actual elements. Pick the non-associative table $M$ and the element $a$: it has **two** inverses, and the chain fails at the associativity step.`,
      deps: ['alg-3.7a'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'inverses'],
      viz(v) {
        const M3 = finish({ key: 'M3', tex: 'M', n: 3, sym: '\\cdot', L: ['e', 'a', 'b'], T: [[0, 1, 2], [1, 0, 0], [2, 0, 0]] });
        const GR = { Z6: cyclic(6), U10: units(10), D3: dihedral(3), Q8: quaternion(), M3 };
        const which = v.select('structure', [{ value: 'Z6', label: '$\\mathbb Z_6$' }, { value: 'U10', label: '$U(10)$' }, { value: 'D3', label: '$D_3$' }, { value: 'Q8', label: '$Q_8$' }, { value: 'M3', label: 'non-associative $M$' }], 'D3', { onChange: (k) => { g = k === 'M3' ? 1 : 1; } });
        let g = 1;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, full: true });
        const T = v.table(s, { rows: 6, cols: 6, maxCell: 40, size: 14 });
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0) g = c.i; });
        v.render(() => {
          const G = GR[which.value], n = G.n, a = g % n, e = G.e, hl = [];
          for (let j = 0; j < n; j++) if (G.T[a][j] === e) hl.push([a, j, G.T[j][a] === e ? 'green' : 'orange']);
          for (let i = 0; i < n; i++) if (G.T[i][a] === e) hl.push([i, a, G.T[a][i] === e ? 'green' : 'orange']);
          drawCayley(v, T, G, { alpha: 0.16, draw: { activeRow: a, activeCol: a, highlight: hl, rowLabels: (i) => lab(G.L[i]), colLabels: (j) => lab(G.L[j]), value: (i, j) => lab(G.L[G.T[i][j]]) } });
        });
        v.readout(() => {
          const G = GR[which.value], n = G.n, a = g % n, e = G.e, L = G.L, T = G.T;
          const invs = [...Array(n).keys()].filter((b) => T[a][b] === e && T[b][a] === e);
          if (invs.length === 1) { const b = invs[0]; return String.raw`Row $${L[a]}$ contains $${L[e]}$ exactly once, in column $${L[b]}$: $${L[a]}^{-1} = ${L[b]}$. With $g' = g'' = ${L[b]}$ the chain $g' = g'e = g'(gg'') = (g'g)g'' = eg'' = g''$ is trivially consistent — and it shows no second inverse can exist.`; }
          if (invs.length === 0) return `$${L[a]}$ has no inverse here.`;
          const [p, q] = invs, left = T[p][T[a][q]], right = T[T[p][a]][q];
          return String.raw`In $M$, $${L[a]}$ has **two** inverses, $g' = ${L[p]}$ and $g'' = ${L[q]}$ (both $${L[a]}${L[p]} = ${L[a]}${L[q]} = e$). The chain: $g'e = ${L[p]}$, $g'(gg'') = ${L[p]}(${L[a]}${L[q]}) = ${L[left]}$, but $(g'g)g'' = (${L[p]}${L[a]})${L[q]} = ${L[right]}$ — **${left === right ? 'equal' : 'different'}**: associativity fails (e.g. $(${L[assocFail(G)[0]]}${L[assocFail(G)[1]]})${L[assocFail(G)[2]]} \ne ${L[assocFail(G)[0]]}(${L[assocFail(G)[1]]}${L[assocFail(G)[2]]})$), so $M$ is not a group.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19',
      kind: 'Proposition',
      name: '(ab)⁻¹ = b⁻¹a⁻¹',
      statement: String.raw`In any group, $(ab)^{-1}=b^{-1}a^{-1}$ for all $a,b\in G$.`,
      idea: String.raw`Check that $b^{-1}a^{-1}$ undoes $ab$: $(ab)(b^{-1}a^{-1})=a(bb^{-1})a^{-1}=aea^{-1}=e$, and similarly $(b^{-1}a^{-1})(ab)=e$; by uniqueness of inverses (Proposition 3.18) it *is* $(ab)^{-1}$. This is the "socks and shoes" rule: you put on socks, then shoes, and take off shoes first. With motions, $ab$ means "first $b$, then $a$", so undoing it means undoing $a$ first. The order matters unless $a$ and $b$ commute: $(ab)^{-1}=a^{-1}b^{-1}$ fails in a nonabelian group.`,
      caption: String.raw`The cards perform $ab$ — first $b$, then $a$ — and then try to undo it. The left card undoes in the right order ($a^{-1}$ first, then $b^{-1}$, i.e. applies $b^{-1}a^{-1}$) and always comes home; the right card undoes in the wrong order ($a^{-1}b^{-1}$) and comes home only when $a$ and $b$ commute. Choose $a$ and $b$ among the symmetries of the square (or of the triangle).`,
      deps: ['alg-3.18'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'inverses'],
      viz(v) {
        const GR = { D4: dihedral(4), D3: dihedral(3) };
        const fig = v.select('figure', [{ value: 'D4', label: 'square $D_4$' }, { value: 'D3', label: 'triangle $D_3$' }], 'D4', { onChange: () => { A.set(1); B.set(4); } });
        const opts = (k) => GR[k].L.map((l, i) => ({ value: i, label: `$${l}$` }));
        const A = v.select('$a$', opts('D4'), 1), B = v.select('$b$', opts('D4'), 4);
        const s1 = v.stage({ x: [-1.55, 1.55], y: [-1.45, 1.55], equal: true, axes: false, height: 300 });
        const s2 = v.stage({ x: [-1.55, 1.55], y: [-1.45, 1.55], equal: true, axes: false, height: 300 });
        v.animate((tt) => {
          const G = GR[fig.value], n = G.n, a = A.value % n, b = B.value % n, ai = G.inv[a], bi = G.inv[b];
          [[s1, [b, a, ai, bi], 'undo in the right order: $b^{-1}a^{-1}$'], [s2, [b, a, bi, ai], 'wrong order: $a^{-1}b^{-1}$']].forEach(([s, seq, title]) => {
            let M = [[1, 0], [0, 1]], cur = null; const ph = Math.floor(tt / 1.4), u = Math.min(1, (tt - 1.4 * ph) / 1.1);
            for (let k = 0; k < 4; k++) { if (k < ph) M = mm(G.mat[seq[k]], M); else if (k === ph) { cur = k; M = mm(partial(G.mat[seq[k]], u), M); break; } }
            const ax = cur != null ? axisOf(G.mat[seq[cur]]) : null;
            if (ax) s.line(-1.5 * ax[0], -1.5 * ax[1], 1.5 * ax[0], 1.5 * ax[1], { color: 'gold', width: 1.5, dash: [6, 4] });
            drawFigure(v, s, M, G.pos, { R: 1, lab: 0.2 });
            const home = Math.abs(M[0][0] - 1) < 1e-6 && Math.abs(M[1][1] - 1) < 1e-6 && Math.abs(M[0][1]) < 1e-6;
            const names = [G.L[seq[0]], G.L[seq[1]], `${G.L[seq[2]]}`, `${G.L[seq[3]]}`];
            s.setTitle(title);
            s.corner(cur != null ? `${cur < 2 ? 'do' : 'undo'} ${cur + 1}/4: $${names[cur]}$` : home ? 'back home ✓' : 'not back home ✗', 'tl', { size: 13, plate: true, color: cur != null ? 'ink' : home ? 'green' : 'red' });
          });
        }, { period: 7.2, still: 7.0 });
        v.readout(() => {
          const G = GR[fig.value], n = G.n, a = A.value % n, b = B.value % n, L = G.L, ab = G.T[a][b], r = G.T[G.inv[b]][G.inv[a]], w = G.T[G.inv[a]][G.inv[b]];
          return String.raw`$ab = ${L[a]}${L[b]} = ${L[ab]}$, $(ab)^{-1} = ${L[G.inv[ab]]}$; $b^{-1}a^{-1} = ${L[G.inv[b]]}${L[G.inv[a]]} = ${L[r]}$ ${r === G.inv[ab] ? '✓' : '✗'}, while $a^{-1}b^{-1} = ${L[G.inv[a]]}${L[G.inv[b]]} = ${L[w]}$ ${w === G.inv[ab] ? '(also works: $a$ and $b$ commute)' : '— **not** the inverse'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.20
    {
      num: '3.20',
      kind: 'Proposition',
      name: '(a⁻¹)⁻¹ = a',
      statement: String.raw`In any group, $(a^{-1})^{-1}=a$ for every $a\in G$.`,
      idea: String.raw`The equations $aa^{-1}=a^{-1}a=e$ say that $a$ is an inverse of $a^{-1}$; by uniqueness of inverses it is *the* inverse. So inversion $a\mapsto a^{-1}$ is a map of $G$ to itself that undoes itself — an involution, hence a bijection. Drawn as a graph, it pairs elements off, with the self-inverse elements ($a^2=e$) as fixed points.`,
      caption: String.raw`Each element is joined to its inverse; loops mark elements that are their own inverse. Click an element: the gold path goes $a\to a^{-1}\to(a^{-1})^{-1}$ and always returns to $a$. Compare groups — in $U(8)$ or $U(24)$ every element is its own inverse; in $\mathbb Z_{12}$ only $0$ and $6$ are.`,
      deps: ['alg-3.18'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'inverses'],
      viz(v) {
        const GR = { Z12: cyclic(12), U15: units(15), U24: units(24), D4: dihedral(4), Q8: quaternion() };
        const which = v.select('group', [{ value: 'Z12', label: '$\\mathbb Z_{12}$' }, { value: 'U15', label: '$U(15)$' }, { value: 'U24', label: '$U(24)$' }, { value: 'D4', label: '$D_4$' }, { value: 'Q8', label: '$Q_8$' }], 'Z12', { onChange: () => { sel = 1; } });
        let sel = 1;
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.3, 1.3], equal: true, axes: false, height: 350 });
        const Gr = v.graph(s, { nodes: [], edges: [], layout: 'none', draggable: false, r: 16, fontSize: 13 });
        Gr.onClick = ({ node }) => { if (node) sel = +node.id; return true; };
        v.render(() => {
          const G = GR[which.value], n = G.n, a = sel % n, ai = G.inv[a];
          Gr.nodes = Array.from({ length: n }, (_, i) => ({ id: i, x: 0.92 * Math.cos(Math.PI / 2 - (2 * Math.PI * i) / n), y: -0.06 + 0.92 * Math.sin(Math.PI / 2 - (2 * Math.PI * i) / n), label: lab(G.L[i]) }));
          const E = []; for (let i = 0; i < n; i++) { const j = G.inv[i]; if (j === i) E.push({ from: i, to: i }); else if (i < j) E.push({ from: i, to: j, directed: true, both: true }); }
          Gr.edges = E;
          Gr.draw({ nodeFill: (id) => (+id === a ? 'gold' : null), nodeColor: (id) => (+id === ai ? 'gold' : G.inv[+id] === +id ? 'green' : null), edgeColor: (e) => ((e.from === a || e.to === a) ? 'gold' : e.from === e.to ? 'green' : 'muted'), edgeWidth: (e) => (e.from === a || e.to === a ? 3 : null), arrows: false });
        });
        v.readout(() => {
          const G = GR[which.value], n = G.n, a = sel % n, self = [...Array(n).keys()].filter((i) => G.inv[i] === i), ok = G.inv.every((j, i) => G.inv[j] === i);
          return String.raw`$${G.L[a]}^{-1} = ${G.L[G.inv[a]]}$ and $(${G.L[G.inv[a]]})^{-1} = ${G.L[G.inv[G.inv[a]]]}$ — back to the start. Checked for all ${n} elements: $(a^{-1})^{-1} = a$ ${ok ? '✓' : '✗'}. Self-inverse elements ($a^2 = e$): $${roster(G, self)}$, ${self.length} of ${n}; the others pair off in ${(n - self.length) / 2} pairs.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.21
    {
      num: '3.21',
      kind: 'Proposition',
      name: 'ax = b and xa = b have unique solutions',
      statement: String.raw`Let $G$ be a group and $a,b\in G$. Then each of the equations $ax=b$ and $xa=b$ has exactly one solution $x\in G$, namely $x=a^{-1}b$ and $x=ba^{-1}$ respectively.`,
      idea: String.raw`Existence: $a(a^{-1}b)=(aa^{-1})b=b$. Uniqueness: if $ax_1=ax_2$, multiply on the left by $a^{-1}$ to get $x_1=x_2$. In the Cayley table, solving $ax=b$ means finding $b$ in the row of $a$, and solving $xa=b$ means finding $b$ in the column of $a$ — each occurs exactly once. The two solutions differ when the group is nonabelian.`,
      caption: String.raw`Click a row header to choose $a$, then any cell to choose $b$ (its value). The row of $a$ contains $b$ once (column $x=a^{-1}b$, blue) and the column of $a$ contains $b$ once (row $x=ba^{-1}$, orange). In $(\mathbb Z_8,\cdot)$, which is not a group, the row of $2$ holds some values twice and others never: solutions can be missing or multiple.`,
      deps: ['alg-3.18'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'equations'],
      viz(v) {
        const Z8m = finish({ key: 'Zm8', tex: '(\\mathbb Z_8, \\cdot)', n: 8, sym: '\\cdot', L: ['0', '1', '2', '3', '4', '5', '6', '7'], T: Array.from({ length: 8 }, (_, a) => Array.from({ length: 8 }, (_, b) => (a * b) % 8)) });
        const GR = { Z6: cyclic(6), D3: dihedral(3), Q8: quaternion(), D4: dihedral(4), Z8m };
        const which = v.select('structure', [{ value: 'Z6', label: '$\\mathbb Z_6$' }, { value: 'D3', label: '$D_3$' }, { value: 'D4', label: '$D_4$' }, { value: 'Q8', label: '$Q_8$' }, { value: 'Z8m', label: '$(\\mathbb Z_8,\\cdot)$' }], 'D3', { onChange: (k) => { a = k === 'Z8m' ? 2 : 1; b = k === 'Z8m' ? 4 : 3; } });
        let a = 1, b = 3;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, full: true });
        const T = v.table(s, { rows: 6, cols: 6, maxCell: 40, size: 14 });
        s.onClick((x, y) => { const c = T.hit(x, y); if (!c) return; const G = GR[which.value]; if (c.j === -1) a = c.i; else if (c.i === -1) a = c.j; else b = G.T[c.i][c.j]; });
        v.render(() => {
          const G = GR[which.value], n = G.n, A = a % n, B = b % n, hl = [];
          for (let j = 0; j < n; j++) if (G.T[A][j] === B) hl.push([A, j, 'blue']);
          for (let i = 0; i < n; i++) if (G.T[i][A] === B) hl.push([i, A, 'orange']);
          drawCayley(v, T, G, { alpha: 0.12, fill: (i, j) => (G.T[i][j] === B ? [elColor(v, B, n), 0.5] : null), draw: { activeRow: A, activeCol: A, highlight: hl, rowLabels: (i) => lab(G.L[i]), colLabels: (j) => lab(G.L[j]), value: (i, j) => lab(G.L[G.T[i][j]]) } });
        });
        v.readout(() => {
          const G = GR[which.value], n = G.n, A = a % n, B = b % n, L = G.L;
          const xr = [...Array(n).keys()].filter((j) => G.T[A][j] === B), xl = [...Array(n).keys()].filter((i) => G.T[i][A] === B);
          const fmt = (xs) => (xs.length ? xs.map((x) => `$${L[x]}$`).join(', ') : 'none');
          if (G.inv && G.inv.every((x) => x >= 0)) { const x1 = G.T[G.inv[A]][B], x2 = G.T[B][G.inv[A]]; return String.raw`$${L[A]}x = ${L[B]}$: $x = a^{-1}b = ${L[G.inv[A]]}\,${L[B]} = ${L[x1]}$ (one solution: ${fmt(xr)}). $x${L[A]} = ${L[B]}$: $x = ba^{-1} = ${L[B]}\,${L[G.inv[A]]} = ${L[x2]}$ (one solution: ${fmt(xl)}).${x1 !== x2 ? ' The two equations have **different** solutions — the group is nonabelian.' : ''}`; }
          return String.raw`$(\mathbb Z_8, \cdot)$ is not a group: $${L[A]}x = ${L[B]}$ has solutions ${fmt(xr)} — ${xr.length === 1 ? 'here exactly one' : xr.length === 0 ? '**none**' : `**${xr.length}** of them`}. (Only the units $1, 3, 5, 7$ give unique solutions for every $b$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.22
    {
      num: '3.22',
      kind: 'Proposition',
      name: 'Cancellation laws',
      statement: String.raw`In a group $G$, for all $a,b,c\in G$: $ba=ca$ implies $b=c$ (right cancellation), and $ab=ac$ implies $b=c$ (left cancellation).`,
      idea: String.raw`Multiply $ab=ac$ on the left by $a^{-1}$ and use associativity: $b=(a^{-1}a)b=a^{-1}(ab)=a^{-1}(ac)=c$. Equivalently, left multiplication $x\mapsto ax$ is one-to-one, and on a finite group therefore a permutation — every row of the Cayley table lists each element once; right cancellation does the same for columns. A table with a repeated entry in a row cannot belong to a group.`,
      caption: String.raw`The right panel draws row $a$ of the table as a map $x\mapsto ax$: a perfect matching. Click any cell to change its entry (it cycles through the elements): the edited row now has a collision, $ab=ac$ with $b\ne c$, shown red on both panels, and the readout reports which group axiom the edited table violates. Click a row header to choose $a$; **Reset** restores the group.`,
      deps: ['alg-3.21'],
      see: ['alg-1.7a'],
      refs: ['Judson §3.2'],
      tags: ['groups'],
      viz(v) {
        const BASE = { Z5: cyclic(5), D3: dihedral(3), U8: units(8) };
        const which = v.select('group', [{ value: 'Z5', label: '$\\mathbb Z_5$' }, { value: 'D3', label: '$D_3$' }, { value: 'U8', label: '$U(8)$' }], 'D3', { onChange: () => reset() });
        let G, a = 1;
        const reset = () => { const B = BASE[which.value]; G = finish({ ...B, T: B.T.map((r) => r.slice()) }); };
        reset();
        v.button('Reset', () => reset());
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.2 });
        const t = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 330, weight: 1 });
        const T = v.table(s, { rows: 6, cols: 6, maxCell: 42, size: 14 });
        s.onClick((x, y) => { const c = T.hit(x, y); if (!c) return; if (c.j === -1) { a = c.i; return; } if (c.i < 0) return; G.T[c.i][c.j] = (G.T[c.i][c.j] + 1) % G.n; a = c.i; finish(G); });
        v.render(() => {
          const n = G.n, B = BASE[which.value], lf = latinFails(G), badRow = new Set(lf.filter((f) => f.kind === 'row').map((f) => f.k));
          const dupCells = []; for (const f of lf) for (const k of f.at) dupCells.push(f.kind === 'row' ? [f.k, k, 'red'] : [k, f.k, 'red']);
          drawCayley(v, T, G, { alpha: 0.18, fill: (i, j) => (G.T[i][j] !== B.T[i][j] ? ['red', 0.25] : null), draw: { activeRow: a, highlight: dupCells, rowLabels: (i) => lab(G.L[i]), colLabels: (j) => lab(G.L[j]), value: (i, j) => lab(G.L[G.T[i][j]]), rowLabelColor: (i) => (badRow.has(i) ? 'red' : null) } });
          // row a as a map x ↦ a x
          const yy = (i) => 6.2 - (5.4 * i) / Math.max(n - 1, 1), hits = Array(n).fill(0); G.T[a].forEach((x) => hits[x]++);
          t.text(`x ↦ ${G.L[a].replace(/\\mathrm\{id\}/, 'id').replace(/\\rho_(\d)/, 'ρ$1').replace(/\\mu_(\d)/, 'μ$1')} x`, 5, 6.75, { align: 'center', size: 13.5, weight: 700 });
          for (let i = 0; i < n; i++) { t.dot(2.5, yy(i), { r: 5, color: 'ink' }); t.tex(G.L[i], 1.8, yy(i), { size: 14 }); t.dot(7.5, yy(i), { r: hits[i] > 1 ? 7 : 5, color: hits[i] === 1 ? 'ink' : 'red', hollow: hits[i] === 0 }); t.tex(G.L[i], 8.2, yy(i), { size: 14, color: hits[i] === 1 ? 'ink' : 'red' }); }
          for (let x = 0; x < n; x++) { const y0 = yy(x), y1 = yy(G.T[a][x]); t.arrow(2.75, y0 + (y1 - y0) * 0.05, 7.25, y1 - (y1 - y0) * 0.05, { color: hits[G.T[a][x]] > 1 ? 'red' : 'green', width: 2, head: 8 }); }
        });
        v.readout(() => {
          const lf = latinFails(G), L = G.L;
          if (!lf.length) return String.raw`Every row and column is a permutation: left multiplication by each element is one-to-one, as cancellation demands. ${assocFail(G) ? '' : `This is the table of $${G.tex}$.`}`;
          const f = lf[0], [j1, j2] = f.at, af = assocFail(G);
          const eq = f.kind === 'row' ? String.raw`$${L[f.k]}\,${L[j1]} = ${L[f.k]}\,${L[j2]} = ${L[f.dup]}$` : String.raw`$${L[j1]}\,${L[f.k]} = ${L[j2]}\,${L[f.k]} = ${L[f.dup]}$`;
          return String.raw`**Cancellation fails:** ${eq} although $${L[j1]}\ne ${L[j2]}$. So this table is no group: ${G.e == null ? 'it has no identity' : G.inv.some((x) => x < 0) ? 'some element has no inverse' : af ? String.raw`associativity breaks, e.g. $(${L[af[0]]}${L[af[1]]})${L[af[2]]} \ne ${L[af[0]]}(${L[af[1]]}${L[af[2]]})$` : 'an axiom fails'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.23
    {
      num: '3.23',
      kind: 'Theorem',
      name: 'Laws of exponents',
      statement: String.raw`For $g\in G$ set $g^0=e$, $g^n=g\cdots g$ ($n$ factors) and $g^{-n}=g^{-1}\cdots g^{-1}$ for $n\in\mathbb N$. Then for all $g,h\in G$ and $m,n\in\mathbb Z$:
(1) $g^mg^n=g^{m+n}$;
(2) $(g^m)^n=g^{mn}$;
(3) $(gh)^n=(h^{-1}g^{-1})^{-n}$; and if $G$ is abelian, $(gh)^n=g^nh^n$.
In additive notation these read $mg+ng=(m+n)g$, $m(ng)=(mn)g$ and $m(g+h)=mg+mh$.`,
      idea: String.raw`For $m,n\ge0$, (1) and (2) just count factors, using associativity to drop brackets; negative exponents reduce to these because $g^{-1}$ cancels $g$ (Proposition 3.19 handles the inverse of a product), and an induction on $|n|$ makes it rigorous. (3) is $(gh)^{-1}=h^{-1}g^{-1}$ raised to the power $-n$. The law $(gh)^n=g^nh^n$ needs the $g$'s and $h$'s to be moved past each other, which is exactly commutativity.`,
      caption: String.raw`Click a chip to choose $g$ (shift-click for $h$). The powers of $g$ go round a cycle: $m$ steps (blue) then $n$ more (orange) land on $g^{m+n}$, whatever the signs. The table compares $(gh)^n$, $g^nh^n$ and $(h^{-1}g^{-1})^{-n}$ for $n=-3,\ldots,3$: the first and last always agree, the middle one only when $g$ and $h$ commute — try $D_4$ with $g=r$, $h=s$.`,
      deps: ['alg-3.19', 'alg-2.1'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'exponents'],
      viz(v) {
        const GR = { D4: dihedral(4), Z12: cyclic(12), U15: units(15), Q8: quaternion() };
        const which = v.select('group', [{ value: 'D4', label: '$D_4$' }, { value: 'Z12', label: '$\\mathbb Z_{12}$' }, { value: 'U15', label: '$U(15)$' }, { value: 'Q8', label: '$Q_8$' }], 'D4', { onChange: () => { g = 1; h = GR[which.value].n > 4 ? 4 : 2; } });
        const m = v.slider('$m$', -8, 8, 3, { int: true }), nS = v.slider('$n$', -8, 8, 2, { int: true });
        let g = 1, h = 4;
        const c = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 70, full: true });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.3, 1.3], equal: true, axes: false, height: 300, weight: 1 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15 });
        const CH = chips(v, c, () => GR[which.value]);
        c.onClick((x, y, mod) => { const i = CH.hit(x, y); if (i >= 0) { if (mod.shift) h = i; else g = i; } });
        const T = v.table(t, { rows: 7, cols: 4, square: false, maxCell: 36, cellAspect: 2, colWeights: [0.6, 1.2, 1.2, 1.4], size: 14 });
        v.render(() => {
          const G = GR[which.value], n = G.n, gg = g % n, hh = h % n, o = orderOf(G, gg), L = G.L;
          CH.draw(new Set([gg, hh]), (i) => (i === gg ? { ring: 'accent' } : i === hh ? { ring: 'orange' } : {}));
          // power cycle of g
          const P = (k) => { const a = Math.PI / 2 - (2 * Math.PI * (((k % o) + o) % o)) / o; return [Math.cos(a), Math.sin(a)]; };
          s.circle(0, 0, 1, { color: 'faint', width: 1.2, fill: false });
          const arc = (k0, k1, col, rr) => { const pts = []; const st = k1 >= k0 ? 1 : -1; for (let u = 0; u <= Math.abs(k1 - k0) * 12; u++) { const kk = k0 + (st * u) / 12, a = Math.PI / 2 - (2 * Math.PI * kk) / o; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); } if (pts.length > 1) { s.path(pts.slice(0, -1), { color: col, width: 3 }); const q = pts[pts.length - 2], p2 = pts[pts.length - 1]; s.arrow(q[0], q[1], p2[0], p2[1], { color: col, width: 3, head: 9 }); } };
          arc(0, m.value, 'accent', 0.78); arc(m.value, m.value + nS.value, 'orange', 0.62);
          for (let k = 0; k < o; k++) { const [x, y] = P(k), el = power(G, gg, k), end = ((m.value + nS.value) % o + o) % o === k; s.dot(x, y, { r: end ? 9 : 6, color: end ? 'gold' : elColor(v, el, n) }); s.tex(`g^{${k}} = ${L[el]}`, x * 1.3, y * 1.22, { size: 13 }); }
          s.corner(`order of g: ${o}`, 'bl', { size: 12 });
          const ghinv = G.T[G.inv[hh]][G.inv[gg]];
          T.draw({ rows: 7, cols: 4, colLabels: ['$n$', '$(gh)^n$', '$g^nh^n$', '$(h^{-1}g^{-1})^{-n}$'],
            value: (i, j) => { const k = i - 3; if (j === 0) return String(k).replace('-', '−'); const a = power(G, G.T[gg][hh], k), b = G.T[power(G, gg, k)][power(G, hh, k)], d = power(G, ghinv, -k); return `$${L[[a, b, d][j - 1]]}$`; },
            fill: (i, j) => { const k = i - 3, a = power(G, G.T[gg][hh], k), b = G.T[power(G, gg, k)][power(G, hh, k)]; return j === 2 ? (a === b ? ['green', 0.2] : ['red', 0.3]) : j === 3 || j === 1 ? ['accent', 0.1] : null; } });
        });
        v.readout(() => {
          const G = GR[which.value], n = G.n, gg = g % n, hh = h % n, L = G.L, M = m.value, N = nS.value;
          const l1 = G.T[power(G, gg, M)][power(G, gg, N)], r1 = power(G, gg, M + N), l2 = power(G, power(G, gg, M), N), r2 = power(G, gg, M * N);
          const comm = G.T[gg][hh] === G.T[hh][gg];
          return String.raw`$g = ${L[gg]}$, $h = ${L[hh]}$: $g^{${M}}g^{${N}} = ${L[l1]} = g^{${M + N}}$ ${l1 === r1 ? '✓' : '✗'}; $(g^{${M}})^{${N}} = ${L[l2]} = g^{${M * N}}$ ${l2 === r2 ? '✓' : '✗'}. $g$ and $h$ ${comm ? 'commute, so $(gh)^n = g^nh^n$ in every row' : 'do **not** commute ($gh \\ne hg$), and $g^nh^n$ fails in the red rows'}.`;
        });
      },
    },
  ],
};
