// Linear Algebra Done Right — Chapter 7: Operators on Inner Product Spaces
// Part 3 (7.56–7.82): unitary matrices, the QR and Cholesky factorizations, positive definite matrices, the
// operator T*T and singular values, the singular value decomposition (for maps and for matrices), the adjoint
// and the pseudoinverse read off from an SVD, and the bound ‖Tv‖ ≤ s₁‖v‖. Parts 1, 2, 4: ch07.js, ch07-b.js, ch07-d.js.

// ---------- shared helpers ----------
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
/** Fixed decimals for canvas text (real minus sign). */
const pf = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
/** TeX for a real matrix (array of rows). */
const mtex = (A, d = 2) => `\\begin{bmatrix}${A.map((r) => r.map((x) => tn(x, d)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
/** TeX for a vector as a tuple. */
const vtex = (a, d = 2) => `(${a.map((x) => tn(x, d)).join(', ')})`;
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scl = (a, k) => a.map((x) => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a) => Math.hypot(...a);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scl(a, 1 / l) : a.map(() => 0); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const perp = (a) => [-a[1], a[0]];
const ZERO = [0, 0, 0];
const mv = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
const fromCols = (cs) => cs[0].map((_, i) => cs.map((c) => c[i]));
const tr = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const msub = (A, B) => A.map((r, i) => r.map((x, j) => x - B[i][j]));
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const maxAbs = (A) => Math.max(0, ...A.flat().map(Math.abs));
const rot = (t) => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
const smooth = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const uAt = (t) => [Math.cos(t), Math.sin(t)];
/** Eigen-data of the symmetric matrix [[a, b], [b, d]]: eigenvalues l[0] ≥ l[1], unit eigenvector u for l[0]. */
function sym2(a, b, d) {
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), t = 0.5 * Math.atan2(2 * b, a - d);
  return { l: [m + r, m - r], u: [Math.cos(t), Math.sin(t)] };
}
/**
 * SVD of a real 2×2 matrix from the eigenvectors of AᵀA (as in the proof of 7.70): A = s₁f₁e₁ᵀ + s₂f₂e₂ᵀ with
 * e₂ = perp(e₁), so (e₁, e₂) is a rotated frame; f₂ is perp(f₁) up to sign when s₂ = 0.
 */
function svd22(A) {
  const [[a, b], [c, d]] = A, det = a * d - b * c;
  const E = sym2(a * a + c * c, a * b + c * d, b * b + d * d);
  const s1 = Math.sqrt(Math.max(0, E.l[0])), s2 = s1 > 1e-12 ? Math.abs(det) / s1 : 0;
  const e1 = E.u, e2 = perp(e1);
  const f1 = s1 > 1e-12 ? unit(mv(A, e1)) : [1, 0];
  const f2 = s2 > 1e-9 * Math.max(1, s1) ? unit(mv(A, e2)) : perp(f1);
  return { s: [s1, s2], e: [e1, e2], f: [f1, f2], det };
}
/** Draggable images T(1,0), T(0,1) of the standard basis, i.e. the columns of a 2×2 matrix (snapped to a grid). */
function colHandles(S, A0, o = {}) {
  const g = o.grid ?? 0.1;
  const snap = (x, y) => [Math.round(x / g) * g, Math.round(y / g) * g];
  const h1 = S.handle(A0[0][0], A0[1][0], { color: 'teal', label: o.l1 ?? 'T(1,0)', constrain: o.c1 ?? snap });
  const h2 = S.handle(A0[0][1], A0[1][1], { color: 'pink', label: o.l2 ?? 'T(0,1)', constrain: o.c2 ?? snap });
  return { h1, h2, get A() { return [[h1.x, h2.x], [h1.y, h2.y]]; }, set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); } };
}
/** The image of the circle of radius r under a 2×2 matrix A, as a closed polyline. */
const ellPts = (A, r = 1, n = 160) => Array.from({ length: n + 1 }, (_, k) => mv(A, [r * Math.cos((TAU * k) / n), r * Math.sin((TAU * k) / n)]));
/** A small right-angle mark at the origin between the directions a and b (2D). */
function rightMark(S, a, b, r = 0.16, color = 'green', at = [0, 0]) {
  const u = scl(unit(a), r), w = scl(unit(b), r);
  S.path([add(at, u), add(at, add(u, w)), add(at, w)], { color, width: 1.4 });
}
/** Gram–Schmidt (with re-orthogonalization) on a list of vectors; null for a vector already in the span. */
function gsList(vs) {
  const E = [];
  for (const x of vs) {
    let w = x.slice();
    for (let p = 0; p < 2; p++) for (const e of E) if (e) w = sub(w, scl(e, dot(w, e)));
    E.push(len(w) > 1e-9 * Math.max(1, len(x)) ? unit(w) : null);
  }
  return E;
}
/** Rotation of R³ by angle t about the axis u (Rodrigues), as a matrix. */
function rot3(u, t) {
  const [x, y, z] = unit(u), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
const colsOf = (A) => A[0].map((_, j) => A.map((r) => r[j]));
// ---------- 3D helpers (for v.scene3) ----------
/** Faces of the parallelepiped spanned by a, b, c. */
function pped(sc, a, b, c, st) {
  const O = ZERO, ab = add(a, b), ac = add(a, c), bc = add(b, c), abc = add(ab, c);
  for (const f of [[O, a, ab, b], [c, ac, abc, bc], [O, a, ac, c], [b, ab, abc, bc], [O, b, bc, c], [a, ab, abc, ac]]) sc.poly(f, st);
}
/** Three faint great circles of the sphere of radius r. */
function sphereWire(sc, r = 1, st = {}) {
  for (const [a, b] of [[[1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, 0, 1]], [[0, 1, 0], [0, 0, 1]]]) {
    const pts = []; for (let k = 0; k <= 72; k++) { const t = (TAU * k) / 72; pts.push(add(scl(a, r * Math.cos(t)), scl(b, r * Math.sin(t)))); }
    sc.path(pts, { color: 'faint', width: 1, alpha: 0.8, ...st });
  }
}
/** A right-angle mark between the directions a and b in R³. */
function rightMark3(sc, a, b, r = 0.17, color = 'green') {
  const u = scl(unit(a), r), w = scl(unit(b), r);
  sc.path([u, add(u, w), w], { color, width: 1.6, alpha: 0.9 });
}
/** The filled ellipse {cos t·a + sin t·b} in R³ (a, b its conjugate semi-axes). */
function ellPoly3(sc, a, b, st, c = ZERO) {
  const pts = []; for (let k = 0; k < 64; k++) { const t = (TAU * k) / 64; pts.push(add(c, add(scl(a, Math.cos(t)), scl(b, Math.sin(t))))); }
  sc.poly(pts, st);
}
/** Images under T (3 columns, values in R³ or R² drawn in the plane z = 0) of meridians and parallels of the unit sphere. */
function sphereImage(sc, T, st) {
  const emb = (w) => (w.length === 3 ? w : [w[0], w[1], 0]);
  const cs = [];
  for (let m = 0; m < 3; m++) { const ph = (m * Math.PI) / 3; cs.push((t) => [Math.cos(t) * Math.cos(ph), Math.cos(t) * Math.sin(ph), Math.sin(t)]); }
  for (const z of [-0.6, 0, 0.6]) { const r = Math.sqrt(1 - z * z); cs.push((t) => [r * Math.cos(t), r * Math.sin(t), z]); }
  for (const c of cs) { const pts = []; for (let k = 0; k <= 48; k++) pts.push(emb(mv(T, c((TAU * k) / 48)))); sc.path(pts, st); }
}
/** An RGBA pixel of a palette colour with the given opacity (0–1), for rasters drawn over the panel. */
const rgba = (v, name, a) => { const c = v.rgb(name); return [c[0], c[1], c[2], Math.round(255 * Math.min(1, Math.max(0, a)))]; };

// ---------- pictures for 7.80 (60 × 80 grey-scale images, values in [0, 1]) ----------
const IMG_P = 60, IMG_N = 80;
function landscape(x, y) {
  const hor = 38;
  if (y > hor) { // a lake reflecting the scene, with ripples
    const yy = 2 * hor - y, xx = x + 1.2 * Math.sin(y * 1.9);
    return 0.1 + 0.55 * landscape(Math.min(79.9, Math.max(0, xx)), Math.max(0, yy)) + 0.05 * Math.sin(y * 3.1 + x * 0.2);
  }
  if ((x - 61) ** 2 + (y - 10) ** 2 < 30) return 0.98; // the sun
  const peak = 23 + 6 * Math.sin(x / 7) + 3 * Math.sin(x / 2.7 + 1) - 10 * Math.exp(-(((x - 30) / 8) ** 2));
  const hill = 31 + 2.5 * Math.sin(x / 4.5 + 2) + 1.5 * Math.sin(x / 1.9);
  if (y > hill) return 0.22 + 0.04 * Math.sin(x * 1.3) * Math.sin(y * 2.1); // dark wooded hills
  if (y > peak) return y < peak + 3.2 && peak < 22 ? 0.93 : 0.42 + 0.12 * Math.sin((x - y) / 3); // rock and snow
  return 0.55 + 0.3 * (y / hor) + 0.04 * Math.sin(x / 9 + y / 5); // sky, brighter toward the horizon
}
function face(x, y) {
  const e = (cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
  if (y > 52 && Math.abs(x - 40) < 30 - (60 - y)) return 0.3; // shoulders
  const head = e(40, 30, 17, 22);
  if (head > 1) return 0.88 - 0.25 * (y / 60) + (Math.abs(x - 40) > 24 ? 0.04 : 0);
  if (y < 18 - 3 * Math.cos((x - 40) / 6)) return 0.16; // hair
  for (const cx of [33, 47]) { const s = e(cx, 28, 4.2, 2.6); if (s < 0.35) return 0.08; if (s < 1) return 0.97; }
  if (Math.abs(e(40, 36, 8, 5.5) - 1) < 0.28 && y > 37) return 0.22; // smile
  if (Math.abs(x - 40) < 0.9 && y > 29 && y < 35) return 0.5; // nose
  return 0.7 - 0.1 * ((x - 40) / 17); // skin, lit from the left
}
function plaid(x, y) { // an exact rank-3 tartan: (0.1 + 0.35 u(y))·1 + 1·0.35 w(x) + 0.2 u₂(y) w₂(x)
  const band = (t, p, w) => { const r = (((t % p) + p) % p) - p / 2; return Math.exp(-(r * r) / (2 * w * w)); };
  return 0.1 + 0.35 * band(y, 20, 3) + 0.35 * band(x, 16, 2.5) + 0.2 * band(y + 5, 10, 1.2) * band(x + 4, 8, 1.1);
}
const PICS = { land: landscape, face, plaid };

export default {
  collection: 'ladr',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.56
    {
      num: '7.56',
      kind: 'Definition',
      name: 'Unitary matrix',
      statement: String.raw`An $n$-by-$n$ matrix $Q$ with entries in $\mathbf F$ is called **unitary** if its columns form an orthonormal list in $\mathbf F^n$ (with the Euclidean inner product). Because an orthonormal list of length $n$ in $\mathbf F^n$ is automatically a basis, this says that the columns form an orthonormal basis of $\mathbf F^n$. Real unitary matrices are also called *orthogonal* matrices.`,
      idea: String.raw`The $k$th column of $Q$ is $Qe_k$, the image of the $k$th standard basis vector. So $Q$ is unitary exactly when the operator $x \mapsto Qx$ on $\mathbf F^n$ carries the standard orthonormal basis to an orthonormal basis — the matrix form of a unitary operator (7.51, 7.49). More generally, if $e_1, \dots, e_n$ and $f_1, \dots, f_n$ are orthonormal bases of $V$, then $S \in \mathcal L(V)$ is unitary if and only if $\mathcal M\big(S, (e_1, \dots, e_n), (f_1, \dots, f_n)\big)$ is a unitary matrix.`,
      caption: String.raw`Drag the tips of the three columns $q_1, q_2, q_3$ of a real $3$-by-$3$ matrix $Q$ (drag the background to rotate). A column snaps onto the unit sphere when its length is close to $1$, and onto the plane perpendicular to another column when it is nearly perpendicular to it. The table is the Gram matrix $Q^*Q$, whose entries are the inner products of the columns: $Q$ is unitary exactly when this is the identity, and then the box spanned by the columns is a unit cube. Try the presets, or press *Gram–Schmidt* to orthonormalize the current columns.`,
      deps: ['ladr-6.22', 'ladr-6.27'],
      see: ['ladr-7.51'],
      tags: ['isometries', 'matrices'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Unitary_matrix' },
      viz(v) {
        const S = v.stage({ x: [-1.85, 1.85], y: [-1.7, 1.9], equal: true, axes: false, height: 400, weight: 1.3, minWidth: 320 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 250, title: 'Gram matrix $Q^*Q$, entry $(j,k) = \\langle q_k, q_j\\rangle$' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.4, lim: 1.5 });
        const CC = ['blue', 'purple', 'teal'];
        const R0 = colsOf(rot3([1, 2, 1.5], 0.9));
        const PRE = {
          rot: R0,
          perm: [[0, 0, 1], [1, 0, 0], [0, -1, 0]],
          long: [R0[0], scl(R0[1], 1.3), R0[2]],
          skew: [R0[0], R0[1], unit(add(R0[2], scl(R0[0], 0.55)))],
        };
        const pre = v.select('', [{ value: 'rot', label: 'a rotation' }, { value: 'perm', label: 'signed permutation' }, { value: 'long', label: 'one column too long' }, { value: 'skew', label: 'unit columns, skewed' }], 'skew', {
          onChange: (k) => PRE[k].forEach((c, i) => H[i].set(c)),
        });
        const H = [];
        const snap = (k) => (p) => {
          let q = p.slice();
          for (let j = 0; j < 3; j++) if (j !== k && H[j]) { const u = unit(H[j].p); if (Math.abs(dot(unit(q), u)) < 0.07) q = sub(q, scl(u, dot(q, u))); }
          const L = len(q); if (L > 0 && Math.abs(L - 1) < 0.08) q = scl(q, 1 / L);
          return q;
        };
        PRE.skew.forEach((c, k) => H.push(sc.handle(c, { color: CC[k], label: `q${'₁₂₃'[k]}`, snap: snap(k) })));
        v.button('Gram–Schmidt', () => { const E = gsList(H.map((h) => h.p)); if (E.every(Boolean)) E.forEach((e, k) => H[k].set(e)); });
        const T = v.table(R, { rows: 3, cols: 3, region: [0.08, 0.34, 0.95, 0.95], maxCell: 64, size: 15, rowLabels: ['$q_1$', '$q_2$', '$q_3$'], colLabels: ['$q_1$', '$q_2$', '$q_3$'] });
        let st = null;
        v.render(() => {
          const C = H.map((h) => h.p);
          const G = [0, 1, 2].map((j) => [0, 1, 2].map((k) => dot(C[k], C[j])));
          const off = (j, k) => Math.abs(G[j][k] - (j === k ? 1 : 0));
          let worst = [0, 0], dev = 0;
          for (let j = 0; j < 3; j++) for (let k = j; k < 3; k++) if (off(j, k) > dev) { dev = off(j, k); worst = [j, k]; }
          const ok = dev < 5e-3, det = dot(C[0], cross(C[1], C[2]));
          sc.begin();
          sphereWire(sc);
          pped(sc, C[0], C[1], C[2], { fill: ok ? 'green' : 'orange', color: ok ? 'green' : 'orange', fillAlpha: 0.06, alpha: 0.45 });
          for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) if (off(a, b) < 5e-3) rightMark3(sc, C[a], C[b]);
          C.forEach((c, k) => sc.arrow(ZERO, c, { color: CC[k], width: 3.2 }));
          sc.flush();
          S.corner(ok ? 'orthonormal columns: Q is unitary' : 'columns not orthonormal: Q is not unitary', 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          T.draw({
            value: (j, k) => G[j][k], format: (x) => pf(x, 2),
            fill: (j, k) => (off(j, k) < 5e-3 ? ['green', 0.2] : ['red', Math.min(0.5, 0.12 + off(j, k))]),
          });
          R.tex(`\\|q_1\\| = ${tn(len(C[0]))},\\ \\ \\|q_2\\| = ${tn(len(C[1]))},\\ \\ \\|q_3\\| = ${tn(len(C[2]))}`, 0.5, 0.2, { size: 14 });
          R.tex(`|\\det Q| = \\text{volume of the box} = ${tn(Math.abs(det))}`, 0.5, 0.08, { size: 14, color: ok ? 'green' : 'ink' });
          st = { ok, dev, worst, G, det };
        });
        v.legend([['blue', 'columns $q_1, q_2, q_3$ of $Q$'], ['green', 'right angle / unit box', { area: true }], ['faint', 'unit sphere']]);
        v.readout(() => {
          if (!st) return '';
          const [j, k] = st.worst;
          if (st.ok) return `$Q^*Q = I$: the columns are orthonormal, so $Q$ is **unitary**; its box is a unit cube, $|\\det Q| = ${tn(Math.abs(st.det))}$.`;
          const what = j === k ? `\\|q_${j + 1}\\|^2 = ${tn(st.G[j][j])} \\ne 1` : `\\langle q_${k + 1}, q_${j + 1}\\rangle = ${tn(st.G[j][k])} \\ne 0`;
          return `$Q^*Q \\ne I$ — largest defect $${what}$: **not unitary**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.57
    {
      num: '7.57',
      kind: 'Theorem',
      name: 'Characterizations of unitary matrices',
      statement: String.raw`Suppose $Q$ is an $n$-by-$n$ matrix. The following are equivalent.
(a) $Q$ is a unitary matrix (its columns are orthonormal).
(b) The rows of $Q$ form an orthonormal list in $\mathbf F^n$.
(c) $\|Qv\| = \|v\|$ for every $v \in \mathbf F^n$ (Euclidean norm, $v$ viewed as a column).
(d) $Q^*Q = QQ^* = I$, where $Q^*$ is the conjugate transpose of $Q$.`,
      idea: String.raw`Entry $(j,k)$ of $Q^*Q$ is the inner product $\langle q_k, q_j\rangle$ of two columns, so (a) says exactly $Q^*Q = I$. A square matrix with a one-sided inverse is invertible, so then $QQ^* = I$ as well, and entry $(j,k)$ of $QQ^*$ is the inner product of rows $j$ and $k$ (conjugated) — that is (b), and the argument runs backwards. Finally $\|Qv\|^2 = \langle Q^*Qv, v\rangle$, so $Q^*Q = I$ gives (c); conversely (c) says $x \mapsto Qx$ is an isometry, and 7.49 (with 7.9 identifying the adjoint with $Q^*$) gives $Q^*Q = I$. Equivalently: (a)–(d) are the conditions of 7.53 for the operator $x \mapsto Qx$.`,
      caption: String.raw`$Q = Q_0 + \varepsilon P$ starts at a rotation or reflection $Q_0$ (angle $\theta$) and is pushed off by $\varepsilon$ in the chosen direction $P$. Left: the columns (blue), the rows (orange, dashed), the image of the unit circle, and $Qv$ for the gold $v$ you drag (its length is compared with the dashed circle of radius $\|v\|$). Right: for every $\varepsilon$, how far each of (a)–(d) is from holding. The four curves touch $0$ at the same place, $\varepsilon = 0$, whatever direction you push in.`,
      deps: ['ladr-7.56', 'ladr-7.49', 'ladr-7.53', 'ladr-7.9'],
      tags: ['isometries', 'matrices'],
      viz(v) {
        const S = v.stage({ x: [-2, 2], y: [-1.9, 1.9], equal: true, height: 360, minWidth: 290 });
        const G = v.stage({ x: [-0.6, 0.6], y: [0, 1.5], height: 360, minWidth: 290, axes: 'box', xlabel: 'ε', title: 'defect of each condition as $\\varepsilon$ varies' });
        const base = v.select('', [{ value: 'r', label: '$Q_0$ rotation' }, { value: 'f', label: '$Q_0$ reflection' }], 'r');
        const dir = v.select('push in direction', [{ value: 'rand', label: 'generic' }, { value: 'shear', label: 'shear' }, { value: 'stretch', label: 'stretch' }], 'rand');
        const th = v.slider('$\\theta$', -3.14, 3.14, 0.6, { step: 0.01 });
        const ep = v.slider('$\\varepsilon$', -0.6, 0.6, 0.18, { step: 0.01 });
        const vh = S.handle(1.15, 0.55, { color: 'gold', label: 'v' });
        const P = { shear: [[0, 1], [0, 0]], stretch: [[1, 0], [0, 0]], rand: [[0.35, -0.8], [0.6, 0.2]] };
        const Qof = (e) => {
          const B = base.value === 'r' ? rot(th.value) : mm(rot(th.value), [[1, 0], [0, -1]]), p = P[dir.value];
          return B.map((r, i) => r.map((x, j) => x + e * p[i][j]));
        };
        const opn = (X) => { const E = sym2(X[0][0], (X[0][1] + X[1][0]) / 2, X[1][1]); return Math.max(Math.abs(E.l[0]), Math.abs(E.l[1])); };
        const defects = (Q, nS = 120) => {
          const QtQ = mm(tr(Q), Q), QQt = mm(Q, tr(Q));
          let dc = 0; for (let k = 0; k < nS; k++) dc = Math.max(dc, Math.abs(len(mv(Q, uAt((Math.PI * k) / nS))) - 1));
          return [maxAbs(msub(QtQ, eye(2))), maxAbs(msub(QQt, eye(2))), dc, Math.max(opn(msub(QtQ, eye(2))), opn(msub(QQt, eye(2))))];
        };
        const DC = ['blue', 'orange', 'purple', 'teal'];
        let st = null;
        v.render(() => {
          const e = ep.value, Q = Qof(e), d = defects(Q, 720), ok = d.every((x) => x < 1e-9);
          // left: columns, rows, the unit circle and its image, v and Qv
          S.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          S.path(ellPts(Q), { fill: ok ? 'green' : 'accent', fillAlpha: 0.08, color: ok ? 'green' : 'accent', width: 1.6 });
          const cols = [[Q[0][0], Q[1][0]], [Q[0][1], Q[1][1]]], rows = [Q[0], Q[1]];
          rows.forEach((r, k) => { S.arrow(0, 0, r[0], r[1], { color: 'orange', width: 2, dash: [6, 4] }); S.tex(`r_${k + 1}`, r[0] * 1.13, r[1] * 1.13, { color: 'orange', size: 14 }); });
          cols.forEach((c, k) => { S.arrow(0, 0, c[0], c[1], { color: 'blue', width: 2.6 }); S.tex(`q_${k + 1}`, c[0] * 1.15, c[1] * 1.15, { color: 'blue', size: 15 }); });
          const vv = [vh.x, vh.y], Qv = mv(Q, vv), nv = len(vv);
          S.circle(0, 0, nv, { color: 'gold', dash: [2, 4], width: 1, alpha: 0.8 });
          S.arrow(0, 0, vv[0], vv[1], { color: 'gold', width: 2.4 });
          S.arrow(0, 0, Qv[0], Qv[1], { color: 'purple', width: 2.6 });
          S.tex('Qv', Qv[0], Qv[1], { color: 'purple', size: 15, dx: 14, dy: -10 });
          // right: the four defects as functions of ε
          G.hline(0, { color: 'faint', width: 1 });
          for (let k = 0; k < 4; k++) G.fn((x) => defects(Qof(x))[k], { color: DC[k], width: 2.2, n: 160, dash: k === 1 ? [7, 5] : false });
          G.vline(e, { color: 'gold', width: 1.4, dash: [4, 4] });
          for (let k = 0; k < 4; k++) G.dot(e, d[k], { color: DC[k], r: 4 });
          G.corner(ok ? '(a) (b) (c) (d) all hold' : '(a) (b) (c) (d) all fail', 'tr', { color: ok ? 'green' : 'red', weight: 700 });
          S.corner(ok ? 'Q is unitary' : 'Q is not unitary', 'tl', { color: ok ? 'green' : 'red', weight: 700 });
          st = { Q, d, ok, nv, nQv: len(Qv) };
        });
        v.legend([['blue', '(a) max $|\\langle q_j, q_k\\rangle - \\delta_{jk}|$'], ['orange', '(b) same for rows', { dash: true }], ['purple', '(c) $\\max_{\\|u\\|=1} \\big|\\|Qu\\| - 1\\big|$'], ['teal', '(d) $\\max(\\|Q^*Q - I\\|, \\|QQ^* - I\\|)$']]);
        v.readout(() => {
          if (!st) return '';
          const { Q, d, ok, nv, nQv } = st;
          return `$Q = ${mtex(Q)}$: defects (a) $${tn(d[0], 3)}$, (b) $${tn(d[1], 3)}$, (c) $${tn(d[2], 3)}$, (d) $${tn(d[3], 3)}$ — ${ok ? '**all four hold**' : '**all four fail**'}. Here $\\|v\\| = ${tn(nv)}$ and $\\|Qv\\| = ${tn(nQv)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.58
    {
      num: '7.58',
      kind: 'Theorem',
      name: 'QR factorization',
      statement: String.raw`Suppose $A$ is a square matrix with linearly independent columns. Then there exist unique matrices $Q$ and $R$ such that $Q$ is unitary, $R$ is upper triangular with only positive numbers on its diagonal, and
$$A = QR.$$`,
      idea: String.raw`Run Gram–Schmidt (6.32) on the columns $v_1, \dots, v_n$ of $A$, getting an orthonormal basis $e_1, \dots, e_n$ with $\operatorname{span}(v_1, \dots, v_k) = \operatorname{span}(e_1, \dots, e_k)$ for each $k$. Let $Q$ have columns $e_k$ and put $R_{j,k} = \langle v_k, e_j\rangle$. For $j > k$ this is $0$, since $e_j$ is orthogonal to $\operatorname{span}(e_1, \dots, e_k) \ni v_k$; and column $k$ of $QR$ is $\sum_j \langle v_k, e_j\rangle e_j = v_k$ by 6.30 and 3.51. The diagonal entries are positive because $v_k$ is a positive multiple of $e_k$ plus earlier $e_j$'s. Uniqueness: the columns of any such $Q$ satisfy the same span conditions with positive coefficients, and those conditions pin down the Gram–Schmidt output.`,
      caption: String.raw`Drag the columns $v_1, v_2, v_3$ of $A$ (drag the background to rotate) and step through Gram–Schmidt: each $v_k$ loses its shadow (orange) on the earlier $e_j$'s, and the rest, normalized, is $e_k$ (green). The shadow lengths fill column $k$ of $R$ above the diagonal and the leftover length $\|w_k\|$ is the positive diagonal entry. Snap $v_3$ into the plane of $v_1, v_2$ (it snaps when close) and $w_3 = 0$: the hypothesis fails and so does the factorization. Flip $e_2$ to see why the sign condition is needed for uniqueness.`,
      deps: ['ladr-6.32', 'ladr-3.51', 'ladr-6.30', 'ladr-7.56'],
      tags: ['factorization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/QR_decomposition' },
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.8, 1.8], y: [-1.6, 1.9], equal: true, axes: false, height: 380, weight: 1.25, minWidth: 320 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 270 });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.3, axis: 1.45, lim: 1.6 });
        const CC = ['blue', 'purple', 'teal'];
        const H = [[1.4, 0.4, 0.15], [0.55, 1.05, 0.2], [0.35, 0.45, 1.15]].map((p, k) => sc.handle(p, {
          color: CC[k], label: `v${'₁₂₃'[k]}`,
          snap: k === 2 ? (q) => { const n = unit(cross(H[0].p, H[1].p)), d = dot(q, n); return Math.abs(d) < 0.1 ? sub(q, scl(n, d)) : q; } : null,
        }));
        const flip = v.toggle('flip the sign of $e_2$', false);
        const code = ['$e_1 \\leftarrow v_1/\\|v_1\\|$,  $R_{1,1} \\leftarrow \\|v_1\\|$', 'for $k = 2, 3$:', '  $R_{j,k} \\leftarrow \\langle v_k, e_j\\rangle$ for $j < k$   ▷ shadows', '  $w_k \\leftarrow v_k - \\sum_{j<k} R_{j,k}\\, e_j$', '  $R_{k,k} \\leftarrow \\|w_k\\|$,  $e_k \\leftarrow w_k / R_{k,k}$', '$Q \\leftarrow [\\,e_1\\ e_2\\ e_3\\,]$;  then $A = QR$'];
        const steps = v.steps({
          frames: [
            { s: 0, line: [], note: 'The columns $v_1, v_2, v_3$ of $A$. Gram–Schmidt will turn them into an orthonormal list, keeping track of the coefficients in $R$.' },
            { s: 1, line: 1, note: '$e_1$ is $v_1$ scaled to length $1$, so $v_1 = R_{1,1} e_1$ with $R_{1,1} = \\|v_1\\| > 0$.' },
            { s: 2, line: [3, 4], note: 'The shadow of $v_2$ on $e_1$ is $\\langle v_2, e_1\\rangle e_1$; what is left, $w_2$, is perpendicular to $e_1$.' },
            { s: 3, line: 5, note: '$e_2 = w_2/\\|w_2\\|$, so $v_2 = R_{1,2} e_1 + R_{2,2} e_2$ with $R_{2,2} = \\|w_2\\| > 0$; nothing in row 3 is needed.' },
            { s: 4, line: [3, 4], note: 'The shadow of $v_3$ on the plane of $e_1, e_2$ has coordinates $R_{1,3}, R_{2,3}$; the rest, $w_3$, sticks straight out of that plane.' },
            { s: 5, line: 5, note: '$e_3 = w_3/\\|w_3\\|$ and $R_{3,3} = \\|w_3\\|$. Every entry below the diagonal is $0$: $v_k$ only uses $e_1, \\dots, e_k$.' },
            { s: 6, line: 6, note: 'Column $k$ of $QR$ is $\\sum_j R_{j,k} e_j = v_k$: so $A = QR$, with $Q$ unitary and $R$ upper triangular with positive diagonal.' },
          ],
          code, codeTitle: 'Gram–Schmidt on the columns of A', codePos: 'below', still: 4, start: 4,
        });
        const tQ = v.table(R, { rows: 3, cols: 3, region: [0.02, 0.4, 0.48, 0.9], maxCell: 46, size: 12.5 });
        const tR = v.table(R, { rows: 3, cols: 3, region: [0.52, 0.4, 0.98, 0.9], maxCell: 46, size: 12.5 });
        let st = null;
        v.render(() => {
          const s = steps.frame.s ?? 0, Vs = H.map((h) => h.p);
          // the proof's construction
          const e = [], Rm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], w = [];
          for (let k = 0; k < 3; k++) {
            let r = Vs[k].slice();
            for (let j = 0; j < k; j++) { if (!e[j]) continue; Rm[j][k] = dot(Vs[k], e[j]); r = sub(r, scl(e[j], Rm[j][k])); }
            w.push(r); Rm[k][k] = len(r); e.push(len(r) > 1e-6 ? scl(r, 1 / len(r)) : null);
          }
          const dep = !e[2] || !e[1] || !e[0], fl = flip.value && s >= 3 && e[1];
          const E = e.map((x, k) => (x && k === 1 && fl ? scl(x, -1) : x)), RR = Rm.map((r, j) => r.map((x) => (j === 1 && fl ? -x : x)));
          const known = { e: [s >= 1, s >= 3, s >= 5], R: (j, k) => (j > k ? true : [[1, 2, 4], [9, 3, 4], [9, 9, 5]][j][k] <= s) };
          sc.begin();
          if (s === 4 && e[0] && e[1]) sc.disc(e[0], e[1], 1.35, { fill: 'orange', color: 'orange', fillAlpha: 0.06, alpha: 0.35 });
          Vs.forEach((x, k) => sc.arrow(ZERO, x, { color: CC[k], width: 2.4, alpha: known.e[k] ? 0.55 : 1 }));
          if (s === 2 && e[0]) {
            const sh = scl(e[0], Rm[0][1]);
            sc.arrow(ZERO, sh, { color: 'orange', width: 3 }); sc.line(sh, Vs[1], { color: 'purple', width: 2, dash: [5, 4] });
            sc.arrow(ZERO, w[1], { color: 'purple', width: 2, dash: [5, 4] }); rightMark3(sc, e[0], w[1]);
          }
          if (s === 4 && e[0] && e[1]) {
            const sh = add(scl(e[0], Rm[0][2]), scl(e[1], Rm[1][2]));
            sc.line(scl(e[0], Rm[0][2]), sh, { color: 'orange', width: 1.4, dash: [4, 4] }); sc.line(scl(e[1], Rm[1][2]), sh, { color: 'orange', width: 1.4, dash: [4, 4] });
            sc.arrow(ZERO, sh, { color: 'orange', width: 3 }); sc.line(sh, Vs[2], { color: 'teal', width: 2, dash: [5, 4] });
            if (len(w[2]) > 1e-6) rightMark3(sc, sh, w[2]);
          }
          E.forEach((x, k) => {
            if (!x || !known.e[k]) return;
            const bad = k === 1 && fl;
            sc.arrow(ZERO, x, { color: bad ? 'red' : 'green', width: 4 });
            sc.tex(`e_${k + 1}`, scl(x, 1.17), { color: bad ? 'red' : 'green', size: 15 });
          });
          sc.flush();
          if (dep && s >= 5) S.corner('w₃ = 0: the columns are dependent, no e₃ and R₃₃ = 0', 'tl', { color: 'red', weight: 700 });
          // the tables
          const cellQ = (i, j) => (known.e[j] && E[j] ? E[j][i] : null);
          tQ.draw({ value: cellQ, format: (x) => (x == null ? '' : pf(x, 2)), fill: (i, j) => (cellQ(i, j) != null ? ['green', 0.13] : null) });
          tR.draw({
            value: (j, k) => (known.R(j, k) ? (j > k ? 0 : RR[j][k]) : null), format: (x) => (x == null ? '' : pf(x, 2)),
            textColor: (j, k) => (j > k ? 'faint' : 'ink'),
            fill: (j, k) => (!known.R(j, k) || j > k ? null : j === k ? (RR[j][j] > 1e-6 ? ['green', 0.22] : ['red', 0.3]) : ['orange', 0.14]),
          });
          for (const [t, lab] of [[tQ, 'Q'], [tR, 'R']]) { const g = t.geo; if (g) R.texPx(lab, g.X0 + (3 * g.cw) / 2, g.Y0 - 14, { size: 17 }); }
          const Qm = fromCols(E.map((x) => x || ZERO)), A = fromCols(Vs), err = maxAbs(msub(mm(Qm, RR), A));
          const NEW = [
            '\\text{the columns of } A \\text{ are } v_1, v_2, v_3',
            `R_{1,1} = \\|v_1\\| = ${tn(Rm[0][0])}`,
            `R_{1,2} = \\langle v_2, e_1\\rangle = ${tn(Rm[0][1])}`,
            `R_{2,2} = \\|w_2\\| = ${tn(Rm[1][1])}`,
            `R_{1,3} = \\langle v_3, e_1\\rangle = ${tn(Rm[0][2])},\\ \\ R_{2,3} = \\langle v_3, e_2\\rangle = ${tn(Rm[1][2])}`,
            `R_{3,3} = \\|w_3\\| = ${tn(Rm[2][2])}`,
            dep ? '\\text{no factorization: } R_{3,3} = 0' : `\\max|A - QR| = ${v.sci(err, 1)}`,
          ];
          R.tex(NEW[s], 0.5, 0.29, { size: 14.5, color: s === 6 ? (dep ? 'red' : 'green') : s === 5 && dep ? 'red' : 'ink' });
          R.line(0.06, 0.37, 0.94, 0.37, { color: 'grid', width: 1 });
          if (fl) R.tex('R_{2,2} < 0:\\ \\text{also } A = QR,\\ \\text{but not allowed}', 0.5, 0.16, { size: 13.5, color: 'red' });
          st = { s, A, RR, err, dep, fl, hh: dep ? null : M.qr(A) };
        });
        v.legend([['blue', 'columns $v_k$ of $A$'], ['orange', 'shadows on earlier $e_j$ (entries of $R$)'], ['green', 'orthonormal $e_k$ (columns of $Q$)']]);
        v.readout(() => {
          if (!st) return '';
          const { A, RR, err, dep, fl, hh } = st;
          if (dep) return `$A = ${mtex(A)}$ has dependent columns ($v_3 \\in \\operatorname{span}(v_1, v_2)$): $w_3 = 0$, so there is no $e_3$ and no $R$ with positive diagonal.`;
          const dif = Math.max(maxAbs(msub(hh.R, RR)), 0);
          return `$A = ${mtex(A)}$, $R = ${mtex(RR)}$, $\\max|A - QR| = ${v.sci(err, 1)}$. ${fl ? 'With $e_2$ flipped, $R_{2,2} < 0$: a second factorization, ruled out only by the sign condition.' : `Householder reflections, a quite different algorithm, return the same $R$ (difference $${v.sci(dif, 1)}$) — uniqueness.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.61
    {
      num: '7.61',
      kind: 'Theorem',
      name: 'Positive invertible operator',
      statement: String.raw`A self-adjoint operator $T \in \mathcal L(V)$ is a positive invertible operator if and only if
$$\langle Tv, v\rangle > 0 \quad\text{for every nonzero } v \in V.$$`,
      idea: String.raw`If $T$ is positive and invertible and $v \ne 0$, then $Tv \ne 0$; by 7.43 a positive operator with $\langle Tv, v\rangle = 0$ has $Tv = 0$, so $\langle Tv, v\rangle \ne 0$ and hence it is $> 0$. Conversely, if $\langle Tv, v\rangle > 0$ for all $v \ne 0$, then $T$ is positive (7.34) and $Tv \ne 0$ whenever $v \ne 0$, so $T$ is injective and therefore invertible (3.65).`,
      caption: String.raw`$T$ is the symmetric operator with eigenvalues $\lambda_1, \lambda_2$ along perpendicular axes (angle slider). At points $v$ of the unit circle the small arrows show $Tv$: green where it points outward ($\langle Tv, v\rangle > 0$), red where inward. The curves are level sets of $\langle Tv, v\rangle$. Drag $v$: its radial shadow has signed length $\langle Tv, v\rangle$, plotted on the right for all directions. Strictly positive everywhere exactly when $T$ is positive *and* invertible; push $\lambda_2$ to $0$ and the minimum touches $0$ — right where $Tv = 0$.`,
      deps: ['ladr-7.43', 'ladr-7.34', 'ladr-3.65'],
      tags: ['positivity'],
      viz(v) {
        const S = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 380, minWidth: 300, weight: 1.15 });
        const G = v.stage({ x: [0, Math.PI], y: [-1.2, 2.2], height: 380, minWidth: 260, axes: 'box', xlabel: 'angle of v', xticks: [[0, '0'], [Math.PI / 4, 'π/4'], [Math.PI / 2, 'π/2'], [(3 * Math.PI) / 4, '3π/4'], [Math.PI, 'π']], title: '$\\langle Tv, v\\rangle$ for unit $v$' });
        const PRE = { pd: [1.6, 0.5], psd: [1.6, 0], ind: [1.6, -0.6] };
        v.select('', [{ value: 'pd', label: 'positive, invertible' }, { value: 'psd', label: 'positive, not invertible' }, { value: 'ind', label: 'invertible, not positive' }], 'pd', { onChange: (k) => { l1.set(PRE[k][0]); l2.set(PRE[k][1]); } });
        const l1 = v.slider('$\\lambda_1$', -1, 2, 1.6, { step: 0.05 }), l2 = v.slider('$\\lambda_2$', -1, 2, 0.5, { step: 0.05 });
        const ph = v.slider('axis angle', 0, 3.14, 0.5, { step: 0.01 });
        const vh = S.handle(Math.cos(2.4), Math.sin(2.4), {
          color: 'gold', label: 'v', constrain: (x, y) => {
            let t = Math.atan2(y, x);
            for (const a of [ph.value, ph.value + Math.PI / 2]) for (const b of [a, a + Math.PI, a - Math.PI]) if (Math.abs(t - b) < 0.06) t = b;
            return uAt(t);
          },
        });
        let st = null;
        v.render(() => {
          const L = [l1.value, l2.value], Rt = rot(ph.value), T = mm(mm(Rt, [[L[0], 0], [0, L[1]]]), tr(Rt));
          const q = (u) => dot(mv(T, u), u), big = Math.max(1e-9, Math.abs(L[0]), Math.abs(L[1]));
          // level sets q = c, drawn in polar form r(θ) = √(c / q(u_θ))
          for (const c of [0.25, 0.6, 1.2, -0.25, -0.6, -1.2]) {
            const pts = [];
            for (let k = 0; k <= 360; k++) { const u = uAt((TAU * k) / 360), Q = q(u); pts.push(Q * c > 1e-6 && Math.sqrt(c / Q) < 6 ? scl(u, Math.sqrt(c / Q)) : null); }
            S.path(pts, { color: c > 0 ? 'blue' : 'red', width: 1, alpha: 0.45 });
          }
          // the zero set and the eigen-axes
          for (let k = 0; k < 2; k++) {
            const a = uAt(ph.value + (k * Math.PI) / 2);
            S.line(-3 * a[0], -3 * a[1], 3 * a[0], 3 * a[1], { color: Math.abs(L[k]) < 1e-9 ? 'gold' : 'faint', width: Math.abs(L[k]) < 1e-9 ? 2.5 : 1, dash: Math.abs(L[k]) < 1e-9 ? false : [3, 4] });
            const sg = a[0] > 0.15 || (a[0] > -0.15 && a[1] < 0) ? 1 : -1, lp = scl(a, 1.72 * sg);
            S.tex(`\\lambda_${k + 1} = ${tn(L[k])}`, lp[0], lp[1], { color: 'muted', size: 13, dy: lp[1] > 0 ? -11 : 11 });
          }
          if (L[0] * L[1] < 0) { const t0 = Math.atan(Math.sqrt(-L[0] / L[1])); for (const sg of [1, -1]) { const a = uAt(ph.value + sg * t0); S.line(-3 * a[0], -3 * a[1], 3 * a[0], 3 * a[1], { color: 'gold', width: 1.6, dash: [6, 4] }); } }
          S.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          for (let k = 0; k < 28; k++) {
            const u = uAt((TAU * k) / 28), Tu = mv(T, u), Q = q(u), tip = add(u, scl(Tu, 0.36 / big));
            S.arrow(u[0], u[1], tip[0], tip[1], { color: Q > 0.02 * big ? 'green' : Q < -0.02 * big ? 'red' : 'gold', width: 1.6, head: 6 });
          }
          const u = [vh.x, vh.y], Tu = mv(T, u), Q = q(u), foot = scl(u, Q);
          S.arrow(0, 0, Tu[0], Tu[1], { color: 'purple', width: 2.6 });
          S.line(Tu[0], Tu[1], foot[0], foot[1], { color: 'muted', width: 1, dash: [3, 3] });
          S.line(0, 0, foot[0], foot[1], { color: Q > 1e-9 ? 'green' : Q < -1e-9 ? 'red' : 'gold', width: 5, alpha: 0.75 });
          if (len(Tu) > 0.15) S.tex('Tv', Tu[0], Tu[1], { color: 'purple', size: 15, dx: 12, dy: -10 });
          // right: q on the unit circle (period π)
          const f = (t) => q(uAt(t)), mn = Math.min(...L), tmin = ph.value + (L[0] <= L[1] ? 0 : Math.PI / 2);
          G.setView(null, [Math.min(-0.3, mn - 0.3), Math.max(1, Math.max(...L) + 0.4)]);
          G.fn((t) => Math.max(0, f(t)), { fill: 'green', fillAlpha: 0.16, stroke: false, n: 200 });
          G.fn((t) => Math.min(0, f(t)), { fill: 'red', fillAlpha: 0.2, stroke: false, n: 200 });
          G.hline(0, { color: 'muted', width: 1 });
          G.fn(f, { color: 'accent', width: 2.4, n: 200 });
          const tm = ((tmin % Math.PI) + Math.PI) % Math.PI;
          G.dot(tm, mn, { color: mn > 1e-9 ? 'green' : mn < -1e-9 ? 'red' : 'gold', r: 5, label: `min = λmin = ${pn(mn)}`, labelPos: 's' });
          const tv = ((Math.atan2(u[1], u[0]) % Math.PI) + Math.PI) % Math.PI;
          G.vline(tv, { color: 'gold', width: 1.2, dash: [4, 4] }); G.dot(tv, Q, { color: 'gold', r: 4.5 });
          const pos = mn > 1e-9;
          S.corner(pos ? 'T positive and invertible' : mn < -1e-9 ? 'T not positive' : 'T positive, not invertible', 'tl', { color: pos ? 'green' : 'red', weight: 700 });
          st = { L, mn, Q, Tu, det: L[0] * L[1] };
        });
        v.legend([['purple', '$Tv$ for the gold $v$'], ['green', 'outward: $\\langle Tv, v\\rangle > 0$'], ['red', 'inward: $\\langle Tv, v\\rangle < 0$'], ['gold', 'where $\\langle Tv, v\\rangle = 0$', { dash: true }], ['blue', 'level sets of $\\langle Tv, v\\rangle$']]);
        v.readout(() => {
          if (!st) return '';
          const { mn, Q, Tu, det } = st, at = `$\\langle Tv, v\\rangle = ${tn(Q)}$, $\\|Tv\\| = ${tn(len(Tu))}$ at the gold $v$. `;
          if (mn > 1e-9) return at + `$\\min_{\\|v\\|=1}\\langle Tv, v\\rangle = ${tn(mn)} > 0$, so $\\langle Tv, v\\rangle = \\|v\\|^2\\langle Tu, u\\rangle > 0$ for all $v \\ne 0$ — and indeed $\\det T = ${tn(det)} \\ne 0$: **positive and invertible**.`;
          if (mn > -1e-9) return at + `The minimum is $0$, attained on the gold axis — and there $Tv = 0$ (7.43): $T$ is positive but **not injective**, hence not invertible.`;
          return at + `$\\langle Tv, v\\rangle$ is negative in some directions (minimum $${tn(mn)}$): $T$ is **not positive**${Math.abs(det) > 1e-9 ? ', although it is invertible' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.62
    {
      num: '7.62',
      kind: 'Definition',
      name: 'Positive definite matrix',
      statement: String.raw`A matrix $B \in \mathbf F^{n,n}$ is called **positive definite** if $B^* = B$ and
$$\langle Bx, x\rangle > 0 \quad\text{for every nonzero } x \in \mathbf F^n,$$
where $\mathbf F^n$ carries the Euclidean inner product and $x$ is viewed as a column. By 7.61, these are exactly the matrices of the positive invertible operators on $\mathbf F^n$.`,
      idea: String.raw`This is 7.61 transferred to matrices: $B^* = B$ says the operator $x \mapsto Bx$ is self-adjoint (7.9), and the strict inequality then says it is positive and invertible. For a real symmetric $2$-by-$2$ matrix $\begin{bmatrix} a & b \\ b & c\end{bmatrix}$ the condition is $a > 0$ and $ac - b^2 > 0$ (both eigenvalues positive), and the curve $\langle Bx, x\rangle = 1$ is then an ellipse whose semi-axes point along the eigenvectors with lengths $1/\sqrt{\lambda}$.`,
      caption: String.raw`Left: the parameter plane of $B = \begin{bmatrix} a & b + k \\ b - k & c\end{bmatrix}$ — drag the point $(a, c)$ and move $b$. The green region (bounded by the hyperbola $ac = b^2$, where the point snaps) is where $B$ is positive definite. Right: the form $\langle Bx, x\rangle$ (blue $> 0$, red $< 0$) and the curve $\langle Bx, x\rangle = 1$: an ellipse inside the region, parallel lines on its edge, a hyperbola outside. The skew part $k$ changes nothing on the right — $\langle Bx, x\rangle$ cannot see it — yet any $k \ne 0$ breaks $B^* = B$, so $B$ is no longer positive definite.`,
      deps: ['ladr-7.7', 'ladr-7.61'],
      tags: ['positivity', 'matrices'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Definite_matrix' },
      viz(v) {
        const P = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 360, minWidth: 280, xlabel: 'a', ylabel: 'c', title: 'parameter plane $(a, c)$' });
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 360, minWidth: 280, title: '$\\langle Bx, x\\rangle$ and the curve $\\langle Bx, x\\rangle = 1$' });
        const bS = v.slider('$b$', -1.5, 1.5, 0.5, { step: 0.05 });
        const kS = v.slider('skew part $k$', -1, 1, 0, { step: 0.05 });
        const hp = P.handle(1.3, 0.9, {
          color: 'accent', label: '(a, c)', constrain: (a, c) => {
            const b2 = bS.value ** 2;
            if (a > 0.05 && Math.abs(c - b2 / a) < 0.07) c = b2 / a;
            else if (Math.abs(b2) < 1e-9 && Math.abs(a) < 0.06) a = 0;
            return [a, c];
          },
        });
        let st = null;
        v.render(() => {
          const a = hp.x, c = hp.y, b = bS.value, k = kS.value, B = [[a, b + k], [b - k, c]];
          const E = sym2(a, b, c), sym = Math.abs(k) < 1e-9, pd = E.l[1] > 1e-9 && sym, d = a * c - b * b;
          const key = [b, v.rgb('green').join()].join('|');
          P.raster((x, y) => { const dd = x * y - b * b; return x > 0 && dd > 0 ? rgba(v, 'green', 0.22) : dd < 0 ? rgba(v, 'red', 0.06) : rgba(v, 'muted', 0.06); }, { key, res: 2 });
          P.axes();
          if (Math.abs(b) > 1e-9) { P.fn((x) => (b * b) / x, { domain: [0.005, 3.5], color: 'green', width: 1.8 }); P.fn((x) => (b * b) / x, { domain: [-3.5, -0.005], color: 'muted', width: 1.2, dash: [4, 4] }); } else { P.line(0, 0, 0, 3, { color: 'green', width: 1.8 }); P.line(0, 0, 3, 0, { color: 'green', width: 1.8 }); }
          P.text('positive definite', 1.25, 1.85, { color: 'green', size: 12, weight: 700, align: 'center' });
          P.text('indefinite', -1.2, 1.6, { color: 'red', size: 12, weight: 600, align: 'center' });
          P.text('negative definite', -1.3, -1.75, { color: 'muted', size: 12, weight: 600, align: 'center' });
          // the form and its level curve
          S.raster((x, y) => { const q = a * x * x + 2 * b * x * y + c * y * y; return q > 0 ? rgba(v, 'blue', Math.min(0.3, q / 14)) : rgba(v, 'red', Math.min(0.3, -q / 14)); }, { key: [a, b, c, v.rgb('blue').join()].join('|'), res: 3 });
          S.axes();
          const q = (u) => a * u[0] * u[0] + 2 * b * u[0] * u[1] + c * u[1] * u[1];
          const pts = []; for (let i = 0; i <= 720; i++) { const u = uAt((TAU * i) / 720), Q = q(u); pts.push(Q > 1e-6 && 1 / Math.sqrt(Q) < 8 ? scl(u, 1 / Math.sqrt(Q)) : null); }
          S.path(pts, { color: pd ? 'green' : 'ink', width: 2.6 });
          for (let i = 0; i < 2; i++) {
            const u = i ? perp(E.u) : E.u, l = E.l[i];
            if (Math.abs(l) < 1e-9 || (E.l[0] * E.l[1] < 0 && false)) S.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: 'gold', width: 1.6, dash: [6, 4] });
            if (l > 1e-9) { const r = 1 / Math.sqrt(l); S.arrow(0, 0, r * u[0], r * u[1], { color: pd ? 'green' : 'muted', width: 2, head: 7 }); S.tex(`1/\\sqrt{${tn(l)}}`, r * u[0], r * u[1], { color: 'muted', size: 12, dx: 8 * Math.sign(u[0] || 1), dy: -12 }); }
          }
          if (E.l[0] * E.l[1] < -1e-12) { const t0 = Math.atan(Math.sqrt(-E.l[0] / E.l[1])), base = Math.atan2(E.u[1], E.u[0]); for (const sg of [1, -1]) { const u = uAt(base + sg * t0); S.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: 'gold', width: 1.4, dash: [6, 4] }); } }
          S.corner(pd ? 'B positive definite' : !sym && E.l[1] > 1e-9 ? '⟨Bx, x⟩ > 0, but B* ≠ B' : 'not positive definite', 'tl', { color: pd ? 'green' : 'red', weight: 700 });
          st = { B, E, pd, sym, d, a };
        });
        v.legend([['green', 'positive definite region / level ellipse', { area: true }], ['gold', '$\\langle Bx, x\\rangle = 0$', { dash: true }], ['blue', '$\\langle Bx, x\\rangle > 0$', { area: true }], ['red', '$\\langle Bx, x\\rangle < 0$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { B, E, pd, sym, d, a } = st;
          const ev = `eigenvalues of $\\tfrac12(B + B^*)$: $${tn(E.l[0])}, ${tn(E.l[1])}$`;
          if (pd) return `$B = ${mtex(B)} = B^*$, $a = ${tn(a)} > 0$, $ac - b^2 = ${tn(d)} > 0$; ${ev}, both positive: **positive definite**.`;
          if (!sym) return `$B = ${mtex(B)} \\ne B^*$. ${ev}${E.l[1] > 1e-9 ? ' — so $\\langle Bx, x\\rangle > 0$ for all $x \\ne 0$, yet $B$ is **not positive definite**: the definition also asks for $B^* = B$.' : '.'}`;
          return `$B = ${mtex(B)}$, ${ev}: $\\langle Bx, x\\rangle ${E.l[1] > -1e-9 ? '= 0' : '< 0'}$ for some $x \\ne 0$ — **not positive definite**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.63
    {
      num: '7.63',
      kind: 'Theorem',
      name: 'Cholesky factorization',
      statement: String.raw`Suppose $B$ is a positive definite matrix. Then there exists a unique upper-triangular matrix $R$ with only positive numbers on its diagonal such that
$$B = R^*R.$$`,
      idea: String.raw`Because $B$ is positive definite, $B = A^*A$ for some invertible $A$ (7.38, e.g. $A = \sqrt B$). Take the QR factorization $A = QR$ (7.58): then $B = R^*Q^*QR = R^*R$ since $Q^*Q = I$ (7.57). For uniqueness, if also $B = S^*S$ with $S$ upper triangular with positive diagonal, then $(AS^{-1})^*(AS^{-1}) = (S^*)^{-1}BS^{-1} = I$, so $AS^{-1}$ is unitary and $A = (AS^{-1})S$ is a second QR factorization; uniqueness in 7.58 forces $S = R$. Geometrically: $B$ records only the lengths of and angles between the columns of $A$, and $R$ is the one rigid placement of those columns with the first along the positive $x$-axis and the second above it.`,
      caption: String.raw`Drag the columns $a_1, a_2$ of $A$; then $B = A^*A$ is their Gram matrix (lengths and angle), shown on the right. The slider applies $Q^*$, a rotation (and a flip if needed), carrying the pair rigidly to the green position $r_1, r_2$ — the columns of $R$: $r_1$ on the positive $x$-axis, $r_2$ in the upper half-plane, same lengths and angle, so $R^*R = B$. The faint red $r_2'$ is the mirror placement: also $B = R'^*R'$, but $R'_{2,2} < 0$. Make $a_1, a_2$ parallel (they snap): $B$ is no longer positive definite and $R_{2,2} = 0$.`,
      deps: ['ladr-7.62', 'ladr-7.38', 'ladr-7.58', 'ladr-7.57'],
      tags: ['factorization', 'positivity'],
      credit: 'Cholesky, published 1924',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cholesky_decomposition' },
      viz(v) {
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.9, 2.3], equal: true, height: 370, minWidth: 300, weight: 1.1 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, minWidth: 280, title: 'the matrices' });
        const tS = v.slider('apply $Q^*$', 0, 1, 0.6, { step: 0.01 });
        const h1 = S.handle(0.9, 1.3, { color: 'blue', label: 'a₁' });
        const h2 = S.handle(-0.45, 1.25, {
          color: 'teal', label: 'a₂', constrain: (x, y) => {
            const u = unit([h1.x, h1.y]), p = [x, y], c = p[0] * u[1] - p[1] * u[0];
            return Math.abs(c) < 0.08 && len(p) > 0.2 ? scl(u, dot(p, u)) : p;
          },
        });
        let st = null;
        v.render(() => {
          const a1 = [h1.x, h1.y], a2 = [h2.x, h2.y], A = fromCols([a1, a2]), B = mm(tr(A), A);
          const r11 = Math.sqrt(B[0][0]), r12 = r11 > 1e-9 ? B[0][1] / r11 : 0, r22sq = B[1][1] - r12 * r12, r22 = Math.sqrt(Math.max(0, r22sq));
          const Rm = [[r11, r12], [0, r22]], pd = r22 > 1e-6 && r11 > 1e-6;
          // Q* = R A⁻¹ is a rotation (det A > 0) or a rotation followed by the flip (x, y) ↦ (x, −y)
          const det = a1[0] * a2[1] - a1[1] * a2[0], phi = -Math.atan2(a1[1], a1[0]), flipped = det < 0;
          const t = tS.value, ta = smooth(flipped ? t / 0.7 : t), tf = flipped ? smooth((t - 0.7) / 0.3) : 0;
          const Mt = mm([[1, 0], [0, 1 - 2 * tf]], rot(phi * ta));
          const m1 = mv(Mt, a1), m2 = mv(Mt, a2);
          S.rect(-9, 0, 9, 9, { fill: 'green', fillAlpha: 0.04, stroke: false });
          S.line(0, 0, 3, 0, { color: 'green', width: 4, alpha: 0.35 });
          // the original pair (ghost), the moving pair, the target placement and its mirror
          S.poly([[0, 0], a1, add(a1, a2), a2], { fill: 'muted', fillAlpha: 0.05, color: 'muted', width: 1, dash: [3, 4] });
          S.poly([[0, 0], m1, add(m1, m2), m2], { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.2 });
          if (pd) { S.arrow(0, 0, r12, -r22, { color: 'red', width: 1.6, alpha: 0.45, dash: [5, 4] }); S.tex("r_2'", r12, -r22, { color: 'red', size: 13, dx: 12, dy: 8, alpha: 0.7 }); }
          S.arrow(0, 0, r11, 0, { color: 'green', width: 5, alpha: 0.3 }); S.arrow(0, 0, r12, r22, { color: 'green', width: 5, alpha: 0.3 });
          S.arrow(0, 0, m1[0], m1[1], { color: 'blue', width: 2.8 }); S.arrow(0, 0, m2[0], m2[1], { color: 'teal', width: 2.8 });
          if (t > 0.98) { S.tex('r_1', r11, 0, { color: 'green', size: 15, dy: 14 }); S.tex('r_2', r12, r22, { color: 'green', size: 15, dx: 10, dy: -12 }); }
          const ang = Math.atan2(m1[1], m1[0]), ang2 = Math.atan2(m2[1], m2[0]);
          let da = ang2 - ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
          S.curve((s) => scl(uAt(ang + s * da), 0.35), 0, 1, { color: 'gold', width: 1.6 });
          S.corner(pd ? `angle ${pf((Math.abs(da) * 180) / Math.PI, 1)}°, lengths ${pf(len(a1))} and ${pf(len(a2))} — kept by Q*` : 'a₁, a₂ dependent: B only semidefinite', 'bl', { color: pd ? 'muted' : 'red', weight: pd ? 500 : 700 });
          // the matrices
          for (const y of [0.78, 0.57, 0.355, 0.16]) R.line(0.08, y, 0.92, y, { color: 'grid', width: 1 });
          R.tex(`A = ${mtex(A)}`, 0.5, 0.88, { size: 15 });
          R.tex(`B = A^*A = ${mtex(B)}`, 0.5, 0.68, { size: 15 });
          R.tex(`R = \\begin{bmatrix} \\sqrt{B_{11}} & B_{12}/R_{11} \\\\ 0 & \\sqrt{B_{22} - R_{12}^2} \\end{bmatrix} = ${mtex(Rm)}`, 0.5, 0.46, { size: 13.5, color: pd ? 'green' : 'red' });
          const RtR = mm(tr(Rm), Rm);
          R.tex(pd ? `R^*R = ${mtex(RtR)} = B` : `R_{2,2} = 0:\\ \\text{no positive diagonal}`, 0.5, 0.25, { size: 15, color: pd ? 'green' : 'red' });
          if (pd) R.tex(`Q = AR^{-1} = ${mtex(mm(A, [[1 / r11, -r12 / (r11 * r22)], [0, 1 / r22]]))}`, 0.5, 0.08, { size: 13.5, color: 'muted' });
          st = { B, Rm, pd, err: maxAbs(msub(RtR, B)), flipped };
        });
        v.legend([['accent', 'the pair $Q^*(a_1, a_2)$ in motion', { area: true }], ['green', 'columns of $R$: the triangular placement'], ['red', 'mirror placement $R\'$ ($R\'_{2,2} < 0$)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { B, Rm, pd, err, flipped } = st;
          if (!pd) return `$B = ${mtex(B)}$ has $\\det B = 0$: it is not positive definite, $R_{2,2} = \\sqrt{B_{22} - R_{12}^2} = 0$, and no Cholesky factor exists.`;
          return `$B = ${mtex(B)}$ is positive definite: $B = R^*R$ with $R = ${mtex(Rm)}$ (error $${v.sci(err, 1)}$). Each entry of $R$ is forced in turn by $B$ and the sign condition — that is the uniqueness. ${flipped ? 'Here $\\det A < 0$, so $Q^*$ needs a flip as well as a rotation.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.64
    {
      num: '7.64',
      kind: 'Theorem',
      name: 'Properties of T*T',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. Then
(a) $T^*T$ is a positive operator on $V$;
(b) $\operatorname{null} T^*T = \operatorname{null} T$;
(c) $\operatorname{range} T^*T = \operatorname{range} T^*$;
(d) $\dim \operatorname{range} T = \dim \operatorname{range} T^* = \dim \operatorname{range} T^*T$.`,
      idea: String.raw`(a) $(T^*T)^* = T^*(T^*)^* = T^*T$ (7.5), and $\langle T^*Tv, v\rangle = \langle Tv, Tv\rangle = \|Tv\|^2 \ge 0$. (b) If $T^*Tv = 0$ then $\|Tv\|^2 = \langle T^*Tv, v\rangle = 0$, so $Tv = 0$; the other inclusion is obvious. (c) For the self-adjoint $T^*T$, 7.6 gives $\operatorname{range} T^*T = (\operatorname{null} T^*T)^\perp = (\operatorname{null} T)^\perp = \operatorname{range} T^*$. (d) $\dim \operatorname{range} T = \dim (\operatorname{null} T^*)^\perp = \dim W - \dim \operatorname{null} T^* = \dim \operatorname{range} T^*$ by 7.6, 6.51 and 3.21, and (c) gives the rest.`,
      caption: String.raw`$T$ maps $V = \mathbf R^3$ (left; drag the background to rotate) to $W = \mathbf R^2$ (right). In $V$: $\operatorname{null} T$ (red), its orthogonal complement $\operatorname{range} T^*$ (green), and the image of the unit sphere under $T^*T$ (purple), which lies flat inside $\operatorname{range} T^*$. Drag the gold $v$: $T^*Tv$ (purple arrow) always lands in the green subspace, and $\langle T^*Tv, v\rangle = \|Tv\|^2$. Drag $v$ onto the red null space (it snaps) and both $Tv$ and $T^*Tv$ vanish. Switch to rank $1$ and every dimension drops together.`,
      deps: ['ladr-7.34', 'ladr-7.6', 'ladr-6.51', 'ladr-3.21', 'ladr-7.5'],
      tags: ['positivity', 'singular values'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.75, 1.9], equal: true, axes: false, height: 390, weight: 1.3, minWidth: 320, title: '$V = \\mathbf R^3$' });
        const W = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 390, minWidth: 250, title: '$W = \\mathbf R^2$' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.3, axis: 1.5, lim: 1.6 });
        const PRE = { 2: [[1.05, 0.3, 0.25], [0.1, 0.9, -0.3]], 1: [[0.84, 0.54, 0.3], [0.42, 0.27, 0.15]] };
        let T = PRE[2], seed = 5;
        const rk = v.select('', [{ value: '2', label: 'rank 2' }, { value: '1', label: 'rank 1' }], '2', { onChange: (k) => { T = PRE[k]; } });
        v.button('Resample', () => {
          const r = v.rng(seed++), x = () => r.uniform(-1, 1);
          if (rk.value === '2') T = [[x(), x(), x()], [x(), x(), x()]].map((row) => scl(row, 0.95)); else { const p = [x(), x()], q = [x(), x(), x()]; T = p.map((a) => q.map((b) => 1.1 * a * b)); }
        });
        let nullB = [];
        const vh = sc.handle([0.9, -0.5, 0.75], {
          color: 'gold', label: 'v', snap: (p) => {
            if (!nullB.length) return p;
            const q = nullB.reduce((s, e) => add(s, scl(e, dot(p, e))), ZERO);
            return len(sub(p, q)) < 0.12 && len(q) > 0.15 ? q : p;
          },
        });
        let st = null;
        v.render(() => {
          const TtT = mm(tr(T), T), es = M.eigSym(TtT), sv = M.svd(T);
          const tol = 1e-9 * Math.max(1, es.values[0]);
          nullB = M.nullspace(T, 1e-9);
          const rangeTs = es.vecs.filter((_, i) => es.values[i] > tol); // = range T*T (eigenvectors with positive eigenvalue)
          const rowB = gsList(T).filter(Boolean); // range T* = span of the rows of T
          const r = rowB.length, p = vh.p, Tp = mv(T, p), TTp = mv(TtT, p);
          sc.begin();
          if (nullB.length === 1) sc.line(scl(nullB[0], -1.7), scl(nullB[0], 1.7), { color: 'red', width: 4.5, alpha: 0.5 }, 16);
          else if (nullB.length === 2) sc.disc(nullB[0], nullB[1], 1.45, { fill: 'red', color: 'red', fillAlpha: 0.08, alpha: 0.5, grid: true });
          if (r === 2) sc.disc(rowB[0], rowB[1], 1.45, { fill: 'green', color: 'green', fillAlpha: 0.09, alpha: 0.6, grid: true });
          else if (r === 1) sc.line(scl(rowB[0], -1.7), scl(rowB[0], 1.7), { color: 'green', width: 4.5, alpha: 0.5 }, 16);
          // T*T(unit ball) is the flat ellipse with semi-axes λ₁e₁, λ₂e₂ (λ₃ = 0): a disc or a segment in range T*
          ellPoly3(sc, scl(es.vecs[0], es.values[0]), scl(es.vecs[1], Math.max(0, es.values[1])), { fill: 'purple', color: 'purple', fillAlpha: 0.16, alpha: 0.8, width: 1.6 });
          es.vecs.forEach((e, i) => { if (es.values[i] > tol) sc.line(scl(e, -es.values[i]), scl(e, es.values[i]), { color: 'purple', width: 1.4, alpha: 0.6, dash: [4, 4] }); });
          sc.arrow(ZERO, p, { color: 'gold', width: 3 });
          if (len(TTp) > 1e-6) { sc.arrow(ZERO, TTp, { color: 'purple', width: 3 }); sc.tex('T^*Tv', TTp, { color: 'purple', size: 14, dy: -13 }); }
          if (nullB.length) { const np = nullB.length === 1 ? nullB[0] : nullB[0]; sc.tex('\\operatorname{null} T', scl(np, sc.P(np)[1] >= 0 ? 1.75 : -1.75), { color: 'red', size: 13, dy: -10 }); }
          if (r) { const gp = rowB[0]; sc.tex('\\operatorname{range} T^*', scl(gp, sc.P(gp)[1] >= 0 ? 1.55 : -1.55), { color: 'green', size: 13, dy: -12 }); }
          sc.flush();
          // W: range T and the image of the unit ball
          const [U, s] = [sv.U, sv.S], f1 = [U[0][0], U[1][0]], f2 = [U[0][1], U[1][1]];
          if (r === 1) W.line(-3 * f1[0], -3 * f1[1], 3 * f1[0], 3 * f1[1], { color: 'green', width: 5, alpha: 0.3 });
          else W.rect(-9, -9, 9, 9, { fill: 'green', fillAlpha: 0.04, stroke: false });
          W.curve((t) => add(scl(f1, s[0] * Math.cos(t)), scl(f2, (s[1] || 0) * Math.sin(t))), 0, TAU, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.6, n: 120 });
          if (len(Tp) > 1e-6) { W.arrow(0, 0, Tp[0], Tp[1], { color: 'orange', width: 2.8 }); W.tex('Tv', Tp[0], Tp[1], { color: 'orange', size: 15, dx: 12, dy: -10 }); }
          else W.dot(0, 0, { color: 'orange', r: 5, label: 'Tv = 0', labelPos: 'ne' });
          W.corner(r === 2 ? 'range T = W' : 'range T is a line', 'tl', { color: 'green', weight: 700 });
          // check (c): range T*T and range T* coincide
          const gap = rowB.length === rangeTs.length ? Math.max(0, ...rangeTs.map((e) => len(sub(e, rowB.reduce((acc, b) => add(acc, scl(b, dot(e, b))), ZERO))))) : 1;
          st = { r, nNull: nullB.length, q: dot(TTp, p), nTp: len(Tp), nTTp: len(TTp), ev: es.values, gap, rr: rangeTs.length };
        });
        v.legend([['red', '$\\operatorname{null} T = \\operatorname{null} T^*T$'], ['green', '$\\operatorname{range} T^* = \\operatorname{range} T^*T$'], ['purple', '$T^*T(\\text{unit ball})$', { area: true }], ['accent', '$T(\\text{unit ball})$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { r, nNull, q, nTp, nTTp, ev, gap, rr } = st;
          return `(a) eigenvalues of $T^*T$: $${ev.map((x) => tn(x)).join(', ')}$, all $\\ge 0$; at $v$: $\\langle T^*Tv, v\\rangle = ${tn(q, 3)} = \\|Tv\\|^2 = ${tn(nTp * nTp, 3)}$. (b) ${nTp < 1e-9 ? `$v \\in \\operatorname{null} T$ and $T^*Tv = 0$ too (norm $${v.sci(nTTp, 1)}$).` : `$\\dim\\operatorname{null} T = ${nNull}$.`} (c) $\\operatorname{range} T^*T$ and $\\operatorname{range} T^*$ differ by $${v.sci(gap, 1)}$. (d) $\\dim\\operatorname{range} T = \\dim\\operatorname{range} T^* = \\dim\\operatorname{range}T^*T = ${r}${rr === r ? '' : '?'}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.65
    {
      num: '7.65',
      kind: 'Definition',
      name: 'Singular values',
      statement: String.raw`Suppose $T \in \mathcal L(V, W)$. The **singular values** of $T$ are the nonnegative square roots of the eigenvalues of $T^*T$, listed in decreasing order, each included as many times as the dimension of the corresponding eigenspace of $T^*T$. There are exactly $\dim V$ of them.`,
      idea: String.raw`$T^*T$ is a positive operator (7.64), so by the spectral theorem (7.29, 7.31) it has an orthonormal basis of eigenvectors with eigenvalues $\ge 0$, and the eigenspace dimensions add up to $\dim V$; the square roots make sense. Geometrically, for $\|v\| = 1$ we have $\|Tv\|^2 = \langle T^*Tv, v\rangle$, so the singular values are the lengths of the semi-axes of the image of the unit sphere. Unlike eigenvalues, they see the whole size of $T$: $\begin{bmatrix} 0 & 2 \\ 0 & 0\end{bmatrix}$ has only the eigenvalue $0$ but singular values $2, 0$.`,
      caption: String.raw`Drag $T(1,0)$ and $T(0,1)$ (right) to edit $T$. Left, in $V$: the eigenvectors $e_1, e_2$ of $T^*T$ and the image of the unit circle under $T^*T$ (purple), with semi-axes $s_1^2, s_2^2$. Right, in $W$: the image of the unit circle under $T$, whose semi-axes $Te_1, Te_2$ have lengths exactly $s_1, s_2$. The strip compares eigenvalues of $T^*T$, singular values, and absolute values of eigenvalues of $T$: try the shear, the nilpotent map and the scaled rotation (one singular value counted twice).`,
      deps: ['ladr-7.64', 'ladr-5.52'],
      tags: ['singular values'],
      credit: 'Erhard Schmidt, 1907',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Singular_value' },
      viz(v) {
        const V = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 320, minWidth: 260, title: 'in $V$: $T^*T$ and its eigenvectors' });
        const W = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 320, minWidth: 260, title: 'in $W$: the image of the unit circle under $T$' });
        const N = v.stage({ x: [-0.3, 5], y: [0, 3], height: 150, full: true, axes: false });
        const PRE = { gen: [[1.2, 1.1], [-0.3, 0.8]], shear: [[1, 1.5], [0, 1]], nil: [[0, 2], [0, 0]], rot: [[1.2, -0.9], [0.9, 1.2]], r1: [[1.2, 0.6], [0.8, 0.4]] };
        const H = colHandles(W, PRE.gen);
        v.select('', [{ value: 'gen', label: 'generic' }, { value: 'shear', label: 'shear' }, { value: 'nil', label: 'nilpotent' }, { value: 'rot', label: '1.5 × rotation' }, { value: 'r1', label: 'rank 1' }], 'gen', { onChange: (k) => H.set(PRE[k]) });
        let st = null;
        v.render(() => {
          const T = H.A, { s, e, f } = svd22(T), TtT = mm(tr(T), T), E = sym2(TtT[0][0], TtT[0][1], TtT[1][1]);
          const lam = E.l.map((x) => Math.max(0, x)), eq = Math.abs(s[0] - s[1]) < 1e-9 * Math.max(1, s[0]);
          // V: unit circle, T*T(circle), eigenvectors
          V.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          V.path(ellPts(TtT), { color: 'purple', width: 1.6, dash: [6, 4], fill: 'purple', fillAlpha: 0.05 });
          e.forEach((u, k) => {
            const c = k ? 'purple' : 'blue';
            V.line(-4 * u[0], -4 * u[1], 4 * u[0], 4 * u[1], { color: c, width: 1, alpha: 0.3 });
            V.arrow(0, 0, u[0], u[1], { color: c, width: 2.6 });
            V.tex(`e_${k + 1}`, u[0] * 1.25, u[1] * 1.25, { color: c, size: 15 });
            const w = scl(u, lam[k]); if (lam[k] > 0.05) V.dot(w[0], w[1], { color: c, r: 4 });
          });
          V.corner(`T*T e₁ = ${pf(lam[0])} e₁,  T*T e₂ = ${pf(lam[1])} e₂`, 'bl', { color: 'muted', size: 11.5 });
          // W: image ellipse with semi-axes s_k f_k
          W.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          W.path(ellPts(T), { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.8 });
          f.forEach((u, k) => {
            const c = k ? 'purple' : 'blue', w = scl(u, s[k]);
            if (s[k] < 1e-6) return;
            W.arrow(0, 0, w[0], w[1], { color: c, width: 2.8 });
            const n = perp(u), side = n[1] < 0 ? -1 : 1, lp = add(scl(u, s[k] * 0.55), scl(n, 0.3 * side * (k ? -1 : 1)));
            W.tex(`s_${k + 1} = ${tn(s[k])}`, lp[0], lp[1], { color: c, size: 14 });
          });
          // number lines
          const ev = v.M.eig2(T), absEv = ev.map(([re, im]) => Math.hypot(re, im)).sort((x, y) => y - x);
          const xmax = Math.max(3, 1.12 * Math.max(lam[0], s[0], ...absEv));
          N.setView([-0.08 * xmax, xmax], [0, 3]);
          const rows = [[2.45, 'eigenvalues of T*T', lam, 'purple'], [1.5, 'singular values', s, 'green'], [0.55, '|eigenvalues of T|', absEv, 'orange']];
          for (const [y, lab, vals, c] of rows) {
            N.line(0, y, xmax * 0.98, y, { color: 'faint', width: 1 });
            for (let tk = 0; tk <= Math.floor(xmax); tk++) N.text(String(tk), tk, y - 0.28, { size: 9.5, color: 'faint', align: 'center' });
            N.text(lab, xmax * 0.985, y + 0.3, { size: 11.5, color: c, align: 'right', weight: 600 });
            vals.forEach((x, k) => { const dup = k === 1 && Math.abs(vals[1] - vals[0]) < 1e-6; N.dot(x, y, { color: c, r: dup ? 8 : 5.5, hollow: dup }); });
          }
          N.text(eq ? 's₁ = s₂: one eigenspace of dimension 2, listed twice' : '', 0, 2.92, { size: 11, color: 'muted' });
          st = { T, TtT, lam, s, absEv, ev, eq };
        });
        v.legend([['blue', '$e_1$ and $s_1 f_1 = Te_1$'], ['purple', '$e_2$ and $s_2 f_2 = Te_2$'], ['accent', '$T(\\text{unit circle})$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, TtT, lam, s, ev } = st;
          const evT = ev.map(([re, im]) => (Math.abs(im) < 1e-9 ? tn(re) : `${tn(re)} ${im > 0 ? '+' : '-'} ${tn(Math.abs(im))}i`)).join(',\\ ');
          return `$T = ${mtex(T)}$, $T^*T = ${mtex(TtT)}$ with eigenvalues $${tn(lam[0])}, ${tn(lam[1])}$, so the singular values are $s_1 = ${tn(s[0])}$, $s_2 = ${tn(s[1])}$ — the semi-axes of $T(\\text{circle})$. Eigenvalues of $T$: $${evT}$.`;
        });
      },
    },
  ],
};
