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
        const conf = (u = 1) => { const fl = flip ? [[Math.cos(Math.PI * u) * 1, 0], [0, 1]] : I2; void fl; return mm(rot(th), flip ? [[-Math.cos(Math.PI * (1 - u)) * -1 * -1, 0], [0, 1]] : I2); };
        const P = () => SH[fig.value];
        const gripPos = () => { const M = mm(rot(th), flip ? F : I2), q = mv(M, P()[0]); return q; };
        const grip = s.handle(...P()[0], { color: 'gold', r: 8, constrain: (x, y) => {
          const p0 = mv(flip ? F : I2, P()[0]), want = Math.atan2(y, x) - Math.atan2(p0[1], p0[0]);
          const step = fig.value === 'rect' ? Math.PI : (2 * Math.PI) / P().length; let a = want; const k = Math.round(a / step); if (Math.abs(a - k * step) < 0.12) a = k * step;
          th = a; const q = mv(mm(rot(th), flip ? F : I2), P()[0]); return q;
        } });
        const permOf = (M) => { const Q = P(); return Q.map((p) => { const q = mv(M, p); return Q.findIndex((r) => Math.hypot(r[0] - q[0], r[1] - q[1]) < 0.02); }); };
        void conf;
        v.render(() => {
          const u = tw.t, Q = P();
          const flipM = flip ? [[-Math.cos(Math.PI * (1 - u)), 0], [0, 1]] : [[u < 1 ? -Math.cos(Math.PI * (1 - u)) * -1 : 1, 0], [0, 1]];
          const M = mm(rot(th), flip ? [[Math.cos(Math.PI * u) * 1 * (u < 1 ? 1 : 1), 0], [0, 1]] : [[u < 1 ? Math.cos(Math.PI * (1 - u)) * -1 : 1, 0], [0, 1]]);
          void flipM;
          const Mfinal = mm(rot(th), flip ? F : I2), perm = permOf(Mfinal), fits = perm.every((x) => x >= 0) && new Set(perm).size === Q.length;
          if (fits && u >= 1) found.add(perm.join(','));
          s.line(0, -1.4, 0, 1.4, { color: 'faint', width: 1, dash: [3, 4] });
          drawFigure(v, s, M, Q, { R: 1, lab: 0.2 });
          grip.set(...mv(M, Q[0]));
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
          zsub: { tex: '(\\mathbb Z, -)', sample: (r) => r.int(-9, 9), op: (a, b) => a - b, mem: Number.isInteger, e: null, noE: '$0$ works only on the right: $0 - a = -a \\ne a$ for $a\\ne0$', inv: () => null, f: String, s: '-' },
          nadd: { tex: '(\\mathbb N, +)', sample: (r) => r.int(1, 30), op: (a, b) => a + b, mem: (x) => Number.isInteger(x) && x >= 1, e: null, noE: 'no $e\\in\\mathbb N = \\{1, 2, \\ldots\\}$ has $e + a = a$ (that would be $0$)', inv: () => null, f: String, s: '+' },
          z5: { tex: '(\\mathbb Z_5, +)', els: [0, 1, 2, 3, 4], op: (a, b) => (a + b) % 5, mem: (x) => x >= 0 && x < 5, e: 0, inv: (a) => (5 - a) % 5, f: String, s: '+' },
          z6m: { tex: '(\\mathbb Z_6\\setminus\\{0\\}, \\cdot)', els: [1, 2, 3, 4, 5], op: (a, b) => (a * b) % 6, mem: (x) => x >= 1 && x < 6, e: 1, inv: (a) => [1, 2, 3, 4, 5].find((b) => (a * b) % 6 === 1) ?? null, f: String, s: '\\cdot' },
          z7m: { tex: '(\\mathbb Z_7\\setminus\\{0\\}, \\cdot)', els: [1, 2, 3, 4, 5, 6], op: (a, b) => (a * b) % 7, mem: (x) => x >= 1 && x < 7, e: 1, inv: (a) => [1, 2, 3, 4, 5, 6].find((b) => (a * b) % 7 === 1), f: String, s: '\\cdot' },
          d3: { tex: 'D_3', els: [0, 1, 2, 3, 4, 5], op: (a, b) => D3.T[a][b], mem: () => true, e: 0, inv: (a) => D3.inv[a], f: (a) => D3.L[a], s: '' },
          m2: { tex: '(\\mathbb M_2(\\mathbb R), \\cdot)', sample: (r) => [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]], op: (A, B) => mm(A, B), mem: () => true, eq: (A, B) => A.every((row, i) => row.every((x, j) => Math.abs(x - B[i][j]) < 1e-9)), e: [[1, 0], [0, 1]], inv: mInv, f: (A) => fmtM(A.map((r) => r.map(fmtR))), s: '' },
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
          out.assoc = triples.map(([a, b, d]) => { const L = c.op(c.op(a, b), d), R = c.op(a, c.op(b, d)); return { ok: eq(L, R), ex: String.raw`(${c.f(a)} ${c.s} ${c.f(b)}) ${c.s} ${c.f(d)} = ${c.f(L)} = ${c.f(a)} ${c.s} (${c.f(b)} ${c.s} ${c.f(d)})`, bad: String.raw`(${c.f(a)} ${c.s} ${c.f(b)}) ${c.s} ${c.f(d)} = ${c.f(L)} \ne ${c.f(R)} = ${c.f(a)} ${c.s} (${c.f(b)} ${c.s} ${c.f(d)})` }; });
          out.id = c.e == null ? [{ ok: false, txt: c.noE }] : singles.map((a) => ({ ok: eq(c.op(c.e, a), a) && eq(c.op(a, c.e), a), ex: String.raw`e = ${c.f(c.e)}:\ ${c.f(c.e)} ${c.s} ${c.f(a)} = ${c.f(a)} ${c.s} ${c.f(c.e)} = ${c.f(a)}` }));
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
            const msg = fail ? (fail.txt ? fail.txt : `$${fail.bad}$`) : `$${tests[0].ex}$`;
            s.text(msg, 3.2, y, { size: 13, color: fail ? 'red' : 'ink' });
          });
        });
        v.readout(() => {
          const R = run(), c = C[which.value], failed = ROWS.filter(([k]) => R[k].some((x) => !x.ok)).map(([, n]) => n);
          return failed.length ? `$${c.tex}$ is **not a group**: ${failed.join(', ')} ${failed.length > 1 ? 'fail' : 'fails'}.` : `$${c.tex}$ passes all four tests${c.els ? ' (checked on every element, pair and triple)' : ' on these samples — and indeed it is a group'}${c.els ? `: **a group** of order ${c.els.length}` : ''}.`;
        });
      },
    },
  ],
};
