// Abstract Algebra (Judson) — Chapter 3: Groups
// Part 1 (this file): arithmetic in ℤₙ, symmetries, the group axioms, Cayley tables, U(n), the nonabelian triangle group,
// GL₂(ℝ) and the quaternions (3.4–3.15). Part 2 (ch03-b.js): order, the basic properties of groups, exponents and
// subgroups (3.16a–3.31). Shared group machinery: ch03.shared.js.
import { EC, elColor, gcd, cyclic, units, zmul, dihedral, quaternion, polygon, permMatrix, mm, mv, I2, partial, axisOf, drawFigure, permTex, assocFail, latinFails, drawCayley } from './ch03.shared.js';

/** A short tween driven by redraws (jumps to the end in screenshots and under reduced motion). */
function tweener(v, ms = 420) {
  let t0 = -1e9;
  return {
    start() { t0 = performance.now(); v.invalidate(); },
    get t() {
      const still = typeof window !== 'undefined' && (window.__vizStill || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));
      const u = still ? 1 : Math.min(1, (performance.now() - t0) / ms);
      if (u < 1 && typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => v.invalidate());
      return u;
    },
  };
}
const cellLab = (s) => (/^\d+$/.test(s) ? s : `$${s}$`);

export default {
  collection: 'alg',
  chapter: 3,
  title: 'Groups',
  summary: String.raw`Clock arithmetic in $\mathbb Z_n$ and the symmetries of a triangle turn out to be two faces of one structure, which is then axiomatised as a group, with Cayley tables, the groups of units $U(n)$, matrix groups and the quaternions as further examples. Basic consequences follow — the identity and inverses are unique, $(ab)^{-1}=b^{-1}a^{-1}$, equations $ax=b$ can be solved and cancelled, exponents obey the usual laws — and the chapter ends with subgroups and two tests for recognising them.`,
  items: [
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Proposition',
      name: 'Arithmetic in ℤₙ',
      statement: String.raw`Let $\mathbb Z_n$ be the set of classes of integers mod $n$, with addition and multiplication of remainders mod $n$, and let $a,b,c\in\mathbb Z_n$. Then
(1) $a+b\equiv b+a$ and $ab\equiv ba \pmod n$;
(2) $(a+b)+c\equiv a+(b+c)$ and $(ab)c\equiv a(bc) \pmod n$;
(3) $a+0\equiv a$ and $a\cdot1\equiv a \pmod n$;
(4) $a(b+c)\equiv ab+ac \pmod n$;
(5) every $a$ has an additive inverse: $a+(-a)\equiv 0 \pmod n$;
(6) for $a\ne0$: $\gcd(a,n)=1$ if and only if $a$ has a multiplicative inverse $b$, i.e. $ab\equiv1\pmod n$.`,
      idea: String.raw`(1)–(5) are inherited from $\mathbb Z$: congruence mod $n$ respects sums and products, so each law for integers survives on remainders. (6) is the interesting one. If $\gcd(a,n)=1$, Bézout gives $ar+ns=1$, so $ar\equiv1$ and $r$ is the inverse. Conversely $ab\equiv1$ means $ab-nk=1$, and any common divisor $d$ of $a$ and $n$ divides $1$. Geometrically: the multiples $0, a, 2a, \ldots$ on the clock land only on multiples of $d=\gcd(a,n)$, so they hit $1$ exactly when $d=1$.`,
      caption: String.raw`Drag the hands $a$ and $b$ around the $n$-hour clock and pick $+$ or $\cdot$; the gold hand shows the result, also marked in the table on the right. With $\cdot$, the purple star joins $0, a, 2a, 3a, \ldots$: its corners are the multiples of $\gcd(a,n)$, and it reaches $1$ — so $a$ is invertible — only when $\gcd(a,n)=1$ (green-ringed hours).`,
      deps: ['alg-1.30', 'alg-2.11'],
      see: ['nt-2.1'],
      refs: ['Judson §3.1'],
      tags: ['modular arithmetic'],
      viz(v) {
        const N = v.slider('$n$', 2, 16, 8, { int: true });
        const op = v.select('operation', [{ value: '+', label: '$+$' }, { value: '*', label: '$\\cdot$' }], '*');
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 350, weight: 1 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 1 });
        const T = v.table(t, { rows: 8, cols: 8, maxCell: 30, size: 12, margin: 4 });
        const hour = (k, n) => { const a = Math.PI / 2 - (2 * Math.PI * k) / n; return [Math.cos(a), Math.sin(a)]; };
        const snapTo = (x, y) => { const n = N.value, k = ((Math.round(((Math.PI / 2 - Math.atan2(y, x)) * n) / (2 * Math.PI)) % n) + n) % n; return hour(k, n).map((c) => c * 0.82); };
        const hA = s.handle(...hour(3, 8).map((c) => c * 0.82), { color: 'accent', label: 'a', constrain: snapTo }), hB = s.handle(...hour(5, 8).map((c) => c * 0.82), { color: 'orange', label: 'b', constrain: snapTo });
        const val = (h) => { const n = N.value; return ((Math.round(((Math.PI / 2 - Math.atan2(h.y, h.x)) * n) / (2 * Math.PI)) % n) + n) % n; };
        let lastN = 8;
        t.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { const n = N.value; hA.set(...hour(c.i, n).map((q) => q * 0.82)); hB.set(...hour(c.j, n).map((q) => q * 0.82)); } });
        v.render(() => {
          const n = N.value, mul = op.value === '*';
          if (n !== lastN) { const a = Math.min(val(hA), n - 1), b = Math.min(val(hB), n - 1); lastN = n; hA.set(...hour(a % n, n).map((c) => c * 0.82)); hB.set(...hour(b % n, n).map((c) => c * 0.82)); }
          const a = val(hA), b = val(hB), r = mul ? (a * b) % n : (a + b) % n, d = gcd(a, n);
          s.circle(0, 0, 1, { color: 'muted', width: 1.5, fill: 'muted', fillAlpha: 0.05 });
          if (mul) { const pts = []; for (let k = 0; k <= n; k++) pts.push(hour((a * k) % n, n)); s.path(pts, { color: 'purple', width: 1.6, alpha: 0.7 }); }
          for (let k = 0; k < n; k++) {
            const [x, y] = hour(k, n), unit = gcd(k, n) === 1, onStar = mul && k % d === 0;
            s.dot(x, y, { r: onStar ? 6 : 4.5, color: onStar ? 'purple' : 'muted' });
            if (mul && unit) s.circle(x, y, 0.09, { color: 'green', width: 2, fill: false });
            s.text(String(k), x * 1.2, y * 1.2, { align: 'center', size: 14, weight: k === r ? 800 : 600, color: k === r ? 'gold' : 'ink' });
          }
          const [rx, ry] = hour(r, n); s.arrow(0, 0, rx * 0.92, ry * 0.92, { color: 'gold', width: 3.5 });
          s.line(0, 0, hA.x, hA.y, { color: 'accent', width: 2.4 }); s.line(0, 0, hB.x, hB.y, { color: 'orange', width: 2.4 });
          s.dot(0, 0, { r: 4, color: 'ink' });
          s.corner(`${a} ${mul ? '·' : '+'} ${b} ≡ ${r} (mod ${n})`, 'tl', { size: 14, color: 'ink', weight: 700 });
          T.draw({
            rows: n, cols: n, rowLabels: (i) => String(i), colLabels: (j) => String(j), cornerLabel: mul ? '·' : '+',
            value: (i, j) => (mul ? (i * j) % n : (i + j) % n),
            fill: (i, j) => { const x = mul ? (i * j) % n : (i + j) % n; return mul && x === 1 ? ['green', 0.45] : x === 0 ? ['muted', 0.12] : null; },
            highlight: [[a, b, 'gold']], activeRow: a, activeCol: b,
          });
        });
        v.readout(() => {
          const n = N.value, a = val(hA), b = val(hB), r = v.rng(n * 31 + 7);
          let comm = 0, ass = 0, dist = 0; for (let k = 0; k < 40; k++) { const x = r.int(0, n - 1), y = r.int(0, n - 1), z = r.int(0, n - 1); if ((x * y) % n === (y * x) % n && (x + y) % n === (y + x) % n) comm++; if ((((x * y) % n) * z) % n === (x * ((y * z) % n)) % n && (x + y + z) % n === (x + ((y + z) % n)) % n) ass++; if ((x * ((y + z) % n)) % n === ((x * y) % n + (x * z) % n) % n) dist++; }
          const d = gcd(a, n); let invTxt;
          if (a === 0) invTxt = `$0$ never has a multiplicative inverse.`;
          else if (d === 1) { const inv = [...Array(n).keys()].find((k) => (a * k) % n === 1), rr = (a * inv - 1) / n; invTxt = String.raw`$\gcd(${a}, ${n}) = 1$, so $${a}^{-1} = ${inv}$: indeed $${a}\cdot ${inv} = ${a * inv} = ${rr}\cdot ${n} + 1$.`; }
          else invTxt = String.raw`$\gcd(${a}, ${n}) = ${d} > 1$: every product $${a}k$ is a multiple of ${d} mod ${n}, never $1$ — **no inverse**.`;
          return String.raw`Laws on 40 random triples: commutative ${comm}/40, associative ${ass}/40, distributive ${dist}/40. ${invTxt} Invertible elements: $\{${[...Array(n).keys()].filter((k) => k && gcd(k, n) === 1).join(', ')}\}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5a
    {
      num: '3.5a',
      kind: 'Definition',
      name: 'Symmetries of a figure (rigid motions)',
      statement: String.raw`A **symmetry** of a geometric figure is a rigid motion of the plane — a map preserving distances — that carries the figure onto itself, rearranging its vertices and sides but preserving all distances and angles. Each symmetry of a polygon permutes its vertices, so it can be recorded as a permutation, e.g. $\begin{pmatrix}A&B&C\\B&C&A\end{pmatrix}$. An equilateral triangle has $3!=6$ symmetries (three rotations, three reflections); a non-square rectangle has only four.`,
      idea: String.raw`A rigid motion of a polygon is determined by where it sends two adjacent vertices, so it is pinned down by a permutation of the vertices; conversely only some permutations come from motions. For the equilateral triangle every one of the $3!$ permutations is realised — rotations by $0^\circ$, $120^\circ$, $240^\circ$ and flips about the three axes. For a rectangle a $90^\circ$ rotation does not fit back into the outline, leaving the identity, the half turn and two flips.`,
      caption: String.raw`Drag the grip on vertex $A$ to rotate the card, press **Flip** to turn it over (about the vertical axis; the back side is orange). Whenever the card fits the dashed outline the motion is recorded as a permutation of the vertices. Try to find all symmetries — and see that the rectangle refuses $90^\circ$ turns.`,
      deps: ['alg-1.14a'],
      refs: ['Judson §3.1'],
      tags: ['symmetry'],
      viz(v) {
        const SH = { tri: polygon(3), sq: polygon(4), rect: [[-1.3, 0.72], [1.3, 0.72], [1.3, -0.72], [-1.3, -0.72]] };
        const NSYM = { tri: 6, sq: 8, rect: 4 };
        const fig = v.select('figure', [{ value: 'tri', label: 'triangle' }, { value: 'sq', label: 'square' }, { value: 'rect', label: 'rectangle' }], 'tri', { onChange: () => { found.clear(); flip = 0; th = 0; grip.set(...gripPos()); } });
        let th = 0, flip = 0; const found = new Set(), tw = tweener(v, 450);
        v.button('Flip', () => { flip ^= 1; tw.start(); });
        v.button('Forget found', () => found.clear());
        const s = v.stage({ x: [-1.9, 1.9], y: [-1.45, 1.45], equal: true, axes: false, height: 340, weight: 1.3 });
        const t = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 340, weight: 1 });
        const F = [[-1, 0], [0, 1]], rot = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
        const P = () => SH[fig.value];
        const flipNow = () => { const u = tw.t; return [[flip ? Math.cos(Math.PI * u) : -Math.cos(Math.PI * u), 0], [0, 1]]; }; // tween I → F (or back)
        const gripPos = () => mv(mm(rot(th), flip ? F : I2), P()[0]);
        const grip = s.handle(...P()[0], { color: 'gold', r: 8, constrain: (x, y) => {
          const p0 = mv(flip ? F : I2, P()[0]), step = fig.value === 'rect' ? Math.PI : (2 * Math.PI) / P().length;
          let a = Math.atan2(y, x) - Math.atan2(p0[1], p0[0]); const k = Math.round(a / step); if (Math.abs(a - k * step) < 0.12) a = k * step;
          th = a; return gripPos();
        } });
        const permOf = (M) => { const Q = P(); return Q.map((p) => { const q = mv(M, p); return Q.findIndex((r) => Math.hypot(r[0] - q[0], r[1] - q[1]) < 0.02); }); };
        v.render(() => {
          const u = tw.t, Q = P(), M = mm(rot(th), u < 1 ? flipNow() : flip ? F : I2);
          const Mfinal = mm(rot(th), flip ? F : I2), perm = permOf(Mfinal), fits = perm.every((x) => x >= 0) && new Set(perm).size === Q.length;
          if (fits && u >= 1) found.add(perm.join(','));
          s.line(0, -1.4, 0, 1.4, { color: 'faint', width: 1, dash: [3, 4] });
          drawFigure(v, s, M, Q, { R: 1, lab: 0.2 });
          { const g = mv(M, Q[0]); grip.x = g[0]; grip.y = g[1]; }
          s.corner(fits ? 'fits the outline ✓' : 'does not fit', 'tl', { size: 13, weight: 700, color: fits ? 'green' : 'red' });
          // gallery of recorded symmetries
          const list = [...found].map((k) => k.split(',').map(Number));
          t.text(`found ${list.length} of ${NSYM[fig.value]}`, 5, 6.6, { align: 'center', size: 14, weight: 700, color: list.length === NSYM[fig.value] ? 'green' : 'ink' });
          list.forEach((p, i) => { const c = i % 2, r = Math.floor(i / 2); t.tex(permTex(p), 2.6 + c * 4.8, 5.6 - r * 1.35, { size: 14 }); });
        });
        v.readout(() => {
          const Q = P(), M = mm(rot(th), flip ? F : I2), perm = permOf(M), fits = perm.every((x) => x >= 0);
          const deg = Math.round(((((-th * 180) / Math.PI) % 360) + 360) % 360);
          return fits ? String.raw`This motion (${flip ? 'flip, then ' : ''}rotation by ${deg}° clockwise) is a **symmetry**: it permutes the vertices as $${permTex(perm)}$.` : String.raw`Rotated by ${deg}°${flip ? ' after a flip' : ''}: the card does not cover the outline, so this is not a symmetry. ${fig.value === 'rect' ? 'For the rectangle only half turns fit.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7a
    {
      num: '3.7a',
      kind: 'Definition',
      name: 'Group',
      statement: String.raw`A **binary operation** on a set $G$ is a map $G\times G\to G$, $(a,b)\mapsto a\circ b$. A **group** $(G,\circ)$ is a set with a binary operation such that
- (associativity) $(a\circ b)\circ c=a\circ(b\circ c)$ for all $a,b,c\in G$;
- (identity) there is $e\in G$ with $e\circ a=a\circ e=a$ for all $a\in G$;
- (inverses) every $a\in G$ has an $a^{-1}\in G$ with $a\circ a^{-1}=a^{-1}\circ a=e$.

$G$ is **abelian** (commutative) if $a\circ b=b\circ a$ for all $a,b$, and **nonabelian** otherwise. Closure — that $a\circ b$ lands in $G$ — is part of being a binary operation on $G$.`,
      idea: String.raw`The axioms extract what $(\mathbb Z,+)$, $(\mathbb Z_n,+)$, the symmetries of a triangle and the invertible matrices have in common: you can combine, bracketing does not matter, there is a do-nothing element, and everything can be undone. Each axiom is independent of the others, so each can fail on its own: $(\mathbb Z,-)$ is not associative, $(\mathbb N,+)$ has no identity, $(\mathbb Z_6\setminus\{0\},\cdot)$ is not even closed, and $(\mathbb M_2(\mathbb R),\cdot)$ has singular matrices with no inverse.`,
      caption: String.raw`Pick a candidate and the four tests run — exhaustively for finite sets, on random samples otherwise (Resample draws new ones). Each small square is one test instance (green passes, red fails); the first failure is written out as a counterexample. Only some candidates survive all four.`,
      deps: ['alg-1.4a'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'axioms'],
      credit: 'Cayley 1854; axioms in modern form: Huntington, Dickson, c. 1902',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Group_(mathematics)' },
      viz(v) {
        const D3 = dihedral(3);
        const fmtM = (A) => `\\begin{pmatrix}${A[0][0]}&${A[0][1]}\\\\${A[1][0]}&${A[1][1]}\\end{pmatrix}`;
        const mInv = (A) => { const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return d ? [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]] : null; };
        const fmtR = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (() => { for (let q = 2; q < 30; q++) if (Math.abs(x * q - Math.round(x * q)) < 1e-9) return `${Math.round(x * q) < 0 ? '-' : ''}\\tfrac{${Math.abs(Math.round(x * q))}}{${q}}`; return x.toFixed(2); })());
        const C = {
          zadd: { tex: '(\\mathbb Z, +)', sample: (r) => r.int(-20, 20), op: (a, b) => a + b, mem: Number.isInteger, e: 0, inv: (a) => -a, f: String, s: '+' },
          zsub: { tex: '(\\mathbb Z, -)', sample: (r) => r.int(-9, 9), op: (a, b) => a - b, mem: Number.isInteger, e: null, noE: 'the only candidate, $e = 0$, works on the right only: $a - e = a$, but $e - a = -a \\ne a$ when $a \\ne 0$', inv: () => null, f: String, s: '-' },
          nadd: { tex: '(\\mathbb N, +)', sample: (r) => r.int(1, 30), op: (a, b) => a + b, mem: (x) => Number.isInteger(x) && x >= 1, e: null, noE: 'no $e\\in\\mathbb N = \\{1, 2, \\ldots\\}$ has $e + a = a$ (that would be zero)', inv: () => null, f: String, s: '+' },
          z5: { tex: '(\\mathbb Z_5, +)', els: [0, 1, 2, 3, 4], op: (a, b) => (a + b) % 5, mem: (x) => x >= 0 && x < 5, e: 0, inv: (a) => (5 - a) % 5, f: String, s: '+' },
          z6m: { tex: '(\\mathbb Z_6\\setminus\\{0\\}, \\cdot)', els: [1, 2, 3, 4, 5], op: (a, b) => (a * b) % 6, mem: (x) => x >= 1 && x < 6, e: 1, inv: (a) => [1, 2, 3, 4, 5].find((b) => (a * b) % 6 === 1) ?? null, f: String, s: '\\cdot' },
          z7m: { tex: '(\\mathbb Z_7\\setminus\\{0\\}, \\cdot)', els: [1, 2, 3, 4, 5, 6], op: (a, b) => (a * b) % 7, mem: (x) => x >= 1 && x < 7, e: 1, inv: (a) => [1, 2, 3, 4, 5, 6].find((b) => (a * b) % 7 === 1), f: String, s: '\\cdot' },
          d3: { tex: 'D_3', els: [0, 1, 2, 3, 4, 5], op: (a, b) => D3.T[a][b], mem: () => true, e: 0, inv: (a) => D3.inv[a], f: (a) => D3.L[a], s: '' },
          m2: { tex: '(\\mathbb M_2(\\mathbb R), \\cdot)', sample: (r) => [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]], op: (A, B) => mm(A, B), mem: () => true, eq: (A, B) => A.every((row, i) => row.every((x, j) => Math.abs(x - B[i][j]) < 1e-9)), e: [[1, 0], [0, 1]], short: true, inv: mInv, f: (A) => fmtM(A.map((r) => r.map(fmtR))), s: '' },
        };
        const which = v.select('candidate', Object.entries(C).map(([value, c]) => ({ value, label: `$${c.tex}$` })), 'zsub');
        let seed = 1; v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, height: 330, full: true });
        const run = () => {
          const c = C[which.value], r = v.rng(seed * 97 + which.value.length), eq = c.eq || ((a, b) => a === b), pick = () => (c.els ? r.pick(c.els) : c.sample(r));
          const fin = !!c.els, out = {};
          const pairs = fin ? c.els.flatMap((a) => c.els.map((b) => [a, b])) : Array.from({ length: 24 }, () => [pick(), pick()]);
          const triples = fin ? c.els.flatMap((a) => c.els.flatMap((b) => c.els.map((d) => [a, b, d]))) : Array.from({ length: 24 }, () => [pick(), pick(), pick()]);
          const singles = fin ? c.els.slice() : Array.from({ length: 24 }, pick);
          // closure
          out.close = pairs.map(([a, b]) => ({ ok: c.mem(c.op(a, b)) || (!fin && which.value === 'm2'), ex: String.raw`${c.f(a)} ${c.s} ${c.f(b)} = ${c.f(c.op(a, b))}`, bad: String.raw`${c.f(a)} ${c.s} ${c.f(b)} = ${c.f(c.op(a, b))}\notin G` }));
          out.assoc = triples.map(([a, b, d]) => { const L = c.op(c.op(a, b), d), R = c.op(a, c.op(b, d)); return { ok: eq(L, R), ex: c.short ? String.raw`A = ${c.f(a)},\ B = ${c.f(b)},\ C = ${c.f(d)}:\ (AB)C = A(BC) = ${c.f(L)}` : String.raw`(${c.f(a)} ${c.s} ${c.f(b)}) ${c.s} ${c.f(d)} = ${c.f(L)} = ${c.f(a)} ${c.s} (${c.f(b)} ${c.s} ${c.f(d)})`, bad: String.raw`(${c.f(a)} ${c.s} ${c.f(b)}) ${c.s} ${c.f(d)} = ${c.f(L)} \ne ${c.f(R)} = ${c.f(a)} ${c.s} (${c.f(b)} ${c.s} ${c.f(d)})` }; });
          out.id = c.e == null ? [{ ok: false, txt: c.noE }] : singles.map((a) => ({ ok: eq(c.op(c.e, a), a) && eq(c.op(a, c.e), a), ex: c.short ? String.raw`e = I:\ IA = AI = A\ \text{for}\ A = ${c.f(a)}` : String.raw`e = ${c.f(c.e)}:\ ${c.f(c.e)} ${c.s} ${c.f(a)} = ${c.f(a)} ${c.s} ${c.f(c.e)} = ${c.f(a)}` }));
          out.inv = c.e == null ? [{ ok: false, txt: 'without an identity there is nothing for inverses to produce' }] : singles.map((a) => { const b = c.inv(a); const ok = b != null && c.mem(b) && eq(c.op(a, b), c.e) && eq(c.op(b, a), c.e); return { ok, ex: ok ? String.raw`${c.f(a)}^{-1} = ${c.f(b)}` : '', bad: String.raw`${c.f(a)}\ \text{has no inverse}` }; });
          return out;
        };
        const ROWS = [['close', 'closure'], ['assoc', 'associativity'], ['id', 'identity'], ['inv', 'inverses']];
        v.render(() => {
          const R = run();
          ROWS.forEach(([k, name], i) => {
            const y = 5.6 - i * 1.55, tests = R[k], fail = tests.find((x) => !x.ok), ok = !fail;
            s.rect(0.1, y - 0.62, 9.9, y + 0.62, { radius: 10, fill: ok ? 'green' : 'red', fillAlpha: 0.06, color: ok ? 'green' : 'red', width: 1.2, alpha: 0.6 });
            s.text(`${ok ? '✓' : '✗'} ${name}`, 0.3, y + 0.25, { size: 14, weight: 700, color: ok ? 'green' : 'red' });
            const show = tests.slice(0, 60), w = Math.min(0.13, 2.6 / Math.max(show.length, 1));
            show.forEach((x, j) => { const cx = 0.35 + (j % 20) * 0.13, cy = y - 0.12 - Math.floor(j / 20) * 0.15; s.rect(cx, cy - 0.055, cx + 0.1, cy + 0.055, { fill: x.ok ? 'green' : 'red', fillAlpha: 0.8, stroke: false }); void w; });
            s.text(`${tests.length > 1 ? `${tests.filter((x) => x.ok).length}/${tests.length} instances` : ''}`, 0.3, y - 0.48, { size: 10.5, color: 'muted' });
            if (fail && fail.txt) s.text(fail.txt, 3.2, y, { size: 13, color: 'red' });
            else s.tex(fail ? fail.bad : tests[0].ex, 3.2, y, { size: 16, align: 'left', color: fail ? 'red' : 'ink' });
          });
        });
        v.readout(() => {
          const R = run(), c = C[which.value], failed = ROWS.filter(([k]) => R[k].some((x) => !x.ok)).map(([, n]) => n);
          return failed.length ? `$${c.tex}$ is **not a group**: ${failed.join(', ')} ${failed.length > 1 ? 'fail' : 'fails'}.` : `$${c.tex}$ passes all four tests${c.els ? ' (checked on every element, pair and triple)' : ' on these samples — and indeed it is a group'}${c.els ? `: **a group** of order ${c.els.length}` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8a
    {
      num: '3.8a',
      kind: 'Definition',
      name: 'Cayley table',
      statement: String.raw`The **Cayley table** (multiplication table) of a finite group $G=\{g_1,\ldots,g_n\}$ is the $n\times n$ array whose entry in row $g_i$ and column $g_j$ is the product $g_ig_j$. It describes the group completely. In it, the row and the column of the identity repeat the headers, every row and every column contains each element exactly once (a **Latin square**), and the table is symmetric about its main diagonal exactly when $G$ is abelian.`,
      idea: String.raw`Row $a$ lists $ax$ as $x$ runs through $G$; if two entries agreed, $ax=ay$, multiplying by $a^{-1}$ would give $x=y$ — so the row is a permutation of $G$, and likewise each column. The identity row is $ex=x$, the header itself. The entry at $(a,b)$ is $ab$ and the entry at $(b,a)$ is $ba$, so mirror symmetry is commutativity. Associativity, in contrast, cannot be read off at a glance: it is a condition on triples.`,
      caption: String.raw`Step through the table cell by cell (or press play). As the entries appear, the identity row and column are outlined green, a row turns green in the check column once it is complete with no repeats, and mirror pairs are compared: $=$ when $ab=ba$, a red $\ne$ when not — which happens only in the nonabelian groups $D_3$ and $Q_8$. The readout also checks associativity on all $n^3$ triples.`,
      deps: ['alg-3.7a'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'tables'],
      credit: 'Arthur Cayley, 1854',
      viz(v) {
        const GR = { Z4: cyclic(4), Z5: cyclic(5), U8: units(8), D3: dihedral(3), Q8: quaternion() };
        const which = v.select('group', [{ value: 'Z4', label: '$\\mathbb Z_4$' }, { value: 'Z5', label: '$\\mathbb Z_5$' }, { value: 'U8', label: '$U(8)$' }, { value: 'D3', label: '$D_3$' }, { value: 'Q8', label: '$Q_8$' }], 'D3', { onChange: () => S.reset(null, { at: 'end' }) });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const T = v.table(s, { rows: 6, cols: 7, square: false, maxCell: 40, cellAspect: 1.25, size: 14 });
        const S = v.steps({ frames: () => { const n = GR[which.value].n; return Array.from({ length: n * n + 1 }, (_, k) => ({ k, note: k === n * n ? 'Table complete.' : `Fill row ${Math.floor(k / n) + 1}, column ${(k % n) + 1}.` })); }, speed: 6, start: 'end', still: 'end' });
        v.render(() => {
          const G = GR[which.value], n = G.n, k = S.frame.k ?? n * n, shown = (i, j) => i * n + j < k;
          const rowDone = (i) => shown(i, n - 1), rowOk = (i) => new Set(G.T[i]).size === n;
          const hl = [];
          if (rowDone(G.e)) for (let j = 0; j < n; j++) hl.push([G.e, j, 'green']);
          if (k > (n - 1) * n + G.e) for (let i = 0; i < n; i++) hl.push([i, G.e, 'green']);
          if (k > 0 && k <= n * n - 0) { const c = k - 1; hl.push([Math.floor(c / n), c % n, 'gold']); }
          T.draw({
            rows: n, cols: n + 1, colWeights: [...Array(n).fill(1), 1.9],
            rowLabels: (i) => cellLab(G.L[i]), colLabels: (j) => (j < n ? cellLab(G.L[j]) : 'row ok?'), cornerLabel: `$${G.sym}$`,
            value: (i, j) => (j === n ? (rowDone(i) ? (rowOk(i) ? '✓ permutation' : '✗') : '') : shown(i, j) ? cellLab(G.L[G.T[i][j]]) : null),
            fill: (i, j) => (j === n ? (rowDone(i) ? ['green', 0.25] : null) : shown(i, j) ? [elColor(v, G.T[i][j], n), 0.24] : null),
            sub: (i, j) => (j < n && i !== j && shown(i, j) && shown(j, i) ? (G.T[i][j] === G.T[j][i] ? '=' : '≠') : ''),
            subColor: (i, j) => (j < n && G.T[i][j] !== G.T[j][i] ? 'red' : 'muted'), subSize: 11,
            highlight: hl,
          });
        });
        v.readout(() => {
          const G = GR[which.value], n = G.n, af = assocFail(G), lat = latinFails(G).length === 0;
          const bad = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (G.T[i][j] !== G.T[j][i]) bad.push([i, j]);
          return String.raw`$${G.tex}$, order ${n}: identity $${G.L[G.e]}$; Latin square ${lat ? '✓' : '✗'}; associativity on all ${n ** 3} triples ${af ? '✗' : '✓'}. ${bad.length ? `**Nonabelian**: ${bad.length} mirror pairs differ, e.g. $${G.L[bad[0][0]]}${G.L[bad[0][1]]} = ${G.L[G.T[bad[0][0]][bad[0][1]]]}$ but $${G.L[bad[0][1]]}${G.L[bad[0][0]]} = ${G.L[G.T[bad[0][1]][bad[0][0]]]}$.` : '**Abelian**: the table is symmetric about its diagonal.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11a
    {
      num: '3.11a',
      kind: 'Definition',
      name: 'Group of units U(n)',
      statement: String.raw`For $n\ge2$, the **group of units** of $\mathbb Z_n$ is
$$U(n)=\{a\in\mathbb Z_n\setminus\{0\} : \gcd(a,n)=1\},$$
the nonzero residues that are relatively prime to $n$, under multiplication mod $n$. It is an abelian group of order $\varphi(n)$; for example $U(8)=\{1,3,5,7\}$, in which every element is its own inverse.`,
      idea: String.raw`$(\mathbb Z_n,\cdot)$ is not a group — $0$, and every $a$ sharing a factor with $n$, has no inverse (Proposition 3.4(6)). Keep only the residues coprime to $n$: a product of two of them is again coprime to $n$ (a prime dividing $ab$ and $n$ would divide $a$ or $b$), $1$ is among them, and each has an inverse by Bézout. Associativity and commutativity are inherited from $\mathbb Z_n$. In the table, the rows of the non-units contain $0$ or repeats; the rows of the units are permutations.`,
      caption: String.raw`Left: the whole multiplication table of $\mathbb Z_n$, with the rows and columns of units in colour and the rest greyed (note the zeros and repeats there). Right: those rows and columns lifted out — the table of $U(n)$, a Latin square with no zeros, $1$ marked green in each row. Move $n$.`,
      deps: ['alg-3.7a', 'alg-3.4'],
      see: ['nt-2.3', 'nt-2.7'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'modular arithmetic'],
      viz(v) {
        const N = v.slider('$n$', 2, 16, 8, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.15, title: 'multiplication in $\\mathbb Z_n$' });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'the units, lifted out: $U(n)$' });
        const TA = v.table(s, { rows: 8, cols: 8, maxCell: 34, size: 11.5, margin: 4 }), TB = v.table(t, { rows: 4, cols: 4, maxCell: 40, size: 13, margin: 6 });
        v.render(() => {
          const n = N.value, U = units(n), isU = (k) => k > 0 && gcd(k, n) === 1;
          TA.draw({ rows: n, cols: n, rowLabels: (i) => String(i), colLabels: (j) => String(j), cornerLabel: '·', value: (i, j) => (i * j) % n,
            fill: (i, j) => (isU(i) && isU(j) ? [((i * j) % n) === 1 ? 'green' : 'accent', ((i * j) % n) === 1 ? 0.45 : 0.18] : ((i * j) % n) === 0 ? ['red', 0.12] : null),
            textColor: (i, j) => (isU(i) && isU(j) ? 'ink' : 'muted'), rowLabelColor: (i) => (isU(i) ? 'accent' : 'faint'), colLabelColor: (j) => (isU(j) ? 'accent' : 'faint') });
          TB.draw({ rows: U.n, cols: U.n, rowLabels: (i) => U.L[i], colLabels: (j) => U.L[j], cornerLabel: '·', value: (i, j) => U.L[U.T[i][j]],
            fill: (i, j) => (U.T[i][j] === U.e ? ['green', 0.45] : [elColor(v, U.T[i][j], U.n), 0.22]) });
        });
        v.readout(() => {
          const n = N.value, U = units(n), non = [...Array(n).keys()].filter((k) => k && gcd(k, n) > 1);
          const lat = latinFails(U).length === 0, self = U.vals.filter((x, i) => U.inv[i] === i);
          return String.raw`$U(${n}) = \{${U.vals.join(', ')}\}$, order $\varphi(${n}) = ${U.n}$. Its table is a Latin square ${lat ? '✓' : '✗'} without zeros; inverses: ${U.vals.map((x, i) => `$${x}^{-1} = ${U.vals[U.inv[i]]}$`).join(', ')}${self.length === U.n ? ' — every element is its own inverse' : ''}. ${non.length ? `Left out: $${non.join(', ')}$ (sharing a factor with ${n}) and $0$.` : `($${n}$ is prime: every nonzero residue is a unit.)`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Concept',
      name: 'The symmetries of a triangle form a nonabelian group',
      statement: String.raw`The six symmetries of an equilateral triangle — $\mathrm{id}$, the rotations $\rho_1,\rho_2$ by $120^\circ$ and $240^\circ$, and the reflections $\mu_1,\mu_2,\mu_3$ fixing $A$, $B$, $C$ — form a group under composition, written $S_3$ or $D_3$. It is **nonabelian**: for example $\mu_1\rho_1=\mu_2$ while $\rho_1\mu_1=\mu_3$. (Products are compositions, read right to left: $\mu_1\rho_1$ means "first $\rho_1$, then $\mu_1$".)`,
      idea: String.raw`Composition of maps is associative (Theorem 1.15), the identity motion does nothing, and each motion can be undone by another (a rotation by the opposite rotation, a reflection by itself), so the axioms hold; the Cayley table lists the closure. Commutativity fails because a reflection reverses the sense of rotation: rotating then flipping is not flipping then rotating. Following vertex $A$: $\rho_1$ sends $A\to B$ and then $\mu_1$ sends $B\to C$; in the other order $\mu_1$ fixes $A$ and $\rho_1$ sends it to $B$.`,
      caption: String.raw`Choose $\alpha$ and $\beta$. The left card performs $\beta$ then $\alpha$ (the product $\alpha\beta$), the right card $\alpha$ then $\beta$ (the product $\beta\alpha$); the axes of the flips are drawn dashed. When the end positions differ the two products are different, and the Cayley table marks the asymmetric pair of entries.`,
      deps: ['alg-3.7a', 'alg-3.5a'],
      see: ['rep-1.1'],
      refs: ['Judson §3.1', 'Judson §3.2'],
      tags: ['groups', 'symmetry'],
      viz(v) {
        const G = dihedral(3), opts = G.L.map((l, i) => ({ value: i, label: `$${l}$` }));
        const A = v.select('$\\alpha$', opts, 3), B = v.select('$\\beta$', opts, 1);
        const s1 = v.stage({ x: [-1.5, 1.5], y: [-1.35, 1.45], equal: true, axes: false, height: 260 });
        const s2 = v.stage({ x: [-1.5, 1.5], y: [-1.35, 1.45], equal: true, axes: false, height: 260 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, full: true });
        const T = v.table(t, { rows: 6, cols: 6, maxCell: 34, size: 13, margin: 4 });
        const PER = 6;
        const pose = (first, second, tt) => {
          const M1 = G.mat[first], M2 = G.mat[second], u1 = Math.min(1, Math.max(0, tt / 2)), u2 = Math.min(1, Math.max(0, (tt - 2.4) / 2));
          return { M: tt < 2.4 ? partial(M1, u1) : mm(partial(M2, u2), M1), cur: tt < 2.4 ? first : second, phase: tt < 2.4 ? 1 : 2 };
        };
        v.animate((tt) => {
          const a = A.value, b = B.value;
          [[s1, b, a, `first $${G.L[b]}$, then $${G.L[a]}$: $${G.L[a]}${G.L[b]} = ${G.L[G.T[a][b]]}$`], [s2, a, b, `first $${G.L[a]}$, then $${G.L[b]}$: $${G.L[b]}${G.L[a]} = ${G.L[G.T[b][a]]}$`]].forEach(([s, f1, f2, title]) => {
            const P = pose(f1, f2, tt), ax = axisOf(G.mat[P.cur]);
            if (ax && tt < 4.4) s.line(-1.4 * ax[0], -1.4 * ax[1], 1.4 * ax[0], 1.4 * ax[1], { color: 'gold', width: 1.6, dash: [6, 4] });
            drawFigure(v, s, P.M, G.pos, { R: 1, lab: 0.22 });
            s.setTitle(title);
            s.corner(tt < 4.4 ? `step ${P.phase}: $${G.L[P.cur]}$` : 'done', 'tl', { size: 13, plate: true });
          });
          const diff = G.T[a][b] !== G.T[b][a];
          drawCayley(v, T, G, { draw: { highlight: [[a, b, diff ? 'red' : 'green'], [b, a, diff ? 'red' : 'green']] } });
        }, { period: PER, still: 5.6 });
        v.readout(() => {
          const a = A.value, b = B.value, ab = G.T[a][b], ba = G.T[b][a];
          return String.raw`$${G.L[a]}${G.L[b]} = ${G.L[ab]} = ${permTex(G.perms[ab])}$ and $${G.L[b]}${G.L[a]} = ${G.L[ba]} = ${permTex(G.perms[ba])}$: ${ab === ba ? 'these two commute.' : '**different** — the group is nonabelian.'} (Of the 15 pairs of distinct elements, ${(() => { let c = 0; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (G.T[i][j] !== G.T[j][i]) c++; return c; })()} fail to commute.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Concept',
      name: 'The general linear group GL₂(ℝ)',
      statement: String.raw`The invertible $2\times2$ real matrices form a group under matrix multiplication, the **general linear group**
$$GL_2(\mathbb R)=\Big\{A=\begin{pmatrix}a&b\\c&d\end{pmatrix} : \det A=ad-bc\ne0\Big\},$$
with identity $I$ and inverse $A^{-1}=\frac1{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$. It is nonabelian: in general $AB\ne BA$.`,
      idea: String.raw`Matrix multiplication is associative (it is composition of linear maps), $\det(AB)=\det A\det B$ shows that products of invertible matrices are invertible, and the formula for $A^{-1}$ works exactly when $\det A\ne0$. Geometrically $\det A$ is the signed area of the image of the unit square: the map can be undone precisely when the square is not crushed to a segment or a point. Two such maps applied in different orders — a rotation and a shear, say — give different results.`,
      caption: String.raw`Drag the images $Ae_1$, $Ae_2$ of the basis vectors. The unit square goes to the parallelogram (blue if orientation is kept, orange if it is reversed), and the letter F shows the whole map. Line the two vectors up and the area — $\det A$ — drops to $0$: the matrix leaves $GL_2(\mathbb R)$. The right panel applies a second matrix $B$ in both orders: $AB$ and $BA$ move the square differently.`,
      deps: ['alg-3.7a'],
      see: ['ladr-9.50', 'ladr-9.49'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'matrices'],
      viz(v) {
        const BM = { rot: [[0, -1], [1, 0]], shear: [[1, 1], [0, 1]], refl: [[1, 0], [0, -1]] };
        const Bsel = v.select('$B$', [{ value: 'rot', label: 'rotation $90^\\circ$' }, { value: 'shear', label: 'shear' }, { value: 'refl', label: 'reflection' }], 'shear');
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 350 });
        const t = v.stage({ x: [-1.3, 4.2], y: [-1.6, 3.6], equal: true, axes: 'box', gutter: true, height: 350 });
        const h1 = s.handle(1.5, 0.5, { color: 'blue', label: 'Ae₁' }), h2 = s.handle(0.4, 1.2, { color: 'red', label: 'Ae₂' });
        const F = [[0.15, 0.08], [0.35, 0.08], [0.35, 0.45], [0.65, 0.45], [0.65, 0.62], [0.35, 0.62], [0.35, 0.75], [0.82, 0.75], [0.82, 0.92], [0.15, 0.92]], SQ = [[0, 0], [1, 0], [1, 1], [0, 1]];
        const A = () => [[h1.x, h2.x], [h1.y, h2.y]];
        const draw = (st, M, col, lab) => {
          const d = M[0][0] * M[1][1] - M[0][1] * M[1][0];
          st.poly(SQ.map((p) => mv(M, p)), { fill: col || (d >= 0 ? 'accent' : 'orange'), fillAlpha: 0.2, color: col || (d >= 0 ? 'accent' : 'orange'), width: 2 });
          st.poly(F.map((p) => mv(M, p)), { fill: 'purple', fillAlpha: col ? 0 : 0.3, color: col || 'purple', width: 1.3 });
          if (lab) { const c = mv(M, [1, 1]); st.text(lab, c[0], c[1], { dx: 8, dy: lab === 'AB' ? -10 : 10, align: 'left', size: 13, weight: 700, color: col, math: true, plate: true }); }
        };
        v.render(() => {
          const M = A(), d = M[0][0] * M[1][1] - M[0][1] * M[1][0];
          s.poly(SQ, { color: 'muted', width: 1.2, dash: [4, 4], fill: false });
          if (Math.abs(d) < 0.05) { const dir = Math.hypot(h1.x, h1.y) > 0.05 ? [h1.x, h1.y] : [h2.x, h2.y], L = Math.hypot(...dir) || 1; s.line(-5 * dir[0] / L, -5 * dir[1] / L, 5 * dir[0] / L, 5 * dir[1] / L, { color: 'red', width: 2.5, alpha: 0.6 }); }
          draw(s, M);
          s.arrow(0, 0, h1.x, h1.y, { color: 'blue', width: 2.4 }); s.arrow(0, 0, h2.x, h2.y, { color: 'red', width: 2.4 });
          s.text(`det A = ${v.fix(d, 2)}${Math.abs(d) < 0.05 ? '  — singular, not in GL₂(ℝ)' : ''}`, -2.85, 2.7, { size: 13, weight: 700, color: Math.abs(d) < 0.05 ? 'red' : 'ink', plate: true });
          const B = BM[Bsel.value];
          t.poly(SQ, { color: 'muted', width: 1.2, dash: [4, 4], fill: false });
          draw(t, mm(M, B), 'teal', 'AB'); draw(t, mm(B, M), 'pink', 'BA');
        });
        v.readout(() => {
          const M = A(), d = M[0][0] * M[1][1] - M[0][1] * M[1][0], B = BM[Bsel.value], f = (x) => v.fix(x, 2).replace('−', '-');
          const mt = (X) => `\\begin{pmatrix}${f(X[0][0])}&${f(X[0][1])}\\\\${f(X[1][0])}&${f(X[1][1])}\\end{pmatrix}`;
          const AB = mm(M, B), BA = mm(B, M), same = AB.every((r, i) => r.every((x, j) => Math.abs(x - BA[i][j]) < 1e-6));
          const head = `$A = ${mt(M)}$, $\\det A = ${f(d)}$`;
          if (Math.abs(d) < 0.05) return `${head}: the square is crushed, so $A$ has no inverse and is **not in** $GL_2(\\mathbb R)$.`;
          return `${head}, $A^{-1} = ${mt([[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]])}$. With $B$: $AB = ${mt(AB)}$, $BA = ${mt(BA)}$ — ${same ? 'equal for this pair.' : '**different**: $GL_2(\\mathbb R)$ is nonabelian.'} $\\det(AB) = ${f(d * (B[0][0] * B[1][1] - B[0][1] * B[1][0]))} = \\det A\\det B$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Concept',
      name: 'The quaternion group Q₈',
      statement: String.raw`The **quaternion group** is $Q_8=\{\pm1,\pm i,\pm j,\pm k\}$ with the multiplication determined by
$$i^2=j^2=k^2=-1,\qquad ij=k,\quad jk=i,\quad ki=j,\qquad ji=-k,\quad kj=-i,\quad ik=-j,$$
and the usual rules for signs. It is a nonabelian group of order 8. Judson realises it by complex matrices: $1=I_2$, $I=\begin{pmatrix}0&1\\-1&0\end{pmatrix}$, $J=\begin{pmatrix}0&i\\i&0\end{pmatrix}$, $K=\begin{pmatrix}i&0\\0&-i\end{pmatrix}$.`,
      idea: String.raw`Going around the cycle $i\to j\to k\to i$ in its direction gives a plus sign ($ij=k$), going against it a minus sign ($ji=-k$). Since these eight elements are invertible matrices closed under multiplication, they form a group (a subgroup of $GL_2(\mathbb C)$), and associativity comes free. Each unit quaternion $q$ also turns 3-space: $v\mapsto qvq^{-1}$ rotates by twice the angle of $q$ about its axis — $\pm i$ give the same half turn about the $x$-axis, and $-1$ a full turn, which is why $q$ and $-q$ look alike in 3D.`,
      caption: String.raw`Click a cell of the table to multiply $a$ (row) by $b$ (column). The cycle diagram gives the sign; the readout checks the product with Judson's $2\times2$ complex matrices. On the right a box is rotated by the product $q=ab$, moving along the shortest path from $1$ to $q$ (play to repeat; drag to turn the view). $ij$ and $ji$ differ — yet as rotations they agree, because they differ only by the sign.`,
      deps: ['alg-3.14'],
      see: ['alg-16.7'],
      refs: ['Judson §3.2'],
      tags: ['groups', 'quaternions'],
      credit: 'William Rowan Hamilton, 1843',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quaternion_group' },
      viz(v) {
        const G = quaternion(); let sel = [2, 4];
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1 });
        const S = v.stage({ x: [-2.05, 2.05], y: [-2.05, 2.05], equal: true, axes: false, height: 340, weight: 1 });
        const T = v.table(t, { rows: 8, cols: 8, maxCell: 36, size: 13, margin: 4 });
        t.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { sel = [c.i, c.j]; v.restart(); } });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.38, axis: 1.65, labels: ['i', 'j', 'k'] });
        const quat = (idx) => { const [sg, u] = G.els[idx], q = [0, 0, 0, 0]; q[u] = sg; return q; }; // [w, x, y, z]
        const rotM = ([w, x, y, z]) => [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
        const ap3 = (M, p) => [0, 1, 2].map((r) => M[r][0] * p[0] + M[r][1] * p[1] + M[r][2] * p[2]);
        const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map((p) => [p[0] * 0.75, p[1] * 0.5, p[2] * 0.32]);
        const FACES = [[[1, 2, 6, 5], 'blue'], [[0, 3, 7, 4], 'blue'], [[3, 2, 6, 7], 'green'], [[0, 1, 5, 4], 'green'], [[4, 5, 6, 7], 'red'], [[0, 1, 2, 3], 'red']];
        const MAT = [[[[1, 0], [0, 0]], [[0, 0], [1, 0]]], [[[0, 0], [1, 0]], [[-1, 0], [0, 0]]], [[[0, 0], [0, 1]], [[0, 1], [0, 0]]], [[[0, 1], [0, 0]], [[0, 0], [0, -1]]]];
        const cm = (A, B) => [0, 1].map((r) => [0, 1].map((c) => { let re = 0, im = 0; for (let k = 0; k < 2; k++) { const a = A[r][k], b = B[k][c]; re += a[0] * b[0] - a[1] * b[1]; im += a[0] * b[1] + a[1] * b[0]; } return [re, im]; }));
        const matOf = (idx) => { const [sg, u] = G.els[idx]; return MAT[u].map((row) => row.map(([re, im]) => [sg * re, sg * im])); };
        const cTex = ([re, im]) => (Math.abs(im) < 1e-9 ? `${Math.round(re)}` : Math.abs(re) < 1e-9 ? `${im < 0 ? '-' : ''}i` : `${re}+${im}i`);
        v.animate((tt) => {
          const [a, b] = sel, c = G.T[a][b], q = quat(c), u = Math.min(1, tt / 2.2);
          drawCayley(v, T, G, { draw: { highlight: [[a, b, 'gold'], [b, a, G.T[b][a] === c ? 'gold' : 'red']], activeRow: a, activeCol: b } });
          // path 1 → q: q(t) = cos(tα) + sin(tα)·axis
          const w = q[0], vec = [q[1], q[2], q[3]], al = Math.acos(Math.max(-1, Math.min(1, w))), ax = Math.hypot(...vec) > 1e-9 ? vec : [0, 0, 1];
          const qt = [Math.cos(al * u), ...ax.map((x) => (Math.sin(al * u) * x) / (Math.hypot(...ax) || 1))], R = rotM(qt);
          sc.begin();
          const P = V.map((p) => ap3(R, p));
          for (const [f, col] of FACES) sc.poly(f.map((i) => P[i]), { fill: col, fillAlpha: 0.32, color: col, width: 1.2 });
          sc.arrow([0, 0, 0], ap3(R, [1.05, 0, 0]), { color: 'blue', width: 2 });
          if (Math.hypot(...vec) > 1e-9) sc.line(ax.map((x) => -1.8 * x), ax.map((x) => 1.8 * x), { color: 'gold', width: 2.4, dash: [6, 4] });
          sc.flush();
          S.corner(`rotation by q = ${G.L[c].replace('-', '−')}: ${c < 2 ? (c === 0 ? 'none' : 'a full turn (360°)') : 'a half turn about the ' + 'ijk'[G.els[c][1] - 1] + '-axis'}`, 'tl', { size: 12.5, plate: true });
          // the sign cycle i → j → k
          const cx = -1.6, cy = -1.55, r0 = 0.32, ang = [90, -30, 210].map((d) => (d * Math.PI) / 180);
          ang.forEach((g, k) => {
            const pts = []; for (let m = 0; m <= 16; m++) { const a = g - 0.42 - ((2 * Math.PI / 3 - 0.84) * m) / 16; pts.push([cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)]); }
            S.path(pts.slice(0, -1), { color: 'muted', width: 1.5 }); S.arrow(...pts[14], ...pts[16], { color: 'muted', width: 1.5, head: 7 });
            S.text('ijk'[k], cx + (r0 + 0.02) * Math.cos(g), cy + (r0 + 0.02) * Math.sin(g), { align: 'center', math: true, size: 16, weight: 700 });
          });
          S.text('+', cx, cy, { align: 'center', size: 13, color: 'muted', weight: 700 });
        }, { period: 3.4, still: 3.0 });
        v.readout(() => {
          const [a, b] = sel, c = G.T[a][b], d = G.T[b][a], P = cm(matOf(a), matOf(b)), C = matOf(c), ok = P.every((r, i) => r.every((z, j) => Math.abs(z[0] - C[i][j][0]) < 1e-9 && Math.abs(z[1] - C[i][j][1]) < 1e-9));
          const mtx = (X) => `\\begin{pmatrix}${cTex(X[0][0])}&${cTex(X[0][1])}\\\\${cTex(X[1][0])}&${cTex(X[1][1])}\\end{pmatrix}`;
          return String.raw`$(${G.L[a]})(${G.L[b]}) = ${G.L[c]}$ but $(${G.L[b]})(${G.L[a]}) = ${G.L[d]}$${c === d ? ' (these commute)' : ''}. Matrix check: the product of the matrices of $${G.L[a]}$ and $${G.L[b]}$ is $${mtx(P)}$, the matrix of $${G.L[c]}$ ${ok ? '✓' : '✗'}.`;
        });
      },
    },
  ],
};
