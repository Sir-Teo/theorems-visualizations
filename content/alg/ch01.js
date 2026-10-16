// Abstract Algebra (Judson) — Chapter 1: Preliminaries
// Part 1 (this file): sets, the algebra of sets, De Morgan's laws, Cartesian products, mappings, injective / surjective /
// bijective maps, composition and permutations (1.1a–1.14a). Part 2 (ch01-b.js): composition laws, inverses, equivalence
// relations, partitions and congruence mod n (1.15–1.30). Shared helpers: ch01.shared.js.
import { CAT, parseSet, signature, regionOf, regionTex, drawVenn, samplePoints, setList, colPts, drawBlob, drawElems, mapArrow, linkEditor, mapInfo, tick } from './ch01.shared.js';

const NAMES_A = ['x', 'y', 'z', 'w', 'u', 'v'];
const PATH = ['blue', 'teal', 'purple', 'pink', 'gold', 'green'];
/** For the fixed circles of a Venn diagram: a well-inside point of each region (grid search for the largest clearance). */
function regionAnchors(circles, [x0, x1], [y0, y1], nsets) {
  const best = Array(1 << nsets).fill(null).map(() => ({ d: -1, p: null }));
  for (let i = 0; i <= 120; i++) for (let j = 0; j <= 80; j++) {
    const x = x0 + ((x1 - x0) * i) / 120, y = y0 + ((y1 - y0) * j) / 80, m = regionOf(circles, x, y);
    let d = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    for (const c of circles) d = Math.min(d, Math.abs(Math.hypot(x - c.x, y - c.y) - c.r));
    if (d > best[m].d) best[m] = { d, p: [x, y] };
  }
  return best.map((b) => b.p);
}
/** Stirling numbers of the second kind S(m, k) (partitions of an m-set into k blocks). */
function stirling2(m, k) { const S = [[1]]; for (let i = 1; i <= m; i++) { S.push([0]); for (let j = 1; j <= i; j++) S[i][j] = (S[i - 1][j] || 0) * j + (S[i - 1][j - 1] || 0); } return (S[m] && S[m][k]) || 0; }
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
/** Disjoint cycle notation of a permutation p of {0..n−1} (1-based in the output), fixed points omitted. */
function cycleTex(p) {
  const n = p.length, seen = Array(n).fill(false), out = [];
  for (let i = 0; i < n; i++) if (!seen[i]) { const c = []; let j = i; while (!seen[j]) { seen[j] = true; c.push(j + 1); j = p[j]; } if (c.length > 1) out.push(`(${c.join('\\,')})`); }
  return out.length ? out.join('') : '\\mathrm{id}';
}

export default {
  collection: 'alg',
  chapter: 1,
  title: 'Preliminaries',
  summary: String.raw`After a short guide to reading and writing proofs, the chapter fixes the language the rest of the book speaks: sets and the operations on them, Cartesian products, and mappings with their compositions and inverses — a map can be undone exactly when it is a bijection. It closes with equivalence relations, the partitions they cut a set into, and congruence modulo $n$, the seed from which the integers mod $n$ will grow.`,
  items: [
    // ------------------------------------------------------------------ 1.1a
    {
      num: '1.1a',
      kind: 'Definition',
      name: 'Sets and set operations',
      statement: String.raw`A **set** is a collection of objects, its **elements**, described so that for every object $x$ it is decided whether $x\in A$ or $x\notin A$. $A$ is a **subset** of $B$, written $A\subset B$, if every element of $A$ is an element of $B$; $A=B$ means $A\subset B$ and $B\subset A$. The **empty set** $\varnothing$ has no elements and is a subset of every set. For sets $A$, $B$ inside a fixed **universal set** $U$:
- the **union** $A\cup B=\{x : x\in A \text{ or } x\in B\}$;
- the **intersection** $A\cap B=\{x : x\in A \text{ and } x\in B\}$ ($A$ and $B$ are **disjoint** when $A\cap B=\varnothing$);
- the **complement** $A'=\{x\in U : x\notin A\}$;
- the **difference** $A\setminus B=A\cap B'=\{x : x\in A,\ x\notin B\}$.`,
      idea: String.raw`Every operation is defined element by element through a logical connective: union is "or", intersection is "and", complement is "not", difference is "and not". So a set built from $A$, $B$, $C$ by these operations is decided, for each element, only by the three yes/no answers "is it in $A$, in $B$, in $C$?" — which is exactly what a Venn diagram records: three circles cut $U$ into $2^3=8$ regions, and any such expression is a union of some of them.`,
      caption: String.raw`Drag the centres of the circles $A$, $B$, $C$. Pick a preset or **type any expression** in $A$, $B$, $C$, $U$, $\varnothing$ (∪ or u, ∩ or n, \ or −, Δ, and ′ for complement): its region is shaded and the numbered sample elements of $U$ that belong to it are filled; the readout lists every set as a roster.`,
      deps: [],
      see: ['logic-8.1'],
      refs: ['Judson §1.2'],
      tags: ['sets'],
      credit: 'Cantor, 1874–1897; Venn diagrams: Venn, 1880',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Set_(mathematics)' },
      viz(v) {
        const UX = [0.15, 13.85], UY = [0.15, 6.25], R = 2.0;
        const pre = [['A ∪ B', '$A\\cup B$'], ['A ∩ B', '$A\\cap B$'], ['A \\ B', '$A\\setminus B$'], ["A'", "$A'$"], ["(A ∪ B) ∩ C'", "$(A\\cup B)\\cap C'$"], ['A Δ B', '$A\\mathbin{\\triangle} B$']];
        v.select('preset', pre.map(([value, label]) => ({ value, label })), 'A ∪ B', { onChange: (x) => expr.set(x) });
        const expr = v.input('$E =$', 'A ∪ B', { width: 170, placeholder: "e.g. (A u B) n C'" });
        const s = v.stage({ x: [0, 14], y: [0, 6.4], equal: true, axes: false, height: 330 });
        const cons = (x, y) => [v.M.clamp(x, UX[0] + 0.5, UX[1] - 0.5), v.M.clamp(y, UY[0] + 0.5, UY[1] - 0.5)];
        const H = [s.handle(5.75, 4.0, { color: 'blue', r: 6, constrain: cons }), s.handle(8.25, 4.0, { color: 'red', r: 6, constrain: cons }), s.handle(7.0, 2.25, { color: 'green', r: 6, constrain: cons })];
        const pts = samplePoints(v, 24, [0.6, 13.4], [0.5, 5.9], 11);
        const circles = () => H.map((h, k) => ({ x: h.x, y: h.y, r: R, name: 'ABC'[k], color: ['blue', 'red', 'green'][k], namePos: [2.3, 0.84, -2.55][k] }));
        v.render(() => {
          const C = circles(), P = parseSet(expr.value);
          drawVenn(v, s, C, P.ok ? P.f : null, { ux: UX, uy: UY, key: JSON.stringify([C.map((c) => [c.x, c.y]), expr.value]) });
          pts.forEach(([x, y], k) => {
            const inE = P.ok && P.f(regionOf(C, x, y));
            s.dot(x, y, { r: inE ? 4.5 : 3.6, color: inE ? 'ink' : 'muted', hollow: !inE });
            s.text(String(k + 1), x, y, { dx: 6, dy: -8, size: 11.5, color: inE ? 'ink' : 'muted', weight: inE ? 700 : 500 });
          });
          if (!P.ok) s.corner(`cannot read “${expr.value}”`, 'tr', { color: 'red', size: 12.5, plate: true });
        });
        v.readout(() => {
          const C = circles(), P = parseSet(expr.value), reg = pts.map((p) => regionOf(C, p[0], p[1]));
          const mem = (test) => reg.map((m, k) => (test(m) ? k + 1 : null)).filter((k) => k != null);
          const head = String.raw`$A = ${setList(mem((m) => m & 1))}$, $B = ${setList(mem((m) => m & 2))}$, $C = ${setList(mem((m) => m & 4))}$ inside $U = \{1, \ldots, 24\}$.`;
          if (!P.ok) return `${head} **Cannot read** the expression (${P.error}). Use A, B, C, U, ∅ with ∪ (or u, +), ∩ (or n, &), \\ (or −), Δ, brackets and a postfix ′ for complement.`;
          const E = mem(P.f);
          return `${head} $E = ${P.tex} = ${setList(E, 24)}$, with $|E| = ${E.length}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Proposition',
      name: 'Algebra of sets',
      statement: String.raw`For all sets $A$, $B$, $C$:
(1) $A\cup A=A$, $A\cap A=A$ and $A\setminus A=\varnothing$;
(2) $A\cup\varnothing=A$ and $A\cap\varnothing=\varnothing$;
(3) $A\cup(B\cup C)=(A\cup B)\cup C$ and $A\cap(B\cap C)=(A\cap B)\cap C$;
(4) $A\cup B=B\cup A$ and $A\cap B=B\cap A$;
(5) $A\cup(B\cap C)=(A\cup B)\cap(A\cup C)$;
(6) $A\cap(B\cup C)=(A\cap B)\cup(A\cap C)$.`,
      idea: String.raw`Each law becomes a law of logic once membership is unfolded: $x\in A\cup(B\cup C)$ says "$x\in A$ or ($x\in B$ or $x\in C$)", and "or" is associative. Equivalently, both sides are unions of the eight regions of a three-set Venn diagram, so an identity holds for **all** sets exactly when the two sides contain the same regions — eight checks, a finite truth table. A proposed law that fails, such as associativity of $\setminus$, fails on some region, and one element placed there is a counterexample.`,
      caption: String.raw`Choose a law (or type both sides). The left and right sides are shaded on twin diagrams, and the table checks all eight regions. Click any region to remove or restore its sample element — the concrete sets change, but for a true law the two sides never come apart. The last preset, $A\setminus(B\setminus C)$ against $(A\setminus B)\setminus C$, is **false**: the separating regions turn red.`,
      deps: ['alg-1.1a'],
      refs: ['Judson §1.2'],
      tags: ['sets', 'boolean algebra'],
      viz(v) {
        const LAWS = { idem: ['A ∩ A', 'A'], diff: ['A \\ A', '∅'], unit: ['A ∪ ∅', 'A'], assoc: ['A ∪ (B ∪ C)', '(A ∪ B) ∪ C'], comm: ['A ∩ B', 'B ∩ A'], dist1: ['A ∪ (B ∩ C)', '(A ∪ B) ∩ (A ∪ C)'], dist2: ['A ∩ (B ∪ C)', '(A ∩ B) ∪ (A ∩ C)'], fake: ['A \\ (B \\ C)', '(A \\ B) \\ C'] };
        v.select('law', [{ value: 'idem', label: '(1)' }, { value: 'diff', label: '(1′)' }, { value: 'unit', label: '(2)' }, { value: 'assoc', label: '(3)' }, { value: 'comm', label: '(4)' }, { value: 'dist1', label: '(5)' }, { value: 'dist2', label: '(6)' }, { value: 'fake', label: 'a false law' }], 'dist1',
          { onChange: (k) => { L.set(LAWS[k][0]); Rt.set(LAWS[k][1]); } });
        const L = v.input('left', LAWS.dist1[0], { width: 130 }), Rt = v.input('right', LAWS.dist1[1], { width: 160 });
        const UX = [0.25, 9.75], UY = [0.25, 7.35];
        const C = [{ x: 3.85, y: 4.45, r: 2.05, name: 'A', color: 'blue', namePos: 2.5 }, { x: 6.15, y: 4.45, r: 2.05, name: 'B', color: 'red', namePos: 0.64 }, { x: 5, y: 2.55, r: 2.05, name: 'C', color: 'green', namePos: -2.55 }];
        const anchors = regionAnchors(C, UX, UY, 3), on = Array(8).fill(true);
        const s1 = v.stage({ x: [0, 10], y: [0, 7.6], equal: true, axes: false, height: 250 });
        const s2 = v.stage({ x: [0, 10], y: [0, 7.6], equal: true, axes: false, height: 250 });
        const s3 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 205, full: true });
        const T = v.table(s3, { rows: 5, cols: 8, square: false, maxCell: 32, cellAspect: 1.9, size: 14, margin: 6, colLabels: (j) => String(j + 1), rowLabels: ['$A$', '$B$', '$C$', 'left', 'right'] });
        const click = (x, y) => { if (x < UX[0] || x > UX[1] || y < UY[0] || y > UY[1]) return; const m = regionOf(C, x, y); on[m] = !on[m]; };
        s1.onClick(click); s2.onClick(click);
        const parsed = () => [parseSet(L.value), parseSet(Rt.value)];
        v.render(() => {
          const [P, Q] = parsed(), sp = P.ok ? signature(P.f) : null, sq = Q.ok ? signature(Q.f) : null;
          [[s1, P, 'accent', 'left'], [s2, Q, 'purple', 'right']].forEach(([s, X, col, side]) => {
            drawVenn(v, s, C, X.ok ? X.f : null, { ux: UX, uy: UY, color: col, key: (X.ok ? X.tex : '') + col });
            s.setTitle(X.ok ? `${side}: $${X.tex}$` : `${side}: cannot read “${side === 'left' ? L.value : Rt.value}”`);
            anchors.forEach((p, m) => {
              const bad = sp && sq && sp[m] !== sq[m];
              if (!on[m]) { s.dot(p[0], p[1], { r: 3, color: 'faint', hollow: true }); return; }
              const inX = X.ok && X.f(m);
              s.dot(p[0], p[1], { r: 5, color: bad ? 'red' : inX ? 'ink' : 'muted', hollow: !inX });
              s.text(String(m + 1), p[0], p[1], { dx: 7, dy: -8, size: 12, color: bad ? 'red' : 'ink', weight: 650 });
              if (bad) s.circle(p[0], p[1], 0.42, { color: 'red', width: 2, fill: false });
            });
          });
          T.draw({
            value: (i, j) => { const m = j; const b = i < 3 ? !!(m & (1 << i)) : i === 3 ? sp && sp[m] : sq && sq[m]; return b == null ? '?' : b ? '1' : '0'; },
            fill: (i, j) => {
              const m = j, diff = sp && sq && sp[m] !== sq[m];
              if (i >= 3 && diff) return ['red', 0.35];
              const b = i < 3 ? m & (1 << i) : i === 3 ? sp && sp[m] : sq && sq[m];
              return b ? [['blue', 'red', 'green', 'accent', 'purple'][i], on[m] ? 0.22 : 0.08] : null;
            },
            textColor: (i, j) => (on[j] ? null : 'faint'),
            colLabelColor: (j) => (on[j] ? 'ink' : 'faint'),
          });
          if (sp && sq) for (let m = 0; m < 8; m++) if (sp[m] !== sq[m]) T.box(3, m, 4, m, { color: 'red', width: 2.6 });
        });
        v.readout(() => {
          const [P, Q] = parsed();
          if (!P.ok || !Q.ok) return `**Cannot read** the ${!P.ok ? 'left' : 'right'} side (${(!P.ok ? P : Q).error}).`;
          const sp = signature(P.f), sq = signature(Q.f), diff = sp.map((b, m) => (b !== sq[m] ? m : -1)).filter((m) => m >= 0);
          const concrete = (f) => setList(on.map((o, m) => (o && f(m) ? m + 1 : null)).filter((x) => x != null));
          const sets = String.raw`With the elements shown: left $= ${concrete(P.f)}$, right $= ${concrete(Q.f)}$.`;
          if (!diff.length) return `${sets} **Identity:** the two sides contain the same regions — all eight columns agree — so $${P.tex} = ${Q.tex}$ for every choice of sets $A$, $B$, $C$.`;
          const m = diff[0];
          return `${sets} **Not an identity:** the sides differ on ${diff.length} region${diff.length > 1 ? 's' : ''}, e.g. $${regionTex(m)}$ (element ${m + 1}). Counterexample: take $A$, $B$, $C$ to be the sets containing just that one element as the region dictates; then one side contains it and the other does not.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'De Morgan’s laws',
      statement: String.raw`For sets $A$ and $B$ in a universal set $U$:
(1) $(A\cup B)'=A'\cap B'$;
(2) $(A\cap B)'=A'\cup B'$.`,
      idea: String.raw`Prove each equality by two inclusions. If $x\in(A\cup B)'$ then $x$ lies neither in $A$ nor in $B$, so $x\in A'$ and $x\in B'$; conversely, an element of $A'\cap B'$ is in neither set, hence not in their union. Law (2) follows the same way, or from (1) applied to $A'$ and $B'$ after complementing both sides (using $X''=X$). In words: "not (in $A$ or in $B$)" is "not in $A$ and not in $B$" — complement turns unions into intersections and back.`,
      caption: String.raw`Step through the construction: shade $A\cup B$, complement it, then hatch $A'$ (blue) and $B'$ (red) — the region carrying both hatchings, filled green, is the shaded one from step 2. Drag the four sample points anywhere; the table follows each one through every column. Switch on the **false version** ($A'\cup B'$ on the right) and the rows that break it turn red.`,
      deps: ['alg-1.1a'],
      refs: ['Judson §1.2'],
      tags: ['sets', 'logic'],
      credit: 'Augustus De Morgan, Formal Logic, 1847',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/De_Morgan%27s_laws' },
      viz(v) {
        const law = v.select('law', [{ value: 0, label: "(1) $(A\\cup B)' = A'\\cap B'$" }, { value: 1, label: "(2) $(A\\cap B)' = A'\\cup B'$" }], 0);
        const fake = v.toggle('false version: swap $\\cap$ and $\\cup$ on the right', false);
        const UX = [0.25, 9.75], UY = [0.25, 6.15], R = 2.05;
        const C = [{ x: 3.85, y: 3.2, r: R, name: 'A', color: 'blue', namePos: Math.PI * 0.8 }, { x: 6.15, y: 3.2, r: R, name: 'B', color: 'red', namePos: Math.PI * 0.2 }];
        const s = v.stage({ x: [0, 10], y: [0, 6.4], equal: true, axes: false, height: 290, weight: 1 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1.45 });
        const P = [[1.2, 5.3], [5, 3.4], [3.3, 1.9], [8.6, 1.0]].map(([x, y], k) => s.handle(x, y, { color: 'gold', r: 6, label: 'pqrs'[k], constrain: (x, y) => [v.M.clamp(x, UX[0] + 0.15, UX[1] - 0.15), v.M.clamp(y, UY[0] + 0.15, UY[1] - 0.15)] }));
        const ops = () => {
          const k = law.value, f = fake.value;
          const inner = k === 0 ? (m) => !!(m & 1) || !!(m & 2) : (m) => !!(m & 1) && !!(m & 2);
          const rhsAnd = (k === 0) !== f;
          return { inner, lhs: (m) => !inner(m), rhs: rhsAnd ? (m) => !(m & 1) && !(m & 2) : (m) => !(m & 1) || !(m & 2), cup: k === 0, rhsAnd };
        };
        const tx = () => { const o = ops(); const inn = o.cup ? 'A\\cup B' : 'A\\cap B'; return { inn, lhs: `(${inn})'`, rhs: o.rhsAnd ? "A'\\cap B'" : "A'\\cup B'" }; };
        const S = v.steps({
          frames: [0, 1, 2, 3, 4].map((k) => ({ k, note: () => { const X = tx(); return [`Shade $${X.inn}$.`, `Complement it: $${X.lhs}$ is everything in $U$ outside the shaded part.`, `Hatch $A'$, everything outside $A$, in blue.`, `Hatch $B'$ in red as well.`, ops().rhsAnd ? `$A'\\cap B'$ is where **both** hatchings appear (green): ${fake.value ? 'compare' : 'exactly'} the region of step 2.` : `$A'\\cup B'$ is where **at least one** hatching appears (green): ${fake.value ? 'compare' : 'exactly'} the region of step 2.`][k]; } })),
          still: 4,
        });
        const cA = v.rgb('blue'), cB = v.rgb('red');
        const T = v.table(t, { rows: 4, cols: 8, square: false, maxCell: 40, cellAspect: 1.6, size: 14, labelSize: 12, margin: 4, colWeights: [0.7, 0.7, 1.5, 1.7, 0.8, 0.8, 1.7, 0.7], rowLabels: ['$p$', '$q$', '$r$', '$s$'] });
        v.render(() => {
          const k = S.frame.k ?? 0, o = ops(), lhsSig = signature(o.lhs, 2), rhsSig = signature(o.rhs, 2);
          const fillCol = k === 0 ? v.ramp(0.4, 'accent') : k === 1 ? v.ramp(0.4, 'orange') : null, green = v.ramp(0.45, 'green'), bad = v.ramp(0.5, 'red');
          s.raster((x, y) => {
            if (x < UX[0] || x > UX[1] || y < UY[0] || y > UY[1]) return null;
            const m = regionOf(C, x, y), X = s.X(x), Y = s.Y(y);
            if (k === 0) return o.inner(m) ? fillCol : null;
            if (k === 1) return o.lhs(m) ? fillCol : null;
            const hA = !(m & 1) && (((X + Y) % 12) + 12) % 12 < 3.2, hB = k >= 3 && !(m & 2) && (((X - Y) % 12) + 12) % 12 < 3.2;
            if (k === 4 && rhsSig[m]) return rhsSig[m] !== lhsSig[m] ? bad : green;
            return hA ? cA : hB ? cB : null;
          }, { key: `${k}|${law.value}|${fake.value}`, id: 'dm' });
          drawVenn(v, s, C, null, { ux: UX, uy: UY });
          const X = tx();
          s.corner(k <= 1 ? `$${k === 0 ? X.inn : X.lhs}$` : k === 4 ? `$${X.rhs}$` : k === 2 ? "$A'$" : "$A'$ and $B'$", 'tl', { size: 14, plate: true });
          const rows = P.map((h) => regionOf(C, h.x, h.y));
          const col = (m, j) => [!!(m & 1), !!(m & 2), o.inner(m), o.lhs(m), !(m & 1), !(m & 2), o.rhs(m)][j];
          T.draw({
            colLabels: ['$A$', '$B$', `$${X.inn}$`, `$${X.lhs}$`, "$A'$", "$B'$", `$${X.rhs}$`, '='],
            value: (i, j) => (j < 7 ? (col(rows[i], j) ? '1' : '0') : o.lhs(rows[i]) === o.rhs(rows[i]) ? '✓' : '✗'),
            fill: (i, j) => {
              const m = rows[i];
              if (j === 7) return o.lhs(m) === o.rhs(m) ? ['green', 0.3] : ['red', 0.45];
              if (!col(m, j)) return null;
              return [['blue', 'red', 'accent', 'orange', 'blue', 'red', 'green'][j], 0.2];
            },
            weight: (i, j) => (j === 3 || j === 6 || j === 7 ? 700 : 500),
          });
        });
        v.readout(() => {
          const o = ops(), X = tx(), rows = P.map((h) => regionOf(C, h.x, h.y)), bad = rows.map((m, i) => (o.lhs(m) !== o.rhs(m) ? 'pqrs'[i] : null)).filter(Boolean);
          const all = signature(o.lhs, 2).every((b, m) => b === o.rhs(m));
          if (all) return `For each of $p, q, r, s$: in $${X.lhs}$ exactly when in $${X.rhs}$. Since the four regions of the diagram all agree, $${X.lhs} = ${X.rhs}$ for **all** sets $A, B$.`;
          return `**False:** $${X.lhs} \\ne ${X.rhs}$. ${bad.length ? `Point${bad.length > 1 ? 's' : ''} ${bad.map((c) => `$${c}$`).join(', ')} already separate${bad.length > 1 ? '' : 's'} the two sides.` : 'Drag a point into $A$ but not $B$ (or $B$ but not $A$) to see a separating element.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4a
    {
      num: '1.4a',
      kind: 'Definition',
      name: 'Cartesian product',
      statement: String.raw`The **Cartesian product** of sets $A$ and $B$ is the set of ordered pairs
$$A\times B=\{(a,b) : a\in A,\ b\in B\}.$$
More generally $A_1\times\cdots\times A_n$ is the set of $n$-tuples $(a_1,\ldots,a_n)$ with $a_i\in A_i$, and $A^n=A\times\cdots\times A$ ($n$ factors). A subset of $A\times B$ is called a **relation** from $A$ to $B$.`,
      idea: String.raw`Ordered pairs remember the order of their entries: $(a,b)=(c,d)$ exactly when $a=c$ and $b=d$. Arranging the pairs in a grid — one column per element of $A$, one row per element of $B$ — shows that a finite product has $|A\times B|=|A|\cdot|B|$ elements, that $A\times\varnothing=\varnothing$, and that $A\times B\ne B\times A$ in general. A relation is any selection of grid points; mappings (next) are the relations with exactly one point in each column.`,
      caption: String.raw`Resize $A$ and $B$ with the sliders: adding an element to $A$ adds a whole column of pairs. Click grid points to choose a relation $R\subset A\times B$; the readout says whether $R$ is a mapping $A\to B$. Switch to $B\times A$ to see the pairs flip — $(x,1)$ and $(1,x)$ are different.`,
      deps: ['alg-1.1a'],
      see: ['logic-8.4'],
      refs: ['Judson §1.2'],
      tags: ['sets', 'relations'],
      credit: 'René Descartes (coordinates), 1637',
      viz(v) {
        const nA = v.slider('$|A|$', 0, 6, 4, { int: true }), nB = v.slider('$|B|$', 0, 5, 3, { int: true });
        const swap = v.toggle('draw $B\\times A$', false);
        const s = v.stage({ x: [0, 10], y: [0, 6.9], axes: false, height: 320 });
        const R = new Set(['0,1', '1,0', '2,2', '3,0']);
        const geo = () => {
          const sw = swap.value, cols = sw ? nB.value : nA.value, rows = sw ? nA.value : nB.value;
          const dx = Math.min(1.45, 6.2 / Math.max(cols, 1)), dy = Math.min(1.4, 4.5 / Math.max(rows, 1));
          const left = 5.3 - ((cols - 1) * dx) / 2, axisX = left - 1.25;
          const X = (i) => left + i * dx, Y = (j) => 1.9 + j * dy;
          return { sw, cols, rows, X, Y, axisX };
        };
        const labA = (i) => NAMES_A[i], labB = (j) => String(j + 1);
        s.onClick((x, y) => {
          const g = geo();
          for (let i = 0; i < g.cols; i++) for (let j = 0; j < g.rows; j++) if (Math.hypot(s.X(x) - s.X(g.X(i)), s.Y(y) - s.Y(g.Y(j))) < 16) {
            const key = g.sw ? `${j},${i}` : `${i},${j}`; if (R.has(key)) R.delete(key); else R.add(key); return;
          }
        });
        v.render(() => {
          const g = geo(), colLab = g.sw ? labB : labA, rowLab = g.sw ? labA : labB;
          const colCol = g.sw ? 'red' : 'blue', rowCol = g.sw ? 'blue' : 'red';
          // the two factor sets as ovals on the axes
          if (g.cols) s.rect(g.X(0) - 0.5, 0.45, g.X(g.cols - 1) + 0.5, 1.15, { radius: 999, fill: colCol, fillAlpha: 0.08, color: colCol, width: 1.3 });
          if (g.rows) s.rect(g.axisX - 0.45, g.Y(0) - 0.45, g.axisX + 0.45, g.Y(g.rows - 1) + 0.45, { radius: 999, fill: rowCol, fillAlpha: 0.08, color: rowCol, width: 1.3 });
          s.text(g.sw ? 'B' : 'A', g.cols ? g.X(g.cols - 1) + 0.85 : 5.3, 0.8, { math: true, size: 18, color: colCol, weight: 700 });
          s.text(g.sw ? 'A' : 'B', g.axisX, g.rows ? g.Y(g.rows - 1) + 0.85 : 2, { math: true, size: 18, color: rowCol, weight: 700, align: 'center' });
          for (let i = 0; i < g.cols; i++) { s.dot(g.X(i), 0.8, { r: 5, color: colCol }); s.text(colLab(i), g.X(i), 0.8, { dy: 0, dx: 8, math: true, size: 15, color: colCol }); }
          for (let j = 0; j < g.rows; j++) { s.dot(g.axisX, g.Y(j), { r: 5, color: rowCol }); s.text(rowLab(j), g.axisX, g.Y(j), { dx: -10, align: 'right', math: true, size: 15, color: rowCol }); }
          if (!g.cols || !g.rows) { s.text(`${g.sw ? 'B × A' : 'A × B'} = ∅  (a factor is empty)`, 5.6, 4.2, { align: 'center', size: 15, color: 'muted' }); return; }
          for (let i = 0; i < g.cols; i++) for (let j = 0; j < g.rows; j++) {
            const key = g.sw ? `${j},${i}` : `${i},${j}`, inR = R.has(key);
            s.line(g.X(i), 1.15, g.X(i), g.Y(j), { color: 'faint', width: 0.8, alpha: 0.5 });
            s.dot(g.X(i), g.Y(j), { r: inR ? 6.5 : 4, color: inR ? 'accent' : 'muted', hollow: !inR });
            s.text(`(${colLab(i)}, ${rowLab(j)})`, g.X(i), g.Y(j), { dy: 15, align: 'center', size: 11, color: inR ? 'accent' : 'muted', weight: inR ? 700 : 500 });
          }
          s.corner(`${g.sw ? '|B × A|' : '|A × B|'} = ${g.cols} · ${g.rows} = ${g.cols * g.rows} ordered pairs`, 'tr', { size: 12.5, color: 'ink' });
        });
        v.readout(() => {
          const m = nA.value, n = nB.value, pairs = [...R].map((k) => k.split(',').map(Number)).filter(([i, j]) => i < m && j < n).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
          const sw = swap.value, show = pairs.map(([i, j]) => (sw ? `(${j + 1}, ${NAMES_A[i]})` : `(${NAMES_A[i]}, ${j + 1})`));
          const per = Array.from({ length: m }, (_, i) => pairs.filter((p) => p[0] === i).length);
          const none = per.map((c, i) => (c === 0 ? NAMES_A[i] : null)).filter(Boolean), many = per.map((c, i) => (c > 1 ? NAMES_A[i] : null)).filter(Boolean);
          let verdict;
          if (!m) verdict = 'With $A = \\varnothing$ the empty relation is (vacuously) a mapping.';
          else if (!none.length && !many.length) verdict = `Every element of $A$ occurs in exactly one pair, so $R$ **is a mapping** $A\\to B$.`;
          else verdict = `$R$ is **not a mapping** $A\\to B$: ${none.length ? `${none.map((a) => `$${a}$`).join(', ')} ${none.length > 1 ? 'have' : 'has'} no partner` : ''}${none.length && many.length ? '; ' : ''}${many.length ? `${many.map((a) => `$${a}$`).join(', ')} ${many.length > 1 ? 'have' : 'has'} several` : ''}.`;
          const R2 = sw ? 'R^{-1}\\subset B\\times A' : 'R\\subset A\\times B';
          return `$${R2}$: $\\{${show.join(', ') || ''}\\}$ — ${pairs.length} of the ${m * n} pairs, one of $2^{${m * n}}$ possible relations. ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5a
    {
      num: '1.5a',
      kind: 'Definition',
      name: 'Mappings: domain, range and image',
      statement: String.raw`A **mapping** (or **function**) $f:A\to B$ is a relation $f\subset A\times B$ in which every $a\in A$ is paired with **exactly one** $b\in B$; we write $f(a)=b$ or $a\mapsto b$. $A$ is the **domain** of $f$, and
$$f(A)=\{f(a) : a\in A\}\subset B$$
is its **range** or **image**. A rule that seems to assign values is **well-defined** only if each element of the domain receives a single value — even when the element has several names.`,
      idea: String.raw`In an arrow diagram, being a map is a condition on the domain only: one arrow leaves each element of $A$ — not zero, not two. Nothing is required of $B$: some of its elements may receive several arrows, others none, and the ones that receive arrows make up the image. Well-definedness is the same condition in disguise: the rule $p/q\mapsto p$ on $\mathbb Q$ fails because $1/2=2/4$ is one element that would be sent to both $1$ and $2$.`,
      caption: String.raw`Drag from an element of $A$ to an element of $B$ to add or remove an arrow (or click an element of $A$ to point its single arrow at the next element of $B$). An element of $A$ with no arrow or with two turns red; elements of $B$ that are hit are ringed green — they form the image $f(A)$. The preset $p/q\mapsto p$ shows a rule that is not well-defined.`,
      deps: ['alg-1.4a'],
      see: ['logic-8.4'],
      refs: ['Judson §1.2'],
      tags: ['functions'],
      viz(v) {
        const pre = v.select('start from', [{ value: 'f', label: 'Judson’s $f$' }, { value: 'g', label: 'Judson’s $g$' }, { value: 'pq', label: '$p/q\\mapsto p$' }], 'f', { onChange: (k) => load(k) });
        const nA = v.slider('$|A|$', 1, 6, 3, { int: true }), nB = v.slider('$|B|$', 1, 6, 3, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6.8], axes: false, height: 330 });
        let rel = Array.from({ length: 6 }, () => Array(6).fill(false));
        function load(k) {
          rel = Array.from({ length: 6 }, () => Array(6).fill(false));
          if (k === 'f') { nA.set(3); nB.set(3); rel[0][1] = rel[1][2] = rel[2][2] = true; }
          if (k === 'g') { nA.set(3); nB.set(3); rel[0][0] = rel[0][1] = rel[1][2] = rel[2][0] = true; }
          nA.el.hidden = nB.el.hidden = k === 'pq';
        }
        load('f');
        const geo = () => ({ A: colPts(nA.value, 2.6, 5.4, 1.1), B: colPts(nB.value, 7.4, 5.4, 1.1) });
        const ed = linkEditor(v, s, () => (pre.value === 'pq' ? [] : [{ pts: geo().A, to: 1 }, { pts: geo().B, to: null }]),
          (c, i, j) => { rel[i][j] = !rel[i][j]; },
          (c, i) => { if (c !== 0) return; const n = nB.value, cur = rel[i].slice(0, n).indexOf(true); rel[i] = Array(6).fill(false); rel[i][(cur + 1) % n] = true; });
        v.render(() => {
          if (pre.value === 'pq') {
            // the rule p/q ↦ p on ℚ: one rational, several names, several images
            const groups = [[['1/2', 1], ['2/4', 2], ['3/6', 3]], [['1/3', 1], ['2/6', 2]]], Bp = colPts(3, 7.4, 5.0, 1.6);
            drawBlob(v, s, [[2.6, 5.6], [2.6, 0.9]], { name: 'ℚ', padX: 1.5, padY: 0.25 });
            drawBlob(v, s, Bp, { name: 'ℤ', padPy: 30 });
            let y = 5.25;
            groups.forEach((g, gi) => {
              const y0 = y, pts = g.map(() => { const p = [2.6, y]; y -= 0.82; return p; }); y -= 0.45;
              s.rect(1.55, pts[pts.length - 1][1] - 0.38, 3.65, y0 + 0.38, { radius: 12, fill: gi ? 'orange' : 'red', fillAlpha: 0.08, color: gi ? 'orange' : 'red', width: 1.4, dash: [4, 3] });
              s.text(gi ? 'one rational, two names' : 'one rational, three names', 1.5, y0 + 0.55, { size: 11, color: gi ? 'orange' : 'red' });
              g.forEach(([name, p], k) => { mapArrow(v, s, pts[k], Bp[p - 1], { color: 'red', width: 1.8 }); s.dot(pts[k][0], pts[k][1], { r: 5, color: 'ink' }); s.text(name, pts[k][0], pts[k][1], { dx: -12, align: 'right', size: 14, weight: 600 }); });
            });
            drawElems(v, s, Bp, ['1', '2', '3'], { side: 'right', color: 'ink' });
            return;
          }
          const { A, B } = geo(), m = nA.value, n = nB.value;
          const outdeg = A.map((_, i) => rel[i].slice(0, n).filter(Boolean).length), hit = B.map((_, j) => rel.slice(0, m).some((r) => r[j]));
          drawBlob(v, s, A, { name: 'A', nameColor: 'blue', color: 'blue', fill: 'blue' });
          drawBlob(v, s, B, { name: 'B', nameColor: 'red', color: 'red', fill: 'red' });
          for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (rel[i][j]) mapArrow(v, s, A[i], B[j], { color: outdeg[i] > 1 ? 'red' : 'ink', width: 2 });
          ed.rubber();
          drawElems(v, s, A, A.map((_, i) => String(i + 1)), { side: 'left', style: (i) => (outdeg[i] === 1 ? { color: 'ink' } : { color: 'red', hollow: outdeg[i] === 0, ring: outdeg[i] > 1 ? 'red' : null }) });
          drawElems(v, s, B, B.map((_, j) => 'abcdef'[j]), { side: 'right', style: (j) => (hit[j] ? { color: 'ink', ring: 'green' } : { color: 'muted' }) });
          A.forEach((p, i) => { if (outdeg[i] === 0) s.text('no arrow', p[0], p[1], { dy: 15, align: 'center', size: 10.5, color: 'red' }); if (outdeg[i] > 1) s.text(`${outdeg[i]} arrows`, p[0], p[1], { dy: 16, align: 'center', size: 10.5, color: 'red' }); });
        });
        v.readout(() => {
          if (pre.value === 'pq') return String.raw`The "rule" $f(p/q) = p$ is **not well-defined**: $1/2 = 2/4 = 3/6$ is a single element of $\mathbb Q$, yet the rule offers $1$, $2$ and $3$ as its value. Judson repairs it by insisting on lowest terms with a positive denominator — then $p/q \mapsto p$ is a genuine map $\mathbb Q\to\mathbb Z$ (onto, but not one-to-one).`;
          const m = nA.value, n = nB.value, outs = Array.from({ length: m }, (_, i) => [...Array(n).keys()].filter((j) => rel[i][j]));
          const img = [...Array(n).keys()].filter((j) => outs.some((o) => o.includes(j))).map((j) => 'abcdef'[j]);
          const bad0 = outs.map((o, i) => (o.length === 0 ? i + 1 : null)).filter(Boolean), bad2 = outs.map((o, i) => (o.length > 1 ? `${i + 1}\\mapsto ${o.map((j) => 'abcdef'[j]).join(',')}` : null)).filter(Boolean);
          if (!bad0.length && !bad2.length) return String.raw`**A mapping** $f : A\to B$: each element of the domain $A = ${setList([...Array(m).keys()].map((i) => i + 1))}$ has exactly one arrow (${outs.map((o, i) => `$f(${i + 1}) = ${'abcdef'[o[0]]}$`).join(', ')}). Its range is $f(A) = ${setList(img)}$${img.length < n ? ` — a proper subset of $B$, which is allowed` : ' — all of $B$'}.`;
          return `**Not a mapping:** ${bad0.length ? `${bad0.map((i) => `$${i}$`).join(', ')} ${bad0.length > 1 ? 'have' : 'has'} no image` : ''}${bad0.length && bad2.length ? '; ' : ''}${bad2.length ? `${bad2.map((t) => `$${t}$`).join(', ')} — two values for one input` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7a
    {
      num: '1.7a',
      kind: 'Definition',
      name: 'Injective, surjective and bijective maps',
      statement: String.raw`A map $f:A\to B$ is
- **one-to-one** (injective) if $a_1\ne a_2$ implies $f(a_1)\ne f(a_2)$ — equivalently, $f(a_1)=f(a_2)$ forces $a_1=a_2$;
- **onto** (surjective) if $f(A)=B$, that is, every $b\in B$ equals $f(a)$ for some $a\in A$;
- **bijective** if it is both one-to-one and onto.`,
      idea: String.raw`Count the arrows arriving at each $b\in B$, the size of the fibre $f^{-1}(b)=\{a : f(a)=b\}$: one-to-one means every fibre has at most one element, onto means every fibre has at least one, bijective means every fibre has exactly one — a perfect matching of $A$ with $B$. For finite sets this forces $|A|\le|B|$ for an injection and $|A|\ge|B|$ for a surjection (the pigeonhole principle), so a bijection exists only when $|A|=|B|$.`,
      caption: String.raw`Drag arrows to re-target $f(a)$, or click an element of $A$ to move its arrow down one step. Collisions (two arrows into one element) and missed elements of $B$ are marked red; the bar chart on the right shows every fibre size against the line $1$. Resize the sets to watch the pigeonhole principle rule out injections or surjections; the readout counts how many maps of each kind exist.`,
      deps: ['alg-1.5a'],
      see: ['comb-1.2'],
      refs: ['Judson §1.2'],
      tags: ['functions'],
      viz(v) {
        const nA = v.slider('$|A|$', 1, 7, 4, { int: true }), nB = v.slider('$|B|$', 1, 7, 5, { int: true });
        let f = [0, 2, 2, 4, 1, 3, 5], seed = 1;
        v.button('Random map', () => { const r = v.rng(seed++ * 7 + 3); f = f.map(() => r.int(0, nB.value - 1)); });
        v.button('Random bijection', () => { const r = v.rng(seed++ * 11 + 5); const n = nA.value; nB.set(n); const p = r.shuffle([...Array(n).keys()]); f = f.map((x, i) => (i < n ? p[i] : 0)); });
        const s = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 330, weight: 1.55 });
        const b = v.stage({ x: [-0.6, 6.6], y: [0, 4], height: 330, axes: 'box', gutter: true, weight: 1, ylabel: 'fibre size |f⁻¹(b)|', xlabel: 'element b of B' });
        const geo = () => ({ A: colPts(nA.value, 2.4, 5.9, 0.9), B: colPts(nB.value, 7.6, 5.9, 0.9) });
        const fv = () => f.slice(0, nA.value).map((x) => Math.min(x, nB.value - 1));
        const ed = linkEditor(v, s, () => [{ pts: geo().A, to: 1 }, { pts: geo().B, to: null }], (c, i, j) => { f[i] = j; }, (c, i) => { if (c === 0) f[i] = (Math.min(f[i], nB.value - 1) + 1) % nB.value; });
        v.render(() => {
          const { A, B } = geo(), g = fv(), info = mapInfo(g, nB.value), coll = new Set(info.collisions.map(([bb]) => bb));
          drawBlob(v, s, A, { name: 'A', nameColor: 'blue', color: 'blue', fill: 'blue' });
          drawBlob(v, s, B, { name: 'B', nameColor: 'red', color: 'red', fill: 'red' });
          g.forEach((bb, i) => mapArrow(v, s, A[i], B[bb], { color: info.bij ? 'green' : coll.has(bb) ? 'red' : 'ink', width: info.bij ? 2.4 : 2 }));
          ed.rubber();
          drawElems(v, s, A, A.map((_, i) => String(i + 1)), { side: 'left', color: 'ink' });
          drawElems(v, s, B, B.map((_, j) => 'abcdefg'[j]), { side: 'right', style: (j) => (coll.has(j) ? { color: 'red', ring: 'red' } : info.missed.includes(j) ? { color: 'red', hollow: true } : { color: info.bij ? 'green' : 'ink' }) });
          const badge = (ok, txt, y) => s.text(`${tick(ok)} ${txt}`, 5, y, { align: 'center', size: 13.5, weight: 700, color: ok ? 'green' : 'red' });
          badge(info.inj, 'one-to-one', 6.65); badge(info.surj, 'onto', 6.25);
          if (info.bij) s.text('bijection: a perfect matching', 5, 0.35, { align: 'center', size: 12.5, color: 'green', weight: 600 });
          // fibre bar chart
          const n = nB.value, ymax = Math.max(3, ...info.hits.map((h) => h.length)) + 0.6;
          b.setView([-0.6, n - 0.4], [0, ymax]);
          b.setTicks(Array.from({ length: n }, (_, j) => [j, 'abcdefg'[j]]), Array.from({ length: Math.floor(ymax) + 1 }, (_, k) => k));
          b.hline(1, { color: 'green', width: 1.4, dash: [5, 4] });
          info.hits.forEach((h, j) => {
            const c = h.length === 1 ? 'green' : 'red';
            if (h.length) b.rect(j - 0.32, 0, j + 0.32, h.length, { fill: c, fillAlpha: 0.45, color: c, width: 1.4 });
            else b.rect(j - 0.32, 0, j + 0.32, 0.08, { fill: 'red', fillAlpha: 0.9, stroke: false });
            b.text(h.length ? h.map((a) => a + 1).join(',') : 'missed', j, Math.max(h.length, 0.1), { dy: -10, align: 'center', size: 10.5, color: c });
          });
        });
        v.readout(() => {
          const m = nA.value, n = nB.value, info = mapInfo(fv(), n), tot = n ** m, inj = m <= n ? fact(n) / fact(n - m) : 0, sur = m >= n ? fact(n) * stirling2(m, n) : 0;
          const why = [];
          if (!info.inj) why.push(`$f(${info.collisions[0][1].map((a) => a + 1).join(') = f(')}) = ${'abcdefg'[info.collisions[0][0]]}$`);
          if (!info.surj) why.push(`nothing hits $${info.missed.map((j) => 'abcdefg'[j]).join(', ')}$`);
          return `${info.bij ? '**Bijective.**' : info.inj ? '**One-to-one, not onto.**' : info.surj ? '**Onto, not one-to-one.**' : '**Neither.**'} ${why.join('; ')}${why.length ? '.' : ''} Of the $${n}^{${m}} = ${tot}$ maps $A\\to B$, ${inj} ${inj === 1 ? 'is' : 'are'} one-to-one${m > n ? ' (none: $|A| > |B|$)' : ''}, ${sur} onto${m < n ? ' (none: $|A| < |B|$)' : ''} and ${m === n ? fact(n) : 0} bijective.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8a
    {
      num: '1.8a',
      kind: 'Definition',
      name: 'Composition of mappings',
      statement: String.raw`For maps $f:A\to B$ and $g:B\to C$, the **composition** $g\circ f:A\to C$ is the map
$$(g\circ f)(a)=g(f(a))\qquad(a\in A).$$
It first applies $f$, then $g$ — composition is read from right to left. The composite $f\circ g$ makes sense only when $g$ lands in the domain of $f$, and even when both are defined, $f\circ g$ and $g\circ f$ usually differ.`,
      idea: String.raw`In an arrow diagram, $g\circ f$ is found by following two arrows in a row: from $a$ along $f$ into $B$, then along $g$ into $C$. The order matters because the second map acts on the output of the first. Judson's example: with $f(x)=x^2$ and $g(x)=2x+5$ on $\mathbb R$, $(f\circ g)(x)=(2x+5)^2$ while $(g\circ f)(x)=2x^2+5$.`,
      caption: String.raw`Drag arrows to edit $f$ (left) and $g$ (middle); each arrow is coloured by the element of the middle set it passes through. The right panel draws the composite. In mode $S\to S\to S$ both orders are defined and are drawn side by side; arrows where $g\circ f$ and $f\circ g$ disagree are red.`,
      deps: ['alg-1.5a'],
      refs: ['Judson §1.2'],
      tags: ['functions', 'composition'],
      viz(v) {
        const mode = v.select('sets', [{ value: 'abc', label: '$A\\to B\\to C$' }, { value: 'sss', label: '$S\\to S\\to S$' }], 'abc');
        const s = v.stage({ x: [0, 10], y: [0, 6.8], axes: false, height: 320, weight: 1.45 });
        const t = v.stage({ x: [0, 10], y: [0, 6.8], axes: false, height: 320, weight: 1 });
        const st = { abc: { f: [1, 2, 0], g: [2, 2, 0, 1], sizes: [3, 4, 3] }, sss: { f: [1, 2, 0, 0], g: [0, 0, 3, 2], sizes: [4, 4, 4] } };
        const cur = () => st[mode.value];
        const geo = () => { const z = cur().sizes; return [colPts(z[0], 1.6, 5.4, 1.1), colPts(z[1], 5, 5.4, 1.1), colPts(z[2], 8.4, 5.4, 1.1)]; };
        const ed = linkEditor(v, s, () => { const G = geo(); return [{ pts: G[0], to: 1 }, { pts: G[1], to: 2 }, { pts: G[2], to: null }]; },
          (c, i, j) => { (c === 0 ? cur().f : cur().g)[i] = j; }, (c, i) => { if (c === 2) return; const M = c === 0 ? cur().f : cur().g, n = cur().sizes[c + 1]; M[i] = (M[i] + 1) % n; });
        const labs = (k) => (mode.value === 'sss' ? ['1', '2', '3', '4'] : [['1', '2', '3'], ['a', 'b', 'c', 'd'], ['X', 'Y', 'Z']][k]);
        v.render(() => {
          const G = geo(), { f, g } = cur(), sss = mode.value === 'sss', names = sss ? ['S', 'S', 'S'] : ['A', 'B', 'C'];
          G.forEach((P, k) => drawBlob(v, s, P, { name: names[k], color: ['blue', 'orange', 'red'][k], fill: ['blue', 'orange', 'red'][k], nameColor: ['blue', 'orange', 'red'][k] }));
          f.forEach((b, a) => mapArrow(v, s, G[0][a], G[1][b], { color: PATH[b], width: 2 }));
          g.forEach((c, b) => mapArrow(v, s, G[1][b], G[2][c], { color: PATH[b], width: 2 }));
          ed.rubber();
          G.forEach((P, k) => drawElems(v, s, P, labs(k), { side: k === 2 ? 'right' : 'left', style: (i) => (k === 1 ? { color: PATH[i] } : { color: 'ink' }) }));
          s.text('f', 3.3, 6.25, { math: true, size: 18, align: 'center', weight: 700 }); s.text('g', 6.7, 6.25, { math: true, size: 18, align: 'center', weight: 700 });
          if (!sss) {
            const A = colPts(3, 3, 5.4, 1.1), C = colPts(3, 7, 5.4, 1.1);
            drawBlob(v, t, A, { name: 'A', color: 'blue', fill: 'blue', nameColor: 'blue' }); drawBlob(v, t, C, { name: 'C', color: 'red', fill: 'red', nameColor: 'red' });
            f.forEach((b, a) => mapArrow(v, t, A[a], C[g[b]], { color: PATH[b], width: 2.2 }));
            drawElems(v, t, A, labs(0), { side: 'left' }); drawElems(v, t, C, labs(2), { side: 'right' });
            t.text('g ∘ f', 5, 6.25, { size: 17, align: 'center', weight: 700, math: true });
          } else {
            const gf = f.map((b) => g[b]), fg = g.map((c) => f[c]);
            [[gf, 1.2, 3.6, 'g ∘ f'], [fg, 6.4, 8.8, 'f ∘ g']].forEach(([h, x0, x1, name]) => {
              const P = colPts(4, x0, 5.4, 1.1), Q = colPts(4, x1, 5.4, 1.1);
              drawBlob(v, t, P, { padPx: 30 }); drawBlob(v, t, Q, { padPx: 30 });
              h.forEach((c, a) => mapArrow(v, t, P[a], Q[c], { color: gf[a] === fg[a] ? 'ink' : 'red', width: 2.1 }));
              drawElems(v, t, P, labs(0), { side: 'left', size: 13 }); drawElems(v, t, Q, labs(0), { side: 'right', size: 13 });
              t.text(name, (x0 + x1) / 2, 6.25, { size: 17, align: 'center', weight: 700, math: true });
            });
          }
        });
        v.readout(() => {
          const { f, g } = cur();
          if (mode.value === 'abc') {
            const L = labs(0), C = labs(2);
            return String.raw`$g\circ f$: ${f.map((b, a) => `$${L[a]}\\mapsto ${C[g[b]]}$`).join(', ')}. The other order $f\circ g$ is **undefined**: $g$ produces elements of $C$, but $f$ only accepts elements of $A$.`;
          }
          const gf = f.map((b) => g[b]), fg = g.map((c) => f[c]), two = (h) => String.raw`\begin{pmatrix}1&2&3&4\\ ${h.map((x) => x + 1).join('&')}\end{pmatrix}`;
          const diff = gf.map((x, i) => (x !== fg[i] ? i + 1 : null)).filter(Boolean);
          return `$g\\circ f = ${two(gf)}$, $\\ f\\circ g = ${two(fg)}$ — ${diff.length ? `they differ at ${diff.map((i) => `$${i}$`).join(', ')}, so the order of composition matters.` : '**equal** for this pair: these two maps happen to commute.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14a
    {
      num: '1.14a',
      kind: 'Definition',
      name: 'Permutation of a set',
      statement: String.raw`A **permutation** of a set $S$ is a bijection $\pi:S\to S$ — a one-to-one and onto map of $S$ to itself. For $S=\{1,2,\ldots,n\}$ it is written in **two-row notation**
$$\pi=\begin{pmatrix}1&2&\cdots&n\\ \pi(1)&\pi(2)&\cdots&\pi(n)\end{pmatrix},$$
whose bottom row lists every element of $S$ exactly once. There are $n!$ permutations of an $n$-element set.`,
      idea: String.raw`Think of $n$ numbered tokens placed in $n$ slots: $\pi(i)$ is the slot where token $i$ ends up. Since each slot holds one token and each token sits in one slot, the map is one-to-one and onto; the bottom row of the two-row notation is a rearrangement of the top. Counting rearrangements — $n$ choices for $\pi(1)$, then $n-1$ for $\pi(2)$, and so on — gives $n!$. Permutations will be the first examples of groups (the symmetric groups) in Chapter 3.`,
      caption: String.raw`Drag from a token in the top row to a slot in the bottom row: the two tokens trade places, so the picture stays a permutation, and the two-row and cycle notations update. Switch on **allow any map** and the dragged token is simply moved — two tokens can now land in the same slot, and the readout flags that the result is no longer a permutation.`,
      deps: ['alg-1.7a'],
      see: ['comb-1.5'],
      refs: ['Judson §1.2'],
      tags: ['permutations'],
      viz(v) {
        const N = v.slider('$n = |S|$', 2, 8, 5, { int: true, onChange: () => { p = [...Array(8).keys()]; } });
        const free = v.toggle('allow any map (not just bijections)', false, { onChange: (on) => { if (!on) p = [...Array(8).keys()]; } });
        let p = [1, 2, 0, 4, 3, 5, 6, 7], seed = 2;
        v.button('Shuffle', () => { const r = v.rng(seed++ * 13 + 1), n = N.value, q = r.shuffle([...Array(n).keys()]); p = q.concat([...Array(8).keys()].slice(n)); });
        v.button('Identity', () => { p = [...Array(8).keys()]; });
        const s = v.stage({ x: [0, 10], y: [0, 5.6], axes: false, height: 290 });
        const X = (i, n) => 1 + (8 * (i + 0.5)) / n, TOP = 4.3, BOT = 1.3;
        const ed = linkEditor(v, s, () => { const n = N.value; return [{ pts: [...Array(n).keys()].map((i) => [X(i, n), TOP]), to: 1 }, { pts: [...Array(n).keys()].map((i) => [X(i, n), BOT]), to: null }]; },
          (c, i, j) => { if (free.value) { p[i] = j; return; } const k = p.indexOf(j); const old = p[i]; p[i] = j; if (k >= 0 && k !== i) p[k] = old; });
        v.render(() => {
          const n = N.value, q = p.slice(0, n), hits = Array(n).fill(0); q.forEach((j) => hits[j]++);
          s.rect(0.55, TOP - 0.55, 9.45, TOP + 0.55, { radius: 14, fill: 'muted', fillAlpha: 0.06, color: 'muted', width: 1, alpha: 0.5 });
          s.rect(0.55, BOT - 0.8, 9.45, BOT + 0.55, { radius: 14, fill: 'muted', fillAlpha: 0.06, color: 'muted', width: 1, alpha: 0.5 });
          s.text('tokens  i', 0.6, TOP + 0.85, { size: 12, color: 'muted' }); s.text('slots  π(i)', 0.6, BOT - 1.08, { size: 12, color: 'muted' });
          q.forEach((j, i) => mapArrow(v, s, [X(i, n), TOP], [X(j, n), BOT], { color: hits[j] > 1 ? 'red' : CAT[i % 8], width: 2.2, trim0: 15, trim1: 17 }));
          ed.rubber({ trim0: 15 });
          for (let i = 0; i < n; i++) {
            s.dot(X(i, n), TOP, { r: 13, color: CAT[i % 8], ring: false });
            s.text(String(i + 1), X(i, n), TOP, { align: 'center', size: 14, weight: 700, color: 'panel', halo: false });
            const occ = q.map((jj, ii) => (jj === i ? ii : -1)).filter((ii) => ii >= 0);
            if (!occ.length) { s.dot(X(i, n), BOT, { r: 13, color: 'red', hollow: true }); s.text(String(i + 1), X(i, n), BOT, { align: 'center', size: 13, color: 'red' }); s.text('empty', X(i, n), BOT, { dy: 22, align: 'center', size: 10.5, color: 'red' }); }
            else {
              occ.forEach((ii, k) => { const dx = (k - (occ.length - 1) / 2) * 0.32; s.dot(X(i, n) + dx, BOT, { r: 13, color: CAT[ii % 8] }); s.text(String(ii + 1), X(i, n) + dx, BOT, { align: 'center', size: 14, weight: 700, color: 'panel', halo: false }); });
              s.text(String(i + 1), X(i, n), BOT, { dy: 23, align: 'center', size: 11, color: occ.length > 1 ? 'red' : 'muted', weight: occ.length > 1 ? 700 : 500 });
            }
          }
        });
        v.readout(() => {
          const n = N.value, q = p.slice(0, n), hits = Array(n).fill(0); q.forEach((j) => hits[j]++);
          const two = String.raw`\begin{pmatrix}${[...Array(n).keys()].map((i) => i + 1).join('&')}\\ ${q.map((j) => j + 1).join('&')}\end{pmatrix}`;
          const dup = hits.map((h, j) => (h > 1 ? j + 1 : null)).filter(Boolean), miss = hits.map((h, j) => (h === 0 ? j + 1 : null)).filter(Boolean);
          if (dup.length) return `$\\pi = ${two}$ is **not a permutation**: slot ${dup.join(', ')} receives two tokens and ${miss.join(', ')} none — the bottom row repeats an entry, so $\\pi$ is neither one-to-one nor onto.`;
          let rank = 0; const used = Array(n).fill(false);
          for (let i = 0; i < n; i++) { let c = 0; for (let j = 0; j < q[i]; j++) if (!used[j]) c++; rank += c * fact(n - 1 - i); used[q[i]] = true; }
          return `$\\pi = ${two} = ${cycleTex(q)}$ in cycle notation. A bijection of $S$ — permutation number ${rank + 1} of the $${n}! = ${fact(n)}$ in dictionary order of the bottom row.`;
        });
      },
    },
  ],
};
