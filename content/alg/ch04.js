// Abstract Algebra (Judson) — Chapter 4: Cyclic Groups
// Part 1 (this file): cyclic subgroups, generators and orders, subgroups of cyclic groups, orders of powers (4.3–4.14).
// Part 2 (ch04-b.js): complex numbers, the circle group, roots of unity, repeated squaring (4.15a–4.28).
import { elColor, gcd, cyclic, units, dihedral, quaternion, orderOf, power, allSubgroups, subgroupTest, roster, mod, divisors, phi, hour, hitHour, starWalk, drawClock, drawWalk, divisorLattice, arc } from './ch04.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const L$ = (s) => (/^-?\d+$/.test(s) ? s : `$${s}$`);
/** Powers e, a, a², … of a until they return to e (a finite group). */
const powersOf = (G, a) => { const P = [G.e]; let x = a; while (x !== G.e && P.length <= G.n) { P.push(x); x = G.T[x][a]; } return P; };
/** a cyclic group presented by a generator g: powers[i] = g^i, idx[x] = i. */
const present = (G, g) => { const P = powersOf(G, g), idx = new Map(P.map((x, i) => [x, i])); return { P, idx }; };
const ORD_COLS = ['muted', 'orange', 'purple', 'teal', 'pink', 'blue', 'red', 'gold'];

export default {
  collection: 'alg',
  chapter: 4,
  title: 'Cyclic Groups',
  summary: String.raw`The powers of a single element form the smallest subgroup containing it. Groups generated in this way are abelian, all of their subgroups are again cyclic, and the order of every power of a generator is read off from a gcd. The nonzero complex numbers supply cyclic groups of every order — the roots of unity, evenly spaced on the unit circle — and repeated squaring turns the laws of exponents into a fast algorithm for modular powers.`,
  items: [
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'The cyclic subgroup ⟨a⟩',
      statement: String.raw`Let $G$ be a group and $a\in G$. Then
$$\langle a\rangle=\{a^k: k\in\mathbb Z\}$$
is a subgroup of $G$, and it is the smallest subgroup of $G$ that contains $a$: every subgroup containing $a$ contains $\langle a\rangle$. (In additive notation, $\langle a\rangle=\{na: n\in\mathbb Z\}$.)`,
      idea: String.raw`The laws of exponents (3.31) do all the work: $e=a^0\in\langle a\rangle$, $a^ka^l=a^{k+l}$ gives closure, and $(a^k)^{-1}=a^{-k}$ gives inverses, so the subgroup test (3.30) passes. Conversely any subgroup containing $a$ contains all products $a\cdot a\cdots a$ and their inverses, i.e. every $a^k$. In a finite group the positive powers already loop back to $e$, so the negative powers bring nothing new: $a^{-1}=a^{m-1}$ when $a^m=e$.`,
      caption: String.raw`Click an element $a$ and step through its powers: the arrows $x\mapsto xa$ trace a loop that closes at $e$. The table on the right multiplies the visited elements with each other — it never leaves the loop, so $\langle a\rangle$ is closed. Try a rotation and a reflection in $D_4$, or $i$ in $Q_8$.`,
      deps: ['alg-3.30', 'alg-3.23', 'alg-3.31'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'subgroups'],
      viz(v) {
        const GR = { D4: dihedral(4), Q8: quaternion(), U20: units(20), U9: units(9), Z12: cyclic(12) };
        let a = 1;
        const which = v.select('group', [{ value: 'D4', label: '$D_4$' }, { value: 'Q8', label: '$Q_8$' }, { value: 'U20', label: '$U(20)$' }, { value: 'U9', label: '$U(9)$' }, { value: 'Z12', label: '$\\mathbb Z_{12}$' }], 'D4', { onChange: () => { a = 1; S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.38, 1.38], equal: true, axes: false, height: 340 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        const T = v.table(t, { rows: 4, cols: 4, maxCell: 44, size: 13, margin: 6 });
        s.onClick((x, y) => { const G = GR[which.value], k = hitHour(s, G.n, x, y, 1, [0, 0], 22); if (k >= 0) { a = k; S.reset({ at: 'end' }); } });
        const S = v.steps({
          frames: () => { const G = GR[which.value], P = powersOf(G, a), m = P.length, out = []; for (let k = 0; k <= m; k++) out.push({ k, note: k === 0 ? `$a^0 = e$.` : k < m ? `$a^{${k}} = ${G.L[P[k]]}$.` : `$a^{${m}} = e$: the loop closes, so $a^{-1} = a^{${m - 1}} = ${G.L[P[m - 1]]}$ and negative powers repeat the same ${m} elements.` }); return out; },
          start: 'end', still: 'end', speed: 2,
        });
        v.render(() => {
          const G = GR[which.value], n = G.n, P = powersOf(G, a), m = P.length, k = S.frame.k ?? m, vis = new Set(P.slice(0, Math.min(k, m - 1) + 1));
          const walk = P.slice(0, Math.min(k, m - 1) + 1).concat(k >= m ? [G.e] : []);
          drawClock(v, s, n, { label: (i) => L$(G.L[i]), dot: (i) => ({ color: vis.has(i) ? (i === a ? 'gold' : 'accent') : 'faint', r: vis.has(i) ? 6.5 : 4.5, ring: i === a ? 'gold' : null }), labelColor: (i) => (vis.has(i) ? 'ink' : 'muted'), size: 13 });
          drawWalk(v, s, n, walk, { color: 'accent', width: 2.2, arrows: true, trim: 10 });
          s.corner(`order of a: ${m}`, 'tl', { size: 12.5, weight: 700, color: 'ink' });
          const show = k >= m ? m : Math.min(k, m - 1) + 1;
          T.draw({
            rows: m, cols: m, rowLabels: (i) => L$(G.L[P[i]]), colLabels: (j) => L$(G.L[P[j]]), cornerLabel: '$\\cdot$',
            value: (i, j) => (i < show && j < show ? L$(G.L[G.T[P[i]][P[j]]]) : null),
            fill: (i, j) => (i < show && j < show ? [elColor(v, (i + j) % m, m), 0.28] : null),
          });
          t.corner('products inside ⟨a⟩', 'tl', { size: 11.5 });
        });
        v.readout(() => {
          const G = GR[which.value], P = powersOf(G, a), H = new Set(P), test = subgroupTest(G, H);
          const subs = allSubgroups(G).filter((K) => K.includes(a)), all = subs.every((K) => P.every((x) => K.includes(x)));
          return `$\\langle ${G.L[a]}\\rangle = ${roster(G, H)}$, ${P.length} element${P.length > 1 ? 's' : ''}. Subgroup test: $e\\in$ ${test.hasE ? '✓' : '✗'}, closed ${test.close ? '✗' : '✓'}, inverses ${test.inv == null ? '✓' : '✗'}. Of the ${allSubgroups(G).length} subgroups of $${G.tex}$, ${subs.length} contain $${G.L[a]}$, and every one of them contains $\\langle ${G.L[a]}\\rangle$ ${all ? '✓' : '✗'} — it is the smallest.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4a
    {
      num: '4.4a',
      kind: 'Definition',
      name: 'Cyclic group, generator and order of an element',
      statement: String.raw`$\langle a\rangle$ is the **cyclic subgroup generated by $a$**. A group $G$ is **cyclic** if $G=\langle a\rangle$ for some $a\in G$; such an $a$ is a **generator** of $G$. The **order** $|a|$ of an element $a$ is the smallest positive integer $n$ with $a^n=e$ (written $na=0$ additively); if no such $n$ exists, $a$ has **infinite order**, $|a|=\infty$. Thus $|a|=|\langle a\rangle|$.`,
      idea: String.raw`A finite group of order $n$ is cyclic exactly when some element has order $n$. $\mathbb Z$ and every $\mathbb Z_n$ are cyclic, generated by $1$; $\mathbb Z_6$ is also generated by $5$ but not by $2$, whose powers are $\{0,2,4\}$. $U(9)$ is cyclic with generator $2$ ($2,4,8,7,5,1$). Not every group is cyclic: in $U(8)$ every element squares to $1$, and in $D_3$ the largest order is $3<6$.`,
      caption: String.raw`Each element is coloured by its order, and the bars on the right show the orders against the dashed line $|G|$. Elements whose bar reaches the line are generators (green, ringed). Click an element to draw the loop of its powers. Compare $\mathbb Z_6$, $U(9)$ (cyclic) with $U(8)$ and $D_3$ (not cyclic).`,
      deps: ['alg-4.3'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'order'],
      viz(v) {
        const GR = { Z6: cyclic(6), Z8: cyclic(8), U9: units(9), U8: units(8), U10: units(10), D3: dihedral(3) };
        let a = 1;
        v.select('group', [{ value: 'Z6', label: '$\\mathbb Z_6$' }, { value: 'Z8', label: '$\\mathbb Z_8$' }, { value: 'U9', label: '$U(9)$' }, { value: 'U8', label: '$U(8)$' }, { value: 'U10', label: '$U(10)$' }, { value: 'D3', label: '$D_3$' }], 'Z6', { onChange: (k) => { which = k; a = 1; } });
        let which = 'Z6';
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.38, 1.38], equal: true, axes: false, height: 320 });
        const t = v.stage({ x: [-0.7, 6.7], y: [0, 9], axes: false, height: 320 });
        s.onClick((x, y) => { const G = GR[which], k = hitHour(s, G.n, x, y, 1, [0, 0], 22); if (k >= 0) a = k; });
        t.onClick((x) => { const G = GR[which], k = Math.round(x); if (k >= 0 && k < G.n) a = k; });
        const ordCol = (G, o) => (o === G.n ? 'green' : ORD_COLS[[...new Set(Array.from({ length: G.n }, (_, i) => orderOf(G, i)))].sort((x, y) => x - y).indexOf(o) % ORD_COLS.length]);
        v.render(() => {
          const G = GR[which], n = G.n, ords = Array.from({ length: n }, (_, i) => orderOf(G, i)), A = a % n, P = powersOf(G, A);
          drawClock(v, s, n, { label: (i) => L$(G.L[i]), dot: (i) => ({ color: ordCol(G, ords[i]), r: 6.5, ring: ords[i] === n ? 'green' : i === A ? 'gold' : null }), size: 13.5 });
          drawWalk(v, s, n, P.concat([G.e]), { color: 'gold', width: 2.2, arrows: true, trim: 11 });
          s.corner(`$|${G.L[A]}| = ${ords[A]}$`, 'tl', { size: 13, weight: 700, color: 'ink' });
          t.setView([-0.7, n - 0.3], [-1.2, n + 1.4]);
          t.line(-0.6, n, n - 0.4, n, { color: 'green', width: 1.6, dash: [5, 4] });
          t.text(`|G| = ${n}`, n - 0.4, n, { dy: -10, align: 'right', size: 11.5, weight: 700, color: 'green' });
          for (let i = 0; i < n; i++) {
            const c = ordCol(G, ords[i]);
            t.rect(i - 0.34, 0, i + 0.34, ords[i], { fill: c, fillAlpha: i === A ? 0.75 : 0.45, color: i === A ? 'gold' : c, width: i === A ? 2.6 : 1 });
            t.text(String(ords[i]), i, ords[i], { dy: -9, align: 'center', size: 11.5, weight: 700 });
            t.text(L$(G.L[i]), i, 0, { dy: 14, align: 'center', size: 12, color: 'muted' });
          }
          t.corner('order of each element', 'tl', { size: 11.5 });
        });
        v.readout(() => {
          const G = GR[which], n = G.n, ords = Array.from({ length: n }, (_, i) => orderOf(G, i)), gens = [...Array(n).keys()].filter((i) => ords[i] === n), A = a % n, P = powersOf(G, A);
          const verdict = gens.length ? `**$${G.tex}$ is cyclic**, with generator${gens.length > 1 ? 's' : ''} $${gens.map((i) => G.L[i]).join(', ')}$.` : `**$${G.tex}$ is not cyclic**: the largest order is ${Math.max(...ords)} < ${n}.`;
          return `$\\langle ${G.L[A]}\\rangle = \\{${P.map((x) => G.L[x]).join(', ')}\\}$, so $|${G.L[A]}| = ${P.length}$. ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Every cyclic group is abelian',
      statement: String.raw`Every cyclic group is abelian: if $G=\langle a\rangle$, then $gh=hg$ for all $g,h\in G$.`,
      idea: String.raw`Write $g=a^r$ and $h=a^s$. By the laws of exponents, $gh=a^ra^s=a^{r+s}=a^{s+r}=a^sa^r=hg$ — commutativity of the group is inherited from commutativity of addition of exponents. Pictured on the circle of powers, multiplying by $a^r$ is walking $r$ notches; walking $r$ then $s$ or $s$ then $r$ ends at the same notch. The converse fails: the Klein group is abelian but not cyclic.`,
      caption: String.raw`The elements of a cyclic group sit on the circle of powers of a generator $a$. Drag $g$ and $h$: the outer path walks $r$ notches then $s$, the inner path $s$ then $r$, and both end on $a^{r+s}$ — the readout checks it with the group’s own multiplication. Switch to $D_3$, which is not cyclic: the reflections lie off the circle of powers of $\rho_1$, and $gh\ne hg$ becomes possible.`,
      deps: ['alg-4.4a', 'alg-3.31'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'abelian'],
      viz(v) {
        const GR = { Z12: [cyclic(12), 1], U9: [units(9), 1], U14: [units(14), 1], U10: [units(10), 1], D3: [dihedral(3), 1] };
        const which = v.select('group', [{ value: 'Z12', label: '$\\mathbb Z_{12}$, $a = 1$' }, { value: 'U9', label: '$U(9)$, $a = 2$' }, { value: 'U14', label: '$U(14)$, $a = 3$' }, { value: 'U10', label: '$U(10)$, $a = 3$' }, { value: 'D3', label: '$D_3$ (not cyclic)' }], 'U9', { onChange: () => { place(2, 3); } });
        const s = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 360, full: true });
        const pos = () => {
          const [G, g] = GR[which.value];
          if (which.value === 'D3') return { G, pts: [0, 1, 2].map((k) => hour(k, 3, 0.95)).concat([0, 1, 2].map((k) => hour(k + 0.5, 3, 1.5))), order: [0, 1, 2, 3, 4, 5], cyc: false };
          const { P } = present(G, g);
          return { G, pts: P.map((_, i) => hour(i, P.length, 1)), order: P, cyc: true };
        };
        const snap = (x, y) => { const { pts } = pos(); let b = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = i; } }); return pts[b]; };
        const hg = s.handle(...hour(2, 6), { color: 'blue', label: 'g', constrain: snap }), hh = s.handle(...hour(3, 6), { color: 'orange', label: 'h', constrain: snap });
        const idxOf = (h) => { const { pts } = pos(); let b = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d < bd) { bd = d; b = i; } }); return b; };
        function place(i, j) { const { pts } = pos(); hg.set(...pts[i % pts.length]); hh.set(...pts[j % pts.length]); }
        place(2, 3);
        v.render(() => {
          const { G, pts, order, cyc } = pos(), n = pts.length, r = idxOf(hg), q = idxOf(hh);
          v.legend(cyc ? [['blue', 'walk r notches (g = aʳ)'], ['orange', 'walk s notches (h = aˢ)'], ['gold', 'gh = hg = aʳ⁺ˢ', { dot: true }]] : [['green', 'gh', { dot: true }], ['red', 'hg', { dot: true }], ['gold', 'gh = hg', { dot: true }]]);
          if (cyc) {
            s.circle(0, 0, 1, { color: 'faint', width: 1.4, fill: false });
            const A = (k) => Math.PI / 2 - (2 * Math.PI * k) / n;
            arc(v, s, 1.2, A(0), A(r), { color: 'blue', width: 3 }); arc(v, s, 1.2, A(r), A(r + q), { color: 'orange', width: 3, head: true });
            arc(v, s, 0.8, A(0), A(q), { color: 'orange', width: 3 }); arc(v, s, 0.8, A(q), A(q + r), { color: 'blue', width: 3, head: true });
            const e = (r + q) % n;
            pts.forEach(([x, y], i) => {
              s.dot(x, y, { r: i === e ? 8 : 5, color: i === e ? 'gold' : 'muted' });
              s.text(L$(G.L[order[i]]), x * 1.42, y * 1.42, { align: 'center', size: 14, weight: 700 });
              s.text(i === 0 ? '$e$' : i === 1 ? '$a$' : `$a^{${i}}$`, x * 0.6, y * 0.6, { align: 'center', size: 11, color: 'muted' });
            });
            s.corner('outer: r then s · inner: s then r', 'tl', { size: 11.5 });
          } else {
            s.circle(0, 0, 0.95, { color: 'faint', width: 1.4, fill: false, dash: [4, 4] });
            const gi = order[r], hi = order[q], gh = G.T[gi][hi], hgp = G.T[hi][gi];
            pts.forEach(([x, y], i) => {
              const lab = G.L[order[i]], col = order[i] === gh && order[i] === hgp ? 'gold' : order[i] === gh ? 'green' : order[i] === hgp ? 'red' : 'muted';
              s.dot(x, y, { r: col === 'muted' ? 5 : 8, color: col });
              s.text(`$${lab}$`, x * 1.22 + (i >= 3 ? x * 0.08 : 0), y * 1.22 + (i >= 3 ? y * 0.08 : 0), { align: 'center', size: 14 });
            });
            drawWalk(v, s, 3, [0, 1, 2, 0], { R: 0.95, color: 'faint', arrows: true, trim: 12 });
            s.corner('powers of ρ₁ reach only the rotations', 'tl', { size: 11.5 });
          }
        });
        v.readout(() => {
          const { G, order, cyc } = pos(), r = idxOf(hg), q = idxOf(hh), gi = order[r], hi = order[q], gh = G.T[gi][hi], hgp = G.T[hi][gi];
          if (cyc) { const n = order.length; let all = true; for (const x of order) for (const y of order) if (G.T[x][y] !== G.T[y][x]) all = false; return `$g = a^{${r}} = ${G.L[gi]}$, $h = a^{${q}} = ${G.L[hi]}$: $gh = ${G.L[gh]}$ and $hg = ${G.L[hgp]}$, both $= a^{${(r + q) % n}}$ ${gh === hgp && gh === order[(r + q) % n] ? '✓' : '✗'}. All ${n * n} pairs commute ${all ? '✓' : '✗'}.`; }
          return `$g = ${G.L[gi]}$, $h = ${G.L[hi]}$: $gh = ${G.L[gh]}$ (green) and $hg = ${G.L[hgp]}$ (red)${gh === hgp ? ' — this pair commutes; try a rotation with a reflection' : ' — **different**'}. $D_3$ has no generator (orders 1, 3, 3, 2, 2, 2), so 4.9 does not apply.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Subgroups of cyclic groups are cyclic',
      statement: String.raw`Every subgroup of a cyclic group is cyclic. More precisely, if $G=\langle a\rangle$ and $H\le G$, then $H=\langle a^m\rangle$, where $m$ is the smallest positive integer with $a^m\in H$ (and $H=\{e\}=\langle e\rangle$ if there is none).`,
      idea: String.raw`Take $h=a^k\in H$ and divide (2.9): $k=mq+r$ with $0\le r<m$. Then $a^r=a^k(a^m)^{-q}\in H$, and minimality of $m$ forces $r=0$, so $h=(a^m)^q\in\langle a^m\rangle$. For $\mathbb Z_n$ this means the subgroups are exactly $\langle d\rangle$ for the divisors $d$ of $n$, one for each divisor, and they form the **divisor lattice** of $n$; the subgroup generated by any set of elements is $\langle\gcd\rangle$ of them and $n$.`,
      caption: String.raw`Click elements of $\mathbb Z_n$ (gold rings) to generate a subgroup $H$ (blue). Its smallest positive member $m$ is ringed green, and the multiples of $m$ — the polygon — are exactly $H$. On the right, the lattice of all subgroups $\langle d\rangle$, $d\mid n$; the current $H$ is gold and the subgroups inside it are tinted. Click a lattice node to jump there.`,
      deps: ['alg-4.4a', 'alg-2.9'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'subgroups', 'lattice'],
      viz(v) {
        let S = new Set([16, 20]);
        const N = v.select('$n$', [12, 18, 20, 24, 30].map((n) => ({ value: n, label: `$\\mathbb Z_{${n}}$` })), 24, { onChange: (n) => { S = new Set([...S].filter((x) => x < n)); } });
        v.button('Clear', () => { S = new Set(); });
        const s = v.stage({ x: [-1.4, 1.4], y: [-1.35, 1.35], equal: true, axes: false, height: 340 });
        const g = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340 });
        const Gr = v.graph(g, { nodes: [], edges: [], layout: 'none', draggable: false, shape: 'box', fontSize: 12.5 });
        Gr.onClick = ({ node }) => { if (node) S = new Set([+node.id % +N.value]); return true; };
        s.onClick((x, y) => { const n = +N.value, k = hitHour(s, n, x, y); if (k >= 0) { if (S.has(k)) S.delete(k); else S.add(k); } });
        const gen = () => { const n = +N.value; let m = n; for (const x of S) m = gcd(m, x); return m; };
        v.render(() => {
          const n = +N.value, m = gen(), inH = (k) => k % m === 0;
          drawWalk(v, s, n, starWalk(n, m % n), { color: 'accent', width: 2, alpha: 0.6 });
          drawClock(v, s, n, { size: n > 20 ? 11 : 12.5, dot: (k) => ({ color: inH(k) ? 'accent' : 'faint', r: inH(k) ? 6 : 4, ring: k === m % n && m < n ? 'green' : S.has(k) ? 'gold' : null }), labelColor: (k) => (inH(k) ? 'ink' : 'muted') });
          s.corner(`H = ⟨${m % n}⟩, order ${n / m}`, 'tl', { size: 13, weight: 700, color: 'accent' });
          const L = divisorLattice(n, [0.1, 0.9], [0.1, 0.9]);
          Gr.nodes = L.nodes.map((nd) => ({ id: nd.d, x: nd.x, y: nd.y, label: `⟨${nd.d % n}⟩ · ${nd.order}` }));
          Gr.edges = L.edges.map(([i, j]) => ({ from: L.nodes[i].d, to: L.nodes[j].d }));
          Gr.draw({ nodeFill: (id) => (+id === m ? 'gold' : null), nodeColor: (id) => (+id % m === 0 ? 'accent' : 'muted'), edgeColor: (e) => (+e.from % m === 0 && +e.to % m === 0 ? 'accent' : 'faint') });
          g.corner('subgroup · order', 'tl', { size: 11.5 });
        });
        v.readout(() => {
          const n = +N.value, m = gen(), H = [...Array(n / m).keys()].map((q) => q * m), Sv = [...S].sort((a, b) => a - b);
          const ok = H.every((h) => h % m === 0);
          return `${Sv.length ? `$\\langle ${Sv.join(', ')}\\rangle$` : 'Nothing chosen: $\\{0\\}$'} $= \\langle ${m % n}\\rangle = \\{${H.join(', ')}\\}$, where $${m % n || n} = \\gcd(${[...Sv, n].join(', ')})$. Each $h\\in H$ is $q\\cdot ${m % n || n} + 0$ ${ok ? '✓' : '✗'}. $\\mathbb Z_{${n}}$ has ${divisors(n).length} subgroups, one for each divisor of ${n}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Corollary',
      name: 'The subgroups of ℤ are the nℤ',
      statement: String.raw`The subgroups of $\mathbb Z$ are exactly the sets $n\mathbb Z=\{nk: k\in\mathbb Z\}$ for $n=0,1,2,\ldots$; different $n$ give different subgroups.`,
      idea: String.raw`$\mathbb Z=\langle1\rangle$ is cyclic, so by Theorem 4.10 every subgroup is $\langle n\rangle=n\mathbb Z$, with $n$ its smallest positive element ($n=0$ for the trivial subgroup). The smallest positive element of the subgroup generated by integers $s_1,\ldots,s_k$ is their gcd — closing under sums and differences performs Euclid’s algorithm (2.12) on the generators.`,
      caption: String.raw`Click integers to choose generators (gold). Step through the closure: each round adds all sums and differences of numbers already present (new ones gold). The set fills an evenly spaced lattice $n\mathbb Z$ whose spacing is its smallest positive member, ringed green — the gcd of the generators.`,
      deps: ['alg-4.10'],
      refs: ['Judson §4.1'],
      tags: ['subgroups', 'integers'],
      viz(v) {
        const W = 30;
        let S0 = new Set([18, 30, -12]);
        v.button('Clear', () => { S0 = new Set(); St.reset({ at: 'end' }); });
        const s = v.stage({ x: [-W - 1, W + 1], y: [-1.2, 1.6], axes: false, height: 180, full: true });
        s.onClick((x) => { const k = Math.round(x); if (Math.abs(k) > W) return; if (S0.has(k)) S0.delete(k); else S0.add(k); St.reset({ at: 'end' }); });
        const levels = () => {
          let cur = new Set([0, ...S0, ...[...S0].map((x) => -x)]); const out = [{ set: new Set(cur), add: new Set(cur), r: 0 }];
          for (let r = 1; r < 12; r++) {
            const nx = new Set(cur); for (const x of cur) for (const y of cur) for (const z of [x + y, x - y]) if (Math.abs(z) <= W) nx.add(z);
            if (nx.size === cur.size) break;
            out.push({ set: nx, add: new Set([...nx].filter((z) => !cur.has(z))), r }); cur = nx;
          }
          return out;
        };
        const nOf = () => [...S0].reduce((g, x) => gcd(g, Math.abs(x)), 0);
        const St = v.steps({
          frames: () => { const L = levels(); return L.map((f, i) => ({ ...f, note: i === 0 ? 'Start: the generators, their negatives and $0$.' : `Round ${f.r}: add every sum and difference — ${f.add.size} new element${f.add.size === 1 ? '' : 's'}.` })).concat([{ ...L[L.length - 1], add: new Set(), done: true, note: nOf() ? `Nothing new appears: the subgroup is $${nOf()}\\mathbb Z$, spacing $${nOf()} = \\gcd$ of the generators.` : 'Only $0$: the subgroup $0\\mathbb Z = \\{0\\}$.' }]); },
          start: 'end', still: 'end', speed: 1.2,
        });
        v.render(() => {
          const f = St.frame, n = nOf();
          for (let k = -W; k <= W; k++) s.line(k, -0.08, k, 0.08, { color: 'faint', width: 1 });
          s.line(-W - 0.5, 0, W + 0.5, 0, { color: 'muted', width: 1.3 });
          for (let k = -W; k <= W; k += 5) s.text(String(k).replace('-', '−'), k, 0, { dy: 16, align: 'center', size: 10.5, color: 'muted' });
          if (f.done && n) for (let k = -Math.floor(W / n) * n; k <= W; k += n) s.line(k, -0.3, k, 0.3, { color: 'green', width: 2.2, alpha: 0.6 });
          for (const k of f.set || []) s.dot(k, 0, { r: 5.5, color: f.add && f.add.has(k) && !f.done ? 'gold' : 'accent' });
          for (const k of S0) s.dot(k, 0.75, { r: 6, color: 'gold' });
          if (S0.size) s.text('generators', -W, 0.75, { size: 11.5, color: 'gold', weight: 700 });
          if (f.done && n) { s.dot(n, 0, { r: 11, hollow: true, color: 'green' }); s.text(`n = ${n}`, n, 0, { dy: -24, align: 'center', size: 12.5, weight: 800, color: 'green' }); }
        });
        v.readout(() => {
          const L = levels(), F = L[L.length - 1].set, n = nOf(), want = new Set(); if (n) for (let k = -Math.floor(W / n) * n; k <= W; k += n) want.add(k); else want.add(0);
          const ok = F.size === want.size && [...F].every((k) => want.has(k));
          return `Generators $\\{${[...S0].sort((a, b) => a - b).join(', ').replace(/-/g, '−')}\\}$: the closure inside $[-${W}, ${W}]$ is exactly the multiples of $${n}$ ${ok ? '✓' : '✗'}, so the subgroup is $${n}\\mathbb Z$ with $${n} = \\gcd(${[...S0].map(Math.abs).join(', ') || '0'})$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Proposition',
      name: 'aᵏ = e iff n divides k',
      statement: String.raw`Let $G$ be a cyclic group of order $n$ with generator $a$. Then $a^k=e$ if and only if $n\mid k$.`,
      idea: String.raw`If $k=nm$ then $a^k=(a^n)^m=e^m=e$. Conversely, divide: $k=nq+r$ with $0\le r<n$ (2.9). Then $e=a^k=(a^n)^qa^r=a^r$, and since $n$ is the *least* positive exponent giving $e$, the remainder must be $r=0$. In pictures: $k$ steps around a loop of $n$ notches wind $q$ full times and stop $r$ notches past the start.`,
      caption: String.raw`Walk $k$ steps around the loop of powers $e, a, a^2,\ldots,a^{n-1}$ (negative $k$ walks backwards); the spiral widens with each full lap so the laps $q$ can be counted, and the walk stops on $a^r$ with $r=k \bmod n$. The strip below marks, for every $k$ from $-24$ to $24$, whether $a^k=e$: exactly the multiples of $n$.`,
      deps: ['alg-4.4a', 'alg-2.9'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'order'],
      viz(v) {
        const N = v.slider('$n$', 2, 12, 5, { int: true }), K = v.slider('$k$', -24, 24, 13, { int: true });
        const s = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 330, full: true });
        const t = v.stage({ x: [-25, 25], y: [-1, 1], axes: false, height: 90, full: true });
        t.onClick((x) => K.set(clamp(Math.round(x), -24, 24)));
        v.render(() => {
          const n = N.value, k = K.value, sg = Math.sign(k) || 1, laps = Math.abs(k) / n, r0 = 0.55, dr = 0.16, Rmax = r0 + dr * laps;
          const Rl = Math.max(1.05, Rmax + 0.22); s.setView([-Rl - 0.35, Rl + 0.35], [-Rl - 0.35, Rl + 0.35]);
          for (let j = 0; j < n; j++) { const [x, y] = hour(j, n, Rl); s.line(0, 0, ...hour(j, n, Rl - 0.08), { color: 'faint', width: 1 }); s.text(j === 0 ? '$e$' : j === 1 ? '$a$' : `$a^{${j}}$`, x, y, { align: 'center', size: 13, color: j === mod(k, n) ? (mod(k, n) === 0 ? 'green' : 'gold') : 'ink' }); }
          const pts = [], M = Math.max(2, Math.ceil(Math.abs(k) * 24));
          for (let i = 0; i <= M; i++) { const u = (Math.abs(k) * i) / M, ang = Math.PI / 2 - (sg * 2 * Math.PI * u) / n, rr = r0 + (dr * u) / n; pts.push([rr * Math.cos(ang), rr * Math.sin(ang)]); }
          if (Math.abs(k)) s.path(pts, { color: 'accent', width: 2.2 });
          for (let j = 0; j <= Math.abs(k); j++) { const ang = Math.PI / 2 - (sg * 2 * Math.PI * j) / n, rr = r0 + (dr * j) / n; s.dot(rr * Math.cos(ang), rr * Math.sin(ang), { r: 3, color: 'accent' }); }
          const end = pts[pts.length - 1] || [0, r0];
          s.dot(end[0], end[1], { r: 7.5, color: mod(k, n) === 0 ? 'green' : 'gold' });
          s.dot(0, r0, { r: 5, hollow: true, color: 'ink' });
          s.corner(`k = ${k} = ${Math.floor(k / n)}·${n} + ${mod(k, n)}`, 'tl', { size: 13, weight: 700, color: 'ink' });
          for (let j = -24; j <= 24; j++) {
            const z = mod(j, n) === 0;
            t.rect(j - 0.42, -0.35, j + 0.42, 0.35, { fill: z ? 'green' : 'muted', fillAlpha: z ? 0.55 : 0.08, color: z ? 'green' : 'faint', width: 1 });
            if (j % 4 === 0 || z) t.text(String(j).replace('-', '−'), j, 0, { dy: 18, align: 'center', size: 9.5, color: z ? 'green' : 'muted' });
          }
          t.rect(k - 0.5, -0.45, k + 0.5, 0.45, { color: 'gold', width: 2.6, fill: false });
          t.text('aᵏ = e ?', -24.8, 0.75, { size: 11, color: 'muted' });
        });
        v.readout(() => {
          const n = N.value, k = K.value, q = Math.floor(k / n), r = mod(k, n);
          return `$k = ${k} = ${n}\\cdot(${q}) + ${r}$, so $a^{${k}} = (a^{${n}})^{${q}}a^{${r}} = ${r ? `a^{${r}} \\ne e` : 'e'}$ — and indeed $${n} ${r ? '\\nmid' : '\\mid'} ${k}$. In the strip, $a^k = e$ exactly at the multiples of ${n} ✓.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'The order of aᵏ is n / gcd(k, n)',
      statement: String.raw`Let $G$ be a cyclic group of order $n$ with generator $a$, and let $b=a^k$. Then the order of $b$ is $n/d$, where $d=\gcd(k,n)$.`,
      idea: String.raw`By 4.12, $b^m=a^{km}=e$ exactly when $n\mid km$. Dividing by $d$, this says $\frac nd\mid\frac kd\,m$, and since $\frac nd$ and $\frac kd$ are relatively prime (2.11, 2.13) it says $\frac nd\mid m$. The least such positive $m$ is $n/d$. In $\mathbb Z_n$ the powers of $k$ are the multiples $0,k,2k,\ldots$, drawn as the star polygon $\{n/k\}$: it closes after $n/d$ steps, visiting exactly the multiples of $d$.`,
      caption: String.raw`Choose $n$ and $k$: the star polygon jumps $k$ hours at a time around $n$ dots and closes after $n/\gcd(k,n)$ jumps, visiting only the multiples of $d=\gcd(k,n)$ (gold). The table lists $km \bmod n$ for $m=1,\ldots,n$; the first $0$ marks the order.`,
      deps: ['alg-4.12', 'alg-2.10'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'order', 'gcd'],
      viz(v) {
        const N = v.slider('$n$', 2, 30, 12, { int: true, onChange: (n) => { if (K.value >= n) K.set(n - 1); } }), K = v.slider('$k$', 0, 29, 8, { int: true, onChange: (k) => { if (k >= N.value) K.set(N.value - 1); } });
        const s = v.stage({ x: [-1.4, 1.4], y: [-1.35, 1.35], equal: true, axes: false, height: 330, full: true });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 110, full: true });
        const T = v.table(t, { rows: 2, cols: 12, maxCell: 30, minCell: 12, size: 11, labelSize: 11, margin: 4, square: false, cellAspect: 0.9, rowLabels: ['$m$', '$km$'] });
        v.render(() => {
          const n = N.value, k = Math.min(K.value, n - 1), d = gcd(k, n) || n, W = starWalk(n, k), m = n / d;
          drawWalk(v, s, n, W, { color: 'accent', width: 2.2, arrows: n <= 16, trim: 9 });
          drawClock(v, s, n, { size: n > 20 ? 10.5 : 12.5, dot: (j) => ({ color: j % d === 0 ? 'gold' : 'faint', r: j % d === 0 ? 6 : 4 }), labelColor: (j) => (j % d === 0 ? 'ink' : 'muted') });
          s.corner(`{${n}/${k}}: ${m} jump${m === 1 ? '' : 's'} to close`, 'tl', { size: 13, weight: 700, color: 'ink' });
          s.corner(`d = gcd(${k}, ${n}) = ${d}`, 'tr', { size: 13, weight: 700, color: 'gold' });
          T.draw({ cols: n, value: (i, j) => (i === 0 ? j + 1 : ((j + 1) * k) % n), fill: (i, j) => (((j + 1) * k) % n === 0 ? (j + 1 === m ? ['green', 0.55] : ['green', 0.15]) : null), highlight: [[1, m - 1, 'green']] });
        });
        v.readout(() => {
          const n = N.value, k = Math.min(K.value, n - 1), d = gcd(k, n) || n, m = n / d;
          let first = 0; for (let j = 1; j <= n; j++) if ((j * k) % n === 0) { first = j; break; }
          return `In $\\mathbb Z_{${n}}$, $|${k}| = ${first}$ (first $m$ with $${n}\\mid ${k}m$), and $n/\\gcd(k,n) = ${n}/${d} = ${m}$ ${first === m ? '✓' : '✗'}. The powers of ${k} are the multiples of ${d}: $\\langle ${k}\\rangle = \\langle ${d % n}\\rangle$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Corollary',
      name: 'Generators of ℤₙ',
      statement: String.raw`The generators of $\mathbb Z_n$ are exactly the integers $r$ with $1\le r<n$ and $\gcd(r,n)=1$ (for $n>1$). In particular $\mathbb Z_n$ has $\varphi(n)$ generators, and $\mathbb Z_p$ is generated by every nonzero element when $p$ is prime.`,
      idea: String.raw`$r$ generates $\mathbb Z_n=\langle1\rangle$ exactly when its order is $n$, and by Theorem 4.13 its order is $n/\gcd(r,n)$. So $r$ is a generator iff $\gcd(r,n)=1$. Judson’s example: the generators of $\mathbb Z_{16}$ are $1,3,5,7,9,11,13,15$.`,
      caption: String.raw`Every element $k$ of $\mathbb Z_n$ draws its star polygon at once. Generators — the $k$ coprime to $n$ — reach every dot and are drawn green; the others close early and show their order. Click a thumbnail to list its powers. Prime $n$ turns everything except $0$ green.`,
      deps: ['alg-4.13'],
      refs: ['Judson §4.1'],
      tags: ['cyclic groups', 'generators'],
      viz(v) {
        let sel = 3;
        const N = v.slider('$n$', 2, 30, 16, { int: true });
        const s = v.stage({ x: [0, 8], y: [0, 4], equal: true, axes: false, height: 390, full: true });
        const geo = () => { const n = N.value, cols = Math.min(n, Math.ceil(Math.sqrt(n * 2.2))), rows = Math.ceil(n / cols); return { n, cols, rows }; };
        s.onClick((x, y) => { const { n, cols, rows } = geo(), j = Math.floor(x), i = Math.floor(rows - y), k = i * cols + j; if (j >= 0 && j < cols && i >= 0 && k < n) sel = k; });
        v.render(() => {
          const { n, cols, rows } = geo(), S = sel % n;
          s.setView([0, cols], [0, rows]);
          for (let k = 0; k < n; k++) {
            const i = Math.floor(k / cols), j = k % cols, c = [j + 0.5, rows - i - 0.55], R = 0.33, gen = gcd(k, n) === 1, d = gcd(k, n) || n;
            if (k === S) s.rect(j + 0.04, rows - i - 0.96, j + 0.96, rows - i - 0.04, { radius: 8, color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.06 });
            s.circle(c[0], c[1], R, { color: 'faint', width: 1, fill: gen ? 'green' : false, fillAlpha: 0.06 });
            drawWalk(v, s, n, starWalk(n, k), { R, c, color: gen ? 'green' : 'orange', width: 1.6 });
            for (let h = 0; h < n; h++) { const [x, y] = hour(h, n, R, c); s.dot(x, y, { r: h % d === 0 ? 2.4 : 1.6, color: h % d === 0 ? (gen ? 'green' : 'orange') : 'faint' }); }
            s.text(String(k), j + 0.1, rows - i - 0.12, { size: 12, weight: 800, color: gen ? 'green' : 'ink' });
            if (!gen) s.text(`|${k}| = ${n / d}`, j + 0.9, rows - i - 0.12, { align: 'right', size: 9.5, color: 'muted' });
          }
        });
        v.legend([['green', 'generator: gcd(k, n) = 1'], ['orange', 'not a generator']]);
        v.readout(() => {
          const n = N.value, S = sel % n, gens = [...Array(n).keys()].filter((k) => gcd(k, n) === 1 && (k > 0 || n === 1)), W = starWalk(n, S).slice(0, -1);
          return `Generators of $\\mathbb Z_{${n}}$: $\\{${gens.join(', ')}\\}$ — $\\varphi(${n}) = ${phi(n)}$ of them. Selected: $\\langle ${S}\\rangle = \\{${W.join(', ')}\\}$, order ${W.length}${W.length === n ? ' — a generator' : ` $= ${n}/\\gcd(${S}, ${n})$`}.`;
        });
      },
    },
  ],
};
