// Abstract Algebra (Judson) — Chapter 1: Preliminaries, part 2
// Composition laws, identity and inverse maps, invertible = bijective, equivalence relations, classes and partitions,
// and congruence modulo n (1.15–1.30). Part 1: ch01.js. Shared helpers: ch01.shared.js.
import { CAT, setList, colPts, drawBlob, drawElems, mapArrow, loopArrow, linkEditor, mapInfo, tick, zeros, relChecks, eqClosure, classesOf, relOfBlocks, bell } from './ch01.shared.js';

/** Random map of {0..m−1} into {0..n−1} with a property ('any' | 'inj' | 'surj' | 'bij'), from the seeded generator r. */
function randomMap(r, m, n, kind) {
  if (kind === 'inj' || kind === 'bij') return r.shuffle([...Array(n).keys()]).slice(0, m);
  if (kind === 'surj') { const f = r.shuffle([...Array(n).keys()]).concat(Array.from({ length: m - n }, () => r.int(0, n - 1))); return r.shuffle(f); }
  return Array.from({ length: m }, () => r.int(0, n - 1));
}
const mapTex = (f, dom, cod) => f.map((b, a) => `${dom[a]}\\mapsto ${cod[b]}`).join(',\\ ');
/** Fraction p/q in lowest terms with q > 0, as [p, q]. */
function reduce(p, q) { const g = (a, b) => (b ? g(b, a % b) : Math.abs(a)); const d = g(p, q) || 1; const s = q < 0 ? -1 : 1; return [(s * p) / d, (s * q) / d]; }
/** A small rational as TeX (exact for the integer matrices used here). */
function fracTex(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x)).replace('-', '-');
  for (let q = 2; q <= 24; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-9) return `${p < 0 ? '-' : ''}\\tfrac{${Math.abs(p)}}{${q}}`; }
  return x.toFixed(2);
}
const matTex = (A, f = fracTex) => `\\begin{pmatrix}${f(A[0][0])}&${f(A[0][1])}\\\\ ${f(A[1][0])}&${f(A[1][1])}\\end{pmatrix}`;

export default {
  collection: 'alg',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Theorem',
      name: 'Composition is associative and preserves bijections',
      statement: String.raw`Let $f:A\to B$, $g:B\to C$ and $h:C\to D$. Then
(1) composition is associative: $(h\circ g)\circ f=h\circ(g\circ f)$;
(2) if $f$ and $g$ are one-to-one, so is $g\circ f$;
(3) if $f$ and $g$ are onto, so is $g\circ f$;
(4) if $f$ and $g$ are bijections, so is $g\circ f$.`,
      idea: String.raw`(1) Evaluate both sides at $a\in A$: each gives $h(g(f(a)))$, so they are the same map — both bracketings follow the same chain of three arrows. (2) If $g(f(a_1))=g(f(a_2))$, injectivity of $g$ gives $f(a_1)=f(a_2)$ and then injectivity of $f$ gives $a_1=a_2$. (3) Given $c\in C$, pick $b$ with $g(b)=c$ and then $a$ with $f(a)=b$. (4) combines (2) and (3). The converses fail: $g\circ f$ can be one-to-one with $g$ not one-to-one.`,
      caption: String.raw`Edit $f$, $g$, $h$ by dragging arrows, or generate $f$ and $g$ of a chosen kind (Resample for new ones). Click an element of $A$ to follow its path. The dashed arrows show the inner composite of the chosen bracketing — $h\circ g$ skips $C$, $g\circ f$ skips $B$; the right panel draws both final composites on top of each other, and the badges track which properties $g\circ f$ inherits.`,
      deps: ['alg-1.8a', 'alg-1.7a'],
      refs: ['Judson §1.2'],
      tags: ['functions', 'composition'],
      viz(v) {
        const SIZES = { any: [4, 4, 4, 3], inj: [3, 4, 5, 4], surj: [5, 4, 3, 3], bij: [4, 4, 4, 4] };
        let seed = 3, sz = SIZES.inj, f, g, h, sel = 0;
        const gen = () => { const r = v.rng(seed * 101 + 7), k = kind.value; sz = SIZES[k]; f = randomMap(r, sz[0], sz[1], k); g = randomMap(r, sz[1], sz[2], k); h = randomMap(r, sz[2], sz[3], 'any'); sel = Math.min(sel, sz[0] - 1); };
        const kind = v.select('generate $f, g$', [{ value: 'any', label: 'arbitrary' }, { value: 'inj', label: 'one-to-one' }, { value: 'surj', label: 'onto' }, { value: 'bij', label: 'bijective' }], 'inj', { onChange: () => gen() });
        const br = v.select('bracketing', [{ value: 'L', label: '$(h\\circ g)\\circ f$' }, { value: 'R', label: '$h\\circ(g\\circ f)$' }], 'L');
        v.button('Resample', () => { seed++; gen(); });
        gen();
        const s = v.stage({ x: [0, 12], y: [0, 6.9], axes: false, height: 330, weight: 1.7 });
        const t = v.stage({ x: [0, 10], y: [0, 6.9], axes: false, height: 330, weight: 1 });
        const XS = [1.3, 4.4, 7.5, 10.6], LAB = [['1', '2', '3', '4', '5'], ['a', 'b', 'c', 'd', 'e'], ['p', 'q', 'r', 's', 't'], ['W', 'X', 'Y', 'Z']];
        const geo = () => sz.map((n, k) => colPts(n, XS[k], 5.5, 1.0));
        const ed = linkEditor(v, s, () => { const G = geo(); return G.map((pts, k) => ({ pts, to: k < 3 ? k + 1 : null })); }, (c, i, j) => { [f, g, h][c][i] = j; }, (c, i) => { if (c === 0) sel = i; });
        v.render(() => {
          const G = geo(), maps = [f, g, h], L = br.value === 'L', path = [sel, f[sel], g[f[sel]], h[g[f[sel]]]];
          G.forEach((P, k) => drawBlob(v, s, P, { name: 'ABCD'[k], padPx: 24, nameColor: ['blue', 'orange', 'red', 'purple'][k], color: ['blue', 'orange', 'red', 'purple'][k], fill: ['blue', 'orange', 'red', 'purple'][k] }));
          maps.forEach((M, k) => M.forEach((b, a) => { const on = path[k] === a && path[k + 1] === b; mapArrow(v, s, G[k][a], G[k + 1][b], { color: on ? 'gold' : 'muted', width: on ? 3 : 1.6 }); }));
          if (L) g.forEach((c, b) => mapArrow(v, s, G[1][b], G[3][h[c]], { color: 'purple', dash: [5, 4], width: 1.5, bend: -28, alpha: path[1] === b ? 1 : 0.55 }));
          else f.forEach((b, a) => mapArrow(v, s, G[0][a], G[2][g[b]], { color: 'teal', dash: [5, 4], width: 1.5, bend: 28, alpha: a === sel ? 1 : 0.55 }));
          ed.rubber();
          G.forEach((P, k) => drawElems(v, s, P, LAB[k].slice(0, P.length), { side: k === 3 ? 'right' : 'left', size: 13, style: (i) => (path[k] === i ? { color: 'gold', ring: 'gold' } : { color: 'ink' }) }));
          ['f', 'g', 'h'].forEach((nm, k) => s.text(nm, (XS[k] + XS[k + 1]) / 2, 6.45, { math: true, size: 17, align: 'center', weight: 700 }));
          s.text(L ? 'dashed: h ∘ g' : 'dashed: g ∘ f', 6, 0.25, { align: 'center', size: 12, color: L ? 'purple' : 'teal', weight: 600 });
          // right panel: the two composites A → D
          const A = colPts(sz[0], 2.6, 5.3, 2.35), D = colPts(sz[3], 7.4, 5.3, 2.35);
          drawBlob(v, t, A, { name: 'A', nameColor: 'blue', color: 'blue', fill: 'blue', padPx: 24 }); drawBlob(v, t, D, { name: 'D', nameColor: 'purple', color: 'purple', fill: 'purple', padPx: 24 });
          const hg = g.map((c) => h[c]), gf = f.map((b) => g[b]);
          f.forEach((b, a) => mapArrow(v, t, A[a], D[hg[b]], { color: a === sel ? 'gold' : 'accent', width: 4.5, alpha: 0.45 }));
          gf.forEach((c, a) => mapArrow(v, t, A[a], D[h[c]], { color: 'ink', width: 1.6, dash: [5, 4] }));
          drawElems(v, t, A, LAB[0].slice(0, sz[0]), { side: 'left', size: 13 }); drawElems(v, t, D, LAB[3].slice(0, sz[3]), { side: 'right', size: 13 });
          t.text('thick: (h∘g)∘f   dashed: h∘(g∘f)', 5, 6.45, { align: 'center', size: 11.5, color: 'muted' });
          const iF = mapInfo(f, sz[1]), iG = mapInfo(g, sz[2]), iGF = mapInfo(gf, sz[2]);
          [['f', iF], ['g', iG], ['g∘f', iGF]].forEach(([nm, I], k) => {
            const y = 1.0 - k * 0.38;
            t.text(nm, 2.2, y, { size: 12, weight: 700, align: 'right', math: k < 2 });
            t.text(`${tick(I.inj)} one-to-one`, 2.5, y, { size: 12, color: I.inj ? 'green' : 'red', weight: 600 });
            t.text(`${tick(I.surj)} onto`, 6.2, y, { size: 12, color: I.surj ? 'green' : 'red', weight: 600 });
          });
        });
        v.readout(() => {
          const hg = g.map((c) => h[c]), gf = f.map((b) => g[b]), left = f.map((b) => hg[b]), right = gf.map((c) => h[c]);
          const same = left.every((x, i) => x === right[i]), iF = mapInfo(f, sz[1]), iG = mapInfo(g, sz[2]), iGF = mapInfo(gf, sz[2]);
          let s = `$(h\\circ g)\\circ f$ and $h\\circ(g\\circ f)$ both send $${mapTex(left, LAB[0], LAB[3])}$ — ${same ? '**the same map**' : 'different?!'}. `;
          if (iF.inj && iG.inj) s += `$f$, $g$ one-to-one $\\Rightarrow$ $g\\circ f$ one-to-one ${tick(iGF.inj)}. `;
          if (iF.surj && iG.surj) s += `$f$, $g$ onto $\\Rightarrow$ $g\\circ f$ onto ${tick(iGF.surj)}. `;
          if (iGF.inj && !iG.inj) s += 'Converse fails: $g\\circ f$ is one-to-one though $g$ is not. ';
          if (iGF.surj && !iF.surj) s += 'Converse fails: $g\\circ f$ is onto though $f$ is not. ';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15a
    {
      num: '1.15a',
      kind: 'Definition',
      name: 'Identity map and inverse map',
      statement: String.raw`The **identity map** of a set $S$ is $\mathrm{id}_S:S\to S$, $\mathrm{id}_S(s)=s$. A map $g:B\to A$ is an **inverse** of $f:A\to B$ if
$$g\circ f=\mathrm{id}_A\quad\text{and}\quad f\circ g=\mathrm{id}_B ;$$
then $f$ is **invertible** and we write $g=f^{-1}$. For example, a $2\times2$ matrix $A$ defines $T_A:\mathbb R^2\to\mathbb R^2$, $T_A(x,y)=(ax+by,\,cx+dy)$, and when the matrix $A$ is invertible, $T_A^{-1}=T_{A^{-1}}$.`,
      idea: String.raw`The inverse undoes $f$ from both sides: going out along $f$ and back along $g$ returns every point of $A$ to itself, and going back and then out returns every point of $B$. Judson's matrix examples make this concrete: $A=\begin{pmatrix}3&1\\5&2\end{pmatrix}$ has inverse $\begin{pmatrix}2&-1\\-5&3\end{pmatrix}$, so $T_A^{-1}(x,y)=(2x-y,\,-5x+3y)$; but $B=\begin{pmatrix}3&0\\0&0\end{pmatrix}$ squashes the plane onto a line — points with different $y$ land on the same image and points off the line are never reached, so nothing can undo it.`,
      caption: String.raw`Drag $p$ in the domain: $T(p)$ appears on the right and $T^{-1}$ brings it back to $p$ (green ring). Drag $q$ on the right to see $T^{-1}(q)$. The letter F and the grid show what $T$ does to the whole plane. Choose Judson's singular matrix $B$: the plane collapses onto a line, every point of the red line in the domain goes to the same place, and a $q$ off the image line has no preimage. In "custom", drag the images of $e_1$, $e_2$.`,
      deps: ['alg-1.8a'],
      see: ['ladr-3.59'],
      refs: ['Judson §1.2'],
      tags: ['functions', 'inverses'],
      viz(v) {
        const MATS = { A: [[3, 1], [5, 2]], B: [[3, 0], [0, 0]], rot: [[0, -1], [1, 0]], shear: [[1, 1.5], [0, 1]] };
        const which = v.select('matrix', [{ value: 'A', label: "Judson's $A$" }, { value: 'B', label: "Judson's $B$" }, { value: 'rot', label: 'rotation' }, { value: 'shear', label: 'shear' }, { value: 'custom', label: 'custom' }], 'A',
          { onChange: (k) => { E1.visible = E2.visible = k === 'custom'; } });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: 'box', gutter: true, height: 340, title: 'domain $\\mathbb R^2$' });
        const T = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: 'box', gutter: true, height: 340, title: 'codomain $\\mathbb R^2$' });
        const p = S.handle(0.8, 0.5, { color: 'accent', label: 'p' }), q = T.handle(2, 3, { color: 'orange', label: 'q' });
        const E1 = T.handle(2, 1, { color: 'blue', label: 'Te_1', r: 6 }), E2 = T.handle(-1, 2, { color: 'red', label: 'Te_2', r: 6 });
        E1.visible = E2.visible = false;
        const mat = () => (which.value === 'custom' ? [[E1.x, E2.x], [E1.y, E2.y]] : MATS[which.value]);
        const F = [[0.15, 0.08], [0.35, 0.08], [0.35, 0.45], [0.65, 0.45], [0.65, 0.62], [0.35, 0.62], [0.35, 0.75], [0.82, 0.75], [0.82, 0.92], [0.15, 0.92]];
        const ap = (M, [x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
        v.render(() => {
          const M = mat(), det = M[0][0] * M[1][1] - M[0][1] * M[1][0], inv = Math.abs(det) > 1e-6 ? [[M[1][1] / det, -M[0][1] / det], [-M[1][0] / det, M[0][0] / det]] : null;
          for (let k = -3; k <= 3; k++) {
            S.line(k, -3, k, 3, { color: 'grid', width: k ? 0.8 : 1.3 }); S.line(-3, k, 3, k, { color: 'grid', width: k ? 0.8 : 1.3 });
            const a = ap(M, [k, -30]), b = ap(M, [k, 30]), c = ap(M, [-30, k]), d = ap(M, [30, k]);
            T.line(a[0], a[1], b[0], b[1], { color: 'blue', width: 0.8, alpha: 0.35 }); T.line(c[0], c[1], d[0], d[1], { color: 'red', width: 0.8, alpha: 0.35 });
          }
          S.poly(F, { fill: 'purple', fillAlpha: 0.25, color: 'purple', width: 1.6 });
          T.poly(F.map((pt) => ap(M, pt)), { fill: 'purple', fillAlpha: 0.25, color: 'purple', width: 1.6 });
          S.arrow(0, 0, 1, 0, { color: 'blue', width: 2 }); S.arrow(0, 0, 0, 1, { color: 'red', width: 2 });
          const e1 = ap(M, [1, 0]), e2 = ap(M, [0, 1]);
          T.arrow(0, 0, e1[0], e1[1], { color: 'blue', width: 2 }); T.arrow(0, 0, e2[0], e2[1], { color: 'red', width: 2 });
          const Tp = ap(M, [p.x, p.y]);
          T.dot(Tp[0], Tp[1], { r: 6, color: 'accent', hollow: true, label: 'T(p)', labelPos: 'se', labelColor: 'accent' });
          if (inv) {
            const back = ap(inv, Tp), Iq = ap(inv, [q.x, q.y]);
            S.circle(back[0], back[1], 0.14, { color: 'green', width: 2.4, fill: false });
            S.text('T⁻¹(T(p)) = p', p.x, p.y, { dx: 14, dy: 14, size: 11.5, color: 'green', weight: 600 });
            S.dot(Iq[0], Iq[1], { r: 6, color: 'orange', hollow: true, label: 'T⁻¹(q)', labelPos: 'ne', labelColor: 'orange' });
            const qq = ap(M, Iq); T.circle(qq[0], qq[1], 0.42, { color: 'green', width: 2.4, fill: false });
          } else {
            // singular: kernel direction and image line
            const ker = Math.hypot(M[0][0], M[0][1]) > 1e-9 ? [-M[0][1], M[0][0]] : Math.hypot(M[1][0], M[1][1]) > 1e-9 ? [-M[1][1], M[1][0]] : null;
            if (ker) { const L = Math.hypot(ker[0], ker[1]), u = [ker[0] / L, ker[1] / L]; S.line(p.x - 9 * u[0], p.y - 9 * u[1], p.x + 9 * u[0], p.y + 9 * u[1], { color: 'red', width: 2.6 }); S.text('all of this line ↦ T(p)', p.x, p.y, { dx: 10, dy: 24, size: 11.5, color: 'red', weight: 600 }); }
            const img = Math.hypot(e1[0], e1[1]) > 1e-9 ? e1 : e2;
            if (Math.hypot(img[0], img[1]) > 1e-9) { const L = Math.hypot(img[0], img[1]); T.line(-20 * img[0] / L, -20 * img[1] / L, 20 * img[0] / L, 20 * img[1] / L, { color: 'orange', width: 3, alpha: 0.55 }); }
            T.text('no preimage', q.x, q.y, { dx: 10, dy: 22, size: 11.5, color: 'red', weight: 600 });
          }
        });
        v.readout(() => {
          const M = mat(), det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
          if (Math.abs(det) < 1e-6) return String.raw`$T = ${matTex(M, (x) => v.fix(x, 2).replace('−', '-'))}$ has $\det = 0$: the plane is squashed onto a line (or a point). $T$ is **not one-to-one** (the red line all goes to $T(p)$) and **not onto** (points off the orange line are missed), so no map $g$ with $g\circ T = \mathrm{id}$ and $T\circ g = \mathrm{id}$ exists.`;
          const inv = [[M[1][1] / det, -M[0][1] / det], [-M[1][0] / det, M[0][0] / det]], f = which.value === 'custom' ? (x) => v.fix(x, 2).replace('−', '-') : fracTex;
          const Tp = ap(M, [p.x, p.y]), back = ap(inv, Tp), err = Math.hypot(back[0] - p.x, back[1] - p.y);
          return String.raw`$T = ${matTex(M, f)}$, $\det = ${f(det)}$, so $T^{-1} = T_{A^{-1}}$ with $A^{-1} = ${matTex(inv, f)}$. Round trips: $T^{-1}(T(p)) = (${v.fix(back[0], 3)}, ${v.fix(back[1], 3)}) = p$ (error ${err < 1e-9 ? '0' : v.sci(err, 2)}), and $T(T^{-1}(q)) = q$ — both composites are identity maps.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.20
    {
      num: '1.20',
      kind: 'Theorem',
      name: 'A map is invertible iff it is bijective',
      statement: String.raw`A map $f:A\to B$ has an inverse $f^{-1}:B\to A$ if and only if $f$ is both one-to-one and onto.`,
      idea: String.raw`If $g$ is an inverse, then $f(a_1)=f(a_2)$ gives $a_1=g(f(a_1))=g(f(a_2))=a_2$, so $f$ is one-to-one; and any $b\in B$ equals $f(g(b))$, so $f$ is onto. Conversely, if $f$ is bijective, each $b$ has exactly one preimage — at least one because $f$ is onto, at most one because $f$ is one-to-one — and sending $b$ to it defines $g$. In the arrow picture: reverse every arrow; the reversed diagram is a map exactly when no element of $B$ has two arrows (that would fork) or none (it would dangle).`,
      caption: String.raw`Edit $f$ by dragging arrows, then choose **reverse the arrows**. A collision makes a reversed arrow fork (red) and a missed element is left dangling (red ring). The right panel tries $g$ = "first preimage" anyway and tests $g\circ f=\mathrm{id}_A$ and $f\circ g=\mathrm{id}_B$ element by element: green loops where the composite is the identity, red arrows where it is not. Only a bijection makes both sides all green.`,
      deps: ['alg-1.15a', 'alg-1.7a'],
      refs: ['Judson §1.2'],
      tags: ['functions', 'inverses'],
      viz(v) {
        const show = v.select('show', [{ value: 'f', label: '$f$' }, { value: 'rev', label: 'reverse the arrows' }], 'rev');
        const nA = v.slider('$|A|$', 1, 6, 4, { int: true }), nB = v.slider('$|B|$', 1, 6, 4, { int: true });
        let f = [1, 0, 1, 3, 4, 5];
        const s = v.stage({ x: [0, 10], y: [0, 6.8], axes: false, height: 330, weight: 1.3 });
        const t = v.stage({ x: [0, 10], y: [0, 6.8], axes: false, height: 330, weight: 1 });
        const geo = () => ({ A: colPts(nA.value, 2.5, 5.5, 1.1), B: colPts(nB.value, 7.5, 5.5, 1.1) });
        const fv = () => f.slice(0, nA.value).map((x) => Math.min(x, nB.value - 1));
        const ed = linkEditor(v, s, () => [{ pts: geo().A, to: 1 }, { pts: geo().B, to: null }], (c, i, j) => { f[i] = j; }, (c, i) => { if (c === 0) f[i] = (Math.min(f[i], nB.value - 1) + 1) % nB.value; });
        const LA = ['1', '2', '3', '4', '5', '6'], LB = ['a', 'b', 'c', 'd', 'e', 'f'];
        v.render(() => {
          const { A, B } = geo(), F = fv(), info = mapInfo(F, nB.value), rev = show.value === 'rev';
          drawBlob(v, s, A, { name: 'A', nameColor: 'blue', color: 'blue', fill: 'blue' }); drawBlob(v, s, B, { name: 'B', nameColor: 'red', color: 'red', fill: 'red' });
          F.forEach((b, a) => {
            const forked = info.hits[b].length > 1;
            if (rev) mapArrow(v, s, B[b], A[a], { color: forked ? 'red' : 'green', width: 2.2 });
            else mapArrow(v, s, A[a], B[b], { color: 'ink', width: 2 });
          });
          ed.rubber();
          drawElems(v, s, A, LA.slice(0, nA.value), { side: 'left' });
          drawElems(v, s, B, LB.slice(0, nB.value), { side: 'right', style: (j) => (!rev ? { color: 'ink' } : info.hits[j].length > 1 ? { color: 'red', ring: 'red' } : info.hits[j].length === 0 ? { color: 'red', hollow: true, ring: 'red' } : { color: 'green' }) });
          if (rev) B.forEach((p, j) => { const k = info.hits[j].length; if (k !== 1) s.text(k ? 'forks' : 'dangles', p[0], p[1], { dx: 26, dy: 0, size: 11, color: 'red', weight: 700 }); });
          s.text(rev ? 'reversed arrows B → A' : 'f : A → B', 5, 6.45, { align: 'center', size: 13, weight: 600, color: rev ? (info.bij ? 'green' : 'red') : 'ink' });
          // right panel: candidate g = first preimage (or a default), and the two composites
          const g = Array.from({ length: nB.value }, (_, j) => (info.hits[j].length ? info.hits[j][0] : 0));
          const PA = colPts(nA.value, 2.2, 5.5, 1.1), PB = colPts(nB.value, 7.0, 5.5, 1.1);
          drawBlob(v, t, PA, { padPx: 22 }); drawBlob(v, t, PB, { padPx: 22 });
          t.text('g ∘ f on A', 2.2, 6.45, { align: 'center', size: 12.5, weight: 700, math: false }); t.text('f ∘ g on B', 7.0, 6.45, { align: 'center', size: 12.5, weight: 700 });
          F.forEach((b, a) => { const r = g[b]; if (r === a) loopArrow(v, t, PA[a], { color: 'green', dir: 1 }); else mapArrow(v, t, PA[a], PA[r], { color: 'red', bend: 30, width: 2 }); });
          g.forEach((a, j) => { const r = info.hits[j].length ? F[a] : F[a]; if (r === j) loopArrow(v, t, PB[j], { color: 'green', dir: 1 }); else mapArrow(v, t, PB[j], PB[r], { color: 'red', bend: 30, width: 2, dash: info.hits[j].length ? false : [4, 3] }); });
          drawElems(v, t, PA, LA.slice(0, nA.value), { side: 'left', size: 13 }); drawElems(v, t, PB, LB.slice(0, nB.value), { side: 'left', size: 13 });
        });
        v.readout(() => {
          const F = fv(), info = mapInfo(F, nB.value);
          if (info.bij) return String.raw`$f$ is a **bijection**, so reversing the arrows gives a map $f^{-1} : B\to A$ (${info.hits.map((h, j) => String.raw`$${LB[j]}\mapsto ${LA[h[0]]}$`).join(', ')}) with $f^{-1}\circ f = \mathrm{id}_A$ and $f\circ f^{-1} = \mathrm{id}_B$.`;
          const bits = [];
          if (!info.inj) bits.push(`$${LB[info.collisions[0][0]]}$ has two preimages, so $g(${LB[info.collisions[0][0]]})$ cannot be both and $g\\circ f \\ne \\mathrm{id}_A$`);
          if (!info.surj) bits.push(`$${info.missed.map((j) => LB[j]).join(', ')}$ ${info.missed.length > 1 ? 'have' : 'has'} no preimage, so whatever $g$ does there, $f\\circ g \\ne \\mathrm{id}_B$`);
          return `**No inverse:** ${bits.join('; ')}. (${info.inj ? 'Being one-to-one, $f$ still has a *left* inverse: $g\\circ f = \\mathrm{id}_A$ holds.' : info.surj ? 'Being onto, $f$ still has a *right* inverse: $f\\circ g = \\mathrm{id}_B$ holds.' : 'Neither composite can be the identity.'})`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.20a
    {
      num: '1.20a',
      kind: 'Definition',
      name: 'Equivalence relation',
      statement: String.raw`An **equivalence relation** on a set $X$ is a relation $R\subset X\times X$, written $x\sim y$ for $(x,y)\in R$, that is
- **reflexive**: $x\sim x$ for all $x\in X$;
- **symmetric**: $x\sim y$ implies $y\sim x$;
- **transitive**: $x\sim y$ and $y\sim z$ imply $x\sim z$.`,
      idea: String.raw`An equivalence relation is a weakened equality: it says when two elements are "the same for present purposes" — fractions with $ps=qr$, functions with equal derivatives, points at the same distance from the origin, similar matrices, integers with the same remainder. On a finite set it is a 0/1 matrix: reflexive means the diagonal is full, symmetric means the matrix equals its transpose, and transitive means that whenever $(x,y)$ and $(y,z)$ are filled so is $(x,z)$. Any relation can be closed up into the smallest equivalence relation containing it.`,
      caption: String.raw`Click cells of the matrix ($x$ down, $y$ across) to switch $x\sim y$ on or off, or start from a preset. Failures are marked live: a missing diagonal cell (red), a missing mirror image (orange), and one transitivity failure — the gold pair $x\sim y$, $y\sim z$ forcing the red cell $x\sim z$. The graph on the right draws the same relation (loops = diagonal). **Close up** adds exactly what the three axioms force.`,
      deps: ['alg-1.4a'],
      refs: ['Judson §1.2'],
      tags: ['relations'],
      viz(v) {
        const n = 6, X = [1, 2, 3, 4, 5, 6];
        const PRE = { eq: (a, b) => a === b, par: (a, b) => (a - b) % 2 === 0, le: (a, b) => a <= b, div: (a, b) => b % a === 0, near: (a, b) => Math.abs(a - b) <= 1, mod3: (a, b) => (a - b) % 3 === 0, none: () => false };
        let R = zeros(n);
        const load = (k) => { R = X.map((a) => X.map((b) => PRE[k](a, b))); };
        v.select('preset', [{ value: 'eq', label: '$=$' }, { value: 'par', label: 'same parity' }, { value: 'le', label: '$\\le$' }, { value: 'div', label: '$x\\mid y$' }, { value: 'near', label: '$|x-y|\\le 1$' }, { value: 'mod3', label: '$3\\mid x-y$' }, { value: 'none', label: 'empty' }], 'near', { onChange: load });
        v.button('Close up', () => { R = eqClosure(R); });
        load('near');
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1 });
        const g = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 1 });
        const T = v.table(s, { rows: n, cols: n, maxCell: 44, size: 15, rowLabels: X.map(String), colLabels: X.map(String) });
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) R[c.i][c.j] = !R[c.i][c.j]; });
        const G = v.graph(g, { nodes: X.map((x, i) => ({ id: i, label: String(x), x: 0.25 + 0.82 * Math.sin((i * Math.PI) / 3), y: -0.08 + 0.82 * Math.cos((i * Math.PI) / 3) })), edges: [], layout: 'none', directed: true, draggable: false, r: 14 });
        v.render(() => {
          const C = relChecks(R), w = C.trans[0];
          const hl = [];
          for (const i of C.refl) hl.push([i, i, 'red']);
          for (const [i, j] of C.sym) hl.push([j, i, 'orange']);
          if (w) { hl.push([w[0], w[1], 'gold'], [w[1], w[2], 'gold'], [w[0], w[2], 'red']); }
          T.draw({ value: (i, j) => (R[i][j] ? '1' : ''), fill: (i, j) => (R[i][j] ? ['accent', i === j ? 0.42 : 0.28] : i === j ? ['muted', 0.07] : null), highlight: hl });
          const E = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (R[i][j]) E.push({ from: i, to: j });
          if (w) E.push({ from: w[0], to: w[2], ghost: true });
          G.edges = E;
          G.draw({
            edgeColor: (e) => (e.ghost ? 'red' : w && ((e.from === w[0] && e.to === w[1]) || (e.from === w[1] && e.to === w[2])) ? 'gold' : e.from !== e.to && !R[e.to][e.from] ? 'orange' : e.from === e.to ? 'accent' : 'muted'),
            edgeDash: (e) => (e.ghost ? [5, 4] : null), edgeWidth: (e) => (e.ghost || (w && ((e.from === w[0] && e.to === w[1]) || (e.from === w[1] && e.to === w[2]))) ? 2.6 : null),
            nodeRing: (id) => (C.refl.includes(+id) ? 'red' : null),
          });
          const badge = (ok, txt, k) => g.text(`${tick(ok)} ${txt}`, -1.4, 1.22 - k * 0.2, { size: 12.5, weight: 700, color: ok ? 'green' : 'red' });
          badge(!C.refl.length, 'reflexive', 0); badge(!C.sym.length, 'symmetric', 1); badge(!C.trans.length, 'transitive', 2);
        });
        v.readout(() => {
          const C = relChecks(R);
          if (C.ok) { const cls = classesOf(R); return `**An equivalence relation.** It cuts $X = \\{1, \\ldots, 6\\}$ into ${cls.length} class${cls.length > 1 ? 'es' : ''}: ${cls.map((c) => setList(c.map((i) => X[i]))).map((t) => `$${t}$`).join(', ')}.`; }
          const bits = [];
          if (C.refl.length) bits.push(`not reflexive: ${C.refl.map((i) => `$${X[i]}\\not\\sim ${X[i]}$`).join(', ')}`);
          if (C.sym.length) bits.push(`not symmetric: $${X[C.sym[0][0]]}\\sim ${X[C.sym[0][1]]}$ but $${X[C.sym[0][1]]}\\not\\sim ${X[C.sym[0][0]]}$`);
          if (C.trans.length) { const [i, j, k] = C.trans[0]; bits.push(`not transitive: $${X[i]}\\sim ${X[j]}$ and $${X[j]}\\sim ${X[k]}$ but $${X[i]}\\not\\sim ${X[k]}$`); }
          return `**Not an equivalence relation** — ${bits.join('; ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.24a
    {
      num: '1.24a',
      kind: 'Definition',
      name: 'Equivalence classes and partitions',
      statement: String.raw`A **partition** of a set $X$ is a collection of nonempty subsets $X_1,X_2,\ldots$ that are pairwise disjoint ($X_i\cap X_j=\varnothing$ for $i\ne j$) and whose union is $X$. If $\sim$ is an equivalence relation on $X$ and $x\in X$, the **equivalence class** of $x$ is
$$[x]=\{y\in X : y\sim x\}.$$`,
      idea: String.raw`The class $[x]$ collects everything indistinguishable from $x$. Typically an equivalence relation is "having the same value of some quantity" $\varphi$ — distance from the origin, $y-x$, $x^2-y^2$, the integer parts of the coordinates — and then the classes are the level sets of $\varphi$, which tile the space without overlapping. Judson's example on $\mathbb R^2$, $(x_1,y_1)\sim(x_2,y_2)$ iff $x_1^2+y_1^2=x_2^2+y_2^2$, has the circles about the origin as its classes (and the origin alone).`,
      caption: String.raw`Choose a relation on the plane; the background colours its classes (one colour per band of values). Drag $p$ and $q$: their classes $[p]$ (blue) and $[q]$ (orange) are drawn in full, and they are either the same set or disjoint. The last choice, "distance $<1$", is **not** transitive: its would-be classes are overlapping discs, and the readout exhibits the failure.`,
      deps: ['alg-1.20a'],
      refs: ['Judson §1.2'],
      tags: ['relations', 'partitions'],
      viz(v) {
        const REL = {
          rad: { f: (x, y) => Math.hypot(x, y), w: 0.5, name: String.raw`|p|`, desc: 'same distance from the origin' },
          diag: { f: (x, y) => y - x, w: 0.7, name: String.raw`y - x`, desc: 'same value of y − x' },
          hyp: { f: (x, y) => x * x - y * y, w: 1, name: String.raw`x^2 - y^2`, desc: 'same value of x² − y²' },
          cell: { f: (x, y) => Math.floor(x) * 31 + Math.floor(y), w: 1, name: String.raw`(\lfloor x\rfloor, \lfloor y\rfloor)`, desc: 'same integer parts' },
          near: { desc: 'distance less than 1' },
        };
        const mode = v.select('relation', [{ value: 'rad', label: 'same $|p|$' }, { value: 'diag', label: 'same $y-x$' }, { value: 'hyp', label: 'same $x^2-y^2$' }, { value: 'cell', label: 'same $\\lfloor\\cdot\\rfloor$' }, { value: 'near', label: 'distance $<1$' }], 'rad');
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'x', ylabel: 'y' });
        const p = s.handle(1.3, 0.9, { color: 'accent', label: 'p' }), q = s.handle(-0.9, -1.75, { color: 'orange', label: 'q' });
        const BANDS = ['blue', 'teal', 'green', 'gold', 'orange', 'pink', 'purple'];
        const cls = (k, x, y) => {
          const R = REL[k], val = R.f(x, y);
          if (k === 'cell') { const a = Math.floor(x), b = Math.floor(y); return ((a * 3 + b * 5) % 7 + 7) % 7; }
          return ((Math.floor(val / R.w) % 7) + 7) % 7;
        };
        const drawClass = (k, h, col) => {
          const R = REL[k];
          if (k === 'rad') s.circle(0, 0, Math.hypot(h.x, h.y), { color: col, width: 3.2, fill: false });
          else if (k === 'diag') { const c = h.y - h.x; s.line(-5, -5 + c, 5, 5 + c, { color: col, width: 3.2 }); }
          else if (k === 'hyp') s.contour((x, y) => x * x - y * y, [R.f(h.x, h.y)], { color: col, width: 3.2, res: 160 });
          else if (k === 'cell') { const a = Math.floor(h.x), b = Math.floor(h.y); s.rect(a, b, a + 1, b + 1, { color: col, width: 3.2, fill: col, fillAlpha: 0.2 }); }
        };
        v.render(() => {
          const k = mode.value;
          if (k !== 'near') {
            const cols = BANDS.map((c) => v.ramp(0.2, c));
            s.raster((x, y) => cols[cls(k, x, y)], { key: k, res: 2 });
            drawClass(k, q, 'orange'); drawClass(k, p, 'accent');
          } else {
            s.circle(p.x, p.y, 1, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.14 });
            s.circle(q.x, q.y, 1, { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.14 });
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d >= 1 && d < 2) { const z = [(p.x + q.x) / 2, (p.y + q.y) / 2]; s.dot(z[0], z[1], { r: 6, color: 'red', label: 'z', labelPos: 'n', labelColor: 'red' }); s.line(p.x, p.y, z[0], z[1], { color: 'red', width: 1.4, dash: [4, 3] }); s.line(q.x, q.y, z[0], z[1], { color: 'red', width: 1.4, dash: [4, 3] }); }
          }
        });
        v.readout(() => {
          const k = mode.value;
          if (k === 'near') {
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d >= 1 && d < 2) return String.raw`"Distance $< 1$" is reflexive and symmetric but **not transitive**: the midpoint $z$ has $p\sim z$ and $z\sim q$ ($|p-z| = |z-q| = ${v.fix(d / 2, 2)} < 1$), yet $|p-q| = ${v.fix(d, 2)}$, so $p\not\sim q$. The discs "$[p]$" and "$[q]$" overlap without being equal — no partition.`;
            return String.raw`$|p - q| = ${v.fix(d, 2)}$. Move the points so that $1 \le |p-q| < 2$ to see transitivity fail; the discs of radius $1$ around them can never form a partition of the plane.`;
          }
          const R = REL[k], fp = R.f(p.x, p.y), fq = R.f(q.x, q.y), same = Math.abs(fp - fq) < (k === 'cell' ? 0.5 : 0.04);
          const show = (val, h) => (k === 'cell' ? `(${Math.floor(h.x)}, ${Math.floor(h.y)})` : v.fix(val, 2));
          return String.raw`Classes are the sets of constant $${R.name}$ (${R.desc}). $${R.name} = ${show(fp, p)}$ at $p$ and $${show(fq, q)}$ at $q$: ${same ? String.raw`$p\sim q$, so $[p] = [q]$ — **the same class**.` : String.raw`$p\not\sim q$, and $[p]\cap[q] = \varnothing$ — **disjoint classes**.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.25
    {
      num: '1.25',
      kind: 'Theorem',
      name: 'Equivalence relations correspond to partitions',
      statement: String.raw`If $\sim$ is an equivalence relation on a set $X$, its equivalence classes form a partition of $X$. Conversely, if $\{X_i\}$ is a partition of $X$, then "$x\sim y$ iff $x$ and $y$ lie in the same $X_i$" is an equivalence relation on $X$ whose classes are exactly the $X_i$.`,
      idea: String.raw`From relation to partition: reflexivity puts $x$ in $[x]$, so the classes are nonempty and cover $X$; if $z\in[x]\cap[y]$ then $z\sim x$ and $z\sim y$, and symmetry plus transitivity give $x\sim y$, hence $[x]=[y]$ — two classes are disjoint or equal. From partition to relation: "same block" is clearly reflexive, symmetric and transitive. The two constructions undo each other, so equivalence relations on an $n$-set are counted by the Bell numbers, like partitions.`,
      caption: String.raw`Drag the numbered tokens between bins (or into the dashed bin to start a new class): the relation matrix on the right fills in as one block per bin — with **order by class** on, the blocks sit on the diagonal. Or edit the matrix: switching on $x\sim y$ merges the two classes (transitivity forces the whole block), switching it off moves $y$ into a class of its own. Either way the two pictures stay in step.`,
      deps: ['alg-1.24a'],
      see: ['comb-1.13', 'comb-1.14'],
      refs: ['Judson §1.2'],
      tags: ['relations', 'partitions'],
      viz(v) {
        const N = v.slider('$|X|$', 3, 8, 7, { int: true, onChange: (n) => { block = block.map((b, i) => (i < n ? b : i)); norm(); } });
        const sorted = v.toggle('order by class', true);
        let block = [0, 1, 0, 2, 1, 0, 3, 4];
        const norm = () => { const n = N.value, map = new Map(); block = block.map((b, i) => { if (i >= n) return b; if (!map.has(b)) map.set(b, map.size); return map.get(b); }); };
        norm();
        const s = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 340, weight: 1.15 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1 });
        const T = v.table(t, { rows: 7, cols: 7, maxCell: 40, size: 14 });
        const BW = 3.05, BH = 1.95, bin = (k) => { const c = k % 3, r = Math.floor(k / 3); return [0.2 + c * 3.25, 6.85 - (r + 1) * 2.2 + 0.25]; };
        const tokenPos = (n) => {
          const nb = Math.max(...block.slice(0, n)) + 1, pos = [];
          for (let b = 0; b < nb; b++) { const mem = [...Array(n).keys()].filter((i) => block[i] === b), [x0, y0] = bin(b); mem.forEach((i, k) => { pos[i] = [x0 + 0.45 + (k % 4) * 0.72, y0 + BH - 0.5 - Math.floor(k / 4) * 0.82]; }); }
          return { pos, nb };
        };
        let drag = null;
        s.onDrag((x, y, ph) => {
          const n = N.value, { pos, nb } = tokenPos(n);
          if (ph === 'start') { drag = null; for (let i = 0; i < n; i++) if (Math.hypot(s.X(pos[i][0]) - s.X(x), s.Y(pos[i][1]) - s.Y(y)) < 16) drag = { i, x, y }; return; }
          if (!drag) return;
          if (ph === 'move') { drag.x = x; drag.y = y; return; }
          for (let b = 0; b <= Math.min(nb, 8); b++) { const [x0, y0] = bin(b); if (x >= x0 && x <= x0 + BW && y >= y0 && y <= y0 + BH) { block[drag.i] = b === nb ? 99 : b; norm(); break; } }
          drag = null;
        });
        const order = () => { const n = N.value, ids = [...Array(n).keys()]; return sorted.value ? ids.sort((a, b) => block[a] - block[b] || a - b) : ids; };
        t.onClick((x, y) => {
          const c = T.hit(x, y); if (!c || c.i < 0 || c.j < 0) return;
          const o = order(), a = o[c.i], b = o[c.j]; if (a === b) return;
          if (block[a] === block[b]) block[b] = 99; else { const ob = block[b]; block = block.map((k, i) => (i < N.value && k === ob ? block[a] : k)); }
          norm();
        });
        v.render(() => {
          const n = N.value, { pos, nb } = tokenPos(n), o = order();
          for (let b = 0; b <= Math.min(nb, 8); b++) {
            const [x0, y0] = bin(b), isNew = b === nb;
            if (isNew && nb >= 9) break;
            s.rect(x0, y0, x0 + BW, y0 + BH, { radius: 14, fill: isNew ? false : CAT[b % 8], fillAlpha: 0.1, color: isNew ? 'muted' : CAT[b % 8], width: 1.6, dash: isNew ? [5, 4] : false });
            s.text(isNew ? 'new class' : `X${'₁₂₃₄₅₆₇₈'[b]}`, x0 + 0.15, y0 + 0.22, { size: 12, color: isNew ? 'muted' : CAT[b % 8], weight: 700 });
          }
          for (let i = 0; i < n; i++) {
            const [x, y] = drag && drag.i === i ? [drag.x, drag.y] : pos[i];
            s.dot(x, y, { r: 14, color: CAT[block[i] % 8] });
            s.text(String(i + 1), x, y, { align: 'center', size: 14, weight: 700, color: 'panel', halo: false });
          }
          const R = relOfBlocks(block.slice(0, n));
          T.draw({
            rows: n, cols: n, rowLabels: o.map((i) => String(i + 1)), colLabels: o.map((i) => String(i + 1)),
            value: (i, j) => (R[o[i]][o[j]] ? '1' : ''), fill: (i, j) => (R[o[i]][o[j]] ? [CAT[block[o[i]] % 8], 0.38] : null),
            rowLabelColor: (i) => CAT[block[o[i]] % 8], colLabelColor: (j) => CAT[block[o[j]] % 8],
          });
          if (sorted.value) { let i0 = 0; while (i0 < n) { let i1 = i0; while (i1 + 1 < n && block[o[i1 + 1]] === block[o[i0]]) i1++; T.box(i0, i0, i1, i1, { color: CAT[block[o[i0]] % 8], width: 2.4 }); i0 = i1 + 1; } }
        });
        v.readout(() => {
          const n = N.value, nb = Math.max(...block.slice(0, n)) + 1, blocks = Array.from({ length: nb }, (_, b) => [...Array(n).keys()].filter((i) => block[i] === b).map((i) => i + 1));
          const size = blocks.reduce((a, b) => a + b.length * b.length, 0), C = relChecks(relOfBlocks(block.slice(0, n)));
          return String.raw`Partition $\{${blocks.map((b) => setList(b)).join(', ')}\}$ of $X = \{1, \ldots, ${n}\}$ ↔ the relation "same bin", with $|R| = ${blocks.map((b) => `${b.length}^2`).join(' + ')} = ${size}$ pairs — reflexive ${tick(!C.refl.length)}, symmetric ${tick(!C.sym.length)}, transitive ${tick(!C.trans.length)}; its classes are the ${nb} bins. There are $B_{${n}} = ${bell(n)[n]}$ partitions of a ${n}-element set, hence exactly as many equivalence relations.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.26
    {
      num: '1.26',
      kind: 'Corollary',
      name: 'Equivalence classes are disjoint or equal',
      statement: String.raw`For an equivalence relation $\sim$ on $X$ and any $x,y\in X$, either $[x]=[y]$ or $[x]\cap[y]=\varnothing$.`,
      idea: String.raw`This is the heart of Theorem 1.25: if some $z$ lies in both classes, then $x\sim z$ (symmetry) and $z\sim y$, so $x\sim y$ (transitivity); then everything equivalent to $x$ is equivalent to $y$ and vice versa. So two classes cannot partly overlap — one shared element makes them identical. Without transitivity this collapses: "neighbourhood" relations produce overlapping blobs.`,
      caption: String.raw`Lattice points $(q,p)$ stand for fractions $p/q$ ($q\ne0$; the column $q=0$ is excluded), related by $p/q\sim r/s$ iff $ps=qr$ — Judson's example. Drag $x$ and $y$: each class is the set of lattice points on a line through the origin, so two classes are the same line or share nothing. Switch to the non-transitive relation "values differ by less than $\tfrac14$" and the would-be classes overlap only partly.`,
      deps: ['alg-1.25'],
      refs: ['Judson §1.2'],
      tags: ['relations', 'partitions'],
      viz(v) {
        const fake = v.toggle('use "$|p/q - r/s| < \\tfrac14$" instead (not transitive)', false);
        const s = v.stage({ x: [-6.5, 6.5], y: [-6.5, 6.5], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'denominator q', ylabel: 'numerator p', xticks: [-6, -4, -2, 0, 2, 4, 6], yticks: [-6, -4, -2, 0, 2, 4, 6] });
        const snap = (x, y) => { let qx = Math.round(x), py = Math.round(y); if (qx === 0) qx = x < 0 ? -1 : 1; return [v.M.clamp(qx, -6, 6), v.M.clamp(py, -6, 6)]; };
        const X = s.handle(4, 2, { color: 'accent', label: 'x', constrain: snap }), Y = s.handle(-3, 4, { color: 'orange', label: 'y', constrain: snap });
        const pts = []; for (let q = -6; q <= 6; q++) for (let p = -6; p <= 6; p++) if (q) pts.push([q, p]);
        const inCls = (h, [q, p]) => (fake.value ? Math.abs(p / q - h.y / h.x) < 0.25 : p * h.x === q * h.y);
        v.render(() => {
          for (let p = -6; p <= 6; p++) s.text('×', 0, p, { align: 'center', size: 10, color: 'faint', halo: false });
          if (!fake.value) [[Y, 'orange'], [X, 'accent']].forEach(([h, c]) => { const L = 12 / Math.hypot(h.x, h.y); s.line(-h.x * L, -h.y * L, h.x * L, h.y * L, { color: c, width: 1.4, alpha: 0.5, dash: [5, 4] }); });
          for (const pt of pts) {
            const a = inCls(X, pt), b = inCls(Y, pt);
            if (a && b) { s.dot(pt[0], pt[1], { r: 6.5, color: fake.value ? 'red' : 'accent' }); s.dot(pt[0], pt[1], { r: 3, color: 'orange', ring: false }); }
            else if (a) s.dot(pt[0], pt[1], { r: 5.5, color: 'accent' });
            else if (b) s.dot(pt[0], pt[1], { r: 5.5, color: 'orange' });
            else s.dot(pt[0], pt[1], { r: 2, color: 'muted', ring: false });
          }
        });
        v.readout(() => {
          const [p, q] = [X.y, X.x], [r, ss] = [Y.y, Y.x], P = (z) => (z < 0 ? `(${z})` : z), fx = reduce(p, q), fy = reduce(r, ss), cx = pts.filter((pt) => inCls(X, pt)), cy = pts.filter((pt) => inCls(Y, pt));
          const both = cx.filter((pt) => inCls(Y, pt)), onlyX = cx.filter((pt) => !inCls(Y, pt)), lab = ([qq, pp]) => `${pp}/${qq}`;
          if (fake.value) {
            if (both.length && onlyX.length) return String.raw`Overlap without equality: $${lab(both[0])}$ is within $\tfrac14$ of both $x = ${p}/${q}$ and $y = ${r}/${ss}$, but $${lab(onlyX[0])}$ is close to $x$ and not to $y$. Transitivity fails, so these "classes" do not partition the fractions.`;
            return String.raw`Here the two blobs ${both.length ? 'coincide' : 'happen to be disjoint'}; move $x$ or $y$ (e.g. $x = 1/2$, $y = 3/4$) until they overlap only partly — impossible for a genuine equivalence relation.`;
          }
          const eq = p * ss === q * r;
          return String.raw`$x = ${p}/${P(q)}$, $y = ${r}/${P(ss)}$: $p\,s = ${p * ss}$ and $q\,r = ${q * r}$, so ${eq ? String.raw`$x\sim y$ and $[x] = [y]$ — the same line, all ${cx.length} points shared (each equals $${fx[0]}/${fx[1]}$ in lowest terms).` : String.raw`$x\not\sim y$, and $[x]\cap[y] = \varnothing$: two different lines through the origin meet only at $(0, 0)$, which is not a fraction. ($[x]$ is $${fx[0]}/${fx[1]}$ with ${cx.length} names here, $[y]$ is $${fy[0]}/${fy[1]}$ with ${cy.length}.)`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.30
    {
      num: '1.30',
      kind: 'Concept',
      name: 'Congruence modulo n',
      statement: String.raw`Fix $n\in\mathbb N$. Integers $r$ and $s$ are **congruent modulo $n$**, written $r\equiv s \pmod n$, if $n$ divides $r-s$, i.e. $r-s=nk$ for some $k\in\mathbb Z$. This is an equivalence relation on $\mathbb Z$, and it has exactly $n$ classes
$$[0],[1],\ldots,[n-1],\qquad [r]=\{\ldots,\,r-n,\,r,\,r+n,\,r+2n,\ldots\},$$
which partition $\mathbb Z$. For example $41\equiv17\pmod 8$, since $41-17=24=3\cdot8$.`,
      idea: String.raw`Reflexive: $r-r=0=0\cdot n$. Symmetric: $r-s=nk$ gives $s-r=n(-k)$. Transitive: $r-s=kn$ and $s-t=ln$ add up to $r-t=(k+l)n$. By the division algorithm every integer is $qn+r$ with $0\le r<n$, so it lies in exactly one of the classes $[0],\ldots,[n-1]$ — wrap the number line around a clock with $n$ hours and each hour is a class. These classes will be the elements of $\mathbb Z_n$ in Chapter 3.`,
      caption: String.raw`The integers wind around a clock with $n$ hours (slider), one turn per $n$ numbers, so congruent numbers line up along the same spoke and share a colour; the strip below shows the same colouring on the number line. Set $a$ and $b$ with the sliders, or click a number on the spiral to make it $b$; the readout checks whether $n\mid a-b$.`,
      deps: ['alg-1.20a'],
      see: ['nt-2.1'],
      refs: ['Judson §1.2'],
      tags: ['congruences', 'relations'],
      credit: 'Gauss, Disquisitiones Arithmeticae, 1801',
      viz(v) {
        const N = v.slider('$n$', 2, 15, 8, { int: true });
        const A = v.slider('$a$', -20, 60, 41, { int: true }), B = v.slider('$b$', -20, 60, 17, { int: true });
        const s = v.stage({ x: [-4.4, 4.4], y: [-4.25, 4.25], equal: true, axes: false, height: 370, full: true });
        const L = v.stage({ x: [-0.5, 1], y: [-1, 1], axes: false, height: 92, full: true });
        const HUES = ['blue', 'orange', 'green', 'purple', 'red', 'teal', 'gold', 'pink'];
        const col = (r, n) => { if (n <= 8) return HUES[r]; const t = (r / n) * 8, k = Math.floor(t); return v.mix(v.color(HUES[k % 8]), v.color(HUES[(k + 1) % 8]), t - k); };
        const rng = () => { const n = N.value, lo = Math.min(-n, A.value, B.value), hi = Math.max(4 * n - 1, A.value, B.value); return { n, lo: lo - (((lo % n) + n) % n), hi }; };
        const place = (k, R) => { const { n, lo, hi } = R, r = ((k % n) + n) % n, ang = Math.PI / 2 - (2 * Math.PI * r) / n, rad = 1.0 + (2.75 * (k - lo)) / (hi - lo + 1); return [rad * Math.cos(ang), rad * Math.sin(ang)]; };
        s.onClick((x, y) => { const R = rng(); let best = null, bd = 14; for (let k = R.lo; k <= R.hi; k++) { const [px, py] = place(k, R), d = Math.hypot(s.X(px) - s.X(x), s.Y(py) - s.Y(y)); if (d < bd) { bd = d; best = k; } } if (best != null) B.set(Math.max(-20, Math.min(60, best))); });
        v.render(() => {
          const R = rng(), { n, lo, hi } = R, cnt = hi - lo + 1, r0 = Math.max(4.5, Math.min(11, 440 / cnt));
          for (let r = 0; r < n; r++) {
            const ang = Math.PI / 2 - (2 * Math.PI * r) / n;
            s.line(0.75 * Math.cos(ang), 0.75 * Math.sin(ang), 3.85 * Math.cos(ang), 3.85 * Math.sin(ang), { color: col(r, n), width: 1, alpha: 0.35 });
            s.text(`[${r}]`, 4.12 * Math.cos(ang), 4.12 * Math.sin(ang), { align: 'center', size: 13, weight: 700, color: col(r, n) });
          }
          const sp = []; for (let t = lo; t <= hi + 1; t += 0.05) { const { n: nn } = R, ang = Math.PI / 2 - (2 * Math.PI * (t - lo)) / nn, rad = 1.0 + (2.75 * (t - lo)) / cnt; sp.push([rad * Math.cos(ang), rad * Math.sin(ang)]); }
          s.path(sp, { color: 'faint', width: 1 });
          for (let k = lo; k <= hi; k++) {
            const [x, y] = place(k, R), r = ((k % n) + n) % n, sel = k === A.value || k === B.value;
            s.dot(x, y, { r: sel ? r0 + 3 : r0, color: col(r, n) });
            if (r0 >= 7) s.text(String(k), x, y, { align: 'center', size: Math.min(11, r0 * 1.05), weight: 700, color: 'panel', halo: false });
            if (sel) { const c = s.ctx; c.save(); c.beginPath(); c.arc(s.X(x), s.Y(y), r0 + 7, 0, 2 * Math.PI); c.strokeStyle = v.color('ink'); c.lineWidth = 2.2; c.stroke(); c.restore(); s.text(k === A.value ? 'a' : 'b', x, y, { dx: -(r0 + 10), dy: r0 + 4, align: 'right', math: true, size: 15, weight: 700, plate: true }); }
          }
          // the number line strip
          const k0 = Math.min(-n, A.value, B.value) - 1, k1 = Math.max(3 * n, A.value, B.value) + 1;
          L.setView([k0 - 0.5, k1 + 0.5], [-1, 1]);
          L.line(k0 - 0.5, 0, k1 + 0.5, 0, { color: 'muted', width: 1 });
          const step = (k1 - k0) > 50 ? 10 : 5;
          for (let k = k0; k <= k1; k++) {
            const r = ((k % n) + n) % n, sel = k === A.value || k === B.value;
            L.dot(k, 0, { r: sel ? 6.5 : 4.2, color: col(r, n) });
            if (sel) L.text(k === A.value ? 'a' : 'b', k, 0, { dy: -15, align: 'center', math: true, size: 14, weight: 700 });
            if (k % step === 0) L.text(String(k), k, 0, { dy: 16, align: 'center', size: 10.5, color: 'muted' });
          }
        });
        v.readout(() => {
          const n = N.value, a = A.value, b = B.value, d = a - b, ra = ((a % n) + n) % n, rb = ((b % n) + n) % n, cong = d % n === 0;
          const cls = (r) => `\\{\\ldots, ${r - 2 * n}, ${r - n}, ${r}, ${r + n}, ${r + 2 * n}, \\ldots\\}`;
          return String.raw`$a - b = ${a} - ${b < 0 ? String.raw`(${b})` : b} = ${d}$ ${cong ? String.raw`$= ${d / n}\cdot ${n}$, so $${a}\equiv ${b} \pmod{${n}}$: both lie in $[${ra}] = ${cls(ra)}$.` : String.raw`is not a multiple of ${n} (remainder ${((d % n) + n) % n}), so $${a}\not\equiv ${b} \pmod{${n}}$: $a\in[${ra}]$ and $b\in[${rb}]$, disjoint classes.`} The ${n} classes $[0], \ldots, [${n - 1}]$ partition $\mathbb Z$.`;
        });
      },
    },
  ],
};
