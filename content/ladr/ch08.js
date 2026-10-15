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
/** Small integer matrix tile: heat-coloured cells (blue > 0, red < 0), numbers when there is room. */
function intTile(S, B, x0, y0, w, { frame = 'muted', frameW = 1.1, numbers = true, size } = {}) {
  const n = B.length, cw = w / n, mx = Math.max(1, ...B.flat().map(Math.abs));
  const px = Math.abs(S.X(cw) - S.X(0)), fs = size ?? Math.max(8, Math.min(13, px * 0.42));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const b = B[i][j], x = x0 + j * cw, y = y0 + w - (i + 1) * cw;
    if (b) S.rect(x, y, x + cw, y + cw, { fill: b > 0 ? 'blue' : 'red', fillAlpha: 0.12 + (0.45 * Math.abs(b)) / mx, stroke: false });
    if (numbers && px > 15) S.text(String(b).replace('-', '−'), x + cw / 2, y + cw / 2, { size: fs, align: 'center', baseline: 'middle', color: b ? 'ink' : 'faint', halo: false });
  }
  for (let k = 1; k < n; k++) { S.line(x0 + k * cw, y0, x0 + k * cw, y0 + w, { color: 'grid', width: 0.6 }); S.line(x0, y0 + k * cw, x0 + w, y0 + k * cw, { color: 'grid', width: 0.6 }); }
  S.rect(x0, y0, x0 + w, y0 + w, { color: frame, width: frameW });
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
        const G = v.stage({ x: [-0.5, K + 0.5], y: [-0.4, 9.4], height: 350, weight: 1.35, axes: 'box', xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 2, 4, 6, 8], xlabel: 'k', title: '$\\dim\\operatorname{null}T^k$ against $k$' });
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
          G.setView([-0.5, K + 0.5], [-0.4, Math.max(4, top) + 1.4]);
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
      caption: String.raw`The green subspace is $\operatorname{null}T^k$, the purple one $\operatorname{range}T^k$; red marks their intersection. Their dimensions always add up to 3 (3.21), but for $k = 1$ they overlap, so their sum misses part of $\mathbf R^3$ and the gold $v$ cannot be split. Raise $k$: by $k = 3 = \dim V$ the two are complementary and $v$ splits uniquely into a green and a purple part (the dashed parallelogram). The table tracks all three powers; try the nilpotent chain, where the overlap persists until $k = 3$.`,
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
        const kS = v.slider('power $k$', 1, 3, 1, { int: true });
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
          let s = `$k = ${k}$: $\\dim\\operatorname{null}T^{${k}} + \\dim\\operatorname{range}T^{${k}} = ${I.N.length} + ${I.R.length} = 3$, intersection of dimension $${cap}$. `;
          if (direct) s += `So $\\mathbf R^3 = \\operatorname{null}T^{${k}} \\oplus \\operatorname{range}T^{${k}}$, and $v = ${vtex(a)} + ${vtex(b)}$ uniquely.`;
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
          const pw = ch.slice(1, 4).map((w, k) => `(T - I)^{${k + 1}}v = ${vtex(w)}`).join(',\\ ');
          let s = `$${pw}$. `;
          if (zeroAt === 1) s += '**$v$ is an eigenvector** (so also a generalized eigenvector, with $k = 1$).';
          else if (zeroAt > 1) s += `**$v$ is a generalized eigenvector for $\\lambda = 1$ ($k = ${zeroAt}$) but not an eigenvector**, since $(T - I)v \\ne 0$.`;
          else s += `The lengths shrink by the factor $0.65$ each time but never reach $0$: off the eigen-line, $v$ is **not** a generalized eigenvector for $\\lambda = 1$ (it mixes in the other eigenvalue $0.35$).`;
          return s;
        });
      },
    },
  ],
};
