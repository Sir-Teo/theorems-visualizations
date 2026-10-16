// Abstract Algebra (Judson) — Chapter 5, part 2: parity of permutations and the alternating group (5.15–5.17), the
// dihedral groups (5.18a–5.21) and the rotation group of the cube (5.26–5.27). Shared helpers: ch05.shared.js.
import { EC, compose, inverse, isId, idp, pkey, same, transp, fromCycles, cycles, cycTex, cycText, oneLine, twoRow, inversions, sign, allPerms, productOf, cycleTranspositions, bubbleTranspositions, permGroup, shuffled, beadCol, bead, wire, permCircle, mm, partial, axisOf, drawFigure, permMatrix, dihedralJ, dlabel, ngon, mat3, ap3, I3, mkey, rot3, round3, AXES, AXIS_ANGLE, CUBE_V, CUBE_F, cubeGroup } from './ch05.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const tTex = ([a, b]) => `(${a + 1}\\,${b + 1})`;
const tTxt = ([a, b]) => `(${a + 1} ${b + 1})`;
const par = (p) => (sign(p) > 0 ? 'even' : 'odd');
const PCOL = { even: 'blue', odd: 'orange' };
/** Bead arrangements row by row: rows[0] = identity, rows[k+1][layer_k(slot)] = rows[k][slot]. */
function arrangements(n, layers) { const rows = [idp(n)]; for (const p of layers) { const prev = rows[rows.length - 1], nx = new Array(n); prev.forEach((b, i) => { nx[p[i]] = b; }); rows.push(nx); } return rows; }
/** Segment intersection test (proper crossings). */
function segX(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) { const t = d1 / (d1 - d2); return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; }
  return null;
}
/** Chips (rounded boxes with transposition labels) laid out in rows from (x0, y0); returns the next y. */
function chips(s, list, x0, y0, o = {}) {
  const w = o.w ?? 0.62, h = o.h ?? 0.42, per = o.per ?? 8, gap = o.gap ?? 0.06;
  list.forEach((t, k) => {
    const r = Math.floor(k / per), c = k % per, x = x0 + c * (w + gap), y = y0 - r * (h + 0.12), col = o.color ? o.color(k) : 'accent';
    s.rect(x, y - h, x + w, y, { radius: 5, fill: col, fillAlpha: 0.13, color: col, width: 1.1 });
    s.text(tTxt(t), x + w / 2, y - h / 2, { align: 'center', size: o.size ?? 11.5, weight: 700, halo: false });
  });
  return y0 - Math.max(1, Math.ceil(list.length / per)) * (h + 0.12);
}
/** Draw a mini cube (rotation R applied) in 2D at centre c with half-size r, using a fixed oblique view. */
function miniCube(v, s, R, c, r, o = {}) {
  const yaw = -0.62, pitch = 0.42, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const ex = [cy, -sy, 0], ey = [sy * sp, cy * sp, cp], ez = [sy * cp, cy * cp, -sp];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], kx = r / 1.75, ky = (r / 1.75) * (o.ky ?? 1);
  const P = (p) => { const q = ap3(R, p); return [c[0] + kx * dot(q, ex), c[1] + ky * dot(q, ey)]; };
  CUBE_F.forEach(([f, nrm], k) => {
    const N = ap3(R, nrm); if (dot(N, ez) >= -1e-9) return;
    s.poly(f.map((i) => P(CUBE_V[i])), { fill: o.faceCol ? o.faceCol(k) : EC[k], fillAlpha: o.alpha ?? 0.75, color: 'ink', width: 0.8, alpha: o.alpha != null ? o.alpha : 1 });
  });
  if (o.mark) { const q = ap3(R, o.mark), vis = dot(q, ez) < 0.2; s.dot(...P(o.mark), { r: o.markR ?? 3.4, color: 'gold', alpha: vis ? 1 : 0.35 }); }
}

export default {
  collection: 'alg',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Theorem',
      name: 'Parity of a permutation is well defined',
      statement: String.raw`If a permutation $\sigma$ can be written as a product of an even number of transpositions, then every way of writing $\sigma$ as a product of transpositions uses an even number of them; likewise for odd. So the parity of the number of transpositions depends only on $\sigma$.`,
      idea: String.raw`Suppose $\sigma=\sigma_1\cdots\sigma_m=\tau_1\cdots\tau_k$ with transpositions. Each $\sigma_i$ is its own inverse, so $\sigma^{-1}=\sigma_m\cdots\sigma_1$ and
$$\mathrm{id}=\sigma\sigma^{-1}=\tau_1\cdots\tau_k\,\sigma_m\cdots\sigma_1,$$
a product of $k+m$ transpositions. By Lemma 5.14, $k+m$ is even, so $k$ and $m$ have the same parity. A second, visual invariant agrees: in any wiring diagram of $\sigma$, two wires whose ends are in opposite order cross an odd number of times, and two others an even number, so the total number of crossings always has the parity of the number of inversions.`,
      caption: String.raw`Left: the wiring diagram of $\sigma$ — drag the handles on the wires to bend them. Crossings (gold) appear and disappear in pairs, so their parity never changes. Right: two different factorizations of $\sigma$ into transpositions; *Lengthen B* inserts a cancelling pair and shuffles B by valid rewrites. Lengths change, parities do not — and B followed by the reverse of A multiplies to the identity, an even product.`,
      deps: ['alg-5.14', 'alg-5.12'],
      see: ['comb-2.5', 'ladr-9.32'],
      refs: ['Judson §5.1'],
      tags: ['parity', 'transpositions'],
      viz(v) {
        const n = 5;
        let seed = 3, sig = fromCycles(n, [[1, 3, 5, 2]]), B = [];
        const resetB = () => { B = bubbleTranspositions(sig).map((t) => t.slice()); };
        resetB();
        const A = () => cycleTranspositions(sig).map((o) => [Math.min(...o.t), Math.max(...o.t)]);
        const s = v.stage({ x: [0.4, 5.6], y: [-0.55, 2.45], axes: false, height: 330, weight: 1.15 });
        const c = v.stage({ x: [0, 6], y: [0, 6], axes: false, height: 330, weight: 1 });
        const H = [];
        const place = () => { for (let i = 0; i < n; i++) H[i].set((i + 1 + sig[i] + 1) / 2, 1); };
        for (let i = 0; i < n; i++) H.push(s.handle(0, 1, { color: beadCol(v, i), r: 6, constrain: (x, y) => [clamp(x, 0.5, 5.5), clamp(y, 0.12, 1.88)] }));
        place();
        // bend two wires a little so the picture starts non-straight
        H[0].set(3.9, 1.35); H[2].set(1.4, 0.75);
        v.button('Shuffle σ', () => { seed++; sig = shuffled(v, n, 40 + seed); resetB(); place(); });
        v.button('Straighten', () => place());
        v.button('Lengthen B', () => {
          const r = v.rng(900 + B.length * 7 + seed), a = Math.floor(r() * n); let b = Math.floor(r() * (n - 1)); if (b >= a) b++;
          const pos = Math.floor(r() * (B.length + 1)), t = [Math.min(a, b), Math.max(a, b)];
          B.splice(pos, 0, t.slice(), t.slice());
          for (let k = 0; k < 4 && B.length > 1; k++) {
            const i = Math.floor(r() * (B.length - 1)), x = B[i], y = B[i + 1], before = productOf(B, n), shared = x.filter((e) => y.includes(e));
            let nx, ny;
            if (shared.length === 0) { nx = y; ny = x; } else if (shared.length === 1) { const sh = shared[0], cc = x[0] === sh ? x[1] : x[0], tt = y[0] === sh ? y[1] : y[0]; if (r() < 0.5) { nx = [tt, cc]; ny = [sh, cc]; } else { nx = [sh, tt]; ny = [tt, cc]; } } else continue;
            const old = [B[i], B[i + 1]]; B[i] = [Math.min(...nx), Math.max(...nx)]; B[i + 1] = [Math.min(...ny), Math.max(...ny)];
            if (!same(productOf(B, n), before)) { B[i] = old[0]; B[i + 1] = old[1]; }
          }
        });
        v.button('Reset B', () => resetB());
        const curves = () => {
          const W = [];
          for (let i = 0; i < n; i++) {
            const P0 = [i + 1, 2], P2 = [sig[i] + 1, 0], Hm = [H[i].x, H[i].y], C = [2 * Hm[0] - (P0[0] + P2[0]) / 2, 2 * Hm[1] - (P0[1] + P2[1]) / 2], pts = [];
            for (let k = 0; k <= 48; k++) { const t = k / 48; pts.push([(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1]]); }
            W.push(pts);
          }
          return W;
        };
        const crossings = (W) => {
          const X = [];
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let a = 0; a < 48; a++) for (let b = 0; b < 48; b++) { const p = segX(W[i][a], W[i][a + 1], W[j][b], W[j][b + 1]); if (p) X.push(p); }
          return X;
        };
        v.render(() => {
          const W = curves(), X = crossings(W), inv = inversions(sig).length;
          W.forEach((pts, i) => s.path(pts, { color: beadCol(v, i), width: 3.2 }));
          X.forEach(([x, y]) => s.dot(x, y, { r: 4.2, color: 'gold' }));
          for (let i = 0; i < n; i++) { bead(v, s, i + 1, 2, i, { r: 12 }); bead(v, s, sig[i] + 1, 0, i, { r: 12 }); }
          s.corner(`${X.length} crossing${X.length === 1 ? '' : 's'} · ${X.length % 2 ? 'odd' : 'even'}`, 'tl', { size: 13, weight: 700, color: (X.length - inv) % 2 ? 'red' : 'green', plate: true });
          s.text(`inversions of σ: ${inv}`, 5.55, -0.42, { align: 'right', size: 11, color: 'muted' });
          // the two factorizations
          const a = A();
          c.text(`A — from the cycles: ${a.length} (${a.length % 2 ? 'odd' : 'even'})`, 0.15, 5.75, { align: 'left', size: 12, weight: 700, color: 'blue' });
          let y = chips(c, a, 0.15, 5.5, { color: () => 'blue', per: 8, w: 0.64 });
          c.text(`B — another way: ${B.length} (${B.length % 2 ? 'odd' : 'even'})`, 0.15, y - 0.12, { align: 'left', size: 12, weight: 700, color: 'orange' });
          y = chips(c, B, 0.15, y - 0.37, { color: () => 'orange', per: 8, w: 0.64 });
          const chain = B.concat(a.slice().reverse());
          c.text(`B · A⁻¹ = id: ${chain.length} factors (even ${chain.length % 2 ? '✗' : '✓'})`, 0.15, y - 0.12, { align: 'left', size: 12, weight: 700, color: 'green' });
          chips(c, chain, 0.15, y - 0.37, { color: (k) => (k < B.length ? 'orange' : 'blue'), per: 8, w: 0.64, size: 10.5, h: 0.36 });
        });
        v.readout(() => {
          const X = crossings(curves()).length, inv = inversions(sig).length, a = A(), pa = productOf(a, n), pb = productOf(B, n), id = productOf(B.concat(a.slice().reverse()), n);
          return String.raw`$\sigma = ${cycTex(sig)}$ is **${par(sig)}**. Crossings ${X} ≡ inversions ${inv} ≡ $|A| = ${a.length}$ ≡ $|B| = ${B.length}$ (mod 2) ${[X, inv, a.length, B.length].every((k) => k % 2 === inv % 2) ? '✓' : '✗'}. Both products equal $\sigma$: A ${same(pa, sig) ? '✓' : '✗'}, B ${same(pb, sig) ? '✓' : '✗'}; and $B\cdot A^{-1} = ${cycTex(id)}$ ${isId(id) ? '✓' : '✗'} with $|A| + |B| = ${a.length + B.length}$ factors, even by Lemma 5.14.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.15a
    {
      num: '5.15a',
      kind: 'Definition',
      name: 'Even and odd permutations; the alternating group Aₙ',
      statement: String.raw`A permutation is **even** if it is a product of an even number of transpositions and **odd** if it is a product of an odd number; by Theorem 5.15 every permutation is exactly one of the two. The set of even permutations in $S_n$ is the **alternating group on $n$ letters**, $A_n$. (Equivalently: a cycle of length $k$ has the parity of $k-1$, so $\sigma$ is even exactly when it has an even number of cycles of even length.)`,
      idea: String.raw`Parity multiplies like signs: if $\sigma$ uses $a$ transpositions and $\tau$ uses $b$, then $\sigma\tau$ uses $a+b$, so even·even and odd·odd are even while mixed products are odd. Sorting the elements of $S_n$ with the evens first therefore turns its Cayley table into four blocks — the even block is closed under products, which is why $A_n$ will be a subgroup (5.16). For $n=4$ the twelve even permutations are the identity, the three products of two disjoint transpositions, and the eight 3-cycles.`,
      caption: String.raw`The full Cayley table of $S_3$ or $S_4$, each cell coloured by the parity of the product (blue even, orange odd). With *evens first* off, the elements are in dictionary order and the colours look scattered; switch it on and the table falls into four blocks, the top-left one being $A_n$. Click a cell to read the product.`,
      deps: ['alg-5.15'],
      refs: ['Judson §5.1'],
      tags: ['parity', 'alternating group'],
      viz(v) {
        const N = v.select('$n$', [{ value: 3, label: '$S_3$' }, { value: 4, label: '$S_4$' }], 4, { onChange: () => { sel = [5, 7]; } });
        const srt = v.toggle('evens first', true);
        let sel = [5, 7];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, weight: 1.7 });
        const b = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, weight: 0.8, minWidth: 210 });
        const T = v.table(s, { rows: 6, cols: 6, maxCell: 60, minCell: 10, size: 12, margin: 6 });
        const B2 = v.table(b, { rows: 2, cols: 2, maxCell: 70, size: 13, region: [0, 0.35, 1, 0.95] });
        const data = (n, sorted) => { let P = allPerms(n); if (sorted) P = P.filter((p) => sign(p) > 0).concat(P.filter((p) => sign(p) < 0)); return P; };
        s.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.j >= 0) sel = [h.i, h.j]; });
        v.render(() => {
          const n = +N.value, P = data(n, srt.value), m = P.length, small = n === 3, [i0, j0] = sel.map((k) => Math.min(k, m - 1));
          T.draw({
            rows: m, cols: m, maxCell: small ? 54 : 16, size: small ? 11 : 8,
            rowLabels: small ? (i) => `$${cycTex(P[i])}$` : (i) => '', colLabels: small ? (j) => `$${cycTex(P[j])}$` : (j) => '',
            rowLabelColor: (i) => PCOL[par(P[i])], colLabelColor: (j) => PCOL[par(P[j])], labelSize: 10,
            value: small ? (i, j) => `$${cycTex(compose(P[i], P[j]))}$` : null,
            fill: (i, j) => [PCOL[par(compose(P[i], P[j]))], 0.5],
            highlight: [[i0, j0, 'gold']],
          });
          if (!small) {
            // parity strips beside the headers
            for (let k = 0; k < m; k++) {
              const [x0, y0, x1, y1] = T.cellRect(k, -1), [cx0, cy0, cx1, cy1] = T.cellRect(-1, k);
              s.rect(x0 + (x1 - x0) * 0.25, y0, x1 - (x1 - x0) * 0.1, y1, { fill: PCOL[par(P[k])], fillAlpha: 0.8, stroke: false });
              s.rect(cx0, cy0 + (cy1 - cy0) * 0.1, cx1, cy1 - (cy1 - cy0) * 0.25, { fill: PCOL[par(P[k])], fillAlpha: 0.8, stroke: false });
            }
          }
          if (srt.value) { const h = m / 2; T.box(0, 0, h - 1, h - 1, { color: 'green', width: 3 }); }
          // the parity rule
          const cnt = { ee: 0, eo: 0, oe: 0, oo: 0 };
          for (const p of P) for (const q of P) cnt[par(p)[0] + par(q)[0]] += par(compose(p, q)) === (par(p) === par(q) ? 'even' : 'odd') ? 1 : 0;
          B2.draw({ rows: 2, cols: 2, rowLabels: ['even', 'odd'], colLabels: ['even', 'odd'], cornerLabel: '$\\circ$', rowLabelColor: (i) => (i ? 'orange' : 'blue'), colLabelColor: (j) => (j ? 'orange' : 'blue'),
            value: (i, j) => ((i + j) % 2 ? 'odd' : 'even'), fill: (i, j) => [(i + j) % 2 ? 'orange' : 'blue', 0.45], sub: (i, j) => `${[cnt.ee, cnt.eo, cnt.oe, cnt.oo][2 * i + j]}✓` });
          b.text('parity of a product', 0.5, 0.25, { align: 'center', size: 12, weight: 700 });
          b.text('(each cell checked on every pair)', 0.5, 0.17, { align: 'center', size: 10.5, color: 'muted' });
        });
        v.readout(() => {
          const n = +N.value, P = data(n, srt.value), m = P.length, [i0, j0] = sel.map((k) => Math.min(k, m - 1)), p = P[i0], q = P[j0], pq = compose(p, q);
          const ev = P.filter((x) => sign(x) > 0).length;
          return String.raw`$${cycTex(p)}\cdot${cycTex(q)} = ${cycTex(pq)}$: ${par(p)} · ${par(q)} = **${par(pq)}**. $S_${n}$ has ${m} elements, ${ev} even and ${m - ev} odd; the ${ev} even ones form $A_${n}$${n === 4 ? ' — the identity, three double transpositions $(1\\,2)(3\\,4), (1\\,3)(2\\,4), (1\\,4)(2\\,3)$ and eight 3-cycles' : ' = $\\{(1), (1\\,2\\,3), (1\\,3\\,2)\\}$'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.16
    {
      num: '5.16',
      kind: 'Theorem',
      name: 'Aₙ is a subgroup of Sₙ',
      statement: String.raw`For every $n\ge 2$, the set $A_n$ of even permutations is a subgroup of $S_n$.`,
      idea: String.raw`Use the subgroup test (3.30). The identity is even ($(1\,2)(1\,2)$). If $\sigma$ and $\tau$ are products of $2a$ and $2b$ transpositions, then $\sigma\tau$ is a product of $2a+2b$, so $A_n$ is closed. And if $\sigma=\sigma_1\cdots\sigma_r$ with $r$ even, then $\sigma^{-1}=\sigma_r\cdots\sigma_1$ because each transposition is its own inverse — again $r$ factors. The odd permutations fail all three tests: no identity, and the product of two odd permutations is even.`,
      caption: String.raw`The table multiplies the chosen set with itself; rows are labelled in cycle notation, columns and cells in one-line notation ($2143$ means $1\mapsto2, 2\mapsto1, 3\mapsto4, 4\mapsto3$). Green cells stay in the set, red cells leave it. Click a cell: the right panel composes the two wiring diagrams, and the crossings add up — so parities add. Try the odd permutations, or only the 3-cycles.`,
      deps: ['alg-5.15a', 'alg-3.30'],
      refs: ['Judson §5.1'],
      tags: ['alternating group', 'subgroups'],
      viz(v) {
        const n = 4, A4 = [[], [[1, 2], [3, 4]], [[1, 3], [2, 4]], [[1, 4], [2, 3]], [[1, 2, 3]], [[1, 3, 2]], [[1, 2, 4]], [[1, 4, 2]], [[1, 3, 4]], [[1, 4, 3]], [[2, 3, 4]], [[2, 4, 3]]].map((c) => fromCycles(n, c));
        const ODD = allPerms(n).filter((p) => sign(p) < 0), THREE = [A4[0], ...A4.slice(4)];
        const SETS = { A4, odd: ODD, three: THREE };
        const which = v.select('set', [{ value: 'A4', label: '$A_4$ (even)' }, { value: 'odd', label: 'odd permutations' }, { value: 'three', label: '$(1)$ and the 3-cycles' }], 'A4', { onChange: () => { sel = [4, 6]; } });
        let sel = [4, 6];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 460, weight: 1.65 });
        const w = v.stage({ x: [0, 9.6], y: [-0.9, 3.0], axes: false, height: 460, weight: 1, minWidth: 240 });
        const T = v.table(s, { rows: 12, cols: 12, maxCell: 40, minCell: 12, size: 10, margin: 4, labelSize: 10 });
        s.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.j >= 0) sel = [h.i, h.j]; });
        v.render(() => {
          const H = SETS[which.value], m = H.length, keys = new Set(H.map(pkey)), [i0, j0] = sel.map((k) => Math.min(k, m - 1));
          T.draw({
            rows: m, cols: m, rowLabels: (i) => cycText(H[i]), colLabels: (j) => oneLine(H[j]), cornerLabel: '∘',
            value: (i, j) => oneLine(compose(H[i], H[j])),
            fill: (i, j) => [keys.has(pkey(compose(H[i], H[j]))) ? 'green' : 'red', isId(compose(H[i], H[j])) ? 0.5 : 0.22],
            highlight: [[i0, j0, 'gold']], activeRow: i0, activeCol: j0,
          });
          // composition of wiring diagrams: τ = column element first, then σ = row element
          const sg = H[i0], tu = H[j0], pr = compose(sg, tu), rows = arrangements(n, [tu, sg]);
          const X = (i, off) => off + i * 0.95;
          for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) wire(w, [X(i, 0.5), 2.4 - 1.2 * k], [X([tu, sg][k][i], 0.5), 1.2 - 1.2 * k], { color: beadCol(v, rows[k][i]), width: 3 });
          for (let k = 0; k <= 2; k++) for (let i = 0; i < n; i++) bead(v, w, X(i, 0.5), 2.4 - 1.2 * k, rows[k][i], { r: 10 });
          for (let i = 0; i < n; i++) wire(w, [X(i, 5.6), 2.4], [X(pr[i], 5.6), 0], { color: beadCol(v, i), width: 3 });
          for (let i = 0; i < n; i++) { bead(v, w, X(i, 5.6), 2.4, i, { r: 10 }); bead(v, w, X(pr[i], 5.6), 0, i, { r: 10 }); }
          const it = inversions(tu).length, is = inversions(sg).length, ip = inversions(pr).length;
          w.text(`τ: ${it}`, 4.0, 1.8, { align: 'left', size: 11.5, weight: 700, color: PCOL[par(tu)] });
          w.text(`σ: ${is}`, 4.0, 0.6, { align: 'left', size: 11.5, weight: 700, color: PCOL[par(sg)] });
          w.text(`στ: ${ip}`, 9.45, 1.2, { align: 'right', size: 11.5, weight: 700, color: PCOL[par(pr)] });
          w.text('=', 4.95, 1.2, { align: 'center', size: 18, color: 'muted' });
          w.text(`crossings ${it} + ${is} = ${it + is} ≡ ${ip} (mod 2)`, 4.8, -0.55, { align: 'center', size: 11.5, weight: 700, color: (it + is - ip) % 2 ? 'red' : 'green' });
          w.text('first τ (column), then σ (row)', 4.8, 2.82, { align: 'center', size: 11, color: 'muted' });
        });
        v.readout(() => {
          const H = SETS[which.value], m = H.length, keys = new Set(H.map(pkey)), [i0, j0] = sel.map((k) => Math.min(k, m - 1));
          let inside = 0; for (const p of H) for (const q of H) if (keys.has(pkey(compose(p, q)))) inside++;
          const hasE = H.some(isId), invOk = H.every((p) => keys.has(pkey(inverse(p))));
          const pr = compose(H[i0], H[j0]);
          const verdict = inside === m * m && hasE && invOk ? '**a subgroup** ✓' : '**not a subgroup** ✗';
          return String.raw`$\sigma\tau = ${cycTex(H[i0])}\,${cycTex(H[j0])} = ${cycTex(pr)}$ (${par(pr)}). Closure: ${inside} of ${m * m} products stay in the set; identity ${hasE ? '✓' : '✗'}; inverses ${invOk ? '✓' : '✗'} — ${verdict}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.17
    {
      num: '5.17',
      kind: 'Proposition',
      name: 'Aₙ has n!/2 elements',
      statement: String.raw`For $n\ge2$, $S_n$ contains as many even permutations as odd ones; hence $|A_n| = n!/2$.`,
      idea: String.raw`Fix a transposition $\sigma$ (one exists since $n\ge2$) and send each even $\tau$ to $\lambda_\sigma(\tau)=\sigma\tau$, which is odd. The map is one-to-one by cancellation (3.21): $\sigma\tau=\sigma\mu$ gives $\tau=\mu$. It is onto, because an odd $\mu$ is the image of the even permutation $\sigma\mu$ (recall $\sigma^2=\mathrm{id}$). A bijection between the evens and the odds shows that the two halves of $S_n$ have equal size, $n!/2$. Multiplying by an *even* $\sigma$ instead only shuffles the evens among themselves.`,
      caption: String.raw`Even permutations on the left, odd ones on the right. Each line joins $\tau$ to $\sigma\tau$ for the chosen $\sigma$: with a transposition every left tile gets exactly one partner and every right tile is hit once. Choose the 3-cycle $(1\,2\,3)$ — an even permutation — and the arrows stay inside the left column: no pairing. Click a tile to highlight its line.`,
      deps: ['alg-5.16', 'alg-5.1', 'alg-3.21'],
      refs: ['Judson §5.1'],
      tags: ['alternating group', 'counting', 'bijection'],
      viz(v) {
        const N = v.select('$n$', [{ value: 3, label: '$S_3$' }, { value: 4, label: '$S_4$' }], 4);
        const SG = { t12: [[1, 2]], t23: [[2, 3]], t34: [[3, 4]], c123: [[1, 2, 3]] };
        const which = v.select('$\\sigma$', [{ value: 't12', label: '$(1\\,2)$' }, { value: 't23', label: '$(2\\,3)$' }, { value: 't34', label: '$(3\\,4)$' }, { value: 'c123', label: '$(1\\,2\\,3)$ (even)' }], 't12');
        let pick = null;
        const s = v.stage({ x: [0, 10], y: [0, 13], axes: false, height: 460, full: true });
        const lists = (n) => { const P = allPerms(n); return [P.filter((p) => sign(p) > 0), P.filter((p) => sign(p) < 0)]; };
        const tile = (n, side, k) => { const m = fact(n) / 2, h = 12.2 / m; return [side === 0 ? 1.0 : 6.4, 12.6 - (k + 0.5) * h, h]; };
        s.onClick((x, y) => { const n = +N.value, m = fact(n) / 2; for (const side of [0, 1]) for (let k = 0; k < m; k++) { const [x0, yc, h] = tile(n, side, k); if (x >= x0 && x <= x0 + 2.6 && Math.abs(y - yc) < h / 2) { pick = [side, k]; return; } } pick = null; });
        v.render(() => {
          const n = +N.value, sg = fromCycles(n, which.value === 't34' && n === 3 ? [[1, 3]] : SG[which.value]), [E, O] = lists(n), m = E.length;
          const all = [E, O], find = (p) => { for (const side of [0, 1]) { const k = all[side].findIndex((q) => same(q, p)); if (k >= 0) return [side, k]; } return null; };
          const hitCount = [new Array(m).fill(0), new Array(m).fill(0)];
          const pairs = E.map((t, k) => { const img = find(compose(sg, t)); hitCount[img[0]][img[1]]++; return [k, img]; });
          // lines / arrows
          pairs.forEach(([k, [side2, k2]]) => {
            const [x0, y0, h] = tile(n, 0, k), [x1, y1] = tile(n, side2, k2), hl = pick && ((pick[0] === 0 && pick[1] === k) || (pick[0] === side2 && pick[1] === k2));
            const col = hl ? 'gold' : side2 === 1 ? 'green' : 'red', wd = hl ? 3.4 : 1.8, al = pick && !hl ? 0.25 : 0.85;
            if (side2 === 1) s.curve((t) => [x0 + 2.6 + (x1 - x0 - 2.6) * t, y0 + (y1 - y0) * (t * t * (3 - 2 * t))], 0, 1, { color: col, width: wd, alpha: al });
            else { const bulge = 0.5 + 0.18 * Math.abs(k2 - k) * h; s.curve((t) => [x0 - 0.08 - bulge * Math.sin(Math.PI * t), y0 + (y1 - y0) * t], 0, 1, { color: col, width: wd, alpha: al }); s.arrow(x0 - 0.08 - bulge * Math.sin(Math.PI * 0.9), y0 + (y1 - y0) * 0.9, x0 - 0.04, y1, { color: col, width: wd, head: 7, alpha: al }); }
          });
          for (const side of [0, 1]) for (let k = 0; k < m; k++) {
            const [x0, yc, h] = tile(n, side, k), p = all[side][k], sel = pick && pick[0] === side && pick[1] === k;
            s.rect(x0, yc - h * 0.42, x0 + 2.6, yc + h * 0.42, { radius: 5, fill: side ? 'orange' : 'blue', fillAlpha: sel ? 0.4 : 0.16, color: hitCount[side][k] > 1 ? 'red' : side ? 'orange' : 'blue', width: sel ? 2.4 : 1.2 });
            s.text(cycText(p), x0 + 0.12, yc, { align: 'left', size: n === 3 ? 13 : 11.5, weight: 700, halo: false });
            s.text(oneLine(p), x0 + 2.5, yc, { align: 'right', size: n === 3 ? 12 : 10, color: 'muted', halo: false });
          }
          s.text(`even: ${m}`, 2.3, 12.85, { align: 'center', size: 13, weight: 700, color: 'blue' });
          s.text(`odd: ${m}`, 7.7, 12.85, { align: 'center', size: 13, weight: 700, color: 'orange' });
          s.text(`τ ↦ ${cycText(sg)} τ`, 5.0, 12.85, { align: 'center', size: 12.5, weight: 700, color: 'ink' });
        });
        v.readout(() => {
          const n = +N.value, sg = fromCycles(n, which.value === 't34' && n === 3 ? [[1, 3]] : SG[which.value]), [E, O] = lists(n);
          const imgs = E.map((t) => compose(sg, t)), allOdd = imgs.every((p) => sign(p) < 0), inj = new Set(imgs.map(pkey)).size === E.length;
          const onto = allOdd && O.every((q) => imgs.some((p) => same(p, q)));
          const tab = [2, 3, 4, 5, 6, 7].map((k) => { const P = allPerms(k), e = P.filter((p) => sign(p) > 0).length; return `${k}: ${e}/${P.length - e}`; }).join(', ');
          const head = allOdd ? String.raw`$\lambda_\sigma$ sends every even $\tau$ to an odd one ✓, one-to-one ${inj ? '✓' : '✗'}, onto ${onto ? '✓' : '✗'}: so $|A_${n}| = |S_${n}\setminus A_${n}| = ${n}!/2 = ${fact(n) / 2}$.` : String.raw`$\sigma = ${cycTex(sg)}$ is even, so $\sigma\tau$ is even again: the map is a bijection of $A_${n}$ onto itself and says nothing about the odd half.`;
          return `${head} Even/odd counts by brute force, $n$ = ${tab}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.18a
    {
      num: '5.18a',
      kind: 'Definition',
      name: 'Dihedral group Dₙ',
      statement: String.raw`For $n\ge3$, the **dihedral group** $D_n$ is the group of rigid motions of a regular $n$-gon: the rotations and reflections of the plane that carry the polygon onto itself, under composition. Numbering the vertices $1,2,\dots,n$, each motion is recorded by the permutation of the vertex positions it produces, so $D_n$ sits inside $S_n$ as a permutation group.`,
      idea: String.raw`A rigid motion is determined by where it sends two adjacent vertices, and it must keep adjacent vertices adjacent; this is what makes it a symmetry rather than an arbitrary shuffle. For the square with vertices $1,2,3,4$ (Judson’s example), the rotations are $r=(1\,2\,3\,4)$, $r^2=(1\,3)(2\,4)$, $r^3=(1\,4\,3\,2)$ and the identity, and the four flips are $(2\,4)$, $(1\,3)$, $(1\,2)(3\,4)$ and $(1\,4)(2\,3)$ — eight of the $24$ permutations of $S_4$. $D_3$ is the symmetry group of the triangle from Chapter 3, which is all of $S_3$.`,
      caption: String.raw`A cardboard $n$-gon (blue face up, orange face down). Rotate it with the buttons, or click a dashed axis to flip the card over that axis. The list on the right names every symmetry in Judson’s form $r^k$ or $r^ks$ with its cycle notation; the ones you have reached are filled in and the current one is gold. Click an entry to move straight there.`,
      deps: ['alg-3.5a', 'alg-5.1'],
      refs: ['Judson §5.2'],
      tags: ['dihedral group', 'symmetry'],
      viz(v) {
        let G = dihedralJ(5), g = 0, seen = new Set([0]), anim = null;
        const N = v.slider('$n$', 3, 8, 5, { int: true, onChange: (k) => { G = dihedralJ(k); g = 0; seen = new Set([0]); anim = null; } });
        void N;
        const go = (m) => { const n = G.m; anim = { from: g, m }; g = G.T[m][g]; seen.add(g); v.t = 0; v.play(); void n; };
        v.button('↻ rotate r', () => go(1));
        v.button('↺ rotate r⁻¹', () => go(G.m - 1));
        v.button('flip s', () => go(G.m));
        const s = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 380 });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 230 });
        s.onClick((x, y) => {
          const n = G.m; if (Math.hypot(x, y) < 0.15) return;
          let best = -1, bd = 0.25;
          for (let k = 0; k < n; k++) { const ax = axisOf(G.mat[n + k]); const d = Math.abs(x * ax[1] - y * ax[0]); if (d < bd) { bd = d; best = n + k; } }
          if (best >= 0) go(best);
        });
        const rowY = (k, n) => 0.9 - (k * 0.84) / Math.max(n - 1, 1);
        L.onClick((x, y) => { const n = G.m; for (let k = 0; k < n; k++) if (Math.abs(y - rowY(k, n)) < 0.42 / n) { const tgt = x < 0.5 ? k : n + k; go(G.T[tgt][G.inv[g]]); return; } });
        v.animate((tt) => {
          const n = G.m, u = anim ? clamp(tt / 0.8, 0, 1) : 1;
          const M = anim && u < 1 ? mm(partial(G.mat[anim.m], u), G.mat[anim.from]) : G.mat[g];
          // axes of the n reflections (fixed in the plane)
          for (let k = 0; k < n; k++) { const ax = axisOf(G.mat[n + k]), act = anim && u < 1 && anim.m === n + k; s.line(-1.5 * ax[0], -1.5 * ax[1], 1.5 * ax[0], 1.5 * ax[1], { color: act ? 'gold' : 'faint', width: act ? 2.2 : 1.2, dash: [6, 5] }); }
          drawFigure(v, s, M, G.pos, { names: Array.from({ length: n }, (_, k) => String(k + 1)), R: 1, lab: 0.2, size: 15 });
          s.corner(`current: ${dlabel(g, n)}`, 'tl', { size: 13, weight: 700, plate: true });
          // the list
          for (let k = 0; k < n; k++) for (const half of [0, 1]) {
            const j = half * n + k, y = rowY(k, n), x0 = half ? 0.51 : 0.01, on = seen.has(j), cur = j === g;
            L.rect(x0, y - 0.38 / n, x0 + 0.48, y + 0.38 / n, { radius: 5, fill: cur ? 'gold' : half ? 'orange' : 'blue', fillAlpha: cur ? 0.35 : on ? 0.15 : 0.03, color: cur ? 'gold' : on ? (half ? 'orange' : 'blue') : 'faint', width: cur ? 2 : 1 });
            L.text(on ? `$${G.L[j]} = ${cycTex(G.perms[j])}$` : `$${G.L[j]}$`, x0 + 0.03, y, { align: 'left', size: n > 6 ? 10 : 11.5, color: on ? 'ink' : 'muted' });
          }
          L.text('rotations', 0.25, 0.985, { align: 'center', size: 11, weight: 700, color: 'blue' });
          L.text('reflections', 0.75, 0.985, { align: 'center', size: 11, weight: 700, color: 'orange' });
        }, { period: 0.8, once: true, autoplay: false, still: 0.8 });
        v.readout(() => {
          const n = G.m;
          return String.raw`Current symmetry $${G.L[g]} = ${twoRow(G.perms[g])} = ${cycTex(G.perms[g])}$ — a ${g < n ? `rotation by ${(360 * g) / n}°` : 'reflection'}. Reached ${seen.size} of the ${2 * n} symmetries; $D_${n}$ uses ${2 * n} of the ${fact(n)} permutations in $S_${n}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.20
    {
      num: '5.20',
      kind: 'Theorem',
      name: 'Dₙ is a subgroup of Sₙ of order 2n',
      statement: String.raw`For $n\ge3$, the dihedral group $D_n$ is a subgroup of $S_n$ of order $2n$.`,
      idea: String.raw`A motion of the $n$-gon is determined by the images of vertices $1$ and $2$. Vertex $1$ can go to any of the $n$ positions, say $k$. Vertex $2$ is adjacent to vertex $1$ and must stay adjacent, so it goes to $k+1$ or $k-1$ — two choices, after which every other vertex is forced. That gives at most $2n$ motions, and all of them occur: the $n$ rotations and $n$ reflections. Composites and inverses of symmetries are symmetries, so these $2n$ permutations form a subgroup of $S_n$.`,
      caption: String.raw`Drag the handles to choose where vertex 1 and vertex 2 go (they snap to the corners). If 2 lands next to 1, the card can be moved there and the rest of the vertices follow (green); anywhere else the edge 12 would have to stretch (red). The gallery lists all $2n$ placements: columns by where 1 goes, top row with 2 one step clockwise (rotations), bottom row one step counter-clockwise (reflections). Click a tile to jump to it.`,
      deps: ['alg-5.18a', 'alg-3.23a'],
      refs: ['Judson §5.2'],
      tags: ['dihedral group', 'counting'],
      viz(v) {
        let G = dihedralJ(6);
        const N = v.slider('$n$', 3, 8, 6, { int: true, onChange: (k) => { G = dihedralJ(k); h1.set(...G.pos[2]); h2.set(...G.pos[1]); } });
        void N;
        const s = v.stage({ x: [-1.55, 1.55], y: [-1.5, 1.6], equal: true, axes: false, height: 360, weight: 1 });
        const gl = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.25 });
        const snap = (x, y) => { let b = 0, bd = 1e9; G.pos.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = i; } }); return [G.pos[b][0] * 1, G.pos[b][1] * 1]; };
        const h1 = s.handle(...G.pos[2], { color: 'blue', label: '1', constrain: snap, r: 9 }), h2 = s.handle(...G.pos[1], { color: 'orange', label: '2', constrain: snap, r: 9 });
        const idxOf = (h) => { let b = 0, bd = 1e9; G.pos.forEach((p, i) => { const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d < bd) { bd = d; b = i; } }); return b; };
        const cell = (n, j) => { const col = j % n, row = j >= n ? 1 : 0, w = 1 / n; return [w * (col + 0.5), row ? 0.27 : 0.7, w]; };
        gl.onClick((x, y) => { const n = G.m; for (let j = 0; j < 2 * n; j++) { const [cx, cy, w] = cell(n, j); if (Math.abs(x - cx) < w / 2 && Math.abs(y - cy) < 0.2) { const p = G.perms[j]; h1.set(...G.pos[p[0]]); h2.set(...G.pos[p[1]]); } } });
        v.render(() => {
          const n = G.m, a = idxOf(h1), b = idxOf(h2), d = ((b - a) % n + n) % n, ok = d === 1 || d === n - 1;
          const j = ok ? (d === 1 ? a : n + a) : -1;
          if (ok) drawFigure(v, s, G.mat[j], G.pos, { names: Array.from({ length: n }, (_, k) => String(k + 1)), R: 1, lab: 0.22, front: 'green', back: 'green' });
          else {
            s.poly(G.pos, { color: 'muted', width: 1.4, dash: [5, 4], fill: false });
            const L0 = Math.hypot(G.pos[0][0] - G.pos[1][0], G.pos[0][1] - G.pos[1][1]), L1 = Math.hypot(G.pos[a][0] - G.pos[b][0], G.pos[a][1] - G.pos[b][1]);
            if (a !== b) { s.line(...G.pos[a], ...G.pos[b], { color: 'red', width: 3.5, dash: [8, 5] }); s.text(`edge 12 would have length ${v.fix(L1, 2)} (it is ${v.fix(L0, 2)})`, 0, -1.42, { align: 'center', size: 11.5, color: 'red', weight: 700 }); }
            else s.text('two vertices cannot share a corner', 0, -1.42, { align: 'center', size: 11.5, color: 'red', weight: 700 });
            for (const q of [(a + 1) % n, (a + n - 1) % n]) s.dot(...G.pos[q], { r: 15, hollow: true, color: 'green', width: 2.4 });
          }
          s.corner(ok ? `rigid motion ${dlabel(j, n)} ✓` : 'not a rigid motion ✗', 'tl', { size: 13, weight: 700, color: ok ? 'green' : 'red', plate: true });
          // gallery
          for (let k = 0; k < 2 * n; k++) {
            const [cx, cy, w] = cell(n, k), R = Math.min(w * 0.36, 0.12), M = G.mat[k], cur = k === j;
            const pts = G.pos.map((p) => { const q = [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]]; return [cx + R * q[0] * (gl.height / gl.width), cy + R * q[1]]; });
            if (cur) gl.rect(cx - w / 2 + 0.004, cy - 0.2, cx + w / 2 - 0.004, cy + 0.2, { radius: 6, fill: 'gold', fillAlpha: 0.18, color: 'gold', width: 2 });
            gl.poly(pts, { fill: k < n ? 'blue' : 'orange', fillAlpha: 0.18, color: k < n ? 'blue' : 'orange', width: 1.4 });
            pts.forEach(([x, y], i) => { if (i < 2) gl.text(String(i + 1), x, y, { align: 'center', size: 10.5, weight: 700, color: i ? 'orange' : 'blue' }); });
            gl.text(dlabel(k, n), cx, cy - 0.165, { align: 'center', size: 10.5, color: 'muted' });
          }
          for (let col = 0; col < n; col++) gl.text(`1→${col + 1}`, (col + 0.5) / n, 0.96, { align: 'center', size: 10.5, weight: 700, color: 'muted' });
          gl.text('2 → next clockwise', 0.01, 0.5 + 0.005, { align: 'left', size: 10, color: 'blue' });
          gl.text('2 → next counter-clockwise', 0.01, 0.06, { align: 'left', size: 10, color: 'orange' });
        });
        v.readout(() => {
          const n = G.m, a = idxOf(h1), b = idxOf(h2), d = ((b - a) % n + n) % n, ok = d === 1 || d === n - 1;
          let closed = true; for (const row of G.T) for (const x of row) if (x == null) closed = false;
          const invOk = G.inv.every((x) => x >= 0);
          return `${ok ? `Vertex 1 → ${a + 1}, vertex 2 → ${b + 1}: the motion ${String.raw`$${G.L[ok ? (d === 1 ? a : n + a) : 0]} = ${cycTex(G.perms[d === 1 ? a : n + a])}$`}.` : `Vertex 2 must go to ${(a + 1) % n + 1} or ${(a + n - 1) % n + 1}.`} Count: ${n} places for vertex 1 × 2 for vertex 2 = ${2 * n} = $|D_${n}|$. The ${2 * n} permutations are closed under composition ${closed ? '✓' : '✗'} and inverses ${invOk ? '✓' : '✗'}: a subgroup of $S_${n}$ (order ${fact(n)}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.21
    {
      num: '5.21',
      kind: 'Theorem',
      name: 'Dₙ is generated by r and s with srs = r⁻¹',
      statement: String.raw`For $n\ge3$, $D_n$ consists of all products of two elements $r$ and $s$, where $r$ (the rotation by $360^\circ/n$) has order $n$, $s$ (a reflection) has order $2$, and
$$srs=r^{-1}.$$
Hence $D_n=\{1, r, r^2,\dots,r^{n-1}, s, rs, r^2s,\dots,r^{n-1}s\}$.`,
      idea: String.raw`The rotations are the powers of $r$. A motion $t$ that sends vertex $1$ to position $k+1$ is $r^k$ if it keeps the orientation (vertex $2$ follows clockwise) and $r^ks$ if it flips the card. So $r$ and $s$ generate. The relation: $s$ reverses the sense of rotation, so flipping, turning clockwise and flipping back is a counter-clockwise turn, $srs=r^{-1}$; equivalently $sr^k=r^{-k}s$. With it, any word in $r$ and $s$ can be pushed into the normal form $r^ks^\varepsilon$ ($0\le k<n$, $\varepsilon\in\{0,1\}$), which is how the group table is computed.`,
      caption: String.raw`Press $r$ and $s$ to build a word; the card acts it out and the readout rewrites the word into the form $r^k$ or $r^ks$ using $sr^k=r^{-k}s$. *Act out srs* performs $s$, $r$, $s$ in turn and compares with $r^{-1}$. Click any cell of the table to see that product performed (column first, then row); the table fills in as you go.`,
      deps: ['alg-5.20', 'alg-4.4a'],
      refs: ['Judson §5.2'],
      tags: ['dihedral group', 'generators', 'relations'],
      viz(v) {
        let G = dihedralJ(6), word = [], g = 0, anim = null, filled = new Set(), last = '';
        const N = v.slider('$n$', 3, 8, 6, { int: true, onChange: (k) => { G = dihedralJ(k); word = []; g = 0; anim = null; filled = new Set(); last = ''; } });
        void N;
        const nf = (k, e) => { const n = G.m; k = ((k % n) + n) % n; return e ? k + n : k; };
        const run = (ms, from) => { anim = { from, ms }; v.t = 0; v.play(); };
        const press = (ch) => {
          const n = G.m, k = g % n, e = g >= n ? 1 : 0, m = ch === 'r' ? 1 : n, ng = G.T[m][g];
          filled.add(`${m},${g}`);
          last = ch === 'r' ? String.raw`r\cdot ${G.L[g]} = ${G.L[ng]}` : e === 0 ? String.raw`s\cdot ${G.L[g]} = ${k ? `r^{-${k}}s` : 's'} = ${G.L[ng]}` : String.raw`s\cdot ${G.L[g]} = ${k ? `r^{-${k}}ss` : 'ss'} = ${G.L[ng]}`;
          void nf; word.push(ch); run([m], g); g = ng;
        };
        v.button('r', () => press('r'));
        v.button('s', () => press('s'));
        v.button('Clear word', () => { word = []; g = 0; anim = null; last = ''; });
        v.button('Act out srs', () => { const n = G.m; word = ['s', 'r', 's']; run([n, 1, n], 0); g = G.T[n][G.T[1][n]]; last = String.raw`srs = s\cdot rs = s\,r\,s = r^{-1}ss = r^{-1} = ${G.L[g]}`; filled.add(`${n},${G.T[1][n]}`); });
        v.button('Fill table', () => { const n = 2 * G.m; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) filled.add(`${a},${b}`); });
        const s = v.stage({ x: [-1.5, 1.5], y: [-1.55, 1.55], equal: true, axes: false, height: 380 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380 });
        const T = v.table(t, { rows: 12, cols: 12, maxCell: 34, minCell: 12, size: 10, margin: 4, labelSize: 10 });
        t.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0 && h.j >= 0) { filled.add(`${h.i},${h.j}`); word = []; run([h.i], h.j); g = G.T[h.i][h.j]; last = String.raw`${G.L[h.i]}\cdot ${G.L[h.j]} = ${G.L[g]}`; } });
        v.animate((tt) => {
          const n = G.m, DUR = 0.75;
          let M = G.mat[g], act = -1;
          if (anim) {
            const k = Math.floor(tt / DUR), u = tt / DUR - k;
            if (k < anim.ms.length) { M = G.mat[anim.from]; for (let q = 0; q < k; q++) M = mm(G.mat[anim.ms[q]], M); M = mm(partial(G.mat[anim.ms[k]], u), M); act = anim.ms[k]; }
          }
          s.poly(G.pos, { color: 'muted', width: 1.2, dash: [5, 4], fill: false });
          if (act >= n) { const ax = axisOf(G.mat[act]); s.line(-1.45 * ax[0], -1.45 * ax[1], 1.45 * ax[0], 1.45 * ax[1], { color: 'gold', width: 2, dash: [6, 5] }); }
          const done = anim && word.join('') === 'srs' && tt >= 3 * DUR;
          if (done) { const R1 = G.mat[n - 1]; s.poly(G.pos.map((p) => [1.12 * (R1[0][0] * p[0] + R1[0][1] * p[1]), 1.12 * (R1[1][0] * p[0] + R1[1][1] * p[1])]), { color: 'green', width: 2, dash: [3, 4], fill: false }); }
          drawFigure(v, s, M, G.pos, { names: Array.from({ length: n }, (_, k) => String(k + 1)), R: 1, lab: 0.21, outline: false });
          s.corner(word.length ? `word: ${word.join(' then ')}` : 'press r or s', 'tl', { size: 12.5, weight: 700, plate: true });
          if (done) s.corner(`srs = r⁻¹ ✓ (green outline: r⁻¹)`, 'bl', { size: 12, weight: 700, color: 'green', plate: true });
          T.draw({
            rows: 2 * n, cols: 2 * n, rowLabels: (i) => `$${G.L[i]}$`, colLabels: (j) => `$${G.L[j]}$`, cornerLabel: '$\\circ$',
            value: (i, j) => (filled.has(`${i},${j}`) ? `$${G.L[G.T[i][j]]}$` : null),
            fill: (i, j) => (filled.has(`${i},${j}`) ? [G.T[i][j] < n ? 'blue' : 'orange', G.T[i][j] === g ? 0.5 : 0.2] : null),
          });
          t.corner(`${filled.size} of ${4 * n * n} filled`, 'bl', { size: 11, color: 'muted' });
        }, { period: 2.4, once: true, autoplay: false, still: 2.4 });
        // start with a short word already acted out
        press('r'); press('r'); press('s');
        v.readout(() => {
          const n = G.m;
          return String.raw`Word (letters in the order pressed, so it is written right to left): $${word.length ? word.slice().reverse().join('') : '1'}$. Last step: $${last || '1'}$. Current element $${G.L[g]} = ${cycTex(G.perms[g])}$. Orders: $|r| = ${n}$, $|s| = 2$, and $srs = ${G.L[G.T[n][G.T[1][n]]]} = r^{-1}$ ${G.T[n][G.T[1][n]] === n - 1 ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.26
    {
      num: '5.26',
      kind: 'Proposition',
      name: 'The cube has 24 rotations',
      statement: String.raw`The group of rigid motions (rotations) of a cube has exactly $24$ elements.`,
      idea: String.raw`A rotation is determined by which face ends up on top and how the cube is then turned about the vertical axis. Any of the $6$ faces can be brought to the top, and with a given face on top there are exactly $4$ quarter-turns that keep it there, so there are $6\cdot4=24$ rotations. The same count comes out of any other feature: a vertex can go to any of $8$ corners and then be turned $3$ ways, an edge to any of $12$ edges in $2$ ways — $8\cdot3=12\cdot2=24$. (This is the orbit–stabilizer counting of Chapter 14.)`,
      caption: String.raw`Turn the cube with the quarter-turn buttons (about the fixed $x$, $y$, $z$ axes) or drag the background to change your view. The gold mark sits on one face (or vertex, or edge). The grid sorts the 24 positions: columns by where the mark is, rows by the remaining turn; every new position you reach fills its tile. Click a tile to rotate there. Change *count by* to sort the same 24 positions as 8 × 3 or 12 × 2.`,
      deps: ['alg-3.5a'],
      refs: ['Judson §5.2'],
      tags: ['symmetry', 'cube', 'counting'],
      viz(v) {
        const GR = cubeGroup(), idx = new Map(GR.map((R, i) => [mkey(R), i]));
        const MODES = { face: { p: [0, 0, 1], q: [1, 0, 0], cols: 6, rows: 4 }, vertex: { p: [1, 1, 1], q: [1, 1, -1], cols: 8, rows: 3 }, edge: { p: [1, 1, 0], q: [1, 1, 1], cols: 12, rows: 2 } };
        const mode = v.select('count by', [{ value: 'face', label: 'faces 6 × 4' }, { value: 'vertex', label: 'vertices 8 × 3' }, { value: 'edge', label: 'edges 12 × 2' }], 'face');
        let R = I3, anim = null, seen = new Set([0]), seed = 1;
        const turn = (axis) => { const A = round3(rot3(axis, Math.PI / 2)); anim = { R0: R, axis, ang: Math.PI / 2 }; R = mat3(A, R); seen.add(idx.get(mkey(R))); v.t = 0; v.play(); };
        v.button('turn x', () => turn([1, 0, 0]));
        v.button('turn y', () => turn([0, 1, 0]));
        v.button('turn z', () => turn([0, 0, 1]));
        v.button('Random', () => { const r = v.rng(++seed), k = Math.floor(r() * 24); goTo(k); });
        const goTo = (k) => {
          const D = mat3(GR[k], [[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]]); // GR[k]·Rᵀ
          const tr = D[0][0] + D[1][1] + D[2][2], ang = Math.acos(clamp((tr - 1) / 2, -1, 1));
          let axis = [D[2][1] - D[1][2], D[0][2] - D[2][0], D[1][0] - D[0][1]];
          if (Math.hypot(...axis) < 1e-6) { if (ang < 1e-6) { R = GR[k]; return; } const B = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (D[i][j] + (i === j ? 1 : 0)) / 2)); axis = B.reduce((best, col, j) => { const c = [B[0][j], B[1][j], B[2][j]]; return Math.hypot(...c) > Math.hypot(...best) ? c : best; }, [0, 0, 0]); }
          anim = { R0: R, axis, ang }; R = GR[k]; seen.add(k); v.t = 0; v.play();
        };
        const s = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380 });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.42, axis: 1.9, labels: ['x', 'y', 'z'] });
        const g = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.15 });
        // the grid: columns by the location of p, rows by the location of q among its possibilities
        const layout = (md) => {
          const { p, q } = MODES[md], locs = [], cell = new Array(24);
          const kp = (x) => x.map((c) => Math.round(c)).join(',');
          GR.forEach((A) => { const k = kp(ap3(A, p)); if (!locs.includes(k)) locs.push(k); });
          const byLoc = locs.map(() => []);
          GR.forEach((A, i) => { const c = locs.indexOf(kp(ap3(A, p))); byLoc[c].push([kp(ap3(A, q)), i]); });
          byLoc.forEach((arr, c) => { arr.sort((a, b) => (a[0] < b[0] ? -1 : 1)); arr.forEach(([, i], r) => { cell[i] = [c, r]; }); });
          return { cell, locs };
        };
        const geo = (md, i, L) => { const { cols, rows } = MODES[md], [c, r] = L.cell[i], w = 0.98 / cols, h = 0.86 / rows; return [0.01 + w * (c + 0.5), 0.86 - h * (r + 0.5), w, h]; };
        g.onClick((x, y) => { const md = mode.value, L = layout(md); for (let i = 0; i < 24; i++) { const [cx, cy, w, h] = geo(md, i, L); if (Math.abs(x - cx) < w / 2 && Math.abs(y - cy) < h / 2) { goTo(i); return; } } });
        const FACE_NAMES = { '1,0,0': '+x', '-1,0,0': '−x', '0,1,0': '+y', '0,-1,0': '−y', '0,0,1': 'top', '0,0,-1': 'bottom' };
        v.animate((tt) => {
          const md = mode.value, u = anim ? clamp(tt / 0.7, 0, 1) : 1, Rd = anim && u < 1 ? mat3(rot3(anim.axis, anim.ang * u), anim.R0) : R;
          sc.begin();
          const ez = sc.P([0, 0, 0]); void ez;
          CUBE_F.forEach(([f, nrm], k) => {
            const N3 = ap3(Rd, nrm), front = sc.P(N3)[2] < 0;
            sc.poly(f.map((i) => ap3(Rd, CUBE_V[i])), { fill: EC[k], fillAlpha: front ? 0.62 : 0.06, color: 'ink', width: 1.2, alpha: front ? 0.9 : 0.25 });
          });
          const { p, q } = MODES[md];
          sc.dot(ap3(Rd, p.map((c) => c * 1.01)), { r: 8, color: 'gold' }); sc.dot(ap3(Rd, q.map((c) => c * 1.01)), { r: 4.5, color: 'ink' });
          if (anim && u < 1) sc.line(anim.axis.map((c) => (-2 * c) / Math.hypot(...anim.axis)), anim.axis.map((c) => (2 * c) / Math.hypot(...anim.axis)), { color: 'gold', width: 2, dash: [6, 4] });
          sc.flush();
          s.corner(`${seen.size} / 24 positions found`, 'tl', { size: 12.5, weight: 700, plate: true });
          // grid of mini cubes
          const L = layout(md), { cols, rows } = MODES[md], cur = idx.get(mkey(R));
          for (let i = 0; i < 24; i++) {
            const [cx, cy, w, h] = geo(md, i, L), on = seen.has(i);
            g.rect(cx - w / 2 + 0.003, cy - h / 2 + 0.004, cx + w / 2 - 0.003, cy + h / 2 - 0.004, { radius: 5, fill: i === cur ? 'gold' : 'faint', fillAlpha: i === cur ? 0.25 : 0.05, color: i === cur ? 'gold' : 'faint', width: i === cur ? 2 : 0.8 });
            if (on) miniCube(v, g, GR[i], [cx, cy], Math.min(w * (g.width / g.height), h) * 0.36, { mark: p, ky: g.width / g.height, markR: cols > 8 ? 2.6 : 3.4 }); else g.text('?', cx, cy, { align: 'center', size: 12, color: 'faint' });
          }
          for (let c = 0; c < cols; c++) { const key = L.locs[c], lab = md === 'face' ? FACE_NAMES[key] : String(c + 1); g.text(lab, 0.01 + (0.98 / cols) * (c + 0.5), 0.92, { align: 'center', size: cols > 8 ? 9.5 : 11, weight: 700, color: 'muted' }); }
          g.text(`${cols} places for the gold ${md} × ${rows} turns`, 0.5, 0.975, { align: 'center', size: 11.5, weight: 700, color: 'ink' });
        }, { period: 0.7, once: true, autoplay: false, still: 0.7 });
        // a few positions found already
        [[0, 0, 1], [1, 0, 0], [0, 0, 1]].forEach((a) => { R = mat3(round3(rot3(a, Math.PI / 2)), R); seen.add(idx.get(mkey(R))); });
        v.readout(() => {
          const det = (A) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
          const md = mode.value, { cols, rows } = MODES[md];
          return String.raw`Closing the three quarter-turns under composition gives **${GR.length}** distinct rotation matrices, all with determinant ${GR.every((A) => det(A) === 1) ? '$+1$ ✓' : '±1'}; $6\cdot4 = 8\cdot3 = 12\cdot2 = 24$. Sorted by ${md}s: ${cols} × ${rows} = ${cols * rows} ✓. You have reached ${seen.size} of them.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.27
    {
      num: '5.27',
      kind: 'Theorem',
      name: 'The rotation group of a cube is S₄',
      statement: String.raw`The group of rotations of a cube is isomorphic to $S_4$: each rotation permutes the four long diagonals of the cube, and this gives a one-to-one correspondence between the $24$ rotations and the $24$ permutations of the diagonals that respects composition.`,
      idea: String.raw`Every rotation carries diagonals to diagonals, so it permutes the four of them, and composing rotations composes these permutations. Both groups have $24$ elements (5.26), so it suffices to show every permutation of the diagonals occurs. A half-turn about the axis through the midpoints of two opposite edges swaps the two diagonals that meet those edges and fixes the other two — a transposition — and the six such axes give all six transpositions. Since every permutation is a product of transpositions (5.12), every element of $S_4$ is realised, and $24=24$ makes the correspondence a bijection. (In Chapter 9 language: an isomorphism.)`,
      caption: String.raw`The four long diagonals are coloured and numbered at both ends (Judson’s labelling: $1,2,3,4$ on top, $3,4,1,2$ below). Pick an axis — through face centres, edge midpoints or opposite corners — and turn; the readout gives the permutation of the diagonals. Every edge half-turn is a transposition. The 24 tiles of $S_4$ light up as their permutation is realised. Switch to *the 3 face axes* to see a map onto $S_3$ that is not one-to-one.`,
      deps: ['alg-5.26', 'alg-5.1', 'alg-5.12'],
      refs: ['Judson §5.2'],
      tags: ['symmetry', 'cube', 'symmetric group'],
      viz(v) {
        const GR = cubeGroup(), DIAG = AXES.vertex, FAX = AXES.face;
        const typ = v.select('axis', [{ value: 'edge', label: 'edge (180°)' }, { value: 'face', label: 'face (90°)' }, { value: 'vertex', label: 'vertex (120°)' }], 'edge');
        const K = v.slider('which axis', 1, 6, 1, { int: true });
        const act = v.select('act on', [{ value: 'diag', label: '4 diagonals' }, { value: 'faces', label: 'the 3 face axes' }], 'diag');
        let R = I3, anim = null, lastPerm = null;
        const objs = () => (act.value === 'diag' ? DIAG : FAX);
        const permOf = (A, O = objs()) => O.map((d) => { const q = ap3(A, d); return O.findIndex((e) => (Math.abs(e[0] - q[0]) + Math.abs(e[1] - q[1]) + Math.abs(e[2] - q[2]) < 1e-6) || (Math.abs(e[0] + q[0]) + Math.abs(e[1] + q[1]) + Math.abs(e[2] + q[2]) < 1e-6)); });
        let seen = new Set();
        const axisNow = () => { const L = AXES[typ.value]; return L[(K.value - 1) % L.length]; };
        const turnBy = (axis, ang) => { const A = round3(rot3(axis, ang)); anim = { R0: R, axis, ang }; R = mat3(A, R); lastPerm = permOf(A); seen.add(pkey(permOf(R))); v.t = 0; v.play(); };
        v.button('Turn', () => turnBy(axisNow(), AXIS_ANGLE[typ.value]));
        v.button('All 6 edge turns', () => { for (const a of AXES.edge) seen.add(pkey(permOf(mat3(round3(rot3(a, Math.PI)), R)))); });
        v.button('Reset', () => { R = I3; anim = null; lastPerm = null; seen = new Set([pkey(permOf(I3))]); });
        seen.add(pkey(permOf(I3)));
        const s = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, axes: false, height: 390 });
        const sc = v.scene3(s, { yaw: -0.5, pitch: 0.33, axes: false });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, weight: 1.1 });
        const DC = ['blue', 'orange', 'green', 'purple'];
        v.animate((tt) => {
          const u = anim ? clamp(tt / 0.8, 0, 1) : 1, Rd = anim && u < 1 ? mat3(rot3(anim.axis, anim.ang * u), anim.R0) : R;
          sc.begin();
          CUBE_F.forEach(([f]) => sc.poly(f.map((i) => ap3(Rd, CUBE_V[i])), { fill: 'muted', fillAlpha: 0.05, color: 'muted', width: 1.2, alpha: 0.6 }));
          if (act.value === 'diag') DIAG.forEach((d, j) => {
            const a = ap3(Rd, d), b = ap3(Rd, d.map((c) => -c));
            sc.line(a, b, { color: DC[j], width: 3.4 }, 12);
            sc.dot(a, { r: 10, color: DC[j] }); sc.dot(b, { r: 10, color: DC[j] });
            const A2 = sc.P(a), B2 = sc.P(b);
            s.text(String(j + 1), A2[0], A2[1], { align: 'center', size: 11.5, weight: 700, color: 'panel', halo: false }); s.text(String(j + 1), B2[0], B2[1], { align: 'center', size: 11.5, weight: 700, color: 'panel', halo: false });
          });
          else FAX.forEach((d, j) => { const a = ap3(Rd, d.map((c) => c * 1.35)), b = ap3(Rd, d.map((c) => -c * 1.35)); sc.line(a, b, { color: DC[j], width: 3.4 }, 12); sc.dot(a, { r: 9, color: DC[j] }); sc.dot(b, { r: 9, color: DC[j] }); });
          const ax = anim && u < 1 ? anim.axis : axisNow(), L = Math.hypot(...ax);
          sc.line(ax.map((c) => (-2 * c) / L), ax.map((c) => (2 * c) / L), { color: 'gold', width: 2.2, dash: [7, 5] });
          sc.flush();
          // the S4 (or S3) tiles
          const m = act.value === 'diag' ? 4 : 3, P = allPerms(m), cols = m === 4 ? 6 : 3, rows = P.length / cols, cur = permOf(R);
          const mult = new Map(); for (const A of GR) { const k = pkey(permOf(A)); mult.set(k, (mult.get(k) || 0) + 1); }
          P.forEach((p, i) => {
            const c = i % cols, r = Math.floor(i / cols), w = 0.98 / cols, h = 0.8 / rows, cx = 0.01 + w * (c + 0.5), cy = 0.82 - h * (r + 0.5), on = seen.has(pkey(p)), isCur = same(p, cur);
            const ctype = cycles(p).map((cc) => cc.length).sort().join('+') || 'e', ccol = { e: 'muted', '2': 'blue', '2+2': 'teal', '3': 'orange', '4': 'purple' }[ctype];
            t.rect(cx - w / 2 + 0.006, cy - h / 2 + 0.008, cx + w / 2 - 0.006, cy + h / 2 - 0.008, { radius: 6, fill: isCur ? 'gold' : ccol, fillAlpha: isCur ? 0.4 : on ? 0.28 : 0.03, color: isCur ? 'gold' : on ? ccol : 'faint', width: isCur ? 2.4 : 1 });
            t.text(cycText(p), cx, cy + h * 0.12, { align: 'center', size: m === 4 ? 11.5 : 13, weight: 700, color: on ? 'ink' : 'faint', halo: false });
            t.text(m === 4 ? oneLine(p) : `${mult.get(pkey(p)) || 0} rotations`, cx, cy - h * 0.22, { align: 'center', size: 10, color: on ? 'muted' : 'faint', halo: false });
          });
          t.text(m === 4 ? `realised ${[...seen].filter((k) => k.split(',').length === 4).length} of 24 permutations of the diagonals` : 'each permutation of the 3 axes comes from 4 rotations', 0.5, 0.9, { align: 'center', size: 12, weight: 700 });
          if (m === 4) t.text('colour = cycle type: transposition · double transposition · 3-cycle · 4-cycle', 0.5, 0.86, { align: 'center', size: 9.5, color: 'muted' });
        }, { period: 0.8, once: true, autoplay: false, still: 0.8 });
        // open with one edge half-turn and one face quarter-turn already made
        turnBy(AXES.face[2], Math.PI / 2); turnBy(AXES.edge[0], Math.PI);
        v.readout(() => {
          const cur = permOf(R), imgs = new Set(GR.map((A) => pkey(permOf(A)))), m = act.value === 'diag' ? 4 : 3;
          const edgeT = AXES.edge.map((a) => permOf(round3(rot3(a, Math.PI)))), allT = edgeT.every((p) => cycles(p).length === 1 && cycles(p)[0].length === 2);
          const lp = lastPerm ? `The last turn permuted the ${m === 4 ? 'diagonals' : 'axes'} as $${cycTex(lastPerm.length === m ? lastPerm : permOf(I3))}$; the` : 'The';
          return m === 4
            ? String.raw`${lp} cube now realises $${cycTex(cur)}$. The 24 rotations give **${imgs.size}** different permutations of the diagonals — every element of $S_4$, each exactly once ✓. The 6 edge half-turns are the 6 transpositions ${allT ? '✓' : '✗'}.`
            : String.raw`On the 3 face axes the 24 rotations give only ${imgs.size} permutations: the map onto $S_3$ is onto but **not one-to-one** — the half-turns about the face axes all act trivially. The diagonals are what make the correspondence a bijection.`;
        });
      },
    },
  ],
};
