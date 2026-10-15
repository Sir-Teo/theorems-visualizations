// Axler, Linear Algebra Done Right (4th ed.) — Chapter 3: Linear Maps
// Part 2 (3.38–3.70): matrices of maps, matrix multiplication, column and row rank, invertibility, isomorphisms.
// Part 1 is ch03.js (3.1–3.35); parts 3 and 4 are ch03-c.js and ch03-d.js.

// ---------- shared helpers ----------
/** A number for TeX: d decimals at most, trailing zeros dropped, no "-0". */
function tn(x, d = 2) {
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** The same for canvas text (real minus sign). */
const pn = (x, d = 2) => tn(x, d).replace('-', '−');
/** A rounding-error-sized number for TeX: exact 0 below 1e-12. */
const zs = (v, x) => (x < 1e-12 ? '0' : v.sci(x, 2));
/** A rational-looking number as p/q (q ≤ 12) for canvas text, else decimals. */
function fr(x) {
  if (Math.abs(x) < 1e-9) return '0';
  for (let q = 1; q <= 12; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-7) return (q === 1 ? String(p) : `${p}/${q}`).replace('-', '−'); }
  return pn(x, 2);
}
/** TeX for a matrix (array of rows). */
const mtex = (A, f = (x) => tn(x)) => `\\begin{bmatrix}${A.map((r) => r.map(f).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/** TeX for a list (x₁,…,xₙ). */
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
const ap2 = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
const dotN = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const colOf = (A, k) => A.map((r) => r[k]);
const maxDiff = (A, B) => Math.max(0, ...A.flatMap((r, i) => r.map((x, j) => Math.abs(x - B[i][j]))));
const VC = ['blue', 'purple', 'teal', 'pink'];
/** Orthonormal basis of span(vs) in Rⁿ (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orthN(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of B) { const d = dotN(w, e); w = w.map((c, i) => c - d * e[i]); }
    const l = Math.hypot(...w); if (l > tol * Math.max(1, Math.hypot(...x))) B.push(w.map((c) => c / l));
  }
  return B;
}
/** Sifting (2.30): indices of the vectors that are not in the span of the ones kept before them. */
function sift(vs) {
  const kept = [];
  vs.forEach((x, i) => { if (orthN([...kept.map((j) => vs[j]), x]).length > kept.length) kept.push(i); });
  return kept;
}
/** An asymmetric "F" in the unit square, so that orientation and shear are visible. */
const FSH = [[0, 0], [0.28, 0], [0.28, 0.42], [0.66, 0.42], [0.66, 0.62], [0.28, 0.62], [0.28, 0.8], [0.8, 0.8], [0.8, 1], [0, 1]];
const SQ = [[0, 0], [1, 0], [1, 1], [0, 1]];
/** Images under the 2×2 matrix A of the grid lines x = k and y = k, |k| ≤ n. */
function gridImage(s, A, n, st = {}) {
  for (let k = -n; k <= n; k++) {
    const a = ap2(A, [k, -n]), b = ap2(A, [k, n]), c = ap2(A, [-n, k]), d = ap2(A, [n, k]);
    s.line(a[0], a[1], b[0], b[1], { color: 'grid', width: k ? 1 : 1.6, ...st });
    s.line(c[0], c[1], d[0], d[1], { color: 'grid', width: k ? 1 : 1.6, ...st });
  }
}
/** Title above (or below) a drawn table. */
function ttl(s, T, tex, color = 'ink', below = false, size = 15) {
  const g = T.geo; if (!g) return;
  s.texPx(tex, g.X0 + (g.cols * g.cw) / 2, below ? g.Y0 + g.rows * g.ch + 14 : g.Y0 - g.lh - 13, { color, size });
}
/**
 * Make the cells of the table T editable; get() returns the matrix it shows (mutated in place).
 * Click the upper / lower half of a cell for ±step, or drag a cell up / down.
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
/** Draw span(vs) ⊂ R³ in a scene3: a dot, a line, a disc or a box. Returns its dimension. */
function spanDraw(sc, vs, st = {}) {
  const B = orthN(vs, 1e-6), col = st.color || 'green', R = st.r ?? 2;
  if (B.length === 0) sc.dot([0, 0, 0], { color: col, r: 5.5 });
  else if (B.length === 1) sc.line(B[0].map((c) => -R * c), B[0].map((c) => R * c), { color: col, width: 3.2, alpha: 0.75 }, 16);
  else if (B.length === 2) sc.disc(B[0], B[1], R, { fill: col, color: col, fillAlpha: st.fillAlpha ?? 0.13, grid: true });
  else {
    const c = st.box ?? 1.3, P = (a, b, k, sg) => { const p = [0, 0, 0]; p[k] = sg * c; return [[a, b], [-a, b], [-a, -b], [a, -b]].map(([x, y]) => { const q = p.slice(); q[(k + 1) % 3] = x * c; q[(k + 2) % 3] = y * c; return q; }); };
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) sc.poly(P(1, 1, k, sg), { fill: col, color: col, fillAlpha: 0.035, alpha: 0.35 });
  }
  return B.length;
}

export default {
  collection: 'ladr',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.38
    {
      num: '3.38',
      kind: 'Theorem',
      name: 'Matrix of a scalar times a linear map',
      statement: String.raw`Suppose $\lambda \in \mathbf F$ and $T \in \mathcal L(V, W)$, and fix bases $v_1,\dots,v_n$ of $V$ and $w_1,\dots,w_m$ of $W$. Then, with respect to these bases,
$$\mathcal M(\lambda T) = \lambda\,\mathcal M(T),$$
where $\lambda$ times a matrix means multiplying every entry by $\lambda$.`,
      idea: String.raw`Column $k$ of $\mathcal M(\lambda T)$ lists the coordinates of $(\lambda T)v_k = \lambda(Tv_k)$ in the basis $w_1,\dots,w_m$. If $Tv_k = \sum_j A_{j,k} w_j$, then $\lambda Tv_k = \sum_j (\lambda A_{j,k}) w_j$, and coordinates in a basis are unique (2.29), so the $(j,k)$ entry of $\mathcal M(\lambda T)$ is $\lambda A_{j,k}$. Scalar multiplication of matrices is defined precisely so that this works.`,
      caption: String.raw`Drag the tips $Tv_1$, $Tv_2$ to choose a map $T$ of $\mathbf R^2$ and slide $\lambda$. The dashed F is the image under $T$, the solid one the image under $\lambda T$. The upper matrix is computed from $T$ alone; the lower one from the map $\lambda T$, by reading the coordinates of $\lambda Tv_k$ off the grid of the basis $w_1, w_2$. Switch to the skewed basis: every entry still scales by exactly $\lambda$. Try $\lambda = 0$ and $\lambda < 0$.`,
      deps: ['ladr-3.31', 'ladr-3.6'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const P = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 360, axes: false, title: 'images of the F under $T$ and $\\lambda T$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.8, minWidth: 240 });
        const lam = v.slider('$\\lambda$', -2, 2, 1.5, { step: 0.05 });
        const bas = v.select('bases of $V = W = \\mathbf R^2$', [{ value: 'std', label: 'standard' }, { value: 'skew', label: 'skewed: $(1,0),\\,(1,1)$' }], 'std');
        const BS = { std: [[1, 0], [0, 1]], skew: [[1, 1], [0, 1]] }; // columns are v₁ = w₁, v₂ = w₂
        let A = [[1, 0.4], [0.3, 0.9]], last = 'std';                    // standard matrix of T
        const h1 = P.handle(1, 0.3, { color: 'blue', label: 'Tv₁', labelPos: 's' }), h2 = P.handle(0.4, 0.9, { color: 'purple', label: 'Tv₂', labelPos: 'w' });
        const T1 = v.table(Q, { rows: 2, cols: 2, region: [0, 0.5, 1, 0.98], maxCell: 56, size: 15, rowLabels: ['$w_1$', '$w_2$'], colLabels: ['$Tv_1$', '$Tv_2$'] });
        const T2 = v.table(Q, { rows: 2, cols: 2, region: [0, 0.0, 1, 0.48], maxCell: 56, size: 15, rowLabels: ['$w_1$', '$w_2$'], colLabels: ['$\\lambda Tv_1$', '$\\lambda Tv_2$'] });
        let st = null;
        v.render(() => {
          const B = BS[bas.value], Bi = M.inverse(B), b1 = colOf(B, 0), b2 = colOf(B, 1);
          if (last !== bas.value) { last = bas.value; const p = ap2(A, b1), q = ap2(A, b2); h1.set(p[0], p[1]); h2.set(q[0], q[1]); }
          A = M.matMul([[h1.x, h2.x], [h1.y, h2.y]], Bi);                // T sends v_k to the handle k
          const L = lam.value, LA = A.map((r) => r.map((x) => L * x));
          const coordsOf = (p) => ap2(Bi, p);                             // coordinates in w₁, w₂
          const MT = M.transpose([coordsOf(ap2(A, b1)), coordsOf(ap2(A, b2))]);
          const MLT = M.transpose([coordsOf(ap2(LA, b1)), coordsOf(ap2(LA, b2))]);   // from the map λT
          // the grid of the basis w₁, w₂ (coordinates are read off it)
          for (let k = -6; k <= 6; k++) {
            P.line(...ap2(B, [k, -6]), ...ap2(B, [k, 6]), { color: 'grid', width: k ? 1 : 1.5 });
            P.line(...ap2(B, [-6, k]), ...ap2(B, [6, k]), { color: 'grid', width: k ? 1 : 1.5 });
          }
          P.arrow(0, 0, b1[0], b1[1], { color: 'muted', width: 1.6, head: 7 }); P.arrow(0, 0, b2[0], b2[1], { color: 'muted', width: 1.6, head: 7 });
          P.tex('w_1', b1[0], b1[1], { color: 'muted', dx: 6, dy: 12, size: 13 }); P.tex('w_2', b2[0], b2[1], { color: 'muted', dx: -14, dy: -4, size: 13 });
          const img = (C) => FSH.map((p) => ap2(C, p));
          P.poly(img(A), { color: 'muted', width: 1.4, dash: [5, 4], fill: false });
          P.poly(img(LA), { color: 'accent', fill: 'accent', fillAlpha: 0.2, width: 2 });
          const p1 = ap2(LA, b1), p2 = ap2(LA, b2);
          P.arrow(0, 0, h1.x, h1.y, { color: 'blue', width: 1.6, alpha: 0.55, dash: [4, 3] }); P.arrow(0, 0, h2.x, h2.y, { color: 'purple', width: 1.6, alpha: 0.55, dash: [4, 3] });
          P.arrow(0, 0, p1[0], p1[1], { color: 'blue', width: 2.8 }); P.arrow(0, 0, p2[0], p2[1], { color: 'purple', width: 2.8 });
          P.tex('\\lambda Tv_1', p1[0], p1[1], { color: 'blue', dx: 16, dy: 14, size: 13 }); P.tex('\\lambda Tv_2', p2[0], p2[1], { color: 'purple', dx: -20, dy: -10, size: 13 });
          const cc = (i, j) => (j === 0 ? 'blue' : 'purple');
          T1.draw({ value: (i, j) => MT[i][j], format: (x) => pn(x), textColor: cc });
          T2.draw({ value: (i, j) => MLT[i][j], format: (x) => pn(x), textColor: cc, fill: () => ['accent', 0.1], sub: (i, j) => `${pn(L)}·${pn(MT[i][j])}`, subSize: 9.5 });
          ttl(Q, T1, '\\mathcal M(T)', 'ink'); ttl(Q, T2, '\\mathcal M(\\lambda T)', 'accent');
          st = { MT, MLT, L, err: maxDiff(MLT, MT.map((r) => r.map((x) => L * x))) };
        });
        v.legend([['muted', 'image under $T$', { dash: true }], ['accent', 'image under $\\lambda T$', { area: true }]]);
        v.readout(() => st && `$\\mathcal M(\\lambda T) = ${mtex(st.MLT)}$ and $\\lambda\\,\\mathcal M(T) = ${tn(st.L)}\\cdot${mtex(st.MT)} = ${mtex(st.MT.map((r) => r.map((x) => st.L * x)))}$ — largest entry difference $${zs(v, st.err)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.40
    {
      num: '3.40',
      kind: 'Theorem',
      name: String.raw`$\dim \mathbf F^{m,n} = mn$`,
      statement: String.raw`For positive integers $m$ and $n$, the set $\mathbf F^{m,n}$ of $m$-by-$n$ matrices with entries in $\mathbf F$ is a vector space under entrywise addition and scalar multiplication, and
$$\dim \mathbf F^{m,n} = mn.$$`,
      idea: String.raw`Let $E_{j,k}$ be the matrix with $1$ in row $j$, column $k$ and $0$ elsewhere. Every matrix is $A = \sum_{j,k} A_{j,k} E_{j,k}$, so these $mn$ matrices span; and if $\sum c_{j,k} E_{j,k} = 0$ then each $c_{j,k}$, being the $(j,k)$ entry of that sum, is $0$, so they are linearly independent. A basis of length $mn$ gives the dimension (2.35). This is just $\mathbf F^{mn}$ with its coordinates written in a rectangle.`,
      caption: String.raw`The tiles are the basis matrices $E_{j,k}$, each scaled by the matching entry of $A$ (edit $A$ on the right: click the top or bottom half of an entry, or drag it). Their sum rebuilds $A$. Click a tile to throw it out of the list: the entry it was responsible for can no longer be produced (red), so no tile is redundant. Change $m$ and $n$ and count the tiles.`,
      deps: ['ladr-2.35', 'ladr-2.26'],
      tags: ['matrices', 'dimension'],
      viz(v) {
        const mS = v.slider('$m$ (rows)', 1, 4, 2, { int: true }), nS = v.slider('$n$ (columns)', 1, 4, 3, { int: true });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.3, title: 'the basis $E_{j,k}$, scaled by $A_{j,k}$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 250 });
        const A = [[3, -1, 2, 1], [0, 2, -2, 1], [1, 1, 0, -1], [2, 0, 1, 3]];
        const off = new Set(['0,1']);
        let geo = null;
        S.onClick((x, y) => { if (!geo) return; for (const t of geo) if (x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1) { const k = `${t.j},${t.k}`; off.has(k) ? off.delete(k) : off.add(k); } });
        const TA = v.table(Q, { rows: 2, cols: 3, region: [0, 0.5, 1, 0.97], maxCell: 46, size: 14 });
        const TS = v.table(Q, { rows: 2, cols: 3, region: [0, 0.0, 1, 0.47], maxCell: 46, size: 14 });
        editable(v, Q, TA, () => A, { min: -9, max: 9 });
        let st = null;
        v.render(() => {
          const m = mS.value, n = nS.value;
          for (const k of [...off]) { const [j, kk] = k.split(',').map(Number); if (j >= m || kk >= n) off.delete(k); }
          // tiles laid out like the entries they own
          const W = S.width, H = S.height - 30, gap = 14, lab = 16, pad = 14;
          const cs = Math.min(42, (W - 2 * pad - (n - 1) * gap) / (n * n), (H - 2 * pad - m * lab - (m - 1) * gap) / (m * m)), tW = cs * n, tH = cs * m;
          const X0 = (W - (n * tW + (n - 1) * gap)) / 2, Y0 = 30 + (H - (m * (tH + lab) + (m - 1) * gap)) / 2 + lab;
          geo = [];
          for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) {
            const px = X0 + k * (tW + gap), py = Y0 + j * (tH + lab + gap), gone = off.has(`${j},${k}`);
            const [x0, y1] = S.inv(px, py), [x1, y0] = S.inv(px + tW, py + tH);
            geo.push({ j, k, x0, x1, y0, y1 });
            for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
              const [cx0, cy1] = S.inv(px + b * cs, py + a * cs), [cx1, cy0] = S.inv(px + (b + 1) * cs, py + (a + 1) * cs), on = a === j && b === k;
              S.rect(cx0, cy0, cx1, cy1, { color: 'faint', width: 0.8, fill: on ? (gone ? 'red' : 'accent') : false, fillAlpha: on ? (gone ? 0.12 : 0.15 + 0.06 * Math.min(5, Math.abs(A[j][k]))) : 0 });
              S.text(on ? pn(A[j][k]) : '0', (cx0 + cx1) / 2, (cy0 + cy1) / 2, { align: 'center', size: Math.min(13, cs * 0.42), color: on ? (gone ? 'red' : 'accent') : 'faint', weight: on ? 700 : 400, alpha: gone ? 0.5 : 1 });
            }
            S.rect(x0, y0, x1, y1, { color: gone ? 'red' : 'muted', width: 1.4, dash: gone ? [4, 3] : false });
            if (gone) { S.line(x0, y0, x1, y1, { color: 'red', width: 1.5, alpha: 0.6 }); S.line(x0, y1, x1, y0, { color: 'red', width: 1.5, alpha: 0.6 }); }
            S.textPx(`${pn(A[j][k])}·E${'₀₁₂₃₄'[j + 1]},${'₀₁₂₃₄'[k + 1]}`, px + tW / 2, py - 7, { align: 'center', size: 11, color: gone ? 'red' : 'muted', weight: 600 });
          }
          S.corner(`${m}·${n} = ${m * n} tiles${off.size ? `, ${off.size} thrown out` : ''}`, 'bl', { color: off.size ? 'red' : 'green', weight: 700 });
          TA.set({ rows: m, cols: n }); TS.set({ rows: m, cols: n });
          const sum = A.slice(0, m).map((r, j) => r.slice(0, n).map((x, k) => (off.has(`${j},${k}`) ? 0 : x)));
          const bad = [];
          for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) if (sum[j][k] !== A[j][k]) bad.push([j, k]);
          TA.draw({ value: (i, j) => A[i][j], fill: () => ['accent', 0.08] });
          TS.draw({ value: (i, j) => sum[i][j], fill: (i, j) => (off.has(`${i},${j}`) ? ['red', A[i][j] ? 0.28 : 0.1] : ['green', 0.12]), highlight: bad.map(([i, j]) => [i, j, 'red']) });
          ttl(Q, TA, 'A \\in \\mathbf F^{' + m + ',' + n + '}', 'accent', false, 14);
          ttl(Q, TS, '\\textstyle\\sum_{\\text{kept}} A_{j,k}E_{j,k}', bad.length ? 'red' : 'green', false, 14);
          st = { m, n, bad, k: off.size };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, n, bad, k } = st;
          const base = `$\\dim \\mathbf F^{${m},${n}} = ${m}\\cdot${n} = ${m * n}$: the ${m * n} matrices $E_{j,k}$ span ($A = \\sum A_{j,k}E_{j,k}$) and are independent (the $(j,k)$ entry of $\\sum c_{j,k}E_{j,k}$ is $c_{j,k}$).`;
          if (!k) return base + ' **Every $A$ is rebuilt.**';
          return base + ` With ${k} tile${k > 1 ? 's' : ''} removed the remaining ${m * n - k} span only a ${m * n - k}-dimensional subspace: ` + (bad.length ? `**this $A$ is out of reach** (red entries).` : `this $A$ is still reached only because its missing entries are $0$ — edit one.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.41
    {
      num: '3.41',
      kind: 'Definition',
      name: 'Matrix multiplication',
      statement: String.raw`Suppose $A$ is an $m$-by-$n$ matrix and $B$ is an $n$-by-$p$ matrix. Their product $AB$ is the $m$-by-$p$ matrix whose entry in row $j$, column $k$ is
$$(AB)_{j,k} = \sum_{r=1}^{n} A_{j,r} B_{r,k}.$$
The product is defined only when the number of columns of $A$ equals the number of rows of $B$.`,
      idea: String.raw`The definition is reverse-engineered from composition: it is the unique rule that makes $\mathcal M(ST) = \mathcal M(S)\mathcal M(T)$ (3.43). Entry $(j,k)$ pairs row $j$ of $A$ with column $k$ of $B$, term by term — which is why their lengths must agree.`,
      caption: String.raw`Hover over (or click) an entry of $AB$: row $j$ of $A$ and column $k$ of $B$ light up, and the readout adds the products of matching entries (numbered $1, 2, \dots$). $B$ sits above $AB$ and $A$ to its left, so rows and columns line up. Edit $A$ and $B$ by clicking the top/bottom half of an entry. Choose the mismatched shapes to see why the product is undefined.`,
      deps: ['ladr-3.31'],
      tags: ['matrices'],
      viz(v) {
        const SH = { a: [2, 3, 3, 2], b: [3, 2, 2, 4], c: [2, 2, 2, 2], d: [2, 3, 2, 2] }; // m, n (cols of A), rows of B, p
        const shp = v.select('shapes', [{ value: 'a', label: '$2{\\times}3 \\cdot 3{\\times}2$' }, { value: 'b', label: '$3{\\times}2 \\cdot 2{\\times}4$' }, { value: 'c', label: '$2{\\times}2 \\cdot 2{\\times}2$' }, { value: 'd', label: '$2{\\times}3 \\cdot 2{\\times}2$ (mismatch)' }], 'a');
        const S = v.stage({ x: [-1, 7], y: [-1, 6], equal: true, axes: false, height: 360, hover: true, full: true });
        const A = [[2, -1, 3, 1], [0, 1, -2, 2], [1, 3, 1, -1]], B = [[1, 2, 0, -1], [-1, 1, 2, 3], [2, 0, 1, 1]];
        const TA = v.table(S, { rows: 2, cols: 3, cell: [1, 1], size: 17 }), TB = v.table(S, { rows: 3, cols: 2, cell: [1, 1], size: 17 }), TP = v.table(S, { rows: 2, cols: 2, cell: [1, 1], size: 17 });
        editable(v, S, TA, () => A, { min: -5, max: 5 }); editable(v, S, TB, () => B, { min: -5, max: 5 });
        let sel = [0, 1], st = null;
        S.onClick((x, y) => { const c = TP.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        v.render(() => {
          const [m, n, nb, p] = SH[shp.value], ok = n === nb, g = 0.7;
          const W = n + g + p, Hh = m + g + nb;
          S.setView([-1.2, W + 0.6], [-1.1, Hh + 0.5]);
          if (S.pointer.inside) { const c = TP.hit(S.pointer.x, S.pointer.y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; }
          const [j, k] = [Math.min(sel[0], m - 1), Math.min(sel[1], p - 1)];
          const prod = (a, b) => { let s = 0; for (let r = 0; r < n; r++) s += A[a][r] * B[r][b]; return s; };
          const num = (i0, j0) => String(i0 + 1);
          TA.set({ rows: m, cols: n, x0: 0, y0: m }); TB.set({ rows: nb, cols: p, x0: n + g, y0: Hh }); TP.set({ rows: m, cols: p, x0: n + g, y0: m });
          TA.draw({ value: (i, c) => A[i][c], activeRow: j, fill: (i, c) => (i === j ? [c < nb ? VC[c % 4] : 'red', 0.22] : null), sub: (i, c) => (i === j ? num(c) : null), subColor: (i, c) => (c < nb ? VC[c % 4] : 'red') });
          TB.draw({ value: (i, c) => B[i][c], activeCol: k, fill: (i, c) => (c === k ? [i < n ? VC[i % 4] : 'red', 0.22] : null), sub: (i, c) => (c === k ? num(i) : null), subColor: (i) => (i < n ? VC[i % 4] : 'red') });
          TP.draw({ value: (i, c) => (ok ? prod(i, c) : '?'), textColor: () => (ok ? 'ink' : 'red'), fill: (i, c) => (i === j && c === k ? [ok ? 'green' : 'red', 0.25] : ok ? null : ['red', 0.06]), highlight: [[j, k, ok ? 'green' : 'red']] });
          S.tex('A', -0.55, m / 2, { size: 19, color: 'ink' });
          S.tex('B', n + g - 0.5, m + g + nb / 2, { size: 19, color: 'ink' });
          S.tex('AB', n + g + p / 2, -0.55, { size: 17, color: ok ? 'green' : 'red' });
          if (!ok) S.corner(`A has ${n} columns but B has ${nb} rows: AB is undefined`, 'tl', { color: 'red', weight: 700, size: 13 });
          else S.corner(`(${m}×${n}) · (${n}×${p}) = ${m}×${p}`, 'tl', { color: 'muted', weight: 600, size: 13 });
          st = { ok, j, k, n, nb, terms: ok ? [...Array(n).keys()].map((r) => [A[j][r], B[r][k]]) : null, val: ok ? prod(j, k) : null };
        });
        v.readout(() => {
          if (!st) return '';
          const { ok, j, k, n, nb, terms, val } = st;
          if (!ok) return `Row $${j + 1}$ of $A$ has ${n} entries but column $${k + 1}$ of $B$ has ${nb}: the products $A_{${j + 1},r}B_{r,${k + 1}}$ cannot be paired off, so $AB$ is not defined.`;
          return `$(AB)_{${j + 1},${k + 1}} = \\sum_{r=1}^{${n}} A_{${j + 1},r}B_{r,${k + 1}} = ${terms.map(([a, b]) => `(${a})(${b})`).join(' + ')} = ${val}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.43
    {
      num: '3.43',
      kind: 'Theorem',
      name: 'Matrix of product of linear maps',
      statement: String.raw`Suppose $T \in \mathcal L(U, V)$ and $S \in \mathcal L(V, W)$, and fix bases $u_1,\dots,u_p$ of $U$, $v_1,\dots,v_n$ of $V$ and $w_1,\dots,w_m$ of $W$. Then
$$\mathcal M(ST) = \mathcal M(S)\,\mathcal M(T),$$
where $\mathcal M(T)$ uses the bases of $U$ and $V$, $\mathcal M(S)$ those of $V$ and $W$, and $\mathcal M(ST)$ those of $U$ and $W$.`,
      idea: String.raw`Write $A = \mathcal M(S)$ and $B = \mathcal M(T)$. Then $STu_k = S\bigl(\sum_r B_{r,k} v_r\bigr) = \sum_r B_{r,k} Sv_r = \sum_r B_{r,k}\sum_j A_{j,r} w_j = \sum_j \bigl(\sum_r A_{j,r}B_{r,k}\bigr) w_j$, using only linearity of $S$. The coefficient of $w_j$ is exactly $(AB)_{j,k}$ by definition 3.41.`,
      caption: String.raw`$T$ is a shear, $S$ a rotation of $\mathbf R^2$ (standard bases). The orange F is $T$ applied to the faint one; the blue F is $S$ applied to that — the map $ST$ computed by doing one map after the other. The green dots are the corners moved by the single matrix $\mathcal M(S)\mathcal M(T)$: they sit exactly on the blue corners. Switch on the other order to see $TS$, a different map.`,
      deps: ['ladr-3.41', 'ladr-3.31'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const P = v.stage({ x: [-2.9, 2.9], y: [-2.9, 2.9], equal: true, height: 360, axes: false, title: 'the unit square and an F, moved by $T$, then by $S$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.85, minWidth: 250 });
        const th = v.slider('$S$: rotate by $\\theta$', -180, 180, 110, { step: 1, fmt: (x) => `${x}°` });
        const kk = v.slider('$T$: shear $k$', -2, 2, 1, { step: 0.05 });
        const other = v.toggle('also show $TS$', false);
        const regions = [[0, 0.5, 0.5, 0.97], [0.5, 0.5, 1, 0.97], [0, 0, 0.5, 0.47], [0.5, 0, 1, 0.47]];
        const tabs = regions.map((r) => v.table(Q, { rows: 2, cols: 2, region: r, maxCell: 44, size: 13.5 }));
        let st = null;
        v.render(() => {
          const t = (th.value * Math.PI) / 180, k = kk.value;
          const Sf = (p) => [Math.cos(t) * p[0] - Math.sin(t) * p[1], Math.sin(t) * p[0] + Math.cos(t) * p[1]];  // the maps themselves
          const Tf = (p) => [p[0] + k * p[1], p[1]];
          const mat = (f) => M.transpose([f([1, 0]), f([0, 1])]);            // columns = images of e₁, e₂
          const MS = mat(Sf), MT = mat(Tf), MST = mat((p) => Sf(Tf(p))), AB = M.matMul(MS, MT), BA = M.matMul(MT, MS);
          gridImage(P, [[1, 0], [0, 1]], 3); P.poly(SQ, { color: 'faint', width: 1, fill: 'faint', fillAlpha: 0.06 }); P.poly(FSH, { color: 'muted', width: 1, fill: false, alpha: 0.7 });
          P.poly(SQ.map(Tf), { color: 'orange', width: 1, dash: [4, 3], fill: false }); P.poly(FSH.map(Tf), { color: 'orange', width: 1.6, fill: 'orange', fillAlpha: 0.1 });
          P.poly(SQ.map((p) => Sf(Tf(p))), { color: 'accent', width: 1.2, dash: [4, 3], fill: false }); P.poly(FSH.map((p) => Sf(Tf(p))), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2 });
          if (other.value) { P.poly(SQ.map((p) => Tf(Sf(p))), { color: 'red', width: 1.2, dash: [4, 3], fill: false }); P.poly(FSH.map((p) => Tf(Sf(p))), { color: 'red', width: 2, dash: [6, 4], fill: false }); }
          P.dots([...FSH, ...SQ].map((p) => ap2(AB, p)), { r: 3.2, color: 'green' });
          const e = Sf(Tf([1, 0])), f = Sf(Tf([0, 1]));
          P.tex('ST e_1', e[0], e[1], { color: 'accent', dx: 18, dy: 10, size: 12 }); P.tex('ST e_2', f[0], f[1], { color: 'accent', dx: 0, dy: -12, size: 12 });
          const show = [[MS, '\\mathcal M(S)', 'accent'], [MT, '\\mathcal M(T)', 'orange'], [AB, '\\mathcal M(S)\\,\\mathcal M(T)', 'green'], [MST, '\\mathcal M(ST)', 'accent']];
          show.forEach(([X, lab, col], i) => { tabs[i].draw({ value: (a, b) => X[a][b], format: (x) => pn(x), fill: i >= 2 ? () => [col, 0.1] : null }); ttl(Q, tabs[i], lab, col, false, 13.5); });
          st = { err: maxDiff(MST, AB), d: maxDiff(BA, AB), AB, BA };
        });
        v.legend([['orange', '$T$(F)'], ['accent', '$S(T(\\mathrm F))$', { area: true }], ['green', 'corners $\\times\\,\\mathcal M(S)\\mathcal M(T)$', { dot: true }], ['red', '$T(S(\\mathrm F))$', { dash: true }]]);
        v.readout(() => st && `$\\max|\\mathcal M(ST) - \\mathcal M(S)\\mathcal M(T)| = ${zs(v, st.err)}$, while $\\mathcal M(T)\\mathcal M(S) = ${mtex(st.BA)}$ differs from $\\mathcal M(S)\\mathcal M(T)$ by up to ${tn(st.d, 3)}: the order matters.`);
      },
    },
    // ------------------------------------------------------------------ 3.46
    {
      num: '3.46',
      kind: 'Theorem',
      name: 'Entry of matrix product equals row times column',
      statement: String.raw`Suppose $A$ is $m$-by-$n$ and $B$ is $n$-by-$p$. Then for $1 \le j \le m$ and $1 \le k \le p$,
$$(AB)_{j,k} = A_{j,\cdot}\,B_{\cdot,k},$$
the product of the $1$-by-$n$ matrix formed by row $j$ of $A$ with the $n$-by-$1$ matrix formed by column $k$ of $B$.`,
      idea: String.raw`Multiplying a $1$-by-$n$ matrix by an $n$-by-$1$ matrix gives a $1$-by-$1$ matrix whose single entry is $\sum_r A_{j,r}B_{r,k}$ by 3.41 — and that is the definition of $(AB)_{j,k}$. In $\mathbf R^n$ this number is the dot product of the row and the column: their lengths times the cosine of the angle between them.`,
      caption: String.raw`Click an entry of $AB$ (right). In the 3D view, row $j$ of $A$ is the blue arrow and column $k$ of $B$ the orange one; drag their tips to edit $A$ and $B$ (drag the background to rotate). The green segment is the shadow of the row on the column's line: shadow length $\times$ column length $= (AB)_{j,k}$. Make the arrows perpendicular to get $0$.`,
      deps: ['ladr-3.41'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, axes: false, height: 380, title: 'row $j$ of $A$ and column $k$ of $B$ in $\\mathbf R^3$' });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.33, axis: 2.1 });
        const Q = v.stage({ x: [-1, 7.6], y: [-1.1, 7.4], equal: true, axes: false, height: 380, weight: 0.85, minWidth: 250 });
        const A = [[1, 0.5, 1.5], [-1, 1, 0], [0.5, -1.5, 1]], B = [[0.5, 0, -0.5], [1.5, 1, 1], [-0.5, -1, 0.5]];
        let sel = [0, 0];
        const snap = (p) => p.map((c) => Math.round(c * 10) / 10);
        const ha = sc.handle(A[0], { color: 'blue', lim: 2, snap }), hb = sc.handle(colOf(B, 0), { color: 'orange', lim: 2, snap });
        const TA = v.table(Q, { rows: 3, cols: 3, cell: [1, 1], x0: 0, y0: 3, size: 13 }), TB = v.table(Q, { rows: 3, cols: 3, cell: [1, 1], x0: 3.6, y0: 6.6, size: 13 }), TP = v.table(Q, { rows: 3, cols: 3, cell: [1, 1], x0: 3.6, y0: 3, size: 13 });
        Q.onClick((x, y) => { const c = TP.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { sel = [c.i, c.j]; ha.set(A[c.i]); hb.set(colOf(B, c.j)); } });
        let st = null;
        v.render(() => {
          const [j, k] = sel;
          A[j] = ha.p.slice(); for (let r = 0; r < 3; r++) B[r][k] = hb.p[r];
          const a = A[j], b = colOf(B, k), d = dotN(a, b), bb = dotN(b, b), foot = b.map((c) => (c * d) / (bb || 1));
          sc.begin();
          sc.line(b.map((c) => -1.3 * c), b.map((c) => 1.3 * c), { color: 'orange', width: 1, alpha: 0.45, dash: true });
          sc.line(a, foot, { color: 'muted', width: 1.2, dash: true });
          sc.line([0, 0, 0], foot, { color: 'green', width: 8, alpha: 0.55 }, 6);
          sc.arrow([0, 0, 0], b, { color: 'orange' }); sc.arrow([0, 0, 0], a, { color: 'blue' });
          sc.tex(`A_{${j + 1},\\cdot}`, a, { color: 'blue', dx: 20, dy: -12, size: 14 }); sc.tex(`B_{\\cdot,${k + 1}}`, b, { color: 'orange', dx: 22, dy: 12, size: 14 });
          sc.flush();
          const P = M.matMul(A, B);
          const f1 = (x) => pn(x, 1);
          TA.draw({ value: (i, c) => A[i][c], format: f1, activeRow: j, activeColor: 'blue', fill: (i) => (i === j ? ['blue', 0.18] : null) });
          TB.draw({ value: (i, c) => B[i][c], format: f1, activeCol: k, activeColor: 'orange', fill: (i, c) => (c === k ? ['orange', 0.18] : null) });
          TP.draw({ value: (i, c) => P[i][c], format: (x) => pn(x, 2), fill: (i, c) => (i === j && c === k ? ['green', 0.25] : null), highlight: [[j, k, 'green']] });
          Q.tex('A', -0.5, 1.5, { size: 17 }); Q.tex('B', 3.1, 5.1, { size: 17 }); Q.tex('AB', 5.1, -0.5, { size: 15, color: 'green' });
          st = { j, k, a, b, d, P: P[j][k], sh: d / Math.sqrt(bb || 1), nb: Math.sqrt(bb) };
        });
        v.legend([['blue', 'row $j$ of $A$'], ['orange', 'column $k$ of $B$'], ['green', 'shadow of the row on the column']]);
        v.readout(() => {
          if (!st) return '';
          const { j, k, a, b, d, P, sh, nb } = st;
          return `$(AB)_{${j + 1},${k + 1}} = A_{${j + 1},\\cdot}B_{\\cdot,${k + 1}} = ${a.map((x, r) => `(${tn(x, 1)})(${tn(b[r], 1)})`).join(' + ')} = ${tn(d, 2)}$ $= ${tn(sh, 2)} \\times ${tn(nb, 2)}$ (signed shadow × length) — the entry in the product table is ${tn(P, 2)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.48
    {
      num: '3.48',
      kind: 'Theorem',
      name: 'Column of matrix product equals matrix times column',
      statement: String.raw`Suppose $A$ is $m$-by-$n$ and $B$ is $n$-by-$p$. Then for $1 \le k \le p$,
$$(AB)_{\cdot,k} = A\,B_{\cdot,k}:$$
column $k$ of $AB$ is $A$ times column $k$ of $B$.`,
      idea: String.raw`By 3.46 the $j$-th entry of $(AB)_{\cdot,k}$ is $A_{j,\cdot}B_{\cdot,k}$, and by the same theorem (applied to $A$ and the $n$-by-$1$ matrix $B_{\cdot,k}$) that is also the $j$-th entry of $AB_{\cdot,k}$. So $B$'s columns go through $A$ one at a time and independently of each other.`,
      caption: String.raw`Left: drag the three columns $b_1, b_2, b_3$ of a $2$-by-$3$ matrix $B$. Right: drag $Ae_1$, $Ae_2$ (grey) to choose $A$; the grid shows how $A$ warps the plane. The coloured arrows on the right are the columns of $AB$ — and each is its left-hand arrow carried along by the warped grid; the green rings, computed as $A\,b_k$, sit on their tips.`,
      deps: ['ladr-3.41', 'ladr-3.46'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 320, title: 'columns of $B$' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 320, title: 'columns of $AB$: the same arrows moved by $A$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const bh = [[1, 0.5], [-0.5, 1], [1, -1]].map((p, k) => L.handle(p[0], p[1], { color: VC[k], label: `b${'₁₂₃'[k]}` }));
        const a1 = R.handle(1.2, 0.4, { color: 'muted', label: 'Ae₁' }), a2 = R.handle(-0.5, 1, { color: 'muted', label: 'Ae₂' });
        const TA = v.table(Q, { rows: 2, cols: 2, region: [0, 0, 0.27, 0.86], maxCell: 44, size: 14 });
        const TB = v.table(Q, { rows: 2, cols: 3, region: [0.3, 0, 0.63, 0.86], maxCell: 44, size: 14 });
        const TP = v.table(Q, { rows: 2, cols: 3, region: [0.66, 0, 1, 0.86], maxCell: 44, size: 14 });
        let st = null;
        v.render(() => {
          const A = [[a1.x, a2.x], [a1.y, a2.y]], B = [[bh[0].x, bh[1].x, bh[2].x], [bh[0].y, bh[1].y, bh[2].y]], AB = M.matMul(A, B);
          gridImage(L, [[1, 0], [0, 1]], 4); gridImage(R, A, 4);
          L.poly(SQ, { color: 'muted', width: 1, fill: 'muted', fillAlpha: 0.08 }); R.poly(SQ.map((p) => ap2(A, p)), { color: 'muted', width: 1, fill: 'muted', fillAlpha: 0.08 });
          R.arrow(0, 0, a1.x, a1.y, { color: 'muted', width: 1.5, head: 7 }); R.arrow(0, 0, a2.x, a2.y, { color: 'muted', width: 1.5, head: 7 });
          bh.forEach((h, k) => {
            L.arrow(0, 0, h.x, h.y, { color: VC[k], width: 2.6 });
            const c = colOf(AB, k), q = ap2(A, [h.x, h.y]);
            R.arrow(0, 0, c[0], c[1], { color: VC[k], width: 2.6 });
            R.dot(q[0], q[1], { r: 8, hollow: true, color: 'green', width: 2 });
            R.tex(`(AB)_{\\cdot,${k + 1}}`, c[0], c[1], { color: VC[k], dx: c[0] >= 0 ? 30 : -30, dy: c[1] >= 0 ? -10 : 12, size: 12 });
          });
          const cc = (i, j) => VC[j];
          TA.draw({ value: (i, j) => A[i][j], format: (x) => pn(x, 2) }); TB.draw({ value: (i, j) => B[i][j], format: (x) => pn(x, 2), textColor: cc }); TP.draw({ value: (i, j) => AB[i][j], format: (x) => pn(x, 2), textColor: cc, fill: () => ['green', 0.08] });
          ttl(Q, TA, 'A'); ttl(Q, TB, 'B'); ttl(Q, TP, 'AB', 'green');
          st = { A, B, AB };
        });
        v.legend([['blue', '$b_1 \\mapsto (AB)_{\\cdot,1}$'], ['purple', '$b_2 \\mapsto (AB)_{\\cdot,2}$'], ['teal', '$b_3 \\mapsto (AB)_{\\cdot,3}$'], ['green', '$A\\,b_k$ computed separately', { dot: true }]]);
        v.readout(() => st && [0, 1, 2].map((k) => `$A\\,b_${k + 1} = ${vtex(ap2(st.A, colOf(st.B, k)))}$`).join(' · ') + ' — the three columns of $AB$.');
      },
    },
    // ------------------------------------------------------------------ 3.50
    {
      num: '3.50',
      kind: 'Theorem',
      name: 'Linear combination of columns',
      statement: String.raw`Suppose $A$ is an $m$-by-$n$ matrix and $b = (b_1,\dots,b_n)^{\mathrm t}$ is an $n$-by-$1$ matrix. Then
$$Ab = b_1 A_{\cdot,1} + \cdots + b_n A_{\cdot,n}.$$
In particular $Ab$ lies in the span of the columns of $A$.`,
      idea: String.raw`Compare the $j$-th entries: on the left it is $\sum_k A_{j,k}b_k$ by definition 3.41, on the right it is $\sum_k b_k A_{j,k}$. The theorem turns "matrix times vector" from a table of dot products (rows) into a recipe for walking along the columns.`,
      caption: String.raw`Drag the three column tips of $A$ (a $2$-by-$3$ matrix) and move the sliders $b_1, b_2, b_3$. The thick arrows lay $b_1A_{\cdot,1}$, $b_2A_{\cdot,2}$, $b_3A_{\cdot,3}$ tip to tail; the walk always ends in the green ring, which is $Ab$ computed row by row.`,
      deps: ['ladr-3.41'],
      tags: ['matrices'],
      viz(v) {
        const P = v.stage({ x: [-3.6, 3.6], y: [-3, 3], equal: true, height: 360, title: '$Ab$ as a walk along the columns of $A$' });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.55, minWidth: 210 });
        const bs = [[1.4, '1'], [1.2, '2'], [-0.9, '3']].map(([x, k]) => v.slider(`$b_${k}$`, -2, 2, x, { step: 0.05 }));
        const sn = (x, y) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
        const ch = [[1.3, 0.3], [0.3, 1.1], [-0.9, 0.7]].map((p, k) => P.handle(p[0], p[1], { color: VC[k], constrain: sn }));
        const TA = v.table(Q, { rows: 2, cols: 3, region: [0, 0.62, 1, 0.94], maxCell: 40, size: 13 });
        const TB = v.table(Q, { rows: 3, cols: 1, region: [0, 0.2, 0.5, 0.58], maxCell: 34, size: 13 });
        const TP = v.table(Q, { rows: 2, cols: 1, region: [0.5, 0.2, 1, 0.58], maxCell: 34, size: 13 });
        let st = null;
        v.render(() => {
          const A = [[ch[0].x, ch[1].x, ch[2].x], [ch[0].y, ch[1].y, ch[2].y]], b = bs.map((s) => s.value);
          const Ab = A.map((row) => row.reduce((s, x, k) => s + x * b[k], 0));        // row times column (3.46)
          let cur = [0, 0];
          ch.forEach((h, k) => {
            P.line(-4 * h.x, -4 * h.y, 4 * h.x, 4 * h.y, { color: VC[k], width: 0.8, alpha: 0.25 });
            P.arrow(0, 0, h.x, h.y, { color: VC[k], width: 1.4, alpha: 0.6, head: 7 });
            P.tex(`A_{\\cdot,${k + 1}}`, h.x, h.y, { color: VC[k], dx: 14, dy: -12, size: 13 });
          });
          ch.forEach((h, k) => {
            const nx = [cur[0] + b[k] * h.x, cur[1] + b[k] * h.y];
            P.arrow(cur[0], cur[1], nx[0], nx[1], { color: VC[k], width: 3.4 });
            const mx = (cur[0] + nx[0]) / 2, my = (cur[1] + nx[1]) / 2;
            { const ux = nx[0] - cur[0], uy = nx[1] - cur[1], l = Math.hypot(ux, uy) || 1; P.tex(`${tn(b[k])}A_{\\cdot,${k + 1}}`, mx, my, { color: VC[k], dx: (-uy / l) * 22, dy: (-ux / l) * 22, size: 12 }); }
            cur = nx;
          });
          P.dot(Ab[0], Ab[1], { r: 10, hollow: true, color: 'green', width: 2.4 });
          P.dot(cur[0], cur[1], { r: 3.5, color: 'green', label: 'Ab', labelPos: 'se' });
          const f = (x) => pn(x, 2);
          TA.draw({ value: (i, j) => A[i][j], format: f, textColor: (i, j) => VC[j] });
          TB.draw({ value: (i) => b[i], format: f, textColor: (i) => VC[i] });
          TP.draw({ value: (i) => Ab[i], format: f, fill: () => ['green', 0.12] });
          ttl(Q, TA, 'A'); ttl(Q, TB, 'b'); ttl(Q, TP, 'Ab', 'green');
          st = { b, Ab, walk: cur };
        });
        v.readout(() => st && `$b_1A_{\\cdot,1} + b_2A_{\\cdot,2} + b_3A_{\\cdot,3}$ ends at $${vtex(st.walk)}$; row by row, $Ab = ${vtex(st.Ab)}$ — gap $${zs(v, Math.hypot(st.walk[0] - st.Ab[0], st.walk[1] - st.Ab[1]))}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.51
    {
      num: '3.51',
      kind: 'Theorem',
      name: 'Matrix product via combinations of columns or rows',
      statement: String.raw`Suppose $C$ is an $m$-by-$c$ matrix and $R$ is a $c$-by-$n$ matrix.
(a) For $1 \le k \le n$, column $k$ of $CR$ is a linear combination of the columns of $C$, with coefficients from column $k$ of $R$: $(CR)_{\cdot,k} = R_{1,k}C_{\cdot,1} + \cdots + R_{c,k}C_{\cdot,c}$.
(b) For $1 \le j \le m$, row $j$ of $CR$ is a linear combination of the rows of $R$, with coefficients from row $j$ of $C$: $(CR)_{j,\cdot} = C_{j,1}R_{1,\cdot} + \cdots + C_{j,c}R_{c,\cdot}$.`,
      idea: String.raw`(a) is 3.48 followed by 3.50: $(CR)_{\cdot,k} = C R_{\cdot,k}$, and a matrix times a column is a combination of its columns. (b) is the mirror image — compare the $k$-th entries, $\sum_r C_{j,r}R_{r,k}$ on both sides. Hence every column of $CR$ lies in the span of the columns of $C$ and every row in the span of the rows of $R$, the fact behind column rank $=$ row rank (3.56, 3.57).`,
      caption: String.raw`Left: drag the columns of $C$ ($2$-by-$2$); the walk $R_{1,k}C_{\cdot,1} + R_{2,k}C_{\cdot,2}$ ends at column $k$ of $CR$. Right: the two rows of $R$ are vectors in $\mathbf R^3$ spanning the orange plane; the walk $C_{j,1}R_{1,\cdot} + C_{j,2}R_{2,\cdot}$ ends at row $j$ of $CR$ — always in that plane. Edit $R$ in the table (click the top/bottom half of an entry) and pick $k$ and $j$.`,
      deps: ['ladr-3.48', 'ladr-3.50'],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const kS = v.select('column $k$', ['1', '2', '3'], '2'), jS = v.select('row $j$', ['1', '2'], '2');
        const P = v.stage({ x: [-3.3, 3.3], y: [-3.3, 3.3], equal: true, height: 340, title: 'columns: $(CR)_{\\cdot,k}$ in $\\mathbf R^2$' });
        const S3 = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: false, height: 340, title: 'rows: $(CR)_{j,\\cdot}$ in $\\mathbf R^3$' });
        const sc = v.scene3(S3, { axis: 2.6, yaw: -0.75, pitch: 0.32 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const sn = (x, y) => [M.clamp(Math.round(x * 4) / 4, -1.5, 1.5), M.clamp(Math.round(y * 4) / 4, -1.5, 1.5)];
        const c1 = P.handle(1, -0.5, { color: 'blue', constrain: sn }), c2 = P.handle(0.5, 1, { color: 'purple', constrain: sn });
        const R = [[1, 2, -1], [1, -1, 2]], RC = ['teal', 'pink'];
        const TC = v.table(Q, { rows: 2, cols: 2, region: [0, 0, 0.26, 0.86], maxCell: 44, size: 14 });
        const TR = v.table(Q, { rows: 2, cols: 3, region: [0.3, 0, 0.63, 0.86], maxCell: 44, size: 14 });
        const TP = v.table(Q, { rows: 2, cols: 3, region: [0.66, 0, 1, 0.86], maxCell: 44, size: 14 });
        editable(v, Q, TR, () => R, { min: -2, max: 2 });
        let st = null;
        v.render(() => {
          const C = [[c1.x, c2.x], [c1.y, c2.y]], CR = M.matMul(C, R), k = +kS.value - 1, j = +jS.value - 1;
          // column view
          [c1, c2].forEach((h, r) => { P.arrow(0, 0, h.x, h.y, { color: r ? 'purple' : 'blue', width: 1.5, alpha: 0.6, head: 7 }); P.tex(`C_{\\cdot,${r + 1}}`, h.x, h.y, { color: r ? 'purple' : 'blue', dx: 16, dy: -12, size: 12 }); });
          for (let q = 0; q < 3; q++) if (q !== k) P.dot(CR[0][q], CR[1][q], { r: 4, color: 'faint', label: `(CR)·${'₁₂₃'[q]}`, labelPos: 'se' });
          let cur = [0, 0];
          [c1, c2].forEach((h, r) => { const nx = [cur[0] + R[r][k] * h.x, cur[1] + R[r][k] * h.y]; P.arrow(cur[0], cur[1], nx[0], nx[1], { color: r ? 'purple' : 'blue', width: 3.2 }); cur = nx; });
          P.dot(cur[0], cur[1], { r: 6, color: 'green' }); P.tex(`(CR)_{\\cdot,${k + 1}}`, cur[0], cur[1], { color: 'green', dx: 0, dy: 18, size: 13 });
          // row view
          sc.begin();
          spanDraw(sc, R, { color: 'orange', r: 3.2 });
          R.forEach((row, r) => { sc.arrow([0, 0, 0], row, { color: RC[r], width: 1.8, alpha: 0.75 }); sc.tex(`R_{${r + 1},\\cdot}`, row, { color: RC[r], dx: 16, dy: -10, size: 12 }); });
          let p = [0, 0, 0];
          R.forEach((row, r) => { const q = p.map((x, i) => x + C[j][r] * row[i]); sc.arrow(p, q, { color: RC[r], width: 3.2 }); p = q; });
          sc.dot(p, { r: 6, color: 'green' }); sc.tex(`(CR)_{${j + 1},\\cdot}`, p, { color: 'green', dx: 0, dy: 18, size: 13 });
          const other = CR[1 - j]; sc.dot(other, { r: 4, color: 'faint' });
          sc.flush();
          const f = (x) => pn(x, 2);
          TC.draw({ value: (a, b) => C[a][b], format: f, textColor: (a, b) => (b ? 'purple' : 'blue'), activeRow: j, activeColor: 'green' });
          TR.draw({ value: (a, b) => R[a][b], textColor: (a) => RC[a], activeCol: k, activeColor: 'green' });
          TP.draw({ value: (a, b) => CR[a][b], format: f, activeRow: j, activeCol: k, activeColor: 'green', highlight: [[j, k, 'green']] });
          ttl(Q, TC, 'C'); ttl(Q, TR, 'R'); ttl(Q, TP, 'CR', 'green');
          const n = cross3(R[0], R[1]), nn = Math.hypot(...n);
          st = { C, k, j, CR, off: nn > 1e-9 ? Math.abs(dotN(n, CR[j])) / nn : 0 };
        });
        v.readout(() => {
          if (!st) return '';
          const { C, k, j, CR } = st, col = colOf(CR, k);
          return `$(CR)_{\\cdot,${k + 1}} = ${tn(R[0][k])}\\,C_{\\cdot,1} + ${tn(R[1][k])}\\,C_{\\cdot,2} = ${vtex(col)}$ · $(CR)_{${j + 1},\\cdot} = ${tn(C[j][0])}\\,R_{1,\\cdot} + ${tn(C[j][1])}\\,R_{2,\\cdot} = ${vtex(CR[j])}$, at distance $${zs(v, st.off)}$ from the plane of the rows of $R$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.52
    {
      num: '3.52',
      kind: 'Definition',
      name: 'Column rank and row rank',
      statement: String.raw`Let $A$ be an $m$-by-$n$ matrix with entries in $\mathbf F$.
- The **column rank** of $A$ is the dimension of the span of its columns in $\mathbf F^{m,1}$.
- The **row rank** of $A$ is the dimension of the span of its rows in $\mathbf F^{1,n}$.`,
      idea: String.raw`Both numbers measure how many genuinely different directions the matrix contains, read in two ways: down the columns or across the rows. For a square matrix both spans live in a copy of $\mathbf F^n$, but they are usually *different* subspaces — only their dimensions will turn out to agree (3.57).`,
      caption: String.raw`Edit the $3$-by-$3$ matrix (click the top or bottom half of an entry, or drag it) or pick an example. Left: the three columns and their span; right: the three rows and their span — a point, a line, a plane or all of $\mathbf R^3$. The spans are different subspaces; watch their dimensions. Drag either background to rotate.`,
      deps: ['ladr-2.35', 'ladr-2.4'],
      tags: ['rank'],
      viz(v) {
        const PRE = { r3: [[1, 0, 1], [0, 1, 1], [1, 1, -1]], r2: [[1, 2, 0], [0, 1, 1], [1, 3, 1]], r1: [[1, -1, 1], [2, -2, 2], [-1, 1, -1]], r0: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] };
        const pre = v.select('example', [{ value: 'r3', label: 'invertible' }, { value: 'r2', label: 'row 3 = row 1 + row 2' }, { value: 'r1', label: 'all rows parallel' }, { value: 'r0', label: 'zero' }], 'r2');
        const L = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 330, title: 'columns of $A$ and their span' });
        const scL = v.scene3(L, { axis: 2.2, yaw: -0.65, pitch: 0.33 });
        const Rs = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: false, height: 330, title: 'rows of $A$ and their span' });
        const scR = v.scene3(Rs, { axis: 2.2, yaw: -0.65, pitch: 0.33 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 170, full: true });
        const RCs = ['orange', 'pink', 'gold'];
        let A = PRE.r2.map((r) => r.slice()), last = 'r2', st = null;
        const T = v.table(Q, { rows: 3, cols: 3, maxCell: 40, size: 14, rowLabels: (i) => `$A_{${i + 1},\\cdot}$`, colLabels: (j) => `$A_{\\cdot,${j + 1}}$`, rowLabelColor: (i) => RCs[i], colLabelColor: (j) => VC[j] });
        editable(v, Q, T, () => A, { min: -2, max: 2 });
        v.render(() => {
          if (last !== pre.value) { last = pre.value; A = PRE[last].map((r) => r.slice()); }
          const cols = [0, 1, 2].map((k) => colOf(A, k)), rows = A;
          scL.begin(); const dc = spanDraw(scL, cols, { color: 'accent', r: 2.6, box: 1.8 });
          cols.forEach((c, k) => { if (Math.hypot(...c) > 1e-9) { scL.arrow([0, 0, 0], c, { color: VC[k] }); scL.tex(`A_{\\cdot,${k + 1}}`, c, { color: VC[k], dx: 18, dy: -10, size: 12 }); } });
          scL.flush();
          scR.begin(); const dr = spanDraw(scR, rows, { color: 'orange', r: 2.6, box: 1.8 });
          rows.forEach((c, k) => { if (Math.hypot(...c) > 1e-9) { scR.arrow([0, 0, 0], c, { color: RCs[k] }); scR.tex(`A_{${k + 1},\\cdot}`, c, { color: RCs[k], dx: 18, dy: -10, size: 12 }); } });
          scR.flush();
          const nm = ['a point', 'a line', 'a plane', 'all of R³'];
          L.corner(`column rank ${dc}: ${nm[dc]}`, 'tl', { color: 'accent', weight: 700, size: 13 });
          Rs.corner(`row rank ${dr}: ${nm[dr]}`, 'tl', { color: 'orange', weight: 700, size: 13 });
          T.draw({ value: (i, j) => A[i][j] });
          const same = dc === dr && (dc === 0 || dc === 3 || orthN([...orthN(cols, 1e-6), ...orthN(rows, 1e-6)], 1e-6).length === dc);
          st = { dc, dr, same };
        });
        v.legend([['accent', 'span of the columns', { area: true }], ['orange', 'span of the rows', { area: true }]]);
        v.readout(() => st && `Column rank $${st.dc}$, row rank $${st.dr}$. ` + (st.dc > 0 && st.dc < 3 ? (st.same ? 'Here the two spans happen to coincide.' : 'The two spans are **different subspaces** of the same dimension.') : st.dc === 3 ? 'Both spans are all of $\\mathbf R^3$.' : 'Both spans are $\\{0\\}$.'));
      },
    },
    // ------------------------------------------------------------------ 3.54
    {
      num: '3.54',
      kind: 'Definition',
      name: 'Transpose',
      statement: String.raw`The **transpose** of an $m$-by-$n$ matrix $A$ is the $n$-by-$m$ matrix $A^{\mathrm t}$ defined by
$$(A^{\mathrm t})_{k,j} = A_{j,k} \qquad (1 \le j \le m,\ 1 \le k \le n).$$
The rows of $A^{\mathrm t}$ are the columns of $A$ and vice versa.`,
      idea: String.raw`Transposing reflects the array across its main diagonal: the entry in position $(j,k)$ moves to $(k,j)$, the diagonal stays put, and an $m$-by-$n$ shape becomes $n$-by-$m$. Doing it twice returns $A$. Transposes let row statements be turned into column statements — the key move in 3.57 — and they reverse products: $(AC)^{\mathrm t} = C^{\mathrm t}A^{\mathrm t}$.`,
      caption: String.raw`Watch $A$ flip across its main diagonal (dashed): each entry slides straight across to its mirror position, the diagonal entries stay, and the frame changes shape. Each row of $A$ has its own colour — after the flip the colours run down the columns. Click an entry to follow it; pick other shapes.`,
      deps: [],
      tags: ['matrices'],
      viz(v) {
        const M = v.M;
        const SZ = { 23: [2, 3], 32: [3, 2], 33: [3, 3], 14: [1, 4] };
        const sz = v.select('shape of $A$', [{ value: '23', label: '$2\\times3$' }, { value: '32', label: '$3\\times2$' }, { value: '33', label: '$3\\times3$' }, { value: '14', label: '$1\\times4$' }], '23');
        const S = v.stage({ x: [-0.9, 4.9], y: [-4.6, 0.9], equal: true, axes: false, height: 360 });
        const V = [[3, -1, 4, 2], [0, 5, -2, 7], [6, 1, 8, -3]], RC = ['blue', 'orange', 'purple'];
        let pick = [0, 1], sNow = 0;
        const pos = (j, k, s) => [M.lerp(k, j, s) + 0.5, -M.lerp(j, k, s) - 0.5];
        S.onClick((x, y) => {
          const [m, n] = SZ[sz.value]; let best = null, bd = 0.6;
          for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) { const p = pos(j, k, sNow), d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = [j, k]; } }
          if (best) pick = best;
        });
        v.animate((t) => {
          const [m, n] = SZ[sz.value];
          if (pick[0] >= m || pick[1] >= n) pick = [0, Math.min(1, n - 1)];
          const ph = t % 6, s = ph < 1 ? 0 : ph < 2.5 ? M.smoothstep(1, 2.5, ph) : ph < 3.5 ? 1 : ph < 5 ? 1 - M.smoothstep(3.5, 5, ph) : 0;
          sNow = s;
          const D = Math.max(m, n);
          S.line(-0.4, 0.4, D + 0.2, -D - 0.2, { color: 'muted', width: 1.2, dash: [6, 5] });
          S.text('main diagonal', D + 0.15, -D - 0.25, { color: 'muted', size: 11, align: 'right', baseline: 'top' });
          const w = M.lerp(n, m, s), h = M.lerp(m, n, s);
          for (const [x0, sg] of [[0, 1], [w, -1]]) S.path([[x0 + 0.18 * sg, 0.08], [x0, 0.08], [x0, -h - 0.08], [x0 + 0.18 * sg, -h - 0.08]], { color: 'ink', width: 2 });
          const [a, b] = pos(pick[0], pick[1], 0), [c, d] = pos(pick[0], pick[1], 1);
          if (pick[0] !== pick[1]) S.arrow(a, b, c, d, { color: 'gold', width: 1.4, dash: [3, 3], alpha: 0.8, head: 7 });
          for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) {
            const [x, y] = pos(j, k, s), on = j === pick[0] && k === pick[1], diag = j === k;
            S.circle(x, y, 0.36, { color: RC[j], fill: RC[j], fillAlpha: on ? 0.4 : 0.14, width: on ? 2.6 : 1.2 });
            S.text(pn(V[j][k], 0), x, y, { align: 'center', size: 16, color: diag ? 'ink' : RC[j], weight: 700 });
          }
          S.corner(s < 0.02 ? `A is ${m}×${n}` : s > 0.98 ? `Aᵗ is ${n}×${m}` : 'flipping…', 'tr', { color: s > 0.98 ? 'green' : 'ink', weight: 700, size: 14 });
        }, { period: 6, still: 1.9 });
        v.legend([['blue', 'row 1 of $A$'], ['orange', 'row 2'], ['purple', 'row 3'], ['gold', 'the clicked entry’s path', { dash: true }]]);
        v.readout(() => {
          const [j, k] = pick;
          return `$A_{${j + 1},${k + 1}} = ${V[j][k]} = (A^{\\mathrm t})_{${k + 1},${j + 1}}$` + (j === k ? ' — a diagonal entry, it does not move.' : ` — it slides from row ${j + 1}, column ${k + 1} to row ${k + 1}, column ${j + 1}.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.56
    {
      num: '3.56',
      kind: 'Theorem',
      name: 'Column–row factorization',
      statement: String.raw`Suppose $A$ is an $m$-by-$n$ matrix with entries in $\mathbf F$ and column rank $c \ge 1$. Then there exist an $m$-by-$c$ matrix $C$ and a $c$-by-$n$ matrix $R$, both with entries in $\mathbf F$, such that $A = CR$.`,
      idea: String.raw`The columns of $A$ span a space of dimension $c$, so sifting them (2.30) leaves a basis of $c$ of them; put these into $C$. Every column of $A$ is then a combination of the columns of $C$; storing the coefficients for column $k$ as column $k$ of $R$ gives $A_{\cdot,k} = CR_{\cdot,k}$, which is $A = CR$ by 3.51(a). The inner size of the product is exactly the column rank.`,
      caption: String.raw`Edit the $3$-by-$4$ matrix $A$ (click the top/bottom half of an entry, or drag) or pick an example. Sifting keeps the green columns — they become $C$; the other columns are combinations of earlier ones. $R$ stores the coefficients (its green columns are just unit vectors). The 3D view rebuilds the chosen column of $A$ from the columns of $C$, tip to tail, inside the column space.`,
      deps: ['ladr-2.30', 'ladr-3.51', 'ladr-3.52'],
      tags: ['rank', 'factorization'],
      viz(v) {
        const M = v.M;
        const PRE = { a: [[1, 2, 0, 1], [0, 1, 1, 1], [1, 3, 1, 2]], b: [[1, 2, -1, 0], [2, 4, -2, 0], [-1, -2, 1, 0]], c: [[1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 0, 0]] };
        const pre = v.select('example', [{ value: 'a', label: 'rank 2' }, { value: 'b', label: 'rank 1' }, { value: 'c', label: 'rank 3' }], 'a');
        const jS = v.select('rebuild column', ['1', '2', '3', '4'], '3');
        const Q = v.stage({ x: [-0.5, 12.5], y: [-0.9, 3.6], equal: true, axes: false, height: 200, full: true });
        const S = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], equal: true, axes: false, height: 340, title: 'the columns of $A$ in $\\mathbf R^3$; column space in green' });
        const sc = v.scene3(S, { axis: 2.4, yaw: 0.6, pitch: 0.3 });
        let A = PRE.a.map((r) => r.slice()), last = 'a', st = null;
        const TA = v.table(Q, { rows: 3, cols: 4, cell: [1, 1], x0: 0, y0: 3, size: 15 });
        const TC = v.table(Q, { rows: 3, cols: 2, cell: [1, 1], x0: 5, y0: 3, size: 15 });
        const TR = v.table(Q, { rows: 2, cols: 4, cell: [1, 1], x0: 8, y0: 2.5, size: 14 });
        editable(v, Q, TA, () => A, { min: -3, max: 3 });
        v.render(() => {
          if (last !== pre.value) { last = pre.value; A = PRE[last].map((r) => r.slice()); }
          const cols = [0, 1, 2, 3].map((k) => colOf(A, k)), kept = sift(cols), c = kept.length, j = +jS.value - 1;
          const Cm = A.map((row) => kept.map((k) => row[k]));
          const Rcols = cols.map((col) => (c ? M.lstsq(Cm, col) : []));
          const R = [...Array(c).keys()].map((r) => Rcols.map((x) => x[r]));
          const CR = c ? M.matMul(Cm, R) : A.map((r) => r.map(() => 0));
          Q.setView([-0.6, 10.4 + Math.max(c, 1)], [-0.9, 3.6]);
          TA.draw({ value: (i, k) => A[i][k], fill: (i, k) => (kept.includes(k) ? ['green', 0.2] : k === j ? ['purple', 0.12] : null), highlight: [0, 1, 2].map((i) => [i, j, 'purple']) });
          Q.tex('A', 2, -0.45, { size: 17 }); Q.tex('=', 4.5, 1.5, { size: 20 });
          if (c) {
            TC.set({ cols: c }); TR.set({ rows: c, x0: 6 + c, y0: 1.5 + c / 2 });
            TC.draw({ value: (i, k) => Cm[i][k], fill: () => ['green', 0.2] });
            TR.draw({ value: (i, k) => R[i][k], format: (x) => fr(x), fill: (i, k) => (kept.includes(k) ? ['green', 0.1] : ['purple', 0.12]), highlight: [...Array(c).keys()].map((i) => [i, j, 'purple']) });
            Q.tex('\\cdot', 5.5 + c, 1.5, { size: 20 });
            Q.tex(`C\;(3\\times${c})`, 5 + c / 2, -0.45, { size: 14, color: 'green' }); Q.tex(`R\;(${c}\\times4)`, 8 + c, 1.5 - c / 2 - 0.45, { size: 14 });
          } else Q.tex('\\text{column rank } 0:\\ A = 0', 7.5, 1.5, { size: 15, color: 'muted' });
          // the column space and the chosen column rebuilt from C
          sc.begin();
          spanDraw(sc, cols, { color: 'green', r: 3, box: 2 });
          cols.forEach((col, k) => { if (Math.hypot(...col) < 1e-9) return; const kp = kept.includes(k); sc.arrow([0, 0, 0], col, { color: kp ? 'green' : k === j ? 'purple' : 'muted', width: kp ? 2.8 : 1.8, alpha: kp || k === j ? 1 : 0.6 }); sc.tex(`A_{\\cdot,${k + 1}}`, col, { color: kp ? 'green' : k === j ? 'purple' : 'muted', dx: 18, dy: -10, size: 12 }); });
          if (c) { let p = [0, 0, 0]; kept.forEach((k, r) => { const q = p.map((x, i) => x + R[r][j] * cols[k][i]); sc.line(p, q, { color: 'purple', width: 3, dash: [5, 3] }, 1); p = q; }); sc.dot(p, { r: 5, color: 'purple' }); }
          sc.flush();
          st = { c, kept, j, R, err: maxDiff(A, CR) };
        });
        v.readout(() => {
          if (!st) return '';
          const { c, kept, j, R, err } = st;
          if (!c) return 'The zero matrix has column rank $0$; the theorem assumes $c \\ge 1$.';
          return `Sifting keeps columns ${kept.map((k) => k + 1).join(', ')}: column rank $c = ${c}$, so $C$ is $3\\times${c}$ and $R$ is $${c}\\times4$. Column ${j + 1}: $A_{\\cdot,${j + 1}} = ${kept.map((k, r) => `${tn(R[r][j])}\\,A_{\\cdot,${k + 1}}`).join(' + ')}$. Largest entry of $A - CR$: $${zs(v, err)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.57
    {
      num: '3.57',
      kind: 'Theorem',
      name: 'Column rank equals row rank',
      statement: String.raw`For every $m$-by-$n$ matrix $A$ with entries in $\mathbf F$, the column rank of $A$ equals the row rank of $A$.`,
      idea: String.raw`Let $c$ be the column rank and factor $A = CR$ with $R$ of size $c$-by-$n$ (3.56). By 3.51(b) every row of $A$ is a combination of the $c$ rows of $R$, so the row rank of $A$ is at most $c$ = its column rank. Apply this to $A^{\mathrm t}$ (3.54), whose columns are the rows of $A$: the column rank of $A$ is at most its row rank. So they are equal.`,
      caption: String.raw`Choose a rank and press *Resample* for a random $3$-by-$4$ matrix of that rank, or edit $A$ yourself (click the top/bottom half of an entry). Sifting the columns (in $\mathbf R^3$) and sifting the rows (in $\mathbf R^4$) are separate computations, yet they always keep the same number. The tally counts random matrices by (column rank, row rank): only the diagonal ever fills. Press *Test 500 more* to keep trying.`,
      deps: ['ladr-3.56', 'ladr-3.51', 'ladr-3.54'],
      tags: ['rank'],
      viz(v) {
        const M = v.M;
        const rS = v.slider('rank', 0, 3, 2, { int: true });
        let A = [[1, 2, 0, -1], [2, 1, 3, 1], [3, 3, 3, 0]], seed = 5, tseed = 1, tested = 0;
        const cnt = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
        const rk = (B) => [sift([0, 1, 2, 3].map((k) => colOf(B, k))).length, sift(B).length];
        const randA = (r, t) => {
          for (let it = 0; it < 30; it++) {
            const C = [0, 1, 2].map(() => [...Array(t).keys()].map(() => r.int(-1, 1))), R = [...Array(t).keys()].map(() => [0, 1, 2, 3].map(() => r.int(-1, 2)));
            const B = t ? M.matMul(C, R) : [0, 1, 2].map(() => [0, 0, 0, 0]);
            if (sift([0, 1, 2, 3].map((k) => colOf(B, k))).length === t) return B;
          }
          return [0, 1, 2].map((i) => [0, 1, 2, 3].map((k) => (i === k && i < t ? 1 : 0)));
        };
        const tally = (N, sd) => {
          const r = v.rng(sd);
          for (let i = 0; i < N; i++) {
            const B = r() < 0.75 ? randA(r, r.int(0, 3)) : [0, 1, 2].map(() => [0, 1, 2, 3].map(() => r.int(-1, 1)));
            const [a, b] = rk(B); cnt[a][b]++; tested++;
          }
        };
        tally(500, 99);
        v.button('Resample', () => { A = randA(v.rng(seed++ * 7919), rS.value); });
        v.button('Test 500 more', () => tally(500, 1000 + tseed++));
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, minWidth: 260, title: '$A$: kept columns and kept rows' });
        const S = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 330, title: 'column space in $\\mathbf R^3$' });
        const sc = v.scene3(S, { axis: 2, yaw: 0.6, pitch: 0.3 });
        const U = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.9, minWidth: 240, title: 'random $3\\times4$ matrices by column rank $c$, row rank $r$' });
        let kc = [], kr = [];
        const TA = v.table(Q, { rows: 3, cols: 4, maxCell: 50, size: 15, region: [0, 0.08, 1, 0.92], rowLabels: (i) => (kr.includes(i) ? 'kept' : '—'), colLabels: (j) => (kc.includes(j) ? 'kept' : '—'), rowLabelColor: (i) => (kr.includes(i) ? 'orange' : 'faint'), colLabelColor: (j) => (kc.includes(j) ? 'green' : 'faint') });
        editable(v, Q, TA, () => A, { min: -3, max: 3 });
        const TT = v.table(U, { rows: 4, cols: 4, maxCell: 52, size: 13, region: [0, 0.04, 1, 0.9], rowLabels: (i) => `c = ${i}`, colLabels: (j) => `r = ${j}` });
        let st = null;
        v.render(() => {
          const cols = [0, 1, 2, 3].map((k) => colOf(A, k));
          kc = sift(cols); kr = sift(A);
          TA.draw({ value: (i, j) => A[i][j], fill: (i, j) => (kc.includes(j) && kr.includes(i) ? ['gold', 0.22] : kc.includes(j) ? ['green', 0.16] : kr.includes(i) ? ['orange', 0.16] : null) });
          Q.corner(`column rank ${kc.length}`, 'bl', { color: 'green', weight: 700, size: 13 }); Q.corner(`row rank ${kr.length}`, 'br', { color: 'orange', weight: 700, size: 13 });
          const big = Math.max(1, ...cols.map((c) => Math.hypot(...c))), sc2 = Math.min(1, 2.3 / big);
          sc.begin();
          spanDraw(sc, cols, { color: 'green', r: 2.4, box: 1.6 });
          cols.forEach((c, k) => { if (Math.hypot(...c) > 1e-9) sc.arrow([0, 0, 0], c.map((x) => x * sc2), { color: kc.includes(k) ? 'green' : 'muted', width: kc.includes(k) ? 2.8 : 1.6 }); });
          sc.flush();
          if (sc2 < 1) S.corner(`arrows shrunk ×${pn(sc2, 2)} to fit`, 'tl', { color: 'faint', size: 11 });
          const mx = Math.max(1, ...cnt.flat());
          TT.draw({ value: (i, j) => cnt[i][j], fill: (i, j) => (i === j ? ['green', 0.12 + (0.5 * cnt[i][j]) / mx] : cnt[i][j] ? ['red', 0.5] : null), textColor: (i, j) => (i === j ? 'ink' : 'faint'), highlight: [[kc.length, kr.length, kc.length === kr.length ? 'accent' : 'red']] });
          U.corner(`${tested} tested · off the diagonal: ${cnt.flat().reduce((s, x, i) => s + (i % 5 ? x : 0), 0)}`, 'bl', { color: 'muted', size: 12, weight: 600 });
          st = { c: kc.length, r: kr.length };
        });
        v.legend([['green', 'columns kept by sifting', { area: true }], ['orange', 'rows kept by sifting', { area: true }]]);
        v.readout(() => st && `Sifting the columns keeps ${st.c}, sifting the rows keeps ${st.r}: column rank $= ${st.c} = ${st.r} =$ row rank. (Row rank $\\le$ column rank because $A = CR$ makes every row a combination of the ${st.c} rows of $R$; the transpose gives the other inequality.)`);
      },
    },
    // ------------------------------------------------------------------ 3.59
    {
      num: '3.59',
      kind: 'Definition',
      name: 'Invertible linear map, inverse',
      statement: String.raw`A linear map $T \in \mathcal L(V, W)$ is **invertible** if there is a linear map $S \in \mathcal L(W, V)$ such that
$$ST = I_V \quad\text{and}\quad TS = I_W.$$
Such an $S$ is called an **inverse** of $T$.`,
      idea: String.raw`An inverse undoes $T$ from both sides: $S$ sends each $Tv$ back to $v$, and $T$ sends each $Sw$ back to $w$. If $T$ squashes two different vectors to the same image, or misses part of $W$, there is nothing for $S$ to do — this is made precise in 3.63. For a map of $\mathbf R^2$ the obstruction is visible: the picture collapses onto a line.`,
      caption: String.raw`Drag $Te_1$ and $Te_2$ on the right to choose $T$; the right panel shows $T$ applied to the house and to the grid. The left panel draws the house again (blue) and, dashed green, $S(T(\text{house}))$ with $S$ the inverse map — exactly on top. Press *make singular* (or line the two arrows up): the image collapses, two different points (red) land on the same spot, and no $S$ can undo it.`,
      deps: ['ladr-3.1'],
      see: ['pma-9.4'],
      tags: ['invertibility'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, axes: false, height: 330, title: '$V$: the house, and $S(T(\\text{house}))$' });
        const R = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, axes: false, height: 330, title: '$W$: $T(\\text{house})$' });
        const h1 = R.handle(1.1, 0.3, { color: 'blue', label: 'Te₁' });
        const h2 = R.handle(0.5, 1.05, {
          color: 'purple', label: 'Te₂', constrain: (x, y) => {
            const n2 = h1.x ** 2 + h1.y ** 2; if (n2 < 1e-6) return [x, y];
            if (Math.abs(h1.x * y - h1.y * x) / Math.sqrt(n2) < 0.1) { const t = (x * h1.x + y * h1.y) / n2; return [t * h1.x, t * h1.y]; }
            return [x, y];
          },
        });
        v.button('make singular', () => h2.set(-0.7 * h1.x, -0.7 * h1.y));
        v.button('reset', () => { h1.set(1.1, 0.3); h2.set(0.5, 1.05); });
        const HOUSE = [[-1, -1], [1, -1], [1, 0.3], [0, 1.2], [-1, 0.3]], DOOR = [[-0.55, -1], [-0.15, -1], [-0.15, -0.3], [-0.55, -0.3]], WIN = [[0.25, -0.35], [0.7, -0.35], [0.7, 0.1], [0.25, 0.1]];
        let st = null;
        v.render(() => {
          const A = [[h1.x, h2.x], [h1.y, h2.y]], det = M.det(A), inv = Math.abs(det) > 1e-9;
          const shp = (s, f, col, st2 = {}) => { s.poly(HOUSE.map(f), { color: col, fill: col, fillAlpha: 0.14, width: 2, ...st2 }); s.poly(DOOR.map(f), { color: col, fill: col, fillAlpha: 0.3, width: 1.4, ...st2 }); s.poly(WIN.map(f), { color: col, fill: false, width: 1.4, ...st2 }); };
          gridImage(L, [[1, 0], [0, 1]], 4); gridImage(R, A, 4);
          shp(L, (p) => p, 'blue');
          shp(R, (p) => ap2(A, p), 'accent');
          R.arrow(0, 0, h1.x, h1.y, { color: 'blue', width: 2 }); R.arrow(0, 0, h2.x, h2.y, { color: 'purple', width: 2 });
          let Sm = null, n = null;
          if (inv) {
            Sm = M.inverse(A);
            shp(L, (p) => ap2(Sm, ap2(A, p)), 'green', { fill: false, dash: [6, 4], width: 2.2 });
            L.corner('S(T(house)) = house', 'tl', { color: 'green', weight: 700, size: 13 });
          } else {
            const ns = M.nullspace(A); n = ns.length === 1 ? ns[0] : [1, 0];
            const p = [0, 1.2], q = [p[0] + 1.3 * n[0], p[1] + 1.3 * n[1]], Tp = ap2(A, p);
            L.line(p[0] - 5 * n[0], p[1] - 5 * n[1], p[0] + 5 * n[0], p[1] + 5 * n[1], { color: 'red', width: 1.6, dash: [5, 4] });
            L.dot(p[0], p[1], { r: 5, color: 'red', label: 'p', labelPos: 'nw' }); L.dot(q[0], q[1], { r: 5, color: 'red', label: 'p′', labelPos: 'ne' });
            R.dot(Tp[0], Tp[1], { r: 6, color: 'red', label: 'T(p) = T(p′)', labelPos: 'se' });
            L.corner('T is not injective: no S can undo it', 'tl', { color: 'red', weight: 700, size: 13 });
          }
          R.corner(`det = ${pn(det, 3)}`, 'tl', { color: inv ? 'muted' : 'red', weight: 700, size: 13 });
          st = { A, Sm, n, ok: inv ? Math.max(maxDiff(M.matMul(Sm, A), [[1, 0], [0, 1]]), maxDiff(M.matMul(A, Sm), [[1, 0], [0, 1]])) : null };
        });
        v.legend([['blue', 'the house in $V$', { area: true }], ['accent', 'its image in $W$', { area: true }], ['green', '$S(T(\\text{house}))$', { dash: true }], ['red', 'collapsed points', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.Sm) return `$\\mathcal M(T) = ${mtex(st.A)}$, $\\mathcal M(S) = ${mtex(st.Sm)}$: $ST = I$ and $TS = I$ up to $${zs(v, st.ok)}$.`;
          return `$\\mathcal M(T) = ${mtex(st.A)}$ has determinant $0$: every point of the red line maps to the same point, $T${vtex(st.n)} = 0$, and the range is only a line — $T$ is not invertible.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.60
    {
      num: '3.60',
      kind: 'Theorem',
      name: 'Inverse is unique',
      statement: String.raw`An invertible linear map has exactly one inverse: if $T \in \mathcal L(V,W)$ and $S_1, S_2 \in \mathcal L(W,V)$ both satisfy $S_iT = I$ and $TS_i = I$, then $S_1 = S_2$. The inverse is denoted $T^{-1}$.`,
      idea: String.raw`Only one half of each hypothesis is needed: if $S_1T = I$ and $TS_2 = I$, then
$$S_1 = S_1I = S_1(TS_2) = (S_1T)S_2 = IS_2 = S_2,$$
using associativity of composition (3.8). Without both halves uniqueness fails: a map onto a smaller space has many right inverses.`,
      caption: String.raw`With an invertible $T$ of $\mathbf R^2$, drag the test vector $w$: $S_1$ is computed as a left inverse, $S_2$ as a right inverse, and the chain $S_1w = S_1(TS_2w) = (S_1T)(S_2w) = S_2w$ ends on one point. Switch to $T(x,y) = x + y$, which maps onto $\mathbf R$ (the bottom line) but is not injective: drag $S_1(1)$, $S_2(1)$ along the line $x + y = 1$ to get two different right inverses — the chain breaks at $S_1T = I$.`,
      deps: ['ladr-3.59', 'ladr-3.8'],
      tags: ['invertibility'],
      viz(v) {
        const M = v.M;
        const md = v.select('$T$', [{ value: 'inv', label: 'invertible, $\\mathbf R^2 \\to \\mathbf R^2$' }, { value: 'onto', label: '$T(x,y) = x + y$, onto $\\mathbf R$' }], 'inv');
        const wS = v.slider('$w \\in \\mathbf R$', -2, 2, 1.4, { step: 0.05 });
        const S = v.stage({ x: [-3.4, 3.4], y: [-3.3, 2.8], equal: true, axes: false, height: 380 });
        const T = [[1.1, 0.6], [-0.5, 0.9]];
        const hw = S.handle(1.2, 1.4, { color: 'accent', label: 'w' });
        const on = (x, y) => { const t = (x - y) / 2; return [M.clamp(0.5 + t, -1.8, 2.8), 1 - M.clamp(0.5 + t, -1.8, 2.8)]; };
        const p1 = S.handle(1.8, -0.8, { color: 'blue', label: 'S₁(1)', constrain: on }), p2 = S.handle(-0.6, 1.6, { color: 'purple', label: 'S₂(1)', constrain: on });
        let st = null;
        v.render(() => {
          const inv = md.value === 'inv';
          hw.visible = inv; p1.visible = !inv; p2.visible = !inv; wS.el.hidden = inv;
          gridImage(S, [[1, 0], [0, 1]], 4);
          if (inv) {
            const S1 = M.transpose(M.luSolve(M.transpose(T), [[1, 0], [0, 1]]));   // S₁T = I  ⇔  Tᵗ S₁ᵗ = I
            const S2 = M.luSolve(T, [[1, 0], [0, 1]]);                                // T S₂ = I
            const w = [hw.x, hw.y], s2w = ap2(S2, w), ts2w = ap2(T, s2w), s1w = ap2(S1, ts2w), s1Ts2 = ap2(M.matMul(S1, T), s2w);
            S.arrow(0, 0, w[0], w[1], { color: 'accent', width: 2.6 });
            S.arrow(w[0], w[1], s2w[0], s2w[1], { color: 'purple', width: 1.8, dash: [5, 4] }); S.tex('S_2', (w[0] + s2w[0]) / 2, (w[1] + s2w[1]) / 2, { color: 'purple', dy: -12, size: 13 });
            S.dot(s2w[0], s2w[1], { r: 6, color: 'purple' }); S.dot(s1w[0], s1w[1], { r: 11, hollow: true, color: 'blue', width: 2.4 }); S.dot(s1Ts2[0], s1Ts2[1], { r: 15, hollow: true, color: 'green', width: 1.6 });
            S.tex('S_2w', s2w[0], s2w[1], { color: 'purple', dx: 26, dy: 14, size: 13 }); S.tex('S_1(TS_2w)', s1w[0], s1w[1], { color: 'blue', dx: -46, dy: -16, size: 12 });
            S.corner('S₁w = S₁(TS₂w) = (S₁T)(S₂w) = S₂w', 'tl', { color: 'green', weight: 700, size: 13 });
            st = { inv, S1, S2, s1w, s2w };
          } else {
            const w = wS.value, y0 = -2.75, a = [p1.x, p1.y], b = [p2.x, p2.y], s1w = [w * a[0], w * a[1]], s2w = [w * b[0], w * b[1]];
            S.line(-3.3, y0, 3.3, y0, { color: 'ink', width: 1.6 });
            for (let k = -3; k <= 3; k++) { S.line(k, y0 - 0.06, k, y0 + 0.06, { color: 'ink', width: 1 }); S.text(String(k).replace('-', '−'), k, y0 - 0.22, { align: 'center', size: 10, color: 'muted' }); }
            S.text('W = R', 3.3, y0 + 0.2, { align: 'right', size: 12, color: 'muted', math: true });
            S.line(-3, 4, 4, -3, { color: 'muted', width: 1.4, dash: [6, 4] });
            S.line(w - 4, 4, w + 4, -4, { color: 'accent', width: 1.6, alpha: 0.7 });
            S.tex('x + y = w', w + 2.15, -2.15, { color: 'accent', size: 12, align: 'left', dx: 6 }); S.tex('x + y = 1', 2.9, -1.9, { color: 'muted', size: 12, align: 'left', dx: 6 });
            S.dot(w, y0, { r: 6, color: 'accent', label: 'w', labelPos: 'n' });
            S.arrow(0, 0, s1w[0], s1w[1], { color: 'blue', width: 2.4 }); S.arrow(0, 0, s2w[0], s2w[1], { color: 'purple', width: 2.4 });
            S.tex('S_1w', s1w[0], s1w[1], { color: 'blue', dx: 22, dy: 12, size: 13 }); S.tex('S_2w', s2w[0], s2w[1], { color: 'purple', dx: -22, dy: -10, size: 13 });
            S.arrow(s2w[0], s2w[1], s2w[0] + s2w[1], y0 + 0.12, { color: 'purple', width: 1.2, dash: [3, 3], alpha: 0.7 });
            S.line(s1w[0], s1w[1], s2w[0], s2w[1], { color: 'red', width: 3, alpha: 0.6 });
            S.corner('TS₁ = TS₂ = I, yet S₁w ≠ S₂w', 'tl', { color: 'red', weight: 700, size: 13 });
            st = { inv, w, a, b, s1w, s2w };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.inv) return `Left inverse $S_1 = ${mtex(st.S1)}$ (solving $S_1T = I$), right inverse $S_2 = ${mtex(st.S2)}$ (solving $TS_2 = I$): they coincide, and $S_1w = ${vtex(st.s1w)} = S_2w$.`;
          return `$T(S_i(1)) = 1$ for both, so both are right inverses. But $S_1w = ${vtex(st.s1w)} \\ne ${vtex(st.s2w)} = S_2w$: the step $(S_1T)(S_2w) = S_2w$ needs $S_1T = I$, and $S_1T(x,y) = (x+y)\\,S_1(1)$ squashes $\\mathbf R^2$ onto a line. One-sided inverses need not be unique; two-sided ones are.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.63
    {
      num: '3.63',
      kind: 'Theorem',
      name: 'Invertibility ⟺ injectivity and surjectivity',
      statement: String.raw`A linear map $T \in \mathcal L(V, W)$ is invertible if and only if it is injective and surjective.`,
      idea: String.raw`If $T$ has an inverse $S$, then $Tu = Tv$ gives $u = STu = STv = v$ (injective, via 3.14 or directly), and every $w = T(Sw)$ is in the range (surjective). Conversely, if $T$ is a bijection, define $Sw$ as the unique $v$ with $Tv = w$; then $ST = I$ and $TS = I$ by construction, and $S$ is linear because $T(Sw_1 + Sw_2) = w_1 + w_2$ and injectivity forces $S(w_1 + w_2) = Sw_1 + Sw_2$ (similarly for scalars).`,
      caption: String.raw`Pick a map (or click a cell of the grid). Right: the range of $T$ (green) inside $W$; drag $w$ (it snaps onto the range when close). Left: every $u$ with $Tu = w$ — none when $w$ misses the range (not surjective), a whole line or plane when the null space (dashed red) is nontrivial (not injective), and **exactly one point** only in the invertible corner, where it is $T^{-1}w$.`,
      deps: ['ladr-3.59', 'ladr-3.14', 'ladr-3.19'],
      tags: ['invertibility'],
      viz(v) {
        const M = v.M;
        const PRE = {
          inj: { A: [[1, 0], [0, 1], [0.6, 0.6]], label: '$\\mathbf R^2 \\to \\mathbf R^3$' },
          surj: { A: [[1, 0, 0.6], [0, 1, 0.6]], label: '$\\mathbf R^3 \\to \\mathbf R^2$' },
          iso2: { A: [[1, 0.5], [-0.4, 1]], label: '$\\mathbf R^2 \\to \\mathbf R^2$, rank 2' },
          sing2: { A: [[1, 0.5], [0.6, 0.3]], label: '$\\mathbf R^2 \\to \\mathbf R^2$, rank 1' },
          iso3: { A: [[1, 0.3, 0], [0, 1, 0.4], [0.3, 0, 1]], label: '$\\mathbf R^3 \\to \\mathbf R^3$, rank 3' },
          sing3: { A: [[1, 0, 0.5], [0, 1, 0.5], [0.5, 0.5, 0.5]], label: '$\\mathbf R^3 \\to \\mathbf R^3$, rank 2' },
        };
        const pre = v.select('$T$', Object.entries(PRE).map(([value, p]) => ({ value, label: p.label })), 'sing3');
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 320, title: '$V$: all $u$ with $Tu = w$' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 320, title: '$W$: range of $T$ and the target $w$' });
        const scL = v.scene3(L, { axis: 1.6, yaw: -0.7, pitch: 0.36 }), scR = v.scene3(R, { axis: 1.6, yaw: -0.7, pitch: 0.36 });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const emb = (p) => (p.length === 2 ? [p[0], p[1], 0] : p);
        let A = PRE.sing3.A;
        const rangeB = () => orthN(M.transpose(A).map(emb), 1e-6);
        const snap = (p) => { const B = rangeB(); if (B.length === 3) return p; const q = B.reduce((s, e) => s.map((x, i) => x + dotN(p, e) * e[i]), [0, 0, 0]); return Math.hypot(...p.map((x, i) => x - q[i])) < 0.2 ? q : p; };
        const w3 = scR.handle([0.7, 0.9, 0.5], { color: 'accent', label: 'w', lim: 1.6, snap });
        const w2 = scR.handle([0.9, 0.3, 0], { color: 'accent', label: 'w', mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], lim: 1.6, snap });
        const TG = v.table(G, { rows: 2, cols: 2, square: false, cellAspect: 4.2, maxCell: 40, size: 12.5, rowLabels: ['injective', 'not injective'], colLabels: ['surjective', 'not surjective'] });
        const CELL = [['invertible: ST = I = TS', 'a left inverse only'], ['a right inverse only', 'no one-sided inverse']];
        G.onClick((x, y) => { const c = TG.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { const opts = [[['iso2', 'iso3'], ['inj']], [['surj'], ['sing2', 'sing3']]][c.i][c.j]; pre.set(opts[(opts.indexOf(pre.value) + 1) % opts.length]); } });
        let st = null;
        v.render(() => {
          A = PRE[pre.value].A;
          const m = A.length, n = A[0].length, rank = M.rank(A, 1e-9), inj = rank === n, sur = rank === m;
          w3.h.visible = m === 3; w2.h.visible = m === 2;
          const W = m === 3 ? w3 : w2, w = W.p.slice(0, m);
          const cols = M.transpose(A).map(emb), Bq = rangeB();
          const q = Bq.reduce((s, e) => s.map((x, i) => x + dotN(emb(w), e) * e[i]), [0, 0, 0]), inR = Math.hypot(...emb(w).map((x, i) => x - q[i])) < 1e-6;
          // target
          scR.begin();
          if (m === 2) scR.disc([1, 0, 0], [0, 1, 0], 1.7, { fill: 'faint', color: 'faint', fillAlpha: 0.06 });
          spanDraw(scR, cols, { color: 'green', r: 1.8, box: 1.25 });
          cols.forEach((c, k) => scR.arrow([0, 0, 0], c, { color: 'muted', width: 1.4, alpha: 0.7, head: 7 }));
          scR.arrow([0, 0, 0], emb(w), { color: inR ? 'accent' : 'red' });
          scR.flush();
          R.corner(sur ? 'range T = W: surjective' : `range T has dim ${rank} < ${m}: not surjective`, 'tl', { color: sur ? 'green' : 'red', weight: 700, size: 12.5 });
          // domain
          const ns = M.nullspace(A).map(emb);
          scL.begin();
          if (n === 2) scL.disc([1, 0, 0], [0, 1, 0], 1.7, { fill: 'faint', color: 'faint', fillAlpha: 0.06 });
          if (ns.length === 1) scL.line(ns[0].map((x) => -1.8 * x), ns[0].map((x) => 1.8 * x), { color: 'red', width: 1.4, dash: [5, 4] }, 1);
          let pre1 = null;
          if (inR) {
            const u0 = emb(M.lstsq(A, w)); pre1 = u0;
            if (ns.length === 0) scL.dot(u0, { r: 7, color: 'green', label: 'T⁻¹w' });
            else if (ns.length === 1) { scL.line(u0.map((x, i) => x - 2.2 * ns[0][i]), u0.map((x, i) => x + 2.2 * ns[0][i]), { color: 'gold', width: 4 }, 12); scL.dot(u0, { r: 4, color: 'gold' }); }
            else scL.disc(ns[0], ns[1], 1.8, { fill: 'gold', color: 'gold', fillAlpha: 0.25 }, u0);
          }
          scL.flush();
          L.corner(!inR ? 'no u at all: w is not in the range' : ns.length ? `a ${ns.length === 1 ? 'line' : 'plane'} of u's: T is not injective` : 'exactly one u', 'tl', { color: !inR || ns.length ? 'red' : 'green', weight: 700, size: 12.5 });
          const ci = inj ? 0 : 1, cj = sur ? 0 : 1;
          TG.draw({ value: (i, j) => CELL[i][j], fill: (i, j) => (i === ci && j === cj ? [i + j === 0 ? 'green' : 'red', 0.22] : null), highlight: [[ci, cj, ci + cj === 0 ? 'green' : 'red']], textColor: (i, j) => (i === ci && j === cj ? 'ink' : 'muted') });
          st = { m, n, rank, inj, sur, inR, pre1, dn: ns.length };
        });
        v.legend([['green', 'range of $T$', { area: true }], ['red', 'null space of $T$', { dash: true }], ['gold', 'solutions of $Tu = w$']]);
        v.readout(() => {
          if (!st) return '';
          const { m, n, rank, inj, sur, inR, pre1, dn } = st;
          return `$T: \\mathbf R^${n} \\to \\mathbf R^${m}$, $\\dim\\operatorname{null}T = ${dn}$, $\\dim\\operatorname{range}T = ${rank}$. ` + (inj && sur ? `Injective and surjective: each $w$ has exactly one preimage, $T^{-1}w = ${vtex(pre1.slice(0, n))}$, and $T^{-1}$ is linear.` : `${inj ? '' : 'Not injective: preimages are not unique. '}${sur ? '' : 'Not surjective: some $w$ have no preimage. '}So no inverse exists.` + (inR ? '' : ' (This $w$ is missed.)'));
        });
      },
    },
    // ------------------------------------------------------------------ 3.65
    {
      num: '3.65',
      kind: 'Theorem',
      name: 'Injective ⟺ surjective when dim V = dim W < ∞',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional with $\dim V = \dim W$, and $T \in \mathcal L(V, W)$. Then
$$T \text{ is invertible} \iff T \text{ is injective} \iff T \text{ is surjective}.$$`,
      idea: String.raw`The fundamental theorem of linear maps (3.21) gives $\dim\operatorname{null}T + \dim\operatorname{range}T = \dim V = \dim W$. So $\operatorname{null}T = \{0\}$ (injective, 3.15) exactly when $\dim\operatorname{range}T = \dim W$, i.e. when $\operatorname{range}T = W$ (surjective, 2.39). Either one then gives both, hence invertibility by 3.63. With $\dim V \ne \dim W$ the two conditions come apart.`,
      caption: String.raw`Edit the matrix (click the top/bottom half of an entry, or drag) or press *random* / *make singular*. The upper bar splits $\dim V$ into $\dim\operatorname{null}T$ (red) and $\dim\operatorname{range}T$ (green); the lower bar shows how much of $W$ the range fills. For square matrices the two lights always agree. Choose a $2\times3$ or $3\times2$ matrix and they disagree.`,
      deps: ['ladr-3.21', 'ladr-3.15', 'ladr-2.39', 'ladr-3.63'],
      see: ['pma-9.5'],
      tags: ['invertibility'],
      viz(v) {
        const M = v.M;
        const SH = { 33: [3, 3], 22: [2, 2], 23: [2, 3], 32: [3, 2] };
        const shp = v.select('size of $\\mathcal M(T)$', [{ value: '33', label: '$3\\times3$' }, { value: '22', label: '$2\\times2$' }, { value: '23', label: '$2\\times3$' }, { value: '32', label: '$3\\times2$' }], '33');
        const Ab = [[1, 2, 0], [0, 1, 1], [1, 3, 1]];
        let seed = 11;
        v.button('random', () => { const r = v.rng(seed++ * 31); for (const row of Ab) for (let j = 0; j < 3; j++) row[j] = r.int(-2, 2); });
        v.button('make singular', () => { const [m, n] = SH[shp.value]; for (let i = 0; i < 3; i++) Ab[i][n - 1] = n > 2 ? Ab[i][0] + Ab[i][1] : 2 * Ab[i][0]; if (m === 2 && n === 2) Ab[1][1] = 2 * Ab[1][0]; });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, weight: 0.7, minWidth: 220 });
        const B = v.stage({ x: [-0.3, 6.4], y: [0, 5.2], axes: false, height: 260, weight: 1.3 });
        const T = v.table(Q, { rows: 3, cols: 3, maxCell: 50, size: 16, region: [0, 0.1, 1, 0.92] });
        let cur = null;
        editable(v, Q, T, () => Ab, { min: -3, max: 3 });
        let st = null;
        v.render(() => {
          const [m, n] = SH[shp.value], A = Ab.slice(0, m).map((r) => r.slice(0, n));
          T.set({ rows: m, cols: n });
          T.draw({ value: (i, j) => A[i][j] });
          ttl(Q, T, `\\mathcal M(T):\\ \\mathbf R^${n} \\to \\mathbf R^${m}`, 'ink', true, 14);
          const r = M.rank(A, 1e-9), nul = n - r, inj = nul === 0, sur = r === m, u = 1.75, x0 = 0.4;
          // dim V = dim null + dim range
          B.text(`V = R${'⁰¹²³'[n]}:   dim null T + dim range T = ${nul} + ${r} = ${n}`, x0, 4.85, { size: 12.5, color: 'ink', weight: 600 });
          for (let k = 0; k < n; k++) B.rect(x0 + k * u + 0.04, 3.55, x0 + (k + 1) * u - 0.04, 4.35, { color: k < nul ? 'red' : 'green', fill: k < nul ? 'red' : 'green', fillAlpha: 0.3, width: 1.4 });
          if (nul) B.text('null', x0 + (nul * u) / 2, 3.95, { align: 'center', color: 'red', weight: 700, size: 12 });
          if (r) B.text('range', x0 + nul * u + (r * u) / 2, 3.95, { align: 'center', color: 'green', weight: 700, size: 12 });
          B.text(`W = R${'⁰¹²³'[m]}:   dim range T = ${r} of ${m}`, x0, 2.95, { size: 12.5, color: 'ink', weight: 600 });
          for (let k = 0; k < m; k++) B.rect(x0 + k * u + 0.04, 1.65, x0 + (k + 1) * u - 0.04, 2.45, { color: k < r ? 'green' : 'faint', fill: k < r ? 'green' : 'faint', fillAlpha: k < r ? 0.3 : 0.12, width: 1.4, dash: k < r ? false : [4, 3] });
          if (m > r) B.text('missed', x0 + r * u + ((m - r) * u) / 2, 2.05, { align: 'center', color: 'muted', weight: 700, size: 12 });
          [[inj, 'injective'], [sur, 'surjective']].forEach(([ok, lab], i) => {
            const cx = x0 + 0.3 + i * 2.9;
            B.dot(cx, 0.7, { r: 10, color: ok ? 'green' : 'red' });
            B.text(`${lab}: ${ok ? 'yes' : 'no'}`, cx + 0.32, 0.7, { size: 13, weight: 700, color: ok ? 'green' : 'red' });
          });
          st = { m, n, r, nul, inj, sur, ns: M.nullspace(A) };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, n, r, nul, inj, sur, ns } = st;
          const why = nul ? ` A nonzero null vector: $${vtex(ns[0])}$.` : '';
          if (m === n) return `$\\dim V = \\dim W = ${n}$: $\\dim\\operatorname{null}T = ${nul}$ and $\\dim\\operatorname{range}T = ${r}$, so ${inj ? '**both** hold — $T$ is invertible' : '**neither** holds'}.${why}`;
          return `$\\dim V = ${n} \\ne ${m} = \\dim W$: injective ${inj ? 'yes' : 'no'}, surjective ${sur ? 'yes' : 'no'} — ${inj === sur ? 'here they agree, but only by accident (try other entries).' : 'the two properties come apart.'} ${n > m ? 'A map to a smaller space can never be injective.' : 'A map to a bigger space can never be surjective.'}${why}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.68
    {
      num: '3.68',
      kind: 'Theorem',
      name: 'ST = I ⟺ TS = I in equal finite dimensions',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional vector spaces of the same dimension, $S \in \mathcal L(W, V)$ and $T \in \mathcal L(V, W)$. Then $ST = I$ if and only if $TS = I$.`,
      idea: String.raw`If $ST = I$ then $Tv = 0$ implies $v = STv = 0$, so $T$ is injective (3.15), hence invertible because $\dim V = \dim W$ (3.65). Multiplying $ST = I$ on the right by $T^{-1}$ gives $S = T^{-1}$, so $TS = I$. The converse is the same argument with the roles swapped. For spaces of different dimensions a one-sided inverse is never two-sided.`,
      caption: String.raw`Square case: $S$ is computed only from the equation $ST = I$, yet the table shows $TS = I$ too, and in 3D $TSx = x$ for the draggable $x$. Switch to a $3\times2$ matrix $T$: the sliders pick one of infinitely many left inverses, $ST = I_2$ still holds, but $TS$ squashes $\mathbf R^3$ onto the plane $\operatorname{range}T$ (green) along the line $\operatorname{null}S$ (red), so $TSx \ne x$. Edit $T$ in the table to explore.`,
      deps: ['ladr-3.15', 'ladr-3.65'],
      tags: ['invertibility'],
      viz(v) {
        const M = v.M;
        const md = v.select('$T$', [{ value: 'sq', label: 'square: $3\\times3$' }, { value: 'tall', label: '$3\\times2$: $\\mathbf R^2 \\to \\mathbf R^3$' }], 'sq');
        const c1 = v.slider('left inverse $c_1$', -1.5, 1.5, 0.6, { step: 0.05 }), c2 = v.slider('$c_2$', -1.5, 1.5, -0.4, { step: 0.05 });
        const Tsq = [[1, 1, 0], [0, 1, 1], [1, 0, 1]], Tt = [[1, 0], [0, 1], [1, 1]];
        const S3 = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 330, title: 'a test vector $x$ and $TSx$ in $\\mathbf R^3$' });
        const sc = v.scene3(S3, { axis: 1.7, yaw: -0.7, pitch: 0.34 });
        const hx = sc.handle([1, -0.6, 1.1], { color: 'accent', label: 'x', lim: 1.6 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 180, full: true });
        const regs = [[0, 0, 0.23, 0.84], [0.25, 0, 0.5, 0.84], [0.52, 0, 0.73, 0.84], [0.75, 0, 1, 0.84]];
        const tabs = regs.map((r) => v.table(Q, { rows: 3, cols: 3, region: r, maxCell: 38, size: 12.5 }));
        editable(v, Q, tabs[0], () => (md.value === 'sq' ? Tsq : Tt), { min: -2, max: 2 });
        let st = null;
        v.render(() => {
          const sq = md.value === 'sq', T = sq ? Tsq : Tt, n = T[0].length;
          c1.el.hidden = c2.el.hidden = sq;
          const rk = M.rank(T, 1e-9), ok = rk === n;
          let S = null, nullS = null;
          if (ok && sq) S = M.transpose(M.luSolve(M.transpose(T), M.identity(3)));          // only the equation S T = I is used
          if (ok && !sq) { const nv = cross3(colOf(T, 0), colOf(T, 1)), l = Math.hypot(...nv), nn = nv.map((x) => x / l); S = M.pinv(T).map((row, i) => row.map((x, j) => x + [c1.value, c2.value][i] * nn[j])); nullS = M.nullspace(S)[0]; }
          const ST = S ? M.matMul(S, T) : null, TS = S ? M.matMul(T, S) : null;
          const isI = (X) => X && maxDiff(X, M.identity(X.length)) < 1e-9;
          const x = hx.p, TSx = TS ? TS.map((row) => dotN(row, x)) : null;
          sc.begin();
          if (!sq) spanDraw(sc, M.transpose(T), { color: 'green', r: 1.9 });
          if (nullS) sc.line(nullS.map((c) => -2 * c), nullS.map((c) => 2 * c), { color: 'red', width: 2, dash: [5, 4] }, 1);
          sc.arrow([0, 0, 0], x, { color: 'accent' });
          if (TSx) {
            if (!isI(TS)) { sc.line(x, TSx, { color: 'gold', width: 1.4, dash: [3, 3] }, 1); sc.arrow([0, 0, 0], TSx, { color: 'gold' }); sc.tex('TSx', TSx, { color: 'gold', dx: 18, dy: 12, size: 13 }); }
            else sc.dot(TSx, { r: 10, hollow: true, color: 'green', width: 2.2 });
          }
          sc.flush();
          S3.corner(!S ? 'T is not injective: no left inverse' : isI(TS) ? 'TSx = x for every x' : 'TSx ≠ x: TS is a projection', 'tl', { color: !S ? 'red' : isI(TS) ? 'green' : 'red', weight: 700, size: 13 });
          const show = [[T, 'T', 'ink'], [S, 'S', 'purple'], [ST, 'ST', isI(ST) ? 'green' : 'red'], [TS, 'TS', isI(TS) ? 'green' : 'red']];
          show.forEach(([X, lab, col], i) => {
            if (!X) { tabs[i].set({ rows: 1, cols: 1 }); tabs[i].draw({ value: () => '—', textColor: () => 'faint' }); ttl(Q, tabs[i], lab, 'faint', false, 14); return; }
            tabs[i].set({ rows: X.length, cols: X[0].length });
            tabs[i].draw({ value: (a, b) => X[a][b], format: (z) => fr(z), fill: i >= 2 ? (a, b) => [col, Math.abs(X[a][b] - (a === b ? 1 : 0)) > 1e-9 ? 0.3 : 0.1] : null });
            ttl(Q, tabs[i], lab + (i >= 2 ? (isI(X) ? ' = I' : ' \\ne I') : ''), col, false, 14);
          });
          st = { sq, ok, n, ST: isI(ST), TS: isI(TS) };
        });
        v.legend([['accent', '$x$'], ['gold', '$TSx$'], ['green', '$\\operatorname{range}T$', { area: true }], ['red', '$\\operatorname{null}S$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (!st.ok) return `This $T$ has a nonzero null vector, so no $S$ with $ST = I$ exists (it would give $v = STv = 0$).`;
          if (st.sq) return `$S$ was found by solving $ST = I$ alone; $TS = I$ follows, because $\\dim V = \\dim W = 3$ makes the injective $T$ invertible (3.65) and $S = T^{-1}$.`;
          return `$\\dim V = 2 \\ne 3 = \\dim W$: every choice of $c_1, c_2$ gives a left inverse ($ST = I_2$), but $TS$ has rank $2$ and cannot be $I_3$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.69
    {
      num: '3.69',
      kind: 'Definition',
      name: 'Isomorphism, isomorphic spaces',
      statement: String.raw`An **isomorphism** is an invertible linear map. Two vector spaces are **isomorphic** if there is an isomorphism from one onto the other.`,
      idea: String.raw`An isomorphism is a perfect relabelling: it matches the elements of the two spaces one to one (3.63), and because it is linear, sums and scalar multiples correspond as well — so every statement about the vector-space structure of one space translates into the other. The same pair of spaces can be matched by many different isomorphisms.`,
      caption: String.raw`$\mathcal P_2(\mathbf R) \to \mathbf R^3$. Drag the three handles on the blue parabola $p$, or drag the blue point in $\mathbf R^3$ — each moves the other. The orange $q$ moves by its point in $\mathbf R^3$. Then $p + q$ (green) and $\lambda p$ (gold) are formed on both sides and always match. Switch the isomorphism from coefficients to values at $-1, 0, 1$: the points move, the matching does not break.`,
      deps: ['ladr-3.59'],
      tags: ['invertibility'],
      viz(v) {
        const M = v.M;
        const co = v.select('isomorphism', [{ value: 'coef', label: 'coefficients $(a_0,a_1,a_2)$' }, { value: 'val', label: 'values $(p(-1),p(0),p(1))$' }], 'coef');
        const lam = v.slider('$\\lambda$', -2, 2, -1.2, { step: 0.05 });
        const G = v.stage({ x: [-2.2, 2.2], y: [-3.2, 3.2], height: 340, title: '$\\mathcal P_2(\\mathbf R)$', xlabel: 'x' });
        const S3 = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: false, height: 340, title: '$\\mathbf R^3$' });
        const sc = v.scene3(S3, { axis: 1.7, yaw: -0.65, pitch: 0.32 });
        const VM = [[1, -1, 1], [1, 0, 0], [1, 1, 1]], ID = M.identity(3), VI = M.inverse(VM);
        const ev = (a, x) => a[0] + a[1] * x + a[2] * x * x;
        let pa = [0.5, -0.6, 0.7], qa = [-0.4, 0.8, -0.5], last = 'coef';
        const XS = [-1, 0, 1];
        const gh = XS.map((x) => G.handle(x, ev(pa, x), { color: 'blue', constrain: (_, y) => [x, M.clamp(y, -3, 3)] }));
        const hp = sc.handle(pa, { color: 'blue', label: 'p', lim: 1.6 }), hq = sc.handle(qa, { color: 'orange', label: 'q', lim: 1.6 });
        let st = null;
        v.render(() => {
          const Phi = co.value === 'coef' ? ID : VM, Pi = co.value === 'coef' ? ID : VI;
          const phi = (a) => M.matVec(Phi, a);
          if (last !== co.value) last = co.value;
          else if (hp.h.dragging) pa = M.matVec(Pi, hp.p);
          else if (gh.some((h) => h.dragging)) pa = M.matVec(VI, gh.map((h) => h.y));
          if (hq.h.dragging) qa = M.matVec(Pi, hq.p);
          gh.forEach((h, i) => { if (!h.dragging) h.y = ev(pa, XS[i]); });
          if (!hp.h.dragging) hp.p = phi(pa);
          if (!hq.h.dragging) hq.p = phi(qa);
          const sa = pa.map((x, i) => x + qa[i]), la = pa.map((x) => lam.value * x);
          G.fn((x) => ev(la, x), { color: 'gold', width: 2, dash: [6, 4] });
          G.fn((x) => ev(qa, x), { color: 'orange', width: 2.2 });
          G.fn((x) => ev(sa, x), { color: 'green', width: 2.6 });
          G.fn((x) => ev(pa, x), { color: 'blue', width: 2.8 });
          const P = phi(pa), Qv = phi(qa), Sv = phi(sa), Lv = phi(la);
          sc.begin();
          sc.line([0, 0, 0], P, { color: 'blue', width: 2 }); sc.line([0, 0, 0], Qv, { color: 'orange', width: 2 });
          sc.line(P, Sv, { color: 'orange', width: 1, dash: true }); sc.line(Qv, Sv, { color: 'blue', width: 1, dash: true });
          sc.line(P.map((x) => -2 * x), P.map((x) => 2 * x), { color: 'gold', width: 1, alpha: 0.4, dash: true });
          sc.dot(Sv, { r: 6, color: 'green' }); sc.dot(Lv, { r: 5.5, color: 'gold' });
          sc.tex('p+q', Sv, { color: 'green', dx: 22, dy: -8, size: 13 }); sc.tex('\\lambda p', Lv, { color: 'gold', dx: 18, dy: 10, size: 13 });
          sc.flush();
          st = { P, Qv, Sv, Lv, sa, la, c: co.value };
        });
        v.legend([['blue', '$p$'], ['orange', '$q$'], ['green', '$p+q$'], ['gold', '$\\lambda p$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { P, Qv, Sv, Lv, c } = st, nm = c === 'coef' ? '\\varphi(p) = (a_0,a_1,a_2)' : '\\varphi(p) = (p(-1),p(0),p(1))';
          return `$${nm}$: $\\varphi(p) + \\varphi(q) = ${vtex(P.map((x, i) => x + Qv[i]))} = \\varphi(p+q) = ${vtex(Sv)}$ and $\\lambda\\varphi(p) = ${vtex(P.map((x) => lam.value * x))} = \\varphi(\\lambda p) = ${vtex(Lv)}$. $\\varphi$ is linear and invertible: an isomorphism.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.70
    {
      num: '3.70',
      kind: 'Theorem',
      name: 'Dimension shows whether spaces are isomorphic',
      statement: String.raw`Two finite-dimensional vector spaces over $\mathbf F$ are isomorphic if and only if they have the same dimension.`,
      idea: String.raw`An isomorphism $T: V \to W$ has $\operatorname{null}T = \{0\}$ and $\operatorname{range}T = W$, so $\dim V = 0 + \dim W$ by the fundamental theorem (3.21). Conversely, if $v_1,\dots,v_n$ and $w_1,\dots,w_n$ are bases, the linear map with $T(\sum c_kv_k) = \sum c_kw_k$ (it exists by 3.4) is injective and surjective, hence an isomorphism (3.63). Every $n$-dimensional space is thus a relabelled $\mathbf F^n$, its coordinates being the labels.`,
      caption: String.raw`Choose $V$ and $W$. Drag the coordinate bars (middle): they define an element of $V$ (left, in its own costume — a vector, a matrix, a polynomial) and, through the matching bases, an element of $W$ (right). With equal dimensions every bar has a partner and the map is an isomorphism. With unequal dimensions some coordinates are lost (red: not injective) or some are never reached (grey: not surjective).`,
      deps: ['ladr-3.69', 'ladr-3.21', 'ladr-3.63', 'ladr-3.4'],
      tags: ['invertibility', 'dimension'],
      viz(v) {
        const M = v.M;
        const SP = {
          R3: { d: 3, tex: '\\mathbf R^3', kind: 'vec', b: ['e_1', 'e_2', 'e_3'] },
          R4: { d: 4, tex: '\\mathbf R^4', kind: 'vec', b: ['e_1', 'e_2', 'e_3', 'e_4'] },
          M22: { d: 4, tex: '\\mathbf R^{2,2}', kind: 'mat', b: ['E_{1,1}', 'E_{1,2}', 'E_{2,1}', 'E_{2,2}'] },
          P3: { d: 4, tex: '\\mathcal P_3(\\mathbf R)', kind: 'poly', b: ['1', 'x', 'x^2', 'x^3'] },
          P2: { d: 3, tex: '\\mathcal P_2(\\mathbf R)', kind: 'poly', b: ['1', 'x', 'x^2'] },
        };
        const opts = Object.entries(SP).map(([value, s]) => ({ value, label: `$${s.tex}$` }));
        const Vs = v.select('$V$', opts, 'M22'), Ws = v.select('$W$', opts, 'P3');
        const SV = v.stage({ x: [-1.6, 1.6], y: [-2.2, 2.2], axes: false, height: 300, title: '$v \\in V$', minWidth: 200 });
        const SC = v.stage({ x: [-0.2, 4.2], y: [-2.6, 2.4], axes: false, height: 300, title: 'coordinates', minWidth: 220 });
        const SW = v.stage({ x: [-1.6, 1.6], y: [-2.2, 2.2], axes: false, height: 300, title: '$Tv \\in W$', minWidth: 200 });
        const c = [1, -0.5, 0.8, 0.6];
        const hs = c.map((y, k) => SC.handle(k + 0.5, y, { color: 'accent', constrain: (_, yy) => [k + 0.5, M.clamp(Math.round(yy * 10) / 10, -2, 2)] }));
        const mk = (s) => ({ vec4: v.table(s, { rows: 4, cols: 1, maxCell: 44, size: 14 }), vec3: v.table(s, { rows: 3, cols: 1, maxCell: 44, size: 14 }), mat: v.table(s, { rows: 2, cols: 2, maxCell: 56, size: 15 }) });
        const TV = mk(SV), TW = mk(SW);
        const show = (s, T, sp, cc, col, extraZero) => {
          if (sp.kind === 'poly') {
            s.line(-1.5, 0, 1.5, 0, { color: 'faint', width: 1 }); s.line(0, -2.1, 0, 2.1, { color: 'faint', width: 1 });
            s.fn((x) => cc.reduce((t, a, k) => t + a * x ** k, 0), { color: col, width: 2.8, domain: [-1.5, 1.5] });
            s.corner(cc.map((a, k) => (k ? ` ${a < 0 ? '−' : '+'} ${pn(Math.abs(a), 1)}${['', 'x', 'x²', 'x³'][k]}` : pn(a, 1))).join(''), 'bl', { color: col, size: 12.5, weight: 600 });
          } else if (sp.kind === 'mat') T.mat.draw({ value: (i, j) => cc[2 * i + j], format: (z) => pn(z, 1), fill: (i, j) => (extraZero.includes(2 * i + j) ? ['faint', 0.3] : [col, 0.12]) });
          else (sp.d === 4 ? T.vec4 : T.vec3).draw({ value: (i) => cc[i], format: (z) => pn(z, 1), fill: (i) => (extraZero.includes(i) ? ['faint', 0.3] : [col, 0.12]) });
        };
        let st = null;
        v.render(() => {
          const V = SP[Vs.value], W = SP[Ws.value], dV = V.d, dW = W.d, D = Math.max(dV, dW);
          hs.forEach((h, k) => { h.visible = k < dV; c[k] = h.y; });
          const cv = c.slice(0, dV), cw = [...Array(dW).keys()].map((k) => (k < dV ? c[k] : 0));
          SC.setView([-0.2, D + 0.2], [-2.7, 2.4]);
          SC.line(0, 0, D, 0, { color: 'faint', width: 1 });
          for (let k = 0; k < D; k++) {
            const inV = k < dV, inW = k < dW, col = inV && inW ? 'green' : inV ? 'red' : 'faint';
            if (inV) SC.rect(k + 0.18, 0, k + 0.82, c[k], { color: col, fill: col, fillAlpha: 0.3, width: 1.4 });
            else SC.rect(k + 0.18, -0.25, k + 0.82, 0.25, { color: 'faint', width: 1.2, dash: [4, 3] });
            SC.tex(inV ? V.b[k] : '—', k + 0.5, -2.2, { color: inV ? 'ink' : 'faint', size: 12 });
            SC.tex(inW ? W.b[k] : '—', k + 0.5, -2.55, { color: inW ? (inV ? 'ink' : 'faint') : 'red', size: 12 });
          }
          SC.text('V', -0.12, -2.2, { size: 11, color: 'muted', math: true, align: 'right' }); SC.text('W', -0.12, -2.55, { size: 11, color: 'muted', math: true, align: 'right' });
          show(SV, TV, V, cv, 'blue', []);
          show(SW, TW, W, cw, 'green', [...Array(dW).keys()].filter((k) => k >= dV));
          SV.setTitle(`$v \\in ${V.tex}$, $\\dim = ${dV}$`); SW.setTitle(`$Tv \\in ${W.tex}$, $\\dim = ${dW}$`);
          SC.corner(dV === dW ? 'isomorphism' : dV > dW ? 'red coordinates are lost' : 'grey slots never reached', 'tl', { color: dV === dW ? 'green' : 'red', weight: 700, size: 12.5 });
          st = { V, W, dV, dW };
        });
        v.readout(() => {
          if (!st) return '';
          const { V, W, dV, dW } = st;
          if (dV === dW) return `$\\dim ${V.tex} = \\dim ${W.tex} = ${dV}$: $T\\bigl(\\sum c_k\\,${V.b[0]}\\ldots\\bigr) = \\sum c_k\\,${W.b[0]}\\ldots$ sends basis to basis, so it is injective and surjective — an **isomorphism**; its inverse reads the coordinates the other way.`;
          if (dV > dW) return `$\\dim ${V.tex} = ${dV} > ${dW} = \\dim ${W.tex}$: this $T$ forgets ${dV - dW} coordinate${dV - dW > 1 ? 's' : ''}, so it is not injective — and no linear map can be, since $\\dim\\operatorname{null}T = ${dV} - \\dim\\operatorname{range}T \\ge ${dV - dW}$ (3.21). Not isomorphic.`;
          return `$\\dim ${V.tex} = ${dV} < ${dW} = \\dim ${W.tex}$: the range of any linear map has dimension at most ${dV}, so ${dW - dV} direction${dW - dV > 1 ? 's' : ''} of $W$ are never reached (grey) — no linear map is surjective. Not isomorphic.`;
        });
      },
    },
  ],
};
