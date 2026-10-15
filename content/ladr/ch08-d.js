// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 8: Operators on Complex Vector Spaces
// Part 4 (8.47–8.57): the trace — of a matrix, tr(AB) = tr(BA), independence of the basis, the trace of an operator,
// the sum of the eigenvalues, the characteristic polynomial, orthonormal bases, linearity, and ST − TS ≠ I.
// Parts 1–3 (8.1–8.46) are ch08.js, ch08-b.js and ch08-c.js.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
const EC = ['blue', 'purple', 'teal', 'pink', 'orange'];
const TAU = 2 * Math.PI;
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** TeX for a complex number given as [re, im]. */
function ctn(z, d = 2) {
  const e = 0.5 * 10 ** -d, a = Math.abs(z[0]) < e ? 0 : z[0], b = Math.abs(z[1]) < e ? 0 : z[1];
  if (b === 0) return tn(a, d);
  const bs = tn(Math.abs(b), d) === '1' ? '' : tn(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bs}i`;
  return `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bs}i`;
}
/** Compact canvas text for a complex number. */
const cpn = (z, d = 2) => ctn(z, d).replace(/ /g, '').replace(/-/g, '−');
/** TeX for a real matrix. */
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
/** A "nice" bound ≥ x from a list. */
const nice = (x, list = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 100]) => list.find((t) => t >= x) ?? list[list.length - 1];

// ---------- vectors, matrices, complex numbers ----------
const add = (a, b) => a.map((x, i) => x + b[i]);
const subv = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const tr = (A) => A.reduce((s, r, i) => s + toC(r[i])[0], 0);
const trC = (A) => A.reduce((s, r, i) => cadd(s, toC(r[i])), [0, 0]);
const transp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const madd = (A, B) => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const mscl = (A, k) => A.map((r) => r.map((x) => x * k));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const fro2 = (A) => A.flat().reduce((s, x) => s + x * x, 0);
const clone = (A) => A.map((r) => r.slice());
const toC = (x) => (Array.isArray(x) ? x : x && x.re !== undefined ? [x.re, x.im] : [x, 0]);
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
/** Rotation of R³ by angle t about the axis u (Rodrigues). */
function rot3(u, t) {
  const l = len(u), [x, y, z] = scl(u, 1 / l), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}

// ---------- drawing and editing ----------
/**
 * Make the cells of table T on stage s editable: click the upper / lower half of a cell for ±1 step, or drag it
 * up / down. o.bump(i, j, k) applies k steps; o.ok(i, j) says which cells (and when) may change.
 */
function editable(s, T, o) {
  let d = null;
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = (!o.on || o.on()) && T.geo ? T.hit(x, y) : null;
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), done: 0, moved: false } : null;
      return;
    }
    if (!d) return;
    const dy = d.Y - s.Y(y);
    if (ph === 'move' && (d.moved || Math.abs(dy) > 5)) { d.moved = true; const k = Math.round(dy / 14); if (k !== d.done) { o.bump(d.i, d.j, k - d.done); d.done = k; } }
    if (ph === 'end') {
      if (!d.moved) { const r = T.cellRect(d.i, d.j); o.bump(d.i, d.j, y > (r[1] + r[3]) / 2 ? 1 : -1); }
      d = null;
    }
  });
}
/** Title above (or below) a drawn table. */
function ttl(s, T, tex, color = 'ink', below = false, size = 15) {
  const g = T.geo; if (!g) return;
  s.texPx(tex, g.X0 + (g.cols * g.cw) / 2, below ? g.Y0 + g.rows * g.ch + 15 : g.Y0 - g.lh - 14, { color, size });
}
/** Diagonal cells highlighted in a colour, the rest plain. */
const diagFill = (col, a = 0.28) => (i, j) => (i === j ? [col, a] : null);

export default {
  collection: 'ladr',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.47
    {
      num: '8.47',
      kind: 'Definition',
      name: 'Trace of a matrix',
      statement: String.raw`Suppose $A$ is a square matrix with entries in $\mathbf F$. The **trace** of $A$, written $\operatorname{tr} A$, is the sum of the diagonal entries of $A$:
$$\operatorname{tr} A = A_{1,1} + A_{2,2} + \cdots + A_{n,n}.$$`,
      idea: String.raw`Only $n$ of the $n^2$ entries count, and the trace is linear in $A$. It looks like a crude statistic of a matrix, but it is far more: it does not change under change of basis (8.50), so it is really a number attached to an operator (8.51), and over $\mathbf C$ it equals the sum of the eigenvalues counted with multiplicity (8.52). For Axler's example 8.48, $\begin{pmatrix} 3 & -1 & -2 \\ 5 & 2 & -3 \\ 1 & 6 & 0\end{pmatrix}$ has trace $3 + 2 + 0 = 5$.`,
      caption: String.raw`Edit the matrix (click the top or bottom half of an entry, or drag it); it starts as Axler's example 8.48. Right: the three diagonal entries are laid head to tail on a number line and land on $\operatorname{tr} A$. Press *shuffle the other entries*: the six off-diagonal entries change, the trace does not. The gold ring is the sum of the eigenvalues (complex ones included) — it always sits on the trace, a preview of 8.52.`,
      deps: [],
      tags: ['trace'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Trace_(linear_algebra)' },
      viz(v) {
        const M = v.M;
        const A = [[3, -1, -2], [5, 2, -3], [1, 6, 0]];
        let seed = 1, view = 0, st = null;
        v.button('shuffle the other entries', () => { const r = v.rng(++seed); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) A[i][j] = r.int(-6, 6); });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 0.85, minWidth: 250 });
        const L = v.stage({ x: [-10, 10], y: [-1.1, 3.6], axes: false, height: 300, weight: 1.15, minWidth: 290, title: 'the diagonal entries, head to tail' });
        const T = v.table(S, { rows: 3, cols: 3, region: [0.03, 0.08, 0.97, 0.86], maxCell: 68, size: 18 });
        editable(S, T, { bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); } });
        v.render(() => {
          const d = [0, 1, 2].map((k) => A[k][k]), ps = [0, d[0], d[0] + d[1], d[0] + d[1] + d[2]], t = ps[3];
          const ev = M.eig(A, { vectors: false }).values, es = ev.reduce((s, z) => s + z.re, 0);
          const R = nice(1.15 * Math.max(4, ...ps.map(Math.abs)), [5, 8, 10, 15, 20, 30]);
          if (R !== view) { view = R; L.setView([-R, R], [-1.1, 3.6]); }
          // the editor
          T.draw({ value: (i, j) => A[i][j], fill: (i, j) => (i === j ? [EC[i], 0.3] : null), textColor: (i, j) => (i === j ? 'ink' : 'muted'), weight: (i, j) => (i === j ? 700 : 500) });
          ttl(S, T, 'A', 'ink', false, 17);
          S.texPx(`\\operatorname{tr} A = ${d.map((x, k) => (k && x >= 0 ? `+ ${x}` : k ? `- ${-x}` : `${x}`)).join(' ')} = ${t}`, S.width / 2, S.height - 22, { size: 16 });
          // the number line
          L.line(-R, 0, R, 0, { color: 'muted', width: 1.4 });
          const stp = R > 12 ? 5 : R > 6 ? 2 : 1;
          for (let x = -Math.floor((R - 0.5) / stp) * stp; x < R - 0.5; x += stp) { L.line(x, -0.08, x, 0.08, { color: 'muted', width: 1 }); L.text(pn(x, 0), x, -0.35, { align: 'center', size: 11, color: 'muted' }); }
          d.forEach((x, k) => {
            const y = 2.9 - 0.9 * k;
            L.line(ps[k], 0, ps[k], y, { color: 'faint', dash: [3, 4], width: 1 });
            if (Math.abs(x) > 1e-9) L.arrow(ps[k], y, ps[k + 1], y, { color: EC[k], width: 3.2, head: 10 }); else L.dot(ps[k], y, { r: 4, color: EC[k] });
            L.tex(`A_{${k + 1},${k + 1}} = ${x}`, (ps[k] + ps[k + 1]) / 2, y + 0.38, { size: 13.5, color: EC[k] });
          });
          L.line(t, 2.9 - 0.9 * 2, t, 0, { color: 'green', dash: [5, 4], width: 1.6 });
          L.dot(es, 0, { r: 12, hollow: true, color: 'gold', width: 2.5 });
          L.dot(t, 0, { r: 6, color: 'green' });
          L.tex(`\\operatorname{tr} A = ${t}`, t, -0.78, { size: 14, color: 'green' });
          st = { t, ev, es };
        });
        v.legend([['blue', '$A_{1,1}$'], ['purple', '$A_{2,2}$'], ['teal', '$A_{3,3}$'], ['green', '$\\operatorname{tr} A$', { dot: true }], ['gold', 'sum of the eigenvalues', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const evs = st.ev.map((z) => ctn([z.re, z.im], 2)).join(',\\ ');
          return `$\\operatorname{tr} A = ${st.t}$; the eigenvalues of $A$ are $${evs}$, with sum $${tn(st.es, 6)}$ — the same number (8.52).`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.49
    {
      num: '8.49',
      kind: 'Theorem',
      name: 'Trace of AB equals trace of BA',
      statement: String.raw`Suppose $A$ is an $m$-by-$n$ matrix and $B$ is an $n$-by-$m$ matrix. Then
$$\operatorname{tr}(AB) = \operatorname{tr}(BA).$$
(Here $AB$ is $m$-by-$m$ and $BA$ is $n$-by-$n$; the two products need not be equal, or even of the same size.)`,
      idea: String.raw`The $j$th diagonal entry of $AB$ is $\sum_k A_{j,k}B_{k,j}$ (3.41), so $\operatorname{tr}(AB) = \sum_j \sum_k A_{j,k}B_{k,j}$. The $k$th diagonal entry of $BA$ is $\sum_j B_{k,j}A_{j,k}$, so $\operatorname{tr}(BA)$ is the same double sum taken in the other order. Both are the total of the $m \times n$ array of products $A_{j,k}B_{k,j}$: summing its rows gives the diagonal of $AB$, summing its columns the diagonal of $BA$. With three factors only the *cyclic* rearrangements survive: $\operatorname{tr}(ABC) = \operatorname{tr}(BCA)$ (take $BC$ as one factor), but in general $\operatorname{tr}(ABC) \ne \operatorname{tr}(ACB)$.`,
      caption: String.raw`Edit $A$ and $B$ (click the top or bottom half of an entry, or drag it) and choose their shapes. Top: $AB$ and $BA$, with their diagonals tinted. Bottom: the array of products $A_{j,k}B_{k,j}$ — its rows add up to the diagonal of $AB$ (blue column), its columns to the diagonal of $BA$ (orange row), and both add up to the same corner total. Switch to *three matrices* to see which rearrangements of $ABC$ keep the trace: the three rotations agree, the three others agree with each other, but generally not with the first three.`,
      deps: ['ladr-8.47', 'ladr-3.41'],
      tags: ['trace'],
      viz(v) {
        const M = v.M;
        const A0 = [[2, -1, 3], [1, 4, -2], [0, 2, 1]], B0 = [[1, 3, -1], [-2, 0, 2], [4, 1, 1]];
        const X3 = [[[1, 2], [0, -1]], [[0, 1], [3, 1]], [[2, 0], [1, -2]]];
        const mode = v.select('', [{ value: 'two', label: '$\\operatorname{tr}(AB)$ vs $\\operatorname{tr}(BA)$' }, { value: 'three', label: 'three matrices: which orders?' }], 'two');
        const size = v.select('shapes', [{ value: '23', label: '$2\\times3$, $3\\times2$' }, { value: '13', label: '$1\\times3$, $3\\times1$' }, { value: '33', label: '$3\\times3$, $3\\times3$' }], '23');
        const S1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const S2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true });
        const mk = (s, o = {}) => v.table(s, { rows: 3, cols: 3, maxCell: 44, size: 14, ...o });
        const TA = mk(S1), TB = mk(S1), TAB = mk(S1), TBA = mk(S1), T3 = [0, 1, 2].map(() => mk(S1)), TP = [mk(S1), mk(S1)];
        const TG = mk(S2, { maxCell: 52, size: 14 });
        const dims = () => ({ m: +size.value[0], n: +size.value[1] });
        const two = () => mode.value === 'two';
        editable(S1, TA, { on: two, bump: (i, j, k) => { A0[i][j] = M.clamp(A0[i][j] + k, -9, 9); } });
        editable(S1, TB, { on: two, bump: (i, j, k) => { B0[i][j] = M.clamp(B0[i][j] + k, -9, 9); } });
        T3.forEach((T, q) => editable(S1, T, { on: () => !two(), bump: (i, j, k) => { X3[q][i][j] = M.clamp(X3[q][i][j] + k, -9, 9); } }));
        let st = null;
        /** Lay tables out side by side in S1: specs [{T, rows, cols, title, ...draw}]. */
        const row = (specs, gapUnits = 1.1) => {
          const tot = specs.reduce((s, q) => s + q.cols, 0) + gapUnits * (specs.length - 1), x0 = 0.02, W = 0.96;
          let x = x0;
          specs.forEach((q) => {
            const w = (W * q.cols) / tot;
            q.T.draw({ rows: q.rows, cols: q.cols, region: [x, 0.08, x + w, 0.78], ...q.draw });
            ttl(S1, q.T, q.title, q.color || 'ink', false, 15);
            if (q.under) { const g = q.T.geo; S1.texPx(q.under, g.X0 + (q.cols * g.cw) / 2, g.Y0 + q.rows * g.ch + 16, { size: 13, color: q.ucol || 'ink' }); }
            x += w + (W * gapUnits) / tot;
          });
        };
        v.render(() => {
          size.el.hidden = !two();
          if (two()) {
            const { m, n } = dims(), A = A0.slice(0, m).map((r) => r.slice(0, n)), B = B0.slice(0, n).map((r) => r.slice(0, m));
            const AB = mm(A, B), BA = mm(B, A), tAB = tr(AB), tBA = tr(BA);
            row([
              { T: TA, rows: m, cols: n, title: 'A', draw: { value: (i, j) => A[i][j] } },
              { T: TB, rows: n, cols: m, title: 'B', draw: { value: (i, j) => B[i][j] } },
              { T: TAB, rows: m, cols: m, title: 'AB', draw: { value: (i, j) => AB[i][j], fill: diagFill('blue', 0.3) }, under: `\\operatorname{tr} = ${tAB}`, ucol: 'blue' },
              { T: TBA, rows: n, cols: n, title: 'BA', draw: { value: (i, j) => BA[i][j], fill: diagFill('orange', 0.3) }, under: `\\operatorname{tr} = ${tBA}`, ucol: 'orange' },
            ]);
            // the array of products A_{jk} B_{kj}
            const P = A.map((r, j) => r.map((a, k) => a * B[k][j]));
            const rs = P.map((r) => r.reduce((s, x) => s + x, 0)), cs = P[0].map((_, k) => P.reduce((s, r) => s + r[k], 0)), tot = rs.reduce((s, x) => s + x, 0);
            TG.draw({
              rows: m + 1, cols: n + 1, region: [0.2, 0.17, 0.8, 0.86],
              value: (i, j) => (i < m && j < n ? P[i][j] : i < m ? rs[i] : j < n ? cs[j] : tot),
              rowLabels: (i) => (i < m ? `$${i + 1}$` : '$\\Sigma$'), colLabels: (j) => (j < n ? `$${j + 1}$` : '$\\Sigma$'), cornerLabel: '$j \\backslash k$',
              fill: (i, j) => (i < m && j < n ? null : i < m ? ['blue', 0.25] : j < n ? ['orange', 0.25] : ['green', 0.35]),
              weight: (i, j) => (i === m || j === n ? 700 : 500),
            });
            const g = TG.geo;
            S2.texPx('A_{j,k}\\,B_{k,j}', g.X0 - g.lw - 16, g.Y0 - g.lh / 2, { size: 14, align: 'right' });
            S2.texPx('\\text{row sums} = (AB)_{j,j}', g.X0 + (n + 1) * g.cw + 14, g.Y0 + (m / 2) * g.ch, { size: 13.5, color: 'blue', align: 'left' });
            S2.texPx('\\text{column sums} = (BA)_{k,k}', g.X0 + (n / 2) * g.cw, g.Y0 + (m + 1) * g.ch + 17, { size: 13.5, color: 'orange' });
            S2.texPx(`\\text{total} = ${tot}`, g.X0 + (n + 1) * g.cw + 14, g.Y0 + (m + 0.5) * g.ch, { size: 13.5, color: 'green', align: 'left' });
            st = { two: true, m, n, tAB, tBA, same: maxAbs(AB.length === BA.length ? msub(AB, BA) : [[1]]) === 0 && AB.length === BA.length };
          } else {
            const [A, B, C] = X3, prods = { ABC: [A, B, C], BCA: [B, C, A], CAB: [C, A, B], ACB: [A, C, B], CBA: [C, B, A], BAC: [B, A, C] };
            const trs = {}; for (const [k, [X, Y, Z]] of Object.entries(prods)) trs[k] = tr(mm(mm(X, Y), Z));
            const ABC = mm(mm(A, B), C), ACB = mm(mm(A, C), B);
            row([
              ...['A', 'B', 'C'].map((nm, q) => ({ T: T3[q], rows: 2, cols: 2, title: nm, draw: { value: (i, j) => X3[q][i][j] } })),
              { T: TP[0], rows: 2, cols: 2, title: 'ABC', draw: { value: (i, j) => ABC[i][j], fill: diagFill('green', 0.3) }, under: `\\operatorname{tr} = ${trs.ABC}`, ucol: 'green' },
              { T: TP[1], rows: 2, cols: 2, title: 'ACB', draw: { value: (i, j) => ACB[i][j], fill: diagFill('red', 0.25) }, under: `\\operatorname{tr} = ${trs.ACB}`, ucol: trs.ACB === trs.ABC ? 'green' : 'red' },
            ], 0.9);
            // the two classes of rotations, as two triangles
            const W = S2.width, H = S2.height, cy = H / 2 + 8, D = (p) => [S2.invX(p[0]), S2.invY(p[1])];
            const cyc = [['ABC', 'BCA', 'CAB'], ['ACB', 'CBA', 'BAC']], eq = trs.ABC === trs.ACB;
            cyc.forEach((g, gi) => {
              const cx = W * (gi ? 0.73 : 0.27), col = gi ? 'orange' : 'green', P = [0, 1, 2].map((i) => { const a = -Math.PI / 2 + (i * TAU) / 3; return [cx + 2.3 * 70 * Math.cos(a), cy + 70 * Math.sin(a)]; });
              P.forEach((a, i) => { const b = P[(i + 1) % 3], p0 = [a[0] + 0.3 * (b[0] - a[0]), a[1] + 0.3 * (b[1] - a[1])], p1 = [a[0] + 0.7 * (b[0] - a[0]), a[1] + 0.7 * (b[1] - a[1])]; S2.arrow(...D(p0), ...D(p1), { color: col, width: 1.8, head: 8, alpha: 0.75 }); });
              g.forEach((k, i) => S2.texPx(`\\operatorname{tr}(${k}) = ${trs[k]}`, P[i][0], P[i][1], { size: 15, color: col }));
              S2.texPx(gi ? '\\text{rotations of } ACB' : '\\text{rotations of } ABC', cx, 16, { size: 13, color: col });
            });
            S2.texPx(eq ? '=' : '\\ne', W / 2, cy, { size: 30, color: eq ? 'green' : 'red' });
            S2.texPx('\\text{swap two factors}', W / 2, cy + 30, { size: 12, color: 'muted' });
            st = { two: false, trs };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.two) return `$AB$ is ${st.m}-by-${st.m}, $BA$ is ${st.n}-by-${st.n}${st.same ? ' (here they happen to be equal)' : ''}, and $\\operatorname{tr}(AB) = ${st.tAB} = \\operatorname{tr}(BA)$: both are the total of the array of products.`;
          const t = st.trs, eq = t.ABC === t.ACB;
          return `Rotations keep the trace: $\\operatorname{tr}(ABC) = \\operatorname{tr}(BCA) = \\operatorname{tr}(CAB) = ${t.ABC}$ (each is $\\operatorname{tr}(XY) = \\operatorname{tr}(YX)$ with a product as one factor). ${eq ? 'For these matrices the other three orders happen to give the same value — edit an entry.' : `But $\\operatorname{tr}(ACB) = ${t.ACB} \\ne ${t.ABC}$: **swapping two factors is not allowed**.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.50
    {
      num: '8.50',
      kind: 'Theorem',
      name: 'Trace of matrix of operator does not depend on basis',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $u_1, \dots, u_n$ and $v_1, \dots, v_n$ are bases of $V$. Then
$$\operatorname{tr} \mathcal M\big(T, (u_1, \dots, u_n)\big) = \operatorname{tr} \mathcal M\big(T, (v_1, \dots, v_n)\big).$$`,
      idea: String.raw`Let $A$ and $B$ be the two matrices. By the change-of-basis formula (3.84) there is an invertible $C$ with $A = C^{-1}BC$. Then, using $\operatorname{tr}(XY) = \operatorname{tr}(YX)$ (8.49) with $X = C^{-1}B$ and $Y = C$,
$$\operatorname{tr} A = \operatorname{tr}\big((C^{-1}B)C\big) = \operatorname{tr}\big(C(C^{-1}B)\big) = \operatorname{tr} B.$$
The hypothesis that the *same* basis is used for the domain and the target matters: $\operatorname{tr}\mathcal M(T, (u_k), (v_k))$ does depend on the bases.`,
      caption: String.raw`Drag the basis vectors $u_1, u_2, u_3$ of $\mathbf R^3$ (drag the background to rotate); the dashed arrows are $Tu_1, Tu_2, Tu_3$ for a fixed operator $T$. Right: $\mathcal M\big(T, (u_1, u_2, u_3)\big)$ — its entry $(k,k)$ is the $u_k$-coordinate of $Tu_k$. Below: a running record of the three diagonal entries (thin) and their sum (thick) as the basis moves — the record starts with a sweep through many bases. The diagonal entries swing wildly; the sum is flat. Switch on *standard basis for the target* to use $(u_k)$ for the domain but $(e_k)$ for the target: the sum starts to move.`,
      deps: ['ladr-3.84', 'ladr-8.49'],
      tags: ['trace', 'change of basis'],
      viz(v) {
        const M = v.M;
        const T = [[2, 1, 0], [-1, 1, 1], [0.5, 1, 1]], C0 = [[1.1, -0.3, 0.1], [-0.3, 1.1, -0.35], [0.2, 0.3, 1.1]];
        const CC = ['blue', 'purple', 'teal'];
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.9], equal: true, axes: false, height: 330, weight: 1.15, minWidth: 290 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 250 });
        const Hs = v.stage({ x: [0, 199], y: [-6, 8], axes: 'box', height: 190, full: true, xticks: [], title: 'record while the basis moves: diagonal entries (thin) and their sum (thick)' });
        const sc = v.scene3(S, { yaw: 0.6, pitch: 0.3, axis: 1.4, lim: 1.6 });
        const U = C0.map((p, k) => sc.handle(p, { color: CC[k], label: `$u_${k + 1}$` }));
        const other = v.toggle('standard basis for the target (break it)', false);
        const TB = v.table(R, { rows: 3, cols: 3, region: [0.05, 0.22, 0.95, 0.86], maxCell: 62, size: 15 });
        // a record of bases: a sweep (rotation × shear, never singular) ending at the starting basis, then the reader's drags
        const hist = [];
        for (let i = 0; i < 140; i++) {
          const s = 1 - i / 139, Rm = rot3([1, 0.7, 0.4], 4 * s);
          const Sh = mm(mm([[1, 2.5 * Math.sin(4 * s), 0], [0, 1, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 2 * Math.sin(3 * s)], [0, 0, 1]]), [[1, 0, 0], [0, 1, 0], [1.5 * Math.sin(5 * s), 0, 1]]);
          hist.push(mm(mm(Rm, Sh), transp(C0)).map((r) => r.slice()));
        }
        let st = null;
        const matOf = (Cm) => (other.value ? mm(T, Cm) : M.solve(Cm, mm(T, Cm)));
        v.render(() => {
          const Cm = fromCols(U.map((h) => h.p)), det = M.det(Cm), ok = Math.abs(det) > 1e-3;
          const last = hist[hist.length - 1];
          if (ok && maxAbs(msub(last, Cm)) > 1e-9) { hist.push(Cm); if (hist.length > 200) hist.shift(); }
          const Mt = ok ? matOf(Cm) : null;
          // the scene
          sc.begin();
          U.forEach((h, k) => { sc.arrow([0, 0, 0], mv(T, h.p), { color: CC[k], width: 1.6, dash: [5, 4], alpha: 0.75 }); });
          U.forEach((h, k) => sc.arrow([0, 0, 0], h.p, { color: CC[k], width: 3 }));
          sc.flush();
          S.corner(ok ? `det = ${pn(det, 2)}: a basis` : 'not a basis', 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          // the matrix
          TB.draw({ value: (i, j) => (Mt ? Mt[i][j] : null), format: (x) => (x == null ? '' : pn(x, 2)), fill: (i, j) => (i === j ? [CC[i], 0.3] : null), weight: (i, j) => (i === j ? 700 : 500) });
          ttl(R, TB, other.value ? '\\mathcal M\\big(T, (u_k), (e_k)\\big)' : '\\mathcal M\\big(T, (u_1, u_2, u_3)\\big)', other.value ? 'red' : 'ink', false, 14.5);
          const t = Mt ? tr(Mt) : NaN;
          R.texPx(Mt ? `\\operatorname{tr} = ${Mt.map((r, i) => tn(r[i], 2)).join(' + ').replace(/\+ -/g, '- ')} = ${tn(t, 3)}` : '', R.width / 2, R.height - 30, { size: 14, color: other.value ? 'red' : 'green' });
          // the record
          const recs = hist.map((Cq) => { const Mq = matOf(Cq); return [Mq[0][0], Mq[1][1], Mq[2][2], tr(Mq)]; });
          const big = nice(1.1 * Math.max(5, ...recs.flat().map(Math.abs)), [5, 8, 10, 15, 20, 30, 50]);
          Hs.setView([0, 199], [-big, big]);
          Hs.hline(0, { color: 'faint', width: 1 });
          for (let k = 0; k < 3; k++) Hs.path(recs.map((r, i) => [i, r[k]]), { color: CC[k], width: 1.4, alpha: 0.8 });
          Hs.path(recs.map((r, i) => [i, r[3]]), { color: other.value ? 'red' : 'green', width: 3.4 });
          Hs.text(other.value ? 'sum: moves' : `sum = tr T = ${pn(tr(T), 2)}`, recs.length - 1, recs[recs.length - 1][3], { dy: -12, align: 'right', size: 12, weight: 700, color: other.value ? 'red' : 'green' });
          const sums = recs.map((r) => r[3]);
          st = { t, spread: Math.max(...sums) - Math.min(...sums), ok };
        });
        v.legend([['blue', '$u_k$ and $Tu_k$ (dashed)'], ['green', 'sum of the diagonal']]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return 'The three vectors are (nearly) dependent: not a basis, so there is no matrix.';
          if (other.value) return `With $(u_k)$ for the domain and the standard basis for the target, the "trace" is $${tn(st.t, 3)}$ and it varied by $${tn(st.spread, 2)}$ over the record: the theorem needs **one** basis on both sides.`;
          return `$\\operatorname{tr}\\mathcal M\\big(T, (u_1, u_2, u_3)\\big) = ${tn(st.t, 6)}$ — and over every basis in the record the sum varied by only $${v.sci(Math.max(st.spread, 1e-17), 1)}$ (rounding): it is $\\operatorname{tr} T = ${tn(tr(T), 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.51
    {
      num: '8.51',
      kind: 'Definition',
      name: 'Trace of an operator',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. The **trace** of $T$, denoted $\operatorname{tr} T$, is
$$\operatorname{tr} T = \operatorname{tr} \mathcal M\big(T, (v_1, \dots, v_n)\big),$$
where $v_1, \dots, v_n$ is any basis of $V$. By 8.50 the right side does not depend on the basis, so the definition makes sense.`,
      idea: String.raw`A definition that uses a basis is only legitimate if the outcome is independent of the choice; 8.50 provides exactly that for the trace (as it will for the determinant in Chapter 9). Once defined, the trace of an operator inherits the properties of the trace of matrices — linearity and $\operatorname{tr}(ST) = \operatorname{tr}(TS)$ (8.56) — and gains new descriptions: the sum of the eigenvalues over $\mathbf C$ (8.52), minus the second coefficient of the characteristic polynomial (8.54), and $\sum_k\langle Te_k, e_k\rangle$ for any orthonormal basis (8.55).`,
      caption: String.raw`Left: an operator $T$ on $\mathbf R^2$, given geometrically — drag the images $T(1,0)$ and $T(0,1)$; the house and the grid show what $T$ does. Right: the same $T$ in four different bases (each card shows its basis and the matrix of $T$ in it). The matrices have nothing obvious in common, yet every card reports the same trace — a number that belongs to $T$, not to a basis. The last card uses eigenvectors when $T$ has two real eigenvalues (a diagonal matrix with the eigenvalues), and otherwise the real and imaginary parts of a complex eigenvector (a rotation–scaling block $\begin{pmatrix} a & -b \\ b & a\end{pmatrix}$ with trace $2a = 2\operatorname{Re}\lambda$).`,
      deps: ['ladr-8.50', 'ladr-8.47'],
      tags: ['trace'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.4], equal: true, height: 380, weight: 0.95, minWidth: 270, title: 'the operator $T$ (drag $T(1,0)$ and $T(0,1)$)' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.2, minWidth: 320 });
        const snap = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
        const h1 = S.handle(1.3, 0.5, { color: 'teal', label: 'T(1,0)', constrain: snap });
        const h2 = S.handle(-0.6, 0.9, { color: 'pink', label: 'T(0,1)', constrain: snap });
        const TBs = [0, 1, 2, 3].map(() => v.table(G, { rows: 2, cols: 2, maxCell: 40, size: 13 }));
        const HOUSE = [[-0.5, -0.55], [0.5, -0.55], [0.5, 0.15], [0, 0.62], [-0.5, 0.15]];
        const DOOR = [[-0.16, -0.55], [0.08, -0.55], [0.08, -0.14], [-0.16, -0.14]];
        let st = null;
        v.render(() => {
          const T = [[h1.x, h2.x], [h1.y, h2.y]];
          for (let k = -2; k <= 2; k++) { S.path([mv(T, [k, -2]), mv(T, [k, 2])], { color: 'accent', width: 1, alpha: 0.25 }); S.path([mv(T, [-2, k]), mv(T, [2, k])], { color: 'accent', width: 1, alpha: 0.25 }); }
          S.poly(HOUSE, { color: 'muted', fill: 'muted', fillAlpha: 0.06, width: 1, dash: [4, 3] });
          S.poly(HOUSE.map((p) => mv(T, p)), { color: 'accent', fill: 'accent', fillAlpha: 0.16, width: 2 });
          S.poly(DOOR.map((p) => mv(T, p)), { color: 'accent', fill: 'accent', fillAlpha: 0.35, width: 1 });
          S.arrow(0, 0, h1.x, h1.y, { color: 'teal', width: 2.4 }); S.arrow(0, 0, h2.x, h2.y, { color: 'pink', width: 2.4 });
          // four bases
          const a = T[0][0], b = T[0][1], c = T[1][0], d = T[1][1], disc = (a - d) ** 2 + 4 * b * c;
          let last, lname;
          if (disc > 1e-6) {
            const l1 = (a + d + Math.sqrt(disc)) / 2, l2 = (a + d - Math.sqrt(disc)) / 2;
            const ev = (l) => (Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : l === l1 ? (a >= d ? [1, 0] : [0, 1]) : (a >= d ? [0, 1] : [1, 0]));
            const n1 = ev(l1), n2 = ev(l2); last = [scl(n1, 1 / len(n1)), scl(n2, 1 / len(n2))]; lname = 'eigenvectors';
          } else if (disc < -1e-6) {
            // complex eigenvalue λ = α + iβ with eigenvector w = (b, λ − a): use (Re w, Im w)
            const al = (a + d) / 2, be = Math.sqrt(-disc) / 2, re = [b, al - a], im = [0, be], nn = Math.max(len(re), len(im));
            last = [scl(re, 1 / nn), scl(im, 1 / nn)]; lname = 'Re, Im of an eigenvector';
          } else { last = [[1, 0.5], [-0.4, 1]]; lname = 'a skew basis'; }
          const bases = [[[1, 0], [0, 1]], [[Math.cos(0.6), Math.sin(0.6)], [-Math.sin(0.6), Math.cos(0.6)]], [[1, 0.6], [-0.7, 0.5]], last];
          const names = ['standard basis', 'rotated basis', 'a skew basis', lname];
          const W = G.width, H = G.height, trs = [];
          bases.forEach((B, k) => {
            const Bm = fromCols(B), Mt = Math.abs(M.det(Bm)) > 1e-9 ? M.solve(Bm, mm(T, Bm)) : null;
            const cx = (k % 2) * 0.5, cy = k < 2 ? 0.5 : 0;
            // card frame and basis picture (left part of the card)
            const X0 = G.X(cx) + 10, Y0 = G.Y(cy + 0.5) + 8, cw = W / 2 - 20, ch = H / 2 - 16;
            G.rect(G.invX(X0), G.invY(Y0 + ch), G.invX(X0 + cw), G.invY(Y0), { color: 'faint', width: 1, fill: 'muted', fillAlpha: 0.03 });
            G.textPx(names[k], X0 + cw / 2, Y0 + 13, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            const ox = X0 + cw * 0.22, oy = Y0 + ch * 0.55, sc = Math.min(cw * 0.17, ch * 0.26);
            const P = (p) => [G.invX(ox + p[0] * sc), G.invY(oy - p[1] * sc)];
            G.line(...P([-1.2, 0]), ...P([1.2, 0]), { color: 'faint', width: 1 }); G.line(...P([0, -1.2]), ...P([0, 1.2]), { color: 'faint', width: 1 });
            B.forEach((u, j) => { const nb = Math.max(1, len(u)); G.arrow(...P([0, 0]), ...P(scl(u, 1 / nb)), { color: j ? 'orange' : 'blue', width: 2.2, head: 7 }); });
            if (!Mt) return;
            TBs[k].draw({ region: [cx + 0.2, cy + 0.12, cx + 0.49, cy + 0.42], value: (i, j) => Mt[i][j], format: (x) => pn(x, 2), fill: diagFill('green', 0.25) });
            const t = Mt[0][0] + Mt[1][1]; trs.push(t);
            G.texPx(`\\operatorname{tr} = ${tn(t, 2)}`, G.X(cx + 0.345), Y0 + ch - 14, { size: 13.5, color: 'green' });
          });
          st = { T, t: a + d, trs, disc };
        });
        v.legend([['blue', 'first basis vector'], ['orange', 'second basis vector'], ['green', 'diagonal, trace', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const spread = Math.max(...st.trs) - Math.min(...st.trs);
          return `In every basis the diagonal entries add up to $${tn(st.t, 2)}$ (spread over the four cards: $${v.sci(Math.max(spread, 1e-17), 1)}$). So $\\operatorname{tr} T = ${tn(st.t, 2)}$ — ${st.disc > 1e-6 ? 'here also the sum of the two real eigenvalues' : st.disc < -1e-6 ? 'here twice the real part of the complex eigenvalues' : 'here twice the repeated eigenvalue'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.52
    {
      num: '8.52',
      kind: 'Theorem',
      name: 'Over C, trace equals sum of eigenvalues',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then $\operatorname{tr} T$ equals the sum of the eigenvalues of $T$, each included as many times as its multiplicity: if $\lambda_1, \dots, \lambda_m$ are the distinct eigenvalues with multiplicities $d_1, \dots, d_m$, then
$$\operatorname{tr} T = d_1\lambda_1 + \cdots + d_m\lambda_m.$$`,
      idea: String.raw`By 8.37 there is a basis in which $T$ has an upper-triangular matrix whose diagonal lists the eigenvalues, each as often as its multiplicity (8.31). The trace of that matrix is the sum of the eigenvalues, and by 8.50 the trace does not depend on the basis. Over $\mathbf R$ the statement fails if one sums only real eigenvalues: a rotation of $\mathbf R^2$ by $\theta$ has trace $2\cos\theta$ and no real eigenvalues at all — the missing summands are the complex pair $e^{\pm i\theta}$.`,
      caption: String.raw`A $3$-by-$3$ complex matrix $A = D + sO$: drag its diagonal entries $A_{1,1}, A_{2,2}, A_{3,3}$ (blue, purple, teal) in $\mathbb C$; $O$ is a fixed off-diagonal pattern scaled by $s$. The eigenvalues (pink) move away from the diagonal entries as $s$ grows. The dashed path adds the diagonal entries head to tail, the solid path adds the eigenvalues; both always end at the same point, $\operatorname{tr} A$ (green), and the gold star — their common centroid — is $\operatorname{tr} A/3$. Switch to *real matrix, real eigenvalues only*: the diagonal entries stay on the real axis, and once two eigenvalues leave it as a complex pair, the real eigenvalues alone no longer add up to the trace.`,
      deps: ['ladr-8.37', 'ladr-8.50', 'ladr-8.51', 'ladr-8.23'],
      tags: ['trace', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const OC = [[0, [1, 0.5], [-0.6, 0.3]], [[0.8, -0.4], 0, [0.5, 1]], [[-0.3, 0.7], [0.9, 0.2], 0]];
        const OR = [[0, 1.2, -0.7], [-1.5, 0, 0.6], [0.8, -1.1, 0]];
        const CC = ['blue', 'purple', 'teal'];
        const S = v.stage({ x: [-2.9, 3.6], y: [-2.3, 2.5], equal: true, height: 380, weight: 1.3, minWidth: 300, title: 'in $\\mathbb C$: diagonal entries (drag), eigenvalues, and their sums' });
        const Pm = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.8, minWidth: 240 });
        const TA = v.table(Pm, { rows: 3, cols: 3, region: [0.02, 0.4, 0.98, 0.9], maxCell: 64, size: 12 });
        const real = () => fld.value === 'R';
        const H = [[1, 1], [-0.8, -0.5], [1.6, -1]].map((p, k) => S.handle(p[0], p[1], { color: CC[k], label: `$A_{${k + 1}${k + 1}}$`, constrain: (x, y) => [Math.round(x * 20) / 20, real() ? 0 : Math.round(y * 20) / 20] }));
        const fld = v.select('', [{ value: 'C', label: 'complex matrix, all eigenvalues' }, { value: 'R', label: 'real matrix, real eigenvalues only' }], 'C', { onChange: (c) => { const P0 = c === 'R' ? [[-1.8, 0], [1, 0], [2.3, 0]] : [[1, 1], [-0.8, -0.5], [1.6, -1]]; H.forEach((h, k) => h.set(...P0[k])); } });
        const s = v.slider('off-diagonal size $s$', 0, 2, 1, { step: 0.05 });
        let st = null;
        v.render(() => {
          const O = real() ? OR : OC, d = H.map((h) => [h.x, h.y]);
          const A = O.map((r, i) => r.map((z, j) => (i === j ? d[i] : [toC(z)[0] * s.value, toC(z)[1] * s.value])));
          const ev = M.eigC(A, { vectors: false }).values.map((z) => [z.re, z.im]).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
          const t = trC(A), counted = real() ? ev.filter((z) => Math.abs(z[1]) < 1e-9 * (1 + cabs(z))) : ev;
          const es = counted.reduce((a, z) => cadd(a, z), [0, 0]), match = cabs([es[0] - t[0], es[1] - t[1]]) < 1e-8;
          // paths: diagonal entries head to tail (dashed), eigenvalues head to tail (solid)
          let p = [0, 0];
          d.forEach((z, k) => { const q = cadd(p, z); if (k) S.arrow(p[0], p[1], q[0], q[1], { color: CC[k], width: 2, dash: [6, 4], head: 9 }); else S.arrow(0, 0, q[0], q[1], { color: CC[0], width: 2, dash: [6, 4], head: 9 }); p = q; });
          p = [0, 0];
          counted.forEach((z) => { const q = cadd(p, z); S.arrow(p[0], p[1], q[0], q[1], { color: 'pink', width: 2.6, head: 10 }); p = q; });
          ev.forEach((z) => { const isC = real() && Math.abs(z[1]) >= 1e-9 * (1 + cabs(z)); S.dot(z[0], z[1], { r: 6, color: isC ? 'red' : 'pink', hollow: isC, width: 2 }); });
          S.dot(t[0], t[1], { r: 13, hollow: true, color: 'green', width: 3 });
          S.text('tr A', t[0], t[1], { dx: 18, dy: -14, size: 13, color: 'green', weight: 700 });
          if (!match) { S.dot(es[0], es[1], { r: 8, color: 'red' }); S.text('sum of real eigenvalues', es[0], es[1], { dy: 18, align: 'center', size: 12, color: 'red', weight: 600 }); }
          const c3 = [t[0] / 3, t[1] / 3];
          S.poly(Array.from({ length: 10 }, (_, k) => { const r = (k % 2 ? 0.07 : 0.17) * (S.xr[1] - S.xr[0]) / 8, a = Math.PI / 2 + (k * Math.PI) / 5; return [c3[0] + r * Math.cos(a), c3[1] + r * Math.sin(a)]; }), { fill: 'gold', fillAlpha: 0.9, color: 'gold', width: 1 });
          S.corner(match ? 'Σ eigenvalues = tr A' : 'Σ real eigenvalues ≠ tr A', 'tl', { color: match ? 'green' : 'red', weight: 700 });
          TA.draw({ value: (i, j) => cpn(A[i][j], 1), fill: (i, j) => (i === j ? [CC[i], 0.28] : null) });
          ttl(Pm, TA, 'A', 'ink', false, 16);
          const lines = [[`\\operatorname{tr} A = ${ctn(t, 2)}`, 'green'], [`\\textstyle\\sum \\text{${real() ? 'real ' : ''}eigenvalues} = ${ctn(es, 2)}`, match ? 'green' : 'red'], [`\\operatorname{tr} A / 3 = ${ctn([t[0] / 3, t[1] / 3], 2)}`, 'gold']];
          lines.forEach(([tx, c], k) => Pm.texPx(tx, Pm.width / 2, Pm.height * (0.66 + 0.1 * k), { size: 14, color: c }));
          st = { t, ev, es, match, nc: ev.length - counted.length };
        });
        v.legend([['blue', 'diagonal entries, added head to tail', { dash: true }], ['pink', 'eigenvalues, added head to tail'], ['green', '$\\operatorname{tr} A$', { dot: true }], ['gold', 'centroid $= \\operatorname{tr} A/3$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const evs = st.ev.map((z) => ctn(z, 2)).join(',\\ ');
          if (st.match) return `Eigenvalues $${evs}$; their sum $${ctn(st.es, 4)}$ equals $\\operatorname{tr} A = ${ctn(st.t, 4)}$ (the sum of the diagonal entries), although no eigenvalue equals a diagonal entry.`;
          return `Over $\\mathbf R$ only the real eigenvalues count: their sum is $${ctn(st.es, 3)}$, but $\\operatorname{tr} A = ${ctn(st.t, 3)}$. The missing summands are the complex pair among $${evs}$ — the theorem needs $\\mathbf F = \\mathbf C$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.54
    {
      num: '8.54',
      kind: 'Theorem',
      name: 'Trace and characteristic polynomial',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$, $T \in \mathcal L(V)$, and $n = \dim V$. Then $\operatorname{tr} T$ equals the negative of the coefficient of $z^{n-1}$ in the characteristic polynomial of $T$:
$$q(z) = z^n - (\operatorname{tr} T)\,z^{n-1} + \cdots .$$`,
      idea: String.raw`List the eigenvalues with multiplicity as $\lambda_1, \dots, \lambda_n$, so $q(z) = (z - \lambda_1)\cdots(z - \lambda_n)$ (8.26). Expanding, the coefficient of $z^{n-1}$ collects one $-\lambda_k$ from each factor: it is $-(\lambda_1 + \cdots + \lambda_n)$, which is $-\operatorname{tr} T$ by 8.52. (The constant term is $(-1)^n\lambda_1\cdots\lambda_n$, the determinant up to sign — see 9.65.) A picture of the same fact: differentiating $n-1$ times leaves $q^{(n-1)}(z) = n!\,z - (n-1)!\operatorname{tr} T$, whose only zero is the centroid $\operatorname{tr} T/n$ of the eigenvalues; by the Gauss–Lucas theorem the zeros of $q, q', q'', \dots$ shrink inside one another towards it.`,
      caption: String.raw`Edit the matrix (click the top or bottom half of an entry, or drag it) or pick a preset; the characteristic polynomial is computed from the matrix (Faddeev–LeVerrier, no eigenvalues involved) and its coefficients are listed under it, with the $z^{n-1}$ coefficient next to $-\operatorname{tr} A$. Left: the zeros of $q$ (the eigenvalues, large pink), of $q'$, $q''$, … with their convex hulls, closing in on a single point — the zero of $q^{(n-1)}$, which is $\operatorname{tr} A/n$ (green ring, computed from the diagonal). Switch to the *minimal polynomial*: when an eigenvalue is repeated it has lower degree, and its second coefficient no longer gives the trace.`,
      deps: ['ladr-8.52', 'ladr-8.26'],
      see: ['ladr-9.65'],
      tags: ['trace', 'characteristic polynomial'],
      viz(v) {
        const M = v.M;
        const PRE = {
          ax: [[3, -1, -2], [3, 2, -3], [1, 2, 0]],
          four: [[2, 1, 0, -1], [1, -1, 2, 0], [0, 3, 1, 1], [-2, 0, 1, 2]],
        };
        const P3 = [[1, 1, 0], [1, 2, 1], [0, 1, 2]];
        PRE.rep = mm(mm(P3, [[2, 0, 0], [0, 2, 0], [0, 0, -1]]), M.inverse(P3).map((r) => r.map((x) => Math.round(x))));
        let A = clone(PRE.ax), view = '', st = null;
        v.select('', [{ value: 'ax', label: 'Axler 8.53' }, { value: 'four', label: '4-by-4' }, { value: 'rep', label: 'eigenvalue 2 repeated' }], 'ax', { onChange: (k) => { A = clone(PRE[k]); } });
        const poly = v.select('polynomial', [{ value: 'q', label: 'characteristic $q$' }, { value: 'min', label: 'minimal' }], 'q');
        const S = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 380, weight: 1.2, minWidth: 290, title: 'zeros of $q$, $q\'$, $q\'\'$, … closing in on $\\operatorname{tr} A / n$' });
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 260 });
        const TE = v.table(E, { rows: 3, cols: 3, region: [0.04, 0.5, 0.96, 0.92], maxCell: 48, size: 15 });
        const TC = v.table(E, { rows: 1, cols: 4, region: [0.02, 0.12, 0.98, 0.4], maxCell: 52, size: 13.5 });
        editable(E, TE, { bump: (i, j, k) => { A[i][j] = M.clamp(A[i][j] + k, -9, 9); } });
        /** Minimal polynomial from its definition: the first power A^k in span(I, …, A^{k−1}) (least squares). */
        const minPoly = (X) => {
          const n = X.length, pw = [eye(n)], vecs = [eye(n).flat()], sc = 1 + maxAbs(X);
          for (let k = 1; k <= n; k++) {
            const P = mm(X, pw[k - 1]), x = P.flat(), G = fromCols(vecs), c = M.lstsq(G, x), res = len(subv(mv(G, c), x));
            if (res <= 1e-7 * sc ** k) return [...c.map((t) => -t), 1];
            pw.push(P); vecs.push(x);
          }
          return M.charPoly(X);
        };
        const deriv = (c) => c.slice(1).map((x, k) => x * (k + 1));
        v.render(() => {
          const n = A.length, cp = M.charPoly(A).map((x) => Math.round(x * 1e9) / 1e9), p = poly.value === 'q' ? cp : minPoly(A), deg = p.length - 1, t = tr(A);
          // zeros of p, p', p'', ...
          const layers = []; let c = p.slice();
          for (let j = 0; j < deg; j++) { layers.push(M.polyRoots(c).map((z) => [z.re, z.im])); c = deriv(c); }
          const all = layers.flat(), ext = Math.max(2, ...all.map((z) => Math.max(Math.abs(z[0] - t / n), Math.abs(z[1])))), R = nice(1.3 * ext, [2, 3, 4, 5, 6, 8, 10, 15, 20]), key = `${R}|${tn(t / n, 1)}`;
          if (key !== view) { view = key; S.setView([t / n - R * 1.3, t / n + R * 1.3], [-R, R]); }
          const LC = ['pink', 'purple', 'blue', 'teal', 'gold'];
          layers.forEach((zs, j) => {
            if (zs.length > 2) { const hl = M.hull(zs); S.poly(hl, { fill: LC[j], fillAlpha: 0.08, color: LC[j], width: 1.2, alpha: 0.6 }); }
            else if (zs.length === 2) S.line(zs[0][0], zs[0][1], zs[1][0], zs[1][1], { color: LC[j], width: 1.4, alpha: 0.6 });
            zs.forEach((z) => S.dot(z[0], z[1], { r: Math.max(3.5, 8 - 1.6 * j), color: LC[j] }));
          });
          const last = layers[deg - 1][0];
          S.dot(t / n, 0, { r: 13, hollow: true, color: 'green', width: 2.6 });
          S.text(`tr A / ${n} = ${pn(t / n, 3)}`, t / n, 0, { dy: 28, align: 'center', size: 12.5, color: 'green', weight: 700 });
          const hit = cabs([last[0] - t / n, last[1]]) < 1e-6;
          S.corner(hit ? `zero of p^(${deg - 1}) = tr A / n` : `zero of p^(${deg - 1}) ≠ tr A / n`, 'tr', { color: hit ? 'green' : 'red', weight: 700 });
          // editor and coefficients
          TE.draw({ rows: n, cols: n, value: (i, j) => A[i][j], fill: diagFill('green', 0.22) });
          ttl(E, TE, 'A', 'ink', false, 16);
          TC.draw({
            rows: 1, cols: deg + 1, value: (i, j) => p[deg - j], format: (x) => pn(x, 2),
            colLabels: (j) => (deg - j === 0 ? '$1$' : deg - j === 1 ? '$z$' : `$z^{${deg - j}}$`),
            fill: (i, j) => (j === 1 ? [hit ? 'green' : 'red', 0.3] : null),
          });
          ttl(E, TC, poly.value === 'q' ? '\\text{coefficients of } q' : '\\text{coefficients of the minimal polynomial}', 'ink', false, 13.5);
          E.texPx(`-\\operatorname{tr} A = -(${A.map((r, i) => r[i]).join(' + ').replace(/\+ -/g, '- ')}) = ${tn(-t, 2)}`, E.width / 2, E.height - 18, { size: 14, color: hit ? 'green' : 'red' });
          st = { p, deg, n, t, hit, coef: p[deg - 1], cp };
        });
        v.legend([['pink', 'zeros of $p$', { dot: true }], ['purple', "zeros of $p'$", { dot: true }], ['blue', "zeros of $p''$", { dot: true }], ['green', '$\\operatorname{tr} A/n$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { deg, n, t, hit, coef } = st;
          if (poly.value === 'q') return `$q(z) = z^{${n}} ${coef <= 0 ? '-' : '+'} ${tn(Math.abs(coef), 3)}\\,z^{${n - 1}} + \\cdots$: the coefficient of $z^{${n - 1}}$ is $${tn(coef, 3)} = -\\operatorname{tr} A$. Its derivative of order $${n - 1}$ vanishes only at $\\operatorname{tr} A/${n} = ${tn(t / n, 3)}$, the centroid of the eigenvalues.`;
          return hit ? `Here the minimal polynomial equals $q$ (degree $${deg}$), so it shows the trace too.` : `The minimal polynomial has degree $${deg} < ${n}$: its $z^{${deg - 1}}$ coefficient is $${tn(coef, 3)}$, not $-\\operatorname{tr} A = ${tn(-t, 3)}$ — a repeated eigenvalue is counted only once there, so multiplicities matter.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.55
    {
      num: '8.55',
      kind: 'Theorem',
      name: 'Trace on an inner product space',
      statement: String.raw`Suppose $V$ is an inner product space, $T \in \mathcal L(V)$, and $e_1, \dots, e_n$ is an orthonormal basis of $V$. Then
$$\operatorname{tr} T = \langle Te_1, e_1\rangle + \cdots + \langle Te_n, e_n\rangle.$$`,
      idea: String.raw`For an orthonormal basis the coordinates of a vector are its inner products with the basis vectors (6.30): $Te_k = \sum_j \langle Te_k, e_j\rangle e_j$. So the entry in row $k$, column $k$ of $\mathcal M(T, (e_1, \dots, e_n))$ is $\langle Te_k, e_k\rangle$, and the formula is the definition of the trace (8.51) read in this basis. For a basis that is not orthonormal the numbers $\langle Te_k, e_k\rangle$ are no longer the diagonal entries, and their sum is not the trace.`,
      caption: String.raw`A fixed operator $T$ on $\mathbf R^2$. Drag $e_1$ around the unit circle; $e_2$ follows at the angle set by the slider ($90°$: an orthonormal basis). On the left, $\langle Te_k, e_k\rangle$ is drawn as the signed shadow of $Te_k$ on the line of $e_k$ (thick segments). On the right, both terms and their sum as functions of the angle $\theta$ of $e_1$: the terms oscillate, the sum is the flat line $\operatorname{tr} T$. Tilt $e_2$ away from $90°$ and the sum starts to wave — the formula needs orthonormality.`,
      deps: ['ladr-6.30', 'ladr-8.51'],
      tags: ['trace', 'orthonormal'],
      viz(v) {
        const T = [[1.2, 0.9], [-0.4, 0.6]], t = T[0][0] + T[1][1];
        const S = v.stage({ x: [-2.3, 2.3], y: [-1.9, 2.1], equal: true, height: 360, weight: 1.05, minWidth: 280 });
        const G = v.stage({ x: [0, 180], y: [-1.5, 3], height: 360, minWidth: 260, axes: 'box', xticks: [0, 45, 90, 135, 180], title: 'the terms against the angle $\\theta$ of $e_1$ (degrees)' });
        const he = S.handle(Math.cos(0.5), Math.sin(0.5), { color: 'blue', label: '$e_1$', constrain: (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; } });
        const phi = v.slider('angle from $e_1$ to $e_2$', 30, 150, 90, { step: 1, fmt: (x) => `${x}°` });
        let st = null;
        const terms = (th) => { const f = TAU / 360, e1 = [Math.cos(th * f), Math.sin(th * f)], e2 = [Math.cos((th + phi.value) * f), Math.sin((th + phi.value) * f)]; return [dot(mv(T, e1), e1), dot(mv(T, e2), e2)]; };
        v.render(() => {
          const th = ((Math.atan2(he.y, he.x) * 360) / TAU + 360) % 360, f = TAU / 360;
          const e = [[Math.cos(th * f), Math.sin(th * f)], [Math.cos((th + phi.value) * f), Math.sin((th + phi.value) * f)]];
          const ortho = phi.value === 90;
          S.circle(0, 0, 1, { color: 'faint', width: 1 });
          const CC = ['blue', 'orange'];
          e.forEach((u, k) => {
            S.line(-2.2 * u[0], -2.2 * u[1], 2.2 * u[0], 2.2 * u[1], { color: CC[k], width: 1, alpha: 0.3 });
            const Tu = mv(T, u), c = dot(Tu, u), foot = scl(u, c);
            S.arrow(0, 0, Tu[0], Tu[1], { color: CC[k], width: 1.8, alpha: 0.55, dash: [5, 4] });
            S.line(Tu[0], Tu[1], foot[0], foot[1], { color: 'muted', width: 1, dash: [3, 3] });
            S.line(0, 0, foot[0], foot[1], { color: CC[k], width: 6, alpha: 0.6 });
            S.tex(`\\langle Te_${k + 1}, e_${k + 1}\\rangle`, foot[0], foot[1], { dx: k ? -18 : 18, dy: 16, size: 12.5, color: CC[k] });
            S.tex(`Te_${k + 1}`, Tu[0], Tu[1], { dx: 14, dy: -10, size: 13, color: CC[k] });
            if (k === 1) S.arrow(0, 0, u[0], u[1], { color: 'orange', width: 2.6 }); else S.arrow(0, 0, u[0] * 0.92, u[1] * 0.92, { color: 'blue', width: 2.6 });
          });
          S.tex('e_2', e[1][0] * 1.15, e[1][1] * 1.15, { size: 14, color: 'orange' });
          // the curves
          G.hline(0, { color: 'faint', width: 1 });
          G.hline(t, { color: 'green', width: 1, dash: [5, 4] });
          G.text(`tr T = ${pn(t, 2)}`, 178, t, { dy: -10, align: 'right', size: 12, color: 'green', weight: 700 });
          G.fn((x) => terms(x)[0], { color: 'blue', width: 2 });
          G.fn((x) => terms(x)[1], { color: 'orange', width: 2 });
          G.fn((x) => terms(x)[0] + terms(x)[1], { color: ortho ? 'green' : 'red', width: 3.4 });
          const thm = th % 180, cur = terms(thm);
          G.vline(thm, { color: 'gold', width: 1.4, dash: [4, 4] });
          G.dot(thm, cur[0], { r: 4.5, color: 'blue' }); G.dot(thm, cur[1], { r: 4.5, color: 'orange' }); G.dot(thm, cur[0] + cur[1], { r: 5.5, color: ortho ? 'green' : 'red' });
          S.corner(ortho ? 'orthonormal basis' : 'not orthonormal', 'tl', { color: ortho ? 'green' : 'red', weight: 700 });
          st = { th, cur, ortho };
        });
        v.legend([['blue', '$\\langle Te_1, e_1\\rangle$'], ['orange', '$\\langle Te_2, e_2\\rangle$'], ['green', 'sum']]);
        v.readout(() => {
          if (!st) return '';
          const [a, b] = st.cur, s = a + b;
          return `$\\theta = ${tn(st.th, 0)}°$: $\\langle Te_1, e_1\\rangle + \\langle Te_2, e_2\\rangle = ${tn(a, 3)} + ${tn(b, 3)} = ${tn(s, 3)}$${st.ortho ? ` $= \\operatorname{tr} T$ for every $\\theta$.` : `, but $\\operatorname{tr} T = ${tn(t, 3)}$: with $e_1, e_2$ not orthonormal the sum depends on the basis.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.56
    {
      num: '8.56',
      kind: 'Theorem',
      name: 'Trace is linear',
      statement: String.raw`The function $\operatorname{tr} \colon \mathcal L(V) \to \mathbf F$ is a linear functional on $\mathcal L(V)$, and
$$\operatorname{tr}(ST) = \operatorname{tr}(TS) \quad \text{for all } S, T \in \mathcal L(V).$$`,
      idea: String.raw`Fix a basis and use matrices. $\mathcal M(\lambda T) = \lambda\mathcal M(T)$ and $\mathcal M(S + T) = \mathcal M(S) + \mathcal M(T)$ (3.38, 3.35), and the trace of a matrix is visibly linear in its entries; so $\operatorname{tr}(aS + bT) = a\operatorname{tr} S + b\operatorname{tr} T$. For products, $\mathcal M(ST) = \mathcal M(S)\mathcal M(T)$ (3.43), and $\operatorname{tr}\big(\mathcal M(S)\mathcal M(T)\big) = \operatorname{tr}\big(\mathcal M(T)\mathcal M(S)\big)$ by 8.49. Up to a scalar factor the trace is the only linear functional with $\varphi(ST) = \varphi(TS)$ (Exercise 8D.10). The determinant, for comparison, is not linear.`,
      caption: String.raw`$S$ and $T$ are two operators on $\mathbf R^2$ (new pair: *resample*). Left: the $(a, b)$-plane, coloured by the value of a function of $aS + bT$, with its level lines; drag the point $(a, b)$. For the trace the level lines are parallel straight lines — the graph is a plane, i.e. the function is linear — with gradient $(\operatorname{tr} S, \operatorname{tr} T)$ (arrow). Choose *determinant* or *spectral radius* to see level sets of functions that are not linear. Right: the matrices, and $ST$ next to $TS$ — different matrices, equal traces.`,
      deps: ['ladr-3.38', 'ladr-3.35', 'ladr-3.43', 'ladr-8.49', 'ladr-8.51'],
      tags: ['trace'],
      viz(v) {
        const M = v.M;
        let seed = 5;
        const fn = v.select('colour by', [{ value: 'tr', label: '$\\operatorname{tr}(aS + bT)$' }, { value: 'det', label: '$\\det(aS + bT)$' }, { value: 'rho', label: 'spectral radius' }], 'tr');
        v.button('resample $S, T$', () => { seed++; });
        const F = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 360, weight: 1.05, minWidth: 280, title: 'the $(a, b)$-plane' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.05, minWidth: 290 });
        const h = F.handle(1.2, 0.6, { color: 'gold', label: '(a, b)', constrain: (x, y) => [Math.round(x * 20) / 20, Math.round(y * 20) / 20] });
        const Tt = [0, 1, 2, 3, 4].map(() => v.table(R, { rows: 2, cols: 2, maxCell: 40, size: 13 }));
        let st = null;
        const pair = () => { const r = v.rng(seed * 7 + 1), g = () => r.int(-3, 3); let S0, T0; do { S0 = [[g(), g()], [g(), g()]]; T0 = [[g(), g()], [g(), g()]]; } while (maxAbs(msub(mm(S0, T0), mm(T0, S0))) === 0 || tr(S0) === 0 || tr(T0) === 0); return [S0, T0]; };
        v.render(() => {
          const [S0, T0] = pair(), a = h.x, b = h.y, X = (p, q) => madd(mscl(S0, p), mscl(T0, q));
          const f = { tr: (Y) => tr(Y), det: (Y) => Y[0][0] * Y[1][1] - Y[0][1] * Y[1][0], rho: (Y) => Math.max(...M.eig(Y, { vectors: false }).values.map((z) => z.abs())) }[fn.value];
          const g = (p, q) => f(X(p, q));
          let big = 1; for (const p of [-2, 2]) for (const q of [-2, 2]) big = Math.max(big, Math.abs(g(p, q)));
          if (fn.value !== 'tr') big = Math.max(big, Math.abs(g(0, 2)), Math.abs(g(2, 0)), Math.abs(g(1.4, 1.4)), Math.abs(g(1.4, -1.4)));
          const lo = fn.value === 'rho' ? 0 : -big;
          F.heat((p, q) => g(p, q), { range: [lo, big], cmap: fn.value === 'rho' ? 'viridis' : 'diverging', res: 3, key: `${seed}|${fn.value}`, alpha: 0.45 });
          const step = nice(big / 6, [0.25, 0.5, 1, 2, 3, 4, 5, 10, 20]), lv = []; for (let L = Math.ceil(lo / step) * step; L <= big; L += step) lv.push(L);
          F.contour(g, lv, { color: 'ink', width: 1, res: 90 });
          F.axes();
          if (fn.value === 'tr') { const gr = [tr(S0), tr(T0)], l = len(gr); F.arrow(a, b, a + (0.7 * gr[0]) / l, b + (0.7 * gr[1]) / l, { color: 'ink', width: 2.2 }); }
          // linearity test at (a, b)
          const lhs = g(a, b), rhs = a * g(1, 0) + b * g(0, 1), lin = Math.abs(lhs - rhs) < 1e-9 * (1 + Math.abs(lhs));
          F.corner(lin ? 'f(aS + bT) = a f(S) + b f(T)' : 'f(aS + bT) ≠ a f(S) + b f(T)', 'tl', { color: lin ? 'green' : 'red', weight: 700, size: 12 });
          // the matrices
          const Y = X(a, b), ST = mm(S0, T0), TS = mm(T0, S0);
          const specs = [[S0, 'S', 0.02, 0.56], [T0, 'T', 0.35, 0.56], [Y, 'aS + bT', 0.68, 0.56], [ST, 'ST', 0.12, 0.08], [TS, 'TS', 0.56, 0.08]];
          specs.forEach(([Mx, nm, x0, y0], k) => {
            Tt[k].draw({ region: [x0, y0 + 0.08, x0 + 0.3, y0 + 0.32], value: (i, j) => Mx[i][j], format: (x) => pn(x, 2), fill: diagFill(k < 3 ? 'green' : k === 3 ? 'blue' : 'orange', 0.25) });
            ttl(R, Tt[k], nm, 'ink', false, 14);
            const g2 = Tt[k].geo;
            R.texPx(`\\operatorname{tr} = ${tn(tr(Mx), 2)}`, g2.X0 + g2.cw, g2.Y0 + 2 * g2.ch + 15, { size: 13, color: k < 3 ? 'green' : k === 3 ? 'blue' : 'orange' });
          });
          R.line(0.04, 0.5, 0.96, 0.5, { color: 'grid', width: 1 });
          R.texPx(`ST - TS \\ne 0,\\ \\text{yet } \\operatorname{tr}(ST) = \\operatorname{tr}(TS)`, R.width / 2, R.height - 14, { size: 13, color: 'muted' });
          st = { a, b, lhs, rhs, lin, tS: tr(S0), tT: tr(T0), tST: tr(ST), tTS: tr(TS), name: fn.value };
        });
        v.legend([['gold', 'the point $(a, b)$', { dot: true }], ['ink', 'level lines']]);
        v.readout(() => {
          if (!st) return '';
          const nm = { tr: '\\operatorname{tr}', det: '\\det', rho: '\\rho' }[st.name];
          return `At $(a, b) = (${tn(st.a)}, ${tn(st.b)})$: $${nm}(aS + bT) = ${tn(st.lhs, 3)}$ and $a\\,${nm}(S) + b\\,${nm}(T) = ${tn(st.rhs, 3)}$ — ${st.lin ? (st.name === 'tr' ? '**linear**' : 'equal here by accident') : '**not linear**'}. Always $\\operatorname{tr}(ST) = ${st.tST} = \\operatorname{tr}(TS)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.57
    {
      num: '8.57',
      kind: 'Theorem',
      name: 'The identity is not ST − TS',
      statement: String.raw`Suppose $V$ is finite-dimensional with $\dim V \ge 1$. Then there do not exist operators $S, T \in \mathcal L(V)$ such that
$$ST - TS = I.$$`,
      idea: String.raw`By 8.56, $\operatorname{tr}(ST - TS) = \operatorname{tr}(ST) - \operatorname{tr}(TS) = 0$ for every $S, T$, while $\operatorname{tr} I = \dim V \ne 0$. The trace is the only obstruction: every matrix of trace $0$ is a commutator $ST - TS$ (Shoda, 1936, over fields of characteristic $0$). In infinite dimensions the conclusion fails: on polynomials, differentiation $D$ and multiplication by $x$ satisfy $Dx - xD = I$ — the relation behind Heisenberg's $QP - PQ = i\hbar I$, which is why quantum position and momentum need infinite-dimensional spaces.`,
      caption: String.raw`*Search*: gradient descent on $\|ST - TS - K\|^2$ over all $n$-by-$n$ pairs $S, T$, from a random start (*new start*); scrub through the iterations. Aiming at $K = I$ the error never drops below $n$, because $\operatorname{tr}(ST - TS)$ stays exactly $0$ (readout) and $\|C - I\|^2 = \|C\|^2 + n$ for every trace-zero $C$. Aim at a trace-zero $K$ instead and the same search succeeds. *Polynomials*: $D$ and $x$ cut down to polynomials of degree $< n$ — then $Dx - xD$ is the identity except for its last diagonal entry, $-(n-1)$, which keeps the trace at $0$; the defect only escapes to infinity as $n \to \infty$.`,
      deps: ['ladr-8.56'],
      tags: ['trace'],
      credit: 'Shoda, 1936 (commutators are exactly the trace-zero matrices)',
      viz(v) {
        const M = v.M;
        let seed = 3;
        const mode = v.select('', [{ value: 'gd', label: 'search for $ST - TS = K$' }, { value: 'poly', label: 'polynomials: $Dx - xD$' }], 'gd');
        const nsel = v.select('$n$', [2, 3, 4], 3);
        const tgt = v.select('target $K$', [{ value: 'I', label: '$K = I$' }, { value: 'Z', label: '$K = \\operatorname{diag}(1, -1, 0, \\dots)$' }], 'I');
        const it = v.slider('iteration', 0, 300, 30, { int: true });
        const btn = v.button('new start', () => { seed++; });
        const np = v.slider('polynomials of degree $< n$', 2, 9, 5, { int: true });
        const A = v.stage({ x: [0, 300], y: [-8, 2.3], axes: 'box', height: 330, weight: 1.15, minWidth: 290 });
        const LT = [-8, -6, -4, -2, 0, 2].map((k) => [k, k === 0 ? '1' : k === 2 ? '100' : `10${String(k).split('').map((c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]).join('')}`]);
        const lg = (x) => Math.log10(Math.max(x, 1e-8));
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 260 });
        const TB = v.table(B, { rows: 3, cols: 3, maxCell: 54, size: 13 });
        const cache = new Map();
        /** Gradient descent with step-size control on L = ‖ST − TS − K‖²; ∂L/∂S = 2(E Tᵀ − Tᵀ E), ∂L/∂T = 2(Sᵀ E − E Sᵀ). */
        const run = (n, K, sd) => {
          const key = `${n}|${tgt.value}|${sd}`; if (cache.has(key)) return cache.get(key);
          const r = v.rng(sd), rnd = () => Array.from({ length: n }, () => Array.from({ length: n }, () => 0.8 * r.normal()));
          let S = rnd(), T = rnd(), lr = 0.02;
          const ev = (S, T) => { const C = msub(mm(S, T), mm(T, S)); return { C, E: msub(C, K) }; };
          let cur = ev(S, T), L = fro2(cur.E); const hist = [];
          for (let k = 0; k <= 300; k++) {
            hist.push({ L, C: cur.C, trC: tr(cur.C) });
            const E = cur.E, Tt = transp(T), St = transp(S);
            const gS = mscl(msub(mm(E, Tt), mm(Tt, E)), 2), gT = mscl(msub(mm(St, E), mm(E, St)), 2);
            for (let tries = 0; tries < 30; tries++) {
              const S2 = msub(S, mscl(gS, lr)), T2 = msub(T, mscl(gT, lr)), c2 = ev(S2, T2), L2 = fro2(c2.E);
              if (L2 <= L) { S = S2; T = T2; cur = c2; L = L2; lr *= 1.25; break; }
              lr *= 0.5;
            }
          }
          cache.set(key, hist); return hist;
        };
        let st = null, lastGd = null;
        const LEG = () => v.legend([['accent', '$\\|ST - TS - K\\|^2$'], ['purple', '$\\|ST - TS\\|^2$ (for $K = I$ the error is this plus $n$)', { dash: true }], ['red', 'unreachable: below $(\\operatorname{tr} K)^2/n$', { area: true }]]);
        v.render(() => {
          const gd = mode.value === 'gd';
          if (gd !== lastGd) { lastGd = gd; if (gd) LEG(); else v.legend([['green', 'entries $+1$'], ['red', 'the last entry $-(n-1)$']]); }
          nsel.el.hidden = tgt.el.hidden = it.el.hidden = btn.hidden = !gd; np.el.hidden = gd;
          if (gd) {
            const n = nsel.value, K = eye(n).map((r, i) => r.map((x, j) => (tgt.value === 'I' ? x : i === j ? (i === 0 ? 1 : i === 1 ? -1 : 0) : 0)));
            const hist = run(n, K, seed), k = it.value, h = hist[k], floor = tgt.value === 'I' ? n : 0;
            A.setView([0, 300], [-8, 2.3]); A.setTicks(null, LT);
            A.setTitle('$\\|ST - TS - K\\|^2$ during the search (log scale)'); A.setTicks([0, 50, 100, 150, 200, 250, 300], LT);
            if (floor) { A.hband(-8, lg(floor), { color: 'red', alpha: 0.07 }); A.hline(lg(floor), { color: 'red', width: 1.6, dash: [6, 4] }); A.text(`floor n = ${n}: tr(ST − TS) = 0 ≠ tr I`, 296, lg(floor), { dy: 12, align: 'right', size: 12, color: 'red', weight: 600 }); }
            if (floor) A.path(hist.map((q, i) => [i, lg(fro2(q.C))]), { color: 'purple', width: 2, dash: [6, 4] });
            A.path(hist.map((q, i) => [i, lg(q.L)]), { color: floor ? 'accent' : 'green', width: 2.8 });
            A.dot(k, lg(h.L), { r: 6, color: 'gold' });
            if (floor) A.dot(k, lg(fro2(h.C)), { r: 4.5, color: 'purple' });
            TB.draw({ rows: n, cols: n, region: [0.05, 0.3, 0.95, 0.86], value: (i, j) => h.C[i][j], format: (x) => pn(x, 2), fill: (i, j) => (i === j ? [floor ? 'red' : 'green', 0.22] : null) });
            ttl(B, TB, `ST - TS \\ \\text{at iteration } ${k}`, 'ink', false, 14);
            B.texPx(`\\operatorname{tr}(ST - TS) = ${tn(h.trC, 12)}`, B.width / 2, B.height - 58, { size: 14, color: 'ink' });
            B.texPx(floor ? `\\text{target } I:\\ \\operatorname{tr} I = ${n}` : '\\text{target } \\operatorname{diag}(1, -1, 0, \\dots):\\ \\operatorname{tr} = 0', B.width / 2, B.height - 28, { size: 14, color: floor ? 'red' : 'green' });
            st = { gd, n, L: h.L, trC: h.trC, k, floor };
          } else {
            const n = np.value, d = Array.from({ length: n }, (_, i) => (i < n - 1 ? 1 : -(n - 1)));
            // D and x on the basis 1, x, …, x^{n−1} (x·x^{n−1} dropped): (Dx − xD) is computed, not assumed
            const Dm = eye(n).map((r, i) => r.map((_, j) => (j === i + 1 ? j : 0))), Xm = eye(n).map((r, i) => r.map((_, j) => (i === j + 1 ? 1 : 0)));
            const Cm = msub(mm(Dm, Xm), mm(Xm, Dm));
            A.setView([0.3, n + 0.7], [-(n - 0.5), 2.2]); A.setTicks(Array.from({ length: n }, (_, i) => [i + 1, String(i + 1)]), null);
            A.setTitle('diagonal of $Dx - xD$ on polynomials of degree $< n$');
            A.hline(0, { color: 'muted', width: 1 });
            Cm.forEach((r, i) => { const y = r[i]; A.rect(i + 1 - 0.32, 0, i + 1 + 0.32, y, { fill: y > 0 ? 'green' : 'red', fillAlpha: 0.5, color: y > 0 ? 'green' : 'red', width: 1.2 }); A.text(pn(y, 0), i + 1, y, { dy: y > 0 ? -10 : -12, align: 'center', size: 12, color: y > 0 ? 'green' : 'red', weight: 700 }); });
            TB.draw({ rows: n, cols: n, region: [0.04, 0.22, 0.96, 0.88], value: (i, j) => Cm[i][j], format: (x) => pn(x, 0), textColor: (i, j) => (Cm[i][j] ? 'ink' : 'faint'), fill: (i, j) => (i === j ? [Cm[i][j] > 0 ? 'green' : 'red', 0.25] : null), maxCell: 40, size: 12 });
            ttl(B, TB, 'Dx - xD', 'ink', false, 15);
            B.texPx(`\\operatorname{tr} = ${n - 1}\\cdot 1 - ${n - 1} = ${tr(Cm)}`, B.width / 2, B.height - 22, { size: 14, color: 'ink' });
            st = { gd, n, d, trC: tr(Cm) };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (!st.gd) return `On $\\mathcal P_{${st.n - 1}}$, $(Dx - xD)x^k = (k + 1)x^k - kx^k = x^k$ for $k < ${st.n - 1}$, but the cut-off kills $x\\cdot x^{${st.n - 1}}$ and leaves $-${st.n - 1}\\,x^{${st.n - 1}}$: the diagonal is $(1, \\dots, 1, -${st.n - 1})$ with trace $${st.trC}$. On all polynomials (infinite-dimensional) $Dx - xD = I$ exactly.`;
          return st.floor
            ? `Iteration ${st.k}: $\\|ST - TS - I\\|^2 = ${tn(st.L, 4)} \\ge n = ${st.n}$, and $\\operatorname{tr}(ST - TS) = ${v.sci(Math.abs(st.trC) || 1e-17, 1)}$ (rounding). **No search can do better**: the trace of a commutator is $0$, the trace of $I$ is ${st.n}.`
            : `Iteration ${st.k}: $\\|ST - TS - K\\|^2 = ${v.sci(Math.max(st.L, 1e-17), 1)}$ — for a trace-zero target the search succeeds; only the trace stood in the way.`;
        });
      },
    },
  ],
};
