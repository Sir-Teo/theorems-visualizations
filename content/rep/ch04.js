// Representation Theory — Chapter 4: Character tables of small groups
// Part 1 (this file): 4.1–4.6. Part 2 (ch04-b.js): 4.7–4.12. Shared machinery: ch04.shared.js.
import { TAU, ecol, nm, drawMoved, tableOf, ip, tableDefect, cabs, csub, cmul, cconj, cadd, csc, ctext, ctex, cexp, dihTable, dihClassName, closeGroup, tetraData, rotClasses, axisAngle, rodrigues, m3v, tr3, cubeData, actOn, elOrder, elOf, cycTex } from './ch04.shared.js';

const fmtZ = (z) => ctext(z).replace(/^-0$/, '0');
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export default {
  collection: 'rep',
  chapter: 4,
  title: 'Character tables of small groups',
  summary: String.raw`Character tables of cyclic, dihedral, alternating and symmetric groups can be filled in from geometry: rotation angles of polyhedra, fixed points of permutations, and orthogonality. Different groups can share a table, and the Frobenius–Schur indicator tells whether an irreducible is real, complex or quaternionic. In chemistry and physics the same tables count vibrational modes and decide which transitions are allowed.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Proposition',
      name: 'Characters of finite abelian groups',
      statement: String.raw`Let $G=\mathbb Z/m\times\mathbb Z/n$ (the same holds for any finite abelian group). Its irreducible characters are the $mn$ homomorphisms $\chi_{a,b}(x,y)=e^{2\pi i(ax/m+by/n)}$, $0\le a<m$, $0\le b<n$. They are orthonormal, $\langle\chi_{a,b},\chi_{a',b'}\rangle=\delta_{aa'}\delta_{bb'}$, they multiply pointwise, $\chi_{a,b}\chi_{a',b'}=\chi_{a+a',b+b'}$, and so they form a group $\widehat G\cong G$.`,
      idea: String.raw`All irreducibles of an abelian group are one-dimensional (2.6), so an irreducible character is a homomorphism $G\to\mathbb C^\times$ and must send the generators to roots of unity of the right orders; this leaves exactly $mn$ choices, one for each pair $(a,b)$. Orthonormality is 3.5 in this case, and can be seen directly because a nontrivial character sums to zero over the group (the roots of unity add up to $0$). Multiplying two homomorphisms gives a homomorphism, which is the group structure on $\widehat G$.`,
      caption: String.raw`Choose $m$ and $n$. Each row of the grid is one character, each column a group element; the colour is the phase of $\chi_{a,b}(x,y)$ (the number printed in a cell is the exponent $e$ in $e^{2\pi i e/(mn)}$). Click two rows: the readout computes their inner product ($0$ unless they are the same row) and checks that the pointwise product of the two rows is again a row of the table, namely the one labelled by the sum.`,
      deps: ['rep-2.6'],
      refs: ['Serre §5.1', 'Serre §3.1'],
      tags: ['abelian groups', 'character table', 'duality'],
      credit: 'Characters of abelian groups: Gauss and Dirichlet (as roots-of-unity sums); the dual group, Pontryagin, 1934 (for locally compact groups)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Character_group' },
      viz(v) {
        const ms = v.slider('$m$', 1, 6, 2, { int: true }), ns = v.slider('$n$', 1, 6, 3, { int: true });
        let sel = [0, 1];
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, weight: 1 });
        const T = v.table(S, { square: true, maxCell: 54, minCell: 6, size: 11, labelSize: 10, margin: 6 });
        const els = () => { const m = ms.value, n = ns.value, L = []; for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) L.push([a, b]); return L; };
        const expo = (r, c) => { const m = ms.value, n = ns.value; return ((r[0] * c[0] * n + r[1] * c[1] * m) % (m * n) + m * n) % (m * n); };
        S.onClick((x, y) => { const h = T.hit(x, y); if (!h) return; const r = h.i >= 0 ? h.i : -1; if (r >= 0) sel = [sel[1], r]; });
        v.render(() => {
          const L = els(), N = L.length, N2 = ms.value * ns.value;
          if (sel[0] >= N || sel[1] >= N) sel = [0, Math.min(1, N - 1)];
          T.draw({
            rows: N, cols: N, rowLabels: (i) => (N <= 12 ? `(${L[i]})` : ''), colLabels: (j) => (N <= 12 ? `(${L[j]})` : ''), cornerLabel: N <= 12 ? '$\\chi_{a,b}\\backslash(x,y)$' : '',
            value: (i, j) => (N <= 12 ? String(expo(L[i], L[j])) : null),
            fill: (i, j) => v.M.hsl2rgb(expo(L[i], L[j]) / N2, 0.62, 0.58),
            highlight: sel.map((r, k) => null).filter(Boolean),
            activeRow: sel[1],
            activeColor: 'ink',
          });
        });
        v.readout(() => {
          const L = els(), N = L.length, N2 = ms.value * ns.value, [r1, r2] = sel;
          const z = (r, c) => cexp((TAU * expo(L[r], L[c])) / N2);
          let s = [0, 0]; for (let c = 0; c < N; c++) s = cadd(s, cmul(z(r1, c), cconj(z(r2, c))));
          s = csc(s, 1 / N);
          const sum = [(L[r1][0] + L[r2][0]) % ms.value, (L[r1][1] + L[r2][1]) % ns.value], ri = L.findIndex((p) => p[0] === sum[0] && p[1] === sum[1]);
          let defect = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { let t = [0, 0]; for (let c = 0; c < N; c++) t = cadd(t, cmul(z(i, c), cconj(z(j, c)))); t = csc(t, 1 / N); defect = Math.max(defect, cabs(csub(t, [+(i === j), 0]))); }
          let prodErr = 0; for (let c = 0; c < N; c++) prodErr = Math.max(prodErr, cabs(csub(cmul(z(r1, c), z(r2, c)), z(ri, c))));
          return `$|G|=${N}$ characters. Rows $(${L[r1]})$ and $(${L[r2]})$ (click rows to change): $\\langle\\chi,\\chi'\\rangle=${ctex(s, 3)}$. Pointwise product of these two rows equals row $(${L[ri]})$ to within ${prodErr < 1e-9 ? '**0**' : nm(prodErr, 3)}. Largest deviation of the whole table's Gram matrix from $I$: ${defect < 1e-9 ? '**0**' : nm(defect, 3)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Proposition',
      name: 'The character table of S₃',
      statement: String.raw`The group $S_3$ has three conjugacy classes — the identity, the two 3-cycles (rotations by $\pm120^\circ$ of a triangle) and the three transpositions (reflections) — and so three irreducible representations: the trivial one $\mathbf 1$, the sign $\varepsilon$, and the 2-dimensional rotation representation $V$ on the plane of the triangle. The table is
$$\begin{array}{c|ccc} & e & (123) & (12)\\ \hline \mathbf 1&1&1&1\\ \varepsilon&1&1&-1\\ V&2&-1&0\end{array}$$
with class sizes $1,2,3$ and $1^2+1^2+2^2=6$.`,
      idea: String.raw`There are as many irreducibles as classes (3.10), and the two linear characters are obvious: the trivial one and the sign. The remaining row is the character of the symmetry representation on the plane, read from geometry: a rotation by $\theta$ has matrix trace $2\cos\theta$, which is $2$, $-1$ for $120^\circ$, and a reflection has eigenvalues $\pm1$ so trace $0$. Its norm $\frac16(4+2\cdot1+0)=1$ shows by 3.8 that it is irreducible, and $\sum d_i^2=6$ shows nothing is missing.`,
      caption: String.raw`Pick a symmetry class (and cycle through its elements with the button): the triangle on the left is moved by that symmetry. The table fills as you advance "rows shown" — the third row is not typed in but computed as the trace of the $2\times2$ matrix of the chosen element. Green rows have norm $1$ and are orthogonal to the rows above; the readout shows the weighted sum behind each check.`,
      deps: ['rep-3.14'],
      refs: ['Fulton–Harris §1.3'],
      tags: ['character table', 'symmetric group'],
      viz(v) {
        const T3 = tableOf('S3'), G = T3.G;
        let ci = 1, which = 0;
        const csel = v.select('class', [{ value: 0, label: '$e$' }, { value: 1, label: 'rotations' }, { value: 2, label: 'reflections' }], 1, { onChange: () => { which = 0; ci = csel.value; } });
        v.button('next element of the class', () => { which = (which + 1) % G.classes[csel.value].size; });
        const rows = v.slider('rows shown', 1, 3, 3, { int: true });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 0.85, title: 'the symmetry' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.1 });
        const T = v.table(B, { rows: 4, cols: 3, square: false, maxCell: 70, cellAspect: 1.15, size: 15, labelSize: 13, margin: 8 });
        const val = (r, c) => { const g = G.classes[c].rep; return r === 0 ? 1 : r === 1 ? (G.isRef(g) ? -1 : 1) : G.mat[g][0][0] + G.mat[g][1][1]; };
        const trow = (r) => G.classes.map((_, c) => [val(r, c), 0]);
        const norm = (r) => { let ok = cabs(csub(ip(G, trow(r), trow(r)), [1, 0])) < 1e-9; for (let j = 0; j < r; j++) ok = ok && cabs(ip(G, trow(r), trow(j))) < 1e-9; return ok; };
        v.render(() => {
          const c = csel.value, g = G.classes[c].els[which % G.classes[c].size];
          drawMoved(A, G.mat[g], G.pos, { names: ['1', '2', '3'], col: 'accent', R: 1.15 });
          drawMoved(A, [[1, 0], [0, 1]], G.pos, { col: 'muted', dash: true, F: false, fill: false, R: 1.15 });
          A.text(`$${G.L[g]}$`, 0, -1.38, { align: 'center', size: 15 });
          T.draw({
            rows: 4, cols: 3, colLabels: (j) => `$${G.L[G.classes[j].rep]}$`, rowLabels: (i) => (i === 0 ? 'size' : ['$\\mathbf 1$', '$\\varepsilon$', '$V$'][i - 1]), cornerLabel: '',
            value: (i, j) => (i === 0 ? String(G.classes[j].size) : i <= rows.value ? String(val(i - 1, j)) : '?'),
            fill: (i, j) => (i === 0 ? ['muted', 0.12] : i <= rows.value ? [norm(i - 1) ? 'green' : 'red', 0.22] : null),
            activeCol: c, activeColor: 'orange',
          });
        });
        v.readout(() => {
          const c = csel.value, g = G.classes[c].els[which % G.classes[c].size], M = G.mat[g], r = rows.value;
          const nr = ip(G, trow(r - 1), trow(r - 1))[0];
          return `Element $${G.L[g]}$: $\\rho(g)=\\begin{pmatrix}${nm(M[0][0], 2)}&${nm(M[0][1], 2)}\\\\${nm(M[1][0], 2)}&${nm(M[1][1], 2)}\\end{pmatrix}$, trace $${nm(M[0][0] + M[1][1], 2)}$. Last row shown has $\\langle\\chi,\\chi\\rangle=${nm(nr, 3)}$; degrees so far: $\\sum d^2=${[1, 1, 4].slice(0, r).reduce((s, x) => s + x, 0)}$ of $|G|=6$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Proposition',
      name: 'Dihedral groups',
      statement: String.raw`The dihedral group $D_n$ of order $2n$ (symmetries of a regular $n$-gon, generated by a rotation $r$ and a reflection $s$) has the irreducible representations
- two linear characters $A_1,A_2$ if $n$ is odd (trivial, and $-1$ on reflections), and four, $A_1,A_2,B_1,B_2$ if $n$ is even ($r\mapsto\pm1$, $s\mapsto\pm1$);
- 2-dimensional representations $E_k$ for $1\le k<n/2$, with $\chi_{E_k}(r^j)=2\cos(2\pi jk/n)$ and $\chi_{E_k}(\text{reflection})=0$.
Check: $4+4\cdot\frac{n-2}2=2n$ for even $n$ and $2+4\cdot\frac{n-1}2=2n$ for odd $n$.`,
      idea: String.raw`In $E_k$ the rotation $r$ acts as the plane rotation by $2\pi k/n$, whose trace is $2\cos(2\pi k/n)$, and reflections act with eigenvalues $\pm1$. The norm $\langle\chi,\chi\rangle=\frac1{2n}\big(\sum_j4\cos^2\frac{2\pi jk}n\big)=1$ for $k\ne n/2$ shows irreducibility (3.8), and $E_k\cong E_{n-k}$ so only $k<n/2$ are new. When $n$ is even, the rotation by half a turn is central and two more linear characters appear; the count of classes ($\lfloor n/2\rfloor+3$ for even $n$) and $\sum d^2=2n$ show the list is complete.`,
      caption: String.raw`Slide $n$: the table of $D_n$ is rebuilt, with the parity of $n$ deciding between two and four linear characters. Click a cell in an $E_k$ row to see what it means: the $n$-gon is turned by the rotation $r^j$ (dashed) while the 2-dimensional representation $E_k$ rotates the plane (the letter F) by $k$ times as much, so its trace is $2\cos(2\pi jk/n)$.`,
      deps: ['rep-3.14', 'rep-1.10'],
      refs: ['Serre §5.3'],
      tags: ['dihedral groups', 'character table'],
      viz(v) {
        const ns = v.slider('$n$', 3, 12, 5, { int: true });
        let sel = { k: 1, j: 1 };
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 360, weight: 0.85, title: 'polygon and $E_k$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.3 });
        const T = v.table(B, { square: false, maxCell: 62, cellAspect: 1.05, size: 12, labelSize: 11, margin: 6 });
        const cache = {};
        const tab = (m) => (cache[m] ||= dihTable(m));
        B.onClick((x, y) => { const h = T.hit(x, y); const { rows } = tab(ns.value); if (h && h.i >= 1 && h.j >= 0 && rows[h.i - 1].d === 2 && h.j < tab(ns.value).G.classes.length - (ns.value % 2 ? 1 : 2)) sel = { k: +rows[h.i - 1].name.slice(1), j: tab(ns.value).G.classes[h.j].rep }; });
        v.render(() => {
          const m = ns.value, { G, rows } = tab(m), ncl = G.classes.length;
          const top = rows.filter((r) => r.d === 2).length;
          if (sel.k > top) sel.k = 1;
          if (sel.j >= m) sel.j = 1;
          const th = (TAU * sel.j) / m, thk = sel.k * th;
          drawMoved(A, [[1, 0], [0, 1]], G.pos, { col: 'muted', dash: true, F: false, fill: false, R: 1.25 });
          drawMoved(A, [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]], G.pos, { col: 'orange', dash: true, F: false, fill: false, R: 1.25, width: 1.8 });
          drawMoved(A, [[Math.cos(thk), -Math.sin(thk)], [Math.sin(thk), Math.cos(thk)]], G.pos, { col: 'accent', R: 1.25, fa: 0.4, fill: false });
          A.corner(`$E_{${sel.k}}(r^{${sel.j}})$: turn by $${sel.k}\\cdot${sel.j}\\cdot360^\\circ/${m}$`, 'tl', { plate: true, size: 12 });
          T.draw({
            rows: rows.length + 1, cols: ncl,
            colLabels: (j) => (G.classes[j].rep < m ? `$r^{${G.classes[j].rep}}$` : G.classes[j].rep === m ? '$s$' : '$sr$'),
            rowLabels: (i) => (i === 0 ? 'size' : `$${rows[i - 1].tex}$`), cornerLabel: '',
            value: (i, j) => (i === 0 ? String(G.classes[j].size) : fmtZ(rows[i - 1].vals[j])),
            fill: (i, j) => (i === 0 ? ['muted', 0.12] : rows[i - 1].d === 2 && rows[i - 1].name === `E${sel.k}` && G.classes[j].rep === sel.j ? ['orange', 0.4] : null),
            size: m > 8 ? 10.5 : 12,
          });
        });
        v.readout(() => {
          const m = ns.value, { G, rows } = tab(m), d2 = rows.reduce((s, r) => s + r.d * r.d, 0), defect = tableDefect(G, rows);
          return `$D_{${m}}$: order $${2 * m}$, ${G.classes.length} classes and ${rows.length} irreducibles (${rows.filter((r) => r.d === 1).length} linear, ${rows.filter((r) => r.d === 2).length} of degree 2). $\\sum d_i^2=${d2}$ ${d2 === 2 * m ? '$=|G|$' : '(wrong!)'}; rows orthonormal: largest deviation ${defect < 1e-9 ? '**0**' : nm(defect, 3)}. Selected entry: $2\\cos(${sel.k}\\cdot${sel.j}\\cdot 2\\pi/${m})=${nm(2 * Math.cos((TAU * sel.k * sel.j) / m), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Proposition',
      name: 'D₄ and Q₈ share a character table',
      statement: String.raw`The dihedral group $D_4$ (symmetries of a square) and the quaternion group $Q_8=\{\pm1,\pm i,\pm j,\pm k\}$ are not isomorphic, yet after a suitable matching of their five conjugacy classes (and of their five irreducibles) they have exactly the same character table: four linear characters, taking values $\pm1$ on the classes, and one 2-dimensional character $(2,-2,0,0,0)$. So the character table does not determine the group. They are told apart, for instance, by the number of elements of order $2$: five in $D_4$, only one in $Q_8$.`,
      idea: String.raw`Both groups have order $8$, five classes (the centre $\{1,z\}$ and three pairs or a pair of rotations/reflections), and quotient by the centre to $\mathbb Z/2\times\mathbb Z/2$, which is where the four linear characters come from; the rest is forced by $\sum d_i^2=8$ and orthogonality (4.3 for $D_4$). The two groups differ in how the 2-dimensional representation sits: in $D_4$ it is real (the square in the plane), in $Q_8$ it is quaternionic (4.9, 4.10).`,
      caption: String.raw`Left and right, the two tables with the class matching found automatically (we test all $4!$ ways of matching the non-trivial columns until class sizes and rows agree). Choose a matched class to highlight its column in both tables and list its elements with their orders. The bars count elements of each order: the tables agree, the groups do not.`,
      deps: ['rep-4.3'],
      refs: ['Fulton–Harris §2.3'],
      tags: ['character table', 'quaternions', 'dihedral groups'],
      viz(v) {
        const D = tableOf('D4'), Q = tableOf('Q8');
        const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
        const key = (rows, map) => rows.map((r) => map.map((c) => fmtZ(r.vals[c])).join(',')).sort().join('|');
        let match = null;
        const qk = key(Q.rows, [0, 1, 2, 3, 4]);
        for (const p of perms([1, 2, 3, 4])) { const map = [0, ...p]; if (D.G.classes.every((c, i) => c.size === Q.G.classes[map[i]].size) && key(D.rows, map) === qk) { match = map; break; } }
        const inv = match ? match.map((_, q) => match.indexOf(q)) : [0, 1, 2, 3, 4];
        let c = 2;
        const csel = v.select('class of $D_4$ ↔ class of $Q_8$', [0, 1, 2, 3, 4].map((i) => ({ value: i, label: `$${D.G.L[D.G.classes[i].rep]}\\leftrightarrow ${Q.G.L[Q.G.classes[match[i]].rep]}$` })), 2, { onChange: () => {} });
        const SA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1, title: '$D_4$' });
        const SB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1, title: '$Q_8$' });
        const SC = v.stage({ x: [-0.5, 3.5], y: [0, 7], axes: 'box', gutter: true, height: 230, weight: 1, title: 'elements by order', xlabel: 'order of the element', ylabel: 'count', full: true });
        const TA = v.table(SA, { rows: 6, cols: 5, square: false, maxCell: 60, cellAspect: 0.95, size: 13, labelSize: 12, margin: 6 });
        const TB = v.table(SB, { rows: 6, cols: 5, square: false, maxCell: 60, cellAspect: 0.95, size: 13, labelSize: 12, margin: 6 });
        const ordCount = (G) => { const o = {}; for (let g = 0; g < G.n; g++) { const k = elOrder(G, g); o[k] = (o[k] || 0) + 1; } return o; };
        const od = ordCount(D.G), oq = ordCount(Q.G);
        v.render(() => {
          c = csel.value;
          const drawT = (T, X, cls, col, ci) => T.draw({
            rows: 6, cols: 5, colLabels: (j) => `$${X.G.L[X.G.classes[cls[j]].rep]}$`, rowLabels: (i) => (i === 0 ? 'size' : `$${X.rows[i - 1].tex}$`), cornerLabel: '',
            value: (i, j) => (i === 0 ? String(X.G.classes[cls[j]].size) : fmtZ(X.rows[i - 1].vals[cls[j]])),
            fill: (i, j) => (i === 0 ? ['muted', 0.12] : null), activeCol: ci, activeColor: col,
          });
          drawT(TA, D, [0, 1, 2, 3, 4], 'accent', c);
          // Q8 columns in the matched order, so that the picture is literally the same
          drawT(TB, Q, match, 'orange', c);
          const bx = [1, 2, 4];
          const w = 0.34;
          bx.forEach((k, i) => {
            SC.rect(i + 0.12, 0, i + 0.12 + w, od[k] || 0, { fill: 'accent', fillAlpha: 0.7, color: 'accent' });
            SC.rect(i + 0.52, 0, i + 0.52 + w, oq[k] || 0, { fill: 'orange', fillAlpha: 0.7, color: 'orange' });
            SC.text(String(od[k] || 0), i + 0.12 + w / 2, (od[k] || 0) + 0.15, { align: 'center', baseline: 'bottom', size: 12, color: 'accent' });
            SC.text(String(oq[k] || 0), i + 0.52 + w / 2, (oq[k] || 0) + 0.15, { align: 'center', baseline: 'bottom', size: 12, color: 'orange' });
          });
          SC.setTicks([[0.5, '1'], [1.5, '2'], [2.5, '4']], null);
        });
        v.legend([['accent', '$D_4$'], ['orange', '$Q_8$']]);
        v.readout(() => {
          const els = (X, ci) => X.G.classes[ci].els.map((g) => `$${X.G.L[g]}$ (order ${elOrder(X.G, g)})`).join(', ');
          return `Column matching (found by search): ${match ? 'exists, rows agree entry by entry' : '**none**'}. Chosen class — $D_4$: ${els(D, c)}; $Q_8$: ${els(Q, match[c])}. Elements with $g^2=e$: $D_4$ has ${od[1] + od[2]}, $Q_8$ has ${oq[1] + oq[2]}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Proposition',
      name: 'A₄ and the tetrahedron',
      statement: String.raw`The rotation group of the regular tetrahedron is $A_4$ (order $12$, classes of sizes $1,3,4,4$). Its irreducibles are three linear characters $\mathbf 1,\chi_\omega,\chi_{\bar\omega}$, which factor through $A_4/V_4\cong\mathbb Z/3$ and take values $1,\omega,\bar\omega$ on the two classes of $120^\circ$ rotations ($\omega=e^{2\pi i/3}$), and one 3-dimensional irreducible, the rotation representation, with character $(3,-1,0,0)$ on $e$, the half-turns, and both classes of third-turns. Indeed $1+1+1+9=12$.`,
      idea: String.raw`The linear characters are the characters of the abelian quotient $A_4/V_4$ (4.1), so they take cube roots of unity as values and are trivial on the Klein four-group $V_4$ of half-turns. The 3-dimensional row is read from geometry: a rotation by $\theta$ in $\mathbb R^3$ has trace $1+2\cos\theta$, i.e. $3,-1,0,0$ for $0^\circ,180^\circ,\pm120^\circ$. Its norm is $\frac1{12}(9+3\cdot1+0+0)=1$, so it is irreducible (3.8).`,
      caption: String.raw`Select a conjugacy class of the tetrahedron's rotations and slide "turn" from $0$ to $1$ to watch the rotation happen (solid = image, dashed = original; the 4 vertices are coloured so you can read off the permutation). The table below is computed from the matrices: the 3-dimensional row is the trace of the $3\times3$ rotation matrix, and the linear rows come from the coset of the rotation modulo $V_4$ — their value is drawn as a point on the unit circle.`,
      deps: ['rep-3.14'],
      refs: ['Serre §5.7', 'Fulton–Harris §2.3'],
      tags: ['alternating group', 'tetrahedron', 'character table'],
      viz(v) {
        const T = tetraData(), G = T.G, info = rotClasses(G), rep0 = info.find((c) => c.deg === 120);
        let which = 0;
        const csel = v.select('class of rotations', info.map((c, k) => ({ value: k, label: c.deg === 0 ? '$e$' : `${c.deg}° (${c.size})${c.deg === 120 ? (c.i === rep0.i ? ' a' : ' b') : ''}` })), 1, { onChange: () => { which = 0; } });
        v.button('next element of the class', () => { which = (which + 1) % info[csel.value].size; });
        const turn = v.slider('turn', 0, 1, 1, { step: 0.01 });
        const Sx = v.stage({ x: [-2.1, 2.1], y: [-2.0, 2.0], equal: true, axes: false, height: 340, weight: 1.05 });
        const sc = v.scene3(Sx, { yaw: 0.7, pitch: 0.35, axis: 0, lim: 1.5, axes: false, hint: true });
        const Sc = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 220, weight: 0.7, title: 'value of $\\chi_\\omega$' });
        const Stab = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, weight: 1.2, full: true });
        const Tb = v.table(Stab, { rows: 5, cols: 4, square: false, maxCell: 62, cellAspect: 1.6, size: 14, labelSize: 12, margin: 6 });
        // linear characters via the coset modulo V4
        const inV4 = (g) => elOrder(G, g) <= 2;
        const c0 = rep0.rep, cpow = (k) => { let h = G.e; for (let t = 0; t < ((k % 3) + 3) % 3; t++) h = G.mul[h][c0]; return h; };
        const coset = (g) => { for (let k = 0; k < 3; k++) if (inV4(G.mul[g][G.inv[cpow(k)]])) return k; return -1; };
        const w = (k) => cexp((TAU * k) / 3);
        const rowsAll = [
          { tex: '\\mathbf 1', f: () => [1, 0] },
          { tex: '\\chi_\\omega', f: (g) => w(coset(g)) },
          { tex: '\\chi_{\\bar\\omega}', f: (g) => w(-coset(g)) },
          { tex: '\\chi_3', f: (g) => [tr3(G.mats[g]), 0] },
        ];
        const clsVals = rowsAll.map((r) => G.classes.map((c) => { const vals = c.els.map((g) => r.f(g)); return vals.every((z) => cabs(csub(z, vals[0])) < 1e-9) ? vals[0] : [NaN, 0]; }));
        const verts = T.verts, vcol = ['red', 'green', 'blue', 'orange'];
        v.render(() => {
          const k = csel.value, cl = info[k], g = G.classes[cl.i].els[which % cl.size], R = G.mats[g];
          const { axis, th } = axisAngle(R), Rt = rodrigues(axis, th * turn.value);
          sc.begin();
          T.edges.forEach(([a, b]) => { sc.line(verts[a], verts[b], { color: 'muted', width: 1.4, alpha: 0.5, dash: true }); });
          const img = verts.map((p) => m3v(Rt, p));
          T.edges.forEach(([a, b]) => sc.line(img[a], img[b], { color: 'accent', width: 2.4 }));
          if (cl.deg > 0) sc.line(axis.map((t) => -1.6 * t), axis.map((t) => 1.6 * t), { color: 'gold', width: 2 });
          verts.forEach((p, i) => sc.dot(img[i], { r: 7, color: vcol[i], fill: vcol[i] }));
          sc.flush();
          const cs = coset(g), z = w(cs);
          Sc.circle(0, 0, 1, { color: 'faint', fill: false });
          [0, 1, 2].forEach((j) => { const p = w(j); Sc.dot(p[0], p[1], { r: 5, color: j === cs ? 'green' : 'muted', hollow: j !== cs }); Sc.text(['1', 'ω', 'ω̄'][j], p[0] * 1.3, p[1] * 1.3, { align: 'center', baseline: 'middle', size: 13, color: j === cs ? 'green' : 'muted' }); });
          Sc.line(0, 0, z[0], z[1], { color: 'green', width: 2 });
          Tb.draw({
            rows: 5, cols: 4, colLabels: (j) => { const c = info[j]; return c.deg === 0 ? '$e$' : `${c.deg}°${c.deg === 120 ? (c.i === rep0.i ? ' a' : ' b') : ''}`; }, rowLabels: (i) => (i === 0 ? 'size' : `$${rowsAll[i - 1].tex}$`), cornerLabel: '',
            value: (i, j) => (i === 0 ? String(info[j].size) : fmtZ(clsVals[i - 1][info[j].i])),
            fill: (i, j) => (i === 0 ? ['muted', 0.12] : null), activeCol: k, activeColor: 'orange',
          });
        });
        v.readout(() => {
          const k = csel.value, cl = info[k], g = G.classes[cl.i].els[which % cl.size], R = G.mats[g], th = axisAngle(R).th;
          const gram = rowsAll.map((_, a) => rowsAll.map((__, b) => ip(G, clsVals[a], clsVals[b])));
          let dev = 0; gram.forEach((r, a) => r.forEach((z, b) => { dev = Math.max(dev, cabs(csub(z, [+(a === b), 0]))); }));
          return `Rotation by $${Math.round((th * 180) / Math.PI)}^\\circ$: trace of its matrix $=1+2\\cos\\theta=${nm(tr3(R), 3)}$ (3-dimensional row); coset modulo $V_4$ is $\\omega^{${coset(g)}}$. Gram matrix of the four rows: largest deviation from $I$ ${dev < 1e-9 ? '**0**' : nm(dev, 3)}; $1+1+1+9=12$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Proposition',
      name: 'S₄ and the rotations of the cube',
      statement: String.raw`The rotation group of the cube is isomorphic to $S_4$, by its action on the four long (body) diagonals. Its five conjugacy classes — identity (1), half-turns about face axes (3), quarter-turns (6), third-turns about diagonals (8), half-turns about edge axes (6) — give the table
$$\begin{array}{c|ccccc} &e&(12)(34)&(1234)&(123)&(12)\\ \hline \mathbf 1&1&1&1&1&1\\ \varepsilon&1&1&-1&1&-1\\ \chi_2&2&2&0&-1&0\\ \chi_3&3&-1&1&0&-1\\ \chi_3\otimes\varepsilon&3&-1&-1&0&1\end{array}$$
where $\chi_3$ is the character of the rotation representation, $\chi_3(g)=1+2\cos\theta$, and $\chi_2$ is the permutation character on the three face axes minus $1$.`,
      idea: String.raw`Rotations preserve the cube, so they permute the four diagonals, and the action is faithful: this is $S_4$. The five rows come from five natural constructions — the trivial character, the sign of the permutation of the diagonals, the rotation representation (trace $1+2\cos\theta$: $3,-1,1,0,-1$), its product with the sign, and the permutation representation on the three pairs of opposite faces minus the trivial summand (3.6, 3.3). Orthogonality (3.5) confirms that they are five different irreducibles, and $1+1+4+9+9=24$ says the table is complete.`,
      caption: String.raw`Choose a class of rotations and turn the cube with the slider; the four body diagonals are coloured, and the permutation they undergo is shown. Increase "rows derived" to build the table from geometry (each row is computed from the rotation matrices or the induced permutations of diagonals and face axes). Green rows are orthonormal to everything above them; at five rows the table is complete.`,
      deps: ['rep-3.14'],
      refs: ['Serre §5.8', 'Serre §5.9'],
      tags: ['symmetric group', 'cube', 'character table'],
      viz(v) {
        const cube = cubeData(), G = cube.G, R = cube.rot;
        const tr = (g) => tr3(R[g]);
        const classIdx = (pred) => G.classes.findIndex((c) => pred(c.rep));
        const order = [
          { name: 'e', cl: classIdx((g) => g === G.e) },
          { name: 'half-turn, face axis', cl: classIdx((g) => G.classes[G.cls[g]].size === 3) },
          { name: 'quarter-turn', cl: classIdx((g) => G.classes[G.cls[g]].size === 6 && Math.abs(tr(g) - 1) < 1e-9) },
          { name: 'third-turn', cl: classIdx((g) => G.classes[G.cls[g]].size === 8) },
          { name: 'half-turn, edge axis', cl: classIdx((g) => G.classes[G.cls[g]].size === 6 && Math.abs(tr(g) + 1) < 1e-9) },
        ];
        let which = 0;
        const csel = v.select('class', order.map((o, i) => ({ value: i, label: ['$e$', 'face half-turn', 'quarter-turn', 'third-turn', 'edge half-turn'][i] })), 2, { onChange: () => { which = 0; } });
        v.button('next element of the class', () => { which = (which + 1) % G.classes[order[csel.value].cl].size; });
        const turn = v.slider('turn', 0, 1, 1, { step: 0.01 });
        const nrows = v.slider('rows derived', 1, 5, 5, { int: true });
        const faceAx = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const same = (a, b) => cube.same(a, b) || cube.same(a, b.map((t) => -t));
        const sgn = (g) => { const p = G.perms[g]; let s = 1; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (p[i] > p[j]) s = -s; return s; };
        const fixedFace = (g) => faceAx.filter((a) => same(cube.app(R[g], a), a)).length;
        const fixedDiag = (g) => G.perms[g].filter((x, i) => x === i).length;
        const rowF = [() => 1, sgn, tr, (g) => sgn(g) * tr(g), (g) => fixedFace(g) - 1];
        const rowTex = ['\\mathbf 1', '\\varepsilon', '\\chi_3', '\\chi_3\\otimes\\varepsilon', '\\chi_2'];
        const rowHow = ['trivial', 'sign of the permutation of the diagonals', 'trace of the rotation matrix, $1+2\\cos\\theta$', '$\\chi_3\\cdot\\varepsilon$', '(fixed face axes) $-1$'];
        const vals = rowF.map((f) => G.classes.map((c) => [f(c.rep), 0]));
        const consistent = rowF.every((f) => G.classes.every((c) => c.els.every((g) => f(g) === f(c.rep))));
        const Sx = v.stage({ x: [-2.1, 2.1], y: [-2.0, 2.0], equal: true, axes: false, height: 340, weight: 1.05 });
        const sc = v.scene3(Sx, { yaw: 0.6, pitch: 0.38, axis: 0, lim: 1.5, axes: false, hint: true });
        const Stab = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15 });
        const Tb = v.table(Stab, { rows: 6, cols: 5, square: false, maxCell: 62, cellAspect: 1.15, size: 14, labelSize: 11.5, margin: 6 });
        const cs = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        const ed = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
        const dcol = ['red', 'green', 'blue', 'orange'];
        const diagEnds = cube.sets.diag.pts;
        v.render(() => {
          const k = csel.value, cl = G.classes[order[k].cl], g = cl.els[which % cl.size], { axis, th } = axisAngle(R[g]), Rt = rodrigues(axis, th * turn.value);
          sc.begin();
          ed.forEach(([a, b]) => sc.line(cs[a], cs[b], { color: 'muted', width: 1.3, alpha: 0.45, dash: true }));
          const img = cs.map((p) => m3v(Rt, p));
          ed.forEach(([a, b]) => sc.line(img[a], img[b], { color: 'accent', width: 2.2 }));
          diagEnds.forEach((d, i) => { const p = m3v(Rt, d), q = p.map((t) => -t); sc.line(p, q, { color: dcol[i], width: 2.6, alpha: 0.9 }); });
          if (th > 1e-9) sc.line(axis.map((t) => -1.8 * t), axis.map((t) => 1.8 * t), { color: 'gold', width: 2 });
          sc.flush();
          const nr = nrows.value;
          Tb.draw({
            rows: 6, cols: 5, colLabels: (j) => ['$e$', '$(12)(34)$', '$(1234)$', '$(123)$', '$(12)$'][j], rowLabels: (i) => (i === 0 ? 'size' : `$${rowTex[i - 1]}$`), cornerLabel: '',
            value: (i, j) => (i === 0 ? String(G.classes[order[j].cl].size) : i <= nr ? fmtZ(vals[i - 1][order[j].cl]) : '?'),
            fill: (i, j) => {
              if (i === 0) return ['muted', 0.12];
              if (i > nr) return null;
              const r = vals[i - 1]; let ok = cabs(csub(ip(G, r, r), [1, 0])) < 1e-9; for (let t = 0; t < i - 1; t++) ok = ok && cabs(ip(G, r, vals[t])) < 1e-9;
              return [ok ? 'green' : 'red', 0.22];
            },
            activeCol: k, activeColor: 'orange',
          });
        });
        v.readout(() => {
          const k = csel.value, cl = G.classes[order[k].cl], g = cl.els[which % cl.size], nr = nrows.value;
          const sq = [1, 1, 4, 9, 9].slice(0, nr).reduce((s, x) => s + x, 0);
          return `Element ${cl.size > 1 ? 'of the class (' + cl.size + ' elements)' : ''}: permutation of the diagonals $${cycTex(G.perms[g])}$, rotation angle $${Math.round((axisAngle(R[g]).th * 180) / Math.PI)}^\\circ$, fixed diagonals ${fixedDiag(g)}, fixed face axes ${fixedFace(g)}. Row ${nr} is the ${rowHow[nr - 1]}. $\\sum d^2=${sq}$ of $24$. Each row is constant on classes: ${consistent ? '**yes**' : '**NO**'}.`;
        });
      },
    },
  ],
};
