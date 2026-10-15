// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 8: Operators on Complex Vector Spaces
// Part 1 (this file, with the chapter title and summary): 8.1–8.16 — null spaces of powers, generalized
// eigenvectors, nilpotent operators. Part 2 is ch08-b.js (8.17–8.28); 8.29–8.57 live in later part files.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sups = (k) => String(k).split('').map((d) => SUPS[+d]).join('');
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
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;

// ---------- real vectors and matrices (matrices are lists of rows) ----------
const dotN = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const normN = (a) => Math.hypot(...a);
const addN = (a, b) => a.map((x, i) => x + b[i]);
const subN = (a, b) => a.map((x, i) => x - b[i]);
const sclN = (a, k) => a.map((x) => x * k);
const unitN = (a) => { const l = normN(a); return l > 1e-12 ? a.map((x) => x / l) : a.map(() => 0); };
const lerpN = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const mv = (A, x) => A.map((r) => dotN(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const ident = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const shiftI = (A, t) => A.map((r, i) => r.map((x, j) => (i === j ? x - t : x)));
const mpow = (A, k) => { let P = ident(A.length); for (let i = 0; i < k; i++) P = mm(P, A); return P; };
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const fromCols = (cols) => cols[0].map((_, i) => cols.map((c) => c[i]));
const colOf = (A, j) => A.map((r) => r[j]);
/** S·J·S⁻¹. */
const conjM = (M, S, J) => mm(mm(S, J), M.inverse(S));
/** Orthonormal basis of span(vs) (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orthN(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) { const d = dotN(w, e); w = w.map((c, i) => c - d * e[i]); }
    const l = normN(w); if (l > tol * Math.max(1, normN(x))) B.push(w.map((c) => c / l));
  }
  return B;
}
const projN = (x, B) => B.reduce((s, e) => addN(s, sclN(e, dotN(x, e))), x.map(() => 0));
/** Orthonormal basis of null A, singular values below tol·max(1, σ₁) counted as 0. */
function nullO(M, A, tol = 1e-9) {
  if (maxAbs(A) < 1e-13) return ident(A[0].length);
  const S = M.svd(A).S;
  return M.nullspace(A, tol * Math.max(1, S[0]));
}
/** Orthonormal basis of range A (the column space). */
const rangeO = (A) => orthN(A[0].map((_, j) => colOf(A, j)), 1e-8);
/** Basis of null A read off the reduced row echelon form (tidy entries for integer matrices). */
function nullRref(M, A) {
  const n = A[0].length, { R, pivots } = M.rref(A);
  const free = []; for (let j = 0; j < n; j++) if (!pivots.includes(j)) free.push(j);
  return free.map((f) => { const x = new Array(n).fill(0); x[f] = 1; pivots.forEach((p, r) => { x[p] = -R[r][f]; }); return x; });
}

// ---------- exact arithmetic for integer matrices: everything modulo a prime p with p² < 2⁵³ ----------
const PR = 67108859;
const modp = (x) => { const r = Math.round(x) % PR; return r < 0 ? r + PR : r; };
function invmod(a) { let [r0, r1, s0, s1] = [PR, a, 0, 1]; while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; } return modp(s0); }
const mulModM = (A, B) => A.map((r) => B[0].map((_, j) => { let s = 0; for (let k = 0; k < r.length; k++) s = (s + r[k] * B[k][j]) % PR; return s; }));
/** Exact rank of an integer matrix (computed modulo the prime PR). */
function rankInt(A) {
  const R = A.map((r) => r.map(modp)), m = R.length, n = R[0].length; let rk = 0;
  for (let c = 0; c < n && rk < m; c++) {
    let p = -1; for (let i = rk; i < m; i++) if (R[i][c]) { p = i; break; }
    if (p < 0) continue;
    [R[p], R[rk]] = [R[rk], R[p]];
    const iv = invmod(R[rk][c]);
    for (let i = rk + 1; i < m; i++) if (R[i][c]) { const f = (R[i][c] * iv) % PR; for (let k = c; k < n; k++) R[i][k] = modp(R[i][k] - ((f * R[rk][k]) % PR)); }
    rk++;
  }
  return rk;
}
/** dim null T^k for k = 0..K of an integer matrix T, exactly. */
function nullDimsInt(T, K) {
  const n = T.length, Tm = T.map((r) => r.map(modp)), out = [0]; let P = ident(n);
  for (let k = 1; k <= K; k++) { P = mulModM(P, Tm); out.push(n - rankInt(P)); }
  return out;
}
/** Random unimodular integer matrix (permutation · unit lower · unit upper), so S⁻¹ is integral too. */
function unimodular(r, n, amp = 1) {
  const L = ident(n), U = ident(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { L[i][j] = r.int(-amp, amp); U[j][i] = r.int(-amp, amp); }
  const perm = r.shuffle ? r.shuffle([...Array(n).keys()]) : [...Array(n).keys()];
  const Pm = perm.map((p) => ident(n)[p]);
  return mm(Pm, mm(L, U));
}
/** Integer matrix S·J·S⁻¹ for unimodular S (rounded: exact). */
const conjInt = (M, S, J) => mm(mm(S, J), M.inverse(S)).map((r) => r.map((x) => Math.round(x)));

// ---------- drawing helpers ----------
/** Draw the span of an orthonormal list B ⊂ R³ in a scene3: a dot, a line, a disc or a faint box. */
function drawSpan(sc, B, st = {}) {
  const col = st.color || 'green', R = st.r ?? 1.7;
  if (B.length === 0) sc.dot([0, 0, 0], { color: col, r: st.dotR ?? 6 });
  else if (B.length === 1) sc.line(sclN(B[0], -R), sclN(B[0], R), { color: col, width: st.width ?? 3.6, alpha: st.alpha ?? 0.75, dash: st.dash }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], R, { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.14, grid: st.grid ?? true });
  else {
    const c = st.box ?? 1.15, F = (k, sg) => { const p = [0, 0, 0]; p[k] = sg * c; return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => { const q = p.slice(); q[(k + 1) % 3] = x * c; q[(k + 2) % 3] = y * c; return q; }); };
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) sc.poly(F(k, sg), { fill: col, color: col, fillAlpha: st.boxAlpha ?? 0.035, alpha: 0.3 });
  }
  return B.length;
}
/**
 * Make the cells of table T editable; get() returns the matrix shown (mutated in place).
 * Click the upper / lower half of a cell for ±step, or drag a cell up / down. o.ok(i, j) limits which cells.
 */
function editable(v, s, T, get, o = {}) {
  const step = o.step ?? 1, lo = o.min ?? -9, hi = o.max ?? 9;
  let d = null;
  const put = (i, j, x) => { get()[i][j] = Math.round(v.M.clamp(x, lo, hi) / step) * step; o.onChange?.(i, j); };
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.hit(x, y);
      d = c && c.i >= 0 && c.j >= 0 && (!o.ok || o.ok(c.i, c.j)) ? { ...c, Y: s.Y(y), a: get()[c.i][c.j], moved: false } : null;
      return;
    }
    if (!d) return;
    const dy = d.Y - s.Y(y);
    if (ph === 'move' && (d.moved || Math.abs(dy) > 5)) { d.moved = true; put(d.i, d.j, d.a + Math.round(dy / 14) * step); }
    if (ph === 'end') {
      if (!d.moved) { const r = T.cellRect(d.i, d.j); put(d.i, d.j, d.a + (y > (r[1] + r[3]) / 2 ? step : -step)); }
      d = null;
    }
  });
}
/** Height of w under the powers P[0..K] of an operator: least j with P[j]w = 0 (Infinity if none). */
function heightOf(P, w, tol = 1e-8) {
  const s = Math.max(1e-12, normN(w));
  if (normN(w) < 1e-10) return 0;
  for (let j = 1; j < P.length; j++) if (normN(mv(P[j], w)) < tol * s) return j;
  return Infinity;
}
/** Small matrix tile: heat-coloured cells (blue > 0, red < 0), numbers (fmt) when there is room. */
function intTile(S, B, x0, y0, w, { frame = 'muted', frameW = 1.1, numbers = true, size, fmt = (b) => String(b).replace('-', '−'), scale } = {}) {
  const n = B.length, cw = w / n, mx = scale ?? Math.max(1, ...B.flat().map(Math.abs));
  const px = Math.abs(S.X(cw) - S.X(0)), fs = size ?? Math.max(8, Math.min(13, px * 0.42));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = B[i][j], x = x0 + j * cw, y = y0 + w - (i + 1) * cw;
    if (b) S.rect(x, y, x + cw, y + cw, { fill: b > 0 ? 'blue' : 'red', fillAlpha: 0.12 + (0.45 * Math.abs(b)) / mx, stroke: false });
    if (numbers && px > 15) S.text(fmt(b), x + cw / 2, y + cw / 2, { size: fs, align: 'center', baseline: 'middle', color: b ? 'ink' : 'faint', halo: false });
  }
  for (let k = 1; k < n; k++) { S.line(x0 + k * cw, y0, x0 + k * cw, y0 + w, { color: 'grid', width: 0.6 }); S.line(x0, y0 + k * cw, x0 + w, y0 + k * cw, { color: 'grid', width: 0.6 }); }
  S.rect(x0, y0, x0 + w, y0 + w, { color: frame, width: frameW });
}

/** Parallelepiped with vertex o and edges a, b, c in a scene3 (faces translucent). */
function box3(sc, o, a, b, c, st = {}) {
  const P = (i, j, k) => [0, 1, 2].map((t) => o[t] + i * a[t] + j * b[t] + k * c[t]);
  const faces = [[[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]];
  for (const f of faces) sc.poly(f.map((q) => P(...q)), { fill: st.fill || 'accent', color: st.color || st.fill || 'accent', fillAlpha: st.fillAlpha ?? 0.1, alpha: st.alpha ?? 0.7, width: st.width ?? 1.2 });
}

// ---------- complex numbers [re, im] and complex matrices ----------
const cadd = (z, w) => [z[0] + w[0], z[1] + w[1]];
const csub = (z, w) => [z[0] - w[0], z[1] - w[1]];
const cmul = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
const csc = (z, k) => [z[0] * k, z[1] * k];
const cabs = (z) => Math.hypot(z[0], z[1]);
const cNorm = (x) => Math.sqrt(x.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
const cMV = (A, x) => A.map((r) => r.reduce((s, z, k) => cadd(s, cmul(z, x[k])), [0, 0]));
const cMM = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, z, k) => cadd(s, cmul(z, B[k][j])), [0, 0])));
/** Inverse of a complex matrix, column by column with the runtime's solveC. */
function cInv(M, A) { const n = A.length; const cols = ident(n).map((e) => M.solveC(A, e).map((z) => [z.re, z.im])); return A.map((_, i) => cols.map((c) => c[i])); }
/** a + bi as TeX. */
function czT(z, d = 2) {
  const a = Number(z[0].toFixed(d)), b = Number(z[1].toFixed(d));
  if (b === 0) return tn(a, d);
  const bb = Math.abs(b) === 1 ? '' : tn(Math.abs(b), d);
  if (a === 0) return `${b < 0 ? '-' : ''}${bb}i`;
  return `${tn(a, d)} ${b < 0 ? '-' : '+'} ${bb}i`;
}

export default {
  collection: 'ladr',
  chapter: 8,
  title: 'Operators on Complex Vector Spaces',
  summary: String.raw`When an operator has too few eigenvectors, generalized eigenvectors take their place. The null spaces of the powers $T, T^2, T^3, \dots$ grow and then freeze, at the latest by step $\dim V$; nilpotent operators are those whose powers reach $0$, and over $\mathbf C$ the whole space splits into generalized eigenspaces, on each of which the operator is a scalar plus a nilpotent piece. The dimensions of these pieces are the multiplicities of the eigenvalues; they give the characteristic polynomial and the Cayley–Hamilton theorem without determinants, then square roots of invertible operators and Jordan form. The chapter ends with the trace: defined for matrices, shown to be independent of the basis, and identified with the sum of the eigenvalues.`,
  items: [
    // ------------------------------------------------------------------ 8.1
    {
      num: '8.1',
      kind: 'Theorem',
      name: 'Sequence of increasing null spaces',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. Then the null spaces of the powers of $T$ increase:
$$\{0\} = \operatorname{null} T^0 \subseteq \operatorname{null} T^1 \subseteq \cdots \subseteq \operatorname{null} T^k \subseteq \operatorname{null} T^{k+1} \subseteq \cdots,$$
where $T^0 = I$.`,
      idea: String.raw`A vector that $k$ applications of $T$ send to $0$ is still sent to $0$ by one more: if $T^k v = 0$, then $T^{k+1}v = T(T^k v) = T(0) = 0$. That is the whole proof — no finite dimension and no eigenvalues are needed, only that a linear map sends $0$ to $0$. Each null space is a subspace, so the numbers $\dim\operatorname{null}T^k$ form a staircase that never steps down; by the fundamental theorem of linear maps (3.21) the ranges shrink in step, $\dim\operatorname{range}T^k = \dim V - \dim\operatorname{null}T^k$.`,
      caption: String.raw`Edit the matrix of $T$ on $\mathbf F^4$ (click the top or bottom half of an entry, or drag it up or down), or pick a preset. Each column on the right is $V$ cut into four cells for one power $T^k$: green cells count $\dim\operatorname{null} T^k$, blue ones $\dim\operatorname{range} T^k$. However you edit, the green staircase never steps down — and once it pauses it stays flat (the shaded stretch). Click a column to choose $k$: the readout lists a basis of $\operatorname{null}T^k$ and checks that $T^{k+1}$ kills each vector in it.`,
      deps: ['ladr-3.11', 'ladr-5.1'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const PRE = {
          one: [[-1, -1, 1, 0], [-1, 1, 1, -1], [-1, -2, 1, 1], [-1, 1, 1, -1]],
          mix: [[2, -1, -2, 1], [-2, 2, 2, -2], [2, -1, -2, 2], [1, -1, -1, 1]],
          two: [[1, 1, 1, 1], [1, 2, 2, 1], [-1, -2, -2, -1], [-1, -1, -1, -1]],
          inv: [[2, 1, 0, 0], [1, 2, 1, 0], [0, 1, 2, 1], [0, 0, 1, 2]],
        };
        let A = PRE.one.map((r) => r.slice());
        v.select('preset', [{ value: 'one', label: 'one long chain' }, { value: 'mix', label: 'chain + invertible part' }, { value: 'two', label: 'two short chains' }, { value: 'inv', label: 'invertible' }], 'one', { onChange: (k) => { A = PRE[k].map((r) => r.slice()); } });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, minWidth: 230, title: '$\\mathcal M(T)$ — click or drag an entry' });
        const G = v.stage({ x: [-0.62, 6.62], y: [-0.95, 4.8], axes: false, height: 330, weight: 1.2, title: 'one column for each power $T^k$' });
        const TT = v.table(Q, { rows: 4, cols: 4, region: [0.04, 0.06, 0.96, 0.94], maxCell: 58, size: 16 });
        editable(v, Q, TT, () => A, { step: 1, min: -4, max: 4 });
        let kSel = 2, st = null;
        G.onClick((x) => { const k = Math.round(x); if (k >= 0 && k <= 6) kSel = k; });
        v.render(() => {
          const d = nullDimsInt(A, 7);
          let m = 0; while (m < 6 && d[m] !== d[m + 1]) m++;
          TT.draw({ value: (i, j) => A[i][j], format: (x) => pn(x, 0), fill: (i, j) => (A[i][j] ? ['accent', 0.06 + 0.05 * Math.abs(A[i][j])] : null), textColor: (i, j) => (A[i][j] ? 'ink' : 'faint') });
          if (m < 6) {
            G.rect(m - 0.46, -0.08, 6.5, 4.08, { fill: 'green', fillAlpha: 0.05, color: 'green', width: 1.2, dash: [5, 4], alpha: 0.7 });
            G.text(m === 0 ? 'frozen from the start' : `frozen from k = ${m} on`, (m + 6) / 2, 4.42, { align: 'center', color: 'green', size: 12.5, weight: 700 });
          }
          for (let k = 0; k <= 6; k++) {
            for (let c = 0; c < 4; c++) {
              const nul = c < d[k];
              G.rect(k - 0.33, c + 0.05, k + 0.33, c + 0.95, { fill: nul ? 'green' : 'blue', fillAlpha: nul ? 0.45 : 0.07, color: nul ? 'green' : 'blue', width: 1, alpha: nul ? 0.9 : 0.3 });
            }
            if (k === kSel) G.rect(k - 0.42, -0.04, k + 0.42, 4.04, { color: 'gold', width: 2.6 });
            G.tex(`T^{${k}}`, k, -0.45, { color: k === kSel ? 'gold' : 'muted', size: 15 });
            G.text(String(d[k]), k, d[k] > 0 ? d[k] - 0.5 : 0.5, { align: 'center', baseline: 'middle', color: d[k] > 0 ? 'ink' : 'muted', size: 13, weight: 700 });
          }
          const pts = []; for (let k = 0; k <= 6; k++) pts.push([k - 0.5, d[k]], [k + 0.5, d[k]]);
          G.path(pts, { color: 'green', width: 3 });
          const Pk = mpow(A, kSel), Pk1 = mm(A, Pk), B = d[kSel] ? nullRref(M, Pk) : [];
          const gap = B.length ? Math.max(...B.map((b) => normN(mv(Pk1, b)))) : 0;
          st = { d, m, B, gap };
        });
        v.legend([['green', '$\\operatorname{null}T^k$ (one cell per dimension)', { area: true }], ['blue', '$\\operatorname{range}T^k$', { area: true }], ['gold', 'chosen $k$ (click a column)']]);
        v.readout(() => {
          if (!st) return '';
          const { d, B, gap } = st, k = kSel;
          let s = `$\\dim\\operatorname{null}T^k$ for $k = 0, 1, \\dots, 7$: $${d.join(',\\ ')}$ — never decreasing. `;
          if (!B.length) s += `$\\operatorname{null}T^{${k}} = \\{0\\}$, which lies in every subspace.`;
          else s += `A basis of $\\operatorname{null}T^{${k}}$: $${B.map((b) => vtex(b)).join(',\\ ')}$. ` + (gap < 1e-12 ? `$T^{${k + 1}}$ sends each of them to $0$` : `$T^{${k + 1}}$ sends them to vectors of length at most $${v.sci(gap, 1)}$`) + `, so $\\operatorname{null}T^{${k}} \\subseteq \\operatorname{null}T^{${k + 1}}$.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 8.2
    {
      num: '8.2',
      kind: 'Theorem',
      name: 'Equality in the sequence of null spaces',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $m$ is a nonnegative integer with $\operatorname{null} T^m = \operatorname{null} T^{m+1}$. Then
$$\operatorname{null} T^m = \operatorname{null} T^{m+1} = \operatorname{null} T^{m+2} = \operatorname{null} T^{m+3} = \cdots.$$
Once the chain of 8.1 pauses, it never grows again.`,
      idea: String.raw`Let $k \ge 1$; by 8.1 only $\operatorname{null}T^{m+k+1} \subseteq \operatorname{null}T^{m+k}$ needs proof. If $T^{m+k+1}v = 0$, then $T^{m+1}(T^k v) = 0$, so $T^k v \in \operatorname{null}T^{m+1} = \operatorname{null}T^m$, which says $T^{m+k}v = T^m(T^k v) = 0$. In terms of *heights* — the height of $v$ is the least $j$ with $T^j v = 0$ — each application of $T$ lowers the height of a vector by exactly one. So if some vector had height $m + k + 1$, then $T^k v$ would have height $m + 1$; no vector of height $m+1$ means none higher.`,
      caption: String.raw`Step through the powers $k = 0, 1, \dots, 4$: the 3D view shows $\operatorname{null}T^k$ (green) around the previous $\operatorname{null}T^{k-1}$ (teal), and the staircase on the right fills in. Once two consecutive null spaces agree, the rest of the staircase is frozen. Drag $v$ (it snaps onto the null spaces): its orbit $v, Tv, T^2v, \dots$ drops one height at a time, which is why the chain cannot pause and then resume. Try the operators: with an invertible part, vectors off the green plane never reach $0$ at all.`,
      deps: ['ladr-8.1'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const S0 = fromCols([[1, 0.25, -0.15], [0.15, 0.95, 0.35], [-0.3, 0.2, 1]]);
        const J = {
          c3: [[0, 1, 0], [0, 0, 1], [0, 0, 0]],
          c2: [[0, 1, 0], [0, 0, 0], [0, 0, -1]],
          z2: [[0, 0, 0], [0, 0, 0], [0, 0, -1]],
          inv: [[0, -1, 0], [1, 0, 0], [0, 0, -1]],
        };
        const pre = v.select('$T$', [{ value: 'c3', label: 'a chain of length 3' }, { value: 'c2', label: 'chain of length 2, then a flip' }, { value: 'z2', label: '$0$ on a plane, then a flip' }, { value: 'inv', label: 'invertible' }], 'c3');
        const S = v.stage({ x: [-2, 2], y: [-1.85, 1.95], equal: true, axes: false, height: 370, weight: 1.25, title: '$\\operatorname{null}T^k$ and the orbit $v, Tv, T^2v, \\dots$' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.33, axis: 1.45, lim: 1.25 });
        const G = v.stage({ x: [-0.6, 4.6], y: [-0.45, 3.85], height: 370, weight: 0.75, minWidth: 220, axes: 'box', xticks: [0, 1, 2, 3, 4], yticks: [0, 1, 2, 3], xlabel: 'k', title: '$\\dim\\operatorname{null}T^k$' });
        let cur = null;
        const snap = (p) => {
          if (!cur) return p;
          for (let j = 1; j <= 2; j++) { const B = cur.N[j]; if (B.length === 0 || B.length === 3) continue; const q = projN(p, B); if (normN(subN(p, q)) < 0.12 && normN(q) > 0.15) return q; }
          return p;
        };
        const hv = sc.handle([0.55, 0.85, 0.9], { color: 'gold', label: 'v', snap });
        const noteFor = (k) => {
          if (!cur) return '';
          const { d, m } = cur;
          if (k === 0) return '$T^0 = I$, so $\\operatorname{null}T^0 = \\{0\\}$.';
          if (d[k] > d[k - 1]) return `$\\operatorname{null}T^{${k}}$ is strictly bigger than $\\operatorname{null}T^{${k - 1}}$: dimension $${d[k - 1]} \\to ${d[k]}$.`;
          if (k - 1 === m) return `**$\\operatorname{null}T^{${m}} = \\operatorname{null}T^{${m + 1}}$** — the chain has paused, so by 8.2 it is frozen from here on.`;
          return `Still equal to $\\operatorname{null}T^{${m}}$: frozen, as 8.2 promises.`;
        };
        const ST = v.steps({ frames: [0, 1, 2, 3, 4].map((k) => ({ k, note: () => noteFor(k) })), speed: 0.8, start: 2, still: 2 });
        let st = null;
        v.render(() => {
          const T = conjM(M, S0, J[pre.value]);
          const P = [ident(3)]; for (let k = 1; k <= 5; k++) P.push(mm(P[k - 1], T));
          const N = P.map((X) => nullO(M, X)), d = N.map((B) => B.length);
          let m = 0; while (m < 4 && d[m] !== d[m + 1]) m++;
          cur = { N, d, m };
          const k = ST.frame.k ?? 2;
          sc.begin();
          if (k > 0 && d[k - 1] < d[k] && d[k - 1] > 0) drawSpan(sc, N[k - 1], { color: 'teal', width: 4.5, r: 1.75 });
          drawSpan(sc, N[k], { color: 'green', r: 1.6 });
          const orb = [hv.p]; for (let j = 1; j <= 4; j++) orb.push(mv(T, orb[j - 1]));
          const hs = orb.map((w) => heightOf(P, w));
          const names = ['v', 'Tv', 'T^2v', 'T^3v', 'T^4v'];
          for (let j = 4; j >= 1; j--) {
            if (hs[j] === 0) continue;
            sc.arrow([0, 0, 0], orb[j], { color: 'orange', width: 2.2, alpha: 1 - 0.15 * j });
            if (j <= 3) sc.tex(names[j], orb[j], { color: 'orange', size: 13, dx: 12, dy: -10 });
          }
          for (let j = 0; j < 4; j++) if (hs[j] > 0 && hs[j + 1] > 0) sc.line(orb[j], orb[j + 1], { color: 'orange', width: 1, dash: [3, 4], alpha: 0.6 });
          if (hs.some((h) => h === 0)) sc.dot([0, 0, 0], { r: 6, color: 'green' });
          sc.arrow([0, 0, 0], orb[0], { color: 'gold', width: 2.8 });
          sc.flush();
          // ---- the staircase
          if (m < 4) G.rect(m - 0.45, -0.12, 4.5, 3.62, { fill: 'green', fillAlpha: 0.06, color: 'green', dash: [5, 4], width: 1, alpha: 0.6 });
          if (m < 4) G.text(m === 0 ? 'frozen from the start' : 'frozen', (m + 4.5) / 2, 3.4, { align: 'center', color: 'green', size: 12, weight: 700 });
          for (let j = 0; j <= 4; j++) {
            const on = j <= k;
            if (d[j]) G.rect(j - 0.3, 0, j + 0.3, d[j], { fill: 'green', fillAlpha: on ? 0.5 : 0.1, color: 'green', width: 1, alpha: on ? 1 : 0.3 });
            else G.line(j - 0.3, 0, j + 0.3, 0, { color: 'green', width: 3, alpha: on ? 1 : 0.3 });
            if (j === k) G.rect(j - 0.4, -0.08, j + 0.4, d[j] + 0.14, { color: 'gold', width: 2.2 });
          }
          st = { hs, d, m, k };
        });
        v.legend([['green', '$\\operatorname{null}T^k$', { area: true }], ['teal', '$\\operatorname{null}T^{k-1}$'], ['gold', '$v$'], ['orange', '$Tv, T^2v, \\dots$']]);
        v.readout(() => {
          if (!st) return '';
          const H = (h) => (h === Infinity ? '\\infty' : String(h));
          const names = ['v', 'Tv', 'T^2v', 'T^3v'];
          const list = st.hs.slice(0, 4).map((h, j) => `${names[j]} \\mapsto ${H(h)}`).join(',\\ ');
          const fin = st.hs[0] !== Infinity;
          return `Heights (least $j$ with $T^j w = 0$): $${list}$. ` + (fin ? (st.hs[0] === 0 ? 'Move $v$ away from $0$.' : 'Each application of $T$ lowers the height by exactly one, so heights cannot skip a level.') : '$v$ is in no $\\operatorname{null}T^j$: its orbit never reaches $0$.') + ` Dimensions: $${st.d.join(',\\ ')}$, frozen from $k = ${st.m}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.3
    {
      num: '8.3',
      kind: 'Theorem',
      name: 'Null spaces stop growing',
      statement: String.raw`Suppose $T \in \mathcal L(V)$, where $V$ is finite-dimensional. Then
$$\operatorname{null} T^{\dim V} = \operatorname{null} T^{\dim V + 1} = \operatorname{null} T^{\dim V + 2} = \cdots.$$`,
      idea: String.raw`By 8.2 it is enough to show $\operatorname{null}T^{n} = \operatorname{null}T^{n+1}$ for $n = \dim V$. If not, then by 8.1 and 8.2 every inclusion $\{0\} = \operatorname{null}T^0 \subsetneq \operatorname{null}T^1 \subsetneq \cdots \subsetneq \operatorname{null}T^{n+1}$ is strict. Each strict inclusion of subspaces raises the dimension by at least one, so $\dim\operatorname{null}T^{n+1} \ge n + 1 > \dim V$ — impossible for a subspace of $V$ (2.37). The bound is sharp: a single chain $v \mapsto Tv \mapsto \cdots \mapsto 0$ of length $n$ needs all $n$ steps.`,
      caption: String.raw`Each thin line is the null-space staircase of a random operator on $\mathbf F^n$ (random chains plus an invertible part, conjugated by a random integer matrix so the structure is hidden; ranks are computed exactly). The dots mark where each staircase freezes — never to the right of the orange line $k = n$. On the right, the chains of the highlighted operator (the one that freezes last): the cells at height $j$ are the new dimensions of $\operatorname{null}T^j$, so it freezes at the length of its longest chain. Choose one chain of length $n$ to see the bound attained, and $\dim V = \infty$ to break the hypothesis.`,
      deps: ['ladr-8.2', 'ladr-8.1', 'ladr-2.37'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n = \\dim V$', 2, 8, 7, { int: true });
        const kind = v.select('operators', [{ value: 'rand', label: 'random' }, { value: 'worst', label: 'one chain of length $n$' }, { value: 'inf', label: '$\\dim V = \\infty$: backward shift' }], 'rand');
        let seed = 11;
        const btn = v.button('New random operators', () => { seed += 1; });
        const K = 11, NOPS = 24;
        const G = v.stage({ x: [-0.6, K + 0.5], y: [-0.4, 9.4], height: 350, weight: 1.35, axes: 'box', xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 2, 4, 6, 8], xlabel: 'k', title: '$\\dim\\operatorname{null}T^k$ against $k$' });
        const Y = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 350, weight: 0.65, minWidth: 210, title: 'chains of the highlighted operator' });
        const cache = new Map();
        const stair = (d, jit) => { const p = []; for (let k = 0; k <= K; k++) p.push([k, d[k] + jit], [Math.min(k + 1, K + 0.5), d[k] + jit]); return p; };
        const build = (r, n, parts, inv) => {
          const J = Array.from({ length: n }, () => new Array(n).fill(0)); let o = 0;
          for (const c of parts) { for (let i = 0; i + 1 < c; i++) J[o + i][o + i + 1] = 1; o += c; }
          for (let i = 0; i < inv; i++) { J[o + i][o + i] = r() < 0.5 ? 1 : -1; if (i + 1 < inv && r() < 0.5) J[o + i][o + i + 1] = 1; }
          const S = unimodular(r, n, 1), T = conjInt(M, S, J), d = nullDimsInt(T, K);
          let stop = 0; while (stop < K && d[stop] !== d[stop + 1]) stop++;
          return { parts, inv, d, stop };
        };
        const ops = (n) => {
          const key = `${seed}|${n}`; if (cache.has(key)) return cache.get(key);
          const r = v.rng(seed * 101 + n), out = [];
          for (let t = 0; t < NOPS; t++) {
            const z = r.int(1, n), parts = []; let left = z;
            while (left > 0) { const c = r.int(1, left); parts.push(c); left -= c; }
            parts.sort((a, b) => b - a);
            out.push(build(r, n, parts, n - z));
          }
          cache.set(key, out); return out;
        };
        let st = null;
        v.render(() => {
          const n = nS.value, mode = kind.value;
          nS.el.hidden = mode === 'inf'; btn.hidden = mode !== 'rand';
          let list, hi;
          if (mode === 'inf') {
            const d = Array.from({ length: K + 1 }, (_, k) => k);
            hi = { parts: [Infinity], inv: 0, d, stop: Infinity }; list = [hi];
          } else if (mode === 'worst') { hi = build(v.rng(5), n, [n], 0); list = [hi]; }
          else { list = ops(n); hi = list.reduce((a, o) => (o.stop > a.stop ? o : a), list[0]); }
          const top = mode === 'inf' ? K + 1 : n;
          G.setView([-0.6, K + 0.5], [-0.4, Math.max(4, top) + 1.4]);
          G.setTicks([0, 2, 4, 6, 8, 10], mode === 'inf' ? [0, 2, 4, 6, 8, 10, 12] : [0, 2, 4, 6, 8]);
          if (mode !== 'inf') {
            G.vband(n, K + 0.5, { color: 'orange', alpha: 0.06 });
            G.vline(n, { color: 'orange', width: 2, dash: [6, 4] });
            G.text(`k = n = ${n}`, n + 0.15, top + 0.95, { color: 'orange', size: 12.5, weight: 700 });
          }
          list.forEach((o, t) => {
            if (o === hi) return;
            const jit = ((t % 7) - 3) * 0.045;
            G.path(stair(o.d, jit), { color: 'accent', width: 1.2, alpha: 0.35 });
            G.dot(o.stop, o.d[o.stop] + jit, { r: 3.2, color: 'accent', alpha: 0.6 });
          });
          G.path(stair(hi.d, 0), { color: mode === 'inf' ? 'red' : 'green', width: 3 });
          if (mode === 'inf') G.arrow(K - 0.6, K - 0.6, K + 0.4, K + 0.4, { color: 'red', width: 2.4 });
          else G.dot(hi.stop, hi.d[hi.stop], { r: 6, color: 'green' });
          // ---- chain diagram of the highlighted operator: column i = a chain, cell at height j ↦ cell at height j − 1
          const chains = mode === 'inf' ? [8] : hi.parts, inv = hi.inv, cols = chains.length + (inv ? 1 : 0);
          const hmax = Math.max(...chains, inv, 3), b = Y.bounds, W = b.x[1] - b.x[0], H = b.y[1] - b.y[0];
          const cell = Math.min((0.62 * W) / (cols * 1.35), (0.7 * H) / (hmax * 1.3 + 0.8)), gx = cell * 1.35, gy = cell * 1.3;
          const x0 = b.x[0] + 0.58 * W - (cols * gx - 0.35 * cell) / 2, y0 = b.y[0] + 0.1 * H + 0.6 * cell;
          const pal = ['green', 'teal', 'blue', 'purple', 'pink', 'orange', 'gold', 'red'];
          const xr = x0 + (chains.length - 1) * gx + cell;
          Y.line(x0 - 0.25 * cell, y0 - 0.5 * cell, xr + 0.25 * cell, y0 - 0.5 * cell, { color: 'ink', width: 1.6 });
          Y.tex('0', x0 - 0.45 * cell, y0 - 0.5 * cell, { size: 14, align: 'right' });
          chains.forEach((c, i) => {
            const x = x0 + i * gx;
            for (let j = 0; j < c; j++) {
              const y = y0 + j * gy;
              Y.rect(x, y, x + cell, y + cell, { fill: pal[j % 8], fillAlpha: 0.5, color: pal[j % 8], width: 1.2 });
              Y.arrow(x + cell / 2, y - 0.04 * cell, x + cell / 2, j ? y - 0.26 * cell : y0 - 0.46 * cell, { color: 'ink', width: 1.1, head: 5, alpha: 0.6 });
            }
          });
          if (mode === 'inf') Y.text('⋮', x0 + cell / 2, y0 + 8 * gy + 0.2 * cell, { align: 'center', size: 18, color: 'red', weight: 700 });
          if (inv) {
            const x = x0 + chains.length * gx + 0.25 * cell;
            for (let j = 0; j < inv; j++) Y.rect(x, y0 + j * gy, x + cell, y0 + j * gy + cell, { fill: 'faint', fillAlpha: 0.55, color: 'muted', width: 1 });
            Y.text('part', x + cell / 2, y0 + inv * gy + 0.1 * cell, { align: 'center', baseline: 'bottom', size: 11, color: 'muted' });
            Y.text('invertible', x + cell / 2, y0 + inv * gy + 0.1 * cell, { align: 'center', baseline: 'bottom', size: 11, color: 'muted', dy: -13 });
          }
          for (let j = 1; j <= Math.min(hmax, 8); j++) Y.text(`${j}`, x0 - 0.5 * cell, y0 + (j - 1) * gy + cell / 2, { align: 'right', size: 11, color: 'muted' });
          Y.text('height', x0 - 0.5 * cell, y0 + Math.min(hmax, 8) * gy + 0.1 * cell, { align: 'right', baseline: 'bottom', size: 11, color: 'muted' });
          st = { mode, n, hi, maxStop: Math.max(...list.map((o) => o.stop)), N: list.length };
        });
        v.legend([['green', 'highlighted operator'], ['accent', 'other random operators'], ['orange', '$k = \\dim V$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { mode, n, hi } = st;
          if (mode === 'inf') return 'On the space of all sequences, the backward shift $B(x_1, x_2, x_3, \\dots) = (x_2, x_3, \\dots)$ has $\\operatorname{null}B^k = \\{x : x_j = 0 \\text{ for } j > k\\}$, of dimension $k$: the staircase climbs forever. 8.3 needs $\\dim V < \\infty$.';
          const seq = `${hi.d.slice(0, Math.min(K, n + 2) + 1).join(',\\ ')},\\ \\dots`;
          if (mode === 'worst') return `One chain of length $${n}$: the staircase $${seq}$ freezes exactly at $k = n = ${n}$, so the bound $\\dim V$ in 8.3 cannot be improved.`;
          return `Highlighted operator on $\\mathbf F^{${n}}$: chains of lengths $${hi.parts.join(', ')}$` + (hi.inv ? ` and an invertible part of dimension $${hi.inv}$` : '') + `; staircase $${seq}$, frozen from $k = ${hi.stop}$ (its longest chain). Over all ${st.N} operators drawn, the latest freeze is at $k = ${st.maxStop} \\le n = ${n}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.4
    {
      num: '8.4',
      kind: 'Theorem',
      name: 'V = null Tⁿ ⊕ range Tⁿ for n = dim V',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $n = \dim V$. Then
$$V = \operatorname{null} T^{n} \oplus \operatorname{range} T^{n}.$$
(In general $V \ne \operatorname{null}T \oplus \operatorname{range}T$; raising $T$ to the power $\dim V$ repairs this.)`,
      idea: String.raw`First the intersection is $\{0\}$: if $v = T^n u$ and $T^n v = 0$, then $T^{2n}u = 0$, so $u \in \operatorname{null}T^{2n} = \operatorname{null}T^{n}$ by 8.3, and $v = T^n u = 0$. Hence the sum is direct (1.46), and its dimension is $\dim\operatorname{null}T^n + \dim\operatorname{range}T^n$ (3.94), which equals $\dim V$ by the fundamental theorem of linear maps (3.21). A subspace of full dimension is the whole space (2.39).`,
      caption: String.raw`The green subspace is $\operatorname{null}T^k$, the purple one $\operatorname{range}T^k$; red marks their intersection. Their dimensions always add up to 3 (3.21). At $k = 3 = \dim V$ the two are complementary, and the gold $v$ (drag it) splits uniquely into a green and a purple part (the dashed parallelogram). Lower $k$ to $1$: now they overlap, their sum misses part of $\mathbf R^3$, and $v$ cannot be split (red: its distance from the sum). The table tracks all three powers; with the nilpotent chain the overlap persists until $k = 3$.`,
      deps: ['ladr-8.3', 'ladr-1.46', 'ladr-3.94', 'ladr-3.21', 'ladr-2.39'],
      tags: ['generalized eigenvectors', 'direct sums'],
      viz(v) {
        const M = v.M;
        const Sk = fromCols([[1, 0.2, 0.1], [-0.2, 1, 0.3], [0.25, -0.35, 1]]);
        const PRE = {
          book: [[0, 4, 0], [0, 0, 0], [0, 0, 5]],
          skew: conjM(M, Sk, [[0, 1, 0], [0, 0, 0], [0, 0, 1.2]]),
          shift: conjM(M, Sk, [[0, 1, 0], [0, 0, 1], [0, 0, 0]]),
        };
        const pre = v.select('$T$', [{ value: 'book', label: '$(4z_2,\\, 0,\\, 5z_3)$' }, { value: 'skew', label: 'same type, tilted' }, { value: 'shift', label: 'nilpotent chain' }], 'book');
        const kS = v.slider('power $k$', 1, 3, 3, { int: true });
        const S = v.stage({ x: [-2.05, 2.05], y: [-1.85, 1.95], equal: true, axes: false, height: 380, weight: 1.3, title: '$\\operatorname{null}T^k$ and $\\operatorname{range}T^k$ in $\\mathbf R^3$' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.32, axis: 1.5, lim: 1.3 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.7, minWidth: 230, title: 'dimensions, and is the sum direct?' });
        const TB = v.table(Q, { rows: 3, cols: 4, region: [0.02, 0.2, 0.98, 0.85], square: false, cellAspect: 0.8, maxCell: 56, size: 15, rowLabels: ['$k=1$', '$k=2$', '$k=3$'], colLabels: ['null', 'range', '$\\cap$', '$\\oplus$'] });
        const hv = sc.handle([0.95, 0.75, 0.85], { color: 'gold', label: 'v' });
        const info = (T, k) => {
          const Tk = mpow(T, k), N = nullO(M, Tk), R = rangeO(Tk), sum = orthN([...N, ...R], 1e-6);
          return { N, R, sum, cap: N.length + R.length - sum.length };
        };
        let st = null;
        v.render(() => {
          const T = PRE[pre.value], k = kS.value, all = [1, 2, 3].map((j) => info(T, j)), I = all[k - 1];
          sc.begin();
          drawSpan(sc, I.N, { color: 'green', r: 1.65, width: 4 });
          drawSpan(sc, I.R, { color: 'purple', r: 1.5, width: 4, fillAlpha: 0.12 });
          let capB = [];
          if (I.cap > 0) {
            const A = fromCols([...I.N, ...I.R.map((r) => sclN(r, -1))]), C = M.nullspace(A, 1e-8);
            capB = orthN(C.map((c) => I.N.reduce((s, b, i) => addN(s, sclN(b, c[i])), [0, 0, 0])));
            if (capB.length === 1) sc.line(sclN(capB[0], -1.85), sclN(capB[0], 1.85), { color: 'red', width: 5, alpha: 0.85 }, 16);
          }
          const x = hv.p, direct = I.cap === 0 && I.sum.length === 3;
          let a = null, b = null, p = null;
          if (direct) {
            const c = M.solve(fromCols([...I.N, ...I.R]), x);
            a = I.N.reduce((s, e, i) => addN(s, sclN(e, c[i])), [0, 0, 0]); b = I.R.reduce((s, e, i) => addN(s, sclN(e, c[I.N.length + i])), [0, 0, 0]);
            sc.line(a, x, { color: 'purple', width: 1.2, dash: [4, 4] }); sc.line(b, x, { color: 'green', width: 1.2, dash: [4, 4] });
            if (normN(a) > 1e-6) sc.arrow([0, 0, 0], a, { color: 'green', width: 2.6 });
            if (normN(b) > 1e-6) sc.arrow([0, 0, 0], b, { color: 'purple', width: 2.6 });
          } else {
            p = projN(x, I.sum);
            sc.line(p, x, { color: 'red', width: 1.6, dash: [4, 4] });
            sc.dot(p, { r: 4, color: 'red' });
          }
          sc.arrow([0, 0, 0], x, { color: 'gold', width: 2.8 });
          sc.flush();
          TB.draw({
            value: (i, j) => [all[i].N.length, all[i].R.length, all[i].cap, all[i].cap === 0 ? '✓' : '✗'][j],
            textColor: (i, j) => (j === 3 ? (all[i].cap === 0 ? 'green' : 'red') : j === 2 && all[i].cap ? 'red' : 'ink'),
            activeRow: k - 1, activeColor: 'gold',
          });
          st = { k, I, direct, a, b, p, x, cap: I.cap };
        });
        v.legend([['green', '$\\operatorname{null}T^k$'], ['purple', '$\\operatorname{range}T^k$'], ['red', 'overlap'], ['gold', '$v$']]);
        v.readout(() => {
          if (!st) return '';
          const { k, I, direct, a, b, cap } = st;
          const Tk = k === 1 ? 'T' : `T^{${k}}`;
          let s = `$k = ${k}$: $\\dim\\operatorname{null}${Tk} + \\dim\\operatorname{range}${Tk} = ${I.N.length} + ${I.R.length} = 3$, intersection of dimension $${cap}$. `;
          if (direct) s += `So $\\mathbf R^3 = \\operatorname{null}${Tk} \\oplus \\operatorname{range}${Tk}$, and $v = ${vtex(a)} + ${vtex(b)}$ uniquely.`;
          else s += `The sum is not direct and has dimension only $${I.sum.length}$: $v$ is at distance $${tn(normN(subN(st.x, st.p)), 3)}$ from it.`;
          if (k === 3) s += ' At $k = \\dim V$ this always works (8.4).';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 8.8
    {
      num: '8.8',
      kind: 'Definition',
      name: 'Generalized eigenvector',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda$ is an eigenvalue of $T$. A vector $v \in V$ is a **generalized eigenvector** of $T$ corresponding to $\lambda$ if $v \ne 0$ and
$$(T - \lambda I)^k v = 0 \qquad\text{for some positive integer } k.$$
Every eigenvector is one (take $k = 1$). By 8.1 and 8.3 applied to $T - \lambda I$, a nonzero $v$ is a generalized eigenvector for $\lambda$ if and only if $(T - \lambda I)^{\dim V} v = 0$.`,
      idea: String.raw`Some operators have too few eigenvectors to span $V$ (5.57), so one asks for less: not that $T - \lambda I$ kills $v$ at once, but that it does so after finitely many applications. There is no need for “generalized eigenvalues”: if $(T - \lambda I)^k$ fails to be injective then so does $T - \lambda I$, so $\lambda$ is already an eigenvalue.`,
      caption: String.raw`The grey arrows show the map $x \mapsto (T - \lambda I)x$ on $\mathbf R^2$ (here $\lambda = 1$). For the Jordan-type $T$ every arrow points along the eigen-line $E(\lambda, T)$ (teal), and the arrows vanish on it. Drag the gold $v$: $(T-\lambda I)v$ (orange) lands on the eigen-line and a second application gives $0$ — every vector is a generalized eigenvector, though only the teal line consists of eigenvectors. With two eigenvalues the chain only shrinks and never reaches $0$ off the eigen-line; with $T = \lambda I$ every vector is an eigenvector.`,
      deps: ['ladr-5.5'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const u1 = [1, 0.45], u2 = [-0.35, 1], P = fromCols([u1, u2]), Pi = M.inverse(P), lam = 1;
        const PRE = { jordan: [[lam, 1.1], [0, lam]], two: [[lam, 0], [0, lam - 0.65]], scalar: [[lam, 0], [0, lam]] };
        const pre = v.select('$T$', [{ value: 'jordan', label: 'one eigen-line (Jordan type)' }, { value: 'two', label: 'two eigenvalues' }, { value: 'scalar', label: '$T = \\lambda I$' }], 'jordan');
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.75, 1.75], equal: true, height: 380, title: 'the field $x \\mapsto (T - \\lambda I)x$ and the chain $v,\\ (T-\\lambda I)v,\\ (T-\\lambda I)^2v, \\dots$' });
        const e1 = unitN(u1);
        const hv = S.handle(-0.55, 1.05, {
          color: 'gold', label: 'v',
          constrain: (x, y) => { if (pre.value === 'scalar') return [x, y]; const t = x * e1[0] + y * e1[1], q = [t * e1[0], t * e1[1]]; return Math.hypot(x - q[0], y - q[1]) < 0.09 ? q : [x, y]; },
        });
        let st = null;
        v.render(() => {
          const mode = pre.value, T = mm(mm(P, PRE[mode]), Pi), A = shiftI(T, lam);
          // regions
          const bx = S.bounds.x, by = S.bounds.y;
          if (mode === 'scalar') S.rect(bx[0], by[0], bx[1], by[1], { fill: 'teal', fillAlpha: 0.07, stroke: false });
          else {
            S.rect(bx[0], by[0], bx[1], by[1], { fill: mode === 'jordan' ? 'orange' : 'red', fillAlpha: 0.05, stroke: false });
            S.line(-9 * e1[0], -9 * e1[1], 9 * e1[0], 9 * e1[1], { color: 'teal', width: 4, alpha: 0.75 });
            S.tex('E(\\lambda, T)', -2.6 * e1[0], -2.6 * e1[1], { color: 'teal', size: 15, dy: 18, dx: 10 });
          }
          // field
          const gx0 = Math.ceil(bx[0] / 0.4) * 0.4, gy0 = Math.ceil(by[0] / 0.4) * 0.4;
          for (let x = gx0; x <= bx[1] - 0.1; x += 0.4) for (let y = gy0; y <= by[1] - 0.1; y += 0.4) {
            const w = mv(A, [x, y]), l = normN(w); if (l < 0.03) continue;
            const k = 0.28 / Math.max(1, l / 0.9);
            S.arrow(x, y, x + k * w[0], y + k * w[1], { color: 'muted', width: 1.1, head: 5, alpha: 0.55 });
          }
          const ch = [[hv.x, hv.y]]; for (let k = 1; k <= 4; k++) ch.push(mv(A, ch[k - 1]));
          const zeroAt = ch.findIndex((w) => normN(w) < 1e-9);
          for (let k = 1; k <= 4; k++) {
            if (zeroAt >= 0 && k >= zeroAt) break;
            S.line(ch[k - 1][0], ch[k - 1][1], ch[k][0], ch[k][1], { color: 'orange', width: 1, dash: [3, 4], alpha: 0.7 });
            S.arrow(0, 0, ch[k][0], ch[k][1], { color: 'orange', width: 2.4, alpha: 1 - 0.18 * (k - 1) });
            if (k <= 2) S.tex(k === 1 ? '(T-\\lambda I)v' : '(T-\\lambda I)^2v', ch[k][0], ch[k][1], { color: 'orange', size: 13, dx: ch[k][0] >= 0 ? 12 : -12, dy: -12, align: ch[k][0] >= 0 ? 'left' : 'right' });
          }
          if (zeroAt > 0) { S.dot(0, 0, { r: 7, color: 'green' }); S.tex(`(T-\\lambda I)^{${zeroAt}}v = 0`, 0, 0, { color: 'green', size: 13, dy: 12, dx: 12, align: 'left', baseline: 'top' }); }
          S.arrow(0, 0, hv.x, hv.y, { color: 'gold', width: 3 });
          st = { mode, ch, zeroAt };
        });
        v.legend([['teal', 'eigenvectors: $E(\\lambda, T)$'], ['gold', '$v$'], ['orange', '$(T - \\lambda I)^k v$'], ['muted', '$x \\mapsto (T - \\lambda I)x$']]);
        v.readout(() => {
          if (!st) return '';
          const { mode, ch, zeroAt } = st, v0 = normN(ch[0]) < 1e-9;
          if (v0) return '$v = 0$ is excluded by definition: drag it away from the origin.';
          const pw = ch.slice(1, 4).map((w, k) => `(T - I)${k ? `^{${k + 1}}` : ''}v = ${vtex(w)}`).join(',\\ ');
          let s = `$${pw}$. `;
          if (zeroAt === 1) s += '**$v$ is an eigenvector** (so also a generalized eigenvector, with $k = 1$).';
          else if (zeroAt > 1) s += `**$v$ is a generalized eigenvector for $\\lambda = 1$ ($k = ${zeroAt}$) but not an eigenvector**, since $(T - I)v \\ne 0$.`;
          else s += `The lengths shrink by the factor $0.65$ each time but never reach $0$: off the eigen-line, $v$ is **not** a generalized eigenvector for $\\lambda = 1$ (it mixes in the other eigenvalue $0.35$).`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 8.9
    {
      num: '8.9',
      kind: 'Theorem',
      name: 'A basis of generalized eigenvectors',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then $V$ has a basis consisting of generalized eigenvectors of $T$.`,
      idea: String.raw`Induction on $n = \dim V$. Pick an eigenvalue $\lambda$ of $T$ — this is where $\mathbf F = \mathbf C$ is used (5.19). By 8.4 applied to $T - \lambda I$, $V = \operatorname{null}(T - \lambda I)^n \oplus \operatorname{range}(T - \lambda I)^n$. Every nonzero vector of the first summand is a generalized eigenvector for $\lambda$, and that summand is not $\{0\}$ because $\lambda$ is an eigenvalue. The second summand is invariant under $T$ (5.18) and has smaller dimension, so by induction it has a basis of generalized eigenvectors of the restriction of $T$ — which are generalized eigenvectors of $T$. Join the two bases.`,
      caption: String.raw`Step through the proof for an operator on $\mathbf R^3 \subseteq \mathbf C^3$ (drag the background to rotate). First the eigenvectors: for the defective $T$ they fill just two lines, spanning only a plane. Then an eigenvalue $\lambda$ splits $V$ into $\operatorname{null}(T - \lambda I)^3$ (green) and the invariant $\operatorname{range}(T - \lambda I)^3$ (purple), and the proof repeats inside the purple part. The last step collects a basis of generalized eigenvectors — a solid parallelepiped — and gives the gold $v$ coordinates in it. Choose the rotation to see the proof stall over $\mathbf R$: the purple plane has no real eigenvalue.`,
      deps: ['ladr-8.4', 'ladr-5.18', 'ladr-5.19', 'ladr-8.8'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const S0 = fromCols([[1, 0.15, -0.2], [0.3, 1, 0.2], [-0.25, 0.35, 1]]);
        const PRE = {
          defect: [[2, 1, 0], [0, 2, 0], [0, 0, -1]],
          triple: [[1, 1, 0], [0, 1, 1], [0, 0, 1]],
          diag: [[2, 0, 0], [0, 0.5, 0], [0, 0, -1]],
          rot: [[0, -1, 0], [1, 0, 0], [0, 0, 2]],
        };
        const pre = v.select('$T$', [{ value: 'defect', label: 'defective: $2, 2, -1$' }, { value: 'triple', label: 'one eigenvalue, one eigen-line' }, { value: 'diag', label: 'diagonalizable' }, { value: 'rot', label: 'rotation, over $\\mathbf R$' }], 'defect', { onChange: () => ST.reset(undefined, { at: 'end' }) });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.95], equal: true, axes: false, height: 390, weight: 1.3, title: 'the proof of 8.9, one step at a time' });
        const Q = v.stage({ x: [0, 1], y: [0, 1.9], equal: true, axes: false, height: 390, weight: 0.7, minWidth: 210, title: 'the matrix of $T$' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.3, axis: 1.45, lim: 1.3 });
        const hv = sc.handle([0.4, -0.9, 0.95], { color: 'gold', label: 'v' });
        const LC = ['green', 'blue', 'pink'];
        const realEigs = (A) => {
          const vals = M.eig(A, { vectors: false }).values.filter((z) => Math.abs(z.im) < 1e-4).map((z) => z.re).sort((a, b) => b - a), out = [];
          for (const x of vals) { const g = out.find((q) => Math.abs(q.s / q.c - x) < 1e-3); if (g) { g.s += x; g.c++; } else out.push({ s: x, c: 1 }); }
          return out.map((q) => q.s / q.c);
        };
        const analyse = (key) => {
          const T = conjM(M, S0, PRE[key]);
          const E = realEigs(T).map((l) => ({ l, B: nullO(M, shiftI(T, l), 1e-7) })), eSpan = orthN(E.flatMap((e) => e.B), 1e-6);
          const levels = []; let U = ident(3);
          while (U.length) {
            const A = U.map((bi) => U.map((bj) => dotN(bi, mv(T, bj))));
            const ls = realEigs(A);
            if (!ls.length) { levels.push({ stuck: true, U }); break; }
            const l = ls[0], K = mpow(shiftI(A, l), U.length), toV = (c) => U.reduce((s, b, i) => addN(s, sclN(b, c[i])), [0, 0, 0]);
            const G = orthN(nullO(M, K, 1e-7).map(toV)), R = orthN(rangeO(K).map(toV));
            // a basis of G adapted to null(T − λI) ⊆ null(T − λI)² ⊆ …, so that T is triangular on it
            const flag = []; for (let j = 1; j <= 3; j++) flag.push(...nullO(M, mpow(shiftI(T, l), j), 1e-7));
            levels.push({ l, G, R, basis: orthN(flag, 1e-6).slice(0, G.length) });
            U = R;
          }
          const ok = !levels.some((L) => L.stuck), basis = levels.filter((L) => !L.stuck).flatMap((L, i) => L.basis.map((b) => ({ b, l: L.l, i })));
          return { T, E, eSpan, levels, ok, basis };
        };
        let A = analyse('defect');
        const frames = () => {
          A = analyse(pre.value);
          const fr = [{ t: 'eig' }];
          A.levels.forEach((L, i) => fr.push({ t: 'lev', i }));
          if (A.ok) fr.push({ t: 'basis' });
          return fr.map((f) => ({ ...f, note: () => noteFor(f) }));
        };
        const noteFor = (f) => {
          if (f.t === 'eig') {
            const d = A.eSpan.length;
            return `The eigenvectors of $T$ fill ${A.E.length === 1 ? 'one line' : `${A.E.length} lines`} (teal), spanning a subspace of dimension $${d}$` + (d < 3 ? ' — **too few for a basis**.' : ' — here they already give a basis.');
          }
          if (f.t === 'lev') {
            const L = A.levels[f.i];
            if (L.stuck) return `What is left (red) is invariant, but $T$ acts on it as a rotation: **no real eigenvalue**, so over $\\mathbf R$ the induction stops. Over $\\mathbf C$ it would go on with the eigenvalues $\\pm i$.`;
            return `Eigenvalue $\\lambda = ${tn(L.l)}$: the current space splits as $\\operatorname{null}(T - \\lambda I)^{m} \\oplus \\operatorname{range}(T - \\lambda I)^{m}$ with dimensions $${L.G.length} + ${L.R.length}$ (8.4).` + (L.R.length ? ' The range is invariant (5.18), so the proof repeats inside it.' : ' Nothing is left over.');
          }
          return `Join the pieces: **a basis of generalized eigenvectors** (the solid box has volume $${tn(Math.abs(M.det(fromCols(A.basis.map((q) => q.b)))), 3)} \\ne 0$).`;
        };
        const ST = v.steps({ frames, speed: 0.7, start: 'end', still: 'end' });
        let st = null;
        v.render(() => {
          const f = ST.frame || {}, last = f.t === 'basis';
          hv.visible = last;
          sc.begin();
          if (f.t === 'eig' || !f.t) {
            if (A.eSpan.length === 2) drawSpan(sc, A.eSpan, { color: 'teal', fillAlpha: 0.08, r: 1.6 });
            A.E.forEach((e) => { if (e.B.length === 1) sc.line(sclN(e.B[0], -1.8), sclN(e.B[0], 1.8), { color: 'teal', width: 4, alpha: 0.85 }, 14); else drawSpan(sc, e.B, { color: 'teal', r: 1.5 }); sc.tex(`E(${tn(e.l)})`, sclN(e.B[0], 1.75), { color: 'teal', size: 13, dx: 8, dy: -10 }); });
          } else if (f.t === 'lev') {
            for (let j = 0; j < f.i; j++) { const L = A.levels[j]; drawSpan(sc, L.G, { color: LC[j], fillAlpha: 0.05, alpha: 0.35, r: 1.4, grid: false }); }
            const L = A.levels[f.i];
            if (L.stuck) {
              drawSpan(sc, L.U, { color: 'red', fillAlpha: 0.12, r: 1.55 });
              const e = L.U[0], w = mv(A.T, e);
              sc.arrow([0, 0, 0], e, { color: 'red', width: 2 }); sc.arrow([0, 0, 0], w, { color: 'red', width: 2, dash: [5, 3] });
              sc.tex('u', e, { color: 'red', size: 13, dx: 10, dy: -8 }); sc.tex('Tu', w, { color: 'red', size: 13, dx: 10, dy: -8 });
            } else {
              drawSpan(sc, L.G, { color: LC[f.i], r: 1.6, width: 4.5 });
              if (L.R.length) drawSpan(sc, L.R, { color: 'purple', r: 1.45, width: 4, fillAlpha: 0.1 });
              const tip = L.G.length === 1 ? sclN(L.G[0], 1.7) : L.G.length === 2 ? sclN(addN(L.G[0], L.G[1]), 1.1) : [1.1, 1.1, 1.1];
              sc.tex(`\\operatorname{null}(T - ${tn(L.l)}I)^{m}`, tip, { color: LC[f.i], size: 13, dy: -12 });
            }
          } else if (last) {
            A.levels.forEach((L, j) => { if (!L.stuck) drawSpan(sc, L.G, { color: LC[j], fillAlpha: 0.04, alpha: 0.3, r: 1.4, grid: false }); });
            const B = A.basis.map((q) => q.b);
            box3(sc, [0, 0, 0], B[0], B[1], B[2], { fill: 'gold', fillAlpha: 0.07, alpha: 0.45 });
            A.basis.forEach((q, j) => { sc.arrow([0, 0, 0], q.b, { color: LC[q.i], width: 2.8 }); sc.tex(`g_${j + 1}`, q.b, { color: LC[q.i], size: 14, dx: 10, dy: -10 }); });
            sc.arrow([0, 0, 0], hv.p, { color: 'gold', width: 2.4 });
          }
          sc.flush();
          let coords = null;
          if (last) coords = M.solve(fromCols(A.basis.map((q) => q.b)), hv.p);
          // ---- matrices: standard basis, and the basis of generalized eigenvectors
          const sc1 = Math.max(1, maxAbs(A.T));
          intTile(Q, A.T, 0.2, 1.08, 0.6, { fmt: (x) => pn(x, 2), scale: sc1, size: 11.5 });
          Q.text('in the standard basis', 0.5, 1.75, { align: 'center', size: 12, color: 'muted' });
          if (A.ok) {
            const Bm = fromCols(A.basis.map((q) => q.b)), Mg = M.solve(Bm, mm(A.T, Bm)).map((r) => r.map((x) => (Math.abs(x) < 1e-9 ? 0 : x)));
            intTile(Q, Mg, 0.2, 0.18, 0.6, { fmt: (x) => pn(x, 2), scale: sc1, size: 11.5, frame: last ? 'gold' : 'muted', frameW: last ? 2.4 : 1.1 });
            let o = 0; const cw = 0.2;
            A.levels.forEach((L, j) => { const d = L.G.length; Q.rect(0.2 + o * cw, 0.18 + 0.6 - (o + d) * cw, 0.2 + (o + d) * cw, 0.18 + 0.6 - o * cw, { color: LC[j], width: 2.4 }); o += d; });
            Q.tex('\\text{in the basis } g_1, g_2, g_3', 0.5, 0.88, { size: 13, color: last ? 'gold' : 'muted' });
          } else Q.text('no basis of real generalized eigenvectors', 0.5, 0.5, { align: 'center', size: 11.5, color: 'red', weight: 700 });
          st = { f, coords };
        });
        v.legend([['teal', 'eigenvectors'], ['green', 'first generalized eigenspace', { area: true }], ['purple', 'invariant remainder', { area: true }], ['gold', 'basis box and $v$']]);
        v.readout(() => {
          if (!st) return '';
          const { f, coords } = st;
          if (f.t === 'basis' && coords) {
            const parts = A.basis.map((q, j) => `${tn(coords[j])}\\,g_{${j + 1}}`).join(' + ').replace(/\+ -/g, '- ');
            const lam = A.basis.map((q, j) => `g_{${j + 1}} \\in G(${tn(q.l)}, T)`).join(',\\ ');
            return `$v = ${parts}$, where $${lam}$: every vector is a combination of generalized eigenvectors.`;
          }
          if (!A.ok) return 'Over $\\mathbf R$ this operator has only one real eigenvalue, $2$, and its generalized eigenvectors fill a single line: there is no basis of real generalized eigenvectors. Over $\\mathbf C$ the eigenvalues $\\pm i$ supply the missing two.';
          return `Eigenvalues: $${A.E.map((e) => tn(e.l)).join(',\\ ')}$; eigenvectors span dimension $${A.eSpan.length}$, generalized eigenvectors span dimension $3$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.11
    {
      num: '8.11',
      kind: 'Theorem',
      name: 'Generalized eigenvector corresponds to one eigenvalue',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. Then each generalized eigenvector of $T$ corresponds to only one eigenvalue of $T$: if $v \ne 0$, $(T - \alpha I)^j v = 0$ and $(T - \lambda I)^k v = 0$ for some positive integers $j, k$, then $\alpha = \lambda$.`,
      idea: String.raw`Let $m$ be the least integer with $(T - \alpha I)^m v = 0$, and $n = \dim V$, so that $(T - \lambda I)^n v = 0$ (8.1, 8.3). Expand $(T - \lambda I)^n = \big((T - \alpha I) + (\alpha - \lambda)I\big)^n$ by the binomial theorem — the two terms commute — and apply $(T - \alpha I)^{m-1}$: every term containing a factor $(T - \alpha I)$ now has $(T - \alpha I)^{\ge m}$ and dies, leaving $0 = (\alpha - \lambda)^n (T - \alpha I)^{m-1}v$. As $(T - \alpha I)^{m-1}v \ne 0$, $\alpha = \lambda$. Equivalently: on the generalized eigenspace of $\lambda$, $T - \alpha I$ is invertible for every $\alpha \ne \lambda$.`,
      caption: String.raw`An operator on $\mathbf C^3$ with eigenvalues $\lambda$ (a $2\times2$ Jordan block) and $\mu$. The plane is the complex $\alpha$-plane, shaded by $\log_{10}\|(T - \alpha I)^3v\|$ (green = small, contour lines at each power of 10). Drag $\alpha$ (it snaps to eigenvalues): the bars show $\|(T - \alpha I)^k v\|$ for $k = 0, \dots, 6$ on a log scale. For $v$ in $G(\lambda, T)$ the only zero in the whole plane is at $\alpha = \lambda$ — even at $\alpha = \mu$ the bars never reach $0$. Choose a mixed $v$: it is no generalized eigenvector, and no $\alpha$ at all kills it.`,
      deps: ['ladr-8.8', 'ladr-8.3'],
      tags: ['generalized eigenvectors'],
      viz(v) {
        const M = v.M;
        const lam = [0.55, 0.55], mu = [-0.8, -0.45];
        const S0 = [[[1, 0], [0.2, 0.3], [0.3, -0.1]], [[0.1, -0.2], [1, 0], [-0.2, 0.2]], [[-0.3, 0.1], [0.25, 0.1], [1, 0]]];
        const J = [[lam, [1, 0], [0, 0]], [[0, 0], lam, [0, 0]], [[0, 0], [0, 0], mu]];
        const T = cMM(cMM(S0, J), cInv(M, S0)), s = [0, 1, 2].map((j) => S0.map((r) => r[j]));
        const mode = v.select('$v$', [{ value: 'gl', label: '$v \\in G(\\lambda, T)$' }, { value: 'gm', label: '$v \\in G(\\mu, T)$' }, { value: 'mix', label: 'mixed: not a generalized eigenvector' }], 'gl');
        const th = v.slider('which $v$ in $G(\\lambda, T)$: $v = \\cos\\theta\\, u_1 + \\sin\\theta\\, u_2$, $\\theta$', 0, 3.14, 1.1, { step: 0.01 });
        const Z = v.stage({ x: [-1.65, 1.65], y: [-1.3, 1.3], equal: true, height: 360, weight: 1.2, xlabel: 'Re', ylabel: 'Im', title: 'the $\\alpha$-plane, shaded by $\\|(T - \\alpha I)^3 v\\|$' });
        const B = v.stage({ x: [-0.6, 6.6], y: [1e-5, 30], ylog: true, height: 360, weight: 0.8, minWidth: 220, axes: 'box', xticks: [0, 1, 2, 3, 4, 5, 6], xlabel: 'k', title: '$\\|(T - \\alpha I)^k v\\| \\,/\\, \\|v\\|$' });
        const ah = Z.handle(lam[0], lam[1], { color: 'gold', label: 'α', constrain: (x, y) => { for (const e of [lam, mu]) if (Math.hypot(x - e[0], y - e[1]) < 0.08) return [e[0], e[1]]; return [x, y]; } });
        const gr = v.rgb('green'), pa = v.rgb('panel'), ink = v.rgb('ink');
        const vec = () => {
          if (mode.value === 'gm') return s[2];
          if (mode.value === 'mix') return s[1].map((z, i) => cadd(z, csc(s[2][i], 0.7)));
          const c = Math.cos(th.value), d = Math.sin(th.value);
          return s[0].map((z, i) => cadd(csc(z, c), csc(s[1][i], d)));
        };
        const powNorms = (x, a, K) => { const out = [cNorm(x)]; let w = x; for (let k = 1; k <= K; k++) { w = cMV(T, w).map((z, i) => csub(z, cmul(a, w[i]))); out.push(cNorm(w)); } return out; };
        let st = null;
        v.render(() => {
          th.el.hidden = mode.value !== 'gl';
          const x = vec(), nx = cNorm(x);
          const lg = (re, im) => { const a = [re, im]; let w = x; for (let k = 0; k < 3; k++) w = cMV(T, w).map((z, i) => csub(z, cmul(a, w[i]))); return Math.log10(Math.max(1e-12, cNorm(w) / nx)); };
          const hpx = (3 * (Z.bounds.x[1] - Z.bounds.x[0])) / Z.width;
          Z.raster((re, im) => {
            const L = lg(re, im), t = M.clamp((L + 3) / 4, 0, 1), g = 1 - t;
            const tol = 0.55 * Math.max(Math.abs(lg(re + hpx, im) - L), Math.abs(lg(re, im + hpx) - L));
            const f = Math.abs(L - Math.round(L)) < tol && L > -2.95 ? 0.72 : 1;
            return [0, 1, 2].map((c) => (gr[c] * g + pa[c] * (1 - g)) * f + ink[c] * (1 - f)).concat(255);
          }, { res: 3, key: `${mode.value}|${th.value}` });
          Z.axes();
          for (const [e, name] of [[lam, '\\lambda'], [mu, '\\mu']]) { Z.circle(e[0], e[1], 0.05, { color: 'ink', width: 2 }); Z.tex(name, e[0], e[1], { size: 15, dx: 16, dy: 14 }); }
          const a = [ah.x, ah.y], ns = powNorms(x, a, 6).map((t) => t / nx);
          ns.forEach((t, k) => {
            if (t < 1e-12) { B.dot(k, 1.7e-5, { r: 6, color: 'green' }); B.text('0', k, 3.6e-5, { align: 'center', color: 'green', size: 12, weight: 700 }); }
            else B.rect(k - 0.28, 1e-5, k + 0.28, Math.min(t, 30), { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 });
          });
          st = { a, ns, onL: a[0] === lam[0] && a[1] === lam[1], onM: a[0] === mu[0] && a[1] === mu[1] };
        });
        v.legend([['green', 'small $\\|(T - \\alpha I)^3 v\\|$', { area: true }], ['gold', '$\\alpha$ (drag)', { dot: true }], ['ink', 'eigenvalues $\\lambda, \\mu$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { a, ns, onL, onM } = st, md = mode.value, z = ns.findIndex((t) => t < 1e-12);
          let s = `$\\alpha = ${czT(a)}$: $\\|(T - \\alpha I)^k v\\|/\\|v\\| = ${ns.slice(0, 5).map((t) => (t < 1e-12 ? '0' : tn(t, 3))).join(',\\ ')},\\ \\dots$ `;
          if (z > 0) s += `— **zero from $k = ${z}$ on**: $v$ is a generalized eigenvector for $${onL ? '\\lambda' : '\\mu'}$.`;
          else if (md === 'mix') s += '— never zero, for any $\\alpha$: a mixture of vectors from $G(\\lambda, T)$ and $G(\\mu, T)$ is not a generalized eigenvector.';
          else s += `— never zero${onL || onM ? `, even though $\\alpha$ is the eigenvalue $${onL ? '\\lambda' : '\\mu'}$` : ''}: $T - \\alpha I$ is injective on $G(${md === 'gl' ? '\\lambda' : '\\mu'}, T)$, so only $\\alpha = ${md === 'gl' ? '\\lambda' : '\\mu'}$ works.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 8.12
    {
      num: '8.12',
      kind: 'Theorem',
      name: 'Linearly independent generalized eigenvectors',
      statement: String.raw`Suppose $T \in \mathcal L(V)$. Then every list of generalized eigenvectors of $T$ corresponding to distinct eigenvalues of $T$ is linearly independent.`,
      idea: String.raw`Suppose not, and take a shortest dependent list $v_1, \dots, v_m$ (eigenvalues $\lambda_1, \dots, \lambda_m$ distinct), with $a_1v_1 + \cdots + a_mv_m = 0$ and all $a_k \ne 0$. Apply $(T - \lambda_m I)^n$, $n = \dim V$: it kills $v_m$, while for $k < m$ the vector $(T - \lambda_m I)^n v_k$ is nonzero (else $v_k$ would belong to two eigenvalues, against 8.11) and is still a generalized eigenvector for $\lambda_k$, since the operators commute. That gives a shorter dependent list — a contradiction. The argument copies 5.11 for eigenvectors.`,
      caption: String.raw`A function-space instance: $T = d/dt$ acting on $V = \operatorname{span}(e^{at}, te^{at}, e^{bt}, e^{ct})$ with $a = 0$. Here $v_1 = (\cos\varphi + \sin\varphi\,t)e^{at}$ is a generalized eigenvector for $a$ (an eigenvector only when $\sin\varphi = 0$), and $v_2 = e^{bt}$, $v_3 = e^{ct}$ are eigenvectors for $b$ and $c$. Left: the three functions, and in gold the combination $c_1v_1 + c_2v_2 + c_3v_3$ with $|c| = 1$ that comes closest to $0$; its size $\sigma$ is the smallest singular value. Right: $\sigma$ (log scale) as $b$ sweeps $[-2, 2]$ — it plunges to $0$ only where $b$ collides with another eigenvalue; elsewhere it may get small, but stays positive. Move $b$ onto $c$ (or onto $a$ with $\varphi = 0$) to break the hypothesis.`,
      deps: ['ladr-8.11', 'ladr-5.11'],
      tags: ['generalized eigenvectors', 'independence'],
      viz(v) {
        const M = v.M, a = 0, L = 2, NS = 120;
        const phS = v.slider('$\\varphi$ in $v_1 = (\\cos\\varphi + \\sin\\varphi\\, t)\\,e^{at}$', 0, 3.14, 0.9, { step: 0.01 });
        const bS = v.slider('$b$, the eigenvalue of $v_2 = e^{bt}$', -2, 2, 0.8, { step: 0.01 });
        const cS = v.slider('$c$, the eigenvalue of $v_3 = e^{ct}$', -2, 2, -1.1, { step: 0.01 });
        const F = v.stage({ x: [0, L], y: [-2.6, 2.6], height: 340, weight: 1.1, axes: 'box', xlabel: 't', title: '$v_1, v_2, v_3$ scaled to norm 1 on $[0, 2]$; gold: closest to a dependency' });
        const Sg = v.stage({ x: [-2, 2], y: [1e-4, 1], ylog: true, height: 340, weight: 0.9, axes: 'box', xlabel: 'b', title: '$\\sigma = \\min_{|c| = 1}\\|c_1v_1 + c_2v_2 + c_3v_3\\|$ against $b$' });
        const ts = Array.from({ length: NS + 1 }, (_, i) => (L * i) / NS), W = ts.map((_, i) => ((i === 0 || i === NS ? 1 : i % 2 ? 4 : 2) * (L / NS)) / 3);
        const ip = (x, y) => x.reduce((s, xi, i) => s + W[i] * xi * y[i], 0);
        const funcs = (ph, b, c) => [ts.map((t) => (Math.cos(ph) + Math.sin(ph) * t) * Math.exp(a * t)), ts.map((t) => Math.exp(b * t)), ts.map((t) => Math.exp(c * t))].map((f) => { const r = Math.sqrt(ip(f, f)); return f.map((y) => y / r); });
        const sigma = (fs) => {
          const G = fs.map((f) => fs.map((g) => ip(f, g))), E = M.eigSym(G), k = E.values.length - 1;
          return { s: Math.sqrt(Math.max(0, E.values[k])), c: E.vecs[k], det: Math.max(0, M.det(G)) };
        };
        let st = null;
        v.render(() => {
          const ph = phS.value, b = bS.value, c = cS.value, fs = funcs(ph, b, c), r = sigma(fs);
          const g = ts.map((_, i) => fs.reduce((s, f, k) => s + r.c[k] * f[i], 0));
          F.hline(0, { color: 'muted', width: 1 });
          [['purple', 0], ['teal', 1], ['pink', 2]].forEach(([col, k]) => F.path(ts.map((t, i) => [t, fs[k][i]]), { color: col, width: 2.2 }));
          F.path(ts.map((t, i) => [t, g[i]]), { color: 'gold', width: 3.6 });
          F.tex('v_1', ts[NS], fs[0][NS], { color: 'purple', size: 14, dx: -14, dy: -10 });
          F.tex('v_2', ts[NS], fs[1][NS], { color: 'teal', size: 14, dx: -14, dy: -10 });
          F.tex('v_3', ts[NS], fs[2][NS], { color: 'pink', size: 14, dx: -14, dy: 12 });
          F.corner(`c = (${r.c.map((x) => pn(x, 2)).join(', ')}),  σ = ${pn(r.s, 4)}`, 'tl', { color: 'gold', weight: 700 });
          // σ as b varies
          const pts = [];
          for (let i = 0; i <= 200; i++) { const bb = -2 + (4 * i) / 200; pts.push([bb, sigma(funcs(ph, bb, c)).s]); }
          for (const [x0, name] of [[a, 'b = a'], [c, 'b = c']]) { Sg.vline(x0, { color: 'red', dash: [5, 4], width: 1.4, alpha: 0.7 }); Sg.text(name, x0, 0.62, { align: 'center', color: 'red', size: 12, weight: 700 }); }
          Sg.clip(() => Sg.path(pts.map(([x, y]) => [x, Math.max(y, 2e-6)]), { color: 'accent', width: 2.4 }));
          if (r.s < 1e-4) { Sg.dot(b, 1.25e-4, { r: 6, color: 'red' }); Sg.text('σ = 0', b, 2.4e-4, { align: 'center', color: 'red', size: 12, weight: 700 }); }
          else Sg.dot(b, r.s, { r: 6, color: 'gold' });
          st = { r, b, c, ph };
        });
        v.legend([['purple', '$v_1 \\in G(a, T)$'], ['teal', '$v_2 \\in E(b, T)$'], ['pink', '$v_3 \\in E(c, T)$'], ['gold', 'best combination']]);
        v.readout(() => {
          if (!st) return '';
          const { r, b, c, ph } = st, dep = r.s < 1e-6;
          const distinct = Math.abs(b - c) > 1e-9 && Math.abs(b - a) > 1e-9 && Math.abs(c - a) > 1e-9;
          let s = `Eigenvalues $a = 0$, $b = ${tn(b)}$, $c = ${tn(c)}$; Gram determinant (squared volume of the box spanned by the scaled functions) $= ${v.sci(r.det, 2)}$, $\\sigma = ${tn(r.s, 5)}$. `;
          if (dep) s += `**The list is dependent** — but ${Math.abs(b - c) < 1e-9 ? '$b = c$' : '$b = a$ and $v_1 = e^{at}$'}: two of the eigenvalues coincide, so 8.12 says nothing.`;
          else if (distinct) s += 'Distinct eigenvalues: $\\sigma > 0$, **linearly independent**, as 8.12 promises.';
          else s += `Two eigenvalues coincide, yet the list happens to be independent (here $v_1 = (\\cos\\varphi + \\sin\\varphi\\,t)$ is not a multiple of $v_2 = 1$): repeated eigenvalues allow dependence but do not force it.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 8.14
    {
      num: '8.14',
      kind: 'Definition',
      name: 'Nilpotent operator',
      statement: String.raw`An operator $T \in \mathcal L(V)$ is **nilpotent** if some power of it is $0$: $T^m = 0$ for some positive integer $m$. Equivalently, every nonzero vector of $V$ is a generalized eigenvector of $T$ corresponding to the eigenvalue $0$.`,
      idea: String.raw`Typical examples: $T(z_1, z_2, z_3, z_4) = (0, 0, z_1, z_2)$, with $T^2 = 0$; differentiation on $\mathcal P_m(\mathbf R)$, whose $(m+1)$-st power kills every polynomial; and every strictly upper-triangular matrix, which pushes each standard basis vector into the span of the earlier ones, so that each application loses one dimension. The name is Latin: *nil* (nothing) and *potens* (having power).`,
      caption: String.raw`$N$ is strictly upper triangular with entries $a, b, c$ above the diagonal. Step through the powers: $N$ squashes the unit cube into a parallelogram in the plane $\operatorname{span}(e_1, e_2)$, $N^2$ into a segment on the $e_1$-axis, and $N^3$ into the single point $0$. On the right the nonzero entries of $N^k$ retreat to the top-right corner and vanish. Switch on the entry $\varepsilon$ below the diagonal: the cube keeps a nonzero volume $|\det N|^k$ at every step and never collapses — that $N$ is not nilpotent.`,
      deps: ['ladr-5.1'],
      tags: ['nilpotent'],
      viz(v) {
        const M = v.M;
        const aS = v.slider('$a$', -1.2, 1.2, 0.9, { step: 0.05 }), bS = v.slider('$b$', -1.2, 1.2, 0.5, { step: 0.05 }), cS = v.slider('$c$', -1.2, 1.2, 0.8, { step: 0.05 });
        const brk = v.toggle('break it: an entry $\\varepsilon = 0.6$ below the diagonal', false);
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.35, 1.95], equal: true, axes: false, height: 380, weight: 1.3, title: 'the unit cube and its images under $N, N^2, N^3, N^4$' });
        const sc = v.scene3(S, { yaw: -0.78, pitch: 0.42, axis: 1.35, lim: 1.3 });
        const R = v.stage({ x: [0, 1], y: [0, 1.5], equal: true, axes: false, height: 380, weight: 0.7, minWidth: 210, title: 'the matrices $N^k$' });
        const corners = []; for (let i = 0; i < 8; i++) corners.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
        let cur = null;
        const noteFor = (k) => {
          if (!cur) return '';
          const r = cur.ranks[k], vol = cur.vols[k];
          if (k === 0) return 'The unit cube, volume $1$.';
          const shape = ['the single point $0$', 'a segment', 'a flat parallelogram', 'a solid'][r];
          return `$${k === 1 ? 'N' : `N^{${k}}`}(\\text{cube})$ is ${shape} (rank $${r}$` + (r === 3 ? `, volume $|\\det N|${k === 1 ? '' : `^{${k}}`} = ${tn(vol, 3)}$)` : ')') + (r === 0 && k === cur.idx ? ': **$N^{' + k + '} = 0$**.' : '.');
        };
        const ST = v.steps({ frames: [0, 1, 2, 3, 4].map((k) => ({ k, note: () => noteFor(k) })), transition: 0.7, speed: 0.7, start: 1, still: 1 });
        let st = null;
        v.render(() => {
          const a = aS.value, b = bS.value, c = cS.value, eps = brk.value ? 0.6 : 0;
          const N = [[0, a, b], [0, 0, c], [eps, 0, 0]], P = [ident(3)]; for (let k = 1; k <= 4; k++) P.push(mm(P[k - 1], N));
          const ranks = P.map((X) => (maxAbs(X) < 1e-12 ? 0 : M.rank(X, 1e-9))), vols = P.map((X) => Math.abs(M.det(X)));
          const idx = P.findIndex((X) => maxAbs(X) < 1e-12);
          cur = { ranks, vols, idx };
          const k = ST.frame.k ?? 1, kp = ST.prev && ST.prev.k != null ? ST.prev.k : k, tw = ST.tween;
          const img = (X) => corners.map((q) => mv(X, q)), V0 = img(P[kp]), V1 = img(P[k]), V = V0.map((p, i) => lerpN(p, V1[i], tw));
          const Pt = P[kp].map((r, i) => r.map((x, j) => x + (P[k][i][j] - x) * tw));
          sc.begin();
          // the original cube, dashed
          for (let i = 0; i < 8; i++) for (let d = 0; d < 3; d++) if (!((i >> d) & 1)) { const j = i | (1 << d); sc.line(corners[i], corners[j], { color: 'muted', width: 1, dash: [3, 4], alpha: 0.6 }); }
          box3(sc, [0, 0, 0], colOf(Pt, 0), colOf(Pt, 1), colOf(Pt, 2), { fill: brk.value ? 'red' : 'accent', fillAlpha: 0.12, alpha: 0.85, width: 1.6 });
          ['blue', 'purple', 'teal'].forEach((col, j) => { const e = colOf(Pt, j); if (normN(e) > 0.03) { sc.arrow([0, 0, 0], e, { color: col, width: 2.4 }); sc.tex(`${k === 0 ? '' : k === 1 ? 'N' : `N^{${k}}`}e_${j + 1}`, e, { color: col, size: 12.5, dx: 12, dy: -9 }); } });
          if (V.every((p) => normN(p) < 0.02)) sc.dot([0, 0, 0], { r: 7, color: 'green' });
          sc.flush();
          // tiles of N, N², N³
          for (let j = 1; j <= 3; j++) {
            const y0 = 1.5 - j * 0.47, on = j === k;
            intTile(R, P[j], 0.33, y0, 0.36, { frame: on ? 'gold' : maxAbs(P[j]) < 1e-12 ? 'green' : 'muted', frameW: on ? 2.6 : 1.2, fmt: (x) => pn(x, 2), scale: 1.2, size: 11 });
            R.tex(j === 1 ? 'N' : `N^{${j}}`, 0.29, y0 + 0.18, { size: 15, align: 'right', color: on ? 'gold' : 'ink' });
            R.text(maxAbs(P[j]) < 1e-12 ? '= 0' : `rank ${ranks[j]}`, 0.73, y0 + 0.18, { size: 12, color: maxAbs(P[j]) < 1e-12 ? 'green' : 'muted', weight: 700 });
          }
          st = { ranks, vols, idx, eps };
        });
        v.legend([['accent', '$N^k(\\text{cube})$', { area: true }], ['muted', 'unit cube', { dash: true }], ['blue', '$N^ke_1$'], ['purple', '$N^ke_2$'], ['teal', '$N^ke_3$']]);
        v.readout(() => {
          if (!st) return '';
          const { ranks, vols, idx, eps } = st;
          const rk = `ranks of $N, N^2, N^3, N^4$: $${ranks.slice(1).join(',\\ ')}$`;
          if (idx > 0) return `${rk}. The first power that is $0$ is $N^{${idx}}$: **$N$ is nilpotent**` + (idx < 3 ? ' (some entries are 0, so it dies early).' : '.');
          return `${rk}; $|\\det N| = ${tn(vols[1], 3)} \\ne 0$, so every power is invertible: **no power of $N$ is $0$**, and $N$ is not nilpotent.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.16
    {
      num: '8.16',
      kind: 'Theorem',
      name: 'Nilpotent operator raised to dim V is 0',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ is nilpotent. Then $T^{\dim V} = 0$.`,
      idea: String.raw`Some power vanishes, say $T^k = 0$; then $\operatorname{null}T^k = V$. The null spaces of the powers increase (8.1) and stop growing by step $\dim V$ (8.3), so $\operatorname{null}T^{\dim V} = \operatorname{null}T^{\max(k, \dim V)} = V$, i.e. $T^{\dim V} = 0$. In chain language: $T$ moves every vector one step down its chain, and no chain is longer than $\dim V$.`,
      caption: String.raw`A nilpotent operator built from chains (left: each arrow is one application of $T$, the bottom cells go to $0$), disguised by a random integer change of basis — on the right are its powers $T, T^2, \dots, T^n$ in the standard basis, computed exactly. The dashed water line sits at height $k$: everything below it is killed by $T^k$. Raise $k$: by $k = n$ every chain is under water and the tile $T^n$ is entirely $0$, while $T^{n-1} \ne 0$ exactly when there is a chain of full length $n$. Switch on the eigenvalue $1$ and no power of $T$ ever vanishes.`,
      deps: ['ladr-8.14', 'ladr-8.1', 'ladr-8.3'],
      tags: ['nilpotent'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n = \\dim V$', 2, 6, 5, { int: true });
        const shape = v.select('chains', [{ value: 'one', label: 'one chain of length $n$' }, { value: 'rand', label: 'random chains' }], 'one');
        const brk = v.toggle('not nilpotent: the first chain ends in the eigenvalue $1$', false);
        let seed = 3;
        v.button('New disguise', () => { seed += 1; });
        const kS = v.slider('water line: apply $T^k$, $k$', 0, 6, 3, { int: true });
        const C = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 370, weight: 0.72, minWidth: 210, title: 'the chains of $T$' });
        const P = v.stage({ x: [0, 3.3], y: [0, 2.6], equal: true, axes: false, height: 370, weight: 1.28, title: 'its powers in the standard basis (exact integers)' });
        const partition = (r, n) => { for (let t = 0; t < 30; t++) { const p = []; let left = n; while (left > 0) { const c = r.int(1, Math.min(left, n - 1 || 1)); p.push(c); left -= c; } if (p.length > 1 || n === 1) return p.sort((x, y) => y - x); } return [n - 1, 1]; };
        let st = null;
        v.render(() => {
          const n = nS.value, k = Math.min(kS.value, n + 1), r = v.rng(seed * 31 + n * 7 + (shape.value === 'rand' ? 1 : 0));
          const chains = shape.value === 'one' ? [n] : partition(r, n);
          const J = Array.from({ length: n }, () => new Array(n).fill(0)); let o = 0;
          for (const c of chains) { for (let i = 0; i + 1 < c; i++) J[o + i][o + i + 1] = 1; o += c; }
          if (brk.value) J[0][0] = 1;
          const S0 = unimodular(r, n, 1), T = conjInt(M, S0, J), pw = [ident(n)];
          for (let j = 1; j <= n + 1; j++) pw.push(mm(pw[j - 1], T));
          const ranks = pw.map((X) => rankInt(X));
          // ---- chains with the water line
          const b = C.bounds, Wd = b.x[1] - b.x[0], Hd = b.y[1] - b.y[0], cols = chains.length;
          const cell = Math.min((0.7 * Wd) / (cols * 1.4), (0.66 * Hd) / (n * 1.35 + 0.6)), gx = cell * 1.4, gy = cell * 1.35;
          const x0 = b.x[0] + Wd / 2 - (cols * gx - 0.4 * cell) / 2 + 0.04 * Wd, y0 = b.y[0] + 0.12 * Hd + 0.6 * cell;
          const xr = x0 + (cols - 1) * gx + cell;
          C.line(x0 - 0.3 * cell, y0 - 0.5 * cell, xr + 0.3 * cell, y0 - 0.5 * cell, { color: 'ink', width: 1.6 });
          C.tex('0', x0 - 0.5 * cell, y0 - 0.5 * cell, { size: 14, align: 'right' });
          chains.forEach((c, i) => {
            const x = x0 + i * gx;
            for (let j = 0; j < c; j++) {
              const y = y0 + j * gy, dead = j < k && !(brk.value && i === 0), keep = brk.value && i === 0;
              C.rect(x, y, x + cell, y + cell, { fill: keep ? 'red' : dead ? 'faint' : 'accent', fillAlpha: dead ? 0.35 : 0.5, color: keep ? 'red' : dead ? 'muted' : 'accent', width: 1.2 });
              if (j > 0 || !keep) C.arrow(x + cell / 2, y - 0.04 * cell, x + cell / 2, j ? y - 0.3 * cell : y0 - 0.46 * cell, { color: 'ink', width: 1.1, head: 5, alpha: 0.6 });
            }
            if (brk.value && i === 0) C.text('↺ Tu = u', x + cell * 1.15, y0 + cell / 2, { color: 'red', size: 11, weight: 700 });
          });
          const wl = y0 + Math.min(k, n + 0.6) * gy - 0.15 * cell;
          C.line(x0 - 0.45 * cell, wl, xr + 0.45 * cell, wl, { color: 'blue', width: 2, dash: [6, 4] });
          C.text(`k = ${k}`, xr + 0.5 * cell, wl, { color: 'blue', size: 12, weight: 700 });
          // ---- tiles T^1 … T^n
          const per = 3, tw = 0.82;
          for (let j = 1; j <= n; j++) {
            const row = Math.floor((j - 1) / per), colI = (j - 1) % per, x = 0.18 + colI * 1.06, y = 2.6 - 0.12 - (row + 1) * 1.24;
            const zero = ranks[j] === 0, on = j === k;
            intTile(P, pw[j], x, y + 0.14, tw, { frame: on ? 'blue' : zero ? 'green' : 'muted', frameW: on || zero ? 2.6 : 1.1, numbers: n <= 4, size: 11 });
            P.tex(j === 1 ? 'T' : `T^{${j}}`, x + tw / 2, y + 0.14 + tw + 0.05, { size: 14, color: on ? 'blue' : 'ink', baseline: 'bottom' });
            P.text(zero ? '= 0' : `rank ${ranks[j]}`, x + tw / 2, y + 0.06, { align: 'center', size: 12, color: zero ? 'green' : 'muted', weight: 700 });
          }
          st = { n, chains, ranks, k, T };
        });
        v.legend([['accent', 'not yet killed by $T^k$', { area: true }], ['faint', 'killed by $T^k$', { area: true }], ['blue', 'the water line / the tile $T^k$']]);
        v.readout(() => {
          if (!st) return '';
          const { n, chains, ranks } = st, mx = Math.max(...chains);
          if (brk.value) return `Chains $${chains.join(', ')}$ with $Tu = u$ at the bottom of the first: rank of $T^{${n}}$ is $${ranks[n]}$, of $T^{${n + 1}}$ is $${ranks[n + 1]}$ — the eigenvalue $1$ survives every power, so **no power of $T$ is $0$**.`;
          return `${chains.length === 1 ? 'One chain of length' : 'Chains of lengths'} $${chains.join(', ')}$ in $\\mathbf F^{${n}}$. **$T^{${n}} = 0$**: all $${n * n}$ entries are exactly $0$. The first vanishing power is $T^{${mx}}$ (the longest chain)` + (mx === n ? `, so $T^{${n - 1}}$ (rank $${ranks[n - 1]}$) is not $0$: the exponent $\\dim V$ cannot be lowered in general.` : `, earlier than $T^{${n}}$ here.`);
        });
      },
    },
  ],
};
