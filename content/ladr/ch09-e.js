// Linear Algebra Done Right (Axler, 4th ed.) — Chapter 9: Multilinear Algebra and Determinants
// Part 5 (9.50–9.58): properties of determinants — invertibility, eigenvalues, similarity invariance, the matrix of
// an operator in any basis, the product of the eigenvalues, transpose / dual / adjoint, row and column operations,
// and unitary operators. Part 6 (9.59–9.67) is ch09-f.js; 9.1–9.49 live in the earlier part files.

// =====================================================================================================
// Shared helpers
// =====================================================================================================
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
const TAU = 2 * Math.PI;
const EC = ['blue', 'pink', 'teal', 'purple', 'orange'];
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
/** Compact canvas text for a complex number (real minus signs, no spaces). */
const cpn = (z, d = 2) => ctn(z, d).replace(/ /g, '').replace(/-/g, '−');
/** TeX for a real matrix and a real vector. */
const mtex = (A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
const vtex = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
/** A "nice" bound ≥ x from a list. */
const nice = (x, list = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 60, 100, 150, 200, 300, 500, 1000]) => list.find((t) => t >= x) ?? list[list.length - 1];

// ---------- real vectors and matrices (arrays of rows) ----------
const add = (a, b) => a.map((x, i) => x + b[i]);
const subv = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const mv = (A, x) => A.map((r) => dot(r, x));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const transp = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const clone = (A) => A.map((r) => r.slice());
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const det2 = (T) => T[0][0] * T[1][1] - T[0][1] * T[1][0];
/** Singular values s₁ ≥ s₂ ≥ 0 of a 2-by-2 matrix with its right singular vectors V = [v₁, v₂] (unit). */
function svd2(B) {
  const G = mm(transp(B), B), a = G[0][0], b = G[0][1], c = G[1][1];
  const m = (a + c) / 2, r = Math.hypot((a - c) / 2, b), th = 0.5 * Math.atan2(2 * b, a - c), v1 = [Math.cos(th), Math.sin(th)];
  return { s: [Math.sqrt(m + r), Math.sqrt(Math.max(0, m - r))], V: [v1, [-v1[1], v1[0]]] };
}

// ---------- complex numbers as [re, im], complex matrices as arrays of rows ----------
const toC = (x) => (Array.isArray(x) ? x : x && x.re !== undefined ? [x.re, x.im] : [x, 0]);
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cconj = (a) => [a[0], -a[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
const cscl = (a, k) => [a[0] * k, a[1] * k];
const cM = (A) => A.map((r) => r.map(toC));
const cMul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => cadd(s, cmul(x, B[k][j])), [0, 0])));
const cH = (A) => A[0].map((_, j) => A.map((r) => cconj(r[j])));
const cT = (A) => A[0].map((_, j) => A.map((r) => r[j].slice()));
const cEye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? [1, 0] : [0, 0])));
const cMax = (A) => Math.max(0, ...A.flat().map(cabs));
/** Determinant of a complex matrix by Gaussian elimination with partial pivoting. */
function cDet(A) {
  const n = A.length, R = A.map((r) => r.map((z) => toC(z).slice()));
  let d = [1, 0];
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (cabs(R[r][c]) > cabs(R[p][c])) p = r;
    if (cabs(R[p][c]) === 0) return [0, 0];
    if (p !== c) { [R[p], R[c]] = [R[c], R[p]]; d = cscl(d, -1); }
    d = cmul(d, R[c][c]);
    for (let r = c + 1; r < n; r++) { const f = cdiv(R[r][c], R[c][c]); if (f[0] || f[1]) for (let k = c; k < n; k++) R[r][k] = csub(R[r][k], cmul(f, R[c][k])); }
  }
  return d;
}
/** Characteristic polynomial of a complex matrix (Faddeev–LeVerrier), ascending coefficients [c₀, …, cₙ = 1]. */
function cCharPoly(A) {
  const n = A.length, c = Array(n + 1).fill(null); c[n] = [1, 0];
  let Mk = A.map((r) => r.map(() => [0, 0]));
  for (let k = 1; k <= n; k++) {
    Mk = cMul(A, Mk); for (let i = 0; i < n; i++) Mk[i][i] = cadd(Mk[i][i], c[n - k + 1]);
    const AM = cMul(A, Mk); let t = [0, 0]; for (let i = 0; i < n; i++) t = cadd(t, AM[i][i]);
    c[n - k] = cscl(t, -1 / k);
  }
  return c;
}
/** Group numerically computed eigenvalues (runtime Cx) into clusters: [{lam, m}]. */
function clusterEig(vals, rtol = 1e-3) {
  const pts = vals.map(toC), sc = 1 + Math.max(0, ...pts.map(cabs)), out = [];
  for (const z of pts) {
    const hit = out.find((q) => cabs(csub(cscl(q.sum, 1 / q.m), z)) < rtol * sc);
    if (hit) { hit.sum = cadd(hit.sum, z); hit.m++; } else out.push({ sum: z.slice(), m: 1 });
  }
  return out.map((q) => ({ lam: cscl(q.sum, 1 / q.m), m: q.m })).sort((a, b) => a.lam[0] - b.lam[0] || a.lam[1] - b.lam[1]);
}
/** Value of the k-th derivative of the polynomial with complex ascending coefficients c at z. */
function cpolyDer(c, k, z) {
  let f = [0, 0];
  for (let j = c.length - 1; j >= k; j--) { let fac = 1; for (let i = 0; i < k; i++) fac *= j - i; f = cadd(cmul(f, z), cscl(toC(c[j]), fac)); }
  return f;
}
/** Sharpen clustered eigenvalues: a root of multiplicity m of q is a simple root of q^{(m−1)} (Newton from the cluster mean). */
function polishClusters(cl, c) {
  return cl.map((e) => {
    let z = e.lam.slice();
    for (let it = 0; it < 6; it++) { const f = cpolyDer(c, e.m - 1, z), fp = cpolyDer(c, e.m, z); if (cabs(fp) < 1e-300) break; const dz = cdiv(f, fp); z = csub(z, dz); if (cabs(dz) < 1e-15 * (1 + cabs(z))) break; }
    if (cabs(csub(z, e.lam)) > 1e-3 * (1 + cabs(e.lam))) z = e.lam.slice();
    for (const i of [0, 1]) if (Math.abs(z[i] - Math.round(z[i])) < 1e-10 * (1 + cabs(z))) z[i] = Math.round(z[i]);
    return { lam: z, m: e.m };
  });
}
/** Orthonormalize the columns of a complex matrix (Gram–Schmidt, twice): a unitary matrix when they are independent. */
function cOrthCols(A) {
  const n = A.length, cols = [];
  for (let j = 0; j < n; j++) {
    let w = A.map((r) => r[j].slice());
    for (let p = 0; p < 2; p++) for (const e of cols) {
      let c = [0, 0]; for (let i = 0; i < n; i++) c = cadd(c, cmul(cconj(e[i]), w[i]));
      w = w.map((z, i) => csub(z, cmul(c, e[i])));
    }
    const l = Math.sqrt(w.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
    cols.push(w.map((z) => cscl(z, 1 / l)));
  }
  return cols[0].map((_, i) => cols.map((c) => c[i]));
}

// ---------- drawing and editing ----------
/** Two draggable handles for the columns Te₁, Te₂ of a 2-by-2 matrix; C.A reads the matrix, C.set(B) moves them. */
function colHandles(S, A, cols = ['accent', 'orange'], names = ['$Te_1$', '$Te_2$']) {
  const H = [0, 1].map((k) => S.handle(A[0][k], A[1][k], { color: cols[k], label: names[k], labelPos: k ? 'nw' : 'se' }));
  return { H, get A() { return [[H[0].x, H[1].x], [H[0].y, H[1].y]]; }, set(B) { H[0].set(B[0][0], B[1][0]); H[1].set(B[0][1], B[1][1]); } };
}
/** The image under T of the integer grid {|x|, |y| ≤ n}. */
function tgrid(S, T, n = 4, st = {}) {
  if (!(maxAbs(T) < 1e4)) return;
  for (let i = -n; i <= n; i++) {
    const a = mv(T, [i, -n]), b = mv(T, [i, n]), c = mv(T, [-n, i]), d = mv(T, [n, i]);
    S.line(a[0], a[1], b[0], b[1], st); S.line(c[0], c[1], d[0], d[1], st);
  }
}
/**
 * Make the cells of table T on stage s editable: click the upper / lower half of a cell for ±1 step, or drag it
 * up / down. o.bump(i, j, k) applies k steps; o.ok(i, j) says which cells may change.
 */
function editable(s, T, o) {
  let d = null;
  s.onDrag((x, y, ph) => {
    if (ph === 'start') {
      const c = T.geo ? T.hit(x, y) : null;
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
/** A panel-coloured plate in pixel coordinates, to keep a label legible over a busy background. */
function plate(S, X0, Y0, w, h) { S.rect(S.invX(X0), S.invY(Y0), S.invX(X0 + w), S.invY(Y0 + h), { fill: 'panel', fillAlpha: 0.88, stroke: false, radius: 6 }); }
/** The six faces of the parallelepiped spanned by a, b, c in a scene3. */
function ppiped(sc, a, b, c, st = {}, at = [0, 0, 0]) {
  const o = [0, 0, 0], ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const f of [[o, a, ab, b], [c, ac, abc, bc], [o, a, ac, c], [b, ab, abc, bc], [o, b, bc, c], [a, ab, abc, ac]]) {
    sc.poly(f.map((p) => add(p, at)), { fill: st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.1, color: st.color || 'accent', width: st.width ?? 1, alpha: st.alpha ?? 0.55, edge: st.edge });
  }
}
/** Dashed edges only (a ghost of an earlier parallelepiped). */
function ppEdges(sc, a, b, c, st = {}, at = [0, 0, 0]) {
  const o = [0, 0, 0], ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const [p, q] of [[o, a], [o, b], [o, c], [a, ab], [a, ac], [b, ab], [b, bc], [c, ac], [c, bc], [ab, abc], [ac, abc], [bc, abc]]) sc.line(add(p, at), add(q, at), { dash: [4, 4], width: 1.1, color: 'muted', alpha: 0.7, ...st }, 1);
}

export default {
  collection: 'ladr',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.50
    {
      num: '9.50',
      kind: 'Theorem',
      name: 'Invertible ⟺ nonzero determinant',
      statement: String.raw`An operator $T \in \mathcal L(V)$ is invertible if and only if $\det T \ne 0$. When $T$ is invertible,
$$\det(T^{-1}) = \frac{1}{\det T}.$$
Because an $n$-by-$n$ matrix is invertible exactly when the operator on $\mathbf F^n$ that it defines is invertible, a square matrix $A$ is invertible if and only if $\det A \ne 0$.`,
      idea: String.raw`If $T$ is invertible, multiplicativity (9.49) gives $1 = \det I = \det(TT^{-1}) = (\det T)\,\det(T^{-1})$, so $\det T \ne 0$ and $\det(T^{-1})$ is its reciprocal. Conversely, suppose $\det T \ne 0$ and $v \ne 0$. Extend $v$ to a basis $v, e_2, \dots, e_n$ and take a nonzero alternating $n$-form $\alpha$. Then $\alpha(v, e_2, \dots, e_n) \ne 0$ by 9.39, and
$$\alpha(Tv, Te_2, \dots, Te_n) = (\det T)\,\alpha(v, e_2, \dots, e_n) \ne 0.$$
A multilinear form gives $0$ when one of its inputs is $0$, so $Tv \ne 0$. Hence $T$ is injective, and an injective operator on a finite-dimensional space is invertible (3.65).`,
      caption: String.raw`Drag $Te_1$ (blue) and $Te_2$ (orange): the grid and the unit square follow $T$. The right panel shows the inverse map, computed by row reduction. The two shaded parallelograms have signed areas $\det T$ and $\det T^{-1}$, and their product stays $1$. To break invertibility, slide *squash* (or press *make it singular*) to push $Te_2$ onto the line of $Te_1$. The left parallelogram flattens and the right one blows up. At $\det T = 0$ the inverse ceases to exist and a whole line (red) is sent to $0$. Drag $v$ (gold): while $\det T \ne 0$, $Tv$ is never $0$ unless $v = 0$.`,
      deps: ['ladr-9.49', 'ladr-9.39', 'ladr-3.65'],
      see: ['pma-9.36'],
      tags: ['determinants', 'invertibility'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, minWidth: 270, title: '$T$: the grid, the unit square, and $v \\mapsto Tv$' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, minWidth: 270, title: '$T^{-1}$, computed by row reduction' });
        const PRE = { gen: [[1.6, 0.6], [0.4, 1.3]], flip: [[0.5, 1.5], [1.4, 0.3]], near: [[1.8, 1.5], [0.6, 0.62]] };
        const C = colHandles(L, PRE.gen);
        const vh = L.handle(-1.6, -0.5, { color: 'gold', label: 'v', labelPos: 'nw' });
        v.select('', [{ value: 'gen', label: '$\\det T > 0$' }, { value: 'flip', label: '$\\det T < 0$' }, { value: 'near', label: 'nearly singular' }], 'gen', { onChange: (k) => { C.set(PRE[k]); sq.set(0); } });
        const sq = v.slider('squash $Te_2$ onto the line of $Te_1$', 0, 1, 0, { step: 0.01 });
        v.button('make it singular', () => sq.set(1));
        let st = null;
        v.render(() => {
          const T0 = C.A, a = [T0[0][0], T0[1][0]], b0 = [T0[0][1], T0[1][1]], aa = dot(a, a), s = sq.value;
          const pr = aa > 1e-12 ? scl(a, dot(b0, a) / aa) : [0, 0];
          const b = s >= 1 ? pr : add(scl(b0, 1 - s), scl(pr, s));
          const T = [[a[0], b[0]], [a[1], b[1]]], d = det2(T);
          const sing = s >= 1 || Math.abs(d) <= 1e-9 * Math.max(1e-9, len(a) * len(b));
          const { s: sv, V } = svd2(T);
          // left: T
          tgrid(L, T, 5, { color: 'muted', width: 0.8, alpha: 0.32 });
          const col = sing ? 'red' : d > 0 ? 'accent' : 'red';
          L.poly([[0, 0], a, add(a, b), b], { fill: col, fillAlpha: 0.22, color: col, width: 1.8 });
          if (s > 0) { L.dot(b0[0], b0[1], { r: 3, color: 'orange', alpha: 0.6 }); L.arrow(b0[0], b0[1], b[0], b[1], { color: 'orange', dash: [4, 4], width: 1.3, head: 7 }); }
          L.arrow(0, 0, a[0], a[1], { color: 'accent', width: 2.4 });
          L.arrow(0, 0, b[0], b[1], { color: 'orange', width: 2.4 });
          if (sing) {
            const n = V[1];
            L.line(-5 * n[0], -5 * n[1], 5 * n[0], 5 * n[1], { color: 'red', width: 2.4, dash: [8, 5] });
            const lp = n[1] < 0 ? scl(n, -2.5) : scl(n, 2.5);
            L.text('null T', lp[0], lp[1], { dx: 8, color: 'red', weight: 700, size: 13 });
          }
          const p = [vh.x, vh.y], Tp = mv(T, p);
          L.arrow(0, 0, p[0], p[1], { color: 'gold', width: 1.4, dash: [5, 4], head: 7 });
          L.arrow(0, 0, Tp[0], Tp[1], { color: 'gold', width: 2.8 });
          if (len(Tp) > 0.25) L.text('Tv', Tp[0], Tp[1], { dx: 10, dy: -8, color: 'gold', math: true, weight: 700 });
          L.corner(sing ? 'det T = 0: not invertible' : `det T = ${pn(d, 3)}`, 'tl', { color: col, weight: 700 });
          // right: the inverse
          R.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { color: 'faint', width: 1.2, dash: [4, 4] });
          let Ti = null, di = NaN;
          if (!sing) { Ti = M.inverse(T); di = det2(Ti); }
          if (Ti) {
            const ia = [Ti[0][0], Ti[1][0]], ib = [Ti[0][1], Ti[1][1]];
            tgrid(R, Ti, 5, { color: 'purple', width: 0.8, alpha: 0.25 });
            R.poly([[0, 0], ia, add(ia, ib), ib], { fill: 'purple', fillAlpha: 0.22, color: 'purple', width: 1.8 });
            R.arrow(0, 0, ia[0], ia[1], { color: 'purple', width: 2.4 });
            R.arrow(0, 0, ib[0], ib[1], { color: 'teal', width: 2.4 });
            const lab = (p, t, c) => { const l = len(p); if (l < 2.6 && l > 1e-9) R.tex(t, p[0] + (0.42 * p[0]) / l, p[1] + (0.32 * p[1]) / l, { color: c, size: 13 }); };
            lab(ia, 'T^{-1}e_1', 'purple'); lab(ib, 'T^{-1}e_2', 'teal');
            R.corner(`det T⁻¹ = ${pn(di, 3)}`, 'tl', { color: 'purple', weight: 700 });
            if (Math.abs(di) > 9) R.corner('area 1/|det T|: off the chart', 'bl', { color: 'muted', size: 11.5 });
          } else {
            R.corner('T⁻¹ does not exist', 'tl', { color: 'red', weight: 700 });
            plate(R, R.width / 2 - 120, R.height / 2 - 26, 240, 46);
            R.textPx('T squeezes the plane onto a line:', R.width / 2, R.height / 2 - 12, { align: 'center', color: 'ink', size: 12.5, halo: false });
            R.textPx('nothing can undo that', R.width / 2, R.height / 2 + 8, { align: 'center', color: 'ink', size: 12.5, halo: false });
          }
          st = { d, di, sing, smin: sv[1], n: V[1], Tn: mv(T, V[1]), Tv: len(Tp), v: len(p) };
        });
        v.legend([['accent', '$T$(unit square)', { area: true }], ['purple', '$T^{-1}$(unit square)', { area: true }], ['red', 'orientation reversed / null space'], ['gold', '$v$ and $Tv$']]);
        v.readout(() => {
          if (!st) return '';
          if (st.sing) return `$\\det T = 0$, so $T$ is **not invertible**: the nonzero vector $u = ${vtex(st.n, 3)}$ has $Tu = ${vtex(st.Tn, 3)}$, the whole red line is sent to $0$, and $T^{-1}$ does not exist.`;
          return `$\\det T = ${tn(st.d, 4)}$ and, from the inverse matrix, $\\det T^{-1} = ${tn(st.di, 4)}$: their product is $${tn(st.d * st.di, 8)}$. Every unit vector is stretched by at least $\\min_{\\|u\\| = 1}\\|Tu\\| = ${tn(st.smin, 3)} > 0$, so $Tv = 0$ only for $v = 0$ (here $\\|Tv\\| = ${tn(st.Tv, 3)}$ for $\\|v\\| = ${tn(st.v, 3)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.51
    {
      num: '9.51',
      kind: 'Theorem',
      name: 'Eigenvalues and determinants',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $\lambda \in \mathbf F$. Then $\lambda$ is an eigenvalue of $T$ if and only if
$$\det(\lambda I - T) = 0.$$`,
      idea: String.raw`By 5.7, $\lambda$ is an eigenvalue exactly when $T - \lambda I$ is not invertible, and $T - \lambda I$ is invertible exactly when its negative $\lambda I - T$ is. By 9.50, $\lambda I - T$ fails to be invertible exactly when its determinant is $0$. So finding eigenvalues becomes finding the zeros of the function $\lambda \mapsto \det(\lambda I - T)$, which 9.63 will call the characteristic polynomial.`,
      caption: String.raw`Drag $Te_1$ and $Te_2$ to change $T$, or pick a preset. Drag $\lambda$ (gold) along the axis on the right; it snaps onto the zeros of $\det(\lambda I - T)$, drawn in green. On the left, the red ellipse is the image of the unit circle under $\lambda I - T$. The red arrow is its shortest vector $(\lambda I - T)u$, which joins $Tu$ (purple) to $\lambda u$ (gold). At a zero of the determinant the ellipse collapses to a segment through $0$, $Tu$ and $\lambda u$ coincide, and $u$ lies on an eigenvector line (green dashed). For the rotation the curve never reaches the axis, so there are no real eigenvalues.`,
      deps: ['ladr-5.7', 'ladr-9.50'],
      tags: ['determinants', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, minWidth: 270, title: 'unit vectors $u$: $Tu$, $\\lambda u$ and $(\\lambda I - T)u$' });
        const P = v.stage({ x: [-4, 4], y: [-4, 12], height: 330, minWidth: 270, axes: true, xlabel: 'λ', title: '$\\lambda \\mapsto \\det(\\lambda I - T)$' });
        const PRE = { sym: [[1.4, 1.0], [1.0, -0.6]], gen: [[2.0, 1.1], [-0.45, 0.3]], shear: [[1.5, 1.0], [0, 1.5]], rot: [[0.6, -1.5], [1.5, 0.6]] };
        const C = colHandles(L, PRE.sym);
        let zeros = [], zk = 0, st = null;
        const lam = P.handle(1.4, 0, { color: 'gold', label: 'λ', constrain: (x) => { for (const z of zeros) if (Math.abs(P.X(x) - P.X(z)) < 10) return [z, 0]; return [x, 0]; } });
        v.select('', [{ value: 'sym', label: 'symmetric' }, { value: 'gen', label: 'generic' }, { value: 'shear', label: 'shear' }, { value: 'rot', label: 'rotation' }], 'sym', { onChange: (k) => C.set(PRE[k]) });
        v.button('jump to the next eigenvalue', () => { if (zeros.length) { zk = (zk + 1) % zeros.length; lam.set(zeros[zk], 0); } });
        const f = (T, x) => M.det([[x - T[0][0], -T[0][1]], [-T[1][0], x - T[1][1]]]);
        v.render(() => {
          const T = C.A, t = T[0][0] + T[1][1], dT = det2(T), disc = t * t - 4 * dT, sc = 1 + t * t;
          zeros = disc > 1e-12 * sc ? [(t - Math.sqrt(disc)) / 2, (t + Math.sqrt(disc)) / 2] : disc > -1e-12 * sc ? [t / 2] : [];
          const l = lam.x, B = [[l - T[0][0], -T[0][1]], [-T[1][0], l - T[1][1]]], pl = f(T, l);
          const eig = zeros.some((z) => Math.abs(z - l) < 1e-9 * (1 + Math.abs(z)));
          const { s, V } = svd2(B), u = V[1], Tu = mv(T, u), lu = scl(u, l);
          // the graph of λ ↦ det(λI − T)
          const vals = [-4, -2, 0, 2, 4, t / 2].map((x) => f(T, x)), lo = Math.max(-25, Math.min(-2, ...vals)), hi = Math.min(40, Math.max(4, ...vals)), pad = 0.08 * (hi - lo);
          P.setView([-4, 4], [lo - pad, hi + pad]);
          P.fn((x) => f(T, x), { color: 'accent', width: 2.6 });
          zeros.forEach((z, k) => P.dot(z, 0, { r: 6.5, color: 'green', label: zeros.length > 1 ? `λ${sub(k + 1)}` : 'λ₁', labelPos: k ? 'se' : 'sw' }));
          P.line(l, 0, l, pl, { color: 'gold', width: 1.4, dash: [4, 4] });
          P.dot(l, pl, { r: 4.5, color: 'gold' });
          P.corner(zeros.length ? (eig ? `det(λI − T) = 0: eigenvalue` : `det(λI − T) = ${pn(pl, 3)}`) : 'no real zeros: no real eigenvalues', 'tl', { color: eig ? 'green' : zeros.length ? 'ink' : 'red', weight: 700 });
          // the plane
          for (const z of zeros) { const e = svd2([[z - T[0][0], -T[0][1]], [-T[1][0], z - T[1][1]]]).V[1]; L.line(-5 * e[0], -5 * e[1], 5 * e[0], 5 * e[1], { color: 'green', width: 1.6, dash: [7, 5], alpha: 0.75 }); }
          L.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [3, 4] });
          L.curve((th) => mv(B, [Math.cos(th), Math.sin(th)]), 0, TAU, { color: 'red', width: 1.8, fill: 'red', fillAlpha: 0.08 });
          const c1 = [T[0][0], T[1][0]], c2 = [T[0][1], T[1][1]];
          L.arrow(0, 0, c1[0], c1[1], { color: 'accent', width: 1.4, alpha: 0.55, head: 7 }); L.arrow(0, 0, c2[0], c2[1], { color: 'orange', width: 1.4, alpha: 0.55, head: 7 });
          L.arrow(0, 0, Tu[0], Tu[1], { color: 'purple', width: 2.6 });
          L.arrow(0, 0, lu[0], lu[1], { color: 'gold', width: 2.6, dash: [6, 4] });
          L.arrow(0, 0, u[0], u[1], { color: 'ink', width: 1.8, head: 7 });
          L.text('u', u[0], u[1], { dx: 9, dy: 9, math: true, color: 'ink' });
          if (!eig) { L.line(Tu[0], Tu[1], lu[0], lu[1], { color: 'red', width: 1.2, dash: [2, 3] }); L.arrow(0, 0, lu[0] - Tu[0], lu[1] - Tu[1], { color: 'red', width: 2.4 }); }
          L.corner(eig ? 'Tu = λu: an eigenvector' : `shortest |(λI − T)u| = ${pn(s[1], 3)}`, 'tl', { color: eig ? 'green' : 'red', weight: 700 });
          st = { l, pl, eig, s, u, res: len(subv(Tu, lu)), zeros, disc, t, dT };
        });
        v.legend([['accent', '$\\det(\\lambda I - T)$'], ['green', 'zeros and eigenvector lines', { dot: true }], ['red', '$(\\lambda I - T)$(unit circle)'], ['purple', '$Tu$'], ['gold', '$\\lambda u$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { l, pl, eig, s, u, res, zeros, disc, t, dT } = st;
          if (eig) return `$\\lambda = ${tn(l, 4)}$: $\\det(\\lambda I - T) = ${tn(pl, 10)}$, the ellipse has collapsed, and $u = ${vtex(u, 3)}$ satisfies $\\|Tu - \\lambda u\\| = ${v.sci(Math.max(res, 1e-17), 1)}$ — **an eigenvector**, so $\\lambda$ is an eigenvalue.`;
          const none = zeros.length ? '' : ` Here $(\\operatorname{tr} T)^2 - 4\\det T = ${tn(disc, 3)} < 0$: the zeros are $${tn(t / 2, 3)} \\pm ${tn(Math.sqrt(-disc) / 2, 3)}i \\notin \\mathbf R$, so this $T$ has no eigenvalue at all.`;
          return `$\\det(\\lambda I - T) = ${tn(pl, 3)} \\ne 0$ at $\\lambda = ${tn(l, 3)}$: the smallest $\\|(\\lambda I - T)u\\|$ over unit vectors is $${tn(s[1], 3)} > 0$, so no $u \\ne 0$ has $Tu = \\lambda u$.${none}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.52
    {
      num: '9.52',
      kind: 'Theorem',
      name: 'Determinant is a similarity invariant',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $S \colon W \to V$ is an invertible linear map. Then
$$\det(S^{-1}TS) = \det T.$$
Here $W$ may be a different vector space from $V$ (of the same dimension), in which case $\det S$ has no meaning.`,
      idea: String.raw`When $W = V$ this is $(\det S^{-1})(\det T)(\det S) = \det T$ by 9.49 and 9.50, but in general $\det S$ is undefined. Instead, transport forms: given an alternating $n$-form $\tau$ on $W$, define $\alpha(v_1, \dots, v_n) = \tau(S^{-1}v_1, \dots, S^{-1}v_n)$, an alternating $n$-form on $V$. Then
$$\tau(S^{-1}TSw_1, \dots, S^{-1}TSw_n) = \alpha(TSw_1, \dots, TSw_n) = (\det T)\,\alpha(Sw_1, \dots, Sw_n) = (\det T)\,\tau(w_1, \dots, w_n).$$
So $S^{-1}TS$ multiplies every $\tau$ by $\det T$, which by the definition 9.41 says $\det(S^{-1}TS) = \det T$. Geometrically: $T$ multiplies the area of *every* parallelogram by the same factor, including the one $S$ makes out of the unit square of $W$.`,
      caption: String.raw`Left, in $V$: drag $Sw_1$ (purple) and $Sw_2$ (teal), the images under $S$ of the standard basis of $W$. The faint grid is the image of the grid of $W$, the purple cell is $S(Q)$ for the unit square $Q$, and the blue cell is $T(S(Q))$. Right, in $W$: $Q$ and its image under $S^{-1}TS$, whose matrix is printed. However wildly that matrix changes, its determinant is $\det T$. Switch to $S^{\mathrm t}TS$, the way the matrix of a *bilinear form* changes (9.7): its determinant is $(\det S)^2\det T$. Make $S$ singular and $S^{-1}$ disappears.`,
      deps: ['ladr-9.41'],
      see: ['ladr-9.7'],
      tags: ['determinants'],
      viz(v) {
        const M = v.M;
        const TP = { a: [[1.4, 0.7], [-0.5, 1.1]], b: [[0.4, 1.3], [1.2, 0.3]], c: [[1.2, 0.6], [0.8, 0.4]] };
        let T = TP.a;
        const V = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, minWidth: 270, title: 'in $V$: the cell $S(Q)$ and $T(S(Q))$' });
        const W = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, minWidth: 270, title: 'in $W$: the unit square $Q$ and its image' });
        const s1 = V.handle(1.3, 0.4, { color: 'purple', label: '$Sw_1$' }), s2 = V.handle(-0.5, 1.0, { color: 'teal', label: '$Sw_2$' });
        v.select('$T$', [{ value: 'a', label: '$\\det T > 0$' }, { value: 'b', label: '$\\det T < 0$' }, { value: 'c', label: '$\\det T = 0$' }], 'a', { onChange: (k) => { T = TP[k]; } });
        const mode = v.select('right panel', [{ value: 'sim', label: '$S^{-1}TS$' }, { value: 'cong', label: '$S^{\\mathrm t}TS$ (break)' }], 'sim');
        let st = null;
        v.render(() => {
          const S = [[s1.x, s2.x], [s1.y, s2.y]], dS = det2(S), dT = det2(T), sing = Math.abs(dS) < 0.03, cong = mode.value === 'cong';
          // V: the S-grid, the cell S(Q) and T(S(Q))
          tgrid(V, S, 5, { color: 'purple', width: 0.8, alpha: 0.25 });
          const a = [s1.x, s1.y], b = [s2.x, s2.y], P = [[0, 0], a, add(a, b), b], TPc = P.map((p) => mv(T, p));
          V.poly(P, { fill: 'purple', fillAlpha: 0.2, color: 'purple', width: 1.6 });
          V.poly(TPc, { fill: dT >= 0 ? 'accent' : 'red', fillAlpha: 0.2, color: dT >= 0 ? 'accent' : 'red', width: 1.8 });
          V.arrow(0, 0, a[0], a[1], { color: 'purple', width: 2.2 }); V.arrow(0, 0, b[0], b[1], { color: 'teal', width: 2.2 });
          const Ta = mv(T, a), Tb = mv(T, b);
          V.arrow(0, 0, Ta[0], Ta[1], { color: 'purple', width: 1.6, dash: [5, 4] }); V.arrow(0, 0, Tb[0], Tb[1], { color: 'teal', width: 1.6, dash: [5, 4] });
          const ratio = Math.abs(dS) > 1e-12 ? det2(mm(T, S)) / dS : NaN;
          V.corner(sing ? 'S is not invertible' : `area T(S(Q)) / area S(Q) = ${pn(ratio, 3)}`, 'tl', { color: sing ? 'red' : 'ink', weight: 700 });
          // W: Q and its image
          W.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { fill: 'muted', fillAlpha: 0.1, color: 'muted', width: 1.2 });
          let B = null;
          if (cong) B = mm(transp(S), mm(T, S));
          else if (!sing) B = M.solve(S, mm(T, S));
          if (B) {
            const dB = det2(B), ok = Math.abs(dB - dT) < 1e-9 * (1 + Math.abs(dT)), colr = ok ? 'accent' : 'red';
            tgrid(W, B, 5, { color: 'muted', width: 0.7, alpha: 0.22 });
            const c1 = [B[0][0], B[1][0]], c2 = [B[0][1], B[1][1]];
            W.poly([[0, 0], c1, add(c1, c2), c2], { fill: colr, fillAlpha: 0.22, color: colr, width: 1.8 });
            W.arrow(0, 0, c1[0], c1[1], { color: colr, width: 2.2 }); W.arrow(0, 0, c2[0], c2[1], { color: colr, width: 2.2, dash: [6, 4] });
            plate(W, 6, W.height - 74, 236, 66);
            W.texPx(`${cong ? 'S^{\\mathrm t}TS' : 'S^{-1}TS'} = ${mtex(B, 2)}`, 14, W.height - 41, { align: 'left', size: 14, color: colr });
            W.corner(`det = ${pn(dB, 3)}${ok ? ' = det T' : ' ≠ det T'}`, 'tl', { color: ok ? 'green' : 'red', weight: 700 });
            st = { dT, dB, ok, ratio, dS, sing, cong };
          } else {
            W.corner('S⁻¹ does not exist', 'tl', { color: 'red', weight: 700 });
            st = { dT, ok: false, ratio, dS, sing, cong };
          }
        });
        v.legend([['purple', '$S(Q)$', { area: true }], ['accent', '$T(S(Q))$ and the image of $Q$', { area: true }], ['red', 'determinant not preserved / orientation reversed']]);
        v.readout(() => {
          if (!st) return '';
          const { dT, dB, ok, ratio, dS, sing, cong } = st;
          if (!cong && sing) return `$\\det T = ${tn(dT, 3)}$, but $S$ squashes $W$ onto a line ($\\det$ of its matrix is $${tn(dS, 3)}$): $S^{-1}$ does not exist, so neither does $S^{-1}TS$.`;
          const base = `$\\det T = ${tn(dT, 4)}$, and $T$ multiplies the area of the purple cell by $${tn(ratio, 4)}$ — the same factor for every cell.`;
          if (!cong) return `${base} On $W$: $\\det(S^{-1}TS) = ${tn(dB, 4)}$ ${ok ? '— **equal**, whatever $S$ is.' : '— check failed.'}`;
          return `${base} But $\\det(S^{\\mathrm t}TS) = ${tn(dB, 4)} = (${tn(dS, 3)})^2 \\cdot ${tn(dT, 3)}$: congruence by $S^{\\mathrm t}$ instead of $S^{-1}$ rescales the determinant by $(\\det S)^2$${ok ? ' (which happens to be 1 here)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.53
    {
      num: '9.53',
      kind: 'Theorem',
      name: 'Determinant of operator equals determinant of its matrix',
      statement: String.raw`Suppose $T \in \mathcal L(V)$ and $e_1, \dots, e_n$ is any basis of $V$. Then
$$\det T = \det \mathcal M\big(T, (e_1, \dots, e_n)\big).$$
In particular the right side is the same for every basis.`,
      idea: String.raw`Let $f_1, \dots, f_n$ be the standard basis of $\mathbf F^n$ and $S \colon \mathbf F^n \to V$ the map with $Sf_k = e_k$. Two applications of 3.43 show that the matrix of $S^{-1}TS$ in the standard basis is exactly $\mathcal M\big(T, (e_1, \dots, e_n)\big)$. The determinant of a matrix is by definition (9.43) the determinant of the operator on $\mathbf F^n$ it defines, here $S^{-1}TS$, and 9.52 (which allows $S$ to go between different spaces) says $\det(S^{-1}TS) = \det T$.`,
      caption: String.raw`$V = \mathcal P_2(\mathbf R)$, polynomials of degree at most $2$, and $T$ is the substitution $(Tp)(x) = p(ax + b)$; set $a$ and $b$ with the sliders. Pick a basis: the left panel plots $e_1, e_2, e_3$ (solid) and $Te_1, Te_2, Te_3$ (dashed). Drag the gold nodes of the Lagrange basis, or the centre $c$ of the shifted one. The table shows $\mathcal M\big(T, (e_k)\big)$, whose column $k$ holds the coordinates of $Te_k$. Its entries change completely from basis to basis, but the four determinants listed under it agree, and equal $a^3$. To break the hypothesis, switch on *write $Te_k$ in the basis $1, x, x^2$*. With different bases for the input and the output, the determinant now depends on the bases.`,
      deps: ['ladr-3.43', 'ladr-9.52', 'ladr-9.43'],
      see: ['ladr-8.50'],
      tags: ['determinants'],
      viz(v) {
        const M = v.M;
        const P = v.stage({ x: [-1.6, 1.6], y: [-2.2, 2.6], height: 340, weight: 1.25, minWidth: 300, title: 'basis $e_1, e_2, e_3$ (solid) and $Te_1, Te_2, Te_3$ (dashed)' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 260 });
        const a = v.slider('$a$', -1.5, 1.5, 1.3, { step: 0.05 }), b = v.slider('$b$', -1, 1, 0.3, { step: 0.05 });
        const BN = { mono: '$1, x, x^2$', shift: '$(x - c)^k$', lag: 'Lagrange', bern: 'Bernstein' };
        const basis = v.select('basis', Object.entries(BN).map(([value, label]) => ({ value, label })), 'lag');
        const other = v.toggle('write $Te_k$ in the basis $1, x, x^2$ (break)', false);
        const nodes = [-1.1, 0.25, 1.05].map((t, k) => P.handle(t, 0, { color: 'gold', label: `t${sub(k + 1)}`, labelPos: 's', constrain: (x) => [M.clamp(x, -1.5, 1.5), 0] }));
        const cH = P.handle(0.6, 0, { color: 'gold', label: 'c', labelPos: 's', constrain: (x) => [M.clamp(x, -1.5, 1.5), 0] });
        const TB = v.table(R, { rows: 3, cols: 3, region: [0.06, 0.36, 0.94, 0.86], maxCell: 62, size: 14 });
        const ev = (c, x) => c[0] + c[1] * x + c[2] * x * x;
        /** Columns = coefficient vectors (in 1, x, x²) of the basis polynomials, or null if they are not a basis. */
        const basisCols = (kind) => {
          if (kind === 'mono') return eye(3);
          if (kind === 'bern') return fromCols([[1, -2, 1], [0, 2, -2], [0, 0, 1]]);
          if (kind === 'shift') { const c = cH.x; return fromCols([[1, 0, 0], [-c, 1, 0], [c * c, -2 * c, 1]]); }
          const t = nodes.map((h) => h.x), cols = [];
          for (let j = 0; j < 3; j++) {
            const [p, q] = [0, 1, 2].filter((k) => k !== j).map((k) => t[k]), den = (t[j] - p) * (t[j] - q);
            if (Math.abs(den) < 1e-3) return null;
            cols.push([p * q / den, -(p + q) / den, 1 / den]);
          }
          return fromCols(cols);
        };
        let st = null;
        v.render(() => {
          const A = [[1, b.value, b.value ** 2], [0, a.value, 2 * a.value * b.value], [0, 0, a.value ** 2]]; // columns: (ax+b)^0, (ax+b)^1, (ax+b)^2
          const dT = M.det(A), kind = basis.value, E = basisCols(kind), brk = other.value;
          nodes.forEach((h) => { h.visible = kind === 'lag'; }); cH.visible = kind === 'shift';
          const matIn = (Em) => (brk ? mm(A, Em) : M.solve(Em, mm(A, Em)));
          if (!E) {
            P.corner('two nodes coincide: not a basis', 'tl', { color: 'red', weight: 700 });
            TB.draw({ value: () => '' }); ttl(R, TB, '\\text{no basis, no matrix}', 'red', false, 14);
            st = { ok: false, dT };
            return;
          }
          const cols = transp(E), Tcols = transp(mm(A, E));
          const CC = ['blue', 'pink', 'teal'];
          P.hline(0, { color: 'faint', width: 1 });
          cols.forEach((c, k) => P.fn((x) => ev(c, x), { color: CC[k], width: 2.4 }));
          Tcols.forEach((c, k) => P.fn((x) => ev(c, x), { color: CC[k], width: 1.8, dash: [6, 5] }));
          const ly = cols.map((c, k) => ({ k, Y: M.clamp(P.Y(ev(c, 1.45)) - 10, 12, P.height - 12) })).sort((p, q) => p.Y - q.Y);
          for (let q = 1; q < ly.length; q++) ly[q].Y = Math.max(ly[q].Y, ly[q - 1].Y + 16);
          ly.forEach(({ k, Y }) => P.texPx(`e_${k + 1}`, P.width - 8, Y, { color: CC[k], size: 13, align: 'right' }));
          const Mt = matIn(E), dM = M.det(Mt), ok = Math.abs(dM - dT) < 1e-8 * (1 + Math.abs(dT));
          TB.draw({ value: (i, j) => pn(Mt[i][j], 2), fill: (i, j) => [CC[j], 0.14], textColor: () => (brk ? 'red' : 'ink') });
          ttl(R, TB, brk ? '\\mathcal M\\big(T, (e_k), (1, x, x^2)\\big)' : '\\mathcal M\\big(T, (e_1, e_2, e_3)\\big)', brk ? 'red' : 'ink', false, 14);
          R.texPx(`\\det = ${tn(dM, 4)}`, R.width / 2, TB.geo.Y0 + 3 * TB.geo.ch + 22, { size: 16, color: ok ? 'green' : 'red' });
          const all = Object.keys(BN).map((k) => { const Ek = basisCols(k); return Ek ? M.det(matIn(Ek)) : NaN; });
          Object.keys(BN).forEach((k, i) => R.textPx(`${{ mono: 'monomials', shift: 'shifted', lag: 'Lagrange', bern: 'Bernstein' }[k]}: ${isFinite(all[i]) ? pn(all[i], 4) : '–'}`, R.width * (i % 2 ? 0.74 : 0.27), R.height - 50 + 22 * Math.floor(i / 2), { align: 'center', size: 12.5, color: k === kind ? 'ink' : 'muted', weight: k === kind ? 700 : 500 }));
          R.textPx('det of the matrix in each basis', R.width / 2, R.height - 76, { align: 'center', size: 12, color: 'muted' });
          P.corner(`det T = a³ = ${pn(dT, 4)}`, 'tl', { color: 'green', weight: 700 });
          st = { ok, dT, dM, all, brk, a: a.value };
        });
        v.legend([['blue', '$e_1$, $Te_1$ (dashed)'], ['pink', '$e_2$, $Te_2$'], ['teal', '$e_3$, $Te_3$']]);
        v.readout(() => {
          if (!st) return '';
          if (st.dM === undefined) return 'Two Lagrange nodes coincide, so the three polynomials are not a basis. Pull them apart.';
          const spread = Math.max(...st.all.filter(isFinite)) - Math.min(...st.all.filter(isFinite));
          if (st.brk) return `With the input basis $(e_k)$ but the output basis $1, x, x^2$, the determinant is $${tn(st.dM, 4)}$, while $\\det T = ${tn(st.dT, 4)}$; across the four bases these numbers spread over $${tn(spread, 3)}$. The theorem needs **one** basis on both sides.`;
          return `In the monomial basis the matrix is upper triangular with diagonal $1, a, a^2$, so $\\det T = a^3 = ${tn(st.dT, 4)}$ (9.48). In the current basis $\\det\\mathcal M = ${tn(st.dM, 4)}$; over the four bases the determinants ${spread === 0 ? 'agree exactly' : `differ by at most $${v.sci(spread, 1)}$ (rounding)`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.55
    {
      num: '9.55',
      kind: 'Theorem',
      name: 'Over C, determinant equals product of eigenvalues',
      statement: String.raw`Suppose $\mathbf F = \mathbf C$ and $T \in \mathcal L(V)$. Then $\det T$ is the product of the eigenvalues of $T$, each repeated as many times as its multiplicity:
$$\det T = \lambda_1^{d_1} \cdots \lambda_m^{d_m},$$
where $\lambda_1, \dots, \lambda_m$ are the distinct eigenvalues and $d_k = \dim G(\lambda_k, T)$.`,
      idea: String.raw`Over $\mathbf C$ there is a basis in which the matrix of $T$ is upper triangular with the eigenvalues on the diagonal, each appearing as often as its multiplicity (8.37). The determinant of $T$ is the determinant of this matrix (9.53), and the determinant of an upper-triangular matrix is the product of its diagonal entries (9.48). One could even take this as the *definition* of the determinant over $\mathbf C$; the multiplicity count is essential.`,
      caption: String.raw`Edit the complex matrix $A$: click the top or bottom half of an entry, or drag it, and use *clicks change* to choose real or imaginary parts. You can also pick a preset. In the plane, the eigenvalues are the blue rings, labelled with their multiplicity. The gold path $1 \to \lambda_1 \to \lambda_1\lambda_2 \to \lambda_1\lambda_2\lambda_3$ multiplies them in turn. Each shaded triangle $(0, P_{k-1}, P_k)$ is similar to the dashed triangle $(0, 1, \lambda_k)$, because multiplying by $\lambda_k$ rotates by $\arg\lambda_k$ and scales by $|\lambda_k|$. The path ends inside the green ring, which is $\det A$ computed by row reduction. With a repeated eigenvalue, switch on *count each distinct eigenvalue once* and the path misses the ring.`,
      deps: ['ladr-8.37', 'ladr-9.53', 'ladr-9.48'],
      see: ['ladr-8.52'],
      tags: ['determinants', 'eigenvalues'],
      viz(v) {
        const M = v.M;
        const PRE = {
          cx: [[[1, 0], [0, 1], [0, 0]], [[1, 0], [1, 1], [0, -1]], [[0, 0], [1, 0], [-1, 0]]],
          real: [[0, -2, 1], [1, 0, 0], [0, 1, 1]],
          rep: [[[1, 1], 0, -1], [[2, 1], -1, [-3, -1]], [0, 0, [1, 1]]],
        };
        let A = cM(PRE.rep), view = '', st = null;
        v.select('', [{ value: 'rep', label: 'eigenvalue $1 + i$ repeated' }, { value: 'cx', label: 'complex entries' }, { value: 'real', label: 'real, with a complex pair' }], 'rep', { onChange: (k) => { A = cM(PRE[k]); } });
        const part = v.select('clicks change', [{ value: 're', label: 'real parts' }, { value: 'im', label: 'imaginary parts' }], 're');
        const once = v.toggle('count each distinct eigenvalue once (break)', false);
        const E = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.8, minWidth: 240 });
        const S = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, weight: 1.25, minWidth: 300, title: 'multiplying the eigenvalues one at a time' });
        const TT = v.table(E, { rows: 3, cols: 3, region: [0.04, 0.24, 0.96, 0.86], maxCell: 70, size: 14 });
        editable(E, TT, { bump: (i, j, k) => { const p = part.value === 'im' ? 1 : 0; A[i][j] = A[i][j].slice(); A[i][j][p] = M.clamp(A[i][j][p] + k, -9, 9); } });
        v.render(() => {
          const qc = cCharPoly(A), cl = polishClusters(clusterEig(M.eigC(A, { vectors: false }).values), qc);
          const fac = once.value ? cl.map((e) => e.lam) : cl.flatMap((e) => Array(e.m).fill(e.lam));
          const pp = [[1, 0]]; for (const z of fac) pp.push(cmul(pp[pp.length - 1], z));
          const dA = cDet(A), prod = pp[pp.length - 1], ok = cabs(csub(prod, dA)) <= 1e-7 * (1 + cabs(dA));
          // window: everything visible, origin included
          const ext = Math.max(1.2, ...[...cl.map((e) => e.lam), ...pp, dA].map((z) => Math.max(Math.abs(z[0]), Math.abs(z[1]) / 0.8)));
          const Rv = nice(1.3 * ext), key = String(Rv);
          if (key !== view) { view = key; S.setView([-Rv, Rv], [-0.8 * Rv, 0.8 * Rv]); }
          S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          fac.forEach((z, k) => {
            const c = EC[k % EC.length], P0 = pp[k], P1 = pp[k + 1];
            S.poly([[0, 0], [1, 0], z], { color: c, width: 1.3, dash: [4, 4], fill: c, fillAlpha: 0.04 });
            S.poly([[0, 0], P0, P1], { color: c, width: 1.2, fill: c, fillAlpha: 0.16 });
          });
          for (let k = 0; k + 1 < pp.length; k++) S.arrow(pp[k][0], pp[k][1], pp[k + 1][0], pp[k + 1][1], { color: 'gold', width: 2.6 });
          S.dot(dA[0], dA[1], { r: 12, hollow: true, color: 'green', width: 2.8 });
          S.text(`det A = ${cpn(dA, 2)}`, dA[0], dA[1], { dy: dA[1] >= 0 ? -25 : 25, align: 'center', color: 'green', weight: 700, size: 12.5 });
          pp.forEach((p, k) => S.dot(p[0], p[1], { r: 4.5, color: 'gold', label: k === 0 ? '1' : k > 1 && k < pp.length - 1 ? `P${sub(k)}` : null, labelPos: k === 0 ? 'se' : 'nw' }));
          cl.forEach((e) => {
            S.dot(e.lam[0], e.lam[1], { r: 8, hollow: true, color: 'accent', width: 2.4 });
            S.text(`${cpn(e.lam, 2)}${e.m > 1 ? ` (×${e.m})` : ''}`, e.lam[0], e.lam[1], { dy: -17, align: 'center', color: 'accent', size: 12, weight: 600 });
          });
          S.corner(ok ? 'product of eigenvalues = det A' : 'product ≠ det A', 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          TT.draw({ value: (i, j) => cpn(A[i][j], 0), fill: (i, j) => (i === j ? ['gold', 0.14] : null) });
          ttl(E, TT, 'A', 'ink', false, 17);
          E.texPx(part.value === 'im' ? '\\text{clicks change imaginary parts}' : '\\text{clicks change real parts}', E.width / 2, E.height - 22, { color: 'muted', size: 13 });
          st = { cl, fac, prod, dA, ok };
        });
        v.legend([['accent', 'eigenvalue', { dot: true }], ['gold', 'partial products $P_k$'], ['green', '$\\det A$ (row reduction)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { cl, fac, prod, dA, ok } = st, rep = cl.some((e) => e.m > 1);
          const list = fac.map((z) => `(${ctn(z, 3)})`).join('');
          if (once.value && rep) return `Each distinct eigenvalue once: $${list} = ${ctn(prod, 3)}$, but $\\det A = ${ctn(dA, 3)}$. **The multiplicities are needed.**`;
          return `$\\det A = ${ctn(dA, 4)}$ (row reduction) and $${list} = ${ctn(prod, 4)}$ ${ok ? '— equal' : '— not equal'}${rep ? ', the repeated eigenvalue counted with its multiplicity' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.56
    {
      num: '9.56',
      kind: 'Theorem',
      name: 'Determinant of transpose, dual or adjoint',
      statement: String.raw`(a) If $A$ is a square matrix, then $\det A^{\mathrm t} = \det A$.

(b) If $T \in \mathcal L(V)$, then the dual map satisfies $\det T' = \det T$.

(c) If $V$ is an inner product space and $T \in \mathcal L(V)$, then $\det(T^*) = \overline{\det T}$.`,
      idea: String.raw`(a) The function $\alpha(v_1, \dots, v_n) = \det\big((v_1 \ \cdots \ v_n)^{\mathrm t}\big)$, the determinant of the matrix with *rows* $v_1, \dots, v_n$, is $n$-linear by the formula 9.46. It is alternating: two equal rows make a matrix non-invertible. It also takes the value $1$ on the standard basis. Since the alternating $n$-forms on $\mathbf F^n$ form a $1$-dimensional space (9.37), $\alpha$ is the determinant of the matrix with columns $v_1, \dots, v_n$. (b) The matrix of $T'$ is the transpose of the matrix of $T$ (3.132), so (a) and 9.53 apply. (c) In an orthonormal basis the matrix of $T^*$ is the conjugate transpose of that of $T$ (7.9). Conjugating every entry conjugates the formula 9.46, and transposing changes nothing by (a).`,
      caption: String.raw`Left: the parallelepiped spanned by the columns $c_1, c_2, c_3$ of a real $3$-by-$3$ matrix $A$. Right: the one spanned by its rows $r_1, r_2, r_3$. Drag any of the six vectors (drag the background to rotate). The other panel updates, since moving a column moves one entry of every row. The two solids look nothing alike, but their signed volumes $\det A$ and $\det A^{\mathrm t}$ always agree. Bottom: the slider gives $A$ an imaginary part, making the complex matrix $C = A + i\varphi B$. Then $\det C^{\mathrm t}$ (orange ring) still sits on $\det C$, but $\det C^*$ (green) is its mirror image in the real axis. Forgetting the conjugation in the adjoint gives the wrong answer.`,
      deps: ['ladr-9.46', 'ladr-9.37', 'ladr-9.53', 'ladr-3.132', 'ladr-7.9'],
      tags: ['determinants'],
      viz(v) {
        const M = v.M;
        const PRE = { gen: [[1.2, 0.4, 0.2], [-0.3, 1.0, 0.6], [0.5, -0.4, 0.9]], neg: [[0.3, 1.1, 0.2], [1.2, 0.2, -0.3], [0.1, 0.4, 1.0]], flat: [[1.0, 0.2, 1.2], [0.2, 1.0, 1.2], [-0.4, 0.6, 0.2]] };
        const Bm = [[0, 1, -1], [1, 0.5, 0], [-0.5, 1, 0.3]];
        let A = clone(PRE.gen);
        const SC = v.stage({ x: [-2, 2], y: [-1.4, 2.4], equal: true, axes: false, height: 320, minWidth: 270, title: 'columns of $A$' });
        const SR = v.stage({ x: [-2, 2], y: [-1.4, 2.4], equal: true, axes: false, height: 320, minWidth: 270, title: 'rows of $A$ (the columns of $A^{\\mathrm t}$)' });
        const Z = v.stage({ x: [-3, 3], y: [-1, 1], equal: true, height: 190, full: true, title: 'a complex matrix $C = A + i\\varphi B$: $\\det C$, $\\det C^{\\mathrm t}$ and $\\det C^*$ in $\\mathbf C$' });
        const sc = v.scene3(SC, { yaw: 0.65, pitch: 0.32, axis: 1.5, lim: 1.6 }), sr = v.scene3(SR, { yaw: 0.65, pitch: 0.32, axis: 1.5, lim: 1.6 });
        const CC = ['blue', 'pink', 'teal'], RC = ['orange', 'purple', 'gold'];
        const col = (k) => A.map((r) => r[k]);
        let CH = [], RH = [];
        CH = [0, 1, 2].map((k) => sc.handle(col(k), { color: CC[k], label: `$c_${k + 1}$`, onDrag: (H) => { H.p.forEach((x, i) => { A[i][k] = x; }); RH.forEach((h, i) => { h.p = A[i].slice(); }); } }));
        RH = [0, 1, 2].map((i) => sr.handle(A[i].slice(), { color: RC[i], label: `$r_${i + 1}$`, onDrag: (H) => { A[i] = H.p.slice(); CH.forEach((h, k) => { h.p = col(k); }); } }));
        const setA = (B) => { A = clone(B); CH.forEach((h, k) => h.set(col(k))); RH.forEach((h, i) => h.set(A[i])); };
        v.select('', [{ value: 'gen', label: '$\\det A > 0$' }, { value: 'neg', label: '$\\det A < 0$' }, { value: 'flat', label: 'singular' }], 'gen', { onChange: (k) => setA(PRE[k]) });
        const phi = v.slider('imaginary part $\\varphi$', 0, 1.5, 0.6, { step: 0.01 });
        let view = '', st = null;
        v.render(() => {
          const d = M.det(A), dt = M.det(transp(A));
          sc.begin(); ppiped(sc, col(0), col(1), col(2), { color: d >= 0 ? 'blue' : 'red' }); CH.forEach((h, k) => sc.arrow([0, 0, 0], h.p, { color: CC[k], width: 2.6 })); sc.flush();
          sr.begin(); ppiped(sr, A[0], A[1], A[2], { color: dt >= 0 ? 'orange' : 'red' }); RH.forEach((h, i) => sr.arrow([0, 0, 0], h.p, { color: RC[i], width: 2.6 })); sr.flush();
          SC.corner(`det A = ${pn(d, 4)}`, 'tl', { color: d >= 0 ? 'blue' : 'red', weight: 700 });
          SR.corner(`det Aᵗ = ${pn(dt, 4)}`, 'tl', { color: dt >= 0 ? 'orange' : 'red', weight: 700 });
          // complex part
          const Ac = A.map((r, i) => r.map((x, j) => [x, phi.value * Bm[i][j]])), z = cDet(Ac), zt = cDet(cT(Ac)), zs = cDet(cH(Ac));
          const ext = Math.max(0.6, ...[z, zt, zs].map((w) => Math.max(Math.abs(w[0]), Math.abs(w[1]) * 3.2))), Rv = nice(1.25 * ext), key = String(Rv);
          if (key !== view) { view = key; Z.setView([-Rv, Rv], [-Rv / 3.4, Rv / 3.4]); }
          Z.line(z[0], z[1], zs[0], zs[1], { color: 'muted', width: 1.2, dash: [3, 4] });
          Z.dot(zt[0], zt[1], { r: 11, hollow: true, color: 'orange', width: 2.4 });
          Z.dot(z[0], z[1], { r: 6, color: 'blue' });
          Z.dot(zs[0], zs[1], { r: 6, color: 'green' });
          Z.text(`det C = det Cᵗ = ${cpn(z, 3)}`, z[0], z[1], { dx: 16, color: 'blue', size: 12.5, weight: 600 });
          Z.text(`det C* = ${cpn(zs, 3)}`, zs[0], zs[1], { dx: 16, color: 'green', size: 12.5, weight: 600 });
          st = { d, dt, z, zt, zs };
        });
        v.legend([['blue', 'columns, $\\det A$'], ['orange', 'rows, $\\det A^{\\mathrm t}$'], ['green', '$\\det C^*$', { dot: true }], ['red', 'negative orientation']]);
        v.readout(() => {
          if (!st) return '';
          const { d, dt, z, zt, zs } = st;
          return `Real $A$: $\\det A = ${tn(d, 6)}$ and $\\det A^{\\mathrm t} = ${tn(dt, 6)}$. Complex $C = A + i\\varphi B$: $\\det C = ${ctn(z, 4)}$, $\\det C^{\\mathrm t} = ${ctn(zt, 4)}$, and $\\det C^* = ${ctn(zs, 4)} = \\overline{\\det C}$${Math.abs(z[1]) > 1e-9 ? ' — not $\\det C$, so the conjugation in the adjoint matters' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.57
    {
      num: '9.57',
      kind: 'Theorem',
      name: 'Helpful results in evaluating determinants',
      statement: String.raw`Let $A$ be a square matrix.

(a) If two columns of $A$ are equal, or two rows are equal, then $\det A = 0$.

(b) Swapping two columns or two rows changes the sign of the determinant.

(c) Multiplying one column or one row by a scalar multiplies the determinant by that scalar.

(d) Adding a scalar multiple of one column to a *different* column does not change the determinant.

(e) Adding a scalar multiple of one row to a *different* row does not change the determinant.`,
      idea: String.raw`Both $(v_1, \dots, v_n) \mapsto \det(v_1 \ \cdots \ v_n)$ (columns) and $(v_1, \dots, v_n) \mapsto \det(v_1 \ \cdots \ v_n)^{\mathrm t}$ (rows) are alternating $n$-linear forms (9.45, 9.56). Then (a) is the alternating property, (b) is 9.30, and (c) is linearity in one slot. For (d), linearity in the first slot gives $\det(v_1 + cv_2, v_2, \dots) = \det(v_1, v_2, \dots) + c\det(v_2, v_2, \dots)$, and the last term is $0$ by (a). This is why Gaussian elimination computes determinants: reduce to triangular form while recording the swaps and scalings, then multiply the diagonal (9.48).`,
      caption: String.raw`Choose an operation, whether it acts on rows or columns, the pair $(i, j)$ (line $i$ is changed, using line $j$) and $k$, then press *apply*. *Next elimination step* runs Gaussian elimination one row operation at a time. The ledger lists each operation with the factor it multiplies the determinant by. The right panel shows the parallelepiped of the columns, with the previous one dashed. Adding a multiple of one column to another shears the solid without changing its volume. A row operation applies the same shear to the whole space. A swap flips the orientation, and a scaling stretches. The pair $(1, 1)$, adding a multiple of a line to *itself*, breaks hypothesis (d)/(e): it is really a scaling by $1 + k$.`,
      deps: ['ladr-9.45', 'ladr-9.56'],
      tags: ['determinants'],
      viz(v) {
        const M = v.M;
        const A0 = [[2, 1, 0], [0, 2, 1], [1, 0, 2]];
        let A = clone(A0), hist = [], log = [], ghost = null;
        const op = v.select('operation', [{ value: 'add', label: 'line $i$ += $k \\times$ line $j$' }, { value: 'swap', label: 'swap lines $i, j$' }, { value: 'scale', label: 'line $i$ $\\times$= $k$' }], 'add');
        const rc = v.select('lines', [{ value: 'r', label: 'rows' }, { value: 'c', label: 'columns' }], 'r');
        const PAIRS = [[2, 0], [1, 0], [2, 1], [0, 1], [0, 2], [1, 2], [0, 0]];
        const pair = v.select('$(i, j)$', PAIRS.map(([i, j], q) => ({ value: q, label: `$(${i + 1}, ${j + 1})$` })), 0);
        const kS = v.slider('$k$', -3, 3, -2, { step: 0.5 });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 260 });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2, 2.4], equal: true, axes: false, height: 340, minWidth: 280, title: 'parallelepiped of the columns' });
        const sc = v.scene3(S, { yaw: 0.7, pitch: 0.3, axis: 1.8, lim: 2.2, axes: false });
        const TB = v.table(L, { rows: 3, cols: 3, region: [0.02, 0.4, 0.46, 0.86], maxCell: 46, size: 13.5 });
        const get = (B, r, t) => (r === 'r' ? B[t].slice() : B.map((row) => row[t]));
        const put = (B, r, t, x) => { if (r === 'r') B[t] = x; else B.forEach((row, q) => { row[t] = x[q]; }); };
        const doOp = (o, r, i, j, k) => {
          const B = clone(A), N = r === 'r' ? 'R' : 'C'; let f = 1, name;
          if (o === 'swap') { if (i === j) return; const x = get(B, r, i); put(B, r, i, get(B, r, j)); put(B, r, j, x); f = -1; name = `${N}_${i + 1} \\leftrightarrow ${N}_${j + 1}`; }
          else if (o === 'scale') { put(B, r, i, get(B, r, i).map((x) => k * x)); f = k; name = `${N}_${i + 1} \\to ${tn(k, 3)}\\,${N}_${i + 1}`; }
          else { const y = get(B, r, j); put(B, r, i, get(B, r, i).map((x, q) => x + k * y[q])); f = i === j ? 1 + k : 1; name = `${N}_${i + 1} \\to ${N}_${i + 1} ${k < 0 ? '-' : '+'} ${tn(Math.abs(k), 3)}\\,${N}_${j + 1}`; }
          hist.push({ A, ghost }); ghost = A; A = B.map((row) => row.map((x) => (Math.abs(x) < 1e-12 ? 0 : x))); log.push({ name, f, bad: o === 'add' && i === j });
        };
        v.button('apply', () => { const [i, j] = PAIRS[pair.value]; doOp(op.value, rc.value, i, j, kS.value); });
        const elimStep = () => {
          for (let c = 0; c < 3; c++) {
            if (Math.abs(A[c][c]) < 1e-12) { for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > 1e-12) { doOp('swap', 'r', c, r, 0); return; } continue; }
            for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > 1e-12) { doOp('add', 'r', r, c, -A[r][c] / A[c][c]); return; }
          }
        };
        v.button('next elimination step', elimStep);
        v.button('undo', () => { if (hist.length) { const h = hist.pop(); A = h.A; ghost = h.ghost; log.pop(); } });
        v.button('reset', () => { A = clone(A0); hist = []; log = []; ghost = null; });
        doOp('swap', 'c', 0, 2, 0); elimStep(); // start with a column swap and a row swap (the first elimination step) in the ledger
        let st = null;
        v.render(() => {
          const [pi, pj] = PAIRS[pair.value], o = op.value, r = rc.value;
          const F = log.reduce((s, e) => s * e.f, 1), d0 = M.det(A0), d = M.det(A), pred = F * d0, ok = Math.abs(d - pred) < 1e-9 * (1 + Math.abs(d));
          const tri = A.every((row, i) => row.every((x, j) => j >= i || Math.abs(x) < 1e-12));
          // the table, with the pending operation previewed
          const on = (i, j, t) => (r === 'r' ? i === t : j === t);
          TB.draw({
            value: (i, j) => pn(A[i][j], 2),
            fill: (i, j) => (on(i, j, pi) ? ['gold', 0.3] : o !== 'scale' && on(i, j, pj) ? ['teal', 0.22] : tri && i === j ? ['green', 0.16] : null),
          });
          ttl(L, TB, `A_{${log.length}}`, 'ink', false, 16);
          const g = TB.geo, pf = o === 'swap' ? (pi === pj ? 1 : -1) : o === 'scale' ? kS.value : pi === pj ? 1 + kS.value : 1;
          L.texPx(`\\text{pending: } \\det \\times ${tn(pf, 3)}`, g.X0 + 1.5 * g.cw, g.Y0 + 3 * g.ch + 18, { size: 13, color: o === 'add' && pi === pj ? 'red' : 'muted' });
          const X1 = g.X0 + 3 * g.cw + 18;
          L.textPx('ledger (factor on det)', X1, 26, { size: 12, color: 'muted', weight: 600 });
          const shown = log.slice(-8), off = log.length - shown.length;
          if (!shown.length) L.textPx('no operations yet', X1, 50, { size: 12, color: 'faint' });
          shown.forEach((e, q) => L.texPx(`${off + q + 1}.\\ ${e.name}: \\ \\times ${tn(e.f, 3)}`, X1, 50 + q * 23, { size: 12.5, align: 'left', color: e.bad ? 'red' : e.f === 1 ? 'muted' : 'ink' }));
          L.texPx(log.length ? `\\det A_{${log.length}} = ${tn(F, 3)} \\cdot \\det A_0 = ${tn(pred, 3)}` : `\\det A_0 = ${tn(d0, 3)}`, L.width / 2, L.height - 18, { size: 14, color: ok ? 'green' : 'red' });
          // the columns' parallelepiped
          const cols = [0, 1, 2].map((k) => A.map((row) => row[k])), gcols = ghost ? [0, 1, 2].map((k) => ghost.map((row) => row[k])) : null;
          // drawn centred on the current solid (its corner is the origin of the columns), at a common scale
          const ctr = scl(add(add(cols[0], cols[1]), cols[2]), 0.5);
          const verts = (c) => [[0, 0, 0], c[0], c[1], c[2], add(c[0], c[1]), add(c[0], c[2]), add(c[1], c[2]), add(add(c[0], c[1]), c[2])].map((p) => subv(p, ctr));
          const m = Math.max(0.5, ...verts(cols).map(len), ...(gcols ? verts(gcols).map(len) : [])), s = 1.9 / m;
          const P = (p) => scl(subv(p, ctr), s), O = P([0, 0, 0]);
          sc.begin();
          if (gcols) ppEdges(sc, ...gcols.map((c) => scl(c, s)), {}, O); // the earlier solid, from the same corner
          ppiped(sc, ...cols.map((c) => scl(c, s)), { color: d >= 0 ? 'blue' : 'red', fillAlpha: 0.12 }, O);
          cols.forEach((c, k) => sc.arrow(O, P(c), { color: ['blue', 'pink', 'teal'][k], width: 2.4 }));
          cols.forEach((c, k) => sc.tex(`c_${k + 1}`, add(O, scl(c, s * 1.1)), { color: ['blue', 'pink', 'teal'][k], size: 13 }));
          sc.dot(O, { r: 3.5, color: 'ink' });
          sc.flush();
          S.corner(`det = ${pn(d, 3)}${tri ? ' (triangular)' : ''}`, 'tl', { color: d >= 0 ? 'blue' : 'red', weight: 700 });
          S.corner(`drawn at scale ${pn(s, 2)}`, 'bl', { color: 'faint', size: 11 });
          st = { F, d0, d, pred, ok, tri, diag: A.map((row, i) => row[i]), last: log[log.length - 1] };
        });
        v.legend([['gold', 'line $i$ (changed)', { area: true }], ['teal', 'line $j$ (used)', { area: true }], ['blue', 'columns, $\\det > 0$'], ['red', '$\\det < 0$ / hypothesis broken']]);
        v.readout(() => {
          if (!st) return '';
          const { F, d0, d, pred, ok, tri, diag, last } = st;
          const tail = tri ? ` The matrix is now upper triangular, so $\\det A_{\\text{now}} = ${diag.map((x) => `(${tn(x, 3)})`).join('')} = ${tn(d, 4)}$ and $\\det A_0 = ${tn(d, 4)} / ${tn(F, 4)} = ${tn(d / F, 4)}$.` : '';
          const warn = last && last.bad ? ' The last step added a multiple of a line to **itself** — not allowed by (d)/(e); it scaled the determinant.' : '';
          return `$\\det A_0 = ${tn(d0, 4)}$. The factors in the ledger multiply to $${tn(F, 4)}$, so the rules predict $\\det A_{\\text{now}} = ${tn(pred, 4)}$; computed directly: $${tn(d, 4)}$${ok ? ' ✓' : ''}.${warn}${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.58
    {
      num: '9.58',
      kind: 'Theorem',
      name: 'Unitary operators have |det| = 1',
      statement: String.raw`Suppose $V$ is an inner product space and $S \in \mathcal L(V)$ is unitary. Then $|\det S| = 1$. In particular, a unitary matrix has a determinant on the unit circle, and a real orthogonal matrix has determinant $\pm 1$.`,
      idea: String.raw`Unitary means $S^*S = I$ (7.53). Taking determinants and using multiplicativity (9.49) and $\det S^* = \overline{\det S}$ (9.56) gives
$$1 = \det(S^*S) = \overline{\det S}\,\det S = |\det S|^2.$$
Over $\mathbf C$ there is a second view: every eigenvalue of a unitary operator has absolute value $1$ (7.54), and $\det S$ is their product (9.55). The argument above needs no eigenvalues, so it works over $\mathbf R$ as well.`,
      caption: String.raw`Each dot is $\det S$ for one random unitary $n$-by-$n$ matrix $S$, made by Gram–Schmidt from a random complex matrix. They all land on the unit circle, and the histogram of $|\det S|$ on the right is a single spike at $1$. Choose $n$, or switch to $\mathbf R$: orthogonal matrices have determinant $\pm 1$ only. Click a dot to see that matrix's eigenvalues (purple, also on the circle) and $\overline{\det S}$ (mirror ring), whose product with $\det S$ is $\det(S^*S) = 1$. To break unitarity, raise $\varepsilon$, which replaces $S$ by $S + \varepsilon G$ for a random $G$: the dots leave the circle.`,
      deps: ['ladr-7.53', 'ladr-9.49', 'ladr-9.56'],
      see: ['ladr-7.54'],
      tags: ['determinants', 'isometries'],
      viz(v) {
        const M = v.M;
        const N = 300;
        const S = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 340, weight: 1.3, minWidth: 290, ticks: false, title: '$\\det S$ for random $S$' });
        const H = v.stage({ x: [0, 2], y: [0, 1], height: 340, minWidth: 220, axes: 'box', xlabel: '|det S|', title: 'histogram of $|\\det S|$', yticks: [] });
        const nS = v.select('$n$', [2, 3, 4, 8], 3);
        const fld = v.select('field', [{ value: 'C', label: '$\\mathbf C$: unitary' }, { value: 'R', label: '$\\mathbf R$: orthogonal' }], 'C');
        const eps = v.slider('perturbation $\\varepsilon$ (break unitarity)', 0, 0.5, 0, { step: 0.01 });
        let seed = 7, cache = null, sel = 0, st = null;
        v.button('resample', () => { seed++; cache = null; });
        const samples = () => {
          const key = `${nS.value}|${fld.value}|${seed}`;
          if (cache && cache.key === key) return cache.list;
          const r = v.rng(seed * 101 + nS.value), n = nS.value, re = fld.value === 'R', list = [];
          const g = () => (re ? [r.normal(), 0] : [r.normal(), r.normal()]);
          for (let s = 0; s < N; s++) {
            const Q = cOrthCols(Array.from({ length: n }, () => Array.from({ length: n }, g)));
            const G = Array.from({ length: n }, () => Array.from({ length: n }, () => cscl(g(), 1 / Math.sqrt(n))));
            list.push({ Q, G });
          }
          cache = { key, list };
          return list;
        };
        S.onClick((x, y) => { if (!st) return; let b = 0, bd = Infinity; st.ds.forEach((z, k) => { const dd = Math.hypot(S.X(z[0]) - S.X(x), S.Y(z[1]) - S.Y(y)); if (dd < bd) { bd = dd; b = k; } }); if (bd < 20) sel = b; });
        v.render(() => {
          const list = samples(), e = eps.value, n = nS.value;
          const mats = list.map(({ Q, G }) => (e ? Q.map((row, i) => row.map((z, j) => cadd(z, cscl(G[i][j], e)))) : Q));
          const ds = mats.map(cDet), ab = ds.map(cabs);
          S.circle(0, 0, 1, { color: 'green', width: 2.2 });
          S.text('1', 1, 0, { dx: 10, dy: 10, color: 'muted', size: 12 }); S.text('i', 0, 1, { dx: 8, dy: -10, color: 'muted', size: 12, math: true });
          S.dots(ds, { r: 2.6, color: 'accent', alpha: 0.55 });
          sel = Math.min(sel, ds.length - 1);
          const Ssel = mats[sel], z = ds[sel], ev = M.eigC(Ssel, { vectors: false }).values.map(toC);
          ev.forEach((w) => S.dot(w[0], w[1], { r: 4, color: 'purple' }));
          S.line(z[0], z[1], z[0], -z[1], { color: 'muted', width: 1, dash: [3, 4] });
          S.dot(z[0], -z[1], { r: 7, hollow: true, color: 'gold', width: 2 });
          S.dot(z[0], z[1], { r: 7, color: 'gold' });
          S.text('det S', z[0], z[1], { dx: 12, dy: -10, color: 'gold', weight: 700, size: 12.5 });
          S.corner(e ? `ε = ${pn(e, 2)}: not unitary` : 'all on the unit circle', 'tl', { color: e ? 'red' : 'green', weight: 700 });
          // histogram of |det|
          const top = Math.max(2, Math.ceil(Math.max(...ab) * 2) / 2);
          const hst = M.histogram(ab, { bins: Math.round(top / 0.05) + 1, range: [-0.025, top + 0.025] }), hmax = Math.max(...hst.counts);
          H.setView([0, top], [0, hmax * 1.12]);
          H.vline(1, { color: 'green', width: 1.6, dash: [5, 4] });
          H.hist({ edges: hst.edges, counts: hst.counts }, { color: e ? 'red' : 'accent', fillAlpha: 0.35 });
          // the selected matrix: ‖S*S − I‖
          const SS = cMul(cH(Ssel), Ssel), dev = cMax(SS.map((row, i) => row.map((w, j) => csub(w, i === j ? [1, 0] : [0, 0]))));
          st = { ds, max: Math.max(...ab.map((x) => Math.abs(x - 1))), z, dev, n, ev, e, re: fld.value === 'R' };
        });
        v.legend([['accent', '$\\det S$ of each sample', { dot: true }], ['gold', 'selected $\\det S$ and $\\overline{\\det S}$', { dot: true }], ['purple', 'its eigenvalues', { dot: true }], ['green', 'unit circle']]);
        v.readout(() => {
          if (!st) return '';
          const { max, z, dev, n, e, re } = st, a = cabs(z);
          const head = `Over ${N} samples, $\\max\\big|\\,|\\det S| - 1\\big| = ${v.sci(Math.max(max, 1e-17), 1)}$.`;
          if (e) return `${head} With $\\varepsilon = ${tn(e, 2)}$ the matrices are no longer unitary ($\\|S^*S - I\\|_{\\max} = ${tn(dev, 3)}$ for the selected one), and $|\\det S| = ${tn(a, 4)}$.`;
          return `${head} Selected: $\\det S = ${ctn(z, 4)}$, $\\overline{\\det S}\\cdot\\det S = ${tn(a * a, 12)} = \\det(S^*S)$; its ${n} eigenvalues all have modulus $1$ too.${re ? ` Over $\\mathbf R$ the determinant can only be $\\pm 1$: here ${st.ds.filter((w) => w[0] > 0).length} samples have $+1$ and ${st.ds.filter((w) => w[0] < 0).length} have $-1$.` : ''}`;
        });
      },
    },
  ],
};
